'use client';

import React from 'react';
import { Shield, Zap, Phone, MessageSquare, Check, Copy } from 'lucide-react';
import NameInitialAvatar from '@/components/ui/NameInitialAvatar';
import { formatIncidentDateTime } from '@/lib/date-utils';
import type { ChatMessageItem } from '@/types/chat.types';

function OfficerPreparingIndependentView({
  complaint,
  officer,
  nomorTiket,
  onBack,
  onCopyTicket,
  copiedTicket,
  chatMessages,
  onOpenChat,
}: {
  complaint: any;
  officer: any;
  nomorTiket: string;
  onBack?: () => void;
  onCopyTicket: () => void;
  copiedTicket: boolean;
  chatMessages: ChatMessageItem[];
  onOpenChat: () => void;
}) {
  const cleanTiket = (nomorTiket || complaint?.nomorTiket || '').replace(/^#/, '');

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
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, #ECC473 0%, #C99635 100%)',
                boxShadow: '0 2px 10px rgba(201,150,53,0.3)',
              }}
            >
              <Shield size={20} className="text-[#0A0D14]" />
            </div>
            <div>
              <div className="text-sm font-black text-white leading-tight">SIMOPMAS 110</div>
              <div className="text-[11px] text-slate-400 leading-tight">Pelacakan Laporan</div>
            </div>
          </div>

          {/* Right: Pill Badge */}
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
        {/* ─── BANNER: PETUGAS BERSIAP BERANGKAT ─── */}
        <div
          className="rounded-[20px] p-4 relative overflow-hidden backdrop-blur-xl"
          style={{
            background: 'linear-gradient(180deg, rgba(35, 26, 12, 0.85) 0%, rgba(20, 16, 10, 0.95) 100%)',
            border: '1.5px solid rgba(236, 196, 115, 0.38)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
          }}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <Zap size={16} className="text-amber-400 fill-amber-400 flex-shrink-0" />
            <span className="text-sm font-black text-white tracking-wide">
              Petugas Bersiap Berangkat
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-amber-200/90 leading-relaxed pl-0.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0 shadow-[0_0_6px_#ECC473]" />
            <span>Petugas telah menerima laporan dan sedang bersiap.</span>
          </div>
        </div>

        {/* ─── CARD 1: OFFICER DETAILS ─── */}
        <div
          className="rounded-[24px] p-4 sm:p-5 relative overflow-hidden backdrop-blur-xl space-y-4"
          style={{
            background: 'linear-gradient(180deg, rgba(18, 22, 32, 0.95) 0%, rgba(10, 12, 18, 0.98) 100%)',
            border: '1.5px solid rgba(236, 196, 115, 0.22)',
            boxShadow: '0 12px 36px rgba(0,0,0,0.7)',
          }}
        >
          <div className="flex items-center gap-3.5">
            {/* Avatar with gold ring and check badge */}
            <div className="relative flex-shrink-0">
              <NameInitialAvatar
                name={officer?.namaLengkap}
                avatarUrl={officer?.avatarUrl}
                size={54}
                variant="gold"
                showOnlineDot={false}
              />
              {/* Checkmark verification badge */}
              <div
                className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center text-slate-950 font-black text-[10px]"
                style={{
                  background: 'linear-gradient(135deg, #ECC473 0%, #D4A346 100%)',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
                }}
              >
                ✓
              </div>
            </div>

            {/* Officer Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-[#ECC473] text-[#0A0D14] text-[10px] font-black px-2 py-0.5 rounded tracking-wider uppercase">
                  {officer?.rankPangkat || 'BRIPKA'}
                </span>
                <span className="text-emerald-400 font-bold text-xs flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Aktif
                </span>
              </div>
              <div className="text-base sm:text-lg font-black text-white leading-snug">
                {officer?.namaLengkap || 'Petugas Lapangan'}
              </div>
              <div className="text-xs text-slate-300 flex items-center gap-1.5 truncate mt-0.5">
                <Shield size={13} className="text-sky-400 flex-shrink-0" />
                <span className="truncate">{officer?.unitName || 'Satuan Samapta Presisi'}</span>
              </div>
            </div>
          </div>

          {/* Call & Chat Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <a
              href={`tel:${officer?.callPhoneNumber || officer?.phoneNumber || '110'}`}
              className="py-2.5 px-4 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all text-[#0A0D14] cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #ECC473 0%, #D4A346 100%)',
                boxShadow: '0 4px 14px rgba(212, 163, 70, 0.35)',
              }}
            >
              <Phone size={15} />
              <span>Telepon</span>
            </a>

            <button
              type="button"
              onClick={onOpenChat}
              className="py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all text-amber-300 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 cursor-pointer"
            >
              <MessageSquare size={15} />
              <span>Chat Petugas</span>
              {chatMessages.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>
          </div>
        </div>

        {/* ─── CARD 2: PETA RUTE AKTIF OTOMATIS ─── */}
        <div
          className="rounded-[24px] p-5 relative overflow-hidden backdrop-blur-xl space-y-4"
          style={{
            background: 'linear-gradient(180deg, rgba(18, 22, 32, 0.95) 0%, rgba(10, 12, 18, 0.98) 100%)',
            border: '1.5px solid rgba(236, 196, 115, 0.22)',
            boxShadow: '0 12px 36px rgba(0,0,0,0.7)',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
              }}
            >
              <span className="text-base">📍</span>
            </div>
            <div>
              <div className="text-sm font-black text-white leading-tight">
                Peta Rute Aktif Otomatis
              </div>
              <div className="text-[11px] text-slate-400 leading-tight">
                Tampil saat petugas mulai berangkat
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed font-normal">
            Petugas telah menerima laporan Anda dan sedang mempersiapkan kendaraan. Peta navigasi dan estimasi waktu tiba akan otomatis muncul setelah petugas mulai meluncur ke lokasi Anda.
          </p>

          {/* Stepper Checklist */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center flex-shrink-0 text-emerald-400">
                <Check size={12} strokeWidth={3} />
              </div>
              <span className="text-xs font-semibold text-slate-200">
                Laporan diterima &amp; petugas dikonfirmasi
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center flex-shrink-0 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.4)]">
                <Check size={12} strokeWidth={3} />
              </div>
              <span className="text-xs font-bold text-emerald-400">
                Persiapan kendaraan (sedang berlangsung)
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full border border-slate-700 bg-transparent flex items-center justify-center flex-shrink-0" />
              <span className="text-xs text-slate-500">
                Perjalanan menuju lokasi (peta aktif)
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full border border-slate-700 bg-transparent flex items-center justify-center flex-shrink-0" />
              <span className="text-xs text-slate-500">
                Penanganan di lokasi kejadian
              </span>
            </div>
          </div>
        </div>

        {/* ─── CARD 3: INFORMASI DETAIL TIKET ─── */}
        <div
          className="rounded-[24px] p-5 relative overflow-hidden backdrop-blur-xl"
          style={{
            background: 'linear-gradient(180deg, rgba(18, 22, 32, 0.95) 0%, rgba(10, 12, 18, 0.98) 100%)',
            border: '1.5px solid rgba(236, 196, 115, 0.22)',
            boxShadow: '0 12px 36px rgba(0,0,0,0.7)',
          }}
        >
          {/* Header */}
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
                {complaint.rawPelaporNama || complaint.pelaporNama || 'Bpk. Pelapor'}
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
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                Titik Lokasi (TKP)
              </div>
              <div className="text-xs sm:text-sm font-extrabold text-white leading-relaxed">
                {complaint.tkpAlamatTeks || complaint.lokasi || '-'}
              </div>
            </div>

            {(complaint.deskripsiKejadian || complaint.ringkasanKeterangan) && (
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                  Keterangan
                </div>
                <div className="text-xs text-slate-300 italic leading-relaxed">
                  "{complaint.deskripsiKejadian || complaint.ringkasanKeterangan}"
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── 4. HOTLINE BUTTON ─── */}
        <div className="pt-1 pb-6">
          <a
            href="tel:110"
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-red-950/70 via-red-900/60 to-red-950/70 border border-red-500/40 text-red-200 text-xs sm:text-sm font-black hover:bg-red-900/70 active:scale-95 transition-all shadow-lg text-center"
          >
            <Phone size={15} />
            <span>Hubungi Hotline Darurat 110</span>
          </a>
        </div>
      </div>
    </div>
  );
}

export default OfficerPreparingIndependentView;
