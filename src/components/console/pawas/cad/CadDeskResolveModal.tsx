'use client';

import React from 'react';
import { createPortal } from 'react-dom';

export interface CadDeskResolveModalProps {
  deskResolveModalData: {
    isFromCadForm: boolean;
    item?: any;
    nomorTiket: string;
    namaPelapor: string;
    teleponPelapor: string;
    jenisKejadian: string;
    alamatTkp: string;
    resolutionNotes: string;
    sendWa: boolean;
  } | null;
  setDeskResolveModalData: React.Dispatch<React.SetStateAction<any>>;
  isResolvingDesk: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
}

export const CadDeskResolveModal: React.FC<CadDeskResolveModalProps> = ({
  deskResolveModalData,
  setDeskResolveModalData,
  isResolvingDesk,
  onClose,
  onConfirm,
}) => {
  if (!deskResolveModalData || typeof document === 'undefined') return null;

  return createPortal(
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
            onClick={onClose}
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
                setDeskResolveModalData((prev: any) => prev ? { ...prev, resolutionNotes: val } : null);
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
                setDeskResolveModalData((prev: any) => prev ? { ...prev, sendWa: checked } : null);
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
            onClick={onClose}
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
            onClick={onConfirm}
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
  );
};
