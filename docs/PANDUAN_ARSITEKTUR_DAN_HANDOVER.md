# PANDUAN ARSITEKTUR & DEVELOPER HANDOVER
## Sistem Manajemen & Operasional Presisi (SIMAPRES 110)

Dokumen ini ditujukan bagi seluruh pengembang (*software engineers*), *lead developers*, maupun tim penerus proyek SIMAPRES 110. Tujuannya adalah memastikan sistem tetap **mudah dirawat (*maintainable*)**, **bebas dari regresi (*regression-proof*)**, dan mematuhi prinsip **Single Source of Truth (SSOT)**.

---

### I. Prinsip Utama: Pemisahan Presentasi vs Kontrak Logika

Dalam SIMAPRES 110, seluruh data status dan operasional dikelola menggunakan model **2 Lapis (Two-Layer Management)**:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   DATABASE MySQL / TiDB (Master Tables)                │
│ ┌──────────────────────┬────────────────────────┬────────────────────┐ │
│ │ Kolom `key`          │ Kolom `label`          │ Kolom visual       │ │
│ │ (DISPATCHED, dll)    │ ("Disposisi", dll)     │ (badge_color, dll) │ │
│ └──────────┬───────────┴───────────┬────────────┴─────────┬──────────┘ │
└────────────┼───────────────────────┼──────────────────────┼────────────┘
             │                       │                      │
    [COMPILE-TIME KONTRAK]           │                      │
             │                       ▼                      ▼
             ▼            ┌──────────────────────────────────────────────┐
