// SIMAPRES 110 - Escalation & Cross-Jurisdiction Timing Configurations

/**
 * Mengambil batas waktu respon disposisi lintas wilayah (dalam menit)
 * Sumber konfigurasi: Environment variable `NEXT_PUBLIC_CROSS_JURISDICTION_TIMEOUT_MINUTES`
 * Default: 1 menit jika env belum disetel
 */
export function getCrossJurisdictionTimeoutMinutes(): number {
  const envVal = Number(process.env.NEXT_PUBLIC_CROSS_JURISDICTION_TIMEOUT_MINUTES);
  return Number.isFinite(envVal) && envVal > 0 ? envVal : 1;
}

/**
 * Mengambil batas waktu respon disposisi lintas wilayah dalam milidetik (ms)
 */
export function getCrossJurisdictionTimeoutMs(): number {
  return getCrossJurisdictionTimeoutMinutes() * 60 * 1000;
}
