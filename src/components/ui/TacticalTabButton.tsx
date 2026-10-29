'use client';

import React from 'react';

export interface TacticalTabButtonProps {
  id: string;
  label: string;
  icon?: React.ComponentType<{ size?: number | string; strokeWidth?: number | string; className?: string; color?: string }>;
  isActive: boolean;
  onClick: () => void;
  badge?: number | string;
  badgeColor?: string;
  activeColor?: string;
  activeTextColor?: string;
  className?: string;
}

export function TacticalTabButton({
  id,
  label,
  icon: Icon,
  isActive,
  onClick,
  badge,
  badgeColor,
  activeColor = '#153E75',
  activeTextColor = '#FFFFFF',
  className = '',
}: TacticalTabButtonProps) {
  const hasBadge = badge !== undefined && badge !== null && (typeof badge === 'number' ? badge > 0 : badge !== '');

  return (
    <button
      type="button"
      id={id}
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[12.5px] font-bold whitespace-nowrap transition-all duration-150 cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-offset-1 ${className}`}
      style={{
        background: isActive ? activeColor : '#F8FAFC',
        color: isActive ? activeTextColor : '#475569',
        border: isActive ? `1px solid ${activeColor}` : '1px solid #E2E8F0',
        boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
      }}
    >
      {Icon && <Icon size={15} strokeWidth={2.2} />}
      <span>{label}</span>
      {hasBadge && (
        <span
          className="text-[10.5px] font-extrabold px-1.5 py-0.5 rounded-full leading-none tracking-tight text-white"
          style={{
            backgroundColor: badgeColor || (isActive ? '#EF4444' : '#DC2626'),
          }}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

export default TacticalTabButton;
