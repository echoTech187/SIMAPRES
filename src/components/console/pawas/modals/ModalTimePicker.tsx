'use client';

import React from 'react';

interface ModalTimePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTimeRange: (range: string) => void;
}

export default function ModalTimePicker({
  isOpen,
  onClose,
  onSelectTimeRange,
}: ModalTimePickerProps) {
  if (!isOpen) return null;

  return (
    <div
      id="modal-timepicker-log"
      className="pawas-modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000000,
        background: 'rgba(15,23,42,0.65)',
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
          maxWidth: '390px',
          width: '100%',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)',
          overflow: 'hidden',
          borderTop: '5px solid #153E75',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: '16px 20px 14px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '15px', fontWeight: 800, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '7px' }}>
            <span>📅</span> Pilih Rentang Jam Kegiatan
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', color: '#94A3B8', cursor: 'pointer', padding: '4px' }}>✕</button>
        </div>

        <div style={{ padding: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '10px', alignItems: 'center', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Jam Mulai</label>
              <input
                type="time"
                defaultValue=""
                id="tp-jam-mulai"
                style={{ width: '100%', padding: '10px 8px', border: '1.5px solid #CBD5E1', borderRadius: '8px', fontSize: '15px', fontWeight: 700, textAlign: 'center' }}
              />
            </div>
            <div style={{ paddingTop: '18px', fontWeight: 800, color: '#64748B' }}>s/d</div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Sampai Jam</label>
              <input
                type="time"
                defaultValue=""
                id="tp-jam-selesai"
                style={{ width: '100%', padding: '10px 8px', border: '1.5px solid #CBD5E1', borderRadius: '8px', fontSize: '15px', fontWeight: 700, textAlign: 'center' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button
              type="button"
              onClick={() => {
                onSelectTimeRange('08:00 - 16:00 WIB (Shift Pagi)');
                onClose();
              }}
              style={{ padding: '8px 10px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '11.5px', fontWeight: 700, textAlign: 'left', cursor: 'pointer' }}
            >
              ☀️ Shift Pagi (08:00 - 16:00)
            </button>
            <button
              type="button"
              onClick={() => {
                onSelectTimeRange('16:00 - 00:00 WIB (Shift Sore)');
                onClose();
              }}
              style={{ padding: '8px 10px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '11.5px', fontWeight: 700, textAlign: 'left', cursor: 'pointer' }}
            >
              🌇 Shift Sore (16:00 - 00:00)
            </button>
            <button
              type="button"
              onClick={() => {
                onSelectTimeRange('00:00 - 08:00 WIB (Shift Malam)');
                onClose();
              }}
              style={{ padding: '8px 10px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '11.5px', fontWeight: 700, textAlign: 'left', cursor: 'pointer' }}
            >
              🌙 Shift Malam (00:00 - 08:00)
            </button>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ flex: 1, background: '#F1F5F9', border: '1px solid #CBD5E1', padding: '11px', borderRadius: '8px', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => {
                const start = (document.getElementById('tp-jam-mulai') as HTMLInputElement)?.value || '09:00';
                const end = (document.getElementById('tp-jam-selesai') as HTMLInputElement)?.value || '14:30';
                onSelectTimeRange(`${start} - ${end} WIB`);
                onClose();
              }}
              style={{ flex: 1.4, background: '#153E75', border: 'none', color: 'white', padding: '11px', borderRadius: '8px', fontWeight: 800, fontSize: '12px', cursor: 'pointer' }}
            >
              <span>✓</span> Terapkan Waktu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
