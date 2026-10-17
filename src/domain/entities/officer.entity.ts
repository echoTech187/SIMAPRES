/**
 * SIMAPRES 110 - DOMAIN ENTITY: OFFICER
 * Lapisan: Domain (Pure TypeScript, Zero Framework Dependency)
 */

export type DutyStatus =
  | 'DINAS_PATROLI'
  | 'PIKET_SPKT'
  | 'CADANGAN'
  | 'LEPAS_DINAS'
  | 'CUTI';

export interface OfficerProps {
  id?: bigint;
  userId: bigint;
  nrp: string;
  rankPangkat: string;
  jabatan: string;
  dutyStatus: DutyStatus;
  assignedPatrolVehicle?: string | null;
  currentGpsLat?: number | null;
  currentGpsLng?: number | null;
  lastGpsHeartbeatAt?: Date | null;
  kpiScore: number;
  avatarUrl?: string | null;
  deviceId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class OfficerEntity {
  private props: OfficerProps;

  constructor(props: OfficerProps) {
    this.props = {
      ...props,
      dutyStatus: props.dutyStatus || 'LEPAS_DINAS',
      kpiScore: props.kpiScore ?? 100.0,
      createdAt: props.createdAt || new Date(),
    };
  }

  get id(): bigint | undefined {
    return this.props.id;
  }

  get nrp(): string {
    return this.props.nrp;
  }

  get rankPangkat(): string {
    return this.props.rankPangkat;
  }

  get jabatan(): string {
    return this.props.jabatan;
  }

  get dutyStatus(): DutyStatus {
    return this.props.dutyStatus;
  }

  get userId(): bigint {
    return this.props.userId;
  }

  get assignedPatrolVehicle(): string | null | undefined {
    return this.props.assignedPatrolVehicle;
  }

  get currentGpsLat(): number | null | undefined {
    return this.props.currentGpsLat;
  }

  get currentGpsLng(): number | null | undefined {
    return this.props.currentGpsLng;
  }

  get kpiScore(): number {
    return this.props.kpiScore;
  }

  get deviceId(): string | null | undefined {
    return this.props.deviceId;
  }

  public updateGpsPosition(lat: number, lng: number): void {
    this.props.currentGpsLat = lat;
    this.props.currentGpsLng = lng;
    this.props.lastGpsHeartbeatAt = new Date();
  }

  public setDutyStatus(status: DutyStatus): void {
    this.props.dutyStatus = status;
  }

  public bindDevice(deviceId: string): void {
    this.props.deviceId = deviceId;
  }

  public toJSON(): OfficerProps {
    return { ...this.props };
  }
}
