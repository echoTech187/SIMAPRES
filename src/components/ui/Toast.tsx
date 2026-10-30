'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  duration?: number;
}

// Track last dispatched messages to prevent duplicate spam loops across all components
const recentDispatches = new Map<string, number>();
const DEDUPE_WINDOW_MS = 2500;

export const toast = {
  show: (type: ToastType, title: string, message = '', duration = 4000) => {
    if (typeof window === 'undefined') return;

    const key = `${type}|${title.trim()}|${message.trim()}`;
    const now = Date.now();
    const lastTime = recentDispatches.get(key) || 0;

    // Reject duplicate toast if it was already dispatched within DEDUPE_WINDOW_MS
    if (now - lastTime < DEDUPE_WINDOW_MS) {
      return;
    }
    recentDispatches.set(key, now);

    // Clean up old entries
    if (recentDispatches.size > 50) {
      for (const [k, t] of recentDispatches.entries()) {
        if (now - t > 10000) recentDispatches.delete(k);
      }
    }

    window.dispatchEvent(
      new CustomEvent('simopmas-toast', {
        detail: { type, title, message, duration },
      })
    );
  },

  success: (title: string, message = '', duration?: number) =>
    toast.show('success', title, message, duration),
  warning: (title: string, message = '', duration?: number) =>
    toast.show('warning', title, message, duration),
  error: (title: string, message = '', duration?: number) =>
    toast.show('error', title, message, duration),
  info: (title: string, message = '', duration?: number) =>
    toast.show('info', title, message, duration),

  // Smart helper for raw strings with auto-detection of icons & status
  showNotification: (text: string, customDuration = 4000) => {
    const cleanText = String(text ?? '').trim();
    if (!cleanText) return;

    const isSuccess =
      cleanText.includes('✓') ||
      cleanText.includes('✅') ||
      cleanText.toLowerCase().includes('berhasil') ||
      cleanText.includes('🏆');
    const isError =
      cleanText.toLowerCase().includes('gagal') ||
      cleanText.toLowerCase().includes('error') ||
      cleanText.toLowerCase().includes('kesalahan') ||
      cleanText.includes('❌') ||
      cleanText.includes('⛔');
    const isWarning =
      cleanText.toLowerCase().includes('wajib') ||
      cleanText.toLowerCase().includes('mohon') ||
      cleanText.toLowerCase().includes('peringatan') ||
      cleanText.includes('⚠️') ||
      cleanText.includes('🔒');

    const type: ToastType = isSuccess ? 'success' : isError ? 'error' : isWarning ? 'warning' : 'info';
    const stripped = cleanText.replace(/^[✓✅⚠️⚡🏆❌⛔\s]+/, '').trim();
    const title = isSuccess
      ? 'Operasi Berhasil'
      : isError
      ? 'Terjadi Kendala'
      : isWarning
      ? 'Pemberitahuan Sistem'
      : 'Informasi Presisi';

    toast.show(type, title, stripped, customDuration);
  },
};

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const removeToast = useCallback((id: string) => {
    // Clear timer if active
    const t = timersRef.current.get(id);
    if (t) {
      clearTimeout(t);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  useEffect(() => {
    // Intercept native window.alert to automatically route through modern Floating Toast
    const originalAlert = window.alert;
    window.alert = (message?: any) => {
      const text = String(message ?? '').trim();
      if (!text) return;
      toast.showNotification(text, 4500);
    };

    const handleToastEvent = (e: Event) => {
      const detail = (e as CustomEvent<Omit<ToastItem, 'id'>>).detail;
      if (!detail) return;

      const id = Date.now().toString() + Math.random().toString(36).substring(2, 6);
      const newItem: ToastItem = {
        id,
        type: detail.type || 'info',
        title: detail.title || 'Pemberitahuan',
        message: detail.message || '',
        duration: detail.duration || 4000,
      };

      setToasts((prev) => {
        // Prevent duplicate cards with identical title & message already visible
        const exists = prev.some(
          (t) => t.type === newItem.type && t.title === newItem.title && t.message === newItem.message
        );
        if (exists) return prev;
        // Keep maximum 3 toasts on screen at any time to avoid clutter
        const next = [...prev, newItem];
        if (next.length > 3) {
          const oldest = next[0];
          removeToast(oldest.id);
          return next.slice(next.length - 3);
        }
        return next;
      });

      const timerId = setTimeout(() => {
        removeToast(id);
      }, newItem.duration);

      timersRef.current.set(id, timerId);
    };

    window.addEventListener('simopmas-toast', handleToastEvent);

    return () => {
      window.alert = originalAlert;
      window.removeEventListener('simopmas-toast', handleToastEvent);
      // Clean up all pending timers
      timersRef.current.forEach((t) => clearTimeout(t));
      timersRef.current.clear();
    };
  }, [removeToast]);

  if (toasts.length === 0) return null;

  return (
    <div
      className="global-toast-container"
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 99999999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '430px',
        width: 'calc(100% - 40px)',
        pointerEvents: 'none',
      }}
    >
      {toasts.map((item) => {
        const borderColors = {
          success: '#10B981',
          warning: '#F59E0B',
          error: '#EF4444',
          info: '#3B82F6',
        };
        const icons = {
          success: '✅',
          warning: '⚠️',
          error: '❌',
          info: 'ℹ️',
        };

        return (
          <div
            key={item.id}
            className="global-toast-card animate-toast-slide"
            style={{
              pointerEvents: 'auto',
              background: '#FFFFFF',
              borderRadius: '14px',
              boxShadow: '0 16px 36px -4px rgba(15, 23, 42, 0.22), 0 4px 12px rgba(0, 0, 0, 0.08)',
              border: '1px solid #E2E8F0',
              borderLeft: `5px solid ${borderColors[item.type]}`,
              padding: '13px 16px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.2s ease',
            }}
          >
            <span style={{ fontSize: '20px', flexShrink: 0, marginTop: '1px' }}>
              {icons[item.type]}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A', marginBottom: '2px' }}>
                {item.title}
              </div>
              {item.message && (
                <div
                  style={{
                    fontSize: '11.5px',
                    color: '#475569',
                    lineHeight: 1.45,
                    whiteSpace: 'pre-line',
                    wordBreak: 'break-word',
                  }}
                >
                  {item.message}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => removeToast(item.id)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '15px',
                color: '#94A3B8',
                cursor: 'pointer',
                padding: '2px',
                lineHeight: 1,
                alignSelf: 'flex-start',
              }}
              title="Tutup Notifikasi"
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}
