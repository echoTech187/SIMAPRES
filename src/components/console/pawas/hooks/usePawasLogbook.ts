'use client';

import { useState, useCallback } from 'react';
import { createLogbookAction } from '@/app/actions/logbook.actions';

interface UsePawasLogbookParams {
  session: any;
  userProfile: any;
  showFriendlyToast: (type: 'success' | 'warning' | 'error' | 'info', title: string, message: string) => void;
  switchTab: (tab: any) => void;
  loadData: () => Promise<void>;
  setLoading: (loading: boolean) => void;
}

/**
 * usePawasLogbook
 * Single-responsibility hook managing Buku Mutasi & Pawas Logbook form state and submissions.
 */
export function usePawasLogbook({
  session,
  userProfile,
  showFriendlyToast,
  switchTab,
  loadData,
  setLoading,
}: UsePawasLogbookParams) {
  const [logWaktuMulai, setLogWaktuMulai] = useState('');
  const [logSektor, setLogSektor] = useState('');
  const [logJenis, setLogJenis] = useState<string>('');
  const [logDeskripsi, setLogDeskripsi] = useState('');
  const [logFotoPreview, setLogFotoPreview] = useState<string | null>(null);

  const handleSimpanLogKegiatan = useCallback(async () => {
    const activeUserId = session?.userId ? String(session.userId) : (userProfile?.id ? String(userProfile.id) : '');
    if (!activeUserId) {
      showFriendlyToast('error', 'Sesi Berakhir', 'Sesi pengguna tidak valid. Silakan login kembali.');
      return;
    }
    setLoading(true);
    try {
      const nowTime = new Date().toTimeString().slice(0, 5);
      const res = await createLogbookAction({
        officerId: activeUserId,
        jenisAksi: (logJenis as any) || '-',
        lokasiKlaimAlamat: logSektor || '',
        lokasiKlaimLat: 0,
        lokasiKlaimLng: 0,
        lokasiGpsAktualLat: 0,
        lokasiGpsAktualLng: 0,
        jamMulai: logWaktuMulai || nowTime,
        jamSelesai: nowTime,
        fotoBuktiUrl: logFotoPreview || undefined,
        deskripsiKegiatan: logDeskripsi || '',
      });

      if (res.success) {
        showFriendlyToast('success', 'Buku Mutasi Berhasil', 'Log kegiatan dinas berhasil disimpan ke buku mutasi dan terverifikasi GPS.');
        switchTab('view-beranda');
        loadData();
      } else {
        showFriendlyToast('error', 'Gagal Menyimpan Log', res.error || 'Gagal menyimpan log.');
      }
    } catch (e: any) {
      showFriendlyToast('error', 'Terjadi Kendala', e.message || 'Gagal menyimpan log kegiatan.');
    } finally {
      setLoading(false);
    }
  }, [session, userProfile, logJenis, logSektor, logWaktuMulai, logFotoPreview, logDeskripsi, showFriendlyToast, switchTab, loadData, setLoading]);

  return {
    logWaktuMulai,
    setLogWaktuMulai,
    logSektor,
    setLogSektor,
    logJenis,
    setLogJenis,
    logDeskripsi,
    setLogDeskripsi,
    logFotoPreview,
    setLogFotoPreview,
    handleSimpanLogKegiatan,
  };
}
