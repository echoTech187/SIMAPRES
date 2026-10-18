'use server';

import { UseCaseFactory } from '@/application/factories/use-case.factory';
import { revalidatePath } from 'next/cache';

// Helper serialize BigInt to string
function serializeBigInt<T>(obj: T): T {
  return JSON.parse(
    JSON.stringify(obj, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    )
  );
}

export async function createComplaintAction(input: {
  pelaporNama?: string;
  namaPelapor?: string;
  pelaporHp?: string;
  noHpPelapor?: string;
  jenisKejadian?: string;
  kategoriLaporan?: string;
  urgensi?: 'DARURAT' | 'SEDANG' | 'NORMAL' | string;
  tkpAlamatTeks: string;
  tkpLat: number;
  tkpLng: number;
  ringkasanKeterangan?: string;
  deskripsiKejadian?: string;
  saluranLaporan?: string;
  operatorId?: string | null;
  kategoriKey?: string;
  platformKey?: string;
}) {
  try {
    const useCase = UseCaseFactory.getCreateComplaintUseCase();
    const result = await useCase.execute({
      pelaporNama: input.pelaporNama || input.namaPelapor || 'Masyarakat (Layanan 110)',
      pelaporHp: input.pelaporHp || input.noHpPelapor || '-',
      jenisKejadian: input.jenisKejadian || input.kategoriLaporan || 'Pengaduan Presisi 110',
      urgensi: (input.urgensi as any) === 'PRIORITAS_TINGGI' ? 'DARURAT' : (input.urgensi as any) || 'NORMAL',
      tkpAlamatTeks: input.tkpAlamatTeks,
      tkpLat: input.tkpLat,
      tkpLng: input.tkpLng,
      ringkasanKeterangan: input.ringkasanKeterangan || input.deskripsiKejadian || '-',
      operatorId: input.operatorId ? BigInt(input.operatorId) : null,
      kategoriKey: input.kategoriKey || input.kategoriLaporan,
      platformKey: input.platformKey || input.saluranLaporan,
    });
    revalidatePath('/command-center');
    revalidatePath('/warga');
    return { success: true, data: serializeBigInt(result.toJSON()) };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal membuat pengaduan.' };
  }
}

export async function dispatchComplaintAction(input: {
  complaintId: string;
  assignedOfficerId: string;
  pawasUserId: string;
  arahanPawas?: string;
}) {
  try {
    const useCase = UseCaseFactory.getDispatchComplaintUseCase();
    const result = await useCase.execute({
      complaintId: BigInt(input.complaintId),
      assignedOfficerId: BigInt(input.assignedOfficerId),
      pawasUserId: BigInt(input.pawasUserId),
      arahanPawas: input.arahanPawas,
    });
    revalidatePath('/command-center');
    revalidatePath('/personil');
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
    revalidatePath('/command-center');
    revalidatePath('/personil');
    return { success: true, data: serializeBigInt(result.toJSON()) };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal mendisposisikan pengaduan.' };
  }
}

export async function fieldStepAction(input: {
  complaintId: string;
  step: 'meluncur' | 'tiba_tkp' | 'selesai';
  officerId: string;
  catatan?: string;
  fotoBuktiUrl?: string;
  lat?: number;
  lng?: number;
}) {
  try {
    const useCase = UseCaseFactory.getFieldStepActionUseCase();
    const result = await useCase.execute({
      complaintId: BigInt(input.complaintId),
      step: input.step,
      officerId: BigInt(input.officerId),
      catatan: input.catatan,
      fotoBuktiUrl: input.fotoBuktiUrl,
      lat: input.lat,
      lng: input.lng,
    });
    revalidatePath('/personil');
    revalidatePath('/command-center');
    revalidatePath('/warga');
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
}) {
  try {
    const useCase = UseCaseFactory.getSubmitRatingUseCase();
    const result = await useCase.execute(input);
    revalidatePath('/warga');
    revalidatePath('/command-center');
    return { success: true, data: serializeBigInt(result.toJSON()) };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal mengirim ulasan rating.' };
  }
}

export async function getComplaintByTiketAction(nomorTiket: string) {
  try {
    const repo = UseCaseFactory.getComplaintRepository();
    const result = await repo.findByNomorTiket(nomorTiket);
    if (!result) return { success: false, error: 'Nomor tiket tidak ditemukan.' };
    return { success: true, data: serializeBigInt(result.toJSON()) };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal mengambil data pengaduan.' };
  }
}

