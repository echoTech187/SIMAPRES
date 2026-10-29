'use client';

import React from 'react';
import { TrendingUp, Siren, Smartphone, PhoneCall, Users } from 'lucide-react';
import TacticalMetricTile from '@/components/ui/TacticalMetricTile';

export interface OperationalSummarySectionProps {
  isReady: boolean;
  totalLaporan: number;
  menungguCount: number;
  ditolakCount: number;
  diprosesCount: number;
  pengesahanCount: number;
  selesaiCount: number;
  sosCount: number;
  wargaCount: number;
  hotline110Count: number;
  personelCount: number;
  onFilterStatus: (status: string) => void;
  onFilterPlatform: (platform: string) => void;
}

export default function OperationalSummarySection({
  isReady,
  totalLaporan,
  menungguCount,
  ditolakCount,
  diprosesCount,
  pengesahanCount,
  selesaiCount,
  sosCount,
  wargaCount,
  hotline110Count,
  personelCount,
  onFilterStatus,
  onFilterPlatform,
}: OperationalSummarySectionProps) {
  if (!isReady) {
    return (
      <div
        className="cyber-skeleton"
        style={{
          height: '180px',
          borderRadius: '14px',
          marginBottom: '20px',
        }}
      />
    );
  }

  return (
    <div
      id="rekap-card"
      className="card-panel futuristic-card"
      style={{ padding: '20px', marginBottom: '20px', borderRadius: '16px' }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div
          className="card-title"
          style={{
            fontSize: '14.5px',
            fontWeight: 900,
            color: '#0F172A',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            letterSpacing: '-0.2px',
          }}
        >
          <TrendingUp size={18} color="#0284C7" />
          <span>REKAPITULASI LAPORAN OPERASIONAL HARI INI</span>
        </div>
        <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Klik kartu untuk audit rincian</span>
      </div>

      {/* 6 Holographic Metric KPI Tiles */}
      <div
        className="rekap-grid"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}
      >
        <TacticalMetricTile
          id="tile-total"
          label="TOTAL LAPORAN"
          value={totalLaporan}
          sublabel="Seluruh Saluran"
          accentColor="#0284C7"
          bgGradient="linear-gradient(180deg, #F0F9FF 0%, #FFFFFF 60%)"
          onClick={() => onFilterStatus('semua')}
        />

        <TacticalMetricTile
          id="tile-menunggu"
          label="MENUNGGU"
          value={menungguCount}
          sublabel="Perlu Disposisi"
          accentColor="#D97706"
          bgGradient="linear-gradient(180deg, #FFFBEB 0%, #FFFFFF 60%)"
          onClick={() => onFilterStatus('menunggu')}
        />

        <TacticalMetricTile
          id="tile-ditolak"
          label="DITOLAK"
          value={ditolakCount}
          sublabel="Tidak Sesuai SOP"
          accentColor="#DC2626"
          bgGradient="linear-gradient(180deg, #FEF2F2 0%, #FFFFFF 60%)"
          onClick={() => onFilterStatus('ditolak')}
        />

        <TacticalMetricTile
          id="tile-ditangani"
          label="DITANGANI"
          value={diprosesCount}
          sublabel="Unit Bergerak"
          accentColor="#2563EB"
          bgGradient="linear-gradient(180deg, #EFF6FF 0%, #FFFFFF 60%)"
          onClick={() => onFilterStatus('diproses')}
        />

        <TacticalMetricTile
          id="tile-pengesahan"
          label="PENGESAHAN"
          value={pengesahanCount}
          sublabel="Verifikasi BA"
          accentColor="#7C3AED"
          bgGradient="linear-gradient(180deg, #F5F3FF 0%, #FFFFFF 60%)"
          onClick={() => onFilterStatus('menunggu_pengesahan')}
        />

        <TacticalMetricTile
          id="tile-selesai"
          label="SELESAI"
          value={selesaiCount}
          sublabel="Tuntas 100%"
          accentColor="#16A34A"
          bgGradient="linear-gradient(180deg, #F0FDF4 0%, #FFFFFF 60%)"
          onClick={() => onFilterStatus('selesai')}
        />
      </div>

      {/* Breakdown 4 Saluran Platform */}
      <div
        id="rekap-platform-breakdown"
        style={{
          marginTop: '16px',
          padding: '14px',
          background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
          border: '1px solid #E2E8F0',
          borderRadius: '12px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '10px',
          fontSize: '11px',
        }}
      >
        <div
          style={{
            background: 'white',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: '10px',
            padding: '9px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(220, 38, 38, 0.05)',
            transition: 'all 0.15s ease',
          }}
          onClick={() => onFilterPlatform('sos')}
          title="Klik untuk filter aduan SOS Panic"
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 800, color: '#DC2626' }}>
            <Siren size={15} color="#DC2626" />
            <span>SOS PANIC</span>
          </span>
          <span style={{ fontWeight: 900, color: '#DC2626', fontSize: '14px' }}>{sosCount}</span>
        </div>

        <div
          style={{
            background: 'white',
            border: '1px solid rgba(2, 132, 199, 0.35)',
            borderRadius: '10px',
            padding: '9px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(2, 132, 199, 0.05)',
            transition: 'all 0.15s ease',
          }}
          onClick={() => onFilterPlatform('warga')}
          title="Klik untuk filter aduan Aplikasi Warga"
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 800, color: '#0284C7' }}>
            <Smartphone size={15} color="#0284C7" />
            <span>WARGA</span>
          </span>
          <span style={{ fontWeight: 900, color: '#0284C7', fontSize: '14px' }}>{wargaCount}</span>
        </div>

        <div
          style={{
            background: 'white',
            border: '1px solid rgba(29, 78, 216, 0.35)',
            borderRadius: '10px',
            padding: '9px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(29, 78, 216, 0.05)',
            transition: 'all 0.15s ease',
          }}
          onClick={() => onFilterPlatform('layanan110')}
          title="Klik untuk filter aduan Panggilan 110 Hotline"
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 800, color: '#1D4ED8' }}>
            <PhoneCall size={15} color="#1D4ED8" />
            <span>110 HOTLINE</span>
          </span>
          <span style={{ fontWeight: 900, color: '#1D4ED8', fontSize: '14px' }}>{hotline110Count}</span>
        </div>

        <div
          style={{
            background: 'white',
            border: '1px solid rgba(217, 119, 6, 0.35)',
            borderRadius: '10px',
            padding: '9px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(217, 119, 6, 0.05)',
            transition: 'all 0.15s ease',
          }}
          onClick={() => onFilterPlatform('personel')}
          title="Klik untuk filter aduan Temuan Personel Lapangan"
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 800, color: '#92400E' }}>
            <Users size={15} color="#92400E" />
            <span>PERSONEL</span>
          </span>
          <span style={{ fontWeight: 900, color: '#92400E', fontSize: '14px' }}>{personelCount}</span>
        </div>
      </div>
    </div>
  );
}
