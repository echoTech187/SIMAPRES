'use client';

import React from 'react';

export type TacticalComplaintStatus =
  | 'MENUNGGU'
  | 'DISPOSISI'
  | 'MENUJU TKP'
  | 'MELUNCUR'
  | 'TIBA DI TKP'
  | 'PENANGANAN'
  | 'PROSES'
  | 'SELESAI'
  | 'DITOLAK'
  | string;

interface TacticalStatusBadgeProps {
  status: TacticalComplaintStatus;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  dot?: boolean;
}

export function TacticalStatusBadge({
  status,
  size = 'md',
  className = '',
  dot = true,
}: TacticalStatusBadgeProps) {
  const normStatus = (status || '').toUpperCase().trim();

  let colorClasses = 'bg-slate-500/10 text-slate-400 border-slate-500/20';
  let dotColor = 'bg-slate-400';

  if (normStatus.includes('TOLAK') || normStatus === 'DITOLAK') {
    colorClasses = 'bg-rose-500/15 text-rose-500 border-rose-500/30';
    dotColor = 'bg-rose-500';
  } else if (normStatus.includes('SELESAI') || normStatus === 'CLOSED') {
    colorClasses = 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30';
    dotColor = 'bg-emerald-500';
  } else if (normStatus.includes('MENUNGGU') || normStatus === 'BARU' || normStatus === 'PENDING') {
    colorClasses = 'bg-amber-500/15 text-amber-600 border-amber-500/30';
    dotColor = 'bg-amber-500';
  } else if (normStatus.includes('DISPOSISI')) {
    colorClasses = 'bg-blue-500/15 text-blue-600 border-blue-500/30';
    dotColor = 'bg-blue-500';
  } else if (normStatus.includes('TKP') || normStatus.includes('MELUNCUR') || normStatus.includes('TIBA')) {
    colorClasses = 'bg-indigo-500/15 text-indigo-600 border-indigo-500/30';
    dotColor = 'bg-indigo-500';
  } else if (normStatus.includes('PROSES') || normStatus.includes('PENANGANAN')) {
    colorClasses = 'bg-cyan-500/15 text-cyan-600 border-cyan-500/30';
    dotColor = 'bg-cyan-500';
  }

  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-[10px]'
      : size === 'lg'
      ? 'px-3.5 py-1.5 text-xs'
      : 'px-2.5 py-1 text-[11px]';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold tracking-wider uppercase rounded-full border ${sizeClasses} ${colorClasses} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />}
      <span>{status || 'MENUNGGU'}</span>
    </span>
  );
}

export default TacticalStatusBadge;
