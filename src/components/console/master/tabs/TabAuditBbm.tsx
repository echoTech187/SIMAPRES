'use client';

import React, { useState, useEffect } from 'react';
import { getFuelAuditReportAction, getPoliceStationsMasterAction } from '@/app/actions/master.actions';
import { MasterTabProps } from './types';

export interface TabAuditBbmProps {
  lookups?: any;
  showToast?: (msg: string) => void;
  userProfile?: any;
}

export default function TabAuditBbm({ lookups, showToast = () => {}, userProfile }: TabAuditBbmProps) {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [stationsList, setStationsList] = useState<any[]>([]);
  const [selectedStationId, setSelectedStationId] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];

  // Ambil daftar Mako / Polsek untuk filter dinamis & sinkronkan Mako profil pengguna
  useEffect(() => {
    getPoliceStationsMasterAction().then((res) => {
      if (res?.success && res.data) {
        setStationsList(res.data);
        if (userProfile?.stationId || userProfile?.station_id) {
          const targetStationId = Number(userProfile.stationId || userProfile.station_id);
          const matchedStation = res.data.find((s: any) => s.id === targetStationId);
          if (matchedStation) {
            setSelectedStationId(String(matchedStation.id));
          }
        }
      }
    }).catch(() => {});
  }, [userProfile]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const stationId = selectedStationId ? Number(selectedStationId) : null;
      const res = await getFuelAuditReportAction(stationId, selectedMonth, selectedYear);
      if (res?.success && res.data) {
        setReport(res.data);
      } else {
        showToast(res?.error || 'Gagal memuat rekap audit BBM.');
      }
    } catch (err: any) {
      showToast(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [selectedStationId, selectedMonth, selectedYear]);

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = '';
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 500);
  };

  const selectedStationObj = stationsList.find((s) => String(s.id) === String(selectedStationId));
  const selectedStationLabel = selectedStationObj ? selectedStationObj.station_name : 'Semua Polsek Jajaran & Mako Polres';

  return (
    <div className="audit-bbm-container" style={{ padding: '4px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Stylesheet Khusus Pratinjau Cetak Berkas SPJ Resmi Polri */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media screen {
          .spj-print-header { display: none !important; }
          .spj-signature-block { display: none !important; }
        }
        @media print {
          @page {
            size: A4 landscape;
            margin: 0;
          }
          body, html {
            background: #FFFFFF !important;
            color: #000000 !important;
            font-family: 'Times New Roman', Times, serif !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          /* Sembunyikan elemen web portal (sidebar, topbar, bottom nav, tabs, tombol aksi, filter bar) */
          header,
          header.topbar,
          .topbar,
          .top-bar,
          nav,
          .bottom-nav,
          .pawas-bottom-nav,
          .personil-bottom-nav,
          .tabs-master-wrapper,
          .pawas-desktop-tabs,
          #simopmas-superadmin-sidebar,
          .superadmin-layout-wrapper > aside,
          .escalation-alarm-banner,
          .no-print,
          .web-header-card,
          .web-filter-bar,
          button,
          select,
          input {
            display: none !important;
          }
          /* Reset container ke full paper width tanpa overflow scroll */
          .registrasi-body,
          .superadmin-layout-wrapper,
          main.registrasi-container {
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            display: block !important;
            box-shadow: none !important;
            border: none !important;
            background: #FFFFFF !important;
          }
          .audit-bbm-container {
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 10mm 14mm !important;
            box-sizing: border-box !important;
            width: 100% !important;
            display: block !important;
            box-shadow: none !important;
            border: none !important;
            background: #FFFFFF !important;
          }
          .spj-print-header {
            display: block !important;
            text-align: center !important;
            margin-bottom: 16px !important;
          }
          .spj-signature-block {
            display: flex !important;
            justify-content: space-between !important;
            margin-top: 32px !important;
            page-break-inside: avoid !important;
          }
          .summary-cards-wrapper {
            display: grid !important;
            grid-template-columns: repeat(4, 1fr) !important;
            gap: 10px !important;
            margin-bottom: 14px !important;
          }
          .summary-card {
            border: 1px solid #334155 !important;
            border-radius: 6px !important;
            box-shadow: none !important;
            padding: 8px 12px !important;
            background: #FAFAFC !important;
          }
          .summary-card-title {
            font-size: 8.5pt !important;
            font-weight: bold !important;
            color: #475569 !important;
            text-transform: uppercase !important;
          }
          .summary-card-value {
            font-size: 14pt !important;
            font-weight: bold !important;
            color: #000000 !important;
            margin-top: 2px !important;
          }
          .audit-table-wrapper {
            box-shadow: none !important;
            border: 1px solid #000000 !important;
            border-radius: 4px !important;
            overflow: visible !important;
          }
          .audit-table-header-bar {
            display: none !important;
          }
          .audit-table {
            border-collapse: collapse !important;
            width: 100% !important;
          }
          .audit-table th {
            background: #F1F5F9 !important;
            color: #000000 !important;
            border: 1px solid #000000 !important;
            font-size: 8.5pt !important;
            padding: 6px 8px !important;
            text-align: left !important;
            font-weight: bold !important;
          }
          .audit-table td {
            border: 1px solid #000000 !important;
            font-size: 8.5pt !important;
            padding: 5px 8px !important;
            color: #000000 !important;
          }
          .status-badge-print {
            border: 1px solid #475569 !important;
            padding: 2px 6px !important;
            border-radius: 4px !important;
            font-size: 7.5pt !important;
            font-weight: bold !important;
            display: inline-block !important;
          }
        }
      `,
        }}
      />

      {/* KOP SURAT POLRI RESMI (HANYA MUNCUL DI PRATINJAU CETAK / PDF) */}
      <div className="spj-print-header" style={{ borderBottom: '3px double #000000', paddingBottom: '8px', marginBottom: '14px' }}>
        <div style={{ textAlign: 'center', fontFamily: "'Times New Roman', serif" }}>
          <div style={{ fontSize: '12pt', fontWeight: 'bold', letterSpacing: '1px' }}>
            KEPOLISIAN NEGARA REPUBLIK INDONESIA
          </div>
          <div style={{ fontSize: '12pt', fontWeight: 'bold', letterSpacing: '1px' }}>
            DAERAH JAWA TENGAH
          </div>
          <div style={{ fontSize: '13pt', fontWeight: 'bold', letterSpacing: '1.5px' }}>
            RESOR PEKALONGAN
          </div>
          <div style={{ fontSize: '9pt', fontStyle: 'italic', marginTop: '2px' }}>
            Jalan Rinjani No. 1, Kajen, Kabupaten Pekalongan, Jawa Tengah 51161 • Layanan Darurat Command Center 110
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: '12px' }}>
          <div style={{ fontSize: '12pt', fontWeight: 'bold', textDecoration: 'underline' }}>
            LAPORAN PERTANGGUNGJAWABAN (SPJ) PENGGUNAAN BBM OPERASIONAL KENDARAAN PATROLI 110
          </div>
          <div style={{ fontSize: '9.5pt', marginTop: '3px', color: '#1E293B' }}>
            Dasar Pengajuan Realisasi Anggaran DIPA Polri Periode: <strong>{monthNames[selectedMonth - 1]} {selectedYear}</strong> • Kesatuan: <strong>{selectedStationLabel}</strong>
          </div>
        </div>
      </div>

      {/* Header Presisi Logistik (Tampilan Web Portal) */}
      <div
        className="web-header-card no-print"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '20px',
          backgroundColor: '#FFFFFF',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '28px' }}>⛽</span>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Audit Mileage &amp; Rekapitulasi Klaim BBM Patroli 110
              </h2>
              <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0 0' }}>
                Biro Logistik (Bag Log) &amp; Seksi Keuangan (Si-Keu) • Dasar Pengajuan Anggaran BBM Operasional Sah
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={handlePrint}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 16px',
              backgroundColor: '#1E293B',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            🖨️ Cetak Berkas SPJ (PDF)
          </button>
          <button
            type="button"
            onClick={loadReport}
            disabled={loading}
            style={{
              padding: '9px 14px',
              backgroundColor: '#F1F5F9',
              color: '#334155',
              border: '1px solid #CBD5E1',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Filter Bar (Tampilan Web Portal) */}
      <div
        className="web-filter-bar no-print"
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '20px',
          backgroundColor: '#FFFFFF',
          padding: '14px 18px',
          borderRadius: '10px',
          border: '1px solid #E2E8F0',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Filter Polsek Sektor:</label>
          <select
            value={selectedStationId}
            onChange={(e) => setSelectedStationId(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #CBD5E1',
              fontSize: '12px',
              fontWeight: 600,
              color: '#1E293B',
              backgroundColor: '#F8FAFC',
              outline: 'none',
              minWidth: '220px',
            }}
          >
            <option value="">Semua Polsek &amp; Mako Polres</option>
            {stationsList.map((st) => (
              <option key={st.id} value={st.id}>
                {st.station_name} ({st.station_level})
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Periode Bulan:</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #CBD5E1',
              fontSize: '12px',
              fontWeight: 600,
              color: '#1E293B',
              backgroundColor: '#F8FAFC',
            }}
          >
            <option value="">Pilih Bulan</option>
            {monthNames.map((m, idx) => (
              <option key={idx + 1} value={idx + 1}>{m}</option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #CBD5E1',
              fontSize: '12px',
              fontWeight: 600,
              color: '#1E293B',
              backgroundColor: '#F8FAFC',
            }}
          >
            <option value="">Pilih Tahun</option>
            {[2024, 2025, 2026, 2027].map((yr) => (
              <option key={yr} value={yr}>{yr}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Metric Cards (Statistik Logistik) */}
      <div
        className="summary-cards-wrapper"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '14px',
          marginBottom: '20px',
        }}
      >
        <div
          className="summary-card"
          style={{
            backgroundColor: '#FFFFFF',
            padding: '16px 20px',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          }}
        >
          <div className="summary-card-title" style={{ fontSize: '11.5px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
            Total Misi Patroli 110
          </div>
          <div className="summary-card-value" style={{ fontSize: '26px', fontWeight: 900, color: '#0F172A', marginTop: '4px' }}>
            {report?.totalMissions ?? 0} <span style={{ fontSize: '14px', fontWeight: 600, color: '#94A3B8' }}>Panggilan</span>
          </div>
        </div>

        <div
          className="summary-card"
          style={{
            backgroundColor: '#FFFFFF',
            padding: '16px 20px',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          }}
        >
          <div className="summary-card-title" style={{ fontSize: '11.5px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
            Akumulasi Jarak Tempuh PP
          </div>
          <div className="summary-card-value" style={{ fontSize: '26px', fontWeight: 900, color: '#0284C7', marginTop: '4px' }}>
            {report?.totalKm ?? 0} <span style={{ fontSize: '14px', fontWeight: 600, color: '#94A3B8' }}>KM</span>
          </div>
        </div>

        <div
          className="summary-card"
          style={{
            backgroundColor: '#FFFFFF',
            padding: '16px 20px',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          }}
        >
          <div className="summary-card-title" style={{ fontSize: '11.5px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
            Kebutuhan BBM Dinas
          </div>
          <div className="summary-card-value" style={{ fontSize: '26px', fontWeight: 900, color: '#059669', marginTop: '4px' }}>
            {report?.totalLiters ?? 0} <span style={{ fontSize: '14px', fontWeight: 600, color: '#94A3B8' }}>Liter</span>
          </div>
        </div>

        <div
          className="summary-card"
          style={{
            backgroundColor: '#FFFFFF',
            padding: '16px 20px',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          }}
        >
          <div className="summary-card-title" style={{ fontSize: '11.5px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
            Estimasi Anggaran Klaim
          </div>
          <div className="summary-card-value" style={{ fontSize: '22px', fontWeight: 900, color: '#D97706', marginTop: '6px' }}>
            Rp {Number(report?.totalCostRupiah || 0).toLocaleString('id-ID')}
          </div>
        </div>
      </div>

      {/* Tabel Rincian Perjalanan */}
      <div
        className="audit-table-wrapper"
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}
      >
        <div
          className="audit-table-header-bar"
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#1E293B', margin: 0 }}>
            Rincian Log Perjalanan Respon Cepat (GPS Audit Trail)
          </h3>
          <span style={{ fontSize: '12px', color: '#64748B' }}>
            Periode: <strong>{report?.period || `${selectedMonth}/${selectedYear}`}</strong>
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="audit-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontWeight: 700 }}>
                <th style={{ padding: '12px 16px' }}>NO. TIKET</th>
                <th style={{ padding: '12px 16px' }}>TANGGAL / JAM</th>
                <th style={{ padding: '12px 16px' }}>POLSEK</th>
                <th style={{ padding: '12px 16px' }}>KENDARAAN &amp; BBM</th>
                <th style={{ padding: '12px 16px' }}>AWAK REGU (BUDDY)</th>
                <th style={{ padding: '12px 16px' }}>JARAK PP</th>
                <th style={{ padding: '12px 16px' }}>KONSUMSI BBM</th>
                <th style={{ padding: '12px 16px' }}>BIAYA KLAIM</th>
                <th style={{ padding: '12px 16px' }}>STATUS KLAIM</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
                    Memuat data audit BBM logistik...
                  </td>
                </tr>
              ) : !report?.items || report.items.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
                    Belum ada rekaman perjalanan 110 yang terekam pada periode ini.
                  </td>
                </tr>
              ) : (
                report.items.map((item: any, idx: number) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 800, color: '#0284C7', fontFamily: 'monospace' }}>
                      {item.nomorTiket}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#475569' }}>
                      {new Date(item.tanggal).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#1E293B' }}>
                      {item.stationName}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 700, color: '#1E293B' }}>{item.nomorLambung}</div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>{item.fuelType}</div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, color: '#1E293B' }}>1. {item.crewLeader}</div>
                      {item.crewPartner && item.crewPartner !== '-' && (
                        <div style={{ fontSize: '11px', color: '#64748B' }}>2. {item.crewPartner}</div>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0284C7' }}>
                      {item.roundTripKm} km
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#059669' }}>
                      {item.fuelLitersUsed} L
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#D97706' }}>
                      Rp {Number(item.fuelCostEstimated || 0).toLocaleString('id-ID')}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        className="status-badge-print"
                        style={{
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontSize: '11px',
                          fontWeight: 800,
                          backgroundColor: item.claimStatusBg || '#F1F5F9',
                          color: item.claimStatusColor || '#475569',
                        }}
                      >
                        {item.claimStatus}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* LEMBAR PENGESAHAN TANDA TANGAN (PAWAS & KASI KEUANGAN / BAG LOG) */}
      <div
        className="spj-signature-block"
        style={{
          display: 'none',
          justifyContent: 'space-between',
          marginTop: '32px',
          fontFamily: "'Times New Roman', serif",
          fontSize: '10.5pt',
          pageBreakInside: 'avoid',
        }}
      >
        <div style={{ textAlign: 'center', minWidth: '240px' }}>
          <div>Mengetahui &amp; Memverifikasi Lapangan,</div>
          <div style={{ fontWeight: 'bold', marginTop: '3px' }}>PERWIRA PENGAWAS (PAWAS)</div>
          <div style={{ height: '65px' }} />
          <div style={{ fontWeight: 'bold', textDecoration: 'underline' }}>AKP Eko Susanto, S.I.K.</div>
          <div style={{ fontSize: '9pt' }}>PAWAS PIKET SIAGA 110</div>
        </div>

        <div style={{ textAlign: 'center', minWidth: '240px' }}>
          <div>Kajen, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
          <div style={{ fontWeight: 'bold', marginTop: '3px' }}>PENGELOLA LOGISTIK &amp; ANGGARAN</div>
          <div style={{ height: '65px' }} />
          <div style={{ fontWeight: 'bold', textDecoration: 'underline' }}>Aiptu Herman Sulistyo</div>
          <div style={{ fontSize: '9pt' }}>KASUBBAG LOG / SI-KEU POLRES</div>
        </div>
      </div>
    </div>
  );
}
