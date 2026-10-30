# 📋 Laporan Hasil Pengujian Otomatis SIMAPRES 110

> **Status Eksekusi**: **185 dari 185 Uji Coba Lulus (100% Berhasil)**  
> **Cakupan Arsitektur**: *Clean Architecture* (Domain Entity & Rules, Application Use Cases, Infrastructure Prisma Repositories, Server Actions, & Security Utilities)  
> **Waktu Eksekusi**: 2.82 Detik | **Pemeriksaan Kompilasi**: Bebas Kesalahan Tipe (*0 Type Errors*)

---

## 📌 Ringkasan Eksekutif

Pengujian otomatis (*Automated Testing*) ini memvalidasi keandalan dan integritas sistem **SIMAPRES 110 (Sistem Informasi Manajemen Operasional Presisi)** dalam melayani pengaduan masyarakat, memantau pergerakan armada patroli kepolisian secara *real-time*, menjamin perlindungan data pribadi sesuai **UU PDP No. 27/2022**, menegakkan mediasi damai (*Restorative Justice*) berbasis **Perpol No. 8/2021**, serta mencegah manipulasi lokasi (*Anti-Fake GPS*).

---

## 1. 🛡️ Lapisan Domain: Entitas & Aturan Bisnis (Domain Layer)

Lapisan ini memuat logika inti kepolisian dan aturan hukum baku yang tidak bergantung pada database atau antarmuka luar.

### A. Entitas Pengaduan Masyarakat (`complaint-entity.test.ts`)
*Memastikan privasi pelapor terlindungi dan tahapan respon lapangan berjalan runut dari laporan masuk hingga selesai.*

| No | Skenario yang Diuji | Status |
|:---:|---|:---:|
| 1 | **Privasi Pelapor (UU PDP)**: Menyamarkan 4 digit tengah nomor HP warga (contoh: `0812****7890`) agar identitas pelapor tidak bocor ke pihak yang tidak berwenang | **LULUS** |
| 2 | **Penanganan Nomor Abnormal**: Menghasilkan format aman (`****`) jika nomor telepon pelapor terlalu pendek (< 8 digit) untuk mencegah eror aplikasi | **LULUS** |
| 3 | **Tahapan Lapangan (Tahap 3)**: Petugas dapat mengonfirmasi pergerakan menuju lokasi insiden (*Meluncur ke TKP*) dan sistem mencatat waktu tempuhnya secara otomatis | **LULUS** |
| 4 | **Tahapan Lapangan (Tahap 4)**: Petugas mengonfirmasi kedatangan di lokasi (*Tiba di TKP*) dengan audit otomatis jarak koordinat GPS terhadap titik laporan warga | **LULUS** |
| 5 | **Tahapan Lapangan (Tahap 5)**: Petugas mengajukan Berita Acara Pemeriksaan (*BAP*) dan memohon persetujuan pengesahan ke Perwira Pengawas (Pawas) | **LULUS** |
| 6 | **Penyelesaian Langsung**: Kasus dapat langsung dituntaskan di tempat (*SELESAI*) jika diselesaikan secara diskresi sah oleh perwira pengendali di lapangan | **LULUS** |
| 7 | **Penutupan Laporan & IKM**: Tiket pengaduan ditutup setelah disahkan Pawas dan sistem membuka hak warga untuk memberikan rating kepuasan (IKM) | **LULUS** |

---

### B. Aturan Hak Akses & Matriks Kewenangan (`complaint-rules.test.ts`)
*Mencegah penyalahgunaan wewenang antar peran: Operator 110, Perwira Pengawas (Pawas), Personel Lapangan, dan Warga.*

| No | Skenario yang Diuji | Status |
|:---:|---|:---:|
| 8 | **Hak Operator**: Operator SPKT 110 berwenang mendisposisikan (*dispatch*) tiket baru berstatus `MENUNGGU` ke satuan/petugas terkait | **LULUS** |
| 9 | **Pencegahan Wewenang**: Operator SPKT 110 dilarang mengesahkan BAP atau menutup tiket secara sepihak (wewenang eksklusif Pawas) | **LULUS** |
| 10 | **Hak Pawas**: Perwira Pengawas berwenang memeriksa dan mengesahkan resolusi BAP saat tiket berstatus `MENUNGGU_PENGESAHAN` | **LULUS** |
| 11 | **Hak Pawas**: Perwira Pengawas berwenang mengalihkan disposisi petugas patroli sebelum personel meluncur ke lokasi | **LULUS** |
| 12 | **Hak Personel**: Personel tertunjuk berwenang memperbarui status menjadi 'Meluncur' dari status persiapan dinas | **LULUS** |
| 13 | **Hak Personel**: Personel tertunjuk berwenang mengonfirmasi 'Tiba di TKP' setelah tahapan meluncur aktif | **LULUS** |
| 14 | **Hak Personel**: Personel yang sudah tiba di TKP berwenang mengunggah dokumen BAP dan mengajukan pengesahan resolusi | **LULUS** |
| 15 | **Keamanan Penugasan**: Personel lain yang tidak tertugaskan pada tiket tersebut ditolak saat mencoba mengubah status laporan | **LULUS** |
| 16 | **Hak Warga**: Warga pelapor hanya dapat memberikan nilai kepuasan bintang (IKM) setelah tiket pengaduan berstatus `SELESAI` | **LULUS** |

---

### C. Kebijakan Notifikasi WhatsApp Otomatis (`notification-rules.test.ts`)
*Menjamin pelapor dan petugas selalu mendapatkan pembaruan status tanpa biaya SMS melalui WhatsApp resmi.*