┌─────────────────────────┤            RUNTIME / USER INTERFACE          │
│ TypeScript Types (.ts)  │       (Komponen React / Konsol Petugas)      │
│  - DispatchStepAction   │                                              │
│  - DispatchStepKey      │  - Menampilkan teks tombol dari `item.label` │
│ Backend Use Cases       │  - Menampilkan badge dari `item.badge_color` │
│  - switch-case logika   │  - 100% DINAMIS TANPA HARDCODE               │
│  - Validasi GPS radius  └──────────────────────────────────────────────┘
└─────────────────────────┘
```

#### 1. Layer Presentasi (Database Runtime)
* **Sumber Data**: Tabel-tabel `master_*` di database (misal: `master_dispatch_statuses`, `master_complaint_statuses`, `master_duty_statuses`).
* **Kolom**: `label`, `badge_color`, `badge_bg`, `badge_border`, `display_order`, `is_active`.
* **Karakteristik**:
  - Digunakan murni untuk apa yang **dilihat oleh pengguna** (teks tombol, warna status, urutan filter).
  - Jika klien/instansi kepolisian ingin mengubah kata (misal: dari *"Meluncur"* menjadi *"Menuju TKP"*) atau mengganti warna badge, **TIDAK PERLU MENGUBAH KODE SAMA SEKALI**.
  - Cukup lakukan `UPDATE` pada tabel master di database (atau lewat Superadmin Console), dan tampilan UI akan langsung berubah seketika.

#### 2. Layer Kontrak Bisnis (TypeScript & Backend State Machine)
* **Sumber Data**: Kolom `key` pada tabel master (misal: `'DISPATCHED'`, `'DEPARTED'`, `'ARRIVED'`, `'REPORT_SUBMITTED'`, `'COMPLETED'`).
* **Implementasi di Kode**:
  - `src/components/console/personil/types.ts` (`DispatchStepAction`)
  - `src/application/use-cases/complaints/field-step-action.use-case.ts` (`DispatchStepKey`)
  - `src/app/actions/complaint.actions.ts` (`fieldStepAction`)
* **Karakteristik**:
  - Digunakan sebagai *State Machine* (aturan alur kerja kepolisian: kapan personil berangkat, kapan validasi GPS 50 meter aktif, dan kapan tiket dianggap tuntas).
  - Bertindak sebagai **Early Warning System (Jaring Pengaman)**. TypeScript akan mencegah kesalahan ketik (*typo*) saat koding dan memandu developer secara otomatis jika ada tahapan baru.

---

### II. Panduan Praktis untuk Developer Penerus

#### Skenario 1: Hanya Mengubah Teks Label, Urutan, atau Warna Tampilan
> **Contoh Kasus**: Supervisi meminta tombol status diganti dari "Meluncur" menjadi "Bergerak ke TKP", dan warnanya diubah menjadi biru muda.

1. **JANGAN ubah file TypeScript/JSX**.
2. Buka database (atau Superadmin Master Menu), lalu jalankan perintah:
   ```sql
   UPDATE master_dispatch_statuses 
   SET label = 'Bergerak ke TKP', badge_color = '#3B82F6', badge_bg = '#EFF6FF'
   WHERE `key` = 'DEPARTED';
   ```
3. Selesai. Seluruh tampilan di konsol personil, peta taktis, dan riwayat pengaduan otomatis menyesuaikan.

---

#### Skenario 2: Menambahkan Tahapan SOP Baru (Perubahan Alur Bisnis)
> **Contoh Kasus**: Mabes Polri menambahkan SOP baru bernama "INVESTIGASI_AWAL" di antara "Tiba di TKP" dan "Selesai".

Ikuti checklist 4 langkah berikut:

* [ ] **Langkah 1: Tambahkan data di tabel database**
  ```sql
  INSERT INTO master_dispatch_statuses (`key`, label, badge_color, badge_bg, display_order, is_active)
  VALUES ('INVESTIGASI_AWAL', 'Investigasi TKP', '#F59E0B', '#FFFBEB', 4, true);
  ```

* [ ] **Langkah 2: Daftarkan key baru pada union type di `src/components/console/personil/types.ts`**
  ```typescript
  export type DispatchStepAction =
    | 'DISPATCHED'
    | 'DEPARTED'
    | 'ARRIVED'
    | 'INVESTIGASI_AWAL' // <-- Tambahkan di sini
    | 'REPORT_SUBMITTED'
    | 'COMPLETED';
  ```

* [ ] **Langkah 3: Jalankan compiler TypeScript untuk melihat tempat yang wajib dilengkapi**
  ```bash
  npx tsc --noEmit
  ```
  Compiler akan otomatis menunjukkan baris-baris switch-case di use case backend yang belum menangani key baru ini.

* [ ] **Langkah 4: Tambahkan aturan bisnis di `src/application/use-cases/complaints/field-step-action.use-case.ts`**
  ```typescript
  switch (input.step) {
    ...
    case 'INVESTIGASI_AWAL':
      // Tulis logika bisnis spesifik (misal: mencatat timestamp mulai investigasi)
      break;
    ...
  }
  ```

---

### III. Inventarisasi Tabel Master Utama di SIMAPRES 110

| Nama Tabel di Database | Model Prisma | Kegunaan dalam Aplikasi |
| :--- | :--- | :--- |
| `master_dispatch_statuses` | `MasterDispatchStatus` | Tahapan pergerakan personil lapangan (Disposisi, Meluncur, Tiba, Laporan, Selesai). |
| `master_complaint_statuses` | `MasterComplaintStatus` | Lifecycle tiket pengaduan (MENUNGGU, DIPROSES, MENUNGGU_PENGESAHAN, SELESAI, DITOLAK). |
| `master_operational_units` | `MasterOperationalUnit` | 5 Satuan Fungsi (Reskrim, Intelkam, Lantas, Binmas, Samapta). |
| `master_duty_statuses` | `MasterDutyStatus` | Status dinas personil (DINAS_PATROLI, PIKET_SPKT, CADANGAN, LEPAS_DINAS, dll). |
| `master_incident_categories` | `MasterIncidentCategory` | Kategori kejahatan/kejadian (Kriminalitas, Lakalantas, dll). |
| `master_incident_subcategories` | `MasterIncidentSubcategory`| Rincian kasus spesifik per satuan (Tawuran, Begal, Curanmor, dll). |
| `master_report_sources` | `MasterReportSource` | Saluran laporan masuk (Call 110, WA Presisi, Aplikasi Mobile, Walk-In SPKT). |
| `master_urgency_levels` | `MasterUrgencyLevel` | Tingkat kegawatan (DARURAT, SEDANG, NORMAL). |
| `master_resolution_locations` | `MasterResolutionLocation`| Lokasi penyelesaian perkara lapangan (TKP, Komando Polsek, Kantor Desa, dll). |
| `master_resolution_documents` | `MasterResolutionDocument`| Dokumen pengesahan penyelesaian (BAP Kilat, Surat Perdamaian/Restorative Justice, dll). |

---

### IV. Standar Kode & Utilitas Khusus yang Harus Dipatuhi

1. **Format Nomor Telepon Pelapor**:
   - Seluruh nomor HP pelapor atau personil **wajib** diformat menggunakan utilitas resmi `src/lib/format-phone.ts`:
     - Tampilan visual: `formatPhoneNumber(phone)` ➔ menghasilkan format standar Indonesia `0812-3456-7890`.
     - Tautan panggilan: `getCleanCallNumber(phone)` ➔ menghasilkan string numerik bersih untuk `<a href="tel:081234567890">`.

2. **Deteksi Perangkat Fisik (Hardware Pairing)**:
   - Tombol tanggap darurat dan eksekusi tugas di konsol personil hanya aktif jika perangkat fisik sudah dipasangkan (*paired*) melalui QR Scan (`localStorage.getItem('simapres_hardware_device_id') === officer.deviceId`).

3. **Geofencing TKP (Radius < 50 Meter)**:
   - Personil tidak dapat mengonfirmasi status "Tiba di TKP" jika jarak GPS personil dengan TKP pengaduan melebihi 50 meter.
   - Untuk keperluan uji coba developer (*testing/staging*), gunakan tombol **"Simulasi Radius Dev"** yang tersedia di antarmuka konsol personil.

---

### V. Standar Format Kolom `action` pada Tabel `complaint_audit_logs`

Seluruh baris pada tabel `complaint_audit_logs` **WAJIB** menggunakan format **`UPPERCASE_SNAKE_CASE`** pada kolom `action`. Teks deskriptif atau narasi bahasa Indonesia diletakkan di kolom `notes`:

| Kode `action` Baku | Keterangan Kejadian | Tempat Catatan / Narasi |
| :--- | :--- | :--- |
| `LAPORAN_MASUK` | Tiket baru masuk dari pelapor (Call 110, WA, Web, Walk-In) | `notes`: Ringkasan laporan awal |
| `BROADCAST_DISPATCH` | Pawas menerbitkan siaran serentak ke seluruh armada siaga | `notes`: Detail siaran serentak |
| `DISPATCH_ISSUED` | Pawas menerbitkan perintah disposisi ke satuan operasional | `notes`: Kuota & arahan taktis satuan |
| `DISPATCH_ACCEPTED` | Personel mengonfirmasi dan menerima tugas | `notes`: Nama & NRP personel penerima |
| `OFFICER_DEPARTED` | Personel bergerak meluncur menuju titik TKP | `notes`: Catatan pergerakan personel |
| `OFFICER_ARRIVED` | Personel tiba di lokasi kejadian (TKP) | `notes`: Catatan ketibaan / situasi awal |
| `REPORT_SUBMITTED` | Personel menyelesaikan tindakan / BAP kilat lapangan | `notes`: Berita acara penanganan TKP |
| `COMPLAINT_COMPLETED` | Pawas memvalidasi & mengesahkan penyelesaian perkara | `notes`: Catatan pengesahan perwira |
| `COMPLAINT_REJECTED` | Laporan ditolak oleh Pawas | `notes`: Alasan penolakan laporan |
| `WHATSAPP_NOTIFICATION`| Sistem gateway mengirim tautan radar tracking ke warga | `notes`: Log pengiriman pesan WhatsApp |
| `CHAT_MESSAGE` | Pesan komunikasi 2 arah pelapor dengan petugas | `notes`: JSON payload pesan chat |
| `DOKUMENTASI_TKP_FLAGGED`| Terdeteksi anomali deviasi koordinat GPS (> 50 meter) | `notes`: Pesan peringatan audit Propam |

---

### VI. Perintah Verifikasi Kesehatan Kode (*Sanity Check*)

Sebelum melakukan *commit* atau *merge* kode baru:

1. **Cek Tipe TypeScript**:
   ```bash
   npx tsc --noEmit
   ```
   *(Harus menghasilkan exit code 0 / tanpa error).*

2. **Cek Dev Server**:
   ```bash
   npm run dev
   ```

Dokumen ini menjadi standar baku pemeliharaan SIMAPRES 110 untuk memastikan kontinuitas proyek jangka panjang.
