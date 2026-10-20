// SIMAPRES 110 - Strict RBAC, Single Console URL & Security Middleware
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  SESSION_COOKIE_NAME,
  verifySession,
  signSession,
  SESSION_MAX_AGE_SECONDS,
} from './lib/session-token';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Lewati static assets, API calls publik, file berekstensi, favicon
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/assets') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // 2. Baca dan validasi session token dari cookie HTTP-Only
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const payload = sessionCookie ? await verifySession(sessionCookie, false) : null;
  const session = payload;

  // 3. Konsolidasi Rute Lama: Alihkan /registrasi-unit, /command-center, /personil ke Console URL
  if (pathname === '/command-center' || pathname.startsWith('/command-center/')) {
    const sub = pathname.replace('/command-center', '').replace(/^\//, '');
    return NextResponse.redirect(new URL(sub ? `/console/${sub}` : '/console', request.url));
  }

  if (pathname === '/personil' || pathname.startsWith('/personil/')) {
    const sub = pathname.replace('/personil', '').replace(/^\//, '');
    return NextResponse.redirect(new URL(sub ? `/console/${sub}` : '/console', request.url));
  }

  if (pathname === '/registrasi-unit' || pathname.startsWith('/registrasi-unit/')) {
    return NextResponse.redirect(new URL('/console', request.url));
  }

  if (pathname === '/komando-pawas' || pathname === '/komando') {
    return NextResponse.redirect(new URL('/console/komando', request.url));
  }

  if (pathname === '/buat-pengaduan' || pathname === '/buat-log') {
    return NextResponse.redirect(new URL('/console/buat-pengaduan', request.url));
  }

  // 4. Proteksi Rute /console dan semua sub-halamannya (/console/komando, /console/buat-pengaduan, dll.)
  if (pathname === '/console' || pathname.startsWith('/console/')) {
    const isActionRequest = request.headers.has('next-action') || request.method === 'POST';

    // A. Belum Login atau Cookie Tidak Valid / Rusak
    if (!session) {
      if (isActionRequest) {
        const res = NextResponse.json(
          { success: false, error: 'Sesi dinas belum terautentikasi.', unauthenticated: true },
          { status: 401 }
        );
        if (sessionCookie) {
          res.cookies.delete(SESSION_COOKIE_NAME);
        }
        return res;
      }

      const loginUrl = new URL('/', request.url);
      loginUrl.searchParams.set('alert', 'unauthenticated');
      loginUrl.searchParams.set('from', '/console');
      const res = NextResponse.redirect(loginUrl);
      if (sessionCookie) {
        res.cookies.delete(SESSION_COOKIE_NAME);
      }
      return res;
    }

    // B. Deteksi Standby / Inactivity Melebihi 1 Jam (3600 detik) atau Token Kedaluwarsa
    const now = Date.now();
    const isIdleTimeout = session.lastActiveAt && (now - session.lastActiveAt > SESSION_MAX_AGE_SECONDS * 1000);
    const isTokenExpired = session.expiresAt && (now > session.expiresAt);

    if (isIdleTimeout || isTokenExpired) {
      if (isActionRequest) {
        const res = NextResponse.json(
          { success: false, error: 'Sesi dinas telah kedaluwarsa.', unauthenticated: true },
          { status: 401 }
        );
        res.cookies.delete(SESSION_COOKIE_NAME);
        return res;
      }

      const loginUrl = new URL('/', request.url);
      loginUrl.searchParams.set('alert', 'inactivity_timeout');
      const res = NextResponse.redirect(loginUrl);
      res.cookies.delete(SESSION_COOKIE_NAME);
      return res;
    }

    // Sesi valid -> perpanjang lastActiveAt jika sudah lebih dari 2 menit berlalu (sliding session)
    const response = NextResponse.next();
    if (session.lastActiveAt && (now - session.lastActiveAt > 2 * 60 * 1000)) {
      try {
        const refreshedSession = {
          ...session,
          lastActiveAt: now,
          expiresAt: now + SESSION_MAX_AGE_SECONDS * 1000,
        };
        const newToken = await signSession(refreshedSession);
        response.cookies.set(SESSION_COOKIE_NAME, newToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: SESSION_MAX_AGE_SECONDS,
        });
      } catch (_) {}
    }

    return response;
  }

  // 5. Jika Mengunjungi Portal Masuk / Login (/)
  if (pathname === '/') {
    const hasAlert = request.nextUrl.searchParams.has('alert');
    // Jika sesi masih aktif dan user tidak sedang dalam status alert (bukan logout/timeout), auto-redirect ke /console
    if (session && !hasAlert) {
      return NextResponse.redirect(new URL('/console', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static files and images
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
