'use client';

import React from 'react';
import {
  Timer,
  Clock,
  CheckCircle2,
  AlertTriangle,
  X,
  MapPin,
  User,
  ShieldCheck,
  Activity,
  Zap,
} from 'lucide-react';

interface ModalSlaMonitoringProps {
  isOpen: boolean;
  onClose: () => void;
  avgResponseTime: number;
  onTimeRate: number;
  fastCount: number;
  mediumCount: number;
  slowCount: number;
  complaints: any[];
}

export default function ModalSlaMonitoring({
  isOpen,
  onClose,
  avgResponseTime,
  onTimeRate,
  fastCount,
  mediumCount,
  slowCount,
  complaints = [],
}: ModalSlaMonitoringProps) {
  if (!isOpen) return null;

  const validComplaints = Array.isArray(complaints) ? complaints : [];

  return (
    <div
      id="modal-detail-sla-pimpinan"
      className="pawas-modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        className="pawas-modal-dialog"
        style={{
          background: '#FFFFFF',
          borderRadius: '18px',
          maxWidth: '720px',
          width: '100%',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 25px 60px -15px rgba(2, 6, 23, 0.4), 0 0 1px 1px rgba(56, 189, 248, 0.2)',
          border: '1px solid #E2E8F0',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── HEADER ── */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0B192C 0%, #0F2A4A 50%, #153E75 100%)',
            color: '#FFFFFF',
            padding: '14px 18px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(56, 189, 248, 0.3)',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '9px',
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Timer size={19} color="#38BDF8" />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: 900, letterSpacing: '-0.2px', color: '#FFFFFF', lineHeight: 1.3 }}>
                Audit SLA &amp; Waktu Tanggap 110
              </div>
              <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Standar Respon Cepat Presisi • Target &lt; 10 Menit
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              borderRadius: '8px',
              color: '#FFFFFF',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'all 0.15s ease',
            }}
            title="Tutup Modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── BODY ── */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1, background: '#F8FAFC' }}>
          {/* Top Row: 2 Hero KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '12px' }}>
            {/* Hero 1: Avg Response */}
            <div
              style={{
                background: 'linear-gradient(135deg, #F0F9FF 0%, #FFFFFF 100%)',
                border: '1.5px solid #BAE6FD',
                borderRadius: '12px',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
              }}
            >
              <div>
                <div style={{ fontSize: '10px', fontWeight: 800, color: '#0284C7', letterSpacing: '0.6px' }}>
                  RATA-RATA RESPON
                </div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: '#0F172A', marginTop: '2px', lineHeight: 1 }}>
                  {avgResponseTime || 0} <span style={{ fontSize: '12px', color: '#0284C7' }}>MENIT</span>
                </div>
                <div style={{ fontSize: '10px', color: '#64748B', marginTop: '4px', fontWeight: 600 }}>
                  Target: &lt; 10 Menit
                </div>
              </div>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: '#E0F2FE',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Clock size={20} color="#0284C7" />
              </div>
            </div>

            {/* Hero 2: On-time Rate */}
            <div
              style={{
                background: 'linear-gradient(135deg, #ECFDF5 0%, #FFFFFF 100%)',
                border: '1.5px solid #A7F3D0',
                borderRadius: '12px',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
              }}
            >
              <div>
                <div style={{ fontSize: '10px', fontWeight: 800, color: '#059669', letterSpacing: '0.6px' }}>
                  TEPAT WAKTU (SLA)
                </div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: '#065F46', marginTop: '2px', lineHeight: 1 }}>
                  {onTimeRate || 0}<span style={{ fontSize: '14px' }}>%</span>
                </div>
                <div style={{ fontSize: '10px', color: '#059669', marginTop: '4px', fontWeight: 700 }}>
                  Presisi Quick Response
                </div>
              </div>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: '#D1FAE5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <CheckCircle2 size={20} color="#059669" />
              </div>
            </div>
          </div>

          {/* Bottom Row: 3 Breakdown Category Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '18px' }}>
            {/* < 5 Menit */}
            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid #BBF7D0',
                borderTop: '3.5px solid #16A34A',
                borderRadius: '10px',
                padding: '10px 12px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '9.5px', fontWeight: 800, color: '#166534', letterSpacing: '0.4px' }}>
                &lt; 5 MENIT
              </div>
              <div style={{ fontSize: '18px', fontWeight: 900, color: '#16A34A', marginTop: '3px', lineHeight: 1 }}>
                {fastCount || 0}
              </div>
              <div style={{ fontSize: '9.5px', color: '#64748B', marginTop: '3px', fontWeight: 600 }}>
                Sangat Cepat
              </div>
            </div>

            {/* 5-10 Menit */}
            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid #BFDBFE',
                borderTop: '3.5px solid #0284C7',
                borderRadius: '10px',
                padding: '10px 12px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '9.5px', fontWeight: 800, color: '#0284C7', letterSpacing: '0.4px' }}>
                5 - 10 MENIT
              </div>
              <div style={{ fontSize: '18px', fontWeight: 900, color: '#0284C7', marginTop: '3px', lineHeight: 1 }}>
                {mediumCount || 0}
              </div>
              <div style={{ fontSize: '9.5px', color: '#64748B', marginTop: '3px', fontWeight: 600 }}>
                Sesuai Standar
              </div>
            </div>

            {/* > 10 Menit */}
            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid #FECACA',
                borderTop: '3.5px solid #DC2626',
                borderRadius: '10px',
                padding: '10px 12px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '9.5px', fontWeight: 800, color: '#DC2626', letterSpacing: '0.4px' }}>
                &gt; 10 MENIT
              </div>
              <div style={{ fontSize: '18px', fontWeight: 900, color: '#DC2626', marginTop: '3px', lineHeight: 1 }}>
                {slowCount || 0}
              </div>
              <div style={{ fontSize: '9.5px', color: '#64748B', marginTop: '3px', fontWeight: 600 }}>
                Evaluasi Terlambat
              </div>
            </div>
          </div>

          {/* ── AUDIT LIST / EMPTY STATE ── */}
          <div style={{ marginTop: '10px' }}>
            <div
              style={{
                fontSize: '11.5px',
                fontWeight: 800,
                color: '#475569',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Activity size={14} color="#0284C7" />
              <span>RIWAYAT AUDIT KASUS TERSELESAIKAN HARI INI</span>
              <span style={{ fontSize: '10.5px', color: '#94A3B8', fontWeight: 700 }}>({validComplaints.length})</span>
            </div>

            {validComplaints.length === 0 ? (
              /* Beautiful Futuristic Empty State */
              <div
                style={{
                  background: '#FFFFFF',
                  border: '1.5px dashed #CBD5E1',
                  borderRadius: '14px',
                  padding: '36px 20px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '14px',
                    background: '#F0F9FF',
                    border: '1px solid #BAE6FD',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '14px',
                  }}
                >
                  <Clock size={28} color="#0284C7" />
                </div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A', marginBottom: '4px' }}>
                  Belum Ada Riwayat Kasus Selesai Hari Ini
                </div>
                <div style={{ fontSize: '11.5px', color: '#64748B', maxWidth: '420px', lineHeight: 1.5, marginBottom: '14px' }}>
                  Audit waktu tanggap dihitung otomatis oleh sistem saat personel patroli tiba di TKP dan menyelesaikan laporan masyarakat di wilayah hukum.
                </div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#ECFDF5',
                    color: '#059669',
                    border: '1px solid #A7F3D0',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: 800,
                  }}
                >
                  <span className="pulse-live-dot" style={{ width: '6px', height: '6px' }} />
                  <span>SISTEM TELEMETRI SIAGA AUDIT SLA AKTIF</span>
                </div>
              </div>
            ) : (
              /* Render Case Cards */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {validComplaints.map((c: any) => {
                  const respTime = c.responseTimeMinutes ?? c.durasiMenit ?? null;
                  const isSuccess = respTime !== null && respTime <= 10;

                  return (
                    <div
                      key={c.id || c.nomorTiket}
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderLeft: `4px solid ${isSuccess ? '#16A34A' : '#DC2626'}`,
                        borderRadius: '10px',
                        padding: '12px 14px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '10px',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontWeight: 800, fontSize: '13px', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ color: '#0284C7' }}>{c.nomorTiket}</span>
                          <span>-</span>
                          <span>{c.jenisKejadian}</span>
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748B', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <MapPin size={11} color="#64748B" />
                            <span>{c.tkpAlamatTeks || 'Wilayah Hukum'}</span>
                          </span>
                          <span>•</span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <User size={11} color="#64748B" />
                            <span>Petugas: {c.assignedOfficer ? `${c.assignedOfficer.rankPangkat} ${c.assignedOfficer.namaLengkap}` : 'Unit Patroli'}</span>
                          </span>
                        </div>
                      </div>

                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 800,
                          color: isSuccess ? '#15803D' : '#DC2626',
                          background: isSuccess ? '#F0FDF4' : '#FEF2F2',
                          border: `1px solid ${isSuccess ? '#BBF7D0' : '#FECACA'}`,
                          padding: '4px 10px',
                          borderRadius: '6px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <Zap size={12} color={isSuccess ? '#15803D' : '#DC2626'} />
                        <span>
                          {respTime !== null
                            ? `${respTime} Menit (${isSuccess ? 'Tepat Waktu' : 'Terlambat'})`
                            : 'Dalam Penanganan'}
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div
          style={{
            padding: '12px 18px',
            background: '#FFFFFF',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
            <ShieldCheck size={15} color="#059669" style={{ flexShrink: 0 }} />
            <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Target Quick Response: &lt; 10 Menit
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 18px',
              background: '#0F172A',
              color: '#FFFFFF',
              fontSize: '12px',
              fontWeight: 800,
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              transition: 'all 0.15s ease',
            }}
          >
            Tutup Rincian
          </button>
        </div>
      </div>
    </div>
  );
}
