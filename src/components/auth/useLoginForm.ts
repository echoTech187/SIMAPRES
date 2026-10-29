'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { loginInternalAction } from '@/app/actions/auth.actions';
import { getOrCreateClientDeviceId } from '@/lib/device-fingerprint';

export function useLoginForm() {
  const searchParams = useSearchParams();

  const [nrp, setNrp] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Parameter notifikasi dari Middleware / Auto-Logout
  const rawAlertType = searchParams.get('alert');
  const [alertType, setAlertType] = useState<string | null>(rawAlertType);
  const alertRole = searchParams.get('role');
  const alertRequired = searchParams.get('required');

  useEffect(() => {
    setAlertType(rawAlertType);
  }, [rawAlertType]);

  const dismissAlert = () => {
    setAlertType(null);
    if (typeof window !== 'undefined' && window.history?.replaceState) {
      const url = new URL(window.location.href);
      url.searchParams.delete('alert');
      url.searchParams.delete('role');
      url.searchParams.delete('required');
      const cleanUrl = url.pathname + (url.search ? url.search : '');
      window.history.replaceState({}, '', cleanUrl);
    }
  };

  // Otomatis hilangkan alert 'logged_out' setelah 3 detik & bersihkan query URL
  useEffect(() => {
    if (alertType === 'logged_out') {
      const timer = setTimeout(() => {
        dismissAlert();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [alertType]);

  // Bersihkan sessionStorage jika diarahkan karena timeout / logout / ditolak
  useEffect(() => {
    if (rawAlertType && typeof window !== 'undefined') {
      sessionStorage.removeItem('simapres_active_user');
    }
  }, [rawAlertType]);

  // Sapaan hangat dinamis berdasarkan jam lokal
  const dynamicGreeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 11) return 'Selamat Pagi';
    if (hour >= 11 && hour < 15) return 'Selamat Siang';
    if (hour >= 15 && hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!nrp.trim()) {
      setErrorMsg('Silakan masukkan NRP / ID Petugas kedinasan terlebih dahulu!');
      return;
    }

    if (!password.trim()) {
      setErrorMsg('Silakan masukkan kata sandi akun kedinasan Anda!');
      return;
    }

    setLoading(true);
    const clientDeviceId = getOrCreateClientDeviceId();
    const res = await loginInternalAction(nrp, password, clientDeviceId);
    setLoading(false);

    if (res.success && res.data) {
      sessionStorage.setItem('simapres_active_user', JSON.stringify(res.data));
      window.location.href = res.data.targetRoute;
    } else {
      setErrorMsg(
        res.error ||
          'Kombinasi NRP dan Kata Sandi tidak cocok atau belum terdaftar pada sistem.'
      );
    }
  };

  const clearNrp = () => setNrp('');
  const toggleShowPassword = () => setShowPassword((prev) => !prev);

  return {
    nrp,
    setNrp,
    clearNrp,
    password,
    setPassword,
    showPassword,
    toggleShowPassword,
    errorMsg,
    loading,
    alertType,
    alertRole,
    alertRequired,
    dynamicGreeting,
    handleLogin,
    dismissAlert,
  };
}
