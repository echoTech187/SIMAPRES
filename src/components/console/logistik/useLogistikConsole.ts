'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { logoutAction, updateUserPasswordAction } from '@/app/actions/auth.actions';
import { SessionPayload } from '@/lib/session-token';
import { toast } from '@/components/ui/Toast';

export type LogistikTab = 'view-audit-bbm' | 'view-master-bbm' | 'view-profil';

interface UseLogistikConsoleOptions {
  session: SessionPayload;
  initialSection?: string;
}

export function useLogistikConsole({ session, initialSection = 'audit_bbm' }: UseLogistikConsoleOptions) {
  const router = useRouter();

  // 1. Resolve initial active tab from URL / section
  const resolveSectionTab = useCallback((sec?: string): LogistikTab => {
    const clean = (sec || '').toLowerCase().trim();
    if (['master-bbm', 'master_bbm', 'fuel', 'fuel_type', 'harga', 'dipa'].includes(clean)) {
      return 'view-master-bbm';
    }
    if (['profil', 'profile', 'akun', 'keamanan', 'password'].includes(clean)) {
      return 'view-profil';
    }
    return 'view-audit-bbm';
  }, []);

  const [activeTab, setActiveTab] = useState<LogistikTab>(() => resolveSectionTab(initialSection));

  useEffect(() => {
    setActiveTab(resolveSectionTab(initialSection));
  }, [initialSection, resolveSectionTab]);

  const switchTab = useCallback((tabId: LogistikTab) => {
    setActiveTab(tabId);
    const slugMap: Record<LogistikTab, string> = {
      'view-audit-bbm': 'audit_bbm',
      'view-master-bbm': 'fuel_type',
      'view-profil': 'profil',
    };
    const slug = slugMap[tabId];
    if (typeof window !== 'undefined') {
      const url = slug === 'audit_bbm' ? '/console' : `/console/${slug}`;
      window.history.pushState(null, '', url);
    }
  }, []);

  // 2. User Profile Memo
  const userProfile = useMemo(() => {
    return {
      id: session.userId,
      nrp: session.identifier,
      nama: session.fullName,
      pangkat: session.rankPangkat || 'Aiptu',
      jabatan: 'Bamin Bag Log / Pengelola BBM DIPA',
      satuanNama: session.satuanNama || 'Biro Logistik & Si-Keu',
      avatarUrl: session.avatar || '',
      role: 'LOGISTIK',
    };
  }, [session]);

  const showToast = useCallback((msg: string) => {
    toast.info(msg);
  }, []);

  // 3. Password Update Form State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passLoading, setPassLoading] = useState(false);
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

    if (!oldPassword.trim()) {
      setPassError('Silakan masukkan kata sandi dinas saat ini!');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setPassError('Kata sandi baru minimal harus 6 karakter!');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError('Konfirmasi kata sandi tidak cocok!');
      return;
    }

    setPassLoading(true);
    try {
      const res = await updateUserPasswordAction(newPassword, oldPassword);
      if (res.success) {
        setPassSuccess('Kata sandi dinas berhasil diperbarui! Silakan gunakan kata sandi baru untuk login berikutnya.');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPassError(res.error || 'Gagal memperbarui kata sandi dinas.');
      }
    } catch (err: any) {
      setPassError(err.message || 'Terjadi kesalahan sistem saat memperbarui kata sandi.');
    } finally {
      setPassLoading(false);
    }
  };

  const handleLogout = async () => {
    if (typeof window !== 'undefined' && !confirm('Apakah Anda yakin ingin keluar dari Konsol Logistik & Keuangan?')) {
      return;
    }
    await logoutAction();
    router.push('/');
  };

  return {
    activeTab,
    switchTab,
    userProfile,
    showToast,
    // Password state
    oldPassword,
    setOldPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    passLoading,
    passError,
    passSuccess,
    handleUpdatePassword,
    // Actions
    handleLogout,
  };
}
