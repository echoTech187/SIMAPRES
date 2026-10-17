import { IComplaintRepository, IkmStats } from '@/domain/repositories/complaint.repository.interface';
import { ComplaintEntity, ComplaintStatus, UrgensiLevel } from '@/domain/entities/complaint.entity';
// SIMAPRES 110 - Prisma Complaint Repository Implementation (Normalized Schema)
import { prisma } from '../db/prisma.client';

const COMPLAINT_INCLUDE = {
  complaint_logs: { orderBy: { created_at: 'asc' } },
  dispatches: { include: { unit: true, officer: { include: { user: true } } } },
  evidences: { orderBy: { uploaded_at: 'asc' } },
  citizen_review_rel: true,
  operator: true,
  category_rel: true,
  source_rel: true,
} as const;

export class PrismaComplaintRepository implements IComplaintRepository {
  private mapToEntity(record: any): ComplaintEntity {
    // Cari dispatch utama (atau dispatch pertama) untuk petugas & ranmor yang ditugaskan
    const primaryDispatch = record.dispatches?.find((d: any) => d.is_primary_unit) || record.dispatches?.[0];
    const assignedOfficer = primaryDispatch?.officer || null;

    // Pawas yang memvalidasi diambil dari logbook audit log yang dilakukan oleh PAWAS
    const pawasLog = (record.complaint_logs || []).slice().reverse().find((l: any) => l.actor_role === 'PAWAS');

    // Ulasan warga diambil dari relasi tabel citizen_reviews
    const citizenReview = record.citizen_review_rel;

    // Hitung response time jika terdapat catatan waktu tiba dan disposisi di dispatch
    let responseTimeMinutes: number | null = null;
    if (primaryDispatch?.dispatched_at && primaryDispatch?.arrived_at) {
      const diffMs = new Date(primaryDispatch.arrived_at).getTime() - new Date(primaryDispatch.dispatched_at).getTime();
      responseTimeMinutes = Math.max(1, Math.round(diffMs / (1000 * 60)));
    }

    return new ComplaintEntity({
      id: record.id,
      nomorTiket: record.nomor_tiket,
      pelaporNama: record.pelapor_nama,
      pelaporHp: record.pelapor_hp,
      jenisKejadian: record.jenis_kejadian,
      urgensi: record.urgensi as UrgensiLevel,
      kategoriId: record.category_id,
      kategoriKey: record.kategori_key,
      kategoriRel: record.category_rel,
      platformId: record.source_id,
      platformKey: record.platform_key,
      platformRel: record.source_rel,
      tkpAlamatTeks: record.tkp_alamat_teks,
      tkpLat: Number(record.tkp_lat),
      tkpLng: Number(record.tkp_lng),
      ringkasanKeterangan: record.ringkasan_keterangan,
      status: record.status as ComplaintStatus,
      tahap: record.tahap,
      alasanTolak: record.alasan_tolak,
      operatorId: record.operator_id,
      assignedOfficerId: primaryDispatch?.officer_id || null,
      assignedOfficer: assignedOfficer
        ? {
            id: assignedOfficer.id,
            nrp: assignedOfficer.nrp,
            rankPangkat: assignedOfficer.rank_pangkat,
            jabatan: assignedOfficer.jabatan,
            assignedPatrolVehicle: assignedOfficer.assigned_patrol_vehicle,
            currentGpsLat: assignedOfficer.current_gps_lat ? Number(assignedOfficer.current_gps_lat) : null,
            currentGpsLng: assignedOfficer.current_gps_lng ? Number(assignedOfficer.current_gps_lng) : null,
            namaLengkap: (assignedOfficer.user as any)?.full_name || (assignedOfficer.user as any)?.nama_lengkap || '',
            avatarUrl: assignedOfficer.avatar_url,
          }
        : null,
      pawasValidasiId: null,
      pawas: pawasLog
        ? {
            id: 0n,
            namaLengkap: pawasLog.actor_name,
            identifier: pawasLog.actor_name,
          }
        : null,
      operator: record.operator
        ? {
            id: record.operator.id,
            namaLengkap: (record.operator as any)?.full_name || (record.operator as any)?.nama_lengkap || '',
            identifier: record.operator.identifier,
          }
        : null,
      disposisiAt: primaryDispatch?.dispatched_at || null,
      responTibaTkpAt: primaryDispatch?.arrived_at || null,
      selesaiAt: primaryDispatch?.completed_at || null,
      responseTimeMinutes,
      citizenRating: citizenReview?.star_rating || null,
      citizenReview: citizenReview?.review_text || null,
      citizenTags: citizenReview?.feedback_tags || null,
      timelines: (record.complaint_logs || []).map((t: any, idx: number) => ({
        tahapKe: idx + 1,
        tahapTitle: t.action,
        catatan: t.notes,
        fotoBuktiUrl: null,
        gpsLat: t.action_lat ? Number(t.action_lat) : null,
        gpsLng: t.action_lng ? Number(t.action_lng) : null,
        createdAt: t.created_at,
      })),
      dispatches: record.dispatches || [],
      complaintLogs: record.complaint_logs || [],
      evidences: record.evidences || [],
      citizenReviewRel: citizenReview || null,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    });
  }

