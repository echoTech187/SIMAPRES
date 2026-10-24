import { NextRequest } from 'next/server';
import { getTrackingData } from '../tracking-service';
import { verifyTrackingToken } from '@/lib/tracking-token';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tiket = (searchParams.get('tiket') || searchParams.get('nomorTiket') || '').trim();
  const token = (searchParams.get('token') || searchParams.get('auth') || '').trim();

  if (!tiket) {
    return new Response('Nomor tiket wajib diisi', { status: 400 });
  }

  const cleanTiket = tiket.startsWith('#') ? tiket.slice(1) : tiket;
  const withHash = `#${cleanTiket}`;

  // Validasi token keamanan pelacakan wajib
  if (!token || !verifyTrackingToken(cleanTiket, token)) {
    return new Response(
      JSON.stringify({
        error: 'Akses ditolak: Tautan pelacakan wajib menyertakan token verifikasi keamanan resmi.',
        unauthorized: true,
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  let isClosed = false;
  let timerId: ReturnType<typeof setTimeout> | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const sendEvent = (event: string, data: any) => {
        if (isClosed) return;
        try {
          const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        } catch (_) {
          isClosed = true;
        }
      };

      const sendPing = () => {
        if (isClosed) return;
        try {
          controller.enqueue(encoder.encode(': ping\n\n'));
        } catch (_) {
          isClosed = true;
        }
      };

      let lastSignature = '';
      let lastChatCount = -1;

      const checkAndUpdate = async () => {
        if (isClosed) return;
        try {
          const payload = await getTrackingData(tiket, cleanTiket, withHash);
          if (!payload) {
            sendEvent('not_found', { error: 'Tiket tidak ditemukan' });
            return;
          }

          const nc = payload.complaint;
          const dispatchSigs = (nc.dispatches || [])
            .map(
              (d: any) =>
                `${d.id}_${d.dispatchStatus || d.dispatch_status}_${d.acceptedAt || d.accepted_at || ''}_${d.departedAt || d.departed_at || ''}_${d.arrivedAt || d.arrived_at || ''}_${d.completedAt || d.completed_at || ''}_${d.officer?.id || ''}_${d.officer?.currentGpsLat || ''}_${d.officer?.currentGpsLng || ''}`
            )
            .join('|');

          const sig = `${nc.id}_${nc.status}_${nc.tahap}_${nc.waktuMeluncur || ''}_${nc.waktuTiba || ''}_${nc.selesaiAt || ''}_${nc.catatanSelesai || ''}_${nc.citizenRating || ''}_${nc.citizenReview || ''}_${dispatchSigs}`;
          const chatCount = payload.chatMessages?.length || 0;

          if (sig !== lastSignature || chatCount !== lastChatCount) {
            lastSignature = sig;
            lastChatCount = chatCount;
            sendEvent('data', payload);
          } else {
            sendPing();
          }
        } catch (_) {
          sendPing();
        }
      };

      // Cek berikutnya dijadwalkan setelah cek sebelumnya selesai (responsif 1.2s tanpa overload)
      const loop = async () => {
        await checkAndUpdate();
        if (!isClosed) timerId = setTimeout(loop, 1200);
      };
      await loop();
    },
    cancel() {
      isClosed = true;
      if (timerId) clearTimeout(timerId);
    },
  });

  request.signal.addEventListener('abort', () => {
    isClosed = true;
    if (timerId) clearTimeout(timerId);
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
