import { IComplaintRepository } from '@/domain/repositories/complaint.repository.interface';
import { ComplaintEntity } from '@/domain/entities/complaint.entity';

export interface FieldStepActionInput {
  complaintId: bigint;
  step: 'meluncur' | 'tiba_tkp' | 'selesai';
  officerId: bigint;
  catatan?: string;
  fotoBuktiUrl?: string;
  lat?: number;
  lng?: number;
}

export class FieldStepActionUseCase {
  constructor(private complaintRepo: IComplaintRepository) {}

  async execute(input: FieldStepActionInput): Promise<ComplaintEntity> {
    const complaint = await this.complaintRepo.findById(input.complaintId);
    if (!complaint) {
      throw new Error(`Pengaduan dengan ID ${input.complaintId} tidak ditemukan.`);
    }

    if (complaint.assignedOfficerId !== input.officerId) {
      throw new Error('Akses ditolak: Anda bukan personel yang ditugaskan menangani kasus ini.');
    }

    switch (input.step) {
      case 'meluncur':
        complaint.personilMeluncur(input.catatan, input.fotoBuktiUrl, input.lat, input.lng);
        break;
      case 'tiba_tkp':
        complaint.tibaDiTkp(input.catatan, input.fotoBuktiUrl, input.lat, input.lng);
        break;
      case 'selesai':
        complaint.selesaikanKasus(input.catatan, input.fotoBuktiUrl);
        break;
      default:
        throw new Error(`Tahap aksi ${input.step} tidak valid.`);
    }

    return await this.complaintRepo.update(complaint);
  }
}
