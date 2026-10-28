'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { loginInternalAction } from '@/app/actions/auth.actions';

export function useLoginForm() {
  const searchParams = useSearchParams();

  const [nrp, setNrp] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Parameter notifikasi dari Middleware / Auto-Logout
  const alertType = searchParams.get('alert');
  const alertRole = searchParams.get('role');
  const alertRequired = searchParams.get('required');

  // Bersihkan sessionStorage jika diarahkan karena timeout / logout / ditolak
  useEffect(() => {
    if (alertType && typeof window !== 'undefined') {
      sessionStorage.removeItem('simapres_active_user');
    }
  }, [alertType]);

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
    const res = await loginInternalAction(nrp, password);
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
  };
}
