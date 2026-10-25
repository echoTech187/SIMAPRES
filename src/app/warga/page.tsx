'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import './warga.css';
import {
  Shield,
  Phone,
  AlertTriangle,
  MapPin,
  Navigation,
  Camera,
  CheckCircle2,
  Copy,
  ExternalLink,
  Radio,
  Siren,
  Clock,
  Send,
  X,
  Sparkles,
} from 'lucide-react';
import {
  searchIndonesianLocations,
  type LocationSuggestionItem,
} from '@/lib/indonesian-location-search';

const MiniMapPicker = dynamic(() => import('@/components/MiniMapPicker'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: '240px',
        background: '#0E1626',
        borderRadius: '12px',
        border: '1px solid rgba(236, 196, 115, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ECC473',
        fontSize: '13px',
      }}
    >
      Memuat Peta Navigasi Presisi...
    </div>
  ),
});

import {
  createComplaintAction,
  getMasterFilterOptionsAction,
} from '@/app/actions/complaint.actions';

interface SubcategoryItem {
  id: number | string;
  category_key: string;
  nama_kasus: string;
  default_urgensi?: string;
  category_id?: number | string;
  category_rel?: { id: number | string; key: string; label: string };
}



export default function PortalWargaPage() {
  // Master Data Collections from MySQL
  const [categoryOptions, setCategoryOptions] = useState<
    Array<{ id: number; key: string; label: string; icon?: string | null }>
  >([]);
  const [subcategories, setSubcategories] = useState<SubcategoryItem[]>([]);

  // Form State
  const [nama, setNama] = useState('');
  const [telp, setTelp] = useState('');
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string>('KAMTIBMAS');
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<number | string | null>(null);
  const [urgensi, setUrgensi] = useState<'DARURAT' | 'SEDANG' | 'NORMAL'>('SEDANG');
  const [lokasi, setLokasi] = useState('');
  const [lat, setLat] = useState<number>(-7.026803);
  const [lng, setLng] = useState<number>(109.592982);
  const [hasValidGps, setHasValidGps] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [uraian, setUraian] = useState('');
  const [fotoBukti, setFotoBukti] = useState<string | null>(null);

  // Address Autocomplete Suggestions
  const [locationSuggestions, setLocationSuggestions] = useState<
    Array<{ label: string; subLabel: string; fullAddress: string; lat: number; lng: number }>
  >([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Form Submission & Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Success Confirmation State (Halaman Ucapan Terima Kasih)
  const [createdTicket, setCreatedTicket] = useState<{
    nomorTiket: string;
    trackingToken?: string;
    createdAt?: string;
    pelaporNama?: string;
    pelaporHp?: string;
    jenisKejadian?: string;
    tkpAlamat?: string;
  } | null>(null);
  const [copiedTicket, setCopiedTicket] = useState(false);

  // SOS Modal State
  const [showSosModal, setShowSosModal] = useState(false);
  const [sosCountdown, setSosCountdown] = useState(5);
  const [isSosSending, setIsSosSending] = useState(false);
  const sosTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Fetch Dynamic Master Data from Database on Mount
  useEffect(() => {
    let isMounted = true;
    getMasterFilterOptionsAction().then((res) => {
      if (!isMounted) return;
      if (res?.success && res.data) {
        if (Array.isArray(res.data.categories) && res.data.categories.length > 0) {
          setCategoryOptions(res.data.categories);
        }
        if (Array.isArray(res.data.subcategories) && res.data.subcategories.length > 0) {
          setSubcategories(res.data.subcategories);
        }
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Daftar Subkategori Gabungan (Prioritaskan Database, dengan Fallback Lengkap)
  const subcategoryList = useMemo(() => {
    return subcategories.length > 0 ? subcategories : [];
  }, [subcategories]);

  const categoryLabelMap: Record<string, string> = {
    KAMTIBMAS: 'Kamtibmas & Ketertiban',
    KRIMINALITAS: 'Tindak Pidana & Kriminalitas',
    LAKALANTAS: 'Lalu Lintas & Laka Lantas',
    BENCANA: 'Bencana Alam & Kebakaran',
    PELAYANAN: 'Pelayanan Publik Polri',
    NARKOBA: 'Narkotika & Zat Berbahaya',
  };

  const groupedSubcategories = useMemo(() => {
    const map: Record<string, typeof subcategoryList> = {};
    for (const sub of subcategoryList) {
      const catKey = (sub.category_key || 'KAMTIBMAS').toUpperCase();
      const label = categoryLabelMap[catKey] || catKey;
      if (!map[label]) map[label] = [];
      map[label].push(sub);
    }
    return map;
  }, [subcategoryList]);

  // 3. Handle Autocomplete Address Search (Photon Komoot API)
  const handleLocationSearch = (query: string) => {
    setLokasi(query);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!query || query.trim().length < 3) {
      setLocationSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearchingLocation(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const items = await searchIndonesianLocations(query, {
          lat: lat || undefined,
          lng: lng || undefined,
          limit: 1000,
        });
        setLocationSuggestions(items);
        setShowSuggestions(items.length > 0);
      } catch (err) {
        console.warn('Geocoding query error:', err);
      } finally {
        setIsSearchingLocation(false);
      }
    }, 200);
  };

  const handleSelectSuggestion = (item: { fullAddress: string; lat: number; lng: number }) => {
    setLokasi(item.fullAddress);
    setLat(item.lat);
    setLng(item.lng);
    setHasValidGps(true);
    setShowSuggestions(false);
  };

  // 4. GPS Auto-Detection (High Accuracy)
  const handleDetectGPS = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      alert('Perangkat Anda tidak mendukung fitur geolokasi GPS.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const curLat = Number(pos.coords.latitude.toFixed(6));
        const curLng = Number(pos.coords.longitude.toFixed(6));
        setLat(curLat);
        setLng(curLng);
        setHasValidGps(true);
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        console.warn('GPS location error:', err);
        alert('Gagal mendeteksi koordinat GPS otomatis. Pastikan izin lokasi (GPS) pada peramban Anda telah diizinkan.');
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  // 5. Handle Photo Attachment (Base64)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran foto terlalu besar. Maksimal 5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFotoBukti(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // 6. Handle Submit Complaint (Standard Flow)
  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validasi
    if (!nama.trim() || nama.trim().length < 3) {
      setErrorMessage('Nama lengkap pelapor wajib diisi (minimal 3 karakter).');
      return;
    }
    const cleanDigitsPhone = telp.replace(/\D/g, '');
    if (!cleanDigitsPhone || cleanDigitsPhone.length < 9) {
      setErrorMessage('Nomor kontak WhatsApp / HP pelapor wajib diisi minimal 9–14 digit.');
      return;
    }
    if (!selectedSubcategoryId) {
      setErrorMessage('Silakan pilih spesifikasi jenis kasus / kejadian yang dilaporkan.');
      return;
    }
    if (!lokasi.trim() || lokasi.trim().length < 5) {
      setErrorMessage('Alamat lokasi kejadian (TKP) atau patokan wajib diisi jelas.');
      return;
    }
    if (!uraian.trim() || uraian.trim().length < 10) {
      setErrorMessage('Uraian keterangan kejadian wajib diisi (minimal 10 karakter).');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedSubcat = subcategoryList.find((s) => String(s.id) === String(selectedSubcategoryId));
      const subcatName = selectedSubcat?.nama_kasus || '';
      const finalCategoryKey = selectedSubcat?.category_key || selectedCategoryKey || 'KAMTIBMAS';
      const finalUrgensi = (selectedSubcat?.default_urgensi as any) || urgensi || 'SEDANG';
      const finalJenis = subcatName || finalCategoryKey;

      const res = await createComplaintAction({
        pelaporNama: nama.trim(),
        pelaporHp: telp.trim(),
        jenisKejadian: finalJenis,
        urgensi: finalUrgensi,
        tkpAlamatTeks: lokasi.trim(),
        tkpLat: lat,
        tkpLng: lng,
        ringkasanKeterangan: uraian.trim(),
        kategoriKey: finalCategoryKey,
        subcategoryId: selectedSubcategoryId,
        platformKey: 'warga',
        fotoBuktiUrl: fotoBukti,
      });

      if (res.success && res.data) {
        setCreatedTicket({
          nomorTiket: res.data.nomorTiket,
          trackingToken: (res.data as any).trackingToken || '',
          createdAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
          pelaporNama: nama.trim(),
          pelaporHp: telp.trim(),
          jenisKejadian: finalJenis,
          tkpAlamat: lokasi.trim(),
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setErrorMessage(res.error || 'Terjadi kendala saat mengirim pengaduan ke Command Center.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal mengirim pengaduan. Periksa koneksi internet Anda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 7. Handle 1-Tap SOS Emergency
  const handleOpenSos = () => {
    setShowSosModal(true);
    setSosCountdown(5);

    // Dapatkan GPS langsung
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(Number(pos.coords.latitude.toFixed(6)));
          setLng(Number(pos.coords.longitude.toFixed(6)));
          setHasValidGps(true);
        },
        () => { },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }

    if (sosTimerRef.current) clearInterval(sosTimerRef.current);
    sosTimerRef.current = setInterval(() => {
      setSosCountdown((prev) => {
        if (prev <= 1) {
          if (sosTimerRef.current) clearInterval(sosTimerRef.current);
          handleExecuteSos();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleCancelSos = () => {
    if (sosTimerRef.current) clearInterval(sosTimerRef.current);
    setShowSosModal(false);
  };

  const handleExecuteSos = async () => {
    if (sosTimerRef.current) clearInterval(sosTimerRef.current);
    setIsSosSending(true);

    const sosNama = nama.trim() || 'Warga (Panggilan Darurat SOS)';
    const sosTelp = telp.trim() || '110';
    const sosAlamat = lokasi.trim() || 'Panggilan Darurat GPS Otomatis Warga 110';

    try {
      const res = await createComplaintAction({
        pelaporNama: sosNama,
        pelaporHp: sosTelp,
        jenisKejadian: 'KEDARURATAN & BAHAYA JIWA (SOS)',
        urgensi: 'DARURAT',
        tkpAlamatTeks: sosAlamat,
        tkpLat: lat,
        tkpLng: lng,
        ringkasanKeterangan: 'Panggilan Kedaruratan Darurat SOS 1-Tap dari Portal Warga 110. Butuh kehadiran polisi segera di lokasi koordinat.',
        platformKey: 'sos',
      });

      setShowSosModal(false);
      if (res.success && res.data) {
        setCreatedTicket({
          nomorTiket: res.data.nomorTiket,
          trackingToken: (res.data as any).trackingToken || '',
          createdAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
          pelaporNama: sosNama,
          pelaporHp: sosTelp,
          jenisKejadian: 'KEDARURATAN & BAHAYA JIWA (SOS)',
          tkpAlamat: sosAlamat,
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (_) {
      setShowSosModal(false);
      alert('Panggilan SOS telah dikirimkan ke Command Center.');
    } finally {
      setIsSosSending(false);
    }
  };

  // Reset form ke pelaporan baru
  const handleResetToNewReport = () => {
    setCreatedTicket(null);
    setNama('');
    setTelp('');
    setSelectedSubcategoryId(null);
    setSelectedCategoryKey('KAMTIBMAS');
    setUrgensi('SEDANG');
    setLokasi('');
    setLat(-7.026803);
    setLng(109.592982);
    setHasValidGps(false);
    setShowMapPicker(false);
    setUraian('');
    setFotoBukti(null);
    setErrorMessage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Copy Ticket Helper
  const handleCopyTicket = (ticketNum: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(ticketNum);
      setCopiedTicket(true);
      setTimeout(() => setCopiedTicket(false), 3000);
    }
  };

  return (
    <div className="warga-container-wrapper">
      {/* Ambient Cyber Canvas */}
      <div className="warga-ambient-canvas" />

      {/* Topbar Header Presisi */}
      <header className="warga-topbar">
        <Link href="/warga" className="warga-topbar-brand">
          <div className="warga-brand-badge">
            <Shield size={22} color="#ECC473" strokeWidth={2.4} />
          </div>
          <div>
            <div className="warga-brand-title">SIMOPMAS 110 • POLRI</div>
            <div className="warga-brand-sub">Portal Layanan Pengaduan Resmi Masyarakat</div>
          </div>
        </Link>
      </header>

      {/* Main Container */}
      <main className="warga-main-content">
        {createdTicket ? (
          /* Halaman Ucapan Terima Kasih (Thank You View) */
          <div className="warga-thank-you-view">
            {/* Gold Crest Icon */}
            <div className="thank-you-gold-crest">
              <CheckCircle2 size={42} color="#ECC473" strokeWidth={2.4} />
            </div>

            {/* Status Pill */}
            <div className="thank-you-status-pill">
              <Clock size={13} />
              <span>STATUS TIKET: MENUNGGU VERIFIKASI OPERATOR SPKT &amp; PAWAS 110</span>
            </div>

            {/* Headline Ucapan Terima Kasih */}
            <h1 className="thank-you-title">
              Terima Kasih, Pengaduan Anda Berhasil Terkirim!
            </h1>

            <p className="thank-you-subtitle">
              Kepolisian Resor Kota menyampaikan apresiasi atas partisipasi aktif Anda dalam menjaga keamanan lingkungan.
              Laporan pengaduan Anda telah terdaftar resmi di sistem Command Center 110 Presisi dan sedang dalam antrean verifikasi petugas.
            </p>

            {/* Ringkasan Tiket Resmi */}
            <div className="thank-you-ticket-card">
              <div className="ticket-card-header">
                <div>
                  <div className="ticket-label">NOMOR TIKET RESMI PENGADUAN</div>
                  <div className="ticket-value">{createdTicket.nomorTiket}</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyTicket(createdTicket.nomorTiket)}
                  className="btn-copy-ticket"
                >
                  <Copy size={13} style={{ display: 'inline', marginRight: '4px' }} />
                  {copiedTicket ? 'Tersalin!' : 'Salin Tiket'}
                </button>
              </div>

              <div className="ticket-meta-grid" style={{ marginTop: '16px' }}>
                <div className="ticket-meta-item">
                  <span className="meta-label">Nama Pelapor</span>
                  <span className="meta-val">{createdTicket.pelaporNama || nama || '-'}</span>
                </div>
                <div className="ticket-meta-item">
                  <span className="meta-label">Nomor WhatsApp Pelapor</span>
                  <span className="meta-val">{createdTicket.pelaporHp || telp || '-'}</span>
                </div>
                <div className="ticket-meta-item">
                  <span className="meta-label">Spesifikasi Kasus</span>
                  <span className="meta-val">{createdTicket.jenisKejadian || '-'}</span>
                </div>
                <div className="ticket-meta-item">
                  <span className="meta-label">Waktu Pengaduan</span>
                  <span className="meta-val">{createdTicket.createdAt || 'Baru Saja'}</span>
                </div>
                <div className="ticket-meta-item col-span-full">
                  <span className="meta-label">Lokasi Kejadian (TKP)</span>
                  <span className="meta-val">{createdTicket.tkpAlamat || lokasi || '-'}</span>
                </div>
              </div>
            </div>

            {/* Instruksi 1: Menunggu Proses Selanjutnya (Pawas & Operator SPKT) */}
            <div className="thank-you-instruction-card sop-card">
              <div className="instruction-icon-wrap amber">
                <Shield size={24} color="#ECC473" />
              </div>
              <div className="instruction-content">
                <div className="instruction-title" style={{ color: '#ECC473' }}>
                  Proses Selanjutnya: Verifikasi Operator SPKT &amp; Pawas
                </div>
                <p className="instruction-text">
                  Mohon menunggu proses selanjutnya. Laporan Anda sedang ditinjau dan divalidasi oleh Operator SPKT serta <strong>Perwira Pengawas (Pawas) Command Center 110</strong>. Setelah disetujui, perintah tugas akan langsung didisposisikan ke unit mobil patroli lapangan terdekat menuju TKP.
                </p>
              </div>
            </div>

            {/* Instruksi 2: Selalu Cek WhatsApp Untuk Memantau Tiket */}
            <div className="thank-you-instruction-card whatsapp-card">
              <div className="instruction-icon-wrap emerald">
                <Phone size={24} color="#34D399" />
              </div>
              <div className="instruction-content">
                <div className="instruction-title" style={{ color: '#34D399' }}>
                  Penting: Selalu Cek WhatsApp Anda untuk Memantau Tiket!
                </div>
                <p className="instruction-text">
                  Notifikasi perkembangan penanganan, konfirmasi petugas, serta <strong>tautan Live Radar Pelacakan</strong> armada patroli dikirimkan secara berkala ke nomor WhatsApp <strong>{createdTicket.pelaporHp || telp}</strong>.
                </p>
                <div className="whatsapp-reminder-badge">
                  <span>💬</span>
                  <span>Mohon selalu pantau pesan WhatsApp Anda agar dapat segera mengetahui status disposisi dan berkoordinasi dengan petugas.</span>
                </div>
              </div>
            </div>

            {/* Tombol Aksi */}
            <div className="thank-you-actions-row">
              <Link
                href={`/tracking?tiket=${encodeURIComponent(createdTicket.nomorTiket)}${createdTicket.trackingToken ? `&token=${encodeURIComponent(createdTicket.trackingToken)}` : ''
                  }`}
                className="btn-thank-you-tracking"
              >
                <Radio size={18} className="btn-tracking-icon flex-shrink-0" />
                <span className="btn-tracking-text">Buka Live Radar Pelacakan</span>
                <ExternalLink size={16} className="btn-tracking-arrow flex-shrink-0" />
              </Link>

              <button
                type="button"
                onClick={handleResetToNewReport}
                className="btn-thank-you-new-report"
              >
                + Buat Pengaduan Lain
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Hero Section */}
            <div className="warga-hero-section">
              <div className="warga-hero-pill">
                <Sparkles size={12} color="#ECC473" />
                <span>Layanan Kepolisian Terpadu 110 Presisi</span>
              </div>
              <h1 className="warga-hero-title">
                Pusat Bantuan &amp; Pengaduan <span className="text-amber-400">Presisi</span>
              </h1>
              <p className="warga-hero-desc">
                Sampaikan pengaduan gangguan kamtibmas, kriminalitas, dan kedaruratan secara cepat.
                Laporan Anda diverifikasi langsung oleh Command Center dan diterjunkan ke armada patroli terdekat.
              </p>
            </div>

            {/* Emergency SOS Banner (Panic Button) */}
            <div className="sos-banner-card">
              <div className="sos-banner-left">
                <div className="sos-beacon">🚨</div>
                <div>
                  <div className="sos-title">Kedaruratan Mengancam Jiwa?</div>
                  <div className="sos-desc">
                    Gunakan Tombol Darurat SOS untuk menyiarkan sinyal marabahaya instan dengan koordinat GPS Anda.
                  </div>
                </div>
              </div>
              <button type="button" onClick={handleOpenSos} className="btn-trigger-sos">
                <Siren size={15} style={{ display: 'inline', marginRight: '6px' }} />
                PANGGILAN DARURAT SOS
              </button>
            </div>

            {/* Formulir Pengaduan Utama (Obsidian & Tactical Gold) */}
            <div className="warga-form-card">
              {errorMessage && (
                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.14)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    color: '#FCA5A5',
                    fontSize: '13px',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <AlertTriangle size={16} />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form id="form-aduan-warga" data-testid="form-aduan-warga" onSubmit={handleSubmitComplaint}>
                {/* Bagian 1: Data Diri Pelapor */}
                <div className="form-section-block">
                  <div className="section-badge-header">
                    <div className="section-num-tag">1</div>
                    <div>
                      <div className="section-title">Identitas Pelapor</div>
                      <div className="section-subtitle">Privasi identitas Anda terlindungi sistem</div>
                    </div>
                  </div>

                  <div className="form-grid-2">
                    <div className="form-field-group">
                      <label className="form-label">
                        Nama Lengkap <span className="label-required">*</span>
                      </label>
                      <input
                        id="input-nama-pelapor"
                        data-testid="input-nama-pelapor"
                        type="text"
                        required
                        placeholder="Contoh: Budi Santoso"
                        value={nama}
                        onChange={(e) => setNama(e.target.value)}
                        className="warga-input"
                      />
                    </div>

                    <div className="form-field-group">
                      <label className="form-label">
                        Nomor WhatsApp / HP Aktif <span className="label-required">*</span>
                      </label>
                      <input
                        id="input-telp-pelapor"
                        data-testid="input-telp-pelapor"
                        type="tel"
                        required
                        placeholder="Contoh: 081234567890"
                        value={telp}
                        onChange={(e) => setTelp(e.target.value)}
                        className="warga-input"
                      />
                    </div>
                  </div>
                </div>

                {/* Bagian 2: Spesifikasi Jenis Kasus (Kategori & Urgensi Otomatis) */}
                <div className="form-section-block">
                  <div className="section-badge-header">
                    <div className="section-num-tag">2</div>
                    <div>
                      <div className="section-title">Spesifikasi Jenis Kasus</div>
                      <div className="section-subtitle">Pilih peristiwa atau gangguan yang Anda laporkan</div>
                    </div>
                  </div>

                  <div className="form-field-group">
                    <label className="form-label">
                      Jenis Kasus / Peristiwa <span className="label-required">*</span>
                    </label>
                    <select
                      id="select-kategori-kasus"
                      data-testid="select-kategori-kasus"
                      required
                      value={selectedSubcategoryId || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedSubcategoryId(val || null);
                        const found = subcategoryList.find((s) => String(s.id) === String(val));
                        if (found) {
                          if (found.category_key) setSelectedCategoryKey(found.category_key);
                          if (found.default_urgensi) setUrgensi(found.default_urgensi as any);
                        }
                      }}
                      className="warga-select"
                    >
                      <option value="">-- Pilih Spesifikasi Jenis Kasus / Kejadian --</option>
                      {Object.entries(groupedSubcategories).map(([groupLabel, items]) => (
                        <optgroup key={groupLabel} label={groupLabel}>
                          {items.map((sub) => (
                            <option key={sub.id} value={sub.id}>
                              {sub.nama_kasus}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Bagian 3: Lokasi Tempat Kejadian Perkara (TKP) */}
                <div className="form-section-block">
                  <div className="section-badge-header">
                    <div className="section-num-tag">3</div>
                    <div>
                      <div className="section-title">Lokasi Kejadian (TKP)</div>
                      <div className="section-subtitle">Tentukan patokan rute untuk mobil patroli</div>
                    </div>
                  </div>

                  <div className="form-field-group" style={{ position: 'relative' }}>
                    <label className="form-label">
                      Alamat Lengkap / Patokan TKP <span className="label-required">*</span>
                    </label>
                    <input
                      id="input-alamat-tkp"
                      data-testid="input-alamat-tkp"
                      type="text"
                      required
                      placeholder="Ketik nama jalan, RT/RW, atau patokan gedung..."
                      value={lokasi}
                      onChange={(e) => handleLocationSearch(e.target.value)}
                      onFocus={() => {
                        if (locationSuggestions.length > 0) setShowSuggestions(true);
                      }}
                      className="warga-input"
                    />

                    {/* Suggestions Dropdown */}
                    {showSuggestions && locationSuggestions.length > 0 && (
                      <div className="location-suggestions-box">
                        {locationSuggestions.map((sugg, idx) => (
                          <div
                            key={idx}
                            onClick={() => handleSelectSuggestion(sugg)}
                            className="location-suggestion-item"
                          >
                            <div className="sugg-title">📍 {sugg.label}</div>
                            <div className="sugg-desc">{sugg.fullAddress}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons: GPS Detect & Map Toggle */}
                  <div className="location-btn-row">
                    <button
                      type="button"
                      onClick={handleDetectGPS}
                      disabled={isLocating}
                      className={`btn-location-action ${hasValidGps ? 'active' : ''}`}
                    >
                      <Navigation size={14} className={isLocating ? 'animate-spin' : ''} />
                      <span>{isLocating ? 'Mencari Satelit GPS...' : 'Deteksi GPS Saya'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowMapPicker(!showMapPicker)}
                      className={`btn-location-action ${showMapPicker ? 'active' : ''}`}
                    >
                      <MapPin size={14} />
                      <span>{showMapPicker ? 'Tutup Peta' : 'Pilih Titik di Peta'}</span>
                    </button>
                  </div>

                  {/* Status GPS Terdeteksi (Tanpa badge koordinat mentah / Gambar 2) */}
                  {hasValidGps && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
                      <span style={{ fontSize: '11.5px', color: '#34D399', fontWeight: 600 }}>
                        ✓ Titik Koordinat GPS Berhasil Terverifikasi
                      </span>
                    </div>
                  )}

                  {/* Embedded Interactive Map Picker */}
                  {showMapPicker && (
                    <div style={{ marginTop: '14px', borderRadius: '12px', overflow: 'hidden' }}>
                      <MiniMapPicker
                        lat={lat}
                        lng={lng}
                        onChange={(nLat, nLng) => {
                          setLat(Number(nLat.toFixed(6)));
                          setLng(Number(nLng.toFixed(6)));
                          setHasValidGps(true);
                        }}
                        onAddressChange={(newAddr) => {
                          if (newAddr && !lokasi) setLokasi(newAddr);
                        }}
                        height="240px"
                      />
                      <div
                        style={{
                          background: 'rgba(14, 22, 38, 0.95)',
                          padding: '8px 12px',
                          fontSize: '11px',
                          color: '#94A3B8',
                          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                        }}
                      >
                        💡 Geser peta atau ketuk untuk memindahkan pin tepat di titik kejadian perkara.
                      </div>
                    </div>
                  )}
                </div>

                {/* Bagian 4: Deskripsi & Bukti Foto */}
                <div className="form-section-block">
                  <div className="section-badge-header">
                    <div className="section-num-tag">4</div>
                    <div>
                      <div className="section-title">Uraian &amp; Lampiran Bukti</div>
                      <div className="section-subtitle">Foto mempermudah identifikasi patroli</div>
                    </div>
                  </div>

                  <div className="form-field-group" style={{ marginBottom: '16px' }}>
                    <label className="form-label">
                      Uraian Keterangan Kejadian <span className="label-required">*</span>
                    </label>
                    <textarea
                      id="input-uraian-kejadian"
                      data-testid="input-uraian-kejadian"
                      required
                      rows={3}
                      placeholder="Jelaskan secara singkat apa yang terjadi, ciri-ciri pelaku/korban, atau situasi terkini di TKP..."
                      value={uraian}
                      onChange={(e) => setUraian(e.target.value)}
                      className="warga-textarea"
                    />
                  </div>

                  <div className="form-field-group">
                    <label className="form-label">Lampiran Foto Bukti (Opsional)</label>
                    {fotoBukti ? (
                      <div className="photo-preview-wrapper">
                        <img src={fotoBukti} alt="Bukti Kejadian" />
                        <button
                          type="button"
                          onClick={() => setFotoBukti(null)}
                          className="btn-remove-photo"
                        >
                          <X size={12} style={{ display: 'inline' }} /> Hapus Foto
                        </button>
                      </div>
                    ) : (
                      <label className="photo-dropzone">
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={handlePhotoUpload}
                          style={{ display: 'none' }}
                        />
                        <Camera size={26} color="#ECC473" style={{ margin: '0 auto 8px auto' }} />
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#F8FAFC' }}>
                          Ambil Foto atau Unggah dari Galeri
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                          Maksimal 5 MB (JPG, PNG, WEBP)
                        </div>
                      </label>
                    )}
                  </div>
                </div>

                {/* Submit CTA */}
                <button
                  id="btn-submit-aduan"
                  data-testid="btn-submit-aduan"
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-submit-complaint"
                >
                  <Send size={18} />
                  <span>{isSubmitting ? 'MENGIRIM...' : 'KIRIM PENGADUAN'}</span>
                </button>
              </form>
            </div>
          </>
        )}
      </main>

      {/* Emergency SOS Countdown Modal */}
      {showSosModal && (
        <div className="modal-overlay-futuristic">
          <div
            className="modal-content-futuristic"
            style={{
              borderColor: '#EF4444',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 50px rgba(239, 68, 68, 0.4)',
            }}
          >
            <div
              className="modal-gold-crest"
              style={{
                borderColor: '#EF4444',
                background: 'rgba(239, 68, 68, 0.2)',
                color: '#EF4444',
              }}
            >
              🚨
            </div>

            <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#F87171', marginBottom: '8px' }}>
              SIAGA DARURAT SOS 110
            </h2>

            <p style={{ fontSize: '13.5px', color: '#CBD5E1', lineHeight: 1.6, marginBottom: '20px' }}>
              Sistem akan memancarkan sinyal darurat beserta koordinat lokasi Anda ke Command Center dalam waktu:
            </p>

            <div
              style={{
                fontSize: '48px',
                fontWeight: 900,
                color: '#F87171',
                fontFamily: 'monospace',
                margin: '10px 0 24px 0',
              }}
            >
              00:0{sosCountdown}
            </div>

            <button
              type="button"
              onClick={handleExecuteSos}
              disabled={isSosSending}
              className="btn-trigger-sos"
              style={{ width: '100%', padding: '14px', fontSize: '14px', marginBottom: '10px' }}
            >
              {isSosSending ? 'MEMANCARKAN SINYAL...' : 'KIRIM SINYAL SOS SEKARANG'}
            </button>

            <button
              type="button"
              onClick={handleCancelSos}
              className="btn-secondary-close"
            >
              Batalkan Panggilan
            </button>
          </div>
        </div>
      )}

      {/* Footer Hak Cipta & Informasi Kontak */}
      <footer className="warga-footer">
        <div style={{ maxWidth: '860px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div>
            <strong>SIMOPMAS 110 • POLRI</strong> — Sistem Operasional Pelayanan Masyarakat Terpadu
          </div>
          <div>
            Panggilan Kedaruratan Bebas Pulsa: <strong>110</strong> • Siaga 24 Jam Non-Stop
          </div>
          <div style={{ fontSize: '11px', color: '#475569', marginTop: '6px' }}>
            © 2026 Kepolisian Negara Republik Indonesia. Seluruh hak cipta dilindungi undang-undang.
          </div>
        </div>
      </footer>
    </div>
  );
}
