'use client';

import React from 'react';
import {
  Shield,
  AlertTriangle,
  MapPin,
  Clock,
  CheckCircle2,
  Navigation,
  MessageSquare,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { getTaskQuotaInfo } from '../types';
import type { ComplaintData, OfficerProfile, PersonilTab } from '../types';

interface TabBerandaPersonilProps {
  officer: OfficerProfile;
  complaints: ComplaintData[];
  activeComplaint: ComplaintData | null;
  pendingAcceptTask: ComplaintData | null;
  currentGps: { lat: number; lng: number };
  fleetUnits: any[];
  hotspots: any[];
  policeOffices: any[];
  logbooks: any[];
  onTabChange: (tab: PersonilTab) => void;
  onOpenAcceptModal: (task: ComplaintData) => void;
  onOpenChat: (complaint: ComplaintData) => void;
  onQuickAction: (type: 'PATROLI' | 'TPTKP' | 'SAMBANG' | 'PENGAMANAN') => void;
}

export default function TabBerandaPersonil({
  officer,
  complaints,
  activeComplaint,
  pendingAcceptTask,
  currentGps,
  fleetUnits,
  hotspots,
  policeOffices,
  logbooks,
  onTabChange,
  onOpenAcceptModal,
  onOpenChat,
  onQuickAction,
}: TabBerandaPersonilProps) {
  // Hitung rekap giat hari ini
  const patroliCount = logbooks.filter((l) => (l.jenisAksi || '').toUpperCase() === 'PATROLI').length;
  const tptkpCount = logbooks.filter((l) => (l.jenisAksi || '').toUpperCase() === 'TPTKP').length;
  const sambangCount = logbooks.filter((l) => (l.jenisAksi || '').toUpperCase() === 'SAMBANG').length;
  const pengamananCount = logbooks.filter((l) => (l.jenisAksi || '').toUpperCase() === 'PENGAMANAN').length;

  const pendingQuota = pendingAcceptTask ? getTaskQuotaInfo(pendingAcceptTask, officer.unit_id) : null;

  return (
    <div className="w-full space-y-5 pb-6">
      {/* ======================================================== */}
      {/* 1. HERO ALERT: DISPATCH INCOMING / ACTIVE MISSION / CLEAR */}
      {/* ======================================================== */}
      {pendingAcceptTask && pendingQuota ? (
        <div
          className="relative overflow-hidden rounded-3xl p-5 sm:p-6 transition-all duration-300 animate-in fade-in"
          style={{
            background: 'linear-gradient(135deg, rgba(24, 27, 36, 0.98) 0%, rgba(15, 17, 24, 0.98) 100%)',
            border: '2px solid #ECC473',
            boxShadow: '0 16px 40px -10px rgba(0, 0, 0, 0.8), 0 0 25px rgba(236, 196, 115, 0.25)',
          }}
        >
          {/* Glowing background accent */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 animate-pulse">
                  ⚡ DISPOSISI MASUK • BUTUH KONFIRMASI
                </span>
                <span className="text-xs font-mono font-bold text-amber-400">
                  #{pendingAcceptTask.nomorTiket}
                </span>
              </div>

              <h2 className="text-lg sm:text-xl font-black text-white">
                {pendingAcceptTask.jenisKejadian}
              </h2>

              <div className="text-xs text-slate-300 flex items-start gap-1.5 max-w-2xl">
                <MapPin size={15} className="text-amber-400 flex-shrink-0 mt-0.5" />
                <span>
                  {pendingAcceptTask.tkpAlamatTeks || 'Lokasi Kejadian'}
                  {pendingAcceptTask.arahanPawas && (
                    <span className="text-amber-300 font-semibold ml-1">
                      • Arahan Pawas: &ldquo;{pendingAcceptTask.arahanPawas}&rdquo;
                    </span>
                  )}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-shrink-0">
              <button
                id="btn-hero-terima-tugas"
                data-testid="btn-hero-terima-tugas"
                type="button"
                onClick={() => onOpenAcceptModal(pendingAcceptTask)}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl font-black text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #ECC473 0%, #D4A346 50%, #B8822A 100%)',
                  color: '#0B0D12',
                  boxShadow: '0 6px 20px rgba(212, 163, 70, 0.4)',
                }}
              >
                <Shield size={16} />
                <span>Terima Tugas  ➔</span>
              </button>
            </div>
          </div>
        </div>
      ) : activeComplaint ? (
        <div
          className="relative overflow-hidden rounded-3xl p-4 sm:p-6 transition-all duration-300"
          style={{
            background: 'linear-gradient(135deg, #161922 0%, #0F1117 100%)',
            border: '1.5px solid rgba(236, 196, 115, 0.4)',
            boxShadow: '0 12px 35px rgba(0, 0, 0, 0.7), 0 0 20px rgba(236, 196, 115, 0.15)',
          }}
        >
          {/* Subtle glowing amber accent behind active card */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                  <span>PENUGASAN AKTIF</span>
                </span>
                <span className="text-xs font-mono font-bold text-amber-400 bg-black/40 px-2 py-0.5 rounded-lg border border-amber-500/20">
                  {String(activeComplaint.nomorTiket).startsWith('#')
                    ? activeComplaint.nomorTiket
                    : `#${activeComplaint.nomorTiket}`}
                </span>
              </div>

              <h2 className="text-base sm:text-xl font-black text-white leading-tight">
                {activeComplaint.jenisKejadian}
              </h2>

              <div className="text-xs text-slate-300 flex items-start gap-1.5">
                <MapPin size={15} className="text-amber-400 flex-shrink-0 mt-0.5" />
                <span className="line-clamp-2 leading-relaxed">
                  {activeComplaint.tkpAlamatTeks || 'Lokasi Kejadian'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1 sm:pt-0 flex-shrink-0">
              <button
                type="button"
                onClick={() => onOpenChat(activeComplaint)}
                className="flex-1 sm:flex-initial px-3.5 sm:px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 text-amber-200 bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500/25 transition-all active:scale-95 whitespace-nowrap"
              >
                <MessageSquare size={15} className="flex-shrink-0" />
                <span>Chat Pelapor</span>
              </button>

              <button
                type="button"
                onClick={() => onTabChange('peta')}
                className="flex-1 sm:flex-initial px-4 sm:px-5 py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 text-slate-950 transition-all shadow-md active:scale-95 whitespace-nowrap"
                style={{
                  background: 'linear-gradient(135deg, #ECC473 0%, #D4A346 100%)',
                  boxShadow: '0 4px 14px rgba(212, 163, 70, 0.35)',
                }}
              >
                <Navigation size={15} className="flex-shrink-0" />
                <span>Buka Navigasi TKP ➔</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          className="rounded-3xl p-5 flex items-center justify-between gap-4"
          style={{
            background: 'linear-gradient(135deg, rgba(6, 95, 70, 0.4) 0%, rgba(4, 120, 87, 0.25) 100%)',
            border: '1px solid rgba(52, 211, 153, 0.3)',
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300">
              <Shield size={22} />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-black text-white">
                WILAYAH HUKUM KONDUSIF & TERPANTAU
              </div>
              <div className="text-[11px] text-emerald-200/80 mt-0.5">
                Tidak ada panggilan darurat aktif di beat patroli Anda. Tetap siaga dan laksanakan sambang presisi.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. MAIN 2-COLUMN LAYOUT: DESKTOP / TABLET / MOBILE FLOW */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left Column: Aksi Cepat & Saluran Radio HT */}
        <div className="space-y-4">
          {/* Quick Action Pad 2x2 */}
          <div
            className="rounded-3xl p-4 sm:p-5"
            style={{
              background: 'linear-gradient(180deg, #151821 0%, #0E1017 100%)',
              border: '1px solid rgba(236, 196, 115, 0.2)',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6)',
            }}
          >
            <div className="text-xs font-black uppercase text-amber-400 tracking-wider mb-3">
              Aksi Cepat Presisi Lapangan
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onQuickAction('PATROLI')}
                className="p-4 rounded-2xl text-center transition-all duration-200 active:scale-95 border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20"
              >
                <div className="text-2xl mb-1">🚔</div>
                <div className="text-xs font-black text-blue-300">PATROLI</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Blue Light Beat</div>
              </button>

              <button
                type="button"
                onClick={() => onQuickAction('TPTKP')}
                className="p-4 rounded-2xl text-center transition-all duration-200 active:scale-95 border border-red-500/30 bg-red-500/10 hover:bg-red-500/20"
              >
                <div className="text-2xl mb-1">🛡️</div>
                <div className="text-xs font-black text-red-300">TPTKP</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Tindakan Pertama</div>
              </button>

              <button
                type="button"
                onClick={() => onQuickAction('SAMBANG')}
                className="p-4 rounded-2xl text-center transition-all duration-200 active:scale-95 border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20"
              >
                <div className="text-2xl mb-1">🤝</div>
                <div className="text-xs font-black text-emerald-300">SAMBANG</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Warga & Tokoh</div>
              </button>

              <button
                type="button"
                onClick={() => onQuickAction('PENGAMANAN')}
                className="p-4 rounded-2xl text-center transition-all duration-200 active:scale-95 border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20"
              >
                <div className="text-2xl mb-1">⚠️</div>
                <div className="text-xs font-black text-amber-300">PENGAMANAN</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Jalur & Keramaian</div>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Rekapitulasi Giat & Capaian Respon */}
        <div className="space-y-4">
          {/* Rekapitulasi Kegiatan Tugas Hari Ini */}
          <div
            className="rounded-3xl p-4 sm:p-5"
            style={{
              background: 'linear-gradient(180deg, #151821 0%, #0E1017 100%)',
              border: '1px solid rgba(236, 196, 115, 0.15)',
            }}
          >
            <div className="text-xs font-black uppercase text-amber-400 tracking-wider mb-3">
              Rekapitulasi Kegiatan Tugas Hari Ini
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { label: 'PATROLI', count: patroliCount, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                { label: 'TPTKP', count: tptkpCount, color: 'text-red-400', bg: 'bg-red-500/10' },
                { label: 'SAMBANG', count: sambangCount, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                { label: 'PENGAMANAN', count: pengamananCount, color: 'text-amber-400', bg: 'bg-amber-500/10' },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-2xl border border-white/5 ${item.bg} text-center`}
                >
                  <div className={`text-xl font-black ${item.color}`}>
                    {item.count}
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 tracking-wide mt-0.5">
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Jadwal Piket Jaga Personil (SOP Polri) */}
          <div
            className="rounded-3xl p-4 sm:p-5"
            style={{
              background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.15) 0%, rgba(15, 23, 42, 0.9) 100%)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              boxShadow: '0 8px 25px rgba(0, 0, 0, 0.5)',
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                <Shield size={14} />
                <span>Jadwal Piket Jaga Saya (SOP Polri)</span>
              </span>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                1x24 JAM
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Regu Piket :</span>
                <span className="font-bold text-white bg-slate-800/80 px-2 py-0.5 rounded">Regu A (Satu)</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Jam Dinas :</span>
                <span className="font-bold text-white">08.00 s/d 08.00 WIB (+1)</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Peran Penugasan :</span>
                <span className="font-bold text-emerald-400">Piket Patroli Perintis Presisi</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Status Presensi :</span>
                <span className="font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  ✓ HADIR DINAS SIAGA
                </span>
              </div>
            </div>
          </div>

          {/* Shift Performance Summary Link */}
          <div
            onClick={() => onTabChange('profil')}
            className="rounded-3xl p-4 sm:p-5 cursor-pointer transition-all duration-200 hover:scale-[1.01]"
            style={{
              background: 'linear-gradient(135deg, rgba(236, 196, 115, 0.12) 0%, rgba(184, 130, 42, 0.08) 100%)',
              border: '1px solid rgba(236, 196, 115, 0.3)',
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-amber-400 uppercase tracking-wider">
                Capaian Respon & Standar SOP
              </span>
              <span className="text-xs text-amber-300 font-bold flex items-center gap-1">
                <span>Lihat di Profile</span>
                <ChevronRight size={14} />
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-black text-white">
                  {officer.kpi || 96}%
                </div>
                <div className="text-[11px] text-slate-300">
                  Target SLA respon terpenuhi &lt; 10 menit
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300">
                <TrendingUp size={24} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
