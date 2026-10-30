'use server';

import { prisma, serializeBigInt, auditLog, parsePositiveIntId, revalidatePath, requireSuperadmin } from './master-common';

// ==============================================================================
// 1. MASTER UNIT OPERASIONAL (master_operational_units)
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
  duties: string;
  default_orders: string;
  display_order: number;
  is_active: boolean;
}) {
  const auth = await requireSuperadmin();
  if (!auth.authorized) return { success: false, error: auth.error };
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
    const effectiveDuties = data.duties?.trim() ? data.duties.trim() : 'Melaksanakan tugas pelayanan dan pengamanan presisi kepolisian.';
    const effectiveOrders = data.default_orders?.trim() ? data.default_orders.trim() : 'Meluncur ke TKP, amankan perimeter, koordinasi dengan pelapor, dan laporkan perkembangan situasi ke Pawas.';

    const created = await prisma.masterOperationalUnit.create({
      data: {
        key: cleanKey,
        unit_name: cleanName,
        short_name: cleanShort,
        duties: effectiveDuties,
        default_orders: effectiveOrders,
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
    duties: string;
    default_orders: string;
    display_order?: number;
    is_active?: boolean;
  }
) {
  const auth = await requireSuperadmin();
  if (!auth.authorized) return { success: false, error: auth.error };
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
    const updated = await prisma.masterOperationalUnit.update({
      where: { id: idCheck.value },
      data: {
        key: cleanKey,
        unit_name: cleanName,
        short_name: cleanShort,
        ...(data.duties?.trim() ? { duties: data.duties.trim() } : {}),
        ...(data.default_orders?.trim() ? { default_orders: data.default_orders.trim() } : {}),
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
  const auth = await requireSuperadmin();
  if (!auth.authorized) return { success: false, error: auth.error };
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
// 2. MASTER TINGKAT HIERARKI KANTOR POLISI (master_station_levels)
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
// 3. MASTER KANTOR POLISI & JURISDIKSI (police_stations)
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
  phone_piket?: string;
  phone_kapolsek?: string;
  is_active?: boolean;
}) {
  const auth = await requireSuperadmin();
  if (!auth.authorized) return { success: false, error: auth.error };
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

    const stationData: any = {
      station_code: cleanCode,
      station_name: cleanName,
      station_level: data.station_level.trim(),
      address: data.address.trim(),
      office_lat: Number(data.office_lat),
      office_lng: Number(data.office_lng),
      geofence_radius_meters: Number(data.geofence_radius_meters),
      phone_piket: data.phone_piket?.trim() || null,
      phone_kapolsek: data.phone_kapolsek?.trim() || null,
      is_active: data.is_active ?? true,
    };

    const created = await prisma.policeStation.create({
      data: stationData,
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
    phone_piket?: string;
    phone_kapolsek?: string;
    is_active?: boolean;
  }
) {
  const auth = await requireSuperadmin();
  if (!auth.authorized) return { success: false, error: auth.error };
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

    const updateData: any = {
      station_code: cleanCode,
      station_name: cleanName,
      station_level: data.station_level.trim(),
      address: data.address.trim(),
      office_lat: Number(data.office_lat),
      office_lng: Number(data.office_lng),
      geofence_radius_meters: Number(data.geofence_radius_meters),
      phone_piket: data.phone_piket?.trim() || null,
      phone_kapolsek: data.phone_kapolsek?.trim() || null,
      ...(data.is_active !== undefined ? { is_active: Boolean(data.is_active) } : {}),
    };

    const updated = await prisma.policeStation.update({
      where: { id: idCheck.value },
      data: updateData,
    });

    await auditLog('UPDATE_POLICE_STATION', `Memperbarui kantor polisi ID ${idCheck.value}: ${updated.station_code} - ${updated.station_name}`);
    revalidatePath('/console');
    return { success: true, data: serializeBigInt(updated) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deletePoliceStationMasterAction(id: number | string) {
  const auth = await requireSuperadmin();
  if (!auth.authorized) return { success: false, error: auth.error };
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
