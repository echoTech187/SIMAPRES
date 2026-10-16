# SIMAPRES 110 (Sistem Informasi Monitoring & Akuntabilitas Pengaduan Presisi 110)

Sistem Informasi Monitoring Pengaduan Terpadu dan Akuntabilitas Kinerja Lapangan Polri, dikembangkan khusus berdasarkan hasil analisis kebutuhan operasional Kepolisian Resor (Polres), layanan Call Center 110, dan komando operasi taktis kewilayahan.

---

## 🎯 Ringkasan Masalah Lapangan & Solusi Sistem

| Masalah Operasional Lapangan | Dampak / Risiko Kedinasan | Solusi Terintegrasi SIMAPRES 110 |
| :--- | :--- | :--- |
| **1. Laporan 110 Tertahan di Meja ("Kasus Mandek")** | Laporan telepon 110 masuk, dicatat di kertas, lalu tertahan di meja tanpa kejelasan siapa yang mendisposisi dan merespon. Pimpinan tidak tahu status riil. | **Executive Command Center & SLA Alarm**: Indikator counter live, alarm otomatis jika laporan tidak tertangani dalam SLA 10 menit, serta *Smart CAD Proximity Dispatch* ke armada terdekat. |
| **2. Ketidakpastian & Privasi Masyarakat Pelapor** | Warga khawatir data laporan diumbar ke publik atau merasa diabaikan tanpa kejelasan tindak lanjut. | **Portal Publik & Privasi UU PDP**: Pemisahan tegas *Mode Tamu* (data kasus disembunyikan total) vs *Login No. HP & OTP WhatsApp* (hanya menampilkan tiket pribadi pelapor). Dilengkapi *Auto-Login* instan saat warga melapor dan *Peta TKP Presisi*. |
| **3. Keraguan Integritas Personel ("Laporan Fiktif Dekat Mako")** | Personil mengklaim sudah berada di TKP, namun kenyataannya masih berada di dekat markas komando atau warung kopi. | **Audit Geolokasi Ganda Terpusat Pimpinan**: Perbandingan otomatis antara alamat klaim dengan koordinat GPS riil perangkat saat unggah foto. Deviasi > 500m memicu `🚨 MISMATCH_ALERT` untuk disidak dan ditindak langsung oleh Kapolres Metro. |
| **4. Pelacakan Armada Real-Time & Efisiensi Respon** | Sulit mengetahui posisi pasti mobil patroli saat terjadi insiden darurat, menyebabkan waktu respon lambat. | **Live Automatic Vehicle Location (AVL) & Smart Dispatch**: Telemetri live armada patroli (Samapta, Perintis Presisi, Patwal Satlantas) lengkap dengan kecepatan (km/jam), status operasional, alamat manusia, dan rekomendasi unit terdekat ke TKP. |
| **5. Keamanan Perangkat Lapangan & Resiko Fake GPS** | Kekhawatiran aplikasi disusupi aplikasi pemalsu lokasi (*Mock Location / Fake GPS*) atau akun disalahgunakan pihak luar. | **Hardware Device Binding & PKI (Seksi TIK)**: Penguncian aplikasi ke satu smartphone kedinasan berbasis Android Keystore StrongBox TEE / Secure Element, sertifikat mTLS, deteksi anti-mock GPS, serta QR code enrollment token 6-digit. |
| **6. Penataan Rute Patroli & Titik Rawan Kriminalitas** | Rute patroli tidak terstruktur dan penentuan titik koordinat pos pantau sering kurang presisi jika hanya mengandalkan teks alamat. | **Manajemen Rute & Satelit Pos Pantau (Kabag Ops)**: Pemilih titik satelit resolusi tinggi (ESRI World Imagery) dengan preview radius geofence (50m), pengaturan urutan pos (▲/▼), durasi singgah (*dwell time*), dan rute transit bus-style. |

---

## 👥 Struktur Peran Pengguna (RBAC 7 Peran Inti Kedinasan)

Sistem SIMAPRES 110 mengadopsi struktur komando terpadu dan efisien (*streamlined command chain*) yang terdiri dari **7 peran inti**:

