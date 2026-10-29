'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { loadGoogleMaps } from './SimapresGoogleMap';
import { resolveIndonesianAddress, LocationSuggestionItem } from '@/infrastructure/services/indonesian-location-search.service';

export interface SearchResultMarkerItem {
  id?: string | number;
  lat: number;
  lng: number;
  label: string;
  subLabel?: string;
  fullAddress?: string;
  isPoliceStation?: boolean;
  stationType?: string;
  distanceKm?: number;
  distanceText?: string;
}

interface MiniMapPickerProps {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
  onAddressChange?: (address: string) => void;
  onCenterChange?: (center: { lat: number; lng: number }) => void;
  height?: string;
  fallbackCenter?: { lat: number; lng: number };
  searchResultMarkers?: SearchResultMarkerItem[];
  onSelectSearchResultMarker?: (marker: SearchResultMarkerItem) => void;
}

// Default coordinates for Mako Polres Pekalongan / Area Operasional Presisi
const DEFAULT_CENTER = { lat: -7.026803, lng: 109.592982 };

export const isValidMapCoord = (cLat?: any, cLng?: any): boolean => {
  if (cLat === null || cLat === undefined || cLng === null || cLng === undefined) return false;
  const nLat = Number(cLat);
  const nLng = Number(cLng);
  return (
    !isNaN(nLat) &&
    !isNaN(nLng) &&
    (nLat !== 0 || nLng !== 0) &&
    Math.abs(nLat) <= 80 &&
    Math.abs(nLng) <= 180
  );
};

