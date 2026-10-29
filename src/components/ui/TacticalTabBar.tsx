'use client';

import React from 'react';
import { TacticalTabButton } from './TacticalTabButton';

export interface TacticalTabItem {
  id: string;
  tabId: string;
  label: string;
  icon?: React.ComponentType<{ size?: number | string; strokeWidth?: number | string; className?: string; color?: string }>;
  badge?: number | string;
  badgeColor?: string;
}

export interface TacticalTabBarProps {
  tabs: TacticalTabItem[];
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  activeColor?: string;
  activeTextColor?: string;
  className?: string;
  containerClassName?: string;
}

export function TacticalTabBar({
  tabs,
  activeTab,
  onSelectTab,
  activeColor = '#153E75',
  activeTextColor = '#FFFFFF',
  className = '',
  containerClassName = '',
}: TacticalTabBarProps) {
  return (
    <div
      className={`tabs-master-wrapper pawas-desktop-tabs ${containerClassName}`}
      style={{
        background: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
        position: 'sticky',
        top: 0,
        zIndex: 90,
      }}
    >
      <div
        className={`tabs-master-scroller ${className}`}
        style={{
          maxWidth: '1440px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 16px',
          overflowX: 'auto',
          scrollbarWidth: 'none',
        }}
      >
        {tabs.map((tab) => (
          <TacticalTabButton
            key={tab.id}
            id={tab.id}
            label={tab.label}
            icon={tab.icon}
            badge={tab.badge}
            badgeColor={tab.badgeColor}
            isActive={activeTab === tab.tabId}
            onClick={() => onSelectTab(tab.tabId)}
            activeColor={activeColor}
            activeTextColor={activeTextColor}
          />
        ))}
      </div>
    </div>
  );
}

export default TacticalTabBar;
