import { prisma } from '../src/infrastructure/db/prisma.client';

export const SEED_FAQS_DATA = [
  {
    "slug": "sim-perpanjang",
    "kategori": "LANTAS_SIM",
    "kategori_label": "Lalu Lintas & SIM",
    "icon": "🚗",
    "judul": "Perpanjangan SIM A & SIM C (Satpas & Layanan Keliling)",
    "subjudul": "Panduan syarat dan alur perpanjangan masa berlaku SIM sebelum jatuh tempo",
    "tags": [
      "sim",
      "perpanjang",
      "sim a",
      "sim c",
      "satpas",
      "sim keliling",
      "kadaluarsa",
      "biaya sim",
      "foto sim"
    ],
    "persyaratan": [
      "SIM lama yang masih berlaku (belum melewati tanggal masa berlaku)",
      "e-KTP Asli beserta 2 lembar fotokopi e-KTP",
      "Surat Keterangan Pemeriksaan Kesehatan Jasmani (dari dokter resmi Polri / e-Rikkes)",
      "Surat Keterangan Tes Psikologi (dari lembaga terakreditasi / e-PPSI)",
      "Bukti kepesertaan aktif BPJS Kesehatan / JKN (sesuai Perpol No. 2 Tahun 2023)"
    ],
    "prosedur": [
      "Lakukan pendaftaran di loket Satpas atau Bus SIM Keliling",
      "Verifikasi identitas dan berkas kesehatan & psikologi",
      "Pembayaran biaya PNBP resmi di loket BRI / Bank yang ditunjuk",
      "Pengambilan foto diri, sidik jari digital, dan tanda tangan elektronik",
      "Pencetakan dan penyerahan kartu fisik SIM baru"
    ],
    "biaya_pnbp": "SIM A: Rp 80.000 | SIM C: Rp 75.000 (Resmi PP No. 76 Tahun 2020, belum termasuk biaya uji kes/psiko)",
    "lokasi_pelayanan": "Gedung Satpas Satlantas Polres Pekalongan (Jl. Mandurorejo Kajen) / Bus SIM Keliling Alun-alun Kajen & Polsek Wiradesa",
    "jam_operasional": "Senin – Kamis: 08.00 – 13.00 WIB | Jumat – Sabtu: 08.00 – 11.30 WIB",
    "waktu_penyelesaian": "± 20 – 40 Menit (apabila berkas pemeriksaan kesehatan & psikologi telah lengkap)",
    "script_operator": "Selamat pagi/siang Bapak/Ibu. Untuk perpanjangan SIM A atau C, persyaratannya membawa e-KTP asli + fotokopi, SIM lama yang masih berlaku, serta surat hasil tes kesehatan dan psikologi. Biaya resmi PNBP adalah Rp 80.000 untuk SIM A dan Rp 75.000 untuk SIM C. Pelayanan tersedia di Satpas Polres Pekalongan Kajen atau Mobil SIM Keliling setiap hari kerja mulai pukul 08.00 WIB.",
    "kontak_penting": "Hotline Layanan Satpas: 0812-2500-110 (WhatsApp Center)",
    "display_order": 1,
    "is_active": true
  },
  {
    "slug": "sim-baru",
    "kategori": "LANTAS_SIM",
    "kategori_label": "Lalu Lintas & SIM",
    "icon": "🪪",
    "judul": "Pembuatan SIM Baru (SIM A & SIM C)",
    "subjudul": "Panduan persyaratan pendaftaran, ujian teori, dan uji praktik berkendara",
    "tags": [
      "sim baru",
      "buat sim",
      "bikin sim",
      "ujian sim",
      "tes sim",
      "uji teori",
      "uji praktik",
      "satpas"
    ],
    "persyaratan": [
      "Usia minimal 17 tahun untuk SIM A dan SIM C",
      "e-KTP Asli beserta 2 lembar fotokopi",
      "Surat Keterangan Kesehatan Jasmani & Rohani (Dokter Polri)",
      "Surat Hasil Lulus Tes Psikologi",
      "Sertifikat Pelatihan Mengemudi (rekomendasi sekolah mengemudi terakreditasi)",
      "Bukti kepesertaan aktif BPJS Kesehatan"
    ],
    "prosedur": [
      "Pendaftaran dan input data biometrik di Satpas Polres Pekalongan",
      "Mengikuti Ujian Teori Berbasis Komputer (AVIS / Audio Visual Integrated System)",
      "Mengikuti Ujian Praktik Lapangan (Lintasan S & U-Turn tanpa angka 8)",
      "Apabila lulus, melakukan pembayaran PNBP resmi di loket bank",
      "Foto, rekam sidik jari, dan pencetakan SIM baru",
      "Jika belum lulus ujian praktik, diberikan hak ujian remedial ulang gratis maksimal 2 kali"
    ],
    "biaya_pnbp": "SIM A Baru: Rp 120.000 | SIM C Baru: Rp 100.000 (Sesuai PP No. 76/2020)",
    "lokasi_pelayanan": "Satpas Satlantas Polres Pekalongan (Jl. Mandurorejo Kajen)",
    "jam_operasional": "Senin – Kamis: 08.00 – 14.00 WIB | Jumat – Sabtu: 08.00 – 12.00 WIB",
    "waktu_penyelesaian": "± 90 – 120 Menit (termasuk durasi ujian teori & simulasi praktik berkendara)",
    "script_operator": "Baik Bapak/Ibu, untuk pembuatan SIM baru persyaratannya adalah usia minimal 17 tahun, membawa e-KTP asli, surat kesehatan, hasil tes psikologi, dan sertifikat pelatihan mengemudi. Pemohon akan mengikuti ujian teori komputer dan ujian praktik berkendara di Satpas Kajen. Biaya PNBP resmi Rp 120.000 untuk SIM A dan Rp 100.000 untuk SIM C.",
    "kontak_penting": null,
    "display_order": 2,
    "is_active": true
  },
  {
    "slug": "tilang-etle",
    "kategori": "LANTAS_SIM",
    "kategori_label": "Lalu Lintas & SIM",
    "icon": "📸",
    "judul": "Konfirmasi Tilang Elektronik (ETLE / Kamera Statis & Drone)",
    "subjudul": "Cara konfirmasi surat tilang dan pembayaran denda pelanggaran lalu lintas",
    "tags": [
      "tilang",
      "etle",
      "surat tilang",
      "kamera polisi",
      "denda tilang",
      "briva",
      "blokir stnk"
    ],
    "persyaratan": [
      "Surat Konfirmasi ETLE yang diterima di alamat rumah pelapor",
      "e-KTP pemilik kendaraan",
      "STNK asli kendaraan yang terkena tilang",
      "Foto kendaraan saat terjadi pelanggaran (tercantum di surat konfirmasi)"
    ],
    "prosedur": [
      "Buka situs resmi konfirmasi: https://etle-korlantas.info atau scan barcode di surat",
      "Masukkan nomor referensi tilang dan nomor plat polisi kendaraan",
      "Lakukan konfirmasi apakah benar Anda yang mengemudi atau kendaraan telah dipindahtangankan",
      "Setelah konfirmasi, sistem akan menerbitkan Kode BRIVA (Virtual Account BRI) untuk denda resmi",
      "Bayar denda tilang via ATM / Mobile Banking / teller Bank BRI",
      "Jika tidak dikonfirmasi dalam waktu 8 hari, STNK kendaraan akan otomatis terblokir di Samsat"
    ],
    "biaya_pnbp": "Sesuai jenis pelanggaran (Contoh: Tidak pakai helm SNI Rp 250.000, langgar rambu Rp 500.000, sabuk pengaman Rp 250.000)",
    "lokasi_pelayanan": "Posko Gakkum ETLE Satlantas Polres Pekalongan / Online via portal etle-korlantas.info",
    "jam_operasional": "Pelayanan Posko Fisik: Senin – Jumat 08.00 – 15.00 WIB (Online 24 Jam)",
    "waktu_penyelesaian": "Online 5 Menit / Loket Fisik 15 Menit",
    "script_operator": "Untuk surat tilang ETLE, Bapak/Ibu bisa langsung melakukan konfirmasi secara online melalui website etle-korlantas.info menggunakan nomor referensi yang ada di surat tilang. Nanti akan muncul kode bayar BRIVA untuk membayar denda langsung lewat bank. Mohon segera dikonfirmasi dalam 8 hari agar STNK tidak otomatis terblokir di Samsat.",
    "kontak_penting": null,
    "display_order": 3,
    "is_active": true
  },
  {
    "slug": "stnk-hilang",
    "kategori": "SAMSAT_STNK_BPKB",
    "kategori_label": "Samsat, STNK & BPKB",
    "icon": "📑",
    "judul": "Pengurusan STNK Hilang (Surat Tanda Nomor Kendaraan Duplikat)",
    "subjudul": "Prosedur penerbitan duplikat STNK karena hilang tercecer atau rusak",
    "tags": [
      "stnk hilang",
      "stnk tercecer",
      "urus stnk",
      "duplikat stnk",
      "samsat",
      "cek fisik",
      "bpkb"
    ],
    "persyaratan": [
      "Surat Keterangan Kehilangan STNK dari Polsek / Polres terdekat",
      "e-KTP Asli pemilik kendaraan yang tercantum di STNK & BPKB + fotokopi",
      "BPKB Asli beserta fotokopi legalisir (jika BPKB masih di leasing, minta surat keterangan & legalisir dari pihak leasing/bank)",
      "Bukti Cek Fisik Kendaraan resmi dari Samsat Induk (gesek nomor rangka & nomor mesin)",
      "Kwitansi pembelian bermaterai (khusus jika kendaraan belum balik nama)"
    ],
    "prosedur": [
      "Buat Surat Kehilangan di SPKT Polsek / Polres Pekalongan membawa KTP & BPKB",
      "Bawa kendaraan ke Kantor Samsat Kajen untuk Cek Fisik (gesek nomor rangka & mesin)",
      "Legalitas dokumen di loket cek fisik Samsat",
      "Serahkan berkas ke Loket STNK Hilang / Duplikat",
      "Lakukan pembayaran biaya PNBP STNK dan pajak kendaraan (jika ada tunggakan)",
      "Penerbitan lembar STNK baru bertanda DUPLIKAT"
    ],
    "biaya_pnbp": "Penerbitan STNK Duplikat Roda 2: Rp 100.000 | Roda 4: Rp 200.000 (Belum termasuk pajak berjalan)",
    "lokasi_pelayanan": "Kantor Bersama Samsat Kabupaten Pekalongan (Jl. Mandurorejo Kajen)",
    "jam_operasional": "Senin – Kamis: 08.00 – 13.00 WIB | Jumat: 08.00 – 11.00 WIB | Sabtu: 08.00 – 12.00 WIB",
    "waktu_penyelesaian": "1 Hari Kerja (jika berkas leasing dan cek fisik telah lengkap)",
    "script_operator": "Baik Bapak/Ibu, untuk mengurus STNK yang hilang, langkah pertama buatlah Surat Kehilangan di Polsek terdekat membawa KTP dan fotokopi BPKB. Setelah itu bawa kendaraan bermotor beserta BPKB asli (atau surat leasing jika kredit) ke Samsat Kajen untuk cek fisik kendaraan. Biaya resmi penerbitan STNK baru adalah Rp 100.000 untuk motor dan Rp 200.000 untuk mobil.",
    "kontak_penting": null,
    "display_order": 4,
    "is_active": true
  },
  {
    "slug": "bpkb-hilang",
    "kategori": "SAMSAT_STNK_BPKB",
    "kategori_label": "Samsat, STNK & BPKB",
    "icon": "📘",
    "judul": "Penerbitan BPKB Duplikat (BPKB Hilang / Terbakar / Rusak)",
    "subjudul": "Prosedur resmi penerbitan buku BPKB pengganti melalui Ditlantas / Satlantas",
    "tags": [
      "bpkb hilang",
      "duplikat bpkb",
      "buku bpkb",
      "iklan koran",
      "surat blokir bpkb",
      "samsat"
    ],
    "persyaratan": [
      "Surat Keterangan Laporan Kehilangan BPKB dari SPKT Polres",
      "KTP Asli pemilik yang sah + fotokopi",
      "STNK Asli yang masih berlaku + fotokopi",
      "Hasil Cek Fisik Kendaraan yang telah dilegalisir Satlantas",
      "Surat Keterangan tidak dalam jaminan / sengketa dari Bank/Leasing (Surat Keterangan Fidusia)",
      "Bukti penayangan iklan kehilangan di 2 media massa / surat kabar harian resmi",
      "Surat Berita Acara Pemeriksaan (BAP) interogasi singkat dari Satreskrim"
    ],
    "prosedur": [
      "Membuat laporan kehilangan BPKB di SPKT Polres Pekalongan",
      "Pemeriksaan BAP singkat di Unit Tipidter Satreskrim untuk memastikan tidak ada sengketa pidana",
      "Memasang pengumuman kehilangan di 2 surat kabar lokal/nasional",
      "Membawa kendaraan untuk cek fisik di Samsat/Satlantas",
      "Mendaftar di Loket Pelayanan BPKB Ditlantas/Satlantas",
      "Masa tunggu kliring blokir resmi (14 – 30 hari kerja untuk memastikan tidak ada pihak lain yang mengklaim)",
      "Penerbitan Buku BPKB Baru"
    ],
    "biaya_pnbp": "Biaya PNBP BPKB Duplikat Roda 2: Rp 225.000 | Roda 4: Rp 375.000",
    "lokasi_pelayanan": "Seksi BPKB Satlantas Polres Pekalongan / Ditlantas Polda Jawa Tengah",
    "jam_operasional": "Senin – Jumat: 08.00 – 14.00 WIB",
    "waktu_penyelesaian": "± 14 – 30 Hari Kerja (sesuai SOP kliring sanggahan media massa)",
    "script_operator": "Untuk BPKB yang hilang, pengurusannya memerlukan BAP dari Satreskrim dan bukti pemasangan iklan kehilangan di media cetak selama masa tenggang pengumuman. Berkas yang disiapkan: KTP pemilik, STNK asli, cek fisik kendaraan, dan surat keterangan bebas sengketa. Biaya resmi PNBP BPKB adalah Rp 225.000 untuk motor dan Rp 375.000 untuk mobil.",
    "kontak_penting": null,
    "display_order": 5,
    "is_active": true
  },
  {
    "slug": "skck-baru",
    "kategori": "INTELKAM_SKCK",
    "kategori_label": "SKCK & Pelayanan Intelkam",
    "icon": "🛡️",
    "judul": "Pembuatan SKCK Baru (Surat Keterangan Catatan Kepolisian)",
    "subjudul": "Syarat penerbitan SKCK untuk melamar pekerjaan BUMN, Swasta, CPNS, dan Kuliah",
    "tags": [
      "skck",
      "bikin skck",
      "sidik jari",
      "rumus jari",
      "intelkam",
      "cpns",
      "bumn",
      "kerja"
    ],
    "persyaratan": [
      "Fotokopi e-KTP (1 lembar) atau Surat Keterangan KTP sementara",
      "Fotokopi Kartu Keluarga (KK) 1 lembar",
      "Fotokopi Akta Kelahiran / Surat Kenal Lahir / Ijazah Terakhir",
      "Pas foto berwarna ukuran 4x6 latar belakang MERAH (6 lembar, pakaian rapi berkerah)",
      "Kartu Rumus Sidik Jari dari Unit Inafis Satreskrim (bisa dibuat langsung di Polres)",
      "Bukti kepesertaan aktif BPJS Kesehatan / JKN (wajib terlampir)",
      "Mengisi formulir daftar riwayat hidup di loket Intelkam"
    ],
    "prosedur": [
      "Melakukan pengambilan sidik jari di loket Inafis Satreskrim (jika belum punya kartu sidik jari)",
      "Mengisi formulir pendaftaran fisik atau mendaftar online via https://skck.polri.go.id",
      "Menyerahkan berkas persyaratan di Loket Pelayanan SKCK Polres Pekalongan",
      "Pengecekan rekam jejak kriminalitas di database kepolisian",
      "Pembayaran biaya PNBP resmi sebesar Rp 30.000 di loket pembayaran",
      "Penerbitan dan legalisir SKCK"
    ],
    "biaya_pnbp": "Rp 30.000 (Tarif Resmi Nasional seluruh Indonesia sesuai PP No. 76 Tahun 2020)",
    "lokasi_pelayanan": "Gedung Pelayanan Terpadu Intelkam Polres Pekalongan (Kajen) & Polsek Jajaran (khusus melamar swasta)",
    "jam_operasional": "Senin – Kamis: 08.00 – 14.00 WIB | Jumat: 08.00 – 11.30 WIB",
    "waktu_penyelesaian": "± 10 – 20 Menit (apabila kartu sidik jari sudah ada)",
    "script_operator": "Selamat pagi/siang Bapak/Ibu. Untuk pembuatan SKCK baru, persyaratannya: fotokopi KTP, fotokopi KK, fotokopi Akta Lahir/Ijazah, pas foto 4x6 latar merah 6 lembar, kartu sidik jari, dan bukti aktif BPJS Kesehatan. Biaya resmi PNBP seluruh Indonesia adalah Rp 30.000. Pelayanan buka setiap hari kerja di Gedung Intelkam Polres Pekalongan mulai jam 08.00 WIB.",
    "kontak_penting": null,
    "display_order": 6,
    "is_active": true
  },
  {
    "slug": "izin-keramaian",
    "kategori": "INTELKAM_SKCK",
    "kategori_label": "SKCK & Pelayanan Intelkam",
    "icon": "🎪",
    "judul": "Surat Izin Keramaian (Hajatan, Pernikahan, Musik, & Panggung Hiburan)",
    "subjudul": "SOP pengajuan izin kegiatan kemasyarakatan untuk menjaga keamanan lingkungan",
    "tags": [
      "izin keramaian",
      "hajatan",
      "dangdut",
      "konser",
      "hiburan",
      "izin polsek",
      "izin polres"
    ],
    "persyaratan": [
      "Surat permohonan tertulis dari ketua panitia / tuan rumah hajat",
      "Surat Rekomendasi dari Kepala Desa / Lurah setempat",
      "Surat Rekomendasi dari Camat setempat",
      "Fotokopi KTP penanggung jawab kegiatan / pemohon",
      "Pernyataan kesanggupan menjaga keamanan dan ketertiban bermaterai Rp 10.000",
      "Denah lokasi kegiatan dan estimasi jumlah massa pengunjung"
    ],
    "prosedur": [
      "Pemohon meminta surat pengantar dari RT/RW dan Kepala Desa",
      "Meminta surat rekomendasi di Kantor Kecamatan",
      "Menyerahkan berkas ke Unit Intelkam Polsek setempat (minimal H-7 sebelum hari H)",
      "Jika kegiatan berskala besar (mendatangkan artis/massa > 500 orang), diteruskan ke Satintelkam Polres Pekalongan",
      "Pihak kepolisian melakukan asesmen risiko dan menerbitkan Surat Izin Keramaian resmi"
    ],
    "biaya_pnbp": "GRATIS / Rp 0 (Tidak dipungut biaya retribusi apapun)",
    "lokasi_pelayanan": "Unit Intelkam Polsek setempat (skala kecil/hajatan warga) atau Satintelkam Polres (skala besar/konser)",
    "jam_operasional": "Senin – Jumat: 08.00 – 15.00 WIB",
    "waktu_penyelesaian": "1 – 3 Hari Kerja setelah berkas verifikasi lengkap",
    "script_operator": "Untuk pengajuan Izin Keramaian hajatan warga, silakan mengajukan permohonan ke Polsek setempat paling lambat 7 hari sebelum acara dengan membawa surat rekomendasi Kepala Desa, rekomendasi Kecamatan, fotokopi KTP, dan surat pernyataan menjaga ketertiban. Pengurusan izin keramaian ini 100% GRATIS dan tidak dipungut biaya apapun.",
    "kontak_penting": null,
    "display_order": 7,
    "is_active": true
  },
  {
    "slug": "lapor-penipuan-online",
    "kategori": "RESKRIM_CYBER",
    "kategori_label": "Reskrim & Penipuan Siber",
    "icon": "💳",
    "judul": "Laporan Penipuan Transaksi Online / Rekening Bank Dibobol",
    "subjudul": "Panduan dokumen bukti dan pemblokiran rekening penipu ke bank & kepolisian",
    "tags": [
      "penipuan online",
      "rekening penipu",
      "blokir rekening",
      "transfer uang",
      "belanja online",
      "phishing",
      "reskrim"
    ],
    "persyaratan": [
      "e-KTP Asli korban pelapor",
      "Bukti mutasi rekening / struk transfer asli ke rekening terduga penipu",
      "Tangkapan layar (screenshot) percakapan WhatsApp / SMS / media sosial dengan pelaku",
      "Tangkapan layar akun media sosial, nomor telepon, atau tautan (link) situs penipu",
      "Surat Kronologi Kejadian Singkat yang ditulis secara runut waktu"
    ],
    "prosedur": [
      "Segera hubungi Call Center Bank Anda untuk permintaan \"Hold / Blokir Sementara\" rekening tujuan",
      "Datang ke SPKT Polres Pekalongan membawa seluruh berkas bukti fisik (telah diprint)",
      "Petugas SPKT akan menerbitkan Laporan Polisi (LP) atau Surat Tanda Penerimaan Laporan (STPL)",
      "Penyidik Satreskrim Unit Tipidter melakukan interogasi awal dan analisis data digital forensik",
      "Penyidik menerbitkan Surat Permohonan Pemblokiran Rekening Bank Resmi kepada pihak Bank terkait"
    ],
    "biaya_pnbp": "GRATIS / Rp 0 (Layanan pengaduan pidana di kepolisian tidak dipungut biaya)",
    "lokasi_pelayanan": "Sentra Pelayanan Kepolisian Terpadu (SPKT) & Satreskrim Polres Pekalongan",
    "jam_operasional": "Siaga 24 Jam Penuh (7 Hari Seminggu)",
    "waktu_penyelesaian": "Penerbitan STPL ± 30 Menit, proses blokir bank tergantung koordinasi compliance bank",
    "script_operator": "Bapak/Ibu, jika mengalami penipuan transaksi online, langkah pertama segera telepon call center bank Anda untuk meminta penahanan dana ke nomor rekening penipu. Selanjutnya, cetak bukti transfer, tangkapan layar chat WhatsApp dengan pelaku, dan bawa e-KTP ke ruang SPKT Polres Pekalongan yang siaga 24 jam. Layanan laporan ini GRATIS tanpa biaya.",
    "kontak_penting": null,
    "display_order": 8,
    "is_active": true
  },
  {
    "slug": "lapor-curanmor",
    "kategori": "RESKRIM_CYBER",
    "kategori_label": "Reskrim & Penipuan Siber",
    "icon": "🏍️",
    "judul": "Laporan Tindak Pidana Pencurian Kendaraan Bermotor (Curanmor)",
    "subjudul": "SOP respon cepat pengejaran dan penanganan olah TKP pencurian sepeda motor/mobil",
    "tags": [
      "curanmor",
      "motor hilang dicuri",
      "mobil hilang",
      "begal",
      "maling motor",
      "olah tkp",
      "kriminal"
    ],
    "persyaratan": [
      "KTP Asli pemilik / pelapor",
      "STNK asli kendaraan yang dicuri (jika tidak ikut terbawa pelaku)",
      "BPKB asli kendaraan (atau surat leasing resmi jika masih kredit)",
      "Kunci kontak cadangan kendaraan (jika ada)",
      "Rekaman CCTV di sekitar lokasi kejadian (jika tersedia)"
    ],
    "prosedur": [
      "Operator 110 langsung mendisposisikan regu Resmob & Patroli Presisi untuk penyekatan jalur",
      "Petugas SPKT & Tim Inafis meluncur ke TKP untuk melakukan Olah Tempat Kejadian Perkara",
      "Pelapor diambil keterangan BAP di kantor kepolisian terdekat",
      "Penerbitan Laporan Polisi (LP) resmi sebagai dasar pencarian dan klaim asuransi kendaraan"
    ],
    "biaya_pnbp": "GRATIS / Rp 0",
    "lokasi_pelayanan": "SPKT Polres Pekalongan / Polsek Terdekat dari TKP",
    "jam_operasional": "Layanan Darurat Siaga 24 Jam Penuh",
    "waktu_penyelesaian": "Respon Cepat Petugas Meluncur < 10 Menit, Penerbitan LP ± 45 Menit",
    "script_operator": "Mohon tetap tenang Bapak/Ibu. Petugas kepolisian terdekat sedang kami instruksikan untuk melakukan penyekatan rute. Tolong amankan lokasi kejadian dan jangan merusak jejak di sekitar TKP. Siapkan KTP, STNK, dan BPKB kendaraan. Anggota kami segera tiba di lokasi Anda.",
    "kontak_penting": null,
    "display_order": 9,
    "is_active": true
  },
  {
    "slug": "surat-kehilangan-dokumen",
    "kategori": "SPKT_KEHILANGAN",
    "kategori_label": "SPKT & Surat Kehilangan",
    "icon": "📝",
    "judul": "Surat Tanda Penerimaan Laporan Kehilangan (SKTLK) Barang & Dokumen",
    "subjudul": "Penerbitan surat keterangan kehilangan KTP, Ijazah, Buku Tabungan, ATM, dan Akta Lahir",
    "tags": [
      "kehilangan",
      "sktlk",
      "ktp hilang",
      "ijazah hilang",
      "buku tabungan hilang",
      "kartu atm",
      "spkt"
    ],
    "persyaratan": [
      "e-KTP Asli pelapor (atau Surat Keterangan Domisili jika KTP yang hilang)",
      "Untuk ATM / Buku Tabungan: Surat Pengantar dari Bank penerbit atau fotokopi buku tabungan",
      "Untuk Ijazah: Surat Pengantar dari Sekolah/Kampus yang mengeluarkan ijazah + fotokopi ijazah",
      "Untuk Akta Lahir / Kartu Keluarga: Surat Pengantar dari RT/RW atau Kelurahan",
      "Untuk Sertifikat Tanah: Surat Pengantar BPN dan bukti iklan koran"
    ],
    "prosedur": [
      "Mengambil nomor antrean di ruang Sentra Pelayanan Kepolisian Terpadu (SPKT)",
      "Menjelaskan kronologi waktu dan tempat hilangnya barang/dokumen kepada petugas piket",
      "Pencatatan dan verifikasi data identitas di sistem SPKT",
      "Penandatanganan dan pencetakan lembar resmi SKTLK yang telah dilegalisir stempel dinas"
    ],
    "biaya_pnbp": "GRATIS / Rp 0 (Tidak ada biaya apapun untuk pembuatan surat kehilangan)",
    "lokasi_pelayanan": "SPKT Polres Pekalongan (Kajen) & Seluruh Ruang SPKT Polsek se-Kabupaten Pekalongan",
    "jam_operasional": "Siaga 24 Jam Penuh (Non-Stop)",
    "waktu_penyelesaian": "± 5 – 10 Menit Langsung Jadi",
    "script_operator": "Untuk pembuatan Surat Keterangan Kehilangan (SKTLK), silakan datang ke Polsek terdekat atau Polres Pekalongan dengan membawa KTP serta surat pengantar/fotokopi dokumen yang hilang (misal pengantar bank untuk ATM hilang atau pengantar sekolah untuk ijazah hilang). Pelayanan di SPKT buka 24 jam dan 100% GRATIS.",
    "kontak_penting": null,
    "display_order": 10,
    "is_active": true
  },
  {
    "slug": "sop-etika-telepon",
    "kategori": "SOP_OPERATOR_110",
    "kategori_label": "SOP Komunikasi Operator 110",
    "icon": "🎧",
    "judul": "Standar Greeting & Wawancara 5W1H Operator 110",
    "subjudul": "Panduan tata cara menyapa, menggali informasi krusial, dan menenangkan warga panik",
    "tags": [
      "sop operator",
      "etika telepon",
      "5w1h",
      "greeting",
      "panik",
      "call center",
      "presisi"
    ],
    "persyaratan": [
      "Gunakan headset dengan mikrofon yang jernih dan bebas suara bising latar belakang",
      "Sikap ramah, intonasi tenang, percaya diri, dan tidak memotong pembicaraan warga",
      "Siapkan form CAD SIMAPRES di layar untuk mencatat data penelepon"
    ],
    "prosedur": [
      "Sapaan Baku (Greeting): \"Layanan Polisi 110 Polres Pekalongan, dengan [Nama Petugas], ada yang bisa kami bantu?\"",
      "Pertanyaan Kunci 1: \"Di mana posisi atau lokasi kejadian tepatnya saat ini, Bapak/Ibu?\" (Patokan jalan/gedung)",
      "Pertanyaan Kunci 2: \"Apa peristiwa yang sedang terjadi dan apakah ada korban terluka?\"",
      "Pertanyaan Kunci 3: \"Berapa nomor telepon yang dapat dihubungi oleh petugas patroli kami di lapangan?\"",
      "Tindakan Menenangkan: \"Baik Bapak/Ibu, mohon tetap tenang dan amankan diri Anda. Laporan sudah kami catat dan petugas patroli terdekat segera meluncur.\"",
      "Penutup: \"Terima kasih telah menghubungi 110 Polres Pekalongan. Selamat bertugas/beristirahat.\""
    ],
    "biaya_pnbp": "GRATIS / Rp 0 (Panggilan 110 Bebas Pulsa dari semua operator seluler)",
    "lokasi_pelayanan": "Ruang Command Center / Operator CAD 110 Polres Pekalongan",
    "jam_operasional": "Siaga 24 Jam Non-Stop",
    "waktu_penyelesaian": "Rata-rata Durasi Telepon Ideal < 2 Menit (Average Handling Time)",
    "script_operator": "Layanan Polisi 110 Polres Pekalongan, dengan petugas piket, ada yang bisa kami bantu?... Mohon tenang Bapak/Ibu, sebutkan lokasi kejadian dan patokan terdekat, petugas kami saat ini segera meluncur ke lokasi.",
    "kontak_penting": null,
    "display_order": 11,
    "is_active": true
  },
  {
    "slug": "sop-prank-call",
    "kategori": "SOP_OPERATOR_110",
    "kategori_label": "SOP Komunikasi Operator 110",
    "icon": "📵",
    "judul": "Penanganan Panggilan Iseng / Prank Call / Telepon Bisu",
    "subjudul": "Prosedur SOP memperingatkan penelepon tidak bertanggung jawab sesuai UU ITE",
    "tags": [
      "prank call",
      "telepon iseng",
      "panggilan palsu",
      "bisu",
      "uu ite",
      "peringatan"
    ],
    "persyaratan": [
      "Deteksi nomor Caller ID yang tertera di sistem telephony",
      "Rekaman suara otomatis tersimpan di log call recorder"
    ],
    "prosedur": [
      "Jika penelepon diam: ulangi sapaan resmi sebanyak 3 kali dengan jeda 5 detik",
      "Jika penelepon terbukti bercanda / tertawa / menghina: berikan teguran tegas terukur sesuai SOP",
      "Sampaikan dasar hukum Pasal 220 KUHP (Laporan Palsu) dan Pasal 38 UU Telekomunikasi No. 36 Tahun 1999",
      "Tandai panggilan di sistem sebagai PRANK CALL untuk blacklist sementara jika berulang > 3 kali"
    ],
    "biaya_pnbp": "Sanksi Pidana Laporan Palsu: Penjara hingga 1 tahun 4 bulan (Pasal 220 KUHP)",
    "lokasi_pelayanan": "Sistem Telephony 110 Polri",
    "jam_operasional": "24 Jam",
    "waktu_penyelesaian": "< 1 Menit",
    "script_operator": "Peringatan resmi: Saluran telepon 110 adalah saluran darurat kepolisian yang direkam dan nomor Anda telah teridentifikasi di sistem. Dilarang melakukan panggilan palsu atau main-main. Penyalahgunaan saluran darurat dapat dikenakan sanksi pidana Pasal 220 KUHP dan pemblokiran nomor oleh operator seluler.",
    "kontak_penting": null,
    "display_order": 12,
    "is_active": true
  }
];

