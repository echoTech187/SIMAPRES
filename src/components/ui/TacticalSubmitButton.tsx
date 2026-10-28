'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';
import '@/app/login.css';

interface TacticalSubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  label: string;
  icon?: React.ReactNode;
}

export default function TacticalSubmitButton({
  loading = false,
  loadingText = 'Memproses...',
  label,
  icon = <ArrowRight size={16} className="text-slate-950 stroke-[2.5]" />,
  disabled,
  className = '',
  style,
  ...rest
}: TacticalSubmitButtonProps) {
  const isButtonDisabled = disabled || loading;

  return (
    <div className="pt-2">
      <button
        type="submit"
        disabled={isButtonDisabled}
        className={`btn-tactical-submit ${className}`}
        style={{
          opacity: isButtonDisabled ? 0.75 : 1,
          cursor: isButtonDisabled ? 'not-allowed' : 'pointer',
          ...style,
        }}
        {...rest}
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            <span>{loadingText}</span>
          </>
        ) : (
          <>
            <span>{label}</span>
            {icon}
          </>
        )}
      </button>
    </div>
  );
}
