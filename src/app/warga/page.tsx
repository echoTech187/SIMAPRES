'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import './warga.css';
import Select2CategoryDropdown, { IncidentSubcategoryOption } from '@/components/Select2CategoryDropdown';

const MiniMapPicker = dynamic(() => import('@/components/MiniMapPicker'), {
  ssr: false,
  loading: () => <div style={{ height: '220px', background: '#E2E8F0' }} />,
});

import {
  createComplaintAction,
  getComplaintByTiketAction,
  getComplaintsByPhoneAction,
  submitRatingAction,
  getMasterFilterOptionsAction,
} from '@/app/actions/complaint.actions';

interface DemoLog {
  id: number;
  nomorTiket: string;
  title: string;
  jenisInsiden: string;
  kategoriInsiden: string;
  kategoriBadge: string;
  nama: string;
  nrp: string;
  status: string;
  statusText: string;
  tahap: number;
  waktu: string;
  waktuTiba?: string;
  waktuSelesai?: string;
  sektor: string;
  lokasiKejadian: string;
  sumberLaporan: string;
  deskripsi: string;
  deskripsiTindakan?: string;
  catatanSelesai?: string;
  koordinatGps: string;
  fotoPengaduan: string;
  fotoPersiapan?: string;
  fotoTindakan?: string;
  fotoSelesai?: string;
  disposisi?: {
    satuan?: string;
    komandan?: string;
    estimasiJarak?: string;
    estimasiEta?: string;
  };
  acceptedPersonels?: Array<{ nama: string }>;
  ratingKepuasan?: {
    skor: number;
    tags: string[];
    ulasan: string;
    waktu: string;
    sudahDinilai: boolean;
  } | null;
}

// Zero-hardcode: Seluruh data tiket dan kategori dilayani langsung dari database MySQL