  async findById(id: bigint): Promise<ComplaintEntity | null> {
    const record = await prisma.complaint.findUnique({
      where: { id },
      include: COMPLAINT_INCLUDE,
    });
    return record ? this.mapToEntity(record) : null;
  }

  async findByNomorTiket(nomorTiket: string): Promise<ComplaintEntity | null> {
    const record = await prisma.complaint.findUnique({
      where: { nomor_tiket: nomorTiket },
      include: COMPLAINT_INCLUDE,
    });
    return record ? this.mapToEntity(record) : null;
  }

  async findByPelaporHp(hp: string): Promise<ComplaintEntity[]> {
    const records = await prisma.complaint.findMany({
      where: { pelapor_hp: hp },
      orderBy: { created_at: 'desc' },
      include: COMPLAINT_INCLUDE,
    });
    return records.map((r: any) => this.mapToEntity(r));
  }

  async findAssignedToOfficer(officerId: bigint, activeOnly = false): Promise<ComplaintEntity[]> {
    const whereClause: any = {
      dispatches: {
        some: { officer_id: officerId },
      },
    };
    if (activeOnly) {
      whereClause.status = { in: ['DISPOSISI', 'MENUJU_TKP', 'PENANGANAN_TKP', 'DIPROSES'] };
    }
    const records = await prisma.complaint.findMany({
      where: whereClause,
      orderBy: { created_at: 'desc' },
      include: COMPLAINT_INCLUDE,
    });
    return records.map((r: any) => this.mapToEntity(r));
  }

  async findAntreanPawas(): Promise<ComplaintEntity[]> {
    const records = await prisma.complaint.findMany({
      where: { status: 'MENUNGGU' },
      orderBy: { created_at: 'asc' },
      include: COMPLAINT_INCLUDE,
    });
    return records.map((r: any) => this.mapToEntity(r));
  }

  async findAllRecent(limit = 50): Promise<ComplaintEntity[]> {
    const records = await prisma.complaint.findMany({
      take: limit,
      orderBy: { created_at: 'desc' },
      include: COMPLAINT_INCLUDE,
    });
    return records.map((r: any) => this.mapToEntity(r));
  }

