// ============================================================
// types.ts — Shared Types & Interfaces untuk Modul Pawas SIMAPRES
// ============================================================

import type { UrgensiLevel } from '@/domain/entities/complaint.entity';

export type PawasTab =
  | 'view-beranda'
  | 'view-peta'
  | 'view-log'
  | 'view-validasi'
  | 'view-laporan'
  | 'view-profil'
  | 'view-operator'
  | 'view-tolak'
  | 'view-panduan'
  | 'view-piket';

export type PresensiStatusType = 'SUDAH_MASUK' | 'BELUM_MASUK' | 'SUDAH_PULANG';

export interface PawasUserProfile {
  id?: string | number | bigint;
  nrp?: string;
  namaLengkap?: string;
  rankPangkat?: string;
  jabatan?: string;
  role?: string;
  avatarUrl?: string | null;
  policeStationId?: number | string | null;
  policeStationName?: string | null;
  station?: {
    id?: number | string;
    name?: string;
    stationName?: string;
    stationLevel?: string;
  } | null;
  assignedVehicle?: string | null;
  shift?: string | null;
  phone?: string | null;
  phoneNumber?: string | null;
  [key: string]: unknown;
}

export interface PawasLookupItem {
  id?: number | string | bigint;
  statusCode?: string;
  statusName?: string;
  statusLabel?: string;
  categoryKey?: string;
  categoryName?: string;
  platformKey?: string;
  platformName?: string;
  key?: string;
  label?: string;
  name?: string;
  color?: string;
  bg?: string;
  border?: string;
  badgeClass?: string;
  icon?: string;
  description?: string | null;
  isActive?: boolean;
  sortOrder?: number;
  [key: string]: unknown;
}

export interface PawasFleetUnit {
  id: number | string | bigint;
  callSign?: string;
  plateNumber?: string;
  vehicleName?: string;
  vehicleType?: string;
  status?: string;
  statusCode?: string;
  unitName?: string;
  currentGpsLat?: number | null;
  currentGpsLng?: number | null;
  lat?: number | null;
  lng?: number | null;
  lastUpdated?: string | Date | null;
  crew?: Array<{
    id?: number | string | bigint;
    nrp?: string;
    name?: string;
    namaLengkap?: string;
    role?: string;
    rank?: string;
  }>;
  assignedComplaintId?: string | number | null;
  activeIncidentTicket?: string | null;
  fuelLevelPercent?: number | null;
  batteryPercent?: number | null;
  speedKmh?: number | null;
  headingDegrees?: number | null;
  [key: string]: any;
}

export interface PawasEvidenceItem {
  id?: number | string | bigint;
  fileUrl?: string | null;
  url?: string | null;
  caption?: string | null;
  tahapKe?: number;
  incident_phase?: string | null;
  phase?: string | null;
  photoAddress?: string | null;
  address?: string | null;
  gpsLat?: number | null;
  gpsLng?: number | null;
  isDiscrepancy?: boolean;
  deviationMeters?: number | null;
  timestamp?: string | Date | null;
  createdAt?: string | Date | null;
  uploaderName?: string | null;
  [key: string]: any;
}

export interface PawasDispatchItem {
  id?: number | string | bigint;
  complaintId?: number | string | bigint;
  unitId?: number | string | bigint;
  unitCallSign?: string | null;
  unitName?: string | null;
  officerId?: number | string | bigint | null;
  officerName?: string | null;
  officerRank?: string | null;
  is_primary_unit?: boolean;
  status?: string;
  dispatchedAt?: string | Date | null;
  arrivedAt?: string | Date | null;
  completedAt?: string | Date | null;
  notes?: string | null;
  [key: string]: any;
}

export interface PawasTimelineStep {
  id?: number | string | bigint;
  tahapKe: number;
  actionKey?: string;
  tahapTitle?: string;
  title?: string;
  catatan?: string | null;
  notes?: string | null;
  fotoBuktiUrl?: string | null;
  evidences?: PawasEvidenceItem[];
  gpsLat?: number | null;
  gpsLng?: number | null;
  isDiscrepancy?: boolean;
  deviationMeters?: number | null;
  warningMessage?: string | null;
  photoAddress?: string | null;
  createdAt: string | Date;
  updatedAt?: string | Date | null;
  [key: string]: any;
}

export interface PawasComplaintLog {
  id?: number | string | bigint;
  action?: string;
  actionKey?: string;
  notes?: string | null;
  actorId?: string | number | bigint | null;
  actorName?: string | null;
  actorRole?: string | null;
  createdAt?: string | Date;
  metadata?: Record<string, unknown> | null;
  [key: string]: any;
}

