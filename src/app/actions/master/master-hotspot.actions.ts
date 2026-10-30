'use server';

import { prisma, serializeBigInt, auditLog, parsePositiveIntId, parsePositiveBigIntId, revalidatePath, requireSuperadmin, requireRole } from './master-common';

// ==============================================================================
// 1. MASTER TITIK RAWAN / HOTSPOT CATEGORIES (master_hotspot_categories)
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
  display_order: number;
  is_active: boolean;
}) {
  const auth = await requireSuperadmin();
  if (!auth.authorized) return { success: false, error: auth.error };
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
    display_order?: number;
    is_active?: boolean;
  }
) {
  const auth = await requireSuperadmin();
  if (!auth.authorized) return { success: false, error: auth.error };
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
  const auth = await requireSuperadmin();
  if (!auth.authorized) return { success: false, error: auth.error };
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
// 2. MASTER TITIK RAWAN GIS / LOKASI RAWAN KRIMINALITAS (hotspot_locations)
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
  lat: number;
  lng: number;
  active_start?: string;
  active_end?: string;
  schedule_display?: string;
  nearest_unit?: string;
}) {
  const auth = await requireRole(['PAWAS', 'OPERATOR', 'SUPERADMIN']);
  if (!auth.authorized) return { success: false, error: auth.error };
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
    lat: number;
    lng: number;
    active_start?: string;
    active_end?: string;
    schedule_display?: string;
    nearest_unit?: string;
  }
) {
  const auth = await requireRole(['PAWAS', 'OPERATOR', 'SUPERADMIN']);
  if (!auth.authorized) return { success: false, error: auth.error };
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
  const auth = await requireRole(['PAWAS', 'OPERATOR', 'SUPERADMIN']);
  if (!auth.authorized) return { success: false, error: auth.error };
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