1. **🏢 Kapolres Metro (Pimpinan Eksekutif & Komando Tertinggi)**:
   - Command Center eksekutif pemantauan komprehensif wilayah hukum.
   - Peta taktis terpadu dengan sebaran armada patroli aktif dan titik rawan kriminalitas aktif.
   - Evaluasi SLA respon darurat 110 dan tren kamtibmas harian/mingguan.
   - **Audit Integritas GPS Terpusat**: Memeriksa deviasi e-Logbook personel langsung dengan opsi *Setujui & Sahkan*, *Minta Klarifikasi*, atau *Tolak Logbook (Teguran Disiplin)*.
2. **🎯 Kabag Ops (Pengendali Operasi & Taktis Wilayah)**:
   - Smart CAD Proximity Dispatcher (rekomendasi armada terdekat ke TKP dan 1-Click Dispatch).
   - Pengaturan master rute patroli taktis (*bus-style transit mapping* & simulasi pergerakan armada).
   - **Pemilih Titik Satelit Pos Pantau**: Penentuan koordinat pos pantau wajib menggunakan citra satelit resolusi tinggi ESRI dengan preview radius lingkaran geofence.
   - Pengaturan master titik rawan kriminalitas (*Crime Hotspots Manager*) dan penerbitan Surat Perintah Operasi (Sprint Renops).
3. **📞 Operator SPKT / Call Center 110**:
   - Penerimaan panggilan darurat masyarakat 24/7 dan triage insiden.
   - Pembuatan nomor laporan polisi resmi (`LP-110-YYYYMM-XXXX`) dan verifikasi awal.
   - Pengunggahan berkas bukti awal masyarakat (Foto, Dokumen Berkas, Video CCTV).
4. **🚨 Personel Lapangan (Bripka Ahmad - Tim Samapta)**:
   - Aplikasi mobile kedinasan (PWA) untuk respon cepat panggilan 110.
   - e-Logbook dinas 4 aksi cepat: **PATROLI**, **TP-TKP**, **SAMBANG**, **PENGAMANAN** dengan kamera geotagged otomatis.
   - Bukti kesiapan armada sebelum bergerak menuju TKP.
   - **Diskresi Kepolisian (Hot Pursuit)**: Sakelar taktis pengejaran pelaku tertangkap tangan (Pasal 18 UU No. 2/2002) yang membebaskan deviasi rute secara sah.
5. **👥 Web Portal Layanan Warga (Masyarakat 110)**:
   - **Pemisahan Mode Tamu vs Login No. HP**:
     * *Mode Tamu (Guest)*: Tidak ada kasus yang ditampilkan demi perlindungan data pribadi (UU PDP). Kolom Nama & Nomor WhatsApp wajib diisi saat melapor.
     * *Login No. HP & OTP WhatsApp*: Nama dan No. HP terisi otomatis dan dikunci (`readOnly`), warga tidak perlu mengetik ulang identitas.
     * *Auto-Login*: Warga yang melapor dalam Mode Tamu otomatis dibuatkan sesi login terverifikasi setelah laporan terkirim.
   - **Peta Interaktif Titik TKP Presisi**: Warga dapat menggeser pin merah 📍 pada peta atau menggunakan tombol `🎯 GPS Saya` agar koordinat lokasi kejadian terkunci akurat (akurasi ±5m).
6. **💻 Super Admin Seksi TIK (Infrastruktur & Keamanan Siber)**:
   - Pendaftaran dan otorisasi akun personel kedinasan.
   - Manajemen *Hardware Device Binding*, audit Keystore StrongBox TEE, dan sertifikat mTLS.
   - Pemutusan darurat (*Remote Revoke*) dan pembuatan token pairing QR gawai baru.
   - Terminal Uji Konektivitas Gateway: WhatsApp Business API (Fonnte), SMS OTP Telkomsel, CDN Tile Server GIS, dan Telemetri Broker MQTT (Port 8883).
   - Pencadangan basis data berkala (*Database Backup & Encrypted Snapshot*).
7. **🛡️ Gateway SSO Presisi 110 (Pintu Masuk Terpadu)**:
   - Pemisahan akses aman antara jalur publik masyarakat dan jalur privat internal kepolisian (mTLS & SSO).

> **Catatan Penataan Peran:** Fitur dan peran *Kanit / Pawas*, *Seksi Propam*, dan *Kapolsek* telah disederhanakan dan dialihkan secara terpusat ke Command Center Kapolres Metro guna memangkas birokrasi verifikasi logbook dan menjamin rantai komando satu pintu (*one-stop command*).

