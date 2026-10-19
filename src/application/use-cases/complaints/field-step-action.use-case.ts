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

    // Jika tiket belum memiliki petugas spesifik (disposisi tingkat satuan), tetapkan personel ini sebagai petugas penindak
    if (!complaint.assignedOfficerId) {
      (complaint as any).props.assignedOfficerId = input.officerId;
    } else if (complaint.assignedOfficerId !== input.officerId) {
      // Izinkan jika merupakan personel dari satuan yang sama atau perbarui penindak utama
      (complaint as any).props.assignedOfficerId = input.officerId;
    }

    switch (input.step) {
      case 'meluncur':
        complaint.personilMeluncur(input.catatan, input.fotoBuktiUrl, input.lat, input.lng);
        break;
      case 'tiba_tkp':
        complaint.tibaDiTkp(input.catatan, input.fotoBuktiUrl, input.lat, input.lng);
        break;
      case 'selesai':
        complaint.ajukanPengesahanBap(input.catatan, input.fotoBuktiUrl);
        break;
      default:
        throw new Error(`Tahap aksi ${input.step} tidak valid.`);
    }

    return await this.complaintRepo.update(complaint);
  }
}
