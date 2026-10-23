'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { loadGoogleMaps } from './SimapresGoogleMap';

interface MiniMapPickerProps {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
  onAddressChange?: (address: string) => void;
  height?: string;
  fallbackCenter?: { lat: number; lng: number };
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
  height = '220px',
  fallbackCenter,
}: MiniMapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const mapsRef = useRef<any>(null);

  const geocodeLatLng = useCallback(
    async (targetLat: number, targetLng: number, mapsInstance?: any) => {
      if (!onAddressChange || !isValidMapCoord(targetLat, targetLng)) return;
      let resolved = false;
      const maps = mapsInstance || mapsRef.current;

      // 1. Coba Google Geocoder jika API aktif
      if (maps?.Geocoder) {
        try {
          const geocoder = new maps.Geocoder();
          await new Promise<void>((res) => {
            geocoder.geocode({ location: { lat: targetLat, lng: targetLng } }, (results: any, status: any) => {
              if (status === 'OK' && results && results[0]) {
                onAddressChange(results[0].formatted_address);
                resolved = true;
              }
              res();
            });
          });
        } catch (_) {}
      }

      // 2. Fallback otomatis ke reverse geocoder berkecepatan tinggi jika tanpa Google Key
      if (!resolved) {
        try {
          const res = await fetch(`https://photon.komoot.io/reverse?lat=${targetLat}&lon=${targetLng}`);
          if (res.ok) {
            const data = await res.json();
            const feat = data?.features?.[0]?.properties;
            if (feat) {
              const parts = [
                feat.name,
                feat.street,
                feat.district,
                feat.city,
                feat.state,
              ].filter(Boolean);
              const uniqueParts = Array.from(new Set(parts));
              const formatted = uniqueParts.join(', ');
              if (formatted) {
                onAddressChange(formatted);
              }
            }
          }
        } catch (_) {}
      }
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
