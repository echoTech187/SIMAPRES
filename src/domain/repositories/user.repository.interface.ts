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
  executeUserQuery?(sqlOrStrings: any, ...params: any[]): Promise<any>;
  executeUserMutation?(sql: string, ...params: any[]): Promise<any>;
  findMany?(modelName: string, queryOptions?: any): Promise<any[]>;
  findUnique?(modelName: string, queryOptions: any): Promise<any | null>;
  findFirst?(modelName: string, queryOptions?: any): Promise<any | null>;
  create?(modelName: string, createOptions: any): Promise<any>;
  update?(modelName: string, updateOptions: any): Promise<any>;
  updateMany?(modelName: string, updateOptions: any): Promise<any>;
  upsert?(modelName: string, upsertOptions: any): Promise<any>;
  delete?(modelName: string, deleteOptions: any): Promise<any>;
  count?(modelName: string, countOptions?: any): Promise<number>;
}
