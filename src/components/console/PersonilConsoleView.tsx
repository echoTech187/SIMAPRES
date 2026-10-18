'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  getOfficerComplaintsAction,
  fieldStepAction,
} from '@/app/actions/complaint.actions';
import {
  createLogbookAction,
  getOfficerLogbooksAction,
  getOfficerKpiChartDataAction,
} from '@/app/actions/logbook.actions';
import {
  getHotspotsAction,
  createHotspotAction,
  deleteHotspotAction,
} from '@/app/actions/hotspot.actions';
import {
  updateDeviceTelemetryAction,
  getOfficerProfileByNrpAction,
  getPoliceOfficesAction,
  logoutAction,
} from '@/app/actions/auth.actions';
import { getPatrolFleetUnitsAction } from '@/app/actions/fleet.actions';
import HeaderProfileBadge from './HeaderProfileBadge';

const SimapresLeafletMap = dynamic(() => import('@/components/SimapresLeafletMap'), {
  ssr: false,
  loading: () => (
    <div style={{ width: '100%', height: '100%', minHeight: '350px', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', fontWeight: 700 }}>
      🛰️ Memuat Peta Rute Patroli...
    </div>
  ),
});

const MiniMapPicker = dynamic(() => import('@/components/MiniMapPicker'), {
  ssr: false,
  loading: () => <div style={{ height: '220px', background: '#E2E8F0' }} />,
});

import KpiGaugeChart from '@/components/KpiGaugeChart';
import { ConsoleSkeleton } from './ConsoleSkeleton';

function parsePersonilTab(section?: string): string {
  if (!section) return 'view-beranda';
  const clean = section.toLowerCase().trim();
  switch (clean) {
    case 'peta':
      return 'view-peta';
    case 'buat-pengaduan':
    case 'buat-log':
    case 'log':
      return 'view-log';
    case 'komando':
    case 'tugas':
    case 'validasi':
      return 'view-validasi';
    case 'kinerja':
    case 'laporan':
      return 'view-laporan';
    case 'profil':
      return 'view-profil';
    case 'wizard':
      return 'view-wizard';
    case 'beranda':
    default:
      return 'view-beranda';
  }
}

function personilTabToSlug(tabId: string): string {
  switch (tabId) {
    case 'view-peta':
      return 'peta';
    case 'view-log':
      return 'buat-pengaduan';
    case 'view-validasi':
      return 'tugas';
    case 'view-laporan':
      return 'kinerja';
    case 'view-profil':
      return 'profil';
    case 'view-wizard':
      return 'wizard';
    case 'view-beranda':
    default:
      return '';
  }
}

function PersonilContent({ session, initialSection = 'beranda' }: { session?: any; initialSection?: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const nrpParam = searchParams.get('nrp') || session?.identifier || '';

  // Navigation tab: Sinkronkan dengan URL halaman (/console/buat-pengaduan, /console/peta, dll.)
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const parts = window.location.pathname.split('/').filter(Boolean);
      const last = parts[parts.length - 1];
      if (parts[0] === 'console' && parts.length > 1) {
        return parsePersonilTab(last);
      }
    }
    return parsePersonilTab(initialSection);
  });

  // Tab & Per-Page switcher: sinkronkan ke URL browser secara mulus
  const switchTab = (tabId: string) => {
    setActiveTab(tabId);
    const slug = personilTabToSlug(tabId);
    const targetUrl = slug ? `/console/${slug}` : '/console';
    if (typeof window !== 'undefined' && window.location.pathname !== targetUrl) {
      window.history.pushState(null, '', targetUrl);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const [focusedFleet, setFocusedFleet] = useState<'all' | 'samapta' | 'perintis' | 'lantas' | 'hotspot'>('all');
  const [newHotspotLat, setNewHotspotLat] = useState<number>(0);
  const [newHotspotLng, setNewHotspotLng] = useState<number>(0);
  const [showMiniPickerRawan, setShowMiniPickerRawan] = useState<boolean>(false);

  // Officer Profile (Dimuat secara dinamis 100% dari Database MySQL)
  const [officer, setOfficer] = useState<any>({
    id: session?.userId ? String(session.userId) : '',
    nrp: nrpParam,
    fullName: session?.fullName || '',
    pangkat: session?.rankPangkat || '',
    jabatan: session?.title || '',
    satuan: '',
    kendaraan: '',
    avatar: session?.avatar_url || null,
    kpi: 0,
  });

  const [taktisStatus, setTaktisStatus] = useState<string>('siaga');

  // Complaints & Active Emergency
  const [complaints, setComplaints] = useState<any[]>([]);
  const [activeComplaint, setActiveComplaint] = useState<any | null>(null);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [validasiFilter, setValidasiFilter] = useState<'semua' | 'diproses' | 'menunggu_pengesahan'>('diproses');
  const [platformFilter, setPlatformFilter] = useState<'all' | 'sos' | 'warga' | 'layanan110'>('all');

  // Logbooks & KPI
  const [logbooks, setLogbooks] = useState<any[]>([]);
  const [kpiPeriod, setKpiPeriod] = useState<'harian' | 'mingguan' | 'bulanan'>('harian');

  // Police Offices, Fleet Units & Hotspots from Database
  const [policeOffices, setPoliceOffices] = useState<any[]>([]);
  const [fleetUnits, setFleetUnits] = useState<any[]>([]);
  const [hotspots, setHotspots] = useState<any[]>([]);
  const [showHotspotModal, setShowHotspotModal] = useState<boolean>(false);
  const [showHotspotAddForm, setShowHotspotAddForm] = useState(false);
  const [newHotspotTitle, setNewHotspotTitle] = useState('');
  const [newHotspotWilayah, setNewHotspotWilayah] = useState('');
  const [newHotspotKategori, setNewHotspotKategori] = useState('');
  const [newHotspotStatus, setNewHotspotStatus] = useState('');
  const [newHotspotJadwal, setNewHotspotJadwal] = useState('');

  // Form Logbook State
  const [logJenis, setLogJenis] = useState<'PATROLI' | 'TPTKP' | 'SAMBANG' | 'PENGAMANAN'>('PATROLI');
  const [jamMulai, setJamMulai] = useState('');
  const [jamSelesai, setJamSelesai] = useState('');
  const [logLokasi, setLogLokasi] = useState('');
  const [logLat, setLogLat] = useState(0);
  const [logLng, setLogLng] = useState(0);
  const [logDeskripsi, setLogDeskripsi] = useState('');
  const [logFoto, setLogFoto] = useState<string | null>(null);
  const logPhotoInputRef = useRef<HTMLInputElement>(null);
  const [isSubmittingLog, setIsSubmittingLog] = useState(false);

  // Timepicker Modal
  const [showTimePicker, setShowTimePicker] = useState<boolean>(false);

  // Wizard Penanganan Kasus
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [wizardCatatan, setWizardCatatan] = useState('');
  const [wizardFoto, setWizardFoto] = useState<string | null>(null);
  const [isUpdatingStep, setIsUpdatingStep] = useState(false);

  // Modals
  const [showSosModal, setShowSosModal] = useState(false);
  const [showKpiModal, setShowKpiModal] = useState(false);
  const [showPresensiPulangModal, setShowPresensiPulangModal] = useState(false);
  const [lightboxFoto, setLightboxFoto] = useState<{ src: string; title: string; meta: string } | null>(null);
  const [selectedLogDetail, setSelectedLogDetail] = useState<any | null>(null);

  // Unit Map Detail Popup
  const [mapUnitDetail, setMapUnitDetail] = useState<any | null>(null);

  // Presensi & Clock
  const [presensiMasukTime, setPresensiMasukTime] = useState<string>('-');
  const [presensiPulangTime, setPresensiPulangTime] = useState<string | null>(null);
  const [liveClock, setLiveClock] = useState('');
  const [currentGps, setCurrentGps] = useState<{ lat: number; lng: number }>({
    lat: 0,
    lng: 0,
  });

  // Layer Toggles
  const [showTraffic, setShowTraffic] = useState(true);
  const [showOtherOfficers, setShowOtherOfficers] = useState(false);

  // Live Clock & GPS Geolocation
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveClock(
        new Date().toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }) + ' WIB'
      );
    }, 1000);

    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = Number(pos.coords.latitude.toFixed(6));
          const lng = Number(pos.coords.longitude.toFixed(6));
          setCurrentGps({ lat, lng });
          setLogLat(lat);
          setLogLng(lng);
          updateDeviceTelemetryAction({
            deviceId: 'DEV-HP-ACTIVE',
            nrp: nrpParam,
            lat,
            lng,
          }).catch(console.warn);
        },
        (err) => console.warn('GPS init warning:', err)
      );
    }

    return () => clearInterval(timer);
  }, [nrpParam]);

  // Listener tombol navigasi Back/Forward browser
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window !== 'undefined') {
        const parts = window.location.pathname.split('/').filter(Boolean);
        const last = parts[parts.length - 1];
        if (parts[0] === 'console' && parts.length > 1) {
          setActiveTab(parsePersonilTab(last));
        } else {
          setActiveTab('view-beranda');
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Sinkronisasi query param jika ada (?tab=... / ?page=...)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search) {
      const qParams = new URLSearchParams(window.location.search);
      const tabQ = qParams.get('tab') || qParams.get('page');
      if (tabQ) {
        const matched = parsePersonilTab(tabQ);
        setActiveTab(matched);
        const slug = personilTabToSlug(matched);
        window.history.replaceState(null, '', slug ? `/console/${slug}` : '/console');
      }
    }
  }, []);

  // Load Data
  const loadData = async (targetOfficerId?: string) => {
    try {
      const cRes = await getOfficerComplaintsAction(nrpParam);
      if (cRes.success && cRes.data) {
        setComplaints(cRes.data);
        const active = cRes.data.find(
          (c: any) => c.status !== 'SELESAI' && (c.status === 'DISPOSISI' || c.status === 'MENUJU_TKP' || c.status === 'PENANGANAN_TKP')
        );
        setActiveComplaint(active || null);
        if (cRes.data.length > 0 && !selectedTask) {
          setSelectedTask(active || cRes.data[0]);
        }
      }

      const activeOfficerId = targetOfficerId || officer?.id;
      if (activeOfficerId) {
        const lRes = await getOfficerLogbooksAction(String(activeOfficerId));
        if (lRes.success && lRes.data) {
          setLogbooks(lRes.data);
        }
      }

      const hRes = await getHotspotsAction();
      if (hRes.success && hRes.data) {
        setHotspots(hRes.data);
      }

      const oRes = await getPoliceOfficesAction();
      if (oRes.success && oRes.data) {
        setPoliceOffices(oRes.data);
      }

      const fRes = await getPatrolFleetUnitsAction();
      if (fRes.success && fRes.data) {
        setFleetUnits(fRes.data);
      }
    } catch (e) {
      console.warn('Load data error:', e);
    }
  };

  useEffect(() => {
    // 1. Direct fetch profile personel dari database resmi
    if (nrpParam) {
      getOfficerProfileByNrpAction(nrpParam).then((res) => {
        if (res.success && res.data) {
          const loadedId = String(res.data.id);
          setOfficer({
            id: loadedId,
            nrp: res.data.nrp,
            fullName: res.data.fullName,
            pangkat: res.data.pangkat,
            jabatan: `${res.data.satuan} • ${res.data.jabatan}`,
            satuan: res.data.satuan,
            kendaraan: `Ranmor Dinas ${res.data.pangkat} VII-${res.data.nrp.slice(-4)}-01`,
            avatar: res.data.avatar,
            kpi: res.data.kpi,
          });
          loadData(loadedId);
        } else {
          loadData();
        }
      });
    } else {
      loadData();
    }
  }, [nrpParam]);

  // Handle Log Submit
  const handleSaveLog = async () => {
    if (!logDeskripsi.trim()) {
      alert('Uraian kegiatan wajib diisi!');
      return;
    }

    setIsSubmittingLog(true);
    try {
      const res = await createLogbookAction({
        officerId: officer.id,
        complaintId: activeComplaint ? activeComplaint.id : null,
        jenisAksi: logJenis,
        lokasiKlaimAlamat: logLokasi,
        lokasiKlaimLat: logLat,
        lokasiKlaimLng: logLng,
        lokasiGpsAktualLat: currentGps.lat,
        lokasiGpsAktualLng: currentGps.lng,
        jamMulai: jamMulai,
        jamSelesai: jamSelesai,
        deskripsiKegiatan: logDeskripsi,
        fotoBuktiUrl: logFoto || null,
      });

      if (res.success) {
        alert('✓ Log kegiatan berhasil dikirim ke server & antrean verifikasi Pawas!');
        setLogDeskripsi('');
        setLogFoto(null);
        loadData();
        switchTab('view-beranda');
      } else {
        alert(res.error || 'Gagal menyimpan logbook.');
      }
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmittingLog(false);
    }
  };

  // Handle Wizard Step Submit
  const handleWizardSubmit = async (step: 'meluncur' | 'tiba_tkp' | 'selesai') => {
    if (!activeComplaint) return;
    setIsUpdatingStep(true);
    try {
      const res = await fieldStepAction({
        complaintId: activeComplaint.id,
        step,
        officerId: officer.id,
        catatan: wizardCatatan || undefined,
        fotoBuktiUrl: wizardFoto || undefined,
        lat: currentGps.lat,
        lng: currentGps.lng,
      });

      if (res.success) {
        alert(`✓ Status berhasil diperbarui menjadi ${step.toUpperCase().replace('_', ' ')}!`);
        setWizardCatatan('');
        setWizardFoto(null);
        loadData();
        if (step === 'selesai') {
          switchTab('view-beranda');
        } else {
          setWizardStep(step === 'meluncur' ? 2 : 3);
        }
      } else {
        alert(res.error || 'Gagal memperbarui status pengaduan.');
      }
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsUpdatingStep(false);
    }
  };

  // Open Quick Response
  const openRespon = (jenis: 'PATROLI' | 'TPTKP' | 'SAMBANG' | 'PENGAMANAN') => {
    setLogJenis(jenis);
    switchTab('view-log');
  };

  // Filtered tasks in Validasi tab
  const filteredTasks = complaints.filter((c) => {
    if (validasiFilter === 'diproses') {
      if (c.status === 'SELESAI') return false;
    } else if (validasiFilter === 'menunggu_pengesahan') {
      if (c.status !== 'MENUNGGU_PENGESAHAN' && c.status !== 'PENANGANAN_TKP') return false;
    }
    if (platformFilter === 'sos' && c.saluranLaporan !== 'SOS') return false;
    if (platformFilter === 'warga' && c.saluranLaporan !== 'PORTAL_WARGA') return false;
    if (platformFilter === 'layanan110' && c.saluranLaporan !== 'CALL_110') return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#F8FAFC' }}>
      <div className="app-container">
        {/* TOP APP BAR */}
        <header className="top-bar">
          <div className="brand">
            <div className="brand-logo">
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  background: '#FBBF24',
                  clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                }}
              />
            </div>
            E TRIBRATA LOG
          </div>
          <div className="user-profile">
            <HeaderProfileBadge
              name={officer.fullName}
              identifier={officer.nrp}
              role="personil"
              avatar={officer.avatar}
              isActive={activeTab === 'view-profil'}
              hasNotification={complaints.length > 0}
              onBellClick={() => switchTab('view-validasi')}
              onClick={() => switchTab('view-profil')}
            />
          </div>
        </header>

        {/* MAIN VIEW CONTAINER */}
        <main className="view-container">
          {/* ======================================================== */}
          {/* SCREEN 1: BERANDA                                        */}
          {/* ======================================================== */}
          {activeTab === 'view-beranda' && (
            <section id="view-beranda" className="view active">
              <div
                className="dashboard-header"
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}
              >
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#1E293B', letterSpacing: '0.5px' }}>
                    DASHBOARD OPERASIONAL
                  </div>
                  <div className="status-text" id="personil-header-status-sub" style={{ marginTop: '2px' }}>
                    STATUS: DINAS PATROLI AKTIF
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#475569' }}>STATUS KESIAGAAN:</span>
                  <select
                    id="select-status-taktis-mandiri"
                    value={taktisStatus}
                    onChange={(e) => setTaktisStatus(e.target.value)}
                    style={{
                      padding: '6px 14px',
                      fontSize: '11.5px',
                      fontWeight: 800,
                      borderRadius: '20px',
                      border: '1.5px solid #16A34A',
                      background: '#15803D',
                      color: 'white',
                      cursor: 'pointer',
                      outline: 'none',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                    }}
                  >
                    <option value="siaga">🟢 Siaga Patroli Beat</option>
                    <option value="meluncur">🔵 Meluncur ke TKP (110)</option>
                    <option value="ditkp">🟠 Penanganan di TKP</option>
                    <option value="konsolidasi">⚪ Konsolidasi / Piket</option>
                  </select>
                </div>
              </div>

              {/* Mission Critical Alert / Kondusif Banner */}
              <div style={{ margin: '0 24px 14px' }}>
                {activeComplaint ? (
                  <div
                    style={{
                      background: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)',
                      color: 'white',
                      padding: '16px 20px',
                      borderRadius: '14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '12px',
                      boxShadow: '0 10px 25px rgba(220, 38, 38, 0.25)',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 800, background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '4px' }}>
                          🚨 PENUGASAN DARURAT SPKT 110
                        </span>
                        <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#FDE68A' }}>
                          {activeComplaint.nomorTiket}
                        </span>
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: 800 }}>{activeComplaint.jenisKejadian}</div>
                      <div style={{ fontSize: '11.5px', color: '#FEE2E2', marginTop: '3px' }}>
                        📍 {activeComplaint.tkpAlamatTeks} • <strong>Instruksi Pawas:</strong> {activeComplaint.arahanPawas || '-'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ background: 'rgba(0,0,0,0.25)', padding: '6px 12px', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '9px', color: '#FCA5A5', fontWeight: 800 }}>TARGET SLA</div>
                        <div style={{ fontSize: '13px', fontWeight: 900, color: '#FDE68A' }}>&lt; 10 Menit</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTask(activeComplaint);
                          switchTab('view-wizard');
                        }}
                        style={{
                          background: 'white',
                          color: '#DC2626',
                          border: 'none',
                          padding: '10px 16px',
                          borderRadius: '8px',
                          fontWeight: 800,
                          fontSize: '12px',
                          cursor: 'pointer',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        }}
                      >
                        Buka Wizard Penanganan ➔
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      background: 'linear-gradient(135deg, #065F46 0%, #047857 100%)',
                      color: 'white',
                      padding: '12px 18px',
                      borderRadius: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '20px' }}>🛡️</span>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 800 }}>WILAYAH HUKUM KONDUSIF &amp; TERPANTAU</div>
                        <div style={{ fontSize: '11px', color: '#A7F3D0' }}>
                          Tidak ada panggilan darurat aktif di beat Anda. Lakukan patroli dialogis secara berkala.
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => switchTab('view-log')}
                      style={{
                        background: 'rgba(255,255,255,0.2)',
                        border: '1px solid rgba(255,255,255,0.4)',
                        color: 'white',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      + Catat Log
                    </button>
                  </div>
                )}
              </div>

              {/* BERANDA 2-COLUMN GRID (Sesuai Gambar 2 Prototype) */}
              <div className="beranda-grid">
                {/* Left Column */}
                <div id="beranda-col-left" style={{ flex: 1, minWidth: 0 }}>
                  {/* Peta Card */}
                  <div className="card-panel" id="card-map-beranda">
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        marginBottom: '12px',
                      }}
                    >
                      <div className="card-title" id="map-card-title" style={{ marginBottom: '12px' }}>
                        Peta Rute Patroli
                      </div>
                      {/* Fleet Badges Khusus Pimpinan (Identik dengan Prototype) */}
                      <div id="pimpinan-map-badges" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <span
                          onClick={() => setFocusedFleet('samapta')}
                          style={{
                            background: '#EFF6FF',
                            color: '#1D4ED8',
                            fontSize: '10.5px',
                            fontWeight: 700,
                            padding: '4px 9px',
                            borderRadius: '6px',
                            border: '1px solid #BFDBFE',
                            cursor: 'pointer',
                            userSelect: 'none',
                          }}
                          title="Klik untuk fokus & detail Unit Patroli Samapta R-4"
                        >
                          🚔 4 Samapta R-4
                        </span>
                        <span
                          onClick={() => setFocusedFleet('perintis')}
                          style={{
                            background: '#FEF3C7',
                            color: '#B45309',
                            fontSize: '10.5px',
                            fontWeight: 700,
                            padding: '4px 9px',
                            borderRadius: '6px',
                            border: '1px solid #FDE68A',
                            cursor: 'pointer',
                            userSelect: 'none',
                          }}
                          title="Klik untuk fokus & detail Tim Perintis Presisi R-2"
                        >
                          🏍️ 6 Perintis R-2
                        </span>
                        <span
                          onClick={() => setFocusedFleet('lantas')}
                          style={{
                            background: '#F0FDF4',
                            color: '#15803D',
                            fontSize: '10.5px',
                            fontWeight: 700,
                            padding: '4px 9px',
                            borderRadius: '6px',
                            border: '1px solid #BBF7D0',
                            cursor: 'pointer',
                            userSelect: 'none',
                          }}
                          title="Klik untuk fokus & detail Patroli Turjawali Satlantas"
                        >
                          🚓 4 Lantas R-4
                        </span>
                        <span
                          onClick={() => setFocusedFleet('hotspot')}
                          id="badge-hotspot-count"
                          style={{
                            background: '#FEF2F2',
                            color: '#DC2626',
                            fontSize: '10.5px',
                            fontWeight: 700,
                            padding: '4px 9px',
                            borderRadius: '6px',
                            border: '1px solid #FECACA',
                            cursor: 'pointer',
                            userSelect: 'none',
                          }}
                          title="Klik untuk fokus & detail Titik Rawan Kejahatan"
                        >
                          🔴 {hotspots.length > 0 ? hotspots.length : 3} Titik Rawan Kejahatan
                        </span>
                        <span
                          onClick={() => setShowHotspotModal(true)}
                          style={{
                            background: '#FFF1F2',
                            color: '#BE123C',
                            fontSize: '10.5px',
                            fontWeight: 800,
                            padding: '4px 9px',
                            borderRadius: '6px',
                            border: '1px solid #FECDD3',
                            cursor: 'pointer',
                            userSelect: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                          title="Kelola Data Titik Rawan (Tambah, Edit, Hapus)"
                        >
                          ⚙️ Kelola Titik Rawan
                        </span>
                        <span
                          onClick={() => setShowTraffic(!showTraffic)}
                          id="badge-traffic-beranda"
                          style={{
                            background: showTraffic ? '#ECFDF5' : '#F1F5F9',
                            color: showTraffic ? '#047857' : '#64748B',
                            fontSize: '10.5px',
                            fontWeight: 800,
                            padding: '4px 9px',
                            borderRadius: '6px',
                            border: `1px solid ${showTraffic ? '#A7F3D0' : '#CBD5E1'}`,
                            cursor: 'pointer',
                            userSelect: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                          title="Klik untuk menyalakan/mematikan Live Traffic Line"
                        >
                          🚦 Live Traffic: {showTraffic ? 'ON' : 'OFF'}
                        </span>
                      </div>
                    </div>

                    <div id="map-beranda-wrapper" style={{ position: 'relative', width: '100%', height: '350px', borderRadius: '8px', overflow: 'hidden' }}>
                      {/* Real Interactive Leaflet Google Roadmap */}
                      <SimapresLeafletMap
                        mode="beranda"
                        height="350px"
                        myUnit={{
                          key: 'my_unit',
                          pos: currentGps,
                          iconEmoji: '🚔',
                          title: `Patroli Samapta (Unit Anda)`,
                          petugas: `${officer.fullName} (NRP ${officer.nrp})`,
                          sub: `${officer.satuan} • ${officer.kendaraan}`,
                          status: 'Status: SIAGA',
                          statusColor: '#10B981',
                          tugas: 'Tugas: Patroli Rute Beat 1 (SOP Presisi)',
                          telemetri: 'Kecepatan: 35 km/jam • Sinyal GPS Prima',
                        }}
                        hotspots={hotspots}
                        policeOffices={policeOffices}
                        fleetUnits={fleetUnits}
                        showTraffic={showTraffic}
                        showOtherOfficers={showOtherOfficers}
                        activeFilter={focusedFleet}
                        onSelectUnit={(unit) => setMapUnitDetail(unit)}
                        onOpenSos={() => setShowSosModal(true)}
                        onFullscreen={() => switchTab('view-peta')}
                      />

                      {/* Floating Unit Detail Modal (Sesuai Mockup Gambar 2 Prototype) */}
                      {mapUnitDetail && (
                        <div
                          id="modal-map-unit-detail"
                          style={{
                            position: 'absolute',
                            top: '12px',
                            left: '12px',
                            zIndex: 9999,
                            background: '#FFFFFF',
                            borderRadius: '12px',
                            boxShadow: '0 12px 30px rgba(0,0,0,0.25), 0 4px 10px rgba(0,0,0,0.15)',
                            border: '1px solid #CBD5E1',
                            padding: '15px 17px',
                            width: '330px',
                            maxWidth: 'calc(100% - 70px)',
                            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                            pointerEvents: 'auto',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                            <div style={{ fontSize: '15px', fontWeight: 800, color: '#0284C7', display: 'flex', alignItems: 'center', gap: '7px' }}>
                              <span style={{ fontSize: '16px' }}>{mapUnitDetail.iconEmoji || '🚔'}</span>
                              <span>{mapUnitDetail.title}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setMapUnitDetail(null)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#94A3B8',
                                fontSize: '16px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                lineHeight: 1,
                                padding: '2px 4px',
                                borderRadius: '4px',
                              }}
                              title="Tutup Detail"
                            >
                              ✕
                            </button>
                          </div>
                          <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#1E293B', lineHeight: 1.3, marginTop: '4px' }}>
                            {mapUnitDetail.petugas}
                          </div>
                          <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px', lineHeight: 1.4 }}>
                            {mapUnitDetail.sub}
                          </div>
                          <div style={{ borderTop: '1px solid #E2E8F0', margin: '10px 0 8px 0' }} />
                          <div style={{ fontSize: '13px', fontWeight: 800, color: mapUnitDetail.statusColor || '#10B981' }}>
                            {mapUnitDetail.status}
                          </div>
                          <div style={{ fontSize: '12px', color: '#475569', marginTop: '3px', lineHeight: 1.4 }}>
                            {mapUnitDetail.tugas}
                          </div>
                          <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
                            {mapUnitDetail.telemetri}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Rekapitulasi Giat Hari Ini */}
                  <div className="card-panel">
                    <div className="card-title">REKAPITULASI GIAT HARI INI</div>
                    <div className="rekap-grid">
                      <div className="rekap-box">
                        <div className="rekap-label">PATROLI</div>
                        <div className="rekap-val">14</div>
                      </div>
                      <div className="rekap-box">
                        <div className="rekap-label">TPTKP</div>
                        <div className="rekap-val red">6</div>
                      </div>
                      <div className="rekap-box">
                        <div className="rekap-label">SAMBANG</div>
                        <div className="rekap-val green">8</div>
                      </div>
                      <div className="rekap-box">
                        <div className="rekap-label">PENGAMANAN</div>
                        <div className="rekap-val">5</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column (Sesuai Gambar 2 Prototype) */}
                <div id="beranda-col-right" style={{ width: '340px', flexShrink: 0 }}>
                  {/* Quick Action Pad 2x2 */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                    {/* Patroli (Blue) */}
                    <button
                      type="button"
                      onClick={() => openRespon('PATROLI')}
                      style={{
                        background: '#1D4ED8',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '12px 8px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        gap: '3px',
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(29,78,216,0.25)',
                      }}
                    >
                      <div style={{ fontSize: '18px' }}>🚔</div>
                      <div style={{ fontSize: '11.5px', fontWeight: 800, letterSpacing: '0.5px' }}>PATROLI</div>
                      <div style={{ fontSize: '9.5px', opacity: 0.85 }}>Blue Light Beat</div>
                    </button>

                    {/* TPTKP (Red) */}
                    <button
                      type="button"
                      onClick={() => openRespon('TPTKP')}
                      style={{
                        background: '#DC2626',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '12px 8px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        gap: '3px',
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(220,38,38,0.25)',
                      }}
                    >
                      <div style={{ fontSize: '18px' }}>🛡️</div>
                      <div style={{ fontSize: '11.5px', fontWeight: 800, letterSpacing: '0.5px' }}>TPTKP</div>
                      <div style={{ fontSize: '9.5px', opacity: 0.85 }}>Tindakan Pertama</div>
                    </button>

                    {/* Sambang (Green) */}
                    <button
                      type="button"
                      onClick={() => openRespon('SAMBANG')}
                      style={{
                        background: '#059669',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '12px 8px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        gap: '3px',
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(5,150,105,0.25)',
                      }}
                    >
                      <div style={{ fontSize: '18px' }}>🤝</div>
                      <div style={{ fontSize: '11.5px', fontWeight: 800, letterSpacing: '0.5px' }}>SAMBANG</div>
                      <div style={{ fontSize: '9.5px', opacity: 0.85 }}>Warga &amp; Tokoh</div>
                    </button>

                    {/* Pengamanan (Orange) */}
                    <button
                      type="button"
                      onClick={() => openRespon('PENGAMANAN')}
                      style={{
                        background: '#D97706',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '12px 8px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        gap: '3px',
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(217,119,6,0.25)',
                      }}
                    >
                      <div style={{ fontSize: '18px' }}>⚠️</div>
                      <div style={{ fontSize: '11.5px', fontWeight: 800, letterSpacing: '0.5px' }}>PENGAMANAN</div>
                      <div style={{ fontSize: '9.5px', opacity: 0.85 }}>Jalur / Keramaian</div>
                    </button>
                  </div>

                  {/* Saluran Radio HT (Sesuai Gambar 2) */}
                  <div
                    style={{
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '8px',
                      fontSize: '11px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', fontWeight: 600 }}>
                      <span>📻</span>
                      <span>Saluran Radio HT:</span>
                    </div>
                    <div style={{ color: '#0284C7', fontWeight: 800, fontSize: '11px' }}>CH-110 METRO PRESISI</div>
                  </div>

                  {/* Daily Shift Stats Pills */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '12px' }}>
                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '7px 4px', textAlign: 'center' }}>
                      <div style={{ fontSize: '15px', fontWeight: 900, color: '#1D4ED8' }}>
                        {complaints.filter((c) => c.status === 'SELESAI').length + 4}
                      </div>
                      <div style={{ fontSize: '8.5px', fontWeight: 800, color: '#64748B', marginTop: '1px' }}>TUGAS SELESAI</div>
                    </div>
                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '7px 4px', textAlign: 'center' }}>
                      <div style={{ fontSize: '15px', fontWeight: 900, color: '#059669' }}>4.8m</div>
                      <div style={{ fontSize: '8.5px', fontWeight: 800, color: '#64748B', marginTop: '1px' }}>AVG RESPON</div>
                    </div>
                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '7px 4px', textAlign: 'center' }}>
                      <div style={{ fontSize: '15px', fontWeight: 900, color: '#D97706' }}>450</div>
                      <div style={{ fontSize: '8.5px', fontWeight: 800, color: '#64748B', marginTop: '1px' }}>POIN PRESISI</div>
                    </div>
                  </div>

                  {/* KPI PERFORMANCE (Sesuai Gambar 2 + Interaktif) */}
                  <div
                    className="card-panel"
                    id="kpi-card"
                    style={{ marginBottom: '12px', padding: '16px', cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
                    onClick={() => setShowKpiModal(true)}
                    title="Klik untuk melihat rincian capaian KPI presisi Anda"
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div className="card-title" style={{ marginBottom: 0, fontSize: '12px', fontWeight: 800 }}>
                        KPI PERFORMANCE
                      </div>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#1D4ED8', background: '#EFF6FF', padding: '2px 6px', borderRadius: '4px' }}>
                        Detail ➔
                      </span>
                    </div>

                    {/* Dynamic KPI Performance Gauge from Database */}
                    <KpiGaugeChart
                      score={officer.kpi || 0}
                      label={`${officer.kpi || 0}%`}
                      subtext="Capaian Target Respon & Standar SOP Presisi"
                    />

                    <div style={{ textAlign: 'center', fontSize: '11px', color: '#64748B', fontWeight: 600, marginTop: '6px' }} id="gauge1-subtext">
                      Capaian Target Respon &amp; Standar SOP Presisi
                    </div>
                  </div>

                  {/* AKTIVITAS SAYA DI APLIKASI */}
                  <div className="card-panel" id="mutasi-kegiatan-card" style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div className="card-title" style={{ marginBottom: 0, fontSize: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>⏱️</span> AKTIVITAS SAYA DI APLIKASI
                      </div>
                      <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#1D4ED8', background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '2px 8px', borderRadius: '10px' }}>
                        ● SESI AKTIF
                      </span>
                    </div>
                    <div id="personel-timeline-container" style={{ borderLeft: '2px solid #E2E8F0', paddingLeft: '14px', marginLeft: '6px' }}>
                      <div style={{ fontSize: '11.5px', color: '#475569', lineHeight: 1.5, marginBottom: '8px' }}>
                        <div style={{ fontWeight: 700, color: '#1E293B' }}>Apel Serah Terima Piket Selesai (08:00 WIB)</div>
                        <div style={{ color: '#64748B', marginTop: '2px' }}>Regu piket dinyatakan siap bertugas di beat patroli.</div>
                      </div>
                      {logbooks.slice(0, 2).map((l, idx) => (
                        <div key={l.id || idx} style={{ fontSize: '11.5px', color: '#475569', lineHeight: 1.5, marginBottom: '8px' }}>
                          <div style={{ fontWeight: 700, color: '#153E75' }}>
                            {l.jenisAksi} • {l.jamMulai} WIB
                          </div>
                          <div style={{ color: '#64748B', marginTop: '2px' }}>{l.deskripsiKegiatan?.slice(0, 60)}...</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ======================================================== */}
          {/* SCREEN 2: PETA FULLSCREEN                                */}
          {/* ======================================================== */}
          {activeTab === 'view-peta' && (
            <section id="view-peta" className="view active" style={{ position: 'relative', height: '100%', minHeight: '650px' }}>
              <div
                className="floating-header"
                style={{
                  position: 'absolute',
                  top: '16px',
                  left: '16px',
                  zIndex: 1000,
                  background: 'rgba(21,62,117,0.92)',
                  color: 'white',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  fontWeight: 800,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                }}
              >
                PETA RUTE PATROLI WILAYAH
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label
                    style={{
                      fontSize: '11px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      background: 'rgba(255,255,255,0.2)',
                      padding: '6px 10px',
                      borderRadius: '4px',
                    }}
                  >
                    <input
                      type="checkbox"
                      id="toggle-personel"
                      checked={showOtherOfficers}
                      onChange={(e) => setShowOtherOfficers(e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    Lihat Sebaran Personel Lain
                  </label>
                  <label
                    id="container-toggle-traffic"
                    style={{
                      fontSize: '11px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      background: 'rgba(16,185,129,0.3)',
                      border: '1px solid rgba(16,185,129,0.4)',
                      padding: '6px 10px',
                      borderRadius: '4px',
                    }}
                  >
                    <input
                      type="checkbox"
                      id="toggle-traffic"
                      checked={showTraffic}
                      onChange={(e) => setShowTraffic(e.target.checked)}
                      style={{ cursor: 'pointer', accentColor: '#10B981' }}
                    />
                    🚦 Tampilkan Traffic Line (Lalu Lintas)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowHotspotModal(true)}
                    style={{
                      background: 'rgba(220,38,38,0.85)',
                      color: 'white',
                      border: '1px solid rgba(254,202,202,0.4)',
                      padding: '6px 10px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      transition: '0.2s',
                    }}
                  >
                    <span>⚠️</span> Kelola Titik Rawan (CRUD)
                  </button>
                </div>
              </div>

              {/* Real Fullscreen Leaflet Google Roadmap */}
              <SimapresLeafletMap
                mode="fullscreen"
                height="650px"
                myUnit={{
                  key: 'my_unit',
                  pos: currentGps,
                  iconEmoji: '🚔',
                  title: `Patroli Samapta (Unit Anda)`,
                  petugas: `${officer.fullName} (NRP ${officer.nrp})`,
                  sub: `${officer.satuan} • ${officer.kendaraan}`,
                  status: 'Status: SIAGA',
                  statusColor: '#10B981',
                  tugas: 'Tugas: Patroli Rute Beat 1 (SOP Presisi)',
                  telemetri: 'Kecepatan: 35 km/jam • Sinyal GPS Prima',
                }}
                hotspots={hotspots}
                policeOffices={policeOffices}
                fleetUnits={fleetUnits}
                showTraffic={showTraffic}
                showOtherOfficers={showOtherOfficers}
                onSelectUnit={(unit) => setMapUnitDetail(unit)}
                onOpenSos={() => setShowSosModal(true)}
              />

              {/* Floating Unit Detail Popup in Fullscreen */}
              {mapUnitDetail && (
                <div
                  id="modal-map-unit-detail-fs"
                  style={{
                    position: 'absolute',
                    top: '86px',
                    left: '16px',
                    zIndex: 9999,
                    background: '#FFFFFF',
                    borderRadius: '12px',
                    boxShadow: '0 12px 30px rgba(0,0,0,0.25), 0 4px 10px rgba(0,0,0,0.15)',
                    border: '1px solid #CBD5E1',
                    padding: '15px 17px',
                    width: '340px',
                    maxWidth: 'calc(100% - 32px)',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                    pointerEvents: 'auto',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#0284C7', display: 'flex', alignItems: 'center', gap: '7px' }}>
                      <span style={{ fontSize: '16px' }}>{mapUnitDetail.iconEmoji || '🚔'}</span>
                      <span>{mapUnitDetail.title}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMapUnitDetail(null)}
                      style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '16px', fontWeight: 700, cursor: 'pointer', lineHeight: 1, padding: '2px 4px', borderRadius: '4px' }}
                      title="Tutup Detail"
                    >
                      ✕
                    </button>
                  </div>
                  <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#1E293B', lineHeight: 1.3, marginTop: '4px' }}>
                    {mapUnitDetail.petugas}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px', lineHeight: 1.4 }}>
                    {mapUnitDetail.sub}
                  </div>
                  <div style={{ borderTop: '1px solid #E2E8F0', margin: '10px 0 8px 0' }} />
                  <div style={{ fontSize: '13px', fontWeight: 800, color: mapUnitDetail.statusColor || '#10B981' }}>
                    {mapUnitDetail.status}
                  </div>
                  <div style={{ fontSize: '12px', color: '#475569', marginTop: '3px', lineHeight: 1.4 }}>
                    {mapUnitDetail.tugas}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
                    {mapUnitDetail.telemetri}
                  </div>
                </div>
              )}

              {/* Floating Panel Rute & Navigasi Respon Cepat (Muncul saat Menerima Tugas) */}
              {activeComplaint && (
                <div
                  id="panel-navigasi-rute-tkp"
                  style={{
                    position: 'absolute',
                    bottom: '20px',
                    left: '16px',
                    right: '16px',
                    zIndex: 9999,
                    maxWidth: '440px',
                    margin: '0 auto',
                    background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                    color: 'white',
                    borderRadius: '14px',
                    boxShadow: '0 12px 30px rgba(0,0,0,0.45)',
                    border: '1.5px solid #334155',
                    padding: '14px 16px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ display: 'inline-block', width: '10px', height: '10px', background: '#10B981', borderRadius: '50%', boxShadow: '0 0 10px #10B981' }} />
                      <span style={{ fontSize: '12px', fontWeight: 800, color: '#38BDF8', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                        NAVIGASI MENUJU TKP
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => switchTab('view-wizard')}
                      style={{ background: '#1D4ED8', border: 'none', color: 'white', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Buka Wizard ➔
                    </button>
                  </div>

                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#FFFFFF', marginBottom: '4px' }}>
                    {activeComplaint.jenisKejadian}
                  </div>
                  <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span>📍</span> {activeComplaint.tkpAlamatTeks}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 10px' }}>
                      <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 700 }}>RUTE TERCEPAT (ETA)</div>
                      <div style={{ fontSize: '17px', fontWeight: 900, color: '#10B981' }}>± 4 Menit</div>
                      <div style={{ fontSize: '10.5px', color: '#64748B' }}>Jarak: 1.8 km</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 10px' }}>
                      <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 700 }}>TRAFFIC LINE KORIDOR</div>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: '#38BDF8', marginTop: '2px' }}>🟢 Lancar Terkendali</div>
                      <div style={{ fontSize: '10px', color: '#A7F3D0' }}>Prioritas Sirine Biru</div>
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* ======================================================== */}
          {/* SCREEN 3: BUAT LOG (+) / INPUT LOG HARIAN                */}
          {/* ======================================================== */}
          {activeTab === 'view-log' && (
            <section id="view-log" className="view active">
              <h2 className="page-title">INPUT LOG HARIAN</h2>

              {/* 4 Action Type Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', margin: '0 16px 16px' }}>
                {(['PATROLI', 'TPTKP', 'SAMBANG', 'PENGAMANAN'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setLogJenis(t)}
                    style={{
                      padding: '12px 6px',
                      borderRadius: '8px',
                      border: 'none',
                      fontWeight: 800,
                      fontSize: '12px',
                      cursor: 'pointer',
                      background: logJenis === t ? '#153E75' : '#F1F5F9',
                      color: logJenis === t ? 'white' : '#475569',
                      boxShadow: logJenis === t ? '0 2px 8px rgba(21,62,117,0.3)' : 'none',
                    }}
                  >
                    {t === 'PATROLI' && '🚔 PATROLI'}
                    {t === 'TPTKP' && '🛡️ TPTKP'}
                    {t === 'SAMBANG' && '🤝 SAMBANG'}
                    {t === 'PENGAMANAN' && '⚠️ PENGAMANAN'}
                  </button>
                ))}
              </div>

              {/* Rentang Jam Kegiatan */}
              <div className="form-group">
                <label className="form-label">Rentang Jam Kegiatan</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    className="form-control"
                    readOnly
                    value={`${jamMulai} - ${jamSelesai} WIB`}
                    style={{ fontWeight: 700, color: '#153E75' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowTimePicker(true)}
                    style={{
                      padding: '0 16px',
                      background: '#EFF6FF',
                      border: '1px solid #BFDBFE',
                      borderRadius: '8px',
                      fontWeight: 700,
                      color: '#1D4ED8',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    📅 Ubah Jam
                  </button>
                </div>
              </div>

              {/* Lokasi Kegiatan */}
              <div className="form-group">
                <label className="form-label">Lokasi Kegiatan</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Masukkan lokasi atau nama jalan kegiatan..."
                  value={logLokasi}
                  onChange={(e) => setLogLokasi(e.target.value)}
                />
              </div>

              {/* Uraian Kegiatan */}
              <div className="form-group">
                <label className="form-label">Uraian Kegiatan</label>
                <textarea
                  className="form-control"
                  style={{ minHeight: '110px' }}
                  placeholder="Jelaskan rincian giat kepolisian, kondisi kamtibmas, temuan dan tindakan..."
                  value={logDeskripsi}
                  onChange={(e) => setLogDeskripsi(e.target.value)}
                />
              </div>

              {/* Live Camera Attachment */}
              <div className="form-group">
                <label className="form-label">Lampiran Foto (Live Camera)</label>
                <div
                  style={{
                    width: '100%',
                    height: '120px',
                    border: '2px dashed #94A3B8',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#F8FAFC',
                    cursor: 'pointer',
                    fontWeight: 600,
                    color: '#153E75',
                  }}
                  onClick={() => logPhotoInputRef.current?.click()}
                >
                  <input
                    type="file"
                    ref={logPhotoInputRef}
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (re) => setLogFoto(re.target?.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  {logFoto ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img src={logFoto} alt="Preview" style={{ width: '80px', height: '80px', borderRadius: '6px', objectFit: 'cover' }} />
                      <span style={{ color: '#059669', fontWeight: 800 }}>✓ Foto Terpilih</span>
                    </div>
                  ) : (
                    <span>📸 Pilih / Unggah Foto Kegiatan</span>
                  )}
                </div>
              </div>

              <button
                type="button"
                className="btn-blue"
                id="btn-simpan-log"
                onClick={handleSaveLog}
                disabled={isSubmittingLog}
                style={{ background: '#10B981', fontSize: '15px', marginTop: '16px', fontWeight: 800 }}
              >
                {isSubmittingLog ? 'Mengirim Log Kegiatan...' : 'Kirim Log Kegiatan'}
              </button>
            </section>
          )}

          {/* ======================================================== */}
          {/* SCREEN 4: VALIDASI (DAFTAR PENUGASAN LAPANGAN)          */}
          {/* ======================================================== */}
          {activeTab === 'view-validasi' && (
            <section id="view-validasi" className="view active">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '16px 16px 8px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 className="page-title" style={{ margin: 0 }} id="val-page-title">
                      Daftar Penugasan Lapangan
                    </h2>
                    <span style={{ fontSize: '10px', fontWeight: 800, background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0', padding: '2px 8px', borderRadius: '12px' }}>
                      TUGAS OPERASIONAL LAPANGAN
                    </span>
                  </div>
                  <div className="page-subtitle" style={{ margin: '2px 0 0', color: '#64748B', fontSize: '12px' }}>
                    Monitoring Penugasan Lapangan: Respon TKP, Pengisian BAP &amp; Pengajuan Pengesahan
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    onClick={() => switchTab('view-beranda')}
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#153E75',
                      cursor: 'pointer',
                      background: '#F1F5F9',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span>🏠</span> Beranda
                  </div>
                </div>
              </div>

              {/* Status Filter Tabs */}
              <div className="val-filter-tabs">
                <button
                  type="button"
                  className={`val-tab-btn ${validasiFilter === 'semua' ? 'active' : ''}`}
                  onClick={() => setValidasiFilter('semua')}
                >
                  Semua Tugas Saya <span className="val-tab-badge">{complaints.length}</span>
                </button>
                <button
                  type="button"
                  className={`val-tab-btn ${validasiFilter === 'diproses' ? 'active' : ''}`}
                  onClick={() => setValidasiFilter('diproses')}
                >
                  Sedang Ditangani{' '}
                  <span className="val-tab-badge primary">
                    {complaints.filter((c) => c.status !== 'SELESAI').length}
                  </span>
                </button>
                <button
                  type="button"
                  className={`val-tab-btn ${validasiFilter === 'menunggu_pengesahan' ? 'active' : ''}`}
                  onClick={() => setValidasiFilter('menunggu_pengesahan')}
                >
                  Menunggu Pengesahan{' '}
                  <span className="val-tab-badge purple">
                    {complaints.filter((c) => c.status === 'PENANGANAN_TKP').length}
                  </span>
                </button>
              </div>

              {/* Filter Platform */}
              <div
                style={{
                  background: 'white',
                  border: '1px solid #E2E8F0',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  margin: '6px 16px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>
                  📡 PLATFORM:
                </span>
                <button
                  type="button"
                  onClick={() => setPlatformFilter('all')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    background: platformFilter === 'all' ? '#0F172A' : '#F1F5F9',
                    color: platformFilter === 'all' ? 'white' : '#475569',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Semua
                </button>
                <button
                  type="button"
                  onClick={() => setPlatformFilter('sos')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: '1px solid #FECACA',
                    background: platformFilter === 'sos' ? '#DC2626' : '#FEF2F2',
                    color: platformFilter === 'sos' ? 'white' : '#DC2626',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  🚨 SOS Panik
                </button>
                <button
                  type="button"
                  onClick={() => setPlatformFilter('warga')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: '1px solid #BAE6FD',
                    background: platformFilter === 'warga' ? '#0284C7' : '#F0F9FF',
                    color: platformFilter === 'warga' ? 'white' : '#0284C7',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  📱 Portal Warga
                </button>
                <button
                  type="button"
                  onClick={() => setPlatformFilter('layanan110')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: '1px solid #BFDBFE',
                    background: platformFilter === 'layanan110' ? '#1D4ED8' : '#EFF6FF',
                    color: platformFilter === 'layanan110' ? 'white' : '#1D4ED8',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  📞 Layanan 110
                </button>
              </div>

              {/* Split Layout: List Left & Detail Right */}
              <div className="split-layout">
                {/* Task List */}
                <div className="val-list">
                  {filteredTasks.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', color: '#64748B', fontSize: '12px' }}>
                      Tidak ada penugasan aktif pada kategori ini.
                    </div>
                  ) : (
                    filteredTasks.map((t) => (
                      <div
                        key={t.id}
                        className={`val-card ${selectedTask?.id === t.id ? 'selected' : ''}`}
                        onClick={() => setSelectedTask(t)}
                      >
                        <div className="val-user">
                          {t.fotoBuktiUrl ? (
                            <img src={t.fotoBuktiUrl} alt="Task" />
                          ) : (
                            <div style={{ width: '36px', height: '36px', borderRadius: '6px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>🚨</div>
                          )}
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '13px', color: '#0F172A' }}>
                              {t.jenisKejadian}
                            </div>
                            <div style={{ fontSize: '10.5px', fontFamily: 'monospace', color: '#2563EB' }}>
                              {t.nomorTiket}
                            </div>
                          </div>
                        </div>
                        <div className="val-text">
                          📍 {t.tkpAlamatTeks} • <strong>Pelapor:</strong> {t.namaPelapor} ({t.noHpPelapor})
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 800,
                              background: t.status === 'SELESAI' ? '#DCFCE7' : '#FEF3C7',
                              color: t.status === 'SELESAI' ? '#166534' : '#92400E',
                              padding: '2px 8px',
                              borderRadius: '4px',
                            }}
                          >
                            {t.status}
                          </span>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: '#153E75' }}>Rincian ➔</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Task Detail Panel Right */}
                <div className="val-detail">
                  {selectedTask ? (
                    <div>
                      {/* Incident Meta Details Card */}
                      <div className="incident-meta-card">
                        <div className="incident-meta-top">
                          <div>
                            <div className="incident-meta-label">Nomor Laporan</div>
                            <div className="incident-meta-val" style={{ color: '#153E75', fontFamily: 'monospace', fontSize: '13px', fontWeight: 800 }}>
                              {selectedTask.nomorTiket}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div className="incident-meta-label">Waktu Lapor</div>
                            <div className="incident-meta-val" style={{ fontSize: '12px' }}>
                              {selectedTask.waktuLapor ? new Date(selectedTask.waktuLapor).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB' : '-'}
                            </div>
                          </div>
                        </div>
                        <div style={{ fontSize: '12px', marginBottom: '6px' }}>
                          <span style={{ color: '#64748B' }}>Jenis Insiden:</span> <strong>{selectedTask.jenisKejadian}</strong>
                        </div>
                        <div style={{ fontSize: '12px', marginBottom: '10px' }}>
                          <span style={{ color: '#64748B' }}>Lokasi TKP:</span> <strong>{selectedTask.tkpAlamatTeks}</strong>
                        </div>

                        {/* Foto Bukti Laporan Warga with Lightbox */}
                        {selectedTask.fotoBuktiUrl ? (
                          <div
                            style={{ position: 'relative', marginTop: '8px', borderRadius: '8px', overflow: 'hidden', background: '#0F172A', cursor: 'pointer' }}
                            onClick={() =>
                              setLightboxFoto({
                                src: selectedTask.fotoBuktiUrl,
                                title: `Dokumentasi TKP - ${selectedTask.nomorTiket}`,
                                meta: selectedTask.tkpAlamatTeks,
                              })
                            }
                            title="Klik untuk perbesar foto"
                          >
                            <img
                              src={selectedTask.fotoBuktiUrl}
                              alt="Bukti Laporan"
                              style={{ width: '100%', height: '140px', objectFit: 'cover', display: 'block' }}
                            />
                            <div
                              style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 40%)',
                                display: 'flex',
                                alignItems: 'flex-end',
                                justifyContent: 'space-between',
                                padding: '8px 10px',
                                color: 'white',
                                fontSize: '10px',
                                fontWeight: 700,
                              }}
                            >
                              <span>🔍 Klik untuk Perbesar</span>
                            </div>
                          </div>
                        ) : (
                          <div style={{ padding: '16px', background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: '8px', textAlign: 'center', color: '#94A3B8', fontSize: '12px', marginTop: '8px' }}>
                            📷 Tidak ada foto bukti yang dilampirkan
                          </div>
                        )}
                      </div>

                      {/* 5-Step Vertical Timeline */}
                      <div className="timeline">
                        <div className="tl-item">
                          <div className="tl-dot" />
                          <div className="tl-time">Tahap 1: Laporan Diterima Operator SPKT</div>
                          <div className="tl-desc">Laporan diverifikasi &amp; diteruskan ke antrean Pawas</div>
                        </div>
                        <div className="tl-item">
                          <div className="tl-dot" />
                          <div className="tl-time">Tahap 2: Arahan &amp; Disposisi Pawas</div>
                          <div className="tl-desc">Instruksi: {selectedTask.arahanPawas || 'Meluncur ke TKP'}</div>
                        </div>
                        <div className="tl-item">
                          <div className={`tl-dot ${selectedTask.status !== 'DISPOSISI' ? '' : 'yellow'}`} />
                          <div className="tl-time">Tahap 3: Personel Bergerak Menuju TKP</div>
                          <div className="tl-desc">Lampu sirine biru dinyalakan, target respon &lt; 10 menit</div>
                        </div>
                        <div className="tl-item">
                          <div className={`tl-dot ${selectedTask.status === 'PENANGANAN_TKP' || selectedTask.status === 'SELESAI' ? '' : 'blue'}`} />
                          <div className="tl-time">Tahap 4: Tindakan Pertama di TKP (TPTKP)</div>
                          <div className="tl-desc">Pengamanan perimeter, mediasi &amp; pengumpulan bukti</div>
                        </div>
                        <div className="tl-item">
                          <div className={`tl-dot ${selectedTask.status === 'SELESAI' ? '' : 'purple'}`} />
                          <div className="tl-time">Tahap 5: Penanganan Tuntas &amp; BAP Sah</div>
                          <div className="tl-desc">Laporan disetujui Pawas &amp; evaluasi IKM publik</div>
                        </div>
                      </div>

                      {/* Action Button */}
                      {selectedTask.status !== 'SELESAI' && (
                        <button
                          type="button"
                          className="btn-blue"
                          style={{ margin: '14px 0 0 0', width: '100%', background: '#153E75' }}
                          onClick={() => {
                            setActiveComplaint(selectedTask);
                            switchTab('view-wizard');
                          }}
                        >
                          ⚡ Buka Wizard Penanganan Kasus Ini ➔
                        </button>
                      )}
                    </div>
                  ) : (
                    <div style={{ padding: '24px', textAlign: 'center', color: '#64748B', fontSize: '12px' }}>
                      Pilih penugasan di sebelah kiri untuk melihat rincian alur penanganan.
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* ======================================================== */}
          {/* SCREEN 5: KINERJA / LAPORAN AKHIR TUGAS                  */}
          {/* ======================================================== */}
          {activeTab === 'view-laporan' && (
            <section id="view-laporan" className="view active">
              <h2 className="page-title">Laporan Akhir Tugas</h2>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', padding: '0 16px' }}>
                <div className="tabs-segmented" style={{ margin: 0, flexGrow: 1, marginRight: '12px' }}>
                  <div
                    className={`tab-seg ${kpiPeriod === 'harian' ? 'active' : ''}`}
                    onClick={() => setKpiPeriod('harian')}
                  >
                    Harian
                  </div>
                  <div
                    className={`tab-seg ${kpiPeriod === 'mingguan' ? 'active' : ''}`}
                    onClick={() => setKpiPeriod('mingguan')}
                  >
                    Mingguan
                  </div>
                  <div
                    className={`tab-seg ${kpiPeriod === 'bulanan' ? 'active' : ''}`}
                    onClick={() => setKpiPeriod('bulanan')}
                  >
                    Bulanan
                  </div>
                </div>
                <input
                  type="date"
                  className="form-control"
                  style={{ width: '140px', padding: '8px', fontSize: '12px', background: 'white', fontWeight: 'bold', color: '#153E75' }}
                  defaultValue={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Charts Grid */}
              {(() => {
                const totalLogs = logbooks.length;
                const approvedLogs = logbooks.filter((l) => (l.statusValidasi || '').toUpperCase() === 'DISETUJUI').length;
                const pendingLogs = logbooks.filter((l) => !l.statusValidasi || (l.statusValidasi || '').toUpperCase() === 'MENUNGGU').length;
                const rejectedLogs = logbooks.filter((l) => (l.statusValidasi || '').toUpperCase() === 'DITOLAK').length;
                const patroliCount = logbooks.filter((l) => (l.jenisAksi || '').toUpperCase() === 'PATROLI').length;
                const tptkpCount = logbooks.filter((l) => (l.jenisAksi || '').toUpperCase() === 'TPTKP').length;
                const sambangCount = logbooks.filter((l) => (l.jenisAksi || '').toUpperCase() === 'SAMBANG').length;
                const pengamananCount = logbooks.filter((l) => (l.jenisAksi || '').toUpperCase() === 'PENGAMANAN').length;

                return (
                  <>
                    <div className="charts-grid">
                      <div className="chart-card">
                        <div className="chart-title">Distribusi Jenis Kegiatan</div>
                        <div className="chart-canvas" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ fontSize: '12px', color: '#64748B', textAlign: 'center' }}>
                            🚔 Patroli: <strong>{patroliCount}</strong> | 🛡️ TPTKP: <strong>{tptkpCount}</strong><br />
                            🤝 Sambang: <strong>{sambangCount}</strong> | ⚠️ Pengamanan: <strong>{pengamananCount}</strong>
                          </div>
                        </div>
                      </div>
                      <div className="chart-card">
                        <div className="chart-title">Status Validasi Log</div>
                        <div className="chart-canvas" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ fontSize: '12px', color: '#059669', textAlign: 'center' }}>
                            ✅ <strong>{approvedLogs}</strong> Disetujui Pawas<br />
                            ⏳ <strong>{pendingLogs}</strong> Menunggu Review
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Stats Row */}
                    <div className="stats-row" style={{ marginTop: '16px' }}>
                      <div className="stats-col">
                        <div className="stat-item">
                          <span>Total Log Kirim</span> <span style={{ color: '#153E75', fontWeight: 800 }}>{totalLogs}</span>
                        </div>
                        <div className="stat-item">
                          <span>Log Disetujui</span> <span style={{ color: '#10B981', fontWeight: 800 }}>{approvedLogs}</span>
                        </div>
                      </div>
                      <div className="stats-col">
                        <div className="stat-item">
                          <span>Log Menunggu</span> <span style={{ color: '#F59E0B', fontWeight: 800 }}>{pendingLogs}</span>
                        </div>
                        <div className="stat-item">
                          <span>Log Ditolak</span> <span style={{ color: '#EF4444', fontWeight: 800 }}>{rejectedLogs}</span>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}

              <div style={{ padding: '0 16px 20px' }}>
                <button
                  type="button"
                  className="btn-blue"
                  onClick={() => alert('Mengekspor berkas laporan akuntabilitas tugas ke PDF...')}
                  style={{ width: '100%', margin: 0 }}
                >
                  🖨️ Cetak / Ekspor Laporan Akhir Tugas (PDF)
                </button>
              </div>
            </section>
          )}

          {/* ======================================================== */}
          {/* SCREEN 6: PROFIL PENGGUNA                                */}
          {/* ======================================================== */}
          {activeTab === 'view-profil' && (
            <section id="view-profil" className="view active" style={{ paddingBottom: '95px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 20px',
                  borderBottom: '1px solid #E2E8F0',
                  background: '#FFFFFF',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 className="page-title" style={{ margin: 0, fontSize: '18px' }}>
                      Profil Petugas
                    </h2>
                    <span style={{ background: '#EFF6FF', color: '#1D4ED8', fontSize: '11px', fontWeight: 800, padding: '3px 10px', borderRadius: '12px', border: '1px solid #DBEAFE' }}>
                      LAPANGAN
                    </span>
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
                    Sentra Pelayanan Kepolisian Terpadu (SPKT) • SIMAPRES
                  </div>
                </div>
              </div>

              <div style={{ margin: '20px auto', padding: '0 16px' }}>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', justifyContent: 'center', flexWrap: 'wrap' }}>
                  {/* Left Column: Identitas, Presensi, Pengaturan */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, minWidth: '320px', maxWidth: '460px' }}>
                    {/* Kartu Identitas Petugas */}
                    <div
                      style={{
                        background: 'linear-gradient(135deg, #0F2D56 0%, #153E75 60%, #1E3A8A 100%)',
                        borderRadius: '16px',
                        padding: '20px',
                        color: 'white',
                        boxShadow: '0 12px 24px -4px rgba(21,62,117,0.3)',
                        border: '1px solid rgba(255,255,255,0.15)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '16px' }}>🛡️</span>
                          <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.8px', color: '#FDE68A' }}>
                            POLRES METRO JAKARTA
                          </span>
                        </div>
                        <span style={{ fontSize: '9.5px', fontWeight: 800, background: 'rgba(16,185,129,0.25)', color: '#6EE7B7', border: '1px solid rgba(110,231,183,0.3)', padding: '2px 8px', borderRadius: '12px' }}>
                          SIAGA PIKET AKTIF
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '16px' }}>
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                          <img
                            src={officer.avatar}
                            alt="Avatar"
                            style={{ width: '76px', height: '76px', borderRadius: '12px', objectFit: 'cover', border: '2.5px solid #FBBF24', boxShadow: '0 6px 14px rgba(0,0,0,0.35)' }}
                          />
                          <div
                            style={{ position: 'absolute', bottom: '-2px', right: '-2px', background: '#10B981', width: '14px', height: '14px', borderRadius: '50%', border: '2px solid #0F2D56' }}
                            title="Aktif Berdinas"
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#93C5FD', textTransform: 'uppercase' }}>
                            {officer.pangkat}
                          </div>
                          <h3 style={{ fontSize: '17px', color: '#FFFFFF', fontWeight: 800, margin: '2px 0 3px', lineHeight: 1.2 }}>
                            {officer.fullName}
                          </h3>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: '#FDE68A', fontFamily: 'monospace' }}>
                            NRP: {officer.nrp}
                          </div>
                          <div style={{ fontSize: '10.5px', color: '#E2E8F0', marginTop: '3px' }}>
                            {officer.satuan}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', background: 'rgba(0,0,0,0.25)', padding: '10px', borderRadius: '10px', textAlign: 'center' }}>
                        <div>
                          <div style={{ fontSize: '9.5px', color: '#94A3B8', fontWeight: 600 }}>Total Laporan</div>
                          <div style={{ fontSize: '15px', fontWeight: 900, color: '#FBBF24' }}>142</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '9.5px', color: '#94A3B8', fontWeight: 600 }}>Respon SLA</div>
                          <div style={{ fontSize: '15px', fontWeight: 900, color: '#34D399' }}>96.4%</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '9.5px', color: '#94A3B8', fontWeight: 600 }}>Tuntas</div>
                          <div style={{ fontSize: '15px', fontWeight: 900, color: '#60A5FA' }}>138</div>
                        </div>
                      </div>
                    </div>

                    {/* Kartu Presensi Petugas */}
                    <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '18px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '18px' }}>⏱️</span>
                          <div>
                            <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: 800, color: '#1E293B' }}>Presensi Piket</h4>
                            <div style={{ fontSize: '11px', color: '#64748B' }}>Pencatatan Kehadiran Tugas Piket</div>
                          </div>
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 800, color: '#153E75', fontFamily: 'monospace', background: '#EFF6FF', padding: '3px 8px', borderRadius: '6px' }}>
                          {liveClock || '08:00 WIB'}
                        </span>
                      </div>

                      <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '12px', marginBottom: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '11.5px' }}>
                          <span style={{ color: '#64748B' }}>Status Kehadiran:</span>
                          <span style={{ fontWeight: 800, color: '#15803D', background: '#DCFCE7', padding: '2px 8px', borderRadius: '6px' }}>
                            ● Dinas Aktif
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '6px' }}>
                          <span style={{ color: '#64748B' }}>Jam Masuk Piket:</span>
                          <span style={{ fontWeight: 700, color: '#1E293B' }}>{presensiMasukTime}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}>
                          <span style={{ color: '#64748B' }}>Jam Pulang / Lepas:</span>
                          <span style={{ fontWeight: 700, color: '#64748B' }}>{presensiPulangTime || 'Belum Presensi'}</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                          type="button"
                          onClick={() => alert('✓ Presensi Masuk telah terekam di sistem.')}
                          style={{
                            flex: 1,
                            padding: '11px 12px',
                            background: '#10B981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 800,
                            fontSize: '12.5px',
                            cursor: 'pointer',
                          }}
                        >
                          ✅ Presensi Masuk
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowPresensiPulangModal(true)}
                          style={{
                            flex: 1,
                            padding: '11px 12px',
                            background: '#EF4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 800,
                            fontSize: '12.5px',
                            cursor: 'pointer',
                          }}
                        >
                          🚪 Presensi Pulang
                        </button>
                      </div>
                    </div>

                    {/* Kartu Pengaturan Akun */}
                    <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '6px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                      <div style={{ padding: '10px 6px 6px', fontSize: '12px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', borderBottom: '1px solid #F1F5F9' }}>
                        Pengaturan Akun Petugas
                      </div>
                      <div
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 6px', cursor: 'pointer' }}
                        onClick={async () => {
                          if (confirm('Akhiri sesi dinas lapangan personil?')) {
                            if (typeof window !== 'undefined') {
                              sessionStorage.removeItem('simapres_active_user');
                            }
                            await logoutAction();
                            window.location.href = '/?alert=logged_out';
                          }
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '16px' }}>🚪</span>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 800, color: '#EF4444' }}>Logout / Keluar Sesi Dinas</div>
                            <div style={{ fontSize: '11px', color: '#F87171' }}>Akhiri sesi dan kembali ke halaman login</div>
                          </div>
                        </div>
                        <span style={{ color: '#EF4444', fontSize: '13px' }}>➔</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Riwayat Log Lengkap */}
                  <div style={{ flex: 1.2, minWidth: '320px' }}>
                    <div className="card-panel">
                      <div className="card-title">RIWAYAT PENUGASAN SAYA</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {complaints.length === 0 ? (
                          <div style={{ padding: '20px', textAlign: 'center', color: '#64748B', fontSize: '12px' }}>
                            Belum ada riwayat penugasan tercatat.
                          </div>
                        ) : (
                          complaints.map((c) => (
                            <div
                              key={c.id}
                              style={{
                                background: '#F8FAFC',
                                border: '1px solid #E2E8F0',
                                borderRadius: '10px',
                                padding: '12px',
                                cursor: 'pointer',
                              }}
                              onClick={() => setSelectedLogDetail(c)}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#153E75', fontSize: '12px' }}>
                                  {c.nomorTiket}
                                </span>
                                <span
                                  style={{
                                    fontSize: '9.5px',
                                    fontWeight: 800,
                                    background: c.status === 'SELESAI' ? '#DCFCE7' : '#FEF3C7',
                                    color: c.status === 'SELESAI' ? '#15803D' : '#92400E',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                  }}
                                >
                                  {c.status}
                                </span>
                              </div>
                              <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B' }}>{c.jenisKejadian}</div>
                              <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>📍 {c.tkpAlamatTeks}</div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ======================================================== */}
          {/* SCREEN 7: WIZARD PENANGANAN KASUS                        */}
          {/* ======================================================== */}
          {activeTab === 'view-wizard' && activeComplaint && (
            <section id="view-wizard" className="view active">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '16px 16px 8px' }}>
                <div
                  onClick={() => switchTab('view-beranda')}
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#153E75',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    background: '#EFF6FF',
                    border: '1px solid #BFDBFE',
                  }}
                >
                  <span>←</span> Kembali ke Beranda
                </div>
                <span style={{ fontSize: '11px', background: '#EDE9FE', color: '#6D28D9', fontWeight: 700, padding: '5px 12px', borderRadius: '20px' }}>
                  ⚡ Tahap {wizardStep} dari 3
                </span>
              </div>

              <h2 className="page-title" style={{ marginTop: '6px', marginBottom: '4px' }}>
                Wizard Penanganan Kasus
              </h2>
              <div className="page-subtitle" style={{ marginBottom: '8px' }}>
                ID Kasus: {activeComplaint.nomorTiket} • {activeComplaint.jenisKejadian}
              </div>

              {/* Step 1: Meluncur ke TKP */}
              <div className="card-panel" style={{ margin: '0 16px 16px' }}>
                <div style={{ fontWeight: 800, fontSize: '14px', marginBottom: '12px', color: '#153E75' }}>
                  1. Persiapan Meluncur Menuju TKP
                </div>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px', marginBottom: '14px', fontSize: '12px' }}>
                  <div><strong>Lokasi TKP:</strong> {activeComplaint.tkpAlamatTeks}</div>
                  <div style={{ marginTop: '4px' }}><strong>Pelapor:</strong> {activeComplaint.namaPelapor} ({activeComplaint.noHpPelapor})</div>
                  <div style={{ marginTop: '4px' }}><strong>Arahan Pawas:</strong> {activeComplaint.arahanPawas || '-'}</div>
                </div>

                <div className="form-group" style={{ margin: 0, marginBottom: '12px' }}>
                  <label className="form-label">Catatan Persiapan Meluncur</label>
                  <textarea
                    className="form-control"
                    placeholder="Contoh: Ranmor dinas siap, 2 personel meluncur dengan lampu rotator biru..."
                    value={wizardCatatan}
                    onChange={(e) => setWizardCatatan(e.target.value)}
                  />
                </div>

                <button
                  type="button"
                  className="btn-blue"
                  disabled={isUpdatingStep}
                  onClick={() => handleWizardSubmit('meluncur')}
                  style={{ margin: 0, width: '100%', background: '#2563EB', fontWeight: 800 }}
                >
                  {isUpdatingStep ? 'Memproses...' : 'Meluncur ke Lokasi TKP ➔'}
                </button>
              </div>

              {/* Step 2: Penanganan di TKP */}
              <div className="card-panel" style={{ margin: '0 16px 16px' }}>
                <div style={{ fontWeight: 800, fontSize: '14px', marginBottom: '12px', color: '#153E75' }}>
                  2. Tiba &amp; Penanganan Pertama di TKP (TPTKP)
                </div>
                <button
                  type="button"
                  className="btn-blue"
                  disabled={isUpdatingStep}
                  onClick={() => handleWizardSubmit('tiba_tkp')}
                  style={{ margin: 0, width: '100%', background: '#D97706', fontWeight: 800 }}
                >
                  {isUpdatingStep ? 'Memproses...' : 'Konfirmasi Tiba di TKP (Update Status) ➔'}
                </button>
              </div>

              {/* Step 3: Selesai Penanganan */}
              <div className="card-panel" style={{ margin: '0 16px 16px' }}>
                <div style={{ fontWeight: 800, fontSize: '14px', marginBottom: '12px', color: '#153E75' }}>
                  3. Penyelesaian Penanganan &amp; BAP
                </div>
                <button
                  type="button"
                  className="btn-blue"
                  disabled={isUpdatingStep}
                  onClick={() => handleWizardSubmit('selesai')}
                  style={{ margin: 0, width: '100%', background: '#059669', fontWeight: 800 }}
                >
                  {isUpdatingStep ? 'Memproses...' : 'Penanganan Selesai &amp; Ajukan Pengesahan Pawas ➔'}
                </button>
              </div>
            </section>
          )}
        </main>

        {/* BOTTOM NAVIGATION */}
        <nav className="bottom-nav">
          <div
            className={`nav-item ${activeTab === 'view-beranda' ? 'active' : ''}`}
            onClick={() => switchTab('view-beranda')}
          >
            <span className="nav-icon">🏠</span>
            <span>Beranda</span>
          </div>
          <div
            className={`nav-item ${activeTab === 'view-peta' ? 'active' : ''}`}
            onClick={() => switchTab('view-peta')}
          >
            <span className="nav-icon">🗺️</span>
            <span>Peta</span>
          </div>
          <div
            id="nav-log"
            className={`nav-item ${activeTab === 'view-log' ? 'active' : ''}`}
            onClick={() => switchTab('view-log')}
          >
            <span className="nav-icon">➕</span>
            <span>Buat Pengaduan (+)</span>
          </div>
          <div
            id="nav-kinerja"
            className={`nav-item ${activeTab === 'view-laporan' ? 'active' : ''}`}
            onClick={() => switchTab('view-laporan')}
          >
            <span className="nav-icon">📊</span>
            <span>Kinerja</span>
          </div>
          <div
            className={`nav-item ${activeTab === 'view-profil' ? 'active' : ''}`}
            onClick={() => switchTab('view-profil')}
          >
            <span className="nav-icon">👤</span>
            <span>Profil</span>
          </div>
        </nav>
      </div>

      {/* ======================================================== */}
      {/* MODALS SINKRONISASI PROTOYPE                            */}
      {/* ======================================================== */}

      {/* MODAL SOS DARURAT */}
      {showSosModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            background: 'rgba(15,23,42,0.85)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setShowSosModal(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '14px',
              maxWidth: '390px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(220,38,38,0.4)',
              borderTop: '6px solid #DC2626',
              padding: '22px',
              textAlign: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: '42px', lineHeight: 1, marginBottom: '10px' }}>🚨</div>
            <div style={{ fontSize: '16px', fontWeight: 900, color: '#991B1B' }}>KIRIM SINYAL DARURAT (SOS)?</div>
            <div style={{ fontSize: '12px', color: '#475569', marginTop: '8px', lineHeight: 1.5 }}>
              Sinyal darurat prioritas tinggi beserta koordinat GPS lokasi ranmor Anda akan dibunyikan langsung di Command Center Pawas dan disiarkan ke seluruh unit patroli terdekat!
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                type="button"
                onClick={() => setShowSosModal(false)}
                style={{ flex: 1, background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#475569', padding: '10px', borderRadius: '8px', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  alert('⚡ Sinyal SOS Darurat Berhasil Ditransmisikan ke Command Center!');
                  setShowSosModal(false);
                }}
                style={{ flex: 1.4, background: '#DC2626', border: 'none', color: 'white', padding: '10px', borderRadius: '8px', fontWeight: 800, fontSize: '12px', cursor: 'pointer' }}
              >
                ⚡ Kirim SOS Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KPI DETAIL */}
      {showKpiModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            background: 'rgba(15,23,42,0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setShowKpiModal(false)}
        >
          <div
            style={{ background: 'white', borderRadius: '14px', maxWidth: '440px', width: '100%', overflow: 'hidden' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ background: '#153E75', color: 'white', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>📊</span>
                <div style={{ fontSize: '13px', fontWeight: 800 }}>RINCIAN CAPAIAN KPI PRESISI</div>
              </div>
              <button
                type="button"
                onClick={() => setShowKpiModal(false)}
                style={{ background: 'none', border: 'none', color: 'white', fontSize: '16px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '12px 14px', marginBottom: '14px' }}>
                <div style={{ fontSize: '32px', fontWeight: 900, color: '#059669' }}>{officer.kpi || 0}%</div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#1E293B' }}>
                    PREDIKAT: {(officer.kpi || 0) >= 90 ? 'SANGAT BAIK (A)' : (officer.kpi || 0) >= 80 ? 'BAIK (B)' : (officer.kpi || 0) >= 70 ? 'CUKUP (C)' : 'DALAM PENILAIAN'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>Berdasarkan rekam jejak respon & kepatuhan SOP lapangan.</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #F1F5F9' }}>
                  <span>⚡ Kecepatan Respon TKP (&lt; 10m)</span>
                  <strong style={{ color: '#059669' }}>96%</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #F1F5F9' }}>
                  <span>📸 Kelengkapan Berkas &amp; Geo-tag</span>
                  <strong style={{ color: '#059669' }}>90%</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #F1F5F9' }}>
                  <span>⭐ Kepuasan Pelayanan Publik (IKM)</span>
                  <strong style={{ color: '#059669' }}>4.9 / 5.0</strong>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowKpiModal(false)}
                style={{ width: '100%', marginTop: '16px', background: '#153E75', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}
              >
                Tutup Rincian
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TIMEPICKER LOG */}
      {showTimePicker && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            background: 'rgba(15,23,42,0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setShowTimePicker(false)}
        >
          <div
            style={{ background: 'white', borderRadius: '14px', maxWidth: '390px', width: '100%', overflow: 'hidden', borderTop: '5px solid #153E75' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '16px 20px 14px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#1E293B' }}>📅 Pilih Rentang Jam Kegiatan</div>
              <button type="button" onClick={() => setShowTimePicker(false)} style={{ background: 'none', border: 'none', fontSize: '18px', color: '#94A3B8', cursor: 'pointer' }}>
                &times;
              </button>
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '5px' }}>🕒 Jam Mulai</label>
                  <input
                    type="time"
                    value={jamMulai}
                    onChange={(e) => setJamMulai(e.target.value)}
                    style={{ width: '100%', padding: '10px', border: '1.5px solid #CBD5E1', borderRadius: '8px', fontSize: '15px', fontWeight: 700, textAlign: 'center' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '5px' }}>🕒 Jam Selesai</label>
                  <input
                    type="time"
                    value={jamSelesai}
                    onChange={(e) => setJamSelesai(e.target.value)}
                    style={{ width: '100%', padding: '10px', border: '1.5px solid #CBD5E1', borderRadius: '8px', fontSize: '15px', fontWeight: 700, textAlign: 'center' }}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTimePicker(false)}
                style={{ width: '100%', padding: '11px', background: '#153E75', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '13px', cursor: 'pointer' }}
              >
                Gunakan Rentang Jam Ini
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PRESENSI PULANG */}
      {showPresensiPulangModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            background: 'rgba(15,23,42,0.8)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setShowPresensiPulangModal(false)}
        >
          <div
            style={{ background: 'white', borderRadius: '14px', maxWidth: '440px', width: '100%', overflow: 'hidden' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ background: '#DC2626', color: 'white', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '15px', fontWeight: 800 }}>Konfirmasi Presensi Pulang</div>
              <button type="button" onClick={() => setShowPresensiPulangModal(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '18px', cursor: 'pointer' }}>
                ✕
              </button>
            </div>
            <div style={{ padding: '20px', fontSize: '12.5px' }}>
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '12px', marginBottom: '14px', color: '#991B1B' }}>
                Pastikan seluruh laporan dinas telah diperbarui statusnya sebelum apel serah terima piket.
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowPresensiPulangModal(false)}
                  style={{ flex: 1, padding: '10px', background: '#F1F5F9', border: 'none', borderRadius: '8px', fontWeight: 700 }}
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
                    setPresensiPulangTime(now);
                    alert(`✓ Presensi Pulang berhasil terekam pukul ${now}!`);
                    setShowPresensiPulangModal(false);
                  }}
                  style={{ flex: 1.5, padding: '10px', background: '#DC2626', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 800 }}
                >
                  ✓ Konfirmasi Pulang
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX FOTO */}
      {lightboxFoto && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            background: 'rgba(15,23,42,0.85)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setLightboxFoto(null)}
        >
          <div
            style={{ background: 'white', borderRadius: '12px', maxWidth: '550px', width: '100%', overflow: 'hidden' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
              <div style={{ fontWeight: 800, fontSize: '13px' }}>{lightboxFoto.title}</div>
              <button type="button" onClick={() => setLightboxFoto(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>
                ✕
              </button>
            </div>
            <img src={lightboxFoto.src} alt="Bukti" style={{ width: '100%', height: 'auto', maxHeight: '380px', objectFit: 'contain', background: '#0F172A' }} />
            <div style={{ padding: '12px 16px', fontSize: '11.5px', color: '#64748B' }}>
              {lightboxFoto.meta} • <strong>✓ Terverifikasi Satelit GPS</strong>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CRUD TITIK RAWAN */}
      {showHotspotModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            background: 'rgba(15,23,42,0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setShowHotspotModal(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '14px',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ background: '#1E293B', color: 'white', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>🔴</span>
                <div style={{ fontSize: '15px', fontWeight: 800 }}>MANAJEMEN TITIK RAWAN KAMTIBMAS</div>
              </div>
              <button type="button" onClick={() => setShowHotspotModal(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '18px', cursor: 'pointer' }}>
                ✕
              </button>
            </div>

            <div style={{ padding: '12px 20px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '12px', fontWeight: 700 }}>
                Hotspot Aktif: <strong style={{ color: '#EF4444' }}>{hotspots.length}</strong>
              </div>
              <button
                type="button"
                onClick={() => setShowHotspotAddForm(!showHotspotAddForm)}
                style={{ background: '#153E75', color: 'white', border: 'none', padding: '7px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}
              >
                {showHotspotAddForm ? '✕ Tutup Form' : '➕ Tambah Titik Rawan'}
              </button>
            </div>

            <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1 }}>
              {showHotspotAddForm && (
                <div style={{ background: '#FFF7ED', border: '1.5px solid #FDBA74', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ fontWeight: 800, fontSize: '13px', color: '#9A3412' }}>➕ TAMBAH TITIK RAWAN BARU</div>
                    <button type="button" onClick={() => setShowHotspotAddForm(false)} style={{ background: 'none', border: 'none', color: '#9A3412', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>✕ Batal</button>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>🔍 Cari Alamat / Lokasi Rawan *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Nama jalan / kawasan (Cth: Kemang, Tebet, Senayan)..."
                        value={newHotspotTitle}
                        onChange={(e) => setNewHotspotTitle(e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Wilayah / Polsek Pengampu *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Contoh: Polsek Tebet / Sektor Timur"
                        value={newHotspotWilayah}
                        onChange={(e) => setNewHotspotWilayah(e.target.value)}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Kategori Kerawanan *</label>
                      <select
                        className="form-control"
                        value={newHotspotKategori}
                        onChange={(e) => setNewHotspotKategori(e.target.value)}
                      >
                        <option value="Rawan Tawuran Warga & Gesekan Kelompok">Rawan Tawuran Warga & Gesekan Kelompok</option>
                        <option value="Rawan Tawuran Pelajar Ber-sajam">Rawan Tawuran Pelajar Ber-sajam</option>
                        <option value="Rawan Balap Liar & Gangguan Knalpot Brong">Rawan Balap Liar & Gangguan Knalpot</option>
                        <option value="Rawan Curas, Curat & Begal Jalanan (3C)">Rawan 3C (Curas, Curat, Begal)</option>
                        <option value="Rawan Narkoba & Miras Oplosan">Rawan Peredaran Narkoba / Miras</option>
                        <option value="Rawan Kemacetan Parah & Pasar Tumpah">Rawan Kemacetan & Pasar Tumpah</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Tingkat Status Bahaya *</label>
                      <select
                        className="form-control"
                        value={newHotspotStatus}
                        onChange={(e) => setNewHotspotStatus(e.target.value)}
                      >
                        <option value="Status: PENGAWASAN PRIORITAS (RAWAN)">Status: PENGAWASAN PRIORITAS (🔴 Merah)</option>
                        <option value="Status: SIAGA PATROLI BLUE LIGHT">Status: SIAGA PATROLI (🟠 Oranye)</option>
                        <option value="Status: INSIDEN DARURAT AKTIF (SIAGA 110)">Status: INSIDEN DARURAT 110 (🔴 Darurat)</option>
                        <option value="Status: PEMANTAUAN RUTIN">Status: PEMANTAUAN RUTIN (🟡 Kuning)</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>🕒 Jadwal / Jam Rawan *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="23:00 - 04:30 WIB..."
                        value={newHotspotJadwal}
                        onChange={(e) => setNewHotspotJadwal(e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Unit Terdekat / PIC Lapangan</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Patroli Samapta 110 (Siaga)"
                        defaultValue={`${officer.pangkat} ${officer.fullName}`}
                      />
                    </div>
                  </div>

                  {/* Interactive Mini Map Picker Box */}
                  {showMiniPickerRawan && (
                    <div style={{ marginBottom: '12px', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#1E293B' }}>🗺️ Klik lokasi pada peta di bawah ini untuk mengambil titik:</span>
                        <button type="button" onClick={() => setShowMiniPickerRawan(false)} style={{ background: 'none', border: 'none', color: '#DC2626', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer' }}>✕ Tutup Peta</button>
                      </div>
                      <MiniMapPicker
                        lat={newHotspotLat}
                        lng={newHotspotLng}
                        onChange={(pickedLat, pickedLng) => {
                          setNewHotspotLat(pickedLat);
                          setNewHotspotLng(pickedLng);
                        }}
                        height="220px"
                      />
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => setShowMiniPickerRawan(!showMiniPickerRawan)}
                      style={{ background: '#0284C7', color: 'white', border: 'none', padding: '7px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                    >
                      🗺️ {showMiniPickerRawan ? 'Sembunyikan Peta' : 'Pilih Titik dari Maps'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (navigator.geolocation) {
                          navigator.geolocation.getCurrentPosition((pos) => {
                            setNewHotspotLat(Number(pos.coords.latitude.toFixed(6)));
                            setNewHotspotLng(Number(pos.coords.longitude.toFixed(6)));
                            alert(`✓ Titik koordinat GPS terkunci: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
                          });
                        }
                      }}
                      style={{ background: '#E2E8F0', color: '#334155', border: 'none', padding: '7px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      📍 Lokasi Saya (GPS)
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!newHotspotTitle.trim()) {
                          alert('Nama titik rawan tidak boleh kosong!');
                          return;
                        }
                        await createHotspotAction({
                          title: newHotspotTitle.trim(),
                          wilayahPolsek: newHotspotWilayah,
                          kategori: newHotspotKategori,
                          statusBahaya: newHotspotStatus,
                          lat: newHotspotLat,
                          lng: newHotspotLng,
                          jadwalDisplay: newHotspotJadwal,
                          unitTerdekat: `${officer.pangkat} ${officer.fullName}`,
                        });
                        alert('✓ Titik rawan berhasil ditambahkan!');
                        setNewHotspotTitle('');
                        setShowHotspotAddForm(false);
                        setShowMiniPickerRawan(false);
                        loadData();
                      }}
                      style={{ background: '#16A34A', color: 'white', border: 'none', padding: '7px 16px', borderRadius: '6px', fontWeight: 800, fontSize: '11.5px', cursor: 'pointer' }}
                    >
                      💾 Simpan Titik Rawan
                    </button>
                  </div>
                </div>
              )}

              {/* List Hotspots */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {hotspots.map((h) => (
                  <div
                    key={h.id || h.key}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 14px',
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '13px', color: '#1E293B' }}>🔴 {h.title}</div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>
                        {h.kategori} • Jadwal: {h.jadwalDisplay}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        if (confirm(`Hapus titik rawan ${h.title}?`)) {
                          await deleteHotspotAction(h.key);
                          loadData();
                        }
                      }}
                      style={{ background: '#FEE2E2', color: '#DC2626', border: '1px solid #FECACA', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Hapus
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PersonilConsoleView({ session, initialSection = 'beranda' }: { session?: any; initialSection?: string }) {
  return (
    <React.Suspense fallback={<ConsoleSkeleton role="PERSONIL" />}>
      <PersonilContent session={session} initialSection={initialSection} />
    </React.Suspense>
  );
}
