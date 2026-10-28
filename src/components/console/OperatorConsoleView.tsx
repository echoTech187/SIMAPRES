'use client';

import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Headphones, Map, BookOpen, User, Award } from 'lucide-react';
import {
  disposisiMultiSatuanAction,
  updateComplaintStatusAction,
} from '@/app/actions/complaint.actions';
import {
  logoutAction,
} from '@/app/actions/auth.actions';
import { getPawasUnifiedDataAction } from '@/app/actions/pawas.actions';
import HeaderProfileBadge from './HeaderProfileBadge';
import { toast } from '@/components/ui/Toast';
import '@/app/registrasi-unit/registrasi-unit.css';
import { searchIndonesianLocations, type LocationSuggestionItem } from '@/lib/indonesian-location-search';

import { PawasTab, PresensiStatusType } from './pawas/types';
import TabProfilPawas from './profile/TabProfilPawas';
import TabTacticalMapPawas from './pawas/tabs/TabTacticalMapPawas';
import TabOperatorCadPawas from './pawas/tabs/TabOperatorCadPawas';
import TabTolakLogPawas from './pawas/tabs/TabTolakLogPawas';
import TabBukuPintarSop from './pawas/tabs/TabBukuPintarSop';
import TabKinerjaOperator from './pawas/tabs/TabKinerjaOperator';

import ModalDisposisiPawas from './pawas/modals/ModalDisposisiPawas';
import ModalSuksesDisposisi from './pawas/modals/ModalSuksesDisposisi';
import ModalKeamananPawas from './pawas/modals/ModalKeamananPawas';
import ModalLightbox from './pawas/modals/ModalLightbox';
import ModalTolakPengaduan from './pawas/modals/ModalTolakPengaduan';
import ModalDisposisiLintasWilayah from './pawas/modals/ModalDisposisiLintasWilayah';
import dynamic from 'next/dynamic';

const EscalationAlarmBanner = dynamic(
  () => import('./pawas/components/EscalationAlarmBanner'),
  { ssr: false }
);

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
      kasusSpesifik: matchedSub?.nama_kasus || item?.jenisKejadian || null,
      sopText: matchedSub?.deskripsi_sop || null,
    };
  }

  return {
    primarySatuanId: null,
    secondarySatuanIds: [],
    kasusSpesifik: item?.jenisKejadian || null,
    sopText: null,
  };
}

function parseOperatorTab(section: string): PawasTab {
  switch (section) {
    case 'peta':
      return 'view-peta';
    case 'panduan':
    case 'faq':
      return 'view-panduan';
    case 'kinerja':
    case 'laporan':
    case 'peringkat':
      return 'view-laporan';
    case 'profil':
      return 'view-profil';
    case 'tolak':
      return 'view-tolak';
    case 'operator':
    default:
      return 'view-operator';
  }
}

function operatorTabToSlug(tabId: PawasTab): string {
  switch (tabId) {
    case 'view-peta':
      return 'peta';
    case 'view-panduan':
      return 'panduan';
    case 'view-laporan':
      return 'kinerja';
    case 'view-profil':
      return 'profil';
    case 'view-tolak':
      return 'tolak';
    case 'view-operator':
    default:
      return '';
  }
}

