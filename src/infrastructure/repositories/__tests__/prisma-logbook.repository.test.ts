import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrismaLogbookRepository } from '../prisma-logbook.repository';
import { LogbookEntity } from '@/domain/entities/logbook.entity';
import { prisma } from '../../db/prisma.client';

describe('PrismaLogbookRepository Integration Tests', () => {
  let repository: PrismaLogbookRepository;

  const mockDbLogbook = {
    id: BigInt(501),
    officer_id: BigInt(88),
    complaint_id: BigInt(100),
    action_type: 'PATROLI_SAMAPTA',
    claimed_address: 'Alun-alun Kajen',
    claimed_lat: -7.026779,
    claimed_lng: 109.59308,
    actual_lat: -7.0268,
    actual_lng: 109.5931,
    deviation_meters: 15.5,
    is_deviation_flagged: false,
    start_time: '08:00',
    end_time: '10:00',
    photo_url: 'https://foto-patroli.jpg',
    photo_exif_lat: -7.0268,
    photo_exif_lng: 109.5931,
    activity_description: 'Patroli dialogis di sekitar pendopo',
    validation_status: 'VALID',
    created_at: new Date('2026-10-30T08:00:00Z'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new PrismaLogbookRepository();
  });

  it('create: saves logbook domain entity into prisma.officerLogbook and returns mapped entity', async () => {
    vi.spyOn(prisma.officerLogbook, 'create').mockResolvedValue(mockDbLogbook as any);

    const logbookEntity = new LogbookEntity({
      officerId: BigInt(88),
      complaintId: BigInt(100),
      jenisAksi: 'PATROLI_SAMAPTA',
      lokasiKlaimAlamat: 'Alun-alun Kajen',
      lokasiKlaimLat: -7.026779,
      lokasiKlaimLng: 109.59308,
      lokasiGpsAktualLat: -7.0268,
      lokasiGpsAktualLng: 109.5931,
      deviasiMeter: 15.5,
      isDeviasiFlagged: false,
      jamMulai: '08:00',
      jamSelesai: '10:00',
      deskripsiKegiatan: 'Patroli dialogis di sekitar pendopo',
      statusValidasi: 'VALID',
    });

    const result = await repository.create(logbookEntity);

    expect(prisma.officerLogbook.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        officer_id: BigInt(88),
        action_type: 'PATROLI_SAMAPTA',
        claimed_address: 'Alun-alun Kajen',
        validation_status: 'VALID',
        deviation_meters: 15.5,
      }),
    });
    expect(result.id).toBe(BigInt(501));
    expect(result.lokasiKlaimAlamat).toBe('Alun-alun Kajen');
    expect(result.isDeviasiFlagged).toBe(false);
  });

  it('findById: queries prisma.officerLogbook.findUnique and maps DB columns', async () => {
    vi.spyOn(prisma.officerLogbook, 'findUnique').mockResolvedValue(mockDbLogbook as any);

    const result = await repository.findById(BigInt(501));

    expect(prisma.officerLogbook.findUnique).toHaveBeenCalledWith({ where: { id: BigInt(501) } });
    expect(result).not.toBeNull();
    expect(result?.id).toBe(BigInt(501));
    expect(result?.statusValidasi).toBe('VALID');
    expect(result?.deviasiMeter).toBe(15.5);
  });

  it('updateValidationStatus: updates verification status in database and returns updated entity', async () => {
    vi.spyOn(prisma.officerLogbook, 'update').mockResolvedValue({
      ...mockDbLogbook,
      validation_status: 'FLAGGED_AUDIT',
    } as any);

    const result = await repository.updateValidationStatus(BigInt(501), 'FLAGGED_AUDIT', 'Deviasi melebihi 500m');

    expect(prisma.officerLogbook.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: BigInt(501) },
        data: expect.objectContaining({
          validation_status: 'FLAGGED_AUDIT',
        }),
      })
    );
    expect(result.statusValidasi).toBe('FLAGGED_AUDIT');
  });
});
