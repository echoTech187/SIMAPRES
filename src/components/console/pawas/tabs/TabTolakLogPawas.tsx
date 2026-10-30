'use client';

import React from 'react';
import Select2CustomDropdown from '@/components/ui/Select2CustomDropdown';
import { PawasTab, PawasComplaintDossier, PawasLookupItem } from '../types';

export interface TabTolakLogPawasProps {
  switchTab: (tab: PawasTab) => void;
  tolakComplaint: PawasComplaintDossier | null;
  tolakKategori: string;
  setTolakKategori: (val: string) => void;
  dbRejectionReasons: PawasLookupItem[];
  tolakAlasan: string;
  setTolakAlasan: (val: string) => void;
  handleSubmitPenolakan: () => void;
  loading: boolean;
}

export default function TabTolakLogPawas({
  switchTab,
  tolakComplaint,
  tolakKategori,
  setTolakKategori,
  dbRejectionReasons,
  tolakAlasan,
  setTolakAlasan,
  handleSubmitPenolakan,
  loading,
}: TabTolakLogPawasProps) {
  return (
    <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div
          onClick={() => switchTab('view-validasi')}
          style={{ fontSize: '13px', fontWeight: 700, color: '#153E75', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <span>←</span> Kembali ke Validasi
        </div>
        <span style={{ fontSize: '11px', background: '#FEE2E2', color: '#DC2626', fontWeight: 700, padding: '4px 10px', borderRadius: '20px', border: '1px solid #FECACA' }}>
          Revisi Laporan
        </span>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <h2 className="page-title" style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#0F172A' }}>
          Alasan Penolakan Log
        </h2>
        <div style={{ color: '#64748B', fontSize: '12px', marginTop: '2px' }}>
          Silakan isi alasan penolakan dan arahan revisi yang akan dikirimkan kepada personel.
        </div>
      </div>

      {tolakComplaint && (
        <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '14px', marginBottom: '16px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ fontWeight: 800, fontSize: '13px', color: '#153E75', marginBottom: '2px' }}>
            {tolakComplaint.nomorTiket} - {tolakComplaint.jenisKejadian}
          </div>
          <div style={{ fontSize: '11.5px', color: '#64748B' }}>
            📍 {tolakComplaint.tkpAlamatTeks} • Pelapor: {tolakComplaint.pelaporNama}
          </div>
        </div>
      )}

      <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
        <div className="form-group" style={{ marginBottom: '14px' }}>
          <label className="form-label" style={{ fontSize: '12px', fontWeight: 700 }}>
            Kategori Alasan Penolakan <span style={{ color: 'red' }}>*</span>
          </label>
          <Select2CustomDropdown
            value={tolakKategori}
            onChange={(val) => setTolakKategori(String(val))}
            options={dbRejectionReasons.map((r: PawasLookupItem) => ({
              value: String(r.label || r.name || ''),
              label: String(r.label || r.name || ''),
            }))}
            placeholder="-- Pilih Kategori Alasan Penolakan --"
          />
        </div>

        <div className="form-group" style={{ marginBottom: '14px' }}>
          <label className="form-label" style={{ fontSize: '12px', fontWeight: 700 }}>
            Catatan &amp; Arahan Revisi untuk Personel <span style={{ color: 'red' }}>*</span>
          </label>
          <textarea
            className="form-control"
            rows={4}
            value={tolakAlasan}
            onChange={(e) => setTolakAlasan(e.target.value)}
            placeholder="Tuliskan catatan perbaikan secara spesifik, misalnya: Foto lampiran kurang jelas dan titik lokasi tidak terlihat..."
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => switchTab('view-validasi')}
            style={{ flex: 1, padding: '10px 16px', background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '8px', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmitPenolakan}
            disabled={loading}
            style={{ flex: 2, padding: '10px 16px', background: '#DC2626', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '12px', cursor: 'pointer', boxShadow: '0 2px 6px rgba(220,38,38,0.2)' }}
          >
            <span>✕</span> Konfirmasi Tolak &amp; Minta Revisi
          </button>
        </div>
      </div>
    </div>
  );
}
