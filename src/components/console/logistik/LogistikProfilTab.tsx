'use client';

import React from 'react';
import { KeyRound, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { SessionPayload } from '@/lib/session-token';

interface LogistikProfilTabProps {
  session: SessionPayload;
  oldPassword: string;
  setOldPassword: (val: string) => void;
  newPassword: string;
  setNewPassword: (val: string) => void;
  confirmPassword: string;
  setConfirmPassword: (val: string) => void;
  passLoading: boolean;
  passError: string;
  passSuccess: string;
  onUpdatePassword: (e: React.FormEvent) => void;
}

export default function LogistikProfilTab({
  session,
  oldPassword,
  setOldPassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  passLoading,
  passError,
  passSuccess,
  onUpdatePassword,
}: LogistikProfilTabProps) {
  return (
    <div style={{ maxWidth: '780px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Info Kartu Profil Staf */}
      <div
        style={{
          background: 'white',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          padding: '24px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            borderBottom: '1px solid #F1F5F9',
            paddingBottom: '16px',
            marginBottom: '20px',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              fontWeight: 800,
              color: '#FCD34D',
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)',
            }}
          >
            {session.fullName ? session.fullName.substring(0, 2).toUpperCase() : 'LG'}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                {session.fullName}
              </h3>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background: '#FEF3C7',
                  color: '#92400E',
                  border: '1px solid #FDE68A',
                }}
              >
                Biro Logistik &amp; Si-Keu
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
              NRP: <strong style={{ color: '#0F172A', fontFamily: 'monospace' }}>{session.identifier}</strong> · Pangkat: {session.rankPangkat || 'Aiptu'}
            </div>
            <div style={{ fontSize: '11.5px', color: '#94A3B8', marginTop: '2px' }}>
              Unit Penugasan: {session.satuanNama || 'Bagian Logistik & Seksi Keuangan Mako'}
            </div>
          </div>
        </div>

        {/* Grid Rincian Wewenang */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <div style={{ padding: '12px 16px', borderRadius: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748B' }}>Fungsi Operasional</div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>Verifikasi SPJ BBM DIPA</div>
          </div>
          <div style={{ padding: '12px 16px', borderRadius: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748B' }}>Otoritas Cetak Dokumen</div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#059669', marginTop: '2px' }}>Format PDF Resmi SPJ 110</div>
          </div>
          <div style={{ padding: '12px 16px', borderRadius: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748B' }}>Audit Telemetri Armada</div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#2563EB', marginTop: '2px' }}>Sinkronisasi GPS Patroli</div>
          </div>
        </div>
      </div>

      {/* Form Ganti Kata Sandi */}
      <div
        style={{
          background: 'white',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          padding: '24px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <KeyRound size={18} color="#D97706" />
          <h4 style={{ fontSize: '14.5px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
            Perbarui Kata Sandi Akun Dinas
          </h4>
        </div>

        {passError && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              background: '#FEF2F2',
              border: '1px solid #FCA5A5',
              color: '#B91C1C',
              fontSize: '12px',
              marginBottom: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertTriangle size={15} />
            <span>{passError}</span>
          </div>
        )}

        {passSuccess && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              background: '#ECFDF5',
              border: '1px solid #6EE7B7',
              color: '#047857',
              fontSize: '12px',
              marginBottom: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <CheckCircle2 size={15} />
            <span>{passSuccess}</span>
          </div>
        )}

        <form onSubmit={onUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              Kata Sandi Saat Ini
            </label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="Masukkan kata sandi lama Anda"
              style={{
                width: '100%',
                padding: '9px 14px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '13px',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Kata Sandi Baru (Min. 6 Karakter)
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Masukkan kata sandi baru"
                style={{
                  width: '100%',
                  padding: '9px 14px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Konfirmasi Kata Sandi Baru
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi kata sandi baru"
                style={{
                  width: '100%',
                  padding: '9px 14px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
            <button
              type="submit"
              disabled={passLoading}
              style={{
                padding: '10px 22px',
                borderRadius: '8px',
                background: '#0F172A',
                color: '#FCD34D',
                fontWeight: 700,
                fontSize: '12.5px',
                border: 'none',
                cursor: passLoading ? 'not-allowed' : 'pointer',
                opacity: passLoading ? 0.7 : 1,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.15s ease',
              }}
            >
              {passLoading ? 'Menyimpan perubahan...' : 'Simpan Kata Sandi Baru'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
