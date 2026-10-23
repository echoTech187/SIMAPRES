'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';

const MiniMapPicker = dynamic(() => import('@/components/MiniMapPicker'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: '100%',
        width: '100%',
        background: '#0F172A',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#94A3B8',
        fontSize: '13px',
        gap: '8px',
      }}
    >
      <div style={{ fontSize: '24px' }}>⏳</div>
      <div>Memuat Google Maps Interaktif...</div>
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
  helperText,
}: AddressLocationPickerProps) {
  const [mounted, setMounted] = useState(false);
  const [isFullscreenMapOpen, setIsFullscreenMapOpen] = useState(false);

  // Temporary coordinates & address for fullscreen map interaction
  const [tempLat, setTempLat] = useState<number>(lat || 0);
  const [tempLng, setTempLng] = useState<number>(lng || 0);
  const [tempAddress, setTempAddress] = useState<string>(value || '');

  // Main input search states
  const [isSearching, setIsSearching] = useState(false);
  const [isLocatingGps, setIsLocatingGps] = useState(false);
  const [suggestions, setSuggestions] = useState<
    Array<{ label: string; subLabel: string; fullAddress: string; lat: number; lng: number }>
  >([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Fullscreen map header search states
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const [modalSuggestions, setModalSuggestions] = useState<
    Array<{ label: string; subLabel: string; fullAddress: string; lat: number; lng: number }>
  >([]);
  const [isModalSearching, setIsModalSearching] = useState(false);
  const [showModalSuggestions, setShowModalSuggestions] = useState(false);
  const [isModalLocatingGps, setIsModalLocatingGps] = useState(false);

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const modalSearchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const modalSearchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync temp values whenever props change and modal is not open
  useEffect(() => {
    if (!isFullscreenMapOpen) {
      setTempLat(lat || 0);
      setTempLng(lng || 0);
      setTempAddress(value || '');
    }
  }, [lat, lng, value, isFullscreenMapOpen]);

  // Lock body scroll and trigger window resize when modal opens
  useEffect(() => {
    if (isFullscreenMapOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      const resizeTimer = setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 150);
      return () => {
        document.body.style.overflow = prevOverflow;
        clearTimeout(resizeTimer);
      };
    }
  }, [isFullscreenMapOpen]);

  // Close main suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
      if (modalSearchContainerRef.current && !modalSearchContainerRef.current.contains(e.target as Node)) {
        setShowModalSuggestions(false);
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

  // Main input search handler
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
        },
        () => {
          setIsLocatingGps(false);
          alert('Izin lokasi (GPS) belum aktif di browser Anda. Silakan cari nama jalan atau buka peta fullscreen.');
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  };

  // Open Fullscreen Map Modal
  const openFullscreenMap = () => {
    setTempLat(lat || 0);
    setTempLng(lng || 0);
    setTempAddress(value || '');
    setModalSearchQuery(value || '');
    setModalSuggestions([]);
    setShowModalSuggestions(false);
    setIsFullscreenMapOpen(true);
  };

  // Confirm and apply location from Fullscreen Map Modal
  const handleConfirmLocation = () => {
    if (tempLat && tempLng) {
      onChangeCoords(tempLat, tempLng);
    }
    if (tempAddress) {
      onChangeAddress(tempAddress);
    }
    setIsFullscreenMapOpen(false);
  };

  // Fullscreen Modal Search Handler
  const handleModalSearch = (query: string) => {
    setModalSearchQuery(query);
    if (modalSearchTimeoutRef.current) clearTimeout(modalSearchTimeoutRef.current);

    if (!query || query.trim().length < 2) {
      setModalSuggestions([]);
      setShowModalSuggestions(false);
      return;
    }

    setIsModalSearching(true);
    modalSearchTimeoutRef.current = setTimeout(async () => {
      try {
        const encoded = encodeURIComponent(query.trim());
        const coordParam = tempLat && tempLng ? `&lat=${tempLat}&lon=${tempLng}` : '';
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
          setModalSuggestions(items);
          setShowModalSuggestions(items.length > 0);
        }
      } catch (err) {
        console.warn('Modal search error:', err);
      } finally {
        setIsModalSearching(false);
      }
    }, 280);
  };

  const handleSelectModalSuggestion = (item: { fullAddress: string; lat: number; lng: number }) => {
    setTempLat(item.lat);
    setTempLng(item.lng);
    setTempAddress(item.fullAddress);
    setModalSearchQuery(item.fullAddress);
    setShowModalSuggestions(false);
  };

  const handleModalGetGps = () => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      setIsModalLocatingGps(true);
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const curLat = Number(pos.coords.latitude.toFixed(6));
          const curLng = Number(pos.coords.longitude.toFixed(6));
          setTempLat(curLat);
          setTempLng(curLng);
          try {
            const addr = await resolveAddressFromCoords(curLat, curLng);
            if (addr) {
              setTempAddress(addr);
              setModalSearchQuery(addr);
            }
          } catch (_) {}
          setIsModalLocatingGps(false);
        },
        () => {
          setIsModalLocatingGps(false);
          alert('Izin lokasi (GPS) belum aktif di browser Anda.');
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  };

  const hasCoords = Boolean(typeof lat === 'number' && typeof lng === 'number' && (lat !== 0 || lng !== 0));

  return (
    <div ref={containerRef} style={{ marginBottom: '14px', position: 'relative' }}>
      {/* Label & Status */}
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

        {/* Autocomplete Suggestions Dropdown */}
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

      {/* FULLSCREEN MAP TRIGGER CARD (Replaces the old cramped inline map) */}
      <div
        style={{
          marginTop: '10px',
          padding: '12px 14px',
          background: hasCoords ? '#F0FDF4' : '#F8FAFC',
          border: hasCoords ? '1.5px solid #86EFAC' : '1.5px dashed #CBD5E1',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          boxShadow: hasCoords ? '0 2px 6px rgba(16, 185, 129, 0.08)' : 'none',
          transition: 'all 0.2s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: hasCoords ? '#DCFCE7' : '#E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              flexShrink: 0,
            }}
          >
            {hasCoords ? '📍' : '🗺️'}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: hasCoords ? '#14532D' : '#334155' }}>
              {hasCoords ? 'Titik Koordinat Terkunci di Peta' : 'Peta Belum Ditentukan'}
            </div>
            <div
              style={{
                fontSize: '11px',
                color: hasCoords ? '#15803D' : '#64748B',
                fontFamily: hasCoords ? 'monospace' : 'inherit',
                fontWeight: hasCoords ? 700 : 500,
                marginTop: '1px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {hasCoords
                ? `Lat: ${lat.toFixed(6)} | Lng: ${lng.toFixed(6)}`
                : 'Buka peta fullscreen untuk mencari & mengunci titik lokasi yang presisi'}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={openFullscreenMap}
          style={{
            padding: '8px 16px',
            background: hasCoords ? '#FFFFFF' : '#2563EB',
            color: hasCoords ? '#15803D' : '#FFFFFF',
            border: hasCoords ? '1.5px solid #86EFAC' : 'none',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: hasCoords ? '0 1px 3px rgba(0,0,0,0.05)' : '0 2px 8px rgba(37,99,235,0.25)',
            transition: 'all 0.15s ease',
            flexShrink: 0,
          }}
        >
          <span>🗺️</span>
          <span>{hasCoords ? 'Ubah di Peta Fullscreen' : 'Buka Peta Fullscreen'}</span>
          <span style={{ fontSize: '11px', opacity: 0.8 }}>↗</span>
        </button>
      </div>

      {/* FULLSCREEN MAP MODAL (PORTALED TO BODY FOR TOTAL FULLSCREEN IMMUNITY) */}
      {mounted && isFullscreenMapOpen && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Peta Fullscreen Penentuan Titik Lokasi"
          style={{
            position: 'fixed',
            inset: 0,
            width: '100vw',
            height: '100vh',
            maxWidth: '100vw',
            maxHeight: '100vh',
            zIndex: 10000000,
            backgroundColor: '#0F172A',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* HEADER TOOLBAR (DARK SLEEK DESIGN) */}
          <div
            style={{
              padding: '12px 18px',
              backgroundColor: '#1E293B',
              borderBottom: '1px solid #334155',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
              zIndex: 30,
            }}
          >
            {/* Title & Coordinate Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  background: '#2563EB',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  fontWeight: 700,
                  boxShadow: '0 2px 8px rgba(37,99,235,0.3)',
                }}
              >
                🗺️
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#F8FAFC' }}>
                  Peta Fullscreen — Tentukan Titik Lokasi
                </div>
                <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '1px' }}>
                  {tempLat && tempLng ? (
                    <span style={{ color: '#34D399', fontWeight: 600, fontFamily: 'monospace' }}>
                      ✓ Terkunci: {tempLat.toFixed(6)}, {tempLng.toFixed(6)}
                    </span>
                  ) : (
                    <span>Klik peta atau geser pin merah untuk mengunci titik</span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Search Box inside Fullscreen Map */}
            <div
              ref={modalSearchContainerRef}
              style={{
                position: 'relative',
                flex: 1,
                minWidth: '240px',
                maxWidth: '480px',
              }}
            >
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: '10px',
                    fontSize: '13px',
                    color: '#64748B',
                    pointerEvents: 'none',
                  }}
                >
                  🔍
                </span>
                <input
                  type="text"
                  placeholder="Cari jalan, gedung, kantor polisi, kota..."
                  value={modalSearchQuery}
                  onChange={(e) => handleModalSearch(e.target.value)}
                  onFocus={() => {
                    if (modalSuggestions.length > 0) setShowModalSuggestions(true);
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 32px 8px 32px',
                    borderRadius: '8px',
                    border: '1px solid #475569',
                    background: '#0F172A',
                    color: '#F8FAFC',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                {isModalSearching && (
                  <span style={{ position: 'absolute', right: '10px', fontSize: '11px', color: '#38BDF8' }}>
                    🔄
                  </span>
                )}
                {modalSearchQuery && !isModalSearching && (
                  <button
                    type="button"
                    onClick={() => {
                      setModalSearchQuery('');
                      setModalSuggestions([]);
                      setShowModalSuggestions(false);
                    }}
                    style={{
                      position: 'absolute',
                      right: '6px',
                      background: 'none',
                      border: 'none',
                      color: '#94A3B8',
                      cursor: 'pointer',
                      fontSize: '13px',
                      padding: '2px 6px',
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Suggestions floating list in modal */}
              {showModalSuggestions && modalSuggestions.length > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    left: 0,
                    right: 0,
                    background: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    boxShadow: '0 12px 28px rgba(0,0,0,0.5)',
                    zIndex: 100,
                    maxHeight: '260px',
                    overflowY: 'auto',
                  }}
                >
                  {modalSuggestions.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSelectModalSuggestion(item)}
                      style={{
                        padding: '10px 12px',
                        cursor: 'pointer',
                        borderBottom: idx < modalSuggestions.length - 1 ? '1px solid #334155' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#334155')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <span style={{ fontSize: '14px' }}>📍</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '12.5px',
                            fontWeight: 600,
                            color: '#F8FAFC',
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
                            color: '#94A3B8',
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
                          fontWeight: 700,
                          color: '#38BDF8',
                          background: 'rgba(56,189,248,0.15)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        PILIH
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions (GPS & Close) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={handleModalGetGps}
                disabled={isModalLocatingGps}
                style={{
                  background: '#334155',
                  color: '#F8FAFC',
                  border: '1px solid #475569',
                  borderRadius: '7px',
                  padding: '7px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: isModalLocatingGps ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'background 0.15s ease',
                }}
              >
                <span>{isModalLocatingGps ? '⏳' : '📍'}</span>
                <span>GPS Saya</span>
              </button>

              <button
                type="button"
                onClick={() => setIsFullscreenMapOpen(false)}
                title="Tutup Peta Fullscreen"
                style={{
                  background: '#EF4444',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '7px',
                  padding: '7px 14px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: '0 2px 6px rgba(239, 68, 68, 0.3)',
                }}
              >
                <span>✕</span>
                <span>Tutup</span>
              </button>
            </div>
          </div>

          {/* MAP CANVAS (FULLSCREEN 100% HEIGHT) */}
          <div style={{ flex: 1, position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
            {/* Floating guidance pill */}
            <div
              style={{
                position: 'absolute',
                top: '12px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(15, 23, 42, 0.88)',
                color: '#F8FAFC',
                backdropFilter: 'blur(4px)',
                padding: '6px 16px',
                borderRadius: '999px',
                fontSize: '12px',
                fontWeight: 600,
                zIndex: 20,
                boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
              }}
            >
              <span>💡</span> Klik peta atau geser pin merah untuk mengunci titik lokasi yang akurat
            </div>

            <MiniMapPicker
              lat={tempLat}
              lng={tempLng}
              height="100%"
              fallbackCenter={{ lat: -7.026803, lng: 109.592982 }}
              onChange={(newLat, newLng) => {
                setTempLat(newLat);
                setTempLng(newLng);
                resolveAddressFromCoords(newLat, newLng).then((addr) => {
                  if (addr) {
                    setTempAddress(addr);
                    setModalSearchQuery(addr);
                  }
                });
              }}
              onAddressChange={(alamat) => {
                if (alamat) {
                  setTempAddress(alamat);
                  setModalSearchQuery(alamat);
                }
              }}
            />
          </div>

          {/* BOTTOM FLOATING CONFIRMATION BAR */}
          <div
            style={{
              padding: '12px 20px',
              backgroundColor: '#FFFFFF',
              borderTop: '1px solid #E2E8F0',
              boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
              zIndex: 30,
            }}
          >
            {/* Location display info */}
            <div style={{ flex: 1, minWidth: '220px' }}>
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#0F172A',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span style={{ color: '#2563EB' }}>📍</span>
                <span
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '650px',
                  }}
                >
                  {tempAddress || 'Geser atau klik peta untuk memilih lokasi...'}
                </span>
              </div>
              <div
                style={{
                  fontSize: '11px',
                  color: '#64748B',
                  fontFamily: 'monospace',
                  fontWeight: 600,
                  marginTop: '2px',
                }}
              >
                {tempLat && tempLng ? (
                  <span style={{ color: '#059669' }}>
                    📐 Latitude: {tempLat.toFixed(6)} | Longitude: {tempLng.toFixed(6)}
                  </span>
                ) : (
                  <span style={{ color: '#DC2626' }}>⚠️ Titik koordinat belum ditentukan</span>
                )}
              </div>
            </div>

            {/* Confirm & Cancel Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setIsFullscreenMapOpen(false)}
                style={{
                  padding: '9px 18px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  background: '#F8FAFC',
                  color: '#475569',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                }}
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleConfirmLocation}
                disabled={!tempLat || !tempLng}
                style={{
                  padding: '9px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  background: tempLat && tempLng ? '#2563EB' : '#94A3B8',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: tempLat && tempLng ? 'pointer' : 'not-allowed',
                  boxShadow: tempLat && tempLng ? '0 4px 14px rgba(37,99,235,0.35)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>✓</span>
                <span>Gunakan &amp; Kunci Titik Ini</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Hidden coordinates inputs for standard HTML form compatibility */}
      <input type="hidden" name="latitude" value={lat || ''} />
      <input type="hidden" name="longitude" value={lng || ''} />
    </div>
  );
}
