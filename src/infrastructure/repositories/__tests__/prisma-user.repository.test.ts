import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrismaUserRepository } from '../prisma-user.repository';
import { prisma } from '../../db/prisma.client';

describe('PrismaUserRepository Integration Tests', () => {
  let repository: PrismaUserRepository;

  const mockDbUser = {
    id: BigInt(101),
    identifier: '88010088',
    full_name: 'Bripka Agus Lantas',
    password_hash: '$2a$10$hashedpassword',
    role: 'PERSONIL',
    station_id: 1,
    is_active: true,
    last_login_at: new Date('2026-10-29T10:00:00Z'),
    created_at: new Date('2026-01-01'),
    updated_at: new Date('2026-10-30'),
    station: {
      id: 1,
      station_name: 'Polsek Kajen',
      station_code: 'KJN',
    },
    officer_profile: {
      id: BigInt(88),
      user_id: BigInt(101),
      nrp: '88010088',
      rank_pangkat: 'Bripka',
      jabatan: 'Unit Turjawali Sat Lantas',
      unit_id: 2,
      avatar_url: 'https://avatar.png',
      duty_status: 'DINAS_PATROLI',
      device_id: 'DEV-AGUS-110',
      unit: {
        id: 2,
        key: 'lantas',
        unit_name: 'Satuan Lalu Lintas',
      },
      station: {
        id: 1,
        station_name: 'Polsek Kajen',
        station_code: 'KJN',
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new PrismaUserRepository();
  });

  it('findByIdentifier: queries prisma.user.findUnique with profile and station relations', async () => {
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockDbUser as any);

    const user = await repository.findByIdentifier('88010088');

    expect(prisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { identifier: '88010088' },
        include: expect.objectContaining({
          officer_profile: expect.any(Object),
          station: true,
        }),
      })
    );
    expect(user).not.toBeNull();
    expect(user?.id).toBe(BigInt(101));
    expect(user?.identifier).toBe('88010088');
    expect(user?.fullName).toBe('Bripka Agus Lantas');
    expect(user?.role).toBe('PERSONIL');
    expect(user?.officerProfile).not.toBeNull();
    expect(user?.officerProfile?.rankPangkat).toBe('Bripka');
    expect(user?.officerProfile?.dutyStatus).toBe('DINAS_PATROLI');
    expect(user?.officerProfile?.deviceId).toBe('DEV-AGUS-110');
  });

  it('findById: queries prisma.user.findUnique by bigint ID', async () => {
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockDbUser as any);

    const user = await repository.findById(BigInt(101));

    expect(prisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: BigInt(101) },
      })
    );
    expect(user?.id).toBe(BigInt(101));
  });

  it('updateLastLogin: updates last_login_at timestamp in database', async () => {
    const updateSpy = vi.spyOn(prisma.user, 'update').mockResolvedValue({} as any);

    await repository.updateLastLogin(BigInt(101));

    expect(updateSpy).toHaveBeenCalledWith({
      where: { id: BigInt(101) },
      data: { last_login_at: expect.any(Date) },
    });
  });

  it('updateOfficerDutyStatus: updates duty_status across policeOfficer records for that user', async () => {
    const updateManySpy = vi.spyOn(prisma.policeOfficer, 'updateMany').mockResolvedValue({ count: 1 } as any);

    await repository.updateOfficerDutyStatus(BigInt(101), 'LEPAS_DINAS');

    expect(updateManySpy).toHaveBeenCalledWith({
      where: { user_id: BigInt(101) },
      data: { duty_status: 'LEPAS_DINAS' },
    });
  });

  it('getRawOfficerRecord: retrieves raw police officer record with station and unit joins', async () => {
    vi.spyOn(prisma.policeOfficer, 'findFirst').mockResolvedValue(mockDbUser.officer_profile as any);

    const officer = await repository.getRawOfficerRecord(BigInt(101));

    expect(prisma.policeOfficer.findFirst).toHaveBeenCalledWith({
      where: { user_id: BigInt(101) },
      include: {
        unit: true,
        station: true,
      },
    });
    expect(officer).not.toBeNull();
    expect(officer.nrp).toBe('88010088');
    expect(officer.unit.key).toBe('lantas');
  });
});
