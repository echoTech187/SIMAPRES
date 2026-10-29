'use client';

import React from 'react';
import ModalDisposisiPawas from '../modals/ModalDisposisiPawas';
import ModalSuksesDisposisi from '../modals/ModalSuksesDisposisi';
import ModalDisposisiLintasWilayah from '../modals/ModalDisposisiLintasWilayah';
import ModalSlaMonitoring from '../modals/ModalSlaMonitoring';
import ModalKuatPers from '../modals/ModalKuatPers';
import ModalIkm from '../modals/ModalIkm';
import ModalCetakLaporan from '../modals/ModalCetakLaporan';
import ModalHotspotPawas from '../modals/ModalHotspotPawas';
import ModalTimePicker from '../modals/ModalTimePicker';
import ModalPresensiPulang from '../modals/ModalPresensiPulang';
import ModalKeamananPawas from '../modals/ModalKeamananPawas';
import ModalLightbox from '../modals/ModalLightbox';
import ModalTolakPengaduan from '../modals/ModalTolakPengaduan';
import { calculateDistanceHaversineKm, getSopRecommendationByIncident } from '@/lib/console/tactical-helpers';

export interface PawasModalsHostProps {
  session?: any;
  userProfile: any;
  loading: boolean;
  loadData: (force?: boolean) => Promise<void>;
  showFriendlyToast: (type: 'success' | 'warning' | 'error' | 'info', title: string, message: string, duration?: number) => void;
  // Disposisi
  showDisposisiModal: boolean;
  setShowDisposisiModal: (val: boolean) => void;
  selectedDisposisiItem: any;
  dbSubcategories: any[];
  daftarArmadaAktif: any[];
  selectedSatuanKeys: string[];
  toggleSatuanSelection: (key: string) => void;
  kuotaPersonel: number;
  setKuotaPersonel: (val: number) => void;
  arahanPawas: string;
  setArahanPawas: (val: string | ((prev: string) => string)) => void;
  tambahArahanCepatPawas: (text: string) => void;
  handleConfirmDisposisi: () => Promise<void>;
  activePreviewSatuanKey: string;
  // Sukses Disposisi
  showSuksesModal: boolean;
  setShowSuksesModal: (val: boolean) => void;
  suksesDisposisiData: any;
  // SLA
  showSlaModal: boolean;
  setShowSlaModal: (val: boolean) => void;
  avgResponseTime: string;
  onTimeRate: string;
  fastCount: number;
  mediumCount: number;
  slowCount: number;
  completedWithTime: any[];
  // Kuat Pers
  showKuatPersModal: boolean;
  setShowKuatPersModal: (val: boolean) => void;
  registeredUnits: any[];
  fleetUnits: any[];
  // IKM
  showIkmModal: boolean;
  setShowIkmModal: (val: boolean) => void;
  satisfactionRating: string;
  satisfactionPercent: string;
  allRecentComplaints: any[];
  // Cetak Laporan
  showCetakModal: boolean;
  setShowCetakModal: (val: boolean) => void;
  ikmStats: any;
  totalLaporan: number;
  stationRankings: any;
  operatorRankings: any;
  // Hotspot
  showHotspotModal: boolean;
  setShowHotspotModal: (val: boolean) => void;
  hotspots: any[];
  dbCategories: any[];
  // Time Picker
  showTimePickerModal: boolean;
  setShowTimePickerModal: (val: boolean) => void;
  setLogWaktuMulai: (val: string) => void;
  // Presensi Pulang
  showPresensiPulangModal: boolean;
  setShowPresensiPulangModal: (val: boolean) => void;
  handleKonfirmasiPulangFinal: () => void;
  // Keamanan
  showKeamananModal: boolean;
  setShowKeamananModal: (val: boolean) => void;
  pinOtorisasiPawas: string[];
  setPinOtorisasiPawas: React.Dispatch<React.SetStateAction<string[]>>;
  // Lightbox
  showLightboxModal: boolean;
  setShowLightboxModal: (val: boolean) => void;
  lightboxImg: { url: string; title: string; meta: string; desc: string };
  // Tolak
  showTolakModal: boolean;
  setShowTolakModal: (val: boolean) => void;
  tolakComplaint: any;
  handleConfirmRejectModal: (reason: string, notes: string) => Promise<void>;
  // Lintas Wilayah
  showLintasWilayahModal: boolean;
  setShowLintasWilayahModal: (val: boolean) => void;
  selectedLintasWilayahComplaint: any;
  setSelectedLintasWilayahComplaint: (val: any) => void;
  policeOffices: any[];
}

