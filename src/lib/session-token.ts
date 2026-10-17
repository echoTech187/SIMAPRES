// SIMAPRES 110 - Cryptographic Session Token (Edge & Node Compatible, No next/headers dependency)

export type UserRole = 'SUPERADMIN' | 'PAWAS' | 'PERSONIL';

export interface SessionPayload {
  userId: string;
  identifier: string; // NRP or Username
  fullName: string;
  role: UserRole;
  rankPangkat?: string;
  satuanNama?: string;
  kelompokRegu?: string;
  unitId?: string;
  avatar?: string;
  issuedAt: number; // Unix ms
  expiresAt: number; // Unix ms (issuedAt + 3600_000)
  lastActiveAt: number; // Unix ms
}

export const SESSION_COOKIE_NAME = 'simapres_session';
export const SESSION_MAX_AGE_SECONDS = 3600; // 1 hour (3600 seconds)

const SECRET_KEY = process.env.SESSION_SECRET || 'simapres-presisi-110-secret-key-salt-2026';

// Helper Web Crypto HMAC
async function getCryptoKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    enc.encode(SECRET_KEY),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

function base64UrlEncode(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

function bufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function signSession(payload: SessionPayload): Promise<string> {
  const jsonStr = JSON.stringify(payload);
  const b64Payload = base64UrlEncode(jsonStr);
  const key = await getCryptoKey();
  const enc = new TextEncoder();
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, enc.encode(b64Payload));
  const hexSig = bufferToHex(signatureBuffer);
  return `${b64Payload}.${hexSig}`;
}

export async function verifySession(token: string, validateExpiry = true): Promise<SessionPayload | null> {
  try {
    if (!token || !token.includes('.')) return null;
    const [b64Payload, hexSig] = token.split('.');
    if (!b64Payload || !hexSig) return null;

    const key = await getCryptoKey();
    const enc = new TextEncoder();
    const expectedSigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(b64Payload));
    const expectedHex = bufferToHex(expectedSigBuf);

    if (hexSig !== expectedHex) {
      return null;
    }

    const jsonStr = base64UrlDecode(b64Payload);
    const payload: SessionPayload = JSON.parse(jsonStr);

    if (!validateExpiry) {
      return payload;
    }

    const now = Date.now();
    // Cek kedaluwarsa absolut (1 jam dari issue/refresh)
    if (payload.expiresAt && now > payload.expiresAt) {
      return null;
    }

    // Cek idle standby (lebih dari 1 jam tanpa aktivitas)
    if (payload.lastActiveAt && now - payload.lastActiveAt > SESSION_MAX_AGE_SECONDS * 1000) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
