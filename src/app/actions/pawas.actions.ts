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
import { prisma } from '@/infrastructure/db/prisma.client';
import { cacheGet, cacheSet, cacheInvalidate } from '@/lib/app-cache';

function serializeBigInt<T>(obj: T): T {
  return JSON.parse(
    JSON.stringify(obj, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    )
  );
}

export async function invalidatePawasUnifiedCache() {
  cacheInvalidate('pawas_unified_data');
}

/**
 * Unified batch action to load all necessary Pawas dashboard datasets in ONE single server action.
 * Eliminates 9-18 separate HTTP round-trips over the network and speeds up initial load time.
 * Menggunakan in-memory cache server (TTL 15 detik) untuk responsivitas instan (< 5ms).
 */
export async function getPawasUnifiedDataAction(forceFresh = false) {
  try {
    if (!forceFresh) {
      const cached = cacheGet<any>('pawas_unified_data');
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
      recentLogbooksRaw,
    ] = await Promise.all([
      getMasterFilterOptionsAction(),
      getPendingComplaintsAction(),
      getAllRecentComplaintsAction(),
      getRegisteredUnitsAction(),
      getPatrolFleetUnitsAction(),
      getPoliceOfficesAction(),
      getHotspotsAction(),
      getIkmStatsAction(),
      getOfficerPerformanceRankingsAction(),
      getStationPerformanceRankingsAction(),
      getOperatorPerformanceRankingsAction(),
      prisma.officerLogbook.findMany({
        take: 8,
        orderBy: { created_at: 'desc' },
        include: {
          officer: {
            include: {
              user: {
                select: {
                  full_name: true,
                  avatar_url: true,
                },
              },
              unit: {
                select: {
                  unit_name: true,
                  short_name: true,
                },
              },
            },
          },
        },
      }).catch(() => []),
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
      recentLogbooks: serializeBigInt(recentLogbooksRaw ? recentLogbooksRaw : []),
    };

    cacheSet('pawas_unified_data', payload, 15000); // 15 detik TTL

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
