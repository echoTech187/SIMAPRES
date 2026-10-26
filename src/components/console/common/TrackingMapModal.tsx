'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Radio,
  Navigation,
  MapPin,
  X,
  Shield,
  Clock,
  Layers,
  LocateFixed,
  AlertTriangle,
  Compass,
  CheckCircle2,
  Car,
} from 'lucide-react';
import SimapresGoogleMap, { MapUnitData } from '@/components/SimapresGoogleMap';

interface TrackingMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  complaint: any;
  assignedOfficer?: any;
  fleetUnits?: any[];
}

function getDistanceFromLatLonInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export default function TrackingMapModal({
  isOpen,
  onClose,
  complaint,
  assignedOfficer,
  fleetUnits = [],
}: TrackingMapModalProps) {
  const [showTraffic, setShowTraffic] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll saat modal fullscreen pelacakan aktif (mencegah scroll/gesture tembus)
  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen]);

  // Modal maps terkunci penuh, tidak dapat tertutup sendiri (dismiss) tanpa klik tombol Tutup resmi

  // Cek apakah personel sudah meluncur / berangkat
  const isDeparted = useMemo(() => {
    if (!complaint) return false;
    const status = String(complaint.status || '').toUpperCase();
    const tahap = Number(complaint.tahap) || 1;
    const primaryDispatch = (complaint.dispatches || []).find((d: any) => d.is_primary_unit) || (complaint.dispatches || [])[0];
    const hasDepartedAt = Boolean(complaint.waktuMeluncur || primaryDispatch?.departed_at);
    return tahap >= 3 || status === 'SELESAI' || status === 'MENUNGGU_PENGESAHAN' || hasDepartedAt;
  }, [complaint]);

  // Resolusi Officer & Posisi GPS
  const officer = useMemo(() => {
    return assignedOfficer || complaint?.assignedOfficer || complaint?.dispatches?.[0]?.officer || null;
  }, [assignedOfficer, complaint]);

  // Format Nama & Pangkat Tanpa Duplikasi (Anti Dobel "BRIPKA Bripka")
  const cleanRank = useMemo(() => {
    return (officer?.rankPangkat || officer?.rank_pangkat || '').trim();
  }, [officer]);

  const cleanName = useMemo(() => {
    let name = (officer?.namaLengkap || officer?.user?.full_name || officer?.name || 'Petugas Lapangan').trim();
    if (cleanRank) {
      // Hapus repetisi pangkat jika muncul di awal nama secara berulang (case-insensitive)
      const rankPattern = new RegExp(`^(${cleanRank}\\s*)+`, 'i');
      name = name.replace(rankPattern, '').trim();
    }
    return name;
  }, [officer, cleanRank]);

  const displayOfficerTitle = cleanRank ? `${cleanRank} ${cleanName}` : cleanName;
  const officerNrp = officer?.nrp || officer?.user?.identifier || '-';
  const officerVehicle = officer?.assignedPatrolVehicle || officer?.kendaraan || 'R2-PERINTIS-12';

  const officerGps = useMemo(() => {
    if (officer?.currentLat && officer?.currentLng) {
      return { lat: Number(officer.currentLat), lng: Number(officer.currentLng) };
    }
    if (officer?.current_lat && officer?.current_lng) {
      return { lat: Number(officer.current_lat), lng: Number(officer.current_lng) };
    }
    if (complaint?.koordinatGps && !complaint.koordinatGps.includes('NaN')) {
      const parts = complaint.koordinatGps.split(',').map((s: string) => Number(s.trim()));
      if (parts[0] && parts[1]) {
        return { lat: parts[0], lng: parts[1] };
      }
    }
    if (complaint?.tkpLat && complaint?.tkpLng) {
      return {
        lat: Number(complaint.tkpLat) - 0.015,
        lng: Number(complaint.tkpLng) - 0.018,
      };
    }
    return { lat: -6.8903, lng: 109.6804 };
  }, [officer, complaint]);

  // Cari armada yang cocok dari fleetUnits jika ada
  const matchingUnit = useMemo(() => {
    if (!fleetUnits || !fleetUnits.length) return null;
    return fleetUnits.find((u: any) =>
      (officerNrp && officerNrp !== '-' && (u.nrp === officerNrp || u.key?.includes(officerNrp))) ||
      (cleanName && u.petugas?.toLowerCase().includes(cleanName.toLowerCase()))
    );
  }, [fleetUnits, officerNrp, cleanName]);

  // Helper: Deteksi apakah teks merupakan alamat tujuan tiket / TKP
  const isDestinationOrTkpAddress = (txt?: string | null) => {
    if (!txt) return true;
    const lower = txt.toLowerCase();
    if (lower.startsWith('meluncur ke') || lower.startsWith('menuju') || lower.includes('meluncur')) {
      return true;
    }
    if (complaint?.tkpAlamatTeks && lower.includes(complaint.tkpAlamatTeks.toLowerCase())) {
      return true;
    }
    return false;
  };

  // REVERSE GEOCODING: Tampilkan Alamat Fisik/Jalan Personil Saat Ini (Bukan Koordinat, dan BUKAN Alamat Tujuan Tiket)
  const [officerAddress, setOfficerAddress] = useState<string>(() => {
    if (officer?.station?.address && !isDeparted) {
      return `${officer.station.station_name || 'Mako Sat Samapta'}, ${officer.station.address}`;
    }
    return 'Memuat alamat lokasi personel...';
  });

  useEffect(() => {
    if (!isOpen || !officerGps?.lat || !officerGps?.lng) return;

    let isMounted = true;
    const { lat, lng } = officerGps;

    // 1. Google Maps Geocoder RESMI (Mengonversi koordinat posisi GPS riil personel saat itu)
    const runGoogleGeocoder = () => {
      if (
        typeof window !== 'undefined' &&
        !(window as any).__googleGeocoderDisabled &&
        (window as any).google?.maps?.Geocoder
      ) {
        try {
          const geocoder = new (window as any).google.maps.Geocoder();
          geocoder.geocode({ location: { lat, lng } }, (results: any, status: any) => {
            if (!isMounted) return;
            if (status === 'OK' && results && results[0]?.formatted_address) {
              const full = results[0].formatted_address;
              // Bersihkan plus-code jika ada (misal "4P7R+2M Pekalongan, ...")
              const clean = full.replace(/^[A-Z0-9\+]+\s+/, '').trim();
              if (!isDestinationOrTkpAddress(clean)) {
                setOfficerAddress(clean || full);
              }
            } else if (status === 'REQUEST_DENIED' || status === 'OVER_QUERY_LIMIT') {
              (window as any).__googleGeocoderDisabled = true;
            }
          });
          return true;
        } catch (_) { }
      }
      return false;
    };

    const googleRan = runGoogleGeocoder();

    // 2. Polling bila SDK Google Maps sedang dimuat
    let checkInterval: any = null;
    if (!googleRan) {
      let attempts = 0;
      checkInterval = setInterval(() => {
        attempts++;
        if (runGoogleGeocoder() || attempts > 15) {
          clearInterval(checkInterval);
        }
      }, 400);
    }

    // 3. Fallback Reverse Geocoding via Nominatim (Langsung mencari nama jalan posisi personel)
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
      headers: { 'Accept-Language': 'id' },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted || !data?.display_name) return;
        const a = data.address || {};
        const road = a.road || a.pedestrian || a.street || '';
        const suburb = a.suburb || a.village || a.neighbourhood || '';
        const city = a.city || a.town || a.county || a.city_district || '';
        const parts = [road, suburb, city].filter(Boolean);
        const formatted = parts.length > 0 ? parts.join(', ') : data.display_name;
        if (formatted && !isDestinationOrTkpAddress(formatted)) {
          setOfficerAddress(formatted);
        }
      })
      .catch(() => { });

    // 4. Fallback kewilayahan posisi personel (Jalan tempat armada bersiap di Pekalongan)
    const fallbackTimeout = setTimeout(() => {
      if (isMounted) {
        setOfficerAddress((prev) => {
          if (!prev || prev.includes('Memuat') || isDestinationOrTkpAddress(prev)) {
            return 'Jl. Karya Bakti, Medono, Pekalongan Barat, Kota Pekalongan';
          }
          return prev;
        });
      }
    }, 2000);

    return () => {
      isMounted = false;
      if (checkInterval) clearInterval(checkInterval);
      clearTimeout(fallbackTimeout);
    };
  }, [isOpen, officerGps, isDeparted]);

  const tkpGps = useMemo(() => {
    if (!complaint?.tkpLat || !complaint?.tkpLng) return null;
    return { lat: Number(complaint.tkpLat), lng: Number(complaint.tkpLng) };
  }, [complaint]);

  const destinationAddress = useMemo(() => {
    return complaint?.tkpAlamatTeks || complaint?.tkp_alamat_teks || complaint?.alamatKejadian || complaint?.alamat || 'Lokasi TKP Kejadian';
  }, [complaint]);

  // Telemetri Jarak & ETA
  const distanceMeters = useMemo(() => {
    if (!officerGps || !tkpGps) return null;
    return getDistanceFromLatLonInMeters(officerGps.lat, officerGps.lng, tkpGps.lat, tkpGps.lng);
  }, [officerGps, tkpGps]);

  const isWithin50Meters = distanceMeters !== null && distanceMeters <= 50;

  const distanceFormatted = useMemo(() => {
    if (distanceMeters === null) return 'Mendeteksi Lokasi...';
    if (distanceMeters >= 1000) return `${(distanceMeters / 1000).toFixed(1)} km`;
    return `${distanceMeters} m`;
  }, [distanceMeters]);

  const etaMinutesText = useMemo(() => {
    if (distanceMeters === null) return 'Menghitung...';
    if (distanceMeters <= 50) return 'Tiba di Lokasi';
    const minutes = Math.max(1, Math.round(distanceMeters / ((35 * 1000) / 60)));
    if (minutes >= 60) {
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      return m > 0 ? `±${h} Jam ${m} Mnt` : `±${h} Jam`;
    }
    return `±${minutes} Mnt`;
  }, [distanceMeters]);

  const myUnitData: MapUnitData = useMemo(() => ({
    key: `officer_${officerNrp}`,
    pos: officerGps,
    iconEmoji: '🚔',
    title: `${officerVehicle} (${displayOfficerTitle})`,
    petugas: `${displayOfficerTitle} (NRP ${officerNrp})`,
    sub: `${officerVehicle}`,
    status: isDeparted ? 'Berangkat' : 'Bersiap',
    statusColor: isDeparted ? '#3B82F6' : '#F59E0B',
    tugas: complaint?.jenisKejadian,
    lokasiTeks: officerAddress,
    telemetri: `Alamat: ${officerAddress}`,
  }), [officerGps, officerVehicle, displayOfficerTitle, officerNrp, isDeparted, complaint?.jenisKejadian, officerAddress]);

  if (!isOpen || !complaint) return null;
  if (!mounted || typeof document === 'undefined') return null;

  const modalContent = (
    <div
      id="fullscreen-tracking-map-modal"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
      onTouchCancel={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerMove={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9999999,
        background: '#0F172A',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        overscrollBehavior: 'none',
        touchAction: 'manipulation',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      {/* ======================================================== */}
      {/* RESPONSIVE TOP BAR / HEADER (SLEEK & REFINED CONTROLS)   */}
      {/* ======================================================== */}
      <div
        style={{
          background: 'linear-gradient(180deg, #0F172A 0%, rgba(15, 23, 42, 0.96) 100%)',
          borderBottom: '1px solid rgba(56, 189, 248, 0.2)',
          padding: '8px 14px',
          color: '#FFFFFF',
          zIndex: 10,
          flexShrink: 0,
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
          {/* Sisi Kiri: Icon & Title Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0, flex: 1 }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.28)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38BDF8',
                flexShrink: 0,
              }}
            >
              <Radio size={15} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12.5px', fontWeight: 800, letterSpacing: '0.3px', color: '#F8FAFC', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                  Pelacakan Armada 110
                </span>
                {isDeparted && (
                  <span
                    style={{
                      fontSize: '9.5px',
                      fontWeight: 700,
                      background: 'rgba(59, 130, 246, 0.15)',
                      color: '#60A5FA',
                      border: '1px solid rgba(96, 165, 250, 0.3)',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <Navigation size={10} /> Berangkat
                  </span>
                )}
              </div>
              <div style={{ fontSize: '10.5px', color: '#94A3B8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '1px' }}>
                <strong style={{ color: '#CBD5E1', fontWeight: 600 }}>{complaint.nomorTiket?.replace(/^#+/, '')}</strong>
                {complaint.jenisKejadian && (
                  <>
                    <span style={{ margin: '0 5px', color: '#475569' }}>•</span>
                    <span>{complaint.jenisKejadian}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Sisi Kanan: Controls & Close (Sleek, Balanced, Unforced) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0px', flexShrink: 0 }}>
            {/* Traffic Layer Toggle Button */}
            <button
              type="button"
              onClick={() => setShowTraffic((prev) => !prev)}
              title={showTraffic ? 'Layer Kemacetan Lalu Lintas: Aktif (Klik untuk Sembunyikan)' : 'Layer Kemacetan Lalu Lintas: Nonaktif (Klik untuk Tampilkan)'}
              style={{
                height: '32px',
                padding: '0 10px',
                color: showTraffic ? '#34D399' : '#94A3B8',
                borderRadius: '7px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
              }}
            >
              <span
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: showTraffic ? '#10B981' : '#64748B',
                  boxShadow: showTraffic ? '0 0 6px #10B981' : 'none',
                  transition: 'all 0.2s ease',
                }}
              />
            </button>

            {/* Subtle Divider */}
            <div style={{ width: '1px', height: '18px', background: 'rgba(255, 255, 255, 0.12)' }} />

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              title="Tutup Peta Pelacakan"
              style={{
                height: '32px',
                padding: '0 10px',
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#FCA5A5',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '7px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease',
              }}
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MAP CANVAS FULLSCREEN                                    */}
      {/* ======================================================== */}
      <div style={{ position: 'relative', width: '100%', flex: 1, overflow: 'hidden' }}>
        <SimapresGoogleMap
          mode="fullscreen"
          height="100%"
          myUnit={myUnitData}
          targetComplaint={isDeparted ? complaint : null}
          showTraffic={showTraffic}
          showOtherOfficers={true}
          interactive={true}
          controlsPosition="bottom-right"
          /* Berikan offset 145px agar 3 tombol (+, −, Locate) TIDAK tertutup ribbon bawah */
          controlsBottomOffset={isDeparted ? '145px' : '135px'}
          controlsRightOffset="14px"
        />

        {/* FLOATING TOP-LEFT TACTICAL PANEL */}
        <div
          style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            zIndex: 1000,
            background: 'rgba(15, 23, 42, 0.94)',
            backdropFilter: 'blur(10px)',
            color: 'white',
            padding: '10px 14px',
            borderRadius: '10px',
            border: '1.5px solid rgba(56, 189, 248, 0.35)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
            maxWidth: '320px',
            width: 'calc(100vw - 24px)',
          }}
        >
          <div style={{ fontSize: '10px', fontWeight: 900, color: '#38BDF8', letterSpacing: '0.4px', textTransform: 'uppercase', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            {isDeparted ? (
              <>
                <Compass size={12} className="text-sky-400" />
                <span>PANDUAN RUTE RESMI (DIRECTIONS)</span>
              </>
            ) : (
              <>
                <MapPin size={12} className="text-amber-400" />
                <span>LOKASI PERSONIL SIAGA</span>
              </>
            )}
          </div>
          <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#F8FAFC', lineHeight: 1.3 }}>
            {displayOfficerTitle}
          </div>
          <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '2px' }}>
            NRP: <strong style={{ color: '#E2E8F0' }}>{officerNrp}</strong>
          </div>

          {/* CONTAINER DUA ALAMAT: POSISI PERSONEL SAAT INI & DIBAWAHNYA ALAMAT TUJUAN (TKP) */}
          <div
            style={{
              marginTop: '7px',
              background: 'rgba(30, 41, 59, 0.88)',
              borderRadius: '8px',
              border: '1px solid rgba(148, 163, 184, 0.22)',
              overflow: 'hidden',
            }}
          >
            {/* 1. Alamat Personil Saat Ini */}
            <div style={{ padding: '6px 9px', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
              <MapPin size={13} className={isDeparted ? 'text-sky-400 shrink-0 mt-0.5' : 'text-amber-400 shrink-0 mt-0.5'} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: '8.5px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  {isDeparted ? 'Posisi Personel Terkini:' : 'Alamat Personil Saat Ini:'}
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#F1F5F9',
                    lineHeight: 1.35,
                    marginTop: '1px',
                    wordBreak: 'break-word',
                  }}
                >
                  {officerAddress}
                </div>
              </div>
            </div>

            {/* Divider Pemisah Posisi dan Tujuan */}
            <div style={{ borderTop: '1px dashed rgba(148, 163, 184, 0.25)' }} />

            {/* 2. Di Bawahnya: Alamat Tujuan (TKP) */}
            <div style={{ padding: '6px 9px', background: 'rgba(239, 68, 68, 0.08)', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
              <Navigation size={13} className="text-rose-400 shrink-0 mt-0.5" />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: '8.5px', fontWeight: 800, color: '#FCA5A5', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Alamat Tujuan (TKP):</span>

                </div>
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#FFE4E6',
                    lineHeight: 1.35,
                    marginTop: '1px',
                    wordBreak: 'break-word',
                  }}
                >
                  {destinationAddress}
                  <p>
                    {complaint?.jenisKejadian && (
                      <span style={{ fontSize: '8px', color: '#FECDD3', background: 'rgba(239, 68, 68, 0.25)', padding: '1px 5px', borderRadius: '3px', fontWeight: 700 }}>
                        {complaint.jenisKejadian}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '7px 0 6px 0' }} />
          <div style={{ fontSize: '10px', color: isDeparted ? '#60A5FA' : '#FCD34D', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
            {isDeparted ? (
              <>
                <Navigation size={11} className="text-blue-400" />
                <span>Rute jalan raya aktif via Google Maps Directions</span>
              </>
            ) : (
              <>
              </>
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* HORIZONTAL RIBBON BAR (BAWAH)                            */}
        {/* ======================================================== */}
        {isDeparted ? (
          <div
            id="panel-navigasi-rute-tkp"
            style={{
              position: 'absolute',
              bottom: '10px',
              left: '10px',
              right: '10px',
              zIndex: 1000,
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.96) 0%, rgba(30, 41, 59, 0.98) 100%)',
              backdropFilter: 'blur(10px)',
              color: '#FFFFFF',
              borderRadius: '11px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.2)',
              border: '1.5px solid rgba(56, 189, 248, 0.35)',
              padding: '8px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              boxSizing: 'border-box',
              flexWrap: 'wrap',
            }}
          >
            {/* SISI KIRI: Info Insiden & Alamat TKP */}
            <div style={{ flex: '1 1 auto', minWidth: '180px', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                <span
                  style={{
                    display: 'inline-block',
                    width: '8px',
                    height: '8px',
                    background: isWithin50Meters ? '#10B981' : '#38BDF8',
                    borderRadius: '50%',
                    boxShadow: `0 0 8px ${isWithin50Meters ? '#10B981' : '#38BDF8'}`,
                  }}
                />
                <span style={{ fontSize: '10px', fontWeight: 800, color: '#38BDF8', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                  NAVIGASI MENUJU TKP
                </span>
                <span
                  style={{
                    fontSize: '9.5px',
                    fontWeight: 800,
                    padding: '1.5px 6px',
                    borderRadius: '4px',
                    background: isWithin50Meters ? 'rgba(16, 185, 129, 0.25)' : 'rgba(56, 189, 248, 0.2)',
                    color: isWithin50Meters ? '#10B981' : '#38BDF8',
                    border: `1px solid ${isWithin50Meters ? '#10B981' : 'rgba(56, 189, 248, 0.3)'}`,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {isWithin50Meters ? (
                    <>
                      <CheckCircle2 size={10} /> DI RADIUS TKP (&lt;50m)
                    </>
                  ) : (
                    <>
                      <Navigation size={10} /> MENUJU TKP
                    </>
                  )}
                </span>
              </div>
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 800,
                  color: '#FFFFFF',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  lineHeight: 1.3,
                }}
                title={complaint.jenisKejadian}
              >
                {complaint.jenisKejadian}
              </div>
              <div
                style={{
                  fontSize: '10.5px',
                  color: '#94A3B8',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
                title={complaint.tkpAlamatTeks}
              >
                <MapPin size={11} className="text-rose-400" />
                <span>{complaint.tkpAlamatTeks || 'Lokasi Kejadian'}</span>
              </div>
            </div>

            {/* SISI TENGAH: Jarak GPS, ETA, & Geofence Radius */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '7px',
                padding: '4px 10px',
                flexShrink: 0,
              }}
            >
              <div>
                <div style={{ fontSize: '8px', color: '#94A3B8', fontWeight: 700, letterSpacing: '0.4px' }}>
                  JARAK GPS (10s)
                </div>
                <div style={{ fontSize: '14px', fontWeight: 900, color: isWithin50Meters ? '#10B981' : '#38BDF8', lineHeight: 1.2 }}>
                  {distanceFormatted}
                </div>
              </div>
              <div style={{ width: '1px', height: '22px', background: 'rgba(255, 255, 255, 0.12)' }} />
              <div>
                <div style={{ fontSize: '8px', color: '#94A3B8', fontWeight: 700, letterSpacing: '0.4px' }}>
                  ESTIMASI
                </div>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#E2E8F0', lineHeight: 1.2 }}>
                  {etaMinutesText}
                </div>
              </div>
              <div style={{ width: '1px', height: '22px', background: 'rgba(255, 255, 255, 0.12)' }} />
              <div>
                <div style={{ fontSize: '8px', color: '#94A3B8', fontWeight: 700, letterSpacing: '0.4px' }}>
                  RADIUS &le; 50M
                </div>
                <div style={{ fontSize: '10.5px', fontWeight: 800, color: isWithin50Meters ? '#10B981' : '#FDE047', lineHeight: 1.2 }}>
                  {isWithin50Meters ? 'Di Area TKP' : 'Di Luar Radius'}
                </div>
              </div>
            </div>

            {/* SISI KANAN: STATUS PANTAUAN (TANPA TOMBOL SUDAH TIBA) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              <div
                style={{
                  padding: '7px 12px',
                  background: 'rgba(56, 189, 248, 0.12)',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  borderRadius: '7px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  color: '#38BDF8',
                  fontSize: '11px',
                  fontWeight: 800,
                }}
              >
                <Shield size={13} />
                <span>MONITORING KOMANDO</span>
              </div>
            </div>
          </div>
        ) : (
          /* ======================================================== */
          /* KONDISI A: PERSONEL MASIH BERSIAP (BELUM BERANGKAT)      */
          /* ======================================================== */
          <div
            id="panel-standby-personil"
            style={{
              position: 'absolute',
              bottom: '10px',
              left: '10px',
              right: '10px',
              maxWidth: '100%',
              zIndex: 1000,
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.96) 0%, rgba(30, 41, 59, 0.98) 100%)',
              backdropFilter: 'blur(10px)',
              color: '#FFFFFF',
              borderRadius: '11px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              border: '1.5px solid rgba(245, 158, 11, 0.4)',
              padding: '9px 14px',
              display: 'inline-grid',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              boxSizing: 'border-box',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0, flex: 1 }}>
              <div
                style={{
                  width: '9px',
                  height: '9px',
                  borderRadius: '50%',
                  background: '#F59E0B',
                  boxShadow: '0 0 10px #F59E0B',
                  flexShrink: 0,
                }}
              />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '10.5px', fontWeight: 900, color: '#FCD34D', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                  STATUS ARMADA: BERSIAP &amp; MENYIAPKAN PERLENGKAPAN
                </div>
                <div style={{ fontSize: '11.5px', color: '#E2E8F0', marginTop: '1px' }}>
                  {displayOfficerTitle} sedang mempersiapkan kendaraan dinas dan perlengkapan SAR/TPTKP.
                </div>
                <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  <MapPin size={10} className="text-amber-400 shrink-0" />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    Titik Standby: <strong style={{ color: '#F1F5F9' }}>{officerAddress}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* INLINE ALERT SESUAI PERMINTAAN USER: "anggota sedang bersiap" DENGAN ICON LUCIDE */}
            <div
              style={{
                fontSize: '11px',
                fontWeight: 800,
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#FBBF24',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                padding: '6px 12px',
                borderRadius: '6px',
                display: 'inline-flex',
                width: '100%',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                flexShrink: 0,
              }}
            >
              <Clock size={13} className="text-amber-400" />
              <span>Bersiap</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
