'use client';

import React, { useState } from 'react';

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
}

export default function TabKinerjaPawas({
  userProfile,
  setShowCetakModal,
  allRecentComplaints,
  onTimeRate,
  onTimeCount,
  completedWithTime,
  totalLaporan,
  avgResponseTime,
  fleetUnits,
  registeredUnits,
  satisfactionRating,
  satisfactionPercent,
  officerRankings,
  stationRankings,
}: TabKinerjaPawasProps) {
  const [kinerjaPeriod, setKinerjaPeriod] = useState<'harian' | 'mingguan' | 'bulanan'>('harian');
  const [kinerjaDate, setKinerjaDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [leaderboardTier, setLeaderboardTier] = useState<'satuan' | 'personel'>('satuan');
  const [rankingCategoryTab, setRankingCategoryTab] = useState<'produktivitas' | 'kepuasan'>('produktivitas');

  const stationList = stationRankings?.overallRanking ? stationRankings.overallRanking : [];
  const criticalStations = stationList.filter((s: any) => s.slaStatus === 'MERAH' || (s.totalMasuk > 0 && s.completionRate < 80));

  return (
    <div style={{ width: '100%', maxWidth: '1440px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 className="page-title" style={{ margin: 0, fontSize: '20px', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.3px' }}>
              Laporan Kinerja Operasional
            </h2>
            <span style={{ fontSize: '10.5px', fontWeight: 800, background: '#FEF3C7', color: '#B45309', padding: '3px 9px', borderRadius: '12px', border: '1px solid #FCD34D' }}>
              PIKET 1X24 JAM
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

      {/* Periode Tabs & Date Picker */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setKinerjaPeriod('harian')}
            style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #CBD5E1', background: kinerjaPeriod === 'harian' ? '#153E75' : 'white', color: kinerjaPeriod === 'harian' ? 'white' : '#475569', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
          >
            Harian (1x24 Jam)
          </button>
          <button
            type="button"
            onClick={() => setKinerjaPeriod('mingguan')}
            style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #CBD5E1', background: kinerjaPeriod === 'mingguan' ? '#153E75' : 'white', color: kinerjaPeriod === 'mingguan' ? 'white' : '#475569', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
          >
            Mingguan (7 Hari)
          </button>
          <button
            type="button"
            onClick={() => setKinerjaPeriod('bulanan')}
            style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #CBD5E1', background: kinerjaPeriod === 'bulanan' ? '#153E75' : 'white', color: kinerjaPeriod === 'bulanan' ? 'white' : '#475569', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
          >
            Bulanan
          </button>
        </div>
        <input
          type="date"
          value={kinerjaDate}
          onChange={(e) => setKinerjaDate(e.target.value)}
          style={{ padding: '6px 10px', fontSize: '12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontWeight: 700, color: '#153E75' }}
        />
      </div>

      {/* 2 Donut Progress Cards */}
      <div className="kinerja-cards-grid" style={{ marginBottom: '16px' }}>
        {(() => {
          const samaptaTotal = allRecentComplaints.filter(c => c.assignedOfficer?.assignedPatrolVehicle?.toLowerCase().includes('samapta') ? true : (c.assignedOfficer?.jabatan?.toLowerCase().includes('samapta') ? true : false)).length;
          const perintisTotal = allRecentComplaints.filter(c => c.assignedOfficer?.assignedPatrolVehicle?.toLowerCase().includes('raimas') ? true : (c.assignedOfficer?.assignedPatrolVehicle?.toLowerCase().includes('perintis') ? true : (c.assignedOfficer?.assignedPatrolVehicle?.toLowerCase().includes('trail') ? true : false))).length;
          const lantasTotal = allRecentComplaints.filter(c => c.assignedOfficer?.assignedPatrolVehicle?.toLowerCase().includes('lantas') ? true : (c.assignedOfficer?.assignedPatrolVehicle?.toLowerCase().includes('turjawali') ? true : false)).length;
          const grandTotal = Math.max(1, samaptaTotal + perintisTotal + lantasTotal);

          return (
            <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '14px' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#1E293B', marginBottom: '8px' }}>
                Beban Satuan Reaksi Cepat
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Samapta R-4</span>
                  <strong>{samaptaTotal} Penugasan ({Math.round((samaptaTotal / grandTotal) * 100)}%)</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Perintis R-2</span>
                  <strong>{perintisTotal} Penugasan ({Math.round((perintisTotal / grandTotal) * 100)}%)</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Turjawali Lantas</span>
                  <strong>{lantasTotal} Penugasan ({Math.round((lantasTotal / grandTotal) * 100)}%)</strong>
                </div>
              </div>
            </div>
          );
        })()}

        <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '14px' }}>
          <div style={{ fontSize: '12px', fontWeight: 800, color: '#1E293B', marginBottom: '8px' }}>
            Waktu Tanggap Respon Patroli (&lt; 10m)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontSize: '24px', fontWeight: 900, color: '#16A34A' }}>{onTimeRate}%</div>
            <div style={{ fontSize: '11px', color: '#64748B' }}>
              {onTimeCount} dari {completedWithTime.length > 0 ? completedWithTime.length : totalLaporan} insiden tertangani dalam batas standar target Mabes Polri.
            </div>
          </div>
        </div>
      </div>

      {/* Ringkasan Indikator Utama */}
      <div style={{ marginBottom: '16px', background: 'white', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
        <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: '10px' }}>
          Indikator Utama Akuntabilitas Tugas (1x24 Jam)
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#64748B' }}>Waktu Respon Rata-rata Tiba TKP</div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#16A34A' }}>{avgResponseTime} Menit ({onTimeRate}%)</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#64748B' }}>Total Laporan Masuk</div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#153E75' }}>{totalLaporan} Laporan</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#64748B' }}>Armada Patroli Tergelar</div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#D97706' }}>{fleetUnits.length} Unit Siaga ({registeredUnits.length} Pers)</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#64748B' }}>Indeks Kepuasan Warga</div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#10B981' }}>⭐ {satisfactionRating} / 5.0 ({satisfactionPercent}% Puas)</div>
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
          </div>
        </div>

        {/* TIER 1 CONTENT: EVALUASI POLSEK & SATUAN TERITORIAL */}
        {leaderboardTier === 'satuan' && (
          <div>
            {/* Context & Anev Kapolres Banner */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ fontSize: '11px', color: '#475569', lineHeight: 1.5 }}>
                🏛️ <strong>Instrumen Analisis &amp; Evaluasi (Anev) Pimpinan</strong>: Mengukur kecepatan waktu tanggap (ART), persentase penyelesaian tiket, kepuasan warga (IKM), dan kepatuhan standar SLA Presisi 110 antar Polsek jajaran markas komando.
              </div>
              <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#153E75', background: '#DBEAFE', padding: '3px 8px', borderRadius: '6px', whiteSpace: 'nowrap' }}>
                Total Kesatuan: {stationList.length} Mako
              </div>
            </div>

            {/* Critical Early Warning Alert Box */}
            {criticalStations.length > 0 ? (
              <div style={{ background: '#FEF2F2', border: '1.5px solid #FECACA', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ fontSize: '18px', flexShrink: 0 }}>⚠️</span>
                <div>
                  <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#B91C1C' }}>
                    ATENSI &amp; TEMUAN ANEV KAPOLRES ({criticalStations.length} Polsek Membutuhkan Peningkatan Respon)
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
                  Seluruh Polsek Jajaran beroperasi dalam parameter kepatuhan waktu respon Presisi (&le; 30 menit) dengan tingkat penyelesaian aduan optimal.
                </span>
              </div>
            )}

            {/* Podium Top 3 Polsek */}
            {stationList.length === 0 ? (
              <div style={{ padding: '30px 10px', textAlign: 'center', color: '#64748B', fontSize: '12px' }}>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>🏛️</div>
                <strong>Belum Ada Data Penanganan Polsek Jajaran</strong>
                <div style={{ marginTop: '4px' }}>Data komparasi kinerja antar Polsek akan diperbarui otomatis saat aduan 110 masuk dan diproses oleh wilayah.</div>
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                  {stationList.slice(0, 3).map((item: any, idx: number) => {
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
                      {stationList.map((st: any, idx: number) => (
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
                👮 <strong>Penilaian Individu Anggota</strong>: Digunakan sebagai bahan pertimbangan promosi karier, rekomendasi reward pimpinan, dan pembinaan kedisiplinan.
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
              const currentList = rankingCategoryTab === 'produktivitas'
                ? (officerRankings?.productivityRanking ? officerRankings.productivityRanking : [])
                : (officerRankings?.satisfactionRanking ? officerRankings.satisfactionRanking : []);

              if (currentList.length === 0) {
                return (
                  <div style={{ padding: '30px 10px', textAlign: 'center', color: '#64748B', fontSize: '12px' }}>
                    <div style={{ fontSize: '28px', marginBottom: '8px' }}>📋</div>
                    <strong>Belum Ada Data Penugasan Personel</strong>
                    <div style={{ marginTop: '4px' }}>Data peringkat akan terisi secara otomatis setelah personel menerima dan merespons tiket aduan warga.</div>
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
                                <span style={{ background: item.predikatColor, color: 'white', fontSize: '9.5px', fontWeight: 700, padding: '2px 7px', borderRadius: '4px' }}>
                                  {item.predikat}
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
                                  background: item.predikatColor,
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

      {/* Kejadian Menonjol Selama Piket 1x24 Jam Table */}
      <div style={{ marginBottom: '16px', background: 'white', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
        <div style={{ fontSize: '13px', fontWeight: 800, color: '#1E293B', marginBottom: '10px' }}>
          Kejadian Menonjol Selama Piket 1x24 Jam
        </div>
        <div style={{ overflowX: 'auto' }}>
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
              {allRecentComplaints.slice(0, 5).map((inc) => (
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
