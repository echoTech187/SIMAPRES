/**
 * SIMAPRES 110 - DOMAIN RULES: PENYELESAIAN PERKARA & RESTORATIVE JUSTICE
 * Lapisan: Domain (Pure TypeScript, Zero External Framework Dependencies)
 *
 * Standar Aturan 11 RULES.md:
 * - Pure Functions deterministik (tanpa DB, tanpa Next.js/React).
 * - Sesuai Perpol No. 8 Tahun 2021 tentang Penanganan Tindak Pidana Berdasarkan Keadilan Restoratif (Restorative Justice).
 * - Digunakan bersama oleh Klien (UI Dialog & Form BAP) dan Server (Validasi Otoritatif).
 */

export type ResolutionLocationKey =
  | 'TKP'
  | 'RUMAH_SAKIT'
  | 'KANTOR_POLISI'
  | 'KANTOR_KELURAHAN'
  | 'OPERATOR_DESK'
  | 'LAINNYA'
  | string;

export type ResolutionDocumentKey =
  | 'BAP_DAMAI'
  | 'REKAM_MEDIS'
  | 'SERAH_TERIMA_BB'
  | 'DOKUMENTASI_KONDUSIF'
  | 'BERITA_ACARA_PENUTUPAN'
  | 'KONSULTASI_SELESAI'
  | 'DOKUMEN_LAINNYA'
  | string;

export interface ResolutionValidationContext {
  kategoriKey?: string | null;
  urgensi?: string | null;
  locationKey?: ResolutionLocationKey | null;
  documentKey?: ResolutionDocumentKey | null;
  evidenceCount?: number;
  hasPhotoEvidence?: boolean;
  catatan?: string | null;
  kerugianEstimasi?: number | null;
}

export interface ResolutionValidationResult {
  isValid: boolean;
  isRestorativeJusticeEligible: boolean;
  requiresStrictTkpGps: boolean;
  missingRequirements: string[];
}

export interface ResolutionPermissions {
  canSubmitResolution: boolean;
  canApproveResolution: boolean;
  canRejectResolution: boolean;
  canEditResolution: boolean;
}

/**
 * Matriks RBAC untuk hak akses pengajuan dan pengesahan Berita Acara Penyelesaian (BAP).
 */
export function getResolutionPermissions(
  status: string,
  role = '',
  isAssignedOfficer = false
): ResolutionPermissions {
  const isSuperadmin = role === 'SUPERADMIN';
  const isPawas = role === 'PAWAS' || isSuperadmin;
  const isAssignedOrSuper = isAssignedOfficer || isSuperadmin;

  return {
    // Personil bertugas dapat mengajukan penyelesaian perkara saat tiket berada di tahap tindakan
    canSubmitResolution: isAssignedOrSuper && status === 'DIPROSES',

    // Pawas mengesahkan berkas penyelesaian saat status 'MENUNGGU_PENGESAHAN'
    canApproveResolution: isPawas && status === 'MENUNGGU_PENGESAHAN',

    // Pawas dapat menolak pengesahan jika bukti tidak cukup dan mengembalikan ke personil
    canRejectResolution: isPawas && status === 'MENUNGGU_PENGESAHAN',

    // Edit data penyelesaian jika belum disahkan
    canEditResolution: isAssignedOrSuper && (status === 'DIPROSES' || status === 'MENUNGGU_PENGESAHAN'),
  };
}

/**
 * Kategori tindak pidana yang secara hukum DILARANG KERAS diselesaikan melalui Restorative Justice
 * berdasarkan Perpol No. 8 Tahun 2021 Pasal 5 (Kejahatan terhadap keamanan negara, terorisme,
 * pembunuhan berencana, narkoba, dan kejahatan yang merenggut nyawa).
 */
const RESTRICTED_RJ_CATEGORIES = [
  'NARKOBA',
  'PEMBUNUHAN',
  'TERORISME',
  'SENPI',
  'PERAMPOKAN',
  'KEJAHATAN_SEKSUAL_ANAK',
  'KORUPSI',
];

