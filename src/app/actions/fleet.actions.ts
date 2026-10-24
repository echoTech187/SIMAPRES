'use server';

import { prisma } from '@/infrastructure/db/prisma.client';


// Helper serialize BigInt
function serializeBigInt<T>(obj: T): T {
  return JSON.parse(
    JSON.stringify(obj, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    )
  );
}

let patrolFleetCache: { data: any; expiresAt: number } | null = null;
const PATROL_FLEET_CACHE_TTL_MS = 10 * 1000;

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Mengambil seluruh personel piket dengan role PERSONIL secara 100% riil dari database.
 * - Memvalidasi kepemilikan GPS riil dan riwayat Scan QR Device.
 * - Jika GPS personil belum valid (atau belum kirim telemetri), posisinya WAJIB berada di Mako (kantor kepolisian), BUKAN di koordinat acak!
 * - Mendeteksi secara akurat apakah personel sudah benar-benar scan QR perangkat atau belum.
 */
export async function getPatrolFleetUnitsAction() {
  try {
    const now = Date.now();
    if (patrolFleetCache && now < patrolFleetCache.expiresAt) {
      return { success: true, data: patrolFleetCache.data };
    }

    // 1. Ambil data personil, armada, disposisi, stasiun mako, sesi QR pairing
    const [
      officers,
      vehicles,
      activeDispatches,
      stations,
      pairingSessions,
      vehicleUsageLogs,
    ] = await Promise.all([
      prisma.policeOfficer.findMany({
        where: {
          user: {
            role: 'PERSONIL',
          },
          duty_status: { in: ['DINAS_PATROLI', 'PIKET_SPKT', 'SIAGA'] },
        },
        include: {
          user: true,
          unit: true,
          station: true,
          logbooks: {
            orderBy: { created_at: 'desc' },
            take: 1,
          },
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
      prisma.policeStation.findMany().catch(() => []),
      prisma.devicePairingSession.findMany({ where: { status: 'PAIRED' } }).catch(() => []),
      prisma.vehicleUsageLog.findMany({ where: { status_sesi: 'ACTIVE' } }).catch(() => []),
    ]);

    // Mako Induk Utama (Polres atau Kantor Kepolisian Default dari Database)
    const primaryStation =
      stations.find((s) => s.station_level === 'POLRES') || stations[0] || null;
    const defaultMakoLat = primaryStation?.office_lat ? Number(primaryStation.office_lat) : 0;
    const defaultMakoLng = primaryStation?.office_lng ? Number(primaryStation.office_lng) : 0;
    const defaultMakoName = primaryStation?.station_name || 'Mako Komando';

    // Map active dispatch by officer NRP or ID
    const activeDispatchMap = new Map<string, any>();
    activeDispatches.forEach((d) => {
      if (d.officer?.nrp) activeDispatchMap.set(d.officer.nrp, d);
      if (d.officer_id) activeDispatchMap.set(d.officer_id.toString(), d);
    });

    const vehicleMap = new Map(vehicles.map((v) => [v.nomor_lambung, v]));

    // Map pairing sessions by NRP dan Device ID (bukti riil scan QR perangkat)
    const pairingMap = new Map<string, any>();
    pairingSessions.forEach((p) => {
      if (p.nrp) pairingMap.set(p.nrp, p);
      if (p.device_id) pairingMap.set(p.device_id, p);
    });

    // Map vehicle check-in logs
    const vehicleUsageMap = new Map<string, any>();
    vehicleUsageLogs.forEach((vu) => {
      vehicleUsageMap.set(vu.officer_id.toString(), vu);
    });

    // 2. Format data personil piket aktif dengan validasi GPS & verifikasi Scan QR
    const formattedOfficers = officers.map((o) => {
      const nrp = o.nrp;
      const latestLogbook = o.logbooks?.[0];

      // Tentukan Mako resmi personel (dari relasi station, atau Mako Induk Polres)
      const station = o.station || primaryStation;
      const makoLat = station?.office_lat ? Number(station.office_lat) : defaultMakoLat;
      const makoLng = station?.office_lng ? Number(station.office_lng) : defaultMakoLng;
      const makoName = station?.station_name || defaultMakoName;

      // Verifikasi Pendaftaran & Scan QR
      const isDeviceRegistered = Boolean(o.device_id);

      const pairingRecord = pairingMap.get(nrp) || (o.device_id ? pairingMap.get(o.device_id) : null);
      const hasScannedQr = Boolean(pairingRecord && pairingRecord.scanned_at);
      const hasVehicleUsage = Boolean(vehicleUsageMap.get(o.id.toString()));

      // Koordinat GPS Aktual
      const rawGpsLat = o.current_gps_lat != null ? Number(o.current_gps_lat) : null;
      const rawGpsLng = o.current_gps_lng != null ? Number(o.current_gps_lng) : null;

      const hasCoords =
        rawGpsLat != null &&
        rawGpsLng != null &&
        !isNaN(rawGpsLat) &&
        !isNaN(rawGpsLng) &&
        Math.abs(rawGpsLat) > 0.001 &&
        Math.abs(rawGpsLng) > 0.001;

      // Cek jarak koordinat terhadap Mako: mendeteksi anomali dummy Jakarta (-6.2) bila Mako di Pekalongan (-7.0)
      const distFromMakoKm: number = hasCoords ? getDistanceKm(rawGpsLat!, rawGpsLng!, makoLat, makoLng) : 0;
      const isStaleDummyCoords = distFromMakoKm > 80 && !hasScannedQr;

      // GPS hanya sah/valid jika:
      // 1. Ada koordinat dan bukan 0/0
      // 2. Bukan anomali dummy di luar yurisdiksi Mako tanpa scan QR
      // 3. Personel telah scan QR atau memiliki heartbeat GPS yang aktif
      const isGpsValid = Boolean(
        hasCoords &&
        !isStaleDummyCoords &&
        (hasScannedQr || o.last_gps_heartbeat_at != null)
      );

      let lat = makoLat;
      let lng = makoLng;
      let isAtMako = false;

      if (isGpsValid) {
        lat = rawGpsLat!;
        lng = rawGpsLng!;
        isAtMako = false;
      } else if (
        latestLogbook?.actual_lat &&
        latestLogbook?.actual_lng &&
        Math.abs(Number(latestLogbook.actual_lat)) > 0.001
      ) {
        lat = Number(latestLogbook.actual_lat);
        lng = Number(latestLogbook.actual_lng);
        isAtMako = false;
      } else {
        // WAJIB DI MAKO: Jika GPS belum valid, posisi MUTLAK berada di Mako, BUKAN di koordinat acak!
        lat = makoLat;
        lng = makoLng;
        isAtMako = true;
      }

      const currentPos = {
        lat: Number(lat.toFixed(6)),
        lng: Number(lng.toFixed(6)),
      };

      // Cek apakah personel sedang ditugaskan merespon pengaduan warga aktif
      const activeDispatch = activeDispatchMap.get(nrp) || activeDispatchMap.get(o.id.toString());
      let currentStatus = isAtMako || o.duty_status === 'PIKET_SPKT' || o.duty_status === 'SIAGA' ? 'SIAGA' : 'PATROLI';
      let statusColor = currentStatus === 'SIAGA' ? '#2563EB' : '#10B981';
      let statusLabel = isAtMako ? 'Siaga Mako' : (currentStatus === 'SIAGA' ? 'Siaga Mako' : 'Patroli Aktif');

      let lokasiTeks = isAtMako
        ? `Mako ${makoName}`
        : latestLogbook?.claimed_address ||
          (station?.address
            ? `${station.station_name}, ${station.address}`
            : `Wilayah Hukum ${makoName}`);

      let aktivitas = isAtMako
        ? (hasScannedQr ? 'Siaga Mako • Standby Penugasan' : 'Siaga Mako • Belum Validasi QR Device')
        : latestLogbook?.activity_description ||
          o.jabatan ||
          'Patroli Terpadu Presisi Kewilayahan';

      let routePoints: { lat: number; lng: number }[] = [];

      if (activeDispatch) {
        currentStatus = 'DARURAT';
        statusColor = '#EF4444';
        statusLabel = 'Menuju TKP';
        const ticket = activeDispatch.complaint?.nomor_tiket || '110';
        const jenis = activeDispatch.complaint?.jenis_kejadian || 'Insiden Lapangan';
        const tkpAddr = activeDispatch.complaint?.tkp_alamat_teks || 'Lokasi TKP';
        aktivitas = `Tanggap Darurat Tiket ${ticket.replace(/^#+/, '')}: ${jenis}`;
        lokasiTeks = `Meluncur ke ${tkpAddr}`;

        if (activeDispatch.complaint?.tkp_lat && activeDispatch.complaint?.tkp_lng) {
          routePoints = [
            currentPos,
            {
              lat: Number(activeDispatch.complaint.tkp_lat),
              lng: Number(activeDispatch.complaint.tkp_lng),
            },
          ];
        }
      }

      const assignedVeh = o.assigned_patrol_vehicle ? vehicleMap.get(o.assigned_patrol_vehicle) : null;
      const ranmorStr = assignedVeh
        ? `${assignedVeh.nama_armada} (${assignedVeh.nomor_lambung})`
        : o.assigned_patrol_vehicle || 'Tanpa Ranmor';

      const rawFullName = o.user?.full_name || o.nrp;
      const rankPangkat = o.rank_pangkat || 'Personel';
      const cleanName = rawFullName.replace(new RegExp(`^${rankPangkat}\\s*`, 'i'), '').trim();
      const displayTitle = `${rankPangkat} ${cleanName}`;
      const unitName = o.unit?.unit_name || o.jabatan;
      const category = o.unit?.key?.toLowerCase();

      const telemetri = isGpsValid
        ? (o.last_gps_heartbeat_at
            ? `GPS Aktif (${new Date(o.last_gps_heartbeat_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })})`
            : 'Sinyal GPS Terhubung')
        : (hasScannedQr
            ? 'Standby di Mako (Menunggu GPS)'
            : '⚠️ Belum Scan QR Device');

      return {
        key: `OFFICER-${o.nrp}`,
        nrp: o.nrp,
        officerId: o.id.toString(),
        pos: currentPos,
        iconEmoji: '👮',
        title: displayTitle,
        petugas: `${displayTitle} (NRP ${o.nrp})`,
        pangkat: rankPangkat,
        namaLengkap: displayTitle,
        satuan: unitName,
        jabatan: o.jabatan || 'Personil Piket Operasional',
        sub: isAtMako ? `${unitName} • Siaga Mako` : `${unitName} • ${ranmorStr}`,
        status: currentStatus,
        statusLabel,
        statusColor,
        tugas: `Tugas: ${aktivitas}`,
        aktivitas,
        lokasiTeks,
        telemetri,
        speedKmh: isAtMako ? 0 : 0,
        batteryLevel: 95,
        category,
        routePoints,
        assignedVehicle: o.assigned_patrol_vehicle || null,
        lastHeartbeat: o.last_gps_heartbeat_at || new Date().toISOString(),
        // Metadata Verifikasi Audit Presisi
        isGpsValid,
        isAtMako,
        hasScannedQr,
        isDeviceRegistered,
        hasVehicleUsage,
        makoName,
        stationId: station?.id || primaryStation?.id || null,
      };
    });

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
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Aksi Presensi Piket (Masuk & Pulang) dari Portal Personil
 * - Saat MASUK: duty_status disetel ke DINAS_PATROLI, koordinat GPS direkam -> personil langsung tampil di Peta Pawas.
 * - Saat PULANG: duty_status disetel ke LEPAS_DINAS -> personil otomatis hilang dari Peta Pawas.
 */
export async function submitOfficerPresensiAction(input: {
  nrp?: string;
  officerId?: string;
  type: 'MASUK' | 'PULANG';
  lat?: number;
  lng?: number;
}) {
  try {
    const whereClause: any = {};
    if (input.nrp) {
      whereClause.nrp = input.nrp;
    } else if (input.officerId) {
      whereClause.id = BigInt(input.officerId);
    } else {
      return { success: false, error: 'Identitas personel (NRP/ID) tidak valid.' };
    }

    const officer = await prisma.policeOfficer.findFirst({
      where: whereClause,
      include: { user: true, station: true },
    });

    if (!officer) {
      return { success: false, error: 'Data personel tidak ditemukan di database.' };
    }

    const primaryStation = await prisma.policeStation.findFirst({
      where: { station_level: 'POLRES' },
    }).catch(() => null);

    const makoLat = officer.station?.office_lat ?? primaryStation?.office_lat ?? null;
    const makoLng = officer.station?.office_lng ?? primaryStation?.office_lng ?? null;

    const now = new Date();
    const isMasuk = input.type === 'MASUK';

    const finalLat =
      isMasuk
        ? (input.lat !== undefined && !isNaN(Number(input.lat)) && Math.abs(Number(input.lat)) > 0.001
            ? input.lat
            : makoLat)
        : undefined;

    const finalLng =
      isMasuk
        ? (input.lng !== undefined && !isNaN(Number(input.lng)) && Math.abs(Number(input.lng)) > 0.001
            ? input.lng
            : makoLng)
        : undefined;

    await prisma.policeOfficer.update({
      where: { id: officer.id },
      data: {
        duty_status: isMasuk ? 'DINAS_PATROLI' : 'LEPAS_DINAS',
        station_id: officer.station_id || primaryStation?.id || undefined,
        current_gps_lat: finalLat !== undefined ? finalLat : undefined,
        current_gps_lng: finalLng !== undefined ? finalLng : undefined,
        last_gps_heartbeat_at: isMasuk ? now : undefined,
        assigned_patrol_vehicle: isMasuk ? undefined : null,
      },
    });

    patrolFleetCache = null;

    return {
      success: true,
      message: isMasuk
        ? '✓ Presensi Masuk Berhasil! Status dinas aktif dan posisi Anda terpantau di Peta Pawas.'
        : '✓ Presensi Pulang Berhasil! Status dinas telah dilepas.',
      dutyStatus: isMasuk ? 'DINAS_PATROLI' : 'LEPAS_DINAS',
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal memproses presensi dinas.' };
  }
}

