'use client';

import React, { useEffect, useRef, useState } from 'react';

export interface MapUnitData {
  key: string;
  nrp?: string;
  pos: { lat: number; lng: number };
  iconEmoji: string;
  title: string;
  petugas: string;
  sub: string;
  status: string;
  statusColor: string;
  tugas: string;
  telemetri: string;
  category?: string;
}

interface SimapresGoogleMapProps {
  mode?: 'beranda' | 'fullscreen';
  myUnit?: MapUnitData | null;
  policeOffices?: any[];
  fleetUnits?: MapUnitData[];
  hotspots?: any[];
  showTraffic?: boolean;
  showOtherOfficers?: boolean;
  activeFilter?: 'all' | 'samapta' | 'perintis' | 'lantas' | 'hotspot';
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
      script.src = 'https://maps.googleapis.com/maps/api/js?libraries=places,geometry&v=weekly';
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


export default function SimapresGoogleMap({
  mode = 'beranda',
  myUnit = null,
  policeOffices = [],
  fleetUnits = [],
  hotspots = [],
  showTraffic = true,
  showOtherOfficers = true,
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
}: SimapresGoogleMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const trafficLayerRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const handleUnitClick = (unit: any) => {
    if (onSelectUnit) onSelectUnit(unit);
    if (onUnitClick) onUnitClick(unit);
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

  // Initialize Native Google Maps
  useEffect(() => {
    let isSubscribed = true;

    loadGoogleMaps().then((maps) => {
      if (!isSubscribed || !maps || !mapContainerRef.current) return;

      // Center around coordinates, unit, or default Jakarta Selatan
      const centerPos = centerLat && centerLng
        ? { lat: centerLat, lng: centerLng }
        : (myUnit?.pos
          ? { lat: myUnit.pos.lat, lng: myUnit.pos.lng }
          : null);

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

        const clearTimer = setTimeout(() => clearInterval(dismissTimer), 8000);

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
      // Clean up markers
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
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
    // Clear old markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    // 1. My Unit
    if (myUnit) {
      const myIcon = makeHaloBadgeIcon(myUnit.iconEmoji || '🚔', '#0284C7', '#38BDF8');
      const marker = new maps.Marker({
        position: myUnit.pos,
        map,
        icon: myIcon,
        title: myUnit.title,
        zIndex: 1000,
      });
      marker.addListener('click', () => {
        handleUnitClick(myUnit);
      });
      markersRef.current.push(marker);
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

    // 3. Operational Fleet Units (Dinamis Murni dari Database MySQL tabel patrol_fleet_units)
    if (showOtherOfficers) {
      (fleetUnits || []).forEach((unit) => {
        if (myUnit && unit.key === myUnit.key) return;

        const cat =unit.key;

        // Apply active filter
        if (activeFilter === 'samapta' && !cat.includes('samapta')) return;
        if (activeFilter === 'perintis' && !cat.includes('perintis')) return;
        if (activeFilter === 'lantas' && !cat.includes('lantas') && !cat.includes('pjr')) return;
        if (activeFilter === 'hotspot') return;

        let strokeColor = '#0284C7';
        let haloColor = '#38BDF8';
        if (cat.includes('perintis')) {
          strokeColor = '#D97706';
          haloColor = '#FBBF24';
        } else if (cat.includes('lantas') || cat.includes('pjr')) {
          strokeColor = '#1D4ED8';
          haloColor = '#60A5FA';
        }

        const icon = makeHaloBadgeIcon(unit.iconEmoji, strokeColor, haloColor);
        const marker = new maps.Marker({
          position: unit.pos,
          map,
          icon,
          title: unit.title,
          zIndex: 900,
        });

        marker.addListener('click', () => {
          handleUnitClick(unit);
        });

        markersRef.current.push(marker);
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
};

useEffect(() => {
  if (mapInstanceRef.current && (window as any).google?.maps) {
    renderMarkers(mapInstanceRef.current, (window as any).google.maps);
  }
}, [activeFilter, showOtherOfficers, hotspots, policeOffices, fleetUnits, myUnit]);

// Center to my unit / GPS
const handleCenterGps = () => {
  if (!mapInstanceRef.current) return;
  const target = myUnit?.pos
    ? { lat: myUnit.pos.lat, lng: myUnit.pos.lng }
    : {lat:0,lng:0};
  mapInstanceRef.current.panTo(target);
  mapInstanceRef.current.setZoom(15);
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

return (
  <div style={{ position: 'relative', width: '100%', height, overflow: 'hidden' }}>
    {/* Native Google Maps Canvas */}
    <div
      ref={mapContainerRef}
      style={{
        width: '100%',
        height: '100%',
        background: '#E2E8F0',
      }}
    />

    {/* Floating Map Controls on Top-Right matching Prototype */}
    <div
      style={{
        position: 'absolute',
        top: '12px',
        right: '12px',
        zIndex: 30,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
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
          🚨
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
          fontSize: '20px',
          fontWeight: 800,
        }}
      >
        +
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
          fontSize: '22px',
          fontWeight: 800,
        }}
      >
        −
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
          fontSize: '18px',
        }}
      >
        🎯
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
            fontSize: '17px',
          }}
        >
          ⛶
        </button>
      )}
    </div>
  </div>
);
}
