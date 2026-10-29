/**
 * SIMAPRES 110 - DOMAIN RULES: PENGADUAN & CAD DISPATCH
 * Lapisan: Domain (Pure TypeScript, Zero External Framework Dependencies)
 *
 * Standar Aturan 11 RULES.md:
 * - Pure Functions deterministik (tanpa DB, tanpa Next.js/React).
 * - Berbagi pakai (Shared Contract): digunakan Klien (UI) untuk status tombol
 *   dan Server (Actions/Use Cases) untuk validasi otoritatif.
 */

export type ComplaintStatus =
  | 'MENUNGGU'
  | 'DIPROSES'
  | 'MENUNGGU_PENGESAHAN'
  | 'SELESAI'
  | 'DITOLAK'
  | string;

export type UrgensiLevel = 'DARURAT' | 'SEDANG' | 'NORMAL' | string;

export type UserRole =
  | 'SUPERADMIN'
  | 'PAWAS'
  | 'OPERATOR'
  | 'PERSONIL'
  | 'LOGISTIK'
  | 'WARGA'
  | string;

export interface ComplaintActionContext {
  status: ComplaintStatus;
  tahap?: number | null;
  role?: UserRole | null;
  isAssignedOfficer?: boolean;
  isDisposed?: boolean;
  hasResolutionDocument?: boolean;
  dispatchStatus?: string | null;
}

export interface ComplaintActionPermissions {
  canDispatch: boolean;
  canReassign: boolean;
  canAcceptDispatch: boolean;
  canStartMeluncur: boolean;
  canArriveTkp: boolean;
  canSubmitTindakan: boolean;
  canRequestPawasApproval: boolean;
  canApproveResolution: boolean;
  canRejectResolution: boolean;
  canRejectTicket: boolean;
  canEscalate: boolean;
  canRateIKM: boolean;
}

/**
 * Matriks aturan State Machine & RBAC untuk menentukan aksi operasional
 * apa saja yang diizinkan untuk tiket pengaduan tertentu.
 *
 * Standar Lifecycle SIMAPRES 110:
 * - Tahap 1: Verifikasi / Antrean (MENUNGGU)
 * - Tahap 2: Disposisi diterima / Persiapan Personil (DIPROSES, DISPATCHED)
 * - Tahap 3: Perjalanan Meluncur ke TKP (DIPROSES, DEPARTED)
 * - Tahap 4: Tiba di TKP (DIPROSES, ARRIVED)
 * - Tahap 5: Tindakan Penanganan & BAP Selesai (DIPROSES / MENUNGGU_PENGESAHAN)
 */
export function getComplaintActionPermissions(
  context: ComplaintActionContext
): ComplaintActionPermissions {
  const {
    status,
    tahap = 0,
    role = '',
    isAssignedOfficer = false,
    dispatchStatus = '',
  } = context;

  const currentTahap = typeof tahap === 'number' ? tahap : Number(tahap) || 0;
  const isSuperadmin = role === 'SUPERADMIN';
  const isPawas = role === 'PAWAS' || isSuperadmin;
  const isOperator = role === 'OPERATOR';
  const isPersonil = role === 'PERSONIL';

  const isOperatorOrPawas = isOperator || isPawas;
  const isAssignedOrSuper = isAssignedOfficer || isSuperadmin;

  const normDispatch = String(dispatchStatus || '').toUpperCase().trim();

  // Tahap Persiapan: Sebelum Meluncur
  const isBeforeMeluncur =
    normDispatch === 'DISPATCHED' ||
    (!normDispatch && currentTahap <= 2);

  // Tahap Meluncur: Dalam perjalanan ke TKP
  const isEnRoute =
    normDispatch === 'DEPARTED' ||
    (!normDispatch && currentTahap === 3);

  // Tahap Tiba di TKP & Tindakan: Berada di TKP atau setelahnya
  const isAtTkpOrBeyond =
    normDispatch === 'ARRIVED' ||
    normDispatch === 'REPORT_SUBMITTED' ||
    normDispatch === 'COMPLETED' ||
    currentTahap >= 4;

  return {
    // 1. Operator atau Pawas dapat mendisposisikan tiket baru yang masih berstatus 'MENUNGGU'
    canDispatch: isOperatorOrPawas && status === 'MENUNGGU',

    // 2. Pawas atau Operator dapat mengalihkan (re-assign) tiket jika waktu respon habis atau personil berhalangan
    canReassign:
      isOperatorOrPawas &&
      (status === 'MENUNGGU' || (status === 'DIPROSES' && isBeforeMeluncur)),

    // 3. Personil yang ditugaskan dapat menerima tugas
    canAcceptDispatch:
      (isPersonil || isSuperadmin) &&
      status === 'MENUNGGU' &&
      isAssignedOfficer,

    // 4. Tahap 1: Meluncur ke TKP (Personel bertugas saat status DIPROSES tahap persiapan)
    canStartMeluncur:
      isAssignedOrSuper &&
      status === 'DIPROSES' &&
      isBeforeMeluncur,

    // 5. Tahap 2: Tiba di TKP (Personel bertugas saat status DIPROSES dalam perjalanan)
    canArriveTkp:
      isAssignedOrSuper &&
      status === 'DIPROSES' &&
      isEnRoute,

    // 6. Tahap 3: Tindakan kepolisian di TKP
    canSubmitTindakan:
      isAssignedOrSuper &&
      status === 'DIPROSES' &&
      isAtTkpOrBeyond,

    // 7. Tahap 4: Mengajukan penyelesaian perkara ke Pawas (Restorative Justice / Surat Berita Acara)
    canRequestPawasApproval:
      isAssignedOrSuper &&
      status === 'DIPROSES' &&
      isAtTkpOrBeyond,

    // 8. Pengesahan penyelesaian perkara oleh Pawas
    canApproveResolution:
      isPawas &&
      status === 'MENUNGGU_PENGESAHAN',

    // 9. Pawas menolak/mengembalikan berkas penyelesaian jika bukti kurang lengkap
    canRejectResolution:
      isPawas &&
      status === 'MENUNGGU_PENGESAHAN',

    // 10. Operator atau Pawas menolak tiket (misal: laporan palsu/spam/di luar yurisdiksi)
    canRejectTicket:
      isOperatorOrPawas &&
      status === 'MENUNGGU',

    // 11. Pawas dapat mengeksekusi eskalasi darurat pada tiket aktif
    canEscalate:
      isPawas &&
      ['MENUNGGU', 'DIPROSES'].includes(status),

    // 12. Pelapor/warga hanya dapat mengisi IKM jika tiket sudah berstatus 'SELESAI'
    canRateIKM: status === 'SELESAI',
  };
}

