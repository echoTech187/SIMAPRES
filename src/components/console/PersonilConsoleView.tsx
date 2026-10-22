'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { ConsoleSkeleton } from './ConsoleSkeleton';
import PersonilHeader from './personil/PersonilHeader';
import PersonilNav from './personil/PersonilNav';
import TabBerandaPersonil from './personil/tabs/TabBerandaPersonil';
import TabMapsPersonil from './personil/tabs/TabMapsPersonil';
import TabProfilPersonil from './personil/tabs/TabProfilPersonil';
import PersonilChatDrawer from './personil/components/PersonilChatDrawer';
import TaskAcceptModal from './personil/components/TaskAcceptModal';
import ModalPenyelesaianTugas from './personil/components/ModalPenyelesaianTugas';

import {
  getOfficerComplaintsAction,
  fieldStepAction,
  acceptOfficerDispatchAction,
} from '@/app/actions/complaint.actions';
import {
  getOfficerLogbooksAction,
  createLogbookAction,
} from '@/app/actions/logbook.actions';
import { getHotspotsAction } from '@/app/actions/hotspot.actions';
import {
  updateDeviceTelemetryAction,
  getOfficerProfileByNrpAction,
  getPoliceOfficesAction,
  logoutAction,
} from '@/app/actions/auth.actions';
import { getPatrolFleetUnitsAction, submitOfficerPresensiAction } from '@/app/actions/fleet.actions';
import {
  getMasterResolutionLocationsAction,
  getMasterResolutionDocumentsAction,
} from '@/app/actions/master.actions';

import type { ComplaintData, OfficerProfile, PersonilTab } from './personil/types';
import {
  hasOfficerAcceptedTask,
  isTaskPendingAcceptance,
  computeWizardStepFromComplaint,
} from './personil/types';

function parsePersonilTab(section?: string): PersonilTab {
  if (!section) return 'beranda';
  const clean = section.toLowerCase().trim();
  switch (clean) {
    case 'peta':
    case 'maps':
      return 'peta';
    case 'profil':
    case 'profile':
    case 'kinerja':
    case 'laporan':
      return 'profil';
    case 'beranda':
    default:
      return 'beranda';
  }
}

function personilTabToSlug(tabId: PersonilTab): string {
  switch (tabId) {
    case 'peta':
      return 'peta';
    case 'profil':
      return 'profil';
    case 'beranda':
    default:
      return '';
  }
}

// Audio alert synthesizer for emergency dispatches
function playPoliceAlertAudio() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') ctx.resume();

    const playTone = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      gain.gain.setValueAtTime(0.32, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration);
    };

    playTone(880, 0, 0.18);
    playTone(1174.66, 0.18, 0.28);
    playTone(880, 0.5, 0.18);
    playTone(1318.51, 0.68, 0.45);
  } catch (_) {}
}

// Client-side module cache for static master data to eliminate duplicate network requests
let cachedPoliceOffices: any[] | null = null;
let cachedFleetUnits: any[] | null = null;
let cachedHotspots: any[] | null = null;
let cachedResolutionLocations: any[] | null = null;
let cachedResolutionDocuments: any[] | null = null;
let isMasterDataFetching = false;

