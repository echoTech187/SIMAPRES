/**
 * In-Memory Application Server Cache (High-Performance TTL Store)
 * 
 * Digunakan untuk mereduksi latensi query berulang dari Next.js Server Actions
 * dan Server Components ke database MySQL / TiDB.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cacheStore = new Map<string, CacheEntry<any>>();

/**
 * Mengambil data dari cache jika masih dalam masa TTL aktif.
 */
export function cacheGet<T>(key: string): T | null {
  const entry = cacheStore.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cacheStore.delete(key);
    return null;
  }
  return entry.data as T;
}

/**
 * Menyimpan data ke dalam cache dengan batas kedaluwarsa (TTL).
 */
export function cacheSet<T>(key: string, data: T, ttlMs: number): void {
  cacheStore.set(key, {
    data,
    expiresAt: Date.now() + ttlMs,
  });
}

/**
 * Menginvalidasi cache berdasarkan key eksak atau prefix.
 */
export function cacheInvalidate(prefixOrKey: string): void {
  for (const k of Array.from(cacheStore.keys())) {
    if (k === prefixOrKey || k.startsWith(prefixOrKey)) {
      cacheStore.delete(k);
    }
  }
}

/**
 * Membersihkan seluruh cache memori server.
 */
export function cacheClearAll(): void {
  cacheStore.clear();
}
