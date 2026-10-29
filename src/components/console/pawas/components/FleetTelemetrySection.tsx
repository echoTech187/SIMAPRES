'use client';

import React from 'react';
import { Radio, Car, Bike, Siren, Flame, Map, ArrowRight, Settings } from 'lucide-react';
import TacticalTelemetryPod from '@/components/ui/TacticalTelemetryPod';

export interface FleetTelemetrySectionProps {
  isReady: boolean;
  fleetUnits: any[];
  hotspots: any[];
  onOpenMap: () => void;
  onOpenHotspotModal: () => void;
}

export default function FleetTelemetrySection({
  isReady,
  fleetUnits,
  hotspots,
  onOpenMap,
  onOpenHotspotModal,
}: FleetTelemetrySectionProps) {
  if (!isReady) {
    return (
      <div
        className="cyber-skeleton"
        style={{
          height: '240px',
          borderRadius: '16px',
          marginBottom: '20px',
        }}
      />
    );
  }

  const samaptaCount = fleetUnits.filter(
    (u) => u.category === 'samapta' || (u.key && u.key.toLowerCase().includes('samapta'))
  ).length;

  const perintisCount = fleetUnits.filter(
    (u) => u.category === 'perintis' || (u.key && u.key.toLowerCase().includes('perintis'))
  ).length;

  const lantasCount = fleetUnits.filter((u) => u.category === 'lantas').length;

  return (
    <div
      className="card-panel futuristic-card"
      id="card-fleet-telemetry-beranda"
      style={{ padding: '22px', marginBottom: '20px', borderRadius: '16px' }}
    >
      {/* Card Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <div>
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
            <Radio size={18} color="#0284C7" />
            <span>PUSAT TELEMETRI ARMADA &amp; KESIAPAN PATROLI</span>
          </div>
          <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '3px' }}>
            Monitoring kesiapan unit patroli tergelar, titik rawan kriminalitas, dan respon cepat presisi
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '10.5px',
              color: '#059669',
              background: '#ECFDF5',
              border: '1px solid #A7F3D0',
              padding: '3px 10px',
              borderRadius: '20px',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span className="pulse-live-dot" style={{ width: '6px', height: '6px' }} />
            TELEMETRI GPS AKTIF
          </span>
        </div>
      </div>

      {/* 4 Interactive Fleet Telemetry Pods */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
        <TacticalTelemetryPod
          id="pod-samapta"
          icon={Car}
          iconBgColor="#DBEAFE"
          iconColor="#1D4ED8"
          title="Samapta R-4"
          subtitle="Sektor Pemukiman"
          count={samaptaCount}
          badgeLabel="UNIT SIAGA"
          badgeColor="#1D4ED8"
          podBg="linear-gradient(135deg, #F0F9FF 0%, #FFFFFF 100%)"
          podBorder="#BFDBFE"
        />

        <TacticalTelemetryPod
          id="pod-perintis"
          icon={Bike}
          iconBgColor="#FEF3C7"
          iconColor="#B45309"
          title="Perintis R-2"
          subtitle="Urai Massa & 3C"
          count={perintisCount}
          badgeLabel="TIM PATROLI"
          badgeColor="#D97706"
          podBg="linear-gradient(135deg, #FFFBEB 0%, #FFFFFF 100%)"
          podBorder="#FDE68A"
        />

        <TacticalTelemetryPod
          id="pod-lantas"
          icon={Siren}
          iconBgColor="#DCFCE7"
          iconColor="#15803D"
          title="Lantas R-4"
          subtitle="Turjawali Protokol"
          count={lantasCount}
          badgeLabel="TERGELAR"
          badgeColor="#15803D"
          podBg="linear-gradient(135deg, #F0FDF4 0%, #FFFFFF 100%)"
          podBorder="#BBF7D0"
        />

        <TacticalTelemetryPod
          id="pod-hotspots"
          icon={Flame}
          iconBgColor="#FEE2E2"
          iconColor="#DC2626"
          title="Titik Rawan"
          subtitle="Zona Pantau"
          count={hotspots.length}
          badgeLabel="ZONA RAWAN"
          badgeColor="#DC2626"
          podBg="linear-gradient(135deg, #FEF2F2 0%, #FFFFFF 100%)"
          podBorder="#FECACA"
          action={
            <button
              type="button"
              onClick={onOpenHotspotModal}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                fontSize: '10.5px',
                color: '#DC2626',
                fontWeight: 700,
                textDecoration: 'underline',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
              }}
            >
              <Settings size={10} />
              <span>Kelola Titik</span>
            </button>
          }
        />
      </div>

      {/* Direct Fullscreen Tactical Map CTA Button */}
      <button
        id="btn-beranda-open-tactical-map"
        type="button"
        onClick={onOpenMap}
        style={{
          marginTop: '16px',
          width: '100%',
          background: 'linear-gradient(135deg, #0B192C 0%, #153E75 55%, #1E40AF 100%)',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          color: '#FFFFFF',
          padding: '12px 18px',
          borderRadius: '12px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 6px 20px rgba(15, 23, 42, 0.18)',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', minWidth: 0, flex: 1 }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'rgba(56, 189, 248, 0.16)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              marginTop: '2px',
            }}
          >
            <Map size={19} color="#38BDF8" />
          </div>
          <div style={{ textAlign: 'left', minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.25 }}>
              Buka Peta Taktis Layar Penuh
            </div>
            <div
              style={{
                fontSize: '11.5px',
                color: '#BAE6FD',
                fontWeight: 500,
                marginTop: '2px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              Live tracking {fleetUnits.length} unit piket &amp; kejadian 110
            </div>
          </div>
        </div>

        <div
          className="btn-map-pill btn-map-pill-desktop"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: '#FFFFFF',
            border: '1px solid rgba(255, 255, 255, 0.9)',
            padding: '8px 14px',
            borderRadius: '8px',
            color: '#0B192C',
            fontWeight: 800,
            fontSize: '11.5px',
            flexShrink: 0,
            letterSpacing: '0.4px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.22)',
          }}
        >
          <span style={{ color: '#0B192C' }}>BUKA PETA</span>
          <ArrowRight size={14} strokeWidth={2.8} color="#0284C7" />
        </div>
      </button>
    </div>
  );
}
