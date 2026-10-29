import { IHotspotRepository } from '@/domain/repositories/hotspot.repository.interface';
import { HotspotEntity } from '@/domain/entities/hotspot.entity';

export interface PawasMapData {
  hotspots: HotspotEntity[];
}

export class GetPawasMapUseCase {
  constructor(private hotspotRepo: IHotspotRepository) {}

  async execute(): Promise<PawasMapData> {
    const hotspots = await this.hotspotRepo.findAll();
    return { hotspots };
  }
}
