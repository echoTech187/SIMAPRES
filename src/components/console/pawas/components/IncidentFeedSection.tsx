'use client';

import React from 'react';
import { Radio, Clock } from 'lucide-react';

export interface IncidentFeedSectionProps {
  isReady: boolean;
  complaints: any[];
}

export default function IncidentFeedSection({
  isReady,
  complaints,
}: IncidentFeedSectionProps) {
  if (!isReady) {
    return (
      <div
        className="cyber-skeleton"
        style={{
          height: '240px',
          borderRadius: '14px',
          marginBottom: '20px',
        }}
      />
    );
  }

  return (
    <div
      className="card-panel futuristic-card"
      style={{ padding: '20px', marginBottom: '20px', borderRadius: '16px' }}
    >
      {/* Header Feed Komando */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
          <div
            className="card-title"
            style={{
              fontSize: '14px',
              fontWeight: 900,
              color: '#0F172A',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              letterSpacing: '-0.2px',
              marginBottom: 0,
            }}
          >
            <Radio size={16} color="#10B981" />
            <span>FEED KOMANDO (REAL-TIME)</span>
          </div>
          <span
            style={{
              fontSize: '10px',
              color: '#059669',
              fontWeight: 800,
              background: '#ECFDF5',
              border: '1px solid #A7F3D0',
              padding: '2px 8px',
              borderRadius: '20px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              flexShrink: 0,
            }}
          >
            <span className="pulse-live-dot" style={{ width: '6px', height: '6px' }} />
            LIVE TELEMETRI
          </span>
        </div>
        <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
          Pantauan eskalasi insiden darurat, panggilan 110, dan penanganan kasus
        </div>
      </div>

      <div className="timeline" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {complaints.slice(0, 3).map((inc) => {
          const timeStr = inc.createdAt
            ? new Date(inc.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'
            : 'Hari ini';
          const isSelesai = inc.status === 'SELESAI';
          const isMeluncur = inc.status === 'DIPROSES' && Number(inc.tahap) === 3;
          const isPenanganan =
            (inc.status === 'DIPROSES' && Number(inc.tahap) >= 4) || inc.status === 'MENUNGGU_PENGESAHAN';
          const isDarurat = inc.urgensi === 'DARURAT' || inc.urgensi === 'PRIORITAS_TINGGI';

          const borderColor = isSelesai ? '#10B981' : isMeluncur ? '#3B82F6' : isPenanganan ? '#8B5CF6' : isDarurat ? '#EF4444' : '#F59E0B';
          const badgeBg = isSelesai ? '#F0FDF4' : isMeluncur ? '#EFF6FF' : isPenanganan ? '#F5F3FF' : isDarurat ? '#FEF2F2' : '#FFFBEB';
          const badgeColor = isSelesai ? '#16A34A' : isMeluncur ? '#1D4ED8' : isPenanganan ? '#6D28D9' : isDarurat ? '#DC2626' : '#D97706';
          const badgeBorder = isSelesai ? '#BBF7D0' : isMeluncur ? '#BFDBFE' : isPenanganan ? '#DDD6FE' : isDarurat ? '#FECACA' : '#FDE68A';

          let badgeText = '⏳ MENUNGGU';
          if (isSelesai) badgeText = `✓ TUNTAS ${inc.citizenRating ? `(⭐ ${inc.citizenRating}.0)` : ''}`;
          else if (isMeluncur) badgeText = '⚡ MELUNCUR';
          else if (isPenanganan) badgeText = '● TINDAKAN TKP';
          else if (isDarurat) badgeText = '🚨 DARURAT';

          let descText = inc.ringkasanKeterangan;
          if (isSelesai) {
            descText =
              inc.citizenReview ||
              (inc.assignedOfficer
                ? `${inc.assignedOfficer.rankPangkat} ${inc.assignedOfficer.namaLengkap} telah menuntaskan penanganan dan menyerahkan laporan resmi.`
                : 'Kasus telah ditangani dan dinyatakan tuntas.');
          } else if (isMeluncur) {
            descText = `${inc.assignedOfficer?.assignedPatrolVehicle || 'Unit Samapta Presisi'} (${
              inc.assignedOfficer ? `${inc.assignedOfficer.rankPangkat} ${inc.assignedOfficer.namaLengkap}` : 'Personel'
            }) meluncur ke TKP. Estimasi tiba 3-5 menit.`;
          } else if (isPenanganan) {
            descText = `Personel berada di TKP melaksanakan tindakan kepolisian dan pengamanan perimeter.`;
          }

          return (
            <div
              key={inc.id}
              className="tl-item"
              style={{
                borderLeft: `4px solid ${borderColor}`,
                padding: '12px 14px',
                background: '#F8FAFC',
                borderRadius: '0 10px 10px 0',
                border: '1px solid #E2E8F0',
                borderLeftColor: borderColor,
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              {/* Tier 1: Timestamp + Status Badge */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 800, color: '#0284C7' }}>
                  <Clock size={12} color="#0284C7" />
                  <span>{timeStr}</span>
                </div>
                <span
                  style={{
                    fontSize: '9.5px',
                    fontWeight: 800,
                    background: badgeBg,
                    color: badgeColor,
                    padding: '2.5px 8px',
                    borderRadius: '6px',
                    border: `1px solid ${badgeBorder}`,
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  {badgeText}
                </span>
              </div>

              {/* Tier 2: Incident Title & TKP */}
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A', lineHeight: 1.35 }}>
                <span>{inc.jenisKejadian}</span>
                {inc.tkpAlamatTeks && (
                  <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#64748B', marginLeft: '6px' }}>
                    • {inc.tkpAlamatTeks.split(',')[0]}
                  </span>
                )}
              </div>

              {/* Tier 3: Officer/Action Note */}
              <div style={{ fontSize: '11.5px', color: '#475569', lineHeight: 1.45 }}>
                {descText}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
