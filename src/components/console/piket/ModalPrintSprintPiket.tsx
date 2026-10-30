'use client';

import ResponsiveModal from '@/components/ui/ResponsiveModal';
import { Printer } from 'lucide-react';

interface ModalPrintSprintPiketProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: any;
  dateStr?: string;
}

export default function ModalPrintSprintPiket({
  isOpen,
  onClose,
  schedule,
  dateStr,
}: ModalPrintSprintPiketProps) {
  if (!isOpen || !schedule) return null;

  const stationName = (schedule.station?.station_name || 'POLRES METRO JAKARTA SELATAN').toUpperCase();
  const stationLevel = (schedule.station?.station_level || 'POLRES').toUpperCase();
  const sprintNumber = schedule.sprint_number || 'Sprin/128/X/HUK.6.6./2026';
  
  const rawDate = schedule.schedule_date || dateStr;
  const formattedDate = rawDate
    ? new Date(rawDate).toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

  const handlePrint = () => {
    const printContent = document.getElementById('print-document-area');
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Cetak Sprin & BA Serah Terima Piket - ${sprintNumber}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 15mm 15mm 15mm 15mm;
            }
            body {
              font-family: 'Times New Roman', Times, serif;
              color: #000;
              background: #fff;
              margin: 0;
              padding: 0;
              font-size: 11pt;
              line-height: 1.3;
            }
            .kop {
              text-align: center;
              border-bottom: 2px solid #000;
              padding-bottom: 8px;
              margin-bottom: 15px;
            }
            .kop h3 { margin: 0; font-size: 11pt; font-weight: normal; text-decoration: underline; }
            .kop h4 { margin: 2px 0; font-size: 10pt; font-weight: normal; }
            .judul-dokumen {
              text-align: center;
              margin: 15px 0;
            }
            .judul-dokumen h2 {
              margin: 0;
              font-size: 12pt;
              font-weight: bold;
              text-decoration: underline;
              letter-spacing: 0.5px;
            }
            .judul-dokumen p {
              margin: 2px 0 0 0;
              font-size: 10.5pt;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 10px 0;
              font-size: 10pt;
            }
            th, td {
              border: 1px solid #000;
              padding: 5px 8px;
              vertical-align: middle;
            }
            th {
              background-color: #f2f2f2;
              font-weight: bold;
              text-align: center;
            }
            .section-title {
              font-weight: bold;
              margin-top: 15px;
              margin-bottom: 5px;
              font-size: 10.5pt;
              text-transform: uppercase;
            }
            .ttd-box {
              width: 100%;
              margin-top: 30px;
              display: flex;
              justify-content: space-between;
              page-break-inside: avoid;
            }
            .ttd-item {
              text-align: center;
              width: 45%;
            }
            .ttd-space {
              height: 60px;
            }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 400);
  };

  const members = schedule.members || [];
  const pawas = schedule.pawas;
  const kaSpkt = schedule.ka_spkt;

  return (
    <ResponsiveModal isOpen={isOpen} onClose={onClose} title="Cetak Surat Perintah & Berita Acara Piket">
      <div style={{ maxHeight: '80vh', overflowY: 'auto', padding: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', background: '#F8FAFC', padding: '12px 16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
          <div>
            <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '15px' }}>
              Dokumen Resmi S.O.P. Piket Jaga Polri
            </div>
            <div style={{ fontSize: '12px', color: '#64748B' }}>
              Sesuai format baku Perkap Polri No. 2 Tahun 2021 & Jukmin Piket Jaga Mako
            </div>
          </div>
          <button
            onClick={handlePrint}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 18px',
              background: '#1E293B',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            <Printer size={16} />
            Cetak / Simpan PDF
          </button>
        </div>

        {/* PRINT DOCUMENT CONTAINER */}
        <div
          id="print-document-area"
          style={{
            background: '#FFFFFF',
            border: '1px solid #CBD5E1',
            borderRadius: '6px',
            padding: '24px 30px',
            color: '#000000',
            fontFamily: "'Times New Roman', Times, serif",
            lineHeight: 1.35,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
        >
          {/* KOP SURAT POLRI */}
          <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '8px', marginBottom: '14px' }}>
            <div style={{ fontSize: '12pt', fontWeight: 'bold', letterSpacing: '0.5px' }}>
              KEPOLISIAN NEGARA REPUBLIK INDONESIA
            </div>
            <div style={{ fontSize: '11pt', fontWeight: 'bold' }}>
              DAERAH KHUSUS IBUKOTA JAKARTA
            </div>
            <div style={{ fontSize: '11pt', fontWeight: 'bold' }}>
              {stationName}
            </div>
            <div style={{ fontSize: '9pt', color: '#333' }}>
              {schedule.station?.address || 'Jl. Wijaya II No.42, Kebayoran Baru, Jakarta Selatan'} - Telp. Piket: {schedule.station?.phone_piket || '110 / (021) 7206012'}
            </div>
          </div>

          {/* JUDUL SPRIN */}
          <div style={{ textAlign: 'center', margin: '12px 0 16px 0' }}>
            <div style={{ fontSize: '12pt', fontWeight: 'bold', textDecoration: 'underline' }}>
              SURAT PERINTAH TUGAS PIKET JAGA MAKO & PELAYANAN 110
            </div>
            <div style={{ fontSize: '10.5pt', marginTop: '2px' }}>
              Nomor: {sprintNumber}
            </div>
          </div>

          <div style={{ fontSize: '10pt', marginBottom: '10px' }}>
            <strong>Pertimbangan :</strong> Bahwa dalam rangka memelihara keamanan dan ketertiban masyarakat, kesiapsiagaan markas komando, serta pelayanan cepat pengaduan masyarakat 110 secara terintegrasi di lingkungan {stationName}.
          </div>

          <div style={{ fontSize: '10pt', marginBottom: '12px' }}>
            <strong>Dasar :</strong>
            <ol style={{ margin: '4px 0 0 16px', padding: 0 }}>
              <li>Undang-Undang Nomor 2 Tahun 2002 tentang Kepolisian Negara Republik Indonesia.</li>
              <li>Peraturan Kepolisian Negara Republik Indonesia Nomor 2 Tahun 2021 tentang Susunan Organisasi dan Tata Kerja Tingkat Polres dan Polsek.</li>
              <li>SOP Piket Jaga Markas Komando dan Layanan Pengaduan SIMAPRES 110.</li>
            </ol>
          </div>

          <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '11pt', margin: '10px 0' }}>
            D I P E R I N T A H K A N
          </div>

          <div style={{ fontSize: '10pt', marginBottom: '8px' }}>
            <strong>Kepada :</strong> Personel Polri yang namanya tercantum dalam lampiran Surat Perintah ini:
          </div>

          {/* TABEL ANGGOTA PIKET */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9.5pt', margin: '8px 0 14px 0' }}>
            <thead>
              <tr style={{ background: '#F2F2F2' }}>
                <th style={{ border: '1px solid #000', padding: '4px 6px', width: '30px', textAlign: 'center' }}>NO</th>
                <th style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'left' }}>NAMA & PANGKAT / NRP</th>
                <th style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'left' }}>JABATAN / FUNGSI</th>
                <th style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'left' }}>PERAN PIKET</th>
                <th style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'left' }}>POS / PLOTING</th>
              </tr>
            </thead>
            <tbody>
              {/* Pawas */}
              {pawas && (
                <tr style={{ fontWeight: 'bold' }}>
                  <td style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'center' }}>1</td>
                  <td style={{ border: '1px solid #000', padding: '4px 6px' }}>
                    {pawas.user?.full_name || 'Kompol Agus Wijaya, S.I.K.'}
                    <br />
                    <span style={{ fontSize: '8.5pt', fontWeight: 'normal' }}>{pawas.rank_pangkat} NRP {pawas.nrp}</span>
                  </td>
                  <td style={{ border: '1px solid #000', padding: '4px 6px' }}>{pawas.jabatan || 'Pawas Siaga Mako'}</td>
                  <td style={{ border: '1px solid #000', padding: '4px 6px' }}>PERWIRA PENGAWAS (PAWAS)</td>
                  <td style={{ border: '1px solid #000', padding: '4px 6px' }}>Komando Mako</td>
                </tr>
              )}
              {/* Ka SPKT */}
              {kaSpkt && (
                <tr style={{ fontWeight: 'bold' }}>
                  <td style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'center' }}>2</td>
                  <td style={{ border: '1px solid #000', padding: '4px 6px' }}>
                    {kaSpkt.user?.full_name || 'Aipda Hendra Gunawan'}
                    <br />
                    <span style={{ fontSize: '8.5pt', fontWeight: 'normal' }}>{kaSpkt.rank_pangkat} NRP {kaSpkt.nrp}</span>
                  </td>
                  <td style={{ border: '1px solid #000', padding: '4px 6px' }}>{kaSpkt.jabatan || 'Ka SPKT'}</td>
                  <td style={{ border: '1px solid #000', padding: '4px 6px' }}>KEPALA SPKT (KA SPKT)</td>
                  <td style={{ border: '1px solid #000', padding: '4px 6px' }}>Sentra Pelayanan SPKT</td>
                </tr>
              )}
              {/* Members */}
              {members.map((m: any, idx: number) => {
                const off = m.officer;
                const no = (pawas ? 1 : 0) + (kaSpkt ? 1 : 0) + idx + 1;
                return (
                  <tr key={m.id || idx}>
                    <td style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'center' }}>{no}</td>
                    <td style={{ border: '1px solid #000', padding: '4px 6px' }}>
                      {off?.user?.full_name || 'Bripka Joko Santoso'}
                      <br />
                      <span style={{ fontSize: '8.5pt', color: '#444' }}>{off?.rank_pangkat} NRP {off?.nrp}</span>
                    </td>
                    <td style={{ border: '1px solid #000', padding: '4px 6px' }}>{off?.unit?.unit_name || off?.jabatan || 'Anggota'}</td>
                    <td style={{ border: '1px solid #000', padding: '4px 6px' }}>{m.role_piket?.replace(/_/g, ' ')}</td>
                    <td style={{ border: '1px solid #000', padding: '4px 6px' }}>{m.pos_penugasan || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* DOKUMEN BERITA ACARA SERAH TERIMA JAGA */}
          <div style={{ marginTop: '20px', borderTop: '2px dashed #000', paddingTop: '16px' }}>
            <div style={{ textAlign: 'center', marginBottom: '10px' }}>
              <div style={{ fontSize: '11.5pt', fontWeight: 'bold', textDecoration: 'underline' }}>
                BERITA ACARA SERAH TERIMA TUGAS JAGA & MUTASI MAKO
              </div>
              <div style={{ fontSize: '9.5pt' }}>
                Waktu Pelaksanaan: Pukul 08.00 WIB s/d Selesai ({formattedDate})
              </div>
            </div>

            <div style={{ fontSize: '10pt', marginBottom: '8px' }}>
              Telah dilaksanakan serah terima tugas jaga dari Regu Lama kepada <strong>{schedule.regu}</strong>, dengan hasil pemeriksaan fisik dan inventaris sebagai berikut:
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9.5pt', marginBottom: '10px' }}>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '4px 8px', width: '25%', fontWeight: 'bold', background: '#F9F9F9' }}>
                    1. KENDARAAN PATROLI
                  </td>
                  <td style={{ border: '1px solid #000', padding: '4px 8px' }}>
                    {schedule.ranmor_inventaris || '1 Unit Mobil Patroli R4 Sabhara (BBM Siaga), 2 Unit Trail Presisi R2.'}
                  </td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '4px 8px', fontWeight: 'bold', background: '#F9F9F9' }}>
                    2. ROMPI / BORGOL / GAWAI DINAS
                  </td>
                  <td style={{ border: '1px solid #000', padding: '4px 8px' }}>
                    {schedule.rompi_borgol_ht || '4 Rompi Level III-A, 8 Pasang Borgol, Gawai WhatsApp Dinas Siaga.'}
                  </td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '4px 8px', fontWeight: 'bold', background: '#F9F9F9' }}>
                    3. ARAHAN PAWAS
                  </td>
                  <td style={{ border: '1px solid #000', padding: '4px 8px' }}>
                    {schedule.catatan_arahan_pawas || 'Tingkatkan kewaspadaan markas dan laksanakan patroli perintis presisi di jam rawan.'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* TANDA TANGAN */}
          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', fontSize: '10pt', pageBreakInside: 'avoid' }}>
            <div style={{ textAlign: 'center', width: '45%' }}>
              Yang Menyerahkan,
              <br />
              <strong>KA SPKT REGU LAMA</strong>
              <div style={{ height: '55px' }} />
              <div style={{ textDecoration: 'underline', fontWeight: 'bold' }}>
                {kaSpkt?.user?.full_name || 'AIPDA HENDRA GUNAWAN'}
              </div>
              <div>{kaSpkt?.rank_pangkat || 'AIPDA'} NRP {kaSpkt?.nrp || '78090123'}</div>
            </div>

            <div style={{ textAlign: 'center', width: '45%' }}>
              Mengetahui / Mengesahkan,
              <br />
              <strong>PERWIRA PENGAWAS (PAWAS)</strong>
              <div style={{ height: '55px' }} />
              <div style={{ textDecoration: 'underline', fontWeight: 'bold' }}>
                {pawas?.user?.full_name || 'KOMPOL AGUS WIJAYA, S.I.K.'}
              </div>
              <div>{pawas?.rank_pangkat || 'KOMPOL'} NRP {pawas?.nrp || '82040512'}</div>
            </div>
          </div>
        </div>
      </div>
    </ResponsiveModal>
  );
}
