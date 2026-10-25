import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Satu instance PrismaClient per proses (dev & production) agar connection pool tidak membengkak.
function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    const url = process.env.DATABASE_URL;
    globalForPrisma.prisma = new PrismaClient({
      datasources: url ? { db: { url } } : undefined,
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
  }
  return globalForPrisma.prisma;
}

// Lazy Proxy: prevents new PrismaClient() from executing at module import time during build
export const prisma: PrismaClient & Record<string, any> = new Proxy({} as any, {
  get(_target, prop: string | symbol) {
    const client = getPrismaClient();
    const val = (client as any)[prop];
    return typeof val === 'function' ? val.bind(client) : val;
  },
});

export default prisma;
export type { PrismaClient } from '@prisma/client';
