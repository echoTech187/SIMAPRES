'use server';

import { UseCaseFactory } from '@/application/factories/use-case.factory';
import { ComplaintStatus, UrgensiLevel } from '@/domain/entities/complaint.entity';
import { revalidatePath } from 'next/cache';
import { cacheGet, cacheSet, cacheInvalidate } from '@/lib/app-cache';

export async function invalidateComplaintCaches() {
  cacheInvalidate('antrean_pawas');
  cacheInvalidate('recent_complaints');
  cacheInvalidate('officer_performance_rankings');
  cacheInvalidate('ikm_stats');
  cacheInvalidate('pawas_unified_data');
  cacheInvalidate('officer_complaints');
  cacheInvalidate('tracking_');
}

function safeRevalidatePath(path?: string) {
  invalidateComplaintCaches();
  try {
    // revalidatePath('/console', 'layout') sengaja ditiadakan agar Next.js tidak me-reset DOM konsol
    // dan tidak memicu unmount form/modal yang sedang dikerjakan personel/pawas di konsol.
    revalidatePath('/warga');
    if (path && !path.startsWith('/console') && path !== '/warga') {
      revalidatePath(path);
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

export interface CreateComplaintActionInput {
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
}

function normalizeCreateComplaintInput(input: CreateComplaintActionInput) {
  const cleanNama = (input.pelaporNama || input.namaPelapor || '').trim();
  const cleanHp = (input.pelaporHp || input.noHpPelapor || '').trim();
  const cleanJenis = (input.jenisKejadian || input.kategoriLaporan || input.kategoriKey || '').trim();
  const cleanAlamat = (input.tkpAlamatTeks || '').trim();
  const cleanRingkasan = (input.ringkasanKeterangan || input.deskripsiKejadian || '').trim();
  const platformKey = input.platformKey || input.saluranLaporan || 'warga';
  const initialFoto = input.fotoBuktiUrl || input.fotoPengaduan || null;
  const kategoriKey = input.kategoriKey || cleanJenis;

  return {
    cleanNama,
    cleanHp,
    cleanJenis,
    cleanAlamat,
    cleanRingkasan,
    platformKey,
    initialFoto,
    kategoriKey,
  };
}

export async function createComplaintAction(input: CreateComplaintActionInput) {
  try {
    const {
      cleanNama,
      cleanHp,
      cleanJenis,
      cleanAlamat,
      cleanRingkasan,
      platformKey,
      initialFoto,
      kategoriKey,
    } = normalizeCreateComplaintInput(input);

    if (!cleanNama || cleanNama === '-') {
      return { success: false, error: 'Nama pelapor wajib diisi!' };
    }

    if (!cleanHp || cleanHp === '-') {
      return { success: false, error: 'Nomor telepon / kontak pelapor wajib diisi!' };
    }

    if (!cleanJenis || cleanJenis === '-') {
      return { success: false, error: 'Kategori / jenis kejadian laporan wajib dipilih!' };
    }

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

    if (!cleanRingkasan || cleanRingkasan === '-') {
      return { success: false, error: 'Uraian ringkasan kejadian wajib diisi!' };
    }

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
      kategoriKey,
      subcategoryId: input.subcategoryId ? Number(input.subcategoryId) : null,
      platformKey,
      fotoBuktiUrl: initialFoto,
      nomorTiket: input.nomorTiket?.trim(),
    });
    safeRevalidatePath();
    const { generateTrackingToken } = await import('@/lib/tracking-token');
    const token = generateTrackingToken(result.nomorTiket);
    const serialized = serializeBigInt(result.toJSON());

    // Otomatis kirim notifikasi WhatsApp resmi ke nomor pelapor (non-blocking)
    if (cleanHp && cleanHp !== '-') {
      import('@/infrastructure/services/whatsapp.service')
        .then(({ WhatsAppService }) => {
          return WhatsAppService.sendTicketNotification({
            nomorTiket: result.nomorTiket,
            pelaporNama: cleanNama,
            pelaporHp: cleanHp,
            jenisKejadian: cleanJenis,
            tkpAlamatTeks: cleanAlamat,
          });
        })
        .then(async (sendRes) => {
          if (sendRes.success && result.id) {
            const { prisma } = await import('@/infrastructure/db/prisma.client');
            await prisma.complaintAuditLog.create({
              data: {
                complaint_id: result.id,
                actor_name: 'Sistem Gateway WhatsApp',
                actor_role: 'SYSTEM',
                action: 'WHATSAPP_NOTIFICATION',
                notes: `Notifikasi registrasi tiket dan tautan radar pelacakan dikirim ke ${cleanHp}. Status: ${sendRes.statusText}`,
              },
            }).catch(() => {});
          }
        })
        .catch((err) => {
          console.warn('[WhatsApp] Gagal mengirim notifikasi background:', err);
        });
    }

    return { success: true, data: { ...serialized, trackingToken: token } };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal membuat pengaduan.' };
  }
}

/**
 * Buat Pengaduan & Langsung Siarkan (Broadcast Terbuka) ke Seluruh Armada Siaga 110
 * Menghilangkan disposisi manual; sistem langsung menyiarkan serentak ke semua personil yang sedang bertugas.
 */
export async function createComplaintAndBroadcastAction(input: CreateComplaintActionInput) {
  const createRes = await createComplaintAction(input);
  if (!createRes.success || !createRes.data) {
    return createRes;
  }

  const complaintData = createRes.data;
  if (!complaintData.id) {
    return createRes;
  }
  const complaintIdBig = BigInt(complaintData.id);

  try {
    const { prisma } = await import('@/infrastructure/db/prisma.client');

    // 1. Ambil seluruh master unit operasional aktif
    const operationalUnits = await prisma.masterOperationalUnit.findMany({
      where: { is_active: true },
    });

    const satuans = operationalUnits.length > 0 ? operationalUnits : [{ id: 1, default_orders: 'Laksanakan respon cepat ke TKP' }];

    // 2. Ubah status pengaduan menjadi DIPROSES (Tahap 2: Disiarkan ke seluruh armada)
    await prisma.complaint.update({
      where: { id: complaintIdBig },
      data: {
        status: 'DIPROSES',
        status_id: 2,
        tahap: 2,
      },
    });

    // 3. Buat rekaman broadcast dispatch untuk setiap satuan operasional (Kuota: 1 = First-come, first-served)
    for (let i = 0; i < satuans.length; i++) {
      const s = satuans[i];
      await prisma.complaintDispatch.create({
        data: {
          complaint_id: complaintIdBig,
          unit_id: s.id,
          officer_id: null,
          is_primary_unit: i === 0,
          personnel_quota: 1, // Siapa cepat dia dapat (1 personil mengunci tiket)
          tactical_orders: `Siaran Terbuka: Respon Cepat 110 ke ${input.tkpAlamatTeks}`,
          dispatch_status_id: 1,
          dispatch_status: 'DISPATCHED',
          dispatched_at: new Date(),
        },
      });
    }

    // 4. Catat Audit Log
    let sessionUser: any = null;
      try {
        const { getSession } = await import('@/lib/session');
        sessionUser = await getSession();
      } catch (_) {}
    const actorName = sessionUser?.fullName;
    const actorRole = sessionUser?.role;

    await prisma.complaintAuditLog.create({
      data: {
        complaint_id: complaintIdBig,
        actor_name: actorName,
        actor_role: actorRole,
        action: 'BROADCAST_DISPATCH',
        notes: `Siaran Serentak (Open Broadcast 110): Laporan diterima dan langsung disiarkan serentak ke seluruh armada/personil siaga tanpa sekat satuan. Petugas: ${actorName}. Mode: Siapa cepat dia dapat.`,
      },
    });

    safeRevalidatePath('/console');
    return {
      success: true,
      data: {
        ...complaintData,
        status: 'DIPROSES',
        tahap: 2,
      },
    };
  } catch (err: any) {
    console.error('Error in auto broadcast dispatch:', err);
    return { success: true, data: complaintData };
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
}) {
  try {
    const useCase = UseCaseFactory.getSubmitRatingUseCase();
    const result = await useCase.execute(input);
    safeRevalidatePath();
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
    const { generateTrackingToken } = await import('@/lib/tracking-token');
    const trackingToken = generateTrackingToken(result.nomorTiket);
    const data = serializeBigInt(result.toJSON());
    return { success: true, data: { ...data, trackingToken } };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal mengambil data pengaduan.' };
  }
}

export async function getComplaintsByPhoneAction(phone: string) {
  try {
    const repo = UseCaseFactory.getComplaintRepository();
    const results = await repo.findByPelaporHp(phone);
    const { generateTrackingToken } = await import('@/lib/tracking-token');
    return {
      success: true,
      data: serializeBigInt(
        results.map((r) => {
          const json = r.toJSON();
          return {
            ...json,
            trackingToken: generateTrackingToken(r.nomorTiket),
          };
        })
      ),
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal mengambil data pengaduan.' };
  }
}

export async function getOfficerComplaintsAction(officerId: string, activeOnly = false) {
  const cacheKey = `officer_complaints_${officerId}_${activeOnly}`;
  const cached = cacheGet<any>(cacheKey);
  if (cached) {
    return cached;
  }
  try {
    const repo = UseCaseFactory.getComplaintRepository();
    const results = await repo.findAssignedToOfficer(BigInt(officerId), activeOnly);
    const result = { success: true, data: serializeBigInt(results.map((r) => r.toJSON())) };
    cacheSet(cacheKey, result, 15000); // 15 detik TTL
    return result;
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal mengambil tugas personel.' };
  }
}

export async function getAntreanPawasAction() {
  const cacheKey = 'antrean_pawas';
  const cached = cacheGet<any>(cacheKey);
  if (cached) {
    return cached;
  }
  try {
    const repo = UseCaseFactory.getComplaintRepository();
    const results = await repo.findAntreanPawas();
    const result = { success: true, data: serializeBigInt(results.map((r) => r.toJSON())) };
    cacheSet(cacheKey, result, 15000); // 15 detik TTL
    return result;
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal mengambil antrean Pawas.' };
  }
}

export async function getAllRecentComplaintsAction(limit = 50) {
  const cacheKey = `recent_complaints_${limit}`;
  const cached = cacheGet<any>(cacheKey);
  if (cached) {
    return cached;
  }
  try {
    const repo = UseCaseFactory.getComplaintRepository();
    const results = await repo.findAllRecent(limit);
    const result = { success: true, data: serializeBigInt(results.map((r) => r.toJSON())) };
    cacheSet(cacheKey, result, 15000); // 15 detik TTL
    return result;
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal mengambil pengaduan terkini.' };
  }
}

export async function getIkmStatsAction() {
  const cacheKey = 'ikm_stats';
  const cached = cacheGet<any>(cacheKey);
  if (cached) {
    return cached;
  }
  try {
    const repo = UseCaseFactory.getComplaintRepository();
    const stats = await repo.getIkmStats();
    const result = { success: true, data: stats };
    cacheSet(cacheKey, result, 60000); // 60 detik TTL
    return result;
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

export async function getPendingComplaintsAction() {
  return getAntreanPawasAction();
}

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
    safeRevalidatePath();
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
        status: 'DIPROSES',
        status_id: 2,
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

      // Saat Pawas menerbitkan disposisi ke satuan, officer_id HARUS null karena belum ada personel yang menerima tugas.
      // Tabel complaint_dispatches untuk personel baru terisi satu-satu saat personel mengklik 'Terima Tugas'.
      await prisma.complaintDispatch.create({
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

    // Catat Audit Log Append-Only
    let sessionUser: any = null;
      try {
        const { getSession } = await import('@/lib/session');
        sessionUser = await getSession();
      } catch (_) {}
    const actorName = sessionUser?.fullName;
    const actorRole = sessionUser?.role;

    await prisma.complaintAuditLog.create({
      data: {
        complaint_id: complaintIdBig,
        actor_name: actorName,
        actor_role: actorRole,
        action: 'DISPATCH_ISSUED',
        notes: `Disposisi Multi-Satuan Diterbitkan: Disiarkan ke: ${satuanNames} • Kuota: ${input.kuotaPersonel} Personel. Arahan: "${input.arahanTaktis}"`,
      },
    });
    safeRevalidatePath('/console');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal menerbitkan disposisi.' };
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
}) {
  try {
    const { prisma } = await import('@/infrastructure/db/prisma.client');
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
      include: { user: true, unit: true },
    });

    if (!officer) {
      return { success: false, error: `Personel dengan NRP ${input.officerNrp} tidak terdaftar di sistem.` };
    }

    const officerName = officer.user.full_name;
    const officerRank = officer.rank_pangkat;
    const officerUnitId = officer.unit_id;

    // 2. Ambil seluruh record dispatch untuk tiket pengaduan ini
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
      return {
        success: false,
        error: `Tiket ini telah diambil oleh ${takerName}. Anda tidak dapat mengambil tiket yang sama.`,
      };
    }

    const acceptedInUnit = allDispatches.filter(
      (d) =>
        d.unit_id === targetUnitId &&
        d.accepted_at !== null &&
        d.officer_id !== null
    );

    if (acceptedInUnit.length >= quota) {
      return {
        success: false,
        error: `Kuota personel untuk penugasan ini sudah terpenuhi (${acceptedInUnit.length}/${quota} personel). Tiket telah ditangani oleh personel lain.`,
      };
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
      const compLocation = await prisma.complaint.findUnique({
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
      await prisma.complaintDispatch.update({
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
      await prisma.complaintDispatch.create({
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
        await prisma.complaintDispatch.deleteMany({
          where: {
            complaint_id: complaintIdBig,
            accepted_at: null,
            id: { not: unacceptedDispatch.id },
          },
        });
      } catch (_) {}
    }

    // 6. Update status complaint menjadi 'DIPROSES' (id: 2) dan tahap = 2 (Persiapan Personil)
    await prisma.complaint.update({
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
    await prisma.complaintAuditLog.create({
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

    safeRevalidatePath();

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
        status_id: 4,
        tahap: 5,
      },
    });

    // Update status dispatch
    await prisma.complaintDispatch.updateMany({
      where: { complaint_id: complaintIdBig },
      data: {
        dispatch_status: 'COMPLETED',
        dispatch_status_id: 5,
        completed_at: new Date(),
      },
    });
    const officer = input.pawasUserId
      ? await prisma.policeOfficer.findFirst({
          where: { user_id: BigInt(input.pawasUserId) },
          include: { user: true },
        })
      : null;
    // Catat Audit Log
    let sessionUser: any = null;
      try {
        const { getSession } = await import('@/lib/session');
        sessionUser = await getSession();
      } catch (_) {}
    const actorName = sessionUser?.fullName;
    const actorRole = sessionUser?.role;

    const compLocation = await prisma.complaint.findUnique({
      where: { id: complaintIdBig },
      select: { tkp_lat: true, tkp_lng: true },
    });

    await prisma.complaintAuditLog.create({
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
          catatan_kondisi: input.catatanKondisi,
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
  avgResponseTimeMinutes: number | null;
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
  const cached = cacheGet<any>('officer_performance_rankings');
  if (cached) {
    return { success: true, data: cached };
  }

  try {
    const { prisma } = await import('@/infrastructure/db/prisma.client');

    const officers = await prisma.policeOfficer.findMany({
      include: {
        user: { select: { id: true, full_name: true, is_active: true } },
        unit: { select: { unit_name: true, short_name: true, icon_emoji: true } },
        dispatches: {
          select: {
            dispatch_status: true,
            dispatched_at: true,
            arrived_at: true,
            completed_at: true,
            complaint: {
              select: {
                citizen_review_rel: {
                  select: {
                    star_rating: true,
                    review_text: true,
                  },
                },
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

        const isOfficerCompleted = d.dispatch_status === 'COMPLETED' || d.completed_at != null;

        if (isOfficerCompleted) {
          totalSelesai++;
        } else {
          totalProses++;
        }

        // Hitung selisih waktu dari pertama kali tiket didisposikan sampai tiba di TKP
        const dispatchTime = d.dispatched_at ? new Date(d.dispatched_at).getTime() : null;
        const arrivalTime = d.arrived_at ? new Date(d.arrived_at).getTime() : null;

        if (dispatchTime && arrivalTime && arrivalTime >= dispatchTime) {
          const diffMin = Math.round((arrivalTime - dispatchTime) / 60000);
          if (diffMin >= 0) {
            totalResponseTime += Math.max(1, diffMin);
            responseCount++;
          }
        }

        if (isOfficerCompleted && c.citizen_review_rel?.star_rating) {
          totalStars += c.citizen_review_rel.star_rating;
          reviewCount++;
          if (!recentReviewText && c.citizen_review_rel.review_text) {
            recentReviewText = c.citizen_review_rel.review_text;
          }
        }
      }

      const completionRate = totalDiterima > 0 ? Math.round((totalSelesai / totalDiterima) * 100) : 0;
      // Jangan di-hardcode: jika personel belum tiba di lokasi, respon rata-rata adalah null (bukan angka 8 default)
      const avgResponseTimeMinutes = responseCount > 0 ? Math.round(totalResponseTime / responseCount) : null;

      let avgRating = 0;
      if (reviewCount > 0) {
        avgRating = Math.round((totalStars / reviewCount) * 10) / 10;
      }

      let predikat = 'Belum Ada Ulasan';
      let predikatColor = '#64748B';

      if (totalProses > 0 && totalSelesai === 0) {
        predikat = 'Sedang Bertugas';
        predikatColor = '#2563EB';
      } else if (avgRating >= 4.7) {
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
        namaLengkap: off.user?.full_name || off.nrp,
        pangkat: off.rank_pangkat,
        jabatan: off.jabatan,
        unit: off.unit?.short_name || off.unit?.unit_name || off.jabatan,
        assignedPatrolVehicle: off.assigned_patrol_vehicle || '-',
        avatarUrl: off.avatar_url,
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
      if (b.totalDiterima !== a.totalDiterima) return b.totalDiterima - a.totalDiterima;
      const aTime = a.avgResponseTimeMinutes ?? 999999;
      const bTime = b.avgResponseTimeMinutes ?? 999999;
      return aTime - bTime;
    });

    const satisfactionRanking = [...items].sort((a, b) => {
      if (b.avgRating !== a.avgRating) return b.avgRating - a.avgRating;
      if (b.totalReviews !== a.totalReviews) return b.totalReviews - a.totalReviews;
      return b.totalSelesai - a.totalSelesai;
    });

    const payload = {
      productivityRanking,
      satisfactionRanking,
      totalOfficers: items.length,
    };

    cacheSet('officer_performance_rankings', payload, 60000); // 60 detik TTL

    return {
      success: true,
      data: payload,
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal memuat ranking personel.' };
  }
}

export async function generateTrackingTokenAction(ticketNo: string) {
  try {
    const { generateTrackingToken } = await import('@/lib/tracking-token');
    const token = generateTrackingToken(ticketNo);
    return { success: true, token };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal membuat token tracking.' };
  }
}

/**
 * Kirim Notifikasi WhatsApp Terpadu via FlowKirim REST API
 */
export async function sendWhatsAppNotificationAction(input: {
  nomorTiket: string;
  pelaporNama?: string;
  pelaporHp: string;
  jenisKejadian?: string;
  tkpAlamatTeks?: string;
  customMessage?: string;
  complaintId?: string | number;
}) {
  try {
    const { WhatsAppService } = await import('@/infrastructure/services/whatsapp.service');
    const result = await WhatsAppService.sendTicketNotification({
      nomorTiket: input.nomorTiket,
      pelaporNama: input.pelaporNama,
      pelaporHp: input.pelaporHp,
      jenisKejadian: input.jenisKejadian,
      tkpAlamatTeks: input.tkpAlamatTeks,
      customMessage: input.customMessage,
    });

    if (result.success && input.complaintId) {
      try {
        const { prisma } = await import('@/infrastructure/db/prisma.client');
        let sessionUser: any = null;
      try {
        const { getSession } = await import('@/lib/session');
        sessionUser = await getSession();
      } catch (_) {}
        const actorName = sessionUser?.fullName;
        const actorRole = sessionUser?.role;

        await prisma.complaintAuditLog.create({
          data: {
            complaint_id: BigInt(input.complaintId),
            actor_name: actorName,
            actor_role: actorRole,
            action: 'WHATSAPP_NOTIFICATION',
            notes: `Pengiriman WhatsApp ke ${result.recipientPhone || input.pelaporHp} via FlowKirim: ${result.statusText}`,
          },
        });
      } catch (_) {}
    }

    return result;
  } catch (error: any) {
    return {
      success: false,
      statusText: 'Gagal',
      error: error.message || 'Terjadi kesalahan sistem saat mengirim WhatsApp.',
    };
  }
}
