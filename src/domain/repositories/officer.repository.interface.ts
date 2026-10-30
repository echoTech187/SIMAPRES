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
  getPatrolFleet?<T = any>(): Promise<T[]>;
  getPatrolFleetRaw?<T = any>(): Promise<T[]>;
  getPatrolFleetFallback?<T = any>(): Promise<{
    officers: T[];
    vehicles: T[];
    activeDispatches: T[];
    stations: T[];
    pairingSessions: T[];
    vehicleUsageLogs: T[];
  }>;
  updatePatrolFleetTelemetry?(unitKey: string, lat: number, lng: number, status?: string): Promise<void>;
  submitPresensi?<T = any>(input: {
    nrp?: string;
    officerId?: string;
    isMasuk: boolean;
    lat?: number;
    lng?: number;
  }): Promise<{ officer: T; dutyStatus: string }>;
}

