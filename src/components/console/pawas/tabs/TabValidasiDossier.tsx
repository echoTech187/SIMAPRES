'use client';

import React from 'react';
import '@/app/console/console.css';
import { PawasTab } from '../types';
import { formatIncidentDateTime, formatTimeWib, formatDateTimeWib } from '@/lib/date-utils';
import TrackingMapModal from '@/components/console/common/TrackingMapModal';
import NameInitialAvatar from '@/components/ui/NameInitialAvatar';
import { formatPhoneNumber } from '@/lib/format-phone';
import { reverseGeocodeCoords, isGenericOrCoordinateAddress, resolveSektorWilayah } from '@/infrastructure/services/reverse-geocode.service';

export interface TabValidasiDossierProps {
  activeComplaint: any;
  userProfile: any;
  switchTab: (tab: PawasTab) => void;
  isComplaintRejected: (c: any) => boolean;
  resolveComplaintStatus: (status: string, isRejected?: boolean) => any;
  bukaModalDisposisi: (c: any) => void;
  handleAjukanRevisi: (c: any) => void;
  handleSahkanPenutupanKasus?: (c: any) => void;
  setTolakComplaint: (c: any) => void;
  bukaModalTolak?: (c: any) => void;
  setLightboxImg: (data: any) => void;
  setShowLightboxModal: (show: boolean) => void;
  fleetUnits: any[];
  slaClockSeconds: number;
  formatSlaClock: (sec: number) => string;
}

