import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPiketByDateAction } from '../piket.actions';
import { prisma } from '@/infrastructure/db/prisma.client';

describe('Server Action Integration: piket.actions (SPKT Duty Schedule & Sprint)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getPiketByDateAction: queries piket_schedules and members via Prisma and returns serialized schedule', async () => {
    const mockScheduleRow = {
      id: 10,
      station_id: 1,
      sprint_number: 'SPRINT/12/X/2026',
      sprint_date: '2026-10-30',
      schedule_date: new Date('2026-10-30'),
      regu: 'Regu A',
      shift_type: 'PAGI',
      start_time: '08:00',
      end_time: '20:00',
      pawas_id: BigInt(5),
      station_code: 'KJN',
      station_name: 'Polsek Kajen',
      pawas_nrp: '78010001',
      pawas_full_name: 'Iptu Bambang S',
    };

    const mockMembers = [
      {
        id: 1,
        schedule_id: 10,
        officer_id: BigInt(88),
        role_piket: 'ANGGOTA_PATROLI',
        nrp: '88010088',
        rank_pangkat: 'Aipda',
        full_name: 'Aipda Agus',
        status_kehadiran: 'HADIR',
      },
    ];

    vi.spyOn(prisma, '$queryRawUnsafe').mockResolvedValue([mockScheduleRow] as any);
    vi.spyOn(prisma, '$queryRaw').mockResolvedValue(mockMembers as any);

    const result = await getPiketByDateAction(1, '2026-10-30');

    expect(result.success).toBe(true);
    const data = (result as any).data;
    expect(data).toBeDefined();
    expect(data.sprint_number).toBe('SPRINT/12/X/2026');
    expect(data.regu).toBe('Regu A');
    expect(data.members.length).toBe(1);
    expect(data.members[0].status_kehadiran).toBe('HADIR');
  });

  it('getPiketByDateAction: returns null data when no schedule is registered for date', async () => {
    vi.spyOn(prisma, '$queryRawUnsafe').mockResolvedValue([] as any);

    const result = await getPiketByDateAction(1, '2026-12-31');

    expect(result.success).toBe(true);
    expect((result as any).data).toBeNull();
  });
});
