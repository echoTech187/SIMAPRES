'use server';

// SIMAPRES 110 - Piket SPKT Server Actions (Delivery Adapter / Clean Architecture)
import { UseCaseFactory } from '@/application/factories/use-case.factory';
import { revalidatePath } from 'next/cache';
import { cacheGetOrLoad, cacheInvalidate } from '@/infrastructure/cache/app-cache';
import { requireRole } from '@/lib/session';
import { serializeBigInt, SerializedBigInt } from '@/lib/serialization';
import { getErrorMessage, actionSuccess, actionFailure, type ActionResult } from '@/types/action.types';
import type { PiketLookupsResponse, OfficerTodayPiketSchedule } from '@/types/piket.types';


/**
 * Mendapatkan jadwal piket pada tanggal tertentu (Hari ini, Besok, Lusa, dll).
 */
export async function getPiketByDateAction(station_id?: number, dateStr?: string) {
  try {
    const auth = await requireRole('ANY_LOGGED_IN');
    if (!auth.authorized) {
      return { success: false, error: auth.error };
    }

    const cacheKey = `piket_by_date_${station_id || 'all'}_${dateStr || 'today'}`;
    return await cacheGetOrLoad(cacheKey, 20000, async () => {
      const repo = UseCaseFactory.getPiketRepository();
      const schedule = await repo.getPiketByDate(station_id, dateStr);
      return {
        success: true,
        data: serializeBigInt(schedule),
      };
    });
  } catch (err: unknown) {
    console.error('Piket action error:', err);
    return {
      success: false,
      error: getErrorMessage(err),
    };
  }
}

/**
 * Mendapatkan timeline piket harian: Riwayat Sebelum-sebelumnya (H-7 s/d H-1), Hari Ini, Besok, Lusa, dan hari-hari berikutnya.
 */
export async function getPiketTimelineAction({
  station_id,
  startDateStr,
  daysBefore = 7,
  daysAfter = 14,
}: {
  station_id?: number;
  startDateStr?: string;
  daysBefore?: number;
  daysAfter?: number;
}) {
  try {
    const auth = await requireRole('ANY_LOGGED_IN');
    if (!auth.authorized) {
      return { success: false, error: auth.error };
    }

    const cacheKey = `piket_timeline_${station_id || 'all'}_${startDateStr || 'anchor'}_${daysBefore}_${daysAfter}`;
    return await cacheGetOrLoad(cacheKey, 30000, async () => {
      const repo = UseCaseFactory.getPiketRepository();
      const timelineItems = await repo.getPiketTimeline({
        station_id,
        startDateStr,
        daysBefore,
        daysAfter,
      });
      return {
        success: true,
        data: serializeBigInt(timelineItems),
      };
    });
  } catch (err: unknown) {
    console.error('getPiketTimelineAction error:', err);
    return {
      success: false,
      error: getErrorMessage(err),
    };
  }
}

/**
 * Atur / Simpan Jadwal Piket Harian (Pilih tanggal & siapa saja yang piket)
 */
export async function saveDailyPiketAction({
  station_id,
  schedule_date,
  regu = 'Regu A',
  pawas_id,
  members,
}: {
  station_id: number;
  schedule_date: string; // YYYY-MM-DD
  regu?: string;
  pawas_id?: string | number | null;
  members: Array<{
    officer_id: string | number;
    role_piket?: string;
    pos_penugasan?: string;
    status_kehadiran?: string;
  }>;
}): Promise<ActionResult<unknown>> {
  try {
    const auth = await requireRole(['PAWAS', 'OPERATOR', 'SUPERADMIN']);
    if (!auth.authorized) {
      return { success: false, error: auth.error };
    }

    const repo = UseCaseFactory.getPiketRepository();
    const result = await repo.saveDailyPiket({
      station_id,
      schedule_date,
      regu,
      pawas_id,
      members,
    });

    cacheInvalidate('piket_');
    revalidatePath('/console');
    return {
      success: true,
      message: 'Jadwal piket berhasil disimpan',
      data: serializeBigInt(result),
    };
  } catch (err: unknown) {
    console.error('saveDailyPiketAction error:', err);
    return {
      success: false,
      error: getErrorMessage(err),
    };
  }
}

/**
 * Tambah satu personel langsung ke jadwal piket hari/tanggal tertentu
 */
export async function addOfficerToPiketAction({
  schedule_id,
  officer_id,
  role_piket = 'PIKET_SABHARA',
  pos_penugasan = 'Mako Penjagaan',
}: {
  schedule_id: number;
  officer_id: string | number;
  role_piket?: string;
  pos_penugasan?: string;
}): Promise<ActionResult<unknown>> {
  try {
    const auth = await requireRole(['PAWAS', 'OPERATOR', 'SUPERADMIN']);
    if (!auth.authorized) {
      return { success: false, error: auth.error };
    }

    const repo = UseCaseFactory.getPiketRepository();
    const created = await repo.addOfficerToPiket({
      schedule_id,
      officer_id,
      role_piket,
      pos_penugasan,
    });

    cacheInvalidate('piket_');
    revalidatePath('/console');
    return {
      success: true,
      message: `Berhasil menambahkan ${created.officer?.user?.full_name || 'personel'} ke piket`,
      data: serializeBigInt(created),
    };
  } catch (err: unknown) {
    console.error('addOfficerToPiketAction error:', err);
    return {
      success: false,
      error: getErrorMessage(err),
    };
  }
}

