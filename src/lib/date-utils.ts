/**
 * SIMAPRES 110 - Standard Date & Time Formatting Utilities (WIB / Asia/Jakarta)
 * Menjamin keseragaman dan akurasi pencatatan milestone laporan, audit trail, SLA, dan response time.
 */

export interface FormattedDateTime {
  full: string;       // "Hari ini, 17.27 WIB" | "Kemarin, 21.38 WIB" | "20 Okt 2026, 21.38 WIB"
  time: string;       // "17.27 WIB"
  dateOnly: string;   // "21 Okt 2026"
  isToday: boolean;
  isYesterday: boolean;
  iso: string;
}

export function parseDateSafe(
  input: string | Date | null | undefined,
  fallbackBaseDate?: string | Date | null
): Date | null {
  if (!input) return null;
  if (input instanceof Date) return isNaN(input.getTime()) ? null : input;

  const trimmed = String(input).trim();
  if (!trimmed || trimmed === '-') return null;

  // 1. Coba parse langsung menggunakan Date standard
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) return d;

  // 2. Parse string format tanggal Indonesia seperti "22 Okt 2026, 21.40 WIB"
  const monthMap: Record<string, number> = {
    jan: 0, januari: 0,
    feb: 1, februari: 1,
    mar: 2, maret: 2,
    apr: 3, april: 3,
    mei: 4, may: 4,
    jun: 5, juni: 5,
    jul: 6, juli: 6,
    agu: 7, ags: 7, agustus: 7, aug: 7,
    sep: 8, september: 8,
    okt: 9, oktober: 9, oct: 9,
    nov: 10, november: 10,
    des: 11, desember: 11, dec: 11,
  };

  const idDateMatch = trimmed.match(
    /^(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})(?:[,\s]+(\d{1,2})[:.](\d{2}))?/
  );
  if (idDateMatch) {
    const day = parseInt(idDateMatch[1], 10);
    const mStr = idDateMatch[2].toLowerCase();
    const year = parseInt(idDateMatch[3], 10);
    const month = monthMap[mStr];
    if (month !== undefined) {
      const hours = idDateMatch[4] ? parseInt(idDateMatch[4], 10) : 0;
      const minutes = idDateMatch[5] ? parseInt(idDateMatch[5], 10) : 0;
      const parsed = new Date(year, month, day, hours, minutes);
      if (!isNaN(parsed.getTime())) return parsed;
    }
  }

  // 3. Jika format input hanya jam (misal: "21.40 WIB", "21.40", "21:40")
  const timeOnlyMatch = trimmed.match(/^(\d{1,2})[:.](\d{2})/);
  if (timeOnlyMatch) {
    const hours = parseInt(timeOnlyMatch[1], 10);
    const minutes = parseInt(timeOnlyMatch[2], 10);
    const base = fallbackBaseDate ? parseDateSafe(fallbackBaseDate) : new Date();
    if (base) {
      const res = new Date(base);
      res.setHours(hours, minutes, 0, 0);
      return res;
    }
  }

  return null;
}

/**
 * Format tanggal & jam dengan deteksi dinamis hari ini / kemarin / tanggal lengkap
 * Semua kalkulasi dipaksa ke zona waktu Asia/Jakarta (WIB) untuk mencegah deviasi UTC / OS klien.
 */
export function formatIncidentDateTime(input: string | Date | null | undefined): FormattedDateTime {
  const d = parseDateSafe(input);
  if (!d) {
    return {
      full: '-',
      time: '-',
      dateOnly: '-',
      isToday: false,
      isYesterday: false,
      iso: '',
    };
  }

  const optionsTz = { timeZone: 'Asia/Jakarta' };
  const dJakartaStr = d.toLocaleDateString('en-CA', optionsTz); // YYYY-MM-DD
  const now = new Date();
  const nowJakartaStr = now.toLocaleDateString('en-CA', optionsTz);

  const yesterday = new Date(now.getTime() - 86400000);
  const yesterdayJakartaStr = yesterday.toLocaleDateString('en-CA', optionsTz);

  const isToday = dJakartaStr === nowJakartaStr;
  const isYesterday = dJakartaStr === yesterdayJakartaStr;

  const rawTimeStr = d.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
  });
  const time = rawTimeStr.replace(':', '.') + ' WIB';

  const dateOnly = d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  });

  let full = `${dateOnly}, ${time}`;
  if (isToday) {
    full = `Hari ini, ${time}`;
  } else if (isYesterday) {
    full = `Kemarin, ${time}`;
  }

  return {
    full,
    time,
    dateOnly,
    isToday,
    isYesterday,
    iso: d.toISOString(),
  };
}

/**
 * Format tanggal & jam lengkap WIB (contoh: "22 Okt 2026, 21.40 WIB")
 * Menampilkan tanggal dan jam secara definitif dan seragam di semua milestone.
 */
export function formatDateTimeWib(
  input: string | Date | null | undefined,
  fallbackBaseDate?: string | Date | null
): string {
  const d = parseDateSafe(input, fallbackBaseDate);
  if (!d) return '-';
  const dateOnly = d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  });
  const time = d.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
  }).replace(':', '.') + ' WIB';
  return `${dateOnly}, ${time}`;
}

/**
 * Format jam dalam format 24 jam dengan akhiran WIB (contoh: 21.38 WIB)
 */
export function formatTimeWib(
  input: string | Date | null | undefined,
  fallbackBaseDate?: string | Date | null
): string {
  const d = parseDateSafe(input, fallbackBaseDate);
  if (!d) return '-';
  return (
    d.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta',
    }).replace(':', '.') + ' WIB'
  );
}

/**
 * Hitung durasi dalam menit antar dua timestamp milestone
 */
export function calcDurationMinutes(
  startInput: string | Date | null | undefined,
  endInput: string | Date | null | undefined
): number | null {
  const start = parseDateSafe(startInput);
  const end = parseDateSafe(endInput);
  if (!start || !end) return null;
  const diffMs = end.getTime() - start.getTime();
  if (diffMs < 0) return 1;
  return Math.max(1, Math.round(diffMs / 60000));
}