| No | Skenario yang Diuji | Status |
|:---:|---|:---:|
| 17 | **Pembersihan Nomor HP**: Membersihkan input nomor telepon yang mengandung spasi, tanda strip, atau awalan internasional (`+62` / `08`) | **LULUS** |
| 18 | **Penolakan Nomor Kosong**: Menolak nomor telepon kosong, null, atau sekadar angka uji coba (*placeholder*) | **LULUS** |
| 19 | **Validasi Nomor Seluler Indonesia**: Memvalidasi keaslian nomor telepon seluler aktif Indonesia (panjang 9 hingga 15 digit) | **LULUS** |
| 20 | **Penolakan Input Palsu**: Menolak nomor telepon rumah tanpa kode area, nomor terlalu pendek, atau teks acak | **LULUS** |
| 21 | **Notifikasi Tiket Baru**: Sistem otomatis mengirim pesan WhatsApp bukti tanda lapor ke warga saat laporan berhasil dibuat | **LULUS** |
| 22 | **Notifikasi Disposisi**: Sistem otomatis mengirim notifikasi ke warga dan personel patroli saat tugas lapangan diterbitkan | **LULUS** |
| 23 | **Notifikasi Selesai & Survei**: Sistem otomatis mengirim tautan survei Indeks Kepuasan Masyarakat (IKM) ke warga saat tiket rampung | **LULUS** |
| 24 | **Pencegahan Eror Notifikasi**: Pengiriman notifikasi ke warga ditiadakan dengan aman tanpa menimbulkan kegagalan jika nomor HP pelapor tidak valid | **LULUS** |

---

### D. Standar Mediasi & Keadilan Restoratif (`resolution-rules.test.ts`)
*Menerapkan prinsip keadilan restoratif secara ketat berlandaskan Perpol No. 8 Tahun 2021.*

| No | Skenario yang Diuji | Status |
|:---:|---|:---:|
| 25 | **Kelayakan Berkas Resolusi**: Menyetujui pengajuan berkas penyelesaian jika seluruh data kronologi, jenis resolusi, dan bukti lengkap | **LULUS** |
| 26 | **Validasi Tempat Penyelesaian**: Menolak berkas jika lokasi penyelesaian (TKP / Kantor Polisi / RSUD) tidak dicantumkan | **LULUS** |
| 27 | **Bukti Wajib**: Menolak pengajuan penyelesaian jika bukti foto fisik, surat mediasi, atau dokumen kesepakatan tidak dilampirkan | **LULUS** |
| 28 | **Kelayakan Kronologi**: Menolak uraian hasil mediasi yang terlalu singkat (< 10 karakter) untuk menjaga akuntabilitas dokumen kepolisian | **LULUS** |
| 29 | **Larangan Restorative Justice Pidana Berat**: Melarang keras BAP Damai pada tindak pidana narkoba, pembunuhan, dan terorisme | **LULUS** |
| 30 | **Pencegahan Pelanggaran Hukum**: Menolak draf berkas damai jika kategori tindak pidana masuk dalam daftar tindak pidana terlarang | **LULUS** |
| 31 | **Izin Restorative Justice Perkara Ringan**: Mengizinkan keadilan restoratif untuk tindak pidana ringan (*tipiring*), perselisihan warga, dan sengketa kekeluargaan | **LULUS** |
| 32 | **Audit GPS TKP**: Mewajibkan kecocokan GPS secara ketat jika kesepakatan mediasi diklaim dibuat langsung di TKP kejadian | **LULUS** |
| 33 | **Fleksibilitas Lokasi Non-TKP**: Mengizinkan toleransi jarak koordinat jika mediasi dialihkan ke Mapolres, Polsek, atau fasilitas medis | **LULUS** |
| 34 | **Kewenangan Pengajuan**: Mengizinkan personel pelaksana lapangan mengirim draf resolusi selama tiket dalam penanganan (`DIPROSES`) | **LULUS** |
| 35 | **Kewenangan Verifikasi**: Mengizinkan Pawas menyetujui atau menolak dokumen resolusi saat berstatus `MENUNGGU_PENGESAHAN` | **LULUS** |
| 36 | **Pencegahan Konflik Kepentingan**: Mencegah personel lapangan mengesahkan dokumen BAP hasil buatannya sendiri | **LULUS** |

---

## 2. ⚙️ Lapisan Aplikasi: Alur Kerja & Logika Bisnis (Application Layer)

Lapisan ini mengatur alur koordinasi pengiriman armada (*dispatching*), keamanan otentikasi personel, serta validasi operasional.

### A. Rekomendasi Disposisi Cerdas CAD (`calculate-cad-dispatch.test.ts`)
*Sistem Computer-Aided Dispatch (CAD) merekomendasikan unit operasional yang paling relevan dan terdekat ke lokasi insiden.*

| No | Skenario yang Diuji | Status |
|:---:|---|:---:|
| 37 | **Disposisi Laka Lantas**: Insiden tabrakan atau gangguan lalu lintas otomatis diarahkan ke Satuan Lalu Lintas (Sat Lantas) | **LULUS** |
| 38 | **Disposisi Kriminalitas**: Insiden begal, pencurian, kekerasan, atau senjata tajam otomatis diarahkan ke Satuan Reskrim | **LULUS** |
| 39 | **Disposisi Perselisihan Warga**: Konflik batas tanah atau percekcokan warga otomatis diarahkan ke Bhabinkamtibmas / Sat Binmas | **LULUS** |
| 40 | **Disposisi Gangguan Kamtibmas**: Insiden tawuran, kerumunan mabuk, atau keributan umum diarahkan ke Satuan Samapta / Tim Patroli Presisi | **LULUS** |
| 41 | **Perhitungan Estimasi Waktu (ETA)**: Mengukur jarak tempuh dan menentukan apakah respon armada berada dalam batas aman SLA (< 10 menit) | **LULUS** |