export const TabValidasiDossier: React.FC<TabValidasiDossierProps> = ({
  activeComplaint,
  userProfile,
  switchTab,
  isComplaintRejected,
  resolveComplaintStatus,
  bukaModalDisposisi,
  handleAjukanRevisi,
  handleSahkanPenutupanKasus,
  setTolakComplaint,
  bukaModalTolak,
  setLightboxImg,
  setShowLightboxModal,
  fleetUnits,
  slaClockSeconds,
  formatSlaClock,
}) => {
  if (!activeComplaint) return null;

  const [showTrackingMapModal, setShowTrackingMapModal] = React.useState(false);

  // Reverse geocoded address for SOS / coordinate-only reports
  const [displayAddress, setDisplayAddress] = React.useState<string>(() => {
    const raw = activeComplaint?.tkpAlamatTeks;
    if (raw && !isGenericOrCoordinateAddress(raw)) {
      return raw;
    }
    return 'Memuat alamat lokasi TKP...';
  });

  React.useEffect(() => {
    const raw = activeComplaint?.tkpAlamatTeks;
    if (raw && !isGenericOrCoordinateAddress(raw)) {
      setDisplayAddress(raw);
      return;
    }

    const lat = Number(activeComplaint?.tkpLat);
    const lng = Number(activeComplaint?.tkpLng);
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      setDisplayAddress(raw || 'Wilayah Hukum Polres Pekalongan');
      return;
    }

    let isMounted = true;
    reverseGeocodeCoords(lat, lng).then((resolved) => {
      if (isMounted && resolved) {
        setDisplayAddress(resolved);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [activeComplaint?.id, activeComplaint?.tkpAlamatTeks, activeComplaint?.tkpLat, activeComplaint?.tkpLng]);

  const isRejected = isComplaintRejected(activeComplaint);
  const activeStatMeta = resolveComplaintStatus(activeComplaint.status, isRejected);
  const rejectionReason = activeComplaint.ringkasanKeterangan?.includes('[DITOLAK PAWAS]:')
    ? activeComplaint.ringkasanKeterangan.split('[DITOLAK PAWAS]:')[1]?.trim()
    : (activeComplaint.ringkasanKeterangan || 'Laporan dikembalikan untuk melengkapi dokumentasi dan identifikasi pelaku.');

  const formatOfficerName = (rank?: string, fullName?: string) => {
    if (!fullName) return rank ? `${rank} Personel` : 'Personel Lapangan';
    const cleanRank = (rank || '').trim();
    let cleanName = (fullName || '').trim();
    if (cleanRank && cleanName.toLowerCase().startsWith(cleanRank.toLowerCase())) {
      return cleanName;
    }
    return cleanRank ? `${cleanRank} ${cleanName}` : cleanName;
  };

  return (
    <>
      {/* GLOBAL MACRO MILESTONE STEPPER (Sleek Linear Connected Tracker) */}
      <div
        id="macro-milestone-box"
        style={{
          marginBottom: '14px',
          background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
          border: '1px solid #E2E8F0',
          borderRadius: '12px',
          padding: '12px 14px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>🌐</span> SIKLUS HIDUP LAPORAN
          </div>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#153E75', background: '#EFF6FF', padding: '2px 8px', borderRadius: '4px', border: '1px solid #BFDBFE' }}>
            {activeComplaint.jenisKejadian?.toLowerCase().includes('sos') ? '🚨 SOS Panik' : activeComplaint.operatorId ? '📞 Layanan 110' : '📱 Portal Warga'}
          </div>
        </div>

        {/* Connected Horizontal Stepper */}
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '0 8px' }}>
          {/* Background Track Line */}
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '24px',
              right: '24px',
              height: '3px',
              background: '#CBD5E1',
              zIndex: 1,
            }}
          />
          {/* Active Progress Track Line */}
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '24px',
              width:
                activeStatMeta.key === 'SELESAI'
                  ? 'calc(100% - 48px)'
                  : activeStatMeta.key === 'MENUNGGU_PENGESAHAN'
                  ? 'calc(75% - 24px)'
                  : activeStatMeta.key === 'DIPROSES'
                  ? 'calc(50% - 16px)'
                  : 'calc(25% - 8px)',
              height: '3px',
              background: isRejected
                ? '#DC2626'
                : 'linear-gradient(90deg, #10B981, #2563EB)',
              zIndex: 2,
              transition: 'width 0.4s ease',
            }}
          />

          {/* Step 1: Lapor Masuk */}
          <div style={{ position: 'relative', zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '54px' }}>
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: '#10B981',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 800,
                boxShadow: '0 0 0 3px #FFFFFF, 0 2px 4px rgba(16,185,129,0.3)',
              }}
            >
              ✓
            </div>
            <div style={{ fontSize: '10px', fontWeight: 800, color: '#0F172A', marginTop: '4px', textAlign: 'center' }}>
              Lapor
            </div>
            <div style={{ fontSize: '9px', color: '#059669', fontWeight: 700 }}>
              Tercatat
            </div>
          </div>

          {/* Step 2: Validasi Pawas */}
          <div style={{ position: 'relative', zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '54px' }}>
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: isRejected ? '#DC2626' : activeStatMeta.key === 'MENUNGGU' ? '#F59E0B' : '#10B981',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 800,
                boxShadow: `0 0 0 3px #FFFFFF, 0 2px 4px ${isRejected ? 'rgba(220,38,38,0.3)' : activeStatMeta.key === 'MENUNGGU' ? 'rgba(245,158,11,0.3)' : 'rgba(16,185,129,0.3)'}`,
              }}
            >
              {isRejected ? '✕' : activeStatMeta.key === 'MENUNGGU' ? '⏳' : '✓'}
            </div>
            <div style={{ fontSize: '10px', fontWeight: 800, color: '#0F172A', marginTop: '4px', textAlign: 'center' }}>
              Validasi
            </div>
            <div style={{ fontSize: '9px', color: isRejected ? '#DC2626' : activeStatMeta.key === 'MENUNGGU' ? '#D97706' : '#059669', fontWeight: 700 }}>
              {isRejected ? 'Ditolak' : activeStatMeta.key === 'MENUNGGU' ? 'Review' : 'Pawas'}
            </div>
          </div>

          {/* Step 3: Lapangan */}
          <div style={{ position: 'relative', zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '54px' }}>
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: activeStatMeta.key === 'DIPROSES'
                  ? 'linear-gradient(135deg, #1E40AF, #3B82F6)'
                  : ['MENUNGGU_PENGESAHAN', 'SELESAI'].includes(activeStatMeta.key)
                  ? '#10B981'
                  : '#CBD5E1',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 800,
                boxShadow: `0 0 0 3px #FFFFFF, 0 2px 4px rgba(0,0,0,0.15)`,
              }}
            >
              {activeStatMeta.key === 'DIPROSES'
                ? '🚔'
                : ['MENUNGGU_PENGESAHAN', 'SELESAI'].includes(activeStatMeta.key)
                ? '✓'
                : null}
            </div>
            <div style={{ fontSize: '10px', fontWeight: 800, color: activeStatMeta.key === 'DIPROSES' || ['MENUNGGU_PENGESAHAN', 'SELESAI'].includes(activeStatMeta.key) ? '#0F172A' : '#94A3B8', marginTop: '4px', textAlign: 'center' }}>
              Lapangan
            </div>
            <div style={{ fontSize: '9px', color: activeStatMeta.key === 'DIPROSES' ? '#2563EB' : ['MENUNGGU_PENGESAHAN', 'SELESAI'].includes(activeStatMeta.key) ? '#059669' : '#94A3B8', fontWeight: 700 }}>
              {activeStatMeta.key === 'DIPROSES' ? (Number(activeComplaint.tahap) === 3 ? 'Meluncur' : Number(activeComplaint.tahap) >= 4 ? 'Di TKP' : 'Disposisi') : ['MENUNGGU_PENGESAHAN', 'SELESAI'].includes(activeStatMeta.key) ? 'Tuntas' : 'Menunggu'}
            </div>
          </div>

          {/* Step 4: Selesai */}
          <div style={{ position: 'relative', zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '54px' }}>
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: activeStatMeta.key === 'SELESAI'
                  ? '#10B981'
                  : activeStatMeta.key === 'MENUNGGU_PENGESAHAN'
                  ? '#EF4444'
                  : '#CBD5E1',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 800,
                boxShadow: `0 0 0 3px #FFFFFF, 0 2px 4px rgba(0,0,0,0.15)`,
              }}
            >
              {activeStatMeta.key === 'SELESAI' ? '✓' : activeStatMeta.key === 'MENUNGGU_PENGESAHAN' ? '✍️' : '4'}
            </div>
            <div style={{ fontSize: '10px', fontWeight: 800, color: activeStatMeta.key === 'SELESAI' || activeStatMeta.key === 'MENUNGGU_PENGESAHAN' ? '#0F172A' : '#94A3B8', marginTop: '4px', textAlign: 'center' }}>
              Selesai
            </div>
            <div style={{ fontSize: '9px', color: activeStatMeta.key === 'SELESAI' ? '#059669' : activeStatMeta.key === 'MENUNGGU_PENGESAHAN' ? '#DC2626' : '#94A3B8', fontWeight: 700 }}>
              {activeStatMeta.key === 'SELESAI' ? 'Tuntas' : activeStatMeta.key === 'MENUNGGU_PENGESAHAN' ? 'Otorisasi' : 'Menunggu'}
            </div>
          </div>
        </div>

        {/* Audit Log Terakhir */}
        <div id="macro-audit-drawer" style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed #CBD5E1', fontSize: '10.5px', color: '#475569' }}>
          <span style={{ fontWeight: 600 }}>
            {isRejected ? (
              <>⚠️ <strong>Catatan Revisi:</strong> &quot;{rejectionReason}&quot;</>
            ) : activeStatMeta.key === 'MENUNGGU' ? (
              <>🕒 <strong>Status:</strong> Laporan Diterima &amp; Menunggu Verifikasi Pawas</>
            ) : activeStatMeta.key === 'DIPROSES' ? (
              Number(activeComplaint.tahap) === 3 ? (
                <>🚀 <strong>Sedang Ditangani:</strong> Personel Meluncur ke Lokasi TKP (SLA &lt; 10 Menit)</>
              ) : Number(activeComplaint.tahap) >= 4 ? (
                <>📍 <strong>Tiba di TKP:</strong> Petugas Tiba di Lokasi &amp; Melakukan Tindakan Kepolisian</>
              ) : (
                <>📋 <strong>Disposisi Pawas:</strong> Personel Siaga Telah Ditugaskan Meluncur</>
              )
            ) : activeStatMeta.key === 'MENUNGGU_PENGESAHAN' ? (
              <>⚖️ <strong>Menunggu Pengesahan:</strong> Laporan Rampung &amp; BAP Terbit (Menunggu Otorisasi Pawas)</>
            ) : (
              <>🏆 <strong>Kasus Ditutup:</strong> Berita Acara Disahkan &amp; Kasus Selesai Resmi</>
            )}
          </span>
        </div>
      </div>

      {/* CONDITION 1: STANDARD DETAIL VIEW (Menunggu Tindakan / Ditolak) */}
      {activeStatMeta.key === 'MENUNGGU' || isRejected ? (
        <div id="detail-standard-view">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#1E293B' }}>Detail Laporan</div>
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: '12px',
              background: isRejected ? '#FEE2E2' : '#FEF3C7',
              color: isRejected ? '#DC2626' : '#D97706',
            }}>
              {isRejected ? 'Ditolak / Revisi' : 'Menunggu Validasi'}
            </span>
          </div>

          <div style={{ fontSize: '13px', fontWeight: 700, color: '#153E75', marginBottom: '12px', lineHeight: 1.4 }}>
            {activeComplaint.jenisKejadian}
          </div>

          {activeComplaint.fotoTkpUrl ? (
            <div style={{ position: 'relative', marginBottom: '12px', borderRadius: '8px', overflow: 'hidden', height: '180px', background: '#0F172A' }}>
              <img
                src={activeComplaint.fotoTkpUrl}
                alt="Foto Bukti"
                style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
                onClick={() => {
                  setLightboxImg({
                    url: activeComplaint.fotoTkpUrl,
                    title: `Bukti Kasus ${activeComplaint.nomorTiket}`,
                    meta: `TKP: ${displayAddress}`,
                    desc: activeComplaint.ringkasanKeterangan,
                  });
                  setShowLightboxModal(true);
                }}
              />
              <div style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(0,0,0,0.65)', color: 'white', fontSize: '10px', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
                📷 Foto Lampiran
              </div>
            </div>
          ) : (
            <div style={{ padding: '16px', background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: '8px', textAlign: 'center', color: '#94A3B8', fontSize: '12px', marginBottom: '12px' }}>
              📷 Tidak ada foto bukti yang dilampirkan
            </div>
          )}

          <div className="detail-text" style={{ fontSize: '12px', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div>
              <div style={{ color: '#64748B', fontSize: '11px', fontWeight: 600 }}>Waktu Pengiriman:</div>
              <span style={{ color: '#1E293B', fontWeight: 700 }}>
                {formatIncidentDateTime(activeComplaint.createdAt).full}
              </span>
            </div>
            <div>
              <div style={{ color: '#64748B', fontSize: '11px', fontWeight: 600 }}>Sektor / Wilayah:</div>
              <span style={{ color: '#1E293B', fontWeight: 700 }}>
                {resolveSektorWilayah(displayAddress, activeComplaint)}
              </span>
            </div>
            <div>
              <div style={{ color: '#64748B', fontSize: '11px', fontWeight: 600 }}>Identitas Pelapor:</div>
              <div style={{ color: '#1E293B', fontWeight: 700 }}>
                {activeComplaint.pelaporNama}
              </div>
            </div>
            <div>
              <div style={{ color: '#64748B', fontSize: '11px', fontWeight: 600 }}>Kontak &amp; Alamat:</div>
              <div style={{ color: '#1E293B', fontWeight: 700, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>📞 {formatPhoneNumber(activeComplaint.pelaporHp) || activeComplaint.pelaporHp || '-'}</span>
                </div>
                <div style={{ color: '#334155', fontWeight: 600, display: 'flex', alignItems: 'flex-start', gap: '5px', fontSize: '11.5px', marginTop: '1px' }}>
                  <span style={{ flexShrink: 0, marginTop: '1px' }}>📍</span>
                  <span style={{ wordBreak: 'break-word', lineHeight: 1.4 }}>{displayAddress}</span>
                </div>
              </div>
            </div>
            <div>
              <div style={{ color: '#64748B', fontSize: '11px', fontWeight: 600 }}>Saluran / Sumber Laporan:</div>
              <div style={{ color: '#1D4ED8', fontWeight: 700 }}>
                {activeComplaint.jenisKejadian?.toLowerCase().includes('sos')
                  ? '🚨 PANGGILAN DARURAT SOS (PANIC BUTTON)'
                  : activeComplaint.operatorId
                    ? '📞 PANGGILAN DARURAT 110 (CALL CENTER)'
                    : '📱 PORTAL PRESISI WARGA (ONLINE)'}
              </div>
            </div>
            <div>
              <div style={{ color: '#64748B', fontSize: '11px', fontWeight: 600 }}>Deskripsi Kejadian:</div>
              <span style={{ color: '#1E293B', lineHeight: 1.4, display: 'block', marginTop: '2px' }}>
                {activeComplaint.ringkasanKeterangan}
              </span>
            </div>
          </div>

          {isRejected && (
            <div style={{ background: '#FEF2F2', borderLeft: '3px solid #EF4444', padding: '8px 10px', borderRadius: '4px', fontSize: '11px', color: '#991B1B', marginTop: '10px', lineHeight: 1.4 }}>
              <strong>⚠️ Catatan Penolakan:</strong> {rejectionReason}
            </div>
          )}

          {/* Action buttons inside detail-standard-view */}
          {isRejected ? (
            <div style={{ marginTop: '14px' }}>
              <button
                type="button"
                className="btn-blue"
                onClick={() => handleAjukanRevisi(activeComplaint)}
                style={{
                  width: '100%',
                  margin: 0,
                  padding: '12px',
                  background: '#D97706',
                  fontSize: '13px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  borderRadius: '8px',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(217,119,6,0.3)',
                }}
              >
                <span>✏️</span> Ajukan Revisi &amp; Kirim Ulang ke Atasan ➔
              </button>
            </div>
          ) : (
            <div style={{ marginTop: '16px', display: 'flex', gap: '10px', alignItems: 'stretch' }}>
              <button
                type="button"
                id="btn-buka-disposisi"
                data-testid="btn-buka-disposisi"
                onClick={() => {
                  bukaModalDisposisi(activeComplaint);
                }}
                style={{
                  flex: 1,
                  height: '42px',
                  padding: '0 14px',
                  background: 'linear-gradient(135deg, #153E75 0%, #1E40AF 100%)',
                  color: 'white',
                  fontSize: '12.5px',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  borderRadius: '8px',
                  border: 'none',
                  boxShadow: '0 2px 8px rgba(21,62,117,0.25)',
                  cursor: 'pointer',
                  margin: 0,
                  transition: 'all 0.15s ease',
                }}
              >
                Teruskan Tugas ➔
              </button>
              <button
                type="button"
                id="btn-tolak-dossier"
                onClick={() => {
                  if (bukaModalTolak) {
                    bukaModalTolak(activeComplaint);
                  } else {
                    setTolakComplaint(activeComplaint);
                    switchTab('view-tolak');
                  }
                }}
                style={{
                  flex: 1,
                  height: '42px',
                  padding: '0 14px',
                  borderRadius: '8px',
                  border: '1px solid #FCA5A5',
                  background: '#FEF2F2',
                  color: '#DC2626',
                  fontWeight: 800,
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  margin: 0,
                  transition: 'all 0.15s ease',
                }}
              >
                <span>✕</span> Tolak / Revisi
              </button>
            </div>
          )}
        </div>
      ) : (
        /* CONDITION 2: TIMELINE TRACKING VIEW (Diproses, Menuju TKP, Penanganan, Selesai) 1:1 PROTOTYPE */
        <div id="detail-timeline-view">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', padding: '0 2px' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A', margin: 0 }}>Hasil Pelacakan</h3>
              <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>Timeline Progres Penanganan Kasus</div>
            </div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: '12px',
                background: activeStatMeta.badge_bg || '#EFF6FF',
                color: activeStatMeta.badge_color || '#2563EB',
                border: `1px solid ${activeStatMeta.badge_border || '#BFDBFE'}`,
              }}
            >
              {activeStatMeta.label}
            </span>
          </div>

          {/* Incident Meta Details Card */}
          <div className="incident-meta-card" style={{ marginBottom: '16px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '12px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div>
                <div style={{ fontSize: '10px', color: '#64748B', fontWeight: 700 }}>Nomor Laporan</div>
                <div style={{ color: '#153E75', fontFamily: 'monospace', fontSize: '13px', fontWeight: 800 }}>
                  #{activeComplaint.nomorTiket?.replace(/^#+/, '')}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '10px', color: '#64748B', fontWeight: 700 }}>Waktu Lapor</div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#1E293B' }}>
                  {formatIncidentDateTime(activeComplaint.createdAt).full}
                </div>
              </div>
            </div>

            <div style={{ fontSize: '12px', color: '#334155', marginBottom: '4px' }}>
              <span style={{ color: '#64748B', fontWeight: 600 }}>Jenis Insiden:</span>{' '}
              <strong>{activeComplaint.jenisKejadian}</strong>
            </div>
            <div style={{ fontSize: '12px', color: '#334155', marginBottom: '8px' }}>
              <span style={{ color: '#64748B', fontWeight: 600 }}>Lokasi TKP:</span>{' '}
              <span style={{ color: '#475569' }}>{displayAddress}</span>
            </div>

            {/* Foto Bukti Laporan Warga / Compact Pill jika tidak ada */}
            {activeComplaint.fotoTkpUrl ? (
              <div
                style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', background: '#0F172A', cursor: 'pointer', marginBottom: '8px' }}
                onClick={() => {
                  setLightboxImg({
                    url: activeComplaint.fotoTkpUrl,
                    title: `Bukti Kasus #${activeComplaint.nomorTiket?.replace(/^#+/, '')}`,
                    meta: `TKP: ${displayAddress}`,
                    desc: activeComplaint.ringkasanKeterangan,
                  });
                  setShowLightboxModal(true);
                }}
                title="Klik untuk perbesar foto laporan"
              >
                <img
                  src={activeComplaint.fotoTkpUrl}
                  alt="Bukti TKP"
                  style={{ width: '100%', height: '140px', objectFit: 'cover', display: 'block' }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 50%)',
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    color: 'white',
                    fontSize: '10px',
                    fontWeight: 600,
                  }}
                >
                  <span>Foto Bukti Laporan 110 • {new Date(activeComplaint.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</span>
                  <span style={{ background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(4px)', padding: '2px 8px', borderRadius: '4px', fontSize: '9px' }}>
                    🔍 Perbesar
                  </span>
                </div>
              </div>
            ) : (
              <div
                style={{
                  padding: '7px 10px',
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '6px',
                  color: '#64748B',
                  fontSize: '11px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '8px',
                }}
              >
                <span>📷</span>
                <span>Tanpa lampiran foto bukti dari pelapor</span>
              </div>
            )}

            <div style={{ fontSize: '11.5px', color: '#1E293B', lineHeight: 1.45, fontStyle: 'italic', background: 'white', padding: '8px 10px', borderRadius: '6px', border: '1px dashed #CBD5E1' }}>
              &quot;{activeComplaint.ringkasanKeterangan}&quot;
            </div>
          </div>

          {/* DYNAMIC 5-STEP GLOWING CONNECTED TIMELINE */}
          <div className="glow-timeline-container">
            {/* Step 1: Laporan Diterima */}
            <div className="glow-timeline-step completed">
              <div className="glow-timeline-node">
                ✓
              </div>
              <div className="glow-timeline-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A' }}>1. Laporan Diterima (SPKT)</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '9.5px', color: '#10B981', fontWeight: 700, background: '#ECFDF5', padding: '2px 7px', borderRadius: '4px' }}>✓ SELESAI</span>
                    <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#64748B' }}>
                      {formatDateTimeWib(activeComplaint.createdAt)}
                    </span>
                  </div>
                </div>
                <div style={{ fontSize: '11.5px', color: '#475569', marginTop: '4px', lineHeight: 1.4 }}>
                  Laporan telah divalidasi oleh operator 110 dan diteruskan ke komando wilayah.
                </div>
                {activeComplaint.fotoTkpUrl && (
                  <div style={{ marginTop: '8px' }}>
                    <span
                      onClick={() => {
                        setLightboxImg({
                          url: activeComplaint.fotoTkpUrl,
                          title: 'Foto Bukti SPKT 110',
                          meta: activeComplaint.nomorTiket,
                          desc: activeComplaint.ringkasanKeterangan,
                        });
                        setShowLightboxModal(true);
                      }}
                      style={{ fontSize: '10.5px', fontWeight: 700, color: '#1D4ED8', background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '3px 9px', borderRadius: '4px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <span>📷</span> Bukti Laporan 110 ➔
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Step 2: Disposisi Personel */}
            {(() => {
              const isStep2Completed = activeComplaint.status !== 'BELUM_DITANGANI';
              return (
                <div className={`glow-timeline-step ${isStep2Completed ? 'completed' : 'pending'}`}>
                  <div className="glow-timeline-node">
                    {isStep2Completed ? '✓' : '2'}
                  </div>
                  <div className="glow-timeline-body">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A' }}>2. Disposisi Personel</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{
                          fontSize: '9.5px',
                          fontWeight: 700,
                          background: isStep2Completed ? '#ECFDF5' : '#F1F5F9',
                          color: isStep2Completed ? '#10B981' : '#64748B',
                          padding: '2px 7px',
                          borderRadius: '4px'
                        }}>
                          {isStep2Completed ? '✓ SELESAI' : '🔒 MENUNGGU DISPOSISI'}
                        </span>
                        {activeComplaint.disposisiAt && (
                          <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#64748B' }}>
                            {formatDateTimeWib(activeComplaint.disposisiAt, activeComplaint.createdAt)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#475569', marginTop: '4px', lineHeight: 1.4 }}>
                      {activeComplaint.assignedOfficer ? `Tugas penanganan telah diserahkan kepada ${formatOfficerName(activeComplaint.assignedOfficer.rankPangkat, activeComplaint.assignedOfficer.namaLengkap)} (${activeComplaint.assignedOfficer.assignedPatrolVehicle || 'Unit Presisi'}).` : 'Menunggu penugasan personel dan armada reaksi cepat oleh Pawas.'}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Step 3: Personel Menuju Lokasi */}
            {(() => {
              const isStep3Completed = Number(activeComplaint.tahap) >= 4 || activeComplaint.status === 'SELESAI' || activeComplaint.status === 'MENUNGGU_PENGESAHAN' || Boolean(activeComplaint.responTibaTkpAt);
              const isStep3Active = !isStep3Completed && Number(activeComplaint.tahap) === 3;
              const step3StatusClass = isStep3Completed ? 'completed' : isStep3Active ? 'active' : 'pending';

              const primaryDispatch = (activeComplaint.dispatches || []).find((d: any) => d.is_primary_unit) || (activeComplaint.dispatches || [])[0];
              const baseDate = activeComplaint.created_at || activeComplaint.createdAt || new Date();
              const rawMeluncur = primaryDispatch?.departed_at || activeComplaint.waktuMeluncur || null;
              const formattedMeluncur = rawMeluncur ? formatDateTimeWib(rawMeluncur, baseDate) : null;

              return (
                <div className={`glow-timeline-step ${step3StatusClass}`}>
                  <div className="glow-timeline-node">
                    {isStep3Completed ? '✓' : isStep3Active ? '🚔' : null}
                  </div>
                  <div className="glow-timeline-body">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A' }}>3. Personel Menuju Lokasi</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{
                          fontSize: '9.5px',
                          fontWeight: 700,
                          padding: '2px 7px',
                          borderRadius: '4px',
                          background: isStep3Active ? '#DBEAFE' : isStep3Completed ? '#ECFDF5' : '#F1F5F9',
                          color: isStep3Active ? '#1D4ED8' : isStep3Completed ? '#10B981' : '#64748B',
                        }}>
                          {isStep3Active ? '● SEDANG BERLANGSUNG' : isStep3Completed ? '✓ SELESAI' : '🔒 TERKUNCI'}
                        </span>
                        {formattedMeluncur && (
                          <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#64748B' }}>
                            {formattedMeluncur}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#475569', marginTop: '4px', lineHeight: 1.4 }}>
                      {activeComplaint.assignedOfficer ? `Tim ${activeComplaint.assignedOfficer.assignedPatrolVehicle || 'Presisi'} sedang meluncur ke lokasi kejadian. Sirine biru aktif dan pantauan GPS terhubung.` : 'Menunggu unit meluncur.'}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px', flexWrap: 'wrap', gap: '6px' }}>
                      <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#1E293B' }}>
                        📅 Meluncur: {formattedMeluncur || (isStep3Active ? 'Sedang Bergerak' : '-')}
                      </span>
                      {activeComplaint.fotoPersiapan && (
                        <span
                          onClick={() => {
                            setLightboxImg({
                              url: activeComplaint.fotoPersiapan,
                              title: 'Bukti Persiapan & GPS Lapangan',
                              meta: activeComplaint.assignedOfficer?.assignedPatrolVehicle || '-',
                              desc: 'Armada dalam perjalanan menuju TKP',
                            });
                            setShowLightboxModal(true);
                          }}
                          style={{ fontSize: '10px', fontWeight: 700, color: '#1E40AF', background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          📷 Bukti Persiapan &amp; GPS ➔
                        </span>
                      )}
                    </div>

                    {/* Tracking Map Card */}
                    <div
                      onClick={() => setShowTrackingMapModal(true)}
                      title="Klik untuk membuka Peta Navigasi & Pelacakan Satelit Layar Penuh"
                      style={{
                        position: 'relative',
                        marginTop: '8px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        height: '110px',
                        background: 'radial-gradient(circle at center, #1E3A8A 0%, #0F172A 100%)',
                        cursor: 'pointer',
                        border: '1.5px solid #3B82F6',
                        boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                      }}
                    >
                      {activeComplaint.fotoPersiapan ? (
                        <img src={activeComplaint.fotoPersiapan} alt="Patrol Car" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#93C5FD', fontSize: '11px', fontWeight: 700, gap: '4px' }}>
                          <span style={{ fontSize: '18px' }}>🛰️</span>
                          <span>Tracking Satelit Armada Aktif</span>
                          <span style={{ fontSize: '9px', background: 'rgba(59, 130, 246, 0.25)', border: '1px solid rgba(147, 197, 253, 0.4)', color: '#BAE6FD', padding: '1px 6px', borderRadius: '4px' }}>
                            Klik untuk Buka Peta ↗
                          </span>
                        </div>
                      )}
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, transparent 100%)', padding: '8px 10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <NameInitialAvatar
                          name={activeComplaint.assignedOfficer?.namaLengkap}
                          avatarUrl={activeComplaint.assignedOfficer?.avatarUrl}
                          size={28}
                          variant="blue"
                        />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ color: 'white', fontSize: '11px', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {activeComplaint.assignedOfficer ? `${activeComplaint.assignedOfficer.assignedPatrolVehicle || 'Unit Presisi'} (${formatOfficerName(activeComplaint.assignedOfficer.rankPangkat, activeComplaint.assignedOfficer.namaLengkap)})` : 'Unit Patroli Presisi'}
                          </div>
                          <div style={{ color: '#38BDF8', fontSize: '9.5px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span>Status: {Number(activeComplaint.tahap) === 3 ? 'Menuju Lokasi' : 'Tepat Waktu'}</span>
                            <span style={{ color: '#93C5FD', fontWeight: 700, fontSize: '9px' }}>Buka Peta ↗</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* GPS Terkunci Box */}
                    <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '6px', padding: '6px 10px', marginTop: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#166534' }}>📍 GPS TITIK TKP:</span>
                        <span style={{ fontSize: '9.5px', background: '#DCFCE7', color: '#15803D', fontWeight: 700, padding: '1px 5px', borderRadius: '3px' }}>TERKUNCI</span>
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: '#1E293B', fontFamily: 'monospace' }}>
                        {activeComplaint.tkpLat?.toFixed(4)}, {activeComplaint.tkpLng?.toFixed(4)}
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#475569', fontStyle: 'italic', marginTop: '3px' }}>
                        &quot;{activeComplaint.timelines?.find((t: any) => t.tahapKe === 2 || t.tahapKe === 3)?.catatan || `Unit bergerak menuju ${activeComplaint.tkpAlamatTeks}`}&quot;
                      </div>
                    </div>

                    {/* DAFTAR PERSONEL REGU YANG IKUT / MENYETUJUI TUGAS */}
                    {(() => {
                      const dispatches: any[] = activeComplaint.dispatches || [];
                      const list: any[] = [];
                      const seen = new Set<string>();

                      dispatches.forEach((d: any) => {
                        const isAcc = Boolean(d.accepted_at || d.arrived_at || d.completed_at);
                        if (!isAcc && !d.officer) return;
                        const off = d.officer;
                        const rawName = off?.user?.full_name || '';
                        const rank = off?.rank_pangkat || '';
                        const name = formatOfficerName(rank, rawName) || 'Personel Lapangan';
                        const nrp = off?.nrp || '';
                        const unit = d.unit?.unit_name || d.unit?.short_name || off?.unit?.unit_name || '';
                        const key = (nrp || name).trim().toLowerCase();
                        if (!seen.has(key)) {
                          seen.add(key);
                          let acceptedAt: string | null = null;
                          if (d.accepted_at) {
                            try {
                              acceptedAt = new Date(d.accepted_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
                            } catch (_) {}
                          }
                          const nameParts = name.replace(/^(Bripka|Ipda|Aiptu|Aipda|Briptu|Bripda|AKP|Kompol|AKBP|Kombes|Brigadir)\s+/i, '').trim().split(' ');
                          const initials = ((nameParts[0]?.[0] || 'P') + (nameParts[1]?.[0] || '')).toUpperCase();
                          list.push({
                            name,
                            rank,
                            nrp,
                            unit,
                            acceptedAt,
                            avatarUrl: off?.avatar_url || off?.avatarUrl || null,
                            initials,
                            isPrimary: Boolean(d.is_primary_unit || list.length === 0),
                          });
                        }
                      });

                      if (list.length === 0 && activeComplaint.assignedOfficer) {
                        const ao = activeComplaint.assignedOfficer;
                        const rawName = ao.namaLengkap || ao.name || '';
                        const rank = ao.rankPangkat || '';
                        const name = formatOfficerName(rank, rawName) || 'Personel Lapangan';
                        const nrp = ao.nrp || '';
                        const nameParts = name.replace(/^(Bripka|Ipda|Aiptu|Aipda|Briptu|Bripda|AKP|Kompol|AKBP|Kombes|Brigadir)\s+/i, '').trim().split(' ');
                        const initials = ((nameParts[0]?.[0] || 'P') + (nameParts[1]?.[0] || '')).toUpperCase();
                        list.push({
                          name,
                          rank,
                          nrp,
                          unit: ao.assignedPatrolVehicle || '',
                          acceptedAt: activeComplaint.disposisiAt ? new Date(activeComplaint.disposisiAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB' : null,
                          avatarUrl: ao.avatarUrl || null,
                          initials,
                          isPrimary: true,
                        });
                      }

                      if (list.length === 0) return null;

                      return (
                        <div
                          style={{
                            marginTop: '12px',
                            background: '#FFFFFF',
                            border: '1px solid #E2E8F0',
                            borderRadius: '10px',
                            padding: '12px 14px',
                            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
                          }}
                        >
                          {/* Clean Header */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              paddingBottom: '8px',
                              marginBottom: '10px',
                              borderBottom: '1px solid #F1F5F9',
                            }}
                          >
                            <div
                              style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '6px',
                                background: '#EFF6FF',
                                color: '#1D4ED8',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '12px',
                                flexShrink: 0,
                              }}
                            >
                              👥
                            </div>
                            <span style={{ fontSize: '11px', fontWeight: 800, color: '#0F172A', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                              Personel Bertugas
                            </span>
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                background: '#F1F5F9',
                                color: '#475569',
                                padding: '1px 6px',
                                borderRadius: '5px',
                              }}
                            >
                              {list.length} Personel
                            </span>
                          </div>

                          {/* List of Officer Cards */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {list.map((off, idx) => (
                              <div
                                key={idx}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  background: '#F8FAFC',
                                  border: '1px solid #E2E8F0',
                                  borderRadius: '8px',
                                  padding: '9px 12px',
                                  gap: '10px',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                                  <NameInitialAvatar
                                    name={off.name}
                                    avatarUrl={off.avatarUrl}
                                    size={34}
                                    variant="blue"
                                  />
                                  <div style={{ minWidth: 0, flex: 1 }}>
                                    <div style={{ fontSize: '12px', fontWeight: 800, color: '#0F172A', whiteSpace: 'nowrap' }}>
                                      {off.name}
                                    </div>
                                    <div
                                      style={{
                                        fontSize: '10.5px',
                                        color: '#64748B',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        marginTop: '2px',
                                        flexWrap: 'wrap',
                                      }}
                                    >
                                      <span>NRP: <strong style={{ color: '#334155' }}>{off.nrp || '-'}</strong></span>
                                      {off.unit && (
                                        <>
                                          <span style={{ color: '#CBD5E1' }}>•</span>
                                          <span style={{ color: '#475569', fontWeight: 500 }}>{off.unit}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                                  <span
                                    style={{
                                      fontSize: '9.5px',
                                      fontWeight: 700,
                                      color: '#15803D',
                                      background: '#DCFCE7',
                                      border: '1px solid #BBF7D0',
                                      padding: '2px 7px',
                                      borderRadius: '4px',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '3px',
                                    }}
                                  >
                                    <span>✓</span> Menyetujui
                                  </span>
                                  {off.acceptedAt && (
                                    <span style={{ fontSize: '9.5px', color: '#64748B', fontWeight: 600 }}>
                                      {off.acceptedAt}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              );
            })()}

            {/* Step 4: Penanganan di Lokasi */}
            {(() => {
              const isStep4Completed = activeComplaint.status === 'SELESAI' || activeComplaint.status === 'MENUNGGU_PENGESAHAN' || Number(activeComplaint.tahap) >= 5;
              const isStep4Active = !isStep4Completed && Number(activeComplaint.tahap) === 4;
              const step4StatusClass = isStep4Completed ? 'completed' : isStep4Active ? 'active' : 'pending';

              const step4Evidences = (activeComplaint.evidences || []).filter(
                (e: any) => e.incident_phase === 'TIBA_TKP' || e.incident_phase === 'PENANGANAN'
              );
              const resolvedFotoTindakan = activeComplaint.fotoTindakan || activeComplaint.fotoTiba || step4Evidences[0]?.file_url || null;

              return (
                <div className={`glow-timeline-step ${step4StatusClass}`}>
                  <div className="glow-timeline-node">
                    {isStep4Completed ? '✓' : isStep4Active ? '📍' : '4'}
                  </div>
                  <div className="glow-timeline-body">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A' }}>4. Penanganan di Lokasi</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span
                          style={{
                            fontSize: '9.5px',
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: '4px',
                            background: isStep4Completed ? '#ECFDF5' : isStep4Active ? '#EDE9FE' : '#F1F5F9',
                            color: isStep4Completed ? '#10B981' : isStep4Active ? '#6D28D9' : '#64748B',
                          }}
                        >
                          {isStep4Completed ? '✓ SELESAI' : isStep4Active ? '● SEDANG BERLANGSUNG' : '🔒 TERKUNCI'}
                        </span>
                        {activeComplaint.responTibaTkpAt && (
                          <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#64748B' }}>
                            {formatDateTimeWib(activeComplaint.responTibaTkpAt, activeComplaint.createdAt)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#475569', marginTop: '4px', lineHeight: 1.4 }}>
                      Personel tiba di lokasi dan sedang melakukan tindakan kepolisian.
                    </div>

                    {isStep4Completed || isStep4Active ? (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px', flexWrap: 'wrap', gap: '6px' }}>
                          <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#1E293B' }}>
                            📅 Tiba di TKP: {activeComplaint.responTibaTkpAt ? formatDateTimeWib(activeComplaint.responTibaTkpAt, activeComplaint.createdAt) : (isStep4Active ? 'Personel Berada di TKP' : '-')}
                          </span>
                          {step4Evidences.length > 0 ? (
                            <span
                              onClick={() => {
                                setLightboxImg({
                                  url: step4Evidences[0].file_url,
                                  title: `Bukti Tindakan TKP (1/${step4Evidences.length})`,
                                  meta: `${activeComplaint.nomorTiket} • ${step4Evidences[0].watermark_text || 'Terverifikasi GPS'}`,
                                  desc: activeComplaint.timelines?.find((t: any) => t.tahapKe === 4)?.catatan || 'Pengamanan TKP dan sterilisasi area',
                                });
                                setShowLightboxModal(true);
                              }}
                              style={{ fontSize: '10px', fontWeight: 700, color: '#10B981', background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer' }}
                            >
                              📸 {step4Evidences.length} Foto Tindakan TKP ➔
                            </span>
                          ) : resolvedFotoTindakan ? (
                            <span
                              onClick={() => {
                                setLightboxImg({
                                  url: resolvedFotoTindakan,
                                  title: 'Foto Tindakan Kepolisian di TKP',
                                  meta: activeComplaint.nomorTiket,
                                  desc: activeComplaint.timelines?.find((t: any) => t.tahapKe === 4)?.catatan || 'Pengamanan TKP dan sterilisasi area',
                                });
                                setShowLightboxModal(true);
                              }}
                              style={{ fontSize: '10px', fontWeight: 700, color: '#10B981', background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer' }}
                            >
                              📸 Bukti Tindakan TKP ➔
                            </span>
                          ) : null}
                        </div>

                        {/* Strip Galeri Foto Tindakan di TKP */}
                        {step4Evidences.length > 0 && (
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px', paddingTop: '6px', borderTop: '1px dashed #E2E8F0' }}>
                            {step4Evidences.map((ev: any, idx: number) => (
                              <div
                                key={ev.id || idx}
                                onClick={() => {
                                  setLightboxImg({
                                    url: ev.file_url,
                                    title: `Foto Tindakan #${idx + 1} - ${activeComplaint.nomorTiket}`,
                                    meta: `${activeComplaint.nomorTiket} • ${ev.watermark_text || 'GPS Sah'}`,
                                    desc: ev.caption || 'Pengamanan TKP dan tindakan presisi di lapangan',
                                  });
                                  setShowLightboxModal(true);
                                }}
                                style={{
                                  position: 'relative',
                                  width: '42px',
                                  height: '42px',
                                  borderRadius: '6px',
                                  overflow: 'hidden',
                                  border: '1.5px solid #10B981',
                                  cursor: 'pointer',
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                }}
                                title={`Klik untuk perbesar Foto #${idx + 1}`}
                              >
                                <img
                                  src={ev.file_url}
                                  alt={`Foto Tindakan ${idx + 1}`}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                                <span style={{
                                  position: 'absolute',
                                  bottom: 0,
                                  right: 0,
                                  background: 'rgba(0,0,0,0.65)',
                                  color: 'white',
                                  fontSize: '8px',
                                  fontWeight: 800,
                                  padding: '0 3px',
                                  borderTopLeftRadius: '3px',
                                }}>
                                  #{idx + 1}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        <div style={{ background: '#FEFCE8', borderLeft: '3px solid #EAB308', borderRadius: '0 6px 6px 0', padding: '6px 10px', marginTop: '8px', lineHeight: 1.4 }}>
                          <div style={{ fontSize: '10px', fontWeight: 700, color: '#854D0E', marginBottom: '2px' }}>📝 BERITA ACARA TINDAKAN TKP:</div>
                          <div style={{ fontSize: '11px', color: '#1E293B' }}>
                            {(() => {
                              const rawNote =
                                activeComplaint.catatanTindakan ||
                                (activeComplaint.timelines || []).slice().reverse().find((t: any) => t.actionKey === 'REPORT_SUBMITTED' && t.catatan)?.catatan ||
                                (activeComplaint.complaintLogs || []).slice().reverse().find((l: any) => (l.action === 'REPORT_SUBMITTED' || l.action === 'DOKUMENTASI_TKP_FLAGGED') && l.notes)?.notes;
                              const cleanNote = rawNote
                                ? rawNote.replace(/^Catatan:\s*/i, '').trim()
                                : 'Personel tiba di TKP, mengamankan perimeter dan memastikan situasi kamtibmas kondusif.';
                              return `"${cleanNote}"`;
                            })()}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div style={{ fontSize: '10.5px', color: '#94A3B8', fontStyle: 'italic', marginTop: '6px' }}>
                        Menunggu Personel Tiba di TKP
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Step 5: Kasus Selesai Ditangani */}
            {(() => {
              const isStep5Completed = activeComplaint.status === 'SELESAI';
              const isStep5Awaiting = activeComplaint.status === 'MENUNGGU_PENGESAHAN';
              const isStep5Open = isStep5Completed || isStep5Awaiting || Boolean(activeComplaint.catatanSelesai) || (activeComplaint.tahap >= 5);
              const step5StatusClass = isStep5Completed ? 'completed' : isStep5Awaiting ? 'active' : 'pending';

              const step5Evidences = (activeComplaint.evidences || []).filter(
                (e: any) =>
                  e.incident_phase === 'SELESAI_KONDUSIF' ||
                  e.incident_phase === 'SELESAI' ||
                  (e.caption || '').toLowerCase().includes('selesai') ||
                  (e.caption || '').toLowerCase().includes('bap') ||
                  (e.caption || '').toLowerCase().includes('mediasi') ||
                  (e.caption || '').toLowerCase().includes('kondusif')
              );
              const resolvedFotoSelesai =
                activeComplaint.fotoSelesai ||
                step5Evidences.find((e: any) => !e.file_url?.match(/\.(pdf|doc|docx|mp4|webm|mov)$/i))?.file_url;

              return (
                <div className={`glow-timeline-step ${step5StatusClass}`}>
                  <div className="glow-timeline-node">
                    {isStep5Completed ? '✓' : isStep5Awaiting ? '⚖️' : '5'}
                  </div>
                  <div className="glow-timeline-body">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A' }}>5. Kasus Selesai Ditangani</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span
                          style={{
                            fontSize: '9.5px',
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: '4px',
                            background: isStep5Completed ? '#ECFDF5' : isStep5Awaiting ? '#FEF3C7' : '#F1F5F9',
                            color: isStep5Completed ? '#10B981' : isStep5Awaiting ? '#B45309' : '#64748B',
                          }}
                        >
                          {isStep5Completed ? '✓ SELESAI' : isStep5Awaiting ? '⏳ MENUNGGU OTORISASI' : '🔒 TERKUNCI'}
                        </span>
                        {activeComplaint.selesaiAt && (
                          <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#64748B' }}>
                            {formatDateTimeWib(activeComplaint.selesaiAt, activeComplaint.createdAt)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#475569', marginTop: '4px', lineHeight: 1.4 }}>
                      Penanganan selesai dan berita acara penutupan kasus disahkan resmi oleh Pawas.
                    </div>

                    {isStep5Open ? (
                      <div style={{ marginTop: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                          <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#1E293B' }}>
                            📅 {isStep5Completed ? 'Disahkan:' : 'Pengajuan BAP:'} {activeComplaint.selesaiAt ? formatDateTimeWib(activeComplaint.selesaiAt, activeComplaint.createdAt) : (isStep5Awaiting ? 'Menunggu Otorisasi Pawas' : '-')}
                          </span>
                          {step5Evidences.length > 0 ? (
                            <span
                              onClick={() => {
                                const firstMedia = step5Evidences[0];
                                if (firstMedia.file_url?.match(/\.(pdf|doc|docx)$/i)) {
                                  window.open(firstMedia.file_url, '_blank');
                                } else {
                                  setLightboxImg({
                                    url: firstMedia.file_url,
                                    title: firstMedia.caption || 'Berkas Bukti Selesai',
                                    meta: `${activeComplaint.nomorTiket}`,
                                    desc: `Bukti penutupan kasus diajukan personil`,
                                  });
                                  setShowLightboxModal(true);
                                }
                              }}
                              style={{ fontSize: '10px', fontWeight: 700, color: '#10B981', background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer' }}
                            >
                              📎 {step5Evidences.length} Berkas Bukti Selesai ➔
                            </span>
                          ) : resolvedFotoSelesai ? (
                            <span
                              onClick={() => {
                                setLightboxImg({
                                  url: resolvedFotoSelesai,
                                  title: 'Foto Situasi Akhir & BAP',
                                  meta: activeComplaint.nomorTiket,
                                  desc: 'Situasi kondusif dan berita acara penanganan tuntas',
                                });
                                setShowLightboxModal(true);
                              }}
                              style={{ fontSize: '10px', fontWeight: 700, color: '#10B981', background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer' }}
                            >
                              ✅ Bukti Situasi Akhir ➔
                            </span>
                          ) : null}
                        </div>

                        {/* Strip Galeri Multi-Media Bukti Penyelesaian */}
                        {step5Evidences.length > 0 && (
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px', paddingTop: '6px', borderTop: '1px dashed #E2E8F0' }}>
                            {step5Evidences.map((ev: any, idx: number) => {
                              const isDoc = ev.file_url?.match(/\.(pdf|doc|docx)$/i);
                              const isVid = ev.file_url?.match(/\.(mp4|webm|mov)$/i);

                              if (isDoc) {
                                return (
                                  <a
                                    key={ev.id || idx}
                                    href={ev.file_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '5px',
                                      padding: '4px 8px',
                                      background: '#F5F3FF',
                                      border: '1px solid #DDD6FE',
                                      borderRadius: '6px',
                                      fontSize: '10px',
                                      fontWeight: 700,
                                      color: '#6D28D9',
                                      textDecoration: 'none',
                                    }}
                                    title="Buka Dokumen Resmi BAP (PDF / DOCX)"
                                  >
                                    <span>📄</span>
                                    <span>{ev.caption || 'Dokumen BAP (PDF)'}</span>
                                    <span style={{ fontSize: '9px' }}>↗</span>
                                  </a>
                                );
                              }

                              if (isVid) {
                                return (
                                  <button
                                    key={ev.id || idx}
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setLightboxImg({
                                        url: ev.file_url,
                                        title: ev.caption || 'Video Mediasi Lapangan',
                                        meta: `${activeComplaint.nomorTiket} • Video Mediasi`,
                                        desc: `Rekaman video mediasi/kesepakatan musyawarah warga`,
                                      });
                                      setShowLightboxModal(true);
                                    }}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '5px',
                                      padding: '4px 8px',
                                      background: '#FFFBEB',
                                      border: '1px solid #FDE68A',
                                      borderRadius: '6px',
                                      fontSize: '10px',
                                      fontWeight: 700,
                                      color: '#B45309',
                                      cursor: 'pointer',
                                    }}
                                    title="Putar Video Mediasi"
                                  >
                                    <span>🎥</span>
                                    <span>{ev.caption || 'Video Mediasi'}</span>
                                    <span style={{ fontSize: '9px' }}>▶</span>
                                  </button>
                                );
                              }

                              return (
                                <div
                                  key={ev.id || idx}
                                  onClick={() => {
                                    setLightboxImg({
                                      url: ev.file_url,
                                      title: `Bukti Foto Penyelesaian #${idx + 1}`,
                                      meta: `${activeComplaint.nomorTiket} • ${ev.watermark_text || 'Terverifikasi GPS'}`,
                                      desc: ev.caption || 'Dokumentasi visual situasi kondusif',
                                    });
                                    setShowLightboxModal(true);
                                  }}
                                  style={{
                                    position: 'relative',
                                    width: '42px',
                                    height: '42px',
                                    borderRadius: '6px',
                                    overflow: 'hidden',
                                    border: '1.5px solid #10B981',
                                    cursor: 'pointer',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                  }}
                                  title={`Foto #${idx + 1}: ${ev.caption || 'Bukti Selesai'} (Klik perbesar)`}
                                >
                                  <img
                                    src={ev.file_url}
                                    alt={`Bukti Selesai ${idx + 1}`}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  />
                                  <span style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    right: 0,
                                    background: 'rgba(0,0,0,0.65)',
                                    color: 'white',
                                    fontSize: '8px',
                                    fontWeight: 800,
                                    padding: '0 3px',
                                    borderTopLeftRadius: '3px',
                                  }}>
                                    #{idx + 1}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Catatan Laporan Akhir Petugas Lapangan */}
                        <div style={{ background: '#ECFDF5', borderLeft: '3px solid #10B981', borderRadius: '0 6px 6px 0', padding: '6px 10px', marginTop: '8px', lineHeight: 1.4 }}>
                          <div style={{ fontSize: '10px', fontWeight: 700, color: '#047857', marginBottom: '2px' }}>✓ LAPORAN AKHIR PETUGAS:</div>
                          <div style={{ fontSize: '11px', color: '#1E293B' }}>
                            &quot;{activeComplaint.catatanSelesai || (activeComplaint.timelines?.find((t: any) => t.tahapKe === 5)?.catatan) || 'Situasi telah aman dan kondusif. Penanganan lapangan tuntas sesuai SOP.'}&quot;
                          </div>
                        </div>

                        {isStep5Completed ? (
                          <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderLeft: '4px solid #16A34A', borderRadius: '6px', padding: '7px 10px', marginTop: '8px', lineHeight: 1.4 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '10px', fontWeight: 800, color: '#15803D' }}>⚖️ PENGESAHAN RESMI PIMPINAN (PAWAS):</span>
                              <span style={{ fontSize: '9.5px', fontWeight: 700, background: '#DCFCE7', color: '#166534', padding: '1px 6px', borderRadius: '3px' }}>SAH &amp; VALID</span>
                            </div>
                            <div style={{ fontSize: '10.5px', color: '#166534', marginTop: '2px' }}>
                              <strong>Pengesah:</strong> {activeComplaint.pawas?.namaLengkap || userProfile.fullName} (Pawas) • <strong>Waktu:</strong> {activeComplaint.selesaiAt ? new Date(activeComplaint.selesaiAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB' : 'Hari ini'}
                            </div>
                            <div style={{ fontSize: '11px', color: '#1E293B', fontStyle: 'italic', marginTop: '2px' }}>
                              &quot;{activeComplaint.timelines?.find((t: any) => t.tahapKe === 5)?.catatan || 'Berita acara lengkap, penanganan tuntas sesuai SOP Polri Presisi.'}&quot;
                            </div>
                          </div>
                        ) : isStep5Awaiting ? (
                          <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', borderLeft: '4px solid #F59E0B', borderRadius: '6px', padding: '7px 10px', marginTop: '8px', lineHeight: 1.4 }}>
                            <div style={{ fontSize: '10px', fontWeight: 800, color: '#B45309' }}>⏳ MENUNGGU OTORISASI PENGESAHAN PAWAS:</div>
                            <div style={{ fontSize: '11px', color: '#78350F', marginTop: '2px' }}>
                              Petugas lapangan telah menyelesaikan penanganan dan melampirkan berkas bukti di atas. Silakan lakukan evaluasi dan klik tombol <strong>Otorisasi Pengesahan</strong> di bawah.
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <div style={{ fontSize: '10.5px', color: '#94A3B8', fontStyle: 'italic', marginTop: '6px' }}>
                        Menunggu Otorisasi Penutupan Kasus
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* ACTION & SLA COCKPIT BOX 1:1 PROTOTYPE */}
          <div id="tl-actions-box" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Indikator Evaluasi 3 Lapis SLA Presisi */}
            <div style={{ background: '#0F172A', color: '#F8FAFC', borderRadius: '10px', padding: '12px', borderLeft: '4px solid #38BDF8', boxShadow: '0 4px 14px rgba(0,0,0,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', paddingBottom: '6px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '12px' }}>⏱️</span>
                  <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#E2E8F0', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                    MONITORING 3 TAHAPAN SLA POLRI
                  </span>
                </div>
                <span style={{ fontSize: '9.5px', fontWeight: 700, color: '#38BDF8', background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.25)', padding: '1px 7px', borderRadius: '4px' }}>
                  STANDAR PRESISI
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {/* SLA 1 */}
                {(() => {
                  const tCreate = activeComplaint.createdAt ? new Date(activeComplaint.createdAt) : null;
                  const tDisp = activeComplaint.disposisiAt ? new Date(activeComplaint.disposisiAt) : null;
                  const mDisp = tCreate && tDisp ? Math.max(1, Math.round((tDisp.getTime() - tCreate.getTime()) / 60000)) : null;
                  return (
                    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px', padding: '6px 9px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#F1F5F9' }}>1. Respon Pawas (Disposisi)</div>
                        <div style={{ fontSize: '9.5px', color: '#94A3B8' }}>
                          Target &le; 5 Menit ({tCreate ? formatTimeWib(tCreate) : '-'} ➔ {tDisp ? formatTimeWib(tDisp) : 'Menunggu'})
                        </div>
                      </div>
                      <span style={{ fontSize: '9.5px', fontWeight: 700, background: mDisp && mDisp <= 5 ? '#065F46' : '#854D0E', color: mDisp && mDisp <= 5 ? '#34D399' : '#FDE68A', padding: '2px 7px', borderRadius: '4px' }}>
                        {mDisp !== null ? (mDisp <= 5 ? `✓ Respon Cepat (${mDisp}m)` : `⚠️ Over SLA (${mDisp}m)`) : '● Menunggu Disposisi'}
                      </span>
                    </div>
                  );
                })()}

                {/* SLA 2 */}
                {(() => {
                  const tDisp = activeComplaint.disposisiAt ? new Date(activeComplaint.disposisiAt) : null;
                  const primaryDispatch = (activeComplaint.dispatches || []).find((d: any) => d.is_primary_unit) || (activeComplaint.dispatches || [])[0];
                  const logMeluncur = (activeComplaint.complaintLogs || []).find((l: any) => l.action?.includes('Meluncur') || l.action?.includes('MENUJU_TKP'));
                  const rawMove = primaryDispatch?.accepted_at || primaryDispatch?.departed_at || activeComplaint.waktuMeluncur || logMeluncur?.created_at;
                  const tMove = rawMove ? new Date(rawMove) : null;
                  const mTanggap = tDisp && tMove ? Math.max(1, Math.round((tMove.getTime() - tDisp.getTime()) / 60000)) : null;
                  const isAccepted = Boolean(tMove || activeComplaint.status !== 'BELUM_DITANGANI');
                  return (
                    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px', padding: '6px 9px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#F1F5F9' }}>2. Respon Anggota (Tanggap)</div>
                        <div style={{ fontSize: '9.5px', color: '#94A3B8' }}>
                          Target &le; 3 Menit ({tDisp ? formatTimeWib(tDisp) : '-'} ➔ {tMove ? formatTimeWib(tMove) : isAccepted ? 'Diterima' : 'Menunggu'})
                        </div>
                      </div>
                      <span style={{ fontSize: '9.5px', fontWeight: 700, background: isAccepted ? (mTanggap && mTanggap > 3 ? '#854D0E' : '#065F46') : '#334155', color: isAccepted ? (mTanggap && mTanggap > 3 ? '#FDE68A' : '#34D399') : '#94A3B8', padding: '2px 7px', borderRadius: '4px' }}>
                        {mTanggap !== null ? (mTanggap <= 3 ? `✓ Tanggap Cepat (${mTanggap}m)` : `⚠️ (${mTanggap}m)`) : isAccepted ? '✓ Diterima Personel' : '● Belum Bergerak'}
                      </span>
                    </div>
                  );
                })()}

                {/* SLA 3 */}
                {(() => {
                  const primaryDispatch = (activeComplaint.dispatches || []).find((d: any) => d.is_primary_unit) || (activeComplaint.dispatches || [])[0];
                  const rawDepart = primaryDispatch?.departed_at || activeComplaint.waktuMeluncur || null;
                  const rawArrive = primaryDispatch?.arrived_at || activeComplaint.responTibaTkpAt || null;
                  const isMoving = Number(activeComplaint.tahap) === 3;
                  const isAtTkp = Number(activeComplaint.tahap) >= 4 || activeComplaint.status === 'SELESAI' || activeComplaint.status === 'MENUNGGU_PENGESAHAN';
                  return (
                    <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid #0284C7', borderRadius: '6px', padding: '7px 9px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#F1F5F9' }}>3. Tempuh ke TKP (Target &le; 10m)</div>
                        <span style={{ fontSize: '9px', fontWeight: 700, background: isMoving ? '#0C4A6E' : isAtTkp ? '#065F46' : '#334155', color: isMoving ? '#38BDF8' : isAtTkp ? '#34D399' : '#94A3B8', padding: '2px 6px', borderRadius: '4px' }}>
                          {isMoving ? '● Sedang Meluncur' : isAtTkp ? '● Tepat di TKP' : '● Standby'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '9.5px', color: '#94A3B8' }}>
                          {Number(activeComplaint.tahap) === 3
                            ? `Berangkat: ${rawDepart ? formatTimeWib(rawDepart) : (activeComplaint.disposisiAt ? formatTimeWib(activeComplaint.disposisiAt) : '-')}`
                            : rawArrive
                            ? `Tiba: ${formatTimeWib(rawArrive)}`
                            : 'Estimasi: ± 4-6 Menit'}
                        </div>
                        <div style={{ fontFamily: 'inherit', fontSize: '14px', fontWeight: 800, color: '#38BDF8', letterSpacing: '0.3px' }}>
                          {Number(activeComplaint.tahap) === 3
                            ? formatSlaClock(slaClockSeconds)
                            : activeComplaint.responseTimeMinutes
                            ? `${activeComplaint.responseTimeMinutes} Menit`
                            : '06:00'}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Disposisi Pasukan oleh Pawas */}
            <div style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '10px', padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#1E293B' }}>🚔 DISPOSISI PASUKAN OLEH PAWAS</span>
                <span style={{ fontSize: '10px', fontWeight: 700, background: activeStatMeta.badge_bg || '#EFF6FF', color: activeStatMeta.badge_color || '#2563EB', border: `1px solid ${activeStatMeta.badge_border || '#BFDBFE'}`, padding: '2px 6px', borderRadius: '4px' }}>
                  {activeStatMeta.key === 'SELESAI' ? 'Penanganan Selesai' : activeStatMeta.key === 'MENUNGGU' ? 'Menunggu Penugasan' : activeStatMeta.label}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#334155', lineHeight: 1.55 }}>
                <div>• <strong>Satuan Bertugas:</strong> {activeComplaint.assignedOfficer?.assignedPatrolVehicle || 'Patroli Samapta Presisi (Unit Roda 4)'}</div>
                <div>• <strong>Pimpinan Regu:</strong> {activeComplaint.assignedOfficer ? `${formatOfficerName(activeComplaint.assignedOfficer.rankPangkat, activeComplaint.assignedOfficer.namaLengkap)} (NRP: ${activeComplaint.assignedOfficer.nrp || '-'})` : 'Menunggu Disposisi Pawas'}</div>
                <div>• <strong>Posisi Awal Armada:</strong> <span style={{ color: '#475569' }}>{activeComplaint.assignedOfficer?.jabatan || 'Polres Metro Jaksel / Posko Presisi'}</span></div>
                <div>• <strong>Waktu Disposisi:</strong> {activeComplaint.disposisiAt ? formatTimeWib(activeComplaint.disposisiAt) : 'Dalam Antrean'}</div>
                <div style={{ marginTop: '4px', background: 'white', borderLeft: '3px solid #3B82F6', padding: '6px 8px', borderRadius: '0 6px 6px 0', fontSize: '11.5px', fontStyle: 'italic' }}>
                  &quot;{activeComplaint.timelines?.find((t: any) => t.tahapKe === 2 || t.tahapKe === 1)?.catatan || 'Datangi TKP dengan sirine biru, amankan perimeter, prioritaskan perlindungan warga dan amankan barang bukti.'}&quot;
                </div>
                <div style={{ marginTop: '4px', background: '#EFF6FF', borderLeft: '3px solid #0284C7', padding: '6px 8px', borderRadius: '0 6px 6px 0', fontSize: '11.5px', color: '#0369A1' }}>
                  <strong>🚔 Back-Up Siaga:</strong> {fleetUnits.find(u => u.nrp !== activeComplaint.assignedOfficer?.nrp)?.title || 'Unit Perintis Presisi R-2'} standby radius terdekat
                </div>
              </div>
            </div>

            {/* EKSEKUSI OPERASIONAL 1:1 PROTOTYPE (Disposisi Unit Cadangan / Backup) */}
            {activeStatMeta.key === 'DIPROSES' && (
              <>
                {/* Tombol Kerahkan Unit Cadangan / Back-Up */}
                <button
                  type="button"
                  id="btn-backup-disposisi"
                  data-testid="btn-backup-disposisi"
                  onClick={() => {
                    bukaModalDisposisi(activeComplaint);
                  }}
                  style={{
                    width: '100%',
                    padding: '11px 12px',
                    background: '#0284C7',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <span>🚔</span> Kerahkan Unit Cadangan / Back-Up Tambahan
                </button>
              </>
            )}

            {/* Tombol Otorisasi & Pengesahan Kasus (SELESAI) oleh Pawas */}
            {(activeStatMeta.key === 'MENUNGGU_PENGESAHAN' || activeComplaint.status === 'MENUNGGU_PENGESAHAN' || (Boolean(activeComplaint.catatanSelesai) && activeComplaint.status !== 'SELESAI')) && handleSahkanPenutupanKasus && (
              <button
                type="button"
                id="btn-sahkan-kasus"
                data-testid="btn-sahkan-kasus"
                onClick={() => handleSahkanPenutupanKasus(activeComplaint)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>⚖️</span> Sahkan Laporan &amp; Tutup Kasus (SELESAI) ➔
              </button>
            )}

            {/* Penilaian Warga (Hanya muncul jika warga telah memberikan ulasan) */}
            {activeComplaint.status === 'SELESAI' && (
              activeComplaint.citizenRating ? (
                <div style={{ background: '#FFFBEB', border: '1.5px solid #FDE68A', borderRadius: '8px', padding: '12px', boxShadow: '0 2px 6px rgba(245,158,11,0.08)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#B45309', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      ⭐ Penilaian Warga (Portal 110)
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#D97706' }}>
                      {'★'.repeat(activeComplaint.citizenRating)}{'☆'.repeat(5 - activeComplaint.citizenRating)} ({activeComplaint.citizenRating}/5)
                    </span>
                  </div>
                  {activeComplaint.citizenTags && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', margin: '6px 0' }}>
                      {activeComplaint.citizenTags.split(',').map((t: string) => t.trim()).filter(Boolean).map((t: string) => (
                        <span key={t} style={{ fontSize: '10px', background: '#FEF3C7', color: '#92400E', padding: '2px 7px', borderRadius: '10px', fontWeight: 600 }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                  {activeComplaint.citizenReview && (
                    <div style={{ fontSize: '12px', fontStyle: 'italic', color: '#78350F', background: 'white', padding: '8px 10px', borderRadius: '6px', border: '1px dashed #FCD34D', marginTop: '4px' }}>
                      &quot;{activeComplaint.citizenReview}&quot;
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: '8px', padding: '10px 12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      ⭐ Penilaian Warga (Portal 110)
                    </span>
                    <span style={{ fontSize: '9.5px', fontWeight: 700, background: '#F1F5F9', color: '#64748B', padding: '1px 6px', borderRadius: '4px' }}>
                      MENUNGGU ULASAN
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px', fontStyle: 'italic' }}>
                    Kasus telah tuntas disahkan. Warga pelapor belum memberikan penilaian &amp; ulasan di Portal 110.
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* MODAL FULLSCREEN GPS & LIVE NAVIGATION ROUTE */}
      <TrackingMapModal
        isOpen={showTrackingMapModal}
        onClose={() => setShowTrackingMapModal(false)}
        complaint={activeComplaint}
        assignedOfficer={activeComplaint.assignedOfficer}
        fleetUnits={fleetUnits}
      />
    </>
  );
};

export default TabValidasiDossier;
