import { describe, it, expect } from 'vitest';
import { signSession, verifySession, SessionPayload } from '../session-token';

describe('Cryptographic Session Token (Web Crypto HMAC-SHA256)', () => {
  const createMockPayload = (overrides?: Partial<SessionPayload>): SessionPayload => ({
    userId: '10',
    identifier: '88012345',
    fullName: 'Aipda Joko Widodo',
    role: 'PAWAS',
    stationId: '60001',
    stationName: 'Polres Pekalongan',
    issuedAt: Date.now(),
    expiresAt: Date.now() + 3600 * 1000, // 1 hour ahead
    lastActiveAt: Date.now(),
    ...overrides,
  });

  it('signs and verifies a valid cryptographic session token', async () => {
    const payload = createMockPayload();
    const token = await signSession(payload);

    expect(token).toBeDefined();
    expect(token).toContain('.');

    const verified = await verifySession(token);
    expect(verified).not.toBeNull();
    expect(verified?.userId).toBe('10');
    expect(verified?.identifier).toBe('88012345');
    expect(verified?.role).toBe('PAWAS');
    expect(verified?.stationName).toBe('Polres Pekalongan');
  });

  it('rejects tampered token where payload has been modified', async () => {
    const payload = createMockPayload({ role: 'PERSONIL' });
    const token = await signSession(payload);

    const [b64Payload, hexSig] = token.split('.');
    // Ubah isi payload (misal attacker mencoba eskalasi privilese menjadi SUPERADMIN)
    const tamperedPayload = Buffer.from(
      JSON.stringify({ ...payload, role: 'SUPERADMIN' })
    )
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const tamperedToken = `${tamperedPayload}.${hexSig}`;
    const verified = await verifySession(tamperedToken);

    expect(verified).toBeNull();
  });

  it('rejects tampered token with invalid signature', async () => {
    const payload = createMockPayload();
    const token = await signSession(payload);

    const [b64Payload] = token.split('.');
    const invalidToken = `${b64Payload}.0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef`;

    const verified = await verifySession(invalidToken);
    expect(verified).toBeNull();
  });

  it('rejects expired session token', async () => {
    const expiredPayload = createMockPayload({
      issuedAt: Date.now() - 7200 * 1000,
      expiresAt: Date.now() - 3600 * 1000, // Expired 1 hour ago
      lastActiveAt: Date.now() - 3600 * 1000,
    });
    const token = await signSession(expiredPayload);

    // Default: validateExpiry is true -> harus ditolak
    const verified = await verifySession(token, true);
    expect(verified).toBeNull();

    // Jika validateExpiry is false -> payload masih bisa dibaca untuk audit
    const unvalidated = await verifySession(token, false);
    expect(unvalidated).not.toBeNull();
    expect(unvalidated?.identifier).toBe('88012345');
  });

  it('handles malformed token strings without throwing unhandled exceptions', async () => {
    expect(await verifySession('')).toBeNull();
    expect(await verifySession('bukan-token')).toBeNull();
    expect(await verifySession('invalid.token.structure')).toBeNull();
  });
});
