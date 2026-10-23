'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Plus, Minus, Crosshair } from 'lucide-react';
import { loadGoogleMaps, MapUnitData } from '@/components/SimapresGoogleMap';

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
        petugas: isUserHQ ? 'Mako Kedinasan Pengawas' : office.petugas,
        sub: office.address,
        status: isUserHQ ? 'MAKO AKTIF' : office.status,
        statusColor: isUserHQ ? '#B45309' : '#1E3A8A',
        tugas: 'Pusat Komando & Pengendalian Operasi',
        telemetri: `Koordinat: ${officePos.lat.toFixed(5)}, ${officePos.lng.toFixed(5)}`,
      };

      makoMarker.addListener('click', () => {
        handleUnitClick(officeUnitData);
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

      marker.addListener('click', () => {
        handleUnitClick(unit);
      });
      markersRef.current.push(marker);

      // Jalur Patroli
      if (isFocused && unit.routePoints && unit.routePoints.length >= 2) {
        const poly = new maps.Polyline({
          path: unit.routePoints,
          strokeColor: strokeColor,
          strokeOpacity: 0.95,
          strokeWeight: 5,
          map,
        });
        patrolPolylinesRef.current.push(poly);
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

      marker.addListener('click', () => {
        handleUnitClick(hotspotUnitData);
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

      tkpMarker.addListener('click', () => {
        handleUnitClick(tkpUnitData);
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

  // Fokus ke unit yang dipilih
  useEffect(() => {
    if (!focusedUnitKey || !mapInstanceRef.current) return;
    const matched = fleetUnits.find((u) => u.key === focusedUnitKey);
    if (matched) {
      const pos = matched.pos || { lat: Number(matched.lat), lng: Number(matched.lng) };
      if (pos.lat && pos.lng) {
        mapInstanceRef.current.panTo(pos);
        mapInstanceRef.current.setZoom(16);
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
