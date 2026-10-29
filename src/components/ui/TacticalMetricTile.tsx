'use client';

import React from 'react';

export interface TacticalMetricTileProps {
  id?: string;
  label: string;
  value: number | string;
  sublabel?: string;
  accentColor: string;
  bgGradient?: string;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
}

/**
 * Reusable holographic metric KPI tile for dashboard summaries and status counts.
 * Provides high-contrast, responsive tactical styling with hover micro-interactions.
 */
export default function TacticalMetricTile({
  id,
  label,
  value,
  sublabel,
  accentColor,
  bgGradient,
  onClick,
  className = '',
  style,
  title,
}: TacticalMetricTileProps) {
  const isClickable = Boolean(onClick);

  return (
    <div
      id={id}
      className={`holographic-metric-tile ${className}`}
      onClick={onClick}
      title={title || (isClickable ? `Klik untuk memfilter daftar: ${label}` : undefined)}
      style={{
        cursor: isClickable ? 'pointer' : 'default',
        textAlign: 'center',
        borderTop: `3.5px solid ${accentColor}`,
        background: bgGradient || `linear-gradient(180deg, ${accentColor}12 0%, #FFFFFF 60%)`,
        padding: '12px 8px',
        borderRadius: '10px',
        transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
        userSelect: 'none',
        ...style,
      }}
    >
      <div
        style={{
          fontSize: '10px',
          fontWeight: 900,
          color: accentColor,
          letterSpacing: '0.6px',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: '26px',
          fontWeight: 900,
          color: '#0F172A',
          marginTop: '4px',
          lineHeight: 1.1,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </div>
      {sublabel && (
        <div
          style={{
            fontSize: '9.5px',
            color: '#64748B',
            fontWeight: 700,
            marginTop: '4px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {sublabel}
        </div>
      )}
    </div>
  );
}
