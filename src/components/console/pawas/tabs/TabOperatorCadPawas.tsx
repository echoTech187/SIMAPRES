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

// Helper untuk mengambil nama kesatuan Mako yang didisposisikan terakhir kali
export const getLastDispatchedStationName = (item: any, offices: any[] = []): string => {
  if (!item) return '';
  // 1. Cek dispatches terakhir
  const dispatches = Array.isArray(item.dispatches) ? item.dispatches : [];
  if (dispatches.length > 0) {
    const lastDisp = dispatches[dispatches.length - 1];
    if (lastDisp?.station?.station_name) return lastDisp.station.station_name;
    if (lastDisp?.station?.name) return lastDisp.station.name;
    if (lastDisp?.stationName) return lastDisp.stationName;
    if (lastDisp?.station_id) {
      const found = offices.find((po: any) => String(po.id) === String(lastDisp.station_id));
      if (found?.station_name) return found.station_name;
      if (found?.name) return found.name;
    }
  }

  // 2. Cek audit logs untuk tindakan DISPOSISI_LINTAS_WILAYAH
  const logs = item.complaint_logs || item.complaintLogs || item.auditLogs || [];
  if (Array.isArray(logs) && logs.length > 0) {
    for (let i = logs.length - 1; i >= 0; i--) {
      const l = logs[i];
      if ((l.action === 'DISPOSISI_LINTAS_WILAYAH' || l.action === 'CROSS_JURISDICTION_DISPATCHED') && l.notes) {
        const match = l.notes.match(/Ke:\s*([^|➔\n]+)/i) || l.notes.match(/ke\s+([^.\n|➔]+)/i);
        if (match && match[1]) {
          return match[1].trim();
        }
      }
    }
  }

  // 3. Cek station complaint utama
  if (item.station?.station_name) return item.station.station_name;
  if (item.station?.name) return item.station.name;
  if (item.stationName) return item.stationName;
  if (item.station_id || item.stationId) {
    const sid = item.station_id || item.stationId;
    const found = offices.find((po: any) => String(po.id) === String(sid));
    if (found?.station_name) return found.station_name;
    if (found?.name) return found.name;
  }

  return '';
};

