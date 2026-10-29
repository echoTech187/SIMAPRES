import { IComplaintRepository } from '@/domain/repositories/complaint.repository.interface';
import { ComplaintEntity } from '@/domain/entities/complaint.entity';

export interface PawasDashboardData {
  pendingComplaints: ComplaintEntity[];
  allRecentComplaints: ComplaintEntity[];
}

export class GetPawasDashboardUseCase {
  constructor(private complaintRepo: IComplaintRepository) {}

  async execute(stationId?: number): Promise<PawasDashboardData> {
    const [pendingComplaints, allRecentComplaints] = await Promise.all([
      this.complaintRepo.findAntreanPawas(stationId),
      this.complaintRepo.findAllRecent(100, stationId),
    ]);

    return {
      pendingComplaints,
      allRecentComplaints,
    };
  }
}
