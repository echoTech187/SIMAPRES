'use client';

import React, { useState, useEffect } from 'react';
import { 
  Filter, 
  X, 
  RotateCcw, 
  Check, 
  Radio, 
  Tag, 
  ChevronRight, 
  Smartphone, 
  AlertTriangle, 
  Headphones, 
  FileText,
  ShieldCheck,
} from 'lucide-react';
import {
  PawasTab,
  PawasUserProfile,
  PawasLookupItem,
  PawasComplaintDossier,
  PawasFleetUnit,
  PawasLightboxData,
  PawasRecentActivity,
  ComplaintCategoryInfo,
} from '../types';
import { TabValidasiDossier } from './TabValidasiDossier';
import { TabValidasiGiatSection } from './TabValidasiGiatSection';
import { formatPhoneNumber } from '@/lib/format-phone';
import { isGenericOrCoordinateAddress, resolveSektorWilayah } from '@/infrastructure/services/reverse-geocode.service';

export interface TabValidasiPawasProps {
  userProfile: PawasUserProfile;
  switchTab: (tab: PawasTab) => void;
  dbStatuses: PawasLookupItem[];
  dbPlatforms: PawasLookupItem[];
  dbCategories: PawasLookupItem[];
  dbGiats: PawasLookupItem[];
  logsForStatusTabs: PawasComplaintDossier[];
  logsForKategori: PawasComplaintDossier[];
  tabCountSemua: number;
  tabCountMenunggu: number;
  platCountAll: number;
  platCountSos: number;
  platCountWarga: number;
  platCount110: number;
  platCountPersonel: number;
  katCountAll: number;
  valFilterStatus: string;
  setValFilterStatus: (v: string) => void;
  valFilterPlatform: string;
  setValFilterPlatform: (v: string) => void;
  valFilterKategori: string;
  setValFilterKategori: (v: string) => void;
  openValidasiList: (status: string, isMobile?: boolean) => void;
  handleSelectPlatformFilter: (pKey: string) => void;
  handleSelectKategoriFilter: (kKey: string) => void;
  handleResetFilters: () => void;
  filteredValidasiComplaints: PawasComplaintDossier[];
  activeComplaint: PawasComplaintDossier | null;
  setSelectedValComplaint: (c: PawasComplaintDossier | null) => void;
  matchesStatus: (c: PawasComplaintDossier, stKey: string) => boolean;
  matchesKategori: (c: PawasComplaintDossier, katKey: string) => boolean;
  getComplaintKategoriInfo: (c: PawasComplaintDossier) => ComplaintCategoryInfo;
  isComplaintRejected: (c: PawasComplaintDossier) => boolean;
  resolveComplaintStatus: (status: string, isRejected?: boolean) => PawasLookupItem;
  bukaModalDisposisi: (c: PawasComplaintDossier) => void;
  handleAjukanRevisi: (c: PawasComplaintDossier) => void;
  handleSahkanPenutupanKasus?: (c: PawasComplaintDossier) => void;
  setTolakComplaint: (c: PawasComplaintDossier | null) => void;
  bukaModalTolak?: (c: PawasComplaintDossier) => void;
  setLightboxImg: (data: any) => void;
  setShowLightboxModal: (show: boolean) => void;
  fleetUnits: PawasFleetUnit[];
  slaClockSeconds: number;
  formatSlaClock: (sec: number) => string;
  loading?: boolean;
  isServerDataLoaded?: boolean;
  recentActivities?: PawasRecentActivity[];
}

