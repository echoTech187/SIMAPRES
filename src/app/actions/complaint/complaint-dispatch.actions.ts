'use server';

import { UseCaseFactory } from '@/application/factories/use-case.factory';
import { ComplaintStatus, UrgensiLevel } from '@/domain/entities/complaint.entity';
import { getComplaintActionPermissions, calculateComplaintSlaTargetMinutes } from '@/domain/rules/complaint.rules';
import { ComplaintNotificationDispatcher } from '@/application/services/complaint-notification.service';
import { reverseGeocodeCoords, isGenericOrCoordinateAddress } from '@/infrastructure/services/reverse-geocode.service';
import { requireRole } from '@/lib/session';
import { getCrossJurisdictionTimeoutMinutes } from '@/lib/escalation-config';
import {
  getComplaintRepo,
  prisma,
  safeRevalidatePath,
  serializeBigInt,
} from './complaint-common';
import { getActiveSpktDutyDetails, getActiveSpktDutyOfficerPhone } from './complaint-query.actions';

/**
 * One-Tap Quick Accept Disposisi melalui WhatsApp Link (Personel Lapangan / Piket Polsek)
 */
export async function quickAcceptComplaintDispatchAction(input: {
  nomorTiket: string;
  role: 'OFFICER' | 'POLSEK';
  recipientName?: string;
  crewPartnerName?: string;
  vehicleId?: number;
  notes?: string;
}) {
  const auth = await requireRole(['PERSONIL', 'PAWAS', 'OPERATOR', 'SUPERADMIN']);
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  try {
    // proxy via IComplaintRepository
    const cleanTiket = (input.nomorTiket || '').replace(/^#+/, '').trim();
    const complaint = await prisma.complaint.findUnique({
      where: { nomor_tiket: cleanTiket },
      include: {
        station: true,
        dispatches: {
          include: {
            officer: { include: { user: true } },
            unit: true,
          },
        },
      },
    });

    if (!complaint) {
      return { success: false, error: 'Tiket pengaduan tidak ditemukan.' };
    }

    const now = new Date();
    // Cek apakah sudah pernah diterima oleh petugas mana pun
    const alreadyAccepted: any = complaint.dispatches.find((d: any) => d.accepted_at !== null);
    if (alreadyAccepted) {
      const accepter = alreadyAccepted.crew_leader_name || alreadyAccepted.officer?.user?.full_name || 'Petugas Siaga';
      return {
        success: true,
        alreadyAccepted: true,
        message: `Tiket ini telah diterima oleh ${accepter} pada ${new Date(alreadyAccepted.accepted_at!).toLocaleTimeString('id-ID')} WIB.`,
      };
    }

    const primaryDispatch = complaint.dispatches.find((d: any) => d.is_primary_unit) || complaint.dispatches[0];
    if (!primaryDispatch) {
      return { success: false, error: 'Disposisi tiket tidak ditemukan.' };
    }

    const actorLabel = input.recipientName?.trim() || (input.role === 'POLSEK' ? `Piket ${complaint.station?.station_name || 'Polsek'}` : 'Personel Patroli 110');
    const partnerLabel = input.crewPartnerName?.trim() || '';

    // 3.B: Rekalkulasi Audit BBM dengan Profil Kendaraan Terpilih
    let vehicleFuelUpdate: any = {};
    if (input.vehicleId && complaint.station?.office_lat && complaint.station?.office_lng && complaint.tkp_lat && complaint.tkp_lng) {
      try {
        const { FuelAuditService } = await import('@/infrastructure/services/fuel-audit.service');
        const calc = await FuelAuditService.calculateDispatchFuelUsage(
          Number(complaint.station.office_lat),
          Number(complaint.station.office_lng),
          Number(complaint.tkp_lat),
          Number(complaint.tkp_lng),
          input.vehicleId
        );
        vehicleFuelUpdate = {
          round_trip_km: calc.roundTripKm,
          fuel_liters_used: calc.fuelLitersUsed,
          fuel_cost_estimated: calc.fuelCostEstimated,
          assigned_vehicle_id: input.vehicleId,
        };
      } catch (fErr) {
        console.warn('[QuickAccept Fuel Audit Calc Error]:', fErr);
      }
    } else if (input.vehicleId) {
      vehicleFuelUpdate = { assigned_vehicle_id: input.vehicleId };
    }

    await prisma.$transaction(async (tx) => {
      // Tandai dispatch sebagai diterima dan langsung berangkat meluncur
      await (tx as any).complaintDispatch.update({
        where: { id: primaryDispatch.id },
        data: {
          accepted_at: now,
          dispatch_status: 'DEPARTED',
          dispatch_status_id: 2,
          crew_leader_name: input.recipientName?.trim() || null,
          crew_partner_name: partnerLabel || null,
          ...vehicleFuelUpdate,
          tactical_orders: (primaryDispatch.tactical_orders || '') + ` | Diterima via Quick-Accept WA oleh ${actorLabel}${partnerLabel ? ` bersama ${partnerLabel}` : ''}`,
        } as any,
      });

      // Bersihkan entri dispatch belum terisi lainnya (mode broadcast kuota 1)
      await tx.complaintDispatch.deleteMany({
        where: {
          complaint_id: complaint.id,
          id: { not: primaryDispatch.id },
          accepted_at: null,
        },
      });

      // Update status complaint menjadi DIPROSES (Tahap 2: Menuju TKP)
      await tx.complaint.update({
        where: { id: complaint.id },
        data: {
          status: 'DIPROSES',
          status_id: 2,
          tahap: 2,
        },
      });

      // Catat Audit Log
      await tx.complaintAuditLog.create({
        data: {
          complaint_id: complaint.id,
          actor_name: actorLabel,
          actor_role: input.role === 'POLSEK' ? 'POLSEK' : 'PERSONIL',
          action: 'QUICK_ACCEPT_WA',
          notes: `Tugas diterima cepat melalui One-Tap Link WhatsApp oleh ${actorLabel}${partnerLabel ? ` & ${partnerLabel} (Regu Patroli)` : ''}. Status beralih ke MELUNCUR (DEPARTED). Timer eskalasi Mako dihentikan.`,
        },
      });
    });

    safeRevalidatePath('/console');
    safeRevalidatePath('/tracking');

    return {
      success: true,
      message: `Konfirmasi berhasil! Tugas telah diterima oleh ${actorLabel} dan status tim sedang bergerak menuju TKP.`,
    };
  } catch (err: any) {
    console.error('Error in quickAcceptComplaintDispatchAction:', err);
    return { success: false, error: err.message || 'Gagal memproses konfirmasi tiket.' };
  }
}

export async function dispatchComplaintAction(input: {
  complaintId: string;
  assignedOfficerId: string;
  pawasUserId: string;
  arahanPawas?: string;
}) {
  const auth = await requireRole(['OPERATOR', 'PAWAS', 'SUPERADMIN']);
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  try {
    const useCase = UseCaseFactory.getDispatchComplaintUseCase();
    const result = await useCase.execute({
      complaintId: BigInt(input.complaintId),
      assignedOfficerId: BigInt(input.assignedOfficerId),
      pawasUserId: BigInt(input.pawasUserId),
      arahanPawas: input.arahanPawas,
    });
    safeRevalidatePath();
    return { success: true, data: serializeBigInt(result.toJSON()) };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal mendisposisikan pengaduan.' };
  }
}

export async function assignComplaintAction(input: {
  complaintId: string;
  officerNrp?: string;
  assignedOfficerId?: string;
  pawasUserId?: string;
  arahanPawas?: string;
}) {
  const auth = await requireRole(['OPERATOR', 'PAWAS', 'SUPERADMIN']);
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  try {
    let officerId = input.assignedOfficerId;
    if (!officerId && input.officerNrp) {
      const officerRepo = UseCaseFactory.getOfficerRepository();
      const officer = await officerRepo.findByNrp(input.officerNrp);
      if (officer && officer.id) {
        officerId = officer.id.toString();
      }
    }

    if (!officerId) throw new Error('Personel tujuan disposisi tidak ditemukan.');
    if (!input.pawasUserId) throw new Error('ID Pawas otorisasi tidak ditemukan.');

    const useCase = UseCaseFactory.getDispatchComplaintUseCase();
    const result = await useCase.execute({
      complaintId: BigInt(input.complaintId),
      assignedOfficerId: BigInt(officerId),
      pawasUserId: BigInt(input.pawasUserId),
      arahanPawas: input.arahanPawas,
    });
    // Revalidasi konsol di-skip agar tidak me-reset modal sukses disposisi
    return { success: true, data: serializeBigInt(result.toJSON()) };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal mendisposisikan pengaduan.' };
  }
}


/**
 * Disposisi Multi-Satuan oleh Pawas dengan Pencatatan Audit Trail
 */
export async function disposisiMultiSatuanAction(input: {
  complaintId: string;
  satuanKeys: string[];
  kuotaPersonel: number;
  arahanTaktis: string;
  pawasNama: string;
  pawasUserId?: string;
  estimatedDistance?: string | null;
  estimatedEta?: string | null;
}) {
  const auth = await requireRole(['OPERATOR', 'PAWAS', 'SUPERADMIN']);
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  try {
    // proxy via IComplaintRepository
    const complaintIdBig = BigInt(input.complaintId);

    const satuans = await prisma.masterOperationalUnit.findMany({
      where: { key: { in: input.satuanKeys } },
    });

    if (satuans.length === 0) {
      return { success: false, error: 'Satuan yang dipilih tidak valid.' };
    }

    const leadSatuan = satuans[0];
    const satuanNames = satuans.map((s: any) => s.short_name).join(', ');

    // Ambil koordinat TKP complaint untuk perhitungan jarak real-time
    const complaint = await prisma.complaint.findUnique({
      where: { id: complaintIdBig },
      select: { tkp_lat: true, tkp_lng: true },
    });

    const tkpLat = complaint?.tkp_lat ? Number(complaint.tkp_lat) : null;
    const tkpLng = complaint?.tkp_lng ? Number(complaint.tkp_lng) : null;

    await prisma.$transaction(async (tx) => {
      // 1. Update Complaint Status: Tetap MENUNGGU (Tahap 1) sampai ada personil yang mengklik 'Terima Tugas'
      await tx.complaint.update({
        where: { id: complaintIdBig },
        data: {
          status: 'MENUNGGU',
          status_id: 1,
          tahap: 1,
        },
      });

      // 2. Buat Dispatch Records
      for (let i = 0; i < satuans.length; i++) {
        const s = satuans[i];
        let distStr: string | null = input.estimatedDistance || null;
        let etaStr: string | null = input.estimatedEta || null;

        if (!distStr && tkpLat && tkpLng) {
          // Cari personil aktif terdekat di satuan ini yang memiliki live GPS
          const nearestOfficer = await tx.policeOfficer.findFirst({
            where: {
              unit_id: s.id,
              current_gps_lat: { not: null },
              current_gps_lng: { not: null },
            },
            select: {
              current_gps_lat: true,
              current_gps_lng: true,
            },
          });

          if (nearestOfficer?.current_gps_lat && nearestOfficer?.current_gps_lng) {
            const { HaversineService } = await import('@/infrastructure/services/haversine.service');
            const distKm = HaversineService.calculateDistanceKm(
              tkpLat,
              tkpLng,
              Number(nearestOfficer.current_gps_lat),
              Number(nearestOfficer.current_gps_lng)
            );
            distStr = `${distKm} km`;
            const etaMin = Math.max(2, Math.round((distKm / 30) * 60));
            etaStr = `± ${etaMin} Menit`;
          }
        }

        // Saat Pawas menerbitkan disposisi ke satuan, officer_id HARUS null karena belum ada personel yang menerima tugas.
        // Tabel complaint_dispatches untuk personel baru terisi satu-satu saat personel mengklik 'Terima Tugas'.
        await tx.complaintDispatch.create({
          data: {
            complaint_id: complaintIdBig,
            unit_id: s.id,
            officer_id: null,
            is_primary_unit: i === 0,
            personnel_quota: input.kuotaPersonel ?? 4,
            tactical_orders: input.arahanTaktis?.trim() || s.default_orders,
            dispatch_status_id: 1,
            dispatch_status: 'DISPATCHED',
            dispatched_at: new Date(),
            estimated_distance: distStr,
            estimated_eta: etaStr,
          },
        });
      }

      // 3. Catat Audit Log Append-Only
      const actorName = auth.user.fullName ? auth.user.fullName : (input.pawasNama ? input.pawasNama : 'Petugas 110');
      const actorRole = auth.user.role ? auth.user.role : 'OPERATOR';

      await tx.complaintAuditLog.create({
        data: {
          complaint_id: complaintIdBig,
          actor_name: actorName,
          actor_role: actorRole,
          action: 'DISPATCH_ISSUED',
          notes: `Disposisi Multi-Satuan Diterbitkan: Disiarkan ke: ${satuanNames} • Kuota: ${input.kuotaPersonel} Personel. Arahan: "${input.arahanTaktis}"`,
        },
      });
    }, {
      maxWait: 10000,
      timeout: 20000,
    });

    // 4. Background Secondary Dispatcher (WhatsApp Notifier Taktis untuk Disposisi Pawas)
    (async () => {
      try {
        const { WhatsAppService } = await import('@/infrastructure/services/whatsapp.service');
        const comp = await prisma.complaint.findUnique({
          where: { id: complaintIdBig },
          include: { station: true },
        });
        if (!comp || !comp.station_id) return;

        // A. Notifikasi ke Ka SPKT yang bertugas hari itu di Mako tersebut
        const spktDuty = await getActiveSpktDutyOfficerPhone(comp.station_id);
        if (spktDuty?.phone) {
          WhatsAppService.sendPolsekNotice({
            nomorTiket: comp.nomor_tiket || `#${complaintIdBig}`,
            polsekName: comp.station?.station_name || 'SPKT Mako',
            polsekHp: spktDuty.phone,
            jenisKejadian: comp.jenis_kejadian || 'Disposisi Pawas 110',
            urgensi: ((comp.urgensi as string) || 'SEDANG').toUpperCase() as any,
            tkpAlamatTeks: comp.tkp_alamat_teks || '-',
            tkpLat: Number(comp.tkp_lat || 0),
            tkpLng: Number(comp.tkp_lng || 0),
            pelaporNama: comp.pelapor_nama,
            pelaporHp: comp.pelapor_hp,
            ringkasan: `Disposisi Pawas ke Satuan [${satuanNames}]: ${input.arahanTaktis || comp.ringkasan_keterangan || '-'}`,
            deadlineMinutes: 3,
          }).catch((err) => console.warn('[Disposisi Auto-WA Polsek Error]:', err));
        }

        // B. Notifikasi ke Personil Lapangan di Mako tersebut yang sedang dinas/piket
        const makoOfficers = await prisma.policeOfficer.findMany({
          where: {
            station_id: comp.station_id,
            duty_status: { in: ['DINAS_PATROLI', 'PIKET_SPKT'] },
            user: { phone_number: { not: '' } },
          },
          include: { user: true },
          take: 3,
        });

        for (const off of makoOfficers) {
          if (off.user?.phone_number) {
            WhatsAppService.sendOfficerAlert({
              nomorTiket: comp.nomor_tiket || `#${complaintIdBig}`,
              officerNama: `${off.rank_pangkat} ${off.user.full_name}`,
              officerHp: off.user.phone_number,
              jenisKejadian: comp.jenis_kejadian || 'Disposisi Pawas 110',
              urgensi: ((comp.urgensi as string) || 'SEDANG').toUpperCase() as any,
              tkpAlamatTeks: comp.tkp_alamat_teks || '-',
              tkpLat: Number(comp.tkp_lat || 0),
              tkpLng: Number(comp.tkp_lng || 0),
              pelaporNama: comp.pelapor_nama,
              pelaporHp: comp.pelapor_hp,
              ringkasan: `Disposisi Pawas [${satuanNames}]: ${input.arahanTaktis || comp.ringkasan_keterangan || '-'}`,
              deadlineMinutes: 3,
            }).catch((err) => console.warn('[Disposisi Auto-WA Officer Error]:', err));
          }
        }
      } catch (e) {
        console.warn('[Disposisi WhatsApp Secondary Error]:', e);
      }
    })();

    safeRevalidatePath('/console');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal menerbitkan disposisi.' };
  }
}

/**
 * Disposisi Lintas Wilayah / E-Routing Boundary Override
 * Mengalihkan penanganan pengaduan antar-Polres/Polsek yurisdiksi tetangga secara atomik
 */
export async function transferComplaintCrossJurisdictionAction(input: {
  complaintId: string;
  targetStationId: number;
  targetStationName: string;
  transferReason?: string;
  notes?: string;
  actorName?: string;
}) {
  const auth = await requireRole(['OPERATOR', 'PAWAS', 'SUPERADMIN']);
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  try {
    // proxy via IComplaintRepository
    const complaintIdBig = BigInt(input.complaintId);

    const comp = await prisma.complaint.findUnique({
      where: { id: complaintIdBig },
      include: { station: true },
    });

    if (!comp) {
      return { success: false, error: 'Laporan pengaduan tidak ditemukan.' };
    }

    let targetStation = await prisma.policeStation.findUnique({
      where: { id: Number(input.targetStationId) },
    });

    if (!targetStation && input.targetStationName) {
      targetStation = await prisma.policeStation.findFirst({
        where: {
          OR: [
            { station_name: { contains: input.targetStationName } },
            { station_code: { contains: input.targetStationName.toUpperCase().replace(/\s+/g, '_') } },
          ],
        },
      });
    }

    if (!targetStation) {
      return { success: false, error: 'Mako / Polres tujuan tidak valid atau tidak ditemukan dalam sistem.' };
    }

    const previousStationName = comp.station?.station_name || 'Polres Pekalongan';
    const targetDuty = await getActiveSpktDutyDetails(targetStation.id);
    const nowTime = new Date();
    const deadlineMinutes = getCrossJurisdictionTimeoutMinutes();
    const expiredAt = new Date(nowTime.getTime() + deadlineMinutes * 60 * 1000);

    const dutyPiketText = `Ka SPKT: ${targetDuty.kaSpktNama}${targetDuty.dutyOfficerNames.length > 0 ? ` | Anggota: ${targetDuty.dutyOfficerNames.join(', ')}` : ''}`;
    const actorName = input.actorName ? input.actorName : (auth.user?.fullName ? auth.user.fullName : 'Operator/Pawas CAD');
    const actorRole = auth.user?.role ? auth.user.role : 'OPERATOR';

    const auditNotes =
      input.notes ||
      `[DISPOSISI LINTAS WILAYAH MASUK] Tiket: ${comp.nomor_tiket} | Kasus: ${comp.jenis_kejadian} | TKP: ${comp.tkp_alamat_teks} | Urgensi: ${comp.urgensi} | Dari: ${previousStationName} (Petugas: ${actorName}) ➔ Ke: ${targetStation.station_name} | Petugas Piket Hari Ini (${targetStation.station_name}): ${dutyPiketText} | Waktu Masuk Disposisi: ${nowTime.toLocaleString('id-ID')} | Batas Respon Expired: ${expiredAt.toLocaleString('id-ID')} | Status: MENUNGGU_RESPON_MAKO_TUJUAN | Alasan: ${input.transferReason || 'Deteksi koordinat TKP berada di luar wilayah hukum mako asal.'}`;

    const isReturningToMakoAsal = Number(targetStation.id) === 60001;

    await prisma.$transaction(async (tx) => {
      // 1. Update status & station_id complaint (jika ditarik ke Mako Asal, status kembali MENUNGGU agar siap didisposisikan mandiri)
      await tx.complaint.update({
        where: { id: complaintIdBig },
        data: {
          station_id: targetStation.id,
          status: isReturningToMakoAsal ? 'MENUNGGU' : 'DISPOSISI_LINTAS_WILAYAH',
          status_id: isReturningToMakoAsal ? 1 : 2,
          tahap: isReturningToMakoAsal ? 1 : 2,
        },
      });

      // 2. Audit Trail Resmi
      await tx.complaintAuditLog.create({
        data: {
          complaint_id: complaintIdBig,
          action: isReturningToMakoAsal ? 'PENARIKAN_KEMBALI_MAKO_ASAL' : 'DISPOSISI_LINTAS_WILAYAH',
          actor_name: actorName,
          actor_role: actorRole,
          notes: auditNotes,
          action_lat: comp.tkp_lat,
          action_lng: comp.tkp_lng,
        },
      });

      // 3. Update Station ID pada seluruh record dispatches tiket ini ke Mako Baru
      await (tx as any).complaintDispatch.updateMany({
        where: { complaint_id: complaintIdBig },
        data: {
          station_id: targetStation.id,
          escalation_deadline_at: isReturningToMakoAsal ? null : expiredAt,
          is_escalated: false,
          tactical_orders: isReturningToMakoAsal
            ? `Tiket ditarik kembali ke Mako Asal (${targetStation.station_name}) karena kesatuan yurisdiksi sebelumnya tidak memberikan respon. Segera disposisikan ke personel lapangan internal.`
            : `Disposisi Lintas Wilayah: Dialihkan ke ${targetStation.station_name}. ${input.transferReason || ''}`,
        } as any,
      }).catch(() => {});
    });

    // Invalidate micro-cache pelacakan agar tampilan warga langsung refresh seketika
    try {
      const { cacheInvalidate } = await import('@/infrastructure/cache/app-cache');
      const cleanTiket = (comp.nomor_tiket || '').replace(/^#+/, '').trim();
      if (cleanTiket) {
        cacheInvalidate(`tracking_${cleanTiket}`);
      }
      cacheInvalidate('pawas_unified_data_60001');
      cacheInvalidate('antrean_pawas_60001');
      if (targetStation.id) {
        cacheInvalidate(`pawas_unified_data_${targetStation.id}`);
        cacheInvalidate(`antrean_pawas_${targetStation.id}`);
      }
    } catch (_) {}

    // Background Secondary Dispatcher ke Ka SPKT / Petugas Piket SPKT bertugas hari ini di Mako Tujuan
    (async () => {
      try {
        const spktDuty = await getActiveSpktDutyOfficerPhone(targetStation.id);
        if (spktDuty?.phone) {
          const { WhatsAppService } = await import('@/infrastructure/services/whatsapp.service');
          await WhatsAppService.sendPolsekNotice({
            nomorTiket: comp.nomor_tiket || `#${complaintIdBig}`,
            polsekName: targetStation.station_name,
            polsekHp: spktDuty.phone,
            jenisKejadian: comp.jenis_kejadian || 'Disposisi Lintas Wilayah',
            urgensi: (comp.urgensi || 'DARURAT').toUpperCase(),
            tkpAlamatTeks: comp.tkp_alamat_teks || '',
            tkpLat: Number(comp.tkp_lat),
            tkpLng: Number(comp.tkp_lng),
            pelaporNama: comp.pelapor_nama || 'Warga',
            pelaporHp: comp.pelapor_hp || '-',
            ringkasan: `🚨 DISPOSISI LINTAS WILAYAH 110: Dialihkan dari ${previousStationName} ke ${targetStation.station_name}. Alasan: ${input.transferReason || 'Koordinat TKP berada di wilayah hukum Anda.'}`,
            deadlineMinutes: deadlineMinutes,
          });
        }
      } catch (waErr) {
        console.warn('[WA Cross Jurisdiction Notice Error]:', waErr);
      }
    })();

    safeRevalidatePath('/console');
    try {
      const { invalidatePawasUnifiedCache } = await import('@/app/actions/pawas.actions');
      await invalidatePawasUnifiedCache(targetStation.id);
    } catch (_) {}
    return {
      success: true,
      data: {
        nomorTiket: comp.nomor_tiket,
        targetStationId: targetStation.id,
        targetStationName: targetStation.station_name,
        transferredAt: new Date().toISOString(),
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal melakukan disposisi lintas wilayah.' };
  }
}

/**
 * Terima & Langsung Disposisikan ke Armada Siaga Hari Ini di Mako Tujuan
 * Digunakan oleh Operator SPKT di Mako Tujuan (misal Polresta Batang) saat menerima limpahan lintas wilayah.
 * Menghentikan suara sirine patwal, mengunci penerimaan, mencatat log resmi, dan langsung menyiarkan serentak ke personil piket.
 */
export async function acceptAndBroadcastCrossJurisdictionAction(input: {
  complaintId: string;
  actorName?: string;
  actorRole?: string;
}): Promise<{
  success: boolean;
  error?: string;
  message?: string;
}> {
  const auth = await requireRole(['OPERATOR', 'PAWAS', 'SUPERADMIN']);
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  try {
    // proxy via IComplaintRepository
    const complaintIdBig = BigInt(input.complaintId);
    const now = new Date();

    const comp = await prisma.complaint.findUnique({
      where: { id: complaintIdBig },
      include: {
        station: true,
        dispatches: { include: { unit: true } },
        complaint_logs: {
          where: { action: 'DISPOSISI_LINTAS_WILAYAH' },
          orderBy: { created_at: 'desc' },
          take: 1,
        },
      },
    });

    if (!comp) {
      return { success: false, error: 'Tiket pengaduan tidak ditemukan.' };
    }

    const targetStationId = comp.station_id || (auth.user.stationId ? Number(auth.user.stationId) : null);
    if (!targetStationId) {
      return { success: false, error: 'ID Mako tujuan tidak valid.' };
    }

    const targetStationName = comp.station?.station_name || auth.user.stationName || 'Mako Tujuan';
    const actorName = input.actorName || auth.user.fullName || 'Operator SPKT';
    const actorRole = input.actorRole || auth.user.role || 'OPERATOR';

    // Ambil data piket hari ini di Mako tujuan
    const dutyDetails = await getActiveSpktDutyDetails(targetStationId);
    const transferLog = comp.complaint_logs[0];
    const waktuMasuk = transferLog ? new Date(transferLog.created_at).toLocaleString('id-ID') : '-';
    const waktuDiterima = now.toLocaleString('id-ID');

    const dutyPiketText = `Ka SPKT: ${dutyDetails.kaSpktNama}${dutyDetails.dutyOfficerNames.length > 0 ? ` | Anggota: ${dutyDetails.dutyOfficerNames.join(', ')}` : ''}`;
    const pendisposisiAsal = transferLog?.actor_name ? `${transferLog.actor_name} (${transferLog.actor_role})` : 'Operator Mako Asal';

    const acceptNotes = `[DISPOSISI LINTAS WILAYAH DITERIMA] Tiket: ${comp.nomor_tiket} | Kasus: ${comp.jenis_kejadian} | TKP: ${comp.tkp_alamat_teks} | Urgensi: ${comp.urgensi} | Penerima Tiket: ${actorName} (${actorRole} ${targetStationName}) | Pendisposisi Mako Asal: ${pendisposisiAsal} | Petugas Piket Hari Ini (${targetStationName}): ${dutyPiketText} | Waktu Masuk: ${waktuMasuk} | Waktu Diterima: ${waktuDiterima} | Status: DITERIMA_DAN_DISIARKAN_KE_PERSONIL | Sirine Mako dihentikan, tugas disiarkan terbuka ke seluruh personil dinas aktif ${targetStationName}.`;

    await prisma.$transaction(async (tx) => {
      // 1. Status complaint beralih ke MENUNGGU (Tahap 1: Disiarkan ke Armada Patroli Mako Penerima)
      // Status baru beralih ke DIPROSES (Tahap 2) saat ada personel patroli Mako penerima yang mengklik Terima Tugas
      await tx.complaint.update({
        where: { id: complaintIdBig },
        data: {
          status: 'MENUNGGU',
          status_id: 1,
          tahap: 1,
          station_id: targetStationId,
        },
      });

      // 2. Audit Trail Resmi
      await tx.complaintAuditLog.create({
        data: {
          complaint_id: complaintIdBig,
          action: 'CROSS_JURISDICTION_ACCEPTED',
          actor_name: actorName,
          actor_role: actorRole,
          notes: acceptNotes,
          action_lat: comp.tkp_lat,
          action_lng: comp.tkp_lng,
        },
      });

      // 3. Update status dispatches: Hentikan eskalasi, bersihkan deadline eskalasi lama, arahkan ke personil Mako tujuan
      await (tx as any).complaintDispatch.updateMany({
        where: { complaint_id: complaintIdBig },
        data: {
          station_id: targetStationId,
          is_escalated: false,
          escalation_deadline_at: null,
          dispatched_at: now,
          tactical_orders: `Siaran Terbuka Mako ${targetStationName}: Disposisi resmi diterima oleh ${actorName}. Armada siaga terdekat segera klaim tugas.`,
        } as any,
      }).catch(() => {});
    });

    try {
      const { cacheInvalidate } = await import('@/infrastructure/cache/app-cache');
      cacheInvalidate(`antrean_pawas_${targetStationId}`);
      cacheInvalidate('antrean_pawas_60001');
      cacheInvalidate('antrean_pawas_all');
      cacheInvalidate(`pawas_unified_data_${targetStationId}`);
      cacheInvalidate('pawas_unified_data_60001');
      cacheInvalidate('pawas_unified_data_all');
      cacheInvalidate('recent_complaints_50');
      cacheInvalidate('recent_complaints_100');
      const cleanTiket = (comp.nomor_tiket || '').replace(/^#+/, '').trim();
      if (cleanTiket) cacheInvalidate(`tracking_${cleanTiket}`);
      const { invalidatePawasUnifiedCache } = await import('@/app/actions/pawas.actions');
      await invalidatePawasUnifiedCache(targetStationId);
      await invalidatePawasUnifiedCache(60001);
    } catch (_) {}

    safeRevalidatePath('/console');
    return {
      success: true,
      message: `Laporan resmi diterima oleh ${targetStationName} dan telah disiarkan ke seluruh armada patroli siaga hari ini.`,
    };
  } catch (err: any) {
    console.error('Error acceptAndBroadcastCrossJurisdictionAction:', err);
    return { success: false, error: err.message || 'Gagal menerima disposisi lintas wilayah.' };
  }
}

/**
 * Tambah Rekan Regu / Partner Lapangan (Buddy System)
 * Dijalankan oleh Personil yang sudah menerima tugas untuk menggabungkan anggota dinas lain.
 */
export async function addCrewPartnerToDispatchAction(input: {
  complaintId: string;
  partnerOfficerId?: string;
  partnerName?: string;
  partnerNrp?: string;
  partners?: Array<{
    officerId?: string;
    name: string;
    nrp?: string;
    pangkat?: string;
  }>;
}): Promise<{
  success: boolean;
  error?: string;
  message?: string;
}> {
  const auth = await requireRole(['PERSONIL', 'SUPERADMIN']);
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  // Normalisasi daftar rekan regu (mendukung 1 atau banyak personil)
  let partnerNames: string[] = [];
  let partnerNrps: string[] = [];

  if (Array.isArray(input.partners) && input.partners.length > 0) {
    input.partners.forEach((p) => {
      const name = (p.name || '').trim();
      if (name && !partnerNames.includes(name)) {
        partnerNames.push(name);
        if (p.nrp?.trim()) partnerNrps.push(p.nrp.trim());
      }
    });
  } else if (input.partnerName?.trim()) {
    const raw = input.partnerName;
    const splitNames = raw.includes('|')
      ? raw.split('|').map((s) => s.trim()).filter(Boolean)
      : raw.split(/,\s*(?!(?:S\.H\.|S\.I\.K\.|S\.E\.|S\.Sos\.|S\.Kom\.|M\.Si\.|M\.H\.|M\.M\.|dr\.|drg\.|S\.T\.|S\.Pd\.|S\.IP|M\.Tr\.Opsla))/i).map((s) => s.trim()).filter(Boolean);
    partnerNames = splitNames;
    if (input.partnerNrp?.trim()) {
      partnerNrps = input.partnerNrp.includes('|')
        ? input.partnerNrp.split('|').map((s) => s.trim()).filter(Boolean)
        : input.partnerNrp.split(',').map((s) => s.trim()).filter(Boolean);
    }
  }

  if (partnerNames.length === 0) {
    return { success: false, error: 'Minimal pilih atau masukkan 1 nama rekan regu.' };
  }

  const cleanPartnerName = partnerNames.join(' | ').substring(0, 120);
  const cleanPartnerNrp = partnerNrps.length > 0 ? partnerNrps.join(' | ').substring(0, 50) : null;

  try {
    // proxy via IComplaintRepository
    const complaintIdBig = BigInt(input.complaintId);

    const dispatch = await prisma.complaintDispatch.findFirst({
      where: { complaint_id: complaintIdBig, accepted_at: { not: null } },
      include: { officer: { include: { user: true } } },
    });

    if (!dispatch) {
      return { success: false, error: 'Disposisi penugasan aktif tidak ditemukan.' };
    }

    const leaderName = dispatch.crew_leader_name || dispatch.officer?.user?.full_name || auth.user.fullName || 'Petugas Utama';

    await prisma.complaintDispatch.update({
      where: { id: dispatch.id },
      data: {
        crew_partner_name: cleanPartnerName,
        crew_partner_nrp: cleanPartnerNrp,
        tactical_orders: (dispatch.tactical_orders || '') + ` | Regu Patroli Diperkuat (${partnerNames.length} Personel): ${cleanPartnerName}`,
      },
    });

    await prisma.complaintAuditLog.create({
      data: {
        complaint_id: complaintIdBig,
        actor_name: leaderName,
        actor_role: 'PERSONIL',
        action: 'ADD_CREW_PARTNER',
        notes: `Penambahan Anggota Regu Lapangan (${partnerNames.length} Personel): ${cleanPartnerName}${cleanPartnerNrp ? ` (NRP: ${cleanPartnerNrp})` : ''} resmi ditambahkan ke regu patroli oleh ${leaderName}.`,
      },
    });

    safeRevalidatePath('/console');
    return {
      success: true,
      message: `${partnerNames.length} Rekan regu berhasil ditambahkan ke penugasan.`,
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Gagal menambahkan rekan regu.' };
  }
}


/**
 * Konfirmasi Terima Tugas oleh Personil Lapangan
 */
export async function acceptOfficerDispatchAction(input: {
  complaintId: string;
  officerNrp: string;
  officerNama?: string;
  officerPangkat?: string;
  catatan?: string;
  lat?: number;
  lng?: number;
}): Promise<{
  success: boolean;
  error?: string;
  message?: string;
  alreadyAccepted?: boolean;
  quota?: number;
  currentCount?: number;
}> {
  const auth = await requireRole(['PERSONIL', 'SUPERADMIN']);
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  try {
    // proxy via IComplaintRepository
    const complaintIdBig = BigInt(input.complaintId);
    const now = new Date();

    // 1. Ambil data officer berdasarkan NRP / Identifier (single source of truth)
    const officer = await prisma.policeOfficer.findFirst({
      where: {
        OR: [
          { nrp: input.officerNrp },
          { user: { identifier: input.officerNrp } },
        ],
      },
      include: { user: true, unit: true, station: true },
    });

    if (!officer) {
      return { success: false, error: `Personel dengan NRP ${input.officerNrp} tidak terdaftar di sistem.` };
    }

    // Validasi pembatasan Mako: Personel hanya boleh menerima tiket yang menginduk di Makonya
    const compRecord = await prisma.complaint.findUnique({
      where: { id: complaintIdBig },
      select: { id: true, station_id: true },
    });
    if (compRecord?.station_id && officer.station_id && compRecord.station_id !== officer.station_id) {
      return { success: false, error: 'Tiket ini berasal dari Mako lain. Anda hanya dapat menerima penugasan dari Mako tempat Anda menginduk.' };
    }

    const officerName = officer.user.full_name;
    const officerRank = officer.rank_pangkat;
    const officerUnitId = officer.unit_id;

    // 2. Transaksi atomik untuk klaim penugasan tiket dan verifikasi kuota
    const result = await prisma.$transaction(async (tx) => {
      // Ambil seluruh record dispatch untuk tiket pengaduan ini (di dalam transaksi)
      const allDispatches = await tx.complaintDispatch.findMany({
        where: { complaint_id: complaintIdBig },
        include: { unit: true, officer: { include: { user: true } } },
      });

      // Temukan dispatch yang ditujukan untuk unit satuan personil (atau fallback ke primary)
      let baseDispatch = allDispatches.find(
        (d) => officerUnitId && d.unit_id === officerUnitId
      );
      if (!baseDispatch && allDispatches.length > 0) {
        baseDispatch = allDispatches.find((d) => d.is_primary_unit) || allDispatches[0];
      }

      if (!baseDispatch) {
        throw new Error('Disposisi penugasan tidak ditemukan pada tiket ini.');
      }

      const targetUnitId = baseDispatch.unit_id;
      const quota = baseDispatch.personnel_quota || 4;

      // 3. Cek apakah personil ini sudah pernah menerima tugas ini sebelumnya
      const alreadyAccepted = allDispatches.some(
        (d) =>
          d.accepted_at !== null &&
          (d.officer_id === officer.id ||
            d.officer?.nrp === input.officerNrp ||
            d.officer?.user?.identifier === input.officerNrp)
      );

      if (alreadyAccepted) {
        return {
          success: true,
          message: 'Anda telah menerima tugas ini sebelumnya.',
          alreadyAccepted: true,
          quota,
        };
      }

      // 4. Cek pembatasan kuota personil (Mode Siaran Terbuka: Siapa cepat dia dapat)
      const anyAcceptedAcrossComplaint = allDispatches.find(
        (d) => d.accepted_at !== null && d.officer_id !== null
      );

      if (quota === 1 && anyAcceptedAcrossComplaint) {
        const takerName = anyAcceptedAcrossComplaint.officer?.user?.full_name || anyAcceptedAcrossComplaint.officer?.nrp || 'Personel Lain';
        throw new Error(`Tiket ini telah diambil oleh ${takerName}. Anda tidak dapat mengambil tiket yang sama.`);
      }

      const acceptedInUnit = allDispatches.filter(
        (d) =>
          d.unit_id === targetUnitId &&
          d.accepted_at !== null &&
          d.officer_id !== null
      );

      if (acceptedInUnit.length >= quota) {
        throw new Error(`Kuota personel untuk penugasan ini sudah terpenuhi (${acceptedInUnit.length}/${quota} personel). Tiket telah ditangani oleh personel lain.`);
      }

      // 5. Catat penerimaan tugas oleh personel ini
      let unacceptedDispatch = allDispatches.find(
        (d) => d.unit_id === targetUnitId && d.accepted_at === null
      );
      if (!unacceptedDispatch) {
        unacceptedDispatch = allDispatches.find((d) => d.accepted_at === null);
      }

      let officerDist = baseDispatch.estimated_distance;
      let officerEta = baseDispatch.estimated_eta;

      try {
        const compLocation = await tx.complaint.findUnique({
          where: { id: complaintIdBig },
          select: { tkp_lat: true, tkp_lng: true },
        });
        if (compLocation?.tkp_lat && compLocation?.tkp_lng && officer.current_gps_lat && officer.current_gps_lng) {
          const { HaversineService } = await import('@/infrastructure/services/haversine.service');
          const dKm = HaversineService.calculateDistanceKm(
            Number(compLocation.tkp_lat),
            Number(compLocation.tkp_lng),
            Number(officer.current_gps_lat),
            Number(officer.current_gps_lng)
          );
          officerDist = `${dKm} km`;
          officerEta = `± ${Math.max(2, Math.round((dKm / 30) * 60))} Menit`;
        }
      } catch (_) {}

      if (unacceptedDispatch) {
        // Gunakan baris dispatch yang belum di-claim
        await tx.complaintDispatch.update({
          where: { id: unacceptedDispatch.id },
          data: {
            dispatch_status: 'DISPATCHED',
            dispatch_status_id: 1,
            accepted_at: now,
            officer_id: officer.id,
            ...(officerDist ? { estimated_distance: officerDist } : {}),
            ...(officerEta ? { estimated_eta: officerEta } : {}),
          },
        });
      } else {
        // Buat entri dispatch baru untuk anggota regu ke-2, ke-3, dst. sampai kuota penuh
        await tx.complaintDispatch.create({
          data: {
            complaint_id: complaintIdBig,
            unit_id: targetUnitId,
            officer_id: officer.id,
            is_primary_unit: false,
            personnel_quota: quota,
            tactical_orders: baseDispatch.tactical_orders,
            dispatch_status_id: 1,
            dispatch_status: 'DISPATCHED',
            dispatched_at: baseDispatch.dispatched_at,
            accepted_at: now,
            estimated_distance: officerDist,
            estimated_eta: officerEta,
          },
        });
      }

      // Jika mode broadcast kuota 1 (siapa cepat dia dapat): bersihkan entri dispatch satuan lain yang belum terisi
      if (quota === 1 && unacceptedDispatch) {
        try {
          await tx.complaintDispatch.deleteMany({
            where: {
              complaint_id: complaintIdBig,
              accepted_at: null,
              id: { not: unacceptedDispatch.id },
            },
          });
        } catch (_) {}
      }

      // 6. Update status complaint menjadi 'DIPROSES' (id: 2) dan tahap = 2 (Persiapan Personil)
      await tx.complaint.update({
        where: { id: complaintIdBig },
        data: {
          status: 'DIPROSES',
          status_id: 2,
          tahap: 2,
        },
      });

      const currentMemberCount = acceptedInUnit.length + 1;

      const actionLat = input.lat ?? (officer.current_gps_lat ? Number(officer.current_gps_lat) : null);
      const actionLng = input.lng ?? (officer.current_gps_lng ? Number(officer.current_gps_lng) : null);

      // 7. Catat Audit Log Append-Only
      await tx.complaintAuditLog.create({
        data: {
          complaint_id: complaintIdBig,
          actor_name: `${officerRank} ${officerName}`.trim(),
          actor_role: 'PERSONIL',
          action: 'DISPATCH_ACCEPTED',
          notes: `Disposisi Tugas Diterima Personil: Perintah disposisi taktis Pawas telah dikonfirmasi dan diterima oleh ${officerRank} ${officerName} (NRP: ${officer.nrp}) [Personel ${currentMemberCount}/${quota}]. Personel bersiap meluncur ke TKP.`,
          action_lat: actionLat,
          action_lng: actionLng,
        },
      });

      return {
        success: true,
        currentCount: currentMemberCount,
        quota,
      };
    }, {
      maxWait: 10000,
      timeout: 20000,
    });

    safeRevalidatePath();

    return result;
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal menerima tugas.' };
  }
}
