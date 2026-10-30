import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getMasterCountersAction,
  getAllMasterLookupsBundleAction,
  getMasterRanksAction,
  createMasterRankAction,
} from '../master.actions';
import { prisma } from '@/infrastructure/db/prisma.client';

describe('Server Action Integration: master.actions (Master Data Management & Lookups)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getMasterCountersAction', () => {
    it('queries table counters summary and returns aggregated counts', async () => {
      const mockRow = {
        ranks: 15,
        units: 6,
        roles: 4,
        stations: 12,
        categories: 8,
        subcategories: 24,
        hotspots: 10,
        hotspotCategories: 5,
        vehicles: 18,
        dutyStatuses: 3,
        resolutionLocations: 4,
        resolutionDocuments: 3,
        knowledgeFaqs: 12,
      };

      (prisma as any).$queryRaw = vi.fn().mockResolvedValue([mockRow]);

      const result = await getMasterCountersAction();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.ranks).toBe(15);
      expect(result.data.units).toBe(6);
      expect(result.data.stations).toBe(12);
      expect(result.data.vehicles).toBe(18);
    });
  });

  describe('getAllMasterLookupsBundleAction', () => {
    it('returns bundled active lookups for dropdowns in single roundtrip', async () => {
      vi.spyOn(prisma.masterStationLevel, 'findMany').mockResolvedValue([
        { id: 1, key: 'POLRES', label: 'Kepolisian Resor', level_order: 1, is_active: true } as any,
      ]);
      vi.spyOn(prisma.masterUrgencyLevel, 'findMany').mockResolvedValue([
        { id: 1, key: 'HIGH', label: 'Tinggi', display_order: 1, is_active: true } as any,
      ]);
      vi.spyOn(prisma.masterHotspotDangerLevel, 'findMany').mockResolvedValue([
        { id: 1, key: 'MERAH', label: 'Rawan Berat', display_order: 1, is_active: true } as any,
      ]);
      vi.spyOn(prisma.masterIncidentCategory, 'findMany').mockResolvedValue([
        { id: 1, key: 'LANTAS', name: 'Lalu Lintas', display_order: 1, is_active: true } as any,
      ]);
      vi.spyOn(prisma.masterOperationalUnit, 'findMany').mockResolvedValue([
        { id: 1, key: 'turjawali', unit_name: 'Turjawali Sat Lantas', display_order: 1, is_active: true } as any,
      ]);
      vi.spyOn(prisma.masterHotspotCategory, 'findMany').mockResolvedValue([
        { id: 1, key: 'RAWAN_MACET', label: 'Rawan Kemacetan', display_order: 1, is_active: true } as any,
      ]);

      const result = await getAllMasterLookupsBundleAction();

      expect(result.success).toBe(true);
      const data = (result as any).data;
      expect(data).toBeDefined();
      expect(data.stationLevels.length).toBe(1);
      expect(data.stationLevels[0].key).toBe('POLRES');
      expect(data.urgencyLevels.length).toBe(1);
      expect(data.dangerLevels.length).toBe(1);
      expect(data.categories.length).toBe(1);
    }, 15000);
  });

  describe('getMasterRanksAction & createMasterRankAction', () => {
    it('getMasterRanksAction: returns active master ranks with ordering', async () => {
      vi.spyOn(prisma.masterRank, 'findMany').mockResolvedValue([
        { id: 1, key: 'AIPDA', label: 'Ajun Inspektur Polisi Dua', display_order: 1, is_active: true } as any,
        { id: 2, key: 'BRIPKA', label: 'Brigadir Polisi Kepala', display_order: 2, is_active: true } as any,
      ]);

      const result = await getMasterRanksAction({ isActive: true });

      expect(result.success).toBe(true);
      const data = (result as any).data;
      expect(data.length).toBe(2);
      expect(data[0].key).toBe('AIPDA');
    });

    it('createMasterRankAction: rejects creation when key or label is missing', async () => {
      const result = await createMasterRankAction({
        key: '',
        label: '',
        display_order: 1,
        is_active: true,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('wajib diisi');
    });

    it('createMasterRankAction: persists valid rank data into database', async () => {
      vi.spyOn(prisma.masterRank, 'create').mockResolvedValue({
        id: 10,
        key: 'KOMPOL',
        label: 'Komisaris Polisi',
        display_order: 5,
        is_active: true,
      } as any);

      const result = await createMasterRankAction({
        key: 'kompol',
        label: 'Komisaris Polisi',
        display_order: 5,
        is_active: true,
      });

      expect(result.success).toBe(true);
      expect(result.data?.key).toBe('KOMPOL');
    });
  });
});
