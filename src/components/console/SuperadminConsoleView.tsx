'use client';

import React from 'react';
import Link from 'next/link';
import { useSuperadminConsole, SuperadminTab } from './superadmin/useSuperadminConsole';
import MasterDataManager, { MasterTabType } from './master/MasterDataManager';
import TabUnitPersonel from './master/tabs/TabUnitPersonel';
import TabProfilSuperadmin from './profile/TabProfilSuperadmin';
import SuperadminSidebar from './superadmin/SuperadminSidebar';
import HeaderProfileBadge from './HeaderProfileBadge';
import ModalPairingQr from './superadmin/ModalPairingQr';
import '@/app/console/console.css';

export type { SuperadminTab };

export default function SuperadminConsoleView({
  session,
  initialSection,
  initialSuperadminData,
}: {
  session?: any;
  initialSection?: string;
  initialMasterData?: any;
  initialSuperadminData?: {
    units?: any[];
    dropdowns?: any[];
    counters?: any;
  };
}) {
  const {
    units,
    masterItems,
    qrDataUrl,
    currentUser,
    setCurrentUser,
    activeTab,
    switchTab,
    isSidebarCollapsed,
    toggleSidebar,
    counters,
    showQrModal,
    setShowQrModal,
    qrSessionToken,
    complaints,
    showNotification,
    loadData,
    handleLogout,
    openQrModal,
  } = useSuperadminConsole({ session, initialSection, initialSuperadminData });

  return (
    <div
      className="registrasi-body superadmin-body-shell"
      style={{
        height: '100vh',
        maxHeight: '100vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Topbar Header Presisi (Konsep E Tribrata Log) */}
      <header className="topbar" style={{ flexShrink: 0 }}>
        <Link href="/" className="topbar-brand">
          <div className="brand-icon">
            <img
              src="/logo_simopmas.png"
              alt="Logo SIMOPMAS 110"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
          <div>
            <div className="brand-title">
              SIMOPMAS 110 • {(currentUser?.stationName || session?.stationName || 'Polres Pekalongan').toUpperCase()}
            </div>
            <div className="brand-subtitle">Modul Pendaftaran &amp; Manajemen Satuan Unit Terpadu</div>
          </div>
        </Link>

        <div className="topbar-nav" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <HeaderProfileBadge
            name={currentUser?.fullName || 'Aiptu Herman Sulistyo'}
            identifier={currentUser?.identifier || '78091122'}
            role={currentUser?.role || 'SUPERADMIN'}
            avatar={currentUser?.avatar || null}
            isActive={activeTab === 'profil'}
            onClick={() => switchTab('profil')}
          />
        </div>
      </header>

      {/* 2-Column Command Center Layout: Left Collapsible Categorized Sidebar + Main Content */}
      <div
        className="superadmin-layout-wrapper"
        style={{
          display: 'flex',
          flex: 1,
          minHeight: 0,
          height: 'calc(100vh - 70px)',
          background: '#F8FAFC',
          width: '100%',
          overflow: 'hidden',
          alignItems: 'stretch',
        }}
      >
        <SuperadminSidebar
          activeTab={activeTab}
          onTabChange={switchTab}
          counters={counters}
          unitsCount={units.length}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebar}
        />

        <main
          className="registrasi-container"
          style={{
            flex: 1,
            minWidth: 0,
            height: '100%',
            overflowY: 'auto',
            margin: 0,
            maxWidth: 'none',
            padding: '24px 32px',
            boxSizing: 'border-box',
          }}
        >
          {activeTab === 'unit' ? (
            <TabUnitPersonel
              initialUnits={units}
              initialMasterItems={masterItems}
              showToast={showNotification}
              onRefreshDropdowns={loadData}
              onOpenQrModal={openQrModal}
            />
          ) : activeTab === 'profil' ? (
            <TabProfilSuperadmin
              currentUser={currentUser}
              setCurrentUser={setCurrentUser}
              units={units}
              counters={counters}
              complaints={complaints}
              showToast={showNotification}
              onLogout={handleLogout}
            />
          ) : (
            <MasterDataManager
              activeTab={activeTab as MasterTabType}
              showToast={showNotification}
              onRefreshDropdowns={loadData}
            />
          )}
        </main>
      </div>

      {/* MODAL SCAN QR CODE */}
      <ModalPairingQr
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        qrDataUrl={qrDataUrl}
        qrSessionToken={qrSessionToken}
      />
    </div>
  );
}
