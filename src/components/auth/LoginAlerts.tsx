'use client';

import React from 'react';
import { Clock, AlertTriangle, Lock, CheckCircle2 } from 'lucide-react';

interface LoginAlertsProps {
  alertType?: string | null;
  alertRole?: string | null;
  alertRequired?: string | null;
  errorMsg?: string | null;
}

export default function LoginAlerts({
  alertType,
  alertRole,
  alertRequired,
  errorMsg,
}: LoginAlertsProps) {
  return (
    <div className="pt-4 space-y-3">
      {alertType === 'inactivity_timeout' && (
        <div
          id="alert-inactivity"
          className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs leading-relaxed space-y-0.5"
        >
          <div className="font-bold flex items-center gap-1.5 text-amber-300 text-[11px]">
            <Clock size={13} />
            <span>Sesi Berakhir Otomatis (Standby &gt; 1 Jam)</span>
          </div>
          <p className="text-slate-300 text-[11px]">
            Sesi kedinasan Anda ditutup otomatis demi perlindungan data Presisi 110. Silakan masuk kembali.
          </p>
        </div>
      )}

      {alertType === 'unauthorized' && (
        <div
          id="alert-unauthorized"
          className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-200 text-xs leading-relaxed space-y-0.5"
        >
          <div className="font-bold flex items-center gap-1.5 text-red-300 text-[11px]">
            <AlertTriangle size={13} />
            <span>Hak Akses Ditolak (RBAC Presisi)</span>
          </div>
          <p className="text-slate-300 text-[11px]">
            Peran Anda ({alertRole || 'User'}) tidak berwenang membuka halaman tersebut (Khusus peran {alertRequired || 'Terkait'}).
          </p>
        </div>
      )}

      {alertType === 'unauthenticated' && (
        <div
          id="alert-unauthenticated"
          className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-200 text-xs leading-relaxed space-y-0.5"
        >
          <div className="font-bold flex items-center gap-1.5 text-blue-300 text-[11px]">
            <Lock size={13} />
            <span>Autentikasi Diperlukan</span>
          </div>
          <p className="text-slate-300 text-[11px]">
            Halaman ini memerlukan izin kedinasan. Silakan masukkan NRP dan kata sandi Anda.
          </p>
        </div>
      )}

      {alertType === 'logged_out' && (
        <div
          id="alert-logged-out"
          className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-xs leading-relaxed space-y-0.5"
        >
          <div className="font-bold flex items-center gap-1.5 text-emerald-300 text-[11px]">
            <CheckCircle2 size={13} />
            <span>Berhasil Keluar (Logout)</span>
          </div>
          <p className="text-slate-300 text-[11px]">
            Sesi operasional kedinasan Anda telah ditutup dengan aman. Terima kasih atas dedikasi pelayanan Anda.
          </p>
        </div>
      )}

      {/* Error Alert Box */}
      {errorMsg && (
        <div
          id="login-alert-error"
          className="p-3 rounded-2xl bg-red-500/15 border border-red-500/40 text-red-200 text-xs leading-relaxed space-y-0.5"
        >
          <div className="font-bold flex items-center gap-1.5 text-red-400 text-[11px]">
            <AlertTriangle size={13} />
            <span>Gagal Masuk</span>
          </div>
          <div id="login-alert-text" className="text-slate-200 text-[11px]">
            {errorMsg}
          </div>
        </div>
      )}
    </div>
  );
}
