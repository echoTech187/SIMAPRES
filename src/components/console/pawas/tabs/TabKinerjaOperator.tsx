'use client';

import React, { useState, useMemo } from 'react';
import { parseDateSafe } from '@/lib/date-utils';
import { Award, Star, Clock, Headphones, CheckCircle, TrendingUp, Calendar, RefreshCw, MessageSquare, ClipboardList, ShieldCheck } from 'lucide-react';
import { PawasTab } from '../types';
import { evaluate5W1HHeuristic } from '@/domain/rules/cad-5w1h.rules';
import MasterTabShell from '@/components/ui/MasterTabShell';
import ModalDetailTiket from '../modals/ModalDetailTiket';

export interface TabKinerjaOperatorProps {
  userProfile: any;
  allRecentComplaints: any[];
  operatorRankings?: any;
  switchTab: (tab: PawasTab) => void;
  escalationBanner?: React.ReactNode;
}

const getLocalTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function TabKinerjaOperator({
  userProfile,
  allRecentComplaints = [],
  operatorRankings,
  switchTab,
  escalationBanner,
}: TabKinerjaOperatorProps) {
  const [kinerjaPeriod, setKinerjaPeriod] = useState<'harian' | 'mingguan' | 'bulanan'>('harian');
  const [kinerjaDate, setKinerjaDate] = useState(() => getLocalTodayDateString());
  const [activeSubTab, setActiveSubTab] = useState<'log-tiket' | 'leaderboard' | 'ulasan'>('log-tiket');
  const [rankingCategory, setRankingCategory] = useState<'kualitas' | 'produktivitas' | 'kepuasan'>('kualitas');
  const [selectedTicketComplaint, setSelectedTicketComplaint] = useState<any | null>(null);

  // Helper untuk mengekstrak objek tanggal valid dari aduan
  const getComplaintDate = (c: any): Date | null => {
    const raw = c.createdAt ? c.createdAt : (c.created_at ? c.created_at : null);
    if (!raw) return null;
    return parseDateSafe(raw);
  };

  // Safe parse tanggal yang dipilih dari input kalender tanpa pergeseran UTC
  const selectedDateObj = useMemo(() => {
    if (!kinerjaDate) return new Date();
    const parts = kinerjaDate.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day, 12, 0, 0);
      return isNaN(d.getTime()) ? new Date() : d;
    }
    const d = new Date(kinerjaDate + 'T00:00:00');
    return isNaN(d.getTime()) ? new Date() : d;
  }, [kinerjaDate]);

  // Label badge dinamis untuk header
  const periodBadgeText = useMemo(() => {
    const formattedDate = selectedDateObj.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const formattedMonth = selectedDateObj.toLocaleDateString('id-ID', {
      month: 'long',
      year: 'numeric',
    });

    if (kinerjaPeriod === 'harian') {
      return `JURNAL PIKET SHIFT • ${formattedDate.toUpperCase()}`;
    }
    if (kinerjaPeriod === 'mingguan') {
      return `ANEV MINGGUAN (7 HARI S/D ${formattedDate.toUpperCase()})`;
    }
    return `ANEV BULANAN (30 HARI S/D ${formattedDate.toUpperCase()})`;
  }, [kinerjaPeriod, selectedDateObj]);

  const periodSummaryLabel = useMemo(() => {
    const formattedDate = selectedDateObj.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const formattedMonth = selectedDateObj.toLocaleDateString('id-ID', {
      month: 'long',
      year: 'numeric',
    });

    if (kinerjaPeriod === 'harian') {
      return `Piket Shift (${formattedDate})`;
    }
    if (kinerjaPeriod === 'mingguan') {
      return `7 Hari Terakhir (s/d ${formattedDate})`;
    }
    return `30 Hari Terakhir (s/d ${formattedDate})`;
  }, [kinerjaPeriod, selectedDateObj]);

  // FILTER DINAMIS: Menyaring allRecentComplaints sesuai kinerjaPeriod dan kinerjaDate
  const filteredComplaints = useMemo(() => {
    if (!Array.isArray(allRecentComplaints) || allRecentComplaints.length === 0) {
      return [];
    }

    const selYear = selectedDateObj.getFullYear();
    const selMonth = selectedDateObj.getMonth();
    const selDate = selectedDateObj.getDate();

    if (kinerjaPeriod === 'harian') {
      const startOfDay = new Date(selYear, selMonth, selDate, 0, 0, 0, 0).getTime();
      const endOfDay = new Date(selYear, selMonth, selDate, 23, 59, 59, 999).getTime();

      return allRecentComplaints.filter((c) => {
        const d = getComplaintDate(c);
        if (!d) return false;
        const time = d.getTime();
        return time >= startOfDay && time <= endOfDay;
      });
    }

    if (kinerjaPeriod === 'mingguan') {
      const endOfWeek = new Date(selYear, selMonth, selDate, 23, 59, 59, 999).getTime();
      const startOfWeek = new Date(selYear, selMonth, selDate - 6, 0, 0, 0, 0).getTime();

      return allRecentComplaints.filter((c) => {
        const d = getComplaintDate(c);
        if (!d) return false;
        const time = d.getTime();
        return time >= startOfWeek && time <= endOfWeek;
      });
    }

    if (kinerjaPeriod === 'bulanan') {
      const endOfPeriod = new Date(selYear, selMonth, selDate, 23, 59, 59, 999).getTime();
      const startOfPeriod = new Date(selYear, selMonth, selDate - 29, 0, 0, 0, 0).getTime();

      return allRecentComplaints.filter((c) => {
        const d = getComplaintDate(c);
        if (!d) return false;
        const time = d.getTime();
        return time >= startOfPeriod && time <= endOfPeriod;
      });
    }

    return allRecentComplaints;
  }, [allRecentComplaints, kinerjaPeriod, selectedDateObj]);

  // Operator list dynamically scored
  const rankedOperators = useMemo(() => {
    const rawList = operatorRankings?.overallRanking || [];
    if (rawList.length === 0) return [];

    return rawList.map((item: any) => {
      const opComplaints = filteredComplaints.filter((c: any) =>
        String(c.operatorId) === String(item.operatorId) ||
        String(c.operator_id) === String(item.operatorId) ||
        (c.operator && String(c.operator.id) === String(item.operatorId))
      );

      const totalTiketInput = opComplaints.length;
      const totalDisposisi = opComplaints.filter((c: any) => c.status !== 'MENUNGGU').length;
      const totalSelesai = opComplaints.filter((c: any) => c.status === 'SELESAI').length;
      const validTiketCount = opComplaints.filter((c: any) => c.status !== 'DITOLAK').length;
      const validRate = totalTiketInput > 0 ? Math.round((validTiketCount / totalTiketInput) * 100) : 100;

      const stars = opComplaints
        .map((c: any) => {
          const feedbackTags =
            c.citizenTags ||
            c.citizenReviewRel?.feedback_tags ||
            c.citizen_review_rel?.feedback_tags ||
            '';
          const isFieldOfficer =
            feedbackTags.includes('Police Care') ||
            feedbackTags.includes('Humanis') ||
            feedbackTags.includes('Transparansi');
          const isOperator =
            feedbackTags.includes('[Skor Operator:') ||
            feedbackTags.includes('Respon Cepat') ||
            feedbackTags.includes('Ramah');
          if (isFieldOfficer && !isOperator) return null;

          return c.citizenRating != null
            ? Number(c.citizenRating)
            : c.citizenReviewRel?.star_rating != null
            ? Number(c.citizenReviewRel.star_rating)
            : c.citizen_review_rel?.star_rating != null
            ? Number(c.citizen_review_rel.star_rating)
            : null;
        })
        .filter(Boolean);
      const avgRating = stars.length > 0
        ? Math.round((stars.reduce((a: number, b: any) => a + Number(b), 0) / stars.length) * 10) / 10
        : 0;

      // Evaluasi 5W+1H Standar Kedinasan Polri untuk setiap tiket operator
      const evaluatedComplaints = opComplaints.map((c: any) => {
        const ringkasanKeterangan = c.ringkasanKeterangan || c.ringkasan_keterangan || '';
        const subkasusNama = c.jenisKejadian || c.jenis_kejadian || c.subkasusNama || c.subcategory?.name || '';
        const tkpAlamat = c.tkpAlamat || c.tkp_alamat || c.alamat || '';
        const hasGps = Boolean((c.latitude && c.longitude) || (c.tkpLatitude && c.tkpLongitude));
        const pelaporNama = c.pelaporNama || c.pelapor_nama || '';
        const pelaporHp = c.pelaporHp || c.pelapor_hp || '';

        const eval5W1H = evaluate5W1HHeuristic({
          ringkasanKeterangan,
          subkasusNama,
          tkpAlamat,
          hasGps,
          pelaporNama,
          pelaporHp,
        });

        return {
          ...c,
          eval5W1H,
        };
      });

      const avg5W1HQuality = totalTiketInput > 0
        ? Math.round(evaluatedComplaints.reduce((acc: number, cur: any) => acc + cur.eval5W1H.score, 0) / totalTiketInput)
        : 0;

      const sopCompliant = evaluatedComplaints.filter((c: any) => c.eval5W1H.score >= 70).length;
      const sopComplianceRate = totalTiketInput > 0
        ? Math.round((sopCompliant / totalTiketInput) * 100)
        : 0;

      // FORMULA MUTU INDEPENDEN OPERATOR CAD:
      // Kualitas Narasi 5W+1H (40%), Ketuntasan Disposisi Antrean (30%), Validitas Tiket (15%), IKM Warga (15%)
      let compositeScore = 0;
      let predikat = 'Siaga (Belum Ada Tiket)';
      let predikatColor = '#64748B';

      if (totalTiketInput > 0) {
        // 1. Kualitas Data Entri 5W+1H Kedinasan (40 Poin)
        const qualityScore = Math.round((avg5W1HQuality / 100) * 40);
        // 2. Ketuntasan Disposisi & Distribusi Taktis (30 Poin)
        const dispositionRate = Math.round((totalDisposisi / totalTiketInput) * 100);
        const dispositionScore = Math.round((dispositionRate / 100) * 30);
        // 3. Validitas Penyaluran Tiket (Bukan Ditolak/Spam) (15 Poin)
        const validScore = Math.round((validRate / 100) * 15);
        // 4. Rating Kepuasan Pelayanan Warga (15 Poin)
        const ratingScore = avgRating > 0 ? Math.round((avgRating / 5) * 15) : 12;

        compositeScore = Math.min(100, Math.round(qualityScore + dispositionScore + validScore + ratingScore));

        if (compositeScore >= 90) {
          predikat = 'Operator Teladan 110';
          predikatColor = '#059669';
        } else if (compositeScore >= 75) {
          predikat = 'Pelayanan Baik';
          predikatColor = '#2563EB';
        } else if (compositeScore >= 60) {
          predikat = 'Cukup (Siaga Standar)';
          predikatColor = '#D97706';
        } else {
          predikat = 'Perlu Evaluasi Kedinasan';
          predikatColor = '#DC2626';
        }
      }

      return {
        ...item,
        totalTiketInput,
        totalDisposisi,
        totalSelesai,
        validTiketCount,
        validRate,
        sopComplianceRate,
        avg5W1HQuality,
        avgRating,
        totalReviews: stars.length,
        compositeScore,
        predikat,
        predikatColor,
      };
    }).sort((a: any, b: any) => {
      // Petugas yang memiliki tiket aktif selalu di atas petugas dengan 0 tiket
      const aHasTickets = a.totalTiketInput > 0 ? 1 : 0;
      const bHasTickets = b.totalTiketInput > 0 ? 1 : 0;
      if (bHasTickets !== aHasTickets) {
        return bHasTickets - aHasTickets;
      }

      if (rankingCategory === 'kualitas') {
        if (b.avg5W1HQuality !== a.avg5W1HQuality) {
          return b.avg5W1HQuality - a.avg5W1HQuality;
        }
        return b.compositeScore - a.compositeScore;
      }
      if (rankingCategory === 'produktivitas') {
        if (b.totalTiketInput !== a.totalTiketInput) {
          return b.totalTiketInput - a.totalTiketInput;
        }
        return b.compositeScore - a.compositeScore;
      }
      if (b.avgRating !== a.avgRating) {
        return b.avgRating - a.avgRating;
      }
      return b.totalReviews - a.totalReviews;
    });
  }, [operatorRankings, rankingCategory, filteredComplaints]);

  // Tiket yang diinput oleh operator yang sedang login pada periode terpilih
  const myComplaints = useMemo(() => {
    const currentNrp = userProfile?.nrp || userProfile?.identifier;
    const currentName = userProfile?.fullName || userProfile?.nama || '';
    const currentUserId = userProfile?.id != null ? String(userProfile.id) : null;

    return filteredComplaints.filter((c: any) => {
      const opId = c.operatorId || c.operator_id || (c.operator && c.operator.id);
      const matchId = currentUserId && opId && String(opId) === currentUserId;
      const matchNrp = currentNrp && (
        c.operator?.identifier === currentNrp ||
        c.operatorIdentifier === currentNrp ||
        c.operator_identifier === currentNrp
      );
      const opName = c.operator?.namaLengkap || c.operator?.full_name || c.operator?.nama;
      const matchName = currentName && opName && opName.toLowerCase().includes(currentName.toLowerCase());
      return Boolean(matchId || matchNrp || matchName);
    }).map((c: any) => {
      const ringkasanKeterangan = c.ringkasanKeterangan || c.ringkasan_keterangan || '';
      const subkasusNama = c.jenisKejadian || c.jenis_kejadian || c.subkasusNama || c.subcategory?.name || '';
      const tkpAlamat = c.tkpAlamat || c.tkp_alamat || c.alamat || '';
      const hasGps = Boolean((c.latitude && c.longitude) || (c.tkpLatitude && c.tkpLongitude));
      const pelaporNama = c.pelaporNama || c.pelapor_nama || '';
      const pelaporHp = c.pelaporHp || c.pelapor_hp || '';

      const eval5W1H = evaluate5W1HHeuristic({
        ringkasanKeterangan,
        subkasusNama,
        tkpAlamat,
        hasGps,
        pelaporNama,
        pelaporHp,
      });

      return {
        ...c,
        eval5W1H,
      };
    });
  }, [filteredComplaints, userProfile]);

  // Current logged in operator's rank and stats
  const currentOpStats = useMemo(() => {
    const currentNrp = userProfile?.nrp || userProfile?.identifier;
    const currentName = userProfile?.fullName || userProfile?.nama || '';
    const currentUserId = userProfile?.id != null ? String(userProfile.id) : null;

    if (rankedOperators.length > 0) {
      const foundIndex = rankedOperators.findIndex(
        (op: any) =>
          (currentUserId && String(op.operatorId) === currentUserId) ||
          (currentNrp && op.identifier === currentNrp) ||
          (currentName && op.namaLengkap.toLowerCase().includes(currentName.toLowerCase()))
      );

      if (foundIndex >= 0) {
        return {
          ...rankedOperators[foundIndex],
          rank: foundIndex + 1,
        };
      }
    }

    // Jika tidak ada di ranking (misal baru login atau data 0), bangun mandiri dari myComplaints & userProfile
    const totalTiketInput = myComplaints.length;
    const totalDisposisi = myComplaints.filter((c: any) => c.status !== 'MENUNGGU').length;
    const totalSelesai = myComplaints.filter((c: any) => c.status === 'SELESAI').length;
    const validTiketCount = myComplaints.filter((c: any) => c.status !== 'DITOLAK').length;
    const validRate = totalTiketInput > 0 ? Math.round((validTiketCount / totalTiketInput) * 100) : 100;
    const avg5W1HQuality = totalTiketInput > 0
      ? Math.round(myComplaints.reduce((acc: number, cur: any) => acc + cur.eval5W1H.score, 0) / totalTiketInput)
      : 100;
    const sopComplianceRate = totalTiketInput > 0
      ? Math.round((myComplaints.filter((c: any) => c.eval5W1H.score >= 70).length / totalTiketInput) * 100)
      : 100;

    return {
      operatorId: userProfile?.id || 0,
      namaLengkap: userProfile?.fullName || userProfile?.nama || 'Petugas Operator',
      pangkat: userProfile?.rank || userProfile?.pangkat || 'Aiptu',
      identifier: currentNrp || '-',
      stationName: userProfile?.stationName || 'Polres Pekalongan',
      totalTiketInput,
      totalDisposisi,
      totalSelesai,
      validTiketCount,
      validRate,
      sopComplianceRate,
      avg5W1HQuality,
      avgRating: 0,
      totalReviews: 0,
      compositeScore: totalTiketInput > 0 ? Math.round((avg5W1HQuality * 0.4) + ((totalDisposisi / totalTiketInput) * 30) + (validRate * 0.15) + 12) : 0,
      predikat: totalTiketInput > 0 ? 'Pelayanan Baik' : 'Siaga (Belum Ada Tiket)',
      predikatColor: totalTiketInput > 0 ? '#2563EB' : '#64748B',
      rank: 1,
    };
  }, [rankedOperators, userProfile, myComplaints]);

  // Extract all citizen reviews on complaints
  const citizenReviews = useMemo(() => {
    const list: any[] = [];
    for (const c of filteredComplaints) {
      const starRating =
        c.citizenRating != null
          ? Number(c.citizenRating)
          : c.citizenReviewRel?.star_rating != null
          ? Number(c.citizenReviewRel.star_rating)
          : c.citizen_review_rel?.star_rating != null
          ? Number(c.citizen_review_rel.star_rating)
          : null;

      const rawText =
        c.citizenReview ||
        c.citizenReviewRel?.review_text ||
        c.citizen_review_rel?.review_text ||
        null;

      const feedbackTags =
        c.citizenTags ||
        c.citizenReviewRel?.feedback_tags ||
        c.citizen_review_rel?.feedback_tags ||
        null;

      // Filter: bedakan review untuk Operator 110 vs Personil Lapangan (Patroli)
      const isFieldOfficer = feedbackTags && (
        feedbackTags.includes('Police Care') ||
        feedbackTags.includes('Humanis') ||
        feedbackTags.includes('Transparansi')
      );
      const isOperator = feedbackTags && (
        feedbackTags.includes('[Skor Operator:') ||
        feedbackTags.includes('Respon Cepat') ||
        feedbackTags.includes('Ramah & Sopan') ||
        feedbackTags.includes('Informasi Jelas') ||
        feedbackTags.includes('Tuntas Solutif') ||
        feedbackTags.includes('Overall Prima')
      );

      // Jangan tampilkan ulasan personil lapangan di halaman evaluasi meja operator 110
      if (isFieldOfficer && !isOperator) {
        continue;
      }

      if (starRating !== null || (rawText && String(rawText).trim().length > 0) || (feedbackTags && String(feedbackTags).trim().length > 0)) {
        let displayText = rawText && String(rawText).trim().length > 0 ? String(rawText).trim() : null;
        if (!displayText && feedbackTags) {
          if (feedbackTags.includes('|')) {
            displayText = feedbackTags.split('|')[1].trim();
          } else {
            displayText = feedbackTags.trim();
          }
        }
        if (!displayText) {
          displayText = 'Pelayanan ramah, cepat tanggap dan informasi jelas.';
        }

        list.push({
          id: String(c.id),
          nomorTiket: c.nomorTiket || c.nomor_tiket,
          namaPelapor:
            c.pelaporNama ||
            c.pelapor_nama ||
            c.citizenReviewRel?.reporter_name ||
            c.citizen_review_rel?.reporter_name ||
            'Warga Pekalongan',
          starRating: starRating ? Math.round(Number(starRating)) : 5,
          reviewText: displayText,
          feedbackTags: feedbackTags && feedbackTags !== displayText ? feedbackTags : null,
          createdAt: c.createdAt || c.created_at,
          jenisKejadian: c.jenisKejadian || c.jenis_kejadian,
        });
      }
    }
    return list;
  }, [filteredComplaints]);

  return (
    <div style={{ width: '100%', maxWidth: '1440px', margin: '0 auto', paddingBottom: '30px' }}>
      {/* Header Halaman Kinerja Operator */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 className="page-title" style={{ margin: 0, fontSize: '20px', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🎧</span> Evaluasi &amp; Peringkat Operator SPKT 110
            </h2>
            <span style={{ fontSize: '10.5px', fontWeight: 800, background: '#FEF3C7', color: '#B45309', padding: '3px 9px', borderRadius: '12px', border: '1px solid #FCD34D' }}>
              {periodBadgeText}
            </span>
          </div>
          <div style={{ fontSize: '12px', color: '#64748B', marginTop: '3px' }}>
            Sentra Pelayanan Kepolisian Terpadu (SPKT) • Call Center 110 Polres Pekalongan
          </div>
        </div>

        <button
          type="button"
          onClick={() => switchTab('view-operator')}
          style={{
            padding: '8px 16px',
            background: '#153E75',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 2px 8px rgba(21,62,117,0.2)',
          }}
        >
          <span>←</span> Kembali ke Konsol CAD
        </button>
      </div>

      {/* Banner Alarm Eskalasi (Posisinya dibalik: diletakkan tepat di bawah header) */}
      {escalationBanner}

      {/* FILTER PERIODE & KALENDER DINAMIS */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => {
                setKinerjaPeriod('harian');
                setActiveSubTab('log-tiket');
              }}
              style={{
                padding: '7px 15px',
                borderRadius: '7px',
                border: kinerjaPeriod === 'harian' ? '1px solid #153E75' : '1px solid #CBD5E1',
                background: kinerjaPeriod === 'harian' ? '#153E75' : 'white',
                color: kinerjaPeriod === 'harian' ? 'white' : '#475569',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: kinerjaPeriod === 'harian' ? '0 2px 6px rgba(21,62,117,0.2)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              📋 Piket Shift (Buku Mutasi)
            </button>
            <button
              type="button"
              onClick={() => {
                setKinerjaPeriod('mingguan');
              }}
              style={{
                padding: '7px 15px',
                borderRadius: '7px',
                border: kinerjaPeriod === 'mingguan' ? '1px solid #153E75' : '1px solid #CBD5E1',
                background: kinerjaPeriod === 'mingguan' ? '#153E75' : 'white',
                color: kinerjaPeriod === 'mingguan' ? 'white' : '#475569',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: kinerjaPeriod === 'mingguan' ? '0 2px 6px rgba(21,62,117,0.2)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              Mingguan (7 Hari)
            </button>
            <button
              type="button"
              onClick={() => {
                setKinerjaPeriod('bulanan');
              }}
              style={{
                padding: '7px 15px',
                borderRadius: '7px',
                border: kinerjaPeriod === 'bulanan' ? '1px solid #153E75' : '1px solid #CBD5E1',
                background: kinerjaPeriod === 'bulanan' ? '#153E75' : 'white',
                color: kinerjaPeriod === 'bulanan' ? 'white' : '#475569',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: kinerjaPeriod === 'bulanan' ? '0 2px 6px rgba(21,62,117,0.2)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              Bulanan (30 Hari)
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B' }}>Tanggal Rujukan:</span>
            <input
              type="date"
              value={kinerjaDate}
              onChange={(e) => setKinerjaDate(e.target.value)}
              style={{
                padding: '7px 12px',
                fontSize: '12px',
                border: '1.5px solid #153E75',
                borderRadius: '7px',
                fontWeight: 800,
                color: '#153E75',
                background: '#F8FAFC',
                cursor: 'pointer',
              }}
            />
            {kinerjaDate !== getLocalTodayDateString() && (
              <button
                type="button"
                onClick={() => setKinerjaDate(getLocalTodayDateString())}
                title="Kembalikan ke tanggal hari ini"
                style={{
                  padding: '7px 10px',
                  background: '#F1F5F9',
                  border: '1px solid #CBD5E1',
                  borderRadius: '7px',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#153E75',
                  cursor: 'pointer',
                }}
              >
                🔄 Hari Ini
              </button>
            )}
          </div>
        </div>

        <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #F1F5F9', fontSize: '11px', color: '#475569' }}>
          🔍 {kinerjaPeriod === 'harian' ? 'Menampilkan rekapitulasi tugas piket shift serah terima:' : 'Menampilkan evaluasi operasional Anev:'} <strong>{periodSummaryLabel}</strong> • Terdata <strong>{filteredComplaints.length} Aduan</strong>
        </div>
      </div>

      {/* HERO SECTION: REKAM JEJAK OPERATOR SAAT INI */}
      {currentOpStats && (
        <div
          style={{
            background: 'linear-gradient(135deg, #1E3A8A 0%, #0F172A 100%)',
            color: 'white',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '18px',
            boxShadow: '0 8px 24px rgba(15,23,42,0.25)',
            border: '1px solid #334155',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: '#38BDF8',
                  color: '#0F172A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  fontWeight: 900,
                  boxShadow: '0 4px 12px rgba(56,189,248,0.4)',
                }}
              >
                🎧
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '-0.2px' }}>
                    {currentOpStats.namaLengkap}
                  </span>
                  {kinerjaPeriod !== 'harian' && (
                    <span style={{ fontSize: '10px', background: currentOpStats.predikatColor, color: 'white', padding: '2px 8px', borderRadius: '4px', fontWeight: 800 }}>
                      {currentOpStats.predikat}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '11.5px', color: '#94A3B8', marginTop: '2px' }}>
                  NRP: <strong style={{ color: '#F1F5F9' }}>{currentOpStats.identifier}</strong> • {currentOpStats.stationName}
                </div>
              </div>
            </div>

            {kinerjaPeriod === 'harian' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    padding: '8px 14px',
                    borderRadius: '10px',
                    textAlign: 'center',
                    border: '1px solid rgba(255,255,255,0.15)',
                  }}
                >
                  <div style={{ fontSize: '10.5px', color: '#94A3B8' }}>Status Penugasan</div>
                  <div style={{ fontSize: '15px', fontWeight: 900, color: '#34D399', marginTop: '2px' }}>
                    👮‍♂️ SIAGA PIKET AKTIF
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    padding: '8px 14px',
                    borderRadius: '10px',
                    textAlign: 'center',
                    border: '1px solid rgba(255,255,255,0.15)',
                  }}
                >
                  <div style={{ fontSize: '10.5px', color: '#94A3B8' }}>Peringkat Sentra 110</div>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: '#FDE047' }}>
                    #{currentOpStats.rank} <span style={{ fontSize: '12px', color: '#94A3B8' }}>/ {rankedOperators.length}</span>
                  </div>
                </div>
                <div
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    padding: '8px 14px',
                    borderRadius: '10px',
                    textAlign: 'center',
                    border: '1px solid rgba(255,255,255,0.15)',
                  }}
                >
                  <div style={{ fontSize: '10.5px', color: '#94A3B8' }}>Skor Komposit Anev</div>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: '#38BDF8' }}>
                    {currentOpStats.compositeScore} <span style={{ fontSize: '12px', color: '#94A3B8' }}>/ 100</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 4 Cards Ringkasan Kinerja Pribadi */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '10px', padding: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '11px', color: '#94A3B8' }}>Tiket CAD Diinput</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#F8FAFC', marginTop: '2px' }}>
                {currentOpStats.totalTiketInput} Laporan
              </div>
              <div style={{ fontSize: '10px', color: '#34D399', marginTop: '2px' }}>
                ✓ {currentOpStats.totalDisposisi} Terdisposisi Taktis
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '10px', padding: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '11px', color: '#94A3B8' }}>Penyaluran Tiket Valid</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: currentOpStats.totalTiketInput > 0 ? '#38BDF8' : '#94A3B8', marginTop: '2px' }}>
                {currentOpStats.totalTiketInput > 0 ? `${currentOpStats.validRate != null ? currentOpStats.validRate : 100}%` : '-'}
              </div>
              <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '2px' }}>
                Bukan Tiket Batal / Ditolak
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '10px', padding: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '11px', color: '#94A3B8' }}>Kelengkapan Entri 5W+1H</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: currentOpStats.totalTiketInput > 0 ? (currentOpStats.avg5W1HQuality >= 80 ? '#34D399' : '#FBBF24') : '#94A3B8', marginTop: '2px' }}>
                {currentOpStats.totalTiketInput > 0 ? `${currentOpStats.avg5W1HQuality || 100}%` : '-'}
              </div>
              <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '2px' }}>
                Standar Formal Kedinasan Polri
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '10px', padding: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '11px', color: '#94A3B8' }}>Tindak Lanjut Lapangan</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#F8FAFC', marginTop: '2px' }}>
                {currentOpStats.totalSelesai} Selesai
              </div>
              <div style={{ fontSize: '10px', color: '#38BDF8', marginTop: '2px' }}>
                {currentOpStats.totalTiketInput - currentOpStats.totalSelesai} Sedang Berjalan
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MASTER SUB-TAB: BUKU LOG TIKET SAYA VS LEADERBOARD VS ULASAN WARGA */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '2px solid #E2E8F0', paddingBottom: '8px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setActiveSubTab('log-tiket')}
          style={{
            padding: '8px 18px',
            fontSize: '12.5px',
            fontWeight: 800,
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            background: activeSubTab === 'log-tiket' ? '#153E75' : '#F1F5F9',
            color: activeSubTab === 'log-tiket' ? 'white' : '#64748B',
            transition: 'all 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: activeSubTab === 'log-tiket' ? '0 2px 6px rgba(21,62,117,0.2)' : 'none',
          }}
        >
          <span>📋</span>
          <span>Buku Rekap &amp; Log Tiket Saya ({myComplaints.length})</span>
        </button>

        {/* Tab Komparasi Peringkat hanya relevan untuk Evaluasi Berkala (Mingguan / Bulanan) */}
        {kinerjaPeriod !== 'harian' && (
          <button
            type="button"
            onClick={() => setActiveSubTab('leaderboard')}
            style={{
              padding: '8px 18px',
              fontSize: '12.5px',
              fontWeight: 800,
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              background: activeSubTab === 'leaderboard' ? '#153E75' : '#F1F5F9',
              color: activeSubTab === 'leaderboard' ? 'white' : '#64748B',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: activeSubTab === 'leaderboard' ? '0 2px 6px rgba(21,62,117,0.2)' : 'none',
            }}
          >
            <span>🏆</span>
            <span>Komparasi Regu Operator Sentra 110</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveSubTab('ulasan')}
          style={{
            padding: '8px 18px',
            fontSize: '12.5px',
            fontWeight: 800,
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            background: activeSubTab === 'ulasan' ? '#153E75' : '#F1F5F9',
            color: activeSubTab === 'ulasan' ? 'white' : '#64748B',
            transition: 'all 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: activeSubTab === 'ulasan' ? '0 2px 6px rgba(21,62,117,0.2)' : 'none',
          }}
        >
          <span>💬</span>
          <span>Ulasan &amp; Rating Warga ({citizenReviews.length})</span>
        </button>
      </div>

      {/* VIEW 0: BUKU REKAP & LOG TIKET OPERATOR (SERAH TERIMA PIKET) */}
      {activeSubTab === 'log-tiket' && (
        <MasterTabShell
          config={{
            title: 'Buku Catatan Entri Laporan CAD Pribadi',
            desc: `Daftar tiket yang diinput dan ditangani oleh ${currentOpStats.namaLengkap} untuk arsip mutasi dan serah terima dinas jaga SPKT (${periodSummaryLabel}).`,
            icon: '📋',
          }}
          dataList={myComplaints}
          readOnly={true}
          showActiveFilter={false}
          extraSearchFields={(c: any) => [
            c.nomorTiket,
            c.nomor_tiket,
            c.pelaporNama,
            c.pelapor_nama,
            c.pelaporHp,
            c.jenisKejadian,
            c.tkpAlamat,
            c.ringkasanKeterangan,
          ]}
          tableColumns={[
            {
              header: 'No. Tiket & Waktu',
              width: '160px',
              render: (c: any) => {
                const ticketNo = c.nomorTiket || c.nomor_tiket || `CAD-${c.id}`;
                const cDate = getComplaintDate(c);
                const timeStr = cDate ? cDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB' : '-';
                const dateStr = cDate ? cDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-';
                return (
                  <div>
                    <button
                      type="button"
                      onClick={() => setSelectedTicketComplaint(c)}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        fontFamily: 'monospace',
                        fontWeight: 800,
                        color: '#1D4ED8',
                        textDecoration: 'underline',
                        textAlign: 'left',
                        display: 'inline-block',
                      }}
                      title="Klik untuk melihat detail lengkap tiket"
                    >
                      {ticketNo}
                    </button>
                    <div style={{ fontSize: '10px', color: '#64748B' }}>
                      {dateStr} • {timeStr}
                    </div>
                  </div>
                );
              },
            },
            {
              header: 'Pelapor',
              width: '150px',
              render: (c: any) => {
                const pelapor = c.pelaporNama || c.pelapor_nama || 'Warga (Anonim)';
                const pelaporPhone = c.pelaporHp || c.pelapor_hp || '-';
                return (
                  <div>
                    <div style={{ fontWeight: 700, color: '#1E293B' }}>{pelapor}</div>
                    <div style={{ fontSize: '10.5px', color: '#64748B' }}>{pelaporPhone}</div>
                  </div>
                );
              },
            },
            {
              header: 'Subkasus & Lokasi TKP',
              width: '200px',
              render: (c: any) => {
                const subkasus = c.jenisKejadian || c.jenis_kejadian || c.subkasusNama || 'Laporan Umum';
                const alamat = c.tkpAlamat || c.tkp_alamat || c.alamat || 'Area Hukum Pekalongan';
                return (
                  <div>
                    <div style={{ fontWeight: 800, color: '#0369A1' }}>{subkasus}</div>
                    <div style={{ fontSize: '10.5px', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }} title={alamat}>
                      📍 {alamat}
                    </div>
                  </div>
                );
              },
            },
            {
              header: 'Narasi Keterangan Kejadian',
              width: '280px',
              render: (c: any) => {
                const narasi = c.ringkasanKeterangan || c.ringkasan_keterangan || '-';
                return (
                  <div style={{ fontSize: '11px', color: '#334155', fontStyle: 'italic', maxWidth: '280px', lineHeight: 1.4 }} title={narasi}>
                    &ldquo;{narasi.length > 90 ? `${narasi.substring(0, 90)}...` : narasi}&rdquo;
                  </div>
                );
              },
            },
            {
              header: 'Unit Disposisi',
              width: '110px',
              align: 'center',
              render: (c: any) => (
                <span style={{ fontSize: '11px', fontWeight: 700, color: c.assignedToUnit || c.assigned_to_unit ? '#1D4ED8' : '#64748B' }}>
                  {c.assignedToUnit || c.assigned_to_unit || 'Terdistribusi'}
                </span>
              ),
            },
            {
              header: 'Status Tindak Lanjut',
              width: '110px',
              align: 'center',
              render: (c: any) => {
                const status = c.status || 'MENUNGGU';
                let statusBadge = { bg: '#FEF3C7', color: '#B45309', label: status };
                if (status === 'SELESAI') statusBadge = { bg: '#DCFCE7', color: '#15803D', label: 'SELESAI' };
                else if (status === 'DIPROSES') statusBadge = { bg: '#DBEAFE', color: '#1D4ED8', label: 'DIPROSES' };
                else if (status === 'DITOLAK') statusBadge = { bg: '#FEE2E2', color: '#B91C1C', label: 'DITOLAK' };
                return (
                  <span style={{ fontSize: '10px', fontWeight: 800, padding: '3px 8px', borderRadius: '4px', background: statusBadge.bg, color: statusBadge.color }}>
                    {statusBadge.label}
                  </span>
                );
              },
            },
          ]}
        />
      )}

      {/* VIEW 1: LEADERBOARD OPERATOR */}
      {activeSubTab === 'leaderboard' && (
        <MasterTabShell
          config={{
            title: 'Komparasi Kinerja Operator Sentra Layanan 110',
            icon: '🏆',
            desc: `Evaluasi komparatif akuntabilitas petugas call taker antar regu piket SPKT (${periodSummaryLabel}).`,
          }}
          dataList={rankedOperators}
          readOnly={true}
          showActiveFilter={false}
          renderExtraFilters={() => (
            <div style={{ display: 'flex', background: '#F8FAFC', border: '1px solid #CBD5E1', padding: '2px', borderRadius: '8px', gap: '4px' }}>
              <button
                type="button"
                onClick={() => setRankingCategory('kualitas')}
                style={{
                  padding: '5px 12px',
                  fontSize: '11px',
                  fontWeight: 700,
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  background: rankingCategory === 'kualitas' ? '#153E75' : 'transparent',
                  color: rankingCategory === 'kualitas' ? 'white' : '#64748B',
                  transition: 'all 0.15s ease',
                }}
              >
                🛡️ Kualitas 5W+1H CAD
              </button>
              <button
                type="button"
                onClick={() => setRankingCategory('produktivitas')}
                style={{
                  padding: '5px 12px',
                  fontSize: '11px',
                  fontWeight: 700,
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  background: rankingCategory === 'produktivitas' ? '#153E75' : 'transparent',
                  color: rankingCategory === 'produktivitas' ? 'white' : '#64748B',
                  transition: 'all 0.15s ease',
                }}
              >
                ⚡ Volume Tiket CAD
              </button>
              <button
                type="button"
                onClick={() => setRankingCategory('kepuasan')}
                style={{
                  padding: '5px 12px',
                  fontSize: '11px',
                  fontWeight: 700,
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  background: rankingCategory === 'kepuasan' ? '#153E75' : 'transparent',
                  color: rankingCategory === 'kepuasan' ? 'white' : '#64748B',
                  transition: 'all 0.15s ease',
                }}
              >
                ⭐ Kepuasan Warga (IKM)
              </button>
            </div>
          )}
          extraSearchFields={(op: any) => [op.namaLengkap, op.identifier, op.pangkat, op.stationName, op.predikat]}
          rowHighlight={(op: any) => {
            return userProfile?.nrp === op.identifier || userProfile?.identifier === op.identifier || (userProfile?.id != null && String(op.operatorId) === String(userProfile.id));
          }}
          tableColumns={[
            {
              header: 'Petugas Operator',
              width: '200px',
              render: (item: any) => {
                const isCurrent = userProfile?.nrp === item.identifier || userProfile?.identifier === item.identifier || (userProfile?.id != null && String(item.operatorId) === String(userProfile.id));
                return (
                  <div>
                    <div style={{ fontWeight: 800, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span>🎧</span>
                      <span>{item.namaLengkap}</span>
                      {isCurrent && (
                        <span style={{ fontSize: '9px', background: '#16A34A', color: 'white', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>
                          SAYA
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#64748B' }}>
                      NRP: <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{item.identifier}</span>
                    </div>
                  </div>
                );
              },
            },
            {
              header: 'Satuan',
              width: '150px',
              render: (item: any) => (
                <div>
                  <div style={{ fontWeight: 600, color: '#334155' }}>{item.pangkat}</div>
                  <div style={{ fontSize: '10px', color: '#64748B' }}>{item.stationName}</div>
                </div>
              ),
            },
            {
              header: 'Tiket CAD',
              width: '90px',
              align: 'center',
              render: (item: any) => (
                <span style={{ fontWeight: 800, color: '#153E75' }}>
                  {item.totalTiketInput} Tiket
                </span>
              ),
            },
            {
              header: 'Tiket Valid',
              width: '100px',
              align: 'center',
              render: (item: any) => (
                <span style={{ fontWeight: 700, color: item.totalTiketInput > 0 ? '#059669' : '#94A3B8' }}>
                  {item.totalTiketInput > 0 ? `${item.validTiketCount != null ? item.validTiketCount : (item.totalTiketInput || 0)} (${item.validRate != null ? item.validRate : 100}%)` : '-'}
                </span>
              ),
            },
            {
              header: 'Kelengkapan 5W+1H',
              width: '120px',
              align: 'center',
              render: (item: any) => (
                item.totalTiketInput > 0 && item.avg5W1HQuality != null ? (
                  <span style={{ fontSize: '11px', fontWeight: 800, color: item.avg5W1HQuality >= 80 ? '#059669' : '#D97706' }}>
                    {item.avg5W1HQuality}%
                  </span>
                ) : (
                  <span style={{ color: '#94A3B8' }}>-</span>
                )
              ),
            },
            {
              header: 'Kepuasan Warga',
              width: '130px',
              render: (item: any) => (
                item.totalTiketInput > 0 && item.avgRating > 0 ? (
                  <>
                    <div style={{ fontWeight: 800, color: '#D97706', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      ⭐ {item.avgRating.toFixed(1)} / 5.0
                    </div>
                    <div style={{ fontSize: '10px', color: '#64748B' }}>
                      {item.totalReviews > 0 ? `${item.totalReviews} ulasan` : 'Belum ada ulasan'}
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontWeight: 700, color: '#94A3B8' }}>- / 5.0</div>
                    <div style={{ fontSize: '10px', color: '#94A3B8' }}>Belum ada ulasan</div>
                  </>
                )
              ),
            },
            {
              header: 'Skor Mutu',
              width: '85px',
              align: 'center',
              render: (item: any) => (
                item.totalTiketInput > 0 ? (
                  <span style={{ fontSize: '12px', fontWeight: 900, color: '#153E75', background: '#EFF6FF', padding: '3px 8px', borderRadius: '6px' }}>
                    {item.compositeScore}
                  </span>
                ) : (
                  <span style={{ color: '#94A3B8', fontSize: '12px', fontWeight: 700 }}>-</span>
                )
              ),
            },
            {
              header: 'Predikat Kedinasan',
              width: '150px',
              render: (item: any) => (
                <span
                  style={{
                    background: item.predikatColor ? item.predikatColor : '#10B981',
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: 700,
                    display: 'inline-block',
                  }}
                >
                  {item.predikat}
                </span>
              ),
            },
          ]}
        />
      )}

      {/* VIEW 2: ULASAN & FEEDBACK WARGA */}
      {activeSubTab === 'ulasan' && (
        <MasterTabShell
          config={{
            title: 'Ulasan & Feedback Kepuasan Warga',
            icon: '💬',
            desc: `Ulasan langsung dari warga pelapor terkait keramahan operator, kejelasan informasi, dan kecepatan penanganan panggilan darurat 110 (${periodSummaryLabel}).`,
          }}
          dataList={citizenReviews}
          readOnly={true}
          showActiveFilter={false}
          extraSearchFields={(rev: any) => [rev.nomorTiket, rev.namaPelapor, rev.jenisKejadian, rev.reviewText, rev.feedbackTags]}
          tableColumns={[
            {
              header: 'No. Tiket',
              width: '130px',
              render: (rev: any) => {
                const matchedComplaint = myComplaints.find(
                  (c: any) => (c.nomorTiket || c.nomor_tiket) === rev.nomorTiket
                ) || filteredComplaints.find(
                  (c: any) => (c.nomorTiket || c.nomor_tiket) === rev.nomorTiket
                );

                if (matchedComplaint) {
                  return (
                    <button
                      type="button"
                      onClick={() => setSelectedTicketComplaint(matchedComplaint)}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        fontFamily: 'monospace',
                        fontWeight: 800,
                        color: '#1D4ED8',
                        textDecoration: 'underline',
                        textAlign: 'left',
                      }}
                      title="Klik untuk melihat detail lengkap tiket"
                    >
                      {rev.nomorTiket}
                    </button>
                  );
                }

                return (
                  <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#153E75' }}>
                    {rev.nomorTiket}
                  </span>
                );
              },
            },
            {
              header: 'Pelapor & Insiden',
              width: '180px',
              render: (rev: any) => (
                <div>
                  <div style={{ fontWeight: 700, color: '#1E293B' }}>{rev.namaPelapor}</div>
                  <div style={{ fontSize: '10.5px', color: '#0284C7' }}>{rev.jenisKejadian}</div>
                </div>
              ),
            },
            {
              header: 'Rating Warga',
              width: '120px',
              render: (rev: any) => (
                <span style={{ fontWeight: 800, color: '#D97706' }}>
                  {'⭐'.repeat(rev.starRating)} ({rev.starRating}/5)
                </span>
              ),
            },
            {
              header: 'Isi Komentar & Tag',
              width: '320px',
              render: (rev: any) => (
                <div>
                  <div style={{ fontSize: '11px', color: '#334155', fontStyle: 'italic', lineHeight: 1.4 }}>
                    &ldquo;{rev.reviewText}&rdquo;
                  </div>
                  {rev.feedbackTags && rev.feedbackTags !== rev.reviewText && (
                    <div style={{ marginTop: '4px', fontSize: '10px', color: '#0369A1', background: '#F0F9FF', padding: '2px 6px', borderRadius: '4px', border: '1px solid #BAE6FD', display: 'inline-block', fontWeight: 600 }}>
                      🏷️ {rev.feedbackTags}
                    </div>
                  )}
                </div>
              ),
            },
            {
              header: 'Waktu Input',
              width: '130px',
              align: 'right',
              render: (rev: any) => (
                <span style={{ fontSize: '10.5px', color: '#64748B' }}>
                  {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WIB' : 'Hari ini'}
                </span>
              ),
            },
          ]}
        />
      )}

      {/* MODAL DETAIL TIKET */}
      <ModalDetailTiket
        isOpen={selectedTicketComplaint !== null}
        onClose={() => setSelectedTicketComplaint(null)}
        complaint={selectedTicketComplaint}
      />
    </div>
  );
}