/**
 * Menghitung batas waktu respon (SLA) dalam satuan menit berdasarkan tingkat urgensi.
 * Standar Polri Presisi 110:
 * - DARURAT (Red)    : 5 Menit
 * - SEDANG  (Yellow) : 10 Menit
 * - NORMAL  (Blue)   : 15 Menit
 */
export function calculateComplaintSlaTargetMinutes(urgensi: UrgensiLevel): number {
  switch (urgensi?.toUpperCase()) {
    case 'DARURAT':
      return 5;
    case 'SEDANG':
      return 10;
    case 'NORMAL':
    default:
      return 15;
  }
}

/**
 * Mengecek apakah waktu respon tiket telah melampaui batas SLA (breached).
 */
export function isComplaintSlaBreached(
  disposisiAt: Date | string | null | undefined,
  urgensi: UrgensiLevel,
  nowMs = Date.now()
): boolean {
  if (!disposisiAt) return false;
  const startMs = new Date(disposisiAt).getTime();
  if (isNaN(startMs)) return false;

  const targetMinutes = calculateComplaintSlaTargetMinutes(urgensi);
  const targetMs = targetMinutes * 60 * 1000;
  return nowMs - startMs > targetMs;
}

/**
 * Menghitung sisa waktu SLA dalam detik (bisa bernilai negatif jika sudah lewat batas).
 */
export function getComplaintSlaRemainingSeconds(
  disposisiAt: Date | string | null | undefined,
  urgensi: UrgensiLevel,
  nowMs = Date.now()
): number {
  if (!disposisiAt) return 0;
  const startMs = new Date(disposisiAt).getTime();
  if (isNaN(startMs)) return 0;

  const targetMinutes = calculateComplaintSlaTargetMinutes(urgensi);
  const totalAllowedSeconds = targetMinutes * 60;
  const elapsedSeconds = Math.floor((nowMs - startMs) / 1000);

  return totalAllowedSeconds - elapsedSeconds;
}

export type SlaStatusCategory = 'AMAN' | 'MENDEKATI_BATAS' | 'TERLEWAT';

/**
 * Mengelompokkan status waktu respon ke dalam kategori visual untuk konsol Pawas & Operator.
 */
export function getComplaintSlaStatusCategory(
  disposisiAt: Date | string | null | undefined,
  urgensi: UrgensiLevel,
  nowMs = Date.now()
): SlaStatusCategory {
  const remainingSeconds = getComplaintSlaRemainingSeconds(disposisiAt, urgensi, nowMs);
  if (remainingSeconds <= 0) return 'TERLEWAT';
  if (remainingSeconds <= 120) return 'MENDEKATI_BATAS'; // Sisa <= 2 menit
  return 'AMAN';
}

/**
 * Menentukan apakah suatu kejadian tergolong insiden darurat tinggi (SOS / Kontijensi).
 */
export function isEmergencyIncident(urgensi: UrgensiLevel, jenisKejadian = ''): boolean {
  if (urgensi?.toUpperCase() === 'DARURAT') return true;
  const normalized = jenisKejadian.toLowerCase();
  const emergencyKeywords = [
    'begal',
    'senpi',
    'senjata',
    'pembunuhan',
    'tawuran',
    'perampokan',
    'kebakaran',
    'bencana',
    'penyanderaan',
    'teror',
  ];
  return emergencyKeywords.some((keyword) => normalized.includes(keyword));
}

/**
 * Helper pemformatan label tahapan CAD untuk presentasi konsol.
 */
export function getTahapCadLabel(tahap?: number | null): string {
  switch (tahap) {
    case 1:
      return '1. Meluncur ke TKP';
    case 2:
      return '2. Tiba di TKP';
    case 3:
      return '3. Tindakan Kepolisian';
    case 4:
      return '4. Penyelesaian Perkara';
    default:
      return '0. Menunggu Disposisi Unit';
  }
}
