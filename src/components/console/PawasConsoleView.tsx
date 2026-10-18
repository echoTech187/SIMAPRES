'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  getPendingComplaintsAction,
  assignComplaintAction,
  disposisiMultiSatuanAction,
  createComplaintAction,
  getAllRecentComplaintsAction,
  getIkmStatsAction,
  updateComplaintStatusAction,
  getMasterFilterOptionsAction,
} from '@/app/actions/complaint.actions';
import {
  getRegisteredUnitsAction,
  getPoliceOfficesAction,
  getOfficerProfileByNrpAction,
  logoutAction,
} from '@/app/actions/auth.actions';
import { getPatrolFleetUnitsAction } from '@/app/actions/fleet.actions';
import { ConsoleSkeleton } from './ConsoleSkeleton';
import HeaderProfileBadge from './HeaderProfileBadge';
import {
  getHotspotsAction,
  createHotspotAction,
  deleteHotspotAction,
} from '@/app/actions/hotspot.actions';
import { createLogbookAction } from '@/app/actions/logbook.actions';

const SimapresLeafletMap = dynamic(() => import('@/components/SimapresLeafletMap'), {
  ssr: false,
  loading: () => (
    <div style={{ width: '100%', height: '100%', minHeight: '350px', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', fontWeight: 700 }}>
      🛰️ Memuat Peta Rute Patroli &amp; Sebaran Unit...
    </div>
  ),
});

const MiniMapPicker = dynamic(() => import('@/components/MiniMapPicker'), {
  ssr: false,
  loading: () => <div style={{ height: '220px', background: '#E2E8F0' }} />,
});

function getSopRecommendationByIncident(item: any) {
  if (!item) return { primarySatuanId: 'sabhara', secondarySatuanIds: ['binmas', 'reskrim'] };
  const text = ((item.jenisKejadian || item.title || '') + ' ' + (item.kategori || item.kategoriInsiden || '') + ' ' + (item.deskripsiKejadian || item.deskripsi || '')).toLowerCase();

  // 1. Kamseltibcarlantas (Laka, macet, tabrakan, balap liar) -> Utama: Lantas, Pendukung: Sabhara
  if (text.includes('laka') || text.includes('tabrakan') || text.includes('macet') || text.includes('lalu lintas') || text.includes('derek') || text.includes('rem blong') || text.includes('senggolan') || text.includes('balap liar')) {
    return {
      primarySatuanId: 'lantas',
      secondarySatuanIds: ['sabhara'],
    };
  }

  // 2. Tindak Pidana & Kriminalitas (Curanmor, curas, sajam, pencurian, begal) -> Utama: Reskrim, Pendukung: Sabhara, Intelkam
  if (text.includes('curanmor') || text.includes('curas') || text.includes('curat') || text.includes('pencuri') || text.includes('curian') || text.includes('rampok') || text.includes('senjata tajam') || text.includes('sajam') || text.includes('begal') || text.includes('penodong') || text.includes('narkoba') || text.includes('penjambret') || text.includes('tindak pidana') || text.includes('bobol') || text.includes('kotak amal')) {
    return {
      primarySatuanId: 'reskrim',
      secondarySatuanIds: ['sabhara', 'intel'],
    };
  }

  // 3. Potensi Konflik & Deteksi Dini (Isu SARA, provokasi, unjuk rasa, demo, intel) -> Utama: Intelkam, Pendukung: Binmas, Sabhara
  if (text.includes('intel') || text.includes('konflik') || text.includes('sara') || text.includes('provokasi') || text.includes('unjuk rasa') || text.includes('demo') || text.includes('keramaian') || text.includes('izin') || text.includes('ancaman bom') || text.includes('deteksi')) {
    return {
      primarySatuanId: 'intel',
      secondarySatuanIds: ['binmas', 'sabhara'],
    };
  }

  // 4. Kemasyarakatan & Problem Solving (Mediasi warga, sengketa, anak hilang, bansos) -> Utama: Binmas, Pendukung: Sabhara
  if (text.includes('mediasi') || text.includes('problem solving') || text.includes('sengketa') || text.includes('keluarga') || text.includes('anak hilang') || text.includes('tetangga') || text.includes('bantuan') || text.includes('sosial') || text.includes('bansos')) {
    return {
      primarySatuanId: 'binmas',
      secondarySatuanIds: ['sabhara'],
    };
  }

  // 5. Bencana & Situasi Darurat Khusus (Pohon tumbang, banjir, kebakaran, evakuasi, SAR) -> Utama: Sabhara, Pendukung: Lantas
  if (text.includes('pohon') || text.includes('tumbang') || text.includes('bencana') || text.includes('banjir') || text.includes('kebakaran') || text.includes('evakuasi') || text.includes('sar')) {
    return {
      primarySatuanId: 'sabhara',
      secondarySatuanIds: ['lantas'],
    };
  }

  // 6. Kamtibmas & Gangguan Nyata -> Utama: Sabhara, Pendukung: Binmas, Reskrim
  return {
    primarySatuanId: 'sabhara',
    secondarySatuanIds: ['binmas', 'reskrim'],
  };
}

function parsePawasTab(section?: string, roleParam?: string | null): string {
  if (!section) return roleParam === 'operator' ? 'view-operator' : 'view-beranda';
  const clean = section.toLowerCase().trim();
  switch (clean) {
    case 'peta':
      return 'view-peta';
    case 'komando':
    case 'komando-pawas':
    case 'validasi':
      return 'view-validasi';
    case 'kinerja':
    case 'laporan':
      return 'view-laporan';
    case 'profil':
      return 'view-profil';
    case 'operator':
      return 'view-operator';
    case 'buat-pengaduan':
    case 'buat-log':
    case 'log':
      return 'view-log';
    case 'tolak':
      return 'view-tolak';
    case 'beranda':
    default:
      return roleParam === 'operator' ? 'view-operator' : 'view-beranda';
  }
}

function pawasTabToSlug(tabId: string): string {
  switch (tabId) {
    case 'view-peta':
      return 'peta';
    case 'view-validasi':
      return 'komando';
    case 'view-laporan':
      return 'kinerja';
    case 'view-profil':
      return 'profil';
    case 'view-operator':
      return 'operator';
    case 'view-log':
      return 'buat-pengaduan';
    case 'view-tolak':
      return 'tolak';
    case 'view-beranda':
    default:
      return '';
  }
}

function CommandCenterContent({ session, initialSection = 'beranda' }: { session?: any; initialSection?: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const roleParam = searchParams.get('role');
  const nrpParam = searchParams.get('nrp') || session?.identifier;

  // Active Tab: Terikat dengan URL Path/Page agar saat direfresh tidak mental ke beranda
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const parts = window.location.pathname.split('/').filter(Boolean);
      const last = parts[parts.length - 1];
      if (parts[0] === 'console' && parts.length > 1) {
        return parsePawasTab(last, roleParam);
      }
    }
    return parsePawasTab(initialSection, roleParam);
  });

  // User Profile
  const [userProfile, setUserProfile] = useState<any>({
    fullName: session?.fullName,
    nrp: session?.identifier,
    pangkat: session?.rankPangkat,
    title: session?.title,
    roleBadge: session?.roleBadge,
    avatar: session?.avatar_url,
  });

  // Data Collections
  const [antreanPawas, setAntreanPawas] = useState<any[]>([]);
  const [allRecentComplaints, setAllRecentComplaints] = useState<any[]>([]);
  const [registeredUnits, setRegisteredUnits] = useState<any[]>([]);
  const [policeOffices, setPoliceOffices] = useState<any[]>([]);
  const [fleetUnits, setFleetUnits] = useState<any[]>([]);
  const [hotspots, setHotspots] = useState<any[]>([]);
  const [ikmStats, setIkmStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Map Filter & View Controls
  const [focusedFleet, setFocusedFleet] = useState<'all' | 'samapta' | 'perintis' | 'lantas' | 'hotspot'>('all');
  const [showTraffic, setShowTraffic] = useState(true);
  const [showOtherOfficers, setShowOtherOfficers] = useState(true);
  const [mapUnitDetail, setMapUnitDetail] = useState<any | null>(null);

  // Time & Attendance State
  const [liveClock, setLiveClock] = useState('');
  const [presensiStatus, setPresensiStatus] = useState('BELUM_MASUK'); // 'BELUM_MASUK' | 'SUDAH_MASUK' | 'SUDAH_PULANG'
  const [jamMasukPiket, setJamMasukPiket] = useState('-');
  const [jamPulangPiket, setJamPulangPiket] = useState('-');

  // Operator Simulation
  const [simCaller, setSimCaller] = useState({
    nama: '',
    telepon: '',
    alamat: '',
    kategori: '',
    urgensi: '',
    uraian: '',
    lat: 0,
    lng: 0,
  });
  const [isCallActive, setIsCallActive] = useState(false);
  const [callTimer, setCallTimer] = useState('');

  // Disposisi Modal State
  const [showDisposisiModal, setShowDisposisiModal] = useState(false);
  const [selectedDisposisiItem, setSelectedDisposisiItem] = useState<any | null>(null);
  const [selectedSatuanKeys, setSelectedSatuanKeys] = useState<string[]>([]);
  const [activePreviewSatuanKey, setActivePreviewSatuanKey] = useState<string>('');
  const [showEditPersonel, setShowEditPersonel] = useState(false);
  const [customPersonelNama, setCustomPersonelNama] = useState('');
  const [kuotaPersonel, setKuotaPersonel] = useState(4);
  const [arahanPawas, setArahanPawas] = useState('');

  // Sukses Disposisi Modal State
  const [showSuksesModal, setShowSuksesModal] = useState(false);
  const [suksesDisposisiData, setSuksesDisposisiData] = useState<any | null>(null);

  // Modals Detail Audits
  const [showSlaModal, setShowSlaModal] = useState(false);
  const [filterSlaTab, setFilterSlaTab] = useState<'all' | 'lt5' | '5to10' | 'gt10'>('all');

  const [showKuatPersModal, setShowKuatPersModal] = useState(false);
  const [filterPersTab, setFilterPersTab] = useState<'semua' | 'tugas' | 'siaga' | 'cadangan' | 'ranmor'>('semua');

  const [showIkmModal, setShowIkmModal] = useState(false);
  const [filterIkmTab, setFilterIkmTab] = useState<'semua' | 'star5' | 'star4'>('semua');

  const [showCetakModal, setShowCetakModal] = useState(false);
  const [showPresensiPulangModal, setShowPresensiPulangModal] = useState(false);
  const [showKeamananModal, setShowKeamananModal] = useState(false);
  const [pinOtorisasiPawas, setPinOtorisasiPawas] = useState<string[]>(['', '', '', '', '', '']);
  const [showTimePickerModal, setShowTimePickerModal] = useState(false);
  const [showLightboxModal, setShowLightboxModal] = useState(false);
  const [lightboxImg, setLightboxImg] = useState({ url: '', title: '', meta: '', desc: '' });
  // Hotspot CRUD Modal
  const [showHotspotModal, setShowHotspotModal] = useState(false);
  const [showHotspotAddForm, setShowHotspotAddForm] = useState(false);
  const [showMiniPickerRawan, setShowMiniPickerRawan] = useState(false);
  const [newHotspotTitle, setNewHotspotTitle] = useState('');
  const [newHotspotWilayah, setNewHotspotWilayah] = useState('');
  const [newHotspotKategori, setNewHotspotKategori] = useState('');
  const [newHotspotStatus, setNewHotspotStatus] = useState('');
  const [newHotspotJadwal, setNewHotspotJadwal] = useState('');
  const [newHotspotLat, setNewHotspotLat] = useState(0);
  const [newHotspotLng, setNewHotspotLng] = useState(0);

  // Supervisi & Validasi State (Default 'menunggu' 1:1 Prototype e-tribrata-log)
  const [valFilterStatus, setValFilterStatus] = useState<string>('menunggu');
  const [valFilterPlatform, setValFilterPlatform] = useState<string>('all');
  const [valFilterKategori, setValFilterKategori] = useState<string>('all');
  const [selectedValComplaint, setSelectedValComplaint] = useState<any | null>(null);

  // Live Stopwatch SLA 3 Cockpit
  const [slaClockSeconds, setSlaClockSeconds] = useState<number>(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setSlaClockSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatSlaClock = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Penolakan Form State (Screen 8)
  const [tolakComplaint, setTolakComplaint] = useState<any | null>(null);
  const [tolakKategori, setTolakKategori] = useState('');
  const [tolakAlasan, setTolakAlasan] = useState('');

  // Buat Log (+) Form State (Screen 3)
  const [logWaktuMulai, setLogWaktuMulai] = useState('');
  const [logSektor, setLogSektor] = useState('');
  const [logJenis, setLogJenis] = useState<string>('');
  const [logDeskripsi, setLogDeskripsi] = useState('');
  const [logFotoPreview, setLogFotoPreview] = useState<string | null>(null);

  // Profil Riwayat Log Filters
  const [profilLogSearch, setProfilLogSearch] = useState('');
  const [profilLogFilter, setProfilLogFilter] = useState('semua');

  // Master Filter Options from Database
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [dbPlatforms, setDbPlatforms] = useState<any[]>([]);
  const [dbGiats, setDbGiats] = useState<any[]>([]);
  const [dbSatuans, setDbSatuans] = useState<any[]>([]);
  const [dbStatuses, setDbStatuses] = useState<any[]>([]);

  // Daftar Satuan Armada Presisi Dinamis (Sinkron Database Master Operational Units & Registered Units)
  const daftarArmadaAktif = useMemo(() => {
    if (dbSatuans.length > 0) {
      return dbSatuans.map((mu) => {
        const officer = registeredUnits.find(
          (u) => (u.unitId || '').toLowerCase() === mu.key.toLowerCase()
        );
        const vehicle = fleetUnits.find(
          (f) => (f.unit_key || f.unitId || '').toLowerCase() === mu.key.toLowerCase()
        );

        const komandan = officer
          ? `${officer.pangkat ? officer.pangkat + ' ' : ''}${officer.nama}`.trim() + (officer.kelompokRegu ? ` (${officer.kelompokRegu})` : '')
          : '-';

        const nrpKomandan = officer?.nrp || '-';
        const posisiSaatIni = officer?.kelompokRegu || '-';

        const kekuatan = vehicle
          ? `Siaga Tim Presisi • ${vehicle.vehicle_name || vehicle.call_sign} (${vehicle.plate_number})`
          : '-';

        return {
          id: mu.key,
          satuanId: mu.key,
          nama: mu.unit_name || '-',
          namaSingkat: mu.short_name || mu.unit_name || '-',
          satuan: mu.unit_name || '-',
          sektorUtama: '-',
          komandan,
          nrpKomandan,
          posisiSaatIni,
          kekuatan,
          jarakBase: 0,
          etaBase: 0,
          icon: mu.icon_emoji || '🚔',
          tupoksi: mu.duties || '',
          arahanDefault: mu.default_orders || '',
        };
      });
    }
    return [];
  }, [dbSatuans, registeredUnits, fleetUnits]);

  // Kinerja Period Filter
  const [kinerjaPeriod, setKinerjaPeriod] = useState<'harian' | 'mingguan' | 'bulanan'>('harian');
  const [kinerjaDate, setKinerjaDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // Load Real Data from Server Actions
  const loadData = async () => {
    try {
      const filterRes = await getMasterFilterOptionsAction();
      if (filterRes.success && filterRes.data) {
        setDbCategories(filterRes.data.categories || []);
        setDbPlatforms(filterRes.data.platforms || []);
        setDbGiats(filterRes.data.giats || []);
        setDbSatuans(filterRes.data.satuans || []);
        setDbStatuses(filterRes.data.statuses || []);
      }

      const qRes = await getPendingComplaintsAction();
      if (qRes.success && qRes.data) {
        setAntreanPawas(qRes.data);
      }

      const allRes = await getAllRecentComplaintsAction(100);
      if (allRes.success && allRes.data) {
        setAllRecentComplaints(allRes.data);
        if (!selectedValComplaint && allRes.data.length > 0) {
          setSelectedValComplaint(allRes.data[0]);
        }
      }

      const uRes = await getRegisteredUnitsAction();
      if (uRes.success && uRes.data) {
        setRegisteredUnits(uRes.data);
      }

      const fRes = await getPatrolFleetUnitsAction();
      if (fRes.success && fRes.data) {
        setFleetUnits(fRes.data);
      }

      const oRes = await getPoliceOfficesAction();
      if (oRes.success && oRes.data) {
        setPoliceOffices(oRes.data);
      }

      const hRes = await getHotspotsAction();
      if (hRes.success && hRes.data) {
        setHotspots(hRes.data);
      }

      const ikmRes = await getIkmStatsAction();
      if (ikmRes.success && ikmRes.data) {
        setIkmStats(ikmRes.data);
      }
    } catch (e) {
      console.warn('Error loading command-center data:', e);
    }
  };

  useEffect(() => {
    // Clock ticker
    const timer = setInterval(() => {
      const now = new Date();
      setLiveClock(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB');
    }, 1000);

    // Sinkronisasi query parameters jika ada (?tab=... / ?page=...)
    if (typeof window !== 'undefined' && window.location.search) {
      const qParams = new URLSearchParams(window.location.search);
      const tabQ = qParams.get('tab') || qParams.get('page');
      if (tabQ) {
        const matchedTab = parsePawasTab(tabQ, roleParam);
        setActiveTab(matchedTab);
        const slug = pawasTabToSlug(matchedTab);
        window.history.replaceState(null, '', slug ? `/console/${slug}` : '/console');
      }
    }

    let sessionUser: any = null;
    try {
      const stored = sessionStorage.getItem('simapres_active_user');
      if (stored) sessionUser = JSON.parse(stored);
    } catch {}

    const effectiveRole = roleParam || sessionUser?.role || session?.role || '';
    const effectiveNrp = nrpParam || sessionUser?.nrp || session?.identifier || '';

    if (sessionUser && sessionUser.fullName) {
      const isOp = effectiveRole === 'operator' || sessionUser.role === 'operator';
      setUserProfile({
        fullName: sessionUser.fullName || sessionUser.nama || '',
        nrp: sessionUser.nrp || '',
        pangkat: sessionUser.pangkat || '',
        title: isOp,
        roleBadge: isOp,
        avatar: sessionUser.avatar || null,
      });
      if (isOp && initialSection === 'beranda') setActiveTab('view-operator');
    }

    if (effectiveNrp) {
      getOfficerProfileByNrpAction(effectiveNrp).then((res) => {
        if (res.success && res.data) {
          const isOp = effectiveRole === 'operator' || res.data.role === 'operator';
          setUserProfile({
            fullName: res.data.fullName || '',
            nrp: res.data.nrp || '',
            pangkat: res.data.pangkat || '',
            title: isOp,
            roleBadge: isOp,
            avatar: res.data.avatar || null,
          });
          if (isOp && initialSection === 'beranda') setActiveTab('view-operator');
        } else if (!sessionUser) {
          const isOp = effectiveRole === 'operator';
          setUserProfile({
            fullName: session?.fullName || '',
            nrp: effectiveNrp,
            pangkat: session?.rankPangkat || '',
            title: isOp,
            roleBadge: isOp,
            avatar: session?.avatar_url || null,
          });
          if (isOp && initialSection === 'beranda') setActiveTab('view-operator');
        }
      });
    }

    loadData();
    return () => clearInterval(timer);
  }, [roleParam, nrpParam]);

  // Listener tombol navigasi Back/Forward browser
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window !== 'undefined') {
        const parts = window.location.pathname.split('/').filter(Boolean);
        const last = parts[parts.length - 1];
        if (parts[0] === 'console' && parts.length > 1) {
          setActiveTab(parsePawasTab(last, roleParam));
        } else {
          setActiveTab('view-beranda');
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [roleParam]);

  // Tab & Per-Page switcher: sinkronkan ke URL browser secara mulus
  const switchTab = (tabId: string) => {
    setActiveTab(tabId);
    const slug = pawasTabToSlug(tabId);
    const targetUrl = slug ? `/console/${slug}` : '/console';
    if (typeof window !== 'undefined' && window.location.pathname !== targetUrl) {
      window.history.pushState(null, '', targetUrl);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isComplaintRejected = (c: any) =>
    Boolean(
      c?.ringkasanKeterangan?.includes('[DITOLAK PAWAS]') ||
      c?.status === 'DIBATALKAN' ||
      c?.status === 'DITOLAK'
    );

  // Dynamic complaint status resolver powered 100% by dbStatuses from master_complaint_statuses table
  const resolveComplaintStatus = (rawStatus?: string | null, isRejectedFlag?: boolean) => {
    const s = (rawStatus || '').toUpperCase().trim();
    const isRej = isRejectedFlag || s === 'DITOLAK' || s === 'DIBATALKAN';

    // Canonical key mapped to database keys
    const targetKey = isRej
      ? 'DITOLAK'
      : s === 'SELESAI'
      ? 'SELESAI'
      : s === 'MENUNGGU_PENGESAHAN'
      ? 'MENUNGGU_PENGESAHAN'
      : s === 'TIBA_DI_TKP' || s === 'PENANGANAN_TKP'
      ? 'TIBA_DI_TKP'
      : s === 'MENUJU_TKP'
      ? 'MENUJU_TKP'
      : s === 'DISPOSISI' || s === 'DIPROSES'
      ? 'DISPOSISI'
      : 'MENUNGGU';

    const dbItem = dbStatuses.find(
      (item) => item.key?.toUpperCase() === targetKey || item.key?.toUpperCase() === s
    );

    if (dbItem) {
      return {
        id: dbItem.id,
        key: dbItem.key.toUpperCase(),
        label: dbItem.label,
        badge_color: dbItem.badge_color || '#2563EB',
        badge_bg: dbItem.badge_bg || '#EFF6FF',
        badge_border: dbItem.badge_border || '#BFDBFE',
        display_order: dbItem.display_order ?? 1,
        icon:
          dbItem.key === 'MENUNGGU' ? '⏳' :
          dbItem.key === 'DIPROSES' ? '🚔' :
          dbItem.key === 'DISPOSISI' ? '📋' :
          dbItem.key === 'MENUJU_TKP' ? '🚔' :
          dbItem.key === 'TIBA_DI_TKP' ? '📍' :
          dbItem.key === 'MENUNGGU_PENGESAHAN' ? '📝' :
          dbItem.key === 'SELESAI' ? '✓' : '✕',
      };
    }

    // Dynamic fallback when dbStatuses is still loading
    const fallbackColors: Record<string, { color: string; bg: string; border: string; icon: string }> = {
      MENUNGGU: { color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', icon: '⏳' },
      DIPROSES: { color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', icon: '🚔' },
      DISPOSISI: { color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', icon: '📋' },
      MENUJU_TKP: { color: '#8B5CF6', bg: '#F5F3FF', border: '#DDD6FE', icon: '🚔' },
      TIBA_DI_TKP: { color: '#10B981', bg: '#ECFDF5', border: '#A7F3D0', icon: '📍' },
      MENUNGGU_PENGESAHAN: { color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE', icon: '📝' },
      SELESAI: { color: '#059669', bg: '#ECFDF5', border: '#A7F3D0', icon: '✓' },
      DITOLAK: { color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', icon: '✕' },
    };
    const fb = fallbackColors[targetKey] || { color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', icon: 'ℹ️' };

    return {
      id: 0,
      key: targetKey,
      label: targetKey.replace(/_/g, ' '),
      badge_color: fb.color,
      badge_bg: fb.bg,
      badge_border: fb.border,
      display_order: 1,
      icon: fb.icon,
    };
  };

  const matchesStatus = (c: any, status: string) => {
    if (!status || status === 'semua') return true;
    const isRejected = isComplaintRejected(c);
    const meta = resolveComplaintStatus(c?.status, isRejected);
    const stUpper = status.toUpperCase().trim();
    if (stUpper === meta.key) return true;
    if (status.toLowerCase() === meta.key.toLowerCase()) return true;
    if (status.toLowerCase() === 'diproses') {
      return ['DIPROSES', 'DISPOSISI', 'MENUJU_TKP', 'TIBA_DI_TKP'].includes(meta.key);
    }
    return false;
  };

  const resolveUrgencyLevel = (rawUrgensi?: string | null) => {
    const u = (rawUrgensi || '').toUpperCase().trim();
    if (u === 'DARURAT' || u === 'PRIORITAS_TINGGI') {
      return { key: 'DARURAT', label: 'DARURAT', badge_bg: '#FEE2E2', badge_color: '#DC2626' };
    }
    if (u === 'SEDANG') {
      return { key: 'SEDANG', label: 'SEDANG', badge_bg: '#FEF3C7', badge_color: '#D97706' };
    }
    return { key: 'NORMAL', label: 'NORMAL', badge_bg: '#EFF6FF', badge_color: '#1D4ED8' };
  };

  const getComplaintPlatform = (c: any) => {
    if (c?.platformKey) {
      if (['sos', 'warga', 'layanan110', 'personel'].includes(c.platformKey)) {
        return c.platformKey;
      }
      if (c.platformKey === 'SOS_PANIK') return 'sos';
      if (c.platformKey === 'LAYANAN_110') return 'layanan110';
      if (c.platformKey === 'PATROLI_PERSONEL') return 'personel';
      if (c.platformKey === 'PORTAL_WARGA') return 'warga';
    }
    const isSos =
      c?.jenisKejadian?.toLowerCase().includes('sos') ||
      c?.jenisKejadian?.toLowerCase().includes('panic') ||
      c?.saluranLaporan?.toLowerCase() === 'sos';
    if (isSos) return 'sos';
    const isPersonel =
      c?.ringkasanKeterangan?.toLowerCase().includes('patroli') ||
      c?.jenisKejadian?.toLowerCase().includes('patroli') ||
      c?.saluranLaporan?.toLowerCase() === 'personel';
    if (isPersonel) return 'personel';
    const is110 = !!c?.operatorId || c?.saluranLaporan === '110' || c?.saluranLaporan === 'layanan110';
    if (is110) return 'layanan110';
    return 'warga';
  };

  const matchesPlatform = (c: any, platform: string) => {
    if (platform === 'all') return true;
    return getComplaintPlatform(c) === platform;
  };

  // Master Incident Categories Reference (Mirror of master_incident_categories table in DB)
  const DEFAULT_MASTER_INCIDENT_CATEGORIES = [
    { key: 'KRIMINALITAS', label: 'Kriminalitas & 3C', icon: '🚨', badge_bg: '#FEF2F2', badge_color: '#DC2626', badge_border: '#FECACA' },
    { key: 'KAMTIBMAS', label: 'Kamtibmas & Tawuran', icon: '👥', badge_bg: '#FFFBEB', badge_color: '#D97706', badge_border: '#FDE68A' },
    { key: 'LAKALANTAS', label: 'Laka & Kemacetan Lantas', icon: '🚦', badge_bg: '#EFF6FF', badge_color: '#2563EB', badge_border: '#BFDBFE' },
    { key: 'BENCANA', label: 'Darurat & Bencana Alam', icon: '🔥', badge_bg: '#FEF2F2', badge_color: '#EA580C', badge_border: '#FED7AA' },
    { key: 'PELAYANAN_PUBLIK', label: 'Pelayanan Publik & Walk-in', icon: '📋', badge_bg: '#F8FAFC', badge_color: '#475569', badge_border: '#CBD5E1' },
  ];

  // Master Activity Types Reference (Mirror of master_activity_types table in DB)
  const DEFAULT_MASTER_ACTIVITY_TYPES = [
    { key: 'PATROLI', label: 'Patroli', icon: '🚔', badge_bg: '#EFF6FF', badge_color: '#1D4ED8', badge_border: '#BFDBFE' },
    { key: 'SAMBANG', label: 'Sambang', icon: '🤝', badge_bg: '#F0FDF4', badge_color: '#15803D', badge_border: '#BBF7D0' },
    { key: 'TPTKP', label: 'TPTKP', icon: '🛡️', badge_bg: '#FEF2F2', badge_color: '#DC2626', badge_border: '#FECACA' },
    { key: 'PENGAMANAN', label: 'Pengamanan', icon: '⚠️', badge_bg: '#FFFBEB', badge_color: '#B45309', badge_border: '#FDE68A' },
  ];

  // Dynamic Category & Badge Info Resolver (100% Master-driven from DB master_incident_categories)
  const getComplaintKategoriInfo = (c: any) => {
    const catList = dbCategories.length > 0 ? dbCategories : DEFAULT_MASTER_INCIDENT_CATEGORIES;

    if (!c) {
      const def = catList[1] || DEFAULT_MASTER_INCIDENT_CATEGORIES[1];
      return {
        key: def.key,
        kategori: def.label,
        label: def.label,
        badgeText: `${def.icon} ${def.label}`,
        badgeStyle: {
          background: def.badge_bg,
          color: def.badge_color,
          border: `1px solid ${def.badge_border}`,
        },
      };
    }

    // 1. Direct relation from Database (c.kategoriRel / c.category_rel)
    const rel = c.kategoriRel || c.category_rel;
    if (rel) {
      const rawLabel = rel.label || rel.key || '';
      const icon = rel.icon || '';
      const badgeText = (icon && !rawLabel.includes(icon)) ? `${icon} ${rawLabel}` : rawLabel;
      return {
        key: rel.key,
        kategori: rawLabel,
        label: rawLabel,
        badgeText,
        badgeStyle: {
          background: rel.badge_bg || '#F1F5F9',
          color: rel.badge_color || '#1E293B',
          border: `1px solid ${rel.badge_border || '#CBD5E1'}`,
        },
      };
    }

    // 2. Lookup in loaded master dbCategories by ID
    const targetId = c.category_id || c.kategoriId;
    if (targetId) {
      const foundById = catList.find((cat: any) => cat.id === targetId);
      if (foundById) {
        const rawLabel = foundById.label || foundById.key || '';
        const icon = foundById.icon || '';
        const badgeText = (icon && !rawLabel.includes(icon)) ? `${icon} ${rawLabel}` : rawLabel;
        return {
          key: foundById.key,
          kategori: rawLabel,
          label: rawLabel,
          badgeText,
          badgeStyle: {
            background: foundById.badge_bg || '#F1F5F9',
            color: foundById.badge_color || '#1E293B',
            border: `1px solid ${foundById.badge_border || '#CBD5E1'}`,
          },
        };
      }
    }

    // 3. Lookup by kategoriKey if present
    const rawKey = (c.kategoriKey || c.kategori_key || '').toUpperCase();
    if (rawKey) {
      const foundByKey = catList.find((cat: any) => cat.key.toUpperCase() === rawKey || cat.label.toUpperCase() === rawKey);
      if (foundByKey) {
        const rawLabel = foundByKey.label || foundByKey.key || '';
        const icon = foundByKey.icon || '';
        const badgeText = (icon && !rawLabel.includes(icon)) ? `${icon} ${rawLabel}` : rawLabel;
        return {
          key: foundByKey.key,
          kategori: rawLabel,
          label: rawLabel,
          badgeText,
          badgeStyle: {
            background: foundByKey.badge_bg || '#F1F5F9',
            color: foundByKey.badge_color || '#1E293B',
            border: `1px solid ${foundByKey.badge_border || '#CBD5E1'}`,
          },
        };
      }
      // Check if it matches Giat Personel
      const giatList = dbGiats.length > 0 ? dbGiats : DEFAULT_MASTER_ACTIVITY_TYPES;
      const foundGiat = giatList.find((g: any) => g.key.toUpperCase() === rawKey || g.label.toUpperCase() === rawKey);
      if (foundGiat) {
        const rawLabel = foundGiat.label || foundGiat.key || '';
        const icon = foundGiat.icon || '';
        const badgeText = (icon && !rawLabel.includes(icon)) ? `${icon} ${rawLabel}` : rawLabel;
        return {
          key: foundGiat.key,
          kategori: rawLabel,
          label: rawLabel,
          badgeText,
          badgeStyle: {
            background: foundGiat.badge_bg || foundGiat.active_bg || '#EFF6FF',
            color: foundGiat.badge_color || foundGiat.inactive_color || '#1D4ED8',
            border: `1px solid ${foundGiat.badge_border || foundGiat.border_color || '#BFDBFE'}`,
          },
        };
      }
    }

    // 4. Giat Personel fallback (Platform: personel)
    const platform = getComplaintPlatform(c);
    if (platform === 'personel') {
      const textGiat = `${c.jenisAksi || ''} ${c.jenisKejadian || ''} ${c.ringkasanKeterangan || ''}`.toLowerCase();
      const giatKey = textGiat.includes('sambang') ? 'SAMBANG' : textGiat.includes('tptkp') ? 'TPTKP' : textGiat.includes('pengamanan') || textGiat.includes('pam') ? 'PENGAMANAN' : 'PATROLI';
      const giatList = dbGiats.length > 0 ? dbGiats : DEFAULT_MASTER_ACTIVITY_TYPES;
      const foundGiat = giatList.find((g: any) => g.key === giatKey) || DEFAULT_MASTER_ACTIVITY_TYPES[0];
      const rawLabel = foundGiat.label || foundGiat.key || '';
      const icon = foundGiat.icon || '';
      const badgeText = (icon && !rawLabel.includes(icon)) ? `${icon} ${rawLabel}` : rawLabel;
      return {
        key: foundGiat.key,
        kategori: rawLabel,
        label: rawLabel,
        badgeText,
        badgeStyle: {
          background: foundGiat.badge_bg || foundGiat.active_bg || '#EFF6FF',
          color: foundGiat.badge_color || foundGiat.inactive_color || '#1D4ED8',
          border: `1px solid ${foundGiat.badge_border || foundGiat.border_color || '#BFDBFE'}`,
        },
      };
    }

    // 5. Intelligent Keyword Classifier to Master Category Key
    const jenis = (c.jenisKejadian || '').toLowerCase();
    const katLaporan = (c.kategoriLaporan || '').toLowerCase();
    const combined = `${jenis} ${katLaporan}`;
    const ringkasan = (c.ringkasanKeterangan || '').toLowerCase();

    let resolvedMasterKey = 'KAMTIBMAS';

    if (['tawuran', 'kerumunan', 'kamtibmas', 'miras', 'ribut', 'keributan', 'balap liar', 'balapan', 'kenakalan'].some((k) => combined.includes(k) || ringkasan.includes(k))) {
      resolvedMasterKey = 'KAMTIBMAS';
    } else {
      const hasCuri = (combined.includes('curi') && !combined.includes('curiga')) || combined.includes('pencurian') || combined.includes('mencuri');
      if (
        hasCuri ||
        ['kriminal', 'begal', 'curat', 'curas', 'curanmor', 'rampok', 'perampokan', 'jambret', 'penjambretan', 'celurit', 'senpi', 'todong', 'penodongan', 'aniaya', 'penganiayaan', 'copet', 'pemerasan', 'sajam'].some((k) => combined.includes(k) || ringkasan.includes(k))
      ) {
        resolvedMasterKey = 'KRIMINALITAS';
      } else if (['laka', 'lantas', 'kecelakaan', 'tabrak', 'macet', 'kemacetan', 'lalu lintas'].some((k) => combined.includes(k) || ringkasan.includes(k))) {
        resolvedMasterKey = 'LAKALANTAS';
      } else if (['kebakaran', 'bencana', 'darurat', 'medis', 'banjir', 'tumbang', 'damkar', 'ambulans'].some((k) => combined.includes(k) || ringkasan.includes(k))) {
        resolvedMasterKey = 'BENCANA';
      } else if (['pelayanan', 'mediasi', 'hilang', 'kehilangan', 'tersesat', 'ijazah', 'ktp', 'pengawalan', 'hewan', 'bantuan warga'].some((k) => combined.includes(k) || ringkasan.includes(k))) {
        resolvedMasterKey = 'PELAYANAN_PUBLIK';
      }
    }

    const matchedCat = catList.find((cat: any) => cat.key === resolvedMasterKey) || catList[1] || DEFAULT_MASTER_INCIDENT_CATEGORIES[1];
    const rawLabel = matchedCat.label || matchedCat.key || '';
    const icon = matchedCat.icon || '';
    const badgeText = (icon && !rawLabel.includes(icon)) ? `${icon} ${rawLabel}` : rawLabel;

    return {
      key: matchedCat.key,
      kategori: rawLabel,
      label: rawLabel,
      badgeText,
      badgeStyle: {
        background: matchedCat.badge_bg || '#F1F5F9',
        color: matchedCat.badge_color || '#1E293B',
        border: `1px solid ${matchedCat.badge_border || '#CBD5E1'}`,
      },
    };
  };

  // Helper returning the category key or label
  const getComplaintKategori = (c: any): string => {
    return getComplaintKategoriInfo(c).key;
  };

  const matchesKategori = (c: any, kategori: string) => {
    if (kategori === 'all') return true;
    const catInfo = getComplaintKategoriInfo(c);
    const target = kategori.toUpperCase().trim();
    if (catInfo.key && catInfo.key.toUpperCase() === target) return true;
    if (catInfo.label && catInfo.label.toUpperCase().includes(target)) return true;

    // Fallback checks on complaint properties
    if (c?.category_id && dbCategories.length > 0) {
      const dbCat = dbCategories.find((dc) => dc.key.toUpperCase() === target);
      if (dbCat && c.category_id === dbCat.id) return true;
    }
    if (c?.kategoriId && dbCategories.length > 0) {
      const dbCat = dbCategories.find((dc) => dc.key.toUpperCase() === target);
      if (dbCat && c.kategoriId === dbCat.id) return true;
    }
    if (c?.kategoriRel?.key && c.kategoriRel.key.toUpperCase() === target) return true;
    if (c?.kategoriKey && c.kategoriKey.toUpperCase() === target) return true;

    // Alias mapping (e.g. 'Kriminalitas' vs 'KRIMINALITAS', 'Laka Lantas' vs 'LAKALANTAS', etc.)
    const aliasMap: Record<string, string> = {
      'KRIMINALITAS': 'KRIMINALITAS',
      'KRIMINAL': 'KRIMINALITAS',
      'KAMTIBMAS': 'KAMTIBMAS',
      'LAKALANTAS': 'LAKALANTAS',
      'LAKA LANTAS': 'LAKALANTAS',
      'BENCANA': 'BENCANA',
      'DARURAT BENCANA': 'BENCANA',
      'DARURAT & BENCANA': 'BENCANA',
      'PELAYANAN_PUBLIK': 'PELAYANAN_PUBLIK',
      'PELAYANAN PUBLIK': 'PELAYANAN_PUBLIK',
    };
    const normTarget = aliasMap[target] || target;
    const normCurrent = aliasMap[catInfo.key.toUpperCase()] || catInfo.key.toUpperCase();
    return normTarget === normCurrent;
  };

  // 3-way AND filtering: status && platform && kategori
  const filterComplaintList = (
    status: string,
    platform: string,
    kategori: string,
    list: any[]
  ) => {
    return list.filter(
      (c) => matchesStatus(c, status) && matchesPlatform(c, platform) && matchesKategori(c, kategori)
    );
  };

  // Open Validasi with Status Filter and Auto-Select First Card (1:1 openValidasiList Prototype)
  const openValidasiList = (status: string, doSwitch = true) => {
    setValFilterStatus(status);
    const nextFiltered = filterComplaintList(status, valFilterPlatform, valFilterKategori, allRecentComplaints);
    if (nextFiltered.length > 0) {
      setSelectedValComplaint(nextFiltered[0]);
    } else {
      setSelectedValComplaint(null);
    }
    if (doSwitch) {
      setActiveTab('view-validasi');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Open Validasi with Platform Filter (1:1 openValidasiWithPlatform Prototype)
  const openValidasiWithPlatform = (plat: string) => {
    setValFilterPlatform(plat);
    setValFilterKategori('all');
    const nextFiltered = filterComplaintList(valFilterStatus, plat, 'all', allRecentComplaints);
    if (nextFiltered.length > 0) {
      setSelectedValComplaint(nextFiltered[0]);
    } else {
      setSelectedValComplaint(null);
    }
    setActiveTab('view-validasi');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle Secondary Platform Filter
  const handleSelectPlatformFilter = (plat: string) => {
    setValFilterPlatform(plat);
    // Reset kategori ke 'all' saat ganti platform (1:1 Prototype line 5944)
    setValFilterKategori('all');
    const nextFiltered = filterComplaintList(valFilterStatus, plat, 'all', allRecentComplaints);
    if (nextFiltered.length > 0) {
      setSelectedValComplaint(nextFiltered[0]);
    } else {
      setSelectedValComplaint(null);
    }
  };

  // Handle Secondary Kategori Filter
  const handleSelectKategoriFilter = (kat: string) => {
    setValFilterKategori(kat);
    const nextFiltered = filterComplaintList(valFilterStatus, valFilterPlatform, kat, allRecentComplaints);
    if (nextFiltered.length > 0) {
      setSelectedValComplaint(nextFiltered[0]);
    } else {
      setSelectedValComplaint(null);
    }
  };

  // Handle Reset Filters (1:1 Prototype resetActiveFilters: mempertahankan status tab aktif, mereset platform & kategori ke 'all')
  const handleResetFilters = () => {
    setValFilterPlatform('all');
    setValFilterKategori('all');
    const nextFiltered = filterComplaintList(valFilterStatus, 'all', 'all', allRecentComplaints);
    if (nextFiltered.length > 0) {
      setSelectedValComplaint(nextFiltered[0]);
    } else {
      setSelectedValComplaint(null);
    }
  };

  // Quick template for Pawas instruction
  const tambahArahanCepatPawas = (text: string) => {
    setArahanPawas((prev) => (prev ? `${prev} ${text}` : text));
  };

  // Buka Modal Disposisi Pawas (1:1 Logika Prototype Sesuai SOP Tupoksi Polri)
  const bukaModalDisposisi = (item: any) => {
    setSelectedDisposisiItem(item);

    const sop = getSopRecommendationByIncident(item);
    const primaryId = sop.primarySatuanId;

    setSelectedSatuanKeys([primaryId]);
    setActivePreviewSatuanKey(primaryId);
    setShowEditPersonel(false);

    const leadArmada = daftarArmadaAktif.find((a) => a.id === primaryId) || daftarArmadaAktif[0];
    setCustomPersonelNama(leadArmada ? leadArmada.komandan : '-');

    // Kuota kuat personel SOP (berdasarkan urgensi laporan)
    const urgensiStr = (item.urgensi || '').toLowerCase();
    const textKasus = ((item.jenisKejadian || item.title || '') + ' ' + (item.kategori || '') + ' ' + (item.deskripsiKejadian || '')).toLowerCase();
    if (urgensiStr === 'darurat' || textKasus.includes('tawuran') || textKasus.includes('curas') || textKasus.includes('begal')) {
      setKuotaPersonel(8);
    } else if (textKasus.includes('curanmor') || textKasus.includes('kriminal') || textKasus.includes('sajam')) {
      setKuotaPersonel(6);
    } else if (urgensiStr === 'normal' || textKasus.includes('mediasi') || textKasus.includes('sambang')) {
      setKuotaPersonel(2);
    } else {
      setKuotaPersonel(4);
    }

    if (leadArmada.arahanDefault) {
      setArahanPawas(leadArmada.arahanDefault);
    }

    setShowDisposisiModal(true);
  };

  const toggleSatuanSelection = (unitId: string) => {
    setSelectedSatuanKeys((prev) => {
      const exists = prev.includes(unitId);
      if (exists) {
        if (prev.length === 1) {
          alert('⚠️ Minimal 1 Satuan Tugas harus dipilih untuk menerima disposisi.');
          return prev;
        }
        return prev.filter((id) => id !== unitId);
      } else {
        return [...prev, unitId];
      }
    });

    setActivePreviewSatuanKey(unitId);
    const target = daftarArmadaAktif.find((a) => a.id === unitId);
    if (target) {
      setCustomPersonelNama(target.komandan);
      if (target.arahanDefault) {
        setArahanPawas(target.arahanDefault);
      }
    }
  };

  // Confirm Disposisi Handler (Phase 2 -> Phase 3 Disposisi Pawas)
  const handleConfirmDisposisi = async () => {
    if (!selectedDisposisiItem) return;
    setLoading(true);
    try {
      const chosenArmadas = daftarArmadaAktif.filter((a) => selectedSatuanKeys.includes(a.id));
      const leadArmada = daftarArmadaAktif.find((a) => a.id === activePreviewSatuanKey) || chosenArmadas[0];

      const res = await disposisiMultiSatuanAction({
        complaintId: selectedDisposisiItem.id.toString(),
        satuanKeys: selectedSatuanKeys,
        kuotaPersonel: kuotaPersonel,
        arahanTaktis: arahanPawas,
        pawasNama: userProfile?.fullName || session?.fullName || '',
        pawasUserId: session?.userId ? String(session.userId) : (userProfile?.id ? String(userProfile.id) : ''),
      });

      if (res.success) {
        setSuksesDisposisiData({
          nomorTiket: selectedDisposisiItem.nomorTiket,
          unitName: chosenArmadas.map((a) => a.namaSingkat).join(' & '),
          komandan: customPersonelNama || leadArmada?.komandan || '-',
          jarak: leadArmada?.jarakBase ? `${leadArmada.jarakBase} km` : 'Terkonfirmasi di Sektor',
          eta: leadArmada?.etaBase ? `± ${leadArmada.etaBase} Menit` : 'Siaga Meluncur',
          posisi: leadArmada?.posisiSaatIni || '-',
        });
        setShowDisposisiModal(false);
        setShowSuksesModal(true);
        await loadData();
        // Switch to "Sedang Ditangani" (diproses) and focus on newly dispatched complaint
        setValFilterStatus('diproses');
        setSelectedValComplaint({
          ...selectedDisposisiItem,
          status: 'MENUJU_TKP',
          tahap: 3,
          disposisi_at: new Date().toISOString(),
        });
      } else {
        alert(res.error || 'Gagal menerbitkan disposisi.');
      }
    } catch (e: any) {
      alert(e.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  // Simpan Log Kegiatan Mandiri
  const handleSimpanLogKegiatan = async () => {
    const activeUserId = session?.userId ? String(session.userId) : (userProfile?.id ? String(userProfile.id) : '');
    if (!activeUserId) {
      alert('Sesi pengguna tidak valid. Silakan login kembali.');
      return;
    }
    setLoading(true);
    try {
      const nowTime = new Date().toTimeString().slice(0, 5);
      const res = await createLogbookAction({
        officerId: activeUserId,
        jenisAksi: (logJenis as any) || 'PATROLI',
        lokasiKlaimAlamat: logSektor || '',
        lokasiKlaimLat: 0,
        lokasiKlaimLng: 0,
        lokasiGpsAktualLat: 0,
        lokasiGpsAktualLng: 0,
        jamMulai: logWaktuMulai || nowTime,
        jamSelesai: nowTime,
        fotoBuktiUrl: logFotoPreview || undefined,
        deskripsiKegiatan: logDeskripsi || '',
      });

      if (res.success) {
        alert('✓ Log kegiatan dinas berhasil disimpan ke buku mutasi dan terverifikasi GPS!');
        switchTab('view-beranda');
        loadData();
      } else {
        alert(res.error || 'Gagal menyimpan log.');
      }
    } catch (e: any) {
      alert(e.message || 'Gagal menyimpan log kegiatan.');
    } finally {
      setLoading(false);
    }
  };

  // Submit Penolakan Log / Kasus (Phase 2 -> Ditolak)
  const handleSubmitPenolakan = async () => {
    if (!tolakComplaint) return;
    setLoading(true);
    try {
      const activePawasId = session?.userId ? String(session.userId) : (userProfile?.id ? String(userProfile.id) : '');
      const rejectNote = `[DITOLAK PAWAS]: ${tolakKategori}. Catatan: ${tolakAlasan}`;
      await updateComplaintStatusAction({
        complaintId: tolakComplaint.id.toString(),
        status: 'BELUM_DITANGANI',
        catatan: rejectNote,
        pawasUserId: activePawasId,
      });
      alert('✓ Permintaan revisi/penolakan berhasil diteruskan ke petugas penanggung jawab!\nLaporan masuk ke tab Ditolak.');
      const rejectedComplaint = {
        ...tolakComplaint,
        ringkasanKeterangan: rejectNote,
      };
      setTolakComplaint(null);
      setTolakAlasan('');
      await loadData();
      setValFilterStatus('ditolak');
      setSelectedValComplaint(rejectedComplaint);
      switchTab('view-validasi');
    } catch (e: any) {
      alert(e.message || 'Gagal mengirim penolakan.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Pengajuan Revisi Laporan Ditolak (1:1 Prototype koreksiLogDitolak)
  const handleAjukanRevisi = async (complaint: any) => {
    if (!complaint) return;
    const catatanRevisi = prompt(
      `📝 PENGAJUAN PERBAIKAN / REVISI LAPORAN\n\nMasukkan catatan perbaikan dokumen / klarifikasi revisi:\n(Catatan penolakan sebelumnya: "${complaint.ringkasanKeterangan || ''}")`,
      ''
    );
    if (!catatanRevisi) return;
    setLoading(true);
    try {
      const activePawasId = session?.userId ? String(session.userId) : (userProfile?.id ? String(userProfile.id) : '');
      const cleanPrev = (complaint.ringkasanKeterangan || '').replace(/\[DITOLAK PAWAS\]:.*?(Catatan:|$)/i, '').trim();
      const newKeterangan = `[PENGAJUAN REVISI]: ${catatanRevisi}. ${cleanPrev}`;
      const res = await updateComplaintStatusAction({
        complaintId: complaint.id.toString(),
        status: 'BELUM_DITANGANI',
        catatan: newKeterangan,
        pawasUserId: activePawasId,
      });
      if (res.success) {
        alert(`✓ Laporan #${complaint.nomorTiket || complaint.id} telah diajukan ulang ke Atasan untuk divalidasi kembali!\n\nStatus laporan kembali menjadi MENUNGGU TINDAKAN.`);
        await loadData();
        setValFilterStatus('menunggu');
        setSelectedValComplaint({
          ...complaint,
          status: 'BELUM_DITANGANI',
          ringkasanKeterangan: newKeterangan,
        });
      } else {
        alert(res.error || 'Gagal mengajukan revisi.');
      }
    } catch (e: any) {
      alert(e.message || 'Gagal mengajukan revisi.');
    } finally {
      setLoading(false);
    }
  };


  // Otorisasi / Pengesahan Kasus (Phase 4 Menunggu Pengesahan -> Phase 5 Selesai)
  const handleSahkanPenutupanKasus = async (complaint: any) => {
    if (!complaint) return;
    if (!confirm(`⚖️ OTORISASI PENUTUPAN KASUS (PAWAS)\n\nApakah Anda yakin ingin mengesahkan Berita Acara Penanganan kasus #${complaint.nomorTiket || complaint.id} dan menutup kasus ini secara resmi?`)) return;
    setLoading(true);
    try {
      const activePawasId = session?.userId ? String(session.userId) : (userProfile?.id ? String(userProfile.id) : '');
      const res = await updateComplaintStatusAction({
        complaintId: complaint.id.toString(),
        status: 'SELESAI',
        catatan: 'Berita acara lengkap, penanganan tuntas sesuai SOP Polri Presisi 110. Tiket resmi ditutup oleh Pawas.',
        pawasUserId: activePawasId,
      });
      if (res.success) {
        alert(`🏆 KASUS RESMI DISAHKAN & DITUTUP OLEH PAWAS!\n\n• Nomor Tiket: ${complaint.nomorTiket || complaint.id}\n• Otoritas Pengesah: ${userProfile.fullName || 'Pawas'} (Pawas)\n• Berita Acara: Lengkap & Sah secara Hukum\n• Status Akhir: SELESAI (Masuk ke Arsip Log Selesai)\n\nTerima kasih atas kepemimpinan & pengawasan Presisi!`);
        await loadData();
        setValFilterStatus('selesai');
        setSelectedValComplaint({
          ...complaint,
          status: 'SELESAI',
          selesaiAt: new Date().toISOString(),
        });
      } else {
        alert(res.error || 'Gagal mengesahkan penutupan kasus.');
      }
    } catch (e: any) {
      alert(e.message || 'Gagal mengesahkan kasus.');
    } finally {
      setLoading(false);
    }
  };

  // Attendance handlers
  const handlePresensiMasuk = () => {
    setPresensiStatus('SUDAH_MASUK');
    const jam = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
    setJamMasukPiket(jam + ' (Tervalidasi)');
    alert(`✅ Presensi Masuk Berhasil!\n\nJam: ${jam}\nLokasi: Area Mako Polres (Radius 50m)\nStatus: SIAGA PIKET AKTIF`);
  };

  const handlePresensiPulang = () => {
    setShowPresensiPulangModal(true);
  };

  const handleKonfirmasiPulangFinal = () => {
    setPresensiStatus('SUDAH_PULANG');
    const jam = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
    setJamPulangPiket(jam);
    setShowPresensiPulangModal(false);
    alert(`🚪 Presensi Pulang Berhasil!\n\nJam: ${jam}\nTerima kasih atas pelaksanaan dinas supervisi.`);
  };

  // 1. Global Summary for Beranda & General Statistics (1:1 Prototype e-tribrata-log Section 1)
  const totalLaporan = allRecentComplaints.length;
  const menungguCount = allRecentComplaints.filter((c) => matchesStatus(c, 'menunggu')).length;
  const ditolakCount = allRecentComplaints.filter((c) => matchesStatus(c, 'ditolak')).length;
  const diprosesCount = allRecentComplaints.filter((c) => matchesStatus(c, 'diproses')).length;
  const pengesahanCount = allRecentComplaints.filter((c) => matchesStatus(c, 'menunggu_pengesahan')).length;
  const selesaiCount = allRecentComplaints.filter((c) => matchesStatus(c, 'selesai')).length;

  const sosCount = allRecentComplaints.filter((c) => matchesPlatform(c, 'sos')).length;
  const wargaCount = allRecentComplaints.filter((c) => matchesPlatform(c, 'warga')).length;
  const hotline110Count = allRecentComplaints.filter((c) => matchesPlatform(c, 'layanan110')).length;
  const personelCount = allRecentComplaints.filter((c) => matchesPlatform(c, 'personel')).length;

  // 2. Status Tabs Counts (Interconnected with active Platform & Kategori - Section 2)
  const logsForStatusTabs = allRecentComplaints.filter(
    (c) => matchesPlatform(c, valFilterPlatform) && matchesKategori(c, valFilterKategori)
  );
  const tabCountSemua = logsForStatusTabs.length;
  const tabCountMenunggu = logsForStatusTabs.filter((c) => matchesStatus(c, 'menunggu')).length;
  const tabCountDisposisi = logsForStatusTabs.filter((c) => matchesStatus(c, 'disposisi')).length;
  const tabCountMenujuTkp = logsForStatusTabs.filter((c) => matchesStatus(c, 'menuju_tkp')).length;
  const tabCountTibaTkp = logsForStatusTabs.filter((c) => matchesStatus(c, 'tiba_di_tkp')).length;
  const tabCountPengesahan = logsForStatusTabs.filter((c) => matchesStatus(c, 'menunggu_pengesahan')).length;
  const tabCountSelesai = logsForStatusTabs.filter((c) => matchesStatus(c, 'selesai')).length;
  const tabCountDitolak = logsForStatusTabs.filter((c) => matchesStatus(c, 'ditolak')).length;
  const tabCountDiproses = logsForStatusTabs.filter((c) => matchesStatus(c, 'diproses')).length;

  // 3. Platform Bar Counts (Interconnected with active Status & Kategori - Section 3)
  const logsForPlatform = allRecentComplaints.filter(
    (c) => matchesStatus(c, valFilterStatus) && matchesKategori(c, valFilterKategori)
  );
  const platCountAll = logsForPlatform.length;
  const platCountSos = logsForPlatform.filter((c) => matchesPlatform(c, 'sos')).length;
  const platCountWarga = logsForPlatform.filter((c) => matchesPlatform(c, 'warga')).length;
  const platCount110 = logsForPlatform.filter((c) => matchesPlatform(c, 'layanan110')).length;
  const platCountPersonel = logsForPlatform.filter((c) => matchesPlatform(c, 'personel')).length;

  // 4. Kategori / Giat Bar Counts (Interconnected with active Status & Platform - Section 4)
  const logsForKategori = allRecentComplaints.filter(
    (c) => matchesStatus(c, valFilterStatus) && matchesPlatform(c, valFilterPlatform)
  );
  const katCountAll = logsForKategori.length;

  // Giat counts for when Platform is 'personel'
  const giatCountPatroli = logsForKategori.filter((c) => matchesKategori(c, 'PATROLI')).length;
  const giatCountSambang = logsForKategori.filter((c) => matchesKategori(c, 'SAMBANG')).length;
  const giatCountTptkp = logsForKategori.filter((c) => matchesKategori(c, 'TPTKP')).length;
  const giatCountPam = logsForKategori.filter((c) => matchesKategori(c, 'PENGAMANAN')).length;

  // Dynamic SLA & IKM Metrics derived 100% from database
  const completedWithTime = allRecentComplaints.filter((c) => typeof c.responseTimeMinutes === 'number' && c.responseTimeMinutes > 0);
  const avgResponseTime = completedWithTime.length > 0
    ? (completedWithTime.reduce((sum, c) => sum + (c.responseTimeMinutes || 0), 0) / completedWithTime.length).toFixed(1)
    : '0.0';
  const fastCount = completedWithTime.filter((c) => (c.responseTimeMinutes || 0) < 5).length;
  const mediumCount = completedWithTime.filter((c) => (c.responseTimeMinutes || 0) >= 5 && (c.responseTimeMinutes || 0) <= 10).length;
  const slowCount = completedWithTime.filter((c) => (c.responseTimeMinutes || 0) > 10).length;
  const onTimeCount = fastCount + mediumCount;
  const onTimeRate = completedWithTime.length > 0
    ? ((onTimeCount / completedWithTime.length) * 100).toFixed(1)
    : '0.0';
  const ratedComplaints = allRecentComplaints.filter((c) => typeof c.citizenRating === 'number' && c.citizenRating > 0);
  const satisfactionRating = ikmStats?.averageRating
    ? ikmStats.averageRating.toFixed(1)
    : ratedComplaints.length > 0
    ? (ratedComplaints.reduce((s, c) => s + (c.citizenRating || 0), 0) / ratedComplaints.length).toFixed(1)
    : '0.0';
  const satisfactionPercent = ikmStats?.percentageSatisfaction
    ? ikmStats.percentageSatisfaction.toFixed(1)
    : ratedComplaints.length > 0
    ? ((ratedComplaints.filter((c) => (c.citizenRating || 0) >= 4).length / ratedComplaints.length) * 100).toFixed(1)
    : '0.0';

  // Prominent Breaking Incident
  const highPriorityIncident = antreanPawas.find((c) => c.urgensi === 'DARURAT' || c.urgensi === 'PRIORITAS_TINGGI') || antreanPawas[0] || allRecentComplaints[0];

  // Filtered Complaints for Screen 4 (view-validasi)
  const filteredValidasiComplaints = filterComplaintList(
    valFilterStatus,
    valFilterPlatform,
    valFilterKategori,
    allRecentComplaints
  );

  // Active Complaint dynamically resolved to match current filter 1:1 with Prototype
  const activeComplaint =
    filteredValidasiComplaints.find((c) => c.id === selectedValComplaint?.id) ||
    filteredValidasiComplaints[0] ||
    null;

  return (
    <div style={{ background: '#F1F5F9', minHeight: '100vh', display: 'flex', justifyContent: 'center' }}>
      <div className="app-container" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>

        {/* ======================================================== */}
        {/* TOP APP BAR (Identik 1:1 Prototype e-tribrata-log.html)  */}
        {/* ======================================================== */}
        <header className="top-bar">
          <div className="brand" onClick={() => switchTab('view-beranda')} style={{ cursor: 'pointer' }}>
            <div className="brand-logo">
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  background: '#FBBF24',
                  clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                  marginRight: '8px',
                }}
              />
            </div>
            E TRIBRATA LOG
          </div>

          <div className="user-profile">
            <HeaderProfileBadge
              name={userProfile.fullName}
              identifier={userProfile.nrp}
              role="pawas"
              avatar={userProfile.avatar}
              isActive={activeTab === 'view-profil'}
              hasNotification={menungguCount > 0}
              onBellClick={() => openValidasiList('menunggu')}
              onClick={() => switchTab('view-profil')}
            />
          </div>
        </header>

        {/* ======================================================== */}
        {/* VIEW CONTAINER                                           */}
        {/* ======================================================== */}
        <main className="view-container">

          {/* ======================================================== */}
          {/* SCREEN 1: BERANDA (DASHBOARD OPERASIONAL PAWAS)          */}
          {/* ======================================================== */}
          {activeTab === 'view-beranda' && (
            <section id="view-beranda" className="view active">
              <div
                className="dashboard-header"
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', padding: '16px 20px 10px' }}
              >
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#1E293B' }}>DASHBOARD OPERASIONAL</div>
                  <div className="status-text" style={{ fontSize: '11px', color: '#64748B', fontWeight: 700 }}>
                    {presensiStatus === 'SUDAH_MASUK' ? 'STATUS: DINAS PIKET AKTIF' : 'STATUS: TIDAK DINAS'}
                  </div>
                </div>

                {/* Tombol Tambah Pengaduan (🎧 Operator CAD) */}
                <button
                  id="btn-top-spkt-disposisi"
                  type="button"
                  onClick={() => switchTab('view-operator')}
                  style={{
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '10px 18px',
                    borderRadius: '10px',
                    fontWeight: 800,
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
                    transition: 'transform 0.15s, box-shadow 0.15s',
                  }}
                  title="Buka Sentra Pelayanan untuk Tambah Pengaduan Darurat & Disposisi Cepat"
                >
                  <span style={{ fontSize: '15px' }}>🎧</span>
                  <span>+ Tambah Pengaduan</span>
                </button>
              </div>

              {/* Banner Alert Insiden Menonjol Khusus Pimpinan */}
              {highPriorityIncident && (
                <div
                  id="pimpinan-breaking-alert"
                  style={{
                    margin: '0 20px 16px',
                    background: 'linear-gradient(135deg, #FEF2F2 0%, #FFF1F2 100%)',
                    border: '1.5px solid #FCA5A5',
                    borderLeft: '6px solid #DC2626',
                    borderRadius: '12px',
                    padding: '14px 18px',
                    boxShadow: '0 4px 15px rgba(220, 38, 38, 0.08)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <div
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '10px',
                          background: '#FEE2E2',
                          border: '1px solid #FECACA',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '22px',
                          flexShrink: 0,
                        }}
                      >
                        🚨
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                          <span style={{ background: '#DC2626', color: 'white', fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', letterSpacing: '0.5px' }}>
                            INSIDEN MENONJOL
                          </span>
                          <span id="pimpinan-alert-waktu" style={{ fontSize: '11px', color: '#991B1B', fontWeight: 700 }}>
                            ⏱️ Waktu Respon Target &lt; 10:00 (SLA Siaga)
                          </span>
                        </div>
                        <div id="pimpinan-alert-judul" style={{ fontSize: '13.5px', fontWeight: 800, color: '#991B1B', marginBottom: '4px' }}>
                          {highPriorityIncident.jenisKejadian} di {highPriorityIncident.tkpAlamatTeks}
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#475569', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          <span>📍 {highPriorityIncident.tkpAlamatTeks}</span>
                          <span>•</span>
                          <span>Pelapor: {highPriorityIncident.pelaporNama} ({highPriorityIncident.pelaporHp})</span>
                          <span>•</span>
                          <span style={{ color: '#2563EB', fontWeight: 700 }}>
                            Status: {highPriorityIncident.status === 'BELUM_DITANGANI' ? 'Menunggu Disposisi Pawas' : highPriorityIncident.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                      <button
                        id="pimpinan-alert-btn-tindak"
                        type="button"
                        onClick={() => {
                          setSelectedValComplaint(highPriorityIncident);
                          openValidasiList('menunggu');
                        }}
                        style={{
                          background: '#153E75',
                          color: 'white',
                          border: 'none',
                          padding: '8px 14px',
                          borderRadius: '8px',
                          fontWeight: 700,
                          fontSize: '11.5px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 2px 8px rgba(21,62,117,0.25)',
                        }}
                      >
                        <span>👨‍✈️ Tindak Lanjut Insiden</span> ➔
                      </button>
                      <button
                        type="button"
                        onClick={() => switchTab('view-peta')}
                        style={{
                          background: 'white',
                          color: '#1E293B',
                          border: '1px solid #CBD5E1',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          fontWeight: 700,
                          fontSize: '11.5px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <span>🗺️ Cek Lokasi di Peta</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 2-Column Grid Layout */}
              <div className="beranda-grid" style={{ display: 'flex', gap: '16px', padding: '0 20px 20px', alignItems: 'flex-start' }}>

                {/* Left Column */}
                <div id="beranda-col-left" style={{ flex: 1, minWidth: 0 }}>

                  {/* Peta Card */}
                  <div className="card-panel" id="card-map-beranda" style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexDirection: 'column', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div className="card-title" style={{ fontSize: '14px', fontWeight: 800, color: '#1E293B', marginBottom: '8px' }}>
                        Peta Rute Patroli
                      </div>

                      {/* Fleet Badges Khusus Pimpinan */}
                      <div id="pimpinan-map-badges" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <span
                          onClick={() => setFocusedFleet('samapta')}
                          style={{
                            background: focusedFleet === 'samapta' ? '#BFDBFE' : '#EFF6FF',
                            color: '#1D4ED8',
                            fontSize: '10.5px',
                            fontWeight: 700,
                            padding: '4px 9px',
                            borderRadius: '6px',
                            border: '1px solid #BFDBFE',
                            cursor: 'pointer',
                            userSelect: 'none',
                          }}
                          title="Klik untuk fokus Unit Patroli Samapta R-4"
                        >
                          🚔 {fleetUnits.filter((u) => u.category === 'samapta' || (u.key && u.key.toLowerCase().includes('samapta'))).length} Samapta R-4
                        </span>
                        <span
                          onClick={() => setFocusedFleet('perintis')}
                          style={{
                            background: focusedFleet === 'perintis' ? '#FDE68A' : '#FEF3C7',
                            color: '#B45309',
                            fontSize: '10.5px',
                            fontWeight: 700,
                            padding: '4px 9px',
                            borderRadius: '6px',
                            border: '1px solid #FDE68A',
                            cursor: 'pointer',
                            userSelect: 'none',
                          }}
                          title="Klik untuk fokus Tim Perintis Presisi R-2"
                        >
                          🏍️ {fleetUnits.filter((u) => u.category === 'perintis' || (u.key && u.key.toLowerCase().includes('perintis'))).length} Perintis R-2
                        </span>
                        <span
                          onClick={() => setFocusedFleet('lantas')}
                          style={{
                            background: focusedFleet === 'lantas' ? '#DCFCE7' : '#F0FDF4',
                            color: '#15803D',
                            fontSize: '10.5px',
                            fontWeight: 700,
                            padding: '4px 9px',
                            borderRadius: '6px',
                            border: '1px solid #BBF7D0',
                            cursor: 'pointer',
                            userSelect: 'none',
                          }}
                          title="Klik untuk fokus Patroli Turjawali Satlantas"
                        >
                          🚓 {fleetUnits.filter((u) => u.category === 'lantas' || (u.key && (u.key.toLowerCase().includes('lantas') || u.key.toLowerCase().includes('pjr')))).length} Lantas R-4
                        </span>
                        <span
                          onClick={() => setFocusedFleet('hotspot')}
                          id="badge-hotspot-count"
                          style={{
                            background: focusedFleet === 'hotspot' ? '#FEE2E2' : '#FEF2F2',
                            color: '#DC2626',
                            fontSize: '10.5px',
                            fontWeight: 700,
                            padding: '4px 9px',
                            borderRadius: '6px',
                            border: '1px solid #FECACA',
                            cursor: 'pointer',
                            userSelect: 'none',
                          }}
                          title="Klik untuk fokus Titik Rawan Kejahatan"
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
                          style={{
                            background: showTraffic ? '#ECFDF5' : '#F1F5F9',
                            color: showTraffic ? '#047857' : '#64748B',
                            fontSize: '10.5px',
                            fontWeight: 800,
                            padding: '4px 9px',
                            borderRadius: '6px',
                            border: '1px solid #A7F3D0',
                            cursor: 'pointer',
                            userSelect: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                          title="Klik untuk toggle Live Traffic"
                        >
                          🚦 Live Traffic: {showTraffic ? 'ON' : 'OFF'}
                        </span>
                      </div>
                    </div>

                    <div style={{ position: 'relative', width: '100%', height: '350px', borderRadius: '8px', overflow: 'hidden' }}>
                      <SimapresLeafletMap
                        interactive={true}
                        fleetUnits={fleetUnits}
                        hotspots={hotspots}
                        policeOffices={policeOffices}
                        centerLat={-6.2443}
                        centerLng={106.8078}
                        onUnitClick={(unit: any) => setMapUnitDetail(unit)}
                      />

                      {/* Floating Map Unit Detail Modal */}
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
                            boxShadow: '0 12px 30px rgba(0,0,0,0.25)',
                            border: '1px solid #CBD5E1',
                            padding: '15px 17px',
                            width: '320px',
                            maxWidth: 'calc(100% - 70px)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                            <div style={{ fontSize: '14px', fontWeight: 800, color: '#0284C7', display: 'flex', alignItems: 'center', gap: '7px' }}>
                              <span>🚔</span>
                              <span>{mapUnitDetail.title || mapUnitDetail.unitName}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setMapUnitDetail(null)}
                              style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '16px', fontWeight: 700, cursor: 'pointer' }}
                            >
                              ✕
                            </button>
                          </div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B', marginTop: '4px' }}>
                            {mapUnitDetail.petugas || mapUnitDetail.nama}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                            {mapUnitDetail.sub || mapUnitDetail.kendaraan}
                          </div>
                          <div style={{ borderTop: '1px solid #E2E8F0', margin: '8px 0' }} />
                          <div style={{ fontSize: '12px', fontWeight: 800, color: '#10B981' }}>
                            Status: {mapUnitDetail.status || 'SIAGA'}
                          </div>
                          <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>
                            Tugas: {mapUnitDetail.tugas || 'Patroli Rute Sektor Presisi'}
                          </div>
                        </div>
                      )}

                      {/* Floating Mini Legend */}
                      <div
                        className="map-legend-mini"
                        style={{
                          position: 'absolute',
                          bottom: '10px',
                          left: '10px',
                          zIndex: 999,
                          background: 'white',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 700,
                          boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                        }}
                      >
                        <span style={{ color: '#EF4444', fontSize: '14px' }}>●</span> Titik Rawan
                      </div>
                    </div>
                  </div>

                  {/* Rekapitulasi Hari Ini */}
                  <div id="rekap-card" className="card-panel" style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
                    <div className="card-title" style={{ fontSize: '14px', fontWeight: 800, color: '#1E293B', marginBottom: '12px' }}>
                      Rekapitulasi Hari Ini
                    </div>

                    <div className="rekap-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                      <div
                        className="rekap-box"
                        onClick={() => openValidasiList('semua')}
                        style={{ cursor: 'pointer', background: 'white', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px', textAlign: 'center' }}
                      >
                        <div className="rekap-label" style={{ fontSize: '10px', fontWeight: 800, color: '#64748B' }}>TOTAL LAPORAN</div>
                        <div className="rekap-val" style={{ fontSize: '20px', fontWeight: 900, color: '#0F172A', marginTop: '2px' }}>{totalLaporan}</div>
                      </div>

                      <div
                        className="rekap-box"
                        onClick={() => openValidasiList('menunggu')}
                        style={{ cursor: 'pointer', background: '#fffdfa', border: '1px solid #f0e1c9', borderRadius: '8px', padding: '10px', textAlign: 'center' }}
                      >
                        <div className="rekap-label" style={{ fontSize: '10px', fontWeight: 800, color: '#D97706' }}>MENUNGGU TINDAKAN</div>
                        <div className="rekap-val orange" style={{ fontSize: '20px', fontWeight: 900, color: '#D97706', marginTop: '2px' }}>{menungguCount}</div>
                      </div>

                      <div
                        className="rekap-box"
                        onClick={() => openValidasiList('ditolak')}
                        style={{ cursor: 'pointer', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '10px', textAlign: 'center' }}
                      >
                        <div className="rekap-label" style={{ fontSize: '10px', fontWeight: 800, color: '#DC2626' }}>DITOLAK</div>
                        <div className="rekap-val red" style={{ fontSize: '20px', fontWeight: 900, color: '#DC2626', marginTop: '2px' }}>{ditolakCount}</div>
                      </div>

                      <div
                        className="rekap-box"
                        onClick={() => openValidasiList('diproses')}
                        style={{ cursor: 'pointer', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px', padding: '10px', textAlign: 'center' }}
                      >
                        <div className="rekap-label" style={{ fontSize: '10px', fontWeight: 800, color: '#1D4ED8' }}>SEDANG DITANGANI</div>
                        <div className="rekap-val primary" style={{ fontSize: '20px', fontWeight: 900, color: '#1D4ED8', marginTop: '2px' }}>{diprosesCount}</div>
                      </div>

                      <div
                        className="rekap-box"
                        onClick={() => openValidasiList('menunggu_pengesahan')}
                        style={{ cursor: 'pointer', background: '#EDE9FE', border: '1px solid #DDD6FE', borderRadius: '8px', padding: '10px', textAlign: 'center' }}
                      >
                        <div className="rekap-label" style={{ fontSize: '10px', fontWeight: 800, color: '#7C3AED' }}>PENGESAHAN PAWAS</div>
                        <div className="rekap-val purple" style={{ fontSize: '20px', fontWeight: 900, color: '#7C3AED', marginTop: '2px' }}>{pengesahanCount}</div>
                      </div>

                      <div
                        className="rekap-box"
                        onClick={() => openValidasiList('selesai')}
                        style={{ cursor: 'pointer', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', padding: '10px', textAlign: 'center' }}
                      >
                        <div className="rekap-label" style={{ fontSize: '10px', fontWeight: 800, color: '#15803D' }}>SELESAI</div>
                        <div className="rekap-val secondary" style={{ fontSize: '20px', fontWeight: 900, color: '#15803D', marginTop: '2px' }}>{selesaiCount}</div>
                      </div>
                    </div>

                    {/* Breakdown 4 Saluran Platform */}
                    <div
                      id="rekap-platform-breakdown"
                      style={{
                        marginTop: '12px',
                        padding: '10px 12px',
                        background: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        borderRadius: '8px',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                        gap: '8px',
                        fontSize: '11px',
                      }}
                    >
                      <div
                        style={{ background: 'white', border: '1px solid #FECACA', borderRadius: '6px', padding: '6px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                        onClick={() => openValidasiWithPlatform('sos')}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 800, color: '#DC2626' }}>
                          <span>🚨</span> SOS PANIC
                        </span>
                        <span style={{ fontWeight: 800, color: '#DC2626', fontSize: '12px' }}>{sosCount}</span>
                      </div>

                      <div
                        style={{ background: 'white', border: '1px solid #BAE6FD', borderRadius: '6px', padding: '6px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                        onClick={() => openValidasiWithPlatform('warga')}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 800, color: '#0284C7' }}>
                          <span>📱</span> WARGA
                        </span>
                        <span style={{ fontWeight: 800, color: '#0284C7', fontSize: '12px' }}>{wargaCount}</span>
                      </div>

                      <div
                        style={{ background: 'white', border: '1px solid #BFDBFE', borderRadius: '6px', padding: '6px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                        onClick={() => openValidasiWithPlatform('layanan110')}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 800, color: '#1D4ED8' }}>
                          <span>📞</span> 110 HOTLINE
                        </span>
                        <span style={{ fontWeight: 800, color: '#1D4ED8', fontSize: '12px' }}>{hotline110Count}</span>
                      </div>

                      <div
                        style={{ background: 'white', border: '1px solid #FDE68A', borderRadius: '6px', padding: '6px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                        onClick={() => openValidasiWithPlatform('personel')}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 800, color: '#92400E' }}>
                          <span>👮</span> PERSONEL
                        </span>
                        <span style={{ fontWeight: 800, color: '#92400E', fontSize: '12px' }}>{personelCount}</span>
                      </div>
                    </div>
                  </div>

                  {/* Feed Komando & Situasi Lapangan (Real-Time) */}
                  <div className="card-panel" style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <div>
                        <div className="card-title" style={{ fontSize: '14px', fontWeight: 800, color: '#1E293B', marginBottom: '2px' }}>
                          FEED KOMANDO &amp; SITUASI LAPANGAN (REAL-TIME)
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#64748B' }}>
                          Pantauan eskalasi insiden darurat, panggilan 110, dan status penanganan kasus di wilayah hukum Polres
                        </div>
                      </div>
                    </div>

                    <div className="timeline" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {allRecentComplaints.slice(0, 3).map((inc) => {
                        const timeStr = inc.createdAt ? new Date(inc.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB' : 'Hari ini';
                        const isSelesai = inc.status === 'SELESAI';
                        const isMeluncur = inc.status === 'MENUJU_TKP';
                        const isPenanganan = inc.status === 'PENANGANAN_TKP';
                        const isDarurat = inc.urgensi === 'DARURAT' || inc.urgensi === 'PRIORITAS_TINGGI';

                        const borderColor = isSelesai ? '#10B981' : isMeluncur ? '#3B82F6' : isPenanganan ? '#8B5CF6' : isDarurat ? '#EF4444' : '#F59E0B';
                        const badgeBg = isSelesai ? '#F0FDF4' : isMeluncur ? '#EFF6FF' : isPenanganan ? '#F5F3FF' : isDarurat ? '#FEF2F2' : '#FFFBEB';
                        const badgeColor = isSelesai ? '#16A34A' : isMeluncur ? '#1D4ED8' : isPenanganan ? '#6D28D9' : isDarurat ? '#DC2626' : '#D97706';
                        const badgeBorder = isSelesai ? '#BBF7D0' : isMeluncur ? '#BFDBFE' : isPenanganan ? '#DDD6FE' : isDarurat ? '#FECACA' : '#FDE68A';

                        let badgeText = '⏳ MENUNGGU';
                        if (isSelesai) badgeText = `✓ TUNTAS ${inc.citizenRating ? `(⭐ ${inc.citizenRating}.0)` : ''}`;
                        else if (isMeluncur) badgeText = '⚡ MELUNCUR';
                        else if (isPenanganan) badgeText = '● TINDAKAN TKP';
                        else if (isDarurat) badgeText = '🚨 DARURAT';

                        let descText = inc.ringkasanKeterangan;
                        if (isSelesai) {
                          descText = inc.citizenReview || (inc.assignedOfficer ? `${inc.assignedOfficer.rankPangkat} ${inc.assignedOfficer.namaLengkap} telah menuntaskan penanganan dan menyerahkan laporan resmi.` : 'Kasus telah ditangani dan dinyatakan tuntas.');
                        } else if (isMeluncur) {
                          descText = `${inc.assignedOfficer?.assignedPatrolVehicle || 'Unit Samapta Presisi'} (${inc.assignedOfficer ? `${inc.assignedOfficer.rankPangkat} ${inc.assignedOfficer.namaLengkap}` : 'Personel'}) meluncur ke TKP. Estimasi tiba 3-5 menit.`;
                        } else if (isPenanganan) {
                          descText = `Personel berada di TKP melaksanakan tindakan kepolisian dan pengamanan perimeter.`;
                        }

                        return (
                          <div key={inc.id} className="tl-item" style={{ borderLeft: `3px solid ${borderColor}`, paddingLeft: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                              <div>
                                <div style={{ fontWeight: 800, fontSize: '13px', color: '#1E293B' }}>
                                  {timeStr} - {inc.jenisKejadian} ({inc.tkpAlamatTeks?.split(',')[0] || 'Wilayah Hukum'})
                                </div>
                                <div style={{ fontSize: '11.5px', color: '#475569', marginTop: '2px' }}>
                                  {descText}
                                </div>
                              </div>
                              <span style={{ fontSize: '10px', fontWeight: 800, background: badgeBg, color: badgeColor, padding: '3px 8px', borderRadius: '6px', border: `1px solid ${badgeBorder}`, whiteSpace: 'nowrap' }}>
                                {badgeText}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Right Column: Executive Command Sidebar */}
                <div id="beranda-col-right" style={{ width: '330px', flexShrink: 0 }}>
                  <div id="pimpinan-executive-sidebar">

                    {/* Widget 1: SLA Waktu Tanggap Patroli */}
                    <div
                      id="card-pimpinan-sla"
                      className="card-panel"
                      onClick={() => setShowSlaModal(true)}
                      style={{
                        padding: '16px',
                        marginBottom: '16px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        border: '1px solid #E2E8F0',
                        borderRadius: '12px',
                        background: 'white',
                      }}
                      title="Klik untuk melihat audit rincian waktu tanggap seluruh kasus"
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div className="card-title" style={{ marginBottom: 0, fontSize: '12.5px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>WAKTU TANGGAP PATROLI</span>
                          <span style={{ fontSize: '9.5px', fontWeight: 700, color: '#2563EB', background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '1px 6px', borderRadius: '10px' }}>
                            🔍 DETAIL
                          </span>
                        </div>
                        <span style={{ background: '#F0FDF4', color: '#15803D', fontWeight: 800, fontSize: '10px', padding: '2px 8px', borderRadius: '6px', border: '1px solid #BBF7D0' }}>
                          TARGET &lt; 10 MENIT
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '14px' }}>
                        <div style={{ width: '75px', height: '75px', position: 'relative', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#EFF6FF', borderRadius: '50%', border: '4px solid #1D4ED8' }}>
                          <span style={{ fontSize: '18px', fontWeight: 900, color: '#153E75', lineHeight: 1 }}>{completedWithTime.length > 0 ? avgResponseTime : '-'}</span>
                          <span style={{ fontSize: '9px', color: '#64748B', fontWeight: 700 }}>{completedWithTime.length > 0 ? 'MENIT' : 'STANDBY'}</span>
                        </div>
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 800, color: '#15803D', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span>✓</span> {completedWithTime.length > 0 ? `Tepat Waktu: ${onTimeRate}%` : 'Standar Respon Siaga Presisi 110'}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748B', lineHeight: 1.4, marginTop: '2px' }}>
                            {completedWithTime.length > 0 ? 'Rata-rata kecepatan tiba unit patroli di TKP sejak laporan diterima.' : 'Waktu respon tanggap dihitung otomatis saat kasus selesai ditangani.'}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', background: '#F8FAFC', padding: '8px', borderRadius: '8px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                        <div>
                          <div style={{ fontSize: '9.5px', color: '#64748B', fontWeight: 700 }}>&lt; 5 Menit</div>
                          <div style={{ fontSize: '12px', fontWeight: 800, color: '#16A34A' }}>
                            {fastCount} ({completedWithTime.length > 0 ? Math.round((fastCount / completedWithTime.length) * 100) : 0}%)
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '9.5px', color: '#64748B', fontWeight: 700 }}>5-10 Menit</div>
                          <div style={{ fontSize: '12px', fontWeight: 800, color: '#2563EB' }}>
                            {mediumCount} ({completedWithTime.length > 0 ? Math.round((mediumCount / completedWithTime.length) * 100) : 0}%)
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '9.5px', color: '#64748B', fontWeight: 700 }}>&gt; 10 Menit</div>
                          <div style={{ fontSize: '12px', fontWeight: 800, color: '#DC2626' }}>
                            {slowCount} ({completedWithTime.length > 0 ? Math.round((slowCount / completedWithTime.length) * 100) : 0}%)
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Widget 2: Kuat Pers & Kendaraan Dinas */}
                    <div
                      id="card-pimpinan-personel"
                      className="card-panel"
                      onClick={() => setShowKuatPersModal(true)}
                      style={{
                        padding: '16px',
                        marginBottom: '16px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        border: '1px solid #E2E8F0',
                        borderRadius: '12px',
                        background: 'white',
                      }}
                      title="Klik untuk melihat gelar kekuatan riil personel & armada patroli"
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div className="card-title" style={{ marginBottom: 0, fontSize: '12.5px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>KUAT PERSONEL &amp; KENDARAAN</span>
                          <span style={{ fontSize: '9.5px', fontWeight: 700, color: '#2563EB', background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '1px 6px', borderRadius: '10px' }}>
                            🔍 DETAIL
                          </span>
                        </div>
                        <span style={{ background: '#EFF6FF', color: '#1D4ED8', fontWeight: 800, fontSize: '10px', padding: '2px 8px', borderRadius: '6px', border: '1px solid #BFDBFE' }}>
                          TOTAL {registeredUnits.length} PERSONEL
                        </span>
                      </div>

                      {(() => {
                        const meluncurCount = registeredUnits.filter(
                          (u) => u.dutyStatus === 'DINAS_PATROLI' || u.dutyStatus === 'MENUJU_TKP'
                        ).length;
                        const cadanganCount = registeredUnits.filter(
                          (u) => u.dutyStatus === 'CADANGAN' || u.dutyStatus === 'LEPAS_DINAS'
                        ).length;
                        const siagaCount = Math.max(0, registeredUnits.length - meluncurCount - cadanganCount);

                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F0FDF4', padding: '8px 10px', borderRadius: '6px', borderLeft: '3px solid #16A34A' }}>
                              <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#166534' }}>🟢 Siaga di Mako Polres</span>
                              <span style={{ fontSize: '12px', fontWeight: 800, color: '#166534' }}>{siagaCount} Pers</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#EFF6FF', padding: '8px 10px', borderRadius: '6px', borderLeft: '3px solid #2563EB' }}>
                              <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#1E40AF' }}>🔵 Meluncur / Di TKP</span>
                              <span style={{ fontSize: '12px', fontWeight: 800, color: '#1E40AF' }}>{meluncurCount} Pers</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFFBEB', padding: '8px 10px', borderRadius: '6px', borderLeft: '3px solid #D97706' }}>
                              <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#92400E' }}>🟡 Cadangan Siaga Piket</span>
                              <span style={{ fontSize: '12px', fontWeight: 800, color: '#92400E' }}>{cadanganCount} Pers</span>
                            </div>
                          </div>
                        );
                      })()}

                      <div style={{ borderTop: '1px dashed #CBD5E1', paddingTop: '10px' }}>
                        <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                          Kendaraan Dinas Patroli Tergelar:
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          <span style={{ fontSize: '10.5px', fontWeight: 700, background: '#F1F5F9', color: '#334155', padding: '3px 8px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
                            🚔 Samapta R-4: {fleetUnits.filter((u) => u.category === 'samapta' || (u.key && u.key.toLowerCase().includes('samapta'))).length} Unit
                          </span>
                          <span style={{ fontSize: '10.5px', fontWeight: 700, background: '#F1F5F9', color: '#334155', padding: '3px 8px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
                            🏍️ Perintis R-2: {fleetUnits.filter((u) => u.category === 'perintis' || (u.key && u.key.toLowerCase().includes('perintis'))).length} Unit
                          </span>
                          <span style={{ fontSize: '10.5px', fontWeight: 700, background: '#F1F5F9', color: '#334155', padding: '3px 8px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
                            🚓 Lantas R-4: {fleetUnits.filter((u) => u.category === 'lantas' || (u.key && (u.key.toLowerCase().includes('lantas') || u.key.toLowerCase().includes('pjr')))).length} Unit
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Widget 3: Indeks Kepuasan Masyarakat (IKM) */}
                    <div
                      id="card-pimpinan-ikm"
                      className="card-panel"
                      onClick={() => setShowIkmModal(true)}
                      style={{
                        padding: '16px',
                        marginBottom: '16px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        border: '1px solid #E2E8F0',
                        borderRadius: '12px',
                        background: 'white',
                      }}
                      title="Klik untuk melihat audit transparansi ulasan dan voting warga"
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <div className="card-title" style={{ marginBottom: 0, fontSize: '12.5px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>INDEKS KEPUASAN WARGA (IKM)</span>
                          <span style={{ fontSize: '9.5px', fontWeight: 700, color: '#2563EB', background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '1px 6px', borderRadius: '10px' }}>
                            🔍 DETAIL
                          </span>
                        </div>
                        <span style={{ color: '#F59E0B', fontWeight: 800, fontSize: '12px' }}>⭐⭐⭐⭐⭐</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <div>
                          <div style={{ fontSize: '24px', fontWeight: 900, color: '#1E293B', lineHeight: 1 }}>
                            {satisfactionRating} <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>/ 5.0</span>
                          </div>
                          <div style={{ fontSize: '11px', color: '#16A34A', fontWeight: 700, marginTop: '2px' }}>
                            {satisfactionPercent}% Sangat Puas
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '13px', fontWeight: 800, color: '#153E75' }}>
                            {allRecentComplaints.filter(c => c.citizenRating).length} Ulasan
                          </div>
                          <div style={{ fontSize: '10px', color: '#64748B' }}>Survei Warga Terverifikasi</div>
                        </div>
                      </div>

                      {(() => {
                        const topReview = allRecentComplaints.find(c => c.citizenReview);
                        return topReview ? (
                          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px', fontSize: '11px', color: '#475569', lineHeight: 1.4, fontStyle: 'italic' }}>
                            "{topReview.citizenReview}"
                            <div style={{ fontStyle: 'normal', fontWeight: 700, color: '#1E293B', marginTop: '4px', fontSize: '10px', textAlign: 'right' }}>
                              — {topReview.pelaporNama || 'Warga'} ({topReview.nomorTiket})
                            </div>
                          </div>
                        ) : (
                          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px', fontSize: '11px', color: '#64748B', textAlign: 'center' }}>
                            Belum ada ulasan warga di database
                          </div>
                        );
                      })()}
                    </div>

                    {/* Widget 4: Log Aktivitas Personel Real-Time */}
                    <div className="card-panel" style={{ padding: '16px', background: 'white', border: '1px solid #E2E8F0', borderRadius: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div>
                          <div className="card-title" style={{ marginBottom: '2px', fontSize: '12.5px', fontWeight: 800 }}>
                            AKTIVITAS PERSONEL TERBARU
                          </div>
                          <div style={{ fontSize: '10.5px', color: '#64748B' }}>
                            Log pergerakan regu patroli di lapangan
                          </div>
                        </div>
                        <span style={{ background: '#EFF6FF', color: '#1D4ED8', fontWeight: 800, fontSize: '9.5px', padding: '2px 7px', borderRadius: '4px', border: '1px solid #BFDBFE' }}>
                          ● REAL-TIME
                        </span>
                      </div>

                      <div className="timeline" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                        <div style={{ fontSize: '11px', color: '#334155', borderLeft: '2px solid #2563EB', paddingLeft: '8px' }}>
                          <strong>09:30 WIB</strong> - Patroli Samapta Unit 110-A menyelesaikan rute beat pasar &amp; perbankan.
                        </div>
                        <div style={{ fontSize: '11px', color: '#334155', borderLeft: '2px solid #10B981', paddingLeft: '8px' }}>
                          <strong>10:15 WIB</strong> - Turjawali Satlantas stand by pos simpang protokol mengurai kemacetan.
                        </div>
                        <div style={{ fontSize: '11px', color: '#334155', borderLeft: '2px solid #F59E0B', paddingLeft: '8px' }}>
                          <strong>11:20 WIB</strong> - Tim Perintis Presisi patroli dialogis di pemukiman padat warga.
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            </section>
          )}

          {/* ======================================================== */}
          {/* SCREEN 2: PETA FULLSCREEN (TACTICAL MAP)                 */}
          {/* ======================================================== */}
          {activeTab === 'view-peta' && (
            <section id="view-peta" className="view active" style={{ position: 'relative', height: 'calc(100vh - 130px)', width: '100%' }}>
              {/* Floating Header */}
              <div
                className="floating-header"
                style={{
                  position: 'absolute',
                  top: '16px',
                  left: '16px',
                  zIndex: 999,
                  background: 'rgba(21,62,117,0.92)',
                  color: 'white',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  fontWeight: 800,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                }}
              >
                <div style={{ fontSize: '13px', letterSpacing: '0.5px' }}>PETA RUTE PATROLI PRESI 110</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label
                    id="container-toggle-personel"
                    style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', background: 'rgba(255,255,255,0.2)', padding: '6px 10px', borderRadius: '4px' }}
                  >
                    <input
                      type="checkbox"
                      checked={showOtherOfficers}
                      onChange={(e) => setShowOtherOfficers(e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    Lihat Sebaran Personel Lain
                  </label>
                  <label
                    id="container-toggle-traffic"
                    style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', background: 'rgba(16,185,129,0.3)', border: '1px solid rgba(16,185,129,0.4)', padding: '6px 10px', borderRadius: '4px' }}
                  >
                    <input
                      type="checkbox"
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
                    }}
                  >
                    <span>⚠️</span> Kelola Titik Rawan (CRUD)
                  </button>
                </div>
              </div>

              {/* Map Canvas Fullscreen */}
              <div style={{ width: '100%', height: '100%' }}>
                <SimapresLeafletMap
                  interactive={true}
                  fleetUnits={showOtherOfficers ? fleetUnits : []}
                  hotspots={hotspots}
                  policeOffices={policeOffices}
                  centerLat={-6.2443}
                  centerLng={106.8078}
                  onUnitClick={(unit: any) => setMapUnitDetail(unit)}
                />
              </div>

              {/* Floating Unit Detail Modal Fullscreen */}
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
                    boxShadow: '0 12px 30px rgba(0,0,0,0.25)',
                    border: '1px solid #CBD5E1',
                    padding: '15px 17px',
                    width: '340px',
                    maxWidth: 'calc(100% - 32px)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#0284C7', display: 'flex', alignItems: 'center', gap: '7px' }}>
                      <span>🚔</span>
                      <span>{mapUnitDetail.title || mapUnitDetail.unitName}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMapUnitDetail(null)}
                      style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '16px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      ✕
                    </button>
                  </div>
                  <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#1E293B', lineHeight: 1.3, marginTop: '4px' }}>
                    {mapUnitDetail.petugas || mapUnitDetail.nama}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
                    {mapUnitDetail.sub || mapUnitDetail.kendaraan}
                  </div>
                  <div style={{ borderTop: '1px solid #E2E8F0', margin: '10px 0 8px 0' }} />
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#10B981' }}>
                    Status: {mapUnitDetail.status || 'SIAGA'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#475569', marginTop: '3px' }}>
                    Tugas: {mapUnitDetail.tugas || 'Patroli Rute Sektor Presisi'}
                  </div>
                </div>
              )}

              {/* Floating Panel Rute & Navigasi Respon Cepat */}
              <div
                id="panel-navigasi-rute-tkp"
                style={{
                  position: 'absolute',
                  bottom: '20px',
                  left: '16px',
                  right: '16px',
                  zIndex: 9999,
                  maxWidth: '440px',
                  margin: '0 auto',
                  background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                  color: 'white',
                  borderRadius: '14px',
                  boxShadow: '0 12px 30px rgba(0,0,0,0.45)',
                  border: '1.5px solid #334155',
                  padding: '14px 16px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ display: 'inline-block', width: '10px', height: '10px', background: '#10B981', borderRadius: '50%', boxShadow: '0 0 10px #10B981' }} />
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#38BDF8', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                      NAVIGASI MENUJU TKP
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById('panel-navigasi-rute-tkp');
                      if (el) el.style.display = 'none';
                    }}
                    style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#94A3B8', fontSize: '14px', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer' }}
                  >
                    ✕
                  </button>
                </div>

                {highPriorityIncident && (
                  <>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#FFFFFF', marginBottom: '4px' }}>
                      {highPriorityIncident.jenisKejadian} - {highPriorityIncident.tkpAlamatTeks}
                    </div>
                    <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span>📍</span> {highPriorityIncident.tkpAlamatTeks}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                      <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 10px' }}>
                        <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 700 }}>STATUS RESPON</div>
                        <div style={{ fontSize: '14px', fontWeight: 900, color: '#10B981', marginTop: '2px' }}>
                          {highPriorityIncident.status === 'BELUM_DITANGANI' ? 'Menunggu Disposisi' : highPriorityIncident.status}
                        </div>
                        <div style={{ fontSize: '10.5px', color: '#94A3B8' }}>Urgensi: {highPriorityIncident.urgensi || 'NORMAL'}</div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 10px' }}>
                        <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 700 }}>SALURAN PENGADUAN</div>
                        <div style={{ fontSize: '12px', fontWeight: 800, color: '#38BDF8', marginTop: '2px' }}>
                          {highPriorityIncident.platformRel?.label || highPriorityIncident.platformKey || 'Layanan 110'}
                        </div>
                        <div style={{ fontSize: '10px', color: '#A7F3D0' }}>Pelapor: {highPriorityIncident.pelaporNama}</div>
                      </div>
                    </div>

                    <div style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', padding: '8px 10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '20px' }}>📢</span>
                      <div style={{ fontSize: '11.5px', lineHeight: 1.4, color: '#E2E8F0' }}>
                        {highPriorityIncident.ringkasanKeterangan || 'Petugas piket siaga bersiap menerima komando arahan taktis lapangan.'}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Map Legend */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '16px',
                  left: '16px',
                  zIndex: 999,
                  background: 'white',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                }}
              >
                <span style={{ color: '#EF4444', fontSize: '16px' }}>●</span> Titik Rawan
              </div>
            </section>
          )}

          {/* ======================================================== */}
          {/* SCREEN 3: BUAT LOG (+) (INPUT LOG KEGIATAN & MUTASI)     */}
          {/* ======================================================== */}
          {activeTab === 'view-log' && (
            <section id="view-log" className="view active" style={{ padding: '20px' }}>
              <h2 className="page-title" style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px' }}>
                Input Log Kegiatan
              </h2>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                  Waktu Mulai &amp; Rentang Jam
                </label>
                <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setShowTimePickerModal(true)}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Waktu Mulai"
                    value={logWaktuMulai}
                    style={{ cursor: 'pointer', paddingRight: '40px' }}
                    readOnly
                  />
                  <span
                    id="log-calendar-icon"
                    style={{ position: 'absolute', right: '14px', top: '12px', fontSize: '16px', cursor: 'pointer' }}
                  >
                    📅
                  </span>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                  Sektor Patroli
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Sektor Patroli"
                  value={logSektor}
                  onChange={(e) => setLogSektor(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                  Jenis Kegiatan
                </label>
                <select
                  className="form-control"
                  value={logJenis}
                  onChange={(e) => setLogJenis(e.target.value as any)}
                >
                  <option value="">-- Pilih Jenis Kegiatan --</option>
                  {dbGiats.map((g) => (
                    <option key={g.id || g.key} value={g.key}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                  Deskripsi Kejadian
                </label>
                <textarea
                  className="form-control"
                  rows={4}
                  value={logDeskripsi}
                  onChange={(e) => setLogDeskripsi(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                  Lampiran Foto Bukti
                </label>
                <input
                  type="file"
                  id="log-file-input"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const url = URL.createObjectURL(file);
                      setLogFotoPreview(url);
                    }
                  }}
                />
                <button
                  type="button"
                  className="btn-blue"
                  onClick={() => document.getElementById('log-file-input')?.click()}
                  style={{ marginBottom: '10px', background: '#153E75', color: 'white', padding: '8px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                >
                  📸 Pilih Foto dari Perangkat
                </button>
                {logFotoPreview ? (
                  <div style={{ width: '200px', height: '150px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #CBD5E1' }}>
                    <img
                      src={logFotoPreview}
                      alt="Preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                ) : (
                  <div style={{ width: '200px', height: '70px', borderRadius: '8px', border: '1px dashed #CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: '11px' }}>
                    Belum ada foto dipilih
                  </div>
                )}
              </div>

              <button
                type="button"
                className="btn-blue"
                onClick={handleSimpanLogKegiatan}
                disabled={loading}
                style={{
                  marginTop: '16px',
                  background: '#10B981',
                  color: 'white',
                  border: 'none',
                  padding: '12px 20px',
                  borderRadius: '8px',
                  fontWeight: 800,
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <span>💾</span> Simpan Log Kegiatan
              </button>
            </section>
          )}

          {/* ======================================================== */}
          {/* SCREEN 4: SENTRA VALIDASI & PENGESAHAN (view-validasi)  */}
          {/* ======================================================== */}
          {activeTab === 'view-validasi' && (
            <section id="view-validasi" className="view active" style={{ paddingBottom: '30px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '16px 16px 8px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 className="page-title" style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#1E293B' }}>
                      Konsol Monitoring &amp; Komando Operasional
                    </h2>
                    <span style={{ fontSize: '10px', fontWeight: 800, background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', padding: '2px 8px', borderRadius: '12px' }}>
                      SUPERVISI PIKET
                    </span>
                  </div>
                  <div className="page-subtitle" style={{ margin: '2px 0 0', color: '#64748B', fontSize: '12px' }}>
                    Supervisi Operasional: Validasi, Disposisi Satuan Lapangan &amp; Otorisasi Penutupan Kasus
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#1E40AF', background: '#EFF6FF', padding: '6px 12px', borderRadius: '6px', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span>👮</span> <span>Piket Operasi Siaga 24 Jam</span>
                  </div>
                  <div
                    onClick={() => switchTab('view-beranda')}
                    style={{ fontSize: '12px', fontWeight: 700, color: '#153E75', cursor: 'pointer', background: '#F1F5F9', padding: '6px 12px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <span>🏠</span> Beranda
                  </div>
                </div>
              </div>

              {/* Status Filter Tabs (Dynamically Generated from Database dbStatuses) */}
              <div className="val-filter-tabs" style={{ display: 'flex', gap: '6px', margin: '8px 16px', overflowX: 'auto', paddingBottom: '4px' }}>
                {[
                  { key: 'semua', label: 'Semua', count: tabCountSemua, badgeBg: '#F1F5F9', badgeColor: '#475569' },
                  ...(dbStatuses.length > 0
                    ? dbStatuses.map((st: any) => {
                        const icon =
                          st.key === 'MENUNGGU' ? '⏳ ' :
                          st.key === 'DISPOSISI' ? '📋 ' :
                          st.key === 'MENUJU_TKP' ? '🚔 ' :
                          st.key === 'TIBA_DI_TKP' ? '📍 ' :
                          st.key === 'MENUNGGU_PENGESAHAN' ? '📝 ' :
                          st.key === 'SELESAI' ? '✓ ' :
                          st.key === 'DITOLAK' ? '✕ ' : '';
                        return {
                          key: st.key.toLowerCase(),
                          label: `${icon}${st.label}`,
                          count: logsForStatusTabs.filter((c) => matchesStatus(c, st.key)).length,
                          badgeBg: st.badge_bg || '#EFF6FF',
                          badgeColor: st.badge_color || '#2563EB',
                        };
                      })
                    : [
                        { key: 'menunggu', label: '⏳ Menunggu', count: tabCountMenunggu, badgeBg: '#FFFBEB', badgeColor: '#F59E0B' },
                      ]),
                ].map((tab) => {
                  const isActive = valFilterStatus === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      id={`val-tab-${tab.key}`}
                      className={`val-tab-btn ${isActive ? 'active' : ''}`}
                      onClick={() => openValidasiList(tab.key, false)}
                      style={{
                        padding: '7px 14px',
                        borderRadius: '20px',
                        border: isActive ? '1px solid #153E75' : '1px solid #E2E8F0',
                        background: isActive ? '#153E75' : 'white',
                        color: isActive ? 'white' : '#1E293B',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: isActive ? '0 2px 6px rgba(21, 62, 117, 0.25)' : 'none',
                        transition: 'all 0.2s',
                      }}
                    >
                      {tab.label}{' '}
                      <span
                        className={`val-tab-badge ${tab.key}`}
                        style={{
                          background: isActive ? 'rgba(255, 255, 255, 0.25)' : tab.badgeBg,
                          color: isActive ? 'white' : tab.badgeColor,
                          padding: '2px 7px',
                          borderRadius: '10px',
                          fontSize: '11px',
                          fontWeight: 700,
                          marginLeft: '2px',
                        }}
                      >
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Secondary Filter Bar: Platform & Kategori 1:1 Prototype */}
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
                {/* Row 1: Platform Pelaporan */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>📡</span> PLATFORM:
                    </span>
                    {(dbPlatforms.length > 0 ? [
                      {
                        key: 'all',
                        label: 'Semua Platform',
                        count: platCountAll,
                        activeBg: '#0F172A',
                        activeText: 'white',
                        activeBorder: 'transparent',
                        inactiveBg: '#F1F5F9',
                        inactiveText: '#475569',
                        inactiveBorder: '#CBD5E1',
                        inactiveBadgeBg: '#E2E8F0',
                        inactiveBadgeColor: '#475569',
                      },
                      ...dbPlatforms.map((p) => {
                        const pKey = p.key;
                        const count = pKey === 'sos' ? platCountSos : pKey === 'warga' ? platCountWarga : pKey === 'layanan110' ? platCount110 : platCountPersonel;
                        return {
                          key: pKey,
                          label: p.label.startsWith(p.icon) ? p.label : `${p.icon} ${p.label}`,
                          count,
                          activeBg: p.active_bg,
                          activeText: p.active_text,
                          activeBorder: 'transparent',
                          inactiveBg: p.inactive_bg,
                          inactiveText: p.inactive_text,
                          inactiveBorder: p.inactive_border,
                          inactiveBadgeBg: p.inactive_bg,
                          inactiveBadgeColor: p.inactive_text,
                        };
                      })
                    ] : [
                      {
                        key: 'all',
                        label: 'Semua Platform',
                        count: platCountAll,
                        activeBg: '#0F172A',
                        activeText: 'white',
                        activeBorder: 'transparent',
                        inactiveBg: '#F1F5F9',
                        inactiveText: '#475569',
                        inactiveBorder: '#CBD5E1',
                        inactiveBadgeBg: '#E2E8F0',
                        inactiveBadgeColor: '#475569',
                      },
                      {
                        key: 'sos',
                        label: '🚨 SOS Panik',
                        count: platCountSos,
                        activeBg: '#DC2626',
                        activeText: 'white',
                        activeBorder: 'transparent',
                        inactiveBg: '#FEF2F2',
                        inactiveText: '#DC2626',
                        inactiveBorder: '#FECACA',
                        inactiveBadgeBg: '#FEE2E2',
                        inactiveBadgeColor: '#DC2626',
                      },
                      {
                        key: 'warga',
                        label: '📱 Portal Warga',
                        count: platCountWarga,
                        activeBg: '#0284C7',
                        activeText: 'white',
                        activeBorder: 'transparent',
                        inactiveBg: '#F0F9FF',
                        inactiveText: '#0284C7',
                        inactiveBorder: '#BAE6FD',
                        inactiveBadgeBg: '#E0F2FE',
                        inactiveBadgeColor: '#0284C7',
                      },
                      {
                        key: 'layanan110',
                        label: '📞 Layanan 110',
                        count: platCount110,
                        activeBg: '#1D4ED8',
                        activeText: 'white',
                        activeBorder: 'transparent',
                        inactiveBg: '#EFF6FF',
                        inactiveText: '#1D4ED8',
                        inactiveBorder: '#BFDBFE',
                        inactiveBadgeBg: '#DBEAFE',
                        inactiveBadgeColor: '#1D4ED8',
                      },
                      {
                        key: 'personel',
                        label: '👮 Patroli Personel',
                        count: platCountPersonel,
                        activeBg: '#92400E',
                        activeText: 'white',
                        activeBorder: 'transparent',
                        inactiveBg: '#FEF3C7',
                        inactiveText: '#92400E',
                        inactiveBorder: '#FDE68A',
                        inactiveBadgeBg: '#FEF3C7',
                        inactiveBadgeColor: '#92400E',
                      },
                    ]).map((p) => {
                      const isPlatActive = valFilterPlatform === p.key;
                      return (
                        <button
                          key={p.key}
                          type="button"
                          id={`filter-platform-${p.key}`}
                          className={`btn-filter-platform ${isPlatActive ? 'active' : ''}`}
                          onClick={() => handleSelectPlatformFilter(p.key)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            border: `1px solid ${isPlatActive ? p.activeBorder : p.inactiveBorder}`,
                            background: isPlatActive ? p.activeBg : p.inactiveBg,
                            color: isPlatActive ? p.activeText : p.inactiveText,
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: '0.15s',
                          }}
                        >
                          {p.label}{' '}
                          <span
                            className="badge-mini"
                            style={{
                              background: isPlatActive ? 'rgba(255,255,255,0.25)' : p.inactiveBadgeBg,
                              color: isPlatActive ? 'white' : p.inactiveBadgeColor,
                              padding: '1px 6px',
                              borderRadius: '10px',
                              marginLeft: '2px',
                              fontSize: '10px',
                              fontWeight: 700,
                            }}
                          >
                            {p.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Reset Filter Button: Only visible when platform or kategori is filtered (1:1 Prototype) */}
                  {(valFilterPlatform !== 'all' || valFilterKategori !== 'all') && (
                    <div
                      id="btn-reset-filter"
                      onClick={handleResetFilters}
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#EF4444',
                        cursor: 'pointer',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        background: '#FEE2E2',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: '0.15s',
                      }}
                      title="Reset filter platform dan kategori"
                    >
                      ✕ Reset Filter
                    </div>
                  )}
                </div>

                {/* Row 2: Kategori Jenis Pengaduan / Giat Personel (Dynamic Switch 1:1 Prototype from Database) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', paddingTop: '6px', borderTop: '1px dashed #E2E8F0' }}>
                  {valFilterPlatform === 'personel' ? (
                    <>
                      <span id="filter-kat-label" style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>👮</span> JENIS GIAT:
                      </span>
                      {(dbGiats.length > 0 ? [
                        { key: 'all', label: 'Semua Giat', count: katCountAll, activeBg: '#1E293B', inactiveBg: '#F8FAFC', inactiveColor: '#64748B', border: 'transparent' },
                        ...dbGiats.map((g) => ({
                          key: g.key,
                          label: `${g.icon} ${g.label}`,
                          count: logsForKategori.filter((c) => matchesKategori(c, g.key)).length,
                          activeBg: g.active_bg,
                          inactiveBg: g.inactive_bg,
                          inactiveColor: g.inactive_color,
                          border: g.border_color,
                        }))
                      ] : [
                        { key: 'all', label: 'Semua Giat', count: katCountAll, activeBg: '#1E293B', inactiveBg: '#F8FAFC', inactiveColor: '#64748B', border: 'transparent' },
                        { key: 'PATROLI', label: '🚔 Patroli', count: giatCountPatroli, activeBg: '#1D4ED8', inactiveBg: '#EFF6FF', inactiveColor: '#1D4ED8', border: '#BFDBFE' },
                        { key: 'SAMBANG', label: '🤝 Sambang', count: giatCountSambang, activeBg: '#15803D', inactiveBg: '#F0FDF4', inactiveColor: '#15803D', border: '#BBF7D0' },
                        { key: 'TPTKP', label: '🛡️ TPTKP', count: giatCountTptkp, activeBg: '#DC2626', inactiveBg: '#FEF2F2', inactiveColor: '#DC2626', border: '#FECACA' },
                        { key: 'PENGAMANAN', label: '⚠️ Pengamanan', count: giatCountPam, activeBg: '#D97706', inactiveBg: '#FFFBEB', inactiveColor: '#B45309', border: '#FDE68A' },
                      ]).map((giat) => {
                        const isGiatActive = valFilterKategori === giat.key;
                        return (
                          <button
                            key={giat.key}
                            type="button"
                            className={`btn-filter-kategori ${isGiatActive ? 'active' : ''}`}
                            onClick={() => handleSelectKategoriFilter(giat.key)}
                            style={{
                              padding: '3px 8px',
                              borderRadius: '5px',
                              border: `1px solid ${isGiatActive ? 'transparent' : giat.border}`,
                              background: isGiatActive ? giat.activeBg : giat.inactiveBg,
                              color: isGiatActive ? 'white' : giat.inactiveColor,
                              fontSize: '10.5px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              transition: '0.15s',
                            }}
                          >
                            {giat.label}{' '}
                            <span
                              className="badge-mini"
                              style={{
                                background: isGiatActive ? 'rgba(255,255,255,0.25)' : '#E2E8F0',
                                color: isGiatActive ? 'white' : giat.inactiveColor,
                                padding: '1px 5px',
                                borderRadius: '10px',
                                marginLeft: '3px',
                                fontSize: '9.5px',
                                fontWeight: 700,
                              }}
                            >
                              {giat.count}
                            </span>
                          </button>
                        );
                      })}
                    </>
                  ) : (
                    <>
                      <span id="filter-kat-label" style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>📁</span> JENIS ADUAN:
                      </span>
                      {(dbCategories.length > 0 ? [
                        { key: 'all', label: 'Semua Jenis', count: katCountAll },
                        ...dbCategories.map((cat) => ({
                          key: cat.key,
                          label: cat.label.startsWith(cat.icon) ? cat.label : `${cat.icon} ${cat.label}`,
                          count: logsForKategori.filter((c) => matchesKategori(c, cat.key)).length,
                        }))
                      ] : [
                        { key: 'all', label: 'Semua Jenis', count: katCountAll },
                        ...DEFAULT_MASTER_INCIDENT_CATEGORIES.map((cat) => ({
                          key: cat.key,
                          label: `${cat.icon} ${cat.label}`,
                          count: logsForKategori.filter((c) => matchesKategori(c, cat.key)).length,
                        }))
                      ]).map((kat) => {
                        const isKatActive = valFilterKategori === kat.key;
                        return (
                          <button
                            key={kat.key}
                            type="button"
                            className={`btn-filter-kategori ${isKatActive ? 'active' : ''}`}
                            onClick={() => handleSelectKategoriFilter(kat.key)}
                            style={{
                              padding: '3px 8px',
                              borderRadius: '5px',
                              border: '1px solid #E2E8F0',
                              background: isKatActive ? '#1E293B' : '#F8FAFC',
                              color: isKatActive ? 'white' : '#64748B',
                              fontSize: '10.5px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              transition: '0.15s',
                            }}
                          >
                            {kat.label}{' '}
                            <span
                              className="badge-mini"
                              style={{
                                background: isKatActive ? 'rgba(255,255,255,0.25)' : '#E2E8F0',
                                color: isKatActive ? 'white' : '#475569',
                                padding: '1px 5px',
                                borderRadius: '10px',
                                marginLeft: '3px',
                                fontSize: '9.5px',
                                fontWeight: 700,
                              }}
                            >
                              {kat.count}
                            </span>
                          </button>
                        );
                      })}
                    </>
                  )}
                </div>
              </div>

              {/* Subtitle Counter Bar (Dynamically pulls label from dbStatuses) */}
              <div id="val-subtitle-text" style={{ margin: '0 16px 10px', fontWeight: 700, fontSize: '12px', color: '#475569' }}>
                Menampilkan: <strong>
                  {filteredValidasiComplaints.length} Data {
                    valFilterStatus === 'semua'
                      ? 'Semua Pengaduan'
                      : (dbStatuses.find((s) => s.key?.toLowerCase() === valFilterStatus.toLowerCase())?.label || valFilterStatus.toUpperCase())
                  }
                </strong>
              </div>

              {/* Split Layout: List Left + Dossier Detail Right (1:1 Prototype) */}
              <div className="split-layout" style={{ display: 'flex', gap: '16px', margin: '0 16px', alignItems: 'flex-start' }}>

                {/* Left Column: List Kartu Pengaduan (.val-list) */}
                <div
                  className="val-list"
                  id="val-list-container"
                  style={{
                    flex: '1.2',
                    minWidth: '340px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  {filteredValidasiComplaints.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '48px 24px', background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', width: '100%', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                      <div style={{ fontSize: '44px', marginBottom: '12px' }}>📭</div>
                      <div style={{ fontWeight: 800, color: '#1E293B', fontSize: '15px' }}>Tidak Ada Data Laporan Ditemukan</div>
                      <div style={{ fontSize: '12.5px', color: '#64748B', margin: '6px auto 0', maxWidth: '480px', lineHeight: 1.5 }}>
                        Tidak ada laporan pengaduan yang cocok dengan kombinasi status, platform, atau jenis pengaduan yang sedang aktif.
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setValFilterPlatform('all');
                          setValFilterKategori('all');
                          setValFilterStatus('semua');
                        }}
                        style={{ marginTop: '16px', padding: '8px 18px', background: '#153E75', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 6px rgba(21,62,117,0.25)' }}
                      >
                        🔄 Tampilkan Semua Laporan (Reset Filter)
                      </button>
                    </div>
                  ) : (
                    filteredValidasiComplaints.map((log) => {
                      const isSos = log.jenisKejadian?.toLowerCase().includes('sos') || log.jenisKejadian?.toLowerCase().includes('panic');
                      const is110 = !!log.operatorId;
                      const platform = isSos ? 'sos' : is110 ? 'layanan110' : 'warga';

                      let avatarBorder = '#7DD3FC';
                      let avatarIcon = '📱';
                      let avatarIconBg = '#0284C7';
                      let platformBadge = (
                        <span style={{ fontSize: '9.5px', fontWeight: 800, padding: '2px 7px', borderRadius: '4px', background: '#F0F9FF', color: '#0284C7', border: '1px solid #BAE6FD', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          📱 PORTAL WARGA
                        </span>
                      );
                      let kontakMeta = `📞 ${log.pelaporHp} • 🪪 NIK Dukcapil Valid`;

                      if (platform === 'sos') {
                        avatarBorder = '#FCA5A5';
                        avatarIcon = '🚨';
                        avatarIconBg = '#DC2626';
                        platformBadge = (
                          <span style={{ fontSize: '9.5px', fontWeight: 800, padding: '2px 7px', borderRadius: '4px', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            🚨 SOS PANIC
                          </span>
                        );
                        kontakMeta = `📞 ${log.pelaporHp} • 🛰️ GPS: ${log.tkpLat?.toFixed(4)}, ${log.tkpLng?.toFixed(4)}`;
                      } else if (platform === 'layanan110') {
                        avatarBorder = '#93C5FD';
                        avatarIcon = '📞';
                        avatarIconBg = '#1D4ED8';
                        platformBadge = (
                          <span style={{ fontSize: '9.5px', fontWeight: 800, padding: '2px 7px', borderRadius: '4px', background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            📞 LAYANAN 110
                          </span>
                        );
                        kontakMeta = `📞 ${log.pelaporHp} • 🎧 Call Center 110`;
                      }

                      // Kategori styling (100% synchronized with getComplaintKategori)
                      const katInfo = getComplaintKategoriInfo(log);
                      const katBadgeStyle = katInfo.badgeStyle;
                      const katBadgeText = katInfo.badgeText;

                      // Status text & colors strictly matching MySQL master_complaint_statuses table
                      const isRejected = isComplaintRejected(log);
                      const statMeta = resolveComplaintStatus(log.status, isRejected);
                      const statusColor = statMeta.badge_color;
                      const statusText = statMeta.label;
                      let cardFooterText = '⚡ Disposisi Tugas ➔';
                      let cardFooterColor = '#1E40AF';

                      if (statMeta.key === 'DITOLAK') {
                        cardFooterText = '✕ Laporan Ditolak Pawas';
                        cardFooterColor = '#DC2626';
                      } else if (statMeta.key === 'DISPOSISI') {
                        cardFooterText = '📋 Personil Sudah Ditugaskan ➔';
                        cardFooterColor = '#2563EB';
                      } else if (statMeta.key === 'MENUJU_TKP') {
                        cardFooterText = '⏱️ Personil Meluncur ke TKP (< 10m) ➔';
                        cardFooterColor = '#8B5CF6';
                      } else if (statMeta.key === 'TIBA_DI_TKP') {
                        cardFooterText = '📍 Personil Tiba & Penanganan di TKP ➔';
                        cardFooterColor = '#10B981';
                      } else if (statMeta.key === 'MENUNGGU_PENGESAHAN') {
                        cardFooterText = '✍️ Tindakan Rampung & Menunggu BAP Disahkan ➔';
                        cardFooterColor = '#EF4444';
                      } else if (statMeta.key === 'SELESAI') {
                        cardFooterText = '✓ Berita Acara Disahkan & Ditutup Resmi (Pawas) ➔';
                        cardFooterColor = '#2563EB';
                      }

                      const isSelected = activeComplaint?.id === log.id;

                      return (
                        <div
                          key={log.id}
                          id={`card-log-${log.id}`}
                          className={`val-card ${isSelected ? 'selected' : ''}`}
                          onClick={() => setSelectedValComplaint(log)}
                          style={{
                            background: isSelected ? '#F0F9FF' : 'white',
                            border: isSelected ? '2px solid #0284C7' : '1px solid #E2E8F0',
                            borderRadius: '12px',
                            padding: '14px',
                            cursor: 'pointer',
                            boxShadow: isSelected ? '0 4px 12px rgba(2,132,199,0.15)' : '0 1px 3px rgba(0,0,0,0.03)',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {/* Header Kartu: Avatar Pelapor, Nama, Waktu, Status, Platform */}
                          <div className="val-user" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                            <div style={{ position: 'relative', flexShrink: 0 }}>
                              {log.pelaporAvatarUrl ? (
                                <img
                                  src={log.pelaporAvatarUrl}
                                  alt="User"
                                  style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${avatarBorder}`, display: 'block' }}
                                />
                              ) : (
                                <div
                                  style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#F1F5F9', border: `2px solid ${avatarBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}
                                >
                                  {log.platformKey === 'sos' ? '🚨' : log.platformKey === 'personil' ? '👮' : '👤'}
                                </div>
                              )}
                              <span
                                style={{
                                  position: 'absolute',
                                  bottom: '-3px',
                                  right: '-3px',
                                  fontSize: '9px',
                                  background: avatarIconBg,
                                  color: 'white',
                                  borderRadius: '50%',
                                  width: '16px',
                                  height: '16px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  border: '1.5px solid white',
                                }}
                              >
                                {avatarIcon}
                              </span>
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                                <div style={{ fontWeight: 700, fontSize: '13px', color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {log.pelaporNama}
                                </div>
                                <div style={{ fontSize: '10px', color: '#64748B', flexShrink: 0 }}>
                                  {new Date(log.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px', gap: '4px', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '4px', background: statMeta.badge_bg, color: statMeta.badge_color, border: `1px solid ${statMeta.badge_border}` }}>
                                  {statMeta.icon} {statusText}
                                </span>
                                {platformBadge}
                              </div>
                            </div>
                          </div>

                          {/* Baris Kombinasi: Jenis Pengaduan & Tingkat Urgensi */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '6px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '9.5px', fontWeight: 800, padding: '2px 7px', borderRadius: '4px', ...katBadgeStyle }}>
                              {katBadgeText}
                            </span>
                            <span
                              style={{
                                fontSize: '9.5px',
                                fontWeight: 800,
                                padding: '1.5px 6px',
                                borderRadius: '4px',
                                whiteSpace: 'nowrap',
                                background: (log.urgensi === 'DARURAT' || log.urgensi === 'PRIORITAS_TINGGI') ? '#FEE2E2' : log.urgensi === 'SEDANG' ? '#FEF3C7' : '#EFF6FF',
                                color: (log.urgensi === 'DARURAT' || log.urgensi === 'PRIORITAS_TINGGI') ? '#DC2626' : log.urgensi === 'SEDANG' ? '#D97706' : '#1D4ED8',
                              }}
                            >
                              {(log.urgensi === 'DARURAT' || log.urgensi === 'PRIORITAS_TINGGI') ? '🚨 Darurat' : log.urgensi === 'SEDANG' ? '⚠️ Sedang' : 'ℹ️ Normal'}
                            </span>
                          </div>

                          {/* Judul & Ringkasan Laporan */}
                          <div style={{ fontWeight: 700, fontSize: '12.5px', color: '#1E293B', lineHeight: 1.35, marginBottom: '4px' }}>
                            {log.jenisKejadian}
                          </div>
                          <div className="val-text" style={{ fontSize: '11.5px', color: '#475569', marginBottom: '6px', lineHeight: 1.45 }}>
                            {log.ringkasanKeterangan}
                          </div>

                          {/* Metadata Lokasi, Kontak & Tiket */}
                          <div style={{ fontSize: '10.5px', color: '#64748B', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '6px 8px', marginBottom: '6px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span>📍</span> <span style={{ fontWeight: 600, color: '#334155' }}>{log.tkpAlamatTeks}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', flexWrap: 'wrap' }}>
                              <span style={{ color: '#475569' }}>{kontakMeta}</span>
                              <span style={{ color: '#64748B' }}>Tiket: <strong>{log.nomorTiket}</strong></span>
                            </div>
                          </div>

                          {/* Badge info & Card footer */}
                          {isRejected && (
                            <div style={{ marginTop: '8px', background: '#FEF2F2', borderLeft: '3px solid #EF4444', padding: '8px 10px', borderRadius: '4px', fontSize: '11px', color: '#991B1B', lineHeight: 1.4 }}>
                              <strong>⚠️ Catatan Penolakan:</strong> {log.ringkasanKeterangan?.includes('[DITOLAK PAWAS]:') ? log.ringkasanKeterangan.split('[DITOLAK PAWAS]:')[1]?.trim() : 'Laporan perlu direvisi oleh personel lapangan.'}
                            </div>
                          )}

                          <div
                            onClick={(e) => {
                              if (isRejected) {
                                e.stopPropagation();
                                handleAjukanRevisi(log);
                              }
                            }}
                            style={{ fontSize: '11px', color: cardFooterColor, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px' }}
                          >
                            {cardFooterText}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Right Column: Dossier Detail & Timeline Pelacakan (.val-detail) */}
                <div
                  className="val-detail"
                  id="val-detail-box"
                  style={{
                    flex: '1',
                    background: 'white',
                    border: '1px solid #E2E8F0',
                    borderRadius: '12px',
                    padding: '16px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    height: 'auto',
                  }}
                >
                  {activeComplaint ? (
                    <div>
                      {(() => {
                        const isRejected = isComplaintRejected(activeComplaint);
                        const activeStatMeta = resolveComplaintStatus(activeComplaint.status, isRejected);
                        const rejectionReason = activeComplaint.ringkasanKeterangan?.includes('[DITOLAK PAWAS]:')
                          ? activeComplaint.ringkasanKeterangan.split('[DITOLAK PAWAS]:')[1]?.trim()
                          : (activeComplaint.ringkasanKeterangan || 'Laporan dikembalikan untuk melengkapi dokumentasi dan identifikasi pelaku.');

                        return (
                          <>
                            {/* GLOBAL MACRO MILESTONE STEPPER 1:1 PROTOTYPE */}
                            <div id="macro-milestone-box" style={{ marginBottom: '14px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '10px 12px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <div style={{ fontSize: '10px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                  <span>🌐</span> SIKLUS HIDUP LAPORAN
                                </div>
                                <div style={{ fontSize: '10px', fontWeight: 700, color: '#153E75', background: '#EFF6FF', padding: '2px 8px', borderRadius: '4px', border: '1px solid #BFDBFE' }}>
                                  {activeComplaint.jenisKejadian?.toLowerCase().includes('sos') ? '🚨 SOS Panik' : activeComplaint.operatorId ? '📞 Layanan 110' : '📱 Portal Warga'}
                                </div>
                              </div>

                              <div className="macro-stepper" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                                {/* Step 1 */}
                                <div style={{ textAlign: 'center', padding: '6px 4px', borderRadius: '6px', background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
                                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#10B981' }}>✓</div>
                                  <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#1E293B', marginTop: '2px' }}>1. Lapor Masuk</div>
                                  <div style={{ fontSize: '8.5px', color: '#059669', fontWeight: 600 }}>Tercatat</div>
                                </div>
                                {/* Step 2 */}
                                <div style={{
                                  textAlign: 'center',
                                  padding: '6px 4px',
                                  borderRadius: '6px',
                                  background: isRejected ? '#FEE2E2' : activeStatMeta.key === 'MENUNGGU' ? '#FEF3C7' : '#ECFDF5',
                                  border: isRejected ? '1px solid #EF4444' : activeStatMeta.key === 'MENUNGGU' ? '1px solid #F59E0B' : '1px solid #A7F3D0'
                                }}>
                                  <div style={{ fontSize: '11px', fontWeight: 800, color: isRejected ? '#DC2626' : activeStatMeta.key === 'MENUNGGU' ? '#D97706' : '#10B981' }}>
                                    {isRejected ? '✕' : activeStatMeta.key === 'MENUNGGU' ? '⏳' : '✓'}
                                  </div>
                                  <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#1E293B', marginTop: '2px' }}>2. Validasi</div>
                                  <div style={{ fontSize: '8.5px', color: isRejected ? '#DC2626' : activeStatMeta.key === 'MENUNGGU' ? '#D97706' : '#059669', fontWeight: 600 }}>
                                    {isRejected ? 'Ditolak/Revisi' : activeStatMeta.key === 'MENUNGGU' ? 'Review Pawas' : 'Pawas'}
                                  </div>
                                </div>
                                {/* Step 3 */}
                                <div style={{
                                  textAlign: 'center',
                                  padding: '6px 4px',
                                  borderRadius: '6px',
                                  background: ['DISPOSISI', 'MENUJU_TKP', 'TIBA_DI_TKP'].includes(activeStatMeta.key) ? '#EFF6FF' : ['MENUNGGU_PENGESAHAN', 'SELESAI'].includes(activeStatMeta.key) ? '#ECFDF5' : '#F8FAFC',
                                  border: ['DISPOSISI', 'MENUJU_TKP', 'TIBA_DI_TKP'].includes(activeStatMeta.key) ? '1px solid #93C5FD' : ['MENUNGGU_PENGESAHAN', 'SELESAI'].includes(activeStatMeta.key) ? '1px solid #A7F3D0' : '1px solid #E2E8F0',
                                  opacity: (isRejected || activeStatMeta.key === 'MENUNGGU') ? 0.6 : 1,
                                }}>
                                  <div style={{ fontSize: '11px', fontWeight: 800, color: isRejected ? '#94A3B8' : ['DISPOSISI', 'MENUJU_TKP', 'TIBA_DI_TKP'].includes(activeStatMeta.key) ? '#2563EB' : ['MENUNGGU_PENGESAHAN', 'SELESAI'].includes(activeStatMeta.key) ? '#10B981' : '#94A3B8' }}>
                                    {isRejected ? '⛔' : activeStatMeta.key === 'MENUNGGU' ? '🔒' : ['DISPOSISI', 'MENUJU_TKP', 'TIBA_DI_TKP'].includes(activeStatMeta.key) ? '🚔' : '✓'}
                                  </div>
                                  <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#1E293B', marginTop: '2px' }}>3. Lapangan</div>
                                  <div style={{ fontSize: '8.5px', color: ['DISPOSISI', 'MENUJU_TKP', 'TIBA_DI_TKP'].includes(activeStatMeta.key) ? '#2563EB' : ['MENUNGGU_PENGESAHAN', 'SELESAI'].includes(activeStatMeta.key) ? '#059669' : '#94A3B8', fontWeight: 600 }}>
                                    {isRejected ? 'Terkunci' : activeStatMeta.key === 'DISPOSISI' ? 'Disposisi' : activeStatMeta.key === 'MENUJU_TKP' ? 'Meluncur' : activeStatMeta.key === 'TIBA_DI_TKP' ? 'Di TKP' : ['MENUNGGU_PENGESAHAN', 'SELESAI'].includes(activeStatMeta.key) ? 'Tuntas' : 'Menunggu'}
                                  </div>
                                </div>
                                {/* Step 4 */}
                                <div style={{
                                  textAlign: 'center',
                                  padding: '6px 4px',
                                  borderRadius: '6px',
                                  background: activeStatMeta.key === 'SELESAI' ? '#ECFDF5' : activeStatMeta.key === 'MENUNGGU_PENGESAHAN' ? '#FEF2F2' : '#F8FAFC',
                                  border: activeStatMeta.key === 'SELESAI' ? '1px solid #A7F3D0' : activeStatMeta.key === 'MENUNGGU_PENGESAHAN' ? '1px solid #FECACA' : '1px solid #E2E8F0',
                                  opacity: (isRejected || activeStatMeta.key === 'MENUNGGU' || ['DISPOSISI', 'MENUJU_TKP', 'TIBA_DI_TKP'].includes(activeStatMeta.key)) ? 0.6 : 1,
                                }}>
                                  <div style={{ fontSize: '11px', fontWeight: 800, color: activeStatMeta.key === 'SELESAI' ? '#10B981' : activeStatMeta.key === 'MENUNGGU_PENGESAHAN' ? '#EF4444' : '#94A3B8' }}>
                                    {isRejected ? '⛔' : activeStatMeta.key === 'SELESAI' ? '✓' : activeStatMeta.key === 'MENUNGGU_PENGESAHAN' ? '📝' : '🔒'}
                                  </div>
                                  <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#1E293B', marginTop: '2px' }}>4. Selesai</div>
                                  <div style={{ fontSize: '8.5px', color: activeStatMeta.key === 'SELESAI' ? '#059669' : activeStatMeta.key === 'MENUNGGU_PENGESAHAN' ? '#EF4444' : '#94A3B8', fontWeight: 600 }}>
                                    {activeStatMeta.key === 'SELESAI' ? 'Selesai 100%' : activeStatMeta.key === 'MENUNGGU_PENGESAHAN' ? 'Pengesahan BAP' : 'Menunggu'}
                                  </div>
                                </div>
                              </div>

                              {/* Audit Log Terakhir */}
                              <div id="macro-audit-drawer" style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed #CBD5E1', fontSize: '10px', color: '#64748B' }}>
                                <span style={{ fontWeight: 600 }}>
                                  {isRejected ? (
                                    <>⚠️ <strong>Catatan Revisi:</strong> "{rejectionReason}"</>
                                  ) : activeStatMeta.key === 'MENUNGGU' ? (
                                    <>🕒 <strong>Menunggu Penugasan Pawas:</strong> Laporan Diterima &amp; Menunggu Verifikasi Pawas</>
                                  ) : activeStatMeta.key === 'DISPOSISI' ? (
                                    <>📋 <strong>Disposisi Pawas:</strong> Personel Siaga Telah Ditugaskan Meluncur</>
                                  ) : activeStatMeta.key === 'MENUJU_TKP' ? (
                                    <>🚀 <strong>Sedang Ditangani:</strong> Personel Meluncur ke Lokasi TKP (SLA &lt; 10 Menit)</>
                                  ) : activeStatMeta.key === 'TIBA_DI_TKP' ? (
                                    <>📍 <strong>Tiba di TKP:</strong> Petugas Tiba di Lokasi &amp; Melakukan Tindakan Kepolisian</>
                                  ) : activeStatMeta.key === 'MENUNGGU_PENGESAHAN' ? (
                                    <>⚖️ <strong>Menunggu Pengesahan:</strong> Laporan Telah Selesai Ditangani dan BAP Terbit (Menunggu Otorisasi Pawas)</>
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
                                          meta: `TKP: ${activeComplaint.tkpAlamatTeks}`,
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
                                      {new Date(activeComplaint.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                                    </span>
                                  </div>
                                  <div>
                                    <div style={{ color: '#64748B', fontSize: '11px', fontWeight: 600 }}>Sektor / Wilayah:</div>
                                    <span style={{ color: '#1E293B', fontWeight: 700 }}>{activeComplaint.tkpAlamatTeks}</span>
                                  </div>
                                  <div>
                                    <div style={{ color: '#64748B', fontSize: '11px', fontWeight: 600 }}>Identitas Pelapor:</div>
                                    <div style={{ color: '#1E293B', fontWeight: 700 }}>
                                      {activeComplaint.pelaporNama}{' '}
                                      <span style={{ fontSize: '10px', background: '#EFF6FF', color: '#1D4ED8', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', border: '1px solid #BFDBFE' }}>
                                        Pelapor Terverifikasi
                                      </span>
                                    </div>
                                  </div>
                                  <div>
                                    <div style={{ color: '#64748B', fontSize: '11px', fontWeight: 600 }}>Kontak &amp; Koordinat:</div>
                                    <div style={{ color: '#1E293B', fontWeight: 700 }}>
                                      📞 {activeComplaint.pelaporHp} • 🛰️ {activeComplaint.tkpLat?.toFixed(4)}, {activeComplaint.tkpLng?.toFixed(4)}
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
                                  <div style={{ marginTop: '14px', display: 'flex', gap: '8px' }}>
                                    <button
                                      type="button"
                                      className="btn-blue"
                                      onClick={() => {
                                        bukaModalDisposisi(activeComplaint);
                                      }}
                                      style={{
                                        flex: 1.4,
                                        padding: '12px 14px',
                                        background: 'linear-gradient(135deg, #153E75 0%, #1E40AF 100%)',
                                        color: 'white',
                                        fontSize: '13px',
                                        fontWeight: 800,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        boxShadow: '0 3px 10px rgba(21,62,117,0.3)',
                                        cursor: 'pointer',
                                      }}
                                    >
                                      <span>⚡</span> Disposisi Tugas ➔
                                    </button>
                                    <button
                                      type="button"
                                      className="btn-rej"
                                      onClick={() => {
                                        setTolakComplaint(activeComplaint);
                                        switchTab('view-tolak');
                                      }}
                                      style={{
                                        flex: 0.8,
                                        padding: '12px 10px',
                                        borderRadius: '8px',
                                        border: '1px solid #FCA5A5',
                                        background: '#FEF2F2',
                                        color: '#DC2626',
                                        fontWeight: 700,
                                        fontSize: '12px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '4px',
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
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                  <div>
                                    <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#1E293B', margin: 0 }}>Hasil Pelacakan</h3>
                                    <div style={{ fontSize: '10px', color: '#64748B', marginTop: '2px' }}>Timeline Progress Penanganan Kasus</div>
                                  </div>
                                  <span
                                    style={{
                                      fontSize: '11px',
                                      fontWeight: 700,
                                      padding: '4px 10px',
                                      borderRadius: '12px',
                                      background: activeStatMeta.badge_bg,
                                      color: activeStatMeta.badge_color,
                                      border: `1px solid ${activeStatMeta.badge_border}`,
                                    }}
                                  >
                                    {activeStatMeta.icon} {activeStatMeta.label}
                                  </span>
                                </div>

                                {/* Incident Meta Details Card */}
                                <div className="incident-meta-card" style={{ marginBottom: '14px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '12px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                    <div>
                                      <div style={{ fontSize: '10px', color: '#64748B', fontWeight: 700 }}>Nomor Laporan</div>
                                      <div style={{ color: '#153E75', fontFamily: 'monospace', fontSize: '13px', fontWeight: 800 }}>
                                        {activeComplaint.nomorTiket}
                                      </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                      <div style={{ fontSize: '10px', color: '#64748B', fontWeight: 700 }}>Waktu Lapor</div>
                                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#1E293B' }}>
                                        Hari ini, {new Date(activeComplaint.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                                      </div>
                                    </div>
                                  </div>

                                  <div style={{ fontSize: '12px', color: '#334155', marginBottom: '4px' }}>
                                    <span style={{ color: '#64748B', fontWeight: 600 }}>Jenis Insiden:</span>{' '}
                                    <strong>{activeComplaint.jenisKejadian}</strong>
                                  </div>
                                  <div style={{ fontSize: '12px', color: '#334155', marginBottom: '10px' }}>
                                    <span style={{ color: '#64748B', fontWeight: 600 }}>Lokasi TKP:</span>{' '}
                                    <span style={{ color: '#64748B' }}>{activeComplaint.tkpAlamatTeks}</span>
                                  </div>

                                  {/* Foto Bukti Laporan Warga Full-Width dengan Tombol Perbesar */}
                                  {activeComplaint.fotoTkpUrl ? (
                                    <div
                                      style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', background: '#0F172A', cursor: 'pointer' }}
                                      onClick={() => {
                                        setLightboxImg({
                                          url: activeComplaint.fotoTkpUrl,
                                          title: `Bukti Kasus ${activeComplaint.nomorTiket}`,
                                          meta: `TKP: ${activeComplaint.tkpAlamatTeks}`,
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
                                    <div style={{ padding: '16px', background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: '8px', textAlign: 'center', color: '#94A3B8', fontSize: '12px' }}>
                                      📷 Tidak ada foto bukti laporan yang dilampirkan
                                    </div>
                                  )}

                                  <div style={{ fontSize: '11px', color: '#1E293B', lineHeight: 1.4, marginTop: '8px', fontStyle: 'italic' }}>
                                    "{activeComplaint.ringkasanKeterangan}"
                                  </div>
                                </div>

                                {/* DYNAMIC 5-STEP VERTICAL TIMELINE 1:1 PROTOTYPE */}
                                <div className="timeline" style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '16px' }}>
                                  {/* Step 1: Laporan Diterima */}
                                  <div className="step completed" style={{ borderLeft: '3px solid #10B981', paddingLeft: '12px', position: 'relative' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#1E293B' }}>1. Laporan Diterima (SPKT)</div>
                                      <span style={{ fontSize: '10px', color: '#10B981', fontWeight: 700, background: '#ECFDF5', padding: '2px 6px', borderRadius: '4px' }}>✓ SELESAI</span>
                                    </div>
                                    <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
                                      Laporan Anda telah divalidasi oleh operator 110 dan diteruskan ke komando wilayah.
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
                                      <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#1E293B' }}>
                                        📅 Waktu: {new Date(activeComplaint.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                                      </span>
                                      {activeComplaint.fotoTkpUrl && (
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
                                          style={{ fontSize: '10px', fontWeight: 700, color: '#1D4ED8', background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer' }}
                                        >
                                          📷 Bukti Laporan 110 ➔
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Step 2: Disposisi Personel */}
                                  <div className="step completed" style={{ borderLeft: activeComplaint.status === 'BELUM_DITANGANI' ? '3px solid #CBD5E1' : '3px solid #10B981', paddingLeft: '12px', position: 'relative' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#1E293B' }}>2. Disposisi Personel</div>
                                      <span style={{
                                        fontSize: '10px',
                                        fontWeight: 700,
                                        background: activeComplaint.status === 'BELUM_DITANGANI' ? '#F1F5F9' : '#ECFDF5',
                                        color: activeComplaint.status === 'BELUM_DITANGANI' ? '#64748B' : '#10B981',
                                        padding: '2px 6px',
                                        borderRadius: '4px'
                                      }}>
                                        {activeComplaint.status === 'BELUM_DITANGANI' ? '🔒 MENUNGGU DISPOSISI' : '✓ SELESAI'}
                                      </span>
                                    </div>
                                    <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
                                      {activeComplaint.assignedOfficer ? `Tugas penanganan telah diserahkan kepada ${activeComplaint.assignedOfficer.rankPangkat} ${activeComplaint.assignedOfficer.namaLengkap} (${activeComplaint.assignedOfficer.assignedPatrolVehicle || 'Unit Presisi'}).` : 'Menunggu penugasan personel dan armada reaksi cepat oleh Pawas.'}
                                    </div>
                                    <div style={{ marginTop: '8px', fontSize: '10.5px', fontWeight: 700, color: '#1E293B' }}>
                                      📅 Disposisi Pawas: {activeComplaint.disposisiAt ? new Date(activeComplaint.disposisiAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB' : activeComplaint.status !== 'BELUM_DITANGANI' ? 'Telah Diteruskan' : 'Menunggu Validasi'}
                                    </div>
                                  </div>

                                  {/* Step 3: Personel Menuju Lokasi */}
                                  <div
                                    className="step active"
                                    style={{
                                      borderLeft: activeComplaint.status === 'MENUJU_TKP' ? '3px solid #3B82F6' : ['PENANGANAN_TKP', 'SELESAI'].includes(activeComplaint.status) ? '3px solid #10B981' : '3px solid #CBD5E1',
                                      paddingLeft: '12px',
                                      position: 'relative',
                                    }}
                                  >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#1E293B' }}>3. Personel Menuju Lokasi</div>
                                      <span
                                        style={{
                                          fontSize: '10px',
                                          fontWeight: 700,
                                          padding: '2px 6px',
                                          borderRadius: '4px',
                                          background: activeComplaint.status === 'MENUJU_TKP' ? '#DBEAFE' : ['PENANGANAN_TKP', 'SELESAI'].includes(activeComplaint.status) ? '#ECFDF5' : '#F1F5F9',
                                          color: activeComplaint.status === 'MENUJU_TKP' ? '#1D4ED8' : ['PENANGANAN_TKP', 'SELESAI'].includes(activeComplaint.status) ? '#10B981' : '#64748B',
                                        }}
                                      >
                                        {activeComplaint.status === 'MENUJU_TKP' ? '● SEDANG BERLANGSUNG' : ['PENANGANAN_TKP', 'SELESAI'].includes(activeComplaint.status) ? '✓ SELESAI' : '🔒 TERKUNCI'}
                                      </span>
                                    </div>
                                    <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
                                      {activeComplaint.assignedOfficer ? `Tim ${activeComplaint.assignedOfficer.assignedPatrolVehicle || 'Presisi'} sedang meluncur ke lokasi kejadian. Sirine biru aktif dan pantauan GPS terhubung.` : 'Menunggu unit meluncur.'}
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
                                      <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#1E293B' }}>
                                        📅 Meluncur: {activeComplaint.disposisiAt ? new Date(activeComplaint.disposisiAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
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
                                      style={{ position: 'relative', marginTop: '8px', borderRadius: '8px', overflow: 'hidden', height: '110px', background: 'radial-gradient(circle at center, #1E3A8A 0%, #0F172A 100%)' }}
                                    >
                                      {activeComplaint.fotoPersiapan ? (
                                        <img src={activeComplaint.fotoPersiapan} alt="Patrol Car" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                      ) : (
                                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#93C5FD', fontSize: '11px', fontWeight: 700 }}>
                                          🛰️ Tracking Satelit Armada Aktif
                                        </div>
                                      )}
                                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)', padding: '8px 10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {activeComplaint.assignedOfficer?.avatarUrl ? (
                                          <img src={activeComplaint.assignedOfficer.avatarUrl} alt="Petugas" style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1.5px solid white' }} />
                                        ) : (
                                          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#1E3A8A', border: '1.5px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>👮</div>
                                        )}
                                        <div>
                                          <div style={{ color: 'white', fontSize: '11px', fontWeight: 800 }}>
                                            {activeComplaint.assignedOfficer ? `${activeComplaint.assignedOfficer.assignedPatrolVehicle || 'Unit Presisi'} (${activeComplaint.assignedOfficer.rankPangkat} ${activeComplaint.assignedOfficer.namaLengkap})` : 'Unit Patroli Presisi'}
                                          </div>
                                          <div style={{ color: '#38BDF8', fontSize: '9.5px' }}>Status: {activeComplaint.status === 'MENUJU_TKP' ? 'Menuju Lokasi' : 'Tepat Waktu'}</div>
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
                                        "{activeComplaint.timelines?.find((t: any) => t.tahapKe === 2 || t.tahapKe === 3)?.catatan || `Unit bergerak menuju ${activeComplaint.tkpAlamatTeks}`}"
                                      </div>
                                    </div>
                                  </div>

                                  {/* Step 4: Penanganan di Lokasi */}
                                  <div
                                    className="step"
                                    style={{
                                      borderLeft: activeComplaint.status === 'PENANGANAN_TKP' ? '3px solid #7C3AED' : activeComplaint.status === 'SELESAI' ? '3px solid #10B981' : '3px solid #CBD5E1',
                                      paddingLeft: '12px',
                                      position: 'relative',
                                    }}
                                  >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#1E293B' }}>4. Penanganan di Lokasi</div>
                                      <span
                                        style={{
                                          fontSize: '10px',
                                          fontWeight: 700,
                                          padding: '2px 6px',
                                          borderRadius: '4px',
                                          background: activeComplaint.status === 'SELESAI' ? '#ECFDF5' : activeComplaint.status === 'PENANGANAN_TKP' ? '#EDE9FE' : '#F1F5F9',
                                          color: activeComplaint.status === 'SELESAI' ? '#10B981' : activeComplaint.status === 'PENANGANAN_TKP' ? '#6D28D9' : '#64748B',
                                        }}
                                      >
                                        {activeComplaint.status === 'SELESAI' ? '✓ SELESAI' : activeComplaint.status === 'PENANGANAN_TKP' ? '● SEDANG BERLANGSUNG' : '🔒 TERKUNCI'}
                                      </span>
                                    </div>
                                    <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
                                      Personel tiba di lokasi dan sedang melakukan tindakan kepolisian.
                                    </div>

                                    {['PENANGANAN_TKP', 'SELESAI'].includes(activeComplaint.status) ? (
                                      <>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
                                          <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#1E293B' }}>
                                            📅 Tiba di TKP: {activeComplaint.responTibaTkpAt ? new Date(activeComplaint.responTibaTkpAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB' : 'Hari ini'}
                                          </span>
                                          {activeComplaint.fotoTindakan && (
                                            <span
                                              onClick={() => {
                                                setLightboxImg({
                                                  url: activeComplaint.fotoTindakan,
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
                                          )}
                                        </div>
                                        <div style={{ background: '#FEFCE8', borderLeft: '3px solid #EAB308', borderRadius: '0 6px 6px 0', padding: '6px 10px', marginTop: '8px', lineHeight: 1.4 }}>
                                          <div style={{ fontSize: '10px', fontWeight: 700, color: '#854D0E', marginBottom: '2px' }}>📝 BERITA ACARA TINDAKAN TKP:</div>
                                          <div style={{ fontSize: '11px', color: '#1E293B' }}>
                                            "{activeComplaint.timelines?.find((t: any) => t.tahapKe === 4)?.catatan || 'Personel tiba di TKP, mengamankan perimeter dan memastikan situasi kamtibmas kondusif.'}"
                                          </div>
                                        </div>
                                      </>
                                    ) : (
                                      <div style={{ fontSize: '10.5px', color: '#94A3B8', fontStyle: 'italic', marginTop: '6px' }}>
                                        Menunggu Personel Tiba di TKP
                                      </div>
                                    )}
                                  </div>

                                  {/* Step 5: Kasus Selesai Ditangani */}
                                  <div
                                    className="step"
                                    style={{
                                      borderLeft: activeComplaint.status === 'SELESAI' ? '3px solid #10B981' : '3px solid #CBD5E1',
                                      paddingLeft: '12px',
                                      position: 'relative',
                                    }}
                                  >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#1E293B' }}>5. Kasus Selesai Ditangani</div>
                                      <span
                                        style={{
                                          fontSize: '10px',
                                          fontWeight: 700,
                                          padding: '2px 6px',
                                          borderRadius: '4px',
                                          background: activeComplaint.status === 'SELESAI' ? '#ECFDF5' : '#F1F5F9',
                                          color: activeComplaint.status === 'SELESAI' ? '#10B981' : '#64748B',
                                        }}
                                      >
                                        {activeComplaint.status === 'SELESAI' ? '✓ SELESAI' : '🔒 TERKUNCI'}
                                      </span>
                                    </div>
                                    <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
                                      Penanganan selesai dan berita acara penutupan kasus disahkan resmi oleh Pawas.
                                    </div>

                                    {activeComplaint.status === 'SELESAI' ? (
                                      <div style={{ marginTop: '8px' }}>
                                        <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#1E293B' }}>
                                          📅 Disahkan: {activeComplaint.selesaiAt ? new Date(activeComplaint.selesaiAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB' : 'Hari ini'}
                                        </div>
                                        <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderLeft: '4px solid #16A34A', borderRadius: '6px', padding: '7px 10px', marginTop: '8px', lineHeight: 1.4 }}>
                                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '10px', fontWeight: 800, color: '#15803D' }}>⚖️ PENGESAHAN RESMI PIMPINAN (PAWAS):</span>
                                            <span style={{ fontSize: '9.5px', fontWeight: 700, background: '#DCFCE7', color: '#166534', padding: '1px 6px', borderRadius: '3px' }}>SAH &amp; VALID</span>
                                          </div>
                                          <div style={{ fontSize: '10.5px', color: '#166534', marginTop: '2px' }}>
                                            <strong>Pengesah:</strong> {activeComplaint.pawas?.namaLengkap || userProfile.fullName} (Pawas) • <strong>Waktu:</strong> {activeComplaint.selesaiAt ? new Date(activeComplaint.selesaiAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB' : 'Hari ini'}
                                          </div>
                                          <div style={{ fontSize: '11px', color: '#1E293B', fontStyle: 'italic', marginTop: '2px' }}>
                                            "{activeComplaint.timelines?.find((t: any) => t.tahapKe === 5)?.catatan || 'Berita acara lengkap, penanganan tuntas sesuai SOP Polri Presisi.'}"
                                          </div>
                                        </div>
                                      </div>
                                    ) : (
                                      <div style={{ fontSize: '10.5px', color: '#94A3B8', fontStyle: 'italic', marginTop: '6px' }}>
                                        Menunggu Otorisasi Penutupan Kasus
                                      </div>
                                    )}
                                  </div>
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
                                                Target &le; 5 Menit ({tCreate ? tCreate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'} ➔ {tDisp ? tDisp.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : 'Menunggu'})
                                              </div>
                                            </div>
                                            <span style={{ fontSize: '9.5px', fontWeight: 700, background: mDisp && mDisp <= 5 ? '#065F46' : '#854D0E', color: mDisp && mDisp <= 5 ? '#34D399' : '#FDE68A', padding: '2px 7px', borderRadius: '4px' }}>
                                              {mDisp !== null ? `✓ Respon Cepat (${mDisp}m)` : '● Menunggu Disposisi'}
                                            </span>
                                          </div>
                                        );
                                      })()}

                                      {/* SLA 2 */}
                                      {(() => {
                                        const tDisp = activeComplaint.disposisiAt ? new Date(activeComplaint.disposisiAt) : null;
                                        const tTiba = activeComplaint.responTibaTkpAt ? new Date(activeComplaint.responTibaTkpAt) : null;
                                        const mTiba = tDisp && tTiba ? Math.max(1, Math.round((tTiba.getTime() - tDisp.getTime()) / 60000)) : null;
                                        return (
                                          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px', padding: '6px 9px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                              <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#F1F5F9' }}>2. Respon Anggota (Tanggap)</div>
                                              <div style={{ fontSize: '9.5px', color: '#94A3B8' }}>
                                                Target &le; 3 Menit ({tDisp ? tDisp.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'} ➔ {activeComplaint.status !== 'BELUM_DITANGANI' ? 'Diterima' : 'Menunggu'})
                                              </div>
                                            </div>
                                            <span style={{ fontSize: '9.5px', fontWeight: 700, background: '#065F46', color: '#34D399', padding: '2px 7px', borderRadius: '4px' }}>
                                              {activeComplaint.status !== 'BELUM_DITANGANI' ? '✓ Tanggap Cepat (2m)' : '● Belum Bergerak'}
                                            </span>
                                          </div>
                                        );
                                      })()}

                                      {/* SLA 3 */}
                                      <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid #0284C7', borderRadius: '6px', padding: '7px 9px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                          <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#F1F5F9' }}>3. Tempuh ke TKP (Target &le; 10m)</div>
                                          <span style={{ fontSize: '9px', fontWeight: 700, background: activeComplaint.status === 'MENUJU_TKP' ? '#0C4A6E' : '#065F46', color: activeComplaint.status === 'MENUJU_TKP' ? '#38BDF8' : '#34D399', padding: '2px 6px', borderRadius: '4px' }}>
                                            {activeComplaint.status === 'MENUJU_TKP' ? '● Sedang Meluncur' : ['PENANGANAN_TKP', 'SELESAI'].includes(activeComplaint.status) ? '● Tepat di TKP' : '● Standby'}
                                          </span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                          <div style={{ fontSize: '9.5px', color: '#94A3B8' }}>
                                            {activeComplaint.status === 'MENUJU_TKP'
                                              ? `Berangkat: ${activeComplaint.disposisiAt ? new Date(activeComplaint.disposisiAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'} WIB`
                                              : activeComplaint.responTibaTkpAt
                                              ? `Tiba: ${new Date(activeComplaint.responTibaTkpAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`
                                              : 'Estimasi: ± 4-6 Menit'}
                                          </div>
                                          <div style={{ fontFamily: 'inherit', fontSize: '14px', fontWeight: 800, color: '#38BDF8', letterSpacing: '0.3px' }}>
                                            {activeComplaint.status === 'MENUJU_TKP'
                                              ? formatSlaClock(slaClockSeconds)
                                              : activeComplaint.responseTimeMinutes
                                              ? `${activeComplaint.responseTimeMinutes} Menit`
                                              : '06:00'}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Disposisi Pasukan oleh Pawas */}
                                  <div style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '10px', padding: '12px 14px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                      <span style={{ fontSize: '11px', fontWeight: 800, color: '#1E293B' }}>🚔 DISPOSISI PASUKAN OLEH PAWAS</span>
                                      <span style={{ fontSize: '10px', fontWeight: 700, background: activeStatMeta.badge_bg, color: activeStatMeta.badge_color, border: `1px solid ${activeStatMeta.badge_border}`, padding: '2px 6px', borderRadius: '4px' }}>
                                        {activeStatMeta.key === 'SELESAI' ? 'Penanganan Selesai' : activeStatMeta.key === 'MENUNGGU' ? 'Menunggu Penugasan' : activeStatMeta.label}
                                      </span>
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#334155', lineHeight: 1.55 }}>
                                      <div>• <strong>Satuan Bertugas:</strong> {activeComplaint.assignedOfficer?.assignedPatrolVehicle || 'Patroli Samapta Presisi (Unit Roda 4)'}</div>
                                      <div>• <strong>Pimpinan Regu:</strong> {activeComplaint.assignedOfficer ? `${activeComplaint.assignedOfficer.rankPangkat} ${activeComplaint.assignedOfficer.namaLengkap} (NRP: ${activeComplaint.assignedOfficer.nrp})` : 'Menunggu Disposisi Pawas'}</div>
                                      <div>• <strong>Posisi Awal Armada:</strong> <span style={{ color: '#475569' }}>{activeComplaint.assignedOfficer?.jabatan || 'Polres Metro Jaksel / Posko Presisi'}</span></div>
                                      <div>• <strong>Waktu Disposisi:</strong> {activeComplaint.disposisiAt ? new Date(activeComplaint.disposisiAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB' : 'Dalam Antrean'}</div>
                                      <div style={{ marginTop: '4px', background: 'white', borderLeft: '3px solid #3B82F6', padding: '6px 8px', borderRadius: '0 6px 6px 0', fontSize: '11.5px', fontStyle: 'italic' }}>
                                        "{activeComplaint.timelines?.find((t: any) => t.tahapKe === 2 || t.tahapKe === 1)?.catatan || 'Datangi TKP dengan sirine biru, amankan perimeter, prioritaskan perlindungan warga dan amankan barang bukti.'}"
                                      </div>
                                      <div style={{ marginTop: '4px', background: '#EFF6FF', borderLeft: '3px solid #0284C7', padding: '6px 8px', borderRadius: '0 6px 6px 0', fontSize: '11.5px', color: '#0369A1' }}>
                                        <strong>🚔 Back-Up Siaga:</strong> {fleetUnits.find(u => u.nrp !== activeComplaint.assignedOfficer?.nrp)?.title || 'Unit Perintis Presisi R-2'} standby radius terdekat
                                      </div>
                                    </div>
                                  </div>

                                  {/* EKSEKUSI OPERASIONAL 1:1 PROTOTYPE (Disposisi Unit Cadangan / Backup) */}
                                  {['DISPOSISI', 'MENUJU_TKP', 'TIBA_DI_TKP'].includes(activeStatMeta.key) && (
                                    <>
                                      {/* Tombol Kerahkan Unit Cadangan / Back-Up */}
                                      <button
                                        type="button"
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

                                  {/* Tombol Sahkan & Tutup Kasus (Pawas) */}
                                  {(activeStatMeta.key === 'MENUNGGU_PENGESAHAN' || activeComplaint.status === 'PENANGANAN_TKP') && (
                                    <button
                                      type="button"
                                      onClick={() => handleSahkanPenutupanKasus(activeComplaint)}
                                      style={{
                                        width: '100%',
                                        padding: '13px',
                                        background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontSize: '13px',
                                        fontWeight: 800,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px',
                                        boxShadow: '0 3px 10px rgba(16,185,129,0.35)',
                                      }}
                                    >
                                      <span>✍️</span> Sahkan &amp; Tutup Kasus ➔
                                    </button>
                                  )}

                                  {/* Penilaian Warga (Muncul jika Selesai) */}
                                  {activeComplaint.status === 'SELESAI' && (
                                    <div style={{ background: '#FFFBEB', border: '1.5px solid #FDE68A', borderRadius: '8px', padding: '12px', boxShadow: '0 2px 6px rgba(245,158,11,0.08)' }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#B45309', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                          ⭐ Penilaian Warga (Portal 110)
                                        </span>
                                        <span style={{ fontSize: '13px', fontWeight: 800, color: '#D97706' }}>
                                          {activeComplaint.citizenRating ? `${'★'.repeat(activeComplaint.citizenRating)}${'☆'.repeat(5 - activeComplaint.citizenRating)} (${activeComplaint.citizenRating}/5)` : '★★★★★ (5/5)'}
                                        </span>
                                      </div>
                                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', margin: '6px 0' }}>
                                        {(activeComplaint.citizenTags ? activeComplaint.citizenTags.split(',').map((t: string) => t.trim()) : ['Respon Sangat Cepat', 'Petugas Ramah', 'Sangat Membantu']).map((t: string) => (
                                          <span key={t} style={{ fontSize: '10px', background: '#FEF3C7', color: '#92400E', padding: '2px 7px', borderRadius: '10px', fontWeight: 600 }}>
                                            {t}
                                          </span>
                                        ))}
                                      </div>
                                      <div style={{ fontSize: '12px', fontStyle: 'italic', color: '#78350F', background: 'white', padding: '8px 10px', borderRadius: '6px', border: '1px dashed #FCD34D', marginTop: '4px' }}>
                                        "{activeComplaint.citizenReview || 'Terima kasih bapak polisi sangat cepat tanggap langsung datang ke lokasi dan menyelesaikan laporan dengan tuntas!'}"
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
                      Pilih kartu laporan di sebelah kiri untuk melihat rincian kasus.
                    </div>
                  )}
                </div>

              </div>
            </section>
          )}

          {/* ======================================================== */}
          {/* SCREEN 5: KINERJA OPERASIONAL (view-laporan)             */}
          {/* ======================================================== */}
          {activeTab === 'view-laporan' && (
            <section id="view-laporan" className="view active" style={{ paddingBottom: '30px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '16px 20px 0', marginBottom: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 className="page-title" style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#153E75' }}>
                      Laporan Kinerja Operasional
                    </h2>
                    <span style={{ fontSize: '10px', fontWeight: 800, background: '#FEF3C7', color: '#B45309', padding: '2px 8px', borderRadius: '12px', border: '1px solid #FCD34D' }}>
                      PIKET 1X24 JAM
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: '3px' }}>
                    Posko Pengendalian • <strong>{userProfile.fullName} (NRP: {userProfile.nrp})</strong>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCetakModal(true)}
                  style={{ padding: '8px 14px', background: '#153E75', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <span>🖨️</span> Cetak Berkas PDF
                </button>
              </div>

              {/* Periode Tabs & Date Picker */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px 14px' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setKinerjaPeriod('harian')}
                    style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #CBD5E1', background: kinerjaPeriod === 'harian' ? '#153E75' : 'white', color: kinerjaPeriod === 'harian' ? 'white' : '#475569', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Harian (1x24 Jam)
                  </button>
                  <button
                    type="button"
                    onClick={() => setKinerjaPeriod('mingguan')}
                    style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #CBD5E1', background: kinerjaPeriod === 'mingguan' ? '#153E75' : 'white', color: kinerjaPeriod === 'mingguan' ? 'white' : '#475569', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Mingguan (7 Hari)
                  </button>
                  <button
                    type="button"
                    onClick={() => setKinerjaPeriod('bulanan')}
                    style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #CBD5E1', background: kinerjaPeriod === 'bulanan' ? '#153E75' : 'white', color: kinerjaPeriod === 'bulanan' ? 'white' : '#475569', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Bulanan
                  </button>
                </div>
                <input
                  type="date"
                  value={kinerjaDate}
                  onChange={(e) => setKinerjaDate(e.target.value)}
                  style={{ padding: '6px 10px', fontSize: '12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontWeight: 700, color: '#153E75' }}
                />
              </div>

              {/* 2 Donut Progress Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '0 20px 14px' }}>
                {(() => {
                  const samaptaTotal = allRecentComplaints.filter(c => c.assignedOfficer?.assignedPatrolVehicle?.toLowerCase().includes('samapta') || c.assignedOfficer?.jabatan?.toLowerCase().includes('samapta')).length;
                  const perintisTotal = allRecentComplaints.filter(c => c.assignedOfficer?.assignedPatrolVehicle?.toLowerCase().includes('raimas') || c.assignedOfficer?.assignedPatrolVehicle?.toLowerCase().includes('perintis') || c.assignedOfficer?.assignedPatrolVehicle?.toLowerCase().includes('trail')).length;
                  const lantasTotal = allRecentComplaints.filter(c => c.assignedOfficer?.assignedPatrolVehicle?.toLowerCase().includes('lantas') || c.assignedOfficer?.assignedPatrolVehicle?.toLowerCase().includes('turjawali')).length;
                  const grandTotal = Math.max(1, samaptaTotal + perintisTotal + lantasTotal);

                  return (
                    <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '14px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: '#1E293B', marginBottom: '8px' }}>
                        Beban Satuan Reaksi Cepat
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Samapta R-4</span>
                          <strong>{samaptaTotal} Penugasan ({Math.round((samaptaTotal / grandTotal) * 100)}%)</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Perintis R-2</span>
                          <strong>{perintisTotal} Penugasan ({Math.round((perintisTotal / grandTotal) * 100)}%)</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Turjawali Lantas</span>
                          <strong>{lantasTotal} Penugasan ({Math.round((lantasTotal / grandTotal) * 100)}%)</strong>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '14px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#1E293B', marginBottom: '8px' }}>
                    Waktu Tanggap Respon Patroli (&lt; 10m)
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ fontSize: '24px', fontWeight: 900, color: '#16A34A' }}>{onTimeRate}%</div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>
                      {onTimeCount} dari {completedWithTime.length || totalLaporan} insiden tertangani dalam batas standar target Mabes Polri.
                    </div>
                  </div>
                </div>
              </div>

              {/* Ringkasan Indikator Utama */}
              <div style={{ margin: '0 20px 14px', background: 'white', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '14px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: '10px' }}>
                  Indikator Utama Akuntabilitas Tugas (1x24 Jam)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>Waktu Respon Rata-rata Tiba TKP</div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#16A34A' }}>{avgResponseTime} Menit ({onTimeRate}%)</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>Total Laporan Masuk</div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#153E75' }}>{totalLaporan} Laporan</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>Armada Patroli Tergelar</div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#D97706' }}>{fleetUnits.length} Unit Siaga ({registeredUnits.length} Pers)</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>Indeks Kepuasan Warga</div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#10B981' }}>⭐ {satisfactionRating} / 5.0 ({satisfactionPercent}% Puas)</div>
                  </div>
                </div>
              </div>

              {/* Kejadian Menonjol Selama Piket 1x24 Jam Table */}
              <div style={{ margin: '0 20px 14px', background: 'white', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '14px' }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#1E293B', marginBottom: '10px' }}>
                  Kejadian Menonjol Selama Piket 1x24 Jam
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontWeight: 700 }}>
                        <th style={{ padding: '6px 8px' }}>No. Tiket</th>
                        <th style={{ padding: '6px 8px' }}>Waktu</th>
                        <th style={{ padding: '6px 8px' }}>Kejadian &amp; TKP</th>
                        <th style={{ padding: '6px 8px' }}>Satuan</th>
                        <th style={{ padding: '6px 8px' }}>Respon</th>
                        <th style={{ padding: '6px 8px' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allRecentComplaints.slice(0, 5).map((inc) => (
                        <tr key={inc.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '8px', fontFamily: 'monospace', fontWeight: 700 }}>{inc.nomorTiket}</td>
                          <td style={{ padding: '8px' }}>
                            {inc.createdAt ? new Date(inc.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB' : 'Hari ini'}
                          </td>
                          <td style={{ padding: '8px' }}><strong>{inc.jenisKejadian}</strong> - {inc.tkpAlamatTeks}</td>
                          <td style={{ padding: '8px' }}>
                            {inc.assignedOfficer?.assignedPatrolVehicle || (inc.assignedOfficer ? `${inc.assignedOfficer.rankPangkat} ${inc.assignedOfficer.namaLengkap}` : '-')}
                          </td>
                          <td style={{ padding: '8px', color: '#16A34A', fontWeight: 700 }}>
                            {inc.responseTimeMinutes ? `± ${inc.responseTimeMinutes} Menit` : '-'}
                          </td>
                          <td style={{ padding: '8px' }}>
                            <span style={{
                              background: inc.status === 'SELESAI' ? '#DCFCE7' : inc.status === 'MENUJU_TKP' ? '#DBEAFE' : inc.status === 'PENANGANAN_TKP' ? '#EDE9FE' : '#FEF3C7',
                              color: inc.status === 'SELESAI' ? '#15803D' : inc.status === 'MENUJU_TKP' ? '#1D4ED8' : inc.status === 'PENANGANAN_TKP' ? '#6D28D9' : '#B45309',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: 700
                            }}>
                              {inc.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bottom Action Button */}
              <div style={{ padding: '0 20px 24px' }}>
                <button
                  type="button"
                  onClick={() => setShowCetakModal(true)}
                  style={{ width: '100%', padding: '12px', background: '#153E75', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '13px', cursor: 'pointer' }}
                >
                  🖨️ Cetak / Ekspor Laporan Akhir Tugas Pawas (PDF)
                </button>
              </div>
            </section>
          )}

          {/* ======================================================== */}
          {/* SCREEN 6: PROFIL PETUGAS PAWAS (view-profil)            */}
          {/* ======================================================== */}
          {activeTab === 'view-profil' && (
            <section id="view-profil" className="view active" style={{ paddingBottom: '95px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #E2E8F0', background: 'white' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 className="page-title" style={{ margin: 0, fontSize: '18px' }}>Profil Petugas</h2>
                    <span style={{ background: '#EFF6FF', color: '#1D4ED8', fontSize: '11px', fontWeight: 800, padding: '3px 10px', borderRadius: '12px', border: '1px solid #DBEAFE' }}>
                      PAWAS
                    </span>
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
                    Sentra Pelayanan Kepolisian Terpadu (SPKT) • SIMAPRES
                  </div>
                </div>
              </div>

              <div style={{ margin: '20px auto', padding: '0 16px' }}>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', justifyContent: 'center', flexWrap: 'wrap' }}>

                  {/* Kolom Kiri: Kartu Identitas, Presensi, Pengaturan */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: '1 1 360px', maxWidth: '420px' }}>

                    {/* Kartu Identitas Petugas */}
                    <div
                      style={{
                        background: 'linear-gradient(135deg, #0F2D56 0%, #153E75 60%, #1E3A8A 100%)',
                        borderRadius: '16px',
                        padding: '20px',
                        color: 'white',
                        boxShadow: '0 12px 24px -4px rgba(21,62,117,0.3)',
                        position: 'relative',
                        border: '1px solid rgba(255,255,255,0.15)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '16px' }}>🛡️</span>
                          <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.8px', color: '#FDE68A' }}>
                            POLRES METRO JAKARTA SELATAN
                          </span>
                        </div>
                        <span style={{ fontSize: '9.5px', fontWeight: 800, background: 'rgba(16,185,129,0.25)', color: '#6EE7B7', border: '1px solid rgba(110,231,183,0.3)', padding: '2px 8px', borderRadius: '12px' }}>
                          {presensiStatus === 'SUDAH_MASUK' ? 'SIAGA PIKET AKTIF' : 'BELUM MASUK DINAS'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '16px' }}>
                        <img
                          src={userProfile.avatar}
                          alt="Avatar"
                          style={{ width: '76px', height: '76px', borderRadius: '12px', objectFit: 'cover', border: '2.5px solid #FBBF24' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#93C5FD', textTransform: 'uppercase' }}>
                            {userProfile.pangkat || 'KOMISARIS BESAR POLISI'}
                          </div>
                          <h3 style={{ fontSize: '16px', color: 'white', fontWeight: 800, margin: '2px 0 3px' }}>
                            {userProfile.fullName}
                          </h3>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: '#FDE68A', fontFamily: 'monospace' }}>
                            NRP: {userProfile.nrp}
                          </div>
                          <div style={{ fontSize: '10.5px', color: '#E2E8F0', marginTop: '3px' }}>
                            Perwira Pengawas (PAWAS) • Posko Pengendalian
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', background: 'rgba(0,0,0,0.25)', padding: '10px', borderRadius: '10px', textAlign: 'center' }}>
                        <div>
                          <div style={{ fontSize: '9.5px', color: '#94A3B8' }}>Total Laporan</div>
                          <div style={{ fontSize: '15px', fontWeight: 900, color: '#FBBF24' }}>{totalLaporan}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '9.5px', color: '#94A3B8' }}>Respon Cepat</div>
                          <div style={{ fontSize: '15px', fontWeight: 900, color: '#34D399' }}>96.4%</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '9.5px', color: '#94A3B8' }}>Laporan Selesai</div>
                          <div style={{ fontSize: '15px', fontWeight: 900, color: '#60A5FA' }}>{selesaiCount}</div>
                        </div>
                      </div>
                    </div>

                    {/* Kartu Presensi Petugas */}
                    <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '18px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '18px' }}>⏱️</span>
                          <div>
                            <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: 800, color: '#1E293B' }}>Presensi Piket</h4>
                            <div style={{ fontSize: '11px', color: '#64748B' }}>Pencatatan Kehadiran Tugas Piket</div>
                          </div>
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 800, color: '#153E75', fontFamily: 'monospace', background: '#EFF6FF', padding: '3px 8px', borderRadius: '6px', border: '1px solid #DBEAFE' }}>
                          {liveClock}
                        </span>
                      </div>

                      <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '12px', marginBottom: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '11.5px' }}>
                          <span style={{ color: '#64748B' }}>Status Kehadiran:</span>
                          <span style={{ fontWeight: 800, color: presensiStatus === 'SUDAH_MASUK' ? '#15803D' : '#B45309', background: presensiStatus === 'SUDAH_MASUK' ? '#DCFCE7' : '#FEF3C7', padding: '2px 8px', borderRadius: '6px' }}>
                            {presensiStatus === 'SUDAH_MASUK' ? '● Dinas Aktif' : '○ Belum Masuk Dinas'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '6px' }}>
                          <span style={{ color: '#64748B' }}>Jam Masuk Piket:</span>
                          <span style={{ fontWeight: 700, color: '#1E293B' }}>{jamMasukPiket}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '6px' }}>
                          <span style={{ color: '#64748B' }}>Jam Pulang / Lepas:</span>
                          <span style={{ fontWeight: 700, color: '#64748B' }}>{jamPulangPiket}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', borderTop: '1px dashed #E2E8F0', paddingTop: '6px', marginTop: '6px' }}>
                          <span style={{ color: '#64748B' }}>Radius Mako:</span>
                          <span style={{ fontWeight: 700, color: '#153E75' }}>📍 Area Mako Polres (Radius 50m)</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                          type="button"
                          onClick={handlePresensiMasuk}
                          disabled={presensiStatus === 'SUDAH_MASUK'}
                          style={{
                            flex: 1,
                            padding: '11px 12px',
                            background: presensiStatus === 'SUDAH_MASUK' ? '#E2E8F0' : '#10B981',
                            color: presensiStatus === 'SUDAH_MASUK' ? '#94A3B8' : 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 800,
                            fontSize: '12.5px',
                            cursor: presensiStatus === 'SUDAH_MASUK' ? 'default' : 'pointer',
                          }}
                        >
                          <span>✅</span> Presensi Masuk
                        </button>
                        <button
                          type="button"
                          onClick={handlePresensiPulang}
                          disabled={presensiStatus !== 'SUDAH_MASUK'}
                          style={{
                            flex: 1,
                            padding: '11px 12px',
                            background: presensiStatus !== 'SUDAH_MASUK' ? '#E2E8F0' : '#EF4444',
                            color: presensiStatus !== 'SUDAH_MASUK' ? '#94A3B8' : 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 800,
                            fontSize: '12.5px',
                            cursor: presensiStatus !== 'SUDAH_MASUK' ? 'not-allowed' : 'pointer',
                          }}
                        >
                          <span>🚪</span> Presensi Pulang
                        </button>
                      </div>
                    </div>

                    {/* Pengaturan Akun */}
                    <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '6px 14px' }}>
                      <div style={{ padding: '10px 6px 6px', fontSize: '12px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>
                        Pengaturan Akun Petugas
                      </div>
                      <div
                        onClick={() => setShowKeamananModal(true)}
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 6px', borderBottom: '1px solid #F1F5F9', cursor: 'pointer' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span>🔒</span>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B' }}>Keamanan Akun &amp; PIN Komando</div>
                            <div style={{ fontSize: '11px', color: '#64748B' }}>Ganti kata sandi login &amp; otorisasi PIN dinas</div>
                          </div>
                        </div>
                        <span style={{ color: '#94A3B8' }}>➔</span>
                      </div>

                      <div
                        onClick={async () => {
                          if (confirm('Keluar dari sesi komando Pawas?')) {
                            if (typeof window !== 'undefined') {
                              sessionStorage.removeItem('simapres_active_user');
                            }
                            await logoutAction();
                            window.location.href = '/?alert=logged_out';
                          }
                        }}
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 6px', cursor: 'pointer' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span>🚪</span>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 800, color: '#DC2626' }}>Logout / Keluar Sesi Dinas</div>
                            <div style={{ fontSize: '11px', color: '#F87171' }}>Akhiri sesi dan kembali ke portal masuk</div>
                          </div>
                        </div>
                        <span style={{ color: '#DC2626' }}>➔</span>
                      </div>
                    </div>

                  </div>

                  {/* Kolom Kanan: Riwayat Log Lengkap */}
                  <div style={{ flex: '1 1 450px', background: 'white', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '18px' }}>📋</span>
                          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#1E293B' }}>Riwayat Log Lengkap</h3>
                          <span style={{ background: '#EFF6FF', color: '#153E75', fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '10px', border: '1px solid #DBEAFE' }}>
                            {allRecentComplaints.length} Laporan
                          </span>
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
                          Rekam jejak seluruh penanganan laporan oleh jajaran posko
                        </div>
                      </div>

                      <input
                        type="text"
                        placeholder="Cari tiket, kasus, TKP..."
                        value={profilLogSearch}
                        onChange={(e) => setProfilLogSearch(e.target.value)}
                        style={{ fontSize: '11.5px', padding: '6px 10px', border: '1px solid #CBD5E1', borderRadius: '6px' }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px', flexWrap: 'wrap' }}>
                      {['semua', 'menunggu', 'diproses', 'selesai'].map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setProfilLogFilter(st)}
                          style={{
                            padding: '4px 10px',
                            fontSize: '11px',
                            fontWeight: 700,
                            borderRadius: '6px',
                            border: profilLogFilter === st ? '1px solid #BFDBFE' : '1px solid #E2E8F0',
                            background: profilLogFilter === st ? '#EFF6FF' : '#F8FAFC',
                            color: profilLogFilter === st ? '#153E75' : '#64748B',
                            cursor: 'pointer',
                          }}
                        >
                          {st.toUpperCase()}
                        </button>
                      ))}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '500px', overflowY: 'auto' }}>
                      {allRecentComplaints
                        .filter((c) => {
                          if (profilLogFilter === 'menunggu' && c.status !== 'BELUM_DITANGANI') return false;
                          if (profilLogFilter === 'diproses' && !['DISPOSISI', 'MENUJU_TKP', 'PENANGANAN_TKP'].includes(c.status)) return false;
                          if (profilLogFilter === 'selesai' && c.status !== 'SELESAI') return false;
                          if (profilLogSearch && !c.jenisKejadian?.toLowerCase().includes(profilLogSearch.toLowerCase()) && !c.nomorTiket?.toLowerCase().includes(profilLogSearch.toLowerCase())) {
                            return false;
                          }
                          return true;
                        })
                        .map((c) => (
                          <div
                            key={c.id}
                            style={{ padding: '10px 12px', border: '1px solid #E2E8F0', borderRadius: '8px', background: '#F8FAFC' }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                              <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '11.5px', color: '#153E75' }}>
                                {c.nomorTiket}
                              </span>
                              <span style={{ fontSize: '10px', fontWeight: 800, color: c.status === 'SELESAI' ? '#16A34A' : '#D97706' }}>
                                {c.status}
                              </span>
                            </div>
                            <div style={{ fontWeight: 700, fontSize: '12.5px', color: '#1E293B' }}>
                              {c.jenisKejadian}
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748B' }}>📍 {c.tkpAlamatTeks}</div>
                          </div>
                        ))}
                    </div>
                  </div>

                </div>
              </div>
            </section>
          )}

          {/* ======================================================== */}
          {/* SCREEN 7: OPERATOR CAD & SENTRA 110 (view-operator)      */}
          {/* ======================================================== */}
          {activeTab === 'view-operator' && (
            <section id="view-operator" className="view active" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div
                  onClick={() => switchTab('view-beranda')}
                  style={{ fontSize: '13px', fontWeight: 700, color: '#153E75', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <span>←</span> Kembali ke Beranda
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h2 className="page-title" style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>
                    Konsol Pengaduan &amp; Disposisi Terpadu
                  </h2>
                  <div style={{ color: '#64748B', fontSize: '12px' }}>
                    Perekaman Laporan Masyarakat Masuk &amp; Penugasan Unit Patroli
                  </div>
                </div>
                <span style={{ fontSize: '11.5px', fontWeight: 800, background: '#EFF6FF', color: '#1D4ED8', padding: '5px 12px', borderRadius: '8px', border: '1px solid #BFDBFE' }}>
                  👑 Akses Penuh: Input Laporan &amp; Disposisi Unit
                </span>
              </div>

              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                {/* Kolom Kiri: Panggilan Masuk & Form */}
                <div style={{ flex: '1 1 500px' }}>

                 

                  {/* Formulir Penerimaan Laporan */}
                  <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px', borderBottom: '1px solid #E2E8F0', paddingBottom: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: '#153E75' }}>📝 Formulir Penerimaan Laporan</span>
                      <span style={{ fontSize: '11px', color: '#64748B' }}>Petugas: <strong>{userProfile.fullName}</strong></span>
                    </div>

                    <div className="form-group" style={{ marginBottom: '12px' }}>
                      <label className="form-label" style={{ fontSize: '11.5px' }}>
                        Nomor Telepon Penelepon (Pelapor) <span style={{ color: 'red' }}>*</span>
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="text"
                          className="form-control"
                          value={simCaller.telepon}
                          onChange={(e) => setSimCaller({ ...simCaller, telepon: e.target.value })}
                          placeholder="0812xxxx"
                        />
                        <span
                          style={{
                            position: 'absolute',
                            right: '8px',
                            top: '8px',
                            bottom: '8px',
                            background: '#EFF6FF',
                            color: '#1D4ED8',
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          ✓ Terverifikasi
                        </span>
                      </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: '12px' }}>
                      <label className="form-label" style={{ fontSize: '11.5px' }}>
                        Nama Warga Pelapor <span style={{ color: 'red' }}>*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={simCaller.nama}
                        onChange={(e) => setSimCaller({ ...simCaller, nama: e.target.value })}
                        placeholder="Nama pelapor"
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: '12px' }}>
                      <label className="form-label" style={{ fontSize: '11.5px' }}>
                        Kategori / Jenis Insiden <span style={{ color: 'red' }}>*</span>
                      </label>
                      <select
                        className="form-control"
                        style={{ fontWeight: 600 }}
                        value={simCaller.kategori}
                        onChange={(e) => setSimCaller({ ...simCaller, kategori: e.target.value })}
                      >
                        <option value="">-- Pilih Kategori Insiden --</option>
                        {dbCategories.map((cat) => (
                          <option key={cat.id || cat.key} value={cat.label || cat.key}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Tingkat Urgensi Presisi (Prototype L2088-2106) */}
                    <div className="form-group" style={{ marginBottom: '12px' }}>
                      <label className="form-label" style={{ fontSize: '11.5px' }}>
                        Tingkat Urgensi Penanganan <span style={{ color: 'red' }}>*</span>
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                        <button
                          type="button"
                          id="eb-urg-darurat"
                          onClick={() => setSimCaller({ ...simCaller, urgensi: 'DARURAT' })}
                          style={{
                            padding: '8px 4px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 700,
                            border: simCaller.urgensi === 'DARURAT' ? '1.5px solid #EF4444' : '1px solid #CBD5E1',
                            background: simCaller.urgensi === 'DARURAT' ? '#FEF2F2' : 'white',
                            color: simCaller.urgensi === 'DARURAT' ? '#DC2626' : '#64748B',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          🚨 DARURAT
                        </button>
                        <button
                          type="button"
                          id="eb-urg-sedang"
                          onClick={() => setSimCaller({ ...simCaller, urgensi: 'SEDANG' })}
                          style={{
                            padding: '8px 4px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 700,
                            border: simCaller.urgensi === 'SEDANG' ? '1.5px solid #F59E0B' : '1px solid #CBD5E1',
                            background: simCaller.urgensi === 'SEDANG' ? '#FFFBEB' : 'white',
                            color: simCaller.urgensi === 'SEDANG' ? '#D97706' : '#64748B',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          ⚠️ SEDANG
                        </button>
                        <button
                          type="button"
                          id="eb-urg-normal"
                          onClick={() => setSimCaller({ ...simCaller, urgensi: 'NORMAL' })}
                          style={{
                            padding: '8px 4px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 700,
                            border: simCaller.urgensi === 'NORMAL' ? '1.5px solid #3B82F6' : '1px solid #CBD5E1',
                            background: simCaller.urgensi === 'NORMAL' ? '#EFF6FF' : 'white',
                            color: simCaller.urgensi === 'NORMAL' ? '#1D4ED8' : '#64748B',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          ℹ️ NORMAL
                        </button>
                      </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: '12px' }}>
                      <label className="form-label" style={{ fontSize: '11.5px' }}>
                        Lokasi Kejadian (TKP) &amp; Sektor <span style={{ color: 'red' }}>*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={simCaller.alamat}
                        onChange={(e) => setSimCaller({ ...simCaller, alamat: e.target.value })}
                      />
                    </div>

                    {/* Koordinat GPS Satelit Terkunci Otomatis (Prototype L2115-2119) */}
                    <div className="form-group" style={{ marginBottom: '12px' }}>
                      <label className="form-label" style={{ fontSize: '11.5px' }}>
                        Koordinat GPS Satelit (Terkunci Otomatis)
                      </label>
                      <input
                        type="text"
                        id="eb-op-gps"
                        className="form-control"
                        placeholder="Koordinat GPS (Otomatis saat terisi)"
                        value={simCaller.lat && simCaller.lng ? `${simCaller.lat}, ${simCaller.lng}` : ''}
                        readOnly
                        style={{
                          background: '#F8FAFC',
                          color: '#2563EB',
                          fontFamily: 'monospace',
                          fontWeight: 600,
                        }}
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: '16px' }}>
                      <label className="form-label" style={{ fontSize: '11.5px' }}>
                        Ringkasan Uraian Kejadian Dari Penelepon <span style={{ color: 'red' }}>*</span>
                      </label>
                      <textarea
                        className="form-control"
                        rows={3}
                        style={{ minHeight: '85px', fontSize: '12.5px', lineHeight: 1.5 }}
                        placeholder="Tuliskan keterangan pelapor..."
                        value={simCaller.uraian}
                        onChange={(e) => setSimCaller({ ...simCaller, uraian: e.target.value })}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={async () => {
                          setLoading(true);
                          const res = await createComplaintAction({
                            namaPelapor: simCaller.nama,
                            noHpPelapor: simCaller.telepon,
                            kategoriLaporan: simCaller.kategori,
                            kategoriKey: simCaller.kategori,
                            platformKey: 'layanan110',
                            urgensi: (simCaller as any).urgensi,
                            tkpAlamatTeks: simCaller.alamat,
                            tkpLat: simCaller.lat,
                            tkpLng: simCaller.lng,
                            deskripsiKejadian: simCaller.uraian,
                            saluranLaporan: 'CALL_110',
                            operatorId: session?.userId ? String(session.userId) : null,
                          });
                          setLoading(false);
                          if (res.success) {
                            alert('✓ Laporan darurat 110 berhasil disimpan ke antrean Pawas!');
                            setSimCaller({
                              nama: '',
                              telepon: '',
                              alamat: '',
                              kategori: '',
                              urgensi: '',
                              uraian: '',
                              lat: 0,
                              lng: 0,
                            });
                            loadData();
                          } else {
                            alert(res.error || 'Gagal menyimpan antrean.');
                          }
                        }}
                        style={{ flex: 1, padding: '12px', background: '#0F766E', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '12.5px', cursor: 'pointer' }}
                      >
                        💾 Simpan ke Antrean
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          setLoading(true);
                          const res = await createComplaintAction({
                            namaPelapor: simCaller.nama,
                            noHpPelapor: simCaller.telepon,
                            kategoriLaporan: simCaller.kategori,
                            kategoriKey: simCaller.kategori,
                            platformKey: 'layanan110',
                            urgensi: (simCaller as any).urgensi,
                            tkpAlamatTeks: simCaller.alamat,
                            tkpLat: simCaller.lat,
                            tkpLng: simCaller.lng,
                            deskripsiKejadian: simCaller.uraian,
                            saluranLaporan: 'CALL_110',
                            operatorId: session?.userId ? String(session.userId) : null,
                          });
                          setLoading(false);
                          if (res.success && res.data) {
                            bukaModalDisposisi(res.data);
                            setSimCaller({
                              nama: '',
                              telepon: '',
                              alamat: '',
                              kategori: '',
                              urgensi: '',
                              uraian: '',
                              lat: 0,
                              lng: 0,
                            });
                            loadData();
                          }
                        }}
                        style={{ flex: 1.4, padding: '12px', background: 'linear-gradient(135deg, #153E75 0%, #1D4ED8 100%)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '13px', cursor: 'pointer' }}
                      >
                        ⚡ Simpan &amp; Disposisi ➔
                      </button>
                    </div>
                  </div>

                </div>

                {/* Kolom Kanan: Antrean Laporan & Disposisi Live */}
                <div style={{ flex: '1 1 350px' }}>
                  <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #E2E8F0', paddingBottom: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: '#1E293B' }}>📋 Antrean Menunggu Disposisi</span>
                      <span style={{ background: '#F59E0B', color: 'white', fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '10px' }}>
                        {antreanPawas.length}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '550px', overflowY: 'auto' }}>
                      {antreanPawas.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#64748B', fontSize: '12px' }}>
                          Tidak ada antrean menunggu disposisi saat ini.
                        </div>
                      ) : (
                        antreanPawas.map((item) => (
                          <div
                            key={item.id}
                            style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px 12px' }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '11.5px', color: '#153E75' }}>
                                {item.nomorTiket}
                              </span>
                              {(() => {
                                const urgKey = (item.urgensi === 'DARURAT' || item.urgensi === 'PRIORITAS_TINGGI') ? 'DARURAT' : item.urgensi === 'SEDANG' ? 'SEDANG' : 'NORMAL';
                                const urgBg = urgKey === 'DARURAT' ? '#FEE2E2' : urgKey === 'SEDANG' ? '#FEF3C7' : '#EFF6FF';
                                const urgColor = urgKey === 'DARURAT' ? '#DC2626' : urgKey === 'SEDANG' ? '#D97706' : '#1D4ED8';
                                return (
                                  <span style={{ fontSize: '10px', background: urgBg, color: urgColor, fontWeight: 800, padding: '1px 6px', borderRadius: '4px' }}>
                                    {urgKey}
                                  </span>
                                );
                              })()}
                            </div>
                            <div style={{ fontWeight: 800, fontSize: '12.5px', color: '#1E293B', marginBottom: '2px' }}>
                              {item.jenisKejadian}
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '8px' }}>
                              📍 {item.tkpAlamatTeks}
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                bukaModalDisposisi(item);
                              }}
                              style={{ width: '100%', padding: '7px', background: '#153E75', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 800, fontSize: '11.5px', cursor: 'pointer' }}
                            >
                              ⚡ Disposisi Unit Sekarang ➔
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </section>
          )}

          {/* ======================================================== */}
          {/* SCREEN 8: FORM ALASAN PENOLAKAN LOG (view-tolak)         */}
          {/* ======================================================== */}
          {activeTab === 'view-tolak' && (
            <section id="view-tolak" className="view active" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div
                  onClick={() => switchTab('view-validasi')}
                  style={{ fontSize: '13px', fontWeight: 700, color: '#153E75', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <span>←</span> Kembali ke Validasi
                </div>
                <span style={{ fontSize: '11px', background: '#FEE2E2', color: '#DC2626', fontWeight: 700, padding: '4px 10px', borderRadius: '20px' }}>
                  Revisi Laporan
                </span>
              </div>

              <h2 className="page-title" style={{ fontSize: '18px', fontWeight: 800, marginBottom: '4px' }}>
                Alasan Penolakan Log
              </h2>
              <div style={{ color: '#64748B', fontSize: '12px', marginBottom: '16px' }}>
                Silakan isi alasan penolakan dan arahan revisi yang akan dikirimkan kepada personel.
              </div>

              {tolakComplaint && (
                <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '14px', marginBottom: '16px' }}>
                  <div style={{ fontWeight: 800, fontSize: '13px', color: '#153E75', marginBottom: '2px' }}>
                    {tolakComplaint.nomorTiket} - {tolakComplaint.jenisKejadian}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748B' }}>
                    📍 {tolakComplaint.tkpAlamatTeks} • Pelapor: {tolakComplaint.pelaporNama}
                  </div>
                </div>
              )}

              <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px' }}>
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: 700 }}>
                    Kategori Alasan Penolakan <span style={{ color: 'red' }}>*</span>
                  </label>
                  <select
                    className="form-control"
                    value={tolakKategori}
                    onChange={(e) => setTolakKategori(e.target.value)}
                  >
                    <option value="Foto Bukti Tidak Jelas / Buram">📸 Foto Bukti Tidak Jelas / Buram</option>
                    <option value="Uraian Kegiatan Belum Lengkap">📝 Uraian Kegiatan Belum Lengkap</option>
                    <option value="Lokasi GPS Tidak Sesuai">📍 Lokasi GPS Tidak Sesuai</option>
                    <option value="Laporan Terindikasi Duplikat">📑 Laporan Terindikasi Duplikat</option>
                    <option value="Tidak Memenuhi Standar Operasional (SOP)">⚠️ Tidak Memenuhi Standar Operasional (SOP)</option>
                    <option value="Lainnya">✏️ Alasan Lainnya</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: 700 }}>
                    Catatan &amp; Arahan Revisi untuk Personel <span style={{ color: 'red' }}>*</span>
                  </label>
                  <textarea
                    className="form-control"
                    rows={4}
                    value={tolakAlasan}
                    onChange={(e) => setTolakAlasan(e.target.value)}
                    placeholder="Tuliskan catatan perbaikan secara spesifik, misalnya: Foto lampiran kurang jelas dan titik lokasi tidak terlihat..."
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => switchTab('view-validasi')}
                    style={{ flex: 1, padding: '10px', background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '8px', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitPenolakan}
                    disabled={loading}
                    style={{ flex: 2, padding: '10px', background: '#DC2626', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '12px', cursor: 'pointer' }}
                  >
                    <span>✕</span> Konfirmasi Tolak &amp; Minta Revisi
                  </button>
                </div>
              </div>
            </section>
          )}

        </main>

        {/* ======================================================== */}
        {/* BOTTOM NAVIGATION (Identik 1:1 Prototype e-tribrata-log) */}
        {/* ======================================================== */}
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
          {roleParam === 'operator' ? (
            <div
              id="nav-operator"
              className={`nav-item ${activeTab === 'view-operator' ? 'active' : ''}`}
              onClick={() => switchTab('view-operator')}
            >
              <span className="nav-icon">🎧</span>
              <span>Operator 110</span>
            </div>
          ) : roleParam === 'personel' ? (
            <div
              id="nav-log"
              className={`nav-item ${activeTab === 'view-log' ? 'active' : ''}`}
              onClick={() => switchTab('view-log')}
            >
              <span className="nav-icon">➕</span>
              <span>Buat Log (+)</span>
            </div>
          ) : (
            <div
              id="nav-validasi"
              className={`nav-item ${activeTab === 'view-validasi' ? 'active' : ''}`}
              onClick={() => switchTab('view-validasi')}
            >
              <span className="nav-icon">👮</span>
              <span>Komando Pawas</span>
            </div>
          )}
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
      {/* MODAL DISPOSISI TAKTIS PAWAS                             */}
      {/* ======================================================== */}
      {showDisposisiModal && selectedDisposisiItem && (
        <div
          id="modal-disposisi-pawas"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            background: 'rgba(15,23,42,0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setShowDisposisiModal(false)}
        >
          <div
            style={{
              background: 'white',
              width: '100%',
              maxWidth: '620px',
              borderRadius: '14px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              overflow: 'hidden',
              border: '1px solid #CBD5E1',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '90vh',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                background: 'linear-gradient(135deg, #153E75 0%, #0F2A52 100%)',
                color: 'white',
                padding: '16px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '2px solid #F59E0B',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '20px' }}>👮</span>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 800 }}>LEMBAR DISPOSISI TAKTIS UNIT</div>
                  <div style={{ fontSize: '11px', opacity: 0.85 }}>Posko Pengendalian Operasi Kepolisian</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDisposisiModal(false)}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: '28px', height: '28px', borderRadius: '50%', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Body */}
            {(() => {
              const sopRecommendation = getSopRecommendationByIncident(selectedDisposisiItem);
              const calculatedArmadas = daftarArmadaAktif.map((armada) => {
                const isPrimarySop = armada.id === sopRecommendation.primarySatuanId;
                const isSecondarySop = sopRecommendation.secondarySatuanIds.includes(armada.id);

                let multiplier = 1.0;
                if (isPrimarySop) multiplier = 0.7;
                else if (isSecondarySop) multiplier = 0.85;

                const jarakCalc = +(armada.jarakBase * multiplier).toFixed(1);
                const etaCalc = Math.max(2, Math.round(armada.etaBase * multiplier));

                return {
                  ...armada,
                  isPrimarySop,
                  isSecondarySop,
                  jarakCalc,
                  etaCalc,
                };
              });

              const primaryArmadas = calculatedArmadas.filter((a) => a.isPrimarySop);
              const backupArmadas = calculatedArmadas.filter((a) => !a.isPrimarySop);
              const activeArmada = calculatedArmadas.find((a) => a.id === activePreviewSatuanKey) || primaryArmadas[0] || calculatedArmadas[0];

              const isPersonel =
                selectedDisposisiItem.platformKey === 'personel' ||
                selectedDisposisiItem.tipePelapor === 'personel' ||
                selectedDisposisiItem.pelaporTipe === 'PERSONEL' ||
                Boolean(selectedDisposisiItem.pelaporNrp && selectedDisposisiItem.pelaporNrp.trim()) ||
                Boolean(selectedDisposisiItem.nrp && selectedDisposisiItem.nrp.trim());

              const isWarga = !isPersonel;

              const saluranSumber =
                selectedDisposisiItem.platformRel?.label ||
                (selectedDisposisiItem.platformKey === 'warga'
                  ? 'Portal Pengaduan Warga'
                  : selectedDisposisiItem.platformKey === 'sos'
                  ? 'Tombol Darurat SOS Presisi'
                  : selectedDisposisiItem.platformKey === 'layanan110'
                  ? 'Call Center 110'
                  : selectedDisposisiItem.saluranLaporan || 'Call Center 110');

              const badgePelapor = isPersonel
                ? '👮 Patroli Internal'
                : selectedDisposisiItem.platformKey === 'sos'
                ? '🚨 Peringatan SOS Warga'
                : '👤 Laporan Pengaduan Warga';

              return (
                <div style={{ padding: '18px 20px', overflowY: 'auto', flex: 1 }}>
                  {/* Top Yellow Banner: Nomor Tiket & Target SLA Respon */}
                  <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: '10px', padding: '12px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '10px', fontWeight: 800, color: '#B45309', textTransform: 'uppercase' }}>NOMOR TIKET RESMI</div>
                      <div style={{ fontSize: '15px', fontWeight: 900, fontFamily: 'monospace', color: '#92400E' }}>
                        {selectedDisposisiItem.nomorTiket}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '10px', fontWeight: 800, color: '#B45309', textTransform: 'uppercase' }}>TARGET SLA RESPON</div>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#B45309' }}>⚡ &lt; 10 Menit Tiba di TKP</div>
                    </div>
                  </div>

                  {/* Kasus / Lokasi TKP Box */}
                  <div style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '10px', padding: '12px', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B' }}>Kasus / Lokasi TKP:</div>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: isWarga ? '#EFF6FF' : '#FEF3C7',
                          color: isWarga ? '#1D4ED8' : '#92400E',
                          border: isWarga ? '1px solid #BFDBFE' : '1px solid #FDE68A',
                        }}
                      >
                        {badgePelapor}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A', marginBottom: '2px' }}>
                      {selectedDisposisiItem.jenisKejadian || selectedDisposisiItem.title}
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#475569', marginBottom: '6px' }}>
                      📍 {selectedDisposisiItem.tkpAlamatTeks || selectedDisposisiItem.alamatTeks}
                    </div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: isWarga ? '#1E40AF' : '#92400E',
                        background: isWarga ? '#EFF6FF' : '#FFFBEB',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: isWarga ? '1px dashed #93C5FD' : '1px dashed #FCD34D',
                      }}
                    >
                      {isWarga ? (
                        <>👤 Pelapor: <strong>{selectedDisposisiItem.pelaporNama || selectedDisposisiItem.nama}</strong> {selectedDisposisiItem.pelaporHp || selectedDisposisiItem.noTelpPelapor ? `(${selectedDisposisiItem.pelaporHp || selectedDisposisiItem.noTelpPelapor})` : ''} via {saluranSumber}</>
                      ) : (
                        <>👮 Pelapor: <strong>{selectedDisposisiItem.pelaporNama || selectedDisposisiItem.nama}</strong> (NRP: {selectedDisposisiItem.pelaporNrp || selectedDisposisiItem.nrp || '-'}){selectedDisposisiItem.pelaporPangkat || selectedDisposisiItem.kesatuan ? ` • ${selectedDisposisiItem.pelaporPangkat || ''} ${selectedDisposisiItem.kesatuan || ''}` : ''}</>
                      )}
                    </div>
                  </div>

                  {/* 1. Disposisi ke Satuan Tugas (Broadcast Persatuan): * */}
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 800, color: '#1E293B' }}>
                        1. Disposisi ke Satuan Tugas (Broadcast Persatuan): <span style={{ color: '#DC2626' }}>*</span>
                      </label>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          background: '#DCFCE7',
                          color: '#166534',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          border: '1px solid #86EFAC',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <span>⚡</span> BROADCAST SATUAN AKTIF
                      </span>
                    </div>

                    {/* Container Multi-Satuan Checkbox */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {/* Kelompok Satuan Utama (SOP) */}
                      {primaryArmadas.length > 0 && (
                        <div>
                          <div style={{ fontSize: '11px', fontWeight: 800, color: '#B45309', marginTop: '2px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span>⭐</span> SATUAN RESPON UTAMA (SESUAI SOP TUPOKSI):
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '6px', marginBottom: '6px' }}>
                            {primaryArmadas.map((a) => {
                              const isChecked = selectedSatuanKeys.includes(a.id);
                              return (
                                <div
                                  key={a.id}
                                  onClick={() => toggleSatuanSelection(a.id)}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '8px 12px',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s',
                                    background: isChecked ? '#EFF6FF' : '#FFFFFF',
                                    border: `2px solid ${isChecked ? '#2563EB' : '#E2E8F0'}`,
                                    boxShadow: isChecked ? '0 2px 6px rgba(37,99,235,0.15)' : 'none',
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => toggleSatuanSelection(a.id)}
                                      onClick={(e) => e.stopPropagation()}
                                      style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#2563EB' }}
                                    />
                                    <span style={{ fontSize: '13px', fontWeight: 800, color: isChecked ? '#1E40AF' : '#1E293B' }}>
                                      {a.icon} {a.namaSingkat}
                                    </span>
                                  </div>
                                  <span style={{ fontSize: '10px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', background: '#FEF3C7', color: '#B45309', border: '1px solid #FCD34D' }}>
                                    UTAMA
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Kelompok Satuan Pendukung / Back-up */}
                      {backupArmadas.length > 0 && (
                        <div>
                          <div style={{ fontSize: '11px', fontWeight: 800, color: '#475569', marginTop: '4px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span>🛡️</span> SATUAN PENDUKUNG / PERKUATAN (BACK-UP OPS):
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                            {backupArmadas.map((a) => {
                              const isChecked = selectedSatuanKeys.includes(a.id);
                              return (
                                <div
                                  key={a.id}
                                  onClick={() => toggleSatuanSelection(a.id)}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '8px 12px',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s',
                                    background: isChecked ? '#F0FDF4' : '#FFFFFF',
                                    border: `2px solid ${isChecked ? '#16A34A' : '#E2E8F0'}`,
                                    boxShadow: isChecked ? '0 2px 6px rgba(22,163,74,0.15)' : 'none',
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => toggleSatuanSelection(a.id)}
                                      onClick={(e) => e.stopPropagation()}
                                      style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#16A34A' }}
                                    />
                                    <span style={{ fontSize: '13px', fontWeight: 700, color: isChecked ? '#15803D' : '#334155' }}>
                                      {a.icon} {a.namaSingkat}
                                    </span>
                                  </div>
                                  <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: '#F1F5F9', color: '#64748B' }}>
                                    {a.isSecondarySop ? 'REKOMENDASI' : 'CADANGAN'}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 2. Alokasi Kuat Personel SOP (Pembatasan Kuota Maksimal Anggota ke TKP) */}
                  <div style={{ marginBottom: '14px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px 12px' }}>
                    <div style={{ marginBottom: '6px' }}>
                      <label style={{ fontSize: '11.5px', fontWeight: 800, color: '#1E293B' }}>
                        2. Alokasi Kuat Personel (Batas Maksimal Anggota ke TKP): <span style={{ color: '#DC2626' }}>*</span>
                      </label>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                      <label
                        onClick={() => setKuotaPersonel(2)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '8px 6px',
                          border: kuotaPersonel === 2 ? '2px solid #2563EB' : '2px solid #E2E8F0',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          background: kuotaPersonel === 2 ? '#EFF6FF' : 'white',
                          textAlign: 'center',
                          transition: 'all 0.15s',
                        }}
                      >
                        <input
                          type="radio"
                          name="kuota-pers"
                          checked={kuotaPersonel === 2}
                          onChange={() => setKuotaPersonel(2)}
                          style={{ marginBottom: '4px', accentColor: '#2563EB' }}
                        />
                        <span style={{ fontSize: '11px', fontWeight: 800, color: kuotaPersonel === 2 ? '#1E40AF' : '#0F172A' }}>2 Personel</span>
                        <span style={{ fontSize: '9.5px', color: '#64748B' }}>Buddy System</span>
                      </label>

                      <label
                        onClick={() => setKuotaPersonel(4)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '8px 6px',
                          border: kuotaPersonel === 4 ? '2px solid #2563EB' : '2px solid #E2E8F0',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          background: kuotaPersonel === 4 ? '#EFF6FF' : 'white',
                          textAlign: 'center',
                          transition: 'all 0.15s',
                        }}
                      >
                        <input
                          type="radio"
                          name="kuota-pers"
                          checked={kuotaPersonel === 4}
                          onChange={() => setKuotaPersonel(4)}
                          style={{ marginBottom: '4px', accentColor: '#2563EB' }}
                        />
                        <span style={{ fontSize: '11px', fontWeight: 800, color: kuotaPersonel === 4 ? '#1E40AF' : '#1E293B' }}>4 Personel</span>
                        <span style={{ fontSize: '9.5px', color: '#2563EB', fontWeight: 700 }}>1 Unit Patroli ★</span>
                      </label>

                      <label
                        onClick={() => setKuotaPersonel(6)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '8px 6px',
                          border: kuotaPersonel === 6 ? '2px solid #2563EB' : '2px solid #E2E8F0',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          background: kuotaPersonel === 6 ? '#EFF6FF' : 'white',
                          textAlign: 'center',
                          transition: 'all 0.15s',
                        }}
                      >
                        <input
                          type="radio"
                          name="kuota-pers"
                          checked={kuotaPersonel === 6}
                          onChange={() => setKuotaPersonel(6)}
                          style={{ marginBottom: '4px', accentColor: '#2563EB' }}
                        />
                        <span style={{ fontSize: '11px', fontWeight: 800, color: kuotaPersonel === 6 ? '#1E40AF' : '#0F172A' }}>6 Personel</span>
                        <span style={{ fontSize: '9.5px', color: '#64748B' }}>Regu Terpadu</span>
                      </label>

                      <label
                        onClick={() => setKuotaPersonel(8)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '8px 6px',
                          border: kuotaPersonel === 8 ? '2px solid #2563EB' : '2px solid #E2E8F0',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          background: kuotaPersonel === 8 ? '#EFF6FF' : 'white',
                          textAlign: 'center',
                          transition: 'all 0.15s',
                        }}
                      >
                        <input
                          type="radio"
                          name="kuota-pers"
                          checked={kuotaPersonel === 8}
                          onChange={() => setKuotaPersonel(8)}
                          style={{ marginBottom: '4px', accentColor: '#2563EB' }}
                        />
                        <span style={{ fontSize: '11px', fontWeight: 800, color: kuotaPersonel === 8 ? '#1E40AF' : '#0F172A' }}>8 Personel</span>
                        <span style={{ fontSize: '9.5px', color: '#DC2626', fontWeight: 700 }}>Kontinjensi</span>
                      </label>
                    </div>
                  </div>

                  {/* 3. Instruksi Taktis Komando dengan Template Cepat */}
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                      <label style={{ fontSize: '11.5px', fontWeight: 800, color: '#1E293B' }}>
                        3. Instruksi Taktis &amp; Petunjuk Khusus Operasi: <span style={{ color: '#DC2626' }}>*</span>
                      </label>
                      <span style={{ fontSize: '10px', color: '#64748B' }}>Klik template untuk arahan cepat:</span>
                    </div>

                    {/* Quick Template Chips */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '8px' }}>
                      <button
                        type="button"
                        onClick={() => tambahArahanCepatPawas('🚨 Sirine Biru & Quick Response: Prioritaskan tiba < 10 menit.')}
                        style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', padding: '3px 8px', borderRadius: '6px', fontSize: '10.5px', fontWeight: 700, cursor: 'pointer' }}
                      >
                        🚨 Sirine Biru
                      </button>
                      <button
                        type="button"
                        onClick={() => tambahArahanCepatPawas('🛡️ Amankan perimeter TKP dan utamakan keselamatan warga/korban.')}
                        style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', padding: '3px 8px', borderRadius: '6px', fontSize: '10.5px', fontWeight: 700, cursor: 'pointer' }}
                      >
                        🛡️ Amankan Perimeter
                      </button>
                      <button
                        type="button"
                        onClick={() => tambahArahanCepatPawas('📹 Wajib aktifkan bodycam dan segera dokumentasikan bukti visual.')}
                        style={{ background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0', padding: '3px 8px', borderRadius: '6px', fontSize: '10.5px', fontWeight: 700, cursor: 'pointer' }}
                      >
                        📹 Rekam Bodycam
                      </button>
                      <button
                        type="button"
                        onClick={() => tambahArahanCepatPawas('🤝 Koordinasikan dengan pihak RT/RW dan tokoh masyarakat setempat.')}
                        style={{ background: '#FFFBEB', color: '#B45309', border: '1px solid #FDE68A', padding: '3px 8px', borderRadius: '6px', fontSize: '10.5px', fontWeight: 700, cursor: 'pointer' }}
                      >
                        🤝 Koordinasi Warga
                      </button>
                    </div>

                    <textarea
                      className="form-control"
                      rows={3}
                      value={arahanPawas}
                      onChange={(e) => setArahanPawas(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '12px', color: '#0F172A', outline: 'none', lineHeight: 1.5, boxSizing: 'border-box' }}
                    />
                  </div>

                  <div style={{ background: '#EFF6FF', borderLeft: '3px solid #3B82F6', padding: '10px 12px', borderRadius: '0 8px 8px 0', fontSize: '11px', color: '#1E40AF', lineHeight: 1.45 }}>
                    <strong>⚖️ SOP Rantai Komando Presisi:</strong> Setelah disposisi diteken, tiket langsung diterbitkan, status berpindah ke <em>Tahap 3 (Personel Bergerak Menuju TKP)</em>, jam hitung mundur SLA (&lt; 10 menit) aktif otomatis, dan petugas lapangan menerima notifikasi penugasan.
                  </div>
                </div>
              );
            })()}

            {/* Modal Footer */}
            <div style={{ padding: '12px 20px', borderTop: '1px solid #E2E8F0', background: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setShowDisposisiModal(false)}
                style={{ padding: '10px 16px', background: '#F1F5F9', color: '#475569', fontSize: '12px', fontWeight: 700, border: '1px solid #CBD5E1', borderRadius: '8px', cursor: 'pointer' }}
              >
                Batalkan
              </button>
              <button
                type="button"
                onClick={handleConfirmDisposisi}
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #153E75 0%, #1E40AF 100%)',
                  color: 'white',
                  fontSize: '13px',
                  fontWeight: 800,
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 3px 10px rgba(21,62,117,0.3)',
                }}
              >
                {loading ? 'Menerbitkan...' : '🚀 Terbitkan Disposisi Tugas ➔'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL SUKSES DISPOSISI TAKTIS                           */}
      {/* ======================================================== */}
      {showSuksesModal && suksesDisposisiData && (
        <div
          id="modal-sukses-disposisi"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999999,
            background: 'rgba(15,23,42,0.82)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setShowSuksesModal(false)}
        >
          <div
            style={{
              background: 'white',
              width: '100%',
              maxWidth: '520px',
              borderRadius: '16px',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.45)',
              overflow: 'hidden',
              border: '1px solid #CBD5E1',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ background: 'linear-gradient(135deg, #064E3B 0%, #065F46 60%, #047857 100%)', color: 'white', padding: '24px 20px', textAlign: 'center' }}>
              <div style={{ width: '58px', height: '58px', background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.4)', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', marginBottom: '12px' }}>
                ✓
              </div>
              <div style={{ fontSize: '17px', fontWeight: 900, textTransform: 'uppercase' }}>
                Perintah Disposisi Berhasil Diterbitkan!
              </div>
              <div style={{ fontSize: '12px', color: '#A7F3D0', marginTop: '4px' }}>
                Instruksi operasi telah ditransmisikan ke radio panggil &amp; konsol petugas lapangan
              </div>
            </div>

            <div style={{ padding: '18px 20px' }}>
              <div style={{ background: '#FEF3C7', border: '1.5px dashed #F59E0B', borderRadius: '10px', padding: '10px 14px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: '#B45309' }}>NOMOR TIKET RESMI</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '16px', fontWeight: 900, color: '#92400E' }}>
                    {suksesDisposisiData.nomorTiket}
                  </div>
                </div>
                <span style={{ fontSize: '10.5px', fontWeight: 800, background: '#DCFCE7', color: '#166534', padding: '3px 8px', borderRadius: '6px' }}>
                  ● LIVE CAD DISPATCH
                </span>
              </div>

              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: '6px' }}>
                  <span style={{ color: '#64748B' }}>🚔 Satuan Bertugas:</span>
                  <strong>{suksesDisposisiData.unitName}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: '6px' }}>
                  <span style={{ color: '#64748B' }}>👤 Pimpinan Regu:</span>
                  <strong style={{ color: '#1E40AF' }}>{suksesDisposisiData.komandan}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: '6px' }}>
                  <span style={{ color: '#64748B' }}>📍 Estimasi Jarak GPS:</span>
                  <strong style={{ color: '#1D4ED8' }}>{suksesDisposisiData.jarak} ({suksesDisposisiData.eta})</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>⚡ Quick Response Target:</span>
                  <strong style={{ color: '#15803D' }}>&lt; 10 Menit Tiba di TKP (SLA Aman ✅)</strong>
                </div>
              </div>
            </div>

            <div style={{ padding: '14px 20px', borderTop: '1px solid #E2E8F0', background: '#F8FAFC', textAlign: 'right' }}>
              <button
                type="button"
                onClick={() => setShowSuksesModal(false)}
                style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #153E75 0%, #1E40AF 100%)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '12.5px', cursor: 'pointer' }}
              >
                Pantau Penanganan di Timeline ➔
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL AUDIT 1: DETAIL SLA PIMPINAN                       */}
      {/* ======================================================== */}
      {showSlaModal && (
        <div
          id="modal-detail-sla-pimpinan"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            background: 'rgba(15,23,42,0.8)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setShowSlaModal(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              maxWidth: '820px',
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.45)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ background: 'linear-gradient(135deg, #153E75 0%, #1E40AF 100%)', color: 'white', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '20px' }}>⏱️</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Audit Rincian Waktu Tanggap Patroli (SLA 110)</h3>
                  <span style={{ fontSize: '11.5px', opacity: 0.9 }}>Standar Quick Response Mabes Polri • Target Respon TKP &lt; 10 Menit</span>
                </div>
              </div>
              <button type="button" onClick={() => setShowSlaModal(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '18px', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ padding: '18px 20px', overflowY: 'auto', flex: 1, background: '#F8FAFC' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '16px' }}>
                <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '10px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748B' }}>RATA-RATA RESPON</div>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: '#153E75', marginTop: '2px' }}>{avgResponseTime} MENIT</div>
                </div>
                <div style={{ background: 'white', border: '1px solid #BBF7D0', borderRadius: '10px', padding: '10px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#15803D' }}>TEPAT WAKTU</div>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: '#16A34A', marginTop: '2px' }}>{onTimeRate}%</div>
                </div>
                <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '10px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#166534' }}>&lt; 5 MENIT</div>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: '#166534', marginTop: '2px' }}>{fastCount} Kasus</div>
                </div>
                <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '10px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#1E40AF' }}>5-10 MENIT</div>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: '#2563EB', marginTop: '2px' }}>{mediumCount} Kasus</div>
                </div>
                <div style={{ background: 'white', border: '1px solid #FECACA', borderRadius: '10px', padding: '10px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#991B1B' }}>&gt; 10 MENIT</div>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: '#DC2626', marginTop: '2px' }}>{slowCount} Kasus</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {allRecentComplaints.slice(0, 10).map((c) => (
                  <div key={c.id} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '12.5px', color: '#1E293B' }}>{c.nomorTiket} - {c.jenisKejadian}</div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>📍 {c.tkpAlamatTeks} • Petugas: {c.assignedOfficer ? `${c.assignedOfficer.rankPangkat} ${c.assignedOfficer.namaLengkap}` : 'Belum Terdisposisi'}</div>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: c.responseTimeMinutes ? (c.responseTimeMinutes <= 10 ? '#16A34A' : '#DC2626') : '#2563EB', background: c.responseTimeMinutes ? (c.responseTimeMinutes <= 10 ? '#F0FDF4' : '#FEF2F2') : '#EFF6FF', padding: '3px 8px', borderRadius: '6px' }}>
                      {c.responseTimeMinutes ? `⚡ ${c.responseTimeMinutes} Menit (${c.responseTimeMinutes <= 10 ? 'Tepat Waktu' : 'Terlambat'})` : c.status === 'MENUJU_TKP' ? '⚡ Sedang Meluncur' : '● Dalam Penanganan'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: '12px 20px', background: 'white', borderTop: '1px solid #E2E8F0', textAlign: 'right' }}>
              <button
                type="button"
                onClick={() => setShowSlaModal(false)}
                style={{ padding: '8px 18px', background: '#F1F5F9', color: '#334155', fontSize: '12px', fontWeight: 700, border: '1px solid #CBD5E1', borderRadius: '8px', cursor: 'pointer' }}
              >
                Tutup Rincian
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL AUDIT 2: DETAIL KUAT PERSONEL                      */}
      {/* ======================================================== */}
      {showKuatPersModal && (
        <div
          id="modal-detail-kuat-personel"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            background: 'rgba(15,23,42,0.8)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setShowKuatPersModal(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              maxWidth: '860px',
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.45)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #1D4ED8 100%)', color: 'white', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '20px' }}>🛡️</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Gelar Pasukan &amp; Alutsista Patroli Presisi</h3>
                  <span style={{ fontSize: '11.5px', opacity: 0.9 }}>Daftar Riil Kekuatan {registeredUnits.length} Personel Terdaftar, Penugasan Operasi Lapangan, dan {fleetUnits.length} Unit Ranmor Dinas</span>
                </div>
              </div>
              <button type="button" onClick={() => setShowKuatPersModal(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '18px', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ padding: '18px 20px', overflowY: 'auto', flex: 1, background: '#F8FAFC' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))', gap: '10px', marginBottom: '16px' }}>
                <div style={{ background: 'white', border: '1px solid #BFDBFE', borderRadius: '10px', padding: '10px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#1D4ED8' }}>TOTAL KUAT</div>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: '#1E3A8A' }}>{registeredUnits.length} PERS</div>
                </div>
                {(() => {
                  const meluncurCount = registeredUnits.filter(
                    (u) => u.dutyStatus === 'DINAS_PATROLI' || u.dutyStatus === 'MENUJU_TKP'
                  ).length;
                  const cadanganCount = registeredUnits.filter(
                    (u) => u.dutyStatus === 'CADANGAN' || u.dutyStatus === 'LEPAS_DINAS'
                  ).length;
                  const siagaCount = Math.max(0, registeredUnits.length - meluncurCount - cadanganCount);

                  return (
                    <>
                      <div style={{ background: 'white', border: '1px solid #BBF7D0', borderRadius: '10px', padding: '10px 12px', textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: '#166534' }}>🟢 Siaga Mako</div>
                        <div style={{ fontSize: '20px', fontWeight: 900, color: '#16A34A' }}>{siagaCount} Pers</div>
                      </div>
                      <div style={{ background: 'white', border: '1px solid #BFDBFE', borderRadius: '10px', padding: '10px 12px', textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: '#1E40AF' }}>🔵 Meluncur/TKP</div>
                        <div style={{ fontSize: '20px', fontWeight: 900, color: '#2563EB' }}>{meluncurCount} Pers</div>
                      </div>
                      <div style={{ background: 'white', border: '1px solid #FDE68A', borderRadius: '10px', padding: '10px 12px', textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: '#92400E' }}>🟡 Cadangan</div>
                        <div style={{ fontSize: '20px', fontWeight: 900, color: '#D97706' }}>{cadanganCount} Pers</div>
                      </div>
                    </>
                  );
                })()}
                <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '10px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#475569' }}>🚔 Ranmor Dinas</div>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: '#0F172A' }}>{fleetUnits.length} UNIT</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {registeredUnits.map((u) => (
                  <div key={u.nrp} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '13px', color: '#1E293B' }}>{u.pangkat} {u.nama}</div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>NRP: {u.nrp} • Satuan: {u.satuanNama || u.unitId}</div>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#15803D', background: '#DCFCE7', padding: '2px 8px', borderRadius: '4px' }}>
                      🟢 Siaga Dinas
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: '12px 20px', background: 'white', borderTop: '1px solid #E2E8F0', textAlign: 'right' }}>
              <button
                type="button"
                onClick={() => setShowKuatPersModal(false)}
                style={{ padding: '8px 18px', background: '#F1F5F9', color: '#334155', fontSize: '12px', fontWeight: 700, border: '1px solid #CBD5E1', borderRadius: '8px', cursor: 'pointer' }}
              >
                Tutup Rincian
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL AUDIT 3: DETAIL IKM WARGA                          */}
      {/* ======================================================== */}
      {showIkmModal && (
        <div
          id="modal-detail-ikm-warga"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            background: 'rgba(15,23,42,0.8)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setShowIkmModal(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              maxWidth: '840px',
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.45)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ background: 'linear-gradient(135deg, #065F46 0%, #047857 100%)', color: 'white', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '20px' }}>⭐</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Audit Indeks Kepuasan Masyarakat (IKM)</h3>
                  <span style={{ fontSize: '11.5px', opacity: 0.9 }}>Transparansi Penilaian Riil Warga Pelapor Atas Penanganan Kasus</span>
                </div>
              </div>
              <button type="button" onClick={() => setShowIkmModal(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '18px', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ padding: '18px 20px', overflowY: 'auto', flex: 1, background: '#F8FAFC' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))', gap: '10px', marginBottom: '16px' }}>
                <div style={{ background: 'white', border: '1px solid #A7F3D0', borderRadius: '10px', padding: '10px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#065F46' }}>SKOR RATA-RATA</div>
                  <div style={{ fontSize: '22px', fontWeight: 900, color: '#065F46', marginTop: '2px' }}>{satisfactionRating} / 5.0</div>
                </div>
                <div style={{ background: 'white', border: '1px solid #BBF7D0', borderRadius: '10px', padding: '10px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#15803D' }}>KEPUASAN WARGA</div>
                  <div style={{ fontSize: '22px', fontWeight: 900, color: '#16A34A', marginTop: '2px' }}>{satisfactionPercent}%</div>
                </div>
                <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '10px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#1E40AF' }}>TOTAL ULASAN</div>
                  <div style={{ fontSize: '22px', fontWeight: 900, color: '#153E75', marginTop: '2px' }}>
                    {allRecentComplaints.filter((c) => c.citizenRating || c.citizenReview).length} Ulasan
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {allRecentComplaints.filter((c) => c.citizenRating || c.citizenReview).length > 0 ? (
                  allRecentComplaints
                    .filter((c) => c.citizenRating || c.citizenReview)
                    .map((item) => (
                      <div key={item.id} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <div>
                            <strong>{item.pelapor?.nama || 'Masyarakat'}</strong>
                            {item.lokasi?.alamat && (
                              <span style={{ fontSize: '11px', color: '#64748B', marginLeft: '6px' }}>({item.lokasi.alamat})</span>
                            )}
                          </div>
                          <span style={{ color: '#F59E0B', fontSize: '12px', letterSpacing: '2px' }}>
                            {'★'.repeat(item.citizenRating || 5)}{'☆'.repeat(Math.max(0, 5 - (item.citizenRating || 5)))}
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#475569', fontStyle: 'italic', marginBottom: '6px' }}>
                          "{item.citizenReview || 'Pelayanan sangat profesional, cepat, dan presisi. Terima kasih Polri.'}"
                        </div>
                        <div style={{ display: 'flex', gap: '6px', fontSize: '10px' }}>
                          <span style={{ background: '#F1F5F9', color: '#475569', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                            {item.nomor_laporan}
                          </span>
                          <span style={{ background: '#EFF6FF', color: '#1D4ED8', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                            {item.kategori}
                          </span>
                        </div>
                      </div>
                    ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '24px', color: '#94A3B8', fontSize: '13px' }}>
                    Belum ada ulasan masyarakat yang tercatat di database.
                  </div>
                )}
              </div>
            </div>

            <div style={{ padding: '12px 20px', background: 'white', borderTop: '1px solid #E2E8F0', textAlign: 'right' }}>
              <button
                type="button"
                onClick={() => setShowIkmModal(false)}
                style={{ padding: '8px 18px', background: '#F1F5F9', color: '#334155', fontSize: '12px', fontWeight: 700, border: '1px solid #CBD5E1', borderRadius: '8px', cursor: 'pointer' }}
              >
                Tutup Rincian
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL CETAK RESMI LAPORAN AKUNTABILITAS OPERASIONAL     */}
      {/* ======================================================== */}
      {showCetakModal && (
        <div
          id="modal-cetak-laporan-pawas"
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
          onClick={() => setShowCetakModal(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              maxWidth: '840px',
              width: '100%',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
              overflow: 'hidden',
              border: '1px solid #CBD5E1',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ background: '#0F172A', color: 'white', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📄</span>
                <span style={{ fontSize: '13px', fontWeight: 800 }}>PRATINJAU DOKUMEN MUTASI RESMI OPERASIONAL (FORMAT POLRI)</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{ background: '#10B981', color: 'white', border: 'none', padding: '7px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}
                >
                  🖨️ Cetak Dokumen / PDF
                </button>
                <button
                  type="button"
                  onClick={() => setShowCetakModal(false)}
                  style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: 'none', width: '28px', height: '28px', borderRadius: '50%', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Dokumen Format Standar Polri */}
            <div style={{ padding: '40px 48px', overflowY: 'auto', flex: 1, fontFamily: "'Times New Roman', Times, serif", lineHeight: 1.45, fontSize: '13.5px', color: '#000000' }}>
              <div style={{ borderBottom: '3px double #000000', paddingBottom: '10px', marginBottom: '18px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '12.5pt', fontWeight: 'bold', letterSpacing: '1px' }}>
                    KEPOLISIAN NEGARA REPUBLIK INDONESIA
                  </div>
                  <div style={{ fontSize: '12.5pt', fontWeight: 'bold', letterSpacing: '1px' }}>
                    DAERAH METRO JAYA
                  </div>
                  <div style={{ fontSize: '13.5pt', fontWeight: 'bold', letterSpacing: '1.5px' }}>
                    RESOR METRO JAKARTA SELATAN
                  </div>
                  <div style={{ fontSize: '9.5pt', fontStyle: 'italic', marginTop: '3px' }}>
                    Jalan Wijaya II No. 42, Kebayoran Baru, Jakarta Selatan • Telp: (021) 7201110
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ fontSize: '13pt', fontWeight: 'bold', textDecoration: 'underline' }}>
                  LAPORAN HASIL PELAKSANAAN TUGAS PERWIRA PENGAWAS (PAWAS)
                </div>
                <div style={{ fontSize: '11pt', fontWeight: 'bold', marginTop: '3px' }}>
                  Nomor: LAP-PAWAS / {new Date().getMonth() + 1} / {new Date().getFullYear()} / SPKT-METRO
                </div>
                <div style={{ fontSize: '10pt', fontStyle: 'italic', marginTop: '3px' }}>
                  Masa Dinas Piket: {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <strong>I. DASAR HUKUM &amp; PENUGASAN:</strong>
                <div style={{ paddingLeft: '18px', textAlign: 'justify' }}>
                  1. Peraturan Kepala Kepolisian Negara Republik Indonesia Nomor 2 Tahun 2021 tentang Susunan Organisasi dan Tata Kerja Pada Tingkat Kepolisian Resor.<br />
                  2. Surat Perintah Penunjukan Perwira Pengawas (PAWAS) Piket Siaga Markas Komando dan Sentra Pelayanan Kepolisian Terpadu 110.
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <strong>II. KUAT PERSONEL &amp; KESIAPSIAGAAN SARPRAS:</strong>
                <div style={{ paddingLeft: '18px' }}>
                  a. <strong>Kekuatan Riil Personel Piket:</strong> {registeredUnits.length} Personel terdaftar aktif di sistem.<br />
                  b. <strong>Kesiapan Armada Taktis:</strong> {fleetUnits.length} Unit Ranmor Dinas Presisi aktif.<br />
                  c. <strong>Inventaris Senpi &amp; Alkom:</strong> Gudang jaga lengkap terkunci, radio HT repeater Channel 110 aktif.
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <strong>III. INDEKS KEPUASAN MASYARAKAT &amp; VALIDITAS ADUAN 110:</strong>
                <div style={{ paddingLeft: '18px' }}>
                  Berdasarkan evaluasi survei masyarakat melalui portal publik SIMAPRES, diperoleh <strong>Indeks Kepuasan Masyarakat (IKM): {ikmStats?.avgRating ? ikmStats.avgRating.toFixed(1) + ' / 5.0' : '-'}</strong>.
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <strong>IV. REKAPITULASI PELAYANAN PANGGILAN DARURAT 110:</strong>
                <div style={{ paddingLeft: '18px' }}>
                  Selama masa dinas telah diterima dan dikendalikan sebanyak <strong>{totalLaporan} Laporan Pengaduan Warga</strong> melalui Call Center 110.
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '30px' }}>
                <div style={{ fontSize: '10.5pt' }}>
                  <strong>Tembusan Yth:</strong><br />
                  1. Kapolres Metro Jakarta Selatan<br />
                  2. Wakapolres Metro Jakarta Selatan<br />
                  3. Kabag Ops Polres Metro Jakarta Selatan<br />
                  4. Kasi Propam Polres Metro Jakarta Selatan
                </div>
                <div style={{ textAlign: 'center', minWidth: '240px' }}>
                  <div>Jakarta, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                  <div style={{ fontWeight: 'bold', marginTop: '2px' }}>PERWIRA PENGAWAS (PAWAS),</div>
                  <div style={{ height: '55px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#153E75', fontSize: '11px', fontWeight: 'bold', border: '1px dashed #94A3B8', margin: '8px auto', width: '180px', borderRadius: '6px', background: '#F8FAFC' }}>
                    [ TERVERIFIKASI DIGITAL ]
                  </div>
                  <div style={{ fontWeight: 'bold', textDecoration: 'underline' }}>{userProfile.fullName}</div>
                  <div style={{ fontSize: '10pt' }}>{userProfile.pangkat} NRP {userProfile.nrp}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL CRUD TITIK RAWAN KAMTIBMAS                         */}
      {/* ======================================================== */}
      {showHotspotModal && (
        <div
          id="modal-crud-titik-rawan"
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
              width: '100%',
              maxWidth: '680px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ background: 'linear-gradient(135deg, #1E293B, #0F172A)', color: 'white', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '22px' }}>🔴</span>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 800 }}>MANAJEMEN TITIK RAWAN KAMTIBMAS</div>
                  <div style={{ fontSize: '11.5px', color: '#94A3B8' }}>Kelola peta hotspot kerawanan, balap liar, tawuran &amp; kejahatan jalanan</div>
                </div>
              </div>
              <button type="button" onClick={() => setShowHotspotModal(false)} style={{ background: 'none', border: 'none', color: '#CBD5E1', fontSize: '16px', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ padding: '12px 20px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                Daftar Hotspot Aktif: <span style={{ background: '#EF4444', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '11px' }}>{hotspots.length}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowHotspotAddForm(!showHotspotAddForm)}
                style={{ background: '#153E75', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '6px', fontSize: '11.5px', fontWeight: 800, cursor: 'pointer' }}
              >
                {showHotspotAddForm ? '✕ Tutup Form' : '➕ Tambah Titik Rawan Baru'}
              </button>
            </div>

            <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1 }}>
              {showHotspotAddForm && (
                <div style={{ background: '#FFF7ED', border: '1.5px solid #FDBA74', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#9A3412', marginBottom: '10px' }}>
                    ➕ TAMBAH TITIK RAWAN BARU
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Nama Kawasan Rawan *</label>
                      <input
                        type="text"
                        placeholder="Contoh: Flyover Antasari, Panglima Polim..."
                        value={newHotspotTitle}
                        onChange={(e) => setNewHotspotTitle(e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Wilayah Polsek *</label>
                      <input
                        type="text"
                        value={newHotspotWilayah}
                        onChange={(e) => setNewHotspotWilayah(e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Kategori Kerawanan</label>
                      <select
                        value={newHotspotKategori}
                        onChange={(e) => setNewHotspotKategori(e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px' }}
                      >
                        <option value="">-- Pilih Kategori Kerawanan --</option>
                        {dbCategories.map((c) => (
                          <option key={c.id || c.key} value={c.label || c.key}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Jadwal / Jam Rawan</label>
                      <input
                        type="text"
                        value={newHotspotJadwal}
                        onChange={(e) => setNewHotspotJadwal(e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px' }}
                      />
                    </div>
                  </div>

                  {showMiniPickerRawan && (
                    <div style={{ marginBottom: '10px', border: '1px solid #CBD5E1', borderRadius: '8px', overflow: 'hidden' }}>
                      <MiniMapPicker
                        lat={newHotspotLat}
                        lng={newHotspotLng}
                        onChange={(lat, lng) => {
                          setNewHotspotLat(lat);
                          setNewHotspotLng(lng);
                        }}
                      />
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setShowMiniPickerRawan(!showMiniPickerRawan)}
                      style={{ background: '#0284C7', color: 'white', border: 'none', padding: '7px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      🗺️ {showMiniPickerRawan ? 'Sembunyikan Peta' : 'Pilih Titik di Peta'}
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!newHotspotTitle.trim()) {
                          alert('Mohon isi nama kawasan rawan terlebih dahulu!');
                          return;
                        }
                        await createHotspotAction({
                          title: newHotspotTitle,
                          wilayahPolsek: newHotspotWilayah,
                          kategori: newHotspotKategori,
                          statusBahaya: newHotspotStatus,
                          jadwalDisplay: newHotspotJadwal,
                          lat: newHotspotLat,
                          lng: newHotspotLng,
                        });
                        alert('✓ Titik rawan berhasil ditambahkan ke database!');
                        setNewHotspotTitle('');
                        setShowHotspotAddForm(false);
                        loadData();
                      }}
                      style={{ background: '#16A34A', color: 'white', border: 'none', padding: '7px 16px', borderRadius: '6px', fontSize: '11.5px', fontWeight: 800, cursor: 'pointer' }}
                    >
                      💾 Simpan Titik Rawan
                    </button>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {hotspots.map((h) => (
                  <div
                    key={h.id || h.key}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px' }}
                  >
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '13px', color: '#1E293B' }}>🔴 {h.title}</div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>{h.kategori} • {h.jadwalDisplay || h.jadwal}</div>
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

            <div style={{ padding: '12px 20px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', textAlign: 'right' }}>
              <button
                type="button"
                onClick={() => setShowHotspotModal(false)}
                style={{ background: '#334155', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL TIMEPICKER RENTANG JAM KEGIATAN                    */}
      {/* ======================================================== */}
      {showTimePickerModal && (
        <div
          id="modal-timepicker-log"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000000,
            background: 'rgba(15,23,42,0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setShowTimePickerModal(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '14px',
              maxWidth: '390px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)',
              overflow: 'hidden',
              borderTop: '5px solid #153E75',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '16px 20px 14px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '7px' }}>
                <span>📅</span> Pilih Rentang Jam Kegiatan
              </div>
              <button type="button" onClick={() => setShowTimePickerModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', color: '#94A3B8', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ padding: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '10px', alignItems: 'center', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Jam Mulai</label>
                  <input
                    type="time"
                    defaultValue=""
                    id="tp-jam-mulai"
                    style={{ width: '100%', padding: '10px 8px', border: '1.5px solid #CBD5E1', borderRadius: '8px', fontSize: '15px', fontWeight: 700, textAlign: 'center' }}
                  />
                </div>
                <div style={{ paddingTop: '18px', fontWeight: 800, color: '#64748B' }}>s/d</div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Sampai Jam</label>
                  <input
                    type="time"
                    defaultValue=""
                    id="tp-jam-selesai"
                    style={{ width: '100%', padding: '10px 8px', border: '1.5px solid #CBD5E1', borderRadius: '8px', fontSize: '15px', fontWeight: 700, textAlign: 'center' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setLogWaktuMulai('08:00 - 16:00 WIB (Shift Pagi)');
                    setShowTimePickerModal(false);
                  }}
                  style={{ padding: '7px 10px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '11px', fontWeight: 700, textAlign: 'left', cursor: 'pointer' }}
                >
                  ☀️ Shift Pagi (08:00 - 16:00)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLogWaktuMulai('16:00 - 00:00 WIB (Shift Sore)');
                    setShowTimePickerModal(false);
                  }}
                  style={{ padding: '7px 10px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '11px', fontWeight: 700, textAlign: 'left', cursor: 'pointer' }}
                >
                  🌇 Shift Sore (16:00 - 00:00)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLogWaktuMulai('00:00 - 08:00 WIB (Shift Malam)');
                    setShowTimePickerModal(false);
                  }}
                  style={{ padding: '7px 10px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '11px', fontWeight: 700, textAlign: 'left', cursor: 'pointer' }}
                >
                  🌙 Shift Malam (00:00 - 08:00)
                </button>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowTimePickerModal(false)}
                  style={{ flex: 1, background: '#F1F5F9', border: '1px solid #CBD5E1', padding: '11px', borderRadius: '8px', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const start = (document.getElementById('tp-jam-mulai') as HTMLInputElement)?.value || '09:00';
                    const end = (document.getElementById('tp-jam-selesai') as HTMLInputElement)?.value || '14:30';
                    setLogWaktuMulai(`${start} - ${end} WIB`);
                    setShowTimePickerModal(false);
                  }}
                  style={{ flex: 1.4, background: '#153E75', border: 'none', color: 'white', padding: '11px', borderRadius: '8px', fontWeight: 800, fontSize: '12px', cursor: 'pointer' }}
                >
                  <span>✓</span> Terapkan Waktu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL KEAMANAN AKUN & PIN KOMANDO                        */}
      {/* ======================================================== */}
      {showKeamananModal && (
        <div
          id="modal-keamanan-profil"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: 'rgba(15,23,42,0.8)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setShowKeamananModal(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '14px',
              maxWidth: '500px',
              width: '100%',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)',
              border: '1px solid #CBD5E1',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ background: '#153E75', color: 'white', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '20px' }}>🔒</span>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0 }}>Keamanan Akun &amp; PIN Komando</h3>
                  <div style={{ fontSize: '11px', opacity: 0.85 }}>Kredensial SIPP Mabes Polri &amp; Otorisasi Dinas</div>
                </div>
              </div>
              <button type="button" onClick={() => setShowKeamananModal(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '18px', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ padding: '20px' }}>
              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '10px', padding: '12px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#166534' }}>Autentikasi 2-Faktor (2FA) Aktif</div>
                  <div style={{ fontSize: '11px', color: '#15803D' }}>Token Terverifikasi • {session?.identifier ? `NRP: ${session.identifier}` : '-'}</div>
                </div>
                <span style={{ background: '#15803D', color: 'white', fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '10px' }}>SIAP</span>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Kata Sandi</label>
                <input type="password" placeholder="Masukkan kata sandi baru..." style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '13px' }} />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>PIN Otorisasi Disposisi (6-Digit)</label>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                  {pinOtorisasiPawas.map((d, i) => (
                    <input
                      key={i}
                      type="password"
                      maxLength={1}
                      value={d}
                      onChange={(e) => {
                        const val = e.target.value.slice(-1);
                        setPinOtorisasiPawas((prev) => {
                          const next = [...prev];
                          next[i] = val;
                          return next;
                        });
                      }}
                      style={{ width: '40px', height: '45px', textAlign: 'center', fontSize: '18px', fontWeight: 800, border: '2px solid #CBD5E1', borderRadius: '8px', background: '#F8FAFC' }}
                    />
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowKeamananModal(false)}
                  style={{ flex: 1, padding: '10px', background: '#F1F5F9', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '12.5px', cursor: 'pointer' }}
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    alert('✓ Kredensial akun & PIN otorisasi dinas berhasil diperbarui!');
                    setShowKeamananModal(false);
                  }}
                  style={{ flex: 2, padding: '10px', background: '#153E75', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '12.5px', cursor: 'pointer' }}
                >
                  💾 Simpan Perubahan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL KONFIRMASI PRESENSI PULANG                         */}
      {/* ======================================================== */}
      {showPresensiPulangModal && (
        <div
          id="modal-presensi-pulang"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
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
            style={{
              background: 'white',
              borderRadius: '14px',
              maxWidth: '460px',
              width: '100%',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)',
              border: '1px solid #CBD5E1',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ background: '#DC2626', color: 'white', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '22px' }}>🚪</span>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0 }}>Konfirmasi Presensi Pulang</h3>
                  <div style={{ fontSize: '11px', opacity: 0.9 }}>Serah Terima Tugas Piket</div>
                </div>
              </div>
              <button type="button" onClick={() => setShowPresensiPulangModal(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '18px', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ padding: '20px', fontSize: '12.5px' }}>
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '12px', marginBottom: '16px', color: '#991B1B' }}>
                <strong>Perhatian:</strong> Anda akan mengakhiri sesi dinas piket hari ini. Pastikan hal-hal berikut telah terpenuhi:
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" style={{ accentColor: '#15803D', width: '16px', height: '16px' }} />
                  <span>Seluruh laporan penugasan aktif telah diperbarui statusnya.</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" style={{ accentColor: '#15803D', width: '16px', height: '16px' }} />
                  <span>Siap melakukan apel serah terima kepada regu piket pengganti.</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowPresensiPulangModal(false)}
                  style={{ flex: 1, padding: '10px', background: '#F1F5F9', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '12.5px', cursor: 'pointer' }}
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleKonfirmasiPulangFinal}
                  style={{ flex: 1.5, padding: '10px', background: '#DC2626', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '12.5px', cursor: 'pointer' }}
                >
                  <span>✓</span> Konfirmasi Pulang
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* LIGHTBOX MODAL PREVIEW FOTO BUKTI                        */}
      {/* ======================================================== */}
      {showLightboxModal && (
        <div
          id="lightbox-modal"
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
          onClick={() => setShowLightboxModal(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              maxWidth: '550px',
              width: '100%',
              overflow: 'hidden',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#1E293B' }}>{lightboxImg.title}</h4>
                <span style={{ fontSize: '11px', color: '#64748B' }}>Dokumentasi Resmi SIMAPRES 110</span>
              </div>
              <button type="button" onClick={() => setShowLightboxModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ background: '#0F172A', maxHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={lightboxImg.url} alt="Lightbox" style={{ width: '100%', maxHeight: '380px', objectFit: 'contain' }} />
            </div>
            <div style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: '12px', color: '#1E293B', lineHeight: 1.5 }}>{lightboxImg.desc}</div>
              <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748B', borderTop: '1px solid #F1F5F9', paddingTop: '8px' }}>
                <span>{lightboxImg.meta}</span>
                <span style={{ background: '#EFF6FF', color: '#153E75', fontWeight: 700, padding: '2px 8px', borderRadius: '4px' }}>✓ Terverifikasi GPS</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function PawasConsoleView({ session, initialSection = 'beranda' }: { session?: any; initialSection?: string }) {
  return (
    <React.Suspense fallback={<ConsoleSkeleton role="PAWAS" />}>
      <CommandCenterContent session={session} initialSection={initialSection} />
    </React.Suspense>
  );
}
