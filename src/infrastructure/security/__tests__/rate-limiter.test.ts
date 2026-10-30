import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  consumeRateLimit,
  checkRateLimit,
  resetRateLimit,
  clearAllRateLimits,
  RATE_LIMIT_CONFIG,
} from '../rate-limiter';

describe('Infrastructure Security: In-Memory Rate Limiter', () => {
  beforeEach(() => {
    clearAllRateLimits();
    vi.useRealTimers();
  });

  it('allows requests within limit and decrements remaining quota', () => {
    const key = 'test-ip-1';
    const limit = 3;
    const windowMs = 1000;

    const r1 = consumeRateLimit(key, limit, windowMs);
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(2);
    expect(r1.retryAfterSec).toBe(0);

    const r2 = consumeRateLimit(key, limit, windowMs);
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(1);

    const r3 = consumeRateLimit(key, limit, windowMs);
    expect(r3.allowed).toBe(true);
    expect(r3.remaining).toBe(0);

    // Ke-4 harus diblokir
    const r4 = consumeRateLimit(key, limit, windowMs);
    expect(r4.allowed).toBe(false);
    expect(r4.remaining).toBe(0);
    expect(r4.retryAfterSec).toBeGreaterThanOrEqual(1);
  });

  it('checkRateLimit accurately reads quota without consuming it', () => {
    const key = 'test-check-key';
    const limit = 2;
    const windowMs = 5000;

    // Check awal saat belum ada request
    const c0 = checkRateLimit(key, limit, windowMs);
    expect(c0.allowed).toBe(true);
    expect(c0.remaining).toBe(2);

    // Consume 1
    consumeRateLimit(key, limit, windowMs);

    // Check lagi -> remaining harus 1 dan tidak berkurang walau check dipanggil berulang
    const c1 = checkRateLimit(key, limit, windowMs);
    expect(c1.allowed).toBe(true);
    expect(c1.remaining).toBe(1);

    const c2 = checkRateLimit(key, limit, windowMs);
    expect(c2.allowed).toBe(true);
    expect(c2.remaining).toBe(1);

    // Consume ke-2 -> limit tercapai
    consumeRateLimit(key, limit, windowMs);

    const c3 = checkRateLimit(key, limit, windowMs);
    expect(c3.allowed).toBe(false);
    expect(c3.remaining).toBe(0);
    expect(c3.retryAfterSec).toBeGreaterThanOrEqual(1);
  });

  it('resets rate limit when resetRateLimit is called', () => {
    const key = 'test-reset-key';
    const limit = 2;
    const windowMs = 10000;

    consumeRateLimit(key, limit, windowMs);
    consumeRateLimit(key, limit, windowMs);

    // Sudah terblokir
    const blocked = consumeRateLimit(key, limit, windowMs);
    expect(blocked.allowed).toBe(false);

    // Reset dipanggil (misal setelah login berhasil)
    resetRateLimit(key);

    // Harus kembali diizinkan dengan full quota
    const fresh = consumeRateLimit(key, limit, windowMs);
    expect(fresh.allowed).toBe(true);
    expect(fresh.remaining).toBe(1);
  });

  it('isolates different keys independently', () => {
    const key1 = 'user:8801001';
    const key2 = 'user:8801002';
    const limit = 1;
    const windowMs = 5000;

    consumeRateLimit(key1, limit, windowMs);

    // key1 terblokir
    expect(consumeRateLimit(key1, limit, windowMs).allowed).toBe(false);

    // key2 tidak terpengaruh dan tetap diizinkan
    expect(consumeRateLimit(key2, limit, windowMs).allowed).toBe(true);
  });

  it('allows new requests once the sliding window has expired', () => {
    vi.useFakeTimers();
    const key = 'test-expiry';
    const limit = 1;
    const windowMs = 2000;

    consumeRateLimit(key, limit, windowMs);
    expect(consumeRateLimit(key, limit, windowMs).allowed).toBe(false);

    // Majukan waktu melewati windowMs
    vi.advanceTimersByTime(2500);

    // Harus diizinkan kembali
    const afterExpiry = consumeRateLimit(key, limit, windowMs);
    expect(afterExpiry.allowed).toBe(true);
  });
});