---

### B. Otentikasi, Keamanan Sesi & Hardware Binding (`login-and-token-security.test.ts`)
*Menjamin sistem hanya dapat diakses oleh personel kepolisian yang sah dan perangkat ponsel dinas yang terdaftar.*

| No | Skenario yang Diuji | Status |
|:---:|---|:---:|
| 42 | **Validasi Kredensial**: Menolak percobaan masuk jika NRP atau kata sandi tidak diisi | **LULUS** |
| 43 | **Pemeriksaan Akun**: Menolak akses jika data personel tidak terdaftar pada basis data anggota kepolisian | **LULUS** |
| 44 | **Akun Nonaktif**: Menolak akses jika status kedinasan personel dinyatakan tidak aktif (*inactive*) | **LULUS** |
| 45 | **Kecocokan Password**: Menolak login jika kata sandi tidak cocok dengan enkripsi hash aman Bcrypt | **LULUS** |
| 46 | **Pengalihan Hak Akses**: Otomatis mengarahkan akun berpangkat Perwira Pengawas (Pawas) ke portal komando `/console/pawas` | **LULUS** |
| 47 | **Wajib Hardware Device**: Menolak login personel patroli lapangan jika perangkat ponsel pintarnya belum dipasangkan (*paired*) di database | **LULUS** |
| 48 | **Pencegahan Ponsel Tidak Sah**: Menolak akses jika IMEI/Device ID ponsel fisik berbeda dengan yang didaftarkan saat dinas | **LULUS** |
| 49 | **Izin Akses Sah**: Mengizinkan akses masuk saat NRP, kata sandi, dan Device ID fisik ponsel terverifikasi cocok secara sah | **LULUS** |
| 50 | **Pembuatan Token Pelacakan Warga**: Menghasilkan token pelacakan 16 karakter yang unik berbasis enkripsi HMAC-SHA256 dari nomor tiket | **LULUS** |
| 51 | **Fleksibilitas Input Warga**: Token dapat dikenali dan diverifikasi secara tepat baik warga menuliskan awalan tanda pagar (`#`) maupun tidak | **LULUS** |
| 52 | **Anti-Pemalsuan Token**: Menolak token palsu atau manipulasi nomor tiket oleh pihak lain yang ingin menyadap posisi petugas (*Anti-Tampering*) | **LULUS** |
| 53 | **Ketahanan Format Token**: Menangani karakter rusak atau token kosong tanpa menyebabkan sistem mengalami gangguan (*zero-crash*) | **LULUS** |

---

### C. Alur Pengaduan & Disposisi (`complaint-use-cases.test.ts`)

| No | Skenario yang Diuji | Status |
|:---:|---|:---:|
| 54 | **Validasi Wajib**: Memeriksa kelengkapan seluruh kolom data pelapor dan insiden sebelum disimpan | **LULUS** |
| 55 | **Pencegahan Tiket Ganda**: Mencegah duplikasi nomor registrasi tiket di sistem | **LULUS** |
| 56 | **Penerbitan Tiket**: Berhasil menerbitkan tiket laporan baru dengan nomor urut resmi SIMAPRES 110 | **LULUS** |
| 57 | **Disposisi Penugasan**: Menugaskan laporan ke personel lapangan aktif dan mencatat log penugasan (*DISPATCH_ISSUED*) | **LULUS** |
| 58 | **Proteksi Data Hilang**: Menghentikan proses penugasan dengan aman jika tiket atau personel tidak ditemukan | **LULUS** |
| 59 | **Penerimaan Survei IKM**: Menerima ulasan dan bintang kepuasan (1 s.d. 5) dari warga pelapor | **LULUS** |
| 60 | **Proteksi Survei**: Menolak pengisian survei jika penanganan tiket belum benar-benar tuntas | **LULUS** |

---

### D. Anti-Fake GPS & Tahapan Lapangan (`field-step-and-gps.test.ts`)

| No | Skenario yang Diuji | Status |
|:---:|---|:---:|
| 61 | **Pembaruan Tahap 3**: Memperbarui status personel dari posisi persiapan menuju pergerakan meluncur ke TKP | **LULUS** |
| 62 | **Konfirmasi Tiba di TKP**: Petugas tiba di lokasi dengan verifikasi posisi GPS riil yang sinkron | **LULUS** |
| 63 | **Deteksi Manipulasi GPS**: Sistem otomatis memberi tanda bahaya (*FLAGGED_AUDIT*) jika koordinat GPS petugas berjarak > 500 meter dari TKP | **LULUS** |
| 64 | **Integritas Alur Kerja**: Mencegah petugas memalsukan langkah (misal langsung mengaku tiba di TKP tanpa melalui tahapan meluncur) | **LULUS** |

---

### E. Manajemen Titik Rawan Kejahatan & Laka (`manage-hotspots.test.ts`)

| No | Skenario yang Diuji | Status |
|:---:|---|:---:|
| 65 | **Pemetaan Hotspot**: Menampilkan sebaran titik rawan kamtibmas berdasarkan wilayah hukum Polsek jajaran | **LULUS** |
| 66 | **Filter Kategori**: Memfilter peta titik rawan berdasarkan jenis kejadian (Kecelakaan, Begal, Balap Liar, Narkoba) | **LULUS** |
| 67 | **Registrasi Hotspot Baru**: Menambahkan titik rawan baru dengan status bahaya (Merah: Tinggi, Kuning: Sedang, Hijau: Rendah) | **LULUS** |
| 68 | **Pembaruan Status Hotspot**: Mengubah level kerawanan dan jam rawan patroli berdasarkan data statistik kriminalitas terbaru | **LULUS** |

---

### F. Buku Mutasi Digital Patroli (`logbook-and-audit.test.ts`)

