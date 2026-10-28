import { IUserRepository } from '@/domain/repositories/user.repository.interface';
import { UserEntity } from '@/domain/entities/user.entity';
import { prisma } from '../db/prisma.client';

export class PrismaUserRepository implements IUserRepository {
  private mapToEntity(record: any): UserEntity {
    const officer = record.officer_profile;
    const station = record.station || officer?.station;

    return new UserEntity({
      id: record.id,
      identifier: record.identifier,
      fullName: record.full_name,
      passwordHash: record.password_hash,
      role: record.role,
      stationId: record.station_id,
      isActive: record.is_active,
      lastLoginAt: record.last_login_at,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
      officerProfile: officer
        ? {
            id: officer.id,
            rankPangkat: officer.rank_pangkat || '',
            jabatan: officer.jabatan || '',
            avatarUrl: officer.avatar_url || null,
            unitId: officer.unit_id || null,
            unitName: officer.unit?.unit_name || null,
            unitKey: officer.unit?.key || null,
            stationId: station ? Number(station.id) : null,
            stationName: station?.station_name || null,
            stationCode: station?.station_code || null,
            dutyStatus: officer.duty_status || null,
          }
        : null,
    });
  }

  async findByIdentifier(identifier: string): Promise<UserEntity | null> {
    const record = await prisma.user.findUnique({
      where: { identifier: identifier.trim() },
      include: {
        officer_profile: {
          include: {
            unit: true,
            station: true,
          },
        },
        station: true,
      },
    });

    return record ? this.mapToEntity(record) : null;
  }

  async findById(id: bigint): Promise<UserEntity | null> {
    const record = await prisma.user.findUnique({
      where: { id },
      include: {
        officer_profile: {
          include: {
            unit: true,
            station: true,
          },
        },
        station: true,
      },
    });

    return record ? this.mapToEntity(record) : null;
  }

  async updateLastLogin(userId: bigint): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { last_login_at: new Date() },
    });
  }

  async updateOfficerDutyStatus(userId: bigint, dutyStatus: string): Promise<void> {
    await prisma.policeOfficer.updateMany({
      where: { user_id: userId },
      data: { duty_status: dutyStatus },
    });
  }

  async getRawOfficerRecord(userId: bigint): Promise<any | null> {
    const officer = await prisma.policeOfficer.findFirst({
      where: { user_id: userId },
      include: {
        unit: true,
        station: true,
      },
    });
    return officer;
  }
}