  async create(complaint: ComplaintEntity): Promise<ComplaintEntity> {
    const data = complaint.toJSON();

    // Map urgency_id
    let urgencyId: number | null = null;
    const urg = (data.urgensi || 'SEDANG').toUpperCase();
    if (urg.includes('DARURAT') || urg.includes('TINGGI')) urgencyId = 1;
    else if (urg.includes('SEDANG')) urgencyId = 2;
    else if (urg.includes('NORMAL')) urgencyId = 3;

    // Map status_id
    let statusId: number | null = null;
    const st = (data.status || 'MENUNGGU').toUpperCase();
    if (st === 'MENUNGGU' || st === 'BELUM_DITANGANI') statusId = 1;
    else if (st === 'DIPROSES' || st === 'DISPOSISI' || st === 'MENUJU_TKP' || st === 'PENANGANAN_TKP') statusId = 2;
    else if (st === 'MENUNGGU_PENGESAHAN') statusId = 3;
    else if (st === 'SELESAI') statusId = 4;
    else if (st === 'DITOLAK' || st === 'DIBATALKAN') statusId = 5;

    // Map category_id and kategori_key
    let categoryId: number | null = data.kategoriId || null;
    let kategoriKey: string | null = data.kategoriKey || null;
    const jk = (data.jenisKejadian || '').toLowerCase();
    if (!kategoriKey) {
      if (jk.includes('krim') || jk.includes('begal') || jk.includes('curas') || jk.includes('curat') || jk.includes('curanmor') || jk.includes('curi') || jk.includes('jambret')) {
        kategoriKey = 'Kriminalitas';
        categoryId = 11;
      } else if (jk.includes('kamtib') || jk.includes('tawuran') || jk.includes('miras') || jk.includes('ribut') || jk.includes('sajam') || jk.includes('bentrok') || jk.includes('narkoba')) {
        kategoriKey = 'Kamtibmas';
        categoryId = 12;
      } else if (jk.includes('laka') || jk.includes('lantas') || jk.includes('tabrak') || jk.includes('macet') || jk.includes('mogok')) {
        kategoriKey = 'Laka Lantas';
        categoryId = 13;
      } else if (jk.includes('bencana') || jk.includes('darurat') || jk.includes('kebakaran') || jk.includes('banjir') || jk.includes('pohon') || jk.includes('longsor')) {
        kategoriKey = 'Darurat Bencana';
        categoryId = 14;
      } else if (jk.includes('publik') || jk.includes('layanan') || jk.includes('bansos') || jk.includes('hilang') || jk.includes('hewan')) {
        kategoriKey = 'Pelayanan Publik';
        categoryId = 15;
      } else {
        kategoriKey = 'Kamtibmas';
        categoryId = 12;
      }
    } else {
      const kk = kategoriKey.toLowerCase();
      if (kk.includes('krim') || kk.includes('begal') || kk.includes('curanmor')) {
        kategoriKey = 'Kriminalitas';
        categoryId = 11;
      } else if (kk.includes('kamtib') || kk.includes('tawuran')) {
        kategoriKey = 'Kamtibmas';
        categoryId = 12;
      } else if (kk.includes('laka') || kk.includes('lantas')) {
        kategoriKey = 'Laka Lantas';
        categoryId = 13;
      } else if (kk.includes('bencana') || kk.includes('darurat')) {
        kategoriKey = 'Darurat Bencana';
        categoryId = 14;
      } else if (kk.includes('publik') || kk.includes('layanan')) {
        kategoriKey = 'Pelayanan Publik';
        categoryId = 15;
      } else {
        categoryId = categoryId || 12;
      }
    }

    // Map source_id and platform_key
    let sourceId: number | null = data.platformId || null;
    let platformKey: string | null = data.platformKey || null;
    if (!platformKey) {
      const src = ((data.ringkasanKeterangan || '') + (data.jenisKejadian || '')).toLowerCase();
      if (src.includes('sos') || jk.includes('sos')) {
        platformKey = 'sos';
        sourceId = 5;
      } else if (src.includes('portal') || src.includes('warga') || data.pelaporNama?.toLowerCase().includes('warga')) {
        platformKey = 'warga';
        sourceId = 6;
      } else if (src.includes('110') || src.includes('telepon') || src.includes('spkt') || src.includes('call')) {
        platformKey = 'layanan110';
        sourceId = 7;
      } else {
        platformKey = 'warga';
        sourceId = 6;
      }
    } else if (!sourceId) {
      if (platformKey === 'sos') sourceId = 5;
      else if (platformKey === 'warga') sourceId = 6;
      else if (platformKey === 'layanan110') sourceId = 7;
      else if (platformKey === 'personel') sourceId = 8;
    }

    // Strip emoji and variation selectors from jenis_kejadian to ensure realistic, clean text in database
    const cleanJenisKejadian = (data.jenisKejadian || '')
      .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]|\uFE0F|[\u2600-\u27BF]/g, '')
      .trim() || data.jenisKejadian;

    const created = await prisma.complaint.create({
      data: {
        nomor_tiket: data.nomorTiket,
        pelapor_nama: data.pelaporNama,
        pelapor_hp: data.pelaporHp,
        jenis_kejadian: cleanJenisKejadian,
        urgensi: data.urgensi,
        urgency_id: urgencyId,
        category_id: categoryId,
        kategori_key: kategoriKey,
        source_id: sourceId,
        platform_key: platformKey,
        status_id: statusId,
        tkp_alamat_teks: data.tkpAlamatTeks,
        tkp_lat: data.tkpLat,
        tkp_lng: data.tkpLng,
        ringkasan_keterangan: data.ringkasanKeterangan,
        status: data.status,
        operator_id: data.operatorId,
      },
      include: COMPLAINT_INCLUDE,
    });

    // Otomatis catat Audit Log Pertama (LAPORAN_MASUK) saat pengaduan pertama kali dibuat
    await prisma.complaintAuditLog.create({
      data: {
        complaint_id: created.id,
        actor_name: data.operator?.namaLengkap || 'Operator SPKT Presisi 110',
        actor_role: 'OPERATOR',
        action: 'LAPORAN_MASUK',
        notes: data.ringkasanKeterangan || 'Laporan pengaduan warga diterima melalui sistem layanan 110 SPKT.',
        action_lat: data.tkpLat,
        action_lng: data.tkpLng,
        created_at: created.created_at,
      },
    });

    // Fetch ulang agar include complaint_logs terisi lengkap
    const reloaded = await prisma.complaint.findUnique({
      where: { id: created.id },
      include: COMPLAINT_INCLUDE,
    });

    return this.mapToEntity(reloaded || created);
  }

  async update(complaint: ComplaintEntity): Promise<ComplaintEntity> {
    const data = complaint.toJSON();
    if (!data.id) throw new Error('Cannot update complaint without ID');

    let statusId: number | undefined = undefined;
    if (data.status) {
      const st = (data.status || '').toUpperCase();
      if (st === 'MENUNGGU' || st === 'BELUM_DITANGANI') statusId = 1;
      else if (st === 'DIPROSES' || st === 'DISPOSISI' || st === 'MENUJU_TKP' || st === 'PENANGANAN_TKP') statusId = 2;
      else if (st === 'MENUNGGU_PENGESAHAN') statusId = 3;
      else if (st === 'SELESAI') statusId = 4;
      else if (st === 'DITOLAK' || st === 'DIBATALKAN') statusId = 5;
    }

    const updated = await prisma.complaint.update({
      where: { id: data.id },
      data: {
        status: data.status,
        ...(statusId ? { status_id: statusId } : {}),
        tahap: data.tahap,
        alasan_tolak: data.alasanTolak,
      },
      include: COMPLAINT_INCLUDE,
    });

    // Jika ada data rating/review dari warga, simpan di tabel relasi citizen_reviews
    if (data.citizenRating) {
      await prisma.citizenReview.upsert({
        where: { complaint_id: data.id },
        update: {
          star_rating: data.citizenRating,
          feedback_tags: data.citizenTags || null,
          review_text: data.citizenReview || null,
        },
        create: {
          complaint_id: data.id,
          star_rating: data.citizenRating,
          feedback_tags: data.citizenTags || null,
          review_text: data.citizenReview || null,
          reporter_name: data.pelaporNama || 'Warga Masyarakat',
        },
      });
    }

    const reloaded = await prisma.complaint.findUnique({
      where: { id: data.id },
      include: COMPLAINT_INCLUDE,
    });

    return this.mapToEntity(reloaded || updated);
  }

  async getIkmStats(): Promise<IkmStats> {
    // Ambil data voting langsung dari tabel citizen_reviews yang ter-normalisasi
    const reviews = await prisma.citizenReview.findMany({
      select: { star_rating: true },
    });

    const totalVoting = reviews.length;
    if (totalVoting === 0) {
      return {
        totalVoting: 0,
        averageRating: 5.0,
        percentageSatisfaction: 100,
        ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      };
    }

    const breakdown: { [stars: number]: number } = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let totalScore = 0;

    for (const item of reviews) {
      const score = item.star_rating || 5;
      totalScore += score;
      if (breakdown[score] !== undefined) {
        breakdown[score]++;
      }
    }

    const averageRating = Math.round((totalScore / totalVoting) * 10) / 10;
    const percentageSatisfaction = Math.round((averageRating / 5) * 1000) / 10;

    return {
      totalVoting,
      averageRating,
      percentageSatisfaction,
      ratingBreakdown: breakdown,
    };
  }
}
