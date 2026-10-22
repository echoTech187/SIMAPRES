'use client';

import React from 'react';

/**
 * Utility untuk konversi teks nama/label menjadi format Kode / Identifier Unik baku kepolisian.
 * Contoh: "Satuan Samapta Presisi" -> "SATUAN_SAMAPTA_PRESISI"
 */
export function formatCodeIdentifier(text: string): string {
  if (!text) return '';
  return text
    .trim()
    .toUpperCase()
    .replace(/[^\w\s-]/g, '') // Bersihkan karakter khusus non-alfanumerik
    .replace(/[\s_-]+/g, '_') // Ganti spasi atau strip menjadi underscore tunggal
    .replace(/^_+|_+$/g, ''); // Trim underscore di awal dan akhir
}

export interface CodeIdentifierFieldProps {
  label?: string;
  value: string;
  onChange: (val: string) => void;
  sourceValue?: string; // Teks acuan (misal: unit_name, label, station_name) untuk auto-generate
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  helpText?: string;
}

export default function CodeIdentifierField({
  label = 'Kode / Identifier Unik',
  value,
  onChange,
  sourceValue = '',
  placeholder = 'Contoh: SABHARA',
  required = true,
  disabled = false,
  helpText,
}: CodeIdentifierFieldProps) {
  const handleAutoGenerate = () => {
    if (!sourceValue) return;
    const generated = formatCodeIdentifier(sourceValue);
    onChange(generated);
  };

  return (
    <div style={{ marginBottom: '14px', display: 'none' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '6px',
        }}
      >
        <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
          {label} {required && <span style={{ color: '#EF4444' }}>*</span>}
        </label>
        {sourceValue && (
          <button
            type="button"
            onClick={handleAutoGenerate}
            title={`Generate kode otomatis dari: "${sourceValue}"`}
            style={{
              background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
              border: '1px solid #BFDBFE',
              borderRadius: '6px',
              padding: '3px 9px',
              fontSize: '11px',
              fontWeight: 800,
              color: '#1D4ED8',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.15s ease',
              boxShadow: '0 1px 2px rgba(29, 78, 216, 0.08)',
            }}
          >
            <span>⚡</span>
            <span>Generate Otomatis</span>
          </button>
        )}
      </div>

      <div style={{ position: 'relative' }}>
        <input
          type="text"
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            const formatted = e.target.value.toUpperCase().replace(/\s+/g, '_');
            onChange(formatted);
          }}
          style={{
            width: '100%',
            padding: '9px 12px',
            borderRadius: '8px',
            border: '1px solid #CBD5E1',
            fontSize: '12.5px',
            fontFamily: 'monospace',
            fontWeight: 700,
            color: '#0F172A',
            background: disabled ? '#F8FAFC' : '#FFFFFF',
            boxSizing: 'border-box',
            letterSpacing: '0.5px',
          }}
        />
      </div>

      {helpText && (
        <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
          {helpText}
        </div>
      )}
    </div>
  );
}
