'use client';

import React from 'react';

interface ModalLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  lightboxImg: {
    title: string;
    desc: string;
    meta: string;
    url: string;
  };
}

export default function ModalLightbox({
  isOpen,
  onClose,
  lightboxImg,
}: ModalLightboxProps) {
  if (!isOpen) return null;

  return (
    <div
      id="lightbox-modal"
      className="pawas-modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        background: 'rgba(15,23,42,0.85)',
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
          borderRadius: '12px',
          maxWidth: '550px',
          width: '100%',
          overflow: 'hidden',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
          <div>
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#1E293B' }}>{lightboxImg.title}</h4>
            <span style={{ fontSize: '11px', color: '#64748B' }}>Dokumentasi Resmi SIMOPMAS 110</span>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', padding: '4px' }}>✕</button>
        </div>
        <div style={{ background: '#0F172A', maxHeight: '420px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {lightboxImg.url?.match(/\.(mp4|webm|mov)$/i) || lightboxImg.title?.toLowerCase().includes('video') ? (
            <video src={lightboxImg.url} controls autoPlay style={{ width: '100%', maxHeight: '400px', outline: 'none' }} />
          ) : lightboxImg.url?.match(/\.(pdf)$/i) ? (
            <iframe src={lightboxImg.url} style={{ width: '100%', height: '380px', border: 'none' }} title={lightboxImg.title} />
          ) : (
            <img src={lightboxImg.url} alt="Lightbox" style={{ width: '100%', maxHeight: '380px', objectFit: 'contain' }} />
          )}
        </div>
        <div style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: '12px', color: '#1E293B', lineHeight: 1.5 }}>{lightboxImg.desc}</div>
          <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#64748B', borderTop: '1px solid #F1F5F9', paddingTop: '8px', flexWrap: 'wrap', gap: '8px' }}>
            <span>{lightboxImg.meta}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <a
                href={lightboxImg.url}
                target="_blank"
                rel="noreferrer"
                style={{
                  background: '#EFF6FF',
                  color: '#1D4ED8',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '4px',
                  textDecoration: 'none',
                  border: '1px solid #BFDBFE',
                  fontSize: '10.5px',
                }}
              >
                Buka File ↗
              </a>
              <span style={{ background: '#ECFDF5', color: '#15803D', fontWeight: 700, padding: '2px 8px', borderRadius: '4px' }}>✓ Terverifikasi GPS</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
