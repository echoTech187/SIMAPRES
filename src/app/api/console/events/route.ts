import { NextRequest } from 'next/server';
import { subscribeConsoleEvents, type ConsoleEventPayload } from '@/lib/events/console-events';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const clientStationId = searchParams.get('stationId') || '';

  let isClosed = false;
  let unsubscribe: (() => void) | null = null;
  let pingInterval: NodeJS.Timeout | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const sendRaw = (text: string) => {
        if (isClosed) return;
        try {
          controller.enqueue(encoder.encode(text));
        } catch (_) {
          isClosed = true;
        }
      };

      const sendEvent = (event: string, data: any) => {
        sendRaw(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      };

      // 1. Kirim pesan handshake awal saat koneksi SSE berhasil tersambung
      sendEvent('connected', {
        status: 'CONNECTED',
        stationId: clientStationId || 'ALL',
        timestamp: Date.now(),
      });

      // 2. Berlangganan event internal SIMAPRES
      unsubscribe = subscribeConsoleEvents((payload: ConsoleEventPayload) => {
        if (isClosed) return;

        // Filter stasiun jika spesifik (event tanpa stationId berarti global broadcast)
        if (
          clientStationId &&
          payload.stationId &&
          String(payload.stationId) !== String(clientStationId)
        ) {
          return;
        }

        sendEvent('console_update', payload);
      });

      // 3. Heartbeat ping setiap 20 detik agar koneksi tetap hidup melalui proxy/firewall
      pingInterval = setInterval(() => {
        if (isClosed) {
          if (pingInterval) clearInterval(pingInterval);
          return;
        }
        sendRaw(': ping\n\n');
      }, 20000);
    },
    cancel() {
      isClosed = true;
      if (unsubscribe) unsubscribe();
      if (pingInterval) clearInterval(pingInterval);
    },
  });

  request.signal.addEventListener('abort', () => {
    isClosed = true;
    if (unsubscribe) unsubscribe();
    if (pingInterval) clearInterval(pingInterval);
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
