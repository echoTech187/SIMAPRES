'use client';

import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface LiveOperationalClockProps {
  statusBadgeText?: string;
  showStatusBadge?: boolean;
  className?: string;
}

export default function LiveOperationalClock({
  statusBadgeText = 'Piket SPKT Terbuka',
  showStatusBadge = true,
  className = '',
}: LiveOperationalClockProps) {
  const [liveWib, setLiveWib] = useState<string>('');

  // Isolasi interval timer di komponen ini sendiri agar tidak memicu re-render ke komponen induk
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLiveWib(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }) + ' WIB'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`flex items-center gap-2 sm:gap-3 font-mono text-[11px] text-slate-400 ${className}`}
    >
      {showStatusBadge && (
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/5 border border-white/5 text-[10.5px] text-slate-300">
          <span className="live-beacon" />
          <span>{statusBadgeText}</span>
        </div>
      )}
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-300 font-bold text-[10.5px] sm:text-[11px]">
        <Clock size={12} className="text-amber-400" />
        <span>{liveWib || 'Memuat...'}</span>
      </div>
    </div>
  );
}
