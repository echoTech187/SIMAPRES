// ============================================================
// types.ts — Shared types & default values untuk semua Master Tab
// ============================================================

export type MasterTabType =
  | 'pangkat'
  | 'satuan'
  | 'role'
  | 'station'
  | 'armada'
  | 'hotspot'
  | 'hotspot_cat'
  | 'kategori'
  | 'subkategori'
  | 'duty'
  | 'lokasi_penyelesaian'
  | 'dokumen_penyelesaian';

/** Lookup bundles yang dimuat sekali untuk semua tab */
export interface MasterLookups {
  stationLevelsList: any[];
  urgencyLevelsList: any[];
  vehicleTypesList: any[];
  vehicleStatusesList: any[];
  dangerLevelsList: any[];
  categoriesList: any[];
  unitsList: any[];
  hotspotCategoriesList: any[];
  /** Master Pangkat list (opsional) */
  ranksList?: any[];
  /** Master Role list (opsional) */
  rolesList?: any[];
}

/** Props standar yang diterima setiap komponen Tab Master */
export interface MasterTabProps {
  lookups: MasterLookups;
  showToast: (msg: string) => void;
  onRefreshDropdowns?: () => void;
}

/** Default form data kosong (tanpa fallback/hardcode dummy) */
export const DEFAULT_FORM_DATA = {
  key: '',
  label: '',
  display_order: 1,
  is_active: true,
  // Satuan
  unit_name: '',
  short_name: '',
  icon_emoji: '',
  duties: '',
  default_orders: '',
  // Role
  description: '',
  // Station
  station_code: '',
  station_name: '',
  station_level: '',
  address: '',
  office_lat: 0,
  office_lng: 0,
  geofence_radius_meters: 0,
  // Armada Operasional
  nomor_lambung: '',
  nama_armada: '',
  jenis_kendaraan: '',
  plat_nomor_polisi: '',
  status_operasional: '',
  driver_officer_nrp: '',
  current_lat: 0,
  current_lng: 0,
  // Titik Rawan GIS
  title: '',
  police_sector: '',
  category: '',
  danger_level: '',
  lat: 0,
  lng: 0,
  active_start: '',
  active_end: '',
  schedule_display: '',
  nearest_unit: '',
  // Kategori & Status
  icon: '',
  badge_bg: '',
  badge_color: '',
  badge_border: '',
  // Subkategori
  nama_kasus: '',
  category_id: 0,
  category_key: '',
  unit_id: 0,
  unit_key: '',
  default_urgensi: '',
  deskripsi_sop: '',
  // Lokasi Penyelesaian Step 3
  keterangan: '',
  requires_strict_tkp: false,
  // Dokumen Penyelesaian Step 3
  doc_type: 'DOKUMEN',
  is_mandatory: false,
  max_file_mb: 5,
  allowed_extensions: '',
};

export type FormData = typeof DEFAULT_FORM_DATA;

