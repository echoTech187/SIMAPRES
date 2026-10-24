'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, ShieldAlert, CheckCircle2 } from 'lucide-react';

export interface ModalTolakPengaduanProps {
  isOpen: boolean;
  onClose: () => void;
  complaint: any;
  onConfirmReject: (reason: string, notes: string) => Promise<void>;
  loading?: boolean;
}

const DEFAULT_REASONS = [
  {
    key: 'PALSU_SPAM',
    label: 'Laporan Palsu / Fiktif / Prank / Spam',
    desc: 'Terindikasi laporan fiktif, iseng, atau tidak ada kejadian nyata di lokasi.',
  },
  {
    key: 'BUKAN_WEWENANG',
    label: 'Bukan Kewenangan Polri (Disarankan ke instansi terkait)',
    desc: 'Masalah perdata, sengketa internal, atau ranah instansi lain (PLN, Damkar, Satpol PP, dll).',
  },
  {
    key: 'LUAR_WILAYAH',
    label: 'Lokasi Kejadian di Luar Wilayah Hukum Polres',
    desc: 'Titik koordinat atau TKP berada di luar yurisdiksi kepolisian resor setempat.',
  },
  {
    key: 'KURANG_LENGKAP',
    label: 'Informasi / Bukti Tidak Jelas atau Tidak Lengkap',
    desc: 'Alamat tidak ditemukan, nomor pelapor tidak dapat dihubungi, atau data tidak valid.',
  },
  {
    key: 'LAINNYA',
    label: 'Lainnya',
    desc: 'Alasan diskresi khusus dari Pawas / Perwira Pengawas.',
  },
];

