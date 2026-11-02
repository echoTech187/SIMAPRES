'use client';

import React, { useState, useEffect, useRef } from 'react';
import { updateUserProfileAndAvatarAction, updateUserPasswordAction } from '@/app/actions/auth.actions';
import { compressAndSanitizeImageClient } from '@/lib/client-image-compressor';
import { getInitials } from '../HeaderProfileBadge';
import ResponsiveModal from '@/components/ui/ResponsiveModal';
import NameInitialAvatar from '@/components/ui/NameInitialAvatar';
import { cadAudioPlayer } from '@/lib/cad-audio-player';

export interface TabProfilProps {
  currentUser: any;
  setCurrentUser: React.Dispatch<React.SetStateAction<any>>;
  units?: any[];
  counters?: any;
  complaints?: any[];
  showToast: (msg: string) => void;
  onLogout: () => void;
  onNavigateTab?: (tab: string) => void;
  onBackToBeranda?: () => void;
  roleBadge?: string;
  roleTitle?: string;
  makoTitle?: string;
  makoRadius?: number;
  responCepatPct?: string;
  policeOffices?: any[];
  presensiStatus?: 'SUDAH_MASUK' | 'BELUM_MASUK' | 'SUDAH_PULANG';
  setPresensiStatus?: React.Dispatch<React.SetStateAction<any>>;
  jamMasukPiket?: string;
  setJamMasukPiket?: React.Dispatch<React.SetStateAction<string>>;
  jamPulangPiket?: string;
  setJamPulangPiket?: React.Dispatch<React.SetStateAction<string>>;
}

export type TabProfilSuperadminProps = TabProfilProps;

