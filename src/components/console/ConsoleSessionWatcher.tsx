'use client';

import { useSessionGuard } from '@/hooks/useSessionGuard';

export default function ConsoleSessionWatcher({ session }: { session?: any }) {
  useSessionGuard({ session });
  return null;
}
