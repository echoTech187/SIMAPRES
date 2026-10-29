import { describe, it, expect, vi } from 'vitest';
import { ManageHotspotsUseCase } from '../manage-hotspots.use-case';
import { IHotspotRepository } from '@/domain/repositories/hotspot.repository.interface';
import { HotspotEntity } from '@/domain/entities/hotspot.entity';

describe('ManageHotspotsUseCase (Crime & Incident Hotspots)', () => {
  const createMockHotspot = (key = 'hotspot_kajen_1') =>
    new HotspotEntity({
      id: BigInt(1),
      key,
      title: 'Simpang Alun-alun Kajen',
      wilayahPolsek: 'Polsek Kajen',
      kategori: 'KAMTIBMAS',
      statusBahaya: 'SEDANG',
      lat: -7.0267,
      lng: 109.593,
    });

  it('retrieves all active hotspots from repository', async () => {
    const list = [createMockHotspot('h1'), createMockHotspot('h2')];
    const mockRepo: IHotspotRepository = {
      findAll: vi.fn().mockResolvedValue(list),
      findByKey: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    const useCase = new ManageHotspotsUseCase(mockRepo);
    const result = await useCase.getAll();

    expect(result.length).toBe(2);
    expect(mockRepo.findAll).toHaveBeenCalledOnce();
  });

  it('creates new hotspot with auto-generated key prefix', async () => {
    const mockRepo: IHotspotRepository = {
      findAll: vi.fn(),
      findByKey: vi.fn(),
      create: vi.fn().mockImplementation(async (h) => h),
      update: vi.fn(),
      delete: vi.fn(),
    };

    const useCase = new ManageHotspotsUseCase(mockRepo);
    const created = await useCase.createHotspot({
      title: 'Perlintasan Rel Bojong',
      wilayahPolsek: 'Polsek Bojong',
      kategori: 'LAKA',
      statusBahaya: 'TINGGI',
      lat: -6.980,
      lng: 109.610,
    });

    expect(created.title).toBe('Perlintasan Rel Bojong');
    expect(created.key).toMatch(/^hotspot_\d+/);
    expect(mockRepo.create).toHaveBeenCalledOnce();
  });

  it('updates existing hotspot or throws error if key does not exist', async () => {
    const existing = createMockHotspot('hotspot_kedungwuni');
    const mockRepo: IHotspotRepository = {
      findAll: vi.fn(),
      findByKey: vi.fn().mockImplementation(async (key: string) => {
        if (key === 'hotspot_kedungwuni') return existing;
        return null;
      }),
      create: vi.fn(),
      update: vi.fn().mockImplementation(async (h) => h),
      delete: vi.fn(),
    };

    const useCase = new ManageHotspotsUseCase(mockRepo);

    // 1. Success update
    const updated = await useCase.updateHotspot('hotspot_kedungwuni', {
      statusBahaya: 'KRITIS',
      title: 'Kedungwuni Rawan Diperbarui',
    });
    expect(updated.statusBahaya).toBe('KRITIS');
    expect(updated.title).toBe('Kedungwuni Rawan Diperbarui');
    expect(mockRepo.update).toHaveBeenCalledOnce();

    // 2. Not found error
    await expect(
      useCase.updateHotspot('non_existent_key', { statusBahaya: 'RENDAH' })
    ).rejects.toThrow('Titik rawan dengan kunci non_existent_key tidak ditemukan.');
  });

  it('deletes hotspot by unique key', async () => {
    const mockRepo: IHotspotRepository = {
      findAll: vi.fn(),
      findByKey: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn().mockResolvedValue(true),
    };

    const useCase = new ManageHotspotsUseCase(mockRepo);
    const result = await useCase.deleteHotspot('hotspot_kajen_1');

    expect(result).toBe(true);
    expect(mockRepo.delete).toHaveBeenCalledWith('hotspot_kajen_1');
  });
});
