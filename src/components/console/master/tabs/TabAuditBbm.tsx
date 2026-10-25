'use client';

import React, { useState, useEffect } from 'react';
import { getFuelAuditReportAction } from '@/app/actions/master.actions';
import { MasterTabProps } from './types';

export default function TabAuditBbm({ lookups, showToast }: MasterTabProps) {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [selectedStationId, setSelectedStationId] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

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
    window.print();
  };

  return (
    <div style={{ padding: '4px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Header Presisi Logistik */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '20px',
        backgroundColor: '#FFFFFF',
        padding: '20px',
        borderRadius: '12px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '28px' }}>⛽</span>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Audit Mileage & Rekapitulasi Klaim BBM Patroli 110
              </h2>
              <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0 0' }}>
                Biro Logistik (Bag Log) & Seksi Keuangan (Si-Keu) • Dasar Pengajuan Anggaran BBM Operasional Sah
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
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
            }}
          >
            🖨️ Cetak Berkas SPJ (PDF)
          </button>
          <button
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

      {/* Filter Bar */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '20px',
        backgroundColor: '#FFFFFF',
        padding: '14px 18px',
        borderRadius: '10px',
        border: '1px solid #E2E8F0',
        alignItems: 'center',
        flexWrap: 'wrap',
      }}>
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
            }}
          >
            <option value="">Semua Polsek & Mako Polres</option>
            {lookups?.stationLevelsList ? (
              // If Polsek list available in lookups or defaults
              null
            ) : null}
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
            {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map((m, idx) => (
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
            {[2024, 2025, 2026, 2027].map((yr) => (
              <option key={yr} value={yr}>{yr}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Metric Cards (Statistik Logistik) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '14px',
        marginBottom: '20px',
      }}>
        <div style={{
          backgroundColor: '#FFFFFF',
          padding: '16px 20px',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}>
          <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
            Total Misi Patroli 110
          </div>
          <div style={{ fontSize: '26px', fontWeight: 900, color: '#0F172A', marginTop: '4px' }}>
            {report?.totalMissions ?? 0} <span style={{ fontSize: '14px', fontWeight: 600, color: '#94A3B8' }}>Panggilan</span>
          </div>
        </div>

        <div style={{
          backgroundColor: '#FFFFFF',
          padding: '16px 20px',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}>
          <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
            Akumulasi Jarak Tempuh PP
          </div>
          <div style={{ fontSize: '26px', fontWeight: 900, color: '#0284C7', marginTop: '4px' }}>
            {report?.totalKm ?? 0} <span style={{ fontSize: '14px', fontWeight: 600, color: '#94A3B8' }}>KM</span>
          </div>
        </div>

        <div style={{
          backgroundColor: '#FFFFFF',
          padding: '16px 20px',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}>
          <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
            Kebutuhan BBM Dinas
          </div>
          <div style={{ fontSize: '26px', fontWeight: 900, color: '#059669', marginTop: '4px' }}>
            {report?.totalLiters ?? 0} <span style={{ fontSize: '14px', fontWeight: 600, color: '#94A3B8' }}>Liter</span>
          </div>
        </div>

        <div style={{
          backgroundColor: '#FFFFFF',
          padding: '16px 20px',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}>
          <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
            Estimasi Anggaran Klaim
          </div>
          <div style={{ fontSize: '22px', fontWeight: 900, color: '#D97706', marginTop: '6px' }}>
            Rp {Number(report?.totalCostRupiah || 0).toLocaleString('id-ID')}
          </div>
        </div>
      </div>

      {/* Tabel Rincian Perjalanan */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        border: '1px solid #E2E8F0',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
      }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#1E293B', margin: 0 }}>
            Rincian Log Perjalanan Respon Cepat (GPS Audit Trail)
          </h3>
          <span style={{ fontSize: '12px', color: '#64748B' }}>
            Periode: <strong>{report?.period || '-'}</strong>
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontWeight: 700 }}>
                <th style={{ padding: '12px 16px' }}>NO. TIKET</th>
                <th style={{ padding: '12px 16px' }}>TANGGAL / JAM</th>
                <th style={{ padding: '12px 16px' }}>POLSEK</th>
                <th style={{ padding: '12px 16px' }}>KENDARAAN & BBM</th>
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
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: 800,
                        backgroundColor: item.claimStatusBg || '#F1F5F9',
                        color: item.claimStatusColor || '#475569',
                      }}>
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
    </div>
  );
}
