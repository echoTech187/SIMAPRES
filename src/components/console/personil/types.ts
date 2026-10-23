export type PersonilTab = 'beranda' | 'peta' | 'profil';

export interface OfficerProfile {
  id: string;
  nrp: string;
  fullName: string;
  pangkat: string;
  jabatan: string;
  satuan: string;
  unit_id?: number | null;
  unitId?: string | null;
  kendaraan: string;
  avatar: string | null;
  kpi?: number | null;
  deviceId?: string | null;
  stationId?: number | null;
  stationName?: string | null;
  stationLat?: number | null;
  stationLng?: number | null;
  stationRadius?: number;
  currentGpsLat?: number | null;
  currentGpsLng?: number | null;
  dutyStatus: string;
}

export interface ComplaintData {
  id: string | number;
  nomorTiket: string;
  jenisKejadian: string;
  kategoriKejadian?: string;
  tkpAlamatTeks: string;
  tkpLatitude?: number;
  tkpLongitude?: number;
  status: string;
  tahap?: number;
  urgensi?: string;
  arahanPawas?: string;
  pelaporNama?: string;
  pelaporTelepon?: string;
  pelaporHp?: string;
  pelapor_hp?: string;
  disposisiAt?: string;
  waktuMeluncur?: string;
  waktuTibaTkp?: string;
  catatanTindakan?: string;
  pengesahanPawas?: string;
  dispatches?: any[];
  assignedOfficer?: any;
  timelines?: any[];
  complaintLogs?: any[];
  [key: string]: any;
}

// Rumus Haversine: Menghitung jarak riil dua titik koordinat GPS dalam satuan Meter
export function getDistanceFromLatLonInMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
  const R = 6371e3; // Radius bumi dalam meter
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// Menghitung 1-2 inisial nama petugas (mengabaikan gelar kepangkatan di depan)
export function getOfficerInitials(fullName?: string): string {
  if (!fullName) return 'PO';
  const clean = fullName.trim();
  const ranks = [
    'BRIPKA',
    'BRIPDA',
    'BRIGADIR',
    'BRIPTU',
    'AIPDA',
    'AIPTU',
    'IPDA',
    'IPTU',
    'AKP',
    'KOMPOL',
    'AKBP',
    'KOMBES',
    'JENDERAL',
  ];
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length > 1 && ranks.includes(words[0].toUpperCase())) {
    words.shift();
  }
  if (words.length === 0) return 'PO';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

// Single Source of Truth: Menghitung Tahap Wizard dari Status & Tahap Pengaduan
export function computeWizardStepFromComplaint(complaint: any): number {
  if (!complaint) return 1;
  const status = String(complaint.status || '').toUpperCase();
  const tahap = Number(complaint.tahap) || 1;

  const isTindakanDone = Boolean(
    status === 'SELESAI' ||
      status === 'MENUNGGU_PENGESAHAN' ||
      Boolean(complaint.pengesahanPawas) ||
      Boolean(complaint.catatanTindakan) ||
      tahap >= 5 ||
      (complaint.timelines &&
        complaint.timelines.some(
          (t: any) =>
            t.actionKey === 'REPORT_SUBMITTED' ||
            t.tahapTitle?.includes('Tindakan') ||
            t.tahapTitle?.includes('BAP') ||
            t.tahapTitle?.includes('Selesai')
        )) ||
      (complaint.complaintLogs &&
        complaint.complaintLogs.some(
          (l: any) =>
            l.action === 'REPORT_SUBMITTED' ||
            l.action?.includes('Tindakan') ||
            l.action?.includes('BAP') ||
            l.action === 'DOKUMENTASI_TKP_FLAGGED'
        ))
  );

  if (isTindakanDone) {
    return 3;
  }

  const isTibaDone = Boolean(
    Boolean(complaint.waktuTibaTkp) ||
      tahap >= 4 ||
      (complaint.timelines &&
        complaint.timelines.some(
          (t: any) =>
            t.actionKey === 'OFFICER_ARRIVED' ||
            t.tahapTitle?.includes('Tiba') ||
            t.tahapTitle?.includes('Lokasi')
        )) ||
      (complaint.complaintLogs &&
        complaint.complaintLogs.some(
          (l: any) =>
            l.action === 'OFFICER_ARRIVED' ||
            l.action?.includes('TIBA') ||
            l.action?.includes('Tiba')
        ))
  );

  if (isTibaDone) {
    return 2;
  }

  return 1;
}

