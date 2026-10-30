import { UseCaseFactory } from '@/application/factories/use-case.factory';
import type { PrismaClient } from '@prisma/client';
import { getSession, requireRole } from '@/lib/session';
import { logUserActivity } from '@/infrastructure/logging/activity-logger';

// Inversion of Control: Controller delegates all data operations to IMasterRepository
export const getMasterRepo = () => UseCaseFactory.getMasterRepository();

type QueryParam = unknown;
type PrismaModelArgs = Record<string, unknown>;

export interface MasterRepositoryProxy {
  executeMasterQuery?: (query: string | TemplateStringsArray, ...params: QueryParam[]) => Promise<unknown>;
  findMany: (model: string, args?: PrismaModelArgs) => Promise<unknown[]>;
  findUnique: (model: string, args: PrismaModelArgs) => Promise<unknown>;
  findFirst: (model: string, args?: PrismaModelArgs) => Promise<unknown>;
  create: (model: string, args: PrismaModelArgs) => Promise<unknown>;
  update: (model: string, args: PrismaModelArgs) => Promise<unknown>;
  delete: (model: string, args: PrismaModelArgs) => Promise<unknown>;
  count: (model: string, args?: PrismaModelArgs) => Promise<number>;
}

export const prisma: PrismaClient = new Proxy({}, {
  get(_target, prop: string) {
    const repo = getMasterRepo() as unknown as MasterRepositoryProxy;
    if (prop === '$queryRaw') {
      return (strings: TemplateStringsArray | string, ...values: QueryParam[]) =>
        repo.executeMasterQuery?.(strings, ...values);
    }
    if (prop === '$queryRawUnsafe') {
      return (query: string, ...params: QueryParam[]) =>
        repo.executeMasterQuery?.(query, ...params);
    }
    return {
      findMany: (args?: PrismaModelArgs) => repo.findMany(prop, args),
      findUnique: (args: PrismaModelArgs) => repo.findUnique(prop, args),
      findFirst: (args?: PrismaModelArgs) => repo.findFirst(prop, args),
      create: (args: PrismaModelArgs) => repo.create(prop, args),
      update: (args: PrismaModelArgs) => repo.update(prop, args),
      delete: (args: PrismaModelArgs) => repo.delete(prop, args),
      count: (args?: PrismaModelArgs) => repo.count(prop, args),
    };
  },
}) as unknown as PrismaClient;

export const revalidatePath = (_path: string) => {};

export { serializeBigInt, type SerializedBigInt } from '@/lib/serialization';
export { requireRole, type UserRole } from '@/lib/session';

export async function requireSuperadmin() {
  const auth = await requireRole('SUPERADMIN');
  if (!auth.authorized) {
    return { authorized: false as const, error: auth.error };
  }
  return { authorized: true as const, user: auth.user };
}

export async function auditLog(activityType: string, description: string) {
  try {
    const session = await getSession();
    if (session) {
      await logUserActivity({
        userId: session.userId,
        identifier: session.identifier,
        userName: session.fullName,
        role: session.role,
        activityType,
        description,
        endpoint: '/console',
      });
    }
  } catch (_) {}
}

export function parsePositiveIntId(
  id: number | string | undefined | null,
  fieldName = 'ID'
): { valid: true; value: number } | { valid: false; error: string } {
  if (id === undefined || id === null || id === '') {
    return { valid: false, error: `${fieldName} wajib diisi!` };
  }
  const num = Number(id);
  if (isNaN(num) || !Number.isInteger(num) || num <= 0) {
    return { valid: false, error: `${fieldName} harus berupa angka ID positif yang valid!` };
  }
  return { valid: true, value: num };
}

export function parsePositiveBigIntId(
  id: number | string | bigint | undefined | null,
  fieldName = 'ID'
): { valid: true; value: bigint } | { valid: false; error: string } {
  if (id === undefined || id === null || id === '') {
    return { valid: false, error: `${fieldName} wajib diisi!` };
  }
  try {
    const b = BigInt(id);
    if (b <= BigInt(0)) {
      return { valid: false, error: `${fieldName} harus berupa angka ID positif!` };
    }
    return { valid: true, value: b };
  } catch {
    return { valid: false, error: `${fieldName} bukan format ID yang valid!` };
  }
}
