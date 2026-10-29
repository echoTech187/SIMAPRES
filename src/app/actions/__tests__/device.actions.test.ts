import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createDevicePairingSessionAction, pairDeviceSessionAction } from '../device.actions';
import { prisma } from '@/infrastructure/db/prisma.client';

describe('Server Action Integration: device.actions (QR Hardware Pairing)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (prisma as any).$executeRawUnsafe = vi.fn().mockResolvedValue(1);
  });

  describe('createDevicePairingSessionAction', () => {
    it('creates a new pairing session with WAITING status in database', async () => {
      const result = await createDevicePairingSessionAction({
        sessionToken: 'SESSION-TOKEN-TEST-12345',
        nrp: '88010088',
        unitId: '2',
      });

      expect(result.success).toBe(true);
      expect((prisma as any).$executeRawUnsafe).toHaveBeenCalled();
    });

    it('handles database error gracefully and returns failure', async () => {
      (prisma as any).$executeRawUnsafe = vi.fn().mockRejectedValue(new Error('DB Connection Timeout'));

      const result = await createDevicePairingSessionAction({
        sessionToken: 'FAIL-TOKEN',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('DB Connection Timeout');
    });
  });

  describe('pairDeviceSessionAction', () => {
    it('binds deviceId to officer and unbinds from other officers to ensure hardware exclusivity', async () => {
      const updateManySpy = vi.spyOn(prisma.policeOfficer, 'updateMany').mockResolvedValue({ count: 1 } as any);

      const result = await pairDeviceSessionAction({
        sessionToken: 'SESSION-TOKEN-TEST-12345',
        deviceId: 'SAMSUNG-GALAXY-A54-POLRI',
        deviceBrand: 'Samsung',
        nrp: '88010088',
        unitId: '2',
        lat: -7.0267,
        lng: 109.593,
      });

      expect(result.success).toBe(true);
      // Memastikan pelepasan (unpair) deviceId dari akun personel lain
      expect(updateManySpy).toHaveBeenCalledWith({
        where: {
          device_id: 'SAMSUNG-GALAXY-A54-POLRI',
          nrp: { not: '88010088' },
        },
        data: { device_id: null },
      });
      // Memastikan pengikatan (pair) ke akun personel aktif
      expect(updateManySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { nrp: '88010088' },
          data: expect.objectContaining({
            device_id: 'SAMSUNG-GALAXY-A54-POLRI',
            current_gps_lat: -7.0267,
            current_gps_lng: 109.593,
          }),
        })
      );
    });
  });
});
