/**
 * SIMAPRES 110 - DOMAIN REPOSITORY INTERFACE: PIKET SPKT
 * Lapisan: Domain (Pure TypeScript, Zero Framework Dependency, Zero Any)
 */

import {
  PiketScheduleDetail,
  PiketTimelineItem,
  PiketMemberDetail,
  PiketLookupsResponse,
  OfficerTodayPiketSchedule,
  SaveDailyPiketInput,
  AddOfficerToPiketInput,
} from '@/types/piket.types';

export interface IPiketRepository {
  getPiketByDate(station_id?: number, dateStr?: string): Promise<PiketScheduleDetail | null>;
  getPiketTimeline(options: {
    station_id?: number;
    startDateStr?: string;
    daysBefore?: number;
    daysAfter?: number;
  }): Promise<PiketTimelineItem[]>;
  saveDailyPiket(input: SaveDailyPiketInput): Promise<PiketScheduleDetail>;
  addOfficerToPiket(input: AddOfficerToPiketInput): Promise<PiketMemberDetail>;
  removeOfficerFromPiket(member_id: number): Promise<boolean>;
  updateMemberAttendance(memberId: number, status: string): Promise<PiketMemberDetail>;
  deleteDailyPiketSchedule(schedule_id: number): Promise<boolean>;
  getPiketLookups(station_id?: number): Promise<PiketLookupsResponse>;
  getOfficerTodayPiketSchedule(officerIdOrNrp: string | number): Promise<OfficerTodayPiketSchedule | null>;
}
