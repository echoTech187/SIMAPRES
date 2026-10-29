'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { updateDeviceTelemetryAction, getMasterDropdownsAction } from '@/app/actions/auth.actions';
import { pairDeviceSessionAction } from '@/app/actions/device.actions';
import { getOrCreateClientDeviceId, getClientDeviceBrand } from '@/lib/device-fingerprint';
import './scan-device.css';

function ScanDeviceContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const targetNrp = searchParams.get('nrp');
  const targetUnit = searchParams.get('unit');
  const activeSessionToken = searchParams.get('session');

  const [unitMap, setUnitMap] = useState<Record<string, string>>({});

  useEffect(() => {
    getMasterDropdownsAction().then((res) => {
      if (res.success && res.data) {
        const mapping: Record<string, string> = {};
        res.data
          .filter((m: any) => m.tipe === 'satuan')
          .forEach((m: any) => {
            if (m.code) mapping[m.code.toLowerCase()] = m.label;
          });
        setUnitMap(mapping);
      }
    });
  }, []);

  const [physicalDeviceId, setPhysicalDeviceId] = useState<string>('Memuat...');
  const [deviceModel, setDeviceModel] = useState<string>('Smartphone Presisi');
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: 0, lng: 0 });
  const [accuracyText, setAccuracyText] = useState<string>('');
  const [statusBadge, setStatusBadge] = useState<{ text: string; bg: string }>({
    text: '',
    bg: '',
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Ekstraksi sidik jari hardware
  useEffect(() => {
    const devId = getOrCreateClientDeviceId();
    const brand = getClientDeviceBrand();
    if (devId) setPhysicalDeviceId(devId);
    if (brand) setDeviceModel(brand);
  }, []);

  const syncTelemetry = async (devId: string, currentCoords: { lat: number; lng: number }) => {
    try {
      // 1. Simpan langsung ke Database MySQL (tabel device_pairing_sessions & police_officers)
      await pairDeviceSessionAction({
        sessionToken: activeSessionToken,
        deviceId: devId,
        deviceBrand: deviceModel,
        nrp: targetNrp,
        unitId: targetUnit,
        lat: currentCoords.lat,
        lng: currentCoords.lng,
      });

      // 2. Update telemetri perwira/personel di database
      await updateDeviceTelemetryAction({
        deviceId: devId,
        nrp: targetNrp || undefined,
        lat: currentCoords.lat,
        lng: currentCoords.lng,
      });
    } catch (err) {
      console.warn('Failed to sync telemetry to server database:', err);
    }
  };

  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const lat = parseFloat(pos.coords.latitude.toFixed(6));
          const lng = parseFloat(pos.coords.longitude.toFixed(6));
          const currentPos = { lat, lng };
          setCoords(currentPos);
          setAccuracyText(`Akurasi GPS Fisik: ±${Math.round(pos.coords.accuracy)}m (${deviceModel})`);
          setStatusBadge({
            text: 'TERHUBUNG (LIVE)',
            bg: '#059669',
          });

          if (physicalDeviceId && physicalDeviceId !== 'Memuat...') {
            syncTelemetry(physicalDeviceId, currentPos);
          }
        },
        (err) => {
          console.warn('GPS Error:', err);
          if (err.code === 1) {
            if (!window.isSecureContext) {
              setAccuracyText('Google Chrome memblokir GPS karena akses via HTTP. Pastikan flag Insecure origins diaktifkan (Enabled) & luncurkan ulang browser, lalu segarkan halaman.');
            } else {
              setAccuracyText('Izin akses lokasi ditolak oleh browser. Ketuk ikon gembok/setelan di URL bar lalu izinkan lokasi.');
            }
          } else if (err.code === 2) {
            setAccuracyText('Sinyal satelit GPS tidak terdeteksi pada perangkat.');
          } else if (err.code === 3) {
            setAccuracyText('Waktu pencarian sinyal GPS habis (timeout).');
          } else {
            setAccuracyText('Izin akses lokasi (GPS) belum diaktifkan pada peramban ini.');
          }
          setStatusBadge({
            text: 'GPS TIDAK AKTIF',
            bg: '#EF4444',
          });
        },
        { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
      );
      watchIdRef.current = watchId;

      return () => {
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }
      };
    }
  }, [physicalDeviceId, deviceModel]);

  const handleCopyId = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(physicalDeviceId);
      setToastMessage('✓ Device ID berhasil disalin ke clipboard!');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const unitDisplayName = targetUnit ? unitMap[targetUnit.toLowerCase()] || targetUnit.toUpperCase() : 'Satuan Tugas Presisi';

  return (
    <div className="scan-device-body">
      <div className="card-terminal">
        {/* Header Band */}
        <div className="header-band">
          <div className="pulse-ring">📡</div>
          <h2 style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '0.5px' }}>TERMINAL GPS PERSONIL AKTIF</h2>
          <p style={{ fontSize: '12px', color: '#BFDBFE', marginTop: '4px' }}>Sistem Monitoring Polisi Bersama Masyarakat (SIMOPMAS 110)</p>
        </div>

        {/* Body Info */}
        <div className="card-body">
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>
            Device ID Terkunci
          </div>
          <div id="disp-device-id" className="dev-badge" onClick={handleCopyId} style={{ cursor: 'pointer' }} title="Ketuk untuk menyalin Device ID">
            {physicalDeviceId}
          </div>
          <div
            style={{ fontSize: '11px', color: '#38BDF8', marginTop: '-10px', marginBottom: '12px', cursor: 'pointer' }}
            onClick={handleCopyId}
          >
            📋 <u>Ketuk di sini untuk Salin Device ID</u>
          </div>

          <div
            id="disp-unit-box"
            style={{
              marginBottom: '14px',
              fontSize: '12px',
              fontWeight: 700,
              color: '#93C5FD',
              background: 'rgba(37,99,235,0.15)',
              border: '1px solid rgba(59,130,246,0.3)',
              padding: '6px 12px',
              borderRadius: '8px',
              display: 'inline-block',
            }}
          >
            Unit: <span id="disp-unit-name">{unitDisplayName}</span>
          </div>

          {/* Telemetri GPS Live Sensor HP */}
          <div className="telemetry-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#38BDF8' }}>🛰️ STATUS SENSOR HP:</span>
              <span
                id="gps-status-badge"
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  background: statusBadge.bg,
                  color: '#FFFFFF',
                  padding: '2px 8px',
                  borderRadius: '4px',
                }}
              >
                {statusBadge.text}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '4px' }}>Koordinat Satelit HP Anda:</div>
            <div
              id="disp-coords"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '14px',
                fontWeight: 800,
                color: '#F8FAFC',
              }}
            >
              {coords.lat !== 0 || coords.lng !== 0
                ? `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`
                : 'Idetifikasi Layanan Lokasi...'}
            </div>
            <div id="disp-accuracy" style={{ fontSize: '10.5px', color: '#64748B', marginTop: '4px' }}>
              {accuracyText}
            </div>

            <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed rgba(255,255,255,0.15)' }}>
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.location.reload();
                  }
                }}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #1E40AF, #2563EB)',
                  color: 'white',
                  border: '1px solid #3B82F6',
                  borderRadius: '8px',
                  padding: '9px 12px',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(37,99,235,0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <span>🔄</span> Segarkan Halaman
              </button>
            </div>
          </div>

          <div style={{ fontSize: '12px', color: '#94A3B8', lineHeight: 1.5, marginBottom: '16px', textAlign: 'left' }}>
            ✅ <strong>HP Personel Berhasil Diikat!</strong> Lokasi patroli Anda kini tersinkronisasi secara real-time dengan radar peta komando Pawas dan E-Tribrata Log.
          </div>

          <button
            type="button"
            className="btn-act btn-primary-act"
            onClick={handleCopyId}
            style={{ marginBottom: '10px' }}
          >
            <span>📋</span> Salin Device ID HP Anda
          </button>

          <button
            type="button"
            className="btn-act btn-secondary-act"
            onClick={() => router.push(targetNrp ? `/personil?nrp=${encodeURIComponent(targetNrp)}` : '/personil')}
          >
            <span>🛡️</span> Masuk ke Layar Tugas Personel ➔
          </button>
        </div>
      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            background: '#059669',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '12px',
            fontWeight: 800,
            fontSize: '13px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
            zIndex: 9999,
          }}
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}

export default function ScanDevicePage() {
  return (
    <React.Suspense fallback={<div className="scan-device-body">Memuat Terminal GPS...</div>}>
      <ScanDeviceContent />
    </React.Suspense>
  );
}
