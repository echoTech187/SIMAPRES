'use server';

import {
  getMasterFilterOptionsAction,
  getPendingComplaintsAction,
  getAllRecentComplaintsAction,
  getIkmStatsAction,
  getOfficerPerformanceRankingsAction,
  getStationPerformanceRankingsAction,
  getOperatorPerformanceRankingsAction,
} from './complaint.actions';
import { getRegisteredUnitsAction, getPoliceOfficesAction } from './auth.actions';
import { getPatrolFleetUnitsAction } from './fleet.actions';
import { getHotspotsAction } from './hotspot.actions';
import { getRecentLogbooksAction } from './logbook.actions';
import { cacheGet, cacheSet, cacheInvalidate } from '@/infrastructure/cache/app-cache';
import { getErrorMessage, type ActionResult } from '@/types/action.types';
import { broadcastConsoleEvent } from '@/lib/events/console-events';
import { requireRole } from '@/lib/session';

export async function invalidatePawasUnifiedCache(stationId?: number | string) {
  cacheInvalidate('pawas_unified_data');
  cacheInvalidate('pawas_unified_data_all');
  cacheInvalidate('pawas_dashboard_data');
  cacheInvalidate('pawas_dashboard_data_all');
  cacheInvalidate('pawas_map_data');
  cacheInvalidate('pawas_analytics_data');
  cacheInvalidate('pawas_logbook_data');
  cacheInvalidate('antrean_pawas_all');
  if (stationId) {
    cacheInvalidate(`pawas_unified_data_${stationId}`);
    cacheInvalidate(`pawas_dashboard_data_${stationId}`);
    cacheInvalidate(`antrean_pawas_${stationId}`);
  }
  // Bersihkan stasiun utama (Polres Pekalongan, Polresta Batang, Polsek Pekalongan Selatan)
  [60001, 210001, 120001].forEach((sid) => {
    cacheInvalidate(`pawas_unified_data_${sid}`);
    cacheInvalidate(`pawas_dashboard_data_${sid}`);
    cacheInvalidate(`antrean_pawas_${sid}`);
  });

  broadcastConsoleEvent({
    type: 'COMPLAINT_UPDATED',
    stationId,
  });
}

export interface PawasDashboardData {
  filterData: any;
  pendingComplaints: any[];
  allRecentComplaints: any[];
  registeredUnits: any[];
  recentLogbooks: any[];
  fleetUnits?: any[];
  policeOffices?: any[];
  hotspots?: any[];
}


export interface PawasMapData {
  fleetUnits: any[];
  policeOffices: any[];
  hotspots: any[];
}

export interface PawasAnalyticsData {
  ikmStats: any;
  officerRankings: any;
  stationRankings: any;
  operatorRankings: any;
}

export interface PawasLogbookData {
  recentLogbooks: any[];
}

export interface PawasUnifiedData {
  filterData: any;
  pendingComplaints: any[];
  allRecentComplaints: any[];
  registeredUnits: any[];
  recentLogbooks: any[];
  fleetUnits: any[];
  policeOffices: any[];
  hotspots: any[];
  ikmStats: any;
  officerRankings: any;
  stationRankings: any;
  operatorRankings: any;
}


/**
 * Tab 1: Beranda Pawas (Zero Overfetching)
 * Hanya memuat antrean tiket, laporan aktif, unit terdaftar, dan filter kategori.
 * Tidak memuat peta, tidak memuat hotspot, tidak memuat ranking, tidak memuat logbook.
 */
