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
} from 'lucide-react';
import { getDistanceFromLatLonInMeters, formatPhoneNumber, getCleanCallNumber } from '../types';
import type { ComplaintData, OfficerProfile, DispatchStepAction } from '../types';

const SimapresLeafletMap = dynamic(() => import('@/components/SimapresLeafletMap'), {
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
  currentGps: { lat: number; lng: number };
  fleetUnits: any[];
  hotspots: any[];
  policeOffices: any[];
  dispatchStatuses?: any[];
  onOpenChat: (complaint: ComplaintData) => void;
  onOpenWizard: (complaint: ComplaintData) => void;
  onUpdateStep: (stepKey: DispatchStepAction) => Promise<void>;
  isUpdatingStep: boolean;
}

export default function TabMapsPersonil({
  officer,
  activeComplaint,
  currentGps,
  fleetUnits,
  hotspots,
  policeOffices,
  dispatchStatuses,
  onOpenChat,
  onOpenWizard,
  onUpdateStep,
  isUpdatingStep,
}: TabMapsPersonilProps) {
  const [showOtherOfficers, setShowOtherOfficers] = useState(true);
  const [showTraffic, setShowTraffic] = useState(true);
  const [showHotspots, setShowHotspots] = useState(true);
  const [showOverlayMenu, setShowOverlayMenu] = useState(false);

  // Bottom drawer draggable / minimizable state
  const [isDrawerExpanded, setIsDrawerExpanded] = useState(false);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  // Dev bypass for testing radius when remote / dev testing
  const [bypassDevRadius, setBypassDevRadius] = useState(false);

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
    if (!tkpCoords || !currentGps?.lat || !currentGps?.lng) return Infinity;
    return getDistanceFromLatLonInMeters(
      currentGps.lat,
      currentGps.lng,
      tkpCoords.lat,
      tkpCoords.lng
    );
  }, [tkpCoords, currentGps]);

  const isRealWithin50Meters = distanceToTkpMeters <= 50;
  const isWithin50Meters = isRealWithin50Meters || bypassDevRadius;

  const distanceFormatted = useMemo(() => {
    if (distanceToTkpMeters === Infinity) return '-';
    if (distanceToTkpMeters < 1000) return `${distanceToTkpMeters} M`;
    return `${(distanceToTkpMeters / 1000).toFixed(1)} KM`;
  }, [distanceToTkpMeters]);

  const etaMinutesText = useMemo(() => {
    if (distanceToTkpMeters === Infinity) return '-';
    // Asumsi kecepatan rata-rata respon darurat ~30 km/jam
    const minutes = Math.max(1, Math.round((distanceToTkpMeters / 1000 / 30) * 60));
    return `±${minutes} Menit`;
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

  // 4. Deteksi Tahap Tugas (Workflow Lifecycle Presisi berbasis MasterDispatchStatus):
  // - DISPATCHED: Persiapan / Berangkat
  // - DEPARTED: Meluncur ke TKP
  // - ARRIVED / REPORT_SUBMITTED: Tiba di TKP & Penanganan
  const complaintStage = useMemo<'persiapan' | 'meluncur' | 'tiba'>(() => {
    if (!isMissionActive) return 'persiapan';

    // Cek status pergerakan personil langsung dari relasi MasterDispatchStatus
    const officerDispatch = activeComplaint?.dispatches?.find(
      (d: any) =>
        (d.officer_id && (String(d.officer_id) === String(officer.id) || d.officer?.nrp === officer.nrp)) ||
        (d.officer?.user?.identifier === officer.nrp)
    ) || activeComplaint?.dispatches?.[0];

    const dispatchStatus = String(officerDispatch?.dispatch_status || officerDispatch?.dispatchStatus || '').toUpperCase();

    if (dispatchStatus === 'ARRIVED' || dispatchStatus === 'REPORT_SUBMITTED' || dispatchStatus === 'COMPLETED') {
      return 'tiba';
    }
    if (dispatchStatus === 'DEPARTED') {
      return 'meluncur';
    }

    // Fallback berdasarkan tahap numerik
    const tahap = Number(activeComplaint?.tahap) || 1;
    if (tahap >= 4 || activeComplaint?.status === 'MENUNGGU_PENGESAHAN') return 'tiba';
    if (tahap === 3) return 'meluncur';
    return 'persiapan';
  }, [isMissionActive, activeComplaint, officer.id, officer.nrp]);

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
  }, [isMissionActive, drawerHeight, isDrawerExpanded]);

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

  // Eksekusi Tombol Utama Sesuai Workflow Sekuensial MasterDispatchStatus
  const handleMainActionClick = async () => {
    if (!activeComplaint || isUpdatingStep) return;

    if (complaintStage === 'persiapan') {
      // Tahap 1: Personel Berangkat ke TKP (MasterDispatchStatus: DEPARTED)
      await onUpdateStep('DEPARTED');
    } else if (complaintStage === 'meluncur') {
      // Tahap 2: Konfirmasi Tiba di Lokasi (MasterDispatchStatus: ARRIVED)
      if (!isWithin50Meters) return;
      await onUpdateStep('ARRIVED');
    } else if (complaintStage === 'tiba') {
      // Tahap 3: Selesaikan Penanganan Tugas di Lapangan
      onOpenWizard(activeComplaint);
    }
  };

  // Memoize myUnit data agar tidak re-trigger render marker Google Maps di setiap frame
  const memoizedMyUnit = useMemo(() => ({
    key: `petugas_${officer.id || officer.nrp}`,
    nrp: officer.nrp,
    callsign: officer.nrp,
    petugas: officer.fullName,
    pangkat: officer.pangkat,
    title: `${officer.pangkat} ${officer.fullName}`,
    pos: { lat: currentGps.lat, lng: currentGps.lng },
    lat: currentGps.lat,
    lng: currentGps.lng,
  }), [officer.id, officer.nrp, officer.fullName, officer.pangkat, currentGps.lat, currentGps.lng]);

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
                <div className="flex items-center justify-around sm:justify-start gap-4 p-2.5 rounded-2xl bg-white/5 border border-white/10 flex-shrink-0">
                  <div className="text-center px-2">
                    <div className="text-[9px] font-bold text-slate-400 tracking-wider">JARAK GPS</div>
                    <div className="text-base sm:text-lg font-black text-amber-300">
                      {distanceFormatted}
                    </div>
                  </div>
                  <div className="w-px h-8 bg-white/10" />
                  <div className="text-center px-2">
                    <div className="text-[9px] font-bold text-slate-400 tracking-wider">ESTIMASI</div>
                    <div className="text-xs sm:text-sm font-bold text-slate-200">
                      {etaMinutesText}
                    </div>
                  </div>
                  <div className="w-px h-8 bg-white/10" />
                  <div className="text-center px-2">
                    <div className="text-[9px] font-bold text-slate-400 tracking-wider">STATUS</div>
                    <div className="text-xs font-bold" style={{ color: currentStatusStyle.color }}>
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
                  type="button"
                  disabled={
                    isUpdatingStep ||
                    (complaintStage === 'meluncur' && !isWithin50Meters)
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
              </div>

              {/* Subtext Keterangan Kunci Radius */}
              {complaintStage === 'meluncur' && !isWithin50Meters && (
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5 px-1">
                  <span className="flex items-center gap-1 text-amber-400/80">
                    <Lock size={12} />
                    Dekati radius TKP (&lt; 50m) untuk konfirmasi tiba
                  </span>
                  {/* Dev helper toggle untuk kemudahan testing lokal */}
                  <button
                    type="button"
                    onClick={() => setBypassDevRadius(!bypassDevRadius)}
                    className="text-[10px] text-slate-500 hover:text-amber-300 underline cursor-pointer"
                  >
                    {bypassDevRadius ? 'Reset Radius Riil' : 'Simulasi Radius Dev'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
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