| No | Skenario yang Diuji | Status |
|:---:|---|:---:|
| 69 | **Pencatatan Mutasi**: Merekam aktivitas patroli personel ke buku mutasi digital lengkap dengan titik GPS aktual | **LULUS** |
| 70 | **Audit Deviasi Alamat**: Menghitung selisih jarak antara alamat yang diklaim petugas dengan posisi satelit GPS riil | **LULUS** |
| 71 | **Pengesahan Buku Mutasi**: Perwira Pengawas (Pawas) dapat memberikan status pengesahan `VALID` atau `FLAGGED` pada riwayat patroli | **LULUS** |

---

### G. Supervisi & Keputusan Pawas (`pawas-use-cases.test.ts`)

| No | Skenario yang Diuji | Status |
|:---:|---|:---:|
| 72 | **Pengesahan Laporan Selesai**: Pawas menyetujui BAP penyelesaian perkara dan meresmikan status pengaduan menjadi `SELESAI` | **LULUS** |
| 73 | **Pengembalian Berkas**: Pawas mengembalikan BAP ke petugas lapangan jika dokumentasi bukti masih belum lengkap | **LULUS** |
| 74 | **Penolakan Laporan Palsu**: Pawas berwenang menolak pengaduan fiktif (*DITOLAK*) disertai bukti alasan audit kepolisian | **LULUS** |

---

## 3. 🗄️ Lapisan Infrastruktur: Basis Data & Layanan Geospasial (Infrastructure Layer)

Lapisan ini memvalidasi komunikasi ke database MySQL/MariaDB melalui Prisma ORM dan akurasi rumus geodetik.

### A. Repositori Pengaduan (`prisma-complaint.repository.test.ts`)

| No | Skenario yang Diuji | Status |
|:---:|---|:---:|
| 75 | **Pencarian Berdasarkan ID**: Mengambil data pengaduan secara cepat berdasarkan primary key ID numerik | **LULUS** |
| 76 | **Pencarian Berdasarkan Tiket**: Menemukan data pengaduan menggunakan kode tiket resmi (contoh: `TKT-202610-001`) | **LULUS** |
| 77 | **Penyimpanan Entity**: Menyimpan seluruh entitas pengaduan ke tabel fisik dengan pemetaan kolom yang tepat | **LULUS** |

---

### B. Repositori Titik Rawan (`prisma-hotspot.repository.test.ts`)

| No | Skenario yang Diuji | Status |
|:---:|---|:---:|
| 78 | **Ambil Seluruh Hotspot**: Memuat semua titik rawan aktif untuk kebutuhan monitoring pimpinan | **LULUS** |
| 79 | **Filter Polsek**: Memuat titik rawan spesifik per wilayah Polsek untuk kebutuhan analisa patroli kewilayahan | **LULUS** |
| 80 | **Detail Hotspot**: Mengambil rincian data historis dan jam rawan operasional satu titik rawan | **LULUS** |
| 81 | **Simpan Hotspot**: Menyimpan penambahan titik rawan baru ke database dengan koordinat desimal akurat | **LULUS** |

---

### C. Repositori Buku Mutasi Patroli (`prisma-logbook.repository.test.ts`)

| No | Skenario yang Diuji | Status |
|:---:|---|:---:|
| 82 | **Pencarian Mutasi**: Mengambil data entri buku mutasi berdasarkan ID riwayat | **LULUS** |
| 83 | **Riwayat Personel**: Mengambil daftar seluruh kegiatan patroli yang dilakukan oleh personel tertentu | **LULUS** |
| 84 | **Penyimpanan Mutasi**: Menyimpan log buku mutasi lengkap dengan waktu mulai, selesai, dan koordinat satelit | **LULUS** |

---

### D. Repositori Personel Kepolisian (`prisma-officer.repository.test.ts`)

| No | Skenario yang Diuji | Status |
|:---:|---|:---:|
| 85 | **Pencarian NRP**: Menemukan akun personel berdasarkan Nomor Registrasi Pokok (NRP) resmi Polri | **LULUS** |
| 86 | **Penanganan NRP Tidak Ditemukan**: Mengembalikan nilai null secara aman jika NRP tidak terdaftar di sistem | **LULUS** |
| 87 | **Pencarian ID Personel**: Mengambil profil personel berdasarkan ID internal | **LULUS** |
| 88 | **Personel Bertugas Aktif**: Mengambil daftar personel yang sedang dalam dinas patroli aktif atau piket SPKT | **LULUS** |
| 89 | **Pembaruan Koordinat GPS**: Memperbarui posisi lintang/bujur dan waktu detak sinyal (*heartbeat*) terkini ponsel dinas | **LULUS** |
| 90 | **Pembaruan Status Kedinasan**: Mengubah status tugas personel (Siaga Mako, Dinas Patroli, atau Selesai Piket) | **LULUS** |

---

### E. Repositori Akun Pengguna (`prisma-user.repository.test.ts`)

| No | Skenario yang Diuji | Status |
|:---:|---|:---:|
| 91 | **Pencarian Username**: Menemukan kredensial pengguna internal kepolisian berdasarkan username | **LULUS** |
| 92 | **Pencarian Nomor HP**: Menemukan akun warga masyarakat berdasarkan nomor kontak seluler | **LULUS** |
| 93 | **Penanganan User Nihil**: Mengembalikan null jika pengguna belum terdaftar di sistem | **LULUS** |
| 94 | **Pencarian Profil User**: Mengambil data hak akses dan peran pengguna berdasarkan ID akun | **LULUS** |
| 95 | **Pendaftaran Akun Warga Otomatis**: Otomatis mendaftarkan warga pelapor baru saat mengirim pengaduan melalui nomor WhatsApp | **LULUS** |

