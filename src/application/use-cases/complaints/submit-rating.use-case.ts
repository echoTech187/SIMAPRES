import { IComplaintRepository } from '@/domain/repositories/complaint.repository.interface';
import { ComplaintEntity } from '@/domain/entities/complaint.entity';

export interface SubmitRatingInput {
  nomorTiket: string;
  rating: number; // 1 - 5
  review?: string;
  tags?: string;
}

export class SubmitRatingUseCase {
  constructor(private complaintRepo: IComplaintRepository) {}

  async execute(input: SubmitRatingInput): Promise<ComplaintEntity> {
    const complaint = await this.complaintRepo.findByNomorTiket(input.nomorTiket);
    if (!complaint) {
      throw new Error(`Pengaduan dengan nomor tiket ${input.nomorTiket} tidak ditemukan.`);
    }

    complaint.berikanRatingWarga(input.rating, input.review, input.tags);

    return await this.complaintRepo.update(complaint);
  }
}
