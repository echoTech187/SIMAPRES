'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import QRCode from 'qrcode';
import {
  getRegisteredUnitsAction,
  registerNewUnitAction,
  deleteRegisteredUnitAction,
  getMasterDropdownsAction,
  logoutAction,
  getCurrentSessionAction,
} from '@/app/actions/auth.actions';
import { getAllRecentComplaintsAction } from '@/app/actions/complaint.actions';
import {
  createDevicePairingSessionAction,
  checkDevicePairingSessionAction,
} from '@/app/actions/device.actions';
import { getMasterCountersAction } from '@/app/actions/master.actions';
import MasterDataManager, { MasterTabType } from './master/MasterDataManager';
import MasterTabShell from './master/tabs/MasterTabShell';
import TabUnitPersonel from './master/tabs/TabUnitPersonel';
import TabProfilSuperadmin from './profile/TabProfilSuperadmin';
import SuperadminSidebar from './superadmin/SuperadminSidebar';
import { ConsoleSkeleton } from './ConsoleSkeleton';
import HeaderProfileBadge, { getInitials } from './HeaderProfileBadge';
import { toast } from '@/components/ui/Toast';
import ResponsiveModal from '@/components/ui/ResponsiveModal';
import { Shield } from 'lucide-react';
import '@/app/registrasi-unit/registrasi-unit.css';

export type SuperadminTab = 'unit' | 'profil' | MasterTabType;

function parseSuperadminTab(section?: string): SuperadminTab {
  if (!section) return 'unit';
  const clean = section.toLowerCase().trim();
  if (clean === 'profil' || clean === 'profile' || clean === 'view-profil') {
    return 'profil';
  }
    if (
      [
        'pangkat',
        'satuan',
        'role',
        'station',
        'armada',
        'hotspot',
        'hotspot_cat',
        'kategori',
        'subkategori',
        'duty',
        'lokasi_penyelesaian',
        'dokumen_penyelesaian',
        'knowledge_faq',
        'fuel_type',
        'audit_bbm',
      ].includes(clean)
    ) {
      return clean as MasterTabType;
    }
    if (['claim_status', 'fuel_claim_status', 'status_klaim'].includes(clean)) {
      return 'audit_bbm';
    }
    if (['faq', 'panduan', 'master_faq', 'buku_pintar', 'sop'].includes(clean)) {
      return 'knowledge_faq';
    }
    if (['bbm', 'audit_bbm', 'klaim_bbm', 'logistik'].includes(clean)) {
      return 'audit_bbm';
    }
    if (['fuel', 'fuel_type', 'master_bbm'].includes(clean)) {
      return 'fuel_type';
    }
    return 'unit';
  }

