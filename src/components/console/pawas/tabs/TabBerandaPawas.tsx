'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Headphones,
  Clock,
  Map,
  Shield,
  Settings,
  Activity,
  Car,
  Bike,
  Siren,
  Users,
  Award,
  Smartphone,
  PhoneCall,
  CheckCircle2,
  TrendingUp,
  Radio,
  Flame,
  ArrowRight,
} from 'lucide-react';
import { PawasTab, PresensiStatusType } from '../types';

export interface TabBerandaPawasProps {
  userProfile?: any;
  presensiStatus: PresensiStatusType;
  isServerDataLoaded?: boolean;
  switchTab: (tab: PawasTab) => void;
  highPriorityIncident: any;
  openValidasiList: (status: string, doSwitch?: boolean) => void;
  openValidasiWithPlatform: (platform: string) => void;
  setSelectedValComplaint: (complaint: any) => void;
  setShowHotspotModal: (show: boolean) => void;
  setShowSlaModal: (show: boolean) => void;
  setShowKuatPersModal: (show: boolean) => void;
  setShowIkmModal: (show: boolean) => void;
  fleetUnits: any[];
  hotspots: any[];
  policeOffices: any[];
  totalLaporan: number;
  menungguCount: number;
  ditolakCount: number;
  diprosesCount: number;
  pengesahanCount: number;
  selesaiCount: number;
  sosCount: number;
  wargaCount: number;
  hotline110Count: number;
  personelCount: number;
  allRecentComplaints: any[];
  completedWithTime: any[];
  avgResponseTime: string;
  onTimeRate: string;
  fastCount: number;
  mediumCount: number;
  slowCount: number;
  registeredUnits: any[];
  satisfactionRating: string;
  satisfactionPercent: string;
  recentActivities?: any[];
}

