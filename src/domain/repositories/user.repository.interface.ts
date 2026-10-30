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
  getRawOfficerRecord<T = any>(userId: bigint): Promise<T | null>;
  executeUserQuery?<T = any>(sqlOrStrings: TemplateStringsArray | string | unknown, ...params: unknown[]): Promise<T>;
  executeUserMutation?<T = any>(sql: string, ...params: unknown[]): Promise<T>;
  findMany?<T = any>(modelName: string, queryOptions?: unknown): Promise<T[]>;
  findUnique?<T = any>(modelName: string, queryOptions: unknown): Promise<T | null>;
  findFirst?<T = any>(modelName: string, queryOptions?: unknown): Promise<T | null>;
  create?<T = any>(modelName: string, createOptions: unknown): Promise<T>;
  update?<T = any>(modelName: string, updateOptions: unknown): Promise<T>;
  updateMany?<T = any>(modelName: string, updateOptions: unknown): Promise<T>;
  upsert?<T = any>(modelName: string, upsertOptions: unknown): Promise<T>;
  delete?<T = any>(modelName: string, deleteOptions: unknown): Promise<T>;
  count?(modelName: string, countOptions?: unknown): Promise<number>;
}
