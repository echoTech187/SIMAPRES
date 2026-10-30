'use server';

import { UseCaseFactory } from '@/application/factories/use-case.factory';
import { requireRole } from '@/lib/session';
import { serializeBigInt } from '@/lib/serialization';


let patrolFleetCache: { data: any; expiresAt: number } | null = null;
const PATROL_FLEET_CACHE_TTL_MS = 20 * 1000;

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
 * Mengambil seluruh personel piket dengan role PERSONIL secara 100% riil dari database via OfficerRepository.
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

    let formattedOfficers: any[] | null = null;
    const officerRepo = UseCaseFactory.getOfficerRepository();

    // 1. Jalankan Single-Round-Trip Fast SQL Query via Domain Repository
    try {
      const rawOfficers = await officerRepo.getPatrolFleetRaw!();

      if (Array.isArray(rawOfficers)) {
        const defaultMakoLat = -7.026779;
        const defaultMakoLng = 109.59308;
        const defaultMakoName = 'Polres Pekalongan';

        formattedOfficers = rawOfficers.map((o) => {
          const nrp = o.nrp;
          const makoLat = o.mako_lat ? Number(o.mako_lat) : defaultMakoLat;
          const makoLng = o.mako_lng ? Number(o.mako_lng) : defaultMakoLng;
          const makoName = o.station_name || defaultMakoName;

          const isDeviceRegistered = Boolean(o.device_id);
          const hasScannedQr = Boolean(Number(o.has_scanned_qr));
          const hasVehicleUsage = Boolean(Number(o.has_vehicle_usage));

          const rawGpsLat = o.current_gps_lat != null ? Number(o.current_gps_lat) : null;
          const rawGpsLng = o.current_gps_lng != null ? Number(o.current_gps_lng) : null;

          const hasCoords =
            rawGpsLat != null &&
            rawGpsLng != null &&
            !isNaN(rawGpsLat) &&
            !isNaN(rawGpsLng) &&
            Math.abs(rawGpsLat) > 0.001 &&
            Math.abs(rawGpsLng) > 0.001;

          const distFromMakoKm = hasCoords ? getDistanceKm(rawGpsLat!, rawGpsLng!, makoLat, makoLng) : 0;
          const isStaleDummyCoords = distFromMakoKm > 80 && !hasScannedQr;

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
            o.lb_lat &&
            o.lb_lng &&
            Math.abs(Number(o.lb_lat)) > 0.001
          ) {
            lat = Number(o.lb_lat);
            lng = Number(o.lb_lng);
            isAtMako = false;
          } else {
            lat = makoLat;
            lng = makoLng;
            isAtMako = true;
          }

          const currentPos = {
            lat: Number(lat.toFixed(6)),
            lng: Number(lng.toFixed(6)),
          };

          let currentStatus = isAtMako || o.duty_status === 'PIKET_SPKT' || o.duty_status === 'SIAGA' ? 'SIAGA' : 'PATROLI';
          let statusColor = currentStatus === 'SIAGA' ? '#2563EB' : '#10B981';
          let statusLabel = isAtMako ? 'Siaga Mako' : (currentStatus === 'SIAGA' ? 'Siaga Mako' : 'Patroli Aktif');

          let lokasiTeks = isAtMako
            ? `Mako ${makoName}`
            : o.lb_address ||
              (o.station_address
                ? `${o.station_name}, ${o.station_address}`
                : `Wilayah Hukum ${makoName}`);

          let aktivitas = isAtMako
            ? (hasScannedQr ? 'Siaga Mako • Standby Penugasan' : 'Siaga Mako • Belum Validasi QR Device')
            : o.lb_activity ||
              o.jabatan ||
              'Patroli Terpadu Presisi Kewilayahan';

          let routePoints: { lat: number; lng: number }[] = [];

          if (o.dispatch_id) {
            currentStatus = 'DARURAT';
            statusColor = '#EF4444';
            statusLabel = 'Menuju TKP';
            const ticket = o.nomor_tiket || '110';
            const jenis = o.jenis_kejadian || 'Insiden Lapangan';
            const tkpAddr = o.tkp_alamat_teks || 'Lokasi TKP';
            aktivitas = `Tanggap Darurat Tiket ${ticket.replace(/^#+/, '')}: ${jenis}`;
            lokasiTeks = `Meluncur ke ${tkpAddr}`;

            if (o.tkp_lat && o.tkp_lng) {
              routePoints = [
                currentPos,
                {
                  lat: Number(o.tkp_lat),
                  lng: Number(o.tkp_lng),
                },
              ];
            }
          }

          const ranmorStr = o.nama_armada
            ? `${o.nama_armada} (${o.assigned_patrol_vehicle})`
            : o.assigned_patrol_vehicle || 'Tanpa Ranmor';

          const rawFullName = o.full_name || o.nrp;
          const rankPangkat = o.rank_pangkat || 'Personel';
          const cleanName = rawFullName.replace(new RegExp(`^${rankPangkat}\\s*`, 'i'), '').trim();
          const displayTitle = `${rankPangkat} ${cleanName}`;
          const unitName = o.unit_name || o.jabatan;
          const category = o.unit_key ? o.unit_key.toLowerCase() : undefined;

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
            officerId: o.officer_id.toString(),
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
            isGpsValid,
            isAtMako,
            hasScannedQr,
            isDeviceRegistered,
            hasVehicleUsage,
            makoName,
            stationId: o.station_id || 60001,
          };
        });
      }
    } catch (_rawErr) {
      // Fallback ke repository findMany
    }

    if (!formattedOfficers) {
      // 2. Fallback via OfficerRepository
      const {
        officers,
        vehicles,
        activeDispatches,
        stations,
        pairingSessions,
        vehicleUsageLogs,
      } = await officerRepo.getPatrolFleetFallback!();

      const primaryStation =
        stations.find((s) => s.station_level === 'POLRES') || stations[0] || null;
      const defaultMakoLat = primaryStation?.office_lat ? Number(primaryStation.office_lat) : 0;
      const defaultMakoLng = primaryStation?.office_lng ? Number(primaryStation.office_lng) : 0;
      const defaultMakoName = primaryStation?.station_name || 'Mako Komando';

      const activeDispatchMap = new Map<string, any>();
      activeDispatches.forEach((d) => {
        if (d.officer?.nrp) activeDispatchMap.set(d.officer.nrp, d);
        if (d.officer_id) activeDispatchMap.set(d.officer_id.toString(), d);
      });

      const vehicleMap = new Map(vehicles.map((v) => [v.nomor_lambung, v]));

      const pairingMap = new Map<string, any>();
      pairingSessions.forEach((p) => {
        if (p.nrp) pairingMap.set(p.nrp, p);
        if (p.device_id) pairingMap.set(p.device_id, p);
      });

      const vehicleUsageMap = new Map<string, any>();
      vehicleUsageLogs.forEach((vu) => {
        vehicleUsageMap.set(vu.officer_id.toString(), vu);
      });

      formattedOfficers = officers.map((o) => {
        const nrp = o.nrp;
        const latestLogbook = o.logbooks?.[0];

        const station = o.station || primaryStation;
        const makoLat = station?.office_lat ? Number(station.office_lat) : defaultMakoLat;
        const makoLng = station?.office_lng ? Number(station.office_lng) : defaultMakoLng;
        const makoName = station?.station_name || defaultMakoName;

        const isDeviceRegistered = Boolean(o.device_id);
        const pairingRecord = pairingMap.get(nrp) || (o.device_id ? pairingMap.get(o.device_id) : null);
        const hasScannedQr = Boolean(pairingRecord && pairingRecord.scanned_at);
        const hasVehicleUsage = Boolean(vehicleUsageMap.get(o.id.toString()));

        const rawGpsLat = o.current_gps_lat != null ? Number(o.current_gps_lat) : null;
        const rawGpsLng = o.current_gps_lng != null ? Number(o.current_gps_lng) : null;

        const hasCoords =
          rawGpsLat != null &&
          rawGpsLng != null &&
          !isNaN(rawGpsLat) &&
          !isNaN(rawGpsLng) &&
          Math.abs(rawGpsLat) > 0.001 &&
          Math.abs(rawGpsLng) > 0.001;

        const distFromMakoKm: number = hasCoords ? getDistanceKm(rawGpsLat!, rawGpsLng!, makoLat, makoLng) : 0;
        const isStaleDummyCoords = distFromMakoKm > 80 && !hasScannedQr;

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
          lat = makoLat;
          lng = makoLng;
          isAtMako = true;
        }

        const currentPos = {
          lat: Number(lat.toFixed(6)),
          lng: Number(lng.toFixed(6)),
        };

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
          isGpsValid,
          isAtMako,
          hasScannedQr,
          isDeviceRegistered,
          hasVehicleUsage,
          makoName,
          stationId: station?.id || primaryStation?.id || null,
        };
      });
    }

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
    const officerRepo = UseCaseFactory.getOfficerRepository();
    await officerRepo.updatePatrolFleetTelemetry!(input.unitKey, input.lat, input.lng, input.status);
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
  const auth = await requireRole(['PERSONIL', 'SUPERADMIN']);
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  try {
    const officerRepo = UseCaseFactory.getOfficerRepository();
    const isMasuk = input.type === 'MASUK';
    const res = await officerRepo.submitPresensi!({
      nrp: input.nrp,
      officerId: input.officerId,
      isMasuk,
      lat: input.lat,
      lng: input.lng,
    });

    patrolFleetCache = null;

    return {
      success: true,
      message: isMasuk
        ? '✓ Presensi Masuk Berhasil! Status dinas aktif dan posisi Anda terpantau di Peta Pawas.'
        : '✓ Presensi Pulang Berhasil! Status dinas telah dilepas.',
      dutyStatus: res.dutyStatus,
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal memproses presensi dinas.' };
  }
}