// Helper: Menghitung kuota personel yang telah menerima tugas
export function getTaskQuotaInfo(task: any, officerUnitId?: number | null) {
  if (!task) {
    return {
      quota: 0,
      acceptedCount: 0,
      slotsRemaining: 0,
      isQuotaFull: false,
      acceptedOfficers: [],
      unitName: '',
    };
  }
  const dispatches: any[] = task.dispatches || [];
  const unitDisp =
    (officerUnitId ? dispatches.find((d: any) => d.unit_id === officerUnitId) : null) ||
    dispatches[0];
  const quota = unitDisp?.personnel_quota || 4;
  const targetUnitId = unitDisp?.unit_id;

  const acceptedDisps = dispatches.filter(
    (d: any) =>
      (targetUnitId ? d.unit_id === targetUnitId : true) &&
      d.accepted_at &&
      (d.officer_id || d.officer)
  );

  const acceptedCount = acceptedDisps.length;
  const slotsRemaining = Math.max(0, quota - acceptedCount);
  const isQuotaFull = acceptedCount >= quota;

  const acceptedOfficers = acceptedDisps.map((d: any) => ({
    name:
      d.officer?.user?.full_name ||
      d.officer?.user?.nama_lengkap ||
      d.officer?.rank_pangkat,
    nrp: d.officer?.nrp || d.officer?.user?.identifier ,
    rank: d.officer?.rank_pangkat,
  }));

  return {
    quota,
    acceptedCount,
    slotsRemaining,
    isQuotaFull,
    acceptedOfficers,
    unitName: unitDisp?.unit?.unit_name,
  };
}

// Helper: Mengecek apakah personel telah menerima penugasan
export function hasOfficerAcceptedTask(task: any, activeNrp: string, activeId: string) {
  if (!task) return false;
  const dispatches: any[] = task.dispatches || [];

  const acceptedInDispatches = dispatches.some(
    (d: any) =>
      d.accepted_at &&
      ((activeId && String(d.officer_id) === String(activeId)) ||
        d.officer?.nrp === activeNrp ||
        d.officer?.user?.identifier === activeNrp)
  );
  if (acceptedInDispatches) return true;

  if (
    task.assignedOfficer?.nrp === activeNrp && task.status === 'DIPROSES'
  ) {
    return true;
  }

  if (
    activeId &&
    task.assignedOfficerId &&
    String(task.assignedOfficerId) === String(activeId) &&
    task.status === 'DIPROSES'
  ) {
    return true;
  }

  return false;
}

// Helper: Deteksi apakah tugas butuh persetujuan / konfirmasi baru
export function isTaskPendingAcceptance(
  c: any,
  activeNrp: string,
  activeId: string,
  officerUnitId?: number | null
) {
  if (!c || c.status === 'SELESAI' || c.status === 'DITOLAK') return false;
  if (hasOfficerAcceptedTask(c, activeNrp, activeId)) return false;

  const { isQuotaFull, slotsRemaining } = getTaskQuotaInfo(c, officerUnitId);
  if (isQuotaFull || slotsRemaining <= 0) return false;

  const dispatches = c.dispatches || [];
  if (dispatches.length > 0 && (c.status === 'DIPROSES' || c.status === 'MENUNGGU')) {
    return true;
  }

  return false;
}
// Master Dispatch Status Keys (Presisi v3.3 - master_dispatch_statuses.key)
// Digunakan untuk keamanan koding / type checking di editor (mencegah typo)
export type DispatchStepAction =
  | 'DISPATCHED'
  | 'DEPARTED'
  | 'ARRIVED'
  | 'REPORT_SUBMITTED'
  | 'COMPLETED';

export type MasterDispatchStatusKey = DispatchStepAction;

export { formatPhoneNumber, getCleanCallNumber } from '@/lib/format-phone';
