/**
 * SIMAPRES 110 - IN-MEMORY HIGH PERFORMANCE RATE LIMITER
 * 
 * Lapisan: Infrastructure / Security
 * Algoritma: Sliding Window Counter dengan Auto-Eviction
 * Karakteristik: Zero external dependencies, <0.05ms execution latency, thread-safe memory store
 */

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetMs: number;
  retryAfterSec: number;
}

export interface RateLimitEntry {
  timestamps: number[];
  expiresAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();
const MAX_RATE_LIMIT_ENTRIES = 5000;

/**
 * Pembersihan periodik data kedaluwarsa untuk mencegah kebocoran memori (memory leak).
 */
function cleanupExpiredEntries(now: number): void {
  if (rateLimitStore.size < MAX_RATE_LIMIT_ENTRIES) return;
  for (const [key, entry] of rateLimitStore) {
    if (entry.expiresAt <= now) {
      rateLimitStore.delete(key);
    }
  }
  // Jika masih penuh setelah filter, buang entri tertua (LRU-like FIFO)
  if (rateLimitStore.size >= MAX_RATE_LIMIT_ENTRIES) {
    const oldestKey = rateLimitStore.keys().next().value;
    if (oldestKey !== undefined) rateLimitStore.delete(oldestKey);
  }
}

/**
 * Konfigurasi batas kuota standar untuk kasus-kasus krusial di SIMAPRES 110
 */
export const RATE_LIMIT_CONFIG = {
  // Login: Maksimal 5x percobaan gagal per 5 menit per NRP / IP
  AUTH_LOGIN: {
    maxAttempts: 5,
    windowMs: 5 * 60 * 1000, // 5 menit
  },
  // Pengaduan Warga: Maksimal 5 laporan per 10 menit per No HP / IP
  CITIZEN_COMPLAINT: {
    maxAttempts: 5,
    windowMs: 10 * 60 * 1000, // 10 menit
  },
  // Places Autocomplete: Maksimal 30 request per menit per IP
  PLACES_SEARCH: {
    maxAttempts: 30,
    windowMs: 60 * 1000, // 1 menit
  },
  // Avatar Upload: Maksimal 5 upload per menit per user
  UPLOAD_AVATAR: {
    maxAttempts: 5,
    windowMs: 60 * 1000, // 1 menit
  },
} as const;

/**
 * Mengecek dan mengonsumsi 1 kuota untuk `key` tertentu dalam kurun waktu `windowMs`.
 * Jika kuota habis, mengembalikan allowed: false beserta sisa waktu tunggu (retryAfterSec).
 */
export function consumeRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  cleanupExpiredEntries(now);

  const windowStart = now - windowMs;
  let entry = rateLimitStore.get(key);

  if (!entry) {
    entry = {
      timestamps: [now],
      expiresAt: now + windowMs,
    };
    rateLimitStore.set(key, entry);
    return {
      allowed: true,
      limit,
      remaining: limit - 1,
      resetMs: windowMs,
      retryAfterSec: 0,
    };
  }

  // Filter timestamps yang berada dalam sliding window aktif
  const validTimestamps = entry.timestamps.filter((ts) => ts > windowStart);

  if (validTimestamps.length >= limit) {
    const oldestInWindow = validTimestamps[0];
    const resetMs = Math.max(0, oldestInWindow + windowMs - now);
    const retryAfterSec = Math.max(1, Math.ceil(resetMs / 1000));

    return {
      allowed: false,
      limit,
      remaining: 0,
      resetMs,
      retryAfterSec,
    };
  }

  validTimestamps.push(now);
  entry.timestamps = validTimestamps;
  entry.expiresAt = now + windowMs;

  return {
    allowed: true,
    limit,
    remaining: Math.max(0, limit - validTimestamps.length),
    resetMs: windowMs,
    retryAfterSec: 0,
  };
}

/**
 * Hanya mengecek kuota tanpa menambah hitungan.
 * Berguna untuk memverifikasi apakah akun/IP sedang diblokir sebelum menjalankan proses berat.
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowMs;
  const entry = rateLimitStore.get(key);

  if (!entry) {
    return {
      allowed: true,
      limit,
      remaining: limit,
      resetMs: 0,
      retryAfterSec: 0,
    };
  }

  const validTimestamps = entry.timestamps.filter((ts) => ts > windowStart);

  if (validTimestamps.length >= limit) {
    const oldestInWindow = validTimestamps[0];
    const resetMs = Math.max(0, oldestInWindow + windowMs - now);
    const retryAfterSec = Math.max(1, Math.ceil(resetMs / 1000));
    return {
      allowed: false,
      limit,
      remaining: 0,
      resetMs,
      retryAfterSec,
    };
  }

  return {
    allowed: true,
    limit,
    remaining: limit - validTimestamps.length,
    resetMs: 0,
    retryAfterSec: 0,
  };
}

/**
 * Menghapus counter rate limit (misalnya saat pengguna berhasil login dengan benar).
 */
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

/**
 * Menghapus semua data rate limit (digunakan pada suite unit test).
 */
export function clearAllRateLimits(): void {
  rateLimitStore.clear();
}

/**
 * Helper ekstraksi Client IP yang aman untuk Server Actions & Route Handlers.
 * Menghandle reverse proxy / load balancer headers tanpa menyebabkan runtime crash.
 */
export async function getClientIp(): Promise<string> {
  try {
    const { headers } = await import('next/headers');
    const headerList = await headers();
    const forwarded = headerList.get('x-forwarded-for');
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    const realIp = headerList.get('x-real-ip');
    if (realIp) return realIp.trim();
  } catch (_e) {
    // Non-request context (e.g. testing or CLI scripts)
  }
  return '127.0.0.1';
}