export async function seedKnowledgeFaqs() {
  console.log('🌱 Menjalankan Seeder Master Buku Pintar SOP & Dynamic FAQ (SIMAPRES 110)...');

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS master_knowledge_faqs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      slug VARCHAR(100) UNIQUE NOT NULL,
      kategori VARCHAR(50) NOT NULL,
      kategori_label VARCHAR(100) NOT NULL,
      judul VARCHAR(200) NOT NULL,
      subjudul VARCHAR(255) NOT NULL,
      tags TEXT NOT NULL,
      persyaratan TEXT NOT NULL,
      prosedur TEXT NOT NULL,
      biaya_pnbp VARCHAR(255) NOT NULL,
      lokasi_pelayanan TEXT NOT NULL,
      jam_operasional VARCHAR(200) NOT NULL,
      waktu_penyelesaian VARCHAR(100) NOT NULL,
      script_operator TEXT NOT NULL,
      kontak_penting VARCHAR(255),
      is_active BOOLEAN DEFAULT TRUE,
      display_order INT DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_faq_kategori (kategori),
      INDEX idx_faq_active (is_active)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  let count = 0;
  for (let i = 0; i < SEED_FAQS_DATA.length; i++) {
    const it = SEED_FAQS_DATA[i];
    await (prisma as any).masterKnowledgeFaq.upsert({
      where: { slug: it.slug },
      update: {
        kategori: it.kategori,
        kategori_label: it.kategori_label,
        icon: it.icon,
        judul: it.judul,
        subjudul: it.subjudul,
        tags: JSON.stringify(it.tags),
        persyaratan: JSON.stringify(it.persyaratan),
        prosedur: JSON.stringify(it.prosedur),
        biaya_pnbp: it.biaya_pnbp,
        lokasi_pelayanan: it.lokasi_pelayanan,
        jam_operasional: it.jam_operasional,
        waktu_penyelesaian: it.waktu_penyelesaian,
        script_operator: it.script_operator,
        kontak_penting: it.kontak_penting || null,
        display_order: it.display_order || (i + 1),
        is_active: it.is_active !== undefined ? it.is_active : true,
      },
      create: {
        slug: it.slug,
        kategori: it.kategori,
        kategori_label: it.kategori_label,
        icon: it.icon,
        judul: it.judul,
        subjudul: it.subjudul,
        tags: JSON.stringify(it.tags),
        persyaratan: JSON.stringify(it.persyaratan),
        prosedur: JSON.stringify(it.prosedur),
        biaya_pnbp: it.biaya_pnbp,
        lokasi_pelayanan: it.lokasi_pelayanan,
        jam_operasional: it.jam_operasional,
        waktu_penyelesaian: it.waktu_penyelesaian,
        script_operator: it.script_operator,
        kontak_penting: it.kontak_penting || null,
        display_order: it.display_order || (i + 1),
        is_active: it.is_active !== undefined ? it.is_active : true,
      },
    });
    count++;
  }

  console.log(`✅ Berhasil meng-update/seed ${count} Master Knowledge FAQ ke database!`);
}

if (process.argv[1]?.includes('seed_knowledge_faqs')) {
  seedKnowledgeFaqs()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error('❌ Gagal seed:', e);
      process.exit(1);
    });
}
