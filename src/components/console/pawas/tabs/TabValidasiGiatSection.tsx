'use client';

import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Car,
  Users,
  Radio,
  FileText,
  XCircle,
  Compass,
  Eye,
  Check,
  AlertCircle,
  RotateCcw,
  Lock,
} from 'lucide-react';
import { validateOfficerLogbookAction } from '@/app/actions/logbook.actions';
import { toast } from '@/components/ui/Toast';

export interface TabValidasiGiatSectionProps {
  userProfile: any;
  logbooks: any[];
  setLightboxImg?: (data: any) => void;
  setShowLightboxModal?: (show: boolean) => void;
  onGiatStatusUpdated?: (updatedLogbook: any) => void;
}

export const TabValidasiGiatSection: React.FC<TabValidasiGiatSectionProps> = ({
  userProfile,
  logbooks = [],
  setLightboxImg,
  setShowLightboxModal,
  onGiatStatusUpdated,
}) => {
  const [giatFilterStatus, setGiatFilterStatus] = useState<string>('semua');
  const [selectedGiatId, setSelectedGiatId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [catatanPawas, setCatatanPawas] = useState('');
  const [localItems, setLocalItems] = useState<any[]>(logbooks);

  // Sinkronkan local state jika prop logbooks berubah
  React.useEffect(() => {
    if (Array.isArray(logbooks)) {
      setLocalItems(logbooks);
    }
  }, [logbooks]);

  // Ekstrak helper nama dan pangkat agar tidak ada duplikasi
  const getCleanOfficerInfo = (item: any) => {
    const off = item.officer || {};
    const usr = off.user || {};
    const rank = off.rank || off.pangkat || '';
    const fullName = usr.full_name || off.name || off.full_name || 'Personel Presisi';
    const nrp = off.nrp || '';
    const unit = off.unit?.unit_name || off.unit?.short_name || off.satuan || 'Sat Samapta';

    let displayName = fullName;
    if (rank && fullName.toLowerCase().startsWith(rank.toLowerCase())) {
      displayName = fullName;
    } else if (rank) {
      displayName = `${rank} ${fullName}`;
    }

    return { displayName, rank, fullName, nrp, unit };
  };

  // Ekstrak rincian pengajuan giat dari deskripsiKegiatan jika ada
  const parseGiatDescription = (desc: string) => {
    if (!desc) return { route: '', time: '', vehicle: '', partners: '', plan: '', pawasNote: '' };
    const lines = desc.split('\n');
    let route = '';
    let time = '';
    let vehicle = '';
    let partners = '';
    let plan = '';
    let pawasNote = '';

    for (const l of lines) {
      const line = l.trim();
      if (line.startsWith('• Rencana Rute/Lokasi:')) route = line.replace('• Rencana Rute/Lokasi:', '').trim();
      else if (line.startsWith('• Estimasi Waktu:')) time = line.replace('• Estimasi Waktu:', '').trim();
      else if (line.startsWith('• Armada Kendaraan:')) vehicle = line.replace('• Armada Kendaraan:', '').trim();
      else if (line.startsWith('• Rekan Regu:')) partners = line.replace('• Rekan Regu:', '').trim();
      else if (line.startsWith('• Rencana Kegiatan:')) plan = line.replace('• Rencana Kegiatan:', '').trim();
      else if (line.startsWith('[CATATAN PAWAS]:')) pawasNote = line.replace('[CATATAN PAWAS]:', '').trim();
    }

    if (!pawasNote && desc.includes('[CATATAN PAWAS]:')) {
      const parts = desc.split('[CATATAN PAWAS]:');
      pawasNote = parts[1]?.trim() || '';
    }

    return { route, time, vehicle, partners, plan: plan || desc, pawasNote };
  };

  // Hitung jumlah item tiap status
  const counts = useMemo(() => {
    let menunggu = 0;
    let valid = 0;
    let ditolak = 0;

    localItems.forEach((item) => {
      const st = String(item.statusValidasi || item.validation_status || '').toUpperCase();

      if (st === 'VALID') valid++;
      else if (st === 'DITOLAK') ditolak++;
      else menunggu++;
    });

    return { semua: localItems.length, menunggu, valid, ditolak };
  }, [localItems]);

  // Filter list sesuai filter status
  const filteredList = useMemo(() => {
    return localItems.filter((item) => {
      const st = String(item.statusValidasi || item.validation_status || '').toUpperCase();

      if (giatFilterStatus === 'menunggu') {
        return st !== 'VALID' && st !== 'DITOLAK';
      }
      if (giatFilterStatus === 'valid') {
        return st === 'VALID';
      }
      if (giatFilterStatus === 'ditolak') {
        return st === 'DITOLAK';
      }
      return true;
    });
  }, [localItems, giatFilterStatus]);

  // Giat aktif yang sedang diinspeksi
  const activeGiat = useMemo(() => {
    if (selectedGiatId) {
      const found = filteredList.find((g) => String(g.id) === String(selectedGiatId));
      if (found) return found;
    }
    return filteredList[0] || null;
  }, [filteredList, selectedGiatId]);

  // Eksekusi aksi validasi Pawas
  const handleValidateGiat = async (status: 'VALID' | 'DITOLAK') => {
    if (!activeGiat) return;
    setIsSubmitting(true);

    try {
      const res = await validateOfficerLogbookAction(activeGiat.id, status, catatanPawas);
      if (res.success) {
        const actionType = (activeGiat.jenisAksi || activeGiat.action_type || 'PATROLI').toUpperCase();
        const currentDesc = activeGiat.deskripsiKegiatan || activeGiat.activity_description || '';
        const updatedDesc = catatanPawas.trim()
          ? `${currentDesc}\n\n[CATATAN PAWAS]: ${catatanPawas.trim()}`
          : currentDesc;

        const updated = {
          ...activeGiat,
          statusValidasi: status,
          validation_status: status,
          deskripsiKegiatan: updatedDesc,
          activity_description: updatedDesc,
        };

        setLocalItems((prev) =>
          prev.map((item) => (String(item.id) === String(activeGiat.id) ? updated : item))
        );

        setCatatanPawas('');

        if (status === 'VALID') {
          toast.success(
            'Giat Berhasil Disahkan',
            `✓ Giat #${activeGiat.id} (${actionType}) resmi disahkan oleh Pawas & diotorisasi.`
          );
        } else {
          toast.warning(
            'Pengajuan Giat Ditolak',
            `Pengajuan giat #${activeGiat.id} telah ditolak dan dikembalikan ke personel.`
          );
        }

        if (onGiatStatusUpdated) onGiatStatusUpdated(updated);
      } else {
        toast.error('Gagal Memproses', res.error || 'Terjadi kendala saat memperbarui validasi giat.');
      }
    } catch (err: any) {
      toast.error('Kesalahan Sistem', err.message || 'Terjadi kesalahan jaringan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Badge jenis giat
  const getActionBadge = (type: string) => {
    const t = (type || 'PATROLI').toUpperCase();
    if (t === 'PATROLI') {
      return {
        label: 'PATROLI RUTIN',
        bg: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(14, 165, 233, 0.15) 100%)',
        border: '1px solid rgba(14, 165, 233, 0.4)',
        color: '#0284C7',
        icon: Compass,
      };
    }
    if (t === 'SAMBANG') {
      return {
        label: 'SAMBANG WARGA',
        bg: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.15) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.4)',
        color: '#059669',
        icon: Users,
      };
    }
    if (t === 'PENGAMANAN') {
      return {
        label: 'PENGAMANAN',
        bg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.15) 100%)',
        border: '1px solid rgba(245, 158, 11, 0.4)',
        color: '#D97706',
        icon: ShieldAlert,
      };
    }
    return {
      label: 'TPTKP RESPON',
      bg: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.15) 100%)',
      border: '1px solid rgba(239, 68, 68, 0.4)',
      color: '#DC2626',
      icon: AlertTriangle,
    };
  };

  return (
    <div style={{ width: '100%' }}>
      {/* ── Sub-Filter Tabs Khusus Giat Personel ── */}
      <div
        className="val-filter-tabs"
        style={{
          display: 'flex',
          gap: '6px',
          margin: '0 0 12px',
          overflowX: 'auto',
          paddingBottom: '4px',
          scrollbarWidth: 'none',
        }}
      >
        {[
          { key: 'semua', label: 'Semua Giat', count: counts.semua },
          { key: 'menunggu', label: 'Menunggu Pengesahan', count: counts.menunggu },
          { key: 'valid', label: 'Telah Disahkan', count: counts.valid },
          { key: 'ditolak', label: 'Dikembalikan / Ditolak', count: counts.ditolak },
        ].map((tab) => {
          const isActive = giatFilterStatus === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              className={`val-tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => {
                setGiatFilterStatus(tab.key);
                setSelectedGiatId(null);
              }}
              style={{
                padding: '7px 14px',
                borderRadius: '20px',
                border: isActive ? '1px solid #38BDF8' : '1px solid #E2E8F0',
                background: isActive ? 'linear-gradient(135deg, #0F172A 0%, #0369A1 100%)' : 'white',
                color: isActive ? 'white' : '#1E293B',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                flexShrink: 0,
                boxShadow: isActive ? '0 3px 10px rgba(3, 105, 161, 0.25)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              <span>{tab.label}</span>
              <span
                style={{
                  background: isActive ? 'rgba(56, 189, 248, 0.25)' : '#F1F5F9',
                  color: isActive ? '#38BDF8' : '#475569',
                  padding: '2px 7px',
                  borderRadius: '10px',
                  fontSize: '11px',
                  fontWeight: 800,
                  marginLeft: '2px',
                }}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Subtitle Info Bar ── */}
      <div
        style={{
          margin: '0 0 14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '10px',
          flexWrap: 'wrap',
          padding: '4px 2px',
        }}
      >
        <div style={{ fontSize: '12.5px', color: '#475569', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>Menampilkan:</span>
          <strong style={{ color: '#0F172A' }}>
            {filteredList.length} Pengajuan Giat Lapangan
          </strong>
        </div>
        <div style={{ fontSize: '11.5px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <ShieldCheck size={14} color="#0284C7" />
          <span>Pengesahan Pawas otomatis mengotorisasi rute dinas &amp; verifikasi integritas GPS</span>
        </div>
      </div>

      {/* ── Split Layout: Left List + Right Dossier ── */}
      <div
        className={`split-layout-responsive ${filteredList.length === 0 ? 'is-empty-fullwidth' : ''}`}
        style={filteredList.length === 0 ? { gridTemplateColumns: '1fr', display: 'block', width: '100%' } : undefined}
      >
        {/* Kolom Kiri: Daftar Kartu Giat Personel */}
        <div
          className={`val-list ${filteredList.length === 0 ? 'is-empty-fullwidth' : ''}`}
          id="val-giat-list-container"
          style={{
            minWidth: 0,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {filteredList.length === 0 ? (
            <div
              style={{
                background: 'white',
                border: '1px solid #E2E8F0',
                borderRadius: '16px',
                padding: '40px 20px',
                textAlign: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: '#F0F9FF',
                  border: '1px solid #BAE6FD',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 14px',
                }}
              >
                <ShieldCheck size={28} color="#0284C7" />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', margin: '0 0 6px' }}>
                Tidak Ada Pengajuan Giat
              </h3>
              <p style={{ fontSize: '13px', color: '#64748B', maxWidth: '380px', margin: '0 auto' }}>
                {giatFilterStatus === 'menunggu'
                  ? 'Seluruh pengajuan kegiatan lapangan personel piket telah disahkan oleh Pawas.'
                  : 'Belum ada data kegiatan dinas personel pada kategori filter ini.'}
              </p>
            </div>
          ) : (
            filteredList.map((item) => {
              const isSelected = activeGiat && String(activeGiat.id) === String(item.id);
              const actionType = item.jenisAksi || item.action_type || 'PATROLI';
              const badge = getActionBadge(actionType);
              const BadgeIcon = badge.icon;
              const officerInfo = getCleanOfficerInfo(item);
              const rawDesc = item.deskripsiKegiatan || item.activity_description || '';
              const parsed = parseGiatDescription(rawDesc);
              const routeText = item.lokasiKlaimAlamat || item.claimed_address || parsed.route || 'Wilayah Hukum Polres Pekalongan';
              const deviasi = Number(item.deviasiMeter || item.deviation_meters || 0);
              const isFlagged = Boolean(item.isDeviasiFlagged || item.is_deviation_flagged);
              const status = String(item.statusValidasi || item.validation_status || 'BELUM_DIVALIDASI').toUpperCase();

              return (
                <div
                  key={String(item.id)}
                  onClick={() => setSelectedGiatId(String(item.id))}
                  style={{
                    background: isSelected ? 'linear-gradient(180deg, #FFFFFF 0%, #F0F9FF 100%)' : '#FFFFFF',
                    border: isSelected ? '1.5px solid #0284C7' : '1px solid #E2E8F0',
                    borderRadius: '14px',
                    padding: '16px',
                    boxShadow: isSelected
                      ? '0 6px 18px rgba(2, 132, 199, 0.16)'
                      : '0 1px 3px rgba(0,0,0,0.03)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  {/* Row 1: Badge Jenis Giat + Jam Pelaksanaan */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 9px',
                        borderRadius: '8px',
                        background: badge.bg,
                        border: badge.border,
                        color: badge.color,
                        fontSize: '11px',
                        fontWeight: 800,
                      }}
                    >
                      <BadgeIcon size={13} />
                      <span>{badge.label}</span>
                    </div>

                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: '#64748B',
                        fontSize: '11.5px',
                        fontWeight: 600,
                      }}
                    >
                      <Clock size={12} />
                      <span>
                        {item.jamMulai || item.start_time || '19:00'} - {item.jamSelesai || item.end_time || '21:00'} WIB
                      </span>
                    </div>
                  </div>

                  {/* Row 2: Info Personel */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
                        color: '#38BDF8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '13px',
                        flexShrink: 0,
                        border: '1px solid #334155',
                      }}
                    >
                      {officerInfo.fullName.slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <h4
                        style={{
                          margin: 0,
                          fontSize: '13.5px',
                          fontWeight: 800,
                          color: '#0F172A',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {officerInfo.displayName}
                      </h4>
                      <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: '#64748B', fontWeight: 600 }}>
                        {officerInfo.unit} {officerInfo.nrp ? `• NRP ${officerInfo.nrp}` : ''}
                      </p>
                    </div>
                  </div>

                  {/* Row 3: Rute / Lokasi Sasaran */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '6px',
                      background: '#F8FAFC',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: '1px solid #F1F5F9',
                    }}
                  >
                    <MapPin size={14} color="#0284C7" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <span
                      style={{
                        fontSize: '12px',
                        color: '#334155',
                        fontWeight: 600,
                        lineHeight: '1.4',
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {routeText}
                    </span>
                  </div>

                  {/* Row 4: Status Validasi & Deviasi GPS Pill */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingTop: '8px',
                      borderTop: '1px dashed #E2E8F0',
                      flexWrap: 'wrap',
                      gap: '6px',
                    }}
                  >
                    {/* Status Pengesahan */}
                    {status === 'VALID' ? (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: '#ECFDF5',
                          border: '1px solid #A7F3D0',
                          color: '#059669',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 800,
                        }}
                      >
                        <CheckCircle2 size={12} />
                        <span>Disahkan Pawas</span>
                      </span>
                    ) : status === 'FLAGGED_AUDIT' || isFlagged ? (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: '#FEF2F2',
                          border: '1px solid #FECACA',
                          color: '#DC2626',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 800,
                        }}
                      >
                        <AlertCircle size={12} />
                        <span>Deviasi GPS</span>
                      </span>
                    ) : status === 'DITOLAK' ? (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: '#F1F5F9',
                          border: '1px solid #CBD5E1',
                          color: '#475569',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 800,
                        }}
                      >
                        <XCircle size={12} />
                        <span>Ditolak</span>
                      </span>
                    ) : (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: '#FFFBEB',
                          border: '1px solid #FDE68A',
                          color: '#B45309',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 800,
                        }}
                      >
                        <Clock size={12} />
                        <span>Menunggu Sahkan</span>
                      </span>
                    )}

                    {/* Integritas GPS */}
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: deviasi < 100 ? '#F0FDF4' : deviasi < 500 ? '#F8FAFC' : '#FEF2F2',
                        border: deviasi < 100 ? '1px solid #BBF7D0' : deviasi < 500 ? '1px solid #E2E8F0' : '1px solid #FECACA',
                        color: deviasi < 100 ? '#15803D' : deviasi < 500 ? '#475569' : '#DC2626',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontSize: '10.5px',
                        fontWeight: 700,
                      }}
                    >
                      <span>{deviasi < 100 ? '🎯 GPS Akurat' : isFlagged ? '⚠️ Deviasi' : '📍 Jarak'}:</span>
                      <strong>{deviasi}m</strong>
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Kolom Kanan: Lembar Dossier Pengesahan Giat Personel */}
        {activeGiat ? (
          <div
            className="val-detail val-desktop-only"
            id="val-giat-detail-box"
            style={{
              minWidth: 0,
              width: '100%',
              background: 'white',
              border: '1px solid #E2E8F0',
              borderRadius: '16px',
              padding: '22px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
            }}
          >
            {/* Header Dossier Giat */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                borderRadius: '12px',
                color: 'white',
              }}
            >
              <div>
                <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 700, letterSpacing: '0.05em' }}>
                  BERKAS PENGESAHAN GIAT
                </span>
                <h3 style={{ margin: '2px 0 0', fontSize: '15px', fontWeight: 800, color: '#38BDF8' }}>
                  NO. REG #{String(activeGiat.id).padStart(6, '0')} • {(activeGiat.jenisAksi || activeGiat.action_type || 'PATROLI').toUpperCase()}
                </h3>
              </div>
              {(() => {
                const st = String(activeGiat.statusValidasi || activeGiat.validation_status || 'BELUM_DIVALIDASI').toUpperCase();
                const isValid = st === 'VALID';
                const isDitolak = st === 'DITOLAK';
                const isAudit = st === 'FLAGGED_AUDIT' || Boolean(activeGiat.isDeviasiFlagged || activeGiat.is_deviation_flagged);

                return (
                  <div
                    style={{
                      background: isValid
                        ? 'rgba(16, 185, 129, 0.2)'
                        : isDitolak
                        ? 'rgba(239, 68, 68, 0.2)'
                        : isAudit
                        ? 'rgba(245, 158, 11, 0.2)'
                        : 'rgba(56, 189, 248, 0.2)',
                      color: isValid
                        ? '#34D399'
                        : isDitolak
                        ? '#F87171'
                        : isAudit
                        ? '#FBBF24'
                        : '#38BDF8',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 800,
                      border: isValid
                        ? '1px solid rgba(16, 185, 129, 0.4)'
                        : isDitolak
                        ? '1px solid rgba(239, 68, 68, 0.4)'
                        : isAudit
                        ? '1px solid rgba(245, 158, 11, 0.4)'
                        : '1px solid rgba(56, 189, 248, 0.4)',
                    }}
                  >
                    {isValid ? 'TELAH DISAHKAN' : isDitolak ? 'DITOLAK' : isAudit ? 'AUDIT PROPAM' : 'MENUNGGU PENGESAHAN'}
                  </div>
                );
              })()}
            </div>

            {/* Profil Personel Bertugas */}
            <div
              style={{
                padding: '14px',
                background: '#F8FAFC',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 800, letterSpacing: '0.05em' }}>
                PERSONEL PENANGGUNG JAWAB GIAT
              </div>
              {(() => {
                const offInfo = getCleanOfficerInfo(activeGiat);
                const desc = activeGiat.deskripsiKegiatan || activeGiat.activity_description || '';
                const parsed = parseGiatDescription(desc);

                return (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                    <div>
                      <span style={{ fontSize: '11px', color: '#64748B' }}>Nama Personel:</span>
                      <p style={{ margin: '2px 0 0', fontSize: '13px', fontWeight: 800, color: '#0F172A' }}>
                        {offInfo.displayName}
                      </p>
                      <p style={{ margin: '1px 0 0', fontSize: '11.5px', color: '#64748B' }}>
                        NRP: {offInfo.nrp || '-'} • {offInfo.unit}
                      </p>
                    </div>

                    <div>
                      <span style={{ fontSize: '11px', color: '#64748B' }}>Armada Kendaraan:</span>
                      <p style={{ margin: '2px 0 0', fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
                        {parsed.vehicle || 'Ranmor Roda 4 Samapta'}
                      </p>
                    </div>

                    <div>
                      <span style={{ fontSize: '11px', color: '#64748B' }}>Rekan Regu / Partner:</span>
                      <p style={{ margin: '2px 0 0', fontSize: '12.5px', fontWeight: 600, color: '#334155' }}>
                        {parsed.partners || 'Patroli Mandiri'}
                      </p>
                    </div>

                    <div>
                      <span style={{ fontSize: '11px', color: '#64748B' }}>Waktu Pelaksanaan:</span>
                      <p style={{ margin: '2px 0 0', fontSize: '12.5px', fontWeight: 700, color: '#0284C7' }}>
                        {activeGiat.jamMulai || activeGiat.start_time || '19:00'} s/d {activeGiat.jamSelesai || activeGiat.end_time || '21:00'} WIB
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Rute & Rencana Kegiatan */}
            <div
              style={{
                padding: '14px',
                background: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 800, letterSpacing: '0.05em' }}>
                RENCANA RUTE &amp; SASARAN OPERASIONAL
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <MapPin size={16} color="#0284C7" style={{ marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: 700, color: '#0F172A' }}>
                    {activeGiat.lokasiKlaimAlamat || activeGiat.claimed_address || 'Wilayah Hukum Polres Pekalongan'}
                  </h4>
                  <p style={{ margin: '6px 0 0', fontSize: '12.5px', color: '#475569', lineHeight: '1.5', whiteSpace: 'pre-line' }}>
                    {parseGiatDescription(activeGiat.deskripsiKegiatan || activeGiat.activity_description || '').plan}
                  </p>
                </div>
              </div>
            </div>

            {/* Audit Integritas GPS & Jarak Deviasi */}
            <div
              style={{
                padding: '14px',
                background: '#F0F9FF',
                borderRadius: '12px',
                border: '1px solid #BAE6FD',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: '#0369A1', fontWeight: 800, letterSpacing: '0.05em' }}>
                  AUDIT TELEMETRI INTEGRITAS GPS LAPANGAN
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    color: Number(activeGiat.deviasiMeter || activeGiat.deviation_meters || 0) < 500 ? '#059669' : '#DC2626',
                  }}
                >
                  Deviasi: {Number(activeGiat.deviasiMeter || activeGiat.deviation_meters || 0)} meter
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '11.5px', color: '#334155' }}>
                <div>
                  <span style={{ color: '#64748B' }}>Koordinat Klaim:</span>
                  <p style={{ margin: '2px 0 0', fontWeight: 700, fontFamily: 'monospace' }}>
                    {Number(activeGiat.lokasiKlaimLat || activeGiat.claimed_lat || 0).toFixed(6)},{' '}
                    {Number(activeGiat.lokasiKlaimLng || activeGiat.claimed_lng || 0).toFixed(6)}
                  </p>
                </div>
                <div>
                  <span style={{ color: '#64748B' }}>GPS Aktual Petugas:</span>
                  <p style={{ margin: '2px 0 0', fontWeight: 700, fontFamily: 'monospace' }}>
                    {Number(activeGiat.lokasiGpsAktualLat || activeGiat.actual_lat || 0).toFixed(6)},{' '}
                    {Number(activeGiat.lokasiGpsAktualLng || activeGiat.actual_lng || 0).toFixed(6)}
                  </p>
                </div>
              </div>

              <div style={{ fontSize: '11px', color: '#0369A1', marginTop: '2px' }}>
                {Number(activeGiat.deviasiMeter || activeGiat.deviation_meters || 0) < 500 ? (
                  <span>✓ Titik GPS petugas sinkron dengan rute sasaran (Akurasi Presisi).</span>
                ) : (
                  <span style={{ color: '#DC2626', fontWeight: 700 }}>
                    ⚠️ Peringatan: Deviasi titik di atas batas 500 meter! Disarankan verifikasi via WhatsApp/Telepon atau tolak pengajuan.
                  </span>
                )}
              </div>
            </div>

            {/* Foto Bukti Dokumentasi Lapangan (jika ada) */}
            {(activeGiat.fotoBuktiUrl || activeGiat.photo_url) && (
              <div
                style={{
                  padding: '12px',
                  background: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                }}
              >
                <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 800, display: 'block', marginBottom: '8px' }}>
                  FOTO DOKUMENTASI AWAL
                </span>
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: '160px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    if (setLightboxImg && setShowLightboxModal) {
                      setLightboxImg({
                        src: activeGiat.fotoBuktiUrl || activeGiat.photo_url,
                        title: `Dokumentasi Giat #${activeGiat.id}`,
                      });
                      setShowLightboxModal(true);
                    }
                  }}
                >
                  <img
                    src={activeGiat.fotoBuktiUrl || activeGiat.photo_url}
                    alt="Foto Dokumentasi"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(0,0,0,0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 700,
                      fontSize: '12px',
                      gap: '6px',
                    }}
                  >
                    <Eye size={16} />
                    <span>Perbesar Foto</span>
                  </div>
                </div>
              </div>
            )}

            {/* ── Status Pengesahan / Form Komando Pawas ── */}
            {(() => {
              const currentStatus = String(activeGiat.statusValidasi || activeGiat.validation_status || 'BELUM_DIVALIDASI').toUpperCase();
              const isApproved = currentStatus === 'VALID';
              const isRejected = currentStatus === 'DITOLAK';
              const parsedInfo = parseGiatDescription(activeGiat.deskripsiKegiatan || activeGiat.activity_description || '');

              if (isApproved) {
                return (
                  <div
                    style={{
                      marginTop: 'auto',
                      padding: '16px',
                      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.04) 100%)',
                      borderRadius: '14px',
                      border: '1.5px solid #10B981',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: '#ECFDF5',
                            border: '1px solid #A7F3D0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <CheckCircle2 size={16} color="#059669" />
                        </div>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: '#065F46' }}>
                            BERKAS PENGESAHAN TELAH DISAHKAN PAWAS
                          </h4>
                          <span style={{ fontSize: '11px', color: '#047857', fontWeight: 600 }}>
                            Giat operasional aktif &amp; telah resmi diotorisasi. Data terkunci.
                          </span>
                        </div>
                      </div>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '3px 8px',
                          borderRadius: '8px',
                          background: '#ECFDF5',
                          border: '1px solid #A7F3D0',
                          color: '#059669',
                          fontSize: '10.5px',
                          fontWeight: 800,
                        }}
                      >
                        <Lock size={12} />
                        <span>Terkunci</span>
                      </span>
                    </div>

                    {parsedInfo.pawasNote ? (
                      <div
                        style={{
                          padding: '10px 12px',
                          borderRadius: '8px',
                          background: '#FFFFFF',
                          border: '1px solid #A7F3D0',
                          fontSize: '12px',
                          color: '#065F46',
                        }}
                      >
                        <span style={{ fontWeight: 800, display: 'block', marginBottom: '2px', fontSize: '11px', color: '#047857' }}>
                          Instruksi Komando Pawas:
                        </span>
                        <p style={{ margin: 0, fontStyle: 'italic', lineHeight: '1.4' }}>
                          &ldquo;{parsedInfo.pawasNote}&rdquo;
                        </p>
                      </div>
                    ) : (
                      <div style={{ fontSize: '11.5px', color: '#047857', fontStyle: 'italic' }}>
                        Giat disahkan tanpa catatan instruksi khusus.
                      </div>
                    )}
                  </div>
                );
              }

              if (isRejected) {
                return (
                  <div
                    style={{
                      marginTop: 'auto',
                      padding: '16px',
                      background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(220, 38, 38, 0.04) 100%)',
                      borderRadius: '14px',
                      border: '1.5px solid #EF4444',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: '#FEF2F2',
                            border: '1px solid #FECACA',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <XCircle size={16} color="#DC2626" />
                        </div>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: '#991B1B' }}>
                            PENGAJUAN GIAT TELAH DIKEMBALIKAN / DITOLAK
                          </h4>
                          <span style={{ fontSize: '11px', color: '#B91C1C', fontWeight: 600 }}>
                            Pengajuan giat ditolak oleh Pawas. Berkas ditutup.
                          </span>
                        </div>
                      </div>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '3px 8px',
                          borderRadius: '8px',
                          background: '#FEF2F2',
                          border: '1px solid #FECACA',
                          color: '#DC2626',
                          fontSize: '10.5px',
                          fontWeight: 800,
                        }}
                      >
                        <Lock size={12} />
                        <span>Selesai</span>
                      </span>
                    </div>

                    {parsedInfo.pawasNote && (
                      <div
                        style={{
                          padding: '10px 12px',
                          borderRadius: '8px',
                          background: '#FFFFFF',
                          border: '1px solid #FECACA',
                          fontSize: '12px',
                          color: '#991B1B',
                        }}
                      >
                        <span style={{ fontWeight: 800, display: 'block', marginBottom: '2px', fontSize: '11px', color: '#B91C1C' }}>
                          Catatan / Alasan Penolakan:
                        </span>
                        <p style={{ margin: 0, fontStyle: 'italic', lineHeight: '1.4' }}>
                          &ldquo;{parsedInfo.pawasNote}&rdquo;
                        </p>
                      </div>
                    )}
                  </div>
                );
              }

              // Status BELUM_DIVALIDASI / PENDING: tampilkan input catatan & tombol Sahkan/Tolak
              return (
                <div
                  style={{
                    marginTop: 'auto',
                    padding: '16px',
                    background: '#F8FAFC',
                    borderRadius: '14px',
                    border: '1.5px solid #CBD5E1',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div>
                    <label
                      htmlFor="pawas-giat-note"
                      style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#1E293B', marginBottom: '6px' }}
                    >
                      Instruksi / Catatan Komando Pawas (Opsional):
                    </label>
                    <textarea
                      id="pawas-giat-note"
                      rows={2}
                      value={catatanPawas}
                      onChange={(e) => setCatatanPawas(e.target.value)}
                      placeholder="Contoh: Laksanakan sambang dialogis di area pertokoan & laporkan situasi tiap 1 jam..."
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '8px 12px',
                        fontSize: '12px',
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        background: '#FFFFFF',
                        color: '#0F172A',
                        fontFamily: 'inherit',
                        outline: 'none',
                        resize: 'none',
                      }}
                    />
                  </div>

                  {/* 2 Tombol Komando: Sahkan Giat & Tolak (Tombol Audit Propam dihapus) */}
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleValidateGiat('VALID')}
                      style={{
                        padding: '11px 16px',
                        borderRadius: '10px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                        color: 'white',
                        fontSize: '13px',
                        fontWeight: 800,
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: '0 2px 8px rgba(2, 132, 199, 0.35)',
                        opacity: isSubmitting ? 0.7 : 1,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <CheckCircle2 size={16} />
                      <span>Sahkan Giat</span>
                    </button>

                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleValidateGiat('DITOLAK')}
                      style={{
                        padding: '11px 14px',
                        borderRadius: '10px',
                        border: '1px solid #FECACA',
                        background: '#FEF2F2',
                        color: '#DC2626',
                        fontSize: '12.5px',
                        fontWeight: 800,
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        opacity: isSubmitting ? 0.7 : 1,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <XCircle size={15} />
                      <span>Tolak</span>
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        ) : (
          <div
            className="val-detail val-desktop-only"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#F8FAFC',
              border: '1px dashed #CBD5E1',
              borderRadius: '16px',
              padding: '40px',
              color: '#64748B',
              textAlign: 'center',
            }}
          >
            <div>
              <Compass size={36} color="#94A3B8" style={{ margin: '0 auto 10px' }} />
              <p style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>
                Pilih salah satu giat dari daftar sebelah kiri untuk memeriksa rute dan mengesahkan.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
