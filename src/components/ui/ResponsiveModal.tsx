'use client';

import React, { useState, useEffect } from 'react';

export interface ResponsiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  maxWidth?: string;
  fullscreenOnMobile?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
  headerRight?: React.ReactNode;
  bodyStyle?: React.CSSProperties;
  contentStyle?: React.CSSProperties;
  overlayStyle?: React.CSSProperties;
  className?: string;
}

export default function ResponsiveModal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  badge,
  maxWidth = '680px',
  fullscreenOnMobile = true,
  children,
  footer,
  headerRight,
  bodyStyle = {},
  contentStyle = {},
  overlayStyle = {},
  className = '',
}: ResponsiveModalProps) {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // Deteksi ukuran layar mobile (< 768px)
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Support ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={`master-modal-overlay ${className}`}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: isMobile ? 'stretch' : 'center',
        justifyContent: isMobile ? 'stretch' : 'center',
        padding: isMobile ? 0 : '16px',
        boxSizing: 'border-box',
        animation: 'fadeInOverlay 0.15s ease-out',
        ...overlayStyle,
      }}
    >
      <div
        className="master-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#FFFFFF',
          borderRadius: isMobile ? 0 : '16px',
          width: isMobile ? '100vw' : '100%',
          maxWidth: isMobile ? '100vw' : maxWidth,
          height: isMobile ? '100dvh' : 'auto',
          maxHeight: isMobile ? '100dvh' : '90vh',
          overflow: 'hidden',
          boxShadow: isMobile ? 'none' : '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
          margin: 0,
          border: isMobile ? 'none' : '1px solid #E2E8F0',
          animation: isMobile ? 'none' : 'modalPopIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          ...contentStyle,
        }}
      >
        {/* HEADER MODAL RAPI & ELEGAN */}
        <div
          className="master-modal-header"
          style={{
            padding: isMobile ? '14px 16px' : '16px 20px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
            flexShrink: 0,
            position: 'sticky',
            top: 0,
            zIndex: 20,
          }}
        >
          {/* Kolom Kiri: Ikon Box & Teks Judul */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
            {icon && (
              <div
                style={{
                  width: isMobile ? '38px' : '42px',
                  height: isMobile ? '38px' : '42px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
                  border: '1.5px solid #BFDBFE',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: isMobile ? '18px' : '20px',
                  flexShrink: 0,
                  boxShadow: '0 2px 5px rgba(37,99,235,0.08)',
                }}
              >
                {icon}
              </div>
            )}
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <h3
                  style={{
                    margin: 0,
                    fontSize: isMobile ? '15px' : '16px',
                    fontWeight: 800,
                    color: '#0F172A',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    letterSpacing: '-0.2px',
                  }}
                >
                  {title}
                </h3>
                {badge && (
                  <div style={{ flexShrink: 0 }}>
                    {badge}
                  </div>
                )}
              </div>
              {subtitle && (
                <div
                  style={{
                    fontSize: isMobile ? '11px' : '11.5px',
                    color: '#64748B',
                    marginTop: '2px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: isMobile ? 'nowrap' : 'normal',
                    lineHeight: 1.35,
                  }}
                >
                  {subtitle}
                </div>
              )}
            </div>
          </div>

          {/* Kolom Kanan: Tombol Close X */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {headerRight}
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup Dialog"
              style={{
                background: '#F1F5F9',
                border: '1px solid #E2E8F0',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748B',
                fontSize: '14px',
                fontWeight: 700,
                flexShrink: 0,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#E2E8F0';
                e.currentTarget.style.color = '#0F172A';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#F1F5F9';
                e.currentTarget.style.color = '#64748B';
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* BODY MODAL */}
        <div
          className="master-modal-body"
          style={{
            padding: isMobile ? '16px' : '20px',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            flex: 1,
            ...bodyStyle,
          }}
        >
          {children}
        </div>

        {/* FOOTER MODAL (STICKY BOTTOM JIKA TERSEDIA) */}
        {footer && (
          <div
            className="master-modal-footer"
            style={{
              padding: isMobile ? '12px 16px' : '14px 20px',
              borderTop: '1px solid #E2E8F0',
              background: '#F8FAFC',
              flexShrink: 0,
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
