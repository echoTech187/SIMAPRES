'use client';

import React from 'react';
import { createPortal } from 'react-dom';

export interface CadTransferModalProps {
  transferModalItem: { item: any; boundary: any } | null;
  isTransferring: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
}

export const CadTransferModal: React.FC<CadTransferModalProps> = ({
  transferModalItem,
  isTransferring,
  onClose,
  onConfirm,
}) => {
  if (!transferModalItem || typeof document === 'undefined') return null;

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
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isTransferring) onClose();
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
              cursor: isTransferring ? 'not-allowed' : 'pointer',
            }}
          >
            Batal
          </button>
          <button
            type="button"
            id="btn-konfirmasi-transfer-lintas"
            disabled={isTransferring}
            onClick={onConfirm}
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
  );
};
