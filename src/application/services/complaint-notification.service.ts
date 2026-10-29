/**
 * SIMAPRES 110 - APPLICATION SERVICE: COMPLAINT NOTIFICATION DISPATCHER
 * Lapisan: Application (Orkestrator Kebijakan Domain ke Adapter Eksternal)
 *
 * Standar Aturan 11 RULES.md:
 * - Menjembatani Domain Notification Policy ke WhatsApp Gateway & Database Audit Log.
 * - Berjalan secara non-blocking (asynchronous background) agar tidak memperlambat respon antarmuka.
 */

import {
  evaluateComplaintNotificationPolicy,
  ComplaintNotificationEvent,
  ComplaintNotificationContext,
} from '@/domain/rules/notification.rules';

export class ComplaintNotificationDispatcher {
  /**
   * Mengeksekusi pengiriman notifikasi dan audit log secara non-blocking
   * berdasarkan evaluasi kebijakan domain murni (Domain Notification Policy).
   */
  public static dispatchAsync(
    complaintId: bigint | number | string | undefined,
    event: ComplaintNotificationEvent,
    context: ComplaintNotificationContext
  ): void {
    const policy = evaluateComplaintNotificationPolicy(event, context);

    // Jalankan secara asynchronous tanpa memblokir thread server action utama
    (async () => {
      try {
        let sendResultStatusText = 'Tidak Dikirim (Nomor Kosong/Tidak Valid)';

        if (policy.shouldNotifyCitizen && policy.cleanCitizenPhone) {
          const { WhatsAppService } = await import('@/infrastructure/services/whatsapp.service');
          const res = await WhatsAppService.sendTicketNotification({
            nomorTiket: context.nomorTiket,
            pelaporNama: context.pelaporNama || undefined,
            pelaporHp: policy.cleanCitizenPhone,
            jenisKejadian: context.jenisKejadian || undefined,
            tkpAlamatTeks: context.tkpAlamatTeks || undefined,
          });
          sendResultStatusText = res.statusText;
        }

        // Catat Audit Trail secara konsisten ke tabel complaint_audit_logs jika complaintId tersedia
        if (complaintId && policy.shouldNotifyCitizen) {
          const { prisma } = await import('@/infrastructure/db/prisma.client');
          const parsedId = typeof complaintId === 'bigint' ? complaintId : BigInt(complaintId);
          await prisma.complaintAuditLog.create({
            data: {
              complaint_id: parsedId,
              actor_name: policy.auditLog.actorName,
              actor_role: policy.auditLog.actorRole,
              action: policy.auditLog.action,
              notes: policy.auditLog.buildNotes(sendResultStatusText),
            },
          }).catch(() => {});
        }
      } catch (err) {
        console.warn('[ComplaintNotificationDispatcher] Gagal memproses notifikasi background:', err);
      }
    })();
  }
}
