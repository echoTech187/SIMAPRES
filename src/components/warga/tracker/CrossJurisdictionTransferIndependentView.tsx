'use client';

import React, { useMemo } from 'react';
import { Navigation, MessageSquare, Radio, Check, RefreshCw, Clock, Copy, MapPin, Shield, Phone } from 'lucide-react';
import { formatIncidentDateTime } from '@/lib/date-utils';
import { haversineKm } from './tracker-helpers';
import type { ChatMessageItem } from '@/types/chat.types';

function CrossJurisdictionTransferIndependentView({
  complaint,
  nomorTiket,
  onBack,
  onCopyTicket,
  copiedTicket,
  chatMessages,
  onOpenChat,
}: {
  complaint: any;
  nomorTiket: string;
  onBack?: () => void;
  onCopyTicket: () => void;
  copiedTicket: boolean;
  chatMessages: ChatMessageItem[];
  onOpenChat: () => void;
}) {
  const cleanTiket = (nomorTiket || complaint?.nomorTiket || '').replace(/^#/, '');
  const cross = complaint?.crossJurisdiction || {};
  const targetName = cross.targetStationName || complaint?.stationName || 'Polresta Batang';
  const targetHotline = cross.targetStationHotline || '0285-391110';
  const transferNotes =
    cross.notes ||
    'Laporan telah dialihkan ke yurisdiksi kepolisian terdekat demi respons tercepat di lokasi kejadian.';

  return (
    <div
      className="min-h-full flex flex-col justify-between"
      style={{
        background: '#090A0F',
        backgroundImage:
          'radial-gradient(ellipse at 50% -5%, rgba(236,196,115,0.14) 0%, transparent 55%)',
      }}
    >
      {/* ─── 1. TOP HEADER (BRAND & TICKET BADGE) ─── */}
      <div className="max-w-xl mx-auto w-full px-4 pt-4 pb-1">
        <div className="flex items-center justify-between">
          {/* Left: Brand SIMOPMAS 110 */}
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 flex items-center justify-center flex-shrink-0"
            >
              <img
                src="/logo_simopmas.png"
                alt="Logo SIMOPMAS 110"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-white leading-tight">SIMOPMAS 110</span>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40">
                  RADAR LIVE
                </span>
              </div>
              <div className="text-[11px] text-slate-400 leading-tight">
                Sistem Pemantauan Taktis Kepolisian &amp; Warga
              </div>
            </div>
          </div>

          {/* Right: Pill Ticket Badge */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md"
            style={{
              background: 'rgba(6, 28, 18, 0.75)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
            }}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10B981]" />
            <span className="text-xs font-mono font-bold text-amber-300">
              #{cleanTiket}
            </span>
          </div>
        </div>
      </div>

      {/* ─── SCROLLABLE CARDS CONTAINER ─── */}
      <div className="max-w-xl mx-auto w-full px-4 py-3 space-y-4 flex-1">
        {/* ─── BANNER: DISPOSISI LINTAS WILAYAH ─── */}
        <div
          className="rounded-[20px] p-4 relative overflow-hidden backdrop-blur-xl"
          style={{
            background: 'linear-gradient(180deg, rgba(35, 26, 12, 0.9) 0%, rgba(20, 16, 10, 0.98) 100%)',
            border: '1.5px solid rgba(236, 196, 115, 0.45)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[11px] font-black tracking-wide mb-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>PENGALIHAN WILAYAH (INTER-POLRES)</span>
              </div>
              <p className="text-xs text-amber-100/90 leading-relaxed font-medium">
                Laporan diteruskan ke Mako tetangga demi penanganan terdekat &amp; tercepat di lokasi Anda.
              </p>
            </div>
            <div
              className="text-right flex-shrink-0 px-3 py-2 rounded-xl"
              style={{
                background: 'rgba(10, 12, 18, 0.85)',
                border: '1px solid rgba(236, 196, 115, 0.25)',
              }}
            >
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                STATUS ARMADA
              </div>
              <div className="text-xs font-black text-amber-300">TERKOORDINASI</div>
              <div className="text-[10px] text-slate-300 truncate max-w-[100px]">
                {targetName}
              </div>
            </div>
          </div>
        </div>

        {/* ─── ACTION TABS / BUTTONS ─── */}
        <div className="grid grid-cols-2 gap-3">
          <div
            className="py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-lg text-[#0A0D14]"
            style={{
              background: 'linear-gradient(135deg, #ECC473 0%, #D4A346 100%)',
              boxShadow: '0 4px 14px rgba(212, 163, 70, 0.35)',
            }}
          >
            <Navigation size={14} className="fill-[#0A0D14]" />
            <span>Kesiapan Armada</span>
          </div>

          <button
            type="button"
            onClick={onOpenChat}
            className="py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all text-amber-300 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 cursor-pointer"
          >
            <MessageSquare size={14} />
            <span>In-App Chat</span>
            {chatMessages.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>
        </div>

        {/* ─── CARD: STATUS KESIAPAN & RADAR ─── */}
        <div
          className="rounded-[24px] p-5 relative overflow-hidden backdrop-blur-xl space-y-4"
          style={{
            background: 'linear-gradient(180deg, rgba(18, 22, 32, 0.95) 0%, rgba(10, 12, 18, 0.98) 100%)',
            border: '1.5px solid rgba(236, 196, 115, 0.25)',
            boxShadow: '0 12px 36px rgba(0,0,0,0.7)',
          }}
        >
          {/* Card Title & Status Badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio size={16} className="text-amber-400" />
              <span className="text-xs sm:text-sm font-black text-white tracking-wide uppercase">
                STATUS KESIAPAN PERSONEL &amp; RANMOR DINAS
              </span>
            </div>
            <span
              className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full text-amber-300"
              style={{
                background: 'rgba(236,196,115,0.15)',
                border: '1px solid rgba(236,196,115,0.35)',
              }}
            >
              STANDBY DI POS
            </span>
          </div>

          {/* Radar Animation Container */}
          <div
            style={{
              position: 'relative',
              width: '180px',
              height: '180px',
              margin: '0 auto',
              borderRadius: '50%',
              background: 'radial-gradient(circle, #161C2A 0%, #080A10 100%)',
              border: '1.5px solid rgba(236,196,115,0.35)',
              boxShadow: '0 0 30px rgba(236,196,115,0.12), inset 0 0 25px rgba(0,0,0,0.85)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Concentric Rings */}
            {[32, 60, 85].map((s, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  width: `${s}%`,
                  height: `${s}%`,
                  borderRadius: '50%',
                  border: `1px solid rgba(236,196,115,${i === 0 ? 0.25 : 0.14})`,
                  borderStyle: i === 0 ? 'dashed' : 'solid',
                }}
              />
            ))}

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

            {/* Center Patrol Car */}
            <div
              style={{
                position: 'relative',
                zIndex: 10,
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #ECC473 0%, #C99635 100%)',
                boxShadow: '0 0 20px #ECC473',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: '-6px',
                  borderRadius: '50%',
                  border: '2px solid #ECC473',
                  animation: 'clt-pulse 2s ease-out infinite',
                }}
              />
              <span>🚓</span>
            </div>
          </div>

          {/* Dark Explanation Box */}
          <div
            className="rounded-2xl p-4 text-left space-y-2"
            style={{
              background: 'rgba(10, 13, 20, 0.85)',
              border: '1px solid rgba(236,196,115,0.2)',
            }}
          >
            <div className="flex items-center gap-2 text-white font-black text-xs sm:text-sm">
              <span className="text-base">📍</span>
              <span>Laporan Dialihkan ke Wilayah Hukum Terdekat</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-normal">
              Berdasarkan deteksi koordinat GPS, titik lokasi kejadian Anda berada di wilayah hukum kepolisian{' '}
              <strong className="text-amber-300 font-bold">{targetName}</strong>. Laporan telah dialihkan
              secara otomatis ke <strong className="text-white">Command Center {targetName}</strong> agar pos
              polisi dan armada patroli terdekat dapat langsung meluncur ke lokasi kejadian.
            </p>

            <p className="text-[11px] text-amber-200/90 leading-relaxed italic pt-0.5 border-t border-white/5">
              "{transferNotes}"
            </p>
          </div>

          {/* Stepper Checklist */}
          <div className="space-y-3 pt-1 text-left">
            {/* Step 1 */}
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center flex-shrink-0 text-emerald-400">
                <Check size={12} strokeWidth={3} />
              </div>
              <span className="text-xs font-semibold text-slate-200">
                Panggilan Darurat Diterima Operator 110 (ACCEPTED)
              </span>
            </div>

            {/* Step 2 */}
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-400 flex items-center justify-center flex-shrink-0 text-amber-300 shadow-[0_0_8px_rgba(236,196,115,0.5)]">
                <RefreshCw size={11} className="animate-spin text-amber-400" />
              </div>
              <span className="text-xs font-bold text-amber-300">
                E-Routing Batas Wilayah: Diteruskan ke {targetName}
              </span>
            </div>

            {/* Step 3 */}
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-amber-500/10 border border-amber-500/40 flex items-center justify-center flex-shrink-0 text-amber-400">
                <Clock size={11} />
              </div>
              <span className="text-xs font-medium text-slate-300">
                Persiapan Armada Siaga Terdekat ({targetName})
              </span>
            </div>

            {/* Step 4 */}
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full border border-slate-700 bg-transparent flex items-center justify-center flex-shrink-0 text-slate-500">
                <Navigation size={10} />
              </div>
              <span className="text-xs text-slate-500">
                Armada Meluncur ke TKP (Menunggu konfirmasi keberangkatan)
              </span>
            </div>
          </div>
        </div>

        {/* ─── CARD: INFORMASI DETAIL TIKET ─── */}
        <div
          className="rounded-[24px] p-5 relative overflow-hidden backdrop-blur-xl"
          style={{
            background: 'linear-gradient(180deg, rgba(18, 22, 32, 0.95) 0%, rgba(10, 12, 18, 0.98) 100%)',
            border: '1.5px solid rgba(236, 196, 115, 0.22)',
            boxShadow: '0 12px 36px rgba(0,0,0,0.7)',
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              NOMOR TIKET RESMI
            </span>
            <button
              type="button"
              onClick={onCopyTicket}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-amber-300 bg-amber-400/10 border border-amber-400/30 hover:bg-amber-400/20 active:scale-95 transition-all cursor-pointer"
            >
              {copiedTicket ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              <span>{copiedTicket ? 'Tersalin' : 'Salin'}</span>
            </button>
          </div>

          <div className="text-lg font-black font-mono text-[#ECC473] mb-4">
            #{cleanTiket}
          </div>

          <div className="space-y-3.5 text-left">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                Nama Pelapor
              </div>
              <div className="text-xs sm:text-sm font-extrabold text-white">
                {complaint.rawPelaporNama || complaint.pelaporNama || 'Bpk/Ibu Warga'}
              </div>
            </div>

            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                Kategori Insiden
              </div>
              <div className="text-xs sm:text-sm font-extrabold text-white">
                {complaint.jenisKejadian || complaint.kategori || 'Laporan Pengaduan Darurat'}
              </div>
            </div>

            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                <MapPin size={11} className="text-amber-400" />
                <span>Titik Lokasi (TKP)</span>
              </div>
              <div className="text-xs sm:text-sm font-extrabold text-white leading-relaxed">
                {complaint.tkpAlamatTeks || complaint.lokasi || '-'}
              </div>
            </div>

            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                Mako Kepolisian Penanggung Jawab
              </div>
              <div className="text-xs sm:text-sm font-extrabold text-amber-300 flex items-center gap-1.5">
                <Shield size={13} className="text-amber-400" />
                <span>{targetName}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── HOTLINE CALL BUTTON ─── */}
        <div className="pt-1 pb-6">
          <a
            href={`tel:${targetHotline || '110'}`}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-red-950/70 via-red-900/60 to-red-950/70 border border-red-500/40 text-red-200 text-xs sm:text-sm font-black hover:bg-red-900/70 active:scale-95 transition-all shadow-lg text-center"
          >
            <Phone size={15} />
            <span>Hubungi Hotline SPKT {targetName} ({targetHotline})</span>
          </a>
        </div>
      </div>
    </div>
  );
}

export default CrossJurisdictionTransferIndependentView;
