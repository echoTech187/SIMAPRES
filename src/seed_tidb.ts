import { prisma } from './infrastructure/db/prisma.client';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('🌱 Seeding Master Data & Accounts to TiDB Cloud...');
  const defaultHash = await bcrypt.hash('polripresisi2026', 10);

  // 1. Master Roles
  const roles = [
    { key: 'SUPERADMIN', label: 'Super Administrator', display_order: 1 },
    { key: 'PAWAS', label: 'Perwira Pengawas (Pawas)', display_order: 2 },
    { key: 'PERSONIL', label: 'Petugas Lapangan', display_order: 3 },
  ];
  for (const r of roles) {
    await prisma.masterRole.upsert({
      where: { key: r.key },
      update: {},
      create: { ...r, is_active: true },
    });
  }

  // 2. Master Urgency Levels
  const urgencies = [
    { key: 'DARURAT', label: 'Darurat', icon_emoji: '🚨', badge_color: '#EF4444', badge_bg: '#FEF2F2', display_order: 1 },
    { key: 'SEDANG', label: 'Sedang', icon_emoji: '⚠️', badge_color: '#F59E0B', badge_bg: '#FFFBEB', display_order: 2 },
    { key: 'NORMAL', label: 'Normal', icon_emoji: 'ℹ️', badge_color: '#10B981', badge_bg: '#ECFDF5', display_order: 3 },
  ];
  for (const urg of urgencies) {
    await prisma.masterUrgencyLevel.upsert({
      where: { key: urg.key },
      update: {},
      create: { ...urg, is_active: true },
    });
  }

  // 3. Master Complaint Statuses (7 Status Resmi SIMAPRES 110)
  const statuses = [
    { key: 'MENUNGGU', label: 'Menunggu Penugasan Pawas', badge_color: '#F59E0B', badge_bg: '#FFFBEB', badge_border: '#FDE68A', display_order: 1 },
    { key: 'DISPOSISI', label: 'Personil sudah ditugaskan', badge_color: '#2563EB', badge_bg: '#EFF6FF', badge_border: '#BFDBFE', display_order: 2 },
    { key: 'MENUJU_TKP', label: 'Personil Menuju Lokasi / TKP', badge_color: '#8B5CF6', badge_bg: '#F5F3FF', badge_border: '#DDD6FE', display_order: 3 },
    { key: 'TIBA_DI_TKP', label: 'Personil tiba dilokasi', badge_color: '#10B981', badge_bg: '#ECFDF5', badge_border: '#A7F3D0', display_order: 4 },
    { key: 'MENUNGGU_PENGESAHAN', label: 'Laporan telah selesai ditangani dan BAP terbit', badge_color: '#EF4444', badge_bg: '#FEF2F2', badge_border: '#FECACA', display_order: 5 },
    { key: 'SELESAI', label: 'Laporan Selesai', badge_color: '#2563EB', badge_bg: '#EFF6FF', badge_border: '#BFDBFE', display_order: 1 },
    { key: 'DITOLAK', label: 'Laporan ditolak', badge_color: '#2563EB', badge_bg: '#EFF6FF', badge_border: '#BFDBFE', display_order: 1 },
  ];
  for (const st of statuses) {
    await prisma.masterComplaintStatus.upsert({
      where: { key: st.key },
      update: {
        label: st.label,
        badge_color: st.badge_color,
        badge_bg: st.badge_bg,
        badge_border: st.badge_border,
        display_order: st.display_order,
        is_active: true,
      },
      create: { ...st, is_active: true },
    });
  }

  // 4. Master Incident Categories
  const categories = [
    { key: 'KRIMINALITAS', label: 'Kriminalitas & 3C', icon: '🚨', badge_bg: '#FEF2F2', badge_color: '#DC2626', badge_border: '#FECACA', display_order: 1 },
    { key: 'KAMTIBMAS', label: 'Kamtibmas & Tawuran', icon: '👥', badge_bg: '#FFFBEB', badge_color: '#D97706', badge_border: '#FDE68A', display_order: 2 },
    { key: 'LAKALANTAS', label: 'Laka & Kemacetan Lantas', icon: '🚦', badge_bg: '#EFF6FF', badge_color: '#2563EB', badge_border: '#BFDBFE', display_order: 3 },
    { key: 'BENCANA', label: 'Darurat & Bencana Alam', icon: '🔥', badge_bg: '#FEF2F2', badge_color: '#EA580C', badge_border: '#FED7AA', display_order: 4 },
    { key: 'PELAYANAN_PUBLIK', label: 'Pelayanan Publik & Walk-in', icon: '📋', badge_bg: '#F8FAFC', badge_color: '#475569', badge_border: '#CBD5E1', display_order: 5 },
  ];
  for (const cat of categories) {
    await prisma.masterIncidentCategory.upsert({
      where: { key: cat.key },
      update: {},
      create: { ...cat, is_active: true },
    });
  }

  // 5. Master Report Sources
  const sources = [
    { key: 'SOS', label: 'Tombol Panik Darurat (SOS)', icon: '🚨', active_bg: '#DC2626', active_text: '#FFFFFF', inactive_bg: '#FEF2F2', inactive_text: '#DC2626', inactive_border: '#FECACA', display_order: 1 },
    { key: 'PORTAL_WARGA', label: 'Portal Pengaduan Warga Presisi', icon: '📱', active_bg: '#2563EB', active_text: '#FFFFFF', inactive_bg: '#EFF6FF', inactive_text: '#2563EB', inactive_border: '#BFDBFE', display_order: 2 },
    { key: 'CALL_110', label: 'Pusat Panggilan SPKT 110', icon: '📞', active_bg: '#059669', active_text: '#FFFFFF', inactive_bg: '#ECFDF5', inactive_text: '#059669', inactive_border: '#A7F3D0', display_order: 3 },
    { key: 'PERSONEL_LAPANGAN', label: 'Laporan Mandiri Personel Lapangan', icon: '👮', active_bg: '#7C3AED', active_text: '#FFFFFF', inactive_bg: '#F5F3FF', inactive_text: '#7C3AED', inactive_border: '#DDD6FE', display_order: 4 },
  ];
  for (const src of sources) {
    await prisma.masterReportSource.upsert({
      where: { key: src.key },
      update: {},
      create: { ...src, is_active: true },
    });
  }

  // 6. Master Duty Statuses
  const dutyStatuses = [
    { key: 'DINAS_PATROLI', label: 'Dinas Patroli', badge_color: '#10B981', badge_bg: '#ECFDF5', display_order: 1 },
    { key: 'PIKET_SPKT', label: 'Piket SPKT / Penjagaan', badge_color: '#2563EB', badge_bg: '#EFF6FF', display_order: 2 },
    { key: 'CADANGAN', label: 'Cadangan Siaga', badge_color: '#F59E0B', badge_bg: '#FFFBEB', display_order: 3 },
    { key: 'LEPAS_DINAS', label: 'Lepas Dinas', badge_color: '#64748B', badge_bg: '#F1F5F9', display_order: 4 },
  ];
  for (const ds of dutyStatuses) {
    await prisma.masterDutyStatus.upsert({
      where: { key: ds.key },
      update: {},
      create: { ...ds, is_active: true },
    });
  }

  // 7. Master Ranks
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
      update: {},
      create: { ...rk, is_active: true },
    });
  }

  // 8. Default Station (Polres Metro Jakarta Selatan)
  const station = await prisma.policeStation.upsert({
    where: { station_code: 'POLRES-JAKSEL' },
    update: {},
    create: {
      station_code: 'POLRES-JAKSEL',
      station_name: 'Polres Metro Jakarta Selatan',
      station_level: 'POLRES',
      address: 'Jl. Wijaya II No.42, Melawai, Kby. Baru, Kota Jakarta Selatan',
      office_lat: -6.2415,
      office_lng: 106.8012,
      geofence_radius_meters: 500,
    },
  });

  // 9. Operational Units
  const units = [
    { key: 'reskrim', unit_name: 'Satuan Reserse Kriminal', short_name: 'Sat Reskrim', icon_emoji: '🔍', duties: 'Penyelidikan & Penyidikan', default_orders: 'Tindak tegas pelaku tindak pidana' },
    { key: 'intel', unit_name: 'Satuan Intelijen Keamanan', short_name: 'Sat Intelkam', icon_emoji: '🕵️', duties: 'Deteksi Dini & Penggalangan', default_orders: 'Monitoring perkembangan situasi' },
    { key: 'lantas', unit_name: 'Satuan Lalu Lintas', short_name: 'Sat Lantas', icon_emoji: '🚦', duties: 'Pengaturan & Penjagaan Lantas', default_orders: 'Urai kemacetan dan cegah lakalantas' },
    { key: 'binmas', unit_name: 'Satuan Pembinaan Masyarakat', short_name: 'Sat Binmas', icon_emoji: '🤝', duties: 'Sambang & Edukasi Kamtibmas', default_orders: 'Edukasi dan rangkul masyarakat' },
    { key: 'sabhara', unit_name: 'Satuan Samapta Presisi', short_name: 'Sat Samapta', icon_emoji: '🚔', duties: 'Patroli Perintis Presisi', default_orders: 'Laksanakan patroli blue light di zona rawan' },
  ];
  for (const u of units) {
    await prisma.masterOperationalUnit.upsert({
      where: { key: u.key },
      update: {},
      create: { ...u, is_active: true },
    });
  }

  // 10. Default Users
  // const seedUsers = [
  //   {
  //     identifier: '88010234',
  //     fullName: 'AKP Eko Susanto, S.I.K.',
  //     role: 'PAWAS',
  //     pangkat: 'AKP',
  //     jabatan: 'Perwira Pengawas Piket Komando SPKT',
  //     phone: '081288991100',
  //     email: 'pawas@polri.go.id',
  //     unitId: 'sabhara',
  //     satuanNama: 'Satuan Samapta Presisi',
  //     kelompokRegu: 'Regu Alpha Presisi',
  //   },
  //   {
  //     identifier: '78091122',
  //     fullName: 'Aiptu Herman Sulistyo',
  //     role: 'SUPERADMIN',
  //     pangkat: 'KOMISARIS BESAR POLISI',
  //     jabatan: 'Super Administrator Pusat Mabes Polri',
  //     phone: '081122334455',
  //     email: 'superadmin@polri.go.id',
  //     unitId: 'reskrim',
  //     satuanNama: 'Satuan Pengawas Internal',
  //     kelompokRegu: 'Tim Audit Komando',
  //   },
  //   {
  //     identifier: '92031145',
  //     fullName: 'Bripka Dedi Prasetyo',
  //     role: 'PERSONIL',
  //     pangkat: 'BRIPKA',
  //     jabatan: 'Ba Turjawali Samapta',
  //     phone: '081399887766',
  //     email: 'dedi.samapta@polri.go.id',
  //     unitId: 'sabhara',
  //     satuanNama: 'Satuan Samapta Presisi',
  //     kelompokRegu: 'Patroli Perintis Presisi 01',
  //   },
  // ];

  // for (const su of seedUsers) {
  //   const user = await prisma.user.upsert({
  //     where: { identifier: su.identifier },
  //     update: {
  //       password_hash: defaultHash,
  //       full_name: su.fullName,
  //       role: su.role,
  //     },
  //     create: {
  //       identifier: su.identifier,
  //       password_hash: defaultHash,
  //       full_name: su.fullName,
  //       phone_number: su.phone,
  //       email: su.email,
  //       role: su.role,
  //       station_id: station.id,
  //     },
  //   });

  //   await prisma.policeOfficer.upsert({
  //     where: { user_id: user.id },
  //     update: {
  //       rank_pangkat: su.pangkat,
  //       jabatan: su.jabatan,
  //     },
  //     create: {
  //       user_id: user.id,
  //       nrp: su.identifier,
  //       rank_pangkat: su.pangkat,
  //       jabatan: su.jabatan,
  //       station_id: station.id,
  //       duty_status: 'DINAS_PATROLI',
  //     },
  //   });

  //   await prisma.registeredUnit.upsert({
  //     where: { nrp: su.identifier },
  //     update: {
  //       nama: su.fullName,
  //       pangkat: su.pangkat,
  //       role: su.role,
  //       password: '••••••••',
  //     },
  //     create: {
  //       id: `UNIT-${su.identifier}`,
  //       nrp: su.identifier,
  //       nama: su.fullName,
  //       pangkat: su.pangkat,
  //       role: su.role,
  //       unitId: su.unitId,
  //       satuanNama: su.satuanNama,
  //       kelompokRegu: su.kelompokRegu,
  //       password: defaultHash,
  //       deviceID: `DEV-${su.identifier}`,
  //       tanggalDaftar: new Date(),
  //       tanggalUpdate: new Date(),
  //     },
  //   });

  //   console.log(`✓ Seeded user: ${su.identifier} (${su.fullName}) - Role: ${su.role}`);
  // }

  console.log('🎉 Seed Master Data to TiDB Cloud completed successfully!');
}

seed()
  .catch((err) => {
    console.error('Seed error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
