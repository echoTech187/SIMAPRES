import { ComplaintEntity } from '../entities/complaint.entity';

export interface IkmStats {
  totalVoting: number;
  averageRating: number;
  percentageSatisfaction: number;
  ratingBreakdown: { [stars: number]: number };
}

export interface IComplaintRepository {
  findById(id: bigint): Promise<ComplaintEntity | null>;
  findByNomorTiket(nomorTiket: string): Promise<ComplaintEntity | null>;
  findByPelaporHp(hp: string): Promise<ComplaintEntity[]>;
  findAssignedToOfficer(officerId: bigint, activeOnly?: boolean): Promise<ComplaintEntity[]>;
  findAntreanPawas(stationId?: number): Promise<ComplaintEntity[]>;
  findAllRecent(limit?: number, stationId?: number): Promise<ComplaintEntity[]>;
  create(complaint: ComplaintEntity): Promise<ComplaintEntity>;
  update(complaint: ComplaintEntity): Promise<ComplaintEntity>;
  getIkmStats(stationId?: number): Promise<IkmStats>;
  executeComplaintQuery?<T = any>(sqlOrStrings: TemplateStringsArray | string | unknown, ...params: unknown[]): Promise<T>;
  executeComplaintMutation?<T = any>(sql: string, ...params: unknown[]): Promise<T>;
  executeTransaction?<T = any>(fn: (tx: any) => Promise<T>): Promise<T>;
  findMany?<T = any>(modelName: string, queryOptions?: unknown): Promise<T[]>;
  findUnique?<T = any>(modelName: string, queryOptions: unknown): Promise<T | null>;
  findFirst?<T = any>(modelName: string, queryOptions?: unknown): Promise<T | null>;
  createRecord?<T = any>(modelName: string, createOptions: unknown): Promise<T>;
  updateRecord?<T = any>(modelName: string, updateOptions: unknown): Promise<T>;
  deleteRecord?<T = any>(modelName: string, deleteOptions: unknown): Promise<T>;
  countRecord?(modelName: string, countOptions?: unknown): Promise<number>;
}

