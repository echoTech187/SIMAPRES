'use client';

import React, { useState, useEffect } from 'react';
import { getOfficerTodayPiketScheduleAction } from '@/app/actions/piket.actions';
import type { OfficerTodayPiketSchedule } from '@/types/piket.types';
import {
  Shield,
  AlertTriangle,
  MapPin,
  Clock,
  Navigation,
  MessageSquare,
  ChevronRight,
  TrendingUp,
  UserPlus,
  Car,
  Users,
  ChevronDown,
} from 'lucide-react';
import ModalTambahRekanRegu from '../components/ModalTambahRekanRegu';
import ModalKlaimBbm from '../components/ModalKlaimBbm';
import { toast } from '@/components/ui/Toast';
import { getTaskQuotaInfo, hasOfficerAcceptedTask, getOfficerInitials } from '../types';
import type { ComplaintData, OfficerProfile, PersonilTab } from '../types';

interface TabBerandaPersonilProps {
  officer: OfficerProfile;
  complaints: ComplaintData[];
  activeComplaint: ComplaintData | null;
  pendingAcceptTask: ComplaintData | null;
  currentGps: { lat: number; lng: number };
  fleetUnits: any[];
  hotspots: any[];
  policeOffices: any[];
  logbooks: any[];
  onTabChange: (tab: PersonilTab) => void;
  onOpenAcceptModal: (task: ComplaintData) => void;
  onOpenChat: (complaint: ComplaintData) => void;
  onQuickAction: (type: 'PATROLI' | 'TPTKP' | 'SAMBANG' | 'PENGAMANAN') => void;
  onOpenGiatMap?: (giat: any) => void;
}

