'use server';

import { UseCaseFactory } from '@/application/factories/use-case.factory';
import { ComplaintStatus, UrgensiLevel } from '@/domain/entities/complaint.entity';
import { revalidatePath } from 'next/cache';

// Cache in-memory server untuk mereduksi latensi query jaringan remote TiDB
const officerComplaintsCache = new Map<string, { data: any; expiresAt: number }>();

function clearOfficerComplaintsCache() {
  officerComplaintsCache.clear();
}

function safeRevalidatePath(path: string) {
  clearOfficerComplaintsCache();
  try {
    revalidatePath(path);
    if (path === '/personil' || path === '/command-center') {
      revalidatePath('/console');
      revalidatePath('/console/beranda');
      revalidatePath('/console/peta');
    }
  } catch (_e) {
    // Graceful fallback when executed outside Next.js request context (e.g. test scripts)
  }
}

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
  urgensi?: UrgensiLevel;
  tkpAlamatTeks: string;
  tkpLat: number;
  tkpLng: number;
  ringkasanKeterangan?: string;
  deskripsiKejadian?: string;
  saluranLaporan?: string;
  operatorId?: string | null;
  kategoriKey?: string;
  subcategoryId?: number | string | null;
  platformKey?: string;
  fotoBuktiUrl?: string | null;
  fotoPengaduan?: string | null;
  nomorTiket?: string;
}) {
  try {
    const cleanNama = (input.pelaporNama || input.namaPelapor)?.trim();
    if (!cleanNama || cleanNama === '-') {
      return { success: false, error: 'Nama pelapor wajib diisi!' };
    }

    const cleanHp = (input.pelaporHp || input.noHpPelapor)?.trim();
    if (!cleanHp || cleanHp === '-') {
      return { success: false, error: 'Nomor telepon / kontak pelapor wajib diisi!' };
    }

    const cleanJenis = (input.jenisKejadian || input.kategoriLaporan || input.kategoriKey)?.trim();
    if (!cleanJenis || cleanJenis === '-') {
      return { success: false, error: 'Kategori / jenis kejadian laporan wajib dipilih!' };
    }

    const cleanAlamat = input.tkpAlamatTeks?.trim();
    if (!cleanAlamat || cleanAlamat === '-') {
      return { success: false, error: 'Alamat tempat kejadian perkara (TKP) wajib diisi!' };
    }

    if (
      input.tkpLat === undefined ||
      input.tkpLat === null ||
      isNaN(Number(input.tkpLat)) ||
      input.tkpLng === undefined ||
      input.tkpLng === null ||
      isNaN(Number(input.tkpLng))
    ) {
      return { success: false, error: 'Koordinat lokasi TKP (latitude & longitude) wajib diisi angka valid!' };
    }

    const cleanRingkasan = (input.ringkasanKeterangan || input.deskripsiKejadian)?.trim();
    if (!cleanRingkasan || cleanRingkasan === '-') {
      return { success: false, error: 'Uraian ringkasan kejadian wajib diisi!' };
    }

    const initialFoto = input.fotoBuktiUrl || input.fotoPengaduan || null;

    const useCase = UseCaseFactory.getCreateComplaintUseCase();
    const result = await useCase.execute({
      pelaporNama: cleanNama,
      pelaporHp: cleanHp,
      jenisKejadian: cleanJenis,
      urgensi: input.urgensi as UrgensiLevel,
      tkpAlamatTeks: cleanAlamat,
      tkpLat: Number(input.tkpLat),
      tkpLng: Number(input.tkpLng),
      ringkasanKeterangan: cleanRingkasan,
      operatorId: input.operatorId ? BigInt(input.operatorId) : null,
      kategoriKey: input.kategoriKey || cleanJenis,
      subcategoryId: input.subcategoryId ? Number(input.subcategoryId) : null,
      platformKey: input.platformKey || input.saluranLaporan || 'warga',
      fotoBuktiUrl: initialFoto,
      nomorTiket: input.nomorTiket?.trim(),
    });
    safeRevalidatePath('/command-center');
    safeRevalidatePath('/warga');
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
    safeRevalidatePath('/command-center');
    safeRevalidatePath('/personil');
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
  step: 'meluncur' | 'tiba_tkp' | 'tindakan_tkp' | 'selesai';
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
  try {
    const useCase = UseCaseFactory.getFieldStepActionUseCase();
    const result = await useCase.execute({
      complaintId: BigInt(input.complaintId),
      step: input.step,
      officerId: BigInt(input.officerId),
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
    safeRevalidatePath('/personil');
    safeRevalidatePath('/command-center');
    safeRevalidatePath('/warga');
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
    officerComplaintsCache.clear();
    safeRevalidatePath('/warga');
    safeRevalidatePath('/console');
    safeRevalidatePath('/personil');
    safeRevalidatePath('/command-center');
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
  const cacheKey = `c_${officerId}_${activeOnly}`;
  const cached = officerComplaintsCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data;
  }
  try {
    const repo = UseCaseFactory.getComplaintRepository();
    const results = await repo.findAssignedToOfficer(BigInt(officerId), activeOnly);
    const result = { success: true, data: serializeBigInt(results.map((r) => r.toJSON())) };
    officerComplaintsCache.set(cacheKey, { data: result, expiresAt: Date.now() + 15000 }); // 15 detik TTL
    return result;
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
    const filtered = all.filter((c) => c.status.toUpperCase() === (status as any).toUpperCase());
    return { success: true, data: serializeBigInt(filtered.map((r) => r.toJSON())) };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal mengambil data pengaduan.' };
  }
}

export async function updateComplaintStatusAction(input: {
  complaintId: string;
  status: ComplaintStatus;
  catatan?: string;
  pawasUserId?: string;
}) {
  try {
    const repo = UseCaseFactory.getComplaintRepository();
    const complaint = await repo.findById(BigInt(input.complaintId));
    if (!complaint) return { success: false, error: 'Pengaduan tidak ditemukan.' };

    if (input.status.toUpperCase() === 'SELESAI') {
      complaint.selesaikanKasus(input.catatan);
    }
    if (input.pawasUserId) {
      (complaint as any).props.pawasValidasiId = BigInt(input.pawasUserId);
    }
    const updated = await repo.update(complaint);
    safeRevalidatePath('/command-center');
    safeRevalidatePath('/personil');
    safeRevalidatePath('/warga');
    return { success: true, data: serializeBigInt(updated.toJSON()) };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal memperbarui status pengaduan.' };
  }
}

let masterFilterOptionsCache: { data: any; expiresAt: number } | null = null;
const MASTER_FILTER_CACHE_TTL_MS = 10 * 60 * 1000; // 10 menit

export async function getMasterFilterOptionsAction() {
  try {
    const now = Date.now();
    if (masterFilterOptionsCache && now < masterFilterOptionsCache.expiresAt) {
      return { success: true, data: masterFilterOptionsCache.data };
    }

    const { prisma } = await import('@/infrastructure/db/prisma.client');

    const [rawRejections, categories, platforms, giats, satuans, statuses, dispatchStatuses, subcategories, urgencyLevels, dutyStatuses] = await Promise.all([
      prisma.$queryRawUnsafe<any[]>(
        `SELECT id, \`key\`, label, display_order FROM master_rejection_reasons WHERE is_active = true ORDER BY display_order ASC`
      ).catch(() => []),
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
      (prisma as any).masterDispatchStatus.findMany({
        where: { is_active: true },
        orderBy: { display_order: 'asc' },
      }),
      (prisma as any).masterIncidentSubcategory.findMany({
        where: { is_active: true },
        orderBy: [{ category_key: 'asc' }, { display_order: 'asc' }],
        include: {
          category_rel: true,
          unit_rel: true,
        },
      }),
      prisma.masterUrgencyLevel.findMany({
        where: { is_active: true },
        orderBy: { display_order: 'asc' },
      }),
      prisma.masterDutyStatus.findMany({
        where: { is_active: true },
        orderBy: { display_order: 'asc' },
      }),
    ]);

    const serialized = {
      categories: serializeBigInt(categories),
      platforms: serializeBigInt(platforms),
      giats: serializeBigInt(giats),
      satuans: serializeBigInt(satuans),
      statuses: serializeBigInt(statuses),
      dispatchStatuses: serializeBigInt(dispatchStatuses),
      subcategories: serializeBigInt(subcategories),
      rejectionReasons: serializeBigInt(rawRejections),
      urgencyLevels: serializeBigInt(urgencyLevels),
      dutyStatuses: serializeBigInt(dutyStatuses),
    };

    masterFilterOptionsCache = { data: serialized, expiresAt: now + MASTER_FILTER_CACHE_TTL_MS };

    return {
      success: true,
      data: serialized,
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

      const unitOfficer = await prisma.policeOfficer.findFirst({
        where: { unit_id: s.id },
        select: { id: true },
      });

      await prisma.complaintDispatch.create({
        data: {
          complaint_id: complaintIdBig,
          unit_id: s.id,
          officer_id: unitOfficer?.id || null,
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

    safeRevalidatePath('/command-center');
    safeRevalidatePath('/personil');
    safeRevalidatePath('/console/operator');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal menerbitkan disposisi.' };
  }
}

/**
 * Konfirmasi Terima Tugas oleh Personil Lapangan (Dispatched -> Accepted)
 */
export async function acceptOfficerDispatchAction(input: {
  complaintId: string;
  officerNrp: string;
  officerNama?: string;
  officerPangkat?: string;
  catatan?: string;
}) {
  try {
    const { prisma } = await import('@/infrastructure/db/prisma.client');
    const complaintIdBig = BigInt(input.complaintId);
    const now = new Date();

    // 1. Ambil data officer berdasarkan NRP / Identifier
    let officer = await prisma.policeOfficer.findFirst({
      where: {
        OR: [
          { nrp: input.officerNrp },
          { user: { identifier: input.officerNrp } },
        ],
      },
      include: { user: true },
    });

    const regUnit = await prisma.registeredUnit.findFirst({
      where: { nrp: input.officerNrp },
    });

    if (!officer) {
      const user = await prisma.user.findFirst({
        where: { identifier: input.officerNrp },
      });
      if (user) {
        try {
          officer = await prisma.policeOfficer.create({
            data: {
              user_id: user.id,
              nrp: input.officerNrp,
              rank_pangkat: regUnit?.pangkat || input.officerPangkat || 'Personil',
              jabatan: regUnit?.satuanNama || 'Petugas Lapangan',
            },
            include: { user: true },
          });
        } catch (_) {}
      }
    }

    const officerName = input.officerNama || regUnit?.nama || officer?.user?.full_name || 'Petugas Lapangan';
    const officerRank = input.officerPangkat || regUnit?.pangkat || officer?.rank_pangkat || 'Personil';

    // 2. Tentukan unit id petugas
    let officerUnitId: number | null = officer?.unit_id || null;
    if (!officerUnitId && regUnit?.unitId) {
      const matchUnit = await prisma.masterOperationalUnit.findFirst({
        where: {
          OR: [
            { key: regUnit.unitId },
            { key: regUnit.unitId.toLowerCase() },
            { short_name: regUnit.satuanNama },
            { unit_name: regUnit.satuanNama },
          ],
        },
      });
      if (matchUnit) {
        officerUnitId = matchUnit.id;
        if (officer && !officer.unit_id) {
          try {
            await prisma.policeOfficer.update({
              where: { id: officer.id },
              data: { unit_id: matchUnit.id },
            });
          } catch (_) {}
        }
      }
    }

    // 3. Ambil seluruh record dispatch untuk tiket pengaduan ini
    const allDispatches = await prisma.complaintDispatch.findMany({
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
      return { success: false, error: 'Disposisi penugasan tidak ditemukan pada tiket ini.' };
    }

    const targetUnitId = baseDispatch.unit_id;
    const quota = baseDispatch.personnel_quota || 4;

    // 4. Cek apakah personil ini sudah pernah menerima tugas ini sebelumnya
    const alreadyAccepted = allDispatches.some(
      (d) =>
        d.accepted_at !== null &&
        ((officer?.id && d.officer_id === officer.id) ||
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

    // 5. Cek pembatasan kuota personil untuk unit ini
    const acceptedInUnit = allDispatches.filter(
      (d) =>
        d.unit_id === targetUnitId &&
        d.accepted_at !== null &&
        d.officer_id !== null
    );

    if (acceptedInUnit.length >= quota) {
      return {
        success: false,
        error: `Kuota personel untuk satuan Anda sudah terpenuhi (${acceptedInUnit.length}/${quota} personel). Tiket telah ditangani oleh personel lain dalam regu.`,
      };
    }

    // 6. Catat penerimaan tugas oleh personel ini
    const unacceptedDispatch = allDispatches.find(
      (d) => d.unit_id === targetUnitId && d.accepted_at === null
    );

    let officerDist = baseDispatch.estimated_distance;
    let officerEta = baseDispatch.estimated_eta;

    try {
      const compLocation = await prisma.complaint.findUnique({
        where: { id: complaintIdBig },
        select: { tkp_lat: true, tkp_lng: true },
      });
      if (compLocation?.tkp_lat && compLocation?.tkp_lng && officer?.current_gps_lat && officer?.current_gps_lng) {
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
      await prisma.complaintDispatch.update({
        where: { id: unacceptedDispatch.id },
        data: {
          dispatch_status: 'ACCEPTED',
          accepted_at: now,
          officer_id: officer?.id || unacceptedDispatch.officer_id,
          ...(officerDist ? { estimated_distance: officerDist } : {}),
          ...(officerEta ? { estimated_eta: officerEta } : {}),
        },
      });
    } else {
      // Buat entri dispatch baru untuk anggota regu ke-2, ke-3, dst. sampai kuota penuh
      await prisma.complaintDispatch.create({
        data: {
          complaint_id: complaintIdBig,
          unit_id: targetUnitId,
          officer_id: officer ? officer.id : null,
          is_primary_unit: false,
          personnel_quota: quota,
          tactical_orders: baseDispatch.tactical_orders,
          dispatch_status: 'ACCEPTED',
          dispatched_at: baseDispatch.dispatched_at,
          accepted_at: now,
          estimated_distance: officerDist,
          estimated_eta: officerEta,
        },
      });
    }

    // 7. Update status complaint menjadi 'SEDANG_DITANGANI' dan tahap = 3 (Tahap 3: Meluncur ke TKP)
    await prisma.complaint.update({
      where: { id: complaintIdBig },
      data: {
        status: 'SEDANG_DITANGANI',
        tahap: 3,
      },
    });

    const currentMemberCount = acceptedInUnit.length + 1;

    // 8. Catat Audit Log Append-Only
    await prisma.complaintAuditLog.create({
      data: {
        complaint_id: complaintIdBig,
        actor_name: `${officerRank} ${officerName}`.trim(),
        actor_role: 'PERSONIL',
        action: 'Disposisi Tugas Diterima Personil (ACCEPTED)',
        notes: `Perintah disposisi taktis Pawas telah dikonfirmasi dan diterima oleh ${officerRank} ${officerName} (NRP: ${input.officerNrp}) [Personel ${currentMemberCount}/${quota}]. Personel bersiap meluncur ke TKP.`,
      },
    });

    safeRevalidatePath('/personil');
    safeRevalidatePath('/command-center');
    safeRevalidatePath('/console');
    safeRevalidatePath('/console/tugas');
    safeRevalidatePath('/console/wizard');
    safeRevalidatePath('/warga');

    return {
      success: true,
      currentCount: currentMemberCount,
      quota,
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal menerima tugas.' };
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
        notes: input.catatanPengesahan || null,
      },
    });

    safeRevalidatePath('/command-center');
    safeRevalidatePath('/personil');
    safeRevalidatePath('/warga');
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

/**
 * Mengambil daftar alasan penolakan laporan dari database
 */
export async function getMasterRejectionReasonsAction() {
  try {
    const { prisma } = await import('@/infrastructure/db/prisma.client');
    const rawResult = await prisma.$queryRawUnsafe(
      `SELECT id, \`key\`, label, display_order FROM master_rejection_reasons WHERE is_active = true ORDER BY display_order ASC`
    ).catch(() => []);
    const reasons = (Array.isArray(rawResult) ? rawResult : []) as any[];

    return { success: true, data: serializeBigInt(reasons) };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal mengambil alasan penolakan.' };
  }
}

export interface OfficerPerformanceRankItem {
  officerId: string;
  nrp: string;
  namaLengkap: string;
  pangkat: string;
  jabatan: string;
  unit: string;
  assignedPatrolVehicle: string;
  avatarUrl?: string | null;
  totalDiterima: number;
  totalSelesai: number;
  totalProses: number;
  completionRate: number;
  avgResponseTimeMinutes: number;
  avgRating: number;
  totalReviews: number;
  predikat: string;
  predikatColor: string;
  recentReviewText?: string | null;
}

/**
 * Mengambil data ranking performa seluruh personel piket:
 * 1. Peringkat Produktivitas (Paling banyak menerima dan menyelesaikan tiket)
 * 2. Peringkat Kepuasan Masyarakat (Rating IKM Bintang 1 - 5)
 */
export async function getOfficerPerformanceRankingsAction() {
  try {
    const { prisma } = await import('@/infrastructure/db/prisma.client');

    const officers = await prisma.policeOfficer.findMany({
      include: {
        user: { select: { id: true, full_name: true, is_active: true } },
        unit: { select: { unit_name: true, short_name: true, icon_emoji: true } },
        dispatches: {
          include: {
            complaint: {
              include: {
                citizen_review_rel: true,
              },
            },
          },
        },
      },
      orderBy: { id: 'asc' },
    });

    const items: OfficerPerformanceRankItem[] = officers.map((off) => {
      const dispatches = off.dispatches || [];
      const totalDiterima = dispatches.length;

      let totalSelesai = 0;
      let totalProses = 0;
      let totalResponseTime = 0;
      let responseCount = 0;
      let totalStars = 0;
      let reviewCount = 0;
      let recentReviewText: string | null = null;

      for (const d of dispatches) {
        const c = d.complaint;
        if (!c) continue;

        if (c.status === 'SELESAI') {
          totalSelesai++;
        } else if (c.status === 'MENUJU_TKP' || c.status === 'PENANGANAN_TKP') {
          totalProses++;
        }

        if (d.dispatched_at && d.arrived_at) {
          const diffMin = Math.round((d.arrived_at.getTime() - d.dispatched_at.getTime()) / 60000);
          if (diffMin > 0 && diffMin < 120) {
            totalResponseTime += diffMin;
            responseCount++;
          }
        }

        if (c.citizen_review_rel?.star_rating) {
          totalStars += c.citizen_review_rel.star_rating;
          reviewCount++;
          if (!recentReviewText && c.citizen_review_rel.review_text) {
            recentReviewText = c.citizen_review_rel.review_text;
          }
        }
      }

      const completionRate = totalDiterima > 0 ? Math.round((totalSelesai / totalDiterima) * 100) : 100;
      const avgResponseTimeMinutes = responseCount > 0 ? Math.round(totalResponseTime / responseCount) : 8;

      let avgRating = 0;
      if (reviewCount > 0) {
        avgRating = Math.round((totalStars / reviewCount) * 10) / 10;
      } else if (totalSelesai > 0) {
        avgRating = 4.8;
      }

      let predikat = 'Belum Ada Ulasan';
      let predikatColor = '#64748B';

      if (avgRating >= 4.7) {
        predikat = 'Sangat Presisi (Teladan)';
        predikatColor = '#059669';
      } else if (avgRating >= 4.0) {
        predikat = 'Pelayanan Baik';
        predikatColor = '#2563EB';
      } else if (avgRating > 0) {
        predikat = 'Perlu Evaluasi';
        predikatColor = '#D97706';
      }

      return {
        officerId: off.id.toString(),
        nrp: off.nrp,
        namaLengkap: off.user?.full_name || 'Personil Polri',
        pangkat: off.rank_pangkat || 'Bripka',
        jabatan: off.jabatan || 'Patroli Samapta',
        unit: off.unit?.short_name || off.unit?.unit_name || 'Sat Samapta',
        assignedPatrolVehicle: off.assigned_patrol_vehicle || '-',
        avatarUrl: off.avatar_url || null,
        totalDiterima,
        totalSelesai,
        totalProses,
        completionRate,
        avgResponseTimeMinutes,
        avgRating,
        totalReviews: reviewCount,
        predikat,
        predikatColor,
        recentReviewText,
      };
    });

    const productivityRanking = [...items].sort((a, b) => {
      if (b.totalSelesai !== a.totalSelesai) return b.totalSelesai - a.totalSelesai;
      if (b.completionRate !== a.completionRate) return b.completionRate - a.completionRate;
      return b.totalDiterima - a.totalDiterima;
    });

    const satisfactionRanking = [...items].sort((a, b) => {
      if (b.avgRating !== a.avgRating) return b.avgRating - a.avgRating;
      if (b.totalReviews !== a.totalReviews) return b.totalReviews - a.totalReviews;
      return b.totalSelesai - a.totalSelesai;
    });

    return {
      success: true,
      data: {
        productivityRanking,
        satisfactionRanking,
        totalOfficers: items.length,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal memuat ranking personel.' };
  }
}



