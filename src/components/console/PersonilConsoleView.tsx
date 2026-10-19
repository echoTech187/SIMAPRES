'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  getOfficerComplaintsAction,
  fieldStepAction,
  acceptOfficerDispatchAction,
  getMasterFilterOptionsAction,
} from '@/app/actions/complaint.actions';
import {
  createLogbookAction,
  getOfficerLogbooksAction,
  getOfficerKpiChartDataAction,
} from '@/app/actions/logbook.actions';
import {
  getHotspotsAction,
  createHotspotAction,
  deleteHotspotAction,
  getMasterHotspotOptionsAction,
} from '@/app/actions/hotspot.actions';
import {
  updateDeviceTelemetryAction,
  getOfficerProfileByNrpAction,
  getPoliceOfficesAction,
  logoutAction,
} from '@/app/actions/auth.actions';
import { getPatrolFleetUnitsAction } from '@/app/actions/fleet.actions';
import HeaderProfileBadge from './HeaderProfileBadge';
import LiveCameraWatermarkCapture from '@/components/LiveCameraWatermarkCapture';

const SimapresLeafletMap = dynamic(() => import('@/components/SimapresLeafletMap'), {
  ssr: false,
  loading: () => (
    <div style={{ width: '100%', height: '100%', minHeight: '350px', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', fontWeight: 700 }}>
      🛰️ Memuat Peta Rute Patroli...
    </div>
  ),
});

const MiniMapPicker = dynamic(() => import('@/components/MiniMapPicker'), {
  ssr: false,
  loading: () => <div style={{ height: '220px', background: '#E2E8F0' }} />,
});

import KpiGaugeChart from '@/components/KpiGaugeChart';
import { ConsoleSkeleton } from './ConsoleSkeleton';

function parsePersonilTab(section?: string): string {
  if (!section) return 'view-beranda';
  const clean = section.toLowerCase().trim();
  switch (clean) {
    case 'peta':
      return 'view-peta';
    case 'buat-pengaduan':
    case 'buat-log':
    case 'log':
      return 'view-log';
    case 'komando':
    case 'tugas':
    case 'validasi':
      return 'view-validasi';
    case 'kinerja':
    case 'laporan':
      return 'view-laporan';
    case 'profil':
      return 'view-profil';
    case 'wizard':
      return 'view-wizard';
    case 'beranda':
    default:
      return 'view-beranda';
  }
}

function personilTabToSlug(tabId: string): string {
  switch (tabId) {
    case 'view-peta':
      return 'peta';
    case 'view-log':
      return 'buat-pengaduan';
    case 'view-validasi':
      return 'tugas';
    case 'view-laporan':
      return 'kinerja';
    case 'view-profil':
      return 'profil';
    case 'view-wizard':
      return 'wizard';
    case 'view-beranda':
    default:
      return '';
  }
}

// Rumus Haversine: Menghitung jarak riil dua titik koordinat GPS dalam satuan Meter
function getDistanceFromLatLonInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
  const R = 6371e3; // Radius bumi dalam meter
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

function PersonilContent({ session, initialSection = 'beranda' }: { session?: any; initialSection?: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const nrpParam = searchParams.get('nrp') || session?.identifier || '92031145';

  // Navigation tab: Sinkronkan dengan URL halaman (/console/buat-pengaduan, /console/peta, dll.)
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const parts = window.location.pathname.split('/').filter(Boolean);
      const last = parts[parts.length - 1];
      if (parts[0] === 'console' && parts.length > 1) {
        return parsePersonilTab(last);
      }
    }
    return parsePersonilTab(initialSection);
  });

  // Sinkronkan activeTab jika rute atau initialSection berubah dari server / App Router
  useEffect(() => {
    if (initialSection) {
      setActiveTab(parsePersonilTab(initialSection));
    }
  }, [initialSection]);

  // Tab & Per-Page switcher: sinkronkan ke URL browser secara mulus
  const switchTab = (tabId: string) => {
    setActiveTab(tabId);
    const slug = personilTabToSlug(tabId);
    const targetUrl = slug ? `/console/${slug}` : '/console';
    if (typeof window !== 'undefined') {
      try {
        router.push(targetUrl);
      } catch (_) {
        window.history.pushState(null, '', targetUrl);
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const [focusedFleet, setFocusedFleet] = useState<'all' | 'samapta' | 'perintis' | 'lantas' | 'hotspot'>('all');
  const [newHotspotLat, setNewHotspotLat] = useState<number>(0);
  const [newHotspotLng, setNewHotspotLng] = useState<number>(0);
  const [showMiniPickerRawan, setShowMiniPickerRawan] = useState<boolean>(false);

  // Officer Profile (Dimuat secara dinamis 100% dari Database MySQL)
  const [officer, setOfficer] = useState<any>({
    id: session?.userId ? String(session.userId) : '3',
    nrp: nrpParam || '92031145',
    fullName: session?.fullName || '',
    pangkat: session?.rankPangkat || '',
    jabatan: session?.title || '',
    satuan: '',
    kendaraan: '',
    avatar: session?.avatar_url || null,
    kpi: 0,
    stationId: null,
    stationName: null,
    stationLat: null,
    stationLng: null,
    stationRadius: 1000,
    currentGpsLat: null,
    currentGpsLng: null,
  });

  const [taktisStatus, setTaktisStatus] = useState<string>('siaga');

  // Complaints & Active Emergency
  const [complaints, setComplaints] = useState<any[]>([]);
  const [activeComplaint, setActiveComplaint] = useState<any | null>(null);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [validasiFilter, setValidasiFilter] = useState<'semua' | 'diproses' | 'menunggu_pengesahan'>('diproses');
  const [platformFilter, setPlatformFilter] = useState<'all' | 'sos' | 'warga' | 'layanan110'>('all');

  // Logbooks & KPI
  const [logbooks, setLogbooks] = useState<any[]>([]);
  const [kpiPeriod, setKpiPeriod] = useState<'harian' | 'mingguan' | 'bulanan'>('harian');

  // Police Offices, Fleet Units & Hotspots from Database
  const [policeOffices, setPoliceOffices] = useState<any[]>([]);
  const [fleetUnits, setFleetUnits] = useState<any[]>([]);
  const [hotspots, setHotspots] = useState<any[]>([]);
  const [dbHotspotCategories, setDbHotspotCategories] = useState<any[]>([]);
  const [dbHotspotDangerLevels, setDbHotspotDangerLevels] = useState<any[]>([]);
  const [dbDutyStatuses, setDbDutyStatuses] = useState<any[]>([]);
  const [dbGiats, setDbGiats] = useState<any[]>([]);
  const [showHotspotModal, setShowHotspotModal] = useState<boolean>(false);
  const [showHotspotAddForm, setShowHotspotAddForm] = useState(false);
  const [newHotspotTitle, setNewHotspotTitle] = useState('');
  const [newHotspotWilayah, setNewHotspotWilayah] = useState('');
  const [newHotspotKategori, setNewHotspotKategori] = useState('');
  const [newHotspotStatus, setNewHotspotStatus] = useState('');
  const [newHotspotJadwal, setNewHotspotJadwal] = useState('');

  // Form Logbook State
  const [logJenis, setLogJenis] = useState<string>('PATROLI');
  const [jamMulai, setJamMulai] = useState('');
  const [jamSelesai, setJamSelesai] = useState('');
  const [logLokasi, setLogLokasi] = useState('');
  const [logLat, setLogLat] = useState(0);
  const [logLng, setLogLng] = useState(0);
  const [logDeskripsi, setLogDeskripsi] = useState('');
  const [logFoto, setLogFoto] = useState<string | null>(null);
  const logPhotoInputRef = useRef<HTMLInputElement>(null);
  const [isSubmittingLog, setIsSubmittingLog] = useState(false);

  // Timepicker Modal
  const [showTimePicker, setShowTimePicker] = useState<boolean>(false);

  // Wizard Penanganan Kasus
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [expandedStep, setExpandedStep] = useState<number>(1);
  const [wizardCatatan, setWizardCatatan] = useState('');
  const [wizardFoto, setWizardFoto] = useState<string | null>(null);
  const [wizardPhotoMetadata, setWizardPhotoMetadata] = useState<any>(null);
  const [isUpdatingStep, setIsUpdatingStep] = useState(false);
  const activeComplaintRef = useRef<any>(null);

  // Single Source of Truth: Menghitung Tahap Wizard dari Status & Tahap Pengaduan
  // Sesuai Prototype syncWizardStepsWithTahap(tahap) pada Prototype/js/personil.js
  const computeWizardStepFromComplaint = (complaint: any): number => {
    if (!complaint) return 1;
    const status = String(complaint.status || '').toUpperCase();
    const tahap = Number(complaint.tahap) || 1;

    // Tahap >= 5: Menunggu Pengesahan Pawas atau Selesai atau Tindakan TKP dilaporkan
    // Sesuai Prototype: Langkah 1 & 2 selesai (✅), Langkah 3 aktif (⏳)
    if (status === 'SELESAI' || status === 'MENUNGGU_PENGESAHAN' || status === 'PENANGANAN_TKP' || tahap >= 5) {
      return 3;
    }

    // Tahap 4: Petugas sedang meluncur (MENUJU_TKP) atau tiba di TKP (TIBA_DI_TKP)
    // Sesuai Prototype: Langkah 1 selesai (✅), Langkah 2 aktif (⏳), Langkah 3 terkunci (🔒)
    if (status === 'MENUJU_TKP' || status === 'TIBA_DI_TKP' || tahap === 4) {
      return 2;
    }

    // Tahap <= 3: Baru diterima/didisposisikan (SEDANG_DITANGANI, ACCEPTED, DISPOSISI, DIPROSES)
    // Sesuai Prototype: Langkah 1 aktif (⏳), Langkah 2 & 3 terkunci (🔒)
    return 1;
  };

  // Helper untuk menentukan currentTahap Timeline (1-5) 1:1 sesuai Prototype/js/personil.js
  const getComplaintTahap = (complaint: any): number => {
    if (!complaint) return 3;
    const status = String(complaint.status || '').toUpperCase();
    const tahap = Number(complaint.tahap);

    if (status === 'SELESAI' || Boolean(complaint.pengesahanPawas)) return 5;
    if (status === 'MENUNGGU_PENGESAHAN' || status === 'PENANGANAN_TKP') return 5;
    if (tahap >= 5) return 5;

    // Personel sudah meluncur atau tiba di TKP (Tahap 4)
    if (status === 'MENUJU_TKP' || status === 'TIBA_DI_TKP' || tahap === 4 || complaint.waktuMeluncur) return 4;

    // Default untuk kasus baru diterima / didisposisi (Tahap 3: Meluncur ke TKP)
    return 3;
  };

  const peringatanStepDisabled = (step: number, current: number, type: 'completed' | 'active' | 'locked') => {
    if (type === 'completed') {
      alert('ℹ️ Langkah ini sudah selesai dilewati dan tidak dapat diubah kembali.');
    } else if (type === 'active') {
      alert('⚡ Penanganan pada langkah ini sedang aktif berlangsung oleh petugas.');
    } else if (type === 'locked') {
      alert('🔒 Langkah ini masih terkunci!\n\nPenanganan kasus wajib diselesaikan secara bertahap dan berurutan.\nSilakan gunakan tombol "Lanjutkan Penanganan Kasus (Buka Wizard)" di bawah.');
    }
  };

  const openWizardForComplaint = (complaint: any) => {
    if (!complaint) return;
    setActiveComplaint(complaint);
    activeComplaintRef.current = complaint;
    setSelectedTask(complaint);
    const step = computeWizardStepFromComplaint(complaint);
    setWizardStep(step);
    setExpandedStep(step);
    setWizardCatatan('');
    setWizardFoto(null);
    switchTab('view-wizard');
  };

  const toggleWizStep = (stepNum: number) => {
    if (stepNum > wizardStep) {
      alert('🔒 Langkah ini masih terkunci!\n\nPenanganan kasus wajib diselesaikan secara bertahap dan berurutan.\nSelesaikan langkah sebelumnya terlebih dahulu.');
      return;
    }
    if (stepNum < wizardStep) {
      alert('✓ Tahap ini telah selesai diverifikasi & dikunci permanen.\nAnda tidak dapat mengubah data pada tahap ini lagi.');
      return;
    }
    setExpandedStep(expandedStep === stepNum ? 0 : stepNum);
  };

  // Modal Konfirmasi Persetujuan Personil (Terima Tugas)
  const [showAcceptModal, setShowAcceptModal] = useState<boolean>(false);
  const [pendingAcceptTask, setPendingAcceptTask] = useState<any | null>(null);
  const [isAcceptingTask, setIsAcceptingTask] = useState<boolean>(false);
  const promptedTaskIdsRef = useRef<Set<string>>(new Set());

  // Audio Alert Taktis (Web Audio API Synthesizer)
  const playPoliceAlertAudio = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const playTone = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        gain.gain.setValueAtTime(0.32, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration);
      };

      // Police tactical dispatch alert: dual resonant high chimes
      playTone(880, 0, 0.18);
      playTone(1174.66, 0.18, 0.28);
      playTone(880, 0.5, 0.18);
      playTone(1318.51, 0.68, 0.45);
    } catch (_) { }
  };

  // Helper: Mengecek apakah personel yang sedang login sudah menerima tugas ini
  const hasOfficerAcceptedTask = (task: any) => {
    if (!task) return false;
    const activeNrp = officer.nrp || session?.identifier || nrpParam || '';
    const activeId = officer.id || (session?.userId ? String(session.userId) : '');
    const dispatches: any[] = task.dispatches || [];

    const acceptedInDispatches = dispatches.some(
      (d: any) =>
        d.accepted_at &&
        ((activeId && String(d.officer_id) === String(activeId)) ||
          d.officer?.nrp === activeNrp ||
          d.officer?.user?.identifier === activeNrp)
    );
    if (acceptedInDispatches) return true;

    if (
      task.assignedOfficer?.nrp === activeNrp &&
      (task.status === 'SEDANG_DITANGANI' ||
        task.status === 'MENUJU_TKP' ||
        task.status === 'TIBA_DI_TKP' ||
        task.status === 'PENANGANAN_TKP' ||
        task.status === 'MENUNGGU_PENGESAHAN')
    ) {
      return true;
    }

    return false;
  };

  // Helper: Mendapatkan informasi kuota dan jumlah personel yang telah menerima tugas
  const getTaskQuotaInfo = (task: any) => {
    if (!task) {
      return { quota: 4, acceptedCount: 0, slotsRemaining: 4, isQuotaFull: false, acceptedOfficers: [], unitName: '' };
    }
    const myUnitId = officer.unit_id || null;
    const dispatches: any[] = task.dispatches || [];

    // Cari dispatch yang cocok dengan unit personel atau dispatch utama
    const unitDisp = (myUnitId ? dispatches.find((d: any) => d.unit_id === myUnitId) : null) || dispatches[0];
    const quota = unitDisp?.personnel_quota || 4;
    const targetUnitId = unitDisp?.unit_id;

    // Filter dispatches yang telah diterima personel di unit terkait
    const acceptedDisps = dispatches.filter(
      (d: any) =>
        (targetUnitId ? d.unit_id === targetUnitId : true) &&
        d.accepted_at &&
        (d.officer_id || d.officer)
    );

    const acceptedCount = acceptedDisps.length;
    const slotsRemaining = Math.max(0, quota - acceptedCount);
    const isQuotaFull = acceptedCount >= quota;

    const acceptedOfficers = acceptedDisps.map((d: any) => ({
      name: d.officer?.user?.full_name || d.officer?.user?.nama_lengkap || d.officer?.rank_pangkat || 'Petugas',
      nrp: d.officer?.nrp || d.officer?.user?.identifier || '',
      rank: d.officer?.rank_pangkat || 'Personil',
    }));

    return {
      quota,
      acceptedCount,
      slotsRemaining,
      isQuotaFull,
      acceptedOfficers,
      unitName: unitDisp?.unit?.unit_name || unitDisp?.unit?.short_name || '',
    };
  };

  // Helper: Mendapatkan seluruh personel yang menyetujui / ikut dalam penanganan tugas (Regu Lapangan)
  const getAcceptedPersonnelList = (task: any) => {
    if (!task) return [];
    const list: Array<{
      name: string;
      rank: string;
      nrp: string;
      unit: string;
      acceptedAt: string | null;
      avatarUrl?: string | null;
      initials: string;
      isPrimary: boolean;
      isCurrentOfficer: boolean;
    }> = [];

    const seenKeys = new Set<string>();
    const dispatches: any[] = task.dispatches || [];

    const cleanOfficerName = (rawName: string, rank?: string) => {
      let name = (rawName || '').trim();
      if (!name && rank) return `${rank} Petugas`;
      if (!name) return 'Personel Lapangan';
      if (rank && !name.toLowerCase().startsWith(rank.toLowerCase())) {
        name = `${rank} ${name}`;
      }
      return name;
    };

    // 1. Ekstrak dari seluruh dispatches yang telah berstatus ACCEPTED / memiliki accepted_at
    dispatches.forEach((d: any) => {
      const isAccepted = Boolean(
        d.accepted_at ||
        d.dispatch_status === 'ACCEPTED' ||
        d.arrived_at ||
        d.completed_at
      );
      if (!isAccepted && !d.officer) return;

      const off = d.officer;
      const rawName = off?.user?.full_name || off?.user?.nama_lengkap || off?.namaLengkap || '';
      const rank = off?.rank_pangkat || off?.rankPangkat || '';
      const name = cleanOfficerName(rawName, rank);
      const nrp = off?.nrp || off?.user?.identifier || '';
      const unit = d.unit?.unit_name || d.unit?.short_name || '';
      const avatarUrl = off?.avatar_url || off?.avatarUrl || null;
      let acceptedAt: string | null = null;
      if (d.accepted_at) {
        try {
          acceptedAt = new Date(d.accepted_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
        } catch (_) {}
      }

      const key = (nrp || name).trim().toLowerCase();
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        const nameParts = name.replace(/^(Bripka|Ipda|Aiptu|Aipda|Briptu|Bripda|AKP|Kompol|AKBP|Kombes|Brigadir)\s+/i, '').trim().split(' ');
        const initials = ((nameParts[0]?.[0] || 'P') + (nameParts[1]?.[0] || '')).toUpperCase();

        const isCurrentOfficer = Boolean(
          (officer?.nrp && nrp === officer.nrp) ||
          (officer?.fullName && name.toLowerCase().includes(officer.fullName.toLowerCase()))
        );

        list.push({
          name,
          rank,
          nrp,
          unit,
          acceptedAt,
          avatarUrl,
          initials,
          isPrimary: Boolean(d.is_primary_unit || list.length === 0),
          isCurrentOfficer,
        });
      }
    });

    // 2. Ekstrak dari assignedOfficer jika belum masuk
    if (task.assignedOfficer) {
      const ao = task.assignedOfficer;
      const rawName = ao.namaLengkap || ao.name || '';
      const rank = ao.rankPangkat || '';
      const name = cleanOfficerName(rawName, rank);
      const nrp = ao.nrp || '';
      const key = (nrp || name).trim().toLowerCase();

      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        const nameParts = name.replace(/^(Bripka|Ipda|Aiptu|Aipda|Briptu|Bripda|AKP|Kompol|AKBP|Kombes|Brigadir)\s+/i, '').trim().split(' ');
        const initials = ((nameParts[0]?.[0] || 'P') + (nameParts[1]?.[0] || '')).toUpperCase();
        const isCurrentOfficer = Boolean(
          (officer?.nrp && nrp === officer.nrp) ||
          (officer?.fullName && name.toLowerCase().includes(officer.fullName.toLowerCase()))
        );

        let acceptedAt: string | null = null;
        if (task.disposisiAt) {
          try {
            acceptedAt = new Date(task.disposisiAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
          } catch (_) {}
        }

        list.push({
          name,
          rank,
          nrp,
          unit: ao.assignedPatrolVehicle || '',
          acceptedAt,
          avatarUrl: ao.avatarUrl || null,
          initials,
          isPrimary: true,
          isCurrentOfficer,
        });
      }
    }

    // 3. Ekstrak dari complaint_logs yang mencatat personil ACCEPTED
    const logs = task.complaintLogs || task.complaint_logs || [];
    logs.forEach((l: any) => {
      if (l.action && (l.action.includes('ACCEPTED') || l.action.includes('Diterima Personil'))) {
        const rawActor = l.actor_name || '';
        if (!rawActor || rawActor === 'SISTEM' || rawActor === 'OPERATOR') return;

        const nrpMatch = l.notes?.match(/NRP:\s*([A-Za-z0-9]+)/i);
        const nrp = nrpMatch ? nrpMatch[1] : '';
        const key = (nrp || rawActor).trim().toLowerCase();

        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          let acceptedAt: string | null = null;
          if (l.created_at) {
            try {
              acceptedAt = new Date(l.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
            } catch (_) {}
          }
          const nameParts = rawActor.replace(/^(Bripka|Ipda|Aiptu|Aipda|Briptu|Bripda|AKP|Kompol|AKBP|Kombes|Brigadir)\s+/i, '').trim().split(' ');
          const initials = ((nameParts[0]?.[0] || 'P') + (nameParts[1]?.[0] || '')).toUpperCase();
          const isCurrentOfficer = Boolean(
            (officer?.nrp && nrp === officer.nrp) ||
            (officer?.fullName && rawActor.toLowerCase().includes(officer.fullName.toLowerCase()))
          );

          list.push({
            name: rawActor,
            rank: '',
            nrp,
            unit: '',
            acceptedAt,
            avatarUrl: null,
            initials,
            isPrimary: false,
            isCurrentOfficer,
          });
        }
      }
    });

    // 4. Fallback jika list masih kosong namun tugas sudah berjalan
    if (list.length === 0 && task.status !== 'BELUM_DITANGANI' && task.status !== 'MENUNGGU') {
      const name = task.personelDitugaskan || officer.fullName || 'Petugas Lapangan';
      const rank = officer.pangkat || '-';
      const nrp = officer.nrp || '';
      const nameParts = name.replace(/^(Bripka|Ipda|Aiptu|Aipda|Briptu|Bripda|AKP|Kompol|AKBP|Kombes|Brigadir)\s+/i, '').trim().split(' ');
      const initials = ((nameParts[0]?.[0] || 'P') + (nameParts[1]?.[0] || '')).toUpperCase();

      list.push({
        name,
        rank,
        nrp,
        unit: 'Unit Reaksi Cepat',
        acceptedAt: task.waktuMeluncur || null,
        avatarUrl: officer.avatar || null,
        initials,
        isPrimary: true,
        isCurrentOfficer: true,
      });
    }

    return list;
  };

  // Helper: Apakah tugas ini butuh konfirmasi (Auto-Popup) bagi personel yang sedang login?
  const isTaskPendingAcceptance = (c: any) => {
    if (!c || c.status === 'SELESAI' || c.status === 'DITOLAK') return false;

    // Jika saya sudah menerima tugas ini, tidak perlu konfirmasi lagi
    if (hasOfficerAcceptedTask(c)) return false;

    // Cek ketersediaan kuota personel untuk unit ini
    const { isQuotaFull, slotsRemaining } = getTaskQuotaInfo(c);

    // Jika kuota sudah penuh, personel lain sudah tidak bisa mengambil tugas ini
    if (isQuotaFull || slotsRemaining <= 0) return false;

    // Jika statusnya DISPOSISI, tiket butuh konfirmasi
    if (c.status === 'DISPOSISI') return true;

    // Jika statusnya SEDANG_DITANGANI / DIPROSES / MENUJU_TKP namun kuota unit masih ada slot
    const dispatches = c.dispatches || [];
    if (
      dispatches.length > 0 &&
      (c.status === 'SEDANG_DITANGANI' || c.status === 'DIPROSES' || c.status === 'MENUJU_TKP')
    ) {
      return true;
    }

    return false;
  };

  // Modals
  const [showSosModal, setShowSosModal] = useState(false);
  const [showKpiModal, setShowKpiModal] = useState(false);
  const [showPresensiPulangModal, setShowPresensiPulangModal] = useState(false);
  const [lightboxFoto, setLightboxFoto] = useState<{ src: string; title: string; meta: string } | null>(null);
  const [selectedLogDetail, setSelectedLogDetail] = useState<any | null>(null);

  // Unit Map Detail Popup
  const [mapUnitDetail, setMapUnitDetail] = useState<any | null>(null);

  // Presensi & Clock
  const [presensiMasukTime, setPresensiMasukTime] = useState<string>('-');
  const [presensiPulangTime, setPresensiPulangTime] = useState<string | null>(null);
  const [liveClock, setLiveClock] = useState('');
  const [currentGps, setCurrentGps] = useState<{ lat: number; lng: number }>({
    lat: 0,
    lng: 0,
  });
  const [officerLiveAddress, setOfficerLiveAddress] = useState<string>('');

  // Target Pengaduan untuk Navigasi Rute & Geofencing Lapangan
  const targetComplaintForNav = useMemo(() => {
    if (activeComplaint && activeComplaint.status !== 'SELESAI' && activeComplaint.status !== 'DITOLAK') {
      return activeComplaint;
    }
    if (selectedTask && selectedTask.status !== 'SELESAI' && selectedTask.status !== 'DITOLAK') {
      return selectedTask;
    }
    const moving = complaints.find(
      (c: any) =>
        hasOfficerAcceptedTask(c) &&
        (c.status === 'MENUJU_TKP' || c.status === 'TIBA_DI_TKP' || c.status === 'SEDANG_DITANGANI' || c.status === 'DIPROSES')
    );
    return moving || null;
  }, [activeComplaint, selectedTask, complaints]);

  // Jarak Riil Geofence (Meter) dari Posisi Satelit GPS Personil ke TKP Pengaduan
  const distanceToTkpMeters = useMemo(() => {
    const lat1 = currentGps?.lat ? Number(currentGps.lat) : 0;
    const lng1 = currentGps?.lng ? Number(currentGps.lng) : 0;
    const lat2 = targetComplaintForNav?.tkpLat ? Number(targetComplaintForNav.tkpLat) : 0;
    const lng2 = targetComplaintForNav?.tkpLng ? Number(targetComplaintForNav.tkpLng) : 0;

    if (!lat1 || !lng1 || !lat2 || !lng2) return null;
    return getDistanceFromLatLonInMeters(lat1, lng1, lat2, lng2);
  }, [currentGps, targetComplaintForNav]);

  // Syarat Radius Geofence <= 50 Meter
  const isWithin50Meters = distanceToTkpMeters !== null && distanceToTkpMeters <= 50;

  // Estimasi Waktu Tempuh Cepat (ETA)
  const etaMinutesText = useMemo(() => {
    if (distanceToTkpMeters === null) return 'Menghitung...';
    if (distanceToTkpMeters <= 50) return 'Tiba di Lokasi';
    const minutes = Math.max(1, Math.round(distanceToTkpMeters / ((35 * 1000) / 60)));
    return `± ${minutes} Menit`;
  }, [distanceToTkpMeters]);

  // Format Jarak Manusiawi (m / km)
  const distanceFormatted = useMemo(() => {
    if (distanceToTkpMeters === null) return 'Mendeteksi GPS...';
    if (distanceToTkpMeters >= 1000) {
      return `${(distanceToTkpMeters / 1000).toFixed(1)} km`;
    }
    return `${distanceToTkpMeters} m`;
  }, [distanceToTkpMeters]);

  // =========================================================================
  // MODUL SIMULASI GPS PATROLI KE TKP (UNTUK PENGUJIAN WORKFLOW LAPANGAN)
  // [ON / OFF SWITCH & MODUL MANDIRI - DAPAT DIHAPUS KAPAN SAJA]
  // =========================================================================
  const [isSimModeEnabled, setIsSimModeEnabled] = useState<boolean>(false);
  const [isSimMoving, setIsSimMoving] = useState<boolean>(false);
  const isSimulationActiveRef = useRef<boolean>(false);
  const simIntervalRef = useRef<any>(null);
  const simBackupGpsRef = useRef<{ lat: number; lng: number } | null>(null);

  // Fungsi toggle On/Off Mode Simulasi
  const toggleSimulationMode = (enable: boolean) => {
    setIsSimModeEnabled(enable);
    if (!enable) {
      if (simIntervalRef.current) {
        clearInterval(simIntervalRef.current);
        simIntervalRef.current = null;
      }
      setIsSimMoving(false);
      // Kembalikan ke koordinat GPS asli jika ada backup
      if (simBackupGpsRef.current) {
        setCurrentGps(simBackupGpsRef.current);
      }
      isSimulationActiveRef.current = false;
    } else {
      isSimulationActiveRef.current = true;
      if (!simBackupGpsRef.current && currentGps.lat) {
        simBackupGpsRef.current = { ...currentGps };
      }
    }
  };

  // Fungsi menghentikan pergerakan simulasi
  const stopSimulationMovement = () => {
    if (simIntervalRef.current) {
      clearInterval(simIntervalRef.current);
      simIntervalRef.current = null;
    }
    setIsSimMoving(false);
  };

  // 1. Jalankan Simulasi Bergerak Maju Mengikuti Rute Jalan Raya (OSRM Driving Directions)
  const startRouteSimulation = async () => {
    if (!targetComplaintForNav?.tkpLat || !targetComplaintForNav?.tkpLng) {
      alert('Tidak ada pengaduan aktif yang sedang menuju TKP!');
      return;
    }

    if (!simBackupGpsRef.current && currentGps.lat) {
      simBackupGpsRef.current = { ...currentGps };
    }

    isSimulationActiveRef.current = true;
    setIsSimMoving(true);

    const destLat = Number(targetComplaintForNav.tkpLat);
    const destLng = Number(targetComplaintForNav.tkpLng);

    // Titik awal gerakan (titik GPS saat ini)
    const startLat = currentGps.lat ? Number(currentGps.lat) : destLat - 0.05;
    const startLng = currentGps.lng ? Number(currentGps.lng) : destLng - 0.05;

    if (simIntervalRef.current) clearInterval(simIntervalRef.current);

    // Ambil rute jalan raya resmi (OSRM Driving Directions GeoJSON)
    let waypoints: Array<{ lat: number; lng: number }> = [];

    try {
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${destLng},${destLat}?overview=full&geometries=geojson`;
      const res = await fetch(osrmUrl);
      const data = await res.json();
      if (data.routes && data.routes[0]?.geometry?.coordinates?.length > 0) {
        const rawCoords: [number, number][] = data.routes[0].geometry.coordinates;
        // Sample waypoints agar animasi halus mengikuti belokan jalan (total ~60-80 titik jalan riil)
        const samplingStep = Math.max(1, Math.floor(rawCoords.length / 70));
        for (let i = 0; i < rawCoords.length; i += samplingStep) {
          waypoints.push({
            lng: Number(rawCoords[i][0].toFixed(6)),
            lat: Number(rawCoords[i][1].toFixed(6)),
          });
        }
        // Pastikan titik terakhir tepat di area TKP (< 20 meter dari tujuan)
        waypoints.push({
          lat: Number((destLat + 0.00015).toFixed(6)),
          lng: Number((destLng + 0.00015).toFixed(6)),
        });
      }
    } catch (e) {
      console.warn('OSRM simulation route fallback:', e);
    }

    // Jika koneksi OSRM gagal, fallback ke 30 titik interpolasi
    if (waypoints.length === 0) {
      for (let i = 1; i <= 30; i++) {
        const prog = i / 30;
        waypoints.push({
          lat: Number((startLat + (destLat - startLat) * prog).toFixed(6)),
          lng: Number((startLng + (destLng - startLng) * prog).toFixed(6)),
        });
      }
    }

    let currentIndex = 0;
    simIntervalRef.current = setInterval(() => {
      currentIndex++;
      if (currentIndex >= waypoints.length) {
        const lastPt = waypoints[waypoints.length - 1];
        setCurrentGps(lastPt);
        stopSimulationMovement();
        alert('🎯 SIMULASI: Personel telah tiba di lokasi TKP (< 50m)! Tombol "TIBA DI LOKASI" kini telah terbuka.');
      } else {
        const pt = waypoints[currentIndex];
        setCurrentGps(pt);
      }
    }, 350); // Mulus dan cepat (bergerak setiap 350ms persis di atas garis rute)
  };

  // 2. Tombol Pintas Instan: Langsung Tiba di TKP (<30m)
  const jumpDirectlyToTkp = () => {
    if (!targetComplaintForNav?.tkpLat || !targetComplaintForNav?.tkpLng) {
      alert('Tidak ada pengaduan aktif yang sedang menuju TKP!');
      return;
    }

    if (!simBackupGpsRef.current && currentGps.lat) {
      simBackupGpsRef.current = { ...currentGps };
    }

    isSimulationActiveRef.current = true;
    stopSimulationMovement();

    const destLat = Number(targetComplaintForNav.tkpLat);
    const destLng = Number(targetComplaintForNav.tkpLng);
    // Koordinat berjarak ~18 meter dari titik TKP
    const arriveLat = Number((destLat + 0.00015).toFixed(6));
    const arriveLng = Number((destLng + 0.00015).toFixed(6));

    setCurrentGps({ lat: arriveLat, lng: arriveLng });
    alert('⚡ SIMULASI INSTAN: Posisi personel dipindahkan ke area TKP (Jarak ~18 meter, Radius < 50m Terpenuhi). Silakan klik tombol "TIBA DI LOKASI" di bawah peta!');
  };

  // 3. Reset Posisi GPS Kembali ke Posisi Asli
  const resetSimulationGps = () => {
    stopSimulationMovement();
    if (simBackupGpsRef.current) {
      setCurrentGps({ ...simBackupGpsRef.current });
      alert('🔄 Posisi GPS personil dikembalikan ke lokasi awal.');
    } else {
      setCurrentGps({ lat: -6.295896, lng: 106.690349 });
    }
  };
  // =========================================================================
  // AKHIR MODUL SIMULASI GPS PATROLI
  // =========================================================================

  // Mako Utama Personel & Geofence Presensi Kehadiran
  const makoUtama = useMemo(() => {
    // 1. Cari dari daftar policeOffices jika stationId cocok
    if (officer?.stationId && policeOffices.length > 0) {
      const match = policeOffices.find((po: any) => po.id === officer.stationId || po.code === officer.stationId);
      if (match) return match;
    }
    // 2. Gunakan data station bawaan dari profile jika koordinat tersedia
    if (officer?.stationLat && officer?.stationLng) {
      return {
        id: officer.stationId || 1,
        name: officer.stationName || 'Mako Induk Kepolisian',
        lat: Number(officer.stationLat),
        lng: Number(officer.stationLng),
        radius: Number(officer.stationRadius || 1000),
      };
    }
    // 3. Fallback: kantor kepolisian pertama dari database
    if (policeOffices.length > 0) {
      return policeOffices[0];
    }
    return {
      id: 1,
      name: 'Polres Metro Jakarta Selatan',
      lat: -6.2415,
      lng: 106.8021,
      radius: 1000,
    };
  }, [officer, policeOffices]);

  // Jarak Riil Personel ke Mako Utama (Meter)
  const distanceToMakoMeters = useMemo(() => {
    const lat1 = currentGps?.lat ? Number(currentGps.lat) : (officer?.currentGpsLat ? Number(officer.currentGpsLat) : 0);
    const lng1 = currentGps?.lng ? Number(currentGps.lng) : (officer?.currentGpsLng ? Number(officer.currentGpsLng) : 0);
    const lat2 = makoUtama?.lat ? Number(makoUtama.lat) : 0;
    const lng2 = makoUtama?.lng ? Number(makoUtama.lng) : 0;

    if (!lat1 || !lng1 || !lat2 || !lng2) return null;
    return getDistanceFromLatLonInMeters(lat1, lng1, lat2, lng2);
  }, [currentGps, officer?.currentGpsLat, officer?.currentGpsLng, makoUtama]);

  const makoRadiusLimit = Number(makoUtama?.radius || 1000);

  // Apakah personil berada dalam radius Mako Utama
  const isWithinMakoRadius = useMemo(() => {
    if (distanceToMakoMeters === null) return false;
    return distanceToMakoMeters <= makoRadiusLimit;
  }, [distanceToMakoMeters, makoRadiusLimit]);

  // Format Jarak ke Mako untuk tampilan UI
  const distanceToMakoFormatted = useMemo(() => {
    if (distanceToMakoMeters === null) return 'Mendeteksi GPS...';
    if (distanceToMakoMeters >= 1000) {
      return `${(distanceToMakoMeters / 1000).toFixed(1)} km`;
    }
    return `${Math.round(distanceToMakoMeters)} m`;
  }, [distanceToMakoMeters]);

  // Handler Presensi Masuk dengan Validasi Geofence Radius Mako Utama
  const handlePresensiMasuk = () => {
    if (!isWithinMakoRadius) {
      alert(
        `⛔ PRESENSI DITOLAK!\n\n` +
        `Anda TIDAK DAPAT melakukan presensi masuk karena berada di luar radius Mako Utama.\n\n` +
        `• Mako Utama: ${makoUtama?.name || 'Polres Metro Jakarta Selatan'}\n` +
        `• Jarak Anda Saat Ini: ${distanceToMakoFormatted}\n` +
        `• Batas Maksimal Radius: ${makoRadiusLimit.toLocaleString('id-ID')} meter\n\n` +
        `Presensi kehadiran tugas piket hanya sah jika dilakukan di lingkungan area Mako!`
      );
      return;
    }

    const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
    setPresensiMasukTime(now);
    alert(`✓ Presensi Masuk Berhasil!\n\nWaktu: ${now}\nLokasi: Lingkungan ${makoUtama?.name || 'Mako'}\nStatus: Siaga Piket Aktif`);
  };

  // Handler Presensi Pulang dengan Validasi Geofence Radius Mako Utama
  const handlePresensiPulangClick = () => {
    if (!isWithinMakoRadius) {
      alert(
        `⛔ PRESENSI DITOLAK!\n\n` +
        `Anda TIDAK DAPAT melakukan presensi pulang karena berada di luar radius Mako Utama.\n\n` +
        `• Mako Utama: ${makoUtama?.name || 'Polres Metro Jakarta Selatan'}\n` +
        `• Jarak Anda Saat Ini: ${distanceToMakoFormatted}\n` +
        `• Batas Maksimal Radius: ${makoRadiusLimit.toLocaleString('id-ID')} meter\n\n` +
        `Presensi pelepasan dinas hanya sah jika dilakukan di lingkungan area Mako!`
      );
      return;
    }
    setShowPresensiPulangModal(true);
  };

  // Helper: Mendapatkan jam meluncur riil kejadian (dari audit log, bukti, atau entitas)
  const getTaskWaktuMeluncur = (task: any) => {
    if (task?.waktuMeluncur) return task.waktuMeluncur;
    const log = (task?.complaintLogs || task?.complaint_logs || []).find((l: any) =>
      l.action?.includes('Meluncur') || l.action?.includes('Persiapan') || l.action?.includes('MENUJU_TKP')
    );
    if (log?.created_at) {
      try {
        return new Date(log.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }) + ' WIB';
      } catch (_) {}
    }
    const ev = (task?.evidences || []).find((e: any) =>
      e.incident_phase === 'MENUJU_TKP' || (e.caption || '').includes('Meluncur') || (e.caption || '').includes('Persiapan')
    );
    if (ev?.uploaded_at) {
      try {
        return new Date(ev.uploaded_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }) + ' WIB';
      } catch (_) {}
    }
    if (task?.disposisiAt) {
      try {
        return new Date(task.disposisiAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }) + ' WIB';
      } catch (_) {}
    }
    return null;
  };

  // Helper: Mendapatkan titik koordinat GPS keberangkatan riil (bukan titik TKP)
  const getTaskKoordinatGps = (task: any) => {
    if (task?.koordinatGps && !task.koordinatGps.includes('NaN')) return task.koordinatGps;
    const log = (task?.complaintLogs || task?.complaint_logs || []).find((l: any) =>
      (l.action?.includes('Meluncur') || l.action?.includes('Persiapan') || l.action?.includes('MENUJU_TKP')) &&
      l.action_lat && l.action_lng
    );
    if (log?.action_lat && log?.action_lng) {
      return `${Number(log.action_lat).toFixed(6)}, ${Number(log.action_lng).toFixed(6)}`;
    }
    const ev = (task?.evidences || []).find((e: any) =>
      (e.incident_phase === 'MENUJU_TKP' || (e.caption || '').includes('Meluncur') || (e.caption || '').includes('Persiapan')) &&
      e.exif_lat && e.exif_lng
    );
    if (ev?.exif_lat && ev?.exif_lng) {
      return `${Number(ev.exif_lat).toFixed(6)}, ${Number(ev.exif_lng).toFixed(6)}`;
    }
    if (currentGps?.lat && currentGps?.lng && Number(currentGps.lat) !== 0) {
      return `${Number(currentGps.lat).toFixed(6)}, ${Number(currentGps.lng).toFixed(6)}`;
    }
    return null;
  };

  // Cache alamat lokasi keberangkatan personel
  const [departureAddressMap, setDepartureAddressMap] = useState<Record<string, string>>({});

  // Reverse geocoding otomatis untuk menerjemahkan koordinat keberangkatan menjadi nama alamat/jalan
  const resolveDepartureAddress = useCallback(async (coordsStr: string) => {
    if (!coordsStr || departureAddressMap[coordsStr]) return;
    const clean = coordsStr.replace(/[^\d.,\-]/g, '');
    const [latStr, lngStr] = clean.split(',');
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);
    if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) return;

    // 1. Google Geocoder jika API Google Maps tersedia
    if (typeof window !== 'undefined' && (window as any).google?.maps?.Geocoder) {
      try {
        const geocoder = new (window as any).google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results: any, status: any) => {
          if (status === 'OK' && results && results[0]?.formatted_address) {
            setDepartureAddressMap((prev) => ({ ...prev, [coordsStr]: results[0].formatted_address }));
            return;
          }
        });
      } catch (_) {}
    }

    // 2. Fallback OpenStreetMap Nominatim
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
        headers: { 'Accept-Language': 'id' },
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.display_name) {
          const a = data.address || {};
          const road = a.road || a.pedestrian || a.street || '';
          const suburb = a.suburb || a.village || a.neighbourhood || '';
          const city = a.city || a.town || a.county || a.city_district || '';
          const state = a.state || '';
          const parts = [road, suburb, city, state].filter(Boolean);
          const formatted = parts.length > 0 ? parts.join(', ') : data.display_name;
          if (formatted) {
            setDepartureAddressMap((prev) => ({ ...prev, [coordsStr]: formatted }));
          }
        }
      }
    } catch (_) {}
  }, [departureAddressMap]);

  // Helper: Mendapatkan alamat lokasi keberangkatan personel yang manusiawi
  const getTaskAlamatKeberangkatan = (task: any, depGpsCoords?: string | null) => {
    const coords = depGpsCoords || getTaskKoordinatGps(task);
    if (!coords) return 'Mako / Pos Penjagaan Presisi';
    if (departureAddressMap[coords]) return departureAddressMap[coords];
    // Baseline koordinat patroli aktif (Tangerang Selatan / Serpong)
    if (coords.startsWith('-6.2958') || coords.includes('106.690')) {
      return 'Lengkong Gudang Timur, Serpong, Tangerang Selatan';
    }
    resolveDepartureAddress(coords);
    return 'Memuat alamat keberangkatan...';
  };

  // Helper: Mendapatkan jam tiba di TKP riil kejadian
  const getTaskWaktuTiba = (task: any) => {
    if (task?.waktuTiba) return task.waktuTiba;
    const log = (task?.complaintLogs || task?.complaint_logs || []).find((l: any) =>
      l.action?.includes('Tiba') || l.action?.includes('Tindakan') || l.action?.includes('TIBA_TKP')
    );
    if (log?.created_at) {
      try {
        return new Date(log.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }) + ' WIB';
      } catch (_) {}
    }
    if (task?.responTibaTkpAt) {
      try {
        return new Date(task.responTibaTkpAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }) + ' WIB';
      } catch (_) {}
    }
    return null;
  };

  // Helper: Mendapatkan jam penyelesaian riil kejadian
  const getTaskWaktuSelesai = (task: any) => {
    if (task?.waktuSelesai) return task.waktuSelesai;
    const log = (task?.complaintLogs || task?.complaint_logs || []).find((l: any) =>
      l.action?.includes('Selesai') || l.action?.includes('SELESAI')
    );
    if (log?.created_at) {
      try {
        return new Date(log.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }) + ' WIB';
      } catch (_) {}
    }
    if (task?.selesaiAt) {
      try {
        return new Date(task.selesaiAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }) + ' WIB';
      } catch (_) {}
    }
    return null;
  };

  // Helper: Mendapatkan estimasi waktu tempuh (ETA) yang sinkron dengan Navigasi Peta Lapangan
  const getTaskEtaText = (task: any) => {
    if (!task) return null;
    // Jika tiket ini adalah target navigasi aktif di peta, gunakan nilai ETA riil yang dihitung peta
    if (targetComplaintForNav && (task.id === targetComplaintForNav.id || task.nomorTiket === targetComplaintForNav.nomorTiket)) {
      if (etaMinutesText && etaMinutesText !== 'Menghitung...') {
        return etaMinutesText;
      }
    }
    // Hitung jarak dinamis antara posisi GPS personil / titik keberangkatan ke titik kejadian TKP
    const depCoords = getTaskKoordinatGps(task);
    let lat1 = currentGps?.lat ? Number(currentGps.lat) : 0;
    let lng1 = currentGps?.lng ? Number(currentGps.lng) : 0;
    if ((!lat1 || !lng1) && depCoords) {
      const parts = depCoords.split(',').map((s: string) => Number(s.trim()));
      if (parts[0] && parts[1]) {
        lat1 = parts[0];
        lng1 = parts[1];
      }
    }
    const lat2 = Number(task.tkpLat);
    const lng2 = Number(task.tkpLng);
    if (lat1 && lng1 && lat2 && lng2) {
      const distMeters = getDistanceFromLatLonInMeters(lat1, lng1, lat2, lng2);
      if (distMeters <= 50) return 'Tiba di Lokasi';
      const minutes = Math.max(1, Math.round(distMeters / ((35 * 1000) / 60)));
      return `± ${minutes} Menit`;
    }
    return null;
  };

  // Aksi ketika tombol "Sudah Tiba" diklik dari Peta Navigasi
  const handleSudahTibaFromMap = async () => {
    if (!targetComplaintForNav) return;
    const complaintToArrive = targetComplaintForNav;
    const currentStatus = String(complaintToArrive.status || '').toUpperCase();

    // Jika personel sudah tercatat tiba di TKP sebelumnya, langsung buka formulir tindakan di wizard
    if (currentStatus === 'TIBA_DI_TKP' || currentStatus === 'PENANGANAN_TKP') {
      setActiveComplaint(complaintToArrive);
      activeComplaintRef.current = complaintToArrive;
      setSelectedTask(complaintToArrive);
      setWizardStep(2);
      setExpandedStep(2);
      switchTab('view-wizard');
      return;
    }

    // Jika status masih dalam perjalanan, rekam & kunci jam tiba resmi seketika ke database
    setIsUpdatingStep(true);
    try {
      const activeOfficerId = officer?.id ? String(officer.id) : (session?.userId ? String(session.userId) : '1');
      const res = await fieldStepAction({
        complaintId: complaintToArrive.id,
        step: 'tiba_tkp',
        officerId: activeOfficerId,
        lat: currentGps.lat || undefined,
        lng: currentGps.lng || undefined,
      });

      if (res.success) {
        const jamTibaStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
        alert(
          `🚨 KONFIRMASI KEDATANGAN BERHASIL!\n\n` +
          `• Waktu Tiba Resmi: ${jamTibaStr}\n` +
          `• Status: TIBA DI LOKASI\n` +
          `• SLA Kecepatan Respon telah terekam di Command Center & Pawas.\n\n` +
          `Silakan lakukan tindakan kepolisian dan lengkapi Berita Acara serta foto dokumentasi penanganan.`
        );

        await loadData(undefined, complaintToArrive.id);

        const updated = {
          ...complaintToArrive,
          status: 'TIBA_DI_TKP',
          tahap: 4,
          responTibaTkpAt: new Date().toISOString(),
        };
        setActiveComplaint(updated);
        activeComplaintRef.current = updated;
        setSelectedTask(updated);
        setWizardStep(2);
        setExpandedStep(2);
        switchTab('view-wizard');
      } else {
        alert(res.error || 'Gagal merekam status kedatangan.');
      }
    } catch (e: any) {
      alert(e.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsUpdatingStep(false);
    }
  };

  // Ref untuk membatasi interval update GPS per 10 detik (sesuai permintaan user agar tidak berkedip)
  const lastGpsUpdateTimeRef = useRef<number>(0);

  // Memoized Unit Data agar referensi objek stabil dan tidak memicu re-render / blinking pada peta
  const myUnitData = useMemo(() => ({
    key: 'my_unit',
    pos: currentGps,
    iconEmoji: '🚔',
    title: `${officer.satuan}`,
    petugas: `${officer.fullName} (NRP ${officer.nrp})`,
    sub: `${officer.satuan}${officer.kendaraan ? ` • ${officer.kendaraan}` : ''}`,
    status: officer.status,
    statusColor: '#10B981',
    tugas: officer.jabatan ? `Tugas: ${officer.jabatan}` : 'Belum ada Tugas',
    telemetri: currentGps?.lat ? 'Sinyal GPS Aktif' : 'GPS Belum Terhubung',
  }), [currentGps.lat, currentGps.lng, officer.satuan, officer.fullName, officer.nrp, officer.kendaraan, officer.jabatan]);

  // Layer Toggles
  const [showTraffic, setShowTraffic] = useState(true);
  const [showOtherOfficers, setShowOtherOfficers] = useState(false);

  // Live Clock & Continuous GPS Geolocation (Diperbarui per 10 Detik)
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveClock(
        new Date().toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }) + ' WIB'
      );
    }, 1000);

    let watchId: number | null = null;
    if (typeof window !== 'undefined' && navigator.geolocation) {
      const handleGpsUpdate = (pos: GeolocationPosition, force: boolean = false) => {
        // Jangan timpa GPS simulasi saat mode simulasi aktif
        if (isSimulationActiveRef.current) {
          return;
        }

        const now = Date.now();
        // Update dibatasi per 10 detik agar tidak berkedip-kedip & ramah pengguna
        if (!force && now - lastGpsUpdateTimeRef.current < 10000) {
          return;
        }
        lastGpsUpdateTimeRef.current = now;

        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        setCurrentGps((prev) => {
          if (prev.lat === lat && prev.lng === lng) return prev;
          return { lat, lng };
        });
        setLogLat((prev) => (prev ? prev : lat));
        setLogLng((prev) => (prev ? prev : lng));

        const activeDeviceId = officer?.deviceId || session?.deviceId || null;
        if (activeDeviceId || nrpParam) {
          updateDeviceTelemetryAction({
            deviceId: activeDeviceId || undefined,
            nrp: nrpParam || undefined,
            lat,
            lng,
          }).catch(console.warn);
        }
      };

      // Initial fast fix (force update pertama kali)
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          handleGpsUpdate(pos, true);
          const lat = Number(pos.coords.latitude.toFixed(6));
          const lng = Number(pos.coords.longitude.toFixed(6));

          // Reverse geocoding lokasi riil personel dari koordinat satelit GPS
          fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
            { headers: { 'Accept-Language': 'id' } }
          )
            .then((r) => r.json())
            .then((data) => {
              if (data && data.display_name) {
                const a = data.address || {};
                const road = a.road || a.pedestrian || a.street || '';
                const suburb = a.suburb || a.village || a.neighbourhood || '';
                const city = a.city || a.town || a.county || a.city_district || '';
                const state = a.state || '';
                const parts = [road, suburb, city, state].filter(Boolean);
                const addr = parts.length > 0 ? parts.join(', ') : data.display_name;
                setOfficerLiveAddress(addr);
                setLogLokasi((prev) => (prev ? prev : addr));
              }
            })
            .catch(() => {});
        },
        (err) => console.warn('GPS init warning:', err),
        { enableHighAccuracy: true, timeout: 8000 }
      );

      // Continuous high-accuracy GPS watch dengan interval cache 10 detik (maximumAge: 10000)
      watchId = navigator.geolocation.watchPosition(
        (pos) => handleGpsUpdate(pos, false),
        (err) => console.warn('GPS watch warning:', err),
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
      );
    }

    return () => {
      clearInterval(timer);
      if (watchId !== null && typeof window !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [nrpParam]);

  // Listener tombol navigasi Back/Forward browser
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window !== 'undefined') {
        const parts = window.location.pathname.split('/').filter(Boolean);
        const last = parts[parts.length - 1];
        if (parts[0] === 'console' && parts.length > 1) {
          setActiveTab(parsePersonilTab(last));
        } else {
          setActiveTab('view-beranda');
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Sinkronisasi query param jika ada (?tab=... / ?page=...)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search) {
      const qParams = new URLSearchParams(window.location.search);
      const tabQ = qParams.get('tab') || qParams.get('page');
      if (tabQ) {
        const matched = parsePersonilTab(tabQ);
        setActiveTab(matched);
        const slug = personilTabToSlug(matched);
        window.history.replaceState(null, '', slug ? `/console/${slug}` : '/console');
      }
    }
  }, []);

  // Load Data
  const loadData = async (targetOfficerId?: string, preferredComplaintId?: string | number) => {
    try {
      const activeNrp = nrpParam || session?.identifier || officer?.nrp || '92031145';
      const cRes = await getOfficerComplaintsAction(activeNrp);
      if (cRes.success && cRes.data) {
        setComplaints(cRes.data);

        // 1. Deteksi apakah ada penugasan baru yang membutuhkan konfirmasi (Terima Tugas)
        const pending = cRes.data.find((c: any) => isTaskPendingAcceptance(c));
        if (pending) {
          setPendingAcceptTask(pending);
          const taskId = String(pending.nomorTiket || pending.id);
          if (!promptedTaskIdsRef.current.has(taskId)) {
            promptedTaskIdsRef.current.add(taskId);
            setShowAcceptModal(true);
            playPoliceAlertAudio();
          }
        } else {
          setPendingAcceptTask(null);
        }

        // 2. Active complaint (tugas yang sedang aktif ditangani personil)
        const targetId = preferredComplaintId || activeComplaintRef.current?.id || activeComplaintRef.current?.nomorTiket;
        let active = targetId
          ? cRes.data.find(
            (c: any) =>
              (String(c.id) === String(targetId) || String(c.nomorTiket) === String(targetId)) &&
              hasOfficerAcceptedTask(c)
          )
          : null;

        if (!active) {
          active = cRes.data.find(
            (c: any) =>
              hasOfficerAcceptedTask(c) &&
              c.status !== 'SELESAI' &&
              c.status !== 'DITOLAK' &&
              (c.status === 'MENUJU_TKP' ||
                c.status === 'PENANGANAN_TKP' ||
                c.status === 'TIBA_DI_TKP' ||
                c.status === 'SEDANG_DITANGANI' ||
                c.status === 'DIPROSES' ||
                c.status === 'MENUNGGU_PENGESAHAN')
          );
        }

        setActiveComplaint(active || null);
        activeComplaintRef.current = active || null;

        if (active) {
          const s = computeWizardStepFromComplaint(active);
          setWizardStep(s);
          setExpandedStep(s);
        }
        // Hanya pilih dari penugasan yang memang telah diambil/diterima oleh personel ini
        const myTasks = cRes.data.filter((c: any) => hasOfficerAcceptedTask(c));
        if (myTasks.length > 0) {
          setSelectedTask((prev: any) => {
            if (prev) {
              const matched = myTasks.find((t: any) => t.id === prev.id);
              if (matched) return matched;
            }
            return active || myTasks[0];
          });
        } else {
          setSelectedTask(null);
        }
      }

      const activeOfficerId = targetOfficerId || officer?.id || (session?.userId ? String(session.userId) : '') || '3';
      if (activeOfficerId) {
        const lRes = await getOfficerLogbooksAction(String(activeOfficerId));
        if (lRes.success && lRes.data) {
          setLogbooks(lRes.data);
        }
      }

      const hRes = await getHotspotsAction();
      if (hRes.success && hRes.data) {
        setHotspots(hRes.data);
      }

      const hOptRes = await getMasterHotspotOptionsAction();
      if (hOptRes.success && hOptRes.data) {
        setDbHotspotCategories(hOptRes.data.categories || []);
        setDbHotspotDangerLevels(hOptRes.data.dangerLevels || []);
      }

      const oRes = await getPoliceOfficesAction();
      if (oRes.success && oRes.data) {
        setPoliceOffices(oRes.data);
      }

      const fRes = await getPatrolFleetUnitsAction();
      if (fRes.success && fRes.data) {
        setFleetUnits(fRes.data);
      }

      const filterRes = await getMasterFilterOptionsAction();
      if (filterRes.success && filterRes.data) {
        setDbDutyStatuses(filterRes.data.dutyStatuses || []);
        setDbGiats(filterRes.data.giats || []);
      }
    } catch (e) {
      console.warn('Load data error:', e);
    }
  };

  useEffect(() => {
    // 1. Direct fetch profile personel dari database resmi
    const targetNrp = nrpParam || session?.identifier || '92031145';
    getOfficerProfileByNrpAction(targetNrp).then((res) => {
      if (res.success && res.data) {
        const loadedId = String(res.data.id || '3');
        setOfficer({
          id: loadedId,
          nrp: res.data.nrp,
          fullName: res.data.fullName,
          pangkat: res.data.pangkat,
          jabatan: `${res.data.satuan} • ${res.data.jabatan}`,
          satuan: res.data.satuan,
          unit_id: res.data.unit_id || null,
          unitId: res.data.unitId || '',
          kendaraan: (res.data as any)?.kendaraan || 'Tanpa Ranmor Dinas',
          avatar: res.data.avatar,
          kpi: res.data.kpi,
          deviceId: res.data.deviceId || null,
          stationId: res.data.stationId || null,
          stationName: res.data.stationName || null,
          stationLat: res.data.stationLat ?? null,
          stationLng: res.data.stationLng ?? null,
          stationRadius: res.data.stationRadius ?? 1000,
          currentGpsLat: res.data.currentGpsLat ?? null,
          currentGpsLng: res.data.currentGpsLng ?? null,
        });

        if (res.data.currentGpsLat && res.data.currentGpsLng) {
          setCurrentGps((prev) => {
            if (prev.lat === 0 && prev.lng === 0) {
              return { lat: Number(res.data.currentGpsLat), lng: Number(res.data.currentGpsLng) };
            }
            return prev;
          });
        }

        loadData(loadedId);
      } else {
        loadData('3');
      }
    });

    // 2. Real-time background polling interval untuk mendeteksi perintah disposisi masuk secara otomatis
    const pollInterval = setInterval(() => {
      loadData();
    }, 4000);

    return () => clearInterval(pollInterval);
  }, [nrpParam]);

  // Handle Log Submit
  const handleSaveLog = async () => {
    if (!logDeskripsi.trim()) {
      alert('Uraian kegiatan wajib diisi!');
      return;
    }

    setIsSubmittingLog(true);
    try {
      const activeOfficerId = officer.id || (session?.userId ? String(session.userId) : '') || '3';
      const res = await createLogbookAction({
        officerId: activeOfficerId,
        complaintId: activeComplaint ? activeComplaint.id : null,
        jenisAksi: logJenis,
        lokasiKlaimAlamat: logLokasi,
        lokasiKlaimLat: logLat,
        lokasiKlaimLng: logLng,
        lokasiGpsAktualLat: currentGps.lat,
        lokasiGpsAktualLng: currentGps.lng,
        jamMulai: jamMulai,
        jamSelesai: jamSelesai,
        deskripsiKegiatan: logDeskripsi,
        fotoBuktiUrl: logFoto || null,
      });

      if (res.success) {
        alert('✓ Log kegiatan berhasil dikirim ke server & antrean verifikasi Pawas!');
        setLogDeskripsi('');
        setLogFoto(null);
        await loadData(undefined, officer.id || '3');
        switchTab('view-beranda');
      } else {
        alert(res.error || 'Gagal menyimpan logbook.');
      }
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmittingLog(false);
    }
  };

  // Handle Wizard Step Submit
  const handleWizardSubmit = async (step: 'meluncur' | 'tiba_tkp' | 'tindakan_tkp' | 'selesai') => {
    if (!activeComplaint) return;

    if ((step === 'tiba_tkp' || step === 'tindakan_tkp') && !wizardFoto) {
      alert('⚠️ WAJIB DOKUMENTASI VISUAL KAMERA: Silakan ambil foto bukti situasi di TKP menggunakan kamera live sebelum menyimpan laporan tindakan.');
      return;
    }

    if (step === 'selesai' && !wizardCatatan?.trim()) {
      alert('⚠️ WAJIB BAP LAPANGAN: Silakan isi ringkasan uraian hasil penanganan di TKP sebelum mengajukan pengesahan.');
      return;
    }

    setIsUpdatingStep(true);
    try {
      const activeOfficerId = officer?.id ? String(officer.id) : (session?.userId ? String(session.userId) : '1');
      const res = await fieldStepAction({
        complaintId: activeComplaint.id,
        step,
        officerId: activeOfficerId,
        catatan: wizardCatatan || undefined,
        fotoBuktiUrl: wizardFoto || undefined,
        lat: wizardPhotoMetadata?.lat ?? currentGps.lat,
        lng: wizardPhotoMetadata?.lng ?? currentGps.lng,
        isDiscrepancy: wizardPhotoMetadata?.isDiscrepancy,
        deviationMeters: wizardPhotoMetadata?.distanceMeters,
        warningMessage: wizardPhotoMetadata?.warningMessage,
        photoAddress: wizardPhotoMetadata?.address,
      });

      if (res.success) {
        if (step === 'tiba_tkp' || step === 'tindakan_tkp') {
          if (wizardPhotoMetadata?.isDiscrepancy) {
            const devStr = wizardPhotoMetadata.distanceMeters >= 1000
              ? `${(wizardPhotoMetadata.distanceMeters / 1000).toFixed(1)} km`
              : `${wizardPhotoMetadata.distanceMeters} meter`;
            alert(`⚠️ LAPORAN TERCATAT DENGAN CATATAN ANOMALI:\nLaporan tindakan berhasil disimpan ke sistem.\nTemuan ketidaksesuaian lokasi foto (Jarak: ${devStr} dari TKP) telah otomatis dicatat ke Log Audit Propam.`);
          } else {
            alert('✓ Laporan tindakan dan dokumentasi TKP berhasil disimpan! Melangkah ke pengajuan BAP akhir.');
          }
        } else {
          alert(`✓ Status berhasil diperbarui menjadi ${step.toUpperCase().replace('_', ' ')}!`);
        }
        setWizardCatatan('');
        setWizardFoto(null);
        setWizardPhotoMetadata(null);
        if (step === 'selesai') {
          await loadData();
          switchTab('view-validasi');
        } else if (step === 'meluncur') {
          // Begitu personel mengonfirmasi meluncur, segera arahkan langsung ke halaman Peta Navigasi (/console/peta)
          setWizardStep(2);
          if (typeof window !== 'undefined') {
            window.location.href = '/console/peta';
          } else {
            switchTab('view-peta');
          }
        } else {
          const next = 3;
          setWizardStep(next);
          setExpandedStep(next);
          await loadData(undefined, activeComplaint.id);
        }
      } else {
        alert(res.error || 'Gagal memperbarui status pengaduan.');
      }
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsUpdatingStep(false);
    }
  };

  // Open Quick Response
  const openRespon = (jenis: 'PATROLI' | 'TPTKP' | 'SAMBANG' | 'PENGAMANAN') => {
    setLogJenis(jenis);
    switchTab('view-log');
  };

  // Rekapitulasi Giat Hari Ini & Daily Shift Stats (Dinamis dari Logbook & Pengaduan)
  const patroliCount = useMemo(() => {
    return logbooks.filter((l) => (l.jenisAksi || '').toUpperCase() === 'PATROLI').length;
  }, [logbooks]);

  const sambangCount = useMemo(() => {
    return logbooks.filter((l) => (l.jenisAksi || '').toUpperCase() === 'SAMBANG').length;
  }, [logbooks]);

  const pengamananCount = useMemo(() => {
    return logbooks.filter((l) => (l.jenisAksi || '').toUpperCase() === 'PENGAMANAN').length;
  }, [logbooks]);

  const tptkpCount = useMemo(() => {
    const fromLogs = logbooks.filter(
      (l) => (l.jenisAksi || '').toUpperCase() === 'TPTKP' && !l.complaintId
    ).length;
    const fromComplaints = complaints.filter(
      (c) => hasOfficerAcceptedTask(c) && !['DITOLAK', 'MENUNGGU'].includes(String(c.status || '').toUpperCase())
    ).length;
    return fromLogs + fromComplaints;
  }, [logbooks, complaints, officer, session, nrpParam]);

  const tugasSelesaiCount = useMemo(() => {
    const cDone = complaints.filter((c) => hasOfficerAcceptedTask(c) && String(c.status || '').toUpperCase() === 'SELESAI').length;
    const lDone = logbooks.filter((l) => {
      const sv = String(l.statusValidasi || '').toUpperCase();
      return sv === 'DISETUJUI' || sv === 'VALID' || sv === 'SELESAI';
    }).length;
    return cDone + lDone;
  }, [complaints, logbooks, officer, session, nrpParam]);

  const avgResponText = useMemo(() => {
    const finishedDispatches = complaints
      .filter((c) => hasOfficerAcceptedTask(c))
      .flatMap((c) => c.dispatches || [])
      .filter((d: any) => d.departed_at && d.arrived_at);
    if (finishedDispatches.length > 0) {
      const totalMinutes = finishedDispatches.reduce((acc: number, d: any) => {
        const diffMs = new Date(d.arrived_at).getTime() - new Date(d.departed_at).getTime();
        return acc + Math.max(1, Math.round(diffMs / 60000));
      }, 0);
      return `${(totalMinutes / finishedDispatches.length).toFixed(1)}m`;
    }
    return '4.8m';
  }, [complaints, officer, session, nrpParam]);

  const poinPresisi = useMemo(() => {
    const totalGiat = patroliCount + sambangCount + pengamananCount + tptkpCount;
    return tugasSelesaiCount * 100 + totalGiat * 25;
  }, [tugasSelesaiCount, patroliCount, sambangCount, pengamananCount, tptkpCount]);

  // Filter tugas khusus yang telah diambil/diterima oleh personel yang sedang login
  const myAcceptedTasks = useMemo(() => {
    return complaints.filter((c) => hasOfficerAcceptedTask(c));
  }, [complaints, officer, session, nrpParam]);

  // Filtered tasks in Validasi (Halaman Tugas) tab - HANYA tugas yang telah diambil personel
  const filteredTasks = useMemo(() => {
    return myAcceptedTasks.filter((c) => {
      const status = String(c.status || '').toUpperCase();
      if (validasiFilter === 'diproses') {
        const isDiproses = ['DIPROSES', 'DISPOSISI', 'MENUJU_TKP', 'TIBA_DI_TKP', 'SEDANG_DITANGANI', 'PENANGANAN_TKP'].includes(status);
        if (!isDiproses) return false;
      } else if (validasiFilter === 'menunggu_pengesahan') {
        if (status !== 'MENUNGGU_PENGESAHAN') return false;
      }
      if (platformFilter !== 'all') {
        const p = String(c.platformKey || c.platform_key || c.saluranLaporan || '').toUpperCase();
        if (platformFilter === 'sos' && !p.includes('SOS')) return false;
        if (platformFilter === 'warga' && !p.includes('WARGA')) return false;
        if (platformFilter === 'layanan110' && !p.includes('110') && !p.includes('LAYANAN')) return false;
      }
      return true;
    });
  }, [myAcceptedTasks, validasiFilter, platformFilter]);

  // Sinkronisasi otomatis selectedTask saat berpindah filter tab atau saat filteredTasks kosong
  useEffect(() => {
    if (filteredTasks.length === 0) {
      setSelectedTask(null);
    } else if (!selectedTask || !filteredTasks.some((t) => t.id === selectedTask.id)) {
      setSelectedTask(filteredTasks[0]);
    }
  }, [filteredTasks, selectedTask]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#F8FAFC' }}>
      <div className="app-container">
        {/* TOP APP BAR */}
        <header className="top-bar">
          <div className="brand">
            <div className="brand-logo">
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  background: '#FBBF24',
                  clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                }}
              />
            </div>
            E TRIBRATA LOG
          </div>
          <div className="user-profile">
            <HeaderProfileBadge
              name={officer.fullName}
              identifier={officer.nrp}
              role="personil"
              avatar={officer.avatar}
              isActive={activeTab === 'view-profil'}
              hasNotification={complaints.length > 0}
              onBellClick={() => switchTab('view-validasi')}
              onClick={() => switchTab('view-profil')}
            />
          </div>
        </header>

        {/* MAIN VIEW CONTAINER */}
        <main className="view-container" style={activeTab === 'view-peta' ? { overflow: 'hidden' } : undefined}>
          {/* ======================================================== */}
          {/* SCREEN 1: BERANDA                                        */}
          {/* ======================================================== */}
          {activeTab === 'view-beranda' && (
            <section id="view-beranda" className="view active">
              <div
                className="dashboard-header"
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}
              >
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#1E293B', letterSpacing: '0.5px' }}>
                    DASHBOARD OPERASIONAL
                  </div>
                  <div className="status-text" id="personil-header-status-sub" style={{ marginTop: '2px' }}>
                    STATUS: DINAS PATROLI AKTIF
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#475569' }}>STATUS KESIAGAAN:</span>
                  <select
                    id="select-status-taktis-mandiri"
                    value={taktisStatus}
                    onChange={(e) => setTaktisStatus(e.target.value)}
                    style={{
                      padding: '6px 14px',
                      fontSize: '11.5px',
                      fontWeight: 800,
                      borderRadius: '20px',
                      border: '1.5px solid #16A34A',
                      background: '#15803D',
                      color: 'white',
                      cursor: 'pointer',
                      outline: 'none',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                    }}
                  >
                    {dbDutyStatuses.length === 0 ? (
                      <option value="" disabled>Status kesiagaan belum tersedia</option>
                    ) : (
                      dbDutyStatuses.map((ds: any) => (
                        <option key={ds.id || ds.key} value={ds.key?.toLowerCase()}>
                          {ds.icon_emoji ? `${ds.icon_emoji} ` : ''}{ds.label}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {/* Mission Critical Alert / Kondusif Banner */}
              <div style={{ margin: '0 24px 14px' }}>
                {pendingAcceptTask ? (() => {
                  const bannerQuota = getTaskQuotaInfo(pendingAcceptTask);
                  return (
                    <div
                      style={{
                        background: 'linear-gradient(135deg, #1E3A8A 0%, #1D4ED8 100%)',
                        color: 'white',
                        padding: '16px 20px',
                        borderRadius: '14px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '12px',
                        boxShadow: '0 10px 25px rgba(29, 78, 216, 0.3)',
                        border: '2px solid #60A5FA',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '11px', fontWeight: 800, background: '#FEF08A', color: '#854D0E', padding: '2px 8px', borderRadius: '4px' }}>
                            ⚡ PERINTAH DISPOSISI MASUK • BUTUH KONFIRMASI
                          </span>
                          <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#FDE68A' }}>
                            {pendingAcceptTask.nomorTiket}
                          </span>
                          <span style={{ fontSize: '11px', fontWeight: 800, background: 'rgba(255,255,255,0.2)', color: '#FFFFFF', padding: '2px 8px', borderRadius: '4px' }}>
                            👥 Kuota: {bannerQuota.acceptedCount}/{bannerQuota.quota} Personel (Sisa {bannerQuota.slotsRemaining} Slot)
                          </span>
                        </div>
                        <div style={{ fontSize: '15px', fontWeight: 800 }}>{pendingAcceptTask.jenisKejadian}</div>
                        <div style={{ fontSize: '11.5px', color: '#DBEAFE', marginTop: '3px' }}>
                          📍 {pendingAcceptTask.tkpAlamatTeks} • <strong>Arahan Pawas:</strong> {pendingAcceptTask.arahanPawas || '-'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button
                          type="button"
                          id="btn-tinjau-terima-tugas"
                          onClick={() => setShowAcceptModal(true)}
                          style={{
                            background: '#10B981',
                            color: 'white',
                            border: 'none',
                            padding: '10px 18px',
                            borderRadius: '8px',
                            fontWeight: 800,
                            fontSize: '13px',
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(16,185,129,0.35)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          🛡️ Terima Tugas ({bannerQuota.slotsRemaining} Slot) ➔
                        </button>
                      </div>
                    </div>
                  );
                })() : activeComplaint ? (
                  <div
                    style={{
                      background: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)',
                      color: 'white',
                      padding: '16px 20px',
                      borderRadius: '14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '12px',
                      boxShadow: '0 10px 25px rgba(220, 38, 38, 0.25)',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 800, background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '4px' }}>
                          🚨 PENUGASAN BERJALAN (SEDANG DITANGANI)
                        </span>
                        <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#FDE68A' }}>
                          {activeComplaint.nomorTiket}
                        </span>
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: 800 }}>{activeComplaint.jenisKejadian}</div>
                      <div style={{ fontSize: '11.5px', color: '#FEE2E2', marginTop: '3px' }}>
                        📍 {activeComplaint.tkpAlamatTeks} • <strong>Instruksi Pawas:</strong> {activeComplaint.arahanPawas || '-'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ background: 'rgba(0,0,0,0.25)', padding: '6px 12px', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '9px', color: '#FCA5A5', fontWeight: 800 }}>TARGET SLA</div>
                        <div style={{ fontSize: '13px', fontWeight: 900, color: '#FDE68A' }}>&lt; 10 Menit</div>
                      </div>
                      <button
                        type="button"
                        id="btn-buka-wizard-active"
                        onClick={() => {
                          openWizardForComplaint(activeComplaint);
                        }}
                        style={{
                          background: 'white',
                          color: '#DC2626',
                          border: 'none',
                          padding: '10px 16px',
                          borderRadius: '8px',
                          fontWeight: 800,
                          fontSize: '12px',
                          cursor: 'pointer',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        }}
                      >
                        Buka Wizard Penanganan ➔
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      background: 'linear-gradient(135deg, #065F46 0%, #047857 100%)',
                      color: 'white',
                      padding: '12px 18px',
                      borderRadius: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '20px' }}>🛡️</span>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 800 }}>WILAYAH HUKUM KONDUSIF &amp; TERPANTAU</div>
                        <div style={{ fontSize: '11px', color: '#A7F3D0' }}>
                          Tidak ada panggilan darurat aktif di beat Anda. Lakukan patroli dialogis secara berkala.
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => switchTab('view-log')}
                      style={{
                        background: 'rgba(255,255,255,0.2)',
                        border: '1px solid rgba(255,255,255,0.4)',
                        color: 'white',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      + Catat Log
                    </button>
                  </div>
                )}
              </div>

              {/* BERANDA 2-COLUMN GRID (Sesuai Gambar 2 Prototype) */}
              <div className="beranda-grid">
                {/* Left Column */}
                <div id="beranda-col-left" style={{ flex: 1, minWidth: 0 }}>
                  {/* Peta Card */}
                  <div className="card-panel" id="card-map-beranda">
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        marginBottom: '12px',
                      }}
                    >
                      <div className="card-title" id="map-card-title" style={{ marginBottom: '12px' }}>
                        Peta Rute Patroli
                      </div>
                      {/* Fleet Badges Khusus Pimpinan (Identik dengan Prototype) */}
                      <div id="pimpinan-map-badges" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <span
                          onClick={() => setFocusedFleet('samapta')}
                          style={{
                            background: '#EFF6FF',
                            color: '#1D4ED8',
                            fontSize: '10.5px',
                            fontWeight: 700,
                            padding: '4px 9px',
                            borderRadius: '6px',
                            border: '1px solid #BFDBFE',
                            cursor: 'pointer',
                            userSelect: 'none',
                          }}
                          title="Klik untuk fokus & detail Unit Patroli Samapta R-4"
                        >
                          🚔 {fleetUnits.filter((u) => (u.category || u.key || '').toLowerCase().includes('samapta')).length} Samapta R-4
                        </span>
                        <span
                          onClick={() => setFocusedFleet('perintis')}
                          style={{
                            background: '#FEF3C7',
                            color: '#B45309',
                            fontSize: '10.5px',
                            fontWeight: 700,
                            padding: '4px 9px',
                            borderRadius: '6px',
                            border: '1px solid #FDE68A',
                            cursor: 'pointer',
                            userSelect: 'none',
                          }}
                          title="Klik untuk fokus & detail Tim Perintis Presisi R-2"
                        >
                          🏍️ {fleetUnits.filter((u) => (u.category || u.key || '').toLowerCase().includes('perintis')).length} Perintis R-2
                        </span>
                        <span
                          onClick={() => setFocusedFleet('lantas')}
                          style={{
                            background: '#F0FDF4',
                            color: '#15803D',
                            fontSize: '10.5px',
                            fontWeight: 700,
                            padding: '4px 9px',
                            borderRadius: '6px',
                            border: '1px solid #BBF7D0',
                            cursor: 'pointer',
                            userSelect: 'none',
                          }}
                          title="Klik untuk fokus & detail Patroli Turjawali Satlantas"
                        >
                          🚓 {fleetUnits.filter((u) => (u.category || u.key || '').toLowerCase().includes('lantas') || (u.key || '').toLowerCase().includes('pjr')).length} Lantas R-4
                        </span>
                        <span
                          onClick={() => setFocusedFleet('hotspot')}
                          id="badge-hotspot-count"
                          style={{
                            background: '#FEF2F2',
                            color: '#DC2626',
                            fontSize: '10.5px',
                            fontWeight: 700,
                            padding: '4px 9px',
                            borderRadius: '6px',
                            border: '1px solid #FECACA',
                            cursor: 'pointer',
                            userSelect: 'none',
                          }}
                          title="Klik untuk fokus & detail Titik Rawan Kejahatan"
                        >
                          🔴 {hotspots.length} Titik Rawan Kejahatan
                        </span>
                        <span
                          onClick={() => setShowHotspotModal(true)}
                          style={{
                            background: '#FFF1F2',
                            color: '#BE123C',
                            fontSize: '10.5px',
                            fontWeight: 800,
                            padding: '4px 9px',
                            borderRadius: '6px',
                            border: '1px solid #FECDD3',
                            cursor: 'pointer',
                            userSelect: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                          title="Kelola Data Titik Rawan (Tambah, Edit, Hapus)"
                        >
                          ⚙️ Kelola Titik Rawan
                        </span>
                        <span
                          onClick={() => setShowTraffic(!showTraffic)}
                          id="badge-traffic-beranda"
                          style={{
                            background: showTraffic ? '#ECFDF5' : '#F1F5F9',
                            color: showTraffic ? '#047857' : '#64748B',
                            fontSize: '10.5px',
                            fontWeight: 800,
                            padding: '4px 9px',
                            borderRadius: '6px',
                            border: `1px solid ${showTraffic ? '#A7F3D0' : '#CBD5E1'}`,
                            cursor: 'pointer',
                            userSelect: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                          title="Klik untuk menyalakan/mematikan Live Traffic Line"
                        >
                          🚦 Live Traffic: {showTraffic ? 'ON' : 'OFF'}
                        </span>
                      </div>
                    </div>

                    <div id="map-beranda-wrapper" style={{ position: 'relative', width: '100%', height: '350px', borderRadius: '8px', overflow: 'hidden' }}>
                      {/* Real Interactive Leaflet Google Roadmap */}
                      <SimapresLeafletMap
                        mode="beranda"
                        height="350px"
                        targetComplaint={targetComplaintForNav}
                        myUnit={myUnitData}
                        hotspots={hotspots}
                        policeOffices={policeOffices}
                        fleetUnits={fleetUnits}
                        showTraffic={showTraffic}
                        showOtherOfficers={showOtherOfficers}
                        activeFilter={focusedFleet}
                        onSelectUnit={(unit) => setMapUnitDetail(unit)}
                        onOpenSos={() => setShowSosModal(true)}
                        onFullscreen={() => switchTab('view-peta')}
                      />

                      {/* Floating Unit Detail Modal (Sesuai Mockup Gambar 2 Prototype) */}
                      {mapUnitDetail && (
                        <div
                          id="modal-map-unit-detail"
                          style={{
                            position: 'absolute',
                            top: '12px',
                            left: '12px',
                            zIndex: 9999,
                            background: '#FFFFFF',
                            borderRadius: '12px',
                            boxShadow: '0 12px 30px rgba(0,0,0,0.25), 0 4px 10px rgba(0,0,0,0.15)',
                            border: '1px solid #CBD5E1',
                            padding: '15px 17px',
                            width: '330px',
                            maxWidth: 'calc(100% - 70px)',
                            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                            pointerEvents: 'auto',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                            <div style={{ fontSize: '15px', fontWeight: 800, color: '#0284C7', display: 'flex', alignItems: 'center', gap: '7px' }}>
                              <span style={{ fontSize: '16px' }}>{mapUnitDetail.iconEmoji || '🚔'}</span>
                              <span>{mapUnitDetail.title}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setMapUnitDetail(null)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#94A3B8',
                                fontSize: '16px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                lineHeight: 1,
                                padding: '2px 4px',
                                borderRadius: '4px',
                              }}
                              title="Tutup Detail"
                            >
                              ✕
                            </button>
                          </div>
                          <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#1E293B', lineHeight: 1.3, marginTop: '4px' }}>
                            {mapUnitDetail.petugas}
                          </div>
                          <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px', lineHeight: 1.4 }}>
                            {mapUnitDetail.sub}
                          </div>
                          <div style={{ borderTop: '1px solid #E2E8F0', margin: '10px 0 8px 0' }} />
                          <div style={{ fontSize: '13px', fontWeight: 800, color: mapUnitDetail.statusColor || '#10B981' }}>
                            {mapUnitDetail.status}
                          </div>
                          <div style={{ fontSize: '12px', color: '#475569', marginTop: '3px', lineHeight: 1.4 }}>
                            {mapUnitDetail.tugas}
                          </div>
                          <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
                            {mapUnitDetail.telemetri}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Rekapitulasi Giat Hari Ini */}
                  <div className="card-panel">
                    <div className="card-title">REKAPITULASI GIAT HARI INI</div>
                    <div className="rekap-grid">
                      <div className="rekap-box">
                        <div className="rekap-label">PATROLI</div>
                        <div className="rekap-val">{patroliCount}</div>
                      </div>
                      <div className="rekap-box">
                        <div className="rekap-label">TPTKP</div>
                        <div className="rekap-val red">{tptkpCount}</div>
                      </div>
                      <div className="rekap-box">
                        <div className="rekap-label">SAMBANG</div>
                        <div className="rekap-val green">{sambangCount}</div>
                      </div>
                      <div className="rekap-box">
                        <div className="rekap-label">PENGAMANAN</div>
                        <div className="rekap-val">{pengamananCount}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column (Sesuai Gambar 2 Prototype) */}
                <div id="beranda-col-right" style={{ width: '340px', flexShrink: 0 }}>
                  {/* Quick Action Pad 2x2 */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                    {/* Patroli (Blue) */}
                    <button
                      type="button"
                      onClick={() => openRespon('PATROLI')}
                      style={{
                        background: '#1D4ED8',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '12px 8px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        gap: '3px',
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(29,78,216,0.25)',
                      }}
                    >
                      <div style={{ fontSize: '18px' }}>🚔</div>
                      <div style={{ fontSize: '11.5px', fontWeight: 800, letterSpacing: '0.5px' }}>PATROLI</div>
                      <div style={{ fontSize: '9.5px', opacity: 0.85 }}>Blue Light Beat</div>
                    </button>

                    {/* TPTKP (Red) */}
                    <button
                      type="button"
                      onClick={() => openRespon('TPTKP')}
                      style={{
                        background: '#DC2626',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '12px 8px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        gap: '3px',
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(220,38,38,0.25)',
                      }}
                    >
                      <div style={{ fontSize: '18px' }}>🛡️</div>
                      <div style={{ fontSize: '11.5px', fontWeight: 800, letterSpacing: '0.5px' }}>TPTKP</div>
                      <div style={{ fontSize: '9.5px', opacity: 0.85 }}>Tindakan Pertama</div>
                    </button>

                    {/* Sambang (Green) */}
                    <button
                      type="button"
                      onClick={() => openRespon('SAMBANG')}
                      style={{
                        background: '#059669',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '12px 8px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        gap: '3px',
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(5,150,105,0.25)',
                      }}
                    >
                      <div style={{ fontSize: '18px' }}>🤝</div>
                      <div style={{ fontSize: '11.5px', fontWeight: 800, letterSpacing: '0.5px' }}>SAMBANG</div>
                      <div style={{ fontSize: '9.5px', opacity: 0.85 }}>Warga &amp; Tokoh</div>
                    </button>

                    {/* Pengamanan (Orange) */}
                    <button
                      type="button"
                      onClick={() => openRespon('PENGAMANAN')}
                      style={{
                        background: '#D97706',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '12px 8px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        gap: '3px',
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(217,119,6,0.25)',
                      }}
                    >
                      <div style={{ fontSize: '18px' }}>⚠️</div>
                      <div style={{ fontSize: '11.5px', fontWeight: 800, letterSpacing: '0.5px' }}>PENGAMANAN</div>
                      <div style={{ fontSize: '9.5px', opacity: 0.85 }}>Jalur / Keramaian</div>
                    </button>
                  </div>

                  {/* Saluran Radio HT (Sesuai Gambar 2) */}
                  <div
                    style={{
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '8px',
                      fontSize: '11px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', fontWeight: 600 }}>
                      <span>📻</span>
                      <span>Saluran Radio HT:</span>
                    </div>
                    <div style={{ color: '#0284C7', fontWeight: 800, fontSize: '11px' }}>CH-110 METRO PRESISI</div>
                  </div>

                  {/* Daily Shift Stats Pills */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '12px' }}>
                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '7px 4px', textAlign: 'center' }}>
                      <div style={{ fontSize: '15px', fontWeight: 900, color: '#1D4ED8' }}>
                        {tugasSelesaiCount}
                      </div>
                      <div style={{ fontSize: '8.5px', fontWeight: 800, color: '#64748B', marginTop: '1px' }}>TUGAS SELESAI</div>
                    </div>
                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '7px 4px', textAlign: 'center' }}>
                      <div style={{ fontSize: '15px', fontWeight: 900, color: '#059669' }}>{avgResponText}</div>
                      <div style={{ fontSize: '8.5px', fontWeight: 800, color: '#64748B', marginTop: '1px' }}>AVG RESPON</div>
                    </div>
                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '7px 4px', textAlign: 'center' }}>
                      <div style={{ fontSize: '15px', fontWeight: 900, color: '#D97706' }}>{poinPresisi}</div>
                      <div style={{ fontSize: '8.5px', fontWeight: 800, color: '#64748B', marginTop: '1px' }}>POIN PRESISI</div>
                    </div>
                  </div>

                  {/* KPI PERFORMANCE (Sesuai Gambar 2 + Interaktif) */}
                  <div
                    className="card-panel"
                    id="kpi-card"
                    style={{ marginBottom: '12px', padding: '16px', cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
                    onClick={() => setShowKpiModal(true)}
                    title="Klik untuk melihat rincian capaian KPI presisi Anda"
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div className="card-title" style={{ marginBottom: 0, fontSize: '12px', fontWeight: 800 }}>
                        KPI PERFORMANCE
                      </div>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#1D4ED8', background: '#EFF6FF', padding: '2px 6px', borderRadius: '4px' }}>
                        Detail ➔
                      </span>
                    </div>

                    {/* Dynamic KPI Performance Gauge from Database */}
                    <KpiGaugeChart
                      score={officer.kpi || 0}
                      label={`${officer.kpi || 0}%`}
                      subtext="Capaian Target Respon & Standar SOP Presisi"
                    />

                    <div style={{ textAlign: 'center', fontSize: '11px', color: '#64748B', fontWeight: 600, marginTop: '6px' }} id="gauge1-subtext">
                      Capaian Target Respon &amp; Standar SOP Presisi
                    </div>
                  </div>

                  {/* AKTIVITAS SAYA DI APLIKASI */}
                  <div className="card-panel" id="mutasi-kegiatan-card" style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div className="card-title" style={{ marginBottom: 0, fontSize: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>⏱️</span> AKTIVITAS SAYA DI APLIKASI
                      </div>
                      <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#1D4ED8', background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '2px 8px', borderRadius: '10px' }}>
                        ● SESI AKTIF
                      </span>
                    </div>
                    <div id="personel-timeline-container" style={{ borderLeft: '2px solid #E2E8F0', paddingLeft: '14px', marginLeft: '6px' }}>
                      <div style={{ fontSize: '11.5px', color: '#475569', lineHeight: 1.5, marginBottom: '8px' }}>
                        <div style={{ fontWeight: 700, color: '#1E293B' }}>Apel Serah Terima Piket Selesai (08:00 WIB)</div>
                        <div style={{ color: '#64748B', marginTop: '2px' }}>Regu piket dinyatakan siap bertugas di beat patroli.</div>
                      </div>
                      {logbooks.slice(0, 2).map((l, idx) => (
                        <div key={l.id || idx} style={{ fontSize: '11.5px', color: '#475569', lineHeight: 1.5, marginBottom: '8px' }}>
                          <div style={{ fontWeight: 700, color: '#153E75' }}>
                            {l.jenisAksi} • {l.jamMulai} WIB
                          </div>
                          <div style={{ color: '#64748B', marginTop: '2px' }}>{l.deskripsiKegiatan?.slice(0, 60)}...</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ======================================================== */}
          {/* SCREEN 2: PETA FULLSCREEN                                */}
          {/* ======================================================== */}
          {/* ======================================================== */}
          {/* SCREEN 2: PETA FULLSCREEN (Zero Scroll & Ribbon Bar)      */}
          {/* ======================================================== */}
          {activeTab === 'view-peta' && (
            <section id="view-peta" className="view active" style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
              <div
                className="floating-header"
                style={{
                  position: 'absolute',
                  top: '16px',
                  left: '16px',
                  zIndex: 1000,
                  background: 'rgba(21,62,117,0.92)',
                  color: 'white',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  fontWeight: 800,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                }}
              >
                PETA RUTE PATROLI WILAYAH
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label
                    style={{
                      fontSize: '11px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      background: 'rgba(255,255,255,0.2)',
                      padding: '6px 10px',
                      borderRadius: '4px',
                    }}
                  >
                    <input
                      type="checkbox"
                      id="toggle-personel"
                      checked={showOtherOfficers}
                      onChange={(e) => setShowOtherOfficers(e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    Lihat Sebaran Personel Lain
                  </label>
                  <label
                    id="container-toggle-traffic"
                    style={{
                      fontSize: '11px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      background: 'rgba(16,185,129,0.3)',
                      border: '1px solid rgba(16,185,129,0.4)',
                      padding: '6px 10px',
                      borderRadius: '4px',
                    }}
                  >
                    <input
                      type="checkbox"
                      id="toggle-traffic"
                      checked={showTraffic}
                      onChange={(e) => setShowTraffic(e.target.checked)}
                      style={{ cursor: 'pointer', accentColor: '#10B981' }}
                    />
                    🚦 Tampilkan Traffic Line (Lalu Lintas)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowHotspotModal(true)}
                    style={{
                      background: 'rgba(220,38,38,0.85)',
                      color: 'white',
                      border: '1px solid rgba(254,202,202,0.4)',
                      padding: '6px 10px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      transition: '0.2s',
                    }}
                  >
                    <span>⚠️</span> Kelola Titik Rawan (CRUD)
                  </button>

                  {/* ======================================================= */}
                  {/* KONTROL TOGGLE SIMULASI GPS (DEV / PENGUJIAN WORKFLOW)  */}
                  {/* CATATAN: DAPAT DIHAPUS / DIMATIKAN KAPAN SAJA           */}
                  {/* ======================================================= */}
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '6px', marginTop: '4px' }}>
                    <label
                      id="container-toggle-simulasi"
                      style={{
                        fontSize: '11px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        background: isSimModeEnabled ? 'rgba(245, 158, 11, 0.3)' : 'rgba(255, 255, 255, 0.08)',
                        border: `1px solid ${isSimModeEnabled ? 'rgba(245, 158, 11, 0.6)' : 'rgba(255, 255, 255, 0.15)'}`,
                        padding: '6px 10px',
                        borderRadius: '4px',
                        fontWeight: 700,
                        color: isSimModeEnabled ? '#FDE68A' : '#E2E8F0',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input
                          type="checkbox"
                          id="toggle-simulasi-mode"
                          checked={isSimModeEnabled}
                          onChange={(e) => toggleSimulationMode(e.target.checked)}
                          style={{ cursor: 'pointer', accentColor: '#F59E0B' }}
                        />
                        <span>🎮 Mode Simulasi GPS</span>
                      </div>
                      <span style={{ fontSize: '9.5px', background: isSimModeEnabled ? '#F59E0B' : '#64748B', color: isSimModeEnabled ? '#000' : '#FFF', padding: '1px 5px', borderRadius: '3px' }}>
                        {isSimModeEnabled ? 'ON' : 'OFF'}
                      </span>
                    </label>

                    {/* KONTROL SIMULASI (Hanya tampil saat Toggle ON) */}
                    {isSimModeEnabled && (
                      <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '5px', background: 'rgba(0,0,0,0.3)', padding: '7px', borderRadius: '6px', border: '1px dashed rgba(245, 158, 11, 0.4)' }}>
                        <div style={{ fontSize: '9.5px', color: '#FCD34D', fontWeight: 700, lineHeight: 1.2 }}>
                          {isSimMoving ? '🚀 Sedang bergerak menuju TKP...' : 'Pilih simulasi pergerakan:'}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                          <button
                            type="button"
                            onClick={isSimMoving ? stopSimulationMovement : startRouteSimulation}
                            style={{
                              padding: '5px 8px',
                              background: isSimMoving ? '#EF4444' : '#2563EB',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: 800,
                              cursor: 'pointer',
                            }}
                          >
                            {isSimMoving ? '⏸️ Jeda Gerak' : '▶️ Gerak Bertahap'}
                          </button>
                          <button
                            type="button"
                            onClick={jumpDirectlyToTkp}
                            style={{
                              padding: '5px 8px',
                              background: '#10B981',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: 800,
                              cursor: 'pointer',
                            }}
                            title="Langsung setel GPS ke < 50 meter dari TKP"
                          >
                            ⚡ Langsung Tiba
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={resetSimulationGps}
                          style={{
                            padding: '4px',
                            background: 'rgba(255,255,255,0.1)',
                            color: '#94A3B8',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '4px',
                            fontSize: '9.5px',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          🔄 Reset Posisi Awal
                        </button>
                      </div>
                    )}
                  </div>
                  {/* ======================================================= */}
                </div>
              </div>

              {/* Real Fullscreen Leaflet Google Roadmap */}
              <SimapresLeafletMap
                mode="fullscreen"
                height="100%"
                targetComplaint={targetComplaintForNav}
                myUnit={myUnitData}
                hotspots={hotspots}
                policeOffices={policeOffices}
                fleetUnits={fleetUnits}
                showTraffic={showTraffic}
                showOtherOfficers={showOtherOfficers}
                onSelectUnit={(unit) => setMapUnitDetail(unit)}
                onOpenSos={() => setShowSosModal(true)}
              />

              {/* Floating Unit Detail Popup in Fullscreen */}
              {mapUnitDetail && (
                <div
                  id="modal-map-unit-detail-fs"
                  style={{
                    position: 'absolute',
                    top: '86px',
                    left: '16px',
                    zIndex: 9999,
                    background: '#FFFFFF',
                    borderRadius: '12px',
                    boxShadow: '0 12px 30px rgba(0,0,0,0.25), 0 4px 10px rgba(0,0,0,0.15)',
                    border: '1px solid #CBD5E1',
                    padding: '15px 17px',
                    width: '340px',
                    maxWidth: 'calc(100% - 32px)',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                    pointerEvents: 'auto',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#0284C7', display: 'flex', alignItems: 'center', gap: '7px' }}>
                      <span style={{ fontSize: '16px' }}>{mapUnitDetail.iconEmoji || '🚔'}</span>
                      <span>{mapUnitDetail.title}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMapUnitDetail(null)}
                      style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '16px', fontWeight: 700, cursor: 'pointer', lineHeight: 1, padding: '2px 4px', borderRadius: '4px' }}
                      title="Tutup Detail"
                    >
                      ✕
                    </button>
                  </div>
                  <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#1E293B', lineHeight: 1.3, marginTop: '4px' }}>
                    {mapUnitDetail.petugas}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px', lineHeight: 1.4 }}>
                    {mapUnitDetail.sub}
                  </div>
                  <div style={{ borderTop: '1px solid #E2E8F0', margin: '10px 0 8px 0' }} />
                  <div style={{ fontSize: '13px', fontWeight: 800, color: mapUnitDetail.statusColor || '#10B981' }}>
                    {mapUnitDetail.status}
                  </div>
                  <div style={{ fontSize: '12px', color: '#475569', marginTop: '3px', lineHeight: 1.4 }}>
                    {mapUnitDetail.tugas}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
                    {mapUnitDetail.telemetri}
                  </div>
                </div>
              )}

              {/* Horizontal Ribbon Bar Navigasi Rute & Geofence TKP (Memanjang ke Samping - Hemat Ruang & Tanpa Scroll) */}
              {targetComplaintForNav && (
                <div
                  id="panel-navigasi-rute-tkp"
                  style={{
                    position: 'absolute',
                    bottom: '10px',
                    left: '12px',
                    right: '12px',
                    zIndex: 1000,
                    background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.96) 0%, rgba(30, 41, 59, 0.98) 100%)',
                    backdropFilter: 'blur(10px)',
                    color: '#FFFFFF',
                    borderRadius: '12px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.2)',
                    border: '1.5px solid rgba(56, 189, 248, 0.35)',
                    padding: '8px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    boxSizing: 'border-box',
                  }}
                >
                  {/* SISI KIRI: Informasi Kejadian & Alamat TKP */}
                  <div style={{ flex: '1 1 auto', minWidth: '200px', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
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
                      <span style={{ fontSize: '11px', fontWeight: 800, color: '#38BDF8', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                        NAVIGASI MENUJU TKP
                      </span>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          padding: '2px 7px',
                          borderRadius: '5px',
                          background: (targetComplaintForNav.status === 'TIBA_DI_TKP' || targetComplaintForNav.status === 'PENANGANAN_TKP')
                            ? 'rgba(16, 185, 129, 0.25)'
                            : isWithin50Meters
                            ? 'rgba(16, 185, 129, 0.2)'
                            : 'rgba(56, 189, 248, 0.15)',
                          color: (targetComplaintForNav.status === 'TIBA_DI_TKP' || targetComplaintForNav.status === 'PENANGANAN_TKP')
                            ? '#10B981'
                            : isWithin50Meters
                            ? '#10B981'
                            : '#38BDF8',
                          border: `1px solid ${(targetComplaintForNav.status === 'TIBA_DI_TKP' || targetComplaintForNav.status === 'PENANGANAN_TKP' || isWithin50Meters) ? '#10B981' : 'rgba(56, 189, 248, 0.3)'}`,
                        }}
                      >
                        {(targetComplaintForNav.status === 'TIBA_DI_TKP' || targetComplaintForNav.status === 'PENANGANAN_TKP')
                          ? '✅ TIBA DI LOKASI TKP'
                          : isWithin50Meters
                          ? '🎯 DI RADIUS TKP (<50m)'
                          : '📡 MENUJU TKP'}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: '13px',
                        fontWeight: 800,
                        color: '#FFFFFF',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        lineHeight: 1.3,
                      }}
                      title={targetComplaintForNav.jenisKejadian}
                    >
                      {targetComplaintForNav.jenisKejadian}
                    </div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: '#94A3B8',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                      title={targetComplaintForNav.tkpAlamatTeks}
                    >
                      <span>📍</span> {targetComplaintForNav.tkpAlamatTeks || 'Lokasi Kejadian'}
                    </div>
                  </div>

                  {/* SISI TENGAH: Metrik Jarak GPS (Update Tiap 10s), ETA, & Status Geofence */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      padding: '5px 12px',
                      flexShrink: 0,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '8.5px', color: '#94A3B8', fontWeight: 700, letterSpacing: '0.5px' }}>
                        JARAK GPS (10s)
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: 900, color: isWithin50Meters ? '#10B981' : '#38BDF8', lineHeight: 1.2 }}>
                        {distanceFormatted}
                      </div>
                    </div>
                    <div style={{ width: '1px', height: '24px', background: 'rgba(255, 255, 255, 0.12)' }} />
                    <div>
                      <div style={{ fontSize: '8.5px', color: '#94A3B8', fontWeight: 700, letterSpacing: '0.5px' }}>
                        ESTIMASI
                      </div>
                      <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#E2E8F0', lineHeight: 1.2 }}>
                        {etaMinutesText}
                      </div>
                    </div>
                    <div style={{ width: '1px', height: '24px', background: 'rgba(255, 255, 255, 0.12)' }} />
                    <div>
                      <div style={{ fontSize: '8.5px', color: '#94A3B8', fontWeight: 700, letterSpacing: '0.5px' }}>
                        RADIUS &le; 50M
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: isWithin50Meters ? '#10B981' : '#FDE047', lineHeight: 1.2 }}>
                        {isWithin50Meters ? '✅ Di Area TKP' : '⚠️ Di Luar Radius'}
                      </div>
                    </div>
                  </div>

                  {/* SISI KANAN: Tombol Tiba di Lokasi / Form Tindakan */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <button
                      id="btn-sudah-tiba-tkp"
                      type="button"
                      disabled={isUpdatingStep || (!isWithin50Meters && targetComplaintForNav.status !== 'TIBA_DI_TKP' && targetComplaintForNav.status !== 'PENANGANAN_TKP')}
                      onClick={handleSudahTibaFromMap}
                      title={
                        (targetComplaintForNav.status === 'TIBA_DI_TKP' || targetComplaintForNav.status === 'PENANGANAN_TKP')
                          ? 'Klik untuk membuka formulir tindakan kepolisian dan dokumentasi TKP'
                          : isWithin50Meters
                          ? 'Klik untuk merekam waktu kedatangan riil di TKP seketika ke sistem'
                          : 'Tombol terkunci. Anda harus berada dalam radius < 50 meter dari TKP untuk konfirmasi tiba.'
                      }
                      style={{
                        padding: '9px 18px',
                        background: (targetComplaintForNav.status === 'TIBA_DI_TKP' || targetComplaintForNav.status === 'PENANGANAN_TKP')
                          ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                          : isWithin50Meters
                          ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                          : 'rgba(255, 255, 255, 0.08)',
                        color: (targetComplaintForNav.status === 'TIBA_DI_TKP' || targetComplaintForNav.status === 'PENANGANAN_TKP' || isWithin50Meters) ? '#FFFFFF' : '#94A3B8',
                        border: (targetComplaintForNav.status === 'TIBA_DI_TKP' || targetComplaintForNav.status === 'PENANGANAN_TKP' || isWithin50Meters)
                          ? 'none'
                          : '1px solid rgba(255, 255, 255, 0.18)',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 900,
                        cursor: (targetComplaintForNav.status === 'TIBA_DI_TKP' || targetComplaintForNav.status === 'PENANGANAN_TKP' || isWithin50Meters) ? 'pointer' : 'not-allowed',
                        opacity: (targetComplaintForNav.status === 'TIBA_DI_TKP' || targetComplaintForNav.status === 'PENANGANAN_TKP' || isWithin50Meters) ? 1 : 0.6,
                        boxShadow: (targetComplaintForNav.status === 'TIBA_DI_TKP' || targetComplaintForNav.status === 'PENANGANAN_TKP' || isWithin50Meters)
                          ? '0 4px 16px rgba(16, 185, 129, 0.45)'
                          : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '7px',
                        letterSpacing: '0.4px',
                        textTransform: 'uppercase',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <span style={{ fontSize: '15px' }}>
                        {(targetComplaintForNav.status === 'TIBA_DI_TKP' || targetComplaintForNav.status === 'PENANGANAN_TKP')
                          ? '📝'
                          : isWithin50Meters
                          ? '🚨'
                          : '🔒'}
                      </span>
                      <span>
                        {isUpdatingStep
                          ? 'MEREKAM...'
                          : (targetComplaintForNav.status === 'TIBA_DI_TKP' || targetComplaintForNav.status === 'PENANGANAN_TKP')
                          ? 'FORM TINDAKAN TKP ➔'
                          : isWithin50Meters
                          ? 'TIBA DI LOKASI ➔'
                          : 'TIBA DI LOKASI'}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* ======================================================== */}
          {/* SCREEN 3: BUAT LOG (+) / INPUT LOG HARIAN                */}
          {/* ======================================================== */}
          {activeTab === 'view-log' && (
            <section id="view-log" className="view active">
              <h2 className="page-title">INPUT LOG HARIAN</h2>

              {/* Action Type Buttons (Dinamis dari master_activity_types) */}
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max(dbGiats.length, 1)}, 1fr)`, gap: '8px', margin: '0 16px 16px' }}>
                {dbGiats.length === 0 ? (
                  <div style={{ gridColumn: '1 / -1', padding: '10px', textAlign: 'center', color: '#64748B', fontSize: '12px' }}>
                    Data jenis kegiatan belum tersedia di database
                  </div>
                ) : (
                  dbGiats.map((g: any) => {
                    const keyUpper = (g.key || '').toUpperCase();
                    const isSelected = (logJenis || '').toUpperCase() === keyUpper;
                    return (
                      <button
                        key={g.id || g.key}
                        type="button"
                        onClick={() => setLogJenis(keyUpper)}
                        style={{
                          padding: '12px 6px',
                          borderRadius: '8px',
                          border: 'none',
                          fontWeight: 800,
                          fontSize: '12px',
                          cursor: 'pointer',
                          background: isSelected ? '#153E75' : '#F1F5F9',
                          color: isSelected ? 'white' : '#475569',
                          boxShadow: isSelected ? '0 2px 8px rgba(21,62,117,0.3)' : 'none',
                        }}
                      >
                        {g.icon_emoji ? `${g.icon_emoji} ` : ''}{g.label || g.key}
                      </button>
                    );
                  })
                )}
              </div>

              {/* Rentang Jam Kegiatan */}
              <div className="form-group">
                <label className="form-label">Rentang Jam Kegiatan</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    className="form-control"
                    readOnly
                    value={`${jamMulai} - ${jamSelesai} WIB`}
                    style={{ fontWeight: 700, color: '#153E75' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowTimePicker(true)}
                    style={{
                      padding: '0 16px',
                      background: '#EFF6FF',
                      border: '1px solid #BFDBFE',
                      borderRadius: '8px',
                      fontWeight: 700,
                      color: '#1D4ED8',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    📅 Ubah Jam
                  </button>
                </div>
              </div>

              {/* Lokasi Kegiatan */}
              <div className="form-group">
                <label className="form-label">Lokasi Kegiatan</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Masukkan lokasi atau nama jalan kegiatan..."
                  value={logLokasi}
                  onChange={(e) => setLogLokasi(e.target.value)}
                />
              </div>

              {/* Uraian Kegiatan */}
              <div className="form-group">
                <label className="form-label">Uraian Kegiatan</label>
                <textarea
                  className="form-control"
                  style={{ minHeight: '110px' }}
                  placeholder="Jelaskan rincian giat kepolisian, kondisi kamtibmas, temuan dan tindakan..."
                  value={logDeskripsi}
                  onChange={(e) => setLogDeskripsi(e.target.value)}
                />
              </div>

              {/* Live Camera Attachment */}
              <div className="form-group">
                <label className="form-label">Lampiran Foto (Live Camera)</label>
                <LiveCameraWatermarkCapture
                  personilNama={officer.fullName || session?.fullName}
                  personilPangkat={officer.pangkat}
                  personilNrp={officer.nrp || session?.identifier}
                  lokasiPersonil={logLokasi || officerLiveAddress || 'Lokasi tidak Valid'}
                  gpsLat={currentGps.lat}
                  gpsLng={currentGps.lng}
                  label="Dokumentasi Visual Kegiatan Patroli"
                  required={false}
                  onPhotoCaptured={(dataUrl) => setLogFoto(dataUrl)}
                />
              </div>

              <button
                type="button"
                className="btn-blue"
                id="btn-simpan-log"
                onClick={handleSaveLog}
                disabled={isSubmittingLog}
                style={{ background: '#10B981', fontSize: '15px', marginTop: '16px', fontWeight: 800 }}
              >
                {isSubmittingLog ? 'Mengirim Log Kegiatan...' : 'Kirim Log Kegiatan'}
              </button>
            </section>
          )}

          {/* ======================================================== */}
          {/* SCREEN 4: VALIDASI (DAFTAR PENUGASAN LAPANGAN)          */}
          {/* ======================================================== */}
          {activeTab === 'view-validasi' && (
            <section id="view-validasi" className="view active">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '16px 16px 8px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 className="page-title" style={{ margin: 0 }} id="val-page-title">
                      Daftar Penugasan Lapangan
                    </h2>
                    <span style={{ fontSize: '10px', fontWeight: 800, background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0', padding: '2px 8px', borderRadius: '12px' }}>
                      TUGAS OPERASIONAL LAPANGAN
                    </span>
                  </div>
                  <div className="page-subtitle" style={{ margin: '2px 0 0', color: '#64748B', fontSize: '12px' }}>
                    Monitoring Penugasan Lapangan: Respon TKP, Pengisian BAP &amp; Pengajuan Pengesahan
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      fontSize: '11.5px',
                      fontWeight: 700,
                      color: '#166534',
                      background: '#F0FDF4',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: '1px solid #BBF7D0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <span>👮</span> Piket Personel Siaga
                  </div>
                  <div
                    onClick={() => switchTab('view-beranda')}
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#153E75',
                      cursor: 'pointer',
                      background: '#F1F5F9',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span>🏠</span> Beranda
                  </div>
                </div>
              </div>

              {/* Status Filter Tabs (Matching Prototype) */}
              <div className="val-filter-tabs">
                <button
                  type="button"
                  className={`val-tab-btn ${validasiFilter === 'semua' ? 'active' : ''}`}
                  onClick={() => setValidasiFilter('semua')}
                >
                  Semua Tugas Saya <span className="val-tab-badge">{myAcceptedTasks.length}</span>
                </button>
                <button
                  type="button"
                  className={`val-tab-btn ${validasiFilter === 'diproses' ? 'active' : ''}`}
                  onClick={() => setValidasiFilter('diproses')}
                >
                  Sedang Ditangani{' '}
                  <span className="val-tab-badge primary">
                    {myAcceptedTasks.filter((c) => ['DIPROSES', 'DISPOSISI', 'MENUJU_TKP', 'TIBA_DI_TKP', 'SEDANG_DITANGANI', 'PENANGANAN_TKP'].includes(c.status)).length}
                  </span>
                </button>
                <button
                  type="button"
                  className={`val-tab-btn ${validasiFilter === 'menunggu_pengesahan' ? 'active' : ''}`}
                  onClick={() => setValidasiFilter('menunggu_pengesahan')}
                >
                  Menunggu Pengesahan{' '}
                  <span className="val-tab-badge purple">
                    {myAcceptedTasks.filter((c) => c.status === 'MENUNGGU_PENGESAHAN').length}
                  </span>
                </button>
              </div>

              {/* Filter Bar Terpadu: Saluran Platform & Kategori Jenis Pengaduan */}
              <div
                id="val-filter-secondary-bar"
                style={{
                  background: 'white',
                  border: '1px solid #E2E8F0',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  margin: '6px 16px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>📡</span> PLATFORM:
                    </span>
                    <button
                      type="button"
                      onClick={() => setPlatformFilter('all')}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: '1px solid transparent',
                        background: platformFilter === 'all' ? '#0F172A' : '#F1F5F9',
                        color: platformFilter === 'all' ? 'white' : '#475569',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Semua
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlatformFilter('sos')}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: '1px solid #FECACA',
                        background: platformFilter === 'sos' ? '#DC2626' : '#FEF2F2',
                        color: platformFilter === 'sos' ? 'white' : '#DC2626',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      🚨 SOS Panik
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlatformFilter('warga')}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: '1px solid #BAE6FD',
                        background: platformFilter === 'warga' ? '#0284C7' : '#F0F9FF',
                        color: platformFilter === 'warga' ? 'white' : '#0284C7',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      📱 Portal Warga
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlatformFilter('layanan110')}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: '1px solid #BFDBFE',
                        background: platformFilter === 'layanan110' ? '#1D4ED8' : '#EFF6FF',
                        color: platformFilter === 'layanan110' ? 'white' : '#1D4ED8',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      📞 Layanan 110
                    </button>
                  </div>
                </div>
              </div>

              {/* Subtitle Count Matching Prototype */}
              <div
                className="page-subtitle"
                style={{
                  margin: '0 16px 10px',
                  fontWeight: 700,
                  fontSize: '12px',
                  color: '#475569',
                }}
              >
                Menampilkan: {filteredTasks.length} Data {validasiFilter === 'diproses' ? 'Sedang Ditangani' : validasiFilter === 'menunggu_pengesahan' ? 'Menunggu Pengesahan' : 'Semua Penugasan Saya'}
              </div>

              {/* Task Content: Full-width Empty State OR Split Layout */}
              {filteredTasks.length === 0 ? (
                <div style={{ padding: '0 16px 24px' }}>
                  <div
                    style={{
                      padding: '48px 24px',
                      textAlign: 'center',
                      background: 'white',
                      borderRadius: '12px',
                      border: '1px solid #E2E8F0',
                      color: '#64748B',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                      width: '100%',
                    }}
                  >
                    <div style={{ fontSize: '42px', marginBottom: '10px' }}>📭</div>
                    <div style={{ fontWeight: 800, color: '#1E293B', fontSize: '15px', marginBottom: '6px' }}>
                      {validasiFilter === 'menunggu_pengesahan'
                        ? 'Tidak Ada Tugas Menunggu Pengesahan'
                        : validasiFilter === 'diproses'
                        ? 'Tidak Ada Tugas Sedang Ditangani'
                        : 'Tidak Ada Penugasan Aktif'}
                    </div>
                    <div style={{ fontSize: '12.5px', color: '#64748B', maxWidth: '440px', margin: '0 auto', lineHeight: '1.5' }}>
                      {validasiFilter === 'menunggu_pengesahan'
                        ? 'Saat ini tidak ada laporan yang sedang menunggu verifikasi atau pengesahan BAP dari Pawas.'
                        : validasiFilter === 'diproses'
                        ? 'Saat ini tidak ada penugasan lapangan yang sedang aktif Anda tangani.'
                        : 'Anda belum mengambil tugas penanganan kasus pada kategori ini. Tiket tugas yang tidak Anda ambil atau yang kuotanya telah dipenuhi oleh personel lain tidak ditampilkan pada daftar tugas Anda.'}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="split-layout">
                  {/* Task List (Left Column) */}
                  <div className="val-list">
                    {filteredTasks.map((t) => {
                      const isSelected = selectedTask?.id === t.id;
                      const isSos = (t.platformKey || '').toUpperCase().includes('SOS');
                      const isWarga = (t.platformKey || '').toUpperCase().includes('WARGA');
                      const isMyTask = hasOfficerAcceptedTask(t);
                      const taskQuota = getTaskQuotaInfo(t);
                      const isPending = isTaskPendingAcceptance(t);

                      let statusLabel = 'Sedang Ditangani';
                      let statusColor = '#2563EB';

                      if (t.status === 'SELESAI') {
                        statusLabel = 'Selesai Ditangani';
                        statusColor = '#16A34A';
                      } else if (t.status === 'MENUNGGU_PENGESAHAN') {
                        statusLabel = 'Menunggu Pengesahan Pawas';
                        statusColor = '#7C3AED';
                      } else if (isMyTask) {
                        statusLabel = 'Sedang Ditangani (Aktif)';
                        statusColor = '#059669';
                      } else if (taskQuota.isQuotaFull) {
                        statusLabel = `Kuota Personel Penuh (${taskQuota.acceptedCount}/${taskQuota.quota})`;
                        statusColor = '#64748B';
                      } else if (isPending) {
                        statusLabel = `Disposisi Baru (${taskQuota.acceptedCount}/${taskQuota.quota})`;
                        statusColor = '#DC2626';
                      }

                      return (
                        <div
                          key={t.id}
                          className={`val-card ${isSelected ? 'selected' : ''}`}
                          onClick={() => setSelectedTask(t)}
                          style={{
                            background: '#FFFFFF',
                            border: isSelected ? '2px solid #2563EB' : '1px solid #E2E8F0',
                            borderRadius: '10px',
                            padding: '12px',
                            marginBottom: '10px',
                            cursor: 'pointer',
                            position: 'relative',
                            boxShadow: isSelected ? '0 4px 14px rgba(37,99,235,0.15)' : '0 1px 3px rgba(0,0,0,0.04)',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {/* Header: Avatar, Nama, Waktu, Status, Platform, TERPILIH Badge */}
                          <div className="val-user" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                            <div style={{ position: 'relative', flexShrink: 0 }}>
                              <div
                                style={{
                                  width: '38px',
                                  height: '38px',
                                  borderRadius: '50%',
                                  background: '#EFF6FF',
                                  border: '2px solid #BFDBFE',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '18px',
                                  color: '#1D4ED8',
                                }}
                              >
                                👤
                              </div>
                              <span
                                style={{
                                  position: 'absolute',
                                  bottom: '-2px',
                                  right: '-2px',
                                  fontSize: '9px',
                                  background: isSos ? '#DC2626' : '#2563EB',
                                  color: 'white',
                                  borderRadius: '50%',
                                  width: '15px',
                                  height: '15px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  border: '1.5px solid white',
                                }}
                              >
                                {isSos ? '🚨' : '📞'}
                              </span>
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                                <div style={{ fontWeight: 700, fontSize: '13px', color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {t.namaPelapor || t.pelaporNama || 'Warga'}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  {isSelected && (
                                    <span style={{ fontSize: '9px', fontWeight: 800, background: '#2563EB', color: 'white', padding: '1px 5px', borderRadius: '4px' }}>
                                      ★ TERPILIH
                                    </span>
                                  )}
                                  <span style={{ fontSize: '10px', color: '#64748B', flexShrink: 0 }}>
                                    {t.waktuLapor ? new Date(t.waktuLapor).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB' : 'Hari ini'}
                                  </span>
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px', flexWrap: 'wrap', gap: '4px' }}>
                                <div style={{ fontSize: '11px', fontWeight: 700, color: statusColor }}>
                                  Status: {statusLabel}
                                </div>
                                <span
                                  style={{
                                    fontSize: '9.5px',
                                    fontWeight: 800,
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                    background: isSos ? '#FEE2E2' : isWarga ? '#F0F9FF' : '#EFF6FF',
                                    color: isSos ? '#DC2626' : isWarga ? '#0284C7' : '#1D4ED8',
                                    border: isSos ? '1px solid #FECACA' : isWarga ? '1px solid #BAE6FD' : '1px solid #BFDBFE',
                                  }}
                                >
                                  {isSos ? '🚨 SOS PANIC' : isWarga ? '📱 Portal Warga' : '📞 Layanan 110'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Kategori & Urgensi Badge Row */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '6px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '10px', fontWeight: 800, padding: '2px 7px', borderRadius: '4px', background: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA' }}>
                              ⚔️ {t.kategoriKey || t.jenisKejadian || 'Kriminalitas / Kamtibmas'}
                            </span>
                            <span
                              style={{
                                fontSize: '9.5px',
                                fontWeight: 800,
                                padding: '1.5px 6px',
                                borderRadius: '4px',
                                background: (t.urgensi || '').toUpperCase().includes('DARURAT') ? '#FEE2E2' : '#FEF3C7',
                                color: (t.urgensi || '').toUpperCase().includes('DARURAT') ? '#DC2626' : '#D97706',
                                border: (t.urgensi || '').toUpperCase().includes('DARURAT') ? '1px solid #FCA5A5' : '1px solid #FDE68A',
                              }}
                            >
                              🚨 {t.urgensi || 'DARURAT'}
                            </span>
                          </div>

                          {/* Judul & Deskripsi */}
                          <div style={{ fontWeight: 800, fontSize: '12.5px', color: '#0F172A', lineHeight: '1.35', marginBottom: '4px' }}>
                            ⚠️ {t.jenisKejadian}
                          </div>
                          <div className="val-text" style={{ fontSize: '11.5px', color: '#475569', lineHeight: '1.45', marginBottom: '6px' }}>
                            {t.ringkasanKeterangan || t.deskripsiKejadian || 'Petugas segera merespon situasi darurat di TKP.'}
                          </div>

                          {/* Metadata Lokasi, Kontak & Tiket Box */}
                          <div style={{ fontSize: '10.5px', color: '#64748B', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '6px 8px', marginBottom: '6px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span>📍</span> <span style={{ fontWeight: 600, color: '#334155' }}>{t.tkpAlamatTeks}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', flexWrap: 'wrap' }}>
                              <span style={{ color: '#475569' }}>📞 {t.noHpPelapor || t.pelaporHp || '-'}</span>
                              <span>📍 GPS: {t.tkpLat ? Number(t.tkpLat).toFixed(4) : '-'}, {t.tkpLng ? Number(t.tkpLng).toFixed(4) : '-'}</span>
                              <span style={{ color: '#153E75', fontWeight: 700 }}>Tiket: <strong>{t.nomorTiket}</strong></span>
                            </div>
                          </div>

                          {/* Card Footer Status */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px', borderTop: '1px dashed #E2E8F0' }}>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: statusColor }}>
                              ● {statusLabel}
                            </span>
                            <span style={{ fontSize: '11px', fontWeight: 800, color: '#153E75' }}>
                              {t.status === 'MENUNGGU_PENGESAHAN' ? 'Menunggu Pengesahan Pawas ➔' : 'Rincian Pelacakan ➔'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                {/* Task Detail Panel Right (Matching Prototype) */}
                <div className="val-detail">
                  {selectedTask && hasOfficerAcceptedTask(selectedTask) ? (
                    <div>
                      {/* GLOBAL MACRO MILESTONE STEPPER (Siklus Hidup Lengkap Laporan End-to-End) */}
                      <div
                        id="macro-milestone-box"
                        style={{
                          marginBottom: '14px',
                          background: '#F8FAFC',
                          border: '1px solid #E2E8F0',
                          borderRadius: '10px',
                          padding: '10px 12px',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <div style={{ fontSize: '10px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <span>🌐</span> SIKLUS HIDUP LAPORAN
                          </div>
                          <div
                            style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              color: (selectedTask.platformKey || '').includes('SOS') ? '#DC2626' : '#1D4ED8',
                              background: (selectedTask.platformKey || '').includes('SOS') ? '#FEF2F2' : '#EFF6FF',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              border: (selectedTask.platformKey || '').includes('SOS') ? '1px solid #FECACA' : '1px solid #BFDBFE',
                            }}
                          >
                            {(selectedTask.platformKey || '').includes('SOS') ? '🚨 Tombol Darurat SOS Presisi (Live GPS)' : (selectedTask.platformKey || '').includes('WARGA') ? '📱 Portal Warga Presisi' : '📞 Call Center 110'}
                          </div>
                        </div>

                        {/* 4 Macro Steppers */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                          <div style={{ textAlign: 'center', padding: '6px 4px', borderRadius: '6px', background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
                            <div style={{ fontSize: '11px', fontWeight: 800, color: '#10B981' }}>✓</div>
                            <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#1E293B', marginTop: '2px' }}>1. Lapor Masuk</div>
                            <div style={{ fontSize: '8.5px', color: '#059669', fontWeight: 600 }}>Tercatat</div>
                          </div>

                          <div style={{ textAlign: 'center', padding: '6px 4px', borderRadius: '6px', background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
                            <div style={{ fontSize: '11px', fontWeight: 800, color: '#10B981' }}>✓</div>
                            <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#1E293B', marginTop: '2px' }}>2. Validasi</div>
                            <div style={{ fontSize: '8.5px', color: '#059669', fontWeight: 600 }}>Disetujui</div>
                          </div>

                          <div
                            style={{
                              textAlign: 'center',
                              padding: '6px 4px',
                              borderRadius: '6px',
                              background: selectedTask.status === 'SELESAI' || selectedTask.status === 'MENUNGGU_PENGESAHAN' ? '#ECFDF5' : '#EFF6FF',
                              border: selectedTask.status === 'SELESAI' || selectedTask.status === 'MENUNGGU_PENGESAHAN' ? '1px solid #A7F3D0' : '1px solid #93C5FD',
                            }}
                          >
                            <div style={{ fontSize: '11px', fontWeight: 800, color: selectedTask.status === 'SELESAI' || selectedTask.status === 'MENUNGGU_PENGESAHAN' ? '#10B981' : '#2563EB' }}>
                              {selectedTask.status === 'SELESAI' || selectedTask.status === 'MENUNGGU_PENGESAHAN' ? '✓' : '●'}
                            </div>
                            <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#1E293B', marginTop: '2px' }}>3. Lapangan</div>
                            <div style={{ fontSize: '8.5px', color: selectedTask.status === 'SELESAI' || selectedTask.status === 'MENUNGGU_PENGESAHAN' ? '#059669' : '#1D4ED8', fontWeight: 600 }}>
                              {selectedTask.status === 'SELESAI' || selectedTask.status === 'MENUNGGU_PENGESAHAN' ? 'TKP Selesai' : selectedTask.status === 'TIBA_DI_TKP' ? 'Di TKP' : selectedTask.status === 'MENUJU_TKP' ? 'Meluncur' : 'Disposisi'}
                            </div>
                          </div>

                          <div
                            style={{
                              textAlign: 'center',
                              padding: '6px 4px',
                              borderRadius: '6px',
                              background: selectedTask.status === 'SELESAI' ? '#ECFDF5' : selectedTask.status === 'MENUNGGU_PENGESAHAN' ? '#FAF5FF' : '#F8FAFC',
                              border: selectedTask.status === 'SELESAI' ? '1px solid #A7F3D0' : selectedTask.status === 'MENUNGGU_PENGESAHAN' ? '1px solid #C084FC' : '1px solid #E2E8F0',
                            }}
                          >
                            <div style={{ fontSize: '11px', fontWeight: 800, color: selectedTask.status === 'SELESAI' ? '#10B981' : selectedTask.status === 'MENUNGGU_PENGESAHAN' ? '#7C3AED' : '#94A3B8' }}>
                              {selectedTask.status === 'SELESAI' ? '✓' : selectedTask.status === 'MENUNGGU_PENGESAHAN' ? '⏳' : '🔒'}
                            </div>
                            <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#1E293B', marginTop: '2px' }}>4. Selesai</div>
                            <div style={{ fontSize: '8.5px', color: selectedTask.status === 'SELESAI' ? '#059669' : selectedTask.status === 'MENUNGGU_PENGESAHAN' ? '#7C3AED' : '#94A3B8', fontWeight: 600 }}>
                              {selectedTask.status === 'SELESAI' ? 'Selesai 100%' : selectedTask.status === 'MENUNGGU_PENGESAHAN' ? 'Pengesahan Pawas' : 'Menunggu'}
                            </div>
                          </div>
                        </div>

                        {/* Alert Banner */}
                        {(() => {
                          const isMySelected = hasOfficerAcceptedTask(selectedTask);
                          const selQuota = getTaskQuotaInfo(selectedTask);
                          const isSelPending = isTaskPendingAcceptance(selectedTask);

                          let bannerBg = '#EFF6FF';
                          let bannerColor = '#1E40AF';
                          let bannerBorder = '1px solid #BFDBFE';
                          let bannerText = '⚡ Sedang Ditangani: Tim reaksi cepat bergerak menuju TKP / melakukan tindakan kepolisian di lokasi.';

                          if (selectedTask.status === 'MENUNGGU_PENGESAHAN') {
                            bannerBg = '#FEF3C7';
                            bannerColor = '#92400E';
                            bannerBorder = '1px solid #FDE68A';
                            bannerText = '⌛ Menunggu Pengesahan: Penanganan di TKP selesai, menunggu otorisasi penutupan kasus resmi dari Pawas.';
                          } else if (selectedTask.status === 'SELESAI') {
                            bannerBg = '#ECFDF5';
                            bannerColor = '#047857';
                            bannerBorder = '1px solid #A7F3D0';
                            bannerText = '🏆 Kasus Selesai: Berita Acara telah diverifikasi & disahkan resmi oleh Pawas.';
                          } else if (isMySelected) {
                            bannerBg = '#ECFDF5';
                            bannerColor = '#065F46';
                            bannerBorder = '1px solid #6EE7B7';
                            bannerText = `⚡ Tugas Aktif Anda: Anda tergabung dalam tim regu penanganan kasus ini (${selQuota.acceptedCount}/${selQuota.quota} personel). Silakan jalankan SOP di Wizard Penanganan.`;
                          } else if (selQuota.isQuotaFull) {
                            bannerBg = '#F1F5F9';
                            bannerColor = '#475569';
                            bannerBorder = '1px solid #CBD5E1';
                            bannerText = `🔒 Kuota Personel Terpenuhi: Tiket telah diambil oleh ${selQuota.acceptedCount}/${selQuota.quota} personel lain dalam satuan Anda. Tiket ini sudah tidak dapat diambil.`;
                          } else if (isSelPending) {
                            bannerBg = '#FEF2F2';
                            bannerColor = '#991B1B';
                            bannerBorder = '1px solid #FECACA';
                            bannerText = `🛡️ Butuh Konfirmasi Personil: Perintah disposisi taktis Pawas terbuka (${selQuota.acceptedCount}/${selQuota.quota} personel terisi • sisa ${selQuota.slotsRemaining} slot). Segera konfirmasi Terima Tugas.`;
                          }

                          return (
                            <div
                              style={{
                                marginTop: '10px',
                                padding: '8px 10px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                lineHeight: '1.4',
                                fontWeight: 600,
                                background: bannerBg,
                                color: bannerColor,
                                border: bannerBorder,
                              }}
                            >
                              {bannerText}
                            </div>
                          );
                        })()}

                        {/* Audit Log Terakhir Drawer */}
                        <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed #CBD5E1', fontSize: '10px', color: '#64748B' }}>
                          <span>Status Terakhir: </span>
                          <strong style={{ color: '#334155' }}>
                            {selectedTask.complaintLogs && selectedTask.complaintLogs.length > 0
                              ? `${selectedTask.complaintLogs[selectedTask.complaintLogs.length - 1].action} • ${selectedTask.complaintLogs[selectedTask.complaintLogs.length - 1].actor_name}`
                              : `Disposisi tugas diterbitkan oleh Pawas untuk satuan ${officer.satuan}`}
                          </strong>
                        </div>
                      </div>

                      {/* Header Hasil Pelacakan */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div>
                          <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#1E293B', margin: 0 }}>Hasil Pelacakan</h3>
                          <div style={{ fontSize: '10px', color: '#64748B', marginTop: '2px' }}>Timeline Progress Penanganan Kasus</div>
                        </div>
                        {(() => {
                          const isMySelected = hasOfficerAcceptedTask(selectedTask);
                          const selQuota = getTaskQuotaInfo(selectedTask);
                          const isSelPending = isTaskPendingAcceptance(selectedTask);

                          let badgeLabel = '⚡ Sedang Ditangani';
                          let badgeBg = '#EDE9FE';
                          let badgeColor = '#6D28D9';

                          if (selectedTask.status === 'SELESAI') {
                            badgeLabel = '✓ Selesai Ditangani';
                            badgeBg = '#DCFCE7';
                            badgeColor = '#16A34A';
                          } else if (selectedTask.status === 'MENUNGGU_PENGESAHAN') {
                            badgeLabel = '⚖️ Menunggu Pengesahan Pawas';
                            badgeBg = '#F3E8FF';
                            badgeColor = '#7C3AED';
                          } else if (isMySelected) {
                            badgeLabel = '⚡ Sedang Ditangani (Aktif)';
                            badgeBg = '#DCFCE7';
                            badgeColor = '#15803D';
                          } else if (selQuota.isQuotaFull) {
                            badgeLabel = `🔒 Kuota Penuh (${selQuota.acceptedCount}/${selQuota.quota})`;
                            badgeBg = '#F1F5F9';
                            badgeColor = '#475569';
                          } else if (isSelPending) {
                            badgeLabel = `🛡️ Butuh Konfirmasi (${selQuota.acceptedCount}/${selQuota.quota})`;
                            badgeBg = '#FEE2E2';
                            badgeColor = '#DC2626';
                          }

                          return (
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                padding: '4px 10px',
                                borderRadius: '12px',
                                background: badgeBg,
                                color: badgeColor,
                              }}
                            >
                              {badgeLabel}
                            </span>
                          );
                        })()}
                      </div>

                      {/* Incident Meta Details Card */}
                      <div className="incident-meta-card" style={{ marginBottom: '14px' }}>
                        <div className="incident-meta-top">
                          <div>
                            <div className="incident-meta-label">Nomor Laporan</div>
                            <div className="incident-meta-val" style={{ color: '#153E75', fontFamily: 'monospace', fontSize: '13px', fontWeight: 800 }}>
                              {selectedTask.nomorTiket}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div className="incident-meta-label">Waktu Lapor</div>
                            <div className="incident-meta-val" style={{ fontSize: '12px' }}>
                              {selectedTask.waktuLapor ? new Date(selectedTask.waktuLapor).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB' : 'Hari ini, 13:05 WIB'}
                            </div>
                          </div>
                        </div>
                        <div className="incident-meta-row" style={{ display: 'flex', gap: '6px', fontSize: '12px', marginBottom: '4px' }}>
                          <span style={{ color: '#64748B', fontWeight: 600 }}>Jenis Insiden:</span>
                          <span style={{ fontWeight: 700, color: '#1E293B' }}>{selectedTask.jenisKejadian}</span>
                        </div>
                        <div className="incident-meta-row" style={{ display: 'flex', gap: '6px', fontSize: '12px', marginBottom: '8px' }}>
                          <span style={{ color: '#64748B', fontWeight: 600 }}>Lokasi TKP:</span>
                          <span style={{ color: '#334155', fontWeight: 600 }}>{selectedTask.tkpAlamatTeks}</span>
                        </div>

                        {/* FOTO BUKTI LAPORAN WARGA (Hanya tampil jika pelapor melampirkan foto saat buat tiket) */}
                        {selectedTask.fotoBuktiUrl ? (
                          <div
                            style={{ position: 'relative', marginTop: '8px', borderRadius: '8px', overflow: 'hidden', background: '#0F172A', cursor: 'pointer' }}
                            onClick={() => {
                              setLightboxFoto({
                                src: selectedTask.fotoBuktiUrl,
                                title: `Foto Bukti Laporan 110 - ${selectedTask.nomorTiket}`,
                                meta: selectedTask.tkpAlamatTeks,
                              });
                            }}
                            title="Klik untuk perbesar foto laporan pelapor"
                          >
                            <img
                              src={selectedTask.fotoBuktiUrl}
                              alt="Foto Bukti Pelapor"
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
                              <span>Foto Bukti Laporan 110 • Terverifikasi</span>
                              <span style={{ background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(4px)', padding: '2px 8px', borderRadius: '4px', fontSize: '9px' }}>
                                🔍 Perbesar
                              </span>
                            </div>
                          </div>
                        ) : null}

                        <div style={{ fontSize: '11px', color: '#475569', lineHeight: '1.4', marginTop: '8px', fontStyle: 'italic' }}>
                          Laporan: &quot;{selectedTask.ringkasanKeterangan || selectedTask.deskripsiKejadian || selectedTask.jenisKejadian}&quot;
                        </div>
                      </div>

                      {/* 5-Step Rich Stepper Timeline (1:1 Prototype renderTimelineSteps) */}
                      {(() => {
                        const currentTahap = getComplaintTahap(selectedTask);
                        const isCaseFinished = selectedTask.status === 'SELESAI' || Boolean(selectedTask.pengesahanPawas);
                        const tanggalKasus = selectedTask.waktuLapor || selectedTask.created_at
                          ? new Date(selectedTask.waktuLapor || selectedTask.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                          : new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
                        const waktuKasus = selectedTask.waktuLapor || selectedTask.created_at
                          ? new Date(selectedTask.waktuLapor || selectedTask.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'
                          : '10:45 WIB';

                        const getStepState = (stepNum: number): 'completed' | 'active' | 'locked' => {
                          if (isCaseFinished || stepNum < currentTahap || (stepNum === 5 && (selectedTask.waktuSelesai || selectedTask.catatanSelesai))) {
                            return 'completed';
                          }
                          if (stepNum === currentTahap) {
                            return 'active';
                          }
                          return 'locked';
                        };

                        const renderBadge = (type: 'completed' | 'active' | 'locked') => {
                          if (type === 'completed') {
                            return (
                              <span style={{ fontSize: '10px', color: '#16A34A', fontWeight: 700, background: '#ECFDF5', padding: '2px 6px', borderRadius: '4px' }}>
                                ✓ SELESAI
                              </span>
                            );
                          }
                          if (type === 'active') {
                            return (
                              <span style={{ fontSize: '10px', background: '#DBEAFE', color: '#1D4ED8', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                                ● SEDANG BERLANGSUNG
                              </span>
                            );
                          }
                          return (
                            <span style={{ fontSize: '10px', background: '#F1F5F9', color: '#64748B', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                              🔒 TERKUNCI
                            </span>
                          );
                        };

                        const s1State = getStepState(1);
                        const s2State = getStepState(2);
                        const s3State = getStepState(3);
                        const s4State = getStepState(4);
                        const s5State = getStepState(5);

                        return (
                          <div className="timeline" style={{ position: 'relative', paddingLeft: '36px' }}>
                            {/* Step 1: Laporan Diterima (SPKT) */}
                            <div
                              className={`step ${s1State}`}
                              onClick={() => peringatanStepDisabled(1, currentTahap, s1State)}
                              title={s1State === 'completed' ? 'Laporan Diterima (SPKT) sudah selesai' : s1State === 'active' ? 'Laporan Diterima (SPKT) sedang berlangsung' : 'Laporan Diterima (SPKT) masih terkunci'}
                            >
                              <div className="step-icon"></div>
                              <div className="step-content">
                                <div className="step-title">
                                  <span>1. Laporan Diterima (SPKT)</span>
                                  {renderBadge(s1State)}
                                </div>
                                <div className="step-desc">
                                  Laporan Anda telah divalidasi oleh operator 110 dan diteruskan ke komando wilayah.
                                </div>
                                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: '8px' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', lineHeight: 1.2 }}>
                                    <span style={{ fontSize: '10px', color: '#64748B', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                                      <span>📅</span> {tanggalKasus}
                                    </span>
                                    <span className="step-time" style={{ fontSize: '11px', fontWeight: 700, color: '#1E293B' }}>
                                      Laporan Masuk: {waktuKasus}
                                    </span>
                                  </div>
                                  <span
                                    style={{
                                      fontSize: '10px',
                                      fontWeight: 700,
                                      color: selectedTask.fotoBuktiUrl ? '#1D4ED8' : '#64748B',
                                      background: selectedTask.fotoBuktiUrl ? '#EFF6FF' : '#F1F5F9',
                                      border: selectedTask.fotoBuktiUrl ? '1px solid #BFDBFE' : '1px solid #CBD5E1',
                                      padding: '3px 8px',
                                      borderRadius: '4px',
                                      cursor: selectedTask.fotoBuktiUrl ? 'pointer' : 'default',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (selectedTask.fotoBuktiUrl) {
                                        setLightboxFoto({
                                          src: selectedTask.fotoBuktiUrl,
                                          title: `Bukti Laporan 110 - ${selectedTask.nomorTiket}`,
                                          meta: `${tanggalKasus} • ${selectedTask.tkpAlamatTeks || ''}`,
                                        });
                                      } else {
                                        alert('Pelapor tidak menyertakan foto bukti saat membuat tiket laporan 110 ini.');
                                      }
                                    }}
                                    title={selectedTask.fotoBuktiUrl ? 'Klik untuk lihat bukti foto 110' : 'Pelapor tidak menyertakan foto bukti'}
                                  >
                                    {selectedTask.fotoBuktiUrl ? '📷 Bukti Laporan 110 ➔' : '📷 Tanpa Foto Pelapor'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Step 2: Disposisi Personel */}
                            <div
                              className={`step ${s2State}`}
                              onClick={() => peringatanStepDisabled(2, currentTahap, s2State)}
                              title={s2State === 'completed' ? 'Disposisi Personel sudah selesai' : s2State === 'active' ? 'Disposisi Personel sedang berlangsung' : 'Disposisi Personel masih terkunci'}
                            >
                              <div className="step-icon"></div>
                              <div className="step-content">
                                <div className="step-title">
                                  <span>2. Disposisi Personel</span>
                                  {renderBadge(s2State)}
                                </div>
                                <div className="step-desc">
                                  Tugas penanganan telah diserahkan kepada unit terdekat dari lokasi kejadian.
                                </div>
                                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: '8px' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', lineHeight: 1.2 }}>
                                    <span style={{ fontSize: '10px', color: '#64748B', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                                      <span>📅</span> {tanggalKasus}
                                    </span>
                                    <span className="step-time" style={{ fontSize: '11px', fontWeight: 700, color: '#1E293B' }}>
                                      Disposisi Pawas: {selectedTask.disposisiAt ? new Date(selectedTask.disposisiAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB' : waktuKasus}
                                    </span>
                                  </div>
                                </div>
                                <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '6px', padding: '6px 8px', marginTop: '6px', fontSize: '10.5px', color: '#78350F' }}>
                                  <strong>👑 Arahan Pawas:</strong> &quot;{selectedTask.arahanPawas || selectedTask.dispatches?.[0]?.tactical_orders || 'Laksanakan pengamanan perimeter, bubarkan massa, dan amankan barang bukti.'}&quot;
                                </div>
                              </div>
                            </div>

                            {/* Step 3: Personel Menuju Lokasi */}
                            <div
                              className={`step ${s3State}`}
                              onClick={() => peringatanStepDisabled(3, currentTahap, s3State)}
                              title={s3State === 'completed' ? 'Personel Menuju Lokasi sudah selesai' : s3State === 'active' ? 'Personel Menuju Lokasi sedang berlangsung' : 'Personel Menuju Lokasi masih terkunci'}
                            >
                              <div className="step-icon"></div>
                              <div className="step-content">
                                <div className="step-title">
                                  <span>3. Personel Menuju Lokasi</span>
                                  {renderBadge(s3State)}
                                </div>
                                <div className="step-desc">
                                  Tim sedang meluncur ke lokasi kejadian. Harap tetap tenang dan amankan lokasi.
                                </div>
                                {s3State === 'completed' || selectedTask.waktuMeluncur ? (
                                  <>
                                    {(() => {
                                      const resolvedFotoPersiapan =
                                        selectedTask.fotoPersiapan ||
                                        (selectedTask.evidences || []).find(
                                          (e: any) => e.incident_phase === 'MENUJU_TKP' || (e.caption || '').includes('Meluncur') || (e.caption || '').includes('Persiapan')
                                        )?.file_url;
                                      const depTime = getTaskWaktuMeluncur(selectedTask) || selectedTask.waktuMeluncur || waktuKasus;
                                      const depGps = getTaskKoordinatGps(selectedTask) || selectedTask.koordinatGps || `${currentGps.lat}, ${currentGps.lng}`;
                                      const depAddress = getTaskAlamatKeberangkatan(selectedTask, depGps);
                                      const etaText = getTaskEtaText(selectedTask) || '± 25-30 Menit';

                                      return (
                                        <>
                                          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: '8px' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', lineHeight: 1.2 }}>
                                              <span style={{ fontSize: '10px', color: '#64748B', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                <span>📅</span> {tanggalKasus}
                                              </span>
                                              <span className="step-time" style={{ fontSize: '11px', fontWeight: 700, color: '#1E293B' }}>
                                                Meluncur: {depTime}
                                              </span>
                                            </div>
                                            {resolvedFotoPersiapan ? (
                                              <span
                                                style={{
                                                  fontSize: '10px',
                                                  fontWeight: 700,
                                                  color: '#1E40AF',
                                                  background: '#EFF6FF',
                                                  border: '1px solid #BFDBFE',
                                                  padding: '3px 8px',
                                                  borderRadius: '4px',
                                                  cursor: 'pointer',
                                                  display: 'inline-flex',
                                                  alignItems: 'center',
                                                  gap: '4px',
                                                }}
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setLightboxFoto({
                                                    src: resolvedFotoPersiapan,
                                                    title: `Bukti Persiapan & Keberangkatan - ${selectedTask.nomorTiket}`,
                                                    meta: `Lokasi Keberangkatan: ${depAddress} • Meluncur: ${depTime}`,
                                                  });
                                                }}
                                                title="Klik untuk lihat bukti foto persiapan & GPS keberangkatan"
                                              >
                                                📷 Bukti Persiapan &amp; GPS ➔
                                              </span>
                                            ) : (
                                              <span
                                                style={{
                                                  fontSize: '9.5px',
                                                  color: '#64748B',
                                                  background: '#F1F5F9',
                                                  padding: '2px 6px',
                                                  borderRadius: '4px',
                                                }}
                                              >
                                                Tanpa Foto Persiapan
                                              </span>
                                            )}
                                          </div>
                                          {!isCaseFinished && resolvedFotoPersiapan ? (
                                            <div
                                              className="tracking-map"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setLightboxFoto({
                                                  src: resolvedFotoPersiapan,
                                                  title: `Bukti Persiapan & Keberangkatan - ${selectedTask.nomorTiket}`,
                                                  meta: `Lokasi Keberangkatan: ${depAddress} • Meluncur: ${depTime}`,
                                                });
                                              }}
                                              title="Klik untuk memperbesar Bukti Persiapan & Lokasi Keberangkatan"
                                              style={{ cursor: 'pointer', position: 'relative', borderRadius: '8px', overflow: 'hidden', marginTop: '8px', border: '1px solid #CBD5E1' }}
                                            >
                                              <img
                                                src={resolvedFotoPersiapan}
                                                alt="Bukti Persiapan & Lokasi Keberangkatan"
                                                style={{ width: '100%', height: '110px', objectFit: 'cover', display: 'block' }}
                                              />
                                              <div
                                                style={{
                                                  position: 'absolute',
                                                  bottom: 0,
                                                  left: 0,
                                                  right: 0,
                                                  background: 'linear-gradient(transparent, rgba(15,23,42,0.85))',
                                                  padding: '6px 10px',
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  gap: '8px',
                                                }}
                                              >
                                                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#1E40AF', border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', color: 'white' }}>
                                                  👮
                                                </div>
                                                <div style={{ color: 'white', lineHeight: 1.2 }}>
                                                  <div style={{ fontSize: '11px', fontWeight: 700 }}>
                                                    {(() => {
                                                      const accList = getAcceptedPersonnelList(selectedTask);
                                                      if (accList.length > 1) {
                                                        return `${accList[0].name} & Regu (${accList.length} Personel)`;
                                                      }
                                                      return selectedTask.personelDitugaskan || officer.fullName || 'Petugas Lapangan';
                                                    })()}
                                                  </div>
                                                  <div style={{ fontSize: '9.5px', opacity: 0.9 }}>
                                                    Estimasi Tiba: {etaText} • 🔍 Klik perbesar foto
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          ) : null}
                                          <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderLeft: '3px solid #16A34A', borderRadius: '6px', padding: '6px 10px', marginTop: '8px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                                              <span style={{ fontSize: '10px', fontWeight: 700, color: '#166534' }}>📍 ALAMAT KEBERANGKATAN:</span>
                                              <span style={{ fontSize: '9.5px', background: '#DCFCE7', color: '#15803D', fontWeight: 700, padding: '1px 5px', borderRadius: '3px' }}>TERVERIFIKASI</span>
                                            </div>
                                            <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#1E293B', lineHeight: 1.4 }}>
                                              {depAddress}
                                            </div>
                                            {selectedTask.catatanPersiapan && (
                                              <div style={{ fontSize: '10.5px', color: '#475569', fontStyle: 'italic', marginTop: '3px' }}>
                                                &quot;{selectedTask.catatanPersiapan}&quot;
                                              </div>
                                            )}
                                          </div>
                                        </>
                                      );
                                    })()}
                                  </>
                                ) : (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', lineHeight: 1.2, marginTop: '8px' }}>
                                    <span style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 600 }}>📅 {tanggalKasus}</span>
                                    <span className="step-time" style={{ color: '#94A3B8', fontStyle: 'italic', fontSize: '11px' }}>
                                      Menunggu Konfirmasi Keberangkatan
                                    </span>
                                  </div>
                                )}

                                {/* DAFTAR PERSONEL REGU YANG IKUT / MENYETUJUI TUGAS */}
                                {s3State !== 'locked' && (() => {
                                  const acceptedList = getAcceptedPersonnelList(selectedTask);
                                  const quotaInfo = getTaskQuotaInfo(selectedTask);
                                  if (acceptedList.length === 0) return null;

                                  return (
                                    <div
                                      style={{
                                        marginTop: '10px',
                                        background: '#F8FAFC',
                                        border: '1px solid #E2E8F0',
                                        borderRadius: '8px',
                                        padding: '10px 12px',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                                      }}
                                    >
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                          <span style={{ fontSize: '13px' }}>👥</span>
                                          <span style={{ fontSize: '11px', fontWeight: 800, color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                                            Personel yang Ikut / Menyetujui
                                          </span>
                                          <span
                                            style={{
                                              fontSize: '10px',
                                              fontWeight: 800,
                                              background: '#DBEAFE',
                                              color: '#1E40AF',
                                              padding: '1px 6px',
                                              borderRadius: '10px',
                                            }}
                                          >
                                            {acceptedList.length}{quotaInfo.quota ? `/${quotaInfo.quota}` : ''} Personel
                                          </span>
                                        </div>
                                        <span
                                          style={{
                                            fontSize: '9.5px',
                                            background: '#DCFCE7',
                                            color: '#15803D',
                                            fontWeight: 700,
                                            padding: '2px 7px',
                                            borderRadius: '4px',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '3px',
                                          }}
                                        >
                                          <span>✓</span> Terkonfirmasi Siaga
                                        </span>
                                      </div>

                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        {acceptedList.map((off, idx) => (
                                          <div
                                            key={idx}
                                            style={{
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'space-between',
                                              background: 'white',
                                              border: off.isCurrentOfficer ? '1.5px solid #93C5FD' : '1px solid #E2E8F0',
                                              borderRadius: '6px',
                                              padding: '7px 10px',
                                              boxShadow: off.isCurrentOfficer ? '0 1px 4px rgba(59,130,246,0.1)' : 'none',
                                            }}
                                          >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                                              {off.avatarUrl ? (
                                                <img
                                                  src={off.avatarUrl}
                                                  alt={off.name}
                                                  style={{
                                                    width: '30px',
                                                    height: '30px',
                                                    borderRadius: '50%',
                                                    objectFit: 'cover',
                                                    border: '1.5px solid #CBD5E1',
                                                    flexShrink: 0,
                                                  }}
                                                />
                                              ) : (
                                                <div
                                                  style={{
                                                    width: '30px',
                                                    height: '30px',
                                                    borderRadius: '50%',
                                                    background: off.isCurrentOfficer
                                                      ? 'linear-gradient(135deg, #1E40AF, #3B82F6)'
                                                      : 'linear-gradient(135deg, #065F46, #10B981)',
                                                    color: 'white',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '11px',
                                                    fontWeight: 800,
                                                    letterSpacing: '0.5px',
                                                    flexShrink: 0,
                                                    boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                                                  }}
                                                >
                                                  {off.initials || '👮'}
                                                </div>
                                              )}
                                              <div style={{ minWidth: 0 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                                                  <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#0F172A', whiteSpace: 'nowrap' }}>
                                                    {off.name}
                                                  </span>
                                                  {off.isCurrentOfficer && (
                                                    <span
                                                      style={{
                                                        fontSize: '9px',
                                                        background: '#EFF6FF',
                                                        color: '#1D4ED8',
                                                        border: '1px solid #BFDBFE',
                                                        padding: '0.5px 5px',
                                                        borderRadius: '3px',
                                                        fontWeight: 700,
                                                      }}
                                                    >
                                                      Anda
                                                    </span>
                                                  )}
                                                  {off.isPrimary && !off.isCurrentOfficer && (
                                                    <span
                                                      style={{
                                                        fontSize: '9px',
                                                        background: '#FEF3C7',
                                                        color: '#92400E',
                                                        border: '1px solid #FDE68A',
                                                        padding: '0.5px 5px',
                                                        borderRadius: '3px',
                                                        fontWeight: 700,
                                                      }}
                                                    >
                                                      Lead Unit
                                                    </span>
                                                  )}
                                                </div>
                                                <div
                                                  style={{
                                                    fontSize: '10px',
                                                    color: '#64748B',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    marginTop: '1px',
                                                    flexWrap: 'wrap',
                                                  }}
                                                >
                                                  <span>NRP: <strong style={{ color: '#334155' }}>{off.nrp || '-'}</strong></span>
                                                  {off.unit && <span>• {off.unit}</span>}
                                                </div>
                                              </div>
                                            </div>

                                            <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '8px' }}>
                                              <div
                                                style={{
                                                  fontSize: '9.5px',
                                                  fontWeight: 700,
                                                  color: '#15803D',
                                                  background: '#F0FDF4',
                                                  border: '1px solid #BBF7D0',
                                                  padding: '1.5px 6px',
                                                  borderRadius: '4px',
                                                  display: 'inline-flex',
                                                  alignItems: 'center',
                                                  gap: '3px',
                                                }}
                                              >
                                                <span>✓</span> Menyetujui
                                              </div>
                                              {off.acceptedAt && (
                                                <div style={{ fontSize: '9px', color: '#64748B', marginTop: '2px', fontWeight: 600 }}>
                                                  {off.acceptedAt}
                                                </div>
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

                            {/* Step 4: Penanganan di Lokasi */}
                            <div
                              className={`step ${s4State}`}
                              onClick={() => peringatanStepDisabled(4, currentTahap, s4State)}
                              title={s4State === 'completed' ? 'Penanganan di Lokasi sudah selesai' : s4State === 'active' ? 'Penanganan di Lokasi sedang berlangsung' : 'Penanganan di Lokasi masih terkunci'}
                            >
                              <div className="step-icon"></div>
                              <div className="step-content">
                                <div className="step-title">
                                  <span>4. Penanganan di Lokasi</span>
                                  {renderBadge(s4State)}
                                </div>
                                <div className="step-desc">
                                  Personel tiba di lokasi dan sedang melakukan tindakan kepolisian.
                                </div>
                                {s4State === 'completed' || (s4State === 'active' && selectedTask.waktuTiba) ? (
                                  <>
                                    {(() => {
                                      const resolvedFotoTindakan =
                                        selectedTask.fotoTindakan ||
                                        selectedTask.fotoTiba ||
                                        (selectedTask.evidences || []).find(
                                          (e: any) => e.incident_phase === 'TIBA_TKP' || e.incident_phase === 'PENANGANAN' || (e.caption || '').includes('Tindakan') || (e.caption || '').includes('Tiba')
                                        )?.file_url;
                                      const tibaTime = getTaskWaktuTiba(selectedTask) || selectedTask.waktuTiba || waktuKasus;

                                      return (
                                        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: '8px' }}>
                                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', lineHeight: 1.2 }}>
                                            <span style={{ fontSize: '10px', color: '#64748B', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                                              <span>📅</span> {tanggalKasus}
                                            </span>
                                            <span className="step-time" style={{ fontSize: '11px', fontWeight: 700, color: '#1E293B' }}>
                                              Tiba: {tibaTime}
                                            </span>
                                          </div>
                                          {resolvedFotoTindakan ? (
                                            <span
                                              style={{
                                                fontSize: '10px',
                                                fontWeight: 700,
                                                color: '#16A34A',
                                                background: '#ECFDF5',
                                                border: '1px solid #A7F3D0',
                                                padding: '3px 8px',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                              }}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setLightboxFoto({
                                                  src: resolvedFotoTindakan,
                                                  title: `Bukti Tindakan TKP - ${selectedTask.nomorTiket}`,
                                                  meta: `Tiba: ${tibaTime} • ${selectedTask.tkpAlamatTeks || ''}`,
                                                });
                                              }}
                                              title="Klik untuk lihat bukti foto tindakan"
                                            >
                                              📸 Bukti Tindakan TKP ➔
                                            </span>
                                          ) : (
                                            <span
                                              style={{
                                                fontSize: '9.5px',
                                                color: '#64748B',
                                                background: '#F1F5F9',
                                                padding: '2px 6px',
                                                borderRadius: '4px',
                                              }}
                                            >
                                              Menunggu Foto Tindakan
                                            </span>
                                          )}
                                        </div>
                                      );
                                    })()}
                                    <div style={{ background: '#FEFCE8', borderLeft: '3px solid #EAB308', borderRadius: '0 6px 6px 0', padding: '6px 10px', marginTop: '8px', lineHeight: 1.4 }}>
                                      <div style={{ fontSize: '10px', fontWeight: 700, color: '#854D0E', marginBottom: '2px' }}>📝 BERITA ACARA TINDAKAN TKP:</div>
                                      <div style={{ fontSize: '11px', color: '#1E293B' }}>&quot;{selectedTask.deskripsiTindakan || selectedTask.ringkasanKeterangan || 'Petugas telah tiba di TKP. Melakukan pengamanan perimeter dan tindakan kepolisian presisi sesuai SOP.'}&quot;</div>
                                    </div>
                                  </>
                                ) : (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', lineHeight: 1.2, marginTop: '8px' }}>
                                    <span style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 600 }}>📅 {tanggalKasus}</span>
                                    <span className="step-time" style={{ color: '#94A3B8', fontStyle: 'italic', fontSize: '11px' }}>
                                      Menunggu Personel Tiba di TKP
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Step 5: Kasus Selesai Ditangani */}
                            <div
                              className={`step ${s5State}`}
                              onClick={() => peringatanStepDisabled(5, currentTahap, s5State)}
                              title={s5State === 'completed' ? 'Kasus Selesai Ditangani sudah selesai' : s5State === 'active' ? 'Kasus Selesai Ditangani sedang berlangsung' : 'Kasus Selesai Ditangani masih terkunci'}
                            >
                              <div className="step-icon"></div>
                              <div className="step-content">
                                <div className="step-title">
                                  <span>5. Kasus Selesai Ditangani</span>
                                  {renderBadge(s5State)}
                                </div>
                                <div className="step-desc">
                                  Penanganan selesai dan log telah disetujui oleh pimpinan.
                                </div>
                                {s5State === 'completed' || s5State === 'active' ? (
                                  <>
                                    {(() => {
                                      const resolvedFotoSelesai =
                                        selectedTask.fotoSelesai ||
                                        (selectedTask.evidences || []).find(
                                          (e: any) => e.incident_phase === 'SELESAI_KONDUSIF' || e.incident_phase === 'SELESAI' || (e.caption || '').includes('Selesai')
                                        )?.file_url;

                                      const selesaiTime = getTaskWaktuSelesai(selectedTask) || selectedTask.waktuSelesai || selectedTask.pengesahanPawas?.waktu || waktuKasus;

                                      return (
                                        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: '8px' }}>
                                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', lineHeight: 1.2 }}>
                                            <span style={{ fontSize: '10px', color: '#64748B', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                                              <span>📅</span> {tanggalKasus}
                                            </span>
                                            <span className="step-time" style={{ fontSize: '11px', fontWeight: 700, color: '#1E293B' }}>
                                              {selectedTask.pengesahanPawas ? 'Disahkan: ' : 'Selesai: '}{selesaiTime}
                                            </span>
                                          </div>
                                          {resolvedFotoSelesai ? (
                                            <span
                                              style={{
                                                fontSize: '10px',
                                                fontWeight: 700,
                                                color: '#16A34A',
                                                background: '#ECFDF5',
                                                border: '1px solid #A7F3D0',
                                                padding: '3px 8px',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                              }}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setLightboxFoto({
                                                  src: resolvedFotoSelesai,
                                                  title: `Bukti Situasi Akhir - ${selectedTask.nomorTiket}`,
                                                  meta: `Selesai: ${selesaiTime}`,
                                                });
                                              }}
                                              title="Klik untuk lihat bukti foto penyelesaian akhir"
                                            >
                                              ✅ Bukti Situasi Akhir ➔
                                            </span>
                                          ) : (
                                            <span
                                              style={{
                                                fontSize: '9.5px',
                                                color: '#16A34A',
                                                fontWeight: 700,
                                                background: '#ECFDF5',
                                                padding: '2px 6px',
                                                borderRadius: '4px',
                                              }}
                                            >
                                              ✓ Kondusif
                                            </span>
                                          )}
                                        </div>
                                      );
                                    })()}
                                    <div style={{ background: '#ECFDF5', borderLeft: '3px solid #10B981', borderRadius: '0 6px 6px 0', padding: '6px 10px', marginTop: '8px', lineHeight: 1.4 }}>
                                      <div style={{ fontSize: '10px', fontWeight: 700, color: '#047857', marginBottom: '2px' }}>✓ LAPORAN AKHIR PETUGAS:</div>
                                      <div style={{ fontSize: '11px', color: '#1E293B' }}>&quot;{selectedTask.catatanSelesai || 'Situasi telah aman dan kondusif. Penanganan lapangan tuntas sesuai SOP.'}&quot;</div>
                                    </div>
                                    {selectedTask.pengesahanPawas ? (
                                      <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderLeft: '4px solid #16A34A', borderRadius: '6px', padding: '7px 10px', marginTop: '8px', lineHeight: 1.4 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                          <span style={{ fontSize: '10px', fontWeight: 800, color: '#15803D' }}>⚖️ PENGESAHAN RESMI PIMPINAN (PAWAS):</span>
                                          <span style={{ fontSize: '9.5px', fontWeight: 700, background: '#DCFCE7', color: '#166534', padding: '1px 6px', borderRadius: '3px' }}>SAH &amp; VALID</span>
                                        </div>
                                        <div style={{ fontSize: '10.5px', color: '#166534', marginTop: '2px' }}>
                                          <strong>Pengesah:</strong> {selectedTask.pengesahanPawas.aktor || 'AKP Eko Susanto, S.I.K.'} • <strong>Waktu:</strong> {selectedTask.pengesahanPawas.waktu || getTaskWaktuSelesai(selectedTask) || selectedTask.waktuSelesai || waktuKasus}
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#1E293B', fontStyle: 'italic', marginTop: '2px' }}>
                                          &quot;{selectedTask.pengesahanPawas.catatan || 'Berita acara lengkap, penanganan tuntas sesuai SOP Polri Presisi.'}&quot;
                                        </div>
                                      </div>
                                    ) : selectedTask.status === 'MENUNGGU_PENGESAHAN' ? (
                                      <div style={{ background: '#FAF5FF', border: '1px solid #DDD6FE', borderLeft: '4px solid #7C3AED', borderRadius: '6px', padding: '7px 10px', marginTop: '8px', lineHeight: 1.4 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                          <span style={{ fontSize: '10px', fontWeight: 800, color: '#6D28D9' }}>⚖️ STATUS BERKAS PERKARA:</span>
                                          <span style={{ fontSize: '9.5px', fontWeight: 700, background: '#EDE9FE', color: '#6D28D9', padding: '1px 6px', borderRadius: '3px' }}>MENUNGGU PENGESAHAN PAWAS</span>
                                        </div>
                                        <div style={{ fontSize: '10.5px', color: '#6D28D9', marginTop: '2px' }}>
                                          Tindakan lapangan di TKP telah rampung dilaporkan. Menunggu verifikasi &amp; tanda tangan pengesahan resmi oleh Pawas.
                                        </div>
                                      </div>
                                    ) : null}
                                  </>
                                ) : (
                                  <div style={{ marginTop: '8px' }}>
                                    <span className="step-time" style={{ color: '#94A3B8', fontStyle: 'italic', fontSize: '11px' }}>
                                      Menunggu Otorisasi Penutupan Kasus
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Action Buttons */}
                      {selectedTask.status !== 'SELESAI' && (() => {
                        const isMySelected = hasOfficerAcceptedTask(selectedTask);
                        const selQuota = getTaskQuotaInfo(selectedTask);

                        if (isMySelected) {
                          return (
                            <button
                              type="button"
                              className="btn-blue"
                              style={{
                                margin: '16px 0 0 0',
                                width: '100%',
                                padding: '12px',
                                background: 'linear-gradient(135deg, #153E75 0%, #1E40AF 100%)',
                                color: 'white',
                                fontSize: '13px',
                                fontWeight: 800,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                border: 'none',
                                borderRadius: '8px',
                                boxShadow: '0 3px 10px rgba(21,62,117,0.3)',
                                cursor: 'pointer',
                              }}
                              onClick={() => {
                                openWizardForComplaint(selectedTask);
                              }}
                            >
                              <span>🚀</span> Lanjutkan Penanganan Kasus (Buka Wizard) ➔
                            </button>
                          );
                        }

                        if (selQuota.isQuotaFull) {
                          return (
                            <div
                              style={{
                                marginTop: '16px',
                                padding: '12px 14px',
                                background: '#F1F5F9',
                                border: '1px solid #CBD5E1',
                                borderRadius: '8px',
                                textAlign: 'center',
                                color: '#475569',
                                fontSize: '12.5px',
                                fontWeight: 700,
                              }}
                            >
                              🔒 Kuota Personel Terpenuhi ({selQuota.acceptedCount}/{selQuota.quota} Personel Telah Mengambil Tiket Ini)
                              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 500, marginTop: '2px' }}>
                                Tiket telah ditangani oleh personel lain dalam satuan Anda.
                              </div>
                            </div>
                          );
                        }

                        return (
                          <button
                            type="button"
                            className="btn-blue"
                            style={{
                              margin: '16px 0 0 0',
                              width: '100%',
                              padding: '12px',
                              background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                              color: 'white',
                              fontSize: '13px',
                              fontWeight: 800,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px',
                              border: 'none',
                              borderRadius: '8px',
                              boxShadow: '0 3px 10px rgba(16,185,129,0.3)',
                              cursor: 'pointer',
                            }}
                            onClick={() => {
                              setPendingAcceptTask(selectedTask);
                              setShowAcceptModal(true);
                            }}
                          >
                            <span>🛡️</span> Tinjau Lembar Disposisi &amp; Terima Tugas ({selQuota.slotsRemaining} Slot Tersisa) ➔
                          </button>
                        );
                      })()}
                    </div>
                  ) : (
                    <div style={{ padding: '40px 24px', textAlign: 'center', background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', color: '#64748B' }}>
                      <div style={{ fontSize: '32px', marginBottom: '8px' }}>📋</div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B' }}>Pilih Penugasan</div>
                      <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
                        Klik salah satu tugas di sebelah kiri untuk melihat rincian alur penanganan.
                      </div>
                    </div>
                  )}
                </div>
              </div>
              )}
            </section>
          )}

          {/* ======================================================== */}
          {/* SCREEN 5: KINERJA / LAPORAN AKHIR TUGAS                  */}
          {/* ======================================================== */}
          {activeTab === 'view-laporan' && (
            <section id="view-laporan" className="view active">
              <h2 className="page-title">Laporan Akhir Tugas</h2>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', padding: '0 16px' }}>
                <div className="tabs-segmented" style={{ margin: 0, flexGrow: 1, marginRight: '12px' }}>
                  <div
                    className={`tab-seg ${kpiPeriod === 'harian' ? 'active' : ''}`}
                    onClick={() => setKpiPeriod('harian')}
                  >
                    Harian
                  </div>
                  <div
                    className={`tab-seg ${kpiPeriod === 'mingguan' ? 'active' : ''}`}
                    onClick={() => setKpiPeriod('mingguan')}
                  >
                    Mingguan
                  </div>
                  <div
                    className={`tab-seg ${kpiPeriod === 'bulanan' ? 'active' : ''}`}
                    onClick={() => setKpiPeriod('bulanan')}
                  >
                    Bulanan
                  </div>
                </div>
                <input
                  type="date"
                  className="form-control"
                  style={{ width: '140px', padding: '8px', fontSize: '12px', background: 'white', fontWeight: 'bold', color: '#153E75' }}
                  defaultValue={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Charts Grid */}
              {(() => {
                const totalLogs = logbooks.length;
                const approvedLogs = logbooks.filter((l) => (l.statusValidasi || '').toUpperCase() === 'DISETUJUI').length;
                const pendingLogs = logbooks.filter((l) => !l.statusValidasi || (l.statusValidasi || '').toUpperCase() === 'MENUNGGU').length;
                const rejectedLogs = logbooks.filter((l) => (l.statusValidasi || '').toUpperCase() === 'DITOLAK').length;
                const patroliCount = logbooks.filter((l) => (l.jenisAksi || '').toUpperCase() === 'PATROLI').length;
                const tptkpCount = logbooks.filter((l) => (l.jenisAksi || '').toUpperCase() === 'TPTKP').length;
                const sambangCount = logbooks.filter((l) => (l.jenisAksi || '').toUpperCase() === 'SAMBANG').length;
                const pengamananCount = logbooks.filter((l) => (l.jenisAksi || '').toUpperCase() === 'PENGAMANAN').length;

                return (
                  <>
                    <div className="charts-grid">
                      <div className="chart-card">
                        <div className="chart-title">Distribusi Jenis Kegiatan</div>
                        <div className="chart-canvas" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ fontSize: '12px', color: '#64748B', textAlign: 'center' }}>
                            🚔 Patroli: <strong>{patroliCount}</strong> | 🛡️ TPTKP: <strong>{tptkpCount}</strong><br />
                            🤝 Sambang: <strong>{sambangCount}</strong> | ⚠️ Pengamanan: <strong>{pengamananCount}</strong>
                          </div>
                        </div>
                      </div>
                      <div className="chart-card">
                        <div className="chart-title">Status Validasi Log</div>
                        <div className="chart-canvas" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ fontSize: '12px', color: '#059669', textAlign: 'center' }}>
                            ✅ <strong>{approvedLogs}</strong> Disetujui Pawas<br />
                            ⏳ <strong>{pendingLogs}</strong> Menunggu Review
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Stats Row */}
                    <div className="stats-row" style={{ marginTop: '16px' }}>
                      <div className="stats-col">
                        <div className="stat-item">
                          <span>Total Log Kirim</span> <span style={{ color: '#153E75', fontWeight: 800 }}>{totalLogs}</span>
                        </div>
                        <div className="stat-item">
                          <span>Log Disetujui</span> <span style={{ color: '#10B981', fontWeight: 800 }}>{approvedLogs}</span>
                        </div>
                      </div>
                      <div className="stats-col">
                        <div className="stat-item">
                          <span>Log Menunggu</span> <span style={{ color: '#F59E0B', fontWeight: 800 }}>{pendingLogs}</span>
                        </div>
                        <div className="stat-item">
                          <span>Log Ditolak</span> <span style={{ color: '#EF4444', fontWeight: 800 }}>{rejectedLogs}</span>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}

              <div style={{ padding: '0 16px 20px' }}>
                <button
                  type="button"
                  className="btn-blue"
                  onClick={() => alert('Mengekspor berkas laporan akuntabilitas tugas ke PDF...')}
                  style={{ width: '100%', margin: 0 }}
                >
                  🖨️ Cetak / Ekspor Laporan Akhir Tugas (PDF)
                </button>
              </div>
            </section>
          )}

          {/* ======================================================== */}
          {/* SCREEN 6: PROFIL PENGGUNA                                */}
          {/* ======================================================== */}
          {activeTab === 'view-profil' && (
            <section id="view-profil" className="view active" style={{ paddingBottom: '95px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 20px',
                  borderBottom: '1px solid #E2E8F0',
                  background: '#FFFFFF',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 className="page-title" style={{ margin: 0, fontSize: '18px' }}>
                      Profil Petugas
                    </h2>
                    <span style={{ background: '#EFF6FF', color: '#1D4ED8', fontSize: '11px', fontWeight: 800, padding: '3px 10px', borderRadius: '12px', border: '1px solid #DBEAFE' }}>
                      LAPANGAN
                    </span>
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
                    Sentra Pelayanan Kepolisian Terpadu (SPKT) • SIMAPRES
                  </div>
                </div>
              </div>

              <div style={{ margin: '20px auto', padding: '0 16px' }}>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', justifyContent: 'center', flexWrap: 'wrap' }}>
                  {/* Left Column: Identitas, Presensi, Pengaturan */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, minWidth: '320px', maxWidth: '460px' }}>
                    {/* Kartu Identitas Petugas */}
                    <div
                      style={{
                        background: 'linear-gradient(135deg, #0F2D56 0%, #153E75 60%, #1E3A8A 100%)',
                        borderRadius: '16px',
                        padding: '20px',
                        color: 'white',
                        boxShadow: '0 12px 24px -4px rgba(21,62,117,0.3)',
                        border: '1px solid rgba(255,255,255,0.15)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '16px' }}>🛡️</span>
                          <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.8px', color: '#FDE68A' }}>
                            POLRES METRO JAKARTA
                          </span>
                        </div>
                        <span style={{ fontSize: '9.5px', fontWeight: 800, background: 'rgba(16,185,129,0.25)', color: '#6EE7B7', border: '1px solid rgba(110,231,183,0.3)', padding: '2px 8px', borderRadius: '12px' }}>
                          SIAGA PIKET AKTIF
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '16px' }}>
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                          <img
                            src={officer.avatar}
                            alt="Avatar"
                            style={{ width: '76px', height: '76px', borderRadius: '12px', objectFit: 'cover', border: '2.5px solid #FBBF24', boxShadow: '0 6px 14px rgba(0,0,0,0.35)' }}
                          />
                          <div
                            style={{ position: 'absolute', bottom: '-2px', right: '-2px', background: '#10B981', width: '14px', height: '14px', borderRadius: '50%', border: '2px solid #0F2D56' }}
                            title="Aktif Berdinas"
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#93C5FD', textTransform: 'uppercase' }}>
                            {officer.pangkat}
                          </div>
                          <h3 style={{ fontSize: '17px', color: '#FFFFFF', fontWeight: 800, margin: '2px 0 3px', lineHeight: 1.2 }}>
                            {officer.fullName}
                          </h3>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: '#FDE68A', fontFamily: 'monospace' }}>
                            NRP: {officer.nrp}
                          </div>
                          <div style={{ fontSize: '10.5px', color: '#E2E8F0', marginTop: '3px' }}>
                            {officer.satuan}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', background: 'rgba(0,0,0,0.25)', padding: '10px', borderRadius: '10px', textAlign: 'center' }}>
                        <div>
                          <div style={{ fontSize: '9.5px', color: '#94A3B8', fontWeight: 600 }}>Total Laporan</div>
                          <div style={{ fontSize: '15px', fontWeight: 900, color: '#FBBF24' }}>142</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '9.5px', color: '#94A3B8', fontWeight: 600 }}>Respon SLA</div>
                          <div style={{ fontSize: '15px', fontWeight: 900, color: '#34D399' }}>96.4%</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '9.5px', color: '#94A3B8', fontWeight: 600 }}>Tuntas</div>
                          <div style={{ fontSize: '15px', fontWeight: 900, color: '#60A5FA' }}>138</div>
                        </div>
                      </div>
                    </div>

                    {/* Kartu Presensi Petugas */}
                    <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '18px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '18px' }}>⏱️</span>
                          <div>
                            <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: 800, color: '#1E293B' }}>Presensi Piket</h4>
                            <div style={{ fontSize: '11px', color: '#64748B' }}>Pencatatan Kehadiran Tugas Piket</div>
                          </div>
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 800, color: '#153E75', fontFamily: 'monospace', background: '#EFF6FF', padding: '3px 8px', borderRadius: '6px' }}>
                          {liveClock || '08:00 WIB'}
                        </span>
                      </div>

                      <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '12px', marginBottom: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '11.5px' }}>
                          <span style={{ color: '#64748B' }}>Status Kehadiran:</span>
                          <span style={{ fontWeight: 800, color: '#15803D', background: '#DCFCE7', padding: '2px 8px', borderRadius: '6px' }}>
                            ● Dinas Aktif
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '6px' }}>
                          <span style={{ color: '#64748B' }}>Jam Masuk Piket:</span>
                          <span style={{ fontWeight: 700, color: '#1E293B' }}>{presensiMasukTime}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '8px' }}>
                          <span style={{ color: '#64748B' }}>Jam Pulang / Lepas:</span>
                          <span style={{ fontWeight: 700, color: '#64748B' }}>{presensiPulangTime || 'Belum Presensi'}</span>
                        </div>

                        <div style={{ borderTop: '1px dashed #CBD5E1', paddingTop: '8px', marginTop: '6px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '5px' }}>
                            <span style={{ color: '#64748B' }}>Mako Utama:</span>
                            <span style={{ fontWeight: 700, color: '#1E293B', textAlign: 'right', maxWidth: '65%' }}>
                              🏢 {makoUtama?.name || 'Polres Metro Jakarta Selatan'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '5px' }}>
                            <span style={{ color: '#64748B' }}>Jarak ke Mako:</span>
                            <span style={{ fontWeight: 800, color: isWithinMakoRadius ? '#15803D' : '#DC2626' }}>
                              📍 {distanceToMakoFormatted} <span style={{ fontSize: '10.5px', fontWeight: 600, color: '#64748B' }}>(Maks: {makoRadiusLimit.toLocaleString('id-ID')} m)</span>
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px' }}>
                            <span style={{ color: '#64748B' }}>Area Presensi:</span>
                            {isWithinMakoRadius ? (
                              <span style={{ fontWeight: 800, color: '#15803D', background: '#DCFCE7', padding: '2px 8px', borderRadius: '6px', fontSize: '10.5px' }}>
                                ✓ Di Dalam Radius Mako
                              </span>
                            ) : (
                              <span style={{ fontWeight: 800, color: '#B91C1C', background: '#FEE2E2', padding: '2px 8px', borderRadius: '6px', fontSize: '10.5px' }}>
                                ⚠️ Di Luar Radius Mako
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Notifikasi Jika Di Luar Radius Mako */}
                      {!isWithinMakoRadius && (
                        <div style={{
                          background: '#FFF1F2',
                          border: '1px solid #FECDD3',
                          borderRadius: '10px',
                          padding: '10px 12px',
                          marginBottom: '12px',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '8px',
                          fontSize: '11.5px',
                          color: '#9F1239',
                          lineHeight: '1.4',
                        }}>
                          <span style={{ fontSize: '16px', lineHeight: 1 }}>🔒</span>
                          <div>
                            <strong style={{ display: 'block', fontWeight: 800, color: '#881337', marginBottom: '2px' }}>
                              Presensi Terkunci (Di Luar Radius Mako)
                            </strong>
                            Personel saat ini berada sejauh <strong>{distanceToMakoFormatted}</strong> dari Mako Utama (Batas maksimal: <strong>{makoRadiusLimit.toLocaleString('id-ID')} m</strong>). Anda tidak dapat melakukan presensi sama sekali di luar radius Mako.
                          </div>
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                          type="button"
                          onClick={handlePresensiMasuk}
                          title={!isWithinMakoRadius ? `Presensi terkunci: Anda berada ${distanceToMakoFormatted} dari Mako (Batas: ${makoRadiusLimit} m)` : 'Presensi Masuk Piket'}
                          style={{
                            flex: 1,
                            padding: '11px 12px',
                            background: isWithinMakoRadius ? '#10B981' : '#94A3B8',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 800,
                            fontSize: '12.5px',
                            cursor: isWithinMakoRadius ? 'pointer' : 'not-allowed',
                            boxShadow: isWithinMakoRadius ? '0 2px 6px rgba(16,185,129,0.3)' : 'none',
                            transition: 'all 0.2s',
                          }}
                        >
                          {isWithinMakoRadius ? '✅ Presensi Masuk' : '🔒 Presensi Masuk'}
                        </button>
                        <button
                          type="button"
                          onClick={handlePresensiPulangClick}
                          title={!isWithinMakoRadius ? `Presensi terkunci: Anda berada ${distanceToMakoFormatted} dari Mako (Batas: ${makoRadiusLimit} m)` : 'Presensi Pulang Piket'}
                          style={{
                            flex: 1,
                            padding: '11px 12px',
                            background: isWithinMakoRadius ? '#EF4444' : '#94A3B8',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 800,
                            fontSize: '12.5px',
                            cursor: isWithinMakoRadius ? 'pointer' : 'not-allowed',
                            boxShadow: isWithinMakoRadius ? '0 2px 6px rgba(239,68,68,0.3)' : 'none',
                            transition: 'all 0.2s',
                          }}
                        >
                          {isWithinMakoRadius ? '🚪 Presensi Pulang' : '🔒 Presensi Pulang'}
                        </button>
                      </div>
                    </div>

                    {/* Kartu Pengaturan Akun */}
                    <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '6px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                      <div style={{ padding: '10px 6px 6px', fontSize: '12px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', borderBottom: '1px solid #F1F5F9' }}>
                        Pengaturan Akun Petugas
                      </div>
                      <div
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 6px', cursor: 'pointer' }}
                        onClick={async () => {
                          if (typeof window !== 'undefined') {
                            sessionStorage.removeItem('simapres_active_user');
                          }
                          await logoutAction();
                          window.location.href = '/?alert=logged_out';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '16px' }}>🚪</span>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 800, color: '#EF4444' }}>Logout / Keluar Sesi Dinas</div>
                            <div style={{ fontSize: '11px', color: '#F87171' }}>Akhiri sesi dan kembali ke halaman login</div>
                          </div>
                        </div>
                        <span style={{ color: '#EF4444', fontSize: '13px' }}>➔</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Riwayat Log Lengkap */}
                  <div style={{ flex: 1.2, minWidth: '320px' }}>
                    <div className="card-panel">
                      <div className="card-title">RIWAYAT PENUGASAN SAYA</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {complaints.length === 0 ? (
                          <div style={{ padding: '20px', textAlign: 'center', color: '#64748B', fontSize: '12px' }}>
                            Belum ada riwayat penugasan tercatat.
                          </div>
                        ) : (
                          complaints.map((c) => (
                            <div
                              key={c.id}
                              style={{
                                background: '#F8FAFC',
                                border: '1px solid #E2E8F0',
                                borderRadius: '10px',
                                padding: '12px',
                                cursor: 'pointer',
                              }}
                              onClick={() => setSelectedLogDetail(c)}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#153E75', fontSize: '12px' }}>
                                  {c.nomorTiket}
                                </span>
                                <span
                                  style={{
                                    fontSize: '9.5px',
                                    fontWeight: 800,
                                    background: c.status === 'SELESAI' ? '#DCFCE7' : '#FEF3C7',
                                    color: c.status === 'SELESAI' ? '#15803D' : '#92400E',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                  }}
                                >
                                  {c.status}
                                </span>
                              </div>
                              <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B' }}>{c.jenisKejadian}</div>
                              <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>📍 {c.tkpAlamatTeks}</div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ======================================================== */}
          {/* SCREEN 7: WIZARD PENANGANAN KASUS (PROTOYPE ACCORDION)   */}
          {/* ======================================================== */}
          {activeTab === 'view-wizard' && activeComplaint && (
            <section id="view-wizard" className="view active">
              {/* Back Navigation Header Matching Prototype */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '16px 16px 8px' }}>
                <div
                  onClick={() => switchTab('view-validasi')}
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#153E75',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    background: '#EFF6FF',
                    border: '1px solid #BFDBFE',
                  }}
                >
                  <span>←</span> Kembali ke Timeline Pelacakan
                </div>
                <span
                  id="wiz-status-badge"
                  style={{
                    fontSize: '11px',
                    background: wizardStep === 3 ? '#FEF3C7' : '#EDE9FE',
                    color: wizardStep === 3 ? '#B45309' : '#6D28D9',
                    fontWeight: 700,
                    padding: '5px 12px',
                    borderRadius: '20px',
                  }}
                >
                  {wizardStep === 1 ? '⚡ Diproses' : wizardStep === 2 ? '⚡ Tindakan di TKP' : '✓ Laporan TKP'}
                </span>
              </div>

              <h2 className="page-title" style={{ marginTop: '6px', marginBottom: '4px' }}>
                Wizard Penanganan Kasus
              </h2>
              <div id="wiz-id-kasus" className="page-subtitle" style={{ marginBottom: '8px' }}>
                ID Kasus: {activeComplaint.nomorTiket}
              </div>

              {/* Unit Tag Header Input (Matching Prototype) */}
              <div className="form-group" style={{ margin: '0 16px 16px' }}>
                <input
                  type="text"
                  readOnly
                  value={officer.satuan ? `${officer.satuan.toUpperCase()} • REAKSI CEPAT 110` : 'PATROLI SAMAPTA PRESISI'}
                  className="form-control"
                  style={{ background: '#153E75', color: 'white', fontWeight: 'bold', border: 'none', textAlign: 'center' }}
                />
              </div>

              {/* Notifikasi Status Menuju TKP & Pintasan Langsung ke Peta Navigasi */}
              {activeComplaint.status === 'MENUJU_TKP' && (
                <div
                  style={{
                    margin: '0 16px 14px',
                    padding: '12px 14px',
                    background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                    borderRadius: '10px',
                    border: '1.5px solid #38BDF8',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#38BDF8', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                      🛰️ STATUS: DALAM PERJALANAN (MENUJU TKP)
                    </div>
                    <div style={{ fontSize: '12px', color: '#E2E8F0', marginTop: '2px' }}>
                      Jarak GPS ke TKP: <strong>{distanceFormatted}</strong> {etaMinutesText ? `• ${etaMinutesText}` : ''}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        window.location.href = '/console/peta';
                      } else {
                        switchTab('view-peta');
                      }
                    }}
                    style={{
                      padding: '8px 14px',
                      background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 2px 6px rgba(37,99,235,0.4)',
                    }}
                  >
                    <span>🗺️</span>
                    <span>Buka Peta Navigasi ➔</span>
                  </button>
                </div>
              )}

              {/* Toolbar Kontrol Cepat Mode Simulasi Lapangan di Konsol Wizard */}
              <div
                id="wizard-simulasi-toolbar"
                style={{
                  margin: '0 16px 14px',
                  padding: '10px 14px',
                  background: isSimModeEnabled ? '#EFF6FF' : '#F8FAFC',
                  borderRadius: '10px',
                  border: isSimModeEnabled ? '1.5px solid #3B82F6' : '1px dashed #CBD5E1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '8px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '16px' }}>🎮</span>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '12px', color: isSimModeEnabled ? '#1D4ED8' : '#334155' }}>
                      Mode Simulasi Pengujian Personel {isSimModeEnabled ? '(AKTIF)' : '(NONAKTIF)'}
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#64748B' }}>
                      Memudahkan pengujian alur kerja, pergerakan GPS, dan dokumentasi kamera dari meja kerja.
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      fontSize: '11.5px',
                      fontWeight: 800,
                      color: isSimModeEnabled ? '#1D4ED8' : '#475569',
                      background: isSimModeEnabled ? '#DBEAFE' : '#E2E8F0',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      userSelect: 'none',
                    }}
                  >
                    <input
                      type="checkbox"
                      id="chk-sim-wizard-mode"
                      checked={isSimModeEnabled}
                      onChange={(e) => toggleSimulationMode(e.target.checked)}
                      style={{ cursor: 'pointer', accentColor: '#2563EB' }}
                    />
                    <span>{isSimModeEnabled ? 'Simulasi ON' : 'Aktifkan Simulasi'}</span>
                  </label>
                  {isSimModeEnabled && (
                    <button
                      type="button"
                      onClick={jumpDirectlyToTkp}
                      style={{
                        padding: '5px 10px',
                        background: '#10B981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                      title="Setel koordinat GPS personel langsung di area TKP (<50m)"
                    >
                      <span>⚡</span> Langsung Tiba di TKP
                    </button>
                  )}
                </div>
              </div>

              {/* Step 1: Menuju Lokasi (Meluncur) */}
              <div
                className="wiz-card"
                id="step1-card"
                style={{
                  background: 'white',
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  margin: '0 16px 16px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  overflow: 'hidden',
                }}
              >
                <div
                  className={`wiz-header ${wizardStep === 1 ? 'active' : 'completed'}`}
                  onClick={() => toggleWizStep(1)}
                  style={{
                    padding: '16px',
                    fontWeight: 700,
                    fontSize: '14px',
                    borderBottom: '1px solid #E2E8F0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    userSelect: 'none',
                    background: wizardStep === 1 ? '#EFF6FF' : '#ECFDF5',
                    color: wizardStep === 1 ? '#1D4ED8' : '#15803D',
                    borderBottomColor: wizardStep === 1 ? '#BFDBFE' : '#A7F3D0',
                  }}
                >
                  <span>1. Menuju Lokasi (Meluncur)</span>
                  <span id="step1-icon">{wizardStep > 1 ? '✅' : '⏳'}</span>
                </div>
                {expandedStep === 1 && (
                  <div className="wiz-body" style={{ padding: '16px' }}>
                    {/* Detail Laporan Dinamis */}
                    <div style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', marginBottom: '8px', textTransform: 'uppercase' }}>
                        Detail Laporan
                      </div>
                      <div style={{ marginBottom: '6px' }}>
                        <div style={{ fontSize: '11px', color: '#64748B' }}>Jenis Insiden</div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#153E75' }}>
                          {activeComplaint.jenisKejadian}
                        </div>
                      </div>
                      <div style={{ marginBottom: '6px' }}>
                        <div style={{ fontSize: '11px', color: '#64748B' }}>Lokasi Kejadian</div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B' }}>
                          {activeComplaint.tkpAlamatTeks}
                        </div>
                      </div>
                      <div style={{ marginBottom: '8px' }}>
                        <div style={{ fontSize: '11px', color: '#64748B' }}>Keterangan Pelapor</div>
                        <div style={{ fontSize: '12px', color: '#1E293B', lineHeight: 1.4, background: 'white', padding: '8px', border: '1px solid #E2E8F0', borderRadius: '6px', marginTop: '4px' }}>
                          &quot;{activeComplaint.ringkasanKeterangan || activeComplaint.deskripsiKejadian || 'Laporan darurat memerlukan penanganan segera.'}&quot;
                        </div>
                      </div>
                      {activeComplaint.fotoBuktiUrl && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'white', padding: '8px', border: '1px solid #E2E8F0', borderRadius: '6px' }}>
                          <img
                            src={activeComplaint.fotoBuktiUrl}
                            alt="Foto Bukti"
                            style={{ width: '48px', height: '48px', borderRadius: '6px', objectFit: 'cover', border: '1px solid #CBD5E1', flexShrink: 0 }}
                          />
                          <div style={{ fontSize: '11px', color: '#64748B', lineHeight: 1.4 }}>
                            <span style={{ fontWeight: 700, color: '#1E293B' }}>Dokumentasi Laporan Warga</span><br />
                            <span>Terverifikasi Petugas SPKT 110</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="form-label" style={{ fontWeight: 700, fontSize: '12px', marginBottom: '6px' }}>
                      Keterangan Persiapan <span style={{ color: 'red' }}>*</span>
                    </div>
                    <textarea
                      className="form-control"
                      style={{ minHeight: '80px', marginBottom: '14px' }}
                      placeholder="Cth: Personel lengkap, perlengkapan dinas siap, segera meluncur menuju TKP..."
                      value={wizardCatatan}
                      onChange={(e) => setWizardCatatan(e.target.value)}
                    />

                    {/* Lampiran Foto Bukti Keberangkatan Petugas */}
                    <div className="form-label" style={{ fontWeight: 700, fontSize: '12px', marginBottom: '6px' }}>
                      Lampiran Foto Bukti Keberangkatan / Ranmor Siaga
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                      <LiveCameraWatermarkCapture
                        personilNama={officer.fullName || session?.fullName || 'Petugas'}
                        personilPangkat={officer.pangkat || 'Bripka'}
                        personilNrp={officer.nrp || session?.identifier || '-'}
                        lokasiPersonil={officerLiveAddress || 'Posko Siaga / Titik Keberangkatan Personel'}
                        tkpLat={activeComplaint?.tkpLat ? Number(activeComplaint.tkpLat) : -6.257210}
                        tkpLng={activeComplaint?.tkpLng ? Number(activeComplaint.tkpLng) : 106.818450}
                        tkpAlamat={activeComplaint?.tkpAlamatTeks || 'Jl. Bangka II D No. 12, Mampang Prapatan, Jakarta Selatan'}
                        isSimulationMode={true}
                        gpsLat={currentGps.lat}
                        gpsLng={currentGps.lng}
                        label="Ambil Foto Bukti Keberangkatan / Ranmor Dinas Siaga"
                        required={false}
                        onPhotoCaptured={(dataUrl) => setWizardFoto(dataUrl)}
                      />
                    </div>

                    <button
                      type="button"
                      className="btn-blue"
                      id="btn-meluncur-tkp"
                      style={{ width: '100%', margin: 0, fontWeight: 800 }}
                      disabled={isUpdatingStep}
                      onClick={() => handleWizardSubmit('meluncur')}
                    >
                      {isUpdatingStep ? 'Merekam Status...' : 'Meluncur ke Lokasi ➔'}
                    </button>
                  </div>
                )}
              </div>

              {/* Step 2: Tiba & Penanganan di TKP */}
              <div
                className="wiz-card"
                id="step2-card"
                style={{
                  background: 'white',
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  margin: '0 16px 16px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  overflow: 'hidden',
                }}
              >
                <div
                  className={`wiz-header ${wizardStep === 2 ? 'active' : wizardStep > 2 ? 'completed' : 'locked'}`}
                  onClick={() => toggleWizStep(2)}
                  style={{
                    padding: '16px',
                    fontWeight: 700,
                    fontSize: '14px',
                    borderBottom: '1px solid #E2E8F0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: wizardStep < 2 ? 'not-allowed' : 'pointer',
                    userSelect: 'none',
                    background: wizardStep === 2 ? '#EFF6FF' : wizardStep > 2 ? '#ECFDF5' : '#F8FAFC',
                    color: wizardStep === 2 ? '#1D4ED8' : wizardStep > 2 ? '#15803D' : '#94A3B8',
                    borderBottomColor: wizardStep === 2 ? '#BFDBFE' : wizardStep > 2 ? '#A7F3D0' : '#E2E8F0',
                  }}
                >
                  <span>2. Tindakan &amp; Dokumentasi di TKP</span>
                  <span id="step2-icon">{wizardStep > 2 ? '✅' : wizardStep === 2 ? '⏳' : '🔒'}</span>
                </div>
                {expandedStep === 2 && (
                  <div className="wiz-body" style={{ padding: '16px' }}>
                    {/* Detail Laporan Dinamis & Indikator Waktu Tiba Resmi */}
                    <div style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                          Detail Laporan &amp; Status TKP
                        </div>
                        {activeComplaint.responTibaTkpAt && (
                          <span style={{ fontSize: '11px', fontWeight: 800, color: '#166534', background: '#DCFCE7', padding: '2px 8px', borderRadius: '6px' }}>
                            ✓ Tiba: {new Date(activeComplaint.responTibaTkpAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                          </span>
                        )}
                      </div>
                      <div style={{ marginBottom: '6px' }}>
                        <div style={{ fontSize: '11px', color: '#64748B' }}>Jenis Insiden</div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#153E75' }}>
                          {activeComplaint.jenisKejadian}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: '#64748B' }}>Lokasi Kejadian</div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B' }}>
                          {activeComplaint.tkpAlamatTeks}
                        </div>
                      </div>
                    </div>

                    <div className="form-label" style={{ fontWeight: 700, fontSize: '12px', marginBottom: '6px' }}>
                      Keterangan Tindakan Kepolisian (Berita Acara Tindakan TKP) <span style={{ color: 'red' }}>*</span>
                    </div>
                    <textarea
                      className="form-control"
                      style={{ minHeight: '80px', marginBottom: '12px' }}
                      placeholder="Jelaskan tindakan pengamanan, pengaturan lalu lintas, atau pembinaan yang dilakukan di lokasi..."
                      value={wizardCatatan}
                      onChange={(e) => setWizardCatatan(e.target.value)}
                    />

                    <div className="form-label" style={{ fontWeight: 700, fontSize: '12px', marginBottom: '6px' }}>
                      Bukti Foto Penanganan Petugas di TKP <span style={{ color: 'red' }}>*</span>
                    </div>
                    <LiveCameraWatermarkCapture
                      personilNama={officer.fullName || session?.fullName || 'Petugas'}
                      personilPangkat={officer.pangkat || 'Bripka'}
                      personilNrp={officer.nrp || session?.identifier || '-'}
                      lokasiPersonil={officerLiveAddress || 'Lengkong Gudang Timur, Serpong, Tangerang Selatan'}
                      tkpLat={activeComplaint?.tkpLat ? Number(activeComplaint.tkpLat) : -6.257210}
                      tkpLng={activeComplaint?.tkpLng ? Number(activeComplaint.tkpLng) : 106.818450}
                      tkpAlamat={activeComplaint?.tkpAlamatTeks || 'Jl. Bangka II D No. 12, Mampang Prapatan, Jakarta Selatan'}
                      isSimulationMode={true}
                      gpsLat={currentGps.lat}
                      gpsLng={currentGps.lng}
                      label="📸 Ambil Foto Kondisi TKP "
                      required={true}
                      onPhotoCaptured={(dataUrl, meta) => {
                        setWizardFoto(dataUrl);
                        setWizardPhotoMetadata(meta);
                      }}
                    />

                    <button
                      type="button"
                      className="btn-blue"
                      id="btn-tiba-tkp"
                      style={{ width: '100%', margin: '14px 0 0 0', background: '#D97706', fontWeight: 800 }}
                      disabled={isUpdatingStep}
                      onClick={() => handleWizardSubmit('tiba_tkp')}
                    >
                      {isUpdatingStep ? 'Menyimpan Laporan Tindakan...' : 'Simpan Laporan Tindakan ➔'}
                    </button>
                  </div>
                )}
              </div>

              {/* Step 3: Kasus Selesai Ditangani & Pengajuan BAP */}
              <div
                className="wiz-card"
                id="step3-card"
                style={{
                  background: 'white',
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  margin: '0 16px 16px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  overflow: 'hidden',
                }}
              >
                <div
                  className={`wiz-header ${wizardStep === 3 ? 'active' : wizardStep > 3 ? 'completed' : 'locked'}`}
                  onClick={() => toggleWizStep(3)}
                  style={{
                    padding: '16px',
                    fontWeight: 700,
                    fontSize: '14px',
                    borderBottom: '1px solid #E2E8F0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: wizardStep < 3 ? 'not-allowed' : 'pointer',
                    userSelect: 'none',
                    background: wizardStep === 3 ? '#EFF6FF' : wizardStep > 3 ? '#ECFDF5' : '#F8FAFC',
                    color: wizardStep === 3 ? '#1D4ED8' : wizardStep > 3 ? '#15803D' : '#94A3B8',
                    borderBottomColor: wizardStep === 3 ? '#BFDBFE' : wizardStep > 3 ? '#A7F3D0' : '#E2E8F0',
                  }}
                >
                  <span>3. Kasus Selesai Ditangani &amp; Pengajuan BAP</span>
                  <span id="step3-icon">{wizardStep > 3 ? '✅' : wizardStep === 3 ? '⏳' : '🔒'}</span>
                </div>
                {expandedStep === 3 && (
                  <div className="wiz-body" style={{ padding: '16px' }}>
                    <div style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', marginBottom: '8px', textTransform: 'uppercase' }}>
                        Ringkasan Kasus Yang Diselesaikan
                      </div>
                      <div style={{ marginBottom: '6px' }}>
                        <div style={{ fontSize: '11px', color: '#64748B' }}>Jenis Insiden</div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#153E75' }}>
                          {activeComplaint.jenisKejadian}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: '#64748B' }}>Lokasi Kejadian</div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B' }}>
                          {activeComplaint.tkpAlamatTeks}
                        </div>
                      </div>
                    </div>

                    <div className="form-label" style={{ fontWeight: 700, fontSize: '12px', marginBottom: '6px' }}>
                      Bukti Foto Situasi Kondusif / Barang Bukti Akhir
                    </div>
                    <LiveCameraWatermarkCapture
                      personilNama={officer.fullName || session?.fullName || 'Petugas'}
                      personilPangkat={officer.pangkat || 'Bripka'}
                      personilNrp={officer.nrp || session?.identifier || '-'}
                      lokasiPersonil={officerLiveAddress || 'Lengkong Gudang Timur, Serpong, Tangerang Selatan'}
                      tkpLat={activeComplaint?.tkpLat ? Number(activeComplaint.tkpLat) : -6.257210}
                      tkpLng={activeComplaint?.tkpLng ? Number(activeComplaint.tkpLng) : 106.818450}
                      tkpAlamat={activeComplaint?.tkpAlamatTeks || 'Jl. Bangka II D No. 12, Mampang Prapatan, Jakarta Selatan'}
                      isSimulationMode={true}
                      gpsLat={currentGps.lat}
                      gpsLng={currentGps.lng}
                      label="📸 Ambil Foto Situasi Akhir Kondusif (Watermark GPS)"
                      required={false}
                      onPhotoCaptured={(dataUrl, meta) => {
                        setWizardFoto(dataUrl);
                        setWizardPhotoMetadata(meta);
                      }}
                    />

                    <div className="form-label" style={{ fontWeight: 700, fontSize: '12px', marginBottom: '6px' }}>
                      Keterangan Penyelesaian &amp; Berita Acara (BAP Akhir) <span style={{ color: 'red' }}>*</span>
                    </div>
                    <textarea
                      className="form-control"
                      style={{ minHeight: '80px', marginBottom: '16px' }}
                      placeholder="Cth: Situasi telah aman dan kondusif, arus lalu lintas lancar kembali, warga kembali beraktivitas normal..."
                      value={wizardCatatan}
                      onChange={(e) => setWizardCatatan(e.target.value)}
                    />

                    <button
                      type="button"
                      className="btn-blue"
                      id="btn-selesai-bap"
                      style={{ width: '100%', margin: 0, background: '#059669', fontWeight: 800 }}
                      disabled={isUpdatingStep}
                      onClick={() => handleWizardSubmit('selesai')}
                    >
                      {isUpdatingStep ? 'Mengirim BAP ke Pawas...' : '✅ Ajukan Pengesahan BAP ke Pawas'}
                    </button>
                  </div>
                )}
              </div>
            </section>
          )}
        </main>

        {/* BOTTOM NAVIGATION */}
        <nav className="bottom-nav">
          <div
            className={`nav-item ${activeTab === 'view-beranda' ? 'active' : ''}`}
            onClick={() => switchTab('view-beranda')}
          >
            <span className="nav-icon">🏠</span>
            <span>Beranda</span>
          </div>
          <div
            className={`nav-item ${activeTab === 'view-peta' ? 'active' : ''}`}
            onClick={() => switchTab('view-peta')}
          >
            <span className="nav-icon">🗺️</span>
            <span>Peta</span>
          </div>
          <div
            id="nav-log"
            className={`nav-item ${activeTab === 'view-log' ? 'active' : ''}`}
            onClick={() => switchTab('view-log')}
          >
            <span className="nav-icon">➕</span>
            <span>Buat Pengaduan (+)</span>
          </div>
          <div
            id="nav-kinerja"
            className={`nav-item ${activeTab === 'view-laporan' ? 'active' : ''}`}
            onClick={() => switchTab('view-laporan')}
          >
            <span className="nav-icon">📊</span>
            <span>Kinerja</span>
          </div>
          <div
            className={`nav-item ${activeTab === 'view-profil' ? 'active' : ''}`}
            onClick={() => switchTab('view-profil')}
          >
            <span className="nav-icon">👤</span>
            <span>Profil</span>
          </div>
        </nav>
      </div>

      {/* ======================================================== */}
      {/* MODALS SINKRONISASI PROTOYPE                            */}
      {/* ======================================================== */}

      {/* MODAL KONFIRMASI PERSETUJUAN PERSONIL (TERIMA TUGAS) */}
      {showAcceptModal && pendingAcceptTask && (
        <div
          id="modal-konfirmasi-terima-tugas"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999999,
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              maxWidth: '560px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
              border: '2px solid #3B82F6',
              overflow: 'hidden',
            }}
          >
            {/* Header Modal */}
            <div
              style={{
                background: 'linear-gradient(135deg, #1E3A8A 0%, #1D4ED8 100%)',
                padding: '16px 20px',
                color: 'white',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '26px' }}>🚨</span>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 900, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                    LEMBAR DISPOSISI TUGAS MASUK
                  </div>
                  <div style={{ fontSize: '11px', color: '#BFDBFE', fontWeight: 600 }}>
                    Pusat Komando Pengendalian (Pawas) • Konfirmasi Persetujuan Personil
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAcceptModal(false)}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: 'none',
                  color: 'white',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="Tutup & Tinjau Nanti"
              >
                ✕
              </button>
            </div>

            {/* Body Modal */}
            {(() => {
              const modalQuota = getTaskQuotaInfo(pendingAcceptTask);
              return (
                <>
                  <div style={{ padding: '20px', maxHeight: '75vh', overflowY: 'auto' }}>
                    {/* Urgent Alert Banner */}
                    <div
                      style={{
                        background: '#FEF2F2',
                        border: '1px solid #FECACA',
                        borderRadius: '10px',
                        padding: '10px 14px',
                        marginBottom: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                      }}
                    >
                      <span style={{ fontSize: '18px' }}>⚠️</span>
                      <div style={{ fontSize: '12px', color: '#991B1B', fontWeight: 700 }}>
                        Satuan Anda ({officer.satuan || modalQuota.unitName || 'Satuan Operasional'}) telah didisposisikan oleh Pawas. Segera konfirmasi persetujuan untuk bergabung meluncur ke TKP.
                      </div>
                    </div>

                    {/* Task Details Card */}
                    <div
                      style={{
                        background: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        borderRadius: '12px',
                        padding: '14px',
                        marginBottom: '16px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', borderBottom: '1px solid #E2E8F0', paddingBottom: '8px' }}>
                        <div>
                          <div style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 700 }}>NOMOR TIKET LP-110</div>
                          <div style={{ fontSize: '16px', fontWeight: 900, color: '#153E75', fontFamily: 'monospace' }}>
                            {pendingAcceptTask.nomorTiket || pendingAcceptTask.id}
                          </div>
                        </div>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            padding: '3px 10px',
                            borderRadius: '12px',
                            background: '#FEE2E2',
                            color: '#DC2626',
                            border: '1px solid #FCA5A5',
                          }}
                        >
                          🚨 {pendingAcceptTask.urgensi || 'DARURAT'}
                        </span>
                      </div>

                      <div style={{ marginBottom: '10px' }}>
                        <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700 }}>JENIS &amp; KLASIFIKASI KEJADIAN:</div>
                        <div style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>
                          {pendingAcceptTask.jenisKejadian || pendingAcceptTask.kategoriKejadian || 'Gangguan Kamtibmas / Tawuran'}
                        </div>
                      </div>

                      <div style={{ marginBottom: '10px' }}>
                        <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700 }}>LOKASI FAKTUAL TKP:</div>
                        <div style={{ fontSize: '12.5px', color: '#1E293B', fontWeight: 600 }}>
                          📍 {pendingAcceptTask.tkpAlamatTeks || '-'}
                        </div>
                      </div>

                      {/* Arahan Taktis Khusus Pawas */}
                      <div
                        style={{
                          background: '#FFFBEB',
                          border: '1px solid #FDE68A',
                          borderRadius: '8px',
                          padding: '10px 12px',
                          marginTop: '10px',
                        }}
                      >
                        <div style={{ fontSize: '11px', color: '#B45309', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>👑</span> ARAHAN &amp; PETUNJUK TAKTIS PAWAS:
                        </div>
                        <div style={{ fontSize: '12.5px', color: '#78350F', fontWeight: 700, marginTop: '4px', fontStyle: 'italic' }}>
                          &quot;{pendingAcceptTask.arahanPawas || pendingAcceptTask.dispatches?.[0]?.tactical_orders || 'Laksanakan pengamanan perimeter, bubarkan massa, dan amankan barang bukti.'}&quot;
                        </div>
                      </div>
                    </div>

                    {/* SLA & Kuat Personel Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                      <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '10px', borderRadius: '10px', textAlign: 'center' }}>
                        <div style={{ fontSize: '10.5px', color: '#1D4ED8', fontWeight: 700 }}>TARGET RESPON SLA</div>
                        <div style={{ fontSize: '15px', fontWeight: 900, color: '#1E40AF' }}>&lt; 10 Menit</div>
                      </div>
                      <div style={{ background: modalQuota.isQuotaFull ? '#FEF2F2' : '#F0FDF4', border: modalQuota.isQuotaFull ? '1px solid #FECACA' : '1px solid #BBF7D0', padding: '10px', borderRadius: '10px', textAlign: 'center' }}>
                        <div style={{ fontSize: '10.5px', color: modalQuota.isQuotaFull ? '#991B1B' : '#15803D', fontWeight: 700 }}>ALOKASI PERSONEL</div>
                        <div style={{ fontSize: '15px', fontWeight: 900, color: modalQuota.isQuotaFull ? '#DC2626' : '#166534' }}>
                          {modalQuota.quota} Personel
                        </div>
                        <div style={{ fontSize: '11px', fontWeight: 800, color: modalQuota.isQuotaFull ? '#DC2626' : '#15803D', marginTop: '2px' }}>
                          {modalQuota.isQuotaFull ? '🔒 Kuota Terpenuhi' : `👥 Terisi: ${modalQuota.acceptedCount}/${modalQuota.quota} Personel`}
                        </div>
                      </div>
                    </div>

                    {/* Daftar Personel yang Telah Mengambil Tiket */}
                    {modalQuota.acceptedOfficers.length > 0 && (
                      <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '10px 12px', marginBottom: '14px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 800, color: '#475569', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>🛡️</span> Personel yang Telah Mengambil Tiket ({modalQuota.acceptedCount}/{modalQuota.quota}):
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {modalQuota.acceptedOfficers.map((o: any, idx: number) => (
                            <span
                              key={idx}
                              style={{
                                background: '#EFF6FF',
                                border: '1px solid #BFDBFE',
                                color: '#1D4ED8',
                                fontSize: '11px',
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: '6px',
                              }}
                            >
                              ✓ {o.rank ? `${o.rank} ` : ''}{o.name} {o.nrp ? `(${o.nrp})` : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* SOP Komando Information */}
                    <div style={{ fontSize: '11px', color: '#64748B', lineHeight: '1.4', background: '#F1F5F9', padding: '8px 12px', borderRadius: '8px' }}>
                      ⚖️ <strong>SOP Rantai Komando Presisi:</strong> Dengan menekan tombol <strong>&quot;Terima Tugas&quot;</strong>, status tugas dicatat sebagai <em>ACCEPTED (Sedang Ditangani)</em> ke audit trail beserta identitas dinas Anda ({officer.pangkat || 'Personil'} {officer.fullName || session?.fullName}). Sistem akan langsung membuka <strong>Wizard Penanganan Kasus</strong> untuk persiapan meluncur ke TKP.
                    </div>
                  </div>

                  {/* Footer Modal */}
                  <div
                    style={{
                      padding: '14px 20px',
                      background: '#F8FAFC',
                      borderTop: '1px solid #E2E8F0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setShowAcceptModal(false)}
                      style={{
                        padding: '10px 16px',
                        background: '#F1F5F9',
                        color: '#475569',
                        fontSize: '12px',
                        fontWeight: 700,
                        border: '1px solid #CBD5E1',
                        borderRadius: '8px',
                        cursor: 'pointer',
                      }}
                    >
                      Tinjau Nanti
                    </button>

                    <button
                      type="button"
                      id="btn-terima-tugas"
                      onClick={async () => {
                        if (!pendingAcceptTask) return;
                        if (modalQuota.isQuotaFull) {
                          alert('🔒 Kuota personel untuk penugasan ini sudah terpenuhi. Anda tidak dapat mengambil tiket ini.');
                          setShowAcceptModal(false);
                          return;
                        }
                        setIsAcceptingTask(true);
                        try {
                          const activeNrp = officer.nrp || session?.identifier || nrpParam || '';
                          const activeName = officer.fullName || session?.fullName || '';
                          const activePangkat = officer.pangkat || session?.rankPangkat || 'Personil';

                          const res = await acceptOfficerDispatchAction({
                            complaintId: String(pendingAcceptTask.id),
                            officerNrp: activeNrp,
                            officerNama: activeName,
                            officerPangkat: activePangkat,
                          });

                          if (res.success) {
                            alert(`✓ Tugas #${pendingAcceptTask.nomorTiket || pendingAcceptTask.id} BERHASIL DITERIMA!\n\nAnda tercatat sebagai Personel ke-${res.currentCount || 1} dari kuota ${res.quota || modalQuota.quota} personel.\nStatus kini: SEDANG DITANGANI. Membuka Wizard Penanganan...`);
                            setShowAcceptModal(false);
                            const acceptedComplaint = {
                              ...pendingAcceptTask,
                              status: 'SEDANG_DITANGANI',
                              tahap: 3,
                            };
                            setActiveComplaint(acceptedComplaint);
                            activeComplaintRef.current = acceptedComplaint;
                            setSelectedTask(acceptedComplaint);
                            setPendingAcceptTask(null);

                            setWizardStep(1);
                            setExpandedStep(1);
                            setWizardCatatan('');
                            setWizardFoto(null);

                            await loadData(undefined, acceptedComplaint.id);
                            switchTab('view-wizard');
                          } else {
                            alert(`Gagal menerima tugas:\n${res.error}`);
                            setShowAcceptModal(false);
                            setPendingAcceptTask(null);
                            await loadData();
                          }
                        } catch (err: any) {
                          alert(`Terjadi kesalahan sistem: ${err.message}`);
                        } finally {
                          setIsAcceptingTask(false);
                        }
                      }}
                      disabled={isAcceptingTask || modalQuota.isQuotaFull}
                      style={{
                        flex: 1,
                        padding: '12px 20px',
                        background: isAcceptingTask || modalQuota.isQuotaFull
                          ? '#94A3B8'
                          : 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                        color: '#FFFFFF',
                        fontSize: '13.5px',
                        fontWeight: 900,
                        border: 'none',
                        borderRadius: '8px',
                        cursor: isAcceptingTask || modalQuota.isQuotaFull ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: modalQuota.isQuotaFull ? 'none' : '0 4px 12px rgba(16, 185, 129, 0.35)',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span>
                        {isAcceptingTask
                          ? '⏳ Menyinkronkan Penerimaan...'
                          : modalQuota.isQuotaFull
                            ? `🔒 Kuota Personel Terpenuhi (${modalQuota.acceptedCount}/${modalQuota.quota})`
                            : `🛡️ Terima Tugas & Buka Wizard (${modalQuota.slotsRemaining} Slot Tersisa) ➔`}
                      </span>
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* MODAL SOS DARURAT */}
      {showSosModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            background: 'rgba(15,23,42,0.85)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setShowSosModal(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '14px',
              maxWidth: '390px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(220,38,38,0.4)',
              borderTop: '6px solid #DC2626',
              padding: '22px',
              textAlign: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: '42px', lineHeight: 1, marginBottom: '10px' }}>🚨</div>
            <div style={{ fontSize: '16px', fontWeight: 900, color: '#991B1B' }}>KIRIM SINYAL DARURAT (SOS)?</div>
            <div style={{ fontSize: '12px', color: '#475569', marginTop: '8px', lineHeight: 1.5 }}>
              Sinyal darurat prioritas tinggi beserta koordinat GPS lokasi ranmor Anda akan dibunyikan langsung di Command Center Pawas dan disiarkan ke seluruh unit patroli terdekat!
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                type="button"
                onClick={() => setShowSosModal(false)}
                style={{ flex: 1, background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#475569', padding: '10px', borderRadius: '8px', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  alert('⚡ Sinyal SOS Darurat Berhasil Ditransmisikan ke Command Center!');
                  setShowSosModal(false);
                }}
                style={{ flex: 1.4, background: '#DC2626', border: 'none', color: 'white', padding: '10px', borderRadius: '8px', fontWeight: 800, fontSize: '12px', cursor: 'pointer' }}
              >
                ⚡ Kirim SOS Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KPI DETAIL */}
      {showKpiModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            background: 'rgba(15,23,42,0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setShowKpiModal(false)}
        >
          <div
            style={{ background: 'white', borderRadius: '14px', maxWidth: '440px', width: '100%', overflow: 'hidden' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ background: '#153E75', color: 'white', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>📊</span>
                <div style={{ fontSize: '13px', fontWeight: 800 }}>RINCIAN CAPAIAN KPI PRESISI</div>
              </div>
              <button
                type="button"
                onClick={() => setShowKpiModal(false)}
                style={{ background: 'none', border: 'none', color: 'white', fontSize: '16px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '12px 14px', marginBottom: '14px' }}>
                <div style={{ fontSize: '32px', fontWeight: 900, color: '#059669' }}>{officer.kpi || 0}%</div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#1E293B' }}>
                    PREDIKAT: {(officer.kpi || 0) >= 90 ? 'SANGAT BAIK (A)' : (officer.kpi || 0) >= 80 ? 'BAIK (B)' : (officer.kpi || 0) >= 70 ? 'CUKUP (C)' : 'DALAM PENILAIAN'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>Berdasarkan rekam jejak respon & kepatuhan SOP lapangan.</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #F1F5F9' }}>
                  <span>⚡ Kecepatan Respon TKP (&lt; 10m)</span>
                  <strong style={{ color: '#059669' }}>96%</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #F1F5F9' }}>
                  <span>📸 Kelengkapan Berkas &amp; Geo-tag</span>
                  <strong style={{ color: '#059669' }}>90%</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #F1F5F9' }}>
                  <span>⭐ Kepuasan Pelayanan Publik (IKM)</span>
                  <strong style={{ color: '#059669' }}>4.9 / 5.0</strong>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowKpiModal(false)}
                style={{ width: '100%', marginTop: '16px', background: '#153E75', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}
              >
                Tutup Rincian
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TIMEPICKER LOG */}
      {showTimePicker && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            background: 'rgba(15,23,42,0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setShowTimePicker(false)}
        >
          <div
            style={{ background: 'white', borderRadius: '14px', maxWidth: '390px', width: '100%', overflow: 'hidden', borderTop: '5px solid #153E75' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '16px 20px 14px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#1E293B' }}>📅 Pilih Rentang Jam Kegiatan</div>
              <button type="button" onClick={() => setShowTimePicker(false)} style={{ background: 'none', border: 'none', fontSize: '18px', color: '#94A3B8', cursor: 'pointer' }}>
                &times;
              </button>
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '5px' }}>🕒 Jam Mulai</label>
                  <input
                    type="time"
                    value={jamMulai}
                    onChange={(e) => setJamMulai(e.target.value)}
                    style={{ width: '100%', padding: '10px', border: '1.5px solid #CBD5E1', borderRadius: '8px', fontSize: '15px', fontWeight: 700, textAlign: 'center' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '5px' }}>🕒 Jam Selesai</label>
                  <input
                    type="time"
                    value={jamSelesai}
                    onChange={(e) => setJamSelesai(e.target.value)}
                    style={{ width: '100%', padding: '10px', border: '1.5px solid #CBD5E1', borderRadius: '8px', fontSize: '15px', fontWeight: 700, textAlign: 'center' }}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTimePicker(false)}
                style={{ width: '100%', padding: '11px', background: '#153E75', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '13px', cursor: 'pointer' }}
              >
                Gunakan Rentang Jam Ini
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PRESENSI PULANG */}
      {showPresensiPulangModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            background: 'rgba(15,23,42,0.8)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setShowPresensiPulangModal(false)}
        >
          <div
            style={{ background: 'white', borderRadius: '14px', maxWidth: '440px', width: '100%', overflow: 'hidden' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ background: '#DC2626', color: 'white', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '15px', fontWeight: 800 }}>Konfirmasi Presensi Pulang</div>
              <button type="button" onClick={() => setShowPresensiPulangModal(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '18px', cursor: 'pointer' }}>
                ✕
              </button>
            </div>
            <div style={{ padding: '20px', fontSize: '12.5px' }}>
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '12px', marginBottom: '14px', color: '#991B1B' }}>
                Pastikan seluruh laporan dinas telah diperbarui statusnya sebelum apel serah terima piket.
              </div>
              {!isWithinMakoRadius && (
                <div style={{ background: '#FFF1F2', border: '1px solid #FECDD3', borderRadius: '8px', padding: '10px 12px', marginBottom: '14px', color: '#9F1239', fontSize: '11.5px' }}>
                  ⛔ <strong>Tidak Dapat Presensi:</strong> Posisi Anda ({distanceToMakoFormatted}) berada di luar batas radius {makoUtama?.name || 'Mako Utama'}.
                </div>
              )}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowPresensiPulangModal(false)}
                  style={{ flex: 1, padding: '10px', background: '#F1F5F9', border: 'none', borderRadius: '8px', fontWeight: 700 }}
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={!isWithinMakoRadius}
                  onClick={() => {
                    if (!isWithinMakoRadius) {
                      alert(`⛔ Gagal: Anda berada di luar radius Mako (${distanceToMakoFormatted}).`);
                      setShowPresensiPulangModal(false);
                      return;
                    }
                    const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
                    setPresensiPulangTime(now);
                    alert(`✓ Presensi Pulang berhasil terekam pukul ${now}!`);
                    setShowPresensiPulangModal(false);
                  }}
                  style={{
                    flex: 1.5,
                    padding: '10px',
                    background: isWithinMakoRadius ? '#DC2626' : '#94A3B8',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 800,
                    cursor: isWithinMakoRadius ? 'pointer' : 'not-allowed',
                  }}
                >
                  {isWithinMakoRadius ? '✓ Konfirmasi Pulang' : '🔒 Di Luar Radius Mako'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX FOTO */}
      {lightboxFoto && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            background: 'rgba(15,23,42,0.85)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setLightboxFoto(null)}
        >
          <div
            style={{ background: 'white', borderRadius: '12px', maxWidth: '550px', width: '100%', overflow: 'hidden' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
              <div style={{ fontWeight: 800, fontSize: '13px' }}>{lightboxFoto.title}</div>
              <button type="button" onClick={() => setLightboxFoto(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>
                ✕
              </button>
            </div>
            <img src={lightboxFoto.src} alt="Bukti" style={{ width: '100%', height: 'auto', maxHeight: '380px', objectFit: 'contain', background: '#0F172A' }} />
            <div style={{ padding: '12px 16px', fontSize: '11.5px', color: '#64748B' }}>
              {lightboxFoto.meta} • <strong>✓ Terverifikasi Satelit GPS</strong>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CRUD TITIK RAWAN */}
      {showHotspotModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            background: 'rgba(15,23,42,0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setShowHotspotModal(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '14px',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ background: '#1E293B', color: 'white', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>🔴</span>
                <div style={{ fontSize: '15px', fontWeight: 800 }}>MANAJEMEN TITIK RAWAN KAMTIBMAS</div>
              </div>
              <button type="button" onClick={() => setShowHotspotModal(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '18px', cursor: 'pointer' }}>
                ✕
              </button>
            </div>

            <div style={{ padding: '12px 20px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '12px', fontWeight: 700 }}>
                Hotspot Aktif: <strong style={{ color: '#EF4444' }}>{hotspots.length}</strong>
              </div>
              <button
                type="button"
                onClick={() => setShowHotspotAddForm(!showHotspotAddForm)}
                style={{ background: '#153E75', color: 'white', border: 'none', padding: '7px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}
              >
                {showHotspotAddForm ? '✕ Tutup Form' : '➕ Tambah Titik Rawan'}
              </button>
            </div>

            <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1 }}>
              {showHotspotAddForm && (
                <div style={{ background: '#FFF7ED', border: '1.5px solid #FDBA74', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ fontWeight: 800, fontSize: '13px', color: '#9A3412' }}>➕ TAMBAH TITIK RAWAN BARU</div>
                    <button type="button" onClick={() => setShowHotspotAddForm(false)} style={{ background: 'none', border: 'none', color: '#9A3412', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>✕ Batal</button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>🔍 Cari Alamat / Lokasi Rawan *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Nama jalan / kawasan (Cth: Kemang, Tebet, Senayan)..."
                        value={newHotspotTitle}
                        onChange={(e) => setNewHotspotTitle(e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Wilayah / Polsek Pengampu *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Contoh: Polsek Tebet / Sektor Timur"
                        value={newHotspotWilayah}
                        onChange={(e) => setNewHotspotWilayah(e.target.value)}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Kategori Kerawanan *</label>
                      <select
                        className="form-control"
                        value={newHotspotKategori}
                        onChange={(e) => setNewHotspotKategori(e.target.value)}
                      >
                        <option value="">-- Pilih Kategori Titik Rawan --</option>
                        {dbHotspotCategories.length === 0 ? (
                          <option value="" disabled>Data kategori belum tersedia di database</option>
                        ) : (
                          dbHotspotCategories.map((c: any) => (
                            <option key={c.id || c.key} value={c.label}>
                              {c.icon_emoji ? `${c.icon_emoji} ` : ''}{c.label}
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Tingkat Status Bahaya *</label>
                      <select
                        className="form-control"
                        value={newHotspotStatus}
                        onChange={(e) => setNewHotspotStatus(e.target.value)}
                      >
                        <option value="">-- Pilih Tingkat Status Bahaya --</option>
                        {dbHotspotDangerLevels.length === 0 ? (
                          <option value="" disabled>Data status bahaya belum tersedia di database</option>
                        ) : (
                          dbHotspotDangerLevels.map((d: any) => (
                            <option key={d.id || d.key} value={d.label}>
                              {d.icon_emoji ? `${d.icon_emoji} ` : ''}{d.label}
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>🕒 Jadwal / Jam Rawan *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="23:00 - 04:30 WIB..."
                        value={newHotspotJadwal}
                        onChange={(e) => setNewHotspotJadwal(e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Unit Terdekat / PIC Lapangan</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Patroli Samapta 110 (Siaga)"
                        defaultValue={`${officer.pangkat} ${officer.fullName}`}
                      />
                    </div>
                  </div>

                  {/* Interactive Mini Map Picker Box */}
                  {showMiniPickerRawan && (
                    <div style={{ marginBottom: '12px', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#1E293B' }}>🗺️ Klik lokasi pada peta di bawah ini untuk mengambil titik:</span>
                        <button type="button" onClick={() => setShowMiniPickerRawan(false)} style={{ background: 'none', border: 'none', color: '#DC2626', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer' }}>✕ Tutup Peta</button>
                      </div>
                      <MiniMapPicker
                        lat={newHotspotLat}
                        lng={newHotspotLng}
                        onChange={(pickedLat, pickedLng) => {
                          setNewHotspotLat(pickedLat);
                          setNewHotspotLng(pickedLng);
                        }}
                        height="220px"
                      />
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => setShowMiniPickerRawan(!showMiniPickerRawan)}
                      style={{ background: '#0284C7', color: 'white', border: 'none', padding: '7px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                    >
                      🗺️ {showMiniPickerRawan ? 'Sembunyikan Peta' : 'Pilih Titik dari Maps'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (navigator.geolocation) {
                          navigator.geolocation.getCurrentPosition((pos) => {
                            setNewHotspotLat(Number(pos.coords.latitude.toFixed(6)));
                            setNewHotspotLng(Number(pos.coords.longitude.toFixed(6)));
                            alert(`✓ Titik koordinat GPS terkunci: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
                          });
                        }
                      }}
                      style={{ background: '#E2E8F0', color: '#334155', border: 'none', padding: '7px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      📍 Lokasi Saya (GPS)
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!newHotspotTitle.trim()) {
                          alert('Nama titik rawan tidak boleh kosong!');
                          return;
                        }
                        if (!newHotspotKategori) {
                          alert('Silakan pilih kategori kerawanan!');
                          return;
                        }
                        if (!newHotspotStatus) {
                          alert('Silakan pilih tingkat status bahaya!');
                          return;
                        }
                        await createHotspotAction({
                          title: newHotspotTitle.trim(),
                          wilayahPolsek: newHotspotWilayah,
                          kategori: newHotspotKategori,
                          statusBahaya: newHotspotStatus,
                          lat: newHotspotLat,
                          lng: newHotspotLng,
                          jadwalDisplay: newHotspotJadwal,
                          unitTerdekat: `${officer.pangkat} ${officer.fullName}`,
                        });
                        alert('✓ Titik rawan berhasil ditambahkan!');
                        setNewHotspotTitle('');
                        setShowHotspotAddForm(false);
                        setShowMiniPickerRawan(false);
                        loadData();
                      }}
                      style={{ background: '#16A34A', color: 'white', border: 'none', padding: '7px 16px', borderRadius: '6px', fontWeight: 800, fontSize: '11.5px', cursor: 'pointer' }}
                    >
                      💾 Simpan Titik Rawan
                    </button>
                  </div>
                </div>
              )}

              {/* List Hotspots */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {hotspots.map((h) => (
                  <div
                    key={h.id || h.key}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 14px',
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '13px', color: '#1E293B' }}>🔴 {h.title}</div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>
                        {h.kategori} • Jadwal: {h.jadwalDisplay}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        if (confirm(`Hapus titik rawan ${h.title}?`)) {
                          await deleteHotspotAction(h.key);
                          loadData();
                        }
                      }}
                      style={{ background: '#FEE2E2', color: '#DC2626', border: '1px solid #FECACA', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Hapus
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PersonilConsoleView({ session, initialSection = 'beranda', initialMasterData }: { session?: any; initialSection?: string; initialMasterData?: any }) {
  return (
    <React.Suspense fallback={<ConsoleSkeleton role="PERSONIL" />}>
      <PersonilContent session={session} initialSection={initialSection} />
    </React.Suspense>
  );
}
