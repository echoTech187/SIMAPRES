'use client';

import React from 'react';
import { AlertCircle, AlertTriangle, Info, CheckCircle2, X } from 'lucide-react';

export type TacticalAlertVariant = 'error' | 'warning' | 'info' | 'success';

export interface TacticalAlertProps {
  variant?: TacticalAlertVariant;
  title?: React.ReactNode;
  message?: React.ReactNode;
  children?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  id?: string;
  onClose?: () => void;
}

const VARIANT_STYLES: Record<
  TacticalAlertVariant,
  {
    container: string;
    title: string;
    defaultIcon: React.ReactNode;
  }
> = {
  error: {
    container: 'bg-rose-500/15 border-rose-500/35 text-rose-200',
    title: 'text-rose-300 font-bold',
    defaultIcon: <AlertCircle size={16} className="text-rose-400 flex-shrink-0 mt-0.5" />,
  },
  warning: {
    container: 'bg-amber-500/15 border-amber-500/35 text-amber-200',
    title: 'text-amber-300 font-bold',
    defaultIcon: <AlertTriangle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />,
  },
  info: {
    container: 'bg-sky-500/15 border-sky-500/35 text-sky-200',
    title: 'text-sky-300 font-bold',
    defaultIcon: <Info size={16} className="text-sky-400 flex-shrink-0 mt-0.5" />,
  },
  success: {
    container: 'bg-emerald-500/15 border-emerald-500/35 text-emerald-200',
    title: 'text-emerald-300 font-bold',
    defaultIcon: <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />,
  },
};

export default function TacticalAlert({
  variant = 'info',
  title,
  message,
  children,
  icon,
  className = '',
  id,
  onClose,
}: TacticalAlertProps) {
  // Bila tidak ada konten yang ditampilkan, jangan render apa pun
  if (!message && !title && !children) {
    return null;
  }

  const currentVariant = VARIANT_STYLES[variant] || VARIANT_STYLES.info;
  const renderedIcon = icon !== undefined ? icon : currentVariant.defaultIcon;

  return (
    <div
      id={id}
      role="alert"
      className={`p-3 rounded-xl border backdrop-blur-sm text-xs flex items-start gap-2.5 transition-all animate-fadeIn ${currentVariant.container} ${className}`}
    >
      {renderedIcon}
      <div className="flex-1 min-w-0 space-y-0.5">
        {title && <div className={`text-[12px] leading-tight ${currentVariant.title}`}>{title}</div>}
        {message && <div className="leading-relaxed text-[11.5px] break-words">{message}</div>}
        {children}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-white transition-colors p-0.5 -mr-1 -mt-0.5 rounded-lg hover:bg-white/10"
          aria-label="Tutup pemberitahuan"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
