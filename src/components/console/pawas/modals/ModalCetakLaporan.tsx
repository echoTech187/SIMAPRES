'use client';

import React from 'react';

interface ModalCetakLaporanProps {
  isOpen: boolean;
  onClose: () => void;
  registeredUnits: any[];
  fleetUnits: any[];
  ikmStats: any;
  totalLaporan: number;
  userProfile: any;
  stationRankings?: any;
  operatorRankings?: any;
}

export default function ModalCetakLaporan({
  isOpen,
  onClose,
  registeredUnits,
  fleetUnits,
  ikmStats,
  totalLaporan,
  userProfile,
  stationRankings,
  operatorRankings,
}: ModalCetakLaporanProps) {
  if (!isOpen) return null;

  const stationList = stationRankings?.overallRanking ? stationRankings.overallRanking : [];
  const operatorList = operatorRankings?.overallRanking ? operatorRankings.overallRanking : [];

  const handlePrint = () => {
    const origTitle = document.title;
    document.title = '';
    window.print();
    setTimeout(() => {
      document.title = origTitle;
    }, 500);
  };

  return (
    <div
      id="modal-cetak-laporan-pawas"
      className="pawas-modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        background: 'rgba(15,23,42,0.85)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        className="pawas-modal-dialog"
        style={{
          background: 'white',
          borderRadius: '12px',
          maxWidth: '840px',
          width: '100%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
          overflow: 'hidden',
          border: '1px solid #CBD5E1',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ background: '#0F172A', color: 'white', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📄</span>
            <span style={{ fontSize: '13px', fontWeight: 800 }}>PRATINJAU DOKUMEN MUTASI RESMI OPERASIONAL (FORMAT POLRI)</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={handlePrint}
              style={{ background: '#10B981', color: 'white', border: 'none', padding: '7px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}
            >
              🖨️ Cetak Dokumen / PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: 'none', width: '28px', height: '28px', borderRadius: '50%', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Dokumen Format Standar Polri */}
        <div style={{ padding: '40px 48px', overflowY: 'auto', flex: 1, fontFamily: "'Times New Roman', Times, serif", lineHeight: 1.45, fontSize: '13.5px', color: '#000000' }}>
          <div style={{ borderBottom: '3px double #000000', paddingBottom: '10px', marginBottom: '18px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12.5pt', fontWeight: 'bold', letterSpacing: '1px' }}>
                KEPOLISIAN NEGARA REPUBLIK INDONESIA
              </div>
              <div style={{ fontSize: '12.5pt', fontWeight: 'bold', letterSpacing: '1px' }}>
                DAERAH METRO JAYA
              </div>
              <div style={{ fontSize: '13.5pt', fontWeight: 'bold', letterSpacing: '1.5px' }}>
                RESOR METRO JAKARTA SELATAN
              </div>
              <div style={{ fontSize: '9.5pt', fontStyle: 'italic', marginTop: '3px' }}>
                Jalan Wijaya II No. 42, Kebayoran Baru, Jakarta Selatan • Telp: (021) 7201110
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ fontSize: '13pt', fontWeight: 'bold', textDecoration: 'underline' }}>
              LAPORAN HASIL PELAKSANAAN TUGAS PERWIRA PENGAWAS (PAWAS)
            </div>
            <div style={{ fontSize: '11pt', fontWeight: 'bold', marginTop: '3px' }}>
              Nomor: LAP-PAWAS / {new Date().getMonth() + 1} / {new Date().getFullYear()} / SPKT-METRO
            </div>
            <div style={{ fontSize: '10pt', fontStyle: 'italic', marginTop: '3px' }}>
              Masa Dinas Piket: {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <strong>I. DASAR HUKUM &amp; PENUGASAN:</strong>
            <div style={{ paddingLeft: '18px', textAlign: 'justify' }}>
              1. Peraturan Kepala Kepolisian Negara Republik Indonesia Nomor 2 Tahun 2021 tentang Susunan Organisasi dan Tata Kerja Pada Tingkat Kepolisian Resor.<br />
              2. Surat Perintah Penunjukan Perwira Pengawas (PAWAS) Piket Siaga Markas Komando dan Sentra Pelayanan Kepolisian Terpadu 110.
            </div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <strong>II. KUAT PERSONEL &amp; KESIAPSIAGAAN SARPRAS:</strong>
            <div style={{ paddingLeft: '18px' }}>
              a. <strong>Kekuatan Riil Personel Piket:</strong> {registeredUnits.length} Personel terdaftar aktif di sistem.<br />
              b. <strong>Kesiapan Armada Taktis:</strong> {fleetUnits.length} Unit Ranmor Dinas Presisi aktif.<br />
              c. <strong>Komunikasi Kedinasan:</strong> Saluran koordinasi WhatsApp dinas dan notifikasi sistem terhubung aktif.
            </div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <strong>III. INDEKS KEPUASAN MASYARAKAT &amp; VALIDITAS ADUAN 110:</strong>
            <div style={{ paddingLeft: '18px' }}>
              Berdasarkan evaluasi survei masyarakat melalui portal publik SIMOPMAS 110, diperoleh <strong>Indeks Kepuasan Masyarakat (IKM): {ikmStats?.avgRating ? ikmStats.avgRating.toFixed(1) + ' / 5.0' : '-'}</strong>.
            </div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <strong>IV. REKAPITULASI PELAYANAN PANGGILAN DARURAT 110:</strong>
            <div style={{ paddingLeft: '18px' }}>
              Selama masa dinas telah diterima dan dikendalikan sebanyak <strong>{totalLaporan} Laporan Pengaduan Warga</strong> melalui Call Center 110.
            </div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <strong>V. EVALUASI KINERJA TERITORIAL POLSEK JAJARAN (TIER 1 ANEV KAPOLRES):</strong>
            <div style={{ paddingLeft: '18px', marginTop: '6px' }}>
              <div style={{ fontSize: '10pt', marginBottom: '8px', textAlign: 'justify' }}>
                Matriks evaluasi komparatif kecepatan waktu tanggap (Average Response Time), tingkat penyelesaian aduan, dan kepatuhan standar SLA Presisi 110 antar Polsek jajaran sebagai bahan Analisis &amp; Evaluasi (Anev) Pimpinan:
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt', border: '1px solid #000' }}>
                <thead>
                  <tr style={{ background: '#F1F5F9', borderBottom: '1px solid #000' }}>
                    <th style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'center', width: '30px' }}>No</th>
                    <th style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'left' }}>Kesatuan / Mako Polsek</th>
                    <th style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'center' }}>Total Masuk</th>
                    <th style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'center' }}>Selesai (%)</th>
                    <th style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'center' }}>Waktu Respon (ART)</th>
                    <th style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'center' }}>Rating IKM</th>
                    <th style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'center' }}>Kepatuhan SLA</th>
                  </tr>
                </thead>
                <tbody>
                  {stationList.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ border: '1px solid #000', padding: '6px', textAlign: 'center', fontStyle: 'italic' }}>
                        Data evaluasi Polsek jajaran sedang dihimpun oleh sistem
                      </td>
                    </tr>
                  ) : (
                    stationList.map((st: any, idx: number) => (
                      <tr key={st.stationId}>
                        <td style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'center' }}>{idx + 1}</td>
                        <td style={{ border: '1px solid #000', padding: '4px 6px' }}>
                          <strong>{st.stationName}</strong> ({st.stationLevel ? st.stationLevel : 'POLSEK'})
                        </td>
                        <td style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'center' }}>{st.totalMasuk}</td>
                        <td style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'center' }}>
                          {st.totalSelesai} ({st.completionRate}%)
                        </td>
                        <td style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'center' }}>
                          {st.avgResponseTimeMinutes != null && st.avgResponseTimeMinutes > 0 ? `± ${st.avgResponseTimeMinutes} m` : '-'}
                        </td>
                        <td style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'center' }}>
                          {st.avgRating > 0 ? `${st.avgRating.toFixed(1)} / 5.0` : '-'}
                        </td>
                        <td style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'center', fontWeight: 'bold' }}>
                          {st.slaStatusLabel ? st.slaStatusLabel : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              <div style={{ fontSize: '8.5pt', fontStyle: 'italic', marginTop: '6px' }}>
                Catatan Pawas: Disusun sebagai rujukan berkala Anev Pimpinan (Kapolres) untuk pembinaan operasional kewilayahan dan reward bagi Polsek jajaran dengan integritas respon terbaik.
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <strong>VI. REKAPITULASI AKUNTABILITAS PETUGAS OPERATOR SENTRA LAYANAN 110 &amp; CAD:</strong>
            <div style={{ paddingLeft: '18px', marginTop: '6px' }}>
              <div style={{ fontSize: '10pt', marginBottom: '8px', textAlign: 'justify' }}>
                Hasil audit digital kecepatan intake berkas CAD 110, kepatuhan SOP rekomendasi satuan fungsi, dan indeks kepuasan pelayanan perorangan operator piket:
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt', border: '1px solid #000' }}>
                <thead>
                  <tr style={{ background: '#F1F5F9', borderBottom: '1px solid #000' }}>
                    <th style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'center', width: '30px' }}>No</th>
                    <th style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'left' }}>Nama Operator / NRP</th>
                    <th style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'center' }}>Total Tiket CAD</th>
                    <th style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'center' }}>Kecepatan Intake</th>
                    <th style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'center' }}>Kepatuhan SOP</th>
                    <th style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'center' }}>Kepuasan Warga</th>
                    <th style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'center' }}>Predikat Mutu</th>
                  </tr>
                </thead>
                <tbody>
                  {operatorList.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ border: '1px solid #000', padding: '6px', textAlign: 'center', fontStyle: 'italic' }}>
                        Data evaluasi kinerja operator 110 sedang dihimpun oleh sistem
                      </td>
                    </tr>
                  ) : (
                    operatorList.map((op: any, idx: number) => (
                      <tr key={op.operatorId}>
                        <td style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'center' }}>{idx + 1}</td>
                        <td style={{ border: '1px solid #000', padding: '4px 6px' }}>
                          <strong>{op.operatorName}</strong> ({op.operatorNrp ? `NRP: ${op.operatorNrp}` : 'Operator 110'})
                        </td>
                        <td style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'center' }}>{op.totalTiketInput}</td>
                        <td style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'center' }}>
                          {op.avgIntakeMinutes > 0 ? `± ${op.avgIntakeMinutes.toFixed(1)} m` : '< 1 m'}
                        </td>
                        <td style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'center' }}>
                          {op.sopComplianceRate}%
                        </td>
                        <td style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'center' }}>
                          {op.avgRating > 0 ? `${op.avgRating.toFixed(1)} / 5.0` : '-'}
                        </td>
                        <td style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'center', fontWeight: 'bold' }}>
                          {op.predicateBadge ? op.predicateBadge : 'Standar'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              <div style={{ fontSize: '8.5pt', fontStyle: 'italic', marginTop: '6px' }}>
                Catatan Pawas: Disusun berdasarkan rekapitulasi data CAD 110 terpadu untuk apresiasi berkala petugas piket dan peningkatan mutu etika penerimaan pengaduan.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '30px', flexWrap: 'wrap', gap: '20px' }}>
            <div style={{ fontSize: '10.5pt' }}>
              <strong>Tembusan Yth:</strong><br />
              1. Kapolres Metro Jakarta Selatan<br />
              2. Wakapolres Metro Jakarta Selatan<br />
              3. Kabag Ops Polres Metro Jakarta Selatan<br />
              4. Kasi Propam Polres Metro Jakarta Selatan
            </div>
            <div style={{ textAlign: 'center', minWidth: '240px' }}>
              <div>Jakarta, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
              <div style={{ fontWeight: 'bold', marginTop: '2px' }}>PERWIRA PENGAWAS (PAWAS),</div>
              <div style={{ height: '60px' }} />
              <div style={{ fontWeight: 'bold', textDecoration: 'underline' }}>{userProfile.fullName}</div>
              <div style={{ fontSize: '10pt' }}>{userProfile.pangkat} NRP {userProfile.nrp}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
