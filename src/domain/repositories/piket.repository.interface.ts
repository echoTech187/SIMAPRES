/**
 * SIMAPRES 110 - DOMAIN REPOSITORY INTERFACE: PIKET SPKT
 * Lapisan: Domain (Pure TypeScript, Zero Framework Dependency)
 */

export interface IPiketRepository {
  getPiketByDate(station_id?: number, dateStr?: string): Promise<any>;
  getPiketTimeline(options: {
    station_id?: number;
    startDateStr?: string;
    daysBefore?: number;
    daysAfter?: number;
  }): Promise<any>;
  saveDailyPiket(input: {
    station_id: number;
    schedule_date: string;
    regu?: string;
    pawas_id?: string | number | null;
    members: Array<{
      officer_id: string | number;
      role_piket?: string;
      pos_penugasan?: string;
      status_kehadiran?: string;
    }>;
  }): Promise<any>;
  addOfficerToPiket(input: {
    schedule_id: number;
    officer_id: string | number;
    role_piket?: string;
    pos_penugasan?: string;
  }): Promise<any>;
  removeOfficerFromPiket(member_id: number): Promise<boolean>;
  updateMemberAttendance(memberId: number, status: string): Promise<any>;
  deleteDailyPiketSchedule(schedule_id: number): Promise<boolean>;
  getPiketLookups(station_id?: number): Promise<any>;
  getOfficerTodayPiketSchedule(officerIdOrNrp: string | number): Promise<any>;
}
