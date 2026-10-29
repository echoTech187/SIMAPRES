import { ILogbookRepository } from '@/domain/repositories/logbook.repository.interface';
import { LogbookEntity } from '@/domain/entities/logbook.entity';

export interface PawasLogbookData {
  recentLogbooks: LogbookEntity[];
}

export class GetPawasLogbookUseCase {
  constructor(private logbookRepo: ILogbookRepository) {}

  async execute(limit = 10, stationId?: number): Promise<PawasLogbookData> {
    const recentLogbooks = await this.logbookRepo.findRecent(limit, stationId);
    return { recentLogbooks };
  }
}