export async function getComplaintsByPhoneAction(phone: string) {
  try {
    const repo = UseCaseFactory.getComplaintRepository();
    const results = await repo.findByPelaporHp(phone);
    return { success: true, data: serializeBigInt(results.map((r) => r.toJSON())) };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal mengambil data pengaduan.' };
  }
}

export async function getOfficerComplaintsAction(officerId: string, activeOnly = false) {
  try {
    const repo = UseCaseFactory.getComplaintRepository();
    const results = await repo.findAssignedToOfficer(BigInt(officerId), activeOnly);
    return { success: true, data: serializeBigInt(results.map((r) => r.toJSON())) };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal mengambil tugas personel.' };
  }
}

export async function getAntreanPawasAction() {
  try {
    const repo = UseCaseFactory.getComplaintRepository();
    const results = await repo.findAntreanPawas();
    return { success: true, data: serializeBigInt(results.map((r) => r.toJSON())) };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal mengambil antrean Pawas.' };
  }
}

export async function getAllRecentComplaintsAction(limit = 50) {
  try {
    const repo = UseCaseFactory.getComplaintRepository();
    const results = await repo.findAllRecent(limit);
    return { success: true, data: serializeBigInt(results.map((r) => r.toJSON())) };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal mengambil pengaduan terkini.' };
  }
}

export async function getIkmStatsAction() {
  try {
    const repo = UseCaseFactory.getComplaintRepository();
    const stats = await repo.getIkmStats();
    return { success: true, data: stats };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal mengambil statistik IKM.' };
  }
}

export async function getCadRecommendationsAction(
  incidentText: string,
  incidentLat: number,
  incidentLng: number
) {
  try {
    const useCase = UseCaseFactory.getCalculateCadDispatchUseCase();
    const recommendations = await useCase.execute(incidentText, incidentLat, incidentLng);
    return { success: true, data: serializeBigInt(recommendations) };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal menghitung CAD proximity.' };
  }
}

export const getPendingComplaintsAction = getAntreanPawasAction;

export async function getComplaintsByStatusAction(status: string) {
  try {
    const repo = UseCaseFactory.getComplaintRepository();
    const all = await repo.findAllRecent(100);
    const filtered = all.filter((c) => c.status === (status as any));
    return { success: true, data: serializeBigInt(filtered.map((r) => r.toJSON())) };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal mengambil data pengaduan.' };
  }
}

export async function updateComplaintStatusAction(input: {
  complaintId: string;
  status: 'BELUM_DITANGANI' | 'DISPOSISI' | 'MENUJU_TKP' | 'PENANGANAN_TKP' | 'SELESAI';
  catatan?: string;
  pawasUserId?: string;
}) {
  try {
    const repo = UseCaseFactory.getComplaintRepository();
    const complaint = await repo.findById(BigInt(input.complaintId));
    if (!complaint) return { success: false, error: 'Pengaduan tidak ditemukan.' };

    if (input.status === 'SELESAI') {
      complaint.selesaikanKasus(input.catatan);
    }
    if (input.pawasUserId) {
      (complaint as any).props.pawasValidasiId = BigInt(input.pawasUserId);
    }
    const updated = await repo.update(complaint);
    revalidatePath('/command-center');
    revalidatePath('/personil');
    revalidatePath('/warga');
    return { success: true, data: serializeBigInt(updated.toJSON()) };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal memperbarui status pengaduan.' };
  }
}

