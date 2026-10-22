'use client';

import React from 'react';
import Select2CustomDropdown from '@/components/ui/Select2CustomDropdown';

export interface TabBuatLogPawasProps {
  logWaktuMulai: string;
  setShowTimePickerModal: (show: boolean) => void;
  logSektor: string;
  setLogSektor: (s: string) => void;
  logJenis: string;
  setLogJenis: (j: string) => void;
  dbGiats: any[];
  logDeskripsi: string;
  setLogDeskripsi: (d: string) => void;
  logFotoPreview: string | null;
  setLogFotoPreview: (url: string | null) => void;
  handleSimpanLogKegiatan: () => void;
  loading: boolean;
}

export default function TabBuatLogPawas({
  logWaktuMulai,
  setShowTimePickerModal,
  logSektor,
  setLogSektor,
  logJenis,
  setLogJenis,
  dbGiats,
  logDeskripsi,
  setLogDeskripsi,
  logFotoPreview,
  setLogFotoPreview,
  handleSimpanLogKegiatan,
  loading,
}: TabBuatLogPawasProps) {
  return (
    <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', borderBottom: '1px solid #F1F5F9', paddingBottom: '14px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', border: '1px solid #DBEAFE' }}>
            📝
          </div>
          <div>
            <h2 className="page-title" style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#0F172A' }}>
              Input Log Kegiatan Harian
            </h2>
            <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
              Dokumentasi aktivitas kedinasan, patroli kewilayahan, dan giat lapangan Pawas
            </div>
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: '14px' }}>
          <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
            Waktu Mulai &amp; Rentang Jam
          </label>
          <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setShowTimePickerModal(true)}>
            <input
              type="text"
              className="form-control"
              placeholder="Waktu Mulai"
              value={logWaktuMulai}
              style={{ cursor: 'pointer', paddingRight: '40px' }}
              readOnly
            />
            <span
              id="log-calendar-icon"
              style={{ position: 'absolute', right: '14px', top: '12px', fontSize: '16px', cursor: 'pointer' }}
            >
              📅
            </span>
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: '14px' }}>
          <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
            Sektor Patroli
          </label>
          <input
            type="text"
            className="form-control"
            placeholder="Sektor Patroli (contoh: Wilayah Kebayoran Baru / Sektor Blok M)"
            value={logSektor}
            onChange={(e) => setLogSektor(e.target.value)}
          />
        </div>

        <div className="form-group" style={{ marginBottom: '14px' }}>
          <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
            Jenis Kegiatan
          </label>
          <Select2CustomDropdown
            value={logJenis}
            onChange={(val) => setLogJenis(val as any)}
            options={dbGiats.map((g) => ({
              value: g.key,
              label: g.label,
            }))}
            placeholder="-- Pilih Jenis Kegiatan --"
          />
        </div>

        <div className="form-group" style={{ marginBottom: '14px' }}>
          <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
            Deskripsi Kejadian
          </label>
          <textarea
            className="form-control"
            rows={4}
            placeholder="Uraikan detail kegiatan, personel yang terlibat, dan hasil pengawasan di lapangan..."
            value={logDeskripsi}
            onChange={(e) => setLogDeskripsi(e.target.value)}
          />
        </div>

        <div className="form-group" style={{ marginBottom: '14px' }}>
          <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
            Lampiran Foto Bukti
          </label>
          <input
            type="file"
            id="log-file-input"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const url = URL.createObjectURL(file);
                setLogFotoPreview(url);
              }
            }}
          />
          <button
            type="button"
            className="btn-blue"
            onClick={() => document.getElementById('log-file-input')?.click()}
            style={{ marginBottom: '10px', background: '#153E75', color: 'white', padding: '8px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
          >
            📸 Pilih Foto dari Perangkat
          </button>
          {logFotoPreview ? (
            <div style={{ width: '200px', height: '150px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #CBD5E1' }}>
              <img
                src={logFotoPreview}
                alt="Preview"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          ) : (
            <div style={{ width: '200px', height: '70px', borderRadius: '8px', border: '1px dashed #CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: '11px' }}>
              Belum ada foto dipilih
            </div>
          )}
        </div>

        <button
          type="button"
          className="btn-blue"
          onClick={handleSimpanLogKegiatan}
          disabled={loading}
          style={{
            marginTop: '16px',
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            color: 'white',
            border: 'none',
            padding: '12px 20px',
            borderRadius: '8px',
            fontWeight: 800,
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(16,185,129,0.25)',
          }}
        >
          <span>💾</span> Simpan Log Kegiatan
        </button>
      </div>
    </div>
  );
}
