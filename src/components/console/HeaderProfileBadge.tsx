'use client';

import React from 'react';
import { Bell } from 'lucide-react';
import NameInitialAvatar, { getInitialsFromName } from '@/components/ui/NameInitialAvatar';

export { getInitialsFromName as getInitials };

export interface HeaderProfileBadgeProps {
  /** Nama lengkap pengguna / petugas */
  name: string;
  /** NRP atau kode identitas (opsional) */
  identifier?: string | null;
  /** Role pengguna (misal: 'superadmin', 'personil', 'pawas') */
  role?: string | null;
  /** URL foto avatar (jika kosong / null / gagal load, akan diganti inisial nama) */
  avatar?: string | null;
  /** Status apakah halaman profil sedang aktif (untuk efek highlight) */
  isActive?: boolean;
  /** Kontrol eksplisit icon lonceng. Jika tidak dispesifikasikan, otomatis tersembunyi untuk superadmin */
  showBell?: boolean;
  /** Indikator dot merah / notifikasi aktif pada icon lonceng */
  hasNotification?: boolean;
  /** Callback saat badge profil diklik */
  onClick?: () => void;
  /** Callback saat icon lonceng notifikasi diklik */
  onBellClick?: () => void;
  /** Style tambahan container */
  style?: React.CSSProperties;
  /** ClassName opsional */
  className?: string;
}

/**
 * Reusable Header Profile Component untuk Navigasi Atas (Topbar) SIMOPMAS 110.
 * Menggunakan NameInitialAvatar standar emas untuk fallback inisial nama otomatis tanpa emoji.
 */
export default function HeaderProfileBadge({
  name,
  identifier,
  role,
  avatar,
  isActive = false,
  showBell,
  hasNotification = false,
  onClick,
  onBellClick,
  style,
  className,
}: HeaderProfileBadgeProps) {
  // Superadmin tidak menampilkan lonceng, role lain menampilkannya secara default
  const isSuperadmin = role ? role.toUpperCase() === 'SUPERADMIN' : false;

  const shouldShowBell = showBell !== undefined ? showBell : !isSuperadmin;

  // Format NRP / Subtext
  const formattedSubtitle = React.useMemo(() => {
    if (identifier && identifier.trim()) {
      const trimmed = identifier.trim();
      if (
        trimmed.toUpperCase().startsWith('NRP') ||
        trimmed.toUpperCase().startsWith('ROLE') ||
        trimmed.toUpperCase().startsWith('ID')
      ) {
        return trimmed;
      }
      return `NRP: ${trimmed}`;
    }
    if (role && role.trim()) {
      return `ROLE: ${role.toUpperCase()}`;
    }
    return '';
  }, [identifier, role]);

  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '10px',
        ...style,
      }}
    >
      {/* Icon Lonceng Notifikasi (Tampil di role selain Superadmin) */}
      {shouldShowBell && (
        <div
          id="bell-notif"
          className="bell-icon"
          onClick={(e) => {
            e.stopPropagation();
            if (onBellClick) onBellClick();
          }}
          style={{
            cursor: onBellClick ? 'pointer' : 'default',
            transition: 'transform 0.2s',
            position: 'relative',
            fontSize: '20px',
            userSelect: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Notifikasi & Panggilan Masuk"
        >
          <Bell size={19} color="#FFFFFF" strokeWidth={2.2} />
          {hasNotification && <div className="bell-dot" />}
        </div>
      )}

      {/* Profil Badge Card */}
      <div
        className="user-badge-wrap"
        onClick={onClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          cursor: onClick ? 'pointer' : 'default',
          background: isActive ? 'rgba(255, 255, 255, 0.22)' : 'rgba(255, 255, 255, 0.1)',
          padding: '6px 12px',
          borderRadius: '10px',
          border: isActive ? '1.5px solid #FBBF24' : '1px solid rgba(255, 255, 255, 0.2)',
          transition: 'all 0.2s ease',
          boxShadow: isActive ? '0 0 12px rgba(251, 191, 36, 0.35)' : 'none',
          userSelect: 'none',
        }}
        title="Klik untuk membuka Profil Lengkap & Pengaturan Akun"
      >
        {/* Info Teks: Nama & NRP */}
        <div className="user-info" style={{ textAlign: 'right', lineHeight: 1.25 }}>
          <div
            id="user-name"
            className="user-name"
            style={{
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '13.5px',
              letterSpacing: '0.2px',
              whiteSpace: 'nowrap',
            }}
          >
            {name}
          </div>
          {formattedSubtitle && (
            <div
              id="user-role"
              className="user-nrp"
              style={{
                color: '#93C5FD',
                fontSize: '11px',
                fontWeight: 700,
                fontFamily: 'monospace, sans-serif',
                whiteSpace: 'nowrap',
              }}
            >
              {formattedSubtitle}
            </div>
          )}
        </div>

        {/* Standardized Name Initial Avatar */}
        <NameInitialAvatar
          name={name}
          avatarUrl={avatar}
          size={38}
          variant="gold"
          title={name}
        />
      </div>
    </div>
  );
}
