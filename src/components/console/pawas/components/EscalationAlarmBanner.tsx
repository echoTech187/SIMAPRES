'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { AlertTriangle, ChevronLeft, ChevronRight, Navigation, Loader2, MessageSquare } from 'lucide-react';
import { acceptAndBroadcastCrossJurisdictionAction, getActiveSpktDutyDetails } from '@/app/actions/complaint.actions';
import { getLastDispatchedStationName, getLastDispatchedStationId } from '../tabs/TabOperatorCadPawas';
import { evaluateJurisdictionBoundary } from '@/lib/jurisdiction-boundary';

interface EscalationAlarmBannerProps {
  complaints: any[];
  onOpenDisposisiLintasWilayah?: (complaint: any) => void;
  onRefresh?: () => void;
  currentStationId?: number | string | null;
  currentStationName?: string | null;
  currentUser?: any;
  policeOffices?: any[];
}

export default function EscalationAlarmBanner({
  complaints,
  onOpenDisposisiLintasWilayah,
  onRefresh,
  currentStationId,
  currentStationName,
  currentUser,
  policeOffices = [],
}: EscalationAlarmBannerProps) {
  const [nowTime, setNowTime] = useState(Date.now());
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [dutyPiketInfo, setDutyPiketInfo] = useState<{
    kaSpktNama: string;
    kaSpktPhone: string;
    dutyOfficerNames: string[];
    dutyOfficers: any[];
  } | null>(null);
  const [targetDuties, setTargetDuties] = useState<Record<string, any>>({});
  const [isMounted, setIsMounted] = useState(false);
  const [dismissedTransfers, setDismissedTransfers] = useState<string[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    try {
      const stored = sessionStorage.getItem('dismissed_transferred_tickets');
      if (stored) {
        setDismissedTransfers(JSON.parse(stored));
      }
    } catch (_) {}
  }, []);

  const handleDismissTransferred = useCallback((nomorTiket: string) => {
    setDismissedTransfers((prev) => {
      const next = [...prev, nomorTiket];
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.setItem('dismissed_transferred_tickets', JSON.stringify(next));
        } catch (_) {}
      }
      return next;
    });
  }, []);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isPlayingRef = useRef<boolean>(false);
  const shouldPlayRef = useRef<boolean>(false);

  // Ambil data kontak Operator / Ka SPKT piket bertugas hari ini pada Mako lokal
  useEffect(() => {
    const stId = currentStationId ? Number(currentStationId) : 60001;
    getActiveSpktDutyDetails(stId)
      .then((res) => {
        if (res) {
          setDutyPiketInfo(res);
        }
      })
      .catch((err) => {
        console.warn('Gagal memuat kontak piket SPKT hari ini:', err);
      });
  }, [currentStationId]);

  // Update clock every second for precision countdown
  useEffect(() => {
    const timer = setInterval(() => setNowTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Helper ekstrak nama Mako pengirim dari log audit
  const extractSourceStationName = useCallback((c: any): string => {
    const logs = c.complaint_logs || c.complaintLogs || c.auditLogs || [];
    if (Array.isArray(logs)) {
      const xLog = logs.find((l: any) => l.action === 'DISPOSISI_LINTAS_WILAYAH' || l.action === 'CROSS_JURISDICTION_DISPATCHED');
      if (xLog && xLog.notes) {
        const match = xLog.notes.match(/Dari:\s*([^➔\n|]+)/);
        if (match && match[1]) {
          return match[1].trim();
        }
      }
    }
    return 'Polres Pekalongan';
  }, []);

  // Filter complaints that have an active escalation deadline or cross-jurisdiction transfer
  const escalatedItems = useMemo(() => {
    if (!Array.isArray(complaints)) return [];

    return complaints
      .map((c) => {
        const dispatches = Array.isArray(c.dispatches) ? c.dispatches : [];
        // 1. Jika sudah ada dispatch yang diterima (accepted_at), tiket tidak perlu eskalasi
        const isAccepted = dispatches.some((d: any) => d.accepted_at || d.acceptedAt);
        if (isAccepted || c.status === 'SELESAI' || c.status === 'DITOLAK' || c.tahap >= 3) {
          return null;
        }

        // 2. Jika tiket sudah resmi diterima oleh Mako Tujuan (CROSS_JURISDICTION_ACCEPTED) dan statusnya MENUNGGU:
        // Disposisi lintas wilayah telah berhasil diterima! Banner alarm pengalihan harus langsung HILANG seketika.
        const logs = c.complaint_logs || c.complaintLogs || c.auditLogs || [];
        const hasCrossJurisdictionAccepted = Array.isArray(logs) && logs.some((l: any) => l.action === 'CROSS_JURISDICTION_ACCEPTED');
        if (hasCrossJurisdictionAccepted && (c.status === 'MENUNGGU' || c.status === 'DIPROSES')) {
          return null;
        }

        // Resolusi stasiun tujuan terakhir menggunakan helper getLastDispatchedStation
        const targetStationName = getLastDispatchedStationName(c, policeOffices);
        const targetStationId = getLastDispatchedStationId(c, policeOffices);

        // Sesuai koreksi user: Bandingkan station_id & nama stasiun session user yang login dengan stasiun dari getLastDispatchedStation
        const isCurrentStationTarget = Boolean(
          (currentStationId && targetStationId && String(currentStationId) === String(targetStationId)) ||
          (currentStationName && targetStationName && currentStationName.trim().toLowerCase() === targetStationName.trim().toLowerCase())
        );

        // Deteksi apakah ini tiket lintas wilayah
        const isCrossJurisdiction = c.status === 'DISPOSISI_LINTAS_WILAYAH';

        // Hitung deadline eskalasi standar 3-5 menit
        let deadlineMs: number | null = null;
        const dispatchWithDeadline = dispatches.find((d: any) => d.escalation_deadline_at || d.escalationDeadlineAt);
        const rawDeadline = dispatchWithDeadline?.escalation_deadline_at || dispatchWithDeadline?.escalationDeadlineAt;
        if (rawDeadline) {
          deadlineMs = new Date(rawDeadline).getTime();
        } else {
          // Cari waktu dari audit log DISPOSISI_LINTAS_WILAYAH jika dispatch belum tercatat
          const xLog = Array.isArray(logs) ? logs.find((l: any) => l.action === 'DISPOSISI_LINTAS_WILAYAH' || l.action === 'CROSS_JURISDICTION_DISPATCHED') : null;
          if (xLog?.created_at) {
            deadlineMs = new Date(xLog.created_at).getTime() + 3 * 60 * 1000;
          } else if (c.updated_at || c.created_at) {
            deadlineMs = new Date(c.updated_at || c.created_at).getTime() + 3 * 60 * 1000;
          }
        }

        if (!deadlineMs && !isCrossJurisdiction) return null;

        const diffSec = deadlineMs ? Math.floor((deadlineMs - nowTime) / 1000) : 0;
        const isExpired = Boolean(deadlineMs && nowTime >= deadlineMs);

        const sourceStationName = extractSourceStationName(c);

        // KASUS 1: Pengguna adalah MAKO TUJUAN saat ini (misal Polsek Pekalongan Selatan saat tiket didisposisikan ke sini)
        if (isCurrentStationTarget) {
          if (isCrossJurisdiction) {
            // Mako Tujuan tetap melihat banner disposisi masuk selama tiket belum dialihkan ke Mako lain oleh Mako Asal
            return {
              complaint: c,
              nomorTiket: c.nomorTiket || c.nomor_tiket,
              jenisKejadian: c.jenisKejadian || c.jenis_kejadian,
              tkpAlamat: c.tkpAlamatTeks || c.tkp_alamat_teks || 'TKP Perkara',
              urgensi: (c.urgensi || 'SEDANG').toUpperCase(),
              stationName: currentStationName || 'Mako Kepolisian',
              phonePiket: dutyPiketInfo?.kaSpktPhone || null,
              sourceStationName,
              diffSec,
              isOverdue: isExpired,
              isCrossJurisdiction: true,
              isTargetMako: true,
            };
          } else {
            // Tiket internal yang sudah bukan lintas wilayah: Polsek tidak menampilkan banner [ Alihkan ]
            return null;
          }
        }

        // KASUS 2: Pengguna adalah MAKO ASAL (Operator CAD 110 pengirim laporan)
        // Tiket berada di Mako Lain (!isCurrentStationTarget)
        // Sesuai alur: saat baru didisposisikan, alert di Mako Asal HILANG karena sedang menunggu Mako Tujuan menerima.
        // HANYA JIKA Mako Tujuan TIDAK MENERIMA (isExpired === true), barulah alert eskalasi MUNCUL LAGI di Mako Asal!
        // PENTING: HANYA MAKO ASAL (Polres Pekalongan) yang berhak menerima alert eskalasi ini untuk mengalihkan ke Mako lain!
        const normCurrentStation = (currentStationName || '').toLowerCase().replace(/^(polres|polresta|polsek)\s+/, '').trim();
        const isCurrentMakoAsal = String(currentStationId) === '60001' || (normCurrentStation.includes('pekalongan') && !normCurrentStation.includes('selatan') && !normCurrentStation.includes('utara') && !normCurrentStation.includes('barat') && !normCurrentStation.includes('timur'));

        if (isCurrentMakoAsal && isCrossJurisdiction && isExpired) {
          const lastStationName = targetStationName || 'Mako Tujuan';

          const matchedOffice = (policeOffices || []).find((po: any) =>
            (targetStationId && String(po.id) === String(targetStationId)) ||
            (po.name && po.name.toLowerCase() === lastStationName.toLowerCase()) ||
            (po.station_name && po.station_name.toLowerCase() === lastStationName.toLowerCase())
          );

          const phonePiket =
            matchedOffice?.phonePiket ||
            matchedOffice?.phone_piket ||
            c.station?.phone_piket ||
            c.station?.phonePiket ||
            null;

          return {
            complaint: c,
            nomorTiket: c.nomorTiket || c.nomor_tiket,
            jenisKejadian: c.jenisKejadian || c.jenis_kejadian,
            tkpAlamat: c.tkpAlamatTeks || c.tkp_alamat_teks || 'TKP Perkara',
            urgensi: (c.urgensi || 'SEDANG').toUpperCase(),
            stationName: lastStationName,
            phonePiket,
            sourceStationName,
            diffSec: -1,
            isOverdue: true,
            isCrossJurisdiction: false, // Di Mako Asal, ini adalah aksi eskalasi untuk mengalihkan ke mako lain
            isTargetMako: false,
          };
        }

        // Tiket yang belum expired di Mako tujuan: TIDAK MUNCUL ALERT DI MAKO ASAL (HILANG DARI MAKO ASAL)
        return null;
      })
      .filter(Boolean) as any[];
  }, [complaints, nowTime, currentStationId, currentStationName, policeOffices, dutyPiketInfo, extractSourceStationName]);

  // Deteksi tiket yang dialihkan dari kesatuan ini ke Mako lain karena kesatuan ini tidak merespon (Hanya untuk Mako Tujuan Sebelumnya, BUKAN untuk Mako Asal)
  const transferredAwayItems = useMemo(() => {
    if (!isMounted || !Array.isArray(complaints) || !currentStationName) return [];

    const normCurrent = (currentStationName || '').toLowerCase().replace(/^(polres|polresta|polsek)\s+/, '').trim();
    const isMakoAsal = String(currentStationId) === '60001' || (normCurrent.includes('pekalongan') && !normCurrent.includes('selatan') && !normCurrent.includes('utara') && !normCurrent.includes('barat') && !normCurrent.includes('timur'));

    // Mako Asal (Polres Pekalongan) adalah operator pembuat, tidak pernah menerima alert "kesatuan Anda tidak menerima disposisi"
    if (isMakoAsal) return [];

    return complaints
      .map((c) => {
        // Bandingkan apakah kesatuan saat ini adalah target aktif dari tiket ini
        const activeTargetStationId = getLastDispatchedStationId(c, policeOffices);
        const activeTargetStationName = getLastDispatchedStationName(c, policeOffices);

        const isCurrentStationTarget = Boolean(
          (currentStationId && activeTargetStationId && String(currentStationId) === String(activeTargetStationId)) ||
          (currentStationName && activeTargetStationName && currentStationName.trim().toLowerCase() === activeTargetStationName.trim().toLowerCase())
        );

        if (isCurrentStationTarget) {
          return null;
        }

        const nomorTiket = c.nomorTiket || c.nomor_tiket;
        if (dismissedTransfers.includes(nomorTiket)) return null;

        const logs = c.complaint_logs || c.complaintLogs || c.auditLogs || [];

        // 1. Cek audit log DISPOSISI_LINTAS_WILAYAH di mana kesatuan ini tercatat di "Dari:"
        let isTransferredFromHere = false;
        let targetStationName = activeTargetStationName || c.station?.station_name || c.station?.name || 'Mako Terdekat';

        if (Array.isArray(logs)) {
          const transferLog = logs.find((l: any) => {
            if (l.action !== 'DISPOSISI_LINTAS_WILAYAH' && l.action !== 'CROSS_JURISDICTION_DISPATCHED') return false;
            if (!l.notes) return false;
            const matchDari = l.notes.match(/Dari:\s*([^➔\n|]+)/);
            if (matchDari && matchDari[1]) {
              const rawDari = matchDari[1].replace(/\([^)]*\)/g, '').trim();
              const dariName = rawDari.toLowerCase().replace(/^(polres|polresta|polsek)\s+/, '').trim();
              return (
                (dariName.includes(normCurrent) || normCurrent.includes(dariName)) &&
                !dariName.includes('pekalongan') &&
                String(currentStationId) !== '60001'
              );
            }
            return false;
          });

          if (transferLog) {
            isTransferredFromHere = true;
            const matchKe = transferLog.notes.match(/Ke:\s*([^|➔\n]+)/);
            if (matchKe && matchKe[1]) {
              targetStationName = matchKe[1].trim();
            }
          }
        }

        // 2. Evaluasi Yurisdiksi: Jika TKP perkara berada di yurisdiksi kesatuan ini (misal Batang), namun tiket dialihkan ke Mako lain (misal Polsek Pekalongan Selatan)
        if (!isTransferredFromHere) {
          const boundary = evaluateJurisdictionBoundary({
            tkpLat: c.tkpLat || c.tkp_lat,
            tkpLng: c.tkpLng || c.tkp_lng,
            tkpAlamat: c.tkpAlamatTeks || c.tkp_alamat_teks,
          });

          const isJurisdictionMatch =
            (boundary.targetStation?.id && String(boundary.targetStation.id) === String(currentStationId)) ||
            (boundary.detectedRegionName && boundary.detectedRegionName.toLowerCase().includes(normCurrent));

          if (isJurisdictionMatch && c.status === 'DISPOSISI_LINTAS_WILAYAH') {
            isTransferredFromHere = true;
            targetStationName = c.station?.station_name || c.station?.name || 'Mako Terdekat';
          }
        }

        if (!isTransferredFromHere) return null;

        return {
          complaint: c,
          nomorTiket,
          jenisKejadian: c.jenisKejadian || c.jenis_kejadian,
          tkpAlamat: c.tkpAlamatTeks || c.tkp_alamat_teks || 'TKP Perkara',
          targetStationName,
        };
      })
      .filter(Boolean) as any[];
  }, [isMounted, complaints, currentStationId, currentStationName, dismissedTransfers]);

  // Tiket yang memicu alert interaktif & sirine: tiket yang benar-benar overdue ATAU tiket pelimpahan masuk ke kesatuan ini (isTargetMako)
  const overdueItems = escalatedItems.filter((item) => item.isOverdue || item.isTargetMako);
  const activeCountdownItems = escalatedItems.filter((item) => !item.isOverdue && !item.isTargetMako);

  // Satukan semua item banner aktif ke dalam list terpadu untuk tampilan slider/carousel hemat ruang
  const allBanners = useMemo(() => {
    const list: Array<{
      type: 'transferred' | 'overdue' | 'countdown';
      key: string;
      data: any;
    }> = [];

    transferredAwayItems.forEach((item) => {
      list.push({
        type: 'transferred',
        key: `transferred-${item.nomorTiket}`,
        data: item,
      });
    });

    overdueItems.forEach((item) => {
      list.push({
        type: 'overdue',
        key: `overdue-${item.nomorTiket}`,
        data: item,
      });
    });

    activeCountdownItems.forEach((item) => {
      list.push({
        type: 'countdown',
        key: `countdown-${item.nomorTiket}`,
        data: item,
      });
    });

    return list;
  }, [transferredAwayItems, overdueItems, activeCountdownItems]);

  // Jaga batasan indeks slider saat jumlah tiket berkurang atau berubah
  useEffect(() => {
    if (allBanners.length === 0) {
      setCurrentSlideIndex(0);
    } else if (currentSlideIndex >= allBanners.length) {
      setCurrentSlideIndex(allBanners.length - 1);
    }
  }, [allBanners.length, currentSlideIndex]);

  // Rotasi slide otomatis setiap 7 detik jika ada lebih dari 1 tiket (dijeda jika kursor diarahkan ke banner)
  useEffect(() => {
    if (allBanners.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % allBanners.length);
    }, 7000);

    return () => clearInterval(timer);
  }, [allBanners.length, isPaused]);

  const handlePrevSlide = useCallback(() => {
    setCurrentSlideIndex((prev) => (prev - 1 + allBanners.length) % allBanners.length);
  }, [allBanners.length]);

  const handleNextSlide = useCallback(() => {
    setCurrentSlideIndex((prev) => (prev + 1) % allBanners.length);
  }, [allBanners.length]);

  // Inisialisasi Audio Sirine Patwal Realistis (Looping Tanpa Jeda)
  // Mendukung Desktop, Android, dan iPhone (iOS)
  useEffect(() => {
    const audio = new Audio('/audio/nada_dering_suara_mobil_patwal_viral_tiktok.mp3');
    audio.loop = true;
    audio.preload = 'auto';
    audioRef.current = audio;

    // Handler untuk membuka kunci audio (Audio Autoplay Unlock) di mobile iOS / Android
    const unlockAndPlay = () => {
      if (shouldPlayRef.current && audioRef.current && !isPlayingRef.current) {
        audioRef.current
          .play()
          .then(() => {
            isPlayingRef.current = true;
          })
          .catch(() => {});
      }
    };

    window.addEventListener('click', unlockAndPlay, { passive: true });
    window.addEventListener('touchstart', unlockAndPlay, { passive: true });
    window.addEventListener('keydown', unlockAndPlay, { passive: true });

    return () => {
      window.removeEventListener('click', unlockAndPlay);
      window.removeEventListener('touchstart', unlockAndPlay);
      window.removeEventListener('keydown', unlockAndPlay);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);

  // Kontrol pemutaran terus-menerus tanpa jeda saat ada overdue items
  useEffect(() => {
    if (overdueItems.length > 0) {
      shouldPlayRef.current = true;
      if (audioRef.current && !isPlayingRef.current) {
        audioRef.current
          .play()
          .then(() => {
            isPlayingRef.current = true;
          })
          .catch((err) => {
            // Mobile browser memblokir autoplay sebelum user gesture pertama;
            // listener window click/touchstart di atas akan langsung membunyikan pada sentuhan pertama.
            console.log('[EscalationAudio] Menunggu interaksi pertama untuk membunyikan sirine patwal:', err);
          });
      }
    } else {
      shouldPlayRef.current = false;
      if (audioRef.current && isPlayingRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        isPlayingRef.current = false;
      }
    }
  }, [overdueItems.length]);

  // Handler Terima & Disposisikan untuk Mako Tujuan (Polresta Batang)
  const handleTerimaDisposisiLintasWilayah = useCallback(
    async (complaint: any) => {
      const compId = String(complaint.id);
      setAcceptingId(compId);

      // Matikan suara sirine seketika saat tindakan diambil
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        isPlayingRef.current = false;
        shouldPlayRef.current = false;
      }

      try {
        const actorName = currentUser?.fullName || currentUser?.name || 'Operator SPKT Batang';
        const actorRole = currentUser?.role || 'OPERATOR';

        const res = await acceptAndBroadcastCrossJurisdictionAction({
          complaintId: compId,
          actorName,
          actorRole,
        });

        if (res.success) {
          if (onRefresh) {
            onRefresh();
          }
        } else {
          alert(`Gagal menerima disposisi: ${res.error || 'Terjadi kesalahan sistem'}`);
        }
      } catch (e: any) {
        alert(`Kendala jaringan: ${e.message || 'Gagal terhubung ke server'}`);
      } finally {
        setAcceptingId(null);
      }
    },
    [currentUser, onRefresh]
  );

  // Helper: Menentukan rekomendasi Mako terdekat untuk pelimpahan lintas wilayah (Opsi C)
  const findNearestTargetOffice = useCallback(
    (comp: any) => {
      const officesList = Array.isArray(policeOffices) && policeOffices.length > 0 ? policeOffices : [];
      const cLat = comp?.tkpLat ?? comp?.tkp_lat ?? comp?.latitude;
      const cLng = comp?.tkpLng ?? comp?.tkp_lng ?? comp?.longitude;

      // Filter: Hanya Mako lain (bukan Mako asal operator)
      const otherOffices = officesList.filter(
        (st: any) => !currentStationId || String(st.id) !== String(currentStationId)
      );

      if (otherOffices.length === 0) {
        return {
          id: 60002,
          name: 'Polresta Batang',
          station_name: 'Polresta Batang',
          phonePiket: '081222333444',
          distKm: null,
        };
      }

      let nearest: any = null;
      let minDistance = Infinity;

      for (const st of otherOffices) {
        const stLat = st.lat ?? st.office_lat ?? st.officeLat;
        const stLng = st.lng ?? st.office_lng ?? st.officeLng;
        if (cLat && cLng && stLat && stLng) {
          const toRad = (angle: number) => (angle * Math.PI) / 180;
          const dLat = toRad(Number(stLat) - Number(cLat));
          const dLng = toRad(Number(stLng) - Number(cLng));
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(Number(cLat))) * Math.cos(toRad(Number(stLat))) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distKm = Math.round(6371 * c * 10) / 10;
          if (distKm < minDistance) {
            minDistance = distKm;
            nearest = { ...st, distKm };
          }
        }
      }

      if (!nearest) {
        nearest =
          otherOffices.find((o: any) => (o.name || o.station_name || '').toLowerCase().includes('batang')) ||
          otherOffices[0];
      }

      return nearest;
    },
    [policeOffices, currentStationId]
  );

  // Ambil data kontak piket Ka SPKT Mako penugasan atau Mako tujuan terdekat
  useEffect(() => {
    overdueItems.forEach((item) => {
      const assignedOffice = (policeOffices || []).find((po: any) =>
        (item.complaint?.station_id && String(po.id) === String(item.complaint.station_id)) ||
        (po.name && po.name.toLowerCase() === item.stationName?.toLowerCase()) ||
        (po.station_name && po.station_name.toLowerCase() === item.stationName?.toLowerCase())
      );
      if (assignedOffice && assignedOffice.id && !targetDuties[assignedOffice.id]) {
        getActiveSpktDutyDetails(Number(assignedOffice.id))
          .then((res) => {
            if (res) {
              setTargetDuties((prev) => ({ ...prev, [assignedOffice.id]: res }));
            }
          })
          .catch((e) => console.warn('Gagal memuat kontak piket assigned:', e));
      }

      if (!item.isCrossJurisdiction) {
        const targetOffice = findNearestTargetOffice(item.complaint);
        if (targetOffice && targetOffice.id && !targetDuties[targetOffice.id]) {
          getActiveSpktDutyDetails(Number(targetOffice.id))
            .then((res) => {
              if (res) {
                setTargetDuties((prev) => ({ ...prev, [targetOffice.id]: res }));
              }
            })
            .catch((e) => console.warn('Gagal memuat kontak piket target:', e));
        }
      }
    });
  }, [overdueItems, findNearestTargetOffice, targetDuties, policeOffices]);

  if (!isMounted) return null;
  if (allBanners.length === 0) return null;

  const activeBanner = allBanners[currentSlideIndex] || allBanners[0];
  if (!activeBanner) return null;

  const renderBanner = (banner: (typeof allBanners)[0]) => {
    if (banner.type === 'transferred') {
      const item = banner.data;
      return (
        <div
          key={`transferred-${item.nomorTiket}`}
          style={{
            backgroundColor: '#451A03',
            border: '2px solid #F59E0B',
            borderRadius: '12px',
            padding: '14px 18px',
            color: '#FFFFFF',
            boxShadow: '0 4px 15px rgba(245, 158, 11, 0.25)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '280px' }}>
              <div
                style={{
                  backgroundColor: '#D97706',
                  borderRadius: '10px',
                  width: '44px',
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',
                  flexShrink: 0,
                }}
              >
                ⚠️
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      backgroundColor: '#B45309',
                      color: '#FFFFFF',
                      fontSize: '11px',
                      fontWeight: 900,
                      padding: '3px 9px',
                      borderRadius: '4px',
                      letterSpacing: '0.05em',
                    }}
                  >
                    DISPOSISI DIALIHKAN (WAKTU RESPON HABIS)
                  </span>
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: 800,
                      fontFamily: 'monospace',
                      color: '#FDE68A',
                    }}
                  >
                    {item.nomorTiket}
                  </span>
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, marginTop: '4px' }}>
                  {item.jenisKejadian} • Dialihkan ke <span style={{ color: '#FCD34D' }}>{item.targetStationName}</span>
                </div>
                <div style={{ fontSize: '12px', color: '#FEF3C7', marginTop: '2px' }}>
                  📍 {item.tkpAlamat} • Kesatuan Anda tidak menerima disposisi dalam batas waktu 3–5 menit, sehingga laporan telah dialihkan ke {item.targetStationName} demi kecepatan penanganan darurat warga.
                </div>
              </div>
            </div>
            <button
              type="button"
              id={`btn-paham-dialihkan-${item.nomorTiket}`}
              onClick={() => handleDismissTransferred(item.nomorTiket)}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
              }}
            >
              <span>✕</span>
              <span>Paham</span>
            </button>
          </div>
        </div>
      );
    }

    if (banner.type === 'overdue') {
      const item = banner.data;
      const isTargetMako = item.isCrossJurisdiction;

      return (
        <div
          key={item.nomorTiket}
          style={{
            backgroundColor: isTargetMako ? '#451A03' : '#450A0A',
            border: isTargetMako ? '2px solid #F59E0B' : '2px solid #EF4444',
            borderRadius: '12px',
            padding: '14px 18px',
            color: '#FFFFFF',
            boxShadow: isTargetMako
              ? '0 10px 25px -3px rgba(245, 158, 11, 0.45)'
              : '0 10px 25px -3px rgba(239, 68, 68, 0.45)',
            animation: 'pulse 1.8s infinite',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '280px' }}>
              <div
                style={{
                  backgroundColor: isTargetMako ? '#D97706' : '#DC2626',
                  borderRadius: '10px',
                  width: '46px',
                  height: '46px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                }}
              >
                {isTargetMako ? '🌐' : '🚨'}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      backgroundColor: isTargetMako ? '#D97706' : '#DC2626',
                      color: '#FFFFFF',
                      fontSize: '11px',
                      fontWeight: 900,
                      padding: '3px 9px',
                      borderRadius: '4px',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {isTargetMako
                      ? `DISPOSISI LINTAS WILAYAH MASUK DARI ${item.sourceStationName.toUpperCase()}`
                      : 'ESKALASI MAKO 110: WAKTU RESPON HABIS'}
                  </span>
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: 800,
                      fontFamily: 'monospace',
                      color: isTargetMako ? '#FCD34D' : '#FCA5A5',
                    }}
                  >
                    {item.nomorTiket}
                  </span>
                  {isTargetMako && (
                    <span
                      style={{
                        backgroundColor: item.diffSec > 0 ? (item.diffSec < 60 ? '#DC2626' : '#1E40AF') : '#991B1B',
                        color: '#FFFFFF',
                        fontSize: '11px',
                        fontWeight: 800,
                        fontFamily: 'monospace',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      {item.diffSec > 0 ? (
                        <>
                          <span>⏱️ Sisa Waktu:</span>
                          <span>
                            {String(Math.floor(item.diffSec / 60)).padStart(2, '0')}:
                            {String(item.diffSec % 60).padStart(2, '0')}
                          </span>
                        </>
                      ) : (
                        <span>⚠️ WAKTU RESPON HABIS</span>
                      )}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, marginTop: '4px' }}>
                  {item.jenisKejadian} •{' '}
                  <span style={{ color: isTargetMako ? '#FDE68A' : '#FCD34D' }}>
                    Wilayah: {item.stationName}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    color: isTargetMako ? '#FEF3C7' : '#FECACA',
                    marginTop: '2px',
                  }}
                >
                  📍 {item.tkpAlamat} •{' '}
                  {isTargetMako
                    ? 'Laporan dialihkan ke kesatuan Anda karena batas wilayah terdekat. Segera terima tugas untuk menghentikan sirine & menyiarkan tugas ke seluruh personil dinas.'
                    : 'Belum ada personel atau Polsek yang menerima penugasan dalam 3–5 menit! Segera alihkan disposisi ke Mako terdekat.'}
                </div>
              </div>
            </div>

            {/* Action Button: Berbeda antara Mako Asal vs Mako Tujuan */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              {isTargetMako ? (
                /* Mako Tujuan (Polresta Batang): Tombol Tunggal [ ⚡ Terima & Disposisikan ] */
                <button
                  id="btn-terima-disposisi-lintas-wilayah"
                  data-testid="btn-terima-disposisi-lintas-wilayah"
                  disabled={acceptingId === String(item.complaint.id)}
                  onClick={() => handleTerimaDisposisiLintasWilayah(item.complaint)}
                  style={{
                    backgroundColor: '#16A34A',
                    color: '#FFFFFF',
                    padding: '10px 18px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 800,
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(22, 163, 74, 0.45)',
                    transition: 'all 0.15s ease',
                    opacity: acceptingId === String(item.complaint.id) ? 0.7 : 1,
                  }}
                >
                  {acceptingId === String(item.complaint.id) ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Menerima Tugas...</span>
                    </>
                  ) : (
                    <>
                      <span>⚡ Terima &amp; Disposisikan</span>
                    </>
                  )}
                </button>
              ) : (
                /* Mako Asal (Polres Pekalongan): Tombol WhatsApp Petugas Piket Hari Ini & Tombol Alihkan Disposisi */
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {/* Tombol WhatsApp koordinasi pelimpahan lintas wilayah ke Mako Tujuan / Terdekat (Opsi C) */}
                  {(() => {
                    const assignedOffice = (policeOffices || []).find((po: any) =>
                      (item.complaint?.station_id && String(po.id) === String(item.complaint.station_id)) ||
                      (po.name && po.name.toLowerCase() === item.stationName?.toLowerCase()) ||
                      (po.station_name && po.station_name.toLowerCase() === item.stationName?.toLowerCase())
                    );
                    const assignedDuty = assignedOffice ? targetDuties[assignedOffice.id] : null;

                    const targetOffice = findNearestTargetOffice(item.complaint);
                    const targetDuty = targetOffice ? targetDuties[targetOffice.id] : null;

                    const contactOffice = assignedOffice || targetOffice;
                    const contactDuty = assignedDuty || targetDuty;
                    const targetStationName =
                      item.stationName || contactOffice?.station_name || contactOffice?.name || 'Mako Kepolisian';
                    const targetKaSpktName = contactDuty?.kaSpktNama || 'Ka SPKT / Petugas Piket';

                    const targetPhone =
                      contactDuty?.kaSpktPhone ||
                      contactDuty?.dutyOfficers?.find((o: any) => o.phone)?.phone ||
                      contactOffice?.phonePiket ||
                      contactOffice?.phone_piket ||
                      item.phonePiket ||
                      '';
                    const cleanPhone = targetPhone ? targetPhone.replace(/\D/g, '') : '';
                    const formattedPhone = cleanPhone
                      ? cleanPhone.startsWith('0')
                        ? '62' + cleanPhone.slice(1)
                        : cleanPhone
                      : null;

                    const waMessage = encodeURIComponent(
                      `🚨 *PERINGATAN ESKALASI TIKET 110 - WAKTU RESPON HABIS*\n\n` +
                        `Yth. ${targetKaSpktName} *${targetStationName}*\n` +
                        `Dari: *Operator CAD 110 (${currentStationName || 'Polres Pekalongan'})*\n\n` +
                        `Pemberitahuan: Tiket laporan darurat warga berikut belum menerima konfirmasi penerimaan penugasan di lapangan dalam batas waktu 3–5 menit:\n\n` +
                        `• Nomor Tiket: *${item.nomorTiket}*\n` +
                        `• Kejadian: ${item.jenisKejadian}\n` +
                        `• TKP: ${item.tkpAlamat}\n` +
                        `• Urgensi: ${item.urgensi}\n\n` +
                        `Mohon segera instruksikan personil piket untuk menerima penugasan di aplikasi, atau konfirmasikan kesiapan jika laporan ini perlu dialihkan ke kesatuan Mako terdekat demi keselamatan warga. Terima kasih!`
                    );

                    const waLink = formattedPhone ? `https://wa.me/${formattedPhone}?text=${waMessage}` : null;

                    return waLink ? (
                      <a
                        id={`btn-wa-spkt-${item.nomorTiket}`}
                        data-testid="btn-wa-spkt"
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`Kirim pesan WhatsApp koordinasi ke ${targetKaSpktName} (${targetStationName})`}
                        style={{
                          backgroundColor: '#2563EB',
                          color: '#FFFFFF',
                          padding: '10px 16px',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: 800,
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '7px',
                          boxShadow: '0 4px 14px rgba(37, 99, 235, 0.45)',
                          transition: 'all 0.15s ease',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <MessageSquare size={16} />
                        <span>Hubungi Operator</span>
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          const inputPhone = prompt(
                            `Nomor WhatsApp piket ${targetStationName} (${targetKaSpktName}) belum tersimpan di master data.\n\nMasukkan nomor WhatsApp piket ${targetStationName} untuk membuka chat koordinasi otomatis:`,
                            '08'
                          );
                          if (inputPhone && inputPhone.trim()) {
                            const clean = inputPhone.replace(/\D/g, '');
                            const fPhone = clean.startsWith('0') ? '62' + clean.slice(1) : clean;
                            window.open(`https://wa.me/${fPhone}?text=${waMessage}`, '_blank');
                          }
                        }}
                        title={`Kirim pesan WhatsApp koordinasi ke piket ${targetStationName}`}
                        style={{
                          backgroundColor: '#2563EB',
                          color: '#FFFFFF',
                          padding: '10px 16px',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: 800,
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '7px',
                          boxShadow: '0 4px 14px rgba(37, 99, 235, 0.45)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <MessageSquare size={16} />
                        <span>Hubungi Operator</span>
                      </button>
                    );
                  })()}

                  {/* Tombol Alihkan Disposisi Lintas Wilayah */}
                  {onOpenDisposisiLintasWilayah && (
                    <button
                      id="btn-alihkan-disposisi-lintas-wilayah"
                      data-testid="btn-alihkan-disposisi-lintas-wilayah"
                      onClick={() => onOpenDisposisiLintasWilayah(item.complaint)}
                      style={{
                        backgroundColor: '#EA580C',
                        color: '#FFFFFF',
                        padding: '10px 18px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: 800,
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 4px 14px rgba(234, 88, 12, 0.4)',
                        transition: 'all 0.15s ease',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <span>🔄 Alihkan</span>
                      <ChevronRight size={16} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (banner.type === 'countdown') {
      const item = banner.data;
      const m = Math.floor(item.diffSec / 60);
      const s = item.diffSec % 60;
      const timeFormatted = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

      return (
        <div
          key={item.nomorTiket}
          style={{
            backgroundColor: '#1E293B',
            border: '1px solid #3B82F6',
            borderRadius: '10px',
            padding: '10px 16px',
            color: '#F8FAFC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '18px' }}>⏱️</span>
            <div>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#38BDF8' }}>
                Menunggu Respon Lapangan: {item.nomorTiket}
              </span>
              <span style={{ fontSize: '12px', color: '#94A3B8', marginLeft: '8px' }}>
                ({item.jenisKejadian} • Wilayah {item.stationName})
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '12px', color: '#CBD5E1' }}>Sisa Waktu Respon Target:</span>
            <span
              style={{
                backgroundColor: item.diffSec < 60 ? '#DC2626' : '#1E40AF',
                color: '#FFFFFF',
                padding: '4px 10px',
                borderRadius: '6px',
                fontFamily: 'monospace',
                fontWeight: 800,
                fontSize: '14px',
              }}
            >
              {timeFormatted}
            </span>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      style={{
        marginBottom: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      {/* Jika ada lebih dari 1 alarm banner, tampilkan panel kontrol Slider/Carousel ringkas */}
      {allBanners.length > 1 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 12px',
            backgroundColor: '#FFF1F2',
            border: '1px solid #FECDD3',
            borderRadius: '10px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          {/* Label status kiri */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#DC2626',
                color: '#FFFFFF',
                fontSize: '11px',
                fontWeight: 900,
                padding: '2px 8px',
                borderRadius: '6px',
                letterSpacing: '0.04em',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#FFFFFF',
                  display: 'inline-block',
                }}
              />
              <span>ALARM AKTIF ({allBanners.length} TIKET)</span>
            </span>
            <span style={{ fontSize: '12px', color: '#475569', fontWeight: 600 }}>
              {isPaused ? (
                <span style={{ color: '#D97706', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  ⏸️ <span>Dijeda (Kursor Aktif)</span>
                </span>
              ) : (
                <span style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  ▶ <span>Bergulir Otomatis (7s)</span>
                </span>
              )}
            </span>
          </div>

          {/* Navigasi kanan (Dots, Counter, Tombol Prev/Next) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Indikator Dots / Pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              {allBanners.map((b, idx) => {
                const isActive = idx === currentSlideIndex;
                const dotColor =
                  b.type === 'overdue'
                    ? '#DC2626'
                    : b.type === 'transferred'
                    ? '#D97706'
                    : '#2563EB';

                return (
                  <button
                    key={b.key}
                    type="button"
                    onClick={() => setCurrentSlideIndex(idx)}
                    title={`Tiket ${b.data.nomorTiket} (${idx + 1} dari ${allBanners.length})`}
                    style={{
                      width: isActive ? '20px' : '7px',
                      height: '7px',
                      borderRadius: '4px',
                      backgroundColor: isActive ? dotColor : '#CBD5E1',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      transition: 'all 0.25s ease',
                    }}
                  />
                );
              })}
            </div>

            {/* Badge angka tiket */}
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: '12px',
                fontWeight: 800,
                color: '#1E293B',
                backgroundColor: '#FFFFFF',
                padding: '2px 8px',
                borderRadius: '6px',
                border: '1px solid #E2E8F0',
              }}
            >
              {currentSlideIndex + 1} / {allBanners.length}
            </span>

            {/* Tombol Panah Prev / Next */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                type="button"
                id="btn-prev-alarm-slide"
                onClick={handlePrevSlide}
                title="Peringatan Tiket Sebelumnya"
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  borderRadius: '6px',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#1E293B',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  transition: 'all 0.15s ease',
                }}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                id="btn-next-alarm-slide"
                onClick={handleNextSlide}
                title="Peringatan Tiket Selanjutnya"
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  borderRadius: '6px',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#1E293B',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  transition: 'all 0.15s ease',
                }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Render Banner Tunggal Aktif */}
      <div key={activeBanner.key} style={{ transition: 'all 0.2s ease-in-out' }}>
        {renderBanner(activeBanner)}
      </div>
    </div>
  );
}
