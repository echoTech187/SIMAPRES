'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { logoutAction, touchSessionAction } from '@/app/actions/auth.actions';

// Standby Timeout: 60 minutes = 3600 seconds
const INACTIVITY_LIMIT_SECONDS = 3600;
// Warning Threshold: 55 minutes = 3300 seconds (5 minutes warning before auto-logout)
const WARNING_THRESHOLD_SECONDS = 3300;
// Interval check: every 5 seconds
const CHECK_INTERVAL_MS = 5000;
// Touch server session interval: every 15 minutes of active usage
const TOUCH_SERVER_INTERVAL_MS = 15 * 60 * 1000;

export default function InactivityMonitor() {
  const pathname = usePathname();
  const router = useRouter();

  const [isWarningVisible, setIsWarningVisible] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(300);

  const lastActivityRef = useRef<number>(Date.now());
  const lastTouchRef = useRef<number>(Date.now());
  const isLoggingOutRef = useRef<boolean>(false);

  // Cek apakah halaman saat ini merupakan konsol terproteksi
  const isProtectedPage =
    pathname === '/console' ||
    pathname?.startsWith('/console/') ||
    pathname?.startsWith('/registrasi-unit') ||
    pathname?.startsWith('/command-center') ||
    pathname?.startsWith('/personil');

  // Handle Logout
  const performLogout = useCallback(async (reason: 'inactivity_timeout' | 'user_manual' = 'inactivity_timeout') => {
    if (isLoggingOutRef.current) return;
    isLoggingOutRef.current = true;

    try {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('simapres_active_user');
      }
      await logoutAction();
    } catch (_) {
      // Abaikan error jaringan saat logout
    } finally {
      // Gunakan full page redirect agar seluruh state/cache terbersihkan
      window.location.href = `/?alert=${reason}`;
    }
  }, []);

  // Reset timer aktivitas
  const resetTimer = useCallback(() => {
    const now = Date.now();
    lastActivityRef.current = now;

    if (isWarningVisible) {
      setIsWarningVisible(false);
    }

    // Refresh cookie sesi server setiap 15 menit pemakaian aktif
    if (now - lastTouchRef.current > TOUCH_SERVER_INTERVAL_MS) {
      lastTouchRef.current = now;
      touchSessionAction().catch(() => {});
    }
  }, [isWarningVisible]);

  // Pasang event listener aktivitas pengguna
  useEffect(() => {
    if (!isProtectedPage) {
      setIsWarningVisible(false);
      return;
    }

    lastActivityRef.current = Date.now();
    lastTouchRef.current = Date.now();
    isLoggingOutRef.current = false;

    let throttleTimer: NodeJS.Timeout | null = null;
    const handleUserActivity = () => {
      if (throttleTimer) return;
      throttleTimer = setTimeout(() => {
        throttleTimer = null;
      }, 3000); // Throttle 3 detik

      // Hanya update jika peringatan belum muncul atau saat user klik tombol
      if (!isWarningVisible) {
        lastActivityRef.current = Date.now();
      }
    };

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'wheel'];
    activityEvents.forEach((ev) => {
      window.addEventListener(ev, handleUserActivity, { passive: true });
    });

    // Interval checker setiap 5 detik
    const interval = setInterval(() => {
      const now = Date.now();
      const idleSeconds = Math.floor((now - lastActivityRef.current) / 1000);

      // Sesi melebihi batas 1 jam (3600 detik) -> Otomatis Logout
      if (idleSeconds >= INACTIVITY_LIMIT_SECONDS) {
        clearInterval(interval);
        performLogout('inactivity_timeout');
        return;
      }

      // Sesi memasuki batas peringatan (55 menit = 3300 detik)
      if (idleSeconds >= WARNING_THRESHOLD_SECONDS) {
        setIsWarningVisible(true);
        const rem = Math.max(0, INACTIVITY_LIMIT_SECONDS - idleSeconds);
        setSecondsRemaining(rem);
      } else {
        if (isWarningVisible) {
          setIsWarningVisible(false);
        }
      }
    }, CHECK_INTERVAL_MS);

    return () => {
      activityEvents.forEach((ev) => {
        window.removeEventListener(ev, handleUserActivity);
      });
      clearInterval(interval);
      if (throttleTimer) clearTimeout(throttleTimer);
    };
  }, [isProtectedPage, isWarningVisible, performLogout]);

  if (!isProtectedPage || !isWarningVisible) {
    return null;
  }

  const minutesLeft = Math.floor(secondsRemaining / 60);
  const secondsLeft = secondsRemaining % 60;
  const formattedTime = `${minutesLeft.toString().padStart(2, '0')}:${secondsLeft.toString().padStart(2, '0')}`;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.25s ease-out',
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '460px',
          padding: '28px 24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          border: '1.5px solid #FCD34D',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: '#FEF3C7',
            color: '#D97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
            margin: '0 auto 16px auto',
          }}
        >
          ⏳
        </div>

        <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 800, color: '#1E293B' }}>
          Peringatan Waktu Standby (Idle)
        </h3>

        <p style={{ margin: '0 0 16px 0', fontSize: '13.5px', color: '#475569', lineHeight: 1.5 }}>
          Sistem mendeteksi tidak ada aktivitas pada perangkat Anda selama <strong>55 menit</strong>. Sesi operasional
          Presisi 110 Anda akan otomatis ditutup dalam:
        </p>

        <div
          style={{
            display: 'inline-block',
            padding: '10px 24px',
            background: '#FEF2F2',
            border: '2px solid #F87171',
            borderRadius: '12px',
            fontSize: '28px',
            fontWeight: 900,
            color: '#DC2626',
            letterSpacing: '2px',
            marginBottom: '20px',
            fontFamily: 'monospace',
          }}
        >
          {formattedTime}
        </div>

        <p style={{ margin: '0 0 20px 0', fontSize: '12px', color: '#64748B' }}>
          Klik tombol <strong>"Tetap Masuk"</strong> untuk memperpanjang sesi dinas Anda.
        </p>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={() => performLogout('user_manual')}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              background: '#F1F5F9',
              color: '#475569',
              fontWeight: 700,
              fontSize: '13.5px',
              cursor: 'pointer',
            }}
          >
            Keluar Sekarang
          </button>

          <button
            type="button"
            onClick={resetTimer}
            style={{
              flex: 1.4,
              padding: '12px',
              borderRadius: '8px',
              border: 'none',
              background: '#153E75',
              color: 'white',
              fontWeight: 800,
              fontSize: '13.5px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(21, 62, 117, 0.3)',
            }}
          >
            ✅ Tetap Masuk
          </button>
        </div>
      </div>
    </div>
  );
}
