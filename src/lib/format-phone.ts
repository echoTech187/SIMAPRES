/**
 * Utility Pemformat Nomor Telepon Resmi SIMAPRES 110
 * Mengubah format raw (087875856918 / 6287875856918 / +62878...) menjadi format
 * standar Indonesia yang rapi dan mudah dibaca: 08xx-xxxx-xxxx.
 */

/**
 * Format nomor telepon Indonesia menjadi format standar yang rapi (contoh: 0878-7585-6918).
 */
export function formatPhoneNumber(phone?: string | null): string {
  if (!phone) return '';
  const trimmed = String(phone).trim();
  if (!trimmed || trimmed === '-') return '';

  // Bersihkan semua karakter selain angka
  let digits = trimmed.replace(/\D/g, '');
  if (!digits) return trimmed;

  // Normalisasi prefix internasional (62xxx) menjadi 0xxx
  if (digits.startsWith('62')) {
    digits = '0' + digits.slice(2);
  } else if (digits.startsWith('8')) {
    // Jika input langsung angka 8 tanpa 0 di depan
    digits = '0' + digits;
  }

  // Nomor Seluler Indonesia (08xx-xxxx-xxxx)
  if (digits.startsWith('08')) {
    if (digits.length === 10) {
      // 08xx-xxx-xxx (10 digit)
      return `${digits.slice(0, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
    }
    if (digits.length === 11) {
      // 08xx-xxxx-xxx (11 digit)
      return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8)}`;
    }
    if (digits.length === 12) {
      // 08xx-xxxx-xxxx (12 digit)
      return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8)}`;
    }
    if (digits.length >= 13) {
      // 08xx-xxxx-xxxxx (13+ digit)
      return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8)}`;
    }
  }

  // Telepon PSTN / Kantor / Rumah (021-xxx-xxxx atau 0285-xxx-xxx)
  if (digits.startsWith('021')) {
    if (digits.length >= 9) {
      return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
    }
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }

  if (digits.startsWith('0') && digits.length >= 9) {
    return `${digits.slice(0, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
  }

  // Fallback digit panjang (>= 10 digit)
  if (digits.length >= 10) {
    return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8)}`;
  }

  return trimmed;
}

/**
 * Mendapatkan string digit bersih untuk dialer 'tel:' URL (contoh: 087875856918).
 */
export function getCleanCallNumber(phone?: string | null): string {
  if (!phone) return '';
  let digits = String(phone).replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('62')) {
    digits = '0' + digits.slice(2);
  } else if (digits.startsWith('8')) {
    digits = '0' + digits;
  }
  return digits;
}
