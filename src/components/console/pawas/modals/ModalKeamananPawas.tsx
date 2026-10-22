'use client';

import React from 'react';

interface ModalKeamananPawasProps {
  isOpen: boolean;
  onClose: () => void;
  session?: any;
  pinOtorisasiPawas: string[];
  setPinOtorisasiPawas: React.Dispatch<React.SetStateAction<string[]>>;
  showFriendlyToast: (type: 'success' | 'warning' | 'error' | 'info', title: string, message: string) => void;
}

export default function ModalKeamananPawas({
  isOpen,
  onClose,
  session,
  pinOtorisasiPawas,
  setPinOtorisasiPawas,
  showFriendlyToast,
}: ModalKeamananPawasProps) {
  if (!isOpen) return null;

  return (
    <div
      id="modal-keamanan"
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
      onClick={onClose}
    >
      <div
        className="pawas-modal-dialog"
        style={{
          background: 'white',
          width: '100%',
          maxWidth: '460px',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)',
          border: '1px solid #CBD5E1',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ background: '#153E75', color: 'white', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>🔒</span>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0 }}>Keamanan Akun &amp; PIN Komando</h3>
              <div style={{ fontSize: '11px', opacity: 0.85 }}>Kredensial SIPP Mabes Polri &amp; Otorisasi Dinas</div>
            </div>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', fontSize: '18px', cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ padding: '20px' }}>
          <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '10px', padding: '12px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#166534' }}>Autentikasi 2-Faktor (2FA) Aktif</div>
              <div style={{ fontSize: '11px', color: '#15803D' }}>Token Terverifikasi • {session?.identifier ? `NRP: ${session.identifier}` : '-'}</div>
            </div>
            <span style={{ background: '#15803D', color: 'white', fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '10px' }}>SIAP</span>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Kata Sandi</label>
            <input type="password" placeholder="Masukkan kata sandi baru..." style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '13px' }} />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>PIN Otorisasi Disposisi (6-Digit)</label>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              {pinOtorisasiPawas.map((d, i) => (
                <input
                  key={i}
                  type="password"
                  maxLength={1}
                  value={d}
                  onChange={(e) => {
                    const val = e.target.value.slice(-1);
                    setPinOtorisasiPawas((prev) => {
                      const next = [...prev];
                      next[i] = val;
                      return next;
                    });
                  }}
                  style={{ width: '40px', height: '45px', textAlign: 'center', fontSize: '18px', fontWeight: 800, border: '2px solid #CBD5E1', borderRadius: '8px', background: '#F8FAFC' }}
                />
              ))}
            </div>
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
              onClick={() => {
                showFriendlyToast('success', 'Kredensial Diperbarui', 'Kredensial akun & PIN otorisasi dinas berhasil diperbarui.');
                onClose();
              }}
              style={{ flex: 2, padding: '10px', background: '#153E75', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '12.5px', cursor: 'pointer' }}
            >
              💾 Simpan Perubahan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
