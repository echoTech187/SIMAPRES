'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { PawasTab, PresensiStatusType } from '../types';
import CockpitCommandBar from '../components/CockpitCommandBar';
import FleetTelemetrySection from '../components/FleetTelemetrySection';
import OperationalSummarySection from '../components/OperationalSummarySection';
import IncidentFeedSection from '../components/IncidentFeedSection';
import SlaGaugeCard from '../components/SlaGaugeCard';
import IkmSatisfactionCard from '../components/IkmSatisfactionCard';
import RecentActivitiesCard from '../components/RecentActivitiesCard';

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
  openValidasiList,
  openValidasiWithPlatform,
  setShowHotspotModal,
  setShowSlaModal,
  setShowIkmModal,
  fleetUnits,
  hotspots,
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
  satisfactionRating,
  satisfactionPercent,
  recentActivities = [],
}: TabBerandaPawasProps) {
  // Dynamic Real-time Activities derived from Database (OfficerLogbooks or Real Complaints Timeline)
  const dynamicActivities = useMemo(() => {
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

    if (Array.isArray(allRecentComplaints) && allRecentComplaints.length > 0) {
      return allRecentComplaints.slice(0, 4).map((c: any) => {
        const timeStr = c.created_at || c.createdAt
          ? new Date(c.created_at || c.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'
          : '-';
        const unitStr = c.assignedOfficer?.unitName || c.assignedUnitNama || 'Regu SIMOPMAS 110';
        const statusLabel =
          c.status === 'SELESAI'
            ? 'Penanganan Selesai'
            : c.status === 'DIPROSES'
            ? 'Meluncur / Tiba di TKP'
            : 'Menerima Laporan';
        const text = `${unitStr}: [${c.nomorTiket || '110'}] ${statusLabel} untuk ${c.jenisKejadian || 'Aduan Warga'} di ${c.tkpAlamatTeks || 'TKP'}.`;
        const color = c.status === 'SELESAI' ? '#10B981' : c.status === 'DIPROSES' ? '#0284C7' : '#F59E0B';
        return { time: timeStr, text, color };
      });
    }

    return [];
  }, [recentActivities, allRecentComplaints]);

  // ── GRANULAR COMPONENT-LEVEL LOADING STATES ──
  const [isFleetReady, setIsFleetReady] = useState(false);
  const [isRekapReady, setIsRekapReady] = useState(false);
  const [isFeedReady, setIsFeedReady] = useState(false);
  const [isSlaReady, setIsSlaReady] = useState(false);
  const [isIkmReady, setIsIkmReady] = useState(false);
  const [isAktivitasReady, setIsAktivitasReady] = useState(false);

  useEffect(() => {
    if (isServerDataLoaded && Array.isArray(fleetUnits) && Array.isArray(hotspots)) {
      const timer = setTimeout(() => setIsFleetReady(true), 250);
      return () => clearTimeout(timer);
    }
  }, [isServerDataLoaded, fleetUnits, hotspots]);

  useEffect(() => {
    if (isServerDataLoaded && typeof totalLaporan === 'number' && typeof menungguCount === 'number') {
      const timer = setTimeout(() => setIsRekapReady(true), 280);
      return () => clearTimeout(timer);
    }
  }, [isServerDataLoaded, totalLaporan, menungguCount]);

  useEffect(() => {
    if (isServerDataLoaded && Array.isArray(allRecentComplaints)) {
      const timer = setTimeout(() => setIsFeedReady(true), 320);
      return () => clearTimeout(timer);
    }
  }, [isServerDataLoaded, allRecentComplaints]);

  useEffect(() => {
    if (isServerDataLoaded && Array.isArray(completedWithTime) && avgResponseTime !== undefined) {
      const timer = setTimeout(() => setIsSlaReady(true), 300);
      return () => clearTimeout(timer);
    }
  }, [isServerDataLoaded, completedWithTime, avgResponseTime]);

  useEffect(() => {
    if (isServerDataLoaded && satisfactionRating !== undefined) {
      const timer = setTimeout(() => setIsIkmReady(true), 360);
      return () => clearTimeout(timer);
    }
  }, [isServerDataLoaded, satisfactionRating]);

  useEffect(() => {
    if (isServerDataLoaded) {
      const timer = setTimeout(() => setIsAktivitasReady(true), 380);
      return () => clearTimeout(timer);
    }
  }, [isServerDataLoaded]);

  return (
    <div style={{ width: '100%', maxWidth: '1440px', margin: '0 auto', paddingBottom: '30px' }}>
      {/* ── TOP HERO: COMPACT TACTICAL COMMAND BAR ── */}
      <CockpitCommandBar
        userProfile={userProfile}
        presensiStatus={presensiStatus}
        onOpenCad={() => switchTab('view-operator')}
      />

      {/* ── 2-COLUMN RESPONSIVE GRID LAYOUT ── */}
      <div className="beranda-grid-responsive">
        {/* ── LEFT COLUMN ── */}
        <div id="beranda-col-left" style={{ minWidth: 0, width: '100%' }}>
          {/* 1. PUSAT TELEMETRI ARMADA & KESIAPAN PATROLI */}
          <FleetTelemetrySection
            isReady={isFleetReady}
            fleetUnits={fleetUnits}
            hotspots={hotspots}
            onOpenMap={() => switchTab('view-peta')}
            onOpenHotspotModal={() => setShowHotspotModal(true)}
          />

          {/* 2. REKAPITULASI HARI INI & PLATFORM BREAKDOWN */}
          <OperationalSummarySection
            isReady={isRekapReady}
            totalLaporan={totalLaporan}
            menungguCount={menungguCount}
            ditolakCount={ditolakCount}
            diprosesCount={diprosesCount}
            pengesahanCount={pengesahanCount}
            selesaiCount={selesaiCount}
            sosCount={sosCount}
            wargaCount={wargaCount}
            hotline110Count={hotline110Count}
            personelCount={personelCount}
            onFilterStatus={openValidasiList}
            onFilterPlatform={openValidasiWithPlatform}
          />

          {/* 3. FEED KOMANDO & SITUASI LAPANGAN */}
          <IncidentFeedSection
            isReady={isFeedReady}
            complaints={allRecentComplaints}
          />
        </div>

        {/* ── RIGHT COLUMN: EXECUTIVE COMMAND SIDEBAR ── */}
        <div id="beranda-col-right" style={{ minWidth: 0, width: '100%' }}>
          <div id="pimpinan-executive-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* 4. SLA WAKTU TANGGAP PATROLI */}
            <SlaGaugeCard
              isReady={isSlaReady}
              completedWithTime={completedWithTime}
              avgResponseTime={avgResponseTime}
              onTimeRate={onTimeRate}
              fastCount={fastCount}
              mediumCount={mediumCount}
              slowCount={slowCount}
              onClick={() => setShowSlaModal(true)}
            />

            {/* 5. INDEKS KEPUASAN MASYARAKAT (IKM) */}
            <IkmSatisfactionCard
              isReady={isIkmReady}
              satisfactionRating={satisfactionRating}
              satisfactionPercent={satisfactionPercent}
              complaints={allRecentComplaints}
              onClick={() => setShowIkmModal(true)}
            />

            {/* 6. LOG AKTIVITAS PERSONEL REAL-TIME */}
            <RecentActivitiesCard
              isReady={isAktivitasReady}
              activities={dynamicActivities}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
