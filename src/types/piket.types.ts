export const POLRI_ATTENDANCE_STATUSES = [
  { key: 'HADIR_DINAS', label: 'Hadir Dinas', color: '#16A34A', bg: '#DCFCE7' },
  { key: 'BELUM_HADIR', label: 'Belum Hadir', color: '#CA8A04', bg: '#FEF9C3' },
  { key: 'LEPAS_PIKET', label: 'Lepas Piket', color: '#475569', bg: '#F1F5F9' },
  { key: 'IZIN', label: 'Izin', color: '#9333EA', bg: '#F3E8FF' },
  { key: 'SAKIT', label: 'Sakit', color: '#DC2626', bg: '#FEE2E2' },
] as const;

export type PolriAttendanceStatus = typeof POLRI_ATTENDANCE_STATUSES[number]['key'];

export const POLRI_PIKET_ROLES = [] ;

export type PolriPiketRole = typeof POLRI_PIKET_ROLES[number]['key'];
