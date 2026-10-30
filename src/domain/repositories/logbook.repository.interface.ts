import { LogbookEntity } from '../entities/logbook.entity';

export interface ILogbookRepository {
  create(logbook: LogbookEntity): Promise<LogbookEntity>;
  findById(id: bigint): Promise<LogbookEntity | null>;
  findByOfficerId(officerId: bigint, limit?: number): Promise<LogbookEntity[]>;
  findRecent(limit?: number, stationId?: number): Promise<LogbookEntity[]>;
  findFlaggedAudit(limit?: number): Promise<LogbookEntity[]>;
  countByJenisAksi(officerId: bigint): Promise<Record<string, number>>;
  updateValidationStatus(id: bigint, status: string, note?: string): Promise<LogbookEntity>;
  completePatrolGiat?(id: bigint, finalMeters: number, catatanHasil?: string): Promise<LogbookEntity>;
}
