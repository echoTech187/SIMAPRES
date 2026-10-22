'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  FileText,
  Shield,
  X,
  Send,
  AlertCircle,
  MapPin,
  User,
} from 'lucide-react';
import { fieldStepAction } from '@/app/actions/complaint.actions';
import type { ComplaintData, OfficerProfile } from '../types';

interface ModalPenyelesaianTugasProps {
  isOpen: boolean;
  complaint: ComplaintData;
  officer: OfficerProfile;
  currentGps: { lat: number; lng: number };
  onClose: () => void;
  onSuccess: () => void;
}

export default function ModalPenyelesaianTugas({
  isOpen,
  complaint,
  officer,
  currentGps,
  onClose,
  onSuccess,
}: ModalPenyelesaianTugasProps) {
  const [keterangan, setKeterangan] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const quickPresets = [
    'Situasi TKP telah aman dan kondusif.',
    'Mediasi damai kedua belah pihak telah tercapai.',
    'Korban dan barang bukti telah diamankan ke komando.',
    'Evakuasi darurat tuntas, situasi lingkungan terkendali.',
  ];

  const handleApplyPreset = (presetText: string) => {
    setKeterangan((prev) => {
      const clean = prev.trim();
      if (!clean) return presetText;
      if (clean.includes(presetText)) return prev;
      return `${clean} ${presetText}`;
    });
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanText = keterangan.trim();
    if (!cleanText || cleanText.length < 5) {
      setErrorMsg('Harap ketik keterangan penyelesaian minimal 5 karakter.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fieldStepAction({
        complaintId: String(complaint.id),
        step: 'selesai',
        officerId: officer.id || '3',
        catatan: cleanText,
        lat: currentGps?.lat,
        lng: currentGps?.lng,
      });

      if (res?.success) {
        alert(`✓ Tugas #${complaint.nomorTiket?.replace(/^#+/, '')} berhasil diselesaikan!\nLaporan catatan penanganan telah tersimpan.`);
        onSuccess();
      } else {
        setErrorMsg(res?.error || 'Gagal menyimpan penyelesaian tugas.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem saat menghubungi server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl mx-auto rounded-3xl overflow-hidden p-5 sm:p-6 text-slate-100 shadow-2xl border"
        style={{
          background: 'linear-gradient(180deg, #151922 0%, #0C0E14 100%)',
          borderColor: 'rgba(236, 196, 115, 0.35)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85), 0 0 35px rgba(236, 196, 115, 0.15)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-amber-500/20 mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-slate-900 shadow-md flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, #ECC473 0%, #D4A346 100%)',
              }}
            >
              <CheckCircle2 size={22} className="stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white leading-tight">
                Keterangan Penyelesaian Tugas
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-mono font-bold text-amber-300">
                  #{complaint.nomorTiket?.replace(/^#+/, '')}
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-xs text-slate-300 font-semibold truncate max-w-[200px]">
                  {complaint.jenisKejadian}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Ringkasan Singkat Lokasi & Pelapor */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 rounded-2xl bg-white/[0.03] border border-white/5 mb-4 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <User size={14} className="text-amber-400 flex-shrink-0" />
            <span className="truncate">
              Pelapor: <strong className="text-slate-100">{complaint.pelaporNama || 'Warga'}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <MapPin size={14} className="text-amber-400 flex-shrink-0" />
            <span className="truncate" title={complaint.tkpAlamatTeks}>
              TKP: <strong className="text-slate-100">{complaint.tkpAlamatTeks || '-'}</strong>
            </span>
          </div>
        </div>

        {/* Form Input Keterangan Manual */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-amber-300 uppercase tracking-wide flex items-center gap-1.5">
                <FileText size={14} />
                <span>Uraian / Catatan Hasil Penanganan di TKP *</span>
              </label>
              <span className="text-[11px] font-mono text-slate-400">
                {keterangan.trim().length} karakter
              </span>
            </div>
            <p className="text-[11.5px] text-slate-400 mb-2 leading-relaxed">
              Ketikkan ringkasan penyelesaian kasus di lapangan oleh anggota regu patroli. Keterangan ini akan langsung tampil di halaman tracking tiket pelapor.
            </p>

            <textarea
              rows={4}
              value={keterangan}
              onChange={(e) => {
                setKeterangan(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              placeholder="Contoh: Situasi TKP telah terkendali dan kondusif. Mediasi damai antar kedua pihak warga telah dicapai dengan disaksikan ketua RT setempat. Tidak ada korban jiwa..."
              className="w-full px-3.5 py-3 rounded-2xl text-xs sm:text-sm text-slate-100 bg-[#0B0D13]/90 border border-amber-500/30 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 outline-none transition-all resize-none shadow-inner"
              style={{
                lineHeight: 1.6,
              }}
              autoFocus
            />
          </div>

          {/* Quick Preset Buttons (Opsi Cepat Membantu Petugas di Lapangan) */}
          <div>
            <div className="text-[11px] font-bold text-slate-400 mb-1.5">
              Template Cepat Lapangan:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {quickPresets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className="px-2.5 py-1 rounded-xl text-[11px] font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/25 hover:bg-amber-500/20 active:scale-95 transition-all text-left"
                >
                  + {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="text-rose-400 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl font-bold text-xs text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors disabled:opacity-50"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={isSubmitting || keterangan.trim().length < 5}
              className="px-5 py-2.5 rounded-xl font-black text-xs text-slate-900 transition-all shadow-md active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #ECC473 0%, #D4A346 100%)',
                boxShadow: '0 4px 14px rgba(212, 163, 70, 0.4)',
              }}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                  <span>Menyimpan & Menyelesaikan...</span>
                </>
              ) : (
                <>
                  <Send size={14} />
                  <span>Kirim & Selesaikan Tugas ➔</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
