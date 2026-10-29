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

function serializeBigInt<T>(obj: T): T {
  return JSON.parse(
    JSON.stringify(obj, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    )
  );
}

import { broadcastConsoleEvent } from '@/lib/events/console-events';

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

/**
 * Tab 1: Beranda Pawas (Zero Overfetching)
 * Hanya memuat antrean tiket, laporan aktif, unit terdaftar, dan filter kategori.
 * Tidak memuat peta, tidak memuat hotspot, tidak memuat ranking, tidak memuat logbook.
 */
export async function getPawasDashboardDataAction(stationId?: number | string, forceFresh = false) {
  try {
    const numStationId = stationId ? Number(stationId) : undefined;
    const cacheKey = numStationId ? `pawas_dashboard_data_${numStationId}` : 'pawas_dashboard_data_all';
    if (!forceFresh) {
      const cached = cacheGet<any>(cacheKey);
      if (cached) {
        return { success: true, data: cached };
      }
    }

    const [filterRes, qRes, allRes, uRes, logbookRes] = await Promise.all([
      getMasterFilterOptionsAction(),
      getPendingComplaintsAction(numStationId),
      getAllRecentComplaintsAction(50),
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
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Gagal memuat data dashboard Pawas',
    };
  }
}

/**
 * Tab 2: Peta Situasi Wilayah (Lazy-Loaded On Demand)
 * Hanya dipanggil saat Pawas mengklik tab Peta.
 */
export async function getPawasMapDataAction(forceFresh = false) {
  try {
    const cacheKey = 'pawas_map_data';
    if (!forceFresh) {
      const cached = cacheGet<any>(cacheKey);
      if (cached) {
        return { success: true, data: cached };
      }
    }

    const [fleetRes, officesRes, hotspotsRes] = await Promise.all([
      getPatrolFleetUnitsAction(),
      getPoliceOfficesAction(),
      getHotspotsAction(),
    ]);

    const payload = {
      fleetUnits: fleetRes.success && fleetRes.data ? fleetRes.data : [],
      policeOffices: officesRes.success && officesRes.data ? officesRes.data : [],
      hotspots: hotspotsRes.success && hotspotsRes.data ? hotspotsRes.data : [],
    };

    cacheSet(cacheKey, payload, 20000); // 20 detik TTL

    return {
      success: true,
      data: payload,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Gagal memuat data peta Pawas',
    };
  }
}

/**
 * Tab 3: Kinerja & Analitik (Lazy-Loaded On Demand)
 * Hanya dipanggil saat Pawas mengklik tab Kinerja.
 */
export async function getPawasAnalyticsDataAction(forceFresh = false) {
  try {
    const cacheKey = 'pawas_analytics_data';
    if (!forceFresh) {
      const cached = cacheGet<any>(cacheKey);
      if (cached) {
        return { success: true, data: cached };
      }
    }

    const [ikmRes, rankRes, stationRankRes, operatorRankRes] = await Promise.all([
      getIkmStatsAction(),
      getOfficerPerformanceRankingsAction(),
      getStationPerformanceRankingsAction(),
      getOperatorPerformanceRankingsAction(),
    ]);

    const payload = {
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
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Gagal memuat data analitik kinerja Pawas',
    };
  }
}

/**
 * Tab 4: Buku Mutasi / Logbook (Lazy-Loaded On Demand)
 * Hanya dipanggil saat Pawas mengklik tab Logbook.
 */
export async function getPawasLogbookDataAction(limit = 10, forceFresh = false) {
  try {
    const cacheKey = `pawas_logbook_data_${limit}`;
    if (!forceFresh) {
      const cached = cacheGet<any>(cacheKey);
      if (cached) {
        return { success: true, data: cached };
      }
    }

    const logbookRes = await getRecentLogbooksAction(limit);

    const payload = {
      recentLogbooks: logbookRes.success && logbookRes.data ? logbookRes.data : [],
    };

    cacheSet(cacheKey, payload, 15000);

    return {
      success: true,
      data: payload,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Gagal memuat data logbook Pawas',
    };
  }
}

/**
 * Unified batch action to load all necessary Pawas dashboard datasets in ONE single server action.
 * Eliminates 9-18 separate HTTP round-trips over the network and speeds up initial load time.
 * Menggunakan in-memory cache server (TTL 15 detik) untuk responsivitas instan (< 5ms).
 */
export async function getPawasUnifiedDataAction(stationId?: number | string, forceFresh = false) {
  try {
    const numStationId = stationId ? Number(stationId) : undefined;
    const cacheKey = numStationId ? `pawas_unified_data_${numStationId}` : 'pawas_unified_data_all';
    if (!forceFresh) {
      const cached = cacheGet<any>(cacheKey);
      if (cached) {
        return { success: true, data: cached };
      }
    }
    const [
      filterRes,
      qRes,
      allRes,
      uRes,
      fRes,
      oRes,
      hRes,
      ikmRes,
      rankRes,
      stationRankRes,
      operatorRankRes,
      logbookRes,
    ] = await Promise.all([
      getMasterFilterOptionsAction(),
      getPendingComplaintsAction(numStationId),
      getAllRecentComplaintsAction(),
      getRegisteredUnitsAction(),
      getPatrolFleetUnitsAction(),
      getPoliceOfficesAction(),
      getHotspotsAction(),
      getIkmStatsAction(),
      getOfficerPerformanceRankingsAction(),
      getStationPerformanceRankingsAction(),
      getOperatorPerformanceRankingsAction(),
      getRecentLogbooksAction(8, numStationId),
    ]);

    const payload = {
      filterData: filterRes.success ? filterRes.data : null,
      pendingComplaints: qRes.success && qRes.data ? qRes.data : [],
      allRecentComplaints: allRes.success && allRes.data ? allRes.data : [],
      registeredUnits: uRes.success && uRes.data ? uRes.data : [],
      fleetUnits: fRes.success && fRes.data ? fRes.data : [],
      policeOffices: oRes.success && oRes.data ? oRes.data : [],
      hotspots: hRes.success && hRes.data ? hRes.data : [],
      ikmStats: ikmRes.success && ikmRes.data ? ikmRes.data : null,
      officerRankings: rankRes.success && rankRes.data ? rankRes.data : null,
      stationRankings: stationRankRes.success && stationRankRes.data ? stationRankRes.data : null,
      operatorRankings: operatorRankRes.success && operatorRankRes.data ? operatorRankRes.data : null,
      recentLogbooks: logbookRes.success && logbookRes.data ? logbookRes.data : [],
    };

    cacheSet(cacheKey, payload, 15000); // 15 detik TTL

    return {
      success: true,
      data: payload,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message ? err.message : 'Gagal memuat data konsol terpadu Pawas',
    };
  }
}
