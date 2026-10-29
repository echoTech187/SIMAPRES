'use server';

// SIMAPRES 110 - Device Server Actions
import { prisma } from '@/infrastructure/db/prisma.client';

import { cacheInvalidate } from '@/infrastructure/cache/app-cache';

// Helper serialize BigInt
function serializeBigInt<T>(obj: T): T {
  return JSON.parse(
    JSON.stringify(obj, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    )
  );
}

// Inisialisasi tabel device_pairing_sessions di MySQL jika belum ada
let devicePairingTableReady: Promise<void> | null = null;

function ensureDevicePairingTable(): Promise<void> {
  if (!devicePairingTableReady) {
    devicePairingTableReady = createDevicePairingTable().catch((err) => {
      devicePairingTableReady = null;
      console.warn('ensureDevicePairingTable error:', err);
    });
  }
  return devicePairingTableReady;
}

async function createDevicePairingTable() {
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
}

export async function createDevicePairingSessionAction(input: {
  sessionToken: string;
  nrp?: string;
  unitId?: string;
}) {
  try {
    await ensureDevicePairingTable();

    await prisma.$executeRawUnsafe(
      `INSERT INTO device_pairing_sessions 
        (session_token, nrp, unit_id, status, created_at)
       VALUES (?, ?, ?, 'WAITING', NOW())
       ON DUPLICATE KEY UPDATE 
        nrp = VALUES(nrp), unit_id = VALUES(unit_id), updated_at = NOW()`,
      input.sessionToken,
      input.nrp || null,
      input.unitId || null
    );

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function pairDeviceSessionAction(input: {
  sessionToken?: string | null;
  deviceId: string;
  deviceBrand: string;
  nrp?: string | null;
  unitId?: string | null;
  lat: number;
  lng: number;
}) {
  try {
    await ensureDevicePairingTable();

    if (input.sessionToken) {
      await prisma.$executeRawUnsafe(
        `INSERT INTO device_pairing_sessions 
          (session_token, device_id, device_brand, nrp, unit_id, lat, lng, status, scanned_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'PAIRED', NOW(), NOW())
         ON DUPLICATE KEY UPDATE 
          device_id = VALUES(device_id),
          device_brand = VALUES(device_brand),
          nrp = COALESCE(VALUES(nrp), nrp),
          unit_id = COALESCE(VALUES(unit_id), unit_id),
          lat = VALUES(lat),
          lng = VALUES(lng),
          status = 'PAIRED',
          scanned_at = NOW(),
          updated_at = NOW()`,
        input.sessionToken,
        input.deviceId,
        input.deviceBrand,
        input.nrp || null,
        input.unitId || null,
        input.lat,
        input.lng
      );
    }

    // Eksklusivitas Perangkat (1 Device Fisik = 1 Akun Personil Aktif seperti WhatsApp):
    if (input.nrp && input.deviceId) {
      // 1. Lepaskan (unpair) deviceId ini dari akun personel lain yang sebelumnya pernah memindai
      await prisma.policeOfficer.updateMany({
        where: {
          device_id: input.deviceId,
          nrp: { not: input.nrp },
        },
        data: {
          device_id: null,
        },
      });

      // 2. Tandai sesi pairing lama dari device ini untuk akun lain sebagai UNPAIRED
      await prisma.$executeRawUnsafe(
        `UPDATE device_pairing_sessions 
         SET status = 'UNPAIRED', updated_at = NOW() 
         WHERE device_id = ? AND nrp != ? AND status = 'PAIRED'`,
        input.deviceId,
        input.nrp
      );

      // 3. Tautkan secara eksklusif ke akun personel yang saat ini memindai
      await prisma.policeOfficer.updateMany({
        where: { nrp: input.nrp },
        data: {
          current_gps_lat: input.lat,
          current_gps_lng: input.lng,
          last_gps_heartbeat_at: new Date(),
          device_id: input.deviceId,
        },
      });
    } else if (input.deviceId) {
      // Update telemetri koordinat jika hanya ada deviceId
      await prisma.policeOfficer.updateMany({
        where: { device_id: input.deviceId },
        data: {
          current_gps_lat: input.lat,
          current_gps_lng: input.lng,
          last_gps_heartbeat_at: new Date(),
        },
      });
    }

    cacheInvalidate('active_officers_units');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function checkDevicePairingSessionAction(sessionToken: string) {
  try {
    await ensureDevicePairingTable();

    const records: any[] = await prisma.$queryRawUnsafe(
      `SELECT session_token, device_id, device_brand, nrp, unit_id, 
              CAST(lat AS DOUBLE) as lat, CAST(lng AS DOUBLE) as lng, status, scanned_at
       FROM device_pairing_sessions
       WHERE session_token = ?
       LIMIT 1`,
      sessionToken
    );

    if (records.length === 0) {
      return { success: true, data: null };
    }

    const r = records[0];
    return {
      success: true,
      data: {
        sessionToken: r.session_token,
        deviceId: r.device_id,
        deviceBrand: r.device_brand,
        nrp: r.nrp,
        unitId: r.unit_id,
        lat: r.lat ? Number(r.lat) : null,
        lng: r.lng ? Number(r.lng) : null,
        status: r.status,
        scannedAt: r.scanned_at,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