---

### F. Audit Bahan Bakar & Geodetik Haversine (`haversine-and-fuel.test.ts`)
*Menghitung jarak presisi tinggi dan mencegah manipulasi pengeluaran BBM armada dinas kepolisian.*

| No | Skenario yang Diuji | Status |
|:---:|---|:---:|
| 96 | **Jarak Nol**: Mengembalikan jarak 0 meter secara presisi jika kedua titik koordinat berada di tempat yang persis sama | **LULUS** |
| 97 | **Akurasi Geodetik**: Menghitung jarak lengkung bumi akurat dalam meter dan kilometer antara Mako Kajen dan Kedungwuni | **LULUS** |
| 98 | **Lolos Validasi Lokasi**: Menetapkan status `VALID` jika posisi petugas berada dalam toleransi jarak wajar (< 500 meter) | **LULUS** |
| 99 | **Peringatan Anomali Lokasi**: Menandai bendera peringatan `FLAGGED_AUDIT` jika posisi petugas melenceng melebihi ambang batas | **LULUS** |
| 100 | **Faktor Tortuositas Jalan (1.25x)**: Menerapkan standar rasio belokan jalan riil sebesar 1.25x dibanding jarak garis lurus satelit untuk audit wajar BBM | **LULUS** |

---

## 4. 🌐 Lapisan Server Actions (Next.js 14 Server Actions)

Lapisan ini memvalidasi pintu masuk aksi antarmuka web, pemutakhiran data, otorisasi RBAC ketat, dan API internal konsol SIMAPRES 110.

### A. Tindakan Autentikasi Masuk & Keluar (`auth.actions.test.ts`)

| No | Skenario yang Diuji | Status |
|:---:|---|:---:|
| 101 | **Proteksi Gagal Masuk**: Mengembalikan pesan kegagalan ramah pengguna saat kata sandi salah atau perangkat tidak terdaftar | **LULUS** |
| 102 | **Penerbitan Sesi Aman**: Menetapkan cookie sesi terenkripsi (*HttpOnly*) dan mengembalikan data profil saat login berhasil | **LULUS** |
| 103 | **Proteksi Brute-Force & Lockout**: Memblokir percobaan login berulang setelah melebihi ambang batas rate limit 5x tanpa membebani basis data (*Zero DB Flooding*) | **LULUS** |
| 104 | **Pembersihan Sesi Logout**: Menghapus seluruh cookie sesi dan mengunci akses saat pengguna keluar dari konsol | **LULUS** |

---

### B. Komunikasi Pesan Taktis Tiket (`chat.actions.test.ts`)

| No | Skenario yang Diuji | Status |
|:---:|---|:---:|
| 105 | **Proteksi Tiket Kosong**: Mengembalikan daftar pesan kosong secara aman jika parameter tiket tidak disertakan | **LULUS** |
| 106 | **Muat Percakapan Lapangan**: Memuat riwayat koordinasi taktis antara pelapor dan personel patroli dari tabel khusus `complaint_chats` | **LULUS** |

---

### C. Aksi Pengaduan Warga (`complaint.actions.test.ts`)

| No | Skenario yang Diuji | Status |
|:---:|---|:---:|
| 107 | **Validasi Nama Pelapor**: Menolak proses pembuatan laporan jika nama pelapor belum diisi | **LULUS** |
| 108 | **Validasi Kontak Pelapor**: Menolak proses jika nomor HP pelapor kosong atau bernilai tidak wajar | **LULUS** |
| 109 | **Validasi Kategori Laporan**: Menolak proses jika klasifikasi atau jenis tindak insiden belum dipilih | **LULUS** |
| 110 | **Validasi Alamat Kejadian**: Menolak proses jika alamat lokasi TKP belum dicantumkan | **LULUS** |
| 111 | **Validasi Koordinat Peta**: Menolak proses jika titik koordinat GPS di peta tidak valid atau bernilai kosong | **LULUS** |
| 112 | **Validasi Uraian Kejadian**: Menolak proses jika ringkasan keterangan laporan dibiarkan kosong | **LULUS** |
| 113 | **Pembuatan Pengaduan Lengkap**: Berhasil menerbitkan tiket laporan, menghasilkan token lacak warga, dan memicu notifikasi WhatsApp | **LULUS** |
| 114 | **Proteksi Anti-Spam Agresif**: Memblokir pengiriman aduan beruntun dari nomor telepon yang sama secara agresif menggunakan sliding-window rate limiter | **LULUS** |

---

### D. Pemasangan Perangkat QR Telemetri (`device.actions.test.ts`)

| No | Skenario yang Diuji | Status |
|:---:|---|:---:|
| 115 | **Sesi QR Baru**: Membuat sesi pairing QR baru dengan status awal `WAITING` pada basis data | **LULUS** |
| 116 | **Ketahanan Eror Database**: Menangani kendala koneksi basis data tanpa menyebabkan tampilan layar terputus | **LULUS** |
| 117 | **Eksklusivitas Perangkat (1 HP = 1 Akun)**: Menautkan Device ID ke personel aktif dan otomatis melepaskan tautan dari akun personel lama | **LULUS** |

---

### E. Telemetri Armada Patroli (`fleet.actions.test.ts`)

| No | Skenario yang Diuji | Status |
|:---:|---|:---:|
| 118 | **Pemantauan Armada**: Memuat seluruh unit patroli aktif di peta, mendeteksi status validitas GPS, serta membedakan unit di Mako atau di jalan | **LULUS** |

---

### F. Aksi Pemetaan Titik Rawan (`hotspot.actions.test.ts`)

