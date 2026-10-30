import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Satu instance PrismaClient per proses (dev & production) agar connection pool tidak membengkak.
function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    const url = process.env.DATABASE_URL;
    const baseClient = new PrismaClient({
      datasources: url ? { db: { url } } : undefined,
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });

    const clientWithTelemetry = baseClient.$extends({
      query: {
        async $allOperations({ model, operation, args, query }) {
          const start = performance.now();
          const result = await query(args);
          const duration = performance.now() - start;
          if (duration > 500) {
            console.warn(`[PRISMA SLOW QUERY] ${model ? model + '.' : ''}${operation} took ${duration.toFixed(2)}ms`);
          }
          return result;
        },
      },
    });

    globalForPrisma.prisma = clientWithTelemetry as unknown as PrismaClient;
  }
  return globalForPrisma.prisma;
}

// Lazy Proxy: prevents new PrismaClient() from executing at module import time during build
export const prisma: PrismaClient & Record<string, any> = new Proxy({} as any, {
  get(target, prop: string | symbol) {
    if (prop in target) {
      return target[prop];
    }
    const client = getPrismaClient();
    const val = (client as any)[prop];
    return typeof val === 'function' ? val.bind(client) : val;
  },
  set(target, prop: string | symbol, value) {
    target[prop] = value;
    return true;
  },
  deleteProperty(target, prop: string | symbol) {
    delete target[prop];
    return true;
  },
  has(target, prop: string | symbol) {
    if (prop in target) return true;
    const client = getPrismaClient();
    return prop in client;
  },
  getOwnPropertyDescriptor(target, prop: string | symbol) {
    if (prop in target) {
      return Object.getOwnPropertyDescriptor(target, prop);
    }
    const client = getPrismaClient();
    const desc = Object.getOwnPropertyDescriptor(client, prop);
    if (desc) return desc;
    if (prop in client) {
      return {
        configurable: true,
        enumerable: true,
        writable: true,
        value: (client as any)[prop],
      };
    }
    return undefined;
  },
});

/**
 * Health check & latency telemetry helper for TiDB Cloud Serverless database.
 */
export async function pingDatabaseHealth(): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
  const start = performance.now();
  try {
    await prisma.$queryRawUnsafe('SELECT 1');
    const latencyMs = Number((performance.now() - start).toFixed(2));
    return { ok: true, latencyMs };
  } catch (err: any) {
    const latencyMs = Number((performance.now() - start).toFixed(2));
    return { ok: false, latencyMs, error: err?.message || 'Database ping failed' };
  }
}

export default prisma;
export type { PrismaClient } from '@prisma/client';
