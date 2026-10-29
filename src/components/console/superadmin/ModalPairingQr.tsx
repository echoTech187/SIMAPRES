'use client';

import React from 'react';
import ResponsiveModal from '@/components/ui/ResponsiveModal';

interface ModalPairingQrProps {
  isOpen: boolean;
  onClose: () => void;
  qrDataUrl: string;
  qrSessionToken: string;
}

export default function ModalPairingQr({
  isOpen,
  onClose,
  qrDataUrl,
  qrSessionToken,
}: ModalPairingQrProps) {
  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="440px"
      title="IKAT DEVICE GPS HP PERSONEL"
      subtitle="Scan QR ini menggunakan kamera HP petugas untuk aktivasi telemetry otomatis"
      icon="📱"
    >
      <div style={{ textAlign: 'center', padding: '10px 0' }}>
        {/* Box Wadah QR Code Presisi */}
        <div
          style={{
            width: '220px',
            height: '220px',
            margin: '0 auto 14px',
            background: '#FFFFFF',
            border: '2px solid #E2E8F0',
            borderRadius: '16px',
            boxShadow: '0 8px 24px -4px rgba(15, 23, 42, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
            padding: '8px',
            boxSizing: 'border-box',
          }}
        >
          {qrDataUrl ? (
            <>
              <img
                src={qrDataUrl}
                alt="QR Code Aktivasi HP Petugas"
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'block',
                  borderRadius: '8px',
                }}
              />
              {/* Badge Center Logo Presisi */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '38px',
                  height: '38px',
                  background: 'linear-gradient(135deg, #0D264A 0%, #153E75 100%)',
                  borderRadius: '8px',
                  border: '2px solid white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.25)',
                }}
              >
                🛡️
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '36px', marginBottom: '8px' }}>⏳</div>
              <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#64748B' }}>
                Membuat QR Code...
              </div>
            </div>
          )}
        </div>

        {/* Token Sesi Info */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: '#F1F5F9',
            border: '1px solid #CBD5E1',
            borderRadius: '8px',
            padding: '5px 12px',
            marginBottom: '14px',
            fontSize: '11.5px',
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 700,
            color: '#1E293B',
          }}
        >
          <span style={{ color: '#2563EB' }}>TOKEN:</span> {qrSessionToken}
        </div>

        <p style={{ fontSize: '12px', color: '#475569', lineHeight: 1.5, marginBottom: '16px' }}>
          Arahkan kamera HP petugas ke QR Code di atas untuk mengikat telemetry dinas.
        </p>

        <button
          type="button"
          onClick={onClose}
          style={{
            width: '100%',
            padding: '10px',
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '10px',
            fontSize: '12.5px',
            fontWeight: 700,
            color: '#64748B',
            cursor: 'pointer',
            transition: '0.2s',
          }}
        >
          Tutup
        </button>
      </div>
    </ResponsiveModal>
  );
}