export async function getMasterFilterOptionsAction() {
  try {
    const { prisma } = await import('@/infrastructure/db/prisma.client');
    const [categories, platforms, giats, satuans, statuses, dispatchStatuses] = await Promise.all([
      prisma.masterIncidentCategory.findMany({
        where: { is_active: true },
        orderBy: { display_order: 'asc' },
      }),
      prisma.masterReportSource.findMany({
        where: { is_active: true },
        orderBy: { display_order: 'asc' },
      }),
      prisma.masterActivityType.findMany({
        where: { is_active: true },
        orderBy: { display_order: 'asc' },
      }),
      prisma.masterOperationalUnit.findMany({
        where: { is_active: true },
        orderBy: { display_order: 'asc' },
      }),
      prisma.masterComplaintStatus.findMany({
        where: { is_active: true },
        orderBy: { display_order: 'asc' },
      }),
      prisma.masterDispatchStatus.findMany({
        where: { is_active: true },
        orderBy: { display_order: 'asc' },
      }),
    ]);

    return {
      success: true,
      data: {
        categories: serializeBigInt(categories),
        platforms: serializeBigInt(platforms),
        giats: serializeBigInt(giats),
        satuans: serializeBigInt(satuans),
        statuses: serializeBigInt(statuses),
        dispatchStatuses: serializeBigInt(dispatchStatuses),
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal mengambil master filter.' };
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
  try {
    const { prisma } = await import('@/infrastructure/db/prisma.client');
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

    // Update Complaint Status
    await prisma.complaint.update({
      where: { id: complaintIdBig },
      data: {
        status: 'DISPOSISI',
        tahap: 2,
      },
    });

    // Buat Dispatch Records
    for (let i = 0; i < satuans.length; i++) {
      const s = satuans[i];
      let distStr: string | null = input.estimatedDistance || null;
      let etaStr: string | null = input.estimatedEta || null;

      if (!distStr && tkpLat && tkpLng) {
        // Cari personil aktif terdekat di satuan ini yang memiliki live GPS
        const nearestOfficer = await prisma.policeOfficer.findFirst({
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

      await prisma.complaintDispatch.create({
        data: {
          complaint_id: complaintIdBig,
          unit_id: s.id,
          is_primary_unit: i === 0,
          personnel_quota: input.kuotaPersonel || 4,
          tactical_orders: input.arahanTaktis || s.default_orders,
          dispatch_status: 'DISPATCHED',
          dispatched_at: new Date(),
          estimated_distance: distStr,
          estimated_eta: etaStr,
        },
      });
    }

    // Catat Audit Log Append-Only
    await prisma.complaintAuditLog.create({
      data: {
        complaint_id: complaintIdBig,
        actor_name: input.pawasNama || 'Pawas',
        actor_role: 'PAWAS',
        action: 'Disposisi Multi-Satuan Diterbitkan',
        notes: `Disiarkan ke: ${satuanNames} • Kuota: ${input.kuotaPersonel} Personel. Arahan: "${input.arahanTaktis}"`,
      },
    });

    revalidatePath('/command-center');
    revalidatePath('/personil');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal menerbitkan disposisi.' };
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
  try {
    const { prisma } = await import('@/infrastructure/db/prisma.client');
    const complaintIdBig = BigInt(input.complaintId);

    await prisma.complaint.update({
      where: { id: complaintIdBig },
      data: {
        status: 'SELESAI',
        tahap: 5,
      },
    });

    // Update status dispatch
    await prisma.complaintDispatch.updateMany({
      where: { complaint_id: complaintIdBig },
      data: {
        dispatch_status: 'COMPLETED',
        completed_at: new Date(),
      },
    });
    const officer = await prisma.policeOfficer.findUnique({
      where: { user_id: Number(input.pawasUserId) },
      include: { user: true },
    });
    // Catat Audit Log
    await prisma.complaintAuditLog.create({
      data: {
        complaint_id: complaintIdBig,
        actor_name: input.pawasNama,
        actor_role:officer?.user?.role as string,
        action: 'Pengesahan BAP & Kasus Selesai',
        notes: input.catatanPengesahan || 'Pawas mengesahkan penyelesaian penanganan aduan.',
      },
    });

    revalidatePath('/command-center');
    revalidatePath('/personil');
    revalidatePath('/warga');
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
  try {
    const { prisma } = await import('@/infrastructure/db/prisma.client');

    const vehicle = await prisma.patrolVehicle.findUnique({
      where: { qr_token: input.qrToken },
    });

    if (!vehicle) {
      return { success: false, error: 'QR Code Armada tidak dikenali / tidak terdaftar di sistem SIMAPRES.' };
    }

    const officer = await prisma.policeOfficer.findUnique({
      where: { nrp: input.officerNrp },
      include: { user: true },
    });

    if (!officer) {
      return { success: false, error: 'Data personil tidak ditemukan.' };
    }

    if (input.aksi === 'CHECK_IN') {
      // Perbarui sesi pemakaian
      await prisma.patrolVehicle.update({
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
      await prisma.policeOfficer.update({
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
      await prisma.vehicleUsageLog.create({
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
    } else {
      // CHECK_OUT
      await prisma.patrolVehicle.update({
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

      await prisma.policeOfficer.update({
        where: { id: officer.id },
        data: {
          assigned_patrol_vehicle: null,
          duty_status: 'LEPAS_DINAS',
        },
      });

      // Tutup sesi pemakaian aktif
      await prisma.vehicleUsageLog.updateMany({
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
          catatan_kondisi: input.catatanKondisi || '',
        },
      });

      return {
        success: true,
        message: `✓ Berhasil Check-out! Armada ${vehicle.nomor_lambung} telah dilepas dan siap untuk piket selanjutnya.`,
      };
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal memproses pemindaian armada.' };
  }
}



