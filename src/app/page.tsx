'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { loginInternalAction } from '@/app/actions/auth.actions';
import './login.css';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [nrp, setNrp] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Parameter notifikasi dari Middleware / Auto-Logout
  const alertType = searchParams.get('alert');
  const alertRole = searchParams.get('role');
  const alertRequired = searchParams.get('required');

  // Bersihkan sessionStorage jika diarahkan karena timeout / logout / ditolak
  useEffect(() => {
    if (alertType && typeof window !== 'undefined') {
      sessionStorage.removeItem('simapres_active_user');
    }
  }, [alertType]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!nrp.trim()) {
      setErrorMsg('Silakan masukkan NRP / ID Petugas terlebih dahulu!');
      return;
    }

    if (!password.trim()) {
      setErrorMsg('Silakan masukkan kata sandi akun Anda!');
      return;
    }

    setLoading(true);
    const res = await loginInternalAction(nrp, password);
    setLoading(false);

    if (res.success && res.data) {
      // Simpan session data ke sessionStorage untuk kompatibilitas UI
      sessionStorage.setItem('simapres_active_user', JSON.stringify(res.data));
      // Gunakan full page navigation agar cookie sesi terdeteksi oleh browser dan middleware
      window.location.href = res.data.targetRoute;
    } else {
      setErrorMsg(
        res.error ||
          'Kombinasi NRP dan Kata Sandi tidak cocok atau belum terdaftar pada sistem.'
      );
    }
  };

  return (
    <div className="login-card">
      {/* Logo Container */}
      <div className="logo-container">
        <div className="shield"></div>
        <div>
          <div className="brand-title">E TRIBRATA LOG</div>
          <div
            style={{
              fontSize: '11px',
              color: '#64748B',
              fontWeight: 600,
              letterSpacing: '0.5px',
            }}
          >
            SISTEM LOGBOOK &amp; OPERASIONAL PRESISI
          </div>
        </div>
      </div>

      {/* NOTIFIKASI MIDDLEWARE & AUTO-LOGOUT STANDBY (RAMAH PENGGUNA) */}
      {alertType === 'inactivity_timeout' && (
        <div
          id="alert-inactivity"
          style={{
            marginBottom: '16px',
            padding: '12px 14px',
            background: '#FEF3C7',
            border: '1.5px solid #FCD34D',
            borderRadius: '10px',
            color: '#92400E',
            fontSize: '12.5px',
            lineHeight: 1.45,
            textAlign: 'left',
          }}
        >
          <div
            style={{
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '3px',
            }}
          >
            <span>⏳</span>
            <span>Sesi Berakhir Otomatis (Standby &gt; 1 Jam)</span>
          </div>
          <div>
            Sesi operasional Anda otomatis ditutup karena tidak ada aktivitas
            selama lebih dari 1 jam demi perlindungan integritas data Presisi
            110. Silakan masuk kembali.
          </div>
        </div>
      )}

      {alertType === 'unauthorized' && (
        <div
          id="alert-unauthorized"
          style={{
            marginBottom: '16px',
            padding: '12px 14px',
            background: '#FEF2F2',
            border: '1.5px solid #FCA5A5',
            borderRadius: '10px',
            color: '#991B1B',
            fontSize: '12.5px',
            lineHeight: 1.45,
            textAlign: 'left',
          }}
        >
          <div
            style={{
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '3px',
            }}
          >
            <span>⛔</span>
            <span>Hak Akses Halaman Ditolak (RBAC Presisi)</span>
          </div>
          <div>
            Akun Anda terdaftar dengan peran <strong>{alertRole || 'User'}</strong> dan tidak memiliki wewenang untuk membuka halaman tersebut (Khusus peran <strong>{alertRequired || 'Terkait'}</strong>). Silakan masuk menggunakan akun yang sesuai.
          </div>
        </div>
      )}

      {alertType === 'unauthenticated' && (
        <div
          id="alert-unauthenticated"
          style={{
            marginBottom: '16px',
            padding: '12px 14px',
            background: '#EFF6FF',
            border: '1.5px solid #BFDBFE',
            borderRadius: '10px',
            color: '#1E40AF',
            fontSize: '12.5px',
            lineHeight: 1.45,
            textAlign: 'left',
          }}
        >
          <div
            style={{
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '3px',
            }}
          >
            <span>🔒</span>
            <span>Autentikasi Diperlukan</span>
          </div>
          <div>
            Halaman yang Anda tuju memerlukan autentikasi resmi. Silakan masuk
            menggunakan NRP / ID Petugas dan kata sandi Anda.
          </div>
        </div>
      )}

      {alertType === 'logged_out' && (
        <div
          id="alert-logged-out"
          style={{
            marginBottom: '16px',
            padding: '12px 14px',
            background: '#ECFDF5',
            border: '1.5px solid #A7F3D0',
            borderRadius: '10px',
            color: '#065F46',
            fontSize: '12.5px',
            lineHeight: 1.45,
            textAlign: 'left',
          }}
        >
          <div
            style={{
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '3px',
            }}
          >
            <span>✅</span>
            <span>Berhasil Keluar (Logout)</span>
          </div>
          <div>
            Sesi operasional kedinasan Anda telah berhasil ditutup dengan aman.
            Terima kasih atas pelayanan Presisi Anda.
          </div>
        </div>
      )}

      {/* Error Alert Box untuk Submit Form */}
      {errorMsg && (
        <div
          id="login-alert-error"
          style={{
            marginBottom: '16px',
            padding: '12px 14px',
            background: '#FEF2F2',
            border: '1.5px solid #FCA5A5',
            borderRadius: '10px',
            color: '#991B1B',
            fontSize: '12.5px',
            lineHeight: 1.4,
            textAlign: 'left',
          }}
        >
          <div
            style={{
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '2px',
            }}
          >
            <span>⛔</span>
            <span>Gagal Masuk</span>
          </div>
          <div id="login-alert-text">{errorMsg}</div>
        </div>
      )}

      {/* Form Login */}
      <form onSubmit={handleLogin}>
        <div className="form-group-login">
          <label className="form-label-login" htmlFor="login-nrp">
            NRP / ID Petugas
          </label>
          <input
            type="text"
            id="login-nrp"
            className="form-control-login"
            placeholder="Masukkan NRP atau ID Petugas Terdaftar"
            value={nrp}
            onChange={(e) => setNrp(e.target.value)}
            required
            autoComplete="username"
          />
        </div>

        <div className="form-group-login" style={{ marginTop: '14px' }}>
          <label className="form-label-login" htmlFor="login-pass">
            Kata Sandi
          </label>
          <input
            type="password"
            id="login-pass"
            className="form-control-login"
            placeholder="Masukkan Kata Sandi Akun"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-login-submit"
          style={{
            opacity: loading ? 0.7 : 1,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          <span>{loading ? 'MEMVERIFIKASI AUTENTIKASI...' : 'MASUK KE SISTEM'}</span>
          <span>➔</span>
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="login-body-wrapper">
      <Suspense
        fallback={
          <div className="login-card" style={{ padding: '40px', color: '#64748B' }}>
            Memuat Sistem Presisi 110...
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
