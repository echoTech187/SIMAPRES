'use client';

import { useEffect, useRef } from 'react';
import type { ConsoleEventPayload } from '@/lib/events/console-events';

interface UseConsoleEventSourceOptions {
  stationId?: number | string;
  enabled?: boolean;
  onEvent?: (event: ConsoleEventPayload) => void;
}

export function useConsoleEventSource({
  stationId,
  enabled = true,
  onEvent,
}: UseConsoleEventSourceOptions) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    let es: EventSource | null = null;
    let reconnectTimer: NodeJS.Timeout | null = null;
    let isUnmounted = false;

    const connect = () => {
      if (isUnmounted) return;

      const url = stationId
        ? `/api/console/events?stationId=${encodeURIComponent(String(stationId))}`
        : '/api/console/events';

      es = new EventSource(url);

      es.addEventListener('console_update', (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data) as ConsoleEventPayload;
          if (onEventRef.current) {
            onEventRef.current(payload);
          }
        } catch (err) {
          console.warn('[SSE] Error parsing console event payload:', err);
        }
      });

      es.onerror = () => {
        if (es) {
          es.close();
          es = null;
        }
        // Auto-reconnect after 5 seconds if connection was interrupted
        if (!isUnmounted && !reconnectTimer) {
          reconnectTimer = setTimeout(() => {
            reconnectTimer = null;
            connect();
          }, 5000);
        }
      };
    };

    connect();

    return () => {
      isUnmounted = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (es) {
        es.close();
        es = null;
      }
    };
  }, [stationId, enabled]);
}
