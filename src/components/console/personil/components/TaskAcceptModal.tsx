'use client';

import React from 'react';
import { Shield, AlertTriangle, MapPin, Users, CheckCircle2, X } from 'lucide-react';
import { getTaskQuotaInfo } from '../types';
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dark backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        className="relative w-full max-w-lg rounded-3xl overflow-hidden z-10 transition-all duration-300 animate-in fade-in zoom-in-95"
        style={{
          background: 'linear-gradient(180deg, #181C26 0%, #0E1118 100%)',
          border: '2px solid #ECC473',
          boxShadow: '0 25px 60px -10px rgba(0, 0, 0, 0.9), 0 0 30px rgba(236, 196, 115, 0.25)',
        }}
      >
        {/* Golden Header Banner */}
        <div
          className="px-6 py-4 flex items-center justify-between border-b"
          style={{
            background: 'linear-gradient(135deg, rgba(236, 196, 115, 0.2) 0%, rgba(184, 130, 42, 0.1) 100%)',
            borderColor: 'rgba(236, 196, 115, 0.25)',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #ECC473 0%, #D4A346 100%)',
                boxShadow: '0 0 16px rgba(236, 196, 115, 0.4)',
              }}
            >
              <AlertTriangle size={20} className="text-[#0B0C10]" />
            </div>
            <div>
              <span className="text-[10px] font-black tracking-widest uppercase text-amber-400 block">
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
          {/* Ticket Number & Quota Pill */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-mono font-bold text-amber-300 bg-amber-400/10 border border-amber-400/25 px-2.5 py-1 rounded-lg">
              #{task.nomorTiket || task.id}
            </span>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 bg-white/5 border border-white/10 px-3 py-1 rounded-lg">
              <Users size={14} className="text-amber-400" />
              <span>
                Regu: {quota.acceptedCount}/{quota.quota} Personil ({quota.slotsRemaining} Slot Sisa)
              </span>
            </div>
          </div>

          {/* Incident Title */}
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Jenis Kejadian
            </div>
            <div className="text-lg font-black text-white">
              {task.jenisKejadian || 'Gangguan Kamtibmas'}
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
            <MapPin size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-200">
                {task.tkpAlamatTeks || 'Lokasi Kejadian'}
              </div>
              {task.pelaporNama && (
                <div className="text-[11px] text-slate-400 mt-1">
                  Pelapor: {task.pelaporNama} {task.pelaporTelepon ? `• ${task.pelaporTelepon}` : ''}
                </div>
              )}
            </div>
          </div>

          {/* Pawas Tactical Instructions */}
          {task.arahanPawas && (
            <div
              className="p-3.5 rounded-2xl border"
              style={{
                background: 'rgba(236, 196, 115, 0.06)',
                borderColor: 'rgba(236, 196, 115, 0.25)',
              }}
            >
              <div className="text-[10px] font-black uppercase text-amber-400 tracking-wider mb-1">
                ⚡ Arahan Taktis Pawas
              </div>
              <div className="text-xs text-amber-100/90 leading-relaxed italic">
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
            borderColor: 'rgba(236, 196, 115, 0.15)',
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
            type="button"
            disabled={isAccepting || quota.isQuotaFull}
            onClick={() => onAccept(task)}
            className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #ECC473 0%, #D4A346 50%, #B8822A 100%)',
              color: '#0B0D12',
              boxShadow: '0 4px 18px rgba(212, 163, 70, 0.4)',
            }}
          >
            {isAccepting ? (
              <span>Menerima Penugasan...</span>
            ) : (
              <>
                <Shield size={16} />
                <span>Terima Tugas ({quota.slotsRemaining} Slot) ➔</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
