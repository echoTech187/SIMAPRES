import crypto from 'crypto';

/**
 * Utilitas Token Verifikasi Server untuk Link Tracking Warga (SIMAPRES 110)
 * Mencegah manipulasi nomor tiket publik dan mengamankan akses data pelacakan.
 */

const TRACKING_SECRET =
  process.env.SESSION_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  'simapres-tracking-secure-token-salt-2026';

export function generateTrackingToken(ticketNo: string): string {
  const clean = ticketNo.replace(/^#+/, '').trim();
  return crypto
    .createHmac('sha256', TRACKING_SECRET)
    .update(`simapres_track:${clean}`)
    .digest('hex')
    .slice(0, 16);
}

export function verifyTrackingToken(ticketNo: string, token: string): boolean {
  if (!token || !ticketNo) return false;
  const expected = generateTrackingToken(ticketNo);
  try {
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  } catch {
    return false;
  }
}
