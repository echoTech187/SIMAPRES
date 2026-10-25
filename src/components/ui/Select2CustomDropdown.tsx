'use client';

import React, { useState, useRef, useEffect, useId } from 'react';
import { createPortal } from 'react-dom';

export interface Select2Option {
  value: string | number;
  label: string;
  sublabel?: string;
  badge?: string;
  badgeColor?: string;
  icon?: React.ReactNode;
  group?: string;
}

interface Select2CustomDropdownProps {
  options: (Select2Option | string)[];
  value: string | number | null | undefined;
  onChange: (value: any) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  searchable?: boolean;
  allowClear?: boolean;
  className?: string;
  style?: React.CSSProperties;
  triggerStyle?: React.CSSProperties;
  id?: string;
  title?: string;
}

export default function Select2CustomDropdown({
  options = [],
  value,
  onChange,
  placeholder = '-- Pilih Opsi --',
  disabled = false,
  required = false,
  searchable = true,
  allowClear = false,
  className = '',
  style = {},
  triggerStyle = {},
  id,
  title,
}: Select2CustomDropdownProps) {
  const generatedId = useId();
  const dropdownId = id || generatedId;
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownPanelRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Position coordinates for portal floating panel on desktop
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

  // Normalize options into standard Select2Option format
  const normalizedOptions: Select2Option[] = React.useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === 'string') {
        return { value: opt, label: opt };
      }
      return opt;
    });
  }, [options]);

  // Detect mobile viewport (< 768px)
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Lock body scroll on mobile when open
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

  // Calculate coordinates to float outside any modal or overflow container
  const updatePosition = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUp = spaceBelow < 260 && spaceAbove > spaceBelow;

    setCoords({
      top: openUp ? undefined : rect.bottom + 4,
      bottom: openUp ? window.innerHeight - rect.top + 4 : undefined,
      left: Math.max(8, rect.left),
      width: Math.min(rect.width, window.innerWidth - 16),
      openUp,
    });
  };

  // Recalculate position on resize and scroll (capture: true catches modal body scrolling)
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

  // Close on outside click in desktop mode (checking both trigger and portaled panel)
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

  // Focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 70);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Find currently selected item
  const selectedItem = normalizedOptions.find((opt) => String(opt.value) === String(value)) || null;

  // Filter options by search query
  const filteredOptions = normalizedOptions.filter((opt) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const labelMatch = (opt.label || '').toLowerCase().includes(q);
    const subMatch = (opt.sublabel || '').toLowerCase().includes(q);
    const badgeMatch = (opt.badge || '').toLowerCase().includes(q);
    const valMatch = String(opt.value).toLowerCase().includes(q);
    return labelMatch || subMatch || badgeMatch || valMatch;
  });

  const handleSelect = (val: string | number) => {
    onChange(val);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      id={`select2-container-${dropdownId}`}
      className={`select2-custom-wrapper ${className}`}
      style={{
        position: 'relative',
        width: '100%',
        fontFamily: 'inherit',
        boxSizing: 'border-box',
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

      {/* TRIGGER BUTTON (Simulating Select Box) */}
      <div
        id={dropdownId}
        role="button"
        title={title}
        tabIndex={disabled ? -1 : 0}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => {
          if (!disabled) setIsOpen(!isOpen);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!disabled) setIsOpen(!isOpen);
          } else if (e.key === 'Escape') {
            setIsOpen(false);
          }
        }}
        style={{
          width: '100%',
          minHeight: '40px',
          padding: '8px 12px',
          background: disabled ? '#F8FAFC' : '#FFFFFF',
          border: isOpen ? '1.5px solid #1D4ED8' : '1px solid #CBD5E1',
          borderRadius: '8px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          boxShadow: isOpen ? '0 0 0 3px rgba(37,99,235,0.15)' : 'none',
          transition: 'all 0.15s ease-in-out',
          boxSizing: 'border-box',
          opacity: disabled ? 0.65 : 1,
          ...triggerStyle,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0, overflow: 'hidden' }}>
          {selectedItem?.icon && <span style={{ flexShrink: 0 }}>{selectedItem.icon}</span>}
          {selectedItem ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, overflow: 'hidden' }}>
              <span
                style={{
                  fontSize: triggerStyle?.fontSize || '12.5px',
                  fontWeight: 600,
                  color: triggerStyle?.color || '#0F172A',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {selectedItem.label}
              </span>
              {selectedItem.badge && (
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: '4px',
                    background: selectedItem.badgeColor || '#EFF6FF',
                    color: selectedItem.badgeColor ? '#FFFFFF' : '#1D4ED8',
                    flexShrink: 0,
                  }}
                >
                  {selectedItem.badge}
                </span>
              )}
            </div>
          ) : (
            <span
              style={{
                fontSize: triggerStyle?.fontSize || '12.5px',
                color: '#94A3B8',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {placeholder}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {allowClear && selectedItem && !disabled && (
            <span
              onClick={handleClear}
              title="Hapus pilihan"
              style={{
                fontSize: '12px',
                color: '#94A3B8',
                cursor: 'pointer',
                padding: '2px 4px',
                borderRadius: '4px',
                transition: 'all 0.1s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#DC2626')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}
            >
              ✕
            </span>
          )}
          <span
            style={{
              fontSize: '11px',
              color: '#64748B',
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.15s ease',
              display: 'inline-block',
            }}
          >
            ▼
          </span>
        </div>
      </div>

      {/* DROPDOWN MENU / MOBILE BOTTOM DRAWER (PORTALED TO PREVENT MODAL CLIPPING) */}
      {isOpen && mounted && createPortal(
        <>
          {/* Mobile Overlay */}
          {isMobile && (
            <div
              onClick={() => setIsOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(15, 23, 42, 0.65)',
                backdropFilter: 'blur(3px)',
                zIndex: 9999998,
                animation: 'fadeInOverlay 0.15s ease-out',
              }}
            />
          )}

          {/* Panel Container (Floating on Desktop, Bottom Sheet on Mobile) */}
          <div
            ref={dropdownPanelRef}
            style={
              isMobile
                ? {
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    backgroundColor: '#FFFFFF',
                    borderTopLeftRadius: '20px',
                    borderTopRightRadius: '20px',
                    boxShadow: '0 -10px 25px rgba(0,0,0,0.25)',
                    zIndex: 9999999,
                    maxHeight: '80vh',
                    display: 'flex',
                    flexDirection: 'column',
                    animation: 'slideUpBottomDrawer 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                  }
                : {
                    position: 'fixed',
                    top: coords.top !== undefined ? `${coords.top}px` : 'auto',
                    bottom: coords.bottom !== undefined ? `${coords.bottom}px` : 'auto',
                    left: `${coords.left}px`,
                    width: `${coords.width}px`,
                    backgroundColor: '#FFFFFF',
                    border: '1.5px solid #2563EB',
                    borderRadius: '10px',
                    boxShadow: '0 16px 36px -4px rgba(15, 23, 42, 0.25), 0 4px 12px rgba(0, 0, 0, 0.08)',
                    zIndex: 9999999,
                    maxHeight: '320px',
                    display: 'flex',
                    flexDirection: 'column',
                    animation: 'fadeInSelect2 0.15s ease-out',
                    minWidth: '220px',
                    boxSizing: 'border-box',
                  }
            }
          >
            {/* Mobile Drag Indicator & Header */}
            {isMobile && (
              <div
                style={{
                  padding: '12px 18px 8px',
                  borderBottom: '1px solid #F1F5F9',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '4px',
                    backgroundColor: '#CBD5E1',
                    borderRadius: '2px',
                    marginBottom: '10px',
                  }}
                />
                <div
                  style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
                    {placeholder.replace(/^--\s*|\s*--$/g, '')}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    style={{
                      border: 'none',
                      background: '#F1F5F9',
                      borderRadius: '50%',
                      width: '28px',
                      height: '28px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#475569',
                      cursor: 'pointer',
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* SEARCH INPUT BAR */}
            {searchable && (
              <div
                style={{
                  padding: isMobile ? '12px 16px 8px' : '8px',
                  borderBottom: '1px solid #F1F5F9',
                  background: '#F8FAFC',
                  borderTopLeftRadius: isMobile ? 0 : '9px',
                  borderTopRightRadius: isMobile ? 0 : '9px',
                }}
              >
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <span
                    style={{
                      position: 'absolute',
                      left: '10px',
                      fontSize: '13px',
                      color: '#94A3B8',
                      pointerEvents: 'none',
                    }}
                  >
                    🔍
                  </span>
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Ketik untuk mencari..."
                    style={{
                      width: '100%',
                      padding: '8px 30px 8px 32px',
                      fontSize: '13px',
                      border: '1px solid #CBD5E1',
                      borderRadius: '6px',
                      outline: 'none',
                      background: '#FFFFFF',
                      color: '#0F172A',
                      boxSizing: 'border-box',
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setIsOpen(false);
                      } else if (e.key === 'Enter' && filteredOptions.length > 0) {
                        e.preventDefault();
                        handleSelect(filteredOptions[0].value);
                      }
                    }}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        background: 'transparent',
                        border: 'none',
                        color: '#94A3B8',
                        cursor: 'pointer',
                        fontSize: '12px',
                        padding: '2px',
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* OPTIONS LIST */}
            <div
              role="listbox"
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '4px',
                maxHeight: isMobile ? '55vh' : '280px',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              {filteredOptions.length === 0 ? (
                <div
                  style={{
                    padding: '24px 16px',
                    textAlign: 'center',
                    color: '#94A3B8',
                    fontSize: '13px',
                  }}
                >
                  <div style={{ fontSize: '20px', marginBottom: '4px' }}>🔍</div>
                  Tidak ada opsi yang cocok dengan &quot;{searchQuery}&quot;
                </div>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = String(opt.value) === String(value);
                  return (
                    <div
                      key={String(opt.value)}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelect(opt.value)}
                      style={{
                        padding: isMobile ? '12px 14px' : '8px 12px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        backgroundColor: isSelected ? '#EFF6FF' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                        transition: 'background-color 0.1s ease',
                        borderBottom: isMobile ? '1px solid #F8FAFC' : 'none',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = '#F8FAFC';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                        {opt.icon && <span style={{ flexShrink: 0 }}>{opt.icon}</span>}
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div
                            style={{
                              fontSize: isMobile ? '13.5px' : '13px',
                              fontWeight: isSelected ? 700 : 500,
                              color: isSelected ? '#1D4ED8' : '#1E293B',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {opt.label}
                          </div>
                          {opt.sublabel && (
                            <div
                              style={{
                                fontSize: '11px',
                                color: '#64748B',
                                marginTop: '1px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {opt.sublabel}
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        {opt.badge && (
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: opt.badgeColor || (isSelected ? '#DBEAFE' : '#F1F5F9'),
                              color: opt.badgeColor ? '#FFFFFF' : isSelected ? '#1E40AF' : '#475569',
                            }}
                          >
                            {opt.badge}
                          </span>
                        )}
                        {isSelected && (
                          <span style={{ fontSize: '13px', fontWeight: 800, color: '#1D4ED8' }}>
                            ✓
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