export async function getPawasDashboardDataAction(
  stationId?: number | string,
  forceFresh = false
): Promise<ActionResult<PawasDashboardData>> {
  try {
    const auth = await requireRole(['PAWAS', 'OPERATOR', 'SUPERADMIN']);
    if (!auth.authorized) {
      return { success: false, error: auth.error };
    }

    const numStationId = stationId ? Number(stationId) : undefined;
    const cacheKey = numStationId ? `pawas_dashboard_data_${numStationId}` : 'pawas_dashboard_data_all';
    if (!forceFresh) {
      const cached = cacheGet<PawasDashboardData>(cacheKey);
      if (cached) {
        return { success: true, data: cached };
      }
    }


    const [filterRes, qRes, allRes, uRes, logbookRes] = await Promise.all([
      getMasterFilterOptionsAction(),
      getPendingComplaintsAction(numStationId),
      getAllRecentComplaintsAction(100, numStationId),
      getRegisteredUnitsAction(),
      getRecentLogbooksAction(10, numStationId),
    ]);

    const payload = {
      filterData: filterRes.success ? filterRes.data : null,
      pendingComplaints: qRes.success && qRes.data ? qRes.data : [],
      allRecentComplaints: allRes.success && allRes.data ? allRes.data : [],
      registeredUnits: uRes.success && uRes.data ? uRes.data : [],
      recentLogbooks: logbookRes.success && logbookRes.data ? logbookRes.data : [],
    };

    cacheSet(cacheKey, payload, 15000); // 15 detik TTL

    return {
      success: true,
      data: payload,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: getErrorMessage(err),
    };
  }
}

/**
 * Tab 2: Peta Situasi Wilayah (Lazy-Loaded On Demand)
 * Hanya dipanggil saat Pawas mengklik tab Peta.
 */
export async function getPawasMapDataAction(forceFresh = false): Promise<ActionResult<PawasMapData>> {
  try {
    const auth = await requireRole(['PAWAS', 'OPERATOR', 'SUPERADMIN']);
    if (!auth.authorized) {
      return { success: false, error: auth.error };
    }

    const cacheKey = 'pawas_map_data';
    if (!forceFresh) {
      const cached = cacheGet<PawasMapData>(cacheKey);
      if (cached) {
        return { success: true, data: cached };
      }
    }

    const [fleetRes, officesRes, hotspotsRes] = await Promise.all([
      getPatrolFleetUnitsAction(),
      getPoliceOfficesAction(),
      getHotspotsAction(),
    ]);

    const payload: PawasMapData = {
      fleetUnits: fleetRes.success && fleetRes.data ? fleetRes.data : [],
      policeOffices: officesRes.success && officesRes.data ? officesRes.data : [],
      hotspots: hotspotsRes.success && hotspotsRes.data ? hotspotsRes.data : [],
    };

    cacheSet(cacheKey, payload, 20000); // 20 detik TTL

    return {
      success: true,
      data: payload,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: getErrorMessage(err),
    };
  }
}

/**
 * Tab 3: Kinerja & Analitik (Lazy-Loaded On Demand)
 * Hanya dipanggil saat Pawas mengklik tab Kinerja.
 */
export async function getPawasAnalyticsDataAction(
  stationId?: number | string,
  forceFresh = false
): Promise<ActionResult<PawasAnalyticsData>> {
  try {
    const auth = await requireRole(['PAWAS', 'OPERATOR', 'SUPERADMIN']);
    if (!auth.authorized) {
      return { success: false, error: auth.error };
    }

    const numStationId = stationId ? Number(stationId) : undefined;
    const cacheKey = numStationId ? `pawas_analytics_data_${numStationId}` : 'pawas_analytics_data';
    if (!forceFresh) {
      const cached = cacheGet<PawasAnalyticsData>(cacheKey);
      if (cached) {
        return { success: true, data: cached };
      }
    }

    const [ikmRes, rankRes, stationRankRes, operatorRankRes] = await Promise.all([
      getIkmStatsAction(numStationId),
      getOfficerPerformanceRankingsAction(numStationId),
      getStationPerformanceRankingsAction(),
      getOperatorPerformanceRankingsAction(numStationId),
    ]);

    const payload: PawasAnalyticsData = {
      ikmStats: ikmRes.success && ikmRes.data ? ikmRes.data : null,
      officerRankings: rankRes.success && rankRes.data ? rankRes.data : null,
      stationRankings: stationRankRes.success && stationRankRes.data ? stationRankRes.data : null,
      operatorRankings: operatorRankRes.success && operatorRankRes.data ? operatorRankRes.data : null,
    };

    cacheSet(cacheKey, payload, 30000); // 30 detik TTL

    return {
      success: true,
      data: payload,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: getErrorMessage(err),
    };
  }
}

