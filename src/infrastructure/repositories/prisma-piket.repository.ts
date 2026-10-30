/**
 * SIMAPRES 110 - INFRASTRUCTURE REPOSITORY: PIKET SPKT
 * Lapisan: Infrastructure (Prisma & Fast SQL Implementation)
 */

import { prisma } from '../db/prisma.client';
import { IPiketRepository } from '@/domain/repositories/piket.repository.interface';
import { POLRI_ATTENDANCE_STATUSES, POLRI_PIKET_ROLES } from '@/types/piket.types';

export class PrismaPiketRepository implements IPiketRepository {
  async getPiketByDate(station_id?: number, dateStr?: string): Promise<any> {
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
      const scheduleRows: any[] = (await prisma.$queryRawUnsafe<any[]>(`
        SELECT 
          ps.id, ps.station_id, ps.sprint_number, ps.sprint_date, ps.schedule_date, ps.regu,
          ps.shift_type, ps.start_time, ps.end_time, ps.pawas_id, ps.padal_id, ps.ka_spkt_id, ps.status,
          ps.serah_terima_at, ps.catatan_arahan_pawas, ps.kejadian_menonjol,
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
        WHERE ps.schedule_date >= '${startOfDay.toISOString().slice(0, 19).replace('T', ' ')}'
          AND ps.schedule_date <= '${endOfDay.toISOString().slice(0, 19).replace('T', ' ')}'
          ${stationFilter}
        ORDER BY ps.id DESC
        LIMIT 1;
      `).catch(() => [])) || [];

      if (scheduleRows && scheduleRows.length > 0) {
        const schRow = scheduleRows[0];
        const memberRows: any[] =
          (await prisma
            .$queryRaw<any[]>`
          SELECT 
            pm.id as member_id, pm.schedule_id, pm.officer_id, pm.role_piket, pm.pos_penugasan,
            pm.kendaraan_dinas, pm.status_kehadiran, pm.jam_masuk, pm.jam_pulang, pm.keterangan,
            po.nrp, po.rank_pangkat, po.jabatan, po.duty_status,
            u.full_name, u.phone_number, u.avatar_url,
            un.key as unit_key, un.unit_name, un.short_name as unit_short_name
          FROM piket_schedule_members pm
          JOIN police_officers po ON po.id = pm.officer_id
          JOIN users u ON u.id = po.user_id
          LEFT JOIN master_operational_units un ON un.id = po.unit_id
          WHERE pm.schedule_id = ${schRow.id}
          ORDER BY pm.role_piket ASC, pm.id ASC;
        `
            .catch(() => [])) || [];

        schedule = {
          id: schRow.id,
          station_id: schRow.station_id,
          sprint_number: schRow.sprint_number,
          sprint_date: schRow.sprint_date,
          schedule_date: schRow.schedule_date,
          regu: schRow.regu,
          shift_type: schRow.shift_type,
          start_time: schRow.start_time,
          end_time: schRow.end_time,
          pawas_id: schRow.pawas_id,
          padal_id: schRow.padal_id,
          ka_spkt_id: schRow.ka_spkt_id,
          status: schRow.status,
          serah_terima_at: schRow.serah_terima_at,
          catatan_arahan_pawas: schRow.catatan_arahan_pawas,
          kejadian_menonjol: schRow.kejadian_menonjol,
          created_at: schRow.created_at,
          updated_at: schRow.updated_at,
          station: schRow.station_name ? {
            id: schRow.station_id,
            station_code: schRow.station_code,
            station_name: schRow.station_name,
            station_level: schRow.station_level,
          } : null,
          pawas: schRow.pawas_nrp ? {
            id: schRow.pawas_id,
            nrp: schRow.pawas_nrp,
            rank_pangkat: schRow.pawas_rank_pangkat,
            jabatan: schRow.pawas_jabatan,
            user: {
              full_name: schRow.pawas_full_name,
              phone_number: schRow.pawas_phone_number,
              avatar_url: schRow.pawas_avatar_url,
            },
          } : null,
          ka_spkt: schRow.kaspkt_nrp ? {
            id: schRow.ka_spkt_id,
            nrp: schRow.kaspkt_nrp,
            rank_pangkat: schRow.kaspkt_rank_pangkat,
            jabatan: schRow.kaspkt_jabatan,
            user: {
              full_name: schRow.kaspkt_full_name,
              phone_number: schRow.kaspkt_phone_number,
              avatar_url: schRow.kaspkt_avatar_url,
            },
          } : null,
          members: (memberRows || []).map((m) => ({
            id: m.member_id,
            schedule_id: m.schedule_id,
            officer_id: m.officer_id,
            role_piket: m.role_piket,
            pos_penugasan: m.pos_penugasan,
            kendaraan_dinas: m.kendaraan_dinas,
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
    } catch (_e) {}

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

    return schedule;
  }

  async getPiketTimeline({
    station_id,
    startDateStr,
    daysBefore = 7,
    daysAfter = 14,
  }: {
    station_id?: number;
    startDateStr?: string;
    daysBefore?: number;
    daysAfter?: number;
  }): Promise<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let anchorDate: Date;
    if (startDateStr) {
      const parts = startDateStr.split('-').map(Number);
      anchorDate = new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0);
    } else {
      anchorDate = new Date(today);
    }

    const startTimeline = new Date(anchorDate);
    startTimeline.setDate(startTimeline.getDate() - daysBefore);

    const endTimeline = new Date(anchorDate);
    endTimeline.setDate(endTimeline.getDate() + daysAfter);
    endTimeline.setHours(23, 59, 59, 999);

    const stationFilter = station_id ? `AND ps.station_id = ${Number(station_id)}` : '';
    let schedules: any[] = [];
    try {
      const rows: any[] = (await prisma.$queryRawUnsafe<any[]>(`
        SELECT 
          ps.id, ps.station_id, ps.sprint_number, ps.schedule_date, ps.regu,
          ps.shift_type, ps.pawas_id, ps.status,
          st.station_name, st.station_code,
          u_pawas.full_name as pawas_name,
          COUNT(pm.id) as members_count
        FROM piket_schedules ps
        LEFT JOIN police_stations st ON st.id = ps.station_id
        LEFT JOIN police_officers po_pawas ON po_pawas.id = ps.pawas_id
        LEFT JOIN users u_pawas ON u_pawas.id = po_pawas.user_id
        LEFT JOIN piket_schedule_members pm ON pm.schedule_id = ps.id
        WHERE ps.schedule_date >= '${startTimeline.toISOString().slice(0, 19).replace('T', ' ')}'
          AND ps.schedule_date <= '${endTimeline.toISOString().slice(0, 19).replace('T', ' ')}'
          ${stationFilter}
        GROUP BY ps.id, ps.station_id, ps.sprint_number, ps.schedule_date, ps.regu,
                 ps.shift_type, ps.pawas_id, ps.status, st.station_name, st.station_code, u_pawas.full_name
        ORDER BY ps.schedule_date ASC;
      `));
      schedules = rows || [];
    } catch (_e) {
      const schList = await prisma.piketSchedule.findMany({
        where: {
          schedule_date: { gte: startTimeline, lte: endTimeline },
          ...(station_id ? { station_id: Number(station_id) } : {}),
        },
        include: {
          station: true,
          pawas: { include: { user: true } },
          members: true,
        },
        orderBy: { schedule_date: 'asc' },
      });
      schedules = schList.map((s: any) => ({
        id: s.id,
        station_id: s.station_id,
        sprint_number: s.sprint_number,
        schedule_date: s.schedule_date,
        regu: s.regu,
        shift_type: s.shift_type,
        pawas_id: s.pawas_id,
        status: s.status,
        station_name: s.station?.station_name,
        station_code: s.station?.station_code,
        pawas_name: s.pawas?.user?.full_name,
        members_count: s.members?.length || 0,
      }));
    }

    const timelineItems: any[] = [];
    const totalDays = daysBefore + daysAfter + 1;
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(startTimeline);
      d.setDate(d.getDate() + i);
      const dOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      const diffTime = dOnly.getTime() - today.getTime();
      const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

      let badgeLabel = '';
      if (diffDays === 0) badgeLabel = 'HARI INI';
      else if (diffDays === 1) badgeLabel = 'BESOK';
      else if (diffDays === 2) badgeLabel = 'LUSA';
      else if (diffDays === -1) badgeLabel = 'KEMARIN';
      else if (diffDays > 0) badgeLabel = `H+${diffDays}`;
      else badgeLabel = `H${diffDays}`;

      const isLocked = diffDays <= 0;
      const formattedDayName = d.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });

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
        schedule: matched || null,
        membersCount: Number(matched?.members_count || 0),
        pawasName: matched?.pawas_name || null,
        regu: matched?.regu || null,
      });
    }

    return timelineItems;
  }

  async saveDailyPiket({
    station_id,
    schedule_date,
    regu = 'Regu A',
    pawas_id,
    members,
  }: {
    station_id: number;
    schedule_date: string;
    regu?: string;
    pawas_id?: string | number | null;
    members: Array<{
      officer_id: string | number;
      role_piket?: string;
      pos_penugasan?: string;
      status_kehadiran?: string;
    }>;
  }): Promise<any> {
    if (!station_id) throw new Error('Stasiun / Polsek wajib dipilih');
    if (!schedule_date) throw new Error('Tanggal piket wajib diisi');

    const [sy, sm, sd] = schedule_date.split('-').map(Number);
    const targetDate = new Date(sy, sm - 1, sd, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDayOnly = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const diffDays = Math.round((targetDayOnly.getTime() - today.getTime()) / (1000 * 3600 * 24));

    if (diffDays <= 0) {
      throw new Error(
        'Sesuai SOP POLRI, jadwal piket pada H-1 dan hari-hari sebelumnya telah ditutup/terkunci permanen dan tidak dapat diubah (Status Arsip Kedinasan).'
      );
    }

    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0);
    const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);

    const existingSchedule = await prisma.piketSchedule.findFirst({
      where: {
        station_id: Number(station_id),
        schedule_date: { gte: startOfDay, lte: endOfDay },
      },
    });

    const startTime = new Date(targetDate);
    startTime.setHours(8, 0, 0, 0);
    const endTime = new Date(targetDate);
    endTime.setDate(endTime.getDate() + 1);
    endTime.setHours(8, 0, 0, 0);

    let scheduleId: number;

    if (existingSchedule) {
      await prisma.piketSchedule.update({
        where: { id: existingSchedule.id },
        data: {
          regu: regu || 'Regu A',
          pawas_id: pawas_id ? BigInt(pawas_id) : null,
          start_time: startTime,
          end_time: endTime,
          status: 'BERJALAN',
        },
      });
      scheduleId = existingSchedule.id;

      await prisma.piketScheduleMember.deleteMany({
        where: { schedule_id: scheduleId },
      });
    } else {
      const sprintNumber = `SPRINT/${Date.now().toString().slice(-4)}/PAM-110/${targetDate.getFullYear()}`;
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

    return {
      success: true,
      message: `Jadwal piket tanggal ${schedule_date} berhasil disimpan dengan ${members.length} personel`,
    };
  }

  async addOfficerToPiket({
    schedule_id,
    officer_id,
    role_piket = 'PIKET_SABHARA',
    pos_penugasan = 'Mako Penjagaan',
  }: {
    schedule_id: number;
    officer_id: string | number;
    role_piket?: string;
    pos_penugasan?: string;
  }): Promise<any> {
    const schedule = await prisma.piketSchedule.findUnique({
      where: { id: Number(schedule_id) },
    });
    if (!schedule) throw new Error('Jadwal piket tidak ditemukan');

    const sDate = new Date(schedule.schedule_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    sDate.setHours(0, 0, 0, 0);
    if (sDate <= today) {
      throw new Error(
        'Sesuai SOP POLRI, jadwal piket pada H-1 dan hari-hari sebelumnya telah terkunci dan tidak dapat diubah.'
      );
    }

    const existing = await prisma.piketScheduleMember.findFirst({
      where: {
        schedule_id: Number(schedule_id),
        officer_id: BigInt(officer_id),
      },
    });

    if (existing) {
      throw new Error('Personel ini sudah ada di jadwal piket tersebut');
    }

    return await prisma.piketScheduleMember.create({
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
  }

  async removeOfficerFromPiket(member_id: number): Promise<boolean> {
    const member = await prisma.piketScheduleMember.findUnique({
      where: { id: Number(member_id) },
      include: { schedule: true },
    });
    if (!member) throw new Error('Data anggota piket tidak ditemukan');

    const sDate = new Date(member.schedule.schedule_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    sDate.setHours(0, 0, 0, 0);
    if (sDate <= today) {
      throw new Error(
        'Sesuai SOP POLRI, jadwal piket pada H-1 dan hari-hari sebelumnya telah terkunci dan tidak dapat diubah.'
      );
    }

    await prisma.piketScheduleMember.delete({
      where: { id: Number(member_id) },
    });

    return true;
  }

  async updateMemberAttendance(memberId: number, status: string): Promise<any> {
    const member = await prisma.piketScheduleMember.findUnique({
      where: { id: Number(memberId) },
      include: {
        schedule: true,
        officer: { include: { user: true } },
      },
    });

    if (!member) {
      throw new Error('Data personel piket tidak ditemukan');
    }

    const sDate = new Date(member.schedule.schedule_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    sDate.setHours(0, 0, 0, 0);

    if (sDate < today) {
      throw new Error(
        'Sesuai SOP POLRI, jadwal dan presensi kehadiran pada H-1 serta hari-hari lampau telah ditutup dan terkunci permanen (Arsip Kedinasan).'
      );
    }

    return await prisma.piketScheduleMember.update({
      where: { id: Number(memberId) },
      data: { status_kehadiran: status },
      include: { officer: { include: { user: true } } },
    });
  }

  async deleteDailyPiketSchedule(schedule_id: number): Promise<boolean> {
    const schedule = await prisma.piketSchedule.findUnique({
      where: { id: Number(schedule_id) },
    });
    if (!schedule) throw new Error('Jadwal piket tidak ditemukan');

    const sDate = new Date(schedule.schedule_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    sDate.setHours(0, 0, 0, 0);
    if (sDate <= today) {
      throw new Error(
        'Sesuai SOP POLRI, jadwal piket pada H-1 dan hari-hari sebelumnya telah terkunci dan tidak dapat dihapus.'
      );
    }

    await prisma.piketSchedule.delete({
      where: { id: Number(schedule_id) },
    });

    return true;
  }

  async getPiketLookups(_station_id?: number): Promise<any> {
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
    } catch (_e) {}

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
      stations,
      officers,
      operationalUnits,
      roles: POLRI_PIKET_ROLES,
      statuses: POLRI_ATTENDANCE_STATUSES,
    };
  }

  async getOfficerTodayPiketSchedule(officerIdOrNrp: string | number): Promise<any> {
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

    if (!officer) return null;

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
      const shiftDisplay = sch.shift_type === '1X24_JAM' ? '24 Jam Penuh' : (sch.shift_type || '24 Jam Penuh');
      return {
        isScheduled: true,
        reguPiket: sch.regu || 'Regu Piket Mako',
        shiftName: shiftDisplay,
        jamDinas: `${shiftDisplay} (08.00 s/d 08.00 WIB)`,
        peranPenugasan: piketMember.role_piket || piketMember.pos_penugasan || 'Piket Siaga Mako',
        statusPresensi: piketMember.status_kehadiran || 'HADIR_DINAS',
        catatan: piketMember.keterangan,
        pawasNama: sch.pawas?.user?.full_name || 'PAWAS',
        kaSpktNama: sch.ka_spkt?.user?.full_name || 'Ka SPKT',
        stationName: sch.station?.station_name || officer.station?.station_name,
      };
    }

    return {
      isScheduled: false,
      reguPiket: officer.station?.station_name ? `Piket ${officer.station.station_name}` : 'Regu Cadangan',
      shiftName: 'Siaga Operasional',
      jamDinas: 'Siaga 24 Jam Presisi',
      peranPenugasan: officer.jabatan || 'Personil Lapangan',
      statusPresensi: officer.duty_status || 'LEPAS_DINAS',
      catatan: null,
      stationName: officer.station?.station_name || 'Polres Pekalongan',
    };
  }
}
