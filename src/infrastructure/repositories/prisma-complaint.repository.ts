import { IComplaintRepository, IkmStats } from '@/domain/repositories/complaint.repository.interface';
import { ComplaintEntity, ComplaintStatus, UrgensiLevel } from '@/domain/entities/complaint.entity';
// SIMAPRES 110 - Prisma Complaint Repository Implementation (Normalized Schema)
import { prisma } from '../db/prisma.client';
import { Prisma } from '@prisma/client';
import { saveBase64Image } from '@/lib/file-storage';

const COMPLAINT_INCLUDE = {
  complaint_logs: {
    select: {
      id: true,
      actor_name: true,
      actor_role: true,
      action: true,
      notes: true,
      action_lat: true,
      action_lng: true,
      created_at: true,
    },
    orderBy: { created_at: 'asc' as const },
  },
  dispatches: {
    select: {
      id: true,
      complaint_id: true,
      unit_id: true,
      officer_id: true,
      is_primary_unit: true,
      dispatch_status: true,
      dispatched_at: true,
      accepted_at: true,
      departed_at: true,
      arrived_at: true,
      completed_at: true,
      estimated_distance: true,
      estimated_eta: true,
      tactical_orders: true,
      crew_partner_name: true,
      unit: {
        select: { id: true, unit_name: true, short_name: true },
      },
      officer: {
        select: {
          id: true,
          nrp: true,
          rank_pangkat: true,
          jabatan: true,
          avatar_url: true,
          assigned_patrol_vehicle: true,
          current_gps_lat: true,
          current_gps_lng: true,
          user: {
            select: { full_name: true, phone_number: true },
          },
        },
      },
    },
  },
  evidences: {
    select: {
      id: true,
      incident_phase: true,
      file_url: true,
      caption: true,
      uploaded_at: true,
    },
    orderBy: { uploaded_at: 'asc' as const },
  },
  citizen_review_rel: {
    select: {
      id: true,
      star_rating: true,
      review_text: true,
      feedback_tags: true,
    },
  },
  operator: {
    select: {
      id: true,
      full_name: true,
      identifier: true,
    },
  },
} as const;

// Batas riwayat tugas personel yang dimuat (tugas aktif selalu dimuat penuh)
const OFFICER_HISTORY_LIMIT = 15;

export class PrismaComplaintRepository implements IComplaintRepository {
  private static masterCache: {
    categories: Map<number, any>;
    subcategories: Map<number, any>;
    sources: Map<number, any>;
    stations: Map<number, any>;
    expiresAt: number;
  } | null = null;

  public static async getMasterDictionaries() {
    const now = Date.now();
    if (PrismaComplaintRepository.masterCache && now < PrismaComplaintRepository.masterCache.expiresAt) {
      return PrismaComplaintRepository.masterCache;
    }
    try {
      const [categories, subcategories, sources, stations] = await Promise.all([
        prisma.masterIncidentCategory.findMany(),
        prisma.masterIncidentSubcategory.findMany({ include: { unit_rel: true } }),
        prisma.masterReportSource.findMany(),
        prisma.policeStation.findMany({ select: { id: true, station_name: true, station_code: true, station_level: true } }),
      ]);

      const dict = {
        categories: new Map(categories.map((c) => [c.id, c])),
        subcategories: new Map(subcategories.map((s) => [s.id, s])),
        sources: new Map(sources.map((src) => [src.id, src])),
        stations: new Map(stations.map((st) => [st.id, st])),
        expiresAt: now + 15 * 60 * 1000,
      };
      PrismaComplaintRepository.masterCache = dict;
      return dict;
    } catch (_) {
      return {
        categories: new Map(),
        subcategories: new Map(),
        sources: new Map(),
        stations: new Map(),
        expiresAt: now + 5000,
      };
    }
  }

