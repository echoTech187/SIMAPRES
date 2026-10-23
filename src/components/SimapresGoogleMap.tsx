'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Plus, Minus, LocateFixed, AlertTriangle, Maximize2 } from 'lucide-react';

export interface MapUnitData {
  key?: string;
  nrp?: string;
  callsign?: string;
  officerId?: string;
  pos?: { lat: number; lng: number };
  lat?: number;
  lng?: number;
  iconEmoji?: string;
  title?: string;
  petugas?: string;
  pangkat?: string;
  namaLengkap?: string;
  satuan?: string;
  jabatan?: string;
  sub?: string;
  status?: string;
  statusLabel?: string;
  statusColor?: string;
  tugas?: string;
  aktivitas?: string;
  lokasiTeks?: string;
  telemetri?: string;
  speedKmh?: number;
  batteryLevel?: number;
  category?: string;
  routePoints?: { lat: number; lng: number }[];
  assignedVehicle?: string | null;
  lastHeartbeat?: string;
}

interface SimapresGoogleMapProps {
  mode?: 'beranda' | 'fullscreen';
  myUnit?: MapUnitData | null;
  policeOffices?: any[];
  fleetUnits?: MapUnitData[];
  hotspots?: any[];
  showTraffic?: boolean;
  showOtherOfficers?: boolean;
  showPatrolRoutes?: boolean;
  focusedUnitKey?: string | null;
  activeFilter?: 'all' | 'samapta' | 'perintis' | 'lantas' | 'reskrim' | 'intelkam' | 'binmas' | 'pawas' | 'hotspot';
  onSelectUnit?: (unit: MapUnitData) => void;
  onOpenSos?: () => void;
  onOpenCrudRawan?: () => void;
  onToggleTraffic?: (active: boolean) => void;
  onFullscreen?: () => void;
  height?: string;
  interactive?: boolean;
  centerLat?: number;
  centerLng?: number;
  onUnitClick?: (unit: any) => void;
  targetComplaint?: any | null;
  controlsPosition?: 'top-right' | 'bottom-right' | 'bottom-left';
  controlsRightOffset?: string | number;
  controlsBottomOffset?: string | number;
}

// Singleton script loader for Google Maps
let googleMapsPromise: Promise<any> | null = null;
export function loadGoogleMaps(): Promise<any> {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if ((window as any).google?.maps?.Map) {
    return Promise.resolve((window as any).google.maps);
  }

  if (!googleMapsPromise) {
    googleMapsPromise = new Promise((resolve) => {
      const checkReady = async () => {
        const gm = (window as any).google?.maps;
        if (gm) {
          if (typeof gm.Map === 'function') {
            resolve(gm);
            return true;
          }
          if (typeof gm.importLibrary === 'function') {
            try {
              const mapsLib = await gm.importLibrary('maps');
              if (mapsLib?.Map) {
                gm.Map = mapsLib.Map;
                resolve(gm);
                return true;
              }
            } catch (_) {}
          }
        }
        return false;
      };

      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        let attempts = 0;
        const interval = setInterval(async () => {
          attempts++;
          if (await checkReady() || attempts > 50) {
            clearInterval(interval);
            resolve((window as any).google?.maps || null);
          }
        }, 100);
        return;
      }

      const script = document.createElement('script');
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
      const keyParam = apiKey ? `&key=${apiKey}` : '';
      script.src = `https://maps.googleapis.com/maps/api/js?libraries=places,geometry&v=weekly&loading=async${keyParam}`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        let attempts = 0;
        const interval = setInterval(async () => {
          attempts++;
          if (await checkReady() || attempts > 50) {
            clearInterval(interval);
            resolve((window as any).google?.maps || null);
          }
        }, 50);
      };
      script.onerror = () => {
        console.warn('Google Maps failed to load');
        resolve(null);
      };
      document.head.appendChild(script);
    });
  }

  return googleMapsPromise;
}

// In-memory cache for road geometry to prevent repeated network requests
const roadGeometryCache = new Map<string, { lat: number; lng: number }[]>();

