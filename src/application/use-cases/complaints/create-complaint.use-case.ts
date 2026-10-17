import { IComplaintRepository } from '@/domain/repositories/complaint.repository.interface';
import { ComplaintEntity, UrgensiLevel } from '@/domain/entities/complaint.entity';

export interface CreateComplaintInput {
  pelaporNama: string;
  pelaporHp: string;
  jenisKejadian: string;
  urgensi?: UrgensiLevel;
  tkpAlamatTeks: string;
  tkpLat: number;
  tkpLng: number;
  ringkasanKeterangan: string;
  operatorId?: bigint | null;
  kategoriKey?: string;
  platformKey?: string;
}

export class CreateComplaintUseCase {
  constructor(private complaintRepo: IComplaintRepository) {}

  async execute(input: CreateComplaintInput): Promise<ComplaintEntity> {
    if (!input.pelaporNama || !input.pelaporHp || !input.tkpAlamatTeks) {
      throw new Error('Nama pelapor, nomor telepon, dan alamat TKP wajib diisi.');
    }

    // Generator Nomor Registrasi Tiket Resmi: LP-110-YYYYMM-XXXX
    const now = new Date();
    const yearMonth = now.toISOString().slice(0, 7).replace('-', '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const nomorTiket = `LP-110-${yearMonth}-${randomSuffix}`;

    const complaint = new ComplaintEntity({
      nomorTiket,
      pelaporNama: input.pelaporNama.trim(),
      pelaporHp: input.pelaporHp.trim(),
      jenisKejadian: input.jenisKejadian.trim(),
      urgensi: ((input.urgensi as any) === 'PRIORITAS_TINGGI' ? 'DARURAT' : input.urgensi) || 'SEDANG',
      tkpAlamatTeks: input.tkpAlamatTeks.trim(),
      tkpLat: input.tkpLat,
      tkpLng: input.tkpLng,
      ringkasanKeterangan: input.ringkasanKeterangan.trim(),
      status: 'MENUNGGU',
      operatorId: input.operatorId || null,
      kategoriKey: input.kategoriKey || null,
      platformKey: input.platformKey || null,
      timelines: [
        {
          tahapKe: 0,
          tahapTitle: 'Laporan Diterima di Konsol 110 SPKT',
          catatan: 'Pengaduan dicatat dan masuk ke buku register antrean Pawas.',
          createdAt: now,
        },
      ],
    });

    return await this.complaintRepo.create(complaint);
  }
}
