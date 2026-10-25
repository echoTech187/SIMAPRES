'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Home, Map, Headphones, Plus, PlusCircle, ShieldAlert, BarChart3, User, Shield, BookOpen } from 'lucide-react';
import {
  getPendingComplaintsAction,
  disposisiMultiSatuanAction,
  getAllRecentComplaintsAction,
  getIkmStatsAction,
  updateComplaintStatusAction,
  sahkanKasusPawasAction,
  getMasterFilterOptionsAction,
  getOfficerPerformanceRankingsAction,
  type OfficerPerformanceRankItem,
} from '@/app/actions/complaint.actions';
import {
  getRegisteredUnitsAction,
  getPoliceOfficesAction,
  getOfficerProfileByNrpAction,
  getCurrentSessionAction,
  logoutAction,
} from '@/app/actions/auth.actions';
import { getPatrolFleetUnitsAction } from '@/app/actions/fleet.actions';
import { getPawasUnifiedDataAction } from '@/app/actions/pawas.actions';
import { ConsoleSkeleton } from './ConsoleSkeleton';
import HeaderProfileBadge from './HeaderProfileBadge';
import { getHotspotsAction } from '@/app/actions/hotspot.actions';
import { createLogbookAction } from '@/app/actions/logbook.actions';
import { toast } from '@/components/ui/Toast';
import '@/app/registrasi-unit/registrasi-unit.css';
import { searchIndonesianLocations, type LocationSuggestionItem } from '@/lib/indonesian-location-search';

import { PawasTab, PresensiStatusType } from './pawas/types';
import TabProfilPawas from './profile/TabProfilPawas';
import TabBerandaPawas from './pawas/tabs/TabBerandaPawas';
import TabTacticalMapPawas from './pawas/tabs/TabTacticalMapPawas';
import TabBuatLogPawas from './pawas/tabs/TabBuatLogPawas';
import { TabValidasiPawas } from './pawas/tabs/TabValidasiPawas';
import TabKinerjaPawas from './pawas/tabs/TabKinerjaPawas';
import TabOperatorCadPawas from './pawas/tabs/TabOperatorCadPawas';
import TabTolakLogPawas from './pawas/tabs/TabTolakLogPawas';
import TabBukuPintarSop from './pawas/tabs/TabBukuPintarSop';

import ModalDisposisiPawas from './pawas/modals/ModalDisposisiPawas';
import ModalSuksesDisposisi from './pawas/modals/ModalSuksesDisposisi';
import ModalSlaMonitoring from './pawas/modals/ModalSlaMonitoring';
import ModalKuatPers from './pawas/modals/ModalKuatPers';
import ModalIkm from './pawas/modals/ModalIkm';
import ModalCetakLaporan from './pawas/modals/ModalCetakLaporan';
import ModalHotspotPawas from './pawas/modals/ModalHotspotPawas';
import ModalTimePicker from './pawas/modals/ModalTimePicker';
import ModalPresensiPulang from './pawas/modals/ModalPresensiPulang';
import ModalKeamananPawas from './pawas/modals/ModalKeamananPawas';
import ModalLightbox from './pawas/modals/ModalLightbox';
import ModalTolakPengaduan from './pawas/modals/ModalTolakPengaduan';
import EscalationAlarmBanner from './pawas/components/EscalationAlarmBanner';

function calculateDistanceHaversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  if (!lat1 || !lng1 || !lat2 || !lng2) return 0;
  const toRad = (angle: number) => (angle * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const meters = 6371000 * c;
  return Math.round((meters / 1000) * 10) / 10;
}

function getSopRecommendationByIncident(item: any, dbSubcategories: any[] = []) {
  if (!item) {
    return {
      primarySatuanId: null,
      secondarySatuanIds: [],
      kasusSpesifik: null,
      sopText: null,
    };
  }

  const sub = item?.subcategory || item?.subcategory_rel;
  const targetSubId = item?.subcategory_id || item?.subcategoryId;
  const matchedSub =
    sub ||
    (targetSubId && dbSubcategories.length > 0
      ? dbSubcategories.find((s: any) => s.id === Number(targetSubId))
      : null) ||
    (dbSubcategories.length > 0 && item?.jenisKejadian
      ? dbSubcategories.find(
          (s: any) => s.nama_kasus?.toLowerCase().trim() === item.jenisKejadian?.toLowerCase().trim()
        )
      : null);

  const unitKey = matchedSub?.unit_key || matchedSub?.unit_rel?.key || item?.subUnitKey;

  if (unitKey) {
    const primarySatuanId = unitKey === 'samapta' ? 'sabhara' : unitKey;
    return {
      primarySatuanId,
      secondarySatuanIds: [],
      kasusSpesifik: matchedSub?.nama_kasus || item?.subKasus || item?.jenisKejadian || null,
      sopText: matchedSub?.deskripsi_sop || item?.deskripsi_sop || null,
    };
  }

  return {
    primarySatuanId: null,
    secondarySatuanIds: [],
    kasusSpesifik: item?.jenisKejadian || item?.title || null,
    sopText: item?.deskripsi_sop || null,
  };
}

function parsePawasTab(tabOrSection?: string | null): PawasTab {
  const t = tabOrSection ? tabOrSection.toLowerCase().trim() : '';
  switch (t) {
    case 'peta':
    case 'map':
    case 'tactical-map':
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
    case 'buat-pengaduan':
    case 'buat-log':
    case 'log':
      return 'view-log';
    case 'tolak':
      return 'view-tolak';
    case 'panduan':
    case 'faq':
    case 'sop':
      return 'view-panduan';
    case 'beranda':
    default:
      return 'view-beranda';
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
    case 'view-panduan':
      return 'panduan';
    case 'view-beranda':
    default:
      return '';
  }
}

