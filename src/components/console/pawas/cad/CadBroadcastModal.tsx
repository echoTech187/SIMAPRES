'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { sendWhatsAppNotificationAction } from '@/app/actions/complaint.actions';

export interface CadBroadcastModalProps {
  broadcastModalData: any;
  simCaller: any;
  isCopied: boolean;
  setIsCopied: (v: boolean) => void;
  isSendingWa: boolean;
  setIsSendingWa: (v: boolean) => void;
  waSendResult: { success?: boolean; text?: string } | null;
  setWaSendResult: (v: { success?: boolean; text?: string } | null) => void;
  onClose: () => void;
  showFriendlyToast: (type: 'success' | 'warning' | 'error' | 'info', title: string, message: string) => void;
}

export const CadBroadcastModal: React.FC<CadBroadcastModalProps> = ({
  broadcastModalData,
  simCaller,
  isCopied,
  setIsCopied,
  isSendingWa,
  setIsSendingWa,
  waSendResult,
  setWaSendResult,
  onClose,
  showFriendlyToast,
}) => {
  if (!broadcastModalData || typeof document === 'undefined') return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        background: 'rgba(11, 15, 25, 0.88)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: '#12141C',
          border: '1.5px solid rgba(236, 196, 115, 0.35)',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '520px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7), 0 0 40px rgba(236, 196, 115, 0.12)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          color: '#FFFFFF',
        }}
      >
        {/* Header Modal */}
        <div
          style={{
            background: 'linear-gradient(180deg, rgba(236, 196, 115, 0.15) 0%, rgba(18, 20, 28, 0) 100%)',
            padding: '20px 24px 16px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span
                style={{
                  background: 'linear-gradient(135deg, #ECC473 0%, #C99635 100%)',
                  color: '#0B0F19',
                  fontSize: '10.5px',
                  fontWeight: 900,
                  padding: '2px 8px',
                  borderRadius: '6px',
                  letterSpacing: '0.5px',
                }}
              >
                SIARAN LANGSUNG 110
              </span>
              <span style={{ fontSize: '11px', color: '#94A3B8' }}>Siapa Cepat Dia Dapat</span>
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#F8FAFC', margin: 0 }}>
              Tiket Berhasil Disiarkan ke Armada
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#94A3B8',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              fontSize: '16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Ringkasan Tiket */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '12px 16px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
              fontSize: '12px',
            }}
          >
            <div>
              <div style={{ color: '#94A3B8', fontSize: '10.5px', marginBottom: '2px' }}>Nomor Tiket</div>
              <div style={{ fontWeight: 800, color: '#ECC473', fontSize: '13.5px' }}>
                {broadcastModalData.nomorTiket || broadcastModalData.id}
              </div>
            </div>
            <div>
              <div style={{ color: '#94A3B8', fontSize: '10.5px', marginBottom: '2px' }}>Pelapor</div>
              <div style={{ fontWeight: 700, color: '#F1F5F9' }}>
                {broadcastModalData.pelaporNama || simCaller.nama || '-'} ({broadcastModalData.pelaporHp || simCaller.telepon || '-'})
              </div>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <div style={{ color: '#94A3B8', fontSize: '10.5px', marginBottom: '2px' }}>Alamat TKP</div>
              <div style={{ fontWeight: 600, color: '#CBD5E1', lineHeight: 1.3 }}>
                📍 {broadcastModalData.tkpAlamatTeks || '-'}
              </div>
            </div>
          </div>

          {/* QR Code Container */}
          {(() => {
            const ticketNo = broadcastModalData.nomorTiket || broadcastModalData.id;
            const origin = typeof window !== 'undefined' ? window.location.origin : '';
            const trackingToken = broadcastModalData.trackingToken || (typeof btoa !== 'undefined' ? btoa(String(ticketNo)).slice(0, 10) : 'presisi110');
            const trackingUrl = `${origin}/tracking?tiket=${encodeURIComponent(ticketNo)}&token=${encodeURIComponent(trackingToken)}`;
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(trackingUrl)}&margin=10`;
            const cleanPhone = (broadcastModalData.pelaporHp || simCaller.telepon || '').replace(/\D/g, '').replace(/^0/, '62');
            const waMessage = `Halo Bapak/Ibu ${broadcastModalData.pelaporNama || 'Warga'},\n\nPengaduan Anda telah kami terima di Layanan Polisi 110 dengan Nomor Tiket: *${ticketNo}*.\n\nLaporan ini telah disiarkan ke seluruh armada patroli terdekat. Anda dapat memantau pergerakan personel dan radar taktis secara langsung melalui tautan resmi berikut:\n${trackingUrl}\n\nTerima kasih. - Sentra Pelayanan Kepolisian Terpadu 110`;
            const waHref = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMessage)}`;

            return (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    background: '#FFFFFF',
                    padding: '12px',
                    borderRadius: '16px',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrUrl}
                    alt={`QR Code Lacak ${ticketNo}`}
                    width={180}
                    height={180}
                    style={{ display: 'block', borderRadius: '8px' }}
                  />
                </div>
                <div style={{ textAlign: 'center', fontSize: '11.5px', color: '#94A3B8', maxWidth: '360px', lineHeight: 1.4 }}>
                  Scan QR Code di atas menggunakan kamera handphone warga untuk membuka radar pelacakan pergerakan petugas secara live.
                </div>

                {/* Copy Link Input Bar */}
                <div style={{ width: '100%', display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    readOnly
                    value={trackingUrl || ''}
                    style={{
                      flex: 1,
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      color: '#ECC473',
                      fontSize: '11.5px',
                      fontFamily: 'monospace',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(trackingUrl);
                        setIsCopied(true);
                        setTimeout(() => setIsCopied(false), 2500);
                      } catch (_) { }
                    }}
                    style={{
                      padding: '10px 16px',
                      background: isCopied ? '#10B981' : 'rgba(255, 255, 255, 0.12)',
                      color: '#FFFFFF',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {isCopied ? '✓ Tersalin!' : '📋 Salin Tautan'}
                  </button>
                </div>

                {/* Tombol Kirim WhatsApp */}
                {cleanPhone && (
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button
                      type="button"
                      disabled={isSendingWa}
                      onClick={async () => {
                        setIsSendingWa(true);
                        setWaSendResult(null);
                        try {
                          const res = await sendWhatsAppNotificationAction({
                            nomorTiket: ticketNo,
                            pelaporNama: broadcastModalData.pelaporNama,
                            pelaporHp: cleanPhone,
                            jenisKejadian: broadcastModalData.jenisKejadian,
                            tkpAlamatTeks: broadcastModalData.tkpAlamatTeks,
                            complaintId: broadcastModalData.id,
                          });
                          if (res.success) {
                            setWaSendResult({ success: true, text: res.statusText || 'Pesan berhasil dikirim via WhatsApp!' });
                            showFriendlyToast('success', 'WhatsApp Terkirim', `Notifikasi tiket ${ticketNo} telah dikirim ke nomor warga.`);
                          } else {
                            setWaSendResult({ success: false, text: res.error || res.statusText || 'Gagal mengirim pesan.' });
                            showFriendlyToast('error', 'Gagal Kirim WhatsApp', res.error || 'Terjadi kendala pengiriman.');
                          }
                        } catch (e: any) {
                          setWaSendResult({ success: false, text: e.message || 'Kendala koneksi' });
                        } finally {
                          setIsSendingWa(false);
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '10px',
                        fontWeight: 800,
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        cursor: isSendingWa ? 'not-allowed' : 'pointer',
                        opacity: isSendingWa ? 0.7 : 1,
                        boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
                      }}
                    >
                      <span>{isSendingWa ? '⏳' : '⚡'}</span>
                      <span>{isSendingWa ? 'Mengirim pesan WhatsApp...' : 'Kirim Otomatis ke WhatsApp Warga'}</span>
                    </button>

                    {waSendResult && (
                      <div
                        style={{
                          padding: '8px 12px',
                          borderRadius: '8px',
                          fontSize: '11.5px',
                          background: waSendResult.success ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: waSendResult.success ? '#34D399' : '#FCA5A5',
                          border: `1px solid ${waSendResult.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                          textAlign: 'center',
                        }}
                      >
                        {waSendResult.success ? '✓ ' : '⚠️ '}
                        {waSendResult.text}
                      </div>
                    )}

                    {/* Opsi Cadangan: WhatsApp Web Manual */}
                    <a
                      href={waHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        background: 'rgba(255, 255, 255, 0.06)',
                        color: '#25D366',
                        border: '1px solid rgba(37, 211, 102, 0.3)',
                        borderRadius: '10px',
                        fontWeight: 700,
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        textDecoration: 'none',
                      }}
                    >
                      <span>💬</span> Buka WhatsApp Web Manual (wa.me)
                    </a>
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* Footer Modal */}
        <div
          style={{
            padding: '14px 24px 20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              width: '100%',
              padding: '12px',
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#FFFFFF',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '10px',
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Tutup &amp; Kembali ke Konsol CAD
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