/**
 * Memeriksa kelayakan penyelesaian perkara melalui mekanisme Restorative Justice (RJ).
 * Standar:
 * 1. Tidak termasuk tindak pidana berat yang dikecualikan.
 * 2. Nilai kerugian materiil tidak melebihi ambang batas tipiring (maks Rp 2.500.000 sesuai Perma No. 2/2012)
 *    kecuali ada kesepakatan tertulis ganti rugi penuh antara para pihak.
 * 3. Tersedia dokumen kesepakatan damai ('BAP_DAMAI').
 */
export function isEligibleForRestorativeJustice(context: ResolutionValidationContext): boolean {
  const { kategoriKey = '', documentKey = '', kerugianEstimasi = 0 } = context;

  if (!kategoriKey) return true; // Default general tipiring jika kategori belum terdefinisi

  const normalizedCategory = kategoriKey.toUpperCase().trim();
  const isRestricted = RESTRICTED_RJ_CATEGORIES.some((restricted) =>
    normalizedCategory.includes(restricted)
  );

  if (isRestricted) return false;

  // Jika nilai kerugian melebihi Rp 2.500.000 dan bukan dokumen perdamaian, bukan RJ tipiring
  if (kerugianEstimasi && kerugianEstimasi > 2500000 && documentKey !== 'BAP_DAMAI') {
    return false;
  }

  return true;
}

/**
 * Menentukan apakah tipe lokasi penyelesaian mewajibkan koordinat GPS berada persis di TKP.
 * Jika diselesaikan di Polsek/Polres/Rumah Sakit, deviasi GPS diperbolehkan.
 */
export function requiresStrictTkpGps(locationKey?: ResolutionLocationKey | null): boolean {
  if (!locationKey) return false;
  return locationKey.toUpperCase() === 'TKP';
}

/**
 * Validasi kelayakan dokumen dan bukti sebelum personil dapat mengajukan BAP penyelesaian perkara.
 */
export function validateResolutionSubmission(
  context: ResolutionValidationContext
): ResolutionValidationResult {
  const missingRequirements: string[] = [];

  const {
    locationKey,
    documentKey,
    evidenceCount = 0,
    hasPhotoEvidence = false,
    catatan,
  } = context;

  if (!locationKey) {
    missingRequirements.push('Pilih lokasi penyelesaian perkara (TKP, Mako, atau Fasilitas Kesehatan).');
  }

  if (!documentKey) {
    missingRequirements.push('Pilih jenis dokumen bukti penyelesaian (Surat Damai, Rekam Medis, atau BAP).');
  }

  if (!hasPhotoEvidence && evidenceCount <= 0) {
    missingRequirements.push('Wajib melampirkan minimal 1 (satu) foto bukti penyelesaian atau dokumen fisik.');
  }

  if (!catatan || catatan.trim().length < 10) {
    missingRequirements.push('Catatan ringkasan penyelesaian minimal 10 karakter.');
  }

  const isRjEligible = isEligibleForRestorativeJustice(context);
  if (documentKey === 'BAP_DAMAI' && !isRjEligible) {
    missingRequirements.push(
      'Kategori perkara ini tidak memenuhi syarat formil Restorative Justice (Perpol No. 8/2021).'
    );
  }

  return {
    isValid: missingRequirements.length === 0,
    isRestorativeJusticeEligible: isRjEligible,
    requiresStrictTkpGps: requiresStrictTkpGps(locationKey),
    missingRequirements,
  };
}

export interface ResolutionOptionItem {
  key: string;
  label: string;
  keterangan?: string;
  requiresStrictTkp?: boolean;
}

export const STANDARD_RESOLUTION_LOCATIONS: ResolutionOptionItem[] = [
  { key: 'TKP', label: 'Lokasi Kejadian (TKP Langsung)', requiresStrictTkp: true, keterangan: 'Penyelesaian langsung di tempat kejadian perkara' },
  { key: 'KANTOR_POLISI', label: 'Ruang SPKT / Reskrim Kantor Polisi', requiresStrictTkp: false, keterangan: 'Mediasi / BAP dilanjutkan di Polsek/Polres' },
  { key: 'RUMAH_SAKIT', label: 'Instalasi Gawat Darurat / Faskes', requiresStrictTkp: false, keterangan: 'Penanganan korban luka/kesehatan di rumah sakit' },
  { key: 'KANTOR_KELURAHAN', label: 'Balai Desa / Kantor Kelurahan', requiresStrictTkp: false, keterangan: 'Mediasi bersama tiga pilar (Bhabinkamtibmas, Babinsa, Lurah)' },
  { key: 'LAINNYA', label: 'Lokasi Lainnya', requiresStrictTkp: false, keterangan: 'Lokasi penyelesaian lainnya' },
];

