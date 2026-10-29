'use server';

import { prisma } from '@/infrastructure/db/prisma.client';
import { revalidatePath } from 'next/cache';

function serializeBigInt<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  return JSON.parse(
    JSON.stringify(obj, (_key, value) => {
      if (typeof value === 'bigint') return value.toString();
      if (value && typeof value === 'object' && (value.isDecimal || value.constructor?.name === 'Decimal')) {
        return Number(value);
      }
      return value;
    })
  );
}

import { POLRI_ATTENDANCE_STATUSES, POLRI_PIKET_ROLES } from '@/types/piket.types';

/**
 * Mendapatkan jadwal piket pada tanggal tertentu (Hari ini, Besok, Lusa, dll).
 */
export async function getPiketByDateAction(station_id?: number, dateStr?: string) {
  try {
    let targetDate: Date;
    if (dateStr) {
      const parts = dateStr.split('-').map(Number);
      targetDate = new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0);
    } else {
      targetDate = new Date();
    }
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0);
    const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);

    const where: any = {
      schedule_date: {
        gte: startOfDay,
        lte: endOfDay,
      },
    };

    if (station_id) {
      where.station_id = Number(station_id);
    }

    const schedule = await prisma.piketSchedule.findFirst({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        station: {
          select: {
            id: true,
            station_code: true,
            station_name: true,
            station_level: true,
          },
        },
        pawas: {
          select: {
            id: true,
            nrp: true,
            rank_pangkat: true,
            jabatan: true,
            user: { select: { full_name: true, phone_number: true, avatar_url: true } },
          },
        },
        ka_spkt: {
          select: {
            id: true,
            nrp: true,
            rank_pangkat: true,
            jabatan: true,
            user: { select: { full_name: true, phone_number: true, avatar_url: true } },
          },
        },
        members: {
          orderBy: { role_piket: 'asc' },
          include: {
            officer: {
              select: {
                id: true,
                nrp: true,
                rank_pangkat: true,
                jabatan: true,
                duty_status: true,
                user: { select: { full_name: true, phone_number: true, avatar_url: true } },
                unit: { select: { key: true, unit_name: true, short_name: true } },
              },
            },
          },
        },
      },
    });

    return {
      success: true,
      data: serializeBigInt(schedule),
    };
  } catch (err: any) {
    console.error('getPiketByDateAction error:', err);
    return {
      success: false,
      error: err.message || 'Gagal memuat piket harian',
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let baseDate: Date;
    if (startDateStr) {
      const parts = startDateStr.split('-').map(Number);
      baseDate = new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0);
    } else {
      baseDate = new Date(today);
    }
    baseDate.setHours(0, 0, 0, 0);

    // Rentang tanggal: dari (baseDate - daysBefore) s/d (baseDate + daysAfter)
    const startDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() - daysBefore, 0, 0, 0);
    const endDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + daysAfter, 23, 59, 59, 999);

    const where: any = {
      schedule_date: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (station_id) {
      where.station_id = Number(station_id);
    }

    const schedules = await prisma.piketSchedule.findMany({
      where,
      orderBy: { schedule_date: 'asc' },
      include: {
        station: { select: { id: true, station_name: true, station_code: true } },
        pawas: {
          include: { user: { select: { full_name: true } } },
        },
        members: {
          include: {
            officer: {
              include: {
                user: { select: { full_name: true, phone_number: true } },
                unit: { select: { short_name: true, unit_name: true } },
              },
            },
          },
        },
      },
    });

    const totalDays = daysBefore + 1 + daysAfter;
    const timelineItems: any[] = [];

    // Petakan per hari mulai dari startDate s/d endDate
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i, 0, 0, 0);
      const dOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      // Perbedaan hari dengan hari ini
      const diffTime = dOnly.getTime() - today.getTime();
      const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

      let badgeLabel = '';
      if (diffDays === 0) badgeLabel = 'HARI INI';
      else if (diffDays === 1) badgeLabel = 'BESOK';
      else if (diffDays === 2) badgeLabel = 'LUSA';
      else if (diffDays === -1) badgeLabel = 'KEMARIN';
      else if (diffDays > 0) badgeLabel = `H+${diffDays}`;
      else badgeLabel = `H${diffDays}`; // H-2, H-3, dst

      // SOP POLRI: Jadwal sudah tidak bisa diubah H-1 (H-1 ke belakang dan hari-H terkunci)
      const isLocked = diffDays <= 0;

      const formattedDayName = d.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });

      // Cari schedule yang cocok pada tanggal ini
      const matched = schedules.find((s: any) => {
        const sDate = new Date(s.schedule_date);
        return (
          sDate.getFullYear() === d.getFullYear() &&
          sDate.getMonth() === d.getMonth() &&
          sDate.getDate() === d.getDate()
        );
      });

      timelineItems.push({
        dateStr,
        badgeLabel,
        isToday: diffDays === 0,
        isTomorrow: diffDays === 1,
        isPast: diffDays < 0,
        isLocked,
        diffDays,
        formattedDayName,
        dayOfWeek: d.toLocaleDateString('id-ID', { weekday: 'long' }),
        dayNumber: d.getDate(),
        monthName: d.toLocaleDateString('id-ID', { month: 'short' }),
        schedule: matched ? serializeBigInt(matched) : null,
        membersCount: matched?.members?.length || 0,
        pawasName: matched?.pawas?.user?.full_name || null,
        regu: matched?.regu || null,
      });
    }

    return {
      success: true,
      data: serializeBigInt(timelineItems),
    };
  } catch (err: any) {
    console.error('getPiketTimelineAction error:', err);
    return {
      success: false,
      error: err.message || 'Gagal memuat timeline piket',
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
}) {
  try {
    if (!station_id) throw new Error('Stasiun / Polsek wajib dipilih');
    if (!schedule_date) throw new Error('Tanggal piket wajib diisi');

    const [sy, sm, sd] = schedule_date.split('-').map(Number);
    const targetDate = new Date(sy, sm - 1, sd, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDayOnly = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const diffDays = Math.round((targetDayOnly.getTime() - today.getTime()) / (1000 * 3600 * 24));

    // SOP POLRI: Jadwal piket sudah tidak bisa diubah pada H-1 atau tanggal-tanggal sebelumnya
    if (diffDays <= 0) {
      return {
        success: false,
        error: 'Sesuai SOP POLRI, jadwal piket pada H-1 dan hari-hari sebelumnya telah terkunci dan tidak dapat diubah.',
      };
    }

    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0);
    const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59);

    const startTime = new Date(targetDate);
    startTime.setHours(8, 0, 0, 0);
    const endTime = new Date(targetDate);
    endTime.setDate(endTime.getDate() + 1);
    endTime.setHours(8, 0, 0, 0);

    // Cari apakah sudah ada jadwal di tanggal ini untuk stasiun ini
    const existing = await prisma.piketSchedule.findFirst({
      where: {
        station_id: Number(station_id),
        schedule_date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    let scheduleId: number;

    if (existing) {
      scheduleId = existing.id;
      // Update schedule utama
      await prisma.piketSchedule.update({
        where: { id: scheduleId },
        data: {
          regu: regu || existing.regu,
          pawas_id: pawas_id ? BigInt(pawas_id) : null,
          status: 'BERJALAN',
        },
      });

      // Hapus members lama dan replace dengan yang baru
      await prisma.piketScheduleMember.deleteMany({
        where: { schedule_id: scheduleId },
      });
    } else {
      const sprintNumber = `Sprin/${targetDate.getMonth() + 1}01/PIKET/${targetDate.getFullYear()}`;
      const created = await prisma.piketSchedule.create({
        data: {
          station_id: Number(station_id),
          sprint_number: sprintNumber,
          sprint_date: new Date(),
          schedule_date: targetDate,
          regu: regu || 'Regu A',
          shift_type: '1X24_JAM',
          start_time: startTime,
          end_time: endTime,
          pawas_id: pawas_id ? BigInt(pawas_id) : null,
          status: 'BERJALAN',
        },
      });
      scheduleId = created.id;
    }

    // Insert members yang dipilih
    if (members && members.length > 0) {
      await prisma.piketScheduleMember.createMany({
        data: members.map((m) => ({
          schedule_id: scheduleId,
          officer_id: BigInt(m.officer_id),
          role_piket: m.role_piket || 'PIKET_SABHARA',
          pos_penugasan: m.pos_penugasan || 'Mako Penjagaan',
          status_kehadiran: m.status_kehadiran || 'HADIR_DINAS',
          jam_masuk: startTime,
        })),
      });
    }

    revalidatePath('/console');
    return {
      success: true,
      message: `Jadwal piket tanggal ${schedule_date} berhasil disimpan dengan ${members.length} personel`,
    };
  } catch (err: any) {
    console.error('saveDailyPiketAction error:', err);
    return {
      success: false,
      error: err.message || 'Gagal menyimpan jadwal piket',
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
}) {
  try {
    const schedule = await prisma.piketSchedule.findUnique({
      where: { id: Number(schedule_id) },
    });
    if (!schedule) throw new Error('Jadwal piket tidak ditemukan');

    // SOP POLRI: Cek lock H-1 ke belakang
    const sDate = new Date(schedule.schedule_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    sDate.setHours(0, 0, 0, 0);
    if (sDate <= today) {
      return {
        success: false,
        error: 'Sesuai SOP POLRI, jadwal piket pada H-1 dan hari-hari sebelumnya telah terkunci dan tidak dapat diubah.',
      };
    }

    const existing = await prisma.piketScheduleMember.findFirst({
      where: {
        schedule_id: Number(schedule_id),
        officer_id: BigInt(officer_id),
      },
    });

    if (existing) {
      return { success: false, error: 'Personel ini sudah ada di jadwal piket tersebut' };
    }

    const created = await prisma.piketScheduleMember.create({
      data: {
        schedule_id: Number(schedule_id),
        officer_id: BigInt(officer_id),
        role_piket,
        pos_penugasan,
        status_kehadiran: 'HADIR_DINAS',
        jam_masuk: new Date(),
      },
      include: {
        officer: {
          include: { user: true },
        },
      },
    });

    revalidatePath('/console');
    return {
      success: true,
      message: `Berhasil menambahkan ${created.officer?.user?.full_name || 'personel'} ke piket`,
      data: serializeBigInt(created),
    };
  } catch (err: any) {
    console.error('addOfficerToPiketAction error:', err);
    return {
      success: false,
      error: err.message || 'Gagal menambahkan personel ke piket',
    };
  }
}

/**
 * Hapus personel dari jadwal piket tanggal tertentu
 */
export async function removeOfficerFromPiketAction(member_id: number) {
  try {
    const member = await prisma.piketScheduleMember.findUnique({
      where: { id: Number(member_id) },
      include: { schedule: true },
    });
    if (!member) throw new Error('Data anggota piket tidak ditemukan');

    // SOP POLRI: Cek lock H-1 ke belakang
    const sDate = new Date(member.schedule.schedule_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    sDate.setHours(0, 0, 0, 0);
    if (sDate <= today) {
      return {
        success: false,
        error: 'Sesuai SOP POLRI, jadwal piket pada H-1 dan hari-hari sebelumnya telah terkunci dan tidak dapat diubah.',
      };
    }

    await prisma.piketScheduleMember.delete({
      where: { id: Number(member_id) },
    });

    revalidatePath('/console');
    return {
      success: true,
      message: 'Personel berhasil dihapus dari jadwal piket',
    };
  } catch (err: any) {
    console.error('removeOfficerFromPiketAction error:', err);
    return {
      success: false,
      error: err.message || 'Gagal menghapus personel dari piket',
    };
  }
}

/**
 * Presensi Kehadiran Cepat Anggota Piket (Hadir, Izin, Sakit, Lepas Piket)
 * Hanya dapat dilakukan pada hari H dinas berjalan. Pada H-1 dan hari-hari sebelumnya terkunci permanen.
 */
export async function updateMemberAttendanceAction(memberId: number, status: string) {
  try {
    const member = await prisma.piketScheduleMember.findUnique({
      where: { id: Number(memberId) },
      include: {
        schedule: true,
        officer: { include: { user: true } },
      },
    });

    if (!member) {
      return {
        success: false,
        error: 'Data personel piket tidak ditemukan',
      };
    }

    // SOP POLRI: Presensi pada H-1 dan hari lampau telah terkunci permanen
    const sDate = new Date(member.schedule.schedule_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    sDate.setHours(0, 0, 0, 0);

    if (sDate < today) {
      return {
        success: false,
        error: 'Sesuai SOP POLRI, jadwal dan presensi kehadiran pada H-1 serta hari-hari lampau telah ditutup dan terkunci permanen (Arsip Kedinasan).',
      };
    }

    const updated = await prisma.piketScheduleMember.update({
      where: { id: Number(memberId) },
      data: { status_kehadiran: status },
      include: { officer: { include: { user: true } } },
    });

    revalidatePath('/console');
    return {
      success: true,
      message: `Status kehadiran ${updated.officer?.user?.full_name || ''} diubah menjadi ${status}`,
      data: serializeBigInt(updated),
    };
  } catch (err: any) {
    console.error('updateMemberAttendanceAction error:', err);
    return {
      success: false,
      error: err.message || 'Gagal memperbarui kehadiran',
    };
  }
}

/**
 * Hapus jadwal piket pada tanggal tertentu
 */
export async function deleteDailyPiketScheduleAction(schedule_id: number) {
  try {
    const schedule = await prisma.piketSchedule.findUnique({
      where: { id: Number(schedule_id) },
    });
    if (!schedule) throw new Error('Jadwal piket tidak ditemukan');

    // SOP POLRI: Cek lock H-1 ke belakang
    const sDate = new Date(schedule.schedule_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    sDate.setHours(0, 0, 0, 0);
    if (sDate <= today) {
      return {
        success: false,
        error: 'Sesuai SOP POLRI, jadwal piket pada H-1 dan hari-hari sebelumnya telah terkunci dan tidak dapat dihapus.',
      };
    }

    await prisma.piketSchedule.delete({
      where: { id: Number(schedule_id) },
    });

    revalidatePath('/console');
    return {
      success: true,
      message: 'Jadwal piket tanggal tersebut berhasil dihapus',
    };
  } catch (err: any) {
    console.error('deleteDailyPiketScheduleAction error:', err);
    return {
      success: false,
      error: err.message || 'Gagal menghapus jadwal piket',
    };
  }
}

/**
 * Dropdown lookup stations dan officers untuk pemilihan piket
 */
export async function getPiketLookupsAction(_station_id?: number) {
  try {
    const [stations, officers, operationalUnits] = await Promise.all([
      prisma.policeStation.findMany({
        where: { is_active: true },
        select: {
          id: true,
          station_code: true,
          station_name: true,
          station_level: true,
        },
        orderBy: { station_name: 'asc' },
      }),
      // Mengambil seluruh personel aktif agar dropdown tidak pernah kosong
      prisma.policeOfficer.findMany({
        select: {
          id: true,
          nrp: true,
          rank_pangkat: true,
          jabatan: true,
          station_id: true,
          unit_id: true,
          station: {
            select: {
              id: true,
              station_name: true,
              station_code: true,
            },
          },
          user: {
            select: {
              full_name: true,
              phone_number: true,
              avatar_url: true,
            },
          },
          unit: {
            select: {
              id: true,
              key: true,
              unit_name: true,
              short_name: true,
            },
          },
        },
      }),
      // Mengambil Master Satuan / Unit Operasional dinamis dari database
      prisma.masterOperationalUnit.findMany({
        where: { is_active: true },
        orderBy: { display_order: 'asc' },
      }),
    ]);

    return {
      success: true,
      data: {
        stations: serializeBigInt(stations),
        officers: serializeBigInt(officers),
        operationalUnits: serializeBigInt(operationalUnits),
        roles: POLRI_PIKET_ROLES,
        statuses: POLRI_ATTENDANCE_STATUSES,
      },
    };
  } catch (err: any) {
    console.error('getPiketLookupsAction error:', err);
    return {
      success: false,
      error: err.message || 'Gagal memuat lookup piket',
    };
  }
}

/**
 * Mendapatkan jadwal piket riil hari ini untuk personil tertentu (Anti-Hardcode)
 */
export async function getOfficerTodayPiketScheduleAction(officerIdOrNrp: string | number) {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const officer = await prisma.policeOfficer.findFirst({
      where: {
        OR: [
          { id: !isNaN(Number(officerIdOrNrp)) ? BigInt(officerIdOrNrp) : undefined },
          { nrp: String(officerIdOrNrp) },
        ],
      },
      include: {
        user: true,
        station: true,
      },
    });

    if (!officer) {
      return { success: false, data: null };
    }

    const piketMember = await prisma.piketScheduleMember.findFirst({
      where: {
        officer_id: officer.id,
        schedule: {
          schedule_date: { gte: todayStart, lte: todayEnd },
          status: { not: 'DIBATALKAN' },
        },
      },
      include: {
        schedule: {
          include: {
            pawas: { include: { user: true } },
            ka_spkt: { include: { user: true } },
            station: true,
          },
        },
      },
    });

    if (piketMember && piketMember.schedule) {
      const sch = piketMember.schedule;
      return {
        success: true,
        data: serializeBigInt({
          isScheduled: true,
          reguPiket: (sch as any).regu || (sch as any).regu_name || 'Regu Piket Mako',
          shiftName: (sch as any).shift_name || '24 Jam Penuh',
          jamDinas: (sch as any).shift_name ? `${(sch as any).shift_name} (08.00 s/d 08.00 WIB)` : '08.00 s/d 08.00 WIB (+1)',
          peranPenugasan: piketMember.role_piket || piketMember.pos_penugasan || 'Piket Siaga Mako',
          statusPresensi: piketMember.status_kehadiran || 'HADIR_DINAS',
          catatan: piketMember.keterangan,
          pawasNama: sch.pawas?.user?.full_name || 'PAWAS',
          kaSpktNama: sch.ka_spkt?.user?.full_name || 'Ka SPKT',
          stationName: sch.station?.station_name || officer.station?.station_name,
        }),
      };
    }

    // Jika belum terjadwal hari ini, tampilkan data riil dari profil officer dan status dinasnya
    return {
      success: true,
      data: serializeBigInt({
        isScheduled: false,
        reguPiket: officer.station?.station_name ? `Piket ${officer.station.station_name}` : 'Regu Cadangan',
        shiftName: 'Siaga Operasional',
        jamDinas: 'Siaga 24 Jam Presisi',
        peranPenugasan: officer.jabatan || 'Personil Lapangan',
        statusPresensi: officer.duty_status || 'LEPAS_DINAS',
        catatan: null,
        stationName: officer.station?.station_name || 'Polres Pekalongan',
      }),
    };
  } catch (err: any) {
    console.error('getOfficerTodayPiketScheduleAction error:', err);
    return { success: false, error: err.message, data: null };
  }
}