export default function PawasModalsHost({
  session,
  userProfile,
  loading,
  loadData,
  showFriendlyToast,
  showDisposisiModal,
  setShowDisposisiModal,
  selectedDisposisiItem,
  dbSubcategories,
  daftarArmadaAktif,
  selectedSatuanKeys,
  toggleSatuanSelection,
  kuotaPersonel,
  setKuotaPersonel,
  arahanPawas,
  setArahanPawas,
  tambahArahanCepatPawas,
  handleConfirmDisposisi,
  activePreviewSatuanKey,
  showSuksesModal,
  setShowSuksesModal,
  suksesDisposisiData,
  showSlaModal,
  setShowSlaModal,
  avgResponseTime,
  onTimeRate,
  fastCount,
  mediumCount,
  slowCount,
  completedWithTime,
  showKuatPersModal,
  setShowKuatPersModal,
  registeredUnits,
  fleetUnits,
  showIkmModal,
  setShowIkmModal,
  satisfactionRating,
  satisfactionPercent,
  allRecentComplaints,
  showCetakModal,
  setShowCetakModal,
  ikmStats,
  totalLaporan,
  stationRankings,
  operatorRankings,
  showHotspotModal,
  setShowHotspotModal,
  hotspots,
  dbCategories,
  showTimePickerModal,
  setShowTimePickerModal,
  setLogWaktuMulai,
  showPresensiPulangModal,
  setShowPresensiPulangModal,
  handleKonfirmasiPulangFinal,
  showKeamananModal,
  setShowKeamananModal,
  pinOtorisasiPawas,
  setPinOtorisasiPawas,
  showLightboxModal,
  setShowLightboxModal,
  lightboxImg,
  showTolakModal,
  setShowTolakModal,
  tolakComplaint,
  handleConfirmRejectModal,
  showLintasWilayahModal,
  setShowLintasWilayahModal,
  selectedLintasWilayahComplaint,
  setSelectedLintasWilayahComplaint,
  policeOffices,
}: PawasModalsHostProps) {
  return (
    <>
      <ModalDisposisiPawas
        isOpen={showDisposisiModal}
        onClose={() => setShowDisposisiModal(false)}
        selectedItem={selectedDisposisiItem}
        dbSubcategories={dbSubcategories}
        daftarArmadaAktif={daftarArmadaAktif}
        selectedSatuanKeys={selectedSatuanKeys}
        toggleSatuanSelection={toggleSatuanSelection}
        kuotaPersonel={kuotaPersonel}
        setKuotaPersonel={setKuotaPersonel}
        arahanPawas={arahanPawas}
        setArahanPawas={setArahanPawas}
        tambahArahanCepatPawas={tambahArahanCepatPawas}
        handleConfirmDisposisi={handleConfirmDisposisi}
        loading={loading}
        getSopRecommendationByIncident={getSopRecommendationByIncident}
        calculateDistanceHaversineKm={calculateDistanceHaversineKm}
        activePreviewSatuanKey={activePreviewSatuanKey}
      />

      <ModalSuksesDisposisi
        isOpen={showSuksesModal}
        onClose={() => setShowSuksesModal(false)}
        data={suksesDisposisiData}
      />

      <ModalSlaMonitoring
        isOpen={showSlaModal}
        onClose={() => setShowSlaModal(false)}
        avgResponseTime={Number(avgResponseTime) || 0}
        onTimeRate={Number(onTimeRate) || 0}
        fastCount={fastCount}
        mediumCount={mediumCount}
        slowCount={slowCount}
        complaints={completedWithTime}
      />

      <ModalKuatPers
        isOpen={showKuatPersModal}
        onClose={() => setShowKuatPersModal(false)}
        registeredUnits={registeredUnits}
        fleetUnits={fleetUnits}
      />

      <ModalIkm
        isOpen={showIkmModal}
        onClose={() => setShowIkmModal(false)}
        satisfactionRating={Number(satisfactionRating) || 0}
        satisfactionPercent={Number(satisfactionPercent) || 0}
        complaints={allRecentComplaints}
      />

      <ModalCetakLaporan
        isOpen={showCetakModal}
        onClose={() => setShowCetakModal(false)}
        registeredUnits={registeredUnits}
        fleetUnits={fleetUnits}
        ikmStats={ikmStats}
        totalLaporan={totalLaporan}
        userProfile={userProfile}
        stationRankings={stationRankings}
        operatorRankings={operatorRankings}
      />

      <ModalHotspotPawas
        isOpen={showHotspotModal}
        onClose={() => setShowHotspotModal(false)}
        hotspots={hotspots}
        dbCategories={dbCategories}
        loadData={loadData}
        showFriendlyToast={showFriendlyToast}
      />

      <ModalTimePicker
        isOpen={showTimePickerModal}
        onClose={() => setShowTimePickerModal(false)}
        onSelectTimeRange={(range: string) => {
          setLogWaktuMulai(range);
          setShowTimePickerModal(false);
        }}
      />

      <ModalPresensiPulang
        isOpen={showPresensiPulangModal}
        onClose={() => setShowPresensiPulangModal(false)}
        onConfirmPulang={handleKonfirmasiPulangFinal}
      />

      <ModalKeamananPawas
        isOpen={showKeamananModal}
        onClose={() => setShowKeamananModal(false)}
        session={session}
        pinOtorisasiPawas={pinOtorisasiPawas}
        setPinOtorisasiPawas={setPinOtorisasiPawas}
        showFriendlyToast={showFriendlyToast}
      />

      <ModalLightbox
        isOpen={showLightboxModal}
        onClose={() => setShowLightboxModal(false)}
        lightboxImg={lightboxImg}
      />

      <ModalTolakPengaduan
        isOpen={showTolakModal}
        onClose={() => setShowTolakModal(false)}
        complaint={tolakComplaint}
        onConfirmReject={handleConfirmRejectModal}
        loading={loading}
      />

      {showLintasWilayahModal && selectedLintasWilayahComplaint && (
        <ModalDisposisiLintasWilayah
          complaint={selectedLintasWilayahComplaint}
          policeOffices={policeOffices}
          allComplaints={allRecentComplaints}
          currentStationId={userProfile?.stationId || session?.stationId}
          currentStationName={userProfile?.stationName || session?.stationName}
          onClose={() => {
            setShowLintasWilayahModal(false);
            setSelectedLintasWilayahComplaint(null);
          }}
          onSuccess={() => {
            setShowLintasWilayahModal(false);
            setSelectedLintasWilayahComplaint(null);
            loadData();
          }}
        />
      )}
    </>
  );
}