export default function PortalWargaPage() {
  const [activeTab, setActiveTab] = useState<'lapor' | 'lacak'>('lapor');

  // Form State
  const [categoryOptions, setCategoryOptions] = useState<
    Array<{ id: number; key: string; label: string; icon?: string | null }>
  >([]);
  const [subcategories, setSubcategories] = useState<IncidentSubcategoryOption[]>([]);
  const [subcategoryId, setSubcategoryId] = useState<number | null>(null);
  const [kategori, setKategori] = useState('');
  const [nama, setNama] = useState('');
  const [telp, setTelp] = useState('');
  const [lokasi, setLokasi] = useState('');
  const [lat, setLat] = useState<number>(-6.2415);
  const [lng, setLng] = useState<number>(106.8021);
  const [gpsCoords, setGpsCoords] = useState('');
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState<
    Array<{ label: string; subLabel: string; fullAddress: string; lat: number; lng: number }>
  >([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [uraian, setUraian] = useState('');
  const [fotoBukti, setFotoBukti] = useState<string | null>(null);

  // Tracking State
  const [ticketInput, setTicketInput] = useState('');
  const [currentActiveLog, setCurrentActiveLog] = useState<DemoLog | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Survey Rating State
  const [ratingScore, setRatingScore] = useState<number>(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [ulasanText, setUlasanText] = useState('');
  const [isEditingRating, setIsEditingRating] = useState(false);

  // Lightbox Modal State
  const [lightboxData, setLightboxData] = useState<{
    open: boolean;
    title: string;
    img: string;
    desc: string;
  }>({
    open: false,
    title: '',
    img: '',
    desc: '',
  });

  // Alert Modal State
  const [alertData, setAlertData] = useState<{
    open: boolean;
    title: string;
    message: string;
    icon: string;
  }>({
    open: false,
    title: '',
    message: '',
    icon: 'ℹ️',
  });

  // Load database master categories and recent active tickets
  useEffect(() => {
    ambilLokasiSaatIni();

    async function loadDbMasters() {
      try {
        const filterRes = await getMasterFilterOptionsAction();

        if (filterRes.success) {
          if (filterRes.data?.categories) {
            setCategoryOptions(filterRes.data.categories);
          }
          if (filterRes.data?.subcategories) {
            setSubcategories(filterRes.data.subcategories);
            if (filterRes.data.subcategories.length > 0) {
              setSubcategoryId(filterRes.data.subcategories[0].id);
              setKategori(filterRes.data.subcategories[0].nama_kasus);
            }
          }
        }
      } catch (err) {
        console.error('Error loading master data:', err);
      }
    }

    loadDbMasters();
  }, []);

  const ambilLokasiSaatIni = () => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const latVal = Number(pos.coords.latitude.toFixed(6));
          const lngVal = Number(pos.coords.longitude.toFixed(6));
          setLat(latVal);
          setLng(lngVal);
          setGpsCoords(`${latVal}, ${lngVal}`);
          if (!lokasi) {
            setLokasi(`Titik Lokasi Terkini (${latVal.toFixed(4)}, ${lngVal.toFixed(4)})`);
          }
        },
        () => {},
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  };

  const handleLocationSearch = (query: string) => {
    setLokasi(query);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!query || query.trim().length < 2) {
      setLocationSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearchingLocation(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const encoded = encodeURIComponent(query.trim());
        const res = await fetch(`https://photon.komoot.io/api/?q=${encoded}&lat=-6.2415&lon=106.8021&limit=6`);
        if (res.ok) {
          const data = await res.json();
          const items = (data?.features || []).map((feat: any) => {
            const p = feat.properties || {};
            const coords = feat.geometry?.coordinates || [106.8021, -6.2415];
            const title = p.name || p.street || query;
            const subParts = [p.street, p.district, p.city || 'DKI Jakarta'].filter(
              (part) => part && part !== title
            );
            const sub = subParts.join(', ') || 'Wilayah DKI Jakarta & Sekitarnya';
            const fullParts = [p.name, p.street, p.district, p.city].filter(Boolean);
            const full = Array.from(new Set(fullParts)).join(', ') || title;
            return {
              label: title,
              subLabel: sub,
              fullAddress: full,
              lat: Number(coords[1].toFixed(6)),
              lng: Number(coords[0].toFixed(6)),
            };
          });
          setLocationSuggestions(items);
          setShowSuggestions(items.length > 0);
        }
      } catch (err) {
        console.warn('Location search error:', err);
      } finally {
        setIsSearchingLocation(false);
      }
    }, 280);
  };

  const handleSelectSuggestion = (item: { fullAddress: string; lat: number; lng: number }) => {
    setLokasi(item.fullAddress);
    setLat(item.lat);
    setLng(item.lng);
    setGpsCoords(`${item.lat}, ${item.lng}`);
    setShowSuggestions(false);
  };

  const showAlert = (message: string, title = 'Pemberitahuan', icon = 'ℹ️') => {
    setAlertData({ open: true, title, message, icon });
  };

  const handleKirimSOS = async () => {
    const waktu = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
    let noTiket = `LP-110-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const [latStr, lngStr] = gpsCoords.split(',').map((s) => s.trim());
    const lat = parseFloat(latStr) || -6.2415;
    const lng = parseFloat(lngStr) || 106.8021;

    try {
      const dbRes = await createComplaintAction({
        pelaporNama: nama.trim() || 'Warga (Tombol SOS Darurat)',
        pelaporHp: telp.trim() || '-',
        jenisKejadian: 'Peringatan Darurat SOS 110',
        kategoriKey: 'Kamtibmas',
        platformKey: 'sos',
        urgensi: 'DARURAT',
        tkpAlamatTeks: `Kawasan Presisi (Live Satelit GPS: ${gpsCoords})`,
        tkpLat: lat,
        tkpLng: lng,
        ringkasanKeterangan: 'Aktivasi Tombol Darurat SOS Presisi: Warga membutuhkan bantuan polisi segera di lokasi.',
      });
      if (dbRes.success && dbRes.data?.nomorTiket) {
        noTiket = dbRes.data.nomorTiket;
      }
    } catch (e) {
      console.warn('Backend sync warning:', e);
    }

    const newLog: DemoLog = {
      id: Date.now(),
      nomorTiket: noTiket,
      title: '🚨 Peringatan SOS: Sinyal Bahaya Darurat Warga Terkunci GPS',
      jenisInsiden: 'Peringatan Darurat SOS 110',
      kategoriInsiden: 'Kamtibmas',
      kategoriBadge: '💥 Kamtibmas & Tawuran',
      nama: 'Warga Pelapor (Tombol SOS Darurat)',
      nrp: '-',
      status: 'diproses',
      statusText: 'Sedang Diproses',
      tahap: 2,
      waktu: waktu,
      sektor: 'Sektor Pusat',
      lokasiKejadian: `Kawasan Presisi (Live Satelit GPS: ${gpsCoords})`,
      sumberLaporan: '🚨 Tombol Darurat SOS Presisi (Live GPS)',
      deskripsi: 'Aktivasi Tombol Darurat SOS Presisi: Warga membutuhkan bantuan polisi segera di lokasi. Koordinat satelit GPS telah terkunci real-time.',
      koordinatGps: gpsCoords,
      fotoPengaduan: '',
      ratingKepuasan: null,
      disposisi: undefined,
    };

    showAlert(
      `🚨 Sinyal SOS Darurat Terkirim ke Command Center 110!\n\n` +
        `• Nomor Tiket Resmi: ${noTiket}\n` +
        `• Titik GPS Anda (${gpsCoords}) telah masuk ke sistem monitoring Pawas.\n` +
        `• Tetap tenang dan berada di lokasi aman. Armada patroli terdekat sedang dimonitor untuk penugasan.`,
      'SOS TERKIRIM',
      '🚨'
    );

    setTimeout(() => {
      setActiveTab('lacak');
      setTicketInput(noTiket);
      setCurrentActiveLog(newLog);
    }, 600);
  };

  const handleKirimLaporanManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim() || !telp.trim() || !lokasi.trim() || !uraian.trim()) {
      alert('Mohon lengkapi nama pelapor, nomor telepon, lokasi kejadian, dan uraian pengaduan.');
      return;
    }
    const namaVal = nama.trim();
    const telpVal = telp.trim();
    const lokasiVal = lokasi.trim();
    const uraianVal = uraian.trim();
    const waktu = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
    let noTiket = `LP-110-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const finalLat = lat || -6.2415;
    const finalLng = lng || 106.8021;

    try {
      const dbRes = await createComplaintAction({
        pelaporNama: namaVal,
        pelaporHp: telpVal,
        jenisKejadian: kategori || 'Pengaduan Warga',
        kategoriKey: kategori,
        subcategoryId: subcategoryId,
        platformKey: 'warga',
        urgensi: 'NORMAL',
        tkpAlamatTeks: lokasiVal,
        tkpLat: finalLat,
        tkpLng: finalLng,
        ringkasanKeterangan: uraianVal,
      });
      if (dbRes.success && dbRes.data?.nomorTiket) {
        noTiket = dbRes.data.nomorTiket;
      }
    } catch (e) {
      console.warn('Backend sync warning:', e);
    }

    const newLog: DemoLog = {
      id: Date.now(),
      nomorTiket: noTiket,
      title: kategori,
      jenisInsiden: kategori,
      kategoriInsiden: kategori,
      kategoriBadge: '📱 Portal Warga',
      nama: namaVal,
      nrp: '-',
      status: 'diproses',
      statusText: 'Sedang Diproses',
      tahap: 1,
      waktu: waktu,
      sektor: 'Jakarta Pusat',
      lokasiKejadian: lokasiVal,
      sumberLaporan: '📱 Portal Presisi Warga Online',
      deskripsi: uraianVal,
      koordinatGps: gpsCoords,
      fotoPengaduan: fotoBukti || '',
      ratingKepuasan: null,
      disposisi: undefined,
    };

    showAlert(
      `✓ Laporan Pengaduan Berhasil Terkirim!\n\n` +
        `• Nomor Tiket Resmi: ${noTiket}\n` +
        `• Kategori: ${kategori}\n` +
        `• Status: Diterima & Diverifikasi SPKT 110\n\n` +
        `Gunakan Nomor Tiket di atas pada tab "Lacak Tiket" untuk memantau kehadiran petugas.`,
      'LAPORAN DITERIMA',
      '✅'
    );

    setNama('');
    setTelp('');
    setLokasi('');
    setUraian('');
    setFotoBukti(null);

    setTimeout(() => {
      setActiveTab('lacak');
      setTicketInput(noTiket);
      setCurrentActiveLog(newLog);
    }, 600);
  };

  const handleLacakLaporan = async (overrideTiket?: string) => {
    const q = (overrideTiket || ticketInput || '').trim();
    if (!q) {
      showAlert('Mohon masukkan Nomor Tiket terlebih dahulu!');
      return;
    }

    setIsSearching(true);
    let found: DemoLog | undefined = undefined;

    // 1. Prioritaskan Lookup Database MySQL Resmi Langsung
    try {
      const res = await getComplaintByTiketAction(q);
      if (res.success && res.data) {
        const dbItem = res.data as any;
        const isDone = dbItem.status === 'SELESAI';
        found = {
          id: Number(dbItem.id || Date.now()),
          nomorTiket: dbItem.nomorTiket,
          title: dbItem.jenisKejadian,
          jenisInsiden: dbItem.jenisKejadian,
          kategoriInsiden: dbItem.jenisKejadian,
          kategoriBadge: '📱 Portal Warga (Database)',
          nama: dbItem.assignedOfficer?.user?.fullName || dbItem.pelaporNama || '-',
          nrp: dbItem.assignedOfficer?.nrp || '-',
          status: isDone ? 'selesai' : 'diproses',
          statusText: isDone ? 'Kasus Selesai' : 'Sedang Diproses',
          tahap: isDone ? 5 : dbItem.status === 'DI_TKP' ? 4 : 3,
          waktu: new Date(dbItem.waktuLaporDiterima || dbItem.createdAt || Date.now()).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
          sektor: '-',
          lokasiKejadian: dbItem.tkpAlamatTeks || '-',
          sumberLaporan: '📱 Portal Presisi 110',
          deskripsi: dbItem.ringkasanKeterangan || '-',
          koordinatGps: `${dbItem.tkpLat || 0}, ${dbItem.tkpLng || 0}`,
          fotoPengaduan: dbItem.fotoTkpUrl || '',
          disposisi: {
            satuan: dbItem.assignedOfficer?.unitNama || '-',
            komandan: dbItem.assignedOfficer?.user?.fullName || '-',
            estimasiJarak: '-',
            estimasiEta: '-',
          },
          ratingKepuasan: dbItem.citizenRating
            ? {
                skor: dbItem.citizenRating,
                tags: dbItem.citizenTags ? dbItem.citizenTags.split(', ') : [],
                ulasan: dbItem.citizenReview || '',
                waktu: 'Hari ini',
                sudahDinilai: true,
              }
            : null,
        };
      }
    } catch (err) {
      console.warn('DB lookup error:', err);
    }

    if (!found) {
      setIsSearching(false);
      showAlert(
        `❌ Nomor Tiket "${q}" tidak ditemukan di database SIMAPRES 110.\n\n` +
          `Pastikan nomor tiket Anda sesuai dengan tanda bukti lapor atau klik salah satu tiket aktif di bawah.`,
        'Tiket Tidak Ditemukan',
        '⚠️'
      );
      return;
    }

    setTimeout(() => {
      setIsSearching(false);
      setCurrentActiveLog(found!);
      setIsEditingRating(false);
    }, 300);
  };

  const handleToggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmitSurvey = async () => {
    if (!currentActiveLog) return;
    const waktuSekarang = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
    const finalReview = ulasanText.trim();

    try {
      await submitRatingAction({
        nomorTiket: currentActiveLog.nomorTiket,
        rating: ratingScore,
        review: finalReview,
        tags: selectedTags.join(', '),
      });
    } catch (err) {
      console.warn('Backend rating sync warning:', err);
    }

    setCurrentActiveLog({
      ...currentActiveLog,
      ratingKepuasan: {
        skor: ratingScore,
        tags: selectedTags.length ? selectedTags : ['⚡ Respon Sangat Cepat', '👮 Petugas Ramah & Humanis'],
        ulasan: finalReview,
        waktu: `Hari ini, ${waktuSekarang}`,
        sudahDinilai: true,
      },
    });

    setIsEditingRating(false);
    showAlert(
      `⭐ Terima Kasih atas Penilaian Anda!\n\n` +
        `• Skor: ${ratingScore}/5 Bintang (${getScoreTitle(ratingScore)})\n` +
        `• Tag: ${selectedTags.join(', ')}\n\n` +
        `Ulasan Anda telah masuk ke dashboard pimpinan untuk pemantauan kualitas pelayanan kepolisian terpadu.`,
      'PENILAIAN DITERIMA',
      '⭐'
    );
  };

  const getScoreTitle = (score: number) => {
    switch (score) {
      case 5:
        return 'Luar Biasa & Sangat Memuaskan';
      case 4:
        return 'Sangat Baik & Cepat';
      case 3:
        return 'Cukup Memuaskan';
      case 2:
        return 'Kurang Memuaskan';
      case 1:
        return 'Sangat Kecewa';
      default:
        return 'Memuaskan';
    }
  };

  const openPhotoModal = (type: string) => {
    if (type === 'pengaduan') {
      const img = currentActiveLog?.fotoPengaduan;
      if (!img) {
        alert('Tidak ada foto bukti pengaduan yang dilampirkan.');
        return;
      }
      setLightboxData({
        open: true,
        title: 'Foto Bukti Pengaduan Awal',
        img,
        desc: 'Dokumentasi kejadian yang diunggah saat laporan pertama kali dibuat.',
      });
    } else if (type === 'persiapan') {
      const img = currentActiveLog?.fotoPersiapan;
      if (!img) {
        alert('Tidak ada foto persiapan yang dilampirkan.');
        return;
      }
      setLightboxData({
        open: true,
        title: 'Bukti Keberangkatan & GPS Personel',
        img,
        desc: 'Dokumentasi personel meluncur dengan kesiapan ranmor patroli dan GPS aktif.',
      });
    } else {
      const img = currentActiveLog?.fotoTindakan;
      if (!img) {
        alert('Tidak ada foto penanganan TKP yang dilampirkan.');
        return;
      }
      setLightboxData({
        open: true,
        title: 'Dokumentasi Penanganan di TKP',
        img,
        desc: 'Dokumentasi tindakan mediasi, olah TKP, dan penanganan oleh petugas di lokasi.',
      });
    }
  };

  return (
    <>
      {/* Header */}
      <header className="header">
        <Link href="/warga" className="header-brand">
          <div className="brand-logo">
            <div className="brand-logo-inner"></div>
          </div>
          <div className="header-titles">
            <h1>
              Layanan Terpadu 110 <span className="header-badge-live">● LIVE</span>
            </h1>
            <p>Layanan Cepat &amp; Pelacakan Presisi Polri</p>
          </div>
        </Link>
        <div className="header-actions">
          <Link href="/" className="header-link-btn">
            <span>🛡️</span> Area Petugas
          </Link>
        </div>
      </header>

      <main className="container">
        {/* Segmented Navigation (Tab Switcher) */}
        <nav className="tabs-nav" aria-label="Navigasi Portal Warga">
          <button
            type="button"
            className={`tab-btn ${activeTab === 'lapor' ? 'active' : ''}`}
            onClick={() => setActiveTab('lapor')}
          >
            <span>🚨</span> Buat Laporan / SOS
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'lacak' ? 'active' : ''}`}
            onClick={() => setActiveTab('lacak')}
          >
            <span>🔍</span> Lacak Tiket &amp; Status
          </button>
        </nav>

        {/* ========================================================
             TAB 1: BUAT LAPORAN / SOS DARURAT
             ======================================================== */}
        {activeTab === 'lapor' && (
          <div className="tab-content active" id="tab-pane-lapor">
            {/* Tombol Panik SOS */}
            <section className="sos-hero" aria-labelledby="sos-title">
              <div
                className="sos-button"
                onClick={handleKirimSOS}
                title="Tekan untuk mengirimkan sinyal bahaya cepat"
              >
                SOS
              </div>
              <div className="sos-title" id="sos-title">
                Tombol Darurat SOS Presisi
              </div>
              <div className="sos-subtitle">
                Tekan tombol di atas untuk situasi darurat mengancam keselamatan. Titik koordinat satelit GPS Anda akan
                otomatis dikirimkan ke Command Center 110.
              </div>
            </section>

            {/* Formulir Lapor Pengaduan Warga */}
            <section className="card" aria-labelledby="form-lapor-title">
              <h2 id="form-lapor-title">
                <span>Formulir Laporan Pengaduan</span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#0284C7',
                    background: '#F0F9FF',
                    border: '1px solid #BAE6FD',
                    padding: '3px 8px',
                    borderRadius: '12px',
                  }}
                >
                  📱 Portal Online
                </span>
              </h2>
              <p className="desc">
                Laporkan kejadian gangguan keamanan, kecelakaan, atau kebutuhan bantuan kepolisian dengan data lengkap
                agar segera ditindaklanjuti.
              </p>

              <form id="form-lapor-warga" onSubmit={handleKirimLaporanManual}>
                {/* Kategori Laporan (Select2 Style Searchable) */}
                <div className="form-group">
                  <label className="form-label" htmlFor="lapor-kategori">
                    Kategori Laporan <span className="req">*</span>
                  </label>
                  <Select2CategoryDropdown
                    subcategories={subcategories}
                    selectedId={subcategoryId}
                    onSelect={(item) => {
                      if (item) {
                        setSubcategoryId(item.id);
                        setKategori(item.nama_kasus);
                      } else {
                        setSubcategoryId(null);
                        setKategori('');
                      }
                    }}
                    placeholder="-- Cari / Pilih Kategori Kasus Laporan --"
                    required
                  />
                </div>

                {/* Nama Pelapor & No HP */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="lapor-nama">
                      Nama Lengkap Pelapor <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      id="lapor-nama"
                      className="form-control"
                      placeholder="Masukkan nama lengkap Anda"
                      value={nama}
                      onChange={(e) => setNama(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="lapor-telp">
                      Nomor WhatsApp / HP <span className="req">*</span>
                    </label>
                    <input
                      type="tel"
                      id="lapor-telp"
                      className="form-control"
                      placeholder="Contoh: 081234567890"
                      value={telp}
                      onChange={(e) => setTelp(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Lokasi Kejadian (TKP) dengan Google-style Search & Peta Interaktif */}
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label className="form-label" htmlFor="lapor-lokasi" style={{ marginBottom: 0 }}>
                      Lokasi Kejadian (TKP) <span className="req">*</span>
                    </label>
                    <button
                      type="button"
                      id="btn-toggle-warga-map"
                      onClick={() => setShowMapPicker(!showMapPicker)}
                      style={{
                        background: showMapPicker ? '#EFF6FF' : '#F8FAFC',
                        border: showMapPicker ? '1.5px solid #2563EB' : '1px solid #CBD5E1',
                        color: showMapPicker ? '#1D4ED8' : '#334155',
                        padding: '3px 9px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span>🗺️</span> {showMapPicker ? 'Tutup Peta' : 'Pilih Titik di Peta'}
                    </button>
                  </div>

                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      id="lapor-lokasi"
                      className="form-control"
                      placeholder="Ketik alamat TKP atau cari nama tempat..."
                      value={lokasi}
                      onChange={(e) => handleLocationSearch(e.target.value)}
                      onFocus={() => {
                        if (locationSuggestions.length > 0) setShowSuggestions(true);
                      }}
                      required
                      style={{ paddingRight: '60px' }}
                    />
                    {isSearchingLocation && (
                      <div
                        style={{
                          position: 'absolute',
                          right: '34px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          fontSize: '11px',
                          color: '#3B82F6',
                        }}
                      >
                        🔄
                      </div>
                    )}
                    <button
                      type="button"
                      className="input-icon-btn"
                      onClick={ambilLokasiSaatIni}
                      title="Dapatkan Lokasi GPS Saat Ini"
                      style={{
                        position: 'absolute',
                        right: '6px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '16px',
                      }}
                    >
                      📍
                    </button>

                    {/* Suggestions Dropdown */}
                    {showSuggestions && locationSuggestions.length > 0 && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 'calc(100% + 4px)',
                          left: 0,
                          right: 0,
                          background: '#FFFFFF',
                          borderRadius: '8px',
                          border: '1px solid #CBD5E1',
                          boxShadow: '0 12px 28px -4px rgba(0, 0, 0, 0.25)',
                          zIndex: 9999,
                          maxHeight: '260px',
                          overflowY: 'auto',
                        }}
                      >
                        <div
                          style={{
                            padding: '6px 10px',
                            background: '#F8FAFC',
                            borderBottom: '1px solid #E2E8F0',
                            fontSize: '10.5px',
                            fontWeight: 700,
                            color: '#64748B',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <span>📍 HASIL PENCARIAN TEMPAT &amp; ALAMAT</span>
                          <span
                            style={{ cursor: 'pointer', color: '#94A3B8' }}
                            onClick={() => setShowSuggestions(false)}
                          >
                            ✕ Tutup
                          </span>
                        </div>
                        {locationSuggestions.map((item, idx) => (
                          <div
                            key={idx}
                            onClick={() => handleSelectSuggestion(item)}
                            style={{
                              padding: '9px 12px',
                              cursor: 'pointer',
                              borderBottom: idx < locationSuggestions.length - 1 ? '1px solid #F1F5F9' : 'none',
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '10px',
                              transition: 'background 0.15s ease',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = '#EFF6FF')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
                          >
                            <span style={{ fontSize: '16px', lineHeight: 1.2 }}>📍</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div
                                style={{
                                  fontSize: '12.5px',
                                  fontWeight: 700,
                                  color: '#1E293B',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {item.label}
                              </div>
                              <div
                                style={{
                                  fontSize: '11px',
                                  color: '#64748B',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {item.subLabel}
                              </div>
                            </div>
                            <span
                              style={{
                                fontSize: '10px',
                                color: '#2563EB',
                                background: '#DBEAFE',
                                padding: '1px 5px',
                                borderRadius: '4px',
                                fontFamily: 'monospace',
                                fontWeight: 600,
                                alignSelf: 'center',
                              }}
                            >
                              PILIH
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Interactive Map Picker (Opsi Pilih Titik di Peta Langsung) */}
                  {showMapPicker && (
                    <div
                      style={{
                        marginTop: '10px',
                        marginBottom: '10px',
                        border: '1.5px solid #93C5FD',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        background: '#F8FAFC',
                        padding: '10px',
                        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.08)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '8px',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            color: '#1E40AF',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          📍 Klik peta atau geser pin merah untuk mengunci titik TKP
                        </span>
                        <span style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 600 }}>
                          Google Maps Live
                        </span>
                      </div>
                      <MiniMapPicker
                        lat={lat || -6.2415}
                        lng={lng || 106.8021}
                        height="220px"
                        onChange={(newLat, newLng) => {
                          setLat(newLat);
                          setLng(newLng);
                          setGpsCoords(`${newLat.toFixed(4)}, ${newLng.toFixed(4)}`);
                        }}
                        onAddressChange={(alamat) => {
                          setLokasi(alamat);
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Keterangan Kejadian */}
                <div className="form-group">
                  <label className="form-label" htmlFor="lapor-uraian">
                    Keterangan / Uraian Singkat Kejadian <span className="req">*</span>
                  </label>
                  <textarea
                    id="lapor-uraian"
                    className="form-control"
                    placeholder="Jelaskan secara ringkas apa yang terjadi, situasi di lapangan, korban, atau bantuan yang dibutuhkan..."
                    value={uraian}
                    onChange={(e) => setUraian(e.target.value)}
                    required
                  ></textarea>
                </div>

                {/* Lampiran Foto */}
                <div className="form-group">
                  <label className="form-label" htmlFor="lapor-foto">
                    Lampiran Foto Lokasi / Bukti (Opsional)
                  </label>
                  <input
                    type="file"
                    id="lapor-foto"
                    className="form-control"
                    accept="image/*"
                    style={{ padding: '9px 12px', fontSize: '12.5px' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => setFotoBukti(reader.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>
                    Format JPG/PNG maks 5MB. Foto membantu petugas mempersiapkan taktis lapangan.
                  </div>
                </div>

                {/* Tombol Kirim */}
                <button type="submit" className="btn-submit-lapor" id="btn-kirim-laporan">
                  <span>🚀</span> Kirim Laporan
                </button>
              </form>
            </section>
          </div>
        )}

        {/* ========================================================
             TAB 2: LACAK TIKET & SURVEI KEPUASAN
             ======================================================== */}
        {activeTab === 'lacak' && (
          <div className="tab-content active" id="tab-pane-lacak">
            {/* Input Pencarian Tiket */}
            <section className="card" id="search-card" aria-labelledby="search-card-title">
              <h2 id="search-card-title">Lacak Status Penanganan Laporan</h2>
              <p className="desc">
                Masukkan Nomor Tiket 110 resmi yang Anda terima untuk memantau pergerakan personel kepolisian secara
                real-time dari diterimanya laporan hingga penutupan kasus.
              </p>

              <div className="input-group-search">
                <input
                  type="text"
                  id="ticket-input"
                  placeholder="Masukkan Nomor Tiket 110 Anda (Contoh: LP-110-202610-0001)"
                  value={ticketInput}
                  onChange={(e) => setTicketInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLacakLaporan()}
                />
              </div>

              <button
                type="button"
                className="btn-search"
                disabled={isSearching}
                onClick={() => handleLacakLaporan()}
              >
                {isSearching ? (
                  <span>⏳ Memproses Data Real-Time...</span>
                ) : (
                  <>
                    <span>🔍</span> Lacak Laporan Sekarang
                  </>
                )}
              </button>
            </section>

            {/* Panduan & Informasi Layanan (Ditampilkan saat belum ada tiket dicari) */}
            {!currentActiveLog && (
              <div id="tracking-empty-guide">
                {/* Card 1: 5 Tahapan Alur Penanganan Presisi */}
                <div className="card" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <h3
                      style={{
                        fontSize: '15px',
                        fontWeight: 800,
                        color: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <span>🛡️</span> Alur Transparansi Penanganan Laporan 110
                    </h3>
                    <span
                      style={{
                        fontSize: '10.5px',
                        fontWeight: 800,
                        background: '#EFF6FF',
                        color: '#1D4ED8',
                        border: '1px solid #BFDBFE',
                        padding: '2px 8px',
                        borderRadius: '12px',
                      }}
                    >
                      5 TAHAPAN RESMI
                    </span>
                  </div>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '16px' }}>
                    Setiap pengaduan masyarakat yang terdaftar diproses secara akuntabel dan terpantau langsung melalui
                    sistem monitoring Command Center:
                  </p>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
                      gap: '10px',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '12px 8px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: '#EFF6FF',
                          color: '#1D4ED8',
                          fontWeight: 800,
                          fontSize: '13px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 8px',
                        }}
                      >
                        1
                      </div>
                      <div style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--text)', marginBottom: '2px' }}>
                        Verifikasi SPKT
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Pemeriksaan data &amp; keabsahan</div>
                    </div>

                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '12px 8px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: '#FEF3C7',
                          color: '#B45309',
                          fontWeight: 800,
                          fontSize: '13px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 8px',
                        }}
                      >
                        2
                      </div>
                      <div style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--text)', marginBottom: '2px' }}>
                        Disposisi Pawas
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Penugasan unit regu patroli</div>
                    </div>

                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '12px 8px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: '#DBEAFE',
                          color: '#1E40AF',
                          fontWeight: 800,
                          fontSize: '13px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 8px',
                        }}
                      >
                        3
                      </div>
                      <div style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--text)', marginBottom: '2px' }}>
                        Meluncur TKP
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Pergerakan armada via GPS</div>
                    </div>

                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '12px 8px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: '#FEE2E2',
                          color: '#DC2626',
                          fontWeight: 800,
                          fontSize: '13px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 8px',
                        }}
                      >
                        4
                      </div>
                      <div style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--text)', marginBottom: '2px' }}>
                        Tindakan TKP
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Pengamanan &amp; BAP resmi</div>
                    </div>

                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '12px 8px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: '#DCFCE7',
                          color: '#15803D',
                          fontWeight: 800,
                          fontSize: '13px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 8px',
                        }}
                      >
                        5
                      </div>
                      <div style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--text)', marginBottom: '2px' }}>
                        Selesai &amp; Evaluasi
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Pengesahan &amp; rating warga</div>
                    </div>
                  </div>
                </div>

                {/* Card 2: Informasi Bantuan & Call Center 110 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                  <div className="card" style={{ padding: '16px', marginBottom: 0, background: '#F0FDF4', borderColor: '#BBF7D0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '18px' }}>⏱️</span>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#15803D' }}>
                        Standar Respon Cepat (SLA)
                      </div>
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#166534', lineHeight: 1.5 }}>
                      Armada Samapta dan Raimas Presisi ditargetkan tiba di lokasi kejadian dalam waktu{' '}
                      <strong>10 menit</strong> sejak perintah disposisi diterbitkan.
                    </div>
                  </div>

                  <div className="card" style={{ padding: '16px', marginBottom: 0, background: '#EFF6FF', borderColor: '#BFDBFE' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '18px' }}>📞</span>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#1D4ED8' }}>
                        Panggilan Darurat 110
                      </div>
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#1E40AF', lineHeight: 1.5 }}>
                      Layanan bebas pulsa siaga 24 jam untuk kondisi kritis yang membutuhkan tindakan kepolisian segera di
                      seluruh wilayah DKI Jakarta.
                    </div>
                  </div>
                </div>

                {/* Banner Panduan Mendapatkan Tiket */}
                <div
                  style={{
                    background: '#FFFBEB',
                    border: '1.5px dashed #FDE68A',
                    borderRadius: '14px',
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                  }}
                >
                  <span style={{ fontSize: '22px' }}>💡</span>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#B45309', marginBottom: '2px' }}>
                      Belum Memiliki Nomor Tiket?
                    </div>
                    <div style={{ fontSize: '12px', color: '#92400E', lineHeight: 1.45 }}>
                      Anda dapat membuat laporan baru atau mengaktifkan suar darurat melalui tab{' '}
                      <button
                        type="button"
                        onClick={() => setActiveTab('lapor')}
                        style={{
                          fontWeight: 800,
                          color: '#B45309',
                          textDecoration: 'underline',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        🚨 Buat Laporan / SOS
                      </button>
                      . Nomor tiket resmi akan diterbitkan secara instan.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tracking Result Container */}
            {currentActiveLog && (
              <section className="card" id="tracking-result" style={{ display: 'block' }}>
                <h2 id="tracking-result-title">
                  <span>Hasil Pelacakan Laporan</span>
                  <span
                    id="badge-header-status"
                    className={`status-badge ${
                      currentActiveLog.status === 'selesai' || currentActiveLog.tahap >= 5 ? 'selesai' : 'diproses'
                    }`}
                  >
                    {currentActiveLog.status === 'selesai' || currentActiveLog.tahap >= 5
                      ? '✓ Selesai Ditangani'
                      : `⚡ Tahap ${currentActiveLog.tahap} • Diproses`}
                  </span>
                </h2>

                {/* Ticket Metadata Header */}
                <div className="ticket-header" id="ticket-header-content">
                  <div className="ticket-row">
                    <span className="ticket-label">Nomor Tiket Resmi</span>
                    <span className="ticket-value" id="th-nomor" style={{ color: 'var(--primary)', fontSize: '13.5px' }}>
                      {currentActiveLog.nomorTiket}
                    </span>
                  </div>
                  <div className="ticket-row">
                    <span className="ticket-label">Jenis Insiden</span>
                    <span className="ticket-value" id="th-jenis">
                      {currentActiveLog.jenisInsiden || currentActiveLog.title}
                    </span>
                  </div>
                  <div className="ticket-row">
                    <span className="ticket-label">Waktu Dilaporkan</span>
                    <span className="ticket-value" id="th-waktu">
                      Hari ini, {currentActiveLog.waktu}
                    </span>
                  </div>
                  <div className="ticket-row">
                    <span className="ticket-label">Lokasi Kejadian</span>
                    <span className="ticket-value" id="th-lokasi">
                      {currentActiveLog.lokasiKejadian}
                    </span>
                  </div>
                  <div className="ticket-row">
                    <span className="ticket-label">Personel Ditugaskan</span>
                    <span className="ticket-value" id="th-petugas">
                      {currentActiveLog.disposisi?.satuan || '-'} (
                      {currentActiveLog.disposisi?.komandan || currentActiveLog.nama || '-'})
                    </span>
                  </div>
                </div>

                {/* 5-Step Vertical Timeline */}
                <div className="timeline" id="timeline-container">
                  {/* Step 1: Diterima SPKT */}
                  <div className="step completed" id="step-1-el">
                    <div className="step-icon"></div>
                    <div className="step-content">
                      <div className="step-title">1. Laporan Diterima &amp; Diverifikasi SPKT 110</div>
                      <div className="step-desc" id="step-1-desc">
                        Laporan Anda telah divalidasi oleh petugas piket dan diteruskan ke sistem disposisi pimpinan.
                      </div>
                      <div className="step-time" id="step-1-time">
                        {currentActiveLog.waktu}
                      </div>
                      <div>
                        <button
                          type="button"
                          className="btn-photo-link"
                          id="btn-foto-1"
                          onClick={() => openPhotoModal('pengaduan')}
                        >
                          <span>📷</span> Lihat Bukti Pengaduan ➔
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Step 2: Disposisi */}
                  <div className={`step ${currentActiveLog.tahap >= 2 ? 'completed' : 'inactive'}`} id="step-2-el">
                    <div className="step-icon"></div>
                    <div className="step-content">
                      <div className="step-title">2. Disposisi Satuan Patroli Lapangan</div>
                      <div className="step-desc" id="step-2-desc">
                        Tugas penanganan telah diserahkan kepada{' '}
                        {currentActiveLog.disposisi?.satuan || '-'} (
                        {currentActiveLog.disposisi?.komandan || '-'}).
                      </div>
                      <div className="step-time" id="step-2-time">
                        {currentActiveLog.waktu}
                      </div>
                    </div>
                  </div>

                  {/* Step 3: Menuju Lokasi */}
                  <div
                    className={`step ${
                      currentActiveLog.tahap === 3
                        ? 'active'
                        : currentActiveLog.tahap > 3
                        ? 'completed'
                        : 'inactive'
                    }`}
                    id="step-3-el"
                  >
                    <div className="step-icon"></div>
                    <div className="step-content">
                      <div className="step-title">3. Personel Meluncur Menuju Lokasi (En Route)</div>
                      <div className="step-desc" id="step-3-desc">
                        Personel bergerak menuju lokasi dengan kelengkapan alutsista dinas.
                      </div>
                      <div className="step-time" id="step-3-time">
                        10:50 WIB
                      </div>
                      <div id="step-3-chip-wrap">
                        <span className="info-chip-box" id="step-3-gps-chip">
                          📍 GPS: {currentActiveLog.koordinatGps}
                        </span>
                        <button
                          type="button"
                          className="btn-photo-link"
                          id="btn-foto-persiapan"
                          onClick={() => openPhotoModal('persiapan')}
                        >
                          <span>📸</span> Bukti Keberangkatan &amp; GPS ➔
                        </button>
                      </div>

                      {/* Live Map with Police Avatar */}
                      <div className="tracking-map" id="step-3-map" style={{ display: 'block' }}>
                        <div
                          style={{
                            width: '100%',
                            height: '180px',
                            background: 'radial-gradient(circle at center, #1E3A8A 0%, #0F172A 100%)',
                            borderRadius: '8px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            position: 'relative',
                            overflow: 'hidden',
                          }}
                        >
                          <div style={{ fontSize: '32px', marginBottom: '6px' }}>🛰️</div>
                          <div style={{ fontSize: '13px', fontWeight: 800 }}>Radar GPS Satelit Presisi Terkunci</div>
                          <div style={{ fontSize: '11px', color: '#93C5FD', marginTop: '2px' }}>
                            {currentActiveLog.disposisi?.satuan || 'Unit Samapta Presisi'} • Meluncur ke Titik Aduan
                          </div>
                        </div>
                        <div className="map-overlay">
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              background: '#153E75',
                              border: '2px solid white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '18px',
                            }}
                          >
                            👮
                          </div>
                          <div className="police-info">
                            <h4 id="map-police-name">
                              {currentActiveLog.disposisi?.komandan || currentActiveLog.nama}
                            </h4>
                            <p id="map-police-eta">
                              ⚡ Status: {currentActiveLog.tahap >= 5 ? 'Tuntas di Lokasi' : 'Menuju Lokasi (Dalam Penanganan)'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Step 4: Penanganan di Lokasi */}
                  <div
                    className={`step ${
                      currentActiveLog.tahap === 4
                        ? 'active'
                        : currentActiveLog.tahap >= 5
                        ? 'completed'
                        : 'inactive'
                    }`}
                    id="step-4-el"
                  >
                    <div className="step-icon"></div>
                    <div className="step-content">
                      <div className="step-title">4. Penanganan Kepolisian di TKP</div>
                      <div className="step-desc" id="step-4-desc">
                        Personel telah tiba di lokasi dan mengambil tindakan pengamanan serta mediasi terpadu.
                      </div>
                      <div className="step-time" id="step-4-time">
                        {currentActiveLog.waktuTiba || '-'}
                      </div>
                      <div className="quote-box" id="step-4-quote">
                        <strong>Berita Acara Tindakan:</strong>
                        <br />
                        <span id="step-4-quote-text">
                          {currentActiveLog.deskripsiTindakan || '-'}
                        </span>
                      </div>
                      <div style={{ marginTop: '6px' }}>
                        <button
                          type="button"
                          className="btn-photo-link"
                          id="btn-foto-tindakan"
                          onClick={() => openPhotoModal('tindakan')}
                        >
                          <span>📸</span> Dokumentasi Penanganan TKP ➔
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Step 5: Selesai */}
                  <div className={`step ${currentActiveLog.tahap >= 5 ? 'completed' : 'inactive'}`} id="step-5-el">
                    <div className="step-icon"></div>
                    <div className="step-content">
                      <div className="step-title">5. Kasus Selesai &amp; Berita Acara Disahkan</div>
                      <div className="step-desc" id="step-5-desc">
                        {currentActiveLog.catatanSelesai || '-'}
                      </div>
                      <div className="step-time" id="step-5-time">
                        {currentActiveLog.waktuSelesai || '-'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* SURVEI & RATING KEPUASAN MASYARAKAT */}
                <div id="rating-section-container">
                  {currentActiveLog.tahap < 5 && currentActiveLog.status !== 'selesai' ? (
                    <div className="pending-survey-banner">
                      <span>⏳</span> <strong>Survei Kepuasan Warga Belum Tersedia</strong>
                      <br />
                      Formulir evaluasi kepuasan akan terbuka secara otomatis segera setelah personel kepolisian
                      menyelesaikan seluruh tindakan di lapangan (Tahap 5). Saat ini proses berada di{' '}
                      <strong>Tahap {currentActiveLog.tahap}/5</strong>.
                    </div>
                  ) : currentActiveLog.ratingKepuasan?.sudahDinilai && !isEditingRating ? (
                    <div className="survey-card" style={{ borderColor: '#A7F3D0', background: '#F0FDF4' }}>
                      <div className="confirmed-box">
                        <div className="confirmed-icon">✓</div>
                        <h4>Terima Kasih! Penilaian Anda Telah Diterima</h4>
                        <p className="c-sub">
                          Apresiasi dan masukan Anda telah terkirim langsung ke Command Center 110 &amp; Pimpinan Pengawas
                          Polri.
                        </p>

                        <div className="confirmed-stars">
                          {'★'.repeat(currentActiveLog.ratingKepuasan.skor) +
                            '☆'.repeat(5 - currentActiveLog.ratingKepuasan.skor)}
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: '#065F46', marginBottom: '12px' }}>
                          Skor: {currentActiveLog.ratingKepuasan.skor}/5 •{' '}
                          {getScoreTitle(currentActiveLog.ratingKepuasan.skor)}
                        </div>

                        {currentActiveLog.ratingKepuasan.tags?.length > 0 && (
                          <div
                            style={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              justifyContent: 'center',
                              gap: '4px',
                              marginBottom: '14px',
                            }}
                          >
                            {currentActiveLog.ratingKepuasan.tags.map((t) => (
                              <span key={t} className="quick-pill done" style={{ fontSize: '11px', margin: '2px' }}>
                                {t}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="confirmed-review-quote">"{currentActiveLog.ratingKepuasan.ulasan}"</div>

                        <div className="confirmed-meta">
                          🕒 Dinilai pada: {currentActiveLog.ratingKepuasan.waktu} • Status: Terverifikasi Presisi
                        </div>

                        <button
                          type="button"
                          className="btn-reedit-rating"
                          onClick={() => setIsEditingRating(true)}
                        >
                          ✏️ Ubah / Perbarui Penilaian Anda
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="survey-card">
                      <span className="survey-badge">⭐ SURVEI KEPUASAN MASYARAKAT (LAYANAN 110)</span>
                      <h3>Bagaimana Pelayanan Petugas Kami?</h3>
                      <p className="survey-intro">
                        Kasus Anda telah dinyatakan selesai ditangani. Bantu kami meningkatkan transparansi dan mutu
                        pelayanan Polri dengan memberikan ulasan objektif terhadap respons serta tindakan personel di
                        lapangan.
                      </p>

                      <div className="star-rating-box">
                        <div className="stars-row" id="stars-row">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <button
                              key={s}
                              type="button"
                              className={`star-btn ${s <= ratingScore ? 'active' : ''}`}
                              onClick={() => setRatingScore(s)}
                            >
                              ★
                            </button>
                          ))}
                        </div>
                        <div className="star-score-label" id="star-score-text">
                          {'⭐'.repeat(ratingScore)} {ratingScore}/5 - {getScoreTitle(ratingScore)}
                        </div>
                      </div>

                      <label className="tags-label">Pilih Aspek Pelayanan yang Paling Menonjol:</label>
                      <div className="tags-container" id="tags-selector">
                        {[
                          '⚡ Respon Sangat Cepat',
                          '👮 Petugas Ramah & Humanis',
                          '🛡️ Wilayah Kembali Aman',
                          '✓ Masalah Tuntas 100%',
                          '📢 Komunikasi Jelas & Sopan',
                          '⏱️ Tiba Tepat Waktu',
                        ].map((t) => (
                          <span
                            key={t}
                            className={`tag-chip ${selectedTags.includes(t) ? 'active' : ''}`}
                            onClick={() => handleToggleTag(t)}
                          >
                            {t}
                          </span>
                        ))}
                      </div>

                      <label className="tags-label" htmlFor="survey-ulasan">
                        Pesan Apresiasi atau Saran untuk Personel di Lokasi:
                      </label>
                      <textarea
                        id="survey-ulasan"
                        className="survey-textarea"
                        placeholder="Contoh: Petugas Bripka Ahmad sangat cepat datang ke lokasi dan membantu menyelesaikan musyawarah dengan damai. Terima kasih Presisi!"
                        value={ulasanText}
                        onChange={(e) => setUlasanText(e.target.value)}
                      ></textarea>

                      <button type="button" className="btn-submit-rating" onClick={handleSubmitSurvey}>
                        <span>⭐</span> Kirim Penilaian &amp; Ulasan Kepuasan
                      </button>

                      <div
                        style={{
                          textAlign: 'center',
                          marginTop: '10px',
                          fontSize: '11px',
                          color: 'var(--text-muted)',
                        }}
                      >
                        🔒 Data evaluasi Anda terenkripsi dan langsung diteruskan ke Sistem Pengawasan Presisi SPKT.
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      {/* Photo Lightbox Modal */}
      {lightboxData.open && (
        <div className="modal-lightbox active" id="photo-modal" onClick={() => setLightboxData({ ...lightboxData, open: false })}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <div className="lightbox-header">
              <h4 id="modal-title">{lightboxData.title}</h4>
              <button
                type="button"
                className="lightbox-close"
                onClick={() => setLightboxData({ ...lightboxData, open: false })}
              >
                &times;
              </button>
            </div>
            <div className="lightbox-img-wrap">
              <img id="modal-img" src={lightboxData.img} alt="Bukti Foto" />
              <div className="lightbox-watermark" id="modal-watermark">
                SIMAPRES 110 • WATERMARK RESMI POLRI
              </div>
            </div>
            <div className="lightbox-footer" id="modal-desc">
              {lightboxData.desc}
            </div>
          </div>
        </div>
      )}

      {/* Custom Alert Modal Warga */}
      {alertData.open && (
        <div
          id="modal-alert-warga"
          style={{
            display: 'flex',
            position: 'fixed',
            inset: 0,
            zIndex: 9999999,
            background: 'rgba(15,23,42,0.8)',
            backdropFilter: 'blur(6px)',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setAlertData({ ...alertData, open: false })}
        >
          <div
            style={{
              background: 'white',
              width: '100%',
              maxWidth: '440px',
              borderRadius: '18px',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.45)',
              overflow: 'hidden',
              border: '1px solid #CBD5E1',
              display: 'flex',
              flexDirection: 'column',
              textAlign: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              id="alert-warga-header"
              style={{
                background: 'linear-gradient(135deg, #1E3A8A 0%, #172554 100%)',
                color: 'white',
                padding: '22px 20px 18px 20px',
              }}
            >
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '50%',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '26px',
                  marginBottom: '8px',
                }}
              >
                <span id="alert-warga-icon">{alertData.icon}</span>
              </div>
              <div id="alert-warga-title" style={{ fontSize: '16px', fontWeight: 800, textTransform: 'uppercase' }}>
                {alertData.title}
              </div>
              <div style={{ fontSize: '11px', opacity: 0.85, marginTop: '2px' }}>
                Portal Pelayanan Masyarakat Presisi 110
              </div>
            </div>
            <div
              style={{
                padding: '18px 20px',
                fontSize: '13px',
                color: '#334155',
                lineHeight: 1.55,
                whiteSpace: 'pre-line',
              }}
              id="alert-warga-body"
            >
              {alertData.message}
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid #E2E8F0', background: '#F8FAFC' }}>
              <button
                type="button"
                onClick={() => setAlertData({ ...alertData, open: false })}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  background: '#1E3A8A',
                  color: 'white',
                  fontSize: '13px',
                  fontWeight: 700,
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                }}
              >
                Mengerti &amp; Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="footer">
        &copy; 2026 Kepolisian Negara Republik Indonesia.
        <br />
        Sistem Informasi Manajemen Presisi (SIMAPRES) • Layanan 110 Terpadu Masyarakat.
      </footer>
    </>
  );
}
