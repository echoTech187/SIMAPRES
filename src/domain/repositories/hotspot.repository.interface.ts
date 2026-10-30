import { HotspotEntity } from '../entities/hotspot.entity';

export interface IHotspotRepository {
  findAll(): Promise<HotspotEntity[]>;
  findByKey(key: string): Promise<HotspotEntity | null>;
  create(hotspot: HotspotEntity): Promise<HotspotEntity>;
  update(hotspot: HotspotEntity): Promise<HotspotEntity>;
  delete(key: string): Promise<boolean>;
  getMasterOptions?(): Promise<{ categories: unknown[]; dangerLevels: unknown[] }>;
}
