'use client';

import React from 'react';

interface ModalKuatPersProps {
  isOpen: boolean;
  onClose: () => void;
  registeredUnits: any[];
  fleetUnits: any[];
}

export default function ModalKuatPers({
  isOpen,
  onClose,
  registeredUnits,
  fleetUnits,
}: ModalKuatPersProps) {
  if (!isOpen) return null;

  const meluncurCount = registeredUnits.filter(
    (u) => u.dutyStatus === 'DINAS_PATROLI' || u.dutyStatus === 'MENUJU_TKP'
  ).length;
  const cadanganCount = registeredUnits.filter(
    (u) => u.dutyStatus === 'CADANGAN' || u.dutyStatus === 'LEPAS_DINAS'
  ).length;
  const siagaCount = Math.max(0, registeredUnits.length - meluncurCount - cadanganCount);

  return (
    <div
      id="modal-detail-kuat-personel"
      className="pawas-modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        background: 'rgba(15,23,42,0.8)',
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
          borderRadius: '16px',
          maxWidth: '860px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.45)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            background: 'linear-gradient(135deg, #1E3A8A 0%, #1D4ED8 100%)',
            color: 'white',
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '20px' }}>🛡️</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Gelar Pasukan &amp; Alutsista Patroli Presisi</h3>
              <span style={{ fontSize: '11.5px', opacity: 0.9 }}>
                Daftar Riil Kekuatan {registeredUnits.length} Personel Terdaftar, Penugasan Operasi Lapangan, dan {fleetUnits.length} Unit Ranmor Dinas
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'white', fontSize: '18px', cursor: 'pointer', padding: '4px' }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: '18px 20px', overflowY: 'auto', flex: 1, background: '#F8FAFC' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))', gap: '10px', marginBottom: '16px' }}>
            <div style={{ background: 'white', border: '1px solid #BFDBFE', borderRadius: '10px', padding: '10px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#1D4ED8' }}>TOTAL KUAT</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#1E3A8A' }}>{registeredUnits.length} PERS</div>
            </div>
            <div style={{ background: 'white', border: '1px solid #BBF7D0', borderRadius: '10px', padding: '10px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#166534' }}>🟢 Siaga Mako</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#16A34A' }}>{siagaCount} Pers</div>
            </div>
            <div style={{ background: 'white', border: '1px solid #BFDBFE', borderRadius: '10px', padding: '10px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#1E40AF' }}>🔵 Meluncur/TKP</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#2563EB' }}>{meluncurCount} Pers</div>
            </div>
            <div style={{ background: 'white', border: '1px solid #FDE68A', borderRadius: '10px', padding: '10px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#92400E' }}>🟡 Cadangan</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#D97706' }}>{cadanganCount} Pers</div>
            </div>
            <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '10px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#475569' }}>🚔 Ranmor Dinas</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#0F172A' }}>{fleetUnits.length} UNIT</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {registeredUnits.map((u: any) => (
              <div
                key={u.nrp}
                style={{
                  background: 'white',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: '13px', color: '#1E293B' }}>
                    {u.pangkat} {u.nama}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>
                    NRP: {u.nrp} • Satuan: {u.satuanNama || u.unitId}
                  </div>
                </div>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#15803D', background: '#DCFCE7', padding: '2px 8px', borderRadius: '4px' }}>
                  🟢 Siaga Dinas
                </span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: '12px 20px', background: 'white', borderTop: '1px solid #E2E8F0', textAlign: 'right' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '10px 20px',
              background: '#F1F5F9',
              color: '#334155',
              fontSize: '12.5px',
              fontWeight: 700,
              border: '1px solid #CBD5E1',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            Tutup Rincian
          </button>
        </div>
      </div>
    </div>
  );
}
