import { ILogbookRepository } from '@/domain/repositories/logbook.repository.interface';
import { LogbookEntity, JenisAksiLogbook } from '@/domain/entities/logbook.entity';
import { HaversineService } from '@/infrastructure/services/haversine.service';

export interface CreateLogbookInput {
  officerId: bigint;
  complaintId?: bigint | null;
  jenisAksi: JenisAksiLogbook;
  lokasiKlaimAlamat: string;
  lokasiKlaimLat: number;
  lokasiKlaimLng: number;
  lokasiGpsAktualLat: number;
  lokasiGpsAktualLng: number;
  jamMulai: string;
  jamSelesai: string;
  fotoBuktiUrl?: string | null;
  fotoExifLat?: number | null;
  fotoExifLng?: number | null;
  deskripsiKegiatan: string;
}

export class CreateLogbookEntryUseCase {
  constructor(private logbookRepo: ILogbookRepository) {}

  async execute(input: CreateLogbookInput): Promise<LogbookEntity> {
    // 1. Eksekusi Dual-Location Audit via Haversine Service
    const audit = HaversineService.evaluateDeviation(
      input.lokasiKlaimLat,
      input.lokasiKlaimLng,
      input.lokasiGpsAktualLat,
      input.lokasiGpsAktualLng,
      500 // Threshold standar 500 meter
    );

    // 2. Bentuk Entitas Logbook
    const logbook = new LogbookEntity({
      officerId: input.officerId,
      complaintId: input.complaintId || null,
      jenisAksi: input.jenisAksi,
      lokasiKlaimAlamat: input.lokasiKlaimAlamat,
      lokasiKlaimLat: input.lokasiKlaimLat,
      lokasiKlaimLng: input.lokasiKlaimLng,
      lokasiGpsAktualLat: input.lokasiGpsAktualLat,
      lokasiGpsAktualLng: input.lokasiGpsAktualLng,
      deviasiMeter: audit.deviasiMeter,
      isDeviasiFlagged: audit.isFlagged,
      statusValidasi: audit.statusValidasi,
      jamMulai: input.jamMulai,
      jamSelesai: input.jamSelesai,
      fotoBuktiUrl: input.fotoBuktiUrl,
      fotoExifLat: input.fotoExifLat,
      fotoExifLng: input.fotoExifLng,
      deskripsiKegiatan: input.deskripsiKegiatan,
    });

    return await this.logbookRepo.create(logbook);
  }
}