export default function MiniMapPicker({
  lat,
  lng,
  onChange,
  onAddressChange,
  onCenterChange,
  height = '220px',
  fallbackCenter,
  searchResultMarkers,
  onSelectSearchResultMarker,
}: MiniMapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const mapsRef = useRef<any>(null);
  const searchMarkersRef = useRef<any[]>([]);
  const infoWindowRef = useRef<any>(null);

  const geocodeLatLng = useCallback(
    async (targetLat: number, targetLng: number, mapsInstance?: any) => {
      if (!onAddressChange || !isValidMapCoord(targetLat, targetLng)) return;
      try {
        const addr = await resolveIndonesianAddress(targetLat, targetLng);
        if (addr) {
          onAddressChange(addr);
        }
      } catch (_) {}
    },
    [onAddressChange]
  );

  useEffect(() => {
    let isSubscribed = true;
    let resizeObserver: ResizeObserver | null = null;
    let t1: NodeJS.Timeout | null = null;
    let t2: NodeJS.Timeout | null = null;
    let t3: NodeJS.Timeout | null = null;

    loadGoogleMaps().then((maps) => {
      if (!isSubscribed || !maps || !containerRef.current) return;
      mapsRef.current = maps;
      infoWindowRef.current = new maps.InfoWindow();

      const hasCoords = isValidMapCoord(lat, lng);
      const initialCenter = hasCoords
        ? { lat: Number(lat), lng: Number(lng) }
        : (isValidMapCoord(fallbackCenter?.lat, fallbackCenter?.lng)
          ? { lat: Number(fallbackCenter!.lat), lng: Number(fallbackCenter!.lng) }
          : DEFAULT_CENTER);

      const map = new maps.Map(containerRef.current, {
        center: initialCenter,
        zoom: hasCoords ? 15 : 13,
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
        gestureHandling: 'greedy',
      });
      mapRef.current = map;

      // Auto-trigger resize saat peta dimuat di container fullscreen / modal
      const triggerResize = () => {
        if (mapRef.current && maps) {
          maps.event.trigger(mapRef.current, 'resize');
        }
      };

      t1 = setTimeout(triggerResize, 80);
      t2 = setTimeout(triggerResize, 250);
      t3 = setTimeout(triggerResize, 600);

      if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
        resizeObserver = new ResizeObserver(() => {
          triggerResize();
        });
        resizeObserver.observe(containerRef.current);
      }

      const setOrUpdateMarker = (pos: any) => {
        const pLat = typeof pos.lat === 'function' ? pos.lat() : pos.lat;
        const pLng = typeof pos.lng === 'function' ? pos.lng() : pos.lng;
        if (!isValidMapCoord(pLat, pLng)) return;

        const normalizedPos = { lat: Number(pLat), lng: Number(pLng) };

        if (!markerRef.current) {
          const marker = new maps.Marker({
            position: normalizedPos,
            map,
            draggable: true,
            animation: maps.Animation.DROP,
            title: 'Geser pin atau klik peta untuk menentukan titik koordinat',
            zIndex: 999,
          });
          marker.addListener('dragend', (e: any) => {
            const draggedPos = e.latLng;
            const newLat = Number(draggedPos.lat().toFixed(6));
            const newLng = Number(draggedPos.lng().toFixed(6));
            if (isValidMapCoord(newLat, newLng)) {
              onChange(newLat, newLng);
              geocodeLatLng(newLat, newLng, maps);
            }
          });
          markerRef.current = marker;
        } else {
          markerRef.current.setPosition(normalizedPos);
          markerRef.current.setMap(map);
        }
      };

      if (hasCoords) {
        setOrUpdateMarker({ lat: Number(lat), lng: Number(lng) });
      } else if (typeof window !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (mapRef.current && !isValidMapCoord(lat, lng)) {
              const curLat = Number(pos.coords.latitude.toFixed(6));
              const curLng = Number(pos.coords.longitude.toFixed(6));
              if (isValidMapCoord(curLat, curLng)) {
                mapRef.current.panTo({ lat: curLat, lng: curLng });
              }
            }
          },
          () => {}
        );
      }

      // Auto-dismiss Google Maps dev popup with auto-stop after 5s
      let dismissInterval: NodeJS.Timeout | null = setInterval(() => {
        if (typeof document !== 'undefined') {
          document.querySelectorAll('.dismissButton').forEach((btn: any) => btn.click());
          document.querySelectorAll('.gm-err-container, .gm-err-content').forEach((el: any) => {
            const dialog = el.closest('[role="dialog"]') || el.parentElement;
            if (dialog) (dialog as HTMLElement).style.display = 'none';
          });
        }
      }, 350);
      const dismissStopTimeout = setTimeout(() => {
        if (dismissInterval) clearInterval(dismissInterval);
        dismissInterval = null;
      }, 5000);

      // Event click on map
      map.addListener('click', (e: any) => {
        const clickedPos = e.latLng;
        const newLat = Number(clickedPos.lat().toFixed(6));
        const newLng = Number(clickedPos.lng().toFixed(6));
        if (!isValidMapCoord(newLat, newLng)) return;
        setOrUpdateMarker(clickedPos);
        onChange(newLat, newLng);
        geocodeLatLng(newLat, newLng, maps);
      });

      // Event map viewport idle (report current center for proximity search)
      map.addListener('idle', () => {
        if (onCenterChange) {
          const c = map.getCenter();
          if (c) {
            const cLat = Number(c.lat().toFixed(6));
            const cLng = Number(c.lng().toFixed(6));
            if (isValidMapCoord(cLat, cLng)) {
              onCenterChange({ lat: cLat, lng: cLng });
            }
          }
        }
      });

      return () => {
        if (dismissInterval) clearInterval(dismissInterval);
        clearTimeout(dismissStopTimeout);
        if (t1) clearTimeout(t1);
        if (t2) clearTimeout(t2);
        if (t3) clearTimeout(t3);
        if (resizeObserver) resizeObserver.disconnect();
      };
    });

    return () => {
      isSubscribed = false;
      if (t1) clearTimeout(t1);
      if (t2) clearTimeout(t2);
      if (t3) clearTimeout(t3);
      if (resizeObserver) resizeObserver.disconnect();
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
      searchMarkersRef.current.forEach((m) => m.setMap(null));
      searchMarkersRef.current = [];
    };
  }, []);

  // Update marker position when lat/lng change from outside
  useEffect(() => {
    if (mapRef.current && (window as any).google?.maps) {
      const maps = (window as any).google.maps;
      if (isValidMapCoord(lat, lng)) {
        const pos = { lat: Number(lat), lng: Number(lng) };
        if (markerRef.current) {
          markerRef.current.setPosition(pos);
          markerRef.current.setMap(mapRef.current);
        } else {
          const marker = new maps.Marker({
            position: pos,
            map: mapRef.current,
            draggable: true,
            animation: maps.Animation.DROP,
            title: 'Geser pin atau klik peta untuk menentukan titik koordinat',
            zIndex: 999,
          });
          marker.addListener('dragend', (e: any) => {
            const draggedPos = e.latLng;
            const newLat = Number(draggedPos.lat().toFixed(6));
            const newLng = Number(draggedPos.lng().toFixed(6));
            if (isValidMapCoord(newLat, newLng)) {
              onChange(newLat, newLng);
              geocodeLatLng(newLat, newLng, maps);
            }
          });
          markerRef.current = marker;
        }
        mapRef.current.panTo(pos);
      } else {
        if (markerRef.current) {
          markerRef.current.setMap(null);
        }
      }
    }
  }, [lat, lng, onChange, geocodeLatLng]);

  // Google Maps-Style: Render Multiple Search Result Pins on the Map
  useEffect(() => {
    if (!mapRef.current || !mapsRef.current) return;
    const maps = mapsRef.current;
    const map = mapRef.current;

    // Clear old search markers
    searchMarkersRef.current.forEach((m) => m.setMap(null));
    searchMarkersRef.current = [];

    if (!searchResultMarkers || searchResultMarkers.length === 0) return;

    searchResultMarkers.forEach((item, idx) => {
      if (!isValidMapCoord(item.lat, item.lng)) return;

      // Custom SVG Marker Icon like Google Maps red pin with police shield badge
      const isPolice = item.isPoliceStation;
      const svgIcon = isPolice
        ? {
            url:
              'data:image/svg+xml;utf-8,' +
              encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44">
                  <defs>
                    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="3" stdDeviation="2" flood-color="#000000" flood-opacity="0.35"/>
                    </filter>
                  </defs>
                  <path d="M18 1C8.6 1 1 8.6 1 18c0 12.8 17 25 17 25s17-12.2 17-25C35 8.6 27.4 1 18 1z" fill="#DC2626" stroke="#FFFFFF" stroke-width="2" filter="url(#shadow)"/>
                  <circle cx="18" cy="17" r="10.5" fill="#FFFFFF"/>
                  <path d="M18 9.5l5.5 2.5v4.5c0 4-2.8 6.8-5.5 8-2.7-1.2-5.5-4-5.5-8V12l5.5-2.5z" fill="#1D4ED8"/>
                  <path d="M18 12.5l2.8 1.3v2.2c0 2-1.4 3.4-2.8 4-1.4-.6-2.8-2-2.8-4v-2.2l2.8-1.3z" fill="#FBBF24"/>
                </svg>
              `),
            scaledSize: new maps.Size(32, 40),
            anchor: new maps.Point(16, 40),
          }
        : {
            url:
              'data:image/svg+xml;utf-8,' +
              encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="30" height="38" viewBox="0 0 30 38">
                  <path d="M15 1C7.3 1 1 7.3 1 15c0 10.5 14 22 14 22s14-11.5 14-22C29 7.3 22.7 1 15 1z" fill="#EA580C" stroke="#FFFFFF" stroke-width="2"/>
                  <circle cx="15" cy="14" r="5" fill="#FFFFFF"/>
                </svg>
              `),
            scaledSize: new maps.Size(26, 34),
            anchor: new maps.Point(13, 34),
          };

      const marker = new maps.Marker({
        position: { lat: item.lat, lng: item.lng },
        map,
        icon: svgIcon,
        title: item.label,
        zIndex: 500 + idx,
      });

      marker.addListener('click', () => {
        if (infoWindowRef.current) {
          const btnId = `pick-pin-btn-${idx}`;
          const content = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 4px; min-width: 200px;">
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-bottom: 4px;">
                <span style="background: ${isPolice ? '#1D4ED8' : '#EA580C'}; color: #FFFFFF; font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 4px;">
                  ${isPolice ? 'KANTOR POLISI' : 'LOKASI'}
                </span>
                ${item.distanceText ? `<span style="background: #ECFDF5; color: #047857; font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 4px; border: 1px solid #A7F3D0;">${item.distanceText}</span>` : ''}
              </div>
              <div style="font-weight: 800; font-size: 13px; color: #0F172A; line-height: 1.3;">${item.label}</div>
              <div style="font-size: 11px; color: #64748B; margin: 4px 0 8px; line-height: 1.3;">${item.fullAddress || item.subLabel || ''}</div>
              <button id="${btnId}" style="background: #2563EB; color: #FFFFFF; border: none; border-radius: 6px; padding: 6px 12px; font-size: 11px; font-weight: 700; cursor: pointer; width: 100%; box-shadow: 0 2px 4px rgba(37,99,235,0.3);">
                ✓ Pilih & Kunci Titik Ini
              </button>
            </div>
          `;
          infoWindowRef.current.setContent(content);
          infoWindowRef.current.open(map, marker);

          // Hook button inside InfoWindow
          setTimeout(() => {
            const btn = document.getElementById(btnId);
            if (btn) {
              btn.onclick = () => {
                infoWindowRef.current.close();
                if (onSelectSearchResultMarker) {
                  onSelectSearchResultMarker(item);
                } else {
                  onChange(item.lat, item.lng);
                  if (onAddressChange && item.fullAddress) {
                    onAddressChange(item.fullAddress);
                  }
                }
              };
            }
          }, 100);
        }

        // Also trigger select when pin itself is clicked
        if (onSelectSearchResultMarker) {
          onSelectSearchResultMarker(item);
        }
      });

      searchMarkersRef.current.push(marker);
    });
  }, [searchResultMarkers, onChange, onAddressChange, onSelectSearchResultMarker]);

  const handleCenterGps = () => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const curLat = Number(pos.coords.latitude.toFixed(6));
        const curLng = Number(pos.coords.longitude.toFixed(6));
        if (!isValidMapCoord(curLat, curLng)) return;

        onChange(curLat, curLng);
        if (mapRef.current) {
          mapRef.current.panTo({ lat: curLat, lng: curLng });
          mapRef.current.setZoom(16);
          if (mapsRef.current) {
            if (!markerRef.current) {
              const marker = new mapsRef.current.Marker({
                position: { lat: curLat, lng: curLng },
                map: mapRef.current,
                draggable: true,
                animation: mapsRef.current.Animation.DROP,
                title: 'Geser pin atau klik peta untuk menentukan titik koordinat',
                zIndex: 999,
              });
              marker.addListener('dragend', (e: any) => {
                const draggedPos = e.latLng;
                const newLat = Number(draggedPos.lat().toFixed(6));
                const newLng = Number(draggedPos.lng().toFixed(6));
                if (isValidMapCoord(newLat, newLng)) {
                  onChange(newLat, newLng);
                  geocodeLatLng(newLat, newLng, mapsRef.current);
                }
              });
              markerRef.current = marker;
            } else {
              markerRef.current.setPosition({ lat: curLat, lng: curLng });
              markerRef.current.setMap(mapRef.current);
            }
          }
        }
        geocodeLatLng(curLat, curLng);
      });
    }
  };

  const hasSelectedCoords = isValidMapCoord(lat, lng);

  return (
    <div style={{ position: 'relative', width: '100%', height, borderRadius: '8px', overflow: 'hidden', border: '1px solid #CBD5E1' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%', background: '#F1F5F9' }} />

      {/* Warning / Hint when no coords selected */}
      {!hasSelectedCoords && (
        <div
          style={{
            position: 'absolute',
            top: '8px',
            left: '8px',
            right: '8px',
            background: 'rgba(255, 255, 255, 0.95)',
            border: '1px dashed #94A3B8',
            borderRadius: '6px',
            padding: '6px 10px',
            fontSize: '11px',
            fontWeight: 600,
            color: '#475569',
            textAlign: 'center',
            zIndex: 10,
            pointerEvents: 'none',
            boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
          }}
        >
          📍 Titik koordinat belum ditentukan. Klik pada peta atau tombol GPS Saya.
        </div>
      )}

      {/* Floating Center GPS button */}
      <button
        type="button"
        onClick={handleCenterGps}
        style={{
          position: 'absolute',
          bottom: '10px',
          right: '10px',
          background: '#FFFFFF',
          border: '1px solid #CBD5E1',
          borderRadius: '6px',
          padding: '5px 10px',
          fontSize: '11px',
          fontWeight: 700,
          color: '#0284C7',
          boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
          cursor: 'pointer',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        <span>📍</span> GPS Saya
      </button>
    </div>
  );
}
