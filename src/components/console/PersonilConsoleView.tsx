'use client';

import React from 'react';
import PersonilHeader from './personil/PersonilHeader';
import PersonilNav from './personil/PersonilNav';
import TabBerandaPersonil from './personil/tabs/TabBerandaPersonil';
import TabMapsPersonil from './personil/tabs/TabMapsPersonil';
import TabProfilPersonil from './personil/tabs/TabProfilPersonil';
import PersonilChatDrawer from './personil/components/PersonilChatDrawer';
import TaskAcceptModal from './personil/components/TaskAcceptModal';
import ModalPenyelesaianTugas from './personil/components/ModalPenyelesaianTugas';
import ModalAksiCepat from './personil/components/ModalAksiCepat';
import { usePersonilConsole } from './personil/usePersonilConsole';
import { stopPoliceAlertAudio } from './personil/personil-helpers';

function PersonilContent(props: {
  session?: any;
  initialSection?: string;
  initialMasterData?: any;
  initialComplaints?: any[];
  initialOfficer?: any;
  initialPoliceOffices?: any[];
  initialFleetUnits?: any[];
  initialHotspots?: any[];
}) {
  const {
    activeTab,
    switchTab,
    officer,
    taktisStatus,
    setTaktisStatus,
    complaints,
    activeComplaint,
    setActiveComplaint,
    pendingAcceptTask,
    setPendingAcceptTask,
    showAcceptModal,
    setShowAcceptModal,
    isAcceptingTask,
    isPairedDevice,
    chatDrawerOpen,
    setChatDrawerOpen,
    chatComplaint,
    setChatComplaint,
    finishModalOpen,
    setFinishModalOpen,
    finishComplaint,
    isUpdatingStep,
    logbooks,
    policeOffices,
    fleetUnits,
    hotspots,
    dispatchStatuses,
    currentGps,
    loadData,
    handleOpenFinishModal,
    handleAcceptTask,
    handleUpdateStep,
    handlePresensiMasuk,
    handlePresensiPulang,
    handleLogout,
    handleQuickAction,
    quickActionModalType,
    setQuickActionModalType,
    submitQuickAction,
    activeComplaintRef,
  } = usePersonilConsole(props);

  // State giat lapangan aktif yang dipilih untuk dipantau di peta (dipersist ke sessionStorage agar tahan refresh)
  const [selectedGiat, setSelectedGiat] = React.useState<any | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem('simapres_selected_giat');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return null;
  });

  const handleSetSelectedGiat = React.useCallback((giat: any | null) => {
    setSelectedGiat(giat);
    if (typeof window !== 'undefined') {
      try {
        if (giat) {
          sessionStorage.setItem('simapres_selected_giat', JSON.stringify(giat));
        } else {
          sessionStorage.removeItem('simapres_selected_giat');
        }
      } catch {}
    }
  }, []);

  const fallbackActiveGiat = React.useMemo(() => {
    if (!Array.isArray(logbooks) || logbooks.length === 0) return null;
    return (
      logbooks.find((l: any) => {
        const type = (l.jenisAksi || l.action_type || '').toUpperCase();
        const desc = l.deskripsiKegiatan || l.activity_description || '';
        const hasComplaint = l.complaintId || l.complaint_id;
        const status = String(l.statusValidasi || l.validation_status || '').toUpperCase();
        return (
          ['PATROLI', 'SAMBANG', 'PENGAMANAN', 'TPTKP'].includes(type) ||
          desc.startsWith('[PENGAJUAN GIAT')
        ) && !hasComplaint && (status === 'BELUM_DIVALIDASI' || status === 'VALID');
      }) || null
    );
  }, [logbooks]);

  // Jika selectedGiat sudah diselesaikan di logbooks, sinkronkan agar tidak stale
  React.useEffect(() => {
    if (selectedGiat && Array.isArray(logbooks) && logbooks.length > 0) {
      const match = logbooks.find((l: any) => String(l.id) === String(selectedGiat.id));
      if (match) {
        const st = String(match.statusValidasi || match.validation_status || '').toUpperCase();
        if (st === 'SELESAI' || st === 'DITOLAK') {
          handleSetSelectedGiat(null);
        }
      }
    }
  }, [selectedGiat, logbooks, handleSetSelectedGiat]);

  const currentActiveGiat = selectedGiat || fallbackActiveGiat;

  const hasActiveGiat = Boolean(
    logbooks &&
    logbooks.some((l: any) => {
      const type = (l.jenisAksi || l.action_type || '').toUpperCase();
      const desc = l.deskripsiKegiatan || l.activity_description || '';
      const hasComplaint = l.complaintId || l.complaint_id;
      const status = String(l.statusValidasi || l.validation_status || '').toUpperCase();
      return (
        ['PATROLI', 'SAMBANG', 'PENGAMANAN', 'TPTKP'].includes(type) ||
        desc.startsWith('[PENGAJUAN GIAT')
      ) && !hasComplaint && (status === 'BELUM_DIVALIDASI' || status === 'VALID');
    })
  );

  const hasActiveMission = Boolean(
    (activeComplaint && activeComplaint.status !== 'SELESAI' && activeComplaint.status !== 'DITOLAK') ||
    hasActiveGiat
  );

  return (
    <div
      className={`text-slate-100 flex flex-col font-sans transition-colors duration-300 ${
        activeTab === 'peta'
          ? 'h-[100dvh] h-screen max-h-[100dvh] overflow-hidden'
          : 'min-h-screen'
      }`}
      style={{
        background: '#0B0D13',
      }}
    >
      {/* 1. Header Bar */}
      <PersonilHeader
        officer={officer}
        taktisStatus={taktisStatus}
        onTaktisStatusChange={setTaktisStatus}
        onOpenProfile={() => switchTab('profil')}
        activeTab={activeTab}
        onTabChange={switchTab}
        hasActiveMission={hasActiveMission}
        isPairedDevice={isPairedDevice}
      />

      {/* 2. Main Content Container (Full-body untuk tab Peta, Inset Container untuk Beranda & Profil) */}
      <main
        className={
          activeTab === 'peta'
            ? 'w-full p-0 m-0 relative flex-1 overflow-hidden h-full min-h-0'
            : 'flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 pt-4 sm:pt-5 pb-28 sm:pb-32 md:pb-12'
        }
      >
        {activeTab === 'beranda' && (
          <TabBerandaPersonil
            officer={officer}
            complaints={complaints}
            activeComplaint={activeComplaint}
            pendingAcceptTask={pendingAcceptTask}
            currentGps={currentGps}
            fleetUnits={fleetUnits}
            hotspots={hotspots}
            policeOffices={policeOffices}
            logbooks={logbooks}
            onTabChange={switchTab}
            onOpenAcceptModal={(task) => {
              setPendingAcceptTask(task);
              setShowAcceptModal(true);
            }}
            onOpenChat={(c) => {
              setChatComplaint(c);
              setChatDrawerOpen(true);
            }}
            onQuickAction={handleQuickAction}
            onOpenGiatMap={(giat) => {
              handleSetSelectedGiat(giat);
              switchTab('peta');
            }}
          />
        )}

        {activeTab === 'peta' && (
          <TabMapsPersonil
            officer={officer}
            activeComplaint={activeComplaint}
            activeGiat={currentActiveGiat}
            currentGps={currentGps}
            fleetUnits={fleetUnits}
            hotspots={hotspots}
            policeOffices={policeOffices}
            dispatchStatuses={dispatchStatuses}
            onOpenChat={(c) => {
              setChatComplaint(c);
              setChatDrawerOpen(true);
            }}
            onOpenWizard={handleOpenFinishModal}
            onUpdateStep={handleUpdateStep}
            isUpdatingStep={isUpdatingStep}
            onGiatCompleted={() => {
              handleSetSelectedGiat(null);
              loadData();
              switchTab('beranda');
            }}
          />
        )}

        {activeTab === 'profil' && (
          <TabProfilPersonil
            officer={officer}
            complaints={complaints}
            logbooks={logbooks}
            currentGps={currentGps}
            onPresensiMasuk={handlePresensiMasuk}
            onPresensiPulang={handlePresensiPulang}
            onLogout={handleLogout}
            onTabChange={switchTab}
          />
        )}
      </main>

      {/* Smooth Bottom Scrim so scrolled content smoothly fades behind dock (hanya untuk mobile tab non-peta) */}
      {activeTab !== 'peta' && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#0B0D13] via-[#0B0D13]/70 to-transparent pointer-events-none z-40" />
      )}

      {/* 3. Floating 3-Tab Bottom Pill Navigation (Beranda, Maps, Profile) */}
      <PersonilNav
        activeTab={activeTab}
        onTabChange={switchTab}
        hasActiveMission={hasActiveMission}
      />

      {/* 4. Modals & Drawers */}
      {/* Task Accept Emergency Modal */}
      <TaskAcceptModal
        isOpen={showAcceptModal}
        task={pendingAcceptTask}
        officer={officer}
        isAccepting={isAcceptingTask}
        onAccept={handleAcceptTask}
        onClose={() => {
          stopPoliceAlertAudio();
          setShowAcceptModal(false);
        }}
      />

      {/* In-App 2-Way Live Chat Drawer */}
      <PersonilChatDrawer
        isOpen={chatDrawerOpen}
        onClose={() => setChatDrawerOpen(false)}
        complaint={chatComplaint || activeComplaint}
        officer={officer}
      />

      {/* Modal Keterangan Penyelesaian Tugas Manual (Textarea) */}
      {finishModalOpen && finishComplaint && (
        <ModalPenyelesaianTugas
          isOpen={finishModalOpen}
          complaint={finishComplaint}
          officer={officer}
          currentGps={currentGps}
          onClose={() => setFinishModalOpen(false)}
          onSuccess={() => {
            setFinishModalOpen(false);
            setActiveComplaint(null);
            activeComplaintRef.current = null;
            loadData(officer.id);
          }}
        />
      )}

      {/* Modal Pengajuan Giat Lapangan (Patroli, TPTKP, Sambang, Pengamanan) */}
      <ModalAksiCepat
        isOpen={Boolean(quickActionModalType)}
        type={quickActionModalType}
        officer={officer}
        currentGps={currentGps}
        fleetUnits={fleetUnits}
        onClose={() => setQuickActionModalType(null)}
        onSubmit={submitQuickAction}
      />
    </div>
  );
}

export default function PersonilConsoleView(props: {
  session?: any;
  initialSection?: string;
  initialMasterData?: any;
  initialComplaints?: any[];
  initialOfficer?: any;
  initialPoliceOffices?: any[];
  initialFleetUnits?: any[];
  initialHotspots?: any[];
}) {
  return (
    <React.Suspense>
      <PersonilContent {...props} />
    </React.Suspense>
  );
}
