'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Plus, Minus, Crosshair } from 'lucide-react';
import {
  loadGoogleMaps,
  MapUnitData,
  getBestRoadRoute,
  generateTacticalPath,
} from '@/components/SimapresGoogleMap';

export interface SimapresMapPawasProps {
  userProfile?: any;
  policeOffices?: any[];
  fleetUnits?: any[];
  hotspots?: any[];
  targetComplaint?: any | null;
  showTraffic?: boolean;
  focusedUnitKey?: string | null;
  onSelectUnit?: (unit: any) => void;
  onUnitClick?: (unit: any) => void;
  controlsRightOffset?: string | number;
  height?: string;
}

function escapeXml(unsafe: string): string {
  return (unsafe || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export default function SimapresMapPawas({
  userProfile,
  policeOffices = [],
  fleetUnits = [],
  hotspots = [],
  targetComplaint = null,
  showTraffic = false,
  focusedUnitKey = null,
  onSelectUnit,
  onUnitClick,
  controlsRightOffset,
  height = '100%',
}: SimapresMapPawasProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const trafficLayerRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const patrolPolylinesRef = useRef<any[]>([]);
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);

  // Deteksi mobile & tablet (<= 1024px) untuk elevasi tombol kontrol di atas bottom-nav
  useEffect(() => {
    const checkViewport = () => {
      if (typeof window !== 'undefined') {
        setIsMobileOrTablet(window.innerWidth <= 1024);
      }
    };
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  // 1. Tentukan Mako resmi dari pengguna Pawas yang sedang login
  const userMako = useMemo(() => {
    const defaultMako = {
      name: 'Polres Pekalongan (Mako Utama)',
      lat: -7.026803,
      lng: 109.592982,
    };

    if (!policeOffices || policeOffices.length === 0) return defaultMako;

    // Cari station yang cocok dengan profil pengguna
    const userStationId = userProfile?.station_id || userProfile?.stationId;
    const userUnitName = (userProfile?.satuanNama || userProfile?.unit || '').toLowerCase();

    if (userStationId) {
      const matchById = policeOffices.find(
        (o) => String(o.id) === String(userStationId) && o.lat && o.lng
      );
      if (matchById) {
        return {
          name: matchById.name || matchById.namaKantor || defaultMako.name,
          lat: Number(matchById.lat),
          lng: Number(matchById.lng),
        };
      }
    }

    if (userUnitName) {
      const matchByName = policeOffices.find((o) => {
        const oName = (o.name || o.namaKantor || '').toLowerCase();
        return oName.includes(userUnitName) || userUnitName.includes(oName);
      });
      if (matchByName && matchByName.lat && matchByName.lng) {
        return {
          name: matchByName.name || matchByName.namaKantor || defaultMako.name,
          lat: Number(matchByName.lat),
          lng: Number(matchByName.lng),
        };
      }
    }

    // Default ke Mako pertama di database
    const firstOffice = policeOffices[0];
    if (firstOffice?.lat && firstOffice?.lng) {
      return {
        name: firstOffice.name || firstOffice.namaKantor || defaultMako.name,
        lat: Number(firstOffice.lat),
        lng: Number(firstOffice.lng),
      };
    }

    return defaultMako;
  }, [userProfile, policeOffices]);

  // SVG Badge Icon Generator
  const makeHaloBadgeIcon = (emoji: string, strokeColor: string, haloColor: string) => {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="52" height="52" viewBox="0 0 52 52">
        <circle cx="26" cy="26" r="23" fill="${haloColor}" fill-opacity="0.32" stroke="${strokeColor}" stroke-width="1.5" stroke-dasharray="4,2"/>
        <circle cx="26" cy="26" r="16.5" fill="#FFFFFF" stroke="${strokeColor}" stroke-width="2.5"/>
        <text x="26" y="32" font-size="18" text-anchor="middle" font-family="'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif">${emoji}</text>
      </svg>
    `;
    return {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
      scaledSize: (window as any).google?.maps?.Size ? new (window as any).google.maps.Size(52, 52) : undefined,
      anchor: (window as any).google?.maps?.Point ? new (window as any).google.maps.Point(26, 26) : undefined,
    };
  };

  // Tactical Unit Icon dengan Floating Tag
  const makeTacticalUnitIcon = (
    emoji: string,
    strokeColor: string,
    haloColor: string,
    labelTitle: string = '',
    labelSubtitle: string = '',
    isFocused: boolean = false
  ) => {
    if (!labelTitle) {
      return makeHaloBadgeIcon(emoji, strokeColor, haloColor);
    }

    const safeTitle = escapeXml(labelTitle.length > 22 ? labelTitle.slice(0, 21) + '…' : labelTitle);
    const safeSub = escapeXml(labelSubtitle.length > 26 ? labelSubtitle.slice(0, 25) + '…' : labelSubtitle);

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="220" height="54" viewBox="0 0 220 54">
        <rect x="42" y="8" width="172" height="38" rx="8" fill="${isFocused ? '#0F172A' : '#0B132B'}" fill-opacity="0.94" stroke="${isFocused ? '#38BDF8' : strokeColor}" stroke-width="${isFocused ? '2.5' : '1.5'}"/>
        <text x="52" y="24" font-size="11" font-weight="800" fill="#FFFFFF" font-family="system-ui, -apple-system, sans-serif">${safeTitle}</text>
        <circle cx="56" cy="35" r="3" fill="${strokeColor}" />
        <text x="63" y="38" font-size="9" font-weight="700" fill="${isFocused ? '#38BDF8' : strokeColor}" font-family="system-ui, -apple-system, sans-serif">${safeSub}</text>
        <circle cx="24" cy="27" r="21" fill="${haloColor}" fill-opacity="${isFocused ? '0.55' : '0.28'}" stroke="${strokeColor}" stroke-width="${isFocused ? '2.5' : '1.5'}" stroke-dasharray="4,2"/>
        <circle cx="24" cy="27" r="14.5" fill="#FFFFFF" stroke="${strokeColor}" stroke-width="2"/>
        <text x="24" y="33" font-size="16" text-anchor="middle" font-family="'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif">${emoji}</text>
      </svg>
    `;

    return {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
      scaledSize: (window as any).google?.maps?.Size ? new (window as any).google.maps.Size(220, 54) : undefined,
      anchor: (window as any).google?.maps?.Point ? new (window as any).google.maps.Point(24, 27) : undefined,
    };
  };

  const infoWindowRef = useRef<any>(null);

  const openMarkerDetailWindow = (marker: any, data: {
    title: string;
    subTitle?: string;
    petugas?: string;
    badgeText?: string;
    badgeColor?: string;
    address?: string;
    activity?: string;
    status?: string;
    lat: number;
    lng: number;
    icon?: string;
    hasScannedQr?: boolean;
    callsign?: string;
    etaText?: string;
  }) => {
    if (!mapInstanceRef.current || !(window as any).google?.maps) return;
    const maps = (window as any).google.maps;

    if (!infoWindowRef.current) {
      infoWindowRef.current = new maps.InfoWindow({
        disableAutoPan: false,
      });
    }

    const container = document.createElement('div');
    container.style.cssText = `
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      width: 320px;
      max-width: 82vw;
      background: rgba(15, 23, 42, 0.98);
      color: #FFFFFF;
      border-radius: 14px;
      padding: 14px 16px;
      box-sizing: border-box;
    `;

    const qrBadgeHtml = data.hasScannedQr
      ? `<span style="font-size: 10px; font-weight: 800; color: #34D399; background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); padding: 2px 7px; border-radius: 5px;">✓ QR Valid</span>`
      : `<span style="font-size: 10px; font-weight: 800; color: #FBBF24; background: rgba(245,158,11,0.15); border: 1px solid rgba(245,158,11,0.3); padding: 2px 7px; border-radius: 5px; display: inline-flex; align-items: center; gap: 3px;">⚠️ Belum Scan QR</span>`;

    const showPetugas = data.petugas && data.petugas !== data.title && data.petugas !== '-';

    container.innerHTML = `
      <!-- Header -->
      <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; margin-bottom: 6px; padding-right: 28px;">
        <div style="display: flex; align-items: center; gap: 8px; min-width: 0;">
          <span style="font-size: 18px; flex-shrink: 0;">${data.icon || '🛡️'}</span>
          <div style="min-width: 0;">
            <div style="font-size: 13.5px; font-weight: 900; color: #38BDF8; line-height: 1.25; word-break: break-word;">
              ${escapeXml(data.title)}
            </div>
          </div>
        </div>
      </div>

      ${showPetugas ? `
        <div style="font-size: 13px; font-weight: 800; color: #FFFFFF; line-height: 1.3; padding-right: 28px;">
          ${escapeXml(data.petugas!)}
        </div>
      ` : ''}
      <div style="font-size: 11px; color: #94A3B8; margin-top: 2px; line-height: 1.35; padding-right: 28px;">
        ${escapeXml(data.subTitle || data.address || 'Wilayah Hukum Polres Pekalongan')}
      </div>

      <div style="border-top: 1px solid rgba(255,255,255,0.12); margin: 8px 0;"></div>

      <!-- Status Kedinasan -->
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
        <span style="font-size: 11px; color: #94A3B8; font-weight: 600;">Status Kedinasan:</span>
        <div style="display: flex; gap: 6px; align-items: center;">
          <span style="font-size: 10px; font-weight: 800; padding: 2.5px 8px; border-radius: 5px; background: ${data.badgeColor ? data.badgeColor + '25' : 'rgba(16,185,129,0.2)'}; color: ${data.badgeColor || '#34D399'}; border: 1px solid ${data.badgeColor || '#10B981'};">
            ${escapeXml(data.badgeText || data.status || 'MAKO AKTIF')}
          </span>
          ${qrBadgeHtml}
        </div>
      </div>

      <!-- Estimasi Rute Google Directions jika Tanggap Darurat / Meluncur -->
      ${data.etaText ? `
        <div style="font-size: 11.5px; background: rgba(239, 68, 68, 0.16); padding: 7px 9px; border-radius: 6px; margin-bottom: 7px; border: 1px solid rgba(239, 68, 68, 0.35);">
          <div style="font-size: 9.5px; color: #FCA5A5; font-weight: 800; display: flex; align-items: center; gap: 4px; margin-bottom: 2px;">
            <span>🧭</span>
            <span>RUTE GOOGLE DIRECTIONS (KE TKP):</span>
          </div>
          <div style="color: #FEF08A; font-weight: 700; font-size: 11px;">
            Jarak &amp; ETA: ${escapeXml(data.etaText)}
          </div>
        </div>
      ` : ''}

      <!-- Sedang Di Mana -->
      <div style="font-size: 11.5px; background: rgba(0,0,0,0.35); padding: 7px 9px; border-radius: 6px; margin-bottom: 6px; border: 1px solid rgba(255,255,255,0.06);">
        <div style="font-size: 9.5px; color: #F59E0B; font-weight: 800; display: flex; align-items: center; gap: 4px; margin-bottom: 2px;">
          <span>📍</span>
          <span>SEDANG DI MANA:</span>
        </div>
        <div style="color: #E2E8F0; font-weight: 600; line-height: 1.35;">
          ${escapeXml(data.address || 'Kabupaten Pekalongan, Jawa Tengah')}
        </div>
      </div>

      <!-- Sedang Melakukan Apa -->
      <div style="font-size: 11.5px; background: rgba(0,0,0,0.35); padding: 7px 9px; border-radius: 6px; margin-bottom: 8px; border: 1px solid rgba(255,255,255,0.06);">
        <div style="font-size: 9.5px; color: #34D399; font-weight: 800; display: flex; align-items: center; gap: 4px; margin-bottom: 2px;">
          <span>🎯</span>
          <span>SEDANG MELAKUKAN APA:</span>
        </div>
        <div style="color: #E2E8F0; font-weight: 600;">
          ${escapeXml(data.activity || 'Pusat Komando & Pengendalian Operasi')}
        </div>
      </div>

      <!-- Koordinat -->
      <div style="font-size: 10px; color: #94A3B8; margin-bottom: 10px; font-family: monospace;">
        🌐 Koordinat: ${data.lat.toFixed(5)}, ${data.lng.toFixed(5)}
      </div>

      <!-- Action Buttons -->
      <div style="display: flex; gap: 6px;">
        <button type="button" id="btn-pan-marker" style="flex: 1; text-align: center; background: linear-gradient(135deg, #0284C7 0%, #0369A1 100%); color: #FFFFFF; font-size: 11px; font-weight: 800; padding: 7px 8px; border-radius: 6px; border: none; cursor: pointer;">
          🎯 Pusatkan Peta
        </button>
        <button type="button" id="btn-ht-marker" style="flex: 1; text-align: center; background: rgba(255,255,255,0.08); color: #38BDF8; border: 1px solid rgba(56,189,248,0.3); font-size: 11px; font-weight: 800; padding: 7px 8px; border-radius: 6px; cursor: pointer;">
          📻 Hubungi HT
        </button>
        <a href="https://www.google.com/maps/dir/?api=1&destination=${data.lat},${data.lng}" target="_blank" rel="noopener noreferrer" style="text-align: center; background: rgba(16,185,129,0.15); color: #34D399; border: 1px solid rgba(16,185,129,0.35); font-size: 11px; font-weight: 800; padding: 7px 10px; border-radius: 6px; text-decoration: none; display: inline-flex; align-items: center; justify-content: center;" title="Navigasi Google Maps">
          🗺️
        </a>
      </div>
    `;

    const btnPan = container.querySelector('#btn-pan-marker');
    if (btnPan) {
      btnPan.addEventListener('click', () => {
        mapInstanceRef.current?.panTo({ lat: data.lat, lng: data.lng });
        mapInstanceRef.current?.setZoom(16);
      });
    }

    const btnHt = container.querySelector('#btn-ht-marker');
    if (btnHt) {
      btnHt.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('pawas:call-ht', { detail: data }));
        if (typeof window !== 'undefined' && (window as any).showFriendlyToast) {
          (window as any).showFriendlyToast('success', 'Panggilan Radio HT', `Menghubungi frekuensi HT SIMOPMAS 110: ${data.petugas || data.title}...`);
        }
      });
    }

    infoWindowRef.current.setContent(container);
    infoWindowRef.current.open(mapInstanceRef.current, marker);
  };

  const handleUnitClick = (unit: any) => {
    if (onSelectUnit) onSelectUnit(unit);
    if (onUnitClick) onUnitClick(unit);
  };

  // Inisialisasi Google Map khusus Pawas
  useEffect(() => {
    let isSubscribed = true;

    loadGoogleMaps().then((maps) => {
      if (!isSubscribed || !maps || !mapContainerRef.current) return;

      // Center WAJIB dimulai dari Mako pengguna yang login, BUKAN titik kejadian!
      const initialCenter = {
        lat: userMako.lat,
        lng: userMako.lng,
      };

      const mapOptions = {
        zoom: 14,
        center: initialCenter,
        disableDefaultUI: true,
        mapTypeId: 'roadmap',
        gestureHandling: 'greedy',
        styles: [
          { featureType: 'poi', stylers: [{ visibility: 'off' }] },
          { featureType: 'transit', stylers: [{ visibility: 'off' }] },
        ],
      };

      try {
        const map = new maps.Map(mapContainerRef.current, mapOptions);
        mapInstanceRef.current = map;

        // Tutup InfoWindow saat klik di area peta kosong
        map.addListener('click', () => {
          infoWindowRef.current?.close();
        });

        setTimeout(() => {
          if (maps.event && mapInstanceRef.current) {
            maps.event.trigger(mapInstanceRef.current, 'resize');
          }
        }, 200);

        // Realtime Google Traffic Layer
        if (typeof maps.TrafficLayer === 'function') {
          const trafficLayer = new maps.TrafficLayer();
          trafficLayerRef.current = trafficLayer;
          if (showTraffic) {
            trafficLayer.setMap(map);
          }
        }

        // Auto-dismiss development notice
        const dismissTimer = setInterval(() => {
          document.querySelectorAll('.dismissButton').forEach((b: any) => b.click());
          document.querySelectorAll('.gm-err-container, .gm-err-content').forEach((el: any) => {
            const dialog = el.closest('[role="dialog"]') || el.parentElement;
            if (dialog) dialog.style.display = 'none';
          });
        }, 350);

        const clearTimer = setTimeout(() => clearInterval(dismissTimer), 8000);

        renderMarkers(map, maps);

        return () => {
          clearInterval(dismissTimer);
          clearTimeout(clearTimer);
        };
      } catch (err) {
        console.warn('Error constructing Google Map for Pawas:', err);
      }
    });

    return () => {
      isSubscribed = false;
      if (infoWindowRef.current) {
        try { infoWindowRef.current.close(); } catch (_) {}
        infoWindowRef.current = null;
      }
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
      patrolPolylinesRef.current.forEach((p) => {
        try { p.setMap(null); } catch (_) {}
      });
      patrolPolylinesRef.current = [];
    };
  }, []);

  // Sync Traffic Layer toggle
  useEffect(() => {
    if (trafficLayerRef.current && mapInstanceRef.current) {
      if (showTraffic) {
        trafficLayerRef.current.setMap(mapInstanceRef.current);
      } else {
        trafficLayerRef.current.setMap(null);
      }
    }
  }, [showTraffic]);

  // Render Markers
  const renderMarkers = (map: any, maps: any) => {
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    patrolPolylinesRef.current.forEach((p) => {
      try { p.setMap(null); } catch (_) {}
    });
    patrolPolylinesRef.current = [];

    // 1. Kantor Polisi / Mako Pengguna (Marker Mako Utama)
    (policeOffices || []).forEach((office) => {
      const officePos = { lat: Number(office.lat), lng: Number(office.lng) };
      if (!officePos.lat || !officePos.lng) return;

      const isUserHQ =
        Math.abs(officePos.lat - userMako.lat) < 0.0001 &&
        Math.abs(officePos.lng - userMako.lng) < 0.0001;

      const makoIcon = makeHaloBadgeIcon(
        isUserHQ ? '⭐' : '🏢',
        isUserHQ ? '#B45309' : '#1E3A8A',
        isUserHQ ? '#FCD34D' : '#93C5FD'
      );

      const makoMarker = new maps.Marker({
        position: officePos,
        map,
        icon: makoIcon,
        title: office.name || office.namaKantor,
        zIndex: isUserHQ ? 850 : 800,
      });

      const officeUnitData: MapUnitData = {
        key: `office_${office.id}`,
        pos: officePos,
        iconEmoji: isUserHQ ? '⭐' : '🏢',
        title: office.name || office.namaKantor,
        petugas: isUserHQ ? 'Mako Kedinasan Pengawas' : (office.petugas && office.petugas !== '-' ? office.petugas : office.name),
        sub: office.address,
        status: isUserHQ ? 'MAKO AKTIF' : (office.type || office.status || 'MAKO AKTIF'),
        statusColor: isUserHQ ? '#B45309' : '#1E3A8A',
        tugas: office.tugas || 'Pusat Komando & Pengendalian Operasi',
        telemetri: `Koordinat: ${officePos.lat.toFixed(5)}, ${officePos.lng.toFixed(5)}`,
      };

      (makoMarker as any).unitKey = officeUnitData.key;

      makoMarker.addListener('click', () => {
        handleUnitClick(officeUnitData);
        openMarkerDetailWindow(makoMarker, {
          title: office.name || office.namaKantor,
          subTitle: office.address || 'Kantor Polisi & Mako Kedinasan',
          petugas: isUserHQ ? 'Mako Kedinasan Pengawas' : (office.petugas && office.petugas !== '-' ? office.petugas : office.name),
          badgeText: isUserHQ ? 'MAKO AKTIF' : (office.type || office.status || 'MAKO AKTIF'),
          badgeColor: isUserHQ ? '#B45309' : '#1E3A8A',
          address: office.address || 'Kabupaten Pekalongan, Jawa Tengah',
          activity: office.tugas || 'Pusat Komando & Pengendalian Operasi',
          status: isUserHQ ? 'MAKO AKTIF' : (office.status || 'MAKO AKTIF'),
          lat: officePos.lat,
          lng: officePos.lng,
          icon: isUserHQ ? '⭐' : '🏢',
          hasScannedQr: false,
        });
      });
      markersRef.current.push(makoMarker);
    });

    // 2. Armada & Personel Piket Lapangan (Pawas Fleet Supervision)
    (fleetUnits || []).forEach((unit) => {
      const pos = unit.pos || { lat: Number(unit.lat), lng: Number(unit.lng) };
      if (!pos || !pos.lat || !pos.lng) return;

      const isFocused = focusedUnitKey === unit.key;
      let strokeColor = unit.statusColor || '#0284C7';
      let haloColor = '#38BDF8';

      if (unit.status === 'DARURAT') {
        strokeColor = '#EF4444';
        haloColor = '#F87171';
      } else if (unit.status === 'PATROLI') {
        strokeColor = '#10B981';
        haloColor = '#34D399';
      } else if (unit.status === 'SIAGA') {
        strokeColor = '#2563EB';
        haloColor = '#93C5FD';
      }

      const shortName = unit.namaLengkap || unit.title || unit.petugas;
      const statusBadgeStr = unit.statusLabel || (unit.status === 'PATROLI' ? 'Patroli' : unit.status);
      const subSector = unit.lokasiTeks || unit.sub || '';
      const shortSub = `${statusBadgeStr} • ${subSector}`;

      const icon = makeTacticalUnitIcon(
        unit.iconEmoji || '👮',
        strokeColor,
        haloColor,
        shortName,
        shortSub,
        isFocused
      );

      const marker = new maps.Marker({
        position: pos,
        map,
        icon,
        title: `${unit.title} - ${unit.status}`,
        zIndex: isFocused ? 1200 : 900,
      });

      (marker as any).unitKey = unit.key;

      marker.addListener('click', () => {
        handleUnitClick(unit);
        openMarkerDetailWindow(marker, {
          title: shortName || 'Petugas Patroli',
          subTitle: `${unit.pangkat ? unit.pangkat + ' • ' : ''}NRP ${unit.nrp || '-'}${unit.satuan ? ' • ' + unit.satuan : ''}`,
          petugas: unit.namaLengkap || unit.title || unit.petugas,
          badgeText: unit.statusLabel || unit.status || 'PATROLI',
          badgeColor: strokeColor,
          address: unit.lokasiTeks || unit.sub || 'Area Patroli Wilayah',
          activity: unit.aktivitas || unit.tugas || 'Patroli Keamanan & Ketertiban',
          status: unit.status || 'AKTIF',
          lat: pos.lat,
          lng: pos.lng,
          icon: unit.iconEmoji || '👮',
          hasScannedQr: Boolean(unit.hasScannedQr),
          etaText: unit.etaText,
        });
      });
      markersRef.current.push(marker);

      // Jalur Patroli & Navigasi Rute Jalan Raya (Google Directions Service)
      // Tampil otomatis saat personel Meluncur ke TKP (DARURAT) atau saat unit difokuskan oleh Pawas
      const isEmergencyDispatch = unit.status === 'DARURAT';
      const shouldDrawRoute = (isEmergencyDispatch || isFocused) && unit.routePoints && unit.routePoints.length >= 2;

      if (shouldDrawRoute) {
        const originPos = unit.routePoints[0];
        const destPos = unit.routePoints[1];

        if (originPos && destPos && originPos.lat && destPos.lat) {
          // Arrow icons taktis penunjuk arah laju menuju TKP
          const routeArrowIcons = maps.SymbolPath?.FORWARD_CLOSED_ARROW ? [{
            icon: {
              path: maps.SymbolPath.FORWARD_CLOSED_ARROW,
              scale: isFocused ? 2.6 : 2.0,
              strokeColor: isEmergencyDispatch ? '#7F1D1D' : '#065F46',
              fillColor: isEmergencyDispatch ? '#FBBF24' : strokeColor,
              fillOpacity: 1,
            },
            offset: '40px',
            repeat: '100px',
          }] : undefined;

          // Render instant curve (mencegah garis lurus memotong gedung sebelum Google Directions siap)
          const initialTactical = unit.routePoints.length === 2
            ? generateTacticalPath(originPos.lat, originPos.lng, destPos.lat, destPos.lng)
            : unit.routePoints;

          const poly = new maps.Polyline({
            path: initialTactical,
            strokeColor: isEmergencyDispatch ? '#EF4444' : strokeColor,
            strokeOpacity: isFocused ? 0.95 : 0.85,
            strokeWeight: isFocused ? 6 : (isEmergencyDispatch ? 5 : 4),
            zIndex: isFocused ? 1150 : (isEmergencyDispatch ? 950 : 750),
            icons: routeArrowIcons,
            map,
          });
          patrolPolylinesRef.current.push(poly);

          // Ambil rute jalan raya resmi dari Google Maps DirectionsService
          if (unit.routePoints.length === 2) {
            getBestRoadRoute(maps, originPos, destPos).then((roadRoute) => {
              if (roadRoute && roadRoute.path && roadRoute.path.length >= 2 && mapInstanceRef.current) {
                poly.setPath(roadRoute.path);

                if (roadRoute.distanceText && roadRoute.durationText) {
                  unit.etaText = `${roadRoute.distanceText} • ${roadRoute.durationText}`;
                }
              }
            }).catch((err) => {
              console.warn('Google Directions notice for unit:', unit.title, err);
            });
          }
        }
      }
    });

    // 3. Hotspots / Titik Rawan (GIS)
    (hotspots || []).forEach((h: any) => {
      const hotspotPos = h.pos || { lat: Number(h.lat), lng: Number(h.lng) };
      if (!hotspotPos || !hotspotPos.lat || !hotspotPos.lng) return;

      const icon = makeHaloBadgeIcon('🔴', '#DC2626', '#F87171');
      const marker = new maps.Marker({
        position: hotspotPos,
        map,
        icon,
        title: h.title,
        zIndex: 950,
      });

      const hotspotUnitData: MapUnitData = {
        key: h.key || (h.id ? `hotspot_${h.id}` : 'hotspot'),
        pos: hotspotPos,
        iconEmoji: '🔴',
        title: h.title,
        petugas: h.category || 'Titik Rawan Kriminalitas',
        sub: h.description || h.address || 'Pantauan Khusus Pawas',
        status: 'TITIK RAWAN',
        statusColor: '#DC2626',
        tugas: 'Area Prioritas Patroli Presisi',
        telemetri: `Radius: ${h.radiusMeters || 200}m`,
      };

      (marker as any).unitKey = hotspotUnitData.key;

      marker.addListener('click', () => {
        handleUnitClick(hotspotUnitData);
        openMarkerDetailWindow(marker, {
          title: h.title || 'Titik Rawan Kriminalitas',
          subTitle: h.category || h.kategori || 'Area Pantauan Khusus Pawas',
          petugas: h.wilayahPolsek || 'Wilayah Hukum Polres Pekalongan',
          badgeText: h.statusBahaya || 'RAWAN',
          badgeColor: '#DC2626',
          address: h.address || h.lokasi || 'Jalan Raya Wilayah Pekalongan',
          activity: h.jadwalDisplay || 'Prioritas Patroli Presisi',
          status: 'TITIK RAWAN',
          lat: hotspotPos.lat,
          lng: hotspotPos.lng,
          icon: '⚠️',
          hasScannedQr: true,
        });
      });
      markersRef.current.push(marker);
    });

    // 4. Target Kejadian / TKP Darurat (Tetap ada di peta tapi TIDAK auto-fokus)
    const cLat = targetComplaint?.tkpLat ?? targetComplaint?.lat ?? targetComplaint?.tkp_lat;
    const cLng = targetComplaint?.tkpLng ?? targetComplaint?.lng ?? targetComplaint?.tkp_lng;
    if (targetComplaint && cLat && cLng) {
      const tkpPos = { lat: Number(cLat), lng: Number(cLng) };
      const tkpIcon = makeHaloBadgeIcon('🚨', '#DC2626', '#FEF08A');
      const tkpMarker = new maps.Marker({
        position: tkpPos,
        map,
        icon: tkpIcon,
        title: `TKP: ${targetComplaint.nomorTiket || ''} • ${targetComplaint.jenisKejadian || 'Kejadian Lapangan'}`,
        zIndex: 1100,
      });

      const tkpUnitData: MapUnitData = {
        key: `tkp_${targetComplaint.id || 'current'}`,
        pos: tkpPos,
        iconEmoji: '🚨',
        title: `TKP: ${targetComplaint.jenisKejadian || 'Darurat 110'}`,
        petugas: `Nomor Tiket: ${targetComplaint.nomorTiket || '-'}`,
        sub: targetComplaint.tkpAlamatTeks || 'Lokasi Kejadian',
        status: targetComplaint.status || 'DIPROSES',
        statusColor: '#DC2626',
        tugas: 'Target Penanganan Personel',
        telemetri: `Koordinat: ${tkpPos.lat.toFixed(5)}, ${tkpPos.lng.toFixed(5)}`,
      };

      (tkpMarker as any).unitKey = tkpUnitData.key;

      tkpMarker.addListener('click', () => {
        handleUnitClick(tkpUnitData);
        openMarkerDetailWindow(tkpMarker, {
          title: `Tiket ${targetComplaint.nomorTiket || ''}`,
          subTitle: targetComplaint.jenisKejadian || 'Darurat 110',
          petugas: `Pelapor: ${targetComplaint.pelaporNama || 'Warga'}`,
          badgeText: targetComplaint.status || 'DIPROSES',
          badgeColor: '#DC2626',
          address: targetComplaint.tkpAlamatTeks || 'Lokasi Kejadian',
          activity: 'Target Penanganan Personel Presisi',
          status: 'TKP LAPORAN',
          lat: tkpPos.lat,
          lng: tkpPos.lng,
          icon: '🚨',
          hasScannedQr: false,
        });
      });
      markersRef.current.push(tkpMarker);
    }
  };

  useEffect(() => {
    if (mapInstanceRef.current && (window as any).google?.maps) {
      const maps = (window as any).google.maps;
      renderMarkers(mapInstanceRef.current, maps);
    }
  }, [focusedUnitKey, hotspots, policeOffices, fleetUnits, targetComplaint]);

  // Fokus ke unit yang dipilih dan tampilkan detail langsung di atas icon
  useEffect(() => {
    if (!focusedUnitKey || !mapInstanceRef.current) return;
    const matched = fleetUnits.find((u) => u.key === focusedUnitKey);
    if (matched) {
      const pos = matched.pos || { lat: Number(matched.lat), lng: Number(matched.lng) };
      if (pos.lat && pos.lng) {
        mapInstanceRef.current.panTo(pos);
        mapInstanceRef.current.setZoom(16);
        const marker = markersRef.current.find((m: any) => m.unitKey === focusedUnitKey);
        if (marker && (window as any).google?.maps?.event) {
          (window as any).google.maps.event.trigger(marker, 'click');
        }
      }
    }
  }, [focusedUnitKey, fleetUnits]);

  // Tombol Kontrol Peta
  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setZoom(mapInstanceRef.current.getZoom() + 1);
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setZoom(mapInstanceRef.current.getZoom() - 1);
    }
  };

  // Tombol 🎯 : Selalu memusatkan kamera kembali ke Mako pengguna yang login!
  const handleCenterMako = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo({ lat: userMako.lat, lng: userMako.lng });
      mapInstanceRef.current.setZoom(15);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height, overflow: 'hidden' }}>
      <div
        ref={mapContainerRef}
        style={{
          width: '100%',
          height: '100%',
          background: '#E2E8F0',
        }}
      />

      {/* Floating Map Controls Pawas */}
      {/* Secara otomatis diposisikan di atas floating bottom-nav saat di mobile & tablet (96px dari bawah) */}
      <div
        id="pawas-map-controls"
        className="floating-map-controls"
        style={{
          position: 'absolute',
          zIndex: 30,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          bottom: isMobileOrTablet ? '80px' : '24px',
          right: controlsRightOffset ?? (isMobileOrTablet ? '16px' : '20px'),
          transition: 'right 0.3s cubic-bezier(0.4, 0, 0.2, 1), bottom 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Zoom In */}
        <button
          type="button"
          onClick={handleZoomIn}
          title="Perbesar Peta (+)"
          style={{
            width: '40px',
            height: '40px',
            background: '#FFFFFF',
            color: '#1E293B',
            border: '1px solid #CBD5E1',
            borderRadius: '10px',
            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.12)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
          }}
        >
          <Plus size={19} strokeWidth={2.4} color="#1E293B" />
        </button>

        {/* Zoom Out */}
        <button
          type="button"
          onClick={handleZoomOut}
          title="Perkecil Peta (−)"
          style={{
            width: '40px',
            height: '40px',
            background: '#FFFFFF',
            color: '#1E293B',
            border: '1px solid #CBD5E1',
            borderRadius: '10px',
            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.12)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
          }}
        >
          <Minus size={19} strokeWidth={2.4} color="#1E293B" />
        </button>

        {/* Mako Center */}
        <button
          type="button"
          onClick={handleCenterMako}
          title={`Pusatkan ke Mako (${userMako.name})`}
          style={{
            width: '40px',
            height: '40px',
            background: '#FFFFFF',
            color: '#0284C7',
            border: '1px solid #CBD5E1',
            borderRadius: '10px',
            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.12)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
          }}
        >
          <Crosshair size={20} strokeWidth={2.2} color="#0284C7" />
        </button>
      </div>
    </div>
  );
}
