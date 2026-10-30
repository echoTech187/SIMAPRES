'use server';

import { UseCaseFactory } from '@/application/factories/use-case.factory';
import { ComplaintStatus, UrgensiLevel } from '@/domain/entities/complaint.entity';
import { getComplaintActionPermissions, calculateComplaintSlaTargetMinutes } from '@/domain/rules/complaint.rules';
import { ComplaintNotificationDispatcher } from '@/application/services/complaint-notification.service';
import { cacheGet, cacheSet } from '@/infrastructure/cache/app-cache';
import { requireRole } from '@/lib/session';
import {
  getComplaintRepo,
  prisma,
  safeRevalidatePath,
  serializeBigInt,
} from './complaint-common';


// Cache in-memory server-side untuk detail dinas SPKT per kantor polisi (TTL 3 menit)
const spktDutyServerCache = new Map<number, { data: any; expiry: number }>();

/**
 * Helper: Mengambil rincian lengkap petugas piket SPKT & personil dinas hari ini pada Mako tertentu
 */
export async function getActiveSpktDutyDetails(stationId: number): Promise<{
  kaSpktNama: string;
  kaSpktPhone: string;
  dutyOfficerNames: string[];
  dutyOfficers: Array<{ id: string; nrp: string; name: string; rank: string; phone?: string }>;
}> {
  try {
    const cached = spktDutyServerCache.get(stationId);
    if (cached && Date.now() < cached.expiry) {
      return cached.data;
    }

    // proxy via IComplaintRepository
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const schedule = await prisma.piketSchedule.findFirst({
      where: {
        station_id: stationId,
        schedule_date: { gte: todayStart, lte: todayEnd },
        status: { not: 'DIBATALKAN' },
      },
      include: {
        ka_spkt: { include: { user: true } },
        members: {
          where: {
            status_kehadiran: { notIn: ['LEPAS_PIKET', 'IZIN', 'SAKIT'] },
          },
          include: { officer: { include: { user: true } } },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    const kaSpktNama = schedule?.ka_spkt
      ? `${schedule.ka_spkt.rank_pangkat || ''} ${schedule.ka_spkt.user.full_name}`.trim()
      : 'Ka SPKT Piket Mako';
    const kaSpktPhone = schedule?.ka_spkt?.user?.phone_number || '';

    const dutyOfficers: any[] = [];
    if (schedule?.members) {
      for (const m of schedule.members) {
        if (m.officer) {
          dutyOfficers.push({
            id: String(m.officer.id),
            nrp: m.officer.nrp,
            name: m.officer.user.full_name,
            full_name: m.officer.user.full_name,
            rank: m.officer.rank_pangkat || '',
            pangkat: m.officer.rank_pangkat || '',
            phone: m.officer.user.phone_number || '',
          });
        }
      }
    }

    if (dutyOfficers.length === 0) {
      const allStationOfficers = await prisma.policeOfficer.findMany({
        where: {
          station_id: stationId,
          user: { is_active: true },
        },
        include: { user: true },
        take: 20,
      });
      for (const off of allStationOfficers) {
        dutyOfficers.push({
          id: String(off.id),
          nrp: off.nrp,
          name: off.user.full_name,
          full_name: off.user.full_name,
          rank: off.rank_pangkat || '',
          pangkat: off.rank_pangkat || '',
          phone: off.user.phone_number || '',
        });
      }
    }

    const result = {
      kaSpktNama,
      kaSpktPhone,
      dutyOfficerNames: dutyOfficers.map((o) => `${o.rank} ${o.name}`.trim()),
      dutyOfficers,
    };

    spktDutyServerCache.set(stationId, {
      data: result,
      expiry: Date.now() + 3 * 60 * 1000, // 3 menit TTL
    });

    return result;
  } catch (err) {
    return {
      kaSpktNama: 'Petugas Piket SPKT',
      kaSpktPhone: '',
      dutyOfficerNames: [],
      dutyOfficers: [],
    };
  }
}

/**
 * Helper: Mencari nomor HP dan identitas Ka SPKT / Petugas Piket SPKT yang bertugas hari ini pada Mako tertentu
 * CATATAN PENTING: Dilarang menggunakan targetStation.phone_piket statis, melainkan dinamis dari roster piket harian.
 */
export async function getActiveSpktDutyOfficerPhone(stationId: number): Promise<{ nama: string; phone: string } | null> {
  try {
    // proxy via IComplaintRepository
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // 1. Cek dari jadwal piket resmi hari ini di Mako tersebut
    const schedule = await prisma.piketSchedule.findFirst({
      where: {
        station_id: stationId,
        schedule_date: {
          gte: todayStart,
          lte: todayEnd,
        },
        status: { not: 'DIBATALKAN' },
      },
      include: {
        ka_spkt: {
          include: { user: true },
        },
        members: {
          where: {
            role_piket: { in: ['KA_SPKT', 'ANGGOTA_SPKT', 'PIKET_SPKT', 'PIKET_OPERATOR_CAD'] },
            status_kehadiran: { notIn: ['LEPAS_PIKET', 'IZIN', 'SAKIT'] },
          },
          include: {
            officer: { include: { user: true } },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    if (schedule?.ka_spkt?.user?.phone_number) {
      return {
        nama: `${schedule.ka_spkt.rank_pangkat || ''} ${schedule.ka_spkt.user.full_name}`.trim(),
        phone: schedule.ka_spkt.user.phone_number,
      };
    }

    if (schedule?.members && schedule.members.length > 0) {
      for (const m of schedule.members) {
        if (m.officer?.user?.phone_number) {
          return {
            nama: `${m.officer.rank_pangkat || ''} ${m.officer.user.full_name}`.trim(),
            phone: m.officer.user.phone_number,
          };
        }
      }
    }

    // 2. Fallback: Personil di Mako tersebut yang saat ini aktif dinas SPKT
    const activeSpktOfficer = await prisma.policeOfficer.findFirst({
      where: {
        station_id: stationId,
        duty_status: { in: ['PIKET_SPKT', 'DINAS_PATROLI'] },
        OR: [
          { jabatan: { contains: 'SPKT' } },
          { unit: { key: { contains: 'SPKT' } } },
          { user: { role: { in: ['OPERATOR', 'PAWAS'] } } },
        ],
        user: { phone_number: { not: '' } },
      },
      include: { user: true },
    });

    if (activeSpktOfficer?.user?.phone_number) {
      return {
        nama: `${activeSpktOfficer.rank_pangkat || ''} ${activeSpktOfficer.user.full_name}`.trim(),
        phone: activeSpktOfficer.user.phone_number,
      };
    }

    // 3. Fallback: Personil apapun di Mako tersebut yang sedang dinas aktif dan punya nomor HP
    const anyActiveOfficerInMako = await prisma.policeOfficer.findFirst({
      where: {
        station_id: stationId,
        duty_status: { not: 'LEPAS_DINAS' },
        user: { phone_number: { not: '' } },
      },
      include: { user: true },
    });

    if (anyActiveOfficerInMako?.user?.phone_number) {
      return {
        nama: `${anyActiveOfficerInMako.rank_pangkat || ''} ${anyActiveOfficerInMako.user.full_name}`.trim(),
        phone: anyActiveOfficerInMako.user.phone_number,
      };
    }

    return null;
  } catch (err) {
    console.warn('[getActiveSpktDutyOfficerPhone Error]:', err);
    return null;
  }
}

/**
 * Buat Pengaduan & Langsung Siarkan (Broadcast Terbuka) ke Seluruh Armada Siaga 110
 * Dilengkapi dengan Filter Berbasis Wilayah (Geo-Targeting Polsek) & Filter Urgensi (Escalation Timer)
 */

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
  const auth = await requireRole(['PERSONIL', 'PAWAS', 'OPERATOR', 'SUPERADMIN']);
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

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

export async function getAntreanPawasAction(stationId?: number) {
  const auth = await requireRole(['PAWAS', 'OPERATOR', 'SUPERADMIN']);
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  const cacheKey = stationId ? `antrean_pawas_${stationId}` : 'antrean_pawas_all';
  const cached = cacheGet<any>(cacheKey);
  if (cached) {
    return cached;
  }
  try {
    const repo = UseCaseFactory.getComplaintRepository();
    const results = await repo.findAntreanPawas(stationId);
    const result = { success: true, data: serializeBigInt(results.map((r) => r.toJSON())) };
    cacheSet(cacheKey, result, 15000); // 15 detik TTL
    return result;
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal mengambil antrean Pawas.' };
  }
}

export async function getAllRecentComplaintsAction(limit = 15, stationId?: number | string) {
  const auth = await requireRole(['PAWAS', 'OPERATOR', 'SUPERADMIN']);
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  const numStationId = stationId ? Number(stationId) : undefined;
  const cacheKey = numStationId ? `recent_complaints_${limit}_st_${numStationId}` : `recent_complaints_${limit}`;
  const cached = cacheGet<any>(cacheKey);
  if (cached) {
    return cached;
  }
  try {
    const repo = UseCaseFactory.getComplaintRepository();
    const results = await repo.findAllRecent(limit, numStationId);
    const result = { success: true, data: serializeBigInt(results.map((r) => r.toJSON())) };
    cacheSet(cacheKey, result, 15000); // 15 detik TTL
    return result;
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal mengambil pengaduan terkini.' };
  }
}


export async function getCadRecommendationsAction(
  incidentText: string,
  incidentLat: number,
  incidentLng: number
) {
  try {
    const auth = await requireRole(['PAWAS', 'OPERATOR', 'SUPERADMIN']);
    if (!auth.authorized) {
      return { success: false, error: auth.error };
    }

    const useCase = UseCaseFactory.getCalculateCadDispatchUseCase();
    const recommendations = await useCase.execute(incidentText, incidentLat, incidentLng);
    return { success: true, data: serializeBigInt(recommendations) };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal menghitung CAD proximity.' };
  }
}

export async function getPendingComplaintsAction(stationId?: number) {
  return getAntreanPawasAction(stationId);
}

export async function getComplaintsByStatusAction(status: string) {
  try {
    const auth = await requireRole(['PAWAS', 'OPERATOR', 'SUPERADMIN']);
    if (!auth.authorized) {
      return { success: false, error: auth.error };
    }

    const repo = UseCaseFactory.getComplaintRepository();
    const all = await repo.findAllRecent(100);
    const filtered = all.filter((c) => c.status.toUpperCase() === (status as any).toUpperCase());
    return { success: true, data: serializeBigInt(filtered.map((r) => r.toJSON())) };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal mengambil data pengaduan.' };
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

    // proxy via IComplaintRepository

    let categories: any[] = [];
    let platforms: any[] = [];
    let giats: any[] = [];
    let satuans: any[] = [];
    let statuses: any[] = [];
    let dispatchStatuses: any[] = [];
    let subcategories: any[] = [];
    let rawRejections: any[] = [];
    let urgencyLevels: any[] = [];
    let dutyStatuses: any[] = [];

    try {
      // 1. Eksekusi cepat dalam 1 round-trip menggunakan JSON_ARRAYAGG di TiDB
      const fastRow: any = await prisma.$queryRawUnsafe(`
        SELECT 
          (SELECT JSON_ARRAYAGG(JSON_OBJECT('id', id, 'key', \`key\`, 'label', label, 'display_order', display_order)) FROM master_rejection_reasons WHERE is_active = 1) as rejection_reasons,
          (SELECT JSON_ARRAYAGG(JSON_OBJECT('id', id, 'key', \`key\`, 'label', label, 'display_order', display_order)) FROM master_incident_categories WHERE is_active = 1) as categories,
          (SELECT JSON_ARRAYAGG(JSON_OBJECT('id', id, 'key', \`key\`, 'label', label, 'icon', icon, 'active_bg', active_bg, 'active_text', active_text, 'inactive_bg', inactive_bg, 'inactive_text', inactive_text, 'inactive_border', inactive_border, 'display_order', display_order)) FROM master_report_sources WHERE is_active = 1) as platforms,
          (SELECT JSON_ARRAYAGG(JSON_OBJECT('id', id, 'key', \`key\`, 'label', label, 'display_order', display_order)) FROM master_activity_types WHERE is_active = 1) as giats,
          (SELECT JSON_ARRAYAGG(JSON_OBJECT('id', id, 'key', \`key\`, 'unit_name', unit_name, 'short_name', short_name, 'display_order', display_order)) FROM master_operational_units WHERE is_active = 1) as satuans,
          (SELECT JSON_ARRAYAGG(JSON_OBJECT('id', id, 'key', \`key\`, 'label', label, 'keterangan', keterangan, 'display_order', display_order)) FROM master_complaint_statuses WHERE is_active = 1) as statuses,
          (SELECT JSON_ARRAYAGG(JSON_OBJECT('id', id, 'key', \`key\`, 'label', label, 'keterangan', keterangan, 'display_order', display_order)) FROM master_dispatch_statuses WHERE is_active = 1) as dispatch_statuses,
          (SELECT JSON_ARRAYAGG(JSON_OBJECT('id', id, 'category_id', category_id, 'category_key', category_key, 'unit_id', unit_id, 'unit_key', unit_key, 'nama_kasus', nama_kasus, 'default_urgensi', default_urgensi, 'deskripsi_sop', deskripsi_sop, 'display_order', display_order)) FROM master_incident_subcategories WHERE is_active = 1) as subcategories,
          (SELECT JSON_ARRAYAGG(JSON_OBJECT('id', id, 'key', \`key\`, 'label', label, 'display_order', display_order)) FROM master_urgency_levels WHERE is_active = 1) as urgency_levels,
          (SELECT JSON_ARRAYAGG(JSON_OBJECT('id', id, 'key', \`key\`, 'label', label, 'display_order', display_order)) FROM master_duty_statuses WHERE is_active = 1) as duty_statuses;
      `);

      if (Array.isArray(fastRow) && fastRow[0]) {
        const row = fastRow[0];
        const parseJson = (val: any) => typeof val === 'string' ? JSON.parse(val) : (val || []);
        categories = parseJson(row.categories);
        platforms = parseJson(row.platforms);
        giats = parseJson(row.giats);
        satuans = parseJson(row.satuans);
        statuses = parseJson(row.statuses);
        dispatchStatuses = parseJson(row.dispatch_statuses);
        subcategories = parseJson(row.subcategories);
        rawRejections = parseJson(row.rejection_reasons);
        urgencyLevels = parseJson(row.urgency_levels);
        dutyStatuses = parseJson(row.duty_statuses);
      }
    } catch (_) {
      // Fallback ke Prisma findMany jika queryRaw terkendala
      const [fRejections, fCategories, fPlatforms, fGiats, fSatuans, fStatuses, fDispatchStatuses, fSubcategories, fUrgencyLevels, fDutyStatuses] = await Promise.all([
        prisma.$queryRawUnsafe<any[]>(
          `SELECT id, \`key\`, label, display_order FROM master_rejection_reasons WHERE is_active = true ORDER BY display_order ASC`
        ).catch(() => []),
        prisma.masterIncidentCategory.findMany({ where: { is_active: true }, orderBy: { display_order: 'asc' } }),
        prisma.masterReportSource.findMany({ where: { is_active: true }, orderBy: { display_order: 'asc' } }),
        prisma.masterActivityType.findMany({ where: { is_active: true }, orderBy: { display_order: 'asc' } }),
        prisma.masterOperationalUnit.findMany({ where: { is_active: true }, orderBy: { display_order: 'asc' } }),
        prisma.masterComplaintStatus.findMany({ where: { is_active: true }, orderBy: { display_order: 'asc' } }),
        prisma.masterDispatchStatus.findMany({ where: { is_active: true }, orderBy: { display_order: 'asc' } }),
        prisma.masterIncidentSubcategory.findMany({ where: { is_active: true }, orderBy: [{ category_key: 'asc' }, { display_order: 'asc' }] }),
        prisma.masterUrgencyLevel.findMany({ where: { is_active: true }, orderBy: { display_order: 'asc' } }),
        prisma.masterDutyStatus.findMany({ where: { is_active: true }, orderBy: { display_order: 'asc' } }),
      ]);
      categories = fCategories;
      platforms = fPlatforms;
      giats = fGiats;
      satuans = fSatuans;
      statuses = fStatuses;
      dispatchStatuses = fDispatchStatuses;
      subcategories = fSubcategories;
      rawRejections = fRejections;
      urgencyLevels = fUrgencyLevels;
      dutyStatuses = fDutyStatuses;
    }

    // Hubungkan relasi category_rel & unit_rel dalam memory tanpa round-trip tambahan ke database
    const catMap = new Map(categories.map((c: any) => [c.id, c]));
    const unitMap = new Map(satuans.map((u: any) => [u.id, u]));
    for (const sub of subcategories) {
      if (sub.category_id) (sub as any).category_rel = catMap.get(sub.category_id) || null;
      if (sub.unit_id) (sub as any).unit_rel = unitMap.get(sub.unit_id) || null;
    }

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
 * Mengambil daftar personel dinas aktif hari ini di Mako tertentu untuk pilihan rekan regu (Buddy System)
 */
export async function getAvailableStationOfficersAction(stationId?: number | string) {
  try {
    const auth = await requireRole(['PAWAS', 'OPERATOR', 'SUPERADMIN']);
    if (!auth.authorized) {
      return { success: false, error: auth.error, data: [] };
    }

    const stId = stationId ? Number(stationId) : 60001;
    const duty = await getActiveSpktDutyDetails(stId);
    return { success: true, data: serializeBigInt(duty.dutyOfficers || []) };
  } catch (err: any) {
    return { success: false, error: err.message, data: [] };
  }
}


/**
 * Mengambil daftar alasan penolakan laporan dari database
 */
export async function getMasterRejectionReasonsAction() {
  try {
    // proxy via IComplaintRepository
    const rawResult = await prisma.$queryRawUnsafe(
      `SELECT id, \`key\`, label, display_order FROM master_rejection_reasons WHERE is_active = true ORDER BY display_order ASC`
    ).catch(() => []);
    const reasons = (Array.isArray(rawResult) ? rawResult : []) as any[];

    return { success: true, data: serializeBigInt(reasons) };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal mengambil alasan penolakan.' };
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
    const auth = await requireRole(['OPERATOR', 'PAWAS', 'SUPERADMIN']);
    if (!auth.authorized) {
      return { success: false, error: auth.error };
    }

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
        // proxy via IComplaintRepository
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