// Helper untuk mengambil station_id kesatuan Mako yang didisposisikan terakhir kali
export const getLastDispatchedStationId = (item: any, offices: any[] = []): number | string | null => {
  if (!item) return null;
  // 1. Cek dispatches terakhir
  const dispatches = Array.isArray(item.dispatches) ? item.dispatches : [];
  if (dispatches.length > 0) {
    const lastDisp = dispatches[dispatches.length - 1];
    if (lastDisp?.station_id) return lastDisp.station_id;
    if (lastDisp?.station?.id) return lastDisp.station.id;
  }

  // 2. Cek audit logs untuk tindakan DISPOSISI_LINTAS_WILAYAH
  const logs = item.complaint_logs || item.complaintLogs || item.auditLogs || [];
  if (Array.isArray(logs) && logs.length > 0) {
    for (let i = logs.length - 1; i >= 0; i--) {
      const l = logs[i];
      if ((l.action === 'DISPOSISI_LINTAS_WILAYAH' || l.action === 'CROSS_JURISDICTION_DISPATCHED') && l.notes) {
        const match = l.notes.match(/Ke:\s*([^|➔\n]+)/i) || l.notes.match(/ke\s+([^.\n|➔]+)/i);
        if (match && match[1]) {
          const targetName = match[1].trim().toLowerCase().replace(/^(polres|polresta|polsek)\s+/, '');
          const found = offices.find((po: any) => {
            const pName = (po.station_name || po.name || '').toLowerCase().replace(/^(polres|polresta|polsek)\s+/, '').trim();
            return pName === targetName;
          });
          if (found?.id) return found.id;
        }
      }
    }
  }

  // 3. Cek station complaint utama
  if (item.station_id || item.stationId || item.station?.id) {
    return item.station_id || item.stationId || item.station?.id;
  }

  return null;
};

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

  const defaultMakoName = resolvedMakoOffice?.name || 'Mako SPKT Polres Pekalongan 110';
  const defaultMakoAddress = resolvedMakoOffice?.address
    ? (resolvedMakoOffice.address.includes(resolvedMakoOffice.name) ? resolvedMakoOffice.address : `${resolvedMakoOffice.name}, ${resolvedMakoOffice.address}`)
    : 'Mako SPKT Polres Pekalongan, Jl. Rinjani No.1, Tanjungsari, Kajen, Kabupaten Pekalongan, Jawa Tengah 51161';
  const defaultMakoLat = resolvedMakoOffice?.lat ? Number(resolvedMakoOffice.lat) : -7.026779;
  const defaultMakoLng = resolvedMakoOffice?.lng ? Number(resolvedMakoOffice.lng) : 109.59308;

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
                    fallbackCenter={{ lat: -7.026803, lng: 109.592982 }}
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
        <div className="cad-antrean-column" style={{ width: '100%', minWidth: 0 }}>
          <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #E2E8F0', paddingBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#1E293B' }}>📋 Antrean Menunggu Disposisi</span>
              <span style={{ background: '#F59E0B', color: 'white', fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '10px' }}>
                {antreanPawas.length}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '550px', overflowY: 'auto' }}>
              {antreanPawas.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#64748B', fontSize: '12px' }}>
                  Tidak ada antrean menunggu disposisi saat ini.
                </div>
              ) : (
                antreanPawas.map((item) => (
                  <div
                    key={item.id}
                    style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px 12px' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '11.5px', color: '#153E75' }}>
                        {item.nomorTiket}
                      </span>
                      {(() => {
                        const urgKey = (item.urgensi === 'DARURAT' || item.urgensi === 'PRIORITAS_TINGGI') ? 'DARURAT' : item.urgensi === 'SEDANG' ? 'SEDANG' : 'NORMAL';
                        const urgBg = urgKey === 'DARURAT' ? '#FEE2E2' : urgKey === 'SEDANG' ? '#FEF3C7' : '#EFF6FF';
                        const urgColor = urgKey === 'DARURAT' ? '#DC2626' : urgKey === 'SEDANG' ? '#D97706' : '#1D4ED8';
                        return (
                          <span style={{ fontSize: '10px', background: urgBg, color: urgColor, fontWeight: 800, padding: '1px 6px', borderRadius: '4px' }}>
                            {urgKey}
                          </span>
                        );
                      })()}
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '12.5px', color: '#1E293B', marginBottom: '2px' }}>
                      {item.jenisKejadian}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '8px' }}>
                      📍 {isGenericOrCoordinateAddress(item.tkpAlamatTeks) ? resolveSektorWilayah(item.tkpAlamatTeks, item) : item.tkpAlamatTeks}
                    </div>

                    {/* Boundary Alert & Quick-Transfer Button */}
                    {(() => {
                      const boundary = evaluateJurisdictionBoundary({
                        tkpLat: item.tkpLat || item.tkp_lat,
                        tkpLng: item.tkpLng || item.tkp_lng,
                        tkpAlamat: item.tkpAlamatTeks,
                      });

                      const isCrossJurisdiction = item.status === 'DISPOSISI_LINTAS_WILAYAH' || boundary.isOutsideJurisdiction;

                      if (!isCrossJurisdiction) return null;

                      // Wilayah yang tertulis di sini adalah wilayah yang didisposisikan terakhir kali
                      const lastStation = getLastDispatchedStationName(item, policeOffices);
                      const targetName = lastStation || boundary.targetStation?.stationName || 'Polresta Batang';
                      const targetStationId = getLastDispatchedStationId(item, policeOffices);

                      // Sesuai koreksi user: Bandingkan station_id user login dengan station_id dari getLastDispatchedStation
                      const userStationId = userProfile?.stationId || session?.stationId;
                      const userStationName = userProfile?.stationName || session?.stationName;

                      const isUserTargetStation = Boolean(
                        (userStationId && targetStationId && String(userStationId) === String(targetStationId)) ||
                        (userStationName && lastStation && userStationName.trim().toLowerCase() === lastStation.trim().toLowerCase())
                      );

                      // Jika user yang login adalah Mako Tujuan (misal Polresta Batang),
                      // mereka TIDAK PERLU melihat tombol "Transfer ke Polresta Batang" atau alert batas wilayah untuk diri sendiri!
                      if (isUserTargetStation) return null;

                      // Deteksi apakah waktu respon sudah expired (1 menit tanpa respon)
                      const dispatches = Array.isArray(item.dispatches) ? item.dispatches : [];
                      const dispatchWithDeadline = dispatches.find((d: any) => d.escalation_deadline_at || d.escalationDeadlineAt);
                      const rawDeadline = dispatchWithDeadline?.escalation_deadline_at || dispatchWithDeadline?.escalationDeadlineAt;
                      let deadlineMs = rawDeadline ? new Date(rawDeadline).getTime() : null;

                      if (!deadlineMs) {
                        const logs = item.complaint_logs || item.complaintLogs || item.auditLogs || [];
                        const xLog = Array.isArray(logs) ? logs.find((l: any) => l.action === 'DISPOSISI_LINTAS_WILAYAH' || l.action === 'CROSS_JURISDICTION_DISPATCHED') : null;
                        if (xLog?.created_at) {
                          deadlineMs = new Date(xLog.created_at).getTime() + getCrossJurisdictionTimeoutMs();
                        } else if (item.updated_at || item.created_at) {
                          deadlineMs = new Date(item.updated_at || item.created_at).getTime() + getCrossJurisdictionTimeoutMs();
                        }
                      }

                      const isExpired = Boolean(deadlineMs && deadlineMs <= Date.now());

                      // Jika tiket sudah didisposisikan antar wilayah dan belum expired (sedang menunggu respon mako tujuan):
                      // ALERT DAN TOMBOL TRANSFER HILANG DARI MAKO ASAL!
                      if (item.status === 'DISPOSISI_LINTAS_WILAYAH' && !isExpired) {
                        return (
                          <div
                            style={{
                              marginTop: '8px',
                              marginBottom: '6px',
                              padding: '6px 10px',
                              background: '#F8FAFC',
                              border: '1px solid #E2E8F0',
                              borderRadius: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontSize: '11px',
                              color: '#475569',
                              fontWeight: 700,
                            }}
                          >
                            <span style={{ fontSize: '13px' }}>⏳</span>
                            <span>Menunggu respon dari <strong>{targetName}</strong> (Batas waktu 3–5 menit)</span>
                          </div>
                        );
                      }

                      return (
                        <div
                          style={{
                            marginTop: '8px',
                            marginBottom: '6px',
                            padding: '8px 10px',
                            background: isExpired ? '#FEF2F2' : '#FFFBEB',
                            border: isExpired ? '1.5px solid #EF4444' : '1.5px solid #F59E0B',
                            borderRadius: '8px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isExpired ? '#DC2626' : '#B45309', fontSize: '11px', fontWeight: 800, marginBottom: '6px' }}>
                            <span>⚠️</span>
                            <span>
                              {isExpired
                                ? `Waktu Respon Habis: ${targetName} Tidak Merespon`
                                : `Batas Wilayah: TKP di ${boundary.detectedRegionName || targetName}`}
                            </span>
                          </div>
                          <button
                            type="button"
                            id={`btn-transfer-lintas-${item.id}`}
                            disabled={loading || isTransferring}
                            onClick={() => {
                              if (onOpenDisposisiLintasWilayah) {
                                onOpenDisposisiLintasWilayah(item);
                              } else {
                                setTransferModalItem({ item, boundary });
                              }
                            }}
                            style={{
                              width: '100%',
                              padding: '8px 10px',
                              background: isExpired
                                ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'
                                : 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                              color: isExpired ? '#FFFFFF' : '#0F172A',
                              fontWeight: 900,
                              fontSize: '11px',
                              borderRadius: '6px',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              boxShadow: isExpired
                                ? '0 2px 6px rgba(220,38,38,0.3)'
                                : '0 2px 6px rgba(217,119,6,0.3)',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <span>
                              {isExpired
                                ? `⚠️ ${targetName} tidak merespon, Alihkan ke wilayah terdekat`
                                : `🔄 Transfer ke ${targetName}`}
                            </span>
                          </button>
                        </div>
                      );
                    })()}

                    {/* Tombol aksi reguler hanya ditampilkan jika BUKAN tiket disposisi antar wilayah */}
                    {(() => {
                      const boundary = evaluateJurisdictionBoundary({
                        tkpLat: item.tkpLat || item.tkp_lat,
                        tkpLng: item.tkpLng || item.tkp_lng,
                        tkpAlamat: item.tkpAlamatTeks,
                      });
                      const isCrossJurisdiction = item.status === 'DISPOSISI_LINTAS_WILAYAH' || boundary.isOutsideJurisdiction;
                      if (isCrossJurisdiction) return null;

                      return (
                        <div style={{ marginTop: '16px', display: 'flex', gap: '8px', alignItems: 'stretch', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            id="btn-buka-modal-disposisi"
                            onClick={() => {
                              bukaModalDisposisi(item);
                            }}
                            style={{
                              flex: 1,
                              minWidth: '120px',
                              height: '42px',
                              padding: '0 12px',
                              background: 'linear-gradient(135deg, #153E75 0%, #1E40AF 100%)',
                              color: 'white',
                              fontSize: '12px',
                              fontWeight: 800,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              borderRadius: '8px',
                              border: 'none',
                              boxShadow: '0 2px 8px rgba(21,62,117,0.25)',
                              cursor: 'pointer',
                              margin: 0,
                              transition: 'all 0.15s ease',
                            }}
                          >
                            Teruskan Tugas ➔
                          </button>
                          <button
                            type="button"
                            id={`btn-selesai-meja-${item.id}`}
                            onClick={() => {
                              setDeskResolveModalData({
                                isFromCadForm: false,
                                item: item,
                                nomorTiket: item.nomorTiket || '',
                                namaPelapor: item.pelaporNama || item.pelapor_nama || '',
                                teleponPelapor: item.pelaporHp || item.pelapor_hp || '',
                                jenisKejadian: item.jenisKejadian || item.jenis_kejadian || '',
                                alamatTkp: item.tkpAlamatTeks || item.tkp_alamat_teks || '',
                                resolutionNotes: `Layanan informasi / konsultasi atas pengaduan ${item.nomorTiket} telah selesai dijelaskan oleh Operator 110 kepada pelapor sesuai SOP kepolisian.`,
                                sendWa: true,
                              });
                            }}
                            style={{
                              height: '42px',
                              padding: '0 12px',
                              borderRadius: '8px',
                              border: '1px solid #A7F3D0',
                              background: '#ECFDF5',
                              color: '#059669',
                              fontWeight: 800,
                              fontSize: '12px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '5px',
                              margin: 0,
                              transition: 'all 0.15s ease',
                            }}
                            title="Selesaikan langsung di Meja Operator tanpa disposisi lapangan"
                          >
                            <span>✓</span> Selesai
                          </button>
                          <button
                            type="button"
                            id="btn-tolak-dossier"
                            onClick={() => {
                              if (bukaModalTolak) {
                                bukaModalTolak(item);
                              } else {
                                setTolakComplaint?.(item);
                              }
                            }}
                            style={{
                              height: '42px',
                              padding: '0 12px',
                              borderRadius: '8px',
                              border: '1px solid #FCA5A5',
                              background: '#FEF2F2',
                              color: '#DC2626',
                              fontWeight: 800,
                              fontSize: '12px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '5px',
                              margin: 0,
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <span>✕</span> Tolak
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

      {/* MODAL HASIL BROADCAST & QR CODE PELACAKAN WARGA */}
      {broadcastModalData && typeof document !== 'undefined' && createPortal(
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            background: 'rgba(11, 15, 25, 0.88)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            animation: 'fadeIn 0.2s ease-out',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setBroadcastModalData(null);
          }}
        >
          <div
            style={{
              background: '#12141C',
              border: '1.5px solid rgba(236, 196, 115, 0.35)',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '520px',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7), 0 0 40px rgba(236, 196, 115, 0.12)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              color: '#FFFFFF',
            }}
          >
            {/* Header Modal */}
            <div
              style={{
                background: 'linear-gradient(180deg, rgba(236, 196, 115, 0.15) 0%, rgba(18, 20, 28, 0) 100%)',
                padding: '20px 24px 16px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span
                    style={{
                      background: 'linear-gradient(135deg, #ECC473 0%, #C99635 100%)',
                      color: '#0B0F19',
                      fontSize: '10.5px',
                      fontWeight: 900,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      letterSpacing: '0.5px',
                    }}
                  >
                    SIARAN LANGSUNG 110
                  </span>
                  <span style={{ fontSize: '11px', color: '#94A3B8' }}>Siapa Cepat Dia Dapat</span>
                </div>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#F8FAFC', margin: 0 }}>
                  Tiket Berhasil Disiarkan ke Armada
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setBroadcastModalData(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#94A3B8',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  fontSize: '16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ✕
              </button>
            </div>

            {/* Content Body */}
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Ringkasan Tiket */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  fontSize: '12px',
                }}
              >
                <div>
                  <div style={{ color: '#94A3B8', fontSize: '10.5px', marginBottom: '2px' }}>Nomor Tiket</div>
                  <div style={{ fontWeight: 800, color: '#ECC473', fontSize: '13.5px' }}>
                    {broadcastModalData.nomorTiket || broadcastModalData.id}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#94A3B8', fontSize: '10.5px', marginBottom: '2px' }}>Pelapor</div>
                  <div style={{ fontWeight: 700, color: '#F1F5F9' }}>
                    {broadcastModalData.pelaporNama || simCaller.nama || '-'} ({broadcastModalData.pelaporHp || simCaller.telepon || '-'})
                  </div>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <div style={{ color: '#94A3B8', fontSize: '10.5px', marginBottom: '2px' }}>Alamat TKP</div>
                  <div style={{ fontWeight: 600, color: '#CBD5E1', lineHeight: 1.3 }}>
                    📍 {broadcastModalData.tkpAlamatTeks || '-'}
                  </div>
                </div>
              </div>

              {/* QR Code Container */}
              {(() => {
                const ticketNo = broadcastModalData.nomorTiket || broadcastModalData.id;
                const origin = typeof window !== 'undefined' ? window.location.origin : '';
                const trackingToken = broadcastModalData.trackingToken || (typeof btoa !== 'undefined' ? btoa(String(ticketNo)).slice(0, 10) : 'presisi110');
                const trackingUrl = `${origin}/tracking?tiket=${encodeURIComponent(ticketNo)}&token=${encodeURIComponent(trackingToken)}`;
                const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(trackingUrl)}&margin=10`;
                const cleanPhone = (broadcastModalData.pelaporHp || simCaller.telepon || '').replace(/\D/g, '').replace(/^0/, '62');
                const waMessage = `Halo Bapak/Ibu ${broadcastModalData.pelaporNama || 'Warga'},\n\nPengaduan Anda telah kami terima di Layanan Polisi 110 dengan Nomor Tiket: *${ticketNo}*.\n\nLaporan ini telah disiarkan ke seluruh armada patroli terdekat. Anda dapat memantau pergerakan personel dan radar taktis secara langsung melalui tautan resmi berikut:\n${trackingUrl}\n\nTerima kasih. - Sentra Pelayanan Kepolisian Terpadu 110`;
                const waHref = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMessage)}`;

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
                    <div
                      style={{
                        background: '#FFFFFF',
                        padding: '12px',
                        borderRadius: '16px',
                        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={qrUrl}
                        alt={`QR Code Lacak ${ticketNo}`}
                        width={180}
                        height={180}
                        style={{ display: 'block', borderRadius: '8px' }}
                      />
                    </div>
                    <div style={{ textAlign: 'center', fontSize: '11.5px', color: '#94A3B8', maxWidth: '360px', lineHeight: 1.4 }}>
                      Scan QR Code di atas menggunakan kamera handphone warga untuk membuka radar pelacakan pergerakan petugas secara live.
                    </div>

                    {/* Copy Link Input Bar */}
                    <div style={{ width: '100%', display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        readOnly
                        value={trackingUrl || ''}
                        style={{
                          flex: 1,
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: '8px',
                          padding: '10px 12px',
                          color: '#ECC473',
                          fontSize: '11.5px',
                          fontFamily: 'monospace',
                          outline: 'none',
                        }}
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(trackingUrl);
                            setIsCopied(true);
                            setTimeout(() => setIsCopied(false), 2500);
                          } catch (_) { }
                        }}
                        style={{
                          padding: '10px 16px',
                          background: isCopied ? '#10B981' : 'rgba(255, 255, 255, 0.12)',
                          color: '#FFFFFF',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {isCopied ? '✓ Tersalin!' : '📋 Salin Tautan'}
                      </button>
                    </div>

                    {/* Tombol Kirim WhatsApp */}
                    {cleanPhone && (
                      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <button
                          type="button"
                          disabled={isSendingWa}
                          onClick={async () => {
                            setIsSendingWa(true);
                            setWaSendResult(null);
                            try {
                              const res = await sendWhatsAppNotificationAction({
                                nomorTiket: ticketNo,
                                pelaporNama: broadcastModalData.pelaporNama,
                                pelaporHp: cleanPhone,
                                jenisKejadian: broadcastModalData.jenisKejadian,
                                tkpAlamatTeks: broadcastModalData.tkpAlamatTeks,
                                complaintId: broadcastModalData.id,
                              });
                              if (res.success) {
                                setWaSendResult({ success: true, text: res.statusText || 'Pesan berhasil dikirim via WhatsApp!' });
                                showFriendlyToast('success', 'WhatsApp Terkirim', `Notifikasi tiket ${ticketNo} telah dikirim ke nomor warga.`);
                              } else {
                                setWaSendResult({ success: false, text: res.error || res.statusText || 'Gagal mengirim pesan.' });
                                showFriendlyToast('error', 'Gagal Kirim WhatsApp', res.error || 'Terjadi kendala pengiriman.');
                              }
                            } catch (e: any) {
                              setWaSendResult({ success: false, text: e.message || 'Kendala koneksi' });
                            } finally {
                              setIsSendingWa(false);
                            }
                          }}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '10px',
                            fontWeight: 800,
                            fontSize: '13px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            cursor: isSendingWa ? 'not-allowed' : 'pointer',
                            opacity: isSendingWa ? 0.7 : 1,
                            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
                          }}
                        >
                          <span>{isSendingWa ? '⏳' : '⚡'}</span>
                          <span>{isSendingWa ? 'Mengirim pesan WhatsApp...' : 'Kirim Otomatis ke WhatsApp Warga'}</span>
                        </button>

                        {waSendResult && (
                          <div
                            style={{
                              padding: '8px 12px',
                              borderRadius: '8px',
                              fontSize: '11.5px',
                              background: waSendResult.success ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                              color: waSendResult.success ? '#34D399' : '#FCA5A5',
                              border: `1px solid ${waSendResult.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                              textAlign: 'center',
                            }}
                          >
                            {waSendResult.success ? '✓ ' : '⚠️ '}
                            {waSendResult.text}
                          </div>
                        )}

                        {/* Opsi Cadangan: WhatsApp Web Manual */}
                        <a
                          href={waHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            background: 'rgba(255, 255, 255, 0.06)',
                            color: '#25D366',
                            border: '1px solid rgba(37, 211, 102, 0.3)',
                            borderRadius: '10px',
                            fontWeight: 700,
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            textDecoration: 'none',
                          }}
                        >
                          <span>💬</span> Buka WhatsApp Web Manual (wa.me)
                        </a>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Footer Modal */}
            <div
              style={{
                padding: '14px 24px 20px',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                justifyContent: 'flex-end',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setBroadcastModalData(null);
                  setWaSendResult(null);
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#FFFFFF',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Tutup &amp; Kembali ke Konsol CAD
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL KONFIRMASI DISPOSISI LINTAS WILAYAH (INTER-POLRES) */}
      {transferModalItem && typeof document !== 'undefined' && createPortal(
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            background: 'rgba(11, 15, 25, 0.88)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            animation: 'fadeIn 0.2s ease-out',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !isTransferring) setTransferModalItem(null);
          }}
        >
          <div
            style={{
              background: '#0F172A',
              border: '1.5px solid rgba(245, 158, 11, 0.45)',
              borderRadius: '20px',
              maxWidth: '540px',
              width: '100%',
              boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.85), 0 0 30px rgba(245, 158, 11, 0.15)',
              overflow: 'hidden',
              color: '#F8FAFC',
              fontFamily: 'inherit',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '18px 24px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.05) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#0F172A',
                    fontSize: '18px',
                    fontWeight: 900,
                  }}
                >
                  🔄
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#FFFFFF' }}>
                    Disposisi Lintas Wilayah (E-Routing Boundary)
                  </div>
                  <div style={{ fontSize: '11px', color: '#FCD34D' }}>
                    Pengalihan Otoritas Penanganan ke Mako Tetangga
                  </div>
                </div>
              </div>
              <button
                type="button"
                disabled={isTransferring}
                onClick={() => setTransferModalItem(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94A3B8',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Informasi Tiket */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    padding: '12px 14px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>
                      NOMOR TIKET
                    </span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#FCD34D', fontSize: '13px' }}>
                      {transferModalItem.item.nomorTiket}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF', marginBottom: '2px' }}>
                    {transferModalItem.item.jenisKejadian}
                  </div>
                  <div style={{ fontSize: '11px', color: '#CBD5E1' }}>
                    📍 {transferModalItem.item.tkpAlamatTeks}
                  </div>
                </div>

                {/* Target Destination Card */}
                <div
                  style={{
                    background: 'rgba(245, 158, 11, 0.08)',
                    border: '1.5px solid rgba(245, 158, 11, 0.3)',
                    borderRadius: '12px',
                    padding: '14px',
                  }}
                >
                  <div style={{ fontSize: '10.5px', color: '#FCD34D', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>
                    MAKO TUJUAN PENGALIHAN
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 900, color: '#FFFFFF', marginBottom: '4px' }}>
                    {transferModalItem.boundary.targetStation?.stationName || 'Polresta Batang'}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#E2E8F0', marginBottom: '8px' }}>
                    🏢 {transferModalItem.boundary.targetStation?.address || 'Kabupaten Batang'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#FDE68A', background: 'rgba(0,0,0,0.3)', padding: '6px 10px', borderRadius: '6px' }}>
                    ℹ️ {transferModalItem.boundary.reason}
                  </div>
                </div>

                {/* Single Source of Truth Notice */}
                <div style={{ fontSize: '11px', color: '#94A3B8', lineHeight: 1.5, background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  💡 <strong>Info Transparansi:</strong> Status pelacakan di ponsel warga pelapor otomatis terkoordinasi secara langsung pada tautan tracking resmi. Tidak ada notifikasi WhatsApp tambahan yang mengganggu warga.
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div
              style={{
                padding: '14px 24px 20px',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                gap: '10px',
              }}
            >
              <button
                type="button"
                disabled={isTransferring}
                onClick={() => setTransferModalItem(null)}
                style={{
                  flex: 1,
                  padding: '11px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#CBD5E1',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '12.5px',
                  cursor: isTransferring ? 'not-allowed' : 'pointer',
                }}
              >
                Batal
              </button>
              <button
                type="button"
                id="btn-konfirmasi-transfer-lintas"
                disabled={isTransferring}
                onClick={handleExecuteTransfer}
                style={{
                  flex: 2,
                  padding: '11px 16px',
                  background: isTransferring ? '#94A3B8' : 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                  color: '#0F172A',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 900,
                  fontSize: '12.5px',
                  cursor: isTransferring ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(217, 119, 6, 0.35)',
                }}
              >
                {isTransferring ? '⏳ Mengalihkan ke Mako Tujuan...' : `⚡ Alihkan ke ${transferModalItem.boundary.targetStation?.stationName || 'Mako Tujuan'}`}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL PENYELESAIAN DI MEJA OPERATOR (LAYANAN INFORMASI / SOP) */}
      {deskResolveModalData && typeof document !== 'undefined' && createPortal(
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            background: 'rgba(11, 15, 25, 0.88)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '560px',
              background: '#0F172A',
              border: '1.5px solid rgba(16, 185, 129, 0.4)',
              borderRadius: '16px',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '92vh',
            }}
          >
            {/* Header Modal */}
            <div
              style={{
                padding: '18px 24px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.05) 100%)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    fontSize: '18px',
                    fontWeight: 900,
                  }}
                >
                  🎧
                </div>
                <div>
                  <div style={{ fontSize: '14.5px', fontWeight: 800, color: '#FFFFFF' }}>
                    Selesai
                  </div>
                  <div style={{ fontSize: '11px', color: '#6EE7B7' }}>
                    Layanan Informasi & Konsultasi
                  </div>
                </div>
              </div>
              <button
                type="button"
                disabled={isResolvingDesk}
                onClick={() => setDeskResolveModalData(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94A3B8',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                ✕
              </button>
            </div>

            {/* Body Modal */}
            <div style={{ padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Ringkasan Data Tiket / Pelapor */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>
                    PELAPOR
                  </span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#ECC473', fontSize: '12.5px' }}>
                    {deskResolveModalData.nomorTiket || 'Tiket Otomatis'}
                  </span>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>
                  {deskResolveModalData.namaPelapor} ({deskResolveModalData.teleponPelapor})
                </div>
                <div style={{ fontSize: '11.5px', color: '#CBD5E1' }}>
                  📌 <strong>Kategori:</strong> {deskResolveModalData.jenisKejadian || 'Konsultasi 110'}
                </div>
                {deskResolveModalData.alamatTkp && (
                  <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                    📍 {deskResolveModalData.alamatTkp}
                  </div>
                )}
              </div>

              {/* Input Catatan SOP / Penjelasan Operator */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '11.5px',
                    fontWeight: 800,
                    color: '#E2E8F0',
                    marginBottom: '6px',
                  }}
                >
                  Catatan Penjelasan / Petunjuk SOP yang Diberikan ke Warga <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <textarea
                  rows={4}
                  value={deskResolveModalData.resolutionNotes || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDeskResolveModalData((prev) => prev ? { ...prev, resolutionNotes: val } : null);
                  }}
                  placeholder="Contoh: Warga menanyakan syarat pembuatan SKCK baru. Operator telah menjelaskan berkas persyaratan (KTP, KK, Akta Lahir, pasfoto 4x6 latar merah 4 lbr, surat pengantar desa/kelurahan) serta jam operasional loket SPKT..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: '#0B1120',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    borderRadius: '10px',
                    color: '#FFFFFF',
                    fontSize: '12.5px',
                    lineHeight: 1.5,
                    resize: 'vertical',
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                />
                <span style={{ fontSize: '10.5px', color: '#94A3B8', marginTop: '4px', display: 'block' }}>
                  Catatan ini akan tersimpan di audit log resmi serta ditampilkan pada bukti pelacakan warga.
                </span>
              </div>

              {/* Checkbox WhatsApp */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={Boolean(deskResolveModalData.sendWa)}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setDeskResolveModalData((prev) => prev ? { ...prev, sendWa: checked } : null);
                  }}
                  style={{ marginTop: '2px', cursor: 'pointer' }}
                />
                <div style={{ fontSize: '11.5px', color: '#E2E8F0', lineHeight: 1.4 }}>
                  <strong style={{ color: '#34D399' }}>Kirim Konfirmasi WhatsApp & Tautan Kuesioner Warga</strong>
                  <div style={{ color: '#94A3B8', fontSize: '10.5px', marginTop: '2px' }}>
                    Pelapor otomatis menerima WhatsApp resmi berisi nomor tiket, ringkasan arahan SOP, dan tautan survei kepuasan mutu pelayanan operator.
                  </div>
                </div>
              </label>
            </div>

            {/* Footer Modal Actions */}
            <div
              style={{
                padding: '14px 24px 20px',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                gap: '10px',
              }}
            >
              <button
                type="button"
                disabled={isResolvingDesk}
                onClick={() => setDeskResolveModalData(null)}
                style={{
                  flex: 1,
                  padding: '11px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#CBD5E1',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '12.5px',
                  cursor: isResolvingDesk ? 'not-allowed' : 'pointer',
                }}
              >
                Batal
              </button>
              <button
                type="button"
                id="btn-konfirmasi-selesai-meja"
                disabled={isResolvingDesk || !deskResolveModalData.resolutionNotes.trim()}
                onClick={handleExecuteDeskResolution}
                style={{
                  flex: 2,
                  padding: '11px 16px',
                  background: isResolvingDesk || !deskResolveModalData.resolutionNotes.trim()
                    ? '#64748B'
                    : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 900,
                  fontSize: '12.5px',
                  cursor: isResolvingDesk || !deskResolveModalData.resolutionNotes.trim() ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                }}
              >
                {isResolvingDesk ? '⏳ Memproses Penyelesaian...' : '✅ Konfirmasi & Selesaikan di Meja'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
