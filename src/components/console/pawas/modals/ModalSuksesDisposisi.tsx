'use client';

import React from 'react';

interface ModalSuksesDisposisiProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    nomorTiket: string;
    unitName: string;
    komandan: string;
    jarak: string;
    eta: string;
  } | null;
}

export default function ModalSuksesDisposisi({
  isOpen,
  onClose,
  data,
}: ModalSuksesDisposisiProps) {
  if (!isOpen || !data) return null;

  return (
    <div
      id="modal-sukses-disposisi"
      className="pawas-modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999999,
        background: 'rgba(15,23,42,0.82)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        className="pawas-modal-dialog"
        style={{
          background: 'white',
          width: '100%',
          maxWidth: '520px',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.45)',
          overflow: 'hidden',
          border: '1px solid #CBD5E1',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            background: 'linear-gradient(135deg, #064E3B 0%, #065F46 60%, #047857 100%)',
            color: 'white',
            padding: '24px 20px',
            textAlign: 'center',
            position: 'relative',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '4px',
            }}
            title="Tutup Modal"
          >
            ✕
          </button>
          <div
            style={{
              width: '58px',
              height: '58px',
              background: 'rgba(255,255,255,0.2)',
              border: '2px solid rgba(255,255,255,0.4)',
              borderRadius: '50%',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              marginBottom: '12px',
            }}
          >
            ✓
          </div>
          <div style={{ fontSize: '17px', fontWeight: 900, textTransform: 'uppercase' }}>
            Perintah Disposisi Berhasil Diterbitkan!
          </div>
          <div style={{ fontSize: '12px', color: '#A7F3D0', marginTop: '4px' }}>
            Instruksi operasi telah ditransmisikan ke WhatsApp resmi &amp; konsol petugas lapangan
          </div>
        </div>

        <div style={{ padding: '18px 20px', flex: 1, overflowY: 'auto' }}>
          <div
            style={{
              background: '#FEF3C7',
              border: '1.5px dashed #F59E0B',
              borderRadius: '10px',
              padding: '10px 14px',
              marginBottom: '14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: '10px', fontWeight: 800, color: '#B45309' }}>NOMOR TIKET RESMI</div>
              <div style={{ fontFamily: 'monospace', fontSize: '16px', fontWeight: 900, color: '#92400E' }}>
                {data.nomorTiket}
              </div>
            </div>
            <span style={{ fontSize: '10.5px', fontWeight: 800, background: '#DCFCE7', color: '#166534', padding: '3px 8px', borderRadius: '6px' }}>
              ● LIVE CAD DISPATCH
            </span>
          </div>

          <div
            style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              fontSize: '12px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: '6px' }}>
              <span style={{ color: '#64748B' }}>🚔 Satuan Bertugas:</span>
              <strong>{data.unitName}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: '6px' }}>
              <span style={{ color: '#64748B' }}>👤 Pimpinan Regu:</span>
              <strong style={{ color: '#1E40AF' }}>{data.komandan}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: '6px' }}>
              <span style={{ color: '#64748B' }}>📍 Estimasi Jarak GPS:</span>
              <strong style={{ color: '#1D4ED8' }}>{data.jarak} ({data.eta})</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748B' }}>⚡ Quick Response Target:</span>
              <strong style={{ color: '#15803D' }}>&lt; 10 Menit Tiba di TKP (SLA Aman ✅)</strong>
            </div>
          </div>
        </div>

        <div style={{ padding: '14px 20px', borderTop: '1px solid #E2E8F0', background: '#F8FAFC', textAlign: 'right' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: '100%',
              padding: '12px 20px',
              background: 'linear-gradient(135deg, #153E75 0%, #1E40AF 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Pantau Penanganan di Timeline ➔
          </button>
        </div>
      </div>
    </div>
  );
}
