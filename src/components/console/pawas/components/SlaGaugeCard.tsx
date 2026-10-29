'use client';

import React from 'react';
import { Clock, CheckCircle2 } from 'lucide-react';

export interface SlaGaugeCardProps {
  isReady: boolean;
  completedWithTime: any[];
  avgResponseTime: string;
  onTimeRate: string;
  fastCount: number;
  mediumCount: number;
  slowCount: number;
  onClick: () => void;
}

export default function SlaGaugeCard({
  isReady,
  completedWithTime,
  avgResponseTime,
  onTimeRate,
  fastCount,
  mediumCount,
  slowCount,
  onClick,
}: SlaGaugeCardProps) {
  if (!isReady) {
    return (
      <div
        className="cyber-skeleton"
        style={{
          height: '190px',
          borderRadius: '16px',
        }}
      />
    );
  }

  const hasData = completedWithTime.length > 0;
  const fastPct = hasData ? Math.round((fastCount / completedWithTime.length) * 100) : 0;
  const medPct = hasData ? Math.round((mediumCount / completedWithTime.length) * 100) : 0;
  const slowPct = hasData ? Math.round((slowCount / completedWithTime.length) * 100) : 0;

  return (
    <div
      id="card-pimpinan-sla"
      className="card-panel futuristic-card"
      onClick={onClick}
      style={{
        padding: '18px',
        cursor: 'pointer',
        borderRadius: '16px',
      }}
      title="Klik untuk melihat audit rincian waktu tanggap seluruh kasus"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
        <div className="card-title" style={{ marginBottom: 0, fontSize: '13px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '6px', color: '#0F172A' }}>
          <Clock size={16} color="#0284C7" />
          <span>WAKTU TANGGAP PATROLI</span>
          <span style={{ fontSize: '9px', fontWeight: 800, color: '#0284C7', background: '#F0F9FF', border: '1px solid #BAE6FD', padding: '1px 6px', borderRadius: '10px' }}>
            AUDIT
          </span>
        </div>
        <span style={{ background: '#ECFDF5', color: '#059669', fontWeight: 800, fontSize: '9.5px', padding: '2px 8px', borderRadius: '6px', border: '1px solid #A7F3D0', whiteSpace: 'nowrap' }}>
          TARGET &lt; 10 MENIT
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '14px' }}>
        <div
          style={{
            width: '76px',
            height: '76px',
            position: 'relative',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)',
            borderRadius: '50%',
            border: '4px solid #0284C7',
            boxShadow: '0 4px 16px rgba(2, 132, 199, 0.25)',
          }}
        >
          <span style={{ fontSize: '19px', fontWeight: 900, color: '#0F172A', lineHeight: 1 }}>
            {hasData ? avgResponseTime : '-'}
          </span>
          <span style={{ fontSize: '9px', color: '#0284C7', fontWeight: 800, marginTop: '2px' }}>
            {hasData ? 'MENIT' : 'STANDBY'}
          </span>
        </div>
        <div>
          <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#15803D', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <CheckCircle2 size={14} color="#15803D" />
            <span>{hasData ? `Tepat Waktu: ${onTimeRate}%` : 'Standar Respon Siaga SIMOPMAS 110'}</span>
          </div>
          <div style={{ fontSize: '11px', color: '#64748B', lineHeight: 1.4, marginTop: '3px' }}>
            {hasData
              ? 'Rata-rata kecepatan tiba unit patroli di TKP sejak laporan diterima.'
              : 'Waktu respon tanggap dihitung otomatis saat kasus selesai ditangani.'}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', background: '#F8FAFC', padding: '10px', borderRadius: '10px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
        <div>
          <div style={{ fontSize: '9.5px', color: '#64748B', fontWeight: 800 }}>&lt; 5 Menit</div>
          <div style={{ fontSize: '13px', fontWeight: 900, color: '#16A34A', marginTop: '2px' }}>
            {fastCount} ({fastPct}%)
          </div>
        </div>
        <div>
          <div style={{ fontSize: '9.5px', color: '#64748B', fontWeight: 800 }}>5-10 Menit</div>
          <div style={{ fontSize: '13px', fontWeight: 900, color: '#0284C7', marginTop: '2px' }}>
            {mediumCount} ({medPct}%)
          </div>
        </div>
        <div>
          <div style={{ fontSize: '9.5px', color: '#64748B', fontWeight: 800 }}>&gt; 10 Menit</div>
          <div style={{ fontSize: '13px', fontWeight: 900, color: '#DC2626', marginTop: '2px' }}>
            {slowCount} ({slowPct}%)
          </div>
        </div>
      </div>
    </div>
  );
}
