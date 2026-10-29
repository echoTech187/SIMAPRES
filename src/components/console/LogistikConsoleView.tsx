'use client';

import React from 'react';
import {
  Fuel,
  Settings2,
  User,
  LogOut,
  Building2,
  BadgeAlert,
} from 'lucide-react';
import { SessionPayload } from '@/lib/session-token';
import HeaderProfileBadge from './HeaderProfileBadge';
import TabAuditBbm from './master/tabs/TabAuditBbm';
import TabFuelType from './master/tabs/TabFuelType';
import LiveOperationalClock from '@/components/common/LiveOperationalClock';
import { useLogistikConsole, LogistikTab } from './logistik/useLogistikConsole';
import LogistikProfilTab from './logistik/LogistikProfilTab';
import TacticalTabBar from '@/components/ui/TacticalTabBar';
import '@/app/console/console.css';

export type { LogistikTab };

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
  const {
    activeTab,
    switchTab,
    userProfile,
    showToast,
    oldPassword,
    setOldPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    passLoading,
    passError,
    passSuccess,
    handleUpdatePassword,
    handleLogout,
  } = useLogistikConsole({ session, initialSection });

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
            {/* Live Operational WIB Clock */}
            <div className="hidden lg:flex">
              <LiveOperationalClock showStatusBadge={false} />
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

      {/* ── DESKTOP TABS NAVIGATION BAR (Reusable TacticalTabBar) ── */}
      <TacticalTabBar
        tabs={[
          { id: 'logistik-tab-audit-bbm', tabId: 'view-audit-bbm', label: 'Audit Mileage & SPJ BBM Patroli', icon: Fuel },
          { id: 'logistik-tab-master-bbm', tabId: 'view-master-bbm', label: 'Master BBM DIPA & Rasio Konsumsi', icon: Settings2 },
          { id: 'logistik-tab-profil', tabId: 'view-profil', label: 'Profil & Keamanan Akun Staf', icon: User },
        ]}
        activeTab={activeTab}
        onSelectTab={(tabId) => switchTab(tabId as LogistikTab)}
        activeColor="#0F172A"
      />

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
          <LogistikProfilTab
            session={session}
            oldPassword={oldPassword}
            setOldPassword={setOldPassword}
            newPassword={newPassword}
            setNewPassword={setNewPassword}
            confirmPassword={confirmPassword}
            setConfirmPassword={setConfirmPassword}
            passLoading={passLoading}
            passError={passError}
            passSuccess={passSuccess}
            onUpdatePassword={handleUpdatePassword}
          />
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
