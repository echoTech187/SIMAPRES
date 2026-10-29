'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Clock, Headphones } from 'lucide-react';
import { PresensiStatusType } from '../types';

export interface CockpitCommandBarProps {
  userProfile?: any;
  presensiStatus: PresensiStatusType;
  onOpenCad: () => void;
}

export default function CockpitCommandBar({
  userProfile,
  presensiStatus,
  onOpenCad,
}: CockpitCommandBarProps) {
  // Live Digital Military Clock for Cockpit HUD
  const [currentTime, setCurrentTime] = useState<string>('');
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB'
      );
    };
    update();
    const clockTimer = setInterval(update, 1000);
    return () => clearInterval(clockTimer);
  }, []);

  // Greeting & Officer Identity for Compact Command Cockpit
  const greeting = useMemo(() => {
    const hours = new Date().getHours();
    if (hours >= 4 && hours < 11) return 'Selamat Pagi';
    if (hours >= 11 && hours < 15) return 'Selamat Siang';
    if (hours >= 15 && hours < 19) return 'Selamat Sore';
    return 'Selamat Malam';
  }, []);

  const officerName = userProfile?.fullName || userProfile?.nama || 'Perwira Pengawas';
  const officerMako = userProfile?.stationName || userProfile?.satuanNama || 'Mako Komando';

  return (
    <div
      id="dashboard-command-cockpit"
      className="command-center-cockpit"
      style={{
        padding: '14px 20px',
        marginBottom: '18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      {/* Row 1: Status Siaga & Live Digital Clock */}
      <div
        className="cockpit-top-row"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        {/* Duty Status Indicator with Radar Pulse */}
        <div
          style={{
            fontSize: '11px',
            fontWeight: 800,
            color: presensiStatus === 'SUDAH_MASUK' ? '#34D399' : '#FCD34D',
            background: presensiStatus === 'SUDAH_MASUK' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
            border: presensiStatus === 'SUDAH_MASUK' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(245, 158, 11, 0.4)',
            padding: '3px 10px',
            borderRadius: '20px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span
            className={presensiStatus === 'SUDAH_MASUK' ? 'pulse-live-dot' : ''}
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: presensiStatus === 'SUDAH_MASUK' ? '#10B981' : '#F59E0B',
            }}
          />
          <span>{presensiStatus === 'SUDAH_MASUK' ? 'DINAS PIKET AKTIF • REGU KOMANDO' : 'STATUS: STANDBY CADANGAN SIAGA'}</span>
        </div>

        {/* Clock & Date Badge */}
        <div
          style={{
            fontSize: '11px',
            color: '#94A3B8',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(15, 23, 42, 0.6)',
            padding: '3px 9px',
            borderRadius: '6px',
            border: '1px solid rgba(148, 163, 184, 0.2)',
          }}
        >
          <Clock size={12} color="#38BDF8" />
          <span>
            {currentTime || 'Memuat waktu...'} •{' '}
            {new Date().toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Row 2: Officer Greeting + Mako & Compact Action Button */}
      <div
        className="cockpit-main-row"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        {/* Officer Identity & Mako */}
        <div style={{ minWidth: 0, flex: '1 1 240px' }}>
          <div
            className="cockpit-title"
            style={{
              fontSize: '16.5px',
              fontWeight: 900,
              letterSpacing: '-0.3px',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              lineHeight: 1.25,
            }}
          >
            <span>{greeting}, {officerName}</span>
          </div>
          <div
            className="cockpit-subtitle"
            style={{
              fontSize: '11.5px',
              color: '#93C5FD',
              fontWeight: 600,
              marginTop: '3px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              flexWrap: 'wrap',
            }}
          >
            <span>{officerMako}</span>
            <span style={{ color: '#475569' }}>•</span>
            <span style={{ color: '#38BDF8', fontWeight: 700 }}>Pusat Komando Operasional SIMOPMAS 110</span>
          </div>
        </div>

        {/* Compact Emergency CAD Action Button */}
        <button
          id="btn-top-spkt-disposisi"
          type="button"
          onClick={onOpenCad}
          className="btn-cockpit-cad"
          style={{
            background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
            color: '#FFFFFF',
            border: '1px solid rgba(52, 211, 153, 0.5)',
            padding: '8px 16px',
            borderRadius: '10px',
            fontWeight: 800,
            fontSize: '12px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '7px',
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
            letterSpacing: '0.2px',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          title="Buka Sentra Pelayanan untuk Tambah Pengaduan Darurat & Disposisi Cepat"
        >
          <Headphones size={15} />
          <span>+ TAMBAH PENGADUAN 110</span>
        </button>
      </div>
    </div>
  );
}
