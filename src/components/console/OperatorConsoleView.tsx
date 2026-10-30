'use client';

import React from 'react';
import { Headphones, Map, BookOpen, Award, User } from 'lucide-react';
import '@/app/console/console.css';

import dynamic from 'next/dynamic';
import TacticalTabSkeleton from '@/components/ui/TacticalTabSkeleton';
import TacticalTabBar from '@/components/ui/TacticalTabBar';
import TacticalBottomNav from '@/components/ui/TacticalBottomNav';
import ConsoleTopBar from './ConsoleTopBar';

import TabOperatorCadPawas from './pawas/tabs/TabOperatorCadPawas';

const TabTacticalMapPawas = dynamic(() => import('./pawas/tabs/TabTacticalMapPawas'), {
  loading: () => <TacticalTabSkeleton badge="PETA SITUASI" message="Memuat peta situasi wilayah..." />,
  ssr: false,
});

const TabKinerjaOperator = dynamic(() => import('./pawas/tabs/TabKinerjaOperator'), {
  loading: () => <TacticalTabSkeleton badge="KINERJA OPERATOR" message="Memuat evaluasi dan peringkat operator 110..." />,
  ssr: false,
});

const TabBukuPintarSop = dynamic(() => import('./pawas/tabs/TabBukuPintarSop'), {
  loading: () => <TacticalTabSkeleton badge="BUKU PINTAR SOP" message="Memuat pedoman standar operasional presisi..." />,
  ssr: false,
});

const TabProfilPawas = dynamic(() => import('./profile/TabProfilPawas'), {
  loading: () => <TacticalTabSkeleton badge="PROFIL OPERATOR" message="Memuat profil operator..." />,
  ssr: false,
});

const TabTolakLogPawas = dynamic(() => import('./pawas/tabs/TabTolakLogPawas'), {
  ssr: false,
});

import ModalSuksesDisposisi from './pawas/modals/ModalSuksesDisposisi';
import ModalKeamananPawas from './pawas/modals/ModalKeamananPawas';
import ModalLightbox from './pawas/modals/ModalLightbox';
import ModalTolakPengaduan from './pawas/modals/ModalTolakPengaduan';
import ModalDisposisiLintasWilayah from './pawas/modals/ModalDisposisiLintasWilayah';

import { useOperatorConsole } from './operator/useOperatorConsole';
import { calculateDistanceHaversineKm, getSopRecommendationByIncident } from '@/lib/console/tactical-helpers';

const EscalationAlarmBanner = dynamic(
  () => import('./pawas/components/EscalationAlarmBanner'),
  { ssr: false }
);