export default function TabBerandaPersonil({
  officer,
  complaints,
  activeComplaint,
  pendingAcceptTask,
  currentGps,
  fleetUnits,
  hotspots,
  policeOffices,
  logbooks,
  onTabChange,
  onOpenAcceptModal,
  onOpenChat,
  onQuickAction,
  onOpenGiatMap,
}: TabBerandaPersonilProps) {
  // 1. Giat Mandiri Lapangan (Logbook Non-Tiket)
  const patroliCount = logbooks.filter((l) => (l.jenisAksi || l.action_type || '').toUpperCase() === 'PATROLI').length;
  const sambangCount = logbooks.filter((l) => (l.jenisAksi || l.action_type || '').toUpperCase() === 'SAMBANG').length;
  const pengamananCount = logbooks.filter((l) => (l.jenisAksi || l.action_type || '').toUpperCase() === 'PENGAMANAN').length;

  // 2. Giat Penugasan Respon TKP (TPTKP):
  // Menghitung total tiket unik yang ditangani petugas (Tiket Selesai + Sedang Dikerjakan)
  const myComplaints = complaints.filter((c) => {
    const isAccepted = hasOfficerAcceptedTask(c, officer.nrp, officer.id);
    const dispatches = Array.isArray(c.dispatches) ? c.dispatches : [];
    const isOfficerInDispatch = dispatches.some(
      (d: any) =>
        (officer.id && String(d.officer_id) === String(officer.id)) ||
        d.officer?.nrp === officer.nrp ||
        d.crew_leader_nrp === officer.nrp ||
        d.crew_partner_nrp === officer.nrp
    );
    const hasLogbookForComplaint = logbooks.some(
      (l) => String(l.complaintId || l.complaint_id || '') === String(c.id)
    );
    return isAccepted || isOfficerInDispatch || hasLogbookForComplaint;
  });

  const tiketSelesaiCount = myComplaints.filter((c) => c.status === 'SELESAI').length;
  const tiketProsesCount = myComplaints.filter(
    (c) => c.status === 'DIPROSES' || c.status === 'MENUNGGU_PENGESAHAN'
  ).length;

  // Tiket unik dari logbooks jika ada tiket yang tidak terdaftar di array complaints
  const logbookComplaintIds = new Set(
    logbooks
      .filter((l) => (l.jenisAksi || l.action_type || '').toUpperCase() === 'TPTKP' && (l.complaintId || l.complaint_id))
      .map((l) => String(l.complaintId || l.complaint_id))
  );

  let extraLogbookTickets = 0;
  logbookComplaintIds.forEach((cId) => {
    if (!myComplaints.some((c) => String(c.id) === cId)) {
      extraLogbookTickets++;
    }
  });

  const manualTptkpCount = logbooks.filter(
    (l) =>
      (l.jenisAksi || l.action_type || '').toUpperCase() === 'TPTKP' &&
      !l.complaintId &&
      !l.complaint_id
  ).length;

  const totalTptkpCount = tiketSelesaiCount + tiketProsesCount + extraLogbookTickets + manualTptkpCount;

  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [showKlaimBbmModal, setShowKlaimBbmModal] = useState(false);
  const [partnerName, setPartnerName] = useState<string | null>(() => {
    if (!activeComplaint) return null;
    const dispatches = Array.isArray((activeComplaint as any).dispatches) ? (activeComplaint as any).dispatches : [];
    const match = dispatches.find((d: any) => d.crew_partner_name);
    return match ? match.crew_partner_name : null;
  });

  // Sinkronisasi partnerName saat activeComplaint atau disposisi diperbarui
  useEffect(() => {
    if (!activeComplaint) {
      setPartnerName(null);
      return;
    }
    const dispatches = Array.isArray((activeComplaint as any).dispatches) ? (activeComplaint as any).dispatches : [];
    const match = dispatches.find((d: any) => d.crew_partner_name);
    if (match && match.crew_partner_name !== partnerName) {
      setPartnerName(match.crew_partner_name);
    }
  }, [activeComplaint?.id, (activeComplaint as any)?.dispatches]);

  // Data Jadwal Piket Riil Personil (Anti-Hardcode)
  const [piketSchedule, setPiketSchedule] = useState<OfficerTodayPiketSchedule | null>(null);

  // State untuk expand roster personel per giat
  const [expandedCrewGiatId, setExpandedCrewGiatId] = useState<string | null>(null);

  useEffect(() => {
    const officerKey = officer?.id || officer?.nrp;
    if (!officerKey) return;
    let active = true;
    getOfficerTodayPiketScheduleAction(officerKey)
      .then((res) => {
        if (!active) return;
        if (res.success && res.data) {
          setPiketSchedule(res.data);
        }
      })
      .catch((err) => console.warn('Gagal memuat jadwal piket personil:', err));

    return () => {
      active = false;
    };
  }, [officer?.id, officer?.nrp]);

  const pendingQuota = pendingAcceptTask ? getTaskQuotaInfo(pendingAcceptTask, officer.unit_id) : null;

  // Helper parsing rincian pengajuan giat dari deskripsiKegiatan
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

    return { route, time, vehicle, partners, plan: plan || desc, pawasNote };
  };

  // Helper parsing seluruh personil giat (Pengaju + Rekan Regu) untuk Stacked Avatar
  interface CrewMember {
    id: string;
    name: string;
    nrp?: string;
    satuan?: string;
    role: 'PENGAJU' | 'REKAN';
    roleLabel: string;
    initials: string;
    avatarUrl?: string | null;
    bgGradient: string;
    borderColor: string;
    textColor: string;
  }

  const parseCrewList = (
    giat: any,
    officerProp: OfficerProfile,
    parsedPartners?: string
  ): CrewMember[] => {
    // 1. Personel Pengaju (Submitter / Penanggung Jawab Giat)
    const submitterRawName =
      giat.officer?.user?.full_name ||
      giat.officer?.user?.nama_lengkap ||
      giat.officer?.fullName ||
      giat.officerNama ||
      officerProp?.fullName ||
      'Petugas Lapangan';

    const submitterRank =
      giat.officer?.rank_pangkat ||
      giat.officer?.pangkat ||
      officerProp?.pangkat ||
      '';

    const submitterNrp =
      giat.officer?.nrp ||
      giat.officer?.user?.identifier ||
      officerProp?.nrp ||
      '';

    const submitterSatuan =
      giat.officer?.unit?.unit_name ||
      giat.officer?.satuan ||
      officerProp?.satuan ||
      'Satuan Samapta Presisi';

    const submitterAvatar =
      giat.officer?.user?.avatar_url ||
      officerProp?.avatar ||
      null;

    const hasRankInSubmitter =
      submitterRank &&
      submitterRawName.toLowerCase().startsWith(submitterRank.toLowerCase());
    const submitterFullName =
      !hasRankInSubmitter && submitterRank
        ? `${submitterRank} ${submitterRawName}`
        : submitterRawName;

    const submitter: CrewMember = {
      id: `submitter-${giat.id || 'current'}`,
      name: submitterFullName,
      nrp: submitterNrp,
      satuan: submitterSatuan,
      role: 'PENGAJU',
      roleLabel: 'Pengaju / PJ Giat',
      initials: getOfficerInitials(submitterFullName),
      avatarUrl: submitterAvatar,
      bgGradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
      borderColor: '#F59E0B',
      textColor: '#0B0D12',
    };

    const crew: CrewMember[] = [submitter];

    // 2. Rekan Regu dari parsed.partners
    const rawPartners = (parsedPartners || '').trim();
    const isSolo =
      !rawPartners ||
      rawPartners === '-' ||
      rawPartners.toLowerCase().includes('mandiri') ||
      rawPartners.toLowerCase().includes('tanpa rekan');

    if (!isSolo) {
      const partnerList = rawPartners.includes('|')
        ? rawPartners.split('|').map((s: string) => s.trim()).filter(Boolean)
        : rawPartners
            .split(/,\s*(?!(?:S\.H\.|S\.I\.K\.|S\.E\.|S\.Sos\.|S\.Kom\.|M\.Si\.|M\.H\.|M\.M\.|dr\.|drg\.|S\.T\.|S\.Pd\.|S\.IP|M\.Tr\.Opsla))/i)
            .map((s: string) => s.trim())
            .filter(Boolean);

      const partnerThemes = [
        { bg: 'linear-gradient(135deg, #38BDF8 0%, #0284C7 100%)', text: '#FFFFFF', border: '#38BDF8' }, // Sky Blue
        { bg: 'linear-gradient(135deg, #34D399 0%, #059669 100%)', text: '#FFFFFF', border: '#34D399' }, // Emerald
        { bg: 'linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%)', text: '#FFFFFF', border: '#A78BFA' }, // Purple
        { bg: 'linear-gradient(135deg, #FB7185 0%, #E11D48 100%)', text: '#FFFFFF', border: '#FB7185' }, // Rose
      ];

      partnerList.forEach((pStr: string, idx: number) => {
        const nrpMatch = pStr.match(/\(NRP\s*[:\.]?\s*([0-9a-zA-Z]+)\)/i);
        const nrp = nrpMatch ? nrpMatch[1].trim() : '';
        const cleanName = pStr.replace(/\(NRP\s*[:\.]?\s*[0-9a-zA-Z]+\)/i, '').trim();

        // Hindari duplikasi jika nama pengaju tertulis kembali di partner
        const isDuplicateOfSubmitter =
          cleanName.toLowerCase() === submitterRawName.toLowerCase() ||
          cleanName.toLowerCase() === submitterFullName.toLowerCase() ||
          (nrp && submitterNrp && nrp === submitterNrp);

        if (cleanName && !isDuplicateOfSubmitter) {
          const theme = partnerThemes[idx % partnerThemes.length];
          crew.push({
            id: `partner-${giat.id || 'curr'}-${idx}`,
            name: cleanName,
            nrp: nrp,
            satuan: submitterSatuan,
            role: 'REKAN',
            roleLabel: 'Rekan Regu',
            initials: getOfficerInitials(cleanName),
            avatarUrl: null,
            bgGradient: theme.bg,
            borderColor: theme.border,
            textColor: theme.text,
          });
        }
      });
    }

    return crew;
  };

  // 1. Semua pengaduan warga yang sedang ditangani oleh personil ini (status selain SELESAI dan DITOLAK)
  const ongoingComplaintsList = React.useMemo(() => {
    const list = myComplaints.filter(
      (c) => c.status !== 'SELESAI' && c.status !== 'DITOLAK'
    );
    if (list.length === 0 && activeComplaint && activeComplaint.status !== 'SELESAI' && activeComplaint.status !== 'DITOLAK') {
      return [activeComplaint];
    }
    return list;
  }, [myComplaints, activeComplaint]);

  // 2. Semua giat presisi lapangan mandiri yang sedang diajukan atau berjalan (Patroli, Sambang, Pengamanan, TPTKP mandiri)
  const activeGiatsList = React.useMemo(() => {
    if (!Array.isArray(logbooks) || logbooks.length === 0) return [];
    const standalone = logbooks.filter((l) => {
      const type = (l.jenisAksi || l.action_type || '').toUpperCase();
      const desc = l.deskripsiKegiatan || l.activity_description || '';
      const hasComplaint = l.complaintId || l.complaint_id;
      return (
        ['PATROLI', 'SAMBANG', 'PENGAMANAN', 'TPTKP'].includes(type) ||
        desc.startsWith('[PENGAJUAN GIAT')
      ) && !hasComplaint;
    });

    // Urutkan yang statusnya BELUM_DIVALIDASI dan VALID di urutan teratas
    const sorted = [...standalone].sort((a, b) => {
      const stA = String(a.statusValidasi || a.validation_status || '').toUpperCase();
      const stB = String(b.statusValidasi || b.validation_status || '').toUpperCase();
      if ((stA === 'BELUM_DIVALIDASI' || stA === 'VALID') && (stB !== 'BELUM_DIVALIDASI' && stB !== 'VALID')) return -1;
      if ((stB === 'BELUM_DIVALIDASI' || stB === 'VALID') && (stA !== 'BELUM_DIVALIDASI' && stA !== 'VALID')) return 1;
      return 0;
    });

    // Batasi maksimum 3 giat aktif terbaru agar tampilan beranda tetap rapi dan padat
    return sorted.slice(0, 3);
  }, [logbooks]);

  // Total seluruh aktivitas dan penugasan yang sedang berjalan
  const hasAnyActiveActivity = ongoingComplaintsList.length > 0 || activeGiatsList.length > 0;

  return (
    <div className="w-full pb-6">
      {/* ======================================================== */}
      {/* 1. HERO ALERT: DISPATCH INCOMING / ACTIVE MISSIONS / CLEAR */}
      {/* ======================================================== */}
      {/* 1.1 Disposisi Masuk Butuh Konfirmasi Cepat */}
      {pendingAcceptTask && pendingQuota && (
        <div
          className="relative overflow-hidden rounded-3xl p-5 sm:p-6 transition-all duration-300 mb-3 animate-in fade-in"
          style={{
            background: 'linear-gradient(135deg, rgba(24, 27, 36, 0.98) 0%, rgba(15, 17, 24, 0.98) 100%)',
            border: '2px solid #ECC473',
            boxShadow: '0 16px 40px -10px rgba(0, 0, 0, 0.8), 0 0 25px rgba(236, 196, 115, 0.25)',
          }}
        >
          {/* Glowing background accent */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 animate-pulse">
                  ⚡ DISPOSISI MASUK • BUTUH KONFIRMASI
                </span>
                <span className="text-xs font-mono font-bold text-amber-400">
                  #{pendingAcceptTask.nomorTiket}
                </span>
              </div>

              <h2 className="text-lg sm:text-xl font-black text-white">
                {pendingAcceptTask.jenisKejadian}
              </h2>

              <div className="text-xs text-slate-300 flex items-start gap-1.5 max-w-2xl">
                <MapPin size={15} className="text-amber-400 flex-shrink-0 mt-0.5" />
                <span>
                  {pendingAcceptTask.tkpAlamatTeks || 'Lokasi Kejadian'}
                  {pendingAcceptTask.arahanPawas && (
                    <span className="text-amber-300 font-semibold ml-1">
                      • Arahan Pawas: &ldquo;{pendingAcceptTask.arahanPawas}&rdquo;
                    </span>
                  )}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-shrink-0">
              <button
                id="btn-hero-terima-tugas"
                data-testid="btn-hero-terima-tugas"
                type="button"
                onClick={() => onOpenAcceptModal(pendingAcceptTask)}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl font-black text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #ECC473 0%, #D4A346 50%, #B8822A 100%)',
                  color: '#0B0D12',
                  boxShadow: '0 6px 20px rgba(212, 163, 70, 0.4)',
                }}
              >
                <Shield size={16} />
                <span>Terima Tugas ➔</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1.2 Feed Semua Aktivitas & Penugasan Sedang Dilakukan (Pengaduan & Giat Lapangan) */}
      {hasAnyActiveActivity ? (
        <div className="space-y-3 mb-4">
          {/* Header Ringkasan Aktivitas Aktif jika ada lebih dari 1 aktivitas */}
          {(ongoingComplaintsList.length + activeGiatsList.length) > 1 && (
            <div className="flex items-center justify-between px-1 pt-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-300">
                  AKTIVITAS &amp; PENUGASAN SEDANG BERJALAN ({ongoingComplaintsList.length + activeGiatsList.length})
                </span>
              </div>
              <span className="text-[10.5px] text-slate-500 font-semibold">
                {ongoingComplaintsList.length > 0 && `${ongoingComplaintsList.length} Aduan`}
                {ongoingComplaintsList.length > 0 && activeGiatsList.length > 0 && ' • '}
                {activeGiatsList.length > 0 && `${activeGiatsList.length} Giat Lapangan`}
              </span>
            </div>
          )}

          {/* DAFTAR PENUGASAN PENGADUAN WARGA (110 / SOS) */}
          {ongoingComplaintsList.map((comp) => {
            const currentDispatches = Array.isArray((comp as any).dispatches) ? (comp as any).dispatches : [];
            const matchPartner = currentDispatches.find((d: any) => d.crew_partner_name);
            const currentPartnerName = matchPartner ? matchPartner.crew_partner_name : partnerName;

            return (
              <div
                key={`active-comp-${comp.id}`}
                className="relative overflow-hidden rounded-3xl p-4 sm:p-6 transition-all duration-300 animate-in fade-in"
                style={{
                  background: 'linear-gradient(135deg, #161922 0%, #0F1117 100%)',
                  border: '1.5px solid rgba(236, 196, 115, 0.4)',
                  boxShadow: '0 12px 35px rgba(0, 0, 0, 0.7), 0 0 20px rgba(236, 196, 115, 0.15)',
                }}
              >
                {/* Subtle glowing amber accent behind active card */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                        <span>PENUGASAN ADUAN AKTIF</span>
                      </span>
                      <span className="text-xs font-mono font-bold text-amber-400 bg-black/40 px-2 py-0.5 rounded-lg border border-amber-500/20">
                        {String(comp.nomorTiket).startsWith('#')
                          ? comp.nomorTiket
                          : `#${comp.nomorTiket}`}
                      </span>
                    </div>

                    <h2 className="text-base sm:text-xl font-black text-white leading-tight">
                      {comp.jenisKejadian}
                    </h2>

                    <div className="text-xs text-slate-300 flex items-start gap-1.5">
                      <MapPin size={15} className="text-amber-400 flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-2 leading-relaxed">
                        {comp.tkpAlamatTeks || 'Lokasi Kejadian'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1 sm:pt-0 flex-shrink-0 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setShowPartnerModal(true)}
                      className="flex-1 sm:flex-initial px-3.5 sm:px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 text-blue-200 bg-blue-500/15 border border-blue-500/30 hover:bg-blue-500/25 transition-all active:scale-95 whitespace-nowrap"
                    >
                      <UserPlus size={15} className="flex-shrink-0" />
                      <span>
                        {currentPartnerName ? (
                          (() => {
                            const count = currentPartnerName.includes('|')
                              ? currentPartnerName.split('|').filter(Boolean).length
                              : currentPartnerName.split(/,\s*(?!(?:S\.H\.|S\.I\.K\.|S\.E\.|S\.Sos\.|S\.Kom\.|M\.Si\.|M\.H\.|M\.M\.|dr\.|drg\.|S\.T\.|S\.Pd\.|S\.IP|M\.Tr\.Opsla))/i).filter(Boolean).length;
                            if (count > 1) return `Regu (${count} Rekan)`;
                            return `Partner: ${currentPartnerName.replace(/\s*\|\s*/g, ', ')}`;
                          })()
                        ) : (
                          '+ Rekan Regu'
                        )}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenChat(comp)}
                      className="flex-1 sm:flex-initial px-3.5 sm:px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 text-amber-200 bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500/25 transition-all active:scale-95 whitespace-nowrap"
                    >
                      <MessageSquare size={15} className="flex-shrink-0" />
                      <span>Chat Pelapor</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onTabChange('peta')}
                      className="flex-1 sm:flex-initial px-4 sm:px-5 py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 text-slate-950 transition-all shadow-md active:scale-95 whitespace-nowrap"
                      style={{
                        background: 'linear-gradient(135deg, #ECC473 0%, #D4A346 100%)',
                        boxShadow: '0 4px 14px rgba(212, 163, 70, 0.35)',
                      }}
                    >
                      <Navigation size={15} className="flex-shrink-0" />
                      <span>Buka Navigasi TKP ➔</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* DAFTAR GIAT PRESISI LAPANGAN MANDIRI (Patroli, Sambang, Pengamanan, TPTKP) */}
          {activeGiatsList.map((giat) => {
            const type = (giat.jenisAksi || giat.action_type || 'PATROLI').toUpperCase();
            const rawDesc = giat.deskripsiKegiatan || giat.activity_description || '';
            const parsed = parseGiatDescription(rawDesc);
            const crewList = parseCrewList(giat, officer, parsed.partners);
            const isCrewExpanded = expandedCrewGiatId === String(giat.id);
            const routeText = giat.lokasiKlaimAlamat || giat.claimed_address || parsed.route || 'Wilayah Hukum Polres Pekalongan';
            const timeText = (giat.jamMulai || giat.start_time)
              ? `${giat.jamMulai || giat.start_time} s/d ${giat.jamSelesai || giat.end_time || '23:00'} WIB`
              : (parsed.time || '19:20 s/d 23:00 WIB');
            const status = String(giat.statusValidasi || giat.validation_status || 'BELUM_DIVALIDASI').toUpperCase();
            const isApproved = status === 'VALID';
            const isAudit = status === 'FLAGGED_AUDIT' || Boolean(giat.isDeviasiFlagged || giat.is_deviation_flagged);
            const isRejected = status === 'DITOLAK';

            const icon = type === 'PATROLI' ? '🚔' : type === 'SAMBANG' ? '🤝' : type === 'PENGAMANAN' ? '⚠️' : '🛡️';
            const title = type === 'PATROLI' ? 'Giat Patroli Rutin Blue Light Beat' : type === 'SAMBANG' ? 'Giat Sambang Dialogis Warga' : type === 'PENGAMANAN' ? 'Giat Pengamanan & Penjagaan Jalur' : 'Giat Respon TPTKP Presisi';

            return (
              <div
                key={`active-giat-${giat.id}`}
                className="relative overflow-hidden rounded-3xl p-4 sm:p-6 transition-all duration-300 animate-in fade-in"
                style={{
                  background: isApproved
                    ? 'linear-gradient(135deg, #0F172A 0%, #0C4A6E 50%, #0F172A 100%)'
                    : 'linear-gradient(135deg, #161922 0%, #0F1117 100%)',
                  border: isApproved
                    ? '1.5px solid #0284C7'
                    : isAudit
                    ? '1.5px solid #EF4444'
                    : isRejected
                    ? '1.5px solid #64748B'
                    : '1.5px solid #F59E0B',
                  boxShadow: isApproved
                    ? '0 12px 35px rgba(0, 0, 0, 0.7), 0 0 25px rgba(2, 132, 199, 0.25)'
                    : '0 12px 35px rgba(0, 0, 0, 0.7), 0 0 20px rgba(245, 158, 11, 0.15)',
                }}
              >
                {/* Glowing accent */}
                <div
                  className="absolute top-0 right-0 w-48 h-48 rounded-full blur-2xl pointer-events-none"
                  style={{
                    background: isApproved ? 'rgba(2, 132, 199, 0.15)' : 'rgba(245, 158, 11, 0.12)',
                  }}
                />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {isApproved ? (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                          <span>GIAT AKTIF • TELAH DISAHKAN PAWAS</span>
                        </span>
                      ) : isAudit ? (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-400/40">
                          <AlertTriangle size={12} />
                          <span>DALAM AUDIT PROPAM (DEVIASI LOKASI)</span>
                        </span>
                      ) : isRejected ? (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-500/20 text-slate-300 border border-slate-400/40">
                          <span>PENGAJUAN DIKEMBALIKAN PAWAS</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                          <span>PENGAJUAN GIAT • MENUNGGU PENGESAHAN PAWAS</span>
                        </span>
                      )}

                      <span className="text-xs font-mono font-bold text-sky-400 bg-black/40 px-2 py-0.5 rounded-lg border border-sky-500/20">
                        #LOG-{String(giat.id).padStart(5, '0')}
                      </span>
                    </div>

                    <h2 className="text-base sm:text-xl font-black text-white leading-tight flex items-center gap-2">
                      <span>{icon}</span>
                      <span>{title}</span>
                    </h2>

                    <div className="space-y-1.5 text-xs text-slate-300">
                      <div className="flex items-start gap-1.5">
                        <MapPin size={14} className="text-sky-400 flex-shrink-0 mt-0.5" />
                        <span className="font-semibold text-slate-200">
                          Rute Sasaran: {routeText}
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5 flex-wrap text-[11.5px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock size={13} className="text-amber-400" />
                          <span>{timeText}</span>
                        </span>

                        {parsed.vehicle && (
                          <span className="flex items-center gap-1">
                            <Car size={13} className="text-emerald-400" />
                            <span>{parsed.vehicle}</span>
                          </span>
                        )}

                        {/* Stacked Avatar Personel Giat Button (Termasuk Pengaju & Rekan) */}
                        <button
                          type="button"
                          onClick={() => setExpandedCrewGiatId(isCrewExpanded ? null : String(giat.id))}
                          className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/70 hover:border-sky-500/50 transition-all shadow-sm active:scale-95 text-left"
                          title="Klik untuk melihat nama dan detail personil"
                        >
                          {/* Overlapping circular avatars */}
                          <div className="flex items-center -space-x-1.5 overflow-hidden py-0.5">
                            {crewList.map((member, mIdx) => (
                              <div
                                key={member.id}
                                className="relative inline-flex items-center justify-center w-5 h-5 rounded-full text-[9px] font-black border-2 border-slate-900 shadow-sm transition-transform group-hover:scale-105"
                                style={{
                                  background: member.bgGradient,
                                  color: member.textColor,
                                  zIndex: crewList.length - mIdx,
                                }}
                                title={`${member.name} (${member.roleLabel})`}
                              >
                                {member.avatarUrl ? (
                                  <img
                                    src={member.avatarUrl}
                                    alt={member.name}
                                    className="w-full h-full object-cover rounded-full"
                                  />
                                ) : (
                                  member.initials
                                )}
                              </div>
                            ))}
                          </div>

                          {/* Info Text & Animated Chevron */}
                          <div className="flex items-center gap-1 text-[11px]">
                            <span className="font-bold text-slate-200 group-hover:text-sky-300 transition-colors">
                              {crewList.length} Personel
                            </span>
                            <span className="text-[10px] text-slate-400">
                              (Klik nama)
                            </span>
                            <ChevronDown
                              size={12}
                              className={`text-slate-400 group-hover:text-sky-300 transition-transform duration-200 ${
                                isCrewExpanded ? 'rotate-180 text-sky-400' : ''
                              }`}
                            />
                          </div>
                        </button>
                      </div>

                      {/* Expandable Personnel Roster Card (Ketika di-klik baru keluar namanya) */}
                      {isCrewExpanded && (
                        <div className="mt-2.5 p-3 rounded-2xl bg-slate-950/95 border border-sky-500/30 shadow-2xl space-y-2 animate-in fade-in zoom-in-95 duration-150">
                          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                            <div className="flex items-center gap-1.5">
                              <Users size={13} className="text-sky-400" />
                              <span className="text-[10.5px] font-black tracking-wider uppercase text-slate-300">
                                Personel Regu Giat ({crewList.length})
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedCrewGiatId(null);
                              }}
                              className="text-[10px] text-slate-400 hover:text-white px-2 py-0.5 rounded-md bg-slate-800/80 hover:bg-slate-700/80 transition-colors"
                            >
                              Tutup ✕
                            </button>
                          </div>

                          <div className="space-y-1.5">
                            {crewList.map((m) => (
                              <div
                                key={m.id}
                                className="flex items-center justify-between gap-2.5 p-2 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-colors"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div
                                    className="w-7 h-7 rounded-full flex items-center justify-center text-[10.5px] font-black shrink-0 border border-white/20 shadow-sm"
                                    style={{
                                      background: m.bgGradient,
                                      color: m.textColor,
                                    }}
                                  >
                                    {m.avatarUrl ? (
                                      <img
                                        src={m.avatarUrl}
                                        alt={m.name}
                                        className="w-full h-full object-cover rounded-full"
                                      />
                                    ) : (
                                      m.initials
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold text-white truncate leading-snug">
                                      {m.name}
                                    </p>
                                    <p className="text-[10.5px] text-slate-400 font-mono">
                                      {m.nrp ? `NRP ${m.nrp}` : '-'} {m.satuan ? `• ${m.satuan}` : ''}
                                    </p>
                                  </div>
                                </div>

                                <span
                                  className={`text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 border ${
                                    m.role === 'PENGAJU'
                                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                      : 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                                  }`}
                                >
                                  {m.role === 'PENGAJU' ? 'Pengaju / PJ' : 'Rekan Regu'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {parsed.plan && (
                        <p className="text-[11px] text-slate-400 line-clamp-1 italic mt-1">
                          &ldquo;{parsed.plan}&rdquo;
                        </p>
                      )}

                      {parsed.pawasNote && (
                        <div className="mt-1.5 text-xs p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-start gap-1.5">
                          <span className="font-bold shrink-0">Catatan Pawas:</span>
                          <span>&ldquo;{parsed.pawasNote}&rdquo;</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 pt-1 sm:pt-0 flex-shrink-0 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        if (onOpenGiatMap) {
                          onOpenGiatMap(giat);
                        } else {
                          onTabChange('peta');
                        }
                      }}
                      className="flex-1 sm:flex-initial px-4 sm:px-5 py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 whitespace-nowrap"
                      style={{
                        background: 'linear-gradient(135deg, #38BDF8 0%, #0284C7 100%)',
                        boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)',
                        color: '#FFFFFF',
                      }}
                    >
                      <Navigation size={15} className="flex-shrink-0" />
                      <span>Buka Peta Rute ➔</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : !pendingAcceptTask ? (
        /* 1.3 Standby Banner jika benar-benar tidak ada penugasan atau giat */
        <div
          className="rounded-3xl p-5 flex items-center justify-between gap-4 mb-3"
          style={{
            background: 'linear-gradient(135deg, rgba(6, 95, 70, 0.4) 0%, rgba(4, 120, 87, 0.25) 100%)',
            border: '1px solid rgba(52, 211, 153, 0.3)',
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300">
              <Shield size={22} />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-black text-white">
                WILAYAH HUKUM KONDUSIF &amp; TERPANTAU
              </div>
              <div className="text-[11px] text-emerald-200/80 mt-0.5">
                Tidak ada panggilan darurat atau kegiatan giat aktif di beat patroli Anda. Tetap siaga dan laksanakan sambang presisi.
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* ======================================================== */}
      {/* 2. MAIN 2-COLUMN LAYOUT: DESKTOP / TABLET / MOBILE FLOW */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left Column: Aksi Cepat Pengajuan Giat */}
        <div className="space-y-4">
          {/* Quick Action Pad 2x2 */}
          <div
            className="rounded-3xl p-4 sm:p-5"
            style={{
              background: 'linear-gradient(180deg, #151821 0%, #0E1017 100%)',
              border: '1px solid rgba(236, 196, 115, 0.2)',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6)',
            }}
          >
            <div className="text-xs font-black uppercase text-amber-400 tracking-wider mb-3">
              Pengajuan Giat Presisi Lapangan
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onQuickAction('PATROLI')}
                className="p-4 rounded-2xl text-center transition-all duration-200 active:scale-95 border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20"
              >
                <div className="text-2xl mb-1">🚔</div>
                <div className="text-xs font-black text-blue-300">PATROLI</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Ajukan Blue Light Beat</div>
              </button>

              <button
                type="button"
                onClick={() => onQuickAction('TPTKP')}
                className="p-4 rounded-2xl text-center transition-all duration-200 active:scale-95 border border-red-500/30 bg-red-500/10 hover:bg-red-500/20"
              >
                <div className="text-2xl mb-1">🛡️</div>
                <div className="text-xs font-black text-red-300">TPTKP</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Ajukan Respon TKP</div>
              </button>

              <button
                type="button"
                onClick={() => onQuickAction('SAMBANG')}
                className="p-4 rounded-2xl text-center transition-all duration-200 active:scale-95 border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20"
              >
                <div className="text-2xl mb-1">🤝</div>
                <div className="text-xs font-black text-emerald-300">SAMBANG</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Ajukan Sambang Warga</div>
              </button>

              <button
                type="button"
                onClick={() => onQuickAction('PENGAMANAN')}
                className="p-4 rounded-2xl text-center transition-all duration-200 active:scale-95 border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20"
              >
                <div className="text-2xl mb-1">⚠️</div>
                <div className="text-xs font-black text-amber-300">PENGAMANAN</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Ajukan Pam Jalur</div>
              </button>
            </div>

            {/* Quick Action Klaim BBM SPBU */}
            <div className="mt-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowKlaimBbmModal(true)}
                className="w-full p-3 rounded-2xl flex items-center justify-between text-left transition-all duration-200 active:scale-95 border border-amber-500/35 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent hover:bg-amber-500/25 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 text-xl group-hover:scale-105 transition-transform">
                    ⛽
                  </div>
                  <div>
                    <div className="text-xs font-black text-amber-300">KLAIM BBM &amp; STRUK SPBU</div>
                    <div className="text-[10px] text-slate-400">Unggah foto struk kasir &amp; spidometer dinas ke Logistik</div>
                  </div>
                </div>
                <span className="text-amber-400 font-bold text-xs pr-1 group-hover:translate-x-1 transition-transform">➔</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Rekapitulasi Giat & Capaian Respon */}
        <div className="space-y-4">
          {/* Rekapitulasi Kegiatan Tugas Hari Ini */}
          <div
            className="rounded-3xl p-4 sm:p-5"
            style={{
              background: 'linear-gradient(180deg, #151821 0%, #0E1017 100%)',
              border: '1px solid rgba(236, 196, 115, 0.15)',
            }}
          >
            <div className="text-xs font-black uppercase text-amber-400 tracking-wider mb-3">
              Rekapitulasi Kegiatan Tugas Hari Ini
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                {
                  label: 'PATROLI',
                  count: patroliCount,
                  color: 'text-blue-400',
                  bg: 'bg-blue-500/10',
                  sub: `${patroliCount} Giat`,
                },
                {
                  label: 'TPTKP',
                  count: totalTptkpCount,
                  color: 'text-red-400',
                  bg: 'bg-red-500/10',
                  sub: `${tiketSelesaiCount} Selesai • ${tiketProsesCount} Proses`,
                },
                {
                  label: 'SAMBANG',
                  count: sambangCount,
                  color: 'text-emerald-400',
                  bg: 'bg-emerald-500/10',
                  sub: `${sambangCount} Giat`,
                },
                {
                  label: 'PENGAMANAN',
                  count: pengamananCount,
                  color: 'text-amber-400',
                  bg: 'bg-amber-500/10',
                  sub: `${pengamananCount} Giat`,
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-2xl border border-white/5 ${item.bg} text-center flex flex-col items-center justify-center min-h-[78px] transition-all`}
                >
                  <div className={`text-xl font-black ${item.color}`}>
                    {item.count}
                  </div>
                  <div className="text-[10px] font-bold text-slate-300 tracking-wide mt-0.5">
                    {item.label}
                  </div>
                  <div className="text-[9px] font-medium text-slate-400 mt-1 px-1.5 py-0.5 rounded-full bg-white/5 border border-white/5 whitespace-nowrap">
                    {item.sub}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Jadwal Piket Jaga Personil (SOP Polri) */}
          <div
            className="rounded-3xl p-4 sm:p-5"
            style={{
              background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.15) 0%, rgba(15, 23, 42, 0.9) 100%)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              boxShadow: '0 8px 25px rgba(0, 0, 0, 0.5)',
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                <Shield size={14} />
                <span>Jadwal Piket Jaga Saya</span>
              </span>
              <span className="text-xs text-amber-300 font-bold flex items-center gap-1">
                <span></span>
                <ChevronRight size={14} />
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Regu Piket :</span>
                <span className="font-bold text-white bg-slate-800/80 px-2 py-0.5 rounded">
                  {piketSchedule?.reguPiket || (officer.satuan ? `Piket ${officer.satuan}` : 'Regu Cadangan')}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Jam Dinas :</span>
                <span className="font-bold text-white">
                  {piketSchedule?.jamDinas || '08.00 s/d 08.00 WIB (+1)'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Peran Penugasan :</span>
                <span className="font-bold text-emerald-400">
                  {piketSchedule?.peranPenugasan || officer.jabatan || 'Piket Patroli Perintis Presisi'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Status Presensi :</span>
                <span className={`font-black px-2 py-0.5 rounded border text-[11px] ${
                  (piketSchedule?.statusPresensi || officer.dutyStatus) !== 'LEPAS_DINAS'
                    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                    : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                }`}>
                  {(piketSchedule?.statusPresensi || officer.dutyStatus) !== 'LEPAS_DINAS'
                    ? '✓ HADIR DINAS SIAGA'
                    : '• LEPAS DINAS / CADANGAN'}
                </span>
              </div>
            </div>
          </div>

          {/* Shift Performance Summary Link */}
          <div
            onClick={() => onTabChange('profil')}
            className="rounded-3xl p-4 sm:p-5 cursor-pointer transition-all duration-200 hover:scale-[1.01]"
            style={{
              background: 'linear-gradient(135deg, rgba(236, 196, 115, 0.12) 0%, rgba(184, 130, 42, 0.08) 100%)',
              border: '1px solid rgba(236, 196, 115, 0.3)',
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-amber-400 uppercase tracking-wider">
                Capaian Respon & Standar SOP
              </span>
              <span className="text-xs text-amber-300 font-bold flex items-center gap-1">
                <span>Lihat</span>
                <ChevronRight size={14} />
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-black text-white">
                  {officer.kpi || 96}%
                </div>
                <div className="text-[11px] text-slate-300">
                  Target SLA respon terpenuhi &lt; 10 menit
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300">
                <TrendingUp size={24} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Klaim BBM & Struk SPBU */}
      <ModalKlaimBbm
        isOpen={showKlaimBbmModal}
        onClose={() => setShowKlaimBbmModal(false)}
        officer={officer}
        activeComplaint={activeComplaint}
        onSuccess={(msg) => toast.success(msg)}
      />

      {showPartnerModal && activeComplaint && (
        <ModalTambahRekanRegu
          isOpen={showPartnerModal}
          complaint={activeComplaint}
          officer={officer}
          onClose={() => setShowPartnerModal(false)}
          onSuccess={(name) => {
            setPartnerName(name);
          }}
        />
      )}
    </div>
  );
}
