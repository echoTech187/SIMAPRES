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
  subcategory_rel: { include: { unit_rel: true, category_rel: true } },
  source_rel: true,
  resolution_location_rel: true,
  resolution_document_rel: true,
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

      // Temukan bukti visual per fase penanganan
      const evidenceList = record.evidences || [];
      const evidenceAwal = evidenceList.find(
        (e: any) => e.incident_phase === 'LAPORAN_AWAL' || (e.caption && e.caption.toLowerCase().includes('laporan'))
      );
      const evidenceMenuju = evidenceList.find(
        (e: any) => e.incident_phase === 'MENUJU_TKP' || (e.caption && (e.caption.includes('Meluncur') || e.caption.includes('Persiapan')))
      );
      const evidenceTiba = evidenceList.find(
        (e: any) => e.incident_phase === 'TIBA_TKP' || e.incident_phase === 'PENANGANAN' || (e.caption && (e.caption.includes('Tiba') || e.caption.includes('Tindakan')))
      );
      const evidenceSelesai = evidenceList.find(
        (e: any) =>
          e.incident_phase === 'SELESAI_KONDUSIF' ||
          e.incident_phase === 'SELESAI' ||
          (e.caption && (e.caption.includes('Selesai') || e.caption.includes('BAP') || e.caption.includes('Kondusif')))
      );

      // Ekstrak waktu riil dan koordinat GPS dari audit logs kejadian
      const logMeluncur = (record.complaint_logs || []).find((l: any) =>
        l.action?.includes('Meluncur') || l.action?.includes('Persiapan') || l.action?.includes('MENUJU_TKP')
      );
      const logTiba = (record.complaint_logs || []).find((l: any) =>
        l.action?.includes('Tiba') || l.action?.includes('Tindakan') || l.action?.includes('TIBA_TKP')
      );
      const logTindakan = (record.complaint_logs || [])
        .slice()
        .reverse()
        .find((l: any) => (l.action?.includes('Tindakan') || l.action?.includes('TKP')) && l.notes);
      const catatanTindakan = logTindakan?.notes?.replace(/^Catatan:\s*/i, '') || logTindakan?.notes || null;
      const logBapOrSelesai = (record.complaint_logs || [])
        .slice()
        .reverse()
        .find((l: any) =>
          l.action?.includes('BAP') ||
          l.action?.includes('Selesai') ||
          l.action?.includes('SELESAI')
        );
      const catatanSelesai = logBapOrSelesai?.notes?.replace(/^Catatan:\s*/i, '') || logBapOrSelesai?.notes || null;

      const waktuMeluncur = logMeluncur?.created_at
        ? new Date(logMeluncur.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }) + ' WIB'
        : evidenceMenuju?.uploaded_at
        ? new Date(evidenceMenuju.uploaded_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }) + ' WIB'
        : primaryDispatch?.departed_at
        ? new Date(primaryDispatch.departed_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }) + ' WIB'
        : null;

      const koordinatGps = logMeluncur?.action_lat && logMeluncur?.action_lng
        ? `${Number(logMeluncur.action_lat).toFixed(6)}, ${Number(logMeluncur.action_lng).toFixed(6)}`
        : evidenceMenuju?.exif_lat && evidenceMenuju?.exif_lng
        ? `${Number(evidenceMenuju.exif_lat).toFixed(6)}, ${Number(evidenceMenuju.exif_lng).toFixed(6)}`
        : null;

      const waktuTiba = logTiba?.created_at
        ? new Date(logTiba.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }) + ' WIB'
        : primaryDispatch?.arrived_at
        ? new Date(primaryDispatch.arrived_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }) + ' WIB'
        : null;

      const waktuSelesaiDate = logBapOrSelesai?.created_at || primaryDispatch?.completed_at || null;
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
        fotoBuktiUrl: evidenceAwal?.file_url || null,
        fotoPersiapan: evidenceMenuju?.file_url || null,
        fotoTiba: evidenceTiba?.file_url || null,
        fotoTindakan: evidenceTiba?.file_url || null,
        catatanTindakan,
        catatanSelesai,
        fotoSelesai: evidenceSelesai?.file_url || null,
        waktuMeluncur,
        koordinatGps,
        waktuTiba,
        waktuSelesai,
        waktuSelesaiDate,
        timelines: (record.complaint_logs || []).map((t: any, idx: number) => {
          let stepPhoto: string | null = null;
          if (t.action?.includes('Meluncur') || t.action?.includes('Persiapan')) {
            stepPhoto = evidenceMenuju?.file_url || null;
          } else if (t.action?.includes('Tiba') || t.action?.includes('Tindakan')) {
            stepPhoto = evidenceTiba?.file_url || null;
          } else if (t.action?.includes('Selesai') || t.action?.includes('BAP')) {
            stepPhoto = evidenceSelesai?.file_url || null;
          } else if (t.action?.includes('Laporan')) {
            stepPhoto = evidenceAwal?.file_url || null;
          }
          return {
            tahapKe: idx + 1,
            tahapTitle: t.action,
            catatan: t.notes,
            fotoBuktiUrl: stepPhoto,
            gpsLat: t.action_lat ? Number(t.action_lat) : null,
            gpsLng: t.action_lng ? Number(t.action_lng) : null,
            createdAt: t.created_at,
          };
        }),
        dispatches: record.dispatches || [],
        complaintLogs: record.complaint_logs || [],
        evidences: record.evidences || [],
        citizenReviewRel: citizenReview || null,
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

  private static officerResolutionCache = new Map<string, { resolvedOfficerId: bigint; resolvedUnitId: number | null; expiresAt: number }>();

  async findAssignedToOfficer(officerId: bigint, activeOnly = false): Promise<ComplaintEntity[]> {
    const officerIdStr = String(officerId);
    let resolvedOfficerId = officerId;
    let resolvedUnitId: number | null = null;

    const cached = PrismaComplaintRepository.officerResolutionCache.get(officerIdStr);
    if (cached && Date.now() < cached.expiresAt) {
      resolvedOfficerId = cached.resolvedOfficerId;
      resolvedUnitId = cached.resolvedUnitId;
    } else {
      const [officer, regUnit] = await Promise.all([
        prisma.policeOfficer.findFirst({
          where: {
            OR: [
              { id: officerId },
              { user_id: officerId },
              { nrp: officerIdStr },
            ],
          },
        }),
        prisma.registeredUnit.findFirst({
          where: { nrp: officerIdStr },
        }),
      ]);

      if (officer) {
        resolvedOfficerId = officer.id;
        resolvedUnitId = officer.unit_id || null;
      }

      if (!resolvedUnitId && regUnit?.unitId) {
        const matchUnit = await prisma.masterOperationalUnit.findFirst({
          where: {
            OR: [
              { key: regUnit.unitId },
              { key: regUnit.unitId.toLowerCase() },
              { short_name: regUnit.satuanNama },
              { unit_name: regUnit.satuanNama },
            ],
          },
        });
        if (matchUnit) {
          resolvedUnitId = matchUnit.id;
          if (officer && !officer.unit_id) {
            try {
              await prisma.policeOfficer.update({
                where: { id: officer.id },
                data: { unit_id: matchUnit.id },
              });
            } catch (_) {}
          }
        }
      }

      PrismaComplaintRepository.officerResolutionCache.set(officerIdStr, {
        resolvedOfficerId,
        resolvedUnitId,
        expiresAt: Date.now() + 5 * 60 * 1000, // 5 menit TTL
      });
    }

    const dispatchConditions: any[] = [
      { officer_id: resolvedOfficerId },
    ];
    if (resolvedUnitId) {
      dispatchConditions.push({ unit_id: resolvedUnitId });
    }

    const whereClause: any = {
      dispatches: {
        some: {
          OR: dispatchConditions,
        },
      },
    };
    if (activeOnly) {
      whereClause.status = {
        in: ['DISPOSISI', 'MENUJU_TKP', 'TIBA_DI_TKP', 'PENANGANAN_TKP', 'DIPROSES', 'SEDANG_DITANGANI', 'MENUNGGU_PENGESAHAN'],
      };
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
      where: {
        status: { in: ['MENUNGGU', 'BELUM_DITANGANI'] },
      },
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

    // Resolve dynamic urgency_id safely
    let urgencyId: number | null = null;
    if (data.urgensi) {
      const urg = (data.urgensi || '').toUpperCase();
      try {
        const targetUrgencyKey = (urg.includes('DARURAT') || urg.includes('TINGGI')) ? 'DARURAT' : urg.includes('NORMAL') ? 'NORMAL' : 'SEDANG';
        const mUrg = await prisma.masterUrgencyLevel.findFirst({
          where: { OR: [{ key: targetUrgencyKey }, { key: urg }] },
          select: { id: true },
        });
        if (mUrg) urgencyId = mUrg.id;
      } catch (_) {}
    }

    // Resolve dynamic status_id safely
    let statusId: number | null = null;
    if (data.status) {
      const st = (data.status || '').toUpperCase();
      try {
        const targetStatusKey =
          st === 'SELESAI' ? 'SELESAI' :
          (st === 'DITOLAK' || st === 'DIBATALKAN') ? 'DITOLAK' :
          st === 'MENUNGGU_PENGESAHAN' ? 'MENUNGGU_PENGESAHAN' :
          (st === 'TIBA_DI_TKP' || st === 'PENANGANAN_TKP') ? 'TIBA_DI_TKP' :
          st === 'MENUJU_TKP' ? 'MENUJU_TKP' :
          (st === 'DISPOSISI' || st === 'DIPROSES' || st === 'SEDANG_DITANGANI') ? 'DISPOSISI' :
          st;
        const mStat = await prisma.masterComplaintStatus.findFirst({
          where: { OR: [{ key: targetStatusKey }, { key: st }] },
          select: { id: true },
        });
        if (mStat) statusId = mStat.id;
      } catch (_) {}
    }

    // Map category_id and kategori_key safely from Database
    let categoryId: number | null = null;
    let kategoriKey: string | null = data.kategoriKey || null;
    try {
      if (kategoriKey) {
        const mCat = await prisma.masterIncidentCategory.findFirst({
          where: {
            OR: [
              { key: kategoriKey.toUpperCase() },
              { label: { contains: kategoriKey } },
            ],
          },
          select: { id: true, key: true },
        });
        if (mCat) {
          categoryId = mCat.id;
          kategoriKey = mCat.key;
        }
      } else if (data.jenisKejadian) {
        const mCat = await prisma.masterIncidentCategory.findFirst({
          where: {
            OR: [
              { key: data.jenisKejadian.toUpperCase() },
              { label: { contains: data.jenisKejadian } },
            ],
          },
          select: { id: true, key: true },
        });
        if (mCat) {
          categoryId = mCat.id;
          kategoriKey = mCat.key;
        }
      }
    } catch (_) {}

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
    let subcategoryId: number | null = (data as any).subcategoryId || null;
    if (subcategoryId) {
      try {
        const foundSub = await (prisma as any).masterIncidentSubcategory.findUnique({
          where: { id: Number(subcategoryId) },
          select: { id: true, category_id: true, category_key: true },
        });
        if (foundSub) {
          if (!categoryId) categoryId = foundSub.category_id;
          if (!kategoriKey) kategoriKey = foundSub.category_key;
        }
      } catch (_) {}
    } else if (data.jenisKejadian || data.ringkasanKeterangan) {
      try {
        const foundSub = await (prisma as any).masterIncidentSubcategory.findFirst({
          where: {
            OR: [
              { nama_kasus: { contains: cleanJenisKejadian } },
              { nama_kasus: { contains: data.ringkasanKeterangan.slice(0, 50) } },
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
      include: COMPLAINT_INCLUDE,
    });

    // Otomatis catat Audit Log Pertama (LAPORAN_MASUK) saat pengaduan pertama kali dibuat
    await prisma.complaintAuditLog.create({
      data: {
        complaint_id: created.id,
        actor_name: data.operator?.namaLengkap || data.pelaporNama || 'Operator',
        actor_role: data.operator ? 'OPERATOR' : 'SISTEM',
        action: 'LAPORAN_MASUK',
        notes: data.ringkasanKeterangan || null,
        action_lat: data.tkpLat,
        action_lng: data.tkpLng,
        created_at: created.created_at,
      },
    });

    // Jika pelapor menyertakan foto bukti awal (misal via Portal Warga), simpan ke complaint_evidences (LAPORAN_AWAL)
    if (data.fotoBuktiUrl) {
      try {
        let savedUrl = data.fotoBuktiUrl;
        if (savedUrl.startsWith('data:image/')) {
          const fs = await import('fs');
          const path = await import('path');
          const matches = savedUrl.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
          if (matches) {
            const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
            const buffer = Buffer.from(matches[2], 'base64');
            const uploadDir = path.join(process.cwd(), 'public', 'uploads');
            if (!fs.existsSync(uploadDir)) {
              fs.mkdirSync(uploadDir, { recursive: true });
            }
            const fileName = `pelapor_${created.id}_${Date.now()}.${ext}`;
            fs.writeFileSync(path.join(uploadDir, fileName), buffer);
            savedUrl = `/uploads/${fileName}`;
          }
        }
        await prisma.complaintEvidence.create({
          data: {
            complaint_id: created.id,
            incident_phase: 'LAPORAN_AWAL',
            file_url: savedUrl,
            caption: 'Foto Bukti Laporan Awal Warga',
            watermark_text: 'Foto Bukti Pelapor (Portal Warga 110)',
            exif_lat: data.tkpLat,
            exif_lng: data.tkpLng,
          },
        });
      } catch (evErr) {
        console.warn('Sync initial evidence error:', evErr);
      }
    }

    // Fetch ulang agar include complaint_logs & evidences terisi lengkap
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
      try {
        const targetStatusKey =
          st === 'SELESAI' ? 'SELESAI' :
          (st === 'DITOLAK' || st === 'DIBATALKAN') ? 'DITOLAK' :
          st === 'MENUNGGU_PENGESAHAN' ? 'MENUNGGU_PENGESAHAN' :
          (st === 'TIBA_DI_TKP' || st === 'PENANGANAN_TKP') ? 'TIBA_DI_TKP' :
          st === 'MENUJU_TKP' ? 'MENUJU_TKP' :
          (st === 'DISPOSISI' || st === 'DIPROSES' || st === 'SEDANG_DITANGANI') ? 'DISPOSISI' :
          st;
        const mStat = await prisma.masterComplaintStatus.findFirst({
          where: { OR: [{ key: targetStatusKey }, { key: st }] },
          select: { id: true },
        });
        if (mStat) statusId = mStat.id;
      } catch (_) {}
    }

    const updated = await prisma.complaint.update({
      where: { id: data.id },
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
      include: COMPLAINT_INCLUDE,
    });

    // 1. Sinkronisasi tabel relasi complaint_dispatches jika ada petugas yang ditugaskan
    if (data.assignedOfficerId) {
      try {
        const existingDispatch = await prisma.complaintDispatch.findFirst({
          where: { complaint_id: data.id, is_primary_unit: true },
        });

        let unitId: number | null = null;
        const officer = await prisma.policeOfficer.findUnique({
          where: { id: data.assignedOfficerId },
          select: { unit_id: true },
        });
        if (officer?.unit_id) {
          unitId = officer.unit_id;
        } else {
          const defaultUnit = await prisma.masterOperationalUnit.findFirst({ select: { id: true } });
          if (defaultUnit) unitId = defaultUnit.id;
        }

        let dispatchStatus = 'DISPATCHED';
        let arrivedAt: Date | null = data.responTibaTkpAt || null;
        let completedAt: Date | null = data.selesaiAt || null;
        let departedAt: Date | null = null;

        if (data.status === 'SELESAI') {
          dispatchStatus = 'COMPLETED';
          completedAt = data.selesaiAt || new Date();
        } else if (data.status === 'MENUNGGU_PENGESAHAN') {
          dispatchStatus = 'REPORT_SUBMITTED';
        } else if (data.responTibaTkpAt || data.status === 'TIBA_DI_TKP' || data.status === 'PENANGANAN_TKP') {
          dispatchStatus = 'ARRIVED';
          arrivedAt = data.responTibaTkpAt || new Date();
        } else if (data.status === 'MENUJU_TKP' || (data.timelines && data.timelines.some((t: any) => t.tahapTitle?.includes('Meluncur')))) {
          dispatchStatus = 'DEPARTED';
          departedAt = new Date();
        } else if (data.status === 'SEDANG_DITANGANI' || existingDispatch?.dispatch_status === 'ACCEPTED') {
          dispatchStatus = 'ACCEPTED';
        } else {
          dispatchStatus = existingDispatch?.dispatch_status || 'DISPATCHED';
        }

        const dispatchMaster = await (prisma as any).masterDispatchStatus.findUnique({
          where: { key: dispatchStatus },
        });
        const dispatchStatusId = dispatchMaster?.id || null;

        if (existingDispatch) {
          await prisma.complaintDispatch.update({
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
        } else if (unitId) {
          await prisma.complaintDispatch.create({
            data: {
              complaint_id: data.id,
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
      } catch (e) {
        console.warn('Sync dispatch error:', e);
      }
    }

    // 2. Sinkronisasi Audit Log jika terdapat milestone baru pada timeline
    if (data.timelines && data.timelines.length > 0) {
      try {
        const latestTimeline = data.timelines[data.timelines.length - 1];
        if (latestTimeline && latestTimeline.tahapTitle) {
          const isAnomaly = Boolean(latestTimeline.isDiscrepancy);
          const auditAction = isAnomaly
            ? 'DOKUMENTASI_TKP_FLAGGED'
            : latestTimeline.tahapTitle;

          await prisma.complaintAuditLog.create({
            data: {
              complaint_id: data.id,
              actor_name: data.assignedOfficer?.namaLengkap || data.pawas?.namaLengkap || 'Petugas Lapangan',
              actor_role: data.pawas ? 'PAWAS' : 'PERSONIL',
              action: auditAction,
              notes: latestTimeline.catatan || null,
              action_lat: latestTimeline.gpsLat || null,
              action_lng: latestTimeline.gpsLng || null,
              created_at: latestTimeline.createdAt || new Date(),
            },
          });
        }
        // 2.1 Simpan foto & berkas bukti visual jika disertakan dalam timeline atau evidences
        const rawEvidencesToSave: any[] = [];
        if (latestTimeline?.evidences && Array.isArray(latestTimeline.evidences) && latestTimeline.evidences.length > 0) {
          rawEvidencesToSave.push(...latestTimeline.evidences);
        } else if (latestTimeline?.fotoBuktiUrl) {
          rawEvidencesToSave.push({
            fileUrl: latestTimeline.fotoBuktiUrl,
            caption: latestTimeline.tahapTitle,
            lat: latestTimeline.gpsLat,
            lng: latestTimeline.gpsLng,
            isDiscrepancy: latestTimeline.isDiscrepancy,
            deviationMeters: latestTimeline.deviationMeters,
            photoAddress: latestTimeline.photoAddress,
          });
        }

        const incidentPhase =
          data.status === 'TIBA_DI_TKP' ? 'TIBA_TKP' :
          data.status === 'MENUNGGU_PENGESAHAN' ? 'PENANGANAN' :
          data.status === 'SELESAI' ? 'SELESAI_KONDUSIF' :
          (data.status || 'TIBA_TKP');

        const isAnomaly = Boolean(latestTimeline?.isDiscrepancy);
        const devMeters = Number(latestTimeline?.deviationMeters || 0);
        const distStr = devMeters >= 1000 ? `${(devMeters / 1000).toFixed(1)} km` : `${Math.round(devMeters)} meter`;

        for (let i = 0; i < rawEvidencesToSave.length; i++) {
          const ev = rawEvidencesToSave[i];
          const rawUrl = ev.fileUrl || ev.url;
          if (!rawUrl) continue;

          try {
            let savedUrl = rawUrl;
            if (savedUrl.startsWith('data:image/')) {
              try {
                const fs = await import('fs');
                const path = await import('path');
                const matches = savedUrl.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
                if (matches) {
                  const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
                  const buffer = Buffer.from(matches[2], 'base64');
                  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
                  if (!fs.existsSync(uploadDir)) {
                    fs.mkdirSync(uploadDir, { recursive: true });
                  }
                  const fileName = `evidence_${data.id}_${Date.now()}_${i}.${ext}`;
                  fs.writeFileSync(path.join(uploadDir, fileName), buffer);
                  savedUrl = `/uploads/${fileName}`;
                }
              } catch (fsErr) {
                console.warn('Failed to save evidence image to disk:', fsErr);
                savedUrl = savedUrl.substring(0, 250);
              }
            } else if (savedUrl.length > 255) {
              savedUrl = savedUrl.substring(0, 250);
            }

            const existing = await prisma.complaintEvidence.findFirst({
              where: { complaint_id: data.id, file_url: savedUrl },
            });

            if (!existing) {
              const itemCaption = ev.caption || ev.fileName || (isAnomaly
                ? `Dokumentasi TKP [ANOMALI JARAK ${distStr}]`
                : (latestTimeline?.tahapTitle || 'Dokumentasi Visual TKP Berwatermark'));

              const watermarkInfo = isAnomaly
                ? `Deviasi: ${distStr} | Status: FLAGGED_DILUAR_TKP | ${latestTimeline?.photoAddress || ''}`
                : (ev.watermarkText || latestTimeline?.catatan || '');

              await prisma.complaintEvidence.create({
                data: {
                  complaint_id: data.id,
                  incident_phase: incidentPhase,
                  file_url: savedUrl,
                  caption: itemCaption.slice(0, 250),
                  watermark_text: watermarkInfo.slice(0, 250),
                  exif_lat: ev.lat ?? latestTimeline?.gpsLat ?? null,
                  exif_lng: ev.lng ?? latestTimeline?.gpsLng ?? null,
                },
              });
            }
          } catch (evErr) {
            console.warn('Failed saving evidence item:', evErr);
          }
        }

            // 2.2 Catat ke officer_logbooks untuk Audit Integritas Dual-GPS (Propam)
            if (data.assignedOfficerId && (latestTimeline.tahapTitle?.includes('Tindakan') || latestTimeline.tahapTitle?.includes('TKP') || isAnomaly)) {
              try {
                const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                await prisma.officerLogbook.create({
                  data: {
                    officer_id: data.assignedOfficerId,
                    complaint_id: data.id,
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
                    photo_url: rawEvidencesToSave[0]?.fileUrl || latestTimeline.fotoBuktiUrl || null,
                    photo_exif_lat: latestTimeline.gpsLat || null,
                    photo_exif_lng: latestTimeline.gpsLng || null,
                    activity_description: (latestTimeline.catatan || latestTimeline.tahapTitle || 'Tindakan Pengamanan TKP').slice(0, 1000),
                    validation_status: isAnomaly ? 'FLAGGED_AUDIT' : 'VALID',
                  },
                });
              } catch (logErr) {
                console.warn('Sync officer logbook error:', logErr);
              }
            }
      } catch (e) {
        console.warn('Sync audit log error:', e);
      }
    }

    // 3. Jika ada data rating/review dari warga, simpan di tabel relasi citizen_reviews
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
          reporter_name: data.pelaporNama || '-',
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
        averageRating: 0,
        percentageSatisfaction: 0,
        ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      };
    }

    const breakdown: { [stars: number]: number } = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let totalScore = 0;
    let validCount = 0;

    for (const item of reviews) {
      const score = item.star_rating;
      if (score && score >= 1 && score <= 5) {
        totalScore += score;
        validCount++;
        if (breakdown[score] !== undefined) {
          breakdown[score]++;
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
