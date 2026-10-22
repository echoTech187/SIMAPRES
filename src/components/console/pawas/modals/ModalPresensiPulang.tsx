'use client';

import React, { useState } from 'react';

interface ModalPresensiPulangProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmPulang: () => void;
}

export default function ModalPresensiPulang({
  isOpen,
  onClose,
  onConfirmPulang,
}: ModalPresensiPulangProps) {
  const [chk1, setChk1] = useState(false);
  const [chk2, setChk2] = useState(false);

  if (!isOpen) return null;

  return (
    <div
      id="modal-presensi-pulang"
      className="pawas-modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(15,23,42,0.8)',
        backdropFilter: 'blur(4px)',
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
          borderRadius: '14px',
          maxWidth: '460px',
          width: '100%',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)',
          border: '1px solid #CBD5E1',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ background: '#DC2626', color: 'white', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '22px' }}>🚪</span>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0 }}>Konfirmasi Presensi Pulang</h3>
              <div style={{ fontSize: '11px', opacity: 0.9 }}>Serah Terima Tugas Piket</div>
            </div>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', fontSize: '18px', cursor: 'pointer', padding: '4px' }}>✕</button>
        </div>

        <div style={{ padding: '20px', fontSize: '12.5px', flex: 1, overflowY: 'auto' }}>
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '12px', marginBottom: '16px', color: '#991B1B' }}>
            <strong>Perhatian:</strong> Anda akan mengakhiri sesi dinas piket hari ini. Pastikan hal-hal berikut telah terpenuhi:
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={chk1}
                onChange={(e) => setChk1(e.target.checked)}
                style={{ accentColor: '#15803D', width: '16px', height: '16px' }}
              />
              <span>Seluruh laporan penugasan aktif telah diperbarui statusnya.</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={chk2}
                onChange={(e) => setChk2(e.target.checked)}
                style={{ accentColor: '#15803D', width: '16px', height: '16px' }}
              />
              <span>Siap melakukan apel serah terima kepada regu piket pengganti.</span>
            </label>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ flex: 1, padding: '10px', background: '#F1F5F9', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '12.5px', cursor: 'pointer' }}
            >
              Batal
            </button>
            <button
              type="button"
              onClick={onConfirmPulang}
              style={{ flex: 1.5, padding: '10px', background: '#DC2626', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '12.5px', cursor: 'pointer' }}
            >
              <span>✓</span> Konfirmasi Pulang
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
