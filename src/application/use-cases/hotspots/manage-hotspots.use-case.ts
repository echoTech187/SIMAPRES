import { IHotspotRepository } from '@/domain/repositories/hotspot.repository.interface';
import { HotspotEntity, HotspotProps } from '@/domain/entities/hotspot.entity';

export class ManageHotspotsUseCase {
  constructor(private hotspotRepo: IHotspotRepository) {}

  async getAll(): Promise<HotspotEntity[]> {
    return await this.hotspotRepo.findAll();
  }

  async createHotspot(props: Omit<HotspotProps, 'id' | 'key' | 'createdAt' | 'updatedAt'>): Promise<HotspotEntity> {
    const key = `hotspot_${Date.now()}`;
    const hotspot = new HotspotEntity({
      ...props,
      key,
    });
    return await this.hotspotRepo.create(hotspot);
  }

  async updateHotspot(key: string, props: Partial<HotspotProps>): Promise<HotspotEntity> {
    const existing = await this.hotspotRepo.findByKey(key);
    if (!existing) {
      throw new Error(`Titik rawan dengan kunci ${key} tidak ditemukan.`);
    }

    const updated = new HotspotEntity({
      ...existing.toJSON(),
      ...props,
      key,
    });

    return await this.hotspotRepo.update(updated);
  }

  async deleteHotspot(key: string): Promise<boolean> {
    return await this.hotspotRepo.delete(key);
  }
}