function CommandCenterContent({
  session,
  initialSection = 'beranda',
  initialMasterData,
  initialPawasData,
}: {
  session?: any;
  initialSection?: string;
  initialMasterData?: any;
  initialPawasData?: any;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const nrpParam = searchParams.get('nrp') ? searchParams.get('nrp') : session?.identifier;

  // Active Tab
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const parts = window.location.pathname.split('/').filter(Boolean);
      const last = parts[parts.length - 1];
      if (parts[0] === 'console' && parts.length > 1) {
        return parsePawasTab(last);
      }
    }
    return parsePawasTab(initialSection);
  });

  // User Profile
  const [userProfile, setUserProfile] = useState<any>(() => {
    if (session) {
      return {
        ...session,
        fullName: session.fullName ? session.fullName : '',
        identifier: session.identifier ? session.identifier : '',
        nrp: session.identifier ? session.identifier : '',
        pangkat: session.rankPangkat ? session.rankPangkat : '',
        satuanNama: session.satuanNama ? session.satuanNama : '',
        unit: session.satuanNama ? session.satuanNama : '',
        role: session.role ? session.role : 'PAWAS',
        roleBadge: 'PAWAS',
        avatar: session.avatar ? session.avatar : (session.avatar_url ? session.avatar_url : null),
      };
    }
    return {
      fullName: '',
      identifier: '',
      nrp: '',
      pangkat: '',
      satuanNama: '',
      unit: '',
      role: 'PAWAS',
      roleBadge: 'PAWAS',
      avatar: null,
    };
  });

  // Data Collections
  const [antreanPawas, setAntreanPawas] = useState<any[]>(() => initialPawasData?.pendingComplaints || []);
  const [allRecentComplaints, setAllRecentComplaints] = useState<any[]>(() => initialPawasData?.allRecentComplaints || []);
  const [registeredUnits, setRegisteredUnits] = useState<any[]>(() => initialPawasData?.registeredUnits || []);
  const [policeOffices, setPoliceOffices] = useState<any[]>(() => initialPawasData?.policeOffices || []);
  const [fleetUnits, setFleetUnits] = useState<any[]>(() => initialPawasData?.fleetUnits || []);
  const [hotspots, setHotspots] = useState<any[]>(() => initialPawasData?.hotspots || []);
  const [ikmStats, setIkmStats] = useState<any>(() => initialPawasData?.ikmStats || null);
  const [recentActivities, setRecentActivities] = useState<any[]>(() => initialPawasData?.recentLogbooks || []);
  const [loading, setLoading] = useState(false);
  const [isServerDataLoaded, setIsServerDataLoaded] = useState(() => !!initialPawasData);

  // Time & Attendance State
  const [presensiStatus, setPresensiStatus] = useState<PresensiStatusType>('BELUM_MASUK');
  const [jamMasukPiket, setJamMasukPiket] = useState('-');
  const [jamPulangPiket, setJamPulangPiket] = useState('-');

  // Operator Simulation
  const [simCaller, setSimCaller] = useState({
    nomorTiket: '',
    nama: '',
    telepon: '',
    alamat: '',
    kategori: '',
    subcategoryId: undefined as number | undefined,
    urgensi: '',
    uraian: '',
    lat: 0,
    lng: 0,
  });

  // Officer Performance Ranking State
  const [officerRankings, setOfficerRankings] = useState<{
    productivityRanking: OfficerPerformanceRankItem[];
    satisfactionRanking: OfficerPerformanceRankItem[];
    totalOfficers: number;
  } | null>(() => initialPawasData?.officerRankings || null);

  // Toast Notification
  const showFriendlyToast = useCallback((
    type: 'success' | 'warning' | 'error' | 'info',
    title: string,
    message: string,
    duration = 4500
  ) => {
    toast.show(type, title, message, duration);
  }, []);

  const showToast = useCallback((msg: string) => {
    toast.showNotification(msg, 4000);
  }, []);

  // Validation Errors
  const [cadFormErrors, setCadFormErrors] = useState<Record<string, string>>({});
  const [disposisiFormErrors, setDisposisiFormErrors] = useState<Record<string, string>>({});

  const validateCadForm = () => {
    const errors: Record<string, string> = {};
    const rawPhone = (simCaller.telepon || '').trim();
    const digitsOnly = rawPhone.replace(/\D/g, '');
    if (!rawPhone) {
      errors.telepon = 'Nomor telepon pelapor wajib diisi agar petugas dapat melakukan panggilan balik atau konfirmasi.';
    } else if (digitsOnly.length < 9) {
      errors.telepon = 'Nomor telepon terlalu pendek. Masukkan minimal 9–14 digit nomor telepon aktif.';
    } else if (digitsOnly.length > 15) {
      errors.telepon = 'Nomor telepon terlalu panjang (maksimal 15 digit). Mohon periksa kembali.';
    } else if (!/^(0|62|\+62)/.test(rawPhone)) {
      errors.telepon = 'Format nomor belum sesuai. Awali dengan 08... atau +62... (contoh: 08123456789).';
    }

    const cleanNama = (simCaller.nama || '').trim();
    if (!cleanNama) {
      errors.nama = 'Nama warga pelapor wajib diisi.';
    } else if (cleanNama.length < 3) {
      errors.nama = 'Nama pelapor minimal 3 karakter huruf (contoh: Bpk. Budi Santoso).';
    } else if (/^\d+$/.test(cleanNama)) {
      errors.nama = 'Nama pelapor tidak boleh hanya berupa angka. Silakan masukkan nama yang benar.';
    }

    if (!simCaller.subcategoryId && !simCaller.kategori) {
      errors.kategori = 'Silakan pilih kategori laporan kejadian sesuai keterangan penelepon agar SOP penanganan tepat.';
    }

    if (!simCaller.urgensi) {
      errors.urgensi = 'Silakan tentukan tingkat urgensi penanganan (Darurat, Sedang, atau Normal).';
    }

    const cleanAlamat = (simCaller.alamat || '').trim();
    if (!cleanAlamat) {
      errors.alamat = 'Alamat TKP atau patokan lokasi wajib diisi (atau klik "Pilih Titik di Peta").';
    } else if (cleanAlamat.length < 5) {
      errors.alamat = 'Keterangan alamat terlalu singkat (minimal 5 karakter, misal nama jalan, RT/RW, atau nama gedung).';
    }

    const cleanUraian = (simCaller.uraian || '').trim();
    if (!cleanUraian) {
      errors.uraian = 'Ringkasan uraian kejadian wajib diisi sebagai informasi awal bagi petugas patroli.';
    } else if (cleanUraian.length < 10) {
      errors.uraian = 'Uraian terlalu singkat (minimal 10 karakter agar situasi di lokasi dapat dipahami dengan baik).';
    }

    return errors;
  };

  const validateDisposisiForm = () => {
    const errors: Record<string, string> = {};
    if (selectedSatuanKeys.length === 0) {
      errors.satuan = 'Silakan pilih minimal 1 Satuan Tugas (Unit Patroli) yang siap diterjunkan ke TKP.';
    }
    if (!kuotaPersonel || kuotaPersonel < 1) {
      errors.kuota = 'Alokasi kuat personel minimal 2 orang.';
    }
    const cleanArahan = (arahanPawas || '').trim();
    if (!cleanArahan) {
      errors.arahan = 'Mohon sertakan petunjuk khusus / instruksi taktis (minimal 5 karakter), atau pilih salah satu template cepat di atas.';
    } else if (cleanArahan.length < 5) {
      errors.arahan = 'Arahan taktis terlalu singkat (minimal 5 karakter) demi kejelasan instruksi kepada personel di lapangan.';
    }
    return errors;
  };

  // Location suggestions for Operator CAD (Multi-Tier Indonesian & Police Station Search)
  const [cadLocationSuggestions, setCadLocationSuggestions] = useState<LocationSuggestionItem[]>([]);
  const [isSearchingCadLocation, setIsSearchingCadLocation] = useState(false);
  const [showCadSuggestions, setShowCadSuggestions] = useState(false);
  const searchTimeoutRef = useRef<any>(null);

  const handleCadLocationSearch = (query: string) => {
    setSimCaller((prev) => ({ ...prev, alamat: query }));
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!query || query.trim().length < 2) {
      setCadLocationSuggestions([]);
      setShowCadSuggestions(false);
      return;
    }

    setIsSearchingCadLocation(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const items = await searchIndonesianLocations(query, {
          lat: simCaller.lat || undefined,
          lng: simCaller.lng || undefined,
          limit: 1000,
        });
        setCadLocationSuggestions(items);
        setShowCadSuggestions(items.length > 0);
      } catch (err) {
        console.warn('Location search error:', err);
      } finally {
        setIsSearchingCadLocation(false);
      }
    }, 200);
  };

  const handleSelectCadSuggestion = (item: { fullAddress: string; lat: number; lng: number }) => {
    setSimCaller((prev) => ({
      ...prev,
      alamat: item.fullAddress,
      lat: item.lat,
      lng: item.lng,
    }));
    setCadFormErrors((prev) => {
      const next = { ...prev };
      delete next.alamat;
      return next;
    });
    setShowCadSuggestions(false);
  };

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

  // Modals
  const [showSlaModal, setShowSlaModal] = useState(false);
  const [showKuatPersModal, setShowKuatPersModal] = useState(false);
  const [showIkmModal, setShowIkmModal] = useState(false);
  const [showCetakModal, setShowCetakModal] = useState(false);
  const [showPresensiPulangModal, setShowPresensiPulangModal] = useState(false);
  const [showKeamananModal, setShowKeamananModal] = useState(false);
  const [pinOtorisasiPawas, setPinOtorisasiPawas] = useState<string[]>(['', '', '', '', '', '']);
  const [showTimePickerModal, setShowTimePickerModal] = useState(false);
  const [showLightboxModal, setShowLightboxModal] = useState(false);
  const [lightboxImg, setLightboxImg] = useState({ url: '', title: '', meta: '', desc: '' });
  const [showHotspotModal, setShowHotspotModal] = useState(false);

  // Supervisi & Validasi State
  const [valFilterStatus, setValFilterStatus] = useState<string>('semua');
  const [valFilterPlatform, setValFilterPlatform] = useState<string>('all');
  const [valFilterKategori, setValFilterKategori] = useState<string>('all');
  const [selectedValComplaint, setSelectedValComplaint] = useState<any | null>(null);

  // Live Stopwatch SLA 3 Cockpit
  const [slaClockSeconds, setSlaClockSeconds] = useState<number>(0);
  const slaClockStartRef = useRef<number>(Date.now());
  // Detik hanya di-render ulang saat tab validasi aktif (satu-satunya pemakai), bukan seluruh konsol tiap detik
  useEffect(() => {
    if (activeTab !== 'view-validasi') return;
    const tick = () => setSlaClockSeconds(Math.floor((Date.now() - slaClockStartRef.current) / 1000));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [activeTab]);

  const formatSlaClock = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Penolakan Form State (Screen 8 & Modal)
  const [tolakComplaint, setTolakComplaint] = useState<any | null>(null);
  const [showTolakModal, setShowTolakModal] = useState<boolean>(false);
  const [tolakKategori, setTolakKategori] = useState('');
  const [tolakAlasan, setTolakAlasan] = useState('');

  // Buat Log (+) Form State (Screen 3)
  const [logWaktuMulai, setLogWaktuMulai] = useState('');
  const [logSektor, setLogSektor] = useState('');
  const [logJenis, setLogJenis] = useState<string>('');
  const [logDeskripsi, setLogDeskripsi] = useState('');
  const [logFotoPreview, setLogFotoPreview] = useState<string | null>(null);

  // Master Filter Options from Database
  const [dbCategories, setDbCategories] = useState<any[]>(() => initialMasterData?.categories || initialPawasData?.filterData?.categories || []);
  const [dbSubcategories, setDbSubcategories] = useState<any[]>(() => initialMasterData?.subcategories || initialPawasData?.filterData?.subcategories || []);
  const [dbPlatforms, setDbPlatforms] = useState<any[]>(() => initialMasterData?.platforms || initialPawasData?.filterData?.platforms || []);
  const [dbGiats, setDbGiats] = useState<any[]>(() => initialMasterData?.giats || initialPawasData?.filterData?.giats || []);
  const [dbSatuans, setDbSatuans] = useState<any[]>(() => initialMasterData?.satuans || initialPawasData?.filterData?.satuans || []);
  const [dbStatuses, setDbStatuses] = useState<any[]>(() => initialMasterData?.statuses || initialPawasData?.filterData?.statuses || []);
  const [dbRejectionReasons, setDbRejectionReasons] = useState<any[]>(() => initialMasterData?.rejectionReasons || initialPawasData?.filterData?.rejectionReasons || []);
  const [dbUrgencyLevels, setDbUrgencyLevels] = useState<any[]>(() => initialMasterData?.urgencyLevels || initialPawasData?.filterData?.urgencyLevels || []);

  // Daftar Satuan Armada Presisi Dinamis
  const daftarArmadaAktif = useMemo(() => {
    const sourceSatuans = dbSatuans.length > 0 ? dbSatuans : [];
    const defaultOffice = policeOffices.length > 0 ? policeOffices[0] : null;
    const fallbackLat = defaultOffice?.lat != null ? Number(defaultOffice.lat) : null;
    const fallbackLng = defaultOffice?.lng != null ? Number(defaultOffice.lng) : null;

    return sourceSatuans.map((mu) => {
      const officer = registeredUnits.find(
        (u) => (u.unitId || '').toLowerCase() === mu.key.toLowerCase()
      );
      const vehicle = fleetUnits.find(
        (f) =>
          (f.category || f.unit_key || f.unitId || '').toLowerCase() === mu.key.toLowerCase() ||
          ((mu.key.toLowerCase() === 'sabhara' || mu.key.toLowerCase() === 'samapta') &&
            (f.category === 'sabhara' || f.category === 'samapta' || f.category === 'perintis'))
      );

      const cleanOfficerNama = officer?.nama || '';
      const cleanPangkat = (officer?.pangkat || '').trim();
      const formattedKomandanName = (cleanPangkat && cleanOfficerNama.toLowerCase().startsWith(cleanPangkat.toLowerCase()))
        ? cleanOfficerNama
        : cleanPangkat ? `${cleanPangkat} ${cleanOfficerNama}`.trim() : cleanOfficerNama;

      const komandan = officer
        ? formattedKomandanName + (officer.kelompokRegu ? ` (${officer.kelompokRegu})` : '')
        : 'Belum ada personel standby';

      const nrpKomandan = officer?.nrp || '-';
      const posisiSaatIni = officer?.kelompokRegu;

      const kekuatan = vehicle ? vehicle.title : 'Unit Belum Diawaki';

      const unitLat = officer?.live_lat != null
        ? Number(officer.live_lat)
        : officer?.lat != null
        ? Number(officer.lat)
        : fallbackLat;

      const unitLng = officer?.live_lng != null
        ? Number(officer.live_lng)
        : officer?.lng != null
        ? Number(officer.lng)
        : fallbackLng;

      const distToOffice = (unitLat != null && unitLng != null && fallbackLat != null && fallbackLng != null)
        ? calculateDistanceHaversineKm(unitLat, unitLng, fallbackLat, fallbackLng)
        : 0;
      const jarakBase = distToOffice > 0 ? distToOffice : null;
      const etaBase = jarakBase != null ? Math.max(2, Math.round((jarakBase / 30) * 60)) : null;

      return {
        id: mu.key,
        satuanId: mu.key,
        nama: mu.unit_name,
        namaSingkat: mu.unit_name,
        satuan: mu.unit_name,
        sektorUtama: posisiSaatIni,
        komandan,
        nrpKomandan,
        posisiSaatIni,
        kekuatan,
        lat: unitLat,
        lng: unitLng,
        jarakBase,
        etaBase,
        icon: mu.icon_emoji,
        tupoksi: mu.duties,
        arahanDefault: mu.default_orders,
      };
    });
  }, [dbSatuans, registeredUnits, fleetUnits, policeOffices]);

  const isDataLoadingRef = useRef(false);
  const dataLoadedRef = useRef(!!initialPawasData);

  const loadData = async (force = false) => {
    if (isDataLoadingRef.current || (dataLoadedRef.current && !force)) return;
    isDataLoadingRef.current = true;
    setLoading(true);

    try {
      const res = await getPawasUnifiedDataAction();
      if (res.success && res.data) {
        const d = res.data;
        if (d.filterData) {
          if (Array.isArray(d.filterData.categories)) setDbCategories(d.filterData.categories);
          if (Array.isArray(d.filterData.subcategories)) setDbSubcategories(d.filterData.subcategories);
          if (Array.isArray(d.filterData.platforms)) setDbPlatforms(d.filterData.platforms);
          if (Array.isArray(d.filterData.giats)) setDbGiats(d.filterData.giats);
          if (Array.isArray(d.filterData.satuans)) setDbSatuans(d.filterData.satuans);
          if (Array.isArray(d.filterData.statuses)) setDbStatuses(d.filterData.statuses);
          if (Array.isArray(d.filterData.rejectionReasons)) setDbRejectionReasons(d.filterData.rejectionReasons);
          if (Array.isArray(d.filterData.urgencyLevels)) setDbUrgencyLevels(d.filterData.urgencyLevels);
        }

        if (Array.isArray(d.pendingComplaints)) setAntreanPawas(d.pendingComplaints);
        if (Array.isArray(d.allRecentComplaints)) setAllRecentComplaints(d.allRecentComplaints);
        if (Array.isArray(d.registeredUnits)) setRegisteredUnits(d.registeredUnits);
        if (Array.isArray(d.fleetUnits)) setFleetUnits(d.fleetUnits);
        if (Array.isArray(d.policeOffices)) setPoliceOffices(d.policeOffices);
        if (Array.isArray(d.hotspots)) setHotspots(d.hotspots);
        if (d.ikmStats) setIkmStats(d.ikmStats);
        if (d.officerRankings) setOfficerRankings(d.officerRankings);
        if (Array.isArray(d.recentLogbooks)) setRecentActivities(d.recentLogbooks);

        dataLoadedRef.current = true;
      }
    } catch (e) {
      console.warn('Error loading command-center data:', e);
    } finally {
      isDataLoadingRef.current = false;
      setIsServerDataLoaded(true);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search) {
      const qParams = new URLSearchParams(window.location.search);
      const tabQ = qParams.get('tab') ? qParams.get('tab') : qParams.get('page');
      if (tabQ) {
        const matchedTab = parsePawasTab(tabQ);
        setActiveTab(matchedTab);
        const slug = pawasTabToSlug(matchedTab);
        window.history.replaceState(null, '', slug ? `/console/${slug}` : '/console');
      }
    }

    // 1. Ambil data sesi dinas terkini dari server jika belum dioper
    if (!session) {
      getCurrentSessionAction().then((res) => {
        if (res?.success && res?.data) {
          const d = res.data as any;
          setUserProfile((prev: any) => ({
            ...prev,
            ...d,
            fullName: d.fullName || prev.fullName,
            identifier: d.identifier || prev.identifier,
            nrp: d.identifier || prev.nrp,
            pangkat: d.pangkat || d.rankPangkat || prev.pangkat,
            unit: d.unit || d.satuanNama || prev.unit,
            role: d.role || prev.role,
            roleBadge: '',
            avatar: d.avatar || prev.avatar,
          }));
        }
      });
    }

    let sessionUser: any = null;
    try {
      const stored = sessionStorage.getItem('simapres_active_user');
      if (stored) sessionUser = JSON.parse(stored);
    } catch {}

    const effectiveNrp = nrpParam ? nrpParam : (sessionUser?.nrp ? sessionUser.nrp : (session?.identifier ? session.identifier : ''));

    if (sessionUser && sessionUser.fullName) {
      setUserProfile((prev: any) => ({
        ...prev,
        ...sessionUser,
        fullName: sessionUser.fullName ? sessionUser.fullName : (sessionUser.nama ? sessionUser.nama : prev.fullName),
        identifier: sessionUser.nrp ? sessionUser.nrp : (sessionUser.identifier ? sessionUser.identifier : prev.identifier),
        nrp: sessionUser.nrp ? sessionUser.nrp : (sessionUser.identifier ? sessionUser.identifier : prev.nrp),
        pangkat: sessionUser.pangkat ? sessionUser.pangkat : prev.pangkat,
        role: 'PAWAS',
        roleBadge: 'PAWAS',
        title: 'Perwira Pengawas (Pawas)',
        avatar: sessionUser.avatar ? sessionUser.avatar : prev.avatar,
      }));
    } else if (effectiveNrp && !session?.fullName) {
      getOfficerProfileByNrpAction(effectiveNrp).then((res) => {
        if (res?.success && res?.data) {
          setUserProfile((prev: any) => ({
            ...prev,
            fullName: res.data.nama ? res.data.nama : (res.data.namaLengkap ? res.data.namaLengkap : prev.fullName),
            nrp: res.data.nrp ? res.data.nrp : prev.nrp,
            identifier: res.data.nrp ? res.data.nrp : prev.identifier,
            pangkat: res.data.pangkat ? res.data.pangkat : (res.data.rankPangkat ? res.data.rankPangkat : prev.pangkat),
            unit: res.data.satuanNama ? res.data.satuanNama : prev.unit,
            role: 'PAWAS',
            roleBadge: 'PAWAS',
            title: 'Perwira Pengawas (Pawas)',
            avatar: res.data.avatarUrl ? res.data.avatarUrl : prev.avatar,
          }));
        }
      });
    }

    if (!dataLoadedRef.current) {
      loadData();
    }
  }, [nrpParam]);

  useEffect(() => {
    const handlePopState = () => {
      if (typeof window !== 'undefined') {
        const parts = window.location.pathname.split('/').filter(Boolean);
        const last = parts[parts.length - 1];
        if (parts[0] === 'console' && parts.length > 1) {
          setActiveTab(parsePawasTab(last));
        } else {
          setActiveTab('view-beranda');
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (activeTab !== 'view-peta') return;

    let isMounted = true;
    const pollFleet = async () => {
      // Jangan polling jika tab diminimize atau browser sedang tidak aktif
      if (typeof document !== 'undefined' && document.hidden) return;

      try {
        const fRes = await getPatrolFleetUnitsAction();
        if (!isMounted) return;
        if (fRes?.success && Array.isArray(fRes.data)) {
          // Bandingkan isi data untuk menghindari re-render dan kalkulasi ulang yang berlebihan
          setFleetUnits((prev) => {
            if (JSON.stringify(prev) === JSON.stringify(fRes.data)) {
              return prev;
            }
            return fRes.data;
          });
        } else if ((fRes as any)?.unauthenticated) {
          if (typeof window !== 'undefined') {
            window.location.href = '/?alert=unauthenticated&from=/console';
          }
        }
      } catch (err) {
        console.warn('Auto-polling fleet units warning:', err);
      }
    };

    // Polling setiap 20 detik (sebelumnya 8 detik) untuk ketenangan jaringan dan responsivitas optimal
    const pollInterval = setInterval(pollFleet, 20000);
    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, [activeTab]);

  const switchTab = (tabId: string) => {
    setActiveTab(tabId);
    const slug = pawasTabToSlug(tabId);
    const targetUrl = slug ? `/console/${slug}` : '/console';
    if (typeof window !== 'undefined' && window.location.pathname !== targetUrl) {
      window.history.pushState(null, '', targetUrl);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isComplaintRejected = (c: any) => {
    if (c?.status === 'DITOLAK') return true;
    if (c?.tahap_revisi === true) return true;
    const ket = (c?.ringkasanKeterangan || '').toUpperCase();
    return ket.includes('[DITOLAK PAWAS]') || ket.includes('[REVISI PAWAS]') || ket.includes('DITOLAK PAWAS');
  };

  const resolveComplaintStatus = (rawStatus?: string | null, isRejected?: boolean) => {
    const s = (rawStatus || '').toUpperCase().trim();
    const targetKey = isRejected || s === 'DITOLAK'
      ? 'DITOLAK'
      : s === 'SELESAI'
      ? 'SELESAI'
      : s === 'MENUNGGU_PENGESAHAN'
      ? 'MENUNGGU_PENGESAHAN'
      : s === 'DIPROSES'
      ? 'DIPROSES'
      : 'MENUNGGU';

    const dbItem = dbStatuses.find(
      (item) => item.key?.toUpperCase() === targetKey
    );

    const statusTheme: Record<string, { bg: string; color: string; border: string }> = {
      DITOLAK: { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' },
      SELESAI: { bg: '#ECFDF5', color: '#059669', border: '#A7F3D0' },
      MENUNGGU_PENGESAHAN: { bg: '#FAF5FF', color: '#7C3AED', border: '#DDD6FE' },
      DIPROSES: { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' },
      MENUNGGU: { bg: '#FFFBEB', color: '#D97706', border: '#FDE68A' },
    };

    const resolvedKey = dbItem ? dbItem.key.toUpperCase() : targetKey;
    const theme = statusTheme[resolvedKey] || { bg: '#F1F5F9', color: '#475569', border: '#CBD5E1' };
    const cleanLabel = dbItem?.label || (resolvedKey === 'DIPROSES' ? 'Sedang Ditangani' : resolvedKey === 'MENUNGGU' ? 'Menunggu Disposisi' : resolvedKey);

    return {
      id: dbItem?.id ?? 0,
      key: resolvedKey,
      label: cleanLabel,
      badge_color: theme.color,
      badge_bg: theme.bg,
      badge_border: theme.border,
      display_order: dbItem?.display_order ?? 1,
      icon: '',
    };
  };

  const matchesStatus = (c: any, status: string) => {
    if (!status || status === 'semua') return true;
    const isRejected = isComplaintRejected(c);
    const meta = resolveComplaintStatus(c?.status, isRejected);
    const stUpper = status.toUpperCase().trim();

    if (stUpper === meta.key) return true;
    if (stUpper === 'DIPROSES') {
      return meta.key === 'DIPROSES';
    }
    if (stUpper === 'MENUNGGU') {
      return meta.key === 'MENUNGGU';
    }
    return false;
  };

  const resolveUrgencyLevel = (rawUrgensi?: string | null) => {
    const u = (rawUrgensi || '').toUpperCase().trim();
    if (dbUrgencyLevels.length > 0) {
      const found = dbUrgencyLevels.find(
        (lvl: any) => lvl.key?.toUpperCase() === u || lvl.label?.toUpperCase() === u
      );
      if (found) {
        return {
          key: found.key,
          label: found.label,
          badge_bg: found.badge_bg,
          badge_color: found.badge_color,
          icon_emoji: found.icon_emoji,
        };
      }
    }
    return {
      key: u,
      label: u,
      badge_bg: '',
      badge_color: '',
      icon_emoji: '',
    };
  };

  const getComplaintPlatform = (c: any) => {
    if (c?.platformKey) return c.platformKey;
    if (c?.platformRel?.key) return c.platformRel.key;
    if (c?.saluranLaporan) return c.saluranLaporan;
    return '-';
  };

  const matchesPlatform = (c: any, platform: string) => {
    if (platform === 'all') return true;
    return getComplaintPlatform(c) === platform;
  };

  const getComplaintKategoriInfo = (c: any) => {
    const cleanNoEmoji = (str: string) => (str || '').replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();

    const getSafeCategoryStyle = (key?: string, dbBg?: string, dbColor?: string, dbBorder?: string) => {
      if (dbBg && dbColor) {
        return {
          background: dbBg,
          color: dbColor,
          border: `1px solid ${dbBorder || 'transparent'}`,
        };
      }
      const k = (key || '').toUpperCase();
      if (k === 'KRIMINAL' || k === '3C') {
        return { background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' };
      }
      if (k === 'KAMTIBMAS') {
        return { background: '#F5F3FF', color: '#7C3AED', border: '1px solid #DDD6FE' };
      }
      if (k === 'LANTAS') {
        return { background: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A' };
      }
      if (k === 'DARURAT' || k === 'BENCANA') {
        return { background: '#FFF1F2', color: '#E11D48', border: '1px solid #FECDD3' };
      }
      if (k === 'PELAYANAN') {
        return { background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0' };
      }
      return { background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE' };
    };

    const sub = c?.subcategory || c?.subcategory_rel;
    if (sub) {
      const subCat = sub.category_rel || dbCategories.find((cat: any) => cat.key === sub.category_key || cat.id === sub.category_id);
      if (subCat) {
        const rawLabel = sub.nama_kasus || subCat.label || subCat.key || '';
        const badgeText = cleanNoEmoji(rawLabel) || rawLabel;
        return {
          key: subCat.key,
          kategori: rawLabel,
          label: rawLabel,
          subKasus: sub.nama_kasus,
          subUnitKey: sub.unit_key,
          badgeText,
          badgeStyle: getSafeCategoryStyle(subCat.key, subCat.badge_bg, subCat.badge_color, subCat.badge_border),
        };
      }
    }

    const rel = c?.kategoriRel || c?.category_rel;
    if (rel) {
      const rawLabel = rel.label || rel.key || '';
      const badgeText = cleanNoEmoji(rawLabel) || rawLabel;
      return {
        key: rel.key,
        kategori: rawLabel,
        label: rawLabel,
        badgeText,
        badgeStyle: getSafeCategoryStyle(rel.key, rel.badge_bg, rel.badge_color, rel.badge_border),
      };
    }

    const targetId = c?.category_id || c?.kategoriId;
    if (targetId && dbCategories.length > 0) {
      const foundById = dbCategories.find((cat: any) => cat.id === targetId);
      if (foundById) {
        const rawLabel = foundById.label || foundById.key || '';
        const badgeText = cleanNoEmoji(rawLabel) || rawLabel;
        return {
          key: foundById.key,
          kategori: rawLabel,
          label: rawLabel,
          badgeText,
          badgeStyle: getSafeCategoryStyle(foundById.key, foundById.badge_bg, foundById.badge_color, foundById.badge_border),
        };
      }
    }

    const rawKey = (c?.kategoriKey || c?.kategori_key || '').toUpperCase();
    if (rawKey && dbCategories.length > 0) {
      const foundByKey = dbCategories.find((cat: any) => cat.key.toUpperCase() === rawKey || cat.label.toUpperCase() === rawKey);
      if (foundByKey) {
        const rawLabel = foundByKey.label || foundByKey.key || '';
        const badgeText = cleanNoEmoji(rawLabel) || rawLabel;
        return {
          key: foundByKey.key,
          kategori: rawLabel,
          label: rawLabel,
          badgeText,
          badgeStyle: getSafeCategoryStyle(foundByKey.key, foundByKey.badge_bg, foundByKey.badge_color, foundByKey.badge_border),
        };
      }
    }

    const platform = getComplaintPlatform(c);
    if (platform === 'personel' && dbGiats.length > 0) {
      const textGiat = `${c?.jenisAksi || ''} ${c?.jenisKejadian || ''} ${c?.ringkasanKeterangan || ''}`.toUpperCase();
      const foundGiat = dbGiats.find((g: any) => textGiat.includes((g.key || '').toUpperCase()) || textGiat.includes((g.label || '').toUpperCase()));
      if (foundGiat) {
        const rawLabel = foundGiat.label || foundGiat.key;
        const badgeText = cleanNoEmoji(rawLabel) || rawLabel;
        return {
          key: foundGiat.key,
          kategori: rawLabel,
          label: rawLabel,
          badgeText,
          badgeStyle: getSafeCategoryStyle(foundGiat.key, foundGiat.badge_bg, foundGiat.badge_color, foundGiat.badge_border),
        };
      }
    }

    const jenis = (c?.jenisKejadian || '').toLowerCase();
    const katLaporan = (c?.kategoriLaporan || '').toLowerCase();
    const combined = `${jenis} ${katLaporan}`;
    const ringkasan = (c?.ringkasanKeterangan || '').toLowerCase();

    if (dbSubcategories.length > 0) {
      const matchedSub = dbSubcategories.find((s: any) => {
        const subName = (s.nama_kasus || '').toLowerCase();
        return combined.includes(subName) || ringkasan.includes(subName) || subName.includes(jenis);
      });
      if (matchedSub) {
        const subCat = matchedSub.category_rel || dbCategories.find((cat: any) => cat.key === matchedSub.category_key || cat.id === matchedSub.category_id);
        if (subCat) {
          const rawLabel = subCat.label || subCat.key || '';
          const badgeText = cleanNoEmoji(rawLabel) || rawLabel;
          return {
            key: subCat.key,
            kategori: rawLabel,
            label: rawLabel,
            subKasus: matchedSub.nama_kasus,
            subUnitKey: matchedSub.unit_key,
            badgeText,
            badgeStyle: getSafeCategoryStyle(subCat.key, subCat.badge_bg, subCat.badge_color, subCat.badge_border),
          };
        }
      }
    }

    const fallbackLabel = cleanNoEmoji(c?.kategoriLaporan || c?.jenisKejadian || 'Belum Dikategorikan') || 'Belum Dikategorikan';
    return {
      key: 'TIDAK_TERKATEGORI',
      kategori: fallbackLabel,
      label: fallbackLabel,
      badgeText: fallbackLabel,
      badgeStyle: {
        background: '#F1F5F9',
        color: '#475569',
        border: '1px solid #E2E8F0',
      },
    };
  };

  const getComplaintKategori = (c: any): string => {
    return getComplaintKategoriInfo(c).key;
  };

  const matchesKategori = (c: any, kategori: string) => {
    if (kategori === 'all') return true;
    const catInfo = getComplaintKategoriInfo(c);
    const target = kategori.toUpperCase().trim();
    if (catInfo.key && catInfo.key.toUpperCase() === target) return true;
    if (catInfo.label && catInfo.label.toUpperCase().includes(target)) return true;

    if (c?.category_id && dbCategories.length > 0) {
      const cat = dbCategories.find((cc: any) => cc.id === c.category_id);
      if (cat && cat.key && cat.key.toUpperCase() === target) return true;
    }

    const normTarget = target;
    const normCurrent = catInfo.key.toUpperCase();
    return normTarget === normCurrent;
  };

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

  const handleSelectPlatformFilter = (plat: string) => {
    setValFilterPlatform(plat);
    setValFilterKategori('all');
    const nextFiltered = filterComplaintList(valFilterStatus, plat, 'all', allRecentComplaints);
    if (nextFiltered.length > 0) {
      setSelectedValComplaint(nextFiltered[0]);
    } else {
      setSelectedValComplaint(null);
    }
  };

  const handleSelectKategoriFilter = (kat: string) => {
    setValFilterKategori(kat);
    const nextFiltered = filterComplaintList(valFilterStatus, valFilterPlatform, kat, allRecentComplaints);
    if (nextFiltered.length > 0) {
      setSelectedValComplaint(nextFiltered[0]);
    } else {
      setSelectedValComplaint(null);
    }
  };

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

  const tambahArahanCepatPawas = (text: string) => {
    setArahanPawas((prev) => (prev ? `${prev} ${text}` : text));
  };

  const bukaModalDisposisi = (item: any) => {
    setSelectedDisposisiItem(item);
    setDisposisiFormErrors({});
    setSelectedSatuanKeys([]);
    setActivePreviewSatuanKey('');
    setShowEditPersonel(false);
    setCustomPersonelNama('-');

    const urgensiStr = (item.urgensi || '').toLowerCase();
    const textKasus = ((item.jenisKejadian || item.title || '') + ' ' + (item.kategori || '') + ' ' + (item.deskripsiKejadian || '')).toLowerCase();
    if (urgensiStr === 'darurat' || textKasus.includes('tawuran') || textKasus.includes('curas') || textKasus.includes('begal') || textKasus.includes('kebakaran')) {
      setKuotaPersonel(8);
    } else if (textKasus.includes('curanmor') || textKasus.includes('kriminal') || textKasus.includes('sajam')) {
      setKuotaPersonel(6);
    } else if (urgensiStr === 'normal' || textKasus.includes('mediasi') || textKasus.includes('sambang')) {
      setKuotaPersonel(2);
    } else {
      setKuotaPersonel(4);
    }

    const initialInstruksi =
      item.deskripsi_sop ||
      `Lakukan penanganan cepat di TKP terkait ${item.jenisKejadian || item.title || 'laporan warga'}, sterilisasi perimeter dan berikan pertolongan segera kepada warga/korban.`;
    setArahanPawas(initialInstruksi);
    setShowDisposisiModal(true);
  };

  const toggleSatuanSelection = (unitId: string) => {
    setSelectedSatuanKeys((prev) => {
      const exists = prev.includes(unitId);
      const updated = exists ? prev.filter((id) => id !== unitId) : [...prev, unitId];

      if (updated.length > 0) {
        setDisposisiFormErrors((ePrev) => {
          const next = { ...ePrev };
          delete next.satuan;
          return next;
        });
      }

      if (!exists) {
        setActivePreviewSatuanKey(unitId);
        const target = daftarArmadaAktif.find((a) => a.id === unitId);
        if (target) {
          setCustomPersonelNama(target.komandan);
          if (target.arahanDefault && !arahanPawas) {
            setArahanPawas(target.arahanDefault);
            setDisposisiFormErrors((ePrev) => {
              const next = { ...ePrev };
              delete next.arahan;
              return next;
            });
          }
        }
      } else {
        if (activePreviewSatuanKey === unitId) {
          const nextLead = updated.length > 0 ? updated[0] : '';
          setActivePreviewSatuanKey(nextLead);
          if (nextLead) {
            const target = daftarArmadaAktif.find((a) => a.id === nextLead);
            if (target) setCustomPersonelNama(target.komandan);
          } else {
            setCustomPersonelNama('-');
          }
        }
      }

      return updated;
    });
  };

  const handleConfirmDisposisi = async () => {
    if (!selectedDisposisiItem) return;

    const errors = validateDisposisiForm();
    if (Object.keys(errors).length > 0) {
      setDisposisiFormErrors(errors);
      showFriendlyToast('warning', 'Disposisi Belum Lengkap', Object.values(errors)[0]);
      return;
    }

    setDisposisiFormErrors({});
    setLoading(true);
    try {
      const chosenArmadas = daftarArmadaAktif.filter((a) => selectedSatuanKeys.includes(a.id));
      const leadArmada = daftarArmadaAktif.find((a) => a.id === activePreviewSatuanKey) || chosenArmadas[0];

      const incidentLat = Number(selectedDisposisiItem?.tkpLat ?? selectedDisposisiItem?.lat ?? selectedDisposisiItem?.tkp_lat ?? 0);
      const incidentLng = Number(selectedDisposisiItem?.tkpLng ?? selectedDisposisiItem?.lng ?? selectedDisposisiItem?.tkp_lng ?? 0);

      let computedDistance = '1.2 km';
      let computedEta = '± 4 Menit';

      if (leadArmada && leadArmada.lat && leadArmada.lng && incidentLat && incidentLng) {
        const rawDistance = calculateDistanceHaversineKm(incidentLat, incidentLng, leadArmada.lat, leadArmada.lng);
        const d = rawDistance > 0 ? rawDistance : 0.5;
        computedDistance = `${d} km`;
        computedEta = `± ${Math.max(2, Math.round((d / 30) * 60))} Menit`;
      }

      const res = await disposisiMultiSatuanAction({
        complaintId: selectedDisposisiItem.id.toString(),
        satuanKeys: selectedSatuanKeys,
        kuotaPersonel: kuotaPersonel,
        arahanTaktis: arahanPawas,
        pawasNama: userProfile?.fullName || session?.fullName || '',
        pawasUserId: session?.userId ? String(session.userId) : (userProfile?.id ? String(userProfile.id) : ''),
        estimatedDistance: computedDistance,
        estimatedEta: computedEta,
      });

      if (res.success) {
        showFriendlyToast(
          'success',
          'Disposisi Taktis Berhasil Diterbitkan',
          `Tiket ${selectedDisposisiItem.nomorTiket} telah ditugaskan ke ${chosenArmadas.map((a) => a.namaSingkat).join(' & ')}. Personel segera meluncur ke TKP.`
        );
        setSuksesDisposisiData({
          nomorTiket: selectedDisposisiItem.nomorTiket,
          unitName: chosenArmadas.map((a) => a.namaSingkat).join(' & '),
          komandan: customPersonelNama && customPersonelNama !== '-' ? customPersonelNama : leadArmada?.komandan || '-',
          jarak: computedDistance,
          eta: computedEta,
          posisi: leadArmada?.posisiSaatIni || '-',
        });
        setShowDisposisiModal(false);
        setShowSuksesModal(true);
        await loadData();
        setValFilterStatus('sedang_ditangani');
        setSelectedValComplaint({
          ...selectedDisposisiItem,
          status: 'DIPROSES',
          tahap: 3,
          disposisi_at: new Date().toISOString(),
        });
      } else {
        showFriendlyToast('error', 'Gagal Menerbitkan Disposisi', res.error || 'Terjadi kendala saat menerbitkan disposisi. Silakan coba kembali.');
      }
    } catch (e: any) {
      showFriendlyToast('error', 'Terjadi Kendala Sistem', e.message || 'Sistem tidak dapat memproses disposisi saat ini.');
    } finally {
      setLoading(false);
    }
  };

  const handleSimpanLogKegiatan = async () => {
    const activeUserId = session?.userId ? String(session.userId) : (userProfile?.id ? String(userProfile.id) : '');
    if (!activeUserId) {
      showFriendlyToast('error', 'Sesi Berakhir', 'Sesi pengguna tidak valid. Silakan login kembali.');
      return;
    }
    setLoading(true);
    try {
      const nowTime = new Date().toTimeString().slice(0, 5);
      const res = await createLogbookAction({
        officerId: activeUserId,
        jenisAksi: (logJenis as any) || '-',
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
        showFriendlyToast('success', 'Buku Mutasi Berhasil', 'Log kegiatan dinas berhasil disimpan ke buku mutasi dan terverifikasi GPS.');
        switchTab('view-beranda');
        loadData();
      } else {
        showFriendlyToast('error', 'Gagal Menyimpan Log', res.error || 'Gagal menyimpan log.');
      }
    } catch (e: any) {
      showFriendlyToast('error', 'Terjadi Kendala', e.message || 'Gagal menyimpan log kegiatan.');
    } finally {
      setLoading(false);
    }
  };

  const bukaModalTolak = (complaint: any) => {
    setTolakComplaint(complaint);
    setShowTolakModal(true);
  };

  const handleConfirmRejectModal = async (reason: string, notes: string) => {
    if (!tolakComplaint) return;
    setLoading(true);
    try {
      const activePawasId = session?.userId ? String(session.userId) : (userProfile?.id ? String(userProfile.id) : '');
      const fullNote = notes ? `${reason}. Catatan: ${notes}` : reason;

      const res = await updateComplaintStatusAction({
        complaintId: tolakComplaint.id.toString(),
        status: 'DITOLAK',
        catatan: fullNote,
        pawasUserId: activePawasId,
      });

      if (res.success) {
        showFriendlyToast(
          'success',
          'Pengaduan Berhasil Ditolak',
          `Tiket ${tolakComplaint.nomorTiket || tolakComplaint.nomor_tiket} telah ditolak dan masuk ke tab Ditolak.`
        );
        const rejectedComplaint = {
          ...tolakComplaint,
          status: 'DITOLAK',
          status_id: 5,
          tahap: 1,
          alasanTolak: fullNote,
          alasan_tolak: fullNote,
        };
        setShowTolakModal(false);
        setTolakComplaint(null);
        await loadData();
        setValFilterStatus('ditolak');
        setSelectedValComplaint(rejectedComplaint);
        switchTab('view-validasi');
      } else {
        showFriendlyToast('error', 'Gagal Menolak Pengaduan', res.error || 'Terjadi kendala sistem.');
      }
    } catch (e: any) {
      showFriendlyToast('error', 'Gagal Menolak Pengaduan', e.message || 'Gagal mengirim penolakan.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPenolakan = async () => {
    if (!tolakComplaint) return;
    setLoading(true);
    try {
      const activePawasId = session?.userId ? String(session.userId) : (userProfile?.id ? String(userProfile.id) : '');
      const rejectNote = `${tolakKategori}. Catatan: ${tolakAlasan}`;
      await updateComplaintStatusAction({
        complaintId: tolakComplaint.id.toString(),
        status: 'DITOLAK',
        catatan: rejectNote,
        pawasUserId: activePawasId,
      });
      showFriendlyToast('success', 'Penolakan Berhasil Diteruskan', 'Permintaan revisi/penolakan berhasil diteruskan ke petugas penanggung jawab. Laporan masuk ke tab Ditolak.');
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
      showFriendlyToast('error', 'Gagal Mengirim Penolakan', e.message || 'Gagal mengirim penolakan.');
    } finally {
      setLoading(false);
    }
  };

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
        showFriendlyToast('success', 'Revisi Berhasil Diajukan', `Laporan #${complaint.nomorTiket || complaint.id} diajukan ulang ke Atasan. Status kembali MENUNGGU TINDAKAN.`);
        await loadData();
        setValFilterStatus('menunggu');
        setSelectedValComplaint({
          ...complaint,
          status: 'BELUM_DITANGANI',
          ringkasanKeterangan: newKeterangan,
        });
      } else {
        showFriendlyToast('error', 'Gagal Mengajukan Revisi', res.error || 'Gagal mengajukan revisi.');
      }
    } catch (e: any) {
      showFriendlyToast('error', 'Terjadi Kendala', e.message || 'Gagal mengajukan revisi.');
    } finally {
      setLoading(false);
    }
  };

  const handleSahkanPenutupanKasus = async (complaint: any) => {
    if (!complaint) return;
    setLoading(true);
    try {
      const activePawasId = session?.userId ? String(session.userId) : (userProfile?.id ? String(userProfile.id) : '');
      const activePawasNama = session?.fullName || userProfile?.nama || 'Pawas 110';
      const res = await sahkanKasusPawasAction({
        complaintId: complaint.id.toString(),
        pawasNama: activePawasNama,
        pawasUserId: activePawasId,
        catatanPengesahan: 'Berita acara lengkap, penanganan tuntas sesuai SOP Polri SIMOPMAS 110. Tiket resmi ditutup oleh Pawas.',
      });
      if (res.success) {
        showFriendlyToast('success', 'Kasus Resmi Disahkan & Ditutup', `Tiket ${complaint.nomorTiket || complaint.id} resmi disahkan & berstatus SELESAI.`);
        await loadData();
        setValFilterStatus('selesai');
        setSelectedValComplaint({
          ...complaint,
          status: 'SELESAI',
          selesaiAt: new Date().toISOString(),
        });
      } else {
        showFriendlyToast('error', 'Gagal Mengesahkan Kasus', res.error || 'Gagal mengesahkan penutupan kasus.');
      }
    } catch (e: any) {
      showFriendlyToast('error', 'Terjadi Kendala', e.message || 'Gagal mengesahkan kasus.');
    } finally {
      setLoading(false);
    }
  };

  const handlePresensiMasuk = () => {
    setPresensiStatus('SUDAH_MASUK');
    const jam = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
    setJamMasukPiket(jam + ' (Tervalidasi)');
    showFriendlyToast('success', 'Presensi Masuk Berhasil', `Jam: ${jam} • Area Mako Polres (Radius 50m) • Status: SIAGA PIKET AKTIF`);
  };

  const handlePresensiPulang = () => {
    setShowPresensiPulangModal(true);
  };

  const handleKonfirmasiPulangFinal = () => {
    setPresensiStatus('SUDAH_PULANG');
    const jam = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
    setJamPulangPiket(jam);
    setShowPresensiPulangModal(false);
    showFriendlyToast('info', 'Presensi Pulang Berhasil', `Pukul ${jam}. Terima kasih atas pelaksanaan dinas supervisi.`);
  };

  // Metrics calculation
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

  const logsForStatusTabs = allRecentComplaints.filter(
    (c) => matchesPlatform(c, valFilterPlatform) && matchesKategori(c, valFilterKategori)
  );
  const tabCountSemua = logsForStatusTabs.length;
  const tabCountMenunggu = logsForStatusTabs.filter((c) => matchesStatus(c, 'menunggu')).length;

  const logsForPlatform = allRecentComplaints.filter(
    (c) => matchesStatus(c, valFilterStatus) && matchesKategori(c, valFilterKategori)
  );
  const platCountAll = logsForPlatform.length;
  const platCountSos = logsForPlatform.filter((c) => matchesPlatform(c, 'sos')).length;
  const platCountWarga = logsForPlatform.filter((c) => matchesPlatform(c, 'warga')).length;
  const platCount110 = logsForPlatform.filter((c) => matchesPlatform(c, 'layanan110')).length;
  const platCountPersonel = logsForPlatform.filter((c) => matchesPlatform(c, 'personel')).length;

  const logsForKategori = allRecentComplaints.filter(
    (c) => matchesStatus(c, valFilterStatus) && matchesPlatform(c, valFilterPlatform)
  );
  const katCountAll = logsForKategori.length;

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

  const activeUnfinishedComplaints = allRecentComplaints.filter(
    (c) => c.status !== 'SELESAI' && c.status !== 'DITOLAK'
  );

  const highPriorityIncident =
    antreanPawas.find((c) => c.urgensi === 'DARURAT' || c.urgensi === 'PRIORITAS_TINGGI') ||
    antreanPawas[0] ||
    activeUnfinishedComplaints.find((c) => c.urgensi === 'DARURAT' || (c.platformKey || '').toLowerCase().includes('sos')) ||
    activeUnfinishedComplaints[0] ||
    null;

  const filteredValidasiComplaints = filterComplaintList(
    valFilterStatus,
    valFilterPlatform,
    valFilterKategori,
    allRecentComplaints
  );

  const activeComplaint =
    filteredValidasiComplaints.find((c) => c.id === selectedValComplaint?.id) ||
    filteredValidasiComplaints[0] ||
    null;

  return (
    <div
      className="registrasi-body"
      style={activeTab === 'view-peta' ? { minHeight: '100vh', height: '100vh', overflow: 'hidden' } : undefined}
    >

      {/* ── TOPBAR (same design as Superadmin) ── */}
      <header className="topbar">
        <div
          className="topbar-brand"
          style={{ cursor: 'pointer', textDecoration: 'none' }}
          onClick={() => switchTab('view-beranda')}
        >
          <div className="brand-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={22} color="#38BDF8" strokeWidth={2.4} />
          </div>
          <div>
            <div className="brand-title">SIMOPMAS 110 • POLRI</div>
            <div className="brand-subtitle">Konsol Operasional Terpadu – Pengawas &amp; Komando</div>
          </div>
        </div>

        <div className="topbar-nav" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <HeaderProfileBadge
            name={userProfile.fullName || 'AKBP Bambang Wijaya, S.I.K., M.Si.'}
            identifier={userProfile.identifier || userProfile.nrp || '78091122'}
            role={userProfile.roleBadge ? userProfile.roleBadge : 'PAWAS'}
            avatar={userProfile.avatar || null}
            isActive={activeTab === 'view-profil'}
            hasNotification={menungguCount > 0}
            onBellClick={() => openValidasiList('menunggu')}
            onClick={() => switchTab('view-profil')}
          />
        </div>
      </header>

      {/* ── HORIZONTAL TAB BAR (Desktop Only - Clean, Sleek, No Cluttered Badges) ── */}
      {activeTab !== 'view-profil' && (
        <div
          className="tabs-master-wrapper pawas-desktop-tabs"
          style={{
            background: 'white',
            borderBottom: '1px solid #E2E8F0',
            boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
            position: 'sticky',
            zIndex: 90,
          }}
        >
          <div
            className="tabs-master-scroller"
            style={{
              maxWidth: '1440px',
              margin: '0 auto',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              overflowX: 'auto',
              scrollbarWidth: 'none',
            }}
          >
            {/* TAB: BERANDA */}
            <button
              type="button"
              id="nav-beranda"
              onClick={() => switchTab('view-beranda')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '8px 18px', borderRadius: '8px', fontSize: '12.5px', fontWeight: 700,
                cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s ease',
                background: activeTab === 'view-beranda' ? '#153E75' : '#F8FAFC',
                color: activeTab === 'view-beranda' ? 'white' : '#475569',
                border: activeTab === 'view-beranda' ? '1px solid #153E75' : '1px solid #E2E8F0',
              }}
            >
              <Home size={15} strokeWidth={2.2} />
              <span>Beranda</span>
            </button>

            {/* TAB: PETA TAKTIS */}
            <button
              type="button"
              id="nav-peta"
              onClick={() => switchTab('view-peta')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '8px 18px', borderRadius: '8px', fontSize: '12.5px', fontWeight: 700,
                cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s ease',
                background: activeTab === 'view-peta' ? '#153E75' : '#F8FAFC',
                color: activeTab === 'view-peta' ? 'white' : '#475569',
                border: activeTab === 'view-peta' ? '1px solid #153E75' : '1px solid #E2E8F0',
              }}
            >
              <Map size={15} strokeWidth={2.2} />
              <span>Peta Taktis</span>
            </button>

            {/* TAB: KOMANDO & VALIDASI PAWAS */}
            <button
              type="button"
              id="nav-validasi"
              onClick={() => switchTab('view-validasi')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '8px 18px', borderRadius: '8px', fontSize: '12.5px', fontWeight: 700,
                cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s ease',
                background: activeTab === 'view-validasi' ? '#153E75' : '#F8FAFC',
                color: activeTab === 'view-validasi' ? 'white' : '#475569',
                border: activeTab === 'view-validasi' ? '1px solid #153E75' : '1px solid #E2E8F0',
              }}
            >
              <ShieldAlert size={15} strokeWidth={2.2} />
              <span>Komando Pawas</span>
              {pengesahanCount > 0 && (
                <span
                  style={{
                    background: activeTab === 'view-validasi' ? '#EF4444' : '#DC2626',
                    color: 'white',
                    fontSize: '10.5px',
                    fontWeight: 800,
                    padding: '1px 6px',
                    borderRadius: '10px',
                  }}
                >
                  {pengesahanCount}
                </span>
              )}
            </button>

            {/* TAB: KINERJA */}
            <button
              type="button"
              id="nav-kinerja"
              onClick={() => switchTab('view-laporan')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '8px 18px', borderRadius: '8px', fontSize: '12.5px', fontWeight: 700,
                cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s ease',
                background: activeTab === 'view-laporan' ? '#153E75' : '#F8FAFC',
                color: activeTab === 'view-laporan' ? 'white' : '#475569',
                border: activeTab === 'view-laporan' ? '1px solid #153E75' : '1px solid #E2E8F0',
              }}
            >
              <BarChart3 size={15} strokeWidth={2.2} />
              <span>Kinerja</span>
            </button>

            {/* TAB: BUKU PINTAR SOP & LAYANAN */}
            <button
              type="button"
              id="nav-panduan"
              onClick={() => switchTab('view-panduan')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '8px 18px', borderRadius: '8px', fontSize: '12.5px', fontWeight: 700,
                cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s ease',
                background: activeTab === 'view-panduan' ? '#153E75' : '#F8FAFC',
                color: activeTab === 'view-panduan' ? 'white' : '#475569',
                border: activeTab === 'view-panduan' ? '1px solid #153E75' : '1px solid #E2E8F0',
              }}
            >
              <BookOpen size={15} strokeWidth={2.2} />
              <span>Buku Pintar SOP</span>
            </button>

          </div>
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      <main className={`pawas-content-area ${activeTab === 'view-peta' ? 'pawas-peta-active' : 'registrasi-container'}`} style={activeTab === 'view-peta' ? { flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 } : undefined}>
        <EscalationAlarmBanner
          complaints={allRecentComplaints}
          onOpenDisposisi={(comp) => {
            setSelectedDisposisiItem(comp);
            setShowDisposisiModal(true);
          }}
        />

        {activeTab === 'view-beranda' && (
          <TabBerandaPawas
            userProfile={userProfile}
            presensiStatus={presensiStatus}
            isServerDataLoaded={isServerDataLoaded}
            switchTab={switchTab}
            highPriorityIncident={highPriorityIncident}
            openValidasiList={openValidasiList}
            openValidasiWithPlatform={openValidasiWithPlatform}
            setSelectedValComplaint={setSelectedValComplaint}
            setShowHotspotModal={setShowHotspotModal}
            setShowSlaModal={setShowSlaModal}
            setShowKuatPersModal={setShowKuatPersModal}
            setShowIkmModal={setShowIkmModal}
            fleetUnits={fleetUnits}
            hotspots={hotspots}
            policeOffices={policeOffices}
            totalLaporan={totalLaporan}
            menungguCount={menungguCount}
            ditolakCount={ditolakCount}
            diprosesCount={diprosesCount}
            pengesahanCount={pengesahanCount}
            selesaiCount={selesaiCount}
            sosCount={sosCount}
            wargaCount={wargaCount}
            hotline110Count={hotline110Count}
            personelCount={personelCount}
            allRecentComplaints={allRecentComplaints}
            completedWithTime={completedWithTime}
            avgResponseTime={avgResponseTime}
            onTimeRate={onTimeRate}
            fastCount={fastCount}
            mediumCount={mediumCount}
            slowCount={slowCount}
            registeredUnits={registeredUnits}
            satisfactionRating={satisfactionRating}
            satisfactionPercent={satisfactionPercent}
            recentActivities={recentActivities}
          />
        )}

        {activeTab === 'view-peta' && (
          <TabTacticalMapPawas
            userProfile={userProfile}
            fleetUnits={fleetUnits}
            hotspots={hotspots}
            policeOffices={policeOffices}
            setShowHotspotModal={setShowHotspotModal}
            highPriorityIncident={highPriorityIncident}
            resolveUrgencyLevel={resolveUrgencyLevel}
            showFriendlyToast={showFriendlyToast}
          />
        )}

        {activeTab === 'view-log' && (
          <TabBuatLogPawas
            logWaktuMulai={logWaktuMulai}
            setShowTimePickerModal={setShowTimePickerModal}
            logSektor={logSektor}
            setLogSektor={setLogSektor}
            logJenis={logJenis}
            setLogJenis={setLogJenis}
            dbGiats={dbGiats}
            logDeskripsi={logDeskripsi}
            setLogDeskripsi={setLogDeskripsi}
            logFotoPreview={logFotoPreview}
            setLogFotoPreview={setLogFotoPreview}
            handleSimpanLogKegiatan={handleSimpanLogKegiatan}
            loading={loading}
          />
        )}

        {activeTab === 'view-validasi' && (
          <TabValidasiPawas
            userProfile={userProfile}
            switchTab={switchTab}
            dbStatuses={dbStatuses}
            dbPlatforms={dbPlatforms}
            dbCategories={dbCategories}
            dbGiats={dbGiats}
            logsForStatusTabs={logsForStatusTabs}
            logsForKategori={logsForKategori}
            tabCountSemua={tabCountSemua}
            tabCountMenunggu={tabCountMenunggu}
            platCountAll={platCountAll}
            platCountSos={platCountSos}
            platCountWarga={platCountWarga}
            platCount110={platCount110}
            platCountPersonel={platCountPersonel}
            katCountAll={katCountAll}
            valFilterStatus={valFilterStatus}
            setValFilterStatus={setValFilterStatus}
            valFilterPlatform={valFilterPlatform}
            setValFilterPlatform={setValFilterPlatform}
            valFilterKategori={valFilterKategori}
            setValFilterKategori={setValFilterKategori}
            openValidasiList={openValidasiList}
            handleSelectPlatformFilter={handleSelectPlatformFilter}
            handleSelectKategoriFilter={handleSelectKategoriFilter}
            handleResetFilters={handleResetFilters}
            filteredValidasiComplaints={filteredValidasiComplaints}
            activeComplaint={activeComplaint}
            setSelectedValComplaint={setSelectedValComplaint}
            matchesStatus={matchesStatus}
            matchesKategori={matchesKategori}
            getComplaintKategoriInfo={getComplaintKategoriInfo}
            isComplaintRejected={isComplaintRejected}
            resolveComplaintStatus={resolveComplaintStatus}
            bukaModalDisposisi={bukaModalDisposisi}
            handleAjukanRevisi={handleAjukanRevisi}
            handleSahkanPenutupanKasus={handleSahkanPenutupanKasus}
            setTolakComplaint={setTolakComplaint}
            bukaModalTolak={bukaModalTolak}
            setLightboxImg={setLightboxImg}
            setShowLightboxModal={setShowLightboxModal}
            fleetUnits={fleetUnits}
            slaClockSeconds={slaClockSeconds}
            formatSlaClock={formatSlaClock}
            loading={loading}
            isServerDataLoaded={isServerDataLoaded}
          />
        )}

        {activeTab === 'view-laporan' && (
          <TabKinerjaPawas
            userProfile={userProfile}
            setShowCetakModal={setShowCetakModal}
            allRecentComplaints={allRecentComplaints}
            onTimeRate={onTimeRate}
            onTimeCount={onTimeCount}
            completedWithTime={completedWithTime}
            totalLaporan={totalLaporan}
            avgResponseTime={avgResponseTime}
            fleetUnits={fleetUnits}
            registeredUnits={registeredUnits}
            satisfactionRating={satisfactionRating}
            satisfactionPercent={satisfactionPercent}
            officerRankings={officerRankings}
          />
        )}

        {activeTab === 'view-profil' && (
          <TabProfilPawas
            currentUser={userProfile}
            setCurrentUser={setUserProfile}
            totalLaporan={totalLaporan}
            selesaiCount={selesaiCount}
            responCepatPct={completedWithTime.length > 0 ? `${onTimeRate}%` : '0%'}
            allRecentComplaints={allRecentComplaints}
            units={fleetUnits.length > 0 ? fleetUnits : registeredUnits}
            policeOffices={policeOffices}
            showToast={showToast}
            onBackToBeranda={() => switchTab('view-beranda')}
            onLogout={async () => {
              await logoutAction();
              router.push('/');
            }}
            presensiStatus={presensiStatus}
            setPresensiStatus={setPresensiStatus}
            jamMasukPiket={jamMasukPiket}
            setJamMasukPiket={setJamMasukPiket}
            jamPulangPiket={jamPulangPiket}
            setJamPulangPiket={setJamPulangPiket}
            onOpenPresensiPulangModal={handlePresensiPulang}
          />
        )}

        {activeTab === 'view-operator' && (
          <TabOperatorCadPawas
            switchTab={switchTab}
            userProfile={userProfile}
            simCaller={simCaller}
            setSimCaller={setSimCaller}
            cadFormErrors={cadFormErrors}
            setCadFormErrors={setCadFormErrors}
            dbSubcategories={dbSubcategories}
            dbUrgencyLevels={dbUrgencyLevels}
            cadLocationSuggestions={cadLocationSuggestions}
            showCadSuggestions={showCadSuggestions}
            setShowCadSuggestions={setShowCadSuggestions}
            isSearchingCadLocation={isSearchingCadLocation}
            handleCadLocationSearch={handleCadLocationSearch}
            handleSelectCadSuggestion={handleSelectCadSuggestion}
            validateCadForm={validateCadForm}
            loading={loading}
            setLoading={setLoading}
            showFriendlyToast={showFriendlyToast}
            bukaModalDisposisi={bukaModalDisposisi}
            bukaModalTolak={bukaModalTolak}
            setTolakComplaint={setTolakComplaint}
            loadData={loadData}
            session={session}
            antreanPawas={antreanPawas}
          />
        )}

        {activeTab === 'view-tolak' && (
          <TabTolakLogPawas
            switchTab={switchTab}
            tolakComplaint={tolakComplaint}
            tolakKategori={tolakKategori}
            setTolakKategori={setTolakKategori}
            dbRejectionReasons={dbRejectionReasons}
            tolakAlasan={tolakAlasan}
            setTolakAlasan={setTolakAlasan}
            handleSubmitPenolakan={handleSubmitPenolakan}
            loading={loading}
          />
        )}

        {activeTab === 'view-panduan' && (
          <TabBukuPintarSop
            switchTab={switchTab}
            userProfile={userProfile}
            showFriendlyToast={showFriendlyToast}
            initialCallerPhone={simCaller?.telepon || ''}
            initialCallerName={simCaller?.nama || ''}
          />
        )}
      </main>

      {/* ── BOTTOM NAVIGATION (Mobile & Tablet Pawas & Operator) ── */}
      <nav className="bottom-nav pawas-bottom-nav">
        {/* TAB: BERANDA */}
        <div
          id="pawas-bottom-nav-beranda"
          className={`nav-item ${activeTab === 'view-beranda' ? 'active' : ''}`}
          onClick={() => switchTab('view-beranda')}
        >
          <span className="nav-icon">
            <Home size={20} strokeWidth={activeTab === 'view-beranda' ? 2.4 : 1.8} />
          </span>
          <span className="nav-label">Beranda</span>
        </div>

        {/* TAB: PETA TAKTIS */}
        <div
          id="pawas-bottom-nav-peta"
          className={`nav-item ${activeTab === 'view-peta' ? 'active' : ''}`}
          onClick={() => switchTab('view-peta')}
        >
          <span className="nav-icon">
            <Map size={20} strokeWidth={activeTab === 'view-peta' ? 2.4 : 1.8} />
          </span>
          <span className="nav-label">Peta</span>
        </div>

        {/* TAB: KOMANDO PAWAS - Elevated Center Action Button */}
        <div
          id="pawas-bottom-nav-komando"
          className={`nav-item nav-item-center ${activeTab === 'view-validasi' ? 'active' : ''}`}
          onClick={() => switchTab('view-validasi')}
          title="Komando Pawas"
        >
          <div className="nav-center-btn">
            <ShieldAlert size={23} color="#FFFFFF" strokeWidth={2.4} />
          </div>
        </div>

        {/* TAB: KINERJA */}
        <div
          id="pawas-bottom-nav-kinerja"
          className={`nav-item ${activeTab === 'view-laporan' ? 'active' : ''}`}
          onClick={() => switchTab('view-laporan')}
        >
          <span className="nav-icon">
            <BarChart3 size={20} strokeWidth={activeTab === 'view-laporan' ? 2.4 : 1.8} />
          </span>
          <span className="nav-label">Kinerja</span>
        </div>

        {/* TAB: PROFIL */}
        <div
          id="pawas-bottom-nav-profil"
          className={`nav-item ${activeTab === 'view-profil' ? 'active' : ''}`}
          onClick={() => switchTab('view-profil')}
        >
          <span className="nav-icon">
            <User size={20} strokeWidth={activeTab === 'view-profil' ? 2.4 : 1.8} />
          </span>
          <span className="nav-label">Profil</span>
        </div>
      </nav>

      {/* MODAL COMPONENTS (MODULAR & REUSABLE) */}
      <ModalDisposisiPawas
        isOpen={showDisposisiModal}
        onClose={() => setShowDisposisiModal(false)}
        selectedItem={selectedDisposisiItem}
        dbSubcategories={dbSubcategories}
        daftarArmadaAktif={daftarArmadaAktif}
        selectedSatuanKeys={selectedSatuanKeys}
        toggleSatuanSelection={toggleSatuanSelection}
        kuotaPersonel={kuotaPersonel}
        setKuotaPersonel={setKuotaPersonel}
        arahanPawas={arahanPawas}
        setArahanPawas={setArahanPawas}
        tambahArahanCepatPawas={tambahArahanCepatPawas}
        handleConfirmDisposisi={handleConfirmDisposisi}
        loading={loading}
        getSopRecommendationByIncident={getSopRecommendationByIncident}
        calculateDistanceHaversineKm={calculateDistanceHaversineKm}
        activePreviewSatuanKey={activePreviewSatuanKey}
      />

      <ModalSuksesDisposisi
        isOpen={showSuksesModal}
        onClose={() => setShowSuksesModal(false)}
        data={suksesDisposisiData}
      />

      <ModalSlaMonitoring
        isOpen={showSlaModal}
        onClose={() => setShowSlaModal(false)}
        avgResponseTime={Number(avgResponseTime) || 0}
        onTimeRate={Number(onTimeRate) || 0}
        fastCount={fastCount}
        mediumCount={mediumCount}
        slowCount={slowCount}
        complaints={completedWithTime}
      />

      <ModalKuatPers
        isOpen={showKuatPersModal}
        onClose={() => setShowKuatPersModal(false)}
        registeredUnits={registeredUnits}
        fleetUnits={fleetUnits}
      />

      <ModalIkm
        isOpen={showIkmModal}
        onClose={() => setShowIkmModal(false)}
        satisfactionRating={Number(satisfactionRating) || 0}
        satisfactionPercent={Number(satisfactionPercent) || 0}
        complaints={allRecentComplaints}
      />

      <ModalCetakLaporan
        isOpen={showCetakModal}
        onClose={() => setShowCetakModal(false)}
        registeredUnits={registeredUnits}
        fleetUnits={fleetUnits}
        ikmStats={ikmStats}
        totalLaporan={totalLaporan}
        userProfile={userProfile}
      />

      <ModalHotspotPawas
        isOpen={showHotspotModal}
        onClose={() => setShowHotspotModal(false)}
        hotspots={hotspots}
        dbCategories={dbCategories}
        loadData={loadData}
        showFriendlyToast={showFriendlyToast}
      />

      <ModalTimePicker
        isOpen={showTimePickerModal}
        onClose={() => setShowTimePickerModal(false)}
        onSelectTimeRange={(range: string) => {
          setLogWaktuMulai(range);
          setShowTimePickerModal(false);
        }}
      />

      <ModalPresensiPulang
        isOpen={showPresensiPulangModal}
        onClose={() => setShowPresensiPulangModal(false)}
        onConfirmPulang={handleKonfirmasiPulangFinal}
      />

      <ModalKeamananPawas
        isOpen={showKeamananModal}
        onClose={() => setShowKeamananModal(false)}
        session={session}
        pinOtorisasiPawas={pinOtorisasiPawas}
        setPinOtorisasiPawas={setPinOtorisasiPawas}
        showFriendlyToast={showFriendlyToast}
      />

      <ModalLightbox
        isOpen={showLightboxModal}
        onClose={() => setShowLightboxModal(false)}
        lightboxImg={lightboxImg}
      />

      <ModalTolakPengaduan
        isOpen={showTolakModal}
        onClose={() => setShowTolakModal(false)}
        complaint={tolakComplaint}
        onConfirmReject={handleConfirmRejectModal}
        loading={loading}
      />

    </div>
  );
}

export default function PawasConsoleView({
  session,
  initialSection = 'beranda',
  initialMasterData,
  initialPawasData,
}: {
  session?: any;
  initialSection?: string;
  initialMasterData?: any;
  initialPawasData?: any;
}) {
  return (
    <React.Suspense fallback={<ConsoleSkeleton role="PAWAS" />}>
      <CommandCenterContent
        session={session}
        initialSection={initialSection}
        initialMasterData={initialMasterData}
        initialPawasData={initialPawasData}
      />
    </React.Suspense>
  );
}
