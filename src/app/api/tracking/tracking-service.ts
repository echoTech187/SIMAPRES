import { prisma } from '@/infrastructure/db/prisma.client';
import { cacheGetOrLoad } from '@/infrastructure/cache/app-cache';
import type { ChatMessageItem } from '@/types/chat.types';

import { serializeBigInt } from '@/lib/serialization';
export { serializeBigInt };


export interface TrackingDataResult {
  complaint: any;
  chatMessages: ChatMessageItem[];
}

// Micro-cache bersama untuk REST /api/tracking dan SSE stream: banyak penonton tiket yang sama = 1 query per TTL
const TRACKING_CACHE_TTL_MS = 1000;

export function getTrackingData(
  tiket: string,
  cleanTiket: string,
  withHash: string
): Promise<TrackingDataResult | null> {
  return cacheGetOrLoad(`tracking_${cleanTiket}`, TRACKING_CACHE_TTL_MS, () =>
    loadTrackingData(tiket, cleanTiket, withHash)
  );
}

function maskPhoneNumber(phone?: string | null): string {
  if (!phone) return '-';
  const clean = String(phone).trim();
  if (clean.length <= 6) return '0812****';
  return `${clean.slice(0, 4)}****${clean.slice(-3)}`;
}

function maskName(name?: string | null): string {
  if (!name) return 'Warga 110';
  const parts = String(name).trim().split(/\s+/);
  if (parts.length === 1) {
    const p = parts[0];
    return p.length > 2 ? `${p.slice(0, 2)}***` : `${p}*`;
  }
  return parts.map((p, idx) => (idx === 0 ? p : `${p[0]}***`)).join(' ');
}

