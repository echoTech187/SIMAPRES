'use client';

import React from 'react';
import { Shield, AlertTriangle, MapPin, X, Phone } from 'lucide-react';
import { getTaskQuotaInfo, formatPhoneNumber, getCleanCallNumber } from '../types';
import type { ComplaintData, OfficerProfile } from '../types';

interface TaskAcceptModalProps {
  isOpen: boolean;
  task: ComplaintData | null;
  officer: OfficerProfile;
  isAccepting: boolean;
  onAccept: (task: ComplaintData) => void;
  onClose: () => void;
}

export default function TaskAcceptModal({
  isOpen,
  task,
  officer,
  isAccepting,
  onAccept,
  onClose,
}: TaskAcceptModalProps) {
  if (!isOpen || !task) return null;

  const quota = getTaskQuotaInfo(task, officer.unit_id);
  const rawPhone =
    task.pelaporHp ||
    task.pelapor_hp ||
    task.pelaporTelepon ||
    task.noHpPelapor ||
    '';
  const formattedPhone = formatPhoneNumber(rawPhone);
  const callPhone = getCleanCallNumber(rawPhone);

  // Deteksi tingkat urgensi: DARURAT (Merah), SEDANG (Kuning/Emas), NORMAL (Biru)
  const urgensiKey = (task.urgensi || '').toUpperCase();
  const isDarurat = urgensiKey === 'DARURAT';
  const isNormal = urgensiKey === 'NORMAL';

  const theme = isDarurat
    ? {
      name: 'DARURAT',
      label: 'DARURAT',
      modalBorder: '2px solid #EF4444',
      modalGlow: '0 25px 60px -10px rgba(0, 0, 0, 0.9), 0 0 35px rgba(239, 68, 68, 0.35)',
      headerBg: 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(185, 28, 28, 0.12) 100%)',
      headerBorder: 'rgba(239, 68, 68, 0.35)',
      iconBg: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
      iconGlow: '0 0 18px rgba(239, 68, 68, 0.5)',
      iconColor: '#FFFFFF',
      tagColor: 'text-red-400',
      badgeBg: 'bg-red-500/15 border-red-500/35 text-red-300',
      accentText: 'text-red-400',
      arahanBg: 'rgba(239, 68, 68, 0.08)',
      arahanBorder: 'rgba(239, 68, 68, 0.25)',
      footerBorder: 'rgba(239, 68, 68, 0.2)',
      btnBg: 'linear-gradient(135deg, #EF4444 0%, #DC2626 50%, #B91C1C 100%)',
      btnText: '#FFFFFF',
      btnGlow: '0 4px 20px rgba(239, 68, 68, 0.45)',
    }
    : isNormal
      ? {
        name: 'NORMAL',
        label: 'NORMAL',
        modalBorder: '2px solid #3B82F6',
        modalGlow: '0 25px 60px -10px rgba(0, 0, 0, 0.9), 0 0 30px rgba(59, 130, 246, 0.3)',
        headerBg: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(29, 78, 216, 0.1) 100%)',
        headerBorder: 'rgba(59, 130, 246, 0.25)',
        iconBg: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
        iconGlow: '0 0 16px rgba(59, 130, 246, 0.4)',
        iconColor: '#FFFFFF',
        tagColor: 'text-blue-400',
        badgeBg: 'bg-blue-500/15 border-blue-500/30 text-blue-300',
        accentText: 'text-blue-400',
        arahanBg: 'rgba(59, 130, 246, 0.06)',
        arahanBorder: 'rgba(59, 130, 246, 0.25)',
        footerBorder: 'rgba(59, 130, 246, 0.15)',
        btnBg: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 50%, #1D4ED8 100%)',
        btnText: '#FFFFFF',
        btnGlow: '0 4px 18px rgba(37, 99, 235, 0.4)',
      }
      : {
        name: 'SEDANG',
        label: 'SEDANG',
        modalBorder: '2px solid #ECC473',
        modalGlow: '0 25px 60px -10px rgba(0, 0, 0, 0.9), 0 0 30px rgba(236, 196, 115, 0.25)',
        headerBg: 'linear-gradient(135deg, rgba(236, 196, 115, 0.2) 0%, rgba(184, 130, 42, 0.1) 100%)',
        headerBorder: 'rgba(236, 196, 115, 0.25)',
        iconBg: 'linear-gradient(135deg, #ECC473 0%, #D4A346 100%)',
        iconGlow: '0 0 16px rgba(236, 196, 115, 0.4)',
        iconColor: '#0B0C10',
        tagColor: 'text-amber-400',
        badgeBg: 'bg-amber-400/10 border-amber-400/25 text-amber-300',
        accentText: 'text-amber-400',
        arahanBg: 'rgba(236, 196, 115, 0.06)',
        arahanBorder: 'rgba(236, 196, 115, 0.25)',
        footerBorder: 'rgba(236, 196, 115, 0.15)',
        btnBg: 'linear-gradient(135deg, #ECC473 0%, #D4A346 50%, #B8822A 100%)',
        btnText: '#0B0D12',
        btnGlow: '0 4px 18px rgba(212, 163, 70, 0.4)',
      };

  return (
    <div
      id="task-accept-emergency-dialog"
      data-testid="modal-konfirmasi-terima-tugas"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      style={{
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Dark backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        className="relative w-full max-w-lg rounded-3xl overflow-hidden z-10 transition-all duration-300 animate-in fade-in zoom-in-95 my-auto"
        style={{
          background: 'linear-gradient(180deg, #181C26 0%, #0E1118 100%)',
          border: theme.modalBorder,
          boxShadow: theme.modalGlow,
          borderRadius: '24px',
          maxHeight: 'calc(100dvh - 32px)',
          overflowY: 'auto',
        }}
      >
        {/* Dynamic Header Banner */}
        <div
          className="px-6 py-4 flex items-center justify-between border-b"
          style={{
            background: theme.headerBg,
            borderColor: theme.headerBorder,
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: theme.iconBg,
                boxShadow: theme.iconGlow,
              }}
            >
              <AlertTriangle size={20} style={{ color: theme.iconColor }} />
            </div>
            <div>
              <span className={`text-[10px] font-black tracking-widest uppercase block ${theme.tagColor}`}>
                PANGGILAN TUGAS LAPANGAN
              </span>
              <h3 className="text-base font-black text-slate-100 leading-tight">
                Konfirmasi Penugasan
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {/* Ticket Number, Urgensi & Quota Pill */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-mono font-bold border px-2.5 py-1 rounded-lg ${theme.badgeBg}`}>
                #{task.nomorTiket || task.id}
              </span>
              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg border ${theme.badgeBg}`}>
                {theme.label}
              </span>
            </div>
          </div>

          {/* Incident Title */}
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Jenis Kejadian
            </div>
            <div className="text-lg font-black text-white">
              {task.jenisKejadian}
            </div>
          </div>

          {/* Location */}
          <div
            className="p-3 rounded-2xl flex items-start gap-2.5"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <MapPin size={18} className={`${theme.accentText} flex-shrink-0 mt-0.5`} />
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-200">
                {task.tkpAlamatTeks}
              </div>
              {(task.pelaporNama || formattedPhone) && (
                <div className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1.5 flex-wrap">
                  <span>
                    Pelapor: <strong className="text-slate-200 font-semibold">{task.pelaporNama || 'Warga'}</strong>
                  </span>
                  {formattedPhone && (
                    <>
                      <span className="text-slate-500">•</span>
                      <a
                        href={`tel:${callPhone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-amber-300 hover:text-amber-200 font-mono font-bold flex items-center gap-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 px-1.5 py-0.5 rounded transition-colors"
                        title="Hubungi Pelapor"
                      >
                        <Phone size={10} className="text-amber-400" />
                        <span>{formattedPhone}</span>
                      </a>
                    </>
                  )}
                </div>
              )}

              {task.ringkasanKeterangan && (
                <div className="mt-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Deskripsi Kejadian
                  </div>
                  <div className="text-xs text-slate-200 leading-relaxed">
                    {task.ringkasanKeterangan}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Pawas Tactical Instructions */}
          {task.arahanPawas && (
            <div
              className="p-3.5 rounded-2xl border"
              style={{
                background: theme.arahanBg,
                borderColor: theme.arahanBorder,
              }}
            >
              <div className={`text-[10px] font-black uppercase tracking-wider mb-1 ${theme.tagColor}`}>
                ⚡ Arahan Taktis Pawas
              </div>
              <div className="text-xs text-slate-200 leading-relaxed italic">
                &ldquo;{task.arahanPawas}&rdquo;
              </div>
            </div>
          )}

          {/* Regu Lapangan Yang Sudah Menerima */}
          {quota.acceptedOfficers.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-slate-400 mb-2">
                Personel yang sudah bergabung:
              </div>
              <div className="flex flex-wrap gap-2">
                {quota.acceptedOfficers.map((off, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] font-medium text-slate-200 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    {off.name} ({off.rank})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div
          className="p-4 sm:p-6 border-t flex items-center justify-end gap-3"
          style={{
            borderColor: theme.footerBorder,
            background: 'rgba(12, 14, 20, 0.95)',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            Abaikan / Nanti
          </button>
          <button
            id="btn-terima-tugas"
            data-testid="btn-terima-tugas"
            type="button"
            disabled={isAccepting || quota.isQuotaFull}
            onClick={() => onAccept(task)}
            className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            style={{
              background: theme.btnBg,
              color: theme.btnText,
              boxShadow: theme.btnGlow,
            }}
          >
            {isAccepting ? (
              <span>Menerima Penugasan...</span>
            ) : (
              <>
                <Shield size={16} />
                <span>Terima Tugas  ➔</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
