import { ILogbookRepository } from '@/domain/repositories/logbook.repository.interface';
import { LogbookEntity, JenisAksiLogbook, StatusValidasiLogbook } from '@/domain/entities/logbook.entity';
// SIMAPRES 110 - Prisma Logbook Repository Implementation
import { prisma } from '../db/prisma.client';

export class PrismaLogbookRepository implements ILogbookRepository {
  private mapToEntity(record: any): LogbookEntity {
    return new LogbookEntity({
      id: record.id,
      officerId: record.officer_id,
      complaintId: record.complaint_id,
      jenisAksi: record.action_type as JenisAksiLogbook,
      lokasiKlaimAlamat: record.claimed_address,
      lokasiKlaimLat: Number(record.claimed_lat),
      lokasiKlaimLng: Number(record.claimed_lng),
      lokasiGpsAktualLat: Number(record.actual_lat),
      lokasiGpsAktualLng: Number(record.actual_lng),
      deviasiMeter: Number(record.deviation_meters),
      isDeviasiFlagged: Boolean(record.is_deviation_flagged),
      jamMulai: record.start_time,
      jamSelesai: record.end_time,
      fotoBuktiUrl: record.photo_url,
      fotoExifLat: record.photo_exif_lat ? Number(record.photo_exif_lat) : null,
      fotoExifLng: record.photo_exif_lng ? Number(record.photo_exif_lng) : null,
      deskripsiKegiatan: record.activity_description,
      statusValidasi: record.validation_status as StatusValidasiLogbook,
      createdAt: record.created_at,
    });
  }

  async create(logbook: LogbookEntity): Promise<LogbookEntity> {
    const data = logbook.toJSON();
    const created = await prisma.officerLogbook.create({
      data: {
        officer_id: data.officerId,
        complaint_id: data.complaintId,
        action_type: data.jenisAksi,
        claimed_address: data.lokasiKlaimAlamat,
        claimed_lat: data.lokasiKlaimLat,
        claimed_lng: data.lokasiKlaimLng,
        actual_lat: data.lokasiGpsAktualLat,
        actual_lng: data.lokasiGpsAktualLng,
        deviation_meters: data.deviasiMeter,
        is_deviation_flagged: data.isDeviasiFlagged,
        start_time: data.jamMulai,
        end_time: data.jamSelesai,
        photo_url: data.fotoBuktiUrl,
        photo_exif_lat: data.fotoExifLat,
        photo_exif_lng: data.fotoExifLng,
        activity_description: data.deskripsiKegiatan,
        validation_status: data.statusValidasi,
      },
    });
    return this.mapToEntity(created);
  }

  async findById(id: bigint): Promise<LogbookEntity | null> {
    const record = await prisma.officerLogbook.findUnique({ where: { id } });
    return record ? this.mapToEntity(record) : null;
  }

  async findByOfficerId(officerId: bigint, limit = 50): Promise<LogbookEntity[]> {
    const records = await prisma.officerLogbook.findMany({
      where: { officer_id: officerId },
      orderBy: { created_at: 'desc' },
      take: limit,
    });
    return records.map((r: any) => this.mapToEntity(r));
  }

  async findFlaggedAudit(limit = 50): Promise<LogbookEntity[]> {
    const records = await prisma.officerLogbook.findMany({
      where: { is_deviation_flagged: true },
      orderBy: { created_at: 'desc' },
      take: limit,
      include: { officer: true },
    });
    return records.map((r: any) => this.mapToEntity(r));
  }

  async countByJenisAksi(officerId: bigint): Promise<Record<string, number>> {
    const counts = await prisma.officerLogbook.groupBy({
      by: ['action_type'],
      where: { officer_id: officerId },
      _count: true,
    });

    const result: Record<string, number> = {};

    for (const c of counts) {
      if (c.action_type) {
        result[c.action_type] = c._count;
      }
    }

    return result;
  }
}
