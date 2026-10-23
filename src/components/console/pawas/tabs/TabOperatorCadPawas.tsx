'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import Select2CategoryDropdown from '@/components/Select2CategoryDropdown';
import { createComplaintAndBroadcastAction, sendWhatsAppNotificationAction } from '@/app/actions/complaint.actions';
import { PawasTab } from '../types';

const MiniMapPicker = dynamic(() => import('@/components/MiniMapPicker'), {
  ssr: false,
  loading: () => <div style={{ height: '220px', background: '#E2E8F0' }} />,
});

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
}: TabOperatorCadPawasProps) {
  const [broadcastModalData, setBroadcastModalData] = useState<any | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [showMapPickerCad, setShowMapPickerCad] = useState(false);
  const [isSendingWa, setIsSendingWa] = useState(false);
  const [waSendResult, setWaSendResult] = useState<{ success?: boolean; text?: string } | null>(null);

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div
          onClick={() => switchTab('view-beranda')}
          style={{ fontSize: '13px', fontWeight: 700, color: '#153E75', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <span>←</span> Kembali ke Beranda
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 className="page-title" style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>
            Konsol Pengaduan &amp; Disposisi Terpadu
          </h2>
          <div style={{ color: '#64748B', fontSize: '12px' }}>
            Perekaman Laporan Masyarakat Masuk &amp; Penugasan Unit Patroli
          </div>
        </div>
        <span style={{ fontSize: '11.5px', fontWeight: 800, background: '#EFF6FF', color: '#1D4ED8', padding: '5px 12px', borderRadius: '8px', border: '1px solid #BFDBFE' }}>
          👑 Akses Penuh: Input Laporan &amp; Disposisi Unit
        </span>
      </div>

      <div className="cad-operator-grid">
        {/* Kolom Kiri: Panggilan Masuk & Form */}
        <div style={{ width: '100%', minWidth: 0 }}>

          {/* Formulir Penerimaan Laporan */}
          <div id="cad-form-container" style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px', borderBottom: '1px solid #E2E8F0', paddingBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#153E75' }}>📝 Formulir Penerimaan Laporan</span>
              <span style={{ fontSize: '11px', color: '#64748B' }}>Petugas: <strong>{userProfile?.fullName || userProfile?.nama}</strong></span>
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
                <span style={{ fontSize: '10px', color: '#64748B', fontWeight: 600 }}>Format Baku: TICKET-0018xxxxxx</span>
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
                  placeholder="Contoh: TICKET-0018396186 (Kosongkan jika ingin auto-generate)"
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
                value={simCaller.telepon}
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
                value={simCaller.nama}
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
                      setSimCaller({
                        ...simCaller,
                        subcategoryId: item.id,
                        kategori: item.nama_kasus,
                        kategoriKey: item.category_key,
                        urgensi: (item.default_urgensi as any) || simCaller.urgensi,
                        uraian: simCaller.uraian,
                      });
                      if (cadFormErrors.kategori || cadFormErrors.urgensi) {
                        setCadFormErrors((prev) => {
                          const next = { ...prev };
                          delete next.kategori;
                          delete next.urgensi;
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
                        {lvl.icon_emoji ? `${lvl.icon_emoji} ` : ''}{lvl.label}
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
                  value={simCaller.alamat}
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
                        <span style={{ fontSize: '16px', lineHeight: 1.2 }}>📍</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.label}
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
                            <span style={{ fontSize: '14px' }}>📍</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '12px', fontWeight: 600, color: '#F8FAFC', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {item.label}
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
                value={simCaller.uraian}
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
              {cadFormErrors.uraian && (
                <div style={{ marginTop: '4px', fontSize: '11px', color: '#DC2626', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                  <span>⚠️</span> {cadFormErrors.uraian}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
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
                  } catch (err: any) {
                    showFriendlyToast('error', 'Terjadi Kendala Sistem', err.message || 'Sistem tidak dapat memproses laporan saat ini.');
                  } finally {
                    setLoading(false);
                  }
                }}
                style={{
                  flex: 1,
                  padding: '14px 20px',
                  background: loading ? '#94A3B8' : 'linear-gradient(135deg, #ECC473 0%, #C99635 100%)',
                  color: '#111827',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 900,
                  fontSize: '13.5px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 15px rgba(201, 150, 53, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  letterSpacing: '0.3px',
                  transition: 'all 0.15s ease',
                }}
              >
                {loading ? '⏳ Menyiarkan ke Seluruh Armada...' : '⚡ Simpan & Disposisikan'}
              </button>
            </div>
          </div>

        </div>

        {/* Kolom Kanan: Antrean Laporan & Disposisi Live */}
        <div style={{ width: '100%', minWidth: 0 }}>
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
                      📍 {item.tkpAlamatTeks}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        bukaModalDisposisi(item);
                      }}
                      style={{ width: '100%', padding: '7px', background: '#153E75', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 800, fontSize: '11.5px', cursor: 'pointer' }}
                    >
                      ⚡ Disposisi Unit Sekarang ➔
                    </button>
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
                        value={trackingUrl}
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
                          } catch (_) {}
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
                                setWaSendResult({ success: true, text: res.statusText || 'Pesan berhasil dikirim via FlowKirim!' });
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
                          <span>{isSendingWa ? 'Mengirim via FlowKirim Gateway...' : 'Kirim Otomatis ke WhatsApp Warga (FlowKirim)'}</span>
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
    </div>
  );
}
