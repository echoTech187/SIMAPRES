import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getHotspotsAction, createHotspotAction } from '../hotspot.actions';
import { UseCaseFactory } from '@/application/factories/use-case.factory';
import { HotspotEntity } from '@/domain/entities/hotspot.entity';

describe('Server Action Integration: hotspot.actions (Crime Hotspots)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHotspotsAction', () => {
    it('retrieves serialized hotspots through ManageHotspotsUseCase', async () => {
      const mockHotspot = new HotspotEntity({
        id: BigInt(1),
        key: 'hotspot_kajen',
        title: 'Simpang Empat Kajen',
        wilayahPolsek: 'Polsek Kajen',
        kategori: 'KAMTIBMAS',
        statusBahaya: 'SEDANG',
        lat: -7.0267,
        lng: 109.593,
      });

      const mockUseCase = {
        getAll: vi.fn().mockResolvedValue([mockHotspot]),
      };
      vi.spyOn(UseCaseFactory, 'getManageHotspotsUseCase').mockReturnValue(mockUseCase as any);

      const result = await getHotspotsAction();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeDefined();
        expect(Array.isArray(result.data)).toBe(true);
        expect(result.data[0].title).toBe('Simpang Empat Kajen');
      }
    });

  });

  describe('createHotspotAction', () => {
    it('validates title and wilayahPolsek', async () => {
      // Missing title
      const res1 = await createHotspotAction({
        title: '',
        wilayahPolsek: 'Polsek Kajen',
        kategori: 'LAKA',
        statusBahaya: 'TINGGI',
        lat: -7.02,
        lng: 109.59,
      });
      expect(res1.success).toBe(false);
      expect(res1.error).toBe('Nama titik rawan wajib diisi!');

      // Missing sector
      const res2 = await createHotspotAction({
        title: 'Jalan Rusak',
        wilayahPolsek: '',
        kategori: 'LAKA',
        statusBahaya: 'TINGGI',
        lat: -7.02,
        lng: 109.59,
      });
      expect(res2.success).toBe(false);
      expect(res2.error).toBe('Wilayah hukum / Polsek wajib diisi!');
    });

    it('creates hotspot successfully when inputs are valid', async () => {
      const createdEntity = new HotspotEntity({
        id: BigInt(2),
        key: 'hotspot_bojong',
        title: 'Perlintasan Rel KA Bojong',
        wilayahPolsek: 'Polsek Bojong',
        kategori: 'LAKA',
        statusBahaya: 'TINGGI',
        lat: -6.98,
        lng: 109.61,
      });

      const mockUseCase = {
        createHotspot: vi.fn().mockResolvedValue(createdEntity),
      };
      vi.spyOn(UseCaseFactory, 'getManageHotspotsUseCase').mockReturnValue(mockUseCase as any);

      const result = await createHotspotAction({
        title: 'Perlintasan Rel KA Bojong',
        wilayahPolsek: 'Polsek Bojong',
        kategori: 'LAKA',
        statusBahaya: 'TINGGI',
        lat: -6.98,
        lng: 109.61,
        jadwalMulai: '06:00',
        jadwalSelesai: '18:00',
        unitTerdekat: 'Pos Lantas Bojong',
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.title).toBe('Perlintasan Rel KA Bojong');
    });
  });
});
