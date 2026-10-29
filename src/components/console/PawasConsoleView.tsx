'use client';

import React from 'react';
import { Home, Map, ShieldAlert, BarChart3, User, BookOpen, ClipboardList } from 'lucide-react';
import '@/app/console/console.css';

import dynamic from 'next/dynamic';
import TacticalTabSkeleton from '@/components/ui/TacticalTabSkeleton';
import TacticalTabBar from '@/components/ui/TacticalTabBar';
import TacticalBottomNav from '@/components/ui/TacticalBottomNav';
import ConsoleTopBar from './ConsoleTopBar';

import TabBerandaPawas from './pawas/tabs/TabBerandaPawas';

const TabTacticalMapPawas = dynamic(() => import('./pawas/tabs/TabTacticalMapPawas'), {
  loading: () => <TacticalTabSkeleton badge="PETA TAKTIS" message="Memuat peta situasi taktis dan telemetry armada..." />,
  ssr: false,
});

const TabKinerjaPawas = dynamic(() => import('./pawas/tabs/TabKinerjaPawas'), {
  loading: () => <TacticalTabSkeleton badge="KINERJA & ANALITIK" message="Memuat metrik IKM dan peringkat personil..." />,
  ssr: false,
});

const TabOperatorCadPawas = dynamic(() => import('./pawas/tabs/TabOperatorCadPawas'), {
  loading: () => <TacticalTabSkeleton badge="SENTRA CAD" message="Memuat sistem penerimaan dan formulir CAD..." />,
  ssr: false,
});

const TabValidasiPawas = dynamic(() => import('./pawas/tabs/TabValidasiPawas').then((mod) => mod.TabValidasiPawas), {
  loading: () => <TacticalTabSkeleton badge="VALIDASI DOSSIER" message="Memuat berkas perkara dan dossier validasi..." />,
  ssr: false,
});

const TabBukuPintarSop = dynamic(() => import('./pawas/tabs/TabBukuPintarSop'), {
  loading: () => <TacticalTabSkeleton badge="BUKU PINTAR SOP" message="Memuat pedoman standar operasional presisi..." />,
  ssr: false,
});

const TabProfilPawas = dynamic(() => import('./profile/TabProfilPawas'), {
  loading: () => <TacticalTabSkeleton badge="PROFIL PAWAS" message="Memuat profil dan kredensial..." />,
  ssr: false,
});

const TabPiketPawas = dynamic(() => import('./piket/TabPiketPawas'), {
  loading: () => <TacticalTabSkeleton badge="JADWAL PIKET" message="Memuat daftar mutasi regu piket..." />,
  ssr: false,
});

const TabBuatLogPawas = dynamic(() => import('./pawas/tabs/TabBuatLogPawas'), {
  loading: () => <TacticalTabSkeleton badge="MUTASI LOG" message="Memuat formulir mutasi buku log..." />,
  ssr: false,
});

const TabTolakLogPawas = dynamic(() => import('./pawas/tabs/TabTolakLogPawas'), {
  loading: () => <TacticalTabSkeleton badge="LOG PENOLAKAN" message="Memuat riwayat penolakan laporan..." />,
  ssr: false,
});

const PawasModalsHost = dynamic(() => import('./pawas/components/PawasModalsHost'), {
  ssr: false,
});
import { usePawasConsole } from './pawas/hooks/usePawasConsole';

