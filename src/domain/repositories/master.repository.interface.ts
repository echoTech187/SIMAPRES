/**
 * SIMAPRES 110 - DOMAIN REPOSITORY INTERFACE: MASTER DATA & LOOKUPS
 * Lapisan: Domain (Pure TypeScript, Zero Framework Dependency, Zero Any)
 */

export interface MasterBaseLookupItem {
  id: number;
  key: string;
  label: string;
  display_order?: number;
  is_active?: boolean;
}

export interface MasterStationLevelItem {
  id: number;
  key: string;
  label: string;
  level_order: number;
  is_active: boolean;
  created_at?: Date | string;
}

export interface MasterUrgencyLevelItem extends MasterBaseLookupItem {}

export interface MasterHotspotDangerLevelItem extends MasterBaseLookupItem {}

export interface MasterHotspotCategoryItem extends MasterBaseLookupItem {}

export interface MasterVehicleTypeItem extends MasterBaseLookupItem {}

export interface MasterVehicleStatusItem extends MasterBaseLookupItem {
  badge_color?: string | null;
}

export interface MasterFuelTypeItem extends MasterBaseLookupItem {
  default_price_per_liter: number | string;
}

export interface MasterFuelClaimStatusItem extends MasterBaseLookupItem {
  keterangan?: string | null;
}

export interface MasterPatrolCrewRoleItem extends MasterBaseLookupItem {
  description?: string | null;
}

export type MasterRankItem = MasterBaseLookupItem;

export interface MasterRoleItem extends MasterBaseLookupItem {
  description?: string | null;
}


export interface MasterDispatchModeItem extends MasterBaseLookupItem {
  description?: string | null;
}

export interface MasterIncidentSubcategoryItem {
  id: number;
  category_id: number;
  category_key: string;
  unit_id: number;
  unit_key: string;
  nama_kasus: string;
  default_urgensi: string;
  deskripsi_sop?: string | null;
  is_active: boolean;
  display_order: number;
}

export interface MasterIncidentCategoryItem extends MasterBaseLookupItem {
  subcategories?: MasterIncidentSubcategoryItem[];
}

export interface MasterOperationalUnitItem {
  id: number;
  key: string;
  unit_name: string;
  short_name: string;
  duties: string;
  default_orders: string;
  is_active: boolean;
  display_order: number;
}

export interface MasterPoliceStationItem {
  id: number;
  station_code: string;
  station_name: string;
  station_level: string;
  address?: string;
  office_lat?: number | string;
  office_lng?: number | string;
  phone_piket?: string | null;
  phone_kapolsek?: string | null;
  is_active?: boolean;
}

export interface MasterLookupsBundle {
  stationLevels: MasterStationLevelItem[];
  urgencyLevels: MasterUrgencyLevelItem[];
  dangerLevels: MasterHotspotDangerLevelItem[];
  categories: MasterIncidentCategoryItem[];
  units: MasterOperationalUnitItem[];
  hotspotCategories: MasterHotspotCategoryItem[];
  vehicleTypes: MasterVehicleTypeItem[];
  vehicleStatuses: MasterVehicleStatusItem[];
  fuelTypes: MasterFuelTypeItem[];
  fuelClaimStatuses: MasterFuelClaimStatusItem[];
  crewRoles: MasterPatrolCrewRoleItem[];
  dispatchModes: MasterDispatchModeItem[];
}

export interface IMasterRepository {
  getMasterLookupsBundle(): Promise<MasterLookupsBundle>;
  getMasterCounters(): Promise<Record<string, number>>;
  getAllStations(): Promise<MasterPoliceStationItem[]>;
  getAllCategories(): Promise<MasterIncidentCategoryItem[]>;
  getAllUnits(): Promise<MasterOperationalUnitItem[]>;
  executeMasterQuery<T = unknown>(sql: string | TemplateStringsArray, ...params: unknown[]): Promise<T>;
  
  findMany<T = unknown>(modelName: string, queryOptions?: unknown): Promise<T[]>;
  findUnique<T = unknown>(modelName: string, queryOptions: unknown): Promise<T | null>;
  findFirst<T = unknown>(modelName: string, queryOptions?: unknown): Promise<T | null>;
  create<T = unknown>(modelName: string, createOptions: unknown): Promise<T>;
  update<T = unknown>(modelName: string, updateOptions: unknown): Promise<T>;
  delete<T = unknown>(modelName: string, deleteOptions: unknown): Promise<T>;
  count(modelName: string, countOptions?: unknown): Promise<number>;
}
