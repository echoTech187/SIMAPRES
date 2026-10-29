import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrismaHotspotRepository } from '../prisma-hotspot.repository';
import { HotspotEntity } from '@/domain/entities/hotspot.entity';
import { prisma } from '../../db/prisma.client';

describe('PrismaHotspotRepository Integration Tests', () => {
  let repository: PrismaHotspotRepository;

  const mockDbHotspot = {
    id: BigInt(12),
    key: 'hotspot_kajen_alun',
    title: 'Simpang Empat Alun-alun Kajen',
    police_sector: 'Polsek Kajen',
    category: 'KAMTIBMAS',
    danger_level: 'SEDANG',
    lat: -7.0267,
    lng: 109.593,
    active_start: '21:00',
    active_end: '04:00',
    schedule_display: '21:00 - 04:00 WIB',
    nearest_unit: 'Sat Samapta',
    station_id: 1,
    created_by_id: BigInt(99),
    created_at: new Date('2026-01-01'),
    updated_at: new Date('2026-10-30'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new PrismaHotspotRepository();
  });

  it('findAll: queries prisma.hotspotLocation.findMany ordered by created_at desc', async () => {
    vi.spyOn(prisma.hotspotLocation, 'findMany').mockResolvedValue([mockDbHotspot] as any);

    const list = await repository.findAll();

    expect(prisma.hotspotLocation.findMany).toHaveBeenCalledWith({
      orderBy: { created_at: 'desc' },
    });
    expect(list.length).toBe(1);
    expect(list[0].key).toBe('hotspot_kajen_alun');
    expect(list[0].title).toBe('Simpang Empat Alun-alun Kajen');
    expect(list[0].statusBahaya).toBe('SEDANG');
  });

  it('findByKey: queries prisma.hotspotLocation.findUnique by key', async () => {
    vi.spyOn(prisma.hotspotLocation, 'findUnique').mockResolvedValue(mockDbHotspot as any);

    const hotspot = await repository.findByKey('hotspot_kajen_alun');

    expect(prisma.hotspotLocation.findUnique).toHaveBeenCalledWith({
      where: { key: 'hotspot_kajen_alun' },
    });
    expect(hotspot?.title).toBe('Simpang Empat Alun-alun Kajen');
  });

  it('create: maps HotspotEntity to database schema and persists to prisma.hotspotLocation', async () => {
    vi.spyOn(prisma.hotspotLocation, 'create').mockResolvedValue(mockDbHotspot as any);

    const entity = new HotspotEntity({
      key: 'hotspot_kajen_alun',
      title: 'Simpang Empat Alun-alun Kajen',
      wilayahPolsek: 'Polsek Kajen',
      kategori: 'KAMTIBMAS',
      statusBahaya: 'SEDANG',
      lat: -7.0267,
      lng: 109.593,
      jadwalMulai: '21:00',
      jadwalSelesai: '04:00',
    });

    const result = await repository.create(entity);

    expect(prisma.hotspotLocation.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        key: 'hotspot_kajen_alun',
        title: 'Simpang Empat Alun-alun Kajen',
        police_sector: 'Polsek Kajen',
        category: 'KAMTIBMAS',
        danger_level: 'SEDANG',
        lat: -7.0267,
        lng: 109.593,
      }),
    });
    expect(result.key).toBe('hotspot_kajen_alun');
  });

  it('delete: removes hotspot record by key from database', async () => {
    vi.spyOn(prisma.hotspotLocation, 'delete').mockResolvedValue({} as any);

    const success = await repository.delete('hotspot_kajen_alun');

    expect(prisma.hotspotLocation.delete).toHaveBeenCalledWith({
      where: { key: 'hotspot_kajen_alun' },
    });
    expect(success).toBe(true);
  });
});
