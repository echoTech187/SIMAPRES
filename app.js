
// ==============================================================================
// MASTER DATA: PANDUAN LENGKAP HALAMAN & FITUR BERBASIS SOP KEPOLISIAN PRESISI
// Mendeskripsikan secara mendalam: Landasan Hukum, Tujuan Modul, Rincian Fitur,
// Alur Langkah Operasional Demo Klien, dan Panduan Pertahanan Menjawab Klien (Q&A)
// ==============================================================================
const PAGE_GUIDES_DATA = {
  gateway: {
    title: "Pintu Masuk Terpadu & Pemisahan Akses (SSO Gateway)",
    icon: "🛡️",
    sopBadge: "Perkap No. 1/2019 & UU PDP No. 27/2022",
    sopTitle: "Pemisahan Keamanan Jalur Publik vs Jalur Taktis Kedinasan",
    sopDesc: "SOP pengamanan data operasional kepolisian dan kedaulatan data privasi warga negara. Sistem memisahkan secara total jaringan publik (Warga) dan jaringan dinas intelijen/taktis (Internal Polri) dengan prinsip Zero Trust Architecture.",
    purpose: `
      Halaman ini berfungsi sebagai <strong>Gerbang Akses Terenkripsi (Single Sign-On / SSO Gateway)</strong> yang memisahkan secara tegas antara jalur akses <strong>Masyarakat Umum (Publik)</strong> dan <strong>Personel Internal Kepolisian</strong>. Dengan pemisahan pintu gerbang ini, data rahasia penugasan, rute patroli, dan identitas petugas tidak pernah bocor ke ranah publik, sementara masyarakat mendapatkan jalur pelaporan mandiri yang cepat dan aman via verifikasi OTP (One-Time Password) tanpa password rumit.
    `,
    features: [
      {
        icon: "👥",
        name: "Pintu Masuk Portal Layanan Masyarakat",
        badge: "Akses Publik",
        badgeColor: "rgba(59,130,246,0.25)",
        badgeText: "#93C5FD",
        desc: "Jalur masuk khusus warga untuk melaporkan tindak kejahatan atau memantau perkembangan tiket pengaduan miliknya sendiri tanpa memerlukan password rumit, cukup dengan nomor HP dan kode OTP SMS/WhatsApp."
      },
      {
        icon: "👮‍♂️",
        name: "Pintu Masuk Kedinasan Polri (SSO Presisi)",
        badge: "Internal Dinas",
        badgeColor: "rgba(245,158,11,0.25)",
        badgeText: "#FCD34D",
        desc: "Otentikasi terpusat personel kepolisian berbasis Nomor Registrasi Pokok (NRP) dan kata sandi dinas dengan pemetaan wewenang bertingkat (Role-Based Access Control / RBAC)."
      },
      {
        icon: "⚡",
        name: "Quick Demo Role Switcher",
        badge: "Navigasi Cepat",
        badgeColor: "rgba(16,185,129,0.25)",
        badgeText: "#6EE7B7",
        desc: "Tombol jalan pintas di bagian bawah untuk mempermudah pengujian dan demo langsung di hadapan pimpinan/klien tanpa harus login-logout manual berulang kali."
      }
    ],
    steps: [
      {
        title: "1. Pemilihan Jalur Masuk",
        desc: "Jelaskan kepada klien bahwa sistem SIMAPRES 110 dirancang dengan standar keamanan tinggi yang membagi dua portal utama: Portal Warga dan Portal Kedinasan."
      },
      {
        title: "2. Masuk Sebagai Masyarakat",
        desc: "Klik tombol 'Masuk Portal Layanan Warga' atau klik simulasi nomor telepon Ibu Ratna / Bpk Hendra untuk mendemonstrasikan transparansi tracking laporan warga."
      },
      {
        title: "3. Masuk Sebagai Pejabat / Personel Polri",
        desc: "Pilih peran dinas yang ingin disimulasikan (misal: 'Kapolres', 'Kabag Ops', 'Operator 110', 'Kanit', atau 'Bripka Ahmad') untuk melihat tampilan operasional sesuai hierarki komando."
      }
    ],
    clientTips: `
      <strong>💡 Tips Menjawab Pertanyaan Klien / Kapolres:</strong><br>
      • <em>"Apakah masyarakat bisa mengintip laporan tetangga atau data pergerakan polisi?"</em><br>
      <strong>Jawaban Taktis:</strong> Sama sekali tidak bisa, Komandan. Arsitektur SIMAPRES 110 menerapkan <em>Row-Level Security (RLS)</em> dan isolasi data total. Warga hanya dapat mengakses laporan miliknya sendiri yang diverifikasi dengan nomor HP aktif. Data personel, rute patroli, dan koordinat GPS terkunci rapat di balik firewall jaringan dinas kepolisian.
    `
  },
  operator: {
    title: "Terminal Sentral SPKT & Operator Call Center 110",
    icon: "🎧",
    sopBadge: "Perkap No. 1 Tahun 2017 & SOP Sentral 110 Mabes Polri",
    sopTitle: "Standar Operasional Respon Cepat Pelayanan Pengaduan 110",
    sopDesc: "Tata cara penerimaan panggilan darurat, registrasi formulir laporan secara realtime, penentuan tingkat kedaruratan perkara, dan verifikasi validitas pelapor sebelum didisposisikan.",
    purpose: `
      Terminal Operator SPKT 110 adalah <strong>garda terdepan (first point of contact)</strong> penerimaan laporan masyarakat baik melalui panggilan darurat telepon 110 maupun aplikasi web publik. Tugas utama operator adalah menyaring panggilan masuk, mencatat TKP secara akurat, menentukan klasifikasi prioritas laporan (Merah/Kuning/Hijau), dan mendisposisikan tugas ke unit patroli lapangan terdekat dalam waktu kurang dari 3 menit sejak panggilan terhubung.
    `,
    features: [
      {
        icon: "📞",
        name: "Panel Panggilan Masuk 110 Realtime",
        badge: "Live Telephony",
        badgeColor: "rgba(239,68,68,0.25)",
        badgeText: "#FCA5A5",
        desc: "Menangkap nomor penelepon, identitas penelepon, estimasi lokasi pemancar BTS seluler, dan tombol jawab panggilan darurat."
      },
      {
        icon: "⚡",
        name: "Tombol Simulasi Panggilan 110",
        badge: "Demo Tool",
        badgeColor: "rgba(245,158,11,0.25)",
        badgeText: "#FCD34D",
        desc: "Memicu simulasi panggilan warga darurat (misal: laporan begal atau pencurian) secara instan untuk memperagakan alur respon kilat di hadapan penguji/klien."
      },
      {
        icon: "📋",
        name: "Formulir Registrasi & Validasi Laporan",
        badge: "Input Data",
        desc: "Pencatatan rincian kejadian, nama pelapor, nomor telepon, alamat TKP, koordinat GPS, serta pengelompokan klasifikasi tindak pidana/gangguan kamtibmas."
      },
      {
        icon: "🚀",
        name: "Tombol Disposisi Petugas (Smart Dispatch)",
        badge: "Action Command",
        badgeColor: "rgba(16,185,129,0.25)",
        badgeText: "#6EE7B7",
        desc: "Mengirimkan lembar penugasan digital secara instan ke layar handphone/e-Logbook personel patroli terdekat (misal: Bripka Ahmad Subagyo - R4 Samapta)."
      },
      {
        icon: "🔍",
        name: "Filter Status Laporan",
        badge: "Monitoring",
        desc: "Menyaring laporan berdasarkan status: Menunggu Disposisi, Petugas Meluncur, Sedang Ditangani, dan Selesai."
      }
    ],
    steps: [
      {
        title: "1. Menerima Laporan / Simulasi Panggilan",
        desc: "Klik tombol '⚡ Laporan 110 Baru' di pojok kanan atas atau tombol 'Simulasi Panggilan Masuk'."
      },
      {
        title: "2. Verifikasi Data Laporan",
        desc: "Periksa kartu laporan yang muncul di antrian, pastikan identitas pelapor dan koordinat TKP sudah tercatat jelas."
      },
      {
        title: "3. Disposisi Penugasan ke Personel Terdekat",
        desc: "Klik tombol 'Disposisi Petugas' pada laporan, pilih armada patroli terdekat (Bripka Ahmad), lalu klik 'Kirim Disposisi'. Tunjukkan bahwa status laporan langsung berubah menjadi 'Ditugaskan ke Bripka Ahmad'."
      },
      {
        title: "4. Koordinasi Antar Fungsi",
        desc: "Tunjukkan bahwa data yang didisposisikan otomatis tampil di layar Bripka Ahmad (Personel Lapangan) dan terpantau di layar Kapolres dan Kabag Ops."
      }
    ],
    clientTips: `
      <strong>💡 Tips Menjawab Pertanyaan Klien / Kapolres:</strong><br>
      • <em>"Bagaimana cara operator mengetahui petugas mana yang paling dekat dengan lokasi kejadian?"</em><br>
      <strong>Jawaban Taktis:</strong> Sistem SIMAPRES 110 terintegrasi dengan <em>Automatic Vehicle Location (AVL) GPS</em>. Saat operator mengklik Disposisi, sistem otomatis mengurutkan armada patroli yang aktif berdasarkan jarak terdekat (radius kilometer) dari titik koordinat TKP pelapor.
    `
  },
  pimpinan: {
    title: "Command Center Kapolres Metro (Komando Puncak Eksekutif)",
    icon: "🏢",
    sopBadge: "Perkap No. 7/2022 & Doktrin Polri PRESISI",
    sopTitle: "Supervisi Eksekutif Komando Tertinggi & Hak Veto Kebijakan",
    sopDesc: "Pengawasan menyeluruh terhadap respon cepat kamtibmas, efektivitas gelar operasional jajaran, evaluasi indeks kepuasan publik, serta hak intervensi langsung pimpinan.",
    purpose: `
      Halaman Command Center Kapolres adalah <strong>ruang kendali eksekutif pimpinan tertinggi</strong> di tingkat Polres. Halaman ini dirancang bukan untuk entri data teknis harian, melainkan untuk <strong>Supervisi Strategis (Executive Oversight)</strong>: memantau SLA respon cepat 110 (< 15 menit), mendeteksi laporan macet (Overdue Alert), memantau sebaran armada di peta taktis satelit, serta menggunakan hak veto untuk mengambil alih perkara atensi pimpinan.
    `,
    features: [
      {
        icon: "🚨",
        name: "Overdue / Desk Alert Banner (Anti-Macet)",
        badge: "Warning System",
        badgeColor: "rgba(239,68,68,0.25)",
        badgeText: "#FCA5A5",
        desc: "Peringatan visual merah mencolok jika terdapat laporan warga yang belum ditangani atau melebihi batas waktu toleransi tanggap darurat (30 menit)."
      },
      {
        icon: "📊",
        name: "Ringkasan Eksekutif 4 Kartu KPI Utama",
        badge: "KPI Dashboard",
        badgeColor: "rgba(245,158,11,0.25)",
        badgeText: "#FCD34D",
        desc: "Total Laporan 110 Hari Ini, Rata-rata Response Time (8.2 Menit), Indeks Kepuasan Masyarakat (4.8 / 5.0), dan Armada Lapangan Aktif."
      },
      {
        icon: "🗺️",
        name: "Live Tactical GIS Map (Leaflet.js + CartoDB Dark Matter)",
        badge: "GIS Taktis",
        badgeColor: "rgba(16,185,129,0.25)",
        badgeText: "#6EE7B7",
        desc: "Peta interaktif nyata dengan layer marker dinamis: Mobil Patroli Aktif, Rute Pergerakan, Pos Pantau, dan Titik Rawan Kriminalitas. Dapat digeser, dizoom, dan diklik untuk melihat detail personil."
      },
      {
        icon: "📑",
        name: "Tab 1: Monitoring Aduan Realtime",
        badge: "Tab View",
        desc: "Tabel pengawasan seluruh aduan dari Polsek jajaran dengan status penyelesaian, nama petugas penangan, dan tombol tinjauan bukti."
      },
      {
        icon: "⚖️",
        name: "Tab 2: Audit Akuntabilitas Jajaran",
        badge: "Tab View",
        desc: "Statistik persentase kepatuhan e-Logbook per Polsek/Satuan Fungsi untuk bahan evaluasi rapat anev mingguan pimpinan."
      },
      {
        icon: "⚙️",
        name: "Tab 3: Konfigurasi Titik Rawan & Pos Pantau",
        badge: "Tab View",
        desc: "Pengaturan kebijakan daerah rawan dan penentuan pos pantau strategis yang berlaku di seluruh wilayah hukum Polres."
      }
    ],
    steps: [
      {
        title: "1. Pemantauan Indikator Kinerja Puncak (KPI)",
        desc: "Buka halaman Pimpinan, tunjukkan 4 kartu KPI yang memperlihatkan performa kesatuan secara kuantitatif dan transparan."
      },
      {
        title: "2. Eksplorasi Peta Taktis Interaktif Realtime",
        desc: "Klik salah satu marker mobil patroli di peta untuk melihat nama personil (Bripka Ahmad), status dinas, dan nomor kontak. Tunjukkan pula marker merah titik rawan begal/tawuran."
      },
      {
        title: "3. Evaluasi Kepatuhan Jajaran di Tab Audit",
        desc: "Pindah ke Tab 'Audit Akuntabilitas' untuk menunjukkan data komparasi kinerja antar Polsek (misal Polsek Cempaka Raya vs Polsek Barat)."
      },
      {
        title: "4. Simulasi Respon Cepat 110",
        desc: "Klik tombol '⚡ Laporan 110 Baru' di header atas, dan tunjukkan bagaimana angka KPI dan peta langsung merespon secara dinamis."
      }
    ],
    clientTips: `
      <strong>💡 Tips Menjawab Pertanyaan Klien / Kapolres:</strong><br>
      • <em>"Apa bedanya halaman Kapolres dengan Kabag Ops?"</em><br>
      <strong>Jawaban Taktis:</strong> Kapolres memegang kendali <em>Strategic Command & Public Accountability</em> (mengawasi seluruh jajaran, evaluasi kepatuhan Polsek, dan kepuasan publik). Sedangkan Kabag Ops memegang <em>Tactical & Operational Planning</em> (merancang rute beat patroli harian, plotting pos pantau personil, dan menerbitkan Sprint tugas).
    `
  },
  kabagops: {
    title: "Pusat Pengendali Operasi Taktis & Rekayasa Rute (Kabag Ops)",
    icon: "🗺️",
    sopBadge: "Perkap No. 2 Tahun 2021 tentang SOTK Polres",
    sopTitle: "Manajemen Perencanaan Operasi & Gelar Pasukan Taktis",
    sopDesc: "Wewenang Bag Ops dalam memetakan titik kerawanan kamtibmas, mengatur rute patroli beat terpadu, menetapkan checkpoint, serta menerbitkan Surat Perintah Tugas (Sprint).",
    purpose: `
      Halaman Kabag Ops adalah <strong>dapur taktis pergelaran pasukan kepolisian</strong>. Di sinilah strategi pencegahan kejahatan dirumuskan secara presisi. Kabag Ops memantau peta kriminalitas (Crime Mapping), menentukan rute patroli pencegahan, mengatur jadwal pos pantau, dan menerbitkan Surat Perintah Tugas (Sprint) resmi baik untuk regu perorangan maupun operasi gabungan skala besar.
    `,
    features: [
      {
        icon: "🛰️",
        name: "Monitoring Live AVL GPS & Smart Nearest Unit Dispatch",
        badge: "Fitur Presisi 110",
        badgeColor: "rgba(56,189,248,0.25)",
        badgeText: "#38BDF8",
        desc: "Peta taktis mendeteksi posisi GPS realtime seluruh armada patroli (Samapta, Perintis Presisi, Patwal Lantas, Bhabinkamtibmas). Saat ada aduan darurat 110 masuk, sistem menghitung jarak terdekat secara otomatis dan memungkinkan Kabag Ops menugaskan personel terdekat dengan 1 klik."
      },
      {
        icon: "🎛️",
        name: "Toggle Mode Dwi-Fungsi (Opsi B: Mode Sektor vs Mode Gabungan)",
        badge: "Fitur Unggulan",
        badgeColor: "rgba(245,158,11,0.25)",
        badgeText: "#FCD34D",
        desc: "Memungkinkan Kabag Ops beralih seketika antara: 1) Mode Sektor / Per-Regu (memfilter pos pantau & checkpoint spesifik per armada/personil seperti Bripka Ahmad), atau 2) Mode Operasi Gabungan (memantau seluruh armada serentak)."
      },
      {
        icon: "🗺️",
        name: "Tactical GIS Operational Map dengan Layer Taktis",
        badge: "GIS Operasional",
        desc: "Peta operasi interaktif dengan layer visual: Polyline Rute Patroli, Checkpoint Pengawasan, Lingkaran Buffer Titik Rawan, dan Pos Pantau Statis."
      },
      {
        icon: "🎯",
        name: "Daftar Titik Rawan Kejahatan (Hotspots C3)",
        badge: "Data Intelijen",
        desc: "Kompilasi zona merah rawan Curat, Curas, Curanmor, Tawuran, dan Balap Liar lengkap dengan jam kerawanan maksimal dan rekomendasi patroli."
      },
      {
        icon: "📍",
        name: "Manajemen Pos Pantau & Checkpoint Patroli",
        badge: "Plotting Tugas",
        desc: "Daftar titik singgah wajib personel patroli dengan informasi radius toleransi geofence (50 meter) dan waktu stasioner minimal (15 menit)."
      },
      {
        icon: "📝",
        name: "Penerbitan Surat Perintah Tugas (Sprint Taktis)",
        badge: "Legalitas Dinas",
        badgeColor: "rgba(16,185,129,0.25)",
        badgeText: "#6EE7B7",
        desc: "Formulir penerbitan Sprint resmi dengan nomor sprint kedinasan, penanggung jawab operasi, daftar unit armada yang dilibatkan, dan masa berlaku tugas."
      }
    ],
    steps: [
      {
        title: "1. Tinjau Peta Taktis dan Hotspot Kriminalitas",
        desc: "Buka halaman Kabag Ops, perhatikan marker dan lingkaran merah yang menandakan titik rawan kejahatan di wilayah kota."
      },
      {
        title: "2. Demonstrasi Fitur Dwi-Fungsi (Opsi B)",
        desc: "Klik tombol toggle 'Mode Sektor (Per-Regu)' dan pilih dropdown 'Bripka Ahmad (Samapta)' untuk melihat pos pantau khusus personil tersebut. Kemudian klik tombol 'Mode Operasi Gabungan' untuk menampilkan seluruh pos pantau kesatuan."
      },
      {
        title: "3. Tambah Titik Rawan atau Pos Pantau Baru",
        desc: "Klik tombol '➕ Tambah Titik Rawan' atau '➕ Tambah Checkpoint', masukkan nama lokasi dan radius, lalu simpan. Tunjukkan bahwa data langsung terupdate di tabel dan peta."
      },
      {
        title: "4. Terbitkan Sprint Operasi Baru",
        desc: "Klik tombol '➕ Terbitkan Sprint Tugas Baru', isi nama operasi (misal: 'Operasi Cipta Kondisi Akhir Pekan'), pilih armada pelaksana, lalu klik 'Sahkan & Terbitkan Sprint'."
      }
    ],
    clientTips: `
      <strong>💡 Tips Menjawab Pertanyaan Klien / Kapolres:</strong><br>
      • <em>"Kenapa di pos pantau ada pilihan per-anggota dan ada pilihan seluruh anggota?"</em><br>
      <strong>Jawaban Taktis:</strong> Karena dalam doktrin kepolisian ada dua jenis pergelaran: 1) <em>Patroli Rutin Sektor (Beat)</em> di mana tiap regu memiliki titik singgah unik agar tidak bertumpuk di satu tempat, dan 2) <em>Operasi Khusus Skala Besar (KRYD / Razia Gabungan)</em> di mana seluruh unit lintas fungsi disatukan pada pos pantau bersama. Sistem SIMAPRES 110 mendukung kedua skenario tersebut dengan sempurna melalui Mode Dwi-Fungsi.
    `
  },
  kapolsek: {
    title: "Portal Komando Wilayah Sektor (Kapolsek Cempaka Raya)",
    icon: "🏛️",
    sopBadge: "Perkap No. 2/2021 & Jukrah Kamtibmas Wilayah Polsek",
    sopTitle: "Pengawasan Kamtibmas Sektor & Restorative Justice",
    sopDesc: "Tata kelola keamanan tingkat kecamatan, koordinasi tiga pilar (Bhabinkamtibmas, Babinsa, Lurah), pemantauan aduan 110 sektor, dan penyelesaian sengketa musyawarah damai.",
    purpose: `
      Halaman Kapolsek didedikasikan untuk <strong>Komandan Kewilayahan Sektor (Kapolsek)</strong>. Ruang lingkup halaman ini terfokus pada wilayah hukum Polsek tertentu (misal Polsek Cempaka Raya). Fokusnya adalah memastikan laporan 110 di kecamatannya dituntaskan oleh piket fungsi, mengawasi giat silaturahmi Door-to-Door System (DDS) oleh Bhabinkamtibmas, serta mengarsip mediasi damai (Problem Solving / Restorative Justice).
    `,
    features: [
      {
        icon: "🏛️",
        name: "KPI Kinerja Sektor Wilayah Polsek",
        badge: "Statistik Sektor",
        desc: "Total Aduan Warga Wilayah Sektor, Respon Time Sektor (7.8 Menit), Giat Problem Solving Terselesaikan, dan Jumlah Bhabinkamtibmas Aktif."
      },
      {
        icon: "📋",
        name: "Tabel Laporan 110 Wilayah Hukum Sektor",
        badge: "Monitoring Khusus",
        desc: "Menampilkan hanya laporan yang terjadi di wilayah Polsek Cempaka Raya lengkap dengan status penanganan dan personel yang menangani."
      },
      {
        icon: "🤝",
        name: "Monitoring Sambang DDS Bhabinkamtibmas",
        badge: "Polmas / Presisi",
        desc: "Rekapitulasi kegiatan sambang ke rumah warga, tokoh agama, sekolah, dan poskamling sebagai deteksi dini bibit konflik sosial."
      },
      {
        icon: "⚖️",
        name: "Register Problem Solving (Keadilan Restoratif)",
        badge: "Musyawarah Warga",
        badgeColor: "rgba(16,185,129,0.25)",
        badgeText: "#6EE7B7",
        desc: "Pencatatan mediasi damai kasus ringan antar warga tingkat desa/kelurahan dengan penandatanganan surat kesepakatan bersama tanpa proses pidana pengadilan."
      }
    ],
    steps: [
      {
        title: "1. Evaluasi Kamtibmas Kecamatan",
        desc: "Tunjukkan kepada klien bahwa Kapolsek hanya memantau wilayah hukumnya sendiri sesuai yurisdiksi kepolisian."
      },
      {
        title: "2. Tinjau Respon Pengaduan 110 Sektor",
        desc: "Periksa tabel aduan sektor, lihat status tindak lanjut petugas di lapangan."
      },
      {
        title: "3. Tinjau Laporan Bhabinkamtibmas & Problem Solving",
        desc: "Buka panel Problem Solving untuk menunjukkan keberhasilan penyelesaian sengketa warga secara kekeluargaan yang menaikkan citra positif Polri."
      }
    ],
    clientTips: `
      <strong>💡 Tips Menjawab Pertanyaan Klien / Kapolres:</strong><br>
      • <em>"Apakah Kapolsek bisa mengedit laporan dari Polsek lain?"</em><br>
      <strong>Jawaban Taktis:</strong> Tidak bisa, Komandan. Hak akses dibatasi ketat berbasis kode wilayah Polsek. Hal ini menjaga akuntabilitas komando teritorial sehingga setiap Kapolsek bertanggung jawab penuh atas keamanan di wilayahnya masing-masing.
    `
  },
  kanit: {
    title: "Portal Supervisi Kanit / Perwira Pengawas (Pawas)",
    icon: "👮‍♂️",
    sopBadge: "Perkap No. 1/2017 & Jukmin Pengawasan Melekat",
    sopTitle: "Verifikasi Otentisitas e-Logbook & Pengesahan Kinerja Regu",
    sopDesc: "Kewajiban perwira pengendali lapangan untuk meneliti kebenaran bukti geotagging, kesesuaian waktu dinas, serta menyetujui atau menolak laporan kegiatan anggota.",
    purpose: `
      Halaman Kanit / Pawas adalah <strong>gerbang verifikasi mutu laporan lapangan</strong>. Anggota di lapangan (Bripka Ahmad) tidak bisa sembarangan mengklaim tugas selesai tanpa persetujuan perwira pengawas. Kanit meneliti foto bukti berkoordinat GPS, memeriksa catatan kegiatan, lalu memberikan keputusan dinas: <strong>Setujui (Approve)</strong> atau <strong>Tolak / Revisi (Reject)</strong> dengan feedback tertulis.
    `,
    features: [
      {
        icon: "📥",
        name: "Antrean e-Logbook Menunggu Verifikasi",
        badge: "Pending Approval",
        badgeColor: "rgba(245,158,11,0.25)",
        badgeText: "#FCD34D",
        desc: "Daftar berkas laporan kegiatan patroli, sambang, dan pengamanan objek vital yang baru dikirim oleh anggota lapangan dan menunggu pengesahan perwira."
      },
      {
        icon: "🔍",
        name: "Modal Pemeriksaan Bukti Foto Geotagging",
        badge: "Verifikasi Bukti",
        desc: "Menampilkan foto dokumentasi yang dilengkapi watermark koordinat GPS nyata, tanggal dan jam pengambilan, serta catatan kronologi kegiatan."
      },
      {
        icon: "✅",
        name: "Tombol Pengesahan (Setujui Logbook)",
        badge: "Approval",
        badgeColor: "rgba(16,185,129,0.25)",
        badgeText: "#6EE7B7",
        desc: "Mengesahkan laporan kegiatan anggota menjadi laporan dinas sah yang masuk ke penilaian Sistem Manajemen Kinerja (SMK) Online anggota."
      },
      {
        icon: "❌",
        name: "Tombol Penolakan (Minta Revisi)",
        badge: "Rejection",
        badgeColor: "rgba(239,68,68,0.25)",
        badgeText: "#FCA5A5",
        desc: "Mengembalikan berkas laporan ke anggota jika foto tidak sesuai TKP atau keterangan tidak lengkap disertai catatan instruksi perbaikan."
      }
    ],
    steps: [
      {
        title: "1. Periksa Daftar Antrean Logbook",
        desc: "Buka halaman Kanit/Pawas, perhatikan daftar kegiatan anggota yang berstatus 'Menunggu Verifikasi'."
      },
      {
        title: "2. Buka Lembar Verifikasi Detail",
        desc: "Klik tombol 'Verifikasi' pada salah satu laporan anggota (misal: Bripka Ahmad - Patroli Dialogis Bank BRI)."
      },
      {
        title: "3. Validasi Foto & Koordinat GPS",
        desc: "Periksa foto dokumentasi kegiatan dan kesesuaian koordinat GPS dengan titik penugasan."
      },
      {
        title: "4. Berikan Keputusan Persetujuan",
        desc: "Klik tombol 'Setujui Logbook'. Tunjukkan bahwa status laporan langsung berubah menjadi 'Disetujui Kanit' dan notifikasi pengesahan terkirim ke anggota."
      }
    ],
    clientTips: `
      <strong>💡 Tips Menjawab Pertanyaan Klien / Kapolres:</strong><br>
      • <em>"Bagaimana jika anggota mengisi logbook fiktif tanpa turun ke lapangan?"</em><br>
      <strong>Jawaban Taktis:</strong> Sistem mewajibkan pengambilan foto langsung melalui kamera dengan validasi koordinat GPS realtime. Jika foto diambil di luar radius toleransi lokasi sasaran, sistem otomatis menandai laporan tersebut dengan peringatan anomali berwarna kuning/merah agar Kanit menolak laporan tersebut.
    `
  },
  propam: {
    title: "Terminal Pengawasan Disiplin & Sidak Integritas GPS (Si Propam)",
    icon: "🛡️",
    sopBadge: "Perkap No. 2 Tahun 2022 tentang Pengawasan Melekat (Waskat)",
    sopTitle: "Penegakan Disiplin, Kode Etik Profesi & Audit Anomali GPS",
    sopDesc: "SOP investigasi dugaan pelanggaran disiplin personel, deteksi dini penyimpangan rute patroli, pemanggilan klarifikasi, dan register berkas BAP Propam.",
    purpose: `
      Halaman Si Propam / Provos adalah <strong>benteng integritas dan disiplin internal kepolisian</strong>. Sistem otomatis mendeteksi anomali GPS: personel yang mematikan GPS saat jam dinas, personel yang berdiam di warung kopi/rumah lebih dari 45 menit saat jam patroli, atau personel yang melompat koordinat (GPS Spoofing). Propam dapat menerbitkan panggilan sidang disiplin dan mencatat register BAP resmi.
    `,
    features: [
      {
        icon: "⚠️",
        name: "Tabel Deteksi Dini Anomali GPS & Geofence",
        badge: "Smart Audit Alert",
        badgeColor: "rgba(239,68,68,0.25)",
        badgeText: "#FCA5A5",
        desc: "Mendeteksi secara cerdas deviasi rute, posisi di luar geofence penugasan, atau ketidaksesuaian antara lokasi GPS dan lokasi foto kegiatan."
      },
      {
        icon: "📞",
        name: "Tombol Panggil Klarifikasi / Nota Teguran",
        badge: "Tindakan Disiplin",
        desc: "Mengirimkan notifikasi teguran resmi ke nomor handphone anggota untuk menghadap Provos dalam waktu 1x24 jam."
      },
      {
        icon: "📋",
        name: "Register Berita Acara Pemeriksaan (BAP) Disiplin",
        badge: "Legal Record",
        badgeColor: "rgba(245,158,11,0.25)",
        badgeText: "#FCD34D",
        desc: "Formulir pemberkasan BAP resmi pelanggaran etika/disiplin lengkap dengan nomor register perkara, nama terperiksa, dan pasal pelanggaran disiplin Polri."
      },
      {
        icon: "📈",
        name: "Indeks Kepatuhan Etika Per Satuan Fungsi",
        badge: "Analitik",
        desc: "Grafik komparasi kedisiplinan anggota Sat Samapta, Sat Lantas, Sat Reskrim, dan jajaran Polsek untuk laporan bulanan ke Propam Polda."
      }
    ],
    steps: [
      {
        title: "1. Pantau Log Peringatan Anomali",
        desc: "Masuk ke halaman Si Propam, perhatikan peringatan otomatis anggota yang terdeteksi berada di luar jalur penugasan."
      },
      {
        title: "2. Tinjau Kasus & Bukti Pelanggaran",
        desc: "Klik tombol 'Investigasi' pada kasus terdeteksi untuk memeriksa riwayat pergerakan GPS dan foto yang bersangkutan."
      },
      {
        title: "3. Terbitkan BAP Pelanggaran Disiplin",
        desc: "Klik tombol '➕ Buat BAP Baru', masukkan identitas terperiksa, jenis dugaan pelanggaran, lalu klik 'Simpan BAP'. Tunjukkan bahwa data tersimpan di register resmi."
      }
    ],
    clientTips: `
      <strong>💡 Tips Menjawab Pertanyaan Klien / Kapolres:</strong><br>
      • <em>"Apakah modul Propam ini bisa dihapus datanya jika ada intervensi oknum?"</em><br>
      <strong>Jawaban Taktis:</strong> Tidak bisa, Komandan. Log audit sistem bersifat <em>Write-Once-Read-Many (Immutable Audit Trail)</em> yang dicatat ke database terenkripsi dengan digital signature. Segala bentuk anomali tercatat permanen untuk menjamin transparansi Presisi.
    `
  },
  personil: {
    title: "Portal e-Logbook & Penugasan Lapangan (Bripka Ahmad Subagyo)",
    icon: "👮‍♂️",
    sopBadge: "Juknis Korsabhara Baharkam Polri & SOP Penugasan 110",
    sopTitle: "Penerimaan Tugas Cepat & Pelaporan Kegiatan Berbasis GPS",
    sopDesc: "Tata cara penerimaan tugas darurat 110, pembaruan status pergerakan menuju TKP, serta pelaporan e-Logbook kegiatan rutin dilengkapi foto geotagging.",
    purpose: `
      Halaman Personil Lapangan adalah <strong>perangkat kerja operasional anggota patroli (Bripka Ahmad)</strong>. Di halaman ini, anggota menerima instruksi panggilan darurat 110 dari operator, memperbarui status kesiapan (Terima Tugas -> Meluncur -> Tiba di TKP -> Selesai), mengunggah foto dokumentasi penanganan, dan melaporkan kegiatan rutin dinas harian (e-Logbook Presisi).
    `,
    features: [
      {
        icon: "🚀",
        name: "Kartu Penugasan Aktif (Dispatch 110)",
        badge: "Tugas Operasi",
        badgeColor: "rgba(239,68,68,0.25)",
        badgeText: "#FCA5A5",
        desc: "Menampilkan rincian laporan darurat 110 yang ditugaskan kepada anggota: nama pelapor, kontak telepon, alamat TKP, dan waktu penugasan."
      },
      {
        icon: "🔄",
        name: "Alur 4 Tombol Status Penugasan Realtime",
        badge: "Tracking Status",
        badgeColor: "rgba(16,185,129,0.25)",
        badgeText: "#6EE7B7",
        desc: "Tombol dinamis yang berubah sesuai progres: 1) Terima Tugas, 2) Berangkat Menuju TKP, 3) Tiba di TKP (Unggah Bukti TPTKP), dan 4) Selesai Penanganan."
      },
      {
        icon: "📸",
        name: "Form Unggah e-Logbook dengan Geotagging Otomatis",
        badge: "Input e-Logbook",
        desc: "Formulir pelaporan kegiatan mandiri (patroli sambang, strong point, razia) dilengkapi simulasi kamera berstempel koordinat GPS dan waktu nyata."
      },
      {
        icon: "📜",
        name: "Riwayat Logbook Pribadi & Status Persetujuan",
        badge: "Catatan Kinerja",
        desc: "Tabel rekaman kegiatan yang telah dikirimkan, menunjukkan apakah laporan masih menunggu verifikasi Kanit atau sudah disetujui resmi."
      }
    ],
    steps: [
      {
        title: "1. Menerima Tugas Laporan 110",
        desc: "Periksa kartu 'Tugas Operasi Aktif' yang masuk dari Operator 110."
      },
      {
        title: "2. Update Status Perjalanan Menuju TKP",
        desc: "Klik tombol 'Berangkat Menuju TKP' dan unggah bukti keberangkatan. Tunjukkan bahwa status langsung terupdate di layar warga dan Kapolres."
      },
      {
        title: "3. Update Tiba di TKP & Selesaikan Penanganan",
        desc: "Klik tombol 'Tiba di TKP' (unggah bukti olah TKP), lalu klik 'Selesaikan Penanganan' dengan mencatat ringkasan tindakan kepolisian."
      },
      {
        title: "4. Buat e-Logbook Kegiatan Mandiri",
        desc: "Klik tombol '➕ Buat Laporan e-Logbook Baru', pilih jenis giat (misal: Patroli Sambang Toko Emas), masukkan catatan, lalu klik 'Kirim Laporan'."
      }
    ],
    clientTips: `
      <strong>💡 Tips Menjawab Pertanyaan Klien / Kapolres:</strong><br>
      • <em>"Apakah anggota bisa mengakali waktu laporan atau memasukkan foto kemarin?"</em><br>
      <strong>Jawaban Taktis:</strong> Sistem mengunci waktu pelaporan langsung dari <em>Network Time Protocol (NTP)</em> server dinas kepolisian dan tidak menggunakan jam handphone anggota. Foto wajib diambil melalui viewfinder kamera aplikasi secara langsung, bukan dari galeri file lama.
    `
  },
  masyarakat: {
    title: "Web Portal Layanan Pengaduan & Tracking Warga 110",
    icon: "👥",
    sopBadge: "UU No. 25/2009 tentang Pelayanan Publik & Prinsip Presisi",
    sopTitle: "Transparansi Pelayanan Publik & Perlindungan Privasi Pelapor",
    sopDesc: "Hak masyarakat untuk memantau tahapan perkembangan penanganan laporan kepolisian secara real-time, transparan, dan terjamin kerahasiaan datanya.",
    purpose: `
      Web Portal Masyarakat adalah <strong>wajah pelayanan publik Polri Presisi</strong>. Portal ini memungkinkan masyarakat membuat laporan pengaduan secara mandiri melalui web peramban tanpa harus menginstal aplikasi berat di handphone, memantau tahapan penanganan polisi langkah demi langkah secara transparan (seperti tracking kurir logistik), melihat foto bukti penyelesaian, serta memberikan penilaian rating kepuasan layanan 110.
    `,
    features: [
      {
        icon: "📱",
        name: "Login OTP Cepat Tanpa Password",
        badge: "Akses Praktis",
        badgeColor: "rgba(59,130,246,0.25)",
        badgeText: "#93C5FD",
        desc: "Warga cukup memasukkan nomor handphone untuk menerima kode OTP via SMS atau WhatsApp tanpa perlu mengingat kata sandi rumit."
      },
      {
        icon: "📝",
        name: "Form Buat Pengaduan Darurat Baru",
        badge: "Pelaporan Publik",
        badgeColor: "rgba(16,185,129,0.25)",
        badgeText: "#6EE7B7",
        desc: "Formulir interaktif untuk membuat laporan baru lengkap dengan kategori kejadian, uraian peristiwa, alamat/koordinat TKP, dan lampiran foto bukti."
      },
      {
        icon: "⏳",
        name: "Interactive Progress Timeline Tracker",
        badge: "Transparansi",
        badgeColor: "rgba(245,158,11,0.25)",
        badgeText: "#FCD34D",
        desc: "Garis waktu 4 tahapan penanganan: 1) Laporan Diterima SPKT, 2) Petugas Ditugaskan, 3) Petugas Tiba di TKP, dan 4) Penanganan Selesai."
      },
      {
        icon: "🖼️",
        name: "Galeri Bukti Penanganan Petugas",
        badge: "Bukti Nyata",
        desc: "Masyarakat dapat melihat langsung foto bukti tindakan yang diunggah polisi di lokasi kejadian sehingga tidak ada lagi kesan 'laporan diabaikan'."
      },
      {
        icon: "⭐",
        name: "Rating & Ulasan Kepuasan Layanan (Indeks Kepuasan)",
        badge: "Feedback Publik",
        desc: "Setelah laporan selesai, warga dapat memberikan bintang 1-5 dan testimoni kepuasan yang langsung masuk ke penilaian indeks kinerja Kapolres."
      }
    ],
    steps: [
      {
        title: "1. Masuk ke Portal Warga",
        desc: "Buka portal warga, gunakan simulasi akun terdaftar (Ibu Ratna Susanti / Bpk Hendra Wijaya) untuk melihat daftar laporan aktif."
      },
      {
        title: "2. Pantau Garis Waktu Penanganan Laporan",
        desc: "Klik salah satu kartu laporan, perhatikan timeline berwarna hijau yang menunjukkan setiap tahapan penanganan oleh polisi secara transparan."
      },
      {
        title: "3. Lihat Bukti Dokumentasi di TKP",
        desc: "Klik foto bukti penanganan petugas untuk membuktikan bahwa polisi benar-benar mendatangi lokasi dan menyelesaikan masalah."
      },
      {
        title: "4. Berikan Rating Kepuasan Pelayanan",
        desc: "Klik tombol bintang rating (1-5) dan masukkan ulasan kepuasan masyarakat atas kecepatan respon jajaran kepolisian."
      }
    ],
    clientTips: `
      <strong>💡 Tips Menjawab Pertanyaan Klien / Kapolres:</strong><br>
      • <em>"Kenapa masyarakat tidak dibuatkan aplikasi Android/iOS khusus saja?"</em><br>
      <strong>Jawaban Taktis:</strong> Karena saat berada dalam situasi darurat, warga butuh kecepatan instan tanpa repot membuka App Store/Play Store, mendownload file puluhan megabyte, dan menghafal password akun. Melalui Web Portal Responsif SIMAPRES 110, warga cukup mengklik link via browser atau SMS/WA dan seketika bisa melapor serta melacak laporannya dalam hitungan detik.
    `
  },
  sitik: {
    title: "Portal Administrasi Super Admin TIK (Seksi TIK Polres)",
    icon: "💻",
    sopBadge: "Peraturan Kadiv TIK Polri & Standar Manajemen Keamanan ISO 27001",
    sopTitle: "Manajemen Akun Terpusat, Hak Akses RBAC & Audit Trail",
    sopDesc: "Tata kelola data induk personel, pengaturan peran dan hak akses sistem, konfigurasi integrasi gateway pihak ketiga, serta pengawasan integritas database.",
    purpose: `
      Halaman Si TIK adalah <strong>ruang mesin teknis dan tata kelola keamanan sistem</strong>. Dikelola oleh personel Seksi TIK Polres (Aipda Pratama, S.Kom.) untuk mengelola akun pengguna kepolisian, mereset password kedinasan, memastikan pembatasan wewenang (Role-Based Access Control) berjalan tanpa celah, serta memantau System Audit Log untuk mencegah sabotase atau penyalahgunaan akun dinas.
    `,
    features: [
      {
        icon: "👥",
        name: "Manajemen Akun Personel & Jabatan",
        badge: "User Management",
        desc: "Daftar seluruh akun aktif di jajaran Polres Metro (Kapolres, Kabag Ops, Kapolsek, Operator, Kanit, Personil, Propam) lengkap dengan NRP dan pangkat."
      },
      {
        icon: "➕",
        name: "Form Pendaftaran Anggota Baru",
        badge: "Registrasi Akun",
        badgeColor: "rgba(16,185,129,0.25)",
        badgeText: "#6EE7B7",
        desc: "Formulir pendaftaran personil baru dengan validasi keaslian NRP, penetapan satuan kerja (Satker), dan pembagian wewenang peran (Role)."
      },
      {
        icon: "🛡️",
        name: "Live System Audit Trail (Log Keamanan)",
        badge: "Security Log",
        badgeColor: "rgba(245,158,11,0.25)",
        badgeText: "#FCD34D",
        desc: "Rekaman waktu detik-demi-detik seluruh aktivitas di dalam sistem: login, logout, disposisi tugas, perubahan rute, dan pengesahan logbook."
      },
      {
        icon: "🔌",
        name: "Konfigurasi Gateway & API Pihak Ketiga",
        badge: "Integrasi API",
        desc: "Pemantauan status koneksi SMS Gateway, WhatsApp Business API, Tile Server Peta CartoDB/OpenStreetMap, dan Backup Database berkala."
      }
    ],
    steps: [
      {
        title: "1. Tinjau Direktori Akun Personel",
        desc: "Buka halaman Si TIK, perlihatkan daftar akun pengguna yang terstruktur rapi berdasarkan hierarki pangkat dan kesatuan."
      },
      {
        title: "2. Demonstrasikan Penambahan Akun Baru",
        desc: "Klik tombol '➕ Tambah Akun Personel', isi data anggota baru, tentukan role wewenangnya, lalu klik 'Simpan Akun'."
      },
      {
        title: "3. Periksa Rekaman Log Audit Sistem",
        desc: "Buka panel System Audit Trail untuk membuktikan kepada klien bahwa setiap klik dan tindakan pengguna tercatat secara forensik dan tidak bisa dimanipulasi."
      }
    ],
    clientTips: `
      <strong>💡 Tips Menjawab Pertanyaan Klien / Kapolres:</strong><br>
      • <em>"Bagaimana jika ada polisi yang mutasi pindah tugas?"</em><br>
      <strong>Jawaban Taktis:</strong> Admin Si TIK dapat dalam hitungan detik mengubah wewenang kesatuan atau menonaktifkan akun personel yang bersangkutan sehingga data operasional Polres lama langsung terproteksi secara instan.
    `
  }
};


/**
 * SIMAPRES 110 - Sistem Informasi Monitoring & Akuntabilitas Pengaduan Presisi 110
 * Interactive Prototype Logic, Multi-Stage Evidence & Route/Hotspot Configuration
 */

const INITIAL_DATA = {
  // Plotting Penugasan Armada Patroli & Rute (Sprint Turjawali Polri)
  // Buku Register Mediasi Problem Solving (Restorative Justice) Polsek
  mediasiRecords: [
    {
      id: "RJ-01/X/2026/POLSEK",
      date: "05 Okt 2026",
      parties: "Sdr. Joko Susilo vs Sdr. Anwar Sanusi",
      caseCategory: "Tipiring / Sengketa Lahan Parkir",
      caseDesc: "Kesalahpahaman batas parkir usaha warga di Ruko Cempaka",
      officer: "Aiptu Mulyadi (Bhabinkamtibmas)",
      officerNrp: "77090112",
      result: "Sepakat Damai (Surat Pernyataan Bersama)",
      points: "1. Pihak 1 dan Pihak 2 sepakat menata marka batas parkir usaha bersama secara adil.\n2. Kedua belah pihak saling memaafkan tanpa tuntutan ganti rugi.\n3. Berjanji menjaga kerukunan dan ketertiban lingkungan.",
      statusBadge: "badge-success",
      docUrl: "#"
    },
    {
      id: "RJ-02/IX/2026/POLSEK",
      date: "29 Sep 2026",
      parties: "Ibu Ratna Kumalasari vs Sdr. Dedi Kurniawan",
      caseCategory: "Kerusakan Ringan / Laka Lingkungan",
      caseDesc: "Kerusakan pot tanaman hias & pagar akibat senggolan kendaraan saat mundur",
      officer: "Aipda Suhendar (Bhabinkamtibmas)",
      officerNrp: "82040511",
      result: "Ganti Rugi Kekeluargaan Tuntas",
      points: "1. Pihak 2 telah mengganti biaya perbaikan pot dan pagar sebesar Rp 450.000 secara tunai di hadapan mediator.\n2. Pihak 1 menyatakan masalah selesai dan mencabut aduan secara sukarela.",
      statusBadge: "badge-success",
      docUrl: "#"
    }
  ],

  fleetAssignments: [
    {
      id: "ASSIGN-01",
      unitKey: "SAMAPTA_AHMAD",
      vehicleName: "Sedan Samapta 110-A",
      vehiclePlate: "R4-81 / B 1100 POL",
      vehicleType: "CAR",
      officerNrp: "88123456",
      officerName: "Bripka Ahmad Subagyo",
      officerRole: "Danru Samapta 110-A",
      routeName: "Beat 1 Pasar & Sentra Perbankan",
      routeCode: "BEAT-01",
      shift: "Shift 1 Pagi (08:00 - 16:00 WIB)",
      sprintNo: "Sprin/412/X/OPS.1.1/2026",
      status: "AKTIF",
      icon: "🚔",
      color: "#38BDF8"
    },
    {
      id: "ASSIGN-02",
      unitKey: "PERINTIS_JOKO",
      vehicleName: "Tim Perintis Presisi Trail 02",
      vehiclePlate: "KLX-250 / B 2200 POL",
      vehicleType: "BIKE",
      officerNrp: "82050412",
      officerName: "Aipda Joko Susanto",
      officerRole: "Katim Perintis Presisi",
      routeName: "Beat 2 Flyover & Sentra Niaga",
      routeCode: "BEAT-02",
      shift: "Shift 2 Malam (20:00 - 04:00 WIB)",
      sprintNo: "Sprin/415/X/OPS.1.1/2026",
      status: "AKTIF",
      icon: "🏍️",
      color: "#34D399"
    },
    {
      id: "ASSIGN-03",
      unitKey: "PATWAL_DANI",
      vehicleName: "Patwal Sat Lantas R4-01",
      vehiclePlate: "XJ900P / B 3300 POL",
      vehicleType: "CAR",
      officerNrp: "85090123",
      officerName: "Bripka Dani Prasetyo",
      officerRole: "Danru Patwal Lantas",
      routeName: "Beat 3 Simpang Sudirman",
      routeCode: "BEAT-03",
      shift: "Shift 1 Pagi (06:00 - 14:00 WIB)",
      sprintNo: "Sprin/418/X/OPS.1.1/2026",
      status: "AKTIF",
      icon: "🚓",
      color: "#FBBF24"
    }
  ],
  patrolFleet: [
    {
      id: "FLEET-01",
      callsign: "Patroli Samapta 110-A",
      unit: "Sat Samapta (Sektor Timur)",
      officerName: "Bripka Ahmad Subagyo",
      officerNrp: "88123456",
      vehicle: "Sedan R4-Samapta-81",
      vehicleType: "CAR",
      lat: -6.2146,
      lng: 106.8451,
      status: "SIAGA",
      currentTask: "Patroli Rute Beat 1 (Pasar & Bank)",
      speedKmh: 35,
      phone: "0812-8899-7711",
      icon: "🚔"
    },
    {
      id: "FLEET-02",
      callsign: "Perintis Presisi Alpha",
      unit: "Tim Perintis Presisi",
      officerName: "Aipda Joko Susanto",
      officerNrp: "82050412",
      vehicle: "Motor Trail KLX 250",
      vehicleType: "BIKE",
      lat: -6.2220,
      lng: 106.8520,
      status: "SIAGA",
      currentTask: "Patroli Kring Sentra Niaga",
      speedKmh: 42,
      phone: "0813-7766-5544",
      icon: "🏍️"
    },
    {
      id: "FLEET-03",
      callsign: "Patwal Lantas 01",
      unit: "Sat Lantas Polres",
      officerName: "Bripka Dani Prasetyo",
      officerNrp: "85090123",
      vehicle: "Sedan Patwal R4-01",
      vehicleType: "CAR",
      lat: -6.2080,
      lng: 106.8390,
      status: "SIAGA",
      currentTask: "Pengaturan Lalin Pos Simpang Sudirman",
      speedKmh: 0,
      phone: "0817-2233-4455",
      icon: "🚓"
    },
    {
      id: "FLEET-04",
      callsign: "Bhabin Cempaka 01",
      unit: "Polsek Cempaka Raya",
      officerName: "Bripka Hendra",
      officerNrp: "89010234",
      vehicle: "Motor Dinas Trail 05",
      vehicleType: "BIKE",
      lat: -6.2280,
      lng: 106.8410,
      status: "SIAGA",
      currentTask: "Sambang Warga DDS RT 04",
      speedKmh: 15,
      phone: "0856-1122-3344",
      icon: "👮‍♂️"
    }
  ],
  systemUsers: [
    { 
      nrp: "76110988", name: "AKBP Hendro Wibowo, S.I.K., M.Si.", rank: "AKBP", unit: "Pimpinan Polres Metro", role: "PIMPINAN_KAPOLRES", status: "AKTIF",
      deviceBinding: { model: "iPhone 14 Pro Max (Apple Secure Enclave)", uuid: "SEC-POL-76110988-IOS", status: "TERIKAT", keystore: "Apple Secure Enclave mTLS", antiMock: "Aktif", enrolledAt: "01 Sep 2026" }
    },
    { 
      nrp: "80080155", name: "AKP Danang Kusuma, S.H.", rank: "AKP", unit: "Polsek Cempaka Raya", role: "KAPOLSEK", status: "AKTIF",
      deviceBinding: { model: "Samsung Galaxy S22 Tactical Edition", uuid: "SEC-POL-80080155-TAC1", status: "TERIKAT", keystore: "Knox Vault Hardware TEE", antiMock: "Aktif", enrolledAt: "05 Sep 2026" }
    },
    { 
      nrp: "78030211", name: "Kompol Wahyu Santoso, S.H.", rank: "Kompol", unit: "Bagian Operasi (Bag Ops)", role: "PERWIRA_OPS", status: "AKTIF",
      deviceBinding: { model: "Samsung Galaxy Tab Active3 Rugged Tablet", uuid: "SEC-POL-78030211-TAB", status: "TERIKAT", keystore: "Hardware StrongBox TEE", antiMock: "Aktif", enrolledAt: "02 Sep 2026" }
    },
    { 
      nrp: "94050112", name: "Briptu Siti Nurhaliza", rank: "Briptu", unit: "SPKT / Call Center 110", role: "OPERATOR_SPKT", status: "AKTIF",
      deviceBinding: { model: "Terminal Workstation SPKT 110 (MDT Desktop-04)", uuid: "SEC-POL-94050112-WKS", status: "TERIKAT", keystore: "TPM 2.0 Security Chip", antiMock: "N/A (Fixed PC)", enrolledAt: "10 Sep 2026" }
    },
    { 
      nrp: "88123456", name: "Bripka Ahmad Subagyo", rank: "Bripka", unit: "Sat Samapta (Sektor Timur)", role: "PERSONIL_LAPANGAN", status: "AKTIF",
      deviceBinding: { model: "Samsung Galaxy XCover 5 Enterprise (Police Rugged)", uuid: "SEC-POL-88123456-XCV9", status: "TERIKAT", keystore: "Hardware StrongBox TEE", antiMock: "Aktif (Mock Blocked)", enrolledAt: "15 Sep 2026" }
    },
    { 
      nrp: "79040122", name: "Iptu Budi Santoso, S.H.", rank: "Iptu", unit: "Kanit Turjawali Samapta / Pawas", role: "KANIT_PAWAS", status: "AKTIF",
      deviceBinding: { model: "Samsung Galaxy A54 5G (Dinas Pawas)", uuid: "SEC-POL-79040122-A54", status: "TERIKAT", keystore: "ARM TrustZone Keystore", antiMock: "Aktif", enrolledAt: "12 Sep 2026" }
    },
    { 
      nrp: "81060333", name: "Iptu Hendra Wijaya, S.H.", rank: "Iptu", unit: "Seksi Propam Polres", role: "KASI_PROPAM", status: "AKTIF",
      deviceBinding: { model: "Google Pixel 7 (Titan M2 Security Chip)", uuid: "SEC-POL-81060333-PIX", status: "TERIKAT", keystore: "Titan M2 Hardware Chip", antiMock: "Aktif", enrolledAt: "08 Sep 2026" }
    },
    { 
      nrp: "83070455", name: "Aipda Pratama, S.Kom.", rank: "Aipda", unit: "Seksi TIK Polres", role: "ADMIN_TIK", status: "AKTIF",
      deviceBinding: { model: "Workstation Konsol Si TIK Cyber Center", uuid: "SEC-POL-83070455-ADM", status: "TERIKAT", keystore: "FIPS 140-2 Level 3 HSM", antiMock: "N/A (Master Terminal)", enrolledAt: "01 Agu 2026" }
    },
    { 
      nrp: "82050412", name: "Aipda Joko Susanto", rank: "Aipda", unit: "Tim Perintis Presisi", role: "PERSONIL_LAPANGAN", status: "AKTIF",
      deviceBinding: { model: "Panasonic Toughbook FZ-T1 Police Rugged", uuid: "SEC-POL-82050412-FZ88", status: "TERIKAT", keystore: "Hardware StrongBox TEE", antiMock: "Aktif (Mock Blocked)", enrolledAt: "18 Sep 2026" }
    }
  ],
  complaints: [
    {
      id: "LP-110-2026-0042",
      title: "Laporan Dugaan Curanmor Roda 2 (Honda Beat Hitam)",
      reporter: "Bambang Sudirjo",
      phone: "0812-9844-3321",
      category: "Curanmor",
      timestamp: "2026-10-05 14:15 WIB",
      locationName: "Area Parkir Ruko Grand Mall, Jl. Merdeka No. 12",
      lat: -6.2146,
      lng: 106.8451,
      status: "DISPOSISI",
      priority: "TINGGI",
      assignedOfficer: {
        name: "Bripka Ahmad Subagyo",
        nrp: "88123456",
        unit: "Patroli Samapta / Tim Presisi",
        phone: "0811-2233-4455"
      },
      timeline: [
        { 
          stage: "VERIFIKASI_110",
          time: "14:15", 
          title: "1. Panggilan 110 Diterima & Verifikasi SPKT", 
          desc: "Panggilan darurat divalidasi oleh Operator Sentra Pelayanan Kepolisian Terpadu (SPKT).",
          attachments: [
            { type: "DOC", title: "Lembar Registrasi SPKT 110 (LP-110-2026-0089)", meta: "Dokumen Registrasi Digital SPKT", icon: "📑", url: "#" },
            { type: "PHOTO", title: "Foto KTP & STNK Pelapor (Bambang Sudirjo)", meta: "Bukti Kepemilikan Kendaraan Sah", icon: "📸", url: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80" },
            { type: "DOC", title: "Lembar Disposisi SPKT No. DISP/110/X/2026", meta: "Dokumen Registrasi SPKT", icon: "📑", url: "#" }
          ]
        },
        { 
          stage: "MENUJU_TKP",
          time: "14:28", 
          title: "2. Petugas Meluncur Menuju Lokasi (TKP)", 
          desc: "Unit Patroli Roda 4 Samapta (Bripka Ahmad) bergerak dengan estimasi 12 menit.",
          attachments: [
            { type: "PHOTO", title: "Foto Keberangkatan Armada R4 Samapta-81", meta: "Stempel Lokasi: Mako Polres Metro (Jl. Jend. Sudirman No. 1)", icon: "🚔", url: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=600&q=80" }
          ]
        },
        { 
          stage: "PENANGANAN_TKP",
          time: "14:40", 
          title: "3. Tiba di TKP & Tindakan Pertama (TP-TKP)", 
          desc: "Petugas berada di lokasi melakukan pengamanan, olah bukti CCTV, dan interogasi saksi.",
          attachments: [
            { type: "PHOTO", title: "Foto Olah TKP Awal Parkiran Ruko", meta: "Lokasi TKP: Area Parkir Ruko Grand Mall (Terverifikasi di Lokasi)", icon: "📸", url: "https://images.unsplash.com/photo-1590856029826-c7a73142bbf1?auto=format&fit=crop&w=600&q=80" },
            { type: "VIDEO", title: "Video Rekaman CCTV Detik-Detik Pelaku Beraksi", meta: "Video MP4 &bull; 14.5 MB", icon: "🎥", url: "#" }
          ]
        }
      ]
    },
    {
      id: "LP-110-2026-0038",
      title: "Pengaduan Kerumunan Remaja Diduga Hendak Tawuran & Bawa Sajam",
      reporter: "H. Ridwan (Ketua RT 04)",
      phone: "0813-8877-6655",
      category: "Tawuran / Kamtibmas",
      timestamp: "2026-10-05 11:20 WIB",
      locationName: "Jembatan Layang Rel Kereta, Kel. Sukamaju",
      lat: -6.2380,
      lng: 106.8390,
      status: "SELESAI",
      priority: "DARURAT",
      assignedOfficer: {
        name: "Aipda Joko Susanto",
        nrp: "82050412",
        unit: "Tim Perintis Presisi",
        phone: "0812-4455-6677"
      },
      timeline: [
        {
          stage: "VERIFIKASI_110",
          time: "11:20",
          title: "1. Laporan 110 Masuk",
          desc: "Warga melaporkan 15 remaja kumpul membawa sarung dan pipa besi.",
          attachments: [
            { type: "DOC", title: "Lembar Registrasi Panggilan Darurat SPKT", meta: "Catatan Digital Operator 110", icon: "📑", url: "#" },
            { type: "PHOTO", title: "Foto Titik Kumpul Remaja (Barang Bukti Sajam)", meta: "Dokumentasi Awal Kejadian", icon: "📸", url: "https://images.unsplash.com/photo-1590856029826-c7a73142bbf1?auto=format&fit=crop&w=600&q=80" }
          ]
        },
        {
          stage: "MENUJU_TKP",
          time: "11:24",
          title: "2. Disposisi Unit Perintis Presisi",
          desc: "Regu motor trail Perintis Presisi bergerak cepat.",
          attachments: [
            { type: "PHOTO", title: "Foto Keberangkatan Tim Perintis Presisi", meta: "GPS Mako: -6.2015, 106.8195", icon: "🚔", url: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=600&q=80" }
          ]
        },
        {
          stage: "PENANGANAN_TKP",
          time: "11:35",
          title: "3. Penanganan & Pembubaran di TKP",
          desc: "Remaja dibubarkan, 3 orang diamankan ke Mapolsek untuk pembinaan.",
          attachments: [
            { type: "PHOTO", title: "Foto Pembinaan Remaja Bersama Perangkat RT", meta: "GPS TKP: -6.2378, 106.8395", icon: "📸", url: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80" }
          ]
        },
        {
          stage: "SELESAI",
          time: "13:00",
          title: "4. Kasus Selesai Ditangani & Berkas Terbit",
          desc: "Wilayah kondusif, diterbitkan Berita Acara pembinaan dan mediasi orang tua.",
          attachments: [
            { type: "DOC", title: "Berita Acara Kesepakatan & Pembinaan Kamtibmas.pdf", meta: "Dokumen Mediasi Sah", icon: "📑", url: "#" }
          ]
        }
      ]
    },
    {
      id: "LP-110-2026-0040",
      title: "Pencurian Tabung Gas & Pembobolan Warung Kelontong",
      reporter: "Ibu Mariam",
      phone: "0878-9900-1122",
      category: "Curanmor / Curat",
      timestamp: "2026-10-05 08:45 WIB",
      locationName: "Pasar Tradisional Blok B, Kios No. 14",
      lat: -6.2080,
      lng: 106.8310,
      status: "BELUM_DITANGANI",
      priority: "SEDANG",
      assignedOfficer: null,
      timeline: [
        { 
          stage: "VERIFIKASI_110",
          time: "08:45", 
          title: "1. Laporan Masuk 110 (Tercatat Lembar SPKT)", 
          desc: "Laporan tercatat di logbook SPKT harian, menunggu disposisi personel patroli.",
          attachments: [
            { type: "DOC", title: "Formulir_Pendaftaran_Pengaduan_110.pdf", meta: "Dokumen Tiket SPKT", icon: "📑", url: "#" }
          ]
        }
      ]
    }
  ],

  // Crime & Vulnerability Hotspots (Titik Rawan)
  hotspots: [
    { id: "HS-01", name: "Titik Rawan Curanmor Pasar Jaya", address: "Jl. Merdeka No. 45, Kawasan Parkir Pasar Jaya", category: "Curanmor", lat: -6.2140, lng: 106.8450, radius: 250, risk: "TINGGI", level: "TINGGI", hours: "14:00 - 18:00 WIB", notes: "Patroli dialogis juru parkir, imbau kunci ganda" },
    { id: "HS-02", name: "Titik Rawan Tawuran Flyover Baru", address: "Flyover Cempaka KM 4, Bawah Jembatan Layang Rel KA", category: "Tawuran", lat: -6.2380, lng: 106.8390, radius: 300, risk: "KRITIS", level: "KRITIS", hours: "22:00 - 04:00 WIB", notes: "Patroli blue light stasioner cegah geng motor" },
    { id: "HS-03", name: "Titik Rawan Balap Liar Bypass", address: "Jl. Bypass Protokol KM 12 Timur, Jalur Lurus Bebas Hambatan", category: "Balap Liar", lat: -6.2450, lng: 106.8600, radius: 400, risk: "SEDANG", level: "SEDANG", hours: "01:00 - 04:00 WIB", notes: "Pemeriksaan surat kendaraan & knalpot brong" },
    { id: "HS-04", name: "Titik Rawan Laka Lantas Simpang Cempaka", address: "Pertigaan Jl. Cempaka Raya - Jl. Veteran, Depan SPBU", category: "Laka Lantas", lat: -6.2255, lng: 106.8520, radius: 200, risk: "TINGGI", level: "TINGGI", hours: "06:30 - 09:00 WIB", notes: "Pengaturan arus lalu lintas jam berangkat kerja" }
  ],

  // Patrol Route Checkpoints (Daftar Titik Singgah)
  checkpoints: [
    { id: 1, name: "Pos 1: Mapolres Metro (Titik Keberangkatan)", address: "Jl. Jend. Sudirman No. 1, Gedung Mako Polres", lat: -6.2015, lng: 106.8195, timeTarget: "08:00 WIB", qrCode: "QR-POS-01", status: "TERKUNJUNGI", lastVisited: "08:05 WIB" },
    { id: 2, name: "Pos 2: Pos Pantau Simpang 5 Sudirman", address: "Jl. Sudirman Simpang Lima, Pos Polisi Lantas", lat: -6.2080, lng: 106.8310, timeTarget: "09:15 WIB", qrCode: "QR-POS-02", status: "TERKUNJUNGI", lastVisited: "09:20 WIB" },
    { id: 3, name: "Pos 3: Pasar Tradisional Jaya (Zona Rawan Curanmor)", address: "Jl. Merdeka No. 45, Pos Satpam Pintu Barat Pasar", lat: -6.2140, lng: 106.8450, timeTarget: "10:30 WIB", qrCode: "QR-POS-03", status: "SIAGA PATROLI", lastVisited: "Target 10:30 WIB" },
    { id: 4, name: "Pos 4: Jembatan Flyover Rel Kereta (Zona Rawan Tawuran)", address: "Kawasan Bawah Flyover Rel KA Cempaka KM 4", lat: -6.2380, lng: 106.8390, timeTarget: "12:00 WIB", qrCode: "QR-POS-04", status: "SIAGA PATROLI", lastVisited: "Target 12:00 WIB" },
    { id: 5, name: "Pos 5: Mapolres Metro (Kembali Konsolidasi)", address: "Jl. Jend. Sudirman No. 1, Lapangan Mako Polres", lat: -6.2015, lng: 106.8195, timeTarget: "14:00 WIB", qrCode: "QR-POS-05", status: "KONSOLIDASI", lastVisited: "Target 14:00 WIB" }
  ],

  // Unit-Specific Patrol Routes (Sistem Beat per-Regu) & Operasi Gabungan
  unitCheckpoints: {
    SAMAPTA_AHMAD: [
      { id: 1, name: "Pos 1: Mapolres Metro (Titik Keberangkatan)", lat: -6.2015, lng: 106.8195, timeTarget: "08:00 WIB", qrCode: "QR-POS-01", status: "TERKUNJUNGI", lastVisited: "08:05 WIB" },
      { id: 2, name: "Pos 2: Pos Pantau Simpang 5 Sudirman", lat: -6.2080, lng: 106.8310, timeTarget: "09:15 WIB", qrCode: "QR-POS-02", status: "TERKUNJUNGI", lastVisited: "09:20 WIB" },
      { id: 3, name: "Pos 3: Pasar Tradisional Jaya (Zona Rawan Curanmor)", lat: -6.2140, lng: 106.8450, timeTarget: "10:30 WIB", qrCode: "QR-POS-03", status: "SIAGA PATROLI", lastVisited: "Target 10:30 WIB" },
      { id: 4, name: "Pos 4: Jembatan Flyover Rel Kereta (Zona Rawan Tawuran)", lat: -6.2380, lng: 106.8390, timeTarget: "12:00 WIB", qrCode: "QR-POS-04", status: "SIAGA PATROLI", lastVisited: "Target 12:00 WIB" },
      { id: 5, name: "Pos 5: Mapolres Metro (Kembali Konsolidasi)", lat: -6.2015, lng: 106.8195, timeTarget: "14:00 WIB", qrCode: "QR-POS-05", status: "KONSOLIDASI", lastVisited: "Target 14:00 WIB" }
    ],
    PERINTIS_JOKO: [
      { id: 1, name: "Pos A: Pangkalan Tim Perintis Presisi (Mako Barat)", lat: -6.2100, lng: 106.8250, timeTarget: "22:00 WIB", qrCode: "QR-PRT-01", status: "TERKUNJUNGI", lastVisited: "22:10 WIB" },
      { id: 2, name: "Pos B: Flyover Cempaka (Titik Rawan Geng Motor)", lat: -6.2380, lng: 106.8390, timeTarget: "23:30 WIB", qrCode: "QR-PRT-02", status: "SIAGA PATROLI", lastVisited: "Target 23:30 WIB" },
      { id: 3, name: "Pos C: Sentra Niaga & Ruko Finansial", lat: -6.2255, lng: 106.8520, timeTarget: "01:00 WIB", qrCode: "QR-PRT-03", status: "SIAGA PATROLI", lastVisited: "Target 01:00 WIB" },
      { id: 4, name: "Pos D: Jalur Bypass Cepat (Antisipasi Balap Liar)", lat: -6.2450, lng: 106.8600, timeTarget: "02:30 WIB", qrCode: "QR-PRT-04", status: "SIAGA PATROLI", lastVisited: "Target 02:30 WIB" }
    ],
    PATWAL_DANI: [
      { id: 1, name: "Pos Lantas 01: Simpang Protokol Sudirman", lat: -6.2080, lng: 106.8310, timeTarget: "06:30 WIB", qrCode: "QR-LTS-01", status: "TERKUNJUNGI", lastVisited: "06:35 WIB" },
      { id: 2, name: "Pos Lantas 02: Bundaran Obvit Perbankan", lat: -6.2140, lng: 106.8450, timeTarget: "07:30 WIB", qrCode: "QR-LTS-02", status: "TERKUNJUNGI", lastVisited: "07:30 WIB" },
      { id: 3, name: "Pos Lantas 03: Simpang Cempaka Raya (Gatur Lalin)", lat: -6.2255, lng: 106.8520, timeTarget: "08:30 WIB", qrCode: "QR-LTS-03", status: "SIAGA PATROLI", lastVisited: "Target 08:30 WIB" }
    ],
    GABUNGAN_POLRES: [
      { id: 1, name: "Titik Kumpul 1: Apel Lapangan Mapolres", lat: -6.2015, lng: 106.8195, timeTarget: "23:00 WIB", qrCode: "QR-GAB-01", status: "TERKUNJUNGI", lastVisited: "23:05 WIB" },
      { id: 2, name: "Zona Pantau 2: Koridor Simpang 5 Sudirman", lat: -6.2080, lng: 106.8310, timeTarget: "00:00 WIB", qrCode: "QR-GAB-02", status: "SIAGA PATROLI", lastVisited: "Target 00:00 WIB" },
      { id: 3, name: "Zona Pantau 3: Pasar Tradisional & Sentra Ekonomi", lat: -6.2140, lng: 106.8450, timeTarget: "01:30 WIB", qrCode: "QR-GAB-03", status: "SIAGA PATROLI", lastVisited: "Target 01:30 WIB" },
      { id: 4, name: "Zona Pantau 4: Flyover Rel Kereta & Batas Sektor", lat: -6.2380, lng: 106.8390, timeTarget: "03:00 WIB", qrCode: "QR-GAB-04", status: "SIAGA PATROLI", lastVisited: "Target 03:00 WIB" },
      { id: 5, name: "Titik Akhir: Mapolres Metro (Konsolidasi Pasukan)", lat: -6.2015, lng: 106.8195, timeTarget: "04:30 WIB", qrCode: "QR-GAB-05", status: "KONSOLIDASI", lastVisited: "Target 04:30 WIB" }
    ]
  },

  // Field Officer Activity Logs (E-Logbook)
  eLogbook: [
    {
      id: "LOG-0101",
      type: "PATROLI",
      officerName: "Bripka Ahmad Subagyo",
      officerNrp: "88123456",
      time: "09:30 WIB",
      title: "Patroli Dialogis Pasar Jaya & Obvit Bank",
      locationClaimed: "Pasar Tradisional Jaya, Pos Satpam",
      locationGps: { lat: -6.2145, lng: 106.8452 },
      discrepancyKm: 0.06,
      status: "DISETUJUI",
      auditVerdict: "VALID",
      photoUrl: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=600&q=80",
      notes: "Dialog dengan juru parkir agar waspada curanmor roda dua."
    },
    {
      id: "LOG-0102",
      type: "TP-TKP",
      officerName: "Bripka Ahmad Subagyo",
      officerNrp: "88123456",
      time: "11:15 WIB",
      title: "Penanganan Laka Lantas Ringan Roda Dua",
      locationClaimed: "Jl. Cempaka Raya No. 45",
      locationGps: { lat: -6.2250, lng: 106.8518 },
      discrepancyKm: 0.07,
      status: "MENUNGGU",
      auditVerdict: "VALID",
      photoUrl: "https://images.unsplash.com/photo-1590856029826-c7a73142bbf1?auto=format&fit=crop&w=600&q=80",
      notes: "Kedua pihak sepakat musyawarah kekeluargaan, surat kesepakatan terlampir."
    },
    {
      id: "LOG-0103",
      type: "SAMBANG",
      officerName: "Bripka Hendra (Bhabinkamtibmas)",
      officerNrp: "89010234",
      time: "13:40 WIB",
      title: "Sambang Warga & Sosialisasi Call Center 110",
      locationClaimed: "Balai RW 07 Kelurahan Mekarsari (Jarak 5.2 km dari Polres)",
      locationGps: { lat: -6.2020, lng: 106.8200 },
      discrepancyKm: 6.84,
      status: "MENUNGGU",
      auditVerdict: "MISMATCH_ALERT",
      photoUrl: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80",
      notes: "Penyuluhan Kamtibmas ke warga (Peringatan Sistem: Koordinat GPS unggahan berjarak 6.8 km dari klaim lokasi Balai RW!)"
    }
  ],

  officerStats: {
    logKirim: 28,
    logDisetujui: 25,
    logMenunggu: 3,
    kpiPercent: 92
  },

  kanitUnitMembers: [
    { nrp: "88123456", name: "Bripka Ahmad Subagyo", rank: "Bripka", beat: "Beat 1 - Pasar & Sentra Perbankan", shift: "Shift Pagi (08:00 - 20:00)", logCount: 2, gpsScore: "100%", statusText: "Menuju TKP 110", statusBadge: "badge-info" },
    { nrp: "82050412", name: "Aipda Joko Susanto", rank: "Aipda", beat: "Beat 2 - Sentra Niaga & Cempaka", shift: "Shift Pagi (08:00 - 20:00)", logCount: 3, gpsScore: "98%", statusText: "Patroli Dialogis", statusBadge: "badge-success" },
    { nrp: "92070119", name: "Bripda Rizki Pratama", rank: "Bripda", beat: "Beat 3 - Perumahan & Jalur Protokol", shift: "Shift Pagi (08:00 - 20:00)", logCount: 1, gpsScore: "99%", statusText: "Standby Pos Polisi", statusBadge: "badge-gold" }
  ],
  kabagopsSprintRecords: [
    {
      id: "SPRINT/402/X/OPS.1.1/2026",
      name: "Operasi Cipta Kondisi Malam Antisipasi Tawuran & 3C",
      units: "Sat Samapta, Sat Lantas, Tim Perintis Presisi",
      strength: "45 Personel (6 Unit Roda 4, 12 Unit Roda 2)",
      period: "01 Okt - 31 Okt 2026 (22:00 - 05:00 WIB)",
      status: "SEDANG_BERJALAN",
      statusBadge: "badge-success"
    },
    {
      id: "SPRINT/403/X/OPS.1.3/2026",
      name: "Pengamanan Khusus Sentra Ekonomi & Perbankan Awal Bulan",
      units: "Sat Samapta (Turjawali) & Pam Obvit",
      strength: "20 Personel (Patroli Dialogis)",
      period: "01 Okt - 10 Okt 2026",
      status: "SEDANG_BERJALAN",
      statusBadge: "badge-success"
    },
    {
      id: "SPRINT/404/X/OPS.2.1/2026",
      name: "Operasi Zebra Candi Penertiban Kamseltibcarlantas",
      units: "Sat Lantas Polres & Dishub",
      strength: "30 Personel",
      period: "14 Okt - 27 Okt 2026",
      status: "TAHAP_PERSIAPAN",
      statusBadge: "badge-gold"
    },
    {
      id: "SPRINT/405/X/PAM.GIAT/2026",
      name: "Pengamanan Festival Kuliner Nusantara & Keramaian Warga",
      units: "Polsek Cempaka & Samapta",
      strength: "25 Personel",
      period: "10 Okt - 12 Okt 2026",
      status: "TAHAP_PERSIAPAN",
      statusBadge: "badge-info"
    }
  ],
  propamBapRecords: [
    {
      id: "BAP-DIS/01/X/2026",
      date: "06 Okt 2026",
      officerName: "Bripka Hendra",
      officerNrp: "89010234",
      unit: "Bhabinkamtibmas Mekarsari",
      infraction: "Manipulasi Koordinat GPS Presisi (Klaim Sambang Balai RW 07, Foto di radius 6.84 km)",
      violationArticle: "Pasal 5 huruf a Perkapolri No. 7/2022 (Kode Etik Profesi)",
      status: "PEMERIKSAAN_PROVOS",
      sanctionRecommendation: "Teguran Tertulis & Penempatan Khusus (Patsus) 7 Hari",
      investigator: "Iptu Hendra Wijaya, S.H. (Kasi Propam)"
    },
    {
      id: "BAP-DIS/02/IX/2026",
      date: "28 Sep 2026",
      officerName: "Brigadir Dedi Kurniawan",
      officerNrp: "91020455",
      unit: "Sat Lantas",
      infraction: "Keterlambatan respon panggilan Quick Response 110 melebihi SLA 25 menit",
      violationArticle: "Pasal 7 ayat 1 huruf c Perkapolri No. 7/2022",
      status: "PUTUSAN_ANKUM",
      sanctionRecommendation: "Teguran Tertulis & Pengawasan Melekat",
      investigator: "Aipda Bambang (Bamin Provos)"
    }
  ],

};

class SimapresApp {
  constructor() {
    this.state = this.loadState();
    this.currentView = 'gateway';
    this.currentUser = null;
    this.activePimpinanTab = 'tab-pimpinan-monitoring';
    this.selectedComplaintForAudit = null;
    this.auditFilter = 'ALL';
    this.patrolConfigMode = 'BEAT';
    this.selectedPatrolUnit = 'SAMAPTA_AHMAD';
    this.isCitizenGuest = true;
    this.currentCitizen = { name: "Tamu / Pengunjung", phone: null };
    this.selectedSpktFile = null;
    this.showResolvedMapIncidents = false;
    this.complaintMarkers = {};
    this.init();
  }

  // ============================================================================
  // DEMO ROLE NAVIGATOR & SCENARIO HELPER
  // ============================================================================
  quickSwitchRole(roleKey) {
    if (roleKey === 'gateway') {
      this.currentUser = null;
      this.switchView('gateway');
      this.updateActiveNavPill('gateway');
      this.showToast("Kembali ke Gerbang Utama (Gateway)", "info");
    } else if (roleKey === 'masyarakat') {
      this.currentUser = null;
      this.switchView('gateway');
      this.updateActiveNavPill('masyarakat');
      this.openCitizenOtpModal();
      this.showToast("Silakan verifikasi No. HP & OTP WhatsApp untuk masuk ke Portal Warga", "info");
    } else {
      // Untuk seluruh peran kepolisian internal: operator, pimpinan, kabagops, personil, sitik
      this.switchView('gateway');
      this.updateActiveNavPill(roleKey);
      this.fillDemoAccount(roleKey);
    }
  }

  updateActiveNavPill(roleKey) {
    document.querySelectorAll('.demo-nav-btn[data-role]').forEach(btn => {
      if (btn.getAttribute('data-role') === roleKey) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  toggleScenarioGuide() {
    const box = document.getElementById('demo-scenario-box');
    if (box) {
      box.style.display = box.style.display === 'block' ? 'none' : 'block';
    }
  }

  loadState() {
    const saved = localStorage.getItem('simapres_state_v5') || localStorage.getItem('simapres_state_v4');
    let state = null;
    if (saved) {
      try {
        state = JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved state", e);
      }
    }
    if (!state) {
      state = JSON.parse(JSON.stringify(INITIAL_DATA));
    }

    // Ensure unitCheckpoints exist
        // Ensure patrolFleet exists
    if (!state.mediasiRecords || state.mediasiRecords.length === 0) {
      state.mediasiRecords = JSON.parse(JSON.stringify(INITIAL_DATA.mediasiRecords));
    }

    if (!state.fleetAssignments || state.fleetAssignments.length === 0) {
      state.fleetAssignments = JSON.parse(JSON.stringify(INITIAL_DATA.fleetAssignments));
    }

    if (!state.patrolFleet || state.patrolFleet.length === 0) {
      state.patrolFleet = JSON.parse(JSON.stringify(INITIAL_DATA.patrolFleet));
    }

    if (!state.unitCheckpoints) {
      state.unitCheckpoints = JSON.parse(JSON.stringify(INITIAL_DATA.unitCheckpoints));
    }

    // Auto-repair checkpoints to guarantee address and NO undefined
    if (state.checkpoints) {
      state.checkpoints = state.checkpoints.map((cp, idx) => ({
        ...cp,
        address: cp.address || (INITIAL_DATA.checkpoints[idx] ? INITIAL_DATA.checkpoints[idx].address : 'Wilayah Sektor Cempaka'),
        qrCode: cp.qrCode || `QR-POS-0${idx + 1}`,
        status: cp.status || (idx < 2 ? 'TERKUNJUNGI' : 'SIAGA PATROLI'),
        lastVisited: cp.lastVisited || cp.timeTarget || 'Target: Sesuai Rute'
      }));
    }

    // Auto-repair systemUsers to guarantee deviceBinding
    if (state.systemUsers) {
      state.systemUsers = state.systemUsers.map((u, idx) => ({
        ...u,
        deviceBinding: u.deviceBinding || (INITIAL_DATA.systemUsers[idx] ? INITIAL_DATA.systemUsers[idx].deviceBinding : {
          model: "Samsung Galaxy XCover 5 Enterprise",
          uuid: `SEC-POL-${u.nrp}-XCV9`,
          status: "TERIKAT",
          keystore: "Hardware StrongBox TEE",
          antiMock: "Aktif (Mock Blocked)",
          enrolledAt: "15 Sep 2026"
        })
      }));
    }

    // Auto-repair hotspots to guarantee address
    if (state.hotspots) {
      state.hotspots = state.hotspots.map((h, idx) => ({
        ...h,
        address: h.address || (INITIAL_DATA.hotspots[idx] ? INITIAL_DATA.hotspots[idx].address : 'Wilayah Kerawanan Sektor'),
        risk: h.risk || h.level || 'TINGGI',
        level: h.level || h.risk || 'TINGGI',
        radius: h.radius || 250
      }));
    }

    // Auto-repair eLogbook to guarantee locationGpsAddress
    if (state.eLogbook) {
      state.eLogbook = state.eLogbook.map((log, idx) => ({
        ...log,
        locationGpsAddress: log.locationGpsAddress || (INITIAL_DATA.eLogbook[idx] ? INITIAL_DATA.eLogbook[idx].locationGpsAddress : (log.discrepancyKm > 0.5 ? 'Warung Kopi Barokah, Jl. Kenanga (Deviasi GPS)' : log.locationClaimed))
      }));
    }

    if (false) {
      state.hotspots = state.hotspots.map(h => ({
        ...h,
        level: h.level || h.risk || 'TINGGI',
        risk: h.risk || h.level || 'TINGGI',
        radius: h.radius || 250
      }));
    }

    return state;
  }

  saveState() {
    localStorage.setItem('simapres_state_v5', JSON.stringify(this.state));
    localStorage.setItem('simapres_state_v4', JSON.stringify(this.state));
    this.renderActiveDashboard();
  }

  resetState() {
    if (confirm("Reset seluruh data simulasi ke pengaturan awal?")) {
      localStorage.removeItem('simapres_state_v4');
      this.state = JSON.parse(JSON.stringify(INITIAL_DATA));
      this.saveState();
      this.showToast("Data simulasi berhasil di-reset!", "success");
    }
  }

  init() {
    this.setupEventListeners();
    this.switchView('gateway');
  }

  setupEventListeners() {
    const searchBtn = document.getElementById('btn-search-tracking');
    const searchInput = document.getElementById('input-tracking-id');
    if (searchBtn && searchInput) {
      searchBtn.addEventListener('click', () => {
        this.trackComplaint(searchInput.value.trim());
      });
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.trackComplaint(searchInput.value.trim());
      });
    }

    document.querySelectorAll('.btn-close-modal, .btn-cancel-modal').forEach(btn => {
      btn.addEventListener('click', () => {
        this.closeAllModals();
      });
    });

    const statusFilter = document.getElementById('filter-complaint-status');
    if (statusFilter) {
      statusFilter.addEventListener('change', () => this.renderPimpinanComplaintsTable());
    }
  }

  // --- NAVIGATION & VIEWS ---
  switchView(viewName) {
    this.currentView = viewName;

    document.querySelectorAll('.role-view').forEach(view => {
      view.classList.remove('active');
    });

    const targetEl = document.getElementById(`view-${viewName}`);
    if (targetEl) {
      targetEl.classList.add('active');
    }

    this.renderTopHeader();

    if (viewName === 'sitik') {
      this.renderSitikView();
    } else if (viewName === 'operator') {
      this.renderSpktView();
    } else if (viewName === 'pimpinan') {
      this.renderPimpinanKpis();
      this.renderPimpinanComplaintsTable();
      this.renderPimpinanAuditTable();
      this.renderPimpinanHotspotsSummary();
      setTimeout(() => {
        this.initRealMap('pimpinan-real-map');
        this.drawTacticalCanvas('tactical-canvas');
      }, 120);
    } else if (viewName === 'kanit') {
      this.renderKanitView();
    } else if (viewName === 'propam') {
      this.renderPropamView();
    } else if (viewName === 'kabagops') {
      this.renderKabagOpsView();
      setTimeout(() => {
        this.initRealMap('kabagops-real-map');
        this.drawTacticalCanvas('kabagops-tactical-canvas');
      }, 120);
    } else if (viewName === 'kapolsek') {
      this.renderKapolsekView();
    } else if (viewName === 'personil') {
      this.renderPersonilView();
      setTimeout(() => this.drawTacticalCanvas('personil-canvas'), 100);
    } else if (viewName === 'masyarakat') {
      this.renderPublicRecentReports();
    }
  }

  switchPimpinanTab(tabId) {
    this.activePimpinanTab = tabId;

    document.querySelectorAll('.pimpinan-tab-btn').forEach(btn => {
      if (btn.getAttribute('data-tab') === tabId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    document.querySelectorAll('.pimpinan-tab-content').forEach(content => {
      content.classList.remove('active');
    });

    const activeContent = document.getElementById(tabId);
    if (activeContent) {
      activeContent.classList.add('active');
    }

    if (tabId === 'tab-pimpinan-monitoring') {
      this.renderPimpinanHotspotsSummary();
      setTimeout(() => this.drawTacticalCanvas('tactical-canvas'), 100);
    } else if (tabId === 'tab-pimpinan-config') {
      this.renderConfigHotspotsTable();
      this.renderCheckpointsList();
    }
  }

  renderTopHeader() {
    const headerTitle = document.getElementById('header-brand-title');
    const headerSub = document.getElementById('header-brand-sub');
    const actionsContainer = document.getElementById('header-actions-container');

    const guideBtnHtml = (roleName, label = 'Panduan Halaman & Fitur') => `
      <button type="button" class="btn-quick" onclick="app.openPageGuideModal('${roleName}')" style="background:rgba(245,158,11,0.2); border:1px solid var(--accent-gold); color:var(--accent-gold); font-weight:700; font-size:12px; display:inline-flex; align-items:center; gap:6px;">
        <span>📖</span> ${label}
      </button>
    `;

    if (this.currentView === 'gateway') {
      headerTitle.innerHTML = `SIMAPRES <span>110</span>`;
      headerSub.textContent = `Aplikasi Web Monitoring & Akuntabilitas Presisi`;
      actionsContainer.innerHTML = `
        ${guideBtnHtml('gateway', 'Panduan Gerbang Masuk')}
        <span class="badge badge-gold" style="font-size:11px; padding:6px 12px;">🛡️ Gerbang Akses Terenkripsi</span>
      `;
    } 
    else if (this.currentView === 'masyarakat') {
      headerTitle.innerHTML = `PORTAL WARGA <span>110</span>`;
      headerSub.textContent = `Layanan Web Pemantauan & Pengaduan Publik`;
      actionsContainer.innerHTML = `
        ${guideBtnHtml('masyarakat', 'Panduan Fitur Warga')}
        <button class="btn-quick" onclick="app.logout()" style="background:rgba(59,130,246,0.2); border-color:var(--info); color:#93C5FD;">
          ⬅️ Kembali ke Gerbang Utama
        </button>
      `;
    } 
    else if (this.currentView === 'sitik') {
      headerTitle.innerHTML = `ADMINISTRASI <span>SI TIK</span>`;
      headerSub.textContent = `Manajemen Akun Anggota & Keamanan Akses Presisi`;
      actionsContainer.innerHTML = `
        <div class="user-session-badge">
          <div class="user-session-avatar" style="border-color:#C084FC;">💻</div>
          <div class="user-session-info">
            <h4>${this.currentUser ? this.currentUser.name : 'Aipda Pratama'}</h4>
            <p>NRP ${this.currentUser ? this.currentUser.nrp : '83070455'} &bull; SUPER ADMIN SI TIK</p>
          </div>
        </div>
        ${guideBtnHtml('sitik', 'Panduan Admin TIK')}
        <button class="btn-logout" onclick="app.logout()">
          <span>🚪</span> Keluar
        </button>
      `;
    }
    else if (this.currentView === 'pimpinan') {
      headerTitle.innerHTML = `COMMAND CENTER <span>KAPOLRES METRO</span>`;
      headerSub.textContent = `Supervisi Eksekutif Komando Tertinggi: Respon Cepat 110 & Kinerja Jajaran`;
      actionsContainer.innerHTML = `
        <div class="user-session-badge">
          <div class="user-session-avatar">🏢</div>
          <div class="user-session-info">
            <h4>${this.currentUser ? this.currentUser.name : 'AKBP Hendro, S.I.K.'}</h4>
            <p>${this.currentUser ? this.currentUser.title : 'Kapolres Metro'} &bull; NRP ${this.currentUser ? this.currentUser.nrp : '76110988'}</p>
          </div>
        </div>
        ${guideBtnHtml('pimpinan', 'Panduan Command Center')}
        <button class="btn-quick" onclick="app.simulateIncoming110Call()" style="background:rgba(239,68,68,0.2); border-color:var(--danger); color:#FCA5A5;">
          ⚡ Laporan 110 Baru
        </button>
        <button class="btn-quick" onclick="app.resetState()" title="Reset data demo">
          🔄 Reset
        </button>
        <button class="btn-logout" onclick="app.logout()">
          <span>🚪</span> Keluar
        </button>
      `;
    } 
    else if (this.currentView === 'kanit') {
      headerTitle.innerHTML = `SUPERVISI <span>KANIT / PAWAS</span>`;
      headerSub.textContent = `Verifikasi e-Logbook Anggota Regu Lapangan & Pemantauan Sektor`;
      actionsContainer.innerHTML = `
        <div class="user-session-badge">
          <div class="user-session-avatar" style="border-color:#38BDF8;">👮‍♂️</div>
          <div class="user-session-info">
            <h4>${this.currentUser ? this.currentUser.name : 'Iptu Budi Santoso, S.H.'}</h4>
            <p>NRP ${this.currentUser ? this.currentUser.nrp : '79040122'} &bull; KANIT TURJAWALI / PAWAS</p>
          </div>
        </div>
        ${guideBtnHtml('kanit', 'Panduan Supervisi Pawas')}
        <button class="btn-logout" onclick="app.logout()">
          <span>🚪</span> Keluar
        </button>
      `;
    }
    else if (this.currentView === 'propam') {
      headerTitle.innerHTML = `SIPROPAM <span>SEKSI PROPAM</span>`;
      headerSub.textContent = `Penegakan Disiplin, Investigasi Anomali GPS & Buku Register BAP`;
      actionsContainer.innerHTML = `
        <div class="user-session-badge">
          <div class="user-session-avatar" style="border-color:#EF4444;">🛡️</div>
          <div class="user-session-info">
            <h4>${this.currentUser ? this.currentUser.name : 'Iptu Hendra Wijaya, S.H.'}</h4>
            <p>NRP ${this.currentUser ? this.currentUser.nrp : '81060333'} &bull; KASI PROPAM POLRES</p>
          </div>
        </div>
        ${guideBtnHtml('propam', 'Panduan Audit Propam')}
        <button class="btn-logout" onclick="app.logout()">
          <span>🚪</span> Keluar
        </button>
      `;
    }
    else if (this.currentView === 'kapolsek') {
      headerTitle.innerHTML = `KOMANDO POLSEK <span>CEMPAKA RAYA</span>`;
      headerSub.textContent = `Pengawasan Wilayah Sektor: Bhabinkamtibmas, Respon 110 & Problem Solving`;
      actionsContainer.innerHTML = `
        <div class="user-session-badge">
          <div class="user-session-avatar" style="border-color:#10B981;">🏛️</div>
          <div class="user-session-info">
            <h4>${this.currentUser ? this.currentUser.name : 'AKP Danang Kusuma, S.H.'}</h4>
            <p>NRP ${this.currentUser ? this.currentUser.nrp : '80080155'} &bull; KAPOLSEK CEMPAKA RAYA</p>
          </div>
        </div>
        ${guideBtnHtml('kapolsek', 'Panduan Komando Sektor')}
        <button class="btn-logout" onclick="app.logout()">
          <span>🚪</span> Keluar
        </button>
      `;
    }
    else if (this.currentView === 'kabagops') {
      headerTitle.innerHTML = `KOMANDO TAKTIS <span>KABAG OPS</span>`;
      headerSub.textContent = `Pengendali Operasional Taktis: Perencanaan Rute, Titik Rawan & Renops`;
      actionsContainer.innerHTML = `
        <div class="user-session-badge">
          <div class="user-session-avatar" style="border-color:#F59E0B;">🗺️</div>
          <div class="user-session-info">
            <h4>${this.currentUser ? this.currentUser.name : 'Kompol Wahyu Santoso, S.H.'}</h4>
            <p>NRP ${this.currentUser ? this.currentUser.nrp : '78030211'} &bull; KABAG OPS POLRES METRO</p>
          </div>
        </div>
        ${guideBtnHtml('kabagops', 'Panduan Taktis Kabag Ops')}
        <button class="btn-logout" onclick="app.logout()">
          <span>🚪</span> Keluar
        </button>
      `;
    }
    else if (this.currentView === 'operator') {
      headerTitle.innerHTML = `TERMINAL SPKT <span>110</span>`;
      headerSub.textContent = `Penerimaan Panggilan Darurat & Registrasi Laporan`;
      actionsContainer.innerHTML = `
        <div class="user-session-badge">
          <div class="user-session-avatar" style="border-color:var(--info);">🎧</div>
          <div class="user-session-info">
            <h4>${this.currentUser ? this.currentUser.name : 'Briptu Siti Nurhaliza'}</h4>
            <p>NRP ${this.currentUser ? this.currentUser.nrp : '94050112'} &bull; OPERATOR SPKT 110</p>
          </div>
        </div>
        ${guideBtnHtml('operator', 'Panduan Terminal Operator')}
        <button class="btn-logout" onclick="app.logout()">
          <span>🚪</span> Keluar
        </button>
      `;
    }
    else if (this.currentView === 'personil') {
      headerTitle.innerHTML = `E-LOGBOOK <span>PRESISI</span>`;
      headerSub.textContent = `Portal Web Anggota Operasional Lapangan`;
      actionsContainer.innerHTML = `
        <div class="user-session-badge">
          <div class="user-session-avatar">👮‍♂️</div>
          <div class="user-session-info">
            <h4>${this.currentUser ? this.currentUser.name : 'Bripka Ahmad Subagyo'}</h4>
            <p>NRP ${this.currentUser ? this.currentUser.nrp : '88123456'} &bull; STATUS: DINAS PATROLI</p>
          </div>
        </div>
        ${guideBtnHtml('personil', 'Panduan e-Logbook Anggota')}
        <button class="btn-logout" onclick="app.logout()">
          <span>🚪</span> Keluar
        </button>
      `;
    }
  }

  openCitizenOtpModal() {
    const stepInput = document.getElementById('otp-step-input');
    if (stepInput) stepInput.style.display = 'none';

    // Populate registered citizens list dynamically
    const listEl = document.getElementById('citizen-otp-registered-list');
    if (listEl) {
      const defaultPresets = [
        { phone: '0812-9844-3321', name: 'Bambang Sudirjo', desc: 'Kasus Curanmor Beat' },
        { phone: '0813-8877-6655', name: 'H. Ridwan', desc: 'Kasus Tawuran' },
        { phone: '0878-9900-1122', name: 'Ibu Mariam', desc: 'Kasus Warung' }
      ];

      const registered = this.state.registeredCitizens || [];
      const normPhone = (p) => (p || '').replace(/[^0-9]/g, '');
      const allList = [...defaultPresets];
      registered.forEach(rc => {
        if (!allList.some(item => normPhone(item.phone) === normPhone(rc.phone))) {
          allList.push({ phone: rc.phone, name: rc.name, desc: 'Laporan Mandiri Warga' });
        }
      });

      listEl.innerHTML = allList.map(item => `
        <button type="button" class="btn-demo-fill" onclick="app.fillCitizenPhone('${item.phone}', '${item.name}')">
          <span>👤 ${item.phone} (${item.name} - ${item.desc})</span>
          <span style="color:var(--accent-gold); font-size:11px;">Isi &rarr;</span>
        </button>
      `).join('');
    }

    this.openModal('modal-citizen-otp-login');
  }

  fillCitizenPhone(phone, name) {
    const phoneInput = document.getElementById('input-otp-phone');
    if (phoneInput) phoneInput.value = phone;
    this.tempCitizenName = name;
    this.showToast(`Nomor HP ${phone} (${name}) dipilih.`, 'info');
  }

  requestCitizenOtp() {
    const phone = document.getElementById('input-otp-phone').value.trim();
    if (!phone) {
      alert("Mohon masukkan nomor HP / WhatsApp Anda terlebih dahulu.");
      return;
    }

    const stepInput = document.getElementById('otp-step-input');
    if (stepInput) {
      stepInput.style.display = 'block';
      stepInput.scrollIntoView({ behavior: 'smooth' });
    }

    // Cooldown timer simulation
    const btn = document.getElementById('btn-req-otp');
    if (btn) {
      let seconds = 60;
      btn.disabled = true;
      btn.style.opacity = '0.6';
      btn.textContent = `Terkirim (${seconds}s)`;
      const timer = setInterval(() => {
        seconds--;
        if (seconds > 0) {
          btn.textContent = `Terkirim (${seconds}s)`;
        } else {
          clearInterval(timer);
          btn.disabled = false;
          btn.style.opacity = '1';
          btn.textContent = 'Kirim Ulang OTP';
        }
      }, 1000);
    }

    this.showToast(`Kode OTP (1100) terkirim ke WhatsApp ${phone}! Berlaku 3 menit.`, 'success');
  }

  verifyCitizenOtp() {
    const phone = document.getElementById('input-otp-phone').value.trim();
    const d1 = document.getElementById('otp-1').value;
    const d2 = document.getElementById('otp-2').value;
    const d3 = document.getElementById('otp-3').value;
    const d4 = document.getElementById('otp-4').value;
    const otp = `${d1}${d2}${d3}${d4}`;

    if (otp !== '1100') {
      alert("Kode OTP salah. Masukkan kode '1100' untuk simulasi demo.");
      return;
    }

    // Determine citizen name from registered sample data
    let name = this.tempCitizenName || "Bambang Sudirjo";
    if (phone.includes('8877')) name = "H. Ridwan (Ketua RT 04)";
    else if (phone.includes('9900')) name = "Ibu Mariam";
    else if (phone.includes('9844')) name = "Bambang Sudirjo";

    this.isCitizenGuest = false;
    this.currentCitizen = { name: name, phone: phone };

    // Register citizen in state
    if (!this.state.registeredCitizens) this.state.registeredCitizens = [];
    const normPhone = (p) => (p || '').replace(/[^0-9]/g, '');
    if (!this.state.registeredCitizens.some(rc => normPhone(rc.phone) === normPhone(phone))) {
      this.state.registeredCitizens.push({ name: name, phone: phone });
    }

    this.saveState();
    this.closeAllModals();
    this.switchView('masyarakat');
    this.updateCitizenAccountUI();
    this.renderPublicRecentReports();
    this.showToast(`Verifikasi OTP Berhasil! Selamat datang, ${name}.`, 'success');
  }

  enterPublicPortal() {
    this.currentUser = null;
    this.isCitizenGuest = true;
    this.currentCitizen = { name: "Pengunjung / Tamu Publik", phone: null };
    this.switchView('masyarakat');
    this.updateCitizenAccountUI();
    this.renderPublicRecentReports();
    this.showToast("Masuk dalam Mode Tamu. Laporan disembunyikan demi privasi warga.", "info");
  }

  fillDemoAccount(role) {
    const nrpInput = document.getElementById('login-nrp');
    const pwdInput = document.getElementById('login-password');
    if (!nrpInput || !pwdInput) return;

    let roleName = "";
    if (role === 'pimpinan') {
      nrpInput.value = '76110988';
      pwdInput.value = 'KAPOLRES2026';
      roleName = 'Kapolres (AKBP Hendro, S.I.K.)';
    } else if (role === 'kanit') {
      nrpInput.value = '79040122';
      pwdInput.value = 'KANIT2026';
      roleName = 'Kanit Samapta / Pawas (Iptu Budi Santoso)';
    } else if (role === 'propam') {
      nrpInput.value = '81060333';
      pwdInput.value = 'PROPAM2026';
      roleName = 'Kasi Propam Polres (Iptu Hendra Wijaya)';
    } else if (role === 'kapolsek') {
      nrpInput.value = '80080155';
      pwdInput.value = 'POLSEK2026';
      roleName = 'Kapolsek Cempaka Raya (AKP Danang, S.H.)';
    } else if (role === 'kabagops') {
      nrpInput.value = '78030211';
      pwdInput.value = 'BAGOPS2026';
      roleName = 'Kabag Ops (Kompol Wahyu Santoso)';
    } else if (role === 'operator') {
      nrpInput.value = '94050112';
      pwdInput.value = 'SPKT110';
      roleName = 'Operator SPKT (Briptu Siti Nurhaliza)';
    } else if (role === 'sitik') {
      nrpInput.value = '83070455';
      pwdInput.value = 'SITIK2026';
      roleName = 'Super Admin Si TIK (Aipda Pratama)';
    } else {
      nrpInput.value = '88123456';
      pwdInput.value = 'PRESISI2026';
      roleName = 'Personel Lapangan (Bripka Ahmad Subagyo)';
    }

    this.showToast(`Kredensial ${roleName} terisi. Silakan klik tombol 'Masuk ke Sistem Internal' di bawah!`, 'info');

    // Beri efek sorotan (glow highlight) pada tombol Masuk ke Sistem Internal
    const loginBtn = document.querySelector('#internal-login-form button[type="submit"]');
    if (loginBtn) {
      loginBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
      loginBtn.style.boxShadow = '0 0 25px rgba(241, 196, 15, 0.8)';
      loginBtn.style.transform = 'scale(1.02)';
      loginBtn.style.transition = 'all 0.3s ease';
      setTimeout(() => {
        loginBtn.style.boxShadow = '';
        loginBtn.style.transform = '';
      }, 1800);
    }
  }

  handleInternalLogin() {
    const nrp = document.getElementById('login-nrp').value.trim();

    if (!nrp) {
      alert("Mohon masukkan Nomor Registrasi Pokok (NRP).");
      return;
    }

    if (nrp.startsWith('76') || nrp.toLowerCase().includes('kapolres')) {
      this.currentUser = {
        name: "AKBP Hendro Wibowo, S.I.K., M.Si.",
        nrp: nrp || "76110988",
        role: "pimpinan",
        title: "Kapolres Metro (Pimpinan Puncak)"
      };
      this.switchView('pimpinan');
      this.showToast("Otentikasi Berhasil. Selamat datang di Command Center Eksekutif, Komandan!", "success");
    } else if (nrp.startsWith('79') || nrp.toLowerCase().includes('kanit') || nrp.toLowerCase().includes('pawas')) {
      this.currentUser = {
        name: "Iptu Budi Santoso, S.H.",
        nrp: nrp || "79040122",
        role: "kanit",
        title: "Kanit Turjawali Samapta / Pawas"
      };
      this.switchView('kanit');
      this.showToast("Otentikasi Berhasil. Selamat datang di Portal Supervisi Kanit / Pawas!", "success");
    } else if (nrp.startsWith('81') || nrp.toLowerCase().includes('propam') || nrp.toLowerCase().includes('provos')) {
      this.currentUser = {
        name: "Iptu Hendra Wijaya, S.H.",
        nrp: nrp || "81060333",
        role: "propam",
        title: "Kasi Propam / Penegakan Disiplin"
      };
      this.switchView('propam');
      this.showToast("Otentikasi Berhasil. Terminal Sipropam: Pengawasan Disiplin & Etik Aktif!", "danger");
    } else if (nrp.startsWith('80') || nrp.toLowerCase().includes('kapolsek')) {
      this.currentUser = {
        name: "AKP Danang Kusuma, S.H.",
        nrp: nrp || "80080155",
        role: "kapolsek",
        title: "Kapolsek Cempaka Raya"
      };
      this.switchView('kapolsek');
      this.showToast("Otentikasi Berhasil. Selamat datang di Portal Komando Wilayah Polsek Cempaka!", "success");
    } else if (nrp.startsWith('78') || nrp.toLowerCase().includes('kabagops')) {
      this.currentUser = {
        name: "Kompol Wahyu Santoso, S.H.",
        nrp: nrp || "78030211",
        role: "kabagops",
        title: "Kepala Bagian Operasi (Kabag Ops)"
      };
      this.switchView('kabagops');
      this.showToast("Otentikasi Berhasil. Selamat datang di Pusat Kendali Taktis Kabag Ops!", "success");
    } else if (nrp.startsWith('94') || nrp.toLowerCase().includes('operator') || nrp.toLowerCase().includes('spkt')) {
      this.currentUser = {
        name: "Briptu Siti Nurhaliza",
        nrp: nrp || "94050112",
        role: "operator",
        title: "Operator SPKT & Call Center 110"
      };
      this.switchView('operator');
      this.showToast("Otentikasi Berhasil. Terminal Operator SPKT 110 Siaga!", "success");
    } else if (nrp.startsWith('83') || nrp.toLowerCase().includes('sitik') || nrp.toLowerCase().includes('admin')) {
      this.currentUser = {
        name: "Aipda Pratama, S.Kom.",
        nrp: nrp || "83070455",
        role: "sitik",
        title: "Super Administrator (Seksi TIK Polres)"
      };
      this.switchView('sitik');
      this.showToast("Otentikasi Berhasil. Terminal Manajemen Akun Si TIK Siap!", "success");
    } else {
      this.currentUser = {
        name: "Bripka Ahmad Subagyo",
        nrp: nrp || "88123456",
        role: "personil",
        title: "Danru Patroli Samapta Sektor Timur"
      };
      this.switchView('personil');
      this.showToast("Otentikasi Berhasil. Status: DINAS AKTIF (Patroli Wilayah).", "success");
    }
  }

  logout() {
    this.currentUser = null;
    const nrpInput = document.getElementById('login-nrp');
    const pwdInput = document.getElementById('login-password');
    if (nrpInput) nrpInput.value = '';
    if (pwdInput) pwdInput.value = '';

    this.switchView('gateway');
    this.showToast("Sesi berhasil diakhiri. Anda kembali ke halaman gerbang.", "info");
  }

  renderActiveDashboard() {
    if (this.currentView === 'pimpinan') {
      this.renderPimpinanKpis();
      this.renderPimpinanComplaintsTable();
      this.renderPimpinanAuditTable();
      this.renderConfigHotspotsTable();
      this.renderCheckpointsList();
    } else if (this.currentView === 'personil') {
      this.renderPersonilView();
    } else if (this.currentView === 'masyarakat') {
      this.renderPublicRecentReports();
    }
  }

  // --- ROLE: PIMPINAN ---
  renderPimpinanKpis() {
    const total = this.state.complaints.length;
    const belum = this.state.complaints.filter(c => c.status === 'BELUM_DITANGANI').length;
    const proses = this.state.complaints.filter(c => c.status === 'MENUJU_TKP' || c.status === 'PENANGANAN_TKP' || c.status === 'DISPOSISI').length;
    const selesai = this.state.complaints.filter(c => c.status === 'SELESAI').length;
    const auditAlerts = this.state.eLogbook.filter(l => l.auditVerdict === 'MISMATCH_ALERT').length;

    document.getElementById('kpi-total-110').textContent = total;
    document.getElementById('kpi-belum-110').textContent = belum;
    document.getElementById('kpi-proses-110').textContent = proses;
    document.getElementById('kpi-selesai-110').textContent = selesai;
    document.getElementById('kpi-audit-alerts').textContent = auditAlerts;

    const alertBanner = document.getElementById('unhandled-desk-alert');
    if (alertBanner) {
      if (belum > 0) {
        alertBanner.style.display = 'flex';
        alertBanner.innerHTML = `
          <div class="audit-alert-icon">⚠️</div>
          <div class="audit-alert-content">
            <h4>PERINGATAN MONITORING: Ada ${belum} Laporan 110 Belum Ditangani (Tertahan di Meja/SPKT)</h4>
            <p>Atensi Pimpinan: Segera lakukan disposisi ke regu patroli terdekat untuk mencegah keluhan masyarakat!</p>
          </div>
          <button class="btn-primary" style="margin-left:auto; font-size:11px; padding:6px 12px;" onclick="app.quickDispatchFirstPending()">⚡ Disposisi Otomatis</button>
        `;
      } else {
        alertBanner.style.display = 'none';
      }
    }
  }

  renderPimpinanComplaintsTable() {
    const tbody = document.getElementById('pimpinan-complaints-tbody');
    if (!tbody) return;

    const filterVal = document.getElementById('filter-complaint-status')?.value || 'ALL';
    let list = this.state.complaints;
    if (filterVal !== 'ALL') {
      list = list.filter(c => c.status === filterVal);
    }

    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 24px; color:var(--text-muted);">Tidak ada laporan yang sesuai filter.</td></tr>`;
      return;
    }

    tbody.innerHTML = list.map(c => {
      let statusBadge = '';
      if (c.status === 'BELUM_DITANGANI') statusBadge = `<span class="badge badge-danger">⚠️ Belum Ditangani</span>`;
      else if (c.status === 'DISPOSISI') statusBadge = `<span class="badge badge-warning">⏳ Disposisi Petugas</span>`;
      else if (c.status === 'MENUJU_TKP') statusBadge = `<span class="badge badge-info">🚔 Menuju Lokasi</span>`;
      else if (c.status === 'PENANGANAN_TKP') statusBadge = `<span class="badge badge-gold">🔍 Olah TKP / Proses</span>`;
      else if (c.status === 'SELESAI') statusBadge = `<span class="badge badge-success">✅ Selesai</span>`;

      const officerText = c.assignedOfficer 
        ? `<strong>${c.assignedOfficer.name}</strong><br><small style="color:var(--text-muted)">NRP ${c.assignedOfficer.nrp}</small>`
        : `<span style="color:var(--danger); font-weight:700;">[Belum Ditugaskan]</span>`;

      return `
        <tr>
          <td>
            <span class="table-code">${c.id}</span><br>
            <small style="color:var(--text-muted)">${c.timestamp}</small>
          </td>
          <td>
            <div style="font-weight:700; color:#fff;">${c.title}</div>
            <small style="color:var(--text-secondary)">📍 ${c.locationName}</small>
          </td>
          <td><span class="badge badge-info">${c.category}</span></td>
          <td>${officerText}</td>
          <td>${statusBadge}</td>
          <td>
            <div style="display:flex; gap:6px;">
              <button class="btn-quick" onclick="app.viewComplaintDetail('${c.id}')" title="Detail Riwayat & Bukti">📄 Detail & Bukti</button>
              ${c.status === 'BELUM_DITANGANI' ? `<button class="btn-primary" style="padding:4px 8px; font-size:11px;" onclick="app.openDispatchModal('${c.id}')">🚀 Tugaskan</button>` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  filterAuditTable(filterType) {
    this.auditFilter = filterType;
    document.querySelectorAll('.btn-filter-audit').forEach(btn => {
      if (btn.getAttribute('data-filter') === filterType) {
        btn.classList.add('active');
        btn.style.boxShadow = '0 0 10px rgba(56, 189, 248, 0.5)';
        btn.style.borderColor = 'var(--accent-gold)';
      } else {
        btn.classList.remove('active');
        btn.style.boxShadow = 'none';
        btn.style.borderColor = '';
      }
    });
    this.renderPimpinanAuditTable();
  }

  renderPimpinanAuditTable() {
    const tbody = document.getElementById('pimpinan-audit-tbody');
    if (!tbody) return;

    let list = this.state.eLogbook;
    if (this.auditFilter === 'PROPAM') {
      list = list.filter(l => l.auditVerdict === 'MISMATCH_ALERT' || l.discrepancyKm > 0.5 || l.status === 'DITOLAK');
    } else if (this.auditFilter === 'KANIT') {
      list = list.filter(l => l.discrepancyKm <= 0.5 && l.status !== 'DITOLAK');
    } else if (this.auditFilter === 'DISETUJUI') {
      list = list.filter(l => l.status === 'DISETUJUI');
    }

    if (list.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 24px; color:var(--text-muted);">Tidak ada data log kegiatan yang sesuai dengan filter audit ini.</td></tr>';
      return;
    }

    tbody.innerHTML = list.map(log => {
      let auditBadge = '';
      let actionBtn = '';
      let rowStyle = '';

      if (log.status === 'DISETUJUI') {
        auditBadge = `<span class="badge badge-success" style="font-weight:700;">✅ Disetujui Kapolres</span><br><small style="color:#6EE7B7;">Validasi Absah (${log.discrepancyKm} km)</small>`;
        actionBtn = `<button class="btn-quick" style="background:rgba(16,185,129,0.18); border-color:#10B981; color:#6EE7B7; font-weight:700;" onclick="app.openAuditDetailModal('${log.id}')">✅ Sudah Divalidasi</button>`;
      } else if (log.status === 'DITOLAK') {
        auditBadge = `<span class="badge badge-danger" style="background:#EF4444; color:#fff; font-weight:800;">❌ Ditolak / Teguran Propam</span><br><small style="color:#FCA5A5;">Manipulasi ${log.discrepancyKm} km dari TKP</small>`;
        actionBtn = `<button class="btn-quick" style="background:rgba(239,68,68,0.22); border-color:#EF4444; color:#FCA5A5; font-weight:700;" onclick="app.openAuditDetailModal('${log.id}')">⚠️ Berkas Ditolak</button>`;
        rowStyle = 'background: rgba(239, 68, 68, 0.12);';
      } else if (log.status === 'KLARIFIKASI') {
        auditBadge = `<span class="badge badge-warning" style="background:#F59E0B; color:#000; font-weight:800;">📞 Panggilan Klarifikasi HT</span><br><small style="color:#FCD34D;">Menunggu Keterangan Anggota</small>`;
        actionBtn = `<button class="btn-quick" style="background:rgba(245,158,11,0.22); border-color:#F59E0B; color:#FCD34D; font-weight:700;" onclick="app.openAuditDetailModal('${log.id}')">📞 Panggil Lagi</button>`;
        rowStyle = 'background: rgba(245, 158, 11, 0.1);';
      } else {
        // Status MENUNGGU
        if (log.auditVerdict === 'MISMATCH_ALERT') {
          auditBadge = `<span class="badge badge-danger">🚨 Mismatch (${log.discrepancyKm} km dari TKP)</span><br><small style="color:#FCA5A5;">Perlu Sidak Pimpinan!</small>`;
          actionBtn = `<button class="btn-quick btn-danger-outline" style="box-shadow:0 0 10px rgba(239,68,68,0.4); font-weight:700;" onclick="app.openAuditDetailModal('${log.id}')">⚠️ Sidak Audit</button>`;
          rowStyle = 'background: rgba(239, 68, 68, 0.08);';
        } else {
          auditBadge = `<span class="badge badge-info">⏳ Menunggu Verifikasi</span><br><small style="color:var(--text-muted);">Selisih GPS: ${log.discrepancyKm} km</small>`;
          actionBtn = `<button class="btn-quick" onclick="app.openAuditDetailModal('${log.id}')">🔍 Verifikasi</button>`;
        }
      }

      return `
        <tr style="${rowStyle}">
          <td>
            <span class="table-code">${log.id}</span><br>
            <small style="color:var(--text-muted)">${log.time}</small>
          </td>
          <td>
            <strong>${log.officerName}</strong><br>
            <span class="badge badge-gold" style="font-size:9px; padding:2px 6px;">${log.type}</span>
          </td>
          <td>
            <div style="font-size:12px;"><strong>Klaim Anggota:</strong> ${log.locationClaimed}</div>
            <div style="font-size:11px; color:${log.discrepancyKm > 0.5 ? '#F87171' : '#34D399'};">
              📍 <strong>Sensor GPS:</strong> ${log.locationGpsAddress || this.getAddressFromCoords(log.locationGps.lat, log.locationGps.lng)}
            </div>
          </td>
          <td>${auditBadge}</td>
          <td>${actionBtn}</td>
        </tr>
      `;
    }).join('');
  }

  // --- CONFIG MODULE: HOTSPOTS & PATROL ROUTES ---

  // ============================================================================
  // PIMPINAN DASHBOARD: RINGKASAN TITIK RAWAN AKTIF (HOTSPOT SUMMARY)
  // Menampilkan daftar zona kerawanan kamtibmas beserta alamat riil & jam rawan
  // ============================================================================
  renderPimpinanHotspotsSummary() {
    const summaryList = document.getElementById('pimpinan-hotspot-summary-list');
    if (!summaryList) return;

    const hotspots = (this.state.hotspots && this.state.hotspots.length > 0) 
      ? this.state.hotspots 
      : INITIAL_DATA.hotspots;

    summaryList.innerHTML = hotspots.slice(0, 4).map(hs => {
      const riskLevel = hs.level || hs.risk || 'TINGGI';
      const isCritical = riskLevel === 'SANGAT_RAWAN' || riskLevel === 'KRITIS';
      const isHigh = riskLevel === 'TINGGI';
      const badgeClass = isCritical ? 'badge-danger' : (isHigh ? 'badge-warning' : 'badge-gold');
      const badgeText = isCritical ? 'SANGAT RAWAN' : (isHigh ? 'TINGGI' : 'SEDANG');
      const address = hs.address || this.getAddressFromCoords(hs.lat, hs.lng, hs.name);

      return `
        <div style="background:#0B1424; border:1px solid var(--card-border); border-left:3px solid ${isCritical ? '#EF4444' : '#F59E0B'}; padding:10px 12px; border-radius:var(--radius-sm); margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div style="font-size:12.5px; font-weight:700; color:#fff; display:flex; align-items:center; gap:6px;">
              <span>🚨</span> ${hs.name}
            </div>
            <div style="font-size:11px; color:#cbd5e1; margin-top:2px;">
              📍 ${address}
            </div>
            <div style="font-size:10.5px; color:var(--text-muted); margin-top:2px;">
              Kategori: <strong>${hs.category || 'Rawan Kamtibmas'}</strong> &bull; Radius: ${hs.radius || 250}m &bull; Jam: ${hs.hours || '24 Jam'}
            </div>
          </div>
          <div style="text-align:right;">
            <span class="badge ${badgeClass}" style="font-size:9.5px; font-weight:700;">${badgeText}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  renderConfigHotspotsTable() {
    const tbody = document.getElementById('cfg-hotspots-tbody');
    const summaryList = document.getElementById('pimpinan-hotspot-summary-list');
    
    if (tbody) {
      tbody.innerHTML = this.state.hotspots.map(hs => {
        let riskBadge = hs.risk === 'SANGAT_RAWAN' ? '<span class="badge badge-danger">Sangat Rawan</span>' : (hs.risk === 'TINGGI' ? '<span class="badge badge-warning">Tinggi</span>' : '<span class="badge badge-info">Sedang</span>');
        return `
          <tr>
            <td>
              <strong>${hs.name}</strong><br>
              <small style="color:var(--accent-gold)">${hs.category} &bull; Jam: ${hs.hours}</small>
            </td>
            <td>
              <div style="font-size:12px; color:#fff; font-weight:700;">📍 ${hs.address || this.getAddressFromCoords(hs.lat, hs.lng, hs.name)}</div>
              <small style="color:var(--text-muted)">Radius Pantau: ${hs.radius} meter</small>
            </td>
            <td>${riskBadge}</td>
            <td>
              <button class="btn-remove-item" onclick="app.deleteHotspot('${hs.id}')" title="Hapus Titik Rawan">🗑️ Hapus</button>
            </td>
          </tr>
        `;
      }).join('');
    }

    this.renderPimpinanHotspotsSummary();
  }

  submitNewHotspot() {
    const name = document.getElementById('cfg-hotspot-name').value.trim();
    const category = document.getElementById('cfg-hotspot-category').value;
    const risk = document.getElementById('cfg-hotspot-risk').value;
    const lat = parseFloat(document.getElementById('cfg-hotspot-lat').value);
    const lng = parseFloat(document.getElementById('cfg-hotspot-lng').value);
    const radius = parseInt(document.getElementById('cfg-hotspot-radius').value) || 250;
    const hours = document.getElementById('cfg-hotspot-hours').value.trim() || "24 Jam";
    const notes = document.getElementById('cfg-hotspot-notes').value.trim() || "-";

    if (!name || isNaN(lat) || isNaN(lng)) {
      alert("Mohon lengkapi Nama Titik Kerawanan dan Koordinat Lat/Lng.");
      return;
    }

    const newHs = {
      id: `HS-0${this.state.hotspots.length + 1}`,
      name: name,
      category: category,
      lat: lat,
      lng: lng,
      radius: radius,
      risk: risk,
      hours: hours,
      notes: notes
    };

    this.state.hotspots.push(newHs);
    this.saveState();

    // Reset form
    document.getElementById('cfg-hotspot-name').value = '';
    document.getElementById('cfg-hotspot-lat').value = '';
    document.getElementById('cfg-hotspot-lng').value = '';

    this.showToast(`Titik Rawan baru "${name}" berhasil ditambahkan dan disinkronkan ke seluruh peta patroli!`, 'success');
    this.renderConfigHotspotsTable();
    this.drawTacticalCanvas('tactical-canvas');
  }

  deleteHotspot(id) {
    if (confirm("Hapus titik kerawanan ini dari peta pantau?")) {
      this.state.hotspots = this.state.hotspots.filter(h => h.id !== id);
      this.saveState();
      this.renderConfigHotspotsTable();
      this.drawTacticalCanvas('tactical-canvas');
      this.showToast("Titik rawan berhasil dihapus.", "info");
    }
  }

  renderCheckpointsList() {
    const listEl = document.getElementById('cfg-checkpoints-list');
    if (!listEl) return;

    listEl.innerHTML = this.state.checkpoints.map((cp, idx) => `
      <li class="checkpoint-stepper-item">
        <div style="display:flex; align-items:center;">
          <span class="checkpoint-order-badge">${idx + 1}</span>
          <div>
            <div style="font-size:12px; font-weight:700; color:#fff;">${cp.name}</div>
            <div style="font-size:11px; color:#cbd5e1;">📍 ${cp.address || this.getAddressFromCoords(cp.lat, cp.lng, cp.name)}</div><div style="font-size:10px; color:var(--text-muted);">Target: ${cp.timeTarget || 'Fleksibel'}</div>
          </div>
        </div>
        <button class="btn-remove-item" onclick="app.removePatrolCheckpoint(${idx})" title="Hapus checkpoint">&times;</button>
      </li>
    `).join('');
  }

  addPatrolCheckpoint() {
    const name = document.getElementById('cfg-cp-name').value.trim();
    const lat = parseFloat(document.getElementById('cfg-cp-lat').value);
    const lng = parseFloat(document.getElementById('cfg-cp-lng').value);

    if (!name || isNaN(lat) || isNaN(lng)) {
      alert("Mohon masukkan nama pos checkpoint dan koordinat lat/lng yang valid.");
      return;
    }

    this.state.checkpoints.push({
      id: Date.now(),
      name: name,
      address: address,
      lat: lat,
      lng: lng,
      timeTarget: "Sesuai Dinamika"
    });

    document.getElementById('cfg-cp-name').value = '';
    document.getElementById('cfg-cp-lat').value = '';
    document.getElementById('cfg-cp-lng').value = '';

    this.renderCheckpointsList();
    this.showToast(`Checkpoint "${name}" ditambahkan ke urutan rute.`, 'info');
  }

  removePatrolCheckpoint(index) {
    this.state.checkpoints.splice(index, 1);
    this.renderCheckpointsList();
  }

  applyPatrolRouteToOfficer() {
    if (this.state.systemAuditLogs) {
      const unitKey = this.selectedPatrolUnit || 'SAMAPTA_AHMAD';
      const fa = this.state.fleetAssignments && this.state.fleetAssignments.find(f => f.unitKey === unitKey);
      const officer = fa ? fa.officerName : 'Bripka Ahmad Subagyo';
      const vehicle = fa ? fa.vehicleName : 'Sedan Samapta 110-A';
      const route = fa ? fa.routeName : 'Beat 1';

      this.state.systemAuditLogs.unshift({
        id: 'AUD-' + Date.now(),
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB',
        user: 'Kompol Wahyu Santoso (Kabag Ops)',
        action: 'ROUTE_AMENDMENT',
        module: 'RENOPS_TURJAWALI',
        details: 'Re-plotting rute dinamis disahkan untuk ' + officer + ' (' + vehicle + ') pada ' + route + '. Log histori kunjungan pos & rekam jejak GPS sebelumnya tetap tersimpan utuh (Prinsip Immutability WORM).',
        status: 'SUCCESS'
      });
    }

    this.saveState();
    this.drawTacticalCanvas('tactical-canvas');
    this.drawTacticalCanvas('personil-canvas');
    this.showToast("Rute patroli dan urutan checkpoint berhasil diperbarui dan disinkronkan ke layar anggota lapangan! Log sebelumnya tetap terjaga utuh.", "success");
  }

  // --- ROLE: PERSONIL LAPANGAN ---
  renderPersonilView() {
    // Dynamic Officer Device Binding Badge & Status
    const ahmadUser = (this.state.systemUsers && this.state.systemUsers.find(u => u.nrp === '88123456')) || {
      deviceBinding: { status: 'TERIKAT', model: 'Samsung Galaxy XCover 5 Enterprise' }
    };
    const dev = ahmadUser.deviceBinding || { status: 'TERIKAT', model: 'Samsung Galaxy XCover 5 Enterprise' };
    const devBadgeEl = document.getElementById('officer-device-badge');
    const unboundAlert = document.getElementById('officer-device-unbound-alert');
    const revokedAlert = document.getElementById('officer-device-revoked-alert');

    if (devBadgeEl) {
      if (dev.status === 'BELUM_TERIKAT') {
        devBadgeEl.className = 'badge badge-warning';
        devBadgeEl.style.cssText = 'background:#F59E0B; color:#000; font-weight:800; border:1px solid #D97706; cursor:pointer;';
        devBadgeEl.innerHTML = `⚠️ Gawai Belum Terikat: Menunggu Otorisasi Si TIK (Klik untuk Scan QR)`;
        devBadgeEl.onclick = () => this.openOfficerDevicePairingModal();
        if (unboundAlert) unboundAlert.style.display = 'flex';
        if (revokedAlert) revokedAlert.style.display = 'none';
      } else if (dev.status === 'DIBEKUKAN') {
        devBadgeEl.className = 'badge badge-danger';
        devBadgeEl.style.cssText = 'background:#EF4444; color:#fff; font-weight:800; border:1px solid #DC2626;';
        devBadgeEl.innerHTML = `🚨 Akses Gawai Dibekukan / Dicabut (Si TIK / Propam)`;
        devBadgeEl.onclick = null;
        if (unboundAlert) unboundAlert.style.display = 'none';
        if (revokedAlert) revokedAlert.style.display = 'flex';
      } else {
        devBadgeEl.className = 'badge';
        devBadgeEl.style.cssText = 'background:rgba(192,132,252,0.2); border:1px solid #C084FC; color:#E9D5FF; font-weight:700;';
        devBadgeEl.innerHTML = `📱 Gawai Terikat: ${dev.model} (Anti-Mock GPS Aktif)`;
        devBadgeEl.onclick = null;
        if (unboundAlert) unboundAlert.style.display = 'none';
        if (revokedAlert) revokedAlert.style.display = 'none';
      }
    }

    document.getElementById('officer-log-kirim').textContent = this.state.officerStats.logKirim;
    document.getElementById('officer-log-disetujui').textContent = this.state.officerStats.logDisetujui;
    document.getElementById('officer-log-menunggu').textContent = this.state.officerStats.logMenunggu;
    document.getElementById('officer-kpi-val').textContent = `${this.state.officerStats.kpiPercent}%`;

    const officerTableBody = document.getElementById('officer-logbook-tbody');
    if (officerTableBody) {
      officerTableBody.innerHTML = this.state.eLogbook.map(log => {
        let statusBadge = '';
        if (log.status === 'DISETUJUI') statusBadge = '<span class="badge badge-success">✅ Disetujui Kanit</span>';
        else if (log.status === 'DITOLAK') statusBadge = '<span class="badge badge-danger">❌ Ditolak</span>';
        else statusBadge = '<span class="badge badge-warning">⏳ Menunggu Verifikasi</span>';

        return `
          <tr>
            <td>
              <span class="table-code">${log.id}</span><br>
              <small style="color:var(--text-muted)">${log.time}</small>
            </td>
            <td><span class="badge badge-gold">${log.type}</span></td>
            <td><strong>${log.title}</strong></td>
            <td><small>📍 ${log.locationClaimed}</small></td>
            <td>${statusBadge}</td>
          </tr>
        `;
      }).join('');
    }

    const feedContainer = document.getElementById('officer-activity-feed');
    if (feedContainer) {
      feedContainer.innerHTML = this.state.eLogbook.map(item => {
        let statusBadge = item.status === 'DISETUJUI' 
          ? `<span class="badge badge-success" style="font-size:9px;">Disetujui</span>`
          : (item.status === 'DITOLAK' ? `<span class="badge badge-danger" style="font-size:9px;">Ditolak</span>` : `<span class="badge badge-warning" style="font-size:9px;">Menunggu</span>`);

        return `
          <div class="activity-feed-item">
            <div class="activity-time">${item.time}</div>
            <div class="activity-info">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <div class="activity-title">${item.title}</div>
                ${statusBadge}
              </div>
              <div class="activity-desc">📍 ${item.locationClaimed}</div>
            </div>
          </div>
        `;
      }).join('');
    }

    const taskContainer = document.getElementById('officer-assigned-task');
    if (taskContainer) {
      const activeTask = this.state.complaints.find(c => 
        c.assignedOfficer && 
        c.assignedOfficer.nrp === '88123456' && 
        c.status !== 'SELESAI'
      );

      if (activeTask) {
        let statusBadge = '';
        let actionButtons = '';
        let statusDesc = '';

        if (activeTask.status === 'DISPOSISI') {
          statusBadge = `<span class="badge badge-warning" style="background:#F59E0B; color:#000; font-weight:800; font-size:11px; padding:6px 12px; border-radius:14px;">⏳ DISPOSISI (MENUNGGU KEBERANGKATAN)</span>`;
          statusDesc = `Perintah tugas baru masuk dari Pimpinan/Kabag Ops. Wajib konfirmasi kesiapan dan unggah bukti foto armada sebelum meluncur ke TKP.`;
          actionButtons = `
            <button class="btn-primary" style="flex:1; font-size:13px; padding:12px; background:linear-gradient(135deg, #F59E0B, #D97706); color:#fff; font-weight:700; box-shadow:0 0 15px rgba(245,158,11,0.4);" onclick="app.openDepartureModal('${activeTask.id}')">
              🚔 Terima Tugas & Unggah Bukti Keberangkatan Armada
            </button>
          `;
        } else if (activeTask.status === 'MENUJU_TKP') {
          statusBadge = `<span class="badge badge-info" style="font-size:11px; padding:6px 12px; border-radius:14px;">🚔 PETUGAS BERGERAK / MELUNCUR</span>`;
          statusDesc = `Armada sedang meluncur menuju lokasi kejadian. Begitu tiba di lokasi, wajib laporkan kedatangan dan olah TKP awal berkoordinat GPS.`;
          actionButtons = `
            <button class="btn-primary" style="flex:1; font-size:13px; padding:12px; background:linear-gradient(135deg, #3B82F6, #1D4ED8); font-weight:700; box-shadow:0 0 15px rgba(59,130,246,0.4);" onclick="app.openTptkpModal('${activeTask.id}')">
              📍 Tiba di Lokasi & Unggah Bukti Kedatangan / Olah TKP
            </button>
          `;
        } else if (activeTask.status === 'PENANGANAN_TKP') {
          statusBadge = `<span class="badge badge-gold" style="font-size:11px; padding:6px 12px; border-radius:14px;">🔍 SEDANG PENANGANAN DI LOKASI TKP</span>`;
          statusDesc = `Petugas sedang melakukan penanganan perkara di TKP. Lakukan pengamanan barang bukti, mediasi warga, dan terbitkan Berita Acara sah.`;
          actionButtons = `
            <button class="btn-primary" style="flex:1; font-size:13px; padding:12px; background:linear-gradient(135deg, #10B981, #059669); font-weight:700; box-shadow:0 0 15px rgba(16,185,129,0.4);" onclick="app.openCompleteTaskModal('${activeTask.id}')">
              ✅ Validasi Barang Bukti & Selesaikan Tugas
            </button>
          `;
        }

        taskContainer.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:flex-start;">
            <div>
              <span class="badge badge-danger" style="font-size:10px;">🚨 PANGGILAN DARURAT 110 AKTIF</span>
              <span class="table-code" style="margin-left:8px;">${activeTask.id}</span>
              <h3 style="font-size:16px; font-weight:800; color:#fff; margin-top:6px;">${activeTask.title}</h3>
              <p style="font-size:12px; color:var(--text-secondary); margin-top:2px;">📍 ${activeTask.locationName}</p>
              <p style="font-size:11px; color:var(--text-muted); margin-top:2px;">👤 Pelapor: ${activeTask.reporter} (${activeTask.phone})</p>
              <p style="font-size:11.5px; color:#FCD34D; margin-top:8px; background:rgba(245,158,11,0.15); padding:8px 12px; border-radius:6px; border-left:3px solid #F59E0B;">
                ℹ️ <strong>Status Alur:</strong> ${statusDesc}
              </p>
            </div>
            <div style="text-align:right;">
              ${statusBadge}
            </div>
          </div>

          <div style="display:flex; gap:10px; margin-top:16px;">
            ${actionButtons}
            <button class="btn-secondary" style="padding:10px 14px; font-size:12px;" onclick="app.viewComplaintDetail('${activeTask.id}')">
              📄 Riwayat Bukti Kasus
            </button>
          </div>
        `;
      } else {
        taskContainer.innerHTML = `
          <div style="text-align:center; padding:16px 8px; color:var(--text-muted); font-size:13px;">
            ✅ Tidak ada tugas darurat 110 baru saat ini. Personel tetap siaga patroli dan sambang wilayah.
          </div>
        `;
      }
    }
  }

  // ============================================================================
  // TAHAP 2: BUKTI KEBERANGKATAN ARMADA (DISPOSISI -> MENUJU_TKP)
  // ============================================================================
  openDepartureModal(complaintId) {
    const c = this.state.complaints.find(item => item.id === complaintId);
    if (!c) return;

    document.getElementById('departure-complaint-id').value = c.id;
    document.getElementById('departure-complaint-title').textContent = `${c.id} - ${c.title}`;
    document.getElementById('departure-complaint-loc').textContent = `📍 Lokasi Sasaran: ${c.locationName}`;
    this.openModal('modal-departure-evidence');
  }

  submitDepartureEvidence() {
    const cId = document.getElementById('departure-complaint-id').value;
    const c = this.state.complaints.find(item => item.id === cId);
    if (!c) return;

    const armada = document.getElementById('departure-armada-select').value;
    const notes = document.getElementById('departure-notes').value.trim();
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    c.status = 'MENUJU_TKP';
    c.timeline.push({
      stage: "MENUJU_TKP",
      time: timeStr,
      title: "3. Petugas Menerima Tugas & Meluncur Menuju Lokasi (TKP)",
      desc: `Personel ${c.assignedOfficer ? c.assignedOfficer.name : 'Bripka Ahmad'} telah mengonfirmasi tugas dan meluncur dari Mako dengan armada: ${armada}. ${notes}`,
      attachments: [
        { 
          type: "PHOTO", 
          title: `Foto Keberangkatan Armada (${armada})`, 
          meta: `Stempel GPS Mako: -6.2015, 106.8195 • Jam: ${timeStr} WIB`, 
          icon: "🚔", 
          url: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=600&q=80" 
        }
      ]
    });

    this.saveState();
    this.closeAllModals();
    this.showToast(`Tugas diterima! Bukti armada terunggah. Status: MENUJU_TKP (Petugas Bergerak).`, 'success');
  }

  openTptkpModal(complaintId) {
    const c = this.state.complaints.find(item => item.id === complaintId);
    if (!c) return;

    document.getElementById('tptkp-complaint-id').value = c.id;
    document.getElementById('tptkp-complaint-title').textContent = `${c.id} - ${c.title}`;
    document.getElementById('tptkp-complaint-loc').textContent = `Lokasi TKP: ${c.locationName}`;
    this.openModal('modal-tptkp-evidence');
  }

  submitTptkpEvidence() {
    const cId = document.getElementById('tptkp-complaint-id').value;
    const notes = document.getElementById('tptkp-action-notes').value.trim() || "Petugas tiba di lokasi dan melakukan olah TKP awal.";
    const c = this.state.complaints.find(item => item.id === cId);
    if (!c) return;

    c.status = 'PENANGANAN_TKP';
    c.timeline.push({
      stage: "PENANGANAN_TKP",
      time: "15:52",
      title: "3. Tiba di TKP & Tindakan Pertama (TP-TKP)",
      desc: notes,
      attachments: [
        { 
          type: "PHOTO", 
          title: "Foto Olah TKP Awal & Wawancara Saksi", 
          meta: `Alamat TKP: ${c.locationName} (Akurasi Tinggi)`, 
          icon: "📸", 
          url: "https://images.unsplash.com/photo-1590856029826-c7a73142bbf1?auto=format&fit=crop&w=600&q=80" 
        }
      ]
    });

    this.saveState();
    this.closeAllModals();
    this.showToast("Bukti olah TKP berhasil diunggah! Status: Sedang Dalam Penanganan.", "success");
  }

  openCompleteTaskModal(complaintId) {
    document.getElementById('complete-task-id').value = complaintId;
    this.openModal('modal-complete-task');
  }

  submitCompleteTask() {
    const cId = document.getElementById('complete-task-id').value;
    const notes = document.getElementById('complete-task-notes').value.trim() || "Penanganan kepolisian selesai dilaksanakan dengan tertib.";
    const c = this.state.complaints.find(item => item.id === cId);
    if (!c) return;

    c.status = 'SELESAI';
    c.timeline.push({
      stage: "SELESAI",
      time: "16:15",
      title: "4. Penanganan Selesai & Berita Acara Diterbitkan",
      desc: notes,
      attachments: [
        { 
          type: "DOC", 
          title: `Berita_Acara_Penyelesaian_${c.id}.pdf`, 
          meta: "Dokumen Resmi Berita Acara Olah TKP", 
          icon: "📑", 
          url: "#" 
        }
      ]
    });

    this.saveState();
    this.closeAllModals();
    this.showToast(`Kasus ${c.id} berhasil diselesaikan dengan bukti dokumen resmi! Notifikasi terkirim ke pelapor.`, "success");
  }

  // --- MULTI-STAGE EVIDENCE TRACKING (MASYARAKAT & PIMPINAN) ---
  trackComplaint(query) {
    if (!query) {
      this.showToast("Silakan masukkan Nomor Tiket Pengaduan 110 (misal: LP-110-2026-0042)", "warning");
      return;
    }

    const complaint = this.state.complaints.find(c => 
      c.id.toLowerCase() === query.toLowerCase() || 
      c.phone.includes(query)
    );

    if (!complaint) {
      this.showToast(`Laporan dengan nomor "${query}" tidak ditemukan.`, "danger");
      return;
    }

    document.getElementById('modal-tracking-id').textContent = complaint.id;
    document.getElementById('modal-tracking-title').textContent = complaint.title;
    document.getElementById('modal-tracking-reporter').textContent = `${complaint.reporter} (${complaint.phone})`;
    document.getElementById('modal-tracking-location').textContent = complaint.locationName;
    document.getElementById('modal-tracking-time').textContent = complaint.timestamp;

    const timelineEl = document.getElementById('modal-tracking-timeline');
    
    timelineEl.innerHTML = complaint.timeline.map((step, idx) => {
      let attachmentsHtml = '';
      if (step.attachments && step.attachments.length > 0) {
        attachmentsHtml = `
          <div class="stage-proof-container">
            <div class="stage-proof-title">
              <span>📎</span> Bukti Dokumentasi Tahap Ini (${step.attachments.length} Berkas):
            </div>
            <div class="proof-item-grid">
              ${step.attachments.map(att => `
                <div class="proof-attachment-card" onclick="app.previewMedia('${att.type}', '${att.title}', '${att.url}', '${att.meta}')">
                  <div class="proof-attachment-icon ${att.type.toLowerCase()}">${att.icon || '📄'}</div>
                  <div class="proof-attachment-text">
                    <h6>${att.title}</h6>
                    <p>${att.meta}</p>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }

      return `
        <div class="timeline-step completed">
          <div class="step-marker">✓</div>
          <div class="step-card">
            <div class="step-header">
              <div class="step-title">${step.title}</div>
              <div class="step-time">${step.time} WIB</div>
            </div>
            <div class="step-desc">${step.desc}</div>
            ${attachmentsHtml}
          </div>
        </div>
      `;
    }).join('');

    this.openModal('modal-tracking-detail');
  }

  previewMedia(type, title, url, meta) {
    const iconEl = document.getElementById('viewer-icon');
    const titleEl = document.getElementById('viewer-title');
    const bodyEl = document.getElementById('viewer-body');

    titleEl.textContent = title;

    if (type === 'PHOTO') {
      iconEl.textContent = '📸';
      bodyEl.innerHTML = `
        <div style="text-align:center;">
          <img src="${url}" style="max-width:100%; max-height:400px; border-radius:var(--radius-sm); border:1px solid var(--card-border);" alt="${title}"/>
          <p style="font-size:12px; color:var(--accent-gold); font-family:'JetBrains Mono'; margin-top:10px;">${meta}</p>
          <p style="font-size:11px; color:var(--text-secondary); margin-top:4px;">Metadata foto telah divalidasi dengan geolokasi sensor kamera lapangan Polri Presisi.</p>
        </div>
      `;
    } else if (type === 'AUDIO') {
      iconEl.textContent = '🎙️';
      bodyEl.innerHTML = `
        <div style="background:#0B1424; padding:20px; border-radius:var(--radius-sm); text-align:center; border:1px solid var(--card-border);">
          <div style="font-size:42px; margin-bottom:10px;">🔊</div>
          <h4 style="font-size:15px; color:#fff; font-weight:700;">Rekaman Audio Sentral Call Center 110</h4>
          <p style="font-size:12px; color:var(--text-secondary); margin-top:4px;">${meta}</p>
          <div style="margin-top:20px; background:#182436; padding:14px; border-radius:var(--radius-sm); display:flex; align-items:center; gap:12px;">
            <button class="btn-primary" style="padding:6px 14px; font-size:12px;" onclick="app.showToast('Memutar audio rekaman panggilan 110...', 'info')">▶ Putar Rekaman</button>
            <div style="flex:1; height:6px; background:#334155; border-radius:3px; position:relative;">
              <div style="width:40%; height:100%; background:var(--accent-gold); border-radius:3px;"></div>
            </div>
            <span style="font-size:11px; font-family:'JetBrains Mono'; color:var(--text-muted)">00:41 / 01:42</span>
          </div>
        </div>
      `;
    } else if (type === 'DOC') {
      iconEl.textContent = '📑';
      bodyEl.innerHTML = `
        <div style="background:#0B1424; padding:20px; border-radius:var(--radius-sm); text-align:center; border:1px solid var(--card-border);">
          <div style="font-size:48px; margin-bottom:10px;">📄</div>
          <h4 style="font-size:15px; color:#fff; font-weight:700;">${title}</h4>
          <p style="font-size:12px; color:var(--text-secondary); margin-top:4px;">${meta}</p>
          <div style="margin-top:20px; display:flex; justify-content:center; gap:12px;">
            <button class="btn-primary" onclick="app.showToast('Mengunduh salinan berkas resmi (PDF)...', 'success')">📥 Unduh Berkas PDF</button>
            <button class="btn-secondary" onclick="app.showToast('Tanda tangan digital BSrE divalidasi SAH', 'info')">🔏 Cek Validasi TTD Digital</button>
          </div>
        </div>
      `;
    } else {
      iconEl.textContent = '🎥';
      bodyEl.innerHTML = `
        <div style="background:#0B1424; padding:20px; border-radius:var(--radius-sm); text-align:center; border:1px solid var(--card-border);">
          <div style="font-size:48px; margin-bottom:10px;">📹</div>
          <h4 style="font-size:15px; color:#fff; font-weight:700;">Rekaman Video Barang Bukti</h4>
          <p style="font-size:12px; color:var(--text-secondary); margin-top:4px;">${meta}</p>
          <button class="btn-primary" style="margin-top:16px;" onclick="app.showToast('Memutar video bukti olah TKP...', 'info')">▶ Putar Video Player</button>
        </div>
      `;
    }

    this.openModal('modal-media-viewer');
  }

  // --- GENERAL FUNCTIONS ---
  switchCitizenAccount(phone) {
    if (phone === 'GUEST' || phone === 'BARU') {
      this.isCitizenGuest = true;
      this.currentCitizen = { name: "Pengunjung / Tamu Publik", phone: null };
      this.showToast("Beralih ke Mode Tamu. Laporan disembunyikan demi privasi warga.", "info");
    } else {
      this.isCitizenGuest = false;
      const normPhone = (p) => (p || '').replace(/[^0-9]/g, '');
      const cleanPhone = normPhone(phone);
      const existing = this.state.complaints.find(c => normPhone(c.phone) === cleanPhone);

      let name = existing ? existing.reporter : "Warga Terverifikasi";
      if (phone.includes('8877')) name = "H. Ridwan (Ketua RT 04)";
      else if (phone.includes('9900')) name = "Ibu Mariam";
      else if (phone.includes('9844')) name = "Bambang Sudirjo";

      this.currentCitizen = { name: name, phone: phone };
      this.showToast(`Beralih ke akun pelapor: ${name} (${phone})`, 'info');
    }

    this.updateCitizenAccountUI();
    this.renderPublicRecentReports();
  }

  toggleCitizenAuth() {
    if (this.isCitizenGuest || !this.currentCitizen || !this.currentCitizen.phone) {
      this.openCitizenOtpModal();
    } else {
      this.switchCitizenAccount('GUEST');
    }
  }

  updateCitizenAccountUI() {
    const nameEl = document.getElementById('citizen-active-name');
    const phoneEl = document.getElementById('citizen-active-phone');
    const badgeEl = document.getElementById('citizen-active-badge');
    const authBtn = document.getElementById('btn-citizen-auth-action');
    const selector = document.getElementById('citizen-account-selector');

    if (this.isCitizenGuest || !this.currentCitizen || !this.currentCitizen.phone) {
      if (nameEl) nameEl.textContent = "Pengunjung / Tamu Publik";
      if (phoneEl) phoneEl.textContent = "🌐 Mode Tamu (Belum Terverifikasi No. HP)";
      if (badgeEl) {
        badgeEl.className = "badge badge-warning";
        badgeEl.textContent = "Mode Tamu";
      }
      if (authBtn) {
        authBtn.innerHTML = "📲 Masuk via No. HP & OTP";
        authBtn.style.background = "rgba(245,158,11,0.22)";
        authBtn.style.borderColor = "#F59E0B";
        authBtn.style.color = "#FCD34D";
      }
      if (selector) selector.value = "GUEST";
    } else {
      if (nameEl) nameEl.textContent = this.currentCitizen.name;
      if (phoneEl) phoneEl.textContent = '📞 ' + this.currentCitizen.phone;
      if (badgeEl) {
        badgeEl.className = "badge badge-success";
        badgeEl.textContent = "Terverifikasi 110";
      }
      if (authBtn) {
        authBtn.innerHTML = "🚪 Keluar (Ke Mode Tamu)";
        authBtn.style.background = "rgba(239,68,68,0.18)";
        authBtn.style.borderColor = "#EF4444";
        authBtn.style.color = "#FCA5A5";
      }
      if (selector) {
        let found = false;
        for (let opt of selector.options) {
          if (opt.value === this.currentCitizen.phone) {
            selector.value = opt.value;
            found = true;
            break;
          }
        }
        if (!found) {
          const newOpt = document.createElement('option');
          newOpt.value = this.currentCitizen.phone;
          newOpt.textContent = `👤 ${this.currentCitizen.name} (${this.currentCitizen.phone}) • Laporan Baru`;
          selector.appendChild(newOpt);
          selector.value = this.currentCitizen.phone;
        }
      }
    }
  }

  renderPublicRecentReports() {
    const listEl = document.getElementById('citizen-my-tickets-list');
    const countEl = document.getElementById('citizen-ticket-count');
    if (!listEl) return;

    // 1. GUEST MODE: Absolutely NO complaints shown!
    if (this.isCitizenGuest || !this.currentCitizen || !this.currentCitizen.phone) {
      if (countEl) countEl.textContent = '0';
      listEl.innerHTML = `
        <div style="background:#0F172A; border:1px solid rgba(245,158,11,0.35); border-radius:var(--radius-sm); padding:32px 20px; text-align:center;">
          <div style="width:58px; height:58px; border-radius:50%; background:rgba(245,158,11,0.15); border:2px solid #F59E0B; display:flex; align-items:center; justify-content:center; font-size:26px; margin:0 auto 14px auto;">
            🔒
          </div>
          <div style="display:inline-block; background:rgba(245,158,11,0.15); border:1px solid #F59E0B; color:#FCD34D; font-size:11px; font-weight:800; padding:3px 12px; border-radius:12px; margin-bottom:10px;">
            MODE TAMU / PENGUNJUNG PUBLIK (BELUM LOGIN)
          </div>
          <h4 style="font-size:16px; font-weight:800; color:#fff; margin-bottom:6px;">Tidak Ada Kasus yang Ditampilkan</h4>
          <p style="font-size:12px; color:#cbd5e1; max-width:520px; margin:0 auto 18px auto; line-height:1.6;">
            Sesuai standar UU Perlindungan Data Pribadi (UU PDP) & Presisi Polri 110, riwayat laporan warga bersifat rahasia. <strong>Dalam Mode Tamu, tidak ada kasus yang ditampilkan</strong> demi melindungi privasi seluruh pelapor.
          </p>
          <div style="display:flex; justify-content:center; gap:10px; flex-wrap:wrap;">
            <button type="button" class="btn-primary" style="background:#F59E0B; color:#000; font-weight:700; font-size:12px; padding:9px 18px;" onclick="app.openCitizenOtpModal()">
              📲 Masuk via No. HP & OTP WhatsApp
            </button>
            <button type="button" class="btn-primary" style="background:#0284C7; font-size:12px; padding:9px 18px;" onclick="app.openModal('modal-public-new-report')">
              ➕ Buat Laporan Pengaduan Baru (110)
            </button>
          </div>
          <div style="margin-top:18px; font-size:11px; color:#94a3b8; border-top:1px dashed rgba(255,255,255,0.1); padding-top:14px;">
            💡 <em>Punya Nomor Tiket?</em> Masukkan Nomor Tiket & Nomor HP pada panel <strong>Pencarian Spesifik</strong> di sebelah kanan untuk melacak kasus Anda.
          </div>
        </div>
      `;
      return;
    }

    // 2. AUTHENTICATED CITIZEN (Logged in via Phone Number)
    const normPhone = (p) => (p || '').replace(/[^0-9]/g, '');
    const myPhoneNorm = normPhone(this.currentCitizen.phone);

    // PRIVACY FILTER: Only tickets that match this citizen's phone number!
    const myTickets = this.state.complaints.filter(c => normPhone(c.phone) === myPhoneNorm);

    if (countEl) countEl.textContent = myTickets.length;

    if (myTickets.length === 0) {
      listEl.innerHTML = `
        <div style="background:#131F33; border:1px solid var(--card-border); border-radius:var(--radius-sm); padding:28px 20px; text-align:center;">
          <div style="font-size:36px; margin-bottom:8px;">📭</div>
          <h4 style="font-size:14px; font-weight:700; color:#fff;">Belum Ada Pengaduan Terdaftar untuk Nomor Ini</h4>
          <p style="font-size:12px; color:var(--text-secondary); margin-top:4px;">Nomor (${this.currentCitizen.phone}) belum memiliki riwayat laporan aktif. Klik tombol di bawah jika Anda ingin membuat laporan baru.</p>
          <button class="btn-primary" style="margin-top:14px; font-size:12px; background:#0284C7;" onclick="app.openModal('modal-public-new-report')">+ Buat Pengaduan Darurat Baru</button>
        </div>
      `;
      return;
    }

    listEl.innerHTML = myTickets.map(c => {
      let badge = '';
      if (c.status === 'SELESAI') badge = '<span class="badge badge-success">✅ Selesai Ditangani</span>';
      else if (c.status === 'PENANGANAN_TKP') badge = '<span class="badge badge-gold">🔍 Olah TKP di Lokasi</span>';
      else if (c.status === 'MENUJU_TKP') badge = '<span class="badge badge-info">🚔 Petugas Menuju Lokasi</span>';
      else badge = '<span class="badge badge-warning">⏳ Menunggu Disposisi</span>';

      return `
        <div style="background:#182436; border:1px solid rgba(255,255,255,0.08); border-radius:var(--radius-sm); padding:16px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; cursor:pointer; transition:border-color 0.2s;" onclick="app.trackComplaint('${c.id}')">
          <div>
            <div style="display:flex; align-items:center; gap:10px;">
              <span class="table-code">${c.id}</span>
              ${badge}
            </div>
            <div style="font-size:14px; font-weight:800; color:#fff; margin-top:6px;">${c.title}</div>
            <div style="font-size:12px; color:var(--text-secondary); margin-top:3px;">📍 ${c.locationName}</div>
            <div style="font-size:11px; color:var(--text-muted); margin-top:3px;">⏰ Dilaporkan: ${c.timestamp} &bull; Bukti Penanganan Terlampir</div>
          </div>
          <button class="btn-primary" style="padding:6px 14px; font-size:12px;" onclick="event.stopPropagation(); app.trackComplaint('${c.id}')">
            Lihat Progres & Bukti &rarr;
          </button>
        </div>
      `;
    }).join('');
  }

  handleDualVerificationSearch() {
    const ticketId = document.getElementById('dual-search-ticket').value.trim();
    const phoneInput = document.getElementById('dual-search-phone').value.trim();

    if (!ticketId || !phoneInput) {
      alert("Mohon isi Nomor Tiket dan Nomor Telepon pelapor.");
      return;
    }

    const complaint = this.state.complaints.find(c => c.id.toLowerCase() === ticketId.toLowerCase());

    if (!complaint) {
      alert("Nomor tiket '" + ticketId + "' tidak ditemukan dalam sistem registrasi 110.");
      return;
    }

    const normPhone = (p) => (p || '').replace(/[^0-9]/g, '');
    const cleanComplaintPhone = normPhone(complaint.phone);
    const cleanInputPhone = normPhone(phoneInput);

    // STRICT PRIVACY CHECK: Phone must match!
    if (cleanComplaintPhone !== cleanInputPhone) {
      alert(`⛔ AKSES DITOLAK DEMI PRIVASI PELAPOR!

Nomor telepon yang Anda masukkan (${phoneInput}) TIDAK COCOK dengan nomor pelapor yang terdaftar pada tiket ${complaint.id}.

Sesuai UU Perlindungan Data Pribadi (UU PDP), rincian kasus dan dokumentasi foto/audio hanya dapat dibuka oleh pelapor yang sah.`);
      this.showToast("Verifikasi gagal: Nomor telepon tidak cocok dengan data pelapor!", "danger");
      return;
    }

    this.showToast("Verifikasi nomor telepon berhasil. Membuka berkas pengaduan Anda.", "success");
    this.trackComplaint(complaint.id);
  }

  openCreateLogModal(type) {
    document.getElementById('form-log-type').value = type;
    document.getElementById('modal-log-title-type').textContent = type;

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`;
    document.getElementById('form-log-time').value = timeStr;

    document.getElementById('form-log-lat').value = -6.2140;
    document.getElementById('form-log-lng').value = 106.8450;

    this.openModal('modal-create-log');
  }

  submitNewLog() {
    const type = document.getElementById('form-log-type').value;
    const title = document.getElementById('form-log-title').value.trim();
    const locationClaimed = document.getElementById('form-log-location').value.trim();
    const notes = document.getElementById('form-log-notes').value.trim();
    const time = document.getElementById('form-log-time').value;
    const isSimulateMismatch = document.getElementById('check-simulate-mismatch').checked;

    if (!title || !locationClaimed) {
      alert("Mohon lengkapi Judul Kegiatan dan Alamat/Lokasi Manual.");
      return;
    }

    let lat = -6.2140;
    let lng = 106.8450;
    let discrepancyKm = 0.05;
    let auditVerdict = "VALID";

    if (isSimulateMismatch) {
      lat = -6.2015;
      lng = 106.8195;
      discrepancyKm = 4.85;
      auditVerdict = "MISMATCH_ALERT";
    }

    const newLog = {
      id: `LOG-01${this.state.eLogbook.length + 1}`,
      type: type,
      officerName: this.currentUser ? this.currentUser.name : "Bripka Ahmad Subagyo",
      officerNrp: this.currentUser ? this.currentUser.nrp : "88123456",
      time: time,
      title: title,
      locationClaimed: locationClaimed,
      locationGps: { lat: lat, lng: lng },
      discrepancyKm: discrepancyKm,
      status: "MENUNGGU",
      auditVerdict: auditVerdict,
      photoUrl: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=600&q=80",
      notes: notes
    };

    this.state.eLogbook.unshift(newLog);
    this.state.officerStats.logKirim++;
    this.state.officerStats.logMenunggu++;
    
    this.saveState();
    this.closeAllModals();

    if (auditVerdict === 'MISMATCH_ALERT') {
      this.showToast(`Log terkirim! ⚠️ Terdeteksi deviasi GPS ${discrepancyKm} km. Log ditandai untuk audit pimpinan!`, 'warning');
    } else {
      this.showToast(`Log ${type} berhasil dikirim dengan koordinat GPS valid!`, 'success');
    }
  }

  openAuditDetailModal(logId) {
    const log = this.state.eLogbook.find(l => l.id === logId);
    if (!log) return;

    this.selectedComplaintForAudit = log;

    document.getElementById('audit-detail-id').textContent = log.id;
    document.getElementById('audit-detail-officer').textContent = `${log.officerName} (NRP ${log.officerNrp})`;
    document.getElementById('audit-detail-time').textContent = log.time;
    document.getElementById('audit-detail-type').textContent = log.type;
    document.getElementById('audit-detail-title').textContent = log.title;
    document.getElementById('audit-detail-claimed').textContent = log.locationClaimed;
    document.getElementById('audit-detail-gps').textContent = log.locationGpsAddress || this.getAddressFromCoords(log.locationGps.lat, log.locationGps.lng);
    document.getElementById('audit-detail-distance').textContent = `${log.discrepancyKm} km`;
    document.getElementById('audit-detail-notes').textContent = log.notes || '-';
    document.getElementById('audit-detail-photo').src = log.photoUrl;

    const alertBanner = document.getElementById('audit-detail-alert-box');
    if (log.status === 'DISETUJUI') {
      alertBanner.style.display = 'flex';
      alertBanner.style.borderColor = '#10B981';
      alertBanner.style.background = 'rgba(16, 185, 129, 0.15)';
      alertBanner.innerHTML = `
        <div class="audit-alert-icon">✅</div>
        <div class="audit-alert-content">
          <h4 style="color:#10B981;">LOG TELAH DISETUJUI & DIVALIDASI</h4>
          <p>Divalidasi oleh: <strong>${log.verifiedBy || 'Kapolres Metro'}</strong>. Seluruh data koordinat geolokasi dan foto dokumentasi dinyatakan absah.</p>
        </div>
      `;
    } else if (log.status === 'DITOLAK') {
      alertBanner.style.display = 'flex';
      alertBanner.style.borderColor = '#EF4444';
      alertBanner.style.background = 'rgba(239, 68, 68, 0.15)';
      alertBanner.innerHTML = `
        <div class="audit-alert-icon">🚨</div>
        <div class="audit-alert-content">
          <h4 style="color:#EF4444;">LOG DITOLAK (TEGURAN PROPAM)</h4>
          <p>Terbukti ada manipulasi lokasi geolokasi sejauh <strong>${log.discrepancyKm} km</strong> dari TKP. Berkas telah dilimpahkan ke Seksi Propam.</p>
        </div>
      `;
    } else if (log.status === 'KLARIFIKASI') {
      alertBanner.style.display = 'flex';
      alertBanner.style.borderColor = '#F59E0B';
      alertBanner.style.background = 'rgba(245, 158, 11, 0.15)';
      alertBanner.innerHTML = `
        <div class="audit-alert-icon">📞</div>
        <div class="audit-alert-content">
          <h4 style="color:#F59E0B;">MENUNGGU KLARIFIKASI ANGGOTA</h4>
          <p>Instruksi pemanggilan via HT telah dikirimkan ke <strong>${log.officerName}</strong>. Anggota diminta menghadap pimpinan.</p>
        </div>
      `;
    } else if (log.auditVerdict === 'MISMATCH_ALERT') {
      alertBanner.style.display = 'flex';
      alertBanner.style.borderColor = '#EF4444';
      alertBanner.style.background = 'rgba(239, 68, 68, 0.15)';
      alertBanner.innerHTML = `
        <div class="audit-alert-icon">🚨</div>
        <div class="audit-alert-content">
          <h4 style="color:#EF4444;">INDIKASI ANGGOTA TIDAK DI LOKASI</h4>
          <p>Personel mengklaim lokasi di "<strong>${log.locationClaimed}</strong>", namun metadata GPS perangkat saat foto diunggah terdeteksi di sekitar radius kantor/Polres (Deviasi: <strong>${log.discrepancyKm} km</strong>).</p>
        </div>
      `;
    } else {
      alertBanner.style.display = 'none';
    }

    this.openModal('modal-audit-verification');
  }

  approveAuditLog(decision) {
    if (!this.selectedComplaintForAudit) return;
    const log = this.selectedComplaintForAudit;

    if (decision === 'APPROVE') {
      log.status = 'DISETUJUI';
      log.auditVerdict = 'VALID';
      log.verifiedBy = 'Kapolres Metro';
      this.state.officerStats.logDisetujui++;
      if (this.state.officerStats.logMenunggu > 0) this.state.officerStats.logMenunggu--;
      this.showToast(`✅ Log ${log.id} (${log.officerName}) TELAH DISETUJUI & DIVALIDASI oleh Kapolres.`, 'success');
    } else if (decision === 'REJECT') {
      log.status = 'DITOLAK';
      log.auditVerdict = 'REJECTED';
      log.verifiedBy = 'Seksi Propam / Kapolres';
      if (this.state.officerStats.logMenunggu > 0) this.state.officerStats.logMenunggu--;
      this.showToast(`🚨 Log ${log.id} DITOLAK! Catatan manipulasi koordinat diteruskan ke Seksi Propam untuk tindakan etik.`, 'danger');
    } else if (decision === 'CLARIFY') {
      log.status = 'KLARIFIKASI';
      log.verifiedBy = 'Panggilan HT Pimpinan';
      this.showToast(`📞 Instruksi panggilan klarifikasi dikirim ke HT ${log.officerName}. Anggota wajib melapor ke Mako.`, 'warning');
    }

    this.saveState();
    this.closeAllModals();
    this.renderPimpinanAuditTable();
    this.renderPimpinanKpis();
    if (this.currentView === 'personil') {
      this.renderPersonilView();
    }
  }

  quickDispatchFirstPending() {
    const pending = this.state.complaints.find(c => c.status === 'BELUM_DITANGANI');
    if (!pending) {
      this.showToast("Tidak ada laporan yang berstatus Belum Ditangani saat ini.", "info");
      return;
    }

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // STATUS WAJIB DISPOSISI!
    pending.status = 'DISPOSISI';
    pending.assignedOfficer = {
      name: "Bripka Ahmad Subagyo",
      nrp: "88123456",
      unit: "Sat Samapta (Sektor Timur)",
      phone: "0811-2233-4455"
    };

    pending.timeline.push({
      stage: "DISPOSISI",
      time: timeStr,
      title: "2. Disposisi Penugasan Personel (Menunggu Keberangkatan)",
      desc: `Laporan didisposisikan secara cepat oleh Pimpinan ke Unit Samapta (Bripka Ahmad Subagyo). Menunggu konfirmasi penerimaan tugas & unggah bukti foto armada di Mako.`,
      attachments: [
        { type: "DOC", title: `Sprint_Penugasan_Presisi_${pending.id}.pdf`, meta: "Surat Perintah Disposisi Otomatis", icon: "📑", url: "#" }
      ]
    });

    this.saveState();
    this.showToast(`Kasus ${pending.id} berhasil didisposisikan ke Bripka Ahmad! Status: DISPOSISI (Menunggu Konfirmasi Personel).`, 'info');
  }

  openDispatchModal(complaintId) {
    const c = this.state.complaints.find(item => item.id === complaintId);
    if (!c) return;

    const selectEl = document.getElementById('dispatch-officer-select');
    if (selectEl) {
      const nearestOfficers = this.getNearestOfficersForComplaint(c);
      selectEl.innerHTML = nearestOfficers.map((o, idx) => `
        <option value="${o.officerNrp}" ${idx === 0 ? 'selected' : ''}>
          ${idx === 0 ? '⭐ [TERDEKAT] ' : ''}${o.officerName} (${o.callsign}) — Jarak: ${o.distanceKm} km (Est. ${o.etaMinutes} Mnt) &bull; ${o.vehicle}
        </option>
      `).join('');
    }

    document.getElementById('dispatch-complaint-id').value = c.id;
    document.getElementById('dispatch-complaint-title').textContent = `${c.id} - ${c.title}`;
    this.openModal('modal-dispatch');
  }

  submitDispatch() {
    const cId = document.getElementById('dispatch-complaint-id').value;
    const c = this.state.complaints.find(item => item.id === cId);
    if (!c) return;

    const officerSelect = document.getElementById('dispatch-officer-select');
    const officerNrp = officerSelect ? officerSelect.value : '88123456';
    const officer = this.state.systemUsers.find(u => u.nrp === officerNrp) || {
      name: "Bripka Ahmad Subagyo",
      nrp: "88123456",
      unit: "Sat Samapta (Sektor Timur)"
    };

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // STATUS WAJIB DISPOSISI (BELUM MENUJU_TKP!)
    c.status = 'DISPOSISI';
    c.assignedOfficer = {
      name: officer.name,
      nrp: officer.nrp,
      unit: officer.unit,
      phone: "0811-2233-4455"
    };

    c.timeline.push({
      stage: "DISPOSISI",
      time: timeStr,
      title: "2. Disposisi Penugasan Personel (Menunggu Keberangkatan)",
      desc: `Laporan telah didisposisikan oleh Pimpinan/Kabag Ops ke ${officer.name} (${officer.unit}). Menunggu personel mengonfirmasi penerimaan tugas dan mengunggah bukti keberangkatan armada.`,
      attachments: [
        { type: "DOC", title: `Surat_Perintah_Disposisi_${c.id}.pdf`, meta: "Surat Perintah Disposisi Dinas Presisi", icon: "📑", url: "#" }
      ]
    });

    this.saveState();
    this.closeAllModals();
    this.showToast(`Laporan ${c.id} berhasil didisposisikan ke ${officer.name}! Status: DISPOSISI (Menunggu Konfirmasi Personel).`, 'info');
  }

  simulateIncoming110Call() {
    const categories = ["Curanmor", "Laka Lantas", "Tawuran Remaja", "Pencurian Rumah"];
    const locs = [
      { name: "Jl. Veteran No. 89 Depan Apotek Sehat", lat: -6.2190, lng: 106.8410 },
      { name: "Perumahan Griya Indah Blok C3", lat: -6.2300, lng: 106.8550 }
    ];

    const pickCat = categories[Math.floor(Math.random() * categories.length)];
    const pickLoc = locs[Math.floor(Math.random() * locs.length)];
    const newId = `LP-110-2026-${String(this.state.complaints.length + 40).padStart(4, '0')}`;

    const newComplaint = {
      id: newId,
      title: `Laporan Darurat 110: Dugaan ${pickCat}`,
      reporter: "Warga Pelapor 110",
      phone: "0812-5566-7788",
      category: pickCat,
      timestamp: "2026-10-05 15:55 WIB",
      locationName: pickLoc.name,
      lat: pickLoc.lat,
      lng: pickLoc.lng,
      status: "BELUM_DITANGANI",
      priority: "DARURAT",
      assignedOfficer: null,
      timeline: [
        { 
          stage: "VERIFIKASI_110",
          time: "15:55", 
          title: "1. Panggilan Darurat 110 Masuk", 
          desc: "Laporan otomatis dicatat oleh sistem dari integrasi sentral telepon 110.",
          attachments: [
            { type: "DOC", title: "Lembar Registrasi Laka Lantas SPKT 110", meta: "Catatan Registrasi Digital", icon: "📑", url: "#" },
            { type: "PHOTO", title: "Foto Truk Boks & Separator Jalan", meta: "Dokumentasi Posisi Kendaraan", icon: "📸", url: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=600&q=80" }
          ]
        }
      ]
    };

    this.state.complaints.unshift(newComplaint);
    this.saveState();
    this.showToast(`🔔 PANGGILAN 110 MASUK BARU: ${newComplaint.title}!`, 'danger');
    if (this.currentView === 'kabagops') {
      this.renderKabagOpsView();
    } else if (this.currentView === 'pimpinan') {
      this.renderPimpinanComplaintsTable();
    } else if (this.currentView === 'operator') {
      this.renderSpktView();
    }
  }

  submitNewPublicComplaint() {
    const isLoggedIn = !this.isCitizenGuest && this.currentCitizen && this.currentCitizen.phone;

    let name = document.getElementById('public-form-name')?.value.trim();
    let phone = document.getElementById('public-form-phone')?.value.trim();

    if (isLoggedIn) {
      name = this.currentCitizen.name;
      phone = this.currentCitizen.phone;
    } else {
      // Guest mode: name and phone are mandatory!
      if (!name || !phone) {
        alert("Dalam Mode Tamu, Nama Lengkap dan Nomor WhatsApp wajib diisi agar Anda dapat melacak laporan dan menerima tiket 110.");
        return;
      }
    }

    const cat = document.getElementById('public-form-cat')?.value || 'Pengaduan Kamtibmas';
    const loc = document.getElementById('public-form-loc')?.value.trim() || 'Wilayah Hukum Polres Metro';
    const desc = document.getElementById('public-form-desc')?.value.trim();

    const lat = parseFloat(document.getElementById('public-form-lat')?.value) || -6.2146;
    const lng = parseFloat(document.getElementById('public-form-lng')?.value) || 106.8451;

    if (!desc) {
      alert("Mohon isi kronologi singkat kejadian.");
      return;
    }

    const newId = `LP-110-2026-${String(this.state.complaints.length + 45).padStart(4, '0')}`;
    const now = new Date();
    const timeStr = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`;

    const newComplaint = {
      id: newId,
      title: `${cat.split('/')[0].trim()}: ${desc.substring(0, 45)}...`,
      reporter: name,
      phone: phone,
      category: cat.split('/')[0].trim(),
      timestamp: timeStr,
      locationName: loc,
      lat: lat,
      lng: lng,
      status: "BELUM_DITANGANI",
      priority: "TINGGI",
      assignedOfficer: null,
      timeline: [
        { 
          stage: "VERIFIKASI_110",
          time: String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0'), 
          title: "1. Laporan Diterima Portal Mandiri 110", 
          desc: `Laporan masuk ke antrean verifikasi SPKT Polres dengan titik koordinat presisi (${lat.toFixed(5)}, ${lng.toFixed(5)}).`,
          attachments: [
            { type: "DOC", title: "Formulir_Pengaduan_Warga_Online.pdf", meta: "Tiket Registrasi Mandiri", icon: "📑", url: "#" }
          ]
        }
      ]
    };

    this.state.complaints.unshift(newComplaint);

    // AUTOMATIC LOGIN FOR CITIZEN: Guest automatically becomes authenticated!
    this.isCitizenGuest = false;
    this.currentCitizen = { name: name, phone: phone };

    // Register in state if not present
    if (!this.state.registeredCitizens) this.state.registeredCitizens = [];
    const normPhone = (p) => (p || '').replace(/[^0-9]/g, '');
    if (!this.state.registeredCitizens.some(rc => normPhone(rc.phone) === normPhone(phone))) {
      this.state.registeredCitizens.push({ name: name, phone: phone });
    }

    this.saveState();
    this.closeAllModals();

    // Automatically update UI and display newly created case
    this.updateCitizenAccountUI();
    this.renderPublicRecentReports();

    this.showToast(`✅ Laporan terkirim! Tiket: ${newId}. Titik lokasi GPS presisi tersimpan.`, 'success');
    alert(`Laporan Anda berhasil dikirim!\n\nNomor Tiket Pengaduan Anda:\n👉 ${newId}\n\nTitik Lokasi Presisi: ${loc} (${lat.toFixed(5)}, ${lng.toFixed(5)})\n\nAkun Anda otomatis login dengan nomor HP ${phone}. Laporan ini kini langsung terpantau di dashboard Anda.`);
    this.trackComplaint(newId);
  }

  // ==========================================================================
  // CITIZEN INCIDENT PRECISION MAP & FORM PREPARATION
  // ==========================================================================
  preparePublicReportModal() {
    const bannerEl = document.getElementById('public-report-auth-banner');
    const nameInp = document.getElementById('public-form-name');
    const phoneInp = document.getElementById('public-form-phone');
    const nameBadge = document.getElementById('public-form-name-badge');
    const phoneBadge = document.getElementById('public-form-phone-badge');
    const phoneHelp = document.getElementById('public-form-phone-help');

    const isLoggedIn = !this.isCitizenGuest && this.currentCitizen && this.currentCitizen.phone;

    if (isLoggedIn) {
      // 1. LOGGED-IN CITIZEN: Name & Phone auto-filled, read-only, no re-typing needed!
      if (bannerEl) {
        bannerEl.innerHTML = `
          <div style="background:rgba(16,185,129,0.12); border:1px solid #10B981; border-radius:var(--radius-sm); padding:12px 14px; display:flex; align-items:center; gap:12px;">
            <div style="font-size:24px;">✅</div>
            <div>
              <div style="font-size:12.5px; font-weight:800; color:#10B981;">Sesi Warga Terverifikasi 110 Aktif</div>
              <div style="font-size:11.5px; color:#cbd5e1; margin-top:2px;">
                Melapor sebagai: <strong style="color:#fff;">${this.currentCitizen.name}</strong> (<span style="color:#FCD34D; font-family:'JetBrains Mono';">${this.currentCitizen.phone}</span>).
                Nama dan nomor telepon Anda telah terisi otomatis dan dikunci demi keamanan akun.
              </div>
            </div>
          </div>
        `;
      }

      if (nameInp) {
        nameInp.value = this.currentCitizen.name;
        nameInp.readOnly = true;
        nameInp.style.background = 'rgba(16, 185, 129, 0.08)';
        nameInp.style.borderColor = '#10B981';
        nameInp.style.color = '#fff';
      }
      if (nameBadge) {
        nameBadge.style.display = 'inline-block';
        nameBadge.className = 'badge badge-success';
        nameBadge.innerHTML = '🔒 Terisi Otomatis (Login)';
      }

      if (phoneInp) {
        phoneInp.value = this.currentCitizen.phone;
        phoneInp.readOnly = true;
        phoneInp.style.background = 'rgba(16, 185, 129, 0.08)';
        phoneInp.style.borderColor = '#10B981';
        phoneInp.style.color = '#FCD34D';
      }
      if (phoneBadge) {
        phoneBadge.style.display = 'inline-block';
        phoneBadge.className = 'badge badge-success';
        phoneBadge.innerHTML = '🔒 No. HP Terverifikasi';
      }
      if (phoneHelp) {
        phoneHelp.innerHTML = '🔒 Nomor telepon diambil langsung dari sesi login WhatsApp Anda. Anda tidak perlu memasukkannya lagi.';
        phoneHelp.style.color = '#34D399';
      }
    } else {
      // 2. GUEST MODE (MODE TAMU): Name and phone are mandatory to input!
      if (bannerEl) {
        bannerEl.innerHTML = `
          <div style="background:rgba(245,158,11,0.12); border:1px solid #F59E0B; border-radius:var(--radius-sm); padding:12px 14px; display:flex; align-items:center; gap:12px;">
            <div style="font-size:24px;">🌐</div>
            <div>
              <div style="font-size:12.5px; font-weight:800; color:#FCD34D;">Pelaporan Mode Tamu (Pengunjung Publik)</div>
              <div style="font-size:11.5px; color:#cbd5e1; margin-top:2px;">
                <strong>Wajib mengisi Nama & Nomor WhatsApp.</strong> Setelah pengaduan dikirim, sistem akan otomatis mendaftarkan dan memasukkan Anda (Auto-Login) agar tiket dapat langsung dipantau.
              </div>
            </div>
          </div>
        `;
      }

      if (nameInp) {
        nameInp.value = '';
        nameInp.readOnly = false;
        nameInp.style.background = '';
        nameInp.style.borderColor = '';
        nameInp.style.color = '';
      }
      if (nameBadge) nameBadge.style.display = 'none';

      if (phoneInp) {
        phoneInp.value = '';
        phoneInp.readOnly = false;
        phoneInp.style.background = '';
        phoneInp.style.borderColor = '';
        phoneInp.style.color = '';
      }
      if (phoneBadge) {
        phoneBadge.style.display = 'inline-block';
        phoneBadge.className = 'badge badge-warning';
        phoneBadge.innerHTML = '⚠️ Wajib Diisi';
      }
      if (phoneHelp) {
        phoneHelp.innerHTML = 'Nomor WhatsApp aktif wajib diisi untuk penerimaan nomor tiket 110 dan verifikasi otomatis.';
        phoneHelp.style.color = 'var(--text-secondary)';
      }
    }

    // Default coordinates (Grand Mall center)
    const defLat = -6.2146;
    const defLng = 106.8451;
    const latInp = document.getElementById('public-form-lat');
    const lngInp = document.getElementById('public-form-lng');
    const locInp = document.getElementById('public-form-loc');
    if (latInp) latInp.value = defLat.toFixed(6);
    if (lngInp) lngInp.value = defLng.toFixed(6);
    if (locInp && !locInp.value) {
      locInp.value = "Area Parkir Ruko Grand Mall, Jl. Merdeka No. 12";
    }

    setTimeout(() => {
      this.initPublicIncidentMap(defLat, defLng);
    }, 180);
  }

  initPublicIncidentMap(initialLat = -6.2146, initialLng = 106.8451) {
    const containerId = 'public-incident-map';
    const container = document.getElementById(containerId);
    if (!container) return;

    if (typeof L === 'undefined') {
      if (!this._publicMapRetries) this._publicMapRetries = 0;
      this._publicMapRetries++;
      if (this._publicMapRetries < 5) {
        setTimeout(() => this.initPublicIncidentMap(initialLat, initialLng), 200);
      }
      return;
    }
    this._publicMapRetries = 0;

    if (this.leafMaps && this.leafMaps[containerId]) {
      try {
        this.leafMaps[containerId].remove();
      } catch (e) {}
      delete this.leafMaps[containerId];
    }

    const map = L.map(containerId, {
      center: [initialLat, initialLng],
      zoom: 15,
      zoomControl: true,
      attributionControl: false
    });

    const streetsLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd'
    });

    const satLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19
    });

    streetsLayer.addTo(map);
    this.publicMapTileLayers = { streets: streetsLayer, satellite: satLayer };
    this.activePublicMapLayer = 'streets';

    const incidentIcon = L.divIcon({
      className: 'custom-public-incident-pin',
      html: `
        <div style="position:relative; width:36px; height:36px;">
          <div class="pulse-ring" style="border: 2px solid #EF4444; background: rgba(239, 68, 68, 0.3);"></div>
          <div style="position:absolute; top:2px; left:2px; width:32px; height:32px; background:#DC2626; border:2px solid #fff; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:16px; box-shadow:0 0 15px rgba(239,68,68,0.9); cursor:grab;">
            📍
          </div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });

    this.publicIncidentMarker = L.marker([initialLat, initialLng], {
      icon: incidentIcon,
      draggable: true
    }).addTo(map);

    this.publicIncidentCircle = L.circle([initialLat, initialLng], {
      radius: 40,
      color: '#EF4444',
      fillColor: '#EF4444',
      fillOpacity: 0.2,
      weight: 1.5,
      dashArray: '3, 3'
    }).addTo(map);

    const updateCoords = (lat, lng, syncAddress = true) => {
      const latInp = document.getElementById('public-form-lat');
      const lngInp = document.getElementById('public-form-lng');
      const coordsDisplay = document.getElementById('public-coords-display');
      if (latInp) latInp.value = lat.toFixed(6);
      if (lngInp) lngInp.value = lng.toFixed(6);
      if (coordsDisplay) coordsDisplay.textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

      if (this.publicIncidentCircle) {
        this.publicIncidentCircle.setLatLng([lat, lng]);
      }

      if (syncAddress) {
        const locInp = document.getElementById('public-form-loc');
        if (locInp && (!locInp.value || locInp.value.startsWith('Kawasan') || locInp.value.startsWith('Koordinat') || locInp.value.startsWith('Area') || locInp.value.startsWith('Jl.'))) {
          const resolvedAddress = this.getAddressFromCoords(lat, lng);
          if (resolvedAddress) locInp.value = resolvedAddress;
        }
      }
    };

    map.on('click', (e) => {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      if (this.publicIncidentMarker) this.publicIncidentMarker.setLatLng([lat, lng]);
      updateCoords(lat, lng, true);
    });

    this.publicIncidentMarker.on('dragend', (e) => {
      const pos = e.target.getLatLng();
      updateCoords(pos.lat, pos.lng, true);
    });

    if (!this.leafMaps) this.leafMaps = {};
    this.leafMaps[containerId] = map;

    setTimeout(() => {
      map.invalidateSize();
    }, 200);
  }

  setPublicIncidentLocation(lat, lng, addressName = null) {
    const latInp = document.getElementById('public-form-lat');
    const lngInp = document.getElementById('public-form-lng');
    const locInp = document.getElementById('public-form-loc');
    const coordsDisplay = document.getElementById('public-coords-display');

    if (latInp) latInp.value = lat.toFixed(6);
    if (lngInp) lngInp.value = lng.toFixed(6);
    if (coordsDisplay) coordsDisplay.textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    if (locInp && addressName) locInp.value = addressName;

    const map = this.leafMaps && this.leafMaps['public-incident-map'];
    if (map) {
      map.setView([lat, lng], 16);
      if (this.publicIncidentMarker) this.publicIncidentMarker.setLatLng([lat, lng]);
      if (this.publicIncidentCircle) this.publicIncidentCircle.setLatLng([lat, lng]);
    }
    this.showToast(`Titik kejadian diposisikan: ${addressName || lat.toFixed(4) + ', ' + lng.toFixed(4)}`, 'info');
  }

  setPublicIncidentToCurrentGps() {
    const lat = -6.2146;
    const lng = 106.8451;
    const addr = "Lokasi Saya Saat Ini (Area Parkir Grand Mall, Jl. Merdeka No. 12)";
    this.setPublicIncidentLocation(lat, lng, addr);
    this.showToast("📍 Koordinat GPS perangkat Anda berhasil dikunci ke titik kejadian!", "success");
  }

  togglePublicIncidentMapLayer() {
    const map = this.leafMaps && this.leafMaps['public-incident-map'];
    if (!map || !this.publicMapTileLayers) return;

    const btn = document.getElementById('btn-public-map-layer');
    if (this.activePublicMapLayer === 'streets') {
      map.removeLayer(this.publicMapTileLayers.streets);
      this.publicMapTileLayers.satellite.addTo(map);
      this.activePublicMapLayer = 'satellite';
      if (btn) btn.innerHTML = '🗺️ Peta Jalan';
      this.showToast("Beralih ke tampilan Citra Satelit (ESRI)", "info");
    } else {
      map.removeLayer(this.publicMapTileLayers.satellite);
      this.publicMapTileLayers.streets.addTo(map);
      this.activePublicMapLayer = 'streets';
      if (btn) btn.innerHTML = '🛰️ Satelit';
      this.showToast("Beralih ke tampilan Peta Jalan Vektor", "info");
    }
  }

  viewComplaintDetail(complaintId) {
    this.trackComplaint(complaintId);
  }

  // --- ROLE: SEKSI TIK (MANAJEMEN AKUN, AUDIT TRAIL, GATEWAY CONFIG) METHODS ---
  renderSitikView() {
    this.initSitikAuditLogs();
    this.renderSitikUsersTable();
    this.renderSitikAuditTable();
  }

  renderSitikUsersTable() {
    const tbody = document.getElementById('sitik-users-tbody');
    if (!tbody) return;

    if (!this.state.systemUsers) {
      this.state.systemUsers = [
        { nrp: "76110988", name: "AKBP Hendro Wibowo, S.I.K., M.Si.", rank: "AKBP", unit: "Pimpinan Polres Metro", role: "PIMPINAN_KAPOLRES", status: "AKTIF" },
        { nrp: "80080155", name: "AKP Danang Kusuma, S.H.", rank: "AKP", unit: "Polsek Cempaka Raya", role: "KAPOLSEK", status: "AKTIF" },
    { nrp: "78030211", name: "Kompol Wahyu Santoso, S.H.", rank: "Kompol", unit: "Bagian Operasi (Bag Ops)", role: "PERWIRA_OPS", status: "AKTIF" },
        { nrp: "94050112", name: "Briptu Siti Nurhaliza", rank: "Briptu", unit: "SPKT / Call Center 110", role: "OPERATOR_SPKT", status: "AKTIF" },
        { nrp: "88123456", name: "Bripka Ahmad Subagyo", rank: "Bripka", unit: "Sat Samapta (Sektor Timur)", role: "PERSONIL_LAPANGAN", status: "AKTIF" },
        { nrp: "83070455", name: "Aipda Pratama, S.Kom.", rank: "Aipda", unit: "Seksi TIK Polres", role: "ADMIN_TIK", status: "AKTIF" }
      ];
    }

    tbody.innerHTML = this.state.systemUsers.map(u => {
      let roleBadge = '';
      if (u.role === 'PIMPINAN_KAPOLRES') roleBadge = '<span class="badge badge-gold">Kapolres</span>';
      else if (u.role === 'PERWIRA_OPS') roleBadge = '<span class="badge badge-warning">Kabag Ops</span>';
      else if (u.role === 'OPERATOR_SPKT') roleBadge = '<span class="badge badge-info">Operator SPKT</span>';
      else if (u.role === 'ADMIN_TIK') roleBadge = '<span class="badge" style="background:rgba(168,85,247,0.2); color:#C084FC;">Admin IT</span>';
      else roleBadge = '<span class="badge badge-success">Personel Lapangan</span>';

      let statusBadge = u.status === 'AKTIF' 
        ? '<span class="badge badge-success">Aktif</span>' 
        : '<span class="badge badge-danger">Dibekukan</span>';

      const dev = u.deviceBinding || {
        model: "Samsung Galaxy XCover 5",
        uuid: `SEC-POL-${u.nrp}-XCV9`,
        status: "TERIKAT"
      };

      let devBadge = '<span class="badge badge-success" style="font-size:9.5px;">🟢 Terikat (FIPS TEE)</span>';
      if (dev.status === 'DIBEKUKAN') {
        devBadge = '<span class="badge badge-danger" style="font-size:9.5px;">🔴 Dicabut / Dikunci</span>';
      } else if (dev.status === 'BELUM_TERIKAT') {
        devBadge = '<span class="badge badge-warning" style="font-size:9.5px; background:#F59E0B; color:#000; font-weight:800;">⏳ Belum Terikat</span>';
      }

      return `
        <tr>
          <td>
            <span class="table-code">${u.nrp}</span><br>
            <strong>${u.name}</strong>
          </td>
          <td>
            <small style="color:var(--text-secondary)">${u.unit}</small><br>
            ${roleBadge}
          </td>
          <td>
            <div style="font-size:11.5px; font-weight:700; color:#fff; display:flex; align-items:center; gap:4px;">
              <span>📱</span> ${dev.model}
            </div>
            <div style="display:flex; align-items:center; gap:6px; margin-top:2px;">
              ${devBadge}
              <small style="font-family:'JetBrains Mono'; font-size:10px; color:#94A3B8;">${dev.uuid.substring(0, 16)}...</small>
            </div>
          </td>
          <td>${statusBadge}</td>
          <td>
            <div style="display:flex; gap:6px; flex-wrap:wrap;">
              <button class="btn-quick" style="background:rgba(192,132,252,0.18); border-color:#C084FC; color:#E9D5FF; font-weight:700;" onclick="app.openManageDeviceModal('${u.nrp}')" title="Kelola Pengikatan Gawai">📱 Gawai</button>
              <button class="btn-quick" onclick="app.resetUserPin('${u.nrp}')" title="Reset PIN/Password">🔑 PIN</button>
              <button class="btn-quick ${u.status === 'AKTIF' ? 'btn-danger-outline' : ''}" onclick="app.toggleUserStatus('${u.nrp}')" title="Kunci/Buka Akses">
                ${u.status === 'AKTIF' ? '🚫 Bekukan' : '✅ Buka'}
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  submitNewUserAccount() {
    const nrp = document.getElementById('sitik-input-nrp').value.trim();
    const name = document.getElementById('sitik-input-name').value.trim();
    const rank = document.getElementById('sitik-select-pangkat').value;
    const unit = document.getElementById('sitik-select-unit').value;
    const role = document.getElementById('sitik-select-role').value;
    const phone = document.getElementById('sitik-input-phone').value.trim();

    if (!nrp || !name || !phone) {
      alert("Mohon lengkapi seluruh data pendaftaran akun personel.");
      return;
    }

    if (!this.state.systemUsers) this.state.systemUsers = [];

    const existing = this.state.systemUsers.find(u => u.nrp === nrp);
    if (existing) {
      alert(`NRP ${nrp} sudah terdaftar atas nama ${existing.name}.`);
      return;
    }

    const newUser = {
      nrp: nrp,
      name: `${rank} ${name}`,
      rank: rank,
      unit: unit,
      role: role,
      status: "AKTIF"
    };

    this.state.systemUsers.unshift(newUser);
    this.saveState();

    document.getElementById('sitik-input-nrp').value = '';
    document.getElementById('sitik-input-name').value = '';
    document.getElementById('sitik-input-phone').value = '';

    this.renderSitikView();
    alert(`Akun Personel Berhasil Diterbitkan!

NRP: ${nrp}
Nama: ${newUser.name}
Satuan: ${unit}
PIN Default: PRESISI2026

Anggota dapat langsung login menggunakan NRP tersebut.`);
    this.showToast(`Akun NRP ${nrp} berhasil diterbitkan Si TIK!`, 'success');
  }

  toggleUserStatus(nrp) {
    const user = this.state.systemUsers.find(u => u.nrp === nrp);
    if (!user) return;

    user.status = user.status === 'AKTIF' ? 'DIBEKUKAN' : 'AKTIF';
    this.saveState();
    this.renderSitikView();
    this.showToast(`Status akun ${user.name} diubah menjadi: ${user.status}`, user.status === 'AKTIF' ? 'success' : 'warning');
  }


  // ============================================================================
  // DEVICE BINDING & HARDWARE ENROLLMENT MANAGEMENT (SEKSI TIK POLRES)
  // Menjamin 1 Akun NRP = 1 Gawai Resmi Terikat (Hardware-Bound Anti-Fake GPS)
  // ============================================================================
  openManageDeviceModal(nrp) {
    const user = this.state.systemUsers.find(u => u.nrp === nrp);
    if (!user) return;

    this.selectedDeviceUser = user;
    const binding = user.deviceBinding || {
      model: "Samsung Galaxy XCover 5 Enterprise",
      uuid: `SEC-POL-${user.nrp}-XCV9`,
      status: "TERIKAT",
      keystore: "Hardware StrongBox TEE",
      antiMock: "Aktif (Mock Blocked)",
      enrolledAt: "15 Sep 2026"
    };

    document.getElementById('sitik-device-target-nrp').value = user.nrp;
    document.getElementById('sitik-device-modal-title').textContent = `Manajemen Gawai: ${user.name}`;
    document.getElementById('sitik-device-officer-name').textContent = user.name;
    document.getElementById('sitik-device-officer-unit').textContent = `NRP ${user.nrp} • ${user.unit}`;
    document.getElementById('sitik-device-model').textContent = binding.model;
    document.getElementById('sitik-device-uuid').textContent = binding.uuid;
    document.getElementById('sitik-device-keystore').textContent = binding.keystore;
    document.getElementById('sitik-device-antimock').textContent = binding.antiMock;
    document.getElementById('sitik-device-enrolled').textContent = binding.enrolledAt;

    const badgeContainer = document.getElementById('sitik-device-binding-badge');
    if (badgeContainer) {
      if (binding.status === 'TERIKAT') {
        badgeContainer.innerHTML = '<span class="badge badge-success" style="font-size:11px; padding:6px 12px;">🟢 Gawai Terikat Resmi</span>';
      } else if (binding.status === 'DIBEKUKAN') {
        badgeContainer.innerHTML = '<span class="badge badge-danger" style="font-size:11px; padding:6px 12px;">🔴 Ikatan Dicabut / Dibekukan</span>';
      } else {
        badgeContainer.innerHTML = '<span class="badge badge-warning" style="font-size:11px; padding:6px 12px; background:#F59E0B; color:#000; font-weight:800;">⏳ Belum Terikat Gawai</span>';
      }
    }

    this.openModal('modal-sitik-manage-device');
  }

  showDeviceEnrollmentQr() {
    if (!this.selectedDeviceUser) return;
    const u = this.selectedDeviceUser;
    const token = `AUTH-BIND-${u.nrp}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const tokenLabel = document.getElementById('sitik-qr-token-label');
    if (tokenLabel) tokenLabel.textContent = `TOKEN DINAS: ${token}`;

    this.openModal('modal-sitik-device-qr');
  }

  simulateSuccessfulQrScan() {
    if (!this.selectedDeviceUser) return;
    const u = this.selectedDeviceUser;
    u.deviceBinding = {
      model: "Samsung Galaxy XCover 5 Enterprise (Gawai Baru)",
      uuid: `SEC-POL-${u.nrp}-NEW${Math.floor(Math.random()*900 + 100)}`,
      status: "TERIKAT",
      keystore: "Hardware StrongBox TEE (FIPS 140-2)",
      antiMock: "Aktif (Mock Provider Blocked)",
      enrolledAt: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
    };

    this.saveState();
    this.closeAllModals();
    this.renderSitikView();
    this.renderPersonilView();
    this.showToast(`✅ Gawai baru berhasil diikat resmi ke akun ${u.name} (NRP ${u.nrp})!`, 'success');
  }

  resetDeviceBinding() {
    if (!this.selectedDeviceUser) return;
    const u = this.selectedDeviceUser;

    if (confirm(`Reset ikatan gawai untuk ${u.name} (${u.nrp})?\nAnggota harus memindai ulang QR Code otorisasi Si TIK untuk mengaktifkan gawai baru.`)) {
      u.deviceBinding.status = "BELUM_TERIKAT";
      u.deviceBinding.model = "Menunggu Otorisasi Gawai Baru...";
      u.deviceBinding.uuid = "PENDING-ENROLLMENT";

      this.saveState();
      this.closeAllModals();
      this.renderSitikView();
      this.renderPersonilView();
      this.showToast(`Ikatan gawai untuk NRP ${u.nrp} direset. Silakan scan QR otorisasi gawai baru.`, 'info');
    }
  }

  revokeDeviceBinding() {
    if (!this.selectedDeviceUser) return;
    const u = this.selectedDeviceUser;

    if (confirm(`PERINGATAN PROPAM/TIK:\nPutus ikatan dan kunci gawai untuk ${u.name} (${u.nrp})?\nGawai anggota akan di-logout paksa dan seluruh akses dinas dicabut seketika (Gawai Hilang / Investigasi).`)) {
      u.deviceBinding.status = "DIBEKUKAN";
      u.deviceBinding.antiMock = "Akses Dicabut (Security Wipe)";

      this.saveState();
      this.closeAllModals();
      this.renderSitikView();
      this.renderPersonilView();
      this.showToast(`🚨 Ikatan gawai NRP ${u.nrp} BERHASIL DICABUT & DIKUNCI!`, 'danger');
    }
  }

  resetUserPin(nrp) {
    const user = this.state.systemUsers.find(u => u.nrp === nrp);
    if (!user) return;

    alert(`PIN Akun untuk ${user.name} (NRP ${user.nrp}) berhasil di-reset ke nilai default:

👉 PRESISI2026

Instruksikan anggota untuk mengganti PIN saat login pertama kali.`);
    this.showToast(`PIN NRP ${nrp} berhasil di-reset!`, 'info');
  }

  // ============================================================================
  // ROLE: SEKSI TIK - SUBNAV TAB SWITCHER
  // ============================================================================
  switchSitikTab(tabId) {
    this.activeSitikTab = tabId;
    document.querySelectorAll('.sitik-tab-btn').forEach(btn => {
      if (btn.getAttribute('data-tab') === tabId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    document.querySelectorAll('.sitik-tab-content').forEach(content => {
      content.classList.remove('active');
    });

    const target = document.getElementById(tabId);
    if (target) target.classList.add('active');

    if (tabId === 'tab-sitik-audit') {
      this.renderSitikAuditTable();
    }
  }

  // ============================================================================
  // ROLE: SEKSI TIK - LIVE SYSTEM AUDIT TRAIL LOGIC
  // ============================================================================
  initSitikAuditLogs() {
    if (!this.state.systemAuditLogs || this.state.systemAuditLogs.length === 0) {
      this.state.systemAuditLogs = [
        {
          id: "AUD-20261007-0091",
          time: "14:44:12 WIB",
          category: "AUTH",
          categoryLabel: "Autentikasi",
          severity: "INFO",
          actorName: "Bripka Ahmad Subagyo",
          actorNrp: "88123456",
          actorRole: "PERSONIL_LAPANGAN",
          ip: "10.12.84.15",
          device: "Samsung Galaxy XCover 5 (Android 14)",
          action: "Otentikasi Berhasil via Android Keystore StrongBox TEE & mTLS",
          details: "Kunci privat tidak dapat diekspor. Sertifikat klien X.509 SN-POL-88123456 terverifikasi valid. Token sesi kedinasan diterbitkan.",
          status: "SUKSES"
        },
        {
          id: "AUD-20261007-0090",
          time: "14:42:05 WIB",
          category: "DISPATCH",
          categoryLabel: "Disposisi 110",
          severity: "INFO",
          actorName: "Kompol Wahyu Santoso, S.H.",
          actorNrp: "78030211",
          actorRole: "KABAG_OPS",
          ip: "192.168.1.102",
          device: "PC Command Center (Chrome Desktop)",
          action: "Eksekusi 1-Click Smart CAD Dispatch ke Unit Terdekat",
          details: "Disposisi cepat pengaduan darurat LP-110-2026-0040 ke armada SAT-SAMAPTA-01 (Bripka Ahmad). Jarak terdekat: 1.25 km, ETA: 3 menit.",
          status: "SUKSES"
        },
        {
          id: "AUD-20261007-0089",
          time: "14:38:51 WIB",
          category: "GEOAUDIT",
          categoryLabel: "Audit GPS",
          severity: "WARNING",
          actorName: "Sistem Otomatis (Dual-Location Audit Engine)",
          actorNrp: "SYS-AUTO",
          actorRole: "SYSTEM",
          ip: "127.0.0.1",
          device: "Backend Spatial Service (Redis Geo)",
          action: "Deteksi Deviasi Jarak Unggah (MISMATCH_ALERT Diterbitkan)",
          details: "Logbook LOG-0103 diklaim di Jl. Pahlawan No. 4, namun koordinat GPS riil perangkat berada 4.85 km dekat Mako Polres. Kasus diteruskan ke Kanit Propam.",
          status: "ALERT"
        },
        {
          id: "AUD-20261007-0088",
          time: "14:35:10 WIB",
          category: "DEVICE",
          categoryLabel: "Device Binding",
          severity: "INFO",
          actorName: "Aipda Pratama, S.Kom.",
          actorNrp: "83070455",
          actorRole: "SI_TIK",
          ip: "192.168.1.110",
          device: "Workstation TIK (Chrome Desktop)",
          action: "Penerbitan Token Pairing Gawai Baru (Enrollment)",
          details: "Generate token 6-digit (928401) dan QR Code pairing gawai untuk anggota Briptu Joko Susilo (NRP 92080341).",
          status: "SUKSES"
        },
        {
          id: "AUD-20261007-0087",
          time: "14:29:44 WIB",
          category: "ROUTE",
          categoryLabel: "Rekayasa Rute",
          severity: "INFO",
          actorName: "Kompol Wahyu Santoso, S.H.",
          actorNrp: "78030211",
          actorRole: "KABAG_OPS",
          ip: "192.168.1.102",
          device: "PC Command Center (Chrome Desktop)",
          action: "Pembaruan Checkpoint Rute Patroli Taktis",
          details: "Menambahkan checkpoint 'Pos Polisi Simpang Lima' (Target: 22:30 WIB) dan menetapkan mode penugasan Gabungan Polres.",
          status: "SUKSES"
        },
        {
          id: "AUD-20261007-0086",
          time: "14:21:18 WIB",
          category: "AUTH",
          categoryLabel: "Autentikasi",
          severity: "CRITICAL",
          actorName: "Tidak Dikenal (Brute-Force Detection)",
          actorNrp: "UNKNOWN",
          actorRole: "ANONYMOUS",
          ip: "182.253.110.45",
          device: "Unknown Client / Tor Exit Node",
          action: "Percobaan Penetrasi Login Diblokir Firewall",
          details: "Percobaan credential stuffing 5x berturut-turut pada endpoint internal. IP otomatis diblokir oleh Nginx Rate Limiting selama 24 jam.",
          status: "DIBLOKIR"
        },
        {
          id: "AUD-20261007-0085",
          time: "14:15:33 WIB",
          category: "GATEWAY",
          categoryLabel: "Gateway API",
          severity: "INFO",
          actorName: "WhatsApp Business Engine",
          actorNrp: "SYS-WA",
          actorRole: "GATEWAY",
          ip: "api.fonnte.com",
          device: "Cloud Webhook Gateway",
          action: "Pengiriman OTP WhatsApp Warga Berhasil",
          details: "Kode OTP 1100 terkirim ke +6281298443321 (Bambang Sudirjo) untuk akses tracking mandiri laporan LP-110-2026-0040. Latensi: 112ms.",
          status: "SUKSES"
        },
        {
          id: "AUD-20261007-0084",
          time: "14:02:19 WIB",
          category: "LOGBOOK",
          categoryLabel: "SOP & Logbook",
          severity: "INFO",
          actorName: "Ipda Dedi Gunawan",
          actorNrp: "85030491",
          actorRole: "KANIT_PERWIRA",
          ip: "10.12.84.22",
          device: "Tablet Pawas Samapta (iPad OS)",
          action: "Verifikasi & Persetujuan e-Logbook Anggota",
          details: "Mengesahkan e-Logbook kegiatan Patroli Dialogis Pasar Baru (LOG-0101) Bripka Ahmad setelah foto bukti dan GPS dinyatakan valid.",
          status: "SUKSES"
        }
      ];
    }
  }

  renderSitikAuditTable(logsToRender) {
    const tbody = document.getElementById('sitik-audit-tbody');
    if (!tbody) return;

    this.initSitikAuditLogs();
    const logs = logsToRender || this.state.systemAuditLogs || [];

    // Update counters
    const totalEl = document.getElementById('sitik-stat-total-logs');
    const warnEl = document.getElementById('sitik-stat-warning-logs');
    if (totalEl) totalEl.innerText = `${(1420 + logs.length).toLocaleString('id-ID')} Event`;
    if (warnEl) {
      const warnCount = logs.filter(l => l.severity === 'WARNING' || l.severity === 'CRITICAL').length;
      warnEl.innerText = `${warnCount} Alert Terdeteksi`;
    }

    if (logs.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center; padding:30px; color:var(--text-secondary);">
            Tidak ditemukan rekaman log audit yang sesuai dengan filter pencarian.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = logs.map(l => {
      let sevBadge = '<span class="badge badge-info" style="font-size:10px;">INFO</span>';
      if (l.severity === 'WARNING') sevBadge = '<span class="badge badge-warning" style="font-size:10px; background:#F59E0B; color:#000; font-weight:800;">WARNING</span>';
      else if (l.severity === 'CRITICAL') sevBadge = '<span class="badge badge-danger" style="font-size:10px; font-weight:800;">CRITICAL</span>';

      let statusBadge = '<span class="badge badge-success" style="font-size:10px;">SUKSES</span>';
      if (l.status === 'ALERT') statusBadge = '<span class="badge badge-warning" style="font-size:10px; background:#F59E0B; color:#000;">ALERT</span>';
      else if (l.status === 'DIBLOKIR') statusBadge = '<span class="badge badge-danger" style="font-size:10px;">DIBLOKIR</span>';

      return `
        <tr style="transition:background 0.3s;">
          <td style="font-family:'JetBrains Mono'; font-size:11px; color:#94A3B8; white-space:nowrap;">
            ${l.time}<br>
            <small style="font-size:9.5px; color:#64748B;">${l.id}</small>
          </td>
          <td>
            ${sevBadge}<br>
            <small style="font-size:10px; color:var(--text-secondary); text-transform:uppercase;">${l.categoryLabel || l.category}</small>
          </td>
          <td>
            <strong style="color:#fff; font-size:12px;">${l.actorName}</strong><br>
            <small style="color:var(--accent-gold); font-family:'JetBrains Mono'; font-size:10.5px;">NRP: ${l.actorNrp}</small>
          </td>
          <td>
            <span style="font-family:'JetBrains Mono'; font-size:11px; color:#38BDF8;">${l.ip}</span><br>
            <small style="color:#94A3B8; font-size:10.5px;">${l.device}</small>
          </td>
          <td>
            <div style="font-weight:700; color:#fff; font-size:12px; margin-bottom:2px;">${l.action}</div>
            <div style="font-size:11px; color:var(--text-secondary); line-height:1.4;">${l.details}</div>
          </td>
          <td>${statusBadge}</td>
        </tr>
      `;
    }).join('');
  }

  filterAuditLogs() {
    this.initSitikAuditLogs();
    const q = (document.getElementById('sitik-audit-search')?.value || '').toLowerCase();
    const cat = document.getElementById('sitik-audit-cat')?.value || 'ALL';
    const sev = document.getElementById('sitik-audit-severity')?.value || 'ALL';

    const filtered = this.state.systemAuditLogs.filter(l => {
      const matchQ = !q || 
        l.actorName.toLowerCase().includes(q) || 
        l.actorNrp.toLowerCase().includes(q) || 
        l.action.toLowerCase().includes(q) || 
        l.details.toLowerCase().includes(q) || 
        l.ip.toLowerCase().includes(q);

      const matchCat = (cat === 'ALL') || (l.category === cat);
      const matchSev = (sev === 'ALL') || (l.severity === sev);

      return matchQ && matchCat && matchSev;
    });

    this.renderSitikAuditTable(filtered);
  }

  simulateNewAuditActivity() {
    this.initSitikAuditLogs();
    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + " WIB";

    const simulatedEvents = [
      {
        category: "DISPATCH",
        categoryLabel: "Disposisi 110",
        severity: "INFO",
        actorName: "Kompol Wahyu Santoso, S.H.",
        actorNrp: "78030211",
        actorRole: "KABAG_OPS",
        ip: "192.168.1.102",
        device: "PC Command Center (Chrome Desktop)",
        action: "Disposisi Taktis 110 ke Armada Patwal-01",
        details: "Menugaskan Patwal Satlantas untuk pengawalan penanganan TKP laka lantas di Jl. Juanda No. 8.",
        status: "SUKSES"
      },
      {
        category: "AUTH",
        categoryLabel: "Autentikasi",
        severity: "INFO",
        actorName: "Briptu Siti Nurhaliza",
        actorNrp: "94050112",
        actorRole: "OPERATOR_SPKT",
        ip: "192.168.1.105",
        device: "Terminal SPKT 110 (Windows 11 Kedinasan)",
        action: "Pembaruan Kredensial Sesi Piket Siang",
        details: "Refresh token JWT sesi operator SPKT berhasil. Integritas sesi aman.",
        status: "SUKSES"
      },
      {
        category: "DEVICE",
        categoryLabel: "Device Binding",
        severity: "WARNING",
        actorName: "Sistem Pengawas Keamanan TIK",
        actorNrp: "SEC-DAEMON",
        actorRole: "SECURITY",
        ip: "10.12.84.44",
        device: "Xiaomi Redmi Note (Root Terdeteksi)",
        action: "Upaya Pemasangan Gawai Tidak Sah Ditolak",
        details: "Terdeteksi status Bootloader Terbuka (Unlocked) & Magisk SU pada perangkat yang mencoba scan token pairing. Otorisasi otomatis dibatalkan.",
        status: "DITOLAK"
      },
      {
        category: "GATEWAY",
        categoryLabel: "Gateway API",
        severity: "INFO",
        actorName: "Tile Server GIS Engine",
        actorNrp: "SYS-GIS",
        actorRole: "SYSTEM",
        ip: "basemaps.cartocdn.com",
        device: "Cloud CDN Edge",
        action: "Penyegaran Cache Basemap Peta Taktis",
        details: "Pre-rendering 64 tile layer peta taktis wilayah hukum Polres Metro selesai. Latensi: 28ms.",
        status: "SUKSES"
      }
    ];

    const pick = simulatedEvents[Math.floor(Math.random() * simulatedEvents.length)];
    const newLog = {
      id: `AUD-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}-${String(Math.floor(Math.random()*900 + 100))}`,
      time: timeStr,
      ...pick
    };

    this.state.systemAuditLogs.unshift(newLog);
    this.saveState();
    this.filterAuditLogs();

    this.showToast(`🔔 Event Audit Baru Tercatat: ${newLog.action}`, newLog.severity === 'WARNING' ? 'warning' : 'success');
  }

  refreshAuditTrail() {
    this.initSitikAuditLogs();
    this.filterAuditLogs();
    this.showToast("🔄 Log audit siber disinkronkan langsung dari server broker telemetri.", "info");
  }

  exportAuditLogsJson() {
    this.initSitikAuditLogs();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.state.systemAuditLogs, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `SIMAPRES110_Audit_Trail_${new Date().toISOString().slice(0,10)}.json`);
    dlAnchorElem.click();
    this.showToast("📥 Berkas Log Audit (JSON) berhasil diunduh.", "success");
  }

  // ============================================================================
  // ROLE: SEKSI TIK - GATEWAY & THIRD PARTY API TESTING METHODS
  // ============================================================================
  testWhatsAppGateway() {
    this.showToast("⏳ Menguji koneksi ke server Fonnte WhatsApp Business API...", "info");
    setTimeout(() => {
      this.showToast("✅ WhatsApp Business API: HTTP 200 OK (Latensi: 118 ms) • Kuota 8.450 / 10.000 Terhubung Normal!", "success");
      if (this.state.systemAuditLogs) {
        this.state.systemAuditLogs.unshift({
          id: `AUD-${Date.now().toString().slice(-6)}`,
          time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + " WIB",
          category: "GATEWAY",
          categoryLabel: "Gateway API",
          severity: "INFO",
          actorName: "Aipda Pratama, S.Kom.",
          actorNrp: "83070455",
          actorRole: "SI_TIK",
          ip: "192.168.1.110",
          device: "Workstation TIK (Chrome)",
          action: "Uji Koneksi WhatsApp Gateway Berhasil",
          details: "Ping ke https://api.fonnte.com/send menghasilkan response HTTP 200 OK dalam 118ms. Token API valid.",
          status: "SUKSES"
        });
        this.saveState();
        this.renderSitikAuditTable();
      }
    }, 600);
  }

  testSmsGateway() {
    this.showToast("⏳ Menguji ping endpoint Sentral SMS OTP Mabes Polri...", "info");
    setTimeout(() => {
      this.showToast("✅ SMS Gateway OTP: Status SIAGA / STANDBY (4.920 SMS Siap Pakai) • Jalur Failover Aktif!", "info");
    }, 600);
  }

  testTileServer() {
    this.showToast("⏳ Menguji koneksi & kecepatan render CDN Tile Peta Taktis...", "info");
    setTimeout(() => {
      this.showToast("🗺️ Tile Server Peta CartoDB: Terhubung (Latensi: 32 ms) • Cache Hit Ratio: 98.6%!", "success");
    }, 500);
  }

  testMqttBroker() {
    this.showToast("⏳ Menguji handshake mTLS ke Broker Telemetri IoT (Port 8883)...", "info");
    setTimeout(() => {
      this.showToast("📡 Broker Telemetri MQTT: 4 / 4 Armada Patroli Terhubung (100% Online, Heartbeat 5 Detik)!", "success");
    }, 600);
  }

  runManualBackup() {
    if (confirm("Jalankan pencadangan basis data MySQL sekarang?\nProses ini akan meng-dump seluruh tabel bounded context dan mengenkripsinya dengan AES-256 GCM.")) {
      this.showToast("⏳ Menjalankan mysqldump & kompresi enkripsi AES-256...", "info");
      setTimeout(() => {
        const timeNow = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + " WIB";
        this.showToast(`💾 Pencadangan Sukses! Snapshot berukuran 184.2 MB tersimpan di Cloud Mabes & NAS Polres (${timeNow}).`, "success");
      }, 1000);
    }
  }

  downloadLatestBackup() {
    this.showToast("📥 Menyiapkan berkas snapshot terenkripsi: simapres_110_backup_latest.sql.gz.enc...", "info");
    setTimeout(() => {
      alert();
    }, 500);
  }


  // --- ROLE: OPERATOR SPKT METHODS ---
  renderSpktView() {
    const tbody = document.getElementById('spkt-recent-tbody');
    const pendingCountEl = document.getElementById('spkt-pending-count');
    if (!tbody) return;

    const pendingList = this.state.complaints.filter(c => c.status === 'BELUM_DITANGANI');
    if (pendingCountEl) {
      pendingCountEl.textContent = `${pendingList.length} Belum Didisposisi`;
    }

    tbody.innerHTML = this.state.complaints.slice(0, 6).map(c => {
      let statusBadge = '';
      if (c.status === 'BELUM_DITANGANI') statusBadge = '<span class="badge badge-danger">⚠️ Belum Didisposisi</span>';
      else if (c.status === 'DISPOSISI') statusBadge = '<span class="badge badge-warning" style="background:#F59E0B; color:#000; font-weight:800;">⏳ Disposisi (Menunggu Anggota)</span>';
      else if (c.status === 'MENUJU_TKP') statusBadge = '<span class="badge badge-info">🚔 Petugas Bergerak</span>';
      else if (c.status === 'PENANGANAN_TKP') statusBadge = '<span class="badge badge-gold">🔍 Olah TKP / Proses</span>';
      else statusBadge = '<span class="badge badge-success">✅ Selesai</span>';

      return `
        <tr>
          <td>
            <span class="table-code">${c.id}</span><br>
            <small style="color:var(--text-muted)">${c.timestamp}</small>
          </td>
          <td>
            <strong>${c.title}</strong><br>
            <small style="color:var(--text-secondary)">📍 ${c.locationName} &bull; Pelapor: ${c.reporter}</small>
          </td>
          <td>${statusBadge}</td>
          <td>
            <div style="display:flex; gap:6px;">
              <button class="btn-quick" onclick="app.viewComplaintDetail('${c.id}')">Bukti</button>
              ${c.status === 'BELUM_DITANGANI' ? `<button class="btn-primary" style="padding:4px 8px; font-size:11px;" onclick="app.openDispatchModal('${c.id}')">🚀 Disposisi</button>` : (c.status === 'DISPOSISI' ? `<span class="badge badge-warning" style="font-size:10px;">Menunggu Personel</span>` : '')}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // ============================================================================
  // SPKT Evidence File Upload Handlers (Photo, Document, Video)
  // ============================================================================
  handleSpktFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    const typeSelect = document.getElementById('select-spkt-evidence-type');
    const selectedType = typeSelect ? typeSelect.value : 'PHOTO';
    const sizeKb = (file.size / 1024).toFixed(1);
    const sizeStr = file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : `${sizeKb} KB`;

    let icon = '📄';
    let typeName = 'Dokumen';
    if (selectedType === 'PHOTO' || file.type.startsWith('image/')) {
      icon = '📸';
      typeName = 'Foto Bukti';
    } else if (selectedType === 'VIDEO' || file.type.startsWith('video/')) {
      icon = '🎥';
      typeName = 'Video Bukti';
    } else if (selectedType === 'DOC' || file.name.endsWith('.pdf')) {
      icon = '📑';
      typeName = 'Dokumen Berkas';
    }

    this.selectedSpktFile = {
      name: file.name,
      size: sizeStr,
      type: selectedType,
      typeName: typeName,
      icon: icon,
      dataUrl: '#'
    };

    // If image, read as data URL for live preview
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (this.selectedSpktFile) {
          this.selectedSpktFile.dataUrl = e.target.result;
        }
      };
      reader.readAsDataURL(file);
    }

    // Update UI Preview
    const previewEl = document.getElementById('spkt-file-preview');
    const nameEl = document.getElementById('preview-file-name');
    const metaEl = document.getElementById('preview-file-meta');
    const iconEl = document.getElementById('preview-file-icon');

    if (previewEl && nameEl && metaEl && iconEl) {
      nameEl.textContent = file.name;
      metaEl.textContent = `${typeName} • ${sizeStr}`;
      iconEl.textContent = icon;
      previewEl.style.display = 'flex';
    }

    this.showToast(`Berkas ${file.name} (${sizeStr}) siap dilampirkan!`, 'info');
  }

  clearSpktFile() {
    this.selectedSpktFile = null;
    this.showResolvedMapIncidents = false;
    this.complaintMarkers = {};
    const fileInput = document.getElementById('input-spkt-file');
    if (fileInput) fileInput.value = '';
    const previewEl = document.getElementById('spkt-file-preview');
    if (previewEl) previewEl.style.display = 'none';
  }

  simulateSpktIncomingCall() {
    const callers = [
      { name: "Ibu Dewi Lestari", phone: "0812-4455-6677", cat: "Curanmor", loc: "Jl. Pahlawan No. 45 Depan Toko Emas Berkah", desc: "Sepeda motor Vario 160 warna merah baru saja dicuri saat ditinggal beli emas, pelaku 2 orang pakai helm hitam lari ke arah timur." },
      { name: "Pak Hendriawan", phone: "0856-7788-9900", cat: "Tawuran", loc: "Depan SMP Negeri 3 Dekat Lapangan Futsal", desc: "Sekelompok anak sekolah sekitar 20 orang saling lempar batu dan bawa penggaris besi, situasi memanas jalanan macet." },
      { name: "Bpk. Surya Dinata", phone: "0877-3344-1122", cat: "Laka Lantas", loc: "Jl. Gatot Subroto Simpang Lampu Merah Kencana", desc: "Truk boks menabrak separator jalan dan motor di belakangnya terjatuh, korban luka di tangan, butuh penguraian lalin." }
    ];

    const pick = callers[Math.floor(Math.random() * callers.length)];

    document.getElementById('input-spkt-phone').value = pick.phone;
    document.getElementById('input-spkt-name').value = pick.name;
    document.getElementById('select-spkt-category').value = pick.cat;
    document.getElementById('select-spkt-priority').value = 'DARURAT';
    document.getElementById('input-spkt-location').value = pick.loc;
    document.getElementById('textarea-spkt-desc').value = pick.desc;

    // Simulasi otomatis memilih berkas bukti awal
    const mockFiles = [
      { name: "Foto_KTP_dan_Barang_Bukti.jpg", size: "1.4 MB", type: "PHOTO", typeName: "Foto Bukti", icon: "📸", dataUrl: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80" },
      { name: "Rekaman_CCTV_Detik_Kejadian.mp4", size: "8.2 MB", type: "VIDEO", typeName: "Video Bukti", icon: "🎥", dataUrl: "#" },
      { name: "Dokumen_Surat_Keterangan_RT.pdf", size: "480 KB", type: "DOC", typeName: "Dokumen Berkas", icon: "📑", url: "#" }
    ];
    const pickFile = mockFiles[Math.floor(Math.random() * mockFiles.length)];
    this.selectedSpktFile = pickFile;

    const previewEl = document.getElementById('spkt-file-preview');
    const nameEl = document.getElementById('preview-file-name');
    const metaEl = document.getElementById('preview-file-meta');
    const iconEl = document.getElementById('preview-file-icon');
    const typeSelect = document.getElementById('select-spkt-evidence-type');
    if (typeSelect) typeSelect.value = pickFile.type;

    if (previewEl && nameEl && metaEl && iconEl) {
      nameEl.textContent = pickFile.name;
      metaEl.textContent = `${pickFile.typeName} • ${pickFile.size}`;
      iconEl.textContent = pickFile.icon;
      previewEl.style.display = 'flex';
    }

    this.showToast(`📞 PANGGILAN 110 MASUK: ${pick.name} (${pick.phone})! Data & Berkas Bukti Awal (${pickFile.name}) terisi otomatis.`, 'warning');
  }

  submitSpktComplaint() {
    const phone = document.getElementById('input-spkt-phone').value.trim();
    const name = document.getElementById('input-spkt-name').value.trim();
    const cat = document.getElementById('select-spkt-category').value;
    const priority = document.getElementById('select-spkt-priority').value;
    const loc = document.getElementById('input-spkt-location').value.trim();
    const lat = parseFloat(document.getElementById('input-spkt-lat').value) || -6.2195;
    const lng = parseFloat(document.getElementById('input-spkt-lng').value) || 106.8480;
    const desc = document.getElementById('textarea-spkt-desc').value.trim();

    if (!phone || !name || !loc || !desc) {
      alert("Mohon lengkapi seluruh formulir penerimaan laporan 110.");
      return;
    }

    const newId = `LP-110-2026-${String(this.state.complaints.length + 50).padStart(4, '0')}`;
    const now = new Date();
    const timeStr = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`;

    const newComplaint = {
      id: newId,
      title: `Laporan 110: Dugaan ${cat} - ${name}`,
      reporter: name,
      phone: phone,
      category: cat,
      timestamp: timeStr,
      locationName: loc,
      lat: lat,
      lng: lng,
      status: "BELUM_DITANGANI",
      priority: priority,
      assignedOfficer: null,
      timeline: [
        {
          stage: "VERIFIKASI_110",
          time: timeStr.split(' ')[1],
          title: "1. Panggilan 110 Diterima & Diinput Operator SPKT",
          desc: `Laporan diterima oleh Operator SPKT Briptu Siti Nurhaliza. ${desc}`,
          attachments: (() => {
            const list = [
              { type: "DOC", title: `Lembar_Disposisi_${newId}.pdf`, meta: "Format Digital Resmi SPKT", icon: "📑", url: "#" }
            ];
            if (this.selectedSpktFile) {
              list.push({
                type: this.selectedSpktFile.type,
                title: this.selectedSpktFile.name,
                meta: `${this.selectedSpktFile.typeName} • ${this.selectedSpktFile.size} • Diunggah Operator SPKT`,
                icon: this.selectedSpktFile.icon,
                url: this.selectedSpktFile.dataUrl || "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80"
              });
            }
            return list;
          })()
        }
      ]
    };

    this.state.complaints.unshift(newComplaint);
    this.saveState();

    // Reset Form
    document.getElementById('input-spkt-phone').value = '';
    document.getElementById('input-spkt-name').value = '';
    document.getElementById('input-spkt-location').value = '';
    document.getElementById('textarea-spkt-desc').value = '';

    this.renderSpktView();
    alert(`Laporan berhasil dicatat di SPKT!

Nomor Tiket: ${newId}
Pelapor: ${name} (${phone})

Laporan langsung berstatus 'BELUM DITANGANI' di Command Center Pimpinan untuk segera didisposisikan.`);
    this.showToast(`Laporan ${newId} berhasil diinput Operator SPKT!`, 'success');
  }

  // --- TACTICAL CANVAS DRAW ENGINE ---
  drawTacticalCanvas(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width = (canvas.parentElement && canvas.parentElement.clientWidth) || 700;
    const height = canvas.height = (canvasId === 'personil-canvas' ? 320 : 380);

    // Deep Dark Navy Base Map
    ctx.fillStyle = '#0B1424';
    ctx.fillRect(0, 0, width, height);

    // 1. Draw Waterways / River (Kali Cisadane / Ciliwung)
    ctx.fillStyle = 'rgba(14, 116, 144, 0.25)';
    ctx.strokeStyle = '#0891B2';
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(0, height * 0.25);
    ctx.bezierCurveTo(width * 0.3, height * 0.15, width * 0.4, height * 0.55, width * 0.7, height * 0.45);
    ctx.bezierCurveTo(width * 0.85, height * 0.35, width * 0.9, height * 0.7, width, height * 0.75);
    ctx.stroke();

    // River Water Label
    ctx.fillStyle = 'rgba(56, 189, 248, 0.6)';
    ctx.font = 'italic 10px Plus Jakarta Sans, sans-serif';
    ctx.fillText('~ Aliran Kali Cisadane / Ciliwung ~', width * 0.35, height * 0.38);

    // 2. Draw Realistic City District Blocks
    ctx.fillStyle = 'rgba(30, 41, 59, 0.4)';
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.5)';
    ctx.lineWidth = 1;
    const districts = [
      { x: 30, y: 30, w: 120, h: 80, label: 'Kawasan Perbankan' },
      { x: 180, y: 40, w: 140, h: 90, label: 'Sentra Bisnis Grand Mall' },
      { x: width - 200, y: 50, w: 160, h: 100, label: 'Pemukiman Cempaka' },
      { x: 50, y: height - 130, w: 150, h: 80, label: 'Kawasan Industri Timur' },
      { x: width - 240, y: height - 140, w: 180, h: 90, label: 'Perumahan Mekarsari' }
    ];
    districts.forEach(d => {
      ctx.fillRect(d.x, d.y, d.w, d.h);
      ctx.strokeRect(d.x, d.y, d.w, d.h);
      ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
      ctx.font = '9px Plus Jakarta Sans, sans-serif';
      ctx.fillText(d.label, d.x + 8, d.y + 16);
      ctx.fillStyle = 'rgba(30, 41, 59, 0.4)';
    });

    // 3. Draw Highway / Tol Lingkar (Double Orange Line)
    ctx.strokeStyle = '#D97706';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(0, height * 0.85);
    ctx.lineTo(width * 0.45, height * 0.65);
    ctx.lineTo(width, height * 0.2);
    ctx.stroke();

    ctx.strokeStyle = '#FDE68A';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(0, height * 0.85);
    ctx.lineTo(width * 0.45, height * 0.65);
    ctx.lineTo(width, height * 0.2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#F59E0B';
    ctx.font = 'bold 10px Plus Jakarta Sans, sans-serif';
    ctx.fillText('🛣️ TOL LINGKAR LUAR (JORR)', width * 0.55, height * 0.5);

    // 4. Draw Primary Arterial Avenues (Jl. Sudirman, Jl. Thamrin, Jl. Gatot Subroto)
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 5;
    // Jl. Jend. Sudirman
    ctx.beginPath();
    ctx.moveTo(width * 0.25, 0);
    ctx.lineTo(width * 0.28, height);
    ctx.stroke();
    // Jl. Gatot Subroto
    ctx.beginPath();
    ctx.moveTo(0, height * 0.45);
    ctx.lineTo(width, height * 0.52);
    ctx.stroke();

    // Road Labels
    ctx.fillStyle = 'rgba(203, 213, 225, 0.7)';
    ctx.font = '9px Plus Jakarta Sans, sans-serif';
    ctx.fillText('Jl. Jend. Sudirman', width * 0.29, 60);
    ctx.fillText('Jl. Gatot Subroto', width * 0.1, height * 0.43);
    ctx.fillText('Jl. Cempaka Raya', width * 0.65, height * 0.75);

    const cx = width / 2;
    const cy = height / 2;

    // Draw Dynamic Patrol Route Lines from checkpoints
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - 140, cy - 60);
    ctx.lineTo(cx - 60, cy - 20);
    ctx.lineTo(cx + 30, cy + 10);
    ctx.lineTo(cx + 90, cy + 40);
    ctx.stroke();

    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(cx + 90, cy + 40);
    ctx.lineTo(cx + 140, cy + 90);
    ctx.lineTo(cx - 20, cy + 100);
    ctx.lineTo(cx - 140, cy - 60);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Dynamic Hotspots from state
    this.state.hotspots.forEach((hs, idx) => {
      const hx = cx + (idx === 0 ? 30 : idx === 1 ? -40 : idx === 2 ? 130 : (idx === 3 ? 90 : -100));
      const hy = cy + (idx === 0 ? -30 : idx === 1 ? 75 : idx === 2 ? 50 : (idx === 3 ? -80 : 30));

      const grad = ctx.createRadialGradient(hx, hy, 4, hx, hy, 32);
      grad.addColorStop(0, 'rgba(239, 68, 68, 0.45)');
      grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(hx, hy, 32, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.arc(hx, hy, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#F8FAFC';
      ctx.font = 'bold 10px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(`🚨 ${hs.name}`, hx + 10, hy + 4);
    });

    // Draw Mapolres
    ctx.fillStyle = '#3B82F6';
    ctx.beginPath();
    ctx.arc(cx - 140, cy - 60, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#60A5FA';
    ctx.font = 'bold 11px "Plus Jakarta Sans"';
    ctx.fillText("🏢 MAPOLRES METRO", cx - 130, cy - 64);

    // Draw Current Officer Pos
    const ox = cx + 90;
    const oy = cy + 40;

    ctx.strokeStyle = 'rgba(241, 196, 15, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(ox, oy, 16, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#F1C40F';
    ctx.beginPath();
    ctx.arc(ox, oy, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#F1C40F';
    ctx.font = 'bold 11px "Plus Jakarta Sans"';
    ctx.fillText("👮‍♂️ Patroli Samapta (Bripka Ahmad)", ox + 12, oy + 4);

    // Overlay legend
    ctx.fillStyle = 'rgba(11, 25, 44, 0.85)';
    ctx.fillRect(10, height - 30, width - 20, 24);
    ctx.strokeStyle = '#334155';
    ctx.strokeRect(10, height - 30, width - 20, 24);

    ctx.fillStyle = '#94A3B8';
    ctx.font = '10px "Plus Jakarta Sans"';
    ctx.fillText("🟢 Rute Patroli Selesai  |  🟠 Rute Rencana Patroli  |  🔴 Titik Rawan Kriminalitas  |  🟡 Posisi Unit Aktif", 18, height - 14);
  }

  // --- MODAL UTILS ---
  
  openPageGuideModal(targetView = null) {
    const view = targetView || this.currentView || 'gateway';
    const guide = PAGE_GUIDES_DATA[view] || PAGE_GUIDES_DATA['gateway'];

    // Update role select if present
    const selectEl = document.getElementById('guide-role-select');
    if (selectEl) selectEl.value = view;

    // Header Title
    const titleEl = document.getElementById('guide-modal-header-title');
    if (titleEl) titleEl.textContent = `${guide.icon || '📖'} Panduan Modul: ${guide.title}`;

    // SOP Section
    const badgeEl = document.getElementById('guide-sop-badge');
    if (badgeEl) badgeEl.textContent = guide.sopBadge;
    const sopTitleEl = document.getElementById('guide-sop-title');
    if (sopTitleEl) sopTitleEl.textContent = guide.sopTitle;
    const sopDescEl = document.getElementById('guide-sop-desc');
    if (sopDescEl) sopDescEl.textContent = guide.sopDesc;

    // Purpose Section
    const purposeEl = document.getElementById('guide-modal-purpose');
    if (purposeEl) purposeEl.innerHTML = guide.purpose;

    // Features List
    const featListEl = document.getElementById('guide-modal-features-list');
    if (featListEl) {
      featListEl.innerHTML = guide.features.map(f => `
        <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid var(--card-border); border-left: 3px solid ${f.badgeColor ? f.badgeText : 'var(--accent-gold)'}; padding: 10px 14px; border-radius: var(--radius-sm);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <strong style="color:#fff; font-size:13px; display:flex; align-items:center; gap:6px;">
              <span>${f.icon || '🔹'}</span> ${f.name}
            </strong>
            ${f.badge ? `<span class="badge" style="background:${f.badgeColor || 'rgba(59,130,246,0.2)'}; color:${f.badgeText || '#93C5FD'}; font-size:10px;">${f.badge}</span>` : ''}
          </div>
          <p style="font-size:12px; color:var(--text-secondary); line-height:1.5; margin:0;">
            ${f.desc}
          </p>
        </div>
      `).join('');
    }

    // Steps List
    const stepsListEl = document.getElementById('guide-modal-steps-list');
    if (stepsListEl) {
      stepsListEl.innerHTML = `
        <ol style="margin: 0; padding-left: 20px; display: flex; flex-direction: column; gap: 8px; font-size: 12px; color: var(--text-primary); line-height: 1.6;">
          ${guide.steps.map(step => `
            <li style="padding-left: 4px;">
              <strong style="color: #fff;">${step.title}:</strong> ${step.desc}
            </li>
          `).join('')}
        </ol>
      `;
    }

    // Client Defense Tips
    const tipsEl = document.getElementById('guide-modal-client-tips');
    if (tipsEl) {
      tipsEl.innerHTML = guide.clientTips;
    }

    this.openModal('modal-page-guide');
  }

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
    if (modalId === 'modal-public-new-report') {
      this.preparePublicReportModal();
    }
  }

  closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'warning') icon = '⚠️';
    if (type === 'danger') icon = '🚨';

    toast.innerHTML = `<span>${icon}</span> <div>${message}</div>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  }

  // ==========================================================================
  // ROLE: KANIT / PAWAS (PENGAWASAN OPERASIONAL SEKTOR)
  // ==========================================================================
  switchKanitTab(tabId) {
    this.activeKanitTab = tabId;
    document.querySelectorAll('.kanit-tab-btn').forEach(btn => {
      if (btn.getAttribute('data-tab') === tabId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    document.querySelectorAll('.kanit-tab-content').forEach(content => {
      content.classList.remove('active');
    });

    const target = document.getElementById(tabId);
    if (target) target.classList.add('active');

    if (tabId === 'tab-kanit-plotting') {
      setTimeout(() => this.drawTacticalCanvas('kanit-tactical-canvas'), 100);
    }
  }

  renderKanitView() {
    this.renderKanitKpis();
    this.renderKanitLogTable();
    this.renderKanitOfficerStatusList();
    this.renderKanitPresensiTable();
    setTimeout(() => this.drawTacticalCanvas('kanit-tactical-canvas'), 150);
  }

  renderKanitKpis() {
    const totalEl = document.getElementById('kpi-kanit-total');
    const pendingEl = document.getElementById('kpi-kanit-pending');
    const approvedEl = document.getElementById('kpi-kanit-approved');

    const totalLogs = this.state.eLogbook.length;
    const pendingLogs = this.state.eLogbook.filter(l => l.status === 'MENUNGGU').length;
    const approvedLogs = this.state.eLogbook.filter(l => l.status === 'DISETUJUI').length;

    if (totalEl) totalEl.textContent = totalLogs;
    if (pendingEl) pendingEl.textContent = pendingLogs;
    if (approvedEl) approvedEl.textContent = approvedLogs;
  }

  filterKanitLogTable(type) {
    this.kanitFilter = type;
    this.renderKanitLogTable();
  }

  renderKanitLogTable() {
    const tbody = document.getElementById('kanit-log-tbody');
    if (!tbody) return;

    let logs = this.state.eLogbook;
    if (this.kanitFilter && this.kanitFilter !== 'ALL') {
      logs = logs.filter(l => l.type === this.kanitFilter);
    }

    if (logs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px; color:var(--text-muted);">Tidak ada log kegiatan anggota dalam kategori ini.</td></tr>';
      return;
    }

    tbody.innerHTML = logs.map(log => {
      let statusBadge = '';
      let actionBtn = '';
      let rowStyle = '';

      if (log.status === 'DISETUJUI') {
        statusBadge = `<span class="badge badge-success">✅ Disahkan Kanit</span>`;
        actionBtn = `<button class="btn-quick" style="border-color:#10B981; color:#6EE7B7;" onclick="app.openKanitModal('${log.id}')">📄 Rincian Valid</button>`;
      } else if (log.status === 'KLARIFIKASI') {
        statusBadge = `<span class="badge badge-warning">📞 Panggilan HT</span>`;
        actionBtn = `<button class="btn-quick" style="border-color:#F59E0B; color:#FCD34D;" onclick="app.openKanitModal('${log.id}')">📞 Hubungi Lagi</button>`;
        rowStyle = 'background: rgba(245, 158, 11, 0.08);';
      } else if (log.status === 'DITERUSKAN_PROPAM' || log.status === 'DITOLAK') {
        statusBadge = `<span class="badge badge-danger">🚨 Ranah Seksi Propam</span>`;
        actionBtn = `<button class="btn-quick" style="border-color:#EF4444; color:#FCA5A5;" onclick="app.openKanitModal('${log.id}')">⚠️ Rincian Anomali</button>`;
        rowStyle = 'background: rgba(239, 68, 68, 0.08);';
      } else {
        // MENUNGGU
        if (log.discrepancyKm > 0.5) {
          statusBadge = `<span class="badge badge-danger">⚠️ Selisih GPS ${log.discrepancyKm} km</span>`;
          actionBtn = `<button class="btn-quick btn-danger-outline" onclick="app.openKanitModal('${log.id}')">🔍 Sidak / Limpahkan</button>`;
          rowStyle = 'background: rgba(239, 68, 68, 0.05);';
        } else {
          statusBadge = `<span class="badge badge-gold">⏳ Menunggu Pengesahan</span>`;
          actionBtn = `<button class="btn-primary" style="padding:4px 10px; font-size:11px; background:#0284C7;" onclick="app.openKanitModal('${log.id}')">✍️ Periksa & Sahkan</button>`;
        }
      }

      return `
        <tr style="${rowStyle}">
          <td>
            <span class="table-code">${log.id}</span><br>
            <small style="color:var(--text-muted);">${log.time}</small>
          </td>
          <td>
            <strong>${log.officerName}</strong><br>
            <small style="color:var(--text-secondary);">NRP ${log.officerNrp}</small>
          </td>
          <td>
            <span class="badge badge-info" style="font-size:9px; padding:2px 6px;">${log.type}</span>
            <div style="font-size:12px; font-weight:600; color:#fff; margin-top:2px;">${log.title}</div>
            <div style="font-size:11px; color:var(--text-muted);">${log.locationClaimed}</div>
          </td>
          <td>
            <div style="font-family:'JetBrains Mono'; font-size:11px; color:${log.discrepancyKm > 0.5 ? '#EF4444' : '#10B981'}; font-weight:700;">
              ${log.discrepancyKm > 0.5 ? '⚠️ Deviasi ' : '✅ Akurat '} ${log.discrepancyKm} km
            </div>
            <small style="color:${log.discrepancyKm > 0.5 ? '#F87171' : '#34D399'};">📍 Sensor GPS: ${log.locationGpsAddress || this.getAddressFromCoords(log.locationGps.lat, log.locationGps.lng)}</small>
          </td>
          <td>${statusBadge}</td>
          <td>${actionBtn}</td>
        </tr>
      `;
    }).join('');
  }

  renderKanitOfficerStatusList() {
    const listEl = document.getElementById('kanit-officer-status-list');
    if (!listEl) return;

    if (!this.state.kanitUnitMembers) {
      this.state.kanitUnitMembers = [
        { nrp: "88123456", name: "Bripka Ahmad Subagyo", rank: "Bripka", beat: "Beat 1 - Pasar & Sentra Perbankan", shift: "Shift Pagi (08:00 - 20:00)", logCount: 2, gpsScore: "100%", statusText: "Menuju TKP 110", statusBadge: "badge-info" },
        { nrp: "82050412", name: "Aipda Joko Susanto", rank: "Aipda", beat: "Beat 2 - Sentra Niaga & Cempaka", shift: "Shift Pagi (08:00 - 20:00)", logCount: 3, gpsScore: "98%", statusText: "Patroli Dialogis", statusBadge: "badge-success" },
        { nrp: "92070119", name: "Bripda Rizki Pratama", rank: "Bripda", beat: "Beat 3 - Perumahan & Jalur Protokol", shift: "Shift Pagi (08:00 - 20:00)", logCount: 1, gpsScore: "99%", statusText: "Standby Pos Polisi", statusBadge: "badge-gold" }
      ];
    }

    listEl.innerHTML = this.state.kanitUnitMembers.map(m => `
      <div style="background:#0B1424; border:1px solid var(--card-border); border-radius:var(--radius-sm); padding:12px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="display:flex; align-items:center; gap:8px;">
            <strong style="color:#fff;">${m.name}</strong>
            <span class="badge ${m.statusBadge}" style="font-size:9px;">${m.statusText}</span>
          </div>
          <div style="font-size:11px; color:var(--text-secondary); margin-top:2px;">
            NRP ${m.nrp} &bull; ${m.beat}
          </div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:11px; color:var(--text-muted);">Log Hari Ini:</div>
          <div style="font-size:14px; font-weight:700; color:var(--accent-gold);">${m.logCount} Kegiatan</div>
        </div>
      </div>
    `).join('');
  }

  renderKanitPresensiTable() {
    const tbody = document.getElementById('kanit-presensi-tbody');
    if (!tbody) return;

    if (!this.state.kanitUnitMembers) this.renderKanitOfficerStatusList();

    tbody.innerHTML = this.state.kanitUnitMembers.map(m => `
      <tr>
        <td>
          <strong>${m.name}</strong><br>
          <small style="color:var(--text-muted); font-family:'JetBrains Mono';">NRP ${m.nrp}</small>
        </td>
        <td>${m.rank} / Regu 1 Samapta</td>
        <td>${m.beat}</td>
        <td>${m.shift}</td>
        <td style="font-family:'JetBrains Mono'; font-weight:700; color:var(--accent-gold);">${m.logCount} Log Terkirim</td>
        <td style="font-family:'JetBrains Mono'; font-weight:800; color:#10B981;">${m.gpsScore}</td>
        <td><span class="badge badge-success">Hadir & Siaga</span></td>
      </tr>
    `).join('');
  }

  openKanitModal(logId) {
    const log = this.state.eLogbook.find(l => l.id === logId);
    if (!log) return;

    this.selectedLogForKanit = log;

    document.getElementById('kanit-modal-id').textContent = log.id;
    document.getElementById('kanit-modal-officer').textContent = `${log.officerName} (NRP ${log.officerNrp})`;
    document.getElementById('kanit-modal-time').textContent = log.time;
    document.getElementById('kanit-modal-type').textContent = log.type;
    document.getElementById('kanit-modal-title').textContent = log.title;
    document.getElementById('kanit-modal-claimed').textContent = log.locationClaimed;
    document.getElementById('kanit-modal-gps').textContent = log.locationGpsAddress || this.getAddressFromCoords(log.locationGps.lat, log.locationGps.lng);
    
    const distEl = document.getElementById('kanit-modal-distance');
    if (distEl) {
      distEl.textContent = `${log.discrepancyKm} km`;
      distEl.style.color = log.discrepancyKm > 0.5 ? '#EF4444' : '#10B981';
    }

    document.getElementById('kanit-modal-photo').src = log.photoUrl;
    document.getElementById('kanit-modal-notes').textContent = log.notes || '-';

    this.openModal('modal-kanit-verification');
  }

  kanitDecideLog(decision) {
    if (!this.selectedLogForKanit) return;
    const log = this.selectedLogForKanit;

    if (decision === 'APPROVE') {
      log.status = 'DISETUJUI';
      log.auditVerdict = 'VALID';
      log.verifiedBy = 'Iptu Budi Santoso, S.H. (Kanit Turjawali)';
      this.showToast(`✅ Log ${log.id} (${log.officerName}) TELAH DISAHKAN & DIVALIDASI Kanit!`, 'success');
    } else if (decision === 'CLARIFY') {
      log.status = 'KLARIFIKASI';
      log.verifiedBy = 'Panggilan Klarifikasi Kanit';
      this.showToast(`📞 Instruksi klarifikasi dikirim ke HT ${log.officerName}.`, 'warning');
    } else if (decision === 'ESCALATE_PROPAM') {
      log.status = 'DITERUSKAN_PROPAM';
      log.auditVerdict = 'MISMATCH_ALERT';
      log.verifiedBy = 'Dilimpahkan Kanit ke Seksi Propam';
      this.showToast(`🚨 Laporan ${log.id} berhasil dilimpahkan ke Seksi Propam untuk sidak pelanggaran disiplin!`, 'danger');
    }

    this.saveState();
    this.closeAllModals();
    this.renderKanitView();
    this.renderPimpinanAuditTable();
    this.renderPimpinanKpis();
  }

  // ==========================================================================
  // ROLE: SEKSI PROPAM (TERMINAL GAKKUMPLIN & KODE ETIK)
  // ==========================================================================
  switchPropamTab(tabId) {
    this.activePropamTab = tabId;
    document.querySelectorAll('.propam-tab-btn').forEach(btn => {
      if (btn.getAttribute('data-tab') === tabId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    document.querySelectorAll('.propam-tab-content').forEach(content => {
      content.classList.remove('active');
    });

    const target = document.getElementById(tabId);
    if (target) target.classList.add('active');
  }

  renderPropamView() {
    this.renderPropamKpis();
    this.renderPropamAuditTable();
    this.renderPropamBapTable();
  }

  renderPropamKpis() {
    const mismatchEl = document.getElementById('kpi-propam-mismatch');
    const invEl = document.getElementById('kpi-propam-investigating');
    const bapEl = document.getElementById('kpi-propam-bap');

    const mismatchCount = this.state.eLogbook.filter(l => l.auditVerdict === 'MISMATCH_ALERT' || l.discrepancyKm > 0.5).length;
    const invCount = this.state.eLogbook.filter(l => l.status === 'KLARIFIKASI' || l.status === 'PANGGILAN_PROPAM').length;
    const bapCount = this.state.propamBapRecords ? this.state.propamBapRecords.length : 2;

    if (mismatchEl) mismatchEl.textContent = mismatchCount;
    if (invEl) invEl.textContent = invCount;
    if (bapEl) bapEl.textContent = bapCount;
  }

  renderPropamAuditTable() {
    const tbody = document.getElementById('propam-investigasi-tbody');
    if (!tbody) return;

    // Filter only suspicious / mismatch logs or rejected logs
    const suspiciousLogs = this.state.eLogbook.filter(l => l.discrepancyKm > 0.5 || l.auditVerdict === 'MISMATCH_ALERT' || l.status === 'DITOLAK' || l.status === 'DITERUSKAN_PROPAM');

    if (suspiciousLogs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:24px; color:var(--text-muted);">Seluruh personel bertugas sesuai koridor GPS. Tidak ada alarm anomali aktif.</td></tr>';
      return;
    }

    tbody.innerHTML = suspiciousLogs.map(log => {
      let statusBadge = '';
      if (log.status === 'DITOLAK') {
        statusBadge = `<span class="badge badge-danger">❌ Berkas Ditolak / Diberi Teguran</span>`;
      } else if (log.status === 'PANGGILAN_PROPAM') {
        statusBadge = `<span class="badge badge-warning">📞 Panggilan Sidang Provos</span>`;
      } else {
        statusBadge = `<span class="badge badge-danger" style="animation:pulse 2s infinite;">🚨 Perlu Sidak Disiplin</span>`;
      }

      return `
        <tr style="background:rgba(239,68,68,0.08);">
          <td>
            <span class="table-code">${log.id}</span><br>
            <small style="color:var(--text-muted);">${log.time}</small>
          </td>
          <td>
            <strong style="color:#fff;">${log.officerName}</strong><br>
            <small style="color:var(--text-secondary); font-family:'JetBrains Mono';">NRP ${log.officerNrp}</small>
          </td>
          <td>
            <div style="font-size:12px;"><strong>Klaim Anggota:</strong> ${log.locationClaimed}</div>
            <div style="font-size:11.5px; color:#EF4444;">📍 <strong>Lokasi Fisik Riil:</strong> ${log.locationGpsAddress || this.getAddressFromCoords(log.locationGps.lat, log.locationGps.lng)}</div>
          </td>
          <td>
            <span style="font-family:'JetBrains Mono'; font-weight:800; color:#EF4444; font-size:14px;">
              ${log.discrepancyKm} km
            </span><br>
            <small style="color:#FCA5A5;">(Di luar toleransi 0.5 km)</small>
          </td>
          <td>${statusBadge}</td>
          <td>
            <button class="btn-primary" style="background:#DC2626; padding:4px 10px; font-size:11px;" onclick="app.openPropamModal('${log.id}')">
              🚨 Buka Berkas Sidak
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  renderPropamBapTable() {
    const tbody = document.getElementById('propam-bap-tbody');
    if (!tbody) return;

    if (!this.state.propamBapRecords) {
      this.state.propamBapRecords = [
        {
          id: "BAP-DIS/01/X/2026",
          date: "06 Okt 2026",
          officerName: "Bripka Hendra",
          officerNrp: "89010234",
          unit: "Bhabinkamtibmas Mekarsari",
          infraction: "Manipulasi Koordinat GPS Presisi (Klaim Sambang Balai RW 07, Foto di radius 6.84 km)",
          violationArticle: "Pasal 5 huruf a Perkapolri No. 7/2022 (Kode Etik Profesi)",
          status: "PEMERIKSAAN_PROVOS",
          sanctionRecommendation: "Teguran Tertulis & Penempatan Khusus (Patsus) 7 Hari",
          investigator: "Iptu Hendra Wijaya, S.H. (Kasi Propam)"
        },
        {
          id: "BAP-DIS/02/IX/2026",
          date: "28 Sep 2026",
          officerName: "Brigadir Dedi Kurniawan",
          officerNrp: "91020455",
          unit: "Sat Lantas",
          infraction: "Keterlambatan respon panggilan Quick Response 110 melebihi SLA 25 menit",
          violationArticle: "Pasal 7 ayat 1 huruf c Perkapolri No. 7/2022",
          status: "PUTUSAN_ANKUM",
          sanctionRecommendation: "Teguran Tertulis & Pengawasan Melekat",
          investigator: "Aipda Bambang (Bamin Provos)"
        }
      ];
    }

    tbody.innerHTML = this.state.propamBapRecords.map(b => `
      <tr>
        <td><strong style="color:var(--accent-gold); font-family:'JetBrains Mono';">${b.id}</strong></td>
        <td>${b.date}</td>
        <td>
          <strong>${b.officerName}</strong><br>
          <small style="color:var(--text-muted); font-family:'JetBrains Mono';">NRP ${b.officerNrp}</small>
        </td>
        <td>
          <div style="font-size:12px; color:#fff;">${b.infraction}</div>
          <small style="color:var(--text-muted);">${b.unit}</small>
        </td>
        <td style="font-size:11px; color:#FCD34D;">${b.violationArticle}</td>
        <td style="font-size:11px; color:#FCA5A5;"><strong>${b.sanctionRecommendation}</strong></td>
        <td><span class="badge badge-danger">${b.status}</span></td>
        <td>
          <button class="btn-quick" onclick="alert('Membuka Berkas Elektronik ' + '${b.id}' + '\n\nTerperiksa: ${b.officerName}\nRekomendasi Sanksi: ${b.sanctionRecommendation}')">
            📄 Unduh BA
          </button>
        </td>
      </tr>
    `).join('');
  }

  openPropamModal(logId) {
    const log = this.state.eLogbook.find(l => l.id === logId);
    if (!log) return;

    this.selectedLogForPropam = log;

    document.getElementById('propam-modal-id').textContent = log.id;
    document.getElementById('propam-modal-officer').textContent = `${log.officerName} (NRP ${log.officerNrp})`;
    document.getElementById('propam-modal-status').textContent = `Status: ${log.status}`;
    document.getElementById('propam-modal-distance').textContent = `${log.discrepancyKm} km`;
    document.getElementById('propam-modal-claimed').textContent = log.locationClaimed;
    document.getElementById('propam-modal-gps').textContent = log.locationGpsAddress || this.getAddressFromCoords(log.locationGps.lat, log.locationGps.lng);
    document.getElementById('propam-modal-photo').src = log.photoUrl;
    document.getElementById('propam-modal-notes').textContent = log.notes || '-';

    this.openModal('modal-propam-investigation');
  }

  propamDecideCase(decision) {
    if (!this.selectedLogForPropam) return;
    const log = this.selectedLogForPropam;

    if (decision === 'SANCTION') {
      log.status = 'DITOLAK';
      log.auditVerdict = 'REJECTED';
      log.verifiedBy = 'Seksi Propam Polres / Teguran Resmi';
      this.showToast(`❌ Log ${log.id} DITOLAK RESMI OLEH PROPAM. Teguran disiplin tercatat pada buku register etik!`, 'danger');
    } else if (decision === 'SUMMONS') {
      log.status = 'PANGGILAN_PROPAM';
      log.verifiedBy = 'Surat Panggilan Sipropam';
      this.showToast(`📞 Surat Panggilan Menghadap Ruang Provos diterbitkan untuk ${log.officerName}!`, 'warning');
    }

    this.saveState();
    this.closeAllModals();
    this.renderPropamView();
    this.renderPimpinanAuditTable();
    this.renderPimpinanKpis();
  }

  openCreateBapModal() {
    this.closeAllModals();
    if (this.selectedLogForPropam) {
      const nameEl = document.getElementById('bap-input-name');
      const nrpEl = document.getElementById('bap-input-nrp');
      if (nameEl) nameEl.value = this.selectedLogForPropam.officerName;
      if (nrpEl) nrpEl.value = this.selectedLogForPropam.officerNrp;
    }
    this.openModal('modal-propam-create-bap');
  }

  submitNewBap() {
    const name = document.getElementById('bap-input-name').value.trim();
    const nrp = document.getElementById('bap-input-nrp').value.trim();
    const unit = document.getElementById('bap-input-unit').value.trim();
    const article = document.getElementById('bap-input-article').value;
    const desc = document.getElementById('bap-input-desc').value.trim();
    const sanction = document.getElementById('bap-input-sanction').value;

    const newId = `BAP-DIS/0${(this.state.propamBapRecords ? this.state.propamBapRecords.length : 2) + 1}/X/2026`;
    const newBap = {
      id: newId,
      date: "07 Okt 2026",
      officerName: name,
      officerNrp: nrp,
      unit: unit,
      infraction: desc,
      violationArticle: article,
      status: "PEMERIKSAAN_PROVOS",
      sanctionRecommendation: sanction,
      investigator: "Iptu Hendra Wijaya, S.H. (Kasi Propam)"
    };


    if (!this.state.propamBapRecords) this.state.propamBapRecords = [];
    this.state.propamBapRecords.unshift(newBap);

    if (this.selectedLogForPropam) {
      this.selectedLogForPropam.status = 'DITOLAK';
      this.selectedLogForPropam.auditVerdict = 'REJECTED';
    }

    this.saveState();
    this.closeAllModals();
    this.renderPropamView();
    this.renderPimpinanAuditTable();
    this.showToast(`⚖️ Berkas BAP Disiplin ${newId} berhasil diterbitkan Seksi Propam!`, 'danger');
  }


  // ==========================================================================
  // ROLE: KABAG OPS (PENGENDALI OPERASIONAL TAKTIS & RENOPS)
  // ==========================================================================
  

  // ============================================================================
  // TACTICAL DISCRETION: HOT PURSUIT (PENGEJARAN TERTANGKAP TANGAN / KELUAR JALUR)
  // Berlandaskan Pasal 18 UU No. 2 Tahun 2002 tentang Kepolisian Negara RI
  // ============================================================================
  toggleHotPursuitMode() {
    this.isHotPursuitActive = !this.isHotPursuitActive;
    const btn = document.getElementById('btn-officer-pursuit');
    const banner = document.getElementById('officer-pursuit-active-banner');
    const kabagopsBanner = document.getElementById('kabagops-pursuit-alert-banner');
    const fleet = this.state.patrolFleet || (typeof INITIAL_DATA !== 'undefined' ? INITIAL_DATA.patrolFleet : []);
    const ahmadFleet = fleet.find(f => f.officerNrp === '88123456' || (f.callsign && f.callsign.includes('Samapta')));

    if (this.isHotPursuitActive) {
      if (btn) {
        btn.innerHTML = '⏹ Hentikan Mode Pengejaran';
        btn.style.background = '#475569';
      }
      if (banner) banner.style.display = 'flex';
      if (kabagopsBanner) kabagopsBanner.style.display = 'flex';

      if (ahmadFleet) {
        ahmadFleet.status = 'BERTUGAS';
        ahmadFleet.currentTask = '🚨 PENGEJARAN PELAKU CURANMOR (Hot Pursuit)';
        ahmadFleet.speedKmh = 68;
        ahmadFleet.currentLocationName = 'Jl. Merdeka Timur (Keluar Jalur Rute - Pengejaran Sah)';
        ahmadFleet.lat = -6.2230;
        ahmadFleet.lng = 106.8580;
      }

      // Add to audit trail log
      if (this.state.systemAuditLogs) {
        this.state.systemAuditLogs.unshift({
          id: `AUD-${Date.now().toString().slice(-6)}`,
          time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + " WIB",
          category: "DISPATCH",
          categoryLabel: "Diskresi Polisi",
          severity: "WARNING",
          actorName: "Bripka Ahmad Subagyo",
          actorNrp: "88123456",
          actorRole: "PERSONIL_LAPANGAN",
          ip: "10.12.84.15",
          device: "Samsung Galaxy XCover 5 (Android 14)",
          action: "Aktivasi Mode Pengejaran Pelaku Curanmor (Hot Pursuit)",
          details: "Personel Samapta mengaktifkan diskresi kepolisian keluar jalur patroli mengejar pelaku curanmor Honda Beat merah menuju Jl. Merdeka Timur. Audit deviasi rute ditangguhkan (Pasal 18 UU 2/2002).",
          status: "ALERT"
        });
      }

      this.saveState();
      this.showToast("🚨 MODE PENGEJARAN DIAKTIFKAN! Sirine aktif & deviasi rute dibebaskan dari audit Propam.", "danger");
    } else {
      if (btn) {
        btn.innerHTML = '<span>🚨</span> Aktifkan Mode Pengejaran Pelaku';
        btn.style.background = 'linear-gradient(135deg, #DC2626, #991B1B)';
      }
      if (banner) banner.style.display = 'none';
      if (kabagopsBanner) kabagopsBanner.style.display = 'none';

      if (ahmadFleet) {
        ahmadFleet.status = 'SIAGA';
        ahmadFleet.currentTask = 'Patroli Dialogis Presisi';
        ahmadFleet.speedKmh = 25;
        ahmadFleet.currentLocationName = 'Pos Pantau Simpang Sudirman (Kembali ke Rute)';
        ahmadFleet.lat = -6.2250;
        ahmadFleet.lng = 106.8520;
      }

      this.saveState();
      this.showToast("✅ Pengejaran selesai. Status armada kembali ke Patroli Presisi.", "success");
    }

    if (this.currentView === 'kabagops') {
      this.renderKabagOpsView();
    }
  }

  completeHotPursuit(outcome = 'TANGKAP') {
    this.toggleHotPursuitMode();

    const newId = `LP-110-2026-${String(this.state.complaints.length + 55).padStart(4, '0')}`;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`;

    const pursuitComplaint = {
      id: newId,
      title: "Penangkapan Tertangkap Tangan Pelaku Curanmor R2",
      reporter: "Hasil Tangkap Tangan Patroli Samapta (Bripka Ahmad)",
      phone: "0811-2233-4455",
      category: "Curanmor",
      timestamp: `${now.toISOString().split('T')[0]} ${timeStr}`,
      locationName: "Jl. Merdeka Timur Dekat Jembatan Tol Cempaka",
      lat: -6.2230,
      lng: 106.8580,
      status: "SELESAI",
      priority: "DARURAT",
      officer: "Bripka Ahmad Subagyo",
      officerName: "Bripka Ahmad Subagyo",
      officerNrp: "88123456",
      assignedVehicle: "Isuzu D-Max Samapta (R4-Samapta-81)",
      timeline: [
        {
          stage: "DISPOSISI",
          time: timeStr,
          title: "1. Diskresi Pengejaran Tertangkap Tangan",
          desc: "Petugas melihat tindak pidana pencurian motor langsung melakukan pengejaran taktis keluar rute patroli.",
          attachments: []
        },
        {
          stage: "PENANGANAN_TKP",
          time: timeStr,
          title: "2. Pelaku Dilumpuhkan & Barang Bukti Diamankan",
          desc: "Pelaku 1 orang berhasil diamankan bersama kunci T dan 1 unit motor Honda Beat hasil curian.",
          attachments: [
            { type: "PHOTO", title: "Foto_Pelaku_dan_Barang_Bukti_Motor.jpg", meta: "Dokumentasi Pengamanan Tersangka", icon: "📷", url: "#" }
          ]
        },
        {
          stage: "SELESAI",
          time: timeStr,
          title: "3. Penyerahan Tersangka ke Satreskrim Polres",
          desc: "Pelaku dan barang bukti diserahkan ke Piket Reskrim Polres Metro untuk penyidikan lebih lanjut.",
          attachments: [
            { type: "DOC", title: `BA_Serah_Terima_Tersangka_${newId}.pdf`, meta: "Berita Acara Penyerahan Tersangka Curanmor", icon: "📑", url: "#" }
          ]
        }
      ]
    };

    this.state.complaints.unshift(pursuitComplaint);
    this.saveState();

    alert(`TINDAKAN KEPOLISIAN BERHASIL!\n\nNomor Berkas: ${newId}\nTindakan: Pelaku Curanmor berhasil dilumpuhkan di Jl. Merdeka Timur.\nBarang Bukti: 1 Unit Sepeda Motor & Kunci T.\nStatus: Berkas Berita Acara terbit & dilimpahkan ke Satreskrim.\n\nDeviasi rute resmi dinyatakan SAH dan tercatat pada buku register dinas.`);
    this.showToast(`🏆 Pelaku curanmor tertangkap! Berkas ${newId} otomatis diterbitkan.`, 'success');

    if (this.currentView === 'personil') {
      this.renderPersonilView();
    } else if (this.currentView === 'kabagops') {
      this.renderKabagOpsView();
    }
  }

  dispatchRoadblockIntercept() {
    this.showToast("🚧 Instruksi Penyekatan Terkirim! TIM-PERINTIS-02 bergerak memblokir Simpang Merdeka Timur.", "success");
    if (this.state.systemAuditLogs) {
      this.state.systemAuditLogs.unshift({
        id: `AUD-${Date.now().toString().slice(-6)}`,
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + " WIB",
        category: "DISPATCH",
        categoryLabel: "Penyekatan Taktis",
        severity: "INFO",
        actorName: "Kompol Wahyu Santoso, S.H.",
        actorNrp: "78030211",
        actorRole: "KABAG_OPS",
        ip: "192.168.1.102",
        device: "PC Command Center (Chrome)",
        action: "Perintah Penyekatan Jalur Pelarian Curanmor",
        details: "Mengarahkan Tim Perintis Presisi Trail 02 untuk menggelar barikade penyekatan di Simpang Merdeka Timur guna mengadang laju pelaku.",
        status: "SUKSES"
      });
      this.saveState();
    }
  }


  // ============================================================================
  // KABAG OPS - BUS-STYLE ROUTE MAPPING & TRANSIT PREVIEW ENGINE
  // ============================================================================
  initRouteMap(containerId = 'kabagops-route-map') {
    const mapEl = document.getElementById(containerId);
    if (!mapEl) return;

    if (typeof L === 'undefined') {
      setTimeout(() => this.initRouteMap(containerId), 200);
      return;
    }

    if (!this.leafMaps) this.leafMaps = {};

    if (!this.leafMaps[containerId]) {
      const map = L.map(containerId, {
        center: [-6.2146, 106.8451],
        zoom: 14,
        zoomControl: true,
        attributionControl: false
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd'
      }).addTo(map);

      this.leafMaps[containerId] = map;
    }

    setTimeout(() => {
      if (this.leafMaps[containerId]) {
        this.leafMaps[containerId].invalidateSize();
        this.renderRouteMapData(containerId);
      }
    }, 100);
  }

  getRouteStopsForCurrentSelection() {
    const isGabungan = this.patrolConfigMode === 'GABUNGAN';
    const unitKey = isGabungan ? 'GABUNGAN_POLRES' : (this.selectedPatrolUnit || 'SAMAPTA_AHMAD');

    // Mako as base terminal
    const mako = {
      name: "Mako Polres Metro (Depot / Start)",
      address: "Jl. Veteran No. 1, Gambir",
      lat: -6.2146,
      lng: 106.8451,
      timeTarget: "20:30 WIB",
      dwellTime: "Persiapan Armada (15 Mnt)",
      isTerminal: true
    };

    let stops = [];
    if (isGabungan) {
      stops = (this.state.unitCheckpoints && this.state.unitCheckpoints.GABUNGAN_POLRES) || this.state.checkpoints;
    } else {
      stops = (this.state.unitCheckpoints && this.state.unitCheckpoints[unitKey]) || this.state.checkpoints;
    }

    // Format stops into a closed-loop transit route
    const formatted = [mako];
    stops.forEach((s, idx) => {
      formatted.push({
        ...s,
        order: idx + 1,
        dwellTime: s.dwellTime || "Patroli Dialogis (15-20 Mnt)"
      });
    });

    // Return to Mako
    formatted.push({
      name: "Mako Polres Metro (Finish / Return)",
      address: "Jl. Veteran No. 1, Gambir",
      lat: -6.2146,
      lng: 106.8451,
      timeTarget: "23:30 WIB",
      dwellTime: "Konsolidasi Pasukan",
      isTerminal: true
    });

    return formatted;
  }

  getRouteColorForCurrentSelection() {
    if (this.patrolConfigMode === 'GABUNGAN') return { color: '#EF4444', name: 'Operasi Gabungan (All Units)', icon: '🚨' };
    const unitKey = this.selectedPatrolUnit || 'SAMAPTA_AHMAD';
    const fa = this.state.fleetAssignments && this.state.fleetAssignments.find(f => f.unitKey === unitKey);
    if (fa) {
      return { color: fa.color || '#38BDF8', name: `${fa.vehicleName} (${fa.officerName})`, icon: fa.icon || '🚔' };
    }
    if (unitKey === 'SAMAPTA_AHMAD') return { color: '#38BDF8', name: 'Sedan Samapta 110-A (Bripka Ahmad)', icon: '🚔' };
    if (unitKey === 'PERINTIS_JOKO') return { color: '#34D399', name: 'Perintis Presisi Trail 02 (Aipda Joko)', icon: '🏍️' };
    if (unitKey === 'PATWAL_DANI') return { color: '#FBBF24', name: 'Patwal Sat Lantas R4-01 (Bripka Dani)', icon: '🚓' };
    return { color: '#38BDF8', name: 'Unit Samapta', icon: '🚔' };
  }

  renderRouteMapData(containerId = 'kabagops-route-map') {
    const map = this.leafMaps && this.leafMaps[containerId];
    if (!map) return;

    // Clear old layers
    if (this.routeLayers) {
      this.routeLayers.forEach(l => {
        try { map.removeLayer(l); } catch(e) {}
      });
    }
    this.routeLayers = [];

    const stops = this.getRouteStopsForCurrentSelection();
    const routeInfo = this.getRouteColorForCurrentSelection();

    // Update active unit badge
    const badgeEl = document.getElementById('route-active-unit-badge');
    if (badgeEl) {
      badgeEl.innerHTML = `${routeInfo.icon} ${routeInfo.name}`;
      badgeEl.style.borderColor = routeInfo.color;
    }

    const latlngs = stops.map(s => [s.lat, s.lng]);

    // 1. Draw Route Polyline (Bus-Line style with glow and dashes)
    const routeGlow = L.polyline(latlngs, {
      color: routeInfo.color,
      weight: 8,
      opacity: 0.35
    }).addTo(map);
    this.routeLayers.push(routeGlow);

    const routePoly = L.polyline(latlngs, {
      color: routeInfo.color,
      weight: 4,
      opacity: 0.95,
      dashArray: '8, 6'
    }).addTo(map);
    this.routeLayers.push(routePoly);

    // 2. Draw Numbered Bus-Stop Milestones & Buffer Circles
    stops.forEach((s, idx) => {
      const isStart = idx === 0;
      const isEnd = idx === stops.length - 1;
      const labelNum = isStart ? 'M' : (isEnd ? '🏁' : String(idx));

      const markerHtml = `
        <div style="width:30px; height:30px; border-radius:50%; background:${isStart || isEnd ? '#0284C7' : '#0F172A'}; border:2.5px solid ${routeInfo.color}; color:#fff; font-weight:800; font-size:${isStart||isEnd?'12px':'11px'}; display:flex; align-items:center; justify-content:center; box-shadow:0 0 10px ${routeInfo.color}; font-family:'JetBrains Mono';">
          ${labelNum}
        </div>
      `;

      const stopIcon = L.divIcon({
        html: markerHtml,
        className: 'custom-bus-stop-marker',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });

      const marker = L.marker([s.lat, s.lng], { icon: stopIcon }).addTo(map);
      marker.bindPopup(`
        <div style="font-family:'Plus Jakarta Sans'; font-size:12px; color:#fff; min-width:200px;">
          <div style="display:flex; align-items:center; gap:6px; margin-bottom:4px;">
            <span class="badge" style="background:${routeInfo.color}; color:#000; font-weight:800; font-size:10px;">
              ${isStart ? 'START TERMINAL' : (isEnd ? 'FINISH TERMINAL' : `POS PUSH ${idx}`)}
            </span>
          </div>
          <strong style="font-size:13px; color:#fff;">${s.name}</strong>
          <div style="color:#cbd5e1; font-size:11px; margin-top:2px;">📍 ${s.address || 'Wilayah Sektor'}</div>
          <div style="margin-top:6px; padding-top:6px; border-top:1px solid rgba(255,255,255,0.1); font-size:11px; color:#FCD34D;">
            🕒 Target Singgah: <strong>${s.timeTarget || '-'}</strong>
          </div>
          <div style="font-size:10.5px; color:#94A3B8;">
            ⏱️ Durasi: ${s.dwellTime || '15 Menit Patroli Dialogis'}
          </div>
        </div>
      `);
      this.routeLayers.push(marker);

      // Geofence circle
      const circle = L.circle([s.lat, s.lng], {
        radius: 60,
        color: routeInfo.color,
        weight: 1,
        fillColor: routeInfo.color,
        fillOpacity: 0.12
      }).addTo(map);
      this.routeLayers.push(circle);
    });

    // 3. Fit bounds
    try {
      map.fitBounds(routePoly.getBounds(), { padding: [40, 40] });
    } catch(e) {}

    // 4. Render Transit Stepper
    this.renderTransitRouteStepper(stops, routeInfo);
  }

  fitRouteMapBounds() {
    const map = this.leafMaps && this.leafMaps['kabagops-route-map'];
    if (map && this.routeLayers && this.routeLayers[0]) {
      try {
        map.fitBounds(this.routeLayers[0].getBounds(), { padding: [40, 40] });
      } catch(e) {}
    }
  }

  renderTransitRouteStepper(stops, routeInfo) {
    const stepperEl = document.getElementById('kabagops-transit-stepper');
    if (!stepperEl) return;

    let totalDistKm = 0;
    let totalMinutes = 0;

    let html = '';
    stops.forEach((s, idx) => {
      const isStart = idx === 0;
      const isEnd = idx === stops.length - 1;
      const labelNum = isStart ? 'M' : (isEnd ? '🏁' : String(idx));

      html += `
        <div class="transit-stop-node" id="transit-node-${idx}">
          <div class="transit-stop-bullet ${isStart || isEnd ? 'start-finish' : ''}" style="border-color:${routeInfo.color};" onclick="app.panRouteMapToStop(${s.lat}, ${s.lng}, '${s.name}')">
            ${labelNum}
          </div>
          <div class="transit-stop-name">${s.name.replace('Mako Polres Metro', 'Mako Polres')}</div>
          <div class="transit-stop-time">🕒 ${s.timeTarget || '-'}</div>
          <div class="transit-stop-dwell">⏱️ ${s.dwellTime ? s.dwellTime.replace('Patroli Dialogis', '').replace('Mnt', 'm') : '15m'}</div>
        </div>
      `;

      if (!isEnd) {
        const next = stops[idx + 1];
        const dist = this.calculateDistanceKm(s.lat, s.lng, next.lat, next.lng);
        const eta = this.getEtaMinutes(dist, 30);
        totalDistKm += dist;
        totalMinutes += (eta + 15); // driving + 15m dwell

        html += `
          <div class="transit-leg-line" style="background:linear-gradient(90deg, ${routeInfo.color}, #0284C7);">
            <span class="transit-leg-dist">${dist.toFixed(1)} km &bull; ${eta}m</span>
          </div>
        `;
      }
    });

    stepperEl.innerHTML = html;

    // Update stats
    const distEl = document.getElementById('route-stat-distance');
    const durEl = document.getElementById('route-stat-duration');
    const stopsEl = document.getElementById('route-stat-stops');

    if (distEl) distEl.innerText = `${totalDistKm.toFixed(1)} km`;
    if (durEl) {
      const hrs = Math.floor(totalMinutes / 60);
      const mnts = totalMinutes % 60;
      durEl.innerText = `${hrs > 0 ? hrs + ' Jam ' : ''}${mnts} Menit`;
    }
    if (stopsEl) stopsEl.innerText = `${stops.length - 2} Pos Pantau`;
  }

  panRouteMapToStop(lat, lng, name) {
    const map = this.leafMaps && this.leafMaps['kabagops-route-map'];
    if (map) {
      map.flyTo([lat, lng], 16, { duration: 0.8 });
      this.showToast(`Memusatkan peta ke: ${name}`, 'info');
    }
  }

  // ============================================================================
  // ROUTE PLAYBACK SIMULATION (PREVIEW PERGERAKAN TRAYEK ARMADA)
  // ============================================================================
  toggleRouteSimulation() {
    if (this.isRouteSimulating) {
      this.stopRouteSimulation();
    } else {
      this.startRouteSimulation();
    }
  }

  startRouteSimulation() {
    const map = this.leafMaps && this.leafMaps['kabagops-route-map'];
    if (!map) return;

    const stops = this.getRouteStopsForCurrentSelection();
    const routeInfo = this.getRouteColorForCurrentSelection();
    const ticker = document.getElementById('route-simulation-ticker');
    const btn = document.getElementById('btn-play-route-sim');

    this.isRouteSimulating = true;
    if (ticker) ticker.style.display = 'flex';
    if (btn) {
      btn.innerHTML = '⏹ Hentikan Simulasi';
      btn.style.background = 'linear-gradient(135deg, #EF4444, #B91C1C)';
    }

    if (this.routeSimMarker) {
      try { map.removeLayer(this.routeSimMarker); } catch(e) {}
    }

    const simIcon = L.divIcon({
      html: `
        <div style="width:36px; height:36px; border-radius:50%; background:#1E293B; border:3px solid ${routeInfo.color}; display:flex; align-items:center; justify-content:center; font-size:20px; box-shadow:0 0 16px ${routeInfo.color}; animation:pulseMarker 1.5s infinite;">
          ${routeInfo.icon}
        </div>
      `,
      className: 'route-sim-marker',
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });

    this.routeSimMarker = L.marker([stops[0].lat, stops[0].lng], { icon: simIcon, zIndexOffset: 1000 }).addTo(map);

    let currIdx = 0;
    const runStep = () => {
      if (!this.isRouteSimulating) return;

      const currStop = stops[currIdx];
      const nextIdx = (currIdx + 1) % stops.length;
      const nextStop = stops[nextIdx];

      // Highlight stepper bullet
      document.querySelectorAll('.transit-stop-bullet').forEach(b => b.classList.remove('active-pulse'));
      const activeBullet = document.querySelector(`#transit-node-${currIdx} .transit-stop-bullet`);
      if (activeBullet) activeBullet.classList.add('active-pulse');

      // Update Ticker
      const titleEl = document.getElementById('route-sim-title');
      const statusEl = document.getElementById('route-sim-status');
      const etaEl = document.getElementById('route-sim-eta');

      if (titleEl) titleEl.innerText = `Armada: ${routeInfo.name}`;
      if (statusEl) statusEl.innerText = `Singgah di ${currStop.name} &bull; ${currStop.dwellTime || 'Patroli Dialogis'}`;
      if (etaEl) etaEl.innerText = `Target Selanjutnya: ${nextStop.name}`;

      map.panTo([currStop.lat, currStop.lng], { animate: true, duration: 0.6 });

      // Move marker towards next stop smoothly
      this.routeSimTimer = setTimeout(() => {
        if (!this.isRouteSimulating) return;

        if (statusEl) statusEl.innerText = `Meluncur ke ${nextStop.name}... Kecepatan: 35 km/jam`;
        this.routeSimMarker.setLatLng([nextStop.lat, nextStop.lng]);

        currIdx = nextIdx;
        this.routeSimTimer = setTimeout(runStep, 2000);
      }, 1500);
    };

    runStep();
    this.showToast(`▶ Simulasi pergerakan rute ${routeInfo.name} dimulai!`, 'success');
  }

  stopRouteSimulation() {
    this.isRouteSimulating = false;
    if (this.routeSimTimer) clearTimeout(this.routeSimTimer);

    const map = this.leafMaps && this.leafMaps['kabagops-route-map'];
    if (this.routeSimMarker && map) {
      try { map.removeLayer(this.routeSimMarker); } catch(e) {}
      this.routeSimMarker = null;
    }

    document.querySelectorAll('.transit-stop-bullet').forEach(b => b.classList.remove('active-pulse'));
    const ticker = document.getElementById('route-simulation-ticker');
    const btn = document.getElementById('btn-play-route-sim');

    if (ticker) ticker.style.display = 'none';
    if (btn) {
      btn.innerHTML = '▶ Putar Simulasi Preview Rute';
      btn.style.background = 'linear-gradient(135deg, #0284C7, #0369A1)';
    }

    this.showToast('⏹ Simulasi rute dihentikan.', 'info');
  }

  
  // ============================================================================
  // KABAG OPS - DAILY ROUTE HISTORY LOG & BREADCRUMB PLAYBACK ENGINE
  // ============================================================================
  getDailyHistoryWaypoints(dateStr = '2026-10-07', fleetCallsign = 'SAT-SAMAPTA-01') {
    // Rich realistic daily GPS breadcrumb track for patrol vehicles
    return [
      { time: "08:00 WIB", lat: -6.2146, lng: 106.8451, speed: 0, status: "STASIONER", loc: "Mako Polres Metro (Pintu Keluar)", desc: "Apel Kesiapan Regu & Pemeriksaan Ranmor Dinas", isStop: true, dwell: "15 Menit" },
      { time: "08:15 WIB", lat: -6.2170, lng: 106.8430, speed: 32, status: "BERGERAK", loc: "Jl. Veteran No. 12", desc: "Patroli Wilayah Sektor Pusat, Kecepatan Normal", isStop: false },
      { time: "08:25 WIB", lat: -6.2185, lng: 106.8415, speed: 20, status: "BERGERAK", loc: "Jl. Surya Kencana", desc: "Memasuki Kawasan Niaga Pasar Anyar", isStop: false },
      { time: "08:35 WIB", lat: -6.2190, lng: 106.8410, speed: 0, status: "STASIONER", loc: "Pos Pantau 1 (Pasar Baru)", desc: "Checkpoint 1: Patroli Dialogis Pedagang & Satpam Pasar", isStop: true, dwell: "20 Menit" },
      { time: "08:55 WIB", lat: -6.2205, lng: 106.8440, speed: 28, status: "BERGERAK", loc: "Jl. Merdeka Selatan", desc: "Melanjutkan Koridor Menuju Jalur Protokol", isStop: false },
      { time: "09:10 WIB", lat: -6.2230, lng: 106.8480, speed: 45, status: "RESPON_110", loc: "Perempatan Lampu Merah Kencana", desc: "Menerima Panggilan Darurat 110 (Laka Lantas) - Divert ke TKP", isStop: false },
      { time: "09:20 WIB", lat: -6.2255, lng: 106.8495, speed: 0, status: "STASIONER", loc: "TKP Laka Lantas (Jl. Ir. H. Juanda No. 12)", desc: "Penanganan Pertama TKP (TP-TKP) Laka Lantas & Pengaturan Lalin", isStop: true, dwell: "50 Menit" },
      { time: "10:10 WIB", lat: -6.2270, lng: 106.8530, speed: 30, status: "BERGERAK", loc: "Jl. Juanda Timur", desc: "Penanganan TKP Selesai, Melanjutkan Koridor Patroli Rute", isStop: false },
      { time: "10:30 WIB", lat: -6.2300, lng: 106.8580, speed: 0, status: "STASIONER", loc: "Pos Pantau 2 (Sentra Perbankan BRI)", desc: "Checkpoint 2: Pemantauan Keamanan Galeri ATM & Dialog Satpam", isStop: true, dwell: "20 Menit" },
      { time: "10:50 WIB", lat: -6.2280, lng: 106.8560, speed: 35, status: "BERGERAK", loc: "Jl. Jend. Sudirman", desc: "Patroli Jalur Arteri Sektor Timur", isStop: false },
      { time: "11:15 WIB", lat: -6.2250, lng: 106.8520, speed: 0, status: "STASIONER", loc: "Pos Pantau 3 (Simpang Sudirman)", desc: "Checkpoint 3: Pengaturan Arus Siang & Antisipasi Balap Liar", isStop: true, dwell: "20 Menit" },
      { time: "11:35 WIB", lat: -6.2210, lng: 106.8490, speed: 25, status: "BERGERAK", loc: "Jl. Ahmad Yani", desc: "Patroli Dialogis Pertokoan Emas & Pegadaian", isStop: false },
      { time: "12:00 WIB", lat: -6.2180, lng: 106.8460, speed: 0, status: "STASIONER", loc: "Masjid Agung Al-Ikhlas", desc: "Istirahat, Ibadah Sholat Dzuhur & Konsolidasi Regu", isStop: true, dwell: "60 Menit" },
      { time: "13:00 WIB", lat: -6.2160, lng: 106.8420, speed: 26, status: "BERGERAK", loc: "Jl. Pemuda Sektor Barat", desc: "Melanjutkan Patroli Siang Kewilayahan", isStop: false },
      { time: "13:30 WIB", lat: -6.2130, lng: 106.8380, speed: 0, status: "STASIONER", loc: "Balai RW 04 Kelurahan Cempaka", desc: "Sambang Tokoh Masyarakat & Door to Door System (DDS)", isStop: true, dwell: "30 Menit" },
      { time: "14:00 WIB", lat: -6.2150, lng: 106.8350, speed: 18, status: "BERGERAK", loc: "Kompleks Griya Indah", desc: "Patroli Lingkungan Pemukiman Waspada Curanmor & Rumah Kosong", isStop: false },
      { time: "14:30 WIB", lat: -6.2195, lng: 106.8480, speed: 0, status: "STASIONER", loc: "TKP Percobaan Curanmor (Jl. Pahlawan)", desc: "Respon Cepat Aduan 110: Olah TKP & Amankan Rekaman CCTV", isStop: true, dwell: "45 Menit" },
      { time: "15:15 WIB", lat: -6.2210, lng: 106.8500, speed: 30, status: "BERGERAK", loc: "Jl. Pahlawan Timur", desc: "Kasus Dilimpahkan ke Reskrim, Melanjutkan Patroli Sore", isStop: false },
      { time: "16:00 WIB", lat: -6.2260, lng: 106.8540, speed: 0, status: "STASIONER", loc: "SPBU Pertamina Sudirman", desc: "Pam Obvit Pengawasan Distribusi BBM & Penertiban Antrean", isStop: true, dwell: "20 Menit" },
      { time: "16:30 WIB", lat: -6.2190, lng: 106.8470, speed: 25, status: "BERGERAK", loc: "Jl. Veteran Menuju Mako", desc: "Perjalanan Kembali Menuju Markas Komando", isStop: false },
      { time: "17:00 WIB", lat: -6.2146, lng: 106.8451, speed: 0, status: "STASIONER", loc: "Mako Polres Metro (Garasi Ranmor)", desc: "Tiba di Mako, Pemeriksaan Logistik, & Serah Terima Piket", isStop: true, dwell: "Finish" }
    ];
  }

  initHistoryMap(containerId = 'kabagops-history-map') {
    const mapEl = document.getElementById(containerId);
    if (!mapEl) return;

    if (typeof L === 'undefined') {
      setTimeout(() => this.initHistoryMap(containerId), 200);
      return;
    }

    if (!this.leafMaps) this.leafMaps = {};

    if (!this.leafMaps[containerId]) {
      const map = L.map(containerId, {
        center: [-6.2190, 106.8460],
        zoom: 14,
        zoomControl: true,
        attributionControl: false
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd'
      }).addTo(map);

      this.leafMaps[containerId] = map;
    }

    setTimeout(() => {
      if (this.leafMaps[containerId]) {
        this.leafMaps[containerId].invalidateSize();
        this.renderHistoryMapPath(containerId);
      }
    }, 100);
  }

  renderHistoryMapPath(containerId = 'kabagops-history-map') {
    const map = this.leafMaps && this.leafMaps[containerId];
    if (!map) return;

    // Clear old history layers
    if (this.historyLayers) {
      this.historyLayers.forEach(l => {
        try { map.removeLayer(l); } catch(e) {}
      });
    }
    this.historyLayers = [];

    const waypoints = this.getDailyHistoryWaypoints();
    const latlngs = waypoints.map(w => [w.lat, w.lng]);

    // Draw Cyan Traveled Polyline with Glow
    const glowPath = L.polyline(latlngs, {
      color: '#06B6D4',
      weight: 8,
      opacity: 0.3
    }).addTo(map);
    this.historyLayers.push(glowPath);

    const actualPath = L.polyline(latlngs, {
      color: '#06B6D4',
      weight: 4,
      opacity: 0.95
    }).addTo(map);
    this.historyLayers.push(actualPath);

    // Draw Stop Markers
    let stopIdx = 1;
    waypoints.forEach((w, idx) => {
      if (!w.isStop) return;

      const isStart = idx === 0;
      const isEnd = idx === waypoints.length - 1;
      const label = isStart ? 'M' : (isEnd ? '🏁' : String(stopIdx++));

      const markerHtml = `
        <div style="width:28px; height:28px; border-radius:50%; background:${isStart||isEnd?'#0284C7':'#0F172A'}; border:2.5px solid #22D3EE; color:#fff; font-weight:800; font-size:11px; display:flex; align-items:center; justify-content:center; box-shadow:0 0 10px #22D3EE; font-family:'JetBrains Mono';">
          ${label}
        </div>
      `;

      const icon = L.divIcon({
        html: markerHtml,
        className: 'history-stop-pin',
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const m = L.marker([w.lat, w.lng], { icon: icon }).addTo(map);
      m.bindPopup(`
        <div style="font-family:'Plus Jakarta Sans'; font-size:12px; color:#fff; min-width:210px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <span class="badge" style="background:#06B6D4; color:#000; font-weight:800; font-size:9.5px;">${w.time}</span>
            <span style="color:#FCD34D; font-size:10.5px; font-weight:700;">⏱️ ${w.dwell || 'Stasioner'}</span>
          </div>
          <strong style="font-size:13px; color:#fff;">${w.loc}</strong>
          <div style="font-size:11px; color:#cbd5e1; margin-top:2px;">${w.desc}</div>
        </div>
      `);
      this.historyLayers.push(m);
    });

    try {
      map.fitBounds(actualPath.getBounds(), { padding: [40, 40] });
    } catch(e) {}
  }

  renderHistoryTelemetryData() {
    this.renderHistoryLogsTable();
  }

  renderHistoryLogsTable() {
    const tbody = document.getElementById('kabagops-history-log-tbody');
    if (!tbody) return;

    const waypoints = this.getDailyHistoryWaypoints();

    tbody.innerHTML = waypoints.map((w, idx) => {
      let statusBadge = '<span class="badge badge-info" style="font-size:10px;">BERGERAK</span>';
      if (w.status === 'STASIONER') statusBadge = '<span class="badge badge-warning" style="font-size:10px; background:#F59E0B; color:#000; font-weight:800;">STASIONER</span>';
      else if (w.status === 'RESPON_110') statusBadge = '<span class="badge badge-danger" style="font-size:10px; font-weight:800;">RESPON 110</span>';

      return `
        <tr id="hist-row-${idx}" style="transition:background 0.3s; cursor:pointer;" onclick="app.scrubHistoryToStep(${idx})">
          <td style="font-family:'JetBrains Mono'; font-weight:700; color:#38BDF8;">${w.time}</td>
          <td>
            <strong style="color:#fff; font-size:12px;">${w.loc}</strong>
          </td>
          <td>
            <div style="font-family:'JetBrains Mono'; font-size:11px; color:#FCD34D;">${w.speed} km/jam</div>
            <div style="margin-top:2px;">${statusBadge}</div>
          </td>
          <td style="color:#cbd5e1; font-size:11.5px; line-height:1.4;">
            ${w.desc}
            ${w.dwell ? `<span style="color:#A78BFA; font-size:10.5px; margin-left:4px;">(Durasi: ${w.dwell})</span>` : ''}
          </td>
          <td>
            <span class="badge badge-success" style="font-size:9.5px;">🟢 GPS ±4m Valid</span>
          </td>
        </tr>
      `;
    }).join('');
  }

  onHistoryFilterChange() {
    const dateVal = document.getElementById('hist-select-date')?.value;
    const fleetVal = document.getElementById('hist-select-fleet')?.value;
    this.showToast(`Memuat log histori rute ${fleetVal} untuk tanggal ${dateVal}...`, 'info');
    this.renderHistoryMapPath('kabagops-history-map');
    this.renderHistoryLogsTable();
  }

  // ============================================================================
  // HISTORY PLAYBACK ENGINE (TIME SCRUBBER & ANIMATION)
  // ============================================================================
  toggleHistoryPlayback() {
    if (this.isHistoryPlaying) {
      this.pauseHistoryPlayback();
    } else {
      this.startHistoryPlayback();
    }
  }

  startHistoryPlayback() {
    const map = this.leafMaps && this.leafMaps['kabagops-history-map'];
    if (!map) return;

    const waypoints = this.getDailyHistoryWaypoints();
    const btn = document.getElementById('btn-history-play');

    this.isHistoryPlaying = true;
    if (btn) {
      btn.innerHTML = '⏸ Jeda (Pause)';
      btn.style.background = 'linear-gradient(135deg, #F59E0B, #D97706)';
    }

    if (!this.historyCarMarker) {
      const carIcon = L.divIcon({
        html: `
          <div style="width:36px; height:36px; border-radius:50%; background:#0F172A; border:3px solid #06B6D4; display:flex; align-items:center; justify-content:center; font-size:20px; box-shadow:0 0 16px #06B6D4;">
            🚔
          </div>
        `,
        className: 'route-sim-marker',
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });
      this.historyCarMarker = L.marker([waypoints[0].lat, waypoints[0].lng], { icon: carIcon, zIndexOffset: 1200 }).addTo(map);
    }

    if (this.historyPlayIdx === undefined || this.historyPlayIdx >= waypoints.length - 1) {
      this.historyPlayIdx = 0;
    }

    const speedMultiplier = this.historySpeedMultiplier || 2;
    const interval = Math.max(300, Math.floor(1200 / speedMultiplier));

    const step = () => {
      if (!this.isHistoryPlaying) return;

      this.scrubHistoryToStep(this.historyPlayIdx, false);
      this.historyPlayIdx++;

      if (this.historyPlayIdx < waypoints.length) {
        this.historyTimer = setTimeout(step, interval);
      } else {
        this.stopHistoryPlayback();
        this.showToast("Pemutaran riwayat rute patroli hari ini selesai.", "success");
      }
    };

    step();
    this.showToast("▶ Pemutaran jejak rute dimulai!", "info");
  }

  pauseHistoryPlayback() {
    this.isHistoryPlaying = false;
    if (this.historyTimer) clearTimeout(this.historyTimer);
    const btn = document.getElementById('btn-history-play');
    if (btn) {
      btn.innerHTML = '▶ Lanjutkan Playback';
      btn.style.background = 'linear-gradient(135deg, #0284C7, #0369A1)';
    }
    this.showToast("⏸ Pemutaran dijeda.", "info");
  }

  stopHistoryPlayback() {
    this.isHistoryPlaying = false;
    if (this.historyTimer) clearTimeout(this.historyTimer);
    this.historyPlayIdx = 0;

    const btn = document.getElementById('btn-history-play');
    if (btn) {
      btn.innerHTML = '▶ Putar Riwayat (Playback)';
      btn.style.background = 'linear-gradient(135deg, #0284C7, #0369A1)';
    }

    const slider = document.getElementById('hist-time-slider');
    if (slider) slider.value = 0;

    const waypoints = this.getDailyHistoryWaypoints();
    if (waypoints.length > 0) {
      this.scrubHistoryToStep(0, false);
    }
  }

  onHistorySliderChange(valPercent) {
    const waypoints = this.getDailyHistoryWaypoints();
    const idx = Math.min(waypoints.length - 1, Math.floor((valPercent / 100) * waypoints.length));
    this.historyPlayIdx = idx;
    this.scrubHistoryToStep(idx, false);
  }

  scrubHistoryToStep(idx, updateSlider = true) {
    const waypoints = this.getDailyHistoryWaypoints();
    if (!waypoints[idx]) return;

    const w = waypoints[idx];
    const map = this.leafMaps && this.leafMaps['kabagops-history-map'];

    // Move car marker
    if (this.historyCarMarker && map) {
      this.historyCarMarker.setLatLng([w.lat, w.lng]);
      map.panTo([w.lat, w.lng], { animate: true, duration: 0.3 });
    }

    // Update HUD
    const timeEl = document.getElementById('hist-hud-time');
    const spdEl = document.getElementById('hist-hud-speed');
    const locEl = document.getElementById('hist-hud-loc');

    if (timeEl) timeEl.innerText = w.time;
    if (spdEl) spdEl.innerText = `${w.speed} km/jam`;
    if (locEl) locEl.innerText = w.loc;

    // Update Slider
    if (updateSlider) {
      const slider = document.getElementById('hist-time-slider');
      if (slider) slider.value = Math.floor((idx / (waypoints.length - 1)) * 100);
    }

    // Highlight row in table
    document.querySelectorAll('#kabagops-history-log-tbody tr').forEach(r => r.style.background = '');
    const activeRow = document.getElementById(`hist-row-${idx}`);
    if (activeRow) {
      activeRow.style.background = 'rgba(6,182,212,0.18)';
      activeRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  setHistorySpeed(val) {
    this.historySpeedMultiplier = parseFloat(val) || 2;
    this.showToast(`Kecepatan pemutaran: ${this.historySpeedMultiplier}x`, 'info');
  }

  downloadHistoryReport() {
    const waypoints = this.getDailyHistoryWaypoints();
    let csv = "Jam,Lokasi,Kecepatan_KMH,Status,Aktivitas,Validasi_GPS\n";
    waypoints.forEach(w => {
      csv += `"${w.time}","${w.loc}","${w.speed}","${w.status}","${w.desc}","VALID_GPS"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SIMAPRES110_Log_Rute_Patroli_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 200);

    this.showToast("📥 Rekap laporan rute harian (CSV/Excel) berhasil diunduh.", "success");
  }

  switchKabagOpsTab(tabId) {
    this.activeKabagOpsTab = tabId;
    document.querySelectorAll('.kabagops-tab-btn').forEach(btn => {
      if (btn.getAttribute('data-tab') === tabId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    document.querySelectorAll('.kabagops-tab-content').forEach(content => {
      content.classList.remove('active');
    });

    const target = document.getElementById(tabId);
    if (target) target.classList.add('active');

    if (tabId === 'tab-kabagops-taktis') {
      this.renderKabagOpsNearestDispatch();
      setTimeout(() => this.initRealMap('kabagops-real-map'), 150);
    } else if (tabId === 'tab-kabagops-rute') {
      setTimeout(() => this.initRouteMap('kabagops-route-map'), 150);
    } else if (tabId === 'tab-kabagops-history') {
      setTimeout(() => {
        this.initHistoryMap('kabagops-history-map');
        this.renderHistoryTelemetryData();
      }, 150);
    }
  }


  // ============================================================================
  // SMART PROXIMITY & AUTOMATIC VEHICLE LOCATION (AVL) DISPATCH METHODS
  // ============================================================================

  // ============================================================================
  // REVERSE GEOCODING / HUMAN-READABLE ADDRESS HELPER
  // Mengonversi koordinat teknis menjadi nama jalan / patokan lokasi yang mudah dibaca
  // ============================================================================
  getAddressFromCoords(lat, lng, fallbackName = null) {
    if (fallbackName && !String(fallbackName).startsWith('-6.') && !String(fallbackName).startsWith('106.')) {
      return fallbackName;
    }
    const landmarks = [
      { lat: -6.2015, lng: 106.8195, name: "Mako Polres Metro, Jl. Jend. Sudirman No. 1" },
      { lat: -6.2080, lng: 106.8310, name: "Pos Polisi Lantas Simpang 5, Jl. Sudirman" },
      { lat: -6.2080, lng: 106.8390, name: "Pos Lantas Simpang Sudirman Timur" },
      { lat: -6.2100, lng: 106.8250, name: "Pangkalan Tim Perintis Presisi (Mako Barat)" },
      { lat: -6.2140, lng: 106.8450, name: "Kawasan Parkir Pasar Tradisional Jaya, Jl. Merdeka" },
      { lat: -6.2146, lng: 106.8451, name: "Area Parkir Grand Mall, Jl. Merdeka No. 12" },
      { lat: -6.2190, lng: 106.8410, name: "Depan Apotek Sehat, Jl. Veteran No. 89" },
      { lat: -6.2190, lng: 106.8480, name: "Kawasan Bundaran & Flyover Cempaka KM 4" },
      { lat: -6.2220, lng: 106.8520, name: "Pusat Niaga & Pertokoan Sentra Bisnis Cempaka" },
      { lat: -6.2250, lng: 106.8518, name: "Jl. Cempaka Raya No. 45" },
      { lat: -6.2255, lng: 106.8520, name: "Pertigaan Jl. Cempaka Raya - Jl. Veteran" },
      { lat: -6.2280, lng: 106.8410, name: "Balai Warga RT 04, Jl. Kenanga Kelurahan" },
      { lat: -6.2300, lng: 106.8550, name: "Perumahan Griya Indah Blok C3" },
      { lat: -6.2380, lng: 106.8390, name: "Bawah Jembatan Flyover Rel Kereta Api Cempaka" },
      { lat: -6.2450, lng: 106.8600, name: "Jl. Bypass Protokol KM 12 Timur" }
    ];

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return fallbackName || "Kawasan Wilayah Hukum Polres Metro";
    }

    let closest = null;
    let minDist = 999;
    for (const lm of landmarks) {
      const d = this.calculateDistanceKm(lat, lng, lm.lat, lm.lng);
      if (d < minDist) {
        minDist = d;
        closest = lm;
      }
    }
    if (closest && minDist <= 0.4) {
      return closest.name;
    }
    return closest ? `${closest.name} (Sektor Sekitar)` : (fallbackName || "Wilayah Sektor Cempaka");
  }

  calculateDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius bumi dalam KM
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(2));
  }

  getEtaMinutes(distanceKm, speedKmh = 30) {
    if (distanceKm <= 0) return 1;
    const minutes = Math.round((distanceKm / speedKmh) * 60) + 1; // 1 min buffer
    return Math.max(1, minutes);
  }

  getNearestOfficersForComplaint(complaint) {
    if (!complaint || typeof complaint.lat === 'undefined' || typeof complaint.lng === 'undefined') return [];
    const fleet = this.state.patrolFleet || INITIAL_DATA.patrolFleet;
    const officers = fleet.map(officer => {
      const dist = this.calculateDistanceKm(complaint.lat, complaint.lng, officer.lat, officer.lng);
      const eta = this.getEtaMinutes(dist, officer.speedKmh > 0 ? officer.speedKmh : 30);
      return {
        ...officer,
        distanceKm: dist,
        etaMinutes: eta
      };
    });
    officers.sort((a, b) => a.distanceKm - b.distanceKm);
    return officers;
  }

  dispatchNearestUnit(complaintId, officerNrp = null) {
    const c = this.state.complaints.find(item => item.id === complaintId);
    if (!c) return;

    const nearestOfficers = this.getNearestOfficersForComplaint(c);
    const targetOfficer = officerNrp 
      ? (this.state.patrolFleet.find(o => o.officerNrp === officerNrp) || nearestOfficers[0])
      : nearestOfficers[0];

    if (!targetOfficer) {
      this.showToast("Tidak ada armada siaga yang tersedia!", "warning");
      return;
    }

    const dist = this.calculateDistanceKm(c.lat, c.lng, targetOfficer.lat, targetOfficer.lng);
    const eta = this.getEtaMinutes(dist, targetOfficer.speedKmh > 0 ? targetOfficer.speedKmh : 30);

    c.status = 'DISPOSISI';
    c.assignedOfficer = {
      name: targetOfficer.officerName,
      nrp: targetOfficer.officerNrp,
      unit: targetOfficer.unit,
      phone: targetOfficer.phone || "0811-2233-4455"
    };
    c.officer = targetOfficer.officerName;
    c.officerName = targetOfficer.officerName;
    c.officerNrp = targetOfficer.officerNrp;
    c.assignedVehicle = targetOfficer.vehicle;

    targetOfficer.status = 'BERTUGAS';
    targetOfficer.currentTask = `Menuju TKP 110: ${c.title}`;

    const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + " WIB";
    c.timeline.push({
      stage: "DISPOSISI",
      time: timeStr,
      title: "2. Disposisi Penugasan Personel Terdekat (AVL Smart Dispatch)",
      desc: `Kabag Ops menugaskan ${targetOfficer.officerName} (${targetOfficer.callsign}) yang terdeteksi paling dekat dengan lokasi TKP (Jarak: ${dist} km, Est. Waktu Tiba: ${eta} menit). Lembar penugasan diteruskan seketika ke e-Logbook petugas.`,
      attachments: [
        { type: "DOC", title: `Sprint_Penugasan_Presisi_${c.id}.pdf`, meta: "Surat Perintah Disposisi Otomatis", icon: "📑", url: "#" }
      ]
    });

    this.saveState();
    this.showToast(`🚀 ${targetOfficer.officerName} (${dist} km) berhasil ditugaskan ke ${c.id}!`, 'success');

    // Refresh UI
    this.renderKabagOpsView();
    if (typeof this.renderPimpinanComplaintsTable === 'function') this.renderPimpinanComplaintsTable();
    if (typeof this.renderSpktView === 'function') this.renderSpktView();
    if (typeof this.renderPersonilView === 'function') this.renderPersonilView();
    if (typeof this.renderPublicTimeline === 'function') this.renderPublicTimeline();

    // Re-center map if active
    if (this.leafMaps && this.leafMaps['kabagops-real-map']) {
      this.refreshMapMarkers('kabagops-real-map');
    }
  }

  focusOfficerOnMap(nrp) {
    const fleet = this.state.patrolFleet || INITIAL_DATA.patrolFleet;
    const officer = fleet.find(o => o.officerNrp === nrp);
    if (!officer) return;

    if (this.currentView === 'kabagops') {
      this.switchKabagOpsTab('tab-kabagops-taktis');
    }

    const containerId = this.currentView === 'kabagops' ? 'kabagops-real-map' : 'pimpinan-real-map';
    const map = this.leafMaps ? this.leafMaps[containerId] : null;

    if (map) {
      map.flyTo([officer.lat, officer.lng], 15, { duration: 1 });
      if (this.fleetMarkers && this.fleetMarkers[officer.id]) {
        setTimeout(() => this.fleetMarkers[officer.id].openPopup(), 1100);
      }
    }
    this.showToast(`Memusatkan peta ke armada ${officer.callsign} (${officer.officerName})`, 'info');
  }

  renderKabagOpsNearestDispatch() {
    const container = document.getElementById('kabagops-nearest-dispatch-container');
    if (!container) return;

    const unassigned = this.state.complaints.filter(c => c.status === 'BELUM_DITANGANI');
    const inProgress = this.state.complaints.filter(c => c.status === 'DISPOSISI' || c.status === 'MENUJU_TKP');

    if (unassigned.length === 0) {
      container.innerHTML = `
        <div style="background:#0B1424; border:1px solid var(--card-border); border-radius:var(--radius-sm); padding:16px; text-align:center;">
          <div style="font-size:24px; margin-bottom:4px;">✅</div>
          <div style="font-size:13px; font-weight:700; color:#fff;">Seluruh Laporan 110 Telah Terdisposisi</div>
          <p style="font-size:11px; color:var(--text-secondary); margin-top:2px;">
            Tidak ada panggilan darurat warga yang menunggu penugasan saat ini. Seluruh armada terpantau siaga di pos masing-masing.
          </p>
          ${inProgress.length > 0 ? `
            <div style="margin-top:10px; font-size:11px; color:#38BDF8; background:rgba(56,189,248,0.1); padding:8px 10px; border-radius:4px; text-align:left; border-left:3px solid #38BDF8;">
              ℹ️ <strong>${inProgress.length} Kasus Sedang Ditangani:</strong> ${inProgress[0].id} ditugaskan ke ${inProgress[0].assignedOfficer ? (inProgress[0].assignedOfficer.name || inProgress[0].assignedOfficer) : 'Personel Lapangan'}.
            </div>
          ` : ''}
          <button type="button" class="btn-quick" style="margin-top:10px; font-size:11px; padding:6px 14px; background:rgba(239,68,68,0.2); border-color:var(--danger); color:#FCA5A5; font-weight:700;" onclick="app.simulateIncoming110Call()">
            ⚡ Simulasikan Panggilan 110 Masuk Baru
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = unassigned.map(c => {
      const nearestList = this.getNearestOfficersForComplaint(c);
      const nearest = nearestList[0] || (this.state.patrolFleet && this.state.patrolFleet[0]);

      return `
        <div style="background:linear-gradient(135deg, rgba(239,68,68,0.15), rgba(30,20,20,0.9)); border:1px solid #EF4444; border-radius:var(--radius-sm); padding:12px; margin-bottom:10px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span class="badge badge-danger">🚨 DARURAT 110 (MENUNGGU DISPOSISI)</span>
            <span class="table-code" style="color:#EF4444;">${c.id}</span>
          </div>
          <h4 style="font-size:13px; font-weight:800; color:#fff; margin-top:6px;">${c.title}</h4>
          <p style="font-size:11.5px; color:var(--text-secondary); margin-top:2px;">📍 ${c.locationName}</p>
          <p style="font-size:11px; color:var(--text-muted); margin-top:1px;">👤 Pelapor: ${c.reporter} (${c.phone}) &bull; Waktu: ${c.timestamp}</p>

          <!-- Proximity Box -->
          <div style="background:rgba(15,23,42,0.9); border:1px solid rgba(56,189,248,0.4); border-radius:6px; padding:8px 10px; margin-top:8px;">
            <div style="font-size:10.5px; color:#38BDF8; font-weight:800; display:flex; align-items:center; gap:6px;">
              <span>📍</span> REKOMENDASI UNIT TERDEKAT (AVL PROXIMITY):
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px;">
              <div>
                <div style="font-size:12.5px; font-weight:800; color:#fff;">${nearest.icon} ${nearest.officerName}</div>
                <div style="font-size:10.5px; color:var(--text-secondary);">${nearest.callsign} &bull; ${nearest.vehicle}</div>
              </div>
              <div style="text-align:right;">
                <div style="font-size:13px; font-weight:800; color:var(--accent-gold);">${nearest.distanceKm} km</div>
                <div style="font-size:10px; color:#10B981; font-weight:700;">Est. Tiba: ~${nearest.etaMinutes} Mnt</div>
              </div>
            </div>
          </div>

          <div style="display:flex; gap:6px; margin-top:10px;">
            <button type="button" class="btn-primary" style="flex:1; justify-content:center; background:linear-gradient(135deg, #10B981, #059669); font-weight:700; font-size:11.5px; padding:8px;" onclick="app.dispatchNearestUnit('${c.id}', '${nearest.officerNrp}')">
              🚀 Tugaskan Unit Terdekat Ini
            </button>
            <button type="button" class="btn-secondary" style="padding:8px 10px; font-size:11px;" onclick="app.openDispatchModal('${c.id}')">
              ⚙️ Pilih Lain
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  renderKabagOpsView() {
    this.renderPatrolUnitDropdown();
    this.renderKabagOpsKpis();
    this.renderKabagOpsNearestDispatch();
    this.renderKabagOpsFleetStatusList();
    this.renderKabagOpsHotspotsTable();
    this.renderKabagOpsCheckpointsList();
    this.renderKabagOpsFleetAssignmentsTable();
    this.renderKabagOpsSprintTable();
    this.renderHistoryLogsTable();

    // Initialize real map on Kabag Ops
    if (this.activeKabagOpsTab === 'tab-kabagops-taktis' || !this.activeKabagOpsTab) {
      setTimeout(() => {
        this.initRealMap('kabagops-real-map');
      }, 150);
    } else if (this.activeKabagOpsTab === 'tab-kabagops-history') {
      setTimeout(() => {
        this.initHistoryMap('kabagops-history-map');
      }, 150);
    }
  }

  renderKabagOpsKpis() {
    const hsEl = document.getElementById('kpi-kabagops-hotspots');
    const flEl = document.getElementById('kpi-kabagops-fleet');
    const spEl = document.getElementById('kpi-kabagops-sprint');

    const totalHs = this.state.hotspots ? this.state.hotspots.length : 5;
    const totalSp = this.state.kabagopsSprintRecords ? this.state.kabagopsSprintRecords.length : 4;

    if (hsEl) hsEl.textContent = `${totalHs} Titik`;
    if (flEl) flEl.textContent = `12 Unit Siaga`;
    if (spEl) spEl.textContent = `${totalSp} Renops`;
  }

  renderKabagOpsFleetStatusList() {
    const listEl = document.getElementById('kabagops-fleet-status-list');
    if (!listEl) return;

    const fleet = this.state.patrolFleet || INITIAL_DATA.patrolFleet;

    listEl.innerHTML = fleet.map(f => {
      const isAvailable = f.status === 'SIAGA';
      const statusBadge = isAvailable
        ? `<span class="badge badge-success" style="font-size:10px;">🟢 SIAGA PATROLI</span>`
        : `<span class="badge badge-warning" style="font-size:10px; background:#F59E0B; color:#000; font-weight:800;">🚔 BERTUGAS</span>`;

      const locAddress = f.locationName || this.getAddressFromCoords(f.lat, f.lng);

      return `
        <div style="background:#0B1424; border:1px solid var(--card-border); border-radius:var(--radius-sm); padding:10px 12px; margin-bottom:8px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div style="font-weight:700; color:#fff; font-size:13px; display:flex; align-items:center; gap:6px;">
              <span>${f.icon || '🚔'}</span> ${f.callsign}
            </div>
            ${statusBadge}
          </div>
          <div style="font-size:11.5px; color:#cbd5e1; margin-top:3px;">
            <strong>${f.officerName}</strong> (NRP ${f.officerNrp}) &bull; ${f.unit}
          </div>
          <div style="background:rgba(15,23,42,0.8); border:1px solid rgba(255,255,255,0.06); padding:6px 10px; border-radius:4px; margin-top:6px; display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="font-size:11px; color:var(--accent-gold); font-weight:700;">
                📍 Posisi: <span style="color:#fff;">${locAddress}</span>
              </div>
              <div style="font-size:10.5px; color:var(--text-muted); margin-top:1px;">
                Kendaraan: ${f.vehicle} &bull; Kecepatan: ${f.speedKmh} km/h
              </div>
            </div>
            <button type="button" class="btn-quick" style="padding:4px 8px; font-size:10.5px;" onclick="app.focusOfficerOnMap('${f.officerNrp}')">
              🎯 Pusatkan
            </button>
          </div>
          <div style="font-size:11px; color:#94A3B8; margin-top:4px;">
            📌 Giat: <span style="color:#cbd5e1;">${f.currentTask}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  renderKabagOpsHotspotsTable() {
    const tbody = document.getElementById('kabagops-hotspots-tbody');
    if (!tbody) return;

    tbody.innerHTML = this.state.hotspots.map(h => {
      const riskLevel = h.level || h.risk || 'TINGGI';
      const isCritical = riskLevel === 'TINGGI' || riskLevel === 'KRITIS' || riskLevel === 'SANGAT_RAWAN';
      const badgeClass = isCritical ? 'badge-danger' : 'badge-warning';
      const latStr = typeof h.lat === 'number' ? h.lat.toFixed(4) : h.lat;
      const lngStr = typeof h.lng === 'number' ? h.lng.toFixed(4) : h.lng;

      return `
        <tr>
          <td>
            <strong>${h.name}</strong><br>
            <small style="color:var(--text-muted);">${h.category || 'Rawan Kamtibmas'} &bull; Radius ${h.radius || 250}m</small>
          </td>
          <td>
            <div style="font-size:12px; font-weight:700; color:#fff;">📍 ${h.address || this.getAddressFromCoords(h.lat, h.lng, h.name)}</div>
            <small style="color:var(--text-muted); font-size:10.5px;">Zona Radius Pantau: ${h.radius || 250} Meter</small>
          </td>
          <td>
            <span class="badge ${badgeClass}" style="font-weight:700;">${riskLevel}</span>
          </td>
          <td>
            <button class="btn-quick btn-danger-outline" style="padding:2px 8px; font-size:11px;" onclick="app.deleteHotspot('${h.id}')">Hapus</button>
          </td>
        </tr>
      `;
    }).join('');
  }

  setPatrolConfigMode(mode) {
    this.patrolConfigMode = mode;
    const btnBeat = document.getElementById('btn-mode-beat');
    const btnGabungan = document.getElementById('btn-mode-gabungan');
    const beatContainer = document.getElementById('kabagops-beat-selector-container');
    const gabunganNotice = document.getElementById('kabagops-gabungan-notice');
    const syncRouteBtn = document.getElementById('kabagops-sync-route-btn');
    const syncGabunganBtn = document.getElementById('kabagops-sync-gabungan-btn');
    const badgeEl = document.getElementById('kabagops-mode-badge');

    if (mode === 'BEAT') {
      if (btnBeat) btnBeat.classList.add('active');
      if (btnGabungan) btnGabungan.classList.remove('active');
      if (beatContainer) beatContainer.style.display = 'block';
      if (gabunganNotice) gabunganNotice.style.display = 'none';
      if (syncRouteBtn) syncRouteBtn.style.display = 'flex';
      if (syncGabunganBtn) syncGabunganBtn.style.display = 'none';
      if (badgeEl) {
        badgeEl.textContent = 'Mode Beat Sektor';
        badgeEl.className = 'badge badge-gold';
      }
      this.showToast("Mode Patroli Sektor (Per-Regu / Beat) aktif.", "info");
    } else {
      if (btnBeat) btnBeat.classList.remove('active');
      if (btnGabungan) btnGabungan.classList.add('active');
      if (beatContainer) beatContainer.style.display = 'none';
      if (gabunganNotice) gabunganNotice.style.display = 'block';
      if (syncRouteBtn) syncRouteBtn.style.display = 'none';
      if (syncGabunganBtn) syncGabunganBtn.style.display = 'flex';
      if (badgeEl) {
        badgeEl.textContent = 'Mode Operasi Gabungan (All Units)';
        badgeEl.className = 'badge badge-danger';
      }
      this.showToast("Mode Operasi Gabungan (Koridor Induk Seluruh Armada) aktif.", "warning");
    }

    this.renderKabagOpsCheckpointsList();
  }

  onPatrolUnitChange(unitKey) {
    this.selectedPatrolUnit = unitKey;
    if (this.leafMaps && this.leafMaps['kabagops-route-map']) {
      this.renderRouteMapData('kabagops-route-map');
    }
    const syncBtn = document.getElementById('kabagops-sync-route-btn');
    const fa = this.state.fleetAssignments && this.state.fleetAssignments.find(f => f.unitKey === unitKey);
    if (syncBtn) {
      if (fa) {
        syncBtn.innerHTML = `💾 Terapkan Rute ke Layar ${fa.officerName} (${fa.vehicleName})`;
      } else if (unitKey === 'SAMAPTA_AHMAD') {
        syncBtn.innerHTML = '💾 Terapkan Rute ke Layar Bripka Ahmad (Unit Samapta 110-A)';
      } else if (unitKey === 'PERINTIS_JOKO') {
        syncBtn.innerHTML = '💾 Terapkan Rute ke Layar Aipda Joko (Perintis Presisi Trail 02)';
      } else if (unitKey === 'PATWAL_DANI') {
        syncBtn.innerHTML = '💾 Terapkan Rute ke Layar Bripka Dani (Patwal Sat Lantas R4-01)';
      } else {
        syncBtn.innerHTML = '💾 Terapkan Rute ke Layar Petugas Terpilih';
      }
    }
    this.renderKabagOpsCheckpointsList();
    const label = fa ? `${fa.vehicleName} (${fa.officerName})` : unitKey.replace('_', ' ');
    this.showToast(`Memuat rute pos pantau khusus ${label}`, 'info');
  }

  renderKabagOpsCheckpointsList() {
    const listEl = document.getElementById('kabagops-checkpoints-list');
    if (!listEl) return;

    let targetList = [];
    if (this.patrolConfigMode === 'GABUNGAN') {
      targetList = (this.state.unitCheckpoints && this.state.unitCheckpoints.GABUNGAN_POLRES) || this.state.checkpoints;
    } else {
      const unitKey = this.selectedPatrolUnit || 'SAMAPTA_AHMAD';
      targetList = (this.state.unitCheckpoints && this.state.unitCheckpoints[unitKey]) || this.state.checkpoints;
    }

    if (!targetList || targetList.length === 0) {
      listEl.innerHTML = `
        <div style="background:#0B1424; border:1px solid var(--card-border); border-radius:var(--radius-sm); padding:16px; text-align:center;">
          <div style="font-size:24px; margin-bottom:4px;">📍</div>
          <div style="font-size:13px; font-weight:700; color:#fff;">Belum Ada Pos Pantau Terdaftar</div>
          <p style="font-size:11px; color:var(--text-secondary); margin-top:2px;">
            Klik tombol <strong>+ Tambah Pos Pantau</strong> di atas untuk mendaftarkan titik singgah patroli.
          </p>
        </div>
      `;
      return;
    }

    listEl.innerHTML = targetList.map((cp, idx) => {
      const qr = cp.qrCode || `QR-POS-0${idx + 1}`;
      const status = cp.status || (idx < 2 ? 'TERKUNJUNGI' : 'SIAGA PATROLI');
      const isVisited = status === 'TERKUNJUNGI';
      const badgeClass = isVisited ? 'badge-success' : 'badge-gold';
      const visitTime = cp.lastVisited || cp.timeTarget || 'Target Rute';

      return `
        <div style="background:#0B1424; border:1px solid var(--card-border); border-radius:var(--radius-sm); padding:10px 12px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center; gap:10px;">
          <div style="flex:1;">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="display:inline-flex; align-items:center; justify-content:center; width:22px; height:22px; border-radius:50%; background:#78350F; color:#F59E0B; font-weight:800; font-size:11px;">${idx + 1}</span>
              <strong style="color:#fff; font-size:13px;">${cp.name}</strong>
              <span class="badge ${badgeClass}" style="font-size:9.5px; font-weight:700;">${status}</span>
            </div>
            <div style="font-size:11.5px; color:#cbd5e1; margin-top:3px;">
              📍 <span style="color:#fff;">${cp.address || this.getAddressFromCoords(cp.lat, cp.lng, cp.name)}</span>
            </div>
            <div style="font-size:10px; color:var(--text-muted); margin-top:3px; display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
              <span>🛰️ Validasi: <strong style="color:#38BDF8;">Virtual Geofence (Radius ${cp.radius || 50}m)</strong></span>
              <span>&bull;</span>
              <span>⏱️ Dwell Time: <strong style="color:#FCD34D;">${cp.dwellTime || '15 Mnt'}</strong></span>
              <span>&bull;</span>
              <span>🕒 Jadwal: <strong style="color:#94A3B8;">${visitTime}</strong></span>
              <span class="badge" style="background:rgba(16,185,129,0.15); border:1px solid #10B981; color:#6EE7B7; font-size:9.5px; padding:1px 6px;">Auto Check-in GPS</span>
            </div>
          </div>

          <!-- Action Buttons for Management: Reorder, Edit, Delete -->
          <div style="display:flex; align-items:center; gap:4px;">
            <button type="button" class="btn-quick" style="padding:4px 7px; font-size:11px;" onclick="app.moveCheckpoint(${idx}, -1)" title="Geser Urutan Naik" ${idx === 0 ? 'disabled style="opacity:0.3;"' : ''}>▲</button>
            <button type="button" class="btn-quick" style="padding:4px 7px; font-size:11px;" onclick="app.moveCheckpoint(${idx}, 1)" title="Geser Urutan Turun" ${idx === targetList.length - 1 ? 'disabled style="opacity:0.3;"' : ''}>▼</button>
            <button type="button" class="btn-quick" style="padding:4px 8px; font-size:11px;" onclick="app.editKabagOpsCheckpoint(${idx})" title="Edit Pos Pantau">✏️</button>
            <button type="button" class="btn-quick btn-danger-outline" style="padding:4px 8px; font-size:11px;" onclick="app.removeKabagOpsCheckpoint(${idx})" title="Hapus Pos Pantau">🗑️</button>
          </div>
        </div>
      `;
    }).join('');
  }


  // ============================================================================
  // CHECKPOINT / POS PANTAU PATROL ROUTE MANAGEMENT (CRUD & REORDERING)
  // Memungkinkan Kabag Ops menambah, mengedit, menghapus, & mengatur urutan pos
  // ============================================================================
  openAddCheckpointModal() {
    document.getElementById('modal-checkpoint-title').textContent = "Pendaftaran Pos Pantau / Checkpoint Baru";
    document.getElementById('checkpoint-edit-index').value = "-1";
    document.getElementById('cp-input-name').value = "";
    document.getElementById('cp-input-address').value = "";
    document.getElementById('cp-input-time').value = "11:30 WIB";

    const radEl = document.getElementById('cp-input-radius');
    if (radEl) radEl.value = '50';
    const dwellEl = document.getElementById('cp-input-dwell');
    if (dwellEl) dwellEl.value = '15 Mnt';

    const latEl = document.getElementById('cp-input-lat');
    if (latEl) latEl.value = '-6.214000';
    const lngEl = document.getElementById('cp-input-lng');
    if (lngEl) lngEl.value = '106.845000';

    const unitSelect = document.getElementById('cp-input-unit');
    if (unitSelect) {
      unitSelect.value = this.patrolConfigMode === 'GABUNGAN' ? 'GABUNGAN_POLRES' : (this.selectedPatrolUnit || 'SAMAPTA_AHMAD');
    }

    this.openModal('modal-kabagops-add-checkpoint');
    setTimeout(() => {
      this.initCheckpointPickerMap(-6.2140, 106.8450, 50);
    }, 180);
  }

  editKabagOpsCheckpoint(index) {
    let targetList = [];
    const isGabungan = this.patrolConfigMode === 'GABUNGAN';
    const unitKey = isGabungan ? 'GABUNGAN_POLRES' : (this.selectedPatrolUnit || 'SAMAPTA_AHMAD');
    
    if (isGabungan) {
      targetList = (this.state.unitCheckpoints && this.state.unitCheckpoints.GABUNGAN_POLRES) || this.state.checkpoints;
    } else {
      targetList = (this.state.unitCheckpoints && this.state.unitCheckpoints[unitKey]) || this.state.checkpoints;
    }

    const cp = targetList[index];
    if (!cp) return;

    document.getElementById('modal-checkpoint-title').textContent = `Edit Pos Pantau: ${cp.name}`;
    document.getElementById('checkpoint-edit-index').value = String(index);
    document.getElementById('cp-input-name').value = cp.name || '';
    document.getElementById('cp-input-address').value = cp.address || '';
    document.getElementById('cp-input-time').value = cp.timeTarget || '11:30 WIB';
    const radEl = document.getElementById('cp-input-radius');
    if (radEl) radEl.value = String(cp.radius || 50);
    const dwellEl = document.getElementById('cp-input-dwell');
    if (dwellEl) dwellEl.value = cp.dwellTime || '15 Mnt';

    const lat = cp.lat || -6.2140;
    const lng = cp.lng || 106.8450;
    const latEl = document.getElementById('cp-input-lat');
    if (latEl) latEl.value = lat.toFixed(6);
    const lngEl = document.getElementById('cp-input-lng');
    if (lngEl) lngEl.value = lng.toFixed(6);
    
    const unitSelect = document.getElementById('cp-input-unit');
    if (unitSelect) unitSelect.value = unitKey;

    this.openModal('modal-kabagops-add-checkpoint');
    setTimeout(() => {
      this.initCheckpointPickerMap(lat, lng, cp.radius || 50);
    }, 180);
  }

  submitKabagOpsCheckpoint() {
    const editIndex = parseInt(document.getElementById('checkpoint-edit-index').value);
    const name = document.getElementById('cp-input-name').value.trim();
    const address = document.getElementById('cp-input-address').value.trim();
    const timeTarget = document.getElementById('cp-input-time').value.trim();
    const radius = parseInt(document.getElementById('cp-input-radius')?.value || '50');
    const dwellTime = document.getElementById('cp-input-dwell')?.value || '15 Mnt';
    const targetUnit = document.getElementById('cp-input-unit').value;

    const lat = parseFloat(document.getElementById('cp-input-lat')?.value || '-6.2140');
    const lng = parseFloat(document.getElementById('cp-input-lng')?.value || '106.8450');

    if (!name || !address) {
      alert("Mohon lengkapi Nama Pos dan Alamat Lokasi.");
      return;
    }

    if (isNaN(lat) || isNaN(lng)) {
      alert("Wajib menentukan titik koordinat pada peta satelit terlebih dahulu.");
      return;
    }

    if (!this.state.unitCheckpoints) {
      this.state.unitCheckpoints = JSON.parse(JSON.stringify(INITIAL_DATA.unitCheckpoints));
    }
    if (!this.state.unitCheckpoints[targetUnit]) {
      this.state.unitCheckpoints[targetUnit] = [];
    }
    const targetList = this.state.unitCheckpoints[targetUnit];

    if (editIndex >= 0 && editIndex < targetList.length) {
      targetList[editIndex].name = name;
      targetList[editIndex].address = address;
      targetList[editIndex].timeTarget = timeTarget;
      targetList[editIndex].radius = radius;
      targetList[editIndex].dwellTime = dwellTime;
      targetList[editIndex].lat = lat;
      targetList[editIndex].lng = lng;
      targetList[editIndex].validation = 'AUTO_GEOFENCE';
      this.showToast(`Pos Pantau "${name}" berhasil diperbarui dengan koordinat satelit!`, 'success');
    } else {
      const newCp = {
        id: targetList.length + 1,
        name: name,
        address: address,
        lat: lat,
        lng: lng,
        timeTarget: timeTarget,
        radius: radius,
        dwellTime: dwellTime,
        validation: 'AUTO_GEOFENCE',
        status: "SIAGA PATROLI",
        lastVisited: `Target ${timeTarget}`
      };
      targetList.push(newCp);
      this.showToast(`➕ Pos Pantau baru "${name}" berhasil didaftarkan ke rute!`, 'success');
    }

    if (targetUnit === 'SAMAPTA_AHMAD' || targetUnit === 'GABUNGAN_POLRES') {
      this.state.checkpoints = JSON.parse(JSON.stringify(targetList));
    }

    this.saveState();
    this.closeAllModals();
    this.renderKabagOpsCheckpointsList();

    if (this.leafMaps && this.leafMaps['kabagops-real-map']) {
      this.leafMaps['kabagops-real-map'].invalidateSize();
    }
    this.drawTacticalCanvas('kabagops-tactical-canvas');
  }

  removeKabagOpsCheckpoint(index) {
    let targetList = [];
    const isGabungan = this.patrolConfigMode === 'GABUNGAN';
    const unitKey = isGabungan ? 'GABUNGAN_POLRES' : (this.selectedPatrolUnit || 'SAMAPTA_AHMAD');
    
    if (isGabungan) {
      targetList = (this.state.unitCheckpoints && this.state.unitCheckpoints.GABUNGAN_POLRES) || this.state.checkpoints;
    } else {
      targetList = (this.state.unitCheckpoints && this.state.unitCheckpoints[unitKey]) || this.state.checkpoints;
    }

    if (!targetList || !targetList[index]) return;

    if (confirm(`Hapus pos pantau "${targetList[index].name}" dari rute patroli?`)) {
      const removed = targetList.splice(index, 1);
      if (unitKey === 'SAMAPTA_AHMAD' || isGabungan) {
        this.state.checkpoints = JSON.parse(JSON.stringify(targetList));
      }
      this.saveState();
      this.renderKabagOpsCheckpointsList();
      this.showToast(`Pos pantau "${removed[0].name}" berhasil dihapus.`, 'info');
    }
  }

  moveCheckpoint(index, direction) {
    let targetList = [];
    const isGabungan = this.patrolConfigMode === 'GABUNGAN';
    const unitKey = isGabungan ? 'GABUNGAN_POLRES' : (this.selectedPatrolUnit || 'SAMAPTA_AHMAD');
    
    if (isGabungan) {
      targetList = (this.state.unitCheckpoints && this.state.unitCheckpoints.GABUNGAN_POLRES) || this.state.checkpoints;
    } else {
      targetList = (this.state.unitCheckpoints && this.state.unitCheckpoints[unitKey]) || this.state.checkpoints;
    }

    if (!targetList) return;
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= targetList.length) return;

    const temp = targetList[index];
    targetList[index] = targetList[newIndex];
    targetList[newIndex] = temp;

    if (unitKey === 'SAMAPTA_AHMAD' || isGabungan) {
      this.state.checkpoints = JSON.parse(JSON.stringify(targetList));
    }

    this.saveState();
    this.renderKabagOpsCheckpointsList();
    this.showToast(`Urutan pos pantau diperbarui: ${temp.name} menjadi urutan ${newIndex + 1}.`, 'info');
  }

  applyPatrolRouteToAllOfficers() {
    if (this.state.unitCheckpoints && this.state.unitCheckpoints.GABUNGAN_POLRES) {
      this.state.checkpoints = JSON.parse(JSON.stringify(this.state.unitCheckpoints.GABUNGAN_POLRES));
    }
    this.saveState();
    if (this.leafMaps && this.leafMaps['kabagops-real-map']) {
      this.leafMaps['kabagops-real-map'].invalidateSize();
    }
    this.drawTacticalCanvas('kabagops-tactical-canvas');
    this.drawTacticalCanvas('tactical-canvas');
    this.drawTacticalCanvas('personil-canvas');
    this.showToast("🚨 Rute Operasi Gabungan berhasil dibroadcast serentak ke seluruh 12 armada dinas!", "warning");
  }

  renderKabagOpsSprintTable() {
    const tbody = document.getElementById('kabagops-sprint-tbody');
    if (!tbody) return;

    if (!this.state.kabagopsSprintRecords) {
      this.state.kabagopsSprintRecords = [
        {
          id: "SPRINT/402/X/OPS.1.1/2026",
          name: "Operasi Cipta Kondisi Malam Antisipasi Tawuran & 3C",
          units: "Sat Samapta, Sat Lantas, Tim Perintis Presisi",
          strength: "45 Personel (6 Unit Roda 4, 12 Unit Roda 2)",
          period: "01 Okt - 31 Okt 2026 (22:00 - 05:00 WIB)",
          status: "SEDANG_BERJALAN",
          statusBadge: "badge-success"
        },
        {
          id: "SPRINT/403/X/OPS.1.3/2026",
          name: "Pengamanan Khusus Sentra Ekonomi & Perbankan Awal Bulan",
          units: "Sat Samapta (Turjawali) & Pam Obvit",
          strength: "20 Personel (Patroli Dialogis)",
          period: "01 Okt - 10 Okt 2026",
          status: "SEDANG_BERJALAN",
          statusBadge: "badge-success"
        },
        {
          id: "SPRINT/404/X/OPS.2.1/2026",
          name: "Operasi Zebra Candi Penertiban Kamseltibcarlantas",
          units: "Sat Lantas Polres & Dishub",
          strength: "30 Personel",
          period: "14 Okt - 27 Okt 2026",
          status: "TAHAP_PERSIAPAN",
          statusBadge: "badge-gold"
        },
        {
          id: "SPRINT/405/X/PAM.GIAT/2026",
          name: "Pengamanan Festival Kuliner Nusantara & Keramaian Warga",
          units: "Polsek Cempaka & Samapta",
          strength: "25 Personel",
          period: "10 Okt - 12 Okt 2026",
          status: "TAHAP_PERSIAPAN",
          statusBadge: "badge-info"
        }
      ];
    }

    tbody.innerHTML = this.state.kabagopsSprintRecords.map(s => `
      <tr>
        <td><strong style="color:var(--accent-gold); font-family:'JetBrains Mono';">${s.id}</strong></td>
        <td>
          <strong style="color:#fff;">${s.name}</strong>
        </td>
        <td style="font-size:12px; color:var(--text-secondary);">${s.units}</td>
        <td style="font-size:12px; font-weight:700; color:#38BDF8;">${s.strength}</td>
        <td style="font-size:11px; color:var(--text-muted);">${s.period}</td>
        <td><span class="badge ${s.statusBadge}">${s.status}</span></td>
        <td>
          <button class="btn-quick" onclick="alert('Membuka Dokumen Surat Perintah ' + '${s.id}' + '\n\nNama Giat: ${s.name}\nKekuatan: ${s.strength}')">
            📄 Unduh Sprint
          </button>
        </td>
      </tr>
    `).join('');
  }

  submitKabagOpsHotspot() {
    const name = document.getElementById('kabagops-hotspot-name').value.trim();
    const lat = parseFloat(document.getElementById('kabagops-hotspot-lat').value);
    const lng = parseFloat(document.getElementById('kabagops-hotspot-lng').value);
    const level = document.getElementById('kabagops-hotspot-level').value;
    const category = document.getElementById('kabagops-hotspot-category').value;

    const newId = `HS-${String(this.state.hotspots.length + 1).padStart(2, '0')}`;
    this.state.hotspots.push({ id: newId, name, lat, lng, level, category });
    this.saveState();

    document.getElementById('kabagops-hotspot-name').value = '';
    this.renderKabagOpsHotspotsTable();
    this.renderConfigHotspotsTable();
    this.renderKabagOpsKpis();
    this.showToast(`Titik Rawan ${name} berhasil ditambahkan oleh Kabag Ops!`, 'success');
  }

  openCreateSprintModal() {
    this.openModal('modal-kabagops-create-sprint');
  }

  submitNewSprint() {
    const name = document.getElementById('sprint-input-name').value.trim();
    const units = document.getElementById('sprint-input-units').value.trim();
    const strength = document.getElementById('sprint-input-strength').value.trim();
    const period = document.getElementById('sprint-input-period').value.trim();

    const newId = `SPRINT/${400 + (this.state.kabagopsSprintRecords ? this.state.kabagopsSprintRecords.length : 4) + 1}/X/OPS/2026`;
    const newSprint = {
      id: newId,
      name: name,
      units: units,
      strength: strength,
      period: period,
      status: "TAHAP_PERSIAPAN",
      statusBadge: "badge-info"
    };

    if (!this.state.kabagopsSprintRecords) this.state.kabagopsSprintRecords = [];
    this.state.kabagopsSprintRecords.unshift(newSprint);
    this.saveState();
    this.closeAllModals();
    this.renderKabagOpsSprintTable();
    this.renderKabagOpsKpis();
    this.showToast(`Surat Perintah Operasi ${newId} berhasil disahkan Kabag Ops!`, 'success');
  }


  // ==========================================================================
  // ROLE: KAPOLSEK (KOMANDO WILAYAH POLSEK JAJARAN)
  // ==========================================================================
  switchKapolsekTab(tabId) {
    this.activeKapolsekTab = tabId;
    document.querySelectorAll('.kapolsek-tab-btn').forEach(btn => {
      if (btn.getAttribute('data-tab') === tabId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    document.querySelectorAll('.kapolsek-tab-content').forEach(content => {
      content.classList.remove('active');
    });

    const target = document.getElementById(tabId);
    if (target) target.classList.add('active');
  }

  renderKapolsekView() {
    this.renderKapolsekKpis();
    this.renderKapolsekKasusTable();
    this.renderKapolsekSambangList();
    this.renderKapolsekMediasiTable();
  }

  renderKapolsekKpis() {
    const repEl = document.getElementById('kpi-kapolsek-reports');
    if (repEl) repEl.textContent = '2 Kasus Aktif';
  }

  renderKapolsekKasusTable() {
    const tbody = document.getElementById('kapolsek-kasus-tbody');
    if (!tbody) return;

    // Filter complaints in Polsek Cempaka Raya
    const cempakaComplaints = this.state.complaints.filter(c => c.locationName.includes('Cempaka') || c.locationName.includes('Grand Mall') || c.category === 'Curanmor');

    tbody.innerHTML = cempakaComplaints.map(c => `
      <tr>
        <td><strong style="color:var(--accent-gold); font-family:'JetBrains Mono';">${c.id}</strong></td>
        <td>${c.timestamp}</td>
        <td>
          <strong>${c.reporter}</strong><br>
          <small style="color:var(--text-muted);">${c.phone}</small>
        </td>
        <td>
          <div style="font-weight:700; color:#fff;">${c.title}</div>
          <small style="color:var(--text-secondary);">📍 ${c.locationName}</small>
        </td>
        <td>
          <span class="badge ${c.status === 'SELESAI' ? 'badge-success' : 'badge-gold'}">${c.status}</span>
        </td>
        <td>
          <button class="btn-quick" onclick="app.viewComplaintDetail('${c.id}')">🔍 Rincian Penanganan</button>
        </td>
      </tr>
    `).join('');
  }

  renderKapolsekSambangList() {
    const listEl = document.getElementById('kapolsek-sambang-list');
    if (!listEl) return;

    const sambang = [
      { officer: "Aiptu Mulyadi (Bhabinkamtibmas Kel. Cempaka Baru)", location: "Pos Satkamling RW 04", notes: "Sambang ronda malam dan sosialisasi call center 110 bebas pulsa.", time: "10:15 WIB" },
      { officer: "Aipda Suhendar (Bhabinkamtibmas Kel. Mekarsari)", location: "Balai Warga RW 07", notes: "Mediasi silang sengketa batas pekarangan warga berakhir damai.", time: "13:20 WIB" }
    ];

    listEl.innerHTML = sambang.map(s => `
      <div style="background:#0B1424; border:1px solid var(--card-border); border-radius:var(--radius-sm); padding:12px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <strong style="color:#fff;">${s.officer}</strong><br>
          <small style="color:#10B981; font-weight:700;">📍 ${s.location}</small>
          <p style="font-size:12px; color:var(--text-secondary); margin-top:4px;">${s.notes}</p>
        </div>
        <div style="text-align:right;">
          <span class="badge badge-success">${s.time}</span>
        </div>
      </div>
    `).join('');
  }

  renderKapolsekMediasiTable() {
    const tbody = document.getElementById('kapolsek-mediasi-tbody');
    if (!tbody) return;

    const mediasi = this.state.mediasiRecords || INITIAL_DATA.mediasiRecords;

    tbody.innerHTML = mediasi.map(m => `
      <tr>
        <td><strong style="color:var(--accent-gold); font-family:'JetBrains Mono'; font-size:11px;">${m.id}</strong></td>
        <td>${m.date}</td>
        <td>
          <strong style="color:#fff;">${m.parties}</strong>
          <div style="font-size:10px; color:#94a3b8;">${m.caseCategory || 'Problem Solving'}</div>
        </td>
        <td>${m.caseDesc}</td>
        <td style="color:#34D399; font-weight:700;">${m.officer}</td>
        <td><span class="badge ${m.statusBadge || 'badge-success'}">${m.result}</span></td>
        <td>
          <button class="btn-quick" style="padding:4px 9px; font-size:11px; border-color:#059669; color:#34D399;" onclick="app.viewMediasiDocument('${m.id}')">
            📄 Lihat Surat RJ
          </button>
        </td>
      </tr>
    `).join('');
  }

  openCreateMediasiModal() {
    const records = this.state.mediasiRecords || (INITIAL_DATA.mediasiRecords || []);
    const nextNum = records.length + 1;
    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

    document.getElementById('form-mediasi-id').value = 'RJ-0' + nextNum + '/X/2026/POLSEK';
    document.getElementById('form-mediasi-date').value = dateStr;
    document.getElementById('form-mediasi-party1').value = '';
    document.getElementById('form-mediasi-party2').value = '';
    document.getElementById('form-mediasi-desc').value = '';
    document.getElementById('form-mediasi-points').value = '1. Kedua belah pihak sepakat menyelesaikan perselisihan secara kekeluargaan dan saling memaafkan.\n2. Pihak-pihak berjanji menjaga silaturahmi serta ketertiban lingkungan dan tidak mengulangi perselisihan serupa.\n3. Apabila terjadi pelanggaran di kemudian hari, sepakat untuk diproses sesuai hukum yang berlaku.';

    this.openModal('modal-kapolsek-create-mediasi');
  }

  submitNewMediasi() {
    const id = document.getElementById('form-mediasi-id').value.trim() || ('RJ-0' + Date.now().toString().slice(-2) + '/X/2026/POLSEK');
    const date = document.getElementById('form-mediasi-date').value.trim() || '07 Okt 2026';
    const party1 = document.getElementById('form-mediasi-party1').value.trim();
    const party2 = document.getElementById('form-mediasi-party2').value.trim();
    const category = document.getElementById('form-mediasi-category').value;
    const desc = document.getElementById('form-mediasi-desc').value.trim();
    const officer = document.getElementById('form-mediasi-officer').value;
    const result = document.getElementById('form-mediasi-result').value;
    const points = document.getElementById('form-mediasi-points').value.trim();

    if (!party1 || !party2 || !desc) {
      alert('Mohon lengkapi data Pihak 1, Pihak 2, dan Uraian Perkara.');
      return;
    }

    const newRecord = {
      id: id,
      date: date,
      parties: party1 + ' vs ' + party2,
      caseCategory: category,
      caseDesc: desc,
      officer: officer,
      result: result,
      points: points,
      statusBadge: 'badge-success',
      docUrl: '#'
    };

    if (!this.state.mediasiRecords) {
      this.state.mediasiRecords = JSON.parse(JSON.stringify(INITIAL_DATA.mediasiRecords));
    }
    this.state.mediasiRecords.unshift(newRecord);

    if (this.state.systemAuditLogs) {
      this.state.systemAuditLogs.unshift({
        id: 'AUD-' + Date.now(),
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB',
        user: 'AKP Danang Kusuma, S.H. (Kapolsek Cempaka Raya)',
        action: 'REGISTER_RESTORATIVE_JUSTICE',
        module: 'POLSEK_PROBLEM_SOLVING',
        details: 'Penerbitan Berita Acara Mediasi Restorative Justice ' + id + ': Kasus "' + desc + '" antara ' + party1 + ' dan ' + party2 + ' selesai damai melalui mediasi ' + officer + '.',
        status: 'SUCCESS'
      });
    }

    this.saveState();
    this.renderKapolsekMediasiTable();
    this.closeAllModals();
    this.showToast('✅ Berkas Mediasi Restorative Justice ' + id + ' berhasil diterbitkan dan diarsipkan!', 'success');
  }

  viewMediasiDocument(id) {
    const records = this.state.mediasiRecords || (INITIAL_DATA.mediasiRecords || []);
    const m = records.find(item => item.id === id);
    if (!m) return;

    document.getElementById('doc-mediasi-id-txt').textContent = m.id;
    document.getElementById('doc-mediasi-date-txt').textContent = m.date;
    document.getElementById('doc-mediasi-parties-txt').textContent = m.parties;
    document.getElementById('doc-mediasi-category-txt').textContent = m.caseCategory || 'Problem Solving';
    document.getElementById('doc-mediasi-desc-txt').textContent = m.caseDesc;
    document.getElementById('doc-mediasi-officer-txt').textContent = m.officer;
    document.getElementById('doc-mediasi-result-txt').textContent = m.result;
    document.getElementById('doc-mediasi-points-txt').textContent = m.points || '1. Sepakat menyelesaikan perselisihan secara kekeluargaan.\n2. Saling memaafkan dan menjaga kondusivitas kamtibmas.';

    this.openModal('modal-view-mediasi-doc');
  }

  printMediasiDocument() {
    this.showToast('🖨️ Mengunduh salinan resmi Berkas Kesepakatan Bersama Restorative Justice (PDF)...', 'info');
    setTimeout(() => {
      this.showToast('✅ Berkas Surat Kesepakatan Bersama siap dicetak & ditandatangani!', 'success');
    }, 1200);
  }

  // ==========================================================================
  // SATELLITE MAP PICKER UNTUK POS PANTAU (KABAG OPS)
  // Wajib menentukan titik lokasi pada satelit + preview radius geofence
  // ==========================================================================

  initCheckpointPickerMap(initialLat = -6.2140, initialLng = 106.8450, radiusMeters = 50) {
    const containerId = 'checkpoint-satellite-map';
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!this.pickerMarker) this.pickerMarker = null;
    if (!this.pickerCircle) this.pickerCircle = null;

    if (this.leafMaps && this.leafMaps[containerId]) {
      try {
        this.leafMaps[containerId].remove();
      } catch (e) {}
      delete this.leafMaps[containerId];
    }

    const map = L.map(containerId, {
      center: [initialLat, initialLng],
      zoom: 16,
      zoomControl: true,
      attributionControl: false
    });

    // Satellite layer (ESRI World Imagery High-Resolution)
    const satLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19
    });

    // Streets layer fallback
    const streetsLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd'
    });

    satLayer.addTo(map);
    this.pickerTileLayers = { satellite: satLayer, streets: streetsLayer };
    this.activePickerLayer = 'satellite';

    const pinIcon = L.divIcon({
      className: 'custom-sat-pin',
      html: `
        <div style="background:#EF4444; color:#fff; width:32px; height:32px; border-radius:50% 50% 50% 0; transform:rotate(-45deg); display:flex; align-items:center; justify-content:center; box-shadow:0 0 14px rgba(239,68,68,0.95); border:2px solid #fff;">
          <span style="transform:rotate(45deg); font-size:14px; font-weight:800;">📍</span>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });

    this.pickerMarker = L.marker([initialLat, initialLng], {
      icon: pinIcon,
      draggable: true
    }).addTo(map);

    this.pickerCircle = L.circle([initialLat, initialLng], {
      radius: radiusMeters,
      color: '#F59E0B',
      fillColor: '#F59E0B',
      fillOpacity: 0.25,
      weight: 2,
      dashArray: '4, 4'
    }).addTo(map);

    const latInp = document.getElementById('cp-input-lat');
    const lngInp = document.getElementById('cp-input-lng');
    if (latInp) latInp.value = initialLat.toFixed(6);
    if (lngInp) lngInp.value = initialLng.toFixed(6);

    const updateCoords = (lat, lng) => {
      if (latInp) latInp.value = lat.toFixed(6);
      if (lngInp) lngInp.value = lng.toFixed(6);
      const r = parseInt(document.getElementById('cp-input-radius')?.value || '50');
      if (this.pickerCircle) {
        this.pickerCircle.setLatLng([lat, lng]);
        this.pickerCircle.setRadius(r);
      }
      const hint = document.getElementById('cp-picker-hint');
      if (hint) {
        hint.innerHTML = `<span style="color:#FCD34D; font-weight:700;">✅ Titik Satelit Terkunci:</span> <strong>Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}</strong> (Geofence Radius: ${r}m)`;
      }
    };

    map.on('click', (e) => {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      if (this.pickerMarker) this.pickerMarker.setLatLng([lat, lng]);
      updateCoords(lat, lng);
    });

    this.pickerMarker.on('dragend', (e) => {
      const pos = e.target.getLatLng();
      updateCoords(pos.lat, pos.lng);
    });

    if (!this.leafMaps) this.leafMaps = {};
    this.leafMaps[containerId] = map;

    setTimeout(() => {
      map.invalidateSize();
    }, 200);
  }

  setCheckpointPickerLocation(lat, lng, name, address) {
    const latInp = document.getElementById('cp-input-lat');
    const lngInp = document.getElementById('cp-input-lng');
    if (latInp) latInp.value = lat.toFixed(6);
    if (lngInp) lngInp.value = lng.toFixed(6);

    const nameInp = document.getElementById('cp-input-name');
    if (nameInp && (!nameInp.value || nameInp.value.startsWith('Pos'))) {
      nameInp.value = name;
    }
    const addrInp = document.getElementById('cp-input-address');
    if (addrInp) {
      addrInp.value = address;
    }

    const r = parseInt(document.getElementById('cp-input-radius')?.value || '50');
    if (this.leafMaps && this.leafMaps['checkpoint-satellite-map']) {
      this.leafMaps['checkpoint-satellite-map'].setView([lat, lng], 17);
      if (this.pickerMarker) this.pickerMarker.setLatLng([lat, lng]);
      if (this.pickerCircle) {
        this.pickerCircle.setLatLng([lat, lng]);
        this.pickerCircle.setRadius(r);
      }
    }

    const hint = document.getElementById('cp-picker-hint');
    if (hint) {
      hint.innerHTML = `<span style="color:#FCD34D; font-weight:700;">✅ Titik Satelit Terkunci:</span> <strong>${name}</strong> (Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}, Radius: ${r}m)`;
    }
    this.showToast(`Titik koordinat satelit disetel ke: ${name}`, 'info');
  }

  setCheckpointPickerSatelliteLayer(type) {
    const map = this.leafMaps && this.leafMaps['checkpoint-satellite-map'];
    if (!map || !this.pickerTileLayers) return;

    if (type === 'satellite') {
      if (map.hasLayer(this.pickerTileLayers.streets)) map.removeLayer(this.pickerTileLayers.streets);
      if (!map.hasLayer(this.pickerTileLayers.satellite)) this.pickerTileLayers.satellite.addTo(map);
      this.showToast("Beralih ke Tampilan Citra Satelit Resolusi Tinggi (ESRI)", "info");
    } else {
      if (map.hasLayer(this.pickerTileLayers.satellite)) map.removeLayer(this.pickerTileLayers.satellite);
      if (!map.hasLayer(this.pickerTileLayers.streets)) this.pickerTileLayers.streets.addTo(map);
      this.showToast("Beralih ke Tampilan Peta Jalan Vektor", "info");
    }
  }

  onCheckpointRadiusChange(radiusVal) {
    const r = parseInt(radiusVal);
    if (this.pickerCircle) {
      this.pickerCircle.setRadius(r);
    }
    const latInp = document.getElementById('cp-input-lat');
    const lngInp = document.getElementById('cp-input-lng');
    const lat = parseFloat(latInp?.value || '-6.2140');
    const lng = parseFloat(lngInp?.value || '106.8450');
    const hint = document.getElementById('cp-picker-hint');
    if (hint) {
      hint.innerHTML = `<span style="color:#FCD34D; font-weight:700;">✅ Radius Geofence Diperbarui:</span> <strong>${r} Meter</strong> pada titik (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
    }
  }

  // ==========================================================================
  // METODE SIMULASI OTOMATIS (AUTO-FILL) DI SEMUA FORMULIR
  // Mempercepat evaluasi prototipe tanpa perlu mengetik manual
  // ==========================================================================

  simulateFillCheckpointForm() {
    const nameInp = document.getElementById('cp-input-name');
    const addrInp = document.getElementById('cp-input-address');
    const timeInp = document.getElementById('cp-input-time');
    const radInp = document.getElementById('cp-input-radius');
    const dwellInp = document.getElementById('cp-input-dwell');

    if (nameInp) nameInp.value = "Pos 6: Pos Pantau Bundaran Obvit Finansial";
    if (addrInp) addrInp.value = "Pertigaan Jl. Cempaka Raya - Sentra Niaga, Depan SPBU Pertamina";
    if (timeInp) timeInp.value = "14:30 WIB";
    if (radInp) {
      radInp.value = "50";
      this.onCheckpointRadiusChange("50");
    }
    if (dwellInp) dwellInp.value = "15 Mnt";

    // Set coordinates to Bundaran Obvit
    this.setCheckpointPickerLocation(-6.2255, 106.8520, "Pos 6: Pos Pantau Bundaran Obvit Finansial", "Pertigaan Jl. Cempaka Raya - Sentra Niaga, Depan SPBU Pertamina");
    this.showToast("✨ Data Pos Pantau terisi otomatis dengan titik satelit Bundaran Obvit!", "success");
  }

  simulateFillFleetAssignmentForm() {
    const vSel = document.getElementById('fa-select-vehicle');
    if (vSel) vSel.value = "Ranger Samapta 110-B (Double Cabin / B 1102 POL)|CAR|🚙";
    this.onFaVehicleSelectChange(vSel?.value);

    const oSel = document.getElementById('fa-select-officer');
    if (oSel) {
      for (let opt of oSel.options) {
        if (opt.value.includes('89010234') || opt.value.includes('Hendra')) {
          oSel.value = opt.value;
          break;
        }
      }
    }

    const rSel = document.getElementById('fa-select-route');
    if (rSel) rSel.value = "Beat 4 Pemukiman Padat & Kampus Timur";
    this.onFaRouteSelectChange(rSel?.value);

    const sSel = document.getElementById('fa-select-shift');
    if (sSel) sSel.value = "Shift 2 Malam (20:00 - 04:00 WIB)";

    const sprInp = document.getElementById('fa-input-sprint');
    if (sprInp) sprInp.value = "Sprin/420/X/OPS.1.1/2026";

    const colSel = document.getElementById('fa-select-color');
    if (colSel) colSel.value = "#C084FC";

    this.showToast("✨ Data Plotting Penugasan Armada terisi otomatis!", "success");
  }

  simulateFillSprintForm() {
    const nameInp = document.getElementById('sprint-input-name');
    if (nameInp) nameInp.value = "Operasi Zebra Candi Penertiban Kamseltibcarlantas & Balap Liar";

    const unitInp = document.getElementById('sprint-input-units');
    if (unitInp) unitInp.value = "Sat Lantas, Sat Samapta, Tim Perintis Presisi";

    const strengthInp = document.getElementById('sprint-input-strength');
    if (strengthInp) strengthInp.value = "35 Personel (4 Unit Sedan R4, 10 Unit Trail R2)";

    const locInp = document.getElementById('sprint-input-location');
    if (locInp) locInp.value = "Jalur Protokol Sudirman & Bypass Cempaka KM 12";

    const objInp = document.getElementById('sprint-input-objective');
    if (objInp) objInp.value = "Penertiban knalpot brong, pencegahan balap liar, dan pengamanan mobilitas masyarakat malam hari.";

    this.showToast("✨ Data Rencana Operasi (Sprint Renops) terisi otomatis!", "success");
  }

  simulateFillPublicReportForm() {
    const nameInp = document.getElementById('public-form-name');
    const phoneInp = document.getElementById('public-form-phone');
    const catInp = document.getElementById('public-form-cat') || document.getElementById('public-form-category');
    const locInp = document.getElementById('public-form-loc') || document.getElementById('public-form-location');
    const descInp = document.getElementById('public-form-desc');

    const isLoggedIn = !this.isCitizenGuest && this.currentCitizen && this.currentCitizen.phone;

    if (!isLoggedIn) {
      if (nameInp) nameInp.value = "Ibu Ratna Kumalasari";
      if (phoneInp) phoneInp.value = "0856-7890-1234";
    }

    if (catInp) catInp.value = "Curanmor / Pencurian";
    if (locInp) locInp.value = "Area Parkir Ruko Grand Mall, Jl. Merdeka No. 12";
    if (descInp) descInp.value = "Sepeda motor Honda Beat warna hitam plat B 4521 ABC hilang saat ditinggal belanja di ruko. Pelaku terekam CCTV ruko berjumlah 2 orang.";

    // Set precise coordinates on map
    this.setPublicIncidentLocation(-6.2146, 106.8451, "Area Parkir Ruko Grand Mall, Jl. Merdeka No. 12");

    if (isLoggedIn) {
      this.showToast(`✨ Formulir terisi simulasi untuk akun ${this.currentCitizen.name}! Lokasi presisi peta terkunci di Grand Mall.`, 'success');
    } else {
      this.showToast("✨ Formulir Mode Tamu terisi otomatis dengan Nama, No. HP, dan Titik Peta Presisi!", "success");
    }
  }

  simulateFillMediasiForm() {
    const p1 = document.getElementById('form-mediasi-party1');
    const p2 = document.getElementById('form-mediasi-party2');
    const cat = document.getElementById('form-mediasi-category');
    const off = document.getElementById('form-mediasi-officer');
    const desc = document.getElementById('form-mediasi-desc');
    const res = document.getElementById('form-mediasi-result');
    const pts = document.getElementById('form-mediasi-points');

    if (p1) p1.value = "Sdr. Hendra Pratama (Pelapor/Warga RT 03)";
    if (p2) p2.value = "Sdr. Bagus Santoso (Terlapor/Warga RT 03)";
    if (cat) cat.value = "Perselisihan Batas Tanah & Pekarangan";
    if (off) off.value = "Bripka Hendra (Bhabinkamtibmas Kel. Timur)";
    if (desc) desc.value = "Sengketa penempatan pagar pembatas pekarangan rumah yang memicu adu mulut bertetangga";
    if (res) res.value = "Sepakat Damai (Surat Pernyataan Bersama)";
    if (pts) pts.value = "1. Para pihak sepakat menata ulang batas pagar secara adil disaksikan ketua RT.\n2. Saling memaafkan dan berjanji menjaga kerukunan bertetangga.\n3. Menyatakan permasalahan selesai tuntas secara kekeluargaan.";

    this.showToast("✨ Formulir Mediasi Restorative Justice terisi otomatis!", "success");
  }

  simulateFillLogForm(isMismatch = false) {
    const titleInp = document.getElementById('form-log-title');
    const locInp = document.getElementById('form-log-location');
    const notesInp = document.getElementById('form-log-notes');
    const timeInp = document.getElementById('form-log-time');
    const chk = document.getElementById('check-simulate-mismatch');

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`;

    if (titleInp) titleInp.value = isMismatch ? "Patroli Siaga Stasioner Flyover" : "Patroli Dialogis & Sambang Satpam Ruko Pasar";
    if (locInp) locInp.value = isMismatch ? "Jembatan Layang Rel Kereta, Kel. Sukamaju" : "Area Parkir Ruko Grand Mall, Jl. Merdeka No. 12";
    if (notesInp) notesInp.value = isMismatch ? "Simulasi uji audit deviasi GPS: Personil mencatat di lokasi luar beat." : "Koordinasi keamanan malam dengan satpam ruko dan imbauan juru parkir agar waspada curanmor.";
    if (timeInp) timeInp.value = timeStr;
    if (chk) chk.checked = isMismatch;

    this.showToast(isMismatch ? "⚠️ Jurnal e-Logbook terisi simulasi ANOMALI GPS (Deviasi > 4 km)!" : "✨ Jurnal e-Logbook terisi otomatis dengan GPS valid!", isMismatch ? "warning" : "success");
  }

  simulateFillBapForm() {
    const violatorInp = document.getElementById('bap-input-violator');
    const typeInp = document.getElementById('bap-input-type');
    const locInp = document.getElementById('bap-input-location');
    const clarInp = document.getElementById('bap-input-clarification');
    const recInp = document.getElementById('bap-input-recommendation');
    const invInp = document.getElementById('bap-input-investigator');

    if (violatorInp) violatorInp.value = "Bripka Ahmad Subagyo (NRP: 88123456 - Danru Samapta)";
    if (typeInp) typeInp.value = "Penyimpangan Rute Patroli Tanpa Izin (> 4 km)";
    if (locInp) locInp.value = "Warkop Rawasari (Luar Wilayah Sektor Beat 1)";
    if (clarInp) clarInp.value = "Terperiksa mengakui meninggalkan rute beat tanpa izin dinas untuk urusan pribadi selama 45 menit.";
    if (recInp) recInp.value = "Teguran Tertulis & Pengawasan Melekat";
    if (invInp) invInp.value = "Aipda Bambang (Bamin Provos)";

    this.showToast("✨ Formulir BAP Disiplin Propam terisi otomatis!", "success");
  }

  simulateFillHotspotForm() {
    const nameInp = document.getElementById('kabagops-hotspot-name');
    const addrInp = document.getElementById('kabagops-hotspot-address');
    const catInp = document.getElementById('kabagops-hotspot-category');
    const latInp = document.getElementById('kabagops-hotspot-lat');
    const lngInp = document.getElementById('kabagops-hotspot-lng');
    const radInp = document.getElementById('kabagops-hotspot-radius');
    const riskInp = document.getElementById('kabagops-hotspot-risk');
    const hrsInp = document.getElementById('kabagops-hotspot-hours');
    const notesInp = document.getElementById('kabagops-hotspot-notes');

    if (nameInp) nameInp.value = "Titik Rawan Begal Jembatan Cempaka";
    if (addrInp) addrInp.value = "Jembatan Rel Kereta Api KM 3.5, Kel. Sukamaju";
    if (catInp) catInp.value = "Begal / Street Crime";
    if (latInp) latInp.value = "-6.2350";
    if (lngInp) lngInp.value = "106.8420";
    if (radInp) radInp.value = "300";
    if (riskInp) riskInp.value = "TINGGI";
    if (hrsInp) hrsInp.value = "23:00 - 04:00 WIB";
    if (notesInp) notesInp.value = "Patroli stasioner blue light malam hari, antisipasi geng motor bersenjata tajam.";

    this.showToast("✨ Formulir Titik Kerawanan Hotspot terisi otomatis!", "success");
  }

  simulateFillUserForm() {
    const nrpInp = document.getElementById('sitik-input-nrp');
    const nameInp = document.getElementById('sitik-input-name');
    const rankInp = document.getElementById('sitik-input-rank');
    const unitInp = document.getElementById('sitik-input-unit');
    const roleInp = document.getElementById('sitik-input-role');
    const devInp = document.getElementById('sitik-input-device-model');

    if (nrpInp) nrpInp.value = "86040811";
    if (nameInp) nameInp.value = "Bripka Dedi Sutejo, S.H.";
    if (rankInp) rankInp.value = "Bripka";
    if (unitInp) unitInp.value = "Sat Samapta (Turjawali)";
    if (roleInp) roleInp.value = "PERSONIL_LAPANGAN";
    if (devInp) devInp.value = "Samsung Galaxy XCover 5 Enterprise";

    this.showToast("✨ Formulir Akun Personel Baru terisi otomatis!", "success");
  }


  // ==========================================================================
  // REAL-WORLD GIS MAP INTEGRATION (LEAFLET / OPENSTREETMAP / CARTODB)
  // ==========================================================================
  refreshMapMarkers(containerId) {
    if (!this.leafMaps || !this.leafMaps[containerId]) return;
    const map = this.leafMaps[containerId];
    setTimeout(() => {
      if (typeof map.invalidateSize === 'function') map.invalidateSize();
    }, 100);
  }

  initRealMap(containerId) {
    if (typeof L === 'undefined') {
      // Dynamic loader with auto-retry across top CDNs
      if (!this._leafletLoading) {
        this._leafletLoading = true;
        const script1 = document.createElement('script');
        script1.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js';
        script1.onload = () => {
          this._leafletLoading = false;
          this.initRealMap(containerId);
        };
        script1.onerror = () => {
          const script2 = document.createElement('script');
          script2.src = 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js';
          script2.onload = () => {
            this._leafletLoading = false;
            this.initRealMap(containerId);
          };
          if (document.head) document.head.appendChild(script2);
        };
        if (document.head) document.head.appendChild(script1);
      }

      // Check if Leaflet finishes loading asynchronously
      let retries = 0;
      const pollTimer = setInterval(() => {
        retries++;
        if (typeof L !== 'undefined') {
          clearInterval(pollTimer);
          this.initRealMap(containerId);
        } else if (retries >= 20) {
          clearInterval(pollTimer);
          // Seamless offline fallback to realistic vector canvas
          const canvasId = containerId === 'kabagops-real-map' ? 'kabagops-tactical-canvas' : 'tactical-canvas';
          const canvasEl = document.getElementById(canvasId);
          const mapEl = document.getElementById(containerId);
          if (canvasEl && mapEl) {
            mapEl.style.display = 'none';
            canvasEl.style.display = 'block';
            this.drawTacticalCanvas(canvasId);
          }
        }
      }, 100);
      return;
    }

    const container = document.getElementById(containerId);
    if (!container) return;

    if (this.leafMaps && this.leafMaps[containerId]) {
      setTimeout(() => this.leafMaps[containerId].invalidateSize(), 150);
      return;
    }

    if (!this.leafMaps) this.leafMaps = {};
    if (!this.tileLayers) this.tileLayers = {};

    // Center coordinates: Jakarta & Tangerang metropolitan area
    const center = [-6.2146, 106.8451];

    try {
      const map = L.map(containerId, {
        center: center,
        zoom: 13,
        zoomControl: true,
        attributionControl: false
      });

      // CartoDB Dark Matter (High-tech Dark Police GIS)
      const darkLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd'
      });

      // OpenStreetMap Standard (Full-color Detailed Road Map)
      const osmLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
      });

      // Esri Satellite (Real Aerial Photography)
      const satLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 18
      });

      darkLayer.addTo(map);

      this.tileLayers[containerId] = {
        dark: darkLayer,
        osm: osmLayer,
        satellite: satLayer,
        current: 'dark'
      };

      this.leafMaps[containerId] = map;

      // 1. Add Mapolres Metro HQ Marker
      const hqIcon = L.divIcon({
        className: 'custom-hq-marker',
        html: `<div style="background:#0F172A; border:2px solid var(--accent-gold); border-radius:50%; width:38px; height:38px; display:flex; align-items:center; justify-content:center; font-size:18px; box-shadow:0 0 18px rgba(241,196,15,0.7); cursor:pointer;">🏢</div>`,
        iconSize: [38, 38],
        iconAnchor: [19, 19]
      });

      const hqMarker = L.marker([-6.2015, 106.8195], { icon: hqIcon }).addTo(map);
      hqMarker.bindPopup(`
        <div style="font-size:12px; font-family:'Plus Jakarta Sans',sans-serif;">
          <div style="font-size:14px; font-weight:800; color:var(--accent-gold); display:flex; align-items:center; gap:6px;">
            <span>🏢</span> Mapolres Metro (Mako Pusat)
          </div>
          <div style="color:#94A3B8; font-size:11px; margin-top:2px;">Pusat Pengendali Operasi & Gelar Pasukan Presisi</div>
          <hr style="border:none; border-top:1px solid rgba(255,255,255,0.1); margin:8px 0;">
          <div style="color:#fff;"><strong>Alamat:</strong> Jl. Jend. Sudirman No. 1</div>
          <div style="color:#10B981; font-weight:700; margin-top:4px;">Status: Siaga 1 Presisi &bull; 12 Unit Armada Standby</div>
        </div>
      `);

      // 2. Add All Active Patrol Units (Samapta, Perintis Presisi, Patwal, Bhabin)
      this.fleetMarkers = this.fleetMarkers || {};
      const fleet = this.state.patrolFleet || INITIAL_DATA.patrolFleet;

      fleet.forEach(f => {
        const isBusy = f.status === 'BERTUGAS';
        const ringColor = isBusy ? '#F59E0B' : '#38BDF8';
        const iconBg = isBusy ? '#78350F' : '#0369A1';

        const fleetIcon = L.divIcon({
          className: 'custom-patrol-marker',
          html: `
            <div style="position:relative; width:44px; height:44px;">
              <div class="pulse-ring" style="border: 2px solid ${ringColor}; background: rgba(56, 189, 248, 0.25);"></div>
              <div style="position:absolute; top:6px; left:6px; width:32px; height:32px; background:${iconBg}; border:2px solid ${ringColor}; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:16px; box-shadow:0 0 15px ${ringColor};">
                ${f.icon}
              </div>
            </div>
          `,
          iconSize: [44, 44],
          iconAnchor: [22, 22]
        });

        const fMarker = L.marker([f.lat, f.lng], { icon: fleetIcon }).addTo(map);
        fMarker.bindPopup(`
          <div style="font-size:12px; font-family:'Plus Jakarta Sans',sans-serif;">
            <div style="font-size:13px; font-weight:800; color:${ringColor}; display:flex; align-items:center; gap:6px;">
              <span>${f.icon}</span> ${f.callsign}
            </div>
            <div style="color:#fff; font-weight:700; margin-top:4px;">${f.officerName} (NRP ${f.officerNrp})</div>
            <div style="color:#94A3B8; font-size:11px;">${f.unit} &bull; ${f.vehicle}</div>
            <hr style="border:none; border-top:1px solid rgba(255,255,255,0.1); margin:8px 0;">
            <div style="color:${isBusy ? 'var(--accent-gold)' : '#10B981'}; font-weight:700;">Status: ${f.status}</div>
            <div style="font-size:11px; color:#cbd5e1; margin-top:2px;">Tugas: ${f.currentTask}</div>
            <div style="font-size:11px; color:#94A3B8; margin-top:2px;">Kecepatan: ${f.speedKmh} km/jam &bull; Sinyal GPS Prima</div>
          </div>
        `);
        this.fleetMarkers[f.id] = fMarker;
      });

      // 2B. Proximity Line from Active Emergency Incident to Nearest Unit
      const activeUnassigned = this.state.complaints.find(c => c.status === 'BELUM_DITANGANI' || c.status === 'DISPOSISI');
      if (activeUnassigned && activeUnassigned.lat && activeUnassigned.lng) {
        const nearestList = this.getNearestOfficersForComplaint(activeUnassigned);
        if (nearestList.length > 0) {
          const nearest = nearestList[0];
          const proxLine = L.polyline([[activeUnassigned.lat, activeUnassigned.lng], [nearest.lat, nearest.lng]], {
            color: '#38BDF8',
            weight: 3,
            dashArray: '8, 8',
            opacity: 0.85
          }).addTo(map);

          proxLine.bindTooltip(`📍 Jalur Terdekat ke ${activeUnassigned.id}: ${nearest.distanceKm} km (Est. ${nearest.etaMinutes} Mnt) &bull; ${nearest.callsign}`, {
            permanent: false,
            sticky: true,
            className: 'custom-map-tooltip'
          });
        }
      }


      // 3. Add Incidents (Complaints) Markers (Filtered by showResolvedMapIncidents)
      this.rebuildMapIncidents(containerId);

      // 4. Add Crime Hotspots with Danger Radius Circles
      this.state.hotspots.forEach(h => {
        const isHigh = h.risk === 'KRITIS' || h.risk === 'TINGGI' || h.level === 'KRITIS' || h.level === 'TINGGI';
        const circleColor = isHigh ? '#EF4444' : '#F59E0B';
        const rad = h.radius || 250;

        const circle = L.circle([h.lat, h.lng], {
          radius: rad,
          color: circleColor,
          weight: 2,
          fillColor: circleColor,
          fillOpacity: 0.22,
          dashArray: '5, 5'
        }).addTo(map);

        circle.bindPopup(`
          <div style="font-size:12px; font-family:'Plus Jakarta Sans',sans-serif;">
            <div style="font-size:13px; font-weight:800; color:${circleColor};">📍 Zona Kerawanan: ${h.name}</div>
            <div style="color:#fff; margin-top:2px;">Kategori: <strong>${h.category || 'Rawan Kamtibmas'}</strong></div>
            <div style="color:var(--accent-gold); font-size:11px; margin-top:2px;">Tingkat Risiko: <strong>${h.level || h.risk}</strong> &bull; Radius Pantau: ${rad} Meter</div>
            <div style="font-size:11px; color:#94A3B8; margin-top:4px;">⏰ Jam Rawan: ${h.hours || '22:00 - 04:00 WIB'}</div>
            <div style="font-size:11px; color:#cbd5e1; margin-top:4px; font-style:italic;">👉 ${h.notes || 'Patroli stasioner dan dialogis rutin'}</div>
          </div>
        `);
      });

      // 5. Add Patrol Route (Green Traversed Line & Orange Dashed Planned Line)
      const routePoints = this.state.checkpoints.map(cp => [cp.lat, cp.lng]);
      if (routePoints.length > 1) {
        // Traversed segment
        const traversed = routePoints.slice(0, 3);
        L.polyline(traversed, {
          color: '#10B981',
          weight: 4,
          opacity: 0.9
        }).addTo(map);

        // Planned segment
        const planned = routePoints.slice(2);
        L.polyline(planned, {
          color: '#F59E0B',
          weight: 3,
          dashArray: '6, 8',
          opacity: 0.8
        }).addTo(map);
      }

      // 6. Add Checkpoint Flags
      this.state.checkpoints.forEach((cp, idx) => {
        const flagIcon = L.divIcon({
          className: 'custom-cp-marker',
          html: `<div style="background:#1E293B; border:1px solid #38BDF8; color:#38BDF8; font-weight:800; font-size:10px; width:22px; height:22px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 0 8px rgba(56,189,248,0.5);">${idx + 1}</div>`,
          iconSize: [22, 22],
          iconAnchor: [11, 11]
        });

        const cpMarker = L.marker([cp.lat, cp.lng], { icon: flagIcon }).addTo(map);
        cpMarker.bindPopup(`
          <div style="font-size:11px; font-family:'Plus Jakarta Sans',sans-serif;">
            <strong style="color:#fff;">${cp.name}</strong><br>
            <span style="color:var(--accent-gold);">Scan QR: ${cp.qrCode}</span><br>
            <span style="color:#94A3B8;">Target Kunjungan: ${cp.timeTarget}</span>
          </div>
        `);
      });

      setTimeout(() => map.invalidateSize(), 200);

    } catch (err) {
      console.error("Leaflet init error:", err);
    }
  }


  // ============================================================================
  // TACTICAL MAP INCIDENT FILTERING (ACTIVE VS RESOLVED CASES)
  // Menjaga peta taktis tetap bersih dan berfokus pada kasus aktif darurat,
  // dengan opsi sakelar menampilkan kasus selesai untuk kebutuhan Anev pimpinan.
  // ============================================================================
  toggleResolvedMapIncidents(containerId = 'kabagops-real-map', role = 'kabagops') {
    this.showResolvedMapIncidents = !this.showResolvedMapIncidents;
    
    // Update button states across pimpinan and kabagops
    const btnIds = ['kabagops-btn-toggle-resolved', 'pimpinan-btn-toggle-resolved'];
    btnIds.forEach(id => {
      const btn = document.getElementById(id);
      if (btn) {
        if (this.showResolvedMapIncidents) {
          btn.classList.add('active');
          btn.style.background = 'rgba(16,185,129,0.25)';
          btn.style.borderColor = '#10B981';
          btn.style.color = '#6EE7B7';
          btn.innerHTML = '<span>✅</span> Riwayat Selesai: ON';
        } else {
          btn.classList.remove('active');
          btn.style.background = '';
          btn.style.borderColor = 'rgba(16,185,129,0.5)';
          btn.style.color = '#6EE7B7';
          btn.innerHTML = '<span>👁️</span> Riwayat Selesai: OFF';
        }
      }
    });

    if (this.showResolvedMapIncidents) {
      this.showToast("Mode Anev Aktif: Menampilkan riwayat kasus selesai (24 jam terakhir) di peta.", "info");
    } else {
      this.showToast("Mode Taktis Bersih: Kasus selesai disembunyikan (Hanya fokus kasus aktif darurat).", "info");
    }

    // Refresh map markers for active map
    if (this.leafMaps) {
      Object.keys(this.leafMaps).forEach(cId => {
        this.rebuildMapIncidents(cId);
      });
    }
  }

  rebuildMapIncidents(containerId) {
    if (!this.leafMaps || !this.leafMaps[containerId]) return;
    const map = this.leafMaps[containerId];

    // Remove old complaint markers
    if (this.complaintMarkers && this.complaintMarkers[containerId]) {
      this.complaintMarkers[containerId].forEach(m => {
        try { map.removeLayer(m); } catch (e) {}
      });
      this.complaintMarkers[containerId] = [];
    } else {
      this.complaintMarkers = this.complaintMarkers || {};
      this.complaintMarkers[containerId] = [];
    }

    this.state.complaints.forEach(c => {
      const isResolved = c.status === 'SELESAI';
      if (isResolved && !this.showResolvedMapIncidents) {
        return;
      }

      const isUrgent = c.status === 'BELUM_DITANGANI' || c.status === 'DISPOSISI';
      const color = isUrgent ? '#EF4444' : (isResolved ? '#10B981' : '#F59E0B');
      const iconChar = isResolved ? '✅' : '🚨';
      const opacity = isResolved ? '0.65' : '1';
      const size = isResolved ? 26 : 34;

      if (typeof L === 'undefined') return;

      const incIcon = L.divIcon({
        className: 'custom-inc-marker',
        html: `
          <div style="background:#0F172A; border:2px solid ${color}; border-radius:50%; width:${size}px; height:${size}px; display:flex; align-items:center; justify-content:center; font-size:${isResolved ? 13 : 16}px; box-shadow:0 0 ${isResolved ? '6px #10B981' : '14px #EF4444'}; opacity:${opacity};">
            ${iconChar}
          </div>
        `,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2]
      });

      const m = L.marker([c.lat, c.lng], { icon: incIcon }).addTo(map);
      m.bindPopup(`
        <div style="font-size:12px; font-family:'Plus Jakarta Sans',sans-serif;">
          <div style="font-size:13px; font-weight:800; color:${color};">
            ${iconChar} ${c.id} - ${c.category}
          </div>
          <div style="font-weight:700; color:#fff; margin-top:3px;">${c.title}</div>
          <div style="color:#94A3B8; font-size:11px; margin-top:2px;">📍 ${c.locationName}</div>
          <hr style="border:none; border-top:1px solid rgba(255,255,255,0.1); margin:8px 0;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="color:#cbd5e1;">Status Penanganan:</span>
            <span class="badge ${isResolved ? 'badge-success' : 'badge-danger'}">${c.status}</span>
          </div>
          ${isResolved && c.assignedOfficer ? `
            <div style="font-size:11px; color:#10B981; margin-top:4px;">
              Petugas Penuntas: ${c.assignedOfficer.name || c.assignedOfficer}
            </div>
          ` : ''}
          <button class="btn-primary" style="margin-top:8px; width:100%; justify-content:center; font-size:11px; padding:6px;" onclick="app.viewComplaintDetail('${c.id}')">
            📄 Buka Berkas Kasus & Bukti
          </button>
        </div>
      `);
      this.complaintMarkers[containerId].push(m);
    });
  }

  setMapTileLayer(type, containerId = 'kabagops-real-map') {
    if (!this.leafMaps || !this.leafMaps[containerId] || !this.tileLayers || !this.tileLayers[containerId]) return;

    const map = this.leafMaps[containerId];
    const layers = this.tileLayers[containerId];

    if (layers[layers.current]) {
      map.removeLayer(layers[layers.current]);
    }

    const labelId = containerId === 'kabagops-real-map' ? 'kabagops-map-layer-label' : 'pimpinan-map-layer-label';
    const labelEl = document.getElementById(labelId);

    if (type === 'osm') {
      layers.osm.addTo(map);
      layers.current = 'osm';
      if (labelEl) labelEl.textContent = '🗺️ Peta Jalan Real (OpenStreetMap)';
    } else if (type === 'satellite') {
      layers.satellite.addTo(map);
      layers.current = 'satellite';
      if (labelEl) labelEl.textContent = '🛰️ Citra Satelit Udara (Esri Imagery)';
    } else {
      layers.dark.addTo(map);
      layers.current = 'dark';
      if (labelEl) labelEl.textContent = '🌙 Dark Command Center (CartoDB)';
    }

    this.showToast(`Lapisan peta aktif: ${type.toUpperCase()}`, 'info');
  }


  // ============================================================================
  // ROLE: PERSONIL - SELF DEVICE PAIRING
  // ============================================================================
  openOfficerDevicePairingModal() {
    this.openModal('modal-officer-device-pairing');
  }

  submitOfficerSelfPairing() {
    const token = document.getElementById('officer-input-enroll-token')?.value.trim() || '928401';
    const ahmad = this.state.systemUsers && this.state.systemUsers.find(u => u.nrp === '88123456');
    if (ahmad) {
      ahmad.deviceBinding = {
        model: "Samsung Galaxy XCover 5 Enterprise (Police Rugged)",
        uuid: `SEC-POL-88123456-BOUND${Date.now().toString().slice(-4)}`,
        status: "TERIKAT",
        keystore: "Hardware StrongBox TEE (FIPS 140-2)",
        antiMock: "Aktif (Mock Provider Blocked)",
        enrolledAt: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
      };

      if (this.state.systemAuditLogs) {
        this.state.systemAuditLogs.unshift({
          id: `AUD-${Date.now().toString().slice(-6)}`,
          time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + " WIB",
          category: "DEVICE",
          categoryLabel: "Device Binding",
          severity: "INFO",
          actorName: "Bripka Ahmad Subagyo",
          actorNrp: "88123456",
          actorRole: "PERSONIL_LAPANGAN",
          ip: "10.12.84.15",
          device: "Samsung Galaxy XCover 5",
          action: "Otorisasi & Pendaftaran Gawai Berhasil",
          details: `Gawai berhasil diikat resmi ke akun dinas menggunakan token otorisasi Si TIK (${token}). Sertifikat mTLS di-inject ke StrongBox TEE.`,
          status: "SUKSES"
        });
      }

      this.saveState();
      this.closeAllModals();
      this.renderPersonilView();
      this.renderSitikView();
      this.showToast("✅ Gawai Anda berhasil diotorisasi resmi! Status: GAWAI TERIKAT (Hardware StrongBox TEE).", "success");
    }
  }

  // ============================================================================
  // ROLE: SEKSI TIK - INTERACTIVE GATEWAY MODALS & ACTIONS
  // ============================================================================
  openWhatsAppTestModal() {
    const resBox = document.getElementById('wa-test-result-box');
    if (resBox) resBox.style.display = 'none';
    this.openModal('modal-test-whatsapp');
  }

  executeWhatsAppTestSend() {
    const phone = document.getElementById('wa-test-phone')?.value || '0812-9844-3321';
    const msg = document.getElementById('wa-test-message')?.value || '';
    const resBox = document.getElementById('wa-test-result-box');

    this.showToast("⏳ Mengirim pesan uji via WhatsApp Gateway Fonnte API...", "info");

    setTimeout(() => {
      const msgId = `MSG-FNT-${Math.floor(Math.random() * 900000 + 100000)}`;
      if (resBox) {
        resBox.style.display = 'block';
        resBox.innerHTML = `
          <div style="color:#34D399; font-weight:800; margin-bottom:4px;">✅ HTTP 200 OK — Pesan Berhasil Terkirim!</div>
          <div>Target: ${phone}</div>
          <div>Message ID: ${msgId}</div>
          <div>Latensi Server: 114 ms</div>
          <div>Status: DELIVERED (Centang Dua Biru)</div>
        `;
      }

      if (this.state.systemAuditLogs) {
        this.state.systemAuditLogs.unshift({
          id: `AUD-${Date.now().toString().slice(-6)}`,
          time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + " WIB",
          category: "GATEWAY",
          categoryLabel: "Gateway API",
          severity: "INFO",
          actorName: "Aipda Pratama, S.Kom.",
          actorNrp: "83070455",
          actorRole: "SI_TIK",
          ip: "192.168.1.110",
          device: "Workstation TIK (Chrome)",
          action: "Uji Kirim Pesan WhatsApp Berhasil",
          details: `Mengirim pesan uji ke ${phone} via Fonnte Gateway. Response: HTTP 200 OK (${msgId}).`,
          status: "SUKSES"
        });
        this.saveState();
        this.renderSitikAuditTable();
      }

      this.showToast("✅ Pesan WhatsApp uji coba berhasil terkirim ke warga!", "success");
    }, 600);
  }

  openWhatsAppConfigModal() {
    this.openModal('modal-config-whatsapp');
  }

  saveWhatsAppConfig() {
    const endpoint = document.getElementById('cfg-wa-endpoint')?.value;
    const token = document.getElementById('cfg-wa-token')?.value;
    const webhook = document.getElementById('cfg-wa-webhook')?.value;
    const quota = document.getElementById('cfg-wa-quota')?.value;

    this.showToast("💾 Konfigurasi WhatsApp Business API berhasil disimpan & terenkripsi.", "success");
    this.closeAllModals();
  }

  openSmsTestModal() {
    const resBox = document.getElementById('sms-test-result-box');
    if (resBox) resBox.style.display = 'none';
    this.openModal('modal-test-sms');
  }

  executeSmsTestSend() {
    const phone = document.getElementById('sms-test-phone')?.value || '0812-9844-3321';
    const resBox = document.getElementById('sms-test-result-box');

    this.showToast("⏳ Menghubungi Sentral SMSC Mabes Polri...", "info");

    setTimeout(() => {
      if (resBox) {
        resBox.style.display = 'block';
        resBox.innerHTML = `
          <div style="color:#34D399; font-weight:800; margin-bottom:2px;">✅ SMSC Status: DELIVERED TO HANDSET</div>
          <div>Nomor Tujuan: ${phone}</div>
          <div>Operator Gateway: Telkomsel Core Network (4G LTE CAT-M)</div>
          <div>Latensi Transmisi: 198 ms</div>
          <div>Sisa Saldo Kuota: 4.919 SMS</div>
        `;
      }
      this.showToast("✅ SMS OTP Uji Coba berhasil dikirimkan via SMSC Telkomsel!", "success");
    }, 600);
  }

  openSmsConfigModal() {
    this.openModal('modal-config-sms');
  }

  saveSmsConfig() {
    this.showToast("💾 Pengaturan failover otomatis SMS OTP berhasil disimpan.", "success");
    this.closeAllModals();
  }

  openTileServerTestModal() {
    this.openModal('modal-test-tileserver');
  }

  purgeTileCache() {
    this.showToast("⏳ Membersihkan cache tile peta pada CDN Edge...", "info");
    setTimeout(() => {
      this.showToast("✅ Cache 64 tile basemap berhasil dibersihkan! Cache hit ratio di-reset.", "success");
      this.closeAllModals();
    }, 700);
  }

  openMqttStatusModal() {
    const tbody = document.getElementById('sitik-mqtt-fleet-tbody');
    const fleet = this.state.patrolFleet || (typeof INITIAL_DATA !== 'undefined' ? INITIAL_DATA.patrolFleet : []);

    if (tbody) {
      tbody.innerHTML = fleet.map(f => `
        <tr>
          <td>
            <strong style="color:#C084FC;">${f.callsign}</strong><br>
            <small style="color:var(--text-secondary);">${f.vehicleName || f.vehicle}</small>
          </td>
          <td>
            <strong>${f.officerName}</strong><br>
            <small style="color:var(--accent-gold); font-family:'JetBrains Mono';">NRP: ${f.officerNrp}</small>
          </td>
          <td>
            <span style="color:#38BDF8; font-weight:700;">${f.speedKmh} km/jam</span>
          </td>
          <td>
            <span class="badge badge-success" style="font-size:9.5px;">🟢 10-12 Satelit (3D Fix)</span>
          </td>
          <td style="font-family:'JetBrains Mono'; font-size:10.5px; color:#94A3B8;">
            Baru saja (3 detik lalu)
          </td>
          <td>
            <span class="badge badge-success" style="font-size:9.5px;">ONLINE</span>
          </td>
        </tr>
      `).join('');
    }

    this.openModal('modal-test-mqtt');
  }

  refreshMqttFleetStatus() {
    this.showToast("⏳ Mengirim broadcast ping mTLS ke seluruh armada patroli...", "info");
    setTimeout(() => {
      this.openMqttStatusModal();
      this.showToast("✅ Seluruh 4 armada patroli merespon aktif (0% Packet Loss)!", "success");
    }, 600);
  }

  openMtlsCertModal() {
    this.openModal('modal-mtls-ca');
  }

  runManualBackup() {
    this.openModal('modal-backup-progress');
    const titleEl = document.getElementById('backup-status-title');
    const descEl = document.getElementById('backup-status-desc');
    const barEl = document.getElementById('backup-progress-bar');
    const bytesEl = document.getElementById('backup-bytes-txt');
    const pctEl = document.getElementById('backup-percent-txt');
    const iconEl = document.getElementById('backup-anim-icon');
    const closeBtn = document.getElementById('btn-close-backup-modal');

    if (closeBtn) closeBtn.style.display = 'none';
    if (barEl) barEl.style.width = '15%';
    if (pctEl) pctEl.innerText = '15%';
    if (bytesEl) bytesEl.innerText = '27.6 MB / 184.2 MB';

    setTimeout(() => {
      if (titleEl) titleEl.innerText = "Mengompresi Arsip SQL & Metadata EXIF...";
      if (descEl) descEl.innerText = "Kompresi arsip bukti laporan & e-Logbook dengan gzip.";
      if (barEl) barEl.style.width = '55%';
      if (pctEl) pctEl.innerText = '55%';
      if (bytesEl) bytesEl.innerText = '101.3 MB / 184.2 MB';
    }, 700);

    setTimeout(() => {
      if (titleEl) titleEl.innerText = "Enkripsi Kriptografis AES-256 GCM...";
      if (descEl) descEl.innerText = "Mengamankan snapshot sesuai standar BSSN RI sebelum transmisi.";
      if (barEl) barEl.style.width = '85%';
      if (pctEl) pctEl.innerText = '85%';
      if (bytesEl) bytesEl.innerText = '156.5 MB / 184.2 MB';
    }, 1400);

    setTimeout(() => {
      const timeNow = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + " WIB";
      if (titleEl) titleEl.innerText = "Pencadangan Berhasil Disimpan!";
      if (descEl) descEl.innerHTML = `Snapshot 184.2 MB terenkripsi tersimpan di <strong>Cloud Mabes Polri</strong> & <strong>NAS Polres</strong> (${timeNow}).`;
      if (iconEl) iconEl.innerText = "✅";
      if (barEl) barEl.style.width = '100%';
      if (pctEl) pctEl.innerText = '100%';
      if (bytesEl) bytesEl.innerText = '184.2 MB / 184.2 MB';
      if (closeBtn) closeBtn.style.display = 'inline-block';

      this.showToast("💾 Pencadangan basis data MySQL berhasil diselesaikan!", "success");
    }, 2100);
  }

  downloadLatestBackup() {
    const sqlContent = `-- ==============================================================================
-- SIMAPRES 110 - DATABASE SNAPSHOT EXPORT
-- Waktu Snapshot: ${new Date().toISOString()}
-- Enkripsi: AES-256-GCM Signature Verified (Polres Metro)
-- ==============================================================================
-- Master tables: auth_units, auth_users, auth_officers, sec_device_bindings,
-- avl_patrol_fleet, c110_complaints, c110_timelines, media_proof_files,
-- geo_crime_hotspots, geo_patrol_routes, geo_patrol_checkpoints, geo_audit_records.
-- ==============================================================================
SELECT 'SIMAPRES 110 SNAPSHOT VALID' AS backup_status;
`;
    const blob = new Blob([sqlContent], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `simapres_110_backup_${new Date().toISOString().slice(0,10)}.sql`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 200);

    this.showToast("📥 Berkas snapshot basis data (SQL) berhasil diunduh ke komputer Anda!", "success");
  }


  toggleTacticalRadarMode(mapId = 'kabagops-real-map', canvasId = 'kabagops-tactical-canvas') {
    const mapEl = document.getElementById(mapId);
    const canvasEl = document.getElementById(canvasId);
    if (!mapEl || !canvasEl) return;

    if (mapEl.style.display === 'none') {
      mapEl.style.display = 'block';
      canvasEl.style.display = 'none';
      if (this.leafMaps && this.leafMaps[mapId]) {
        setTimeout(() => this.leafMaps[mapId].invalidateSize(), 150);
      }
      this.showToast("Beralih ke Peta Real-World GIS (Leaflet)", "info");
    } else {
      mapEl.style.display = 'none';
      canvasEl.style.display = 'block';
      this.drawTacticalCanvas(canvasId);
      this.showToast("Beralih ke Mode Radar Taktis Canvas", "info");
    }
  }

  // ==========================================================================
  // PLOTTING PENUGASAN ARMADA PATROLI (KENDARAAN A + ANGGOTA B + RUTE C)
  // SPRINT TURJAWALI BAG OPS - DOKTRIN & SOP POLRI
  // ==========================================================================

  renderPatrolUnitDropdown() {
    const select = document.getElementById('kabagops-patrol-unit-select');
    if (!select) return;
    const assignments = this.state.fleetAssignments || (INITIAL_DATA.fleetAssignments || []);
    const currentVal = this.selectedPatrolUnit || (assignments[0] && assignments[0].unitKey) || 'SAMAPTA_AHMAD';

    select.innerHTML = assignments.map(fa => `
      <option value="${fa.unitKey}" ${fa.unitKey === currentVal ? 'selected' : ''}>
        ${fa.icon || '🚔'} ${fa.vehicleName} (${fa.officerName} - ${fa.routeName})
      </option>
    `).join('');
  }

  renderKabagOpsFleetAssignmentsTable() {
    const tbody = document.getElementById('kabagops-fleet-assignments-tbody');
    if (!tbody) return;
    const assignments = this.state.fleetAssignments || (INITIAL_DATA.fleetAssignments || []);

    tbody.innerHTML = assignments.map((fa, idx) => {
      const isSelected = this.selectedPatrolUnit === fa.unitKey;
      return `
        <tr style="${isSelected ? 'background:rgba(2,132,199,0.12);' : ''}">
          <td style="font-weight:700; color:#94a3b8;">${idx + 1}</td>
          <td>
            <div style="font-weight:700; color:#fff; display:flex; align-items:center; gap:6px;">
              <span>${fa.icon || '🚔'}</span>
              <span>${fa.vehicleName}</span>
            </div>
            <div style="font-size:10px; color:#94a3b8;">${fa.vehiclePlate || '-'} &bull; ${fa.vehicleType || 'CAR'}</div>
          </td>
          <td>
            <div style="font-weight:700; color:#38BDF8;">${fa.officerName}</div>
            <div style="font-size:10px; color:#cbd5e1;">NRP: ${fa.officerNrp} &bull; ${fa.officerRole || 'Petugas Lapangan'}</div>
          </td>
          <td>
            <div style="font-weight:700; color:#FCD34D;">${fa.routeName}</div>
            <div style="font-size:10px; color:#94a3b8;">Kode: ${fa.routeCode || 'BEAT'}</div>
          </td>
          <td>
            <div style="font-size:11px; color:#fff;">${fa.shift}</div>
          </td>
          <td>
            <div style="font-size:10px; color:#A78BFA; font-family:monospace;">${fa.sprintNo}</div>
          </td>
          <td>
            <span class="badge ${fa.status === 'AKTIF' ? 'badge-success' : 'badge-warning'}">${fa.status}</span>
          </td>
          <td>
            <div style="display:flex; gap:6px; flex-wrap:nowrap;">
              <button type="button" class="btn-quick" style="padding:3px 8px; font-size:10px; border-color:#0284C7; color:#38BDF8;" onclick="app.selectFleetAssignmentFromTable('${fa.unitKey}')" title="Tampilkan Rute Unit Ini di Peta">
                📍 Pilih
              </button>
              <button type="button" class="btn-quick" style="padding:3px 8px; font-size:10px; border-color:#F59E0B; color:#FCD34D;" onclick="app.openFleetAssignmentModal('${fa.id}')" title="Edit Plotting">
                ✏️ Edit
              </button>
              <button type="button" class="btn-quick" style="padding:3px 8px; font-size:10px; border-color:#EF4444; color:#FCA5A5;" onclick="app.deleteFleetAssignment('${fa.id}')" title="Hapus Plotting">
                🗑️
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  renderModalFleetAssignmentsTable() {
    const tbody = document.getElementById('fa-modal-table-tbody');
    const countEl = document.getElementById('fa-total-count');
    if (!tbody) return;
    const assignments = this.state.fleetAssignments || (INITIAL_DATA.fleetAssignments || []);
    if (countEl) countEl.textContent = `${assignments.length} Pasangan Aktif`;

    tbody.innerHTML = assignments.map((fa, idx) => {
      const isSelected = this.selectedPatrolUnit === fa.unitKey;
      return `
        <tr style="${isSelected ? 'background:rgba(2,132,199,0.15);' : ''}">
          <td>${idx + 1}</td>
          <td>
            <strong>${fa.icon || '🚔'} ${fa.vehicleName}</strong><br>
            <span style="color:#94a3b8; font-size:10px;">${fa.vehiclePlate}</span>
          </td>
          <td>
            <strong style="color:#38BDF8;">${fa.officerName}</strong><br>
            <span style="color:#cbd5e1; font-size:10px;">NRP ${fa.officerNrp}</span>
          </td>
          <td>
            <strong style="color:#FCD34D;">${fa.routeName}</strong>
          </td>
          <td>
            <span>${fa.shift}</span><br>
            <span style="font-size:10px; color:#A78BFA; font-family:monospace;">${fa.sprintNo}</span>
          </td>
          <td>
            <div style="display:flex; gap:4px;">
              <button type="button" class="btn-quick" style="padding:2px 6px; font-size:10px; border-color:#0284C7; color:#38BDF8;" onclick="app.selectFleetAssignmentFromModal('${fa.unitKey}')">
                🎯 Pilih
              </button>
              <button type="button" class="btn-quick" style="padding:2px 6px; font-size:10px; border-color:#F59E0B; color:#FCD34D;" onclick="app.editFleetAssignment('${fa.id}')">
                ✏️
              </button>
              <button type="button" class="btn-quick" style="padding:2px 6px; font-size:10px; border-color:#EF4444; color:#FCA5A5;" onclick="app.deleteFleetAssignment('${fa.id}')">
                🗑️
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  openFleetAssignmentModal(editId = null) {
    const officerSelect = document.getElementById('fa-select-officer');
    if (officerSelect) {
      const users = this.state.systemUsers || [];
      const officers = users.filter(u => u.status === 'AKTIF');
      officerSelect.innerHTML = officers.map(u => `
        <option value="${u.nrp}|${u.name}|${u.rank}">
          ${u.rank} ${u.name} (NRP: ${u.nrp} - ${u.unit})
        </option>
      `).join('');
    }

    if (editId) {
      this.editFleetAssignment(editId);
    } else {
      this.resetFleetAssignmentForm();
    }

    this.renderModalFleetAssignmentsTable();
    this.openModal('modal-kabagops-fleet-assignment');
  }

  onFaVehicleSelectChange(val) {
    const customInp = document.getElementById('fa-custom-vehicle');
    if (!customInp) return;
    if (val === 'CUSTOM') {
      customInp.style.display = 'block';
      customInp.required = true;
    } else {
      customInp.style.display = 'none';
      customInp.required = false;
    }
  }

  onFaRouteSelectChange(val) {
    const customInp = document.getElementById('fa-custom-route');
    if (!customInp) return;
    if (val === 'CUSTOM') {
      customInp.style.display = 'block';
      customInp.required = true;
    } else {
      customInp.style.display = 'none';
      customInp.required = false;
    }
  }

  resetFleetAssignmentForm() {
    const titleEl = document.getElementById('fleet-assignment-form-title');
    if (titleEl) titleEl.textContent = '➕ Form Plotting / Pasangkan Armada Baru';
    const idInp = document.getElementById('fa-input-id');
    if (idInp) idInp.value = '';
    const keyInp = document.getElementById('fa-input-key');
    if (keyInp) keyInp.value = '';
    const vSel = document.getElementById('fa-select-vehicle');
    if (vSel && vSel.options.length > 0) vSel.value = vSel.options[0].value;
    const cVeh = document.getElementById('fa-custom-vehicle');
    if (cVeh) { cVeh.value = ''; cVeh.style.display = 'none'; }
    const rSel = document.getElementById('fa-select-route');
    if (rSel && rSel.options.length > 0) rSel.value = rSel.options[0].value;
    const cRoute = document.getElementById('fa-custom-route');
    if (cRoute) { cRoute.value = ''; cRoute.style.display = 'none'; }
    const sSel = document.getElementById('fa-select-shift');
    if (sSel && sSel.options.length > 0) sSel.value = sSel.options[0].value;
    const spr = document.getElementById('fa-input-sprint');
    if (spr) spr.value = 'Sprin/412/X/OPS.1.1/2026';
    const col = document.getElementById('fa-select-color');
    if (col) col.value = '#38BDF8';
  }

  editFleetAssignment(id) {
    const fa = (this.state.fleetAssignments || []).find(f => f.id === id);
    if (!fa) return;

    const titleEl = document.getElementById('fleet-assignment-form-title');
    if (titleEl) titleEl.textContent = `✏️ Edit Plotting Armada: ${fa.vehicleName}`;

    document.getElementById('fa-input-id').value = fa.id;
    document.getElementById('fa-input-key').value = fa.unitKey;

    // Vehicle
    const vSel = document.getElementById('fa-select-vehicle');
    const cVeh = document.getElementById('fa-custom-vehicle');
    let matchedVeh = false;
    if (vSel) {
      for (let opt of vSel.options) {
        if (opt.value.includes(fa.vehicleName)) {
          vSel.value = opt.value;
          matchedVeh = true;
          break;
        }
      }
      if (!matchedVeh) {
        vSel.value = 'CUSTOM';
        if (cVeh) {
          cVeh.value = `${fa.vehicleName} (${fa.vehiclePlate || ''})`;
          cVeh.style.display = 'block';
        }
      } else {
        if (cVeh) cVeh.style.display = 'none';
      }
    }

    // Officer
    const oSel = document.getElementById('fa-select-officer');
    if (oSel) {
      for (let opt of oSel.options) {
        if (opt.value.includes(fa.officerNrp)) {
          oSel.value = opt.value;
          break;
        }
      }
    }

    // Route
    const rSel = document.getElementById('fa-select-route');
    const cRoute = document.getElementById('fa-custom-route');
    let matchedRoute = false;
    if (rSel) {
      for (let opt of rSel.options) {
        if (opt.value.includes(fa.routeName)) {
          rSel.value = opt.value;
          matchedRoute = true;
          break;
        }
      }
      if (!matchedRoute) {
        rSel.value = 'CUSTOM';
        if (cRoute) {
          cRoute.value = fa.routeName;
          cRoute.style.display = 'block';
        }
      } else {
        if (cRoute) cRoute.style.display = 'none';
      }
    }

    const shiftSel = document.getElementById('fa-select-shift');
    if (shiftSel) shiftSel.value = fa.shift;
    const sprInp = document.getElementById('fa-input-sprint');
    if (sprInp) sprInp.value = fa.sprintNo;
    const colSel = document.getElementById('fa-select-color');
    if (colSel) colSel.value = fa.color || '#38BDF8';
  }

  submitFleetAssignment() {
    const editId = document.getElementById('fa-input-id').value.trim();

    // Vehicle parse
    const vSelVal = document.getElementById('fa-select-vehicle').value;
    let vehicleName = "";
    let vehiclePlate = "B 1100 POL";
    let vehicleType = "CAR";
    let icon = "🚔";

    if (vSelVal === 'CUSTOM') {
      vehicleName = document.getElementById('fa-custom-vehicle').value.trim() || 'Armada Khusus Ops';
      vehiclePlate = 'B ' + Math.floor(1000 + Math.random() * 8999) + ' POL';
      icon = vehicleName.toLowerCase().includes('motor') || vehicleName.toLowerCase().includes('trail') ? '🏍️' : '🚔';
      vehicleType = icon === '🏍️' ? 'BIKE' : 'CAR';
    } else {
      const parts = vSelVal.split('|');
      const vFull = parts[0];
      vehicleType = parts[1] || 'CAR';
      icon = parts[2] || '🚔';
      const m = vFull.match(/^(.*?)\s*\((.*?)\)$/);
      if (m) {
        vehicleName = m[1].trim();
        vehiclePlate = m[2].trim();
      } else {
        vehicleName = vFull;
      }
    }

    // Officer parse
    const oSelVal = document.getElementById('fa-select-officer').value;
    const oParts = oSelVal.split('|');
    const officerNrp = oParts[0];
    const rawOfficerName = oParts[1] || 'Petugas Lapangan';
    const officerRank = oParts[2] || 'Bripka';
    const officerName = rawOfficerName.startsWith(officerRank) ? rawOfficerName : `${officerRank} ${rawOfficerName}`;

    // Route parse
    const rSelVal = document.getElementById('fa-select-route').value;
    let routeName = "";
    if (rSelVal === 'CUSTOM') {
      routeName = document.getElementById('fa-custom-route').value.trim() || 'Beat Khusus Kewilayahan';
    } else {
      routeName = rSelVal;
    }

    const shift = document.getElementById('fa-select-shift').value;
    const sprintNo = document.getElementById('fa-input-sprint').value.trim() || 'Sprin/412/X/OPS.1.1/2026';
    const color = document.getElementById('fa-select-color').value || '#38BDF8';

    if (editId) {
      // Update existing
      const idx = this.state.fleetAssignments.findIndex(f => f.id === editId);
      if (idx !== -1) {
        const item = this.state.fleetAssignments[idx];
        item.vehicleName = vehicleName;
        item.vehiclePlate = vehiclePlate;
        item.vehicleType = vehicleType;
        item.icon = icon;
        item.officerNrp = officerNrp;
        item.officerName = officerName;
        item.routeName = routeName;
        item.shift = shift;
        item.sprintNo = sprintNo;
        item.color = color;

        // Also update patrolFleet if exists
        const pf = this.state.patrolFleet.find(f => f.officerNrp === officerNrp || f.callsign.includes(vehicleName));
        if (pf) {
          pf.officerName = officerName;
          pf.officerNrp = officerNrp;
          pf.vehicle = vehicleName;
          pf.vehicleType = vehicleType;
          pf.icon = icon;
          pf.currentTask = `Patroli ${routeName}`;
        }

        this.showToast(`Plotting armada ${vehicleName} berhasil diperbarui!`, 'success');
      }
    } else {
      // Create new assignment
      const newId = `ASSIGN-${String(this.state.fleetAssignments.length + 1).padStart(2, '0')}`;
      const safeKey = `UNIT_${Date.now()}`;
      const newAssignment = {
        id: newId,
        unitKey: safeKey,
        vehicleName: vehicleName,
        vehiclePlate: vehiclePlate,
        vehicleType: vehicleType,
        officerNrp: officerNrp,
        officerName: officerName,
        officerRole: `Danru ${vehicleName}`,
        routeName: routeName,
        routeCode: `BEAT-0${this.state.fleetAssignments.length + 1}`,
        shift: shift,
        sprintNo: sprintNo,
        status: "AKTIF",
        icon: icon,
        color: color
      };

      this.state.fleetAssignments.push(newAssignment);

      // Create checkpoints for this new beat
      if (!this.state.unitCheckpoints[safeKey]) {
        this.state.unitCheckpoints[safeKey] = [
          { id: 1, name: `Pos 1: Mako Polres (Keberangkatan ${vehicleName})`, lat: -6.2015, lng: 106.8195, timeTarget: "08:00 WIB", qrCode: `QR-${newId}-01`, status: "TERKUNJUNGI", lastVisited: "08:05 WIB" },
          { id: 2, name: `Pos 2: Pos Pantau Sektor Utama (${routeName})`, lat: -6.2190, lng: 106.8380, timeTarget: "09:30 WIB", qrCode: `QR-${newId}-02`, status: "SIAGA PATROLI", lastVisited: "Target 09:30 WIB" },
          { id: 3, name: `Pos 3: Titik Sambang Warga / Dialogis Obvit`, lat: -6.2310, lng: 106.8490, timeTarget: "11:00 WIB", qrCode: `QR-${newId}-03`, status: "SIAGA PATROLI", lastVisited: "Target 11:00 WIB" },
          { id: 4, name: `Pos 4: Mako Polres (Konsolidasi Akhir)`, lat: -6.2015, lng: 106.8195, timeTarget: "15:30 WIB", qrCode: `QR-${newId}-04`, status: "KONSOLIDASI", lastVisited: "Target 15:30 WIB" }
        ];
      }

      // Add to patrolFleet
      this.state.patrolFleet.push({
        id: `FLEET-${String(this.state.patrolFleet.length + 1).padStart(2, '0')}`,
        callsign: `${vehicleName} - ${officerName}`,
        unit: "Sat Samapta (Turjawali)",
        officerName: officerName,
        officerNrp: officerNrp,
        vehicle: vehicleName,
        vehicleType: vehicleType,
        lat: -6.2190,
        lng: 106.8380,
        status: "SIAGA",
        currentTask: `Patroli ${routeName}`,
        speedKmh: 30,
        phone: "0812-8800-9900",
        icon: icon
      });

      this.selectedPatrolUnit = safeKey;
      this.showToast(`Plotting baru berhasil ditetapkan: ${vehicleName} oleh ${officerName} di ${routeName}!`, 'success');
    }

    // System audit log
    if (this.state.systemAuditLogs) {
      this.state.systemAuditLogs.unshift({
        id: `AUD-${Date.now()}`,
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB',
        user: "Kompol Wahyu Santoso (Kabag Ops)",
        action: "PLOT_ASSIGNMENT",
        module: "RENOPS_TURJAWALI",
        details: `Plotting penugasan armada ditetapkan: Ranmor ${vehicleName} (${vehiclePlate}) ditugaskan kepada ${officerName} (NRP ${officerNrp}) untuk Rute ${routeName} (${shift}, ${sprintNo}).`,
        status: "SUCCESS"
      });
    }

    this.saveState();
    this.renderPatrolUnitDropdown();
    this.renderKabagOpsFleetAssignmentsTable();
    this.renderModalFleetAssignmentsTable();
    this.onPatrolUnitChange(this.selectedPatrolUnit);
    this.renderKabagOpsFleetStatusList();
    this.renderKabagOpsKpis();
    this.closeAllModals();
  }

  deleteFleetAssignment(id) {
    const fa = (this.state.fleetAssignments || []).find(f => f.id === id);
    if (!fa) return;
    if (!confirm(`Hapus plotting penugasan untuk armada "${fa.vehicleName}" (${fa.officerName})?`)) return;

    this.state.fleetAssignments = this.state.fleetAssignments.filter(f => f.id !== id);
    if (this.selectedPatrolUnit === fa.unitKey) {
      this.selectedPatrolUnit = (this.state.fleetAssignments[0] && this.state.fleetAssignments[0].unitKey) || 'SAMAPTA_AHMAD';
    }

    if (this.state.systemAuditLogs) {
      this.state.systemAuditLogs.unshift({
        id: `AUD-${Date.now()}`,
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB',
        user: "Kompol Wahyu Santoso (Kabag Ops)",
        action: "DELETE_ASSIGNMENT",
        module: "RENOPS_TURJAWALI",
        details: `Plotting penugasan armada dihapus: Ranmor ${fa.vehicleName} (${fa.officerName} - ${fa.routeName}).`,
        status: "WARNING"
      });
    }

    this.saveState();
    this.renderPatrolUnitDropdown();
    this.renderKabagOpsFleetAssignmentsTable();
    this.renderModalFleetAssignmentsTable();
    this.onPatrolUnitChange(this.selectedPatrolUnit);
    this.showToast(`Plotting armada ${fa.vehicleName} berhasil dihapus.`, 'info');
  }

  selectFleetAssignmentFromModal(unitKey) {
    this.closeAllModals();
    this.switchKabagOpsTab('tab-kabagops-rute');
    this.onPatrolUnitChange(unitKey);
    const select = document.getElementById('kabagops-patrol-unit-select');
    if (select) select.value = unitKey;
  }

  selectFleetAssignmentFromTable(unitKey) {
    this.switchKabagOpsTab('tab-kabagops-rute');
    this.onPatrolUnitChange(unitKey);
    const select = document.getElementById('kabagops-patrol-unit-select');
    if (select) select.value = unitKey;
  }

}

let app;
function initApp() {
  app = new SimapresApp();
  if (typeof window !== 'undefined') {
    window.app = app;
  }
  return app;
}

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', initApp);
  window.SimapresApp = SimapresApp;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SimapresApp, initApp };
}