| No | Skenario yang Diuji | Status |
|:---:|---|:---:|
| 119 | **Muat Sebaran Hotspot**: Mengambil daftar titik rawan kamtibmas yang telah diformat untuk visualisasi peta taktis | **LULUS** |
| 120 | **Validasi Kolom Wajib**: Menolak penambahan titik rawan jika judul lokasi atau Polsek penanggung jawab kosong | **LULUS** |
| 121 | **Sukses Tambah Titik Rawan**: Berhasil menyimpan lokasi rawan baru lengkap dengan jadwal rawan dan unit patroli terdekat | **LULUS** |

---

### G. Pustaka SOP & Edukasi Presisi (`knowledge.actions.test.ts`)

| No | Skenario yang Diuji | Status |
|:---:|---|:---:|
| 122 | **Muat Pustaka SOP**: Mengambil daftar artikel Standar Operasional Prosedur (SOP) dan FAQ kepolisian untuk panduan petugas | **LULUS** |

---

### H. Aksi Buku Mutasi Patroli (`logbook.actions.test.ts`)

| No | Skenario yang Diuji | Status |
|:---:|---|:---:|
| 123 | **Tambah Entri Mutasi**: Merekam kegiatan dinas patroli ke dalam database mutasi melalui Server Action | **LULUS** |
| 124 | **Pengesahan Oleh Pawas**: Mengesahkan status buku mutasi personel (`VALID`) langsung dari panel kontrol Perwira Pengawas | **LULUS** |

---

### I. Pengelolaan Data Master Kepolisian (`master.actions.test.ts`)

| No | Skenario yang Diuji | Status |
|:---:|---|:---:|
| 125 | **Ringkasan Angka Master**: Menghitung total entitas data master lintas 13 tabel kepolisian (pangkat, polsek, satfung, ranmor, dll) | **LULUS** |
| 126 | **Bundel Lookup Cepat**: Memuat seluruh opsi pilihan dropdown formulir dalam 1 roundtrip kueri cepat tanpa beban berlebih | **LULUS** |
| 127 | **Ambil Pangkat Polri**: Mengambil daftar pangkat kepolisian aktif terurut rapi dari Tamtama, Bintara, hingga Perwira | **LULUS** |
| 128 | **Validasi Pangkat**: Menolak penambahan data master pangkat jika kode singkatan atau nama pangkat tidak diisi | **LULUS** |
| 129 | **Sukses Simpan Pangkat**: Berhasil menyimpan data pangkat kepolisian baru ke dalam tabel master | **LULUS** |

---

### J. Penilaian Kinerja Operator 110 (`operator-ranking.test.ts`)
*Mengevaluasi kecepatan respon panggilan 110, akurasi input data, dan kepatuhan SOP operator SPKT.*

| No | Skenario yang Diuji | Status |
|:---:|---|:---:|
| 130 | **Predikat Teladan (Nilai >= 90)**: Diberikan kepada operator dengan kecepatan respon tinggi, input lengkap, dan tanpa pelanggaran | **LULUS** |
| 131 | **Predikat Pelayanan Baik (75 - 89 Poin)**: Diberikan kepada operator yang memenuhi standar penanganan tugas pokok dengan baik | **LULUS** |
| 132 | **Status Siaga (0 Tiket)**: Diberikan kepada operator cadangan yang sedang bersiap dan belum menangani panggilan masuk | **LULUS** |
| 133 | **Evaluasi SOP (< 60 Poin)**: Menandai operator dengan kinerja lambat atau data tidak lengkap untuk diberikan pembinaan oleh Pawas | **LULUS** |

---

### K. Panel Komando Perwira Pengawas (`pawas.actions.test.ts`)

| No | Skenario yang Diuji | Status |
|:---:|---|:---:|
| 134 | **Dashboard Utama Pawas**: Mengagregasikan tiket yang butuh pengesahan, komplain terbaru, dan ringkasan mutasi harian | **LULUS** |
| 135 | **Peta Situasi Taktis**: Menampilkan posisi gabungan seluruh personel patroli, markas kepolisian jajaran, dan titik rawan | **LULUS** |
| 136 | **Laporan Analitik**: Mengagregasikan indeks kepuasan publik (IKM), peringkat operator, serta kinerja respon per Polsek | **LULUS** |

---

### L. Penjadwalan Piket & Sprint Tugas (`piket.actions.test.ts`)

| No | Skenario yang Diuji | Status |
|:---:|---|:---:|
| 137 | **Muat Jadwal Piket**: Mengambil jadwal piket harian SPKT, nomor Surat Perintah (Sprint), serta daftar anggota regu yang bertugas | **LULUS** |
| 138 | **Penanganan Tanggal Kosong**: Mengembalikan nilai null secara aman jika belum ada jadwal piket yang dimasukkan pada tanggal terkait | **LULUS** |

---

### M. Unggah Berkas & Bukti TKP (`upload.actions.test.ts`)

| No | Skenario yang Diuji | Status |
|:---:|---|:---:|
| 139 | **Validasi Berkas Fisik**: Menolak permintaan unggah jika berkas dokumen kesepakatan atau foto fisik tidak dilampirkan | **LULUS** |

---

### N. Ketahanan Otorisasi & RBAC Server Actions (`security-rbac.actions.test.ts`)
*Memastikan seluruh RPC Server Action dilindungi dari akses unauthenticated (OWASP API5) dan menegakkan prinsip Least Privilege lintas peran.*

