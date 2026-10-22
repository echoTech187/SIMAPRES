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
}: TabKinerjaPawasProps) {
  const [kinerjaPeriod, setKinerjaPeriod] = useState<'harian' | 'mingguan' | 'bulanan'>('harian');
  const [kinerjaDate, setKinerjaDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [rankingCategoryTab, setRankingCategoryTab] = useState<'produktivitas' | 'kepuasan'>('produktivitas');

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
            Posko Pengendalian • <strong>{userProfile?.fullName || userProfile?.nama} (NRP: {userProfile?.nrp || '-'})</strong>
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
          const samaptaTotal = allRecentComplaints.filter(c => c.assignedOfficer?.assignedPatrolVehicle?.toLowerCase().includes('samapta') || c.assignedOfficer?.jabatan?.toLowerCase().includes('samapta')).length;
          const perintisTotal = allRecentComplaints.filter(c => c.assignedOfficer?.assignedPatrolVehicle?.toLowerCase().includes('raimas') || c.assignedOfficer?.assignedPatrolVehicle?.toLowerCase().includes('perintis') || c.assignedOfficer?.assignedPatrolVehicle?.toLowerCase().includes('trail')).length;
          const lantasTotal = allRecentComplaints.filter(c => c.assignedOfficer?.assignedPatrolVehicle?.toLowerCase().includes('lantas') || c.assignedOfficer?.assignedPatrolVehicle?.toLowerCase().includes('turjawali')).length;
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
              {onTimeCount} dari {completedWithTime.length || totalLaporan} insiden tertangani dalam batas standar target Mabes Polri.
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

      {/* LEADERBOARD & PERINGKAT KINERJA PERSONEL PIKET */}
      <div style={{ marginBottom: '16px', background: 'white', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>🏅</span>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#153E75' }}>
                Peringkat &amp; Evaluasi Kinerja Personel Piket (Leaderboard)
              </h3>
            </div>
            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
              Akuntabilitas penanganan aduan masyarakat 110 &amp; indeks kepuasan kinerja per-personel.
            </div>
          </div>

          {/* Filter Sub-tab Toggle */}
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
            ? (officerRankings?.productivityRanking || [])
            : (officerRankings?.satisfactionRanking || []);

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
                      background: borderGradients[idx] || '#F8FAFC',
                      border: `1.5px solid ${borderColors[idx] || '#CBD5E1'}`,
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
                        {(item.namaLengkap || 'PO').slice(0, 2).toUpperCase()}
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
                          background: idx === 0 ? '#FFFBEB' : idx % 2 === 1 ? '#FAFAFA' : 'white',
                        }}
                      >
                        <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 800 }}>
                          {idx === 0 ? '🥇 1' : idx === 1 ? '🥈 2' : idx === 2 ? '🥉 3' : `${idx + 1}`}
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
                    {inc.assignedOfficer?.assignedPatrolVehicle || (inc.assignedOfficer ? `${inc.assignedOfficer.rankPangkat} ${inc.assignedOfficer.namaLengkap}` : '-')}
                  </td>
                  <td style={{ padding: '8px', color: '#16A34A', fontWeight: 700 }}>
                    {inc.responseTimeMinutes ? `± ${inc.responseTimeMinutes} Menit` : '-'}
                  </td>
                  <td style={{ padding: '8px' }}>
                    <span style={{
                      background: inc.status === 'SELESAI' ? '#DCFCE7' : inc.status === 'MENUJU_TKP' ? '#DBEAFE' : inc.status === 'PENANGANAN_TKP' ? '#EDE9FE' : '#FEF3C7',
                      color: inc.status === 'SELESAI' ? '#15803D' : inc.status === 'MENUJU_TKP' ? '#1D4ED8' : inc.status === 'PENANGANAN_TKP' ? '#6D28D9' : '#B45309',
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
