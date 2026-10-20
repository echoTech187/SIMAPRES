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
  nomorTiket?: string;
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

    // Nomor Registrasi Tiket Resmi (Format Baku Wallboard 110: #TICKET-0018xxxxxx)
    let nomorTiket = input.nomorTiket?.trim();
    if (nomorTiket) {
      // Normalisasi format baku: jika hanya mengetik angka atau TICKET-
      if (!nomorTiket.startsWith('#TICKET-') && !nomorTiket.startsWith('TICKET-') && !nomorTiket.startsWith('#')) {
        nomorTiket = `#TICKET-${nomorTiket}`;
      } else if (nomorTiket.startsWith('TICKET-')) {
        nomorTiket = `#${nomorTiket}`;
      }

      // Validasi anti-duplikasi nomor tiket
      const existing = await this.complaintRepo.findByNomorTiket(nomorTiket);
      if (existing) {
        throw new Error(`Nomor tiket ${nomorTiket} sudah terdaftar di pangkalan data! Kasus ini telah tercatat sebelumnya.`);
      }
    } else {
      // Generate format baku 10 digit #TICKET-0018xxxxxx
      const random10Digit = String(Math.floor(1800000000 + Math.random() * 99999999)).padStart(10, '0');
      nomorTiket = `#TICKET-${random10Digit}`;
    }

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
          createdAt: new Date(),
        },
      ],
    });

    return await this.complaintRepo.create(complaint);
  }
}
