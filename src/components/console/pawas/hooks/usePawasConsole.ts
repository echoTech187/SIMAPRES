'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  disposisiMultiSatuanAction,
  updateComplaintStatusAction,
  sahkanKasusPawasAction,
  type OfficerPerformanceRankItem,
  type StationPerformanceRankItem,
} from '@/app/actions/complaint.actions';
import {
  getOfficerProfileByNrpAction,
  getCurrentSessionAction,
  logoutAction,
} from '@/app/actions/auth.actions';
import { getPatrolFleetUnitsAction } from '@/app/actions/fleet.actions';
import {
  getPawasDashboardDataAction,
  getPawasMapDataAction,
  getPawasAnalyticsDataAction,
  getPawasLogbookDataAction,
} from '@/app/actions/pawas.actions';
import { toast } from '@/components/ui/Toast';
import { PresensiStatusType } from '../types';
import { parsePawasTab, pawasTabToSlug } from '../pawas-helpers';
import { calculateDistanceHaversineKm } from '@/lib/console/tactical-helpers';
import { useConsoleEventSource } from '@/hooks/useConsoleEventSource';
import { redirectToLogin } from '@/hooks/useSessionGuard';
import { usePawasModals } from './usePawasModals';
import { usePawasFilters } from './usePawasFilters';
import { usePawasLogbook } from './usePawasLogbook';
import { usePawasCad } from './usePawasCad';

interface UsePawasConsoleProps {
  session?: any;
  initialSection?: string;
  initialMasterData?: any;
  initialPawasData?: any;
}

