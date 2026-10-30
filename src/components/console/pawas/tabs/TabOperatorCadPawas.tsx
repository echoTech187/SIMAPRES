'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import Select2CategoryDropdown from '@/components/ui/Select2CategoryDropdown';
import {
  createComplaintAction,
  createComplaintAndBroadcastAction,
  createComplaintAndResolveAtOperatorDeskAction,
  resolveQueuedComplaintAtOperatorDeskAction,
  sendWhatsAppNotificationAction,
  transferComplaintCrossJurisdictionAction,
} from '@/app/actions/complaint.actions';
import { PawasTab } from '../types';
import { isGenericOrCoordinateAddress, resolveSektorWilayah } from '@/infrastructure/services/reverse-geocode.service';
import { evaluateJurisdictionBoundary } from '@/lib/jurisdiction-boundary';
import { getCrossJurisdictionTimeoutMs } from '@/lib/escalation-config';

const MiniMapPicker = dynamic(() => import('@/components/maps/MiniMapPicker'), {
  ssr: false,
  loading: () => <div style={{ height: '220px', background: '#E2E8F0' }} />,
});

export { getLastDispatchedStationName, getLastDispatchedStationId } from '../cad/cad-helpers';
import {
  CadAntreanColumn,
  CadBroadcastModal,
  CadTransferModal,
  CadDeskResolveModal,
} from '../cad';

export interface TabOperatorCadPawasProps {
  switchTab: (tab: PawasTab) => void;
  userProfile: any;
  simCaller: any;
  setSimCaller: React.Dispatch<React.SetStateAction<any>>;
  cadFormErrors: Record<string, string>;
  setCadFormErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  dbSubcategories: any[];
  dbUrgencyLevels: any[];
  cadLocationSuggestions: any[];
  showCadSuggestions: boolean;
  setShowCadSuggestions: (show: boolean) => void;
  isSearchingCadLocation: boolean;
  handleCadLocationSearch: (q: string) => void;
  handleSelectCadSuggestion: (item: any) => void;
  validateCadForm: () => Record<string, string>;
  loading: boolean;
  setLoading: (l: boolean) => void;
  showFriendlyToast: (type: 'success' | 'warning' | 'error' | 'info', title: string, message: string) => void;
  bukaModalDisposisi: (item: any) => void;
  loadData: () => Promise<void>;
  session?: any;
  antreanPawas: any[];
  bukaModalTolak?: (item: any) => void;
  setTolakComplaint?: (item: any) => void;
  policeOffices?: any[];
  escalationBanner?: React.ReactNode;
  onOpenDisposisiLintasWilayah?: (item: any) => void;
}

