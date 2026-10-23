'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Shield,
  User,
  Clock,
  MapPin,
  TrendingUp,
  Award,
  CheckCircle2,
  AlertTriangle,
  FileText,
  LogOut,
  Smartphone,
  ChevronRight,
  Printer,
  Calendar,
  Lock,
  X,
  Camera,
  Upload,
  Search,
  KeyRound,
  Power,
  ArrowLeft,
  Navigation,
  Radio,
  ShieldCheck,
  Eye,
  Phone,
} from 'lucide-react';
import KpiGaugeChart from '@/components/KpiGaugeChart';
import { getOfficerInitials, hasOfficerAcceptedTask, formatPhoneNumber, getCleanCallNumber } from '../types';
import type { ComplaintData, OfficerProfile } from '../types';
import NameInitialAvatar from '@/components/ui/NameInitialAvatar';
import { formatIncidentDateTime, formatTimeWib, formatDateTimeWib } from '@/lib/date-utils';
import {
  updateUserProfileAndAvatarAction,
  updateUserPasswordAction,
} from '@/app/actions/auth.actions';

interface TabProfilPersonilProps {
  officer: OfficerProfile;
  complaints: ComplaintData[];
  logbooks: any[];
  currentGps: { lat: number; lng: number };
  onPresensiMasuk: () => Promise<void>;
  onPresensiPulang: () => Promise<void>;
  onLogout: () => Promise<void>;
  onTabChange?: (tab: 'beranda' | 'peta' | 'profil') => void;
}