// Helper to fetch real road-following coordinates via OSRM GeoJSON
export async function getRealRoadPath(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number
): Promise<{ lat: number; lng: number }[] | null> {
  if (!startLat || !startLng || !endLat || !endLng) return null;
  const cacheKey = `${startLat.toFixed(4)},${startLng.toFixed(4)};${endLat.toFixed(4)},${endLng.toFixed(4)}`;
  if (roadGeometryCache.has(cacheKey)) {
    return roadGeometryCache.get(cacheKey)!;
  }

  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.routes && data.routes.length > 0 && data.routes[0].geometry?.coordinates) {
      const path = data.routes[0].geometry.coordinates.map(([lng, lat]: [number, number]) => ({
        lat,
        lng,
      }));
      roadGeometryCache.set(cacheKey, path);
      return path;
    }
  } catch (err) {
    console.warn('Road routing error:', err);
  }
  return null;
}

export default function SimapresGoogleMap({
  mode = 'beranda',
  myUnit = null,
  policeOffices = [],
  fleetUnits = [],
  hotspots = [],
  showTraffic = true,
  showOtherOfficers = true,
  showPatrolRoutes = true,
  focusedUnitKey = null,
  activeFilter = 'all',
  onSelectUnit,
  onOpenSos,
  onOpenCrudRawan,
  onToggleTraffic,
  onFullscreen,
  height = '350px',
  interactive = true,
  centerLat,
  centerLng,
  onUnitClick,
  targetComplaint = null,
  controlsPosition = 'bottom-right',
  controlsRightOffset,
  controlsBottomOffset,
}: SimapresGoogleMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const trafficLayerRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const patrolPolylinesRef = useRef<any[]>([]);
  const myUnitMarkerRef = useRef<any>(null);
  const directionsRendererRef = useRef<any>(null);
  const lastFittedComplaintIdRef = useRef<string | null>(null);
  const lastRouteFetchedCoordsRef = useRef<{ oLat: number; oLng: number; dLat: number; dLng: number } | null>(null);
  const isFetchingRouteRef = useRef<boolean>(false);

  const handleUnitClick = (unit: any) => {
    if (onSelectUnit) onSelectUnit(unit);
    if (onUnitClick) onUnitClick(unit);
  };

  const escapeXml = (unsafe: string) => {
    return (unsafe || '').replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });
  };

  // SVG Halo Badge Icon Generator matching Prototype/js/personil.js lines 98-111
  const makeHaloBadgeIcon = (emoji: string, strokeColor: string, haloColor: string) => {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="52" height="52" viewBox="0 0 52 52">
        <!-- Outer Pulsing Halo Ring -->
        <circle cx="26" cy="26" r="23" fill="${haloColor}" fill-opacity="0.32" stroke="${strokeColor}" stroke-width="1.5" stroke-dasharray="4,2"/>
        <!-- Inner Solid White Circle -->
        <circle cx="26" cy="26" r="16.5" fill="#FFFFFF" stroke="${strokeColor}" stroke-width="2.5"/>
        <!-- Centered Emoji/Icon -->
        <text x="26" y="32" font-size="18" text-anchor="middle" font-family="'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif">${emoji}</text>
      </svg>
    `;
    return {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
      scaledSize: (window as any).google?.maps?.Size ? new (window as any).google.maps.Size(52, 52) : undefined,
      anchor: (window as any).google?.maps?.Point ? new (window as any).google.maps.Point(26, 26) : undefined,
    };
  };

  // Tactical Unit Icon dengan Floating Pill Tag (Pawas Tactical Command Map)
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
        <!-- Floating Pill Tag Background -->
        <rect x="42" y="8" width="172" height="38" rx="8" fill="${isFocused ? '#0F172A' : '#0B132B'}" fill-opacity="0.94" stroke="${isFocused ? '#38BDF8' : strokeColor}" stroke-width="${isFocused ? '2.5' : '1.5'}"/>
        <!-- Title / Officer Name -->
        <text x="52" y="24" font-size="11" font-weight="800" fill="#FFFFFF" font-family="system-ui, -apple-system, sans-serif">${safeTitle}</text>
        <!-- Status / Location Dot & Text -->
        <circle cx="56" cy="35" r="3" fill="${strokeColor}" />
        <text x="63" y="38" font-size="9" font-weight="700" fill="${isFocused ? '#38BDF8' : strokeColor}" font-family="system-ui, -apple-system, sans-serif">${safeSub}</text>
        <!-- Outer Pulsing Halo Ring -->
        <circle cx="24" cy="27" r="21" fill="${haloColor}" fill-opacity="${isFocused ? '0.55' : '0.28'}" stroke="${strokeColor}" stroke-width="${isFocused ? '2.5' : '1.5'}" stroke-dasharray="4,2"/>
        <!-- Inner Solid White Circle -->
        <circle cx="24" cy="27" r="14.5" fill="#FFFFFF" stroke="${strokeColor}" stroke-width="2"/>
        <!-- Centered Emoji/Icon -->
        <text x="24" y="33" font-size="16" text-anchor="middle" font-family="'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif">${emoji}</text>
      </svg>
    `;

    return {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
      scaledSize: (window as any).google?.maps?.Size ? new (window as any).google.maps.Size(220, 54) : undefined,
      anchor: (window as any).google?.maps?.Point ? new (window as any).google.maps.Point(24, 27) : undefined,
    };
  };

  // Initialize Native Google Maps
  useEffect(() => {
    let isSubscribed = true;

    loadGoogleMaps().then((maps) => {
      if (!isSubscribed || !maps || !mapContainerRef.current) return;

      // Center around coordinates, unit, target TKP, atau default Mako Kepolisian (Polres Pekalongan)
      const firstOffice = policeOffices && policeOffices.length > 0 ? policeOffices[0] : null;
      const defaultCenter = (firstOffice?.lat && firstOffice?.lng)
        ? { lat: Number(firstOffice.lat), lng: Number(firstOffice.lng) }
        : { lat: -7.026803, lng: 109.592982 };

      const centerPos = (centerLat && centerLng && Number(centerLat) !== 0 && Number(centerLng) !== 0)
        ? { lat: Number(centerLat), lng: Number(centerLng) }
        : (myUnit?.pos?.lat && myUnit?.pos?.lng && Number(myUnit.pos.lat) !== 0
          ? { lat: Number(myUnit.pos.lat), lng: Number(myUnit.pos.lng) }
          : (targetComplaint?.tkpLat && targetComplaint?.tkpLng
            ? { lat: Number(targetComplaint.tkpLat), lng: Number(targetComplaint.tkpLng) }
            : defaultCenter));

      const mapOptions = {
        zoom: mode === 'fullscreen' ? 14 : 13,
        center: centerPos,
        disableDefaultUI: true, // Clean interface matching prototype
        mapTypeId: 'roadmap',
        gestureHandling: 'greedy',
        styles: [
          { featureType: 'poi', stylers: [{ visibility: 'off' }] },
          { featureType: 'transit', stylers: [{ visibility: 'off' }] },
        ],
      };

      if (typeof maps.Map !== 'function') {
        console.warn('Google Maps Map constructor is not available.');
        return;
      }

      try {
        const map = new maps.Map(mapContainerRef.current, mapOptions);
        mapInstanceRef.current = map;

        // Trigger resize agar tile peta langsung ter-render tanpa blank abu-abu
        setTimeout(() => {
          if (maps.event && mapInstanceRef.current) {
            maps.event.trigger(mapInstanceRef.current, 'resize');
          }
        }, 200);

        // =========================================================================
        // NATIVE GOOGLE MAPS REALTIME TRAFFIC LAYER (1:1 DENGAN PROTOTYPE)
        // Menampilkan traffic line hijau, oranye, dan merah secara real-time dari Google
        // =========================================================================
        if (typeof maps.TrafficLayer === 'function') {
          const trafficLayer = new maps.TrafficLayer();
          trafficLayerRef.current = trafficLayer;

          if (showTraffic) {
            trafficLayer.setMap(map);
          }
        }

        // Auto-dismiss development notice dialog jika ada (sama persis dengan prototype personil.js baris 49-57)
        const dismissTimer = setInterval(() => {
          document.querySelectorAll('.dismissButton').forEach((b: any) => b.click());
          document.querySelectorAll('.gm-err-container, .gm-err-content').forEach((el: any) => {
            const dialog = el.closest('[role="dialog"]') || el.parentElement;
            if (dialog) dialog.style.display = 'none';
          });
        }, 350);

        const clearTimer = setTimeout(() => clearInterval(dismissTimer), 100);

        // Render markers
        renderMarkers(map, maps);

        return () => {
          clearInterval(dismissTimer);
          clearTimeout(clearTimer);
        };
      } catch (err) {
        console.warn('Error constructing Google Map:', err);
      }
    });

    return () => {
      isSubscribed = false;
      // Clean up markers and polylines
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
      patrolPolylinesRef.current.forEach((p) => {
        try { p.setMap(null); } catch (_) {}
      });
      patrolPolylinesRef.current = [];
      if (myUnitMarkerRef.current) {
        myUnitMarkerRef.current.setMap(null);
        myUnitMarkerRef.current = null;
      }
      if (directionsRendererRef.current) {
        try { directionsRendererRef.current.setMap(null); } catch (_) {}
        directionsRendererRef.current = null;
      }
    };
  }, [mode]);

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

  // Sync Markers when filters or data change
  const renderMarkers = (map: any, maps: any) => {
    // Clear old markers & polylines (kecuali marker unit sendiri yang di-update posisinya secara smooth)
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    patrolPolylinesRef.current.forEach((p) => {
      try { p.setMap(null); } catch (_) {}
    });
    patrolPolylinesRef.current = [];

    // 1. My Unit (Smooth update posisi tanpa kedip/recreate marker)
    const myPos = myUnit?.pos || (myUnit?.lat && myUnit?.lng ? { lat: Number(myUnit.lat), lng: Number(myUnit.lng) } : null);
    if (myUnit && myPos && myPos.lat && myPos.lng && Number(myPos.lat) !== 0) {
      if (myUnitMarkerRef.current) {
        myUnitMarkerRef.current.setPosition(myPos);
        myUnitMarkerRef.current.setMap(map);
      } else {
        const myIcon = makeHaloBadgeIcon(myUnit.iconEmoji || '👮', '#0284C7', '#38BDF8');
        const marker = new maps.Marker({
          position: myPos,
          map,
          icon: myIcon,
          title: myUnit.title || myUnit.petugas || 'Posisi Saya',
          zIndex: 1000,
        });
        marker.addListener('click', () => {
          handleUnitClick(myUnit);
        });
        myUnitMarkerRef.current = marker;
      }
    } else if (myUnitMarkerRef.current) {
      myUnitMarkerRef.current.setMap(null);
    }

    // 2. Police Offices / Mako (Dinamis Murni dari Database Tabel auth_units)
    (policeOffices || []).forEach((office) => {
      const officePos = { lat: Number(office.lat), lng: Number(office.lng) };
      if (!officePos.lat || !officePos.lng) return;

      const makoIcon = makeHaloBadgeIcon('🏢', '#1E3A8A', '#93C5FD');
      const makoMarker = new maps.Marker({
        position: officePos,
        map,
        icon: makoIcon,
        title: office.name,
        zIndex: 800,
      });

      const officeUnitData: MapUnitData = {
        key: `office_${office.id}`,
        pos: officePos,
        iconEmoji: office.iconEmoji || '🏢',
        title: office.name,
        petugas: office.petugas,
        sub: office.address,
        status: office.status,
        statusColor: office.statusColor || '#1E3A8A',
        tugas: office.tugas,
        telemetri: office.telemetri,
      };

      makoMarker.addListener('click', () => {
        handleUnitClick(officeUnitData);
      });
      markersRef.current.push(makoMarker);
    });

    // 3. Operational Fleet Units & On-Duty Picket Personnel
    if (showOtherOfficers) {
      (fleetUnits || []).forEach((unit) => {
        if (myUnit) {
          const myNrp = (myUnit as any).nrp || (myUnit as any).callsign;
          if (
            unit.key === myUnit.key ||
            (myNrp && (unit.nrp === myNrp || unit.callsign === myNrp || unit.key?.includes(myNrp)))
          ) {
            return;
          }
        }

        const cat = (unit.category || unit.key || '').toLowerCase();

        // Apply active filter
        if (activeFilter === 'samapta' && !cat.includes('samapta')) return;
        if (activeFilter === 'perintis' && !cat.includes('perintis')) return;
        if (activeFilter === 'lantas' && !cat.includes('lantas') && !cat.includes('pjr')) return;
        if (activeFilter === 'reskrim' && !cat.includes('reskrim')) return;
        if (activeFilter === 'intelkam' && !cat.includes('intelkam')) return;
        if (activeFilter === 'binmas' && !cat.includes('binmas')) return;
        if (activeFilter === 'pawas' && !cat.includes('pawas')) return;
        if (activeFilter === 'hotspot') return;

        const isFocused = focusedUnitKey === unit.key;

        let strokeColor = unit.statusColor || '#0284C7';
        let haloColor = '#38BDF8';
        if (unit.status === 'DARURAT') {
          strokeColor = '#EF4444';
          haloColor = '#F87171';
        } else if (cat.includes('perintis')) {
          strokeColor = '#D97706';
          haloColor = '#FBBF24';
        } else if (cat.includes('lantas') || cat.includes('pjr')) {
          strokeColor = '#1D4ED8';
          haloColor = '#60A5FA';
        } else if (cat.includes('reskrim')) {
          strokeColor = '#8B5CF6';
          haloColor = '#C4B5FD';
        } else if (cat.includes('pawas')) {
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
          position: unit.pos,
          map,
          icon,
          title: `${unit.title} - ${unit.status}`,
          zIndex: isFocused ? 1200 : 900,
        });

        marker.addListener('click', () => {
          handleUnitClick(unit);
        });

        markersRef.current.push(marker);

        // Render tactical patrol route polyline (Mengikuti rute jalan raya resmi OSRM)
        if ((showPatrolRoutes || isFocused) && unit.routePoints && unit.routePoints.length >= 2) {
          if (unit.routePoints.length === 2) {
            // Rute 2 titik (Unit ke TKP) - gunakan OSRM jalan raya asli bukan garis lurus!
            getRealRoadPath(
              unit.routePoints[0].lat,
              unit.routePoints[0].lng,
              unit.routePoints[1].lat,
              unit.routePoints[1].lng
            ).then((roadPath) => {
              if (roadPath && roadPath.length > 0 && mapInstanceRef.current) {
                const poly = new maps.Polyline({
                  path: roadPath,
                  strokeColor: strokeColor,
                  strokeOpacity: isFocused ? 0.95 : 0.75,
                  strokeWeight: isFocused ? 5 : 4,
                  map: mapInstanceRef.current,
                });
                patrolPolylinesRef.current.push(poly);
              }
            });
          } else {
            // Rute patroli multi-waypoint
            const poly = new maps.Polyline({
              path: unit.routePoints,
              strokeColor: strokeColor,
              strokeOpacity: isFocused ? 0.95 : 0.55,
              strokeWeight: isFocused ? 5 : 3.5,
              map,
            });
            patrolPolylinesRef.current.push(poly);
          }
        }
      });
    }

    // 4. Hotspots / Titik Rawan (Dinamis Murni dari Database Tabel geo_hotspot_locations)
    if (activeFilter === 'all' || activeFilter === 'hotspot') {
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
          iconEmoji: h.ikonEmoji || h.iconEmoji || '🔴',
          title: h.title,
          petugas: h.wilayahPolsek || h.wilayah_polsek || h.wilayah || h.petugas,
          sub: h.kategori || h.sub,
          status: h.statusBahaya || h.status_bahaya || h.status,
          statusColor: '#DC2626',
          tugas: h.jadwalDisplay || h.jadwal_display || h.jadwal || h.tugas,
          telemetri: `Koordinat: ${hotspotPos.lat.toFixed(4)}, ${hotspotPos.lng.toFixed(4)}`,
        };

      marker.addListener('click', () => {
        handleUnitClick(hotspotUnitData);
      });

      markersRef.current.push(marker);
    });
  }

  // 5. Target Pengaduan / Lokasi TKP Darurat & Garis Rute Tercepat (Navigasi Lapangan)
  if (directionsRendererRef.current) {
    try {
      directionsRendererRef.current.setMap(null);
    } catch (_) {}
    directionsRendererRef.current = null;
  }

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

      // Gambar rute Directions dan sesuaikan viewport peta otomatis
      const originLat = myUnit?.pos?.lat ?? (myUnit as any)?.lat;
      const originLng = myUnit?.pos?.lng ?? (myUnit as any)?.lng;

      if (originLat && originLng && Number(originLat) !== 0) {
        const originPos = { lat: Number(originLat), lng: Number(originLng) };

        // Fit Bounds HANYA SEKALI saat target TKP pertama kali aktif agar peta tidak melompat terus
        const complaintKey = `${targetComplaint.id || targetComplaint.nomorTiket || 'current'}`;
        if (lastFittedComplaintIdRef.current !== complaintKey) {
          lastFittedComplaintIdRef.current = complaintKey;
          try {
            const bounds = new maps.LatLngBounds();
            bounds.extend(originPos);
            bounds.extend(tkpPos);
            map.fitBounds(bounds, { top: 70, bottom: 80, left: 40, right: 40 });
          } catch (_) {}
        }

        // Ambil rute jalan raya sesungguhnya (OSRM Navigation) hanya jika belum ada atau bergeser > 50m
        const lastRoute = lastRouteFetchedCoordsRef.current;
        const needsFetch =
          !directionsRendererRef.current ||
          !lastRoute ||
          Math.abs(lastRoute.oLat - originPos.lat) > 0.0005 ||
          Math.abs(lastRoute.oLng - originPos.lng) > 0.0005 ||
          Math.abs(lastRoute.dLat - tkpPos.lat) > 0.0005 ||
          Math.abs(lastRoute.dLng - tkpPos.lng) > 0.0005;

        if (needsFetch && !isFetchingRouteRef.current) {
          isFetchingRouteRef.current = true;
          lastRouteFetchedCoordsRef.current = {
            oLat: originPos.lat,
            oLng: originPos.lng,
            dLat: tkpPos.lat,
            dLng: tkpPos.lng,
          };

          getRealRoadPath(originPos.lat, originPos.lng, tkpPos.lat, tkpPos.lng)
            .then((path) => {
              if (path && path.length > 0 && mapInstanceRef.current) {
                if (directionsRendererRef.current) {
                  try {
                    if (typeof directionsRendererRef.current.setMap === 'function') {
                      directionsRendererRef.current.setMap(null);
                    }
                  } catch (_) {}
                }
                const poly = new maps.Polyline({
                  path,
                  strokeColor: '#ECC473',
                  strokeOpacity: 0.95,
                  strokeWeight: 6,
                  map: mapInstanceRef.current,
                });
                directionsRendererRef.current = poly;
              }
            })
            .catch((err) => {
              console.warn('Road routing notice:', err);
            })
            .finally(() => {
              isFetchingRouteRef.current = false;
            });
        }
      } else {
        map.panTo(tkpPos);
      }
    }
  };

  useEffect(() => {
    if (mapInstanceRef.current && (window as any).google?.maps) {
      const maps = (window as any).google.maps;
      renderMarkers(mapInstanceRef.current, maps);
    }
  }, [
    activeFilter,
    showOtherOfficers,
    showPatrolRoutes,
    focusedUnitKey,
    hotspots?.length,
    policeOffices?.length,
    fleetUnits?.length,
    myUnit?.key,
    myUnit?.pos?.lat,
    myUnit?.pos?.lng,
    targetComplaint?.id,
    targetComplaint?.nomorTiket,
    targetComplaint?.status,
    targetComplaint?.tkpLat ?? targetComplaint?.lat,
    targetComplaint?.tkpLng ?? targetComplaint?.lng,
  ]);

  // Center & zoom to focused unit or TKP when selected
  useEffect(() => {
    if (!focusedUnitKey || !mapInstanceRef.current) return;
    if (focusedUnitKey.startsWith('tkp_') && targetComplaint) {
      const tLat = targetComplaint.tkpLat ?? targetComplaint.lat ?? targetComplaint.tkp_lat;
      const tLng = targetComplaint.tkpLng ?? targetComplaint.lng ?? targetComplaint.tkp_lng;
      if (tLat && tLng) {
        mapInstanceRef.current.panTo({ lat: Number(tLat), lng: Number(tLng) });
        mapInstanceRef.current.setZoom(16);
        return;
      }
    }
    if (!fleetUnits) return;
    const target = fleetUnits.find((u) => u.key === focusedUnitKey);
    if (target?.pos?.lat && target?.pos?.lng) {
      mapInstanceRef.current.panTo({ lat: Number(target.pos.lat), lng: Number(target.pos.lng) });
      mapInstanceRef.current.setZoom(16);
    }
  }, [focusedUnitKey, fleetUnits, targetComplaint]);

  // Center dynamically when centerLat / centerLng change
  useEffect(() => {
    if (mapInstanceRef.current && centerLat && centerLng) {
      mapInstanceRef.current.panTo({ lat: Number(centerLat), lng: Number(centerLng) });
    }
  }, [centerLat, centerLng]);

