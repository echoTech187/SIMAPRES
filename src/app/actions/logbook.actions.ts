'use server';

import { UseCaseFactory } from '@/application/factories/use-case.factory';
import { invalidatePawasUnifiedCache } from './pawas.actions';
import { serializeBigInt } from '@/lib/serialization';
import { getErrorMessage, type ActionResult } from '@/types/action.types';
import { requireRole } from '@/lib/session';
import { validateBase64ImagePayload } from '@/infrastructure/security/file-security.service';

const officerLogbooksCache = new Map<string, { data: any[]; expiresAt: number }>();
const OFFICER_LOGBOOKS_CACHE_TTL_MS = 60 * 1000; // 60 detik cache per personel

export async function invalidateOfficerLogbooksCache(officerId?: string) {
  if (officerId) {
    for (const k of officerLogbooksCache.keys()) {
      if (k.startsWith(`${officerId}_`)) {
        officerLogbooksCache.delete(k);
      }
    }
  } else {
    officerLogbooksCache.clear();
  }
}

export async function createLogbookAction(input: {
  officerId: string;
  complaintId?: string;
  jenisAksi: string;
  lokasiKlaimAlamat: string;
  lokasiKlaimLat: number;
  lokasiKlaimLng: number;
  lokasiGpsAktualLat: number;
  lokasiGpsAktualLng: number;
  jamMulai?: string;
  jamSelesai?: string;
  fotoBuktiUrl?: string | null;
  fotoExifLat?: number | null;
  fotoExifLng?: number | null;
  deskripsiKegiatan: string;
}): Promise<ActionResult<any>> {
  try {
    const auth = await requireRole(['PERSONIL', 'SUPERADMIN']);
    if (!auth.authorized) {
      return { success: false, error: auth.error };
    }

    // Validasi Integritas Foto Bukti Giat (Maksimal 5MB, Magic Bytes, Format Sah)
    if (input.fotoBuktiUrl) {
      const vFoto = validateBase64ImagePayload(input.fotoBuktiUrl);
      if (!vFoto.valid) {
        return { success: false, error: 'Foto bukti giat tidak valid: ' + vFoto.error };
      }
    }

    const nowTime = new Date().toTimeString().slice(0, 5);
    const useCase = UseCaseFactory.getCreateLogbookEntryUseCase();
    const created = await useCase.execute({
      ...input,
      officerId: BigInt(input.officerId),
      complaintId: input.complaintId ? BigInt(input.complaintId) : null,
      jamMulai: input.jamMulai || nowTime,
      jamSelesai: input.jamSelesai || nowTime,
    });
    invalidateOfficerLogbooksCache(input.officerId);
    await invalidatePawasUnifiedCache().catch(() => {});
    return { success: true, data: serializeBigInt(created.toJSON()) };
  } catch (error: unknown) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function getOfficerLogbooksAction(officerId: string, limit = 50): Promise<ActionResult<any[]>> {
  try {
    const auth = await requireRole('ANY_LOGGED_IN');
    if (!auth.authorized) {
      return { success: false, error: auth.error };
    }

    const key = `${officerId}_${limit}`;
    const now = Date.now();
    const cached = officerLogbooksCache.get(key);
    if (cached && now < cached.expiresAt) {
      return { success: true, data: cached.data };
    }

    const repo = UseCaseFactory.getLogbookRepository();
    const logbooks = await repo.findByOfficerId(BigInt(officerId), limit);
    const serialized = serializeBigInt(logbooks.map((l) => l.toJSON()));
    officerLogbooksCache.set(key, { data: serialized, expiresAt: now + OFFICER_LOGBOOKS_CACHE_TTL_MS });
    return { success: true, data: serialized };
  } catch (error: unknown) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function getOfficerKpiChartDataAction(officerId: string): Promise<ActionResult<Record<string, number>>> {
  try {
    const auth = await requireRole('ANY_LOGGED_IN');
    if (!auth.authorized) {
      return { success: false, error: auth.error };
    }

    const repo = UseCaseFactory.getLogbookRepository();
    const counts = await repo.countByJenisAksi(BigInt(officerId));
    return { success: true, data: counts };
  } catch (error: unknown) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function getFlaggedAuditLogbooksAction(limit = 50): Promise<ActionResult<any[]>> {
  try {
    const auth = await requireRole(['PAWAS', 'SUPERADMIN']);
    if (!auth.authorized) {
      return { success: false, error: auth.error };
    }

    const repo = UseCaseFactory.getLogbookRepository();
    const flagged = await repo.findFlaggedAudit(limit);
    return { success: true, data: serializeBigInt(flagged.map((l) => l.toJSON())) };
  } catch (error: unknown) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function getRecentLogbooksAction(limit = 200, stationId?: number): Promise<ActionResult<any[]>> {
  try {
    const auth = await requireRole(['PAWAS', 'OPERATOR', 'SUPERADMIN']);
    if (!auth.authorized) {
      return { success: false, error: auth.error };
    }

    const useCase = UseCaseFactory.getPawasLogbookUseCase();
    const result = await useCase.execute(limit, stationId);
    return {
      success: true,
      data: serializeBigInt(result.recentLogbooks.map((l) => l.toJSON())),
    };
  } catch (error: unknown) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function validateOfficerLogbookAction(
  logbookId: string | number | bigint,
  status: 'VALID' | 'FLAGGED_AUDIT' | 'DITOLAK' | string,
  note?: string
): Promise<ActionResult<any>> {
  try {
    const auth = await requireRole(['PAWAS', 'SUPERADMIN']);
    if (!auth.authorized) {
      return { success: false, error: auth.error };
    }

    const useCase = UseCaseFactory.getValidateLogbookUseCase();
    const updated = await useCase.execute(BigInt(logbookId), status as any, note);
    invalidateOfficerLogbooksCache();
    await invalidatePawasUnifiedCache().catch(() => {});
    return { success: true, data: serializeBigInt(updated.toJSON()) };
  } catch (error: unknown) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function completeGiatPatroliAction(input: {
  logbookId: string | number;
  finalMeters: number;
  catatanHasil?: string;
}): Promise<ActionResult<any>> {
  try {
    const auth = await requireRole(['PERSONIL', 'SUPERADMIN']);
    if (!auth.authorized) {
      return { success: false, error: auth.error };
    }

    const id = BigInt(input.logbookId);
    const repo = UseCaseFactory.getLogbookRepository();
    if (!repo.completePatrolGiat) {
      return { success: false, error: 'Metode completePatrolGiat tidak didukung oleh repositori.' };
    }
    const updated = await repo.completePatrolGiat(id, input.finalMeters, input.catatanHasil);

    invalidateOfficerLogbooksCache();
    await invalidatePawasUnifiedCache().catch(() => {});
    return { success: true, data: serializeBigInt(updated.toJSON ? updated.toJSON() : updated) };
  } catch (error: unknown) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function joinTicketAsBackupCrewAction(input: {
  ticketNumberOrId: string;
  officerId: string;
  officerName: string;
  officerNrp?: string;
  officerPangkat?: string;
  additionalPartners?: Array<{ name: string; nrp?: string; pangkat?: string }>;
}): Promise<ActionResult<{
  complaintId: string;
  nomorTiket: string;
  jenisKejadian: string;
  tkpAlamat: string;
  tkpLat: number;
  tkpLng: number;
  leaderName: string;
}>> {
  try {
    const auth = await requireRole(['PERSONIL', 'SUPERADMIN']);
    if (!auth.authorized) {
      return { success: false, error: auth.error };
    }

    const { prisma } = await import('@/infrastructure/db/prisma.client');
    const rawTicket = (input.ticketNumberOrId || '').trim().replace(/^#/, '');
    if (!rawTicket) {
      return { success: false, error: 'Nomor tiket aduan wajib diisi.' };
    }

    const isNumericId = /^\d+$/.test(rawTicket);
    const complaint = await prisma.complaint.findFirst({
      where: isNumericId
        ? {
            OR: [
              { id: BigInt(rawTicket) },
              { nomor_tiket: rawTicket },
              { nomor_tiket: `TICKET-${rawTicket}` },
              { nomor_tiket: `C110-${rawTicket}` },
            ],
          }
        : {
            OR: [
              { nomor_tiket: rawTicket },
              { nomor_tiket: `#${rawTicket}` },
              { nomor_tiket: rawTicket.toUpperCase() },
            ],
          },
      include: {
        dispatches: {
          include: {
            officer: { include: { user: true } },
          },
        },
      },
    });

    if (!complaint) {
      return {
        success: false,
        error: `Tiket #${rawTicket} tidak ditemukan di database.`,
      };
    }

    if (complaint.status === 'SELESAI' || complaint.status === 'DITOLAK') {
      return {
        success: false,
        error: `Tiket #${complaint.nomor_tiket} sudah berstatus ${complaint.status}.`,
      };
    }

    // Cari dispatch utama (prioritas yang sudah di-accept petugas utama / PENGAJU)
    const targetDispatch =
      complaint.dispatches.find((d) => d.accepted_at != null) ||
      complaint.dispatches.find((d) => d.is_primary_unit) ||
      complaint.dispatches[0];

    if (!targetDispatch) {
      return {
        success: false,
        error: `Tiket #${complaint.nomor_tiket} belum memiliki disposisi unit aktif.`,
      };
    }

    // Format nama personil yang mengajukan TPTKP ini
    const rank = (input.officerPangkat || '').trim();
    const rawOfficerName = (input.officerName || auth.user.fullName || 'Personel').trim();
    const formattedMainOfficerName =
      rank && !rawOfficerName.toLowerCase().startsWith(rank.toLowerCase())
        ? `${rank} ${rawOfficerName}`
        : rawOfficerName;
    const mainOfficerNrp = (input.officerNrp || auth.user.identifier || '').trim();

    // Kumpulkan daftar rekan yang sudah ada di dispatch tersebut
    const existingNames = targetDispatch.crew_partner_name
      ? targetDispatch.crew_partner_name
          .split('|')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
    const existingNrps = targetDispatch.crew_partner_nrp
      ? targetDispatch.crew_partner_nrp
          .split('|')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    const addMember = (nameStr: string, nrpStr?: string) => {
      const cName = nameStr.trim();
      const cNrp = (nrpStr || '').trim();
      if (!cName) return;

      // Jangan duplikasi jika personil ini adalah leader utama sendiri
      const leaderNrp = targetDispatch.crew_leader_nrp || targetDispatch.officer?.nrp || '';
      if (cNrp && leaderNrp && cNrp === leaderNrp) return;

      const alreadyInList = existingNames.some(
        (n) => n.toLowerCase() === cName.toLowerCase() || (cNrp && n.includes(cNrp))
      );
      if (!alreadyInList) {
        existingNames.push(cNrp ? `${cName} (NRP ${cNrp})` : cName);
      }
      if (cNrp && !existingNrps.includes(cNrp)) {
        existingNrps.push(cNrp);
      }
    };

    // Tambahkan personil pembuat TPTKP sebagai REKAN
    addMember(formattedMainOfficerName, mainOfficerNrp);

    // Tambahkan juga rekan pendamping jika dipilih di modal TPTKP
    if (Array.isArray(input.additionalPartners)) {
      for (const p of input.additionalPartners) {
        const pRank = (p.pangkat || '').trim();
        const pRawName = (p.name || '').trim();
        const pFullName =
          pRank && !pRawName.toLowerCase().startsWith(pRank.toLowerCase())
            ? `${pRank} ${pRawName}`
            : pRawName;
        addMember(pFullName, p.nrp);
      }
    }

    const updatedPartnerName = existingNames.join(' | ').substring(0, 118);
    const updatedPartnerNrp = existingNrps.length > 0 ? existingNrps.join(' | ').substring(0, 48) : null;

    await prisma.complaintDispatch.update({
      where: { id: targetDispatch.id },
      data: {
        crew_partner_name: updatedPartnerName,
        crew_partner_nrp: updatedPartnerNrp,
        tactical_orders:
          (targetDispatch.tactical_orders || '') +
          ` | Perbantuan TPTKP Mandiri oleh ${formattedMainOfficerName}`,
      },
    });

    const leaderName =
      targetDispatch.crew_leader_name ||
      targetDispatch.officer?.user?.full_name ||
      'Petugas Utama';

    await prisma.complaintAuditLog.create({
      data: {
        complaint_id: complaint.id,
        actor_name: formattedMainOfficerName,
        actor_role: auth.user.role,
        action: 'JOIN_BACKUP_TPTKP',
        notes: `${formattedMainOfficerName}${mainOfficerNrp ? ` (NRP ${mainOfficerNrp})` : ''} bergabung langsung sebagai Rekan Regu (Perbantuan TPTKP) mendampingi ${leaderName} pada tiket #${complaint.nomor_tiket}.`,
      },
    });

    try {
      const { cacheInvalidate } = await import('@/infrastructure/cache/app-cache');
      cacheInvalidate('officer_complaints_');
      cacheInvalidate('complaint_');
      cacheInvalidate('all_recent_complaints');
      cacheInvalidate('antrean_pawas');
    } catch (_) {}

    return {
      success: true,
      data: {
        complaintId: String(complaint.id),
        nomorTiket: complaint.nomor_tiket,
        jenisKejadian: complaint.jenis_kejadian || complaint.ringkasan_keterangan || 'Penanganan TKP',
        tkpAlamat: complaint.tkp_alamat_teks || 'Lokasi TKP',
        tkpLat: Number(complaint.tkp_lat || 0),
        tkpLng: Number(complaint.tkp_lng || 0),
        leaderName,
      },
    };
  } catch (error: unknown) {
    return { success: false, error: getErrorMessage(error) };
  }
}
