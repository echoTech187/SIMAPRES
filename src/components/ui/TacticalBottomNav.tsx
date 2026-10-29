'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface TacticalBottomNavItem {
  id: string;
  tabId: string;
  label: string;
  icon: React.ComponentType<{ size?: number | string; strokeWidth?: number | string; className?: string; color?: string }>;
  badge?: number;
  isCenterAction?: boolean;
  title?: string;
}

export interface TacticalBottomNavProps {
  items: TacticalBottomNavItem[];
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  className?: string;
  id?: string;
}

/**
 * Reusable Mobile & Tablet Bottom Navigation Bar.
 * Standardizes bottom docking navigation with support for elevated center action button,
 * active indicator states, and notification badges.
 */
export default function TacticalBottomNav({
  items,
  activeTab,
  onSelectTab,
  className = '',
  id,
}: TacticalBottomNavProps) {
  return (
    <nav id={id} className={`bottom-nav pawas-bottom-nav ${className}`}>
      {items.map((item) => {
        const isActive = activeTab === item.tabId;
        const Icon = item.icon;

        if (item.isCenterAction) {
          return (
            <div
              key={item.id}
              id={item.id}
              className={`nav-item nav-item-center ${isActive ? 'active' : ''}`}
              onClick={() => onSelectTab(item.tabId)}
              title={item.title || item.label}
            >
              <div className="nav-center-btn">
                <Icon size={23} color="#FFFFFF" strokeWidth={2.4} />
              </div>
            </div>
          );
        }

        return (
          <div
            key={item.id}
            id={item.id}
            className={`nav-item ${isActive ? 'active' : ''}`}
            onClick={() => onSelectTab(item.tabId)}
            title={item.title || item.label}
          >
            <span className="nav-icon" style={{ position: 'relative' }}>
              <Icon size={20} strokeWidth={isActive ? 2.4 : 1.8} />
              {typeof item.badge === 'number' && item.badge > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-6px',
                    background: '#EF4444',
                    color: '#FFFFFF',
                    fontSize: '9px',
                    fontWeight: 900,
                    borderRadius: '10px',
                    padding: '1px 5px',
                    lineHeight: 1,
                  }}
                >
                  {item.badge}
                </span>
              )}
            </span>
            <span className="nav-label">{item.label}</span>
          </div>
        );
      })}
    </nav>
  );
}
