import { prisma } from '@/infrastructure/db/prisma.client';
import type { ChatMessageItem } from '@/types/chat.types';

export function serializeBigInt<T>(obj: T): T {
  return JSON.parse(
    JSON.stringify(obj, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    )
  );
}

export interface TrackingDataResult {
  complaint: any;
  chatMessages: ChatMessageItem[];
}

export async function getTrackingData(
  tiket: string,
  cleanTiket: string,
  withHash: string
): Promise<TrackingDataResult | null> {
  // 1. Single JOIN Query to eliminate sequential network round-trips
  const rows: any[] = await prisma.$queryRaw`
    SELECT 
      c.id, c.nomor_tiket, c.status, c.tahap, c.urgensi, c.pelapor_nama, c.pelapor_hp,
      c.jenis_kejadian, c.ringkasan_keterangan, c.tkp_alamat_teks, c.tkp_lat, c.tkp_lng,
      c.created_at, c.updated_at,
      d.id AS dispatch_id, d.dispatch_status, d.accepted_at, d.departed_at, d.arrived_at, d.completed_at,
      o.id AS officer_id, o.nrp, o.rank_pangkat, o.jabatan, o.assigned_patrol_vehicle,
      o.current_gps_lat, o.current_gps_lng, o.avatar_url,
      u.full_name, u.phone_number,
      un.id AS unit_id, un.unit_name, un.short_name
    FROM complaints c
    LEFT JOIN complaint_dispatches d ON d.complaint_id = c.id
    LEFT JOIN police_officers o ON o.id = d.officer_id
    LEFT JOIN users u ON u.id = o.user_id
    LEFT JOIN master_operational_units un ON un.id = d.unit_id
    WHERE c.nomor_tiket IN (${tiket}, ${cleanTiket}, ${withHash})
    ORDER BY d.id ASC
  `;

  if (!rows || rows.length === 0) {
    return null;
  }

  const first = rows[0];
  const compId = first.id;

  // 2. Fetch Chat Messages (prioritaskan tabel terdedikasi complaint_chats)
  const chatMessages: ChatMessageItem[] = [];
  try {
    const rawChats = await prisma.$queryRawUnsafe<any[]>(
      `SELECT id, sender_role, sender_name, officer_nrp, message_text, created_at
       FROM complaint_chats
       WHERE complaint_id = ?
       ORDER BY created_at ASC`,
      compId
    );
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
  } catch (_) {}

  // Fallback audit logs jika belum ada di complaint_chats
  if (chatMessages.length === 0) {
    const chatLogs: any[] = await prisma.$queryRaw`
      SELECT id, notes, actor_role, actor_name, created_at
      FROM complaint_audit_logs
      WHERE complaint_id = ${compId} AND action = 'CHAT_MESSAGE'
      ORDER BY created_at ASC
    `;

    for (const log of chatLogs || []) {
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

  // 2b. Fetch Catatan Penyelesaian oleh Personil (jika tiket telah berstatus selesai)
  let catatanSelesai: string | null = null;
  try {
    const finishLogs: any[] = await prisma.$queryRaw`
      SELECT notes
      FROM complaint_audit_logs
      WHERE complaint_id = ${compId} 
        AND notes IS NOT NULL
        AND notes != ''
        AND (action = 'SELESAI' OR action LIKE '%Selesai%' OR action LIKE '%BAP%')
      ORDER BY id DESC
      LIMIT 1
    `;
    if (finishLogs && finishLogs.length > 0 && finishLogs[0].notes) {
      catatanSelesai = finishLogs[0].notes;
    }
  } catch (_) {}

  // 3. Assemble Dispatches
  const dispatchesMap = new Map<string, any>();
  for (const r of rows) {
    if (!r.dispatch_id) continue;
    const dId = String(r.dispatch_id);
    if (!dispatchesMap.has(dId)) {
      dispatchesMap.set(dId, {
        id: dId,
        dispatchStatus: r.dispatch_status,
        acceptedAt: r.accepted_at,
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
                    phone_number: r.phone_number,
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

  // 4. Format Serialized Complaint
  const serialized = serializeBigInt({
    id: String(first.id),
    nomorTiket: first.nomor_tiket,
    status: first.status,
    tahap: first.tahap,
    urgensi: first.urgensi,
    pelaporNama: first.pelapor_nama,
    pelaporHp: first.pelapor_hp,
    jenisKejadian: first.jenis_kejadian,
    deskripsiKejadian: first.ringkasan_keterangan,
    ringkasanKeterangan: first.ringkasan_keterangan,
    tkpAlamatTeks: first.tkp_alamat_teks,
    tkpLat: first.tkp_lat ? Number(first.tkp_lat) : null,
    tkpLng: first.tkp_lng ? Number(first.tkp_lng) : null,
    waktuLaporan: first.created_at,
    createdAt: first.created_at,
    catatanSelesai,
    dispatches,
    timelines: [],
    complaintLogs: [],
  });

  return {
    complaint: serialized,
    chatMessages,
  };
}
