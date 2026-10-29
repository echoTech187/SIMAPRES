import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loginInternalAction, logoutAction } from '../auth.actions';
import { UseCaseFactory } from '@/application/factories/use-case.factory';
import * as sessionModule from '@/lib/session';

const mockCookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
};

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockImplementation(async () => mockCookieStore),
}));

vi.mock('@/infrastructure/logging/activity-logger', () => ({
  logUserActivity: vi.fn().mockResolvedValue(undefined),
}));

describe('Server Action Integration: auth.actions (loginInternalAction & logoutAction)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loginInternalAction', () => {
    it('returns error when credentials or device authentication fails', async () => {
      const mockLoginUseCase = {
        execute: vi.fn().mockResolvedValue({
          success: false,
          error: 'Perangkat tidak diizinkan. Hubungi Superadmin untuk registrasi Device ID.',
        }),
      };
      vi.spyOn(UseCaseFactory, 'getLoginUseCase').mockReturnValue(mockLoginUseCase as any);

      const result = await loginInternalAction('88010088', 'WrongPass123', 'ROGUE-DEVICE-999');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Perangkat tidak diizinkan');
    });

    it('sets secure session cookie and returns user profile upon valid credentials', async () => {
      const mockLoginData = {
        userId: '101',
        nrp: '88010088',
        fullName: 'Bripka Agus Lantas',
        nama: 'Agus Lantas',
        pangkat: 'Bripka',
        satuanNama: 'Sat Lantas',
        kelompokRegu: 'Regu A',
        unitId: '1',
        role: 'PERSONIL',
        userRole: 'PERSONIL',
        targetRoute: '/console/personil',
        avatarUrl: 'https://avatar.png',
        stationId: '1',
        stationName: 'Polres Pekalongan',
        stationCode: 'PKL',
        deviceId: 'DEV-AGUS-110',
        rawOfficer: null,
      };

      const mockLoginUseCase = {
        execute: vi.fn().mockResolvedValue({
          success: true,
          data: mockLoginData,
        }),
      };
      vi.spyOn(UseCaseFactory, 'getLoginUseCase').mockReturnValue(mockLoginUseCase as any);
      const setSessionSpy = vi.spyOn(sessionModule, 'setSessionCookie').mockResolvedValue(undefined);

      const result = await loginInternalAction('88010088', 'CorrectPassword123', 'DEV-AGUS-110');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.nrp).toBe('88010088');
      expect(result.data?.role).toBe('PERSONIL');
      expect(result.data?.targetRoute).toBe('/console/personil');

      // Memastikan cookie sesi terenkripsi diterbitkan
      expect(setSessionSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: '101',
          identifier: '88010088',
          role: 'PERSONIL',
        })
      );
    });
  });

  describe('logoutAction', () => {
    it('deletes session cookie upon user logout', async () => {
      const deleteSessionSpy = vi.spyOn(sessionModule, 'deleteSessionCookie').mockResolvedValue(undefined);
      vi.spyOn(sessionModule, 'getSession').mockResolvedValue({
        userId: '101',
        identifier: '88010088',
        fullName: 'Bripka Agus',
        role: 'PERSONIL',
      } as any);

      const result = await logoutAction('USER_MANUAL');

      expect(result.success).toBe(true);
      expect(deleteSessionSpy).toHaveBeenCalledOnce();
    });
  });
});
