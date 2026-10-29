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

export default prisma;
export type { PrismaClient } from '@prisma/client';
