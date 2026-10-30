'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  Phone,
  MessageSquare,
  MapPin,
  Clock,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  Send,
  Copy,
  Check,
  Shield,
  RefreshCw,
  ThumbsUp,
  X,
  ChevronDown,
  ChevronUp,
  Radio,
  FileText,
  Search,
  Zap,
} from 'lucide-react';
import { submitRatingAction } from '@/app/actions/complaint.actions';
import {
  sendTicketChatMessageAction,
} from '@/app/actions/chat.actions';
import type { ChatMessageItem } from '@/types/chat.types';
import NameInitialAvatar from '@/components/ui/NameInitialAvatar';
import { formatIncidentDateTime } from '@/lib/date-utils';
import { isDeskResolvedComplaint } from '@/domain/rules/resolution.rules';

const SimapresGoogleMap = dynamic(() => import('@/components/maps/SimapresGoogleMap'), {
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

import {
  RATING_CRITERIA,
  RATING_LABELS,
  type CitizenLiveRadarTrackerProps,
  haversineKm,
} from './tracker/tracker-helpers';

export {
  RATING_CRITERIA,
  RATING_LABELS,
  type CitizenLiveRadarTrackerProps,
  haversineKm,
};

import { RadarSearchingFullScreenView, RadarSearchingCard } from './tracker/RadarSearchingViews';
import OfficerPreparingIndependentView from './tracker/OfficerPreparingIndependentView';
import CrossJurisdictionTransferIndependentView from './tracker/CrossJurisdictionTransferIndependentView';
import CompletedIndependentView from './tracker/CompletedIndependentView';
import ChatBottomDrawer from './tracker/ChatBottomDrawer';
import CitizenTrackerLiveDrawer from './tracker/CitizenTrackerLiveDrawer';

export default function CitizenLiveRadarTracker({
  nomorTiket,
  initialData,
  onBack,
  token,
  onSwitchToOperatorReview,
}: CitizenLiveRadarTrackerProps) {
  // ── State ──────────────────────────────────────────────────────────────────
  const hasToken = Boolean(token && token.trim());
  const [complaint, setComplaint] = useState<any>(hasToken ? (initialData || null) : null);
  const [loading, setLoading] = useState(hasToken ? !initialData : false);
  const [ticketNotFound, setTicketNotFound] = useState(false);
  const [unauthorized, setUnauthorized] = useState(!hasToken);
  const [unauthorizedMessage, setUnauthorizedMessage] = useState(
    !hasToken
      ? 'Akses ditolak: Tautan pelacakan wajib menyertakan token verifikasi keamanan resmi.'
      : ''
  );
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

  // Rating 5 Poin (Fase Selesai)
  const [fiveRatings, setFiveRatings] = useState<Record<string, number>>({
    responseTime: 5,
    humanis: 5,
    transparansi: 5,
    policeCare: 5,
    overall: 5,
  });
  const [reviewText, setReviewText] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingDone, setRatingDone] = useState(false);
  const cleanTiket = useMemo(() => (nomorTiket || '').replace(/^#/, ''), [nomorTiket]);

  useEffect(() => {
    if (typeof window !== 'undefined' && cleanTiket) {
      if (localStorage.getItem(`simopmas_rating_${cleanTiket}`) === 'true') {
        setRatingDone(true);
      }
    }
  }, [cleanTiket]);

  // ── Derived Status ─────────────────────────────────────────────────────────
  const isCompleted = useMemo(() => {
    if (!complaint) return false;
    const s = (complaint.status || '').toUpperCase();
    return s === 'SELESAI';
  }, [complaint]);

  const isAccepted = useMemo(() => {
    if (!complaint || isCompleted) return false;
    const dispatches: any[] = complaint.dispatches || [];
    const hasAcceptedDispatch = dispatches.some(
      (d: any) => Boolean((d.acceptedAt || d.accepted_at) && (d.officer || d.officer_id || d.officerId))
    );
    const hasAssignedOfficer = Boolean(
      complaint.assignedOfficer || complaint.assigned_officer_id || complaint.assignedOfficerId
    );
    const status = (complaint.status || '').toUpperCase();
    return hasAcceptedDispatch || hasAssignedOfficer || status === 'MENUNGGU_PENGESAHAN';
  }, [complaint, isCompleted]);

  const isArrived = useMemo(() => {
    if (!complaint || isCompleted || !isAccepted) return false;
    const tahap = Number(complaint.tahap || 0);
    const dispatches: any[] = complaint.dispatches || [];
    const hasArrivedDispatch = dispatches.some(
      (d: any) => Boolean(d.arrivedAt || d.arrived_at || d.dispatchStatus === 'ARRIVED' || d.dispatch_status === 'ARRIVED')
    );
    return tahap >= 4 || hasArrivedDispatch || Boolean(complaint.waktuTiba || complaint.responTibaTkpAt);
  }, [complaint, isCompleted, isAccepted]);

  const isMeluncur = useMemo(() => {
    if (!complaint || isCompleted || !isAccepted || isArrived) return false;
    const tahap = Number(complaint.tahap || 0);
    const dispatches: any[] = complaint.dispatches || [];
    const hasDepartedDispatch = dispatches.some(
      (d: any) =>
        Boolean(d.departedAt || d.departed_at || d.dispatchStatus === 'DEPARTED' || d.dispatch_status === 'DEPARTED') &&
        !(d.arrivedAt || d.arrived_at || d.dispatchStatus === 'ARRIVED' || d.dispatch_status === 'ARRIVED')
    );
    const hasDepartedComplaint = Boolean(
      complaint.waktuMeluncur ||
      complaint.waktu_meluncur ||
      complaint.responMeluncurAt ||
      tahap === 3
    );
    return tahap === 3 || hasDepartedDispatch || hasDepartedComplaint;
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

    const trimmedToken = (token || '').trim();
    if (!trimmedToken) {
      setUnauthorized(true);
      setUnauthorizedMessage('Akses ditolak: Tautan pelacakan wajib menyertakan token verifikasi keamanan resmi.');
      setComplaint(null);
      setLoading(false);
      return;
    }

    setUnauthorized(false);
    setTicketNotFound(false);
    setLoading(true);

    let es: EventSource | null = null;
    let isCancelled = false;
    const tokenQuery = `&token=${encodeURIComponent(trimmedToken)}`;

    // 1. Pre-fetch validasi token & status HTTP 403 Forbidden
    fetch(`/api/tracking?tiket=${encodeURIComponent(nomorTiket)}${tokenQuery}`)
      .then(async (res) => {
        if (isCancelled) return;
        if (res.status === 403) {
          const json = await res.json().catch(() => ({}));
          setUnauthorized(true);
          setUnauthorizedMessage(json.error || 'Akses ditolak: Token verifikasi pelacakan tidak valid atau tidak terdaftar.');
          setComplaint(null);
          setLoading(false);
          if (es) {
            es.close();
            es = null;
          }
          return;
        }
        if (res.status === 404) {
          setTicketNotFound(true);
          setComplaint(null);
          setLoading(false);
          if (es) {
            es.close();
            es = null;
          }
          return;
        }
        const json = await res.json().catch(() => null);
        if (json?.data?.complaint) {
          setComplaint(json.data.complaint);
          setUnauthorized(false);
          setTicketNotFound(false);
          if (json.data.chatMessages) {
            setChatMessages(json.data.chatMessages);
          }
          setLoading(false);
        }
      })
      .catch(() => {
        if (!isCancelled) setLoading(false);
      });

    // 2. Real-time SSE Stream
    try {
      es = new EventSource(`/api/tracking/stream?tiket=${encodeURIComponent(nomorTiket)}${tokenQuery}`);

      es.addEventListener('data', (event: MessageEvent) => {
        if (isCancelled) return;
        try {
          const payload = JSON.parse(event.data);
          if (payload.complaint) {
            setComplaint(payload.complaint);
            setTicketNotFound(false);
            setUnauthorized(false);
            setLoading(false);
          }
          if (payload.chatMessages) {
            setChatMessages(payload.chatMessages);
          }
        } catch (_) { }
      });

      es.addEventListener('unauthorized', (event: MessageEvent) => {
        if (isCancelled) return;
        try {
          const payload = JSON.parse(event.data);
          setUnauthorizedMessage(payload.error || 'Akses ditolak: Token verifikasi tidak terdaftar.');
        } catch (_) { }
        setUnauthorized(true);
        setComplaint(null);
        setLoading(false);
      });

      es.addEventListener('not_found', () => {
        if (isCancelled) return;
        setTicketNotFound(true);
        setComplaint(null);
        setLoading(false);
      });

      es.onerror = () => {
        if (isCancelled) return;
        setLoading(false);
      };
    } catch (_) {
      setLoading(false);
    }

    // 3. Fallback background polling (menjamin sinkronisasi jika koneksi SSE terputus/stalled)
    const pollInterval = setInterval(async () => {
      if (isCancelled) return;
      try {
        const res = await fetch(`/api/tracking?tiket=${encodeURIComponent(nomorTiket)}${tokenQuery}`);
        if (res.ok) {
          const json = await res.json().catch(() => null);
          if (json?.data?.complaint) {
            setComplaint((prev: any) => {
              if (!prev) return json.data.complaint;
              const prevSig = `${prev.status}_${prev.tahap}_${prev.dispatches?.[0]?.dispatch_status}_${prev.dispatches?.[0]?.departed_at}_${prev.dispatches?.[0]?.arrived_at}_${prev.citizenRating}_${prev.citizenReview}`;
              const nextC = json.data.complaint;
              const nextSig = `${nextC.status}_${nextC.tahap}_${nextC.dispatches?.[0]?.dispatch_status}_${nextC.dispatches?.[0]?.departed_at}_${nextC.dispatches?.[0]?.arrived_at}_${nextC.citizenRating}_${nextC.citizenReview}`;
              if (prevSig !== nextSig) {
                return nextC;
              }
              return prev;
            });
            if (json.data.chatMessages) {
              setChatMessages((prev) => {
                if (prev.length !== json.data.chatMessages.length) {
                  return json.data.chatMessages;
                }
                return prev;
              });
            }
          }
        }
      } catch (_) { }
    }, 3000);

    return () => {
      isCancelled = true;
      clearInterval(pollInterval);
      if (es) {
        es.close();
        es = null;
      }
    };
  }, [nomorTiket, token]);

  // Auto-switch to Operator Review when ticket is resolved at operator desk without field patrol
  useEffect(() => {
    if (complaint && onSwitchToOperatorReview && isDeskResolvedComplaint(complaint)) {
      onSwitchToOperatorReview();
    }
  }, [complaint, onSwitchToOperatorReview]);

  const assignedOfficer = useMemo(() => {
    if (!complaint) return null;
    const dispatches: any[] = complaint.dispatches || [];
    const d = dispatches.find((x: any) => (x.acceptedAt || x.accepted_at) && x.officer)
      || dispatches.find((x: any) => x.officer);
    const rawOfficer = complaint.assignedOfficer || d?.officer;
    if (!rawOfficer) return null;

    const resolvedNrp = rawOfficer.nrp || d?.officer?.nrp || rawOfficer.user?.identifier || null;

    return {
      ...rawOfficer,
      id: rawOfficer.id,
      nrp: resolvedNrp,
      namaLengkap: rawOfficer.namaLengkap || rawOfficer.user?.full_name || rawOfficer.user?.nama_lengkap || 'Petugas Lapangan',
      rankPangkat: rawOfficer.rankPangkat || rawOfficer.rank_pangkat,
      jabatan: rawOfficer.jabatan,
      assignedPatrolVehicle: rawOfficer.assignedPatrolVehicle || rawOfficer.assigned_patrol_vehicle,
      currentGpsLat: rawOfficer.currentGpsLat || rawOfficer.current_gps_lat,
      currentGpsLng: rawOfficer.currentGpsLng || rawOfficer.current_gps_lng,
      phoneNumber: rawOfficer.phoneNumber || rawOfficer.user?.phone_number,
      callPhoneNumber: rawOfficer.callPhoneNumber || rawOfficer.user?.raw_phone_number || rawOfficer.user?.phone_number || '110',
      avatarUrl: rawOfficer.avatarUrl || rawOfficer.avatar_url,
      unitName: rawOfficer.unitName || d?.unit?.unit_name || d?.unit?.unitName || 'Satuan Samapta Presisi',
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

  const etaFormatted = useMemo(() => {
    if (!etaMinutes) return '-';
    if (etaMinutes >= 60) {
      const h = Math.floor(etaMinutes / 60);
      const m = etaMinutes % 60;
      return m > 0 ? `±${h} Jam ${m} Mnt` : `±${h} Jam`;
    }
    return `±${etaMinutes} Mnt`;
  }, [etaMinutes]);

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
    } catch (_) { }
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
      const rValues = [
        fiveRatings.responseTime || 5,
        fiveRatings.humanis || 5,
        fiveRatings.transparansi || 5,
        fiveRatings.policeCare || 5,
        fiveRatings.overall || 5,
      ];
      const avgScore = Math.max(1, Math.min(5, Math.round(rValues.reduce((a, b) => a + b, 0) / rValues.length)));
      const tagsFormatted = RATING_CRITERIA.map(
        (c) => `${c.tagLabel}: ${fiveRatings[c.id] || 5}★`
      ).join(', ');

      const res = await submitRatingAction({
        nomorTiket,
        rating: avgScore,
        review: reviewText.trim() || undefined,
        tags: tagsFormatted || undefined,
      });
      if (res?.success) {
        setRatingDone(true);
        if (typeof window !== 'undefined' && cleanTiket) {
          localStorage.setItem(`simopmas_rating_${cleanTiket}`, 'true');
        }
        setComplaint((prev: any) => prev ? {
          ...prev,
          citizenRating: avgScore,
          citizenTags: tagsFormatted,
          citizenReview: reviewText.trim(),
        } : prev);
      }
    } catch (_) { }
    finally { setSubmittingRating(false); }
  };

  const handleCopyTicket = () => {
    if (!nomorTiket) return;
    navigator.clipboard.writeText(nomorTiket);
    setCopiedTicket(true);
    setTimeout(() => setCopiedTicket(false), 2000);
  };

  // ──────────────────────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div
      className={`fixed inset-0 z-40 w-full h-[100dvh] ${isCompleted || !isAccepted || (!isMeluncur && !isArrived) ? 'overflow-y-auto' : 'overflow-hidden'
        } flex flex-col bg-[#090A0F] select-none`}
      style={{
        color: '#F1F5F9',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        WebkitFontSmoothing: 'antialiased',
      }}
    >
      {/* ───────────────── GLOBAL KEYFRAMES ───────────────── */}
      <style dangerouslySetInnerHTML={{
        __html: `
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

      {/* ───────────────── AKSES DITOLAK: TOKEN WAJIB / TIDAK TERDAFTAR ───────────────── */}
      {!loading && (unauthorized || (!complaint && !ticketNotFound)) && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#090A0F] p-6 text-center animate-in fade-in duration-300">
          <div
            style={{
              width: '84px',
              height: '84px',
              borderRadius: '24px',
              background: 'linear-gradient(135deg, rgba(239,68,68,0.18) 0%, rgba(185,28,28,0.06) 100%)',
              border: '2px solid rgba(239,68,68,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
              boxShadow: '0 0 36px rgba(239,68,68,0.25)',
            }}
          >
            <span style={{ fontSize: '42px' }}>🔒</span>
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 14px',
              borderRadius: '999px',
              background: 'rgba(239,68,68,0.12)',
              border: '1px solid rgba(239,68,68,0.3)',
              color: '#F87171',
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.8px',
              textTransform: 'uppercase',
              marginBottom: '12px',
            }}
          >
            Akses Ditolak · 403 Forbidden
          </div>

          <h2 className="text-xl font-black text-white mb-2 tracking-tight text-center">
            Tautan yang anda masukkan tidak sah!
          </h2>

          <p className="text-sm text-slate-300 max-w-sm leading-relaxed mb-4">
            Akses pemantauan radar taktis dan data laporan <strong className="text-amber-400 font-mono">{nomorTiket}</strong> ditolak karena tautan tidak menyertakan token keamanan resmi atau token tidak terdaftar.
          </p>

          {/* Security explanation banner */}
          <div
            style={{
              maxWidth: '400px',
              background: 'rgba(18,22,33,0.85)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '14px',
              padding: '14px 16px',
              marginBottom: '24px',
              textAlign: 'left',
              fontSize: '11.5px',
              color: '#94A3B8',
              lineHeight: 1.6,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ECC473', fontWeight: 800, marginBottom: '6px' }}>
              <span>🛡️</span>
              <span>Protokol Keamanan SIMOPMAS 110</span>
            </div>
            Demi melindungi kerahasiaan data pelapor dan keamanan operasi personel patroli lapangan, seluruh URL pelacakan wajib menggunakan tautan sah resmi ber-token yang dikirimkan via WhatsApp resmi atau tanda bukti lapor Anda.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', maxWidth: '340px' }}>
            <button
              type="button"
              onClick={onBack || (() => (window.location.href = '/tracking'))}
              className="w-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm px-6 py-3.5 rounded-xl shadow-lg active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Search size={16} />
              <span>Kembali ke Pencarian Laporan</span>
            </button>

            <a
              href="tel:110"
              className="w-full bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-300 font-bold text-xs px-6 py-3 rounded-xl active:scale-95 transition-all text-center flex items-center justify-center gap-2"
            >
              <Phone size={14} className="text-red-400" />
              <span>Bantuan Darurat SPKT 110</span>
            </a>
          </div>
        </div>
      )}

      {/* ───────────────── TIKET TIDAK DITEMUKAN ───────────────── */}
      {!loading && !unauthorized && ticketNotFound && !complaint && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#090A0F] p-6 text-center animate-in fade-in duration-300">
          <div className="text-5xl mb-4">🔍</div>
          <h2 className="text-lg font-black text-white mb-2">Tiket Tidak Ditemukan</h2>
          <p className="text-sm text-slate-400 max-w-xs leading-relaxed mb-6">
            Nomor <strong className="text-amber-400 font-mono">{nomorTiket}</strong> tidak ditemukan dalam sistem. Pastikan nomor tiket yang tertera pada bukti pelaporan Anda sudah benar.
          </p>
          <button
            type="button"
            onClick={onBack || (() => (window.location.href = '/tracking'))}
            className="bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-sm px-6 py-3 rounded-xl shadow-lg active:scale-95 transition-all cursor-pointer"
          >
            Cari Nomor Tiket Lain
          </button>
        </div>
      )}

      {/* ───────────────── MAIN VIEW ───────────────── */}
      {!loading && !unauthorized && complaint && (
        isCompleted ? (
          <>
            <CompletedIndependentView
              complaint={complaint}
              officer={assignedOfficer}
              nomorTiket={nomorTiket}
              fiveRatings={fiveRatings}
              reviewText={reviewText}
              submitting={submittingRating}
              done={ratingDone}
              onRatingChange={(id: string, val: number) =>
                setFiveRatings((prev) => ({ ...prev, [id]: val }))
              }
              onReviewChange={setReviewText}
              onSubmit={handleSubmitRating}
              onBack={onBack}
              onCopyTicket={handleCopyTicket}
              copiedTicket={copiedTicket}
              chatMessages={chatMessages}
              onOpenChat={() => setIsChatOpen(true)}
              mapComplaint={mapComplaint}
              onSwitchToOperatorReview={onSwitchToOperatorReview}
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
        ) : (complaint?.crossJurisdiction?.isCrossJurisdiction || complaint?.status === 'DISPOSISI_LINTAS_WILAYAH') && !isMeluncur && !isArrived ? (
          <>
            {/* Tampilan Portal Tracking Saat Laporan Mengalami DISPOSISI LINTAS WILAYAH (INTER-POLRES) */}
            <CrossJurisdictionTransferIndependentView
              complaint={complaint}
              nomorTiket={nomorTiket}
              onBack={onBack}
              onCopyTicket={handleCopyTicket}
              copiedTicket={copiedTicket}
              chatMessages={chatMessages}
              onOpenChat={() => setIsChatOpen(true)}
            />

            {/* Chat Bottom Drawer Overlay if citizen opens chat with coordinator */}
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
        ) : !isMeluncur && !isArrived ? (
          <>
            {/* GAMBAR 3: Tampilan Portal Tracking Saat Petugas Masih DISPATCHED (Bersiap Berangkat) */}
            <OfficerPreparingIndependentView
              complaint={complaint}
              officer={assignedOfficer}
              nomorTiket={nomorTiket}
              onBack={onBack}
              onCopyTicket={handleCopyTicket}
              copiedTicket={copiedTicket}
              chatMessages={chatMessages}
              onOpenChat={() => setIsChatOpen(true)}
            />

            {/* Chat Bottom Drawer Overlay if citizen opens chat with preparing officer */}
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
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/[0.08] border border-white/10 p-0.5 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <img
                    src="/logo_simopmas.png"
                    alt="Logo SIMOPMAS 110"
                    className="w-full h-full object-contain filter drop-shadow-[0_0_3px_rgba(255,255,255,0.4)]"
                  />
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
                  border: `1px solid ${isArrived
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

                  <button
                    type="button"
                    onClick={() => setIsDrawerExpanded((prev) => !prev)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
                    title={isDrawerExpanded ? 'Perkecil Tampilan' : 'Perbesar Tampilan'}
                  >
                    {isDrawerExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                  </button>
                </div>

                {isAccepted ? (
                  /* ─── CASE B: PETUGAS DITUGASKAN (OfficerCard + Actions + Expandable Incident Details) ─── */
                  <div className="space-y-3">
                    {/* Ketika Minimized & Sedang Meluncur: Tampilkan metrik ringkas simetris DI TENGAH */}
                    {!isDrawerExpanded && isMeluncur && !isArrived && distanceKm > 0 && (
                      <div
                        onClick={() => setIsDrawerExpanded(true)}
                        className="w-full flex items-center justify-center pt-0.5 cursor-pointer"
                      >
                        <span className="text-[10px] font-mono font-bold text-amber-200 bg-amber-500/10 border border-amber-500/25 px-3 py-1 rounded-full shadow-sm flex items-center gap-1.5 hover:bg-amber-500/15 transition-all">
                          <Navigation size={10} className="text-amber-400 rotate-45" />
                          <span>{distanceFormatted} • {etaFormatted}</span>
                        </span>
                      </div>
                    )}
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
                        {/* 3-Column Metrics (Jarak GPS, Estimasi Waktu, Status Armada) saat Meluncur */}
                        {isMeluncur && !isArrived && distanceKm > 0 && (
                          <div className="grid grid-cols-3 divide-x divide-white/10 p-2.5 rounded-2xl bg-white/5 border border-white/10 flex-shrink-0">
                            <div className="text-center px-1">
                              <div className="text-[9px] font-bold text-slate-400 tracking-wider uppercase whitespace-nowrap">Jarak ke TKP</div>
                              <div className="text-xs sm:text-sm font-black text-amber-300 whitespace-nowrap mt-0.5 font-mono">
                                {distanceFormatted}
                              </div>
                            </div>
                            <div className="text-center px-1">
                              <div className="text-[9px] font-bold text-slate-400 tracking-wider uppercase whitespace-nowrap">Estimasi Tiba</div>
                              <div className="text-xs sm:text-sm font-bold text-slate-200 whitespace-nowrap mt-0.5">
                                {etaFormatted}
                              </div>
                            </div>
                            <div className="text-center px-1">
                              <div className="text-[9px] font-bold text-slate-400 tracking-wider uppercase whitespace-nowrap">Status</div>
                              <div className="text-xs sm:text-sm font-bold text-emerald-400 whitespace-nowrap mt-0.5">
                                Meluncur
                              </div>
                            </div>
                          </div>
                        )}

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
