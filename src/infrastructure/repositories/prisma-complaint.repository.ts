import { IComplaintRepository, IkmStats } from '@/domain/repositories/complaint.repository.interface';
import { ComplaintEntity, ComplaintStatus, UrgensiLevel } from '@/domain/entities/complaint.entity';
// SIMAPRES 110 - Prisma Complaint Repository Implementation (Normalized Schema)
import { prisma } from '../db/prisma.client';

const COMPLAINT_INCLUDE = {
  complaint_logs: { orderBy: { created_at: 'asc' } },
  dispatches: { include: { unit: true, station: true, officer: { include: { user: true } } } },
  evidences: { orderBy: { uploaded_at: 'asc' } },
  citizen_review_rel: true,
  operator: true,
  station: true,
  category_rel: true,
  subcategory_rel: { include: { unit_rel: true, category_rel: true } },
  source_rel: true,
  resolution_location_rel: true,
  resolution_document_rel: true,
} as const;

// Batas riwayat tugas personel yang dimuat (tugas aktif selalu dimuat penuh)
const OFFICER_HISTORY_LIMIT = 100;

export class PrismaComplaintRepository implements IComplaintRepository {
  private mapToEntity(record: any): ComplaintEntity {
    // 1. Petugas & Armada Disposisi
    const acceptedDispatch = record.dispatches?.find((d: any) => d.accepted_at && d.officer);
    const primaryDispatch = acceptedDispatch || record.dispatches?.find((d: any) => d.is_primary_unit) || record.dispatches?.[0] || null;
    const assignedOfficer = primaryDispatch?.officer || null;

    // 2. Pawas dari log tindakan komando
    const pawasLog = (record.complaint_logs || []).slice().reverse().find((l: any) => l.actor_role === 'PAWAS');

    // 3. Ulasan warga
    const citizenReview = record.citizen_review_rel;

    // 4. Hitung Response Time (menit)
    let responseTimeMinutes: number | null = null;
    const dispTime = primaryDispatch?.dispatched_at || record.disposisi_at || record.created_at;
    const arrTime = primaryDispatch?.arrived_at || null;
    if (dispTime && arrTime) {
      const diffMs = new Date(arrTime).getTime() - new Date(dispTime).getTime();
      responseTimeMinutes = Math.max(1, Math.round(diffMs / (1000 * 60)));
    }

    // 5. Bukti Laporan Awal
    const evidenceList = record.evidences || [];
    const evidenceAwal = evidenceList.find((e: any) => e.incident_phase === 'LAPORAN_AWAL') || null;

    // 6. Catatan Tindakan & Selesai
    const logTindakan = (record.complaint_logs || [])
      .slice()
      .reverse()
      .find((l: any) => l.notes && (l.action?.includes('Tindakan') || l.action?.includes('TKP')));
    const catatanTindakan = logTindakan?.notes?.replace(/^Catatan:\s*/i, '') || null;

    const logSelesai = (record.complaint_logs || [])
      .slice()
      .reverse()
      .find((l: any) => l.notes && (l.action?.includes('Selesai') || l.action?.includes('BAP')));
    const catatanSelesai = logSelesai?.notes?.replace(/^Catatan:\s*/i, '') || null;

    // 7. Waktu & Koordinat Operasional
    const rawMeluncurDate = primaryDispatch?.departed_at || null;
    const waktuMeluncur = rawMeluncurDate ? new Date(rawMeluncurDate).toISOString() : null;

    const koordinatGps = record.tkp_lat && record.tkp_lng
      ? `${Number(record.tkp_lat).toFixed(6)}, ${Number(record.tkp_lng).toFixed(6)}`
      : null;

    const waktuTiba = primaryDispatch?.arrived_at
      ? new Date(primaryDispatch.arrived_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }) + ' WIB'
      : null;

