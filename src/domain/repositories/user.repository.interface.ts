/**
 * SIMAPRES 110 - DOMAIN REPOSITORY INTERFACE: USER
 * Lapisan: Domain (Pure TypeScript, Zero Framework Dependency)
 */

import { UserEntity } from '../entities/user.entity';

export interface IUserRepository {
  findByIdentifier(identifier: string): Promise<UserEntity | null>;
  findById(id: bigint): Promise<UserEntity | null>;
  updateLastLogin(userId: bigint): Promise<void>;
  updateOfficerDutyStatus(userId: bigint, dutyStatus: string): Promise<void>;
  getRawOfficerRecord(userId: bigint): Promise<any | null>;
}
