import { OfficerEntity, DutyStatus } from '../entities/officer.entity';

export interface IOfficerRepository {
  findById(id: bigint): Promise<OfficerEntity | null>;
  findByNrp(nrp: string): Promise<OfficerEntity | null>;
  findByUserId(userId: bigint): Promise<OfficerEntity | null>;
  findByDeviceId(deviceId: string): Promise<OfficerEntity | null>;
  findActiveOnDuty(): Promise<OfficerEntity[]>;
  updateLocation(officerId: bigint, lat: number, lng: number): Promise<void>;
  updateDutyStatus(officerId: bigint, status: DutyStatus): Promise<void>;
  updateKpiScore(officerId: bigint, score: number): Promise<void>;
}
