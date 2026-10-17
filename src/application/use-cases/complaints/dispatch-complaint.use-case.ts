import { IComplaintRepository } from '@/domain/repositories/complaint.repository.interface';
import { IOfficerRepository } from '@/domain/repositories/officer.repository.interface';
import { ComplaintEntity } from '@/domain/entities/complaint.entity';

export interface DispatchComplaintInput {
  complaintId: bigint;
  assignedOfficerId: bigint;
  pawasUserId: bigint;
  arahanPawas?: string;
}

export class DispatchComplaintUseCase {
  constructor(
    private complaintRepo: IComplaintRepository,
    private officerRepo: IOfficerRepository
  ) {}

  async execute(input: DispatchComplaintInput): Promise<ComplaintEntity> {
    const complaint = await this.complaintRepo.findById(input.complaintId);
    if (!complaint) {
      throw new Error(`Pengaduan dengan ID ${input.complaintId} tidak ditemukan.`);
    }

    const officer = await this.officerRepo.findById(input.assignedOfficerId);
    if (!officer) {
      throw new Error(`Personel dengan ID ${input.assignedOfficerId} tidak ditemukan.`);
    }

    // Eksekusi mutasi domain
    complaint.disposisiKePetugas(input.assignedOfficerId, input.pawasUserId);

    // Tambahkan timeline milestone disposisi Pawas
    complaint.timelines.push({
      tahapKe: 1,
      tahapTitle: `Disposisi Pawas ke Unit ${officer.rankPangkat} ${officer.nrp}`,
      catatan: input.arahanPawas || `Perintah gerak cepat unit ${officer.assignedPatrolVehicle || 'Patroli'}.`,
      createdAt: new Date(),
    });

    return await this.complaintRepo.update(complaint);
  }
}
