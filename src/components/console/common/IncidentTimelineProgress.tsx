'use client';

import React, { useState } from 'react';
import '@/app/console/console.css';
import { formatIncidentDateTime, formatTimeWib, formatDateTimeWib } from '@/lib/date-utils';
import TrackingMapModal from '@/components/console/common/TrackingMapModal';
import NameInitialAvatar from '@/components/ui/NameInitialAvatar';

export interface IncidentTimelineProgressProps {
  complaint: any;
  userRole?: 'PAWAS' | 'PERSONIL' | 'SUPERADMIN';
  currentUser?: any;
  fleetUnits?: any[];
  onOpenWizard?: (complaint: any) => void;
  onOpenTrackingMap?: (complaint: any) => void;
  onOpenLightbox?: (data: { url: string; title: string; meta?: string; desc?: string }) => void;
  actionSlot?: React.ReactNode;
}

export const IncidentTimelineProgress: React.FC<IncidentTimelineProgressProps> = ({
  complaint,
  userRole = 'PERSONIL',
  currentUser,
  fleetUnits = [],
  onOpenWizard,
  onOpenTrackingMap,
  onOpenLightbox,
  actionSlot,
}) => {
  const [internalTrackingMapOpen, setInternalTrackingMapOpen] = useState(false);
  const [internalLightbox, setInternalLightbox] = useState<{
    url: string;
    title: string;
    meta?: string;
    desc?: string;
  } | null>(null);

  if (!complaint) return null;

  const handleLightbox = (data: { url: string; title: string; meta?: string; desc?: string }) => {
    if (onOpenLightbox) {
      onOpenLightbox(data);
    } else {
      setInternalLightbox(data);
    }
  };

  const handleTrackingMap = () => {
    if (onOpenTrackingMap) {
      onOpenTrackingMap(complaint);
    } else {
      setInternalTrackingMapOpen(true);
    }
  };

  const formatOfficerName = (rank?: string, fullName?: string) => {
    if (!fullName) return rank ? `${rank} Personel` : 'Personel Lapangan';
    const cleanRank = (rank || '').trim();
    let cleanName = (fullName || '').trim();
    if (cleanRank && cleanName.toLowerCase().startsWith(cleanRank.toLowerCase())) {
      return cleanName;
    }
    return cleanRank ? `${cleanRank} ${cleanName}` : cleanName;
  };

  // Status Badge Resolver Resmi Master Database
  const resolveStatusMeta = (statusRaw?: string) => {
    const s = String(statusRaw || '').toUpperCase();
    if (s === 'SELESAI') {
      return { label: '✓ Selesai & Kondusif', bg: '#ECFDF5', color: '#059669', border: '#A7F3D0' };
    }
    if (s === 'MENUNGGU_PENGESAHAN') {
      return { label: '⚖️ Menunggu Pengesahan Pawas', bg: '#FAF5FF', color: '#7C3AED', border: '#DDD6FE' };
    }
    if (s === 'DITOLAK') {
      return { label: '✕ Ditolak', bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' };
    }
    if (s === 'DIPROSES') {
      const tahap = Number(complaint.tahap || 2);
      if (tahap >= 4) {
        return { label: '📍 Penanganan di Lokasi (TKP)', bg: '#ECFDF5', color: '#10B981', border: '#D1FAE5' };
      }
      if (tahap === 3) {
        return { label: '🚔 Personel Meluncur ke TKP', bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' };
      }
      return { label: 'Sedang Ditangani', bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' };
    }
    return { label: 'Menunggu Validasi Pawas', bg: '#FFFBEB', color: '#D97706', border: '#FDE68A' };
  };

  const statusMeta = resolveStatusMeta(complaint.status);

  // Status Stepper Phases (Baku mengikuti tahap operasional riil)
  const isStep2Completed = complaint.status !== 'MENUNGGU' && (complaint.status as string) !== 'BELUM_DITANGANI';

  const isStep3Completed =
    Number(complaint.tahap) >= 4 ||
    complaint.status === 'SELESAI' ||
    complaint.status === 'MENUNGGU_PENGESAHAN' ||
    Boolean(complaint.responTibaTkpAt);
  const isStep3Active = !isStep3Completed && Number(complaint.tahap) === 3;
  const step3StatusClass = isStep3Completed ? 'completed' : isStep3Active ? 'active' : 'pending';

  const isStep4Completed =
    Number(complaint.tahap) >= 5 ||
    complaint.status === 'SELESAI' ||
    complaint.status === 'MENUNGGU_PENGESAHAN';
  const isStep4Active = !isStep4Completed && Number(complaint.tahap) === 4;
  const step4StatusClass = isStep4Completed ? 'completed' : isStep4Active ? 'active' : 'pending';

  const isStep5Completed = complaint.status === 'SELESAI';
  const isStep5Active = !isStep5Completed && complaint.status === 'MENUNGGU_PENGESAHAN';
  const step5StatusClass = isStep5Completed ? 'completed' : isStep5Active ? 'active' : 'pending';

  // Waktu & Timestamps Riil dari Database
  const baseDate = complaint.created_at || complaint.createdAt || new Date();
  const primaryDispatch = (complaint.dispatches || []).find((d: any) => d.is_primary_unit) || (complaint.dispatches || [])[0];

  const rawMeluncur = primaryDispatch?.departed_at || complaint.waktuMeluncur || null;
  const formattedMeluncur = rawMeluncur ? formatDateTimeWib(rawMeluncur, baseDate) : null;

  const rawTiba = primaryDispatch?.arrived_at || complaint.responTibaTkpAt || complaint.waktuTiba || null;
  const formattedTiba = rawTiba ? formatDateTimeWib(rawTiba, baseDate) : null;

  const rawSelesai = primaryDispatch?.completed_at || complaint.selesaiAt || complaint.waktuSelesai || null;
  const formattedSelesai = rawSelesai ? formatDateTimeWib(rawSelesai, baseDate) : null;

  // Evidences
  const step4Evidences = (complaint.evidences || []).filter(
    (e: any) =>
      e.incident_phase === 'TIBA_TKP' ||
      e.incident_phase === 'PENANGANAN' ||
      (e.caption || '').toLowerCase().includes('tindakan') ||
      (e.caption || '').toLowerCase().includes('tiba')
  );
  const resolvedFotoTindakan = complaint.fotoTindakan || complaint.fotoTiba || step4Evidences[0]?.file_url;

  const step5Evidences = (complaint.evidences || []).filter(
    (e: any) =>
      e.incident_phase === 'SELESAI_KONDUSIF' ||
      e.incident_phase === 'SELESAI' ||
      (e.caption || '').toLowerCase().includes('selesai') ||
      (e.caption || '').toLowerCase().includes('bap') ||
      (e.caption || '').toLowerCase().includes('kondusif')
  );
  const resolvedFotoSelesai = complaint.fotoSelesai || step5Evidences[0]?.file_url;

  // Personel Bertugas
  const rawDispatches = complaint.dispatches || [];
  const acceptedPersonnelList: any[] = [];
  const seenPersonnel = new Set<string>();

  rawDispatches.forEach((d: any) => {
    const off = d.officer;
    const rawName = off?.user?.fullName || off?.user?.nama_lengkap || off?.user?.name || off?.fullName || off?.nama_lengkap || '';
    const rank = off?.rank_pangkat || off?.rankPangkat || '';
    const name = formatOfficerName(rank, rawName) || 'Personel Lapangan';
    const nrp = off?.nrp || off?.user?.identifier || '';
    const unit = d.unit?.unit_name || d.unit?.short_name || '';
    const key = (nrp || name).trim().toLowerCase();
    if (!seenPersonnel.has(key)) {
      seenPersonnel.add(key);
      let acceptedAt: string | null = null;
      if (d.accepted_at) {
        try {
          acceptedAt = new Date(d.accepted_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
        } catch (_) {}
      }
      const nameParts = name.replace(/^(Bripka|Ipda|Aiptu|Aipda|Briptu|Bripda|AKP|Kompol|AKBP|Kombes|Brigadir)\s+/i, '').trim().split(' ');
      const initials = ((nameParts[0]?.[0] || 'P') + (nameParts[1]?.[0] || '')).toUpperCase();
      acceptedPersonnelList.push({
        name,
        rank,
        nrp,
        unit,
        acceptedAt,
        avatarUrl: off?.avatar_url || off?.avatarUrl || null,
        initials,
        isPrimary: Boolean(d.is_primary_unit || acceptedPersonnelList.length === 0),
      });
    }
  });

  if (acceptedPersonnelList.length === 0 && complaint.assignedOfficer) {
    const ao = complaint.assignedOfficer;
    const rawName = ao.namaLengkap || ao.name || '';
    const rank = ao.rankPangkat || '';
    const name = formatOfficerName(rank, rawName) || 'Personel Lapangan';
    const nrp = ao.nrp || '';
    const nameParts = name.replace(/^(Bripka|Ipda|Aiptu|Aipda|Briptu|Bripda|AKP|Kompol|AKBP|Kombes|Brigadir)\s+/i, '').trim().split(' ');
    const initials = ((nameParts[0]?.[0] || 'P') + (nameParts[1]?.[0] || '')).toUpperCase();
    acceptedPersonnelList.push({
      name,
      rank,
      nrp,
      unit: ao.assignedPatrolVehicle || '',
      acceptedAt: complaint.disposisiAt ? new Date(complaint.disposisiAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB' : null,
      avatarUrl: ao.avatarUrl || null,
      initials,
      isPrimary: true,
    });
  }

  return (
    <div id="detail-timeline-view" className="incident-timeline-progress-root">
      {/* HEADER HASIL PELACAKAN */}
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
            background: statusMeta.bg,
            color: statusMeta.color,
            border: `1px solid ${statusMeta.border}`,
          }}
        >
          {statusMeta.label}
        </span>
      </div>

      {/* INCIDENT META DETAILS CARD */}
      <div className="incident-meta-card" style={{ marginBottom: '16px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '12px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <div>
            <div style={{ fontSize: '10px', color: '#64748B', fontWeight: 700 }}>Nomor Laporan</div>
            <div style={{ color: '#153E75', fontFamily: 'monospace', fontSize: '13px', fontWeight: 800 }}>
              {complaint.nomorTiket?.replace(/^#+/, '')}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '10px', color: '#64748B', fontWeight: 700 }}>Waktu Lapor</div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#1E293B' }}>
              {formatIncidentDateTime(complaint.createdAt || complaint.created_at || complaint.waktuLapor).full}
            </div>
          </div>
        </div>

        <div style={{ fontSize: '12px', color: '#334155', marginBottom: '4px' }}>
          <span style={{ color: '#64748B', fontWeight: 600 }}>Jenis Insiden:</span>{' '}
          <strong>{complaint.jenisKejadian}</strong>
        </div>
        <div style={{ fontSize: '12px', color: '#334155', marginBottom: '8px' }}>
          <span style={{ color: '#64748B', fontWeight: 600 }}>Lokasi TKP:</span>{' '}
          <span style={{ color: '#475569' }}>{complaint.tkpAlamatTeks}</span>
        </div>

        {/* Foto Bukti Laporan Warga / Compact Pill jika tidak ada */}
        {complaint.fotoBuktiUrl || complaint.fotoTkpUrl ? (
          <div
            style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', background: '#0F172A', cursor: 'pointer', marginBottom: '8px' }}
            onClick={() => {
              handleLightbox({
                url: complaint.fotoBuktiUrl || complaint.fotoTkpUrl,
                title: `Bukti Kasus #${complaint.nomorTiket?.replace(/^#+/, '')}`,
                meta: `TKP: ${complaint.tkpAlamatTeks}`,
                desc: complaint.ringkasanKeterangan,
              });
            }}
            title="Klik untuk perbesar foto laporan"
          >
            <img
              src={complaint.fotoBuktiUrl || complaint.fotoTkpUrl}
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
              <span>Foto Bukti Laporan 110 • {formatIncidentDateTime(complaint.createdAt).time}</span>
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
          &quot;{complaint.ringkasanKeterangan || complaint.deskripsiKejadian || complaint.jenisKejadian}&quot;
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
                  {formatDateTimeWib(complaint.createdAt || complaint.created_at || complaint.waktuLapor)}
                </span>
              </div>
            </div>
            <div style={{ fontSize: '11.5px', color: '#475569', marginTop: '4px', lineHeight: 1.4 }}>
              Laporan telah divalidasi oleh operator 110 dan diteruskan ke komando wilayah.
            </div>
          </div>
        </div>

        {/* Step 2: Disposisi Personel */}
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
                {complaint.disposisiAt && (
                  <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#64748B' }}>
                    {formatDateTimeWib(complaint.disposisiAt, baseDate)}
                  </span>
                )}
              </div>
            </div>
            <div style={{ fontSize: '11.5px', color: '#475569', marginTop: '4px', lineHeight: 1.4 }}>
              {complaint.assignedOfficer
                ? `Tugas penanganan telah diserahkan kepada ${formatOfficerName(complaint.assignedOfficer.rankPangkat, complaint.assignedOfficer.namaLengkap)} (${complaint.assignedOfficer.assignedPatrolVehicle || 'Unit Presisi'}).`
                : 'Menunggu penugasan personel dan armada reaksi cepat oleh Pawas.'}
            </div>
            {complaint.arahanPawas && (
              <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '6px', padding: '6px 8px', marginTop: '6px', fontSize: '10.5px', color: '#78350F' }}>
                <strong>👑 Arahan Pawas:</strong> &quot;{complaint.arahanPawas}&quot;
              </div>
            )}
          </div>
        </div>

        {/* Step 3: Personel Menuju Lokasi */}
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
              {complaint.assignedOfficer
                ? `Tim ${complaint.assignedOfficer.assignedPatrolVehicle || 'Presisi'} sedang meluncur ke lokasi kejadian. Sirine biru aktif dan pantauan GPS terhubung.`
                : 'Menunggu unit meluncur.'}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px', flexWrap: 'wrap', gap: '6px' }}>
              <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#1E293B' }}>
                📅 Meluncur: {formattedMeluncur || (isStep3Active ? 'Sedang Bergerak' : '-')}
              </span>
              {complaint.fotoPersiapan && (
                <span
                  onClick={() => {
                    handleLightbox({
                      url: complaint.fotoPersiapan,
                      title: 'Bukti Persiapan & GPS Lapangan',
                      meta: complaint.assignedOfficer?.assignedPatrolVehicle || '-',
                      desc: 'Armada dalam perjalanan menuju TKP',
                    });
                  }}
                  style={{ fontSize: '10px', fontWeight: 700, color: '#1E40AF', background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer' }}
                >
                  📷 Bukti Persiapan &amp; GPS ➔
                </span>
              )}
            </div>

            {/* Tracking Map Card */}
            <div
              onClick={handleTrackingMap}
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
              {complaint.fotoPersiapan ? (
                <img src={complaint.fotoPersiapan} alt="Patrol Car" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                  name={complaint.assignedOfficer?.namaLengkap}
                  avatarUrl={complaint.assignedOfficer?.avatarUrl}
                  size={28}
                  variant="blue"
                />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ color: 'white', fontSize: '11px', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {complaint.assignedOfficer ? `${complaint.assignedOfficer.assignedPatrolVehicle || 'Unit Presisi'} (${formatOfficerName(complaint.assignedOfficer.rankPangkat, complaint.assignedOfficer.namaLengkap)})` : 'Unit Patroli Presisi'}
                  </div>
                  <div style={{ color: '#38BDF8', fontSize: '9.5px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>Status: {(complaint.tahap ?? 0) >= 3 ? 'Menuju Lokasi' : 'Tepat Waktu'}</span>
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
                {complaint.tkpLat && complaint.tkpLng ? `${Number(complaint.tkpLat).toFixed(4)}, ${Number(complaint.tkpLng).toFixed(4)}` : '-'}
              </div>
            </div>

            {/* DAFTAR PERSONEL REGU YANG IKUT / MENYETUJUI TUGAS */}
            {acceptedPersonnelList.length > 0 && (
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
                    Personel Bertugas ({acceptedPersonnelList.length} Personel)
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {acceptedPersonnelList.map((off, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: '#F8FAFC',
                        border: off.isPrimary ? '1.5px solid #BFDBFE' : '1px solid #E2E8F0',
                        borderRadius: '8px',
                        padding: '8px 10px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                        <NameInitialAvatar
                          name={off.name}
                          avatarUrl={off.avatarUrl}
                          size={32}
                          variant={off.isPrimary ? 'blue' : 'emerald'}
                        />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '12px', fontWeight: 800, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {off.name}
                          </div>
                          <div style={{ fontSize: '10.5px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', flexWrap: 'wrap' }}>
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

                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
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
                          <div style={{ fontSize: '9.5px', color: '#64748B', fontWeight: 600, marginTop: '2px' }}>
                            {off.acceptedAt}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Step 4: Penanganan di Lokasi */}
        <div className={`glow-timeline-step ${step4StatusClass}`}>
          <div className="glow-timeline-node">
            {isStep4Completed ? '✓' : isStep4Active ? '📍' : '4'}
          </div>
          <div className="glow-timeline-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A' }}>4. Penanganan di Lokasi (TKP)</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{
                  fontSize: '9.5px',
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: '4px',
                  background: isStep4Active ? '#DBEAFE' : isStep4Completed ? '#ECFDF5' : '#F1F5F9',
                  color: isStep4Active ? '#1D4ED8' : isStep4Completed ? '#10B981' : '#64748B',
                }}>
                  {isStep4Active ? '● SEDANG BERLANGSUNG' : isStep4Completed ? '✓ SELESAI' : '🔒 TERKUNCI'}
                </span>
                {formattedTiba && (
                  <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#64748B' }}>
                    {formattedTiba}
                  </span>
                )}
              </div>
            </div>
            <div style={{ fontSize: '11.5px', color: '#475569', marginTop: '4px', lineHeight: 1.4 }}>
              Personel tiba di lokasi dan sedang melakukan tindakan kepolisian.
            </div>

            {isStep4Completed || (isStep4Active && formattedTiba) ? (
              <div style={{ marginTop: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                  <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#1E293B' }}>
                    📅 Tiba di TKP: {formattedTiba || '-'}
                  </span>
                  {resolvedFotoTindakan ? (
                    <span
                      onClick={() => {
                        handleLightbox({
                          url: resolvedFotoTindakan,
                          title: 'Foto Tindakan di Lokasi (TKP)',
                          meta: `Tiba: ${formattedTiba}`,
                          desc: 'Dokumentasi kepolisian penanganan awal di lokasi',
                        });
                      }}
                      style={{ fontSize: '10px', fontWeight: 700, color: '#1E40AF', background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      📷 Bukti Tindakan TKP ➔
                    </span>
                  ) : null}
                </div>

                {complaint.catatanTindakan ? (
                  <div style={{ background: '#FEFCE8', borderLeft: '3px solid #EAB308', borderRadius: '0 6px 6px 0', padding: '6px 10px', marginTop: '8px', lineHeight: 1.4 }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#854D0E', marginBottom: '2px' }}>📝 BERITA ACARA TINDAKAN TKP:</div>
                    <div style={{ fontSize: '11px', color: '#1E293B' }}>&quot;{complaint.catatanTindakan.replace(/^Catatan:\s*/i, '').trim()}&quot;</div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', lineHeight: 1.2, marginTop: '8px' }}>
                <span className="step-time" style={{ color: '#94A3B8', fontStyle: 'italic', fontSize: '11px' }}>
                  Menunggu Personel Tiba di TKP
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Step 5: Kasus Selesai Ditangani */}
        <div className={`glow-timeline-step ${step5StatusClass}`}>
          <div className="glow-timeline-node">
            {isStep5Completed ? '✓' : isStep5Active ? '⚖️' : '5'}
          </div>
          <div className="glow-timeline-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A' }}>5. Kasus Selesai Ditangani</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{
                  fontSize: '9.5px',
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: '4px',
                  background: isStep5Completed ? '#ECFDF5' : isStep5Active ? '#FAF5FF' : '#F1F5F9',
                  color: isStep5Completed ? '#10B981' : isStep5Active ? '#7C3AED' : '#64748B',
                }}>
                  {isStep5Completed ? '✓ SELESAI' : isStep5Active ? '⚖️ MENUNGGU PENGESAHAN PAWAS' : '🔒 TERKUNCI'}
                </span>
                {formattedSelesai && (
                  <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#64748B' }}>
                    {formattedSelesai}
                  </span>
                )}
              </div>
            </div>
            <div style={{ fontSize: '11.5px', color: '#475569', marginTop: '4px', lineHeight: 1.4 }}>
              Penanganan selesai dan log telah disetujui oleh pimpinan.
            </div>

            {isStep5Completed || isStep5Active ? (
              <div style={{ marginTop: '8px' }}>
                {complaint.catatanSelesai && (
                  <div style={{ background: '#ECFDF5', borderLeft: '3px solid #10B981', borderRadius: '0 6px 6px 0', padding: '6px 10px', marginTop: '8px', lineHeight: 1.4 }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#047857', marginBottom: '2px' }}>✓ LAPORAN AKHIR PETUGAS:</div>
                    <div style={{ fontSize: '11px', color: '#1E293B' }}>&quot;{complaint.catatanSelesai}&quot;</div>
                  </div>
                )}

                {isStep5Completed && (
                  <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderLeft: '4px solid #16A34A', borderRadius: '6px', padding: '7px 10px', marginTop: '8px', lineHeight: 1.4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '10px', fontWeight: 800, color: '#15803D' }}>⚖️ PENGESAHAN RESMI PIMPINAN (PAWAS):</span>
                      <span style={{ fontSize: '9.5px', fontWeight: 700, background: '#DCFCE7', color: '#166534', padding: '1px 6px', borderRadius: '3px' }}>SAH &amp; VALID</span>
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#166534', marginTop: '2px' }}>
                      <strong>Waktu:</strong> {formattedSelesai || 'Hari ini'}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ fontSize: '10.5px', color: '#94A3B8', fontStyle: 'italic', marginTop: '6px' }}>
                Menunggu Otorisasi Penutupan Kasus
              </div>
            )}
          </div>
        </div>
      </div>



      {actionSlot && <div style={{ marginTop: '14px' }}>{actionSlot}</div>}

      {/* MODAL PETA NAVIGASI SATELLITE (INTERNAL FALLBACK) */}
      {internalTrackingMapOpen && (
        <TrackingMapModal
          isOpen={internalTrackingMapOpen}
          onClose={() => setInternalTrackingMapOpen(false)}
          complaint={complaint}
          fleetUnits={fleetUnits}
        />
      )}

      {/* MODAL LIGHTBOX FOTO (INTERNAL FALLBACK) */}
      {internalLightbox && (
        <div
          onClick={() => setInternalLightbox(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#0F172A',
              borderRadius: '12px',
              maxWidth: '90vw',
              maxHeight: '90vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div>
                <h4 style={{ color: 'white', margin: 0, fontSize: '13px', fontWeight: 800 }}>{internalLightbox.title}</h4>
                {internalLightbox.meta && <span style={{ color: '#94A3B8', fontSize: '11px' }}>{internalLightbox.meta}</span>}
              </div>
              <button
                type="button"
                onClick={() => setInternalLightbox(null)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px' }}>
              <img
                src={internalLightbox.url}
                alt={internalLightbox.title}
                style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: '6px' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncidentTimelineProgress;
