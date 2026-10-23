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
const inFlight = new Map<string, Promise<any>>();
const MAX_CACHE_ENTRIES = 500;
let invalidationEpoch = 0;

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
  if (cacheStore.size >= MAX_CACHE_ENTRIES && !cacheStore.has(key)) {
    const now = Date.now();
    for (const [k, v] of cacheStore) {
      if (v.expiresAt < now) cacheStore.delete(k);
    }
    if (cacheStore.size >= MAX_CACHE_ENTRIES) {
      const oldestKey = cacheStore.keys().next().value;
      if (oldestKey !== undefined) cacheStore.delete(oldestKey);
    }
  }
  cacheStore.set(key, {
    data,
    expiresAt: Date.now() + ttlMs,
  });
}

/**
 * Ambil dari cache; jika kosong jalankan loader sekali saja walau dipanggil bersamaan (single-flight).
 */
export async function cacheGetOrLoad<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
  const hit = cacheGet<T>(key);
  if (hit !== null) return hit;
  const pending = inFlight.get(key);
  if (pending) return pending as Promise<T>;
  const startEpoch = invalidationEpoch;
  const p = loader()
    .then((data) => {
      if (data !== null && data !== undefined && startEpoch === invalidationEpoch) cacheSet(key, data, ttlMs);
      return data;
    })
    .finally(() => inFlight.delete(key));
  inFlight.set(key, p);
  return p;
}

/**
 * Menginvalidasi cache berdasarkan key eksak atau prefix.
 */
export function cacheInvalidate(prefixOrKey: string): void {
  invalidationEpoch++;
  for (const k of Array.from(inFlight.keys())) {
    if (k === prefixOrKey || k.startsWith(prefixOrKey)) inFlight.delete(k);
  }
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
  invalidationEpoch++;
  inFlight.clear();
  cacheStore.clear();
}