    const waktuSelesaiDate = primaryDispatch?.completed_at || record.selesai_at || null;
    const waktuSelesai = waktuSelesaiDate
      ? new Date(waktuSelesaiDate).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }) + ' WIB'
      : null;

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
      subcategoryId: record.subcategory_id,
      subcategory: record.subcategory_rel,
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
            namaLengkap: assignedOfficer.user?.full_name || '',
            phoneNumber: assignedOfficer.user?.phone_number || null,
            unitName: primaryDispatch?.unit?.unit_name || assignedOfficer.unit?.unit_name || assignedOfficer.jabatan || null,
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
            namaLengkap: record.operator.full_name,
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
      fotoBuktiUrl: evidenceAwal?.file_url || null,
        catatanTindakan,
        catatanSelesai,
        waktuMeluncur,
        koordinatGps,
        waktuTiba,
        waktuSelesai,
        waktuSelesaiDate,
        timelines: (record.complaint_logs || []).map((t: any, idx: number) => {
          return {
            tahapKe: idx + 1,
            tahapTitle: t.action,
            catatan: t.notes,
            fotoBuktiUrl: evidenceAwal?.file_url,
            gpsLat: t.action_lat ? Number(t.action_lat) : null,
            gpsLng: t.action_lng ? Number(t.action_lng) : null,
            createdAt: t.created_at,
          };
        }),
        dispatches: record.dispatches || [],
        complaintLogs: record.complaint_logs || [],
        evidences: record.evidences || [],
        citizenReviewRel: citizenReview || null,
        stationId: record.station_id,
        station: record.station || null,
        resolutionLocationId: record.resolution_location_id,
        resolutionLocationKey: record.resolution_location_key,
        resolutionLocationName: record.resolution_location_name,
        resolutionLocationRel: record.resolution_location_rel,
        resolutionDocumentId: record.resolution_document_id,
        resolutionDocumentKey: record.resolution_document_key,
        resolutionDocumentName: record.resolution_document_name,
        resolutionDocumentRel: record.resolution_document_rel,
        createdAt: record.created_at,
        updatedAt: record.updated_at,
        created_at: record.created_at,
        updated_at: record.updated_at,
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
    if (!nomorTiket) return null;
    const cleanTiket = nomorTiket.trim();
    const cleanWithHash = cleanTiket.startsWith('#') ? cleanTiket : `#${cleanTiket}`;
    const cleanWithoutHash = cleanTiket.startsWith('#') ? cleanTiket.slice(1) : cleanTiket;
    const strippedTicket = cleanTiket.replace(/^TICKET-/, '');
    const addedTicket = `TICKET-${cleanTiket}`;

    const record = await prisma.complaint.findFirst({
      where: {
        OR: [
          { nomor_tiket: cleanTiket },
          { nomor_tiket: cleanWithHash },
          { nomor_tiket: cleanWithoutHash },
          { nomor_tiket: strippedTicket },
          { nomor_tiket: addedTicket },
        ],
      },
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

  private static officerResolutionCache = new Map<string, {
    resolvedOfficerId: bigint;
    resolvedStationId: number | null;
    resolvedUnitId: number | null;
    isPersonilRole?: boolean;
    isPiket?: boolean;
    expiresAt: number;
  }>();

  async findAssignedToOfficer(officerId: bigint, activeOnly = false): Promise<ComplaintEntity[]> {
    const officerIdStr = String(officerId);
    const paddedNrp = officerIdStr.padStart(8, '0');
    let resolvedOfficerId = officerId;
    let resolvedStationId: number | null = null;
    let resolvedUnitId: number | null = null;

    let isPersonilRole = true;
    let isPiket = false;

    const cached = PrismaComplaintRepository.officerResolutionCache.get(officerIdStr);
    if (cached && Date.now() < cached.expiresAt) {
      resolvedOfficerId = cached.resolvedOfficerId;
      resolvedStationId = cached.resolvedStationId;
      resolvedUnitId = cached.resolvedUnitId;
      isPersonilRole = cached.isPersonilRole ?? true;
      isPiket = cached.isPiket ?? false;
    } else {
      const officer = await prisma.policeOfficer.findFirst({
        where: {
          OR: [
            { id: officerId },
            { user_id: officerId },
            { nrp: officerIdStr },
            { nrp: paddedNrp },
          ],
        },
        include: {
          user: true,
          unit: true,
          station: true,
        },
      });

      if (officer) {
        resolvedOfficerId = officer.id;
        resolvedStationId = officer.station_id || null;
        resolvedUnitId = officer.unit_id || null;
        isPersonilRole = officer.user?.role ? officer.user.role === 'PERSONIL' : true;

        // Cek status kesiagaan dinas / piket di Mako:
        // 1. Status kedinasan aktif (bukan LEPAS_DINAS)
        const isDutyActive = Boolean(officer.duty_status && officer.duty_status !== 'LEPAS_DINAS');

        // 2. Atau terdaftar dalam jadwal piket hari ini di Mako tempat menginduk
        let isScheduledToday = false;
        try {
          const todayStart = new Date();
          todayStart.setHours(0, 0, 0, 0);
          const todayEnd = new Date();
          todayEnd.setHours(23, 59, 59, 999);

          const piketMember = await prisma.piketScheduleMember.findFirst({
            where: {
              officer_id: officer.id,
              schedule: {
                ...(officer.station_id ? { station_id: officer.station_id } : {}),
                schedule_date: {
                  gte: todayStart,
                  lte: todayEnd,
                },
                status: { not: 'DIBATALKAN' },
              },
              status_kehadiran: { notIn: ['LEPAS_PIKET', 'IZIN', 'SAKIT'] },
            },
            select: { id: true },
          });
          isScheduledToday = Boolean(piketMember);
        } catch (_) {}

        isPiket = isDutyActive || isScheduledToday;
      }

      const cacheItem = {
        resolvedOfficerId,
        resolvedStationId,
        resolvedUnitId,
        isPersonilRole,
        isPiket,
        expiresAt: Date.now() + 30 * 1000, // 30 detik TTL agar perubahan status piket segera terbaca
      };
      PrismaComplaintRepository.officerResolutionCache.set(officerIdStr, cacheItem);
      if (paddedNrp !== officerIdStr) {
        PrismaComplaintRepository.officerResolutionCache.set(paddedNrp, cacheItem);
      }
    }

    // 1. Tiket yang sudah secara spesifik ditugaskan / diterima oleh personil ini
    const assignedCondition: any = {
      dispatches: {
        some: {
          officer_id: resolvedOfficerId,
        },
      },
    };

    const orConditions: any[] = [assignedCondition];

    // 2. Siaran Terbuka (Open Broadcast / Disposisi Mako):
    // Syarat ketat:
    // - Akun ber-role PERSONIL
    // - Menginduk di Mako tiket (resolvedStationId tidak null)
    // - Sedang PIKET / dinas aktif di Mako tersebut (isPiket === true)
    // - Tiket berasal dari Mako yang sama (station_id === resolvedStationId)
    // - Terbuka untuk semua satuan (tanpa batasan unit_id)
    if (isPersonilRole && isPiket && resolvedStationId) {
      orConditions.push({
        station_id: resolvedStationId,
        status: { in: ['MENUNGGU', 'DIPROSES'] },
        dispatches: {
          some: {
            OR: [
              { officer_id: null },
              { officer_id: resolvedOfficerId },
            ],
          },
        },
      });
    }

    const whereClause: any = {
      OR: orConditions,
    };
    if (activeOnly) {
      whereClause.status = {
        notIn: ['SELESAI', 'DITOLAK'],
      };
    }
    const records = await prisma.complaint.findMany({
      where: whereClause,
      orderBy: { created_at: 'desc' },
      take: activeOnly ? undefined : OFFICER_HISTORY_LIMIT,
      include: COMPLAINT_INCLUDE,
    });
    return records.map((r: any) => this.mapToEntity(r));
  }

  async findAntreanPawas(stationId?: number): Promise<ComplaintEntity[]> {
    let whereClause: any;

    if (stationId) {
      const isMakoAsal = Number(stationId) === 60001;
      if (isMakoAsal) {
        // Mako Asal 110 (Polres Pekalongan) menampilkan:
        // 1. Tiket lokal yang berstatus MENUNGGU (station_id 60001 atau belum terikat stasiun)
        // 2. Tiket yang sedang dalam status DISPOSISI_LINTAS_WILAYAH (agar operator Mako Asal tetap dapat memantau responnya)
        whereClause = {
          OR: [
            { status: 'MENUNGGU', station_id: stationId },
            { status: 'MENUNGGU', station_id: null },
            { status: 'DISPOSISI_LINTAS_WILAYAH' },
          ],
        };
      } else {
        // Polsek / Polres tujuan: Tiket lokal MENUNGGU atau tiket limpahan DISPOSISI_LINTAS_WILAYAH pada stasiun mereka
        whereClause = {
          status: { in: ['MENUNGGU', 'DISPOSISI_LINTAS_WILAYAH'] },
          station_id: stationId,
        };
      }
    } else {
      whereClause = {
        status: { in: ['MENUNGGU', 'DISPOSISI_LINTAS_WILAYAH'] },
      };
    }

    const records = await prisma.complaint.findMany({
      where: whereClause,
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

    // Resolve urgency_id dari master_urgency_levels
    let urgencyId: number | null = null;
    if (data.urgensi) {
      const urg = String(data.urgensi).toUpperCase();
      const mUrg = await prisma.masterUrgencyLevel.findFirst({
        where: { key: urg },
        select: { id: true },
      }).catch(() => null);
      if (mUrg) urgencyId = mUrg.id;
    }

    // Resolve status_id dari master_complaint_statuses
    let statusId: number | null = null;
    if (data.status) {
      const st = String(data.status).toUpperCase();
      const mStat = await prisma.masterComplaintStatus.findFirst({
        where: { key: st },
        select: { id: true },
      }).catch(() => null);
      if (mStat) statusId = mStat.id;
    }

    // Map source_id and platform_key safely from Database
    let sourceId: number | null = null;
    let platformKey: string | null = data.platformKey || null;
    try {
      if (platformKey) {
        const mSrc = await prisma.masterReportSource.findFirst({
          where: {
            OR: [
              { key: platformKey.toUpperCase() },
              { label: { contains: platformKey } },
            ],
          },
          select: { id: true, key: true },
        });
        if (mSrc) {
          sourceId = mSrc.id;
          platformKey = mSrc.key;
        }
      }
    } catch (_) {}

    // Strip emoji and variation selectors from jenis_kejadian to ensure realistic, clean text in database
    const cleanJenisKejadian = (data.jenisKejadian || '')
      .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]|\uFE0F|[\u2600-\u27BF]/g, '')
      .trim() || data.jenisKejadian;

    // Resolve subcategory_id and auto-fill category_id and kategori_key
    let subcategoryId: number | null = (data as any).subcategoryId ? Number((data as any).subcategoryId) : null;
    let categoryId: number | null = null;
    let kategoriKey: string | null = null;

    if (subcategoryId) {
      try {
        const foundSub = await (prisma as any).masterIncidentSubcategory.findUnique({
          where: { id: subcategoryId },
          select: { id: true, category_id: true, category_key: true },
        });
        if (foundSub) {
          categoryId = foundSub.category_id;
          kategoriKey = foundSub.category_key;
        }
      } catch (_) {}
    }

    // If categoryId/kategoriKey not yet resolved from subcategory, search masterIncidentCategory
    if (!kategoriKey) {
      const candidateKey = (data.kategoriKey || cleanJenisKejadian || '').trim();
      if (candidateKey) {
        try {
          const mCat = await prisma.masterIncidentCategory.findFirst({
            where: {
              OR: [
                { key: candidateKey.toUpperCase() },
                { label: { contains: candidateKey } },
              ],
            },
            select: { id: true, key: true },
          });
          if (mCat) {
            categoryId = mCat.id;
            kategoriKey = mCat.key;
          }
        } catch (_) {}
      }
    }

    // Fallback: search subcategory by name if still not resolved
    if (!subcategoryId && (cleanJenisKejadian || data.ringkasanKeterangan)) {
      try {
        const foundSub = await (prisma as any).masterIncidentSubcategory.findFirst({
          where: {
            OR: [
              { nama_kasus: { contains: cleanJenisKejadian } },
              { nama_kasus: { contains: (data.ringkasanKeterangan || '').slice(0, 50) } },
            ],
          },
          select: { id: true, category_id: true, category_key: true },
        });
        if (foundSub) {
          subcategoryId = foundSub.id;
          if (!categoryId) categoryId = foundSub.category_id;
          if (!kategoriKey) kategoriKey = foundSub.category_key;
        }
      } catch (_) {}
    }

    // Strict safety guard: ensure kategoriKey NEVER exceeds VARCHAR(50) and always defaults cleanly
    if (!kategoriKey) {
      kategoriKey = 'KAMTIBMAS';
      if (!categoryId) categoryId = 2;
    } else if (kategoriKey.length > 50) {
      kategoriKey = kategoriKey.substring(0, 50);
    }

    const created = await prisma.$transaction(async (tx) => {
      const newComplaint = await tx.complaint.create({
        data: {
          nomor_tiket: data.nomorTiket,
          pelapor_nama: data.pelaporNama,
          pelapor_hp: data.pelaporHp,
          jenis_kejadian: cleanJenisKejadian,
          urgensi: data.urgensi,
          urgency_id: urgencyId,
          category_id: categoryId,
          kategori_key: kategoriKey,
          subcategory_id: subcategoryId,
          source_id: sourceId,
          platform_key: platformKey,
          status_id: statusId,
          tkp_alamat_teks: data.tkpAlamatTeks,
          tkp_lat: data.tkpLat,
          tkp_lng: data.tkpLng,
          ringkasan_keterangan: data.ringkasanKeterangan,
          status: data.status,
          operator_id: data.operatorId,
        } as any,
        select: { id: true, created_at: true },
      });

      // Ambil identitas riil aktor dari session login petugas
      let sessionUser: any = null;
      try {
        const { getSession } = await import('@/lib/session');
        sessionUser = await getSession();
      } catch (_) {}

      const actorName = sessionUser?.fullName;
      const actorRole = sessionUser?.role;

      await tx.complaintAuditLog.create({
        data: {
          complaint_id: newComplaint.id,
          actor_name: actorName,
          actor_role: actorRole,
          action: 'LAPORAN_MASUK',
          notes: data.ringkasanKeterangan || null,
          action_lat: data.tkpLat,
          action_lng: data.tkpLng,
          created_at: newComplaint.created_at,
        },
      });

      // Simpan foto bukti lampiran kejadian langsung dari pelapor jika ada (eksklusif dokumen/foto pelapor)
      if (data.fotoBuktiUrl) {
        let savedPhotoUrl = data.fotoBuktiUrl;
        if (savedPhotoUrl.startsWith('data:image/')) {
          try {
            const fs = await import('fs');
            const path = await import('path');
            const matches = savedPhotoUrl.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
            if (matches) {
              const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
              const buffer = Buffer.from(matches[2], 'base64');
              const uploadDir = path.join(process.cwd(), 'public', 'uploads');
              if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
              }
              const fileName = `pelapor_${newComplaint.id}_${Date.now()}.${ext}`;
              fs.writeFileSync(path.join(uploadDir, fileName), buffer);
              savedPhotoUrl = `/uploads/${fileName}`;
            }
          } catch (imgErr) {
            console.warn('Gagal menyimpan file foto pelapor ke disk:', imgErr);
          }
        }

        await tx.complaintEvidence.create({
          data: {
            complaint_id: newComplaint.id,
            incident_phase: 'LAPORAN_AWAL',
            file_url: savedPhotoUrl.slice(0, 255),
            caption: 'Foto Lampiran Kejadian dari Pelapor',
            exif_lat: data.tkpLat,
            exif_lng: data.tkpLng,
          },
        });
      }

      return newComplaint;
    }, {
      maxWait: 15000,
      timeout: 30000,
    });

    // Fetch ulang agar include complaint_logs & relasi terisi lengkap
    const reloaded = await prisma.complaint.findUnique({
      where: { id: created.id },
      include: COMPLAINT_INCLUDE,
    });

    return this.mapToEntity(reloaded || created);
  }

  async update(complaint: ComplaintEntity): Promise<ComplaintEntity> {
    const data = complaint.toJSON();
    if (!data.id) throw new Error('Cannot update complaint without ID');
    const complaintId = data.id;

    let statusId: number | undefined = undefined;
    if (data.status) {
      const st = String(data.status).toUpperCase();
      const mStat = await prisma.masterComplaintStatus.findFirst({
        where: { key: st },
        select: { id: true },
      }).catch(() => null);
      if (mStat) statusId = mStat.id;
    }

    const updated = await prisma.$transaction(async (tx) => {
      // 1. Update status dan data pengaduan
      const updatedComplaint = await tx.complaint.update({
        where: { id: complaintId },
        data: {
          status: data.status,
          ...(statusId ? { status_id: statusId } : {}),
          tahap: (data.status === 'SELESAI' || data.status === 'MENUNGGU_PENGESAHAN') ? 5 : (data.tahap ?? 1),
          alasan_tolak: data.alasanTolak,
          ...(data.resolutionLocationId !== undefined ? { resolution_location_id: data.resolutionLocationId } : {}),
          ...(data.resolutionLocationKey !== undefined ? { resolution_location_key: data.resolutionLocationKey } : {}),
          ...(data.resolutionLocationName !== undefined ? { resolution_location_name: data.resolutionLocationName } : {}),
          ...(data.resolutionDocumentId !== undefined ? { resolution_document_id: data.resolutionDocumentId } : {}),
          ...(data.resolutionDocumentKey !== undefined ? { resolution_document_key: data.resolutionDocumentKey } : {}),
          ...(data.resolutionDocumentName !== undefined ? { resolution_document_name: data.resolutionDocumentName } : {}),
        },
        select: { id: true },
      });

      // 2. Sinkronisasi tabel relasi complaint_dispatches jika ada petugas yang ditugaskan
      if (data.assignedOfficerId) {
        const existingDispatch = await tx.complaintDispatch.findFirst({
          where: {
            complaint_id: complaintId,
            OR: [
              { officer_id: data.assignedOfficerId },
              { is_primary_unit: true },
            ],
          },
          orderBy: { is_primary_unit: 'desc' },
        });

        let unitId: number | null = null;
        const officer = await tx.policeOfficer.findUnique({
          where: { id: data.assignedOfficerId },
          select: { unit_id: true },
        });
        if (officer?.unit_id) {
          unitId = officer.unit_id;
        } else {
          const defaultUnit = await tx.masterOperationalUnit.findFirst({ select: { id: true } });
          if (defaultUnit) unitId = defaultUnit.id;
        }

        let dispatchStatus = 'DISPATCHED';
        let arrivedAt: Date | null = existingDispatch?.arrived_at || data.responTibaTkpAt || null;
        let completedAt: Date | null = existingDispatch?.completed_at || data.selesaiAt || null;
        let departedAt: Date | null = existingDispatch?.departed_at || null;

        const isLatestDeparted = (data as any).timelines?.length > 0 &&
          (data as any).timelines[(data as any).timelines.length - 1]?.actionKey === 'OFFICER_DEPARTED';

        if (data.status === 'SELESAI') {
          dispatchStatus = 'COMPLETED';
          if (!completedAt) completedAt = data.selesaiAt || new Date();
          if (!departedAt) departedAt = existingDispatch?.dispatched_at || data.disposisiAt || new Date();
          if (!arrivedAt) arrivedAt = existingDispatch?.dispatched_at || departedAt;
        } else if (data.status === 'MENUNGGU_PENGESAHAN') {
          dispatchStatus = 'REPORT_SUBMITTED';
          if (!departedAt) departedAt = existingDispatch?.dispatched_at || data.disposisiAt || new Date();
          if (!arrivedAt) arrivedAt = existingDispatch?.dispatched_at || departedAt;
        } else if (data.responTibaTkpAt || (data as any).tahap >= 4) {
          dispatchStatus = 'ARRIVED';
          if (!arrivedAt) arrivedAt = data.responTibaTkpAt || new Date();
          if (!departedAt) departedAt = existingDispatch?.dispatched_at || data.disposisiAt || new Date();
        } else if (
          departedAt ||
          (data as any).waktuMeluncur ||
          isLatestDeparted
        ) {
          dispatchStatus = 'DEPARTED';
          if (!departedAt) {
            departedAt = (data as any).waktuMeluncur ? new Date((data as any).waktuMeluncur) : new Date();
          }
        } else {
          dispatchStatus = existingDispatch?.dispatch_status || 'DISPATCHED';
        }

        const dispatchMaster = await (tx as any).masterDispatchStatus.findUnique({
          where: { key: dispatchStatus },
        });
        const dispatchStatusId = dispatchMaster?.id || null;

        if (existingDispatch) {
          await tx.complaintDispatch.update({
            where: { id: existingDispatch.id },
            data: {
              officer_id: data.assignedOfficerId,
              dispatch_status: dispatchStatus,
              dispatch_status_id: dispatchStatusId,
              ...(departedAt ? { departed_at: departedAt } : {}),
              ...(arrivedAt ? { arrived_at: arrivedAt } : {}),
              ...(completedAt ? { completed_at: completedAt } : {}),
            } as any,
          });

          if (data.assignedOfficerId) {
            await tx.complaintDispatch.updateMany({
              where: {
                complaint_id: complaintId,
                officer_id: data.assignedOfficerId,
                id: { not: existingDispatch.id },
              },
              data: {
                dispatch_status: dispatchStatus,
                dispatch_status_id: dispatchStatusId,
                ...(departedAt ? { departed_at: departedAt } : {}),
                ...(arrivedAt ? { arrived_at: arrivedAt } : {}),
                ...(completedAt ? { completed_at: completedAt } : {}),
              } as any,
            });
          }
        } else if (unitId) {
          await tx.complaintDispatch.create({
            data: {
              complaint_id: complaintId,
              unit_id: unitId,
              officer_id: data.assignedOfficerId,
              is_primary_unit: true,
              personnel_quota: 1,
              tactical_orders: data.ringkasanKeterangan || null,
              dispatch_status: dispatchStatus,
              dispatch_status_id: dispatchStatusId,
              dispatched_at: data.disposisiAt || new Date(),
              ...(departedAt ? { departed_at: departedAt } : {}),
              ...(arrivedAt ? { arrived_at: arrivedAt } : {}),
              ...(completedAt ? { completed_at: completedAt } : {}),
            } as any,
          });
        }
      }

      // 3. Sinkronisasi Audit Log jika terdapat milestone baru pada timeline
      if (data.timelines && data.timelines.length > 0) {
        const latestTimeline = data.timelines[data.timelines.length - 1];
        if (latestTimeline && (latestTimeline.actionKey || latestTimeline.tahapTitle)) {
          const isAnomaly = Boolean(latestTimeline.isDiscrepancy);
          let auditAction = latestTimeline.actionKey;
          if (!auditAction) {
            if (isAnomaly) {
              auditAction = 'DOKUMENTASI_TKP_FLAGGED';
            } else {
              const title = (latestTimeline.tahapTitle || '').toLowerCase();
              if (title.includes('meluncur')) auditAction = 'OFFICER_DEPARTED';
              else if (title.includes('tiba') || title.includes('tkp')) auditAction = 'OFFICER_ARRIVED';
              else if (title.includes('tuntas') && title.includes('pawas')) auditAction = 'COMPLAINT_COMPLETED';
              else if (title.includes('tuntas') || title.includes('tindakan')) auditAction = 'REPORT_SUBMITTED';
              else if (title.includes('disposisi')) auditAction = 'DISPATCH_ISSUED';
              else if (title.includes('tolak')) auditAction = 'COMPLAINT_REJECTED';
              else auditAction = 'AUDIT_MILESTONE';
            }
          }

          // Tentukan actor dan role secara presisi sesuai hierarki kedinasan POLRI:
          const isPawasAction =
            auditAction === 'COMPLAINT_COMPLETED' ||
            auditAction === 'COMPLAINT_REJECTED' ||
            auditAction === 'DISPATCH_ISSUED' ||
            auditAction === 'BROADCAST_DISPATCH';

          // Ambil identitas aktor langsung dari session login
          let sessionUser: any = null;
          try {
            const { getSession } = await import('@/lib/session');
            sessionUser = await getSession();
          } catch (_) {}

          let actorName = sessionUser?.fullName;
          let actorRole = sessionUser?.role;

          if (!actorName && data.assignedOfficerId) {
            const off = await tx.policeOfficer.findUnique({
              where: { id: data.assignedOfficerId },
              include: { user: true },
            });
            if (off) {
              actorName = `${off.rank_pangkat || ''} ${off.user?.full_name || 'Personel'}`.trim();
              actorRole = off.user?.role || 'PERSONIL';
            }
          }

          if (!actorName) {
            actorName = isPawasAction ? 'Perwira Pengawas (Pawas)' : 'Personel Lapangan';
            actorRole = isPawasAction ? 'PAWAS' : 'PERSONIL';
          }
          const finalLat = latestTimeline.gpsLat ?? data.tkpLat ?? null;
          const finalLng = latestTimeline.gpsLng ?? data.tkpLng ?? null;

          await tx.complaintAuditLog.create({
            data: {
              complaint_id: complaintId,
              actor_name: actorName,
              actor_role: actorRole,
              action: auditAction,
              notes: latestTimeline.catatan || latestTimeline.tahapTitle || null,
              action_lat: finalLat,
              action_lng: finalLng,
              created_at: latestTimeline.createdAt || new Date(),
            },
          });

          // 3.1 Catat ke officer_logbooks untuk Audit Integritas Dual-GPS (Propam)
          const devMeters = Number(latestTimeline?.deviationMeters || 0);
          if (data.assignedOfficerId && (latestTimeline.tahapTitle?.includes('Tindakan') || latestTimeline.tahapTitle?.includes('TKP') || isAnomaly)) {
            const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
            await tx.officerLogbook.create({
              data: {
                officer_id: data.assignedOfficerId,
                complaint_id: complaintId,
                action_type: 'TPTKP',
                claimed_address: (data.tkpAlamatTeks || 'TKP Laporan').slice(0, 250),
                claimed_lat: data.tkpLat,
                claimed_lng: data.tkpLng,
                actual_lat: latestTimeline.gpsLat || data.tkpLat,
                actual_lng: latestTimeline.gpsLng || data.tkpLng,
                deviation_meters: devMeters,
                is_deviation_flagged: isAnomaly,
                start_time: nowTime,
                end_time: nowTime,
                photo_url: latestTimeline.fotoBuktiUrl || null,
                photo_exif_lat: latestTimeline.gpsLat || null,
                photo_exif_lng: latestTimeline.gpsLng || null,
                activity_description: (latestTimeline.catatan || latestTimeline.tahapTitle || 'Tindakan Pengamanan TKP').slice(0, 1000),
                validation_status: isAnomaly ? 'FLAGGED_AUDIT' : 'VALID',
              },
            });
          }

          // 3.2 Simpan foto bukti watermark personel ke tabel terstruktur complaint_evidences (Atomik dalam Transaksi)
          if (latestTimeline.fotoBuktiUrl) {
            let savedPhotoUrl = latestTimeline.fotoBuktiUrl;
            if (savedPhotoUrl.startsWith('data:image/')) {
              try {
                const fs = await import('fs');
                const path = await import('path');
                const matches = savedPhotoUrl.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
                if (matches) {
                  const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
                  const buffer = Buffer.from(matches[2], 'base64');
                  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
                  if (!fs.existsSync(uploadDir)) {
                    fs.mkdirSync(uploadDir, { recursive: true });
                  }
                  const fileName = `personel_${complaintId}_${Date.now()}.${ext}`;
                  fs.writeFileSync(path.join(uploadDir, fileName), buffer);
                  savedPhotoUrl = `/uploads/${fileName}`;
                }
              } catch (imgErr) {
                console.warn('Gagal menyimpan file foto personil ke disk:', imgErr);
              }
            }

            await tx.complaintEvidence.create({
              data: {
                complaint_id: complaintId,
                incident_phase: (auditAction || 'TIBA_TKP').slice(0, 50),
                file_url: savedPhotoUrl.slice(0, 255),
                caption: (latestTimeline.catatan || latestTimeline.tahapTitle || 'Foto Dokumentasi Personil Lapangan').slice(0, 255),
                watermark_text: (latestTimeline.photoAddress || 'Watermark SIMAPRES 110').slice(0, 255),
                exif_lat: finalLat,
                exif_lng: finalLng,
              },
            });
          }
        }
      }

      // 4. Jika ada data rating/review dari warga, simpan di tabel relasi citizen_reviews
      if (data.citizenRating) {
        await tx.citizenReview.upsert({
          where: { complaint_id: complaintId },
          update: {
            star_rating: data.citizenRating,
            feedback_tags: data.citizenTags || null,
            review_text: data.citizenReview || null,
          },
          create: {
            complaint_id: complaintId,
            star_rating: data.citizenRating,
            feedback_tags: data.citizenTags || null,
            review_text: data.citizenReview || null,
            reporter_name: data.pelaporNama || '-',
          },
        });
      }

      return updatedComplaint;
    }, {
      maxWait: 15000,
      timeout: 30000,
    });

    const reloaded = await prisma.complaint.findUnique({
      where: { id: complaintId },
      include: COMPLAINT_INCLUDE,
    });

    return this.mapToEntity(reloaded || updated);
  }

  async getIkmStats(): Promise<IkmStats> {
    // Ambil data voting langsung dari tabel citizen_reviews yang ter-normalisasi
    const grouped = await prisma.citizenReview.groupBy({
      by: ['star_rating'],
      _count: { _all: true },
    });

    const totalVoting = grouped.reduce((sum: number, g: any) => sum + g._count._all, 0);
    if (totalVoting === 0) {
      return {
        totalVoting: 0,
        averageRating: 0,
        percentageSatisfaction: 0,
        ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      };
    }

    const breakdown: { [stars: number]: number } = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let totalScore = 0;
    let validCount = 0;

    for (const g of grouped as any[]) {
      const score = Number(g.star_rating);
      const count = g._count._all as number;
      if (score >= 1 && score <= 5) {
        totalScore += score * count;
        validCount += count;
        if (breakdown[score] !== undefined) {
          breakdown[score] += count;
        }
      }
    }

    const averageRating = validCount > 0 ? Math.round((totalScore / validCount) * 10) / 10 : 0;
    const percentageSatisfaction = validCount > 0 ? Math.round((averageRating / 5) * 1000) / 10 : 0;

    return {
      totalVoting: validCount,
      averageRating,
      percentageSatisfaction,
      ratingBreakdown: breakdown,
    };
  }
}
