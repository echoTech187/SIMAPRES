'use client';

import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  Shield,
  CheckCircle2,
  FileText,
  ThumbsUp,
  Check,
  Copy,
  MapPin,
  MessageSquare,
  Search,
  Phone,
} from 'lucide-react';
import NameInitialAvatar from '@/components/ui/NameInitialAvatar';
import { formatIncidentDateTime } from '@/lib/date-utils';
import { isDeskResolvedComplaint } from '@/domain/rules/resolution.rules';
import { RATING_CRITERIA, RATING_LABELS } from './tracker-helpers';
import type { ChatMessageItem } from '@/types/chat.types';

const SimapresGoogleMap = dynamic(() => import('@/components/maps/SimapresGoogleMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#121621] flex items-center justify-center text-slate-500 text-xs">
      Memuat Peta SIMOPMAS...
    </div>
  ),
});

function CompletedIndependentView({
  complaint,
  officer,
  nomorTiket,
  fiveRatings,
  reviewText,
  submitting,
  done,
  onRatingChange,
  onReviewChange,
  onSubmit,
  onBack,
  onCopyTicket,
  copiedTicket,
  chatMessages,
  onOpenChat,
  mapComplaint,
  onSwitchToOperatorReview,
}: any) {
  const [hoverRatings, setHoverRatings] = useState<Record<string, number>>({});
  const [showMapPreview, setShowMapPreview] = useState(false);

  const cleanTiket = (nomorTiket || complaint?.nomorTiket || '').replace(/^#/, '');
  const catatanFinal =
    complaint?.catatanSelesai ||
    complaint?.catatan_selesai ||
    complaint?.catatanTindakan ||
    'Situasi TKP telah aman dan kondusif.';

  const formattedWaktuLaporan = useMemo(() => {
    return formatIncidentDateTime(complaint?.waktuLaporan || complaint?.createdAt).full;
  }, [complaint]);

  const hasValidTkp = Boolean(complaint?.tkpLat && complaint?.tkpLng);

  return (
    <div
      className="w-full min-h-[100dvh] bg-[#090A0F] text-[#F1F5F9] flex flex-col relative"
      style={{
        backgroundImage:
          'radial-gradient(ellipse at 50% -5%, rgba(236,196,115,0.14) 0%, transparent 60%), radial-gradient(ellipse at 50% 100%, rgba(59,130,246,0.06) 0%, transparent 60%)',
      }}
    >
      {/* 1. TOP STICKY HEADER */}
      <header className="sticky top-0 z-30 w-full border-b border-amber-500/20 bg-[#0F1118]/92 backdrop-blur-xl px-4 py-3 sm:px-6 shadow-xl">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
          {/* Brand SIMOPMAS 110 */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md"
              style={{
                background: 'linear-gradient(135deg, #ECC473 0%, #C99635 100%)',
              }}
            >
              <Shield size={16} className="text-[#0A0D14]" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-black text-white tracking-wide whitespace-nowrap">
                SIMOPMAS 110
              </div>
              <div className="text-[10px] text-slate-400 font-medium hidden sm:block whitespace-nowrap">
                Sistem Monitoring Polisi Bersama Masyarakat
              </div>
            </div>
          </div>

          {/* Independent Step Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-blue-500/15 border border-blue-500/40 text-blue-400 shadow-sm flex-shrink-0">
            <CheckCircle2 size={13} className="text-blue-400 stroke-[2.5]" />
            <span>SELESAI</span>
          </div>
        </div>
      </header>

      {/* 2. MAIN SCROLLABLE RESOLUTION CONTENT */}
      <main className="flex-1 w-full max-w-xl mx-auto px-4 py-5 sm:py-7 space-y-4 sm:space-y-5 pb-16">
        {/* BANNER LAYANAN KONSULTASI SELESAI*/}
        {isDeskResolvedComplaint(complaint) && (
          <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-950 border border-emerald-500/40 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/35 flex items-center justify-center text-xl flex-shrink-0">
                🎧
              </div>
              <div>
                <div className="text-xs sm:text-sm font-extrabold text-white flex items-center gap-2">
                  <span>Layanan Konsultasi Selesai</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                    TUNTAS
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Pengaduan ini telah selesai dilayani langsung oleh operator tanpa membutuhkan pergerakan patroli lapangan.
                </p>
              </div>
            </div>
            {onSwitchToOperatorReview && (
              <button
                type="button"
                onClick={onSwitchToOperatorReview}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-xs shadow-md transition-all whitespace-nowrap flex items-center justify-center gap-2 flex-shrink-0 cursor-pointer"
              >
                <span>⭐</span> Beri Ulasan Pelayanan Operator
              </button>
            )}
          </div>
        )}

        {/* Step Indicator Progress (Visualizing Independent Completion Step) */}
        <div className="bg-[#121621] border border-white/10 rounded-2xl p-3 shadow-md">
          <div className="flex items-center justify-between text-[11px] font-black text-slate-400 px-1 mb-2">
            <span className="text-emerald-400">✓ 1. Laporan</span>
            <span className="text-emerald-400">✓ 2. Meluncur</span>
            <span className="text-emerald-400">✓ 3. Tiba di TKP</span>
            <span className="text-amber-400 font-black">● 4. Selesai</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden flex">
            <div className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-amber-500 w-full" />
          </div>
        </div>

        {/* Hero Card: Penanganan Selesai */}
        <div className="text-center space-y-2 pt-1 pb-1">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-br from-emerald-500/20 via-blue-500/10 to-amber-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-[0_0_35px_rgba(16,185,129,0.25)]">
            <CheckCircle2 size={36} className="text-emerald-400 sm:w-10 sm:h-10" />
          </div>
          <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
            Penanganan Kasus Selesai
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
            Petugas telah menyelesaikan tindakan di lokasi TKP. Situasi dilaporkan telah aman dan kondusif.
          </p>
        </div>

        {/* Official Officer Resolution Note */}
        <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-amber-500/12 via-[#151924] to-[#0D1017] border border-amber-500/35 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between gap-2 mb-2.5 pb-2 border-b border-amber-500/20">
            <div className="flex items-center gap-2">
              <FileText size={15} className="text-amber-400" />
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-300">
                Keterangan Penanganan oleh Petugas:
              </span>
            </div>
          </div>
          <div className="text-xs sm:text-sm text-slate-100 leading-relaxed font-medium bg-black/45 rounded-xl p-3 sm:p-3.5 border-l-4 border-amber-400 whitespace-pre-wrap break-words shadow-inner">
            "{catatanFinal}"
          </div>
        </div>

        {/* Officer in Charge Card */}
        {officer && (
          <div className="rounded-2xl p-4 bg-[#121621] border border-white/10 shadow-lg space-y-3">
            <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Personil Penanganan Lapangan</span>
            </div>
            <div className="flex items-center gap-3.5">
              <NameInitialAvatar
                name={officer.namaLengkap}
                avatarUrl={officer.avatarUrl}
                size={50}
                variant="gold"
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm sm:text-base font-extrabold text-white truncate">
                  {officer.nrp && (
                    <span className="text-xs font-extrabold text-amber-300">{officer.nrp} ● </span>
                  )}
                  <span className="text-xs text-slate-400 truncate mt-0.5">
                    {officer.namaLengkap}
                  </span>
                </div>
                <div className="text-xs text-slate-400 truncate mt-0.5">
                  {officer.unitName}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Citizen Rating & Review Form Card */}
        <div className="rounded-2xl p-4 sm:p-6 bg-gradient-to-br from-[#121621] to-[#0A0D14] border border-amber-500/35 shadow-xl space-y-4">
          {done || complaint?.citizenRating || complaint?.citizenReview || (typeof window !== 'undefined' && cleanTiket && localStorage.getItem(`simopmas_rating_${cleanTiket}`) === 'true') ? (
            <div className="text-center py-4 space-y-2">
              <div className="w-12 h-12 mx-auto rounded-full bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-2xl shadow-inner mb-2">
                ⭐
              </div>
              <h3 className="text-base font-black text-amber-300">Terima Kasih Atas Penilaian Anda!</h3>
              <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                Ulasan dan penilaian Anda telah berhasil dicatat. Evaluasi masyarakat sangat berarti untuk menjaga mutu pelayanan Presisi SIMOPMAS 110.
              </p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="text-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[11px] font-bold text-amber-300 uppercase tracking-wider mb-2">
                  <Shield size={12} className="text-amber-400" />
                  <span>Survei Kepuasan Masyarakat (IKM 110)</span>
                </div>
                <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wide">
                  Penilaian Kinerja Pelayanan Petugas
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
                  Bantu kami menjaga mutu pelayanan Presisi Polri dengan memberikan rating bintang pada 5 indikator pelayanan di bawah ini:
                </p>
              </div>

              {/* 5 Rating Criteria Cards */}
              <div className="space-y-3 pt-1">
                {RATING_CRITERIA.map((crit) => {
                  const currentScore = hoverRatings[crit.id] ?? fiveRatings[crit.id] ?? 5;
                  return (
                    <div
                      key={crit.id}
                      className="rounded-xl p-3.5 sm:p-4 bg-gradient-to-r from-[#0C101A] to-[#121624] border border-amber-500/20 hover:border-amber-500/35 transition-all text-left shadow-sm"
                    >
                      {/* Top: Indicator Number + Title */}
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                          {crit.number}
                        </span>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs sm:text-sm font-bold text-white leading-tight">
                            {crit.title}
                          </h4>
                          <p className="text-[11px] sm:text-xs text-slate-300/85 mt-1 leading-relaxed">
                            {crit.question}
                          </p>
                        </div>
                      </div>

                      {/* Interactive 5 Stars Row */}
                      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-white/5">
                        <div className="flex items-center gap-1 sm:gap-2">
                          {[1, 2, 3, 4, 5].map((star) => {
                            const isFilled = currentScore >= star;
                            return (
                              <button
                                key={star}
                                type="button"
                                onClick={() => onRatingChange(crit.id, star)}
                                onMouseEnter={() => setHoverRatings((prev: any) => ({ ...prev, [crit.id]: star }))}
                                onMouseLeave={() => setHoverRatings((prev: any) => ({ ...prev, [crit.id]: undefined }))}
                                className="bg-transparent border-none cursor-pointer text-2xl sm:text-3xl transition-transform hover:scale-125 active:scale-95 focus:outline-none p-0.5 select-none"
                                style={{
                                  filter: isFilled ? 'drop-shadow(0 0 8px rgba(245,158,11,0.65))' : 'none',
                                }}
                                aria-label={`${star} Bintang untuk ${crit.title}`}
                              >
                                {isFilled ? '⭐' : '☆'}
                              </button>
                            );
                          })}
                        </div>
                        <div className="text-[11px] sm:text-xs font-bold text-amber-300">
                          {RATING_LABELS[currentScore] || 'Sangat Puas'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Textarea Catatan / Apresiasi */}
              <div className="text-left pt-1">
                <label className="text-[10px] text-slate-400 font-bold mb-1.5 block uppercase tracking-wider">
                  Catatan atau Apresiasi (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={reviewText}
                  onChange={(e) => onReviewChange(e.target.value)}
                  placeholder="Tuliskan catatan, saran, atau apresiasi untuk personel (opsional)..."
                  className="w-full bg-black/40 border border-amber-500/25 rounded-xl p-3 text-xs text-white placeholder-slate-500 outline-none resize-none focus:border-amber-400 transition-colors"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 px-4 rounded-xl font-black text-xs sm:text-sm text-slate-950 flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, #ECC473 0%, #C99635 100%)',
                  opacity: submitting ? 0.7 : 1,
                }}
              >
                <ThumbsUp size={16} />
                <span>{submitting ? 'Mengirim Penilaian...' : 'Kirim Penilaian Saya'}</span>
              </button>
            </form>
          )}
        </div>

        {/* Incident Summary Card */}
        <div className="rounded-2xl p-4 sm:p-5 bg-black/40 border border-white/10 space-y-3">
          <div className="flex items-center justify-between pb-2.5 border-b border-white/5">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Nomor Tiket
              </span>
              <span className="text-xs sm:text-sm font-mono font-bold text-amber-300">
                {cleanTiket}
              </span>
            </div>
            <button
              type="button"
              onClick={onCopyTicket}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition-all active:scale-95 cursor-pointer"
            >
              {copiedTicket ? (
                <>
                  <Check size={13} className="text-emerald-400" />
                  <span className="text-emerald-400">Tersalin</span>
                </>
              ) : (
                <>
                  <Copy size={12} className="text-amber-400" />
                  <span>Salin</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">
                Kategori Kejadian
              </span>
              <span className="font-extrabold text-amber-300">
                {complaint.jenisKejadian || 'Darurat 110'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">
                Waktu Pelaporan
              </span>
              <span className="text-slate-300">{formattedWaktuLaporan}</span>
            </div>
          </div>

          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <MapPin size={12} className="text-amber-400" />
              <span>Titik Lokasi (TKP)</span>
            </div>
            <div className="text-xs text-slate-200 leading-relaxed font-medium bg-black/25 p-2.5 rounded-xl border border-white/5">
              {complaint.tkpAlamatTeks || '-'}
            </div>
          </div>

          {/* Toggle Map Preview */}
          {hasValidTkp && (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowMapPreview((prev) => !prev)}
                className="w-full py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-300 flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <MapPin size={13} className="text-amber-400" />
                <span>{showMapPreview ? 'Sembunyikan Peta TKP' : 'Lihat Lokasi TKP di Peta'}</span>
              </button>

              {showMapPreview && (
                <div className="mt-3 h-52 sm:h-64 rounded-xl overflow-hidden border border-amber-500/30">
                  <SimapresGoogleMap
                    mode="fullscreen"
                    height="100%"
                    targetComplaint={mapComplaint}
                    showTraffic={false}
                    showOtherOfficers={false}
                    controlsPosition="bottom-right"
                    controlsRightOffset="8px"
                    controlsBottomOffset="8px"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Chat History Button (if messages exist) */}
        {chatMessages && chatMessages.length > 0 && (
          <button
            type="button"
            onClick={onOpenChat}
            className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-300 flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <MessageSquare size={14} className="text-amber-400" />
            <span>Lihat Riwayat Chat Lapangan ({chatMessages.length} Pesan)</span>
          </button>
        )}

        {/* Navigation Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <button
            type="button"
            onClick={onBack || (() => (window.location.href = '/tracking'))}
            className="flex-1 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            <Search size={14} />
            <span>Cari Nomor Tiket Lain</span>
          </button>
          <a
            href="tel:110"
            className="flex-1 py-3 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-xs font-bold text-red-300 flex items-center justify-center gap-2 transition-all active:scale-95 text-center"
          >
            <Phone size={14} />
            <span>Hotline Darurat 110</span>
          </a>
        </div>
      </main>
    </div>
  );
}

export default CompletedIndependentView;
