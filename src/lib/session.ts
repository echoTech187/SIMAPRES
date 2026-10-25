// SIMAPRES 110 - Server-Side Session & Cookie Helpers
import { cookies } from 'next/headers';
import {
  SessionPayload,
  UserRole,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  signSession,
  verifySession,
} from './session-token';

export * from './session-token';

// Server Action helper to set session cookie
export async function setSessionCookie(payload: SessionPayload) {
  // Defensive guard: never store oversized data URLs in the 4KB HTTP cookie
  const safePayload = { ...payload };
  if (safePayload.avatar && safePayload.avatar.startsWith('data:')) {
    safePayload.avatar = undefined;
  }
  const token = await signSession(safePayload);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

// Server Action helper to read session cookie
export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifySession(token);
  } catch {
    return null;
  }
}

// Server Action helper to delete session cookie
export async function deleteSessionCookie() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
  } catch {}
}

// Server Action helper to touch/refresh session cookie activity
export async function touchSession(): Promise<boolean> {
  try {
    const current = await getSession();
    if (!current) return false;

    const now = Date.now();
    const refreshed: SessionPayload = {
      ...current,
      lastActiveAt: now,
      expiresAt: now + SESSION_MAX_AGE_SECONDS * 1000,
    };
    await setSessionCookie(refreshed);
    return true;
  } catch {
    return false;
  }
}

export type RequireRoleResult =
  | { authorized: true; user: SessionPayload; error?: undefined }
  | { authorized: false; user?: undefined; error: string };

/**
 * Server Action Auth Guard:
 * Memvalidasi apakah pemanggil memiliki sesi aktif dan memiliki peran (role) yang diizinkan.
 * SUPERADMIN selalu memiliki akses ke seluruh tindakan operasional.
 */
export async function requireRole(
  allowedRoles: UserRole | UserRole[] | 'ANY_LOGGED_IN'
): Promise<RequireRoleResult> {
  const session = await getSession();

  if (!session) {
    // Fallback khusus untuk automated headless scripts di environment non-production jika disetel bypass
    if (process.env.NODE_ENV !== 'production' && process.env.SIMAPRES_BYPASS_AUTH === 'true') {
      const mockRole = process.env.SIMAPRES_MOCK_ROLE ? (process.env.SIMAPRES_MOCK_ROLE as UserRole) : 'SUPERADMIN';
      return {
        authorized: true,
        user: {
          userId: '0',
          identifier: 'AUTOMATION_TESTER',
          fullName: 'System Test Automation',
          role: mockRole,
          issuedAt: Date.now(),
          expiresAt: Date.now() + 3600000,
          lastActiveAt: Date.now(),
        },
      };
    }

    return {
      authorized: false,
      error: 'Akses ditolak: Anda belum login atau sesi telah berakhir. Silakan login kembali ke konsol SIMAPRES.',
    };
  }

  if (allowedRoles === 'ANY_LOGGED_IN') {
    return { authorized: true, user: session };
  }

  const roleList = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  // SUPERADMIN selalu memiliki akses penuh ke seluruh aksi
  if (session.role === 'SUPERADMIN' || roleList.includes(session.role)) {
    return { authorized: true, user: session };
  }

  const rolesText = roleList.join(' atau ');
  return {
    authorized: false,
    error: `Akses ditolak: Tindakan ini memerlukan wewenang ${rolesText}. Wewenang Anda saat ini: ${session.role}.`,
  };
}
