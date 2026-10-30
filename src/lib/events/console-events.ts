import { EventEmitter } from 'events';

export type ConsoleEventType =
  | 'NEW_COMPLAINT'
  | 'COMPLAINT_UPDATED'
  | 'DISPATCH_UPDATED'
  | 'TELEMETRY_UPDATED'
  | 'FORCE_REFRESH';

export interface ConsoleEventPayload {
  type: ConsoleEventType;
  timestamp: number;
  stationId?: number | string;
  complaintId?: number | string;
  data?: any;
}

// Singleton event emitter across Next.js dev server & production runtime
declare global {
  // eslint-disable-next-line no-var
  var __simopmasConsoleEventEmitter: EventEmitter | undefined;
}

function getConsoleEventEmitter(): EventEmitter {
  if (!globalThis.__simopmasConsoleEventEmitter) {
    const emitter = new EventEmitter();
    emitter.setMaxListeners(200); // Allow multiple open dashboard tabs
    globalThis.__simopmasConsoleEventEmitter = emitter;
  }
  return globalThis.__simopmasConsoleEventEmitter;
}

export const consoleEventEmitter = getConsoleEventEmitter();

export function broadcastConsoleEvent(payload: Omit<ConsoleEventPayload, 'timestamp'>) {
  try {
    const fullPayload: ConsoleEventPayload = {
      ...payload,
      timestamp: Date.now(),
    };
    consoleEventEmitter.emit('console_event', fullPayload);
  } catch (err) {
    console.warn('[SSE] Gagal broadcast console event:', err);
  }
}

export function subscribeConsoleEvents(listener: (payload: ConsoleEventPayload) => void): () => void {
  const emitter = getConsoleEventEmitter();
  emitter.on('console_event', listener);
  return () => {
    emitter.off('console_event', listener);
  };
}
