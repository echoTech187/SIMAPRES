'use client';

import React from 'react';
import {
  Navigation,
  ChevronDown,
  ChevronUp,
  Phone,
  MessageSquare,
  MapPin,
  AlertTriangle,
  Check,
  Copy,
  Radio,
} from 'lucide-react';
import NameInitialAvatar from '@/components/ui/NameInitialAvatar';
import { RadarSearchingCard } from './RadarSearchingViews';
import type { ChatMessageItem } from '@/types/chat.types';

export interface CitizenTrackerLiveDrawerProps {
  drawerRef: React.Ref<HTMLDivElement>;
  isDrawerExpanded: boolean;
  setIsDrawerExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  handleTouchStart: (e: React.TouchEvent) => void;
  handleTouchEnd: (e: React.TouchEvent) => void;
  isArrived: boolean;
  isMeluncur: boolean;
  isAccepted: boolean;
  distanceKm: number;
  distanceFormatted: string;
  etaFormatted: string;
  assignedOfficer: any;
  setIsChatOpen: React.Dispatch<React.SetStateAction<boolean>>;
  chatMessages: ChatMessageItem[];
  complaint: any;
  nomorTiket: string;
  copiedTicket: boolean;
  handleCopyTicket: () => void;
}

export default function CitizenTrackerLiveDrawer({
  drawerRef,
  isDrawerExpanded,
  setIsDrawerExpanded,
  handleTouchStart,
  handleTouchEnd,
  isArrived,
  isMeluncur,
  isAccepted,
  distanceKm,
  distanceFormatted,
  etaFormatted,
  assignedOfficer,
  setIsChatOpen,
  chatMessages,
  complaint,
  nomorTiket,
  copiedTicket,
  handleCopyTicket,
}: CitizenTrackerLiveDrawerProps) {
  return (
    <div
      ref={drawerRef}
      id="tactical-bottom-drawer"
      className="absolute bottom-3 sm:bottom-6 left-3.5 right-3.5 sm:left-6 sm:right-auto sm:w-[460px] md:w-[480px] max-w-xl mx-auto sm:mx-0 z-20 rounded-3xl backdrop-blur-2xl transition-all duration-300 ease-in-out select-none"
      style={{
        background: 'linear-gradient(135deg, rgba(20, 24, 34, 0.97) 0%, rgba(12, 14, 20, 0.98) 100%)',
        border: '1.5px solid rgba(236, 196, 115, 0.35)',
        boxShadow: '0 16px 40px rgba(0, 0, 0, 0.85), 0 0 25px rgba(236, 196, 115, 0.12)',
      }}
    >
      {/* Draggable Handle Pill */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={() => setIsDrawerExpanded((prev) => !prev)}
        className="w-full flex flex-col items-center justify-center pt-2.5 pb-1 cursor-pointer group"
        title={isDrawerExpanded ? 'Klik atau geser ke bawah untuk memperkecil' : 'Klik atau geser ke atas untuk memperbesar'}
      >
        <div className="w-12 h-1.5 rounded-full bg-white/25 group-hover:bg-amber-400/80 transition-colors" />
      </div>

      <div className="p-4 sm:p-5 pt-0.5 space-y-3">
        {/* Drawer Top Header (Always Visible) */}
        <div className="flex items-center justify-between gap-2">
          <div
            onClick={() => setIsDrawerExpanded((prev) => !prev)}
            className="flex items-center gap-2 cursor-pointer min-w-0"
          >
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{
                background: isArrived ? '#3B82F6' : isMeluncur ? '#10B981' : '#F59E0B',
                boxShadow: `0 0 6px ${isArrived ? '#3B82F6' : isMeluncur ? '#10B981' : '#F59E0B'}`,
                animation: 'clt-live 1.2s infinite',
              }}
            />
            <Navigation size={13} className="text-amber-400 stroke-[2.5] flex-shrink-0" />
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 whitespace-nowrap">
              {isArrived
                ? 'PETUGAS DI LOKASI TKP'
                : isMeluncur
                  ? 'PETUGAS MENUJU LOKASI'
                  : isAccepted
                    ? 'PETUGAS BERSIAP BERANGKAT'
                    : 'MENCARI PETUGAS TERDEKAT'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsDrawerExpanded((prev) => !prev)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
            title={isDrawerExpanded ? 'Perkecil Tampilan' : 'Perbesar Tampilan'}
          >
            {isDrawerExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </div>

        {isAccepted ? (
          /* ─── CASE B: PETUGAS DITUGASKAN (OfficerCard + Actions + Expandable Incident Details) ─── */
          <div className="space-y-3">
            {/* Ketika Minimized & Sedang Meluncur: Tampilkan metrik ringkas simetris DI TENGAH */}
            {!isDrawerExpanded && isMeluncur && !isArrived && distanceKm > 0 && (
              <div
                onClick={() => setIsDrawerExpanded(true)}
                className="w-full flex items-center justify-center pt-0.5 cursor-pointer"
              >
                <span className="text-[10px] font-mono font-bold text-amber-200 bg-amber-500/10 border border-amber-500/25 px-3 py-1 rounded-full shadow-sm flex items-center gap-1.5 hover:bg-amber-500/15 transition-all">
                  <Navigation size={10} className="text-amber-400 rotate-45" />
                  <span>{distanceFormatted} • {etaFormatted}</span>
                </span>
              </div>
            )}
            {/* Officer Row & Action Buttons */}
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <NameInitialAvatar
                name={assignedOfficer?.namaLengkap}
                avatarUrl={assignedOfficer?.avatarUrl}
                size={48}
                showOnlineDot={true}
                statusColor={isArrived ? '#3B82F6' : isMeluncur ? '#10B981' : '#F59E0B'}
                variant="gold"
              />

              {/* Officer Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="bg-amber-500/15 text-amber-300 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                    {assignedOfficer?.rankPangkat || 'POLRI'}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold">● Aktif</span>
                </div>
                <div className="text-sm font-extrabold text-white truncate">
                  {assignedOfficer?.namaLengkap || 'Petugas Lapangan'}
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  🛡️ {assignedOfficer?.unitName || '110 Patroli'}
                  {assignedOfficer?.assignedPatrolVehicle && ` · 🚘 ${assignedOfficer.assignedPatrolVehicle}`}
                </div>
              </div>
            </div>

            {/* Quick Action Buttons (Telepon & Chat) */}
            <div className="grid grid-cols-2 gap-2 pt-0.5">
              <a
                href={assignedOfficer?.phoneNumber ? `tel:${assignedOfficer.phoneNumber}` : 'tel:110'}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-black text-xs text-slate-950 transition-all active:scale-95 shadow-md"
                style={{
                  background: 'linear-gradient(135deg, #ECC473 0%, #C99635 100%)',
                }}
              >
                <Phone size={14} />
                <span>{assignedOfficer?.phoneNumber ? 'Telepon Petugas' : 'Hotline 110'}</span>
              </a>

              <button
                type="button"
                onClick={() => setIsChatOpen(true)}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-black text-xs text-amber-300 border border-amber-400/40 bg-amber-400/10 hover:bg-amber-400/20 transition-all active:scale-95 relative"
              >
                <MessageSquare size={14} />
                <span>Chat Petugas</span>
                {chatMessages.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </button>
            </div>

            {/* Expanded Incident Information */}
            {isDrawerExpanded && (
              <div
                className="space-y-3 pt-2 max-h-[38vh] sm:max-h-[42vh] overflow-y-auto pr-1 animate-in fade-in duration-200 border-t border-white/10"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgba(236, 196, 115, 0.3) transparent',
                }}
              >
                {/* 3-Column Metrics (Jarak GPS, Estimasi Waktu, Status Armada) saat Meluncur */}
                {isMeluncur && !isArrived && distanceKm > 0 && (
                  <div className="grid grid-cols-3 divide-x divide-white/10 p-2.5 rounded-2xl bg-white/5 border border-white/10 flex-shrink-0">
                    <div className="text-center px-1">
                      <div className="text-[9px] font-bold text-slate-400 tracking-wider uppercase whitespace-nowrap">Jarak ke TKP</div>
                      <div className="text-xs sm:text-sm font-black text-amber-300 whitespace-nowrap mt-0.5 font-mono">
                        {distanceFormatted}
                      </div>
                    </div>
                    <div className="text-center px-1">
                      <div className="text-[9px] font-bold text-slate-400 tracking-wider uppercase whitespace-nowrap">Estimasi Tiba</div>
                      <div className="text-xs sm:text-sm font-bold text-slate-200 whitespace-nowrap mt-0.5">
                        {etaFormatted}
                      </div>
                    </div>
                    <div className="text-center px-1">
                      <div className="text-[9px] font-bold text-slate-400 tracking-wider uppercase whitespace-nowrap">Status</div>
                      <div className="text-xs sm:text-sm font-bold text-emerald-400 whitespace-nowrap mt-0.5">
                        Meluncur
                      </div>
                    </div>
                  </div>
                )}

                {/* Incident Details Card */}
                <div className="bg-black/30 rounded-2xl p-3.5 border border-white/5 space-y-2">
                  {/* Ticket Number Row */}
                  <div className="flex items-center justify-between pb-2 border-b border-white/5">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Nomor Tiket
                      </span>
                      <span className="text-xs font-mono font-bold text-amber-300">
                        {nomorTiket.replace(/^#/, '')}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyTicket}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition-all active:scale-95"
                      title="Salin Nomor Tiket"
                    >
                      {copiedTicket ? (
                        <>
                          <Check size={11} className="text-emerald-400" />
                          <span className="text-emerald-400">Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy size={10} className="text-amber-400" />
                          <span>Salin</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Kategori Kejadian
                    </span>
                    <span className="text-xs font-black text-amber-300">
                      {complaint.jenisKejadian || 'Darurat 110'}
                    </span>
                  </div>

                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <MapPin size={11} className="text-amber-400" />
                      <span>Titik Lokasi (TKP)</span>
                    </div>
                    <div className="text-xs text-slate-200 leading-relaxed font-medium">
                      {complaint.tkpAlamatTeks || '-'}
                    </div>
                  </div>

                  {complaint.ringkasanKeterangan && (
                    <div className="pt-1 border-t border-white/5">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                        Keterangan Pelapor
                      </div>
                      <div className="text-xs text-slate-300 italic">
                        "{complaint.ringkasanKeterangan}"
                      </div>
                    </div>
                  )}
                </div>

                {/* Safety Advice Box */}
                <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-3 flex items-start gap-2.5">
                  <AlertTriangle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-200/90 leading-relaxed">
                    Tetap berada di lokasi aman. Pastikan ponsel Anda aktif agar personel dapat menghubungi jika memerlukan konfirmasi patokan lokasi.
                  </div>
                </div>

                {/* Hotline Button */}
                <a
                  href="tel:110"
                  className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-bold hover:bg-red-500/20 transition-colors"
                >
                  <Phone size={13} />
                  <span>Pusat Bantuan Darurat Hotline 110</span>
                </a>
              </div>
            )}
          </div>
        ) : (
          /* ─── CASE C: MENCARI PETUGAS (RadarSearchingCard) ─── */
          <div className="space-y-3">
            {!isDrawerExpanded ? (
              <div
                onClick={() => setIsDrawerExpanded(true)}
                className="cursor-pointer bg-amber-500/10 border border-amber-500/25 rounded-2xl p-3 flex items-center justify-between gap-3 hover:bg-amber-500/15 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-amber-400/20 flex items-center justify-center text-amber-300">
                    <Radio size={16} className="animate-pulse" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-white">Sistem Menghubungi Personil Terdekat</div>
                    <div className="text-[11px] text-slate-400">Armada patroli sedang memverifikasi penugasan</div>
                  </div>
                </div>
                <span className="text-xs font-bold text-amber-300 underline whitespace-nowrap">Detail</span>
              </div>
            ) : (
              <div
                className="space-y-3 max-h-[45vh] overflow-y-auto pr-1 animate-in fade-in duration-200"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgba(236, 196, 115, 0.3) transparent',
                }}
              >
                <RadarSearchingCard complaint={complaint} />

                <a
                  href="tel:110"
                  className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-bold hover:bg-red-500/20 transition-colors"
                >
                  <Phone size={13} />
                  <span>Hotline Darurat 110</span>
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
