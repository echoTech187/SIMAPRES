'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  getMasterFilterOptionsAction,
} from '@/app/actions/complaint.actions';
import {
  getOfficerLogbooksAction,
  createLogbookAction,
} from '@/app/actions/logbook.actions';
import { getHotspotsAction } from '@/app/actions/hotspot.actions';
import {
  getPoliceOfficesAction,
  logoutAction,
  updateDeviceTelemetryAction,
} from '@/app/actions/auth.actions';
import { getPatrolFleetUnitsAction, submitOfficerPresensiAction } from '@/app/actions/fleet.actions';
import {
  getMasterResolutionLocationsAction,
  getMasterResolutionDocumentsAction,
} from '@/app/actions/master.actions';

import type { ComplaintData, OfficerProfile, PersonilTab, DispatchStepAction } from './personil/types';
import {
  hasOfficerAcceptedTask,
  isTaskPendingAcceptance,
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

// Audio alert sirine patwal MP3 looping untuk penugasan darurat
let personilAlertAudioInstance: HTMLAudioElement | null = null;

function playPoliceAlertAudio() {
  try {
    if (typeof window === 'undefined') return;
    if (!personilAlertAudioInstance) {
      personilAlertAudioInstance = new Audio('/audio/nada_dering_suara_mobil_patwal_viral_tiktok.mp3');
      personilAlertAudioInstance.loop = true;
      personilAlertAudioInstance.preload = 'auto';
    }
    personilAlertAudioInstance.currentTime = 0;
    personilAlertAudioInstance.play().catch(() => {});
  } catch (_) {}
}

function stopPoliceAlertAudio() {
  try {
    if (personilAlertAudioInstance) {
      personilAlertAudioInstance.pause();
      personilAlertAudioInstance.currentTime = 0;
    }
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

  const nrpParam = session?.identifier || initialOfficer?.nrp;

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
        id: initialOfficer.id || session?.userId,
        nrp: initialOfficer.nrp || nrpParam,
        fullName: initialOfficer.fullName || session?.fullName,
        pangkat: initialOfficer.pangkat || session?.rankPangkat,
        jabatan: initialOfficer.jabatan || session?.title,
        satuan: initialOfficer.satuan || session?.unitName,
        unit_id: initialOfficer.unit_id || session?.unit_id,
        unitId: initialOfficer.unitId || session?.unitId,
        kendaraan: initialOfficer.kendaraan || session?.vehicleName,
        avatar: initialOfficer.avatar || session?.avatar_url,
        kpi: initialOfficer.kpi || session?.kpi,
        deviceId: initialOfficer.deviceId || session?.deviceId,
        stationId: initialOfficer.stationId || session?.stationId,
        stationName: initialOfficer.stationName || session?.stationName,
        stationLat: initialOfficer.stationLat || session?.stationLat,
        stationLng: initialOfficer.stationLng || session?.stationLng,
        stationRadius: initialOfficer.stationRadius || session?.stationRadius,
        currentGpsLat: initialOfficer.currentGpsLat || session?.currentGpsLat,
        currentGpsLng: initialOfficer.currentGpsLng || session?.currentGpsLng,
        dutyStatus: initialOfficer.dutyStatus || session?.dutyStatus,
      };
    }
    return {
      id: session?.userId,
      nrp: session?.nrp,
      fullName: session?.fullName,
      pangkat: session?.rankPangkat,
      jabatan: session?.title,
      satuan: session?.unitName,
      kendaraan: session?.vehicleName,
      avatar: session?.avatar_url,
      kpi: session?.kpi,
      stationId: session?.stationId,
      stationName: session?.stationName,
      stationLat: session?.stationLat,
      stationLng: session?.stationLng,
      stationRadius: session?.stationRadius,
      currentGpsLat: session?.currentGpsLat,
      currentGpsLng: session?.currentGpsLng,
      dutyStatus: session?.dutyStatus,
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
          c.status !== 'DITOLAK'
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

  // Deteksi Perangkat Fisik Terdaftar (Hanya HP yang telah diikat scan QR secara sukses)
  const [isPairedDevice, setIsPairedDevice] = useState<boolean>(false);
  const isPairedDeviceRef = useRef<boolean>(false);
  isPairedDeviceRef.current = isPairedDevice;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const localDevId = localStorage.getItem('simapres_hardware_device_id');
      const isMatched = Boolean(
        localDevId &&
        officer.deviceId &&
        localDevId.trim().toUpperCase() === officer.deviceId.trim().toUpperCase()
      );
      setIsPairedDevice(isMatched);
      isPairedDeviceRef.current = isMatched;
    }
  }, [officer.deviceId]);

  // Chat & Modal Penyelesaian Tugas
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const [chatComplaint, setChatComplaint] = useState<ComplaintData | null>(null);

  const [finishModalOpen, setFinishModalOpen] = useState(false);
  const [finishComplaint, setFinishComplaint] = useState<ComplaintData | null>(null);
  const [isUpdatingStep, setIsUpdatingStep] = useState(false);

  // Database Static Master Data & Lists (Menggunakan Module Cache & Initial Server Props)
  const [logbooks, setLogbooks] = useState<any[]>([]);
  const [policeOffices, setPoliceOffices] = useState<any[]>(() => initialPoliceOffices?.length ? initialPoliceOffices : (cachedPoliceOffices || []));
  const [fleetUnits, setFleetUnits] = useState<any[]>(() => initialFleetUnits?.length ? initialFleetUnits : (cachedFleetUnits || []));
  const [hotspots, setHotspots] = useState<any[]>(() => initialHotspots?.length ? initialHotspots : (cachedHotspots || []));
  const [resolutionLocations, setResolutionLocations] = useState<any[]>(() => cachedResolutionLocations || []);
  const [resolutionDocuments, setResolutionDocuments] = useState<any[]>(() => cachedResolutionDocuments || []);
  const [dispatchStatuses, setDispatchStatuses] = useState<any[]>(() => initialMasterData?.dispatchStatuses || []);

  // GPS Telemetry
  const [currentGps, setCurrentGps] = useState<{ lat: number; lng: number }>({
    lat: -6.229728,
    lng: 106.807447,
  });

  const isPollingRef = useRef<boolean>(false);
  const lastComplaintsHashRef = useRef<string>('');

  // 1. Data Loader
  const loadData = async (targetOfficerId?: string, preferredComplaintId?: string | number) => {
    if (isPollingRef.current) return;
    isPollingRef.current = true;
    try {
      const activeNrp = nrpParam || officer.nrp;
      const activeOfficerId = targetOfficerId || officer.id;

      // Di tab Peta, hanya fetch complaints agar hemat bandwidth & tidak spam request logbook
      const shouldFetchLogbooks = activeTabRef.current !== 'peta';

      const [cRes, lRes] = await Promise.all([
        getOfficerComplaintsAction(activeNrp),
        shouldFetchLogbooks ? getOfficerLogbooksAction(String(activeOfficerId)) : Promise.resolve(null),
      ]);

      if (cRes?.success && cRes?.data) {
        // Cek apakah data komplain benar-benar berubah sebelum memicu re-render
        const currentHash = JSON.stringify(cRes.data.map((c: any) => [
          c.id,
          c.status,
          c.tahap,
          c.dispatches?.length,
          c.dispatches?.map((d: any) => [d.id, d.officer_id, d.crew_partner_name, d.dispatch_status]),
        ]));

        if (currentHash !== lastComplaintsHashRef.current || preferredComplaintId) {
          lastComplaintsHashRef.current = currentHash;
          setComplaints(cRes.data);

          // Check if there is a pending dispatch needing acceptance
          const pending = cRes.data.find((c: any) =>
            isTaskPendingAcceptance(c, activeNrp, activeOfficerId, officer.unit_id)
          ) || null;

          // PENTING: Hanya akun dengan role PERSONIL dan menggunakan HP lapangan terdaftar (hasil scan QR)
          // yang berhak memicu popup otomatis panggilan tugas darurat dengan sirine audio.
          // Pada tampilan Laptop / Desktop, hero banner tetap ditampilkan agar petugas dapat mengonfirmasi.
          const isUserPersonilRole = session?.role ? session.role.toUpperCase() === 'PERSONIL' : false;
          const isOfficerOnDuty = officer.dutyStatus !== 'LEPAS_DINAS';

          if (pending) {
            setPendingAcceptTask(pending);
            if (isOfficerOnDuty && isPairedDeviceRef.current && isUserPersonilRole) {
              const taskId = String(pending.nomorTiket || pending.id);
              if (!promptedTaskIdsRef.current.has(taskId)) {
                promptedTaskIdsRef.current.add(taskId);
                setShowAcceptModal(true);
                playPoliceAlertAudio();
              }
            }
          } else {
            stopPoliceAlertAudio();
            setPendingAcceptTask(null);
            setShowAcceptModal(false);
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
                c.status !== 'DITOLAK'
            );
          }

          setActiveComplaint(active || null);
          activeComplaintRef.current = active || null;
        }
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

  // Lazy fetch master data penyelesaian saat personel membuka modal penyelesaian tugas
  const handleOpenFinishModal = (c: ComplaintData) => {
    setFinishComplaint(c);
    setFinishModalOpen(true);

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

    if (!dispatchStatuses.length) {
      getMasterFilterOptionsAction().then((mRes) => {
        if (mRes?.success && mRes?.data?.dispatchStatuses) {
          setDispatchStatuses(mRes.data.dispatchStatuses);
        }
      });
    }

    // Geolocation watching (Realtime telemetri dinamis untuk patroli lapangan nyata)
    let watchId: number | null = null;
    let lastTelemetryTime = 0;

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      // 1. Dapatkan posisi awal seketika
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setCurrentGps({ lat, lng });
          updateDeviceTelemetryAction({
            nrp: officer.nrp,
            lat,
            lng,
          }).catch(() => {});
        },
        () => {},
        { enableHighAccuracy: true, timeout: 15000 }
      );

      // 2. Pantau pergerakan dinamis secara kontinu saat personil berkendara di lapangan
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setCurrentGps((prev) => {
            if (Math.abs(prev.lat - lat) < 0.00001 && Math.abs(prev.lng - lng) < 0.00001) {
              return prev;
            }
            return { lat, lng };
          });

          // Kirim heartbeat GPS ke server setiap 8 detik agar Command Center (Pawas) & Warga melihat mobil bergerak riil
          const now = Date.now();
          if (now - lastTelemetryTime > 8000) {
            lastTelemetryTime = now;
            updateDeviceTelemetryAction({
              nrp: officer.nrp,
              lat,
              lng,
            }).catch(() => {});
          }
        },
        (err) => {
          console.warn('Geolocation continuous tracking notice:', err);
        },
        { enableHighAccuracy: true, maximumAge: 3000, timeout: 20000 }
      );
    }

    // Panggil loadData() seketika pada awal mount
    loadData();

    // Deteksi saat layar HP menyala atau tab peramban kembali aktif / fokus (dibatasi minimal 15 detik jeda)
    let lastWakeLoadTime = Date.now();
    const handleWakeOrFocus = () => {
      const now = Date.now();
      if (now - lastWakeLoadTime < 15000) return;
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        lastWakeLoadTime = now;
        loadData();
      }
    };
    document.addEventListener('visibilitychange', handleWakeOrFocus);
    window.addEventListener('focus', handleWakeOrFocus);

    // Polling interval background siaga (setiap 12 detik, stabil & hemat resource)
    const pollInterval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      loadData();
    }, 12000);

    return () => {
      if (watchId !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
      clearInterval(pollInterval);
      document.removeEventListener('visibilitychange', handleWakeOrFocus);
      window.removeEventListener('focus', handleWakeOrFocus);
    };
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
        lat: currentGps?.lat,
        lng: currentGps?.lng,
      });

      if (res?.success) {
        stopPoliceAlertAudio();
        alert(
          `✓ Penugasan #${task.nomorTiket || task.id} BERHASIL DITERIMA!\n\nStatus kini: DIPROSES.\nMembuka Peta Navigasi Rute TKP...`
        );
        setShowAcceptModal(false);
        setPendingAcceptTask(null);

        const updated = { ...task, status: 'DIPROSES' };
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

  // Update Field Step Action (Meluncur / DEPARTED, Tiba TKP / ARRIVED, Selesai / COMPLETED)
  const handleUpdateStep = async (stepKey: DispatchStepAction) => {
    if (!activeComplaint) return;
    setIsUpdatingStep(true);
    try {
      const res = await fieldStepAction({
        complaintId: String(activeComplaint.id),
        step: stepKey,
        officerId: officer.id,
        lat: currentGps.lat,
        lng: currentGps.lng,
      });

      if (res?.success) {
        alert(`✓ Tahap penanganan #${activeComplaint.nomorTiket} berhasil diperbarui.`);

        if (stepKey === 'COMPLETED') {
          setActiveComplaint(null);
          activeComplaintRef.current = null;
          isPollingRef.current = false;
          await loadData(officer.id);
        } else {
          if (res.data) {
            setActiveComplaint(res.data as any);
            activeComplaintRef.current = res.data as any;
          }
          isPollingRef.current = false;
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
        officerId: officer.id,
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
        officerId: officer.id,
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
            dispatchStatuses={dispatchStatuses}
            onOpenChat={(c) => {
              setChatComplaint(c);
              setChatDrawerOpen(true);
            }}
            onOpenWizard={handleOpenFinishModal}
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
      {session?.role === 'PERSONIL' && (
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
      )}

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
    <React.Suspense>
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
