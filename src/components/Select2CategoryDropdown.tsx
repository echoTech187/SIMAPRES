'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

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
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownPanelRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [coords, setCoords] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    width: number;
    openUp: boolean;
  }>({ left: 0, width: 0, openUp: false });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Cari item yang sedang terpilih berdasarkan ID
  const selectedItem = subcategories.find((s) => s.id === selectedId) || null;

  // Deteksi ukuran layar (Mobile Device < 768px)
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Kunci scroll halaman saat bottom drawer terbuka di mobile
  useEffect(() => {
    if (isOpen && isMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, isMobile]);

  // Hitung koordinat presisi agar tidak terpotong oleh modal / overflow
  const updatePosition = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUp = spaceBelow < 280 && spaceAbove > spaceBelow;

    setCoords({
      top: openUp ? undefined : rect.bottom + 4,
      bottom: openUp ? window.innerHeight - rect.top + 4 : undefined,
      left: Math.max(8, rect.left),
      width: Math.min(rect.width, window.innerWidth - 16),
      openUp,
    });
  };

  // Update posisi saat scroll/resize (capture: true menangkap scroll dalam modal)
  useEffect(() => {
    if (isOpen && !isMobile) {
      updatePosition();
      const onScrollOrResize = () => {
        updatePosition();
      };
      window.addEventListener('resize', onScrollOrResize);
      window.addEventListener('scroll', onScrollOrResize, true);
      return () => {
        window.removeEventListener('resize', onScrollOrResize);
        window.removeEventListener('scroll', onScrollOrResize, true);
      };
    }
  }, [isOpen, isMobile]);

  // Tutup dropdown saat klik di luar container atau floating panel
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const insideTrigger = containerRef.current && containerRef.current.contains(target);
      const insidePanel = dropdownPanelRef.current && dropdownPanelRef.current.contains(target);
      if (!insideTrigger && !insidePanel) {
        setIsOpen(false);
      }
    }
    if (isOpen && !isMobile) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, isMobile]);

  // Focus ke search input saat dropdown/drawer terbuka
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 80);
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
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes slideUpBottomDrawer {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes fadeInOverlay {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeInSelect2 {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `,
        }}
      />

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
              transform: isOpen && !isMobile ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          >
            ▼
          </span>
        </div>
      </div>

      {/* Render: Khusus Mobile Menggunakan Drawer-Bottom (Bottom Sheet) */}
      {isOpen && isMobile && mounted && createPortal(
        <>
          {/* Backdrop Overlay */}
          <div
            onClick={() => setIsOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(3px)',
              zIndex: 999998,
              animation: 'fadeInOverlay 0.2s ease-out',
            }}
          />

          {/* Drawer Bottom Panel */}
          <div
            style={{
              position: 'fixed',
              left: 0,
              right: 0,
              bottom: 0,
              maxHeight: '85vh',
              height: '75vh',
              background: '#FFFFFF',
              borderRadius: '20px 20px 0 0',
              boxShadow: '0 -10px 30px rgba(0, 0, 0, 0.35)',
              zIndex: 999999,
              display: 'flex',
              flexDirection: 'column',
              animation: 'slideUpBottomDrawer 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              overflow: 'hidden',
            }}
          >
            {/* Drag Handle Bar */}
            <div
              style={{
                padding: '10px 0 6px',
                display: 'flex',
                justifyContent: 'center',
                cursor: 'grab',
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '4px',
                  borderRadius: '2px',
                  background: '#CBD5E1',
                }}
              />
            </div>

            {/* Drawer Header */}
            <div
              style={{
                padding: '6px 18px 12px',
                borderBottom: '1px solid #E2E8F0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>
                  Pilih Kategori Kasus Laporan
                </div>
                <div style={{ fontSize: '11px', color: '#64748B' }}>
                  Tersedia {filteredList.length} kategori kasus
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{
                  background: '#F1F5F9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#64748B',
                  fontWeight: 700,
                }}
              >
                ✕
              </button>
            </div>

            {/* Mobile Search Box */}
            <div
              style={{
                padding: '12px 18px',
                background: '#F8FAFC',
                borderBottom: '1px solid #E2E8F0',
              }}
            >
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: '12px',
                    fontSize: '15px',
                    color: '#64748B',
                    pointerEvents: 'none',
                  }}
                >
                  🔍
                </span>
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Ketik nama kasus (cth: curanmor, tawuran)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 36px 11px 38px',
                    fontSize: '14px',
                    border: '1.5px solid #CBD5E1',
                    borderRadius: '10px',
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
                      right: '12px',
                      fontSize: '14px',
                      color: '#94A3B8',
                      cursor: 'pointer',
                      fontWeight: 700,
                      padding: '4px',
                    }}
                  >
                    ✕
                  </span>
                )}
              </div>
            </div>

            {/* Mobile List Items */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch',
                padding: '4px 0',
              }}
            >
              {filteredList.length === 0 ? (
                <div
                  style={{
                    padding: '40px 16px',
                    textAlign: 'center',
                    fontSize: '13px',
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
                        padding: '14px 20px',
                        fontSize: '14px',
                        fontWeight: isSelected ? 700 : 500,
                        color: isSelected ? '#1D4ED8' : '#1E293B',
                        background: isSelected ? '#EFF6FF' : '#FFFFFF',
                        borderBottom: '1px solid #F1F5F9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                      }}
                    >
                      <span>{item.nama_kasus}</span>
                      {isSelected && (
                        <span style={{ color: '#2563EB', fontWeight: 800, fontSize: '16px' }}>
                          ✓
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>,
        document.body
      )}

      {/* Render: Khusus Desktop Menggunakan Floating Dropdown (Select2 Style) */}
      {isOpen && !isMobile && mounted && createPortal(
        <div
          ref={dropdownPanelRef}
          style={{
            position: 'fixed',
            top: coords.top !== undefined ? `${coords.top}px` : 'auto',
            bottom: coords.bottom !== undefined ? `${coords.bottom}px` : 'auto',
            left: `${coords.left}px`,
            width: `${coords.width}px`,
            background: '#FFFFFF',
            border: '1.5px solid #2563EB',
            borderRadius: '8px',
            boxShadow: '0 16px 36px -4px rgba(15, 23, 42, 0.25), 0 4px 12px rgba(0, 0, 0, 0.08)',
            zIndex: 9999999,
            overflow: 'hidden',
            maxHeight: '340px',
            display: 'flex',
            flexDirection: 'column',
            animation: 'fadeInSelect2 0.12s ease-out',
            boxSizing: 'border-box',
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
        </div>,
        document.body
      )}
    </div>
  );
}