export function usePawasConsole({
  session,
  initialSection = 'beranda',
  initialMasterData,
  initialPawasData,
}: UsePawasConsoleProps) {
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
        role: session.role ? session.role : '',
        roleBadge: session.role ? session.role : '',
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
      role: '',
      roleBadge: '',
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

  // Officer Performance Ranking State (Tier 2: Individu Personel)
  const [officerRankings, setOfficerRankings] = useState<{
    productivityRanking: OfficerPerformanceRankItem[];
    satisfactionRanking: OfficerPerformanceRankItem[];
    totalOfficers: number;
  } | null>(() => initialPawasData?.officerRankings ? initialPawasData.officerRankings : null);

  // Station Performance Ranking State (Tier 1: Evaluasi Polsek & Jajaran Mako)
  const [stationRankings, setStationRankings] = useState<{
    overallRanking: StationPerformanceRankItem[];
    totalStations: number;
  } | null>(() => initialPawasData?.stationRankings ? initialPawasData.stationRankings : null);

  // Operator Performance Ranking State (Tier 3: Evaluasi Operator SPKT 110)
  const [operatorRankings, setOperatorRankings] = useState<{
    overallRanking: any[];
    productivityRanking: any[];
    satisfactionRanking: any[];
    totalOperators: number;
  } | null>(() => initialPawasData?.operatorRankings ? initialPawasData.operatorRankings : null);

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

  // Live Stopwatch SLA 3 Cockpit
  const [slaClockSeconds, setSlaClockSeconds] = useState<number>(0);
  const slaClockStartRef = useRef<number>(Date.now());
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
        tupoksi: mu.duties,
        arahanDefault: mu.default_orders,
      };
    });
  }, [dbSatuans, registeredUnits, fleetUnits, policeOffices]);

  const isDataLoadingRef = useRef(false);
  const dataLoadedRef = useRef(!!initialPawasData);
  const isMapLoadedRef = useRef(false);
  const isAnalyticsLoadedRef = useRef(false);
  const isLogbookLoadedRef = useRef(false);

  // 1. Tab 1: Dashboard Data Loader (Beranda & Ringkasan Laporan - Zero Overfetching)
  const loadDashboardData = useCallback(async (force = false, silent = false) => {
    if (isDataLoadingRef.current || (dataLoadedRef.current && !force)) return;
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

        dataLoadedRef.current = true;
      }
    } catch (e: any) {
      if (e?.message?.includes('Sesi dinas') || e?.message?.includes('unauthenticated')) {
        redirectToLogin('inactivity_timeout');
      } else {
        console.warn('Error loading pawas dashboard data:', e);
      }
    } finally {
      isDataLoadingRef.current = false;
      setIsServerDataLoaded(true);
      if (!silent) setLoading(false);
    }
  }, [userProfile?.stationId, session?.stationId]);

  // 2. Tab 2: Map Tactical Data Loader (Lazy on-demand saat tab Peta dibuka)
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
        console.warn('Error loading pawas map data:', e);
      }
    }
  }, []);

  // 3. Tab 3: Analytics & Kinerja Loader (Lazy on-demand saat tab Kinerja dibuka)
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
        if (d.ikmStats) setIkmStats(d.ikmStats);
        if (d.officerRankings) setOfficerRankings(d.officerRankings);
        if (d.stationRankings) setStationRankings(d.stationRankings);
        if (d.operatorRankings) setOperatorRankings(d.operatorRankings);
        isAnalyticsLoadedRef.current = true;
      }
    } catch (e: any) {
      if (e?.message?.includes('Sesi dinas') || e?.message?.includes('unauthenticated')) {
        redirectToLogin('inactivity_timeout');
      } else {
        console.warn('Error loading pawas analytics data:', e);
      }
    }
  }, [userProfile?.stationId, session?.stationId]);

  // 4. Tab 4: Logbook Data Loader (Lazy on-demand saat tab Logbook dibuka)
  const loadLogbookData = useCallback(async (force = false) => {
    try {
      const res = await getPawasLogbookDataAction(10, force);
      if ((res as any)?.unauthenticated) {
        redirectToLogin('inactivity_timeout');
        return;
      }
      if (res.success && res.data) {
        const d = res.data;
        if (Array.isArray(d.recentLogbooks)) setRecentActivities(d.recentLogbooks);
        isLogbookLoadedRef.current = true;
      }
    } catch (e: any) {
      if (e?.message?.includes('Sesi dinas') || e?.message?.includes('unauthenticated')) {
        redirectToLogin('inactivity_timeout');
      } else {
        console.warn('Error loading pawas logbook data:', e);
      }
    }
  }, []);

  // Backward-compatible loadData helper
  const loadData = useCallback(async (force = false, silent = false) => {
    await loadDashboardData(force, silent);
    if (activeTab === 'view-peta') loadMapData(force);
    if (activeTab === 'view-laporan') loadAnalyticsData(force);
    if (activeTab === 'view-log') loadLogbookData(force);
  }, [loadDashboardData, loadMapData, loadAnalyticsData, loadLogbookData, activeTab]);

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
  }, [nrpParam, session, loadData]);

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
      if (typeof document !== 'undefined' && document.hidden) return;

      try {
        const fRes = await getPatrolFleetUnitsAction();
        if (!isMounted) return;
        if (fRes?.success && Array.isArray(fRes.data)) {
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

    const pollInterval = setInterval(pollFleet, 20000);
    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, [activeTab]);

  // Lazy-load data saat tab aktif berubah (Zero Overfetching)
  useEffect(() => {
    if (activeTab === 'view-peta' && !isMapLoadedRef.current) {
      loadMapData();
    } else if (activeTab === 'view-laporan' && !isAnalyticsLoadedRef.current) {
      loadAnalyticsData();
    } else if (activeTab === 'view-log' && !isLogbookLoadedRef.current) {
      loadLogbookData();
    }
  }, [activeTab, loadMapData, loadAnalyticsData, loadLogbookData]);

  // Real-time Event-Driven Sync via Server-Sent Events (SSE)
  useConsoleEventSource({
    stationId: userProfile?.stationId || session?.stationId,
    enabled: true,
    onEvent: useCallback(() => {
      loadDashboardData(true, true);
      if (activeTab === 'view-peta') loadMapData(true);
      if (activeTab === 'view-laporan') loadAnalyticsData(true);
      if (activeTab === 'view-log') loadLogbookData(true);
    }, [loadDashboardData, loadMapData, loadAnalyticsData, loadLogbookData, activeTab]),
  });

  // Background focus sync: sinkronisasi otomatis saat user kembali ke tab browser
  useEffect(() => {
    let lastWakeLoadTime = 0;
    const handleWakeOrFocus = () => {
      const now = Date.now();
      if (now - lastWakeLoadTime < 10000) return;
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        lastWakeLoadTime = now;
        loadData(true, true);
      }
    };

    document.addEventListener('visibilitychange', handleWakeOrFocus);
    window.addEventListener('focus', handleWakeOrFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleWakeOrFocus);
      window.removeEventListener('focus', handleWakeOrFocus);
    };
  }, [loadData]);

  const switchTab = useCallback((tabId: string) => {
    setActiveTab(tabId);
    const slug = pawasTabToSlug(tabId);
    const targetUrl = slug ? `/console/${slug}` : '/console';
    if (typeof window !== 'undefined' && window.location.pathname !== targetUrl) {
      window.history.pushState(null, '', targetUrl);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // --- Compose Sub-Hooks for Modals, CAD, Filters, and Logbook ---
  const {
    showDisposisiModal,
    setShowDisposisiModal,
    selectedDisposisiItem,
    setSelectedDisposisiItem,
    selectedSatuanKeys,
    setSelectedSatuanKeys,
    activePreviewSatuanKey,
    setActivePreviewSatuanKey,
    showEditPersonel,
    setShowEditPersonel,
    customPersonelNama,
    setCustomPersonelNama,
    kuotaPersonel,
    setKuotaPersonel,
    arahanPawas,
    setArahanPawas,
    disposisiFormErrors,
    setDisposisiFormErrors,
    showSuksesModal,
    setShowSuksesModal,
    suksesDisposisiData,
    setSuksesDisposisiData,
    showSlaModal,
    setShowSlaModal,
    showKuatPersModal,
    setShowKuatPersModal,
    showIkmModal,
    setShowIkmModal,
    showCetakModal,
    setShowCetakModal,
    showPresensiPulangModal,
    setShowPresensiPulangModal,
    showKeamananModal,
    setShowKeamananModal,
    pinOtorisasiPawas,
    setPinOtorisasiPawas,
    showTimePickerModal,
    setShowTimePickerModal,
    showLightboxModal,
    setShowLightboxModal,
    lightboxImg,
    setLightboxImg,
    showHotspotModal,
    setShowHotspotModal,
    tolakComplaint,
    setTolakComplaint,
    showTolakModal,
    setShowTolakModal,
    tolakKategori,
    setTolakKategori,
    tolakAlasan,
    setTolakAlasan,
    bukaModalTolak,
    showLintasWilayahModal,
    setShowLintasWilayahModal,
    selectedLintasWilayahComplaint,
    setSelectedLintasWilayahComplaint,
  } = usePawasModals();

  const {
    simCaller,
    setSimCaller,
    cadFormErrors,
    setCadFormErrors,
    cadLocationSuggestions,
    setCadLocationSuggestions,
    isSearchingCadLocation,
    setIsSearchingCadLocation,
    showCadSuggestions,
    setShowCadSuggestions,
    handleCadLocationSearch,
    handleSelectCadSuggestion,
  } = usePawasCad();

  const {
    valFilterStatus,
    setValFilterStatus,
    valFilterPlatform,
    setValFilterPlatform,
    valFilterKategori,
    setValFilterKategori,
    selectedValComplaint,
    setSelectedValComplaint,
    isComplaintRejected,
    resolveComplaintStatus,
    matchesStatus,
    resolveUrgencyLevel,
    getComplaintPlatform,
    matchesPlatform,
    getComplaintKategoriInfo,
    matchesKategori,
    filterComplaintList,
    openValidasiList,
    openValidasiWithPlatform,
    handleSelectPlatformFilter,
    handleSelectKategoriFilter,
    handleResetFilters,
    filteredValidasiComplaints,
    logsForStatusTabs,
    tabCountSemua,
    tabCountMenunggu,
    logsForPlatform,
    platCountAll,
    platCountSos,
    platCountWarga,
    platCount110,
    platCountPersonel,
    logsForKategori,
    katCountAll,
  } = usePawasFilters({
    allRecentComplaints,
    dbCategories,
    dbSubcategories,
    dbPlatforms,
    dbGiats,
    dbStatuses,
    dbUrgencyLevels,
    setActiveTab,
  });

  const {
    logWaktuMulai,
    setLogWaktuMulai,
    logSektor,
    setLogSektor,
    logJenis,
    setLogJenis,
    logDeskripsi,
    setLogDeskripsi,
    logFotoPreview,
    setLogFotoPreview,
    handleSimpanLogKegiatan,
  } = usePawasLogbook({
    session,
    userProfile,
    showFriendlyToast,
    switchTab,
    loadData,
    setLoading,
  });

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

  const validateDisposisiForm = useCallback(() => {
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
  }, [selectedSatuanKeys.length, kuotaPersonel, arahanPawas]);

  const tambahArahanCepatPawas = useCallback((text: string) => {
    setArahanPawas((prev) => (prev ? `${prev} ${text}` : text));
  }, []);

  const bukaModalDisposisi = useCallback((item: any) => {
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
  }, []);

  const toggleSatuanSelection = useCallback((unitId: string) => {
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
  }, [daftarArmadaAktif, arahanPawas, activePreviewSatuanKey]);

  const handleConfirmDisposisi = useCallback(async () => {
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
  }, [
    selectedDisposisiItem,
    validateDisposisiForm,
    daftarArmadaAktif,
    selectedSatuanKeys,
    activePreviewSatuanKey,
    kuotaPersonel,
    arahanPawas,
    userProfile,
    session,
    customPersonelNama,
    showFriendlyToast,
    loadData,
  ]);


  const handleConfirmRejectModal = useCallback(async (reason: string, notes: string) => {
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
  }, [tolakComplaint, session, userProfile, showFriendlyToast, loadData, switchTab]);

  const handleSubmitPenolakan = useCallback(async () => {
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
  }, [tolakComplaint, session, userProfile, tolakKategori, tolakAlasan, showFriendlyToast, loadData, switchTab]);

  const handleAjukanRevisi = useCallback(async (complaint: any) => {
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
  }, [session, userProfile, showFriendlyToast, loadData]);

  const handleSahkanPenutupanKasus = useCallback(async (complaint: any) => {
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
  }, [session, userProfile, showFriendlyToast, loadData]);

  const handlePresensiPulang = useCallback(() => {
    setShowPresensiPulangModal(true);
  }, []);

  const handleKonfirmasiPulangFinal = useCallback(() => {
    setPresensiStatus('SUDAH_PULANG');
    const jam = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
    setJamPulangPiket(jam);
    setShowPresensiPulangModal(false);
    showFriendlyToast('info', 'Presensi Pulang Berhasil', `Pukul ${jam}. Terima kasih atas pelaksanaan dinas supervisi.`);
  }, [showFriendlyToast]);

  const handleLogout = useCallback(async () => {
    await logoutAction();
    router.push('/');
  }, [router]);

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

  const completedWithTime = useMemo(() => {
    return allRecentComplaints.filter((c) => typeof c.responseTimeMinutes === 'number' && c.responseTimeMinutes > 0);
  }, [allRecentComplaints]);

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

  const ratedComplaints = useMemo(() => {
    return allRecentComplaints.filter((c) => typeof c.citizenRating === 'number' && c.citizenRating > 0);
  }, [allRecentComplaints]);

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

  const activeUnfinishedComplaints = useMemo(() => {
    return allRecentComplaints.filter(
      (c) => c.status !== 'SELESAI' && c.status !== 'DITOLAK'
    );
  }, [allRecentComplaints]);

  const highPriorityIncident = useMemo(() => {
    return (
      antreanPawas.find((c) => c.urgensi === 'DARURAT' || c.urgensi === 'PRIORITAS_TINGGI') ||
      antreanPawas[0] ||
      activeUnfinishedComplaints.find((c) => c.urgensi === 'DARURAT' || (c.platformKey || '').toLowerCase().includes('sos')) ||
      activeUnfinishedComplaints[0] ||
      null
    );
  }, [antreanPawas, activeUnfinishedComplaints]);

  const activeComplaint = useMemo(() => {
    return (
      filteredValidasiComplaints.find((c) => c.id === selectedValComplaint?.id) ||
      filteredValidasiComplaints[0] ||
      null
    );
  }, [filteredValidasiComplaints, selectedValComplaint?.id]);

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
    ikmStats,
    recentActivities,
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
    selectedSatuanKeys,
    toggleSatuanSelection,
    kuotaPersonel,
    setKuotaPersonel,
    arahanPawas,
    setArahanPawas,
    tambahArahanCepatPawas,
    activePreviewSatuanKey,
    handleConfirmDisposisi,
    showSuksesModal,
    setShowSuksesModal,
    suksesDisposisiData,
    showSlaModal,
    setShowSlaModal,
    avgResponseTime,
    onTimeRate,
    fastCount,
    mediumCount,
    slowCount,
    onTimeCount,
    completedWithTime,
    showKuatPersModal,
    setShowKuatPersModal,
    showIkmModal,
    setShowIkmModal,
    satisfactionRating,
    satisfactionPercent,
    showCetakModal,
    setShowCetakModal,
    showHotspotModal,
    setShowHotspotModal,
    showTimePickerModal,
    setShowTimePickerModal,
    setLogWaktuMulai,
    showPresensiPulangModal,
    setShowPresensiPulangModal,
    handlePresensiPulang,
    handleKonfirmasiPulangFinal,
    showKeamananModal,
    setShowKeamananModal,
    pinOtorisasiPawas,
    setPinOtorisasiPawas,
    showLightboxModal,
    setShowLightboxModal,
    lightboxImg,
    setLightboxImg,
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
    handleAjukanRevisi,
    handleSahkanPenutupanKasus,
    showLintasWilayahModal,
    setShowLintasWilayahModal,
    selectedLintasWilayahComplaint,
    setSelectedLintasWilayahComplaint,
    valFilterStatus,
    setValFilterStatus,
    valFilterPlatform,
    setValFilterPlatform,
    valFilterKategori,
    setValFilterKategori,
    selectedValComplaint,
    setSelectedValComplaint,
    openValidasiList,
    openValidasiWithPlatform,
    handleSelectPlatformFilter,
    handleSelectKategoriFilter,
    handleResetFilters,
    filteredValidasiComplaints,
    activeComplaint,
    matchesStatus,
    matchesKategori,
    getComplaintKategoriInfo,
    isComplaintRejected,
    resolveComplaintStatus,
    resolveUrgencyLevel,
    logWaktuMulai,
    logSektor,
    setLogSektor,
    logJenis,
    setLogJenis,
    logDeskripsi,
    setLogDeskripsi,
    logFotoPreview,
    setLogFotoPreview,
    handleSimpanLogKegiatan,
    dbCategories,
    dbSubcategories,
    dbPlatforms,
    dbGiats,
    dbStatuses,
    dbRejectionReasons,
    dbUrgencyLevels,
    daftarArmadaAktif,
    officerRankings,
    stationRankings,
    operatorRankings,
    slaClockSeconds,
    formatSlaClock,
    totalLaporan,
    menungguCount,
    ditolakCount,
    diprosesCount,
    pengesahanCount,
    selesaiCount,
    sosCount,
    wargaCount,
    hotline110Count,
    personelCount,
    logsForStatusTabs,
    tabCountSemua,
    tabCountMenunggu,
    platCountAll,
    platCountSos,
    platCountWarga,
    platCount110,
    platCountPersonel,
    logsForKategori,
    katCountAll,
    highPriorityIncident,
    showFriendlyToast,
    showToast,
    loadData,
    handleLogout,
  };
}
