'use client';

import React from 'react';
import { Clock, AlertTriangle, Lock, CheckCircle2, QrCode, ShieldAlert, X } from 'lucide-react';

interface LoginAlertsProps {
  alertType?: string | null;
  alertRole?: string | null;
  alertRequired?: string | null;
  errorMsg?: string | null;
  onDismissAlert?: () => void;
}

export default function LoginAlerts({
  alertType,
  alertRole,
  alertRequired,
  errorMsg,
  onDismissAlert,
}: LoginAlertsProps) {
  const isUnregisteredDevice = errorMsg?.includes('Akun Belum Aktif');
  const isMismatchedDevice = errorMsg?.includes('Perangkat Tidak Terdaftar') || errorMsg?.includes('Perangkat Tidak Dikenali');

  return (
    <div className="pt-4 space-y-3">
      {alertType === 'inactivity_timeout' && (
        <div
          id="alert-inactivity"
          className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs leading-relaxed space-y-0.5"
        >
          <div className="flex items-center justify-between">
            <div className="font-bold flex items-center gap-1.5 text-amber-300 text-[11px]">
              <Clock size={13} />
              <span>Sesi Berakhir Otomatis (Standby &gt; 1 Jam)</span>
            </div>
            {onDismissAlert && (
              <button
                type="button"
                onClick={onDismissAlert}
                className="text-amber-400/60 hover:text-amber-200 p-0.5 rounded transition"
                title="Tutup Notifikasi"
              >
                <X size={12} />
              </button>
            )}
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
          <div className="flex items-center justify-between">
            <div className="font-bold flex items-center gap-1.5 text-red-300 text-[11px]">
              <AlertTriangle size={13} />
              <span>Hak Akses Ditolak (RBAC Presisi)</span>
            </div>
            {onDismissAlert && (
              <button
                type="button"
                onClick={onDismissAlert}
                className="text-red-400/60 hover:text-red-200 p-0.5 rounded transition"
                title="Tutup Notifikasi"
              >
                <X size={12} />
              </button>
            )}
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
          <div className="flex items-center justify-between">
            <div className="font-bold flex items-center gap-1.5 text-blue-300 text-[11px]">
              <Lock size={13} />
              <span>Autentikasi Diperlukan</span>
            </div>
            {onDismissAlert && (
              <button
                type="button"
                onClick={onDismissAlert}
                className="text-blue-400/60 hover:text-blue-200 p-0.5 rounded transition"
                title="Tutup Notifikasi"
              >
                <X size={12} />
              </button>
            )}
          </div>
          <p className="text-slate-300 text-[11px]">
            Halaman ini memerlukan izin kedinasan. Silakan masukkan NRP dan kata sandi Anda.
          </p>
        </div>
      )}

      {alertType === 'logged_out' && (
        <div
          id="alert-logged-out"
          className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-xs leading-relaxed space-y-0.5 transition-all duration-300 animate-in fade-in"
        >
          <div className="flex items-center justify-between">
            <div className="font-bold flex items-center gap-1.5 text-emerald-300 text-[11px]">
              <CheckCircle2 size={13} />
              <span>Berhasil Keluar (Logout)</span>
            </div>
            {onDismissAlert && (
              <button
                type="button"
                onClick={onDismissAlert}
                className="text-emerald-400/60 hover:text-emerald-200 p-0.5 rounded transition"
                title="Tutup Notifikasi"
              >
                <X size={12} />
              </button>
            )}
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
          className={`p-3.5 rounded-2xl text-xs leading-relaxed space-y-1.5 shadow-lg border ${
            isUnregisteredDevice
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-200'
              : isMismatchedDevice
              ? 'bg-rose-500/15 border-rose-500/40 text-rose-200'
              : 'bg-red-500/15 border-red-500/40 text-red-200'
          }`}
        >
          {isUnregisteredDevice ? (
            <>
              <div className="font-bold flex items-center gap-1.5 text-amber-300 text-xs">
                <QrCode size={15} className="shrink-0" />
                <span>Akun Belum Aktif (Perangkat Belum Terdaftar)</span>
              </div>
              <div id="login-alert-text" className="text-slate-200 text-[11px] leading-relaxed">
                {errorMsg}
              </div>
              <div className="pt-1.5 border-t border-amber-500/20 text-[10.5px] text-amber-300/90 flex items-start gap-1.5">
                <span className="shrink-0">📲</span>
                <span>
                  <strong>Instruksi Petugas:</strong> Bawa smartphone dinas Anda ke Sentra Pelayanan Kepolisian / Bag Ops untuk melakukan pemindaian QR Code pairing perangkat.
                </span>
              </div>
            </>
          ) : isMismatchedDevice ? (
            <>
              <div className="font-bold flex items-center gap-1.5 text-rose-300 text-xs">
                <ShieldAlert size={15} className="shrink-0" />
                <span>Akses Ditolak (Perangkat Tidak Terdaftar)</span>
              </div>
              <div id="login-alert-text" className="text-slate-200 text-[11px] leading-relaxed">
                {errorMsg}
              </div>
              <div className="pt-1.5 border-t border-rose-500/20 text-[10.5px] text-rose-300/90 flex items-start gap-1.5">
                <span className="shrink-0">⚠️</span>
                <span>
                  <strong>Protokol Keamanan:</strong> Demi keamanan data kepolisian, akun personil hanya dapat diakses melalui unit smartphone dinas yang telah diverifikasi resmi.
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="font-bold flex items-center gap-1.5 text-red-400 text-[11px]">
                <AlertTriangle size={13} className="shrink-0" />
                <span>Gagal Masuk</span>
              </div>
              <div id="login-alert-text" className="text-slate-200 text-[11px]">
                {errorMsg}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
