'use client';

import React, { useState, useRef, useEffect } from 'react';

export interface IncidentSubcategoryOption {
  id: number;
  category_id: number;
  category_key: string;
  nama_kasus: string;
  default_urgensi?: string;
  deskripsi_sop?: string | null;
  category_rel?: {
    id: number;
    key: string;
    label: string;
  };
}

interface Select2CategoryDropdownProps {
  subcategories: IncidentSubcategoryOption[];
  selectedId: number | null | undefined;
  onSelect: (item: IncidentSubcategoryOption | null) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  style?: React.CSSProperties;
}

export default function Select2CategoryDropdown({
  subcategories = [],
  selectedId,
  onSelect,
  placeholder = '-- Pilih / Cari Kategori Kasus Laporan --',
  disabled = false,
  required = false,
  style = {},
}: Select2CategoryDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Cari item yang sedang terpilih berdasarkan ID
  const selectedItem = subcategories.find((s) => s.id === selectedId) || null;

  // Tutup dropdown saat klik di luar container
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus ke search input saat dropdown terbuka
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Filter daftar kasus berdasarkan search query
  const filteredList = subcategories.filter((sub) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const nama = (sub.nama_kasus || '').toLowerCase();
    const cat = (sub.category_key || '').toLowerCase();
    return nama.includes(q) || cat.includes(q);
  });

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        fontFamily: 'inherit',
        ...style,
      }}
    >
      {/* Hidden input untuk integrasi form native jika diperlukan */}
      <input
        type="hidden"
        value={selectedItem ? selectedItem.id : ''}
        required={required}
      />

      {/* Select2 Trigger Box */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => {
          if (!disabled) setIsOpen(!isOpen);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!disabled) setIsOpen(!isOpen);
          }
        }}
        style={{
          width: '100%',
          minHeight: '38px',
          padding: '8px 12px',
          background: disabled ? '#F1F5F9' : '#FFFFFF',
          border: isOpen ? '1.5px solid #2563EB' : '1px solid #CBD5E1',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: disabled ? 'not-allowed' : 'pointer',
          boxShadow: isOpen ? '0 0 0 3px rgba(37, 99, 235, 0.15)' : 'none',
          transition: 'all 0.15s ease',
          userSelect: 'none',
        }}
      >
        <span
          style={{
            fontSize: '12.5px',
            fontWeight: selectedItem ? 600 : 400,
            color: selectedItem ? '#1E293B' : '#94A3B8',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            paddingRight: '8px',
          }}
        >
          {selectedItem ? selectedItem.nama_kasus : placeholder}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {selectedItem && !disabled && (
            <span
              role="button"
              title="Hapus Pilihan"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(null);
              }}
              style={{
                color: '#94A3B8',
                fontSize: '13px',
                fontWeight: 700,
                padding: '0 4px',
                cursor: 'pointer',
                lineHeight: 1,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#EF4444')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}
            >
              ✕
            </span>
          )}
          <span
            style={{
              color: '#64748B',
              fontSize: '11px',
              transition: 'transform 0.15s ease',
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          >
            ▼
          </span>
        </div>
      </div>

      {/* Select2 Dropdown Panel */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            background: '#FFFFFF',
            border: '1.5px solid #2563EB',
            borderRadius: '8px',
            boxShadow: '0 10px 25px -4px rgba(0, 0, 0, 0.2)',
            zIndex: 99999,
            overflow: 'hidden',
            animation: 'fadeInSelect2 0.12s ease-out',
          }}
        >
          {/* Header Search Box (Select2 Style) */}
          <div
            style={{
              padding: '8px 10px',
              background: '#F8FAFC',
              borderBottom: '1px solid #E2E8F0',
            }}
          >
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  left: '10px',
                  fontSize: '13px',
                  color: '#64748B',
                  pointerEvents: 'none',
                }}
              >
                🔍
              </span>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Ketik untuk mencari kategori kasus..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setIsOpen(false);
                  } else if (e.key === 'Enter' && filteredList.length > 0) {
                    e.preventDefault();
                    onSelect(filteredList[0]);
                    setIsOpen(false);
                  }
                }}
                style={{
                  width: '100%',
                  padding: '7px 28px 7px 32px',
                  fontSize: '12.5px',
                  border: '1px solid #CBD5E1',
                  borderRadius: '6px',
                  outline: 'none',
                  background: '#FFFFFF',
                  color: '#0F172A',
                }}
              />
              {searchQuery && (
                <span
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    fontSize: '12px',
                    color: '#94A3B8',
                    cursor: 'pointer',
                    fontWeight: 700,
                  }}
                  title="Bersihkan kata kunci"
                >
                  ✕
                </span>
              )}
            </div>
            <div
              style={{
                fontSize: '10px',
                color: '#64748B',
                marginTop: '4px',
                display: 'flex',
                justifyContent: 'space-between',
                padding: '0 2px',
              }}
            >
              <span>{filteredList.length} kasus ditemukan</span>
              <span>Tekan Esc untuk tutup</span>
            </div>
          </div>

          {/* List Item Opsi Kasus */}
          <div
            style={{
              maxHeight: '230px',
              overflowY: 'auto',
            }}
          >
            {filteredList.length === 0 ? (
              <div
                style={{
                  padding: '16px 12px',
                  textAlign: 'center',
                  fontSize: '12px',
                  color: '#94A3B8',
                }}
              >
                Tidak ada kategori kasus yang cocok dengan &quot;{searchQuery}&quot;
              </div>
            ) : (
              filteredList.map((item) => {
                const isSelected = selectedId === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      onSelect(item);
                      setIsOpen(false);
                    }}
                    style={{
                      padding: '9px 14px',
                      fontSize: '12.5px',
                      fontWeight: isSelected ? 700 : 500,
                      color: isSelected ? '#1D4ED8' : '#1E293B',
                      background: isSelected ? '#EFF6FF' : '#FFFFFF',
                      borderBottom: '1px solid #F1F5F9',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'background 0.12s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = '#F8FAFC';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.background = '#FFFFFF';
                    }}
                  >
                    <span>{item.nama_kasus}</span>
                    {isSelected && (
                      <span style={{ color: '#2563EB', fontWeight: 800, fontSize: '13px' }}>
                        ✓
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