---

## 🗺️ Fitur Unggulan Peta Taktis & Geolokasi

- **Zero Raw Coordinates**: Seluruh titik insiden, posisi armada, dan checkpoint ditampilkan menggunakan nama jalan dan patokan landmark manusia (misal: *"Jl. Veteran No. 12 (Depan Bank BCA)"*), bukan angka desimal koordinat mentah yang membingungkan.
- **Peta Bersih & Fokus Operasi**: Insiden yang telah berstatus `SELESAI` disembunyikan secara default agar peta tetap bersih dan fokus pada situasi genting, disertai tombol toggle `[👁️ Riwayat Selesai: OFF/ON]`.
- **Tooltip HUD Non-Intrusif**: Informasi unit dan insiden muncul saat diarahkan kursor (*hover*) atau diklik, tanpa menutupi ikon personel atau armada di peta.
- **Citra Satelit Resolusi Tinggi (ESRI World Imagery)**: Tersedia pada penentuan pos pantau Kabag Ops dan pelaporan warga untuk akurasi visual maksimal.

---

## ⚡ Fitur Simulasi Cepat (One-Click Autofill)

Untuk mempercepat presentasi dan evaluasi prototipe tanpa perlu mengetik formulir secara manual, tombol **`✨ Isi Data Simulasi`** telah disematkan pada seluruh formulir modal:
1. Formulir Tambah/Edit Pos Pantau (Kabag Ops) &mdash; otomatis mengunci koordinat satelit Bundaran Obvit.
2. Formulir Plotting Penugasan Armada (Kabag Ops).
3. Formulir Penerbitan Sprint Renops (Kabag Ops).
4. Formulir Tambah Titik Rawan Kriminalitas / Hotspot (Kabag Ops).
5. Formulir Penerimaan Laporan Panggilan 110 (Operator SPKT).
6. Formulir Pengaduan Mandiri Warga (Portal Publik).
7. Formulir Input e-Logbook Personel Lapangan (Opsi GPS Valid & Opsi Anomali GPS Deviasi > 4 km).
8. Formulir Pendaftaran Akun Personel Baru (Seksi TIK).

---

## 🚀 Panduan Menjalankan & Menguji Prototype

1. Buka file `simapres_110_prototype.html` atau `index.html` langsung di browser web modern (Google Chrome, Mozilla Firefox, Microsoft Edge, Safari).
2. Gunakan **Role Selector Bar** di bagian atas untuk berpindah antar 7 peran kedinasan.
3. Fitur pengujian cepat:
   - **⚡ Laporan 110 Baru**: Menghasilkan panggilan darurat baru secara acak untuk menguji alur dispatch.
   - **🔄 Reset Data**: Mengembalikan seluruh data simulasi ke kondisi awal.
   - **📖 Panduan Operasional**: Membuka modal panduan SOP, tujuan modul, fitur, dan tips jawaban pertahanan klien di setiap halaman.

---

## 📦 Struktur Berkas Master Package

- `index.html`, `style.css`, `app.js`: Sumber kode prototype web interaktif.
- `simapres_110_prototype.html`: Versi mandiri (*single-file bundle*) tanpa dependensi eksternal.
- `schema.sql`: Skema database terstandar MySQL 8.0+ / MariaDB / PostGIS dengan fungsi spasial Haversine.
- `arsitektur_microservices.md`: Dokumen arsitektur teknis microservices, message broker, dan caching Redis Geo.
- `REKAPAN_LENGKAP_WORKFLOW_DAN_ARSITEKTUR_SIMAPRES_110.md` (.docx & .pdf): Rekapan komprehensif kajian operasional, RBAC 7 peran, dan skema sistem.
- `PANDUAN_SETUP_DAN_DEPLOYMENT_SIMAPRES_110.md` (.docx & .pdf): Panduan teknis instalasi server Ubuntu, Docker Compose, Nginx SSL, dan hardening keamanan.
- `PANDUAN_PENGUJIAN_END_TO_END_DAN_UAT_SIMAPRES_110.md` (.docx & .pdf): Panduan pengujian end-to-end (UAT) komprehensif dari awal hingga akhir untuk 7 peran kedinasan.
