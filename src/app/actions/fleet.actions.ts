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

let patrolFleetCache: { data: any; expiresAt: number } | null = null;
const PATROL_FLEET_CACHE_TTL_MS = 3 * 1000; // 3 detik agar pergerakan real-time mulus

// Definisi Tactical Beat & Waypoint Sektor Patroli Kewilayahan Polres Metro Jakarta Selatan
const OFFICER_TACTICAL_SECTORS: Record<
  string,
  {
    lokasiTeks: string;
    aktivitasDef: string;
    category: string;
    iconEmoji: string;
    speed: number;
    routePoints: { lat: number; lng: number }[];
  }
> = {
  // 1. AKP Eko Susanto - Pawas Piket Komando SPKT
  '88010234': {
    lokasiTeks: 'Mako Komando Polres Metro Jakarta Selatan, Jl. Wijaya II',
    aktivitasDef: 'Supervisi Kesiapsiagaan Mako & Monitoring Tactical Command Center 110',
    category: 'pawas',
    iconEmoji: '👮',
    speed: 0,
    routePoints: [
      { lat: -6.2415, lng: 106.8021 },
      { lat: -6.2413, lng: 106.8023 },
    ],
  },
  // 2. Bripka Dedi Prasetyo - Samapta Perintis 01
  '92031145': {
    lokasiTeks: 'Kawasan Wisata Kuliner Melawai & Panglima Polim, Kebayoran Baru',
    aktivitasDef: 'Patroli Dialogis & Antisipasi Curas/Curat (3C) Sektor Melawai',
    category: 'perintis',
    iconEmoji: '🏍️',
    speed: 24,
    routePoints: [
      { lat: -6.248, lng: 106.805 },
      { lat: -6.244, lng: 106.801 },
      { lat: -6.2415, lng: 106.803 },
      { lat: -6.245, lng: 106.8065 },
      { lat: -6.248, lng: 106.805 },
    ],
  },
  // 3. Bripka Ahmad Subagyo - Samapta R4-01
  '95020123': {
    lokasiTeks: 'Terminal Terpadu & Kawasan Blok M Square, Kebayoran Baru',
    aktivitasDef: 'Mobile Blue Light Patrol Beat Blok M - Kyai Maja',
    category: 'samapta',
    iconEmoji: '🚔',
    speed: 28,
    routePoints: [
      { lat: -6.244, lng: 106.8005 },
      { lat: -6.2415, lng: 106.8021 },
      { lat: -6.2443, lng: 106.7985 },
      { lat: -6.247, lng: 106.7995 },
      { lat: -6.244, lng: 106.8005 },
    ],
  },
  // 4. Aiptu Herman Sulistyo - Reskrim Opsnal
  '78091122': {
    lokasiTeks: 'Koridor Jl. Prof. DR. Soepomo & Stasiun Tebet, Tebet',
    aktivitasDef: 'Observasi Wilayah Rawan Kriminalitas & Respon Cepat Sektor Tebet',
    category: 'reskrim',
    iconEmoji: '🚐',
    speed: 22,
    routePoints: [
      { lat: -6.2312, lng: 106.8285 },
      { lat: -6.228, lng: 106.832 },
      { lat: -6.235, lng: 106.835 },
      { lat: -6.237, lng: 106.829 },
      { lat: -6.2312, lng: 106.8285 },
    ],
  },
  // 5. Aipda Bambang Triyono - Lantas & Binmas
  '82050411': {
    lokasiTeks: 'Jl. Kemang Raya No. 45 s.d Underpass Antasari, Mampang Prapatan',
    aktivitasDef: 'Pengaturan Lalin & Sambang Kamtibmas Warga Kemang Raya',
    category: 'lantas',
    iconEmoji: '🚓',
    speed: 32,
    routePoints: [
      { lat: -6.2625, lng: 106.8123 },
      { lat: -6.258, lng: 106.814 },
      { lat: -6.252, lng: 106.8155 },
      { lat: -6.256, lng: 106.8105 },
      { lat: -6.2625, lng: 106.8123 },
    ],
  },
  // 6. Ipda Rian Mahendra, S.H. - Reskrim R4 Opsnal
  '89110255': {
    lokasiTeks: 'Jl. Senopati Raya & Jl. Gunawarman, Kebayoran Baru',
    aktivitasDef: 'Patroli Ranmor R4 Opsnal Koridor Senopati - Gunawarman',
    category: 'reskrim',
    iconEmoji: '🚐',
    speed: 26,
    routePoints: [
      { lat: -6.237, lng: 106.808 },
      { lat: -6.234, lng: 106.811 },
      { lat: -6.239, lng: 106.8125 },
      { lat: -6.241, lng: 106.809 },
      { lat: -6.237, lng: 106.808 },
    ],
  },
  // 7. Bripka Wahyu Prasetya - Lantas Senayan
  '91040822': {
    lokasiTeks: 'Pos Lantas Bundaran Senayan & Koridor Jl. Jend. Sudirman',
    aktivitasDef: 'Pengaturan Arus Lalu Lintas & Antisipasi Balap Liar Bundaran Senayan',
    category: 'lantas',
    iconEmoji: '🚓',
    speed: 20,
    routePoints: [
      { lat: -6.2255, lng: 106.8012 },
      { lat: -6.222, lng: 106.8035 },
      { lat: -6.224, lng: 106.8055 },
      { lat: -6.228, lng: 106.8025 },
      { lat: -6.2255, lng: 106.8012 },
    ],
  },
  // 8. Bripka Yuda Nasution - Samapta R2
  '92031193': {
    lokasiTeks: 'Kawasan Stasiun MRT Fatmawati Raya, Cilandak',
    aktivitasDef: 'Patroli Preventif Lingkungan Stasiun MRT Cilandak - Fatmawati',
    category: 'samapta',
    iconEmoji: '🛵',
    speed: 22,
    routePoints: [
      { lat: -6.2534, lng: 106.7972 },
      { lat: -6.258, lng: 106.795 },
      { lat: -6.263, lng: 106.793 },
      { lat: -6.259, lng: 106.796 },
      { lat: -6.2534, lng: 106.7972 },
    ],
  },
  // 9. Aiptu Joko Susilo - Intelkam
  '79030219': {
    lokasiTeks: 'Kawasan Pemukiman & Sentra Niaga Radio Dalam Raya, Gandaria',
    aktivitasDef: 'Deteksi Dini & Pengumpulan Bahan Keterangan Kamtibmas Gandaria',
    category: 'intelkam',
    iconEmoji: '👮',
    speed: 18,
    routePoints: [
      { lat: -6.2505, lng: 106.7905 },
      { lat: -6.247, lng: 106.788 },
      { lat: -6.253, lng: 106.7865 },
      { lat: -6.255, lng: 106.7895 },
      { lat: -6.2505, lng: 106.7905 },
    ],
  },
};

