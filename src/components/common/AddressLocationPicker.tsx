'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import {
  searchIndonesianLocations,
  type LocationSuggestionItem,
} from '@/infrastructure/services/indonesian-location-search.service';

const MiniMapPicker = dynamic(() => import('@/components/maps/MiniMapPicker'), {
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
  const [suggestions, setSuggestions] = useState<LocationSuggestionItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Fullscreen map header search states
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const [modalSuggestions, setModalSuggestions] = useState<LocationSuggestionItem[]>([]);
  const [isModalSearching, setIsModalSearching] = useState(false);
  const [showModalSuggestions, setShowModalSuggestions] = useState(false);
  const [isModalLocatingGps, setIsModalLocatingGps] = useState(false);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(true);

  // Active Map Center for Proximity & Nearby Searches (Tangerang, Pekalongan, etc.)
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
    lat: lat && lat !== 0 ? lat : -7.035505,
    lng: lng && lng !== 0 ? lng : 109.576103,
  });

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const modalSearchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const modalSearchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const curLat = Number(pos.coords.latitude.toFixed(6));
          const curLng = Number(pos.coords.longitude.toFixed(6));
          setMapCenter({ lat: curLat, lng: curLng });
        },
        () => {},
        { timeout: 6000, maximumAge: 60000 }
      );
    }
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



  // Main input search handler (Using Multi-Tier Indonesian & Police Station Search Engine)
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
        const items = await searchIndonesianLocations(query, {
          lat: lat || mapCenter.lat,
          lng: lng || mapCenter.lng,
          mapCenter,
          limit: 1000,
        });
        setSuggestions(items);
        setShowSuggestions(items.length > 0);
      } catch (err) {
        console.warn('Address search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 200);
  };

  const handleSelectSuggestion = (item: { fullAddress?: string; lat: number; lng: number; label?: string }) => {
    onChangeAddress(item.fullAddress || item.label || '');
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
    setIsSidePanelOpen(true);
    setIsFullscreenMapOpen(true);
    if (value && value.trim().length >= 2) {
      handleModalSearch(value.trim());
    }
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

  // Fullscreen Modal Search Handler (Using Multi-Tier Indonesian & Police Station Search Engine)
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
        const items = await searchIndonesianLocations(query, {
          lat: tempLat || mapCenter.lat,
          lng: tempLng || mapCenter.lng,
          mapCenter,
          limit: 1000,
        });
        setModalSuggestions(items);
        setShowModalSuggestions(items.length > 0);
      } catch (err) {
        console.warn('Modal search error:', err);
      } finally {
        setIsModalSearching(false);
      }
    }, 200);
  };

  const handleSelectModalSuggestion = (item: { fullAddress?: string; lat: number; lng: number; label?: string }) => {
    setTempLat(item.lat);
    setTempLng(item.lng);
    setTempAddress(item.fullAddress || item.label || '');
    setModalSearchQuery(item.fullAddress || item.label || '');
    setShowModalSuggestions(false);
    setMapCenter({ lat: item.lat, lng: item.lng });
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
                <span style={{ fontSize: '16px', lineHeight: 1.2 }}>
                  {item.isPoliceStation ? '👮' : '📍'}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '12.5px',
                      fontWeight: 700,
                      color: item.isPoliceStation ? '#1D4ED8' : '#1E293B',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <span>{item.label}</span>
                    {item.isPoliceStation && (
                      <span
                        style={{
                          fontSize: '9px',
                          fontWeight: 800,
                          background: '#EFF6FF',
                          color: '#1D4ED8',
                          padding: '1px 5px',
                          borderRadius: '4px',
                          border: '1px solid #BFDBFE',
                        }}
                      >
                        POLRI
                      </span>
                    )}
                    {item.distanceText && (
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          color: '#059669',
                          background: '#ECFDF5',
                          padding: '1px 5px',
                          borderRadius: '4px',
                          border: '1px solid #A7F3D0',
                          fontFamily: 'monospace',
                        }}
                      >
                        {item.distanceText}
                      </span>
                    )}
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
                      <span style={{ fontSize: '14px' }}>
                        {item.isPoliceStation ? '👮' : '📍'}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '12.5px',
                            fontWeight: 600,
                            color: item.isPoliceStation ? '#60A5FA' : '#F8FAFC',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <span>{item.label}</span>
                          {item.isPoliceStation && (
                            <span
                              style={{
                                fontSize: '9px',
                                fontWeight: 800,
                                background: '#1E3A8A',
                                color: '#93C5FD',
                                padding: '1px 5px',
                                borderRadius: '4px',
                                border: '1px solid #3B82F6',
                              }}
                            >
                              POLRI
                            </span>
                          )}
                          {item.distanceText && (
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                color: '#34D399',
                                background: 'rgba(52, 211, 153, 0.15)',
                                padding: '1px 5px',
                                borderRadius: '4px',
                                border: '1px solid rgba(52, 211, 153, 0.3)',
                                fontFamily: 'monospace',
                              }}
                            >
                              {item.distanceText}
                            </span>
                          )}
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

          {/* MAIN BODY: GOOGLE MAPS SIDEBAR + MAP CANVAS */}
          <div style={{ flex: 1, display: 'flex', position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
            {/* GOOGLE MAPS-STYLE RESULTS SIDEBAR */}
            {isSidePanelOpen && modalSuggestions.length > 0 && (
              <div
                style={{
                  width: '360px',
                  maxWidth: '90vw',
                  height: '100%',
                  background: '#1E293B',
                  borderRight: '1px solid #334155',
                  display: 'flex',
                  flexDirection: 'column',
                  zIndex: 25,
                  boxShadow: '4px 0 20px rgba(0,0,0,0.35)',
                  flexShrink: 0,
                }}
              >
                {/* Sidebar Header */}
                <div
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #334155',
                    background: '#0F172A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '15px' }}>🛡️</span>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#F8FAFC' }}>
                        Daftar Lokasi Terpilih
                      </div>
                      <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                        {modalSuggestions.length} hasil · Klik untuk kunci titik
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSidePanelOpen(false)}
                    title="Sembunyikan Panel"
                    style={{
                      background: '#334155',
                      border: 'none',
                      color: '#CBD5E1',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    ◀ Sembunyikan
                  </button>
                </div>

                {/* Sidebar Scrollable Card List */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
                  {modalSuggestions.map((item, idx) => {
                    const isSelected =
                      tempLat && tempLng && Math.abs(item.lat - tempLat) < 0.0002 && Math.abs(item.lng - tempLng) < 0.0002;
                    return (
                      <div
                        key={idx}
                        onClick={() => handleSelectModalSuggestion(item)}
                        style={{
                          padding: '12px',
                          marginBottom: '8px',
                          background: isSelected ? 'rgba(37, 99, 235, 0.22)' : '#0F172A',
                          border: isSelected ? '1.5px solid #3B82F6' : '1px solid #334155',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          boxShadow: isSelected ? '0 0 12px rgba(59, 130, 246, 0.25)' : 'none',
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) e.currentTarget.style.borderColor = '#60A5FA';
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) e.currentTarget.style.borderColor = '#334155';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 800, color: item.isPoliceStation ? '#60A5FA' : '#F8FAFC', lineHeight: 1.25 }}>
                            {item.label}
                          </span>
                          {item.distanceText && (
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 800,
                                color: '#34D399',
                                background: 'rgba(52, 211, 153, 0.15)',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                border: '1px solid rgba(52, 211, 153, 0.3)',
                                fontFamily: 'monospace',
                                whiteSpace: 'nowrap',
                                flexShrink: 0,
                              }}
                            >
                              {item.distanceText}
                            </span>
                          )}
                        </div>

                        <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '8px', lineHeight: 1.35 }}>
                          {item.fullAddress || item.subLabel}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span
                            style={{
                              fontSize: '9px',
                              fontWeight: 800,
                              color: item.isPoliceStation ? '#93C5FD' : '#FED7AA',
                              background: item.isPoliceStation ? '#1E3A8A' : '#7C2D12',
                              padding: '2px 6px',
                              borderRadius: '4px',
                            }}
                          >
                            {item.isPoliceStation ? (item.stationType || 'POLRI') : 'LOKASI'}
                          </span>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              color: isSelected ? '#10B981' : '#38BDF8',
                              background: isSelected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                              padding: '3px 8px',
                              borderRadius: '5px',
                            }}
                          >
                            {isSelected ? '✓ Terpilih' : 'Pilih Lokasi'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Expand Sidebar Button if Collapsed */}
            {!isSidePanelOpen && modalSuggestions.length > 0 && (
              <button
                type="button"
                onClick={() => setIsSidePanelOpen(true)}
                style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  zIndex: 22,
                  background: '#1E293B',
                  color: '#F8FAFC',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  padding: '7px 12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                }}
              >
                <span>▶</span>
                <span>Lihat Hasil ({modalSuggestions.length})</span>
              </button>
            )}

            {/* Floating guidance pill */}
            <div
              style={{
                position: 'absolute',
                top: '12px',
                left: isSidePanelOpen && modalSuggestions.length > 0 ? 'calc(50% + 180px)' : '50%',
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
                transition: 'left 0.2s ease',
              }}
            >
              <span>💡</span> Klik pin merah di peta atau geser pin untuk mengunci titik koordinat
            </div>

            <MiniMapPicker
              lat={tempLat}
              lng={tempLng}
              height="100%"
              fallbackCenter={mapCenter}
              onCenterChange={(c) => setMapCenter(c)}
              searchResultMarkers={modalSuggestions}
              onSelectSearchResultMarker={handleSelectModalSuggestion}
              onChange={(newLat, newLng) => {
                setTempLat(newLat);
                setTempLng(newLng);
                setMapCenter({ lat: newLat, lng: newLng });
               
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
                  {tempAddress}
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