export default function TabProfilPersonil({
  officer,
  complaints,
  logbooks,
  currentGps,
  onPresensiMasuk,
  onPresensiPulang,
  onLogout,
  onTabChange,
}: TabProfilPersonilProps) {
  const [localOfficer, setLocalOfficer] = useState<OfficerProfile>(officer);
  const [kpiPeriod, setKpiPeriod] = useState<'harian' | 'mingguan' | 'bulanan'>('harian');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  // Active Modal: 'profil' | 'keamanan' | 'kpi' | 'log' | 'logout' | null
  const [activeModal, setActiveModal] = useState<'profil' | 'keamanan' | 'kpi' | 'log' | 'logout' | null>(null);

  // Selected complaint for Tactical Detail & Timeline in Riwayat Log Lengkap
  const [selectedLogComplaint, setSelectedLogComplaint] = useState<ComplaintData | null>(null);
  const [lightboxData, setLightboxData] = useState<{
    url: string;
    title: string;
    meta?: string;
    desc?: string;
  } | null>(null);

  // Profile Edit & Avatar States
  const [editFullName, setEditFullName] = useState<string>(officer.fullName || '');
  const [editPangkat, setEditPangkat] = useState<string>(officer.pangkat || '');
  const [editPhone, setEditPhone] = useState<string>('');
  const [editEmail, setEditEmail] = useState<string>('');
  const [editAvatar, setEditAvatar] = useState<string | null>(officer.avatar || null);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keamanan & Password States
  const [oldPassword, setOldPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [isSavingKeamanan, setIsSavingKeamanan] = useState<boolean>(false);

  // Log Search & Filter States
  const [logSearch, setLogSearch] = useState<string>('');
  const [logFilter, setLogFilter] = useState<'semua' | 'menunggu' | 'diproses' | 'selesai'>('semua');

  // Duty Status (Dinas Aktif vs Lepas Dinas)
  const isOnDuty = (localOfficer.dutyStatus || officer.dutyStatus) !== 'LEPAS_DINAS';
  const [isTogglingDuty, setIsTogglingDuty] = useState(false);

  // Synchronize localOfficer when prop changes
  useEffect(() => {
    setLocalOfficer(officer);
    setEditFullName(officer.fullName || '');
    setEditPangkat(officer.pangkat || '');
    setEditAvatar(officer.avatar || null);
  }, [officer]);

  // Handle Switch Status Dinas (Tanpa Batasan Radius Mako)
  const handleToggleDuty = async () => {
    if (isTogglingDuty) return;
    setIsTogglingDuty(true);
    try {
      if (isOnDuty) {
        await onPresensiPulang();
        setLocalOfficer((prev) => ({ ...prev, dutyStatus: 'LEPAS_DINAS' }));
      } else {
        await onPresensiMasuk();
        setLocalOfficer((prev) => ({ ...prev, dutyStatus: 'DINAS_PATROLI' }));
      }
    } catch (err: any) {
      alert(`Gagal mengubah status dinas: ${err?.message || 'Terjadi kesalahan'}`);
    } finally {
      setIsTogglingDuty(false);
    }
  };

  // Statistik Logbook & KPI
  const totalLogs = logbooks.length;
  const approvedLogs = logbooks.filter(
    (l) => (l.statusValidasi || '').toUpperCase() === 'DISETUJUI'
  ).length;

  const handleLogoutClick = () => {
    setActiveModal('logout');
  };

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await onLogout();
    } finally {
      setIsLoggingOut(false);
      setActiveModal(null);
    }
  };

  // Avatar file selection handler
  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Berkas harus berupa gambar berformat JPG, PNG, atau WEBP');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran berkas foto maksimal 5MB');
      return;
    }

    setSelectedAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setEditAvatar(result);
    };
    reader.readAsDataURL(file);
  };

  // Save Profile Handler
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFullName.trim()) {
      alert('Nama lengkap tidak boleh kosong!');
      return;
    }

    setIsSavingProfile(true);
    try {
      let finalAvatarUrl: string | null = editAvatar;

      if (selectedAvatarFile) {
        const formData = new FormData();
        formData.append('file', selectedAvatarFile);
        if (localOfficer.nrp) {
          formData.append('nrp', localOfficer.nrp);
        }

        const uploadRes = await fetch('/api/upload-avatar', {
          method: 'POST',
          body: formData,
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok || !uploadData.success || !uploadData.url) {
          throw new Error(uploadData.error || 'Gagal mengunggah berkas foto');
        }
        finalAvatarUrl = uploadData.url;
      }

      const res = await updateUserProfileAndAvatarAction({
        fullName: editFullName.trim(),
        pangkat: editPangkat.trim(),
        phoneNumber: editPhone.trim(),
        email: editEmail.trim(),
        avatar: finalAvatarUrl,
      });

      if (res.success && res.data) {
        setLocalOfficer((prev) => ({
          ...prev,
          fullName: res.data?.fullName || prev.fullName,
          pangkat: res.data?.pangkat || prev.pangkat || '-',
          avatar: res.data?.avatar !== undefined ? (res.data.avatar || null) : prev.avatar,
        }));
        setEditAvatar(res.data.avatar || null);
        setSelectedAvatarFile(null);
        setAvatarError(false);
        alert('✓ Data profil & foto dinas berhasil diperbarui!');
        setActiveModal(null);
      } else {
        alert(`Gagal: ${res.error || 'Gagal menyimpan profil'}`);
      }
    } catch (err: any) {
      alert(`Terjadi kesalahan: ${err.message || 'Gagal menyimpan'}`);
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Save Keamanan & Password Handler
  const handleSaveKeamanan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword.trim()) {
      alert('Silakan masukkan kata sandi lama saat ini!');
      return;
    }
    if (!newPassword.trim()) {
      alert('Silakan masukkan kata sandi baru!');
      return;
    }
    if (newPassword.length < 6) {
      alert('Kata sandi baru minimal 6 karakter!');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('Konfirmasi kata sandi baru tidak sesuai!');
      return;
    }

    setIsSavingKeamanan(true);
    try {
      const res = await updateUserPasswordAction(newPassword, oldPassword);
      if (!res.success) {
        throw new Error(res.error || 'Gagal mengubah kata sandi');
      }

      alert('✓ Kata sandi akun dinas berhasil diperbarui!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setActiveModal(null);
    } catch (err: any) {
      alert(`Terjadi kesalahan: ${err.message || 'Gagal menyimpan kata sandi'}`);
    } finally {
      setIsSavingKeamanan(false);
    }
  };

  // Formatter nama petugas dinas & pangkat
  const formatOfficerName = (rank?: string, fullName?: string) => {
    if (!fullName) return rank ? `${rank} Personel` : 'Personel Lapangan';
    const cleanRank = (rank || '').trim();
    let cleanName = (fullName || '').trim();
    if (cleanRank && cleanName.toLowerCase().startsWith(cleanRank.toLowerCase())) {
      return cleanName;
    }
    return cleanRank ? `${cleanRank} ${cleanName}` : cleanName;
  };

  // Status classifier & resolver tema taktis gold
  const resolveTacticalStatusMeta = (statusRaw?: string) => {
    const s = String(statusRaw || '').toUpperCase();
    if (s === 'SELESAI' || s === 'SELESAI_PENANGANAN' || s === 'DITUTUP') {
      return {
        label: '✓ Selesai Ditangani',
        badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        textClass: 'text-emerald-400',
      };
    }
    if (s === 'MENUNGGU_PENGESAHAN') {
      return {
        label: '⚖️ Menunggu Pengesahan Pawas',
        badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
        textClass: 'text-purple-400',
      };
    }
    if (s === 'DIPROSES') {
      return {
        label: 'Sedang Ditangani',
        badgeClass: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
        textClass: 'text-blue-400',
      };
    }
    if (s === 'DITOLAK') {
      return {
        label: 'Ditolak',
        badgeClass: 'bg-red-500/15 text-red-300 border-red-500/30',
        textClass: 'text-red-400',
      };
    }
    return {
      label: 'Menunggu Disposisi',
      badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      textClass: 'text-amber-400',
    };
  };

  // Status classifier presisi untuk tab Riwayat Log
  const isStatusMenunggu = (st?: string) => {
    const s = (st || '').toUpperCase();
    return s === 'MENUNGGU';
  };

  const isStatusDiproses = (st?: string) => {
    const s = (st || '').toUpperCase();
    return s === 'DIPROSES' || s === 'MENUNGGU_PENGESAHAN';
  };

  const isStatusSelesai = (st?: string) => {
    const s = (st || '').toUpperCase();
    return s === 'SELESAI';
  };

  // Filter khusus: Hanya tiket yang benar-benar ditugaskan / diterima oleh personil ini
  const myComplaints = useMemo(() => {
    return complaints.filter((c) => {
      // 1. Cek apakah ada dispatch yang tercatat untuk personil ini
      const dispatches = c.dispatches || [];
      const isMatchedInDispatch = dispatches.some(
        (d: any) =>
          (d.officer_id && String(d.officer_id) === String(officer.id)) ||
          (d.officer?.nrp && d.officer.nrp === officer.nrp) ||
          (d.officer?.user?.identifier && d.officer.user.identifier === officer.nrp)
      );
      if (isMatchedInDispatch) return true;

      // 2. Cek apakah ditugaskan langsung ke officer ini
      if (
        (c.assigned_officer_id && String(c.assigned_officer_id) === String(officer.id)) ||
        (c.assignedOfficer?.nrp && c.assignedOfficer.nrp === officer.nrp) ||
        (c.assignedOfficer?.id && String(c.assignedOfficer.id) === String(officer.id))
      ) {
        return true;
      }

      // 3. Cek helper hasOfficerAcceptedTask
      return hasOfficerAcceptedTask(c, officer.nrp, officer.id);
    });
  }, [complaints, officer.id, officer.nrp]);

  const countSemua = myComplaints.length;
  const countMenunggu = useMemo(() => myComplaints.filter((c) => isStatusMenunggu(c.status)).length, [myComplaints]);
  const countDiproses = useMemo(() => myComplaints.filter((c) => isStatusDiproses(c.status)).length, [myComplaints]);
  const countSelesai = useMemo(() => myComplaints.filter((c) => isStatusSelesai(c.status)).length, [myComplaints]);

  // Filter complaints for Riwayat Log Lengkap
  const filteredComplaints = useMemo(() => {
    return myComplaints.filter((c) => {
      if (logFilter === 'menunggu' && !isStatusMenunggu(c.status)) return false;
      if (logFilter === 'diproses' && !isStatusDiproses(c.status)) return false;
      if (logFilter === 'selesai' && !isStatusSelesai(c.status)) return false;
      if (logSearch) {
        const q = logSearch.toLowerCase();
        const matchTiket = c.nomorTiket?.toLowerCase().includes(q);
        const matchKasus = c.jenisKejadian?.toLowerCase().includes(q);
        const matchTkp = c.tkpAlamatTeks?.toLowerCase().includes(q);
        if (!matchTiket && !matchKasus && !matchTkp) return false;
      }
      return true;
    });
  }, [myComplaints, logFilter, logSearch]);

  return (
    <div className="w-full pb-6 flex flex-col gap-6">
      {/* ======================================================== */}
      {/* 1. KARTU IDENTITAS PETUGAS (GOLD CENTURY LUXURY TACTICAL) */}
      {/* ======================================================== */}
      <div
        className="relative overflow-hidden rounded-3xl p-5 sm:p-7 text-white"
        style={{
          background: 'linear-gradient(135deg, #181C26 0%, #10131B 100%)',
          border: '1.5px solid rgba(236, 196, 115, 0.4)',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.8), 0 0 25px rgba(236, 196, 115, 0.15)',
        }}
      >
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Avatar with Gold Ring */}
          <div className="relative flex-shrink-0">
            <NameInitialAvatar
              name={localOfficer.fullName}
              avatarUrl={localOfficer.avatar}
              size={92}
              rounded="xl"
              variant="gold"
              onClick={() => setActiveModal('profil')}
              title="Klik untuk ubah profil & foto dinas"
              className="cursor-pointer group"
            />

            {/* Camera Edit Badge Shortcut */}
            <button
              type="button"
              onClick={() => setActiveModal('profil')}
              title="Klik untuk ubah profil & pasfoto dinas"
              className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-lg border-2 border-slate-900 hover:scale-110 hover:bg-amber-300 transition-all cursor-pointer"
            >
              <Camera size={12} className="stroke-[2.5]" />
            </button>

            <div
              className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-slate-900 ${
                isOnDuty ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-slate-500'
              }`}
              title={isOnDuty ? 'Aktif Berdinas' : 'Lepas Dinas'}
            />
          </div>

          {/* Details */}
          <div className="flex-1 text-center sm:text-left space-y-1">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                {localOfficer.pangkat || 'BRIPKA'}
              </span>
              <span className="w-1 h-1 rounded-full bg-amber-400/50" />
              <span className="text-[10px] font-mono font-bold text-slate-300">
                NRP {localOfficer.nrp}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
              {localOfficer.fullName || 'Petugas Lapangan'}
            </h2>

            <div className="text-xs text-amber-200/80 font-medium">
              {officer.jabatan || officer.satuan || 'Satuan Samapta • Unit Patroli Reaksi Cepat'}
            </div>

            <div className="pt-2 flex items-center justify-center sm:justify-start gap-2 flex-wrap">
              <span
                className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full transition-colors ${
                  isOnDuty
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    : 'bg-red-500/15 text-red-300 border border-red-500/30'
                }`}
              >
                ● {isOnDuty ? 'Dinas Patroli Aktif' : 'Lepas Dinas'}
              </span>

              <span className="text-[10px] font-bold text-slate-400 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
                Ranmor: {officer.kendaraan || 'Patroli R-4'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Identity Stats Cards */}
        <div className="grid grid-cols-3 gap-2 sm:gap-2.5 mt-5 pt-4 border-t border-amber-500/20">
          {/* Card 1: Total Tugas */}
          <div
            className="flex flex-col items-center justify-between p-2.5 sm:p-3 rounded-2xl text-center min-h-[76px] sm:min-h-[82px] transition-all"
            style={{
              background: 'linear-gradient(180deg, rgba(236, 196, 115, 0.08) 0%, rgba(236, 196, 115, 0.02) 100%)',
              border: '1px solid rgba(236, 196, 115, 0.25)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            }}
          >
            <span className="text-[9px] sm:text-[10px] font-bold text-amber-200/70 uppercase tracking-wider">
              Total Tugas
            </span>
            <div className="text-xl sm:text-2xl font-black font-mono text-amber-300 leading-none my-1">
              {myComplaints.length}
            </div>
            <span className="text-[9px] text-slate-400 font-medium leading-none">
              Kasus
            </span>
          </div>

          {/* Card 2: Respon SLA */}
          <div
            className="flex flex-col items-center justify-between p-2.5 sm:p-3 rounded-2xl text-center min-h-[76px] sm:min-h-[82px] transition-all"
            style={{
              background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0.02) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            }}
          >
            <span className="text-[9px] sm:text-[10px] font-bold text-emerald-200/70 uppercase tracking-wider">
              Respon SLA
            </span>
            <div className="text-xl sm:text-2xl font-black font-mono text-emerald-400 leading-none my-1">
              {localOfficer.kpi || officer.kpi || 96}%
            </div>
            <span className="text-[9px] text-emerald-400/80 font-medium leading-none">
              Presisi
            </span>
          </div>

          {/* Card 3: Validasi Pawas */}
          <div
            className="flex flex-col items-center justify-between p-2.5 sm:p-3 rounded-2xl text-center min-h-[76px] sm:min-h-[82px] transition-all"
            style={{
              background: 'linear-gradient(180deg, rgba(56, 189, 248, 0.08) 0%, rgba(56, 189, 248, 0.02) 100%)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            }}
          >
            <span className="text-[9px] sm:text-[10px] font-bold text-sky-200/70 uppercase tracking-wider">
              Validasi Pawas
            </span>
            <div className="text-xl sm:text-2xl font-black font-mono text-sky-400 leading-none my-1">
              {approvedLogs}
            </div>
            <span className="text-[9px] text-sky-400/80 font-medium leading-none">
              Disetujui
            </span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. PENGATURAN AKUN PETUGAS (6 MENU LIST - TACTICAL GOLD)  */}
      {/* ======================================================== */}
      <div
        className="rounded-3xl p-5 sm:p-6"
        style={{
          background: 'linear-gradient(180deg, #151821 0%, #0E1017 100%)',
          border: '1.5px solid rgba(236, 196, 115, 0.35)',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.8), 0 0 25px rgba(236, 196, 115, 0.12)',
        }}
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-amber-500/20">
          <span className="text-xs font-black uppercase tracking-wider text-amber-400">
            PENGATURAN AKUN PETUGAS
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            SIMOPMAS Mobile v2.4
          </span>
        </div>

        <div className="space-y-2">
          {/* 1. Menu Status Dinas dengan Switch Button */}
          <div
            id="btn-menu-status-dinas"
            className="p-3.5 rounded-2xl border border-white/5 bg-white/[0.03] hover:bg-white/[0.05] transition-all duration-200 flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300"
                style={{
                  background: isOnDuty
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%)'
                    : 'linear-gradient(135deg, rgba(148, 163, 184, 0.15) 0%, rgba(71, 85, 105, 0.1) 100%)',
                  border: isOnDuty
                    ? '1px solid rgba(16, 185, 129, 0.4)'
                    : '1px solid rgba(148, 163, 184, 0.2)',
                  color: isOnDuty ? '#34D399' : '#94A3B8',
                }}
              >
                <Power size={18} className="stroke-[2.5]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-white leading-snug">
                    Dinas
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-black transition-colors ${
                      isOnDuty
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-700/50 text-slate-400 border border-slate-600/30'
                    }`}
                  >
                    {isOnDuty ? 'AKTIF' : 'LEPAS'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                  {isOnDuty
                    ? 'Siap siaga & dapat menerima tiket penugasan'
                    : 'Lepas dinas • Tidak menerima tiket penugasan'}
                </div>
              </div>
            </div>

            {/* Switch Toggle Button */}
            <button
              id="switch-status-dinas"
              type="button"
              role="switch"
              aria-checked={isOnDuty}
              disabled={isTogglingDuty}
              onClick={handleToggleDuty}
              title={isOnDuty ? 'Klik untuk Lepas Dinas' : 'Klik untuk Aktifkan Dinas'}
              className="relative inline-flex items-center flex-shrink-0 cursor-pointer rounded-full p-0.5 transition-all duration-300 focus:outline-none disabled:opacity-50"
              style={{
                width: '52px',
                height: '28px',
                background: isOnDuty
                  ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                  : '#334155',
                border: isOnDuty ? '1px solid #34D399' : '1px solid #475569',
                boxShadow: isOnDuty ? '0 0 14px rgba(16, 185, 129, 0.45)' : 'none',
              }}
            >
              <span
                className="pointer-events-none inline-block rounded-full bg-white shadow-md transition-transform duration-300 ease-in-out"
                style={{
                  width: '22px',
                  height: '22px',
                  transform: isOnDuty ? 'translateX(24px)' : 'translateX(2px)',
                }}
              />
            </button>
          </div>

          {/* 2. Menu Ubah Profil & Foto Dinas */}
          <div
            id="btn-menu-ubah-profil"
            onClick={() => setActiveModal('profil')}
            className="group p-3.5 rounded-2xl border border-white/5 bg-white/[0.03] hover:bg-amber-500/10 hover:border-amber-500/30 transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 active:scale-[0.99]"
          >
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-amber-400 flex-shrink-0 group-hover:scale-105 transition-transform"
                style={{
                  background: 'linear-gradient(135deg, rgba(236, 196, 115, 0.15) 0%, rgba(184, 130, 42, 0.08) 100%)',
                  border: '1px solid rgba(236, 196, 115, 0.3)',
                }}
              >
                <User size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-black text-white group-hover:text-amber-300 transition-colors leading-snug">
                  Ubah Profil
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                  Ubah Foto, Nama, Pangkat &amp; Kontak
                </div>
              </div>
            </div>
            <span className="text-amber-400/70 group-hover:text-amber-300 group-hover:translate-x-1 transition-all text-base font-black flex-shrink-0">
              ➔
            </span>
          </div>

          {/* 2. Menu Keamanan Akun & Kata Sandi */}
          <div
            id="btn-menu-keamanan"
            onClick={() => setActiveModal('keamanan')}
            className="group p-3.5 rounded-2xl border border-white/5 bg-white/[0.03] hover:bg-amber-500/10 hover:border-amber-500/30 transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 active:scale-[0.99]"
          >
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-amber-400 flex-shrink-0 group-hover:scale-105 transition-transform"
                style={{
                  background: 'linear-gradient(135deg, rgba(236, 196, 115, 0.15) 0%, rgba(184, 130, 42, 0.08) 100%)',
                  border: '1px solid rgba(236, 196, 115, 0.3)',
                }}
              >
                <Lock size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-black text-white group-hover:text-amber-300 transition-colors leading-snug">
                  Ubah Sandi
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                  Ganti kata sandi login &amp; autentikasi akun dinas
                </div>
              </div>
            </div>
            <span className="text-amber-400/70 group-hover:text-amber-300 group-hover:translate-x-1 transition-all text-base font-black flex-shrink-0">
              ➔
            </span>
          </div>

          {/* 3. Menu Statistik (Grafik KPI & Kinerja) */}
          <div
            id="btn-menu-kpi"
            onClick={() => setActiveModal('kpi')}
            className="group p-3.5 rounded-2xl border border-white/5 bg-white/[0.03] hover:bg-amber-500/10 hover:border-amber-500/30 transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 active:scale-[0.99]"
          >
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-amber-400 flex-shrink-0 group-hover:scale-105 transition-transform"
                style={{
                  background: 'linear-gradient(135deg, rgba(236, 196, 115, 0.15) 0%, rgba(184, 130, 42, 0.08) 100%)',
                  border: '1px solid rgba(236, 196, 115, 0.3)',
                }}
              >
                <TrendingUp size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-black text-white group-hover:text-amber-300 transition-colors leading-snug">
                  Statistik
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                  Capaian respon SLA, kepuasan warga &amp; validasi tugas
                </div>
              </div>
            </div>
            <span className="text-amber-400/70 group-hover:text-amber-300 group-hover:translate-x-1 transition-all text-base font-black flex-shrink-0">
              ➔
            </span>
          </div>

          {/* 4. Menu Riwayat Log Lengkap */}
          <div
            id="btn-menu-riwayat-log"
            onClick={() => setActiveModal('log')}
            className="group p-3.5 rounded-2xl border border-white/5 bg-white/[0.03] hover:bg-amber-500/10 hover:border-amber-500/30 transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 active:scale-[0.99]"
          >
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-amber-400 flex-shrink-0 group-hover:scale-105 transition-transform"
                style={{
                  background: 'linear-gradient(135deg, rgba(236, 196, 115, 0.15) 0%, rgba(184, 130, 42, 0.08) 100%)',
                  border: '1px solid rgba(236, 196, 115, 0.3)',
                }}
              >
                <FileText size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-black text-white group-hover:text-amber-300 transition-colors leading-snug">
                    Riwayat
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                  Rekam jejak seluruh penanganan laporan &amp; tugas
                </div>
              </div>
            </div>
            <span className="text-amber-400/70 group-hover:text-amber-300 group-hover:translate-x-1 transition-all text-base font-black flex-shrink-0">
              ➔
            </span>
          </div>

          {/* 5. Menu Logout / Keluar Sesi Dinas */}
          <div
            id="btn-menu-logout"
            onClick={handleLogoutClick}
            className="group p-3.5 rounded-2xl border border-red-500/20 bg-red-500/[0.04] hover:bg-red-500/15 hover:border-red-500/40 transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 active:scale-[0.99]"
          >
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 flex-shrink-0 group-hover:scale-105 transition-transform">
                <LogOut size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-black text-red-400 group-hover:text-red-300 transition-colors leading-snug">
                  {isLoggingOut ? 'Mengakhiri Sesi...' : 'Logout'}
                </div>
                <div className="text-[11px] text-red-300/70 mt-0.5 leading-tight">
                  Akhiri sesi dan kembali ke portal masuk
                </div>
              </div>
            </div>
            <span className="text-red-400 group-hover:text-red-300 group-hover:translate-x-1 transition-all text-base font-black flex-shrink-0">
              ➔
            </span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. INFORMASI VERSI APLIKASI KEDINASAN                     */}
      {/* ======================================================== */}
      <div
        className="rounded-3xl p-5 text-center flex flex-col items-center justify-center space-y-2.5"
        style={{
          background: 'linear-gradient(180deg, #151821 0%, #0E1017 100%)',
          border: '1px solid rgba(236, 196, 115, 0.2)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
        }}
      >
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center text-amber-400 shadow-md"
          style={{
            background: 'linear-gradient(135deg, rgba(236, 196, 115, 0.15) 0%, rgba(184, 130, 42, 0.08) 100%)',
            border: '1px solid rgba(236, 196, 115, 0.3)',
          }}
        >
          <Shield size={20} className="stroke-[2.5]" />
        </div>

        <div>
          <div className="text-sm font-black text-white tracking-wide">
            SIMOPMAS 110 Mobile
          </div>
          <div className="text-xs font-mono font-bold text-amber-300 mt-0.5">
            Versi 2.4.0 (Build 2026.10-Presisi)
          </div>
        </div>

        <p className="text-[11px] text-slate-400 max-w-xs leading-relaxed">
          Sistem Monitoring &amp; Respon Cepat Kepolisian Bersama Masyarakat Terintegrasi SIPP Mabes Polri
        </p>

        <div className="pt-2 border-t border-white/5 w-full flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
            Server Online • Presisi Terenkripsi
          </span>
        </div>
      </div>


      {/* ======================================================== */}
      {/* MODAL 1: UBAH PROFIL & PASFOTO DINAS                     */}
      {/* ======================================================== */}
      {activeModal === 'profil' && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md overflow-hidden">
          <div
            className="relative w-full h-[100dvh] sm:h-auto max-w-none sm:max-w-xl min-h-[100dvh] sm:min-h-0 sm:max-h-[88vh] rounded-none sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl transition-all border-0 sm:border"
            style={{
              background: 'linear-gradient(180deg, #181C26 0%, #0E1118 100%)',
              borderColor: 'rgba(236, 196, 115, 0.45)',
              boxShadow: '0 25px 60px -10px rgba(0, 0, 0, 0.95), 0 0 30px rgba(236, 196, 115, 0.2)',
            }}
          >
            {/* Modal Header */}
            <div
              className="sticky top-0 z-20 flex-shrink-0 px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between border-b"
              style={{
                background: 'linear-gradient(135deg, rgba(236, 196, 115, 0.15) 0%, rgba(184, 130, 42, 0.08) 100%)',
                borderColor: 'rgba(236, 196, 115, 0.25)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-amber-400 flex-shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, #ECC473 0%, #D4A346 100%)',
                    color: '#0B0D13',
                    boxShadow: '0 0 16px rgba(236, 196, 115, 0.35)',
                  }}
                >
                  <User size={20} className="stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white leading-tight">
                    Ubah Profil &amp; Pasfoto Dinas
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Perbarui biodata personel, pangkat &amp; pasfoto kedinasan
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors flex-shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveProfile} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                {/* Photo Upload Section */}
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center gap-4">
                  <div className="relative flex-shrink-0">
                    <NameInitialAvatar
                      name={editFullName || 'Petugas'}
                      avatarUrl={editAvatar}
                      size={72}
                      rounded="xl"
                      variant="gold"
                    />
                  </div>

                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="text-xs font-bold text-white">Pasfoto Resmi Kedinasan</div>
                    <div className="text-[10px] text-slate-400">Format JPG, PNG, WEBP (maks. 5MB)</div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarFileChange}
                      className="hidden"
                    />

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-xl font-bold text-xs bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-colors flex items-center gap-1.5"
                      >
                        <Camera size={13} />
                        <span>Pilih Foto</span>
                      </button>

                      {editAvatar && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditAvatar(null);
                            setSelectedAvatarFile(null);
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                          className="px-3 py-1.5 rounded-xl font-bold text-xs bg-red-500/15 text-red-300 border border-red-500/30 hover:bg-red-500/25 transition-colors"
                        >
                          Hapus Foto
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Input Fields */}
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">
                      Nama Lengkap &amp; Gelar
                    </label>
                    <input
                      type="text"
                      value={editFullName}
                      onChange={(e) => setEditFullName(e.target.value)}
                      placeholder="Contoh: Bripka Dedi Prasetyo, S.H."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-medium"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">
                        Pangkat Kedinasan
                      </label>
                      <select
                        value={editPangkat}
                        onChange={(e) => setEditPangkat(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-white focus:outline-none focus:border-amber-400 font-medium"
                      >
                        {['BRIPDA', 'BRIPTU', 'BRIPKA', 'AIPDA', 'AIPTU', 'IPDA', 'IPTU', 'AKP', 'KOMPOL', 'AKBP'].map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-bold mb-1">
                        NRP (Identitas Resmi)
                      </label>
                      <input
                        type="text"
                        disabled
                        value={localOfficer.nrp || '-'}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/5 text-slate-400 font-mono font-bold cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">
                      Nomor WhatsApp / HP Aktif
                    </label>
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="Contoh: 081234567890"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">
                      Email Kedinasan (Opsional)
                    </label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="Contoh: dediprasetyo@polri.go.id"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer Buttons */}
              <div
                className="sticky bottom-0 z-20 flex-shrink-0 pt-3 pb-1 flex items-center justify-end gap-3 border-t"
                style={{
                  background: 'rgba(15, 18, 26, 0.95)',
                  backdropFilter: 'blur(10px)',
                  borderColor: 'rgba(255, 255, 255, 0.08)',
                }}
              >
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-5 py-2.5 rounded-xl text-xs font-black text-slate-950 transition-all duration-200 active:scale-95 disabled:opacity-50"
                  style={{
                    background: 'linear-gradient(135deg, #ECC473 0%, #D4A346 100%)',
                    boxShadow: '0 4px 14px rgba(212, 163, 70, 0.3)',
                  }}
                >
                  {isSavingProfile ? 'Menyimpan...' : '💾 Simpan Perubahan Profil'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: KEAMANAN AKUN & KATA SANDI                      */}
      {/* ======================================================== */}
      {activeModal === 'keamanan' && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md overflow-hidden">
          <div
            className="relative w-full h-[100dvh] sm:h-auto max-w-none sm:max-w-xl min-h-[100dvh] sm:min-h-0 sm:max-h-[88vh] rounded-none sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl transition-all border-0 sm:border"
            style={{
              background: 'linear-gradient(180deg, #181C26 0%, #0E1118 100%)',
              borderColor: 'rgba(236, 196, 115, 0.45)',
              boxShadow: '0 25px 60px -10px rgba(0, 0, 0, 0.95), 0 0 30px rgba(236, 196, 115, 0.2)',
            }}
          >
            {/* Modal Header */}
            <div
              className="sticky top-0 z-20 flex-shrink-0 px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between border-b"
              style={{
                background: 'linear-gradient(135deg, rgba(236, 196, 115, 0.15) 0%, rgba(184, 130, 42, 0.08) 100%)',
                borderColor: 'rgba(236, 196, 115, 0.25)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-amber-400 flex-shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, #ECC473 0%, #D4A346 100%)',
                    color: '#0B0D13',
                    boxShadow: '0 0 16px rgba(236, 196, 115, 0.35)',
                  }}
                >
                  <Lock size={20} className="stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white leading-tight">
                    Keamanan Akun &amp; Kata Sandi
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Kredensial SIPP Mabes Polri &amp; Keamanan Akun Dinas
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors flex-shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveKeamanan} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                {/* 2FA Banner */}
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-emerald-300">
                      Autentikasi Kedinasan (2FA) Aktif
                    </div>
                    <div className="text-[11px] text-emerald-400/80 font-mono">
                      Token Presisi Terverifikasi • NRP: {localOfficer.nrp}
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    SIAP
                  </span>
                </div>

                {/* Password Fields */}
                <div className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1.5">
                      Kata Sandi Lama Saat Ini <span className="text-amber-400">*</span>
                    </label>
                    <input
                      type="password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="Masukkan kata sandi lama saat ini..."
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1.5">
                      Kata Sandi Baru <span className="text-amber-400">*</span>
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Masukkan kata sandi baru (min. 6 karakter)..."
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1.5">
                      Konfirmasi Kata Sandi Baru <span className="text-amber-400">*</span>
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ketik ulang kata sandi baru..."
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer Buttons */}
              <div
                className="sticky bottom-0 z-20 flex-shrink-0 pt-3 pb-1 flex items-center justify-end gap-3 border-t"
                style={{
                  background: 'rgba(15, 18, 26, 0.95)',
                  backdropFilter: 'blur(10px)',
                  borderColor: 'rgba(255, 255, 255, 0.08)',
                }}
              >
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={isSavingKeamanan}
                  className="px-5 py-2.5 rounded-xl text-xs font-black text-slate-950 transition-all duration-200 active:scale-95 disabled:opacity-50"
                  style={{
                    background: 'linear-gradient(135deg, #ECC473 0%, #D4A346 100%)',
                    boxShadow: '0 4px 14px rgba(212, 163, 70, 0.3)',
                  }}
                >
                  {isSavingKeamanan ? 'Menyimpan...' : '🔒 Simpan Kata Sandi Baru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: GRAFIK KPI & AKUNTABILITAS KINERJA (BARU)        */}
      {/* ======================================================== */}
      {activeModal === 'kpi' && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md overflow-hidden">
          <div
            className="relative w-full h-[100dvh] sm:h-auto max-w-none sm:max-w-2xl min-h-[100dvh] sm:min-h-0 sm:max-h-[88vh] rounded-none sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl transition-all border-0 sm:border"
            style={{
              background: 'linear-gradient(180deg, #181C26 0%, #0E1118 100%)',
              borderColor: 'rgba(236, 196, 115, 0.45)',
              boxShadow: '0 25px 60px -10px rgba(0, 0, 0, 0.95), 0 0 30px rgba(236, 196, 115, 0.2)',
            }}
          >
            {/* Modal Header */}
            <div
              className="sticky top-0 z-20 flex-shrink-0 px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between border-b"
              style={{
                background: 'linear-gradient(135deg, rgba(236, 196, 115, 0.15) 0%, rgba(184, 130, 42, 0.08) 100%)',
                borderColor: 'rgba(236, 196, 115, 0.25)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-amber-400 flex-shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, #ECC473 0%, #D4A346 100%)',
                    color: '#0B0D13',
                    boxShadow: '0 0 16px rgba(236, 196, 115, 0.35)',
                  }}
                >
                  <TrendingUp size={20} className="stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white leading-tight">
                    Statistik &amp; Akuntabilitas Kinerja
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Grafik capaian respon SLA &amp; kepuasan masyarakat
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors flex-shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
              {/* Period Selector */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10 flex-wrap gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                  Periode Penilaian
                </span>
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10">
                  {(['harian', 'mingguan', 'bulanan'] as const).map((period) => (
                    <button
                      key={period}
                      type="button"
                      onClick={() => setKpiPeriod(period)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all ${
                        kpiPeriod === period
                          ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>

              {/* KPI Gauge Chart & SOP Score */}
              <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-white/[0.03] border border-white/10">
                <KpiGaugeChart
                  score={localOfficer.kpi || 96}
                  label={`${localOfficer.kpi || 96}%`}
                  subtext="Capaian Standar SOP & Respon SLA"
                />
                <div className="text-center mt-3">
                  <span className="text-xs sm:text-sm font-black text-amber-300 tracking-wide">
                    PREDIKAT: SANGAT BAIK (A)
                  </span>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Konsisten meluncur ke TKP di bawah target waktu 10 menit
                  </p>
                </div>
              </div>

              {/* Performance Numbers Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 sm:p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">
                    ⚡ Rata-Rata Waktu Respon
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-amber-300">
                    &lt; 8.4 Menit
                  </div>
                  <div className="text-[10px] text-emerald-400 font-medium">Target SOP: &lt; 10 Menit</div>
                </div>

                <div className="p-3.5 sm:p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">
                    🎯 Indeks Kepuasan Warga
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-emerald-400">
                    4.9 / 5.0
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium">Berdasarkan ulasan pelapor</div>
                </div>

                <div className="p-3.5 sm:p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">
                    🛡️ Tugas Tuntas di TKP
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-white">
                    {myComplaints.filter((c) => c.status === 'SELESAI').length} Kasus
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium">Terselesaikan secara tuntas</div>
                </div>

                <div className="p-3.5 sm:p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">
                    ✅ Tingkat Validasi Pawas
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-blue-400">
                    {totalLogs > 0 ? `${Math.round((approvedLogs / totalLogs) * 100)}%` : '100%'}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium">{approvedLogs} dari {totalLogs} log disetujui</div>
                </div>
              </div>

              {/* Print / Export Report Button */}
              <button
                type="button"
                onClick={() => alert('Mengekspor berkas akuntabilitas kinerja petugas ke format PDF...')}
                className="w-full py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 text-slate-200 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
              >
                <Printer size={16} />
                <span>Cetak / Ekspor Laporan Akuntabilitas Tugas (PDF)</span>
              </button>
            </div>

            {/* Modal Footer */}
            <div
              className="sticky bottom-0 z-20 flex-shrink-0 px-4 sm:px-6 py-3 sm:py-3.5 border-t flex items-center justify-end gap-3"
              style={{
                background: 'rgba(15, 18, 26, 0.95)',
                backdropFilter: 'blur(10px)',
                borderColor: 'rgba(255, 255, 255, 0.08)',
              }}
            >
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: RIWAYAT LOG LENGKAP & TIMELINE TAKTIS            */}
      {/* ======================================================== */}
      {activeModal === 'log' && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md overflow-hidden animate-in fade-in duration-200">
          <div
            className="relative w-full h-[100dvh] sm:h-auto max-w-none sm:max-w-2xl min-h-[100dvh] sm:min-h-0 sm:max-h-[88vh] rounded-none sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl transition-all border-0 sm:border"
            style={{
              background: 'linear-gradient(180deg, #181C26 0%, #0E1118 100%)',
              borderColor: 'rgba(236, 196, 115, 0.45)',
              boxShadow: '0 25px 60px -10px rgba(0, 0, 0, 0.95), 0 0 30px rgba(236, 196, 115, 0.2)',
            }}
          >
            {selectedLogComplaint ? (() => {
              const sel = selectedLogComplaint;
              const statusMeta = resolveTacticalStatusMeta(sel.status);

              // SOP Milestones State
              const isStep1Done = true;
              const isStep2Done = sel.status !== 'MENUNGGU';

              const isStep3Done =
                sel.status === 'SELESAI' ||
                sel.status === 'MENUNGGU_PENGESAHAN' ||
                Boolean(sel.responTibaTkpAt) ||
                Boolean(sel.waktuTibaTkp) ||
                Number(sel.tahap) >= 4;
              const isStep3Active =
                !isStep3Done &&
                (Number(sel.tahap) === 3 || Boolean(sel.waktuMeluncur));

              const isStep4Done =
                sel.status === 'SELESAI' ||
                sel.status === 'MENUNGGU_PENGESAHAN' ||
                Number(sel.tahap) >= 5;
              const isStep4Active =
                !isStep4Done &&
                (Number(sel.tahap) === 4 ||
                  Boolean(sel.responTibaTkpAt) ||
                  Boolean(sel.waktuTibaTkp));

              const isStep5Done =
                sel.status === 'SELESAI' ||
                Boolean(sel.pengesahanPawas);
              const isStep5Active = !isStep5Done && sel.status === 'MENUNGGU_PENGESAHAN';

              // Timestamps (Menampilkan Tanggal + Jam WIB secara lengkap dan konsisten)
              const baseDate = sel.createdAt || sel.created_at || sel.waktuLapor || new Date();
              const primaryDispatch =
                (sel.dispatches || []).find((d: any) => d.is_primary_unit) || sel.dispatches?.[0];
              const logMeluncur = (sel.complaintLogs || sel.complaint_logs || []).find(
                (l: any) =>
                  l.action?.includes('Meluncur') ||
                  l.action?.includes('MENUJU_TKP') ||
                  l.action?.includes('Persiapan') ||
                  l.action?.includes('DEPART')
              );
              const timelineMeluncur = (sel.timelines || []).find(
                (t: any) => t.tahapKe === 3 || (t.tahapTitle || '').includes('Meluncur')
              );

              const rawMeluncur =
                sel.waktuMeluncur ||
                sel.waktu_meluncur ||
                sel.responMeluncurAt ||
                primaryDispatch?.departed_at ||
                primaryDispatch?.departedAt ||
                logMeluncur?.created_at ||
                logMeluncur?.createdAt ||
                timelineMeluncur?.createdAt ||
                (isStep3Done ? (sel.disposisiAt || primaryDispatch?.accepted_at || primaryDispatch?.dispatched_at || baseDate) : null);

              const rawTiba =
                sel.waktuTibaTkp ||
                sel.responTibaTkpAt ||
                sel.waktuTiba ||
                primaryDispatch?.arrived_at ||
                primaryDispatch?.arrivedAt ||
                (isStep4Done ? (rawMeluncur || sel.disposisiAt || baseDate) : null);

              const rawSelesai =
                sel.selesaiAt ||
                sel.waktuSelesai ||
                sel.waktuSelesaiDate ||
                primaryDispatch?.completed_at ||
                primaryDispatch?.completedAt ||
                (isStep5Done ? (rawTiba || rawMeluncur || baseDate) : null);

              const formattedLapor = formatIncidentDateTime(baseDate);
              const timeLapor = formatDateTimeWib(baseDate);
              const timeDisposisi = sel.disposisiAt
                ? formatDateTimeWib(sel.disposisiAt, baseDate)
                : (isStep2Done ? timeLapor : null);
              const timeMeluncur = rawMeluncur
                ? formatDateTimeWib(rawMeluncur, baseDate)
                : (isStep3Done ? (timeDisposisi || timeLapor) : null);
              const timeTiba = rawTiba
                ? formatDateTimeWib(rawTiba, baseDate)
                : (isStep4Done ? (timeMeluncur || timeDisposisi || timeLapor) : null);
              const timeSelesai = rawSelesai
                ? formatDateTimeWib(rawSelesai, baseDate)
                : (isStep5Done ? (timeTiba || timeMeluncur || timeLapor) : null);

              // Evidences
              const fotoPelapor = sel.fotoBuktiUrl || sel.fotoTkpUrl;
              const fotoTindakan =
                sel.fotoTindakan ||
                sel.fotoTiba ||
                (sel.evidences || []).find(
                  (e: any) =>
                    e.incident_phase === 'TIBA_TKP' ||
                    e.incident_phase === 'PENANGANAN' ||
                    (e.caption || '').toLowerCase().includes('tindakan') ||
                    (e.caption || '').toLowerCase().includes('tiba')
                )?.file_url;
              const fotoSelesai =
                sel.fotoSelesai ||
                (sel.evidences || []).find(
                  (e: any) =>
                    e.incident_phase === 'SELESAI_KONDUSIF' ||
                    e.incident_phase === 'SELESAI' ||
                    (e.caption || '').toLowerCase().includes('selesai') ||
                    (e.caption || '').toLowerCase().includes('kondusif')
                )?.file_url;

              // Personnel
              const rawDispatches = sel.dispatches || [];
              const personnelRoster: any[] = [];
              const seenKeys = new Set<string>();

              rawDispatches.forEach((d: any) => {
                const off = d.officer;
                const rawName = off?.user?.fullName || off?.user?.nama_lengkap || off?.user?.name || off?.fullName || off?.nama_lengkap || '';
                const rank = off?.rank_pangkat || off?.rankPangkat || '';
                const name = formatOfficerName(rank, rawName);
                const nrp = off?.nrp || off?.user?.identifier || '';
                const unit = d.unit?.unit_name || d.unit?.short_name || '';
                const key = (nrp || name).trim().toLowerCase();
                if (!seenKeys.has(key)) {
                  seenKeys.add(key);
                  let acceptedAt: string | null = null;
                  if (d.accepted_at) {
                    try {
                      acceptedAt = new Date(d.accepted_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
                    } catch (_) {}
                  }
                  const nameParts = name.replace(/^(Bripka|Ipda|Aiptu|Aipda|Briptu|Bripda|AKP|Kompol|AKBP|Kombes|Brigadir)\s+/i, '').trim().split(' ');
                  const initials = ((nameParts[0]?.[0] || 'P') + (nameParts[1]?.[0] || '')).toUpperCase();
                  personnelRoster.push({
                    name,
                    rank,
                    nrp,
                    unit,
                    acceptedAt,
                    avatarUrl: off?.avatar_url || off?.avatarUrl || null,
                    initials,
                    isPrimary: Boolean(d.is_primary_unit || personnelRoster.length === 0),
                  });
                }
              });

              if (personnelRoster.length === 0 && sel.assignedOfficer) {
                const ao = sel.assignedOfficer;
                const rawName = ao.namaLengkap || ao.name || '';
                const rank = ao.rankPangkat || '';
                const name = formatOfficerName(rank, rawName);
                const nrp = ao.nrp || '';
                const nameParts = name.replace(/^(Bripka|Ipda|Aiptu|Aipda|Briptu|Bripda|AKP|Kompol|AKBP|Kombes|Brigadir)\s+/i, '').trim().split(' ');
                const initials = ((nameParts[0]?.[0] || 'P') + (nameParts[1]?.[0] || '')).toUpperCase();
                personnelRoster.push({
                  name,
                  rank,
                  nrp,
                  unit: ao.assignedPatrolVehicle || '',
                  acceptedAt: sel.disposisiAt ? new Date(sel.disposisiAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB' : null,
                  avatarUrl: ao.avatarUrl || null,
                  initials,
                  isPrimary: true,
                });
              }

              return (
                <>
                  {/* DETAIL HEADER */}
                  <div
                    className="sticky top-0 z-20 flex-shrink-0 px-4 sm:px-6 py-3 sm:py-3.5 flex items-center justify-between border-b"
                    style={{
                      background: 'linear-gradient(135deg, rgba(236, 196, 115, 0.15) 0%, rgba(184, 130, 42, 0.08) 100%)',
                      borderColor: 'rgba(236, 196, 115, 0.25)',
                      backdropFilter: 'blur(12px)',
                    }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <button
                        type="button"
                        onClick={() => setSelectedLogComplaint(null)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-amber-400/20 text-slate-300 hover:text-amber-300 border border-white/10 hover:border-amber-400/30 text-xs font-bold transition-all flex-shrink-0"
                      >
                        <ArrowLeft size={14} />
                        <span className="hidden sm:inline">Kembali</span>
                      </button>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-xs sm:text-sm font-black text-amber-300 font-mono">
                            #{sel.nomorTiket?.replace(/^#+/, '')}
                          </h3>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${statusMeta.badgeClass}`}>
                            {statusMeta.label}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {sel.jenisKejadian}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedLogComplaint(null);
                        setActiveModal(null);
                      }}
                      className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors flex-shrink-0 ml-2"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* DETAIL SCROLLABLE BODY */}
                  <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
                    {/* Incident Meta Card */}
                    <div
                      className="p-4 rounded-2xl border space-y-3"
                      style={{
                        background: 'rgba(255, 255, 255, 0.02)',
                        borderColor: 'rgba(236, 196, 115, 0.25)',
                      }}
                    >
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Nomor Laporan
                          </div>
                          <div className="text-base font-black font-mono text-amber-300">
                            #{sel.nomorTiket?.replace(/^#+/, '')}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Waktu Lapor
                          </div>
                          <div className="text-xs font-bold text-white">
                            {formattedLapor.full}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-white/5">
                        <div>
                          <span className="text-[11px] text-slate-400">Jenis Insiden:</span>
                          <div className="text-xs font-bold text-white mt-0.5">{sel.jenisKejadian}</div>
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-400">Tingkat Urgensi:</span>
                          <div className="mt-0.5">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                (sel.urgensi || '').toUpperCase() === 'DARURAT' || (sel.urgensi || '').toUpperCase() === 'TINGGI'
                                  ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              }`}
                            >
                              {sel.urgensi || 'NORMAL'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <span className="text-[11px] text-slate-400">Lokasi TKP:</span>
                        <div className="text-xs text-slate-200 mt-0.5 flex items-start gap-1.5">
                          <MapPin size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
                          <span>{sel.tkpAlamatTeks || 'TKP Patroli Wilayah'}</span>
                        </div>
                      </div>

                      {/* Identitas Pelapor */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-white/5">
                        <div>
                          <span className="text-[11px] text-slate-400">Pelapor:</span>
                          <div className="text-xs font-bold text-white mt-0.5">
                            {sel.pelaporNama || 'Warga Masyarakat (110)'}
                          </div>
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-400">Kontak:</span>
                          <div className="text-xs font-mono font-bold text-amber-300 mt-0.5 flex items-center gap-1.5">
                            {(() => {
                              const rawPh = sel.pelaporTelepon || sel.pelaporHp || sel.pelapor_hp;
                              const formattedPh = formatPhoneNumber(rawPh);
                              const callPh = getCleanCallNumber(rawPh);
                              if (!formattedPh) return <span>-</span>;
                              return (
                                <a
                                  href={`tel:${callPh}`}
                                  className="hover:underline flex items-center gap-1.5 text-amber-300"
                                  title="Hubungi Pelapor"
                                >
                                  <Phone size={12} />
                                  <span>{formattedPh}</span>
                                </a>
                              );
                            })()}
                          </div>
                        </div>
                      </div>

                      {/* Foto Bukti Pelapor */}
                      {fotoPelapor ? (
                        <div
                          onClick={() =>
                            setLightboxData({
                              url: fotoPelapor,
                              title: `Bukti Kasus #${sel.nomorTiket?.replace(/^#+/, '')}`,
                              meta: `TKP: ${sel.tkpAlamatTeks || '-'}`,
                              desc: sel.ringkasanKeterangan || sel.deskripsiKejadian,
                            })
                          }
                          className="relative rounded-xl overflow-hidden border border-white/10 hover:border-amber-400/50 cursor-pointer group transition-all"
                          style={{ maxHeight: '160px' }}
                        >
                          <img
                            src={fotoPelapor}
                            alt="Foto Bukti Pelapor"
                            className="w-full h-36 object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end justify-between p-2.5">
                            <span className="text-[10px] font-bold text-white flex items-center gap-1.5">
                              <Camera size={12} className="text-amber-400" />
                              Foto Bukti Laporan Warga
                            </span>
                            <span className="text-[10px] font-bold text-amber-300 bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-sm border border-amber-400/30">
                              🔍 Perbesar
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-slate-400 text-xs flex items-center gap-2">
                          <Camera size={13} className="text-slate-500" />
                          <span>Tanpa lampiran foto bukti dari pelapor</span>
                        </div>
                      )}

                      {/* Keterangan Pelapor */}
                      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-slate-300 italic leading-relaxed">
                        &quot;{sel.ringkasanKeterangan || sel.deskripsiKejadian || sel.jenisKejadian}&quot;
                      </div>
                    </div>

                    {/* 5-MILESTONE TACTICAL TIMELINE */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between pb-3 border-b border-white/10">
                        <div>
                          <h4 className="text-xs sm:text-sm font-black text-amber-300 uppercase tracking-wider flex items-center gap-2">
                            <span>⏱️ SOP Presisi Timeline Penanganan</span>
                          </h4>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            5 Tahapan audit trail penanganan taktis kepolisian 110
                          </p>
                        </div>
                      </div>

                      {/* Step 1: Laporan Diterima */}
                      <div className="relative flex gap-3 sm:gap-4 pb-6 pt-4">
                        <div
                          className="absolute left-[15px] sm:left-[17px] top-10 bottom-0 w-[2px]"
                          style={{
                            background: isStep2Done ? 'linear-gradient(to bottom, #ECC473 0%, rgba(236,196,115,0.4) 100%)' : 'rgba(255,255,255,0.08)',
                          }}
                        />
                        <div
                          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 z-10"
                          style={{
                            background: 'linear-gradient(135deg, #ECC473 0%, #D4A346 100%)',
                            color: '#0B0D13',
                            boxShadow: '0 0 12px rgba(236, 196, 115, 0.4)',
                          }}
                        >
                          ✓
                        </div>
                        <div className="flex-1 min-w-0 bg-white/[0.02] border border-white/5 rounded-2xl p-3.5 sm:p-4 space-y-1.5">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="text-xs sm:text-sm font-black text-white">
                              1. Laporan Masuk &amp; Disposisi (CAD 110)
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                ✓ SELESAI
                              </span>
                              <span className="text-[11px] font-mono text-slate-400 font-bold">
                                {timeLapor}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            Laporan diverifikasi oleh operator Command Center 110 dan diteruskan ke SPKT komando wilayah untuk disposisi taktis.
                          </p>
                        </div>
                      </div>

                      {/* Step 2: Disposisi Personel */}
                      <div className="relative flex gap-3 sm:gap-4 pb-6">
                        <div
                          className="absolute left-[15px] sm:left-[17px] top-8 bottom-0 w-[2px]"
                          style={{
                            background: isStep3Done ? 'linear-gradient(to bottom, #ECC473 0%, rgba(236,196,115,0.4) 100%)' : 'rgba(255,255,255,0.08)',
                          }}
                        />
                        <div
                          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 z-10"
                          style={
                            isStep2Done
                              ? {
                                  background: 'linear-gradient(135deg, #ECC473 0%, #D4A346 100%)',
                                  color: '#0B0D13',
                                  boxShadow: '0 0 12px rgba(236, 196, 115, 0.4)',
                                }
                              : {
                                  background: 'rgba(255,255,255,0.05)',
                                  border: '1px solid rgba(255,255,255,0.1)',
                                  color: '#64748B',
                                }
                          }
                        >
                          {isStep2Done ? '✓' : '2'}
                        </div>
                        <div className="flex-1 min-w-0 bg-white/[0.02] border border-white/5 rounded-2xl p-3.5 sm:p-4 space-y-2">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="text-xs sm:text-sm font-black text-white">
                              2. Penerimaan Tugas &amp; Konfirmasi Petugas
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  isStep2Done
                                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                    : 'bg-white/5 text-slate-400 border border-white/10'
                                }`}
                              >
                                {isStep2Done ? '✓ SELESAI' : '🔒 MENUNGGU'}
                              </span>
                              {timeDisposisi && timeDisposisi !== '-' && (
                                <span className="text-[11px] font-mono text-slate-400 font-bold">
                                  {timeDisposisi}
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            {sel.assignedOfficer
                              ? `Tugas penanganan telah diserahkan kepada ${formatOfficerName(sel.assignedOfficer.rankPangkat, sel.assignedOfficer.namaLengkap || sel.assignedOfficer.name)} (${sel.assignedOfficer.assignedPatrolVehicle || 'Unit Presisi'}).`
                              : 'Penugasan personel dan armada reaksi cepat oleh Pawas komando wilayah.'}
                          </p>
                          {sel.arahanPawas && (
                            <div className="p-2.5 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-200 text-xs">
                              <strong className="text-amber-300">👑 Arahan Pawas:</strong> &quot;{sel.arahanPawas}&quot;
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Step 3: Pergerakan Menuju TKP */}
                      <div className="relative flex gap-3 sm:gap-4 pb-6">
                        <div
                          className="absolute left-[15px] sm:left-[17px] top-8 bottom-0 w-[2px]"
                          style={{
                            background: isStep4Done ? 'linear-gradient(to bottom, #ECC473 0%, rgba(236,196,115,0.4) 100%)' : 'rgba(255,255,255,0.08)',
                          }}
                        />
                        <div
                          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 z-10"
                          style={
                            isStep3Done
                              ? {
                                  background: 'linear-gradient(135deg, #ECC473 0%, #D4A346 100%)',
                                  color: '#0B0D13',
                                  boxShadow: '0 0 12px rgba(236, 196, 115, 0.4)',
                                }
                              : isStep3Active
                              ? {
                                  background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                                  color: '#FFFFFF',
                                  boxShadow: '0 0 16px rgba(59, 130, 246, 0.8)',
                                }
                              : {
                                  background: 'rgba(255,255,255,0.05)',
                                  border: '1px solid rgba(255,255,255,0.1)',
                                  color: '#64748B',
                                }
                          }
                        >
                          {isStep3Done ? '✓' : isStep3Active ? '🚔' : null}
                        </div>
                        <div className="flex-1 min-w-0 bg-white/[0.02] border border-white/5 rounded-2xl p-3.5 sm:p-4 space-y-2.5">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="text-xs sm:text-sm font-black text-white">
                              3. Pergerakan Menuju Lokasi (Meluncur)
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  isStep3Done
                                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                    : isStep3Active
                                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 animate-pulse'
                                    : 'bg-white/5 text-slate-400 border border-white/10'
                                }`}
                              >
                                {isStep3Done ? '✓ SELESAI' : isStep3Active ? '● SEDANG BERLANGSUNG' : '🔒 TERKUNCI'}
                              </span>
                              {timeMeluncur && timeMeluncur !== '-' && (
                                <span className="text-[11px] font-mono text-slate-400 font-bold">
                                  {timeMeluncur}
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            Unit reaksi cepat meluncur ke koordinat kejadian dengan sirine dan rotator aktif. Koordinat GPS terkunci di sistem komando.
                          </p>

                          {/* GPS & Navigation Banner */}
                          <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/30 flex items-center justify-between gap-3 flex-wrap">
                            <div className="space-y-0.5">
                              <div className="text-[10px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                                <MapPin size={12} />
                                <span>Titik Sasaran Koordinat TKP:</span>
                              </div>
                              <div className="text-xs font-mono font-bold text-white">
                                {sel.tkpLat || sel.tkpLatitude ? Number(sel.tkpLat || sel.tkpLatitude).toFixed(5) : '-6.2088'},{' '}
                                {sel.tkpLng || sel.tkpLongitude ? Number(sel.tkpLng || sel.tkpLongitude).toFixed(5) : '106.8456'}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setActiveModal(null);
                                onTabChange?.('peta');
                              }}
                              className="px-3 py-1.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/40 text-blue-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95"
                            >
                              <Navigation size={13} />
                              <span>Buka Peta Navigasi ↗</span>
                            </button>
                          </div>

                          {/* Personnel Roster */}
                          {personnelRoster.length > 0 && (
                            <div className="mt-3 space-y-2 pt-2 border-t border-white/5">
                              <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                                Personel Bertugas ({personnelRoster.length})
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {personnelRoster.map((p, idx) => (
                                  <div
                                    key={idx}
                                    className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-2.5"
                                  >
                                    {p.avatarUrl ? (
                                      <img
                                        src={p.avatarUrl}
                                        alt={p.name}
                                        className="w-8 h-8 rounded-full object-cover border border-amber-400/30"
                                      />
                                    ) : (
                                      <div className="w-8 h-8 rounded-full bg-amber-400/20 border border-amber-400/30 text-amber-300 font-bold text-xs flex items-center justify-center">
                                        {p.initials || 'PO'}
                                      </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                      <div className="text-xs font-bold text-white truncate">{p.name}</div>
                                      <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                                        <span>NRP: {p.nrp || '-'}</span>
                                        {p.unit && <span>• {p.unit}</span>}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Step 4: Tiba di TKP & Penanganan */}
                      <div className="relative flex gap-3 sm:gap-4 pb-6">
                        <div
                          className="absolute left-[15px] sm:left-[17px] top-8 bottom-0 w-[2px]"
                          style={{
                            background: isStep5Done ? 'linear-gradient(to bottom, #ECC473 0%, rgba(236,196,115,0.4) 100%)' : 'rgba(255,255,255,0.08)',
                          }}
                        />
                        <div
                          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 z-10"
                          style={
                            isStep4Done
                              ? {
                                  background: 'linear-gradient(135deg, #ECC473 0%, #D4A346 100%)',
                                  color: '#0B0D13',
                                  boxShadow: '0 0 12px rgba(236, 196, 115, 0.4)',
                                }
                              : isStep4Active
                              ? {
                                  background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                                  color: '#FFFFFF',
                                  boxShadow: '0 0 16px rgba(59, 130, 246, 0.8)',
                                }
                              : {
                                  background: 'rgba(255,255,255,0.05)',
                                  border: '1px solid rgba(255,255,255,0.1)',
                                  color: '#64748B',
                                }
                          }
                        >
                          {isStep4Done ? '✓' : isStep4Active ? '📍' : '4'}
                        </div>
                        <div className="flex-1 min-w-0 bg-white/[0.02] border border-white/5 rounded-2xl p-3.5 sm:p-4 space-y-2.5">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="text-xs sm:text-sm font-black text-white">
                              4. Tiba di Lokasi &amp; Tindakan TKP
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  isStep4Done
                                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                    : isStep4Active
                                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 animate-pulse'
                                    : 'bg-white/5 text-slate-400 border border-white/10'
                                }`}
                              >
                                {isStep4Done ? '✓ SELESAI' : isStep4Active ? '● SEDANG BERLANGSUNG' : '🔒 TERKUNCI'}
                              </span>
                              {timeTiba && timeTiba !== '-' && (
                                <span className="text-[11px] font-mono text-slate-400 font-bold">
                                  {timeTiba}
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            Petugas tiba di lokasi kejadian perkara, melakukan pengamanan area, interogasi awal, dan tindakan diskresi kepolisian.
                          </p>

                          {/* Foto Tindakan TKP */}
                          {fotoTindakan && (
                            <div
                              onClick={() =>
                                setLightboxData({
                                  url: fotoTindakan,
                                  title: `Dokumentasi Tindakan TKP #${sel.nomorTiket?.replace(/^#+/, '')}`,
                                  meta: `Waktu Tiba: ${timeTiba || '-'}`,
                                  desc: sel.catatanTindakan || 'Dokumentasi penanganan di lokasi kejadian',
                                })
                              }
                              className="relative rounded-xl overflow-hidden border border-white/10 hover:border-amber-400/50 cursor-pointer group transition-all"
                              style={{ maxHeight: '140px' }}
                            >
                              <img
                                src={fotoTindakan}
                                alt="Foto Tindakan TKP"
                                className="w-full h-32 object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end justify-between p-2.5">
                                <span className="text-[10px] font-bold text-white flex items-center gap-1.5">
                                  <Camera size={12} className="text-amber-400" />
                                  Foto Tindakan TKP
                                </span>
                                <span className="text-[10px] font-bold text-amber-300 bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-sm border border-amber-400/30">
                                  🔍 Perbesar
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Catatan Tindakan / Berita Acara */}
                          {sel.catatanTindakan && (
                            <div className="p-3 rounded-xl bg-amber-400/[0.07] border border-amber-400/20 text-slate-200 text-xs space-y-1">
                              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                                📝 Berita Acara Tindakan Lapangan:
                              </div>
                              <div className="italic text-slate-300">
                                &quot;{sel.catatanTindakan.replace(/^Catatan:\s*/i, '').trim()}&quot;
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Step 5: Penyelesaian Perkara & Pengesahan Pawas */}
                      <div className="relative flex gap-3 sm:gap-4">
                        <div
                          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 z-10"
                          style={
                            isStep5Done
                              ? {
                                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                                  color: '#FFFFFF',
                                  boxShadow: '0 0 14px rgba(16, 185, 129, 0.5)',
                                }
                              : isStep5Active
                              ? {
                                  background: 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)',
                                  color: '#FFFFFF',
                                  boxShadow: '0 0 16px rgba(168, 85, 247, 0.8)',
                                }
                              : {
                                  background: 'rgba(255,255,255,0.05)',
                                  border: '1px solid rgba(255,255,255,0.1)',
                                  color: '#64748B',
                                }
                          }
                        >
                          {isStep5Done ? '✓' : isStep5Active ? '⚖️' : '5'}
                        </div>
                        <div className="flex-1 min-w-0 bg-white/[0.02] border border-white/5 rounded-2xl p-3.5 sm:p-4 space-y-2.5">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="text-xs sm:text-sm font-black text-white">
                              5. Kasus Selesai Ditangani &amp; Pengesahan
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  isStep5Done
                                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                    : isStep5Active
                                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 animate-pulse'
                                    : 'bg-white/5 text-slate-400 border border-white/10'
                                }`}
                              >
                                {isStep5Done ? '✓ SELESAI' : '🔒 TERKUNCI'}
                              </span>
                              {timeSelesai && timeSelesai !== '-' && (
                                <span className="text-[11px] font-mono text-slate-400 font-bold">
                                  {timeSelesai}
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            {isStep5Done
                              ? 'Penanganan perkara di lapangan telah selesai secara kondusif dan divalidasi oleh Perwira Pengawas (Pawas).'
                              : isStep5Active
                              ? 'Laporan hasil penanganan dan berita acara telah diserahkan, menunggu pengesahan resmi oleh Pawas.'
                              : 'Menunggu proses penanganan lapangan dirampungkan oleh personel bertugas.'}
                          </p>

                          {/* Foto Selesai / Kondusif */}
                          {fotoSelesai && (
                            <div
                              onClick={() =>
                                setLightboxData({
                                  url: fotoSelesai,
                                  title: `Dokumentasi Penuntasan Kasus #${sel.nomorTiket?.replace(/^#+/, '')}`,
                                  meta: `Selesai: ${timeSelesai || '-'}`,
                                  desc: sel.pengesahanPawas || 'Situasi akhir TKP kondusif',
                                })
                              }
                              className="relative rounded-xl overflow-hidden border border-white/10 hover:border-emerald-400/50 cursor-pointer group transition-all"
                              style={{ maxHeight: '140px' }}
                            >
                              <img
                                src={fotoSelesai}
                                alt="Foto Penuntasan Kasus"
                                className="w-full h-32 object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end justify-between p-2.5">
                                <span className="text-[10px] font-bold text-white flex items-center gap-1.5">
                                  <CheckCircle2 size={12} className="text-emerald-400" />
                                  Dokumentasi Hasil Penanganan
                                </span>
                                <span className="text-[10px] font-bold text-emerald-300 bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-sm border border-emerald-400/30">
                                  🔍 Perbesar
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Pengesahan Pawas */}
                          {sel.pengesahanPawas && (
                            <div className="p-3 rounded-xl bg-purple-500/[0.08] border border-purple-500/20 text-slate-200 text-xs space-y-1">
                              <div className="text-[10px] font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                                <ShieldCheck size={13} />
                                <span>Pengesahan &amp; Catatan Pawas:</span>
                              </div>
                              <div className="italic text-slate-300">
                                &quot;{sel.pengesahanPawas}&quot;
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* DETAIL FOOTER */}
                  <div
                    className="sticky bottom-0 z-20 flex-shrink-0 px-4 sm:px-6 py-3 sm:py-3.5 border-t flex items-center justify-end"
                    style={{
                      background: 'rgba(15, 18, 26, 0.95)',
                      backdropFilter: 'blur(10px)',
                      borderColor: 'rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedLogComplaint(null);
                        setActiveModal(null);
                      }}
                      className="px-5 py-2 rounded-xl text-xs font-bold text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                    >
                      Tutup
                    </button>
                  </div>
                </>
              );
            })() : (
              <>
                {/* Modal Header */}
                <div
                  className="sticky top-0 z-20 flex-shrink-0 px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between border-b"
                  style={{
                    background: 'linear-gradient(135deg, rgba(236, 196, 115, 0.15) 0%, rgba(184, 130, 42, 0.08) 100%)',
                    borderColor: 'rgba(236, 196, 115, 0.25)',
                    backdropFilter: 'blur(12px)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-amber-400 flex-shrink-0"
                      style={{
                        background: 'linear-gradient(135deg, #ECC473 0%, #D4A346 100%)',
                        color: '#0B0D13',
                        boxShadow: '0 0 16px rgba(236, 196, 115, 0.35)',
                      }}
                    >
                      <FileText size={20} className="stroke-[2.5]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm sm:text-base font-black text-white leading-tight">
                          Riwayat Log Lengkap
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-amber-400/20 text-amber-300 border border-amber-400/30">
                          {filteredComplaints.length} Laporan
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Rekam jejak seluruh penanganan laporan &amp; tugas kedinasan
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLogComplaint(null);
                      setActiveModal(null);
                    }}
                    className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors flex-shrink-0"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Filter and Search Bar */}
                <div className="p-4 sm:p-5 border-b border-white/10 space-y-3 flex-shrink-0">
                  <div className="relative">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={logSearch}
                      onChange={(e) => setLogSearch(e.target.value)}
                      placeholder="Cari nomor tiket, jenis kasus, alamat TKP..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 text-xs sm:text-sm font-medium"
                    />
                  </div>

                  {/* Filter Tabs with Dynamic Count Badges */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {(
                      [
                        { id: 'semua', label: 'Semua', count: countSemua },
                        { id: 'menunggu', label: 'Menunggu', count: countMenunggu },
                        { id: 'diproses', label: 'Diproses', count: countDiproses },
                        { id: 'selesai', label: 'Selesai', count: countSelesai },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setLogFilter(opt.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                          logFilter === opt.id
                            ? 'bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-400/20'
                            : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5'
                        }`}
                      >
                        <span>{opt.label}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-black ${
                            logFilter === opt.id
                              ? 'bg-slate-950/20 text-slate-950'
                              : 'bg-white/10 text-slate-300'
                          }`}
                        >
                          {opt.count}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Scrollable Log List */}
                <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-2.5">
                  {filteredComplaints.length === 0 ? (
                    <div className="py-12 text-center text-slate-500 text-xs">
                      Tidak ada catatan laporan yang sesuai dengan filter pencarian.
                    </div>
                  ) : (
                    filteredComplaints.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => setSelectedLogComplaint(c)}
                        className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-amber-400/50 hover:bg-white/[0.06] transition-all cursor-pointer flex items-center justify-between gap-3 group"
                      >
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-mono font-bold text-amber-300">
                              #{c.nomorTiket?.replace(/^#+/, '')}
                            </span>
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                c.status === 'SELESAI'
                                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                  : c.status === 'MENUNGGU_PENGESAHAN'
                                  ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                                  : c.status === 'DIPROSES'
                                  ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                                  : c.status === 'DITOLAK'
                                  ? 'bg-red-500/15 text-red-300 border border-red-500/30'
                                  : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                              }`}
                            >
                              {c.status}
                            </span>
                          </div>
                          <div className="text-xs font-bold text-white truncate">
                            {c.jenisKejadian}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">
                            📍 {c.tkpAlamatTeks || 'TKP Patroli Wilayah'}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="text-[10px] text-slate-400 font-mono whitespace-nowrap text-right">
                            {c.createdAt
                              ? new Date(c.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'
                              : 'Hari ini'}
                          </div>
                          <div className="w-7 h-7 rounded-lg bg-white/5 group-hover:bg-amber-400/20 text-slate-400 group-hover:text-amber-300 flex items-center justify-center transition-colors">
                            <ChevronRight size={15} />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Modal Footer */}
                <div
                  className="sticky bottom-0 z-20 flex-shrink-0 px-4 sm:px-6 py-3 sm:py-3.5 border-t flex items-center justify-end gap-3"
                  style={{
                    background: 'rgba(15, 18, 26, 0.95)',
                    backdropFilter: 'blur(10px)',
                    borderColor: 'rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLogComplaint(null);
                      setActiveModal(null);
                    }}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                  >
                    Tutup
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* LIGHTBOX PREVIEW BUKTI FOTO                               */}
      {/* ======================================================== */}
      {lightboxData && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setLightboxData(null)}
        >
          <div
            className="relative max-w-2xl w-full rounded-2xl p-4 sm:p-5 shadow-2xl border flex flex-col overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, #181C26 0%, #0E1118 100%)',
              borderColor: 'rgba(236, 196, 115, 0.4)',
              boxShadow: '0 25px 60px -10px rgba(0,0,0,0.95), 0 0 30px rgba(236,196,115,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10 flex-shrink-0">
              <div>
                <h4 className="text-sm font-bold text-white">{lightboxData.title}</h4>
                {lightboxData.meta && (
                  <p className="text-xs text-amber-300 font-mono mt-0.5">{lightboxData.meta}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setLightboxData(null)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="rounded-xl overflow-hidden bg-black/50 max-h-[60vh] flex items-center justify-center border border-white/5">
              <img
                src={lightboxData.url}
                alt={lightboxData.title}
                className="max-w-full max-h-[60vh] object-contain"
              />
            </div>
            {lightboxData.desc && (
              <p className="text-xs text-slate-300 mt-3 italic bg-white/5 p-3 rounded-xl border border-white/5">
                &quot;{lightboxData.desc}&quot;
              </p>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 5: KONFIRMASI LOGOUT TAKTIS                         */}
      {/* ======================================================== */}
      {activeModal === 'logout' && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-sm rounded-3xl p-6 flex flex-col items-center text-center overflow-hidden shadow-2xl border"
            style={{
              background: 'linear-gradient(180deg, #181C26 0%, #0E1118 100%)',
              borderColor: 'rgba(239, 68, 68, 0.45)',
              boxShadow: '0 25px 60px -10px rgba(0, 0, 0, 0.95), 0 0 30px rgba(239, 68, 68, 0.2)',
            }}
          >
            {/* Red Warning/Logout Icon with glowing badge */}
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-red-400 mb-4"
              style={{
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(185, 28, 28, 0.1) 100%)',
                border: '1.5px solid rgba(239, 68, 68, 0.4)',
                boxShadow: '0 0 20px rgba(239, 68, 68, 0.25)',
              }}
            >
              <LogOut size={26} className="stroke-[2.2]" />
            </div>

            <h3 className="text-base sm:text-lg font-black text-white">
              Konfirmasi Selesai Dinas
            </h3>

            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Apakah Anda yakin ingin mengakhiri sesi dinas dan keluar dari sistem <span className="font-bold text-amber-300">SIMOPMAS 110</span>?
            </p>

            <div className="w-full flex items-center gap-3 mt-6">
              <button
                type="button"
                disabled={isLoggingOut}
                onClick={() => setActiveModal(null)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors disabled:opacity-50"
              >
                Batal
              </button>

              <button
                type="button"
                disabled={isLoggingOut}
                onClick={handleConfirmLogout}
                className="flex-1 py-2.5 rounded-xl text-xs font-black text-white transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)',
                  boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)',
                }}
              >
                {isLoggingOut ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Keluar...</span>
                  </>
                ) : (
                  'Ya, Logout'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
