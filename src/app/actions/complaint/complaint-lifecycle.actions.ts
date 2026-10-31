'use server';

import { UseCaseFactory } from '@/application/factories/use-case.factory';
import { ComplaintStatus, UrgensiLevel } from '@/domain/entities/complaint.entity';
import { getComplaintActionPermissions, calculateComplaintSlaTargetMinutes } from '@/domain/rules/complaint.rules';
import { ComplaintNotificationDispatcher } from '@/application/services/complaint-notification.service';
import { requireRole } from '@/lib/session';
import { validateBase64ImagePayload } from '@/infrastructure/security/file-security.service';
import {
  getComplaintRepo,
  prisma,
  safeRevalidatePath,
  serializeBigInt,
} from './complaint-common';

export async function fieldStepAction(input: {
  complaintId: string;
  step:
    | 'DISPATCHED'
    | 'DEPARTED'
    | 'ARRIVED'
    | 'REPORT_SUBMITTED'
    | 'COMPLETED';
  officerId: string;
  catatan?: string;
  fotoBuktiUrl?: string;
  evidencesList?: any[];
  lat?: number;
  lng?: number;
  isDiscrepancy?: boolean;
  deviationMeters?: number;
  warningMessage?: string;
  photoAddress?: string;
  resolutionLocationId?: number | null;
  resolutionLocationKey?: string | null;
  resolutionLocationName?: string | null;
  resolutionDocumentId?: number | null;
  resolutionDocumentKey?: string | null;
  resolutionDocumentName?: string | null;
}) {
  const auth = await requireRole(['PERSONIL', 'SUPERADMIN']);
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  // Validasi Integritas Foto Bukti Penanganan TKP (Maksimal 5MB, Magic Bytes, Format Sah)
  if (input.fotoBuktiUrl) {
    const vFoto = validateBase64ImagePayload(input.fotoBuktiUrl);
    if (!vFoto.valid) {
      return { success: false, error: 'Foto bukti tindakan lapangan tidak valid: ' + vFoto.error };
    }
  }

  try {
    let resolvedOfficerId = BigInt(input.officerId);
    try {
      const po = await prisma.policeOfficer.findFirst({
        where: {
          OR: [
            { id: resolvedOfficerId },
            { user_id: resolvedOfficerId },
            ...(auth.user?.identifier ? [{ nrp: auth.user.identifier }] : []),
          ],
        },
        select: { id: true },
      });
      if (po) {
        resolvedOfficerId = po.id;
      }
    } catch (_) {}

    const useCase = UseCaseFactory.getFieldStepActionUseCase();
    const result = await useCase.execute({
      complaintId: BigInt(input.complaintId),
      step: input.step,
      officerId: resolvedOfficerId,
      catatan: input.catatan,
      fotoBuktiUrl: input.fotoBuktiUrl,
      evidencesList: input.evidencesList,
      lat: input.lat,
      lng: input.lng,
      isDiscrepancy: input.isDiscrepancy,
      deviationMeters: input.deviationMeters,
      warningMessage: input.warningMessage,
      photoAddress: input.photoAddress,
      resolutionLocationId: input.resolutionLocationId,
      resolutionLocationKey: input.resolutionLocationKey,
      resolutionLocationName: input.resolutionLocationName,
      resolutionDocumentId: input.resolutionDocumentId,
      resolutionDocumentKey: input.resolutionDocumentKey,
      resolutionDocumentName: input.resolutionDocumentName,
    });
    safeRevalidatePath();
    return { success: true, data: serializeBigInt(result.toJSON()) };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal memperbarui tahapan penanganan.' };
  }
}

export async function submitRatingAction(input: {
  nomorTiket: string;
  rating: number;
  review?: string;
  tags?: string;
  token?: string;
}) {
  try {
    if (process.env.NODE_ENV !== 'production' && process.env.SIMAPRES_BYPASS_AUTH === 'true') {
      // Test environment bypass
    } else {
      const { verifyTrackingToken } = await import('@/lib/tracking-token');
      const isValid = input.token ? verifyTrackingToken(input.nomorTiket, input.token) : false;
      if (!isValid) {
        return {
          success: false,
          error: 'Akses ditolak: Token autentikasi pelacakan warga tidak valid untuk memberikan penilaian.',
        };
      }
    }

    const useCase = UseCaseFactory.getSubmitRatingUseCase();
    const result = await useCase.execute(input);
    safeRevalidatePath();
    return { success: true, data: serializeBigInt(result.toJSON()) };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal mengirim ulasan rating.' };
  }
}


