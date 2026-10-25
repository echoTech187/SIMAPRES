'use server';

// SIMAPRES 110 - Master Data CRUD Server Actions
import { prisma } from '@/infrastructure/db/prisma.client';
// revalidatePath sengaja di-skip di sini agar mutasi master data tidak memicu reload halaman penuh di browser konsol
const revalidatePath = (_path: string) => {};
import { getSession } from '@/lib/session';
import { logUserActivity } from '@/lib/activity-logger';

function serializeBigInt<T>(obj: T): T {
  return JSON.parse(
    JSON.stringify(obj, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    )
  );
}

async function auditLog(activityType: string, description: string) {
  try {
    const session = await getSession();
    if (session) {
      await logUserActivity({
        userId: session.userId,
        identifier: session.identifier,
        userName: session.fullName,
        role: session.role,
        activityType,
        description,
        endpoint: '/console',
      });
    }
  } catch (_) {}
}

function parsePositiveIntId(
  id: number | string | undefined | null,
  fieldName = 'ID'
): { valid: true; value: number } | { valid: false; error: string } {
  if (id === undefined || id === null || id === '') {
    return { valid: false, error: `${fieldName} wajib diisi!` };
  }
  const num = Number(id);
  if (isNaN(num) || !Number.isInteger(num) || num <= 0) {
    return { valid: false, error: `${fieldName} harus berupa angka ID positif yang valid!` };
  }
  return { valid: true, value: num };
}

function parsePositiveBigIntId(
  id: number | string | bigint | undefined | null,
  fieldName = 'ID'
): { valid: true; value: bigint } | { valid: false; error: string } {
  if (id === undefined || id === null || id === '') {
    return { valid: false, error: `${fieldName} wajib diisi!` };
  }
  try {
    const b = BigInt(id);
    if (b <= BigInt(0)) {
      return { valid: false, error: `${fieldName} harus berupa angka ID positif!` };
    }
    return { valid: true, value: b };
  } catch {
    return { valid: false, error: `${fieldName} bukan format ID yang valid!` };
  }
}

