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
}

export default function ModalCetakLaporan({
  isOpen,
  onClose,
  registeredUnits,
  fleetUnits,
  ikmStats,
  totalLaporan,
  userProfile,
}: ModalCetakLaporanProps) {
  if (!isOpen) return null;

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
              onClick={() => window.print()}
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
              c. <strong>Inventaris Senpi &amp; Alkom:</strong> Gudang jaga lengkap terkunci, radio HT repeater Channel 110 aktif.
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
              <div style={{ height: '55px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#153E75', fontSize: '11px', fontWeight: 'bold', border: '1px dashed #94A3B8', margin: '8px auto', width: '180px', borderRadius: '6px', background: '#F8FAFC' }}>
                [ TERVERIFIKASI DIGITAL ]
              </div>
              <div style={{ fontWeight: 'bold', textDecoration: 'underline' }}>{userProfile.fullName}</div>
              <div style={{ fontSize: '10pt' }}>{userProfile.pangkat} NRP {userProfile.nrp}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
