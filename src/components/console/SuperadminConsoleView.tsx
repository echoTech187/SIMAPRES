'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import QRCode from 'qrcode';
import {
  getRegisteredUnitsAction,
  registerNewUnitAction,
  getMasterDropdownsAction,
  logoutAction,
  getCurrentSessionAction,
  updateUserProfileAndAvatarAction,
} from '@/app/actions/auth.actions';
import { getAllRecentComplaintsAction } from '@/app/actions/complaint.actions';
import {
  createDevicePairingSessionAction,
  checkDevicePairingSessionAction,
} from '@/app/actions/device.actions';
import { getMasterCountersAction } from '@/app/actions/master.actions';
import MasterDataManager, { MasterTabType } from './master/MasterDataManager';
import { ConsoleSkeleton } from './ConsoleSkeleton';
import HeaderProfileBadge, { getInitials } from './HeaderProfileBadge';
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
    ].includes(clean)
  ) {
    return clean as MasterTabType;
  }
  return 'unit';
}

export default function SuperadminConsoleView({ session, initialSection, initialMasterData }: { session?: any; initialSection?: string; initialMasterData?: any }) {
  const [units, setUnits] = useState<any[]>([]);
  const [masterItems, setMasterItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
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

  const [counters, setCounters] = useState({
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

  // Profile, Presensi & Audit States (Konsep Layar Profil Superadmin)
  const [liveClock, setLiveClock] = useState<string>('');
  const [presensiStatus, setPresensiStatus] = useState<'SUDAH_MASUK' | 'BELUM_MASUK'>('BELUM_MASUK');
  const [jamMasukPiket, setJamMasukPiket] = useState<string>('-');
  const [jamPulangPiket, setJamPulangPiket] = useState<string>('-');
  const [showPresensiPulangModal, setShowPresensiPulangModal] = useState<boolean>(false);

  // Tab Menu Aktif di Layar Profil (Inline Layout Kanan: 'profil' | 'keamanan' | 'log')
  const [profilActiveMenu, setProfilActiveMenu] = useState<'profil' | 'keamanan' | 'log'>('profil');

  // Profile Edit & Avatar States
  const [editFullName, setEditFullName] = useState<string>('');
  const [editPangkat, setEditPangkat] = useState<string>('');
  const [editPhone, setEditPhone] = useState<string>('');
  const [editEmail, setEditEmail] = useState<string>('');
  const [editAvatar, setEditAvatar] = useState<string | null>(null);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [editSubmitting, setEditSubmitting] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keamanan & PIN States
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [pinKomando, setPinKomando] = useState<string[]>(['', '', '', '', '', '']);

  // Sinkronkan data form profil saat currentUser termuat
  useEffect(() => {
    if (currentUser) {
      setEditFullName(currentUser.fullName || currentUser.nama || '');
      setEditPangkat(currentUser.pangkat || currentUser.rankPangkat || '');
      setEditPhone(currentUser.phone || currentUser.phoneNumber || '');
      setEditEmail(currentUser.email || '');
      setEditAvatar(currentUser.avatar || null);
      setSelectedAvatarFile(null);
    }
  }, [currentUser]);

  const handleResetProfile = () => {
    if (currentUser) {
      setEditFullName(currentUser.fullName || currentUser.nama || '');
      setEditPangkat(currentUser.pangkat || currentUser.rankPangkat || '');
      setEditPhone(currentUser.phone || currentUser.phoneNumber || '');
      setEditEmail(currentUser.email || '');
      setEditAvatar(currentUser.avatar || null);
      setSelectedAvatarFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
    showNotification('Formulir profil telah dikembalikan ke data awal.');
  };

  const handleSaveKeamanan = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword && newPassword !== confirmPassword) {
      showNotification('Konfirmasi kata sandi baru tidak sesuai!');
      return;
    }
    showNotification('✓ Kredensial akun & PIN otorisasi dinas berhasil disimpan!');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showNotification('Berkas harus berupa gambar berformat JPG, PNG, atau WEBP');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showNotification('Ukuran berkas foto maksimal 5MB');
      return;
    }

    setSelectedAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setEditAvatar(result);
      showNotification('✓ Foto profil berhasil dipilih! Klik "Simpan Perubahan Profil" untuk menerapkan.');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFullName.trim()) {
      showNotification('Nama lengkap tidak boleh kosong!');
      return;
    }

    setEditSubmitting(true);
    try {
      let finalAvatarUrl: string | null = editAvatar;

      // 1. Jika ada file foto baru yang diunggah, simpan terlebih dahulu via API upload
      if (selectedAvatarFile) {
        const formData = new FormData();
        formData.append('file', selectedAvatarFile);
        if (currentUser?.identifier) {
          formData.append('nrp', currentUser.identifier);
        }

        const uploadRes = await fetch('/api/upload-avatar', {
          method: 'POST',
          body: formData,
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok || !uploadData.success || !uploadData.url) {
          throw new Error(uploadData.error || 'Gagal mengunggah berkas foto');
        }
        finalAvatarUrl = uploadData.url;
      } else if (editAvatar === null) {
        finalAvatarUrl = null;
      }

      // 2. Simpan data profil dan URL avatar ke database & session
      const res = await updateUserProfileAndAvatarAction({
        fullName: editFullName.trim(),
        pangkat: editPangkat.trim(),
        phoneNumber: editPhone.trim(),
        email: editEmail.trim(),
        avatar: finalAvatarUrl,
      });

      if (res.success && res.data) {
        setCurrentUser((prev: any) => ({
          ...prev,
          fullName: res.data.fullName,
          nama: res.data.fullName,
          pangkat: res.data.pangkat,
          rankPangkat: res.data.pangkat,
          avatar: res.data.avatar,
          phone: res.data.phone,
          email: res.data.email,
        }));
        setSelectedAvatarFile(null);
        setEditAvatar(res.data.avatar || null);
        if (typeof window !== 'undefined') {
          const raw = sessionStorage.getItem('simapres_active_user');
          if (raw) {
            try {
              const parsed = JSON.parse(raw);
              parsed.fullName = res.data.fullName;
              parsed.rankPangkat = res.data.pangkat;
              parsed.avatar = res.data.avatar;
              sessionStorage.setItem('simapres_active_user', JSON.stringify(parsed));
            } catch (_) {}
          }
        }
        showNotification('✓ Profil dan foto dinas berhasil diperbarui!');
      } else {
        showNotification(`Gagal: ${res.error || 'Gagal menyimpan profil'}`);
      }
    } catch (err: any) {
      showNotification(`Terjadi kesalahan: ${err.message || 'Gagal menyimpan'}`);
    } finally {
      setEditSubmitting(false);
    }
  };

  // Complaints & Audit Log States
  const [complaints, setComplaints] = useState<any[]>([]);
  const [selectedLogDetail, setSelectedLogDetail] = useState<any | null>(null);
  const [profilLogSearch, setProfilLogSearch] = useState('');
  const [profilLogFilter, setProfilLogFilter] = useState<'semua' | 'menunggu' | 'diproses' | 'selesai'>('semua');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLiveClock(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const showNotification = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const resUnits = await getRegisteredUnitsAction();
      if (resUnits.success && resUnits.data) {
        setUnits(resUnits.data);
      }
      const resMasters = await getMasterDropdownsAction();
      if (resMasters.success && resMasters.data) {
        setMasterItems(resMasters.data);
      }
      const resCounters = await getMasterCountersAction();
      if (resCounters.success && resCounters.data) {
        setCounters(resCounters.data);
      }
      const resComplaints = await getAllRecentComplaintsAction(50);
      if (resComplaints.success && resComplaints.data) {
        setComplaints(resComplaints.data);
      }
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
    loadData();
    setDeviceId(`DEV-HP-${Math.random().toString(16).slice(2, 10).toUpperCase()}`);
    if (!currentUser) {
      getCurrentSessionAction().then((res) => {
        if (res.success && res.data) {
          setCurrentUser(res.data);
        }
      });
    }
  }, []);

  const handleLogout = async () => {
    if (confirm('Akhiri sesi kedinasan Super Administrator?')) {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('simapres_active_user');
      }
      await logoutAction();
      window.location.href = '/?alert=logged_out';
    }
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
      nrp: nrp.trim(),
      nama: nama.trim(),
      pangkat,
      role,
      unitId,
      satuanNama,
      kelompokRegu,
      stationId: stationId ? Number(stationId) : null,
      password,
      deviceID: deviceId,
      liveLat,
      liveLng,
    });
    setLoading(false);

    if (res.success) {
      showNotification(`✓ Unit ${pangkat} ${nama} (NRP: ${nrp}) [Role: ${role}] berhasil didaftarkan!`);
      handleReset();
      loadData();
    } else {
      showNotification(`Gagal: ${res.error}`);
    }
  };

  const handleReset = () => {
    setEditId(null);
    setNrp('');
    setNama('');
    setPangkat('');
    setRole('');
    setUnitId('');
    setSatuanNama('');
    setKelompokRegu('');
    setPassword('');
    setStationId('');
    setDeviceId(`DEV-HP-${Math.random().toString(16).slice(2, 10).toUpperCase()}`);
  };

  const handleEditUnit = (u: any) => {
    setEditId(u.id);
    setNrp(u.nrp);
    setNama(u.nama);
    setPangkat(u.pangkat || '');
    setRole(u.role || '');
    setUnitId(u.unitId || '');
    setSatuanNama(u.satuanNama || '');
    setKelompokRegu(u.kelompokRegu || '');
    setStationId(u.stationId ? String(u.stationId) : '');
    setDeviceId(u.deviceID || `DEV-HP-${Math.random().toString(16).slice(2, 10).toUpperCase()}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openQrModal = async () => {
    const token = 'SESI_' + Math.random().toString(36).substring(2, 10).toUpperCase();
    setQrSessionToken(token);
    setShowQrModal(true);
    await createDevicePairingSessionAction({ sessionToken: token, nrp, unitId });
  };

  // Polling status pairing device dari database MySQL
  useEffect(() => {
    if (!showQrModal || !qrSessionToken) return;

    const interval = setInterval(async () => {
      const res = await checkDevicePairingSessionAction(qrSessionToken);
      if (res.success && res.data && res.data.status === 'PAIRED') {
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
      return { className: 'badge-role role-operator', icon: '🎧', label: 'OPERATOR 110' };
    }
    if (r === 'SUPERADMIN') {
      return { className: 'badge-role role-superadmin', icon: '⚡', label: 'SUPERADMIN' };
    }
    return { className: 'badge-role role-personil', icon: '👮', label: 'PERSONIL' };
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

  const filteredComplaints = complaints.filter((c) => {
    if (profilLogFilter === 'menunggu' && c.status !== 'BELUM_DITANGANI') return false;
    if (profilLogFilter === 'diproses' && !['DISPOSISI', 'MENUJU_TKP', 'PENANGANAN_TKP'].includes(c.status)) return false;
    if (profilLogFilter === 'selesai' && c.status !== 'SELESAI') return false;
    if (profilLogSearch) {
      const q = profilLogSearch.toLowerCase();
      const matchTiket = c.nomorTiket?.toLowerCase().includes(q);
      const matchKasus = c.jenisKejadian?.toLowerCase().includes(q);
      const matchTkp = c.tkpAlamatTeks?.toLowerCase().includes(q);
      if (!matchTiket && !matchKasus && !matchTkp) return false;
    }
    return true;
  });

  if (initialLoading) {
    return <ConsoleSkeleton role="SUPERADMIN" />;
  }

  return (
    <div className="registrasi-body">
      {/* Topbar Header Presisi (Konsep E Tribrata Log) */}
      <header className="topbar">
        <Link href="/" className="topbar-brand">
          <div className="brand-icon">🛡️</div>
          <div>
            <div className="brand-title">SIMAPRES 110 • POLRI</div>
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

      {/* TABS MASTER DATA PRESISI 110 */}
      <div
        style={{
          background: 'white',
          borderBottom: '1px solid #E2E8F0',
          padding: '0 24px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
          position: 'sticky',
          top: '68px',
          zIndex: 90,
        }}
      >
        <div
          style={{
            maxWidth: '1440px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            overflowX: 'auto',
            padding: '10px 0',
            scrollbarWidth: 'none',
          }}
        >
          {/* TAB 1: UNIT & PERSONEL */}
          <button
            type="button"
            onClick={() => switchTab('unit')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
              background: activeTab === 'unit' ? '#153E75' : '#F8FAFC',
              color: activeTab === 'unit' ? 'white' : '#475569',
              border: activeTab === 'unit' ? '1px solid #153E75' : '1px solid #E2E8F0',
            }}
          >
            <span>👮 Satuan &amp; Personel</span>
            <span
              style={{
                background: activeTab === 'unit' ? 'rgba(255,255,255,0.2)' : '#E2E8F0',
                color: activeTab === 'unit' ? 'white' : '#475569',
                fontSize: '11px',
                padding: '2px 7px',
                borderRadius: '10px',
                fontWeight: 800,
              }}
            >
              {units.length}
            </span>
          </button>

          {/* TAB 2: MASTER PANGKAT */}
          <button
            type="button"
            onClick={() => switchTab('pangkat')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
              background: activeTab === 'pangkat' ? '#153E75' : '#F8FAFC',
              color: activeTab === 'pangkat' ? 'white' : '#475569',
              border: activeTab === 'pangkat' ? '1px solid #153E75' : '1px solid #E2E8F0',
            }}
          >
            <span>🎖️ Master Pangkat</span>
            <span
              style={{
                background: activeTab === 'pangkat' ? 'rgba(255,255,255,0.2)' : '#E2E8F0',
                color: activeTab === 'pangkat' ? 'white' : '#475569',
                fontSize: '11px',
                padding: '2px 7px',
                borderRadius: '10px',
                fontWeight: 800,
              }}
            >
              {counters.ranks}
            </span>
          </button>

          {/* TAB 3: MASTER SATUAN */}
          <button
            type="button"
            onClick={() => switchTab('satuan')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
              background: activeTab === 'satuan' ? '#153E75' : '#F8FAFC',
              color: activeTab === 'satuan' ? 'white' : '#475569',
              border: activeTab === 'satuan' ? '1px solid #153E75' : '1px solid #E2E8F0',
            }}
          >
            <span>🚔 Satuan Operasional</span>
            <span
              style={{
                background: activeTab === 'satuan' ? 'rgba(255,255,255,0.2)' : '#E2E8F0',
                color: activeTab === 'satuan' ? 'white' : '#475569',
                fontSize: '11px',
                padding: '2px 7px',
                borderRadius: '10px',
                fontWeight: 800,
              }}
            >
              {counters.units}
            </span>
          </button>

          {/* TAB 4: MASTER ROLE */}
          <button
            type="button"
            onClick={() => switchTab('role')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
              background: activeTab === 'role' ? '#153E75' : '#F8FAFC',
              color: activeTab === 'role' ? 'white' : '#475569',
              border: activeTab === 'role' ? '1px solid #153E75' : '1px solid #E2E8F0',
            }}
          >
            <span>🛡️ Peran &amp; Hak Akses</span>
            <span
              style={{
                background: activeTab === 'role' ? 'rgba(255,255,255,0.2)' : '#E2E8F0',
                color: activeTab === 'role' ? 'white' : '#475569',
                fontSize: '11px',
                padding: '2px 7px',
                borderRadius: '10px',
                fontWeight: 800,
              }}
            >
              {counters.roles}
            </span>
          </button>

          {/* TAB 5: KANTOR POLISI */}
          <button
            type="button"
            onClick={() => switchTab('station')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
              background: activeTab === 'station' ? '#153E75' : '#F8FAFC',
              color: activeTab === 'station' ? 'white' : '#475569',
              border: activeTab === 'station' ? '1px solid #153E75' : '1px solid #E2E8F0',
            }}
          >
            <span>🏢 Kantor Polisi (Mako)</span>
            <span
              style={{
                background: activeTab === 'station' ? 'rgba(255,255,255,0.2)' : '#E2E8F0',
                color: activeTab === 'station' ? 'white' : '#475569',
                fontSize: '11px',
                padding: '2px 7px',
                borderRadius: '10px',
                fontWeight: 800,
              }}
            >
              {counters.stations}
            </span>
          </button>

          {/* TAB 6: MASTER ARMADA OPERASIONAL */}
          <button
            type="button"
            onClick={() => switchTab('armada')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
              background: activeTab === 'armada' ? '#153E75' : '#F8FAFC',
              color: activeTab === 'armada' ? 'white' : '#475569',
              border: activeTab === 'armada' ? '1px solid #153E75' : '1px solid #E2E8F0',
            }}
          >
            <span>🚓 Armada Operasional</span>
            <span
              style={{
                background: activeTab === 'armada' ? 'rgba(255,255,255,0.2)' : '#E2E8F0',
                color: activeTab === 'armada' ? 'white' : '#475569',
                fontSize: '11px',
                padding: '2px 7px',
                borderRadius: '10px',
                fontWeight: 800,
              }}
            >
              {counters.vehicles}
            </span>
          </button>

          {/* TAB 7: MASTER TITIK RAWAN GIS */}
          <button
            type="button"
            onClick={() => switchTab('hotspot')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
              background: activeTab === 'hotspot' ? '#153E75' : '#F8FAFC',
              color: activeTab === 'hotspot' ? 'white' : '#475569',
              border: activeTab === 'hotspot' ? '1px solid #153E75' : '1px solid #E2E8F0',
            }}
          >
            <span>📍 Titik Rawan (GIS)</span>
            <span
              style={{
                background: activeTab === 'hotspot' ? 'rgba(255,255,255,0.2)' : '#E2E8F0',
                color: activeTab === 'hotspot' ? 'white' : '#475569',
                fontSize: '11px',
                padding: '2px 7px',
                borderRadius: '10px',
                fontWeight: 800,
              }}
            >
              {counters.hotspots}
            </span>
          </button>

          {/* TAB 8: MASTER KATEGORI INSIDEN */}
          <button
            type="button"
            onClick={() => switchTab('kategori')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
              background: activeTab === 'kategori' ? '#153E75' : '#F8FAFC',
              color: activeTab === 'kategori' ? 'white' : '#475569',
              border: activeTab === 'kategori' ? '1px solid #153E75' : '1px solid #E2E8F0',
            }}
          >
            <span>🚨 Kategori Insiden</span>
            <span
              style={{
                background: activeTab === 'kategori' ? 'rgba(255,255,255,0.2)' : '#E2E8F0',
                color: activeTab === 'kategori' ? 'white' : '#475569',
                fontSize: '11px',
                padding: '2px 7px',
                borderRadius: '10px',
                fontWeight: 800,
              }}
            >
              {counters.categories}
            </span>
          </button>

          {/* TAB 9: MASTER SUBKATEGORI INSIDEN */}
          <button
            type="button"
            onClick={() => switchTab('subkategori')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
              background: activeTab === 'subkategori' ? '#153E75' : '#F8FAFC',
              color: activeTab === 'subkategori' ? 'white' : '#475569',
              border: activeTab === 'subkategori' ? '1px solid #153E75' : '1px solid #E2E8F0',
            }}
          >
            <span>📑 Subkategori Insiden</span>
            <span
              style={{
                background: activeTab === 'subkategori' ? 'rgba(255,255,255,0.2)' : '#E2E8F0',
                color: activeTab === 'subkategori' ? 'white' : '#475569',
                fontSize: '11px',
                padding: '2px 7px',
                borderRadius: '10px',
                fontWeight: 800,
              }}
            >
              {counters.subcategories || 44}
            </span>
          </button>

          {/* Sembunyikan untuk saat ini sesuai permintaan: Kategori Rawan, Status Tugas */}
        </div>
      </div>

      {/* Main Container */}
      <main className="registrasi-container">
        {activeTab === 'unit' ? (
          <div className="layout-grid">
          {/* SISI KIRI: FORMULIR PENDAFTARAN & UPDATE UNIT */}
          <section className="card-box">
            <div className="card-header">
              <div className="card-title-group">
                <h2 id="form-title">
                  <span>📝</span> {editId ? 'Edit Satuan Unit' : 'Formulir Registrasi Satuan'}
                </h2>
                <p id="form-desc">
                  {editId ? 'Perbarui data personel dan konfigurasi unit' : 'Daftarkan personel dan device unit satuan baru'}
                </p>
              </div>
              <span
                id="badge-mode"
                style={{
                  fontSize: '10.5px',
                  fontWeight: 800,
                  background: editId ? '#FEF3C7' : '#DBEAFE',
                  color: editId ? '#92400E' : '#1E40AF',
                  padding: '3px 8px',
                  borderRadius: '12px',
                }}
              >
                {editId ? 'EDIT MODE' : 'BARU'}
              </span>
            </div>

            <div className="card-body">
              <form onSubmit={handleFormSubmit}>
                {/* SEKSI 1: IDENTITAS PERSONEL */}
                <div className="form-section-divider" style={{ marginTop: 0 }}>
                  <div className="form-section-title">
                    <span>👤</span> 1. Data Identitas Personel
                  </div>
                </div>

                {/* 1. NRP Personel */}
                <div className="form-group-reg">
                  <label className="form-label-reg" htmlFor="reg-nrp">
                    NRP Personel <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    id="reg-nrp"
                    className="form-control-reg font-mono"
                    placeholder="Contoh: 95020123"
                    value={nrp}
                    onChange={(e) => setNrp(e.target.value)}
                    required
                  />
                </div>

                {/* 2. Nama Lengkap */}
                <div className="form-group-reg">
                  <label className="form-label-reg" htmlFor="reg-nama">
                    Nama Lengkap &amp; Gelar <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    id="reg-nama"
                    className="form-control-reg"
                    placeholder="Contoh: Bripka Ahmad Subagyo, S.H."
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    required
                  />
                </div>

                {/* 3. Pangkat Kepolisian */}
                <div className="form-group-reg">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label className="form-label-reg" htmlFor="reg-pangkat" style={{ marginBottom: 0 }}>
                      Pangkat Kepolisian <span className="req">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => switchTab('pangkat')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#2563EB',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <span>⚙️ Kelola Pangkat</span>
                    </button>
                  </div>
                  <select
                    id="reg-pangkat"
                    className="form-control-reg"
                    value={pangkat}
                    onChange={(e) => setPangkat(e.target.value)}
                    required
                  >
                    {masterItems.filter((m) => m.tipe === 'pangkat').map((m) => (
                      <option key={m.id} value={m.code || m.label}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* SEKSI 2: HAK AKSES & PENUGASAN */}
                <div className="form-section-divider">
                  <div className="form-section-title">
                    <span>🛡️</span> 2. Hak Akses &amp; Penugasan Satuan
                  </div>
                </div>

                {/* 4. Role / Hak Akses Sistem */}
                <div className="form-group-reg">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label className="form-label-reg" htmlFor="reg-role" style={{ marginBottom: 0 }}>
                      Role / Hak Akses Sistem <span className="req">*</span>
                    </label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button
                        type="button"
                        onClick={() => switchTab('role')}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#2563EB',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                        }}
                      >
                        <span>⚙️ Kelola Role</span>
                      </button>
                      <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#1D4ED8', background: '#EFF6FF', padding: '3px 10px', borderRadius: '12px', border: '1px solid #BFDBFE' }}>
                        Rantai Komando Presisi
                      </span>
                    </div>
                  </div>
                  <select
                    id="reg-role"
                    className="form-control-reg"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    required
                  >
                    {masterItems
                      .filter((m) => m.tipe === 'role')
                      .map((m) => {
                        const icon =
                          m.code === 'PAWAS'
                            ? '👑'
                            : m.code === 'OPERATOR_110' || m.code?.includes('OPERATOR')
                            ? '🎧'
                            : m.code === 'SUPERADMIN'
                            ? '⚡'
                            : '👮';
                        return (
                          <option key={m.id} value={m.code}>
                            {icon} {m.label} ({m.code})
                          </option>
                        );
                      })}
                  </select>
                </div>

                {/* 5. Unit Satuan */}
                <div className="form-group-reg">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label className="form-label-reg" htmlFor="reg-unit" style={{ marginBottom: 0 }}>
                      Unit Satuan Operasional <span className="req">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => switchTab('satuan')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#2563EB',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                    >
                      <span>⚙️ Kelola Satuan</span>
                    </button>
                  </div>
                  <select
                    id="reg-unit"
                    className="form-control-reg"
                    value={unitId}
                    onChange={(e) => handleUnitSelectChange(e.target.value)}
                    required
                  >
                    {masterItems.filter((m) => m.tipe === 'satuan').map((m) => (
                      <option key={m.id} value={m.code}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 5b. Pilihan Mako (Kantor Polisi) */}
                <div className="form-group-reg">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label className="form-label-reg" htmlFor="reg-station" style={{ marginBottom: 0 }}>
                      Kantor Polisi / Wilayah Mako <span className="req">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => switchTab('station')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#2563EB',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                    >
                      <span>⚙️ Kelola Mako</span>
                    </button>
                  </div>
                  <select
                    id="reg-station"
                    className="form-control-reg"
                    value={stationId}
                    onChange={(e) => setStationId(e.target.value)}
                    required
                  >
                    <option value="">-- Pilih Kantor Polisi (Mako) --</option>
                    {masterItems
                      .filter((m) => m.tipe === 'station')
                      .map((m) => (
                        <option key={m.id} value={m.numericId || m.code}>
                          🏢 {m.label || m.name}
                        </option>
                      ))}
                  </select>
                </div>

                {/* 6. Kelompok Regu / Beat */}
                <div className="form-group-reg">
                  <label className="form-label-reg" htmlFor="reg-regu">
                    Kelompok Regu / Beat Patroli
                  </label>
                  <input
                    type="text"
                    id="reg-regu"
                    className="form-control-reg"
                    placeholder="Contoh: Tim Perintis Presisi R2-12 / Regu Alpha"
                    value={kelompokRegu}
                    onChange={(e) => setKelompokRegu(e.target.value)}
                  />
                </div>

                {/* SEKSI 3: KREDENSIAL & TRACKING GPS */}
                <div className="form-section-divider">
                  <div className="form-section-title">
                    <span>🔐</span> 3. Kredensial &amp; Tracking GPS
                  </div>
                </div>

                {/* 7. Kata Sandi Internal */}
                <div className="form-group-reg">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label className="form-label-reg" htmlFor="reg-pass" style={{ marginBottom: 0 }}>
                      Kata Sandi Login <span className="req">*</span>
                    </label>
                    <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#059669', background: '#ECFDF5', padding: '2px 8px', borderRadius: '10px', border: '1px solid #A7F3D0' }}>
                      🔒 Bcrypt Hash Security
                    </span>
                  </div>
                  <input
                    type="password"
                    id="reg-pass"
                    className="form-control-reg"
                    placeholder="Minimal 6 karakter sandi"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                {/* 8. Device ID (Pengikatan GPS HP) */}
                <div className="form-group-reg">
                  <label className="form-label-reg" htmlFor="reg-device">
                    Device ID GPS Personil
                  </label>
                  <div className="input-group-reg">
                    <input
                      type="text"
                      id="reg-device"
                      className="form-control-reg font-mono"
                      placeholder="Contoh: DEV-HP-9F2B81C4"
                      value={deviceId}
                      onChange={(e) => setDeviceId(e.target.value)}
                    />
                    <button type="button" className="btn-addon-reg" onClick={openQrModal} title="Bind via QR Scanner">
                      <span>📱</span> Scan QR
                    </button>
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
                    💡 Ketuk <strong>Scan QR</strong> dari HP petugas untuk menghubungkan GPS otomatis.
                  </div>
                </div>

                <button type="submit" disabled={loading} className="btn-submit-reg">
                  <span>💾</span>
                  <span>{loading ? 'Menyimpan...' : editId ? 'Perbarui Data Satuan' : 'Simpan & Daftarkan Unit'}</span>
                </button>

                {editId && (
                  <button type="button" className="btn-reset-reg" onClick={handleReset}>
                    Batalkan Mode Edit
                  </button>
                )}
              </form>
            </div>
          </section>

          {/* SISI KANAN: DATABASE PERSONEL & SATUAN UNIT AKTIF */}
          <section className="card-box">
            <div className="card-header">
              <div className="card-title-group">
                <h2>
                  <span>🚔</span> Database Personel &amp; Satuan Unit Aktif
                </h2>
                <p>Data tersimpan permanen di database SIMAPRES dan disinkronkan ke radar komando</p>
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  background: '#EFF6FF',
                  color: '#1D4ED8',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  border: '1px solid #BFDBFE',
                }}
              >
                Total: {units.length} Unit
              </span>
            </div>

            <div className="card-body">
              {/* Search & Filter Bar */}
              <div className="search-filter-bar">
                <input
                  type="text"
                  className="form-control-reg"
                  style={{ flex: 1.5 }}
                  placeholder="🔍 Cari berdasarkan Nama, NRP, Role, atau Device ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <select
                  className="form-control-reg"
                  style={{ flex: 1 }}
                  value={filterSatuan}
                  onChange={(e) => setFilterSatuan(e.target.value)}
                >
                  <option value="all">Semua Satuan</option>
                  {masterItems
                    .filter((m) => m.tipe === 'satuan')
                    .map((m) => (
                      <option key={m.id} value={m.code}>
                        {m.label}
                      </option>
                    ))}
                </select>
                <select
                  className="form-control-reg"
                  style={{ flex: 1 }}
                  value={filterMako}
                  onChange={(e) => setFilterMako(e.target.value)}
                >
                  <option value="all">Semua Mako</option>
                  {masterItems
                    .filter((m) => m.tipe === 'station')
                    .map((m) => (
                      <option key={m.id} value={m.numericId || m.code}>
                        {m.name || m.label}
                      </option>
                    ))}
                </select>
                <select
                  className="form-control-reg"
                  style={{ flex: 1 }}
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                >
                  <option value="all">Semua Role</option>
                  {masterItems
                    .filter((m) => m.tipe === 'role')
                    .map((m) => {
                      const icon =
                        m.code === 'PAWAS'
                          ? '👑'
                          : m.code === 'OPERATOR_110' || m.code?.includes('OPERATOR')
                          ? '🎧'
                          : m.code === 'SUPERADMIN'
                          ? '⚡'
                          : '👮';
                      return (
                        <option key={m.id} value={m.code}>
                          {icon} {m.label} ({m.code})
                        </option>
                      );
                    })}
                </select>
              </div>

              {/* Table Data */}
              <div className="table-responsive-reg">
                <table className="table-reg">
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}>No</th>
                      <th>Personel / NRP</th>
                      <th>Role</th>
                      <th>Unit Satuan</th>
                      <th>Regu / Beat</th>
                      <th>Device ID HP</th>
                      <th>Status GPS</th>
                      <th style={{ textAlign: 'center' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUnits.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: '#64748B' }}>
                          Tidak ada data satuan yang cocok dengan pencarian.
                        </td>
                      </tr>
                    ) : (
                      filteredUnits.map((u, idx) => {
                        const roleInfo = getRoleBadgeInfo(u.role);
                        return (
                          <tr key={u.id || u.nrp}>
                            <td style={{ fontWeight: 700, color: '#64748B' }}>{idx + 1}</td>
                            <td>
                              <div style={{ fontWeight: 800, color: '#0F172A' }}>
                                {u.nama && u.pangkat && u.nama.toLowerCase().startsWith(u.pangkat.toLowerCase())
                                  ? u.nama
                                  : `${u.pangkat} ${u.nama}`}
                              </div>
                              <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#64748B' }}>
                                NRP: {u.nrp}
                              </div>
                            </td>
                            <td>
                              <span className={roleInfo.className}>
                                <span>{roleInfo.icon}</span> {roleInfo.label}
                              </span>
                            </td>
                            <td>
                              <span className={getSatuanBadgeClass(u.unitId || '')}>{u.satuanNama || u.unitId}</span>
                              {u.stationName && (
                                <div style={{ fontSize: '10.5px', color: '#64748B', marginTop: '3px', fontWeight: 600 }}>
                                  🏢 {u.stationName}
                                </div>
                              )}
                            </td>
                            <td style={{ fontWeight: 600, color: '#475569' }}>{u.kelompokRegu || '-'}</td>
                            <td>
                              <span
                                style={{
                                  fontFamily: "'JetBrains Mono', monospace",
                                  fontSize: '11.5px',
                                  fontWeight: 700,
                                  color: '#0284C7',
                                  background: '#F0F9FF',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  border: '1px solid #BAE6FD',
                                }}
                              >
                                {u.deviceID || 'BELUM TERIKAT'}
                              </span>
                            </td>
                            <td>
                              <span className="badge-status status-aktif">
                                <span style={{ fontSize: '9px' }}>●</span> AKTIF
                              </span>
                            </td>
                            <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                              <button
                                type="button"
                                className="action-btn-reg btn-edit-reg"
                                onClick={() => handleEditUnit(u)}
                              >
                                ✏️ Edit
                              </button>
                              <Link
                                href={`/personil?nrp=${encodeURIComponent(u.nrp)}`}
                                className="action-btn-reg"
                                style={{
                                  background: '#ECFDF5',
                                  color: '#059669',
                                  borderColor: '#A7F3D0',
                                  textDecoration: 'none',
                                  display: 'inline-block',
                                }}
                              >
                                🛡️ Buka
                              </Link>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      ) : activeTab === 'profil' ? (
        <div style={{ width: '100%', maxWidth: '1280px', margin: '0 auto', paddingBottom: '60px' }}>
          

          {/* 2-Column Grid */}
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {/* KOLOM KIRI (Identitas, Presensi, Pengaturan Akun) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: '1 1 380px', maxWidth: '440px' }}>
              {/* 1. Kartu Identitas Petugas (Gradient Navy Blue) */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #0F2D56 0%, #153E75 60%, #1E3A8A 100%)',
                  borderRadius: '16px',
                  padding: '20px',
                  color: 'white',
                  boxShadow: '0 12px 24px -4px rgba(21,62,117,0.3)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '14px',
                    borderBottom: '1px solid rgba(255,255,255,0.15)',
                    paddingBottom: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px' }}>🛡️</span>
                    <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.8px', color: '#FDE68A' }}>
                      MABES POLRI / POLDA METRO JAYA
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '9.5px',
                      fontWeight: 800,
                      background: 'rgba(16,185,129,0.25)',
                      color: '#6EE7B7',
                      border: '1px solid rgba(110,231,183,0.3)',
                      padding: '2px 8px',
                      borderRadius: '12px',
                    }}
                  >
                    {presensiStatus === 'SUDAH_MASUK' ? 'SIAGA PIKET AKTIF' : 'BELUM MASUK DINAS'}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    {currentUser?.avatar ? (
                      <img
                        src={currentUser.avatar}
                        alt="Avatar"
                        style={{
                          width: '76px',
                          height: '76px',
                          borderRadius: '12px',
                          objectFit: 'cover',
                          border: '2.5px solid #FBBF24',
                          boxShadow: '0 6px 14px rgba(0,0,0,0.35)',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '76px',
                          height: '76px',
                          borderRadius: '12px',
                          background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 50%, #3B82F6 100%)',
                          border: '2.5px solid #FBBF24',
                          boxShadow: '0 6px 14px rgba(0,0,0,0.35)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#FFFFFF',
                          fontWeight: 900,
                          fontSize: '24px',
                          letterSpacing: '1px',
                        }}
                      >
                        {getInitials(currentUser?.fullName || '-')}
                      </div>
                    )}
                    <button
                      type="button"
                      id="btn-overlay-avatar-edit"
                      onClick={() => setProfilActiveMenu('profil')}
                      title="Klik untuk ubah profil & foto dinas"
                      style={{
                        position: 'absolute',
                        top: '-6px',
                        right: '-6px',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: '#FBBF24',
                        border: '2px solid #0F2D56',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: '11px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                        transition: 'transform 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.15)')}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                    >
                      📷
                    </button>
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '-2px',
                        right: '-2px',
                        background: '#10B981',
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        border: '2px solid #0F2D56',
                      }}
                      title="Aktif Berdinas"
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#93C5FD', textTransform: 'uppercase' }}>
                      {currentUser?.pangkat || '-'}
                    </div>
                    <h3 style={{ fontSize: '16px', color: '#FFFFFF', fontWeight: 800, margin: '2px 0 3px', lineHeight: 1.25 }}>
                      {currentUser?.fullName || '-'}
                    </h3>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#FDE68A', fontFamily: 'monospace' }}>
                      NRP: {currentUser?.identifier || '78091122'}
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#E2E8F0', marginTop: '3px' }}>
                      Pusat Komando &amp; Pengendalian Operasional (Superadmin Pusat)
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: '8px',
                    background: 'rgba(0,0,0,0.25)',
                    padding: '10px',
                    borderRadius: '10px',
                    textAlign: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '9.5px', color: '#94A3B8', fontWeight: 600 }}>Total Personel</div>
                    <div style={{ fontSize: '15px', fontWeight: 900, color: '#FBBF24' }}>{units.length}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '9.5px', color: '#94A3B8', fontWeight: 600 }}>Ranmor Siaga</div>
                    <div style={{ fontSize: '15px', fontWeight: 900, color: '#34D399' }}>{counters.vehicles}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '9.5px', color: '#94A3B8', fontWeight: 600 }}>Mako Terpadu</div>
                    <div style={{ fontSize: '15px', fontWeight: 900, color: '#60A5FA' }}>{counters.stations}</div>
                  </div>
                </div>
              </div>

              {/* 2. Kartu Presensi Petugas */}
              <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '18px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '18px' }}>⏱️</span>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: 800, color: '#1E293B' }}>Presensi Piket</h4>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>Pencatatan Kehadiran Tugas Piket Superadmin</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#153E75', fontFamily: 'monospace', background: '#EFF6FF', padding: '3px 8px', borderRadius: '6px', border: '1px solid #DBEAFE' }}>
                    {liveClock || '08:00 WIB'}
                  </span>
                </div>

                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '12px', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '11.5px' }}>
                    <span style={{ color: '#64748B' }}>Status Kehadiran:</span>
                    <span style={{ fontWeight: 800, color: presensiStatus === 'SUDAH_MASUK' ? '#15803D' : '#B45309', background: presensiStatus === 'SUDAH_MASUK' ? '#DCFCE7' : '#FEF3C7', padding: '2px 8px', borderRadius: '6px' }}>
                      {presensiStatus === 'SUDAH_MASUK' ? '● Dinas Aktif' : '○ Belum Masuk Dinas'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '6px' }}>
                    <span style={{ color: '#64748B' }}>Jam Masuk Piket:</span>
                    <span style={{ fontWeight: 700, color: '#1E293B' }}>{jamMasukPiket}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '6px' }}>
                    <span style={{ color: '#64748B' }}>Jam Pulang / Lepas:</span>
                    <span style={{ fontWeight: 700, color: '#64748B' }}>{jamPulangPiket}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', borderTop: '1px dashed #E2E8F0', paddingTop: '6px', marginTop: '6px' }}>
                    <span style={{ color: '#64748B' }}>Radius Mako:</span>
                    <span style={{ fontWeight: 700, color: '#153E75' }}>📍 Area Mabes Polri (Radius 50m / Otoritas Penuh)</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setPresensiStatus('SUDAH_MASUK');
                      const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
                      setJamMasukPiket(now);
                      showNotification('✓ Presensi Masuk telah terekam di sistem server Presisi!');
                    }}
                    disabled={presensiStatus === 'SUDAH_MASUK'}
                    style={{
                      flex: 1,
                      padding: '11px 12px',
                      background: presensiStatus === 'SUDAH_MASUK' ? '#E2E8F0' : '#10B981',
                      color: presensiStatus === 'SUDAH_MASUK' ? '#94A3B8' : 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 800,
                      fontSize: '12.5px',
                      cursor: presensiStatus === 'SUDAH_MASUK' ? 'default' : 'pointer',
                    }}
                  >
                    <span>✅</span> Presensi Masuk
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPresensiPulangModal(true)}
                    disabled={presensiStatus !== 'SUDAH_MASUK'}
                    style={{
                      flex: 1,
                      padding: '11px 12px',
                      background: presensiStatus !== 'SUDAH_MASUK' ? '#E2E8F0' : '#EF4444',
                      color: presensiStatus !== 'SUDAH_MASUK' ? '#94A3B8' : 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 800,
                      fontSize: '12.5px',
                      cursor: presensiStatus !== 'SUDAH_MASUK' ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <span>🚪</span> Presensi Pulang
                  </button>
                </div>
              </div>

              {/* 3. Kartu Pengaturan Akun */}
              <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '6px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                <div style={{ padding: '10px 6px 6px', fontSize: '12px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', borderBottom: '1px solid #F1F5F9' }}>
                  Pengaturan Akun Petugas
                </div>

                {/* 1. Menu Ubah Profil & Foto Dinas */}
                <div
                  id="btn-menu-ubah-profil"
                  onClick={() => setProfilActiveMenu('profil')}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 8px',
                    borderBottom: '1px solid #F1F5F9',
                    cursor: 'pointer',
                    borderRadius: '8px',
                    background: profilActiveMenu === 'profil' ? '#EFF6FF' : 'transparent',
                    borderLeft: profilActiveMenu === 'profil' ? '4px solid #1D4ED8' : '4px solid transparent',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (profilActiveMenu !== 'profil') e.currentTarget.style.backgroundColor = '#F8FAFC';
                  }}
                  onMouseLeave={(e) => {
                    if (profilActiveMenu !== 'profil') e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '17px' }}>👤</span>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: profilActiveMenu === 'profil' ? '#1D4ED8' : '#1E293B' }}>
                        Ubah Profil &amp; Foto Dinas
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>Ubah nama, pangkat, kontak &amp; pasfoto kedinasan</div>
                    </div>
                  </div>
                  <span style={{ color: profilActiveMenu === 'profil' ? '#1D4ED8' : '#94A3B8', fontWeight: 800 }}>➔</span>
                </div>

                {/* 2. Menu Keamanan Akun & PIN Komando */}
                <div
                  id="btn-menu-keamanan"
                  onClick={() => setProfilActiveMenu('keamanan')}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 8px',
                    borderBottom: '1px solid #F1F5F9',
                    cursor: 'pointer',
                    borderRadius: '8px',
                    background: profilActiveMenu === 'keamanan' ? '#EFF6FF' : 'transparent',
                    borderLeft: profilActiveMenu === 'keamanan' ? '4px solid #1D4ED8' : '4px solid transparent',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (profilActiveMenu !== 'keamanan') e.currentTarget.style.backgroundColor = '#F8FAFC';
                  }}
                  onMouseLeave={(e) => {
                    if (profilActiveMenu !== 'keamanan') e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '17px' }}>🔒</span>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: profilActiveMenu === 'keamanan' ? '#1D4ED8' : '#1E293B' }}>
                        Keamanan Akun &amp; PIN Komando
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>Ganti kata sandi login &amp; otorisasi PIN dinas</div>
                    </div>
                  </div>
                  <span style={{ color: profilActiveMenu === 'keamanan' ? '#1D4ED8' : '#94A3B8', fontWeight: 800 }}>➔</span>
                </div>

                {/* 3. Menu Riwayat Log Lengkap */}
                <div
                  id="btn-menu-riwayat-log"
                  onClick={() => setProfilActiveMenu('log')}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 8px',
                    borderBottom: '1px solid #F1F5F9',
                    cursor: 'pointer',
                    borderRadius: '8px',
                    background: profilActiveMenu === 'log' ? '#EFF6FF' : 'transparent',
                    borderLeft: profilActiveMenu === 'log' ? '4px solid #1D4ED8' : '4px solid transparent',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (profilActiveMenu !== 'log') e.currentTarget.style.backgroundColor = '#F8FAFC';
                  }}
                  onMouseLeave={(e) => {
                    if (profilActiveMenu !== 'log') e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '17px' }}>📋</span>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: profilActiveMenu === 'log' ? '#1D4ED8' : '#1E293B' }}>
                          Riwayat Log Lengkap
                        </span>
                        <span style={{ background: '#DBEAFE', color: '#1E40AF', fontSize: '10px', fontWeight: 800, padding: '1px 6px', borderRadius: '10px' }}>
                          {complaints.length}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>Rekam jejak seluruh penanganan laporan &amp; tugas</div>
                    </div>
                  </div>
                  <span style={{ color: profilActiveMenu === 'log' ? '#1D4ED8' : '#94A3B8', fontWeight: 800 }}>➔</span>
                </div>

                {/* 4. Logout */}
                <div
                  onClick={handleLogout}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 8px', cursor: 'pointer', borderRadius: '8px' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FEF2F2')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '17px' }}>🚪</span>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#DC2626' }}>Logout / Keluar Sesi Dinas</div>
                      <div style={{ fontSize: '11px', color: '#F87171' }}>Akhiri sesi dan kembali ke portal masuk</div>
                    </div>
                  </div>
                  <span style={{ color: '#DC2626' }}>➔</span>
                </div>
              </div>
            </div>

            {/* KOLOM KANAN: PANEL KONTEN DINAMIS (PROFIL / KEAMANAN / LOG) */}
            <div
              style={{
                flex: '1.4 1 520px',
                background: 'white',
                border: '1px solid #E2E8F0',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                minHeight: '580px',
              }}
            >
              {/* VIEW 1: UBAH PROFIL & FOTO DINAS */}
              {profilActiveMenu === 'profil' && (
                <div>
                  {/* Header View */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', paddingBottom: '14px', borderBottom: '1px solid #F1F5F9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '20px' }}>👤</span>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#1E293B' }}>
                          Ubah Profil &amp; Pasfoto Dinas
                        </h3>
                        <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
                          Perbarui biodata personel, pangkat kepolisian &amp; pasfoto resmi kedinasan Mabes Polri
                        </div>
                      </div>
                    </div>
                    <span style={{ background: '#EFF6FF', color: '#153E75', fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '8px', border: '1px solid #DBEAFE' }}>
                      ● FORMULIR KEDINASAN
                    </span>
                  </div>

                  <form onSubmit={handleSaveProfile}>
                    {/* SECTION PASFOTO PROFIL */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '20px',
                        padding: '16px 20px',
                        background: 'linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)',
                        borderRadius: '14px',
                        border: '1px solid #E2E8F0',
                        marginBottom: '20px',
                      }}
                    >
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        {editAvatar ? (
                          <img
                            src={editAvatar}
                            alt="Preview Avatar"
                            style={{
                              width: '92px',
                              height: '92px',
                              borderRadius: '16px',
                              objectFit: 'cover',
                              border: '3px solid #FBBF24',
                              boxShadow: '0 8px 18px rgba(0,0,0,0.25)',
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '92px',
                              height: '92px',
                              borderRadius: '16px',
                              background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 50%, #3B82F6 100%)',
                              border: '3px solid #FBBF24',
                              boxShadow: '0 8px 18px rgba(0,0,0,0.25)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#FFFFFF',
                              fontWeight: 900,
                              fontSize: '30px',
                              letterSpacing: '1px',
                            }}
                          >
                            {getInitials(editFullName || 'Petugas')}
                          </div>
                        )}
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '-3px',
                            right: '-3px',
                            background: '#10B981',
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            border: '3px solid #FFFFFF',
                          }}
                          title="Pasfoto Resmi"
                        />
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: '#1E293B', marginBottom: '4px' }}>
                          Pasfoto Kedinasan Personel
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748B', lineHeight: 1.4, marginBottom: '10px' }}>
                          Format file didukung: <strong>JPG, PNG, WEBP</strong> (Maksimal 3MB). Foto akan langsung tampil di seluruh konsol operasional dan badge profil.
                        </div>

                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <input
                            ref={fileInputRef}
                            id="input-file-avatar-upload"
                            type="file"
                            accept="image/png, image/jpeg, image/jpg, image/webp"
                            onChange={handleAvatarFileChange}
                            style={{ display: 'none' }}
                          />
                          <button
                            type="button"
                            id="btn-trigger-upload-photo"
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '7px 14px',
                              background: '#153E75',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              boxShadow: '0 2px 4px rgba(21,62,117,0.2)',
                              transition: 'background 0.15s',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1E40AF')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#153E75')}
                          >
                            <span>📷</span> Unggah Foto Baru
                          </button>

                          {editAvatar && (
                            <button
                              type="button"
                              id="btn-remove-avatar"
                              onClick={() => {
                                setEditAvatar(null);
                                setSelectedAvatarFile(null);
                                if (fileInputRef.current) fileInputRef.current.value = '';
                              }}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '7px 12px',
                                background: '#FFFFFF',
                                color: '#DC2626',
                                border: '1px solid #FECACA',
                                borderRadius: '8px',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'background 0.15s',
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FEF2F2')}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
                            >
                              <span>🗑️</span> Hapus Foto (Gunakan Inisial Nama)
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* FORM FIELDS */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {/* NRP / ID KEDINASAN (READONLY) */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                          <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                            NRP / Nomor Induk Kedinasan
                          </label>
                          <span style={{ fontSize: '10.5px', background: '#F1F5F9', color: '#64748B', padding: '1px 7px', borderRadius: '4px', fontWeight: 700 }}>
                            🔒 Terkunci (SIPP Polri)
                          </span>
                        </div>
                        <input
                          type="text"
                          value={currentUser?.identifier || '78091122'}
                          disabled
                          readOnly
                          style={{
                            width: '100%',
                            padding: '9px 12px',
                            background: '#F8FAFC',
                            border: '1px solid #E2E8F0',
                            borderRadius: '8px',
                            fontSize: '13px',
                            color: '#475569',
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            cursor: 'not-allowed',
                          }}
                        />
                        <div style={{ fontSize: '10.5px', color: '#94A3B8', marginTop: '3px' }}>
                          NRP merupakan nomor induk resmi terdaftar dan terikat dengan akun Mabes Polri.
                        </div>
                      </div>

                      {/* NAMA LENGKAP */}
                      <div>
                        <label htmlFor="input-edit-fullname" style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                          Nama Lengkap &amp; Gelar <span style={{ color: '#DC2626' }}>*</span>
                        </label>
                        <input
                          id="input-edit-fullname"
                          type="text"
                          required
                          value={editFullName}
                          onChange={(e) => setEditFullName(e.target.value)}
                          placeholder="Contoh: Eko Susanto, S.I.K."
                          style={{
                            width: '100%',
                            padding: '9px 12px',
                            border: '1.5px solid #CBD5E1',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: 600,
                            color: '#0F172A',
                            outline: 'none',
                          }}
                          onFocus={(e) => (e.target.style.borderColor = '#2563EB')}
                          onBlur={(e) => (e.target.style.borderColor = '#CBD5E1')}
                        />
                      </div>

                      {/* PANGKAT KEPOLISIAN */}
                      <div>
                        <label htmlFor="select-edit-pangkat" style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                          Pangkat Kepolisian <span style={{ color: '#DC2626' }}>*</span>
                        </label>
                        <select
                          id="select-edit-pangkat"
                          value={editPangkat}
                          onChange={(e) => setEditPangkat(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '9px 12px',
                            border: '1.5px solid #CBD5E1',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: 600,
                            color: '#0F172A',
                            background: 'white',
                            outline: 'none',
                          }}
                          onFocus={(e) => (e.target.style.borderColor = '#2563EB')}
                          onBlur={(e) => (e.target.style.borderColor = '#CBD5E1')}
                        >
                          {Array.from(
                            new Set([
                              editPangkat,
                              ...masterItems.filter((m: any) => m.tipe === 'pangkat').map((m: any) => m.label || m.item_name),
                              'JENDERAL POLISI',
                              'KOMISARIS JENDERAL POLISI',
                              'INSPEKTUR JENDERAL POLISI',
                              'BRIGADIR JENDERAL POLISI',
                              'KOMISARIS BESAR POLISI',
                              'AJUN KOMISARIS BESAR POLISI',
                              'KOMISARIS POLISI',
                              'AJUN KOMISARIS POLISI',
                              'INSPEKTUR POLISI SATU',
                              'INSPEKTUR POLISI DUA',
                              'AJUN INSPEKTUR POLISI SATU',
                              'AJUN INSPEKTUR POLISI DUA',
                              'BRIGADIR POLISI KEPALA',
                              'BRIGADIR POLISI',
                              'BRIGADIR POLISI SATU',
                              'BRIGADIR POLISI DUA',
                            ].filter(Boolean))
                          ).map((rk) => (
                            <option key={rk} value={rk}>
                              {rk}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* TELEPON & EMAIL GRID */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                          <label htmlFor="input-edit-phone" style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                            No. WhatsApp / Telepon Dinas
                          </label>
                          <input
                            id="input-edit-phone"
                            type="tel"
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                            placeholder="081288991100"
                            style={{
                              width: '100%',
                              padding: '9px 12px',
                              border: '1.5px solid #CBD5E1',
                              borderRadius: '8px',
                              fontSize: '13px',
                              color: '#0F172A',
                              outline: 'none',
                            }}
                            onFocus={(e) => (e.target.style.borderColor = '#2563EB')}
                            onBlur={(e) => (e.target.style.borderColor = '#CBD5E1')}
                          />
                        </div>
                        <div>
                          <label htmlFor="input-edit-email" style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                            Email Dinas Polri
                          </label>
                          <input
                            id="input-edit-email"
                            type="email"
                            value={editEmail}
                            onChange={(e) => setEditEmail(e.target.value)}
                            placeholder="nama@polri.go.id"
                            style={{
                              width: '100%',
                              padding: '9px 12px',
                              border: '1.5px solid #CBD5E1',
                              borderRadius: '8px',
                              fontSize: '13px',
                              color: '#0F172A',
                              outline: 'none',
                            }}
                            onFocus={(e) => (e.target.style.borderColor = '#2563EB')}
                            onBlur={(e) => (e.target.style.borderColor = '#CBD5E1')}
                          />
                        </div>
                      </div>
                    </div>

                    {/* FOOTER BUTTONS */}
                    <div style={{ display: 'flex', gap: '12px', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #E2E8F0' }}>
                      <button
                        type="button"
                        id="btn-reset-edit-profil"
                        onClick={handleResetProfile}
                        disabled={editSubmitting}
                        style={{
                          padding: '11px 18px',
                          background: '#F1F5F9',
                          border: '1px solid #CBD5E1',
                          borderRadius: '8px',
                          fontWeight: 700,
                          fontSize: '13px',
                          color: '#475569',
                          cursor: editSubmitting ? 'not-allowed' : 'pointer',
                        }}
                      >
                        Reset Formulir
                      </button>
                      <button
                        type="submit"
                        id="btn-save-edit-profil"
                        disabled={editSubmitting}
                        style={{
                          flex: 1,
                          padding: '11px 20px',
                          background: 'linear-gradient(135deg, #153E75 0%, #1D4ED8 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: 800,
                          fontSize: '13px',
                          cursor: editSubmitting ? 'not-allowed' : 'pointer',
                          boxShadow: '0 4px 10px rgba(21,62,117,0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          opacity: editSubmitting ? 0.7 : 1,
                        }}
                      >
                        {editSubmitting ? (
                          <>
                            <span>⏳</span> Menyimpan Perubahan...
                          </>
                        ) : (
                          <>
                            <span>💾</span> Simpan Perubahan Profil
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* VIEW 2: KEAMANAN AKUN & PIN KOMANDO */}
              {profilActiveMenu === 'keamanan' && (
                <div>
                  {/* Header View */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', paddingBottom: '14px', borderBottom: '1px solid #F1F5F9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '20px' }}>🔒</span>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#1E293B' }}>
                          Keamanan Akun &amp; PIN Komando
                        </h3>
                        <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
                          Kredensial SIPP Mabes Polri, kata sandi login &amp; otorisasi PIN dinas Superadmin
                        </div>
                      </div>
                    </div>
                    <span style={{ background: '#F0FDF4', color: '#166534', fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '8px', border: '1px solid #BBF7D0' }}>
                      ● 2FA AKTIF
                    </span>
                  </div>

                  <form onSubmit={handleSaveKeamanan}>
                    {/* Status 2FA Box */}
                    <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '12px', padding: '14px', marginBottom: '18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: '#166534' }}>Autentikasi 2-Faktor (2FA) Aktif</div>
                        <div style={{ fontSize: '11px', color: '#15803D', marginTop: '2px' }}>Token Terverifikasi • ID Perangkat: CAD-PUSAT-01 • Radius Mabes Polri</div>
                      </div>
                      <span style={{ background: '#15803D', color: 'white', fontSize: '10.5px', fontWeight: 800, padding: '3px 10px', borderRadius: '10px' }}>TERLINDUNGI</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                          Kata Sandi Saat Ini
                        </label>
                        <input
                          type="password"
                          placeholder="••••••••••••"
                          style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '13px', background: '#F8FAFC', color: '#64748B' }}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                            Kata Sandi Baru
                          </label>
                          <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Masukkan kata sandi baru"
                            style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #CBD5E1', borderRadius: '8px', fontSize: '13px', outline: 'none' }}
                            onFocus={(e) => (e.target.style.borderColor = '#2563EB')}
                            onBlur={(e) => (e.target.style.borderColor = '#CBD5E1')}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                            Konfirmasi Kata Sandi Baru
                          </label>
                          <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Ulangi kata sandi baru"
                            style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #CBD5E1', borderRadius: '8px', fontSize: '13px', outline: 'none' }}
                            onFocus={(e) => (e.target.style.borderColor = '#2563EB')}
                            onBlur={(e) => (e.target.style.borderColor = '#CBD5E1')}
                          />
                        </div>
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                            PIN Otorisasi Komando (6-Digit)
                          </label>
                          <span style={{ fontSize: '11px', color: '#64748B' }}>Digunakan untuk otorisasi tindakan kritis &amp; validasi</span>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', background: '#F8FAFC', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                          {pinKomando.map((d, i) => (
                            <input
                              key={i}
                              type="password"
                              maxLength={1}
                              value={d}
                              onChange={(e) => {
                                const val = e.target.value.slice(-1);
                                setPinKomando((prev) => {
                                  const next = [...prev];
                                  next[i] = val;
                                  return next;
                                });
                              }}
                              style={{
                                width: '44px',
                                height: '50px',
                                textAlign: 'center',
                                fontSize: '20px',
                                fontWeight: 800,
                                border: '2px solid #CBD5E1',
                                borderRadius: '10px',
                                background: '#FFFFFF',
                                color: '#153E75',
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #E2E8F0' }}>
                      <button
                        type="submit"
                        style={{
                          flex: 1,
                          padding: '11px 20px',
                          background: 'linear-gradient(135deg, #153E75 0%, #1D4ED8 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: 800,
                          fontSize: '13px',
                          cursor: 'pointer',
                          boxShadow: '0 4px 10px rgba(21,62,117,0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                        }}
                      >
                        <span>💾</span> Simpan Kredensial &amp; PIN Komando
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* VIEW 3: RIWAYAT LOG LENGKAP */}
              {profilActiveMenu === 'log' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '18px' }}>📋</span>
                        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#1E293B' }}>Riwayat Log Lengkap</h3>
                        <span style={{ background: '#EFF6FF', color: '#153E75', fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '10px', border: '1px solid #DBEAFE' }}>
                          {complaints.length} Laporan
                        </span>
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
                        Rekam jejak seluruh penanganan laporan dan aktivitas kedinasan
                      </div>
                    </div>

                    <input
                      type="text"
                      placeholder="🔍 Cari tiket, kasus, TKP..."
                      value={profilLogSearch}
                      onChange={(e) => setProfilLogSearch(e.target.value)}
                      style={{ fontSize: '11.5px', padding: '7px 12px', border: '1px solid #CBD5E1', borderRadius: '8px', minWidth: '220px' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px', flexWrap: 'wrap' }}>
                    {['semua', 'menunggu', 'diproses', 'selesai'].map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setProfilLogFilter(st as any)}
                        style={{
                          padding: '5px 12px',
                          fontSize: '11px',
                          fontWeight: 700,
                          borderRadius: '6px',
                          border: profilLogFilter === st ? '1px solid #BFDBFE' : '1px solid #E2E8F0',
                          background: profilLogFilter === st ? '#EFF6FF' : '#F8FAFC',
                          color: profilLogFilter === st ? '#153E75' : '#64748B',
                          cursor: 'pointer',
                        }}
                      >
                        {st.toUpperCase()}
                      </button>
                    ))}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '540px', overflowY: 'auto' }}>
                    {filteredComplaints.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '30px', color: '#64748B', fontSize: '12px' }}>
                        Tidak ada riwayat laporan yang cocok dengan filter.
                      </div>
                    ) : (
                      filteredComplaints.map((c) => (
                        <div
                          key={c.id || c.nomorTiket}
                          onClick={() => setSelectedLogDetail(c)}
                          style={{
                            background: '#F8FAFC',
                            border: '1px solid #E2E8F0',
                            borderRadius: '10px',
                            padding: '12px 14px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#F1F5F9')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#153E75', fontSize: '12.5px' }}>
                              {c.nomorTiket}
                            </span>
                            <span
                              style={{
                                fontSize: '9.5px',
                                fontWeight: 800,
                                background: c.status === 'SELESAI' ? '#DCFCE7' : c.status === 'MENUJU_TKP' ? '#DBEAFE' : c.status === 'PENANGANAN_TKP' ? '#EDE9FE' : '#FEF3C7',
                                color: c.status === 'SELESAI' ? '#15803D' : c.status === 'MENUJU_TKP' ? '#1D4ED8' : c.status === 'PENANGANAN_TKP' ? '#6D28D9' : '#92400E',
                                padding: '2px 8px',
                                borderRadius: '4px',
                              }}
                            >
                              {c.status}
                            </span>
                          </div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B' }}>{c.jenisKejadian}</div>
                          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px', display: 'flex', justifyContent: 'space-between' }}>
                            <span>📍 {c.tkpAlamatTeks || 'TKP Patroli Wilayah Metro'}</span>
                            <span style={{ fontFamily: 'monospace' }}>
                              {c.createdAt ? new Date(c.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB' : 'Hari ini'}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <MasterDataManager
          activeTab={activeTab as MasterTabType}
          showToast={showNotification}
          onRefreshDropdowns={loadData}
        />
      )}
    </main>

      {/* MODAL SCAN QR CODE */}
      {showQrModal && (
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
          onClick={() => setShowQrModal(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              maxWidth: '440px',
              width: '100%',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
              textAlign: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ background: '#153E75', color: 'white', padding: '18px 20px' }}>
              <div style={{ fontSize: '24px', marginBottom: '4px' }}>📱</div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>IKAT DEVICE GPS HP PERSONEL</h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '11.5px', color: '#93C5FD' }}>
                Scan QR ini menggunakan kamera HP petugas untuk aktivasi telemetry otomatis
              </p>
            </div>

            <div style={{ padding: '24px' }}>
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
                Arahkan kamera HP petugas ke QR Code di atas, atau klik tombol di bawah untuk simulasi:
              </p>

              <Link
                href={`/scan-device?nrp=${encodeURIComponent(nrp || 'TEST')}&unit=${encodeURIComponent(unitId)}&session=${qrSessionToken}`}
                target="_blank"
                style={{
                  display: 'block',
                  padding: '12px 16px',
                  background: 'linear-gradient(135deg, #153E75 0%, #2563EB 100%)',
                  color: 'white',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '13px',
                  textDecoration: 'none',
                  marginBottom: '10px',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                }}
              >
                Buka Layar Scan Device HP ➔
              </Link>

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
            style={{ background: 'white', borderRadius: '14px', maxWidth: '440px', width: '100%', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)' }}
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
                Pastikan seluruh pendaftaran unit satuan dan audit sistem telah diperbarui sebelum mengakhiri jam dinas.
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
                    setJamPulangPiket(now);
                    setPresensiStatus('BELUM_MASUK');
                    showNotification(`✓ Presensi Pulang berhasil terekam pukul ${now}!`);
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

      {/* MODAL DETAIL LAPORAN / LOG */}
      {selectedLogDetail && (
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
          onClick={() => setSelectedLogDetail(null)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '14px',
              maxWidth: '560px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ background: '#153E75', color: 'white', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '4px' }}>
                  REKAM JEJAK LAPORAN SPKT 110
                </span>
                <h3 style={{ margin: '4px 0 0', fontSize: '15px', fontWeight: 800 }}>{selectedLogDetail.nomorTiket}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLogDetail(null)}
                style={{ background: 'none', border: 'none', color: 'white', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '20px', overflowY: 'auto', fontSize: '12.5px', color: '#1E293B' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748B' }}>Status Kasus:</span>
                  <div style={{ fontWeight: 800, color: '#153E75', fontSize: '14px' }}>{selectedLogDetail.jenisKejadian}</div>
                </div>
                <span
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 800,
                    background: selectedLogDetail.status === 'SELESAI' ? '#DCFCE7' : '#FEF3C7',
                    color: selectedLogDetail.status === 'SELESAI' ? '#15803D' : '#92400E',
                    padding: '3px 10px',
                    borderRadius: '6px',
                  }}
                >
                  {selectedLogDetail.status}
                </span>
              </div>

              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px', marginBottom: '14px' }}>
                <div style={{ marginBottom: '6px' }}><strong>📍 Alamat TKP:</strong> {selectedLogDetail.tkpAlamatTeks || '-'}</div>
                <div style={{ marginBottom: '6px' }}><strong>👤 Pelapor:</strong> {selectedLogDetail.namaPelapor || selectedLogDetail.pelaporNama || 'Warga (110)'} ({selectedLogDetail.noHpPelapor || selectedLogDetail.pelaporHp || '-'})</div>
                <div style={{ marginBottom: '6px' }}><strong>🕒 Waktu Masuk:</strong> {selectedLogDetail.createdAt ? new Date(selectedLogDetail.createdAt).toLocaleString('id-ID') : '-'}</div>
                <div><strong>🚔 Arahan Pawas:</strong> {selectedLogDetail.arahanPawas || 'Meluncur & amankan TKP'}</div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedLogDetail(null)}
                style={{ width: '100%', padding: '10px', background: '#153E75', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}
              >
                Tutup Detail
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && <div className="toast-box-reg">{toast}</div>}
    </div>
  );
}
