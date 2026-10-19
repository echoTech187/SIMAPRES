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
  subcategoryId?: number | null;
  platformKey?: string;
  fotoBuktiUrl?: string | null;
}

export class CreateComplaintUseCase {
  constructor(private complaintRepo: IComplaintRepository) {}

  async execute(input: CreateComplaintInput): Promise<ComplaintEntity> {
    const pelaporNama = input.pelaporNama?.trim();
    const pelaporHp = input.pelaporHp?.trim();
    const tkpAlamatTeks = input.tkpAlamatTeks?.trim();
    const jenisKejadian = input.jenisKejadian?.trim();
    const ringkasanKeterangan = input.ringkasanKeterangan?.trim();

    if (!pelaporNama || pelaporNama === '-') {
      throw new Error('Nama pelapor wajib diisi.');
    }
    if (!pelaporHp || pelaporHp === '-') {
      throw new Error('Nomor telepon / kontak pelapor wajib diisi.');
    }
    if (!jenisKejadian || jenisKejadian === '-') {
      throw new Error('Jenis / kategori kejadian wajib diisi.');
    }
    if (!tkpAlamatTeks || tkpAlamatTeks === '-') {
      throw new Error('Alamat lokasi kejadian (TKP) wajib diisi.');
    }
    if (
      input.tkpLat === undefined ||
      input.tkpLat === null ||
      isNaN(Number(input.tkpLat)) ||
      input.tkpLng === undefined ||
      input.tkpLng === null ||
      isNaN(Number(input.tkpLng))
    ) {
      throw new Error('Koordinat TKP (latitude & longitude) wajib berupa angka valid.');
    }
    if (!ringkasanKeterangan || ringkasanKeterangan === '-') {
      throw new Error('Uraian keterangan kejadian wajib diisi.');
    }

    // Generator Nomor Registrasi Tiket Resmi: LP-110-YYYYMM-XXXX
    const now = new Date();
    const yearMonth = now.toISOString().slice(0, 7).replace('-', '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const nomorTiket = `LP-110-${yearMonth}-${randomSuffix}`;

    const complaint = new ComplaintEntity({
      nomorTiket,
      pelaporNama,
      pelaporHp,
      jenisKejadian,
      urgensi: input.urgensi as UrgensiLevel,
      tkpAlamatTeks,
      tkpLat: Number(input.tkpLat),
      tkpLng: Number(input.tkpLng),
      ringkasanKeterangan,
      status: 'MENUNGGU',
      operatorId: input.operatorId ,
      kategoriKey: input.kategoriKey,
      subcategoryId: input.subcategoryId,
      platformKey: input.platformKey,
      fotoBuktiUrl: input.fotoBuktiUrl || null,
      timelines: [
        {
          tahapKe: 0,
          tahapTitle: 'Laporan Diterima',
          catatan: 'Pengaduan dicatat dan masuk ke buku register antrean.',
          fotoBuktiUrl: input.fotoBuktiUrl || null,
          createdAt: now,
        },
      ],
    });

    return await this.complaintRepo.create(complaint);
  }
}
