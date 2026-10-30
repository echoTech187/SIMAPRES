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
  executeComplaintQuery?(sqlOrStrings: any, ...params: any[]): Promise<any>;
  executeComplaintMutation?(sql: string, ...params: any[]): Promise<any>;
  executeTransaction?<T>(fn: (tx: any) => Promise<T>): Promise<T>;
  findMany?(modelName: string, queryOptions?: any): Promise<any[]>;
  findUnique?(modelName: string, queryOptions: any): Promise<any | null>;
  findFirst?(modelName: string, queryOptions?: any): Promise<any | null>;
  createRecord?(modelName: string, createOptions: any): Promise<any>;
  updateRecord?(modelName: string, updateOptions: any): Promise<any>;
  deleteRecord?(modelName: string, deleteOptions: any): Promise<any>;
  countRecord?(modelName: string, countOptions?: any): Promise<number>;
}

