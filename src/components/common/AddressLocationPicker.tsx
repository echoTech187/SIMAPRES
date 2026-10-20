'use client';

import React, { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';

const MiniMapPicker = dynamic(() => import('@/components/MiniMapPicker'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: '220px',
        background: '#F1F5F9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#64748B',
        fontSize: '12px',
        borderRadius: '8px',
      }}
    >
      ⏳ Memuat Peta Interaktif...
    </div>
  ),
});

export interface AddressLocationPickerProps {
  label?: string;
  required?: boolean;
  placeholder?: string;
  value: string;
  lat: number;
  lng: number;
  onChangeAddress: (address: string) => void;
  onChangeCoords: (lat: number, lng: number) => void;
  mapHeight?: string;
  helperText?: string;
  showMapDefault?: boolean;
}

export default function AddressLocationPicker({
  label = 'Alamat Lengkap',
  required = false,
  placeholder = 'Ketik alamat, nama jalan, atau gedung...',
  value,
  lat,
  lng,
  onChangeAddress,
  onChangeCoords,
  mapHeight = '220px',
  helperText,
  showMapDefault = false,
}: AddressLocationPickerProps) {
  const [showMap, setShowMap] = useState(showMapDefault || Boolean(lat && lng && (lat !== 0 || lng !== 0)));
  const [isSearching, setIsSearching] = useState(false);
  const [isLocatingGps, setIsLocatingGps] = useState(false);
  const [suggestions, setSuggestions] = useState<
    Array<{ label: string; subLabel: string; fullAddress: string; lat: number; lng: number }>
  >([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const resolveAddressFromCoords = async (targetLat: number, targetLng: number): Promise<string> => {
    let resolved = '';
    // 1. Photon Komoot Reverse Geocode
    try {
      const res = await fetch(`https://photon.komoot.io/reverse?lat=${targetLat}&lon=${targetLng}`);
      if (res.ok) {
        const data = await res.json();
        const feat = data?.features?.[0]?.properties;
        if (feat) {
          const parts = [
            feat.name,
            feat.housenumber ? `No. ${feat.housenumber}` : '',
            feat.street,
            feat.district,
            feat.city || feat.county,
            feat.state,
          ].filter(Boolean);
          const uniqueParts = Array.from(new Set(parts));
          if (uniqueParts.length > 0) {
            resolved = uniqueParts.join(', ');
          }
        }
      }
    } catch (_) {}

    // 2. OpenStreetMap Nominatim Fallback
    if (!resolved) {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${targetLat}&lon=${targetLng}&zoom=18&addressdetails=1`,
          { headers: { 'Accept-Language': 'id' } }
        );
        if (res.ok) {
          const data = await res.json();
          if (data?.display_name) {
            resolved = data.display_name;
          }
        }
      } catch (_) {}
    }

    return resolved;
  };

  const handleSearch = (query: string) => {
    onChangeAddress(query);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const encoded = encodeURIComponent(query.trim());
        const coordParam = lat && lng ? `&lat=${lat}&lon=${lng}` : '';
        const res = await fetch(`https://photon.komoot.io/api/?q=${encoded}${coordParam}&limit=6`);
        if (res.ok) {
          const data = await res.json();
          const items = (data?.features || []).map((feat: any) => {
            const p = feat.properties || {};
            const coords = feat.geometry?.coordinates || [0, 0];
            const title = p.name || p.street || query;
            const subParts = [p.street, p.district, p.city || p.county, p.state].filter(
              (part) => part && part !== title
            );
            const sub = subParts.join(', ') || 'Lokasi Terdaftar';
            const fullParts = [p.name, p.street, p.district, p.city || p.county].filter(Boolean);
            const full = Array.from(new Set(fullParts)).join(', ') || title;
            return {
              label: title,
              subLabel: sub,
              fullAddress: full,
              lat: Number(coords[1].toFixed(6)),
              lng: Number(coords[0].toFixed(6)),
            };
          });
          setSuggestions(items);
          setShowSuggestions(items.length > 0);
        }
      } catch (err) {
        console.warn('Address search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 280);
  };

  const handleSelectSuggestion = (item: { fullAddress: string; lat: number; lng: number }) => {
    onChangeAddress(item.fullAddress);
    onChangeCoords(item.lat, item.lng);
    setShowSuggestions(false);
    setShowMap(true);
  };

  const handleGetGps = () => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      setIsLocatingGps(true);
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const curLat = Number(pos.coords.latitude.toFixed(6));
          const curLng = Number(pos.coords.longitude.toFixed(6));
          onChangeCoords(curLat, curLng);
          try {
            const addr = await resolveAddressFromCoords(curLat, curLng);
            if (addr) onChangeAddress(addr);
          } catch (_) {}
          setIsLocatingGps(false);
          setShowMap(true);
        },
        () => {
          setIsLocatingGps(false);
          alert('Izin lokasi (GPS) belum aktif di browser Anda. Silakan cari nama jalan atau klik langsung pada peta.');
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  };

  const hasCoords = Boolean(typeof lat === 'number' && typeof lng === 'number' && (lat !== 0 || lng !== 0));

  return (
    <div ref={containerRef} style={{ marginBottom: '14px', position: 'relative' }}>
      {/* Label & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', margin: 0 }}>
          {label} {required && <span style={{ color: 'red' }}>*</span>}
        </label>
        {hasCoords ? (
          <span
            style={{
              fontSize: '10.5px',
              color: '#059669',
              background: '#ECFDF5',
              border: '1px solid #A7F3D0',
              padding: '1px 8px',
              borderRadius: '999px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>✓</span> Titik Peta Terkunci
          </span>
        ) : (
          <span style={{ fontSize: '10.5px', color: '#94A3B8', fontWeight: 600 }}>
            Titik koordinat belum ditentukan
          </span>
        )}
      </div>

      {/* Input Field with Search & GPS icon */}
      <div style={{ position: 'relative', width: '100%' }}>
        <input
          type="text"
          required={required}
          placeholder={placeholder}
          value={value}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) setShowSuggestions(true);
          }}
          style={{
            width: '100%',
            padding: '9px 70px 9px 12px',
            borderRadius: '8px',
            border: '1px solid #CBD5E1',
            fontSize: '12.5px',
            boxSizing: 'border-box',
            outline: 'none',
            transition: 'border-color 0.2s',
          }}
        />

        {/* Loading Spinner */}
        {isSearching && (
          <div
            style={{
              position: 'absolute',
              right: '38px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '11px',
              color: '#3B82F6',
            }}
          >
            🔄
          </div>
        )}

        {/* Quick GPS Button */}
        <button
          type="button"
          onClick={handleGetGps}
          title="Gunakan Lokasi GPS Saat Ini"
          disabled={isLocatingGps}
          style={{
            position: 'absolute',
            right: '6px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            cursor: isLocatingGps ? 'wait' : 'pointer',
            fontSize: '16px',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isLocatingGps ? '⏳' : '📍'}
        </button>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              left: 0,
              right: 0,
              background: '#FFFFFF',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              boxShadow: '0 12px 28px -4px rgba(0, 0, 0, 0.25)',
              zIndex: 9999,
              maxHeight: '260px',
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                padding: '6px 10px',
                background: '#F8FAFC',
                borderBottom: '1px solid #E2E8F0',
                fontSize: '10.5px',
                fontWeight: 700,
                color: '#64748B',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>📍 HASIL PENCARIAN ALAMAT &amp; TEMPAT</span>
              <span
                style={{ cursor: 'pointer', color: '#94A3B8' }}
                onClick={() => setShowSuggestions(false)}
              >
                ✕ Tutup
              </span>
            </div>
            {suggestions.map((item, idx) => (
              <div
                key={idx}
                onClick={() => handleSelectSuggestion(item)}
                style={{
                  padding: '9px 12px',
                  cursor: 'pointer',
                  borderBottom: idx < suggestions.length - 1 ? '1px solid #F1F5F9' : 'none',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#EFF6FF')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
              >
                <span style={{ fontSize: '16px', lineHeight: 1.2 }}>📍</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '12.5px',
                      fontWeight: 700,
                      color: '#1E293B',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {item.label}
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      color: '#64748B',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {item.subLabel}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: '10px',
                    color: '#2563EB',
                    background: '#DBEAFE',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontWeight: 700,
                    alignSelf: 'center',
                  }}
                >
                  PILIH
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {helperText && (
        <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
          {helperText}
        </div>
      )}

      {/* Button to Toggle Interactive Map */}
      <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          type="button"
          onClick={() => setShowMap(!showMap)}
          style={{
            background: showMap ? '#EFF6FF' : '#F8FAFC',
            color: showMap ? '#1D4ED8' : '#334155',
            border: showMap ? '1px solid #BFDBFE' : '1px solid #CBD5E1',
            padding: '5px 10px',
            borderRadius: '6px',
            fontSize: '11.5px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            transition: 'all 0.15s ease',
          }}
        >
          <span>🗺️</span>
          <span>{showMap ? 'Sembunyikan Peta' : 'Pilih Titik di Peta'}</span>
        </button>

        {hasCoords && (
          <span style={{ fontSize: '10.5px', color: '#64748B', fontFamily: 'monospace' }}>
            Lat/Lng tersimpan otomatis
          </span>
        )}
      </div>

      {/* Interactive Map Picker Container */}
      {showMap && (
        <div
          style={{
            marginTop: '8px',
            border: '1.5px solid #93C5FD',
            borderRadius: '10px',
            overflow: 'hidden',
            background: '#F8FAFC',
            padding: '8px',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.08)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '6px',
              padding: '0 2px',
            }}
          >
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#1E40AF', display: 'flex', alignItems: 'center', gap: '4px' }}>
              📍 Klik peta atau geser pin untuk menentukan titik lokasi
            </span>
            <span style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 600 }}>
              Live Google Maps
            </span>
          </div>

          <MiniMapPicker
            lat={lat}
            lng={lng}
            height={mapHeight}
            onChange={(newLat, newLng) => {
              onChangeCoords(newLat, newLng);
              resolveAddressFromCoords(newLat, newLng).then((addr) => {
                if (addr) onChangeAddress(addr);
              });
            }}
            onAddressChange={(alamat) => {
              if (alamat) onChangeAddress(alamat);
            }}
          />
        </div>
      )}

      {/* Hidden coordinates inputs for clean form handling */}
      <input type="hidden" name="latitude" value={lat || ''} />
      <input type="hidden" name="longitude" value={lng || ''} />
    </div>
  );
}