// ==============================================================================
// 1. RINGKASAN MASTER DATA UNTUK TAB COUNTERS
// ==============================================================================
export async function getMasterCountersAction() {
  try {
    const [ranks, units, roles, stations, categories, subcategories, hotspots, hotspotCategories, vehicles, dutyStatuses, resolutionLocations, resolutionDocuments, knowledgeFaqs] =
      await Promise.all([
        prisma.masterRank.count(),
        prisma.masterOperationalUnit.count(),
        prisma.masterRole.count(),
        prisma.policeStation.count(),
        prisma.masterIncidentCategory.count(),
        prisma.masterIncidentSubcategory.count(),
        prisma.hotspotLocation.count(),
        prisma.masterHotspotCategory.count(),
        prisma.patrolVehicle.count(),
        prisma.masterDutyStatus.count(),
        prisma.masterResolutionLocationType.count(),
        prisma.masterResolutionDocumentType.count(),
        prisma.masterKnowledgeFaq.count(),
      ]);

    return {
      success: true,
      data: {
        ranks,
        units,
        roles,
        stations,
        categories,
        subcategories,
        hotspots,
        hotspotCategories,
        vehicles,
        dutyStatuses,
        resolutionLocations,
        resolutionDocuments,
        knowledgeFaqs,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ==============================================================================
// 1.1 BUNDLED LOOKUPS UNTUK SUPERADMIN / MASTER (SANGAT CEPAT - 1 ROUND-TRIP)
// ==============================================================================
export async function getAllMasterLookupsBundleAction() {
  try {
    const [
      stationLevels,
      urgencyLevels,
      dangerLevels,
      categories,
      units,
      hotspotCategories,
      vehicleTypes,
      vehicleStatuses,
    ] = await Promise.all([
      prisma.masterStationLevel.findMany({
        where: { is_active: true },
        orderBy: { level_order: 'asc' },
      }),
      prisma.masterUrgencyLevel.findMany({
        where: { is_active: true },
        orderBy: { display_order: 'asc' },
      }),
      prisma.masterHotspotDangerLevel.findMany({
        where: { is_active: true },
        orderBy: { display_order: 'asc' },
      }),
      prisma.masterIncidentCategory.findMany({
        where: { is_active: true },
        orderBy: { display_order: 'asc' },
      }),
      prisma.masterOperationalUnit.findMany({
        where: { is_active: true },
        orderBy: { display_order: 'asc' },
      }),
      prisma.masterHotspotCategory.findMany({
        where: { is_active: true },
        orderBy: { display_order: 'asc' },
      }),
      prisma.$queryRawUnsafe(`
        SELECT id, \`key\`, label, icon_emoji, display_order 
        FROM master_vehicle_types 
        WHERE is_active = 1 
        ORDER BY display_order ASC
      `).catch(() => []),
      prisma.$queryRawUnsafe(`
        SELECT id, \`key\`, label, badge_color, display_order 
        FROM master_vehicle_statuses 
        WHERE is_active = 1 
        ORDER BY display_order ASC
      `).catch(() => []),
    ]);

    return {
      success: true,
      data: serializeBigInt({
        stationLevels,
        urgencyLevels,
        dangerLevels,
        categories,
        units,
        hotspotCategories,
        vehicleTypes: Array.isArray(vehicleTypes) ? vehicleTypes : [],
        vehicleStatuses: Array.isArray(vehicleStatuses) ? vehicleStatuses : [],
      }),
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ==============================================================================
// 2. MASTER PANGKAT KEPOLISIAN (master_ranks)
// ==============================================================================
export async function getMasterRanksAction(params?: { isActive?: boolean; search?: string }) {
  try {
    const where: any = {};
    if (params?.isActive !== undefined) {
      where.is_active = Boolean(params.isActive);
    }
    if (params?.search && typeof params.search === 'string' && params.search.trim()) {
      const q = params.search.trim();
      where.OR = [
        { key: { contains: q } },
        { label: { contains: q } },
      ];
    }
    const rows = await prisma.masterRank.findMany({
      where,
      orderBy: { display_order: 'asc' },
    });
    return { success: true, data: serializeBigInt(rows) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createMasterRankAction(data: {
  key: string;
  label: string;
  display_order: number;
  is_active: boolean;
}) {
  try {
    const cleanKey = data.key?.trim().toUpperCase();
    const cleanLabel = data.label?.trim();
    if (!cleanKey || !cleanLabel) {
      return { success: false, error: 'Kode pangkat dan Label wajib diisi!' };
    }

    const created = await prisma.masterRank.create({
      data: {
        key: cleanKey,
        label: cleanLabel,
        display_order: Number(data.display_order) || 1,
        is_active: Boolean(data.is_active),
      },
    });

    await auditLog('CREATE_MASTER_RANK', `Menambahkan master pangkat baru: ${created.key} - ${created.label}`);
    revalidatePath('/console');
    return { success: true, data: serializeBigInt(created) };
  } catch (error: any) {
    return { success: false, error: error.message?.includes('Unique') ? 'Kode pangkat sudah terdaftar!' : error.message };
  }
}

export async function updateMasterRankAction(
  id: number | string,
  data: { key: string; label: string; display_order?: number; is_active?: boolean }
) {
  try {
    const idCheck = parsePositiveIntId(id, 'ID Master Pangkat');
    if (!idCheck.valid) {
      return { success: false, error: idCheck.error };
    }

    const cleanKey = data.key?.trim().toUpperCase();
    const cleanLabel = data.label?.trim();
    if (!cleanKey || !cleanLabel) {
      return { success: false, error: 'Kode pangkat dan Label wajib diisi!' };
    }

    const updated = await prisma.masterRank.update({
      where: { id: idCheck.value },
      data: {
        key: cleanKey,
        label: cleanLabel,
        display_order: data.display_order !== undefined ? Number(data.display_order) : undefined,
        is_active: data.is_active !== undefined ? Boolean(data.is_active) : undefined,
      },
    });

    await auditLog('UPDATE_MASTER_RANK', `Memperbarui master pangkat ID ${id}: ${updated.key} - ${updated.label}`);
    revalidatePath('/console');
    return { success: true, data: serializeBigInt(updated) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteMasterRankAction(id: number | string) {
  try {
    const idCheck = parsePositiveIntId(id, 'ID Master Pangkat');
    if (!idCheck.valid) {
      return { success: false, error: idCheck.error };
    }

    const deleted = await prisma.masterRank.delete({
      where: { id: idCheck.value },
    });
    await auditLog('DELETE_MASTER_RANK', `Menghapus master pangkat ID ${id}: ${deleted.key} - ${deleted.label}`);
    revalidatePath('/console');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ==============================================================================
// 3. MASTER SATUAN UNIT OPERASIONAL (master_operational_units)
// ==============================================================================
export async function getMasterOperationalUnitsAction(params?: { isActive?: boolean; search?: string }) {
  try {
    const where: any = {};
    if (params?.isActive !== undefined) {
      where.is_active = Boolean(params.isActive);
    }
    if (params?.search && typeof params.search === 'string' && params.search.trim()) {
      const q = params.search.trim();
      where.OR = [
        { key: { contains: q } },
        { unit_name: { contains: q } },
        { short_name: { contains: q } },
      ];
    }
    const rows = await prisma.masterOperationalUnit.findMany({
      where,
      orderBy: { display_order: 'asc' },
    });
    return { success: true, data: serializeBigInt(rows) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createMasterOperationalUnitAction(data: {
  key: string;
  unit_name: string;
  short_name: string;
  icon_emoji?: string;
  duties: string;
  default_orders: string;
  display_order: number;
  is_active: boolean;
}) {
  try {
    const cleanKey = data.key?.trim().toLowerCase();
    const cleanName = data.unit_name?.trim();
    const cleanShort = data.short_name?.trim();
    if (!cleanKey || !cleanName) {
      return { success: false, error: 'Kode unit dan Nama Satuan wajib diisi!' };
    }
    if (!cleanShort) {
      return { success: false, error: 'Singkatan nama satuan operasional wajib diisi!' };
    }
    if (!data.duties?.trim()) {
      return { success: false, error: 'Tugas pokok fungsi (Tupoksi) wajib diisi!' };
    }
    if (!data.default_orders?.trim()) {
      return { success: false, error: 'Perintah taktis default (SOP) wajib diisi!' };
    }

    const created = await prisma.masterOperationalUnit.create({
      data: {
        key: cleanKey,
        unit_name: cleanName,
        short_name: cleanShort,
        icon_emoji: data.icon_emoji?.trim(),
        duties: data.duties.trim(),
        default_orders: data.default_orders.trim(),
        display_order: Number(data.display_order) || 1,
        is_active: Boolean(data.is_active),
      },
    });

    await auditLog('CREATE_MASTER_UNIT', `Menambahkan master unit operasional: ${created.key} - ${created.unit_name}`);
    revalidatePath('/console');
    return { success: true, data: serializeBigInt(created) };
  } catch (error: any) {
    return { success: false, error: error.message?.includes('Unique') ? 'Kode unit sudah terdaftar!' : error.message };
  }
}

export async function updateMasterOperationalUnitAction(
  id: number | string,
  data: {
    key: string;
    unit_name: string;
    short_name: string;
    icon_emoji?: string;
    duties: string;
    default_orders: string;
    display_order?: number;
    is_active?: boolean;
  }
) {
  try {
    const idCheck = parsePositiveIntId(id, 'ID Master Unit Operasional');
    if (!idCheck.valid) {
      return { success: false, error: idCheck.error };
    }

    const cleanKey = data.key?.trim().toLowerCase();
    const cleanName = data.unit_name?.trim();
    const cleanShort = data.short_name?.trim();
    if (!cleanKey || !cleanName) {
      return { success: false, error: 'Kode unit dan Nama Satuan wajib diisi!' };
    }
    if (!cleanShort) {
      return { success: false, error: 'Singkatan nama satuan operasional wajib diisi!' };
    }
    if (!data.duties?.trim()) {
      return { success: false, error: 'Tugas pokok fungsi (Tupoksi) wajib diisi!' };
    }
    if (!data.default_orders?.trim()) {
      return { success: false, error: 'Perintah taktis default (SOP) wajib diisi!' };
    }

    const updated = await prisma.masterOperationalUnit.update({
      where: { id: idCheck.value },
      data: {
        key: cleanKey,
        unit_name: cleanName,
        short_name: cleanShort,
        icon_emoji: data.icon_emoji?.trim(),
        duties: data.duties.trim(),
        default_orders: data.default_orders.trim(),
        display_order: data.display_order !== undefined ? Number(data.display_order) : undefined,
        is_active: data.is_active !== undefined ? Boolean(data.is_active) : undefined,
      },
    });

    await auditLog('UPDATE_MASTER_UNIT', `Memperbarui master unit ID ${id}: ${updated.key} - ${updated.unit_name}`);
    revalidatePath('/console');
    return { success: true, data: serializeBigInt(updated) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteMasterOperationalUnitAction(id: number | string) {
  try {
    const idCheck = parsePositiveIntId(id, 'ID Master Unit Operasional');
    if (!idCheck.valid) {
      return { success: false, error: idCheck.error };
    }

    const deleted = await prisma.masterOperationalUnit.delete({
      where: { id: idCheck.value },
    });
    await auditLog('DELETE_MASTER_UNIT', `Menghapus master unit ID ${id}: ${deleted.key} - ${deleted.unit_name}`);
    revalidatePath('/console');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ==============================================================================
// 4. MASTER ROLE / HAK AKSES SISTEM (master_roles)
// ==============================================================================
export async function getMasterRolesAction(params?: { isActive?: boolean; search?: string }) {
  try {
    const where: any = {};
    if (params?.isActive !== undefined) {
      where.is_active = Boolean(params.isActive);
    }
    if (params?.search && typeof params.search === 'string' && params.search.trim()) {
      const q = params.search.trim();
      where.OR = [
        { key: { contains: q } },
        { label: { contains: q } },
      ];
    }
    const rows = await prisma.masterRole.findMany({
      where,
      orderBy: { display_order: 'asc' },
    });
    return { success: true, data: serializeBigInt(rows) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createMasterRoleAction(data: {
  key: string;
  label: string;
  description?: string;
  display_order: number;
  is_active: boolean;
}) {
  try {
    const cleanKey = data.key?.trim().toUpperCase();
    const cleanLabel = data.label?.trim();
    if (!cleanKey || !cleanLabel) {
      return { success: false, error: 'Kode Role dan Label peran wajib diisi!' };
    }

    const created = await prisma.masterRole.create({
      data: {
        key: cleanKey,
        label: cleanLabel,
        description: data.description?.trim(),
        display_order: Number(data.display_order) || 1,
        is_active: Boolean(data.is_active),
      },
    });

    await auditLog('CREATE_MASTER_ROLE', `Menambahkan master role baru: ${created.key} - ${created.label}`);
    revalidatePath('/console');
    return { success: true, data: serializeBigInt(created) };
  } catch (error: any) {
    return { success: false, error: error.message?.includes('Unique') ? 'Kode Role sudah terdaftar!' : error.message };
  }
}

export async function updateMasterRoleAction(
  id: number | string,
  data: { key: string; label: string; description?: string; display_order?: number; is_active?: boolean }
) {
  try {
    const idCheck = parsePositiveIntId(id, 'ID Master Role');
    if (!idCheck.valid) {
      return { success: false, error: idCheck.error };
    }

    const cleanKey = data.key?.trim().toUpperCase();
    const cleanLabel = data.label?.trim();
    if (!cleanKey || !cleanLabel) {
      return { success: false, error: 'Kode Role dan Label peran wajib diisi!' };
    }

    const updated = await prisma.masterRole.update({
      where: { id: idCheck.value },
      data: {
        key: cleanKey,
        label: cleanLabel,
        description: data.description?.trim(),
        display_order: data.display_order !== undefined ? Number(data.display_order) : undefined,
        is_active: data.is_active !== undefined ? Boolean(data.is_active) : undefined,
      },
    });

    await auditLog('UPDATE_MASTER_ROLE', `Memperbarui master role ID ${id}: ${updated.key} - ${updated.label}`);
    revalidatePath('/console');
    return { success: true, data: serializeBigInt(updated) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteMasterRoleAction(id: number | string) {
  try {
    const idCheck = parsePositiveIntId(id, 'ID Master Role');
    if (!idCheck.valid) {
      return { success: false, error: idCheck.error };
    }

    const deleted = await prisma.masterRole.delete({
      where: { id: idCheck.value },
    });
    await auditLog('DELETE_MASTER_ROLE', `Menghapus master role ID ${id}: ${deleted.key} - ${deleted.label}`);
    revalidatePath('/console');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ==============================================================================
// 4.1 MASTER TINGKAT HIERARKI KANTOR POLISI (master_station_levels)
// ==============================================================================
export async function getMasterStationLevelsAction() {
  try {
    const rows = await prisma.masterStationLevel.findMany({
      where: { is_active: true },
      orderBy: { level_order: 'asc' },
    });
    return { success: true, data: serializeBigInt(rows) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ==============================================================================
// 5. MASTER KANTOR POLISI & JURISDIKSI (police_stations)
// ==============================================================================
export async function getPoliceStationsMasterAction(params?: { search?: string; level?: string }) {
  try {
    const where: any = {};
    if (params?.level && typeof params.level === 'string' && params.level.trim()) {
      where.station_level = params.level.trim().toUpperCase();
    }
    if (params?.search && typeof params.search === 'string' && params.search.trim()) {
      const q = params.search.trim();
      where.OR = [
        { station_code: { contains: q } },
        { station_name: { contains: q } },
        { address: { contains: q } },
      ];
    }
    const rows = await prisma.policeStation.findMany({
      where,
      orderBy: { id: 'asc' },
    });
    return { success: true, data: serializeBigInt(rows) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createPoliceStationMasterAction(data: {
  station_code: string;
  station_name: string;
  station_level: string;
  address: string;
  office_lat: number;
  office_lng: number;
  geofence_radius_meters: number;
}) {
  try {
    const cleanCode = data.station_code?.trim().toUpperCase();
    const cleanName = data.station_name?.trim();
    if (!cleanCode || !cleanName) {
      return { success: false, error: 'Kode Kantor dan Nama Kantor Polisi wajib diisi!' };
    }
    if (!data.station_level?.trim()) {
      return { success: false, error: 'Tingkatan kesatuan (POLRES / POLSEK) wajib dipilih!' };
    }
    if (!data.address?.trim()) {
      return { success: false, error: 'Alamat lengkap kantor polisi wajib diisi!' };
    }
    if (
      data.office_lat === undefined ||
      data.office_lat === null ||
      isNaN(Number(data.office_lat)) ||
      data.office_lng === undefined ||
      data.office_lng === null ||
      isNaN(Number(data.office_lng))
    ) {
      return { success: false, error: 'Koordinat latitude dan longitude kantor polisi wajib diisi angka valid!' };
    }
    if (
      data.geofence_radius_meters === undefined ||
      data.geofence_radius_meters === null ||
      isNaN(Number(data.geofence_radius_meters)) ||
      Number(data.geofence_radius_meters) <= 0
    ) {
      return { success: false, error: 'Radius pantau geofence harus berupa angka lebih besar dari 0 meter!' };
    }

    const created = await prisma.policeStation.create({
      data: {
        station_code: cleanCode,
        station_name: cleanName,
        station_level: data.station_level.trim(),
        address: data.address.trim(),
        office_lat: Number(data.office_lat),
        office_lng: Number(data.office_lng),
        geofence_radius_meters: Number(data.geofence_radius_meters),
      },
    });

    await auditLog('CREATE_POLICE_STATION', `Menambahkan kantor polisi baru: ${created.station_code} - ${created.station_name}`);
    revalidatePath('/console');
    return { success: true, data: serializeBigInt(created) };
  } catch (error: any) {
    return { success: false, error: error.message?.includes('Unique') ? 'Kode Kantor Polisi sudah digunakan!' : error.message };
  }
}

export async function updatePoliceStationMasterAction(
  id: number | string,
  data: {
    station_code: string;
    station_name: string;
    station_level: string;
    address: string;
    office_lat: number;
    office_lng: number;
    geofence_radius_meters: number;
  }
) {
  try {
    const idCheck = parsePositiveIntId(id, 'ID Kantor Polisi');
    if (!idCheck.valid) {
      return { success: false, error: idCheck.error };
    }

    const cleanCode = data.station_code?.trim().toUpperCase();
    const cleanName = data.station_name?.trim();
    if (!cleanCode || !cleanName) {
      return { success: false, error: 'Kode Kantor dan Nama Kantor Polisi wajib diisi!' };
    }
    if (!data.station_level?.trim()) {
      return { success: false, error: 'Tingkatan kesatuan (POLRES / POLSEK) wajib dipilih!' };
    }
    if (!data.address?.trim()) {
      return { success: false, error: 'Alamat lengkap kantor polisi wajib diisi!' };
    }
    if (
      data.office_lat === undefined ||
      data.office_lat === null ||
      isNaN(Number(data.office_lat)) ||
      data.office_lng === undefined ||
      data.office_lng === null ||
      isNaN(Number(data.office_lng))
    ) {
      return { success: false, error: 'Koordinat latitude dan longitude kantor polisi wajib diisi angka valid!' };
    }
    if (
      data.geofence_radius_meters === undefined ||
      data.geofence_radius_meters === null ||
      isNaN(Number(data.geofence_radius_meters)) ||
      Number(data.geofence_radius_meters) <= 0
    ) {
      return { success: false, error: 'Radius pantau geofence harus berupa angka lebih besar dari 0 meter!' };
    }

    const updated = await prisma.policeStation.update({
      where: { id: idCheck.value },
      data: {
        station_code: cleanCode,
        station_name: cleanName,
        station_level: data.station_level.trim(),
        address: data.address.trim(),
        office_lat: Number(data.office_lat),
        office_lng: Number(data.office_lng),
        geofence_radius_meters: Number(data.geofence_radius_meters),
      },
    });

    await auditLog('UPDATE_POLICE_STATION', `Memperbarui kantor polisi ID ${idCheck.value}: ${updated.station_code} - ${updated.station_name}`);
    revalidatePath('/console');
    return { success: true, data: serializeBigInt(updated) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deletePoliceStationMasterAction(id: number | string) {
  try {
    const idCheck = parsePositiveIntId(id, 'ID Kantor Polisi');
    if (!idCheck.valid) {
      return { success: false, error: idCheck.error };
    }

    const deleted = await prisma.policeStation.delete({
      where: { id: idCheck.value },
    });
    await auditLog('DELETE_POLICE_STATION', `Menghapus kantor polisi ID ${idCheck.value}: ${deleted.station_code} - ${deleted.station_name}`);
    revalidatePath('/console');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ==============================================================================
// 6. MASTER KATEGORI KEJADIAN / INSIDEN (master_incident_categories)
// ==============================================================================
export async function getMasterIncidentCategoriesAction(params?: { isActive?: boolean; search?: string }) {
  try {
    const where: any = {};
    if (params?.isActive !== undefined) {
      where.is_active = Boolean(params.isActive);
    }
    if (params?.search && typeof params.search === 'string' && params.search.trim()) {
      const q = params.search.trim();
      where.OR = [
        { key: { contains: q } },
        { label: { contains: q } },
      ];
    }
    const rows = await prisma.masterIncidentCategory.findMany({
      where,
      orderBy: { display_order: 'asc' },
    });
    return { success: true, data: serializeBigInt(rows) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createMasterIncidentCategoryAction(data: {
  key: string;
  label: string;
  icon?: string;
  badge_bg?: string;
  badge_color?: string;
  badge_border?: string;
  display_order: number;
  is_active: boolean;
}) {
  try {
    const cleanKey = data.key?.trim().toUpperCase();
    const cleanLabel = data.label?.trim();
    const cleanIcon = data.icon?.trim();
    const cleanBadgeBg = data.badge_bg?.trim();
    const cleanBadgeColor = data.badge_color?.trim();
    const cleanBadgeBorder = data.badge_border?.trim();

    if (!cleanKey || !cleanLabel) {
      return { success: false, error: 'Kode Kategori dan Label wajib diisi!' };
    }
    if (!cleanIcon) {
      return { success: false, error: 'Icon emoji kategori wajib diisi!' };
    }
    if (!cleanBadgeBg) {
      return { success: false, error: 'Warna latar badge (badge_bg) wajib diisi!' };
    }
    if (!cleanBadgeColor) {
      return { success: false, error: 'Warna teks badge (badge_color) wajib diisi!' };
    }
    if (!cleanBadgeBorder) {
      return { success: false, error: 'Warna border badge (badge_border) wajib diisi!' };
    }
    if (data.display_order === undefined || isNaN(Number(data.display_order))) {
      return { success: false, error: 'Urutan tampilan wajib diisi angka valid!' };
    }

    const created = await prisma.masterIncidentCategory.create({
      data: {
        key: cleanKey,
        label: cleanLabel,
        icon: cleanIcon,
        badge_bg: cleanBadgeBg,
        badge_color: cleanBadgeColor,
        badge_border: cleanBadgeBorder,
        display_order: Number(data.display_order),
        is_active: Boolean(data.is_active),
      },
    });

    await auditLog('CREATE_INCIDENT_CATEGORY', `Menambahkan kategori insiden baru: ${created.key} - ${created.label}`);
    revalidatePath('/console');
    return { success: true, data: serializeBigInt(created) };
  } catch (error: any) {
    return { success: false, error: error.message?.includes('Unique') ? 'Kode kategori sudah ada!' : error.message };
  }
}

export async function updateMasterIncidentCategoryAction(
  id: number | string,
  data: {
    key: string;
    label: string;
    icon?: string;
    badge_bg?: string;
    badge_color?: string;
    badge_border?: string;
    display_order?: number;
    is_active?: boolean;
  }
) {
  try {
    const idCheck = parsePositiveIntId(id, 'ID Kategori Insiden');
    if (!idCheck.valid) {
      return { success: false, error: idCheck.error };
    }

    const cleanKey = data.key?.trim().toUpperCase();
    const cleanLabel = data.label?.trim();
    if (!cleanKey || !cleanLabel) {
      return { success: false, error: 'Kode Kategori dan Label wajib diisi!' };
    }

    const updatePayload: any = {
      key: cleanKey,
      label: cleanLabel,
    };

    if (data.icon !== undefined) {
      const cleanIcon = data.icon.trim();
      if (!cleanIcon) {
        return { success: false, error: 'Icon emoji kategori tidak boleh kosong!' };
      }
      updatePayload.icon = cleanIcon;
    }

    if (data.badge_bg !== undefined) {
      const cleanBg = data.badge_bg.trim();
      if (!cleanBg) {
        return { success: false, error: 'Warna latar badge (badge_bg) tidak boleh kosong!' };
      }
      updatePayload.badge_bg = cleanBg;
    }

    if (data.badge_color !== undefined) {
      const cleanColor = data.badge_color.trim();
      if (!cleanColor) {
        return { success: false, error: 'Warna teks badge (badge_color) tidak boleh kosong!' };
      }
      updatePayload.badge_color = cleanColor;
    }

    if (data.badge_border !== undefined) {
      const cleanBorder = data.badge_border.trim();
      if (!cleanBorder) {
        return { success: false, error: 'Warna border badge (badge_border) tidak boleh kosong!' };
      }
      updatePayload.badge_border = cleanBorder;
    }

    if (data.display_order !== undefined) {
      if (isNaN(Number(data.display_order))) {
        return { success: false, error: 'Urutan tampilan harus berupa angka!' };
      }
      updatePayload.display_order = Number(data.display_order);
    }

    if (data.is_active !== undefined) {
      updatePayload.is_active = Boolean(data.is_active);
    }

    const updated = await prisma.masterIncidentCategory.update({
      where: { id: idCheck.value },
      data: updatePayload,
    });

    await auditLog('UPDATE_INCIDENT_CATEGORY', `Memperbarui kategori insiden ID ${idCheck.value}: ${updated.key} - ${updated.label}`);
    revalidatePath('/console');
    return { success: true, data: serializeBigInt(updated) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteMasterIncidentCategoryAction(id: number | string) {
  try {
    const idCheck = parsePositiveIntId(id, 'ID Kategori Insiden');
    if (!idCheck.valid) {
      return { success: false, error: idCheck.error };
    }

    const deleted = await prisma.masterIncidentCategory.delete({
      where: { id: idCheck.value },
    });
    await auditLog('DELETE_INCIDENT_CATEGORY', `Menghapus kategori insiden ID ${idCheck.value}: ${deleted.key} - ${deleted.label}`);
    revalidatePath('/console');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ==============================================================================
// 6.1 MASTER SUB-KATEGORI KASUS SATUAN UNIT (master_incident_subcategories - SMART CAD)
// ==============================================================================
export async function getMasterIncidentSubcategoriesAction(params?: {
  categoryId?: number | string;
  categoryKey?: string;
  unitKey?: string;
  isActive?: boolean;
  search?: string;
}) {
  try {
    const where: any = {};
    if (params?.isActive !== undefined) where.is_active = Boolean(params.isActive);
    if (params?.categoryId !== undefined && params.categoryId !== null && params.categoryId !== '') {
      const catCheck = parsePositiveIntId(params.categoryId, 'ID Kategori Induk');
      if (!catCheck.valid) {
        return { success: false, error: catCheck.error };
      }
      where.category_id = catCheck.value;
    }
    if (params?.categoryKey && typeof params.categoryKey === 'string' && params.categoryKey.trim()) {
      where.category_key = params.categoryKey.trim().toUpperCase();
    }
    if (params?.unitKey && typeof params.unitKey === 'string' && params.unitKey.trim()) {
      where.unit_key = params.unitKey.trim().toLowerCase();
    }
    if (params?.search && typeof params.search === 'string' && params.search.trim()) {
      const q = params.search.trim();
      where.OR = [
        { nama_kasus: { contains: q } },
        { deskripsi_sop: { contains: q } },
      ];
    }

    const rows = await prisma.masterIncidentSubcategory.findMany({
      where,
      orderBy: [{ category_key: 'asc' }, { display_order: 'asc' }],
      include: {
        category_rel: {
          select: { id: true, key: true, label: true, icon: true, badge_bg: true, badge_color: true },
        },
        unit_rel: {
          select: { id: true, key: true, short_name: true, unit_name: true, icon_emoji: true },
        },
      },
    });

    return { success: true, data: serializeBigInt(rows) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createMasterIncidentSubcategoryAction(data: {
  category_id: number | string;
  category_key: string;
  unit_id: number | string;
  unit_key: string;
  nama_kasus: string;
  default_urgensi: string;
  deskripsi_sop?: string;
  display_order: number;
  is_active: boolean;
}) {
  try {
    const cleanKasus = data.nama_kasus?.trim();
    if (!cleanKasus) {
      return { success: false, error: 'Nama rincian kasus / subkategori insiden wajib diisi!' };
    }
    const catCheck = parsePositiveIntId(data.category_id, 'Kategori insiden induk');
    if (!catCheck.valid) return { success: false, error: catCheck.error };
    if (!data.category_key?.trim()) {
      return { success: false, error: 'Kode kategori insiden induk wajib diisi!' };
    }
    const unitCheck = parsePositiveIntId(data.unit_id, 'Satuan unit penanggung jawab SOP');
    if (!unitCheck.valid) return { success: false, error: unitCheck.error };
    if (!data.unit_key?.trim()) {
      return { success: false, error: 'Kode satuan unit penanggung jawab wajib diisi!' };
    }
    if (!data.default_urgensi?.trim()) {
      return { success: false, error: 'Tingkat urgensi default SOP wajib dipilih!' };
    }

    const created = await prisma.masterIncidentSubcategory.create({
      data: {
        category_id: catCheck.value,
        category_key: data.category_key.trim().toUpperCase(),
        unit_id: unitCheck.value,
        unit_key: data.unit_key.trim().toLowerCase(),
        nama_kasus: cleanKasus,
        default_urgensi: data.default_urgensi.trim(),
        deskripsi_sop: data.deskripsi_sop?.trim(),
        display_order: Number(data.display_order) || 1,
        is_active: Boolean(data.is_active),
      },
    });

    await auditLog('CREATE_INCIDENT_SUBCATEGORY', `Menambahkan sub-kategori kasus baru: ${created.nama_kasus} (${created.unit_key})`);
    revalidatePath('/console');
    return { success: true, data: serializeBigInt(created) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateMasterIncidentSubcategoryAction(
  id: number | string,
  data: Partial<{
    category_id: number | string;
    category_key: string;
    unit_id: number | string;
    unit_key: string;
    nama_kasus: string;
    default_urgensi: string;
    deskripsi_sop: string;
    display_order: number;
    is_active: boolean;
  }>
) {
  try {
    const idCheck = parsePositiveIntId(id, 'ID Subkategori Kasus');
    if (!idCheck.valid) {
      return { success: false, error: idCheck.error };
    }

    const updatePayload: any = {};

    if (data.category_id !== undefined && data.category_id !== null && data.category_id !== '') {
      const catCheck = parsePositiveIntId(data.category_id, 'ID Kategori Induk');
      if (!catCheck.valid) return { success: false, error: catCheck.error };
      updatePayload.category_id = catCheck.value;
    }
    if (data.category_key !== undefined) {
      const cleanCatKey = data.category_key?.trim().toUpperCase();
      if (!cleanCatKey) return { success: false, error: 'Kode Kategori tidak boleh kosong!' };
      updatePayload.category_key = cleanCatKey;
    }
    if (data.unit_id !== undefined && data.unit_id !== null && data.unit_id !== '') {
      const unitCheck = parsePositiveIntId(data.unit_id, 'ID Satuan Unit');
      if (!unitCheck.valid) return { success: false, error: unitCheck.error };
      updatePayload.unit_id = unitCheck.value;
    }
    if (data.unit_key !== undefined) {
      const cleanUnitKey = data.unit_key?.trim().toLowerCase();
      if (!cleanUnitKey) return { success: false, error: 'Kode Satuan tidak boleh kosong!' };
      updatePayload.unit_key = cleanUnitKey;
    }
    if (data.nama_kasus !== undefined) {
      const cleanNama = data.nama_kasus?.trim();
      if (!cleanNama) return { success: false, error: 'Nama rincian kasus tidak boleh kosong!' };
      updatePayload.nama_kasus = cleanNama;
    }
    if (data.default_urgensi !== undefined) {
      const cleanUrgensi = data.default_urgensi?.trim();
      if (!cleanUrgensi) return { success: false, error: 'Tingkat urgensi default tidak boleh kosong!' };
      updatePayload.default_urgensi = cleanUrgensi;
    }
    if (data.deskripsi_sop !== undefined) {
      updatePayload.deskripsi_sop = data.deskripsi_sop?.trim();
    }
    if (data.display_order !== undefined) {
      updatePayload.display_order = Number(data.display_order) || 1;
    }
    if (data.is_active !== undefined) {
      updatePayload.is_active = Boolean(data.is_active);
    }

    const updated = await prisma.masterIncidentSubcategory.update({
      where: { id: idCheck.value },
      data: updatePayload,
    });

    await auditLog('UPDATE_INCIDENT_SUBCATEGORY', `Memperbarui sub-kategori kasus ID ${idCheck.value}: ${updated.nama_kasus}`);
    revalidatePath('/console');
    return { success: true, data: serializeBigInt(updated) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteMasterIncidentSubcategoryAction(id: number | string) {
  try {
    const idCheck = parsePositiveIntId(id, 'ID Subkategori Kasus');
    if (!idCheck.valid) {
      return { success: false, error: idCheck.error };
    }

    const deleted = await prisma.masterIncidentSubcategory.delete({
      where: { id: idCheck.value },
    });
    await auditLog('DELETE_INCIDENT_SUBCATEGORY', `Menghapus sub-kategori kasus ID ${idCheck.value}: ${deleted.nama_kasus}`);
    revalidatePath('/console');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ==============================================================================
// 6.2 MASTER TINGKAT URGENSI PRESISI (master_urgency_levels)
// ==============================================================================
export async function getMasterUrgencyLevelsAction() {
  try {
    const rows = await prisma.masterUrgencyLevel.findMany({
      where: { is_active: true },
      orderBy: { display_order: 'asc' },
    });
    return { success: true, data: serializeBigInt(rows) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ==============================================================================
// 7. MASTER TITIK RAWAN / HOTSPOT (master_hotspot_categories)
// ==============================================================================
export async function getMasterHotspotCategoriesAction(params?: { isActive?: boolean; search?: string }) {
  try {
    const where: any = {};
    if (params?.isActive !== undefined) {
      where.is_active = Boolean(params.isActive);
    }
    if (params?.search && typeof params.search === 'string' && params.search.trim()) {
      const q = params.search.trim();
      where.OR = [
        { key: { contains: q } },
        { label: { contains: q } },
      ];
    }
    const rows = await prisma.masterHotspotCategory.findMany({
      where,
      orderBy: { display_order: 'asc' },
    });
    return { success: true, data: serializeBigInt(rows) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createMasterHotspotCategoryAction(data: {
  key: string;
  label: string;
  icon_emoji?: string;
  display_order: number;
  is_active: boolean;
}) {
  try {
    const cleanKey = data.key?.trim().toUpperCase();
    const cleanLabel = data.label?.trim();
    if (!cleanKey || !cleanLabel) {
      return { success: false, error: 'Kode dan Label kategori rawan wajib diisi!' };
    }

    const created = await prisma.masterHotspotCategory.create({
      data: {
        key: cleanKey,
        label: cleanLabel,
        icon_emoji: data.icon_emoji?.trim(),
        display_order: Number(data.display_order) || 1,
        is_active: Boolean(data.is_active),
      },
    });

    await auditLog('CREATE_HOTSPOT_CATEGORY', `Menambahkan kategori titik rawan: ${created.key} - ${created.label}`);
    revalidatePath('/console');
    return { success: true, data: serializeBigInt(created) };
  } catch (error: any) {
    return { success: false, error: error.message?.includes('Unique') ? 'Kode titik rawan sudah ada!' : error.message };
  }
}

export async function updateMasterHotspotCategoryAction(
  id: number | string,
  data: {
    key: string;
    label: string;
    icon_emoji?: string;
    display_order?: number;
    is_active?: boolean;
  }
) {
  try {
    const idCheck = parsePositiveIntId(id, 'ID Kategori Titik Rawan');
    if (!idCheck.valid) {
      return { success: false, error: idCheck.error };
    }

    const cleanKey = data.key?.trim().toUpperCase();
    const cleanLabel = data.label?.trim();
    if (!cleanKey || !cleanLabel) {
      return { success: false, error: 'Kode dan Label kategori rawan wajib diisi!' };
    }

    const updated = await prisma.masterHotspotCategory.update({
      where: { id: idCheck.value },
      data: {
        key: cleanKey,
        label: cleanLabel,
        icon_emoji: data.icon_emoji?.trim(),
        display_order: data.display_order !== undefined ? Number(data.display_order) : undefined,
        is_active: data.is_active !== undefined ? Boolean(data.is_active) : undefined,
      },
    });

    await auditLog('UPDATE_HOTSPOT_CATEGORY', `Memperbarui kategori titik rawan ID ${idCheck.value}: ${updated.key} - ${updated.label}`);
    revalidatePath('/console');
    return { success: true, data: serializeBigInt(updated) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteMasterHotspotCategoryAction(id: number | string) {
  try {
    const idCheck = parsePositiveIntId(id, 'ID Kategori Titik Rawan');
    if (!idCheck.valid) {
      return { success: false, error: idCheck.error };
    }

    const deleted = await prisma.masterHotspotCategory.delete({
      where: { id: idCheck.value },
    });
    await auditLog('DELETE_HOTSPOT_CATEGORY', `Menghapus kategori titik rawan ID ${idCheck.value}: ${deleted.key} - ${deleted.label}`);
    revalidatePath('/console');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getMasterHotspotDangerLevelsAction() {
  try {
    const rows = await prisma.masterHotspotDangerLevel.findMany({
      where: { is_active: true },
      orderBy: { display_order: 'asc' },
    });
    return { success: true, data: serializeBigInt(rows) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}


// ==============================================================================
// 8. MASTER STATUS KEDINASAN (master_duty_statuses)
// ==============================================================================
export async function getMasterDutyStatusesAction(params?: { isActive?: boolean; search?: string }) {
  try {
    const where: any = {};
    if (params?.isActive !== undefined) {
      where.is_active = Boolean(params.isActive);
    }
    if (params?.search && typeof params.search === 'string' && params.search.trim()) {
      const q = params.search.trim();
      where.OR = [
        { key: { contains: q } },
        { label: { contains: q } },
      ];
    }
    const rows = await prisma.masterDutyStatus.findMany({
      where,
      orderBy: { display_order: 'asc' },
    });
    return { success: true, data: serializeBigInt(rows) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createMasterDutyStatusAction(data: {
  key: string;
  label: string;
  badge_color?: string;
  badge_bg?: string;
  display_order: number;
  is_active: boolean;
}) {
  try {
    const cleanKey = data.key?.trim().toUpperCase();
    const cleanLabel = data.label?.trim();
    if (!cleanKey || !cleanLabel) {
      return { success: false, error: 'Kode status dan Label kedinasan wajib diisi!' };
    }

    const created = await prisma.masterDutyStatus.create({
      data: {
        key: cleanKey,
        label: cleanLabel,
        badge_color: data.badge_color?.trim(),
        badge_bg: data.badge_bg?.trim(),
        display_order: Number(data.display_order) || 1,
        is_active: Boolean(data.is_active),
      },
    });

    await auditLog('CREATE_DUTY_STATUS', `Menambahkan master status tugas: ${created.key} - ${created.label}`);
    revalidatePath('/console');
    return { success: true, data: serializeBigInt(created) };
  } catch (error: any) {
    return { success: false, error: error.message?.includes('Unique') ? 'Kode status sudah ada!' : error.message };
  }
}

export async function updateMasterDutyStatusAction(
  id: number | string,
  data: {
    key: string;
    label: string;
    badge_color?: string;
    badge_bg?: string;
    display_order?: number;
    is_active?: boolean;
  }
) {
  try {
    const idCheck = parsePositiveIntId(id, 'ID Status Kedinasan');
    if (!idCheck.valid) {
      return { success: false, error: idCheck.error };
    }

    const cleanKey = data.key?.trim().toUpperCase();
    const cleanLabel = data.label?.trim();
    if (!cleanKey || !cleanLabel) {
      return { success: false, error: 'Kode status dan Label kedinasan wajib diisi!' };
    }

    const updated = await prisma.masterDutyStatus.update({
      where: { id: idCheck.value },
      data: {
        key: cleanKey,
        label: cleanLabel,
        badge_color: data.badge_color?.trim(),
        badge_bg: data.badge_bg?.trim(),
        display_order: data.display_order !== undefined ? Number(data.display_order) : undefined,
        is_active: data.is_active !== undefined ? Boolean(data.is_active) : undefined,
      },
    });

    await auditLog('UPDATE_DUTY_STATUS', `Memperbarui status tugas ID ${idCheck.value}: ${updated.key} - ${updated.label}`);
    revalidatePath('/console');
    return { success: true, data: serializeBigInt(updated) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteMasterDutyStatusAction(id: number | string) {
  try {
    const idCheck = parsePositiveIntId(id, 'ID Status Kedinasan');
    if (!idCheck.valid) {
      return { success: false, error: idCheck.error };
    }

    const deleted = await prisma.masterDutyStatus.delete({
      where: { id: idCheck.value },
    });
    await auditLog('DELETE_DUTY_STATUS', `Menghapus status tugas ID ${idCheck.value}: ${deleted.key} - ${deleted.label}`);
    revalidatePath('/console');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ==============================================================================
// 9. MASTER TITIK RAWAN GIS / LOKASI RAWAN KRIMINALITAS (hotspot_locations)
// ==============================================================================
export async function getMasterHotspotsAction(params?: {
  search?: string;
  sector?: string;
  category?: string;
  dangerLevel?: string;
}) {
  try {
    const where: any = {};
    if (params?.sector && typeof params.sector === 'string' && params.sector.trim()) {
      where.police_sector = params.sector.trim();
    }
    if (params?.category && typeof params.category === 'string' && params.category.trim()) {
      where.category = params.category.trim();
    }
    if (params?.dangerLevel && typeof params.dangerLevel === 'string' && params.dangerLevel.trim()) {
      where.danger_level = params.dangerLevel.trim();
    }
    if (params?.search && typeof params.search === 'string' && params.search.trim()) {
      const q = params.search.trim();
      where.OR = [
        { key: { contains: q } },
        { title: { contains: q } },
        { police_sector: { contains: q } },
        { category: { contains: q } },
      ];
    }
    const rows = await prisma.hotspotLocation.findMany({
      where,
      orderBy: { created_at: 'desc' },
    });
    return { success: true, data: serializeBigInt(rows) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createMasterHotspotAction(data: {
  key: string;
  title: string;
  police_sector: string;
  category: string;
  danger_level: string;
  icon_emoji?: string;
  lat: number;
  lng: number;
  active_start?: string;
  active_end?: string;
  schedule_display?: string;
  nearest_unit?: string;
}) {
  try {
    const cleanKey = data.key?.trim().toUpperCase();
    const cleanTitle = data.title?.trim();
    if (!cleanKey || !cleanTitle) {
      return { success: false, error: 'Kode dan Nama Titik Rawan wajib diisi!' };
    }
    if (!data.police_sector?.trim()) {
      return { success: false, error: 'Sektor Polsek / Wilayah hukum wajib diisi!' };
    }
    if (!data.category?.trim()) {
      return { success: false, error: 'Kategori kerawanan wajib diisi!' };
    }
    if (!data.danger_level?.trim()) {
      return { success: false, error: 'Tingkat status bahaya wajib diisi!' };
    }
    if (
      data.lat === undefined ||
      data.lat === null ||
      isNaN(Number(data.lat)) ||
      data.lng === undefined ||
      data.lng === null ||
      isNaN(Number(data.lng))
    ) {
      return { success: false, error: 'Koordinat lokasi (latitude dan longitude) wajib diisi angka valid!' };
    }

    const scheduleDisplay =
      data.schedule_display?.trim() ||
      (data.active_start?.trim() && data.active_end?.trim()
        ? `${data.active_start.trim()} - ${data.active_end.trim()} WIB`
        : '');
    if (!scheduleDisplay) {
      return { success: false, error: 'Jadwal / jam operasional rawan wajib diisi!' };
    }
    if (!data.nearest_unit?.trim()) {
      return { success: false, error: 'Unit terdekat / personel siaga wajib diisi!' };
    }

    const created = await prisma.hotspotLocation.create({
      data: {
        key: cleanKey,
        title: cleanTitle,
        police_sector: data.police_sector.trim(),
        category: data.category.trim(),
        danger_level: data.danger_level.trim(),
        icon_emoji: data.icon_emoji?.trim(),
        lat: Number(data.lat),
        lng: Number(data.lng),
        active_start: data.active_start?.trim(),
        active_end: data.active_end?.trim(),
        schedule_display: scheduleDisplay,
        nearest_unit: data.nearest_unit.trim(),
      },
    });

    await auditLog('CREATE_HOTSPOT', `Menambahkan titik rawan GIS baru: ${created.key} - ${created.title}`);
    revalidatePath('/console');
    return { success: true, data: serializeBigInt(created) };
  } catch (error: any) {
    return { success: false, error: error.message?.includes('Unique') ? 'Kode titik rawan sudah terdaftar!' : error.message };
  }
}

export async function updateMasterHotspotAction(
  id: number | string | bigint,
  data: {
    key?: string;
    title: string;
    police_sector: string;
    category: string;
    danger_level: string;
    icon_emoji?: string;
    lat: number;
    lng: number;
    active_start?: string;
    active_end?: string;
    schedule_display?: string;
    nearest_unit?: string;
  }
) {
  try {
    const idCheck = parsePositiveBigIntId(id, 'ID Titik Rawan');
    if (!idCheck.valid) {
      return { success: false, error: idCheck.error };
    }

    const cleanTitle = data.title?.trim();
    if (!cleanTitle) {
      return { success: false, error: 'Nama Titik Rawan wajib diisi!' };
    }
    if (!data.police_sector?.trim()) {
      return { success: false, error: 'Sektor Polsek / Wilayah hukum wajib diisi!' };
    }
    if (!data.category?.trim()) {
      return { success: false, error: 'Kategori kerawanan wajib diisi!' };
    }
    if (!data.danger_level?.trim()) {
      return { success: false, error: 'Tingkat status bahaya wajib diisi!' };
    }
    if (
      data.lat === undefined ||
      data.lat === null ||
      isNaN(Number(data.lat)) ||
      data.lng === undefined ||
      data.lng === null ||
      isNaN(Number(data.lng))
    ) {
      return { success: false, error: 'Koordinat lokasi (latitude dan longitude) wajib diisi angka valid!' };
    }

    const scheduleDisplay =
      data.schedule_display?.trim() ||
      (data.active_start?.trim() && data.active_end?.trim()
        ? `${data.active_start.trim()} - ${data.active_end.trim()} WIB`
        : '');
    if (!scheduleDisplay) {
      return { success: false, error: 'Jadwal / jam operasional rawan wajib diisi!' };
    }
    if (!data.nearest_unit?.trim()) {
      return { success: false, error: 'Unit terdekat / personel siaga wajib diisi!' };
    }

    const updated = await prisma.hotspotLocation.update({
      where: { id: idCheck.value },
      data: {
        ...(data.key ? { key: data.key.trim().toUpperCase() } : {}),
        title: cleanTitle,
        police_sector: data.police_sector.trim(),
        category: data.category.trim(),
        danger_level: data.danger_level.trim(),
        icon_emoji: data.icon_emoji?.trim(),
        lat: Number(data.lat),
        lng: Number(data.lng),
        active_start: data.active_start?.trim(),
        active_end: data.active_end?.trim(),
        schedule_display: scheduleDisplay,
        nearest_unit: data.nearest_unit.trim(),
      },
    });

    await auditLog('UPDATE_HOTSPOT', `Memperbarui titik rawan GIS ID ${idCheck.value.toString()}: ${updated.key} - ${updated.title}`);
    revalidatePath('/console');
    return { success: true, data: serializeBigInt(updated) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteMasterHotspotAction(id: number | string | bigint) {
  try {
    const idCheck = parsePositiveBigIntId(id, 'ID Titik Rawan');
    if (!idCheck.valid) {
      return { success: false, error: idCheck.error };
    }

    const deleted = await prisma.hotspotLocation.delete({
      where: { id: idCheck.value },
    });
    await auditLog('DELETE_HOTSPOT', `Menghapus titik rawan GIS ID ${idCheck.value.toString()}: ${deleted.key} - ${deleted.title}`);
    revalidatePath('/console');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ==============================================================================
// 9.1 MASTER TIPE & STATUS OPERASIONAL KENDARAAN (master_vehicle_types & master_vehicle_statuses)
// ==============================================================================
export async function getMasterVehicleTypesAction() {
  try {
    const rows: any = await prisma.$queryRawUnsafe(`
      SELECT id, \`key\`, label, icon_emoji, display_order 
      FROM master_vehicle_types 
      WHERE is_active = 1 
      ORDER BY display_order ASC
    `);
    return { success: true, data: serializeBigInt(rows) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getMasterVehicleStatusesAction() {
  try {
    const rows: any = await prisma.$queryRawUnsafe(`
      SELECT id, \`key\`, label, badge_color, display_order 
      FROM master_vehicle_statuses 
      WHERE is_active = 1 
      ORDER BY display_order ASC
    `);
    return { success: true, data: serializeBigInt(rows) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ==============================================================================
// 10. MASTER ARMADA OPERASIONAL / KENDARAAN PATROLI (patrol_vehicles)
// ==============================================================================
export async function getMasterVehiclesAction(params?: {
  search?: string;
  status?: string;
  jenis?: string;
}) {
  try {
    const where: any = {};
    if (params?.status && typeof params.status === 'string' && params.status.trim()) {
      where.status_operasional = params.status.trim().toUpperCase();
    }
    if (params?.jenis && typeof params.jenis === 'string' && params.jenis.trim()) {
      where.jenis_kendaraan = params.jenis.trim();
    }
    if (params?.search && typeof params.search === 'string' && params.search.trim()) {
      const q = params.search.trim();
      where.OR = [
        { nomor_lambung: { contains: q } },
        { nama_armada: { contains: q } },
        { plat_nomor_polisi: { contains: q } },
      ];
    }
    const rows = await prisma.patrolVehicle.findMany({
      where,
      orderBy: { id: 'asc' },
    });
    return { success: true, data: serializeBigInt(rows) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createMasterVehicleAction(data: {
  nomor_lambung: string;
  nama_armada: string;
  jenis_kendaraan: string;
  plat_nomor_polisi?: string;
  icon_emoji?: string;
  status_operasional?: string;
  driver_officer_nrp?: string;
  current_lat?: number;
  current_lng?: number;
}) {
  try {
    const lambung = data.nomor_lambung?.trim().toUpperCase();
    const nama = data.nama_armada?.trim();
    if (!lambung || !nama) {
      return { success: false, error: 'Nomor lambung dan Nama armada wajib diisi!' };
    }
    if (!data.jenis_kendaraan?.trim()) {
      return { success: false, error: 'Jenis kendaraan armada operasional wajib dipilih!' };
    }
    if (!data.status_operasional?.trim()) {
      return { success: false, error: 'Status kesiapsiagaan armada wajib dipilih!' };
    }
    if (!data.plat_nomor_polisi?.trim()) {
      return { success: false, error: 'Nomor plat dinas polisi wajib diisi!' };
    }

    const qrToken = `QR-VEH-${lambung.replace(/[^A-Z0-9]/g, '')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const statusColors: Record<string, string> = {
      SIAGA: '#10B981',
      PATROLI: '#3B82F6',
      MENUJU_TKP: '#EF4444',
      PEMELIHARAAN: '#6B7280',
    };
    const statusOp = data.status_operasional.trim().toUpperCase();
    if (!statusColors[statusOp]) {
      return { success: false, error: 'Status kesiapsiagaan armada tidak valid!' };
    }

    const created = await prisma.patrolVehicle.create({
      data: {
        nomor_lambung: lambung,
        nama_armada: nama,
        jenis_kendaraan: data.jenis_kendaraan.trim(),
        plat_nomor_polisi: data.plat_nomor_polisi.trim().toUpperCase(),
        qr_token: qrToken,
        icon_emoji: data.icon_emoji?.trim(),
        status_operasional: statusOp,
        status_color: statusColors[statusOp],
        driver_officer_nrp: data.driver_officer_nrp?.trim(),
        current_lat: data.current_lat != null && !isNaN(Number(data.current_lat)) ? Number(data.current_lat) : null,
        current_lng: data.current_lng != null && !isNaN(Number(data.current_lng)) ? Number(data.current_lng) : null,
      },
    });

    await auditLog('CREATE_VEHICLE', `Mendaftarkan armada patroli baru: ${created.nomor_lambung} - ${created.nama_armada}`);
    revalidatePath('/console');
    return { success: true, data: serializeBigInt(created) };
  } catch (error: any) {
    return { success: false, error: error.message?.includes('Unique') ? 'Nomor lambung sudah terdaftar!' : error.message };
  }
}

export async function updateMasterVehicleAction(
  id: number | string,
  data: {
    nomor_lambung: string;
    nama_armada: string;
    jenis_kendaraan: string;
    plat_nomor_polisi?: string;
    icon_emoji?: string;
    status_operasional?: string;
    driver_officer_nrp?: string;
    current_lat?: number;
    current_lng?: number;
  }
) {
  try {
    const idCheck = parsePositiveIntId(id, 'ID Armada Kendaraan');
    if (!idCheck.valid) {
      return { success: false, error: idCheck.error };
    }

    const lambung = data.nomor_lambung?.trim().toUpperCase();
    const nama = data.nama_armada?.trim();
    if (!lambung || !nama) {
      return { success: false, error: 'Nomor lambung dan Nama armada wajib diisi!' };
    }
    if (!data.jenis_kendaraan?.trim()) {
      return { success: false, error: 'Jenis kendaraan armada operasional wajib dipilih!' };
    }
    if (!data.status_operasional?.trim()) {
      return { success: false, error: 'Status kesiapsiagaan armada wajib dipilih!' };
    }
    if (!data.plat_nomor_polisi?.trim()) {
      return { success: false, error: 'Nomor plat dinas polisi wajib diisi!' };
    }

    const statusColors: Record<string, string> = {
      SIAGA: '#10B981',
      PATROLI: '#3B82F6',
      MENUJU_TKP: '#EF4444',
      PEMELIHARAAN: '#6B7280',
    };
    const statusOp = data.status_operasional.trim().toUpperCase();
    if (!statusColors[statusOp]) {
      return { success: false, error: 'Status kesiapsiagaan armada tidak valid!' };
    }

    const updated = await prisma.patrolVehicle.update({
      where: { id: idCheck.value },
      data: {
        nomor_lambung: lambung,
        nama_armada: nama,
        jenis_kendaraan: data.jenis_kendaraan.trim(),
        plat_nomor_polisi: data.plat_nomor_polisi.trim().toUpperCase(),
        icon_emoji: data.icon_emoji?.trim(),
        status_operasional: statusOp,
        status_color: statusColors[statusOp],
        driver_officer_nrp: data.driver_officer_nrp?.trim(),
        current_lat: data.current_lat != null && !isNaN(Number(data.current_lat)) ? Number(data.current_lat) : null,
        current_lng: data.current_lng != null && !isNaN(Number(data.current_lng)) ? Number(data.current_lng) : null,
      },
    });

    await auditLog('UPDATE_VEHICLE', `Memperbarui armada patroli ID ${idCheck.value}: ${updated.nomor_lambung} - ${updated.nama_armada}`);
    revalidatePath('/console');
    return { success: true, data: serializeBigInt(updated) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteMasterVehicleAction(id: number | string) {
  try {
    const idCheck = parsePositiveIntId(id, 'ID Armada Kendaraan');
    if (!idCheck.valid) {
      return { success: false, error: idCheck.error };
    }

    const deleted = await prisma.patrolVehicle.delete({
      where: { id: idCheck.value },
    });
    await auditLog('DELETE_VEHICLE', `Menghapus armada patroli ID ${idCheck.value}: ${deleted.nomor_lambung} - ${deleted.nama_armada}`);
    revalidatePath('/console');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ==============================================================================
// 11. MASTER LOKASI PENYELESAIAN KASUS (master_resolution_location_types)
// ==============================================================================
export async function getMasterResolutionLocationsAction(params?: {
  search?: string;
  isActive?: boolean;
}) {
  try {
    const where: any = {};
    if (params?.isActive !== undefined) {
      where.is_active = params.isActive;
    }
    if (params?.search) {
      const q = params.search.trim();
      where.OR = [
        { key: { contains: q } },
        { label: { contains: q } },
        { keterangan: { contains: q } },
      ];
    }

    const rows = await prisma.masterResolutionLocationType.findMany({
      where,
      orderBy: { display_order: 'asc' },
    });
    return { success: true, data: serializeBigInt(rows) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createMasterResolutionLocationAction(data: {
  key: string;
  label: string;
  keterangan?: string;
  icon_emoji?: string;
  requires_strict_tkp?: boolean;
  badge_color?: string;
  badge_bg?: string;
  display_order?: number;
  is_active?: boolean;
}) {
  try {
    const key = data.key?.trim().toUpperCase();
    const label = data.label?.trim();
    if (!key || !label) {
      return { success: false, error: 'Key (Kode) dan Label Lokasi wajib diisi!' };
    }

    const existing = await prisma.masterResolutionLocationType.findUnique({
      where: { key },
    });
    if (existing) {
      return { success: false, error: `Kode lokasi "${key}" sudah terdaftar!` };
    }

    const created = await prisma.masterResolutionLocationType.create({
      data: {
        key,
        label,
        keterangan: data.keterangan?.trim() || null,
        icon_emoji: data.icon_emoji?.trim() || '📍',
        requires_strict_tkp: Boolean(data.requires_strict_tkp),
        badge_color: data.badge_color?.trim() || '#10B981',
        badge_bg: data.badge_bg?.trim() || '#ECFDF5',
        display_order: Number(data.display_order) || 1,
        is_active: data.is_active !== undefined ? Boolean(data.is_active) : true,
      },
    });

    await auditLog('CREATE_RESOLUTION_LOCATION', `Menambahkan master lokasi penyelesaian: ${key} - ${label}`);
    revalidatePath('/console');
    return { success: true, data: serializeBigInt(created) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateMasterResolutionLocationAction(
  id: number | string,
  data: {
    key?: string;
    label?: string;
    keterangan?: string;
    icon_emoji?: string;
    requires_strict_tkp?: boolean;
    badge_color?: string;
    badge_bg?: string;
    display_order?: number;
    is_active?: boolean;
  }
) {
  try {
    const idCheck = parsePositiveIntId(id, 'ID Master Lokasi');
    if (!idCheck.valid) return { success: false, error: idCheck.error };

    const updateData: any = {};
    if (data.key !== undefined) updateData.key = data.key.trim().toUpperCase();
    if (data.label !== undefined) updateData.label = data.label.trim();
    if (data.keterangan !== undefined) updateData.keterangan = data.keterangan.trim() || null;
    if (data.icon_emoji !== undefined) updateData.icon_emoji = data.icon_emoji.trim() || '📍';
    if (data.requires_strict_tkp !== undefined) updateData.requires_strict_tkp = Boolean(data.requires_strict_tkp);
    if (data.badge_color !== undefined) updateData.badge_color = data.badge_color.trim();
    if (data.badge_bg !== undefined) updateData.badge_bg = data.badge_bg.trim();
    if (data.display_order !== undefined) updateData.display_order = Number(data.display_order);
    if (data.is_active !== undefined) updateData.is_active = Boolean(data.is_active);

    const updated = await prisma.masterResolutionLocationType.update({
      where: { id: idCheck.value },
      data: updateData,
    });

    await auditLog('UPDATE_RESOLUTION_LOCATION', `Memperbarui master lokasi penyelesaian ID ${idCheck.value}: ${updated.key}`);
    revalidatePath('/console');
    return { success: true, data: serializeBigInt(updated) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteMasterResolutionLocationAction(id: number | string) {
  try {
    const idCheck = parsePositiveIntId(id, 'ID Master Lokasi');
    if (!idCheck.valid) return { success: false, error: idCheck.error };

    const deleted = await prisma.masterResolutionLocationType.delete({
      where: { id: idCheck.value },
    });

    await auditLog('DELETE_RESOLUTION_LOCATION', `Menghapus master lokasi penyelesaian ID ${idCheck.value}: ${deleted.key}`);
    revalidatePath('/console');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ==============================================================================
// 12. MASTER OBJEK DOKUMEN / BUKTI BAP PENYELESAIAN (master_resolution_document_types)
// ==============================================================================
export async function getMasterResolutionDocumentsAction(params?: {
  search?: string;
  isActive?: boolean;
}) {
  try {
    const where: any = {};
    if (params?.isActive !== undefined) {
      where.is_active = params.isActive;
    }
    if (params?.search) {
      const q = params.search.trim();
      where.OR = [
        { key: { contains: q } },
        { label: { contains: q } },
        { keterangan: { contains: q } },
      ];
    }

    const rows = await prisma.masterResolutionDocumentType.findMany({
      where,
      orderBy: { display_order: 'asc' },
    });
    return { success: true, data: serializeBigInt(rows) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createMasterResolutionDocumentAction(data: {
  key: string;
  label: string;
  keterangan?: string;
  icon_emoji?: string;
  badge_color?: string;
  badge_bg?: string;
  display_order?: number;
  is_active?: boolean;
}) {
  try {
    const key = data.key?.trim().toUpperCase();
    const label = data.label?.trim();
    if (!key || !label) {
      return { success: false, error: 'Key (Kode) dan Label Dokumen wajib diisi!' };
    }

    const existing = await prisma.masterResolutionDocumentType.findUnique({
      where: { key },
    });
    if (existing) {
      return { success: false, error: `Kode dokumen "${key}" sudah terdaftar!` };
    }

    const created = await prisma.masterResolutionDocumentType.create({
      data: {
        key,
        label,
        keterangan: data.keterangan?.trim() || null,
        icon_emoji: data.icon_emoji?.trim() || '📄',
        badge_color: data.badge_color?.trim() || '#2563EB',
        badge_bg: data.badge_bg?.trim() || '#EFF6FF',
        display_order: Number(data.display_order) || 1,
        is_active: data.is_active !== undefined ? Boolean(data.is_active) : true,
      },
    });

    await auditLog('CREATE_RESOLUTION_DOCUMENT', `Menambahkan master dokumen penyelesaian: ${key} - ${label}`);
    revalidatePath('/console');
    return { success: true, data: serializeBigInt(created) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateMasterResolutionDocumentAction(
  id: number | string,
  data: {
    key?: string;
    label?: string;
    keterangan?: string;
    icon_emoji?: string;
    badge_color?: string;
    badge_bg?: string;
    display_order?: number;
    is_active?: boolean;
  }
) {
  try {
    const idCheck = parsePositiveIntId(id, 'ID Master Dokumen');
    if (!idCheck.valid) return { success: false, error: idCheck.error };

    const updateData: any = {};
    if (data.key !== undefined) updateData.key = data.key.trim().toUpperCase();
    if (data.label !== undefined) updateData.label = data.label.trim();
    if (data.keterangan !== undefined) updateData.keterangan = data.keterangan.trim() || null;
    if (data.icon_emoji !== undefined) updateData.icon_emoji = data.icon_emoji.trim() || '📄';
    if (data.badge_color !== undefined) updateData.badge_color = data.badge_color.trim();
    if (data.badge_bg !== undefined) updateData.badge_bg = data.badge_bg.trim();
    if (data.display_order !== undefined) updateData.display_order = Number(data.display_order);
    if (data.is_active !== undefined) updateData.is_active = Boolean(data.is_active);

    const updated = await prisma.masterResolutionDocumentType.update({
      where: { id: idCheck.value },
      data: updateData,
    });

    await auditLog('UPDATE_RESOLUTION_DOCUMENT', `Memperbarui master dokumen penyelesaian ID ${idCheck.value}: ${updated.key}`);
    revalidatePath('/console');
    return { success: true, data: serializeBigInt(updated) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteMasterResolutionDocumentAction(id: number | string) {
  try {
    const idCheck = parsePositiveIntId(id, 'ID Master Dokumen');
    if (!idCheck.valid) return { success: false, error: idCheck.error };

    const deleted = await prisma.masterResolutionDocumentType.delete({
      where: { id: idCheck.value },
    });

    await auditLog('DELETE_RESOLUTION_DOCUMENT', `Menghapus master dokumen penyelesaian ID ${idCheck.value}: ${deleted.key}`);
    revalidatePath('/console');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
