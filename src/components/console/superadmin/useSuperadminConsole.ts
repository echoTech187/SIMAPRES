'use client';

import { useState, useEffect, useCallback } from 'react';
import QRCode from 'qrcode';
import {
  getRegisteredUnitsAction,
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
import { MasterTabType } from '../master/MasterDataManager';
import { toast } from '@/components/ui/Toast';

export type SuperadminTab = 'unit' | 'profil' | MasterTabType;

export function parseSuperadminTab(section?: string): SuperadminTab {
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
      'piket',
    ].includes(clean)
  ) {
    return clean as MasterTabType;
  }
  if (['piket', 'jadwal_piket', 'roster_piket', 'jadwal-piket', 'sprin'].includes(clean)) {
    return 'piket';
  }
  if (['faq', 'panduan', 'master_faq', 'buku_pintar', 'sop'].includes(clean)) {
    return 'knowledge_faq';
  }
  if (
    [
      'fuel',
      'fuel_type',
      'master_bbm',
      'bbm',
      'audit_bbm',
      'klaim_bbm',
      'logistik',
      'claim_status',
      'fuel_claim_status',
      'status_klaim',
    ].includes(clean)
  ) {
    return 'fuel_type';
  }
  return 'unit';
}

interface UseSuperadminConsoleOptions {
  session?: any;
  initialSection?: string;
  initialSuperadminData?: {
    units?: any[];
    dropdowns?: any[];
    counters?: any;
  };
}

export function useSuperadminConsole({
  session,
  initialSection,
  initialSuperadminData,
}: UseSuperadminConsoleOptions) {
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
        return localStorage.getItem('simopmas_sidebar_collapsed') === 'true';
      } catch (_e) {
        return false;
      }
    }
    return false;
  });

  const [counters, setCounters] = useState(
    initialSuperadminData?.counters || {
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
    }
  );

  // Modal states
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrSessionToken, setQrSessionToken] = useState('');
  const [currentNrp, setCurrentNrp] = useState('');
  const [currentUnitId, setCurrentUnitId] = useState('');

  // Complaints state for passing to Profile & Audit tab
  const [complaints, setComplaints] = useState<any[]>([]);

  const showNotification = useCallback((msg: string) => {
    toast.showNotification(msg, 4000);
  }, []);

  // Switch Tab & Sync URL Bar
  const switchTab = useCallback((tab: SuperadminTab) => {
    setActiveTab(tab);
    const targetUrl = tab === 'unit' ? '/console' : `/console/${tab}`;
    if (typeof window !== 'undefined' && window.location.pathname !== targetUrl) {
      window.history.pushState(null, '', targetUrl);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('simopmas_sidebar_collapsed', String(next));
      } catch (_e) {}
      return next;
    });
  }, []);

  const loadData = useCallback(async () => {
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
  }, []);

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
    if (!currentUser && !session) {
      getCurrentSessionAction().then((res) => {
        if (res.success && res.data) {
          setCurrentUser(res.data);
        }
      });
    }
  }, [initialSuperadminData, currentUser, session, loadData]);

  const handleLogout = useCallback(async () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('simopmas_active_user');
    }
    await logoutAction();
    window.location.href = '/?alert=logged_out';
  }, []);

  const openQrModal = useCallback(async (customNrp?: string, customUnitId?: string) => {
    const activeNrp = customNrp || '';
    const activeUnitId = customUnitId || '';
    setCurrentNrp(activeNrp);
    setCurrentUnitId(activeUnitId);
    const token = 'SESI_' + Math.random().toString(36).substring(2, 10).toUpperCase();
    setQrSessionToken(token);
    setShowQrModal(true);
    await createDevicePairingSessionAction({ sessionToken: token, nrp: activeNrp, unitId: activeUnitId });
  }, []);

  // Polling status pairing device dari database MySQL
  useEffect(() => {
    if (!showQrModal || !qrSessionToken) return;

    const interval = setInterval(async () => {
      const res = await checkDevicePairingSessionAction(qrSessionToken);
      if (res?.success && res?.data && res.data.status === 'PAIRED') {
        setShowQrModal(false);
        showNotification(
          `✓ Device ${res.data.deviceBrand || 'HP'} (${res.data.deviceId}) berhasil terhubung dari database!`
        );
        clearInterval(interval);
      }
    }, 1800);
    return () => clearInterval(interval);
  }, [showQrModal, qrSessionToken, showNotification]);

  // Generate QR Code saat modal dibuka
  useEffect(() => {
    if (!showQrModal || !qrSessionToken) {
      setQrDataUrl('');
      return;
    }
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const scanUrl = `${origin}/scan-device?nrp=${encodeURIComponent(currentNrp || 'TEST')}&unit=${encodeURIComponent(currentUnitId)}&session=${qrSessionToken}`;
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
  }, [showQrModal, qrSessionToken, currentNrp, currentUnitId]);

  return {
    units,
    masterItems,
    loading,
    initialLoading,
    qrDataUrl,
    currentUser,
    setCurrentUser,
    activeTab,
    switchTab,
    isSidebarCollapsed,
    toggleSidebar,
    counters,
    showQrModal,
    setShowQrModal,
    qrSessionToken,
    complaints,
    showNotification,
    loadData,
    handleLogout,
    openQrModal,
  };
}
