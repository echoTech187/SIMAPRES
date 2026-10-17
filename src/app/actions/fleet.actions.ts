'use server';

import { prisma } from '@/infrastructure/db/prisma.client';
import { revalidatePath } from 'next/cache';

// Helper serialize BigInt
function serializeBigInt<T>(obj: T): T {
  return JSON.parse(
    JSON.stringify(obj, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    )
  );
}

// 14 Operational Fleet Units Seed Template
const INITIAL_FLEET_SEEDS = [
  // 4 Samapta R-4
  {
    unit_key: 'samapta1',
    nrp: '95020123',
    category: 'samapta',
    icon_emoji: '🚔',
    title: 'Patroli Samapta 110-A',
    petugas: 'Bripka Ahmad Subagyo (NRP 95020123)',
    sub: 'Sat Samapta (Sektor Timur) • Sedan R4-Samapta-81',
    status: 'Status: SIAGA',
    status_color: '#10B981',
    tugas: 'Tugas: Patroli Rute Beat 1 (Pasar & Bank)',
    telemetri: 'Kecepatan: 35 km/jam • Sinyal GPS Prima',
    lat: -6.215,
    lng: 106.83,
  },
  {
    unit_key: 'samapta2',
    nrp: '82040512',
    category: 'samapta',
    icon_emoji: '🚔',
    title: 'Patroli Samapta 110-B',
    petugas: 'Aipda Eko Prasetyo (NRP 82040512)',
    sub: 'Sat Samapta (Sektor Pusat) • Double Cabin R4-Samapta-12',
    status: 'Status: PATROLI KOTA',
    status_color: '#2563EB',
    tugas: 'Tugas: Patroli Jalur Protokol & Objek Vital Perbankan',
    telemetri: 'Kecepatan: 42 km/jam • Sinyal GPS Prima',
    lat: -6.205,
    lng: 106.825,
  },
  {
    unit_key: 'samapta3',
    nrp: '88010211',
    category: 'samapta',
    icon_emoji: '🚔',
    title: 'Patroli Samapta 110-C',
    petugas: 'Bripka Bambang Haryanto (NRP 88010211)',
    sub: 'Sat Samapta (Sektor Barat) • Sedan R4-Samapta-03',
    status: 'Status: SIAGA',
    status_color: '#10B981',
    tugas: 'Tugas: Patroli Permukiman & Sentra Niaga',
    telemetri: 'Kecepatan: 0 km/jam (Stasioner) • Sinyal Baik',
    lat: -6.22,
    lng: 106.81,
  },
  {
    unit_key: 'samapta4',
    nrp: '91030422',
    category: 'samapta',
    icon_emoji: '🚔',
    title: 'Patroli Samapta 110-D',
    petugas: 'Aipda Ridwan Kamil (NRP 91030422)',
    sub: 'Sat Samapta (Sektor Selatan) • Ranger R4-Samapta-44',
    status: 'Status: PATROLI KOTA',
    status_color: '#2563EB',
    tugas: 'Tugas: Antisipasi Tawuran Warga & Gesekan Antar Kelompok',
    telemetri: 'Kecepatan: 38 km/jam • Sinyal GPS Prima',
    lat: -6.23,
    lng: 106.84,
  },

  // 6 Perintis Presisi R-2
  {
    unit_key: 'perintis1',
    nrp: '93050111',
    category: 'perintis',
    icon_emoji: '🏍️',
    title: 'Perintis Presisi R2-A',
    petugas: 'Bripka Joko Susilo (NRP 93050111)',
    sub: 'Tim Perintis Presisi (Regu Alpha) • KLX Trail Presisi-01',
    status: 'Status: SIAGA TANGGAP CEPAT',
    status_color: '#10B981',
    tugas: 'Tugas: Mobile Patroli Gang Sempit & Kerumunan Remaja',
    telemetri: 'Kecepatan: 28 km/jam • Sinyal GPS Prima',
    lat: -6.21,
    lng: 106.835,
  },
  {
    unit_key: 'perintis2',
    nrp: '94060222',
    category: 'perintis',
    icon_emoji: '🏍️',
    title: 'Perintis Presisi R2-B',
    petugas: 'Bripka Hendra Setiawan (NRP 94060222)',
    sub: 'Tim Perintis Presisi (Regu Bravo) • KLX Trail Presisi-02',
    status: 'Status: PATROLI KOTA',
    status_color: '#D97706',
    tugas: 'Tugas: Pengawasan Titik Rawan Curanmor & Begal',
    telemetri: 'Kecepatan: 32 km/jam • Sinyal GPS Prima',
    lat: -6.218,
    lng: 106.822,
  },
  {
    unit_key: 'perintis3',
    nrp: '95070333',
    category: 'perintis',
    icon_emoji: '🏍️',
    title: 'Perintis Presisi R2-C',
    petugas: 'Briptu Dani Permana (NRP 95070333)',
    sub: 'Tim Perintis Presisi (Regu Charlie) • Trail Presisi-03',
    status: 'Status: SIAGA TANGGAP CEPAT',
    status_color: '#10B981',
    tugas: 'Tugas: Penyekatan Jalur Balap Liar & Miras',
    telemetri: 'Kecepatan: 25 km/jam • Sinyal GPS Prima',
    lat: -6.226,
    lng: 106.815,
  },
  {
    unit_key: 'perintis4',
    nrp: '96080444',
    category: 'perintis',
    icon_emoji: '🏍️',
    title: 'Perintis Presisi R2-D',
    petugas: 'Bripka Agus Supriyadi (NRP 96080444)',
    sub: 'Tim Perintis Presisi (Regu Delta) • Trail Presisi-04',
    status: 'Status: PATROLI KOTA',
    status_color: '#D97706',
    tugas: 'Tugas: Observasi Wilayah Rawan Gesekan Antar Geng',
    telemetri: 'Kecepatan: 30 km/jam • Sinyal GPS Prima',
    lat: -6.235,
    lng: 106.828,
  },
  {
    unit_key: 'perintis5',
    nrp: '97090555',
    category: 'perintis',
    icon_emoji: '🏍️',
    title: 'Perintis Presisi R2-E',
    petugas: 'Briptu Wahyu Hidayat (NRP 97090555)',
    sub: 'Tim Perintis Presisi (Regu Echo) • Trail Presisi-05',
    status: 'Status: SIAGA',
    status_color: '#10B981',
    tugas: 'Tugas: Sambang Pos Kamling & Tokoh Warga',
    telemetri: 'Kecepatan: 15 km/jam • Sinyal GPS Baik',
    lat: -6.242,
    lng: 106.838,
  },
  {
    unit_key: 'perintis6',
    nrp: '98100666',
    category: 'perintis',
    icon_emoji: '🏍️',
    title: 'Perintis Presisi R2-F',
    petugas: 'Bripda Surya Pratama (NRP 98100666)',
    sub: 'Tim Perintis Presisi (Regu Foxtrot) • Trail Presisi-06',
    status: 'Status: PATROLI KOTA',
    status_color: '#D97706',
    tugas: 'Tugas: Penindakan Knalpot Brong & Balap Liar',
    telemetri: 'Kecepatan: 36 km/jam • Sinyal GPS Prima',
    lat: -6.208,
    lng: 106.845,
  },

  // 4 Lantas R-4
  {
    unit_key: 'lantas1',
    nrp: '87010777',
    category: 'lantas',
    icon_emoji: '🚓',
    title: 'Turjawali Lantas R4-101',
    petugas: 'Aiptu Budi Hartono (NRP 87010777)',
    sub: 'Sat Lantas (Unit Turjawali) • Sedan Lantas-101',
    status: 'Status: GATUR LALIN',
    status_color: '#1D4ED8',
    tugas: 'Tugas: Pengaturan Arus Simpang Protokol & U-Turn',
    telemetri: 'Kecepatan: 10 km/jam • Sinyal GPS Prima',
    lat: -6.222,
    lng: 106.828,
  },
  {
    unit_key: 'lantas2',
    nrp: '89020888',
    category: 'lantas',
    icon_emoji: '🚓',
    title: 'Turjawali Lantas R4-102',
    petugas: 'Aipda Agus Santoso (NRP 89020888)',
    sub: 'Sat Lantas (Unit Pengawalan) • Sedan Lantas-102',
    status: 'Status: SIAGA VIP / ESCORT',
    status_color: '#10B981',
    tugas: 'Tugas: Siaga Pengawalan Jalur Arteri Utama',
    telemetri: 'Kecepatan: 0 km/jam • Sinyal GPS Prima',
    lat: -6.198,
    lng: 106.828,
  },
  {
    unit_key: 'lantas3',
    nrp: '92030999',
    category: 'lantas',
    icon_emoji: '🚓',
    title: 'Turjawali Lantas R4-103',
    petugas: 'Bripka Doni Prasetya (NRP 92030999)',
    sub: 'Sat Lantas (Unit Urai Macet) • Double Cabin Lantas-103',
    status: 'Status: GATUR LALIN',
    status_color: '#1D4ED8',
    tugas: 'Tugas: Penarikan Antrean TL & Sterilisasi Bahu Jalan',
    telemetri: 'Kecepatan: 20 km/jam • Sinyal GPS Prima',
    lat: -6.212,
    lng: 106.805,
  },
  {
    unit_key: 'lantas4',
    nrp: '94041000',
    category: 'lantas',
    icon_emoji: '🚓',
    title: 'Turjawali Lantas R4-104',
    petugas: 'Brigadir Arif Wibowo (NRP 94041000)',
    sub: 'Sat Lantas (Unit Patroli Jalan Raya) • SUV Lantas-104',
    status: 'Status: PATROLI KOTA',
    status_color: '#1D4ED8',
    tugas: 'Tugas: Patroli Jalur Cepat & Penertiban Parkir Liar',
    telemetri: 'Kecepatan: 40 km/jam • Sinyal GPS Prima',
    lat: -6.24,
    lng: 106.82,
  },
];

