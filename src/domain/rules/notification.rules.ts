/**
 * SIMAPRES 110 - DOMAIN RULES: NOTIFIKASI & AUDIT LOG POLICY
 * Lapisan: Domain (Pure TypeScript, Zero Framework Dependencies)
 *
 * Standar Aturan 11 RULES.md:
 * - Menghilangkan penulisan hardcoded inline notifikasi WhatsApp.
 * - Memisahkan kebijakan pemicu notifikasi dan audit log ke dalam pure policy function.
 */

export type ComplaintNotificationEvent =
  | 'TICKET_CREATED'
  | 'OFFICER_DISPATCHED'
  | 'OFFICER_ARRIVED'
  | 'CASE_RESOLVED'
  | 'ALARM_ESCALATED';

export interface ComplaintNotificationContext {
  nomorTiket: string;
  pelaporNama?: string | null;
  pelaporHp?: string | null;
  jenisKejadian?: string | null;
  tkpAlamatTeks?: string | null;
  assignedOfficerName?: string | null;
  assignedOfficerHp?: string | null;
  patrolVehicleName?: string | null;
  escalationReason?: string | null;
  actorName?: string;
  actorRole?: string;
}

export interface ComplaintNotificationDecision {
  shouldNotifyCitizen: boolean;
  shouldNotifyOfficer: boolean;
  cleanCitizenPhone: string | null;
  cleanOfficerPhone: string | null;
  event: ComplaintNotificationEvent;
  auditLog: {
    actorName: string;
    actorRole: string;
    action: string;
    buildNotes: (statusText: string) => string;
  };
}

/**
 * Membersihkan format nomor telepon Indonesia (menghilangkan spasi, strip, dan karakter non-angka).
 */
export function sanitizePhoneNumber(phone?: string | null): string {
  if (!phone) return '';
  const trimmed = phone.trim();
  if (trimmed === '-' || trimmed === '0' || trimmed.toLowerCase() === 'null') return '';
  return trimmed.replace(/\D/g, '');
}

/**
 * Validasi apakah nomor telepon layak untuk dikirimi pesan WhatsApp resmi.
 */
export function isValidIndonesianPhoneNumber(phone?: string | null): boolean {
  const clean = sanitizePhoneNumber(phone);
  // Nomor HP Indonesia minimal 9 digit (misal: 081234567 atau 6281234567) dan maksimal 15 digit
  return clean.length >= 9 && clean.length <= 15;
}

/**
 * Pure Domain Policy: Mengevaluasi apakah suatu event pengaduan harus memicu
 * notifikasi WhatsApp ke warga / personil serta menentukan rincian audit log yang wajib dicatat.
 */
export function evaluateComplaintNotificationPolicy(
  event: ComplaintNotificationEvent,
  context: ComplaintNotificationContext
): ComplaintNotificationDecision {
  const cleanCitizenPhone = isValidIndonesianPhoneNumber(context.pelaporHp)
    ? sanitizePhoneNumber(context.pelaporHp)
    : null;

  const cleanOfficerPhone = isValidIndonesianPhoneNumber(context.assignedOfficerHp)
    ? sanitizePhoneNumber(context.assignedOfficerHp)
    : null;

  const actor = context.actorName || 'Sistem Gateway WhatsApp';
  const role = context.actorRole || 'SYSTEM';

  switch (event) {
    case 'TICKET_CREATED':
      return {
        shouldNotifyCitizen: cleanCitizenPhone !== null,
        shouldNotifyOfficer: false,
        cleanCitizenPhone,
        cleanOfficerPhone: null,
        event,
        auditLog: {
          actorName: actor,
          actorRole: role,
          action: 'WHATSAPP_NOTIFICATION',
          buildNotes: (statusText) =>
            `Notifikasi registrasi tiket dan tautan radar pelacakan dikirim ke ${cleanCitizenPhone}. Status: ${statusText}`,
        },
      };

    case 'OFFICER_DISPATCHED':
      return {
        shouldNotifyCitizen: cleanCitizenPhone !== null,
        shouldNotifyOfficer: cleanOfficerPhone !== null,
        cleanCitizenPhone,
        cleanOfficerPhone,
        event,
        auditLog: {
          actorName: actor,
          actorRole: role,
          action: 'WHATSAPP_DISPATCH_ALERT',
          buildNotes: (statusText) =>
            `Notifikasi penugasan unit ${context.patrolVehicleName || ''} dikirim ke personil (${context.assignedOfficerName || ''}). Status: ${statusText}`,
        },
      };

    case 'OFFICER_ARRIVED':
      return {
        shouldNotifyCitizen: cleanCitizenPhone !== null,
        shouldNotifyOfficer: false,
        cleanCitizenPhone,
        cleanOfficerPhone: null,
        event,
        auditLog: {
          actorName: actor,
          actorRole: role,
          action: 'WHATSAPP_ARRIVAL_NOTIFICATION',
          buildNotes: (statusText) =>
            `Notifikasi kehadiran unit patroli di lokasi TKP dikirim ke pelapor (${cleanCitizenPhone}). Status: ${statusText}`,
        },
      };

    case 'CASE_RESOLVED':
      return {
        shouldNotifyCitizen: cleanCitizenPhone !== null,
        shouldNotifyOfficer: false,
        cleanCitizenPhone,
        cleanOfficerPhone: null,
        event,
        auditLog: {
          actorName: actor,
          actorRole: role,
          action: 'WHATSAPP_RESOLUTION_SURVEY',
          buildNotes: (statusText) =>
            `Notifikasi penyelesaian perkara dan tautan survei kepuasan (IKM) dikirim ke ${cleanCitizenPhone}. Status: ${statusText}`,
        },
      };

    case 'ALARM_ESCALATED':
    default:
      return {
        shouldNotifyCitizen: false,
        shouldNotifyOfficer: cleanOfficerPhone !== null,
        cleanCitizenPhone: null,
        cleanOfficerPhone,
        event,
        auditLog: {
          actorName: actor,
          actorRole: role,
          action: 'WHATSAPP_ESCALATION_ALARM',
          buildNotes: (statusText) =>
            `Peringatan eskalasi Mako 110: ${context.escalationReason || 'Waktu respon habis'}. Status: ${statusText}`,
        },
      };
  }
}
