'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  Phone,
  MessageSquare,
  MapPin,
  Clock,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  Send,
  Star,
  Copy,
  Check,
  Shield,
  ArrowLeft,
  RefreshCw,
  ThumbsUp,
  X,
  ChevronDown,
  ChevronUp,
  Radio,
  Car,
  FileText,
  Search,
} from 'lucide-react';
import { submitRatingAction } from '@/app/actions/complaint.actions';
import {
  sendTicketChatMessageAction,
} from '@/app/actions/chat.actions';
import type { ChatMessageItem } from '@/types/chat.types';
import NameInitialAvatar from '@/components/ui/NameInitialAvatar';
import { formatIncidentDateTime } from '@/lib/date-utils';

const SimapresGoogleMap = dynamic(() => import('@/components/SimapresGoogleMap'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#090A0F',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ECC473',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      <div
        style={{
          width: '36px',
          height: '36px',
          border: '3px solid rgba(236,196,115,0.2)',
          borderTopColor: '#ECC473',
          borderRadius: '50%',
          animation: 'clt-spin 0.8s linear infinite',
        }}
      />
      <span style={{ fontSize: '12px', fontWeight: 700 }}>Memuat Peta Navigasi Taktis...</span>
    </div>
  ),
});

interface CitizenLiveRadarTrackerProps {
  nomorTiket: string;
  initialData?: any;
  onBack?: () => void;
  token?: string;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return Number((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1));
}

