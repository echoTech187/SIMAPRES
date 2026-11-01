'use client';

import React, { useMemo } from 'react';
import { ShieldAlert } from 'lucide-react';
import TacticalAlert from './TacticalAlert';
import Select2CustomDropdown, { type Select2Option } from './Select2CustomDropdown';
import {
  STANDARD_RESOLUTION_LOCATIONS,
  STANDARD_RESOLUTION_DOCUMENTS,
  type ResolutionLocationKey,
  type ResolutionDocumentKey,
} from '@/domain/rules/resolution.rules';

export interface ResolutionSelectorProps {
  locationKey: ResolutionLocationKey;
  onLocationChange: (key: ResolutionLocationKey) => void;
  documentKey: ResolutionDocumentKey;
  onDocumentChange: (key: ResolutionDocumentKey) => void;
  isTkpStrict?: boolean;
  isRjEligible?: boolean;
  kategoriTeks?: string;
  className?: string;
}

export default function ResolutionSelector({
  locationKey,
  onLocationChange,
  documentKey,
  onDocumentChange,
  isTkpStrict = false,
  isRjEligible = true,
  kategoriTeks,
  className = '',
}: ResolutionSelectorProps) {
  // Opsi Select2 untuk Lokasi Penyelesaian Perkara
  const locationOptions: Select2Option[] = useMemo(() => {
    return STANDARD_RESOLUTION_LOCATIONS.map((loc) => ({
      value: loc.key,
      label: loc.label,
      sublabel: loc.keterangan,
      badge: loc.requiresStrictTkp ? 'Wajib GPS TKP' : undefined,
      badgeColor: loc.requiresStrictTkp ? '#EF4444' : undefined,
      icon:
        loc.key === 'TKP'
          ? '📍'
          : loc.key === 'KANTOR_POLISI'
          ? '🏢'
          : loc.key === 'RUMAH_SAKIT'
          ? '🏥'
          : loc.key === 'KANTOR_KELURAHAN'
          ? '🏛️'
          : '📌',
    }));
  }, []);

  // Opsi Select2 untuk Dokumen Berita Acara Penyelesaian Perkara
  const documentOptions: Select2Option[] = useMemo(() => {
    return STANDARD_RESOLUTION_DOCUMENTS.map((doc) => ({
      value: doc.key,
      label: doc.label,
      sublabel: doc.keterangan,
      badge:
        doc.key === 'BAP_DAMAI'
          ? isRjEligible
            ? 'Perpol 8/2021'
            : 'Tidak Memenuhi Syarat RJ'
          : undefined,
      badgeColor:
        doc.key === 'BAP_DAMAI'
          ? isRjEligible
            ? '#10B981'
            : '#EF4444'
          : undefined,
      icon:
        doc.key === 'BAP_DAMAI'
          ? '🤝'
          : doc.key === 'DOKUMENTASI_KONDUSIF'
          ? '📸'
          : doc.key === 'SERAH_TERIMA_BB'
          ? '📦'
          : doc.key === 'REKAM_MEDIS'
          ? '🩺'
          : doc.key === 'BERITA_ACARA_PENUTUPAN'
          ? '📋'
          : '📄',
    }));
  }, [isRjEligible]);

  const triggerStyle: React.CSSProperties = {
    background: '#0B0D13',
    border: '1px solid rgba(245, 158, 11, 0.35)',
    borderRadius: '0.75rem',
    color: '#F8FAFC',
    fontSize: '12px',
    minHeight: '40px',
    padding: '8px 12px',
  };

  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-white/[0.02] border border-amber-500/20 ${className}`}
    >
      {/* 1. Pemilihan Lokasi Penyelesaian (Select2) */}
      <div>
        <label className="text-xs font-bold text-amber-300 uppercase tracking-wide flex items-center justify-between mb-1.5">
          <span>📍 Lokasi Penyelesaian *</span>
          {isTkpStrict && (
            <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-full font-bold">
              Wajib GPS TKP
            </span>
          )}
        </label>
        <Select2CustomDropdown
          id="select-lokasi-penyelesaian"
          data-testid="select-lokasi-penyelesaian"
          value={locationKey}
          onChange={(val) => onLocationChange(String(val) as ResolutionLocationKey)}
          options={locationOptions}
          placeholder="-- Pilih Lokasi Penyelesaian --"
          searchable={true}
          allowClear={false}
          triggerStyle={triggerStyle}
        />
      </div>

      {/* 2. Pemilihan Dokumen Berita Acara Penyelesaian (Select2) */}
      <div>
        <label className="text-xs font-bold text-amber-300 uppercase tracking-wide flex items-center justify-between mb-1.5">
          <span>📄 Dokumen Penyelesaian *</span>
        </label>
        <Select2CustomDropdown
          id="select-dokumen-penyelesaian"
          data-testid="select-dokumen-penyelesaian"
          value={documentKey}
          onChange={(val) => onDocumentChange(String(val) as ResolutionDocumentKey)}
          options={documentOptions}
          placeholder="-- Pilih Dokumen Penyelesaian --"
          searchable={true}
          allowClear={false}
          triggerStyle={triggerStyle}
        />
      </div>

      {/* 3. Peringatan Otomatis Kepatuhan Restorative Justice (Perpol No. 8 Tahun 2021) */}
      {documentKey === 'BAP_DAMAI' && !isRjEligible && (
        <TacticalAlert
          variant="error"
          className="col-span-1 sm:col-span-2 !p-2.5"
          icon={<ShieldAlert size={15} className="text-rose-400 flex-shrink-0 mt-0.5" />}
        >
          <div className="leading-snug">
            <strong>Peringatan Perpol No. 8/2021:</strong> Perkara berkategori{' '}
            <em>&quot;{kategoriTeks || 'Tindak Pidana Berat'}&quot;</em> dilarang diselesaikan melalui mekanisme damai (Restorative Justice).
          </div>
        </TacticalAlert>
      )}
    </div>
  );
}
