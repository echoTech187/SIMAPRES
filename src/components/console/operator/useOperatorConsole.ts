'use client';

import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  disposisiMultiSatuanAction,
  updateComplaintStatusAction,
} from '@/app/actions/complaint.actions';
import { logoutAction } from '@/app/actions/auth.actions';
import {
  getPawasDashboardDataAction,
  getPawasMapDataAction,
  getPawasAnalyticsDataAction,
} from '@/app/actions/pawas.actions';
import { toast } from '@/components/ui/Toast';
import { searchIndonesianLocations, type LocationSuggestionItem } from '@/infrastructure/services/indonesian-location-search.service';
import { PawasTab, PresensiStatusType } from '../pawas/types';
import { parseOperatorTab, operatorTabToSlug } from './operator-helpers';
import { getSopRecommendationByIncident } from '@/lib/console/tactical-helpers';
import { useConsoleEventSource } from '@/hooks/useConsoleEventSource';
import { redirectToLogin } from '@/hooks/useSessionGuard';

interface UseOperatorConsoleProps {
  session?: any;
  initialSection?: string;
  initialMasterData?: any;
  initialOperatorData?: any;
}

export function useOperatorConsole({
  session,
  initialSection = 'operator',
  initialMasterData,
  initialOperatorData,
}: UseOperatorConsoleProps) {
  const router = useRouter();

  // Active Tab
  const [activeTab, setActiveTab] = useState<PawasTab>(() => {
    if (typeof window !== 'undefined') {
      const parts = window.location.pathname.split('/').filter(Boolean);
      const last = parts[parts.length - 1];
      if (parts[0] === 'console' && parts.length > 1) {
        return parseOperatorTab(last);
      }
    }
    return parseOperatorTab(initialSection);
  });

  // User Profile
  const [userProfile, setUserProfile] = useState<any>(() => {
    if (session) {
      return {
        ...session,
        fullName: session.fullName,
        identifier: session.identifier,
        nrp: session.identifier,
        pangkat: session.rankPangkat,
        satuanNama: session.satuanNama,
        unit: session.satuanNama,
        role: session.role,
        roleBadge: 'OPERATOR SPKT',
        avatar: session.avatar || session.avatar_url || null,
        stationName: session.stationName || '',
        stationId: session.stationId || '',
        stationCode: session.stationCode || '',
      };
    }
    return {
      fullName: '',
      identifier: '',
      nrp: '',
      pangkat: '',
      satuanNama: 'SPKT Pelayanan 110',
      unit: 'SPKT Pelayanan 110',
      role: 'OPERATOR',
      roleBadge: 'OPERATOR SPKT',
      avatar: null,
      stationName: '',
      stationId: '',
      stationCode: '',
    };
  });

  // Data Collections
  const [antreanPawas, setAntreanPawas] = useState<any[]>(() => initialOperatorData?.pendingComplaints || []);
  const [allRecentComplaints, setAllRecentComplaints] = useState<any[]>(() => initialOperatorData?.allRecentComplaints || []);
  const [registeredUnits, setRegisteredUnits] = useState<any[]>(() => initialOperatorData?.registeredUnits || []);
  const [policeOffices, setPoliceOffices] = useState<any[]>(() => initialOperatorData?.policeOffices || []);
  const [fleetUnits, setFleetUnits] = useState<any[]>(() => initialOperatorData?.fleetUnits || []);
  const [hotspots, setHotspots] = useState<any[]>(() => initialOperatorData?.hotspots || []);
  const [operatorRankings, setOperatorRankings] = useState<any>(() => initialOperatorData?.operatorRankings || initialMasterData?.operatorRankings || null);
  const [loading, setLoading] = useState(false);
  const [isServerDataLoaded, setIsServerDataLoaded] = useState(() => !!initialOperatorData);

  // Lazy Loading Tracking Refs
  const isMapLoadedRef = useRef(false);
  const isAnalyticsLoadedRef = useRef(false);
  const isDataLoadingRef = useRef(false);

  // Time & Attendance State
  const [presensiStatus, setPresensiStatus] = useState<PresensiStatusType>('SUDAH_MASUK');
  const [jamMasukPiket, setJamMasukPiket] = useState('-');
  const [jamPulangPiket, setJamPulangPiket] = useState('-');

  // Operator Simulation CAD Form
  const [simCaller, setSimCaller] = useState({
    nomorTiket: '',
    nama: '',
    telepon: '',
    alamat: '',
    kategori: '',
    kategoriKey: '',
    subcategoryId: undefined as number | undefined,
    urgensi: '',
    uraian: '',
    lat: 0,
    lng: 0,
  });

  const [cadFormErrors, setCadFormErrors] = useState<Record<string, string>>({});
  const [cadLocationSuggestions, setCadLocationSuggestions] = useState<LocationSuggestionItem[]>([]);
  const [showCadSuggestions, setShowCadSuggestions] = useState(false);
  const [isSearchingCadLocation, setIsSearchingCadLocation] = useState(false);

  // Modals
  const [showDisposisiModal, setShowDisposisiModal] = useState(false);
  const [selectedDisposisiItem, setSelectedDisposisiItem] = useState<any>(null);
  const [showSuksesModal, setShowSuksesModal] = useState(false);
  const [suksesDisposisiData, setSuksesDisposisiData] = useState<{
    nomorTiket: string;
    unitName: string;
    komandan: string;
    jarak: string;
    eta: string;
  } | null>(null);
  const [showTolakModal, setShowTolakModal] = useState(false);
  const [tolakComplaint, setTolakComplaint] = useState<any>(null);
  const [tolakKategori, setTolakKategori] = useState('');
  const [tolakAlasan, setTolakAlasan] = useState('');
  const [showLightboxModal, setShowLightboxModal] = useState(false);
  const [lightboxImg, setLightboxImg] = useState<{ url: string; title: string; meta: string; desc: string }>({
    url: '',
    title: '',
    meta: '',
    desc: '',
  });
  const [showKeamananModal, setShowKeamananModal] = useState(false);
  const [pinOtorisasiPawas, setPinOtorisasiPawas] = useState<string[]>(['', '', '', '', '', '']);
  const [showLintasWilayahModal, setShowLintasWilayahModal] = useState(false);
  const [selectedLintasWilayahComplaint, setSelectedLintasWilayahComplaint] = useState<any>(null);

  // Disposisi state
  const [selectedSatuanKeys, setSelectedSatuanKeys] = useState<string[]>([]);
  const [kuotaPersonel, setKuotaPersonel] = useState(2);
  const [arahanPawas, setArahanPawas] = useState('');
  const [activePreviewSatuanKey, setActivePreviewSatuanKey] = useState<string | null>(null);

  // Master Lookup
  const [dbCategories, setDbCategories] = useState<any[]>(() => initialMasterData?.categories || []);
  const [dbSubcategories, setDbSubcategories] = useState<any[]>(() => initialMasterData?.subcategories || []);
  const [dbSatuans, setDbSatuans] = useState<any[]>(() => initialMasterData?.satuans || []);
  const [dbUrgencyLevels, setDbUrgencyLevels] = useState<any[]>(() => initialMasterData?.urgencyLevels || []);
  const [dbRejectionReasons, setDbRejectionReasons] = useState<any[]>(() => initialMasterData?.rejectionReasons || []);

  const showFriendlyToast = useCallback((type: 'success' | 'warning' | 'error' | 'info', title: string, message: string) => {
    if (type === 'error') {
      toast.error(`${title}: ${message}`);
    } else if (type === 'warning') {
      toast.warning(`${title}: ${message}`);
    } else if (type === 'info') {
      toast.info(`${title}: ${message}`);
    } else {
      toast.success(`${title}: ${message}`);
    }
  }, []);

  const showToast = useCallback((msg: string) => {
    toast.showNotification(msg, 4000);
  }, []);

  const switchTab = useCallback((tab: PawasTab | string) => {
    const validTab = (typeof tab === 'string' && !tab.startsWith('view-') ? parseOperatorTab(tab) : tab) as PawasTab;
    setActiveTab(validTab);
    const slug = operatorTabToSlug(validTab);
    const targetUrl = slug ? `/console/${slug}` : '/console';
    if (typeof window !== 'undefined' && window.location.pathname !== targetUrl) {
      window.history.pushState(null, '', targetUrl);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // 1. Dashboard / CAD Tab: Queue, Complaints, Units, Filter Data
  const loadDashboardData = useCallback(async (force = false, silent = false) => {
    if (isDataLoadingRef.current) return;
    isDataLoadingRef.current = true;
    if (!silent) setLoading(true);
    try {
      const activeStationId = userProfile?.stationId || session?.stationId;
      const res = await getPawasDashboardDataAction(activeStationId, force);
      if ((res as any)?.unauthenticated) {
        redirectToLogin('inactivity_timeout');
        return;
      }
      if (res.success && res.data) {
        const d = res.data;
        if (d.filterData) {
          if (Array.isArray(d.filterData.categories)) setDbCategories(d.filterData.categories);
          if (Array.isArray(d.filterData.subcategories)) setDbSubcategories(d.filterData.subcategories);
          if (Array.isArray(d.filterData.satuans)) setDbSatuans(d.filterData.satuans);
          if (Array.isArray(d.filterData.urgencyLevels)) setDbUrgencyLevels(d.filterData.urgencyLevels);
          if (Array.isArray(d.filterData.rejectionReasons)) setDbRejectionReasons(d.filterData.rejectionReasons);
        }
        if (Array.isArray(d.pendingComplaints)) setAntreanPawas(d.pendingComplaints);
        if (Array.isArray(d.allRecentComplaints)) setAllRecentComplaints(d.allRecentComplaints);
        if (Array.isArray(d.registeredUnits)) setRegisteredUnits(d.registeredUnits);
        if (Array.isArray(d.fleetUnits)) setFleetUnits(d.fleetUnits);
        if (Array.isArray(d.policeOffices)) setPoliceOffices(d.policeOffices);
      }
    } catch (e: any) {
      if (e?.message?.includes('Sesi dinas') || e?.message?.includes('unauthenticated')) {
        redirectToLogin('inactivity_timeout');
      } else {
        console.warn('Error loading operator dashboard data:', e);
      }
    } finally {
      isDataLoadingRef.current = false;
      setIsServerDataLoaded(true);
      if (!silent) setLoading(false);
    }
  }, [userProfile?.stationId, session?.stationId]);

  // 2. Map Tab: Hotspots & Fleet telemetry (Lazy on-demand saat tab Peta dibuka)
  const loadMapData = useCallback(async (force = false) => {
    try {
      const res = await getPawasMapDataAction(force);
      if ((res as any)?.unauthenticated) {
        redirectToLogin('inactivity_timeout');
        return;
      }
      if (res.success && res.data) {
        const d = res.data;
        if (Array.isArray(d.fleetUnits)) setFleetUnits(d.fleetUnits);
        if (Array.isArray(d.policeOffices)) setPoliceOffices(d.policeOffices);
        if (Array.isArray(d.hotspots)) setHotspots(d.hotspots);
        isMapLoadedRef.current = true;
      }
    } catch (e: any) {
      if (e?.message?.includes('Sesi dinas') || e?.message?.includes('unauthenticated')) {
        redirectToLogin('inactivity_timeout');
      } else {
        console.warn('Error loading operator map data:', e);
      }
    }
  }, []);

  // 3. Analytics / Kinerja Tab: Operator Rankings (Lazy on-demand saat tab Kinerja dibuka)
  const loadAnalyticsData = useCallback(async (force = false) => {
    try {
      const activeStationId = userProfile?.stationId || session?.stationId;
      const res = await getPawasAnalyticsDataAction(activeStationId, force);
      if ((res as any)?.unauthenticated) {
        redirectToLogin('inactivity_timeout');
        return;
      }
      if (res.success && res.data) {
        const d = res.data;
        if (d.operatorRankings) setOperatorRankings(d.operatorRankings);
        isAnalyticsLoadedRef.current = true;
      }
    } catch (e: any) {
      if (e?.message?.includes('Sesi dinas') || e?.message?.includes('unauthenticated')) {
        redirectToLogin('inactivity_timeout');
      } else {
        console.warn('Error loading operator analytics data:', e);
      }
    }
  }, [userProfile?.stationId, session?.stationId]);

  // Unified loadData helper with tab context
  const loadData = useCallback(async (force = false, silent = false) => {
    await loadDashboardData(force, silent);
    if (activeTab === 'view-peta') loadMapData(force);
    if (activeTab === 'view-laporan') loadAnalyticsData(force);
  }, [loadDashboardData, loadMapData, loadAnalyticsData, activeTab]);

  // Tab-Driven Lazy Loading: trigger fetch hanya saat tab terkait dibuka
  useEffect(() => {
    if (activeTab === 'view-peta' && !isMapLoadedRef.current) {
      loadMapData();
    } else if (activeTab === 'view-laporan' && !isAnalyticsLoadedRef.current) {
      loadAnalyticsData();
    }
  }, [activeTab, loadMapData, loadAnalyticsData]);

  const validateCadForm = useCallback((): Record<string, string> => {
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
  }, [simCaller]);

  const searchTimeoutRef = useRef<any>(null);

  const handleCadLocationSearch = useCallback((query: string) => {
    setSimCaller((prev: any) => ({ ...prev, alamat: query }));
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!query || query.trim().length < 2) {
      setCadLocationSuggestions([]);
      setShowCadSuggestions(false);
      return;
    }

    setIsSearchingCadLocation(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchIndonesianLocations(query, {
          lat: simCaller.lat || undefined,
          lng: simCaller.lng || undefined,
          limit: 1000,
        });
        setCadLocationSuggestions(results);
        setShowCadSuggestions(results.length > 0);
      } catch {
        setCadLocationSuggestions([]);
      } finally {
        setIsSearchingCadLocation(false);
      }
    }, 200);
  }, [simCaller.lat, simCaller.lng]);

  const handleSelectCadSuggestion = useCallback((item: { fullAddress?: string; label?: string; lat: number; lng: number }) => {
    setSimCaller((prev: any) => ({
      ...prev,
      alamat: item.fullAddress ? item.fullAddress : (item.label || ''),
      lat: item.lat,
      lng: item.lng,
    }));
    setShowCadSuggestions(false);
  }, []);

  const bukaModalDisposisi = useCallback((item: any) => {
    setSelectedDisposisiItem(item);
    const rec = getSopRecommendationByIncident(item, dbSubcategories);
    setSelectedSatuanKeys(rec.primarySatuanId ? [rec.primarySatuanId] : ['sabhara']);
    setActivePreviewSatuanKey(rec.primarySatuanId ? rec.primarySatuanId : 'sabhara');
    setArahanPawas(rec.sopText ? rec.sopText : 'Segera meluncur ke TKP dengan perlengkapan lengkap, amankan lokasi dan laporkan situasi.');
    setShowDisposisiModal(true);
  }, [dbSubcategories]);

  const toggleSatuanSelection = useCallback((key: string) => {
    setSelectedSatuanKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }, []);

  const tambahArahanCepatPawas = useCallback((arahan: string) => {
    setArahanPawas((prev) => (prev ? `${prev}\n• ${arahan}` : `• ${arahan}`));
  }, []);

  const handleConfirmDisposisi = useCallback(async () => {
    if (!selectedDisposisiItem || selectedSatuanKeys.length === 0) {
      showFriendlyToast('warning', 'Pilih Satuan Tujuan', 'Harap pilih minimal satu satuan fungsi kepolisian.');
      return;
    }
    setLoading(true);
    try {
      const activeOperatorId = session?.userId ? String(session.userId) : (userProfile?.id ? String(userProfile.id) : '');
      const activeOperatorNama = session?.fullName ? session.fullName : (userProfile?.fullName ? userProfile.fullName : 'Operator SPKT');

      const res = await disposisiMultiSatuanAction({
        complaintId: selectedDisposisiItem.id.toString(),
        satuanKeys: selectedSatuanKeys,
        kuotaPersonel,
        arahanTaktis: arahanPawas,
        pawasNama: activeOperatorNama,
        pawasUserId: activeOperatorId,
      });

      if (res.success) {
        setShowDisposisiModal(false);
        setSuksesDisposisiData({
          nomorTiket: selectedDisposisiItem.nomorTiket ? selectedDisposisiItem.nomorTiket : String(selectedDisposisiItem.id),
          unitName: selectedSatuanKeys.join(' & '),
          komandan: 'Piket Regu SPKT',
          jarak: '± 2.5 km',
          eta: '± 5 Menit',
        });
        setShowSuksesModal(true);
        await loadData();
      } else {
        showFriendlyToast('error', 'Gagal Disposisi', res.error || 'Terjadi kesalahan sistem.');
      }
    } catch (e: any) {
      showFriendlyToast('error', 'Terjadi Kendala', e.message || 'Gagal disposisi.');
    } finally {
      setLoading(false);
    }
  }, [selectedDisposisiItem, selectedSatuanKeys, kuotaPersonel, arahanPawas, session, userProfile, showFriendlyToast, loadData]);

  const bukaModalTolak = useCallback((complaint: any) => {
    setTolakComplaint(complaint);
    setTolakKategori('');
    setTolakAlasan('');
    setShowTolakModal(true);
  }, []);

  const handleConfirmRejectModal = useCallback(async (reason?: string, notes?: string) => {
    if (!tolakComplaint) return;
    setLoading(true);
    try {
      const activeOperatorId = session?.userId ? String(session.userId) : (userProfile?.id ? String(userProfile.id) : '');
      const finalCategory = reason || tolakKategori || 'Tidak Memenuhi Kualifikasi Laporan Darurat';
      const finalNotes = notes || tolakAlasan || '-';
      const fullCatatan = finalNotes && finalNotes !== '-'
        ? `Laporan ditolak oleh Operator SPKT: ${finalCategory} - ${finalNotes}`
        : `Laporan ditolak oleh Operator SPKT: ${finalCategory}`;

      const res = await updateComplaintStatusAction({
        complaintId: tolakComplaint.id.toString(),
        status: 'DITOLAK' as any,
        catatan: fullCatatan,
        pawasUserId: activeOperatorId,
      });
      if (res.success) {
        setShowTolakModal(false);
        showFriendlyToast('info', 'Laporan Ditolak', `Tiket ${tolakComplaint.nomorTiket || tolakComplaint.id} berhasil ditolak.`);
        await loadData();
      } else {
        showFriendlyToast('error', 'Gagal Menolak', res.error || 'Gagal menolak laporan.');
      }
    } catch (e: any) {
      showFriendlyToast('error', 'Terjadi Kendala', e.message || 'Gagal menolak laporan.');
    } finally {
      setLoading(false);
    }
  }, [tolakComplaint, session, userProfile, tolakKategori, tolakAlasan, showFriendlyToast, loadData]);

  const handleSubmitPenolakan = useCallback(async () => {
    await handleConfirmRejectModal(tolakKategori, tolakAlasan);
  }, [handleConfirmRejectModal, tolakKategori, tolakAlasan]);

  const handleLogout = useCallback(async () => {
    await logoutAction();
    router.push('/');
  }, [router]);

  // Daftar armada aktif
  const daftarArmadaAktif = useMemo(() => {
    return dbSatuans.map((mu: any) => {
      const unitFleet = fleetUnits.filter((f: any) => f.unitId === mu.key);
      const unitLat = unitFleet.length > 0 && unitFleet[0].lastLat ? Number(unitFleet[0].lastLat) : -6.8886;
      const unitLng = unitFleet.length > 0 && unitFleet[0].lastLng ? Number(unitFleet[0].lastLng) : 109.6753;
      return {
        id: mu.key,
        satuanId: mu.key,
        nama: mu.unit_name,
        namaSingkat: mu.unit_name,
        satuan: mu.unit_name,
        sektorUtama: 'Patroli Aktif',
        komandan: 'Piket Regu SPKT',
        nrpKomandan: '78091122',
        posisiSaatIni: 'Patroli Aktif',
        kekuatan: unitFleet.length > 0 ? `${unitFleet.length} Ranmor` : 'Siaga',
        lat: unitLat,
        lng: unitLng,
        jarakBase: null,
        etaBase: null,
        tupoksi: mu.duties,
        arahanDefault: mu.default_orders,
      };
    });
  }, [dbSatuans, fleetUnits]);

  const waitingCount = antreanPawas.length;

  // 1. Real-time Event-Driven Sync via Server-Sent Events (SSE - Zero Aggressive Polling)
  useConsoleEventSource({
    stationId: userProfile?.stationId || session?.stationId,
    enabled: true,
    onEvent: useCallback(() => {
      // Hanya re-fetch data jika ada event nyata dari server (tiket baru, status berubah)
      loadData(false, true);
    }, [loadData]),
  });

  // 2. Background focus sync: sinkronisasi otomatis saat user kembali ke tab browser
  useEffect(() => {
    let lastWakeLoadTime = 0;
    const handleWakeOrFocus = () => {
      const now = Date.now();
      if (now - lastWakeLoadTime < 10000) return; // minimal 10 detik jeda
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        lastWakeLoadTime = now;
        loadData(false, true);
      }
    };

    document.addEventListener('visibilitychange', handleWakeOrFocus);
    window.addEventListener('focus', handleWakeOrFocus);

    // Heartbeat santai (60 detik) sebagai fallback jika SSE terputus
    const safetyHeartbeat = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      loadData(false, true);
    }, 60000);

    return () => {
      clearInterval(safetyHeartbeat);
      document.removeEventListener('visibilitychange', handleWakeOrFocus);
      window.removeEventListener('focus', handleWakeOrFocus);
    };
  }, [loadData]);

  return {
    activeTab,
    switchTab,
    userProfile,
    setUserProfile,
    antreanPawas,
    allRecentComplaints,
    registeredUnits,
    policeOffices,
    fleetUnits,
    hotspots,
    operatorRankings,
    loading,
    setLoading,
    isServerDataLoaded,
    presensiStatus,
    setPresensiStatus,
    jamMasukPiket,
    setJamMasukPiket,
    jamPulangPiket,
    setJamPulangPiket,
    simCaller,
    setSimCaller,
    cadFormErrors,
    setCadFormErrors,
    cadLocationSuggestions,
    showCadSuggestions,
    setShowCadSuggestions,
    isSearchingCadLocation,
    handleCadLocationSearch,
    handleSelectCadSuggestion,
    validateCadForm,
    showDisposisiModal,
    setShowDisposisiModal,
    selectedDisposisiItem,
    bukaModalDisposisi,
    showSuksesModal,
    setShowSuksesModal,
    suksesDisposisiData,
    showTolakModal,
    setShowTolakModal,
    tolakComplaint,
    setTolakComplaint,
    tolakKategori,
    setTolakKategori,
    tolakAlasan,
    setTolakAlasan,
    bukaModalTolak,
    handleConfirmRejectModal,
    handleSubmitPenolakan,
    showLightboxModal,
    setShowLightboxModal,
    lightboxImg,
    showKeamananModal,
    setShowKeamananModal,
    pinOtorisasiPawas,
    setPinOtorisasiPawas,
    showLintasWilayahModal,
    setShowLintasWilayahModal,
    selectedLintasWilayahComplaint,
    setSelectedLintasWilayahComplaint,
    selectedSatuanKeys,
    toggleSatuanSelection,
    kuotaPersonel,
    setKuotaPersonel,
    arahanPawas,
    setArahanPawas,
    tambahArahanCepatPawas,
    activePreviewSatuanKey,
    handleConfirmDisposisi,
    dbCategories,
    dbSubcategories,
    dbSatuans,
    dbUrgencyLevels,
    dbRejectionReasons,
    daftarArmadaAktif,
    waitingCount,
    showFriendlyToast,
    showToast,
    loadData,
    handleLogout,
  };
}
