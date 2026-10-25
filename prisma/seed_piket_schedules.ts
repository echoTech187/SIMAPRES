import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding multi-day Piket Schedules: Hari Ini, Besok, Lusa, dan Seterusnya...');

  const allOfficers = await prisma.policeOfficer.findMany({
    include: { user: true, unit: true },
  });

  const polres = await prisma.policeStation.findFirst({
    where: { station_level: 'POLRES' },
  });

  if (!polres || allOfficers.length === 0) {
    console.log('Stasiun atau personel tidak ditemukan');
    return;
  }

  // Bersihkan jadwal lama polres agar data rapi
  await prisma.piketSchedule.deleteMany({
    where: { station_id: polres.id },
  });

  const now = new Date();
  const regus = ['Regu A', 'Regu B', 'Regu C'];

  // Buat jadwal untuk 7 hari berturut-turut (Kemarin, Hari Ini, Besok, Lusa, H+3, H+4, H+5)
  for (let offset = -1; offset <= 5; offset++) {
    const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
    const startTime = new Date(targetDate);
    startTime.setHours(8, 0, 0, 0);
    const endTime = new Date(targetDate);
    endTime.setDate(endTime.getDate() + 1);
    endTime.setHours(8, 0, 0, 0);

    const reguIndex = (offset + 3) % 3;
    const reguName = regus[reguIndex];

    // Rotasi pawas
    const pawasOfficer = allOfficers[(reguIndex * 2) % allOfficers.length];

    // Bagi anggota piket hari tersebut (rotasi 3-4 anggota per hari)
    const dailyMembers: any[] = [];
    const roles = ['PIKET_SABHARA', 'PIKET_LANTAS', 'PIKET_RESKRIM', 'PIKET_INTELKAM', 'PIKET_BINMAS'];
    const poses = ['Sentra Penjagaan Mako', 'Pos Lantas Simpang 4', 'Patroli Perintis Presisi Unit 01', 'Ruang Yanmin SPKT'];

    allOfficers.forEach((off, idx) => {
      if (off.id !== pawasOfficer?.id && (idx + offset + 10) % 3 === 0) {
        dailyMembers.push({
          officer_id: off.id,
          role_piket: roles[dailyMembers.length % roles.length],
          pos_penugasan: poses[dailyMembers.length % poses.length],
          status_kehadiran: offset <= 0 ? 'HADIR_DINAS' : 'BELUM_HADIR',
          jam_masuk: offset <= 0 ? startTime : null,
        });
      }
    });

    const dayLabel = offset === 0 ? 'HARI INI' : offset === 1 ? 'BESOK' : offset === 2 ? 'LUSA' : `H+${offset}`;

    await prisma.piketSchedule.create({
      data: {
        station_id: polres.id,
        sprint_number: `Sprin/${targetDate.getMonth() + 1}${targetDate.getDate()}/PIKET/${polres.station_code}`,
        sprint_date: new Date(),
        schedule_date: targetDate,
        regu: reguName,
        shift_type: '1X24_JAM',
        start_time: startTime,
        end_time: endTime,
        pawas_id: pawasOfficer ? pawasOfficer.id : null,
        status: offset <= 0 ? 'BERJALAN' : 'TERJADWAL',
        members: {
          create: dailyMembers,
        },
      },
    });

    console.log(`✅ [${dayLabel}] ${targetDate.toISOString().split('T')[0]}: ${reguName} (${dailyMembers.length} Personel, Pawas: ${pawasOfficer?.user?.full_name})`);
  }

  console.log('✅ Selesai seeding jadwal piket multi-hari!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
