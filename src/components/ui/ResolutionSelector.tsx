'use client';

import { ShieldAlert } from 'lucide-react';
import TacticalAlert from './TacticalAlert';
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
  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-white/[0.02] border border-amber-500/20 ${className}`}
    >
      {/* 1. Pemilihan Lokasi Penyelesaian */}
      <div>
        <label className="text-xs font-bold text-amber-300 uppercase tracking-wide flex items-center justify-between mb-1.5">
          <span>📍 Lokasi Penyelesaian *</span>
          {isTkpStrict && (
            <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-full font-bold">
              Wajib GPS TKP
            </span>
          )}
        </label>
        <select
          id="select-lokasi-penyelesaian"
          data-testid="select-lokasi-penyelesaian"
          name="resolution_location_key"
          value={locationKey}
          onChange={(e) => onLocationChange(e.target.value as ResolutionLocationKey)}
          className="w-full px-3 py-2 rounded-xl text-xs text-slate-100 bg-[#0B0D13] border border-amber-500/30 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/20 outline-none transition-all cursor-pointer"
        >
          <option value="">Pilih Lokasi Penyelesaian</option>
          {STANDARD_RESOLUTION_LOCATIONS.map((loc) => (
            <option key={loc.key} value={loc.key} className="bg-slate-900 text-white">
              {loc.label}
            </option>
          ))}
        </select>
      </div>

      {/* 2. Pemilihan Dokumen Berita Acara Penyelesaian */}
      <div>
        <label className="text-xs font-bold text-amber-300 uppercase tracking-wide flex items-center justify-between mb-1.5">
          <span>📄 Dokumen Penyelesaian *</span>
        </label>
        <select
          id="select-dokumen-penyelesaian"
          data-testid="select-dokumen-penyelesaian"
          name="resolution_document_key"
          value={documentKey}
          onChange={(e) => onDocumentChange(e.target.value as ResolutionDocumentKey)}
          className="w-full px-3 py-2 rounded-xl text-xs text-slate-100 bg-[#0B0D13] border border-amber-500/30 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/20 outline-none transition-all cursor-pointer"
        >
          <option value="">Pilih Dokumen Penyelesaian</option>
          {STANDARD_RESOLUTION_DOCUMENTS.map((doc) => (
            <option key={doc.key} value={doc.key} className="bg-slate-900 text-white">
              {doc.label}
            </option>
          ))}
        </select>
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
