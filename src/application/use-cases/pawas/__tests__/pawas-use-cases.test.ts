import { describe, it, expect, vi } from 'vitest';
import { GetPawasDashboardUseCase } from '../get-pawas-dashboard.use-case';
import { GetPawasAnalyticsUseCase } from '../get-pawas-analytics.use-case';
import { IComplaintRepository, IkmStats } from '@/domain/repositories/complaint.repository.interface';
import { ComplaintEntity } from '@/domain/entities/complaint.entity';

describe('Pawas Use Cases: Station Isolation & Data Aggregation', () => {
  const mockComplaint = (id: string, stationId?: number): ComplaintEntity =>
    new ComplaintEntity({
      id: BigInt(id),
      nomorTiket: `TICKET-${id}`,
      pelaporNama: 'Warga Pekalongan',
      pelaporHp: '081234567890',
      jenisKejadian: 'GANGGUAN_KAMTIBMAS',
      urgensi: 'SEDANG',
      tkpAlamatTeks: 'Jl. Merdeka No. 1',
      tkpLat: -7.026779,
      tkpLng: 109.59308,
      ringkasanKeterangan: 'Laporan gangguan kamtibmas warga',
      status: 'MENUNGGU',
      tahap: 1,
      stationId: stationId ? Number(stationId) : null,
      createdAt: new Date(),
    });

  const mockIkmStats: IkmStats = {
    totalVoting: 25,
    averageRating: 4.8,
    percentageSatisfaction: 96,
    ratingBreakdown: { 5: 20, 4: 5 },
  };

  const createMockRepo = (): IComplaintRepository => ({
    findById: vi.fn(),
    findByNomorTiket: vi.fn(),
    findByPelaporHp: vi.fn(),
    findAssignedToOfficer: vi.fn(),
    findAntreanPawas: vi.fn().mockImplementation(async (stId?: number) => {
      return [mockComplaint('101', stId || 1)];
    }),
    findAllRecent: vi.fn().mockImplementation(async (limit = 100, stId?: number) => {
      return [
        mockComplaint('101', stId || 1),
        mockComplaint('102', stId || 1),
      ];
    }),
    create: vi.fn(),
    update: vi.fn(),
    getIkmStats: vi.fn().mockResolvedValue(mockIkmStats),
  });

  describe('GetPawasDashboardUseCase', () => {
    it('passes stationId to repository to filter Pawas dashboard by Mako', async () => {
      const mockRepo = createMockRepo();
      const useCase = new GetPawasDashboardUseCase(mockRepo);

      const result = await useCase.execute(5);

      expect(mockRepo.findAntreanPawas).toHaveBeenCalledWith(5);
      expect(mockRepo.findAllRecent).toHaveBeenCalledWith(100, 5);
      expect(result.pendingComplaints).toHaveLength(1);
      expect(result.allRecentComplaints).toHaveLength(2);
    });

    it('works without stationId when called by Superadmin for all Makos', async () => {
      const mockRepo = createMockRepo();
      const useCase = new GetPawasDashboardUseCase(mockRepo);

      const result = await useCase.execute(undefined);

      expect(mockRepo.findAntreanPawas).toHaveBeenCalledWith(undefined);
      expect(mockRepo.findAllRecent).toHaveBeenCalledWith(100, undefined);
      expect(result.pendingComplaints).toBeDefined();
    });
  });

  describe('GetPawasAnalyticsUseCase', () => {
    it('passes stationId to getIkmStats to isolate citizen satisfaction by Mako', async () => {
      const mockRepo = createMockRepo();
      const useCase = new GetPawasAnalyticsUseCase(mockRepo);

      const result = await useCase.execute(3);

      expect(mockRepo.getIkmStats).toHaveBeenCalledWith(3);
      expect(result.ikmStats.averageRating).toBe(4.8);
      expect(result.ikmStats.percentageSatisfaction).toBe(96);
    });
  });
});
