'use client';

import React, { useState } from 'react';

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
 * Helper untuk menghitung inisial 1-2 huruf kapital dari nama.
 * Contoh: "Aiptu Herman Sulistyo" -> "AH", "Budi" -> "BU"
 */
export function getInitials(fullName: string): string {
  if (!fullName) return 'U';
  const cleanName = fullName.trim();
  const parts = cleanName.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/**
 * Reusable Header Profile Component untuk Navigasi Atas (Topbar) SIMAPRES.
 * Mendukung avatar fallback inisial otomatis & kontrol cerdas ikon lonceng per role.
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
  const [imgError, setImgError] = useState(false);

  React.useEffect(() => {
    setImgError(false);
  }, [avatar]);

  // Superadmin tidak menampilkan lonceng, role lain menampilkannya secara default
  const isSuperadmin =
    role?.toLowerCase() === 'superadmin' ||
    role?.toLowerCase() === 'super_admin' ||
    role?.toLowerCase() === 'administrator';

  const shouldShowBell = showBell !== undefined ? showBell : !isSuperadmin;
  const initials = getInitials(name);

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
          🔔
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

        {/* Avatar: Gambar jika ada, atau Inisial Nama jika belum ada photo */}
        {!avatar || imgError ? (
          <div
            id="user-avatar-initial"
            className="user-avatar"
            style={{
              width: '38px',
              height: '38px',
              minWidth: '38px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 50%, #3B82F6 100%)',
              border: '2px solid #FBBF24',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '13px',
              letterSpacing: '0.5px',
              userSelect: 'none',
            }}
          >
            {initials}
          </div>
        ) : (
          <img
            id="user-avatar-top"
            src={avatar}
            alt={name}
            className="user-avatar"
            onError={() => setImgError(true)}
            style={{
              width: '38px',
              height: '38px',
              minWidth: '38px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid #FBBF24',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}
          />
        )}
      </div>
    </div>
  );
}
