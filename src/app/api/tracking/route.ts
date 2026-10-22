import { NextRequest, NextResponse } from 'next/server';
import { getTrackingData } from './tracking-service';

export const dynamic = 'force-dynamic';

interface CacheEntry {
  expiresAt: number;
  data: any;
}
const trackingCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 2000;

function pruneCache() {
  const now = Date.now();
  if (trackingCache.size > 150) {
    for (const [k, v] of trackingCache.entries()) {
      if (v.expiresAt < now) trackingCache.delete(k);
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tiket = (searchParams.get('tiket') || searchParams.get('nomorTiket') || '').trim();

    if (!tiket) {
      return NextResponse.json({ success: false, error: 'Nomor tiket wajib diisi.' }, { status: 400 });
    }

    const cleanTiket = tiket.startsWith('#') ? tiket.slice(1) : tiket;
    const withHash = `#${cleanTiket}`;

    // Check micro-cache first
    const cached = trackingCache.get(cleanTiket);
    if (cached && Date.now() < cached.expiresAt) {
      return NextResponse.json(cached.data, {
        headers: {
          'Cache-Control': 'no-store',
          'X-Simapres-Cache': 'HIT',
        },
      });
    }

    const payload = await getTrackingData(tiket, cleanTiket, withHash);
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Pengaduan tidak ditemukan.' }, { status: 404 });
    }

    const responsePayload = {
      success: true,
      data: payload,
    };

    trackingCache.set(cleanTiket, {
      expiresAt: Date.now() + CACHE_TTL_MS,
      data: responsePayload,
    });
    pruneCache();

    return NextResponse.json(responsePayload, {
      headers: {
        'Cache-Control': 'no-store',
        'X-Simapres-Cache': 'MISS',
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
