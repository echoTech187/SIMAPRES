/**
 * SIMAPRES 110 - DOMAIN TYPES & INTERFACES: PIKET SPKT & KESIAPSIAGAAN
 * Standar: Clean Architecture & Strict Enterprise TypeScript (Zero Any)
 */

export const POLRI_ATTENDANCE_STATUSES = [
  { key: 'HADIR_DINAS', label: 'Hadir Dinas', color: '#16A34A', bg: '#DCFCE7' },
  { key: 'BELUM_HADIR', label: 'Belum Hadir', color: '#CA8A04', bg: '#FEF9C3' },
  { key: 'LEPAS_PIKET', label: 'Lepas Piket', color: '#475569', bg: '#F1F5F9' },
  { key: 'IZIN', label: 'Izin', color: '#9333EA', bg: '#F3E8FF' },
  { key: 'SAKIT', label: 'Sakit', color: '#DC2626', bg: '#FEE2E2' },
] as const;

export type PolriAttendanceStatus = typeof POLRI_ATTENDANCE_STATUSES[number]['key'];

export const POLRI_PIKET_ROLES = [
  { key: 'PAWAS', label: 'Perwira Pengawas (Pawas)' },
  { key: 'PADAL', label: 'Perwira Pengendali (Padal)' },
  { key: 'KA_SPKT', label: 'Kepala SPKT (Ka SPKT)' },
  { key: 'PIKET_SPKT', label: 'SPKT / Pelayanan Masyarakat' },
  { key: 'PIKET_SABHARA', label: 'Sat Samapta (Patroli Presisi)' },
  { key: 'PIKET_LANTAS', label: 'Sat Lantas (Turjawali)' },
  { key: 'PIKET_RESKRIM', label: 'Sat Reskrim (Siaga Reserse)' },
  { key: 'PIKET_INTELKAM', label: 'Sat Intelkam (Siaga Intel)' },
  { key: 'PIKET_BINMAS', label: 'Sat Binmas' },
  { key: 'PIKET_PROVOS', label: 'Si Propam (Provos)' },
  { key: 'PAMAPTA', label: 'Sat Pamapta' },
  { key: 'OPERATOR_110', label: 'Operator Layanan 110 / TIK' },
] as const;

export type PolriPiketRole = typeof POLRI_PIKET_ROLES[number]['key'];

export interface StationLookupItem {
  id: number;
  station_code: string;
  station_name: string;
  station_level: string;
}

export interface OfficerUserSummary {
  full_name: string;
  phone_number?: string | null;
  avatar_url?: string | null;
}

export interface OperationalUnitSummary {
  id?: number;
  key: string;
  unit_name: string;
  short_name?: string | null;
  is_active?: boolean;
  display_order?: number;
}

export interface OfficerLookupItem {
  id: number | bigint | string;
  nrp: string;
  rank_pangkat: string;
  jabatan: string;
  station_id?: number | null;
  unit_id?: number | null;
  duty_status?: string | null;
  station?: StationLookupItem | null;
  user: OfficerUserSummary;
  unit?: OperationalUnitSummary | null;
}

export interface PiketMemberDetail {
  id: number;
  schedule_id: number;
  officer_id: number | bigint | string;
  role_piket?: string | null;

  pos_penugasan?: string | null;
  kendaraan_dinas?: string | null;
  status_kehadiran: PolriAttendanceStatus | string;
  jam_masuk?: Date | string | null;
  jam_pulang?: Date | string | null;
  keterangan?: string | null;
  officer: OfficerLookupItem;
}

export interface PiketScheduleDetail {
  id: number;
  station_id: number;
  sprint_number?: string | null;
  sprint_date?: Date | string | null;
  schedule_date: Date | string;
  regu?: string | null;
  shift_type?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  pawas_id?: number | bigint | string | null;
  padal_id?: number | bigint | string | null;
  ka_spkt_id?: number | bigint | string | null;

  status?: string | null;
  serah_terima_at?: Date | string | null;
  catatan_arahan_pawas?: string | null;
  kejadian_menonjol?: string | null;
  created_at: Date | string;
  updated_at: Date | string;
  station?: StationLookupItem | null;
  pawas?: {
    id: number | bigint | string;
    nrp: string;
    rank_pangkat: string;
    jabatan: string;
    user: OfficerUserSummary;
  } | null;
  ka_spkt?: {
    id: number | bigint | string;
    nrp: string;
    rank_pangkat: string;
    jabatan: string;
    user: OfficerUserSummary;
  } | null;
  padal?: {
    id: number | bigint | string;
    nrp: string;
    rank_pangkat: string;
    jabatan: string;
    user: OfficerUserSummary;
  } | null;

  members: PiketMemberDetail[];
}

export interface PiketTimelineItem {
  dateStr: string;
  badgeLabel: string;
  isToday: boolean;
  isTomorrow?: boolean;
  isPast: boolean;
  isLocked: boolean;
  diffDays?: number;
  formattedDayName: string;
  dayOfWeek?: string;
  dayNumber?: number;
  monthName?: string;
  schedule: PiketScheduleDetail | null;
  membersCount?: number;
  pawasName: string | null;
  regu: string | null;
  status?: string;
}

export interface PiketLookupsResponse {
  stations: StationLookupItem[];
  officers: OfficerLookupItem[];
  operationalUnits: OperationalUnitSummary[];
  roles: readonly { key: string; label: string }[];
  statuses: typeof POLRI_ATTENDANCE_STATUSES;
}

export interface SaveDailyPiketMemberInput {
  officer_id: string | number;
  role_piket?: string;
  pos_penugasan?: string;
  kendaraan_dinas?: string;
  status_kehadiran?: string;
  keterangan?: string;
}

export interface SaveDailyPiketInput {
  station_id: number;
  schedule_date: string;
  regu?: string;
  sprint_number?: string;
  pawas_id?: string | number | null;
  ka_spkt_id?: string | number | null;
  padal_id?: string | number | null;
  shift_type?: string;
  start_time?: string;
  end_time?: string;
  members: SaveDailyPiketMemberInput[];
}

export interface AddOfficerToPiketInput {
  schedule_id: number;
  officer_id: string | number;
  role_piket?: string;
  pos_penugasan?: string;
  kendaraan_dinas?: string;
  status_kehadiran?: string;
}

export interface OfficerTodayPiketSchedule {
  isScheduled: boolean;
  reguPiket: string;
  shiftName: string;
  jamDinas: string;
  peranPenugasan: string;
  statusPresensi: string;
  catatan?: string | null;
  pawasNama?: string;
  kaSpktNama?: string;
  stationName?: string;
}
