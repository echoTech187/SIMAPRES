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
      officer: record.officer,
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
    try {
      const rows: any[] = await prisma.$queryRaw`
        SELECT l.*
        FROM officer_logbooks l
        WHERE l.officer_id = ${officerId}
           OR l.officer_id = (SELECT id FROM police_officers WHERE user_id = ${officerId} LIMIT 1)
        ORDER BY l.created_at DESC
        LIMIT ${limit};
      `;
      return rows.map((r: any) => this.mapToEntity(r));
    } catch (_err) {
      // 1. Direct indexed scan on officer_id (matches idx_logbook_officer_created: officer_id, created_at DESC)
      let records = await prisma.officerLogbook.findMany({
        where: { officer_id: officerId },
        orderBy: { created_at: 'desc' },
        take: limit,
      });

      // 2. Fallback jika parameter yang dikirim merupakan user_id bukan police_officers.id
      if (records.length === 0) {
        const officer = await prisma.policeOfficer.findFirst({
          where: { user_id: officerId },
          select: { id: true },
        });
        if (officer) {
          records = await prisma.officerLogbook.findMany({
            where: { officer_id: officer.id },
            orderBy: { created_at: 'desc' },
            take: limit,
          });
        }
      }

      return records.map((r: any) => this.mapToEntity(r));
    }
  }

  private mapRawToEntity(r: any): LogbookEntity {
    return new LogbookEntity({
      id: r.id,
      officerId: r.officer_id,
      complaintId: r.complaint_id,
      jenisAksi: r.action_type as JenisAksiLogbook,
      lokasiKlaimAlamat: r.claimed_address,
      lokasiKlaimLat: Number(r.claimed_lat),
      lokasiKlaimLng: Number(r.claimed_lng),
      lokasiGpsAktualLat: Number(r.actual_lat),
      lokasiGpsAktualLng: Number(r.actual_lng),
      deviasiMeter: Number(r.deviation_meters),
      isDeviasiFlagged: Boolean(r.is_deviation_flagged),
      jamMulai: r.start_time,
      jamSelesai: r.end_time,
      fotoBuktiUrl: r.photo_url,
      fotoExifLat: r.photo_exif_lat ? Number(r.photo_exif_lat) : null,
      fotoExifLng: r.photo_exif_lng ? Number(r.photo_exif_lng) : null,
      deskripsiKegiatan: r.activity_description,
      statusValidasi: r.validation_status as StatusValidasiLogbook,
      createdAt: r.created_at,
      officer: r.officer_id ? {
        id: r.officer_id,
        nrp: r.officer_nrp,
        rank_pangkat: r.officer_rank,
        jabatan: r.officer_jabatan,
        user: {
          full_name: r.officer_full_name,
          avatar_url: r.officer_avatar,
        },
        unit: r.unit_name ? {
          unit_name: r.unit_name,
          short_name: r.unit_short_name,
        } : null,
      } : null,
    });
  }

  async findRecent(limit = 10, stationId?: number): Promise<LogbookEntity[]> {
    try {
      const numStation = stationId ? Number(stationId) : null;
      const rawRows: any[] = await prisma.$queryRaw`
        SELECT 
          l.id, l.officer_id, l.complaint_id, l.action_type, l.claimed_address,
          l.claimed_lat, l.claimed_lng, l.actual_lat, l.actual_lng, l.deviation_meters,
          l.is_deviation_flagged, l.start_time, l.end_time, l.photo_url, l.photo_exif_lat,
          l.photo_exif_lng, l.activity_description, l.validation_status, l.created_at,
          po.nrp as officer_nrp, po.rank_pangkat as officer_rank, po.jabatan as officer_jabatan,
          u.full_name as officer_full_name, u.avatar_url as officer_avatar,
          un.unit_name, un.short_name as unit_short_name
        FROM officer_logbooks l
        LEFT JOIN police_officers po ON po.id = l.officer_id
        LEFT JOIN users u ON u.id = po.user_id
        LEFT JOIN master_operational_units un ON un.id = po.unit_id
        WHERE l.action_type IN ('PATROLI', 'SAMBANG', 'PENGAMANAN', 'TPTKP')
          AND (${numStation} IS NULL OR po.station_id = ${numStation})
        ORDER BY l.created_at DESC
        LIMIT ${limit};
      `;
      return rawRows.map((r) => this.mapRawToEntity(r));
    } catch (_err) {
      const where: any = {
        action_type: { in: ['PATROLI', 'SAMBANG', 'PENGAMANAN', 'TPTKP'] },
      };
      if (stationId) {
        where.officer = { station_id: stationId };
      }
      const records = await prisma.officerLogbook.findMany({
        where,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          officer: {
            include: {
              user: {
                select: {
                  full_name: true,
                  avatar_url: true,
                },
              },
              unit: {
                select: {
                  unit_name: true,
                  short_name: true,
                },
              },
            },
          },
        },
      });
      return records.map((r: any) => this.mapToEntity(r));
    }
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

  async updateValidationStatus(id: bigint, status: string, note?: string): Promise<LogbookEntity> {
    const existing = await prisma.officerLogbook.findUnique({ where: { id } });
    if (!existing) {
      throw new Error(`Logbook dengan ID ${id} tidak ditemukan.`);
    }

    let activityDesc = existing.activity_description || '';
    if (note && note.trim().length > 0) {
      activityDesc = `${activityDesc}\n\n[CATATAN PAWAS]: ${note.trim()}`;
    }

    const updated = await prisma.officerLogbook.update({
      where: { id },
      data: {
        validation_status: status,
        activity_description: activityDesc,
      },
      include: {
        officer: {
          include: {
            user: {
              select: {
                full_name: true,
                avatar_url: true,
              },
            },
            unit: {
              select: {
                unit_name: true,
                short_name: true,
              },
            },
          },
        },
      },
    });

    return this.mapToEntity(updated);
  }
}
