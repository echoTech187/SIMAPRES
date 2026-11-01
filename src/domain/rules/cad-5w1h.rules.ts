/**
 * SIMAPRES 110 - DOMAIN RULES: EVALUASI KELENGKAPAN LAPORAN CAD (5W+1H KEDINASAN)
 * Lapisan: Domain (Pure Business Rules)
 * 
 * Standar evaluasi kelengkapan narasi laporan CAD berbasis terminologi formal Polri:
 * 1. Pokok Peristiwa Kejadian (What)
 * 2. Pihak yang Terlibat (Who)
 * 3. Kejelasan Lokasi & Patokan TKP (Where)
 * 4. Keterangan Waktu Kejadian (When)
 * 5. Dugaan Penyebab / Latar Belakang (Why)
 * 6. Kronologi & Situasi Terkini (How)
 * 7. Kesesuaian Subklasifikasi Perkara
 */

export interface Cad5W1HEvaluationResult {
  score: number; // 0 - 100
  hasWhat: boolean; // Pokok Peristiwa
  hasWho: boolean; // Pihak Terkait
  hasWhere: boolean; // Kejelasan Lokasi / Patokan TKP
  hasWhen: boolean; // Keterangan Waktu
  hasWhy: boolean; // Dugaan Penyebab
  hasHow: boolean; // Kronologi & Situasi
  isSubcategoryAligned: boolean; // Kesesuaian Subklasifikasi
  internalEvaluationNotes: string; // Catatan Supervisi Formal untuk Kapolsek / Pawas (TIDAK DITAMPILKAN KE OPERATOR)
}

/**
 * Heuristic fallback evaluator jika AI offline atau timeout.
 * Memastikan kalkulasi deterministik & zero-regression.
 */
export function evaluate5W1HHeuristic(params: {
  ringkasanKeterangan: string;
  subkasusNama?: string | null;
  tkpAlamat?: string | null;
  hasGps?: boolean;
  pelaporNama?: string | null;
  pelaporHp?: string | null;
}): Cad5W1HEvaluationResult {
  const text = (params.ringkasanKeterangan || '').trim().toLowerCase();
  const subkasus = (params.subkasusNama || '').trim().toLowerCase();
  const tkp = (params.tkpAlamat || '').trim().toLowerCase();

  // 1. POKOK PERISTIWA (WHAT): Apakah ada indikasi peristiwa/masalah
  const hasWhat = text.length >= 10;

  // 2. PIHAK TERKAIT (WHO): Apakah ada penyebutan pihak (korban/pelaku/warga/remaja/pengendara/pelapor)
  const whoKeywords = ['pelapor', 'korban', 'pelaku', 'warga', 'remaja', 'anak', 'pengendara', 'orang', 'sopir', 'pengemudi', 'masyarakat', 'bpk', 'ibu', 'saudara'];
  const hasWhoInText = whoKeywords.some((w) => text.includes(w));
  const hasWho = Boolean(hasWhoInText || (params.pelaporNama && params.pelaporNama.trim().length >= 3));

  // 3. KEJELASAN LOKASI & PATOKAN TKP (WHERE): Apakah ada penyebutan lokasi/patokan di teks atau di alamat TKP
  const whereKeywords = ['di ', 'depan', 'dekat', 'seberang', 'jalan', 'jl', 'desa', 'kelurahan', 'kecamatan', 'pasar', 'gang', 'simpang', 'lampu merah', 'arah'];
  const hasWhereInText = whereKeywords.some((w) => text.includes(w));
  const hasWhere = Boolean(hasWhereInText || (tkp.length >= 5 && params.hasGps));

  // 4. KETERANGAN WAKTU (WHEN): Apakah ada penyebutan waktu
  const whenKeywords = ['pukul', 'jam', 'pagi', 'siang', 'sore', 'malam', 'dini hari', 'tadi', 'baru saja', 'kemarin', 'wib'];
  const hasWhen = whenKeywords.some((w) => text.includes(w));

  // 5. DUGAAN PENYEBAB (WHY): Apakah ada indikasi penyebab/alasan
  const whyKeywords = ['karena', 'akibat', 'diduga', 'karena mabuk', 'kecepatan tinggi', 'rem blong', 'berselisih', 'hendak', 'curiga', 'motif'];
  const hasWhy = whyKeywords.some((w) => text.includes(w)) || text.length >= 40;

  // 6. KRONOLOGI & SITUASI TERKINI (HOW): Apakah ada penjelasan situasi saat ini
  const howKeywords = ['terjadi', 'menabrak', 'mengalami', 'mengakibatkan', 'kondisi', 'berdarah', 'luka', 'macet', 'ramai', 'mengamankan', 'meresahkan', 'konsultasi', 'penjelasan'];
  const hasHow = howKeywords.some((w) => text.includes(w)) || text.length >= 30;

  // 7. KESESUAIAN DENGAN SUBKLASIFIKASI KASUS
  let isSubcategoryAligned = true;
  if (subkasus && subkasus.length > 0) {
    const subWords = subkasus.split(/\s+/).filter((w) => w.length > 3);
    const matches = subWords.filter((w) => text.includes(w));
    isSubcategoryAligned = matches.length > 0 || text.includes('konsultasi') || text.includes('pelayanan') || text.length >= 25;
  }

  // Hitung Skor 0 - 100
  let points = 0;
  if (hasWhat) points += 15;
  if (hasWho) points += 15;
  if (hasWhere) points += 15;
  if (hasWhen) points += 15;
  if (hasWhy) points += 10;
  if (hasHow) points += 15;
  if (isSubcategoryAligned) points += 15;

  const score = Math.min(100, Math.max(0, points));

  const missingElements: string[] = [];
  if (!hasWhat) missingElements.push('pokok peristiwa kejadian');
  if (!hasWho) missingElements.push('identitas pihak yang terlibat/korban');
  if (!hasWhere) missingElements.push('kejelasan lokasi dan patokan TKP');
  if (!hasWhen) missingElements.push('keterangan waktu kejadian');
  if (!hasWhy) missingElements.push('dugaan penyebab peristiwa');
  if (!hasHow) missingElements.push('kronologi dan situasi terkini');
  if (!isSubcategoryAligned) missingElements.push('kesesuaian dengan subklasifikasi kasus');

  const notes = missingElements.length === 0
    ? 'Narasi laporan lengkap memenuhi standar formal pelaporan dan selaras dengan subklasifikasi kasus.'
    : `Catatan Evaluasi Kedinasan: Narasi laporan belum memuat ${missingElements.join(', ')}. Perlu pembinaan pengisian laporan pada saat serah terima piket SPKT.`;

  return {
    score,
    hasWhat,
    hasWho,
    hasWhere,
    hasWhen,
    hasWhy,
    hasHow,
    isSubcategoryAligned,
    internalEvaluationNotes: notes,
  };
}
