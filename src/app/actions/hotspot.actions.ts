'use server';

import { UseCaseFactory } from '@/application/factories/use-case.factory';
import { revalidatePath } from 'next/cache';

function serializeBigInt<T>(obj: T): T {
  return JSON.parse(
    JSON.stringify(obj, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    )
  );
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}
let hotspotsCache: CacheEntry<any> | null = null;
let masterHotspotOptionsCache: CacheEntry<any> | null = null;
const HOTSPOTS_CACHE_TTL_MS = 60 * 1000; // 60 detik
const MASTER_HOTSPOT_OPTIONS_TTL_MS = 10 * 60 * 1000; // 10 menit

export async function getHotspotsAction() {
  try {
    const now = Date.now();
    if (hotspotsCache && now - hotspotsCache.timestamp < HOTSPOTS_CACHE_TTL_MS) {
      return { success: true, data: hotspotsCache.data };
    }

    const useCase = UseCaseFactory.getManageHotspotsUseCase();
    const hotspots = await useCase.getAll();
    const serialized = serializeBigInt(hotspots.map((h) => h.toJSON()));
    hotspotsCache = { data: serialized, timestamp: now };
    return { success: true, data: serialized };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal mengambil data titik rawan.' };
  }
}

export async function createHotspotAction(input: {
  title: string;
  wilayahPolsek: string;
  kategori: string;
  statusBahaya: string;
  ikonEmoji?: string | null;
  lat: number;
  lng: number;
  jadwalMulai?: string | null;
  jadwalSelesai?: string | null;
  jadwalDisplay?: string | null;
  unitTerdekat?: string | null;
}) {
  try {
    const cleanTitle = input.title?.trim();
    if (!cleanTitle) {
      return { success: false, error: 'Nama titik rawan wajib diisi!' };
    }
    const cleanSector = input.wilayahPolsek?.trim();
    if (!cleanSector) {
      return { success: false, error: 'Wilayah hukum / Polsek wajib diisi!' };
    }
    const cleanKategori = input.kategori?.trim();
    if (!cleanKategori) {
      return { success: false, error: 'Kategori kerawanan wajib diisi!' };
    }
    const cleanStatus = input.statusBahaya?.trim();
    if (!cleanStatus) {
      return { success: false, error: 'Tingkat status bahaya wajib diisi!' };
    }
    if (
      input.lat === undefined ||
      input.lat === null ||
      isNaN(Number(input.lat)) ||
      input.lng === undefined ||
      input.lng === null ||
      isNaN(Number(input.lng))
    ) {
      return { success: false, error: 'Koordinat lokasi (latitude & longitude) wajib diisi angka valid!' };
    }

    const cleanDisplay =
      input.jadwalDisplay?.trim() ||
      (input.jadwalMulai?.trim() && input.jadwalSelesai?.trim()
        ? `${input.jadwalMulai.trim()} - ${input.jadwalSelesai.trim()} WIB`
        : '');
    if (!cleanDisplay) {
      return { success: false, error: 'Jadwal / jam operasional rawan wajib diisi!' };
    }
    const cleanUnit = input.unitTerdekat?.trim();
    if (!cleanUnit) {
      return { success: false, error: 'Unit operasional terdekat / personel siaga wajib diisi!' };
    }

    const useCase = UseCaseFactory.getManageHotspotsUseCase();
    const created = await useCase.createHotspot({
      title: cleanTitle,
      wilayahPolsek: cleanSector,
      kategori: cleanKategori,
      statusBahaya: cleanStatus,
      ikonEmoji: input.ikonEmoji?.trim() || '',
      lat: Number(input.lat),
      lng: Number(input.lng),
      jadwalMulai: input.jadwalMulai?.trim() || '',
      jadwalSelesai: input.jadwalSelesai?.trim() || '',
      jadwalDisplay: cleanDisplay,
      unitTerdekat: cleanUnit,
    });
    hotspotsCache = null;
    revalidatePath('/personil');
    revalidatePath('/command-center');
    return { success: true, data: serializeBigInt(created.toJSON()) };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal membuat titik rawan.' };
  }
}

export async function updateHotspotAction(
  key: string,
  input: {
    title?: string;
    wilayahPolsek?: string;
    kategori?: string;
    statusBahaya?: string;
    ikonEmoji?: string | null;
    lat?: number;
    lng?: number;
    jadwalMulai?: string | null;
    jadwalSelesai?: string | null;
    jadwalDisplay?: string | null;
    unitTerdekat?: string | null;
  }
) {
  try {
    const useCase = UseCaseFactory.getManageHotspotsUseCase();
    const updated = await useCase.updateHotspot(key, input);
    hotspotsCache = null;
    revalidatePath('/personil');
    revalidatePath('/command-center');
    return { success: true, data: serializeBigInt(updated.toJSON()) };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal memperbarui titik rawan.' };
  }
}

export async function deleteHotspotAction(key: string) {
  try {
    const useCase = UseCaseFactory.getManageHotspotsUseCase();
    const deleted = await useCase.deleteHotspot(key);
    hotspotsCache = null;
    revalidatePath('/personil');
    revalidatePath('/command-center');
    return { success: true, deleted };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal menghapus titik rawan.' };
  }
}

/**
 * Mengambil master kategori kerawanan dan tingkat status bahaya titik rawan dari database
 */
export async function getMasterHotspotOptionsAction() {
  try {
    const now = Date.now();
    if (masterHotspotOptionsCache && now - masterHotspotOptionsCache.timestamp < MASTER_HOTSPOT_OPTIONS_TTL_MS) {
      return { success: true, data: masterHotspotOptionsCache.data };
    }

    const { prisma } = await import('@/infrastructure/db/prisma.client');
    const [categories, dangerLevels] = await Promise.all([
      prisma.masterHotspotCategory.findMany({
        where: { is_active: true },
        orderBy: { display_order: 'asc' },
      }),
      prisma.masterHotspotDangerLevel.findMany({
        where: { is_active: true },
        orderBy: { display_order: 'asc' },
      }),
    ]);

    const serialized = {
      categories: serializeBigInt(categories),
      dangerLevels: serializeBigInt(dangerLevels),
    };
    masterHotspotOptionsCache = { data: serialized, timestamp: now };

    return {
      success: true,
      data: serialized,
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal mengambil master titik rawan.' };
  }
}
