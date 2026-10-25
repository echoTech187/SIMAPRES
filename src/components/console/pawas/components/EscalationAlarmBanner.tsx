'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Phone, MessageSquare, AlertTriangle, Volume2, VolumeX, ShieldAlert, ChevronRight } from 'lucide-react';

interface EscalationAlarmBannerProps {
  complaints: any[];
  onOpenDisposisi?: (complaint: any) => void;
}

// Web Audio API Synthesizer for Police Escalation Siren
function playEscalationSiren() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';

    const now = ctx.currentTime;
    // Hi-Lo Police Siren sweep: 600Hz to 950Hz
    osc.frequency.setValueAtTime(650, now);
    osc.frequency.linearRampToValueAtTime(950, now + 0.35);
    osc.frequency.linearRampToValueAtTime(650, now + 0.7);
    osc.frequency.linearRampToValueAtTime(950, now + 1.05);
    osc.frequency.linearRampToValueAtTime(650, now + 1.4);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 1.5);
  } catch (_) {}
}

export default function EscalationAlarmBanner({ complaints, onOpenDisposisi }: EscalationAlarmBannerProps) {
  const [nowTime, setNowTime] = useState(Date.now());
  const [isMuted, setIsMuted] = useState(false);
  const lastAlarmPlayedRef = useRef<number>(0);

  // Update clock every second for precision countdown
  useEffect(() => {
    const timer = setInterval(() => setNowTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter complaints that have an active escalation deadline
  const escalatedItems = useMemo(() => {
    if (!Array.isArray(complaints)) return [];

    return complaints.map((c) => {
      const dispatches = Array.isArray(c.dispatches) ? c.dispatches : [];
      // Jika sudah ada dispatch yang diterima (accepted_at), tiket tidak perlu eskalasi
      const isAccepted = dispatches.some((d: any) => d.accepted_at || d.acceptedAt);
      if (isAccepted || c.status === 'SELESAI' || c.status === 'DITOLAK' || c.tahap >= 3) {
        return null;
      }

      // Cari deadline eskalasi
      const dispatchWithDeadline = dispatches.find((d: any) => d.escalation_deadline_at || d.escalationDeadlineAt);
      const rawDeadline = dispatchWithDeadline?.escalation_deadline_at || dispatchWithDeadline?.escalationDeadlineAt;
      if (!rawDeadline) return null;

      const deadlineMs = new Date(rawDeadline).getTime();
      const diffSec = Math.floor((deadlineMs - nowTime) / 1000);

      // Ambil data stasiun Polsek
      const station = c.station || dispatchWithDeadline?.station || null;
      const phonePiket = station?.phone_piket || station?.phonePiket || null;
      const phoneKapolsek = station?.phone_kapolsek || station?.phoneKapolsek || null;

      return {
        complaint: c,
        nomorTiket: c.nomorTiket || c.nomor_tiket,
        jenisKejadian: c.jenisKejadian || c.jenis_kejadian,
        tkpAlamat: c.tkpAlamatTeks || c.tkp_alamat_teks,
        urgensi: (c.urgensi || 'SEDANG').toUpperCase(),
        stationName: station?.station_name || station?.stationName || 'Polsek Setempat',
        phonePiket,
        phoneKapolsek,
        diffSec,
        isOverdue: diffSec <= 0,
      };
    }).filter(Boolean) as any[];
  }, [complaints, nowTime]);

  const overdueItems = escalatedItems.filter((item) => item.isOverdue);
  const activeCountdownItems = escalatedItems.filter((item) => !item.isOverdue);

  // Bunyikan sirine jika ada tiket yang overdue (setiap 12 detik sekali agar tidak memekakkan)
  useEffect(() => {
    if (overdueItems.length > 0 && !isMuted) {
      const now = Date.now();
      if (now - lastAlarmPlayedRef.current > 12000) {
        lastAlarmPlayedRef.current = now;
        playEscalationSiren();
      }
    }
  }, [overdueItems, isMuted]);

  if (escalatedItems.length === 0) return null;

  return (
    <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* 1. Alarm Alert Overdue (Merah Berkedip) */}
      {overdueItems.map((item) => {
        const cleanPhone = item.phonePiket ? item.phonePiket.replace(/\D/g, '') : null;
        const waLink = cleanPhone ? `https://wa.me/${cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone}` : null;
        const telLink = cleanPhone ? `tel:${cleanPhone}` : null;

        return (
          <div
            key={item.nomorTiket}
            style={{
              backgroundColor: '#450A0A',
              border: '2px solid #EF4444',
              borderRadius: '12px',
              padding: '14px 18px',
              color: '#FFFFFF',
              boxShadow: '0 10px 15px -3px rgba(239, 68, 68, 0.3)',
              animation: 'pulse 2s infinite',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  backgroundColor: '#DC2626',
                  borderRadius: '10px',
                  width: '42px',
                  height: '42px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',
                }}>
                  🚨
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      backgroundColor: '#DC2626',
                      color: '#FFFFFF',
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      letterSpacing: '0.05em',
                    }}>
                      ESKALASI MAKO 110: WAKTU RESPON HABIS
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 800, fontFamily: 'monospace', color: '#FCA5A5' }}>
                      {item.nomorTiket}
                    </span>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700, marginTop: '3px' }}>
                    {item.jenisKejadian} • <span style={{ color: '#FCD34D' }}>Wilayah {item.stationName}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#FECACA', marginTop: '2px' }}>
                    📍 {item.tkpAlamat} • Belum ada personel atau Polsek yang menerima tugas dalam 3–5 menit!
                  </div>
                </div>
              </div>

              {/* Action Buttons: Telepon Langsung & Disposisi Manual */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  title={isMuted ? 'Bunyikan Alarm' : 'Matikan Suara Alarm'}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid #7F1D1D',
                    borderRadius: '8px',
                    color: '#FCA5A5',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px',
                  }}
                >
                  {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  <span>{isMuted ? 'Unmute' : 'Mute'}</span>
                </button>

                {telLink && (
                  <a
                    href={telLink}
                    style={{
                      backgroundColor: '#16A34A',
                      color: '#FFFFFF',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 700,
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Phone size={16} />
                    <span>Telepon Piket ({item.phonePiket})</span>
                  </a>
                )}

                {waLink && (
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      backgroundColor: '#2563EB',
                      color: '#FFFFFF',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 700,
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <MessageSquare size={16} />
                    <span>Hubungi WA</span>
                  </a>
                )}

                {onOpenDisposisi && (
                  <button
                    onClick={() => onOpenDisposisi(item.complaint)}
                    style={{
                      backgroundColor: '#EA580C',
                      color: '#FFFFFF',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <span>Alihkan Disposisi</span>
                    <ChevronRight size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* 2. Banner Hitung Mundur Respon Aktif (Kuning/Biru Halus) */}
      {activeCountdownItems.map((item) => {
        const m = Math.floor(item.diffSec / 60);
        const s = item.diffSec % 60;
        const timeFormatted = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

        return (
          <div
            key={item.nomorTiket}
            style={{
              backgroundColor: '#1E293B',
              border: '1px solid #3B82F6',
              borderRadius: '10px',
              padding: '10px 16px',
              color: '#F8FAFC',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '18px' }}>⏱️</span>
              <div>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#38BDF8' }}>
                  Menunggu Respon Lapangan: {item.nomorTiket}
                </span>
                <span style={{ fontSize: '12px', color: '#94A3B8', marginLeft: '8px' }}>
                  ({item.jenisKejadian} • Wilayah {item.stationName})
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '12px', color: '#CBD5E1' }}>Sisa Waktu Respon Target:</span>
              <span style={{
                backgroundColor: item.diffSec < 60 ? '#DC2626' : '#1E40AF',
                color: '#FFFFFF',
                padding: '4px 10px',
                borderRadius: '6px',
                fontFamily: 'monospace',
                fontWeight: 800,
                fontSize: '14px',
              }}>
                {timeFormatted}
              </span>
              {item.phonePiket && (
                <span style={{ fontSize: '11px', color: '#64748B' }}>
                  Piket: {item.phonePiket}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