// Inisialisasi Tabel patrol_fleet_units di Database MySQL jika belum ada
async function ensurePatrolFleetTable() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS patrol_fleet_units (
        id INT AUTO_INCREMENT PRIMARY KEY,
        unit_key VARCHAR(50) UNIQUE NOT NULL,
        nrp VARCHAR(20),
        category VARCHAR(30) NOT NULL,
        icon_emoji VARCHAR(10) NOT NULL DEFAULT '🚔',
        title VARCHAR(100) NOT NULL,
        petugas VARCHAR(150) NOT NULL,
        sub VARCHAR(150) NOT NULL,
        status VARCHAR(100) NOT NULL,
        status_color VARCHAR(20) NOT NULL DEFAULT '#10B981',
        tugas VARCHAR(255) NOT NULL,
        telemetri VARCHAR(255) NOT NULL,
        lat DECIMAL(10, 8) NOT NULL,
        lng DECIMAL(11, 8) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Cek apakah tabel masih kosong
    const countResult: any[] = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as total FROM patrol_fleet_units
    `);
    const total = Number(countResult[0]?.total || 0);

    if (total === 0) {
      // Seed initial 14 fleet units ke MySQL
      for (const item of INITIAL_FLEET_SEEDS) {
        await prisma.$executeRawUnsafe(
          `INSERT INTO patrol_fleet_units 
            (unit_key, nrp, category, icon_emoji, title, petugas, sub, status, status_color, tugas, telemetri, lat, lng, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
           ON DUPLICATE KEY UPDATE 
            title = VALUES(title), petugas = VALUES(petugas), sub = VALUES(sub),
            status = VALUES(status), tugas = VALUES(tugas), telemetri = VALUES(telemetri),
            lat = VALUES(lat), lng = VALUES(lng), updated_at = NOW()`,
          item.unit_key,
          item.nrp,
          item.category,
          item.icon_emoji,
          item.title,
          item.petugas,
          item.sub,
          item.status,
          item.status_color,
          item.tugas,
          item.telemetri,
          item.lat,
          item.lng
        );
      }
    }
  } catch (err) {
    console.warn('ensurePatrolFleetTable error:', err);
  }
}

export async function getPatrolFleetUnitsAction() {
  try {
    await ensurePatrolFleetTable();

    const records: any[] = await prisma.$queryRawUnsafe(`
      SELECT id, unit_key, nrp, category, icon_emoji, title, petugas, sub, status, status_color, tugas, telemetri, 
             CAST(lat AS DOUBLE) as lat, CAST(lng AS DOUBLE) as lng
      FROM patrol_fleet_units
      ORDER BY id ASC
    `);

    const formatted = records.map((r) => ({
      key: r.unit_key,
      nrp: r.nrp,
      pos: { lat: Number(r.lat), lng: Number(r.lng) },
      iconEmoji: r.icon_emoji,
      title: r.title,
      petugas: r.petugas,
      sub: r.sub,
      status: r.status,
      statusColor: r.status_color,
      tugas: r.tugas,
      telemetri: r.telemetri,
    }));

    return { success: true, data: serializeBigInt(formatted) };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal mengambil data unit armada dari database.' };
  }
}

export async function updatePatrolFleetTelemetryAction(input: {
  unitKey: string;
  lat: number;
  lng: number;
  telemetri?: string;
  status?: string;
}) {
  try {
    await ensurePatrolFleetTable();

    await prisma.$executeRawUnsafe(
      `UPDATE patrol_fleet_units 
       SET lat = ?, lng = ?, 
           telemetri = COALESCE(?, telemetri),
           status = COALESCE(?, status),
           updated_at = NOW()
       WHERE unit_key = ?`,
      input.lat,
      input.lng,
      input.telemetri || null,
      input.status || null,
      input.unitKey
    );

    revalidatePath('/personil');
    revalidatePath('/command-center');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