async function loadTrackingData(
  tiket: string,
  cleanTiket: string,
  withHash: string
): Promise<TrackingDataResult | null> {
  // 1. Single JOIN Query to eliminate sequential network round-trips
  const rows: any[] = await prisma.$queryRaw`
    SELECT 
      c.id, c.nomor_tiket, c.status, c.tahap, c.urgensi, c.pelapor_nama, c.pelapor_hp,
      c.jenis_kejadian, c.ringkasan_keterangan, c.tkp_alamat_teks, c.tkp_lat, c.tkp_lng,
      c.station_id, c.operator_id, c.resolution_location_key, c.resolution_document_key,
      c.created_at, c.updated_at,
      u_op.full_name AS operator_name,
      st.station_name, st.station_code, st.address AS station_address,
      d.id AS dispatch_id, d.dispatch_status, d.accepted_at, d.departed_at, d.arrived_at, d.completed_at,
      o.id AS officer_id, o.nrp, o.rank_pangkat, o.jabatan, o.assigned_patrol_vehicle,
      o.current_gps_lat, o.current_gps_lng, o.avatar_url,
      u.full_name, u.phone_number,
      un.id AS unit_id, un.unit_name, un.short_name
    FROM complaints c
    LEFT JOIN users u_op ON u_op.id = c.operator_id
    LEFT JOIN police_stations st ON st.id = c.station_id
    LEFT JOIN complaint_dispatches d ON d.complaint_id = c.id
    LEFT JOIN police_officers o ON o.id = d.officer_id
    LEFT JOIN users u ON u.id = o.user_id
    LEFT JOIN master_operational_units un ON un.id = d.unit_id
    WHERE c.nomor_tiket IN (
      ${tiket}, 
      ${cleanTiket}, 
      ${withHash},
      ${cleanTiket.startsWith('TICKET-') ? cleanTiket.replace(/^TICKET-/, '') : `TICKET-${cleanTiket}`},
      ${cleanTiket.startsWith('TIKET-') ? `TICKET-${cleanTiket}` : cleanTiket}
    )
    ORDER BY d.id ASC
  `;

  if (!rows || rows.length === 0) {
    return null;
  }

  const first = rows[0];
  const compId = first.id;

  // 2. Chat, fallback audit log, catatan penyelesaian, ulasan warga, dan log disposisi lintas wilayah diambil paralel
  const [rawChats, legacyChatLogs, finishLogs, citizenReviewRows, transferLogs] = await Promise.all([
    prisma
      .$queryRawUnsafe<any[]>(
        `SELECT id, sender_role, sender_name, officer_nrp, message_text, created_at
         FROM complaint_chats
         WHERE complaint_id = ?
         ORDER BY created_at ASC`,
        compId
      )
      .catch(() => [] as any[]),
    prisma.$queryRaw<any[]>`
      SELECT id, notes, actor_role, actor_name, created_at
      FROM complaint_audit_logs
      WHERE complaint_id = ${compId} AND action = 'CHAT_MESSAGE'
      ORDER BY created_at ASC
    `,
    prisma.$queryRaw<any[]>`
      SELECT notes
      FROM complaint_audit_logs
      WHERE complaint_id = ${compId}
        AND notes IS NOT NULL
        AND notes != ''
        AND (action IN ('COMPLAINT_COMPLETED', 'REPORT_SUBMITTED', 'SELESAI', 'RESOLVED_AT_OPERATOR_DESK') OR action LIKE '%Selesai%' OR action LIKE '%BAP%' OR action LIKE '%Operator%')
      ORDER BY id DESC
      LIMIT 1
    `.catch(() => [] as any[]),
    prisma.$queryRaw<any[]>`
      SELECT star_rating, feedback_tags, review_text
      FROM citizen_reviews
      WHERE complaint_id = ${compId}
      LIMIT 1
    `.catch(() => [] as any[]),
    prisma.$queryRaw<any[]>`
      SELECT id, notes, actor_name, created_at
      FROM complaint_audit_logs
      WHERE complaint_id = ${compId} AND action = 'DISPOSISI_LINTAS_WILAYAH'
      ORDER BY id DESC
      LIMIT 1
    `.catch(() => [] as any[]),
  ]);

  const chatMessages: ChatMessageItem[] = [];
  if (Array.isArray(rawChats) && rawChats.length > 0) {
    for (const row of rawChats) {
      chatMessages.push({
        id: String(row.id),
        senderRole: row.sender_role === 'WARGA' ? 'WARGA' : 'PERSONIL',
        senderName: row.sender_name,
        text: row.message_text,
        timestamp: new Date(row.created_at).toISOString(),
        officerNrp: row.officer_nrp || undefined,
      });
    }
  }

  // Fallback audit logs jika belum ada di complaint_chats
  if (chatMessages.length === 0) {
    for (const log of legacyChatLogs || []) {
      let text = log.notes || '';
      let role: 'WARGA' | 'PERSONIL' | 'SISTEM' = log.actor_role === 'WARGA' ? 'WARGA' : 'PERSONIL';
      let name = log.actor_name || (role === 'WARGA' ? 'Pelapor' : 'Personil Lapangan');
      let ts = log.created_at instanceof Date ? log.created_at.toISOString() : String(log.created_at);

      try {
        if (text.startsWith('{') && text.endsWith('}')) {
          const parsed = JSON.parse(text);
          if (parsed.text) text = parsed.text;
          if (parsed.senderRole) role = parsed.senderRole;
          if (parsed.senderName) name = parsed.senderName;
          if (parsed.timestamp) ts = parsed.timestamp;
        }
      } catch (_) {}

      chatMessages.push({
        id: String(log.id),
        senderRole: role,
        senderName: name,
        text,
        timestamp: ts,
      });
    }
  }

  // 2b. Catatan Penyelesaian oleh Personil (jika tiket telah berstatus selesai)
  const catatanSelesai: string | null =
    finishLogs && finishLogs.length > 0 && finishLogs[0].notes ? finishLogs[0].notes : null;

  // 2c. Ulasan & Penilaian Kepuasan Warga
  const reviewRow = citizenReviewRows && citizenReviewRows.length > 0 ? citizenReviewRows[0] : null;
  const citizenRating = reviewRow ? Number(reviewRow.star_rating) : null;
  const citizenTags = reviewRow?.feedback_tags || null;
  const citizenReview = reviewRow?.review_text || null;

  // 3. Assemble Dispatches
  const dispatchesMap = new Map<string, any>();
  for (const r of rows) {
    if (!r.dispatch_id) continue;
    const dId = String(r.dispatch_id);
    if (!dispatchesMap.has(dId)) {
      dispatchesMap.set(dId, {
        id: dId,
        dispatchStatus: r.dispatch_status,
        dispatch_status: r.dispatch_status,
        acceptedAt: r.accepted_at,
        accepted_at: r.accepted_at,
        departedAt: r.departed_at,
        arrivedAt: r.arrived_at,
        completedAt: r.completed_at,
        departed_at: r.departed_at,
        arrived_at: r.arrived_at,
        officer: r.officer_id
          ? {
              id: String(r.officer_id),
              nrp: r.nrp,
              rankPangkat: r.rank_pangkat,
              rank_pangkat: r.rank_pangkat,
              jabatan: r.jabatan,
              assignedPatrolVehicle: r.assigned_patrol_vehicle,
              assigned_patrol_vehicle: r.assigned_patrol_vehicle,
              currentGpsLat: r.current_gps_lat ? Number(r.current_gps_lat) : null,
              current_gps_lat: r.current_gps_lat ? Number(r.current_gps_lat) : null,
              currentGpsLng: r.current_gps_lng ? Number(r.current_gps_lng) : null,
              current_gps_lng: r.current_gps_lng ? Number(r.current_gps_lng) : null,
              avatarUrl: r.avatar_url,
              user: r.full_name
                ? {
                    full_name: r.full_name,
                    nama_lengkap: r.full_name,
                    phone_number: maskPhoneNumber(r.phone_number),
                    raw_phone_number: r.phone_number,
                  }
                : null,
            }
          : null,
        unit: r.unit_id
          ? {
              id: r.unit_id,
              unitName: r.unit_name,
              unit_name: r.unit_name,
              shortName: r.short_name,
              short_name: r.short_name,
            }
          : null,
      });
    }
  }

  const dispatches = Array.from(dispatchesMap.values());

  // Prioritaskan dispatch yang memiliki officer dan status penanganan paling maju
  const sortedDispatches = [...dispatches].sort((a, b) => {
    const score = (d: any) => {
      let s = 0;
      if (d.officer) s += 10;
      if (d.acceptedAt || d.accepted_at) s += 20;
      if (d.departedAt || d.departed_at) s += 30;
      if (d.arrivedAt || d.arrived_at) s += 40;
      if (d.completedAt || d.completed_at) s += 50;
      return s;
    };
    return score(b) - score(a);
  });

  const primaryDispatch = sortedDispatches[0] || null;
  const primaryOfficer = primaryDispatch?.officer
    ? {
        id: primaryDispatch.officer.id,
        nrp: primaryDispatch.officer.nrp || null,
        namaLengkap:
          primaryDispatch.officer.user?.full_name ||
          primaryDispatch.officer.user?.nama_lengkap ||
          'Petugas Lapangan',
        rankPangkat:
          primaryDispatch.officer.rank_pangkat ||
          primaryDispatch.officer.rankPangkat,
        jabatan: primaryDispatch.officer.jabatan,
        assignedPatrolVehicle:
          primaryDispatch.officer.assigned_patrol_vehicle ||
          primaryDispatch.officer.assignedPatrolVehicle,
        currentGpsLat:
          primaryDispatch.officer.current_gps_lat ||
          primaryDispatch.officer.currentGpsLat,
        currentGpsLng:
          primaryDispatch.officer.current_gps_lng ||
          primaryDispatch.officer.currentGpsLng,
        phoneNumber: primaryDispatch.officer.user?.phone_number,
        callPhoneNumber:
          primaryDispatch.officer.user?.raw_phone_number ||
          primaryDispatch.officer.user?.phone_number ||
          '110',
        avatarUrl: primaryDispatch.officer.avatar_url,
        unitName:
          primaryDispatch.unit?.unit_name ||
          primaryDispatch.unit?.unitName ||
          'Satuan Samapta Presisi',
      }
    : null;

  const rawMeluncur = primaryDispatch?.departedAt || primaryDispatch?.departed_at || null;
  const rawTiba = primaryDispatch?.arrivedAt || primaryDispatch?.arrived_at || null;
  const rawSelesai = primaryDispatch?.completedAt || primaryDispatch?.completed_at || null;

  // 4. Deteksi Disposisi Lintas Wilayah / Boundary Transfer
  const transferLog = transferLogs && transferLogs.length > 0 ? transferLogs[0] : null;
  const isCrossJurisdiction = first.status === 'DISPOSISI_LINTAS_WILAYAH' || Boolean(transferLog);
  const crossJurisdiction = isCrossJurisdiction
    ? {
        isCrossJurisdiction: true,
        targetStationId: first.station_id ? Number(first.station_id) : 210001,
        targetStationName: first.station_name || 'Polresta Batang',
        targetStationCode: first.station_code || 'POLRESTA_BATANG',
        targetStationAddress: first.station_address || 'Jl. Gajah Mada No.200, Batang',
        targetStationHotline:
          first.station_code === 'POLRESTA_BATANG'
            ? '0285-391110'
            : first.station_code === 'POLRES_PEKALONGAN_KOTA'
            ? '0285-422110'
            : '110',
        notes:
          transferLog?.notes ||
          'Laporan Anda telah dialihkan ke yurisdiksi kepolisian terdekat demi respons taktis dan percepatan penanganan lapangan.',
        transferredAt: transferLog?.created_at
          ? new Date(transferLog.created_at).toISOString()
          : new Date(first.updated_at || first.created_at).toISOString(),
      }
    : null;

  // 5. Format Serialized Complaint
  const serialized = serializeBigInt({
    id: String(first.id),
    nomorTiket: first.nomor_tiket,
    status: first.status,
    tahap: first.tahap,
    urgensi: first.urgensi,
    pelaporNama: maskName(first.pelapor_nama),
    rawPelaporNama: first.pelapor_nama || undefined,
    pelaporHp: maskPhoneNumber(first.pelapor_hp),
    jenisKejadian: first.jenis_kejadian,
    deskripsiKejadian: first.ringkasan_keterangan,
    ringkasanKeterangan: first.ringkasan_keterangan,
    tkpAlamatTeks: first.tkp_alamat_teks,
    tkpLat: first.tkp_lat ? Number(first.tkp_lat) : null,
    tkpLng: first.tkp_lng ? Number(first.tkp_lng) : null,
    stationId: first.station_id ? Number(first.station_id) : null,
    stationName: first.station_name || null,
    stationCode: first.station_code || null,
    crossJurisdiction,
    isCrossJurisdiction,
    waktuLaporan: first.created_at,
    createdAt: first.created_at,
    assignedOfficer: primaryOfficer,
    assignedOfficerId: primaryOfficer ? primaryOfficer.id : null,
    waktuMeluncur: rawMeluncur ? new Date(rawMeluncur).toISOString() : null,
    waktuTiba: rawTiba ? new Date(rawTiba).toISOString() : null,
    selesaiAt: rawSelesai ? new Date(rawSelesai).toISOString() : null,
    catatanSelesai,
    citizenRating,
    citizenTags,
    citizenReview,
    resolutionLocationKey: first.resolution_location_key || null,
    resolutionDocumentKey: first.resolution_document_key || null,
    operatorName: first.operator_name || null,
    isDeskResolved: Boolean(
      first.resolution_location_key === 'OPERATOR_DESK' ||
      first.resolution_document_key === 'KONSULTASI_SELESAI' ||
      (first.status === 'SELESAI' && (!sortedDispatches || sortedDispatches.length === 0))
    ),
    dispatches: sortedDispatches,
    timelines: [],
    complaintLogs: [],
  });

  return {
    complaint: serialized,
    chatMessages,
  };
}
