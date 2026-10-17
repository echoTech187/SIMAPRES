// SIMAPRES 110 - Server-Side Session & Cookie Helpers
import { cookies } from 'next/headers';
import {
  SessionPayload,
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
  const cookieStore = cookies();
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
    const cookieStore = cookies();
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
    const cookieStore = cookies();
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
