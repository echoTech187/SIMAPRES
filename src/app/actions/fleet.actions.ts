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
const PATROL_FLEET_CACHE_TTL_MS = 15 * 1000; // 15 detik

/**
 * Mengambil armada patroli & personel on-duty riil dari database (tabel patrol_vehicles & police_officers)
 * 100% data dinamis murni tanpa data tiruan / mock.
 */
export async function getPatrolFleetUnitsAction() {
  try {
    const now = Date.now();
    if (patrolFleetCache && now < patrolFleetCache.expiresAt) {
      return { success: true, data: patrolFleetCache.data };
    }

    // 1. Ambil armada patroli resmi yang memiliki koordinat GPS aktif
    const vehicles = await prisma.patrolVehicle.findMany({
      where: {
        current_lat: { not: null },
        current_lng: { not: null },
      },
      include: {
        unit: true,
        station: true,
      },
      orderBy: { id: 'asc' },
    });

    // 2. Ambil data pengemudi personil jika armada sedang diawaki
    const driverNrps = vehicles
      .map((v) => v.driver_officer_nrp)
      .filter(Boolean) as string[];

    const drivers =
      driverNrps.length > 0
        ? await prisma.policeOfficer.findMany({
            where: { nrp: { in: driverNrps } },
            include: { user: true },
          })
        : [];
    const driverMap = new Map(drivers.map((d) => [d.nrp, d]));

    const formattedVehicles = vehicles.map((v) => {
      const driver = v.driver_officer_nrp ? driverMap.get(v.driver_officer_nrp) : null;
      const driverName = driver?.user?.full_name
        ? `${driver.rank_pangkat || ''} ${driver.user.full_name} (${driver.nrp})`.trim()
        : 'Standby / Belum Diawaki';

      const unitName = v.unit?.unit_name || 'Satuan Patroli';
      const platStr = v.plat_nomor_polisi ? `Plat: ${v.plat_nomor_polisi}` : v.nomor_lambung;
      const statusOp = v.status_operasional || 'SIAGA';
      const statusColor = v.status_color || (statusOp === 'PATROLI' ? '#10B981' : '#2563EB');

      return {
        key: v.nomor_lambung,
        nrp: v.driver_officer_nrp || null,
        pos: { lat: Number(v.current_lat), lng: Number(v.current_lng) },
        iconEmoji: v.icon_emoji || (v.jenis_kendaraan === 'RODA_2' ? '🏍️' : '🚔'),
        title: v.nama_armada,
        petugas: driverName,
        sub: `${unitName} • ${platStr}`,
        status: `Status: ${statusOp}`,
        statusColor,
        tugas: `Tugas: ${v.unit?.duties ? v.unit.duties.slice(0, 80) : 'Patroli Keamanan & Ketertiban Wilayah'}`,
        telemetri: v.speed_kmh ? `Kecepatan: ${v.speed_kmh} km/jam • GPS Aktif` : 'Sinyal GPS Aktif',
        category: v.unit?.key?.toLowerCase() || (v.jenis_kendaraan === 'RODA_2' ? 'perintis' : 'samapta'),
      };
    });

    // 3. Ambil juga personil lapangan on-duty yang sedang berpatroli aktif dengan live GPS (di luar pengemudi mobil di atas)
    const activeOfficers = await prisma.policeOfficer.findMany({
      where: {
        current_gps_lat: { not: null },
        current_gps_lng: { not: null },
        duty_status: { notIn: ['LEPAS_DINAS'] },
        nrp: { notIn: driverNrps },
      },
      include: {
        user: true,
        unit: true,
      },
    });

    const formattedOfficers = activeOfficers.map((o) => {
      const isMotor = (o.jabatan || '').toLowerCase().includes('perintis') || (o.jabatan || '').toLowerCase().includes('r2');
      const isLantas = (o.jabatan || '').toLowerCase().includes('lantas');
      const cat = isLantas ? 'lantas' : isMotor ? 'perintis' : 'samapta';
      const icon = isMotor ? '🏍️' : isLantas ? '🚓' : '🚔';

      return {
        key: `OFFICER-${o.nrp}`,
        nrp: o.nrp,
        pos: { lat: Number(o.current_gps_lat), lng: Number(o.current_gps_lng) },
        iconEmoji: icon,
        title: `${o.rank_pangkat} ${o.user?.full_name || o.nrp}`,
        petugas: `${o.rank_pangkat} ${o.user?.full_name || o.nrp} (NRP ${o.nrp})`,
        sub: o.jabatan || 'Personil Operasional Presisi',
        status: `Status: ${o.duty_status}`,
        statusColor: o.duty_status === 'DINAS_PATROLI' ? '#10B981' : '#2563EB',
        tugas: `Tugas: Patroli Lapangan Sektor`,
        telemetri: 'GPS Telemetri Smartphone Aktif',
        category: cat,
      };
    });

    const combined = [...formattedVehicles, ...formattedOfficers];
    const serialized = serializeBigInt(combined);
    patrolFleetCache = { data: serialized, expiresAt: now + PATROL_FLEET_CACHE_TTL_MS };
    return { success: true, data: serialized };
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
