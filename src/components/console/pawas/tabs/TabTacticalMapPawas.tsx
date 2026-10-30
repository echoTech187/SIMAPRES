'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Activity, Users, Shield, X, MapPin, Crosshair, Zap, LocateFixed, AlertTriangle, Search } from 'lucide-react';

const SimapresMapPawas = dynamic(() => import('../SimapresMapPawas'), {
  ssr: false,
  loading: () => (
    <div style={{ width: '100%', height: '100%', minHeight: '350px', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', fontWeight: 700 }}>
      Memuat Peta Komando Taktis Pawas...
    </div>
  ),
});

import {
  PawasUserProfile,
  PawasFleetUnit,
  PawasHotspotItem,
  PawasPoliceOfficeItem,
  PawasComplaintDossier,
  UrgencyLevelInfo,
} from '../types';

export interface TabTacticalMapPawasProps {
  userProfile?: PawasUserProfile;
  fleetUnits: PawasFleetUnit[];
  hotspots: PawasHotspotItem[];
  policeOffices: PawasPoliceOfficeItem[];
  setShowHotspotModal: (show: boolean) => void;
  highPriorityIncident: PawasComplaintDossier | null;
  resolveUrgencyLevel: (urgensi?: string | null) => any;
  showFriendlyToast: (type: 'success' | 'warning' | 'error' | 'info', title: string, message: string) => void;
}

export default function TabTacticalMapPawas({
  userProfile,
  fleetUnits,
  hotspots,
  policeOffices,
  setShowHotspotModal,
  highPriorityIncident,
  resolveUrgencyLevel,
  showFriendlyToast,
}: TabTacticalMapPawasProps) {
  const [showTraffic, setShowTraffic] = useState(false);
  const [focusedUnitKey, setFocusedUnitKey] = useState<string | null>(null);
  const [isPicketSidebarOpen, setIsPicketSidebarOpen] = useState(false);
  const [picketFilterCategory, setPicketFilterCategory] = useState<'ALL' | 'PATROLI' | 'SIAGA' | 'DARURAT'>('ALL');
  const [picketSearch, setPicketSearch] = useState('');
  const [showIncidentNav, setShowIncidentNav] = useState(false);
  const [customCenter, setCustomCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [isMobileScreen, setIsMobileScreen] = useState(false);

  React.useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        setIsMobileScreen(window.innerWidth <= 768);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const incidentLat = highPriorityIncident
    ? Number(highPriorityIncident.tkpLat ?? highPriorityIncident.lat ?? highPriorityIncident.tkp_lat ?? 0)
    : 0;
  const incidentLng = highPriorityIncident
    ? Number(highPriorityIncident.tkpLng ?? highPriorityIncident.lng ?? highPriorityIncident.tkp_lng ?? 0)
    : 0;
  const hasIncidentCoords = incidentLat !== 0 && incidentLng !== 0;

  const picketUnitsList = fleetUnits || [];
  const patrolCount = picketUnitsList.filter((u) => u.status === 'PATROLI').length;
  const siagaCount = picketUnitsList.filter((u) => u.status === 'SIAGA').length;
  const daruratCount = picketUnitsList.filter((u) => u.status === 'DARURAT').length;

  const filteredPicketList = picketUnitsList.filter((u) => {
    if (picketFilterCategory === 'PATROLI' && u.status !== 'PATROLI') return false;
    if (picketFilterCategory === 'SIAGA' && u.status !== 'SIAGA') return false;
    if (picketFilterCategory === 'DARURAT' && u.status !== 'DARURAT') return false;
    if (picketSearch) {
      const q = picketSearch.toLowerCase();
      const matchName = (u.namaLengkap || u.title || '').toLowerCase().includes(q);
      const matchNrp = (u.nrp || '').toLowerCase().includes(q);
      const matchRank = (u.pangkat || '').toLowerCase().includes(q);
      const matchSub = (u.sub || '').toLowerCase().includes(q);
      const matchLoc = (u.lokasiTeks || '').toLowerCase().includes(q);
      const matchAct = (u.aktivitas || u.tugas || '').toLowerCase().includes(q);
      return matchName || matchNrp || matchRank || matchSub || matchLoc || matchAct;
    }
    return true;
  });

  return (
    <section
      id="view-peta-pawas"
      className="view active"
      style={{
        position: 'relative',
        width: '100%',
        height: isMobileScreen ? 'calc(100dvh - 124px)' : 'calc(100vh - 110px)',
        minHeight: isMobileScreen ? '420px' : '600px',
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        overflow: 'hidden',
      }}
    >
      {/* Map Canvas Fullscreen (Dedicated Pawas Tactical Map) */}
      <div style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1 }}>
        <SimapresMapPawas
          userProfile={userProfile}
          height="100%"
          fleetUnits={fleetUnits}
          hotspots={hotspots}
          policeOffices={policeOffices}
          targetComplaint={highPriorityIncident || undefined}
          showTraffic={showTraffic}
          focusedUnitKey={focusedUnitKey}
          controlsRightOffset={isMobileScreen ? '16px' : isPicketSidebarOpen ? '396px' : '20px'}
          onUnitClick={(unit: { key?: string; [k: string]: unknown }) => {
            if (unit.key?.startsWith('tkp_')) {
              setShowIncidentNav(true);
            }
            setFocusedUnitKey(unit.key || null);
          }}
          onSelectUnit={(unit: { key?: string; [k: string]: unknown }) => {
            if (unit.key?.startsWith('tkp_')) {
              setShowIncidentNav(true);
            }
            setFocusedUnitKey(unit.key || null);
          }}
        />
      </div>

      {/* ── UNIFIED RESPONSIVE TACTICAL TOP BAR (Restores 100% Full Text Without Any Overlap) ── */}
      <div
        id="pawas-tactical-top-bar"
        style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          right: isPicketSidebarOpen ? (isMobileScreen ? '12px' : '446px') : '12px',
          zIndex: 995,
          display: isMobileScreen && isPicketSidebarOpen ? 'none' : 'flex',
          flexDirection: 'column',
          maxWidth: isMobileScreen ? 'calc(100% - 24px)' : '370px',
          pointerEvents: 'none',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div
          className="floating-header"
          style={{
            pointerEvents: 'auto',
            background: 'rgba(15, 23, 42, 0.94)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            color: 'white',
            padding: '12px 14px',
            borderRadius: '12px',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            boxShadow: '0 8px 28px rgba(0,0,0,0.4)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            width: '100%',
          }}
        >
          {/* Row 1: Full Title + LIVE GPS */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 900, letterSpacing: '0.4px', color: '#38BDF8', whiteSpace: 'nowrap' }}>
              PETA TAKTIS PRESI 110
            </span>
            <span style={{ fontSize: '9.5px', background: 'rgba(16,185,129,0.2)', color: '#34D399', border: '1px solid rgba(16,185,129,0.3)', padding: '2px 7px', borderRadius: '4px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34D399', boxShadow: '0 0 6px #34D399' }} />
              LIVE GPS
            </span>
          </div>

          {/* Row 2: Full Subtitle */}
          <div style={{ fontSize: '10.5px', color: '#94A3B8', fontWeight: 500, lineHeight: 1.3 }}>
            Monitoring Pengawasan Personel &amp; Ranmor Patroli
          </div>

          {/* Row 3: Action Bar (Traffic Line Toggle & Toggle Button when sidebar closed) */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginTop: '2px' }}>
            <label
              id="container-toggle-traffic"
              style={{
                fontSize: '10px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                cursor: 'pointer',
                background: 'rgba(16,185,129,0.15)',
                border: '1px solid rgba(16,185,129,0.3)',
                padding: '5px 8px',
                borderRadius: '6px',
                color: '#34D399',
                whiteSpace: 'nowrap',
                fontWeight: 700,
              }}
            >
              <input
                type="checkbox"
                checked={showTraffic}
                onChange={(e) => setShowTraffic(e.target.checked)}
                style={{ cursor: 'pointer', accentColor: '#10B981', width: '13px', height: '13px' }}
              />
              <Activity size={12} color="#34D399" />
              <span>Traffic Line (Real-time)</span>
            </label>

            {/* Tombol Personel Piket (Hanya ditampilkan pada layar mobile di dalam HUD agar tidak duplikat dengan floating button di desktop) */}
            {!isPicketSidebarOpen && isMobileScreen && (
              <button
                type="button"
                id="btn-toggle-piket-sidebar"
                onClick={() => setIsPicketSidebarOpen(true)}
                style={{
                  background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                  color: '#FFFFFF',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  fontWeight: 800,
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                <Users size={13} />
                <span>Personel Piket ({fleetUnits.length})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Floating Button on Desktop when sidebar is closed (Top Right) */}
      {!isPicketSidebarOpen && !isMobileScreen && (
        <button
          type="button"
          id="btn-toggle-piket-sidebar-desktop"
          onClick={() => setIsPicketSidebarOpen(true)}
          style={{
            position: 'absolute',
            top: '12px',
            right: '16px',
            zIndex: 995,
            background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
            color: '#FFFFFF',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '10px',
            padding: '9px 16px',
            fontWeight: 800,
            fontSize: '12.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
            whiteSpace: 'nowrap',
          }}
        >
          <Users size={15} />
          <span>Personel Piket ({fleetUnits.length})</span>
        </button>
      )}

      {/* ======================================================== */}
      {/* TACTICAL SIDEBAR: PERSONEL PIKET AKTIF & PERGERAKAN      */}
      {/* ======================================================== */}
      <div
        id="sidebar-personel-piket-pawas"
        style={{
          position: 'absolute',
          top: isMobileScreen ? '0' : '16px',
          right: isMobileScreen
            ? isPicketSidebarOpen
              ? '0'
              : '-100%'
            : isPicketSidebarOpen
            ? '16px'
            : '-460px',
          bottom: isMobileScreen ? '0' : '16px',
          left: isMobileScreen && isPicketSidebarOpen ? '0' : undefined,
          width: isMobileScreen ? '100%' : '420px',
          maxWidth: isMobileScreen ? '100%' : 'calc(100vw - 32px)',
          background: 'rgba(15, 23, 42, 0.96)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: isMobileScreen ? 'none' : '1px solid rgba(56, 189, 248, 0.35)',
          borderRadius: isMobileScreen ? '0' : '16px',
          boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
          zIndex: 1000,
          display: isMobileScreen && !isPicketSidebarOpen ? 'none' : 'flex',
          flexDirection: 'column',
          transition: 'right 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
          color: '#FFFFFF',
        }}
      >
        {/* Sidebar Header (Rapi, Sejajar, Tidak Terpotong) */}
        <div
          style={{
            padding: isMobileScreen ? '12px 14px' : '14px 16px',
            background: 'linear-gradient(180deg, rgba(30, 58, 138, 0.6) 0%, rgba(15, 23, 42, 0.4) 100%)',
            borderBottom: '1px solid rgba(56, 189, 248, 0.2)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flexWrap: 'nowrap', flexShrink: 0 }}>
              <Shield size={16} color="#38BDF8" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: isMobileScreen ? '12px' : '13px', fontWeight: 900, color: '#38BDF8', letterSpacing: '0.4px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                PERSONEL PIKET AKTIF
              </span>
              <span style={{ fontSize: '10px', background: 'rgba(56,189,248,0.2)', color: '#7DD3FC', border: '1px solid rgba(56,189,248,0.3)', padding: '2px 7px', borderRadius: '6px', fontWeight: 800, whiteSpace: 'nowrap', flexShrink: 0 }}>
                {picketUnitsList.length} Bertugas
              </span>
            </div>
            <button
              type="button"
              id="btn-close-piket-sidebar-pawas"
              onClick={() => setIsPicketSidebarOpen(false)}
              style={{
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.45)',
                color: '#FCA5A5',
                borderRadius: '6px',
                padding: '4px 8px',
                fontSize: '11px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                flexShrink: 0,
                whiteSpace: 'nowrap',
              }}
              title="Tutup Panel Personel Piket"
            >
              <X size={13} />
              <span>Tutup</span>
            </button>
          </div>
          <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Piket Operasi Siaga • Regu Alpha Presisi
          </div>


          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={() => setPicketFilterCategory('ALL')}
              style={{
                flex: 1,
                padding: '5px 4px',
                borderRadius: '6px',
                border: picketFilterCategory === 'ALL' ? '1px solid #38BDF8' : '1px solid rgba(255,255,255,0.1)',
                background: picketFilterCategory === 'ALL' ? 'rgba(56,189,248,0.25)' : 'rgba(255,255,255,0.05)',
                color: picketFilterCategory === 'ALL' ? '#FFFFFF' : '#94A3B8',
                fontSize: '10.5px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Semua ({picketUnitsList.length})
            </button>
            <button
              type="button"
              onClick={() => setPicketFilterCategory('PATROLI')}
              style={{
                flex: 1,
                padding: '5px 4px',
                borderRadius: '6px',
                border: picketFilterCategory === 'PATROLI' ? '1px solid #10B981' : '1px solid rgba(255,255,255,0.1)',
                background: picketFilterCategory === 'PATROLI' ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.05)',
                color: picketFilterCategory === 'PATROLI' ? '#34D399' : '#94A3B8',
                fontSize: '10.5px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Patroli ({patrolCount})
            </button>
            <button
              type="button"
              onClick={() => setPicketFilterCategory('SIAGA')}
              style={{
                flex: 1,
                padding: '5px 4px',
                borderRadius: '6px',
                border: picketFilterCategory === 'SIAGA' ? '1px solid #2563EB' : '1px solid rgba(255,255,255,0.1)',
                background: picketFilterCategory === 'SIAGA' ? 'rgba(37,99,235,0.25)' : 'rgba(255,255,255,0.05)',
                color: picketFilterCategory === 'SIAGA' ? '#93C5FD' : '#94A3B8',
                fontSize: '10.5px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Siaga ({siagaCount})
            </button>
            {daruratCount > 0 && (
              <button
                type="button"
                onClick={() => setPicketFilterCategory('DARURAT')}
                style={{
                  flex: 1,
                  padding: '5px 4px',
                  borderRadius: '6px',
                  border: picketFilterCategory === 'DARURAT' ? '1px solid #EF4444' : '1px solid rgba(255,255,255,0.1)',
                  background: picketFilterCategory === 'DARURAT' ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.05)',
                  color: picketFilterCategory === 'DARURAT' ? '#FCA5A5' : '#94A3B8',
                  fontSize: '10.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                TKP ({daruratCount})
              </button>
            )}
          </div>

          {/* Quick Search Bar */}
          <div style={{ marginTop: '8px', position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={13} color="#94A3B8" style={{ position: 'absolute', left: '10px', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Cari nama, NRP, sektor..."
              value={picketSearch}
              onChange={(e) => setPicketSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 28px 6px 30px',
                background: 'rgba(0, 0, 0, 0.35)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: '6px',
                color: '#FFFFFF',
                fontSize: '11px',
                outline: 'none',
              }}
            />
            {picketSearch && (
              <button
                type="button"
                onClick={() => setPicketSearch('')}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 0,
                }}
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Cards List */}
        <div
          className="custom-scrollbar-tactical"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '10px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(56, 189, 248, 0.45) transparent',
          }}
        >
          {filteredPicketList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 15px', color: '#94A3B8', fontSize: '12px' }}>
              Tidak ada personel yang sesuai filter pencarian.
            </div>
          ) : (
            filteredPicketList.map((unit) => {
              const isFocused = focusedUnitKey === unit.key;
              const isPatrol = unit.status === 'PATROLI';
              const isTkp = unit.status === 'DARURAT';
              const statusBadgeBg = isTkp ? 'rgba(239,68,68,0.2)' : isPatrol ? 'rgba(16,185,129,0.2)' : 'rgba(37,99,235,0.2)';
              const statusBadgeColor = isTkp ? '#F87171' : isPatrol ? '#34D399' : '#93C5FD';
              const statusBorder = isTkp ? 'rgba(239,68,68,0.4)' : isPatrol ? 'rgba(16,185,129,0.4)' : 'rgba(37,99,235,0.4)';

              return (
                <div
                  key={unit.key}
                  id={`card-piket-${unit.key}`}
                  onClick={() => {
                    setFocusedUnitKey(unit.key);
                    if (isMobileScreen) {
                      setIsPicketSidebarOpen(false);
                    }
                  }}
                  style={{
                    background: isFocused ? 'rgba(2, 132, 199, 0.25)' : 'rgba(30, 41, 59, 0.65)',
                    border: isFocused ? '1.5px solid #38BDF8' : '1px solid rgba(148, 163, 184, 0.15)',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    boxShadow: isFocused ? '0 0 16px rgba(56, 189, 248, 0.3)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {/* Card Top: Avatar/Icon + Name + NRP */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '18px' }}>{unit.iconEmoji}</span>
                      <div>
                        <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.2 }}>
                          {unit.namaLengkap || unit.title}
                        </div>
                        <div style={{ fontSize: '10.5px', color: '#94A3B8', marginTop: '1px' }}>
                          {unit.pangkat ? `${unit.pangkat} • ` : ''}NRP {unit.nrp || '-'}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px' }}>
                      <span
                        style={{
                          fontSize: '9.5px',
                          fontWeight: 800,
                          padding: '2px 7px',
                          borderRadius: '999px',
                          background: statusBadgeBg,
                          color: statusBadgeColor,
                          border: `1px solid ${statusBorder}`,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {unit.statusLabel || unit.status}
                      </span>
                      {unit.hasScannedQr ? (
                        <span style={{ fontSize: '9px', fontWeight: 700, color: '#34D399', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', padding: '1px 5px', borderRadius: '4px' }}>
                          ✓ QR Valid
                        </span>
                      ) : (
                        <span style={{ fontSize: '9px', fontWeight: 700, color: '#FBBF24', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', padding: '1px 5px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <AlertTriangle size={10} color="#FBBF24" />
                          <span>Belum Scan QR</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Satuan & Ranmor */}
                  <div style={{ fontSize: '10.5px', color: '#38BDF8', fontWeight: 600 }}>
                    {unit.satuan || unit.sub}
                  </div>

                  {/* Card Sedang Di Mana (Lokasi) */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '11px', color: '#E2E8F0', background: 'rgba(0,0,0,0.25)', padding: '6px 8px', borderRadius: '6px' }}>
                    <MapPin size={13} color="#F59E0B" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ lineHeight: 1.3 }}>
                      <strong style={{ color: '#94A3B8', fontSize: '10px' }}>LOKASI: </strong>
                      {unit.lokasiTeks || (unit.makoName ? `Mako ${unit.makoName}` : 'Wilayah Hukum Kepolisian')}
                    </div>
                  </div>

                  {/* Card Sedang Melakukan Apa (Aktivitas Taktis) */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '11px', color: '#E2E8F0', background: 'rgba(0,0,0,0.25)', padding: '6px 8px', borderRadius: '6px' }}>
                    <Crosshair size={13} color="#10B981" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ lineHeight: 1.3 }}>
                      <strong style={{ color: '#94A3B8', fontSize: '10px' }}>KEGIATAN: </strong>
                      {unit.aktivitas || unit.tugas || 'Patroli Keamanan & Ketertiban'}
                    </div>
                  </div>

                  {/* Status Rute Google Directions jika Tanggap Darurat */}
                  {unit.status === 'DARURAT' && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', fontSize: '10px', color: '#FEE2E2', background: 'rgba(239,68,68,0.22)', border: '1px solid rgba(239,68,68,0.45)', padding: '5px 8px', borderRadius: '6px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 800 }}>
                        <span style={{ fontSize: '11px' }}>🚨</span>
                        <span>Rute Navigasi Google Directions</span>
                      </span>
                      {unit.etaText && (
                        <span style={{ color: '#FEF08A', fontWeight: 800, fontSize: '9.5px' }}>
                          {unit.etaText}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Card Bottom: Telemetry + Action */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px' }}>
                    <span style={{ fontSize: '10px', color: '#94A3B8', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Zap size={11} color="#38BDF8" />
                      <span>{unit.telemetri || 'GPS Aktif'}</span>
                    </span>
                    <span
                      style={{
                        fontSize: '10.5px',
                        fontWeight: 700,
                        color: '#38BDF8',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <LocateFixed size={12} color="#38BDF8" />
                      <span>Sorot Peta</span>
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>



      {/* Floating Panel Rute & Navigasi Respon Cepat (Hanya tampil jika Pawas memilih untuk memantau TKP) */}
      {showIncidentNav && highPriorityIncident && (
        <div
          id="panel-navigasi-rute-tkp"
          style={{
            position: 'absolute',
            bottom: '20px',
            left: '16px',
            right: '16px',
            zIndex: 9999,
            maxWidth: '440px',
            margin: '0 auto',
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
            color: 'white',
            borderRadius: '14px',
            boxShadow: '0 12px 30px rgba(0,0,0,0.45)',
            border: '1.5px solid #334155',
            padding: '14px 16px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ display: 'inline-block', width: '10px', height: '10px', background: '#10B981', borderRadius: '50%', boxShadow: '0 0 10px #10B981' }} />
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#38BDF8', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                INFORMASI TKP INSIDEN
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowIncidentNav(false)}
              style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#94A3B8', fontSize: '14px', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>

          <div style={{ fontSize: '14px', fontWeight: 800, color: '#FFFFFF', marginBottom: '4px' }}>
            {highPriorityIncident.jenisKejadian} - {highPriorityIncident.tkpAlamatTeks}
          </div>
          <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span>📍</span> {highPriorityIncident.tkpAlamatTeks}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
            <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 10px' }}>
              <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 700 }}>STATUS RESPON</div>
              <div style={{ fontSize: '14px', fontWeight: 900, color: '#10B981', marginTop: '2px' }}>
                {highPriorityIncident.status === 'BELUM_DITANGANI' ? 'Menunggu Disposisi' : highPriorityIncident.status}
              </div>
              <div style={{ fontSize: '10.5px', color: '#94A3B8' }}>
                Urgensi: {(() => {
                  const urg = resolveUrgencyLevel(highPriorityIncident.urgensi);
                  return typeof urg === 'object' && urg !== null ? (urg.label || urg.key || 'STANDAR') : (urg || 'STANDAR');
                })()}
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 10px' }}>
              <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 700 }}>SALURAN PENGADUAN</div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#38BDF8', marginTop: '2px' }}>
                {highPriorityIncident.platformRel?.label || highPriorityIncident.platformKey || 'Layanan 110'}
              </div>
              <div style={{ fontSize: '10px', color: '#A7F3D0' }}>Pelapor: {highPriorityIncident.pelaporNama}</div>
            </div>
          </div>

          <div style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', padding: '8px 10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>📢</span>
            <div style={{ fontSize: '11.5px', lineHeight: 1.4, color: '#E2E8F0' }}>
              {highPriorityIncident.ringkasanKeterangan || 'Petugas piket siaga bersiap menerima komando arahan taktis lapangan.'}
            </div>
          </div>

          {hasIncidentCoords && (
            <button
              type="button"
              onClick={() => {
                setCustomCenter({ lat: incidentLat, lng: incidentLng });
                setFocusedUnitKey(`tkp_${highPriorityIncident.id || 'current'}`);
                showFriendlyToast('info', 'Fokus TKP', `Peta diarahkan ke koordinat TKP (${incidentLat.toFixed(4)}, ${incidentLng.toFixed(4)})`);
              }}
              style={{
                marginTop: '10px',
                width: '100%',
                background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '9px 12px',
                fontSize: '11.5px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.35)',
              }}
            >
              🎯 Pusatkan Peta ke Lokasi TKP ({incidentLat.toFixed(4)}, {incidentLng.toFixed(4)})
            </button>
          )}
        </div>
      )}
    </section>
  );
}
