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
  let intervalId: NodeJS.Timeout | null = null;

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
          const sig = `${nc.status}_${nc.tahap}_${nc.dispatches?.length || 0}_${nc.dispatches?.[0]?.departedAt || ''}_${nc.dispatches?.[0]?.arrivedAt || ''}_${nc.dispatches?.[0]?.officer?.currentGpsLat || ''}_${nc.dispatches?.[0]?.officer?.currentGpsLng || ''}`;
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
          const isDone =
            ['PENANGANAN_SELESAI', 'MENUNGGU_PENGESAHAN', 'SELESAI', 'VALIDASI_SELESAI', 'DITUTUP'].includes(
              statusUpper
            ) || nc.tahap >= 5;

          if (isDone) {
            setTimeout(() => {
              if (!isClosed) {
                isClosed = true;
                if (intervalId) clearInterval(intervalId);
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

      // 1. Initial push immediately
      await checkAndUpdate();

      // 2. Server-side check every 4 seconds (one persistent connection, zero polling requests on client!)
      intervalId = setInterval(checkAndUpdate, 4000);
    },
    cancel() {
      isClosed = true;
      if (intervalId) clearInterval(intervalId);
    },
  });

  request.signal.addEventListener('abort', () => {
    isClosed = true;
    if (intervalId) clearInterval(intervalId);
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