export default function CitizenLiveRadarTracker({ nomorTiket, initialData, onBack, token }: CitizenLiveRadarTrackerProps) {
  // ── State ──────────────────────────────────────────────────────────────────
  const [complaint, setComplaint] = useState<any>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [ticketNotFound, setTicketNotFound] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [copiedTicket, setCopiedTicket] = useState(false);

  // Drawer draggable / expandable state
  const [isDrawerExpanded, setIsDrawerExpanded] = useState(false);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const [drawerHeight, setDrawerHeight] = useState<number>(0);

  // Prevent background scroll when chat drawer is open
  useEffect(() => {
    if (isChatOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isChatOpen]);

  // Chat
  const [chatMessages, setChatMessages] = useState<ChatMessageItem[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Rating (Fase Selesai)
  const [starRating, setStarRating] = useState(5);
  const [hoverStar, setHoverStar] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>(['Respon Cepat', 'Personil Ramah']);
  const [reviewText, setReviewText] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingDone, setRatingDone] = useState(false);

  // ── Derived Status ─────────────────────────────────────────────────────────
  const isCompleted = useMemo(() => {
    if (!complaint) return false;
    const s = (complaint.status || '').toUpperCase();
    return s === 'SELESAI';
  }, [complaint]);

  const isAccepted = useMemo(() => {
    if (!complaint || isCompleted) return false;
    // An incident is only considered "Accepted" by an officer if:
    // 1. There is an accepted dispatch with an officer assigned, OR
    // 2. An officer is directly assigned to the complaint
    const dispatches: any[] = complaint.dispatches || [];
    const hasAcceptedDispatch = dispatches.some(
      (d: any) => Boolean((d.acceptedAt || d.accepted_at) && (d.officer || d.officer_id || d.officerId))
    );
    const hasAssignedOfficer = Boolean(
      complaint.assignedOfficer || complaint.assigned_officer_id || complaint.assignedOfficerId
    );
    return hasAcceptedDispatch || hasAssignedOfficer;
  }, [complaint, isCompleted]);

  const isArrived = useMemo(() => {
    if (!complaint || isCompleted || !isAccepted) return false;
    return (complaint.tahap && complaint.tahap >= 4)
      || !!(complaint.dispatches?.some((d: any) => d.arrivedAt || d.arrived_at || d.dispatch_status === 'ARRIVED'));
  }, [complaint, isCompleted, isAccepted]);

  const isMeluncur = useMemo(() => {
    if (!complaint || isCompleted || !isAccepted || isArrived) return false;
    if (complaint.tahap && complaint.tahap >= 3) return true;
    return !!(complaint.dispatches?.some((d: any) => (d.departedAt || d.departed_at || d.dispatch_status === 'DEPARTED') && !(d.arrivedAt || d.arrived_at)));
  }, [complaint, isCompleted, isAccepted, isArrived]);

  // Live clock for Gambar 2 sync & elapsed scan timer
  const [liveSyncTime, setLiveSyncTime] = useState('');
  const [scanSeconds, setScanSeconds] = useState(0);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const ss = String(now.getSeconds()).padStart(2, '0');
      setLiveSyncTime(`${hh}.${mm}.${ss}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!complaint) return;
    const computeElapsed = () => {
      const cTime = complaint.createdAt || complaint.created_at;
      if (cTime) {
        const diffSec = Math.max(0, Math.floor((Date.now() - new Date(cTime).getTime()) / 1000));
        setScanSeconds(diffSec);
      } else {
        setScanSeconds((prev) => prev + 1);
      }
    };
    computeElapsed();
    const interval = setInterval(computeElapsed, 1000);
    return () => clearInterval(interval);
  }, [complaint]);

  const formattedScanTime = useMemo(() => {
    const m = Math.floor(scanSeconds / 60);
    const s = scanSeconds % 60;
    return `${m}m ${s}s`;
  }, [scanSeconds]);

  // Expand drawer automatically when task finishes so citizen immediately sees resolution notes & rating
  useEffect(() => {
    if (isCompleted) {
      setIsDrawerExpanded(true);
    }
  }, [isCompleted]);

  // ── SERVER-SENT EVENTS (SSE) REAL-TIME STREAM ──────────────────────────────
  useEffect(() => {
    if (!nomorTiket) return;

    let es: EventSource | null = null;
    let isCancelled = false;

    try {
      const tokenQuery = token ? `&token=${encodeURIComponent(token)}` : '';
      es = new EventSource(`/api/tracking/stream?tiket=${encodeURIComponent(nomorTiket)}${tokenQuery}`);

      es.addEventListener('data', (event: MessageEvent) => {
        if (isCancelled) return;
        try {
          const payload = JSON.parse(event.data);
          if (payload.complaint) {
            setComplaint(payload.complaint);
            setTicketNotFound(false);
            setLoading(false);
          }
          if (payload.chatMessages) {
            setChatMessages(payload.chatMessages);
          }
        } catch (_) {}
      });

      es.addEventListener('not_found', () => {
        if (isCancelled) return;
        setTicketNotFound(true);
        setComplaint(null);
        setLoading(false);
      });

      es.onerror = () => {
        setLoading(false);
      };
    } catch (_) {
      const tokenQuery = token ? `&token=${encodeURIComponent(token)}` : '';
      fetch(`/api/tracking?tiket=${encodeURIComponent(nomorTiket)}${tokenQuery}`)
        .then((res) => res.json())
        .then((json) => {
          if (json?.data?.complaint) setComplaint(json.data.complaint);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }

    return () => {
      isCancelled = true;
      if (es) {
        es.close();
        es = null;
      }
    };
  }, [nomorTiket]);

  const assignedOfficer = useMemo(() => {
    if (!complaint) return null;
    if (complaint.assignedOfficer) return complaint.assignedOfficer;
    const dispatches: any[] = complaint.dispatches || [];
    const d = dispatches.find((x: any) => (x.acceptedAt || x.accepted_at) && x.officer);
    if (!d?.officer) return null;
    const o = d.officer;
    return {
      id: o.id,
      namaLengkap: o.user?.full_name || o.user?.nama_lengkap || 'Petugas Lapangan',
      rankPangkat: o.rank_pangkat || o.rankPangkat,
      jabatan: o.jabatan,
      assignedPatrolVehicle: o.assigned_patrol_vehicle || o.assignedPatrolVehicle,
      currentGpsLat: o.current_gps_lat || o.currentGpsLat,
      currentGpsLng: o.current_gps_lng || o.currentGpsLng,
      phoneNumber: o.user?.phone_number,
      avatarUrl: o.avatar_url,
      unitName: d.unit?.unit_name || d.unit?.unitName || 'Satuan Patroli',
    };
  }, [complaint]);

  // Real GPS coordinates (100% genuine telemetries without simulated offsets)
  const tkpLat = Number(complaint?.tkpLat || complaint?.tkp_lat || 0);
  const tkpLng = Number(complaint?.tkpLng || complaint?.tkp_lng || 0);
  const officerLat = Number(assignedOfficer?.currentGpsLat || 0);
  const officerLng = Number(assignedOfficer?.currentGpsLng || 0);

  const hasValidCoords = Boolean(tkpLat && tkpLng && officerLat && officerLng);
  const distanceKm = useMemo(
    () => (isMeluncur && !isArrived && hasValidCoords ? haversineKm(officerLat, officerLng, tkpLat, tkpLng) : 0),
    [isMeluncur, isArrived, hasValidCoords, officerLat, officerLng, tkpLat, tkpLng]
  );
  const etaMinutes = useMemo(
    () => (isMeluncur && !isArrived && distanceKm > 0 ? Math.max(1, Math.round((distanceKm / 35) * 60)) : 0),
    [isMeluncur, isArrived, distanceKm]
  );

  const distanceFormatted = useMemo(() => {
    if (!distanceKm) return '-';
    if (distanceKm < 1) return `${Math.round(distanceKm * 1000)} M`;
    return `${distanceKm} KM`;
  }, [distanceKm]);

  const mapUnit = useMemo(() => {
    if (!assignedOfficer || !officerLat || !officerLng) return null;
    return {
      key: `off_${assignedOfficer.id}`,
      pos: { lat: officerLat, lng: officerLng },
      iconEmoji: '🚓',
      title: `${assignedOfficer.rankPangkat || ''} ${assignedOfficer.namaLengkap}`,
      petugas: `${assignedOfficer.rankPangkat || ''} ${assignedOfficer.namaLengkap}`,
      pangkat: assignedOfficer.rankPangkat,
      namaLengkap: assignedOfficer.namaLengkap,
      satuan: assignedOfficer.unitName,
      jabatan: assignedOfficer.jabatan,
      sub: assignedOfficer.assignedPatrolVehicle || 'Mobil Patroli',
      status: isArrived ? 'ARRIVED' : isMeluncur ? 'DEPARTED' : 'STANDBY',
      statusLabel: isArrived ? 'Tiba di Lokasi' : isMeluncur ? 'Sedang Meluncur' : 'Bersiap',
      statusColor: isArrived ? '#3B82F6' : isMeluncur ? '#10B981' : '#F59E0B',
      tugas: 'Respon 110',
      telemetri: isArrived ? 'Di Lokasi TKP' : `${distanceKm} km · ~${etaMinutes} mnt`,
      assignedVehicle: assignedOfficer.assignedPatrolVehicle,
    };
  }, [assignedOfficer, officerLat, officerLng, distanceKm, etaMinutes, isMeluncur, isArrived]);

  const mapComplaint = useMemo(() => {
    if (!complaint || !tkpLat || !tkpLng) return null;
    return {
      id: complaint.id,
      nomorTiket: complaint.nomorTiket,
      jenisKejadian: complaint.jenisKejadian,
      tkpAlamatTeks: complaint.tkpAlamatTeks,
      tkpLat,
      tkpLng,
      status: isCompleted ? 'SELESAI' : 'DIPROSES',
    };
  }, [complaint, tkpLat, tkpLng, isCompleted]);

  // ── Auto scroll chat ───────────────────────────────────────────────────────
  useEffect(() => {
    if (isChatOpen) chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatOpen]);

  // ── Auto-close chat when completed ─
  useEffect(() => {
    if (isCompleted) {
      setIsChatOpen(false);
    }
  }, [isCompleted]);

  // ── Dynamic Drawer Height Measurement ──────────────────────────────────────
  useEffect(() => {
    if (!complaint) {
      setDrawerHeight(0);
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
  }, [complaint, isDrawerExpanded]);

  // Floating controls offset sits comfortably above bottom tactical drawer
  const controlsBottomOffset = useMemo(() => {
    const baseHeight = drawerHeight > 0
      ? drawerHeight
      : (isDrawerExpanded ? 400 : 135);
    return `${baseHeight + 20}px`;
  }, [drawerHeight, isDrawerExpanded]);

  // Touch gesture handlers for drawer swipe up / down
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY === null) return;
    const touchEndY = e.changedTouches[0].clientY;
    const diffY = touchEndY - touchStartY;
    if (diffY > 30) {
      // Swiped down -> collapse
      setIsDrawerExpanded(false);
    } else if (diffY < -30) {
      // Swiped up -> expand
      setIsDrawerExpanded(true);
    }
    setTouchStartY(null);
  };

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSendChat = async (e?: React.FormEvent, preset?: string) => {
    if (e) e.preventDefault();
    const text = (preset || chatInput).trim();
    if (!text || sendingChat || !nomorTiket) return;
    setSendingChat(true);
    const senderName = complaint?.pelaporNama || 'Warga';
    const optimistic: ChatMessageItem = { id: `opt_${Date.now()}`, senderRole: 'WARGA', senderName, text, timestamp: new Date().toISOString() };
    setChatMessages((prev) => [...prev, optimistic]);
    if (!preset) setChatInput('');
    try {
      const res = await sendTicketChatMessageAction({ complaintIdOrTiket: nomorTiket, senderRole: 'WARGA', senderName, text });
      if (res?.success && res.data) setChatMessages((prev) => prev.map((m) => m.id === optimistic.id ? res.data! : m));
    } catch (_) {}
    finally {
      setSendingChat(false);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomorTiket || submittingRating) return;
    setSubmittingRating(true);
    try {
      const res = await submitRatingAction({ nomorTiket, rating: starRating, review: reviewText.trim() || undefined, tags: selectedTags.join(', ') || undefined });
      if (res?.success) setRatingDone(true);
    } catch (_) {}
    finally { setSubmittingRating(false); }
  };

  const handleCopyTicket = () => {
    if (!nomorTiket) return;
    navigator.clipboard.writeText(nomorTiket);
    setCopiedTicket(true);
    setTimeout(() => setCopiedTicket(false), 2000);
  };

  const ratingLabels = ['', 'Sangat Kecewa', 'Kurang Puas', 'Cukup', 'Puas', 'Sangat Puas'];

  // ──────────────────────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div
      className={`fixed inset-0 z-40 w-full h-[100dvh] ${
        isCompleted || !isAccepted ? 'overflow-y-auto' : 'overflow-hidden'
      } flex flex-col bg-[#090A0F] select-none`}
      style={{
        color: '#F1F5F9',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        WebkitFontSmoothing: 'antialiased',
      }}
    >
      {/* ───────────────── GLOBAL KEYFRAMES ───────────────── */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes clt-spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
        @keyframes clt-radar { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
        @keyframes clt-pulse { 0%{transform:scale(1);opacity:1} 100%{transform:scale(4);opacity:0} }
        @keyframes clt-blip { 0%,100%{opacity:.12;transform:scale(.85)} 50%{opacity:1;transform:scale(1.2)} }
        @keyframes clt-fadein { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes clt-live { 0%,100%{opacity:1} 50%{opacity:.35} }
        @keyframes clt-drawer-backdrop { from{opacity:0} to{opacity:1} }
        @keyframes clt-drawer-slide { from{transform:translateY(100%)} to{transform:translateY(0)} }
      ` }} />

      {/* ───────────────── LOADING OVERLAY ───────────────── */}
      {loading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#090A0F]/90 backdrop-blur-md gap-4">
          <div style={{ width: '48px', height: '48px', border: '3.5px solid rgba(236,196,115,0.18)', borderTopColor: '#ECC473', borderRadius: '50%', animation: 'clt-spin 0.9s linear infinite' }} />
          <div className="text-center">
            <div className="text-base font-extrabold text-white mb-1">Menghubungkan ke Pusat Komando SIMOPMAS 110...</div>
            <div className="text-xs text-slate-400">Tiket: <span className="text-amber-400 font-mono font-bold">{nomorTiket}</span></div>
          </div>
        </div>
      )}

      {/* ───────────────── TIKET TIDAK DITEMUKAN ───────────────── */}
      {!loading && ticketNotFound && !complaint && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#090A0F] p-6 text-center animate-in fade-in duration-300">
          <div className="text-5xl mb-4">🔍</div>
          <h2 className="text-lg font-black text-white mb-2">Tiket Tidak Ditemukan</h2>
          <p className="text-sm text-slate-400 max-w-xs leading-relaxed mb-6">
            Nomor <strong className="text-amber-400 font-mono">{nomorTiket}</strong> tidak ditemukan dalam sistem. Pastikan nomor tiket yang tertera pada bukti pelaporan Anda sudah benar.
          </p>
          <button
            type="button"
            onClick={onBack || (() => window.location.href = '/tracking')}
            className="bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-sm px-6 py-3 rounded-xl shadow-lg active:scale-95 transition-all cursor-pointer"
          >
            Cari Nomor Tiket Lain
          </button>
        </div>
      )}

      {/* ───────────────── MAIN VIEW ───────────────── */}
      {!loading && complaint && (
        isCompleted ? (
          <>
            <CompletedIndependentView
              complaint={complaint}
              officer={assignedOfficer}
              nomorTiket={nomorTiket}
              starRating={starRating}
              hoverStar={hoverStar}
              selectedTags={selectedTags}
              reviewText={reviewText}
              submitting={submittingRating}
              done={ratingDone}
              ratingLabels={ratingLabels}
              onStarSet={setStarRating}
              onStarHover={setHoverStar}
              onTagToggle={(t: string) =>
                setSelectedTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))
              }
              onReviewChange={setReviewText}
              onSubmit={handleSubmitRating}
              onBack={onBack}
              onCopyTicket={handleCopyTicket}
              copiedTicket={copiedTicket}
              chatMessages={chatMessages}
              onOpenChat={() => setIsChatOpen(true)}
              mapComplaint={mapComplaint}
            />

            {/* Chat Bottom Drawer Overlay if citizen opens past chat */}
            {isChatOpen && (
              <ChatBottomDrawer
                officer={assignedOfficer}
                messages={chatMessages}
                input={chatInput}
                sending={sendingChat}
                onInputChange={setChatInput}
                onSend={handleSendChat}
                onClose={() => setIsChatOpen(false)}
                chatEndRef={chatEndRef}
              />
            )}
          </>
        ) : !isAccepted ? (
          <RadarSearchingFullScreenView
            complaint={complaint}
            nomorTiket={nomorTiket}
            onBack={onBack}
            liveSyncTime={liveSyncTime}
            formattedScanTime={formattedScanTime}
            onCopyTicket={handleCopyTicket}
            copiedTicket={copiedTicket}
          />
        ) : (
          <>
            {/* 1. INTERACTIVE FULL-SCREEN GOOGLE MAP BACKDROP */}
            <div className="absolute inset-0 z-0 w-full h-full">
              <SimapresGoogleMap
                mode="fullscreen"
                height="100%"
                targetComplaint={mapComplaint}
                myUnit={mapUnit}
                showTraffic={true}
                showOtherOfficers={false}
                controlsPosition="bottom-right"
                controlsBottomOffset={controlsBottomOffset}
                controlsRightOffset="16px"
              />
            </div>

            {/* 2. TOP FLOATING PILL HEADER */}
            <div
              className="absolute top-2.5 sm:top-4 left-2.5 right-2.5 sm:left-6 sm:right-6 max-w-xl mx-auto z-20 flex items-center justify-between rounded-2xl backdrop-blur-xl px-3.5 sm:px-4 py-2 sm:py-2.5 shadow-2xl transition-all pointer-events-auto"
              style={{
                background: 'rgba(15, 17, 24, 0.92)',
                border: '1.5px solid rgba(236, 196, 115, 0.28)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.7), 0 0 15px rgba(236,196,115,0.08)',
              }}
            >
              {/* Left: Brand SIMOPMAS 110 */}
              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                <div
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, #ECC473 0%, #C99635 100%)',
                    boxShadow: '0 2px 8px rgba(201,150,53,0.3)',
                  }}
                >
                  <Shield size={15} className="text-[#0A0D14]" />
                </div>
                <div className="leading-tight">
                  <div className="text-xs sm:text-sm font-black text-white tracking-wide whitespace-nowrap">
                    SIMOPMAS 110
                  </div>
                  <div className="text-[9px] sm:text-[10px] text-slate-400 font-medium hidden sm:block whitespace-nowrap">
                    Sistem Monitoring Polisi Bersama Masyarakat
                  </div>
                </div>
              </div>

              {/* Right: Live Pulsating Status Pill */}
              <div
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider flex-shrink-0 whitespace-nowrap"
                style={{
                  background: isArrived
                    ? 'rgba(59,130,246,0.18)'
                    : isMeluncur
                    ? 'rgba(16,185,129,0.18)'
                    : 'rgba(245,158,11,0.18)',
                  border: `1px solid ${
                    isArrived
                      ? 'rgba(59,130,246,0.45)'
                      : isMeluncur
                      ? 'rgba(16,185,129,0.45)'
                      : 'rgba(245,158,11,0.45)'
                  }`,
                  color: isArrived ? '#60A5FA' : isMeluncur ? '#34D399' : '#FBBF24',
                }}
              >
                <span
                  className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full flex-shrink-0"
                  style={{
                    background: isArrived ? '#3B82F6' : isMeluncur ? '#10B981' : '#F59E0B',
                    boxShadow: `0 0 6px ${isArrived ? '#3B82F6' : isMeluncur ? '#10B981' : '#F59E0B'}`,
                    animation: 'clt-live 1.2s infinite',
                  }}
                />
                <span>
                  {isArrived
                    ? 'Tiba di TKP'
                    : isMeluncur
                    ? 'Meluncur'
                    : isAccepted
                    ? 'Siaga'
                    : 'Mencari'}
                </span>
              </div>
            </div>

            {/* 3. BOTTOM TACTICAL DRAGGABLE DRAWER */}
            <div
              ref={drawerRef}
              id="tactical-bottom-drawer"
              className="absolute bottom-3 sm:bottom-6 left-3.5 right-3.5 sm:left-6 sm:right-auto sm:w-[460px] md:w-[480px] max-w-xl mx-auto sm:mx-0 z-20 rounded-3xl backdrop-blur-2xl transition-all duration-300 ease-in-out select-none"
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

              <div className="p-4 sm:p-5 pt-0.5 space-y-3">
                {/* Drawer Top Header (Always Visible) */}
                <div className="flex items-center justify-between gap-2">
                  <div
                    onClick={() => setIsDrawerExpanded((prev) => !prev)}
                    className="flex items-center gap-2 cursor-pointer min-w-0"
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{
                        background: isArrived ? '#3B82F6' : isMeluncur ? '#10B981' : '#F59E0B',
                        boxShadow: `0 0 6px ${isArrived ? '#3B82F6' : isMeluncur ? '#10B981' : '#F59E0B'}`,
                        animation: 'clt-live 1.2s infinite',
                      }}
                    />
                    <Navigation size={13} className="text-amber-400 stroke-[2.5] flex-shrink-0" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 whitespace-nowrap">
                      {isArrived
                        ? 'PETUGAS DI LOKASI TKP'
                        : isMeluncur
                        ? 'PETUGAS MENUJU LOKASI'
                        : isAccepted
                        ? 'PETUGAS BERSIAP BERANGKAT'
                        : 'MENCARI PETUGAS TERDEKAT'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Distance & ETA pill ONLY when actively meluncur / en-route (NOT when arrived) */}
                    {isMeluncur && !isArrived && distanceKm > 0 && (
                      <span className="text-[10px] font-mono font-bold text-amber-200 bg-amber-500/10 border border-amber-500/25 px-2.5 py-0.5 rounded-full shadow-sm">
                        {distanceFormatted} • ±{etaMinutes} Mnt
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => setIsDrawerExpanded((prev) => !prev)}
                      className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                      title={isDrawerExpanded ? 'Perkecil Tampilan' : 'Perbesar Tampilan'}
                    >
                      {isDrawerExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                    </button>
                  </div>
                </div>

                {isAccepted ? (
                /* ─── CASE B: PETUGAS DITUGASKAN (OfficerCard + Actions + Expandable Incident Details) ─── */
                <div className="space-y-3">
                  {/* Officer Row & Action Buttons */}
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <NameInitialAvatar
                      name={assignedOfficer?.namaLengkap}
                      avatarUrl={assignedOfficer?.avatarUrl}
                      size={48}
                      showOnlineDot={true}
                      statusColor={isArrived ? '#3B82F6' : isMeluncur ? '#10B981' : '#F59E0B'}
                      variant="gold"
                    />

                    {/* Officer Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="bg-amber-500/15 text-amber-300 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                          {assignedOfficer?.rankPangkat || 'POLRI'}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-bold">● Aktif</span>
                      </div>
                      <div className="text-sm font-extrabold text-white truncate">
                        {assignedOfficer?.namaLengkap || 'Petugas Lapangan'}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        🛡️ {assignedOfficer?.unitName || '110 Patroli'}
                        {assignedOfficer?.assignedPatrolVehicle && ` · 🚘 ${assignedOfficer.assignedPatrolVehicle}`}
                      </div>
                    </div>
                  </div>

                  {/* Quick Action Buttons (Telepon & Chat) */}
                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                    <a
                      href={assignedOfficer?.phoneNumber ? `tel:${assignedOfficer.phoneNumber}` : 'tel:110'}
                      className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-black text-xs text-slate-950 transition-all active:scale-95 shadow-md"
                      style={{
                        background: 'linear-gradient(135deg, #ECC473 0%, #C99635 100%)',
                      }}
                    >
                      <Phone size={14} />
                      <span>{assignedOfficer?.phoneNumber ? 'Telepon Petugas' : 'Hotline 110'}</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => setIsChatOpen(true)}
                      className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-black text-xs text-amber-300 border border-amber-400/40 bg-amber-400/10 hover:bg-amber-400/20 transition-all active:scale-95 relative"
                    >
                      <MessageSquare size={14} />
                      <span>Chat Petugas</span>
                      {chatMessages.length > 0 && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      )}
                    </button>
                  </div>

                  {/* Expanded Incident Information */}
                  {isDrawerExpanded && (
                    <div
                      className="space-y-3 pt-2 max-h-[38vh] sm:max-h-[42vh] overflow-y-auto pr-1 animate-in fade-in duration-200 border-t border-white/10"
                      style={{
                        scrollbarWidth: 'thin',
                        scrollbarColor: 'rgba(236, 196, 115, 0.3) transparent',
                      }}
                    >
                      {/* Incident Details Card */}
                      <div className="bg-black/30 rounded-2xl p-3.5 border border-white/5 space-y-2">
                        {/* Ticket Number Row */}
                        <div className="flex items-center justify-between pb-2 border-b border-white/5">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              Nomor Tiket
                            </span>
                            <span className="text-xs font-mono font-bold text-amber-300">
                              {nomorTiket.replace(/^#/, '')}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={handleCopyTicket}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition-all active:scale-95"
                            title="Salin Nomor Tiket"
                          >
                            {copiedTicket ? (
                              <>
                                <Check size={11} className="text-emerald-400" />
                                <span className="text-emerald-400">Tersalin</span>
                              </>
                            ) : (
                              <>
                                <Copy size={10} className="text-amber-400" />
                                <span>Salin</span>
                              </>
                            )}
                          </button>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Kategori Kejadian
                          </span>
                          <span className="text-xs font-black text-amber-300">
                            {complaint.jenisKejadian || 'Darurat 110'}
                          </span>
                        </div>

                        <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                            <MapPin size={11} className="text-amber-400" />
                            <span>Titik Lokasi (TKP)</span>
                          </div>
                          <div className="text-xs text-slate-200 leading-relaxed font-medium">
                            {complaint.tkpAlamatTeks || '-'}
                          </div>
                        </div>

                        {complaint.ringkasanKeterangan && (
                          <div className="pt-1 border-t border-white/5">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                              Keterangan Pelapor
                            </div>
                            <div className="text-xs text-slate-300 italic">
                              "{complaint.ringkasanKeterangan}"
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Safety Advice Box */}
                      <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-3 flex items-start gap-2.5">
                        <AlertTriangle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
                        <div className="text-xs text-amber-200/90 leading-relaxed">
                          Tetap berada di lokasi aman. Pastikan ponsel Anda aktif agar personel dapat menghubungi jika memerlukan konfirmasi patokan lokasi.
                        </div>
                      </div>

                      {/* Hotline Button */}
                      <a
                        href="tel:110"
                        className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-bold hover:bg-red-500/20 transition-colors"
                      >
                        <Phone size={13} />
                        <span>Pusat Bantuan Darurat Hotline 110</span>
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                /* ─── CASE C: MENCARI PETUGAS (RadarSearchingCard) ─── */
                <div className="space-y-3">
                  {!isDrawerExpanded ? (
                    <div
                      onClick={() => setIsDrawerExpanded(true)}
                      className="cursor-pointer bg-amber-500/10 border border-amber-500/25 rounded-2xl p-3 flex items-center justify-between gap-3 hover:bg-amber-500/15 transition-all"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-amber-400/20 flex items-center justify-center text-amber-300">
                          <Radio size={16} className="animate-pulse" />
                        </div>
                        <div>
                          <div className="text-xs font-black text-white">Sistem Menghubungi Personil Terdekat</div>
                          <div className="text-[11px] text-slate-400">Armada patroli sedang memverifikasi penugasan</div>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-amber-300 underline whitespace-nowrap">Detail</span>
                    </div>
                  ) : (
                    <div
                      className="space-y-3 max-h-[45vh] overflow-y-auto pr-1 animate-in fade-in duration-200"
                      style={{
                        scrollbarWidth: 'thin',
                        scrollbarColor: 'rgba(236, 196, 115, 0.3) transparent',
                      }}
                    >
                      <RadarSearchingCard complaint={complaint} />

                      <a
                        href="tel:110"
                        className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-bold hover:bg-red-500/20 transition-colors"
                      >
                        <Phone size={13} />
                        <span>Hotline Darurat 110</span>
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 4. CHAT BOTTOM DRAWER OVERLAY */}
          {isChatOpen && (
            <ChatBottomDrawer
              officer={assignedOfficer}
              messages={chatMessages}
              input={chatInput}
              sending={sendingChat}
              onInputChange={setChatInput}
              onSend={handleSendChat}
              onClose={() => setIsChatOpen(false)}
              chatEndRef={chatEndRef}
            />
          )}
        </>
      )
    )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ══════════════════════════════════════════════════════════════════════════════

function RadarSearchingFullScreenView({
  complaint,
  nomorTiket,
  onBack,
  liveSyncTime,
  formattedScanTime,
  onCopyTicket,
  copiedTicket,
}: {
  complaint: any;
  nomorTiket: string;
  onBack?: () => void;
  liveSyncTime: string;
  formattedScanTime: string;
  onCopyTicket: () => void;
  copiedTicket: boolean;
}) {
  return (
    <div
      className="w-full min-h-[100dvh] flex flex-col bg-[#090A0F] animate-in fade-in duration-300"
      style={{
        backgroundImage:
          'radial-gradient(ellipse at 50% 10%, rgba(236,196,115,0.08) 0%, transparent 60%)',
      }}
    >
      {/* ─── 1. TOP HEADER ─── */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 30,
          background: 'rgba(10, 13, 20, 0.94)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(236,196,115,0.18)',
          padding: '12px 16px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.6)',
        }}
      >
        <div className="max-w-xl mx-auto flex items-center gap-2.5">
          {/* Brand Left */}
          <div
            style={{
              width: '32px',
              height: '32px',
              background: 'linear-gradient(135deg, #ECC473 0%, #C99635 100%)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 2px 10px rgba(201,150,53,0.35)',
            }}
          >
            <div
              style={{
                width: '16px',
                height: '16px',
                background: '#0A0D14',
                clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
              }}
            />
          </div>
          <div>
            <div className="text-xs sm:text-sm font-black text-white tracking-wide">
              SIMOPMAS 110
            </div>
            <div className="text-[9.5px] sm:text-[10.5px] text-slate-400 font-medium">
              Sistem Pemantauan Taktis Kepolisian & Warga
            </div>
          </div>
        </div>
      </header>

      {/* ─── 2. CARD 1: RADAR SCANNING CARD ─── */}
      <div className="max-w-xl mx-auto w-full px-4 pt-4 pb-2">
        <div
          className="rounded-[28px] p-5 sm:p-6 text-center relative overflow-hidden backdrop-blur-xl"
          style={{
            background:
              'linear-gradient(180deg, rgba(18, 22, 32, 0.95) 0%, rgba(10, 12, 18, 0.98) 100%)',
            border: '1.5px solid rgba(236, 196, 115, 0.22)',
            boxShadow:
              '0 16px 48px rgba(0,0,0,0.8), 0 0 30px rgba(236,196,115,0.05)',
          }}
        >
          {/* Top Status Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-black uppercase tracking-wider mb-3.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_#F59E0B]" />
            <span>MENCARI PETUGAS TERDEKAT</span>
          </div>

          {/* Heading */}
          <h1 className="text-base sm:text-lg font-black text-white uppercase tracking-tight leading-snug mb-2">
            MOHON TUNGGU KAMI SEDANG MENCARI PETUGAS TERDEKAT...
          </h1>

          {/* Subtitle */}
          <p className="text-xs sm:text-[13px] text-slate-400 leading-relaxed max-w-sm mx-auto mb-6">
            Sinyal darurat disiarkan secara serentak ke seluruh armada patroli Presisi di sekitar wilayah Anda.
          </p>

          {/* Big Radar Graphic */}
          <div
            style={{
              position: 'relative',
              width: '260px',
              height: '260px',
              margin: '0 auto',
              borderRadius: '50%',
              background: 'radial-gradient(circle, #161C2A 0%, #080A10 100%)',
              border: '1.5px solid rgba(236,196,115,0.35)',
              boxShadow:
                '0 0 35px rgba(236,196,115,0.1), inset 0 0 30px rgba(0,0,0,0.85)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Concentric Rings */}
            {[30, 56, 82].map((s, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  width: `${s}%`,
                  height: `${s}%`,
                  borderRadius: '50%',
                  border: `1px solid rgba(236,196,115,${i === 0 ? 0.2 : 0.12})`,
                  borderStyle: i === 0 ? 'dashed' : 'solid',
                }}
              />
            ))}

            {/* Crosshairs */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: '50%',
                height: '1px',
                background: 'rgba(236,196,115,0.14)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: '50%',
                width: '1px',
                background: 'rgba(236,196,115,0.14)',
              }}
            />

            {/* Sweeping Conic Beam */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                background:
                  'conic-gradient(from 0deg, rgba(236,196,115,0.45) 0deg, rgba(201,150,53,0.1) 45deg, transparent 80deg)',
                animation: 'clt-radar 3s linear infinite',
              }}
            />

            {/* Patrol Car Blips */}
            {[
              { top: '24%', left: '68%', delay: '0s', label: '🚓' },
              { top: '65%', left: '22%', delay: '1.2s', label: '🚓' },
              { top: '68%', left: '70%', delay: '0.6s', label: '🚓' },
              { top: '32%', left: '38%', delay: '1.8s', label: '🚓' },
            ].map((b, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  top: b.top,
                  left: b.left,
                  fontSize: '15px',
                  filter: 'drop-shadow(0 0 6px #ECC473)',
                  animation: `clt-blip ${3.4 + i * 0.4}s ease-in-out ${b.delay} infinite`,
                }}
              >
                {b.label}
              </div>
            ))}

            {/* Center Target Point */}
            <div
              style={{
                position: 'relative',
                zIndex: 10,
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                background: '#ECC473',
                boxShadow: '0 0 16px #ECC473',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  border: '2px solid #ECC473',
                  animation: 'clt-pulse 2s ease-out infinite',
                }}
              />
            </div>
          </div>

          {/* Stats Strip below Radar */}
          <div
            className="grid grid-cols-3 divide-x divide-white/10 rounded-2xl mt-6 py-3 px-2"
            style={{
              background: 'rgba(8, 10, 16, 0.75)',
              border: '1px solid rgba(236, 196, 115, 0.15)',
            }}
          >
            <div className="text-center px-1">
              <div className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                WAKTU PEMINDAIAN
              </div>
              <div className="text-xs sm:text-sm font-black font-mono text-[#ECC473]">
                {formattedScanTime}
              </div>
            </div>
            <div className="text-center px-1">
              <div className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                FREKUENSI CAD
              </div>
              <div className="text-xs sm:text-sm font-black font-mono text-white">
                110.85 MHz
              </div>
            </div>
            <div className="text-center px-1">
              <div className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                RADIUS SEKTOR
              </div>
              <div className="text-xs sm:text-sm font-black font-mono text-white">
                5.0 KM
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 4. CARD 2: INFORMASI TIKET LAPORAN ─── */}
      <div className="max-w-xl mx-auto w-full px-4 pt-2 pb-10">
        <div
          className="rounded-[28px] p-5 relative overflow-hidden backdrop-blur-xl"
          style={{
            background:
              'linear-gradient(180deg, rgba(18, 22, 32, 0.95) 0%, rgba(10, 12, 18, 0.98) 100%)',
            border: '1.5px solid rgba(236, 196, 115, 0.22)',
            boxShadow: '0 12px 36px rgba(0,0,0,0.7)',
          }}
        >
          {/* Card Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
            <div className="text-xs font-black tracking-wider text-amber-400 uppercase">
              INFORMASI TIKET LAPORAN
            </div>
            <span className="text-[10px] font-bold text-slate-300 bg-slate-800/90 px-2.5 py-0.5 rounded-full border border-slate-700/60">
              Baru Saja
            </span>
          </div>

          {/* Rows */}
          <div className="space-y-3.5 text-left">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                Nomor Tiket Resmi
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm sm:text-base font-black font-mono text-[#ECC473]">
                  {nomorTiket}
                </span>
                <button
                  type="button"
                  onClick={onCopyTicket}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-amber-300 bg-amber-400/10 border border-amber-400/30 hover:bg-amber-400/20 active:scale-95 transition-all cursor-pointer"
                >
                  {copiedTicket ? (
                    <Check size={12} className="text-emerald-400" />
                  ) : (
                    <Copy size={12} />
                  )}
                  <span>{copiedTicket ? 'Tersalin' : 'Salin'}</span>
                </button>
              </div>
            </div>

            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                Kategori / Jenis Kejadian
              </div>
              <div className="text-xs sm:text-sm font-extrabold text-white">
                {complaint.jenisKejadian ||
                  complaint.kategori ||
                  'Laporan Pengaduan Masyarakat'}
              </div>
            </div>

            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                <MapPin size={11} className="text-amber-400" />
                <span>Titik Lokasi (TKP)</span>
              </div>
              <div className="text-xs text-slate-300 leading-relaxed font-medium">
                {complaint.tkpAlamatTeks || complaint.lokasi || '-'}
              </div>
            </div>

            {/* Hotline Call Button */}
            <div className="pt-2 border-t border-white/10">
              <a
                href="tel:110"
                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-black hover:bg-red-500/20 active:scale-95 transition-all shadow-md"
              >
                <Phone size={14} />
                <span>Pusat Bantuan Darurat Hotline 110</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RadarSearchingCard({ complaint }: any) {
  return (
    <div className="bg-black/40 border border-amber-500/20 rounded-2xl p-4 text-center">
      {/* Radar Graphic */}
      <div
        style={{
          position: 'relative',
          width: '160px',
          height: '160px',
          margin: '0 auto 16px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, #151924 0%, #090B10 100%)',
          border: '1.5px solid rgba(236,196,115,0.35)',
          boxShadow: '0 0 30px rgba(236,196,115,0.1), inset 0 0 25px rgba(0,0,0,0.8)',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Rings */}
        {[33, 66, 92].map((s, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: `${s}%`,
              height: `${s}%`,
              borderRadius: '50%',
              border: `1px solid rgba(236,196,115,${i === 0 ? 0.15 : 0.12})`,
              borderStyle: i === 0 ? 'dashed' : 'solid',
            }}
          />
        ))}
        {/* Crosshairs */}
        <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: '1px', background: 'rgba(236,196,115,0.12)' }} />
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: '1px', background: 'rgba(236,196,115,0.12)' }} />
        {/* Beam */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: 'conic-gradient(from 0deg, rgba(236,196,115,0.45) 0deg, rgba(201,150,53,0.1) 45deg, transparent 80deg)',
            animation: 'clt-radar 3s linear infinite',
          }}
        />
        {/* Blips */}
        {[{ top: '25%', left: '68%', delay: '0s' }, { top: '65%', left: '20%', delay: '1.1s' }, { top: '70%', left: '72%', delay: '.6s' }].map((b, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: b.top,
              left: b.left,
              fontSize: '14px',
              filter: 'drop-shadow(0 0 6px #ECC473)',
              animation: `clt-blip ${3.6 + i * 0.4}s ease-in-out ${b.delay} infinite`,
            }}
          >
            🚓
          </div>
        ))}
        {/* Center */}
        <div style={{ position: 'relative', zIndex: 10, width: '14px', height: '14px', borderRadius: '50%', background: '#ECC473', boxShadow: '0 0 14px #ECC473' }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid #ECC473', animation: 'clt-pulse 2s ease-out infinite' }} />
        </div>
      </div>

      <h3 className="text-sm font-black text-white mb-1">
        Mencari Petugas Terdekat di Radius Anda
      </h3>
      <p className="text-xs text-slate-400 mb-3.5 leading-relaxed">
        Laporan disiarkan ke seluruh armada patroli 110 di sekitar TKP. Petugas pertama yang merespons akan segera meluncur.
      </p>

      {/* Steps */}
      <div className="space-y-2 text-left bg-black/30 rounded-xl p-3 text-xs">
        {[
          { icon: <CheckCircle2 size={13} className="text-emerald-400" />, text: 'Laporan diterima & terverifikasi sistem 110', active: true },
          { icon: <div className="w-3 h-3 rounded-full border-2 border-amber-400 animate-pulse" />, text: 'Mencari personil terdekat...', active: true },
          { icon: <div className="w-3 h-3 rounded-full border border-slate-600" />, text: 'Personil menerima tugas & meluncur', active: false },
          { icon: <div className="w-3 h-3 rounded-full border border-slate-600" />, text: 'Penanganan di lokasi kejadian', active: false },
        ].map((s, i) => (
          <div key={i} className={`flex items-center gap-2 ${s.active ? 'text-slate-200' : 'text-slate-500'}`}>
            {s.icon}
            <span>{s.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CompletedIndependentView({
  complaint,
  officer,
  nomorTiket,
  starRating,
  hoverStar,
  selectedTags,
  reviewText,
  submitting,
  done,
  ratingLabels,
  onStarSet,
  onStarHover,
  onTagToggle,
  onReviewChange,
  onSubmit,
  onBack,
  onCopyTicket,
  copiedTicket,
  chatMessages,
  onOpenChat,
  mapComplaint,
}: any) {
  const [showMapPreview, setShowMapPreview] = useState(false);

  const cleanTiket = (nomorTiket || complaint?.nomorTiket || '').replace(/^#/, '');
  const catatanFinal =
    complaint?.catatanSelesai ||
    complaint?.catatan_selesai ||
    complaint?.catatanTindakan ||
    'Situasi TKP telah aman dan kondusif.';

  const formattedWaktuLaporan = useMemo(() => {
    return formatIncidentDateTime(complaint?.waktuLaporan || complaint?.createdAt).full;
  }, [complaint]);

  const hasValidTkp = Boolean(complaint?.tkpLat && complaint?.tkpLng);

  return (
    <div
      className="w-full min-h-[100dvh] bg-[#090A0F] text-[#F1F5F9] flex flex-col relative"
      style={{
        backgroundImage:
          'radial-gradient(ellipse at 50% -5%, rgba(236,196,115,0.14) 0%, transparent 60%), radial-gradient(ellipse at 50% 100%, rgba(59,130,246,0.06) 0%, transparent 60%)',
      }}
    >
      {/* 1. TOP STICKY HEADER */}
      <header className="sticky top-0 z-30 w-full border-b border-amber-500/20 bg-[#0F1118]/92 backdrop-blur-xl px-4 py-3 sm:px-6 shadow-xl">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
          {/* Brand SIMOPMAS 110 */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md"
              style={{
                background: 'linear-gradient(135deg, #ECC473 0%, #C99635 100%)',
              }}
            >
              <Shield size={16} className="text-[#0A0D14]" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-black text-white tracking-wide whitespace-nowrap">
                SIMOPMAS 110
              </div>
              <div className="text-[10px] text-slate-400 font-medium hidden sm:block whitespace-nowrap">
                Sistem Monitoring Polisi Bersama Masyarakat
              </div>
            </div>
          </div>

          {/* Independent Step Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-blue-500/15 border border-blue-500/40 text-blue-400 shadow-sm flex-shrink-0">
            <CheckCircle2 size={13} className="text-blue-400 stroke-[2.5]" />
            <span>SELESAI</span>
          </div>
        </div>
      </header>

      {/* 2. MAIN SCROLLABLE RESOLUTION CONTENT */}
      <main className="flex-1 w-full max-w-xl mx-auto px-4 py-5 sm:py-7 space-y-4 sm:space-y-5 pb-16">
        {/* Step Indicator Progress (Visualizing Independent Completion Step) */}
        <div className="bg-[#121621] border border-white/10 rounded-2xl p-3 shadow-md">
          <div className="flex items-center justify-between text-[11px] font-black text-slate-400 px-1 mb-2">
            <span className="text-emerald-400">✓ 1. Laporan</span>
            <span className="text-emerald-400">✓ 2. Meluncur</span>
            <span className="text-emerald-400">✓ 3. Tiba di TKP</span>
            <span className="text-amber-400 font-black">● 4. Selesai</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden flex">
            <div className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-amber-500 w-full" />
          </div>
        </div>

        {/* Hero Card: Penanganan Selesai */}
        <div className="text-center space-y-2 pt-1 pb-1">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-br from-emerald-500/20 via-blue-500/10 to-amber-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-[0_0_35px_rgba(16,185,129,0.25)]">
            <CheckCircle2 size={36} className="text-emerald-400 sm:w-10 sm:h-10" />
          </div>
          <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
            Penanganan Kasus Selesai
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
            Petugas telah menyelesaikan tindakan di lokasi TKP. Situasi dilaporkan telah aman dan kondusif.
          </p>
        </div>

        {/* Official Officer Resolution Note */}
        <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-amber-500/12 via-[#151924] to-[#0D1017] border border-amber-500/35 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between gap-2 mb-2.5 pb-2 border-b border-amber-500/20">
            <div className="flex items-center gap-2">
              <FileText size={15} className="text-amber-400" />
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-300">
                Keterangan Penanganan oleh Petugas:
              </span>
            </div>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
              Resmi Dituntaskan
            </span>
          </div>
          <div className="text-xs sm:text-sm text-slate-100 leading-relaxed font-medium bg-black/45 rounded-xl p-3 sm:p-3.5 border-l-4 border-amber-400 whitespace-pre-wrap break-words shadow-inner">
            "{catatanFinal}"
          </div>
        </div>

        {/* Officer in Charge Card */}
        {officer && (
          <div className="rounded-2xl p-4 bg-[#121621] border border-white/10 shadow-lg space-y-3">
            <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Personil Penanganan Lapangan</span>
              <span className="text-emerald-400 font-bold">● Tugas Selesai</span>
            </div>
            <div className="flex items-center gap-3.5">
              <NameInitialAvatar
                name={officer.namaLengkap}
                avatarUrl={officer.avatarUrl}
                size={50}
                variant="gold"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="bg-amber-500/20 text-amber-300 text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                    {officer.rankPangkat || 'POLRI'}
                  </span>
                  {officer.nrp && (
                    <span className="text-[10px] text-slate-400 font-mono">NRP: {officer.nrp}</span>
                  )}
                </div>
                <div className="text-sm sm:text-base font-extrabold text-white truncate">
                  {officer.namaLengkap}
                </div>
                <div className="text-xs text-slate-400 truncate mt-0.5">
                  🛡️ {officer.unitName || 'Satuan Patroli 110'}
                  {officer.assignedPatrolVehicle && ` · 🚘 ${officer.assignedPatrolVehicle}`}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Citizen Rating & Review Form Card */}
        <div className="rounded-2xl p-4 sm:p-6 bg-gradient-to-br from-[#121621] to-[#0A0D14] border border-amber-500/35 shadow-xl space-y-4">
          {done || complaint?.citizenRating ? (
            <div className="text-center py-4 space-y-2">
              <div className="text-4xl mb-1">⭐</div>
              <h3 className="text-base font-black text-amber-300">Terima Kasih Atas Penilaian Anda!</h3>
              <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                Ulasan dan penilaian Anda telah berhasil dicatat. Evaluasi masyarakat sangat berarti untuk menjaga mutu pelayanan Presisi SIMOPMAS 110.
              </p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4 text-center">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wide mb-1">
                  Nilai Pelayanan Petugas
                </h3>
                <p className="text-xs text-slate-400">
                  Bagaimana respons, kecepatan, dan profesionalisme petugas kami?
                </p>
              </div>

              {/* Interactive Stars */}
              <div>
                <div className="flex justify-center gap-2 sm:gap-3 py-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => onStarSet(n)}
                      onMouseEnter={() => onStarHover(n)}
                      onMouseLeave={() => onStarHover(0)}
                      className="bg-transparent border-none cursor-pointer text-3xl sm:text-4xl transition-transform hover:scale-125 focus:outline-none"
                      style={{
                        filter: (hoverStar || starRating) >= n ? 'drop-shadow(0 0 10px rgba(245,158,11,0.65))' : 'none',
                      }}
                    >
                      {(hoverStar || starRating) >= n ? '⭐' : '☆'}
                    </button>
                  ))}
                </div>
                <div className="text-xs font-bold text-amber-300 mt-1">
                  {ratingLabels[hoverStar || starRating]}
                </div>
              </div>

              {/* Feedback Tags */}
              <div className="text-left pt-1">
                <div className="text-[10px] text-slate-400 font-bold mb-2 uppercase tracking-wider">
                  Apa yang Paling Memuaskan?
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Respon Cepat',
                    'Personil Ramah',
                    'Tiba Tepat Waktu',
                    'Penanganan Profesional',
                    'Solutif & Terpercaya',
                    'Komunikasi Baik',
                  ].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => onTagToggle(t)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                        selectedTags.includes(t)
                          ? 'bg-amber-400/20 border-amber-400 text-amber-300 shadow-sm'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {selectedTags.includes(t) ? '✓ ' : ''}
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Textarea */}
              <div className="text-left">
                <label className="text-[10px] text-slate-400 font-bold mb-1.5 block uppercase tracking-wider">
                  Catatan atau Apresiasi (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={reviewText}
                  onChange={(e) => onReviewChange(e.target.value)}
                  placeholder="Apresiasi atau catatan untuk personel (opsional)..."
                  className="w-full bg-black/40 border border-amber-500/25 rounded-xl p-3 text-xs text-white placeholder-slate-500 outline-none resize-none focus:border-amber-400 transition-colors"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 rounded-xl font-black text-xs sm:text-sm text-slate-950 flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, #ECC473 0%, #C99635 100%)',
                  opacity: submitting ? 0.7 : 1,
                }}
              >
                <ThumbsUp size={16} />
                <span>{submitting ? 'Mengirim Penilaian...' : 'Kirim Penilaian Saya'}</span>
              </button>
            </form>
          )}
        </div>

        {/* Incident Summary Card */}
        <div className="rounded-2xl p-4 sm:p-5 bg-black/40 border border-white/10 space-y-3">
          <div className="flex items-center justify-between pb-2.5 border-b border-white/5">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Nomor Tiket
              </span>
              <span className="text-xs sm:text-sm font-mono font-bold text-amber-300">
                {cleanTiket}
              </span>
            </div>
            <button
              type="button"
              onClick={onCopyTicket}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition-all active:scale-95 cursor-pointer"
            >
              {copiedTicket ? (
                <>
                  <Check size={13} className="text-emerald-400" />
                  <span className="text-emerald-400">Tersalin</span>
                </>
              ) : (
                <>
                  <Copy size={12} className="text-amber-400" />
                  <span>Salin</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">
                Kategori Kejadian
              </span>
              <span className="font-extrabold text-amber-300">
                {complaint.jenisKejadian || 'Darurat 110'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">
                Waktu Pelaporan
              </span>
              <span className="text-slate-300">{formattedWaktuLaporan}</span>
            </div>
          </div>

          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <MapPin size={12} className="text-amber-400" />
              <span>Titik Lokasi (TKP)</span>
            </div>
            <div className="text-xs text-slate-200 leading-relaxed font-medium bg-black/25 p-2.5 rounded-xl border border-white/5">
              {complaint.tkpAlamatTeks || '-'}
            </div>
          </div>

          {/* Toggle Map Preview */}
          {hasValidTkp && (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowMapPreview((prev) => !prev)}
                className="w-full py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-300 flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <MapPin size={13} className="text-amber-400" />
                <span>{showMapPreview ? 'Sembunyikan Peta TKP' : 'Lihat Lokasi TKP di Peta'}</span>
              </button>

              {showMapPreview && (
                <div className="mt-3 h-52 sm:h-64 rounded-xl overflow-hidden border border-amber-500/30">
                  <SimapresGoogleMap
                    mode="fullscreen"
                    height="100%"
                    targetComplaint={mapComplaint}
                    showTraffic={false}
                    showOtherOfficers={false}
                    controlsPosition="bottom-right"
                    controlsRightOffset="8px"
                    controlsBottomOffset="8px"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Chat History Button (if messages exist) */}
        {chatMessages && chatMessages.length > 0 && (
          <button
            type="button"
            onClick={onOpenChat}
            className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-300 flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <MessageSquare size={14} className="text-amber-400" />
            <span>Lihat Riwayat Chat Lapangan ({chatMessages.length} Pesan)</span>
          </button>
        )}

        {/* Navigation Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <button
            type="button"
            onClick={onBack || (() => (window.location.href = '/tracking'))}
            className="flex-1 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            <Search size={14} />
            <span>Cari Nomor Tiket Lain</span>
          </button>
          <a
            href="tel:110"
            className="flex-1 py-3 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-xs font-bold text-red-300 flex items-center justify-center gap-2 transition-all active:scale-95 text-center"
          >
            <Phone size={14} />
            <span>Hotline Darurat 110</span>
          </a>
        </div>
      </main>
    </div>
  );
}

function ChatBottomDrawer({
  officer,
  messages,
  input,
  sending,
  onInputChange,
  onSend,
  onClose,
  chatEndRef,
}: any) {
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchEndY - touchStartY.current;
    if (diff > 50) {
      onClose();
    }
    touchStartY.current = null;
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end items-center">
      {/* Semi-transparent dark blur backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
      />

      {/* Drawer Container */}
      <div
        className="relative w-full max-w-xl h-[82dvh] max-h-[720px] bg-[#121621] border-t-2 border-x border-amber-500/35 rounded-t-3xl flex flex-col shadow-2xl overflow-hidden z-10"
        style={{
          animation: 'clt-drawer-slide 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Swipe Pill Handle */}
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onClick={onClose}
          className="flex justify-center pt-2.5 pb-1.5 cursor-pointer group"
        >
          <div className="w-12 h-1.5 rounded-full bg-white/30 group-hover:bg-amber-400 transition-colors" />
        </div>

        {/* Drawer Header */}
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="px-4 py-2.5 border-b border-white/10 flex items-center justify-between bg-[#121621]"
        >
          <div className="flex items-center gap-3">
            <NameInitialAvatar
              name={officer?.namaLengkap}
              avatarUrl={officer?.avatarUrl}
              size={36}
              showOnlineDot={true}
              statusColor="#10B981"
              variant="gold"
            />
            <div>
              <div className="text-xs font-black text-white leading-tight">
                {officer?.namaLengkap || 'Petugas Lapangan'}
              </div>
              <div className="text-[10px] text-amber-300 font-bold mt-0.5">
                {officer?.rankPangkat || 'POLRI'} · {officer?.unitName || '110 Patroli'}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup Chat"
            className="w-8 h-8 rounded-full bg-white/5 border border-amber-500/25 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Tactical Info Strip */}
        <div className="bg-black/50 py-1.5 px-3 border-b border-white/5 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-semibold">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Koneksi Langsung Terhubung ke Handset Personil</span>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="text-center text-slate-400 text-xs my-auto py-8">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-3 text-amber-300">
                <MessageSquare size={20} />
              </div>
              <p className="font-extrabold text-slate-200 text-sm mb-1">Ruang Chat Terbuka</p>
              <p className="text-slate-400 max-w-xs mx-auto leading-relaxed">
                Kirim informasi patokan lokasi atau kondisi terkini untuk mempermudah personil merapat.
              </p>
            </div>
          ) : (
            messages.map((msg: ChatMessageItem) => {
              const isMe = msg.senderRole === 'WARGA';
              return (
                <div
                  key={msg.id}
                  className={`max-w-[82%] ${isMe ? 'ml-auto text-right' : 'mr-auto text-left'}`}
                >
                  <div className={`text-[10px] font-bold mb-0.5 ${isMe ? 'text-amber-300' : 'text-blue-400'}`}>
                    {isMe ? 'Anda (Pelapor)' : msg.senderName || 'Petugas Lapangan'}
                  </div>
                  <div
                    className={`p-2.5 rounded-2xl text-xs break-words shadow-sm ${
                      isMe
                        ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold rounded-tr-sm'
                        : 'bg-[#1A1F2C] text-slate-100 border border-amber-500/20 rounded-tl-sm font-medium'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <div className="text-[9px] text-slate-500 mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              );
            })
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Quick Presets */}
        <div className="flex gap-1.5 overflow-x-auto p-2.5 border-t border-white/5 bg-black/40 scrollbar-none">
          {[
            'Saya di depan gerbang.',
            'Saya memakai baju merah.',
            'Kondisi aman, silakan merapat.',
            'Lokasi saya sesuai titik GPS.',
            'Tolong bunyikan sirine saat dekat.',
          ].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onSend(undefined, t)}
              className="bg-amber-500/10 border border-amber-500/25 text-amber-300 px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap flex-shrink-0 hover:bg-amber-500/20 transition-colors"
            >
              {t}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form onSubmit={onSend} className="p-3 border-t border-white/10 bg-[#0D1017] flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder="Ketik pesan untuk petugas..."
            autoFocus
            className="flex-1 bg-black/50 border border-amber-500/25 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-400 transition-colors"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="px-4 rounded-xl font-black text-xs flex items-center justify-center transition-all disabled:opacity-40"
            style={{
              background: input.trim() ? 'linear-gradient(135deg,#ECC473,#C99635)' : 'rgba(255,255,255,0.06)',
              color: input.trim() ? '#0A0D14' : '#64748B',
            }}
          >
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
}
