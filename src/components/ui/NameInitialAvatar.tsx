'use client';

import React, { useState, useEffect } from 'react';

const POLICE_RANKS = [
  'BHARADA',
  'BHARATU',
  'BHARAKA',
  'BRIPDA',
  'BRIPTU',
  'BRIGADIR',
  'BRIPKA',
  'AIPDA',
  'AIPTU',
  'IPDA',
  'IPTU',
  'AKP',
  'KOMPOL',
  'AKBP',
  'KOMBES',
  'KOMBESPOL',
  'BRIGJEN',
  'IRJEN',
  'KOMJEN',
  'JENDERAL',
  'POL',
  'POLRI',
  'PNS',
  'ADMIN',
  'OPERATOR',
];

/**
 * Ekstraksi 1-2 huruf inisial kapital dari nama lengkap.
 * Otomatis mengabaikan prefix pangkat kedinasan Polri jika ada nama lanjutan.
 * Contoh: "Bripka Dedi Prasetyo" -> "DP", "Aiptu Herman" -> "HE" / "HS", "Budi" -> "BU"
 */
export function getInitialsFromName(fullName?: string | null): string {
  if (!fullName || typeof fullName !== 'string') return 'U';
  const clean = fullName.trim();
  if (!clean) return 'U';

  const rawWords = clean.split(/\s+/).filter(Boolean);
  if (rawWords.length === 0) return 'U';

  // Filter out pangkat jika masih ada kata nama di belakangnya
  const filtered = rawWords.filter(
    (w) => !POLICE_RANKS.includes(w.toUpperCase().replace(/[^A-Z]/g, ''))
  );
  const words = filtered.length > 0 ? filtered : rawWords;

  if (words.length === 1) {
    const word = words[0].replace(/[^a-zA-Z0-9]/g, '');
    return (word.slice(0, 2) || 'U').toUpperCase();
  }

  const firstChar = words[0].replace(/[^a-zA-Z0-9]/g, '')[0] || '';
  const secondChar = words[1].replace(/[^a-zA-Z0-9]/g, '')[0] || '';
  const result = (firstChar + secondChar).toUpperCase();
  return result || 'U';
}

export interface NameInitialAvatarProps {
  /** Nama lengkap pengguna, personil, warga, pawas, atau superadmin */
  name?: string | null;
  /** URL foto avatar profil (jika kosong atau error, otomatis menggunakan inisial nama) */
  avatarUrl?: string | null;
  /** Ukuran lebar & tinggi avatar dalam piksel (default: 40) */
  size?: number;
  /** Bentuk sudut avatar (default: 'full') */
  rounded?: 'full' | 'xl' | 'lg' | 'md';
  /** Gaya tema avatar inisial (default: 'gold') */
  variant?: 'gold' | 'blue' | 'slate' | 'emerald';
  /** Apakah menampilkan badge/dot status aktif di sudut */
  showOnlineDot?: boolean;
  /** Warna dot status aktif (default: '#10B981') */
  statusColor?: string;
  /** Teks judul tooltip saat hover */
  title?: string;
  /** Custom className */
  className?: string;
  /** Custom inline styles */
  style?: React.CSSProperties;
  /** Handler klik */
  onClick?: () => void;
}

export default function NameInitialAvatar({
  name,
  avatarUrl,
  size = 40,
  rounded = 'full',
  variant = 'gold',
  showOnlineDot = false,
  statusColor = '#10B981',
  title,
  className = '',
  style = {},
  onClick,
}: NameInitialAvatarProps) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [avatarUrl]);

  const initials = getInitialsFromName(name);

  // Rounded class mapping
  const roundedClass =
    rounded === 'full'
      ? 'rounded-full'
      : rounded === 'xl'
      ? 'rounded-2xl'
      : rounded === 'lg'
      ? 'rounded-xl'
      : 'rounded-lg';

  // Variant themes for initial avatar fallback
  const variantStyles = {
    gold: {
      outerBorder: 'linear-gradient(135deg, #ECC473 0%, #C99635 100%)',
      bg: 'linear-gradient(135deg, #1C202C 0%, #0F1219 100%)',
      textColor: '#ECC473',
      innerBorder: '1px solid rgba(236, 196, 115, 0.3)',
      shadow: '0 2px 10px rgba(201, 150, 53, 0.25)',
    },
    blue: {
      outerBorder: 'linear-gradient(135deg, #60A5FA 0%, #2563EB 100%)',
      bg: 'linear-gradient(135deg, #1E3A8A 0%, #172554 100%)',
      textColor: '#93C5FD',
      innerBorder: '1px solid rgba(96, 165, 250, 0.35)',
      shadow: '0 2px 10px rgba(37, 99, 235, 0.25)',
    },
    slate: {
      outerBorder: 'linear-gradient(135deg, #94A3B8 0%, #475569 100%)',
      bg: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
      textColor: '#F1F5F9',
      innerBorder: '1px solid rgba(148, 163, 184, 0.25)',
      shadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
    },
    emerald: {
      outerBorder: 'linear-gradient(135deg, #34D399 0%, #059669 100%)',
      bg: 'linear-gradient(135deg, #064E3B 0%, #022C22 100%)',
      textColor: '#A7F3D0',
      innerBorder: '1px solid rgba(52, 211, 153, 0.35)',
      shadow: '0 2px 10px rgba(5, 150, 105, 0.25)',
    },
  }[variant];

  // Font size dynamically calculated from avatar dimension
  const fontSize = Math.max(10, Math.round(size * 0.38));
  const dotSize = Math.max(8, Math.round(size * 0.26));

  const hasValidPhoto = Boolean(avatarUrl && !imgError && avatarUrl.trim() !== '');

  return (
    <div
      onClick={onClick}
      title={title || name || 'Profil'}
      className={`relative inline-flex items-center justify-center flex-shrink-0 select-none ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        minWidth: `${size}px`,
        minHeight: `${size}px`,
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
    >
      {/* Outer Glow / Ring Container */}
      <div
        className={`w-full h-full p-[2px] ${roundedClass} flex items-center justify-center overflow-hidden`}
        style={{
          background: variantStyles.outerBorder,
          boxShadow: variantStyles.shadow,
        }}
      >
        {/* Inner Content: Photo or Name Initials */}
        <div
          className={`w-full h-full ${roundedClass} overflow-hidden flex items-center justify-center`}
          style={{
            background: variantStyles.bg,
            border: variantStyles.innerBorder,
          }}
        >
          {hasValidPhoto ? (
            <img
              src={avatarUrl!}
              alt={name || 'Avatar'}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <span
              style={{
                fontSize: `${fontSize}px`,
                fontWeight: 900,
                color: variantStyles.textColor,
                letterSpacing: '0.5px',
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace, sans-serif',
                lineHeight: 1,
              }}
            >
              {initials}
            </span>
          )}
        </div>
      </div>

      {/* Optional Status Indicator Dot */}
      {showOnlineDot && (
        <span
          className="absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-[#090A0F] shadow-sm flex-shrink-0"
          style={{
            width: `${dotSize}px`,
            height: `${dotSize}px`,
            backgroundColor: statusColor,
            boxShadow: `0 0 6px ${statusColor}`,
          }}
        />
      )}
    </div>
  );
}
