import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SUBCATEGORIES_DATA = [
  // 1. SAT LANTAS (LAKALANTAS)
  {
    unit_key: 'lantas',
    category_key: 'LAKALANTAS',
    nama_kasus: 'Kecelakaan lalu lintas dengan korban meninggal dunia (MD)',
    default_urgensi: 'DARURAT',
    deskripsi_sop: 'Penanganan pertama laka maut, olah TKP TAA, amankan pengemudi & barang bukti ranmor, evakuasi jenazah ke RSUD.',
    display_order: 1,
  },
  {
    unit_key: 'lantas',
    category_key: 'LAKALANTAS',
    nama_kasus: 'Kecelakaan lalu lintas dengan korban luka berat (LB)',
    default_urgensi: 'DARURAT',
    deskripsi_sop: 'Evakuasi medis cepat korban kritis, amankan jalur lantas, olah TKP, koordinasi Jasa Raharja & IGD.',
    display_order: 2,
  },
  {
    unit_key: 'lantas',
    category_key: 'LAKALANTAS',
    nama_kasus: 'Kecelakaan lalu lintas dengan kerugian materiil (luka ringan/tanpa korban)',
    default_urgensi: 'SEDANG',
    deskripsi_sop: 'Tepikan ranmor dari badan jalan agar tidak macet, mediasi para pihak atau proses tilang/BAP laka ringan.',
    display_order: 3,
  },
  {
    unit_key: 'lantas',
    category_key: 'LAKALANTAS',
    nama_kasus: 'Kasus kecelakaan tabrak lari',
    default_urgensi: 'DARURAT',
    deskripsi_sop: 'Cek CCTV ETLE/jalur pelarian, kumpulkan keterangan saksi, koordinasi pos sekat/unit patroli pengejaran.',
    display_order: 4,
  },
  {
    unit_key: 'lantas',
    category_key: 'LAKALANTAS',
    nama_kasus: 'Penindakan pelanggaran balap liar',
    default_urgensi: 'DARURAT',
    deskripsi_sop: 'Penyekatan rute balap liar, penindakan tegas, razia ranmor tanpa surat & sita unit ranmor modifikasi balap.',
    display_order: 5,
  },
  {
    unit_key: 'lantas',
    category_key: 'LAKALANTAS',
    nama_kasus: 'Pelanggaran penggunaan knalpot tidak standar (brong)',
    default_urgensi: 'SEDANG',
    deskripsi_sop: 'Penindakan tilang manual/ETLE, penyitaan knalpot tidak standar, penahanan ranmor hingga knalpot diganti standar.',
    display_order: 6,
  },
  {
    unit_key: 'lantas',
    category_key: 'LAKALANTAS',
    nama_kasus: 'Pelanggaran marka jalan dan rambu lalu lintas yang membahayakan',
    default_urgensi: 'NORMAL',
    deskripsi_sop: 'Peneguran / penindakan pelanggaran lawan arah, terobos traffic light, putar balik liar.',
    display_order: 7,
  },
  {
    unit_key: 'lantas',
    category_key: 'LAKALANTAS',
    nama_kasus: 'Penggunaan SIM/STNK palsu atau kendaraan tanpa TNKB',
    default_urgensi: 'SEDANG',
    deskripsi_sop: 'Pemeriksaan keabsahan dokumen E-Samsat/Korlantas, pengamanan ranmor bodong, koordinasi Reskrim jika ada unsur pidana.',
    display_order: 8,
  },
  {
    unit_key: 'lantas',
    category_key: 'LAKALANTAS',
    nama_kasus: 'Kendaraan Over Dimension Over Load (ODOL)',
    default_urgensi: 'SEDANG',
    deskripsi_sop: 'Pemeriksaan dimensi muatan truk, koordinasi Dishub (Jembatan Timbang), penindakan tilang.',
    display_order: 9,
  },
  {
    unit_key: 'lantas',
    category_key: 'LAKALANTAS',
    nama_kasus: 'Kemacetan lalu lintas parah / penumpukan arus jalan raya',
    default_urgensi: 'SEDANG',
    deskripsi_sop: 'Pengaturan arus manual, pengalihan rute alternatif, evakuasi ranmor mogok/trouble di jalur utama.',
    display_order: 10,
  },

  // 2. SAT RESKRIM (KRIMINALITAS)
  {
    unit_key: 'reskrim',
    category_key: 'KRIMINALITAS',
    nama_kasus: 'Tindak pidana pembunuhan dan penemuan mayat mencurigakan',
    default_urgensi: 'DARURAT',
    deskripsi_sop: 'Pasang Police Line, TPTKP bersama Inafis & Dokkes, visum et repertum, interogasi saksi kunci.',
    display_order: 1,
  },
  {
    unit_key: 'reskrim',
    category_key: 'KRIMINALITAS',
    nama_kasus: 'Pencurian dengan kekerasan (Curas / Begal)',
    default_urgensi: 'DARURAT',
    deskripsi_sop: 'Respon cepat tim Resmob/Jatanras, pengejaran pelaku bersajam/senpi, pertolongan pertama pada korban terluka.',
    display_order: 2,
  },
  {
    unit_key: 'reskrim',
    category_key: 'KRIMINALITAS',
    nama_kasus: 'Pencurian dengan pemberatan (Curat)',
    default_urgensi: 'SEDANG',
    deskripsi_sop: 'Identifikasi sidik jari laten oleh Inafis di TKP pembobolan rumah/toko, inventarisir kerugian materiil, cek CCTV.',
    display_order: 3,
  },
  {
    unit_key: 'reskrim',
    category_key: 'KRIMINALITAS',
    nama_kasus: 'Pencurian kendaraan bermotor (Curanmor)',
    default_urgensi: 'SEDANG',
    deskripsi_sop: 'Penerbitan Laporan Polisi, input data nomor rangka/mesin ke DPO Ranmor, penelusuran jaringan penadah.',
    display_order: 4,
  },
  {
    unit_key: 'reskrim',
    category_key: 'KRIMINALITAS',
    nama_kasus: 'Penganiayaan berat (Anirat) dan tindak kekerasan fisik',
    default_urgensi: 'DARURAT',
    deskripsi_sop: 'Amankan pelaku & barang bukti senjata tajam/tumpul, bawa korban ke RS untuk visum, BAP saksi.',
    display_order: 5,
  },
  {
    unit_key: 'reskrim',
    category_key: 'KRIMINALITAS',
    nama_kasus: 'Kekerasan Dalam Rumah Tangga (KDRT) fisik berat',
    default_urgensi: 'DARURAT',
    deskripsi_sop: 'Pendampingan Unit PPA (Perlindungan Perempuan dan Anak), visum medis, pengamanan terlapor dari korban.',
    display_order: 6,
  },
  {
    unit_key: 'reskrim',
    category_key: 'KRIMINALITAS',
    nama_kasus: 'Tindak pidana penipuan dan penggelapan berskala besar',
    default_urgensi: 'SEDANG',
    deskripsi_sop: 'Audit bukti transaksi transfer/rekening koran, klarifikasi terlapor, gelar perkara status penyidikan.',
    display_order: 7,
  },
  {
    unit_key: 'reskrim',
    category_key: 'KRIMINALITAS',
    nama_kasus: 'Tindak pidana korupsi dan penyalahgunaan wewenang',
    default_urgensi: 'SEDANG',
    deskripsi_sop: 'Penyelidikan Unit Tipidkor, verifikasi dokumen anggaran belanja negara/daerah, koordinasi BPKP.',
    display_order: 8,
  },
  {
    unit_key: 'reskrim',
    category_key: 'KRIMINALITAS',
    nama_kasus: 'Tindak pidana siber (penipuan online, pencemaran digital, akses ilegal)',
    default_urgensi: 'SEDANG',
    deskripsi_sop: 'Penyelidikan Unit Siber, digital forensik jejak IP/rekening bank penampung, koordinasi Kominfo & OJK.',
    display_order: 9,
  },
  {
    unit_key: 'reskrim',
    category_key: 'KRIMINALITAS',
    nama_kasus: 'Tindak pidana terhadap lingkungan hidup dan kehutanan',
    default_urgensi: 'SEDANG',
    deskripsi_sop: 'Pemeriksaan limbah B3/ilegal logging, koordinasi Dinas Lingkungan Hidup, penyegelan lokasi.',
    display_order: 10,
  },
  {
    unit_key: 'reskrim',
    category_key: 'KRIMINALITAS',
    nama_kasus: 'Pemerasan dan ancaman kekerasan fisik (premanisme pro justitia)',
    default_urgensi: 'DARURAT',
    deskripsi_sop: 'Operasi tangkap tangan (OTT) pemerasan, penyitaan barang bukti uang setoran/senjata, pemeriksaan saksi korban.',
    display_order: 11,
  },

  // 3. SAT INTELKAM (KAMTIBMAS / DETEKSI DINI)
  {
    unit_key: 'intel',
    category_key: 'KAMTIBMAS',
    nama_kasus: 'Potensi aksi terorisme dan jaringan radikalisme',
    default_urgensi: 'DARURAT',
    deskripsi_sop: 'Pengumpulan bahan keterangan tertutup (Pulbaket), koordinasi Densus 88 AT, pencegahan eskalasi ancaman.',
    display_order: 1,
  },
  {
    unit_key: 'intel',
    category_key: 'KAMTIBMAS',
    nama_kasus: 'Potensi konflik komunal berlatar belakang SARA',
    default_urgensi: 'DARURAT',
    deskripsi_sop: 'Early warning sistem, pendekatan tokoh agama/adat, pemetaan aktor provokator di medsos & lapangan.',
    display_order: 2,
  },
  {
    unit_key: 'intel',
    category_key: 'KAMTIBMAS',
    nama_kasus: 'Rencana aksi unjuk rasa berpotensi anarkis atau blokade fasilitas publik',
    default_urgensi: 'DARURAT',
    deskripsi_sop: 'Verifikasi Surat Pemberitahuan Unras, koordinasi korlap unras, penyusunan Renpam pengamanan objek vital.',
    display_order: 3,
  },
  {
    unit_key: 'intel',
    category_key: 'KAMTIBMAS',
    nama_kasus: 'Pengawasan dan peredaran senjata api non-organik dan bahan peledak komersial',
    default_urgensi: 'DARURAT',
    deskripsi_sop: 'Audit gudang handak tambang/proyek, pengecekan izin buku kepemilikan senpi khusus bela diri.',
    display_order: 4,
  },
  {
    unit_key: 'intel',
    category_key: 'KAMTIBMAS',
    nama_kasus: 'Keberadaan dan aktivitas organisasi kemasyarakatan tanpa legalitas',
    default_urgensi: 'SEDANG',
    deskripsi_sop: 'Pendataan legalitas SKT Kemenkumham/Kesbangpol, penggalangan pimpinan ormas agar patuh hukum.',
    display_order: 5,
  },
  {
    unit_key: 'intel',
    category_key: 'KAMTIBMAS',
    nama_kasus: 'Keberadaan orang asing mencurigakan yang berpotensi membahayakan keamanan',
    default_urgensi: 'SEDANG',
    deskripsi_sop: 'Pemeriksaan visa & paspor, koordinasi Tim PORA (Pengawasan Orang Asing) Imigrasi.',
    display_order: 6,
  },
  {
    unit_key: 'intel',
    category_key: 'PELAYANAN_PUBLIK',
    nama_kasus: 'Permohonan rekomendasi / Surat Izin Keramaian kegiatan publik',
    default_urgensi: 'NORMAL',
    deskripsi_sop: 'Verifikasi izin tempat, kesiapan medis/damkar, analisa AMDAL lalin dan kerawanan kamtibmas.',
    display_order: 7,
  },

  // 4. SAT BINMAS (PELAYANAN PUBLIK & PEMBINAAN MASYARAKAT)
  {
    unit_key: 'binmas',
    category_key: 'PELAYANAN_PUBLIK',
    nama_kasus: 'Perselisihan warga batas tanah/pekarangan (mediasi Bhabinkamtibmas)',
    default_urgensi: 'NORMAL',
    deskripsi_sop: 'Mediasi problem solving bersama Bhabinkamtibmas, Babinsa, dan RT/RW tanpa jalur peradilan.',
    display_order: 1,
  },
  {
    unit_key: 'binmas',
    category_key: 'PELAYANAN_PUBLIK',
    nama_kasus: 'Perselisihan utang-piutang perseorangan tanpa unsur pidana penipuan',
    default_urgensi: 'NORMAL',
    deskripsi_sop: 'Musyawarah mufakat di Kantor Kelurahan/Bhabinkamtibmas, pembuatan surat kesepakatan damai bermaterai.',
    display_order: 2,
  },
  {
    unit_key: 'binmas',
    category_key: 'KAMTIBMAS',
    nama_kasus: 'Kenakalan remaja awal (nongkrong tanpa tindak pidana, bolos sekolah)',
    default_urgensi: 'NORMAL',
    deskripsi_sop: 'Pembinaan persuasif di tempat, pemanggilan orang tua & guru BK sekolah untuk konseling edukatif.',
    display_order: 3,
  },
  {
    unit_key: 'binmas',
    category_key: 'KAMTIBMAS',
    nama_kasus: 'Cekcok rumah tangga ringan tanpa kekerasan fisik (problem solving)',
    default_urgensi: 'NORMAL',
    deskripsi_sop: 'Konseling keluarga oleh Bhabinkamtibmas bersama tokoh lingkungan untuk redam konflik domestik.',
    display_order: 4,
  },
  {
    unit_key: 'binmas',
    category_key: 'KAMTIBMAS',
    nama_kasus: 'Keluhan warga terkait kebisingan lingkungan tempat tinggal',
    default_urgensi: 'NORMAL',
    deskripsi_sop: 'Penyampaian imbauan kamtibmas persuasif kepada sumber kebisingan/hajatan warga.',
    display_order: 5,
  },
  {
    unit_key: 'binmas',
    category_key: 'KAMTIBMAS',
    nama_kasus: 'Penolakan warga terhadap kegiatan pembangunan/usaha di lingkungan',
    default_urgensi: 'SEDANG',
    deskripsi_sop: 'Fasilitasi audiensi warga terdampak dengan pihak pengembang dan perangkat desa/kelurahan.',
    display_order: 6,
  },

  // 5. SAT SAMAPTA (KAMTIBMAS & TIPIRING)
  {
    unit_key: 'sabhara',
    category_key: 'KAMTIBMAS',
    nama_kasus: 'Orang mabuk yang mengganggu ketertiban umum di ruang publik',
    default_urgensi: 'SEDANG',
    deskripsi_sop: 'Tindakan pengamanan non-agresif, bawa ke Mapolres/Polsek hingga sadar, pembinaan Tipiring.',
    display_order: 1,
  },
  {
    unit_key: 'sabhara',
    category_key: 'KAMTIBMAS',
    nama_kasus: 'Peredaran minuman keras ilegal tanpa izin (Tipiring)',
    default_urgensi: 'SEDANG',
    deskripsi_sop: 'Operasi cipta kondisi, penyitaan barang bukti miras oplosan/tanpa cukai, sidang Tipiring PN.',
    display_order: 2,
  },
  {
    unit_key: 'sabhara',
    category_key: 'KAMTIBMAS',
    nama_kasus: 'Praktik premanisme jalanan dan juru parkir liar non-kooperatif',
    default_urgensi: 'SEDANG',
    deskripsi_sop: 'Razia perintis presisi, pendataan sidik jari, penindakan hukum pembinaan berkoordinasi dengan Dishub/Dinsos.',
    display_order: 3,
  },
  {
    unit_key: 'sabhara',
    category_key: 'KAMTIBMAS',
    nama_kasus: 'Pelanggaran asusila di ruang publik terbuka',
    default_urgensi: 'SEDANG',
    deskripsi_sop: 'Pengamanan lokasi taman/fasum terbuka, pembinaan dan penyerahan kepada keluarga / Satpol PP.',
    display_order: 4,
  },
  {
    unit_key: 'sabhara',
    category_key: 'KAMTIBMAS',
    nama_kasus: 'Penanganan anak jalanan, pengemis, dan gelandangan yang meresahkan',
    default_urgensi: 'NORMAL',
    deskripsi_sop: 'Patroli humanis gabungan Satpol PP dan Dinas Sosial, penertiban ke panti rehabilitasi sosial.',
    display_order: 5,
  },
  {
    unit_key: 'sabhara',
    category_key: 'KAMTIBMAS',
    nama_kasus: 'Pengendalian massa keributan warga di ruang publik',
    default_urgensi: 'DARURAT',
    deskripsi_sop: 'Penyekatan TKP, pembubaran kerumunan tawuran, sterilisasi sajam, amankan aktor kerusuhan utama.',
    display_order: 6,
  },

  // 6. BENCANA ALAM & DARURAT MEDIS (BENCANA)
  {
    unit_key: 'sabhara',
    category_key: 'BENCANA',
    nama_kasus: 'Kebakaran pemukiman warga atau fasilitas umum',
    default_urgensi: 'DARURAT',
    deskripsi_sop: 'Buka jalur evakuasi mobil Damkar, pengamanan perimeter TKP dari penjarahan, evakuasi korban ke tenda darurat.',
    display_order: 1,
  },
  {
    unit_key: 'sabhara',
    category_key: 'BENCANA',
    nama_kasus: 'Bencana banjir dan evakuasi darurat warga',
    default_urgensi: 'DARURAT',
    deskripsi_sop: 'Pengerahan perahu karet SAR Samapta, evakuasi balita & lansia, pendirian dapur umum & posko pengungsian.',
    display_order: 2,
  },
  {
    unit_key: 'sabhara',
    category_key: 'BENCANA',
    nama_kasus: 'Tanah longsor atau pohon tumbang yang menghalangi jalan utama',
    default_urgensi: 'DARURAT',
    deskripsi_sop: 'Pembersihan material longsor/potong pohon bersama BPBD, pemasangan rambu bahaya, buka tutup arus lalin.',
    display_order: 3,
  },
  {
    unit_key: 'sabhara',
    category_key: 'BENCANA',
    nama_kasus: 'Bantuan darurat medis dan evakuasi korban bencana alam',
    default_urgensi: 'DARURAT',
    deskripsi_sop: 'Pertolongan pertama medis lapangan (First Aid Dokkes), mobilisasi ambulans menuju RS rujukan terdekat.',
    display_order: 4,
  },
];

