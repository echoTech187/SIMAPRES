/**
 * SIMAPRES 110 - DOMAIN ENTITY: USER
 * Lapisan: Domain (Pure TypeScript, Zero Framework Dependency)
 */

export type UserRole = 'SUPERADMIN' | 'PAWAS' | 'PERSONIL' | string;

export interface OfficerProfileSummary {
  id: bigint;
  rankPangkat: string;
  jabatan: string;
  avatarUrl?: string | null;
  unitId?: number | null;
  unitName?: string | null;
  unitKey?: string | null;
  stationId?: number | null;
  stationName?: string | null;
  stationCode?: string | null;
  dutyStatus?: string | null;
}

export interface UserProps {
  id?: bigint;
  identifier: string; // NRP / ID Petugas
  fullName: string;
  passwordHash: string;
  role: UserRole;
  stationId?: number | null;
  isActive: boolean;
  lastLoginAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
  officerProfile?: OfficerProfileSummary | null;
}

export class UserEntity {
  private props: UserProps;

  constructor(props: UserProps) {
    this.props = {
      ...props,
      isActive: props.isActive !== undefined ? props.isActive : true,
      createdAt: props.createdAt || new Date(),
    };
  }

  get id(): bigint | undefined {
    return this.props.id;
  }

  get identifier(): string {
    return this.props.identifier;
  }

  get fullName(): string {
    return this.props.fullName;
  }

  get passwordHash(): string {
    return this.props.passwordHash;
  }

  get role(): UserRole {
    return this.props.role;
  }

  get stationId(): number | null | undefined {
    return this.props.stationId;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get lastLoginAt(): Date | null | undefined {
    return this.props.lastLoginAt;
  }

  get officerProfile(): OfficerProfileSummary | null | undefined {
    return this.props.officerProfile;
  }

  public canAuthenticate(): boolean {
    return this.props.isActive && !!this.props.passwordHash;
  }

  public recordLogin(): void {
    this.props.lastLoginAt = new Date();
  }

  public toJSON(): UserProps {
    return { ...this.props };
  }
}
