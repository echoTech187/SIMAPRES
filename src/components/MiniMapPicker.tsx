'use client';

import React, { useEffect, useRef } from 'react';
import { loadGoogleMaps } from './SimapresGoogleMap';

interface MiniMapPickerProps {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
  height?: string;
}

export default function MiniMapPicker({
  lat,
  lng,
  onChange,
  height = '220px',
}: MiniMapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    let isSubscribed = true;

    loadGoogleMaps().then((maps) => {
      if (!isSubscribed || !maps || !containerRef.current) return;

      const initialPos = {
        lat: lat || -6.2443,
        lng: lng || 106.8078,
      };

      const map = new maps.Map(containerRef.current, {
        center: initialPos,
        zoom: 15,
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
        gestureHandling: 'greedy',
      });
      mapRef.current = map;

      const marker = new maps.Marker({
        position: initialPos,
        map,
        draggable: true,
        animation: maps.Animation.DROP,
        title: 'Geser pin atau klik peta untuk menentukan titik koordinat',
      });
      markerRef.current = marker;

      // Event click on map
      map.addListener('click', (e: any) => {
        const clickedPos = e.latLng;
        marker.setPosition(clickedPos);
        onChange(Number(clickedPos.lat().toFixed(6)), Number(clickedPos.lng().toFixed(6)));
      });

      // Event drag marker
      marker.addListener('dragend', (e: any) => {
        const draggedPos = e.latLng;
        onChange(Number(draggedPos.lat().toFixed(6)), Number(draggedPos.lng().toFixed(6)));
      });
    });

    return () => {
      isSubscribed = false;
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
    };
  }, []);

  // Update marker position when lat/lng change from outside
  useEffect(() => {
    if (markerRef.current && (window as any).google?.maps) {
      const pos = { lat, lng };
      markerRef.current.setPosition(pos);
      if (mapRef.current) {
        mapRef.current.panTo(pos);
      }
    }
  }, [lat, lng]);

  const handleCenterGps = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const curLat = Number(pos.coords.latitude.toFixed(6));
        const curLng = Number(pos.coords.longitude.toFixed(6));
        onChange(curLat, curLng);
        if (mapRef.current) {
          mapRef.current.panTo({ lat: curLat, lng: curLng });
          mapRef.current.setZoom(16);
        }
      });
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height, borderRadius: '8px', overflow: 'hidden', border: '1px solid #CBD5E1' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%', background: '#F1F5F9' }} />

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