export default function TabProfilSuperadmin({
  currentUser,
  setCurrentUser,
  units = [],
  counters = {},
  complaints = [],
  showToast,
  onLogout,
  onNavigateTab,
  onBackToBeranda,
  roleBadge,
  roleTitle,
  makoTitle,
  makoRadius,
  responCepatPct,
  policeOffices = [],
  presensiStatus: propPresensiStatus,
  setPresensiStatus: propSetPresensiStatus,
  jamMasukPiket: propJamMasukPiket,
  setJamMasukPiket: propSetJamMasukPiket,
  jamPulangPiket: propJamPulangPiket,
  setJamPulangPiket: propSetJamPulangPiket,
}: TabProfilSuperadminProps) {
  // Live Clock & Presensi States
  const [liveClock, setLiveClock] = useState<string>('');
  const [localPresensiStatus, setLocalPresensiStatus] = useState<'SUDAH_MASUK' | 'BELUM_MASUK' | 'SUDAH_PULANG'>('BELUM_MASUK');
  const [localJamMasuk, setLocalJamMasuk] = useState<string>('-');
  const [localJamPulang, setLocalJamPulang] = useState<string>('-');
  const [showPresensiPulangModal, setShowPresensiPulangModal] = useState<boolean>(false);
  // Modal States
  const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);

  const presensiStatus = propPresensiStatus ?? localPresensiStatus;
  const setPresensiStatus = propSetPresensiStatus ?? setLocalPresensiStatus;
  const jamMasukPiket = propJamMasukPiket ?? localJamMasuk;
  const setJamMasukPiket = propSetJamMasukPiket ?? setLocalJamMasuk;
  const jamPulangPiket = propJamPulangPiket ?? localJamPulang;
  const setJamPulangPiket = propSetJamPulangPiket ?? setLocalJamPulang;

  // Active Menu: 'profil' | 'keamanan' | 'log'
  const isOperator = roleBadge === 'OPERATOR' || currentUser?.role === 'OPERATOR';
  const [profilActiveMenu, setProfilActiveMenu] = useState<'profil' | 'keamanan' | 'log' | 'audio'>('profil');
  const [mobileActiveModal, setMobileActiveModal] = useState<'profil' | 'keamanan' | 'log' | 'audio' | null>(null);

  // Audio CAD Alert Preferences
  const [cadAudioTone, setCadAudioTone] = useState<string>('patwal');
  const [cadAudioVolume, setCadAudioVolume] = useState<number>(85);
  const [isPlayingTestAudio, setIsPlayingTestAudio] = useState<boolean>(false);
  const testAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isMobile, setIsMobile] = useState<boolean>(false);

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
  const [oldPassword, setOldPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [isSavingKeamanan, setIsSavingKeamanan] = useState<boolean>(false);
  const [pinKomando, setPinKomando] = useState<string[]>(['', '', '', '', '', '']);

  // Log filter & detail
  const [selectedLogDetail, setSelectedLogDetail] = useState<any | null>(null);
  const [profilLogSearch, setProfilLogSearch] = useState('');
  const [profilLogFilter, setProfilLogFilter] = useState<'semua' | 'menunggu' | 'diproses' | 'selesai'>('semua');

  // Deteksi ukuran layar Mobile (< 768px)
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Live Clock Interval
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLiveClock(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Sync profile form data with currentUser
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

  // Load and save CAD audio settings
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTone = localStorage.getItem('simapres_cad_audio_tone');
      const savedVol = localStorage.getItem('simapres_cad_audio_vol');
      if (savedTone) setCadAudioTone(savedTone);
      if (savedVol) setCadAudioVolume(Number(savedVol));
    }
  }, []);

  const handleTestAudioToggle = () => {
    if (isPlayingTestAudio) {
      cadAudioPlayer.stop();
      setIsPlayingTestAudio(false);
      return;
    }

    setIsPlayingTestAudio(true);
    cadAudioPlayer.play(cadAudioTone, cadAudioVolume, () => {
      setIsPlayingTestAudio(false);
    });
  };

  const handleToneChange = (newTone: string) => {
    setCadAudioTone(newTone);
    if (isPlayingTestAudio) {
      cadAudioPlayer.play(newTone, cadAudioVolume, () => {
        setIsPlayingTestAudio(false);
      });
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setCadAudioVolume(newVol);
    cadAudioPlayer.setVolume(newVol);
    if (isPlayingTestAudio) {
      cadAudioPlayer.play(cadAudioTone, newVol, () => {
        setIsPlayingTestAudio(false);
      });
    }
  };

  // Bersihkan audio saat komponen unmount
  useEffect(() => {
    return () => {
      cadAudioPlayer.stop();
    };
  }, []);

  const handleSaveAudioPreferences = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('simapres_cad_audio_tone', cadAudioTone);
      localStorage.setItem('simapres_cad_audio_vol', String(cadAudioVolume));
    }
    showToast('✓ Preferensi audio alarm CAD 110 berhasil disimpan!');
  };

  const handleOpenMenu = (menu: 'profil' | 'keamanan' | 'log' | 'audio') => {
    setProfilActiveMenu(menu);
    if (isMobile || (typeof window !== 'undefined' && window.innerWidth < 768)) {
      setMobileActiveModal(menu);
    }
  };

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
    showToast('Formulir profil telah dikembalikan ke data awal.');
  };

  const handleSaveKeamanan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) {
      showToast('Silakan masukkan kata sandi baru!');
      return;
    }
    if (newPassword.length < 8) {
      showToast('Kata sandi desktop minimal 8 karakter sesuai standar keamanan!');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Konfirmasi kata sandi baru tidak sesuai!');
      return;
    }

    setIsSavingKeamanan(true);
    try {
      const res = await updateUserPasswordAction(newPassword, oldPassword);
      if (res?.success) {
        showToast('✓ Kata sandi akun dinas berhasil diperbarui!');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        if (mobileActiveModal === 'keamanan') {
          setMobileActiveModal(null);
        }
      } else {
        showToast(`Gagal: ${res?.error || 'Terjadi kesalahan saat mengubah kata sandi.'}`);
      }
    } catch (err: any) {
      showToast(`Error: ${err?.message || 'Gagal mengubah kata sandi.'}`);
    } finally {
      setIsSavingKeamanan(false);
    }
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await compressAndSanitizeImageClient(file, {
        maxDimension: 512,
        quality: 0.80,
        maxSizeKB: 250,
      });

      if (!result.success || !result.dataUrl) {
        showToast(result.error || 'Berkas foto tidak memenuhi standar keamanan.');
        e.target.value = '';
        return;
      }

      setSelectedAvatarFile(file);
      setEditAvatar(result.dataUrl);
      showToast(`✓ Foto profil berhasil diverifikasi aman & terkompresi (${result.sizeKB} KB)! Klik "Simpan Perubahan Profil" untuk menerapkan.`);
    } catch (err: any) {
      showToast('Gagal memproses foto: ' + (err?.message || 'Format tidak didukung.'));
      e.target.value = '';
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFullName.trim()) {
      showToast('Nama lengkap tidak boleh kosong!');
      return;
    }

    setEditSubmitting(true);
    try {
      let finalAvatarUrl: string | null = editAvatar;

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
          const raw = sessionStorage.getItem('simopmas_active_user');
          if (raw) {
            try {
              const parsed = JSON.parse(raw);
              parsed.fullName = res.data.fullName;
              parsed.rankPangkat = res.data.pangkat;
              parsed.avatar = res.data.avatar;
              sessionStorage.setItem('simopmas_active_user', JSON.stringify(parsed));
            } catch (_) {}
          }
        }
        showToast('✓ Profil dan foto dinas berhasil diperbarui!');
        if (mobileActiveModal === 'profil') {
          setMobileActiveModal(null);
        }
      } else {
        showToast(`Gagal: ${res.error || 'Gagal menyimpan profil'}`);
      }
    } catch (err: any) {
      showToast(`Terjadi kesalahan: ${err.message || 'Gagal menyimpan'}`);
    } finally {
      setEditSubmitting(false);
    }
  };

  const filteredComplaints = complaints.filter((c) => {
    if (profilLogFilter === 'menunggu' && c.status !== 'MENUNGGU') return false;
    if (profilLogFilter === 'diproses' && c.status !== 'DIPROSES' && c.status !== 'MENUNGGU_PENGESAHAN') return false;
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

  // Render View 1: Formulir Profil
  const renderProfilForm = (isModal: boolean = false) => (
    <div>
      {!isModal && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            marginBottom: '18px',
            paddingBottom: '14px',
            borderBottom: '1px solid #F1F5F9',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: '#EFF6FF',
              color: '#1D4ED8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              flexShrink: 0,
              border: '1px solid #DBEAFE',
            }}
          >
            👤
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, fontSize: '15.5px', fontWeight: 800, color: '#1E293B' }}>
                Ubah Profil &amp; Pasfoto Dinas
              </h3>
              <span
                style={{
                  background: '#EFF6FF',
                  color: '#153E75',
                  fontSize: '10px',
                  fontWeight: 800,
                  padding: '2.5px 8px',
                  borderRadius: '6px',
                  border: '1px solid #DBEAFE',
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.3px',
                }}
              >
                ● FORMULIR KEDINASAN
              </span>
            </div>
            <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '3px', lineHeight: 1.4 }}>
              Perbarui biodata personel, pangkat kepolisian &amp; pasfoto resmi kedinasan Mabes Polri
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSaveProfile}>
        {/* SECTION PASFOTO PROFIL */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '16px',
            background: 'linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)',
            borderRadius: '14px',
            border: '1px solid #E2E8F0',
            marginBottom: '20px',
          }}
        >
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <NameInitialAvatar
              name={editFullName || 'Petugas'}
              avatarUrl={editAvatar}
              size={76}
              rounded="xl"
              variant="gold"
            />
            <div
              style={{
                position: 'absolute',
                bottom: '-2px',
                right: '-2px',
                background: '#10B981',
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                border: '2px solid #FFFFFF',
              }}
              title="Pasfoto Resmi"
            />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h4 style={{ margin: '0 0 3px', fontSize: '13.5px', fontWeight: 800, color: '#1E293B' }}>
              Pasfoto Kedinasan Personel
            </h4>
            <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '8px', lineHeight: 1.35 }}>
              Format JPG, PNG, WEBP (maks. 5MB)
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarFileChange}
                style={{ display: 'none' }}
                id="file-input-avatar-profile"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  padding: '7px 12px',
                  background: '#153E75',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <span>📷</span> Unggah Foto
              </button>
              {editAvatar && (
                <button
                  type="button"
                  onClick={() => {
                    setEditAvatar(null);
                    setSelectedAvatarFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                    showToast('Foto profil telah dihapus');
                  }}
                  style={{
                    padding: '7px 10px',
                    background: '#FEE2E2',
                    color: '#DC2626',
                    border: '1px solid #FECACA',
                    borderRadius: '8px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Hapus
                </button>
              )}
            </div>
          </div>
        </div>

        {/* SECTION BIODATA PERSONEL */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                Nama Lengkap &amp; Gelar <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="text"
                required
                value={editFullName}
                onChange={(e) => setEditFullName(e.target.value)}
                placeholder="Contoh: Aiptu Herman Sulistyo, S.H."
                style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #CBD5E1', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                onFocus={(e) => (e.target.style.borderColor = '#2563EB')}
                onBlur={(e) => (e.target.style.borderColor = '#CBD5E1')}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                NRP / NIP Kedinasan (Terkunci)
              </label>
              <input
                type="text"
                value={currentUser?.identifier || currentUser?.nrp || '-'}
                disabled
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #E2E8F0', borderRadius: '8px', background: '#F8FAFC', color: '#64748B', fontFamily: 'monospace', fontWeight: 700, fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                Pangkat Kepolisian
              </label>
              <input
                type="text"
                value={editPangkat}
                onChange={(e) => setEditPangkat(e.target.value)}
                placeholder="Contoh: AIPTU / BRIPKA / KOMPOL"
                style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #CBD5E1', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                onFocus={(e) => (e.target.style.borderColor = '#2563EB')}
                onBlur={(e) => (e.target.style.borderColor = '#CBD5E1')}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                Nomor Handphone / WhatsApp
              </label>
              <input
                type="tel"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="0812xxxxxxxx"
                style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #CBD5E1', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                onFocus={(e) => (e.target.style.borderColor = '#2563EB')}
                onBlur={(e) => (e.target.style.borderColor = '#CBD5E1')}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
              Email Kedinasan
            </label>
            <input
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              placeholder="petugas@polri.go.id"
              style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #CBD5E1', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
              onFocus={(e) => (e.target.style.borderColor = '#2563EB')}
              onBlur={(e) => (e.target.style.borderColor = '#CBD5E1')}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                Hak Akses Sistem
              </label>
              <input
                type="text"
                value={currentUser?.role || 'SUPERADMIN'}
                disabled
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #E2E8F0', borderRadius: '8px', background: '#F8FAFC', color: '#15803D', fontWeight: 800, fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                Wilayah Penugasan Mako
              </label>
              <input
                type="text"
                value={makoTitle || currentUser?.stationName || currentUser?.satuanNama || currentUser?.unit || 'Polres Pekalongan'}
                disabled
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #E2E8F0', borderRadius: '8px', background: '#F8FAFC', color: '#64748B', fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '10px',
              marginTop: isModal ? '24px' : '16px',
              paddingTop: isModal ? '14px' : '0',
              borderTop: isModal ? '1px solid #E2E8F0' : 'none',
              position: isModal ? 'sticky' : 'static',
              bottom: 0,
              background: '#FFFFFF',
              paddingBottom: isModal ? '8px' : '0',
              zIndex: 10,
              width: '100%',
            }}
          >
            <button
              type="submit"
              disabled={editSubmitting}
              style={{
                flex: 2,
                padding: '12px 16px',
                background: 'linear-gradient(135deg, #153E75 0%, #2563EB 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 800,
                cursor: editSubmitting ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(37,99,235,0.25)',
                whiteSpace: 'nowrap',
              }}
            >
              <span>💾</span> {editSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
            <button
              type="button"
              onClick={() => {
                handleResetProfile();
                if (isModal) setMobileActiveModal(null);
              }}
              style={{
                flex: 1,
                padding: '12px 16px',
                background: '#F1F5F9',
                color: '#475569',
                border: '1px solid #CBD5E1',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                whiteSpace: 'nowrap',
              }}
            >
              {isModal ? 'Tutup' : 'Batal'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );

  // Render View 2: Formulir Keamanan
  const renderKeamananForm = (isModal: boolean = false) => (
    <div>
      {!isModal && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            marginBottom: '18px',
            paddingBottom: '14px',
            borderBottom: '1px solid #F1F5F9',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: '#EFF6FF',
              color: '#1D4ED8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              flexShrink: 0,
              border: '1px solid #DBEAFE',
            }}
          >
            🔒
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, fontSize: '15.5px', fontWeight: 800, color: '#1E293B' }}>
                Keamanan Akun &amp; Kata Sandi
              </h3>
              <span
                style={{
                  background: '#EFF6FF',
                  color: '#153E75',
                  fontSize: '10px',
                  fontWeight: 800,
                  padding: '2.5px 8px',
                  borderRadius: '6px',
                  border: '1px solid #DBEAFE',
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.3px',
                }}
              >
                ● STANDAR KEAMANAN POLRI
              </span>
            </div>
            <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '3px', lineHeight: 1.4 }}>
              Perbarui kata sandi masuk sistem secara berkala untuk menjaga keamanan data operasional SIMOPMAS 110
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSaveKeamanan}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* UBAH KATA SANDI */}
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <span style={{ fontSize: '16px' }}>🔑</span>
              <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: 800, color: '#1E293B' }}>
                Ubah Kata Sandi Masuk Sistem
              </h4>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '520px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                  Kata Sandi Lama (Saat Ini) <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Masukkan kata sandi saat ini"
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #CBD5E1', borderRadius: '8px', fontSize: '13px', outline: 'none', background: 'white', boxSizing: 'border-box' }}
                  onFocus={(e) => (e.target.style.borderColor = '#2563EB')}
                  onBlur={(e) => (e.target.style.borderColor = '#CBD5E1')}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                    Kata Sandi Baru <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 8 karakter"
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #CBD5E1', borderRadius: '8px', fontSize: '13px', outline: 'none', background: 'white', boxSizing: 'border-box' }}
                    onFocus={(e) => (e.target.style.borderColor = '#2563EB')}
                    onBlur={(e) => (e.target.style.borderColor = '#CBD5E1')}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                    Konfirmasi Kata Sandi Baru <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi kata sandi baru"
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #CBD5E1', borderRadius: '8px', fontSize: '13px', outline: 'none', background: 'white', boxSizing: 'border-box' }}
                    onFocus={(e) => (e.target.style.borderColor = '#2563EB')}
                    onBlur={(e) => (e.target.style.borderColor = '#CBD5E1')}
                  />
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '10px',
              marginTop: isModal ? '24px' : '16px',
              paddingTop: isModal ? '14px' : '0',
              borderTop: isModal ? '1px solid #E2E8F0' : 'none',
              position: isModal ? 'sticky' : 'static',
              bottom: 0,
              background: '#FFFFFF',
              paddingBottom: isModal ? '8px' : '0',
              zIndex: 10,
              width: '100%',
            }}
          >
            <button
              type="submit"
              disabled={isSavingKeamanan}
              style={{
                flex: 2,
                padding: '12px 16px',
                background: isSavingKeamanan ? '#94A3B8' : 'linear-gradient(135deg, #153E75 0%, #2563EB 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 800,
                cursor: isSavingKeamanan ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: isSavingKeamanan ? 'none' : '0 4px 12px rgba(37,99,235,0.25)',
                whiteSpace: 'nowrap',
              }}
            >
              <span>🛡️</span> {isSavingKeamanan ? 'Menyimpan...' : 'Simpan Pengaturan Keamanan'}
            </button>
            {isModal && (
              <button
                type="button"
                onClick={() => setMobileActiveModal(null)}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  background: '#F1F5F9',
                  color: '#475569',
                  border: '1px solid #CBD5E1',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  whiteSpace: 'nowrap',
                }}
              >
                Tutup
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );

  // Render View 3: Riwayat Log Lengkap
  const renderLogView = (isModal: boolean = false) => (
    <div>
      {!isModal && (
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
      )}

      {isModal && (
        <div style={{ marginBottom: '14px' }}>
          <input
            type="text"
            placeholder="🔍 Cari tiket, kasus, TKP..."
            value={profilLogSearch}
            onChange={(e) => setProfilLogSearch(e.target.value)}
            style={{ width: '100%', fontSize: '13px', padding: '10px 14px', border: '1.5px solid #CBD5E1', borderRadius: '8px', boxSizing: 'border-box' }}
          />
        </div>
      )}

      <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px', flexWrap: 'wrap' }}>
        {['semua', 'menunggu', 'diproses', 'selesai'].map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setProfilLogFilter(st as any)}
            style={{
              padding: '6px 12px',
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: isModal ? 'none' : '540px', overflowY: isModal ? 'visible' : 'auto' }}>
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
                    background: c.status === 'SELESAI' ? '#DCFCE7' : c.status === 'MENUNGGU_PENGESAHAN' ? '#EDE9FE' : c.status === 'DIPROSES' ? '#DBEAFE' : c.status === 'DITOLAK' ? '#FEE2E2' : '#FEF3C7',
                    color: c.status === 'SELESAI' ? '#15803D' : c.status === 'MENUNGGU_PENGESAHAN' ? '#6D28D9' : c.status === 'DIPROSES' ? '#1D4ED8' : c.status === 'DITOLAK' ? '#B91C1C' : '#92400E',
                    padding: '2px 8px',
                    borderRadius: '4px',
                  }}
                >
                  {c.status}
                </span>
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B' }}>{c.jenisKejadian}</div>
              <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px', display: 'flex', justifyContent: 'space-between' }}>
                <span>📍 {c.tkpAlamatTeks || 'TKP Wilayah Hukum Polres Pekalongan'}</span>
                <span style={{ fontFamily: 'monospace' }}>
                  {c.createdAt ? new Date(c.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB' : 'Hari ini'}
                </span>
              </div>
              {(() => {
                const rating =
                  c.citizenRating ??
                  c.citizen_rating ??
                  c.citizen_review_rel?.star_rating ??
                  c.citizenReviewRel?.star_rating;
                const reviewText = (
                  c.citizenReview ||
                  c.citizen_review ||
                  c.citizen_review_rel?.review_text ||
                  c.citizenReviewRel?.review_text ||
                  ''
                ).trim();

                if (!rating && !reviewText) return null;

                return (
                  <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {rating ? (
                      <div>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 800, background: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A', padding: '2px 6px', borderRadius: '4px' }}>
                          <span>⭐</span>
                          <span>IKM {rating}★</span>
                          <span style={{ fontSize: '9px', fontWeight: 700, color: '#92400E' }}>
                            ({rating >= 5 ? 'Sangat Puas' : rating >= 4 ? 'Puas' : rating >= 3 ? 'Cukup' : 'Kurang'})
                          </span>
                        </span>
                      </div>
                    ) : null}

                    {reviewText ? (
                      <div style={{ fontSize: '11px', color: '#475569', fontStyle: 'italic', background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '4px 8px' }}>
                        💬 &quot;{reviewText}&quot;
                      </div>
                    ) : null}
                  </div>
                );
              })()}
            </div>
          ))
        )}
      </div>
    </div>
  );

  // Render Audio CAD Workstation Preferences
  const renderAudioView = (isModal: boolean = false) => (
    <div style={{ background: 'white', border: isModal ? 'none' : '1px solid #E2E8F0', borderRadius: isModal ? '0' : '14px', padding: isModal ? '10px 0' : '20px', boxShadow: isModal ? 'none' : '0 4px 12px rgba(0,0,0,0.03)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🔊</span> Preferensi Audio Workstation CAD 110
          </h3>
          <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
            Konfigurasi nada dering dan volume peringatan darurat saat tiket aduan warga masuk ke layar konsol
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Info Box Standby 1x24 Jam */}
        <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '10px', padding: '12px 14px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '18px' }}>🎧</span>
          <div style={{ fontSize: '12px', color: '#1E40AF', lineHeight: 1.45 }}>
            <strong>Standby Siaga 1x24 Jam:</strong> Pastikan audio komputer atau headset terpasang dengan baik. Uji suara sebelum memulai tugas dinas agar setiap panggilan masuk 110 langsung terdengar jelas.
          </div>
        </div>

        {/* Setting 1: Pilihan Nada Peringatan */}
        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '14px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#1E293B', marginBottom: '6px' }}>
            Pilihan Nada Alarm Masuk:
          </label>
          <select
            value={cadAudioTone}
            onChange={(e) => handleToneChange(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              fontSize: '12.5px',
              fontWeight: 700,
              color: '#1E293B',
              background: 'white',
              outline: 'none',
            }}
          >
            <option value="patwal">🚨 Sirine Patwal Kedinasan Polri (Default)</option>
            <option value="chime">🔔 Chime Darurat Sentra CAD (Halus)</option>
            <option value="telephone">📞 Dering Telepon Meja Siaga 110</option>
          </select>
          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
            Bunyi ini akan berdering secara otomatis begitu ada panggilan/tiket aduan baru masuk ke antrean.
          </div>
        </div>

        {/* Setting 2: Volume Audio Slider */}
        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{ fontSize: '12px', fontWeight: 800, color: '#1E293B' }}>
              Tingkat Volume Speaker / Headset:
            </label>
            <span style={{ fontSize: '13px', fontWeight: 900, color: '#153E75', background: '#DBEAFE', padding: '2px 8px', borderRadius: '6px' }}>
              {cadAudioVolume}%
            </span>
          </div>
          <input
            type="range"
            min="10"
            max="100"
            step="5"
            value={cadAudioVolume}
            onChange={(e) => handleVolumeChange(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#153E75', cursor: 'pointer' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#94A3B8', marginTop: '4px' }}>
            <span>Pelan (10%)</span>
            <span>Standar Meja (50%)</span>
            <span>Maksimal (100%)</span>
          </div>
        </div>

        {/* Tombol Uji Bunyi & Simpan */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '4px' }}>
          <button
            type="button"
            onClick={handleTestAudioToggle}
            style={{
              flex: 1,
              minWidth: '160px',
              padding: '10px 16px',
              background: isPlayingTestAudio ? '#DC2626' : '#2563EB',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: isPlayingTestAudio ? '0 2px 6px rgba(220,38,38,0.3)' : '0 2px 6px rgba(37,99,235,0.3)',
            }}
          >
            <span>{isPlayingTestAudio ? '⏹️' : '▶️'}</span>
            <span>{isPlayingTestAudio ? 'Hentikan Uji Suara' : 'Uji Bunyi Audio Sekarang'}</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAudioPreferences}
            style={{
              padding: '10px 20px',
              background: '#059669',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 6px rgba(5,150,105,0.25)',
            }}
          >
            <span>💾</span> Simpan Preferensi
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ width: '100%', maxWidth: '1440px', margin: '0 auto', paddingBottom: '30px' }}>
      {/* Header Halaman Profil Kedinasan (Hanya untuk Pawas & Operator, Superadmin menggunakan sidebar layout) */}
      {roleBadge !== 'SUPERADMIN' && currentUser?.role !== 'SUPERADMIN' && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 className="page-title" style={{ margin: 0, fontSize: '20px', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🛡️</span> Profil Kedinasan &amp; Akun Petugas
              </h2>
              <span style={{ fontSize: '10.5px', fontWeight: 800, background: isOperator ? '#E0F2FE' : '#DCFCE7', color: isOperator ? '#0369A1' : '#15803D', padding: '3px 9px', borderRadius: '12px', border: isOperator ? '1px solid #BAE6FD' : '1px solid #BBF7D0' }}>
                {isOperator ? 'OPERATOR SPKT 110' : (roleBadge || currentUser?.role || 'PETUGAS')}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#64748B', marginTop: '3px' }}>
              {makoTitle || currentUser?.stationName || 'Polres Pekalongan'} • Sentra Komando Pelayanan Terpadu
            </div>
          </div>

          {(onBackToBeranda || onNavigateTab) && (
            <button
              type="button"
              onClick={() => {
                if (onBackToBeranda) onBackToBeranda();
                else if (onNavigateTab) onNavigateTab(isOperator ? 'view-operator' : 'view-beranda');
              }}
              style={{
                padding: '8px 16px',
                background: '#153E75',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 8px rgba(21,62,117,0.2)',
              }}
            >
              <span>←</span> Kembali ke Beranda
            </button>
          )}
        </div>
      )}

      {/* 2-Column Responsive Grid */}
      <div className="profile-grid-container">
        {/* KOLOM KIRI (Identitas, Presensi, Pengaturan Akun) */}
        <div className="profile-sidebar-column">
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
                  {makoTitle || currentUser?.stationName || currentUser?.satuanNama || currentUser?.unit || 'POLRES PEKALONGAN'}
                </span>
              </div>
              <span
                style={{
                  fontSize: '9.5px',
                  fontWeight: 800,
                  background: isOperator ? 'rgba(56,189,248,0.25)' : (presensiStatus === 'SUDAH_MASUK' ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'),
                  color: isOperator ? '#38BDF8' : (presensiStatus === 'SUDAH_MASUK' ? '#6EE7B7' : '#FCA5A5'),
                  border: isOperator ? '1px solid rgba(56,189,248,0.4)' : (presensiStatus === 'SUDAH_MASUK' ? '1px solid rgba(110,231,183,0.3)' : '1px solid rgba(239,68,68,0.3)'),
                  padding: '2px 8px',
                  borderRadius: '12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {isOperator ? '🟢 SIAGA DINAS 1x24 JAM' : (presensiStatus === 'SUDAH_MASUK' ? 'SIAGA PIKET AKTIF' : 'BELUM MASUK DINAS')}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <NameInitialAvatar
                  name={currentUser?.fullName || currentUser?.nama || 'Petugas'}
                  avatarUrl={currentUser?.avatar}
                  size={76}
                  rounded="xl"
                  variant="gold"
                  onClick={() => handleOpenMenu('profil')}
                />
                <button
                  type="button"
                  id="btn-overlay-avatar-edit"
                  onClick={() => handleOpenMenu('profil')}
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
                  {currentUser?.pangkat ? currentUser.pangkat : '-'}
                </div>
                <h3 style={{ fontSize: '16px', color: '#FFFFFF', fontWeight: 800, margin: '2px 0 3px', lineHeight: 1.25 }}>
                  {currentUser?.fullName ? currentUser.fullName : (currentUser?.nama ? currentUser.nama : '-')}
                </h3>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#FDE68A', fontFamily: 'monospace' }}>
                  NRP: {currentUser?.identifier ? currentUser.identifier : (currentUser?.nrp ? currentUser.nrp : '-')}
                </div>
                <div style={{ fontSize: '10.5px', color: '#E2E8F0', marginTop: '3px' }}>
                  {currentUser?.jabatan
                    ? currentUser.jabatan
                    : (roleTitle
                    ? roleTitle
                    : (currentUser?.role === 'PAWAS' || roleBadge === 'PAWAS'
                    ? 'Perwira Pengawas (PAWAS) • Posko Pengendalian'
                    : (currentUser?.role === 'OPERATOR' || roleBadge === 'OPERATOR'
                    ? 'Operator SPKT • Pelayanan 110 & CAD'
                    : (currentUser?.role === 'PERSONIL' || roleBadge === 'PERSONIL'
                    ? 'Anggota Patroli Lapangan'
                    : 'Pusat Komando & Pengendalian Operasional (Superadmin Pusat)'))))}
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
              {isOperator ? (
                <>
                  <div>
                    <div style={{ fontSize: '9.5px', color: '#94A3B8', fontWeight: 600 }}>Tiket Jaga 1x24 Jam</div>
                    <div style={{ fontSize: '15px', fontWeight: 900, color: '#FBBF24' }}>
                      {counters?.totalLaporan ?? complaints.length}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '9.5px', color: '#94A3B8', fontWeight: 600 }}>Ketuntasan Disposisi</div>
                    <div style={{ fontSize: '15px', fontWeight: 900, color: '#34D399' }}>
                      100%
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '9.5px', color: '#94A3B8', fontWeight: 600 }}>Status Workstation</div>
                    <div style={{ fontSize: '15px', fontWeight: 900, color: '#38BDF8' }}>
                      SIAGA CAD
                    </div>
                  </div>
                </>
              ) : currentUser?.role === 'PAWAS' || roleBadge === 'PAWAS' ? (
                <>
                  <div>
                    <div style={{ fontSize: '9.5px', color: '#94A3B8', fontWeight: 600 }}>Menunggu Validasi</div>
                    <div style={{ fontSize: '15px', fontWeight: 900, color: '#F87171' }}>
                      {complaints.filter((c: any) => c.status === 'MENUNGGU_PENGESAHAN' || c.status === 'DIPROSES').length}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '9.5px', color: '#94A3B8', fontWeight: 600 }}>Kepatuhan SLA</div>
                    <div style={{ fontSize: '15px', fontWeight: 900, color: '#34D399' }}>
                      {responCepatPct || (counters?.responCepatPct ?? '100%')}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '9.5px', color: '#94A3B8', fontWeight: 600 }}>Kasus Disahkan</div>
                    <div style={{ fontSize: '15px', fontWeight: 900, color: '#60A5FA' }}>
                      {counters?.selesaiCount ?? complaints.filter((c: any) => c.status === 'SELESAI').length}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <div style={{ fontSize: '9.5px', color: '#94A3B8', fontWeight: 600 }}>Total Personel</div>
                    <div style={{ fontSize: '15px', fontWeight: 900, color: '#FBBF24' }}>{units.length}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '9.5px', color: '#94A3B8', fontWeight: 600 }}>Ranmor Siaga</div>
                    <div style={{ fontSize: '15px', fontWeight: 900, color: '#34D399' }}>{counters.vehicles ?? 0}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '9.5px', color: '#94A3B8', fontWeight: 600 }}>Mako Terpadu</div>
                    <div style={{ fontSize: '15px', fontWeight: 900, color: '#60A5FA' }}>{counters?.stations ?? (policeOffices?.length || 1)}</div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 2. Kartu Presensi Petugas / SOP Operator */}
          <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '18px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            {/* Header Judul Presensi / SOP */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span style={{ fontSize: '20px' }}>{roleBadge === 'OPERATOR' ? '🎧' : '⏱️'}</span>
              <div>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#1E293B' }}>
                  {roleBadge === 'OPERATOR' ? 'Standar Pelayanan Operator 110' : 'Presensi Piket'}
                </h4>
                <div style={{ fontSize: '11px', color: '#64748B' }}>
                  {roleBadge === 'OPERATOR'
                    ? 'SOP Penerimaan Panggilan & SLA Sentra CAD 110'
                    : `Pencatatan Kehadiran Tugas Piket ${roleBadge || currentUser?.role || 'Superadmin'}`}
                </div>
              </div>
            </div>

            {/* Banner Jam Presensi Digital (Besar & 1 Baris Penuh) */}
            <div
              style={{
                background: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)',
                border: '1px solid #BAE6FD',
                borderRadius: '10px',
                padding: '9px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10.5px', fontWeight: 800, color: '#0284C7' }}>
                <span className="pulse-live-dot" style={{ width: '6px', height: '6px' }} />
                <span>WAKTU SERVER</span>
              </div>
              <span
                style={{
                  fontSize: '15px',
                  fontWeight: 900,
                  color: '#0F2D56',
                  fontFamily: 'monospace',
                  letterSpacing: '0.5px',
                  whiteSpace: 'nowrap',
                }}
              >
                {liveClock || '00.00.00 WIB'}
              </span>
            </div>

            {isOperator ? (
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', borderBottom: '1px solid #E2E8F0', paddingBottom: '6px' }}>
                  <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 700 }}>Siklus Tugas Jaga:</span>
                  <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#1E40AF', background: '#DBEAFE', padding: '2px 8px', borderRadius: '4px' }}>
                    STANDBY 1x24 JAM PENUH
                  </span>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                  <div style={{ background: 'white', border: '1px solid #E2E8F0', padding: '8px', borderRadius: '6px' }}>
                    <div style={{ fontSize: '10px', color: '#64748B' }}>Mulai Jaga Hari Ini</div>
                    <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#1E293B', marginTop: '1px' }}>08.00 WIB</div>
                  </div>
                  <div style={{ background: 'white', border: '1px solid #E2E8F0', padding: '8px', borderRadius: '6px' }}>
                    <div style={{ fontSize: '10px', color: '#64748B' }}>Apel Serah Terima</div>
                    <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#D97706', marginTop: '1px' }}>Besok, 08.00 WIB</div>
                  </div>
                </div>

                <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '8px 10px', borderRadius: '6px', fontSize: '11px', color: '#1E40AF', marginBottom: '10px', lineHeight: 1.4 }}>
                  🎙️ <strong>SOP Sapaan Kedinasan:</strong> &ldquo;Selamat Pagi/Siang/Malam Kepolisian 110, dengan {currentUser?.fullName || currentUser?.nama || 'Petugas'}, ada yang bisa kami bantu?&rdquo;
                </div>

                {/* Tombol Pintas Serah Terima & Rekap Kinerja */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {onNavigateTab && (
                    <button
                      type="button"
                      onClick={() => onNavigateTab('view-kinerja')}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        background: '#153E75',
                        color: 'white',
                        border: 'none',
                        borderRadius: '7px',
                        fontSize: '11.5px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 6px rgba(21,62,117,0.2)',
                      }}
                    >
                      <span>📋</span>
                      <span>Buka Buku Catatan & Peringkat Saya ↗</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowPresensiPulangModal(true)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: '#F1F5F9',
                      color: '#475569',
                      border: '1px solid #CBD5E1',
                      borderRadius: '7px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                    }}
                  >
                    <span>🔄</span>
                    <span>Serah Terima Dinas Jaga 1x24 Jam</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
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
                  <div
                    style={{
                      borderTop: '1px dashed #E2E8F0',
                      paddingTop: '8px',
                      marginTop: '6px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px' }}>
                      <span style={{ color: '#64748B', whiteSpace: 'nowrap' }}>Radius Mako:</span>
                      <span style={{ fontWeight: 800, color: '#153E75', textAlign: 'right' }}>
                        📍 {makoTitle || currentUser?.stationName || currentUser?.satuanNama || currentUser?.unit || 'Polres Pekalongan'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          color: '#059669',
                          background: '#ECFDF5',
                          border: '1px solid #A7F3D0',
                          padding: '2px 8px',
                          borderRadius: '6px',
                        }}
                      >
                        Radius {makoRadius || 500}m • Otoritas Presisi
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setPresensiStatus('SUDAH_MASUK');
                      const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
                      setJamMasukPiket(now);
                      showToast('✓ Presensi Masuk telah terekam di sistem server Presisi!');
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

                {/* Tombol Pintas Otoritas Pawas */}
                {(currentUser?.role === 'PAWAS' || roleBadge === 'PAWAS') && (
                  <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => onNavigateTab ? onNavigateTab('validasi') : (onBackToBeranda && onBackToBeranda())}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        background: 'linear-gradient(135deg, #153E75 0%, #1E40AF 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '11.5px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 6px rgba(21,62,117,0.2)',
                      }}
                    >
                      <span>📋</span>
                      <span>Buka Dossier &amp; Validasi Kasus ↗</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigateTab ? onNavigateTab('kinerja') : (onBackToBeranda && onBackToBeranda())}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: '#F1F5F9',
                        color: '#334155',
                        border: '1px solid #CBD5E1',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                    >
                      <span>📊</span>
                      <span>Rekap Kinerja Operasional Jaga ↗</span>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* 3. Kartu Pengaturan Akun */}
          <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '6px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <div style={{ padding: '10px 6px 6px', fontSize: '12px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', borderBottom: '1px solid #F1F5F9' }}>
              Pengaturan Akun Petugas
            </div>

            {/* 1. Menu Ubah Profil & Foto Dinas */}
            <div
              id="btn-menu-ubah-profil"
              onClick={() => handleOpenMenu('profil')}
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

            {/* 2. Menu Keamanan Akun */}
            <div
              id="btn-menu-keamanan"
              onClick={() => handleOpenMenu('keamanan')}
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
                    Keamanan Akun
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>Ganti kata sandi login</div>
                </div>
              </div>
              <span style={{ color: profilActiveMenu === 'keamanan' ? '#1D4ED8' : '#94A3B8', fontWeight: 800 }}>➔</span>
            </div>

            {isOperator ? (
              /* Menu Preferensi Audio Workstation CAD */
              <div
                id="btn-menu-audio-cad"
                onClick={() => handleOpenMenu('audio')}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 8px',
                  borderBottom: '1px solid #F1F5F9',
                  cursor: 'pointer',
                  borderRadius: '8px',
                  background: profilActiveMenu === 'audio' ? '#EFF6FF' : 'transparent',
                  borderLeft: profilActiveMenu === 'audio' ? '4px solid #1D4ED8' : '4px solid transparent',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (profilActiveMenu !== 'audio') e.currentTarget.style.backgroundColor = '#F8FAFC';
                }}
                onMouseLeave={(e) => {
                  if (profilActiveMenu !== 'audio') e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '17px' }}>🔊</span>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: profilActiveMenu === 'audio' ? '#1D4ED8' : '#1E293B' }}>
                      Preferensi Audio CAD 110
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>Volume &amp; nada dering alarm panggilan masuk</div>
                  </div>
                </div>
                <span style={{ color: profilActiveMenu === 'audio' ? '#1D4ED8' : '#94A3B8', fontWeight: 800 }}>➔</span>
              </div>
            ) : null}

            {/* 4. Logout */}
            <div
              id="btn-menu-logout"
              onClick={() => setShowLogoutModal(true)}
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

        {/* KOLOM KANAN: PANEL KONTEN DINAMIS (HANYA MUNCUL DI TABLET & DESKTOP >= 768px) */}
        <div className="profile-content-desktop">
          {profilActiveMenu === 'profil' && renderProfilForm(false)}
          {profilActiveMenu === 'keamanan' && renderKeamananForm(false)}
          {profilActiveMenu === 'audio' && renderAudioView(false)}
          {profilActiveMenu === 'log' && renderLogView(false)}
        </div>
      </div>

      {/* MOBILE FULLSCREEN MODAL UNTUK PENGATURAN AKUN (HANYA DITAMPILKAN KETIKA DIKLIK DI MOBILE) */}
      <ResponsiveModal
        isOpen={mobileActiveModal !== null}
        onClose={() => setMobileActiveModal(null)}
        maxWidth="740px"
        title={
          mobileActiveModal === 'profil'
            ? 'Ubah Profil & Pasfoto Dinas'
            : mobileActiveModal === 'keamanan'
            ? 'Keamanan Akun'
            : mobileActiveModal === 'audio'
            ? 'Preferensi Audio CAD 110'
            : 'Riwayat Log Lengkap'
        }
        subtitle={
          mobileActiveModal === 'profil'
            ? 'Perbarui biodata personel, pangkat & pasfoto resmi kedinasan'
            : mobileActiveModal === 'keamanan'
            ? 'Ganti kata sandi login'
            : mobileActiveModal === 'audio'
            ? 'Pengaturan nada dering & volume alarm panggilan masuk'
            : 'Rekam jejak seluruh penanganan laporan & tugas'
        }
        icon={
          mobileActiveModal === 'profil'
            ? '👤'
            : mobileActiveModal === 'keamanan'
            ? '🔒'
            : mobileActiveModal === 'audio'
            ? '🔊'
            : '📋'
        }
        badge={
          mobileActiveModal === 'log' ? (
            <span style={{ background: '#DBEAFE', color: '#1E40AF', fontSize: '10.5px', fontWeight: 800, padding: '2px 8px', borderRadius: '6px' }}>
              {complaints.length} Laporan
            </span>
          ) : undefined
        }
      >
        {mobileActiveModal === 'profil' && renderProfilForm(true)}
        {mobileActiveModal === 'keamanan' && renderKeamananForm(true)}
        {mobileActiveModal === 'audio' && renderAudioView(true)}
        {mobileActiveModal === 'log' && renderLogView(true)}
      </ResponsiveModal>

      {/* MODAL PRESENSI PULANG (RESPONSIVE MODAL) */}
      <ResponsiveModal
        isOpen={showPresensiPulangModal}
        onClose={() => setShowPresensiPulangModal(false)}
        maxWidth="460px"
        title="Konfirmasi Presensi Pulang"
        subtitle="Pencatatan jam kepulangan / lepas tugas piket"
        icon="🚪"
        badge={
          <span style={{ background: '#FEE2E2', color: '#DC2626', fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '6px' }}>
            ● LEPAS DINAS
          </span>
        }
      >
        <div style={{ fontSize: '12.5px' }}>
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '12px', marginBottom: '14px', color: '#991B1B', lineHeight: 1.5 }}>
            Pastikan seluruh pendaftaran unit satuan dan audit sistem telah diperbarui sebelum mengakhiri jam dinas piket.
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setShowPresensiPulangModal(false)}
              style={{ flex: 1, padding: '11px', background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', color: '#475569' }}
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => {
                const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
                setJamPulangPiket(now);
                setPresensiStatus('BELUM_MASUK');
                showToast(`✓ Presensi Pulang berhasil terekam pukul ${now}!`);
                setShowPresensiPulangModal(false);
              }}
              style={{ flex: 1.5, padding: '11px', background: '#DC2626', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}
            >
              ✓ Konfirmasi Pulang
            </button>
          </div>
        </div>
      </ResponsiveModal>

      {/* MODAL DETAIL LAPORAN / LOG (RESPONSIVE MODAL) */}
      <ResponsiveModal
        isOpen={selectedLogDetail !== null}
        onClose={() => setSelectedLogDetail(null)}
        maxWidth="560px"
        title={selectedLogDetail ? `Laporan #${selectedLogDetail.nomorTiket}` : 'Detail Laporan'}
        subtitle="Rekam jejak laporan SPKT 110"
        icon="📋"
        badge={
          selectedLogDetail ? (
            <span
              style={{
                fontSize: '10.5px',
                fontWeight: 800,
                background: selectedLogDetail.status === 'SELESAI' ? '#DCFCE7' : '#FEF3C7',
                color: selectedLogDetail.status === 'SELESAI' ? '#15803D' : '#92400E',
                padding: '2px 8px',
                borderRadius: '6px',
              }}
            >
              {selectedLogDetail.status}
            </span>
          ) : undefined
        }
      >
        {selectedLogDetail && (
          <div style={{ fontSize: '12.5px', color: '#1E293B' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <span style={{ fontSize: '11px', color: '#64748B' }}>Kasus:</span>
                <div style={{ fontWeight: 800, color: '#153E75', fontSize: '14px' }}>{selectedLogDetail.jenisKejadian}</div>
              </div>
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
        )}
      </ResponsiveModal>

      {/* MODAL KONFIRMASI LOGOUT / KELUAR SESI DINAS */}
      <ResponsiveModal
        isOpen={showLogoutModal}
        onClose={() => {
          if (!isLoggingOut) setShowLogoutModal(false);
        }}
        maxWidth="440px"
        title="Konfirmasi Selesai Dinas"
        subtitle="Akhiri sesi dan serah terima tugas piket dinas"
        icon="🚪"
      >
        <div style={{ textAlign: 'center', padding: '12px 6px 6px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)',
              color: '#DC2626',
              fontSize: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px',
              border: '1.5px solid #FCA5A5',
              boxShadow: '0 4px 12px rgba(220,38,38,0.15)',
            }}
          >
            🚪
          </div>

          <h3 style={{ fontSize: '16px', fontWeight: 900, color: '#0F172A', margin: '0 0 6px' }}>
            Akhiri Sesi Dinas Sekarang?
          </h3>

          <p style={{ fontSize: '12px', color: '#64748B', lineHeight: 1.5, margin: '0 0 20px' }}>
            Apakah Anda yakin ingin mengakhiri sesi dinas dan keluar dari sistem <strong style={{ color: '#153E75' }}>SIMOPMAS 110</strong>? Pastikan seluruh buku catatan dan tugas jaga telah diserah-terimakan.
          </p>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              disabled={isLoggingOut}
              onClick={() => setShowLogoutModal(false)}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                background: 'white',
                color: '#475569',
                fontSize: '12px',
                fontWeight: 700,
                cursor: isLoggingOut ? 'not-allowed' : 'pointer',
              }}
            >
              Batal
            </button>

            <button
              type="button"
              id="btn-confirm-logout"
              disabled={isLoggingOut}
              onClick={async () => {
                setIsLoggingOut(true);
                try {
                  await onLogout();
                } catch (_) {
                  setIsLoggingOut(false);
                }
              }}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)',
                color: 'white',
                fontSize: '12px',
                fontWeight: 800,
                cursor: isLoggingOut ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: '0 2px 6px rgba(220,38,38,0.3)',
              }}
            >
              {isLoggingOut ? 'Memproses Keluar...' : 'Ya, Keluar Dinas'}
            </button>
          </div>
        </div>
      </ResponsiveModal>
    </div>
  );
}
