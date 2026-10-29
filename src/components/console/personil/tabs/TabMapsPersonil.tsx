'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
  Navigation,
  MapPin,
  Phone,
  MessageSquare,
  Shield,
  Layers,
  ChevronUp,
  ChevronDown,
  Lock,
  User,
  FileText,
  AlertTriangle,
  Radio,
  Clock,
  Car,
  CheckCircle2,
  TrendingUp,
  X,
} from 'lucide-react';
import { getDistanceFromLatLonInMeters, formatPhoneNumber, getCleanCallNumber } from '../types';
import type { ComplaintData, OfficerProfile, DispatchStepAction } from '../types';
import { getBestRoadRoute, getRealRoadPath } from '@/components/maps/SimapresGoogleMap';
import { updateDeviceTelemetryAction } from '@/app/actions/auth.actions';
import { completeGiatPatroliAction } from '@/app/actions/logbook.actions';
import { getComplaintActionPermissions } from '@/domain/rules/complaint.rules';
import { toast } from '@/components/ui/Toast';

const SimapresLeafletMap = dynamic(() => import('@/components/maps/SimapresLeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[500px] bg-[#0E1017] flex items-center justify-center text-amber-300 font-bold">
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
        Memuat Peta Rute Navigasi Taktis...
      </div>
    </div>
  ),
});

interface TabMapsPersonilProps {
  officer: OfficerProfile;
  activeComplaint: ComplaintData | null;
  activeGiat?: any | null;
  currentGps: { lat: number; lng: number };
  fleetUnits: any[];
  hotspots: any[];
  policeOffices: any[];
  dispatchStatuses?: any[];
  onOpenChat: (complaint: ComplaintData) => void;
  onOpenWizard: (complaint: ComplaintData) => void;
  onUpdateStep: (stepKey: DispatchStepAction) => Promise<void>;
  isUpdatingStep: boolean;
  onGiatCompleted?: () => void;
}