function PersonilContent({
  session,
  initialSection = 'beranda',
  initialMasterData,
  initialComplaints,
  initialOfficer,
  initialPoliceOffices,
  initialFleetUnits,
  initialHotspots,
}: {
  session?: any;
  initialSection?: string;
  initialMasterData?: any;
  initialComplaints?: any[];
  initialOfficer?: any;
  initialPoliceOffices?: any[];
  initialFleetUnits?: any[];
  initialHotspots?: any[];
}) {
  // Pre-seed cache dari server-rendered props jika ada
  if (initialPoliceOffices?.length && !cachedPoliceOffices) cachedPoliceOffices = initialPoliceOffices;
  if (initialFleetUnits?.length && !cachedFleetUnits) cachedFleetUnits = initialFleetUnits;
  if (initialHotspots?.length && !cachedHotspots) cachedHotspots = initialHotspots;

  const nrpParam = session?.identifier || initialOfficer?.nrp || '92031145';

  // Navigation tab state (Beranda, Maps, Profile)
  const [activeTab, setActiveTab] = useState<PersonilTab>(() => {
    if (typeof window !== 'undefined') {
      const parts = window.location.pathname.split('/').filter(Boolean);
      const last = parts[parts.length - 1];
      if (parts[0] === 'console' && parts.length > 1) {
        return parsePersonilTab(last);
      }
    }
    return parsePersonilTab(initialSection);
  });

  const activeTabRef = useRef<PersonilTab>(activeTab);
  activeTabRef.current = activeTab;

  const switchTab = (tabId: PersonilTab) => {
    setActiveTab(tabId);
    activeTabRef.current = tabId;
    const slug = personilTabToSlug(tabId);
    const targetUrl = slug ? `/console/${slug}` : '/console';
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', targetUrl);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Officer Profile
  const [officer, setOfficer] = useState<OfficerProfile>(() => {
    if (initialOfficer) {
      return {
        id: String(initialOfficer.id || session?.userId || '3'),
        nrp: initialOfficer.nrp || nrpParam,
        fullName: initialOfficer.fullName || session?.fullName || 'Petugas Lapangan',
        pangkat: initialOfficer.pangkat || session?.rankPangkat || 'BRIPKA',
        jabatan: initialOfficer.jabatan || session?.title || 'Bintara Unit Samapta',
        satuan: initialOfficer.satuan || 'Satuan Samapta',
        unit_id: initialOfficer.unit_id || null,
        unitId: initialOfficer.unitId || '',
        kendaraan: initialOfficer.kendaraan || 'Ranmor Patroli R-4',
        avatar: initialOfficer.avatar || session?.avatar_url || null,
        kpi: initialOfficer.kpi ?? 96,
        deviceId: initialOfficer.deviceId || null,
        stationId: initialOfficer.stationId || null,
        stationName: initialOfficer.stationName || 'Polres Metro Jakarta',
        stationLat: initialOfficer.stationLat ?? -6.229728,
        stationLng: initialOfficer.stationLng ?? 106.807447,
        stationRadius: initialOfficer.stationRadius ?? 1000,
        currentGpsLat: initialOfficer.currentGpsLat ?? null,
        currentGpsLng: initialOfficer.currentGpsLng ?? null,
        dutyStatus: initialOfficer.dutyStatus || initialOfficer.duty_status || 'DINAS_PATROLI',
      };
    }
    return {
      id: session?.userId ? String(session.userId) : '3',
      nrp: nrpParam,
      fullName: session?.fullName || 'Petugas Lapangan',
      pangkat: session?.rankPangkat || 'BRIPKA',
      jabatan: session?.title || 'Bintara Unit Samapta',
      satuan: 'Satuan Samapta',
      kendaraan: 'Ranmor Patroli R-4',
      avatar: session?.avatar_url || null,
      kpi: 96,
      stationId: null,
      stationName: 'Polres Metro Jakarta',
      stationLat: -6.229728,
      stationLng: 106.807447,
      stationRadius: 1000,
      currentGpsLat: null,
      currentGpsLng: null,
      dutyStatus: session?.dutyStatus || 'DINAS_PATROLI',
    };
  });

  const [taktisStatus, setTaktisStatus] = useState<string>('siaga');

  // Complaints & Active Emergency
  const [complaints, setComplaints] = useState<ComplaintData[]>(() => initialComplaints || []);

  const initialActive = useMemo(() => {
    if (!initialComplaints || initialComplaints.length === 0) return null;
    return (
      initialComplaints.find(
        (c: any) =>
          hasOfficerAcceptedTask(c, officer.nrp, officer.id) &&
          c.status !== 'SELESAI' &&
          c.status !== 'DITOLAK' &&
          (c.status === 'MENUJU_TKP' ||
            c.status === 'PENANGANAN_TKP' ||
            c.status === 'TIBA_DI_TKP' ||
            c.status === 'SEDANG_DITANGANI' ||
            c.status === 'DIPROSES' ||
            c.status === 'MENUNGGU_PENGESAHAN')
      ) || null
    );
  }, []);

  const [activeComplaint, setActiveComplaint] = useState<ComplaintData | null>(() => initialActive);
  const activeComplaintRef = useRef<ComplaintData | null>(initialActive);
  activeComplaintRef.current = activeComplaint;

  // Pending ticket acceptance (Modal prompt)
  const [pendingAcceptTask, setPendingAcceptTask] = useState<ComplaintData | null>(null);
  const [showAcceptModal, setShowAcceptModal] = useState<boolean>(false);
  const [isAcceptingTask, setIsAcceptingTask] = useState<boolean>(false);
  const promptedTaskIdsRef = useRef<Set<string>>(new Set());

  // Chat & Wizard Modal state
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const [chatComplaint, setChatComplaint] = useState<ComplaintData | null>(null);

  const [wizardModalOpen, setWizardModalOpen] = useState(false);
  const [wizardComplaint, setWizardComplaint] = useState<ComplaintData | null>(null);
  const [isUpdatingStep, setIsUpdatingStep] = useState(false);

  // Database Static Master Data & Lists (Menggunakan Module Cache & Initial Server Props)
  const [logbooks, setLogbooks] = useState<any[]>([]);
  const [policeOffices, setPoliceOffices] = useState<any[]>(() => initialPoliceOffices?.length ? initialPoliceOffices : (cachedPoliceOffices || []));
  const [fleetUnits, setFleetUnits] = useState<any[]>(() => initialFleetUnits?.length ? initialFleetUnits : (cachedFleetUnits || []));
  const [hotspots, setHotspots] = useState<any[]>(() => initialHotspots?.length ? initialHotspots : (cachedHotspots || []));
  const [resolutionLocations, setResolutionLocations] = useState<any[]>(() => cachedResolutionLocations || []);
  const [resolutionDocuments, setResolutionDocuments] = useState<any[]>(() => cachedResolutionDocuments || []);

  // GPS Telemetry
  const [currentGps, setCurrentGps] = useState<{ lat: number; lng: number }>({
    lat: -6.229728,
    lng: 106.807447,
  });

  const isPollingRef = useRef<boolean>(false);

  // 1. Data Loader
  const loadData = async (targetOfficerId?: string, preferredComplaintId?: string | number) => {
    if (isPollingRef.current) return;
    isPollingRef.current = true;
    try {
      const activeNrp = nrpParam || officer.nrp || '92031145';
      const activeOfficerId = targetOfficerId || officer.id || '3';

      // Di tab Peta, hanya fetch complaints agar hemat bandwidth & tidak spam request logbook
      const shouldFetchLogbooks = activeTabRef.current !== 'peta';

      const [cRes, lRes] = await Promise.all([
        getOfficerComplaintsAction(activeNrp),
        shouldFetchLogbooks ? getOfficerLogbooksAction(String(activeOfficerId)) : Promise.resolve(null),
      ]);

      if (cRes?.success && cRes?.data) {
        setComplaints(cRes.data);

        // Check if there is a pending dispatch needing acceptance (only if on duty)
        const isOfficerOnDuty = officer.dutyStatus !== 'LEPAS_DINAS';
        const pending = isOfficerOnDuty
          ? cRes.data.find((c: any) =>
              isTaskPendingAcceptance(c, activeNrp, activeOfficerId, officer.unit_id)
            )
          : null;

        if (pending && isOfficerOnDuty) {
          setPendingAcceptTask(pending);
          const taskId = String(pending.nomorTiket || pending.id);
          if (!promptedTaskIdsRef.current.has(taskId)) {
            promptedTaskIdsRef.current.add(taskId);
            setShowAcceptModal(true);
            playPoliceAlertAudio();
          }
        } else {
          setPendingAcceptTask(null);
          if (!isOfficerOnDuty) {
            setShowAcceptModal(false);
          }
        }

        // Active ongoing complaint (Hanya tiket aktif yang belum SELESAI / DITOLAK)
        const targetId =
          preferredComplaintId ||
          activeComplaintRef.current?.id ||
          activeComplaintRef.current?.nomorTiket;

        let active = targetId
          ? cRes.data.find(
              (c: any) =>
                (String(c.id) === String(targetId) || String(c.nomorTiket) === String(targetId)) &&
                hasOfficerAcceptedTask(c, activeNrp, activeOfficerId) &&
                c.status !== 'SELESAI' &&
                c.status !== 'DITOLAK'
            )
          : null;

        if (!active) {
          active = cRes.data.find(
            (c: any) =>
              hasOfficerAcceptedTask(c, activeNrp, activeOfficerId) &&
              c.status !== 'SELESAI' &&
              c.status !== 'DITOLAK' &&
              (c.status === 'MENUJU_TKP' ||
                c.status === 'PENANGANAN_TKP' ||
                c.status === 'TIBA_DI_TKP' ||
                c.status === 'SEDANG_DITANGANI' ||
                c.status === 'DIPROSES' ||
                c.status === 'MENUNGGU_PENGESAHAN')
          );
        }

        setActiveComplaint(active || null);
        activeComplaintRef.current = active || null;
      }

      if (lRes?.success && lRes?.data) {
        setLogbooks(lRes.data);
      }
    } catch (e) {
      console.warn('Load dynamic personil data error:', e);
    } finally {
      isPollingRef.current = false;
    }
  };

  // Lazy fetch master data penyelesaian hanya saat personel membuka modal wizard
  const handleOpenWizard = (c: ComplaintData) => {
    setWizardComplaint(c);
    setWizardModalOpen(true);

    if (!cachedResolutionLocations || !cachedResolutionDocuments) {
      Promise.all([
        !cachedResolutionLocations ? getMasterResolutionLocationsAction() : Promise.resolve(null),
        !cachedResolutionDocuments ? getMasterResolutionDocumentsAction() : Promise.resolve(null),
      ]).then(([locRes, docRes]) => {
        if (locRes?.success && locRes?.data) {
          cachedResolutionLocations = locRes.data;
          setResolutionLocations(locRes.data);
        }
        if (docRes?.success && docRes?.data) {
          cachedResolutionDocuments = docRes.data;
          setResolutionDocuments(docRes.data);
        }
      });
    }
  };

  // 2. Initial static master data fetch (menggunakan module cache & initial props)
  useEffect(() => {
    const needsPoliceOffices = !cachedPoliceOffices && (!initialPoliceOffices || initialPoliceOffices.length === 0);
    const needsFleetUnits = !cachedFleetUnits && (!initialFleetUnits || initialFleetUnits.length === 0);
    const needsHotspots = !cachedHotspots && (!initialHotspots || initialHotspots.length === 0);

    if (needsPoliceOffices || needsFleetUnits || needsHotspots) {
      if (!isMasterDataFetching) {
        isMasterDataFetching = true;
        Promise.all([
          needsPoliceOffices ? getPoliceOfficesAction() : Promise.resolve(null),
          needsFleetUnits ? getPatrolFleetUnitsAction() : Promise.resolve(null),
          needsHotspots ? getHotspotsAction() : Promise.resolve(null),
        ]).then(([poRes, fleetRes, hotRes]) => {
          if (poRes?.success && poRes?.data) {
            cachedPoliceOffices = poRes.data;
            setPoliceOffices(poRes.data);
          }
          if (fleetRes?.success && fleetRes?.data) {
            cachedFleetUnits = fleetRes.data;
            setFleetUnits(fleetRes.data);
          }
          if (hotRes?.success && hotRes?.data) {
            cachedHotspots = hotRes.data;
            setHotspots(hotRes.data);
          }
        }).finally(() => {
          isMasterDataFetching = false;
        });
      }
    }

    // Geolocation watching
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCurrentGps({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {},
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }

    // Polling interval (every 30 seconds - hanya ketika tab aktif)
    const pollInterval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      loadData();
    }, 30000);

    return () => clearInterval(pollInterval);
  }, []);

  // Accept Task Action (First-Come, First-Served)
  const handleAcceptTask = async (task: ComplaintData) => {
    if (!task) return;
    setIsAcceptingTask(true);
    try {
      const res = await acceptOfficerDispatchAction({
        complaintId: String(task.id),
        officerNrp: officer.nrp,
        officerNama: officer.fullName,
        officerPangkat: officer.pangkat,
      });

      if (res?.success) {
        alert(
          `✓ Penugasan #${task.nomorTiket || task.id} BERHASIL DITERIMA!\n\nStatus kini: SEDANG DITANGANI.\nMembuka Peta Navigasi Rute TKP...`
        );
        setShowAcceptModal(false);
        setPendingAcceptTask(null);

        const updated = { ...task, status: 'SEDANG_DITANGANI' };
        setActiveComplaint(updated);
        activeComplaintRef.current = updated;

        await loadData(officer.id, task.id);
        switchTab('peta');
      } else {
        alert(res?.error || 'Gagal menerima penugasan.');
      }
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan jaringan.');
    } finally {
      setIsAcceptingTask(false);
    }
  };

  // Update Field Step Action (Meluncur, Tiba TKP, Tindakan TKP, Selesai)
  const handleUpdateStep = async (stepKey: 'meluncur' | 'tiba_tkp' | 'tindakan_tkp' | 'selesai') => {
    if (!activeComplaint) return;
    setIsUpdatingStep(true);
    try {
      const res = await fieldStepAction({
        complaintId: String(activeComplaint.id),
        step: stepKey,
        officerId: officer.id || '3',
        lat: currentGps.lat,
        lng: currentGps.lng,
      });

      if (res?.success) {
        const statusMap = {
          meluncur: 'MENUJU_TKP',
          tiba_tkp: 'TIBA_DI_TKP',
          tindakan_tkp: 'PENANGANAN_TKP',
          selesai: 'SELESAI',
        };
        const updatedStatus = statusMap[stepKey] || activeComplaint.status;
        alert(`✓ Status tugas #${activeComplaint.nomorTiket} berhasil diperbarui menjadi: ${updatedStatus}`);

        if (stepKey === 'selesai' || updatedStatus === 'SELESAI') {
          setActiveComplaint(null);
          activeComplaintRef.current = null;
          await loadData(officer.id);
        } else {
          setActiveComplaint((prev) => (prev ? { ...prev, status: updatedStatus } : null));
          await loadData(officer.id, activeComplaint.id);
        }
      } else {
        alert(res?.error || 'Gagal memperbarui status tugas.');
      }
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsUpdatingStep(false);
    }
  };

  // Presensi / Status Dinas
  const handlePresensiMasuk = async () => {
    try {
      const res = await submitOfficerPresensiAction({
        officerId: officer.id || '3',
        type: 'MASUK',
        lat: currentGps.lat,
        lng: currentGps.lng,
      });
      if (res.success) {
        setOfficer((prev) => ({ ...prev, dutyStatus: 'DINAS_PATROLI' }));
        loadData(officer.id);
      } else {
        alert(res.error || 'Gagal mengaktifkan status dinas.');
      }
    } catch (e: any) {
      alert(e.message || 'Gagal mengaktifkan status dinas.');
    }
  };

  const handlePresensiPulang = async () => {
    try {
      const res = await submitOfficerPresensiAction({
        officerId: officer.id || '3',
        type: 'PULANG',
        lat: currentGps.lat,
        lng: currentGps.lng,
      });
      if (res.success) {
        setOfficer((prev) => ({ ...prev, dutyStatus: 'LEPAS_DINAS' }));
        setShowAcceptModal(false);
        setPendingAcceptTask(null);
      } else {
        alert(res.error || 'Gagal melepas status dinas.');
      }
    } catch (e: any) {
      alert(e.message || 'Gagal melepas status dinas.');
    }
  };

  // Logout Action
  const handleLogout = async () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('simapres_active_user');
    }
    await logoutAction();
    window.location.href = '/?alert=logged_out';
  };

  // Quick Action from Beranda
  const handleQuickAction = async (type: 'PATROLI' | 'TPTKP' | 'SAMBANG' | 'PENGAMANAN') => {
    const desc = prompt(`Masukkan uraian ringkas kegiatan ${type}:`, `Laporan ${type} oleh ${officer.fullName}`);
    if (!desc) return;

    try {
      const nowTime = new Date().toTimeString().slice(0, 5);
      const res = await createLogbookAction({
        officerId: officer.id,
        complaintId: activeComplaint ? String(activeComplaint.id) : undefined,
        jenisAksi: type,
        lokasiKlaimAlamat: officer.stationName ? officer.stationName : '',
        lokasiKlaimLat: currentGps.lat,
        lokasiKlaimLng: currentGps.lng,
        lokasiGpsAktualLat: currentGps.lat,
        lokasiGpsAktualLng: currentGps.lng,
        jamMulai: nowTime,
        jamSelesai: nowTime,
        deskripsiKegiatan: desc,
      });

      if (res.success) {
        alert(`✓ Log kegiatan ${type} berhasil dikirim ke server & antrean Pawas!`);
        await loadData(officer.id);
      } else {
        alert(res.error || 'Gagal mencatat log.');
      }
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan.');
    }
  };

  // Kunci scroll dokumen saat membuka tab Peta agar benar-benar full-screen & tidak bisa di-scroll
  useEffect(() => {
    if (activeTab === 'peta') {
      const origBodyOverflow = document.body.style.overflow;
      const origHtmlOverflow = document.documentElement.style.overflow;
      const origBodyHeight = document.body.style.height;
      const origHtmlHeight = document.documentElement.style.height;

      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      document.body.style.height = '100%';
      document.documentElement.style.height = '100%';

      return () => {
        document.body.style.overflow = origBodyOverflow;
        document.documentElement.style.overflow = origHtmlOverflow;
        document.body.style.height = origBodyHeight;
        document.documentElement.style.height = origHtmlHeight;
      };
    }
  }, [activeTab]);

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
        hasActiveMission={Boolean(activeComplaint)}
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
          />
        )}

        {activeTab === 'peta' && (
          <TabMapsPersonil
            officer={officer}
            activeComplaint={activeComplaint}
            currentGps={currentGps}
            fleetUnits={fleetUnits}
            hotspots={hotspots}
            policeOffices={policeOffices}
            onOpenChat={(c) => {
              setChatComplaint(c);
              setChatDrawerOpen(true);
            }}
            onOpenWizard={handleOpenWizard}
            onUpdateStep={handleUpdateStep}
            isUpdatingStep={isUpdatingStep}
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
        hasActiveMission={Boolean(
          activeComplaint &&
            activeComplaint.status !== 'SELESAI' &&
            activeComplaint.status !== 'DITOLAK'
        )}
      />

      {/* 4. Modals & Drawers */}
      {/* Task Accept Emergency Modal */}
      <TaskAcceptModal
        isOpen={showAcceptModal}
        task={pendingAcceptTask}
        officer={officer}
        isAccepting={isAcceptingTask}
        onAccept={handleAcceptTask}
        onClose={() => setShowAcceptModal(false)}
      />

      {/* In-App 2-Way Live Chat Drawer */}
      <PersonilChatDrawer
        isOpen={chatDrawerOpen}
        onClose={() => setChatDrawerOpen(false)}
        complaint={chatComplaint || activeComplaint}
        officer={officer}
      />

      {/* Modal Keterangan Penyelesaian Tugas Manual (Textarea) */}
      {wizardModalOpen && wizardComplaint && (
        <ModalPenyelesaianTugas
          isOpen={wizardModalOpen}
          complaint={wizardComplaint}
          officer={officer}
          currentGps={currentGps}
          onClose={() => setWizardModalOpen(false)}
          onSuccess={() => {
            setWizardModalOpen(false);
            setActiveComplaint(null);
            activeComplaintRef.current = null;
            loadData(officer.id);
          }}
        />
      )}
    </div>
  );
}

export default function PersonilConsoleView({
  session,
  initialSection = 'beranda',
  initialMasterData,
  initialComplaints,
  initialOfficer,
  initialPoliceOffices,
  initialFleetUnits,
  initialHotspots,
}: {
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
    <React.Suspense fallback={<ConsoleSkeleton role="PERSONIL" />}>
      <PersonilContent
        session={session}
        initialSection={initialSection}
        initialMasterData={initialMasterData}
        initialComplaints={initialComplaints}
        initialOfficer={initialOfficer}
        initialPoliceOffices={initialPoliceOffices}
        initialFleetUnits={initialFleetUnits}
        initialHotspots={initialHotspots}
      />
    </React.Suspense>
  );
}
