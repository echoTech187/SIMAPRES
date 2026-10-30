'use server';

import { cacheGet, cacheSet } from '@/infrastructure/cache/app-cache';
import { prisma, serializeBigInt } from './master-common';

// ==============================================================================
// 1. RINGKASAN MASTER DATA UNTUK TAB COUNTERS
// ==============================================================================
export async function getMasterCountersAction() {
  const cached = cacheGet<any>('master_counters_summary');
  if (cached) {
    return { success: true, data: cached };
  }

  try {
    let countersData: any;
    try {
      const rows: any[] = await prisma.$queryRaw`
        SELECT 
          (SELECT COUNT(*) FROM master_ranks) as ranks,
          (SELECT COUNT(*) FROM master_operational_units) as units,
          (SELECT COUNT(*) FROM master_roles) as roles,
          (SELECT COUNT(*) FROM police_stations) as stations,
          (SELECT COUNT(*) FROM master_incident_categories) as categories,
          (SELECT COUNT(*) FROM master_incident_subcategories) as subcategories,
          (SELECT COUNT(*) FROM hotspot_locations) as hotspots,
          (SELECT COUNT(*) FROM master_hotspot_categories) as hotspotCategories,
          (SELECT COUNT(*) FROM patrol_vehicles) as vehicles,
          (SELECT COUNT(*) FROM master_duty_statuses) as dutyStatuses,
          (SELECT COUNT(*) FROM master_resolution_location_types) as resolutionLocations,
          (SELECT COUNT(*) FROM master_resolution_document_types) as resolutionDocuments,
          (SELECT COUNT(*) FROM master_knowledge_faqs) as knowledgeFaqs;
      `;
      if (rows && rows[0]) {
        const r = rows[0];
        countersData = {
          ranks: Number(r.ranks || 0),
          units: Number(r.units || 0),
          roles: Number(r.roles || 0),
          stations: Number(r.stations || 0),
          categories: Number(r.categories || 0),
          subcategories: Number(r.subcategories || 0),
          hotspots: Number(r.hotspots || 0),
          hotspotCategories: Number(r.hotspotCategories || 0),
          vehicles: Number(r.vehicles || 0),
          dutyStatuses: Number(r.dutyStatuses || 0),
          resolutionLocations: Number(r.resolutionLocations || 0),
          resolutionDocuments: Number(r.resolutionDocuments || 0),
          knowledgeFaqs: Number(r.knowledgeFaqs || 0),
        };
      }
    } catch (_rawErr) {
      // Fallback ke Prisma count
      const [ranks, units, roles, stations, categories, subcategories, hotspots, hotspotCategories, vehicles, dutyStatuses, resolutionLocations, resolutionDocuments, knowledgeFaqs] =
        await Promise.all([
          prisma.masterRank.count(),
          prisma.masterOperationalUnit.count(),
          prisma.masterRole.count(),
          prisma.policeStation.count(),
          prisma.masterIncidentCategory.count(),
          prisma.masterIncidentSubcategory.count(),
          prisma.hotspotLocation.count(),
          prisma.masterHotspotCategory.count(),
          prisma.patrolVehicle.count(),
          prisma.masterDutyStatus.count(),
          prisma.masterResolutionLocationType.count(),
          prisma.masterResolutionDocumentType.count(),
          prisma.masterKnowledgeFaq.count(),
        ]);
      countersData = {
        ranks,
        units,
        roles,
        stations,
        categories,
        subcategories,
        hotspots,
        hotspotCategories,
        vehicles,
        dutyStatuses,
        resolutionLocations,
        resolutionDocuments,
        knowledgeFaqs,
      };
    }

    cacheSet('master_counters_summary', countersData, 5 * 60 * 1000); // 5 menit TTL
    return {
      success: true,
      data: countersData,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ==============================================================================
// 1.1 BUNDLED LOOKUPS UNTUK SUPERADMIN / MASTER (SANGAT CEPAT - 1 ROUND-TRIP)
// ==============================================================================
export async function getAllMasterLookupsBundleAction() {
  try {
    const [
      stationLevels,
      urgencyLevels,
      dangerLevels,
      categories,
      units,
      hotspotCategories,
      vehicleTypes,
      vehicleStatuses,
      fuelTypes,
      fuelClaimStatuses,
      crewRoles,
      dispatchModes,
    ] = await Promise.all([
      prisma.masterStationLevel.findMany({
        where: { is_active: true },
        orderBy: { level_order: 'asc' },
      }),
      prisma.masterUrgencyLevel.findMany({
        where: { is_active: true },
        orderBy: { display_order: 'asc' },
      }),
      prisma.masterHotspotDangerLevel.findMany({
        where: { is_active: true },
        orderBy: { display_order: 'asc' },
      }),
      prisma.masterIncidentCategory.findMany({
        where: { is_active: true },
        orderBy: { display_order: 'asc' },
      }),
      prisma.masterOperationalUnit.findMany({
        where: { is_active: true },
        orderBy: { display_order: 'asc' },
      }),
      prisma.masterHotspotCategory.findMany({
        where: { is_active: true },
        orderBy: { display_order: 'asc' },
      }),
      prisma.$queryRawUnsafe(`
        SELECT id, \`key\`, label, display_order 
        FROM master_vehicle_types 
        WHERE is_active = 1 
        ORDER BY display_order ASC
      `).catch(() => []),
      prisma.$queryRawUnsafe(`
        SELECT id, \`key\`, label, display_order 
        FROM master_vehicle_statuses 
        WHERE is_active = 1 
        ORDER BY display_order ASC
      `).catch(() => []),
      prisma.masterFuelType.findMany({
        where: { is_active: true },
        orderBy: { display_order: 'asc' },
      }).catch(() => []),
      prisma.masterFuelClaimStatus.findMany({
        where: { is_active: true },
        orderBy: { display_order: 'asc' },
      }).catch(() => []),
      prisma.masterPatrolCrewRole.findMany({
        where: { is_active: true },
        orderBy: { display_order: 'asc' },
      }).catch(() => []),
      prisma.masterDispatchMode.findMany({
        where: { is_active: true },
        orderBy: { display_order: 'asc' },
      }).catch(() => []),
    ]);

    return {
      success: true,
      data: serializeBigInt({
        stationLevels,
        urgencyLevels,
        dangerLevels,
        categories,
        units,
        hotspotCategories,
        vehicleTypes: Array.isArray(vehicleTypes) ? vehicleTypes : [],
        vehicleStatuses: Array.isArray(vehicleStatuses) ? vehicleStatuses : [],
        fuelTypes: Array.isArray(fuelTypes) ? fuelTypes : [],
        fuelClaimStatuses: Array.isArray(fuelClaimStatuses) ? fuelClaimStatuses : [],
        crewRoles: Array.isArray(crewRoles) ? crewRoles : [],
        dispatchModes: Array.isArray(dispatchModes) ? dispatchModes : [],
      }),
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
