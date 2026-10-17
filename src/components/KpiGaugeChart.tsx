'use client';

import React from 'react';

interface KpiGaugeChartProps {
  score?: number;
  label?: string;
  subtext?: string;
}

export default function KpiGaugeChart({
  score = 0,
  label,
  subtext = 'Capaian Target Respon & Standar SOP Presisi',
}: KpiGaugeChartProps) {
  // Pure SVG Half-circle gauge matching prototype exactly, 100% SSR & hydration safe
  const numericScore = typeof score === 'number' && !isNaN(score) ? score : 0;
  const radius = 70;
  const strokeWidth = 14;
  const circumference = Math.PI * radius; // Half-circle arc length (~219.91)
  const offset = circumference * (1 - Math.min(100, Math.max(0, numericScore)) / 100);
  const displayLabel = label || `${Math.round(numericScore)}%`;

  return (
    <div
      className="gauge-container"
      style={{
        position: 'relative',
        width: '100%',
        height: '110px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg
        width="190"
        height="105"
        viewBox="0 0 190 105"
        style={{ overflow: 'visible' }}
      >
        {/* Background Arc (Gray) */}
        <path
          d="M 25 95 A 70 70 0 0 1 165 95"
          fill="none"
          stroke="#E2E8F0"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Foreground Progress Arc (Green #10B981) */}
        <path
          d="M 25 95 A 70 70 0 0 1 165 95"
          fill="none"
          stroke="#10B981"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 0.8s ease-in-out',
          }}
        />
      </svg>
      {/* Central Score Text */}
      <div
        id="gauge1-text"
        style={{
          position: 'absolute',
          top: '56%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '26px',
          fontWeight: 900,
          color: '#1E293B',
          letterSpacing: '-0.5px',
        }}
      >
        {displayLabel}
      </div>
    </div>
  );
}
