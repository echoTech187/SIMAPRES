'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Shield,
  Lock,
  User,
  Eye,
  EyeOff,
  PhoneCall,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Compass,
  MapPin,
  HeartHandshake,
  Users,
  Sparkles,
} from 'lucide-react';
import { loginInternalAction } from '@/app/actions/auth.actions';
import './login.css';

/**
 * Authentic Indonesian Police / Presisi Gold Crest SVG Component
 */
function PolriPresisiInsignia({ size = 44 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0 drop-shadow-[0_0_14px_rgba(236,196,115,0.4)]"
    >
      <defs>
        <linearGradient id="goldGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFBEB" />
          <stop offset="35%" stopColor="#ECC473" />
          <stop offset="70%" stopColor="#D4A346" />
          <stop offset="100%" stopColor="#92400E" />
        </linearGradient>
        <linearGradient id="goldGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="50%" stopColor="#ECC473" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
        <linearGradient id="darkShield" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0F172A" />
          <stop offset="100%" stopColor="#030712" />
        </linearGradient>
      </defs>

      {/* Outer 8-Pointed Star Base */}
      <polygon
        points="50,4 62,26 87,17 76,41 98,50 76,59 87,83 62,74 50,96 38,74 13,83 24,59 2,50 24,41 13,17 38,26"
        fill="url(#goldGrad1)"
        opacity="0.32"
      />

      {/* Main Police Shield Outer */}
      <path
        d="M50 12 L82 24 C82 58, 67 79, 50 88 C33 79, 18 58, 18 24 Z"
        fill="url(#darkShield)"
        stroke="url(#goldGrad1)"
        strokeWidth="3.2"
      />

      {/* Inner Golden Shield Outline */}
      <path
        d="M50 18 L76 28 C76 54, 64 72, 50 80 C36 72, 24 54, 24 28 Z"
        fill="none"
        stroke="url(#goldGrad2)"
        strokeWidth="1.5"
        strokeDasharray="4 2"
        opacity="0.75"
      />

      {/* Golden Tribrata Central Star */}
      <polygon
        points="50,28 55,40 68,41 58,49 61,62 50,54 39,62 42,49 32,41 45,40"
        fill="url(#goldGrad1)"
        stroke="#FFFBEB"
        strokeWidth="0.5"
      />

      {/* Center Ring */}
      <circle cx="50" cy="48" r="4.5" fill="#0B111E" stroke="url(#goldGrad1)" strokeWidth="1.5" />

      {/* Lower Ribbon */}
      <path
        d="M32 75 L68 75 L62 82 L38 82 Z"
        fill="url(#goldGrad1)"
        stroke="#07090E"
        strokeWidth="0.8"
      />
    </svg>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [nrp, setNrp] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Parameter notifikasi dari Middleware / Auto-Logout
  const alertType = searchParams.get('alert');
  const alertRole = searchParams.get('role');
  const alertRequired = searchParams.get('required');

  // Bersihkan sessionStorage jika diarahkan karena timeout / logout / ditolak
  useEffect(() => {
    if (alertType && typeof window !== 'undefined') {
      sessionStorage.removeItem('simapres_active_user');
    }
  }, [alertType]);

  // Sapaan hangat dinamis berdasarkan jam lokal
  const dynamicGreeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 11) return 'Selamat Pagi';
    if (hour >= 11 && hour < 15) return 'Selamat Siang';
    if (hour >= 15 && hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!nrp.trim()) {
      setErrorMsg('Silakan masukkan NRP / ID Petugas kedinasan terlebih dahulu!');
      return;
    }

    if (!password.trim()) {
      setErrorMsg('Silakan masukkan kata sandi akun kedinasan Anda!');
      return;
    }

    setLoading(true);
    const res = await loginInternalAction(nrp, password);
    setLoading(false);

    if (res.success && res.data) {
      sessionStorage.setItem('simapres_active_user', JSON.stringify(res.data));
      window.location.href = res.data.targetRoute;
    } else {
      setErrorMsg(
        res.error ||
          'Kombinasi NRP dan Kata Sandi tidak cocok atau belum terdaftar pada sistem.'
      );
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-3 sm:py-6 lg:py-8 z-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        
        {/* =========================================================
            LEFT COLUMN: PELAYANAN MASYARAKAT & HUMANIS PENGAYOM
            Hidden on mobile so the login card appears immediately
            ========================================================= */}
        <div className="hidden lg:block lg:col-span-7 space-y-6">
          
          {/* Institutional Badge & Header */}
          <div className="space-y-3.5">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-amber-400/25 backdrop-blur-md shadow-sm">
              <span className="live-beacon" />
              <span className="text-[11px] font-bold text-amber-300">
                Presisi Pelayanan Masyarakat
              </span>
              <span className="text-slate-500 text-xs">·</span>
              <span className="text-[10.5px] text-slate-300">Siaga 24 Jam</span>
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl xl:text-4xl font-extrabold text-white tracking-tight leading-tight">
                Hadir Cepat, Melayani Tulus,{' '}
                <span className="gold-gradient-text">Masyarakat Tenang</span>
              </h1>
              <p className="text-xs xl:text-sm text-slate-300 leading-relaxed max-w-xl">
                Sistem Monitoring Polisi Bersama Masyarakat (SIMOPMAS 110) menghadirkan pelayanan
                kepolisian yang cepat, humanis, dan akuntabel di setiap sudut wilayah hukum.
              </p>
            </div>
          </div>

          {/* 3 Humanis Pillars of Public Service */}
          <div className="space-y-2.5 pt-1">
            <div className="service-pillar-card flex items-start gap-3.5 group">
              <div className="w-9 h-9 rounded-xl bg-amber-400/15 text-amber-300 border border-amber-400/30 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                <HeartHandshake size={18} />
              </div>
              <div className="space-y-0.5 min-w-0">
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <span>Respon Cepat &amp; Empati Lapangan</span>
                  <span className="text-[9.5px] font-bold px-2 py-0.2 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    &lt; 10 MENIT
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Petugas hadir segera di samping warga saat membutuhkan pertolongan, mengedepankan
                  sikap ramah, santun, dan solutif.
                </p>
              </div>
            </div>

            <div className="service-pillar-card flex items-start gap-3.5 group">
              <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-300 border border-blue-500/30 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                <Users size={18} />
              </div>
              <div className="space-y-0.5 min-w-0">
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <span>Kamtibmas Aman &amp; Patroli Dialogis</span>
                  <span className="text-[9.5px] font-bold px-2 py-0.2 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30">
                    KONDUSIF
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Patroli presisi terpadu dan sambang warga secara berkala guna memelihara rasa aman,
                  ketenteraman, dan kedekatan bersama masyarakat.
                </p>
              </div>
            </div>

            <div className="service-pillar-card flex items-start gap-3.5 group">
              <div className="w-9 h-9 rounded-xl bg-amber-400/15 text-amber-300 border border-amber-400/30 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                <ShieldCheck size={18} />
              </div>
              <div className="space-y-0.5 min-w-0">
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <span>Transparansi &amp; Kepuasan Warga (IKM)</span>
                  <span className="text-[9.5px] font-bold px-2 py-0.2 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30">
                    AKUNTABEL
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Hasil penanganan tugas terbuka dan dinilai langsung oleh pelapor melalui indeks
                  kepuasan masyarakat yang terukur.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Value Stats */}
          <div className="grid grid-cols-3 gap-3 pt-1">
            <div className="p-3.5 rounded-2xl bg-white/[0.025] border border-white/5 space-y-0.5">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Kesiagaan Pelayanan
              </div>
              <div className="text-base font-extrabold text-emerald-400">
                24 Jam Nonstop
              </div>
              <div className="text-[9.5px] text-slate-400 truncate">Piket Siaga Tergelar</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.025] border border-white/5 space-y-0.5">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Target Respon Tiba
              </div>
              <div className="text-base font-extrabold text-amber-300">
                &lt; 10 Menit
              </div>
              <div className="text-[9.5px] text-slate-400 truncate">Prioritas Utama Warga</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.025] border border-white/5 space-y-0.5">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Akuntabilitas IKM
              </div>
              <div className="text-base font-extrabold text-sky-400">
                Terbuka &amp; Dinilai
              </div>
              <div className="text-[9.5px] text-slate-400 truncate">Ulasan Nyata Pelapor</div>
            </div>
          </div>

          {/* Motto Luhur */}
          <div className="pt-2 text-[11px] text-slate-400 italic">
            &ldquo;Rastra Sewakotama — Abdi Utama Bagi Nusa dan Bangsa&rdquo;
          </div>
        </div>

        {/* =========================================================
            RIGHT COLUMN: WELCOMING & HUMANIS LOGIN CARD
            Instant view on mobile without needing to scroll
            ========================================================= */}
        <div className="w-full lg:col-span-5 mx-auto max-w-md lg:max-w-none">
          <div className="obsidian-card rounded-3xl p-6 sm:p-8 shadow-2xl">
            
            {/* Terminal Card Header */}
            <div className="flex items-center gap-3.5 pb-4 border-b border-white/10">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.08] border border-white/10 p-1 flex items-center justify-center shadow-lg shadow-black/40 flex-shrink-0">
                <img
                  src="/logo_simopmas.png"
                  alt="Logo SIMOPMAS 110"
                  className="w-full h-full object-contain filter drop-shadow-[0_0_6px_rgba(255,255,255,0.45)]"
                />
              </div>
              <div className="min-w-0">
                <div className="text-[10.5px] font-semibold text-amber-300 tracking-wide uppercase flex items-center gap-1.5">
                  <span>SIMOPMAS 110</span>
                  <span className="text-slate-600">·</span>
                  <span>PRESISI</span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-white leading-tight">
                  {dynamicGreeting}, Rekan Petugas
                </h2>
                <p className="text-[11.5px] text-slate-400 truncate">
                  Silakan masuk untuk memulai giliran tugas dinas.
                </p>
              </div>
            </div>

            {/* Mobile-Only Info Pill */}
            <div className="lg:hidden mt-3 p-2.5 rounded-2xl bg-amber-400/[0.08] border border-amber-400/20 flex items-center justify-between text-xs">
              <span className="text-amber-300 font-medium flex items-center gap-2">
                <span className="live-beacon" />
                Siaga Pelayanan 110
              </span>
              <span className="text-slate-300 text-[10px]">Target Respon &lt; 10 Menit</span>
            </div>

            {/* =======================================================
                NOTIFIKASI MIDDLEWARE & AUTO-LOGOUT STANDBY
                ======================================================= */}
            <div className="pt-4 space-y-3">
              {alertType === 'inactivity_timeout' && (
                <div
                  id="alert-inactivity"
                  className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs leading-relaxed space-y-0.5"
                >
                  <div className="font-bold flex items-center gap-1.5 text-amber-300 text-[11px]">
                    <Clock size={13} />
                    <span>Sesi Berakhir Otomatis (Standby &gt; 1 Jam)</span>
                  </div>
                  <p className="text-slate-300 text-[11px]">
                    Sesi kedinasan Anda ditutup otomatis demi perlindungan data Presisi 110. Silakan masuk kembali.
                  </p>
                </div>
              )}

              {alertType === 'unauthorized' && (
                <div
                  id="alert-unauthorized"
                  className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-200 text-xs leading-relaxed space-y-0.5"
                >
                  <div className="font-bold flex items-center gap-1.5 text-red-300 text-[11px]">
                    <AlertTriangle size={13} />
                    <span>Hak Akses Ditolak (RBAC Presisi)</span>
                  </div>
                  <p className="text-slate-300 text-[11px]">
                    Peran Anda ({alertRole || 'User'}) tidak berwenang membuka halaman tersebut (Khusus peran {alertRequired || 'Terkait'}).
                  </p>
                </div>
              )}

              {alertType === 'unauthenticated' && (
                <div
                  id="alert-unauthenticated"
                  className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-200 text-xs leading-relaxed space-y-0.5"
                >
                  <div className="font-bold flex items-center gap-1.5 text-blue-300 text-[11px]">
                    <Lock size={13} />
                    <span>Autentikasi Diperlukan</span>
                  </div>
                  <p className="text-slate-300 text-[11px]">
                    Halaman ini memerlukan izin kedinasan. Silakan masukkan NRP dan kata sandi Anda.
                  </p>
                </div>
              )}

              {alertType === 'logged_out' && (
                <div
                  id="alert-logged-out"
                  className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-xs leading-relaxed space-y-0.5"
                >
                  <div className="font-bold flex items-center gap-1.5 text-emerald-300 text-[11px]">
                    <CheckCircle2 size={13} />
                    <span>Berhasil Keluar (Logout)</span>
                  </div>
                  <p className="text-slate-300 text-[11px]">
                    Sesi operasional kedinasan Anda telah ditutup dengan aman. Terima kasih atas dedikasi pelayanan Anda.
                  </p>
                </div>
              )}

              {/* Error Alert Box */}
              {errorMsg && (
                <div
                  id="login-alert-error"
                  className="p-3 rounded-2xl bg-red-500/15 border border-red-500/40 text-red-200 text-xs leading-relaxed space-y-0.5"
                >
                  <div className="font-bold flex items-center gap-1.5 text-red-400 text-[11px]">
                    <AlertTriangle size={13} />
                    <span>Gagal Masuk</span>
                  </div>
                  <div id="login-alert-text" className="text-slate-200 text-[11px]">
                    {errorMsg}
                  </div>
                </div>
              )}

              {/* =======================================================
                  FORM LOGIN PETUGAS
                  ======================================================= */}
              <form onSubmit={handleLogin} className="space-y-4 pt-1">
                
                {/* Field 1: NRP / ID Petugas */}
                <div className="form-group-tactical">
                  <label className="form-label-tactical" htmlFor="login-nrp">
                    <span>NRP / ID Petugas</span>
                  </label>
                  <div className="input-container-tactical">
                    <span className="input-icon-tactical">
                      <User size={16} />
                    </span>
                    <input
                      type="text"
                      id="login-nrp"
                      className="form-control-tactical font-mono"
                      placeholder="Masukkan 8 digit NRP petugas"
                      value={nrp}
                      onChange={(e) => setNrp(e.target.value)}
                      required
                      autoComplete="username"
                    />
                    {nrp && (
                      <button
                        type="button"
                        onClick={() => setNrp('')}
                        className="input-action-tactical"
                        title="Bersihkan input"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Field 2: Kata Sandi */}
                <div className="form-group-tactical">
                  <label className="form-label-tactical" htmlFor="login-pass">
                    <span>Kata Sandi Kedinasan</span>
                  </label>
                  <div className="input-container-tactical">
                    <span className="input-icon-tactical">
                      <Lock size={16} />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="login-pass"
                      className="form-control-tactical font-mono"
                      placeholder="Masukkan kata sandi akun dinas"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="input-action-tactical"
                      title={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Submit Action Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-tactical-submit"
                    style={{
                      opacity: loading ? 0.75 : 1,
                      cursor: loading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {loading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        <span>Memverifikasi akun dinas...</span>
                      </>
                    ) : (
                      <>
                        <span>Masuk ke Layanan 110</span>
                        <ArrowRight size={16} className="text-slate-950 stroke-[2.5]" />
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Public Portal Redirection & Humanis Tagline */}
              <div className="pt-4 border-t border-white/10 space-y-2.5 text-center">
                <div>
                  <Link
                    href="/tracking"
                    className="inline-flex items-center gap-1.5 text-amber-300 hover:text-amber-200 font-semibold transition-colors hover:underline text-xs"
                  >
                    <span>Masyarakat / Pelapor? Lacak status aduan Anda di sini</span>
                    <span className="text-amber-400">➔</span>
                  </Link>
                </div>

                <div className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
                  <Shield size={12} className="text-amber-400 flex-shrink-0" />
                  <span>Melindungi, Mengayomi, dan Melayani dengan Presisi.</span>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function LoginPage() {
  const [liveWib, setLiveWib] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLiveWib(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }) + ' WIB'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="login-body-wrapper">
      {/* Background Humanis Ambient Glow & Soft Wave */}
      <div className="humanis-ambient-glow" />
      <div className="soft-ambient-wave" />

      {/* =========================================================
          TOP COMMAND BAR (HEADER)
          ========================================================= */}
      <header className="w-full border-b border-white/10 bg-[#0B111E]/90 backdrop-blur-xl z-20 sticky top-0 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 py-2.5 sm:py-3 flex items-center justify-between gap-3">
          
          {/* Left Brand Identity */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/[0.08] border border-white/10 p-1 flex items-center justify-center shadow-md shadow-black/30 flex-shrink-0">
              <img
                src="/logo_simopmas.png"
                alt="Logo SIMOPMAS 110"
                className="w-full h-full object-contain filter drop-shadow-[0_0_4px_rgba(255,255,255,0.4)]"
              />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-extrabold tracking-wide uppercase text-amber-300 leading-tight flex items-center gap-2">
                <span>SIMOPMAS 110</span>
                <span className="text-[9.5px] font-semibold px-2 py-0.2 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30 hidden sm:inline">
                  PRESISI
                </span>
              </div>
              <div className="text-[10.5px] text-slate-400 hidden sm:block">
                Sistem Monitoring Polisi Bersama Masyarakat
              </div>
            </div>
          </div>

          {/* Right Live Operational Time */}
          <div className="flex items-center gap-2 sm:gap-3 font-mono text-[11px] text-slate-400">
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/5 border border-white/5 text-[10.5px] text-slate-300">
              <span className="live-beacon" />
              <span>Piket SPKT Terbuka</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-300 font-bold text-[10.5px] sm:text-[11px]">
              <Clock size={12} className="text-amber-400" />
              <span>{liveWib || 'Memuat...'}</span>
            </div>
          </div>

        </div>
      </header>

      {/* =========================================================
          MAIN LOGIN CONTAINER
          ========================================================= */}
      <main className="flex-1 flex items-center justify-center my-auto py-3 sm:py-6">
        <Suspense
          fallback={
            <div className="obsidian-card rounded-2xl p-8 text-center text-slate-400 text-xs font-mono">
              <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Memuat Layanan SIMOPMAS 110...
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </main>

      {/* =========================================================
          BOTTOM STATUS FOOTER
          ========================================================= */}
      <footer className="w-full border-t border-white/10 bg-[#0B111E]/90 backdrop-blur-xl z-20 py-2.5 px-4 flex-shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1 sm:gap-2 text-center sm:text-left text-[10.5px] text-slate-400">
          <div>
            &copy; 2026 Kepolisian Negara Republik Indonesia · SIMOPMAS 110 Presisi
          </div>
          <div className="flex items-center justify-center gap-2.5 text-slate-400 text-[10px]">
            <span>Divisi TIK Polri</span>
            <span>·</span>
            <span className="text-emerald-400 flex items-center gap-1 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Sistem Pelayanan Aktif
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
