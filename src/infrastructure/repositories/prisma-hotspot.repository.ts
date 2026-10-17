import { IHotspotRepository } from '@/domain/repositories/hotspot.repository.interface';
import { HotspotEntity } from '@/domain/entities/hotspot.entity';
// SIMAPRES 110 - Prisma Hotspot Repository Implementation
import { prisma } from '../db/prisma.client';

export class PrismaHotspotRepository implements IHotspotRepository {
  private mapToEntity(record: any): HotspotEntity {
    return new HotspotEntity({
      id: record.id,
      key: record.key,
      title: record.title,
      wilayahPolsek: record.police_sector,
      kategori: record.category,
      statusBahaya: record.danger_level,
      ikonEmoji: record.icon_emoji,
      lat: Number(record.lat),
      lng: Number(record.lng),
      jadwalMulai: record.active_start,
      jadwalSelesai: record.active_end,
      jadwalDisplay: record.schedule_display,
      unitTerdekat: record.nearest_unit,
      unitId: record.station_id,
      createdBy: record.created_by_id,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    });
  }

  async findAll(): Promise<HotspotEntity[]> {
    const records = await prisma.hotspotLocation.findMany({
      orderBy: { created_at: 'desc' },
    });
    return records.map((r: any) => this.mapToEntity(r));
  }

  async findByKey(key: string): Promise<HotspotEntity | null> {
    const record = await prisma.hotspotLocation.findUnique({ where: { key } });
    return record ? this.mapToEntity(record) : null;
  }

  async create(hotspot: HotspotEntity): Promise<HotspotEntity> {
    const data = hotspot.toJSON();
    const created = await prisma.hotspotLocation.create({
      data: {
        key: data.key,
        title: data.title,
        police_sector: data.wilayahPolsek,
        category: data.kategori,
        danger_level: data.statusBahaya,
        icon_emoji: data.ikonEmoji,
        lat: data.lat,
        lng: data.lng,
        active_start: data.jadwalMulai,
        active_end: data.jadwalSelesai,
        schedule_display: data.jadwalDisplay,
        nearest_unit: data.unitTerdekat,
        station_id: data.unitId,
        created_by_id: data.createdBy,
      },
    });
    return this.mapToEntity(created);
  }

  async update(hotspot: HotspotEntity): Promise<HotspotEntity> {
    const data = hotspot.toJSON();
    const updated = await prisma.hotspotLocation.update({
      where: { key: data.key },
      data: {
        title: data.title,
        police_sector: data.wilayahPolsek,
        category: data.kategori,
        danger_level: data.statusBahaya,
        icon_emoji: data.ikonEmoji,
        lat: data.lat,
        lng: data.lng,
        active_start: data.jadwalMulai,
        active_end: data.jadwalSelesai,
        schedule_display: data.jadwalDisplay,
        nearest_unit: data.unitTerdekat,
      },
    });
    return this.mapToEntity(updated);
  }

  async delete(key: string): Promise<boolean> {
    try {
      await prisma.hotspotLocation.delete({ where: { key } });
      return true;
    } catch {
      return false;
    }
  }
}
