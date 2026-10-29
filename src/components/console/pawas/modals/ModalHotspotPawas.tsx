'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import Select2CustomDropdown from '@/components/ui/Select2CustomDropdown';
import AddressLocationPicker from '@/components/common/AddressLocationPicker';
import { createHotspotAction, deleteHotspotAction } from '@/app/actions/hotspot.actions';

interface ModalHotspotPawasProps {
  isOpen: boolean;
  onClose: () => void;
  hotspots: any[];
  dbCategories: any[];
  loadData: () => void;
  showFriendlyToast: (type: 'success' | 'warning' | 'error' | 'info', title: string, msg: string) => void;
}

export default function ModalHotspotPawas({
  isOpen,
  onClose,
  hotspots,
  dbCategories,
  loadData,
  showFriendlyToast,
}: ModalHotspotPawasProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newWilayah, setNewWilayah] = useState('');
  const [newKategori, setNewKategori] = useState('Tawuran Remaja & Geng Motor');
  const [newStatus, setNewStatus] = useState('BAHAYA_TINGGI');
  const [newJadwal, setNewJadwal] = useState('23:00 - 04:30 WIB');
  const [newLat, setNewLat] = useState(0);
  const [newLng, setNewLng] = useState(0);

  if (!isOpen) return null;

  return (
    <div
      id="modal-crud-titik-rawan"
      className="pawas-modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        background: 'rgba(15,23,42,0.7)',
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
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ background: 'linear-gradient(135deg, #1E293B, #0F172A)', color: 'white', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '22px' }}>🔴</span>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 800 }}>MANAJEMEN TITIK RAWAN KAMTIBMAS</div>
              <div style={{ fontSize: '11.5px', color: '#94A3B8' }}>Kelola peta hotspot kerawanan, balap liar, tawuran &amp; kejahatan jalanan</div>
            </div>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: '#CBD5E1', fontSize: '16px', cursor: 'pointer', padding: '4px' }}>✕</button>
        </div>

        <div style={{ padding: '12px 20px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
            Daftar Hotspot Aktif: <span style={{ background: '#EF4444', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '11px' }}>{hotspots.length}</span>
          </div>
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            style={{ background: '#153E75', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '6px', fontSize: '11.5px', fontWeight: 800, cursor: 'pointer' }}
          >
            {showAddForm ? '✕ Tutup Form' : '➕ Tambah Titik Rawan Baru'}
          </button>
        </div>

        <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1 }}>
          {showAddForm && (
            <div style={{ background: '#FFF7ED', border: '1.5px solid #FDBA74', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#9A3412', marginBottom: '10px' }}>
                ➕ TAMBAH TITIK RAWAN BARU
              </div>
              <AddressLocationPicker
                label="Nama Kawasan / Titik Rawan"
                required={true}
                placeholder="Contoh: Flyover Antasari, Panglima Polim, atau cari nama jalan..."
                value={newTitle}
                lat={newLat}
                lng={newLng}
                onChangeAddress={(addr) => setNewTitle(addr)}
                onChangeCoords={(lat, lng) => {
                  setNewLat(lat);
                  setNewLng(lng);
                }}
                mapHeight="220px"
              />

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '10px', marginTop: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Wilayah Polsek *</label>
                  <input
                    type="text"
                    value={newWilayah}
                    onChange={(e) => setNewWilayah(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Jadwal / Jam Rawan</label>
                  <input
                    type="text"
                    value={newJadwal}
                    onChange={(e) => setNewJadwal(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Kategori Kerawanan</label>
                <Select2CustomDropdown
                  value={newKategori}
                  onChange={(val) => setNewKategori(String(val))}
                  options={dbCategories.map((c) => ({
                    value: c.label || c.key,
                    label: c.label,
                  }))}
                  placeholder="-- Pilih Kategori Kerawanan --"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={async () => {
                    if (!newTitle.trim()) {
                      showFriendlyToast('warning', 'Formulir Belum Lengkap', 'Mohon isi nama kawasan rawan terlebih dahulu.');
                      return;
                    }
                    await createHotspotAction({
                      title: newTitle,
                      wilayahPolsek: newWilayah,
                      kategori: newKategori,
                      statusBahaya: newStatus,
                      jadwalDisplay: newJadwal,
                      lat: newLat,
                      lng: newLng,
                    });
                    showFriendlyToast('success', 'Titik Rawan Tersimpan', 'Titik rawan berhasil ditambahkan ke database.');
                    setNewTitle('');
                    setShowAddForm(false);
                    loadData();
                  }}
                  style={{ background: '#16A34A', color: 'white', border: 'none', padding: '7px 16px', borderRadius: '6px', fontSize: '11.5px', fontWeight: 800, cursor: 'pointer' }}
                >
                  💾 Simpan Titik Rawan
                </button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {hotspots.map((h: any) => (
              <div
                key={h.id || h.key}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px' }}
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: '13px', color: '#1E293B' }}>🔴 {h.title}</div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>{h.kategori} • {h.jadwalDisplay || h.jadwal}</div>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    if (confirm(`Hapus titik rawan ${h.title}?`)) {
                      await deleteHotspotAction(h.key);
                      loadData();
                    }
                  }}
                  style={{ background: '#FEE2E2', color: '#DC2626', border: '1px solid #FECACA', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Hapus
                </button>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: '12px 20px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', textAlign: 'right' }}>
          <button
            type="button"
            onClick={onClose}
            style={{ background: '#334155', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
