'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Fuel,
  Settings2,
  User,
  Shield,
  Clock,
  LogOut,
  Building2,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  BadgeAlert,
} from 'lucide-react';
import { logoutAction, updateUserPasswordAction } from '@/app/actions/auth.actions';
import { SessionPayload } from '@/lib/session-token';
import HeaderProfileBadge from './HeaderProfileBadge';
import TabAuditBbm from './master/tabs/TabAuditBbm';
import TabFuelType from './master/tabs/TabFuelType';
import { toast } from '@/components/ui/Toast';
import '@/app/registrasi-unit/registrasi-unit.css';

export type LogistikTab = 'view-audit-bbm' | 'view-master-bbm' | 'view-profil';

interface LogistikConsoleViewProps {
  session: SessionPayload;
  initialSection?: string;
  initialMasterData?: any;
}

export default function LogistikConsoleView({
  session,
  initialSection = 'audit_bbm',
  initialMasterData,
}: LogistikConsoleViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 1. Resolve initial active tab from URL / section
  const resolveSectionTab = useCallback((sec?: string): LogistikTab => {
    const clean = (sec || '').toLowerCase().trim();
    if (['master-bbm', 'master_bbm', 'fuel', 'fuel_type', 'harga', 'dipa'].includes(clean)) {
      return 'view-master-bbm';
    }
    if (['profil', 'profile', 'akun', 'keamanan', 'password'].includes(clean)) {
      return 'view-profil';
    }
    return 'view-audit-bbm';
  }, []);

  const [activeTab, setActiveTab] = useState<LogistikTab>(() => resolveSectionTab(initialSection));

  // Sync tab if initialSection changes
  useEffect(() => {
    setActiveTab(resolveSectionTab(initialSection));
  }, [initialSection, resolveSectionTab]);

  // Synchronize tab switch with shallow router update
  const switchTab = useCallback(
    (tabId: LogistikTab) => {
      setActiveTab(tabId);
      const slugMap: Record<LogistikTab, string> = {
        'view-audit-bbm': 'audit_bbm',
        'view-master-bbm': 'fuel_type',
        'view-profil': 'profil',
      };
      const slug = slugMap[tabId];
      if (typeof window !== 'undefined') {
        const url = slug === 'audit_bbm' ? '/console' : `/console/${slug}`;
        window.history.pushState(null, '', url);
      }
    },
    []
  );

  // 2. Real-time WIB Clock
  const [liveWib, setLiveWib] = useState<string>('');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLiveWib(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }) + ' WIB'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // 3. User Profile Memo
  const userProfile = useMemo(() => {
    return {
      id: session.userId,
      nrp: session.identifier,
      nama: session.fullName,
      pangkat: session.rankPangkat || 'Aiptu',
      jabatan: 'Bamin Bag Log / Pengelola BBM DIPA',
      satuanNama: session.satuanNama || 'Biro Logistik & Si-Keu',
      avatarUrl: session.avatar || '',
      role: 'LOGISTIK',
    };
  }, [session]);

  // Toast Helper
  const showToast = useCallback((msg: string) => {
    toast.info(msg);
  }, []);

  // 4. Password Update Form State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passLoading, setPassLoading] = useState(false);
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

    if (!oldPassword.trim()) {
      setPassError('Silakan masukkan kata sandi dinas saat ini!');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setPassError('Kata sandi baru minimal harus 6 karakter!');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError('Konfirmasi kata sandi tidak cocok!');
      return;
    }

    setPassLoading(true);
    try {
      const res = await updateUserPasswordAction(newPassword, oldPassword);
      if (res.success) {
        setPassSuccess('Kata sandi dinas berhasil diperbarui! Silakan gunakan kata sandi baru untuk login berikutnya.');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPassError(res.error || 'Gagal memperbarui kata sandi dinas.');
      }
    } catch (err: any) {
      setPassError(err.message || 'Terjadi kesalahan sistem saat memperbarui kata sandi.');
    } finally {
      setPassLoading(false);
    }
  };

  const handleLogout = async () => {
    if (typeof window !== 'undefined' && !confirm('Apakah Anda yakin ingin keluar dari Konsol Logistik & Keuangan?')) {
      return;
    }
    await logoutAction();
    router.push('/');
  };

  return (
    <div className="pawas-console-wrapper" style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', flexDirection: 'column' }}>
      {/* ── TOPBAR KONSOL BIRO LOGISTIK ── */}
      <header
        className="pawas-topbar"
        style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          padding: '12px 24px',
          color: 'white',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
      >
        <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          {/* Sisi Kiri: Identitas Presisi & Role Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                flexShrink: 0,
              }}
            >
              <Fuel size={22} color="#0B111E" strokeWidth={2.4} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: 900, letterSpacing: '0.04em', color: '#FCD34D' }}>
                  SIMOPMAS 110 • BIRO LOGISTIK &amp; KEUANGAN
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    background: 'rgba(245, 158, 11, 0.15)',
                    color: '#FCD34D',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    letterSpacing: '0.05em',
                  }}
                >
                  BAG LOG / SI-KEU
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                Tata Kelola Bahan Bakar DIPA &amp; Rekapitulasi SPJ Patroli 110
              </div>
            </div>
          </div>

          {/* Sisi Kanan: Live WIB, Mako Badge, Profile & Logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Live Operational WIB */}
            <div
              style={{
                display: 'none',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
                fontSize: '11.5px',
                fontFamily: 'monospace',
                color: '#CBD5E1',
              }}
              className="lg:flex"
            >
              <Clock size={13} color="#F59E0B" />
              <span>{liveWib || 'Memuat WIB...'}</span>
            </div>

            {/* Mako / Satuan Badge */}
            <div
              style={{
                display: 'none',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '8px',
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                fontSize: '11.5px',
                fontWeight: 600,
                color: '#FDE68A',
              }}
              className="md:flex"
            >
              <Building2 size={13} color="#F59E0B" />
              <span>{session.satuanNama || 'Polres Metro'}</span>
            </div>

            {/* Profile Badge */}
            <HeaderProfileBadge
              name={session.fullName}
              identifier={session.identifier}
              role="LOGISTIK"
              avatar={session.avatar}
              isActive={activeTab === 'view-profil'}
              onClick={() => switchTab('view-profil')}
            />

            {/* Logout Button */}
            <button
              type="button"
              id="btn-logout-logistik"
              onClick={handleLogout}
              title="Keluar dari Konsol Kedinasan"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#FCA5A5',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* ── DESKTOP TABS NAVIGATION BAR ── */}
      <div
        className="pawas-desktop-tabs-wrapper"
        style={{
          background: 'white',
          borderBottom: '1px solid #E2E8F0',
          position: 'sticky',
          top: '66px',
          zIndex: 30,
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
        }}
      >
        <div
          style={{
            maxWidth: '1440px',
            margin: '0 auto',
            padding: '8px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            overflowX: 'auto',
          }}
        >
          {/* TAB 1: AUDIT MILEAGE & SPJ BBM */}
          <button
            type="button"
            id="logistik-tab-audit-bbm"
            onClick={() => switchTab('view-audit-bbm')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 18px',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
              background: activeTab === 'view-audit-bbm' ? '#0F172A' : '#F8FAFC',
              color: activeTab === 'view-audit-bbm' ? '#FCD34D' : '#475569',
              border: activeTab === 'view-audit-bbm' ? '1px solid #0F172A' : '1px solid #E2E8F0',
              boxShadow: activeTab === 'view-audit-bbm' ? '0 2px 6px rgba(15, 23, 42, 0.2)' : 'none',
            }}
          >
            <Fuel size={15} strokeWidth={2.4} />
            <span>Audit Mileage &amp; SPJ BBM Patroli</span>
          </button>

          {/* TAB 2: MASTER BBM DIPA */}
          <button
            type="button"
            id="logistik-tab-master-bbm"
            onClick={() => switchTab('view-master-bbm')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 18px',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
              background: activeTab === 'view-master-bbm' ? '#0F172A' : '#F8FAFC',
              color: activeTab === 'view-master-bbm' ? '#FCD34D' : '#475569',
              border: activeTab === 'view-master-bbm' ? '1px solid #0F172A' : '1px solid #E2E8F0',
              boxShadow: activeTab === 'view-master-bbm' ? '0 2px 6px rgba(15, 23, 42, 0.2)' : 'none',
            }}
          >
            <Settings2 size={15} strokeWidth={2.4} />
            <span>Master BBM DIPA &amp; Rasio Konsumsi</span>
          </button>

          {/* TAB 3: PROFIL STAF LOGISTIK */}
          <button
            type="button"
            id="logistik-tab-profil"
            onClick={() => switchTab('view-profil')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 18px',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
              background: activeTab === 'view-profil' ? '#0F172A' : '#F8FAFC',
              color: activeTab === 'view-profil' ? '#FCD34D' : '#475569',
              border: activeTab === 'view-profil' ? '1px solid #0F172A' : '1px solid #E2E8F0',
              boxShadow: activeTab === 'view-profil' ? '0 2px 6px rgba(15, 23, 42, 0.2)' : 'none',
            }}
          >
            <User size={15} strokeWidth={2.4} />
            <span>Profil &amp; Keamanan Akun Staf</span>
          </button>
        </div>
      </div>

      {/* ── MAIN CONTENT AREA ── */}
      <main className="registrasi-container" style={{ flex: 1, padding: '24px 16px', maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
        {/* TAB 1: AUDIT BBM PATROLI 110 */}
        {activeTab === 'view-audit-bbm' && (
          <div className="space-y-4">
            <TabAuditBbm
              lookups={initialMasterData || {}}
              userProfile={userProfile}
              showToast={showToast}
            />
          </div>
        )}

        {/* TAB 2: MASTER BBM DIPA */}
        {activeTab === 'view-master-bbm' && (
          <div className="space-y-4">
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-4 flex items-start gap-3">
              <BadgeAlert className="text-amber-600 mt-0.5 flex-shrink-0" size={18} />
              <div>
                <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                  Pedoman Alokasi BBM Dinas Polri Berdasarkan Pagu DIPA
                </h4>
                <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                  Perubahan harga per liter atau rasio konsumsi armada patroli akan langsung memengaruhi perhitungan estimasi pagu rupiah pada lembar verifikasi SPJ bulanan Polsek jajaran. Pastikan penyesuaian tarif sesuai dengan Surat Keputusan Kapolri / Nota Dinas Bag Log terkini.
                </p>
              </div>
            </div>
            <TabFuelType
              lookups={initialMasterData || {}}
              showToast={showToast}
              onRefreshDropdowns={() => {}}
            />
          </div>
        )}

        {/* TAB 3: PROFIL & KEAMANAN AKUN STAF */}
        {activeTab === 'view-profil' && (
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid #F1F5F9', paddingBottom: '16px', marginBottom: '20px' }}>
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
                <div style={{ padding: '10px 14px', borderRadius: '8px', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', fontSize: '12px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={15} />
                  <span>{passError}</span>
                </div>
              )}

              {passSuccess && (
                <div style={{ padding: '10px 14px', borderRadius: '8px', background: '#ECFDF5', border: '1px solid #6EE7B7', color: '#047857', fontSize: '12px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={15} />
                  <span>{passSuccess}</span>
                </div>
              )}

              <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
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
        )}
      </main>

      {/* ── BOTTOM NAVIGATION (MOBILE & TABLET) ── */}
      <nav className="bottom-nav pawas-bottom-nav">
        {/* TAB: AUDIT BBM */}
        <div
          id="logistik-bottom-nav-audit"
          className={`nav-item ${activeTab === 'view-audit-bbm' ? 'active' : ''}`}
          onClick={() => switchTab('view-audit-bbm')}
        >
          <span className="nav-icon">
            <Fuel size={20} strokeWidth={activeTab === 'view-audit-bbm' ? 2.4 : 1.8} />
          </span>
          <span className="nav-label">Audit BBM</span>
        </div>

        {/* TAB: MASTER BBM */}
        <div
          id="logistik-bottom-nav-master"
          className={`nav-item ${activeTab === 'view-master-bbm' ? 'active' : ''}`}
          onClick={() => switchTab('view-master-bbm')}
        >
          <span className="nav-icon">
            <Settings2 size={20} strokeWidth={activeTab === 'view-master-bbm' ? 2.4 : 1.8} />
          </span>
          <span className="nav-label">Master DIPA</span>
        </div>

        {/* TAB: PROFIL */}
        <div
          id="logistik-bottom-nav-profil"
          className={`nav-item ${activeTab === 'view-profil' ? 'active' : ''}`}
          onClick={() => switchTab('view-profil')}
        >
          <span className="nav-icon">
            <User size={20} strokeWidth={activeTab === 'view-profil' ? 2.4 : 1.8} />
          </span>
          <span className="nav-label">Profil</span>
        </div>

        {/* TAB: LOGOUT */}
        <div
          id="logistik-bottom-nav-logout"
          className="nav-item"
          onClick={handleLogout}
        >
          <span className="nav-icon">
            <LogOut size={20} strokeWidth={1.8} />
          </span>
          <span className="nav-label">Keluar</span>
        </div>
      </nav>
    </div>
  );
}
