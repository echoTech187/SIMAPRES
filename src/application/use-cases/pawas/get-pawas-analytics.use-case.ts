import { IComplaintRepository, IkmStats } from '@/domain/repositories/complaint.repository.interface';

export interface PawasAnalyticsData {
  ikmStats: IkmStats;
}

export class GetPawasAnalyticsUseCase {
  constructor(private complaintRepo: IComplaintRepository) {}

  async execute(stationId?: number): Promise<PawasAnalyticsData> {
    const ikmStats = await this.complaintRepo.getIkmStats(stationId);
    return { ikmStats };
  }
}
