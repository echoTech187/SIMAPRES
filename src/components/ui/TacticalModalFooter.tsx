'use client';

import React from 'react';
import { Send } from 'lucide-react';

export interface TacticalModalFooterProps {
  onCancel?: () => void;
  cancelText?: string;
  submitText?: string;
  loadingText?: string;
  isSubmitting?: boolean;
  disabled?: boolean;
  submitId?: string;
  submitTestId?: string;
  submitIcon?: React.ReactNode;
  submitType?: 'submit' | 'button';
  onSubmit?: () => void;
  variant?: 'gold' | 'blue' | 'emerald' | 'danger';
  className?: string;
  extraLeft?: React.ReactNode;
}

export default function TacticalModalFooter({
  onCancel,
  cancelText = 'Batal',
  submitText = 'Kirim & Simpan ➔',
  loadingText = 'Menyimpan...',
  isSubmitting = false,
  disabled = false,
  submitId = 'btn-modal-submit',
  submitTestId = 'btn-modal-submit',
  submitIcon = <Send size={14} />,
  submitType = 'submit',
  onSubmit,
  variant = 'gold',
  className = '',
  extraLeft,
}: TacticalModalFooterProps) {
  const isSubmitDisabled = disabled || isSubmitting;

  const variantStyles: Record<
    'gold' | 'blue' | 'emerald' | 'danger',
    { background: string; color: string; boxShadow: string }
  > = {
    gold: {
      background: 'linear-gradient(135deg, #ECC473 0%, #D4A346 100%)',
      color: '#0B0D12',
      boxShadow: '0 4px 14px rgba(212, 163, 70, 0.4)',
    },
    blue: {
      background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
      color: '#FFFFFF',
      boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)',
    },
    emerald: {
      background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
      color: '#FFFFFF',
      boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
    },
    danger: {
      background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
      color: '#FFFFFF',
      boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)',
    },
  };

  const activeVariant = variantStyles[variant] || variantStyles.gold;

  return (
    <div
      className={`flex items-center justify-between gap-3 pt-3.5 border-t border-white/10 ${className}`}
    >
      {/* Kolom Kiri: Informasi tambahan (misal hitungan regu, keterangan, status) */}
      <div className="flex-1 min-w-0">
        {extraLeft || null}
      </div>

      {/* Kolom Kanan: Tombol Aksi Batal & Eksekusi */}
      <div className="flex items-center justify-end gap-2.5 flex-shrink-0">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl font-bold text-xs text-slate-300 bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 transition-all disabled:opacity-50 cursor-pointer"
          >
            {cancelText}
          </button>
        )}

        <button
          id={submitId}
          data-testid={submitTestId}
          type={submitType}
          onClick={submitType === 'button' ? onSubmit : undefined}
          disabled={isSubmitDisabled}
          className="px-5 py-2.5 rounded-xl font-black text-xs transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
          style={{
            background: activeVariant.background,
            color: activeVariant.color,
            boxShadow: isSubmitDisabled ? 'none' : activeVariant.boxShadow,
          }}
        >
          {isSubmitting ? (
            <>
              <div
                className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
                style={{ color: activeVariant.color }}
              />
              <span>{loadingText}</span>
            </>
          ) : (
            <>
              {submitIcon}
              <span>{submitText}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
