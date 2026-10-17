import { IOfficerRepository } from '@/domain/repositories/officer.repository.interface';
import { OfficerEntity, DutyStatus } from '@/domain/entities/officer.entity';
// SIMAPRES 110 - Prisma Officer Repository Implementation
import { prisma } from '../db/prisma.client';

export class PrismaOfficerRepository implements IOfficerRepository {
  private mapToEntity(record: any): OfficerEntity {
    return new OfficerEntity({
      id: record.id,
      userId: record.user_id,
      nrp: record.nrp,
      rankPangkat: record.rank_pangkat,
      jabatan: record.jabatan,
      dutyStatus: record.duty_status as DutyStatus,
      assignedPatrolVehicle: record.assigned_patrol_vehicle,
      currentGpsLat: record.current_gps_lat ? Number(record.current_gps_lat) : null,
      currentGpsLng: record.current_gps_lng ? Number(record.current_gps_lng) : null,
      lastGpsHeartbeatAt: record.last_gps_heartbeat_at,
      kpiScore: Number(record.kpi_score),
      avatarUrl: record.avatar_url,
      deviceId: record.device_id,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    });
  }

  async findById(id: bigint): Promise<OfficerEntity | null> {
    const record = await prisma.policeOfficer.findUnique({ where: { id } });
    return record ? this.mapToEntity(record) : null;
  }

  async findByNrp(nrp: string): Promise<OfficerEntity | null> {
    const record = await prisma.policeOfficer.findUnique({ where: { nrp } });
    return record ? this.mapToEntity(record) : null;
  }

  async findByUserId(userId: bigint): Promise<OfficerEntity | null> {
    const record = await prisma.policeOfficer.findUnique({ where: { user_id: userId } });
    return record ? this.mapToEntity(record) : null;
  }

  async findByDeviceId(deviceId: string): Promise<OfficerEntity | null> {
    const record = await prisma.policeOfficer.findFirst({ where: { device_id: deviceId } });
    return record ? this.mapToEntity(record) : null;
  }

  async findActiveOnDuty(): Promise<OfficerEntity[]> {
    const records = await prisma.policeOfficer.findMany({
      where: {
        duty_status: { in: ['DINAS_PATROLI', 'PIKET_SPKT'] },
      },
    });
    return records.map((r: any) => this.mapToEntity(r));
  }

  async updateLocation(officerId: bigint, lat: number, lng: number): Promise<void> {
    await prisma.policeOfficer.update({
      where: { id: officerId },
      data: {
        current_gps_lat: lat,
        current_gps_lng: lng,
        last_gps_heartbeat_at: new Date(),
      },
    });
  }

  async updateDutyStatus(officerId: bigint, status: DutyStatus): Promise<void> {
    await prisma.policeOfficer.update({
      where: { id: officerId },
      data: { duty_status: status },
    });
  }

  async updateKpiScore(officerId: bigint, score: number): Promise<void> {
    await prisma.policeOfficer.update({
      where: { id: officerId },
      data: { kpi_score: score },
    });
  }
}