export default function SuperadminConsoleView({
  session,
  initialSection,
  initialMasterData,
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
  const [units, setUnits] = useState<any[]>(initialSuperadminData?.units || []);
  const [masterItems, setMasterItems] = useState<any[]>(initialSuperadminData?.dropdowns || []);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!initialSuperadminData);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<any>(session || null);

  // Active Tab Master Data
  const [activeTab, setActiveTab] = useState<SuperadminTab>(() => {
    if (typeof window !== 'undefined') {
      const parts = window.location.pathname.split('/').filter(Boolean);
      const last = parts[parts.length - 1];
      if (parts[0] === 'console' && parts.length > 1) {
        return parseSuperadminTab(last);
      }
    }
    return parseSuperadminTab(initialSection);
  });

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem('simapres_sidebar_collapsed') === 'true';
      } catch (e) {
        return false;
      }
    }
    return false;
  });

  const [counters, setCounters] = useState(initialSuperadminData?.counters || {
    ranks: 0,
    units: 0,
    roles: 0,
    stations: 0,
    vehicles: 0,
    hotspots: 0,
    hotspotCategories: 0,
    categories: 0,
    subcategories: 0,
    dutyStatuses: 0,
    resolutionLocations: 0,
    resolutionDocuments: 0,
    knowledgeFaqs: 12,
  });

  // Switch Tab & Sync URL Bar
  const switchTab = (tab: SuperadminTab) => {
    setActiveTab(tab);
    const targetUrl = tab === 'unit' ? '/console' : `/console/${tab}`;
    if (typeof window !== 'undefined' && window.location.pathname !== targetUrl) {
      window.history.pushState(null, '', targetUrl);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Form states
  const [editId, setEditId] = useState<string | null>(null);
  const [oldNrp, setOldNrp] = useState<string | null>(null);
  const [nrp, setNrp] = useState('');
  const [nama, setNama] = useState('');
  const [pangkat, setPangkat] = useState('');
  const [role, setRole] = useState('');
  const [unitId, setUnitId] = useState('');
  const [satuanNama, setSatuanNama] = useState('');
  const [kelompokRegu, setKelompokRegu] = useState('');
  const [password, setPassword] = useState('');
  const [stationId, setStationId] = useState<string>('');
  const [deviceId, setDeviceId] = useState('');
  const [liveLat, setLiveLat] = useState<number>(0);
  const [liveLng, setLiveLng] = useState<number>(0);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSatuan, setFilterSatuan] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [filterMako, setFilterMako] = useState('all');

  // Modal states
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrSessionToken, setQrSessionToken] = useState('');

  // Complaints state for passing to Profile & Audit tab
  const [complaints, setComplaints] = useState<any[]>([]);

  const showNotification = useCallback((msg: string) => {
    toast.showNotification(msg, 4000);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resUnits, resMasters, resCounters, resComplaints] = await Promise.all([
        getRegisteredUnitsAction(),
        getMasterDropdownsAction(),
        getMasterCountersAction(),
        getAllRecentComplaintsAction(50),
      ]);

      if (resUnits?.success && resUnits.data) {
        setUnits(resUnits.data);
      }
      if (resMasters?.success && resMasters.data) {
        setMasterItems(resMasters.data);
      }
      if (resCounters?.success && resCounters.data) {
        setCounters(resCounters.data);
      }
      if (resComplaints?.success && resComplaints.data) {
        setComplaints(resComplaints.data);
      }
    } catch (err) {
      console.warn('loadData warning:', err);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  // Listener tombol navigasi Back/Forward browser
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window !== 'undefined') {
        const parts = window.location.pathname.split('/').filter(Boolean);
        const last = parts[parts.length - 1];
        if (parts[0] === 'console' && parts.length > 1) {
          setActiveTab(parseSuperadminTab(last));
        } else {
          setActiveTab('unit');
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Sinkronisasi query parameter ?tab=... / ?page=...
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search) {
      const qParams = new URLSearchParams(window.location.search);
      const tabQ = qParams.get('tab') || qParams.get('page');
      if (tabQ) {
        const matched = parseSuperadminTab(tabQ);
        setActiveTab(matched);
        const targetUrl = matched === 'unit' ? '/console' : `/console/${matched}`;
        window.history.replaceState(null, '', targetUrl);
      }
    }
  }, []);

  useEffect(() => {
    if (!initialSuperadminData) {
      loadData();
    }
    setDeviceId('');
    if (!currentUser && !session) {
      getCurrentSessionAction().then((res) => {
        if (res.success && res.data) {
          setCurrentUser(res.data);
        }
      });
    }
  }, []);

  const handleLogout = async () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('simapres_active_user');
    }
    await logoutAction();
    window.location.href = '/?alert=logged_out';
  };

  const handleUnitSelectChange = (val: string) => {
    setUnitId(val);
    const match = masterItems.find(
      (m) => m.tipe === 'satuan' && (m.code === val || m.item_code === val)
    );
    setSatuanNama(match?.label || match?.item_name || val.toUpperCase());
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nrp.trim() || !nama.trim()) {
      showNotification('NRP dan Nama Petugas wajib diisi!');
      return;
    }

    setLoading(true);
    const res = await registerNewUnitAction({
      editId: editId || undefined,
      oldNrp: oldNrp || undefined,
      nrp: nrp.trim(),
      nama: nama.trim(),
      pangkat,
      role,
      unitId,
      satuanNama,
      kelompokRegu,
      stationId: stationId ? Number(stationId) : null,
      password: password.trim() ? password.trim() : undefined,
      deviceID: deviceId,
      liveLat,
      liveLng,
    });
    setLoading(false);

    if (res.success) {
      if (editId) {
        showNotification(`✓ Data unit ${pangkat} ${nama} (NRP: ${nrp.trim()}) [Role: ${role}] berhasil diperbarui!`);
      } else {
        showNotification(`✓ Unit ${pangkat} ${nama} (NRP: ${nrp.trim()}) [Role: ${role}] berhasil didaftarkan!`);
      }
      handleReset();
      await loadData();
    } else {
      showNotification(`Gagal: ${res.error}`);
    }
  };

  const handleReset = () => {
    setEditId(null);
    setOldNrp(null);
    setNrp('');
    setNama('');
    setPangkat('');
    setRole('');
    setUnitId('');
    setSatuanNama('');
    setKelompokRegu('');
    setPassword('');
    setStationId('');
    setDeviceId('');
  };

  const handleEditUnit = (u: any) => {
    setEditId(u.id);
    setOldNrp(u.nrp);
    setNrp(u.nrp);
    setNama(u.nama);
    setPangkat(u.pangkat || '');
    setRole(u.role || '');
    setUnitId(u.unitId || '');
    setSatuanNama(u.satuanNama || '');
    setKelompokRegu(u.kelompokRegu || '');
    setStationId(u.stationId ? String(u.stationId) : '');
    setDeviceId(u.deviceID || '');
    setPassword('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteUnit = async (u: any) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus unit ${u.pangkat || ''} ${u.nama} (NRP: ${u.nrp})? Tindakan ini akan menghapus akun dan akses personil tersebut.`)) {
      return;
    }
    setLoading(true);
    const res = await deleteRegisteredUnitAction(u.id || u.nrp);
    setLoading(false);
    if (res.success) {
      showNotification(`✓ Unit ${u.pangkat || ''} ${u.nama} (NRP: ${u.nrp}) berhasil dihapus.`);
      if (editId === u.id || oldNrp === u.nrp) {
        handleReset();
      }
      await loadData();
    } else {
      showNotification(`Gagal menghapus unit: ${res.error}`);
    }
  };

  const openQrModal = async (customNrp?: string, customUnitId?: string) => {
    const activeNrp = customNrp || nrp;
    const activeUnitId = customUnitId || unitId;
    if (customNrp) setNrp(customNrp);
    if (customUnitId) setUnitId(customUnitId);
    const token = 'SESI_' + Math.random().toString(36).substring(2, 10).toUpperCase();
    setQrSessionToken(token);
    setShowQrModal(true);
    await createDevicePairingSessionAction({ sessionToken: token, nrp: activeNrp, unitId: activeUnitId });
  };

  // Polling status pairing device dari database MySQL
  useEffect(() => {
    if (!showQrModal || !qrSessionToken) return;

    const interval = setInterval(async () => {
      const res = await checkDevicePairingSessionAction(qrSessionToken);
      if (res?.success && res?.data && res.data.status === 'PAIRED') {
        if (res.data.deviceId) setDeviceId(res.data.deviceId);
        if (res.data.lat) setLiveLat(res.data.lat);
        if (res.data.lng) setLiveLng(res.data.lng);
        setShowQrModal(false);
        showNotification(`✓ Device ${res.data.deviceBrand || 'HP'} (${res.data.deviceId}) berhasil terhubung dari database!`);
        clearInterval(interval);
      }
    }, 1800);
    return () => clearInterval(interval);
  }, [showQrModal, qrSessionToken]);

  // Generate QR Code saat modal dibuka
  useEffect(() => {
    if (!showQrModal || !qrSessionToken) {
      setQrDataUrl('');
      return;
    }
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const scanUrl = `${origin}/scan-device?nrp=${encodeURIComponent(nrp || 'TEST')}&unit=${encodeURIComponent(unitId)}&session=${qrSessionToken}`;
    QRCode.toDataURL(scanUrl, {
      width: 240,
      margin: 1,
      color: {
        dark: '#0D264A',
        light: '#FFFFFF',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Gagal generate QR Code:', err));
  }, [showQrModal, qrSessionToken, nrp, unitId]);

  // Filtered unit list
  const filteredUnits = units.filter((u) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      u.nama?.toLowerCase().includes(q) ||
      u.nrp?.toLowerCase().includes(q) ||
      (u.role && u.role.toLowerCase().includes(q)) ||
      u.satuanNama?.toLowerCase().includes(q) ||
      u.stationName?.toLowerCase().includes(q) ||
      u.deviceID?.toLowerCase().includes(q);

    const matchSatuan = filterSatuan === 'all' || u.unitId?.toLowerCase() === filterSatuan.toLowerCase();
    const matchRole = filterRole === 'all' || (u.role || 'PERSONIL').toUpperCase() === filterRole.toUpperCase();
    const matchMako = filterMako === 'all' || String(u.stationId) === String(filterMako) || u.stationCode?.toLowerCase() === filterMako.toLowerCase();
    return matchSearch && matchSatuan && matchRole && matchMako;
  });

  const getRoleBadgeInfo = (roleStr?: string) => {
    const r = (roleStr || 'PERSONIL').toUpperCase();
    if (r === 'PAWAS') {
      return { className: 'badge-role role-pawas', icon: '👑', label: 'PAWAS' };
    }
    if (r === 'OPERATOR_110' || r.includes('OPERATOR')) {
      return { className: 'badge-role role-operator', icon: '🎧', label: 'OPERATOR SPKT' };
    }
    if (r === 'SUPERADMIN') {
      return { className: 'badge-role role-superadmin', icon: '⚡', label: 'SUPERADMIN' };
    }
    return { className: 'badge-role role-personil', icon: '👮', label: 'ANGGOTA' };
  };

  const getSatuanBadgeClass = (uid: string) => {
    const low = (uid || '').toLowerCase();
    if (low.includes('reskrim')) return 'badge-satuan satuan-reskrim';
    if (low.includes('intel')) return 'badge-satuan satuan-intel';
    if (low.includes('lantas')) return 'badge-satuan satuan-lantas';
    if (low.includes('binmas')) return 'badge-satuan satuan-binmas';
    if (low.includes('komando') || low.includes('pawas')) return 'badge-satuan satuan-komando';
    return 'badge-satuan satuan-samapta';
  };


  if (initialLoading) {
    return <ConsoleSkeleton role="SUPERADMIN" />;
  }

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
          <div className="brand-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={22} color="#38BDF8" strokeWidth={2.4} />
          </div>
          <div>
            <div className="brand-title">SIMOPMAS 110 • POLRI</div>
            <div className="brand-subtitle">Modul Pendaftaran &amp; Manajemen Satuan Unit Terpadu</div>
          </div>
        </Link>

        <div className="topbar-nav" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Profile Header Badge (Reusable Component) */}
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
          onToggleCollapse={() => {
            const next = !isSidebarCollapsed;
            setIsSidebarCollapsed(next);
            try {
              localStorage.setItem('simapres_sidebar_collapsed', String(next));
            } catch (e) {}
          }}
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
              onOpenQrModal={(nrpVal, unitIdVal) => {
                openQrModal(nrpVal, unitIdVal);
              }}
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
      <ResponsiveModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        maxWidth="440px"
        title="IKAT DEVICE GPS HP PERSONEL"
        subtitle="Scan QR ini menggunakan kamera HP petugas untuk aktivasi telemetry otomatis"
        icon="📱"
      >
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          {/* Box Wadah QR Code Presisi */}
          <div
            style={{
              width: '220px',
              height: '220px',
              margin: '0 auto 14px',
              background: '#FFFFFF',
              border: '2px solid #E2E8F0',
              borderRadius: '16px',
              boxShadow: '0 8px 24px -4px rgba(15, 23, 42, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
              padding: '8px',
              boxSizing: 'border-box',
            }}
          >
            {qrDataUrl ? (
              <>
                <img
                  src={qrDataUrl}
                  alt="QR Code Aktivasi HP Petugas"
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'block',
                    borderRadius: '8px',
                  }}
                />
                {/* Badge Center Logo Presisi */}
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '38px',
                    height: '38px',
                    background: 'linear-gradient(135deg, #0D264A 0%, #153E75 100%)',
                    borderRadius: '8px',
                    border: '2px solid white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.25)',
                  }}
                >
                  🛡️
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '36px', marginBottom: '8px' }}>⏳</div>
                <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#64748B' }}>
                  Membuat QR Code...
                </div>
              </div>
            )}
          </div>

          {/* Token Sesi Info */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#F1F5F9',
              border: '1px solid #CBD5E1',
              borderRadius: '8px',
              padding: '5px 12px',
              marginBottom: '14px',
              fontSize: '11.5px',
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 700,
              color: '#1E293B',
            }}
          >
            <span style={{ color: '#2563EB' }}>TOKEN:</span> {qrSessionToken}
          </div>

          <p style={{ fontSize: '12px', color: '#475569', lineHeight: 1.5, marginBottom: '16px' }}>
            Arahkan kamera HP petugas ke QR Code di atas untuk mengikat telemetry dinas.
          </p>

          <button
            type="button"
            onClick={() => setShowQrModal(false)}
            style={{
              width: '100%',
              padding: '10px',
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '10px',
              fontSize: '12.5px',
              fontWeight: 700,
              color: '#64748B',
              cursor: 'pointer',
              transition: '0.2s',
            }}
          >
            Tutup
          </button>
        </div>
      </ResponsiveModal>

    </div>
  );
}