export const STANDARD_RESOLUTION_DOCUMENTS: ResolutionOptionItem[] = [
  { key: 'BAP_DAMAI', label: 'Surat Kesepakatan Damai (Restorative Justice)', keterangan: 'Perdamaian para pihak tanpa tuntutan pidana (Perpol 8/2021)' },
  { key: 'DOKUMENTASI_KONDUSIF', label: 'Dokumentasi Situasi Kamtibmas Kondusif', keterangan: 'Laporan visual situasi kembali aman terkendali' },
  { key: 'SERAH_TERIMA_BB', label: 'Berita Acara Serah Terima Barang Bukti', keterangan: 'Pengamanan barang bukti ke komando' },
  { key: 'REKAM_MEDIS', label: 'Hasil Rekam Medis / Rujukan Faskes', keterangan: 'Dokumen visum et repertum atau surat rujukan faskes' },
  { key: 'BERITA_ACARA_PENUTUPAN', label: 'Berita Acara Penutupan Perkara SPKT', keterangan: 'Penutupan laporan administrasi SPKT' },
  { key: 'DOKUMEN_LAINNYA', label: 'Dokumen Pendukung Lainnya', keterangan: 'Surat atau dokumentasi pendukung lainnya' },
];

/**
 * Helper: Penjelasan label resmi dokumen penyelesaian perkara.
 */
export function getResolutionDocumentLabel(key?: string | null): string {
  switch (key?.toUpperCase()) {
    case 'BAP_DAMAI':
      return 'Surat Kesepakatan Damai (Restorative Justice)';
    case 'REKAM_MEDIS':
      return 'Hasil Rekam Medis / Rujukan Faskes';
    case 'SERAH_TERIMA_BB':
      return 'Berita Acara Serah Terima Barang Bukti';
    case 'DOKUMENTASI_KONDUSIF':
      return 'Dokumentasi Situasi Kamtibmas Kondusif';
    case 'BERITA_ACARA_PENUTUPAN':
      return 'Berita Acara Penutupan Perkara SPKT';
    case 'KONSULTASI_SELESAI':
      return 'Layanan Informasi / Konsultasi SOP 110';
    default:
      return 'Dokumen Resmi Penyelesaian';
  }
}

/**
 * Helper: Penjelasan label resmi lokasi penyelesaian perkara.
 */
export function getResolutionLocationLabel(key?: string | null): string {
  switch (key?.toUpperCase()) {
    case 'TKP':
      return 'Lokasi Kejadian (TKP Langsung)';
    case 'KANTOR_POLISI':
      return 'Ruang SPKT / Reskrim Kantor Polisi';
    case 'RUMAH_SAKIT':
      return 'Instalasi Gawat Darurat / Faskes';
    case 'KANTOR_KELURAHAN':
      return 'Balai Desa / Kantor Kelurahan';
    case 'OPERATOR_DESK':
      return 'Meja Operator CAD 110 (Layanan Konsultasi)';
    default:
      return 'Lokasi Penyelesaian Lapangan';
  }
}

/**
 * Menentukan apakah suatu tiket diselesaikan langsung di meja operator 110 (Layanan Konsultasi/SOP)
 * tanpa melibatkan pergerakan unit patroli ke lapangan.
 */
export function isDeskResolvedComplaint(complaint?: {
  isDeskResolved?: boolean;
  resolutionLocationKey?: string | null;
  resolutionDocumentKey?: string | null;
  status?: string;
  dispatches?: any[] | null;
} | null): boolean {
  if (!complaint) return false;
  return Boolean(
    complaint.isDeskResolved ||
    complaint.resolutionLocationKey === 'OPERATOR_DESK' ||
    complaint.resolutionDocumentKey === 'KONSULTASI_SELESAI' ||
    (complaint.status === 'SELESAI' && (!complaint.dispatches || complaint.dispatches.length === 0))
  );
}