export async function updateComplaintStatusAction(input: {
  complaintId: string;
  status: ComplaintStatus;
  catatan?: string;
  pawasUserId?: string;
}) {
  const auth = await requireRole(['OPERATOR', 'PAWAS', 'SUPERADMIN']);
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  try {
    const repo = UseCaseFactory.getComplaintRepository();
    const complaint = await repo.findById(BigInt(input.complaintId));
    if (!complaint) return { success: false, error: 'Pengaduan tidak ditemukan.' };

    // Evaluasi izin aksi menggunakan Domain Rules murni
    const permissions = getComplaintActionPermissions({
      status: complaint.status,
      tahap: complaint.tahap,
      role: auth.user.role,
    });

    if (input.status.toUpperCase() === 'SELESAI') {
      if (!permissions.canApproveResolution && auth.user.role !== 'SUPERADMIN') {
        return {
          success: false,
          error: `Pengesahan penyelesaian kasus ditolak: Tiket berstatus ${complaint.status} belum dapat disahkan oleh Pawas.`,
        };
      }
      complaint.selesaikanKasus(input.catatan);
    }
    if (input.status.toUpperCase() === 'DITOLAK') {
      if (!permissions.canRejectTicket && !permissions.canRejectResolution && auth.user.role !== 'SUPERADMIN') {
        return {
          success: false,
          error: `Penolakan tiket tidak diizinkan: Tiket berstatus ${complaint.status} tidak dapat ditolak.`,
        };
      }
      (complaint as any).props.status = 'DITOLAK';
      (complaint as any).props.alasanTolak = input.catatan || 'Laporan ditolak oleh Pawas';

      // proxy via IComplaintRepository
      const actorName = auth.user.fullName;
      const actorRole = auth.user.role;

      await prisma.$transaction(async (tx) => {
        await tx.complaint.update({
          where: { id: BigInt(input.complaintId) },
          data: {
            status: 'DITOLAK',
            status_id: 5,
            alasan_tolak: input.catatan || 'Laporan ditolak oleh Pawas',
          },
        });

        await tx.complaintAuditLog.create({
          data: {
            complaint_id: BigInt(input.complaintId),
            actor_name: actorName,
            actor_role: actorRole,
            action: 'REJECT_REPORT',
            notes: `Laporan Ditolak: ${input.catatan || '-'}`,
          },
        });
      });
    }
    if (input.pawasUserId) {
      (complaint as any).props.pawasValidasiId = BigInt(input.pawasUserId);
    }
    const updated = await repo.update(complaint);
    safeRevalidatePath('/console');
    return { success: true, data: serializeBigInt(updated.toJSON()) };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal memperbarui status pengaduan.' };
  }
}


/**
 * Pengesahan Kasus Selesai oleh Pawas Pasca Pemeriksaan BAP
 */
export async function sahkanKasusPawasAction(input: {
  complaintId: string;
  pawasNama: string;
  pawasUserId?: string;
  catatanPengesahan?: string;
}) {
  const auth = await requireRole(['PAWAS', 'SUPERADMIN']);
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  try {
    // proxy via IComplaintRepository
    const complaintIdBig = BigInt(input.complaintId);

    await prisma.$transaction(async (tx) => {
      await tx.complaint.update({
        where: { id: complaintIdBig },
        data: {
          status: 'SELESAI',
          status_id: 4,
          tahap: 5,
        },
      });

      // Update status dispatch
      await tx.complaintDispatch.updateMany({
        where: { complaint_id: complaintIdBig },
        data: {
          dispatch_status: 'COMPLETED',
          dispatch_status_id: 5,
          completed_at: new Date(),
        },
      });

      // Catat Audit Log
      const actorName = auth.user.fullName ? auth.user.fullName : (input.pawasNama ? input.pawasNama : 'Pawas 110');
      const actorRole = auth.user.role ? auth.user.role : 'PAWAS';

      const compLocation = await tx.complaint.findUnique({
        where: { id: complaintIdBig },
        select: { tkp_lat: true, tkp_lng: true },
      });

      await tx.complaintAuditLog.create({
        data: {
          complaint_id: complaintIdBig,
          actor_name: actorName,
          actor_role: actorRole,
          action: 'COMPLAINT_COMPLETED',
          notes: input.catatanPengesahan || 'Pengesahan BAP dan penyelesaian kasus disahkan Pawas.',
          action_lat: compLocation?.tkp_lat ?? null,
          action_lng: compLocation?.tkp_lng ?? null,
        },
      });
    }, {
      maxWait: 10000,
      timeout: 20000,
    });

    safeRevalidatePath();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal mengesahkan kasus.' };
  }
}


