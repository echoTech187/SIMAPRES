import { UseCaseFactory } from '@/application/factories/use-case.factory';
import { UrgensiLevel } from '@/domain/entities/complaint.entity';
import { revalidatePath } from 'next/cache';
import { cacheInvalidate } from '@/infrastructure/cache/app-cache';
import { broadcastConsoleEvent } from '@/lib/events/console-events';
import type { PrismaClient } from '@prisma/client';

// Inversion of Control: Controller delegates all data operations to IComplaintRepository
export const getComplaintRepo = () => UseCaseFactory.getComplaintRepository();

type QueryParam = unknown;
type PrismaModelArgs = Record<string, unknown>;

export interface ComplaintRepositoryProxy {
  executeComplaintQuery?: (query: string | TemplateStringsArray, ...params: QueryParam[]) => Promise<unknown>;
  executeComplaintMutation?: (query: string, ...params: QueryParam[]) => Promise<unknown>;
  executeTransaction?: <T>(fn: (tx: PrismaClient) => Promise<T>) => Promise<T>;
  findMany?: (model: string, args?: PrismaModelArgs) => Promise<unknown[]>;
  findUnique?: (model: string, args: PrismaModelArgs) => Promise<unknown>;
  findFirst?: (model: string, args?: PrismaModelArgs) => Promise<unknown>;
  createRecord?: (model: string, args: PrismaModelArgs) => Promise<unknown>;
  updateRecord?: (model: string, args: PrismaModelArgs) => Promise<unknown>;
  deleteRecord?: (model: string, args: PrismaModelArgs) => Promise<unknown>;
  countRecord?: (model: string, args?: PrismaModelArgs) => Promise<number>;
}

export const prisma: PrismaClient = new Proxy({}, {
  get(_target, prop: string) {
    const repo = getComplaintRepo() as unknown as ComplaintRepositoryProxy;
    if (prop === '$queryRaw') {
      return (strings: TemplateStringsArray | string, ...values: QueryParam[]) =>
        repo.executeComplaintQuery?.(strings, ...values);
    }
    if (prop === '$queryRawUnsafe') {
      return (query: string, ...params: QueryParam[]) =>
        repo.executeComplaintQuery?.(query, ...params);
    }
    if (prop === '$executeRawUnsafe') {
      return (query: string, ...params: QueryParam[]) =>
        repo.executeComplaintMutation?.(query, ...params);
    }
    if (prop === '$transaction') {
      return (fn: (tx: PrismaClient) => Promise<unknown>) => repo.executeTransaction?.(fn);
    }
    return {
      findMany: (args?: PrismaModelArgs) => repo.findMany?.(prop, args),
      findUnique: (args: PrismaModelArgs) => repo.findUnique?.(prop, args),
      findFirst: (args?: PrismaModelArgs) => repo.findFirst?.(prop, args),
      create: (args: PrismaModelArgs) => repo.createRecord?.(prop, args),
      update: (args: PrismaModelArgs) => repo.updateRecord?.(prop, args),
      updateMany: (args: PrismaModelArgs) => repo.updateRecord?.(prop, args),
      delete: (args: PrismaModelArgs) => repo.deleteRecord?.(prop, args),
      count: (args?: PrismaModelArgs) => repo.countRecord?.(prop, args),
    };
  },
}) as unknown as PrismaClient;

export async function invalidateComplaintCaches() {
  cacheInvalidate('antrean_pawas');
  cacheInvalidate('recent_complaints');
  cacheInvalidate('officer_performance_rankings');
  cacheInvalidate('ikm_stats');
  cacheInvalidate('pawas_unified_data');
  cacheInvalidate('officer_complaints');
  cacheInvalidate('tracking_');

  broadcastConsoleEvent({
    type: 'COMPLAINT_UPDATED',
  });
}

export function safeRevalidatePath(path?: string) {
  invalidateComplaintCaches();
  try {
    revalidatePath('/warga');
    if (path && !path.startsWith('/console') && path !== '/warga') {
      revalidatePath(path);
    }
  } catch (_e) {
    // Graceful fallback when executed outside Next.js request context (e.g. test scripts)
  }
}

export { serializeBigInt, type SerializedBigInt } from '@/lib/serialization';

export interface CreateComplaintActionInput {
  pelaporNama?: string;
  namaPelapor?: string;
  pelaporHp?: string;
  noHpPelapor?: string;
  jenisKejadian?: string;
  kategoriLaporan?: string;
  urgensi?: UrgensiLevel;
  tkpAlamatTeks: string;
  tkpLat: number;
  tkpLng: number;
  ringkasanKeterangan?: string;
  deskripsiKejadian?: string;
  saluranLaporan?: string;
  operatorId?: string | null;
  kategoriKey?: string;
  subcategoryId?: number | string | null;
  platformKey?: string;
  fotoBuktiUrl?: string | null;
  fotoPengaduan?: string | null;
  nomorTiket?: string;
}

export function normalizeCreateComplaintInput(input: CreateComplaintActionInput) {
  const cleanNama = (input.pelaporNama || input.namaPelapor || '').trim();
  const cleanHp = (input.pelaporHp || input.noHpPelapor || '').trim();
  const cleanJenis = (input.jenisKejadian || input.kategoriLaporan || input.kategoriKey || '').trim();
  const cleanAlamat = (input.tkpAlamatTeks || '').trim();
  const cleanRingkasan = (input.ringkasanKeterangan || input.deskripsiKejadian || '').trim();
  const platformKey = input.platformKey || input.saluranLaporan || '';
  const initialFoto = input.fotoBuktiUrl || input.fotoPengaduan || null;
  const kategoriKey = input.kategoriKey || cleanJenis;

  return {
    cleanNama,
    cleanHp,
    cleanJenis,
    cleanAlamat,
    cleanRingkasan,
    platformKey,
    initialFoto,
    kategoriKey,
  };
}
