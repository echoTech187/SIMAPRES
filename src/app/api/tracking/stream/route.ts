import { NextRequest } from 'next/server';
import { getTrackingData } from '../tracking-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tiket = (searchParams.get('tiket') || searchParams.get('nomorTiket') || '').trim();

  if (!tiket) {
    return new Response('Nomor tiket wajib diisi', { status: 400 });
  }

  const cleanTiket = tiket.startsWith('#') ? tiket.slice(1) : tiket;
  const withHash = `#${cleanTiket}`;

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
          const firstDispatch = nc.dispatches?.[0];
          const sig = `${nc.status}_${nc.tahap}_${nc.dispatches?.length || 0}_${firstDispatch?.acceptedAt || firstDispatch?.accepted_at || ''}_${firstDispatch?.departedAt || ''}_${firstDispatch?.arrivedAt || ''}_${firstDispatch?.officer?.id || ''}_${firstDispatch?.officer?.currentGpsLat || ''}_${firstDispatch?.officer?.currentGpsLng || ''}`;
          const chatCount = payload.chatMessages?.length || 0;

          if (sig !== lastSignature || chatCount !== lastChatCount) {
            lastSignature = sig;
            lastChatCount = chatCount;
            sendEvent('data', payload);
          } else {
            sendPing();
          }

          // If ticket is completed, send final update and close
          const statusUpper = (nc.status || '').toUpperCase();
          const isDone = statusUpper === 'SELESAI' || statusUpper === 'MENUNGGU_PENGESAHAN' || Number(nc.tahap) >= 5;

          if (isDone) {
            setTimeout(() => {
              if (!isClosed) {
                isClosed = true;
                if (timerId) clearTimeout(timerId);
                try {
                  controller.close();
                } catch (_) {}
              }
            }, 800);
          }
        } catch (_) {
          sendPing();
        }
      };

      // Cek berikutnya dijadwalkan setelah cek sebelumnya selesai (tidak menumpuk saat DB lambat)
      const loop = async () => {
        await checkAndUpdate();
        if (!isClosed) timerId = setTimeout(loop, 4000);
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
