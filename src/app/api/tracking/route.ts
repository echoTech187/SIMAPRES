import { NextRequest, NextResponse } from 'next/server';
import { getTrackingData } from './tracking-service';
import { verifyTrackingToken } from '@/lib/tracking-token';
import { consumeRateLimit } from '@/infrastructure/security/rate-limiter';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const forwarded = request.headers.get('x-forwarded-for');
    const clientIp = forwarded ? forwarded.split(',')[0].trim() : (request.headers.get('x-real-ip') || '127.0.0.1');
    const rateCheck = consumeRateLimit(`tracking_status:${clientIp}`, 60, 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, error: 'Terlalu banyak permintaan pemantauan. Silakan tunggu beberapa detik.' },
        { status: 429, headers: { 'Retry-After': String(rateCheck.retryAfterSec) } }
      );
    }

    const { searchParams } = new URL(request.url);
    const tiket = (searchParams.get('tiket') || searchParams.get('nomorTiket') || '').trim();
    const token = (searchParams.get('token') || searchParams.get('auth') || '').trim();

    if (!tiket) {
      return NextResponse.json({ success: false, error: 'Nomor tiket wajib diisi.' }, { status: 400 });
    }

    const cleanTiket = tiket.startsWith('#') ? tiket.slice(1) : tiket;
    const withHash = `#${cleanTiket}`;

    // Validasi token keamanan pelacakan wajib
    if (!token || !verifyTrackingToken(cleanTiket, token)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Akses ditolak: Tautan pelacakan tidak valid atau tidak memiliki token verifikasi resmi.',
          unauthorized: true,
        },
        { status: 403 }
      );
    }

    const payload = await getTrackingData(tiket, cleanTiket, withHash);
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Pengaduan tidak ditemukan.' }, { status: 404 });
    }

    const responsePayload = {
      success: true,
      data: payload,
    };

    return NextResponse.json(responsePayload, {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (err: any) {
    console.error('GET /api/tracking error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Gagal memuat status pelacakan.' },
      { status: 500 }
    );
  }
}
