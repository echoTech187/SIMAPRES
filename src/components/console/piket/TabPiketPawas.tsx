'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  getPiketByDateAction,
  getPiketTimelineAction,
  getPiketLookupsAction,
  updateMemberAttendanceAction,
  addOfficerToPiketAction,
  removeOfficerFromPiketAction,
  deleteDailyPiketScheduleAction,
} from '@/app/actions/piket.actions';
import {
  POLRI_ATTENDANCE_STATUSES,
} from '@/types/piket.types';
import {
  Calendar,
  Plus,
  Trash2,
  RefreshCw,
  Clock,
  Shield,
  ChevronRight,
  ChevronLeft,
  CalendarDays,
  AlertCircle,
  Printer,
} from 'lucide-react';
import ModalAturPiketHarian from './ModalAturPiketHarian';
import ModalPrintSprintPiket from './ModalPrintSprintPiket';
import Select2CustomDropdown, { Select2Option } from '@/components/ui/Select2CustomDropdown';
import NameInitialAvatar from '@/components/ui/NameInitialAvatar';

interface TabPiketPawasProps {
  session?: any;
  showToast?: (msg: string) => void;
  defaultStationId?: number;
}

function formatLocalDateToYMD(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function TabPiketPawas({
  session,
  showToast = (msg: string) => alert(msg),
  defaultStationId,
}: TabPiketPawasProps) {
  const [loading, setLoading] = useState(false);
  const [selectedStationId, setSelectedStationId] = useState<number>(defaultStationId || 60001);

  // Tanggal yang sedang aktif dilihat (default: hari ini YYYY-MM-DD dalam waktu lokal)
  const [activeDateStr, setActiveDateStr] = useState<string>(() => formatLocalDateToYMD(new Date()));

  // Titik acuan rentang baris timeline (default: hari ini), tidak ikut bergeser saat kartu diklik agar posisi kartu tetap diam/stabil
  const [timelineAnchorDate, setTimelineAnchorDate] = useState<string>(() => formatLocalDateToYMD(new Date()));

  // Data piket pada tanggal aktif
  const [activePiket, setActivePiket] = useState<any>(null);

  // Timeline harian (Riwayat sebelumnya, Hari ini, besok, lusa, dst)
  const [timeline, setTimeline] = useState<any[]>([]);

  // Lookups stasiun & officers & operational units
  const [lookups, setLookups] = useState<{ stations: any[]; officers: any[]; operationalUnits: any[] }>({
    stations: [],
    officers: [],
    operationalUnits: [],
  });

  // Modal atur piket & print
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPrintOpen, setModalPrintOpen] = useState(false);

  // Quick inline add officer to active date
  const [quickOfficerId, setQuickOfficerId] = useState('');
  const [quickRole, setQuickRole] = useState('Sat Samapta');
  const [quickPos, setQuickPos] = useState('Patroli Samapta Presisi');
  const [addingOfficer, setAddingOfficer] = useState(false);

  // Client-side cache & single-call guards to prevent redundant roundtrips
  const isLookupsLoadedRef = React.useRef(false);
  const activePiketCacheRef = React.useRef<Map<string, any>>(new Map());
  const timelineCacheRef = React.useRef<Map<string, any[]>>(new Map());

  const loadLookups = useCallback(async () => {
    if (isLookupsLoadedRef.current) return;
    try {
      isLookupsLoadedRef.current = true;
      const res = await getPiketLookupsAction();
      if (res.success && 'data' in res && res.data) {
        const stations = res.data.stations || [];
        const officers = res.data.officers || [];
        const operationalUnits = res.data.operationalUnits || [];
        setLookups({
          stations,
          officers,
          operationalUnits,
        });
      }
    } catch (err) {
      console.warn('Gagal memuat lookups piket:', err);
      isLookupsLoadedRef.current = false;
    }
  }, []);

  // Muat detail piket tanggal yang dipilih (Instant dari memory cache jika sudah ada)
  const loadActivePiket = useCallback(async (stationId: number, dateStr: string, bypassCache = false) => {
    const key = `${stationId}_${dateStr}`;
    if (!bypassCache && activePiketCacheRef.current.has(key)) {
      setActivePiket(activePiketCacheRef.current.get(key));
      return;
    }
    try {
      const piketRes = await getPiketByDateAction(stationId, dateStr);
      if (piketRes.success && 'data' in piketRes) {
        activePiketCacheRef.current.set(key, piketRes.data);
        setActivePiket(piketRes.data);
      }
    } catch (err) {
      console.error('Gagal memuat data piket:', err);
    }
  }, []);

  // Muat baris kartu timeline (hanya bergeser jika anchorDate atau stationId berubah)
  const loadTimeline = useCallback(async (stationId: number, anchorDate: string, bypassCache = false) => {
    const key = `${stationId}_${anchorDate}`;
    if (!bypassCache && timelineCacheRef.current.has(key)) {
      setTimeline(timelineCacheRef.current.get(key) || []);
      return;
    }
    try {
      const timelineRes = await getPiketTimelineAction({
        station_id: stationId,
        startDateStr: anchorDate,
        daysBefore: 7,
        daysAfter: 7,
      });
      if (timelineRes.success && 'data' in timelineRes) {
        timelineCacheRef.current.set(key, timelineRes.data || []);
        setTimeline(timelineRes.data || []);
      }
    } catch (err) {
      console.error('Gagal memuat timeline piket:', err);
    }
  }, []);

  // Memuat ulang seluruh data (misal setelah mutasi tambah/hapus anggota/jadwal)
  const loadData = useCallback(async () => {
    setLoading(true);
    activePiketCacheRef.current.clear();
    timelineCacheRef.current.clear();
    try {
      await Promise.all([
        loadActivePiket(selectedStationId, activeDateStr, true),
        loadTimeline(selectedStationId, timelineAnchorDate, true),
      ]);
    } finally {
      setLoading(false);
    }
  }, [selectedStationId, activeDateStr, timelineAnchorDate, loadActivePiket, loadTimeline]);

  useEffect(() => {
    loadLookups();
  }, [loadLookups]);

  // Saat tanggal aktif berganti (misal kartu diklik), HANYA muat detail tanggal tersebut.
  // Kartu-kartu timeline sama sekali tidak di-fetch ulang dan posisinya TETAP DIAM / STABIL!
  useEffect(() => {
    loadActivePiket(selectedStationId, activeDateStr);
  }, [selectedStationId, activeDateStr, loadActivePiket]);

  // Saat stasiun atau timelineAnchorDate berganti (misal klik 7 hari lalu / kedepan), baru muat timeline
  useEffect(() => {
    loadTimeline(selectedStationId, timelineAnchorDate);
  }, [selectedStationId, timelineAnchorDate, loadTimeline]);

  // Presensi status change (Hanya untuk Hari Ini / hari berjalan)
  const handleAttendanceChange = async (memberId: number, status: string) => {
    if (isPastDate) {
      showToast('⚠️ Presensi pada H-1 dan hari lampau telah terkunci permanen sesuai SOP');
      return;
    }
    try {
      const res = await updateMemberAttendanceAction(memberId, status);
      if (res.success) {
        showToast('✓ Kehadiran berhasil diubah');
        setActivePiket((prev: any) => {
          if (!prev) return prev;
          return {
            ...prev,
            members: prev.members.map((m: any) =>
              m.id === memberId ? { ...m, status_kehadiran: status } : m
            ),
          };
        });
      } else {
        alert(res.error || 'Gagal mengubah presensi');
      }
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah presensi');
    }
  };

  // Remove officer from active date schedule
  const handleRemoveOfficer = async (memberId: number) => {
    if (!confirm('Hapus personel ini dari jadwal piket tanggal tersebut?')) return;
    try {
      const res = await removeOfficerFromPiketAction(memberId);
      if (res.success) {
        showToast('✓ Personel berhasil dihapus dari jadwal');
        loadData();
      }
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus personel');
    }
  };

  // Quick add officer to active schedule
  const handleQuickAddOfficer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickOfficerId || !activePiket?.id) return;

    setAddingOfficer(true);
    try {
      const res = await addOfficerToPiketAction({
        schedule_id: activePiket.id,
        officer_id: quickOfficerId,
        role_piket: quickRole,
        pos_penugasan: quickPos,
      });

      if (res.success) {
        showToast('✓ Personel berhasil ditambahkan ke jadwal piket');
        setQuickOfficerId('');
        loadData();
      } else {
        alert(res.error || 'Gagal menambahkan');
      }
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan');
    } finally {
      setAddingOfficer(false);
    }
  };

  // Delete entire schedule for active date
  const handleDeleteSchedule = async () => {
    if (!activePiket?.id) return;
    if (!confirm('Apakah Anda yakin ingin menghapus seluruh jadwal piket pada tanggal ini?')) return;
    try {
      const res = await deleteDailyPiketScheduleAction(activePiket.id);
      if (res.success) {
        showToast('✓ Jadwal piket tanggal tersebut berhasil dihapus');
        loadData();
      }
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus');
    }
  };

  const selectedStationObj = lookups.stations.find((s) => s.id === Number(selectedStationId));
  const availableOfficersForAdd = lookups.officers.filter(
    (o) => !activePiket?.members?.some((m: any) => m.officer_id?.toString() === o.id?.toString())
  );

  const formattedActiveDate = (() => {
    if (!activeDateStr) return '';
    const [y, m, d] = activeDateStr.split('-').map(Number);
    const localDate = new Date(y, m - 1, d);
    return localDate.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  })();

  const todayStr = formatLocalDateToYMD(new Date());
  const isViewingToday = activeDateStr === todayStr;

  // Tanggal lampau: H-1 ke belakang (Buku mutasi dan rekapitulasi kehadiran ditutup permanen)
  const isPastDate = (() => {
    if (!activeDateStr) return false;
    const [y, m, d] = activeDateStr.split('-').map(Number);
    const target = new Date(y, m - 1, d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 3600 * 24));
    return diffDays < 0;
  })();

  // SOP POLRI: Jadwal sudah tidak bisa diubah H-1 (H-1 ke belakang dan hari-H terkunci untuk susunan personel)
  const isLocked = (() => {
    if (!activeDateStr) return false;
    const [y, m, d] = activeDateStr.split('-').map(Number);
    const target = new Date(y, m - 1, d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 3600 * 24));
    return diffDays <= 0;
  })();

  const handleShiftDate = (days: number) => {
    const [y, m, d] = timelineAnchorDate.split('-').map(Number);
    const current = new Date(y, m - 1, d);
    current.setDate(current.getDate() + days);
    setTimelineAnchorDate(formatLocalDateToYMD(current));
  };

  const handleResetToToday = () => {
    const today = formatLocalDateToYMD(new Date());
    setTimelineAnchorDate(today);
    setActiveDateStr(today);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '40px' }}>
      {/* ── HEADER KONTROL MAKO & TANGGAL ── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          borderRadius: '16px',
          padding: '22px 24px',
          color: '#FFFFFF',
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.12)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ background: '#2563EB', padding: '6px', borderRadius: '8px', display: 'flex' }}>
                <CalendarDays size={18} color="#FFFFFF" />
              </span>
              <h2 style={{ margin: 0, fontSize: '19px', fontWeight: 800 }}>
                Jadwal Piket Personel Mako
              </h2>
            </div>
            <p style={{ margin: 0, color: '#94A3B8', fontSize: '13px' }}>
              Pencatatan dan pemantauan personel piket harian: Hari Ini, Besok, Lusa, dan hari-hari berikutnya.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Filter Kantor Polisi */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11px', color: '#CBD5E1', fontWeight: 700 }}>MAKO:</span>
              <div style={{ minWidth: '220px' }}>
                <Select2CustomDropdown
                  value={selectedStationId}
                  onChange={(val) => setSelectedStationId(Number(val))}
                  options={lookups.stations.map((s) => ({
                    value: s.id,
                    label: s.station_name,
                    sublabel: s.station_code ? `Kode: ${s.station_code}` : undefined,
                  }))}
                  placeholder="-- Pilih Mako --"
                  searchable={true}
                  triggerStyle={{
                    background: '#334155',
                    borderColor: '#475569',
                    color: '#FFFFFF',
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: 700,
                  }}
                />
              </div>
            </div>

            {/* Tombol Atur / Tambah Jadwal Piket */}
            <button
              onClick={() => setModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                background: '#2563EB',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '12.5px',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(37, 99, 235, 0.3)',
              }}
            >
              <Plus size={15} />
              Atur / Tambah Piket
            </button>

            <button
              onClick={loadData}
              disabled={loading}
              title="Refresh Data"
              style={{
                padding: '8px',
                borderRadius: '8px',
                border: '1px solid #475569',
                background: '#334155',
                color: '#CBD5E1',
                cursor: 'pointer',
                display: 'flex',
              }}
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* ── TIMELINE HARI (RIWAYAT SEBELUMNYA, HARI INI, BESOK, LUSA, SETERUSNYA) ── */}
        <div style={{ borderTop: '1px solid #334155', paddingTop: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={13} color="#94A3B8" />
              Riwayat Piket & Timeline Mendatang:
            </div>

            {/* Navigasi Cepat & Date Picker Langsung */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => handleShiftDate(-7)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  background: '#334155',
                  color: '#CBD5E1',
                  border: '1px solid #475569',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <ChevronLeft size={13} />
                7 Hari Lalu
              </button>

              <button
                type="button"
                onClick={handleResetToToday}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  background: isViewingToday ? '#2563EB' : '#1E293B',
                  color: '#FFFFFF',
                  border: '1px solid #3B82F6',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Hari Ini
              </button>

              <button
                type="button"
                onClick={() => handleShiftDate(7)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  background: '#334155',
                  color: '#CBD5E1',
                  border: '1px solid #475569',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                7 Hari Kedepan
                <ChevronRight size={13} />
              </button>

              {/* Lompat ke Tanggal */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#0F172A', padding: '3px 8px', borderRadius: '6px', border: '1px solid #334155' }}>
                <span style={{ fontSize: '10.5px', color: '#94A3B8', fontWeight: 600 }}>Lompat:</span>
                <input
                  type="date"
                  value={activeDateStr}
                  onChange={(e) => {
                    if (e.target.value) {
                      setActiveDateStr(e.target.value);
                      setTimelineAnchorDate(e.target.value);
                    }
                  }}
                  style={{
                    background: 'transparent',
                    color: '#FFF',
                    border: 'none',
                    fontSize: '11px',
                    fontWeight: 700,
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                />
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '10px',
              overflowX: 'auto',
              paddingBottom: '8px',
              scrollbarWidth: 'thin',
            }}
          >
            {timeline.map((item) => {
              const isSelected = item.dateStr === activeDateStr;
              return (
                <div
                  key={item.dateStr}
                  onClick={() => setActiveDateStr(item.dateStr)}
                  style={{
                    flex: '0 0 auto',
                    minWidth: '135px',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    background: isSelected
                      ? '#2563EB'
                      : item.isToday
                      ? '#1E3A8A'
                      : item.isLocked
                      ? '#1E293B'
                      : '#0F2847',
                    border: isSelected
                      ? '2px solid #60A5FA'
                      : item.isToday
                      ? '1px solid #3B82F6'
                      : item.isLocked
                      ? '1px solid #334155'
                      : '1px solid #0284C7',
                    color: '#FFFFFF',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span
                      style={{
                        fontSize: '9.5px',
                        fontWeight: 900,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: isSelected
                          ? '#1E40AF'
                          : item.isToday
                          ? '#2563EB'
                          : item.isTomorrow
                          ? '#059669'
                          : item.isLocked
                          ? '#475569'
                          : '#0284C7',
                        color: '#FFFFFF',
                        letterSpacing: '0.5px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                    >
                      {item.isLocked && <Shield size={10} />}
                      <span>{item.badgeLabel}</span>
                    </span>
                    <span style={{ fontSize: '11px', color: isSelected ? '#DBEAFE' : '#94A3B8', fontWeight: 700 }}>
                      {item.dayNumber} {item.monthName}
                    </span>
                  </div>

                  <div style={{ fontSize: '12px', fontWeight: 800 }}>
                    {item.dayOfWeek}
                  </div>

                  <div style={{ fontSize: '11px', marginTop: '4px', color: isSelected ? '#EFF6FF' : item.membersCount > 0 ? '#4ADE80' : '#64748B', fontWeight: 600 }}>
                    {item.membersCount > 0 ? (
                      <span>● {item.membersCount} Polisi Piket</span>
                    ) : (
                      <span style={{ opacity: 0.7 }}>Belum ada jadwal</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── DETAIL PERSONEL PIKET PADA TANGGAL YANG DIPILIH ── */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          padding: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        }}
      >
        {/* Banner Tanggal Aktif */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #F1F5F9' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px', flexWrap: 'wrap' }}>
              {isPastDate ? (
                <span style={{ background: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA', fontSize: '10.5px', fontWeight: 800, padding: '2px 8px', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Shield size={12} color="#DC2626" />
                  🔒 TERKUNCI (H-1 / LAMPAU)
                </span>
              ) : isViewingToday ? (
                <span style={{ background: '#DCFCE7', color: '#15803D', border: '1px solid #BBF7D0', fontSize: '10.5px', fontWeight: 800, padding: '2px 8px', borderRadius: '20px' }}>
                  ● HARI INI (DINAS BERJALAN)
                </span>
              ) : (
                <span style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', fontSize: '10.5px', fontWeight: 800, padding: '2px 8px', borderRadius: '20px' }}>
                  ● DAPAT DIUBAH (H+1 KE DEPAN)
                </span>
              )}
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0F172A' }}>
                Daftar Personel Piket: {formattedActiveDate}
              </h3>
            </div>
            <div style={{ fontSize: '12px', color: '#64748B' }}>
              Mako: <strong>{selectedStationObj?.station_name || 'Polsek / Polres'}</strong>
              {activePiket?.regu && (
                <> | Regu: <strong style={{ color: '#2563EB' }}>{activePiket.regu}</strong></>
              )}
              {activePiket?.pawas && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginLeft: '6px' }}>
                  | Pawas:
                  <NameInitialAvatar
                    name={activePiket.pawas.user?.full_name || activePiket.pawas.rank_pangkat}
                    avatarUrl={activePiket.pawas.user?.avatar_url || activePiket.pawas.avatar_url}
                    size={22}
                    variant="gold"
                    title={activePiket.pawas.user?.full_name}
                  />
                  <strong style={{ color: '#0F172A' }}>
                    {activePiket.pawas.rank_pangkat} {activePiket.pawas.user?.full_name}
                  </strong>
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {activePiket && (
              <button
                onClick={() => setModalPrintOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  background: '#F1F5F9',
                  color: '#1E293B',
                  border: '1px solid #CBD5E1',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <Printer size={14} />
                Cetak / PDF
              </button>
            )}

            {!isLocked && (
              <button
                onClick={() => setModalOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  background: '#EFF6FF',
                  color: '#2563EB',
                  border: '1px solid #BFDBFE',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <Calendar size={14} />
                Atur Tanggal Ini
              </button>
            )}

            {activePiket && !isLocked && (
              <button
                onClick={handleDeleteSchedule}
                title="Hapus Jadwal Tanggal Ini"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '7px 10px',
                  background: '#FEF2F2',
                  color: '#DC2626',
                  border: '1px solid #FECACA',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>

        {/* NOTIFIKASI INFORMASI SOP H-1 JIKA JADWAL TERKUNCI */}
        {isLocked && (
          <div
            style={{
              padding: '10px 14px',
              background: '#FFFBEB',
              border: '1px solid #FDE68A',
              borderRadius: '8px',
              color: '#92400E',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px',
            }}
          >
            <Shield size={16} color="#D97706" style={{ flexShrink: 0 }} />
            <div>
              <strong>Ketentuan SOP POLRI:</strong>{' '}
              {isPastDate
                ? 'Rekam jejak jadwal dan presensi kehadiran piket pada H-1 serta hari-hari lampau telah ditutup dan terkunci permanen (Arsip Kedinasan). Data tidak dapat diubah lagi.'
                : 'Jadwal piket hari ini telah berjalan sejak serah terima piket (08.00 WIB) sehingga susunan personel terkunci. Pembaruan presensi kehadiran personel dapat dilakukan selama kedinasan berjalan.'}
            </div>
          </div>
        )}

        {/* TABEL PERSONEL PIKET HARI INI / TANGGAL TERPILIH */}
        {activePiket && activePiket.members && activePiket.members.length > 0 ? (
          <div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 800, color: '#475569', width: '40px' }}>NO</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 800, color: '#475569' }}>PERSONEL POLISI</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 800, color: '#475569' }}>SATUAN / FUNGSI</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 800, color: '#475569' }}>TUGAS / PERAN PIKET</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 800, color: '#475569' }}>POS / PLOTING</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 800, color: '#475569', width: '170px' }}>
                      STATUS KEHADIRAN {isPastDate && <span style={{ fontSize: '10px', color: '#94A3B8' }}>(TERKUNCI)</span>}
                    </th>
                    {!isLocked && (
                      <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 800, color: '#475569', width: '50px' }}>AKSI</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {activePiket.members.map((m: any, idx: number) => {
                    const off = m.officer;
                    return (
                      <tr key={m.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '12px 14px', color: '#64748B', fontWeight: 700 }}>{idx + 1}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <NameInitialAvatar
                              name={off?.user?.full_name}
                              avatarUrl={off?.user?.avatar_url || off?.avatar_url}
                              size={36}
                              variant="gold"
                              title={off?.user?.full_name}
                            />
                            <div>
                              <div style={{ fontWeight: 700, color: '#0F172A' }}>{off?.user?.full_name}</div>
                              <div style={{ fontSize: '11px', color: '#64748B' }}>
                                {off?.rank_pangkat} | NRP: {off?.nrp}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 600, color: '#334155' }}>
                          {off?.unit?.unit_name || off?.jabatan || 'Polri'}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ fontWeight: 700, color: '#1E293B' }}>
                            {m.role_piket?.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', color: '#475569' }}>
                          {m.pos_penugasan || 'Mako Penjagaan'}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          {isPastDate ? (
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '5px 10px',
                                borderRadius: '6px',
                                fontSize: '11.5px',
                                fontWeight: 800,
                                background:
                                  m.status_kehadiran === 'HADIR_DINAS'
                                    ? '#F0FDF4'
                                    : m.status_kehadiran === 'SAKIT'
                                    ? '#FEF2F2'
                                    : m.status_kehadiran === 'BELUM_HADIR'
                                    ? '#FEFCE8'
                                    : '#F1F5F9',
                                color:
                                  m.status_kehadiran === 'HADIR_DINAS'
                                    ? '#15803D'
                                    : m.status_kehadiran === 'SAKIT'
                                    ? '#B91C1C'
                                    : m.status_kehadiran === 'BELUM_HADIR'
                                    ? '#A16207'
                                    : '#475569',
                                border: `1px solid ${
                                  m.status_kehadiran === 'HADIR_DINAS'
                                    ? '#BBF7D0'
                                    : m.status_kehadiran === 'SAKIT'
                                    ? '#FECACA'
                                    : m.status_kehadiran === 'BELUM_HADIR'
                                    ? '#FEF08A'
                                    : '#CBD5E1'
                                }`,
                              }}
                              title="Presensi kehadiran terkunci permanen (Arsip Kedinasan Lampau)"
                            >
                              <span>
                                {POLRI_ATTENDANCE_STATUSES.find((st) => st.key === m.status_kehadiran)?.label || m.status_kehadiran || 'Hadir Dinas'}
                              </span>
                              <span style={{ fontSize: '10px', opacity: 0.7 }} title="Terkunci">🔒</span>
                            </div>
                          ) : (
                            <div style={{ minWidth: '150px' }}>
                              <Select2CustomDropdown
                                value={m.status_kehadiran}
                                onChange={(val) => handleAttendanceChange(m.id, val)}
                                options={POLRI_ATTENDANCE_STATUSES.map((st) => ({
                                  value: st.key,
                                  label: st.label,
                                }))}
                                searchable={false}
                                triggerStyle={{
                                  padding: '5px 8px',
                                  fontSize: '11.5px',
                                  fontWeight: 800,
                                  borderRadius: '6px',
                                  border: '1px solid #CBD5E1',
                                  color:
                                    m.status_kehadiran === 'HADIR_DINAS'
                                      ? '#15803D'
                                      : m.status_kehadiran === 'BELUM_HADIR'
                                      ? '#A16207'
                                      : m.status_kehadiran === 'SAKIT'
                                      ? '#B91C1C'
                                      : '#475569',
                                }}
                              />
                            </div>
                          )}
                        </td>
                        {!isLocked && (
                          <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleRemoveOfficer(m.id)}
                              title="Hapus dari jadwal hari ini"
                              style={{
                                padding: '5px',
                                background: '#FEF2F2',
                                border: '1px solid #FECACA',
                                borderRadius: '4px',
                                color: '#DC2626',
                                cursor: 'pointer',
                              }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* QUICK ADD ROW LANGSUNG KE JADWAL INI (Hanya jika belum locked) */}
            {!isLocked && (
              <form
                onSubmit={handleQuickAddOfficer}
                style={{
                  marginTop: '16px',
                  padding: '12px 16px',
                  background: '#F8FAFC',
                  border: '1px dashed #CBD5E1',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#334155' }}>
                  + Tambah Personel ke Tanggal Ini:
                </span>

                <div style={{ minWidth: '220px', flex: 1 }}>
                  <Select2CustomDropdown
                    value={quickOfficerId}
                    onChange={(val) => {
                      const offId = val ? String(val) : '';
                      setQuickOfficerId(offId);
                      if (offId) {
                        const off = lookups.officers.find((o) => String(o.id) === String(offId));
                        if (off?.unit) {
                          setQuickRole(off.unit.short_name || off.unit.unit_name);
                          const uKey = (off.unit.key || '').toLowerCase();
                          if (uKey === 'reskrim') setQuickPos('Ruang Sidik Reskrim');
                          else if (uKey === 'lantas') setQuickPos('Pos Gatur Lalu Lintas');
                          else if (uKey === 'intel') setQuickPos('Monitoring Intelkam');
                          else if (uKey === 'binmas') setQuickPos('Sambang Kamtibmas');
                          else if (uKey === 'sabhara') setQuickPos('Patroli Samapta Presisi');
                          else if (uKey === 'spkt') setQuickPos('Sentra Pelayanan SPKT');
                          else if (uKey === 'pamapta') setQuickPos('Meja Piket Call Center 110');
                          else if (uKey === 'propam') setQuickPos('Pengawasan Personel & Tahanan');
                        }
                      }
                    }}
                    options={availableOfficersForAdd.map((o) => {
                      const name = o.user?.full_name || 'Petugas';
                      const rank = o.rank_pangkat || '';
                      const displayName = rank && !name.toLowerCase().startsWith(rank.toLowerCase())
                        ? `${rank} ${name}`
                        : name;
                      return {
                        value: String(o.id),
                        label: displayName,
                        sublabel: `${o.nrp ? `NRP: ${o.nrp}` : ''}${o.unit?.short_name ? ` • ${o.unit.short_name}` : ''}`,
                        badge: o.unit?.short_name || o.rank_pangkat || undefined,
                      };
                    })}
                    placeholder="-- Pilih Anggota Polisi --"
                    searchable={true}
                    triggerStyle={{
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      fontSize: '12px',
                    }}
                  />
                </div>

                <div style={{ minWidth: '180px' }}>
                  <Select2CustomDropdown
                    value={quickRole}
                    onChange={(val) => setQuickRole(val)}
                    options={(() => {
                      const leadership: Select2Option[] = [
                        { value: 'Ka SPKT', label: 'Ka SPKT' },
                        { value: 'Pawas / Padal', label: 'Pawas / Padal' },
                      ];
                      if (lookups.operationalUnits && lookups.operationalUnits.length > 0) {
                        const dbUnits = lookups.operationalUnits.map((u: any) => {
                          const short = u.short_name || u.unit_name;
                          return { value: short, label: short, sublabel: u.unit_name };
                        });
                        return [...leadership, ...dbUnits.filter((u: any) => u.value !== 'Ka SPKT')];
                      }
                      return [
                        ...leadership,
                        { value: 'Sat Samapta', label: 'Sat Samapta' },
                        { value: 'Sat Lantas', label: 'Sat Lantas' },
                        { value: 'Sat Reskrim', label: 'Sat Reskrim' },
                        { value: 'Sat Intelkam', label: 'Sat Intelkam' },
                        { value: 'Sat Binmas', label: 'Sat Binmas' },
                        { value: 'SPKT', label: 'SPKT' },
                      ];
                    })()}
                    placeholder="-- Satuan / Tugas Piket --"
                    searchable={true}
                    triggerStyle={{
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      fontSize: '12px',
                    }}
                  />
                </div>

                <input
                  type="text"
                  placeholder="Pos / Ploting"
                  value={quickPos}
                  onChange={(e) => setQuickPos(e.target.value)}
                  style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px', flex: 1, minWidth: '140px' }}
                />

                <button
                  type="submit"
                  disabled={addingOfficer || !quickOfficerId}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    background: '#2563EB',
                    color: '#FFF',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer',
                    opacity: !quickOfficerId ? 0.6 : 1,
                  }}
                >
                  {addingOfficer ? 'Menambahkan...' : 'Tambahkan'}
                </button>
              </form>
            )}
          </div>
        ) : (
          /* JIKA BELUM ADA JADWAL DI TANGGAL TERSEBUT */
          <div style={{ textAlign: 'center', padding: '36px 20px' }}>
            <AlertCircle size={36} color="#94A3B8" style={{ margin: '0 auto 10px auto' }} />
            <h4 style={{ margin: 0, fontWeight: 800, color: '#1E293B', fontSize: '15px' }}>
              Belum Ada Personel yang Terjadwal Piket pada {formattedActiveDate}
            </h4>
            <p style={{ margin: '4px 0 16px 0', fontSize: '12px', color: '#64748B' }}>
              {isLocked
                ? 'Tanggal ini adalah H-1 atau tanggal lampau yang telah terkunci sesuai SOP POLRI.'
                : 'Tentukan siapa saja anggota polisi yang bertugas piket pada tanggal ini.'}
            </p>
            {!isLocked ? (
              <button
                onClick={() => setModalOpen(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 18px',
                  background: '#2563EB',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(37, 99, 235, 0.3)',
                }}
              >
                <Plus size={15} />
                Atur Personel Piket untuk Tanggal Ini
              </button>
            ) : (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  background: '#F1F5F9',
                  border: '1px solid #CBD5E1',
                  borderRadius: '8px',
                  color: '#64748B',
                  fontSize: '12px',
                  fontWeight: 700,
                }}
              >
                <Shield size={14} color="#94A3B8" />
                Jadwal Terkunci (SOP H-1) — Jadwal Lampau Tidak Dapat Dibuat Mundur
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL ATUR PIKET HARIAN */}
      <ModalAturPiketHarian
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialDate={activeDateStr}
        stationId={selectedStationId}
        stations={lookups.stations}
        officers={lookups.officers}
        operationalUnits={lookups.operationalUnits}
        onSuccess={loadData}
        showToast={showToast}
      />

      {/* MODAL CETAK JADWAL PIKET */}
      {activePiket && (
        <ModalPrintSprintPiket
          isOpen={modalPrintOpen}
          onClose={() => setModalPrintOpen(false)}
          schedule={activePiket}
          dateStr={activeDateStr}
        />
      )}
    </div>
  );
}
