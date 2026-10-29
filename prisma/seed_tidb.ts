import { prisma } from '../src/infrastructure/db/prisma.client';
import bcrypt from 'bcryptjs';
import { SUBCATEGORIES_DATA } from './seed_subcategories';

async function seed() {
  console.log('🌱 Seeding Comprehensive Master Data & Locations to TiDB Cloud...');
  const defaultHash = await bcrypt.hash('polripresisi2026', 10);

  // 0. Ensure dynamic support tables exist
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS master_rejection_reasons (
      id INT AUTO_INCREMENT PRIMARY KEY,
      \`key\` VARCHAR(50) UNIQUE,
      label VARCHAR(150) NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      display_order INT DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS device_pairing_sessions (
      session_token VARCHAR(64) PRIMARY KEY,
      device_id VARCHAR(64),
      device_brand VARCHAR(100),
      nrp VARCHAR(20),
      unit_id VARCHAR(50),
      lat DECIMAL(10, 8),
      lng DECIMAL(11, 8),
      status VARCHAR(30) DEFAULT 'WAITING',
      scanned_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS master_vehicle_types (
      id INT AUTO_INCREMENT PRIMARY KEY,
      \`key\` VARCHAR(50) UNIQUE,
      label VARCHAR(150) NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      display_order INT DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS master_vehicle_statuses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      \`key\` VARCHAR(50) UNIQUE,
      label VARCHAR(150) NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      display_order INT DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 1. Master Roles
  const roles = [
    { key: 'SUPERADMIN', label: 'Super Administrator', description: 'Akses penuh administrasi master data, registrasi unit, manajemen hak akses & audit sistem.', display_order: 1 },
    { key: 'PAWAS', label: 'Perwira Pengawas (Pawas)', description: 'Pusat kendali komando, monitoring live map radar 110, disposisi taktis dan validasi laporan BAP.', display_order: 2 },
    { key: 'OPERATOR', label: 'Operator SPKT', description: 'Pelayanan Pengaduan 110, CAD Dispatch & Layanan Warga', display_order: 3 },
    { key: 'PERSONIL', label: 'Anggota', description: 'Penerimaan tugas lapangan, e-logbook kedinasan, update status TKP, dan telemetri GPS aktif.', display_order: 4 },
    { key: 'LOGISTIK', label: 'Biro Logistik & Keuangan (Bag Log / Si-Keu)', description: 'Audit konsumsi BBM armada patroli, verifikasi bukti pengeluaran SPJ DIPA Polri, dan tata kelola pagu anggaran bahan bakar.', display_order: 5 },
  ];
  for (const r of roles) {
    await prisma.masterRole.upsert({
      where: { key: r.key },
      update: { label: r.label, description: r.description, display_order: r.display_order, is_active: true },
      create: { ...r, is_active: true },
    });
  }
  console.log('✓ Master Roles seeded.');

  // 2. Master Station Hierarchy Levels
  const stationLevels = [
    { key: 'MABES', label: 'Markas Besar (Mabes)', level_order: 1 },
    { key: 'POLDA', label: 'Kepolisian Daerah (Polda)', level_order: 2 },
    { key: 'POLRES', label: 'Kepolisian Resor (Polres)', level_order: 3 },
    { key: 'POLSEK', label: 'Kepolisian Sektor (Polsek)', level_order: 4 },
    { key: 'POSPOL', label: 'Pos Polisi (Pospol)', level_order: 5 },
  ];
  for (const sl of stationLevels) {
    await (prisma as any).masterStationLevel.upsert({
      where: { key: sl.key },
      update: { label: sl.label, level_order: sl.level_order, is_active: true },
      create: { ...sl, is_active: true },
    });
  }
  console.log('✓ Master Station Levels seeded.');

  // 3. Master Urgency Levels
  const urgencies = [
    { key: 'DARURAT', label: 'Darurat', display_order: 1 },
    { key: 'SEDANG', label: 'Sedang', display_order: 2 },
    { key: 'NORMAL', label: 'Normal', display_order: 3 },
  ];
  for (const urg of urgencies) {
    await prisma.masterUrgencyLevel.upsert({
      where: { key: urg.key },
      update: { label: urg.label, display_order: urg.display_order, is_active: true },
      create: { ...urg, is_active: true },
    });
  }
  console.log('✓ Master Urgency Levels seeded.');

  // 4. Master Complaint Statuses (5 Siklus Hidup Kasus SIMAPRES 110)
  const statuses = [
    { key: 'MENUNGGU', label: 'Menunggu Tindakan', keterangan: 'Menunggu Penanganan & Validasi Pawas', display_order: 1 },
    { key: 'DITOLAK', label: 'Ditolak', keterangan: 'Ditolak / Tidak Valid oleh Pawas', display_order: 2 },
    { key: 'DIPROSES', label: 'Sedang Ditangani', keterangan: 'Sedang Ditangani Unit Siaga Lapangan', display_order: 3 },
    { key: 'MENUNGGU_PENGESAHAN', label: 'Menunggu Pengesahan', keterangan: 'Menunggu Pengesahan Pawas', display_order: 4 },
    { key: 'SELESAI', label: 'Selesai', keterangan: 'Selesai & Kondusif', display_order: 5 },
  ];
  for (const st of statuses) {
    await prisma.masterComplaintStatus.upsert({
      where: { key: st.key },
      update: {
        label: st.label,
        keterangan: st.keterangan,
        display_order: st.display_order,
        is_active: true,
      },
      create: { ...st, is_active: true },
    });
  }
  console.log('✓ Master Complaint Statuses seeded.');

  // 5. Master Dispatch Statuses (5 Status Taktis Penugasan Lapangan)
  const dispatchStatuses = [
    { key: 'DISPATCHED', label: 'Disposisi', keterangan: 'Personil Menerima Disposisi dari Pawas', display_order: 1 },
    { key: 'DEPARTED', label: 'Meluncur', keterangan: 'Petugas Meluncur ke TKP', display_order: 2 },
    { key: 'ARRIVED', label: 'Tiba di TKP', keterangan: 'Petugas Tiba di Lokasi / Olah TKP', display_order: 3 },
    { key: 'REPORT_SUBMITTED', label: 'BAP Terbit', keterangan: 'Tindakan Selesai & BAP Diterbitkan Petugas Lapangan', display_order: 4 },
    { key: 'COMPLETED', label: 'Selesai', keterangan: 'BAP Disahkan oleh Pawas & Kasus Ditutup', display_order: 5 },
  ];
  for (const ds of dispatchStatuses) {
    await prisma.masterDispatchStatus.upsert({
      where: { key: ds.key },
      update: {
        label: ds.label,
        keterangan: ds.keterangan,
        display_order: ds.display_order,
        is_active: true,
      },
      create: { ...ds, is_active: true },
    });
  }
  console.log('✓ Master Dispatch Statuses seeded.');

  // 6. Master Incident Categories
  const categories = [
    { key: 'KRIMINALITAS', label: 'Kriminalitas & 3C', display_order: 1 },
    { key: 'KAMTIBMAS', label: 'Kamtibmas & Tawuran', display_order: 2 },
    { key: 'LAKALANTAS', label: 'Laka & Kemacetan Lantas', display_order: 3 },
    { key: 'BENCANA', label: 'Darurat & Bencana Alam', display_order: 4 },
    { key: 'PELAYANAN_PUBLIK', label: 'Pelayanan Publik & Walk-in', display_order: 5 },
  ];
  for (const cat of categories) {
    await (prisma as any).masterIncidentCategory.upsert({
      where: { key: cat.key },
      update: { ...cat, is_active: true },
      create: { ...cat, is_active: true },
    });
  }
  console.log('✓ Master Incident Categories seeded.');

  // 7. Master Operational Units (5 SOP Units)
  const units = [
    {
      key: 'sabhara',
      unit_name: 'Satuan Samapta Presisi',
      short_name: 'Sat Samapta',
      duties: '1. Penertiban Orang Mabuk & Gangguan Ketertiban Umum\n2. Razia Tipiring Minuman Keras Ilegal Tanpa Izin\n3. Penindakan Premanisme Jalanan & Juru Parkir Liar\n4. Penertiban Pelanggaran Asusila di Ruang Publik Terbuka\n5. Penanganan Pengemis, Gepeng & Anjal (bersama Dinsos/Satpol PP)\n6. Pengendalian Massa Keributan Warga & Dalmas Awal\n7. Evakuasi Darurat Bencana Alam, Kebakaran & Banjir (SAR Presisi)',
      default_orders: 'Laksanakan patroli blue light di zona rawan, amankan perimeter dan koordinasi dengan posko.',
      display_order: 1,
    },
    {
      key: 'lantas',
      unit_name: 'Satuan Lalu Lintas',
      short_name: 'Sat Lantas',
      duties: '1. Kecelakaan Lantas (Meninggal Dunia, Luka Berat, Luka Ringan/Materiil)\n2. Tabrak Lari & Penyelidikan Ranmor\n3. Penindakan Balap Liar & Knalpot Brong\n4. Pelanggaran Rambu & Marka Jalan Berbahaya\n5. Penggunaan SIM/STNK Palsu & Ranmor Bodong\n6. Penertiban Kendaraan ODOL (Over Dimension Over Load)\n7. Urai Kemacetan & Pengaturan Arus Jalan Raya',
      default_orders: 'Urai kemacetan dan cegah lakalantas. Prioritaskan keselamatan korban laka dan rekayasa arus.',
      display_order: 2,
    },
    {
      key: 'reskrim',
      unit_name: 'Satuan Reserse Kriminal',
      short_name: 'Sat Reskrim',
      duties: '1. Pembunuhan & Penemuan Mayat Mencurigakan (Inafis)\n2. Pencurian dengan Kekerasan (Curas / Begal)\n3. Pencurian dengan Pemberatan (Curat)\n4. Pencurian Kendaraan Bermotor (Curanmor)\n5. Penganiayaan Berat (Anirat) & Kekerasan Fisik\n6. Kekerasan Dalam Rumah Tangga (KDRT Fisik Berat - PPA)\n7. Penipuan & Penggelapan Berskala Besar\n8. Tindak Pidana Korupsi (Tipidkor)\n9. Kejahatan Siber (Digital Forensik & Penipuan Online)\n10. Kejahatan Lingkungan Hidup & Kehutanan\n11. Pemerasan & Premanisme Pro Justitia',
      default_orders: 'Tindak tegas pelaku tindak pidana. Pasang police line, amankan rekaman CCTV dan kumpulkan saksi kunci.',
      display_order: 3,
    },
    {
      key: 'intel',
      unit_name: 'Satuan Intelijen Keamanan',
      short_name: 'Sat Intelkam',
      duties: '1. Deteksi Dini Ancaman Terorisme & Jaringan Radikalisme\n2. Pemetaan & Redam Konflik Komunal / SARA\n3. Monitoring Rencana Unjuk Rasa / Aksi Anarkis\n4. Pengawasan Senjata Api Non-Organik & Bahan Peledak\n5. Pendataan & Pengawasan Ormas Ilegal\n6. Pengawasan Aktivitas Orang Asing (Tim PORA)\n7. Rekomendasi & Penerbitan Surat Izin Keramaian Publik',
      default_orders: 'Monitoring perkembangan situasi, deteksi dini dan penggalangan kamtibmas.',
      display_order: 4,
    },
    {
      key: 'binmas',
      unit_name: 'Satuan Pembinaan Masyarakat',
      short_name: 'Sat Binmas',
      duties: '1. Mediasi Batas Tanah / Pekarangan Warga (Bhabinkamtibmas)\n2. Mediasi Utang-Piutang Ringan Non-Pidana\n3. Pembinaan Kenakalan Remaja Awal & Nongkrong Liar\n4. Problem Solving Cekcok Rumah Tangga Non-KDRT\n5. Penanganan Keluhan Kebisingan Lingkungan Warga\n6. Fasilitasi Dialog Penolakan Kegiatan Pembangunan/Usaha',
      default_orders: 'Edukasi dan rangkul masyarakat, selesaikan masalah sosial melalui problem solving Bhabinkamtibmas.',
      display_order: 5,
    },
  ];
  for (const u of units) {
    await prisma.masterOperationalUnit.upsert({
      where: { key: u.key },
      update: { ...u, is_active: true },
      create: { ...u, is_active: true },
    });
  }
  console.log('✓ Master Operational Units seeded.');

  // 8. Master Incident Subcategories (Rincian Mutlak SOP Satuan)
  const categoryMap = new Map<string, number>();
  const allCats = await prisma.masterIncidentCategory.findMany();
  for (const c of allCats) categoryMap.set(c.key, c.id);

  const unitMap = new Map<string, number>();
  const allUnits = await prisma.masterOperationalUnit.findMany();
  for (const u of allUnits) unitMap.set(u.key, u.id);

  let subcatCount = 0;
  for (const sub of SUBCATEGORIES_DATA) {
    const catId = categoryMap.get(sub.category_key);
    const uId = unitMap.get(sub.unit_key);
    if (!catId || !uId) continue;

    const existing = await (prisma as any).masterIncidentSubcategory.findFirst({
      where: {
        category_id: catId,
        unit_id: uId,
        nama_kasus: sub.nama_kasus,
      },
    });

    if (!existing) {
      await (prisma as any).masterIncidentSubcategory.create({
        data: {
          category_id: catId,
          category_key: sub.category_key,
          unit_id: uId,
          unit_key: sub.unit_key,
          nama_kasus: sub.nama_kasus,
          default_urgensi: sub.default_urgensi,
          deskripsi_sop: sub.deskripsi_sop,
          display_order: sub.display_order,
          is_active: true,
        },
      });
      subcatCount++;
    }
  }
  console.log(`✓ Master Incident Subcategories verified (${subcatCount} added).`);

  // 9. Master Field Activity Types
  const activityTypes = [
    { key: 'PATROLI', label: 'Patroli', display_order: 1 },
    { key: 'SAMBANG', label: 'Sambang', display_order: 2 },
    { key: 'TPTKP', label: 'TPTKP', display_order: 3 },
    { key: 'PENGAMANAN', label: 'Pengamanan', display_order: 4 },
  ];
  for (const act of activityTypes) {
    await (prisma as any).masterActivityType.upsert({
      where: { key: act.key },
      update: { ...act, is_active: true },
      create: { ...act, is_active: true },
    });
  }
  console.log('✓ Master Activity Types seeded.');

  // 10. Master Report Sources
  const sources = [
    { key: 'SOS', label: 'Tombol Panik Darurat (SOS)', display_order: 1 },
    { key: 'PORTAL_WARGA', label: 'Portal Pengaduan Warga Presisi', display_order: 2 },
    { key: 'CALL_110', label: 'Pusat Panggilan SPKT 110', display_order: 3 },
    { key: 'PERSONEL_LAPANGAN', label: 'Laporan Mandiri Personel Lapangan', display_order: 4 },
  ];
  for (const src of sources) {
    await (prisma as any).masterReportSource.upsert({
      where: { key: src.key },
      update: { ...src, is_active: true },
      create: { ...src, is_active: true },
    });
  }
  console.log('✓ Master Report Sources seeded.');

  // 11. Master Duty Statuses
  const dutyStatuses = [
    { key: 'DINAS_PATROLI', label: 'Dinas Patroli Tergelar', display_order: 1 },
    { key: 'PIKET_SPKT', label: 'Piket Siaga SPKT Mako', display_order: 2 },
    { key: 'CADANGAN', label: 'Cadangan Siaga Panggilan PLB', display_order: 3 },
    { key: 'LEPAS_DINAS', label: 'Lepas Dinas / Istirahat', display_order: 4 },
    { key: 'BKO', label: 'Penugasan BKO Kewilayahan', display_order: 5 },
  ];
  for (const ds of dutyStatuses) {
    await prisma.masterDutyStatus.upsert({
      where: { key: ds.key },
      update: { ...ds, is_active: true },
      create: { ...ds, is_active: true },
    });
  }
  console.log('✓ Master Duty Statuses seeded.');

  // 12. Master Ranks
  const ranks = [
    { key: 'BRIPDA', label: 'Bripda (Brigadir Polisi Dua)', display_order: 1 },
    { key: 'BRIPTU', label: 'Briptu (Brigadir Polisi Satu)', display_order: 2 },
    { key: 'BRIGADIR', label: 'Brigadir (Brigadir Polisi)', display_order: 3 },
    { key: 'BRIPKA', label: 'Bripka (Brigadir Polisi Kepala)', display_order: 4 },
    { key: 'AIPDA', label: 'Aipda (Ajun Inspektur Polisi Dua)', display_order: 5 },
    { key: 'AIPTU', label: 'Aiptu (Ajun Inspektur Polisi Satu)', display_order: 6 },
    { key: 'IPDA', label: 'Ipda (Inspektur Polisi Dua)', display_order: 7 },
    { key: 'IPTU', label: 'Iptu (Inspektur Polisi Satu)', display_order: 8 },
    { key: 'AKP', label: 'AKP (Ajun Komisaris Polisi)', display_order: 9 },
    { key: 'KOMPOL', label: 'Kompol (Komisaris Polisi)', display_order: 10 },
    { key: 'AKBP', label: 'AKBP (Ajun Komisaris Besar Polisi)', display_order: 11 },
    { key: 'KOMBES', label: 'Kombes Pol (Komisaris Besar Polisi)', display_order: 12 },
  ];
  for (const rk of ranks) {
    await prisma.masterRank.upsert({
      where: { key: rk.key },
      update: { ...rk, is_active: true },
      create: { ...rk, is_active: true },
    });
  }
  console.log('✓ Master Ranks seeded.');

  // 13. Master Validation Statuses
  const validationStatuses = [
    { key: 'BELUM_DIVALIDASI', label: 'Belum Divalidasi' },
    { key: 'VALID', label: 'Valid / Disetujui' },
    { key: 'FLAGGED_AUDIT', label: 'Perlu Audit / Anomali GPS' },
    { key: 'DITOLAK', label: 'Ditolak Pawas' },
  ];
  for (const vs of validationStatuses) {
    await (prisma as any).masterValidationStatus.upsert({
      where: { key: vs.key },
      update: { ...vs, is_active: true },
      create: { ...vs, is_active: true },
    });
  }
  console.log('✓ Master Validation Statuses seeded.');

  // 14. Master Hotspot Categories
  const hotspotCategories = [
    { key: 'TAWURAN', label: 'Rawan Tawuran Warga & Gesekan Kelompok', display_order: 1 },
    { key: 'PELAJAR', label: 'Rawan Tawuran Pelajar Ber-sajam', display_order: 2 },
    { key: 'BALAP_LIAR', label: 'Rawan Balap Liar & Gangguan Knalpot Brong', display_order: 3 },
    { key: 'TIGA_C', label: 'Rawan Curas, Curat & Begal Jalanan (3C)', display_order: 4 },
    { key: 'NARKOBA', label: 'Rawan Narkoba & Miras Oplosan', display_order: 5 },
    { key: 'KEMACETAN', label: 'Rawan Kemacetan Parah & Pasar Tumpah', display_order: 6 },
  ];
  for (const hc of hotspotCategories) {
    await prisma.masterHotspotCategory.upsert({
      where: { key: hc.key },
      update: { ...hc, is_active: true },
      create: { ...hc, is_active: true },
    });
  }
  console.log('✓ Master Hotspot Categories seeded.');

  // 15. Master Hotspot Danger Levels
  const dangerLevels = [
    { key: 'PENGAWASAN_PRIORITAS', label: 'Status: PENGAWASAN PRIORITAS (RAWAN)', display_order: 1 },
    { key: 'SIAGA_BLUE_LIGHT', label: 'Status: SIAGA PATROLI BLUE LIGHT', display_order: 2 },
    { key: 'DARURAT_110', label: 'Status: INSIDEN DARURAT AKTIF (SIAGA 110)', display_order: 3 },
    { key: 'PEMANTAUAN_RUTIN', label: 'Status: PEMANTAUAN RUTIN', display_order: 4 },
  ];
  for (const dl of dangerLevels) {
    await prisma.masterHotspotDangerLevel.upsert({
      where: { key: dl.key },
      update: { ...dl, is_active: true },
      create: { ...dl, is_active: true },
    });
  }
  console.log('✓ Master Hotspot Danger Levels seeded.');

  // 16. Master Rejection Reasons
  const rejectionReasons = [
    { key: 'FOTO_BURAM', label: 'Foto Bukti Tidak Jelas / Buram', display_order: 1 },
    { key: 'URAIAN_KURANG', label: 'Uraian Kegiatan Belum Lengkap', display_order: 2 },
    { key: 'LOKASI_SALAH', label: 'Lokasi GPS Tidak Sesuai', display_order: 3 },
    { key: 'DUPLIKAT', label: 'Laporan Terindikasi Duplikat', display_order: 4 },
    { key: 'NON_SOP', label: 'Tidak Memenuhi Standar Operasional (SOP)', display_order: 5 },
    { key: 'LAINNYA', label: 'Alasan Lainnya', display_order: 6 },
  ];
  for (const rr of rejectionReasons) {
    await prisma.$executeRawUnsafe(
      `INSERT INTO master_rejection_reasons (\`key\`, label, is_active, display_order)
       VALUES (?, ?, true, ?)
       ON DUPLICATE KEY UPDATE label = VALUES(label), display_order = VALUES(display_order), is_active = true`,
      rr.key,
      rr.label,
      rr.display_order
    );
  }
  console.log('✓ Master Rejection Reasons seeded.');

  // 17. Police Stations
  const defaultStations = [
    {
      station_code: 'POLRES-JAKSEL',
      station_name: 'Polres Metro Jakarta Selatan',
      station_level: 'POLRES',
      address: 'Jl. Wijaya II No. 42, Melawai, Kebayoran Baru, Jakarta Selatan',
      office_lat: -6.2415,
      office_lng: 106.8021,
      geofence_radius_meters: 1000,
    },
    {
      station_code: 'POLSEK-KBY-BARU',
      station_name: 'Polsek Metro Kebayoran Baru',
      station_level: 'POLSEK',
      address: 'Jl. Kyai Maja No. 3, Kebayoran Baru, Jakarta Selatan',
      office_lat: -6.2443,
      office_lng: 106.7985,
      geofence_radius_meters: 500,
    },
    {
      station_code: 'POLSEK-TEBET',
      station_name: 'Polsek Metro Tebet',
      station_level: 'POLSEK',
      address: 'Jl. Prof. DR. Soepomo No. 25, Tebet, Jakarta Selatan',
      office_lat: -6.2312,
      office_lng: 106.8285,
      geofence_radius_meters: 500,
    },
    {
      station_code: 'POSPOL-SENAYAN',
      station_name: 'Pos Polisi Bundaran Senayan',
      station_level: 'POSPOL',
      address: 'Jl. Jend. Sudirman, Senayan, Kebayoran Baru',
      office_lat: -6.2255,
      office_lng: 106.8012,
      geofence_radius_meters: 300,
    },
    {
      station_code: 'POSPOL-KEMANG',
      station_name: 'Pos Polisi Kemang Raya',
      station_level: 'POSPOL',
      address: 'Jl. Kemang Raya No. 10, Bangka, Mampang Prapatan',
      office_lat: -6.2612,
      office_lng: 106.8145,
      geofence_radius_meters: 300,
    },
  ];
  for (const st of defaultStations) {
    await prisma.policeStation.upsert({
      where: { station_code: st.station_code },
      update: {
        station_name: st.station_name,
        station_level: st.station_level,
        address: st.address,
        office_lat: st.office_lat,
        office_lng: st.office_lng,
        geofence_radius_meters: st.geofence_radius_meters,
      },
      create: st,
    });
  }
  console.log('✓ Police Stations seeded.');

  // 18. Patrol Vehicles
  const defaultVehicles = [
    {
      nomor_lambung: 'R4-SAMAPTA-01',
      nama_armada: 'Mobil Patroli Samapta Presisi R4-01',
      jenis_kendaraan: 'RODA_4',
      plat_nomor_polisi: '1001-VII',
      qr_token: 'QR-VEH-SAMAPTA-01',
      status_operasional: 'SIAGA',
      status_color: '#10B981',
      driver_officer_nrp: '95020123',
      current_lat: -6.2415,
      current_lng: 106.8021,
      speed_kmh: 0,
    },
    {
      nomor_lambung: 'R4-LANTAS-PJR',
      nama_armada: 'Unit Patroli Lalu Lintas PJR Sedan-01',
      jenis_kendaraan: 'RODA_4',
      plat_nomor_polisi: '1002-VII',
      qr_token: 'QR-VEH-LANTAS-01',
      status_operasional: 'PATROLI',
      status_color: '#3B82F6',
      driver_officer_nrp: '82050411',
      current_lat: -6.2625,
      current_lng: 106.8123,
      speed_kmh: 35,
    },
    {
      nomor_lambung: 'R2-PERINTIS-12',
      nama_armada: 'Motor Taktis Perintis Presisi Trail-12',
      jenis_kendaraan: 'RODA_2',
      plat_nomor_polisi: '2105-VII',
      qr_token: 'QR-VEH-TRAIL-12',
      status_operasional: 'PATROLI',
      status_color: '#3B82F6',
      driver_officer_nrp: '93080567',
      current_lat: -6.2415,
      current_lng: 106.8041,
      speed_kmh: 0,
    },
    {
      nomor_lambung: 'R4-RESKRIM-OPS',
      nama_armada: 'Kendaraan Taktis Reskrim Opsnal & Resmob',
      jenis_kendaraan: 'MINIBUS',
      plat_nomor_polisi: '3001-VII',
      qr_token: 'QR-VEH-RESKRIM-01',
      status_operasional: 'SIAGA',
      status_color: '#10B981',
      driver_officer_nrp: '89110255',
      current_lat: -6.2415,
      current_lng: 106.8021,
      speed_kmh: 0,
    },
    {
      nomor_lambung: 'R2-BHABINKAMTIBMAS-05',
      nama_armada: 'Motor Dinas Bhabinkamtibmas Polsek',
      jenis_kendaraan: 'RODA_2',
      plat_nomor_polisi: '2205-VII',
      qr_token: 'QR-VEH-BHABIN-05',
      status_operasional: 'PATROLI',
      status_color: '#3B82F6',
      driver_officer_nrp: '86040899',
      current_lat: -6.2515,
      current_lng: 106.8088,
      speed_kmh: 20,
    },
  ];
  for (const v of defaultVehicles) {
    await prisma.patrolVehicle.upsert({
      where: { nomor_lambung: v.nomor_lambung },
      update: { ...v },
      create: { ...v },
    });
  }
  console.log('✓ Patrol Vehicles seeded.');

  // 18.1 Master Vehicle Types (Jenis Kendaraan Patroli)
  const vehicleTypes = [
    { key: 'RODA_4', label: 'Mobil Patroli Sedan / SUV (RODA_4)', display_order: 1 },
    { key: 'RODA_2', label: 'Sepeda Motor Trail / Taktis (RODA_2)', display_order: 2 },
    { key: 'MINIBUS', label: 'Kendaraan Taktis Minibus (MINIBUS)', display_order: 3 },
    { key: 'WATER_CANNON', label: 'Rantis Pengurai Massa (WATER_CANNON)', display_order: 4 },
  ];
  for (const vt of vehicleTypes) {
    await prisma.$executeRawUnsafe(
      `INSERT INTO master_vehicle_types (\`key\`, label, display_order, is_active)
       VALUES (?, ?, ?, true)
       ON DUPLICATE KEY UPDATE label = VALUES(label), display_order = VALUES(display_order), is_active = true;`,
      vt.key,
      vt.label,
      vt.display_order
    );
  }
  console.log('✓ Master Vehicle Types seeded.');

  // 18.2 Master Vehicle Operational Statuses (Status Operasional Kesiagaan)
  const vehicleStatuses = [
    { key: 'SIAGA', label: 'SIAGA (Standby Mako / Beat)', display_order: 1 },
    { key: 'PATROLI', label: 'PATROLI (Mobile Lapangan)', display_order: 2 },
    { key: 'MENUJU_TKP', label: 'MENUJU_TKP (Tanggap Darurat 110)', display_order: 3 },
    { key: 'PEMELIHARAAN', label: 'PEMELIHARAAN (Bengkel / Servis)', display_order: 4 },
  ];
  for (const vs of vehicleStatuses) {
    await prisma.$executeRawUnsafe(
      `INSERT INTO master_vehicle_statuses (\`key\`, label, display_order, is_active)
       VALUES (?, ?, ?, true)
       ON DUPLICATE KEY UPDATE label = VALUES(label), display_order = VALUES(display_order), is_active = true;`,
      vs.key,
      vs.label,
      vs.display_order
    );
  }
  console.log('✓ Master Vehicle Statuses seeded.');

  // 19. Hotspot Locations
  const defaultHotspots = [
    {
      key: 'HS-CSW-01',
      title: 'Simpang CSW - Blok M & Taman Martha Tiahahu',
      police_sector: 'Polsek Kebayoran Baru',
      category: 'TAWURAN',
      danger_level: 'PENGAWASAN_PRIORITAS',
      lat: -6.2415,
      lng: 106.8021,
      active_start: '22:00',
      active_end: '04:30',
      schedule_display: '22:00 - 04:30 WIB',
      nearest_unit: 'Tim Perintis Presisi R2-12',
    },
    {
      key: 'HS-ANTASARI-02',
      title: 'Underpass & Flyover Pangeran Antasari',
      police_sector: 'Polsek Kebayoran Baru',
      category: 'BALAP_LIAR',
      danger_level: 'SIAGA_BLUE_LIGHT',
      lat: -6.2625,
      lng: 106.8123,
      active_start: '00:00',
      active_end: '04:30',
      schedule_display: '00:00 - 04:30 WIB',
      nearest_unit: 'Patroli Samapta Presisi R4-01',
    },
    {
      key: 'HS-FATMAWATI-03',
      title: 'Kawasan Stasiun MRT Blok A s.d Fatmawati',
      police_sector: 'Polsek Cilandak',
      category: 'TIGA_C',
      danger_level: 'SIAGA_BLUE_LIGHT',
      lat: -6.2534,
      lng: 106.7972,
      active_start: '21:00',
      active_end: '05:00',
      schedule_display: '21:00 - 05:00 WIB',
      nearest_unit: 'Patroli Samapta 110-A',
    },
    {
      key: 'HS-MANGGARAI-04',
      title: 'Underpass & Jembatan Kereta Manggarai',
      police_sector: 'Polsek Tebet',
      category: 'TAWURAN',
      danger_level: 'DARURAT_110',
      lat: -6.2098,
      lng: 106.8502,
      active_start: '23:00',
      active_end: '05:00',
      schedule_display: '23:00 - 05:00 WIB',
      nearest_unit: 'Regu Sabhara Presisi Tebet',
    },
    {
      key: 'HS-KEMANG-05',
      title: 'Koridor Hiburan Malam Kemang Raya',
      police_sector: 'Polsek Mampang Prapatan',
      category: 'KEMACETAN',
      danger_level: 'PEMANTAUAN_RUTIN',
      lat: -6.2611,
      lng: 106.8155,
      active_start: '22:00',
      active_end: '03:30',
      schedule_display: '22:00 - 03:30 WIB',
      nearest_unit: 'Unit Patroli Lantas Mampang',
    },
  ];
  for (const h of defaultHotspots) {
    await prisma.hotspotLocation.upsert({
      where: { key: h.key },
      update: { ...h },
      create: { ...h },
    });
  }
  console.log('✓ Hotspot Locations seeded.');

  // 20. Master Resolution Locations (Lokasi Penyelesaian / BAP)
  const resolutionLocations = [
    {
      key: 'TKP',
      label: 'Tempat Kejadian Perkara (TKP)',
      keterangan: 'Penyelesaian langsung di lokasi insiden awal',
      requires_strict_tkp: true,
      display_order: 1,
      is_active: true,
    },
    {
      key: 'RUMAH_SAKIT',
      label: 'Fasilitas Kesehatan / Rumah Sakit / Puskesmas',
      keterangan: 'Evakuasi korban, koordinasi IGD, dan visum et repertum',
      requires_strict_tkp: false,
      display_order: 2,
      is_active: true,
    },
    {
      key: 'KANTOR_POLISI',
      label: 'Kantor Kepolisian (Polsek / Unit Laka / Polres)',
      keterangan: 'Pemeriksaan saksi, penerbitan BAP formal & mediasi RJ',
      requires_strict_tkp: false,
      display_order: 3,
      is_active: true,
    },
    {
      key: 'KANTOR_KELURAHAN',
      label: 'Kantor Kelurahan / Pos RW / Balai Warga',
      keterangan: 'Musyawarah kekeluargaan bersama tokoh masyarakat setempat',
      requires_strict_tkp: false,
      display_order: 4,
      is_active: true,
    },
    {
      key: 'LAINNYA',
      label: 'Lokasi Mediasi Sah Lainnya',
      keterangan: 'Tempat kesepakatan damai para pihak yang disetujui',
      requires_strict_tkp: false,
      display_order: 5,
      is_active: true,
    },
  ];
  for (const loc of resolutionLocations) {
    await prisma.masterResolutionLocationType.upsert({
      where: { key: loc.key },
      update: loc,
      create: loc,
    });
  }
  console.log('✓ Master Resolution Locations seeded.');

  // 21. Master Resolution Documents (Tipe Objek Bukti / Dokumen BAP Akhir)
  const resolutionDocuments = [
    {
      key: 'BAP_DAMAI',
      label: 'Surat Pernyataan Damai / Kesepakatan Bersama Bermaterai',
      keterangan: 'Penyelesaian musyawarah kekeluargaan (Restorative Justice)',
      display_order: 1,
      is_active: true,
    },
    {
      key: 'REKAM_MEDIS',
      label: 'Surat Keterangan Medis / Rujukan RS / Visum et Repertum',
      keterangan: 'Dokumen bukti penanganan korban dari pihak medis/faskes',
      display_order: 2,
      is_active: true,
    },
    {
      key: 'SERAH_TERIMA_BB',
      label: 'Berita Acara Serah Terima Barang Bukti / Ranmor',
      keterangan: 'Penyerahan kendaraan atau barang bukti kepada pemilik sah',
      display_order: 3,
      is_active: true,
    },
    {
      key: 'DOKUMENTASI_KONDUSIF',
      label: 'Foto Situasi Kondusif / Musyawarah Para Pihak',
      keterangan: 'Bukti visual situasi telah aman terkendali dan para pihak bersalaman',
      display_order: 4,
      is_active: true,
    },
    {
      key: 'BERITA_ACARA_PENUTUPAN',
      label: 'Berita Acara Penanganan & Penghentian Penyelidikan Resmi',
      keterangan: 'Dokumen administrasi penutupan perkara oleh penyidik/petugas',
      display_order: 5,
      is_active: true,
    },
    {
      key: 'DOKUMEN_LAINNYA',
      label: 'Dokumen Sah / Keterangan Pendukung Lainnya',
      keterangan: 'Dokumentasi berkas pendukung lainnya sesuai wewenang petugas',
      display_order: 6,
      is_active: true,
    },
  ];
  for (const doc of resolutionDocuments) {
    await prisma.masterResolutionDocumentType.upsert({
      where: { key: doc.key },
      update: doc,
      create: doc,
    });
  }
  console.log('✓ Master Resolution Documents seeded.');

  console.log('🎉 Comprehensive Seed to TiDB Cloud completed successfully!');
}

seed()
  .catch((err) => {
    console.error('Seed error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
