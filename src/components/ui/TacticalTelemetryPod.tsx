'use client';

import React from 'react';

export interface TacticalTelemetryPodProps {
  id?: string;
  icon: React.ComponentType<{ size?: number | string; color?: string; className?: string; strokeWidth?: number | string }>;
  iconBgColor: string;
  iconColor: string;
  title: string;
  subtitle: string;
  count: number | string;
  badgeLabel: string;
  badgeColor: string;
  podBg: string;
  podBorder: string;
  action?: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
}

/**
 * Reusable Telemetry Unit Pod for Dashboard and Fleet monitoring.
 * Displays vehicle/unit categories, counts, status badges, and optional micro-actions.
 */
export default function TacticalTelemetryPod({
  id,
  icon: Icon,
  iconBgColor,
  iconColor,
  title,
  subtitle,
  count,
  badgeLabel,
  badgeColor,
  podBg,
  podBorder,
  action,
  onClick,
  style,
}: TacticalTelemetryPodProps) {
  return (
    <div
      id={id}
      onClick={onClick}
      style={{
        background: podBg,
        border: `1.5px solid ${podBorder}`,
        borderRadius: '12px',
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px',
        transition: 'all 0.15s ease',
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: iconBgColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon size={18} color={iconColor} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: '12.5px',
              fontWeight: 800,
              color: '#1E293B',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: '10.5px',
              color: '#64748B',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {subtitle}
          </div>
          {action && <div style={{ marginTop: '2px' }}>{action}</div>}
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div
          style={{
            fontSize: '20px',
            fontWeight: 900,
            color: badgeColor,
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {count}
        </div>
        <div
          style={{
            fontSize: '9.5px',
            color: badgeColor,
            fontWeight: 800,
            marginTop: '2px',
            letterSpacing: '0.2px',
          }}
        >
          {badgeLabel}
        </div>
      </div>
    </div>
  );
}