async function main() {
  console.log('🚀 Seeding Master Incident Subcategories to TiDB Cloud...');

  // 1. Get Categories & Units
  const categories = await prisma.masterIncidentCategory.findMany();
  const catMap = new Map(categories.map((c) => [c.key, c.id]));

  const units = await prisma.masterOperationalUnit.findMany();
  const unitMap = new Map(units.map((u) => [u.key, u.id]));

  console.log('Categories found:', Array.from(catMap.keys()));
  console.log('Units found:', Array.from(unitMap.keys()));

  // 2. Clear existing subcategories if any to guarantee clean seeding
  await prisma.masterIncidentSubcategory.deleteMany({});
  console.log('Cleared old subcategories.');

  let inserted = 0;
  for (const item of SUBCATEGORIES_DATA) {
    const category_id = catMap.get(item.category_key);
    const unit_id = unitMap.get(item.unit_key);

    if (!category_id || !unit_id) {
      console.warn(`Skipping ${item.nama_kasus}: missing category ${item.category_key} or unit ${item.unit_key}`);
      continue;
    }

    await prisma.masterIncidentSubcategory.create({
      data: {
        category_id,
        category_key: item.category_key,
        unit_id,
        unit_key: item.unit_key,
        nama_kasus: item.nama_kasus,
        default_urgensi: item.default_urgensi,
        deskripsi_sop: item.deskripsi_sop,
        display_order: item.display_order,
        is_active: true,
      },
    });
    inserted++;
  }

  console.log(`✅ Successfully seeded ${inserted} Master Incident Subcategories to TiDB Cloud!`);

  // 3. Update Duties on MasterOperationalUnit to enrich Tupoksi list
  const dutiesUpdate = [
    {
      key: 'lantas',
      duties: '1. Kecelakaan Lantas (Meninggal Dunia, Luka Berat, Luka Ringan/Materiil)\n2. Tabrak Lari & Penyelidikan Ranmor\n3. Penindakan Balap Liar & Knalpot Brong\n4. Pelanggaran Rambu & Marka Jalan Berbahaya\n5. Penggunaan SIM/STNK Palsu & Ranmor Bodong\n6. Penertiban Kendaraan ODOL (Over Dimension Over Load)\n7. Urai Kemacetan & Pengaturan Arus Jalan Raya',
    },
    {
      key: 'reskrim',
      duties: '1. Pembunuhan & Penemuan Mayat Mencurigakan (Inafis)\n2. Pencurian dengan Kekerasan (Curas / Begal)\n3. Pencurian dengan Pemberatan (Curat)\n4. Pencurian Kendaraan Bermotor (Curanmor)\n5. Penganiayaan Berat (Anirat) & Kekerasan Fisik\n6. Kekerasan Dalam Rumah Tangga (KDRT Fisik Berat - PPA)\n7. Penipuan & Penggelapan Berskala Besar\n8. Tindak Pidana Korupsi (Tipidkor)\n9. Kejahatan Siber (Digital Forensik & Penipuan Online)\n10. Kejahatan Lingkungan Hidup & Kehutanan\n11. Pemerasan & Premanisme Pro Justitia',
    },
    {
      key: 'intel',
      duties: '1. Deteksi Dini Ancaman Terorisme & Jaringan Radikalisme\n2. Pemetaan & Redam Konflik Komunal / SARA\n3. Monitoring Rencana Unjuk Rasa / Aksi Anarkis\n4. Pengawasan Senjata Api Non-Organik & Bahan Peledak\n5. Pendataan & Pengawasan Ormas Ilegal\n6. Pengawasan Aktivitas Orang Asing (Tim PORA)\n7. Rekomendasi & Penerbitan Surat Izin Keramaian Publik',
    },
    {
      key: 'binmas',
      duties: '1. Mediasi Batas Tanah / Pekarangan Warga (Bhabinkamtibmas)\n2. Mediasi Utang-Piutang Ringan Non-Pidana\n3. Pembinaan Kenakalan Remaja Awal & Nongkrong Liar\n4. Problem Solving Cekcok Rumah Tangga Non-KDRT\n5. Penanganan Keluhan Kebisingan Lingkungan Warga\n6. Fasilitasi Dialog Penolakan Kegiatan Pembangunan/Usaha',
    },
    {
      key: 'sabhara',
      duties: '1. Penertiban Orang Mabuk & Gangguan Ketertiban Umum\n2. Razia Tipiring Minuman Keras Ilegal Tanpa Izin\n3. Penindakan Premanisme Jalanan & Juru Parkir Liar\n4. Penertiban Pelanggaran Asusila di Ruang Publik Terbuka\n5. Penanganan Pengemis, Gepeng & Anjal (bersama Dinsos/Satpol PP)\n6. Pengendalian Massa Keributan Warga & Dalmas Awal\n7. Evakuasi Darurat Bencana Alam, Kebakaran & Banjir (SAR Presisi)',
    },
  ];

  for (const d of dutiesUpdate) {
    await prisma.masterOperationalUnit.updateMany({
      where: { key: d.key },
      data: { duties: d.duties },
    });
  }
  console.log('✅ Successfully updated Duties on MasterOperationalUnit!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
