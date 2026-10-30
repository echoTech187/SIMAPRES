'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { ComplaintData, OfficerProfile, PersonilTab, DispatchStepAction } from './types';
import { hasOfficerAcceptedTask, isTaskPendingAcceptance } from './types';
import { parsePersonilTab, personilTabToSlug, playPoliceAlertAudio, stopPoliceAlertAudio } from './personil-helpers';
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
import { useConsoleEventSource } from '@/hooks/useConsoleEventSource';
import { toast } from '@/components/ui/Toast';
import type { PengajuanGiatData } from './components/ModalAksiCepat';

// Client-side module cache for static master data
let cachedPoliceOffices: any[] | null = null;
let cachedFleetUnits: any[] | null = null;
let cachedHotspots: any[] | null = null;
let cachedResolutionLocations: any[] | null = null;
let cachedResolutionDocuments: any[] | null = null;
let isMasterDataFetching = false;

interface UsePersonilConsoleProps {
  session?: any;
  initialSection?: string;
  initialMasterData?: any;
  initialComplaints?: any[];
  initialOfficer?: any;
  initialLogbooks?: any[];
  initialPoliceOffices?: any[];
  initialFleetUnits?: any[];
  initialHotspots?: any[];
}

export function usePersonilConsole({
  session,
  initialSection = 'beranda',
  initialMasterData,
  initialComplaints,
  initialOfficer,
  initialLogbooks,
  initialPoliceOffices,
  initialFleetUnits,
  initialHotspots,
}: UsePersonilConsoleProps) {
  // Pre-seed cache dari server-rendered props jika ada
  if (initialPoliceOffices?.length && !cachedPoliceOffices) cachedPoliceOffices = initialPoliceOffices;
  if (initialFleetUnits?.length && !cachedFleetUnits) cachedFleetUnits = initialFleetUnits;
  if (initialHotspots?.length && !cachedHotspots) cachedHotspots = initialHotspots;

  const nrpParam = session?.identifier || initialOfficer?.nrp;

  // Navigation tab state (Beranda, Maps, Profile)
  const [activeTab, setActiveTab] = useState<PersonilTab>(() => parsePersonilTab(initialSection));

  const activeTabRef = useRef<PersonilTab>(activeTab);
  activeTabRef.current = activeTab;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const parts = window.location.pathname.split('/').filter(Boolean);
      const last = parts[parts.length - 1];
      if (parts[0] === 'console' && parts.length > 1) {
        const parsed = parsePersonilTab(last);
        if (parsed !== activeTabRef.current) {
          setActiveTab(parsed);
          activeTabRef.current = parsed;
        }
      }
    }
  }, [initialSection]);

  const switchTab = useCallback((tabId: PersonilTab) => {
    setActiveTab(tabId);
    activeTabRef.current = tabId;
    const slug = personilTabToSlug(tabId);
    const targetUrl = slug ? `/console/${slug}` : '/console';
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', targetUrl);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Officer Profile
  const [officer, setOfficer] = useState<OfficerProfile>(() => {
    if (initialOfficer) {
      return {
        id: initialOfficer.officerId || initialOfficer.id || session?.userId,
        officerId: initialOfficer.officerId || initialOfficer.id,
        userId: initialOfficer.userId || session?.userId,
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
  }, [initialComplaints, officer.nrp, officer.id]);

  const [activeComplaint, setActiveComplaint] = useState<ComplaintData | null>(() => initialActive);
  const activeComplaintRef = useRef<ComplaintData | null>(initialActive);
  activeComplaintRef.current = activeComplaint;

  // Pending ticket acceptance (Modal prompt)
  const [pendingAcceptTask, setPendingAcceptTask] = useState<ComplaintData | null>(null);
  const [showAcceptModal, setShowAcceptModal] = useState<boolean>(false);
  const [isAcceptingTask, setIsAcceptingTask] = useState<boolean>(false);
  const promptedTaskIdsRef = useRef<Set<string>>(new Set());

  // Deteksi Perangkat Fisik Terdaftar
  const [isPairedDevice, setIsPairedDevice] = useState<boolean>(false);
  const isPairedDeviceRef = useRef<boolean>(false);
  isPairedDeviceRef.current = isPairedDevice;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const localDevId = localStorage.getItem('simopmas_hardware_device_id');
      const isMatched = Boolean(
        localDevId &&
        officer.deviceId &&
        localDevId.trim().toUpperCase() === officer.deviceId.trim().toUpperCase()
      );
      setIsPairedDevice(isMatched);
      isPairedDeviceRef.current = isMatched;
    }
  }, [officer.deviceId]);

  // Pemicu otomatis Modal Popup saat tugas masuk & HP TERHUBUNG
  useEffect(() => {
    const isOnDuty = officer.dutyStatus !== 'LEPAS_DINAS';
    if (pendingAcceptTask && isPairedDevice && isOnDuty) {
      const taskId = String(pendingAcceptTask.nomorTiket || pendingAcceptTask.id);
      if (!promptedTaskIdsRef.current.has(taskId)) {
        promptedTaskIdsRef.current.add(taskId);
        setShowAcceptModal(true);
        playPoliceAlertAudio();
      }
    }
  }, [pendingAcceptTask, isPairedDevice, officer.dutyStatus]);

  // Chat & Modal Penyelesaian Tugas
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const [chatComplaint, setChatComplaint] = useState<ComplaintData | null>(null);

  const [finishModalOpen, setFinishModalOpen] = useState(false);
  const [finishComplaint, setFinishComplaint] = useState<ComplaintData | null>(null);
  const [isUpdatingStep, setIsUpdatingStep] = useState(false);

  // Modal Aksi Cepat Presisi Lapangan (Patroli, TPTKP, Sambang, Pengamanan)
  const [quickActionModalType, setQuickActionModalType] = useState<
    'PATROLI' | 'TPTKP' | 'SAMBANG' | 'PENGAMANAN' | null
  >(null);

  // Database Static Master Data & Lists
  const [logbooks, setLogbooks] = useState<any[]>(() => initialLogbooks?.length ? initialLogbooks : []);
  const [policeOffices, setPoliceOffices] = useState<any[]>(() => initialPoliceOffices?.length ? initialPoliceOffices : (cachedPoliceOffices || []));
  const [fleetUnits, setFleetUnits] = useState<any[]>(() => initialFleetUnits?.length ? initialFleetUnits : (cachedFleetUnits || []));
  const [hotspots, setHotspots] = useState<any[]>(() => initialHotspots?.length ? initialHotspots : (cachedHotspots || []));
  const [resolutionLocations, setResolutionLocations] = useState<any[]>(() => cachedResolutionLocations || []);
  const [resolutionDocuments, setResolutionDocuments] = useState<any[]>(() => cachedResolutionDocuments || []);
  const [dispatchStatuses, setDispatchStatuses] = useState<any[]>(() => initialMasterData?.dispatchStatuses || []);

  // GPS Telemetry - inisialisasi dinamis dari database Mako/Station atau telemetry terakhir di DB
  const [currentGps, setCurrentGps] = useState<{ lat: number; lng: number }>(() => {
    const lat = Number(initialOfficer?.currentGpsLat || session?.currentGpsLat || initialOfficer?.stationLat || session?.stationLat);
    const lng = Number(initialOfficer?.currentGpsLng || session?.currentGpsLng || initialOfficer?.stationLng || session?.stationLng);
    if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
      return { lat, lng };
    }
    return { lat: 0, lng: 0 };
  });

  const isPollingRef = useRef<boolean>(false);
  const lastComplaintsHashRef = useRef<string>('');

  // Data Loader
  const loadData = useCallback(async (targetOfficerId?: string, preferredComplaintId?: string | number) => {
    if (isPollingRef.current) return;
    isPollingRef.current = true;
    try {
      const activeNrp = nrpParam || officer.nrp;
      const activeOfficerId = targetOfficerId || officer.id;

      // Jalankan query logbooks dan complaints secara terpisah agar data logbooks tampil instan
      const logbooksPromise = getOfficerLogbooksAction(String(activeOfficerId)).then((lRes) => {
        if (lRes?.success && lRes?.data) {
          setLogbooks(lRes.data);
        }
      });

      const complaintsPromise = getOfficerComplaintsAction(activeNrp).then((cRes) => {
        if (cRes?.success && cRes?.data) {
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

            const pending = cRes.data.find((c: any) =>
              isTaskPendingAcceptance(c, activeNrp, activeOfficerId, officer.unit_id)
            ) || null;

            if (pending) {
              setPendingAcceptTask(pending);
            } else {
              stopPoliceAlertAudio();
              setPendingAcceptTask(null);
              setShowAcceptModal(false);
            }

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
      });

      await Promise.all([logbooksPromise, complaintsPromise]);
    } catch (e) {
      console.warn('Load dynamic personil data error:', e);
    } finally {
      isPollingRef.current = false;
    }
  }, [nrpParam, officer.nrp, officer.id, officer.unit_id]);

  const handleOpenFinishModal = useCallback((c: ComplaintData) => {
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
  }, []);

  // Static Master & Telemetry Setup
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

    let watchId: number | null = null;
    let lastTelemetryTime = 0;

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
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

    loadData();

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

    // Real-time fallback heartbeat (60s) jika koneksi SSE sempat terputus
    const pollInterval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      loadData();
    }, 60000);

    return () => {
      if (watchId !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
      clearInterval(pollInterval);
      document.removeEventListener('visibilitychange', handleWakeOrFocus);
      window.removeEventListener('focus', handleWakeOrFocus);
    };
  }, [loadData, officer.nrp]);

  // Real-time Event-Driven Sync via Server-Sent Events (SSE)
  useConsoleEventSource({
    stationId: officer.stationId || undefined,
    enabled: true,
    onEvent: useCallback(() => {
      loadData();
    }, [loadData]),
  });

  // Lock scroll when Maps tab is active
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

  // Actions
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
        toast.success(
          'Penugasan Berhasil Diterima',
          `✓ Penugasan #${task.nomorTiket || task.id} BERHASIL DITERIMA! Membuka Peta Navigasi Rute TKP...`
        );
        setShowAcceptModal(false);
        setPendingAcceptTask(null);

        const updated = { ...task, status: 'DIPROSES' };
        setActiveComplaint(updated);
        activeComplaintRef.current = updated;

        await loadData(officer.id, task.id);
        switchTab('peta');
      } else {
        toast.error('Gagal Menerima Penugasan', res?.error || 'Gagal menerima penugasan.');
      }
    } catch (err: any) {
      toast.error('Kendala Jaringan', err.message || 'Terjadi kesalahan jaringan.');
    } finally {
      setIsAcceptingTask(false);
    }
  };

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
        toast.success(
          'Tahap Penanganan Diperbarui',
          `✓ Tahap penanganan #${activeComplaint.nomorTiket} berhasil diperbarui.`
        );

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
        toast.error('Gagal Memperbarui Status', res?.error || 'Gagal memperbarui status tugas.');
      }
    } catch (err: any) {
      toast.error('Kesalahan Sistem', err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsUpdatingStep(false);
    }
  };

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
        toast.success('Status Dinas Aktif', '✓ Berhasil mengaktifkan status dinas patroli.');
        loadData(officer.id);
      } else {
        toast.error('Gagal Presensi Masuk', res.error || 'Gagal mengaktifkan status dinas.');
      }
    } catch (e: any) {
      toast.error('Gagal Presensi Masuk', e.message || 'Gagal mengaktifkan status dinas.');
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
        toast.info('Status Lepas Dinas', 'Status dinas berhasil diubah menjadi Lepas Dinas.');
      } else {
        toast.error('Gagal Presensi Pulang', res.error || 'Gagal melepas status dinas.');
      }
    } catch (e: any) {
      toast.error('Gagal Presensi Pulang', e.message || 'Gagal melepas status dinas.');
    }
  };

  const handleLogout = async () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('simopmas_active_user');
    }
    await logoutAction();
    window.location.href = '/?alert=logged_out';
  };

  const handleQuickAction = (type: 'PATROLI' | 'TPTKP' | 'SAMBANG' | 'PENGAMANAN') => {
    setQuickActionModalType(type);
  };

  const submitQuickAction = async (
    data: PengajuanGiatData
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const formattedDeskripsi = [
        `[PENGAJUAN GIAT ${data.type}]`,
        `• Rencana Rute/Lokasi: ${data.lokasiSasaran}`,
        `• Estimasi Waktu: ${data.jamMulai} s/d ${data.jamSelesai} WIB`,
        `• Armada Kendaraan: ${data.armada}`,
        `• Rekan Regu: ${data.rekanRegu || '-'}`,
        `• Rencana Kegiatan: ${data.uraianRencana}`,
      ].join('\n');

      const res = await createLogbookAction({
        officerId: officer.id,
        complaintId: activeComplaint ? String(activeComplaint.id) : undefined,
        jenisAksi: data.type,
        lokasiKlaimAlamat: data.lokasiSasaran || (officer.stationName ? officer.stationName : ''),
        lokasiKlaimLat: currentGps.lat,
        lokasiKlaimLng: currentGps.lng,
        lokasiGpsAktualLat: currentGps.lat,
        lokasiGpsAktualLng: currentGps.lng,
        jamMulai: data.jamMulai,
        jamSelesai: data.jamSelesai,
        deskripsiKegiatan: formattedDeskripsi,
      });

      if (res.success) {
        toast.success(
          'Pengajuan Terkirim',
          `✓ Pengajuan giat ${data.type} berhasil diajukan ke antrean persetujuan Pawas!`
        );
        setQuickActionModalType(null);
        await loadData(officer.id);
        return { success: true };
      } else {
        return { success: false, error: res.error || 'Gagal mengirim pengajuan giat.' };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Terjadi kesalahan sistem saat mengirim pengajuan.' };
    }
  };

  return {
    activeTab,
    switchTab,
    officer,
    setOfficer,
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
  };
}