| No | Skenario yang Diuji | Status |
|:---:|---|:---:|
| 140 | **Proteksi Data Master (createMasterRankAction)**: Menolak pemanggilan Server Action oleh pengguna tanpa sesi login (*401 Unauthorized*) | **LULUS** |
| 141 | **Proteksi Titik Rawan (createHotspotAction)**: Menolak manipulasi titik rawan operasi kepolisian oleh pihak publik/tanpa autentikasi | **LULUS** |
| 142 | **Proteksi Validasi Mutasi (validateOfficerLogbookAction)**: Menolak aksi pengesahan buku mutasi personel oleh pemanggil tanpa sesi aktif | **LULUS** |
| 143 | **Proteksi Intelijen Pawas (getPawasUnifiedDataAction)**: Mencegah kebocoran dashboard agregasi pengawasan kepolisian dari perayapan liar | **LULUS** |
| 144 | **Proteksi Roster Sprint Piket (getPiketLookupsAction)**: Mencegah scraping data penugasan sprint dan daftar regu dinas kepolisian | **LULUS** |
| 145 | **Least Privilege Master Rank**: Menolak peran `PERSONIL` saat mencoba memanipulasi data master pangkat (wewenang eksklusif `SUPERADMIN`) | **LULUS** |
| 146 | **Least Privilege Hotspot**: Menolak peran `LOGISTIK` saat mencoba mengubah status kerawanan titik rawan operasional kepolisian | **LULUS** |
| 147 | **Least Privilege Armada**: Menolak peran `OPERATOR` saat mencoba memodifikasi inventaris armada ranmor (wewenang eksklusif `LOGISTIK`) | **LULUS** |
| 148 | **Eksekusi Sah Superadmin**: Mengizinkan peran `SUPERADMIN` yang sah mengeksekusi penambahan data master pangkat kepolisian | **LULUS** |
| 149 | **Eksekusi Sah Pawas**: Mengizinkan peran `PAWAS` yang sah mengesahkan status validasi buku mutasi patroli lapangan (`VALID`) | **LULUS** |
| 150 | **Eksekusi Sah Personel**: Mengizinkan peran `PERSONIL` yang sah mencatat kegiatan patroli samapta ke buku mutasi kedinasan | **LULUS** |

---

## 5. 🔒 Utilitas Keamanan, Sanitasi & Batas Wilayah Hukum (Security & Utilities)

Lapisan ini memvalidasi aspek pertahanan siber berlapis (*defense-in-depth*), mitigasi DoS upload berkas, pembatasan laju request (*rate limiting*), normalisasi nomor kontak, dan pembatasan geografis kewilayahan.

### A. Normalisasi Nomor Telepon (`format-phone.test.ts`)

| No | Skenario yang Diuji | Status |
|:---:|---|:---:|
| 151 | **Konversi Format Lokal**: Mengubah awalan lokal `08` menjadi format internasional Indonesia `628` | **LULUS** |
| 152 | **Penanganan Format Baku**: Menjaga integritas nomor yang sudah berawalan `62` | **LULUS** |
| 153 | **Penanganan Tanda Plus**: Menormalkan nomor dengan awalan `+62` menjadi format numerik bersih | **LULUS** |
| 154 | **Pembersihan Simbol**: Menghilangkan tanda spasi, tanda hubung, titik, dan tanda kurung dari nomor telepon | **LULUS** |
| 155 | **Input Tidak Valid**: Mengembalikan string kosong jika data kontak bernilai null atau rusak | **LULUS** |
| 156 | **Format Panggilan Telepon**: Menghasilkan nomor numerik bersih untuk integrasi tautan panggilan dialer `tel:` | **LULUS** |
| 157 | **Proteksi Dialer**: Mengembalikan string kosong jika nomor telepon tidak dapat dihubungi | **LULUS** |

---

### B. Validasi Batas Wilayah Hukum Polres Pekalongan (`jurisdiction-boundary.test.ts`)
*Mencegah terjadinya salah penanganan laporan di luar wilayah yurisdiksi Polres Pekalongan.*

| No | Skenario yang Diuji | Status |
|:---:|---|:---:|
| 158 | **Ibukota Kajen (Pusat Pemerintahan)**: Terkonfirmasi valid berada di dalam batas yurisdiksi hukum Polres Pekalongan | **LULUS** |
| 159 | **Kecamatan Kedungwuni (Sektor Timur/Utara)**: Terkonfirmasi valid berada di dalam batas yurisdiksi hukum | **LULUS** |
| 160 | **Kecamatan Petungkriyono (Sektor Pegunungan Selatan)**: Terkonfirmasi valid berada di dalam batas yurisdiksi hukum | **LULUS** |
| 161 | **Penolakan Wilayah Luar (Semarang)**: Otomatis menolak titik koordinat Kota Semarang sebagai wilayah di luar wewenang hukum Polres | **LULUS** |
| 162 | **Penolakan Wilayah Luar (Jakarta)**: Otomatis menolak titik koordinat luar provinsi dan mengarahkan ke call center terkait | **LULUS** |

---

### C. Keamanan Token Sesi Pengguna (`session-token.test.ts`)

| No | Skenario yang Diuji | Status |
|:---:|---|:---:|
| 163 | **Panjang Token Sesi**: Menghasilkan token acak heksadesimal dengan panjang standar keamanan tinggi 64 karakter | **LULUS** |
| 164 | **Keacakan Mutlak**: Memastikan setiap pemanggilan menghasilkan token baru yang unik dan tidak berulang (*High Entropy*) | **LULUS** |
| 165 | **Penyimpanan Aman (Hash SHA-256)**: Menghasilkan hash SHA-256 sepanjang 64 karakter untuk disimpan ke basis data | **LULUS** |
| 166 | **Konsistensi Hash**: Memastikan token yang sama selalu menghasilkan nilai hash verifikasi yang konsisten | **LULUS** |
| 167 | **Diferensiasi Kriptografis**: Memastikan token yang berbeda menghasilkan nilai hash yang sepenuhnya berbeda (*Anti-Collision*) | **LULUS** |

---

