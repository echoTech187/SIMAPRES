'use client';

import React from 'react';
import { Check, Copy, MapPin, Phone, CheckCircle2 } from 'lucide-react';
import { formatIncidentDateTime } from '@/lib/date-utils';

function RadarSearchingFullScreenView({
  complaint,
  nomorTiket,
  onBack,
  liveSyncTime,
  formattedScanTime,
  onCopyTicket,
  copiedTicket,
}: {
  complaint: any;
  nomorTiket: string;
  onBack?: () => void;
  liveSyncTime: string;
  formattedScanTime: string;
  onCopyTicket: () => void;
  copiedTicket: boolean;
}) {
  return (
    <div
      className="w-full min-h-[100dvh] flex flex-col bg-[#090A0F] animate-in fade-in duration-300"
      style={{
        backgroundImage:
          'radial-gradient(ellipse at 50% 10%, rgba(236,196,115,0.08) 0%, transparent 60%)',
      }}
    >
      {/* ─── 1. TOP HEADER ─── */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 30,
          background: 'rgba(10, 13, 20, 0.94)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(236,196,115,0.18)',
          padding: '12px 16px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.6)',
        }}
      >
        <div className="max-w-xl mx-auto flex items-center gap-2.5">
          {/* Brand Left */}
          <div
            style={{
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <img
              src="/logo_simopmas.png"
              alt="Logo SIMOPMAS 110"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
          <div>
            <div className="text-xs sm:text-sm font-black text-white tracking-wide">
              SIMOPMAS 110
            </div>
            <div className="text-[9.5px] sm:text-[10.5px] text-slate-400 font-medium">
              Sistem Pemantauan Taktis Kepolisian & Warga
            </div>
          </div>
        </div>
      </header>

      {/* ─── 2. CARD 1: RADAR SCANNING CARD ─── */}
      <div className="max-w-xl mx-auto w-full px-4 pt-4 pb-2">
        <div
          className="rounded-[28px] p-5 sm:p-6 text-center relative overflow-hidden backdrop-blur-xl"
          style={{
            background:
              'linear-gradient(180deg, rgba(18, 22, 32, 0.95) 0%, rgba(10, 12, 18, 0.98) 100%)',
            border: '1.5px solid rgba(236, 196, 115, 0.22)',
            boxShadow:
              '0 16px 48px rgba(0,0,0,0.8), 0 0 30px rgba(236,196,115,0.05)',
          }}
        >
          {/* Top Status Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-black uppercase tracking-wider mb-3.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_#F59E0B]" />
            <span>MENCARI PETUGAS TERDEKAT</span>
          </div>

          {/* Heading */}
          <h1 className="text-base sm:text-lg font-black text-white uppercase tracking-tight leading-snug mb-2">
            MOHON TUNGGU KAMI SEDANG MENCARI PETUGAS TERDEKAT...
          </h1>

          {/* Subtitle */}
          <p className="text-xs sm:text-[13px] text-slate-400 leading-relaxed max-w-sm mx-auto mb-4">
            Sinyal darurat disiarkan secara serentak ke seluruh armada patroli Presisi di sekitar wilayah Anda.
          </p>

          {/* Boundary / E-Routing Information Banner if detected */}
          {Boolean(
            complaint?.isOutsideJurisdiction ||
            /batang|perbatasan|warungasem/i.test(complaint?.tkpAlamatTeks || '') ||
            complaint?.crossJurisdiction?.isOutsideJurisdiction
          ) && (
            <div className="mb-5 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-left flex items-start gap-2.5 max-w-md mx-auto">
              <span className="text-base flex-shrink-0">📍</span>
              <div className="text-[11.5px] leading-relaxed text-slate-300">
                <strong className="text-amber-300 font-bold block mb-0.5">Indikasi Batas Wilayah (E-Routing Boundary):</strong>
                Titik lokasi Anda terdeteksi di sekitar perbatasan yurisdiksi. Operator Sentra 110 sedang mengoordinasikan pengalihan pos penanganan terdekat agar penanganan tiba dalam waktu sesingkat mungkin.
              </div>
            </div>
          )}

          {/* Big Radar Graphic */}
          <div
            style={{
              position: 'relative',
              width: '260px',
              height: '260px',
              margin: '0 auto',
              borderRadius: '50%',
              background: 'radial-gradient(circle, #161C2A 0%, #080A10 100%)',
              border: '1.5px solid rgba(236,196,115,0.35)',
              boxShadow:
                '0 0 35px rgba(236,196,115,0.1), inset 0 0 30px rgba(0,0,0,0.85)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Concentric Rings */}
            {[30, 56, 82].map((s, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  width: `${s}%`,
                  height: `${s}%`,
                  borderRadius: '50%',
                  border: `1px solid rgba(236,196,115,${i === 0 ? 0.2 : 0.12})`,
                  borderStyle: i === 0 ? 'dashed' : 'solid',
                }}
              />
            ))}

            {/* Crosshairs */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: '50%',
                height: '1px',
                background: 'rgba(236,196,115,0.14)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: '50%',
                width: '1px',
                background: 'rgba(236,196,115,0.14)',
              }}
            />

            {/* Sweeping Conic Beam */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                background:
                  'conic-gradient(from 0deg, rgba(236,196,115,0.45) 0deg, rgba(201,150,53,0.1) 45deg, transparent 80deg)',
                animation: 'clt-radar 3s linear infinite',
              }}
            />

            {/* Patrol Car Blips */}
            {[
              { top: '24%', left: '68%', delay: '0s', label: '🚓' },
              { top: '65%', left: '22%', delay: '1.2s', label: '🚓' },
              { top: '68%', left: '70%', delay: '0.6s', label: '🚓' },
              { top: '32%', left: '38%', delay: '1.8s', label: '🚓' },
            ].map((b, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  top: b.top,
                  left: b.left,
                  fontSize: '15px',
                  filter: 'drop-shadow(0 0 6px #ECC473)',
                  animation: `clt-blip ${3.4 + i * 0.4}s ease-in-out ${b.delay} infinite`,
                }}
              >
                {b.label}
              </div>
            ))}

            {/* Center Target Point */}
            <div
              style={{
                position: 'relative',
                zIndex: 10,
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                background: '#ECC473',
                boxShadow: '0 0 16px #ECC473',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  border: '2px solid #ECC473',
                  animation: 'clt-pulse 2s ease-out infinite',
                }}
              />
            </div>
          </div>

          {/* Stats Strip below Radar */}
          <div
            className="grid grid-cols-3 divide-x divide-white/10 rounded-2xl mt-6 py-3 px-2"
            style={{
              background: 'rgba(8, 10, 16, 0.75)',
              border: '1px solid rgba(236, 196, 115, 0.15)',
            }}
          >
            <div className="text-center px-1">
              <div className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                WAKTU PEMINDAIAN
              </div>
              <div className="text-xs sm:text-sm font-black font-mono text-[#ECC473]">
                {formattedScanTime}
              </div>
            </div>
            <div className="text-center px-1">
              <div className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                FREKUENSI CAD
              </div>
              <div className="text-xs sm:text-sm font-black font-mono text-white">
                110.85 MHz
              </div>
            </div>
            <div className="text-center px-1">
              <div className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                RADIUS SEKTOR
              </div>
              <div className="text-xs sm:text-sm font-black font-mono text-white">
                5.0 KM
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 4. CARD 2: INFORMASI TIKET LAPORAN ─── */}
      <div className="max-w-xl mx-auto w-full px-4 pt-2 pb-10">
        <div
          className="rounded-[28px] p-5 relative overflow-hidden backdrop-blur-xl"
          style={{
            background:
              'linear-gradient(180deg, rgba(18, 22, 32, 0.95) 0%, rgba(10, 12, 18, 0.98) 100%)',
            border: '1.5px solid rgba(236, 196, 115, 0.22)',
            boxShadow: '0 12px 36px rgba(0,0,0,0.7)',
          }}
        >
          {/* Card Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
            <div className="text-xs font-black tracking-wider text-amber-400 uppercase">
              INFORMASI TIKET LAPORAN
            </div>
            <span className="text-[10px] font-bold text-slate-300 bg-slate-800/90 px-2.5 py-0.5 rounded-full border border-slate-700/60">
              Baru Saja
            </span>
          </div>

          {/* Rows */}
          <div className="space-y-3.5 text-left">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                Nomor Tiket Resmi
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm sm:text-base font-black font-mono text-[#ECC473]">
                  {nomorTiket}
                </span>
                <button
                  type="button"
                  onClick={onCopyTicket}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-amber-300 bg-amber-400/10 border border-amber-400/30 hover:bg-amber-400/20 active:scale-95 transition-all cursor-pointer"
                >
                  {copiedTicket ? (
                    <Check size={12} className="text-emerald-400" />
                  ) : (
                    <Copy size={12} />
                  )}
                  <span>{copiedTicket ? 'Tersalin' : 'Salin'}</span>
                </button>
              </div>
            </div>

            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                Kategori / Jenis Kejadian
              </div>
              <div className="text-xs sm:text-sm font-extrabold text-white">
                {complaint.jenisKejadian ||
                  complaint.kategori ||
                  'Laporan Pengaduan Masyarakat'}
              </div>
            </div>

            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                <MapPin size={11} className="text-amber-400" />
                <span>Titik Lokasi (TKP)</span>
              </div>
              <div className="text-xs text-slate-300 leading-relaxed font-medium">
                {complaint.tkpAlamatTeks || complaint.lokasi || '-'}
              </div>
            </div>

            {/* Hotline Call Button */}
            <div className="pt-2 border-t border-white/10">
              <a
                href="tel:110"
                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-black hover:bg-red-500/20 active:scale-95 transition-all shadow-md"
              >
                <Phone size={14} />
                <span>Pusat Bantuan Darurat Hotline 110</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RadarSearchingCard({ complaint }: any) {
  return (
    <div className="bg-black/40 border border-amber-500/20 rounded-2xl p-4 text-center">
      {/* Radar Graphic */}
      <div
        style={{
          position: 'relative',
          width: '160px',
          height: '160px',
          margin: '0 auto 16px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, #151924 0%, #090B10 100%)',
          border: '1.5px solid rgba(236,196,115,0.35)',
          boxShadow: '0 0 30px rgba(236,196,115,0.1), inset 0 0 25px rgba(0,0,0,0.8)',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Rings */}
        {[33, 66, 92].map((s, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: `${s}%`,
              height: `${s}%`,
              borderRadius: '50%',
              border: `1px solid rgba(236,196,115,${i === 0 ? 0.15 : 0.12})`,
              borderStyle: i === 0 ? 'dashed' : 'solid',
            }}
          />
        ))}
        {/* Crosshairs */}
        <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: '1px', background: 'rgba(236,196,115,0.12)' }} />
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: '1px', background: 'rgba(236,196,115,0.12)' }} />
        {/* Beam */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: 'conic-gradient(from 0deg, rgba(236,196,115,0.45) 0deg, rgba(201,150,53,0.1) 45deg, transparent 80deg)',
            animation: 'clt-radar 3s linear infinite',
          }}
        />
        {/* Blips */}
        {[{ top: '25%', left: '68%', delay: '0s' }, { top: '65%', left: '20%', delay: '1.1s' }, { top: '70%', left: '72%', delay: '.6s' }].map((b, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: b.top,
              left: b.left,
              fontSize: '14px',
              filter: 'drop-shadow(0 0 6px #ECC473)',
              animation: `clt-blip ${3.6 + i * 0.4}s ease-in-out ${b.delay} infinite`,
            }}
          >
            🚓
          </div>
        ))}
        {/* Center */}
        <div style={{ position: 'relative', zIndex: 10, width: '14px', height: '14px', borderRadius: '50%', background: '#ECC473', boxShadow: '0 0 14px #ECC473' }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid #ECC473', animation: 'clt-pulse 2s ease-out infinite' }} />
        </div>
      </div>

      <h3 className="text-sm font-black text-white mb-1">
        Mencari Petugas Terdekat di Radius Anda
      </h3>
      <p className="text-xs text-slate-400 mb-3.5 leading-relaxed">
        Laporan disiarkan ke seluruh armada patroli 110 di sekitar TKP. Petugas pertama yang merespons akan segera meluncur.
      </p>

      {/* Steps */}
      <div className="space-y-2 text-left bg-black/30 rounded-xl p-3 text-xs">
        {[
          { icon: <CheckCircle2 size={13} className="text-emerald-400" />, text: 'Laporan diterima & terverifikasi sistem 110', active: true },
          { icon: <div className="w-3 h-3 rounded-full border-2 border-amber-400 animate-pulse" />, text: 'Mencari personil terdekat...', active: true },
          { icon: <div className="w-3 h-3 rounded-full border border-slate-600" />, text: 'Personil menerima tugas & meluncur', active: false },
          { icon: <div className="w-3 h-3 rounded-full border border-slate-600" />, text: 'Penanganan di lokasi kejadian', active: false },
        ].map((s, i) => (
          <div key={i} className={`flex items-center gap-2 ${s.active ? 'text-slate-200' : 'text-slate-500'}`}>
            {s.icon}
            <span>{s.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}


export { RadarSearchingFullScreenView, RadarSearchingCard };
