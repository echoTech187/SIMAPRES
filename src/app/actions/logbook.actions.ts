'use server';

import { UseCaseFactory } from '@/application/factories/use-case.factory';
import { revalidatePath } from 'next/cache';

function serializeBigInt<T>(obj: T): T {
  return JSON.parse(
    JSON.stringify(obj, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    )
  );
}

const officerLogbooksCache = new Map<string, { data: any; expiresAt: number }>();
const OFFICER_LOGBOOKS_CACHE_TTL_MS = 20 * 1000; // 20 detik

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
}) {
  try {
    const nowTime = new Date().toTimeString().slice(0, 5);
    const useCase = UseCaseFactory.getCreateLogbookEntryUseCase();
    const created = await useCase.execute({
      ...input,
      officerId: BigInt(input.officerId),
      complaintId: input.complaintId ? BigInt(input.complaintId) : null,
      jamMulai: input.jamMulai || nowTime,
      jamSelesai: input.jamSelesai || nowTime,
    });
    officerLogbooksCache.clear();
    revalidatePath('/console', 'layout');
    return { success: true, data: serializeBigInt(created.toJSON()) };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal menyimpan logbook.' };
  }
}

export async function getOfficerLogbooksAction(officerId: string, limit = 50) {
  try {
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
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal mengambil riwayat logbook.' };
  }
}

export async function getOfficerKpiChartDataAction(officerId: string) {
  try {
    const repo = UseCaseFactory.getLogbookRepository();
    const counts = await repo.countByJenisAksi(BigInt(officerId));
    return { success: true, data: counts };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal menghitung statistik KPI.' };
  }
}

export async function getFlaggedAuditLogbooksAction(limit = 50) {
  try {
    const repo = UseCaseFactory.getLogbookRepository();
    const flagged = await repo.findFlaggedAudit(limit);
    return { success: true, data: serializeBigInt(flagged.map((l) => l.toJSON())) };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal mengambil log audit Propam.' };
  }
}
