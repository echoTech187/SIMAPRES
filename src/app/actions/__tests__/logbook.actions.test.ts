import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createLogbookAction, validateOfficerLogbookAction } from '../logbook.actions';
import { UseCaseFactory } from '@/application/factories/use-case.factory';
import { LogbookEntity } from '@/domain/entities/logbook.entity';

describe('Server Action Integration: logbook.actions (Patrol Activities & Pawas Validation)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('createLogbookAction: executes CreateLogbookEntryUseCase and serializes result', async () => {
    const mockLogbook = new LogbookEntity({
      id: BigInt(301),
      officerId: BigInt(88),
      jenisAksi: 'PATROLI_SAMAPTA',
      lokasiKlaimAlamat: 'Alun-alun Kajen',
      lokasiKlaimLat: -7.026779,
      lokasiKlaimLng: 109.59308,
      lokasiGpsAktualLat: -7.026779,
      lokasiGpsAktualLng: 109.59308,
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
    vi.spyOn(UseCaseFactory, 'getCreateLogbookEntryUseCase').mockReturnValue(mockUseCase as any);

    const result = await createLogbookAction({
      officerId: '88',
      jenisAksi: 'PATROLI_SAMAPTA',
      lokasiKlaimAlamat: 'Alun-alun Kajen',
      lokasiKlaimLat: -7.026779,
      lokasiKlaimLng: 109.59308,
      lokasiGpsAktualLat: -7.026779,
      lokasiGpsAktualLng: 109.59308,
      deskripsiKegiatan: 'Patroli dialogis',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBeDefined();
      expect(result.data?.id).toBe('301');
      expect(result.data?.statusValidasi).toBe('VALID');
    }
  });


  it('validateOfficerLogbookAction: allows Pawas to approve or flag patrol activities', async () => {
    const validatedLogbook = new LogbookEntity({
      id: BigInt(301),
      officerId: BigInt(88),
      jenisAksi: 'PATROLI_SAMAPTA',
      lokasiKlaimAlamat: 'Alun-alun Kajen',
      lokasiKlaimLat: -7.026779,
      lokasiKlaimLng: 109.59308,
      lokasiGpsAktualLat: -7.026779,
      lokasiGpsAktualLng: 109.59308,
      deviasiMeter: 0,
      isDeviasiFlagged: false,
      jamMulai: '08:00',
      jamSelesai: '10:00',
      deskripsiKegiatan: 'Patroli dialogis',
      statusValidasi: 'VALID',
    });

    const mockUseCase = {
      execute: vi.fn().mockResolvedValue(validatedLogbook),
    };
    vi.spyOn(UseCaseFactory, 'getValidateLogbookUseCase').mockReturnValue(mockUseCase as any);

    const result = await validateOfficerLogbookAction('301', 'VALID', 'Disahkan Pawas');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data?.statusValidasi).toBe('VALID');
    }
    expect(mockUseCase.execute).toHaveBeenCalledWith(BigInt(301), 'VALID', 'Disahkan Pawas');
  });

});
