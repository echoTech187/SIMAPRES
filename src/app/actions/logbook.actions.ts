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

export async function createLogbookAction(input: {
  officerId: string;
  complaintId?: string | null;
  jenisAksi: 'PATROLI' | 'TPTKP' | 'SAMBANG' | 'PENGAMANAN';
  lokasiKlaimAlamat: string;
  lokasiKlaimLat: number;
  lokasiKlaimLng: number;
  lokasiGpsAktualLat: number;
  lokasiGpsAktualLng: number;
  jamMulai: string;
  jamSelesai: string;
  fotoBuktiUrl?: string | null;
  fotoExifLat?: number | null;
  fotoExifLng?: number | null;
  deskripsiKegiatan: string;
}) {
  try {
    const useCase = UseCaseFactory.getCreateLogbookEntryUseCase();
    const created = await useCase.execute({
      ...input,
      officerId: BigInt(input.officerId),
      complaintId: input.complaintId ? BigInt(input.complaintId) : null,
    });
    revalidatePath('/personil');
    revalidatePath('/command-center');
    return { success: true, data: serializeBigInt(created.toJSON()) };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal menyimpan logbook.' };
  }
}

export async function getOfficerLogbooksAction(officerId: string, limit = 50) {
  try {
    const repo = UseCaseFactory.getLogbookRepository();
    const logbooks = await repo.findByOfficerId(BigInt(officerId), limit);
    return { success: true, data: serializeBigInt(logbooks.map((l) => l.toJSON())) };
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