export const TabValidasiPawas: React.FC<TabValidasiPawasProps> = ({
  userProfile,
  switchTab,
  dbStatuses,
  dbPlatforms,
  dbCategories,
  dbGiats,
  logsForStatusTabs,
  logsForKategori,
  tabCountSemua,
  tabCountMenunggu,
  platCountAll,
  platCountSos,
  platCountWarga,
  platCount110,
  platCountPersonel,
  katCountAll,
  valFilterStatus,
  setValFilterStatus,
  valFilterPlatform,
  setValFilterPlatform,
  valFilterKategori,
  setValFilterKategori,
  openValidasiList,
  handleSelectPlatformFilter,
  handleSelectKategoriFilter,
  handleResetFilters,
  filteredValidasiComplaints,
  activeComplaint,
  setSelectedValComplaint,
  matchesStatus,
  matchesKategori,
  getComplaintKategoriInfo,
  isComplaintRejected,
  resolveComplaintStatus,
  bukaModalDisposisi,
  handleAjukanRevisi,
  handleSahkanPenutupanKasus,
  setTolakComplaint,
  bukaModalTolak,
  setLightboxImg,
  setShowLightboxModal,
  fleetUnits,
  slaClockSeconds,
  formatSlaClock,
  loading = false,
  isServerDataLoaded = true,
  recentActivities = [],
}) => {
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  // Jalur Komando Ganda: 'aduan' (Laporan Warga) vs 'giat' (Pengesahan Giat Personel Lapangan)
  const [komandoTrack, setKomandoTrack] = useState<'aduan' | 'giat'>('aduan');

  const [currentActivities, setCurrentActivities] = useState<any[]>(() => recentActivities || []);
  useEffect(() => {
    if (Array.isArray(recentActivities)) {
      setCurrentActivities(recentActivities);
    }
  }, [recentActivities]);

  const giatsList = currentActivities || [];
  const pendingGiatsCount = React.useMemo(() => {
    return giatsList.filter((g) => {
      const st = String(g.statusValidasi || g.validation_status || '').toUpperCase();
      return st === 'BELUM_DIVALIDASI' || st === 'PENDING' || st === '';
    }).length;
  }, [giatsList]);

  // Granular loading state: Shimmer does NOT stop until data is completely ready and safely rendered
  const [isDataReady, setIsDataReady] = useState(() => !loading && isServerDataLoaded);

  useEffect(() => {
    if (!loading && isServerDataLoaded) {
      const timer = setTimeout(() => {
        setIsDataReady(true);
      }, 200);
      return () => clearTimeout(timer);
    } else {
      setIsDataReady(false);
    }
  }, [loading, isServerDataLoaded]);

  return (
    <div style={{ width: '100%', maxWidth: '1440px', margin: '0 auto' }}>
      {/* ── COMMAND HEADER: Futuristic Cyber-Cockpit Style ── */}
      <div className="val-command-header">
        <div className="val-command-title-wrap">
          <div className="val-command-badge-row">
            <span className="val-radar-pulse-badge">
              <span className="radar-pulse-dot" />
              LIVE KOMANDO 110
            </span>
            <span className="val-role-badge">SUPERVISI PIKET</span>
          </div>
          <h2 className="val-main-title">
            Konsol Monitoring &amp; Komando Operasional
          </h2>
          <p className="val-main-subtitle">
            Validasi Laporan, Disposisi Cepat Armada Presisi &amp; Otorisasi Penutupan Berita Acara
          </p>
        </div>
      </div>

      {/* ── TRACK SELECTOR: DUAL-TRACK COMMAND (Aduan Warga vs Pengesahan Giat Personel) ── */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          margin: '0 0 16px',
          background: '#F1F5F9',
          padding: '5px',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          width: 'fit-content',
          maxWidth: '100%',
          overflowX: 'auto',
          scrollbarWidth: 'none',
        }}
      >
        <button
          type="button"
          id="btn-track-aduan"
          onClick={() => setKomandoTrack('aduan')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 18px',
            borderRadius: '12px',
            border: 'none',
            background: komandoTrack === 'aduan' ? 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 100%)' : 'transparent',
            color: komandoTrack === 'aduan' ? '#FFFFFF' : '#475569',
            fontSize: '12.5px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: komandoTrack === 'aduan' ? '0 3px 12px rgba(15, 23, 42, 0.25)' : 'none',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
          }}
        >
          <Radio size={15} style={{ color: komandoTrack === 'aduan' ? '#38BDF8' : '#64748B' }} />
          <span>1. Laporan Aduan Warga (110 / SOS)</span>
          <span
            style={{
              background: komandoTrack === 'aduan' ? 'rgba(56, 189, 248, 0.25)' : '#E2E8F0',
              color: komandoTrack === 'aduan' ? '#38BDF8' : '#334155',
              padding: '2px 8px',
              borderRadius: '10px',
              fontSize: '11px',
              fontWeight: 800,
            }}
          >
            {tabCountMenunggu > 0 ? `${tabCountMenunggu} Menunggu` : filteredValidasiComplaints.length}
          </span>
        </button>

        <button
          type="button"
          id="btn-track-giat"
          onClick={() => setKomandoTrack('giat')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 18px',
            borderRadius: '12px',
            border: 'none',
            background: komandoTrack === 'giat' ? 'linear-gradient(135deg, #0F172A 0%, #0369A1 100%)' : 'transparent',
            color: komandoTrack === 'giat' ? '#FFFFFF' : '#475569',
            fontSize: '12.5px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: komandoTrack === 'giat' ? '0 3px 12px rgba(3, 105, 161, 0.25)' : 'none',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
          }}
        >
          <ShieldCheck size={15} style={{ color: komandoTrack === 'giat' ? '#38BDF8' : '#64748B' }} />
          <span>2. Pengesahan Giat Personel (Patroli / Sambang / Pam)</span>
          <span
            style={{
              background: pendingGiatsCount > 0 ? '#EF4444' : komandoTrack === 'giat' ? 'rgba(56, 189, 248, 0.25)' : '#E2E8F0',
              color: pendingGiatsCount > 0 ? '#FFFFFF' : komandoTrack === 'giat' ? '#38BDF8' : '#334155',
              padding: '2px 8px',
              borderRadius: '10px',
              fontSize: '11px',
              fontWeight: 800,
            }}
          >
            {pendingGiatsCount > 0 ? `${pendingGiatsCount} Butuh Sahkan` : giatsList.length}
          </span>
        </button>
      </div>

      {komandoTrack === 'giat' ? (
        <TabValidasiGiatSection
          userProfile={userProfile}
          logbooks={currentActivities}
          setLightboxImg={setLightboxImg}
          setShowLightboxModal={setShowLightboxModal}
          onGiatStatusUpdated={(updated) => {
            setCurrentActivities((prev) =>
              prev.map((item) => (String(item.id) === String(updated.id) ? updated : item))
            );
          }}
        />
      ) : (
        <>
          {/* Status Filter Tabs (Dynamically Generated from Database dbStatuses) */}
      <div className="val-filter-tabs" style={{ display: 'flex', gap: '6px', margin: '0 0 12px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
        {!isDataReady ? (
          // Shimmer loading skeleton for tabs while waiting for data
          [80, 135, 75, 125, 140, 85].map((w, idx) => (
            <div
              key={idx}
              className="skeleton-shimmer"
              style={{
                width: `${w}px`,
                height: '32px',
                borderRadius: '20px',
                flexShrink: 0,
              }}
            />
          ))
        ) : (
          [
            { key: 'semua', label: 'Semua', count: tabCountSemua },
            ...(dbStatuses.length > 0
              ? dbStatuses.map((st: PawasLookupItem) => {
                  const rawLabel = String(st.label || st.key || '');
                  const cleanLabel = rawLabel.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim() || rawLabel;
                  return {
                    key: String(st.key || '').toLowerCase(),
                    label: cleanLabel,
                    count: logsForStatusTabs.filter((c) => matchesStatus(c, String(st.key || ''))).length,
                  };
                })
              : [
                  { key: 'menunggu', label: 'Menunggu Tindakan', count: tabCountMenunggu },
                ]),
          ].map((tab) => {
            const isActive = valFilterStatus === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                id={`val-tab-${tab.key}`}
                className={`val-tab-btn ${isActive ? 'active' : ''}`}
                onClick={() => {
                  openValidasiList(tab.key, false);
                }}
                style={{
                  padding: '7px 14px',
                  borderRadius: '20px',
                  border: isActive ? '1px solid #38BDF8' : '1px solid #E2E8F0',
                  background: isActive ? 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 100%)' : 'white',
                  color: isActive ? 'white' : '#1E293B',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  flexShrink: 0,
                  boxShadow: isActive ? '0 3px 10px rgba(56, 189, 248, 0.25)' : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                <span>{tab.label}</span>
                <span
                  className={`val-tab-badge ${tab.key}`}
                  style={{
                    background: isActive ? 'rgba(56, 189, 248, 0.25)' : '#F1F5F9',
                    color: isActive ? '#38BDF8' : '#475569',
                    padding: '2px 7px',
                    borderRadius: '10px',
                    fontSize: '11px',
                    fontWeight: 800,
                    marginLeft: '2px',
                  }}
                >
                  {tab.count}
                </span>
              </button>
            );
          })
        )}
      </div>

      {/* Subtitle Counter Bar + Filter Trigger (Clean & Modern HUD) */}
      <div
        id="val-subtitle-text"
        style={{
          margin: '0 0 14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '10px',
          flexWrap: 'wrap',
          padding: '4px 2px',
        }}
      >
        <div style={{ fontSize: '12.5px', color: '#475569', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>Menampilkan:</span>
          {!isDataReady ? (
            <span className="skeleton-shimmer" style={{ display: 'inline-block', width: '130px', height: '15px', borderRadius: '4px' }} />
          ) : (
            <strong style={{ color: '#0F172A' }}>
              {filteredValidasiComplaints.length} Data{' '}
              {valFilterStatus === 'semua'
                ? 'Semua Pengaduan'
                : (dbStatuses.find((s) => s.key?.toLowerCase() === valFilterStatus.toLowerCase())?.label || valFilterStatus.toUpperCase())}
            </strong>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {(valFilterPlatform !== 'all' || valFilterKategori !== 'all') && (
            <button
              type="button"
              id="btn-quick-reset-filter"
              onClick={handleResetFilters}
              style={{
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                color: '#DC2626',
                fontSize: '11px',
                fontWeight: 700,
                padding: '6px 11px',
                borderRadius: '16px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease',
              }}
              title="Reset Filter Platform & Kategori"
            >
              <RotateCcw size={11} />
              <span>Reset</span>
            </button>
          )}

          <button
            type="button"
            id="btn-open-filter-drawer"
            onClick={() => setShowFilterDrawer(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '20px',
              border: (valFilterPlatform !== 'all' || valFilterKategori !== 'all')
                ? '1.5px solid #2563EB'
                : '1px solid #CBD5E1',
              background: (valFilterPlatform !== 'all' || valFilterKategori !== 'all')
                ? 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)'
                : '#FFFFFF',
              color: (valFilterPlatform !== 'all' || valFilterKategori !== 'all')
                ? '#1D4ED8'
                : '#1E293B',
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer',
              boxShadow: (valFilterPlatform !== 'all' || valFilterKategori !== 'all')
                ? '0 2px 8px rgba(37,99,235,0.2)'
                : '0 1px 3px rgba(0,0,0,0.04)',
              transition: 'all 0.2s ease',
            }}
          >
            <Filter size={13} />
            <span>Filter</span>
            {(valFilterPlatform !== 'all' || valFilterKategori !== 'all') && (
              <span
                style={{
                  background: '#2563EB',
                  color: '#FFFFFF',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  fontSize: '10px',
                  fontWeight: 800,
                }}
              >
                {(valFilterPlatform !== 'all' ? 1 : 0) + (valFilterKategori !== 'all' ? 1 : 0)}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Split Layout: List Left + Dossier Detail Right (Responsive Grid) */}
      <div
        className={`split-layout-responsive ${isDataReady && filteredValidasiComplaints.length === 0 ? 'is-empty-fullwidth' : ''}`}
        style={isDataReady && filteredValidasiComplaints.length === 0 ? { gridTemplateColumns: '1fr', display: 'block', width: '100%' } : undefined}
      >
        {/* Shimmer Loading State */}
        {!isDataReady ? (
          <>
            {/* Left Column Shimmer Cards */}
            <div
              className="val-list"
              id="val-list-container"
              style={{
                minWidth: 0,
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {[1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'white',
                    border: '1px solid #E2E8F0',
                    borderRadius: '12px',
                    padding: '16px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="skeleton-shimmer" style={{ width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div className="skeleton-shimmer" style={{ width: '140px', height: '14px' }} />
                        <div className="skeleton-shimmer" style={{ width: '60px', height: '11px' }} />
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <div className="skeleton-shimmer" style={{ width: '90px', height: '18px', borderRadius: '4px' }} />
                        <div className="skeleton-shimmer" style={{ width: '75px', height: '18px', borderRadius: '4px' }} />
                      </div>
                    </div>
                  </div>
                  <div className="skeleton-shimmer" style={{ width: '65%', height: '16px' }} />
                  <div className="skeleton-shimmer" style={{ width: '95%', height: '13px' }} />
                  <div className="skeleton-shimmer" style={{ width: '80%', height: '13px' }} />
                  <div className="skeleton-shimmer" style={{ width: '100%', height: '44px', borderRadius: '6px' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px dashed #E2E8F0' }}>
                    <div className="skeleton-shimmer" style={{ width: '120px', height: '14px' }} />
                    <div className="skeleton-shimmer" style={{ width: '65px', height: '22px', borderRadius: '6px' }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Right Column Shimmer Dossier (Desktop) */}
            <div
              className="val-detail val-desktop-only"
              id="val-detail-box"
              style={{
                minWidth: 0,
                width: '100%',
                background: 'white',
                border: '1px solid #E2E8F0',
                borderRadius: '16px',
                padding: '20px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <div className="skeleton-shimmer" style={{ width: '140px', height: '14px' }} />
                <div className="skeleton-shimmer" style={{ width: '85px', height: '20px', borderRadius: '4px' }} />
              </div>
              <div style={{ padding: '12px 14px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div className="skeleton-shimmer" style={{ width: '130px', height: '16px' }} />
                <div className="skeleton-shimmer" style={{ width: '100%', height: '13px' }} />
                <div className="skeleton-shimmer" style={{ width: '80%', height: '13px' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {[1, 2, 3].map((stepIdx) => (
                  <div key={stepIdx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div className="skeleton-shimmer" style={{ width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0 }} />
                    <div style={{ flex: 1, background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div className="skeleton-shimmer" style={{ width: '150px', height: '14px' }} />
                        <div className="skeleton-shimmer" style={{ width: '65px', height: '14px' }} />
                      </div>
                      <div className="skeleton-shimmer" style={{ width: '90%', height: '12px' }} />
                      <div className="skeleton-shimmer" style={{ width: '60%', height: '12px' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Left Column: List Kartu Pengaduan (.val-list) */}
            <div
              className={`val-list ${filteredValidasiComplaints.length === 0 ? 'is-empty-fullwidth' : ''}`}
              id="val-list-container"
              style={{
                minWidth: 0,
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {filteredValidasiComplaints.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '60px 24px',
                  background: 'white',
                  borderRadius: '16px',
                  border: '1px solid #E2E8F0',
                  width: '100%',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
                  boxSizing: 'border-box'
                }}>
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '16px',
                      background: '#F1F5F9',
                      border: '1px solid #E2E8F0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px',
                      color: '#64748B',
                    }}
                  >
                    <Filter size={28} />
                  </div>
                  <div style={{ fontWeight: 800, color: '#1E293B', fontSize: '16px' }}>Tidak Ada Data Laporan Ditemukan</div>
                  <div style={{ fontSize: '13px', color: '#64748B', margin: '8px auto 0', maxWidth: '520px', lineHeight: 1.55 }}>
                    Tidak ada laporan pengaduan yang cocok dengan kombinasi status, platform, atau jenis pengaduan yang sedang aktif.
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setValFilterPlatform('all');
                      setValFilterKategori('all');
                      setValFilterStatus('semua');
                    }}
                    style={{
                      marginTop: '20px',
                      padding: '10px 24px',
                      background: '#153E75',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(21,62,117,0.22)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <RotateCcw size={14} />
                    <span>Tampilkan Semua Laporan (Reset Filter)</span>
                  </button>
                </div>
              ) : (
                filteredValidasiComplaints.map((log) => {
                  const isSos = log.jenisKejadian?.toLowerCase().includes('sos') || log.jenisKejadian?.toLowerCase().includes('panic');
                  const is110 = !!log.operatorId;
                  const platform = isSos ? 'sos' : is110 ? 'layanan110' : 'warga';

                  let avatarBorder = '#7DD3FC';
                  let avatarIcon = <Smartphone size={10} color="#FFFFFF" />;
                  let avatarIconBg = '#0284C7';
                  let platformBadge = (
                    <span style={{ fontSize: '9.5px', fontWeight: 800, padding: '2px 7px', borderRadius: '4px', background: '#F0F9FF', color: '#0284C7', border: '1px solid #BAE6FD', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Smartphone size={10} /> PORTAL WARGA
                    </span>
                  );
                  const formattedHp = formatPhoneNumber(log.pelaporHp) || log.pelaporHp || '-';
                  let kontakMeta = `${formattedHp} • NIK Valid`;

                  if (platform === 'sos') {
                    avatarBorder = '#FCA5A5';
                    avatarIcon = <AlertTriangle size={10} color="#FFFFFF" />;
                    avatarIconBg = '#DC2626';
                    platformBadge = (
                      <span style={{ fontSize: '9.5px', fontWeight: 800, padding: '2px 7px', borderRadius: '4px', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <AlertTriangle size={10} /> SOS PANIC
                      </span>
                    );
                    kontakMeta = `${formattedHp} • Darurat SOS (110)`;
                  } else if (platform === 'layanan110') {
                    avatarBorder = '#93C5FD';
                    avatarIcon = <Headphones size={10} color="#FFFFFF" />;
                    avatarIconBg = '#1D4ED8';
                    platformBadge = (
                      <span style={{ fontSize: '9.5px', fontWeight: 800, padding: '2px 7px', borderRadius: '4px', background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Headphones size={10} /> LAYANAN 110
                      </span>
                    );
                    kontakMeta = `${formattedHp} • Call Center 110`;
                  }

                  // Kategori styling (100% synchronized with getComplaintKategori)
                  const katInfo = getComplaintKategoriInfo(log);
                  const katBadgeStyle = katInfo.badgeStyle;
                  const katBadgeText = katInfo.badgeText;

                  // Status text & colors strictly matching MySQL master_complaint_statuses table
                  const isRejected = isComplaintRejected(log);
                  const statMeta = resolveComplaintStatus(log.status, isRejected);
                  const statusColor = statMeta.badge_color;
                  const statusText = statMeta.label;
                  let cardFooterText = 'Disposisi Tugas';
                  let cardFooterColor = '#1E40AF';

                  if (statMeta.key === 'DITOLAK') {
                    cardFooterText = 'Laporan Ditolak Pawas';
                    cardFooterColor = '#DC2626';
                  } else if (statMeta.key === 'DIPROSES') {
                    const tahap = Number(log.tahap) || 2;
                    if (tahap === 3) {
                      cardFooterText = 'Personil Meluncur ke TKP (< 10m)';
                      cardFooterColor = '#8B5CF6';
                    } else if (tahap >= 4) {
                      cardFooterText = 'Personil Tiba & Penanganan di TKP';
                      cardFooterColor = '#10B981';
                    } else {
                      cardFooterText = 'Personil Sudah Ditugaskan';
                      cardFooterColor = '#2563EB';
                    }
                  } else if (statMeta.key === 'MENUNGGU_PENGESAHAN') {
                    cardFooterText = 'Tindakan Rampung & Menunggu BAP Disahkan';
                    cardFooterColor = '#EF4444';
                  } else if (statMeta.key === 'SELESAI') {
                    cardFooterText = 'Berita Acara Disahkan & Ditutup Resmi';
                    cardFooterColor = '#2563EB';
                  }

                  const isSelected = activeComplaint?.id === log.id;
                  let borderLeftColor = '#3B82F6';
                  if (platform === 'sos' || log.urgensi === 'DARURAT' || log.urgensi === 'PRIORITAS_TINGGI') {
                    borderLeftColor = '#DC2626';
                  } else if (statMeta.key === 'MENUNGGU') {
                    borderLeftColor = '#F59E0B';
                  } else if (statMeta.key === 'DITOLAK') {
                    borderLeftColor = '#991B1B';
                  } else if (statMeta.key === 'SELESAI') {
                    borderLeftColor = '#10B981';
                  } else if (statMeta.key === 'DIPROSES') {
                    borderLeftColor = '#2563EB';
                  }

                  return (
                    <div
                      key={log.id}
                      id={`card-log-${log.id}`}
                      className={`val-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedValComplaint(log);
                        setShowDetailDrawer(true);
                      }}
                      style={{
                        background: isSelected ? '#F0F9FF' : 'white',
                        border: isSelected ? '1.5px solid #0284C7' : '1px solid #E2E8F0',
                        borderLeftWidth: '4px',
                        borderLeftStyle: 'solid',
                        borderLeftColor: borderLeftColor,
                        borderRadius: '12px',
                        padding: '14px',
                        cursor: 'pointer',
                        boxShadow: isSelected ? '0 4px 18px rgba(2,132,199,0.18)' : '0 1px 3px rgba(0,0,0,0.03)',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {/* Header Kartu: Avatar Pelapor, Nama, Waktu, Status, Platform */}
                      <div className="val-user" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                          {log.pelaporAvatarUrl ? (
                            <img
                              src={log.pelaporAvatarUrl}
                              alt="User"
                              style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${avatarBorder}`, display: 'block' }}
                            />
                          ) : (
                            <div
                              style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#F1F5F9', border: `2px solid ${avatarBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}
                            >
                              {log.platformKey === 'sos' ? (
                                <AlertTriangle size={18} color="#DC2626" />
                              ) : (
                                <Smartphone size={18} color="#0284C7" />
                              )}
                            </div>
                          )}
                          <span
                            style={{
                              position: 'absolute',
                              bottom: '-3px',
                              right: '-3px',
                              background: avatarIconBg,
                              color: 'white',
                              borderRadius: '50%',
                              width: '16px',
                              height: '16px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '1.5px solid white',
                            }}
                          >
                            {avatarIcon}
                          </span>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                            <div style={{ fontWeight: 700, fontSize: '13px', color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {log.pelaporNama}
                            </div>
                            <div style={{ fontSize: '10px', color: '#64748B', flexShrink: 0 }}>
                              {new Date(log.createdAt || Date.now()).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px', gap: '4px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '4px', background: String(statMeta.badge_bg || '#EFF6FF'), color: String(statMeta.badge_color || '#2563EB'), border: `1px solid ${String(statMeta.badge_border || '#BFDBFE')}` }}>
                              {statusText}
                            </span>
                            {platformBadge}
                          </div>
                        </div>
                      </div>

                      {/* Baris Kombinasi: Jenis Pengaduan & Tingkat Urgensi */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '9.5px', fontWeight: 800, padding: '2px 7px', borderRadius: '4px', ...katBadgeStyle }}>
                          {katBadgeText}
                        </span>
                        <span
                          style={{
                            fontSize: '9.5px',
                            fontWeight: 800,
                            padding: '1.5px 6px',
                            borderRadius: '4px',
                            whiteSpace: 'nowrap',
                            background: (log.urgensi === 'DARURAT' || log.urgensi === 'PRIORITAS_TINGGI') ? '#FEE2E2' : log.urgensi === 'SEDANG' ? '#FEF3C7' : '#EFF6FF',
                            color: (log.urgensi === 'DARURAT' || log.urgensi === 'PRIORITAS_TINGGI') ? '#DC2626' : log.urgensi === 'SEDANG' ? '#D97706' : '#1D4ED8',
                          }}
                        >
                          {(log.urgensi === 'DARURAT' || log.urgensi === 'PRIORITAS_TINGGI') ? 'Darurat' : log.urgensi === 'SEDANG' ? 'Sedang' : 'Normal'}
                        </span>
                      </div>

                      {/* Judul & Ringkasan Laporan */}
                      <div style={{ fontWeight: 700, fontSize: '12.5px', color: '#1E293B', lineHeight: 1.35, marginBottom: '4px' }}>
                        {log.jenisKejadian}
                      </div>
                      <div className="val-text" style={{ fontSize: '11.5px', color: '#475569', marginBottom: '6px', lineHeight: 1.45 }}>
                        {log.ringkasanKeterangan}
                      </div>

                      {/* Metadata Lokasi, Kontak & Tiket */}
                      <div style={{ fontSize: '10.5px', color: '#64748B', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '6px 8px', marginBottom: '6px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontWeight: 600, color: '#334155' }}>
                            {isGenericOrCoordinateAddress(log.tkpAlamatTeks)
                              ? resolveSektorWilayah(log.tkpAlamatTeks, log)
                              : log.tkpAlamatTeks}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', flexWrap: 'wrap' }}>
                          <span style={{ color: '#475569' }}>{kontakMeta}</span>
                          <span style={{ color: '#64748B' }}>Tiket: <strong>{log.nomorTiket}</strong></span>
                        </div>
                      </div>

                      {/* Badge info & Card footer */}
                      {isRejected && (
                        <div style={{ marginTop: '8px', background: '#FEF2F2', borderLeft: '3px solid #EF4444', padding: '8px 10px', borderRadius: '4px', fontSize: '11px', color: '#991B1B', lineHeight: 1.4 }}>
                          <strong>Catatan Penolakan:</strong> {log.ringkasanKeterangan?.includes('[DITOLAK PAWAS]:') ? log.ringkasanKeterangan.split('[DITOLAK PAWAS]:')[1]?.trim() : 'Laporan perlu direvisi oleh personel lapangan.'}
                        </div>
                      )}

                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginTop: '10px',
                          paddingTop: '8px',
                          borderTop: '1px dashed #E2E8F0',
                        }}
                      >
                        <div
                          onClick={(e) => {
                            if (isRejected) {
                              e.stopPropagation();
                              handleAjukanRevisi(log);
                            }
                          }}
                          style={{ fontSize: '11px', color: cardFooterColor, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <span>{cardFooterText}</span>
                          <ChevronRight size={13} />
                        </div>
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedValComplaint(log);
                            setShowDetailDrawer(true);
                          }}
                          style={{
                            fontSize: '10px',
                            fontWeight: 800,
                            color: '#1E40AF',
                            background: '#EFF6FF',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            border: '1px solid #BFDBFE',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            cursor: 'pointer',
                          }}
                        >
                          <span>Detail</span>
                          <ChevronRight size={12} />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Right Column: Dossier Detail & Timeline Pelacakan (.val-detail) - Desktop */}
            {/* Disembunyikan sepenuhnya jika data kosong, sehingga kolom kiri menjadi full-width */}
            {filteredValidasiComplaints.length > 0 && (
              <div
                className="val-detail val-desktop-only"
                id="val-detail-box"
                style={{
                  minWidth: 0,
                  width: '100%',
                  background: 'white',
                  border: '1px solid #E2E8F0',
                  borderRadius: '16px',
                  padding: '20px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                  height: 'auto',
                  boxSizing: 'border-box',
                }}
              >
                {activeComplaint ? (
                  <TabValidasiDossier
                    activeComplaint={activeComplaint}
                    userProfile={userProfile}
                    switchTab={switchTab}
                    isComplaintRejected={isComplaintRejected}
                    resolveComplaintStatus={resolveComplaintStatus}
                    bukaModalDisposisi={bukaModalDisposisi}
                    handleAjukanRevisi={handleAjukanRevisi}
                    handleSahkanPenutupanKasus={handleSahkanPenutupanKasus}
                    setTolakComplaint={setTolakComplaint}
                    bukaModalTolak={bukaModalTolak}
                    setLightboxImg={setLightboxImg}
                    setShowLightboxModal={setShowLightboxModal}
                    fleetUnits={fleetUnits}
                    slaClockSeconds={slaClockSeconds}
                    formatSlaClock={formatSlaClock}
                  />
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
                    Pilih kartu laporan di sebelah kiri untuk melihat rincian kasus.
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
        </>
      )}

      {/* ── DRAGGABLE FILTER DRAWER BOTTOM SHEET (MOBILE & DESKTOP) ── */}
      {showFilterDrawer && (
        <div
          className="val-filter-drawer-overlay"
          onClick={() => setShowFilterDrawer(false)}
        >
          <div
            className="val-filter-drawer-sheet"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => setTouchStartY(e.touches[0].clientY)}
            onTouchMove={(e) => {
              if (touchStartY !== null && e.touches[0].clientY - touchStartY > 60) {
                setShowFilterDrawer(false);
                setTouchStartY(null);
              }
            }}
            onTouchEnd={() => setTouchStartY(null)}
          >
            {/* Draggable Handle */}
            <div
              className="master-drawer-handle"
              style={{
                width: '44px',
                height: '5px',
                background: '#CBD5E1',
                borderRadius: '3px',
                margin: '12px auto 6px auto',
                cursor: 'grab',
                flexShrink: 0,
              }}
            />

            {/* Drawer Header */}
            <div
              style={{
                padding: '12px 20px',
                borderBottom: '1px solid #E2E8F0',
                background: '#F8FAFC',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexShrink: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: '#EFF6FF',
                    border: '1px solid #BFDBFE',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#2563EB',
                  }}
                >
                  <Filter size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>
                    Filter Laporan Pengaduan
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>
                    Saring berdasarkan platform pelaporan &amp; jenis aduan
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowFilterDrawer(false)}
                style={{
                  background: '#F1F5F9',
                  border: '1px solid #CBD5E1',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#475569',
                  cursor: 'pointer',
                }}
                title="Tutup Filter"
              >
                <X size={16} />
              </button>
            </div>

            {/* Drawer Body (Scrollable) */}
            <div
              className="custom-scrollbar-tactical"
              style={{
                padding: '16px 20px',
                overflowY: 'auto',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '18px',
              }}
            >
              {/* Section 1: Platform */}
              <div>
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    color: '#475569',
                    letterSpacing: '0.6px',
                    textTransform: 'uppercase',
                    marginBottom: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Radio size={13} color="#2563EB" />
                  <span>SUMBER PLATFORM PELAPORAN</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {(dbPlatforms.length > 0 ? [
                    {
                      key: 'all',
                      label: 'Semua Platform',
                      count: platCountAll,
                      activeBg: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 100%)',
                      activeColor: '#FFFFFF',
                    },
                    ...dbPlatforms.map((p) => {
                      const pKey = p.key;
                      const count = pKey === 'sos' ? platCountSos : pKey === 'warga' ? platCountWarga : pKey === 'layanan110' ? platCount110 : platCountPersonel;
                      const rawLabel = p.label || pKey || '';
                      const cleanLabel = rawLabel.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim() || rawLabel;
                      return {
                        key: pKey || '',
                        label: cleanLabel,
                        count,
                        activeBg: pKey === 'sos' ? '#DC2626' : pKey === 'warga' ? '#0284C7' : pKey === 'layanan110' ? '#1D4ED8' : '#B45309',
                        activeColor: '#FFFFFF',
                      };
                    }),
                  ] : [
                    { key: 'all', label: 'Semua Platform', count: platCountAll, activeBg: '#0F172A', activeColor: '#FFFFFF' },
                    { key: 'sos', label: 'Tombol Panik Darurat (SOS)', count: platCountSos, activeBg: '#DC2626', activeColor: '#FFFFFF' },
                    { key: 'warga', label: 'Portal Pengaduan Warga Presisi', count: platCountWarga, activeBg: '#0284C7', activeColor: '#FFFFFF' },
                    { key: 'layanan110', label: 'Pusat Panggilan SPKT 110', count: platCount110, activeBg: '#1D4ED8', activeColor: '#FFFFFF' },
                    { key: 'personel', label: 'Laporan Mandiri Personel Lapangan', count: platCountPersonel, activeBg: '#B45309', activeColor: '#FFFFFF' },
                  ]).map((p) => {
                    const isActive = valFilterPlatform === p.key;
                    return (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => handleSelectPlatformFilter(p.key || 'all')}
                        style={{
                          padding: '8px 14px',
                          borderRadius: '10px',
                          border: isActive ? '1.5px solid #2563EB' : '1px solid #E2E8F0',
                          background: isActive ? p.activeBg : '#F8FAFC',
                          color: isActive ? p.activeColor : '#334155',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.15s ease',
                          boxShadow: isActive ? '0 3px 8px rgba(37,99,235,0.2)' : 'none',
                        }}
                      >
                        <span>{p.label}</span>
                        <span
                          style={{
                            background: isActive ? 'rgba(255,255,255,0.25)' : '#E2E8F0',
                            color: isActive ? '#FFFFFF' : '#475569',
                            padding: '1px 7px',
                            borderRadius: '10px',
                            fontSize: '11px',
                            fontWeight: 800,
                          }}
                        >
                          {p.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section 2: Kategori / Giat */}
              <div>
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    color: '#475569',
                    letterSpacing: '0.6px',
                    textTransform: 'uppercase',
                    marginBottom: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Tag size={13} color="#2563EB" />
                  <span>{valFilterPlatform === 'personel' ? 'JENIS GIAT PATROLI' : 'JENIS ADUAN MASYARAKAT'}</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {valFilterPlatform === 'personel' ? (
                    [
                      { key: 'all', label: 'Semua Giat', count: katCountAll },
                      ...dbGiats.map((g) => {
                        const rawLabel = g.label || g.name || g.key || '';
                        const cleanLabel = rawLabel.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim() || rawLabel;
                        return {
                          key: g.key || '',
                          label: cleanLabel,
                          count: logsForKategori.filter((c) => matchesKategori(c, g.key || '')).length,
                        };
                      }),
                    ].map((giat) => {
                      const isActive = valFilterKategori === giat.key;
                      return (
                        <button
                          key={giat.key}
                          type="button"
                          onClick={() => handleSelectKategoriFilter(giat.key || 'all')}
                          style={{
                            padding: '8px 14px',
                            borderRadius: '10px',
                            border: isActive ? '1.5px solid #2563EB' : '1px solid #E2E8F0',
                            background: isActive ? 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 100%)' : '#F8FAFC',
                            color: isActive ? '#FFFFFF' : '#334155',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <span>{giat.label}</span>
                          <span
                            style={{
                              background: isActive ? 'rgba(255,255,255,0.25)' : '#E2E8F0',
                              color: isActive ? '#FFFFFF' : '#475569',
                              padding: '1px 7px',
                              borderRadius: '10px',
                              fontSize: '11px',
                              fontWeight: 800,
                            }}
                          >
                            {giat.count}
                          </span>
                        </button>
                      );
                    })
                  ) : (
                    [
                      { key: 'all', label: 'Semua Jenis', count: katCountAll },
                      ...dbCategories.map((cat) => {
                        const rawLabel = cat.label || cat.name || cat.key || '';
                        const cleanLabel = rawLabel.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim() || rawLabel;
                        return {
                          key: cat.key || '',
                          label: cleanLabel,
                          count: logsForKategori.filter((c) => matchesKategori(c, cat.key || '')).length,
                        };
                      }),
                    ].map((kat) => {
                      const isActive = valFilterKategori === kat.key;
                      return (
                        <button
                          key={kat.key}
                          type="button"
                          onClick={() => handleSelectKategoriFilter(kat.key || 'all')}
                          style={{
                            padding: '8px 14px',
                            borderRadius: '10px',
                            border: isActive ? '1.5px solid #2563EB' : '1px solid #E2E8F0',
                            background: isActive ? 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 100%)' : '#F8FAFC',
                            color: isActive ? '#FFFFFF' : '#334155',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.15s ease',
                            boxShadow: isActive ? '0 3px 8px rgba(37,99,235,0.2)' : 'none',
                          }}
                        >
                          <span>{kat.label}</span>
                          <span
                            style={{
                              background: isActive ? 'rgba(255,255,255,0.25)' : '#E2E8F0',
                              color: isActive ? '#FFFFFF' : '#475569',
                              padding: '1px 7px',
                              borderRadius: '10px',
                              fontSize: '11px',
                              fontWeight: 800,
                            }}
                          >
                            {kat.count}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div
              style={{
                padding: '14px 20px',
                borderTop: '1px solid #E2E8F0',
                background: '#F8FAFC',
                display: 'flex',
                gap: '10px',
                flexShrink: 0,
              }}
            >
              {(valFilterPlatform !== 'all' || valFilterKategori !== 'all') && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '10px',
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    color: '#DC2626',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <RotateCcw size={14} />
                  <span>Reset Filter</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowFilterDrawer(false)}
                style={{
                  flex: 1,
                  padding: '11px 18px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 100%)',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '13px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(30, 58, 138, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <Check size={16} />
                <span>Terapkan Filter</span>
                <span style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '10px', fontSize: '11.5px' }}>
                  {filteredValidasiComplaints.length} Data
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DRAGGABLE DETAIL DRAWER BOTTOM SHEET (KHUSUS MOBILE) ── */}
      {showDetailDrawer && activeComplaint && (
        <div
          className="val-detail-drawer-overlay"
          onClick={(e) => {
            if (typeof document !== 'undefined' && document.getElementById('fullscreen-tracking-map-modal')) {
              e.stopPropagation();
              return;
            }
            setShowDetailDrawer(false);
          }}
        >
          <div
            className="val-detail-drawer-sheet"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => {
              if (typeof document !== 'undefined' && document.getElementById('fullscreen-tracking-map-modal')) {
                e.stopPropagation();
                return;
              }
              setTouchStartY(e.touches[0].clientY);
            }}
            onTouchMove={(e) => {
              if (typeof document !== 'undefined' && document.getElementById('fullscreen-tracking-map-modal')) {
                e.stopPropagation();
                return;
              }
              if (touchStartY !== null && e.touches[0].clientY - touchStartY > 60) {
                setShowDetailDrawer(false);
                setTouchStartY(null);
              }
            }}
            onTouchEnd={() => setTouchStartY(null)}
          >
            {/* Draggable Handle */}
            <div
              className="master-drawer-handle"
              style={{
                width: '44px',
                height: '5px',
                background: '#CBD5E1',
                borderRadius: '3px',
                margin: '10px auto 4px auto',
                cursor: 'grab',
                flexShrink: 0,
              }}
            />

            {/* Drawer Header */}
            <div
              className="master-drawer-header"
              style={{
                padding: '12px 18px',
                borderBottom: '1px solid #E2E8F0',
                background: '#F8FAFC',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexShrink: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#2563EB',
                  flexShrink: 0,
                }}>
                  <FileText size={16} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    Tiket {activeComplaint.nomorTiket?.replace(/^#+/, '')}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {activeComplaint.pelaporNama} • {formatPhoneNumber(activeComplaint.pelaporHp) || activeComplaint.pelaporHp || '-'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="master-drawer-close-btn"
                onClick={() => setShowDetailDrawer(false)}
                title="Tutup Detail Laporan"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable Dossier Content */}
            <div
              className="custom-scrollbar-tactical"
              style={{
                padding: '16px 18px',
                overflowY: 'auto',
                flex: 1,
              }}
            >
              <TabValidasiDossier
                activeComplaint={activeComplaint}
                userProfile={userProfile}
                switchTab={switchTab}
                isComplaintRejected={isComplaintRejected}
                resolveComplaintStatus={resolveComplaintStatus}
                bukaModalDisposisi={bukaModalDisposisi}
                handleAjukanRevisi={handleAjukanRevisi}
                handleSahkanPenutupanKasus={handleSahkanPenutupanKasus}
                setTolakComplaint={setTolakComplaint}
                bukaModalTolak={bukaModalTolak}
                setLightboxImg={setLightboxImg}
                setShowLightboxModal={setShowLightboxModal}
                fleetUnits={fleetUnits}
                slaClockSeconds={slaClockSeconds}
                formatSlaClock={formatSlaClock}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TabValidasiPawas;

