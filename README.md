<div align="center">

  <img src="public/logo_simopmas.png" alt="Logo Resmi SIMOPMAS 110" width="140" />

  # 🛡️ SIMOPMAS 110 (SIMAPRES)
  ### **Sistem Terpadu Monitoring Polisi Bersama Masyarakat**
  *Next-Generation Police Command & Control, Computer-Aided Dispatch (CAD 110), and Citizen Live Radar Tracking Platform*

  [![Next.js](https://img.shields.io/badge/Next.js-15.5.28-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
  [![React](https://img.shields.io/badge/React-18.3.1-blue?style=for-the-badge&logo=react)](https://react.dev/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.7.2-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.16-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
  [![Prisma ORM](https://img.shields.io/badge/Prisma-5.22.0-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
  [![Vitest](https://img.shields.io/badge/Vitest-185_Tests_Passed-success?style=for-the-badge&logo=vitest)](https://vitest.dev/)
  [![PWA](https://img.shields.io/badge/PWA-Mobile_Tactical-E34F26?style=for-the-badge&logo=pwa)](https://web.dev/progressive-web-apps/)

  ---

  <p align="center">
    <strong>"Hadir Cepat, Melayani Tulus, Masyarakat Tenang"</strong><br/>
    <em>Presisi Pelayanan Masyarakat Siaga 24 Jam Nonstop</em>
  </p>

  <br/>

  <!-- Master Futuristic Showcase Graphic -->
  <img src="screenshots/simopmas-showcase.png" alt="SIMOPMAS 110 Futuristic Command Center & Unified Tactical Ecosystem" width="100%" style="border-radius: 14px; box-shadow: 0 16px 50px rgba(0,0,0,0.6);" />

</div>

---

## 📌 Ringkasan Eksekutif

**SIMOPMAS 110 (Sistem Monitoring Polisi Bersama Masyarakat)** adalah platform taktis komando kepolisian modern yang dirancang untuk mewujudkan integrasi utuh antara masyarakat pelapor, operator Sentra Pelayanan Kepolisian Terpadu (SPKT), Perwira Pengawas (Pawas), personel patroli lapangan, hingga bagian logistik dan pimpinan kewilayahan (Polres & Polsek jajaran).

Dibangun dengan arsitektur berstandar **Clean Architecture (Domain-Driven Design)**, sistem ini mentransformasi paradigma pelaporan konvensional menjadi ekosistem digital cerdas dengan:
- ⚡ **Target Respon Cepat < 10 Menit:** Algoritma dispatching otomatis berbasis kedekatan armada terhadap lokasi kejadian perkara (TKP).
- 📍 **Live Radar GPS & Telemetri Armada:** Pelacakan posisi dinamis unit patroli Samapta R-4, Perintis Presisi R-2, dan Lantas R-4 secara real-time.
- 🚨 **Disposisi Lintas Wilayah Antar-Mako:** Koordinasi taktis instan antar-Polres dan Polsek jajaran saat terjadi insiden di perbatasan.
- ⛽ **Audit Otomatis BBM Haversine (Anti-Fraud):** Validasi akuntansi konsumsi bahan bakar armada dinas berbasis jarak tempuh GPS riil dan penerbitan SPJ otomatis.
- 📱 **PWA Mobile Personel & Portal Warga SOS:** Akses lapangan cepat terikat ID perangkat fisik (*device binding*) serta tombol darurat SOS satu sentuhan bagi publik.

---

## 🚀 Fitur Unggulan Ekosistem SIMOPMAS 110

### 1. 👮‍♂️ Cockpit Komando Pawas & SLA Monitoring
Pusat kendali eksekutif Perwira Pengawas SPKT untuk memantau ritme penanganan aduan dan kesiagaan personel:
- **Radar SLA Real-Time:** Menghitung waktu tanggap petugas sejak tiket diterima hingga personel tiba di TKP (target batas < 10 menit).
- **Telemetri Kesiagaan Armada:** Status tergelar unit patroli (Samapta, Perintis Presisi, Lantas) dengan indikator zona titik rawan (*Hotspot 3C*).
- **Indeks Kepuasan Masyarakat (IKM):** Rating dan testimoni publik atas kualitas pelayanan petugas lapangan yang terverifikasi.
- **Alarm Sirine & Eskalasi Otomatis:** Peringatan audio dan visual bilamana terdapat aduan gawat darurat yang belum terdisposisi melewati ambang batas 5 menit.

---

### 2. 🎧 Konsol Operator CAD 110 (Computer-Aided Dispatch)
Antarmuka sentra kendali operator SPKT untuk mengelola panggilan darurat 110:
- **Penerimaan Terpadu & Validasi:** Perekaman identitas pelapor, verifikasi nomor kontak, dan kategorisasi taksonomi kasus kejahatan/kedaruratan.
- **Auto-Geocoding & Rekomendasi Unit Terdekat:** Menghitung jarak lurus dan rute armada terhadap TKP untuk penugasan paling efisien.
- **Antrean Menunggu Disposisi:** Visibilitas real-time penanganan tiket lintas operator dengan sinkronisasi multi-layar tanpa jeda.

---

### 3. 📱 Aplikasi Lapangan Personil Patroli (PWA Taktis)
Dirancang khusus untuk smartphone personel patroli di lapangan dalam format Progressive Web App:
- **Alur Kerja Lapangan Terstandarisasi:** *Terima Perintah Giat ➜ Bergerak Menuju TKP ➜ Tiba di Lokasi ➜ Tindakan Kepolisian ➜ Berita Acara & Dokumentasi Foto*.
- **Buddy System (Rekan Regu):** Mekanisme wajib penyandingan mitra tugas untuk menjamin keselamatan anggota saat bertugas di zona rawan.
- **Giat Mandiri Presisi:** Pelaporan kegiatan rutin (*Blue Light Patrol*, Patroli Dialogis Sambang Warga, dan Pengamanan Jalur Rawan).
- **Device Fingerprint Binding:** Pengikatan akun dinas ke hardware perangkat guna mencegah manipulasi koordinat presensi.

---

### 4. 🌐 Portal Publik Warga & Panggilan Darurat SOS
Akses mudah bagi masyarakat tanpa kewajiban login yang rumit:
- **Tombol SOS Cepat:** Pengiriman sinyal bahaya seketika yang langsung membunyikan sirine di Command Center beserta titik koordinat GPS akurat.
- **Pengaduan Gangguan Kamtibmas:** Pelaporan peristiwa dengan dukungan unggah foto bukti dan penentuan titik TKP interaktif.
- **Citizen Live Radar Tracking:** Pelacakan status laporan secara mandiri menggunakan **Token Unik 16 Karakter** untuk menjaga kerahasiaan identitas korban.

---

### 5. ⛽ Biro Logistik & Audit BBM Haversine (Anti-Fraud)
Modul akuntansi dan pertanggungjawaban operasional dinas:
- **Kalkulasi Mileage Otomatis:** Perhitungan jarak tempuh aktual kendaraan dinas menggunakan formula matematis *Haversine* berdasarkan titik awal mako ke TKP.
- **Verifikasi Rasio Konsumsi BBM:** Pencocokan otomatis kebutuhan liter bahan bakar terhadap standar indeks DIPA Kepolisian.
- **Pencegahan Klaim Ganda (Anti-Fraud):** Validasi integritas berbasis tiket laporan 110 resmi untuk menerbitkan berkas pertanggungjawaban (SPJ) siap cetak.

---

### 6. ⚙️ Master Hub & Tata Kelola Ekosistem Superadmin
Pusat manajemen hak akses, hierarki kesatuan, dan data referensi taktis:
- **Struktur Kesatuan Hierarkis:** Manajemen komando Polres hingga Polsek jajaran dan sub-unit operasional.
- **Katalog Personel & Satuan:** Manajemen data kepegawaian (NRP, pangkat, nomor ponsel dinas, dan status akun).
- **Pemetaan Titik Rawan Kejahatan (GIS):** Pengelolaan koordinat zona pantau rawan tindak pidana Curat, Curas, dan Curanmor.

---

## 🏛️ Arsitektur Sistem (Clean Architecture)

Platform ini dibangun mengikuti kaidah **Clean Architecture** dan **Domain-Driven Design (DDD)** untuk memisahkan domain aturan hukum kepolisian dari implementasi framework teknis:

```text
src/
├── domain/                    # Aturan Bisnis Inti & Hukum Kepolisian (Pure TypeScript)
│   ├── entities/              # Entity independen (Complaint, Officer, Station, PatrolLog)
│   ├── repositories/          # Kontrak interface abstraksi data
│   └── rules/                 # Validasi SLA, aturan resolusi tiket, & batas toleransi
├── application/               # Kasus Penggunaan (Use Cases)
│   └── use-cases/             # Alur koordinasi (CAD dispatch, Auth, Field Workflow)
├── infrastructure/            # Implementasi Layanan Eksternal & Driver
│   ├── repositories/          # Implementasi Prisma ORM dengan relasi transaksional
│   ├── security/              # Device fingerprinting, Rate limiter, Token cipher
│   └── services/              # Haversine distance engine, WhatsApp gateway, Geocoding
└── presentation / app/        # UI Reaktif Taktis & Next.js App Router
    ├── actions/               # Server Actions (Type-safe RPC dengan validasi Zod)
    ├── api/                   # REST & Server-Sent Events (SSE) streaming endpoints
    └── components/            # Komponen Command Center, Pawas, Personel, & Portal Warga
```

---

## 🛠️ Tumpukan Teknologi (Tech Stack)

| Lapisan Sistem | Teknologi | Deskripsi / Implementasi |
|---|---|---|
| **Framework Aplikasi** | Next.js 15.5 (App Router) | Server-Side Rendering, Server Actions, Route Handlers |
| **Bahasa Pemrograman** | TypeScript 5.7 (Strict) | 100% Type-safe end-to-end tanpa toleransi tipe implisit `any` |
| **Antarmuka & Gaya** | Tailwind CSS 3.4 & Vanilla CSS | Tactical Dark Mode, Glassmorphism, Micro-animations responsif |
| **Database & ORM** | MySQL 8.0 & Prisma ORM 5.22 | Transaksi data atomik, integritas relasi, spatial audit trail |
| **Pemetaan & GIS** | Leaflet.js & OpenStreetMap | Rendering peta taktis real-time, marker armada bergerak, layer titik rawan |
| **Gateway Komunikasi** | Baileys WhatsApp Gateway | Broadcast notifikasi status tiket real-time langsung ke WhatsApp pelapor |
| **Otomasi Pengujian** | Vitest 5.0 & Playwright | 185 unit & integration tests, E2E browser automation suite |

---

## ⚡ Panduan Menjalankan Sistem

### Prasyarat Perangkat Lunak
- **Node.js:** Versi `20.x` atau `22.x` (LTS)
- **Database:** MySQL `8.0+` atau MariaDB `10.5+`
- **Package Manager:** `npm` (versi 10+)

### 1. Klon Repositori
```bash
git clone https://github.com/echoTech187/SIMAPRES.git
cd SIMAPRES
```

### 2. Pasang Dependensi
```bash
npm install
```

### 3. Konfigurasi Lingkungan (`.env`)
Buat file `.env` pada direktori root:
```env
DATABASE_URL="mysql://root:password@localhost:3306/simopmas110"
NEXTAUTH_SECRET="your-tactical-secret-key-32-chars-min"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Migrasi Skema Database & Data Awal
```bash
# Sinkronisasi skema Prisma
npm run prisma:generate
npm run prisma:migrate

# Jalankan Seeder data resmi kesatuan & akun dinas
npm run prisma:seed
```

### 5. Jalankan Server Pengembangan
```bash
npm run dev
```
Akses platform melalui peramban: **[http://localhost:3000](http://localhost:3000)**

---

## 🧪 Jaminan Kualitas & Pengujian Otomatis

Seluruh logika bisnis, kalkulasi formula Haversine, validasi izin RBAC perwira, serta mekanisme penutupan tiket telah diuji secara komprehensif:

```bash
npm run test
```

```text
✓ src/domain/entities/__tests__/complaint-entity.test.ts (7 tests)
✓ src/infrastructure/services/__tests__/haversine-and-fuel.test.ts (5 tests)
✓ src/application/use-cases/auth/__tests__/login-and-token-security.test.ts (12 tests)
✓ src/application/use-cases/cad/__tests__/calculate-cad-dispatch.test.ts (5 tests)
✓ src/app/actions/__tests__/security-rbac.actions.test.ts (11 tests)
...
Test Files  36 passed (36)
     Tests  185 passed (185) (100% PASS)
```

---

## 👥 Hak Cipta & Kerahasiaan

- **Institusi Penyelenggara:** Kepolisian Negara Republik Indonesia (Polri)
- **Status:** Sistem Operasional Terpadu Layanan 110
- **Lisensi:** *Proprietary — Hak Cipta Dilindungi Undang-Undang Republik Indonesia.*

---

<div align="center">
  <sub>SIMOPMAS 110 • Presisi, Responsif, Humanis, dan Akuntabel demi Keamanan Masyarakat.</sub>
</div>