export default function TabOperatorCadPawas({
  switchTab,
  userProfile,
  simCaller,
  setSimCaller,
  cadFormErrors,
  setCadFormErrors,
  dbSubcategories,
  dbUrgencyLevels,
  cadLocationSuggestions,
  showCadSuggestions,
  setShowCadSuggestions,
  isSearchingCadLocation,
  handleCadLocationSearch,
  handleSelectCadSuggestion,
  validateCadForm,
  loading,
  setLoading,
  showFriendlyToast,
  bukaModalDisposisi,
  loadData,
  session,
  antreanPawas,
  bukaModalTolak,
  setTolakComplaint,
  policeOffices = [],
  escalationBanner,
  onOpenDisposisiLintasWilayah,
}: TabOperatorCadPawasProps) {
  const [broadcastModalData, setBroadcastModalData] = useState<any | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [showMapPickerCad, setShowMapPickerCad] = useState(false);
  const [isSendingWa, setIsSendingWa] = useState(false);
  const [waSendResult, setWaSendResult] = useState<{ success?: boolean; text?: string } | null>(null);
  const [transferModalItem, setTransferModalItem] = useState<{ item: any; boundary: any } | null>(null);
  const [isTransferring, setIsTransferring] = useState(false);
  const [deskResolveModalData, setDeskResolveModalData] = useState<{
    isFromCadForm: boolean;
    item?: any;
    nomorTiket: string;
    namaPelapor: string;
    teleponPelapor: string;
    jenisKejadian: string;
    alamatTkp: string;
    resolutionNotes: string;
    sendWa: boolean;
  } | null>(null);
  const [isResolvingDesk, setIsResolvingDesk] = useState(false);

  // Resolusi Mako Kepolisian aktif untuk penempatan alamat otomatis (Informasi / Konsultasi)
  const resolvedMakoOffice = React.useMemo(() => {
    if (policeOffices && policeOffices.length > 0) {
      const userStationId = userProfile?.stationId || userProfile?.station_id || session?.stationId || session?.station_id;
      if (userStationId) {
        const found = policeOffices.find((p: any) => String(p.id) === String(userStationId));
        if (found) return found;
      }
      const userStationName = userProfile?.stationName || userProfile?.satuanNama || session?.stationName || session?.satuanNama;
      if (userStationName) {
        const found = policeOffices.find(
          (p: any) =>
            (p.name && p.name.toLowerCase().includes(userStationName.toLowerCase())) ||
            (userStationName && userStationName.toLowerCase().includes(p.name?.toLowerCase()))
        );
        if (found) return found;
      }
      const polres = policeOffices.find((p: any) => p.type === 'POLRES' || p.code?.includes('POLRES') || p.name?.toLowerCase().includes('polres')) || policeOffices[0];
      return polres || null;
    }
    return null;
  }, [policeOffices, userProfile, session]);

  const defaultMakoName = resolvedMakoOffice?.name || 'Mako SPKT Layanan 110';
  const defaultMakoAddress = resolvedMakoOffice?.address
    ? (resolvedMakoOffice.address.includes(resolvedMakoOffice.name) ? resolvedMakoOffice.address : `${resolvedMakoOffice.name}, ${resolvedMakoOffice.address}`)
    : 'Mako SPKT Layanan Kepolisian 110';
  const defaultMakoLat = resolvedMakoOffice?.lat ? Number(resolvedMakoOffice.lat) : 0;
  const defaultMakoLng = resolvedMakoOffice?.lng ? Number(resolvedMakoOffice.lng) : 0;

  // Deteksi apakah kategori aktif berjenis Informasi / Konsultasi
  const isCurrentCategoryConsultation = React.useMemo(() => {
    if (!simCaller.subcategoryId && !simCaller.kategoriKey) return false;
    if (simCaller.kategoriKey === 'INFORMASIKONSULTASI' || simCaller.kategoriKey === 'PELAYANAN_PUBLIK') return true;
    const matchedSub = (dbSubcategories || []).find((s: any) => String(s.id) === String(simCaller.subcategoryId));
    if (!matchedSub) return false;
    return Boolean(
      matchedSub.category_key === 'INFORMASIKONSULTASI' ||
      matchedSub.category_key === 'PELAYANAN_PUBLIK' ||
      matchedSub.category_rel?.key === 'INFORMASIKONSULTASI' ||
      (matchedSub.category_rel?.label && matchedSub.category_rel.label.toLowerCase().includes('informasi')) ||
      (matchedSub.category_rel?.label && matchedSub.category_rel.label.toLowerCase().includes('konsultasi')) ||
      (matchedSub.category_key && matchedSub.category_key.toUpperCase().includes('INFORMASI')) ||
      (matchedSub.category_key && matchedSub.category_key.toUpperCase().includes('KONSULTASI'))
    );
  }, [simCaller.subcategoryId, simCaller.kategoriKey, dbSubcategories]);

  // Efek otomatis mengisi alamat Mako & ringkasan konsultasi jika kategori INFORMASIKONSULTASI terpilih
  useEffect(() => {
    if (!simCaller.subcategoryId) return;
    const matchedSub = (dbSubcategories || []).find((s: any) => String(s.id) === String(simCaller.subcategoryId));
    if (!matchedSub) return;

    const isInfoKonsultasi = Boolean(
      matchedSub.category_key === 'INFORMASIKONSULTASI' ||
      matchedSub.category_key === 'PELAYANAN_PUBLIK' ||
      matchedSub.category_rel?.key === 'INFORMASIKONSULTASI' ||
      (matchedSub.category_rel?.label && matchedSub.category_rel.label.toLowerCase().includes('informasi')) ||
      (matchedSub.category_rel?.label && matchedSub.category_rel.label.toLowerCase().includes('konsultasi')) ||
      (matchedSub.category_key && matchedSub.category_key.toUpperCase().includes('INFORMASI')) ||
      (matchedSub.category_key && matchedSub.category_key.toUpperCase().includes('KONSULTASI'))
    );

    if (isInfoKonsultasi) {
      const needsAlamat = !simCaller.alamat || simCaller.alamat.trim() === '';
      const needsUraian = !simCaller.uraian || simCaller.uraian.trim() === '';
      if (needsAlamat || needsUraian) {
        setSimCaller((prev: any) => ({
          ...prev,
          alamat: needsAlamat ? defaultMakoAddress : prev.alamat,
          lat: needsAlamat ? defaultMakoLat : prev.lat,
          lng: needsAlamat ? defaultMakoLng : prev.lng,
          uraian: needsUraian
            ? `Pelapor menghubungi Call Center 110 untuk berkonsultasi mengenai ${matchedSub.nama_kasus}. Petugas operator SPKT 110 telah memberikan penjelasan mengenai persyaratan resmi, estimasi biaya PNBP, dan alur prosedur penanganan sesuai standar operasional kepolisian.`
            : prev.uraian,
          urgensi: prev.urgensi || 'NORMAL',
        }));
        setCadFormErrors((errs: any) => {
          const next = { ...errs };
          if (needsAlamat) delete next.alamat;
          if (needsUraian) delete next.uraian;
          delete next.urgensi;
          return next;
        });
      }
    }
  }, [simCaller.subcategoryId, dbSubcategories, defaultMakoAddress, defaultMakoLat, defaultMakoLng]);

  const handleExecuteTransfer = async () => {
    if (!transferModalItem) return;
    setIsTransferring(true);
    try {
      const { item, boundary } = transferModalItem;
      const target = boundary.targetStation || { id: 210001, stationName: 'Polresta Batang' };
      const res = await transferComplaintCrossJurisdictionAction({
        complaintId: String(item.id),
        targetStationId: target.id,
        targetStationName: target.stationName,
        transferReason: boundary.reason,
        actorName: userProfile?.fullName || session?.fullName || 'Operator CAD 110',
      });
      if (res.success) {
        showFriendlyToast(
          'success',
          'Disposisi Lintas Wilayah Berhasil',
          `Tiket ${item.nomorTiket} telah dialihkan ke ${target.stationName}. Status pelacakan warga otomatis terkoordinasi.`
        );
        setTransferModalItem(null);
        await loadData();
      } else {
        showFriendlyToast('error', 'Gagal Mengalihkan Laporan', res.error || 'Terjadi kendala saat mengalihkan laporan.');
      }
    } catch (err: any) {
      showFriendlyToast('error', 'Kendala Sistem', err.message || 'Sistem tidak dapat memproses saat ini.');
    } finally {
      setIsTransferring(false);
    }
  };

  const handleExecuteDeskResolution = async () => {
    if (!deskResolveModalData) return;
    const notes = deskResolveModalData.resolutionNotes.trim();
    if (!notes) {
      showFriendlyToast('warning', 'Catatan Wajib Diisi', 'Mohon isi catatan petunjuk SOP / solusi yang telah diberikan kepada warga.');
      return;
    }

    setIsResolvingDesk(true);
    try {
      if (deskResolveModalData.isFromCadForm) {
        const res = await createComplaintAndResolveAtOperatorDeskAction({
          nomorTiket: simCaller.nomorTiket?.trim() || undefined,
          namaPelapor: simCaller.nama,
          noHpPelapor: simCaller.telepon,
          kategoriLaporan: simCaller.kategori,
          kategoriKey: (simCaller as any).kategoriKey || undefined,
          subcategoryId: simCaller.subcategoryId,
          platformKey: 'layanan110',
          urgensi: (simCaller as any).urgensi || 'SEDANG',
          tkpAlamatTeks: simCaller.alamat,
          tkpLat: simCaller.lat,
          tkpLng: simCaller.lng,
          deskripsiKejadian: simCaller.uraian,
          saluranLaporan: 'CALL_110',
          operatorId: session?.userId ? String(session.userId) : null,
          resolutionNotes: notes,
          sendWhatsAppConfirmation: deskResolveModalData.sendWa,
        });

        if (res.success && res.data) {
          showFriendlyToast(
            'success',
            'Pengaduan Selesai',
            `Tiket ${res.data.nomorTiket || res.data.id} berhasil dituntaskan langsung di Meja Operator 110.`
          );
          setSimCaller({
            nomorTiket: '',
            nama: '',
            telepon: '',
            alamat: '',
            kategori: '',
            kategoriKey: '',
            subcategoryId: undefined,
            urgensi: '',
            uraian: '',
            lat: 0,
            lng: 0,
          });
          setDeskResolveModalData(null);
          await loadData();
        } else {
          showFriendlyToast('error', 'Gagal Memproses Laporan', res.error || 'Terjadi kendala saat menyelesaikan laporan.');
        }
      } else {
        const res = await resolveQueuedComplaintAtOperatorDeskAction({
          complaintId: String(deskResolveModalData.item.id),
          resolutionNotes: notes,
          sendWhatsAppConfirmation: deskResolveModalData.sendWa,
        });

        if (res.success) {
          showFriendlyToast(
            'success',
            'Pengaduan Selesai',
            `Tiket ${deskResolveModalData.nomorTiket} berhasil dituntaskan langsung di Meja Operator 110.`
          );
          setDeskResolveModalData(null);
          await loadData();
        } else {
          showFriendlyToast('error', 'Gagal Memproses Laporan', res.error || 'Terjadi kendala saat menyelesaikan laporan.');
        }
      }
    } catch (err: any) {
      showFriendlyToast('error', 'Terjadi Kendala Sistem', err.message || 'Sistem tidak dapat memproses laporan saat ini.');
    } finally {
      setIsResolvingDesk(false);
    }
  };

  // Lock body scroll and trigger map canvas resize when fullscreen map opens
  useEffect(() => {
    if (showMapPickerCad) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      const resizeTimer = setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 150);
      return () => {
        document.body.style.overflow = prevOverflow;
        clearTimeout(resizeTimer);
      };
    }
  }, [showMapPickerCad]);

  return (
    <div style={{ width: '100%', maxWidth: '1440px', margin: '0 auto' }}>
      <div style={{ marginBottom: '16px' }}>
        <h2 className="page-title" style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>
          Konsol Pengaduan &amp; Disposisi Terpadu
        </h2>
        <div style={{ color: '#64748B', fontSize: '12px', marginTop: '2px' }}>
          Perekaman Laporan Masyarakat Masuk &amp; Penugasan Unit Patroli
        </div>
      </div>

      {/* Banner Alarm Eskalasi (Posisinya dibalik: diletakkan tepat di bawah judul konsol) */}
      {escalationBanner}

      <div className="cad-operator-grid">
        {/* Kolom Kiri: Panggilan Masuk & Form */}
        <div style={{ width: '100%', minWidth: 0 }}>

          {/* Formulir Penerimaan Laporan */}
          <div id="cad-form-container" style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px', borderBottom: '1px solid #E2E8F0', paddingBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#153E75' }}>📝 Formulir Penerimaan Laporan</span>
              <span style={{ fontSize: '11px', color: '#64748B' }}>Petugas: <strong>{userProfile?.fullName || userProfile?.nama}</strong></span>
            </div>

            {/* Banner Pintasan Panduan SOP & Layanan */}
            <div
              style={{
                background: '#F0F9FF',
                border: '1px solid #BAE6FD',
                borderRadius: '8px',
                padding: '8px 12px',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                fontSize: '11.5px',
                color: '#0369A1',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>💡</span>
                <span>Warga hanya menanyakan info SIM, STNK, SKCK, atau Cyber? Tidak perlu input tiket aduan.</span>
              </div>
              <button
                type="button"
                onClick={() => switchTab('view-panduan')}
                style={{
                  background: '#0284C7',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                Buka Buku Pintar SOP →
              </button>
            </div>

            {/* Ringkasan Kesalahan Validasi CAD (jika ada) */}
            {Object.keys(cadFormErrors).length > 0 && (
              <div
                style={{
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  marginBottom: '14px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  boxShadow: '0 2px 6px rgba(239, 68, 68, 0.08)',
                }}
              >
                <span style={{ fontSize: '16px', lineHeight: 1 }}>⚠️</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#991B1B' }}>
                    Mohon lengkapi {Object.keys(cadFormErrors).length} kolom wajib berikut:
                  </div>
                  <ul style={{ margin: '4px 0 0 16px', padding: 0, fontSize: '11.5px', color: '#B91C1C', lineHeight: 1.5 }}>
                    {Object.values(cadFormErrors).map((msg, i) => (
                      <li key={i}>{msg}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Input Nomor Tiket Resmi (Format Baku Wallboard 110: TICKET-0018xxxxxx) */}
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label className="form-label" style={{ fontSize: '11.5px', marginBottom: 0, fontWeight: 700, color: '#153E75', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span>🎫 Nomor Tiket (Opsional / Wallboard 110)</span>
                </label>
                <span style={{ fontSize: '10px', color: '#64748B', fontWeight: 600 }}>Input Manual / Auto-Generate</span>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-control"
                  value={simCaller.nomorTiket || ''}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase();
                    setSimCaller({ ...simCaller, nomorTiket: val });
                  }}
                  placeholder="Contoh: TIKET-1893474212 (Kosongkan jika ingin auto-generate)"
                  style={{
                    border: '1px solid #CBD5E1',
                    background: simCaller.nomorTiket ? '#F0FDF4' : 'white',
                    color: simCaller.nomorTiket ? '#166534' : '#1E293B',
                    fontWeight: simCaller.nomorTiket ? 700 : 400,
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    paddingLeft: '32px',
                    letterSpacing: '0.5px',
                  }}
                />
                <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px' }}>
                  🎫
                </span>
              </div>
              <div style={{ fontSize: '10.5px', color: '#64748B', marginTop: '4px', lineHeight: 1.4 }}>
                ℹ️ Jika nomor tiket sudah ada dari sistem Call Center 110 / Wallboard Polri, cantumkan di sini agar nomor tidak digenerate ulang.
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label className="form-label" style={{ fontSize: '11.5px', marginBottom: 0 }}>
                  Nomor Telepon Penelepon (Pelapor) <span style={{ color: 'red' }}>*</span>
                </label>
                <span style={{ fontSize: '10px', color: '#64748B' }}>Format: 08xx / +62xx (9–14 digit)</span>
              </div>
              <input
                type="tel"
                className="form-control"
                value={simCaller.telepon || ''}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^\d+-\s]/g, '');
                  setSimCaller({ ...simCaller, telepon: val });
                  if (cadFormErrors.telepon) {
                    setCadFormErrors((prev) => {
                      const next = { ...prev };
                      delete next.telepon;
                      return next;
                    });
                  }
                }}
                placeholder="Contoh: 08123456789"
                style={{
                  border: cadFormErrors.telepon ? '1.5px solid #EF4444' : '1px solid #CBD5E1',
                  background: cadFormErrors.telepon ? '#FEF2F2' : 'white',
                  transition: 'all 0.15s ease',
                }}
              />
              {cadFormErrors.telepon && (
                <div style={{ marginTop: '4px', fontSize: '11px', color: '#DC2626', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                  <span>⚠️</span> {cadFormErrors.telepon}
                </div>
              )}
            </div>

            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label className="form-label" style={{ fontSize: '11.5px' }}>
                Nama Warga Pelapor <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="text"
                className="form-control"
                value={simCaller.nama || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setSimCaller({ ...simCaller, nama: val });
                  if (cadFormErrors.nama) {
                    setCadFormErrors((prev) => {
                      const next = { ...prev };
                      delete next.nama;
                      return next;
                    });
                  }
                }}
                placeholder="Contoh: Bpk. Budi Santoso"
                style={{
                  border: cadFormErrors.nama ? '1.5px solid #EF4444' : '1px solid #CBD5E1',
                  background: cadFormErrors.nama ? '#FEF2F2' : 'white',
                  transition: 'all 0.15s ease',
                }}
              />
              {cadFormErrors.nama && (
                <div style={{ marginTop: '4px', fontSize: '11px', color: '#DC2626', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                  <span>⚠️</span> {cadFormErrors.nama}
                </div>
              )}
            </div>

            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label className="form-label" style={{ fontSize: '11.5px' }}>
                Kategori Laporan Kejadian <span style={{ color: 'red' }}>*</span>
              </label>
              <div style={{ border: cadFormErrors.kategori ? '1.5px solid #EF4444' : 'none', borderRadius: '8px' }}>
                <Select2CategoryDropdown
                  subcategories={dbSubcategories}
                  selectedId={simCaller.subcategoryId}
                  onSelect={(item) => {
                    if (item) {
                      const isInfoKonsultasi = Boolean(
                        item.category_key === 'INFORMASIKONSULTASI' ||
                        item.category_key === 'PELAYANAN_PUBLIK' ||
                        item.category_rel?.key === 'INFORMASIKONSULTASI' ||
                        (item.category_rel?.label && item.category_rel.label.toLowerCase().includes('informasi')) ||
                        (item.category_rel?.label && item.category_rel.label.toLowerCase().includes('konsultasi')) ||
                        (item.category_key && item.category_key.toUpperCase().includes('INFORMASI')) ||
                        (item.category_key && item.category_key.toUpperCase().includes('KONSULTASI'))
                      );

                      let newAlamat = simCaller.alamat;
                      let newLat = simCaller.lat;
                      let newLng = simCaller.lng;
                      let newUraian = simCaller.uraian;

                      if (isInfoKonsultasi) {
                        newAlamat = defaultMakoAddress;
                        newLat = defaultMakoLat;
                        newLng = defaultMakoLng;
                        if (!simCaller.uraian || simCaller.uraian.trim() === '' || simCaller.uraian.startsWith('Pelapor menghubungi Call Center 110 untuk berkonsultasi')) {
                          newUraian = `Pelapor menghubungi Call Center 110 untuk berkonsultasi mengenai ${item.nama_kasus}. Petugas operator SPKT 110 telah memberikan penjelasan mengenai persyaratan resmi, estimasi biaya PNBP, dan alur prosedur penanganan sesuai standar operasional kepolisian.`;
                        }
                        showFriendlyToast(
                          'info',
                          'Layanan Informasi & Konsultasi 110',
                          'Alamat Mako & draf ringkasan konsultasi otomatis terisi. Siap diselesaikan di Meja Operator.'
                        );
                      } else {
                        // Jika sebelumnya terisi alamat Mako otomatis & sekarang berganti ke kasus TKP biasa, reset agar operator mengisi TKP sebenarnya
                        if (simCaller.alamat === defaultMakoAddress) {
                          newAlamat = '';
                          newLat = 0;
                          newLng = 0;
                        }
                        if (simCaller.uraian?.startsWith('Pelapor menghubungi Call Center 110 untuk berkonsultasi')) {
                          newUraian = '';
                        }
                      }

                      setSimCaller({
                        ...simCaller,
                        subcategoryId: item.id,
                        kategori: item.nama_kasus,
                        kategoriKey: item.category_key,
                        urgensi: isInfoKonsultasi ? ((item.default_urgensi as any) || 'NORMAL') : ((item.default_urgensi as any) || simCaller.urgensi),
                        alamat: newAlamat,
                        lat: newLat,
                        lng: newLng,
                        uraian: newUraian,
                      });

                      if (cadFormErrors.kategori || (isInfoKonsultasi && (cadFormErrors.alamat || cadFormErrors.uraian || cadFormErrors.urgensi))) {
                        setCadFormErrors((prev) => {
                          const next = { ...prev };
                          delete next.kategori;
                          if (isInfoKonsultasi) {
                            delete next.alamat;
                            delete next.uraian;
                            delete next.urgensi;
                          }
                          return next;
                        });
                      }
                    } else {
                      setSimCaller({
                        ...simCaller,
                        subcategoryId: undefined,
                        kategori: '',
                        kategoriKey: '',
                      });
                    }
                  }}
                />
              </div>
              {isCurrentCategoryConsultation && (
                <div
                  style={{
                    marginTop: '8px',
                    padding: '8px 12px',
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(5, 150, 105, 0.08) 100%)',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '11px',
                    color: '#065F46',
                  }}
                >
                  <span style={{ fontSize: '15px' }}>🏢</span>
                  <div style={{ flex: 1, lineHeight: 1.4 }}>
                    <strong>Mode Layanan Informasi / Konsultasi:</strong> Alamat TKP otomatis diset ke <strong>{defaultMakoName}</strong> dan uraian draf terisi. Anda dapat langsung klik <strong>&ldquo;✅ Selesai&rdquo;</strong> di bawah.
                  </div>
                </div>
              )}
              {cadFormErrors.kategori && (
                <div style={{ marginTop: '4px', fontSize: '11px', color: '#DC2626', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                  <span>⚠️</span> {cadFormErrors.kategori}
                </div>
              )}
            </div>

            {/* Tingkat Urgensi Presisi */}
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label className="form-label" style={{ fontSize: '11.5px' }}>
                Tingkat Urgensi Penanganan <span style={{ color: 'red' }}>*</span>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max(dbUrgencyLevels.length, 1)}, 1fr)`, gap: '6px' }}>
                {dbUrgencyLevels.length === 0 ? (
                  <div style={{ gridColumn: '1 / -1', padding: '8px', textAlign: 'center', color: '#64748B', fontSize: '11px', background: '#F8FAFC', borderRadius: '6px', border: '1px dashed #CBD5E1' }}>
                    Data tingkat urgensi belum tersedia di database
                  </div>
                ) : (
                  dbUrgencyLevels.map((lvl: any) => {
                    const isSelected = simCaller.urgensi === lvl.key;
                    const borderColor = isSelected ? (lvl.badge_color || '#2563EB') : '1px solid #CBD5E1';
                    const bgColor = isSelected ? (lvl.badge_bg || '#EFF6FF') : 'white';
                    const textColor = isSelected ? (lvl.badge_color || '#2563EB') : '#64748B';
                    return (
                      <button
                        key={lvl.id || lvl.key}
                        type="button"
                        id={`eb-urg-${lvl.key.toLowerCase()}`}
                        onClick={() => {
                          setSimCaller({ ...simCaller, urgensi: lvl.key });
                          if (cadFormErrors.urgensi) {
                            setCadFormErrors((prev) => {
                              const next = { ...prev };
                              delete next.urgensi;
                              return next;
                            });
                          }
                        }}
                        style={{
                          padding: '8px 4px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 700,
                          border: isSelected ? `1.5px solid ${borderColor}` : '1px solid #CBD5E1',
                          background: bgColor,
                          color: textColor,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {lvl.label}
                      </button>
                    );
                  })
                )}
              </div>
              {cadFormErrors.urgensi && (
                <div style={{ marginTop: '4px', fontSize: '11px', color: '#DC2626', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                  <span>⚠️</span> {cadFormErrors.urgensi}
                </div>
              )}
            </div>

            <div className="form-group" style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                <label className="form-label" style={{ fontSize: '11.5px', marginBottom: 0 }}>
                  Lokasi Kejadian (TKP) &amp; Sektor <span style={{ color: 'red' }}>*</span>
                </label>
                <button
                  type="button"
                  id="btn-toggle-cad-map"
                  onClick={() => {
                    if (Math.abs(simCaller.lat) > 80 || Math.abs(simCaller.lng) > 180) {
                      setSimCaller((prev: any) => ({ ...prev, lat: 0, lng: 0 }));
                    }
                    setShowMapPickerCad(!showMapPickerCad);
                  }}
                  style={{
                    background: showMapPickerCad ? '#EFF6FF' : '#F8FAFC',
                    border: showMapPickerCad ? '1.5px solid #2563EB' : '1px solid #CBD5E1',
                    color: showMapPickerCad ? '#1D4ED8' : '#334155',
                    padding: '3px 9px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: showMapPickerCad ? '0 1px 4px rgba(37, 99, 235, 0.2)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>🗺️</span> {showMapPickerCad ? 'Tutup Peta Fullscreen' : 'Buka Peta Fullscreen (Titik TKP)'}
                </button>
              </div>

              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ketik alamat TKP atau cari nama tempat..."
                  value={simCaller.alamat || ''}
                  onChange={(e) => {
                    handleCadLocationSearch(e.target.value);
                    if (cadFormErrors.alamat) {
                      setCadFormErrors((prev) => {
                        const next = { ...prev };
                        delete next.alamat;
                        return next;
                      });
                    }
                  }}
                  onFocus={() => {
                    if (cadLocationSuggestions.length > 0) setShowCadSuggestions(true);
                  }}
                  style={{
                    paddingRight: '32px',
                    border: cadFormErrors.alamat ? '1.5px solid #EF4444' : '1px solid #CBD5E1',
                    background: cadFormErrors.alamat ? '#FEF2F2' : 'white',
                    transition: 'all 0.15s ease',
                  }}
                />
                {isCurrentCategoryConsultation && (
                  <div style={{ marginTop: '4px', fontSize: '10.5px', color: '#059669', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span>🏢</span>
                    <span>Lokasi TKP otomatis dihubungkan ke Mako Kepolisian karena jenis aduan adalah permohonan informasi / konsultasi SOP.</span>
                  </div>
                )}
                {isSearchingCadLocation && (
                  <div
                    style={{
                      position: 'absolute',
                      right: simCaller.alamat ? '28px' : '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '11px',
                      color: '#3B82F6',
                    }}
                  >
                    🔄
                  </div>
                )}
                {simCaller.alamat && (
                  <button
                    type="button"
                    onClick={() => {
                      setSimCaller({ ...simCaller, alamat: '', lat: 0, lng: 0 });
                      setShowCadSuggestions(false);
                    }}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      color: '#94A3B8',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 700,
                    }}
                    title="Hapus alamat"
                  >
                    ✕
                  </button>
                )}

                {/* List Popup Lokasi */}
                {showCadSuggestions && cadLocationSuggestions.length > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 4px)',
                      left: 0,
                      right: 0,
                      background: '#FFFFFF',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      boxShadow: '0 12px 28px -4px rgba(0, 0, 0, 0.25)',
                      zIndex: 9999,
                      maxHeight: '260px',
                      overflowY: 'auto',
                    }}
                  >
                    <div style={{ padding: '6px 10px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', fontSize: '10.5px', fontWeight: 700, color: '#64748B', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>📍 HASIL PENCARIAN TEMPAT &amp; ALAMAT</span>
                      <span
                        style={{ cursor: 'pointer', color: '#94A3B8' }}
                        onClick={() => setShowCadSuggestions(false)}
                      >
                        ✕ Tutup
                      </span>
                    </div>
                    {cadLocationSuggestions.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleSelectCadSuggestion(item)}
                        style={{
                          padding: '9px 12px',
                          cursor: 'pointer',
                          borderBottom: idx < cadLocationSuggestions.length - 1 ? '1px solid #F1F5F9' : 'none',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '10px',
                          transition: 'background 0.15s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#EFF6FF')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
                      >
                        <span style={{ fontSize: '16px', lineHeight: 1.2 }}>
                          {item.isPoliceStation ? '👮' : '📍'}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '12.5px', fontWeight: 700, color: item.isPoliceStation ? '#1D4ED8' : '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>{item.label}</span>
                            {item.isPoliceStation && (
                              <span style={{ fontSize: '9px', fontWeight: 800, background: '#EFF6FF', color: '#1D4ED8', padding: '1px 5px', borderRadius: '4px', border: '1px solid #BFDBFE' }}>
                                POLRI
                              </span>
                            )}
                            {item.distanceText && (
                              <span style={{ fontSize: '10px', fontWeight: 700, color: '#059669', background: '#ECFDF5', padding: '1px 5px', borderRadius: '4px', border: '1px solid #A7F3D0', fontFamily: 'monospace' }}>
                                {item.distanceText}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.subLabel}
                          </div>
                        </div>
                        <span style={{ fontSize: '10px', color: '#2563EB', background: '#DBEAFE', padding: '1px 5px', borderRadius: '4px', fontFamily: 'monospace', fontWeight: 600, alignSelf: 'center' }}>
                          PILIH
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {cadFormErrors.alamat && (
                <div style={{ marginTop: '4px', fontSize: '11px', color: '#DC2626', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                  <span>⚠️</span> {cadFormErrors.alamat}
                </div>
              )}
            </div>

            {/* Interactive Google Map Picker */}
            {showMapPickerCad && typeof document !== 'undefined' && createPortal(
              <div
                role="dialog"
                aria-modal="true"
                aria-label="Peta Fullscreen Titik TKP"
                style={{
                  position: 'fixed',
                  inset: 0,
                  width: '100vw',
                  height: '100vh',
                  maxWidth: '100vw',
                  maxHeight: '100vh',
                  zIndex: 10000000,
                  backgroundColor: '#0F172A',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                }}
              >
                {/* Header with quick search */}
                <div
                  style={{
                    padding: '10px 18px',
                    backgroundColor: '#1E293B',
                    borderBottom: '1px solid #334155',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '14px',
                    zIndex: 30,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '240px' }}>
                    <div
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '8px',
                        background: '#DC2626',
                        color: '#FFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px',
                        fontWeight: 700,
                      }}
                    >
                      🚨
                    </div>
                    <div>
                      <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#F8FAFC' }}>
                        Peta Fullscreen — Titik Lokasi TKP
                      </div>
                      <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                        {simCaller.lat && simCaller.lng && Math.abs(simCaller.lat) <= 80 ? (
                          <span style={{ color: '#34D399', fontWeight: 600, fontFamily: 'monospace' }}>
                            ✓ TKP: {simCaller.lat.toFixed(6)}, {simCaller.lng.toFixed(6)}
                          </span>
                        ) : (
                          <span>Pekalongan (Klik peta / cari alamat di atas)</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Search Bar in Fullscreen Modal Header */}
                  <div style={{ flex: 1, maxWidth: '520px', position: 'relative' }}>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <input
                        type="text"
                        placeholder="🔍 Cari jalan, kelurahan, atau nama tempat TKP..."
                        value={simCaller.alamat || ''}
                        onChange={(e) => {
                          handleCadLocationSearch(e.target.value);
                          if (cadFormErrors.alamat) {
                            setCadFormErrors((prev) => {
                              const next = { ...prev };
                              delete next.alamat;
                              return next;
                            });
                          }
                        }}
                        onFocus={() => {
                          if (cadLocationSuggestions.length > 0) setShowCadSuggestions(true);
                        }}
                        style={{
                          width: '100%',
                          padding: '7px 32px 7px 12px',
                          background: '#0F172A',
                          border: '1.5px solid #334155',
                          borderRadius: '7px',
                          color: '#F8FAFC',
                          fontSize: '12px',
                          outline: 'none',
                          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)',
                        }}
                      />
                      {isSearchingCadLocation && (
                        <div style={{ position: 'absolute', right: '10px', fontSize: '11px', color: '#38BDF8' }}>
                          🔄
                        </div>
                      )}
                    </div>

                    {/* Autocomplete Dropdown in Fullscreen Modal */}
                    {showCadSuggestions && cadLocationSuggestions.length > 0 && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 'calc(100% + 4px)',
                          left: 0,
                          right: 0,
                          background: '#1E293B',
                          borderRadius: '8px',
                          border: '1px solid #334155',
                          boxShadow: '0 12px 28px -4px rgba(0, 0, 0, 0.6)',
                          zIndex: 9999,
                          maxHeight: '260px',
                          overflowY: 'auto',
                        }}
                      >
                        <div style={{ padding: '6px 10px', background: '#0F172A', borderBottom: '1px solid #334155', fontSize: '10px', fontWeight: 700, color: '#94A3B8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>📍 PILIH HASIL PENCARIAN TEMPAT</span>
                          <span style={{ cursor: 'pointer', color: '#CBD5E1' }} onClick={() => setShowCadSuggestions(false)}>
                            ✕ Tutup
                          </span>
                        </div>
                        {cadLocationSuggestions.map((item, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              handleSelectCadSuggestion(item);
                            }}
                            style={{
                              padding: '8px 12px',
                              cursor: 'pointer',
                              borderBottom: idx < cadLocationSuggestions.length - 1 ? '1px solid #334155' : 'none',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              color: '#F8FAFC',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = '#334155')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                          >
                            <span style={{ fontSize: '14px' }}>
                              {item.isPoliceStation ? '👮' : '📍'}
                            </span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '12px', fontWeight: 600, color: item.isPoliceStation ? '#60A5FA' : '#F8FAFC', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span>{item.label}</span>
                                {item.isPoliceStation && (
                                  <span style={{ fontSize: '9px', fontWeight: 800, background: '#1E3A8A', color: '#93C5FD', padding: '1px 5px', borderRadius: '4px', border: '1px solid #3B82F6' }}>
                                    POLRI
                                  </span>
                                )}
                                {item.distanceText && (
                                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#34D399', background: 'rgba(52, 211, 153, 0.15)', padding: '1px 5px', borderRadius: '4px', border: '1px solid rgba(52, 211, 153, 0.3)', fontFamily: 'monospace' }}>
                                    {item.distanceText}
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '10.5px', color: '#94A3B8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {item.subLabel}
                              </div>
                            </div>
                            <span style={{ fontSize: '10px', color: '#38BDF8', background: 'rgba(56,189,248,0.15)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                              PILIH
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowMapPickerCad(false)}
                    style={{
                      background: '#EF4444',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '7px',
                      padding: '7px 14px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <span>✕</span>
                    <span>Tutup</span>
                  </button>
                </div>

                {/* Map Canvas */}
                <div style={{ flex: 1, position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
                  <div
                    style={{
                      position: 'absolute',
                      top: '12px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'rgba(15, 23, 42, 0.88)',
                      color: '#F8FAFC',
                      backdropFilter: 'blur(4px)',
                      padding: '6px 16px',
                      borderRadius: '999px',
                      fontSize: '12px',
                      fontWeight: 600,
                      zIndex: 20,
                      boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
                      pointerEvents: 'none',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    💡 Klik peta atau geser pin merah untuk mengunci titik TKP yang akurat
                  </div>
                  <MiniMapPicker
                    lat={Math.abs(simCaller.lat) > 80 ? 0 : simCaller.lat}
                    lng={Math.abs(simCaller.lat) > 80 ? 0 : simCaller.lng}
                    height="100%"
                    fallbackCenter={
                      resolvedMakoOffice?.lat && resolvedMakoOffice?.lng
                        ? { lat: Number(resolvedMakoOffice.lat), lng: Number(resolvedMakoOffice.lng) }
                        : undefined
                    }
                    onChange={(lat, lng) => {
                      setSimCaller((prev: any) => ({ ...prev, lat, lng }));
                    }}
                    onAddressChange={(alamat) => {
                      setSimCaller((prev: any) => ({ ...prev, alamat }));
                      if (cadFormErrors.alamat) {
                        setCadFormErrors((prev) => {
                          const next = { ...prev };
                          delete next.alamat;
                          return next;
                        });
                      }
                    }}
                  />
                </div>

                {/* Bottom Confirmation Bar */}
                <div
                  style={{
                    padding: '12px 20px',
                    backgroundColor: '#FFFFFF',
                    borderTop: '1px solid #E2E8F0',
                    boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    zIndex: 30,
                  }}
                >
                  <div style={{ flex: 1, minWidth: '220px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ color: '#DC2626' }}>📍</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '650px' }}>
                        {simCaller.alamat || 'Geser atau klik peta untuk memilih titik TKP...'}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748B', fontFamily: 'monospace', fontWeight: 600, marginTop: '2px' }}>
                      {simCaller.lat && simCaller.lng && Math.abs(simCaller.lat) <= 80 ? (
                        <span style={{ color: '#059669' }}>
                          📐 TKP Lat: {simCaller.lat.toFixed(6)} | Lng: {simCaller.lng.toFixed(6)}
                        </span>
                      ) : (
                        <span style={{ color: '#DC2626' }}>⚠️ Titik TKP belum ditentukan (Pekalongan)</span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowMapPickerCad(false)}
                    style={{
                      padding: '9px 24px',
                      borderRadius: '8px',
                      border: 'none',
                      background: '#2563EB',
                      color: '#FFFFFF',
                      fontWeight: 700,
                      fontSize: '13px',
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(37,99,235,0.35)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <span>✓</span>
                    <span>Kunci Titik TKP &amp; Selesai</span>
                  </button>
                </div>
              </div>,
              document.body
            )}

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label className="form-label" style={{ fontSize: '11.5px', marginBottom: 0 }}>
                  Ringkasan Uraian Kejadian Dari Penelepon <span style={{ color: 'red' }}>*</span>
                </label>
                <span style={{ fontSize: '10px', color: '#64748B' }}>Minimal 10 karakter</span>
              </div>
              <textarea
                className="form-control"
                rows={3}
                style={{
                  minHeight: '85px',
                  fontSize: '12.5px',
                  lineHeight: 1.5,
                  border: cadFormErrors.uraian ? '1.5px solid #EF4444' : '1px solid #CBD5E1',
                  background: cadFormErrors.uraian ? '#FEF2F2' : 'white',
                  transition: 'all 0.15s ease',
                }}
                placeholder="Tuliskan keterangan pelapor secara jelas (kronologi singkat, ciri-ciri pelaku jika ada, situasi terkini di TKP)..."
                value={simCaller.uraian || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setSimCaller({ ...simCaller, uraian: val });
                  if (cadFormErrors.uraian) {
                    setCadFormErrors((prev) => {
                      const next = { ...prev };
                      delete next.uraian;
                      return next;
                    });
                  }
                }}
              />
              {isCurrentCategoryConsultation && (
                <div style={{ marginTop: '4px', fontSize: '10.5px', color: '#059669', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span>✍️</span>
                  <span>Uraian terisi otomatis sebagai laporan konsultasi resmi. Anda tetap dapat menambahkan detail pertanyaan atau catatan khusus bila diperlukan.</span>
                </div>
              )}
              {cadFormErrors.uraian && (
                <div style={{ marginTop: '4px', fontSize: '11px', color: '#DC2626', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                  <span>⚠️</span> {cadFormErrors.uraian}
                </div>
              )}
            </div>

            {/* Boundary Warning & Dynamic Action on CAD Input Form */}
            {(() => {
              const formBoundary = evaluateJurisdictionBoundary({
                tkpLat: simCaller.lat,
                tkpLng: simCaller.lng,
                tkpAlamat: simCaller.alamat,
              });
              const isOutside = formBoundary.isOutsideJurisdiction;
              const targetName = formBoundary.targetStation?.stationName || formBoundary.detectedRegionName || 'Mako Tetangga';

              return (
                <>
                  {isOutside && (
                    <div
                      style={{
                        marginBottom: '12px',
                        padding: '10px 14px',
                        background: '#FEF3C7',
                        border: '1.5px solid #F59E0B',
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: '#92400E',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        boxShadow: '0 2px 8px rgba(245,158,11,0.15)',
                      }}
                    >
                      <span style={{ fontSize: '18px' }}>⚠️</span>
                      <div>
                        <div style={{ fontWeight: 800 }}>Indikasi Batas Wilayah (E-Routing Boundary):</div>
                        <div>
                          Titik TKP terindikasi berada di yurisdiksi <strong>{targetName}</strong>. Laporan akan dialihkan ke Mako tetangga melalui koordinasi lintas wilayah tanpa penugasan ke armada lokal.
                        </div>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      id="btn-cad-selesai-meja"
                      disabled={loading}
                      onClick={() => {
                        const errors = validateCadForm();
                        if (Object.keys(errors).length > 0) {
                          setCadFormErrors(errors);
                          showFriendlyToast('warning', 'Formulir Belum Lengkap', Object.values(errors)[0]);
                          const el = document.getElementById('cad-form-container');
                          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          return;
                        }

                        const matchedSub = (dbSubcategories || []).find((s: any) => String(s.id) === String(simCaller.subcategoryId));
                        const defaultSopNotes = matchedSub?.sop_guidance
                          ? `Operator telah memberikan panduan SOP: ${matchedSub.sop_guidance}`
                          : `Pelapor telah berkonsultasi mengenai ${simCaller.kategori || 'layanan kepolisian'}. Operator telah menjelaskan prosedur, syarat resmi, dan solusi penanganan secara tuntas sesuai SOP Polri Presisi 110.`;

                        setCadFormErrors({});
                        setDeskResolveModalData({
                          isFromCadForm: true,
                          nomorTiket: simCaller.nomorTiket?.trim() || '',
                          namaPelapor: simCaller.nama,
                          teleponPelapor: simCaller.telepon,
                          jenisKejadian: simCaller.kategori,
                          alamatTkp: simCaller.alamat,
                          resolutionNotes: defaultSopNotes,
                          sendWa: true,
                        });
                      }}
                      style={{
                        flex: 1,
                        minWidth: '220px',
                        padding: '14px 18px',
                        background: loading ? '#94A3B8' : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '10px',
                        fontWeight: 900,
                        fontSize: '13px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        boxShadow: '0 4px 15px rgba(16, 185, 129, 0.35)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        letterSpacing: '0.2px',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span>✅</span>  Simpan & Selesaikan
                    </button>
                    <button
                      type="button"
                      id="btn-cad-simpan-disposisi"
                      disabled={loading}
                      onClick={async () => {
                        const errors = validateCadForm();
                        if (Object.keys(errors).length > 0) {
                          setCadFormErrors(errors);
                          showFriendlyToast('warning', 'Formulir Belum Lengkap', Object.values(errors)[0]);
                          const el = document.getElementById('cad-form-container');
                          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          return;
                        }

                        setCadFormErrors({});
                        setLoading(true);
                        try {
                          if (isOutside) {
                            // JIKA DI LUAR YURISDIKSI:
                            // Buat tiket tanpa broadcast ke armada lokal, lalu langsung buka Modal Disposisi Lintas Wilayah
                            const res = await createComplaintAction({
                              nomorTiket: simCaller.nomorTiket?.trim() || undefined,
                              namaPelapor: simCaller.nama,
                              noHpPelapor: simCaller.telepon,
                              kategoriLaporan: simCaller.kategori,
                              kategoriKey: (simCaller as any).kategoriKey || undefined,
                              subcategoryId: simCaller.subcategoryId,
                              platformKey: 'layanan110',
                              urgensi: (simCaller as any).urgensi,
                              tkpAlamatTeks: simCaller.alamat,
                              tkpLat: simCaller.lat,
                              tkpLng: simCaller.lng,
                              deskripsiKejadian: simCaller.uraian,
                              saluranLaporan: 'CALL_110',
                              operatorId: session?.userId ? String(session.userId) : null,
                            });
                            if (res.success && res.data) {
                              showFriendlyToast(
                                'info',
                                'Tiket Lintas Wilayah Terdaftar',
                                `Tiket ${res.data.nomorTiket || res.data.id} berhasil dicatat. Silakan konfirmasi pengalihan ke ${targetName}.`
                              );
                              // Langsung munculkan Modal Disposisi Lintas Wilayah (Poin 1.A)
                              setTransferModalItem({ item: res.data, boundary: formBoundary });
                              setSimCaller({
                                nomorTiket: '',
                                nama: '',
                                telepon: '',
                                alamat: '',
                                kategori: '',
                                kategoriKey: '',
                                subcategoryId: undefined,
                                urgensi: '',
                                uraian: '',
                                lat: 0,
                                lng: 0,
                              });
                              await loadData();
                            } else {
                              showFriendlyToast('error', 'Gagal Memproses Laporan', res.error || 'Terjadi kendala saat menyimpan laporan.');
                            }
                          } else {
                            // JIKA DI DALAM YURISDIKSI:
                            // Alur standar: Siarkan langsung ke seluruh armada siaga lokal
                            const res = await createComplaintAndBroadcastAction({
                              nomorTiket: simCaller.nomorTiket?.trim() || undefined,
                              namaPelapor: simCaller.nama,
                              noHpPelapor: simCaller.telepon,
                              kategoriLaporan: simCaller.kategori,
                              kategoriKey: (simCaller as any).kategoriKey || undefined,
                              subcategoryId: simCaller.subcategoryId,
                              platformKey: 'layanan110',
                              urgensi: (simCaller as any).urgensi,
                              tkpAlamatTeks: simCaller.alamat,
                              tkpLat: simCaller.lat,
                              tkpLng: simCaller.lng,
                              deskripsiKejadian: simCaller.uraian,
                              saluranLaporan: 'CALL_110',
                              operatorId: session?.userId ? String(session.userId) : null,
                            });
                            if (res.success && res.data) {
                              showFriendlyToast(
                                'success',
                                'Laporan Berhasil Disimpan & Disiarkan',
                                `Tiket ${res.data.nomorTiket || res.data.id} berhasil disiarkan secara serentak ke seluruh armada siaga.`
                              );
                              setBroadcastModalData(res.data);
                              setSimCaller({
                                nomorTiket: '',
                                nama: '',
                                telepon: '',
                                alamat: '',
                                kategori: '',
                                kategoriKey: '',
                                subcategoryId: undefined,
                                urgensi: '',
                                uraian: '',
                                lat: 0,
                                lng: 0,
                              });
                              await loadData();
                            } else {
                              showFriendlyToast('error', 'Gagal Memproses Laporan', res.error || 'Terjadi kendala saat menyimpan laporan.');
                            }
                          }
                        } catch (err: any) {
                          showFriendlyToast('error', 'Terjadi Kendala Sistem', err.message || 'Sistem tidak dapat memproses laporan saat ini.');
                        } finally {
                          setLoading(false);
                        }
                      }}
                      style={{
                        flex: 1,
                        minWidth: '200px',
                        padding: '14px 18px',
                        background: loading
                          ? '#94A3B8'
                          : isOutside
                          ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
                          : 'linear-gradient(135deg, #ECC473 0%, #C99635 100%)',
                        color: isOutside ? '#0F172A' : '#111827',
                        border: isOutside ? '1.5px solid #B45309' : 'none',
                        borderRadius: '10px',
                        fontWeight: 900,
                        fontSize: '13px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        boxShadow: isOutside
                          ? '0 4px 15px rgba(217, 119, 6, 0.4)'
                          : '0 4px 15px rgba(201, 150, 53, 0.35)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        letterSpacing: '0.2px',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {loading
                        ? '⏳ Memproses...'
                        : isOutside
                        ? `🔄 Simpan & Alihkan ke ${targetName}`
                        : '⚡ Simpan Tiket + Disposisi'}
                    </button>
                  </div>
                </>
              );
            })()}
          </div>

        </div>

        {/* Kolom Kanan: Antrean Laporan & Disposisi Live (Hanya Tampil di Desktop) */}
        <CadAntreanColumn
          antreanPawas={antreanPawas}
          policeOffices={policeOffices}
          userProfile={userProfile}
          session={session}
          loading={loading}
          isTransferring={isTransferring}
          onOpenDisposisiLintasWilayah={onOpenDisposisiLintasWilayah}
          setTransferModalItem={setTransferModalItem}
          bukaModalDisposisi={bukaModalDisposisi}
          setDeskResolveModalData={setDeskResolveModalData}
          bukaModalTolak={bukaModalTolak}
          setTolakComplaint={setTolakComplaint}
        />

      </div>

      {/* MODAL HASIL BROADCAST & QR CODE PELACAKAN WARGA */}
      <CadBroadcastModal
        broadcastModalData={broadcastModalData}
        simCaller={simCaller}
        isCopied={isCopied}
        setIsCopied={setIsCopied}
        isSendingWa={isSendingWa}
        setIsSendingWa={setIsSendingWa}
        waSendResult={waSendResult}
        setWaSendResult={setWaSendResult}
        onClose={() => {
          setBroadcastModalData(null);
          setWaSendResult(null);
        }}
        showFriendlyToast={showFriendlyToast}
      />

      {/* MODAL KONFIRMASI DISPOSISI LINTAS WILAYAH (INTER-POLRES) */}
      <CadTransferModal
        transferModalItem={transferModalItem}
        isTransferring={isTransferring}
        onClose={() => setTransferModalItem(null)}
        onConfirm={handleExecuteTransfer}
      />

      {/* MODAL PENYELESAIAN DI MEJA OPERATOR (LAYANAN INFORMASI / SOP) */}
      <CadDeskResolveModal
        deskResolveModalData={deskResolveModalData}
        setDeskResolveModalData={setDeskResolveModalData}
        isResolvingDesk={isResolvingDesk}
        onClose={() => setDeskResolveModalData(null)}
        onConfirm={handleExecuteDeskResolution}
      />
    </div>
  );
}
