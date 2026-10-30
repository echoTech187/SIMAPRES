'use server';

import { UseCaseFactory } from '@/application/factories/use-case.factory';
import { serializeBigInt } from '@/lib/serialization';
import { getErrorMessage, type ActionResult } from '@/types/action.types';
import { requireRole } from '@/lib/session';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}
let hotspotsCache: CacheEntry<any[]> | null = null;
let masterHotspotOptionsCache: CacheEntry<unknown> | null = null;
const HOTSPOTS_CACHE_TTL_MS = 60 * 1000; // 60 detik
const MASTER_HOTSPOT_OPTIONS_TTL_MS = 10 * 60 * 1000; // 10 menit

export async function getHotspotsAction(): Promise<ActionResult<any[]>> {

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
  } catch (error: unknown) {
    return { success: false, error: getErrorMessage(error) };
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
    const auth = await requireRole(['PAWAS', 'OPERATOR', 'SUPERADMIN']);
    if (!auth.authorized) {
      return { success: false, error: auth.error };
    }

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
    return { success: true, data: serializeBigInt(created.toJSON()) };
  } catch (error: unknown) {
    return { success: false, error: getErrorMessage(error) };
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
): Promise<ActionResult<unknown>> {
  try {
    const auth = await requireRole(['PAWAS', 'OPERATOR', 'SUPERADMIN']);
    if (!auth.authorized) {
      return { success: false, error: auth.error };
    }

    const useCase = UseCaseFactory.getManageHotspotsUseCase();
    const updated = await useCase.updateHotspot(key, input);
    hotspotsCache = null;
    return { success: true, data: serializeBigInt(updated.toJSON()) };
  } catch (error: unknown) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function deleteHotspotAction(key: string): Promise<ActionResult<{ deleted: boolean }>> {
  try {
    const auth = await requireRole(['PAWAS', 'OPERATOR', 'SUPERADMIN']);
    if (!auth.authorized) {
      return { success: false, error: auth.error };
    }

    const useCase = UseCaseFactory.getManageHotspotsUseCase();
    const deleted = await useCase.deleteHotspot(key);
    hotspotsCache = null;
    return { success: true, data: { deleted } };
  } catch (error: unknown) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Mengambil master kategori kerawanan dan tingkat status bahaya titik rawan dari database
 */
export async function getMasterHotspotOptionsAction(): Promise<ActionResult<{ categories: unknown; dangerLevels: unknown }>> {
  try {
    const now = Date.now();
    if (masterHotspotOptionsCache && now - masterHotspotOptionsCache.timestamp < MASTER_HOTSPOT_OPTIONS_TTL_MS) {
      return { success: true, data: masterHotspotOptionsCache.data as { categories: unknown; dangerLevels: unknown } };
    }

    const useCase = UseCaseFactory.getManageHotspotsUseCase();
    const { categories, dangerLevels } = await useCase.getMasterOptions();

    const serialized = {
      categories: serializeBigInt(categories),
      dangerLevels: serializeBigInt(dangerLevels),
    };
    masterHotspotOptionsCache = { data: serialized, timestamp: now };

    return {
      success: true,
      data: serialized,
    };
  } catch (error: unknown) {
    return { success: false, error: getErrorMessage(error) };
  }
}
