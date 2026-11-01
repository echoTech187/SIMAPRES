// SIMAPRES 110 - Escalation & Cross-Jurisdiction Timing Configurations

/**
 * Mengambil batas waktu respon disposisi lintas wilayah (dalam menit).
 * Sesuai Standar Operasional Presisi Polri 110:
 * - Urgensi DARURAT: 3 Menit
 * - Urgensi SEDANG / NORMAL: 5 Menit
 * - Default: 3 Menit jika belum ada konfigurasi khusus.
 * Sumber konfigurasi: Environment variable `NEXT_PUBLIC_CROSS_JURISDICTION_TIMEOUT_MINUTES`.
 */
export function getCrossJurisdictionTimeoutMinutes(urgency?: string): number {
  const envVal = Number(process.env.NEXT_PUBLIC_CROSS_JURISDICTION_TIMEOUT_MINUTES);
  if (Number.isFinite(envVal) && envVal > 0) {
    return envVal;
  }
  const u = (urgency || '').toUpperCase();
  if (u === 'DARURAT') return 3;
  if (u === 'SEDANG' || u === 'NORMAL') return 5;
  return 3;
}

/**
 * Mengambil batas waktu respon disposisi lintas wilayah dalam milidetik (ms).
 */
export function getCrossJurisdictionTimeoutMs(urgency?: string): number {
  return getCrossJurisdictionTimeoutMinutes(urgency) * 60 * 1000;
}

/**
 * Parsing waktu UTC yang aman untuk string dari MySQL / JSON.
 * Menjamin timestamp tanpa akhiran 'Z' (seperti "2026-10-31 14:22:13.885")
 * diparsing sebagai waktu UTC yang presisi, bukan waktu lokal browser (WIB).
 */
export function parseUtcDate(val: any): Date | null {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  if (typeof val === 'number') return new Date(val);
  if (typeof val === 'string') {
    let s = val.trim();
    if (s.includes(' ') && !s.includes('T')) {
      s = s.replace(' ', 'T');
    }
    if (!s.endsWith('Z') && !/[+-]\d{2}:\d{2}$/.test(s)) {
      s = s + 'Z';
    }
    const d = new Date(s);
    return isNaN(d.getTime()) ? new Date(val) : d;
  }
  return null;
}

/**
 * Mengambil epoch timestamp (ms) dari tanggal UTC yang aman.
 */
export function parseUtcTimeMs(val: any): number {
  const d = parseUtcDate(val);
  return d ? d.getTime() : 0;
}
