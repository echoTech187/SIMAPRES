import React from 'react';

interface BrandIdentityProps {
  logoSize?: number;
  showSubtitle?: boolean;
  showBadge?: boolean;
  badgeText?: string;
  titleText?: string;
  subtitleText?: string;
  className?: string;
}

export default function BrandIdentity({
  showSubtitle = true,
  showBadge = true,
  badgeText = 'PRESISI',
  titleText = 'SIMOPMAS 110',
  subtitleText = 'Sistem Monitoring Polisi Bersama Masyarakat',
  className = '',
}: BrandIdentityProps) {
  return (
    <div className={`flex items-center gap-2.5 sm:gap-3 ${className}`}>
      <div className="w-12 h-12 flex-shrink-0">
        <img
          src="/logo_simopmas.png"
          alt={`Logo ${titleText}`}
          className="w-full h-full object-contain"
        />
      </div>
      <div>
        <div className="text-xs sm:text-sm font-extrabold tracking-wide uppercase text-amber-300 leading-tight flex items-center gap-2">
          <span>{titleText}</span>
          {showBadge && (
            <span className="text-[9.5px] font-semibold px-2 py-0.2 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30 hidden sm:inline">
              {badgeText}
            </span>
          )}
        </div>
        {showSubtitle && (
          <div className="text-[10.5px] text-slate-400 hidden sm:block">
            {subtitleText}
          </div>
        )}
      </div>
    </div>
  );
}