### D. Pembatas Laju Permintaan Jendela Geser (`rate-limiter.test.ts`)
*Mencegah serangan brute-force, DDoS, dan scraping API menggunakan algoritma Sliding-Window Counter berkinerja tinggi.*

| No | Skenario yang Diuji | Status |
|:---:|---|:---:|
| 168 | **Kuota Sliding Window & Konsumsi Token**: Mengizinkan request dalam batas limit dan mengurangi sisa kuota secara presisi hingga habis | **LULUS** |
| 169 | **Pemeriksaan Kuota Non-Destruktif (checkRateLimit)**: Membaca status dan sisa kuota tanpa mengonsumsi jatah token | **LULUS** |
| 170 | **Reset Kuota Instan (resetRateLimit)**: Memulihkan kuota penuh saat dipicu oleh aksi sukses (seperti login kredensial valid) | **LULUS** |
| 171 | **Isolasi Kunci Kredensial Independen**: Memastikan limitasi per IP atau per pengguna tidak saling mengganggu hak akses entitas lain | **LULUS** |
| 172 | **Pemulihan Jendela Waktu Otomatis**: Mengizinkan permintaan baru secara mulus setelah sliding window waktu kedaluwarsa | **LULUS** |

---

### E. Mesin Keamanan Berkas & Anti-DoS 7 Lapis (`file-security.service.test.ts`)
*Menjamin 100% proteksi terhadap serangan Denial of Service (DoS), Magic Bytes Spoofing, Pixel Flood, Remote Code Execution (RCE), dan Path Traversal.*

| No | Skenario yang Diuji | Status |
|:---:|---|:---:|
| 173 | **Layer 1 (Pre-Body Content-Length)**: Menyetujui ukuran payload HTTP yang berada dalam batas wajar (< 5MB) | **LULUS** |
| 174 | **Layer 1 (Anti-DoS Early Drop)**: Menolak payload > 5MB di level header HTTP sebelum membaca body stream untuk mencegah lonjakan RAM server | **LULUS** |
| 175 | **Layer 1 (Validasi Header Malformasi)**: Menolak header Content-Length negatif, corrupt, atau manipulatif secara dini | **LULUS** |
| 176 | **Layer 4 (Magic Bytes JPEG)**: Memverifikasi tanda tangan biner otentik JPEG (`FF D8 FF`) secara akurat | **LULUS** |
| 177 | **Layer 4 (Magic Bytes PNG)**: Memverifikasi tanda tangan biner otentik PNG (`89 50 4E 47`) secara akurat | **LULUS** |
| 178 | **Layer 4 (Magic Bytes WEBP)**: Memverifikasi tanda tangan biner otentik WebP (`RIFF....WEBP`) secara akurat | **LULUS** |
| 179 | **Layer 4 (Anti-MIME Spoofing & Polyglot)**: Menolak berkas berbahaya seperti skrip PHP Web Shell atau teks yang disamarkan dengan ekstensi gambar | **LULUS** |
| 180 | **Layer 4 (Deteksi Buffer Rusak)**: Menolak buffer biner yang terpotong atau terlalu kecil untuk dianalisis tanda tangan kepalanya | **LULUS** |
| 181 | **Layer 5 & 6 (Dekompresi & Rekonstruksi Aman)**: Mendekompresi dan menyandikan ulang gambar menjadi buffer WebP bersih 512x512 piksel, melenyapkan seluruh metadata EXIF berbahaya | **LULUS** |
| 182 | **Layer 5 & 6 (Anti-Pixel Flood / Malformed)**: Menolak dan melempar eksepsi aman saat mendeteksi struktur biner gambar yang korup atau terfragmentasi | **LULUS** |
| 183 | **Layer 7 (Penamaan Kriptografis Unik)**: Menghasilkan nama berkas acak yang tidak dapat ditebak dengan ekstensi baku `.webp` | **LULUS** |
| 184 | **Layer 7 (Sanitasi Karakter Berbahaya)**: Membersihkan karakter traversal (`../`, `\`, `#`) dari identifier pengguna secara ketat | **LULUS** |
| 185 | **Layer 7 (Path Traversal Immunity)**: Memverifikasi jalur file fisik berada tepat di dalam direktori penyimpanan yang sah dan memblokir upaya lolos direktori (*Jailbreak*) | **LULUS** |

---

## 📊 Rekapitulasi Akhir Pengujian

| Komponen Arsitektur | Jumlah Berkas Uji | Total Skenario Diuji | Tingkat Kelulusan |
|---|:---:|:---:|:---:|
| **1. Domain Layer** (Entitas, Privasi, Restorative Justice, Notifikasi) | 4 berkas | 36 uji | **100% Lulus** |
| **2. Application Layer** (Use Cases, CAD, Logbook, GPS, Supervisi) | 7 berkas | 38 uji | **100% Lulus** |
| **3. Infrastructure Layer** (Prisma Repositories & Audit Geodetik) | 6 berkas | 26 uji | **100% Lulus** |
| **4. Server Actions Layer** (Next.js Actions, Kinerja, Hardware, RBAC) | 14 berkas | 50 uji | **100% Lulus** |
| **5. Security & Utilities** (HMAC, Session, Sanitasi, Batas Yurisdiksi, Rate Limiter, Anti-DoS) | 5 berkas | 35 uji | **100% Lulus** |
| **TOTAL KESELURUHAN** | **36 Berkas** | **185 Skenario** | **100% LULUS** |

> ✅ **Kesimpulan**: Seluruh alur data, otentikasi hardware, hak akses berjenjang kepolisian (RBAC), proteksi DoS berkas berlapis (*defense-in-depth*), pembatas laju request (*sliding-window rate limiter*), serta aturan privasi warga telah teruji secara komprehensif, stabil, dan siap beroperasi penuh (*Production Ready*).