export default function ModalTolakPengaduan({
  isOpen,
  onClose,
  complaint,
  onConfirmReject,
  loading = false,
}: ModalTolakPengaduanProps) {
  const [selectedReason, setSelectedReason] = useState<string>(DEFAULT_REASONS[0].label);
  const [catatanPenolakan, setCatatanPenolakan] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setSelectedReason(DEFAULT_REASONS[0].label);
      setCatatanPenolakan('');
      setErrorMessage('');
    }
  }, [isOpen, complaint]);

  if (!isOpen || !complaint) return null;

  const isLainnya = selectedReason === 'Lainnya';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLainnya && !catatanPenolakan.trim()) {
      setErrorMessage('Catatan penolakan wajib diisi jika memilih alasan "Lainnya"!');
      return;
    }
    setErrorMessage('');
    await onConfirmReject(selectedReason, catatanPenolakan.trim());
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.72)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #F1F5F9',
            background: 'linear-gradient(180deg, #FEF2F2 0%, #FFFFFF 100%)',
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
                background: '#FEE2E2',
                color: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <AlertTriangle size={20} strokeWidth={2.4} />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>
                Tolak Pengaduan Masyarakat
              </div>
              <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
                Konfirmasi penolakan resmi atas laporan yang tidak memenuhi syarat
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={{
              background: '#F1F5F9',
              border: 'none',
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748B',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body (Scrollable) */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div style={{ padding: '18px 20px', overflowY: 'auto', flex: 1 }}>
            {/* Ringkasan Tiket */}
            <div
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '10px',
                padding: '12px 14px',
                marginBottom: '16px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#153E75', letterSpacing: '0.5px' }}>
                  {complaint.nomorTiket || complaint.nomor_tiket}
                </span>
                <span
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: '#FEF3C7',
                    color: '#B45309',
                    border: '1px solid #FDE68A',
                  }}
                >
                  Menunggu Validasi
                </span>
              </div>
              <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>
                {complaint.jenisKejadian || complaint.jenis_kejadian || 'Laporan Pengaduan'}
              </div>
              <div style={{ fontSize: '11px', color: '#64748B', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                <span>👤 {complaint.pelaporNama || complaint.pelapor_nama || 'Warga'}</span>
                <span>📞 {complaint.pelaporHp || complaint.pelapor_hp || '-'}</span>
              </div>
              {complaint.tkpAlamatTeks && (
                <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
                  📍 {complaint.tkpAlamatTeks}
                </div>
              )}
            </div>

            {/* Pilihan Alasan Baku */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
                Pilih Alasan Baku Penolakan: <span style={{ color: '#DC2626' }}>*</span>
              </label>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {DEFAULT_REASONS.map((reason) => {
                  const isSelected = selectedReason === reason.label;
                  return (
                    <div
                      key={reason.key}
                      onClick={() => {
                        setSelectedReason(reason.label);
                        if (reason.key !== 'LAINNYA') setErrorMessage('');
                      }}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: isSelected ? '1.5px solid #DC2626' : '1px solid #E2E8F0',
                        background: isSelected ? '#FEF2F2' : '#FFFFFF',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <input
                        type="radio"
                        name="rejectionReason"
                        checked={isSelected}
                        onChange={() => {
                          setSelectedReason(reason.label);
                          if (reason.key !== 'LAINNYA') setErrorMessage('');
                        }}
                        style={{ marginTop: '2px', accentColor: '#DC2626', cursor: 'pointer' }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: isSelected ? '#991B1B' : '#1E293B' }}>
                          {reason.label}
                        </div>
                        <div style={{ fontSize: '10.5px', color: isSelected ? '#B91C1C' : '#64748B', marginTop: '2px' }}>
                          {reason.desc}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Catatan Penolakan Tambahan */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 800, color: '#0F172A' }}>
                  Catatan &amp; Penjelasan Penolakan: {isLainnya && <span style={{ color: '#DC2626' }}>*</span>}
                </label>
                <span style={{ fontSize: '10px', color: '#64748B' }}>
                  {isLainnya ? 'Wajib diisi' : 'Opsional'}
                </span>
              </div>
              <textarea
                rows={3}
                value={catatanPenolakan}
                onChange={(e) => {
                  setCatatanPenolakan(e.target.value);
                  if (e.target.value.trim()) setErrorMessage('');
                }}
                placeholder={
                  isLainnya
                    ? 'Tuliskan alasan penolakan secara spesifik di sini (wajib)...'
                    : 'Tambahkan catatan penjelasan jika diperlukan...'
                }
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: errorMessage ? '1px solid #DC2626' : '1px solid #CBD5E1',
                  fontSize: '12px',
                  color: '#0F172A',
                  outline: 'none',
                  lineHeight: 1.5,
                  boxSizing: 'border-box',
                  resize: 'none',
                }}
              />
              {errorMessage && (
                <div style={{ fontSize: '11px', color: '#DC2626', fontWeight: 600, marginTop: '4px' }}>
                  {errorMessage}
                </div>
              )}
            </div>

            {/* Warning Box */}
            <div
              style={{
                background: '#FFFBEB',
                border: '1px solid #FDE68A',
                borderRadius: '8px',
                padding: '9px 12px',
                fontSize: '11px',
                color: '#92400E',
                lineHeight: 1.45,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <ShieldAlert size={16} style={{ flexShrink: 0, color: '#D97706' }} />
              <span>
                <strong>Catatan SOP:</strong> Laporan yang ditolak akan langsung dipindahkan ke tab <strong>Ditolak</strong> dan nomor tiket ini tidak akan diteruskan ke personil patroli.
              </span>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '14px 20px',
              borderTop: '1px solid #E2E8F0',
              background: '#F8FAFC',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '9px 16px',
                borderRadius: '8px',
                background: '#FFFFFF',
                border: '1px solid #CBD5E1',
                color: '#475569',
                fontSize: '12px',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              Batalkan
            </button>
            <button
              type="submit"
              disabled={loading || (isLainnya && !catatanPenolakan.trim())}
              style={{
                padding: '9px 20px',
                borderRadius: '8px',
                background: loading || (isLainnya && !catatanPenolakan.trim()) ? '#FCA5A5' : '#DC2626',
                border: 'none',
                color: '#FFFFFF',
                fontSize: '12.5px',
                fontWeight: 800,
                cursor: loading || (isLainnya && !catatanPenolakan.trim()) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 6px rgba(220, 38, 38, 0.3)',
                transition: 'all 0.15s ease',
              }}
            >
              {loading ? (
                'Memproses...'
              ) : (
                <>
                  <span>✕</span> Konfirmasi Tolak Laporan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
