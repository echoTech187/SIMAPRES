import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrismaOfficerRepository } from '../prisma-officer.repository';
import { prisma } from '../../db/prisma.client';

describe('PrismaOfficerRepository Integration Tests', () => {
  let repository: PrismaOfficerRepository;

  const mockDbOfficer = {
    id: BigInt(88),
    user_id: BigInt(101),
    nrp: '88010088',
    rank_pangkat: 'Aipda',
    jabatan: 'Unit Turjawali Sat Lantas',
    duty_status: 'DINAS_PATROLI',
    assigned_patrol_vehicle: 'Sedan Lantas 110',
    current_gps_lat: -7.0267,
    current_gps_lng: 109.593,
    last_gps_heartbeat_at: new Date('2026-10-30T01:00:00Z'),
    kpi_score: 95.5,
    avatar_url: 'https://avatar.png',
    device_id: 'DEV-POL-88',
    created_at: new Date('2026-01-01'),
    updated_at: new Date('2026-10-30'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new PrismaOfficerRepository();
  });

  it('findById: queries prisma.policeOfficer.findUnique and maps to OfficerEntity', async () => {
    vi.spyOn(prisma.policeOfficer, 'findUnique').mockResolvedValue(mockDbOfficer as any);

    const entity = await repository.findById(BigInt(88));

    expect(prisma.policeOfficer.findUnique).toHaveBeenCalledWith({ where: { id: BigInt(88) } });
    expect(entity).not.toBeNull();
    expect(entity!.id).toBe(BigInt(88));
    expect(entity!.userId).toBe(BigInt(101));
    expect(entity!.nrp).toBe('88010088');
    expect(entity!.rankPangkat).toBe('Aipda');
    expect(entity!.dutyStatus).toBe('DINAS_PATROLI');
    expect(entity!.currentGpsLat).toBe(-7.0267);
    expect(entity!.kpiScore).toBe(95.5);
  });

  it('findByNrp: queries prisma.policeOfficer.findUnique by nrp', async () => {
    vi.spyOn(prisma.policeOfficer, 'findUnique').mockResolvedValue(mockDbOfficer as any);

    const entity = await repository.findByNrp('88010088');

    expect(prisma.policeOfficer.findUnique).toHaveBeenCalledWith({ where: { nrp: '88010088' } });
    expect(entity?.nrp).toBe('88010088');
  });

  it('findActiveOnDuty: filters officers by DINAS_PATROLI and PIKET_SPKT', async () => {
    vi.spyOn(prisma.policeOfficer, 'findMany').mockResolvedValue([mockDbOfficer] as any);

    const activeList = await repository.findActiveOnDuty();

    expect(prisma.policeOfficer.findMany).toHaveBeenCalledWith({
      where: {
        duty_status: { in: ['DINAS_PATROLI', 'PIKET_SPKT'] },
      },
    });
    expect(activeList.length).toBe(1);
    expect(activeList[0].dutyStatus).toBe('DINAS_PATROLI');
  });

  it('updateLocation: executes prisma.policeOfficer.update with coordinates and heartbeat timestamp', async () => {
    vi.spyOn(prisma.policeOfficer, 'update').mockResolvedValue({} as any);

    await repository.updateLocation(BigInt(88), -7.030, 109.600);

    expect(prisma.policeOfficer.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: BigInt(88) },
        data: expect.objectContaining({
          current_gps_lat: -7.030,
          current_gps_lng: 109.600,
          last_gps_heartbeat_at: expect.any(Date),
        }),
      })
    );
  });

  it('updateDutyStatus: persists new dutyStatus to database', async () => {
    vi.spyOn(prisma.policeOfficer, 'update').mockResolvedValue({} as any);

    await repository.updateDutyStatus(BigInt(88), 'LEPAS_DINAS');

    expect(prisma.policeOfficer.update).toHaveBeenCalledWith({
      where: { id: BigInt(88) },
      data: { duty_status: 'LEPAS_DINAS' },
    });
  });

  it('updateKpiScore: persists updated KPI score to database', async () => {
    vi.spyOn(prisma.policeOfficer, 'update').mockResolvedValue({} as any);

    await repository.updateKpiScore(BigInt(88), 98.2);

    expect(prisma.policeOfficer.update).toHaveBeenCalledWith({
      where: { id: BigInt(88) },
      data: { kpi_score: 98.2 },
    });
  });
});