export default function TabMapsPersonil({
  officer,
  activeComplaint,
  activeGiat,
  currentGps,
  fleetUnits,
  hotspots,
  policeOffices,
  dispatchStatuses,
  onOpenChat,
  onOpenWizard,
  onUpdateStep,
  isUpdatingStep,
  onGiatCompleted,
}: TabMapsPersonilProps) {
  const [showOtherOfficers, setShowOtherOfficers] = useState(true);
  const [showTraffic, setShowTraffic] = useState(true);
  const [showHotspots, setShowHotspots] = useState(true);
  const [showOverlayMenu, setShowOverlayMenu] = useState(false);

  // Bottom drawer draggable / minimizable state
  const [isDrawerExpanded, setIsDrawerExpanded] = useState(false);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  // State drawer & modal untuk Giat Patroli Mandiri (Odometer KM)
  const [isPatrolDrawerExpanded, setIsPatrolDrawerExpanded] = useState(true);
  const [showCompleteGiatModal, setShowCompleteGiatModal] = useState(false);
  const [patrolSummaryNote, setPatrolSummaryNote] = useState('');
  const [isSubmittingFinishGiat, setIsSubmittingFinishGiat] = useState(false);

  // Dev bypass & Realistic Navigation Simulation State
  const [bypassDevRadius, setBypassDevRadius] = useState(false);
  const [simulatedGps, setSimulatedGps] = useState<{ lat: number; lng: number } | null>(null);
  const [simulationRemainingRoute, setSimulationRemainingRoute] = useState<{ lat: number; lng: number }[] | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [simulationProgress, setSimulationProgress] = useState<number>(0);
  const simulationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Efektif koordinat unit (mengutamakan simulatedGps jika simulasi aktif)
  const effectiveGps = useMemo(() => {
    return simulatedGps || currentGps;
  }, [simulatedGps, currentGps]);

  // Parsing rincian Giat Patroli Aktif
  const patrolInfo = useMemo(() => {
    if (!activeGiat) return null;
    const type = (activeGiat.jenisAksi || activeGiat.action_type || 'PATROLI').toUpperCase();
    const rawDesc = activeGiat.deskripsiKegiatan || activeGiat.activity_description || '';

    const lines = rawDesc.split('\n');
    let route = activeGiat.lokasiKlaimAlamat || activeGiat.claimed_address || '';
    let vehicle = '';
    let partners = '';

    for (const l of lines) {
      const line = l.trim();
      if (!route && line.startsWith('• Rencana Rute/Lokasi:')) route = line.replace('• Rencana Rute/Lokasi:', '').trim();
      else if (line.startsWith('• Armada Kendaraan:')) vehicle = line.replace('• Armada Kendaraan:', '').trim();
      else if (line.startsWith('• Rekan Regu:')) partners = line.replace('• Rekan Regu:', '').trim();
    }

    const icon = type === 'PATROLI' ? '🚔' : type === 'SAMBANG' ? '🤝' : type === 'PENGAMANAN' ? '⚠️' : '🛡️';
    const title = type === 'PATROLI' ? 'Giat Patroli Rutin Blue Light Beat' : type === 'SAMBANG' ? 'Giat Sambang Dialogis Warga' : type === 'PENGAMANAN' ? 'Giat Pengamanan & Penjagaan Jalur' : 'Giat Respon TPTKP Presisi';

    return {
      type,
      title,
      icon,
      route: route || 'Wilayah Hukum Polres Pekalongan',
      vehicle: vehicle || 'Ranmor Roda 4 Samapta',
      partners,
    };
  }, [activeGiat]);

  // Live Odometer Tracking via GPS (Sesuai Catatan User No. 1: Tanpa sisa waktu, akumulasi KM berjalan untuk klaim Sikeu)
  const [odometerMeters, setOdometerMeters] = useState<number>(() => {
    if (typeof window !== 'undefined' && activeGiat?.id) {
      try {
        const saved = localStorage.getItem(`simapres_giat_km_${activeGiat.id}`);
        if (saved) return Number(saved) || 0;
      } catch {}
    }
    const initialMeters = Number(activeGiat?.deviasiMeter || activeGiat?.deviation_meters || 0);
    return initialMeters > 0 ? initialMeters : 0;
  });

  const lastGpsRef = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!activeGiat?.id || !effectiveGps?.lat || !effectiveGps?.lng) return;

    if (!lastGpsRef.current) {
      lastGpsRef.current = { lat: effectiveGps.lat, lng: effectiveGps.lng };
      return;
    }

    const d = getDistanceFromLatLonInMeters(
      lastGpsRef.current.lat,
      lastGpsRef.current.lng,
      effectiveGps.lat,
      effectiveGps.lng
    );

    // Filter noise GPS: hanya hitung perpindahan riil 10m - 2000m
    if (d >= 10 && d <= 2000) {
      setOdometerMeters((prev) => {
        const next = Math.round((prev + d) * 100) / 100;
        try {
          localStorage.setItem(`simapres_giat_km_${activeGiat.id}`, String(next));
        } catch {}
        return next;
      });
      lastGpsRef.current = { lat: effectiveGps.lat, lng: effectiveGps.lng };
    }
  }, [effectiveGps?.lat, effectiveGps?.lng, activeGiat?.id]);

  const currentOdometerKm = (odometerMeters / 1000).toFixed(2);

  const handleFinishGiatPatroli = async () => {
    if (!activeGiat?.id) return;
    setIsSubmittingFinishGiat(true);
    try {
      const res = await completeGiatPatroliAction({
        logbookId: activeGiat.id,
        finalMeters: odometerMeters,
        catatanHasil: patrolSummaryNote.trim() || 'Patroli selesai dalam situasi aman dan kondusif.',
      });

      if (res.success) {
        toast.success(
          'Giat Patroli Selesai',
          `Total ${currentOdometerKm} KM telah tercatat untuk laporan klaim bagian keuangan (Sikeu).`
        );
        try {
          localStorage.removeItem(`simapres_giat_km_${activeGiat.id}`);
        } catch {}
        setShowCompleteGiatModal(false);
        if (onGiatCompleted) {
          onGiatCompleted();
        }
      } else {
        toast.error('Gagal Menyelesaikan Giat', res.error || 'Terjadi kesalahan sistem.');
      }
    } catch (err: any) {
      toast.error('Gagal Menyelesaikan Giat', err.message || 'Terjadi kesalahan.');
    } finally {
      setIsSubmittingFinishGiat(false);
    }
  };

  // 1. Ekstraksi koordinat TKP akurat dari berbagai format database entity
  const tkpCoords = useMemo(() => {
    if (!activeComplaint) return null;
    const lat =
      activeComplaint.tkpLat ??
      activeComplaint.tkpLatitude ??
      activeComplaint.lat ??
      activeComplaint.tkp_lat;
    const lng =
      activeComplaint.tkpLng ??
      activeComplaint.tkpLongitude ??
      activeComplaint.lng ??
      activeComplaint.tkp_lng;
    if (lat == null || lng == null) return null;
    return { lat: Number(lat), lng: Number(lng) };
  }, [activeComplaint]);

  // 2. Hitung jarak ke TKP
  const distanceToTkpMeters = useMemo(() => {
    if (!tkpCoords || !effectiveGps?.lat || !effectiveGps?.lng) return Infinity;
    return getDistanceFromLatLonInMeters(
      effectiveGps.lat,
      effectiveGps.lng,
      tkpCoords.lat,
      tkpCoords.lng
    );
  }, [tkpCoords, effectiveGps]);

  const isRealWithin50Meters = distanceToTkpMeters <= 50;
  const isWithin50Meters = isRealWithin50Meters || bypassDevRadius;

  const distanceFormatted = useMemo(() => {
    if (distanceToTkpMeters === Infinity) return '-';
    if (distanceToTkpMeters < 1000) return `${distanceToTkpMeters} M`;
    return `${(distanceToTkpMeters / 1000).toFixed(1)} KM`;
  }, [distanceToTkpMeters]);

  const etaMinutesText = useMemo(() => {
    if (distanceToTkpMeters === Infinity) return '-';
    // Asumsi kecepatan rata-rata respon darurat ~35 km/jam (sinkron presisi dengan portal warga)
    const minutes = Math.max(1, Math.round((distanceToTkpMeters / 1000 / 35) * 60));
    if (minutes >= 60) {
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      return m > 0 ? `±${h} Jam ${m} Mnt` : `±${h} Jam`;
    }
    return `±${minutes} Mnt`;
  }, [distanceToTkpMeters]);

  // 3. Normalisasi nomor tiket agar tidak double hash
  const formattedTicket = useMemo(() => {
    if (!activeComplaint?.nomorTiket) return '';
    return activeComplaint.nomorTiket.startsWith('#')
      ? activeComplaint.nomorTiket
      : `#${activeComplaint.nomorTiket}`;
  }, [activeComplaint?.nomorTiket]);

  const isMissionActive = Boolean(
    activeComplaint &&
      activeComplaint.status !== 'SELESAI' &&
      activeComplaint.status !== 'DITOLAK'
  );

  // URL Navigasi Langsung ke Google Maps App (Origin: Personil, Destination: TKP/Pelapor)
  const gmapsNavigationUrl = useMemo(() => {
    if (!tkpCoords?.lat || !tkpCoords?.lng) return null;
    const dest = `${tkpCoords.lat},${tkpCoords.lng}`;
    const originLat = effectiveGps?.lat ?? officer?.currentGpsLat;
    const originLng = effectiveGps?.lng ?? officer?.currentGpsLng;

    if (originLat && originLng) {
      return `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${dest}&travelmode=driving`;
    }
    return `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`;
  }, [tkpCoords, effectiveGps, officer]);

  // 4. Deteksi Tahap Tugas Menggunakan Domain Rules Murni (Single Source of Truth)
  const actionPermissions = useMemo(() => {
    if (!activeComplaint) return null;

    const officerDispatch = activeComplaint?.dispatches?.find(
      (d: any) =>
        (d.officer_id && (String(d.officer_id) === String(officer.id) || d.officer?.nrp === officer.nrp)) ||
        (d.officer?.user?.identifier === officer.nrp)
    ) || activeComplaint?.dispatches?.[0];

    const dispatchStatus = String(officerDispatch?.dispatch_status || officerDispatch?.dispatchStatus || '').toUpperCase();

    return getComplaintActionPermissions({
      status: activeComplaint.status,
      tahap: activeComplaint.tahap,
      role: 'PERSONIL',
      isAssignedOfficer: true,
      dispatchStatus: dispatchStatus || (
        activeComplaint.responTibaTkpAt || activeComplaint.waktuTiba
          ? 'ARRIVED'
          : activeComplaint.waktuMeluncur || activeComplaint.responMeluncurAt
          ? 'DEPARTED'
          : 'DISPATCHED'
      ),
    });
  }, [activeComplaint, officer.id, officer.nrp]);

  const complaintStage = useMemo<'persiapan' | 'meluncur' | 'tiba'>(() => {
    if (!isMissionActive || !actionPermissions) return 'persiapan';

    if (actionPermissions.canArriveTkp) {
      return 'meluncur';
    }
    if (actionPermissions.canSubmitTindakan || actionPermissions.canRequestPawasApproval) {
      return 'tiba';
    }
    return 'persiapan';
  }, [isMissionActive, actionPermissions]);

  // Master Dispatch Status Dictionary dari database MySQL (key -> { label, badge_color, badge_bg, badge_border })
  const dispatchStatusMap = useMemo(() => {
    const map: Record<string, { label: string; badge_color?: string; badge_bg?: string; badge_border?: string }> = {};
    for (const item of dispatchStatuses || []) {
      if (item?.key) {
        map[String(item.key).toUpperCase()] = {
          label: item.label,
          badge_color: item.badge_color,
          badge_bg: item.badge_bg,
          badge_border: item.badge_border,
        };
      }
    }
    return map;
  }, [dispatchStatuses]);

  // Dynamic visual styling berdasarkan data master_dispatch_statuses di database
  const currentStatusStyle = useMemo(() => {
    if (complaintStage === 'persiapan') {
      const s = dispatchStatusMap['DISPATCHED'];
      return {
        label: s?.label || 'Disposisi',
        color: s?.badge_color || '#2563EB',
        bg: s?.badge_bg || '#EFF6FF',
        border: s?.badge_border || '#BFDBFE',
      };
    }
    if (complaintStage === 'meluncur') {
      const s = dispatchStatusMap['DEPARTED'];
      return {
        label: isWithin50Meters
          ? `${s?.label || 'Meluncur'} (<50m)`
          : (s?.label || 'Meluncur'),
        color: isWithin50Meters ? '#10B981' : (s?.badge_color || '#8B5CF6'),
        bg: isWithin50Meters ? '#ECFDF5' : (s?.badge_bg || '#F5F3FF'),
        border: isWithin50Meters ? '#A7F3D0' : (s?.badge_border || '#DDD6FE'),
      };
    }
    const s = dispatchStatusMap['ARRIVED'];
    return {
      label: s?.label || 'Tiba di TKP',
      color: s?.badge_color || '#10B981',
      bg: s?.badge_bg || '#ECFDF5',
      border: s?.badge_border || '#A7F3D0',
    };
  }, [complaintStage, isWithin50Meters, dispatchStatusMap]);

  // Waktu pembuatan / disposisi tiket terformat
  const formattedTime = useMemo(() => {
    const d = activeComplaint?.disposisiAt || activeComplaint?.createdAt;
    if (!d) return null;
    try {
      return new Date(d).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
    } catch {
      return null;
    }
  }, [activeComplaint?.disposisiAt, activeComplaint?.createdAt]);