function CommandCenterContent(props: {
  session?: any;
  initialSection?: string;
  initialMasterData?: any;
  initialPawasData?: any;
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
    ikmStats,
    recentActivities,
    loading,
    setLoading,
    isServerDataLoaded,
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
    selectedSatuanKeys,
    toggleSatuanSelection,
    kuotaPersonel,
    setKuotaPersonel,
    arahanPawas,
    setArahanPawas,
    tambahArahanCepatPawas,
    activePreviewSatuanKey,
    handleConfirmDisposisi,
    showSuksesModal,
    setShowSuksesModal,
    suksesDisposisiData,
    showSlaModal,
    setShowSlaModal,
    avgResponseTime,
    onTimeRate,
    fastCount,
    mediumCount,
    slowCount,
    onTimeCount,
    completedWithTime,
    showKuatPersModal,
    setShowKuatPersModal,
    showIkmModal,
    setShowIkmModal,
    satisfactionRating,
    satisfactionPercent,
    showCetakModal,
    setShowCetakModal,
    showHotspotModal,
    setShowHotspotModal,
    showTimePickerModal,
    setShowTimePickerModal,
    setLogWaktuMulai,
    showPresensiPulangModal,
    setShowPresensiPulangModal,
    handlePresensiPulang,
    handleKonfirmasiPulangFinal,
    showKeamananModal,
    setShowKeamananModal,
    pinOtorisasiPawas,
    setPinOtorisasiPawas,
    showLightboxModal,
    setShowLightboxModal,
    lightboxImg,
    setLightboxImg,
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
    handleAjukanRevisi,
    handleSahkanPenutupanKasus,
    showLintasWilayahModal,
    setShowLintasWilayahModal,
    selectedLintasWilayahComplaint,
    setSelectedLintasWilayahComplaint,
    valFilterStatus,
    setValFilterStatus,
    valFilterPlatform,
    setValFilterPlatform,
    valFilterKategori,
    setValFilterKategori,
    selectedValComplaint,
    setSelectedValComplaint,
    openValidasiList,
    openValidasiWithPlatform,
    handleSelectPlatformFilter,
    handleSelectKategoriFilter,
    handleResetFilters,
    filteredValidasiComplaints,
    activeComplaint,
    matchesStatus,
    matchesKategori,
    getComplaintKategoriInfo,
    isComplaintRejected,
    resolveComplaintStatus,
    resolveUrgencyLevel,
    logWaktuMulai,
    logSektor,
    setLogSektor,
    logJenis,
    setLogJenis,
    logDeskripsi,
    setLogDeskripsi,
    logFotoPreview,
    setLogFotoPreview,
    handleSimpanLogKegiatan,
    dbCategories,
    dbSubcategories,
    dbPlatforms,
    dbGiats,
    dbStatuses,
    dbRejectionReasons,
    dbUrgencyLevels,
    daftarArmadaAktif,
    officerRankings,
    stationRankings,
    operatorRankings,
    slaClockSeconds,
    formatSlaClock,
    totalLaporan,
    menungguCount,
    ditolakCount,
    diprosesCount,
    pengesahanCount,
    selesaiCount,
    sosCount,
    wargaCount,
    hotline110Count,
    personelCount,
    logsForStatusTabs,
    tabCountSemua,
    tabCountMenunggu,
    platCountAll,
    platCountSos,
    platCountWarga,
    platCount110,
    platCountPersonel,
    logsForKategori,
    katCountAll,
    highPriorityIncident,
    showFriendlyToast,
    showToast,
    loadData,
    handleLogout,
  } = usePawasConsole(props);

  return (
    <div
      className="registrasi-body"
      style={activeTab === 'view-peta' ? { minHeight: '100vh', height: '100vh', overflow: 'hidden' } : undefined}
    >
      {/* ── TOPBAR (Reusable Component) ── */}
      <ConsoleTopBar
        stationName={
          userProfile.stationName ||
          session?.stationName ||
          (userProfile.stationId && policeOffices.find((p: any) => String(p.id) === String(userProfile.stationId))?.station_name) ||
          'Polres Pekalongan'
        }
        subtitle="Konsol Operasional Terpadu – Pengawas & Komando"
        onBrandClick={() => switchTab('view-beranda')}
        profile={{
          name: userProfile.fullName || 'AKBP Bambang Wijaya, S.I.K., M.Si.',
          identifier: userProfile.identifier || userProfile.nrp || '78091122',
          role: userProfile.roleBadge ? userProfile.roleBadge : 'PAWAS',
          avatar: userProfile.avatar || null,
          isActive: activeTab === 'view-profil',
          hasNotification: menungguCount > 0,
          onBellClick: () => openValidasiList('menunggu'),
          onClick: () => switchTab('view-profil'),
        }}
      />

      {/* ── HORIZONTAL TAB BAR (Desktop Only) ── */}
      {/* ── HORIZONTAL TAB BAR (Desktop Only - Reusable Atomic Component) ── */}
      {activeTab !== 'view-profil' && (
        <TacticalTabBar
          tabs={[
            { id: 'nav-beranda', tabId: 'view-beranda', label: 'Beranda', icon: Home },
            { id: 'nav-peta', tabId: 'view-peta', label: 'Peta Taktis', icon: Map },
            { id: 'nav-validasi', tabId: 'view-validasi', label: 'Komando Pawas', icon: ShieldAlert, badge: pengesahanCount },
            { id: 'nav-kinerja', tabId: 'view-laporan', label: 'Kinerja', icon: BarChart3 },
            { id: 'nav-panduan', tabId: 'view-panduan', label: 'Buku Pintar SOP', icon: BookOpen },
            { id: 'nav-piket', tabId: 'view-piket', label: 'Jadwal Piket', icon: ClipboardList },
          ]}
          activeTab={activeTab}
          onSelectTab={switchTab}
          activeColor="#153E75"
        />
      )}

      {/* ── MAIN CONTENT ── */}
      <main className={`pawas-content-area ${activeTab === 'view-peta' ? 'pawas-peta-active' : 'registrasi-container'}`} style={activeTab === 'view-peta' ? { flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 } : undefined}>
        {activeTab === 'view-beranda' && (
          <TabBerandaPawas
            userProfile={userProfile}
            presensiStatus={presensiStatus}
            isServerDataLoaded={isServerDataLoaded}
            switchTab={switchTab}
            highPriorityIncident={highPriorityIncident}
            openValidasiList={openValidasiList}
            openValidasiWithPlatform={openValidasiWithPlatform}
            setSelectedValComplaint={setSelectedValComplaint}
            setShowHotspotModal={setShowHotspotModal}
            setShowSlaModal={setShowSlaModal}
            setShowKuatPersModal={setShowKuatPersModal}
            setShowIkmModal={setShowIkmModal}
            fleetUnits={fleetUnits}
            hotspots={hotspots}
            policeOffices={policeOffices}
            totalLaporan={totalLaporan}
            menungguCount={menungguCount}
            ditolakCount={ditolakCount}
            diprosesCount={diprosesCount}
            pengesahanCount={pengesahanCount}
            selesaiCount={selesaiCount}
            sosCount={sosCount}
            wargaCount={wargaCount}
            hotline110Count={hotline110Count}
            personelCount={personelCount}
            allRecentComplaints={allRecentComplaints}
            completedWithTime={completedWithTime}
            avgResponseTime={avgResponseTime}
            onTimeRate={onTimeRate}
            fastCount={fastCount}
            mediumCount={mediumCount}
            slowCount={slowCount}
            registeredUnits={registeredUnits}
            satisfactionRating={satisfactionRating}
            satisfactionPercent={satisfactionPercent}
            recentActivities={recentActivities}
          />
        )}

        {activeTab === 'view-peta' && (
          <TabTacticalMapPawas
            userProfile={userProfile}
            fleetUnits={fleetUnits}
            hotspots={hotspots}
            policeOffices={policeOffices}
            setShowHotspotModal={setShowHotspotModal}
            highPriorityIncident={highPriorityIncident}
            resolveUrgencyLevel={resolveUrgencyLevel}
            showFriendlyToast={showFriendlyToast}
          />
        )}

        {activeTab === 'view-log' && (
          <TabBuatLogPawas
            logWaktuMulai={logWaktuMulai}
            setShowTimePickerModal={setShowTimePickerModal}
            logSektor={logSektor}
            setLogSektor={setLogSektor}
            logJenis={logJenis}
            setLogJenis={setLogJenis}
            dbGiats={dbGiats}
            logDeskripsi={logDeskripsi}
            setLogDeskripsi={setLogDeskripsi}
            logFotoPreview={logFotoPreview}
            setLogFotoPreview={setLogFotoPreview}
            handleSimpanLogKegiatan={handleSimpanLogKegiatan}
            loading={loading}
          />
        )}

        {activeTab === 'view-validasi' && (
          <TabValidasiPawas
            userProfile={userProfile}
            switchTab={switchTab}
            dbStatuses={dbStatuses}
            dbPlatforms={dbPlatforms}
            dbCategories={dbCategories}
            dbGiats={dbGiats}
            logsForStatusTabs={logsForStatusTabs}
            logsForKategori={logsForKategori}
            tabCountSemua={tabCountSemua}
            tabCountMenunggu={tabCountMenunggu}
            platCountAll={platCountAll}
            platCountSos={platCountSos}
            platCountWarga={platCountWarga}
            platCount110={platCount110}
            platCountPersonel={platCountPersonel}
            katCountAll={katCountAll}
            valFilterStatus={valFilterStatus}
            setValFilterStatus={setValFilterStatus}
            valFilterPlatform={valFilterPlatform}
            setValFilterPlatform={setValFilterPlatform}
            valFilterKategori={valFilterKategori}
            setValFilterKategori={setValFilterKategori}
            openValidasiList={openValidasiList}
            handleSelectPlatformFilter={handleSelectPlatformFilter}
            handleSelectKategoriFilter={handleSelectKategoriFilter}
            handleResetFilters={handleResetFilters}
            filteredValidasiComplaints={filteredValidasiComplaints}
            activeComplaint={activeComplaint}
            setSelectedValComplaint={setSelectedValComplaint}
            matchesStatus={matchesStatus}
            matchesKategori={matchesKategori}
            getComplaintKategoriInfo={getComplaintKategoriInfo}
            isComplaintRejected={isComplaintRejected}
            resolveComplaintStatus={resolveComplaintStatus}
            bukaModalDisposisi={bukaModalDisposisi}
            handleAjukanRevisi={handleAjukanRevisi}
            handleSahkanPenutupanKasus={handleSahkanPenutupanKasus}
            setTolakComplaint={setTolakComplaint}
            bukaModalTolak={bukaModalTolak}
            setLightboxImg={setLightboxImg}
            setShowLightboxModal={setShowLightboxModal}
            fleetUnits={fleetUnits}
            slaClockSeconds={slaClockSeconds}
            formatSlaClock={formatSlaClock}
            loading={loading}
            isServerDataLoaded={isServerDataLoaded}
            recentActivities={recentActivities}
          />
        )}

        {activeTab === 'view-laporan' && (
          <TabKinerjaPawas
            userProfile={userProfile}
            setShowCetakModal={setShowCetakModal}
            allRecentComplaints={allRecentComplaints}
            onTimeRate={onTimeRate}
            onTimeCount={onTimeCount}
            completedWithTime={completedWithTime}
            totalLaporan={totalLaporan}
            avgResponseTime={avgResponseTime}
            fleetUnits={fleetUnits}
            registeredUnits={registeredUnits}
            satisfactionRating={satisfactionRating}
            satisfactionPercent={satisfactionPercent}
            officerRankings={officerRankings}
            stationRankings={stationRankings}
            operatorRankings={operatorRankings}
          />
        )}

        {activeTab === 'view-profil' && (
          <TabProfilPawas
            currentUser={userProfile}
            setCurrentUser={setUserProfile}
            totalLaporan={totalLaporan}
            selesaiCount={selesaiCount}
            responCepatPct={completedWithTime.length > 0 ? `${onTimeRate}%` : '0%'}
            allRecentComplaints={allRecentComplaints}
            units={fleetUnits.length > 0 ? fleetUnits : registeredUnits}
            policeOffices={policeOffices}
            showToast={showToast}
            onBackToBeranda={() => switchTab('view-beranda')}
            onLogout={handleLogout}
            presensiStatus={presensiStatus}
            setPresensiStatus={setPresensiStatus}
            jamMasukPiket={jamMasukPiket}
            setJamMasukPiket={setJamMasukPiket}
            jamPulangPiket={jamPulangPiket}
            setJamPulangPiket={setJamPulangPiket}
            onOpenPresensiPulangModal={handlePresensiPulang}
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

        {activeTab === 'view-panduan' && (
          <TabBukuPintarSop
            switchTab={switchTab}
            userProfile={userProfile}
            showFriendlyToast={showFriendlyToast}
            initialCallerPhone={simCaller?.telepon || ''}
            initialCallerName={simCaller?.nama || ''}
          />
        )}

        {activeTab === 'view-piket' && (
          <TabPiketPawas
            session={session}
            showToast={showToast}
            defaultStationId={session?.stationId ? Number(session.stationId) : (userProfile?.stationId ? Number(userProfile.stationId) : 60001)}
          />
        )}
      </main>

      {/* ── BOTTOM NAVIGATION (Mobile & Tablet - Reusable Component) ── */}
      <TacticalBottomNav
        activeTab={activeTab}
        onSelectTab={(tabId) => switchTab(tabId as any)}
        items={[
          { id: 'pawas-bottom-nav-beranda', tabId: 'view-beranda', label: 'Beranda', icon: Home },
          { id: 'pawas-bottom-nav-peta', tabId: 'view-peta', label: 'Peta', icon: Map },
          { id: 'pawas-bottom-nav-komando', tabId: 'view-validasi', label: 'Komando', icon: ShieldAlert, isCenterAction: true, title: 'Komando Pawas' },
          { id: 'pawas-bottom-nav-kinerja', tabId: 'view-laporan', label: 'Kinerja', icon: BarChart3 },
          { id: 'pawas-bottom-nav-profil', tabId: 'view-profil', label: 'Profil', icon: User },
        ]}
      />

      {/* MODAL COMPONENTS HOST (13 MODALS ENCAPSULATED) */}
      <PawasModalsHost
        session={session}
        userProfile={userProfile}
        loading={loading}
        loadData={loadData}
        showFriendlyToast={showFriendlyToast}
        showDisposisiModal={showDisposisiModal}
        setShowDisposisiModal={setShowDisposisiModal}
        selectedDisposisiItem={selectedDisposisiItem}
        dbSubcategories={dbSubcategories}
        daftarArmadaAktif={daftarArmadaAktif}
        selectedSatuanKeys={selectedSatuanKeys}
        toggleSatuanSelection={toggleSatuanSelection}
        kuotaPersonel={kuotaPersonel}
        setKuotaPersonel={setKuotaPersonel}
        arahanPawas={arahanPawas}
        setArahanPawas={setArahanPawas}
        tambahArahanCepatPawas={tambahArahanCepatPawas}
        handleConfirmDisposisi={handleConfirmDisposisi}
        activePreviewSatuanKey={activePreviewSatuanKey}
        showSuksesModal={showSuksesModal}
        setShowSuksesModal={setShowSuksesModal}
        suksesDisposisiData={suksesDisposisiData}
        showSlaModal={showSlaModal}
        setShowSlaModal={setShowSlaModal}
        avgResponseTime={avgResponseTime}
        onTimeRate={onTimeRate}
        fastCount={fastCount}
        mediumCount={mediumCount}
        slowCount={slowCount}
        completedWithTime={completedWithTime}
        showKuatPersModal={showKuatPersModal}
        setShowKuatPersModal={setShowKuatPersModal}
        registeredUnits={registeredUnits}
        fleetUnits={fleetUnits}
        showIkmModal={showIkmModal}
        setShowIkmModal={setShowIkmModal}
        satisfactionRating={satisfactionRating}
        satisfactionPercent={satisfactionPercent}
        allRecentComplaints={allRecentComplaints}
        showCetakModal={showCetakModal}
        setShowCetakModal={setShowCetakModal}
        ikmStats={ikmStats}
        totalLaporan={totalLaporan}
        stationRankings={stationRankings}
        operatorRankings={operatorRankings}
        showHotspotModal={showHotspotModal}
        setShowHotspotModal={setShowHotspotModal}
        hotspots={hotspots}
        dbCategories={dbCategories}
        showTimePickerModal={showTimePickerModal}
        setShowTimePickerModal={setShowTimePickerModal}
        setLogWaktuMulai={setLogWaktuMulai}
        showPresensiPulangModal={showPresensiPulangModal}
        setShowPresensiPulangModal={setShowPresensiPulangModal}
        handleKonfirmasiPulangFinal={handleKonfirmasiPulangFinal}
        showKeamananModal={showKeamananModal}
        setShowKeamananModal={setShowKeamananModal}
        pinOtorisasiPawas={pinOtorisasiPawas}
        setPinOtorisasiPawas={setPinOtorisasiPawas}
        showLightboxModal={showLightboxModal}
        setShowLightboxModal={setShowLightboxModal}
        lightboxImg={lightboxImg}
        showTolakModal={showTolakModal}
        setShowTolakModal={setShowTolakModal}
        tolakComplaint={tolakComplaint}
        handleConfirmRejectModal={handleConfirmRejectModal}
        showLintasWilayahModal={showLintasWilayahModal}
        setShowLintasWilayahModal={setShowLintasWilayahModal}
        selectedLintasWilayahComplaint={selectedLintasWilayahComplaint}
        setSelectedLintasWilayahComplaint={setSelectedLintasWilayahComplaint}
        policeOffices={policeOffices}
      />
    </div>
  );
}

export default function PawasConsoleView(props: {
  session?: any;
  initialSection?: string;
  initialMasterData?: any;
  initialPawasData?: any;
}) {
  return (
    <React.Suspense>
      <CommandCenterContent {...props} />
    </React.Suspense>
  );
}
