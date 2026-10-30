'use server';

import { UseCaseFactory } from '@/application/factories/use-case.factory';
import { invalidatePawasUnifiedCache } from './pawas.actions';
import { serializeBigInt } from '@/lib/serialization';
import { getErrorMessage, type ActionResult } from '@/types/action.types';
import { requireRole } from '@/lib/session';

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

export async function getRecentLogbooksAction(limit = 10, stationId?: number): Promise<ActionResult<any[]>> {
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
    invalidateOfficerLogbooksCache(updated.officerId ? String(updated.officerId) : undefined);
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

    invalidateOfficerLogbooksCache(updated.officerId ? String(updated.officerId) : undefined);
    await invalidatePawasUnifiedCache().catch(() => {});
    return { success: true, data: serializeBigInt(updated) };
  } catch (error: unknown) {
    return { success: false, error: getErrorMessage(error) };
  }
}

