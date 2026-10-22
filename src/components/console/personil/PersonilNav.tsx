'use client';

import React from 'react';
import { Home, Map, User } from 'lucide-react';
import type { PersonilTab } from './types';

interface PersonilNavProps {
  activeTab: PersonilTab;
  onTabChange: (tab: PersonilTab) => void;
  hasActiveMission?: boolean;
}

export default function PersonilNav({
  activeTab,
  onTabChange,
  hasActiveMission = false,
}: PersonilNavProps) {
  const navItems = [
    {
      id: 'beranda' as PersonilTab,
      label: 'Beranda',
      icon: Home,
    },
    {
      id: 'peta' as PersonilTab,
      label: 'Maps',
      icon: Map,
      badge: hasActiveMission ? 'MISI' : undefined,
    },
    {
      id: 'profil' as PersonilTab,
      label: 'Profile',
      icon: User,
    },
  ];

  return (
    <nav
      id="personil-bottom-nav"
      aria-label="Navigasi Personil"
      className="md:hidden fixed bottom-0 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div
        className="flex items-center justify-between gap-1 px-1.5 sm:px-2 py-1.5 sm:py-2 rounded-t-2xl backdrop-blur-2xl transition-all duration-300"
        style={{
          background: 'rgba(15, 17, 24, 0.95)',
          border: '1.5px solid rgba(236, 196, 115, 0.35)',
          boxShadow:
            '0 12px 36px -4px rgba(0, 0, 0, 0.85), 0 0 24px rgba(236, 196, 115, 0.15)',
        }}
      >
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              className={`flex-1 relative flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 transition-all duration-300 ${
                isActive
                  ? 'text-amber-300 font-black'
                  : 'text-slate-400 font-bold hover:text-amber-200/80 active:scale-95'
              }`}
              style={{
                background: isActive
                  ? 'transparent'
                  : 'transparent',
                border: isActive
                  ? '1px solid transparent'
                  : '1px solid transparent',
                boxShadow: isActive
                  ? 'none'
                  : 'none',
              }}
            >
              <div className="relative">
                <Icon
                  size={19}
                  strokeWidth={isActive ? 2.5 : 1.8}
                  className={`transition-transform duration-200 ${
                    isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(236,196,115,0.6)]' : ''
                  }`}
                />
                {item.badge && (
                  <span
                    className="absolute -top-1.5 -right-3 text-[8px] font-black px-1.5 py-0.2 rounded-full uppercase tracking-tighter"
                    style={{
                      background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                      color: '#FFFFFF',
                      boxShadow: '0 0 8px rgba(239, 68, 68, 0.8)',
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] sm:text-xs tracking-wide transition-all ${
                  isActive ? 'font-black tracking-wider text-[#FCD34D]' : 'font-medium'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