/**
 * Tab 4: Buku Mutasi / Logbook (Lazy-Loaded On Demand)
 * Hanya dipanggil saat Pawas mengklik tab Logbook.
 */
export async function getPawasLogbookDataAction(
  limit = 10,
  forceFresh = false,
  stationId?: number | string
): Promise<ActionResult<PawasLogbookData>> {
  try {
    const auth = await requireRole(['PAWAS', 'OPERATOR', 'SUPERADMIN']);
    if (!auth.authorized) {
      return { success: false, error: auth.error };
    }

    const numStationId = stationId ? Number(stationId) : undefined;
    const cacheKey = numStationId ? `pawas_logbook_data_${numStationId}_${limit}` : `pawas_logbook_data_${limit}`;
    if (!forceFresh) {
      const cached = cacheGet<PawasLogbookData>(cacheKey);
      if (cached) {
        return { success: true, data: cached };
      }
    }

    const logbookRes = await getRecentLogbooksAction(limit, numStationId);

    const payload: PawasLogbookData = {
      recentLogbooks: logbookRes.success && logbookRes.data ? logbookRes.data : [],
    };

    cacheSet(cacheKey, payload, 15000);

    return {
      success: true,
      data: payload,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: getErrorMessage(err),
    };
  }
}

/**
 * Unified batch action to load all necessary Pawas dashboard datasets in ONE single server action.
 * Eliminates 9-18 separate HTTP round-trips over the network and speeds up initial load time.
 * Menggunakan in-memory cache server (TTL 15 detik) untuk responsivitas instan (< 5ms).
 */
export async function getPawasUnifiedDataAction(
  stationId?: number | string,
  forceFresh = false
): Promise<ActionResult<PawasUnifiedData>> {

  try {
    const auth = await requireRole(['PAWAS', 'OPERATOR', 'SUPERADMIN']);
    if (!auth.authorized) {
      return { success: false, error: auth.error };
    }

    const numStationId = stationId ? Number(stationId) : undefined;
    const cacheKey = numStationId ? `pawas_unified_data_${numStationId}` : 'pawas_unified_data_all';
    if (!forceFresh) {
      const cached = cacheGet<any>(cacheKey);
      if (cached) {
        return { success: true, data: cached };
      }
    }

    const [dashRes, mapRes, analyticsRes] = await Promise.all([
      getPawasDashboardDataAction(numStationId, forceFresh),
      getPawasMapDataAction(forceFresh),
      getPawasAnalyticsDataAction(numStationId, forceFresh),
    ]);

    const dash = dashRes.success ? dashRes.data : null;
    const map = mapRes.success ? mapRes.data : null;
    const analytics = analyticsRes.success ? analyticsRes.data : null;

    const payload: PawasUnifiedData = {
      filterData: dash?.filterData || null,
      pendingComplaints: dash?.pendingComplaints || [],
      allRecentComplaints: dash?.allRecentComplaints || [],
      registeredUnits: dash?.registeredUnits || [],
      fleetUnits: map?.fleetUnits || [],
      policeOffices: map?.policeOffices || [],
      hotspots: map?.hotspots || [],
      ikmStats: analytics?.ikmStats || null,
      officerRankings: analytics?.officerRankings || null,
      stationRankings: analytics?.stationRankings || null,
      operatorRankings: analytics?.operatorRankings || null,
      recentLogbooks: dash?.recentLogbooks || [],
    };


    cacheSet(cacheKey, payload, 15000); // 15 detik TTL

    return {
      success: true,
      data: payload,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: getErrorMessage(err),
    };
  }
}