  private mapToEntity(record: any, dict?: any): ComplaintEntity {
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
      kategoriRel: record.category_rel || (dict && record.category_id ? dict.categories.get(record.category_id) : null),
      subcategoryId: record.subcategory_id,
      subcategory: record.subcategory_rel || (dict && record.subcategory_id ? dict.subcategories.get(record.subcategory_id) : null),
      platformId: record.source_id,
      platformKey: record.platform_key,
      platformRel: record.source_rel || (dict && record.source_id ? dict.sources.get(record.source_id) : null),
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
        station: record.station || (dict && record.station_id ? dict.stations.get(record.station_id) : null),
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

  private mapRawRowToEntity(r: any): ComplaintEntity {
    let cLogs: any[] = [];
    if (r.logs_json) {
      try {
        if (typeof r.logs_json === 'string') {
          cLogs = JSON.parse(r.logs_json);
        } else if (Buffer.isBuffer(r.logs_json)) {
          cLogs = JSON.parse(r.logs_json.toString('utf8'));
        } else if (Array.isArray(r.logs_json)) {
          cLogs = r.logs_json;
        }
      } catch (_) {
        cLogs = [];
      }
    }
    if (!Array.isArray(cLogs)) {
      cLogs = [];
    }
    const pawasLog = cLogs.slice().reverse().find((l: any) => l.actor_role === 'PAWAS');

    let responseTimeMinutes: number | null = null;
    const dispTime = r.dispatched_at || r.created_at;
    const arrTime = r.arrived_at || null;
    if (dispTime && arrTime) {
      const diffMs = new Date(arrTime).getTime() - new Date(dispTime).getTime();
      responseTimeMinutes = Math.max(1, Math.round(diffMs / (1000 * 60)));
    }

    const logTindakan = cLogs.slice().reverse().find((l: any) => l.notes && (l.action?.includes('Tindakan') || l.action?.includes('TKP')));
    const catatanTindakan = logTindakan?.notes?.replace(/^Catatan:\s*/i, '') || null;

    const logSelesai = cLogs.slice().reverse().find((l: any) => l.notes && (l.action?.includes('Selesai') || l.action?.includes('BAP')));
    const catatanSelesai = logSelesai?.notes?.replace(/^Catatan:\s*/i, '') || null;

    const waktuMeluncur = r.departed_at ? new Date(r.departed_at).toISOString() : null;
    const koordinatGps = r.tkp_lat && r.tkp_lng ? `${Number(r.tkp_lat).toFixed(6)}, ${Number(r.tkp_lng).toFixed(6)}` : null;
    const waktuTiba = r.arrived_at ? new Date(r.arrived_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }) + ' WIB' : null;
    const waktuSelesaiDate = r.completed_at || null;
    const waktuSelesai = waktuSelesaiDate ? new Date(waktuSelesaiDate).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }) + ' WIB' : null;

    return new ComplaintEntity({
      id: r.id,
      nomorTiket: r.nomor_tiket,
      pelaporNama: r.pelapor_nama,
      pelaporHp: r.pelapor_hp,
      jenisKejadian: r.jenis_kejadian,
      urgensi: r.urgensi as UrgensiLevel,
      kategoriId: r.category_id,
      kategoriKey: r.kategori_key,
      kategoriRel: r.category_id ? { id: r.category_id, key: r.kategori_key, label: r.category_label } : null,
      subcategoryId: r.subcategory_id,
      subcategory: r.subcategory_id ? { id: r.subcategory_id, nama_kasus: r.subcategory_name, default_urgensi: r.subcategory_default_urgensi } : null,
      platformId: r.source_id,
      platformKey: r.platform_key,
      platformRel: r.source_id ? { id: r.source_id, key: r.platform_key, label: r.source_label, icon: r.source_icon } : null,
      tkpAlamatTeks: r.tkp_alamat_teks,
      tkpLat: Number(r.tkp_lat),
      tkpLng: Number(r.tkp_lng),
      ringkasanKeterangan: r.ringkasan_keterangan,
      status: r.status as ComplaintStatus,
      tahap: r.tahap,
      alasanTolak: r.alasan_tolak,
      operatorId: r.operator_id,
      assignedOfficerId: r.officer_id || null,
      assignedOfficer: r.officer_id ? {
        id: r.officer_id,
        nrp: r.officer_nrp,
        rankPangkat: r.officer_rank,
        jabatan: r.officer_jabatan,
        assignedPatrolVehicle: r.officer_vehicle,
        currentGpsLat: r.officer_gps_lat ? Number(r.officer_gps_lat) : null,
        currentGpsLng: r.officer_gps_lng ? Number(r.officer_gps_lng) : null,
        namaLengkap: r.officer_full_name || '',
        phoneNumber: r.officer_phone || null,
        unitName: r.unit_name || r.officer_jabatan || null,
        avatarUrl: r.officer_avatar,
      } : null,
      pawasValidasiId: null,
      pawas: pawasLog ? { id: 0n, namaLengkap: pawasLog.actor_name, identifier: pawasLog.actor_name } : null,
      operator: null,
      disposisiAt: r.dispatched_at || null,
      responTibaTkpAt: r.arrived_at || null,
      selesaiAt: r.completed_at || null,
      responseTimeMinutes,
      citizenRating: r.citizen_rating || null,
      citizenReview: r.citizen_review || null,
      citizenTags: r.citizen_tags || null,
      fotoBuktiUrl: r.foto_bukti_url || null,
      catatanTindakan,
      catatanSelesai,
      waktuMeluncur,
      koordinatGps,
      waktuTiba,
      waktuSelesai,
      waktuSelesaiDate,
      timelines: cLogs.map((t: any, idx: number) => ({
        tahapKe: idx + 1,
        tahapTitle: t.action,
        catatan: t.notes,
        fotoBuktiUrl: r.foto_bukti_url,
        gpsLat: t.action_lat ? Number(t.action_lat) : null,
        gpsLng: t.action_lng ? Number(t.action_lng) : null,
        createdAt: t.created_at,
      })),
      dispatches: r.dispatch_id ? [{
        id: r.dispatch_id,
        complaint_id: r.id,
        officer_id: r.officer_id,
        dispatch_status: r.dispatch_status,
        dispatched_at: r.dispatched_at,
        arrived_at: r.arrived_at,
        completed_at: r.completed_at,
        departed_at: r.departed_at,
        is_primary_unit: true,
        unit: r.unit_name ? { unit_name: r.unit_name, short_name: r.unit_short_name } : null,
        officer: r.officer_id ? {
          id: r.officer_id,
          nrp: r.officer_nrp,
          rank_pangkat: r.officer_rank,
          user: { full_name: r.officer_full_name, phone_number: r.officer_phone },
        } : null,
      }] : [],
      complaintLogs: cLogs,
      evidences: r.foto_bukti_url ? [{ id: 1, incident_phase: 'LAPORAN_AWAL', file_url: r.foto_bukti_url }] : [],
      citizenReviewRel: r.citizen_rating ? { star_rating: r.citizen_rating, review_text: r.citizen_review } : null,
      stationId: r.station_id,
      station: r.station_id ? { id: r.station_id, station_name: r.station_name, station_code: r.station_code, station_level: r.station_level } : null,
      resolutionLocationId: r.resolution_location_id,
      resolutionLocationKey: r.resolution_location_key,
      resolutionLocationName: r.resolution_location_name,
      resolutionLocationRel: null,
      resolutionDocumentId: r.resolution_document_id,
      resolutionDocumentKey: r.resolution_document_key,
      resolutionDocumentName: r.resolution_document_name,
      resolutionDocumentRel: null,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      created_at: r.created_at,
      updated_at: r.updated_at,
    });
  }

  private async queryComplaintsFastSql(
    whereClauseSql: Prisma.Sql,
    orderBySql: Prisma.Sql,
    limitNum: number
  ): Promise<ComplaintEntity[]> {
    const query = Prisma.sql`
      SELECT 
        c.id, c.nomor_tiket, c.pelapor_nama, c.pelapor_hp, c.jenis_kejadian,
        COALESCE(mul.key, c.urgensi) as urgensi,
        c.category_id,
        COALESCE(cat.key, c.kategori_key) as kategori_key,
        c.subcategory_id,
        c.source_id,
        COALESCE(src.key, c.platform_key) as platform_key,
        c.station_id, c.operator_id, c.tkp_alamat_teks, c.tkp_lat, c.tkp_lng,
        c.ringkasan_keterangan,
        COALESCE(mcs.key, c.status) as status,
        c.tahap,
        COALESCE(mrr.label, c.alasan_tolak) as alasan_tolak,
        c.rejection_reason_id,
        c.resolution_location_id, c.resolution_location_key, c.resolution_location_name,
        c.resolution_document_id, c.resolution_document_key, c.resolution_document_name,
        c.created_at, c.updated_at,
        
        -- Primary Dispatch & Officer
        d.id as dispatch_id, d.officer_id, d.unit_id as dispatch_unit_id,
        COALESCE(mds.key, d.dispatch_status) as dispatch_status,
        d.dispatched_at, d.accepted_at, d.departed_at, d.arrived_at, d.completed_at,
        d.estimated_distance, d.estimated_eta, d.tactical_orders, d.crew_partner_name,
        d.estimated_distance_meters, d.estimated_eta_seconds,
        
        -- Unit
        u.unit_name, u.short_name as unit_short_name,
        
        -- Officer
        po.nrp as officer_nrp,
        COALESCE(mr.label, po.rank_pangkat) as officer_rank,
        po.jabatan as officer_jabatan,
        po.avatar_url as officer_avatar,
        COALESCE(pv.nomor_lambung, po.assigned_patrol_vehicle) as officer_vehicle,
        po.current_gps_lat as officer_gps_lat, po.current_gps_lng as officer_gps_lng,
        usr.full_name as officer_full_name, usr.phone_number as officer_phone,
        
        -- Station
        st.station_name, st.station_code, st.station_level,
        
        -- Category & Subcategory
        cat.label as category_label,
        sub.nama_kasus as subcategory_name, sub.default_urgensi as subcategory_default_urgensi,
        
        -- Source
        src.label as source_label, src.icon as source_icon,
        
        -- Citizen Review
        cr.star_rating as citizen_rating, cr.review_text as citizen_review, cr.feedback_tags as citizen_tags,
        
        -- Initial Evidence (foto awal)
        ev.file_url as foto_bukti_url,

        -- Audit Logs
        al.logs_json

      FROM complaints c
      LEFT JOIN master_complaint_statuses mcs ON mcs.id = c.status_id
      LEFT JOIN master_urgency_levels mul ON mul.id = c.urgency_id
      LEFT JOIN master_rejection_reasons mrr ON mrr.id = c.rejection_reason_id
      LEFT JOIN (
        SELECT * FROM (
          SELECT *, ROW_NUMBER() OVER (PARTITION BY complaint_id ORDER BY is_primary_unit DESC, id DESC) as rn
          FROM complaint_dispatches
        ) ranked_d WHERE ranked_d.rn = 1
      ) d ON d.complaint_id = c.id
      LEFT JOIN master_dispatch_statuses mds ON mds.id = d.dispatch_status_id
      LEFT JOIN master_operational_units u ON u.id = d.unit_id
      LEFT JOIN police_officers po ON po.id = d.officer_id
      LEFT JOIN master_ranks mr ON mr.id = po.rank_id
      LEFT JOIN patrol_vehicles pv ON pv.id = po.assigned_vehicle_id
      LEFT JOIN users usr ON usr.id = po.user_id
      LEFT JOIN police_stations st ON st.id = c.station_id
      LEFT JOIN master_incident_categories cat ON cat.id = c.category_id
      LEFT JOIN master_incident_subcategories sub ON sub.id = c.subcategory_id
      LEFT JOIN master_report_sources src ON src.id = c.source_id
      LEFT JOIN citizen_reviews cr ON cr.complaint_id = c.id
      LEFT JOIN complaint_evidences ev ON ev.complaint_id = c.id AND ev.incident_phase = 'LAPORAN_AWAL'
      LEFT JOIN (
        SELECT 
          complaint_id,
          JSON_ARRAYAGG(
            JSON_OBJECT(
              'id', id,
              'actor_name', actor_name,
              'actor_role', actor_role,
              'action', action,
              'notes', notes,
              'action_lat', action_lat,
              'action_lng', action_lng,
              'created_at', created_at
            )
          ) as logs_json
        FROM complaint_audit_logs
        GROUP BY complaint_id
      ) al ON al.complaint_id = c.id
      WHERE ${whereClauseSql}
      ORDER BY ${orderBySql}
      LIMIT ${limitNum};
    `;

    const rows: any[] = await prisma.$queryRaw(query);
    return rows.map((r) => this.mapRawRowToEntity(r));
  }

  async findById(id: bigint): Promise<ComplaintEntity | null> {
    const [record, dict] = await Promise.all([
      prisma.complaint.findUnique({
        where: { id },
        include: COMPLAINT_INCLUDE,
      }),
      PrismaComplaintRepository.getMasterDictionaries(),
    ]);
    return record ? this.mapToEntity(record, dict) : null;
  }

  async findByNomorTiket(nomorTiket: string): Promise<ComplaintEntity | null> {
    if (!nomorTiket) return null;
    const cleanTiket = nomorTiket.trim();
    const cleanWithHash = cleanTiket.startsWith('#') ? cleanTiket : `#${cleanTiket}`;
    const cleanWithoutHash = cleanTiket.startsWith('#') ? cleanTiket.slice(1) : cleanTiket;
    const strippedTicket = cleanTiket.replace(/^TICKET-/, '');
    const addedTicket = `TICKET-${cleanTiket}`;

    const [record, dict] = await Promise.all([
      prisma.complaint.findFirst({
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
      }),
      PrismaComplaintRepository.getMasterDictionaries(),
    ]);
    return record ? this.mapToEntity(record, dict) : null;
  }

  async findByPelaporHp(hp: string): Promise<ComplaintEntity[]> {
    const [records, dict] = await Promise.all([
      prisma.complaint.findMany({
        where: { pelapor_hp: hp },
        orderBy: { created_at: 'desc' },
        include: COMPLAINT_INCLUDE,
      }),
      PrismaComplaintRepository.getMasterDictionaries(),
    ]);
    return records.map((r: any) => this.mapToEntity(r, dict));
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
      let officer: any = null;
      try {
        const offRows: any[] = await prisma.$queryRaw`
          SELECT po.id, po.station_id, po.unit_id, po.duty_status, u.role
          FROM police_officers po
          LEFT JOIN users u ON u.id = po.user_id
          WHERE po.id = ${officerId} OR po.user_id = ${officerId} OR po.nrp = ${officerIdStr} OR po.nrp = ${paddedNrp}
          LIMIT 1;
        `;
        if (offRows && offRows[0]) {
          officer = offRows[0];
          resolvedOfficerId = BigInt(officer.id);
          resolvedStationId = officer.station_id || null;
          resolvedUnitId = officer.unit_id || null;
          isPersonilRole = officer.role ? officer.role === 'PERSONIL' : true;
          const isDutyActive = Boolean(officer.duty_status && officer.duty_status !== 'LEPAS_DINAS');
          isPiket = isDutyActive;
        }
      } catch (_) {
        // Fallback ke Prisma
      }

      if (!officer) {
        const fallbackOfficer = await prisma.policeOfficer.findFirst({
          where: {
            OR: [
              { id: officerId },
              { user_id: officerId },
              { nrp: officerIdStr },
              { nrp: paddedNrp },
            ],
          },
          include: {
            user: { select: { role: true } },
          },
        });

        if (fallbackOfficer) {
          resolvedOfficerId = fallbackOfficer.id;
          resolvedStationId = fallbackOfficer.station_id || null;
          resolvedUnitId = fallbackOfficer.unit_id || null;
          isPersonilRole = fallbackOfficer.user?.role ? fallbackOfficer.user.role === 'PERSONIL' : true;
          isPiket = Boolean(fallbackOfficer.duty_status && fallbackOfficer.duty_status !== 'LEPAS_DINAS');
        }
      }

      const cacheItem = {
        resolvedOfficerId,
        resolvedStationId,
        resolvedUnitId,
        isPersonilRole,
        isPiket,
        expiresAt: Date.now() + 60 * 1000,
      };
      PrismaComplaintRepository.officerResolutionCache.set(officerIdStr, cacheItem);
      if (paddedNrp !== officerIdStr) {
        PrismaComplaintRepository.officerResolutionCache.set(paddedNrp, cacheItem);
      }
    }

    try {
      const officerIdNum = Number(resolvedOfficerId);
      let whereSql: Prisma.Sql;
      if (isPersonilRole && resolvedStationId) {
        const stId = Number(resolvedStationId);
        if (activeOnly) {
          whereSql = Prisma.sql`(
            EXISTS (SELECT 1 FROM complaint_dispatches cd WHERE cd.complaint_id = c.id AND cd.officer_id = ${officerIdNum})
            OR (
              c.station_id = ${stId}
              AND c.status IN ('MENUNGGU', 'DIPROSES')
              AND (
                NOT EXISTS (SELECT 1 FROM complaint_dispatches cd WHERE cd.complaint_id = c.id AND cd.officer_id IS NOT NULL)
                OR EXISTS (SELECT 1 FROM complaint_dispatches cd WHERE cd.complaint_id = c.id AND cd.officer_id = ${officerIdNum})
              )
            )
          ) AND c.status NOT IN ('SELESAI', 'DITOLAK')`;
        } else {
          whereSql = Prisma.sql`
            EXISTS (SELECT 1 FROM complaint_dispatches cd WHERE cd.complaint_id = c.id AND cd.officer_id = ${officerIdNum})
            OR (
              c.station_id = ${stId}
              AND c.status IN ('MENUNGGU', 'DIPROSES')
              AND (
                NOT EXISTS (SELECT 1 FROM complaint_dispatches cd WHERE cd.complaint_id = c.id AND cd.officer_id IS NOT NULL)
                OR EXISTS (SELECT 1 FROM complaint_dispatches cd WHERE cd.complaint_id = c.id AND cd.officer_id = ${officerIdNum})
              )
            )`;
        }
      } else {
        if (activeOnly) {
          whereSql = Prisma.sql`EXISTS (SELECT 1 FROM complaint_dispatches cd WHERE cd.complaint_id = c.id AND cd.officer_id = ${officerIdNum}) AND c.status NOT IN ('SELESAI', 'DITOLAK')`;
        } else {
          whereSql = Prisma.sql`EXISTS (SELECT 1 FROM complaint_dispatches cd WHERE cd.complaint_id = c.id AND cd.officer_id = ${officerIdNum})`;
        }
      }

      return await this.queryComplaintsFastSql(
        whereSql,
        Prisma.sql`c.created_at DESC`,
        activeOnly ? 20 : OFFICER_HISTORY_LIMIT
      );
    } catch (_err) {
      // Fallback ke Prisma findMany jika raw query menemui kendala
      const assignedCondition: any = {
        dispatches: {
          some: {
            officer_id: resolvedOfficerId,
          },
        },
      };

      const orConditions: any[] = [assignedCondition];
      if (isPersonilRole && resolvedStationId) {
        orConditions.push({
          OR: [
            { station_id: resolvedStationId },
            { dispatches: { some: { station_id: resolvedStationId } } },
          ],
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
      const [records, dict] = await Promise.all([
        prisma.complaint.findMany({
          where: whereClause,
          orderBy: { created_at: 'desc' },
          take: activeOnly ? undefined : OFFICER_HISTORY_LIMIT,
          include: COMPLAINT_INCLUDE,
        }),
        PrismaComplaintRepository.getMasterDictionaries(),
      ]);
      return records.map((r: any) => this.mapToEntity(r, dict));
    }
  }

  async findAntreanPawas(stationId?: number): Promise<ComplaintEntity[]> {
    try {
      let whereSql: Prisma.Sql;
      if (stationId) {
        const isMakoAsal = Number(stationId) === 60001;
        if (isMakoAsal) {
          whereSql = Prisma.sql`(c.status = 'MENUNGGU' AND (c.station_id = ${Number(stationId)} OR c.station_id IS NULL)) OR c.status = 'DISPOSISI_LINTAS_WILAYAH'`;
        } else {
          whereSql = Prisma.sql`c.status IN ('MENUNGGU', 'DISPOSISI_LINTAS_WILAYAH') AND c.station_id = ${Number(stationId)}`;
        }
      } else {
        whereSql = Prisma.sql`c.status IN ('MENUNGGU', 'DISPOSISI_LINTAS_WILAYAH')`;
      }
      return await this.queryComplaintsFastSql(whereSql, Prisma.sql`c.created_at ASC`, 20);
    } catch (_err) {
      let whereClause: any;

      if (stationId) {
        const isMakoAsal = Number(stationId) === 60001;
        if (isMakoAsal) {
          whereClause = {
            OR: [
              { status: 'MENUNGGU', station_id: stationId },
              { status: 'MENUNGGU', station_id: null },
              { status: 'DISPOSISI_LINTAS_WILAYAH' },
            ],
          };
        } else {
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

      const [records, dict] = await Promise.all([
        prisma.complaint.findMany({
          where: whereClause,
          orderBy: { created_at: 'asc' },
          include: COMPLAINT_INCLUDE,
        }),
        PrismaComplaintRepository.getMasterDictionaries(),
      ]);
      return records.map((r: any) => this.mapToEntity(r, dict));
    }
  }

  async findAllRecent(limit = 15, stationId?: number): Promise<ComplaintEntity[]> {
    try {
      const whereSql = stationId ? Prisma.sql`c.station_id = ${stationId}` : Prisma.sql`1=1`;
      return await this.queryComplaintsFastSql(
        whereSql,
        Prisma.sql`c.created_at DESC`,
        limit
      );
    } catch (_err) {
      const [records, dict] = await Promise.all([
        prisma.complaint.findMany({
          where: stationId ? { station_id: stationId } : undefined,
          take: limit,
          orderBy: { created_at: 'desc' },
          include: COMPLAINT_INCLUDE,
        }),
        PrismaComplaintRepository.getMasterDictionaries(),
      ]);
      return records.map((r: any) => this.mapToEntity(r, dict));
    }
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
        const foundSub = await prisma.masterIncidentSubcategory.findUnique({
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
        const foundSub = await prisma.masterIncidentSubcategory.findFirst({
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

      // Simpan foto bukti lampiran kejadian langsung dari pelapor jika ada (Base64 aman di DB LONGTEXT)
      if (data.fotoBuktiUrl) {
        await tx.complaintEvidence.create({
          data: {
            complaint_id: newComplaint.id,
            incident_phase: 'LAPORAN_AWAL',
            file_url: data.fotoBuktiUrl,
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
      let actualOfficerId: bigint | null = null;
      let officerUnitId: number | null = null;

      if (data.assignedOfficerId) {
        const rawOfficerId = BigInt(data.assignedOfficerId);
        const po = await tx.policeOfficer.findFirst({
          where: {
            OR: [
              { id: rawOfficerId },
              { user_id: rawOfficerId },
            ],
          },
          select: { id: true, unit_id: true },
        });

        if (po) {
          actualOfficerId = po.id;
          if (po.unit_id) officerUnitId = po.unit_id;
        } else {
          const poExists = await tx.policeOfficer.findUnique({
            where: { id: rawOfficerId },
            select: { id: true, unit_id: true },
          });
          if (poExists) {
            actualOfficerId = poExists.id;
            if (poExists.unit_id) officerUnitId = poExists.unit_id;
          }
        }
      }

      if (actualOfficerId || data.assignedOfficerId) {
        let existingDispatch = await tx.complaintDispatch.findFirst({
          where: {
            complaint_id: complaintId,
            OR: [
              ...(actualOfficerId ? [{ officer_id: actualOfficerId }] : []),
              { is_primary_unit: true },
            ],
          },
          orderBy: [{ is_primary_unit: 'desc' }, { id: 'desc' }],
        });

        if (!existingDispatch) {
          existingDispatch = await tx.complaintDispatch.findFirst({
            where: { complaint_id: complaintId },
            orderBy: [{ is_primary_unit: 'desc' }, { id: 'desc' }],
          });
        }

        let unitId: number | null = officerUnitId || existingDispatch?.unit_id || null;
        if (!unitId) {
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
              ...(actualOfficerId ? { officer_id: actualOfficerId } : {}),
              dispatch_status: dispatchStatus,
              dispatch_status_id: dispatchStatusId,
              ...(departedAt ? { departed_at: departedAt } : {}),
              ...(arrivedAt ? { arrived_at: arrivedAt } : {}),
              ...(completedAt ? { completed_at: completedAt } : {}),
            } as any,
          });

          if (actualOfficerId) {
            await tx.complaintDispatch.updateMany({
              where: {
                complaint_id: complaintId,
                officer_id: actualOfficerId,
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
              ...(actualOfficerId ? { officer_id: actualOfficerId } : {}),
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

          if (!actorName && (actualOfficerId || data.assignedOfficerId)) {
            const rawId = data.assignedOfficerId ? BigInt(data.assignedOfficerId) : null;
            const off = await tx.policeOfficer.findFirst({
              where: {
                OR: [
                  ...(actualOfficerId ? [{ id: actualOfficerId }] : []),
                  ...(rawId ? [{ id: rawId }, { user_id: rawId }] : []),
                ],
              },
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

          // 3.1 Catat foto bukti personil (Base64 aman tersimpan permanen di DB LONGTEXT)
          const photoPayload = latestTimeline.fotoBuktiUrl || null;

          // 3.2 Catat ke officer_logbooks untuk Audit Integritas Dual-GPS (Propam)
          const devMeters = Number(latestTimeline?.deviationMeters || 0);
          if (actualOfficerId && (latestTimeline.tahapTitle?.includes('Tindakan') || latestTimeline.tahapTitle?.includes('TKP') || isAnomaly)) {
            const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
            await tx.officerLogbook.create({
              data: {
                officer_id: actualOfficerId,
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
                photo_url: photoPayload,
                photo_exif_lat: latestTimeline.gpsLat || null,
                photo_exif_lng: latestTimeline.gpsLng || null,
                activity_description: (latestTimeline.catatan || latestTimeline.tahapTitle || 'Tindakan Pengamanan TKP').slice(0, 1000),
                validation_status: isAnomaly ? 'FLAGGED_AUDIT' : 'VALID',
              },
            });
          }

          // 3.3 Simpan foto bukti ke tabel terstruktur complaint_evidences (Atomik dalam Transaksi)
          if (photoPayload) {
            await tx.complaintEvidence.create({
              data: {
                complaint_id: complaintId,
                incident_phase: (auditAction || 'TIBA_TKP').slice(0, 50),
                file_url: photoPayload,
                caption: (latestTimeline.catatan || latestTimeline.tahapTitle || 'Foto Dokumentasi Personil Lapangan').slice(0, 255),
                watermark_text: (latestTimeline.photoAddress || 'Watermark SIMAPRES 110').slice(0, 255),
                exif_lat: finalLat,
                exif_lng: finalLng,
              },
            });
          }

          // 3.4 Simpan lampiran berkas/bukti lainnya jika terdaftar di entitas complaint
          if (Array.isArray(data.evidences) && data.evidences.length > 0) {
            for (const ev of data.evidences) {
              const evAny = ev as any;
              const rawEvUrl = String(evAny.file_url || evAny.fileUrl || '');
              if (rawEvUrl && rawEvUrl !== photoPayload) {
                await tx.complaintEvidence.create({
                  data: {
                    complaint_id: complaintId,
                    incident_phase: String(evAny.incident_phase || auditAction || 'SELESAI').slice(0, 50),
                    file_url: rawEvUrl,
                    caption: String(evAny.caption || 'Foto Berkas Bukti Lapangan').slice(0, 255),
                    watermark_text: String(evAny.watermark_text || 'Watermark SIMAPRES 110').slice(0, 255),
                    exif_lat: evAny.exif_lat ?? finalLat ?? null,
                    exif_lng: evAny.exif_lng ?? finalLng ?? null,
                  },
                });
              }
            }
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

  async getIkmStats(stationId?: number): Promise<IkmStats> {
    // Ambil data voting langsung dari tabel citizen_reviews yang ter-normalisasi
    const whereClause = stationId ? { complaint: { station_id: stationId } } : undefined;
    const grouped = await prisma.citizenReview.groupBy({
      by: ['star_rating'],
      where: whereClause,
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

  async executeComplaintQuery(sqlOrStrings: any, ...params: any[]): Promise<any> {
    if (typeof sqlOrStrings === 'string') {
      return await prisma.$queryRawUnsafe(sqlOrStrings, ...params);
    }
    return await prisma.$queryRaw(sqlOrStrings, ...params);
  }

  async executeComplaintMutation(sql: string, ...params: any[]): Promise<any> {
    return await prisma.$executeRawUnsafe(sql, ...params);
  }

  async executeTransaction<T>(fn: (tx: any) => Promise<T>): Promise<T> {
    return await prisma.$transaction(fn);
  }

  private getModelDelegate(modelName: string): Record<string, Function> {
    const client = prisma as unknown as Record<string, Record<string, Function>>;
    const model = client[modelName];
    if (!model) {
      throw new Error(`Model '${modelName}' is not defined on the database context`);
    }
    return model;
  }

  async findMany(modelName: string, queryOptions: any = {}): Promise<any[]> {
    const model = this.getModelDelegate(modelName);
    return await model.findMany(queryOptions);
  }

  async findUnique(modelName: string, queryOptions: any): Promise<any | null> {
    const model = this.getModelDelegate(modelName);
    return await model.findUnique(queryOptions);
  }

  async findFirst(modelName: string, queryOptions: any = {}): Promise<any | null> {
    const model = this.getModelDelegate(modelName);
    return await model.findFirst(queryOptions);
  }

  async createRecord(modelName: string, createOptions: any): Promise<any> {
    const model = this.getModelDelegate(modelName);
    return await model.create(createOptions);
  }

  async updateRecord(modelName: string, updateOptions: any): Promise<any> {
    const model = this.getModelDelegate(modelName);
    return await model.update(updateOptions);
  }

  async deleteRecord(modelName: string, deleteOptions: any): Promise<any> {
    const model = this.getModelDelegate(modelName);
    return await model.delete(deleteOptions);
  }

  async countRecord(modelName: string, countOptions: any = {}): Promise<number> {
    const model = this.getModelDelegate(modelName);
    return await model.count(countOptions);
  }
}