function OperatorConsoleContent({
  session,
  initialSection = 'operator',
  initialMasterData,
  initialOperatorData,
}: {
  session?: any;
  initialSection?: string;
  initialMasterData?: any;
  initialOperatorData?: any;
}) {
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

  // Time & Attendance State
  const [presensiStatus, setPresensiStatus] = useState<PresensiStatusType>('SUDAH_MASUK');
  const [jamMasukPiket, setJamMasukPiket] = useState('-');
  const [jamPulangPiket, setJamPulangPiket] = useState('-');

  // Operator Simulation
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

  const switchTab = useCallback((tab: PawasTab) => {
    setActiveTab(tab);
    const slug = operatorTabToSlug(tab);
    const targetUrl = slug ? `/console/${slug}` : '/console';
    if (typeof window !== 'undefined' && window.location.pathname !== targetUrl) {
      window.history.pushState(null, '', targetUrl);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const loadData = async (force = false, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const activeStationId = userProfile?.stationId || session?.stationId;
      const res = await getPawasUnifiedDataAction(activeStationId, force);
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
        if (Array.isArray(d.hotspots)) setHotspots(d.hotspots);
        if (d.operatorRankings) setOperatorRankings(d.operatorRankings);
      }
    } catch (e) {
      console.warn('Error loading operator data:', e);
    } finally {
      setIsServerDataLoaded(true);
      if (!silent) setLoading(false);
    }
  };

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

  const showToast = useCallback((msg: string) => {
    toast.showNotification(msg, 4000);
  }, []);

  const handleSelectCadSuggestion = useCallback((item: { fullAddress?: string; label?: string; lat: number; lng: number }) => {
    setSimCaller((prev: any) => ({
      ...prev,
      alamat: item.fullAddress ? item.fullAddress : (item.label || ''),
      lat: item.lat,
      lng: item.lng,
    }));
    setShowCadSuggestions(false);
  }, []);

  const bukaModalDisposisi = (item: any) => {
    setSelectedDisposisiItem(item);
    const rec = getSopRecommendationByIncident(item, dbSubcategories);
    setSelectedSatuanKeys(rec.primarySatuanId ? [rec.primarySatuanId] : ['sabhara']);
    setActivePreviewSatuanKey(rec.primarySatuanId ? rec.primarySatuanId : 'sabhara');
    setArahanPawas(rec.sopText ? rec.sopText : 'Segera meluncur ke TKP dengan perlengkapan lengkap, amankan lokasi dan laporkan situasi.');
    setShowDisposisiModal(true);
  };

  const toggleSatuanSelection = (key: string) => {
    setSelectedSatuanKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const tambahArahanCepatPawas = (arahan: string) => {
    setArahanPawas((prev) => (prev ? `${prev}\n• ${arahan}` : `• ${arahan}`));
  };

  const handleConfirmDisposisi = async () => {
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
  };

  const bukaModalTolak = (complaint: any) => {
    setTolakComplaint(complaint);
    setTolakKategori('');
    setTolakAlasan('');
    setShowTolakModal(true);
  };

  const handleConfirmRejectModal = async () => {
    if (!tolakComplaint) return;
    setLoading(true);
    try {
      const activeOperatorId = session?.userId ? String(session.userId) : (userProfile?.id ? String(userProfile.id) : '');
      const res = await updateComplaintStatusAction({
        complaintId: tolakComplaint.id.toString(),
        status: 'DITOLAK' as any,
        catatan: `Laporan ditolak oleh Operator SPKT: ${tolakKategori} - ${tolakAlasan}`,
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
  };

  const handleSubmitPenolakan = async () => {
    await handleConfirmRejectModal();
  };

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

  // Polling data otomatis untuk Sentra Layanan 110 & CAD (Setiap 4 detik saat tab aktif)
  useEffect(() => {
    let lastWakeLoadTime = 0;
    const handleWakeOrFocus = () => {
      const now = Date.now();
      if (now - lastWakeLoadTime < 3000) return;
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        lastWakeLoadTime = now;
        loadData(false, true);
      }
    };

    document.addEventListener('visibilitychange', handleWakeOrFocus);
    window.addEventListener('focus', handleWakeOrFocus);

    const pollInterval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      loadData(false, true);
    }, 4000);

    return () => {
      clearInterval(pollInterval);
      document.removeEventListener('visibilitychange', handleWakeOrFocus);
      window.removeEventListener('focus', handleWakeOrFocus);
    };
  }, [userProfile?.stationId, session?.stationId]);

  return (
    <div
      className="registrasi-body"
      style={activeTab === 'view-peta' ? { minHeight: '100vh', height: '100vh', overflow: 'hidden' } : undefined}
    >
      {/* ── TOPBAR OPERATOR SPKT ── */}
      <header className="topbar">
        <div
          className="topbar-brand"
          style={{ cursor: 'pointer', textDecoration: 'none' }}
          onClick={() => switchTab('view-operator')}
        >
          <div className="brand-icon">
            <img
              src="/logo_simopmas.png"
              alt="Logo SIMOPMAS 110"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
          <div>
            <div className="brand-title">
              SIMOPMAS 110 • {(userProfile.stationName || session?.stationName || (userProfile.stationId && policeOffices.find((p: any) => String(p.id) === String(userProfile.stationId))?.station_name) || 'Polres Pekalongan').toUpperCase()}
            </div>
            <div className="brand-subtitle">Sentra Pelayanan SPKT &amp; CAD Dispatch Darurat 110</div>
          </div>
        </div>

        <div className="topbar-nav" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <HeaderProfileBadge
            name={userProfile.fullName ? userProfile.fullName : 'Bripka Andi Pratama'}
            identifier={userProfile.identifier ? userProfile.identifier : '88010234'}
            role="OPERATOR SPKT"
            avatar={userProfile.avatar}
            isActive={activeTab === 'view-profil'}
            hasNotification={waitingCount > 0}
            onBellClick={() => switchTab('view-operator')}
            onClick={() => switchTab('view-profil')}
          />
        </div>
      </header>

      {/* ── HORIZONTAL TAB BAR (Desktop Only) ── */}
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
            {/* TAB: SENTRA LAYANAN 110 & CAD (UTAMA) */}
            <button
              type="button"
              id="nav-operator"
              onClick={() => switchTab('view-operator')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '8px 18px', borderRadius: '8px', fontSize: '12.5px', fontWeight: 700,
                cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s ease',
                background: activeTab === 'view-operator' ? '#0284C7' : '#F8FAFC',
                color: activeTab === 'view-operator' ? 'white' : '#475569',
                border: activeTab === 'view-operator' ? '1px solid #0284C7' : '1px solid #E2E8F0',
              }}
            >
              <Headphones size={15} strokeWidth={2.2} />
              <span>Sentra Layanan 110 &amp; CAD</span>
              {waitingCount > 0 && (
                <span
                  style={{
                    background: activeTab === 'view-operator' ? '#EF4444' : '#DC2626',
                    color: 'white',
                    fontSize: '10.5px',
                    fontWeight: 800,
                    padding: '1px 6px',
                    borderRadius: '10px',
                  }}
                >
                  {waitingCount}
                </span>
              )}
            </button>

            {/* TAB: PETA SITUASI WILAYAH */}
            <button
              type="button"
              id="nav-peta"
              onClick={() => switchTab('view-peta')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '8px 18px', borderRadius: '8px', fontSize: '12.5px', fontWeight: 700,
                cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s ease',
                background: activeTab === 'view-peta' ? '#0284C7' : '#F8FAFC',
                color: activeTab === 'view-peta' ? 'white' : '#475569',
                border: activeTab === 'view-peta' ? '1px solid #0284C7' : '1px solid #E2E8F0',
              }}
            >
              <Map size={15} strokeWidth={2.2} />
              <span>Peta Situasi Wilayah</span>
            </button>

            {/* TAB: BUKU PINTAR SOP */}
            <button
              type="button"
              id="nav-panduan"
              onClick={() => switchTab('view-panduan')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '8px 18px', borderRadius: '8px', fontSize: '12.5px', fontWeight: 700,
                cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s ease',
                background: activeTab === 'view-panduan' ? '#0284C7' : '#F8FAFC',
                color: activeTab === 'view-panduan' ? 'white' : '#475569',
                border: activeTab === 'view-panduan' ? '1px solid #0284C7' : '1px solid #E2E8F0',
              }}
            >
              <BookOpen size={15} strokeWidth={2.2} />
              <span>Buku Pintar SOP &amp; Layanan</span>
            </button>

            {/* TAB: EVALUASI & PERINGKAT KINERJA 110 */}
            <button
              type="button"
              id="nav-kinerja-operator"
              onClick={() => switchTab('view-laporan')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '8px 18px', borderRadius: '8px', fontSize: '12.5px', fontWeight: 700,
                cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s ease',
                background: activeTab === 'view-laporan' ? '#0284C7' : '#F8FAFC',
                color: activeTab === 'view-laporan' ? 'white' : '#475569',
                border: activeTab === 'view-laporan' ? '1px solid #0284C7' : '1px solid #E2E8F0',
              }}
            >
              <Award size={15} strokeWidth={2.2} />
              <span>Kinerja &amp; Peringkat 110</span>
            </button>
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      <main className={`pawas-content-area ${activeTab === 'view-peta' ? 'pawas-peta-active' : 'registrasi-container'}`} style={activeTab === 'view-peta' ? { flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 } : undefined}>
        {/* Render banner alarm eskalasi di atas tab selain CAD, Kinerja, dan Peta */}
        {activeTab !== 'view-operator' && activeTab !== 'view-laporan' && activeTab !== 'view-peta' && (
          <EscalationAlarmBanner
            complaints={allRecentComplaints}
            currentStationId={userProfile?.stationId || session?.stationId}
            currentStationName={userProfile?.stationName || session?.stationName}
            currentUser={session || userProfile}
            policeOffices={policeOffices}
            onOpenDisposisiLintasWilayah={(comp) => {
              setSelectedLintasWilayahComplaint(comp);
              setShowLintasWilayahModal(true);
            }}
            onRefresh={loadData}
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
            policeOffices={policeOffices}
            onOpenDisposisiLintasWilayah={(comp) => {
              setSelectedLintasWilayahComplaint(comp);
              setShowLintasWilayahModal(true);
            }}
            escalationBanner={
              <EscalationAlarmBanner
                complaints={allRecentComplaints}
                currentStationId={userProfile?.stationId || session?.stationId}
                currentStationName={userProfile?.stationName || session?.stationName}
                currentUser={session || userProfile}
                policeOffices={policeOffices}
                onOpenDisposisiLintasWilayah={(comp) => {
                  setSelectedLintasWilayahComplaint(comp);
                  setShowLintasWilayahModal(true);
                }}
                onRefresh={loadData}
              />
            }
          />
        )}

        {activeTab === 'view-peta' && (
          <TabTacticalMapPawas
            userProfile={userProfile}
            fleetUnits={fleetUnits}
            hotspots={hotspots}
            policeOffices={policeOffices}
            setShowHotspotModal={() => {}}
            highPriorityIncident={antreanPawas.length > 0 ? antreanPawas[0] : null}
            resolveUrgencyLevel={(u) => (u ? u : 'SEDANG')}
            showFriendlyToast={showFriendlyToast}
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

        {activeTab === 'view-laporan' && (
          <TabKinerjaOperator
            userProfile={userProfile}
            allRecentComplaints={allRecentComplaints}
            operatorRankings={operatorRankings}
            switchTab={switchTab}
            escalationBanner={
              <EscalationAlarmBanner
                complaints={allRecentComplaints}
                currentStationId={userProfile?.stationId || session?.stationId}
                currentStationName={userProfile?.stationName || session?.stationName}
                currentUser={session || userProfile}
                policeOffices={policeOffices}
                onOpenDisposisiLintasWilayah={(comp) => {
                  setSelectedLintasWilayahComplaint(comp);
                  setShowLintasWilayahModal(true);
                }}
                onRefresh={loadData}
              />
            }
          />
        )}

        {activeTab === 'view-profil' && (
          <TabProfilPawas
            currentUser={userProfile}
            setCurrentUser={setUserProfile}
            totalLaporan={allRecentComplaints.length}
            selesaiCount={allRecentComplaints.filter((c) => c.status === 'SELESAI').length}
            responCepatPct="100%"
            allRecentComplaints={allRecentComplaints}
            units={fleetUnits.length > 0 ? fleetUnits : registeredUnits}
            policeOffices={policeOffices}
            showToast={showToast}
            onBackToBeranda={() => switchTab('view-operator')}
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
            onOpenPresensiPulangModal={() => {}}
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
      </main>

      {/* ── BOTTOM NAVIGATION (Mobile Operator) ── */}
      <nav className="bottom-nav pawas-bottom-nav">
        <div
          id="op-bottom-nav-cad"
          className={`nav-item ${activeTab === 'view-operator' ? 'active' : ''}`}
          onClick={() => switchTab('view-operator')}
        >
          <span className="nav-icon">
            <Headphones size={20} strokeWidth={activeTab === 'view-operator' ? 2.4 : 1.8} />
          </span>
          <span className="nav-label">CAD 110</span>
        </div>

        <div
          id="op-bottom-nav-peta"
          className={`nav-item ${activeTab === 'view-peta' ? 'active' : ''}`}
          onClick={() => switchTab('view-peta')}
        >
          <span className="nav-icon">
            <Map size={20} strokeWidth={activeTab === 'view-peta' ? 2.4 : 1.8} />
          </span>
          <span className="nav-label">Peta</span>
        </div>

        <div
          id="op-bottom-nav-panduan"
          className={`nav-item ${activeTab === 'view-panduan' ? 'active' : ''}`}
          onClick={() => switchTab('view-panduan')}
        >
          <span className="nav-icon">
            <BookOpen size={20} strokeWidth={activeTab === 'view-panduan' ? 2.4 : 1.8} />
          </span>
          <span className="nav-label">Buku SOP</span>
        </div>

        <div
          id="op-bottom-nav-kinerja"
          className={`nav-item ${activeTab === 'view-laporan' ? 'active' : ''}`}
          onClick={() => switchTab('view-laporan')}
        >
          <span className="nav-icon">
            <Award size={20} strokeWidth={activeTab === 'view-laporan' ? 2.4 : 1.8} />
          </span>
          <span className="nav-label">Kinerja</span>
        </div>

        <div
          id="op-bottom-nav-profil"
          className={`nav-item ${activeTab === 'view-profil' ? 'active' : ''}`}
          onClick={() => switchTab('view-profil')}
        >
          <span className="nav-icon">
            <User size={20} strokeWidth={activeTab === 'view-profil' ? 2.4 : 1.8} />
          </span>
          <span className="nav-label">Profil</span>
        </div>
      </nav>

      {/* MODAL COMPONENTS */}
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

      {showLintasWilayahModal && selectedLintasWilayahComplaint && (
        <ModalDisposisiLintasWilayah
          complaint={selectedLintasWilayahComplaint}
          policeOffices={policeOffices}
          allComplaints={allRecentComplaints}
          currentStationId={userProfile?.stationId || session?.stationId}
          currentStationName={userProfile?.stationName || session?.stationName}
          onClose={() => {
            setShowLintasWilayahModal(false);
            setSelectedLintasWilayahComplaint(null);
          }}
          onSuccess={async () => {
            setShowLintasWilayahModal(false);
            setSelectedLintasWilayahComplaint(null);
            showFriendlyToast('success', 'Disposisi Dialihkan', 'Laporan berhasil dialihkan ke Mako tujuan terdekat.');
            await loadData();
          }}
        />
      )}
    </div>
  );
}

export default function OperatorConsoleView({
  session,
  initialSection = 'operator',
  initialMasterData,
  initialOperatorData,
}: {
  session?: any;
  initialSection?: string;
  initialMasterData?: any;
  initialOperatorData?: any;
}) {
  return (
    <React.Suspense>
      <OperatorConsoleContent
        session={session}
        initialSection={initialSection}
        initialMasterData={initialMasterData}
        initialOperatorData={initialOperatorData}
      />
    </React.Suspense>
  );
}