/**
 * Kalkulasi interpolasi koordinat waypoint patroli secara dinamis & mulus
 * Mensimulasikan pergerakan patroli nyata 20-35 km/jam di koridor jalan
 */
function calculatePatrolPosition(
  baseLat: number,
  baseLng: number,
  routePoints: { lat: number; lng: number }[],
  offsetSeed: number = 0
): { lat: number; lng: number } {
  if (!routePoints || routePoints.length < 2) {
    return { lat: baseLat, lng: baseLng };
  }

  // Waktu putaran 1 putaran sektor = 180 detik
  const cycleDurationSec = 180;
  const nowSec = (Date.now() / 1000) + offsetSeed;
  const progress = (nowSec % cycleDurationSec) / cycleDurationSec;

  const totalSegments = Math.max(1, routePoints.length - 1);
  const currentSegment = Math.min(Math.floor(progress * totalSegments), routePoints.length - 1);
  const segProgress = (progress * totalSegments) - currentSegment;

  const p1 = routePoints[currentSegment];
  const p2 = routePoints[(currentSegment + 1) % routePoints.length] || p1;

  if (!p1 || !p2) return { lat: baseLat, lng: baseLng };

  const interpolatedLat = p1.lat + (p2.lat - p1.lat) * segProgress;
  const interpolatedLng = p1.lng + (p2.lng - p1.lng) * segProgress;

  return {
    lat: Number(interpolatedLat.toFixed(6)),
    lng: Number(interpolatedLng.toFixed(6)),
  };
}

