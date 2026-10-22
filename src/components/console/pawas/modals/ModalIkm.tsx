'use client';

import React from 'react';

interface ModalIkmProps {
  isOpen: boolean;
  onClose: () => void;
  satisfactionRating: number;
  satisfactionPercent: number;
  complaints: any[];
}

export default function ModalIkm({
  isOpen,
  onClose,
  satisfactionRating,
  satisfactionPercent,
  complaints,
}: ModalIkmProps) {
  if (!isOpen) return null;

  const reviewedComplaints = complaints.filter((c) => c.citizenRating || c.citizenReview);

  return (
    <div
      id="modal-detail-ikm-warga"
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
          maxWidth: '840px',
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
            background: 'linear-gradient(135deg, #065F46 0%, #047857 100%)',
            color: 'white',
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '20px' }}>⭐</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Audit Indeks Kepuasan Masyarakat (IKM)</h3>
              <span style={{ fontSize: '11.5px', opacity: 0.9 }}>Transparansi Penilaian Riil Warga Pelapor Atas Penanganan Kasus</span>
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
            <div style={{ background: 'white', border: '1px solid #A7F3D0', borderRadius: '10px', padding: '10px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#065F46' }}>SKOR RATA-RATA</div>
              <div style={{ fontSize: '22px', fontWeight: 900, color: '#065F46', marginTop: '2px' }}>{satisfactionRating} / 5.0</div>
            </div>
            <div style={{ background: 'white', border: '1px solid #BBF7D0', borderRadius: '10px', padding: '10px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#15803D' }}>KEPUASAN WARGA</div>
              <div style={{ fontSize: '22px', fontWeight: 900, color: '#16A34A', marginTop: '2px' }}>{satisfactionPercent}%</div>
            </div>
            <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '10px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#1E40AF' }}>TOTAL ULASAN</div>
              <div style={{ fontSize: '22px', fontWeight: 900, color: '#153E75', marginTop: '2px' }}>
                {reviewedComplaints.length} Ulasan
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {reviewedComplaints.length > 0 ? (
              reviewedComplaints.map((item: any) => (
                <div key={item.id} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap', gap: '6px' }}>
                    <div>
                      <strong>{item.pelapor?.nama || item.pelaporNama || 'Masyarakat'}</strong>
                      {(item.lokasi?.alamat || item.tkpAlamatTeks) && (
                        <span style={{ fontSize: '11px', color: '#64748B', marginLeft: '6px' }}>
                          ({item.lokasi?.alamat || item.tkpAlamatTeks})
                        </span>
                      )}
                    </div>
                    {item.citizenRating ? (
                      <span style={{ color: '#F59E0B', fontSize: '12px', letterSpacing: '2px' }}>
                        {'★'.repeat(item.citizenRating)}{'☆'.repeat(5 - item.citizenRating)}
                      </span>
                    ) : (
                      <span style={{ color: '#94A3B8', fontSize: '11px', fontStyle: 'italic' }}>
                        (Tanpa rating bintang)
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '12px', color: '#475569', fontStyle: 'italic', marginBottom: '6px' }}>
                    {item.citizenReview ? `"${item.citizenReview}"` : '(Warga memberikan rating bintang tanpa ulasan tertulis)'}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', fontSize: '10px', flexWrap: 'wrap' }}>
                    <span style={{ background: '#F1F5F9', color: '#475569', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                      {item.nomor_laporan || item.nomorTiket}
                    </span>
                    <span style={{ background: '#EFF6FF', color: '#1D4ED8', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                      {item.kategori || item.jenisKejadian}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '24px', color: '#94A3B8', fontSize: '13px' }}>
                Belum ada ulasan masyarakat yang tercatat di database.
              </div>
            )}
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
