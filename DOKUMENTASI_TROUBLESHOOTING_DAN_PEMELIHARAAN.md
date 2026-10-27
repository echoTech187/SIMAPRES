# 🛠️ PANDUAN PENANGANAN MASALAH (TROUBLESHOOTING) DAN PEMELIHARAAN SISTEM
## SISTEM MANAJEMEN OPERASIONAL PRESISI 110 (SIMAPRES 110)
### KEPOLISIAN NEGARA REPUBLIK INDONESIA – POLRES PEKALONGAN

Dokumen ini merupakan petunjuk teknis resmi bagi Administrator Sistem, Teknisi IT Kominfo Polri, dan Operator Komando untuk mengidentifikasi, mendiagnosis, menyelesaikan kendala operasional (*troubleshooting*), serta menjalankan pemeliharaan berkala (*maintenance*) pada aplikasi **SIMAPRES 110**. Seluruh materi disusun 100% berbasiskan implementasi nyata kode sumber sistem.

---

# DAFTAR ISI

1. [Matriks Triage Cepat Masalah Sistem (Quick Triage Matrix)](#1-matriks-triage-cepat-masalah-sistem)
2. [Troubleshooting Microservice WhatsApp Gateway (Baileys)](#2-troubleshooting-microservice-whatsapp-gateway-baileys)
   - [2.1 Sesi Baileys Terputus / Logged Out (Error 401)](#21-sesi-baileys-terputus--logged-out-error-401)
   - [2.2 Terminal Penuh Spam Log `Bad MAC` atau `session_cipher`](#22-terminal-penuh-spam-log-bad-mac-atau-session_cipher)
   - [2.3 Nomor WhatsApp Gagal Menerima Pesan (Format Normalisasi)](#23-nomor-whatsapp-gagal-menerima-pesan-format-normalisasi)
   - [2.4 Port Konflik Microservice (Port 5001 Terpakai)](#24-port-konflik-microservice-port-5001-terpakai)
3. [Troubleshooting Kebijakan Audio Sirine Patwal Peramban (Browser Policy)](#3-troubleshooting-kebijakan-audio-sirine-patwal-peramban)
   - [3.1 Error `NotAllowedError: play() failed`](#31-error-notallowederror-play-failed)
   - [3.2 Mekanisme Fail-Safe Indikator Visual Darurat](#32-mekanisme-fail-safe-indikator-visual-darurat)
4. [Troubleshooting Geocoding, Google Directions & Komputasi Spasial](#4-troubleshooting-geocoding-google-directions--komputasi-spasial)
   - [4.1 API Nominatim Rate-Limit (Error 429) & Fallback Kamus Lokal](#41-api-nominatim-rate-limit-error-429--fallback-kamus-lokal)
   - [4.2 Layanan Google Directions Service Gagal (Fallback Haversine 1.25x)](#42-layanan-google-directions-service-gagal-fallback-haversine-125x)
   - [4.3 Fallback Koordinat Markas Komando (Emergency Geolocation)](#43-fallback-koordinat-markas-komando-emergency-geolocation)
5. [Troubleshooting Sesi Autentikasi, JWT & Hak Akses (RBAC)](#5-troubleshooting-sesi-autentikasi-jwt--hak-akses-rbac)
   - [5.1 Cookie Size Exceeded (Batas 4KB Peramban)](#51-cookie-size-exceeded-batas-4kb-peramban)
   - [5.2 Pengguna Terlempar ke Halaman Login (Session Expiration)](#52-pengguna-terlempar-ke-halaman-login-session-expiration)
   - [5.3 Pengalihan Paksa Sesuai Role (Route Guard Mismatch)](#53-pengalihan-paksa-sesuai-role-route-guard-mismatch)
6. [Troubleshooting Cache Memori Server & Sinkronisasi Live Data](#6-troubleshooting-cache-memori-server--sinkronisasi-live-data)
   - [7.1 Masalah Data Antrean Pawas Stale / Tidak Berkurang](#61-masalah-data-antrean-pawas-stale--tidak-berkurang)
   - [6.2 Penanganan Race Condition Loader (Single-Flight Pattern)](#62-penanganan-race-condition-loader-single-flight-pattern)
7. [Troubleshooting Basis Data Prisma & MySQL Engine](#7-troubleshooting-basis-data-prisma--mysql-engine)
   - [7.1 Error Serialisasi BigInt pada Respon Server Components](#71-error-serialisasi-bigint-pada-respon-server-components)
   - [7.2 Error Foreign Key Constraint Saat Pembersihan / Migrasi Data](#72-error-foreign-key-constraint-saat-pembersihan--migrasi-data)
   - [7.3 Penanganan Deadlock Transaksi MySQL & Ukuran Connection Pool](#73-penanganan-deadlock-transaksi-mysql--ukuran-connection-pool)
8. [Prosedur Pemeliharaan Rutin & Audit Integritas Sistem (SOP Maintenance)](#8-prosedur-pemeliharaan-rutin--audit-integritas-sistem)

---

## 1. MATRIKS TRIAGE CEPAT MASALAH SISTEM (QUICK TRIAGE MATRIX)

| Gejala Masalah | Letak Modul | Kemungkinan Penyebab | Tindakan Solusi Cepat |
| :--- | :--- | :--- | :--- |
| Pesan WhatsApp tidak terkirim ke Ka SPKT tujuan | `wa-gateway.mjs` (Port 5001) | Sesi Baileys 401 logged out atau folder auth korup. | Hapus folder `wa_auth_session`, restart via `npm run wa`, lalu scan QR ulang. |
| Audio sirine patwal tidak berbunyi di konsol Mako tujuan | `EscalationAlarmBanner.tsx` | Browser Autoplay Policy memblokir suara sebelum ada klik. | Cukup klik 1 kali di sembarang layar konsol untuk meng-unlock AudioContext. |
| Pencarian alamat TKP lambat atau gagal merespons | `indonesian-location-search.ts` | API OpenStreetMap Nominatim limit (429) atau offline. | Sistem otomatis menggunakan fallback kamus wilayah lokal & GPS Mako. |
| Antrean laporan Pawas tidak berkurang pasca disposisi | `app-cache.ts` | Cache in-memory Next.js server belum terinvalidation. | Panggil `invalidatePawasUnifiedCache()` atau refresh peramban (`Ctrl + F5`). |
| Error `TypeError: Do not know how to serialize a BigInt` | Server Actions / API | Kolom ID `BigInt` dikembalikan mentah tanpa `String(id)`. | Konversi seluruh ID BigInt menggunakan helper `String(item.id)`. |
| Peta taktis komando gelap tidak menampilkan garis rute | `SimapresGoogleMap.tsx` | Kuota Google Directions API terlampaui. | Sistem otomatis fallback ke komputasi Haversine spasial x 1.25x kelokan. |

---

## 2. TROUBLESHOOTING MICROSERVICE WHATSAPP GATEWAY (BAILEYS)
Microservice WhatsApp Gateway dioperasikan melalui berkas mandiri [`wa-gateway.mjs`](file:///c:/Users/Pongo/Downloads/SIMAPRES/wa-gateway.mjs) pada port 5001 menggunakan pustaka `@whiskeysockets/baileys`.

### 2.1 Sesi Baileys Terputus / Logged Out (Error 401)
**Pesan Error pada Log Terminal:**
```
[WA-GATEWAY] Connection closed. Reason: DisconnectReason.loggedOut (statusCode: 401)
```
**Penyebab:**
Tautan perangkat pada WhatsApp ponsel dinas telah dicabut oleh pengguna, atau kredensial pada direktori `wa_auth_session` rusak/kedaluwarsa.

**Prosedur Pemulihan:**
1. Hentikan service WhatsApp gateway di terminal dengan menekan `Ctrl + C`.
2. Hapus direktori autentikasi lama secara tuntas:
   ```powershell
   Remove-Item -Recurse -Force .\wa_auth_session
   ```
3. Jalankan kembali microservice:
   ```powershell
   npm run wa
   ```
4. Buka menu **Perangkat Tertaut** pada WhatsApp ponsel dinas piket SPKT, lalu pindai QR Code yang tampil di terminal atau akses endpoint web `http://localhost:5001/status`.

---

### 2.2 Terminal Penuh Spam Log `Bad MAC` atau `session_cipher`
**Pesan Error:**
```
[WARN] Failed to decrypt message: Session error: Bad MAC
```
**Penyebab:**
Ponsel dinas menerima pesan dari grup atau nomor luar yang kunci enkripsi sinyalnya telah berubah.
**Solusi Kode Sumber:**
Pada [`wa-gateway.mjs:L39`](file:///c:/Users/Pongo/Downloads/SIMAPRES/wa-gateway.mjs#L39-L55), telah dipasang filter pembersih log:
```javascript
function shouldSilenceLog(msg) {
  return (
    msg.includes('Bad MAC') ||
    msg.includes('Failed to decrypt message') ||
    msg.includes('Session error') ||
    msg.includes('libsignal') ||
    msg.includes('session_cipher') ||
    msg.includes('Closing session')
  );
}
```
Pastikan filter ini aktif agar memori terminal tidak mengalami kebocoran (*memory leak*).

---

### 2.3 Nomor WhatsApp Gagal Menerima Pesan (Format Normalisasi)
**Penyebab:**
Nomor yang diinput operator berawalan `08`, `+62`, atau mengandung karakter spasi dan tanda hubung (`-`).
**Solusi Kode Sumber:**
Fungsi `normalizePhone` pada [`wa-gateway.mjs:L28`](file:///c:/Users/Pongo/Downloads/SIMAPRES/wa-gateway.mjs#L28-L36) secara otomatis menstandarkan nomor:
```javascript
function normalizePhone(phone) {
  let clean = String(phone || '').replace(/\D/g, '');
  if (clean.startsWith('0')) clean = '62' + clean.slice(1);
  else if (clean.startsWith('8')) clean = '62' + clean;
  return clean;
}
```
Hasil nomor selalu berformat `628xxxxxxxxxx@s.whatsapp.net`.

---

### 2.4 Port Konflik Microservice (Port 5001 Terpakai)
**Pesan Error:**
```
Error: listen EADDRINUSE: address already in use :::5001
```
**Solusi Pemulihan:**
Cari dan matikan proses yang sedang menyandera port 5001 di Windows:
```powershell
$proc = Get-NetTCPConnection -LocalPort 5001 -ErrorAction SilentlyContinue
if ($proc) { Stop-Process -Id $proc.OwningProcess -Force }
npm run wa
```

---

## 3. TROUBLESHOOTING KEBIJAKAN AUDIO SIRINE PATWAL PERAMBAN (BROWSER POLICY)
Audio sirine mobil patwal diatur dalam [`EscalationAlarmBanner.tsx`](file:///c:/Users/Pongo/Downloads/SIMAPRES/src/components/console/pawas/components/EscalationAlarmBanner.tsx).

### 3.1 Error `NotAllowedError: play() failed`
**Pesan Error di Console Browser:**
```
NotAllowedError: play() failed because the user didn't interact with the document first.
```
**Penyebab:**
Kebijakan keamanan peramban modern (Google Chrome, Edge) memblokir pemutaran audio otomatis tanpa interaksi fisik awal dari pengguna pada dokumen web.

**Langkah Penanganan Operasional:**
1. Petugas piket SPKT cukup melakukan **1 kali klik di sembarang area antarmuka konsol** setelah browser dibuka.
2. Interaksi ini akan memicu *AudioContext Resume / User Activation Unlock*, sehingga setiap sirine darurat yang masuk berikutnya dijamin berbunyi nyaring.

### 3.2 Mekanisme Fail-Safe Indikator Visual Darurat
Sebagai perlindungan jika speaker komputer mati atau audio terblokir, sistem menerapkan fail-safe visual:
- Banner oranye dan merah berkedip (*high-contrast CSS animation*).
- Judul tab peramban berkedip dinamis: `🚨 [ALARM] DISPOSISI MASUK!`.

---

## 4. TROUBLESHOOTING GEOCODING, GOOGLE DIRECTIONS & KOMPUTASI SPASIAL

### 4.1 API Nominatim Rate-Limit (Error 429) & Fallback Kamus Lokal
Jika API geocoding eksternal mengalami limit panggilan:
- Sistem secara mulus beralih ke kamus pencarian wilayah lokal pada [`src/lib/indonesian-location-search.ts`](file:///c:/Users/Pongo/Downloads/SIMAPRES/src/lib/indonesian-location-search.ts).
- Operator tetap dapat menempatkan pin lokasi secara visual di peta tanpa bergantung pada server luar.

### 4.2 Layanan Google Directions Service Gagal (Fallback Haversine 1.25x)
Jika jaringan internet memutus panggilan ke Google Directions Service:
- Sistem secara otomatis menggunakan rumus komputasi spasial Haversine dengan faktor kelokan jalan raya:
  $$\text{Jarak Estimasi} = \text{Jarak Lurus Haversine} \times 1.25 \text{ (Tortuosity Factor)}$$
- Penghitungan audit bahan bakar BBM dinas tetap dapat berjalan tanpa hambatan.

### 4.3 Fallback Koordinat Markas Komando (Emergency Geolocation)
Jika koordinat GPS pelapor kosong atau bernilai null:
- Sistem secara default menetapkan titik sentral Markas Komando pengampu (`station.office_lat`, `station.office_lng`) agar tiket aduan tetap dapat diterbitkan secara sah.

---

## 5. TROUBLESHOOTING SESI AUTENTIKASI, JWT & HAK AKSES (RBAC)

### 5.1 Cookie Size Exceeded (Batas 4KB Peramban)
**Penyebab:**
Penyimpanan informasi profil pengguna yang terlalu besar ke dalam payload JWT cookie dapat melampaui batas standar 4096 byte.
**Solusi Kode Sumber:**
Pada [`src/lib/session-token.ts`](file:///c:/Users/Pongo/Downloads/SIMAPRES/src/lib/session-token.ts), payload cookie dioptimasi minimalis: hanya menyimpan `id`, `identifier`, `role`, `stationId`, dan `satuanNama`. Data profil lengkap selalu diambil dari database melalui relasi.

### 5.2 Pengguna Terlempar ke Halaman Login (Session Expiration)
**Penyebab:**
Masa aktif token sesi JWT kedaluwarsa (default 24 jam) atau kunci rahasia `SIMAPRES_SESSION_SECRET` berubah di file `.env`.
**Langkah Penanganan:**
Lakukan login ulang melalui halaman `/login`. Pastikan file `.env` memiliki nilai rahasia yang konsisten.

### 5.3 Pengalihan Paksa Sesuai Role (Route Guard Mismatch)
Jika pengguna dengan role `PERSONIL` mencoba mengakses URL `/console/operator`, middleware akan secara otomatis mengalihkannya ke antarmuka yang sesuai dengan hak wewenangnya demi menjaga kepatuhan SOP kepolisian.

---

## 6. TROUBLESHOOTING CACHE MEMORI SERVER & SINKRONISASI LIVE DATA

### 6.1 Masalah Data Antrean Pawas Stale / Tidak Berkurang
**Penyebab:**
Cache in-memory server Next.js ([`src/lib/app-cache.ts`](file:///c:/Users/Pongo/Downloads/SIMAPRES/src/lib/app-cache.ts)) masih menyimpan snapshot data sebelum mutasi status dilakukan.
**Langkah Penanganan:**
Setiap Server Action mutasi wajib memanggil rantai invalidasi terpadu:
```typescript
cacheInvalidate(`antrean_pawas_${targetStationId}`);
cacheInvalidate(`pawas_unified_data_${targetStationId}`);
cacheInvalidate('antrean_pawas_all');
cacheInvalidate('recent_complaints_50');
```
Untuk membersihkan seluruh cache memori server secara manual, panggil fungsi `cacheClearAll()`.

### 6.2 Penanganan Race Condition Loader (Single-Flight Pattern)
Fungsi `cacheGetOrLoad()` pada [`src/lib/app-cache.ts:L54`](file:///c:/Users/Pongo/Downloads/SIMAPRES/src/lib/app-cache.ts#L54-L68) menerapkan pola *Single-Flight Promise*: jika ada 10 request bersamaan meminta data yang sama saat cache kosong, query database hanya dieksekusi 1 kali dan hasilnya dibagi ke seluruh request tersebut.

---

## 7. TROUBLESHOOTING BASIS DATA PRISMA & MYSQL ENGINE

### 7.1 Error Serialisasi BigInt pada Respon Server Components
**Pesan Error:**
```
TypeError: Do not know how to serialize a BigInt
```
**Penyebab:**
JavaScript bawaan tidak dapat mengubah tipe numerik 64-bit (`BigInt`) ke format JSON string tanpa serializer.
**Solusi Standar:**
Selalu konversikan kolom ID bertipe `BigInt` menjadi format teks sebelum dikirim ke Client Component:
```typescript
const sanitizedComplaint = {
  ...complaint,
  id: String(complaint.id),
  operator_id: complaint.operator_id ? String(complaint.operator_id) : null,
};
```

### 7.2 Error Foreign Key Constraint Saat Pembersihan / Migrasi Data
**Pesan Error:**
```
Cannot delete or update a parent row: a foreign key constraint fails
```
**Struktur Aturan Cascade Resmi:**
Pada [`prisma/schema.prisma`](file:///c:/Users/Pongo/Downloads/SIMAPRES/prisma/schema.prisma), tabel-tabel berikut telah disetel dengan `onDelete: Cascade`:
- `complaint_dispatches`
- `complaint_audit_logs`
- `complaint_chats`
- `complaint_evidences`
- `citizen_reviews`

Sementara tabel `officer_logbooks` disetel dengan `onDelete: SetNull`. Oleh karena itu, penghapusan pada tabel `Complaint` aman dilakukan dan secara otomatis membersihkan seluruh riwayat transaksi tanpa menimbulkan foreign key error.

---

## 8. PROSEDUR PEMELIHARAAN RUTIN & AUDIT INTEGRITAS SISTEM (SOP MAINTENANCE)

### 8.1 Prosedur Backup Basis Data Harian
Jalankan dump MySQL otomatis setiap pukul 03.00 WIB:
```powershell
mysqldump -u root -p simapres_110_spkt_db --single-transaction --quick > "C:\Backup_SIMAPRES\backup_simapres_$(Get-Date -Format 'yyyyMMdd_HHmm').sql"
```

### 8.2 Pembersihan Berkas Cache Bukti Foto
Foto bukti penanganan kasus disimpan pada direktori `public/uploads/`.
- Berkas kasus yang telah selesai diverifikasi Pawas dan berumur lebih dari 90 hari wajib dipindahkan ke *Cold Storage* arsip kedinasan.

### 8.3 Verifikasi Kompilasi & Integritas Build
Sebelum melakukan restart server produksi pasca pembaruan kode, pastikan pengujian statis TypeScript lolos 100%:
```powershell
npx tsc --noEmit
```
Pastikan hasil kompilasi keluar dengan status **Kode 0 (Zero Errors)**.