/**
 * Scan QR Code Armada untuk Check-in / Check-out Personil
 */
export async function scanArmadaQrAction(input: {
  qrToken: string;
  officerNrp: string;
  scanLat: number;
  scanLng: number;
  aksi: 'CHECK_IN' | 'CHECK_OUT';
  catatanKondisi?: string;
}) {
  const auth = await requireRole(['PERSONIL', 'SUPERADMIN']);
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  try {
    // proxy via IComplaintRepository

    const vehicle = await prisma.patrolVehicle.findUnique({
      where: { qr_token: input.qrToken },
    });

    if (!vehicle) {
      return { success: false, error: 'QR Code Armada tidak dikenali / tidak terdaftar di sistem SIMOPMAS 110.' };
    }

    const officer = await prisma.policeOfficer.findUnique({
      where: { nrp: input.officerNrp },
      include: { user: true },
    });

    if (!officer) {
      return { success: false, error: 'Data personil tidak ditemukan.' };
    }

    if (input.aksi === 'CHECK_IN') {
      const res = await prisma.$transaction(async (tx) => {
        // Perbarui sesi pemakaian
        await tx.patrolVehicle.update({
          where: { id: vehicle.id },
          data: {
            driver_officer_id: officer.id,
            driver_officer_nrp: officer.nrp,
            current_lat: input.scanLat,
            current_lng: input.scanLng,
            status_operasional: 'PATROLI',
            status_color: '#10B981',
            last_heartbeat_at: new Date(),
          },
        });

        // Update armada yang ditugaskan ke personil
        await tx.policeOfficer.update({
          where: { id: officer.id },
          data: {
            assigned_patrol_vehicle: vehicle.nomor_lambung,
            duty_status: 'DINAS_PATROLI',
            current_gps_lat: input.scanLat,
            current_gps_lng: input.scanLng,
            last_gps_heartbeat_at: new Date(),
          },
        });

        // Catat log sesi pemakaian
        await tx.vehicleUsageLog.create({
          data: {
            vehicle_id: vehicle.id,
            officer_id: officer.id,
            check_in_lat: input.scanLat,
            check_in_lng: input.scanLng,
            status_sesi: 'ACTIVE',
            catatan_kondisi: input.catatanKondisi || '',
          },
        });

        return {
          success: true,
          message: `✓ Berhasil Check-in! Anda resmi mengawaki armada ${vehicle.nama_armada} (${vehicle.nomor_lambung}).`,
          data: { vehicle, officer: { nrp: officer.nrp, nama: officer.user.full_name } },
        };
      });

      return res;
    } else {
      // CHECK_OUT
      const res = await prisma.$transaction(async (tx) => {
        await tx.patrolVehicle.update({
          where: { id: vehicle.id },
          data: {
            driver_officer_id: null,
            driver_officer_nrp: null,
            current_lat: input.scanLat,
            current_lng: input.scanLng,
            status_operasional: 'SIAGA',
            status_color: '#2563EB',
            last_heartbeat_at: new Date(),
          },
        });

        await tx.policeOfficer.update({
          where: { id: officer.id },
          data: {
            assigned_patrol_vehicle: null,
            duty_status: 'LEPAS_DINAS',
          },
        });

        // Tutup sesi pemakaian aktif
        await tx.vehicleUsageLog.updateMany({
          where: {
            vehicle_id: vehicle.id,
            officer_id: officer.id,
            status_sesi: 'ACTIVE',
          },
          data: {
            check_out_at: new Date(),
            check_out_lat: input.scanLat,
            check_out_lng: input.scanLng,
            status_sesi: 'COMPLETED',
            catatan_kondisi: input.catatanKondisi,
          },
        });

        return {
          success: true,
          message: `✓ Berhasil Check-out! Armada ${vehicle.nomor_lambung} telah dilepas dan siap untuk piket selanjutnya.`,
        };
      });

      return res;
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal memproses pemindaian armada.' };
  }
}
