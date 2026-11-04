export interface MakoHierarchyStyle {
  level: 'MABES' | 'POLDA' | 'POLRES' | 'POLSEK' | 'POSPOL';
  badgeLabel: string;
  emoji: string;
  strokeColor: string;
  size: number;
  zIndex: number;
}

/**
 * Normalisasi dan deteksi tingkat hirarki kantor polisi
 */
export function resolveMakoHierarchyLevel(office: {
  station_level?: string;
  type?: string;
  station_code?: string;
  code?: string;
  station_name?: string;
  name?: string;
  namaKantor?: string;
}): 'MABES' | 'POLDA' | 'POLRES' | 'POLSEK' | 'POSPOL' {
  const rawLevel = (office.station_level || office.type || '').toUpperCase();
  if (rawLevel.includes('MABES')) return 'MABES';
  if (rawLevel.includes('POLDA')) return 'POLDA';
  if (rawLevel.includes('POLRES') || rawLevel.includes('POLRESTA') || rawLevel.includes('POLRESTABES')) return 'POLRES';
  if (rawLevel.includes('POLSEK') || rawLevel.includes('POLSEKTA')) return 'POLSEK';
  if (rawLevel.includes('POSPOL') || rawLevel.includes('POS LANTAS') || rawLevel.includes('POS')) return 'POSPOL';

  // Fallback berdasarkan nama atau kode mako
  const str = `${office.station_code || office.code || ''} ${office.station_name || office.name || office.namaKantor || ''}`.toUpperCase();
  if (str.includes('MABES')) return 'MABES';
  if (str.includes('POLDA')) return 'POLDA';
  if (str.includes('POLRES') || str.includes('POLRESTA') || str.includes('POLRESTABES')) return 'POLRES';
  if (str.includes('POLSEK')) return 'POLSEK';
  if (str.includes('POSPOL') || str.includes('POS POLISI') || str.includes('POS LANTAS')) return 'POSPOL';

  return 'POLSEK';
}

/**
 * Dapatkan konfigurasi visual bersih per tingkat hirarki Mako
 * (Tanpa halo bergaris putus-putus atau background berlapis yang mengotori jalan peta)
 */
export function getMakoHierarchyStyle(
  office: {
    station_level?: string;
    type?: string;
    station_code?: string;
    code?: string;
    station_name?: string;
    name?: string;
    namaKantor?: string;
  },
  isUserHQ: boolean = false
): MakoHierarchyStyle {
  const level = resolveMakoHierarchyLevel(office);

  if (isUserHQ) {
    return {
      level,
      badgeLabel: `MAKO SAYA (${level})`,
      emoji: '⭐',
      strokeColor: '#B45309', // Emas Amber
      size: 40,
      zIndex: 900,
    };
  }

  switch (level) {
    case 'MABES':
      return {
        level: 'MABES',
        badgeLabel: 'MABES POLRI',
        emoji: '🏛️',
        strokeColor: '#7F1D1D', // Merah Marun Komando
        size: 38,
        zIndex: 880,
      };
    case 'POLDA':
      return {
        level: 'POLDA',
        badgeLabel: 'POLDA',
        emoji: '⭐',
        strokeColor: '#9A3412', // Jingga Tua
        size: 38,
        zIndex: 860,
      };
    case 'POLRES':
      return {
        level: 'POLRES',
        badgeLabel: 'POLRES',
        emoji: '🏢',
        strokeColor: '#1E3A8A', // Biru Dongker Resmi
        size: 36,
        zIndex: 840,
      };
    case 'POLSEK':
      return {
        level: 'POLSEK',
        badgeLabel: 'POLSEK',
        emoji: '🏬',
        strokeColor: '#0F766E', // Hijau Teal Sektor
        size: 34,
        zIndex: 820,
      };
    case 'POSPOL':
    default:
      return {
        level: 'POSPOL',
        badgeLabel: 'POS POLISI',
        emoji: '🏪',
        strokeColor: '#475569', // Slate / Abu Baja
        size: 32,
        zIndex: 800,
      };
  }
}

/**
 * Marker Google Maps Mako Kepolisian
 * Desain: Solid Police Badge Bulat Bersih, Elegan, dan Minimalis dengan Drop Shadow
 */
