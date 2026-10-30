import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as sessionModule from '@/lib/session';
import { createMasterRankAction } from '../master/master-personnel.actions';
import { createMasterVehicleAction } from '../master/master-fleet.actions';
import { createHotspotAction } from '../hotspot.actions';
import { validateOfficerLogbookAction, createLogbookAction } from '../logbook.actions';
import { getPawasUnifiedDataAction } from '../pawas.actions';
import { getPiketLookupsAction } from '../piket.actions';
import { UseCaseFactory } from '@/application/factories/use-case.factory';
import { LogbookEntity } from '@/domain/entities/logbook.entity';
import { prisma } from '@/infrastructure/db/prisma.client';

describe('Security & RBAC Rigor (OWASP API5 Protection for Server Action RPCs)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Unauthenticated Request Blocking (Public POST Reject)', () => {
    it('createMasterRankAction: rejects unauthenticated caller with 401 error', async () => {
      vi.spyOn(sessionModule, 'getSession').mockResolvedValue(null);
      // Ensure bypass is disabled for this test
      const prevBypass = process.env.SIMAPRES_BYPASS_AUTH;
      delete process.env.SIMAPRES_BYPASS_AUTH;

      try {
        const result = await createMasterRankAction({
          key: 'IPTU',
          label: 'Inspektur Polisi Satu',
          display_order: 1,
          is_active: true,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain('Akses ditolak');
          expect(result.error).toContain('belum login');
        }
      } finally {
        process.env.SIMAPRES_BYPASS_AUTH = prevBypass;
      }
    });

    it('createHotspotAction: rejects unauthenticated caller with 401 error', async () => {
      vi.spyOn(sessionModule, 'getSession').mockResolvedValue(null);
      const prevBypass = process.env.SIMAPRES_BYPASS_AUTH;
      delete process.env.SIMAPRES_BYPASS_AUTH;

      try {
        const result = await createHotspotAction({
          title: 'Titik Rawan Ilegal',
          wilayahPolsek: 'Polsek Kajen',
          kategori: 'LAKA',
          statusBahaya: 'TINGGI',
          lat: -7.02,
          lng: 109.59,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain('Akses ditolak');
        }
      } finally {
        process.env.SIMAPRES_BYPASS_AUTH = prevBypass;
      }
    });

    it('validateOfficerLogbookAction: rejects unauthenticated caller', async () => {
      vi.spyOn(sessionModule, 'getSession').mockResolvedValue(null);
      const prevBypass = process.env.SIMAPRES_BYPASS_AUTH;
      delete process.env.SIMAPRES_BYPASS_AUTH;

      try {
        const result = await validateOfficerLogbookAction(101, 'VALID', 'Sah');

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain('Akses ditolak');
        }
      } finally {
        process.env.SIMAPRES_BYPASS_AUTH = prevBypass;
      }
    });

    it('getPawasUnifiedDataAction: rejects unauthenticated caller from accessing police dashboard data', async () => {
      vi.spyOn(sessionModule, 'getSession').mockResolvedValue(null);
      const prevBypass = process.env.SIMAPRES_BYPASS_AUTH;
      delete process.env.SIMAPRES_BYPASS_AUTH;

      try {
        const result = await getPawasUnifiedDataAction(60001, true);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain('Akses ditolak');
        }
      } finally {
        process.env.SIMAPRES_BYPASS_AUTH = prevBypass;
      }
    });

    it('getPiketLookupsAction: rejects unauthenticated scraping of police duty sprint roster', async () => {
      vi.spyOn(sessionModule, 'getSession').mockResolvedValue(null);
      const prevBypass = process.env.SIMAPRES_BYPASS_AUTH;
      delete process.env.SIMAPRES_BYPASS_AUTH;

      try {
        const result = await getPiketLookupsAction(60001);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain('Akses ditolak');
        }
      } finally {
        process.env.SIMAPRES_BYPASS_AUTH = prevBypass;
      }
    });
  });

  describe('2. Role Escalation Prevention (Least Privilege Enforcement)', () => {
    it('createMasterRankAction: rejects PERSONIL role with forbidden role message', async () => {
      process.env.SIMAPRES_MOCK_ROLE = 'PERSONIL';
      try {
        const result = await createMasterRankAction({
          key: 'IRJEN',
          label: 'Inspektur Jenderal Polisi',
          display_order: 1,
          is_active: true,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain('Akses ditolak');
          expect(result.error).toContain('SUPERADMIN');
          expect(result.error).toContain('PERSONIL');
        }
      } finally {
        delete process.env.SIMAPRES_MOCK_ROLE;
      }
    });

    it('createHotspotAction: rejects LOGISTIK role from mutating operational hotspots', async () => {
      process.env.SIMAPRES_MOCK_ROLE = 'LOGISTIK';
      try {
        const result = await createHotspotAction({
          title: 'Titik Rawan Rawan',
          wilayahPolsek: 'Polsek Kajen',
          kategori: 'LAKA',
          statusBahaya: 'TINGGI',
          lat: -7.02,
          lng: 109.59,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain('Akses ditolak');
          expect(result.error).toContain('LOGISTIK');
        }
      } finally {
        delete process.env.SIMAPRES_MOCK_ROLE;
      }
    });

    it('createMasterVehicleAction: rejects OPERATOR role from mutating fleet inventory', async () => {
      process.env.SIMAPRES_MOCK_ROLE = 'OPERATOR';
      try {
        const result = await createMasterVehicleAction({
          nomor_lambung: 'SEDAN-01',
          nama_armada: 'Patroli Bojong',
          jenis_kendaraan: 'SEDAN',
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain('Akses ditolak');
          expect(result.error).toContain('LOGISTIK');
          expect(result.error).toContain('OPERATOR');
        }
      } finally {
        delete process.env.SIMAPRES_MOCK_ROLE;
      }
    });
  });

  describe('3. Authorized Execution with Proper Role Verification', () => {
    it('createMasterRankAction: permits SUPERADMIN role and executes database insertion', async () => {
      process.env.SIMAPRES_MOCK_ROLE = 'SUPERADMIN';
      try {
        vi.spyOn(prisma.masterRank, 'create').mockResolvedValue({
          id: 50,
          key: 'BRIGJEN',
          label: 'Brigadir Jenderal Polisi',
          display_order: 1,
          is_active: true,
        } as any);

        const result = await createMasterRankAction({
          key: 'BRIGJEN',
          label: 'Brigadir Jenderal Polisi',
          display_order: 1,
          is_active: true,
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data?.key).toBe('BRIGJEN');
        }
      } finally {
        delete process.env.SIMAPRES_MOCK_ROLE;
      }
    });

    it('validateOfficerLogbookAction: permits PAWAS role and dispatches validation usecase', async () => {
      process.env.SIMAPRES_MOCK_ROLE = 'PAWAS';
      try {
        const mockLogbook = new LogbookEntity({
          id: BigInt(200),
          officerId: BigInt(88),
          complaintId: null,
          jenisAksi: 'PATROLI',
          lokasiKlaimAlamat: 'Alun-alun Kajen',
          lokasiKlaimLat: -7.02,
          lokasiKlaimLng: 109.59,
          lokasiGpsAktualLat: -7.02,
          lokasiGpsAktualLng: 109.59,
          deviasiMeter: 0,
          isDeviasiFlagged: false,
          jamMulai: '08:00',
          jamSelesai: '10:00',
          deskripsiKegiatan: 'Patroli dialogis',
          statusValidasi: 'VALID',
        });

        const mockUseCase = {
          execute: vi.fn().mockResolvedValue(mockLogbook),
        };
        vi.spyOn(UseCaseFactory, 'getValidateLogbookUseCase').mockReturnValue(mockUseCase as any);

        const result = await validateOfficerLogbookAction(200, 'VALID', 'Disahkan');

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data?.statusValidasi).toBe('VALID');
        }
        expect(mockUseCase.execute).toHaveBeenCalledWith(BigInt(200), 'VALID', 'Disahkan');
      } finally {
        delete process.env.SIMAPRES_MOCK_ROLE;
      }
    });

    it('createLogbookAction: permits PERSONIL role to record their field patrol activity', async () => {
      process.env.SIMAPRES_MOCK_ROLE = 'PERSONIL';
      try {
        const mockLogbook = new LogbookEntity({
          id: BigInt(500),
          officerId: BigInt(88),
          complaintId: null,
          jenisAksi: 'PATROLI',
          lokasiKlaimAlamat: 'Pasar Kajen',
          lokasiKlaimLat: -7.02,
          lokasiKlaimLng: 109.59,
          lokasiGpsAktualLat: -7.02,
          lokasiGpsAktualLng: 109.59,
          deviasiMeter: 0,
          isDeviasiFlagged: false,
          jamMulai: '08:00',
          jamSelesai: '10:00',
          deskripsiKegiatan: 'Patroli sambang pasar',
          statusValidasi: 'VALID',
        });

        const mockUseCase = {
          execute: vi.fn().mockResolvedValue(mockLogbook),
        };
        vi.spyOn(UseCaseFactory, 'getCreateLogbookEntryUseCase').mockReturnValue(mockUseCase as any);

        const result = await createLogbookAction({
          officerId: '88',
          jenisAksi: 'PATROLI_SAMAPTA',
          lokasiKlaimAlamat: 'Pasar Kajen',
          lokasiKlaimLat: -7.02,
          lokasiKlaimLng: 109.59,
          lokasiGpsAktualLat: -7.02,
          lokasiGpsAktualLng: 109.59,
          deskripsiKegiatan: 'Patroli sambang pasar',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data?.id).toBe('500');
        }
      } finally {
        delete process.env.SIMAPRES_MOCK_ROLE;
      }
    });
  });
});
