import { IComplaintRepository } from '@/domain/repositories/complaint.repository.interface';
import { ComplaintEntity } from '@/domain/entities/complaint.entity';
import { getComplaintActionPermissions } from '@/domain/rules/complaint.rules';
import { validateResolutionSubmission } from '@/domain/rules/resolution.rules';

export type DispatchStepKey =
  | 'DISPATCHED'
  | 'DEPARTED'
  | 'ARRIVED'
  | 'REPORT_SUBMITTED'
  | 'COMPLETED';

export interface FieldStepActionInput {
  complaintId: bigint;
  step: DispatchStepKey;
  officerId: bigint;
  catatan?: string;
  fotoBuktiUrl?: string;
  evidencesList?: any[];
  lat?: number;
  lng?: number;
  isDiscrepancy?: boolean;
  deviationMeters?: number;
  warningMessage?: string;
  photoAddress?: string;
  resolutionLocationId?: number | null;
  resolutionLocationKey?: string | null;
  resolutionLocationName?: string | null;
  resolutionDocumentId?: number | null;
  resolutionDocumentKey?: string | null;
  resolutionDocumentName?: string | null;
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

    // 1. Evaluasi izin aksi menggunakan Domain Rules murni
    const permissions = getComplaintActionPermissions({
      status: complaint.status,
      tahap: complaint.tahap,
      role: 'PERSONIL',
      isAssignedOfficer: true,
    });

    switch (input.step) {
      case 'DISPATCHED':
        // Persiapan penugasan personil
        break;
      case 'DEPARTED':
        if (!permissions.canStartMeluncur) {
          throw new Error(`Aksi Meluncur ditolak oleh aturan domain: Status tiket (${complaint.status}) tahap ${complaint.tahap || 0} tidak valid.`);
        }
        complaint.personilMeluncur(input.catatan, input.fotoBuktiUrl, input.lat, input.lng);
        break;
      case 'ARRIVED':
        if (!permissions.canArriveTkp) {
          throw new Error(`Aksi Tiba di TKP ditolak oleh aturan domain: Status tiket (${complaint.status}) tahap ${complaint.tahap || 0} tidak valid.`);
        }
        complaint.tibaDiTkp(
            input.catatan,
            input.fotoBuktiUrl,
            input.lat,
            input.lng,
            input.isDiscrepancy,
            input.deviationMeters,
            input.warningMessage,
            input.photoAddress,
            input.evidencesList
        );
        break;
      case 'REPORT_SUBMITTED': {
        if (!permissions.canSubmitTindakan && !permissions.canRequestPawasApproval) {
          throw new Error(`Aksi Pelaporan Tindakan ditolak oleh aturan domain: Status tiket (${complaint.status}) tidak valid.`);
        }

        // 2. Validasi kelayakan Berita Acara & Restorative Justice jika melampirkan berkas penyelesaian
        if (input.resolutionLocationKey || input.resolutionDocumentKey) {
          const resValidation = validateResolutionSubmission({
            locationKey: input.resolutionLocationKey,
            documentKey: input.resolutionDocumentKey,
            hasPhotoEvidence: Boolean(input.fotoBuktiUrl),
            evidenceCount: input.evidencesList?.length || 0,
            catatan: input.catatan,
            kategoriKey: complaint.kategoriKey,
          });

          if (!resValidation.isValid) {
            throw new Error(`Validasi Berita Acara Gagal: ${resValidation.missingRequirements.join(' ')}`);
          }

          complaint.ajukanPengesahanBap(
            input.catatan,
            input.fotoBuktiUrl,
            {
              locationKey: input.resolutionLocationKey,
              locationName: input.resolutionLocationName,
              documentKey: input.resolutionDocumentKey,
              documentName: input.resolutionDocumentName,
            },
            input.evidencesList,
            input.lat,
            input.lng
          );
        } else {
          complaint.tindakanTkp(
            input.catatan,
            input.fotoBuktiUrl,
            input.lat,
            input.lng,
            input.isDiscrepancy,
            input.deviationMeters,
            input.warningMessage,
            input.photoAddress,
            input.evidencesList
          );
        }
        break;
      }
      case 'COMPLETED': {
        if (input.resolutionLocationKey || input.resolutionDocumentKey) {
          const resValidation = validateResolutionSubmission({
            locationKey: input.resolutionLocationKey,
            documentKey: input.resolutionDocumentKey,
            hasPhotoEvidence: Boolean(input.fotoBuktiUrl),
            evidenceCount: input.evidencesList?.length || 0,
            catatan: input.catatan,
            kategoriKey: complaint.kategoriKey,
          });

          if (!resValidation.isValid) {
            throw new Error(`Validasi Berita Acara Gagal: ${resValidation.missingRequirements.join(' ')}`);
          }
        }

        complaint.selesaikanKasusLangsung(
          input.catatan,
          input.fotoBuktiUrl,
          input.lat,
          input.lng,
          input.evidencesList,
          {
            locationKey: input.resolutionLocationKey || undefined,
            locationName: input.resolutionLocationName || undefined,
            documentKey: input.resolutionDocumentKey || undefined,
            documentName: input.resolutionDocumentName || undefined,
          }
        );
        break;
      }
      default:
        throw new Error(`Tahap aksi ${input.step} tidak valid.`);
    }

    return await this.complaintRepo.update(complaint);
  }
}
