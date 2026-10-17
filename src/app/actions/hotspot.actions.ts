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

export async function getHotspotsAction() {
  try {
    const useCase = UseCaseFactory.getManageHotspotsUseCase();
    const hotspots = await useCase.getAll();
    return { success: true, data: serializeBigInt(hotspots.map((h) => h.toJSON())) };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal mengambil data titik rawan.' };
  }
}

export async function createHotspotAction(input: {
  title: string;
  wilayahPolsek: string;
  kategori: string;
  statusBahaya: string;
  ikonEmoji?: string;
  lat: number;
  lng: number;
  jadwalMulai?: string;
  jadwalSelesai?: string;
  jadwalDisplay?: string;
  unitTerdekat?: string;
}) {
  try {
    const useCase = UseCaseFactory.getManageHotspotsUseCase();
    const created = await useCase.createHotspot({
      title: input.title,
      wilayahPolsek: input.wilayahPolsek,
      kategori: input.kategori,
      statusBahaya: input.statusBahaya,
      ikonEmoji: input.ikonEmoji || '🔴',
      lat: input.lat,
      lng: input.lng,
      jadwalMulai: input.jadwalMulai || '23:00',
      jadwalSelesai: input.jadwalSelesai || '04:30',
      jadwalDisplay: input.jadwalDisplay || `${input.jadwalMulai || '23:00'} - ${input.jadwalSelesai || '04:30'} WIB`,
      unitTerdekat: input.unitTerdekat || '-',
    });
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
    ikonEmoji?: string;
    lat?: number;
    lng?: number;
    jadwalMulai?: string;
    jadwalSelesai?: string;
    jadwalDisplay?: string;
    unitTerdekat?: string;
  }
) {
  try {
    const useCase = UseCaseFactory.getManageHotspotsUseCase();
    const updated = await useCase.updateHotspot(key, input);
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
    revalidatePath('/personil');
    revalidatePath('/command-center');
    return { success: true, deleted };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal menghapus titik rawan.' };
  }
}