/**
 * Mengambil armada patroli & seluruh personel piket yang bertugas secara riil dari database.
 * Melengkapi data: sedang di mana (lokasi/sektor), sedang melakukan apa (kegiatan taktis/insiden),
 * jejak pergerakan (waypoints), dan status kedinasan.
 */
export async function getPatrolFleetUnitsAction() {
  try {
    const now = Date.now();
    if (patrolFleetCache && now < patrolFleetCache.expiresAt) {
      return { success: true, data: patrolFleetCache.data };
    }

    // 1. Ambil seluruh personil polisi dengan role PERSONIL dari database beserta user, satuan, dan disposisi insiden aktif
    const [officers, vehicles, activeDispatches] = await Promise.all([
      prisma.policeOfficer.findMany({
        where: {
          user: {
            role: 'PERSONIL',
          },
        },
        include: {
          user: true,
          unit: true,
          station: true,
        },
        orderBy: { rank_pangkat: 'asc' },
      }),
      prisma.patrolVehicle.findMany({
        include: {
          unit: true,
          station: true,
        },
        orderBy: { id: 'asc' },
      }),
      prisma.complaintDispatch.findMany({
        where: {
          complaint: {
            status: { notIn: ['SELESAI', 'DITOLAK'] },
          },
        },
        include: {
          complaint: true,
          officer: { include: { user: true } },
        },
      }),
    ]);

    // Map active dispatch by officer NRP or ID
    const activeDispatchMap = new Map<string, any>();
    activeDispatches.forEach((d) => {
      if (d.officer?.nrp) activeDispatchMap.set(d.officer.nrp, d);
      if (d.officer_id) activeDispatchMap.set(d.officer_id.toString(), d);
    });

    const vehicleMap = new Map(vehicles.map((v) => [v.nomor_lambung, v]));
    const driverMap = new Map(officers.map((o) => [o.nrp, o]));

    // Format Personil Piket Aktif
    const formattedOfficers = officers.map((o, idx) => {
      const nrp = o.nrp;
      const sectorConfig = OFFICER_TACTICAL_SECTORS[nrp] || {
        lokasiTeks: o.station?.address || 'Wilayah Hukum Polres Metro Jakarta Selatan',
        aktivitasDef: 'Patroli Terpadu Presisi Kewilayahan',
        category: (o.jabatan || '').toLowerCase().includes('lantas') ? 'lantas' : 'samapta',
        iconEmoji: '🚔',
        speed: 20,
        routePoints: [
          { lat: -6.2415, lng: 106.8021 },
          { lat: -6.2435, lng: 106.8041 },
        ],
      };

      const baseLat = o.current_gps_lat ? Number(o.current_gps_lat) : -6.2415;
      const baseLng = o.current_gps_lng ? Number(o.current_gps_lng) : 106.8021;

      // Cek apakah personel sedang ditugaskan merespon pengaduan warga yang belum selesai
      const activeDispatch = activeDispatchMap.get(nrp) || activeDispatchMap.get(o.id.toString());
      let currentStatus = o.duty_status === 'PIKET_SPKT' ? 'SIAGA' : 'PATROLI';
      let statusColor = currentStatus === 'SIAGA' ? '#2563EB' : '#10B981';
      let statusLabel = currentStatus === 'SIAGA' ? 'Siaga Mako' : 'Patroli Aktif';
      let aktivitas = sectorConfig.aktivitasDef;
      let lokasiTeks = sectorConfig.lokasiTeks;
      let routePoints = sectorConfig.routePoints;
      let speedKmh = sectorConfig.speed;

      if (activeDispatch) {
        currentStatus = 'MENUJU_TKP';
        statusColor = '#EF4444';
        statusLabel = 'Menuju TKP';
        const ticket = activeDispatch.complaint?.nomor_tiket || '110';
        const jenis = activeDispatch.complaint?.jenis_kejadian || 'Insiden Lapangan';
        const tkpAddr = activeDispatch.complaint?.tkp_alamat_teks || 'TKP Wilayah';
        aktivitas = `Tanggap Darurat Tiket #${ticket}: ${jenis}`;
        lokasiTeks = `Meluncur ke ${tkpAddr}`;
        speedKmh = 45;

        if (activeDispatch.complaint?.tkp_lat && activeDispatch.complaint?.tkp_lng) {
          routePoints = [
            { lat: baseLat, lng: baseLng },
            {
              lat: Number(activeDispatch.complaint.tkp_lat),
              lng: Number(activeDispatch.complaint.tkp_lng),
            },
          ];
        }
      }

      // Hitung koordinat pergerakan halus (live dynamic pergerakan)
      const currentPos =
        currentStatus === 'SIAGA'
          ? { lat: baseLat, lng: baseLng }
          : calculatePatrolPosition(baseLat, baseLng, routePoints, idx * 35);

      const assignedVeh = o.assigned_patrol_vehicle ? vehicleMap.get(o.assigned_patrol_vehicle) : null;
      const ranmorStr = assignedVeh ? `${assignedVeh.nama_armada} (${assignedVeh.nomor_lambung})` : (o.assigned_patrol_vehicle || 'Ranmor Dinas Patroli');

      const rawFullName = o.user?.full_name || o.nrp;
      const rankPangkat = o.rank_pangkat || 'Personel';
      const cleanName = rawFullName.replace(new RegExp(`^${rankPangkat}\\s*`, 'i'), '').trim();
      const displayTitle = `${rankPangkat} ${cleanName}`;
      const unitName = o.unit?.unit_name || (o.jabatan?.includes('Samapta') ? 'Satuan Samapta' : o.jabatan?.includes('Reskrim') ? 'Satuan Reserse Kriminal' : o.jabatan?.includes('Lantas') ? 'Satuan Lalu Lintas' : 'Regu Presisi 110');

      return {
        key: `OFFICER-${o.nrp}`,
        nrp: o.nrp,
        officerId: o.id.toString(),
        pos: currentPos,
        iconEmoji: sectorConfig.iconEmoji,
        title: displayTitle,
        petugas: `${displayTitle} (NRP ${o.nrp})`,
        pangkat: rankPangkat,
        namaLengkap: displayTitle,
        satuan: unitName,
        jabatan: o.jabatan || 'Personil Piket Operasional',
        sub: `${unitName} • ${ranmorStr}`,
        status: currentStatus,
        statusLabel,
        statusColor,
        tugas: `Tugas: ${aktivitas}`,
        aktivitas,
        lokasiTeks,
        telemetri: speedKmh > 0 ? `Kecepatan: ${speedKmh} km/jam • GPS Live • Baterai ${85 + (idx % 12)}%` : `Standby Pos Mako • GPS Akurat • Baterai 96%`,
        speedKmh,
        batteryLevel: 85 + (idx % 12),
        category: sectorConfig.category,
        routePoints,
        assignedVehicle: o.assigned_patrol_vehicle || null,
        lastHeartbeat: o.last_gps_heartbeat_at || new Date().toISOString(),
      };
    });

    // Format Armada Patroli (Kendaraan Mobil / Motor)
    const formattedVehicles = vehicles.map((v) => {
      const driver = v.driver_officer_nrp ? driverMap.get(v.driver_officer_nrp) : null;
      const rawDriverName = driver?.user?.full_name || driver?.nrp || '';
      const driverRank = driver?.rank_pangkat || '';
      const cleanDriverName = driverRank ? rawDriverName.replace(new RegExp(`^${driverRank}\\s*`, 'i'), '').trim() : rawDriverName;
      const driverDisplayName = driverRank ? `${driverRank} ${cleanDriverName} (${driver?.nrp})` : (rawDriverName || 'Standby / Belum Diawaki');

      const unitName = v.unit?.unit_name || 'Satuan Patroli';
      const platStr = v.plat_nomor_polisi ? `Plat: ${v.plat_nomor_polisi}` : v.nomor_lambung;
      const statusOp = v.status_operasional || 'PATROLI';
      const statusColor = v.status_color || (statusOp === 'PATROLI' ? '#10B981' : '#2563EB');

      // Ambil rute pengemudi jika ada
      const driverSector = v.driver_officer_nrp ? OFFICER_TACTICAL_SECTORS[v.driver_officer_nrp] : null;
      const baseLat = Number(v.current_lat || -6.2415);
      const baseLng = Number(v.current_lng || 106.8021);
      const routePoints = driverSector?.routePoints || [
        { lat: baseLat, lng: baseLng },
        { lat: baseLat + 0.003, lng: baseLng + 0.003 },
      ];

      const currentPos = calculatePatrolPosition(baseLat, baseLng, routePoints, 15);

      return {
        key: v.nomor_lambung,
        nrp: v.driver_officer_nrp || null,
        pos: currentPos,
        iconEmoji: v.icon_emoji || (v.jenis_kendaraan === 'RODA_2' ? '🏍️' : '🚔'),
        title: v.nama_armada,
        petugas: driverDisplayName,
        pangkat: driver?.rank_pangkat || '-',
        namaLengkap: cleanDriverName || 'Pengemudi Armada',
        satuan: unitName,
        jabatan: `Pengemudi ${v.nama_armada}`,
        sub: `${unitName} • ${platStr}`,
        status: statusOp,
        statusLabel: statusOp === 'PATROLI' ? 'Patroli Aktif' : 'Standby Armada',
        statusColor,
        tugas: `Tugas: ${driverSector?.aktivitasDef || 'Patroli Keamanan & Ketertiban Wilayah Presisi'}`,
        aktivitas: driverSector?.aktivitasDef || 'Mobile Blue Light Patrol Beat Kewilayahan',
        lokasiTeks: driverSector?.lokasiTeks || 'Koridor Wilayah Hukum Polres Metro Jaksel',
        telemetri: v.speed_kmh ? `Kecepatan: ${v.speed_kmh} km/jam • GPS Aktif` : 'Sinyal GPS Aktif',
        speedKmh: v.speed_kmh || 25,
        batteryLevel: 92,
        category: v.unit?.key?.toLowerCase() || (v.jenis_kendaraan === 'RODA_2' ? 'perintis' : 'samapta'),
        routePoints,
        assignedVehicle: v.nomor_lambung,
      };
    });

    // Kembalikan HANYA personil piket yang bertugas dengan role PERSONIL (tanpa ranmor/kendaraan & tanpa role lain)
    const serialized = serializeBigInt(formattedOfficers);
    patrolFleetCache = { data: serialized, expiresAt: now + PATROL_FLEET_CACHE_TTL_MS };
    return { success: true, data: serialized };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Gagal mengambil data personel piket.',
    };
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
    await prisma.patrolVehicle.updateMany({
      where: { nomor_lambung: input.unitKey },
      data: {
        current_lat: input.lat,
        current_lng: input.lng,
        status_operasional: input.status || undefined,
        last_heartbeat_at: new Date(),
      },
    });

    patrolFleetCache = null;
    revalidatePath('/personil');
    revalidatePath('/command-center');
    revalidatePath('/console');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
