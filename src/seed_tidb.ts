import { prisma } from './infrastructure/db/prisma.client';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('🌱 Seeding initial SIMAPRES accounts to TiDB Cloud...');
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

  // 2. Default Station (Polres Metro Jakarta Selatan)
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

  // 3. Operational Units
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

  // 4. Default Users
  const seedUsers = [
    {
      identifier: '88010234',
      fullName: 'AKP Eko Susanto, S.I.K.',
      role: 'PAWAS',
      pangkat: 'AKP',
      jabatan: 'Perwira Pengawas Piket Komando SPKT',
      phone: '081288991100',
      email: 'pawas@polri.go.id',
      unitId: 'sabhara',
      satuanNama: 'Satuan Samapta Presisi',
      kelompokRegu: 'Regu Alpha Presisi',
    },
    {
      identifier: '78091122',
      fullName: 'Aiptu Herman Sulistyo',
      role: 'SUPERADMIN',
      pangkat: 'KOMISARIS BESAR POLISI',
      jabatan: 'Super Administrator Pusat Mabes Polri',
      phone: '081122334455',
      email: 'superadmin@polri.go.id',
      unitId: 'reskrim',
      satuanNama: 'Satuan Pengawas Internal',
      kelompokRegu: 'Tim Audit Komando',
    },
    {
      identifier: '92031145',
      fullName: 'Bripka Dedi Prasetyo',
      role: 'PERSONIL',
      pangkat: 'BRIPKA',
      jabatan: 'Ba Turjawali Samapta',
      phone: '081399887766',
      email: 'dedi.samapta@polri.go.id',
      unitId: 'sabhara',
      satuanNama: 'Satuan Samapta Presisi',
      kelompokRegu: 'Patroli Perintis Presisi 01',
    },
  ];

  for (const su of seedUsers) {
    const user = await prisma.user.upsert({
      where: { identifier: su.identifier },
      update: {
        password_hash: defaultHash,
        full_name: su.fullName,
        role: su.role,
      },
      create: {
        identifier: su.identifier,
        password_hash: defaultHash,
        full_name: su.fullName,
        phone_number: su.phone,
        email: su.email,
        role: su.role,
        station_id: station.id,
      },
    });

    await prisma.policeOfficer.upsert({
      where: { user_id: user.id },
      update: {
        rank_pangkat: su.pangkat,
        jabatan: su.jabatan,
      },
      create: {
        user_id: user.id,
        nrp: su.identifier,
        rank_pangkat: su.pangkat,
        jabatan: su.jabatan,
        station_id: station.id,
        duty_status: 'DINAS_PATROLI',
      },
    });

    await prisma.registeredUnit.upsert({
      where: { nrp: su.identifier },
      update: {
        nama: su.fullName,
        pangkat: su.pangkat,
        role: su.role,
        password: '••••••••',
      },
      create: {
        id: `UNIT-${su.identifier}`,
        nrp: su.identifier,
        nama: su.fullName,
        pangkat: su.pangkat,
        role: su.role,
        unitId: su.unitId,
        satuanNama: su.satuanNama,
        kelompokRegu: su.kelompokRegu,
        password: defaultHash,
        deviceID: `DEV-${su.identifier}`,
        tanggalDaftar: new Date(),
        tanggalUpdate: new Date(),
      },
    });

    console.log(`✓ Seeded user: ${su.identifier} (${su.fullName}) - Role: ${su.role}`);
  }

  console.log('🎉 Seed to TiDB Cloud completed successfully!');
}

seed()
  .catch((err) => {
    console.error('Seed error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