/**
 * Hapus personel dari jadwal piket tanggal tertentu
 */
export async function removeOfficerFromPiketAction(member_id: number): Promise<ActionResult<void>> {
  try {
    const auth = await requireRole(['PAWAS', 'OPERATOR', 'SUPERADMIN']);
    if (!auth.authorized) {
      return { success: false, error: auth.error };
    }

    const repo = UseCaseFactory.getPiketRepository();
    await repo.removeOfficerFromPiket(member_id);

    cacheInvalidate('piket_');
    revalidatePath('/console');
    return {
      success: true,
      data: undefined,
      message: 'Personel berhasil dihapus dari jadwal piket',
    };
  } catch (err: unknown) {
    console.error('removeOfficerFromPiketAction error:', err);
    return {
      success: false,
      error: getErrorMessage(err),
    };
  }
}

/**
 * Presensi Kehadiran Cepat Anggota Piket (Hadir, Izin, Sakit, Lepas Piket)
 * Hanya dapat dilakukan pada hari H dinas berjalan. Pada H-1 dan hari-hari sebelumnya terkunci permanen.
 */
export async function updateMemberAttendanceAction(memberId: number, status: string): Promise<ActionResult<unknown>> {
  try {
    const auth = await requireRole(['PAWAS', 'OPERATOR', 'SUPERADMIN']);
    if (!auth.authorized) {
      return { success: false, error: auth.error };
    }

    const repo = UseCaseFactory.getPiketRepository();
    const updated = await repo.updateMemberAttendance(memberId, status);

    cacheInvalidate('piket_');
    revalidatePath('/console');
    return {
      success: true,
      message: `Status kehadiran ${updated.officer?.user?.full_name || ''} diubah menjadi ${status}`,
      data: serializeBigInt(updated),
    };
  } catch (err: unknown) {
    console.error('updateMemberAttendanceAction error:', err);
    return {
      success: false,
      error: getErrorMessage(err),
    };
  }
}

/**
 * Hapus jadwal piket pada tanggal tertentu
 */
export async function deleteDailyPiketScheduleAction(schedule_id: number): Promise<ActionResult<void>> {
  try {
    const auth = await requireRole(['PAWAS', 'OPERATOR', 'SUPERADMIN']);
    if (!auth.authorized) {
      return { success: false, error: auth.error };
    }

    const repo = UseCaseFactory.getPiketRepository();
    await repo.deleteDailyPiketSchedule(schedule_id);

    cacheInvalidate('piket_');
    revalidatePath('/console');
    return {
      success: true,
      data: undefined,
      message: 'Jadwal piket tanggal tersebut berhasil dihapus',
    };
  } catch (err: unknown) {
    console.error('deleteDailyPiketScheduleAction error:', err);
    return {
      success: false,
      error: getErrorMessage(err),
    };
  }
}

/**
 * Dropdown lookup stations dan officers untuk pemilihan piket
 */
export async function getPiketLookupsAction(
  station_id?: number
): Promise<ActionResult<SerializedBigInt<PiketLookupsResponse>>> {
  try {
    const auth = await requireRole('ANY_LOGGED_IN');
    if (!auth.authorized) {
      return actionFailure(auth.error);
    }

    return await cacheGetOrLoad('piket_lookups', 60000, async () => {
      const repo = UseCaseFactory.getPiketRepository();
      const data = await repo.getPiketLookups(station_id);
      return actionSuccess(serializeBigInt(data));
    });
  } catch (err: unknown) {
    console.error('getPiketLookupsAction error:', err);
    return actionFailure(getErrorMessage(err));
  }
}

/**
 * Mendapatkan jadwal piket riil hari ini untuk personil tertentu (Anti-Hardcode)
 */
export async function getOfficerTodayPiketScheduleAction(
  officerIdOrNrp: string | number
): Promise<ActionResult<SerializedBigInt<OfficerTodayPiketSchedule> | null>> {
  try {
    const auth = await requireRole('ANY_LOGGED_IN');
    if (!auth.authorized) {
      return actionFailure(auth.error);
    }

    const cacheKey = `officer_today_piket_${officerIdOrNrp}`;
    return await cacheGetOrLoad(cacheKey, 30000, async () => {
      const repo = UseCaseFactory.getPiketRepository();
      const data = await repo.getOfficerTodayPiketSchedule(officerIdOrNrp);
      if (!data) {
        return actionSuccess(null);
      }
      return actionSuccess(serializeBigInt(data));
    });
  } catch (err: unknown) {
    console.error('getOfficerTodayPiketScheduleAction error:', err);
    return actionFailure(getErrorMessage(err));
  }
}

