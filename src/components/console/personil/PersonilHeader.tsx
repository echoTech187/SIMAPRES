'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Navigation, Home, Map, User } from 'lucide-react';
import { getOfficerInitials } from './types';
import type { OfficerProfile, PersonilTab } from './types';

interface PersonilHeaderProps {
  officer: OfficerProfile;
  taktisStatus?: string;
  onTaktisStatusChange?: (status: string) => void;
  dutyStatuses?: Array<{ key: string; label: string; }>;
  onOpenProfile?: () => void;
  activeTab?: PersonilTab;
  onTabChange?: (tab: PersonilTab) => void;
  hasActiveMission?: boolean;
  isPairedDevice?: boolean;
}

export default function PersonilHeader({
  officer,
  taktisStatus = 'siaga',
  onTaktisStatusChange,
  dutyStatuses = [],
  onOpenProfile,
  activeTab,
  onTabChange,
  hasActiveMission = false,
  isPairedDevice = false,
}: PersonilHeaderProps) {
  const [liveTime, setLiveTime] = useState<string>('');
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLiveTime(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }) + ' WIB'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    {
      id: 'beranda' as PersonilTab,
      label: 'Beranda',
      icon: Home,
    },
    {
      id: 'peta' as PersonilTab,
      label: 'Peta Patroli',
      icon: Map,
      badge: hasActiveMission ? 'MISI' : undefined,
    },
    {
      id: 'profil' as PersonilTab,
      label: 'Profil Kedinasan',
      icon: User,
    },
  ];

  return (
    <header
      id="personil-top-header"
      className="sticky top-0 z-40 w-full backdrop-blur-xl border-b transition-all duration-200"
      style={{
        background: 'rgba(11, 13, 19, 0.88)',
        borderColor: 'rgba(236, 196, 115, 0.18)',
        boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.6)',
      }}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-2.5 flex items-center justify-between gap-2.5 sm:gap-4">
        {/* Left: Brand & Officer Brief */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-shrink-0">
          <div
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #ECC473 0%, #D4A346 50%, #B8822A 100%)',
              boxShadow: '0 0 16px rgba(236, 196, 115, 0.35)',
            }}
          >
            <Shield size={20} className="text-[#0B0C10] fill-[#0B0C10]" />
          </div>

          <div className="min-w-0">
            <div className="text-xs sm:text-sm font-black tracking-wider uppercase text-amber-400 leading-tight">
              SIMOPMAS 110
            </div>
            <div className="text-[10px] font-bold text-slate-400 tracking-wide mt-0.5 truncate max-w-[180px]">
              {officer.stationName || 'Polres Pekalongan'}
            </div>
          </div>
        </div>

        {/* Center: Desktop Top Navigation Menu (hidden on mobile, visible on desktop) */}
        {activeTab && onTabChange && (
          <nav
            aria-label="Navigasi Desktop Personel"
            className="hidden md:flex items-center gap-1 p-1 rounded-2xl border"
            style={{
              background: 'rgba(15, 17, 24, 0.75)',
              borderColor: 'rgba(236, 196, 115, 0.25)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
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
                  className={`relative flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 select-none ${
                    isActive
                      ? 'text-slate-950 font-black shadow-md'
                      : 'text-slate-300 hover:text-white hover:bg-white/5 active:scale-95'
                  }`}
                  style={
                    isActive
                      ? {
                          background: 'linear-gradient(135deg, #ECC473 0%, #D4A346 100%)',
                          boxShadow: '0 0 12px rgba(236, 196, 115, 0.35)',
                        }
                      : {}
                  }
                >
                  <Icon size={15} strokeWidth={isActive ? 2.5 : 2} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span
                      className={`text-[8px] font-black px-1.5 py-0.2 rounded-full uppercase tracking-tighter ${
                        isActive
                          ? 'bg-red-600 text-white shadow-sm'
                          : 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        )}

        {/* Right: Device Mode, GPS Pulse, Live Clock & Profile Picture Button */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* Device Pairing Indicator Badge */}
          {isPairedDevice ? (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-black tracking-wide"
              style={{
                background: 'rgba(16, 185, 129, 0.15)',
                borderColor: 'rgba(16, 185, 129, 0.35)',
                color: '#34D399',
              }}
              title="Perangkat HP ini terikat sah dengan akun kedinasan. Siap menerima disposisi tugas darurat."
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>TERHUBUNG</span>
            </div>
          ) : (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold tracking-wide"
              style={{
                background: 'rgba(148, 163, 184, 0.1)',
                borderColor: 'rgba(148, 163, 184, 0.25)',
                color: '#94A3B8',
              }}
              title="Mode Monitoring (Laptop/Desktop). Modal panggilan darurat dan sirine dinonaktifkan."
            >
              <span>💻 MONITORING</span>
            </div>
          )}

          {/* Live Clock & GPS (desktop) */}
          <div className="hidden md:flex flex-col items-end text-right">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>GPS AKTIF</span>
            </div>
            <div className="text-[10px] font-mono font-semibold text-slate-400">
              {liveTime || '00:00:00 WIB'}
            </div>
          </div>

          {/* Clickable Profile Picture / Initial Avatar */}
          <button
            type="button"
            onClick={onOpenProfile}
            title="Buka Profil & Pengaturan Petugas"
            className="group relative flex items-center justify-center rounded-xl p-0.5 transition-all duration-200 active:scale-95 focus:outline-none"
            style={{
              background: 'linear-gradient(135deg, #ECC473 0%, #D4A346 50%, #B8822A 100%)',
              boxShadow: '0 0 14px rgba(236, 196, 115, 0.3)',
            }}
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-[10px] overflow-hidden bg-slate-900 border border-black/50 flex items-center justify-center">
              {officer.avatar && !avatarError ? (
                <img
                  src={officer.avatar}
                  alt={officer.fullName || 'Foto Petugas'}
                  onError={() => setAvatarError(true)}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-xs sm:text-sm font-black text-amber-300 font-mono tracking-wider select-none"
                  style={{
                    background: 'linear-gradient(135deg, #1E2330 0%, #0F1219 100%)',
                  }}
                >
                  {getOfficerInitials(officer.fullName)}
                </div>
              )}
            </div>
            {/* Active Duty Status Dot */}
            <span
              className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#0B0D13] shadow-sm"
              title="Status: Aktif Bertugas"
            />
          </button>
        </div>
      </div>
    </header>
  );
}