const EMPTY_ARRAY: any[] = [];

  // Dynamic measurement of bottom drawer height
  const drawerRef = useRef<HTMLDivElement>(null);
  const [drawerHeight, setDrawerHeight] = useState<number>(0);

  useEffect(() => {
    if (!activeComplaint) {
      setDrawerHeight((prev) => (prev !== 0 ? 0 : prev));
      return;
    }

    const updateHeight = () => {
      if (drawerRef.current) {
        const h = drawerRef.current.offsetHeight;
        if (h > 0) {
          setDrawerHeight((prev) => (Math.abs(prev - h) > 2 ? h : prev));
        }
      }
    };

    updateHeight();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && drawerRef.current) {
      ro = new ResizeObserver(() => {
        updateHeight();
      });
      ro.observe(drawerRef.current);
    }

    const t1 = setTimeout(updateHeight, 60);
    const t2 = setTimeout(updateHeight, 320);

    return () => {
      if (ro) ro.disconnect();
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [activeComplaint, isDrawerExpanded]);

  // Posisi 3 tombol kontrol peta (+, -, locate) dinamis tepat mengambang di atas drawer
  const controlsBottomOffset = useMemo(() => {
    if (!isMissionActive) {
      if (activeGiat) {
        return isPatrolDrawerExpanded ? '370px' : '160px';
      }
      // Saat siaga patroli tanpa tiket aktif, ada kartu siaga di bottom-[74px] setinggi ~64px
      return '154px';
    }
    // Jarak drawer dari bawah adalah 74px (tepat 12px di atas navigation dock ~62px)
    // Beri jarak vertikal aman 16px tepat di atas bibir atas drawer
    const baseHeight = drawerHeight > 0
      ? drawerHeight
      : (isDrawerExpanded ? 480 : 135);
    const calculated = 74 + baseHeight + 16;
    return `${calculated}px`;
  }, [isMissionActive, activeGiat, isPatrolDrawerExpanded, drawerHeight, isDrawerExpanded]);

  // Touch gesture handlers untuk drag up / down
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY === null) return;
    const touchEndY = e.changedTouches[0].clientY;
    const diffY = touchEndY - touchStartY;
    if (diffY > 30) {
      // Geser ke bawah -> minimize
      setIsDrawerExpanded(false);
    } else if (diffY < -30) {
      // Geser ke atas -> maximize
      setIsDrawerExpanded(true);
    }
    setTouchStartY(null);
  };

  // Eksekusi Tombol Utama Sesuai Workflow Sekuensial Berbasis Domain Rules
  const handleMainActionClick = async () => {
    if (!activeComplaint || isUpdatingStep || !actionPermissions) return;

    if (actionPermissions.canStartMeluncur) {
      // Tahap 1: Personel Berangkat ke TKP (MasterDispatchStatus: DEPARTED)
      await onUpdateStep('DEPARTED');
    } else if (actionPermissions.canArriveTkp) {
      // Tahap 2: Konfirmasi Tiba di Lokasi (MasterDispatchStatus: ARRIVED)
      if (!isWithin50Meters) return;
      await onUpdateStep('ARRIVED');
    } else if (actionPermissions.canSubmitTindakan || actionPermissions.canRequestPawasApproval) {
      // Tahap 3: Selesaikan Penanganan Tugas di Lapangan / BAP
      onOpenWizard(activeComplaint);
    }
  };

  // Helper untuk menghentikan / reset simulasi
  const stopSimulation = () => {
    if (simulationTimerRef.current) {
      clearInterval(simulationTimerRef.current);
      simulationTimerRef.current = null;
    }
    setIsSimulating(false);
    setIsLoadingRoute(false);
  };

  const handleResetSimulation = () => {
    stopSimulation();
    setSimulatedGps(null);
    setSimulationRemainingRoute(null);
    setSimulationProgress(0);
    setBypassDevRadius(false);
  };

  // Pastikan timer simulasi dibersihkan saat komponen di-unmount
  useEffect(() => {
    return () => {
      if (simulationTimerRef.current) {
        clearInterval(simulationTimerRef.current);
      }
    };
  }, []);

  // Eksekusi Simulasi Perjalanan Nyata (Menyusuri Jalan Raya Asli OSRM, Rute Belakang Otomatis Terpotong)
  const handleToggleSimulation = async () => {
    // Jika sedang berjalan atau loading rute, klik tombol berarti batalkan / hentikan
    if (isSimulating || isLoadingRoute) {
      stopSimulation();
      return;
    }

    // Jika sudah selesai simulasi / ada simulatedGps, klik lagi untuk reset
    if (simulatedGps) {
      handleResetSimulation();
      return;
    }

    if (!tkpCoords || !effectiveGps) return;

    setIsLoadingRoute(true);

    try {
      const startLat = effectiveGps.lat;
      const startLng = effectiveGps.lng;
      const destLat = tkpCoords.lat;
      const destLng = tkpCoords.lng;

      // 1. Dapatkan rute jalan raya resmi (Prioritas 1: Google Directions, Tier 2: OSRM, Tier 3: Tactical)
      let roadPoints: { lat: number; lng: number }[] | null = null;
      try {
        const maps = (window as any).google?.maps;
        const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3500));
        const routePromise = getBestRoadRoute(maps, { lat: startLat, lng: startLng }, { lat: destLat, lng: destLng });
        const bestRoute = await Promise.race([routePromise, timeoutPromise]);
        if (bestRoute && bestRoute.path && bestRoute.path.length >= 2) {
          roadPoints = bestRoute.path;
        }
      } catch (e) {
        console.warn('Road route fetch notice, using fallback curve:', e);
      }

      // 2. Siapkan array fullPath koordinat
      let fullPath: { lat: number; lng: number }[] = [];
      if (roadPoints && roadPoints.length >= 2) {
        fullPath = [...roadPoints];
      } else {
        // Fallback: Bentuk kurva jalan alami 200 titik interpolasi
        const SAMPLES = 200;
        const perpLat = -(destLng - startLng);
        const perpLng = (destLat - startLat);
        for (let i = 0; i <= SAMPLES; i++) {
          const t = i / SAMPLES;
          const curve = Math.sin(t * Math.PI) * 0.05 + Math.sin(t * 3 * Math.PI) * 0.015;
          fullPath.push({
            lat: startLat + (destLat - startLat) * t + perpLat * curve,
            lng: startLng + (destLng - startLng) * t + perpLng * curve,
          });
        }
      }

      // Pastikan titik awal dan titik akhir presisi
      fullPath[0] = { lat: startLat, lng: startLng };
      // Titik akhir diposisikan ~25 meter dari TKP agar tepat berada di radius < 50m
      fullPath[fullPath.length - 1] = {
        lat: destLat + 0.00018,
        lng: destLng + 0.00012,
      };

      // 3. Hitung jarak kumulatif di sepanjang lintasan jalan
      const cumDistances: number[] = [0];
      for (let i = 1; i < fullPath.length; i++) {
        const segDist = getDistanceFromLatLonInMeters(
          fullPath[i - 1].lat,
          fullPath[i - 1].lng,
          fullPath[i].lat,
          fullPath[i].lng
        );
        cumDistances.push(cumDistances[i - 1] + segDist);
      }
      const totalDistance = cumDistances[cumDistances.length - 1];

      // 4. Precompute frame simulasi: 52 langkah @ 1.4 detik (~72.8 detik total durasi)
      // Cukup lama dan realistis agar pengguna leluasa menjelaskan alur sistem ke audiens
      const TOTAL_STEPS = 52;
      interface SimFrame {
        pos: { lat: number; lng: number };
        remainingRoute: { lat: number; lng: number }[];
        progressPercent: number;
      }

      const frames: SimFrame[] = [];

      for (let step = 0; step < TOTAL_STEPS; step++) {
        const targetDist = (step / (TOTAL_STEPS - 1)) * totalDistance;

        let segIdx = 0;
        while (segIdx < cumDistances.length - 1 && cumDistances[segIdx + 1] < targetDist) {
          segIdx++;
        }

        const p1 = fullPath[segIdx];
        const p2 = fullPath[Math.min(segIdx + 1, fullPath.length - 1)];
        const segStartDist = cumDistances[segIdx];
        const segEndDist = cumDistances[Math.min(segIdx + 1, cumDistances.length - 1)];
        const segLength = segEndDist - segStartDist;

        let curPos = p1;
        if (segLength > 0) {
          const ratio = Math.max(0, Math.min(1, (targetDist - segStartDist) / segLength));
          curPos = {
            lat: p1.lat + (p2.lat - p1.lat) * ratio,
            lng: p1.lng + (p2.lng - p1.lng) * ratio,
          };
        }

        if (step === TOTAL_STEPS - 1) {
          curPos = fullPath[fullPath.length - 1];
        }

        // Rute tersisa di depan kendaraan (garis di belakang kendaraan otomatis hilang/terpotong!)
        const remainingRoute =
          step === TOTAL_STEPS - 1
            ? []
            : [curPos, ...fullPath.slice(segIdx + 1)];

        const progressPercent = Math.round((step / (TOTAL_STEPS - 1)) * 100);

        frames.push({
          pos: curPos,
          remainingRoute,
          progressPercent,
        });
      }

      // 5. Jalankan Simulasi
      setIsLoadingRoute(false);
      setIsSimulating(true);

      // Frame pertama langsung diterapkan
      setSimulatedGps(frames[0].pos);
      setSimulationRemainingRoute(frames[0].remainingRoute);
      setSimulationProgress(frames[0].progressPercent);

      let currentStep = 0;
      simulationTimerRef.current = setInterval(() => {
        currentStep++;
        if (currentStep >= frames.length) {
          if (simulationTimerRef.current) {
            clearInterval(simulationTimerRef.current);
            simulationTimerRef.current = null;
          }
          setIsSimulating(false);
          const lastFrame = frames[frames.length - 1];
          setSimulatedGps(lastFrame.pos);
          setSimulationRemainingRoute([]);
          setSimulationProgress(100);

          // Update koordinat akhir ke database telemetri agar sinkron ke tracking warga & Pawas
          updateDeviceTelemetryAction({
            nrp: officer.nrp,
            lat: lastFrame.pos.lat,
            lng: lastFrame.pos.lng,
          }).catch(() => {});
          return;
        }

        const frame = frames[currentStep];
        setSimulatedGps(frame.pos);
        setSimulationRemainingRoute(frame.remainingRoute);
        setSimulationProgress(frame.progressPercent);

        // Sinkronisasi telemetri DB setiap 3 langkah (~4.2 detik)
        if (currentStep % 3 === 0) {
          updateDeviceTelemetryAction({
            nrp: officer.nrp,
            lat: frame.pos.lat,
            lng: frame.pos.lng,
          }).catch(() => {});
        }
      }, 1400);
    } catch (err) {
      console.error('Failed to start simulation:', err);
      setIsLoadingRoute(false);
      setIsSimulating(false);
    }
  };

  // Memoize myUnit data agar tidak re-trigger render marker Google Maps di setiap frame
  const memoizedMyUnit = useMemo(() => {
    const hasValidGps = Boolean(
      effectiveGps &&
      Number(effectiveGps.lat) !== 0 &&
      Number(effectiveGps.lng) !== 0
    );
    return {
      key: `petugas_${officer.id || officer.nrp}`,
      nrp: officer.nrp,
      callsign: officer.nrp,
      petugas: officer.fullName,
      pangkat: officer.pangkat,
      title: `${officer.pangkat} ${officer.fullName}`,
      pos: hasValidGps ? { lat: Number(effectiveGps.lat), lng: Number(effectiveGps.lng) } : undefined,
      lat: hasValidGps ? Number(effectiveGps.lat) : undefined,
      lng: hasValidGps ? Number(effectiveGps.lng) : undefined,
    };
  }, [officer.id, officer.nrp, officer.fullName, officer.pangkat, effectiveGps?.lat, effectiveGps?.lng]);

  const activeHotspots = useMemo(() => {
    return !activeComplaint && showHotspots ? hotspots : EMPTY_ARRAY;
  }, [activeComplaint, showHotspots, hotspots]);

  return (
    <div className="relative w-full h-full overflow-hidden flex-1 flex flex-col">
      {/* Interactive Full Google Map with Dynamic Floating Controls */}
      <SimapresLeafletMap
        mode="fullscreen"
        height="100%"
        targetComplaint={isMissionActive ? activeComplaint : null}
        centerLat={
          effectiveGps && Number(effectiveGps.lat) !== 0
            ? Number(effectiveGps.lat)
            : (Number(activeGiat?.lokasiKlaimLat || activeGiat?.claimed_lat || activeComplaint?.tkpLat || officer.stationLat) || undefined)
        }
        centerLng={
          effectiveGps && Number(effectiveGps.lng) !== 0
            ? Number(effectiveGps.lng)
            : (Number(activeGiat?.lokasiKlaimLng || activeGiat?.claimed_lng || activeComplaint?.tkpLng || officer.stationLng) || undefined)
        }
        customRoutePath={
          (isSimulating || simulatedGps) && simulationRemainingRoute && simulationRemainingRoute.length >= 2
            ? simulationRemainingRoute
            : undefined
        }
        followMyUnit={Boolean(isSimulating || complaintStage === 'meluncur')}
        myUnit={memoizedMyUnit}
        hotspots={activeHotspots}
        policeOffices={policeOffices}
        fleetUnits={fleetUnits}
        showTraffic={Boolean(isMissionActive || showTraffic)}
        showOtherOfficers={!isMissionActive && showOtherOfficers}
        controlsPosition="bottom-right"
        controlsBottomOffset={controlsBottomOffset}
        controlsRightOffset="16px"
      />

      {/* Floating Top Controls (Collapsible Layer Menu) - Dinonaktifkan & Dihapus saat sedang menerima tiket */}
      {!isMissionActive && (
        <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setShowOverlayMenu(!showOverlayMenu)}
            className="flex items-center gap-2 px-3 py-2 rounded-2xl backdrop-blur-xl text-xs font-bold text-amber-300 hover:text-white transition-all shadow-lg active:scale-95"
            style={{
              background: 'rgba(15, 17, 24, 0.92)',
              border: '1px solid rgba(236, 196, 115, 0.3)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
            }}
            title="Buka / Tutup Lapisan Peta"
          >
            <Layers size={16} className="text-amber-400" />
            <span>Lapisan Peta</span>
            {showOverlayMenu ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showOverlayMenu && (
            <div
              className="flex flex-col gap-2 p-3 rounded-2xl backdrop-blur-xl max-w-[260px] animate-in fade-in slide-in-from-top-2 duration-200"
              style={{
                background: 'rgba(15, 17, 24, 0.95)',
                border: '1px solid rgba(236, 196, 115, 0.25)',
                boxShadow: '0 12px 32px rgba(0, 0, 0, 0.75)',
              }}
            >
              <div className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                Pilihan Lapisan
              </div>

              <label className="flex items-center gap-2 text-xs font-semibold text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showOtherOfficers}
                  onChange={(e) => setShowOtherOfficers(e.target.checked)}
                  className="rounded accent-amber-400"
                />
                <span>Sebaran Personel Lain</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-semibold text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showTraffic}
                  onChange={(e) => setShowTraffic(e.target.checked)}
                  className="rounded accent-amber-400"
                />
                <span>Traffic Line (Lalu Lintas)</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-semibold text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showHotspots}
                  onChange={(e) => setShowHotspots(e.target.checked)}
                  className="rounded accent-amber-400"
                />
                <span>Titik Rawan Kejahatan</span>
              </label>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* DRAWER BOTTOM DRAGGABLE: NAVIGASI & AKSI TAKTIS PETUGAS  */}
      {/* ======================================================== */}
      {isMissionActive && activeComplaint ? (
        <div
          ref={drawerRef}
          id="tactical-bottom-drawer"
          className="absolute bottom-[74px] sm:bottom-[78px] md:bottom-6 left-3 right-3 sm:left-6 sm:right-6 md:left-6 md:right-auto md:w-[460px] max-w-xl md:max-w-none mx-auto md:mx-0 z-20 rounded-3xl backdrop-blur-2xl transition-all duration-300 ease-in-out select-none"
          style={{
            background: 'linear-gradient(135deg, rgba(20, 24, 34, 0.97) 0%, rgba(12, 14, 20, 0.98) 100%)',
            border: '1.5px solid rgba(236, 196, 115, 0.35)',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.85), 0 0 25px rgba(236, 196, 115, 0.12)',
          }}
        >
          {/* Draggable Handle Pill */}
          <div
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onClick={() => setIsDrawerExpanded((prev) => !prev)}
            className="w-full flex flex-col items-center justify-center pt-2.5 pb-1 cursor-pointer group"
            title={isDrawerExpanded ? 'Klik atau geser ke bawah untuk memperkecil' : 'Klik atau geser ke atas untuk memperbesar'}
          >
            <div className="w-12 h-1.5 rounded-full bg-white/25 group-hover:bg-amber-400/80 transition-colors" />
          </div>

          <div className="p-4 sm:p-5 pt-0.5 space-y-3 sm:space-y-3.5">
            {/* Top Info Header (Always Visible outside red box) */}
            <div className="flex items-center justify-between gap-2">
              <div
                onClick={() => setIsDrawerExpanded((prev) => !prev)}
                className="flex items-center gap-2 cursor-pointer min-w-0"
              >
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping flex-shrink-0" />
                <Navigation size={13} className="text-amber-400 stroke-[2.5] flex-shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 whitespace-nowrap">
                  NAVIGASI MENUJU TKP
                </span>
                <span className="text-xs font-mono font-bold text-amber-300 whitespace-nowrap">
                  {formattedTicket}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsDrawerExpanded((prev) => !prev)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
                title={isDrawerExpanded ? 'Perkecil Tampilan' : 'Perbesar Tampilan'}
              >
                {isDrawerExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
              </button>
            </div>

            {/* Ketika Minimized: Tampilkan metrik ringkas simetris DI TENGAH (Sesuai Konsep UX) */}
            {!isDrawerExpanded && (
              <div
                onClick={() => setIsDrawerExpanded(true)}
                className="w-full flex items-center justify-center pt-0.5 cursor-pointer"
              >
                <span className="text-[10px] font-mono font-bold text-amber-200 bg-amber-500/10 border border-amber-500/25 px-3 py-1 rounded-full shadow-sm">
                  {distanceFormatted} • {etaMinutesText}
                </span>
              </div>
            )}

            {/* Middle Section (Inside Red Box: Hidden when minimized) */}
            {isDrawerExpanded && (
              <div
                className="space-y-3 max-h-[35vh] sm:max-h-[40vh] overflow-y-auto pr-1 animate-in fade-in slide-in-from-top-1 duration-200"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgba(236, 196, 115, 0.3) transparent',
                }}
              >
                {/* 1. Baris Tag / Badge Kedinasan & Urgensi */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider transition-colors"
                    style={{
                      color: currentStatusStyle.color,
                      background: currentStatusStyle.bg,
                      border: `1px solid ${currentStatusStyle.border}`,
                    }}
                  >
                    {currentStatusStyle.label}
                  </span>

                  {/* Tingkat Urgensi */}
                  {activeComplaint.urgensi && (
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 ${
                        activeComplaint.urgensi.toUpperCase() === 'DARURAT' ||
                        activeComplaint.urgensi.toUpperCase() === 'TINGGI'
                          ? 'bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      <AlertTriangle size={10} />
                      Urgensi: {activeComplaint.urgensi}
                    </span>
                  )}

                  {/* Kategori Laporan */}
                  {(activeComplaint.kategoriKejadian || activeComplaint.kategoriJudul || activeComplaint.kategoriName) && (
                    <span className="text-[10px] font-medium text-slate-300 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                      {activeComplaint.kategoriKejadian || activeComplaint.kategoriJudul || activeComplaint.kategoriName}
                    </span>
                  )}

                  {/* Waktu Masuk Laporan */}
                  {formattedTime && (
                    <span className="text-[10px] font-mono text-slate-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full flex items-center gap-1 ml-auto">
                      <Clock size={10} />
                      {formattedTime}
                    </span>
                  )}
                </div>

                {/* 2. Judul Kejadian Lengkap (Tanpa Pemotongan Text) */}
                <div className="space-y-0.5">
                  <div className="text-[10px] font-bold text-amber-400/80 uppercase tracking-wider">
                    Jenis Kejadian
                  </div>
                  <h3 className="text-sm sm:text-base font-black text-white leading-snug break-words">
                    {activeComplaint.jenisKejadian}
                  </h3>
                </div>

                {/* 3. Detail Lokasi TKP Lengkap & Titik Temu (Tanpa Pemotongan Text) */}
                <div className="p-2.5 sm:p-3 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2">
                  <div className="flex items-start gap-2.5">
                    <MapPin size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] font-bold text-amber-400/90 uppercase tracking-wider">
                        Alamat Lengkap &amp; Titik Temu TKP
                      </div>
                      <div className="text-xs text-slate-100 font-semibold leading-relaxed break-words mt-0.5">
                        {activeComplaint.tkpAlamatTeks || 'Lokasi Kejadian Lapangan'}
                      </div>
                      {(activeComplaint.tkpLatitude || activeComplaint.tkpLat) && (activeComplaint.tkpLongitude || activeComplaint.tkpLng) && (
                        <div className="text-[10px] font-mono text-slate-400 mt-1 flex items-center gap-1">
                          <span>Koordinat:</span>
                          <span className="text-amber-300/90">
                            {(activeComplaint.tkpLatitude || activeComplaint.tkpLat).toFixed(5)}, {(activeComplaint.tkpLongitude || activeComplaint.tkpLng).toFixed(5)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Kontak Pelapor / Korban */}
                  {(() => {
                    const rawPhone = activeComplaint.pelaporTelepon || activeComplaint.pelaporHp || activeComplaint.pelapor_hp;
                    const formattedPhone = formatPhoneNumber(rawPhone);
                    const callPhone = getCleanCallNumber(rawPhone);

                    if (!activeComplaint.pelaporNama && !formattedPhone) return null;

                    return (
                      <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2 text-[11px] text-slate-300">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <User size={13} className="text-amber-400 flex-shrink-0" />
                          <span className="truncate">
                            Pelapor: <strong className="text-white">{activeComplaint.pelaporNama || 'Warga 110'}</strong>
                          </span>
                        </div>
                        {formattedPhone && (
                          <a
                            href={`tel:${callPhone}`}
                            className="text-amber-300 font-mono font-bold hover:underline flex items-center gap-1 flex-shrink-0 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg"
                          >
                            <Phone size={11} />
                            <span>{formattedPhone}</span>
                          </a>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* 4. Uraian Lengkap Kejadian / Keterangan Pelapor */}
                {(activeComplaint.ringkasanKeterangan || activeComplaint.isiLaporan || activeComplaint.deskripsi || activeComplaint.keterangan) && (
                  <div className="p-2.5 sm:p-3 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <FileText size={13} className="text-amber-400" />
                      <span>Uraian / Deskripsi Laporan</span>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed break-words font-medium">
                      {activeComplaint.ringkasanKeterangan || activeComplaint.isiLaporan || activeComplaint.deskripsi || activeComplaint.keterangan}
                    </p>
                  </div>
                )}

                {/* 5. Arahan Taktis Pawas (Instruksi Pimpinan Piket) */}
                {(activeComplaint.arahanPawas || activeComplaint.instruksiPawas) && (
                  <div
                    className="p-2.5 sm:p-3 rounded-2xl border space-y-1"
                    style={{
                      background: 'linear-gradient(135deg, rgba(236, 196, 115, 0.12) 0%, rgba(20, 24, 34, 0.6) 100%)',
                      borderColor: 'rgba(236, 196, 115, 0.35)',
                    }}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-amber-300">
                      <Radio size={13} className="text-amber-400 animate-pulse" />
                      <span>Arahan Taktis Pawas</span>
                    </div>
                    <p className="text-xs text-amber-100 font-semibold leading-relaxed italic break-words">
                      &ldquo;{activeComplaint.arahanPawas || activeComplaint.instruksiPawas}&rdquo;
                    </p>
                  </div>
                )}

                {/* 6. 3-Column Metrics (Jarak GPS, Estimasi, Status) */}
                <div className="grid grid-cols-3 divide-x divide-white/10 p-2.5 rounded-2xl bg-white/5 border border-white/10 flex-shrink-0">
                  <div className="text-center px-1">
                    <div className="text-[9px] font-bold text-slate-400 tracking-wider uppercase whitespace-nowrap">JARAK GPS</div>
                    <div className="text-xs sm:text-sm font-black text-amber-300 whitespace-nowrap mt-0.5 font-mono">
                      {distanceFormatted}
                    </div>
                  </div>
                  <div className="text-center px-1">
                    <div className="text-[9px] font-bold text-slate-400 tracking-wider uppercase whitespace-nowrap">ESTIMASI</div>
                    <div className="text-xs sm:text-sm font-bold text-slate-200 whitespace-nowrap mt-0.5">
                      {etaMinutesText}
                    </div>
                  </div>
                  <div className="text-center px-1">
                    <div className="text-[9px] font-bold text-slate-400 tracking-wider uppercase whitespace-nowrap">STATUS</div>
                    <div className="text-xs sm:text-sm font-bold whitespace-nowrap mt-0.5" style={{ color: currentStatusStyle.color }}>
                      {currentStatusStyle.label}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Action Row (Outside Red Box: Always Visible) */}
            <div className="space-y-1.5 pt-1 border-t border-white/5">
              <div className="flex items-center gap-2">
                {Boolean(activeComplaint.pelaporTelepon || activeComplaint.pelaporHp || activeComplaint.pelapor_hp) && (
                  <a
                    href={`tel:${getCleanCallNumber(activeComplaint.pelaporTelepon || activeComplaint.pelaporHp || activeComplaint.pelapor_hp)}`}
                    className="p-2.5 rounded-xl text-slate-300 bg-white/10 hover:bg-white/20 transition-colors flex-shrink-0"
                    title={`Telepon Pelapor (${formatPhoneNumber(activeComplaint.pelaporTelepon || activeComplaint.pelaporHp || activeComplaint.pelapor_hp)})`}
                  >
                    <Phone size={17} />
                  </a>
                )}

                <button
                  id="btn-drawer-chat"
                  data-testid="btn-drawer-chat"
                  type="button"
                  onClick={() => onOpenChat(activeComplaint)}
                  className="px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 text-amber-200 bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500/25 transition-all flex-shrink-0"
                  title="Buka Chat Pelapor"
                >
                  <MessageSquare size={16} />
                  <span className="hidden sm:inline">Chat</span>
                </button>

                {/* Main Action Button */}
                <button
                  id={
                    complaintStage === 'persiapan'
                      ? 'btn-meluncur-tkp'
                      : complaintStage === 'meluncur'
                      ? 'btn-tiba-tkp'
                      : 'btn-buka-modal-bap'
                  }
                  data-testid={
                    complaintStage === 'persiapan'
                      ? 'btn-meluncur-tkp'
                      : complaintStage === 'meluncur'
                      ? 'btn-tiba-tkp'
                      : 'btn-buka-modal-bap'
                  }
                  type="button"
                  disabled={
                    isUpdatingStep ||
                    (complaintStage === 'meluncur' && !isWithin50Meters) ||
                    (!actionPermissions?.canStartMeluncur &&
                      !actionPermissions?.canArriveTkp &&
                      !actionPermissions?.canSubmitTindakan &&
                      !actionPermissions?.canRequestPawasApproval)
                  }
                  onClick={handleMainActionClick}
                  className="flex-1 px-4 sm:px-5 py-2.5 rounded-xl font-black text-xs transition-all shadow-md active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{
                    background:
                      complaintStage === 'persiapan'
                        ? 'linear-gradient(135deg, #ECC473 0%, #D4A346 100%)'
                        : complaintStage === 'meluncur'
                        ? isWithin50Meters
                          ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                          : 'rgba(255, 255, 255, 0.08)'
                        : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    color:
                      complaintStage === 'persiapan'
                        ? '#0B0D12'
                        : complaintStage === 'meluncur'
                        ? isWithin50Meters
                          ? '#FFFFFF'
                          : '#94A3B8'
                        : '#FFFFFF',
                    border:
                      complaintStage === 'meluncur' && !isWithin50Meters
                        ? '1px solid rgba(255, 255, 255, 0.15)'
                        : 'none',
                    boxShadow:
                      complaintStage === 'persiapan'
                        ? '0 4px 14px rgba(212, 163, 70, 0.35)'
                        : complaintStage === 'meluncur'
                        ? isWithin50Meters
                          ? '0 4px 14px rgba(16, 185, 129, 0.4)'
                          : 'none'
                        : '0 4px 14px rgba(16, 185, 129, 0.4)',
                  }}
                >
                  {isUpdatingStep ? (
                    'Merekam...'
                  ) : complaintStage === 'persiapan' ? (
                    `${dispatchStatusMap['DEPARTED']?.label || 'Meluncur'} ➔`
                  ) : complaintStage === 'meluncur' ? (
                    isWithin50Meters ? (
                      `${dispatchStatusMap['ARRIVED']?.label || 'Tiba di TKP'} ➔`
                    ) : (
                      <>
                        <Lock size={14} className="opacity-70" />
                        <span>{dispatchStatusMap['ARRIVED']?.label || 'Tiba di TKP'} ➔</span>
                      </>
                    )
                  ) : (
                    `${dispatchStatusMap['COMPLETED']?.label || 'Selesai'} ➔`
                  )}
                </button>

                {/* Tombol Navigasi Langsung ke Google Maps App (Hanya Icon Navigation) */}
                {gmapsNavigationUrl && (
                  <a
                    href={gmapsNavigationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl text-sky-400 bg-sky-500/15 border border-sky-500/30 hover:bg-sky-500/25 active:scale-95 transition-all flex-shrink-0 flex items-center justify-center shadow-md"
                    title="Buka Navigasi Google Maps (Rute Personil ke TKP)"
                    aria-label="Buka Navigasi Google Maps"
                  >
                    <Navigation size={17} />
                  </a>
                )}
              </div>

              {/* Subtext Keterangan Kunci Radius & Tombol Simulasi Perjalanan */}
              {complaintStage === 'meluncur' && (
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5 px-1">
                  {!isWithin50Meters ? (
                    isSimulating ? (
                      <span className="flex items-center gap-1.5 text-sky-400 font-semibold animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping inline-block" />
                        Simulasi meluncur ({simulationProgress}%)
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-amber-400/80">
                        <Lock size={12} />
                        Dekati radius TKP (&lt; 50m) untuk konfirmasi tiba
                      </span>
                    )
                  ) : (
                    <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                      ✓ Tiba dalam radius TKP (&lt; 50m)
                    </span>
                  )}

                  {/* Tombol Simulasi Perjalanan Sesuai Permintaan */}
                  <button
                    id="btn-simulasi-meluncur"
                    data-testid="btn-simulasi-meluncur"
                    type="button"
                    onClick={handleToggleSimulation}
                    disabled={isLoadingRoute}
                    className={`text-[11px] font-semibold underline cursor-pointer transition-colors ${
                      isSimulating
                        ? 'text-rose-400 hover:text-rose-300'
                        : simulatedGps
                        ? 'text-slate-400 hover:text-amber-300'
                        : 'text-sky-400 hover:text-sky-300'
                    }`}
                  >
                    {isLoadingRoute
                      ? 'Menyiapkan rute...'
                      : isSimulating
                      ? 'Hentikan'
                      : simulatedGps
                      ? 'Reset Simulasi'
                      : 'Simulasi'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : activeGiat && patrolInfo ? (
        <>
          {/* ======================================================== */}
          {/* DRAWER BOTTOM: HUD GIAT PATROLI TAKTIS & ODOMETER KM     */}
          {/* ======================================================== */}
          <div
            id="patrol-bottom-drawer"
            className="absolute bottom-[74px] sm:bottom-[78px] md:bottom-6 left-3 right-3 sm:left-6 sm:right-6 md:left-6 md:right-auto md:w-[480px] max-w-xl md:max-w-none mx-auto md:mx-0 z-20 rounded-3xl backdrop-blur-2xl transition-all duration-300 ease-in-out select-none"
            style={{
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.97) 0%, rgba(10, 15, 28, 0.98) 100%)',
              border: '1.5px solid rgba(56, 189, 248, 0.4)',
              boxShadow: '0 16px 40px rgba(0, 0, 0, 0.85), 0 0 25px rgba(2, 132, 199, 0.2)',
            }}
          >
            {/* Draggable Handle Pill */}
            <div
              onClick={() => setIsPatrolDrawerExpanded((prev) => !prev)}
              className="w-full flex flex-col items-center justify-center pt-2.5 pb-1 cursor-pointer group"
            >
              <div className="w-12 h-1.5 rounded-full bg-white/25 group-hover:bg-sky-400/80 transition-colors" />
            </div>

            <div className="p-4 sm:p-5 pt-0.5 space-y-3">
              {/* Top Bar: Status Giat & Collapse Toggle */}
              <div className="flex items-center justify-between gap-2">
                <div
                  onClick={() => setIsPatrolDrawerExpanded((prev) => !prev)}
                  className="flex items-center gap-2 cursor-pointer min-w-0"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping flex-shrink-0" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 whitespace-nowrap">
                    GIAT LAPANGAN AKTIF
                  </span>
                  <span className="text-xs font-mono font-bold text-sky-400 whitespace-nowrap">
                    #LOG-{String(activeGiat.id).padStart(5, '0')}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsPatrolDrawerExpanded((prev) => !prev)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
                  title={isPatrolDrawerExpanded ? 'Perkecil Tampilan' : 'Perbesar Tampilan'}
                >
                  {isPatrolDrawerExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                </button>
              </div>

              {/* Minimized View: Just Odometer & Title */}
              {!isPatrolDrawerExpanded && (
                <div
                  onClick={() => setIsPatrolDrawerExpanded(true)}
                  className="flex items-center justify-between gap-3 pt-0.5 cursor-pointer"
                >
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold text-white truncate">
                      {patrolInfo.title}
                    </h3>
                    <p className="text-[10.5px] text-slate-400 truncate">
                      {patrolInfo.route}
                    </p>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-300 font-mono font-black text-xs shrink-0">
                    🛣️ {currentOdometerKm} KM
                  </div>
                </div>
              )}

              {/* Expanded Content: Detail, Odometer Display, & Action Buttons */}
              {isPatrolDrawerExpanded && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                  {/* Title & Route Sasaran */}
                  <div>
                    <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-1.5">
                      <span>{patrolInfo.icon}</span>
                      <span>{patrolInfo.title}</span>
                    </h2>
                    <div className="flex items-center gap-1 text-xs text-slate-300 mt-1">
                      <MapPin size={13} className="text-sky-400 flex-shrink-0" />
                      <span className="line-clamp-1">Sasaran: {patrolInfo.route}</span>
                    </div>
                    {patrolInfo.vehicle && (
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                        <Car size={13} className="text-emerald-400 flex-shrink-0" />
                        <span>{patrolInfo.vehicle}</span>
                      </div>
                    )}
                  </div>

                  {/* DIGITAL ODOMETER CARD (Sesuai Catatan User No. 1: Tanpa sisa waktu, hanya KM berjalan untuk klaim keuangan) */}
                  <div
                    className="rounded-2xl p-3 sm:p-4 text-center space-y-1 relative overflow-hidden"
                    style={{
                      background: 'linear-gradient(180deg, rgba(8, 47, 73, 0.4) 0%, rgba(15, 23, 42, 0.8) 100%)',
                      border: '1px solid rgba(56, 189, 248, 0.35)',
                    }}
                  >
                    <div className="text-[10px] font-black uppercase tracking-wider text-sky-400 flex items-center justify-center gap-1.5">
                      <TrendingUp size={13} />
                      <span>JARAK TEMPUH PATROLI (ODOMETER GPS)</span>
                    </div>

                    <div className="flex items-baseline justify-center gap-1.5 py-1">
                      <span className="text-3xl sm:text-4xl font-mono font-black text-white tracking-tight drop-shadow-md">
                        {currentOdometerKm}
                      </span>
                      <span className="text-sm font-bold text-sky-400 font-mono">
                        KM
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-400 font-medium flex items-center justify-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>Tercatat otomatis untuk klaim BBM Bag Log / Sikeu</span>
                    </div>
                  </div>

                  {/* DUA TOMBOL AKSI TAKTIS (Sesuai Catatan User No. 2: Tanpa tombol foto singgah) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {/* 1. Buka di Google Maps App */}
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                        patrolInfo.route || 'Polres Pekalongan'
                      )}&travelmode=driving`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 text-sky-200 bg-sky-500/15 border border-sky-500/30 hover:bg-sky-500/25 active:scale-95 transition-all text-center whitespace-nowrap"
                    >
                      <Navigation size={14} className="flex-shrink-0" />
                      <span>Buka Google Maps ↗</span>
                    </a>

                    {/* 2. Selesaikan Giat Patroli */}
                    <button
                      type="button"
                      onClick={() => setShowCompleteGiatModal(true)}
                      className="w-full py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 text-slate-950 active:scale-95 transition-all text-center shadow-lg whitespace-nowrap"
                      style={{
                        background: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)',
                        boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                      }}
                    >
                      <CheckCircle2 size={14} className="flex-shrink-0" />
                      <span>Selesaikan Giat Patroli</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* MODAL KONFIRMASI SELESAIKAN GIAT PATROLI */}
          {showCompleteGiatModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
              <div
                className="w-full max-w-md rounded-3xl p-5 sm:p-6 text-slate-100 shadow-2xl border space-y-4 animate-in zoom-in-95 duration-200"
                style={{
                  background: 'linear-gradient(180deg, #151821 0%, #0E1017 100%)',
                  borderColor: 'rgba(56, 189, 248, 0.4)',
                }}
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🏁</span>
                    <div>
                      <h3 className="text-sm font-black text-white">Selesaikan Giat Patroli</h3>
                      <p className="text-[11px] text-slate-400">#LOG-{String(activeGiat.id).padStart(5, '0')} • {patrolInfo.type}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCompleteGiatModal(false)}
                    className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Total KM Summary Box */}
                <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-center space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-sky-400">
                    AKUMULASI JARAK TEMPUH RIIL KLAIM SIKEU
                  </span>
                  <div className="text-3xl font-mono font-black text-white">
                    {currentOdometerKm} <span className="text-sm font-bold text-sky-400">KM</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Data ini akan dibukukan ke logbook dinas untuk verifikasi BBM Bag Log / Sikeu.
                  </p>
                </div>

                {/* Catatan / Resume Patroli */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    Catatan Hasil Patroli / Situasi Beat:
                  </label>
                  <textarea
                    rows={3}
                    value={patrolSummaryNote}
                    onChange={(e) => setPatrolSummaryNote(e.target.value)}
                    placeholder="Contoh: Patroli beat selesai dilaksanakan, situasi kamtibmas aman, tertib, dan kondusif."
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-900 border border-slate-700 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2.5 pt-2">
                  <button
                    type="button"
                    disabled={isSubmittingFinishGiat}
                    onClick={() => setShowCompleteGiatModal(false)}
                    className="flex-1 py-2.5 rounded-xl font-bold text-xs bg-slate-800 text-slate-300 hover:bg-slate-700 active:scale-95 transition-all"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    disabled={isSubmittingFinishGiat}
                    onClick={handleFinishGiatPatroli}
                    className="flex-1 py-2.5 rounded-xl font-black text-xs text-slate-950 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-1.5"
                    style={{
                      background: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)',
                      boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                    }}
                  >
                    {isSubmittingFinishGiat ? (
                      <span>Menyimpan...</span>
                    ) : (
                      <>
                        <CheckCircle2 size={15} />
                        <span>Kirim &amp; Kunci KM</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Status Siaga Patroli (Tanpa Penugasan Aktif) */
        <div
          className="absolute bottom-[74px] sm:bottom-[78px] left-3 right-3 sm:left-auto sm:right-6 sm:w-80 z-20 rounded-2xl p-4 backdrop-blur-xl"
          style={{
            background: 'rgba(15, 17, 24, 0.9)',
            border: '1px solid rgba(236, 196, 115, 0.25)',
          }}
        >
          <div className="flex items-center gap-3">
            <Shield size={20} className="text-amber-400" />
            <div>
              <div className="text-xs font-bold text-white">
                Siaga Patroli Wilayah
              </div>
              <div className="text-[11px] text-slate-400">
                Peta menampilkan posisi real-time unit Anda.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