export default function TabBerandaPawas({
  userProfile,
  presensiStatus,
  isServerDataLoaded = true,
  switchTab,
  highPriorityIncident,
  openValidasiList,
  openValidasiWithPlatform,
  setSelectedValComplaint,
  setShowHotspotModal,
  setShowSlaModal,
  setShowKuatPersModal,
  setShowIkmModal,
  fleetUnits,
  hotspots,
  policeOffices,
  totalLaporan,
  menungguCount,
  ditolakCount,
  diprosesCount,
  pengesahanCount,
  selesaiCount,
  sosCount,
  wargaCount,
  hotline110Count,
  personelCount,
  allRecentComplaints,
  completedWithTime,
  avgResponseTime,
  onTimeRate,
  fastCount,
  mediumCount,
  slowCount,
  registeredUnits,
  satisfactionRating,
  satisfactionPercent,
  recentActivities = [],
}: TabBerandaPawasProps) {
  // Live Digital Military Clock for Cockpit HUD
  const [currentTime, setCurrentTime] = useState<string>('');
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB'
      );
    };
    update();
    const clockTimer = setInterval(update, 1000);
    return () => clearInterval(clockTimer);
  }, []);

  // Greeting & Officer Identity for Compact Command Cockpit
  const greeting = useMemo(() => {
    const hours = new Date().getHours();
    if (hours >= 4 && hours < 11) return 'Selamat Pagi';
    if (hours >= 11 && hours < 15) return 'Selamat Siang';
    if (hours >= 15 && hours < 19) return 'Selamat Sore';
    return 'Selamat Malam';
  }, []);

  const officerName = userProfile?.fullName || userProfile?.nama || 'Perwira Pengawas';
  const officerMako = userProfile?.stationName || userProfile?.satuanNama || 'Mako Komando';

  // Dynamic Real-time Activities derived from Database (OfficerLogbooks or Real Complaints Timeline)
  const dynamicActivities = useMemo(() => {
    // 1. If we have real logbooks from officer_logbooks table
    if (Array.isArray(recentActivities) && recentActivities.length > 0) {
      return recentActivities.slice(0, 5).map((log: any, idx: number) => {
        const timeStr = log.start_time
          ? `${log.start_time} WIB`
          : log.created_at
          ? new Date(log.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'
          : '-';
        const off = log.officer;
        const offName = off?.user?.full_name || off?.nrp || 'Petugas Lapangan';
        const offRank = off?.rank_pangkat || '';
        const offUnit = off?.unit?.short_name || off?.unit?.unit_name || off?.jabatan || '';
        const officerStr = offRank ? `${offRank} ${offName}${offUnit ? ` (${offUnit})` : ''}` : `${offName}${offUnit ? ` (${offUnit})` : ''}`;
        const desc = log.activity_description || `${log.action_type || 'Patroli'} di ${log.claimed_address || 'wilayah hukum'}`;
        const color = idx % 3 === 0 ? '#0284C7' : idx % 3 === 1 ? '#10B981' : '#F59E0B';
        return { time: timeStr, text: `${officerStr} - ${desc}`, color };
      });
    }

    // 2. If no logbooks yet, derive from recent real complaint activities in allRecentComplaints
    if (Array.isArray(allRecentComplaints) && allRecentComplaints.length > 0) {
      return allRecentComplaints.slice(0, 4).map((c: any, idx: number) => {
        const timeStr = c.created_at || c.createdAt
          ? new Date(c.created_at || c.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'
          : '-';
        const unitStr = c.assignedOfficer?.unitName || c.assignedUnitNama || 'Regu SIMOPMAS 110';
        const statusLabel = c.status === 'SELESAI' ? 'Penanganan Selesai' : c.status === 'DIPROSES' ? 'Meluncur / Tiba di TKP' : 'Menerima Laporan';
        const text = `${unitStr}: [${c.nomorTiket || '110'}] ${statusLabel} untuk ${c.jenisKejadian || 'Aduan Warga'} di ${c.tkpAlamatTeks || 'TKP'}.`;
        const color = c.status === 'SELESAI' ? '#10B981' : c.status === 'DIPROSES' ? '#0284C7' : '#F59E0B';
        return { time: timeStr, text, color };
      });
    }

    return [];
  }, [recentActivities, allRecentComplaints]);

  // ── GRANULAR COMPONENT-LEVEL LOADING STATES (useState optimization) ──
  // Per rule: shimmer does NOT stop until component data is completely and safely verified as ready
  const [isFleetReady, setIsFleetReady] = useState(false);
  const [isRekapReady, setIsRekapReady] = useState(false);
  const [isFeedReady, setIsFeedReady] = useState(false);
  const [isSlaReady, setIsSlaReady] = useState(false);
  const [isIkmReady, setIsIkmReady] = useState(false);
  const [isAktivitasReady, setIsAktivitasReady] = useState(false);

  // 1. Fleet Telemetry Verification
  useEffect(() => {
    if (isServerDataLoaded && Array.isArray(fleetUnits) && Array.isArray(hotspots)) {
      const timer = setTimeout(() => setIsFleetReady(true), 250);
      return () => clearTimeout(timer);
    }
  }, [isServerDataLoaded, fleetUnits, hotspots]);

  // 3. Rekapitulasi Verification
  useEffect(() => {
    if (isServerDataLoaded && typeof totalLaporan === 'number' && typeof menungguCount === 'number') {
      const timer = setTimeout(() => setIsRekapReady(true), 280);
      return () => clearTimeout(timer);
    }
  }, [isServerDataLoaded, totalLaporan, menungguCount]);

  // 4. Feed Komando Verification
  useEffect(() => {
    if (isServerDataLoaded && Array.isArray(allRecentComplaints)) {
      const timer = setTimeout(() => setIsFeedReady(true), 320);
      return () => clearTimeout(timer);
    }
  }, [isServerDataLoaded, allRecentComplaints]);

  // 5. SLA Widget Verification
  useEffect(() => {
    if (isServerDataLoaded && Array.isArray(completedWithTime) && avgResponseTime !== undefined) {
      const timer = setTimeout(() => setIsSlaReady(true), 300);
      return () => clearTimeout(timer);
    }
  }, [isServerDataLoaded, completedWithTime, avgResponseTime]);

  // 7. IKM Widget Verification
  useEffect(() => {
    if (isServerDataLoaded && satisfactionRating !== undefined) {
      const timer = setTimeout(() => setIsIkmReady(true), 360);
      return () => clearTimeout(timer);
    }
  }, [isServerDataLoaded, satisfactionRating]);

  // 8. Aktivitas Widget Verification
  useEffect(() => {
    if (isServerDataLoaded) {
      const timer = setTimeout(() => setIsAktivitasReady(true), 380);
      return () => clearTimeout(timer);
    }
  }, [isServerDataLoaded]);

  return (
    <div style={{ width: '100%', maxWidth: '1440px', margin: '0 auto', paddingBottom: '30px' }}>
      {/* ── TOP HERO: COMPACT TACTICAL COMMAND BAR (OPTION 1) ── */}
      <div
        id="dashboard-command-cockpit"
        className="command-center-cockpit"
        style={{
          padding: '14px 20px',
          marginBottom: '18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        {/* Row 1: Status Siaga & Live Digital Clock */}
        <div
          className="cockpit-top-row"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          {/* Duty Status Indicator with Radar Pulse */}
          <div
            style={{
              fontSize: '11px',
              fontWeight: 800,
              color: presensiStatus === 'SUDAH_MASUK' ? '#34D399' : '#FCD34D',
              background: presensiStatus === 'SUDAH_MASUK' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
              border: presensiStatus === 'SUDAH_MASUK' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(245, 158, 11, 0.4)',
              padding: '3px 10px',
              borderRadius: '20px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span
              className={presensiStatus === 'SUDAH_MASUK' ? 'pulse-live-dot' : ''}
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: presensiStatus === 'SUDAH_MASUK' ? '#10B981' : '#F59E0B',
              }}
            />
            <span>{presensiStatus === 'SUDAH_MASUK' ? 'DINAS PIKET AKTIF • REGU KOMANDO' : 'STATUS: STANDBY CADANGAN SIAGA'}</span>
          </div>

          {/* Clock & Date Badge */}
          <div
            style={{
              fontSize: '11px',
              color: '#94A3B8',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(15, 23, 42, 0.6)',
              padding: '3px 9px',
              borderRadius: '6px',
              border: '1px solid rgba(148, 163, 184, 0.2)',
            }}
          >
            <Clock size={12} color="#38BDF8" />
            <span>{currentTime || 'Memuat waktu...'} • {new Date().toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
        </div>

        {/* Row 2: Officer Greeting + Mako & Compact Action Button */}
        <div
          className="cockpit-main-row"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          {/* Officer Identity & Mako */}
          <div style={{ minWidth: 0, flex: '1 1 240px' }}>
            <div
              className="cockpit-title"
              style={{
                fontSize: '16.5px',
                fontWeight: 900,
                letterSpacing: '-0.3px',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                lineHeight: 1.25,
              }}
            >
              <span>{greeting}, {officerName}</span>
            </div>
            <div
              className="cockpit-subtitle"
              style={{
                fontSize: '11.5px',
                color: '#93C5FD',
                fontWeight: 600,
                marginTop: '3px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                flexWrap: 'wrap',
              }}
            >
              <span>{officerMako}</span>
              <span style={{ color: '#475569' }}>•</span>
              <span style={{ color: '#38BDF8', fontWeight: 700 }}>Pusat Komando Operasional SIMOPMAS 110</span>
            </div>
          </div>

          {/* Compact Emergency CAD Action Button */}
          <button
            id="btn-top-spkt-disposisi"
            type="button"
            onClick={() => switchTab('view-operator')}
            className="btn-cockpit-cad"
            style={{
              background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
              color: '#FFFFFF',
              border: '1px solid rgba(52, 211, 153, 0.5)',
              padding: '8px 16px',
              borderRadius: '10px',
              fontWeight: 800,
              fontSize: '12px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
              letterSpacing: '0.2px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            title="Buka Sentra Pelayanan untuk Tambah Pengaduan Darurat & Disposisi Cepat"
          >
            <Headphones size={15} />
            <span>+ TAMBAH PENGADUAN 110</span>
          </button>
        </div>
      </div>

      {/* ── 2-COLUMN RESPONSIVE GRID LAYOUT ── */}
      <div className="beranda-grid-responsive">

        {/* ── LEFT COLUMN ── */}
        <div id="beranda-col-left" style={{ minWidth: 0, width: '100%' }}>

          {/* ── 1. COMPONENT: PUSAT TELEMETRI ARMADA & KESIAPAN PATROLI ── */}
          {!isFleetReady ? (
            /* Shimmer Skeleton for Fleet Telemetry */
            <div
              className="cyber-skeleton"
              style={{
                height: '240px',
                borderRadius: '16px',
                marginBottom: '20px',
              }}
            />
          ) : (
            <div
              className="card-panel futuristic-card"
              id="card-fleet-telemetry-beranda"
              style={{ padding: '22px', marginBottom: '20px', borderRadius: '16px' }}
            >
              {/* Card Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <div className="card-title" style={{ fontSize: '14.5px', fontWeight: 900, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '-0.2px' }}>
                    <Radio size={18} color="#0284C7" />
                    <span>PUSAT TELEMETRI ARMADA &amp; KESIAPAN PATROLI</span>
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '3px' }}>
                    Monitoring kesiapan unit patroli tergelar, titik rawan kriminalitas, dan respon cepat presisi
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontSize: '10.5px',
                    color: '#059669',
                    background: '#ECFDF5',
                    border: '1px solid #A7F3D0',
                    padding: '3px 10px',
                    borderRadius: '20px',
                    fontWeight: 800,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}>
                    <span className="pulse-live-dot" style={{ width: '6px', height: '6px' }} />
                    TELEMETRI GPS AKTIF
                  </span>
                </div>
              </div>

              {/* 4 Interactive Fleet Telemetry Pods */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                {/* Pod 1: Samapta R-4 */}
                <div
                  style={{
                    background: 'linear-gradient(135deg, #F0F9FF 0%, #FFFFFF 100%)',
                    border: '1.5px solid #BFDBFE',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Car size={18} color="#1D4ED8" />
                    </div>
                    <div>
                      <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#1E293B' }}>Samapta R-4</div>
                      <div style={{ fontSize: '10.5px', color: '#64748B' }}>Sektor Pemukiman</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '20px', fontWeight: 900, color: '#1D4ED8', lineHeight: 1 }}>
                      {fleetUnits.filter((u) => u.category === 'samapta' || (u.key && u.key.toLowerCase().includes('samapta'))).length}
                    </div>
                    <div style={{ fontSize: '9.5px', color: '#2563EB', fontWeight: 800, marginTop: '2px' }}>UNIT SIAGA</div>
                  </div>
                </div>

                {/* Pod 2: Perintis Presisi R-2 */}
                <div
                  style={{
                    background: 'linear-gradient(135deg, #FFFBEB 0%, #FFFFFF 100%)',
                    border: '1.5px solid #FDE68A',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Bike size={18} color="#B45309" />
                    </div>
                    <div>
                      <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#1E293B' }}>Perintis R-2</div>
                      <div style={{ fontSize: '10.5px', color: '#64748B' }}>Urai Massa &amp; 3C</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '20px', fontWeight: 900, color: '#D97706', lineHeight: 1 }}>
                      {fleetUnits.filter((u) => u.category === 'perintis' || (u.key && u.key.toLowerCase().includes('perintis'))).length}
                    </div>
                    <div style={{ fontSize: '9.5px', color: '#B45309', fontWeight: 800, marginTop: '2px' }}>TIM PATROLI</div>
                  </div>
                </div>

                {/* Pod 3: Turjawali Lantas R-4 */}
                <div
                  style={{
                    background: 'linear-gradient(135deg, #F0FDF4 0%, #FFFFFF 100%)',
                    border: '1.5px solid #BBF7D0',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Siren size={18} color="#15803D" />
                    </div>
                    <div>
                      <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#1E293B' }}>Lantas R-4</div>
                      <div style={{ fontSize: '10.5px', color: '#64748B' }}>Turjawali Protokol</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                      {fleetUnits.filter((u) => u.category === 'lantas').length}
                    <div style={{ fontSize: '9.5px', color: '#15803D', fontWeight: 800, marginTop: '2px' }}>TERGELAR</div>
                  </div>
                </div>

                {/* Pod 4: Titik Rawan */}
                <div
                  style={{
                    background: 'linear-gradient(135deg, #FEF2F2 0%, #FFFFFF 100%)',
                    border: '1.5px solid #FECACA',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Flame size={18} color="#DC2626" />
                    </div>
                    <div>
                      <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#1E293B' }}>Titik Rawan</div>
                      <button
                        type="button"
                        onClick={() => setShowHotspotModal(true)}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          fontSize: '10.5px',
                          color: '#DC2626',
                          fontWeight: 700,
                          textDecoration: 'underline',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                        }}
                      >
                        <Settings size={10} />
                        <span>Kelola Titik</span>
                      </button>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '20px', fontWeight: 900, color: '#DC2626', lineHeight: 1 }}>
                      {hotspots.length}
                    </div>
                    <div style={{ fontSize: '9.5px', color: '#991B1B', fontWeight: 800, marginTop: '2px' }}>ZONA RAWAN</div>
                  </div>
                </div>
              </div>

              {/* Direct Fullscreen Tactical Map CTA Button (Responsive Sleek Layout) */}
              <button
                id="btn-beranda-open-tactical-map"
                type="button"
                onClick={() => switchTab('view-peta')}
                style={{
                  marginTop: '16px',
                  width: '100%',
                  background: 'linear-gradient(135deg, #0B192C 0%, #153E75 55%, #1E40AF 100%)',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  color: '#FFFFFF',
                  padding: '12px 18px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: '0 6px 20px rgba(15, 23, 42, 0.18)',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', minWidth: 0, flex: 1 }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.16)', border: '1px solid rgba(56, 189, 248, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                    <Map size={19} color="#38BDF8" />
                  </div>
                  <div style={{ textAlign: 'left', minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.25 }}>
                      Buka Peta Taktis Layar Penuh
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#BAE6FD', fontWeight: 500, marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      Live tracking {fleetUnits.length} unit piket &amp; kejadian 110
                    </div>

                    {/* Tombol Buka Peta Khusus Tampilan Mobile (di bawah Live Tracking) */}
                    <div
                      className="btn-map-pill btn-map-pill-mobile"
                      style={{
                        display: 'none',
                        alignItems: 'center',
                        gap: '6px',
                        background: '#FFFFFF',
                        border: '1px solid rgba(255, 255, 255, 0.9)',
                        padding: '6px 12px',
                        borderRadius: '7px',
                        color: '#0B192C',
                        fontWeight: 800,
                        fontSize: '11px',
                        marginTop: '8px',
                        width: 'fit-content',
                        letterSpacing: '0.3px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.22)',
                      }}
                    >
                      <span style={{ color: '#0B192C' }}>BUKA PETA</span>
                      <ArrowRight size={13} strokeWidth={2.8} color="#0284C7" />
                    </div>
                  </div>
                </div>

                {/* Tombol Buka Peta Khusus Layar Desktop / Tablet (di sebelah kanan) */}
                <div
                  className="btn-map-pill btn-map-pill-desktop"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#FFFFFF',
                    border: '1px solid rgba(255, 255, 255, 0.9)',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    color: '#0B192C',
                    fontWeight: 800,
                    fontSize: '11.5px',
                    flexShrink: 0,
                    letterSpacing: '0.4px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.22)',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  }}
                >
                  <span style={{ color: '#0B192C' }}>BUKA PETA</span>
                  <ArrowRight size={14} strokeWidth={2.8} color="#0284C7" />
                </div>
              </button>
            </div>
          )}

          {/* ── 3. COMPONENT: REKAPITULASI HARI INI ── */}
          {!isRekapReady ? (
            /* Shimmer Skeleton for Rekapitulasi */
            <div
              className="cyber-skeleton"
              style={{
                height: '180px',
                borderRadius: '14px',
                marginBottom: '20px',
              }}
            />
          ) : (
            <div
              id="rekap-card"
              className="card-panel futuristic-card"
              style={{ padding: '20px', marginBottom: '20px', borderRadius: '16px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                <div className="card-title" style={{ fontSize: '14.5px', fontWeight: 900, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '-0.2px' }}>
                  <TrendingUp size={18} color="#0284C7" />
                  <span>REKAPITULASI LAPORAN OPERASIONAL HARI INI</span>
                </div>
                <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Klik kartu untuk audit rincian</span>
              </div>

              {/* 6 Holographic Metric KPI Tiles */}
              <div className="rekap-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
                {/* Total Laporan */}
                <div
                  className="holographic-metric-tile"
                  onClick={() => openValidasiList('semua')}
                  style={{ cursor: 'pointer', textAlign: 'center', borderTop: '3.5px solid #0284C7', background: 'linear-gradient(180deg, #F0F9FF 0%, #FFFFFF 60%)' }}
                >
                  <div style={{ fontSize: '10px', fontWeight: 900, color: '#0284C7', letterSpacing: '0.6px' }}>TOTAL LAPORAN</div>
                  <div style={{ fontSize: '26px', fontWeight: 900, color: '#0F172A', marginTop: '4px', lineHeight: 1.1 }}>{totalLaporan}</div>
                  <div style={{ fontSize: '9.5px', color: '#64748B', fontWeight: 700, marginTop: '4px' }}>Seluruh Saluran</div>
                </div>

                {/* Menunggu Tindakan */}
                <div
                  className="holographic-metric-tile"
                  onClick={() => openValidasiList('menunggu')}
                  style={{ cursor: 'pointer', textAlign: 'center', borderTop: '3.5px solid #D97706', background: 'linear-gradient(180deg, #FFFBEB 0%, #FFFFFF 60%)' }}
                >
                  <div style={{ fontSize: '10px', fontWeight: 900, color: '#D97706', letterSpacing: '0.6px' }}>MENUNGGU</div>
                  <div style={{ fontSize: '26px', fontWeight: 900, color: '#D97706', marginTop: '4px', lineHeight: 1.1 }}>{menungguCount}</div>
                  <div style={{ fontSize: '9.5px', color: '#B45309', fontWeight: 700, marginTop: '4px' }}>Perlu Disposisi</div>
                </div>

                {/* Ditolak */}
                <div
                  className="holographic-metric-tile"
                  onClick={() => openValidasiList('ditolak')}
                  style={{ cursor: 'pointer', textAlign: 'center', borderTop: '3.5px solid #DC2626', background: 'linear-gradient(180deg, #FEF2F2 0%, #FFFFFF 60%)' }}
                >
                  <div style={{ fontSize: '10px', fontWeight: 900, color: '#DC2626', letterSpacing: '0.6px' }}>DITOLAK</div>
                  <div style={{ fontSize: '26px', fontWeight: 900, color: '#DC2626', marginTop: '4px', lineHeight: 1.1 }}>{ditolakCount}</div>
                  <div style={{ fontSize: '9.5px', color: '#991B1B', fontWeight: 700, marginTop: '4px' }}>Tidak Sesuai SOP</div>
                </div>

                {/* Sedang Ditangani */}
                <div
                  className="holographic-metric-tile"
                  onClick={() => openValidasiList('diproses')}
                  style={{ cursor: 'pointer', textAlign: 'center', borderTop: '3.5px solid #2563EB', background: 'linear-gradient(180deg, #EFF6FF 0%, #FFFFFF 60%)' }}
                >
                  <div style={{ fontSize: '10px', fontWeight: 900, color: '#2563EB', letterSpacing: '0.6px' }}>DITANGANI</div>
                  <div style={{ fontSize: '26px', fontWeight: 900, color: '#1D4ED8', marginTop: '4px', lineHeight: 1.1 }}>{diprosesCount}</div>
                  <div style={{ fontSize: '9.5px', color: '#1E40AF', fontWeight: 700, marginTop: '4px' }}>Unit Bergerak</div>
                </div>

                {/* Pengesahan Pawas */}
                <div
                  className="holographic-metric-tile"
                  onClick={() => openValidasiList('menunggu_pengesahan')}
                  style={{ cursor: 'pointer', textAlign: 'center', borderTop: '3.5px solid #7C3AED', background: 'linear-gradient(180deg, #F5F3FF 0%, #FFFFFF 60%)' }}
                >
                  <div style={{ fontSize: '10px', fontWeight: 900, color: '#7C3AED', letterSpacing: '0.6px' }}>PENGESAHAN</div>
                  <div style={{ fontSize: '26px', fontWeight: 900, color: '#7C3AED', marginTop: '4px', lineHeight: 1.1 }}>{pengesahanCount}</div>
                  <div style={{ fontSize: '9.5px', color: '#6D28D9', fontWeight: 700, marginTop: '4px' }}>Verifikasi BA</div>
                </div>

                {/* Selesai */}
                <div
                  className="holographic-metric-tile"
                  onClick={() => openValidasiList('selesai')}
                  style={{ cursor: 'pointer', textAlign: 'center', borderTop: '3.5px solid #16A34A', background: 'linear-gradient(180deg, #F0FDF4 0%, #FFFFFF 60%)' }}
                >
                  <div style={{ fontSize: '10px', fontWeight: 900, color: '#16A34A', letterSpacing: '0.6px' }}>SELESAI</div>
                  <div style={{ fontSize: '26px', fontWeight: 900, color: '#15803D', marginTop: '4px', lineHeight: 1.1 }}>{selesaiCount}</div>
                  <div style={{ fontSize: '9.5px', color: '#166534', fontWeight: 700, marginTop: '4px' }}>Tuntas 100%</div>
                </div>
              </div>

              {/* Breakdown 4 Saluran Platform dengan Vector Icons */}
              <div
                id="rekap-platform-breakdown"
                style={{
                  marginTop: '16px',
                  padding: '14px',
                  background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: '10px',
                  fontSize: '11px',
                }}
              >
                <div
                  style={{
                    background: 'white',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    borderRadius: '10px',
                    padding: '9px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(220, 38, 38, 0.05)',
                    transition: 'all 0.15s ease',
                  }}
                  onClick={() => openValidasiWithPlatform('sos')}
                  title="Klik untuk filter aduan SOS Panic"
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 800, color: '#DC2626' }}>
                    <Siren size={15} color="#DC2626" />
                    <span>SOS PANIC</span>
                  </span>
                  <span style={{ fontWeight: 900, color: '#DC2626', fontSize: '14px' }}>{sosCount}</span>
                </div>

                <div
                  style={{
                    background: 'white',
                    border: '1px solid rgba(2, 132, 199, 0.35)',
                    borderRadius: '10px',
                    padding: '9px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(2, 132, 199, 0.05)',
                    transition: 'all 0.15s ease',
                  }}
                  onClick={() => openValidasiWithPlatform('warga')}
                  title="Klik untuk filter aduan Aplikasi Warga"
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 800, color: '#0284C7' }}>
                    <Smartphone size={15} color="#0284C7" />
                    <span>WARGA</span>
                  </span>
                  <span style={{ fontWeight: 900, color: '#0284C7', fontSize: '14px' }}>{wargaCount}</span>
                </div>

                <div
                  style={{
                    background: 'white',
                    border: '1px solid rgba(29, 78, 216, 0.35)',
                    borderRadius: '10px',
                    padding: '9px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(29, 78, 216, 0.05)',
                    transition: 'all 0.15s ease',
                  }}
                  onClick={() => openValidasiWithPlatform('layanan110')}
                  title="Klik untuk filter aduan Panggilan 110 Hotline"
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 800, color: '#1D4ED8' }}>
                    <PhoneCall size={15} color="#1D4ED8" />
                    <span>110 HOTLINE</span>
                  </span>
                  <span style={{ fontWeight: 900, color: '#1D4ED8', fontSize: '14px' }}>{hotline110Count}</span>
                </div>

                <div
                  style={{
                    background: 'white',
                    border: '1px solid rgba(217, 119, 6, 0.35)',
                    borderRadius: '10px',
                    padding: '9px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(217, 119, 6, 0.05)',
                    transition: 'all 0.15s ease',
                  }}
                  onClick={() => openValidasiWithPlatform('personel')}
                  title="Klik untuk filter aduan Temuan Personel Lapangan"
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 800, color: '#92400E' }}>
                    <Users size={15} color="#92400E" />
                    <span>PERSONEL</span>
                  </span>
                  <span style={{ fontWeight: 900, color: '#92400E', fontSize: '14px' }}>{personelCount}</span>
                </div>
              </div>
            </div>
          )}

          {/* ── 4. COMPONENT: FEED KOMANDO & SITUASI LAPANGAN ── */}
          {!isFeedReady ? (
            /* Shimmer Skeleton for Feed Komando */
            <div
              className="cyber-skeleton"
              style={{
                height: '240px',
                borderRadius: '14px',
                marginBottom: '20px',
              }}
            />
          ) : (
            <div
              className="card-panel futuristic-card"
              style={{ padding: '20px', marginBottom: '20px', borderRadius: '16px' }}
            >
              {/* Header Feed Komando */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                  <div className="card-title" style={{ fontSize: '14px', fontWeight: 900, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '-0.2px', marginBottom: 0 }}>
                    <Radio size={16} color="#10B981" />
                    <span>FEED KOMANDO (REAL-TIME)</span>
                  </div>
                  <span style={{ fontSize: '10px', color: '#059669', fontWeight: 800, background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '2px 8px', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
                    <span className="pulse-live-dot" style={{ width: '6px', height: '6px' }} />
                    LIVE TELEMETRI
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
                  Pantauan eskalasi insiden darurat, panggilan 110, dan penanganan kasus
                </div>
              </div>

              <div className="timeline" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {allRecentComplaints.slice(0, 3).map((inc) => {
                  const timeStr = inc.createdAt ? new Date(inc.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB' : 'Hari ini';
                  const isSelesai = inc.status === 'SELESAI';
                  const isMeluncur = inc.status === 'DIPROSES' && Number(inc.tahap) === 3;
                  const isPenanganan = (inc.status === 'DIPROSES' && Number(inc.tahap) >= 4) || inc.status === 'MENUNGGU_PENGESAHAN';
                  const isDarurat = inc.urgensi === 'DARURAT' || inc.urgensi === 'PRIORITAS_TINGGI';

                  const borderColor = isSelesai ? '#10B981' : isMeluncur ? '#3B82F6' : isPenanganan ? '#8B5CF6' : isDarurat ? '#EF4444' : '#F59E0B';
                  const badgeBg = isSelesai ? '#F0FDF4' : isMeluncur ? '#EFF6FF' : isPenanganan ? '#F5F3FF' : isDarurat ? '#FEF2F2' : '#FFFBEB';
                  const badgeColor = isSelesai ? '#16A34A' : isMeluncur ? '#1D4ED8' : isPenanganan ? '#6D28D9' : isDarurat ? '#DC2626' : '#D97706';
                  const badgeBorder = isSelesai ? '#BBF7D0' : isMeluncur ? '#BFDBFE' : isPenanganan ? '#DDD6FE' : isDarurat ? '#FECACA' : '#FDE68A';

                  let badgeText = '⏳ MENUNGGU';
                  if (isSelesai) badgeText = `✓ TUNTAS ${inc.citizenRating ? `(⭐ ${inc.citizenRating}.0)` : ''}`;
                  else if (isMeluncur) badgeText = '⚡ MELUNCUR';
                  else if (isPenanganan) badgeText = '● TINDAKAN TKP';
                  else if (isDarurat) badgeText = '🚨 DARURAT';

                  let descText = inc.ringkasanKeterangan;
                  if (isSelesai) {
                    descText = inc.citizenReview || (inc.assignedOfficer ? `${inc.assignedOfficer.rankPangkat} ${inc.assignedOfficer.namaLengkap} telah menuntaskan penanganan dan menyerahkan laporan resmi.` : 'Kasus telah ditangani dan dinyatakan tuntas.');
                  } else if (isMeluncur) {
                    descText = `${inc.assignedOfficer?.assignedPatrolVehicle || 'Unit Samapta Presisi'} (${inc.assignedOfficer ? `${inc.assignedOfficer.rankPangkat} ${inc.assignedOfficer.namaLengkap}` : 'Personel'}) meluncur ke TKP. Estimasi tiba 3-5 menit.`;
                  } else if (isPenanganan) {
                    descText = `Personel berada di TKP melaksanakan tindakan kepolisian dan pengamanan perimeter.`;
                  }

                  return (
                    <div
                      key={inc.id}
                      className="tl-item"
                      style={{
                        borderLeft: `4px solid ${borderColor}`,
                        padding: '12px 14px',
                        background: '#F8FAFC',
                        borderRadius: '0 10px 10px 0',
                        border: '1px solid #E2E8F0',
                        borderLeftColor: borderColor,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                      }}
                    >
                      {/* Tier 1: Timestamp + Status Badge */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 800, color: '#0284C7' }}>
                          <Clock size={12} color="#0284C7" />
                          <span>{timeStr}</span>
                        </div>
                        <span
                          style={{
                            fontSize: '9.5px',
                            fontWeight: 800,
                            background: badgeBg,
                            color: badgeColor,
                            padding: '2.5px 8px',
                            borderRadius: '6px',
                            border: `1px solid ${badgeBorder}`,
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                          }}
                        >
                          {badgeText}
                        </span>
                      </div>

                      {/* Tier 2: Incident Title & TKP */}
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A', lineHeight: 1.35 }}>
                        <span>{inc.jenisKejadian}</span>
                        {inc.tkpAlamatTeks && (
                          <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#64748B', marginLeft: '6px' }}>
                            • {inc.tkpAlamatTeks.split(',')[0]}
                          </span>
                        )}
                      </div>

                      {/* Tier 3: Officer/Action Note */}
                      <div style={{ fontSize: '11.5px', color: '#475569', lineHeight: 1.45 }}>
                        {descText}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT COLUMN: EXECUTIVE COMMAND SIDEBAR ── */}
        <div id="beranda-col-right" style={{ minWidth: 0, width: '100%' }}>
          <div id="pimpinan-executive-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

            {/* ── 5. COMPONENT: SLA WAKTU TANGGAP PATROLI ── */}
            {!isSlaReady ? (
              /* Shimmer Skeleton for SLA */
              <div
                className="cyber-skeleton"
                style={{
                  height: '190px',
                  borderRadius: '16px',
                }}
              />
            ) : (
              <div
                id="card-pimpinan-sla"
                className="card-panel futuristic-card"
                onClick={() => setShowSlaModal(true)}
                style={{
                  padding: '18px',
                  cursor: 'pointer',
                  borderRadius: '16px',
                }}
                title="Klik untuk melihat audit rincian waktu tanggap seluruh kasus"
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                  <div className="card-title" style={{ marginBottom: 0, fontSize: '13px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '6px', color: '#0F172A' }}>
                    <Clock size={16} color="#0284C7" />
                    <span>WAKTU TANGGAP PATROLI</span>
                    <span style={{ fontSize: '9px', fontWeight: 800, color: '#0284C7', background: '#F0F9FF', border: '1px solid #BAE6FD', padding: '1px 6px', borderRadius: '10px' }}>
                      AUDIT
                    </span>
                  </div>
                  <span style={{ background: '#ECFDF5', color: '#059669', fontWeight: 800, fontSize: '9.5px', padding: '2px 8px', borderRadius: '6px', border: '1px solid #A7F3D0', whiteSpace: 'nowrap' }}>
                    TARGET &lt; 10 MENIT
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '14px' }}>
                  <div
                    style={{
                      width: '76px',
                      height: '76px',
                      position: 'relative',
                      flexShrink: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)',
                      borderRadius: '50%',
                      border: '4px solid #0284C7',
                      boxShadow: '0 4px 16px rgba(2, 132, 199, 0.25)',
                    }}
                  >
                    <span style={{ fontSize: '19px', fontWeight: 900, color: '#0F172A', lineHeight: 1 }}>{completedWithTime.length > 0 ? avgResponseTime : '-'}</span>
                    <span style={{ fontSize: '9px', color: '#0284C7', fontWeight: 800, marginTop: '2px' }}>{completedWithTime.length > 0 ? 'MENIT' : 'STANDBY'}</span>
                  </div>
                  <div>
                    <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#15803D', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <CheckCircle2 size={14} color="#15803D" />
                      <span>{completedWithTime.length > 0 ? `Tepat Waktu: ${onTimeRate}%` : 'Standar Respon Siaga SIMOPMAS 110'}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748B', lineHeight: 1.4, marginTop: '3px' }}>
                      {completedWithTime.length > 0 ? 'Rata-rata kecepatan tiba unit patroli di TKP sejak laporan diterima.' : 'Waktu respon tanggap dihitung otomatis saat kasus selesai ditangani.'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', background: '#F8FAFC', padding: '10px', borderRadius: '10px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                  <div>
                    <div style={{ fontSize: '9.5px', color: '#64748B', fontWeight: 800 }}>&lt; 5 Menit</div>
                    <div style={{ fontSize: '13px', fontWeight: 900, color: '#16A34A', marginTop: '2px' }}>
                      {fastCount} ({completedWithTime.length > 0 ? Math.round((fastCount / completedWithTime.length) * 100) : 0}%)
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '9.5px', color: '#64748B', fontWeight: 800 }}>5-10 Menit</div>
                    <div style={{ fontSize: '13px', fontWeight: 900, color: '#0284C7', marginTop: '2px' }}>
                      {mediumCount} ({completedWithTime.length > 0 ? Math.round((mediumCount / completedWithTime.length) * 100) : 0}%)
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '9.5px', color: '#64748B', fontWeight: 800 }}>&gt; 10 Menit</div>
                    <div style={{ fontSize: '13px', fontWeight: 900, color: '#DC2626', marginTop: '2px' }}>
                      {slowCount} ({completedWithTime.length > 0 ? Math.round((slowCount / completedWithTime.length) * 100) : 0}%)
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── 7. COMPONENT: INDEKS KEPUASAN MASYARAKAT (IKM) ── */}
            {!isIkmReady ? (
              /* Shimmer Skeleton for IKM */
              <div
                className="cyber-skeleton"
                style={{
                  height: '180px',
                  borderRadius: '16px',
                }}
              />
            ) : (
              <div
                id="card-pimpinan-ikm"
                className="card-panel futuristic-card"
                onClick={() => setShowIkmModal(true)}
                style={{
                  padding: '18px',
                  cursor: 'pointer',
                  borderRadius: '16px',
                }}
                title="Klik untuk melihat audit transparansi ulasan dan voting warga"
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div className="card-title" style={{ marginBottom: 0, fontSize: '13px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '7px', color: '#0F172A' }}>
                    <Award size={16} color="#F59E0B" />
                    <span>INDEKS KEPUASAN (IKM)</span>
                    <span style={{ fontSize: '9.5px', fontWeight: 800, color: '#D97706', background: '#FEF3C7', border: '1px solid #FDE68A', padding: '1px 6px', borderRadius: '10px' }}>
                      DETAIL
                    </span>
                  </div>
                  <span style={{ color: '#F59E0B', fontWeight: 800, fontSize: '11px', letterSpacing: '1px' }}>⭐⭐⭐⭐⭐</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '26px', fontWeight: 900, color: '#1E293B', lineHeight: 1 }}>
                      {satisfactionRating} <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>/ 5.0</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#16A34A', fontWeight: 800, marginTop: '3px' }}>
                      {satisfactionPercent}% Sangat Puas
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#0284C7' }}>
                      {allRecentComplaints.filter((c) => c.citizenRating).length} Ulasan
                    </div>
                    <div style={{ fontSize: '10px', color: '#64748B' }}>Survei Terverifikasi</div>
                  </div>
                </div>

                {(() => {
                  const topReview = allRecentComplaints.find((c) => c.citizenReview);
                  return topReview ? (
                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '11px', fontSize: '11.5px', color: '#475569', lineHeight: 1.4, fontStyle: 'italic' }}>
                      "{topReview.citizenReview}"
                      <div style={{ fontStyle: 'normal', fontWeight: 700, color: '#1E293B', marginTop: '5px', fontSize: '10.5px', textAlign: 'right' }}>
                        — {topReview.pelaporNama || 'Warga'} ({topReview.nomorTiket})
                      </div>
                    </div>
                  ) : (
                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '11px', fontSize: '11px', color: '#64748B', textAlign: 'center' }}>
                      Belum ada ulasan warga di database
                    </div>
                  );
                })()}
              </div>
            )}

            {/* ── 8. COMPONENT: LOG AKTIVITAS PERSONEL REAL-TIME ── */}
            {!isAktivitasReady ? (
              /* Shimmer Skeleton for Aktivitas */
              <div
                className="cyber-skeleton"
                style={{
                  height: '160px',
                  borderRadius: '16px',
                }}
              />
            ) : (
              <div
                className="card-panel futuristic-card"
                style={{ padding: '18px', borderRadius: '16px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div>
                    <div className="card-title" style={{ marginBottom: '2px', fontSize: '13px', fontWeight: 900, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '7px' }}>
                      <Activity size={16} color="#0284C7" />
                      <span>AKTIVITAS PERSONEL TERBARU</span>
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#64748B' }}>
                      Log pergerakan regu patroli di lapangan
                    </div>
                  </div>
                  <span style={{ background: '#F0F9FF', color: '#0284C7', fontWeight: 800, fontSize: '9.5px', padding: '3px 8px', borderRadius: '4px', border: '1px solid #BAE6FD' }}>
                    REAL-TIME
                  </span>
                </div>

                {dynamicActivities.length > 0 ? (
                  <div className="timeline" style={{ display: 'flex', flexDirection: 'column', gap: '9px', marginTop: '10px' }}>
                    {dynamicActivities.map((act, i) => (
                      <div key={i} style={{ fontSize: '11.5px', color: '#334155', borderLeft: `3px solid ${act.color}`, paddingLeft: '9px', lineHeight: 1.4 }}>
                        <strong>{act.time}</strong> - {act.text}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '14px', background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: '10px', textAlign: 'center', color: '#64748B', fontSize: '11px', marginTop: '10px' }}>
                    Belum ada log pergerakan regu patroli tercatat hari ini
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