function OperatorConsoleContent(props: {
  session?: any;
  initialSection?: string;
  initialMasterData?: any;
  initialOperatorData?: any;
}) {
  const { session } = props;
  const {
    activeTab,
    switchTab,
    userProfile,
    setUserProfile,
    antreanPawas,
    allRecentComplaints,
    registeredUnits,
    policeOffices,
    fleetUnits,
    hotspots,
    operatorRankings,
    loading,
    setLoading,
    presensiStatus,
    setPresensiStatus,
    jamMasukPiket,
    setJamMasukPiket,
    jamPulangPiket,
    setJamPulangPiket,
    simCaller,
    setSimCaller,
    cadFormErrors,
    setCadFormErrors,
    cadLocationSuggestions,
    showCadSuggestions,
    setShowCadSuggestions,
    isSearchingCadLocation,
    handleCadLocationSearch,
    handleSelectCadSuggestion,
    validateCadForm,
    showDisposisiModal,
    setShowDisposisiModal,
    selectedDisposisiItem,
    bukaModalDisposisi,
    showSuksesModal,
    setShowSuksesModal,
    suksesDisposisiData,
    showTolakModal,
    setShowTolakModal,
    tolakComplaint,
    setTolakComplaint,
    tolakKategori,
    setTolakKategori,
    tolakAlasan,
    setTolakAlasan,
    bukaModalTolak,
    handleConfirmRejectModal,
    handleSubmitPenolakan,
    showLightboxModal,
    setShowLightboxModal,
    lightboxImg,
    showKeamananModal,
    setShowKeamananModal,
    pinOtorisasiPawas,
    setPinOtorisasiPawas,
    showLintasWilayahModal,
    setShowLintasWilayahModal,
    selectedLintasWilayahComplaint,
    setSelectedLintasWilayahComplaint,
    selectedSatuanKeys,
    toggleSatuanSelection,
    kuotaPersonel,
    setKuotaPersonel,
    arahanPawas,
    setArahanPawas,
    tambahArahanCepatPawas,
    activePreviewSatuanKey,
    handleConfirmDisposisi,
    dbSubcategories,
    dbUrgencyLevels,
    dbRejectionReasons,
    daftarArmadaAktif,
    waitingCount,
    showFriendlyToast,
    showToast,
    loadData,
    handleLogout,
  } = useOperatorConsole(props);

  return (
    <div
      className="registrasi-body"
      style={activeTab === 'view-peta' ? { minHeight: '100vh', height: '100vh', overflow: 'hidden' } : undefined}
    >
      {/* ── TOPBAR OPERATOR SPKT (Reusable Component) ── */}
      <ConsoleTopBar
        stationName={
          userProfile.stationName ||
          session?.stationName ||
          (userProfile.stationId && policeOffices.find((p: any) => String(p.id) === String(userProfile.stationId))?.station_name) ||
          'Polres Pekalongan'
        }
        subtitle="Sentra Pelayanan SPKT & CAD Dispatch Darurat 110"
        onBrandClick={() => switchTab('view-operator')}
        profile={{
          name: userProfile.fullName ? userProfile.fullName : 'Bripka Andi Pratama',
          identifier: userProfile.identifier ? userProfile.identifier : '88010234',
          role: 'OPERATOR SPKT',
          avatar: userProfile.avatar,
          isActive: activeTab === 'view-profil',
          hasNotification: waitingCount > 0,
          onBellClick: () => switchTab('view-operator'),
          onClick: () => switchTab('view-profil'),
        }}
      />

      {/* ── HORIZONTAL TAB BAR (Desktop Only) ── */}
      {/* ── HORIZONTAL TAB BAR (Desktop Only - Reusable Atomic Component) ── */}
      {activeTab !== 'view-profil' && (
        <TacticalTabBar
          tabs={[
            { id: 'nav-operator', tabId: 'view-operator', label: 'Sentra Layanan 110 & CAD', icon: Headphones, badge: waitingCount },
            { id: 'nav-peta', tabId: 'view-peta', label: 'Peta Situasi Wilayah', icon: Map },
            { id: 'nav-panduan', tabId: 'view-panduan', label: 'Buku Pintar SOP & Layanan', icon: BookOpen },
            { id: 'nav-kinerja-operator', tabId: 'view-laporan', label: 'Kinerja & Peringkat 110', icon: Award },
          ]}
          activeTab={activeTab}
          onSelectTab={switchTab}
          activeColor="#0284C7"
        />
      )}

      {/* ── MAIN CONTENT ── */}
      <main className={`pawas-content-area ${activeTab === 'view-peta' ? 'pawas-peta-active' : 'registrasi-container'}`} style={activeTab === 'view-peta' ? { flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 } : undefined}>
        {/* Render banner alarm eskalasi di atas tab selain CAD, Kinerja, dan Peta */}
        {activeTab !== 'view-operator' && activeTab !== 'view-laporan' && activeTab !== 'view-peta' && (
          <EscalationAlarmBanner
            complaints={allRecentComplaints}
            currentStationId={userProfile?.stationId || session?.stationId}
            currentStationName={userProfile?.stationName || session?.stationName}
            currentUser={session || userProfile}
            policeOffices={policeOffices}
            onOpenDisposisiLintasWilayah={(comp) => {
              setSelectedLintasWilayahComplaint(comp);
              setShowLintasWilayahModal(true);
            }}
            onRefresh={loadData}
          />
        )}

        {activeTab === 'view-operator' && (
          <TabOperatorCadPawas
            switchTab={switchTab}
            userProfile={userProfile}
            simCaller={simCaller}
            setSimCaller={setSimCaller}
            cadFormErrors={cadFormErrors}
            setCadFormErrors={setCadFormErrors}
            dbSubcategories={dbSubcategories}
            dbUrgencyLevels={dbUrgencyLevels}
            cadLocationSuggestions={cadLocationSuggestions}
            showCadSuggestions={showCadSuggestions}
            setShowCadSuggestions={setShowCadSuggestions}
            isSearchingCadLocation={isSearchingCadLocation}
            handleCadLocationSearch={handleCadLocationSearch}
            handleSelectCadSuggestion={handleSelectCadSuggestion}
            validateCadForm={validateCadForm}
            loading={loading}
            setLoading={setLoading}
            showFriendlyToast={showFriendlyToast}
            bukaModalDisposisi={bukaModalDisposisi}
            bukaModalTolak={bukaModalTolak}
            setTolakComplaint={setTolakComplaint}
            loadData={loadData}
            session={session}
            antreanPawas={antreanPawas}
            policeOffices={policeOffices}
            onOpenDisposisiLintasWilayah={(comp) => {
              setSelectedLintasWilayahComplaint(comp);
              setShowLintasWilayahModal(true);
            }}
            escalationBanner={
              <EscalationAlarmBanner
                complaints={allRecentComplaints}
                currentStationId={userProfile?.stationId || session?.stationId}
                currentStationName={userProfile?.stationName || session?.stationName}
                currentUser={session || userProfile}
                policeOffices={policeOffices}
                onOpenDisposisiLintasWilayah={(comp) => {
                  setSelectedLintasWilayahComplaint(comp);
                  setShowLintasWilayahModal(true);
                }}
                onRefresh={loadData}
              />
            }
          />
        )}

        {activeTab === 'view-peta' && (
          <TabTacticalMapPawas
            userProfile={userProfile}
            fleetUnits={fleetUnits}
            hotspots={hotspots}
            policeOffices={policeOffices}
            setShowHotspotModal={() => {}}
            highPriorityIncident={antreanPawas.length > 0 ? antreanPawas[0] : null}
            resolveUrgencyLevel={(u) => (u ? u : 'SEDANG')}
            showFriendlyToast={showFriendlyToast}
          />
        )}

        {activeTab === 'view-panduan' && (
          <TabBukuPintarSop
            switchTab={switchTab}
            userProfile={userProfile}
            showFriendlyToast={showFriendlyToast}
            initialCallerPhone={simCaller?.telepon || ''}
            initialCallerName={simCaller?.nama || ''}
          />
        )}

        {activeTab === 'view-laporan' && (
          <TabKinerjaOperator
            userProfile={userProfile}
            allRecentComplaints={allRecentComplaints}
            operatorRankings={operatorRankings}
            switchTab={switchTab}
            escalationBanner={
              <EscalationAlarmBanner
                complaints={allRecentComplaints}
                currentStationId={userProfile?.stationId || session?.stationId}
                currentStationName={userProfile?.stationName || session?.stationName}
                currentUser={session || userProfile}
                policeOffices={policeOffices}
                onOpenDisposisiLintasWilayah={(comp) => {
                  setSelectedLintasWilayahComplaint(comp);
                  setShowLintasWilayahModal(true);
                }}
                onRefresh={loadData}
              />
            }
          />
        )}

        {activeTab === 'view-profil' && (
          <TabProfilPawas
            currentUser={userProfile}
            setCurrentUser={setUserProfile}
            totalLaporan={allRecentComplaints.length}
            selesaiCount={allRecentComplaints.filter((c) => c.status === 'SELESAI').length}
            responCepatPct="100%"
            allRecentComplaints={allRecentComplaints}
            units={fleetUnits.length > 0 ? fleetUnits : registeredUnits}
            policeOffices={policeOffices}
            showToast={showToast}
            onBackToBeranda={() => switchTab('view-operator')}
            onLogout={handleLogout}
            presensiStatus={presensiStatus}
            setPresensiStatus={setPresensiStatus}
            jamMasukPiket={jamMasukPiket}
            setJamMasukPiket={setJamMasukPiket}
            jamPulangPiket={jamPulangPiket}
            setJamPulangPiket={setJamPulangPiket}
            onOpenPresensiPulangModal={() => {}}
          />
        )}

        {activeTab === 'view-tolak' && (
          <TabTolakLogPawas
            switchTab={switchTab}
            tolakComplaint={tolakComplaint}
            tolakKategori={tolakKategori}
            setTolakKategori={setTolakKategori}
            dbRejectionReasons={dbRejectionReasons}
            tolakAlasan={tolakAlasan}
            setTolakAlasan={setTolakAlasan}
            handleSubmitPenolakan={handleSubmitPenolakan}
            loading={loading}
          />
        )}
      </main>

      {/* ── BOTTOM NAVIGATION (Mobile Operator - Reusable Component) ── */}
      <TacticalBottomNav
        activeTab={activeTab}
        onSelectTab={(tabId) => switchTab(tabId as any)}
        items={[
          { id: 'op-bottom-nav-cad', tabId: 'view-operator', label: 'CAD 110', icon: Headphones, badge: waitingCount },
          { id: 'op-bottom-nav-peta', tabId: 'view-peta', label: 'Peta', icon: Map },
          { id: 'op-bottom-nav-panduan', tabId: 'view-panduan', label: 'Buku SOP', icon: BookOpen },
          { id: 'op-bottom-nav-kinerja', tabId: 'view-laporan', label: 'Kinerja', icon: Award },
          { id: 'op-bottom-nav-profil', tabId: 'view-profil', label: 'Profil', icon: User },
        ]}
      />



      <ModalSuksesDisposisi
        isOpen={showSuksesModal}
        onClose={() => setShowSuksesModal(false)}
        data={suksesDisposisiData}
      />

      <ModalKeamananPawas
        isOpen={showKeamananModal}
        onClose={() => setShowKeamananModal(false)}
        session={session}
        pinOtorisasiPawas={pinOtorisasiPawas}
        setPinOtorisasiPawas={setPinOtorisasiPawas}
        showFriendlyToast={showFriendlyToast}
      />

      <ModalLightbox
        isOpen={showLightboxModal}
        onClose={() => setShowLightboxModal(false)}
        lightboxImg={lightboxImg}
      />

      <ModalTolakPengaduan
        isOpen={showTolakModal}
        onClose={() => setShowTolakModal(false)}
        complaint={tolakComplaint}
        onConfirmReject={handleConfirmRejectModal}
        loading={loading}
      />

      {showLintasWilayahModal && selectedLintasWilayahComplaint && (
        <ModalDisposisiLintasWilayah
          complaint={selectedLintasWilayahComplaint}
          policeOffices={policeOffices}
          allComplaints={allRecentComplaints}
          currentStationId={userProfile?.stationId || session?.stationId}
          currentStationName={userProfile?.stationName || session?.stationName}
          onClose={() => {
            setShowLintasWilayahModal(false);
            setSelectedLintasWilayahComplaint(null);
          }}
          onSuccess={async () => {
            setShowLintasWilayahModal(false);
            setSelectedLintasWilayahComplaint(null);
            showFriendlyToast('success', 'Disposisi Dialihkan', 'Laporan berhasil dialihkan ke Mako tujuan terdekat.');
            await loadData();
          }}
        />
      )}
    </div>
  );
}

export default function OperatorConsoleView(props: {
  session?: any;
  initialSection?: string;
  initialMasterData?: any;
  initialOperatorData?: any;
}) {
  return (
    <React.Suspense>
      <OperatorConsoleContent {...props} />
    </React.Suspense>
  );
}
