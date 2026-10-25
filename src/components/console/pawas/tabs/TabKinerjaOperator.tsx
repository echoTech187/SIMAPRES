'use client';

import React, { useState, useMemo } from 'react';
import { Award, Star, Clock, Headphones, CheckCircle, TrendingUp, Calendar, RefreshCw, MessageSquare } from 'lucide-react';
import { PawasTab } from '../types';

export interface TabKinerjaOperatorProps {
  userProfile: any;
  allRecentComplaints: any[];
  operatorRankings?: any;
  switchTab: (tab: PawasTab) => void;
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
}: TabKinerjaOperatorProps) {
  const [kinerjaPeriod, setKinerjaPeriod] = useState<'harian' | 'mingguan' | 'bulanan'>('harian');
  const [kinerjaDate, setKinerjaDate] = useState(() => getLocalTodayDateString());
  const [activeSubTab, setActiveSubTab] = useState<'leaderboard' | 'ulasan'>('leaderboard');
  const [rankingCategory, setRankingCategory] = useState<'produktivitas' | 'kepuasan'>('produktivitas');

  // Helper untuk mengekstrak objek tanggal valid dari aduan
  const getComplaintDate = (c: any): Date | null => {
    const raw = c.createdAt ? c.createdAt : (c.created_at ? c.created_at : null);
    if (!raw) return null;
    const d = new Date(raw);
    return isNaN(d.getTime()) ? null : d;
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
      return `PIKET 1X24 JAM • ${formattedDate.toUpperCase()}`;
    }
    if (kinerjaPeriod === 'mingguan') {
      return `ANEV MINGGUAN (7 HARI S/D ${formattedDate.toUpperCase()})`;
    }
    return `ANEV BULANAN (${formattedMonth.toUpperCase()})`;
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
      return `Harian (${formattedDate})`;
    }
    if (kinerjaPeriod === 'mingguan') {
      return `7 Hari Terakhir (s/d ${formattedDate})`;
    }
    return `Bulan ${formattedMonth}`;
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
      return allRecentComplaints.filter((c) => {
        const d = getComplaintDate(c);
        if (!d) return false;
        return d.getFullYear() === selYear && d.getMonth() === selMonth;
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

      const stars = opComplaints
        .map((c: any) => c.citizenRating ? c.citizenRating : (c.citizen_review_rel?.star_rating ? c.citizen_review_rel.star_rating : null))
        .filter(Boolean);
      const avgRating = stars.length > 0
        ? Math.round((stars.reduce((a: number, b: any) => a + Number(b), 0) / stars.length) * 10) / 10
        : 0;

      const sopCompliant = opComplaints.filter((c: any) => c.subcategoryId || c.subcategory_id).length;
      const sopComplianceRate = totalTiketInput > 0
        ? Math.round((sopCompliant / totalTiketInput) * 100)
        : null;

      let avgIntakeMinutes: number | null = null;
      if (totalTiketInput > 0) {
        let totalIntake = 0;
        let intakeCount = 0;
        for (const c of opComplaints) {
          const createTime = getComplaintDate(c)?.getTime();
          const dispTime = c.dispatches && c.dispatches.length > 0 && c.dispatches[0].dispatched_at
            ? new Date(c.dispatches[0].dispatched_at).getTime()
            : null;
          if (createTime && dispTime && dispTime >= createTime) {
            const diffMin = Math.round((dispTime - createTime) / 60000);
            totalIntake += Math.max(1, Math.min(10, diffMin));
            intakeCount++;
          }
        }
        avgIntakeMinutes = intakeCount > 0 ? Math.round((totalIntake / intakeCount) * 10) / 10 : 1.0;
      }

      let compositeScore = 0;
      let predikat = 'Siaga (Belum Ada Tiket)';
      let predikatColor = '#64748B';

      if (totalTiketInput > 0) {
        const effIntake = avgIntakeMinutes != null ? avgIntakeMinutes : 1.0;
        const speedScore = Math.max(10, Math.min(30, Math.round(30 - (effIntake - 1.5) * 5)));
        const volumeScore = Math.min(35, totalTiketInput * 7);
        const ratingScore = avgRating > 0 ? Math.round((avgRating / 5) * 35) : 25;
        compositeScore = Math.max(50, Math.min(100, speedScore + volumeScore + ratingScore));

        if (compositeScore >= 90) {
          predikat = 'Operator Teladan 110';
          predikatColor = '#059669';
        } else if (compositeScore >= 80) {
          predikat = 'Pelayanan Prima';
          predikatColor = '#2563EB';
        } else if (compositeScore < 70) {
          predikat = 'Perlu Evaluasi SOP';
          predikatColor = '#DC2626';
        } else {
          predikat = 'Operator Siaga Standar';
          predikatColor = '#D97706';
        }
      }

      return {
        ...item,
        totalTiketInput,
        totalDisposisi,
        totalSelesai,
        avgIntakeMinutes,
        sopComplianceRate,
        avgRating,
        totalReviews: stars.length,
        compositeScore,
        predikat,
        predikatColor,
      };
    }).sort((a: any, b: any) => {
      if (rankingCategory === 'produktivitas') {
        return b.totalTiketInput - a.totalTiketInput;
      }
      return b.avgRating - a.avgRating;
    });
  }, [operatorRankings, rankingCategory, filteredComplaints]);

  // Current logged in operator's rank and stats
  const currentOpStats = useMemo(() => {
    if (!rankedOperators.length) return null;
    const currentNrp = userProfile?.nrp || userProfile?.identifier;
    const currentName = userProfile?.fullName || userProfile?.nama || '';

    const foundIndex = rankedOperators.findIndex(
      (op: any) =>
        (currentNrp && op.identifier === currentNrp) ||
        (currentName && op.namaLengkap.toLowerCase().includes(currentName.toLowerCase()))
    );

    if (foundIndex >= 0) {
      return {
        ...rankedOperators[foundIndex],
        rank: foundIndex + 1,
      };
    }
    return {
      ...rankedOperators[0],
      rank: 1,
    };
  }, [rankedOperators, userProfile]);

  // Extract all citizen reviews on complaints
  const citizenReviews = useMemo(() => {
    const list: any[] = [];
    for (const c of filteredComplaints) {
      const review = c.citizen_review_rel || (c.citizenReview ? { review_text: c.citizenReview, star_rating: c.citizenRating } : null);
      if (review && (review.review_text || review.star_rating)) {
        list.push({
          id: c.id,
          nomorTiket: c.nomorTiket || c.nomor_tiket,
          namaPelapor: c.pelaporNama || c.pelapor_nama || 'Warga Pekalongan',
          starRating: review.star_rating || c.citizenRating || 5,
          reviewText: review.review_text || 'Pelayanan ramah, tanggap dan informasi jelas.',
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

      {/* FILTER PERIODE & KALENDER DINAMIS */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setKinerjaPeriod('harian')}
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
              Harian (1x24 Jam)
            </button>
            <button
              type="button"
              onClick={() => setKinerjaPeriod('mingguan')}
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
              onClick={() => setKinerjaPeriod('bulanan')}
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
              Bulanan
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
          🔍 Menampilkan evaluasi operasional: <strong>{periodSummaryLabel}</strong> • Terdata <strong>{filteredComplaints.length} Aduan</strong>
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
                  <span style={{ fontSize: '10px', background: currentOpStats.predikatColor, color: 'white', padding: '2px 8px', borderRadius: '4px', fontWeight: 800 }}>
                    {currentOpStats.predikat}
                  </span>
                </div>
                <div style={{ fontSize: '11.5px', color: '#94A3B8', marginTop: '2px' }}>
                  NRP: <strong style={{ color: '#F1F5F9' }}>{currentOpStats.identifier}</strong> • {currentOpStats.stationName}
                </div>
              </div>
            </div>

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
              <div style={{ fontSize: '11px', color: '#94A3B8' }}>Rata-rata Entri CAD</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: currentOpStats.totalTiketInput > 0 ? '#38BDF8' : '#94A3B8', marginTop: '2px' }}>
                {currentOpStats.totalTiketInput > 0 && currentOpStats.avgIntakeMinutes != null ? `± ${currentOpStats.avgIntakeMinutes} Menit` : '-'}
              </div>
              <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '2px' }}>
                Target Mabes Polri: &le; 3 Menit
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '10px', padding: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '11px', color: '#94A3B8' }}>Kepatuhan Standar SOP</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: currentOpStats.totalTiketInput > 0 ? (currentOpStats.sopComplianceRate >= 90 ? '#34D399' : '#FBBF24') : '#94A3B8', marginTop: '2px' }}>
                {currentOpStats.totalTiketInput > 0 && currentOpStats.sopComplianceRate != null ? `${currentOpStats.sopComplianceRate}%` : '-'}
              </div>
              <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '2px' }}>
                Kelengkapan Uraian &amp; Subkasus
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '10px', padding: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '11px', color: '#94A3B8' }}>Kepuasan Layanan Warga</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: currentOpStats.totalTiketInput > 0 && currentOpStats.avgRating > 0 ? '#FBBF24' : '#94A3B8', marginTop: '2px' }}>
                {currentOpStats.totalTiketInput > 0 && currentOpStats.avgRating > 0 ? `⭐ ${currentOpStats.avgRating.toFixed(1)} / 5.0` : '- / 5.0'}
              </div>
              <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '2px' }}>
                {currentOpStats.totalTiketInput > 0 && currentOpStats.totalReviews > 0 ? `${currentOpStats.totalReviews} ulasan masyarakat` : 'Belum ada ulasan'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MASTER SUB-TAB: LEADERBOARD VS ULASAN WARGA */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '2px solid #E2E8F0', paddingBottom: '8px' }}>
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
          }}
        >
          <span>🏆</span>
          <span>Peringkat &amp; Leaderboard Sentra 110</span>
        </button>
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
          }}
        >
          <span>💬</span>
          <span>Ulasan &amp; Rating Warga ({citizenReviews.length})</span>
        </button>
      </div>

      {/* VIEW 1: LEADERBOARD OPERATOR */}
      {activeSubTab === 'leaderboard' && (
        <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          {/* Sub-Tab: Produktivitas CAD vs Kepuasan Warga */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#1E293B' }}>
                Komparasi Kinerja Operator Sentra Layanan 110 ({periodSummaryLabel})
              </div>
              <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                Evaluasi komparatif akuntabilitas petugas call taker antar regu piket SPKT.
              </div>
            </div>

            <div style={{ display: 'flex', background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '3px', borderRadius: '8px', gap: '4px' }}>
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
                ⚡ Produktivitas CAD
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
          </div>

          {/* Podium Top 3 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginBottom: '16px' }}>
            {rankedOperators.slice(0, 3).map((item: any, idx: number) => {
              const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉';
              const medalLabel = idx === 0 ? 'JUARA 1 - TELADAN' : idx === 1 ? 'JUARA 2 - SANGAT PRIMA' : 'JUARA 3 - SIAGA';
              const borderColor = idx === 0 ? '#F59E0B' : idx === 1 ? '#94A3B8' : '#D97706';
              const bgGradient = idx === 0
                ? 'linear-gradient(135deg, #FEF3C7 0%, #FFFFFF 100%)'
                : idx === 1
                ? 'linear-gradient(135deg, #F1F5F9 0%, #FFFFFF 100%)'
                : 'linear-gradient(135deg, #FFEDD5 0%, #FFFFFF 100%)';

              return (
                <div
                  key={item.operatorId || idx}
                  style={{
                    border: `2px solid ${borderColor}`,
                    borderRadius: '12px',
                    background: bgGradient,
                    padding: '14px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 900, color: borderColor, letterSpacing: '0.5px' }}>
                        {medal} {medalLabel}
                      </span>
                      <span style={{ fontSize: '10px', background: item.predikatColor, color: 'white', padding: '2px 7px', borderRadius: '4px', fontWeight: 800 }}>
                        {item.predikat}
                      </span>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>🎧</span>
                      <span>{item.namaLengkap}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                      NRP: <strong>{item.identifier}</strong> • {item.stationName}
                    </div>
                  </div>

                  <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(0,0,0,0.06)', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', textAlign: 'center' }}>
                    <div>
                      <div style={{ fontSize: '10px', color: '#64748B' }}>Tiket CAD</div>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#153E75' }}>
                        {item.totalTiketInput} Lap
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', color: '#64748B' }}>Entri CAD</div>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: item.totalTiketInput > 0 ? '#059669' : '#94A3B8' }}>
                        {item.totalTiketInput > 0 && item.avgIntakeMinutes != null ? `± ${item.avgIntakeMinutes} m` : '-'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', color: '#64748B' }}>Rating IKM</div>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: item.totalTiketInput > 0 && item.avgRating > 0 ? '#D97706' : '#94A3B8' }}>
                        {item.totalTiketInput > 0 && item.avgRating > 0 ? `⭐ ${item.avgRating.toFixed(1)}` : '-'}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tabel Lengkap Leaderboard Operator */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', color: '#475569', fontWeight: 800 }}>
                  <th style={{ padding: '8px 10px', width: '40px', textAlign: 'center' }}>Rank</th>
                  <th style={{ padding: '8px 10px' }}>Petugas Operator</th>
                  <th style={{ padding: '8px 10px' }}>Satuan</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center' }}>Tiket CAD</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center' }}>Kecepatan</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center' }}>Kepatuhan SOP</th>
                  <th style={{ padding: '8px 10px' }}>Kepuasan Warga</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center' }}>Skor Anev</th>
                  <th style={{ padding: '8px 10px' }}>Predikat</th>
                </tr>
              </thead>
              <tbody>
                {rankedOperators.map((item: any, idx: number) => {
                  const isCurrent = userProfile?.nrp === item.identifier || userProfile?.identifier === item.identifier;

                  return (
                    <tr
                      key={item.operatorId || idx}
                      style={{
                        borderBottom: '1px solid #F1F5F9',
                        background: isCurrent ? '#F0FDF4' : 'transparent',
                      }}
                    >
                      <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 800 }}>
                        {idx === 0 ? '🥇 1' : idx === 1 ? '🥈 2' : idx === 2 ? '🥉 3' : `#${idx + 1}`}
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        <div style={{ fontWeight: 800, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <span>🎧</span>
                          <span>{item.namaLengkap}</span>
                          {isCurrent && (
                            <span style={{ fontSize: '9px', background: '#16A34A', color: 'white', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>
                              ANDA
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '10.5px', color: '#64748B' }}>
                          NRP: <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{item.identifier}</span>
                        </div>
                      </td>
                      <td style={{ padding: '8px 10px', color: '#475569' }}>
                        <div>{item.pangkat}</div>
                        <div style={{ fontSize: '10px', color: '#64748B' }}>{item.stationName}</div>
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 800, color: '#153E75' }}>
                        {item.totalTiketInput} Tiket
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700, color: item.totalTiketInput > 0 ? '#059669' : '#94A3B8' }}>
                        {item.totalTiketInput > 0 && item.avgIntakeMinutes != null ? `± ${item.avgIntakeMinutes} m` : '-'}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                        {item.totalTiketInput > 0 && item.sopComplianceRate != null ? (
                          <span style={{ fontSize: '11px', fontWeight: 800, color: item.sopComplianceRate >= 90 ? '#059669' : '#D97706' }}>
                            {item.sopComplianceRate}%
                          </span>
                        ) : (
                          <span style={{ color: '#94A3B8' }}>-</span>
                        )}
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        {item.totalTiketInput > 0 && item.avgRating > 0 ? (
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
                        )}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                        {item.totalTiketInput > 0 ? (
                          <span style={{ fontSize: '12px', fontWeight: 900, color: '#153E75', background: '#EFF6FF', padding: '3px 8px', borderRadius: '6px' }}>
                            {item.compositeScore}
                          </span>
                        ) : (
                          <span style={{ color: '#94A3B8', fontSize: '12px', fontWeight: 700 }}>-</span>
                        )}
                      </td>
                      <td style={{ padding: '8px 10px' }}>
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
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: ULASAN & FEEDBACK WARGA */}
      {activeSubTab === 'ulasan' && (
        <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#1E293B', marginBottom: '4px' }}>
            Ulasan Kepuasan Masyarakat Atas Pelayanan Operator 110 ({periodSummaryLabel})
          </div>
          <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '16px' }}>
            Feedback langsung dari warga pelapor terkait keramahan operator, kejelasan informasi SOP, dan kecepatan penanganan panggilan darurat.
          </div>

          {citizenReviews.length === 0 ? (
            <div style={{ padding: '40px 10px', textAlign: 'center', color: '#64748B', fontSize: '12px' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>💬</div>
              <div style={{ fontWeight: 700 }}>Belum Ada Ulasan Warga Pada {periodSummaryLabel}</div>
              <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>
                Ulasan warga akan muncul otomatis saat pelapor mengisi bintang kepuasan di halaman pelacakan tiket (/tracking).
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
              {citizenReviews.map((rev) => (
                <div
                  key={rev.id}
                  style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '10px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 800, color: '#153E75' }}>
                        {rev.nomorTiket}
                      </span>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: '#D97706' }}>
                        {'⭐'.repeat(rev.starRating)} ({rev.starRating}/5)
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                      Pelapor: {rev.namaPelapor} • <span style={{ color: '#0284C7' }}>{rev.jenisKejadian}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '12px', color: '#1E293B', fontStyle: 'italic', lineHeight: 1.5, background: 'white', padding: '8px 10px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                      &ldquo;{rev.reviewText}&rdquo;
                    </p>
                  </div>
                  <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '8px', textAlign: 'right' }}>
                    {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WIB' : 'Hari ini'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
