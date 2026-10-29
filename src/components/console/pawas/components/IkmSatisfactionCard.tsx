'use client';

import React from 'react';
import { Award } from 'lucide-react';

export interface IkmSatisfactionCardProps {
  isReady: boolean;
  satisfactionRating: string;
  satisfactionPercent: string;
  complaints: any[];
  onClick: () => void;
}

export default function IkmSatisfactionCard({
  isReady,
  satisfactionRating,
  satisfactionPercent,
  complaints,
  onClick,
}: IkmSatisfactionCardProps) {
  if (!isReady) {
    return (
      <div
        className="cyber-skeleton"
        style={{
          height: '180px',
          borderRadius: '16px',
        }}
      />
    );
  }

  const reviewCount = complaints.filter((c) => c.citizenRating).length;
  const topReview = complaints.find((c) => c.citizenReview);

  return (
    <div
      id="card-pimpinan-ikm"
      className="card-panel futuristic-card"
      onClick={onClick}
      style={{
        padding: '18px',
        cursor: 'pointer',
        borderRadius: '16px',
      }}
      title="Klik untuk melihat audit transparansi ulasan dan voting warga"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div className="card-title" style={{ marginBottom: 0, fontSize: '13px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '7px', color: '#0F172A' }}>
          <Award size={16} color="#F59E0B" />
          <span>INDEKS KEPUASAN (IKM)</span>
          <span style={{ fontSize: '9.5px', fontWeight: 800, color: '#D97706', background: '#FEF3C7', border: '1px solid #FDE68A', padding: '1px 6px', borderRadius: '10px' }}>
            DETAIL
          </span>
        </div>
        <span style={{ color: '#F59E0B', fontWeight: 800, fontSize: '11px', letterSpacing: '1px' }}>⭐⭐⭐⭐⭐</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div>
          <div style={{ fontSize: '26px', fontWeight: 900, color: '#1E293B', lineHeight: 1 }}>
            {satisfactionRating} <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>/ 5.0</span>
          </div>
          <div style={{ fontSize: '11px', color: '#16A34A', fontWeight: 800, marginTop: '3px' }}>
            {satisfactionPercent}% Sangat Puas
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#0284C7' }}>
            {reviewCount} Ulasan
          </div>
          <div style={{ fontSize: '10px', color: '#64748B' }}>Survei Terverifikasi</div>
        </div>
      </div>

      {topReview ? (
        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '11px', fontSize: '11.5px', color: '#475569', lineHeight: 1.4, fontStyle: 'italic' }}>
          "{topReview.citizenReview}"
          <div style={{ fontStyle: 'normal', fontWeight: 700, color: '#1E293B', marginTop: '5px', fontSize: '10.5px', textAlign: 'right' }}>
            — {topReview.pelaporNama || 'Warga'} ({topReview.nomorTiket})
          </div>
        </div>
      ) : (
        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '11px', fontSize: '11px', color: '#64748B', textAlign: 'center' }}>
          Belum ada ulasan warga di database
        </div>
      )}
    </div>
  );
}
