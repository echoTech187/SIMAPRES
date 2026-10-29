'use client';

import React from 'react';
import HeaderProfileBadge from './HeaderProfileBadge';

export interface ConsoleTopBarProfile {
  name: string;
  identifier?: string | null;
  role: string;
  avatar?: string | null;
  isActive?: boolean;
  hasNotification?: boolean;
  onBellClick?: () => void;
  onClick?: () => void;
}

export interface ConsoleTopBarProps {
  stationName: string;
  subtitle: string;
  onBrandClick?: () => void;
  profile: ConsoleTopBarProfile;
  extraRight?: React.ReactNode;
  className?: string;
  id?: string;
}

/**
 * Reusable Unified Topbar Header for SIMOPMAS 110 Command Centers.
 * Encapsulates the official branding, dynamic station authority header, subtitle,
 * and officer profile badge with notification bells.
 */
export default function ConsoleTopBar({
  stationName,
  subtitle,
  onBrandClick,
  profile,
  extraRight,
  className = '',
  id,
}: ConsoleTopBarProps) {
  return (
    <header id={id} className={`topbar ${className}`}>
      <div
        className="topbar-brand"
        style={{ cursor: onBrandClick ? 'pointer' : 'default', textDecoration: 'none' }}
        onClick={onBrandClick}
        title={onBrandClick ? 'Kembali ke Beranda Konsol' : undefined}
      >
        <div className="brand-icon">
          <img
            src="/logo_simopmas.png"
            alt="Logo SIMOPMAS 110"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </div>
        <div>
          <div className="brand-title">
            SIMOPMAS 110 • {stationName.toUpperCase()}
          </div>
          <div className="brand-subtitle">{subtitle}</div>
        </div>
      </div>

      <div className="topbar-nav" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {extraRight}
        <HeaderProfileBadge
          name={profile.name}
          identifier={profile.identifier}
          role={profile.role}
          avatar={profile.avatar}
          isActive={profile.isActive}
          hasNotification={profile.hasNotification}
          onBellClick={profile.onBellClick}
          onClick={profile.onClick}
        />
      </div>
    </header>
  );
}
