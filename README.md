# SIMAPRES 110 (Sistem Informasi Monitoring & Akuntabilitas Pengaduan Presisi 110)

Sistem Informasi Monitoring Pengaduan Terpadu dan Akuntabilitas Kinerja Lapangan Polri, dikembangkan khusus berdasarkan hasil analisis kebutuhan operasional Kepolisian Resor (Polres), layanan Call Center 110, dan komando operasi taktis kewilayahan.

---

## 🎯 Ringkasan Masalah Lapangan & Solusi Sistem

| Masalah Operasional Lapangan | Dampak / Risiko Kedinasan | Solusi Terintegrasi SIMAPRES 110 |
| :--- | :--- | :--- |
| **1. Laporan 110 Tertahan di Meja ("Kasus Mandek")** | Laporan telepon 110 masuk, dicatat di kertas, lalu tertahan di meja tanpa kejelasan siapa yang mendisposisi dan merespon. Pimpinan tidak tahu status riil. | **Executive Command Center & SLA Alarm**: Indikator counter live, alarm otomatis jika laporan tidak tertangani dalam SLA 10 menit, serta *Smart CAD Proximity Dispatch* ke armada terdekat. |
| **2. Ketidakpastian Masyarakat Pelapor** | Warga merasa diabaikan setelah menelepon 110 karena tidak adanya update perkembangan penanganan. | **Portal Publik & Stepper Tracking 110**: Pelacakan transparan 5 tahap (*Verifikasi* &rarr; *Disposisi* &rarr; *Menuju TKP* &rarr; *Olah TKP* &rarr; *Selesai*) disertai dokumentasi foto penanganan dan nama petugas. |
| **3. Keraguan Integritas Personel ("Laporan Fiktif Dekat Mako")** | Personil mengklaim sudah berada di TKP, namun kenyataannya masih berada di dekat markas komando atau warung kopi. | **Audit Geolokasi Ganda (Dual-Location Audit & Haversine)**: Perbandingan otomatis antara alamat yang diklaim dengan koordinat GPS riil perangkat saat unggah foto. Deviasi > 500m memicu `🚨 MISMATCH_ALERT` untuk disidak Kanit Propam. |
| **4. Pelacakan Armada Real-Time & Efisiensi Respon** | Sulit mengetahui posisi pasti mobil patroli saat terjadi insiden darurat, menyebabkan waktu respon lambat. | **Live Automatic Vehicle Location (AVL) & Smart Dispatch**: Telemetri live armada patroli (Samapta, Perintis Presisi, Patwal Satlantas) lengkap dengan kecepatan (km/jam), status operasional, alamat manusia, dan rekomendasi unit terdekat ke TKP. |
| **5. Keamanan Perangkat Lapangan & Resiko Fake GPS** | Kekhawatiran aplikasi disusupi aplikasi pemalsu lokasi (*Mock Location / Fake GPS*) atau akun disalahgunakan pihak luar. | **Hardware Device Binding & PKI (Seksi TIK)**: Penguncian aplikasi ke satu smartphone kedinasan berbasis Android Keystore StrongBox TEE / Secure Element, sertifikat mTLS, deteksi anti-mock GPS, serta QR code enrollment token 6-digit. |
| **6. Penataan Rute Patroli & Titik Rawan Kriminalitas** | Rute patroli tidak terstruktur dan pengawasan checkpoint titik rawan sering tidak terdokumentasi dengan baik. | **Manajemen Checkpoint & Rute Taktis (Kabag Ops)**: Pengaturan sequence order pos pantau (▲ Naik / ▼ Turun), target jam tiba, QR code verifikasi tiang pos, serta pembagian alokasi unit (*Unit-Specific Beats* vs *Patroli Gabungan*). |

---

## 👥 Struktur Peran Pengguna (RBAC 8 Peran Kedinasan)

1. **🏢 Kapolres / Kapolsek (Pimpinan Eksekutif)**:
   - Command Center eksekutif pemantauan komprehensif wilayah hukum.
   - Peta taktis terpadu dengan sebaran armada patroli aktif dan titik rawan kriminalitas aktif.
   - Evaluasi SLA respon darurat 110 dan tren kamtibmas harian/mingguan.
2. **🎯 Kabag Ops (Pengendali Operasi & Taktis Wilayah)**:
   - Smart CAD Proximity Dispatcher (rekomendasi armada terdekat ke TKP dan 1-Click Dispatch).
   - Pengaturan master rute patroli taktis dan checkpoint berurutan (CRUD & reorder).
   - Pengaturan master titik rawan kriminalitas (*Crime Hotspots Manager*).