// Center to my unit / GPS
const handleCenterGps = () => {
  if (!mapInstanceRef.current) return;
  if (myUnit?.pos?.lat && myUnit?.pos?.lng) {
    mapInstanceRef.current.panTo({ lat: myUnit.pos.lat, lng: myUnit.pos.lng });
    mapInstanceRef.current.setZoom(15);
  } else if (typeof window !== 'undefined' && navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.panTo({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
          mapInstanceRef.current.setZoom(15);
        }
      },
      (err) => {
        console.warn('GPS unit tidak ditemukan:', err);
      }
    );
  }
};

// Zoom In / Out
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

  const effectiveHeight = mode === 'fullscreen' ? '100%' : (height || '350px');

  return (
    <div style={{ position: 'relative', width: '100%', height: effectiveHeight, minHeight: mode === 'fullscreen' ? '100%' : undefined, overflow: 'hidden' }}>
      {/* Native Google Maps Canvas */}
      <div
        ref={mapContainerRef}
        style={{
          width: '100%',
          height: '100%',
          minHeight: '100%',
          background: '#E2E8F0',
        }}
      />

    {/* Floating Map Controls */}
    <div
      id="floating-map-controls"
      className="floating-map-controls"
      style={{
        position: 'absolute',
        zIndex: 30,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        transition: 'right 0.3s cubic-bezier(0.4, 0, 0.2, 1), bottom 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        ...(controlsPosition === 'bottom-left'
          ? {
              bottom: controlsBottomOffset ?? '24px',
              left: '16px',
              ...(controlsBottomOffset ? { ['--map-controls-bottom' as any]: controlsBottomOffset } : {}),
            }
          : controlsPosition === 'top-right'
          ? { top: '12px', right: controlsRightOffset ?? '12px' }
          : {
              bottom: controlsBottomOffset ?? '24px',
              right: controlsRightOffset ?? '20px',
              ...(controlsBottomOffset ? { ['--map-controls-bottom' as any]: controlsBottomOffset } : {}),
            }),
      }}
    >
      {/* SOS Button */}
      {onOpenSos && (
        <button
          type="button"
          onClick={onOpenSos}
          title="Sinyal Darurat / Panic Button"
          style={{
            width: '38px',
            height: '38px',
            background: '#EF4444',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            boxShadow: '0 4px 10px rgba(239,68,68,0.4)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            transition: 'transform 0.15s ease',
          }}
          onMouseOver={(e) => ((e.currentTarget as HTMLElement).style.transform = 'scale(1.08)')}
          onMouseOut={(e) => ((e.currentTarget as HTMLElement).style.transform = 'scale(1)')}
        >
          <AlertTriangle size={18} />
        </button>
      )}

      {/* Zoom In */}
      <button
        type="button"
        onClick={handleZoomIn}
        title="Perbesar Peta (+)"
        style={{
          width: '38px',
          height: '38px',
          background: '#FFFFFF',
          color: '#1E293B',
          border: '1px solid #CBD5E1',
          borderRadius: '8px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Plus size={18} strokeWidth={2.5} />
      </button>

      {/* Zoom Out */}
      <button
        type="button"
        onClick={handleZoomOut}
        title="Perkecil Peta (−)"
        style={{
          width: '38px',
          height: '38px',
          background: '#FFFFFF',
          color: '#1E293B',
          border: '1px solid #CBD5E1',
          borderRadius: '8px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Minus size={18} strokeWidth={2.5} />
      </button>

      {/* GPS Center */}
      <button
        type="button"
        onClick={handleCenterGps}
        title="Pusatkan ke Posisi GPS Saya"
        style={{
          width: '38px',
          height: '38px',
          background: '#FFFFFF',
          color: '#0284C7',
          border: '1px solid #CBD5E1',
          borderRadius: '8px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <LocateFixed size={18} strokeWidth={2.2} />
      </button>

      {/* Fullscreen Toggle (if in beranda) */}
      {mode === 'beranda' && onFullscreen && (
        <button
          type="button"
          onClick={onFullscreen}
          title="Buka Peta Taktis Layar Penuh"
          style={{
            width: '38px',
            height: '38px',
            background: '#0F2D56',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            boxShadow: '0 4px 10px rgba(15,45,86,0.35)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Maximize2 size={16} />
        </button>
      )}
    </div>
  </div>
);
}
