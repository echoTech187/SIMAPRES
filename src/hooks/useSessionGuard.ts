'use client';

import { useEffect, useRef, useCallback } from 'react';
import { checkSessionAliveAction } from '@/app/actions/auth.actions';
import { toast } from '@/components/ui/Toast';

export interface SessionGuardOptions {
  session?: {
    expiresAt?: number;
    lastActiveAt?: number;
    userId?: string;
    identifier?: string;
    [key: string]: any;
  } | null;
  checkIntervalSeconds?: number;
  onExpired?: () => void;
}

let isRedirecting = false;

/**
 * Mengarahkan user secara instan ke halaman login dengan alert spesifik
 */
export function redirectToLogin(reason: 'inactivity_timeout' | 'unauthenticated' = 'inactivity_timeout') {
  if (isRedirecting || typeof window === 'undefined') return;
  isRedirecting = true;

  try {
    sessionStorage.removeItem('simopmas_active_user');
  } catch (_) {}

  const currentPath = window.location.pathname;
  const target = `/?alert=${encodeURIComponent(reason)}&from=${encodeURIComponent(currentPath)}`;
  window.location.href = target;
}

/**
 * Universal Session Guard Hook
 * Menjaga masa berlaku sesi dinas di client-side:
 * 1. Menghitung countdown expiresAt dan mengeksekusi redirect instan saat waktu habis tanpa menunggu refresh.
 * 2. Melakukan heartbeat check berkala ke server (default tiap 60s & saat tab aktif kembali).
 * 3. Menyediakan global window event listener untuk aksi yang mengembalikan 401 / unauthenticated.
 */
export function useSessionGuard({
  session,
  checkIntervalSeconds = 60,
  onExpired,
}: SessionGuardOptions = {}) {
  const isCheckingRef = useRef(false);

  const handleExpiration = useCallback(
    (reason: 'inactivity_timeout' | 'unauthenticated' = 'inactivity_timeout') => {
      if (onExpired) {
        onExpired();
      }
      toast.error('Sesi dinas Anda telah berakhir. Mengalihkan ke halaman login...');
      redirectToLogin(reason);
    },
    [onExpired]
  );

  // 1. Precise countdown timer berdasarkan session.expiresAt
  useEffect(() => {
    if (!session?.expiresAt || typeof window === 'undefined') return;

    const remainingMs = session.expiresAt - Date.now();
    if (remainingMs <= 0) {
      handleExpiration('inactivity_timeout');
      return;
    }

    const timer = setTimeout(() => {
      handleExpiration('inactivity_timeout');
    }, remainingMs);

    return () => clearTimeout(timer);
  }, [session?.expiresAt, handleExpiration]);

  // 2. Periodic Heartbeat & Window Focus / Wake Check
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const lastCheckRef = { current: Date.now() };

    const verifySession = async (force = false) => {
      const now = Date.now();
      if (!force && now - lastCheckRef.current < 30000) return;
      if (isCheckingRef.current || isRedirecting) return;
      isCheckingRef.current = true;
      lastCheckRef.current = now;
      try {
        const res = await checkSessionAliveAction();
        if (!res.valid || res.unauthenticated) {
          handleExpiration(res.error === 'IDLE_TIMEOUT' ? 'inactivity_timeout' : 'unauthenticated');
        }
      } catch (_) {
        // Abaikan transient network glitch, biarkan interval berikutnya mencoba lagi
      } finally {
        isCheckingRef.current = false;
      }
    };

    // Heartbeat berkala (default 60 detik)
    const interval = setInterval(() => verifySession(true), Math.max(10, checkIntervalSeconds) * 1000);

    // Verifikasi seketika saat user kembali membuka tab browser setelah sleep / standby
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        verifySession();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    // Global listener jika ada server action lain yang mendeteksi session expired
    const handleAuthEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ reason?: 'inactivity_timeout' | 'unauthenticated' }>;
      handleExpiration(customEvent.detail?.reason || 'unauthenticated');
    };
    window.addEventListener('simopmas_auth_expired', handleAuthEvent);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
      window.removeEventListener('simopmas_auth_expired', handleAuthEvent);
    };
  }, [checkIntervalSeconds, handleExpiration]);
}