export function createMakoMapMarkerIcon(
  style: MakoHierarchyStyle,
  googleMaps?: any
): { url: string; scaledSize?: any; anchor?: any } {
  const size = style.size || 36;
  const half = size / 2;
  const iconSize = Math.round(size * 0.48);

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <defs>
        <filter id="mako-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" flood-color="#000000" flood-opacity="0.28"/>
        </filter>
      </defs>
      <!-- Base Solid Badge Bulat Putih Bersih -->
      <circle cx="${half}" cy="${half}" r="${half - 2}" fill="#FFFFFF" stroke="${style.strokeColor}" stroke-width="2.5" filter="url(#mako-shadow)"/>
      <!-- Ikon Lencana Hirarki -->
      <text x="${half}" y="${half + Math.round(iconSize * 0.36)}" font-size="${iconSize}" text-anchor="middle" font-family="'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif">${style.emoji}</text>
    </svg>
  `;

  return {
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
    scaledSize: googleMaps?.Size ? new googleMaps.Size(size, size) : undefined,
    anchor: googleMaps?.Point ? new googleMaps.Point(half, half) : undefined,
  };
}

/**
 * Marker Google Maps Titik Lokasi Kejadian (TKP)
 * Desain: Teardrop Pin Klasik Ramping (Seperti Google Maps Resmi)
 * Presisi menunjuk ke jalan raya tanpa lingkaran halo raksasa putus-putus
 */
export function createComplaintTkpMapMarkerIcon(
  urgency: string = 'SEDANG',
  isFocused: boolean = false,
  ticketNumber?: string,
  googleMaps?: any
): { url: string; scaledSize?: any; anchor?: any } {
  const normUrg = (urgency || '').toUpperCase();
  const isEmergency = normUrg.includes('DARURAT') || normUrg.includes('TINGGI') || normUrg.includes('HIGH');
  const isMedium = normUrg.includes('SEDANG') || normUrg.includes('MEDIUM');

  // Warna solid tegas: Merah (Darurat), Oranye (Sedang), Biru (Normal)
  const pinColor = isEmergency ? '#EF4444' : isMedium ? '#F59E0B' : '#3B82F6';
  const strokeColor = isEmergency ? '#B91C1C' : isMedium ? '#B45309' : '#1D4ED8';
  const emoji = isEmergency ? '🚨' : isMedium ? '⚠️' : '📍';

  const w = isFocused ? 36 : 30;
  const h = isFocused ? 48 : 40;
  const halfW = w / 2;
  const headRadius = halfW - 2;
  const centerCy = headRadius + 2;
  const emojiSize = isFocused ? 15 : 12;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
      <defs>
        <filter id="pin-drop-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.32"/>
        </filter>
      </defs>
      <!-- Teardrop Pin Path Ramping: Lancip Tepat ke Titik Koordinat Jalan -->
      <path d="M ${halfW} ${h - 1} C ${halfW - 2} ${h - 7}, 2 ${centerCy + headRadius * 0.75}, 2 ${centerCy} A ${headRadius} ${headRadius} 0 1 1 ${w - 2} ${centerCy} C ${w - 2} ${centerCy + headRadius * 0.75}, ${halfW + 2} ${h - 7}, ${halfW} ${h - 1} Z"
            fill="${pinColor}" stroke="${strokeColor}" stroke-width="1.5" filter="url(#pin-drop-shadow)"/>
      <!-- Lingkaran Inti Putih Bersih -->
      <circle cx="${halfW}" cy="${centerCy}" r="${headRadius - 3}" fill="#FFFFFF"/>
      <!-- Emoji Simbol Urgensi -->
      <text x="${halfW}" y="${centerCy + Math.round(emojiSize * 0.35)}" font-size="${emojiSize}" text-anchor="middle" font-family="'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif">${emoji}</text>
    </svg>
  `;

  return {
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
    scaledSize: googleMaps?.Size ? new googleMaps.Size(w, h) : undefined,
    anchor: googleMaps?.Point ? new googleMaps.Point(halfW, h - 1) : undefined,
  };
}
