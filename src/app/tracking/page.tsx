'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import CitizenLiveRadarTracker from '@/components/warga/CitizenLiveRadarTracker';
import { Shield, Search, Phone, Radio } from 'lucide-react';

/* ──────────────────────────────────────────────────────────────────────────
   Global keyframes & page styles — injected once via dangerouslySetInnerHTML
   ──────────────────────────────────────────────────────────────────────────*/
const GLOBAL_CSS = `
  *, *::before, *::after { box-sizing: border-box; }
  body {
    background-color: #090A0F !important;
    color: #F1F5F9 !important;
    margin: 0; padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  @keyframes tp-badge-pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(236,196,115,0.4); }
    60%       { box-shadow: 0 0 0 8px rgba(236,196,115,0); }
  }
  @keyframes tp-spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
`;

function TrackingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const ticketFromUrl = searchParams.get('tiket') || searchParams.get('lacak') || '';
  const tokenFromUrl = searchParams.get('token') || searchParams.get('auth') || '';

  const [ticketInput, setTicketInput] = useState(ticketFromUrl);
  const [tokenInput, setTokenInput] = useState(tokenFromUrl);
  const [activeTicket, setActiveTicket] = useState(ticketFromUrl);
  const [activeToken, setActiveToken] = useState(tokenFromUrl);

  useEffect(() => {
    setTicketInput(ticketFromUrl);
    setActiveTicket(ticketFromUrl);
  }, [ticketFromUrl]);

  useEffect(() => {
    setTokenInput(tokenFromUrl);
    setActiveToken(tokenFromUrl);
  }, [tokenFromUrl]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTicket = ticketInput.trim();
    const cleanToken = tokenInput.trim();
    if (!cleanTicket) return;
    setActiveTicket(cleanTicket);
    setActiveToken(cleanToken);
    const targetUrl = cleanToken
      ? `/tracking?tiket=${encodeURIComponent(cleanTicket)}&token=${encodeURIComponent(cleanToken)}`
      : `/tracking?tiket=${encodeURIComponent(cleanTicket)}`;
    router.push(targetUrl);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#090A0F',
        backgroundImage:
          'radial-gradient(ellipse at 50% -5%, rgba(236,196,115,0.14) 0%, transparent 55%)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Inject global CSS */}
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_CSS }} />

      {activeTicket ? (
        <CitizenLiveRadarTracker
          nomorTiket={activeTicket}
          token={activeToken}
          onBack={() => {
            setActiveTicket('');
            setActiveToken('');
            router.push('/tracking');
          }}
        />
      ) : (
        <>
          {/* ─────────────── HEADER ─────────────── */}
          <header
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 100,
              background: 'rgba(10, 12, 18, 0.92)',
              backdropFilter: 'blur(18px)',
              WebkitBackdropFilter: 'blur(18px)',
              borderBottom: '1px solid rgba(236,196,115,0.18)',
              padding: '0 20px',
              height: '56px',
              boxShadow: '0 2px 20px rgba(0,0,0,0.6)',
            }}
          >
            <div
              style={{
                maxWidth: '1100px',
                height: '100%',
                margin: '0 auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              {/* Brand */}
              <Link
                href="/warga"
                style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}
              >
                {/* Hexagon badge */}
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    background: 'linear-gradient(135deg, #ECC473 0%, #C99635 100%)',
                    borderRadius: '9px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 3px 12px rgba(201,150,53,0.4)',
                    animation: 'tp-badge-pulse 2.5s ease-in-out infinite',
                  }}
                >
                  <div
                    style={{
                      width: '18px',
                      height: '18px',
                      background: '#0A0D14',
                      clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                    }}
                  />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: 900,
                      color: '#FFFFFF',
                      lineHeight: 1.1,
                      letterSpacing: '-0.3px',
                    }}
                  >
                    SIMOPMAS 110
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 600, marginTop: '1px' }}>
                    Sistem Monitoring Laporan
                  </div>
                </div>
              </Link>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '10.5px',
                  fontWeight: 800,
                  color: '#ECC473',
                }}
              >
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#ECC473',
                    animation: 'tp-badge-pulse 1.8s ease-in-out infinite',
                  }}
                />
                PORTAL RESMI
              </div>
            </div>
          </header>

          {/* ─────────────── MAIN CONTENT ─────────────── */}
          <main style={{ flex: 1 }}>
          <div
            style={{
              maxWidth: '440px',
              margin: '48px auto 24px',
              padding: '0 16px',
            }}
          >
            <div
              style={{
                background: 'rgba(18,22,33,0.9)',
                border: '1px solid rgba(236,196,115,0.2)',
                borderRadius: '24px',
                padding: '32px 24px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 40px rgba(236,196,115,0.04)',
                backdropFilter: 'blur(16px)',
              }}
            >
              {/* Icon */}
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '18px',
                  background: 'rgba(236,196,115,0.1)',
                  border: '1.5px solid rgba(236,196,115,0.28)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                  color: '#ECC473',
                }}
              >
                <Radio size={28} />
              </div>

              <h1
                style={{
                  fontSize: '20px',
                  fontWeight: 900,
                  color: '#FFFFFF',
                  textAlign: 'center',
                  margin: '0 0 8px',
                  letterSpacing: '-0.3px',
                }}
              >
                Lacak Laporan Saya
              </h1>
              <p
                style={{
                  fontSize: '13px',
                  color: '#64748B',
                  textAlign: 'center',
                  lineHeight: 1.6,
                  margin: '0 0 28px',
                }}
              >
                Masukkan nomor tiket yang Anda terima saat membuat laporan untuk memantau status penanganan secara langsung.
              </p>

              <form onSubmit={handleSearch}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '10.5px',
                    fontWeight: 800,
                    color: '#ECC473',
                    marginBottom: '7px',
                    letterSpacing: '0.5px',
                  }}
                >
                  NOMOR TIKET
                </label>
                <input
                  type="text"
                  placeholder="Contoh: TICKET-1897638850"
                  value={ticketInput}
                  onChange={(e) => setTicketInput(e.target.value)}
                  autoFocus
                  required
                  style={{
                    width: '100%',
                    background: 'rgba(9,10,15,0.85)',
                    border: '1.5px solid rgba(236,196,115,0.28)',
                    borderRadius: '13px',
                    padding: '13px 16px',
                    color: '#FFFFFF',
                    fontSize: '14px',
                    fontWeight: 700,
                    fontFamily: 'monospace',
                    letterSpacing: '0.5px',
                    outline: 'none',
                    marginBottom: '16px',
                  }}
                />
                <label
                  style={{
                    display: 'block',
                    fontSize: '10.5px',
                    fontWeight: 800,
                    color: '#ECC473',
                    marginBottom: '7px',
                    letterSpacing: '0.5px',
                  }}
                >
                  TOKEN VERIFIKASI KEAMANAN
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 8646b7f837e4f414"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(9,10,15,0.85)',
                    border: '1.5px solid rgba(236,196,115,0.28)',
                    borderRadius: '13px',
                    padding: '13px 16px',
                    color: '#FFFFFF',
                    fontSize: '14px',
                    fontWeight: 700,
                    fontFamily: 'monospace',
                    letterSpacing: '0.5px',
                    outline: 'none',
                    marginBottom: '8px',
                  }}
                />
                <div
                  style={{
                    fontSize: '11px',
                    color: '#94A3B8',
                    lineHeight: 1.5,
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '6px',
                  }}
                >
                  <span style={{ color: '#ECC473', fontSize: '13px' }}>🔒</span>
                  <span>
                    Token 16 karakter tertera pada pesan resmi WhatsApp 110 Anda. Akses tanpa token resmi akan ditolak demi perlindungan privasi pelapor.
                  </span>
                </div>
                <button
                  type="submit"
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #ECC473 0%, #C99635 100%)',
                    color: '#0A0D14',
                    fontWeight: 900,
                    fontSize: '14px',
                    padding: '14px',
                    border: 'none',
                    borderRadius: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 6px 20px rgba(201,150,53,0.4)',
                  }}
                >
                  <Search size={16} />
                  <span>Lacak Sekarang</span>
                </button>
              </form>

              {/* Emergency */}
              <div
                style={{
                  marginTop: '24px',
                  paddingTop: '18px',
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '12px',
                  color: '#475569',
                }}
              >
                <span>Butuh bantuan darurat?</span>
                <a
                  href="tel:110"
                  style={{
                    color: '#FCD34D',
                    fontWeight: 800,
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <Phone size={13} />
                  Hubungi 110
                </a>
              </div>
            </div>
          </div>
        </main>
      </>
    )}
  </div>
);
}