export interface PawasComplaintDossier {
  id?: number | string | bigint;
  nomorTiket: string;
  pelaporNama: string;
  pelaporHp?: string;
  namaPelapor?: string;
  noHpPelapor?: string;
  jenisKejadian: string;
  kategoriLaporan?: string;
  urgensi: string;
  urgensiLevel?: UrgensiLevel | string;
  status: string;
  tahap?: number;
  tkpAlamatTeks: string;
  tkpLat: number;
  tkpLng: number;
  ringkasanKeterangan?: string;
  deskripsiKejadian?: string;
  alasanTolak?: string | null;
  rejectionReason?: string | null;
  operatorId?: string | number | bigint | null;
  pawasValidasiId?: string | number | bigint | null;
  assignedOfficerId?: string | number | bigint | null;
  assignedOfficer?: {
    id?: bigint | number | string;
    nrp?: string;
    namaLengkap?: string;
    rankPangkat?: string;
    jabatan?: string;
    assignedPatrolVehicle?: string | null;
    phoneNumber?: string | null;
    avatarUrl?: string | null;
  } | null;
  pawas?: {
    id?: bigint | number | string;
    namaLengkap?: string;
    identifier?: string;
  } | null;
  operator?: {
    id?: bigint | number | string;
    namaLengkap?: string;
    identifier?: string;
  } | null;
  disposisiAt?: string | Date | null;
  responTibaTkpAt?: string | Date | null;
  selesaiAt?: string | Date | null;
  responseTimeMinutes?: number | null;
  citizenRating?: number | null;
  citizenReview?: string | null;
  citizenTags?: string | null;
  kategoriId?: number | null;
  kategoriKey?: string | null;
  subcategoryId?: number | null;
  platformId?: number | null;
  platformKey?: string | null;
  saluranLaporan?: string | null;
  stationId?: number | null;
  station?: {
    id?: number | string;
    name?: string;
    stationName?: string;
  } | null;
  timelines?: PawasTimelineStep[];
  dispatches?: PawasDispatchItem[];
  complaintLogs?: PawasComplaintLog[];
  evidences?: PawasEvidenceItem[];
  fotoBuktiUrl?: string | null;
  fotoPersiapan?: string | null;
  fotoTiba?: string | null;
  fotoTindakan?: string | null;
  fotoSelesai?: string | null;
  catatanTindakan?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  [key: string]: any;
}

export interface PawasLightboxData {
  url: string;
  title?: string;
  timestamp?: string | Date | null;
  address?: string | null;
  coords?: string | { lat: number; lng: number } | null;
  phase?: string | null;
  description?: string | null;
  isDiscrepancy?: boolean;
  deviationMeters?: number | null;
  [key: string]: any;
}

export interface PawasLogbookItem {
  id: number | string | bigint;
  title?: string;
  kategori?: string;
  giatType?: string;
  activityType?: string;
  lokasi?: string;
  location?: string;
  deskripsi?: string;
  notes?: string;
  officerName?: string;
  officerNrp?: string;
  officerRank?: string;
  status?: string;
  statusValidation?: string;
  lampiranFotoUrl?: string | null;
  photoUrl?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  [key: string]: any;
}

export interface PawasRecentActivity {
  id?: string | number;
  type?: string;
  title: string;
  description?: string;
  time?: string | Date;
  timestamp?: string | Date;
  user?: string;
  userName?: string;
  badgeClass?: string;
  badgeText?: string;
  icon?: string;
  status?: string;
  [key: string]: any;
}

export interface PawasHotspotItem {
  id: number | string | bigint;
  name: string;
  locationName?: string;
  lat: number;
  lng: number;
  radiusMeters?: number;
  dangerLevel?: string;
  category?: string;
  description?: string | null;
  policeStationId?: number | null;
  [key: string]: any;
}

export interface PawasPoliceOfficeItem {
  id: number | string | bigint;
  name: string;
  stationName?: string;
  stationLevel?: string;
  level?: string;
  lat: number;
  lng: number;
  address?: string;
  phoneNumber?: string | null;
  jurisdictionRadiusMeters?: number;
  [key: string]: any;
}

export interface UrgencyLevelInfo {
  level?: string;
  label: string;
  color?: string;
  bg?: string;
  border?: string;
  badgeClass?: string;
  pulse?: boolean;
  key?: string;
  [key: string]: any;
}

export interface ComplaintCategoryInfo {
  key?: string;
  kategori?: string;
  label?: string;
  name?: string;
  icon?: string;
  color?: string;
  bg?: string;
  border?: string;
  subKasus?: string;
  subUnitKey?: string;
  badgeText?: string;
  badgeStyle?: {
    background: string;
    color: string;
    border: string;
  };
  [key: string]: any;
}
