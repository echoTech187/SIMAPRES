import { describe, it, expect, vi } from 'vitest';
import { CreateLogbookEntryUseCase } from '../create-logbook-entry.use-case';
import { ValidateLogbookUseCase } from '../validate-logbook.use-case';
import { ILogbookRepository } from '@/domain/repositories/logbook.repository.interface';
import { LogbookEntity } from '@/domain/entities/logbook.entity';

describe('Logbook & Dual-Location Audit (Claim vs Real GPS)', () => {
  const createMockLogbookRepo = (): ILogbookRepository => ({
    create: vi.fn().mockImplementation(async (logbook: LogbookEntity) => logbook),
    findById: vi.fn(),
    findByOfficerId: vi.fn(),
    findRecent: vi.fn(),
    findFlaggedAudit: vi.fn(),
    countByJenisAksi: vi.fn(),
    updateValidationStatus: vi.fn().mockImplementation(async (id: bigint, status: string, note?: string) => {
      return new LogbookEntity({
        id,
        officerId: BigInt(88),
        jenisAksi: 'PATROLI_SAMAPTA',
        lokasiKlaimAlamat: 'Pasar Bojong',
        lokasiKlaimLat: -7.026,
        lokasiKlaimLng: 109.593,
        lokasiGpsAktualLat: -7.026,
        lokasiGpsAktualLng: 109.593,
        jamMulai: '08:00',
        jamSelesai: '09:00',
        deviasiMeter: 0,
        isDeviasiFlagged: false,
        deskripsiKegiatan: 'Patroli dialogis',
        statusValidasi: status as any,
      });
    }),
  });

  describe('CreateLogbookEntryUseCase (Dual-Location Audit)', () => {
    it('approves patrol logbook as VALID when actual GPS is within 500m of claimed location', async () => {
      const mockRepo = createMockLogbookRepo();
      const useCase = new CreateLogbookEntryUseCase(mockRepo);

      // Jarak hanya ~50 meter
      const result = await useCase.execute({
        officerId: BigInt(88),
        jenisAksi: 'PATROLI_SAMAPTA',
        lokasiKlaimAlamat: 'Alun-alun Kajen',
        lokasiKlaimLat: -7.026779,
        lokasiKlaimLng: 109.59308,
        lokasiGpsAktualLat: -7.0269, // Sangat dekat
        lokasiGpsAktualLng: 109.5931,
        jamMulai: '08:00',
        jamSelesai: '09:00',
        deskripsiKegiatan: 'Melaksanakan patroli dialogis bersama warga pasar',
      });

      expect(result.isDeviasiFlagged).toBe(false);
      expect(result.statusValidasi).toBe('VALID');
      expect(result.deviasiMeter).toBeLessThan(500);
      expect(mockRepo.create).toHaveBeenCalled();
    });

    it('flags logbook as PERLU_VERIFIKASI when GPS deviates > 500m (Suspicious Entry)', async () => {
      const mockRepo = createMockLogbookRepo();
      const useCase = new CreateLogbookEntryUseCase(mockRepo);

      // Klaim di Kajen (-7.026, 109.593), tapi GPS riil di Wiradesa (-6.890, 109.620) -> ~15 km
      const result = await useCase.execute({
        officerId: BigInt(88),
        jenisAksi: 'PATROLI_SAMAPTA',
        lokasiKlaimAlamat: 'Alun-alun Kajen',
        lokasiKlaimLat: -7.026779,
        lokasiKlaimLng: 109.59308,
        lokasiGpsAktualLat: -6.890000,
        lokasiGpsAktualLng: 109.620000,
        jamMulai: '08:00',
        jamSelesai: '09:00',
        deskripsiKegiatan: 'Klaim patroli di Alun-alun Kajen',
      });

      expect(result.isDeviasiFlagged).toBe(true);
      expect(result.statusValidasi).toBe('FLAGGED_AUDIT');
      expect(result.deviasiMeter).toBeGreaterThan(500);
    });
  });

  describe('ValidateLogbookUseCase (Pawas Oversight)', () => {
    it('allows Pawas to validate or reject a flagged logbook entry with notes', async () => {
      const mockRepo = createMockLogbookRepo();
      const useCase = new ValidateLogbookUseCase(mockRepo);

      const validated = await useCase.execute(
        BigInt(1001),
        'VALID',
        'Sudah dikonfirmasi via WhatsApp bahwa petugas merespon laka di titik deviasi.'
      );

      expect(validated.statusValidasi).toBe('VALID');
      expect(mockRepo.updateValidationStatus).toHaveBeenCalledWith(
        BigInt(1001),
        'VALID',
        'Sudah dikonfirmasi via WhatsApp bahwa petugas merespon laka di titik deviasi.'
      );
    });
  });
});
