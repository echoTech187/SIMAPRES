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
}
