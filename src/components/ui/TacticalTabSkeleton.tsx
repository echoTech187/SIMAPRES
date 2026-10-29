import React from 'react';

interface TacticalTabSkeletonProps {
  message?: string;
  badge?: string;
}

export function TacticalTabSkeleton({
  message = 'Memuat modul taktis presisi...',
  badge = 'MEMUAT MODUL',
}: TacticalTabSkeletonProps) {
  return (
    <div className="w-full min-h-[420px] p-6 rounded-2xl bg-slate-900/40 border border-slate-700/50 backdrop-blur-md flex flex-col items-center justify-center space-y-4 animate-pulse">
      <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono font-medium tracking-wider uppercase">
        <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
        <span>{badge}</span>
      </div>
      <div className="w-48 h-3 rounded-full bg-slate-700/60" />
      <p className="text-slate-400 text-sm font-medium">{message}</p>
      <div className="w-full max-w-md grid grid-cols-3 gap-3 pt-4">
        <div className="h-16 rounded-xl bg-slate-800/60 border border-slate-700/30" />
        <div className="h-16 rounded-xl bg-slate-800/60 border border-slate-700/30" />
        <div className="h-16 rounded-xl bg-slate-800/60 border border-slate-700/30" />
      </div>
    </div>
  );
}

export default TacticalTabSkeleton;