3. **🛡️ Kanit Propam / Provos (Penegakan Disiplin & Akuntabilitas)**:
   - Audit trail geolokasi investigatif (Dual-Location Audit).
   - Penindakan deviasi klaim vs GPS riil (`MISMATCH_ALERT`), sidak klarifikasi, dan penerbitan rekomendasi disiplin.
4. **💻 Seksi TIK Polres (Infrastruktur & Keamanan Siber)**:
   - Pendaftaran dan otorisasi akun personil kedinasan.
   - Manajemen *Hardware Device Binding*, audit Keystore StrongBox, dan sertifikat mTLS.
   - Pemutusan darurat (*Remote Revoke*) dan pembuatan token re-binding perangkat.
5. **📞 Operator SPKT / Call Center 110**:
   - Penerimaan panggilan darurat masyarakat 24/7 dan triage insiden.
   - Pembuatan nomor laporan polisi resmi (`LP-110-YYYYMM-XXXX`) dan verifikasi awal.
6. **👮‍♂️ Kanit / Perwira Lapangan**:
   - Supervisi penugasan regu jaga dan persetujuan e-Logbook harian anggota.
   - Verifikasi bukti penanganan di TKP sebelum kasus ditutup.
7. **🚨 Personil Lapangan (Bripka Ahmad - Tim Samapta)**:
   - Aplikasi mobile kedinasan (PWA) untuk respon cepat panggilan 110.
   - Input e-Logbook 4 aksi cepat: **PATROLI**, **TP-TKP**, **SAMBANG**, **PENGAMANAN**.
   - Pengunggahan dokumentasi foto/video wajib dengan stempel waktu dan GPS otomatis.
8. **👥 Masyarakat Umum (Portal Publik)**:
   - Pelacakan mandiri tiket pengaduan 110 secara transparan.
   - Pembuatan laporan darurat online dari ponsel tanpa antrean.

---

## 🗺️ Fitur Unggulan Peta Taktis & Geolokasi

- **Zero Raw Coordinates**: Seluruh titik insiden, posisi armada, dan checkpoint ditampilkan menggunakan nama jalan dan patokan landmark manusia (misal: *"Jl. Veteran No. 12 (Depan Bank BCA)"*), bukan angka desimal koordinat mentah.
- **Peta Bersih & Fokus Operasi**: Insiden yang telah berstatus `SELESAI` disembunyikan secara default agar peta tetap bersih dan fokus pada situasi genting, disertai tombol toggle `[👁️ Riwayat Selesai: OFF/ON]`.
- **Tooltip HUD Non-Intrusif**: Informasi unit dan insiden muncul saat diarahkan kursor (*hover*) atau diklik, tanpa menutupi ikon personil atau armada di peta.

---

## 🚀 Panduan Menjalankan & Menguji Prototype

1. Buka file `simapres_110_prototype.html` atau `index.html` langsung di browser web modern (Google Chrome, Mozilla Firefox, Microsoft Edge, Safari).
2. Gunakan **Role Selector Bar** di bagian atas untuk berpindah antar 8 peran kedinasan.
3. Fitur pengujian cepat:
   - **📱 Simulasi HP (Mobile)**: Mengaktifkan frame smartphone untuk merasakan tampilan aplikasi personil lapangan.
   - **⚡ Panggilan 110 Baru**: Menghasilkan panggilan darurat baru secara acak untuk menguji alur dispatch.
   - **🔄 Reset Data**: Mengembalikan seluruh data simulasi ke kondisi awal.

---

## 📦 Struktur Berkas Master Package

- `index.html`, `style.css`, `app.js`: Sumber kode prototype web interaktif.
- `simapres_110_prototype.html`: Versi mandiri (*single-file bundle*) tanpa dependensi eksternal.
- `schema.sql`: Skema database terstandar MySQL 8.0+ / MariaDB / PostGIS dengan fungsi spasial Haversine.
- `arsitektur_microservices.md`: Dokumen arsitektur teknis microservices, message broker, dan caching Redis Geo.
- `REKAPAN_LENGKAP_WORKFLOW_DAN_ARSITEKTUR_SIMAPRES_110.md` (.docx & .pdf): Rekapan komprehensif kajian operasional, RBAC, dan skema sistem.
- `PANDUAN_SETUP_DAN_DEPLOYMENT_SIMAPRES_110.md` (.docx & .pdf): Panduan teknis instalasi server Ubuntu, Docker Compose, Nginx SSL, dan hardening keamanan.
