'use server';

import { prisma } from '@/infrastructure/db/prisma.client';
import { revalidatePath } from 'next/cache';
import { cacheGetOrLoad, cacheInvalidate } from '@/infrastructure/cache/app-cache';

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
    const cacheKey = `piket_by_date_${station_id || 'all'}_${dateStr || 'today'}`;
    return await cacheGetOrLoad(cacheKey, 20000, async () => {
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

      let schedule: any = null;
      try {
        const stationFilter = station_id ? `AND ps.station_id = ${Number(station_id)}` : '';
        const scheduleRows: any[] = await prisma.$queryRawUnsafe(`
          SELECT 
            ps.id, ps.station_id, ps.sprint_number, ps.sprint_date, ps.schedule_date, ps.regu,
            ps.shift_type, ps.start_time, ps.end_time, ps.pawas_id, ps.padal_id, ps.ka_spkt_id, ps.status,
            ps.serah_terima_at, ps.catatan_arahan_pawas, ps.kejadian_menonjol,
            ps.tahanan_laki, ps.tahanan_wanita, ps.tahanan_anak, ps.tahanan_titipan, ps.kondisi_tahanan,
            ps.senpi_inventaris, ps.amunisi_inventaris, ps.ranmor_inventaris, ps.rompi_borgol_ht,
            ps.created_at, ps.updated_at,
            
            st.station_code, st.station_name, st.station_level,
            
            po_pawas.nrp as pawas_nrp, po_pawas.rank_pangkat as pawas_rank_pangkat, po_pawas.jabatan as pawas_jabatan,
            u_pawas.full_name as pawas_full_name, u_pawas.phone_number as pawas_phone_number, u_pawas.avatar_url as pawas_avatar_url,
            
            po_kaspkt.nrp as kaspkt_nrp, po_kaspkt.rank_pangkat as kaspkt_rank_pangkat, po_kaspkt.jabatan as kaspkt_jabatan,
            u_kaspkt.full_name as kaspkt_full_name, u_kaspkt.phone_number as kaspkt_phone_number, u_kaspkt.avatar_url as kaspkt_avatar_url
          FROM piket_schedules ps
          LEFT JOIN police_stations st ON st.id = ps.station_id
          LEFT JOIN police_officers po_pawas ON po_pawas.id = ps.pawas_id
          LEFT JOIN users u_pawas ON u_pawas.id = po_pawas.user_id
          LEFT JOIN police_officers po_kaspkt ON po_kaspkt.id = ps.ka_spkt_id
          LEFT JOIN users u_kaspkt ON u_kaspkt.id = po_kaspkt.user_id
          WHERE ps.schedule_date >= ? AND ps.schedule_date <= ? ${stationFilter}
          ORDER BY ps.created_at DESC
          LIMIT 1
        `, startOfDay, endOfDay);

        if (Array.isArray(scheduleRows) && scheduleRows.length > 0) {
          const s = scheduleRows[0];
          const membersRows: any[] = await prisma.$queryRaw`
            SELECT 
              pm.id, pm.schedule_id, pm.officer_id, pm.role_piket, pm.pos_penugasan,
              pm.kendaraan_dinas, pm.senpi_dinas, pm.status_kehadiran, pm.jam_masuk, pm.jam_pulang, pm.keterangan,
              
              po.nrp, po.rank_pangkat, po.jabatan, po.duty_status,
              u.full_name, u.phone_number, u.avatar_url,
              un.key as unit_key, un.unit_name, un.short_name as unit_short_name
            FROM piket_schedule_members pm
            LEFT JOIN police_officers po ON po.id = pm.officer_id
            LEFT JOIN users u ON u.id = po.user_id
            LEFT JOIN master_operational_units un ON un.id = po.unit_id
            WHERE pm.schedule_id = ${s.id}
            ORDER BY pm.role_piket ASC;
          `;

          schedule = {
            id: s.id,
            station_id: s.station_id,
            sprint_number: s.sprint_number,
            sprint_date: s.sprint_date,
            schedule_date: s.schedule_date,
            regu: s.regu,
            shift_type: s.shift_type,
            start_time: s.start_time,
            end_time: s.end_time,
            pawas_id: s.pawas_id,
            padal_id: s.padal_id,
            ka_spkt_id: s.ka_spkt_id,
            status: s.status,
            serah_terima_at: s.serah_terima_at,
            catatan_arahan_pawas: s.catatan_arahan_pawas,
            kejadian_menonjol: s.kejadian_menonjol,
            tahanan_laki: s.tahanan_laki,
            tahanan_wanita: s.tahanan_wanita,
            tahanan_anak: s.tahanan_anak,
            tahanan_titipan: s.tahanan_titipan,
            kondisi_tahanan: s.kondisi_tahanan,
            senpi_inventaris: s.senpi_inventaris,
            amunisi_inventaris: s.amunisi_inventaris,
            ranmor_inventaris: s.ranmor_inventaris,
            rompi_borgol_ht: s.rompi_borgol_ht,
            created_at: s.created_at,
            updated_at: s.updated_at,
            station: s.station_code ? {
              id: s.station_id,
              station_code: s.station_code,
              station_name: s.station_name,
              station_level: s.station_level,
            } : null,
            pawas: s.pawas_id ? {
              id: s.pawas_id,
              nrp: s.pawas_nrp,
              rank_pangkat: s.pawas_rank_pangkat,
              jabatan: s.pawas_jabatan,
              user: {
                full_name: s.pawas_full_name,
                phone_number: s.pawas_phone_number,
                avatar_url: s.pawas_avatar_url,
              },
            } : null,
            ka_spkt: s.ka_spkt_id ? {
              id: s.ka_spkt_id,
              nrp: s.kaspkt_nrp,
              rank_pangkat: s.kaspkt_rank_pangkat,
              jabatan: s.kaspkt_jabatan,
              user: {
                full_name: s.kaspkt_full_name,
                phone_number: s.kaspkt_phone_number,
                avatar_url: s.kaspkt_avatar_url,
              },
            } : null,
            members: (membersRows || []).map((m) => ({
              id: m.id,
              schedule_id: m.schedule_id,
              officer_id: m.officer_id,
              role_piket: m.role_piket,
              pos_penugasan: m.pos_penugasan,
              kendaraan_dinas: m.kendaraan_dinas,
              senpi_dinas: m.senpi_dinas,
              status_kehadiran: m.status_kehadiran,
              jam_masuk: m.jam_masuk,
              jam_pulang: m.jam_pulang,
              keterangan: m.keterangan,
              officer: {
                id: m.officer_id,
                nrp: m.nrp,
                rank_pangkat: m.rank_pangkat,
                jabatan: m.jabatan,
                duty_status: m.duty_status,
                user: {
                  full_name: m.full_name,
                  phone_number: m.phone_number,
                  avatar_url: m.avatar_url,
                },
                unit: m.unit_key ? {
                  key: m.unit_key,
                  unit_name: m.unit_name,
                  short_name: m.unit_short_name,
                } : null,
              },
            })),
          };
        }
      } catch (_e) {
        // Fallback to Prisma findFirst
      }

      if (!schedule) {
        schedule = await prisma.piketSchedule.findFirst({
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
      }

    return {
      success: true,
      data: serializeBigInt(schedule),
    };
    });
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
    const cacheKey = `piket_timeline_${station_id || 'all'}_${startDateStr || 'today'}_${daysBefore}_${daysAfter}`;
    return await cacheGetOrLoad(cacheKey, 20000, async () => {
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

      let schedules: any[] | null = null;
      try {
        const stationFilter = station_id ? `AND ps.station_id = ${Number(station_id)}` : '';
        const rows: any[] = await prisma.$queryRawUnsafe(`
          SELECT 
            ps.id, ps.schedule_date, ps.regu, ps.status,
            st.id as station_id, st.station_name, st.station_code,
            u_pawas.full_name as pawas_name,
            (SELECT COUNT(*) FROM piket_schedule_members psm WHERE psm.schedule_id = ps.id) as members_count
          FROM piket_schedules ps
          LEFT JOIN police_stations st ON st.id = ps.station_id
          LEFT JOIN police_officers po_pawas ON po_pawas.id = ps.pawas_id
          LEFT JOIN users u_pawas ON u_pawas.id = po_pawas.user_id
          WHERE ps.schedule_date >= ? AND ps.schedule_date <= ? ${stationFilter}
          ORDER BY ps.schedule_date ASC
        `, startDate, endDate);
        if (Array.isArray(rows)) {
          schedules = rows;
        }
      } catch (_e) {
        // Fallback to Prisma
      }

      if (!schedules) {
        const prismaSchedules = await prisma.piketSchedule.findMany({
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
        schedules = prismaSchedules.map((s: any) => ({
          ...s,
          station_id: s.station?.id,
          station_name: s.station?.station_name,
          station_code: s.station?.station_code,
          pawas_name: s.pawas?.user?.full_name,
          members_count: s.members?.length || 0,
        }));
      }

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
        membersCount: Number(matched?.members_count || 0),
        pawasName: matched?.pawas_name || null,
        regu: matched?.regu || null,
      });
    }

    return {
      success: true,
      data: serializeBigInt(timelineItems),
    };
    });
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

    cacheInvalidate('piket_');
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

    cacheInvalidate('piket_');
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

    cacheInvalidate('piket_');
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

    cacheInvalidate('piket_');
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

    cacheInvalidate('piket_');
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
    return await cacheGetOrLoad('piket_lookups', 60000, async () => {
      let rawOfficers: any[] | null = null;
      try {
        const rows: any[] = await prisma.$queryRaw`
          SELECT 
            po.id,
            po.nrp,
            po.rank_pangkat,
            po.jabatan,
            po.station_id,
            po.unit_id,
            st.station_name,
            st.station_code,
            u.full_name,
            u.phone_number,
            u.avatar_url,
            un.key as unit_key,
            un.unit_name,
            un.short_name as unit_short_name
          FROM police_officers po
          LEFT JOIN users u ON u.id = po.user_id
          LEFT JOIN police_stations st ON st.id = po.station_id
          LEFT JOIN master_operational_units un ON un.id = po.unit_id
          ORDER BY po.id ASC;
        `;
        if (Array.isArray(rows)) {
          rawOfficers = rows.map((r) => ({
            id: r.id,
            nrp: r.nrp,
            rank_pangkat: r.rank_pangkat,
            jabatan: r.jabatan,
            station_id: r.station_id,
            unit_id: r.unit_id,
            station: r.station_name ? {
              id: r.station_id,
              station_name: r.station_name,
              station_code: r.station_code,
            } : null,
            user: {
              full_name: r.full_name,
              phone_number: r.phone_number,
              avatar_url: r.avatar_url,
            },
            unit: r.unit_key ? {
              id: r.unit_id,
              key: r.unit_key,
              unit_name: r.unit_name,
              short_name: r.unit_short_name,
            } : null,
          }));
        }
      } catch (_e) {
        // Fallback to Prisma findMany
      }

      const [stations, fallbackOfficers, operationalUnits] = await Promise.all([
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
        rawOfficers ? Promise.resolve([]) : prisma.policeOfficer.findMany({
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
        prisma.masterOperationalUnit.findMany({
          where: { is_active: true },
          orderBy: { display_order: 'asc' },
        }),
      ]);

      const officers = rawOfficers || fallbackOfficers;

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
    });
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
    const cacheKey = `officer_today_piket_${officerIdOrNrp}`;
    return await cacheGetOrLoad(cacheKey, 30000, async () => {
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
    });
  } catch (err: any) {
    console.error('getOfficerTodayPiketScheduleAction error:', err);
    return { success: false, error: err.message, data: null };
  }
}
