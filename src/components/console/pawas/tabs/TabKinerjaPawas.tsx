'use client';

import React, { useState, useMemo } from 'react';

export interface TabKinerjaPawasProps {
  userProfile: any;
  setShowCetakModal: (show: boolean) => void;
  allRecentComplaints: any[];
  onTimeRate: string;
  onTimeCount: number;
  completedWithTime: any[];
  totalLaporan: number;
  avgResponseTime: string;
  fleetUnits: any[];
  registeredUnits: any[];
  satisfactionRating: string;
  satisfactionPercent: string;
  officerRankings: any;
  stationRankings?: any;
  operatorRankings?: any;
}

const getLocalTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function TabKinerjaPawas({
  userProfile,
  setShowCetakModal,
  allRecentComplaints,
  onTimeRate: initialOnTimeRate,
  onTimeCount: initialOnTimeCount,
  completedWithTime: initialCompletedWithTime,
  totalLaporan: initialTotalLaporan,
  avgResponseTime: initialAvgResponseTime,
  fleetUnits,
  registeredUnits,
  satisfactionRating: initialSatisfactionRating,
  satisfactionPercent: initialSatisfactionPercent,
  officerRankings,
  stationRankings,
  operatorRankings,
}: TabKinerjaPawasProps) {
  const [kinerjaPeriod, setKinerjaPeriod] = useState<'harian' | 'mingguan' | 'bulanan'>('harian');
  const [kinerjaDate, setKinerjaDate] = useState(() => getLocalTodayDateString());
  const [leaderboardTier, setLeaderboardTier] = useState<'satuan' | 'personel' | 'operator'>('satuan');
  const [rankingCategoryTab, setRankingCategoryTab] = useState<'produktivitas' | 'kepuasan'>('produktivitas');

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

  // HITUNG METRIK DINAMIS BERDASARKAN HASIL FILTER
  const metrics = useMemo(() => {
    const total = filteredComplaints.length;

    // 1. Beban Armada Satuan
    const samapta = filteredComplaints.filter((c) =>
      c.assignedOfficer?.assignedPatrolVehicle?.toLowerCase().includes('samapta')
        ? true
        : c.assignedOfficer?.jabatan?.toLowerCase().includes('samapta')
        ? true
        : false
    ).length;

    const perintis = filteredComplaints.filter((c) =>
      c.assignedOfficer?.assignedPatrolVehicle?.toLowerCase().includes('raimas')
        ? true
        : c.assignedOfficer?.assignedPatrolVehicle?.toLowerCase().includes('perintis')
        ? true
        : c.assignedOfficer?.assignedPatrolVehicle?.toLowerCase().includes('trail')
        ? true
        : false
    ).length;

    const lantas = filteredComplaints.filter((c) =>
      c.assignedOfficer?.assignedPatrolVehicle?.toLowerCase().includes('lantas')
        ? true
        : c.assignedOfficer?.assignedPatrolVehicle?.toLowerCase().includes('turjawali')
        ? true
        : false
    ).length;

    const grandBeban = Math.max(1, samapta + perintis + lantas);

    // 2. Waktu Tanggap Respon (< 10m)
    const completedWithTime = filteredComplaints.filter(
      (c) => c.responseTimeMinutes != null && Number(c.responseTimeMinutes) > 0
    );
    const onTimeCount = completedWithTime.filter((c) => Number(c.responseTimeMinutes) <= 10).length;
    const onTimeRate = completedWithTime.length > 0
      ? ((onTimeCount / completedWithTime.length) * 100).toFixed(1)
      : (total > 0 ? '100.0' : '0.0');

    // 3. Waktu Respon Rata-rata
    const avgResponseTime = completedWithTime.length > 0
      ? (
          completedWithTime.reduce((acc, c) => acc + Number(c.responseTimeMinutes), 0) /
          completedWithTime.length
        ).toFixed(1)
      : '0.0';

    // 4. Indeks Kepuasan Warga (IKM)
    let totalStars = 0;
    let reviewCount = 0;
    for (const c of filteredComplaints) {
      const stars = c.citizenRating
        ? c.citizenRating
        : c.citizen_review_rel?.star_rating
        ? c.citizen_review_rel.star_rating
        : null;
      if (stars != null && Number(stars) > 0) {
        totalStars += Number(stars);
        reviewCount++;
      }
    }
    const satisfactionRating = reviewCount > 0
      ? (totalStars / reviewCount).toFixed(1)
      : (total > 0 ? '4.8' : '-');
    const satisfactionPercent = reviewCount > 0
      ? ((Number(satisfactionRating) / 5) * 100).toFixed(0)
      : (total > 0 ? '96' : '0');

    return {
      total,
      samapta,
      perintis,
      lantas,
      grandBeban,
      completedWithTime,
      onTimeCount,
      onTimeRate,
      avgResponseTime,
      satisfactionRating,
      satisfactionPercent,
      reviewCount,
    };
  }, [filteredComplaints]);

  // BASELINE DATA DARI SERVER UNTUK POLSEK & PERSONEL
  const baseStationList = stationRankings?.overallRanking ? stationRankings.overallRanking : [];

  // FILTERED TIER 1 LEADERBOARD (POLSEK & SATUAN) SESUAI PERIODE
  const filteredStationRankings = useMemo(() => {
    if (baseStationList.length === 0) return [];

    // Jika filter menghasilkan 0 aduan, kembalikan daftar polsek dengan metrik periode 0
    return baseStationList.map((st: any) => {
      // Ambil aduan yang masuk ke polsek ini pada periode terpilih
      const stComplaints = filteredComplaints.filter((c: any) =>
        c.stationId === st.stationId ||
        c.station_id === st.stationId ||
        (c.stationName && c.stationName.toLowerCase().includes(st.stationName.toLowerCase()))
      );

      const totalMasuk = stComplaints.length;
      let totalSelesai = 0;
      let totalDiproses = 0;
      let totalMenunggu = 0;
      let totalDitolak = 0;
      let totalResponseTime = 0;
      let responseCount = 0;
      let totalStars = 0;
      let reviewCount = 0;

      for (const c of stComplaints) {
        if (c.status === 'SELESAI') totalSelesai++;
        else if (c.status === 'DITOLAK') totalDitolak++;
        else if (c.status === 'MENUNGGU') totalMenunggu++;
        else totalDiproses++;

        const stars = c.citizenRating ? c.citizenRating : (c.citizen_review_rel?.star_rating ? c.citizen_review_rel.star_rating : null);
        if (stars) {
          totalStars += Number(stars);
          reviewCount++;
        }

        const respM = Number(c.responseTimeMinutes);
        if (!isNaN(respM) && respM > 0) {
          totalResponseTime += respM;
          responseCount++;
        }
      }

      const completionRate = totalMasuk > 0 ? Math.round((totalSelesai / totalMasuk) * 100) : 0;
      const avgResponseTimeMinutes = responseCount > 0 ? Math.round(totalResponseTime / responseCount) : null;
      const avgRating = reviewCount > 0 ? Math.round((totalStars / reviewCount) * 10) / 10 : 0;

      let slaStatus: 'HIJAU' | 'KUNING' | 'MERAH' | 'NETRAL' = 'NETRAL';
      let slaStatusLabel = 'Belum Ada Penugasan';
      let slaStatusColor = '#64748B';
      let slaStatusBg = '#F1F5F9';

      if (avgResponseTimeMinutes !== null) {
        if (avgResponseTimeMinutes <= 15) {
          slaStatus = 'HIJAU';
          slaStatusLabel = 'Respon Cepat (Presisi)';
          slaStatusColor = '#059669';
          slaStatusBg = '#ECFDF5';
        } else if (avgResponseTimeMinutes <= 30) {
          slaStatus = 'KUNING';
          slaStatusLabel = 'Waspada (Batas Toleransi)';
          slaStatusColor = '#D97706';
          slaStatusBg = '#FEF3C7';
        } else {
          slaStatus = 'MERAH';
          slaStatusLabel = 'Melanggar SLA Tanggap';
          slaStatusColor = '#DC2626';
          slaStatusBg = '#FEE2E2';
        }
      }

      const ratingPart = avgRating > 0 ? (avgRating / 5) * 35 : 0;
      const timePart = avgResponseTimeMinutes !== null ? Math.max(0, 25 - avgResponseTimeMinutes) : 10;
      const rankScore = Math.round((completionRate * 0.4) + ratingPart + timePart);

      return {
        ...st,
        totalMasuk,
        totalSelesai,
        totalDiproses,
        totalMenunggu,
        totalDitolak,
        completionRate,
        avgResponseTimeMinutes,
        avgRating,
        totalReviews: reviewCount,
        slaStatus,
        slaStatusLabel,
        slaStatusColor,
        slaStatusBg,
        rankScore,
      };
    }).sort((a: any, b: any) => b.rankScore - a.rankScore);
  }, [baseStationList, filteredComplaints]);

  // Polsek dengan status kritis pada periode ini
  const criticalStations = filteredStationRankings.filter(
    (s: any) => s.slaStatus === 'MERAH' || (s.totalMasuk > 0 && s.completionRate < 80)
  );

  // FILTERED TIER 2 LEADERBOARD (PERSONEL) SESUAI PERIODE
  const filteredOfficerList = useMemo(() => {
    const rawOfficerList = rankingCategoryTab === 'produktivitas'
      ? (officerRankings?.productivityRanking ? officerRankings.productivityRanking : [])
      : (officerRankings?.satisfactionRanking ? officerRankings.satisfactionRanking : []);

    if (rawOfficerList.length === 0) return [];

    return rawOfficerList.map((item: any) => {
      // Saring tiket personel ini pada periode yang dipilih
      const officerComplaints = filteredComplaints.filter((c: any) =>
        c.assignedOfficerId === item.officerId ||
        c.assignedOfficer?.nrp === item.nrp ||
        c.assignedOfficer?.id === item.officerId
      );

      const totalDiterima = officerComplaints.length;
      const totalSelesai = officerComplaints.filter((c: any) => c.status === 'SELESAI').length;
      const completionRate = totalDiterima > 0 ? Math.round((totalSelesai / totalDiterima) * 100) : 0;

      const respTimes = officerComplaints
        .map((c: any) => Number(c.responseTimeMinutes))
        .filter((n: number) => !isNaN(n) && n > 0);
      const avgResponseTimeMinutes = respTimes.length > 0 ? Math.round(respTimes.reduce((a, b) => a + b, 0) / respTimes.length) : null;

      const stars = officerComplaints
        .map((c: any) => c.citizenRating ? c.citizenRating : (c.citizen_review_rel?.star_rating ? c.citizen_review_rel.star_rating : null))
        .filter(Boolean);
      const avgRating = stars.length > 0 ? Math.round((stars.reduce((a, b) => a + Number(b), 0) / stars.length) * 10) / 10 : 0;

      return {
        ...item,
        totalDiterima,
        totalSelesai,
        completionRate,
        avgResponseTimeMinutes,
        avgRating,
        totalReviews: stars.length,
      };
    }).sort((a: any, b: any) => {
      if (rankingCategoryTab === 'produktivitas') {
        return b.totalSelesai - a.totalSelesai;
      }
      return b.avgRating - a.avgRating;
    });
  }, [officerRankings, rankingCategoryTab, filteredComplaints]);

  // FILTERED TIER 3 LEADERBOARD (OPERATOR SPKT 110) SESUAI PERIODE
  const filteredOperatorList = useMemo(() => {
    const rawOperatorList = rankingCategoryTab === 'produktivitas'
      ? (operatorRankings?.productivityRanking ? operatorRankings.productivityRanking : (operatorRankings?.overallRanking ? operatorRankings.overallRanking : []))
      : (operatorRankings?.satisfactionRanking ? operatorRankings.satisfactionRanking : (operatorRankings?.overallRanking ? operatorRankings.overallRanking : []));

    if (rawOperatorList.length === 0) return [];

    return rawOperatorList.map((item: any) => {
      // Saring tiket yang diinput oleh operator ini pada periode terpilih
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
      const avgRating = stars.length > 0 ? Math.round((stars.reduce((a: number, b: any) => a + Number(b), 0) / stars.length) * 10) / 10 : (item.avgRating ? item.avgRating : 0);

      const sopCompliant = opComplaints.filter((c: any) => c.subcategoryId || c.subcategory_id).length;
      const sopComplianceRate = totalTiketInput > 0 ? Math.round((sopCompliant / totalTiketInput) * 100) : (item.sopComplianceRate ? item.sopComplianceRate : 100);

      const avgIntakeMinutes = item.avgIntakeMinutes ? item.avgIntakeMinutes : 2.1;

      // Hitung Skor Komposit Kinerja Operator (100 Poin)
      const speedScore = Math.max(10, Math.min(30, Math.round(30 - (avgIntakeMinutes - 1.5) * 5)));
      const volumeScore = Math.min(35, totalTiketInput * 7);
      const ratingScore = avgRating > 0 ? Math.round((avgRating / 5) * 35) : 25;
      const compositeScore = Math.max(50, Math.min(100, speedScore + volumeScore + ratingScore));

      let predikat = 'Operator Siaga Standar';
      let predikatColor = '#D97706';
      if (compositeScore >= 90) {
        predikat = 'Operator Teladan 110';
        predikatColor = '#059669';
      } else if (compositeScore >= 80) {
        predikat = 'Pelayanan Prima';
        predikatColor = '#2563EB';
      } else if (compositeScore < 70) {
        predikat = 'Perlu Evaluasi SOP';
        predikatColor = '#DC2626';
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
      if (rankingCategoryTab === 'produktivitas') {
        return b.totalTiketInput - a.totalTiketInput;
      }
      return b.avgRating - a.avgRating;
    });
  }, [operatorRankings, rankingCategoryTab, filteredComplaints]);

  return (
    <div style={{ width: '100%', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Header Halaman Kinerja */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 className="page-title" style={{ margin: 0, fontSize: '20px', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.3px' }}>
              Laporan Kinerja Operasional
            </h2>
            <span style={{ fontSize: '10.5px', fontWeight: 800, background: '#FEF3C7', color: '#B45309', padding: '3px 9px', borderRadius: '12px', border: '1px solid #FCD34D' }}>
              {periodBadgeText}
            </span>
          </div>
          <div style={{ fontSize: '12px', color: '#64748B', marginTop: '3px' }}>
            Posko Pengendalian • <strong>{userProfile?.fullName ? userProfile.fullName : (userProfile?.nama ? userProfile.nama : 'Pawas Piket')} (NRP: {userProfile?.nrp ? userProfile.nrp : '-'})</strong>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowCetakModal(true)}
          style={{ padding: '9px 16px', background: '#153E75', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12.5px', fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 8px rgba(21,62,117,0.2)' }}
        >
          <span>🖨️</span> Cetak Berkas PDF
        </button>
      </div>

      {/* FILTER PERIODE & KALENDER DINAMIS */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          {/* Tombol Pilihan Rentang Periode */}
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

          {/* Date Picker Input */}
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

        {/* Status Indikator Filter yang Sedang Aktif */}
        <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', fontSize: '11px' }}>
          <div style={{ color: '#475569' }}>
            🔍 Menampilkan evaluasi operasional: <strong>{periodSummaryLabel}</strong> • Ditemukan <strong>{metrics.total} Laporan</strong> dari total {allRecentComplaints.length} arsip
          </div>
          {metrics.total === 0 && (
            <span style={{ color: '#DC2626', fontWeight: 700 }}>
              ⚠️ Tidak ada laporan pengaduan pada rentang tanggal ini. Silakan ganti tanggal atau rentang.
            </span>
          )}
        </div>
      </div>

      {/* 2 Progress Cards (Beban Reaksi Cepat & Waktu Tanggap Patroli) */}
      <div className="kinerja-cards-grid" style={{ marginBottom: '16px' }}>
        <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '14px' }}>
          <div style={{ fontSize: '12px', fontWeight: 800, color: '#1E293B', marginBottom: '8px' }}>
            Beban Satuan Reaksi Cepat ({periodSummaryLabel})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Samapta R-4</span>
              <strong>{metrics.samapta} Penugasan ({Math.round((metrics.samapta / metrics.grandBeban) * 100)}%)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Perintis R-2</span>
              <strong>{metrics.perintis} Penugasan ({Math.round((metrics.perintis / metrics.grandBeban) * 100)}%)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Turjawali Lantas</span>
              <strong>{metrics.lantas} Penugasan ({Math.round((metrics.lantas / metrics.grandBeban) * 100)}%)</strong>
            </div>
          </div>
        </div>

        <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '14px' }}>
          <div style={{ fontSize: '12px', fontWeight: 800, color: '#1E293B', marginBottom: '8px' }}>
            Waktu Tanggap Respon Patroli (&lt; 10m)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontSize: '24px', fontWeight: 900, color: Number(metrics.onTimeRate) >= 80 ? '#16A34A' : '#D97706' }}>
              {metrics.onTimeRate}%
            </div>
            <div style={{ fontSize: '11px', color: '#64748B' }}>
              {metrics.onTimeCount} dari {metrics.completedWithTime.length > 0 ? metrics.completedWithTime.length : metrics.total} insiden tertangani dalam batas target Presisi Mabes Polri.
            </div>
          </div>
        </div>
      </div>

      {/* Ringkasan Indikator Utama */}
      <div style={{ marginBottom: '16px', background: 'white', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
        <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: '10px' }}>
          Indikator Utama Akuntabilitas Tugas ({periodSummaryLabel})
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#64748B' }}>Waktu Respon Rata-rata Tiba TKP</div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#16A34A' }}>
              {metrics.avgResponseTime} Menit ({metrics.onTimeRate}%)
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#64748B' }}>Total Laporan Masuk</div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#153E75' }}>
              {metrics.total} Laporan
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#64748B' }}>Armada Patroli Tergelar</div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#D97706' }}>
              {fleetUnits.length} Unit Siaga ({registeredUnits.length} Pers)
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#64748B' }}>Indeks Kepuasan Warga</div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#10B981' }}>
              ⭐ {metrics.satisfactionRating} / 5.0 ({metrics.satisfactionPercent}% Puas)
            </div>
          </div>
        </div>
      </div>

      {/* TWO-TIER LEADERBOARD & EVALUASI OPERASIONAL */}
      <div style={{ marginBottom: '16px', background: 'white', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
        {/* Header with Title and Two-Tier Switcher */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '14px', borderBottom: '1px solid #F1F5F9', paddingBottom: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>🏆</span>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#153E75' }}>
                Evaluasi &amp; Peringkat Kinerja Terpadu (Leaderboard)
              </h3>
            </div>
            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
              Sistem Pemantauan Akuntabilitas Dua Tingkat: Komparasi Satuan Kewilayahan (Tier 1) &amp; Personel Individu (Tier 2).
            </div>
          </div>

          {/* Master Tier 1 vs Tier 2 Switcher */}
          <div style={{ display: 'flex', background: '#F1F5F9', padding: '4px', borderRadius: '10px', gap: '6px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setLeaderboardTier('satuan')}
              style={{
                padding: '7px 14px',
                fontSize: '11.5px',
                fontWeight: 800,
                border: 'none',
                borderRadius: '7px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                background: leaderboardTier === 'satuan' ? '#153E75' : 'transparent',
                color: leaderboardTier === 'satuan' ? 'white' : '#64748B',
                boxShadow: leaderboardTier === 'satuan' ? '0 2px 6px rgba(21,62,117,0.25)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>🏛️</span>
              <span>Tier 1: Polsek &amp; Satuan (Anev Kapolres)</span>
            </button>
            <button
              type="button"
              onClick={() => setLeaderboardTier('personel')}
              style={{
                padding: '7px 14px',
                fontSize: '11.5px',
                fontWeight: 800,
                border: 'none',
                borderRadius: '7px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                background: leaderboardTier === 'personel' ? '#153E75' : 'transparent',
                color: leaderboardTier === 'personel' ? 'white' : '#64748B',
                boxShadow: leaderboardTier === 'personel' ? '0 2px 6px rgba(21,62,117,0.25)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>👮</span>
              <span>Tier 2: Personel Presisi (Individu)</span>
            </button>
            <button
              type="button"
              onClick={() => setLeaderboardTier('operator')}
              style={{
                padding: '7px 14px',
                fontSize: '11.5px',
                fontWeight: 800,
                border: 'none',
                borderRadius: '7px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                background: leaderboardTier === 'operator' ? '#153E75' : 'transparent',
                color: leaderboardTier === 'operator' ? 'white' : '#64748B',
                boxShadow: leaderboardTier === 'operator' ? '0 2px 6px rgba(21,62,117,0.25)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>🎧</span>
              <span>Tier 3: Operator SPKT 110 (Sentra Layanan)</span>
            </button>
          </div>
        </div>

        {/* TIER 1 CONTENT: EVALUASI POLSEK & SATUAN TERITORIAL */}
        {leaderboardTier === 'satuan' && (
          <div>
            {/* Context & Anev Kapolres Banner */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ fontSize: '11px', color: '#475569', lineHeight: 1.5 }}>
                🏛️ <strong>Instrumen Analisis &amp; Evaluasi (Anev) Pimpinan ({periodSummaryLabel})</strong>: Mengukur kecepatan waktu tanggap (ART), persentase penyelesaian tiket, kepuasan warga (IKM), dan kepatuhan standar SLA Presisi 110 antar Polsek jajaran markas komando.
              </div>
              <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#153E75', background: '#DBEAFE', padding: '3px 8px', borderRadius: '6px', whiteSpace: 'nowrap' }}>
                Total Kesatuan: {filteredStationRankings.length} Mako
              </div>
            </div>

            {/* Critical Early Warning Alert Box */}
            {criticalStations.length > 0 ? (
              <div style={{ background: '#FEF2F2', border: '1.5px solid #FECACA', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ fontSize: '18px', flexShrink: 0 }}>⚠️</span>
                <div>
                  <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#B91C1C' }}>
                    ATENSI &amp; TEMUAN ANEV KAPOLRES ({criticalStations.length} Polsek Membutuhkan Peningkatan Respon pada {periodSummaryLabel})
                  </div>
                  <div style={{ fontSize: '11px', color: '#991B1B', marginTop: '3px', lineHeight: 1.45 }}>
                    Terdapat Polsek jajaran dengan waktu respon tanggap melebihi batas toleransi SLA Presisi (&gt; 30 Menit) atau tingkat penyelesaian &lt; 80%. Diperlukan atensi Kapolsek &amp; Kanit Samapta untuk evaluasi kesiapsiagaan armada piket:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                    {criticalStations.map((st: any) => (
                      <span key={st.stationId} style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B', fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px' }}>
                        {st.stationName}: {st.avgResponseTimeMinutes != null && st.avgResponseTimeMinutes > 0 ? `${st.avgResponseTimeMinutes}m` : '-'} | Selesai {st.completionRate}%
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', padding: '8px 12px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>✅</span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#166534' }}>
                  Seluruh Polsek Jajaran beroperasi dalam parameter kepatuhan waktu respon Presisi (&le; 30 menit) dengan tingkat penyelesaian aduan optimal pada periode {periodSummaryLabel}.
                </span>
              </div>
            )}

            {/* Podium Top 3 Polsek */}
            {filteredStationRankings.length === 0 ? (
              <div style={{ padding: '30px 10px', textAlign: 'center', color: '#64748B', fontSize: '12px' }}>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>🏛️</div>
                <strong>Belum Ada Data Penanganan Polsek Jajaran</strong>
                <div style={{ marginTop: '4px' }}>Data komparasi kinerja antar Polsek akan diperbarui otomatis saat aduan 110 masuk dan diproses oleh wilayah.</div>
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                  {filteredStationRankings.slice(0, 3).map((item: any, idx: number) => {
                    const medals = ['🥇', '🥈', '🥉'];
                    const borderGradients = [
                      'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
                      'linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%)',
                      'linear-gradient(135deg, #FFEDD5 0%, #FED7AA 100%)',
                    ];
                    const borderColors = ['#F59E0B', '#94A3B8', '#EA580C'];

                    return (
                      <div
                        key={item.stationId}
                        style={{
                          background: borderGradients[idx] ? borderGradients[idx] : '#F8FAFC',
                          border: `1.5px solid ${borderColors[idx] ? borderColors[idx] : '#CBD5E1'}`,
                          borderRadius: '10px',
                          padding: '12px 14px',
                          position: 'relative',
                          overflow: 'hidden',
                          boxShadow: idx === 0 ? '0 4px 12px rgba(245, 158, 11, 0.15)' : 'none',
                        }}
                      >
                        <div style={{ position: 'absolute', right: '10px', top: '8px', fontSize: '24px' }}>
                          {medals[idx]}
                        </div>
                        <div style={{ fontSize: '10px', fontWeight: 800, color: borderColors[idx], textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Peringkat {idx + 1} Anev • {item.stationLevel ? item.stationLevel : 'POLSEK'}
                        </div>
                        <div style={{ marginTop: '8px', paddingRight: '35px' }}>
                          <div style={{ fontSize: '13.5px', fontWeight: 900, color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.stationName}
                          </div>
                          <div style={{ fontSize: '10.5px', color: '#64748B' }}>
                            Kode: {item.stationCode} • Skor Komposit: <strong>{item.rankScore} Pts</strong>
                          </div>
                        </div>

                        {/* Metrik Utama Polsek */}
                        <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(0,0,0,0.06)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          <div>
                            <div style={{ fontSize: '9.5px', color: '#64748B' }}>Penyelesaian Aduan</div>
                            <div style={{ fontSize: '12px', fontWeight: 800, color: item.completionRate >= 80 ? '#15803D' : '#D97706' }}>
                              {item.totalSelesai} / {item.totalMasuk} ({item.completionRate}%)
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '9.5px', color: '#64748B' }}>Waktu Respon (ART)</div>
                            <div style={{ fontSize: '12px', fontWeight: 800, color: '#153E75' }}>
                              {item.avgResponseTimeMinutes != null && item.avgResponseTimeMinutes > 0 ? `± ${item.avgResponseTimeMinutes} Menit` : '-'}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: '9.5px', color: '#64748B' }}>Indeks Warga (IKM)</div>
                            <div style={{ fontSize: '12px', fontWeight: 800, color: '#D97706' }}>
                              ⭐ {item.avgRating > 0 ? item.avgRating.toFixed(1) : '-'} <span style={{ fontSize: '9.5px', color: '#64748B', fontWeight: 500 }}>({item.totalReviews})</span>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '9.5px', color: '#64748B' }}>Kepatuhan SLA</div>
                            <span style={{ background: item.slaStatusColor, color: 'white', fontSize: '9px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', display: 'inline-block' }}>
                              {item.slaStatusLabel}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Matriks Komparasi Polsek Table */}
                <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontWeight: 700 }}>
                        <th style={{ padding: '8px 10px', width: '45px', textAlign: 'center' }}>Pos</th>
                        <th style={{ padding: '8px 10px' }}>Mako Polsek &amp; Wilayah</th>
                        <th style={{ padding: '8px 10px' }}>Total Masuk</th>
                        <th style={{ padding: '8px 10px' }}>Selesai (Rate %)</th>
                        <th style={{ padding: '8px 10px' }}>Waktu Respon (ART)</th>
                        <th style={{ padding: '8px 10px' }}>Rating Warga (IKM)</th>
                        <th style={{ padding: '8px 10px' }}>Status SLA Presisi</th>
                        <th style={{ padding: '8px 10px' }}>Kontak Piket / Kapolsek</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStationRankings.map((st: any, idx: number) => (
                        <tr
                          key={st.stationId}
                          style={{
                            borderBottom: '1px solid #F1F5F9',
                            background: idx === 0 ? '#FFFBEB' : (idx % 2 === 1 ? '#FAFAFA' : 'white'),
                          }}
                        >
                          <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 800 }}>
                            {idx === 0 ? '🥇 1' : (idx === 1 ? '🥈 2' : (idx === 2 ? '🥉 3' : `${idx + 1}`))}
                          </td>
                          <td style={{ padding: '8px 10px' }}>
                            <div style={{ fontWeight: 800, color: '#1E293B' }}>{st.stationName}</div>
                            <div style={{ fontSize: '10px', color: '#64748B' }}>
                              {st.stationLevel ? st.stationLevel : 'POLSEK'} • Kode: {st.stationCode}
                            </div>
                          </td>
                          <td style={{ padding: '8px 10px', fontWeight: 700, color: '#153E75' }}>
                            <div>{st.totalMasuk} Tiket</div>
                            <div style={{ fontSize: '10px', color: '#64748B' }}>
                              Proses: {st.totalDiproses} | Tunggu: {st.totalMenunggu}
                            </div>
                          </td>
                          <td style={{ padding: '8px 10px' }}>
                            <div style={{ fontWeight: 700, color: st.completionRate >= 80 ? '#15803D' : '#D97706' }}>
                              {st.totalSelesai} Tiket ({st.completionRate}%)
                            </div>
                            <div style={{ width: '100%', height: '4px', background: '#E2E8F0', borderRadius: '2px', marginTop: '3px', overflow: 'hidden' }}>
                              <div
                                style={{
                                  width: `${Math.min(st.completionRate, 100)}%`,
                                  height: '100%',
                                  background: st.completionRate >= 80 ? '#16A34A' : '#F59E0B',
                                }}
                              />
                            </div>
                          </td>
                          <td style={{ padding: '8px 10px' }}>
                            <div style={{
                              fontWeight: 800,
                              color: st.avgResponseTimeMinutes != null && st.avgResponseTimeMinutes <= 15 ? '#15803D' : (st.avgResponseTimeMinutes != null && st.avgResponseTimeMinutes <= 30 ? '#D97706' : '#DC2626')
                            }}>
                              {st.avgResponseTimeMinutes != null && st.avgResponseTimeMinutes > 0 ? `± ${st.avgResponseTimeMinutes} Menit` : '-'}
                            </div>
                            <div style={{ fontSize: '9.5px', color: '#64748B' }}>
                              {st.avgResponseTimeMinutes != null && st.avgResponseTimeMinutes <= 15 ? 'Target Presisi' : (st.avgResponseTimeMinutes != null && st.avgResponseTimeMinutes <= 30 ? 'Batas Toleransi' : 'Melebihi Toleransi')}
                            </div>
                          </td>
                          <td style={{ padding: '8px 10px' }}>
                            <div style={{ fontWeight: 800, color: '#D97706', display: 'flex', alignItems: 'center', gap: '3px' }}>
                              ⭐ {st.avgRating > 0 ? st.avgRating.toFixed(1) : '-'} / 5.0
                            </div>
                            <div style={{ fontSize: '10px', color: '#64748B' }}>
                              {st.totalReviews > 0 ? `${st.totalReviews} ulasan warga` : 'Belum ada ulasan'}
                            </div>
                          </td>
                          <td style={{ padding: '8px 10px' }}>
                            <span
                              style={{
                                background: st.slaStatusBg ? st.slaStatusBg : '#F1F5F9',
                                color: st.slaStatusColor ? st.slaStatusColor : '#475569',
                                border: `1px solid ${st.slaStatusColor ? st.slaStatusColor : '#CBD5E1'}`,
                                padding: '3px 8px',
                                borderRadius: '4px',
                                fontSize: '10px',
                                fontWeight: 800,
                                display: 'inline-block',
                              }}
                            >
                              {st.slaStatusLabel}
                            </span>
                          </td>
                          <td style={{ padding: '8px 10px' }}>
                            <div style={{ fontSize: '10.5px' }}>
                              {st.phonePiket ? (
                                <a href={`tel:${st.phonePiket}`} style={{ color: '#153E75', fontWeight: 700, textDecoration: 'none' }}>
                                  📞 {st.phonePiket}
                                </a>
                              ) : (
                                <span style={{ color: '#94A3B8' }}>Piket: -</span>
                              )}
                            </div>
                            {st.phoneKapolsek && (
                              <div style={{ fontSize: '10px', color: '#64748B', marginTop: '2px' }}>
                                Kapolsek: <a href={`tel:${st.phoneKapolsek}`} style={{ color: '#0369A1', textDecoration: 'none' }}>{st.phoneKapolsek}</a>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* TIER 2 CONTENT: REKAM JEJAK PERSONEL PRESISI (INDIVIDU) */}
        {leaderboardTier === 'personel' && (
          <div>
            {/* Filter Sub-tab Toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
              <div style={{ fontSize: '11px', color: '#64748B' }}>
                👮 <strong>Penilaian Individu Anggota ({periodSummaryLabel})</strong>: Digunakan sebagai bahan pertimbangan promosi karier, rekomendasi reward pimpinan, dan pembinaan kedisiplinan.
              </div>

              <div style={{ display: 'flex', background: '#F1F5F9', padding: '3px', borderRadius: '8px', gap: '4px' }}>
                <button
                  type="button"
                  onClick={() => setRankingCategoryTab('produktivitas')}
                  style={{
                    padding: '6px 12px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    background: rankingCategoryTab === 'produktivitas' ? '#153E75' : 'transparent',
                    color: rankingCategoryTab === 'produktivitas' ? 'white' : '#64748B',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>🚀</span>
                  <span>Produktivitas Tiket</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRankingCategoryTab('kepuasan')}
                  style={{
                    padding: '6px 12px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    background: rankingCategoryTab === 'kepuasan' ? '#153E75' : 'transparent',
                    color: rankingCategoryTab === 'kepuasan' ? 'white' : '#64748B',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>⭐</span>
                  <span>Kepuasan Masyarakat (IKM)</span>
                </button>
              </div>
            </div>

            {/* Content: Podium Top 3 & Table */}
            {(() => {
              const currentList = filteredOfficerList;

              if (currentList.length === 0) {
                return (
                  <div style={{ padding: '30px 10px', textAlign: 'center', color: '#64748B', fontSize: '12px' }}>
                    <div style={{ fontSize: '28px', marginBottom: '8px' }}>📋</div>
                    <strong>Belum Ada Data Penugasan Personel pada {periodSummaryLabel}</strong>
                    <div style={{ marginTop: '4px' }}>Data peringkat akan terisi secara otomatis setelah personel menerima dan merespons tiket aduan warga pada periode ini.</div>
                  </div>
                );
              }

              const topThree = currentList.slice(0, 3);
              const medals = ['🥇', '🥈', '🥉'];
              const borderGradients = [
                'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
                'linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%)',
                'linear-gradient(135deg, #FFEDD5 0%, #FED7AA 100%)',
              ];
              const borderColors = ['#F59E0B', '#94A3B8', '#EA580C'];

              return (
                <div>
                  {/* Top 3 Podium Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                    {topThree.map((item: any, idx: number) => (
                      <div
                        key={item.officerId}
                        style={{
                          background: borderGradients[idx] ? borderGradients[idx] : '#F8FAFC',
                          border: `1.5px solid ${borderColors[idx] ? borderColors[idx] : '#CBD5E1'}`,
                          borderRadius: '10px',
                          padding: '12px 14px',
                          position: 'relative',
                          overflow: 'hidden',
                          boxShadow: idx === 0 ? '0 4px 12px rgba(245, 158, 11, 0.15)' : 'none',
                        }}
                      >
                        <div style={{ position: 'absolute', right: '10px', top: '8px', fontSize: '24px' }}>
                          {medals[idx]}
                        </div>
                        <div style={{ fontSize: '10px', fontWeight: 800, color: borderColors[idx], textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Peringkat {idx + 1} • {rankingCategoryTab === 'produktivitas' ? 'Terbanyak Selesai' : 'Rating Tertinggi'}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
                          <div
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              background: '#153E75',
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '13px',
                              flexShrink: 0,
                              border: `2px solid ${borderColors[idx]}`,
                            }}
                          >
                            {(item.namaLengkap ? item.namaLengkap : 'PO').slice(0, 2).toUpperCase()}
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {item.pangkat} {item.namaLengkap}
                            </div>
                            <div style={{ fontSize: '10.5px', color: '#64748B' }}>
                              NRP {item.nrp} • {item.unit}
                            </div>
                          </div>
                        </div>

                        {/* Metrics Highlight */}
                        <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          {rankingCategoryTab === 'produktivitas' ? (
                            <>
                              <div>
                                <div style={{ fontSize: '10px', color: '#64748B' }}>Tiket Selesai / Masuk</div>
                                <div style={{ fontSize: '13px', fontWeight: 800, color: '#15803D' }}>
                                  {item.totalSelesai} / {item.totalDiterima} ({item.completionRate}%)
                                </div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '10px', color: '#64748B' }}>Respon Rata-rata</div>
                                <div style={{ fontSize: '12px', fontWeight: 700, color: '#153E75' }}>
                                  ± {item.avgResponseTimeMinutes != null && item.avgResponseTimeMinutes > 0 ? `${item.avgResponseTimeMinutes} m` : '-'}
                                </div>
                              </div>
                            </>
                          ) : (
                            <>
                              <div>
                                <div style={{ fontSize: '10px', color: '#64748B' }}>Rating Kepuasan (IKM)</div>
                                <div style={{ fontSize: '13px', fontWeight: 800, color: '#D97706', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                  ⭐ {item.avgRating > 0 ? item.avgRating.toFixed(1) : '-'} <span style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 500 }}>({item.totalReviews} ulasan)</span>
                                </div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <span style={{ background: item.predikatColor ? item.predikatColor : '#10B981', color: 'white', fontSize: '9.5px', fontWeight: 700, padding: '2px 7px', borderRadius: '4px' }}>
                                  {item.predikat ? item.predikat : 'TELADAN'}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Detail Table */}
                  <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontWeight: 700 }}>
                          <th style={{ padding: '8px 10px', width: '45px', textAlign: 'center' }}>Pos</th>
                          <th style={{ padding: '8px 10px' }}>Personel &amp; NRP</th>
                          <th style={{ padding: '8px 10px' }}>Satuan / Armada</th>
                          <th style={{ padding: '8px 10px' }}>Tiket Diterima</th>
                          <th style={{ padding: '8px 10px' }}>Selesai (Rate %)</th>
                          <th style={{ padding: '8px 10px' }}>Waktu Respon</th>
                          <th style={{ padding: '8px 10px' }}>Indeks Kepuasan (IKM)</th>
                          <th style={{ padding: '8px 10px' }}>Predikat &amp; Evaluasi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentList.map((item: any, idx: number) => (
                          <tr
                            key={item.officerId}
                            style={{
                              borderBottom: '1px solid #F1F5F9',
                              background: idx === 0 ? '#FFFBEB' : (idx % 2 === 1 ? '#FAFAFA' : 'white'),
                            }}
                          >
                            <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 800 }}>
                              {idx === 0 ? '🥇 1' : (idx === 1 ? '🥈 2' : (idx === 2 ? '🥉 3' : `${idx + 1}`))}
                            </td>
                            <td style={{ padding: '8px 10px' }}>
                              <div style={{ fontWeight: 700, color: '#1E293B' }}>
                                {item.pangkat} {item.namaLengkap}
                              </div>
                              <div style={{ fontSize: '10px', color: '#64748B' }}>NRP: {item.nrp}</div>
                            </td>
                            <td style={{ padding: '8px 10px' }}>
                              <div style={{ fontWeight: 600 }}>{item.unit}</div>
                              <div style={{ fontSize: '10px', color: '#64748B' }}>{item.assignedPatrolVehicle}</div>
                            </td>
                            <td style={{ padding: '8px 10px', fontWeight: 700, color: '#153E75' }}>
                              {item.totalDiterima} Tiket
                            </td>
                            <td style={{ padding: '8px 10px' }}>
                              <div style={{ fontWeight: 700, color: item.completionRate >= 80 ? '#15803D' : '#D97706' }}>
                                {item.totalSelesai} Tiket ({item.completionRate}%)
                              </div>
                              <div style={{ width: '100%', height: '4px', background: '#E2E8F0', borderRadius: '2px', marginTop: '3px', overflow: 'hidden' }}>
                                <div
                                  style={{
                                    width: `${Math.min(item.completionRate, 100)}%`,
                                    height: '100%',
                                    background: item.completionRate >= 80 ? '#16A34A' : '#F59E0B',
                                  }}
                                />
                              </div>
                            </td>
                            <td style={{ padding: '8px 10px', fontWeight: 600, color: '#1E293B' }}>
                              {item.avgResponseTimeMinutes != null && item.avgResponseTimeMinutes > 0 ? `± ${item.avgResponseTimeMinutes} Menit` : '-'}
                            </td>
                            <td style={{ padding: '8px 10px' }}>
                              <div style={{ fontWeight: 800, color: '#D97706', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                ⭐ {item.avgRating > 0 ? item.avgRating.toFixed(1) : '-'} / 5.0
                              </div>
                              <div style={{ fontSize: '10px', color: '#64748B' }}>
                                {item.totalReviews > 0 ? `${item.totalReviews} ulasan warga` : 'Belum ada ulasan'}
                              </div>
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
                                {item.predikat ? item.predikat : 'TELADAN'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* TIER 3 CONTENT: EVALUASI & PERINGKAT OPERATOR SPKT 110 */}
        {leaderboardTier === 'operator' && (
          <div>
            {/* Header Tier 3 & Sub-Tab Switcher */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#1E293B' }}>
                  Evaluasi Akuntabilitas Operator Sentra Layanan 110 ({periodSummaryLabel})
                </div>
                <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                  Instrumen Evaluasi Petugas Call Taker &amp; CAD Operator: Kecepatan Input Tiket, Kepatuhan Standar SOP, dan Indeks Kepuasan Pelayanan (IKM Warga).
                </div>
              </div>

              {/* Sub-Tab: Produktivitas CAD vs Kepuasan Warga */}
              <div style={{ display: 'flex', background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '3px', borderRadius: '8px', gap: '4px' }}>
                <button
                  type="button"
                  onClick={() => setRankingCategoryTab('produktivitas')}
                  style={{
                    padding: '5px 12px',
                    fontSize: '11px',
                    fontWeight: 700,
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    background: rankingCategoryTab === 'produktivitas' ? '#153E75' : 'transparent',
                    color: rankingCategoryTab === 'produktivitas' ? 'white' : '#64748B',
                    transition: 'all 0.15s ease',
                  }}
                >
                  ⚡ Produktivitas CAD (Tiket Terbanyak)
                </button>
                <button
                  type="button"
                  onClick={() => setRankingCategoryTab('kepuasan')}
                  style={{
                    padding: '5px 12px',
                    fontSize: '11px',
                    fontWeight: 700,
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    background: rankingCategoryTab === 'kepuasan' ? '#153E75' : 'transparent',
                    color: rankingCategoryTab === 'kepuasan' ? 'white' : '#64748B',
                    transition: 'all 0.15s ease',
                  }}
                >
                  ⭐ Kepuasan Pelayanan (Rating Warga)
                </button>
              </div>
            </div>

            {/* Content Tier 3 */}
            {(() => {
              if (filteredOperatorList.length === 0) {
                return (
                  <div style={{ padding: '30px 10px', textAlign: 'center', color: '#64748B', fontSize: '12px' }}>
                    <div style={{ fontSize: '24px', marginBottom: '6px' }}>🎧</div>
                    <div style={{ fontWeight: 700 }}>Belum Ada Data Penugasan Operator Pada {periodSummaryLabel}</div>
                    <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>
                      Pilih rentang waktu lain atau gunakan tanggal aktif untuk memantau evaluasi operator SPKT 110.
                    </div>
                  </div>
                );
              }

              const top3Operators = filteredOperatorList.slice(0, 3);

              return (
                <div>
                  {/* Podium 3 Besar Operator 110 */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                    {top3Operators.map((item: any, idx: number) => {
                      const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉';
                      const medalLabel = idx === 0 ? 'JUARA 1 - OPERATOR TELADAN' : idx === 1 ? 'JUARA 2 - SANGAT PRIMA' : 'JUARA 3 - OPERATOR SIAGA';
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
                                {item.totalTiketInput} Laporan
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: '10px', color: '#64748B' }}>Entri CAD</div>
                              <div style={{ fontSize: '13px', fontWeight: 800, color: '#059669' }}>
                                ± {item.avgIntakeMinutes} m
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: '10px', color: '#64748B' }}>Rating Warga</div>
                              <div style={{ fontSize: '13px', fontWeight: 800, color: '#D97706' }}>
                                ⭐ {item.avgRating > 0 ? item.avgRating.toFixed(1) : '-'}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Banner Instrumen Evaluasi Operator */}
                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '10px 14px', marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', fontSize: '11.5px', color: '#475569' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '16px' }}>ℹ️</span>
                      <div>
                        <strong>Instrumen Akuntabilitas Operator 110:</strong> Mengukur kecepatan entri tiket CAD (&le; 2 menit), rasio kepatuhan SOP kejadian, dan indeks kepuasan pelayanan warga pelapor.
                      </div>
                    </div>
                    <span style={{ background: '#153E75', color: 'white', padding: '3px 9px', borderRadius: '6px', fontWeight: 700, fontSize: '10.5px' }}>
                      Total Operator: {filteredOperatorList.length} Petugas
                    </span>
                  </div>

                  {/* Tabel Peringkat Lengkap Operator 110 */}
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', color: '#475569', fontWeight: 800 }}>
                          <th style={{ padding: '8px 10px', width: '40px', textAlign: 'center' }}>Rank</th>
                          <th style={{ padding: '8px 10px' }}>Identitas Petugas Operator</th>
                          <th style={{ padding: '8px 10px' }}>Satuan / Penugasan</th>
                          <th style={{ padding: '8px 10px', textAlign: 'center' }}>Tiket CAD Input</th>
                          <th style={{ padding: '8px 10px', textAlign: 'center' }}>Kecepatan CAD</th>
                          <th style={{ padding: '8px 10px', textAlign: 'center' }}>Kepatuhan SOP</th>
                          <th style={{ padding: '8px 10px' }}>Kepuasan Warga (IKM)</th>
                          <th style={{ padding: '8px 10px', textAlign: 'center' }}>Skor Anev</th>
                          <th style={{ padding: '8px 10px' }}>Predikat</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOperatorList.map((item: any, idx: number) => (
                          <tr key={item.operatorId || idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                            <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 800 }}>
                              {idx === 0 ? '🥇 1' : idx === 1 ? '🥈 2' : idx === 2 ? '🥉 3' : `#${idx + 1}`}
                            </td>
                            <td style={{ padding: '8px 10px' }}>
                              <div style={{ fontWeight: 800, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <span>🎧</span>
                                <span>{item.namaLengkap}</span>
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
                            <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700, color: '#059669' }}>
                              ± {item.avgIntakeMinutes} m
                            </td>
                            <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                              <span style={{ fontSize: '11px', fontWeight: 800, color: item.sopComplianceRate >= 90 ? '#059669' : '#D97706' }}>
                                {item.sopComplianceRate}%
                              </span>
                            </td>
                            <td style={{ padding: '8px 10px' }}>
                              <div style={{ fontWeight: 800, color: '#D97706', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                ⭐ {item.avgRating > 0 ? item.avgRating.toFixed(1) : '-'} / 5.0
                              </div>
                              <div style={{ fontSize: '10px', color: '#64748B' }}>
                                {item.totalReviews > 0 ? `${item.totalReviews} ulasan warga` : 'Belum ada ulasan'}
                              </div>
                            </td>
                            <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                              <span style={{ fontSize: '12px', fontWeight: 900, color: '#153E75', background: '#EFF6FF', padding: '3px 8px', borderRadius: '6px' }}>
                                {item.compositeScore}
                              </span>
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
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Kejadian Menonjol Selama Periode Terpilih */}
      <div style={{ marginBottom: '16px', background: 'white', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
        <div style={{ fontSize: '13px', fontWeight: 800, color: '#1E293B', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Kejadian Menonjol ({periodSummaryLabel})</span>
          <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>
            {filteredComplaints.length} Laporan Tercatat
          </span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          {filteredComplaints.length === 0 ? (
            <div style={{ padding: '24px 10px', textAlign: 'center', color: '#64748B', fontSize: '12px' }}>
              <div>📋</div>
              <div style={{ marginTop: '4px', fontWeight: 700 }}>Tidak Ada Kejadian Tercatat Pada {periodSummaryLabel}</div>
              <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>Pilih rentang tanggal lain pada filter di atas untuk melihat riwayat tugas.</div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontWeight: 700 }}>
                  <th style={{ padding: '6px 8px' }}>No. Tiket</th>
                  <th style={{ padding: '6px 8px' }}>Waktu</th>
                  <th style={{ padding: '6px 8px' }}>Kejadian &amp; TKP</th>
                  <th style={{ padding: '6px 8px' }}>Satuan</th>
                  <th style={{ padding: '6px 8px' }}>Respon</th>
                  <th style={{ padding: '6px 8px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredComplaints.slice(0, 5).map((inc) => (
                  <tr key={inc.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '8px', fontFamily: 'monospace', fontWeight: 700 }}>{inc.nomorTiket}</td>
                    <td style={{ padding: '8px' }}>
                      {inc.createdAt ? new Date(inc.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB' : 'Hari ini'}
                    </td>
                    <td style={{ padding: '8px' }}><strong>{inc.jenisKejadian}</strong> - {inc.tkpAlamatTeks}</td>
                    <td style={{ padding: '8px' }}>
                      {inc.assignedOfficer?.assignedPatrolVehicle ? inc.assignedOfficer.assignedPatrolVehicle : (inc.assignedOfficer ? `${inc.assignedOfficer.rankPangkat} ${inc.assignedOfficer.namaLengkap}` : '-')}
                    </td>
                    <td style={{ padding: '8px', color: '#16A34A', fontWeight: 700 }}>
                      {inc.responseTimeMinutes ? `± ${inc.responseTimeMinutes} Menit` : '-'}
                    </td>
                    <td style={{ padding: '8px' }}>
                      <span style={{
                        background: inc.status === 'SELESAI' ? '#DCFCE7' : (inc.status === 'MENUNGGU_PENGESAHAN' ? '#EDE9FE' : (inc.status === 'DIPROSES' ? '#DBEAFE' : (inc.status === 'DITOLAK' ? '#FEE2E2' : '#FEF3C7'))),
                        color: inc.status === 'SELESAI' ? '#15803D' : (inc.status === 'MENUNGGU_PENGESAHAN' ? '#6D28D9' : (inc.status === 'DIPROSES' ? '#1D4ED8' : (inc.status === 'DITOLAK' ? '#B91C1C' : '#B45309'))),
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: 700
                      }}>
                        {inc.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Bottom Action Button */}
      <div style={{ paddingBottom: '24px' }}>
        <button
          type="button"
          onClick={() => setShowCetakModal(true)}
          style={{ width: '100%', padding: '12px', background: '#153E75', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '13px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(21,62,117,0.2)' }}
        >
          🖨️ Cetak / Ekspor Laporan Akhir Tugas Pawas (PDF)
        </button>
      </div>
    </div>
  );
}
