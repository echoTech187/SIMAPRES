'use client';

import { useState, useCallback } from 'react';

/**
 * usePawasModals
 * Single-responsibility hook managing modal state and dialog lifecycles for Pawas Console.
 * Decouples modal state from business logic, preventing large class and state soup smells.
 */
export function usePawasModals() {
  // Disposisi Modal State
  const [showDisposisiModal, setShowDisposisiModal] = useState(false);
  const [selectedDisposisiItem, setSelectedDisposisiItem] = useState<any | null>(null);
  const [selectedSatuanKeys, setSelectedSatuanKeys] = useState<string[]>([]);
  const [activePreviewSatuanKey, setActivePreviewSatuanKey] = useState<string>('');
  const [showEditPersonel, setShowEditPersonel] = useState(false);
  const [customPersonelNama, setCustomPersonelNama] = useState('');
  const [kuotaPersonel, setKuotaPersonel] = useState(4);
  const [arahanPawas, setArahanPawas] = useState('');
  const [disposisiFormErrors, setDisposisiFormErrors] = useState<Record<string, string>>({});

  // Sukses Disposisi Modal State
  const [showSuksesModal, setShowSuksesModal] = useState(false);
  const [suksesDisposisiData, setSuksesDisposisiData] = useState<any | null>(null);

  // General Dialogs
  const [showSlaModal, setShowSlaModal] = useState(false);
  const [showKuatPersModal, setShowKuatPersModal] = useState(false);
  const [showIkmModal, setShowIkmModal] = useState(false);
  const [showCetakModal, setShowCetakModal] = useState(false);
  const [showPresensiPulangModal, setShowPresensiPulangModal] = useState(false);
  const [showKeamananModal, setShowKeamananModal] = useState(false);
  const [pinOtorisasiPawas, setPinOtorisasiPawas] = useState<string[]>(['', '', '', '', '', '']);
  const [showTimePickerModal, setShowTimePickerModal] = useState(false);
  const [showLightboxModal, setShowLightboxModal] = useState(false);
  const [lightboxImg, setLightboxImg] = useState({ url: '', title: '', meta: '', desc: '' });
  const [showHotspotModal, setShowHotspotModal] = useState(false);

  // Penolakan & Lintas Wilayah Dialogs
  const [tolakComplaint, setTolakComplaint] = useState<any | null>(null);
  const [showTolakModal, setShowTolakModal] = useState<boolean>(false);
  const [tolakKategori, setTolakKategori] = useState('');
  const [tolakAlasan, setTolakAlasan] = useState('');
  const [showLintasWilayahModal, setShowLintasWilayahModal] = useState(false);
  const [selectedLintasWilayahComplaint, setSelectedLintasWilayahComplaint] = useState<any | null>(null);

  const bukaModalTolak = useCallback((complaint: any) => {
    setTolakComplaint(complaint);
    setShowTolakModal(true);
  }, []);

  return {
    // Disposisi
    showDisposisiModal,
    setShowDisposisiModal,
    selectedDisposisiItem,
    setSelectedDisposisiItem,
    selectedSatuanKeys,
    setSelectedSatuanKeys,
    activePreviewSatuanKey,
    setActivePreviewSatuanKey,
    showEditPersonel,
    setShowEditPersonel,
    customPersonelNama,
    setCustomPersonelNama,
    kuotaPersonel,
    setKuotaPersonel,
    arahanPawas,
    setArahanPawas,
    disposisiFormErrors,
    setDisposisiFormErrors,
    // Sukses Disposisi
    showSuksesModal,
    setShowSuksesModal,
    suksesDisposisiData,
    setSuksesDisposisiData,
    // General Dialogs
    showSlaModal,
    setShowSlaModal,
    showKuatPersModal,
    setShowKuatPersModal,
    showIkmModal,
    setShowIkmModal,
    showCetakModal,
    setShowCetakModal,
    showPresensiPulangModal,
    setShowPresensiPulangModal,
    showKeamananModal,
    setShowKeamananModal,
    pinOtorisasiPawas,
    setPinOtorisasiPawas,
    showTimePickerModal,
    setShowTimePickerModal,
    showLightboxModal,
    setShowLightboxModal,
    lightboxImg,
    setLightboxImg,
    showHotspotModal,
    setShowHotspotModal,
    // Penolakan & Lintas Wilayah
    tolakComplaint,
    setTolakComplaint,
    showTolakModal,
    setShowTolakModal,
    tolakKategori,
    setTolakKategori,
    tolakAlasan,
    setTolakAlasan,
    bukaModalTolak,
    showLintasWilayahModal,
    setShowLintasWilayahModal,
    selectedLintasWilayahComplaint,
    setSelectedLintasWilayahComplaint,
  };
}