/* ── Error Boundary ── */
interface EBProps { children: React.ReactNode; }
interface EBState { hasError: boolean; }

class TrackingErrorBoundary extends React.Component<EBProps, EBState> {
  constructor(props: EBProps) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(): EBState { return { hasError: true }; }
  componentDidCatch(err: Error, info: React.ErrorInfo) { console.error('TrackingBoundary:', err, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            background: '#090A0F',
            color: '#F8FAFC',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛡️</div>
          <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#ECC473', margin: '0 0 8px' }}>
            Terjadi Kendala Sementara
          </h2>
          <p style={{ fontSize: '13px', color: '#94A3B8', maxWidth: '360px', lineHeight: 1.6, margin: '0 0 24px' }}>
            Sistem mengalami gangguan sementara. Silakan muat ulang halaman untuk mencoba kembali.
          </p>
          <button
            onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
            style={{
              background: 'linear-gradient(135deg, #ECC473, #C99635)',
              color: '#0A0D14',
              fontWeight: 900,
              fontSize: '13px',
              padding: '12px 28px',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Muat Ulang Halaman
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ── Root Export ── */
export default function TrackingPage() {
  return (
    <TrackingErrorBoundary>
      <Suspense
        fallback={
          <div
            style={{
              minHeight: '100vh',
              background: '#090A0F',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: '16px',
              color: '#ECC473',
              fontFamily: 'sans-serif',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                border: '3px solid rgba(236,196,115,0.2)',
                borderTopColor: '#ECC473',
                borderRadius: '50%',
                animation: 'tp-spin 0.8s linear infinite',
              }}
            />
            <span style={{ fontSize: '13px', fontWeight: 800 }}>Memuat...</span>
          </div>
        }
      >
        <TrackingContent />
      </Suspense>
    </TrackingErrorBoundary>
  );
}
