/**
 * SIMAPRES 110 - INFRASTRUCTURE REPOSITORY: DEVICE HARDWARE BINDING
 * Lapisan: Infrastructure (Prisma & MySQL Implementation)
 */

import { prisma } from '../db/prisma.client';
import { IDeviceRepository } from '@/domain/repositories/device.repository.interface';

export class PrismaDeviceRepository implements IDeviceRepository {
  private static tableReadyPromise: Promise<void> | null = null;

  private async ensureTable(): Promise<void> {
    if (!PrismaDeviceRepository.tableReadyPromise) {
      PrismaDeviceRepository.tableReadyPromise = prisma
        .$executeRawUnsafe(`
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
        `)
        .then(() => {})
        .catch((err) => {
          PrismaDeviceRepository.tableReadyPromise = null;
          console.warn('ensureDevicePairingTable error:', err);
        });
    }
    return PrismaDeviceRepository.tableReadyPromise;
  }

  async createPairingSession(sessionToken: string, nrp?: string, unitId?: string): Promise<any> {
    await this.ensureTable();
    await prisma.$executeRawUnsafe(
      `INSERT INTO device_pairing_sessions 
        (session_token, nrp, unit_id, status, created_at)
       VALUES (?, ?, ?, 'WAITING', NOW())
       ON DUPLICATE KEY UPDATE 
        nrp = VALUES(nrp),
        unit_id = VALUES(unit_id),
        status = 'WAITING',
        updated_at = NOW();`,
      sessionToken,
      nrp || null,
      unitId || null
    );

    return { sessionToken, status: 'WAITING' };
  }

  async getPairingSession(sessionToken: string): Promise<any | null> {
    await this.ensureTable();
    const rows: any[] = await prisma.$queryRawUnsafe(
      `SELECT session_token, device_id, device_brand, nrp, unit_id, lat, lng, status, scanned_at, created_at, updated_at
       FROM device_pairing_sessions
       WHERE session_token = ?
       LIMIT 1;`,
      sessionToken
    );

    if (!rows || rows.length === 0) return null;
    return rows[0];
  }

  async confirmPairingSession(
    sessionToken: string,
    deviceId: string,
    deviceBrand?: string,
    lat?: number,
    lng?: number
  ): Promise<any> {
    await this.ensureTable();
    await prisma.$executeRawUnsafe(
      `UPDATE device_pairing_sessions
       SET device_id = ?,
           device_brand = ?,
           lat = ?,
           lng = ?,
           status = 'PAIRED',
           scanned_at = NOW(),
           updated_at = NOW()
       WHERE session_token = ?;`,
      deviceId,
      deviceBrand || null,
      lat ?? null,
      lng ?? null,
      sessionToken
    );

    const rows: any[] = await prisma.$queryRawUnsafe(
      `SELECT session_token, device_id, device_brand, nrp, unit_id, lat, lng, status, scanned_at
       FROM device_pairing_sessions
       WHERE session_token = ?
       LIMIT 1;`,
      sessionToken
    );

    return rows && rows.length > 0 ? rows[0] : null;
  }

  async bindOfficerDevice(input: {
    sessionToken?: string | null;
    deviceId: string;
    deviceBrand: string;
    nrp?: string | null;
    unitId?: string | null;
    lat: number;
    lng: number;
  }): Promise<void> {
    await this.ensureTable();

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

    if (input.nrp && input.deviceId) {
      await prisma.policeOfficer.updateMany({
        where: {
          device_id: input.deviceId,
          nrp: { not: input.nrp },
        },
        data: {
          device_id: null,
        },
      });

      await prisma.$executeRawUnsafe(
        `UPDATE device_pairing_sessions 
         SET status = 'UNPAIRED', updated_at = NOW() 
         WHERE device_id = ? AND nrp != ? AND status = 'PAIRED'`,
        input.deviceId,
        input.nrp
      );

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
      await prisma.policeOfficer.updateMany({
        where: { device_id: input.deviceId },
        data: {
          current_gps_lat: input.lat,
          current_gps_lng: input.lng,
          last_gps_heartbeat_at: new Date(),
        },
      });
    }
  }

  async checkPairingSession(sessionToken: string): Promise<any | null> {
    await this.ensureTable();
    const records: any[] = await prisma.$queryRawUnsafe(
      `SELECT session_token, device_id, device_brand, nrp, unit_id, 
              CAST(lat AS DOUBLE) as lat, CAST(lng AS DOUBLE) as lng, status, scanned_at
       FROM device_pairing_sessions
       WHERE session_token = ?
       LIMIT 1`,
      sessionToken
    );

    if (!records || records.length === 0) return null;
    const r = records[0];
    return {
      sessionToken: r.session_token,
      deviceId: r.device_id,
      deviceBrand: r.device_brand,
      nrp: r.nrp,
      unitId: r.unit_id,
      lat: r.lat ? Number(r.lat) : null,
      lng: r.lng ? Number(r.lng) : null,
      status: r.status,
      scannedAt: r.scanned_at,
    };
  }
}

