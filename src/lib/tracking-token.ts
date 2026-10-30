import crypto from 'crypto';

/**
 * Utilitas Token Verifikasi Server untuk Link Tracking Warga (SIMAPRES 110)
 * Mencegah manipulasi nomor tiket publik dan mengamankan akses data pelacakan.
 */

const TRACKING_SECRET =
  process.env.SESSION_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  'simopmas-presisi-110-secret-key-salt-2026';

export function generateTrackingToken(ticketNo: string): string {
  const clean = ticketNo.replace(/^#+/, '').trim();
  return crypto
    .createHmac('sha256', TRACKING_SECRET)
    .update(`simopmas_track:${clean}`)
    .digest('hex')
    .slice(0, 16);
}

export function verifyTrackingToken(ticketNo: string, token: string): boolean {
  if (!token || !ticketNo) return false;
  const clean = ticketNo.replace(/^#+/, '').trim();
  const tokenTrim = token.trim();

  // Daftar variasi nomor tiket (normalisasi vs historical prefix)
  const candidates: string[] = [clean];
  if (clean.startsWith('TICKET-')) {
    candidates.push(clean.replace(/^TICKET-/, ''));
  } else {
    candidates.push(`TICKET-${clean}`);
  }
  if (clean.startsWith('TIKET-')) {
    candidates.push(`TICKET-${clean}`);
  }

  for (const candidate of candidates) {
    const expected = generateTrackingToken(candidate);
    try {
      const bufToken = Buffer.from(tokenTrim);
      const bufExpected = Buffer.from(expected);
      if (bufToken.length === bufExpected.length && crypto.timingSafeEqual(bufToken, bufExpected)) {
        return true;
      }
    } catch {
      // lanjut periksa variasi berikutnya
    }
  }

  return false;
}
