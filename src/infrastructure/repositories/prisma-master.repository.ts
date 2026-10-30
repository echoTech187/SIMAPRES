/**
 * SIMAPRES 110 - INFRASTRUCTURE REPOSITORY: MASTER DATA
 * Lapisan: Infrastructure (Prisma Implementation)
 */

import { prisma } from '../db/prisma.client';
import { IMasterRepository } from '@/domain/repositories/master.repository.interface';

export class PrismaMasterRepository implements IMasterRepository {
  async getMasterCounters(): Promise<any> {
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
        return {
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
    }

    const [
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
    ] = await Promise.all([
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

    return {
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

  async getMasterLookupsBundle(): Promise<any> {
    const dangerRepo = (prisma as any).masterHotspotDangerLevel || (prisma as any).masterDangerLevel;

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
      dangerRepo.findMany({
        where: { is_active: true },
        orderBy: { display_order: 'asc' },
      }),
      prisma.masterIncidentCategory.findMany({
        where: { is_active: true },
        orderBy: { display_order: 'asc' },
        include: {
          subcategories: {
            where: { is_active: true },
            orderBy: { display_order: 'asc' },
          },
        },
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
      (prisma as any).masterFuelType?.findMany({
        where: { is_active: true },
        orderBy: { display_order: 'asc' },
      }).catch(() => []),
      (prisma as any).masterFuelClaimStatus?.findMany({
        where: { is_active: true },
        orderBy: { display_order: 'asc' },
      }).catch(() => []),
      (prisma as any).masterPatrolCrewRole?.findMany({
        where: { is_active: true },
        orderBy: { display_order: 'asc' },
      }).catch(() => []),
      (prisma as any).masterDispatchMode?.findMany({
        where: { is_active: true },
        orderBy: { display_order: 'asc' },
      }).catch(() => []),
    ]);

    return {
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
    };
  }

  async getAllStations(): Promise<any[]> {
    return await prisma.policeStation.findMany({
      where: { is_active: true },
      orderBy: { station_level: 'asc' },
    });
  }

  async getAllCategories(): Promise<any[]> {
    return await prisma.masterIncidentCategory.findMany({
      where: { is_active: true },
      include: {
        subcategories: {
          where: { is_active: true },
          orderBy: { display_order: 'asc' },
        },
      },
      orderBy: { display_order: 'asc' },
    });
  }

  async getAllUnits(): Promise<any[]> {
    return await prisma.masterOperationalUnit.findMany({
      where: { is_active: true },
      orderBy: { display_order: 'asc' },
    });
  }

  async executeMasterQuery(sqlOrStrings: any, ...params: any[]): Promise<any> {
    if (typeof sqlOrStrings === 'string') {
      return await prisma.$queryRawUnsafe(sqlOrStrings, ...params);
    }
    return await prisma.$queryRaw(sqlOrStrings, ...params);
  }

  async findMany(modelName: string, queryOptions: any = {}): Promise<any[]> {
    const model = (prisma as any)[modelName];
    if (!model || typeof model.findMany !== 'function') {
      throw new Error(`Model ${modelName} not found on database context`);
    }
    return await model.findMany(queryOptions);
  }

  async findUnique(modelName: string, queryOptions: any): Promise<any | null> {
    const model = (prisma as any)[modelName];
    if (!model || typeof model.findUnique !== 'function') {
      throw new Error(`Model ${modelName} not found on database context`);
    }
    return await model.findUnique(queryOptions);
  }

  async findFirst(modelName: string, queryOptions: any = {}): Promise<any | null> {
    const model = (prisma as any)[modelName];
    if (!model || typeof model.findFirst !== 'function') {
      throw new Error(`Model ${modelName} not found on database context`);
    }
    return await model.findFirst(queryOptions);
  }

  async create(modelName: string, createOptions: any): Promise<any> {
    const model = (prisma as any)[modelName];
    if (!model || typeof model.create !== 'function') {
      throw new Error(`Model ${modelName} not found on database context`);
    }
    return await model.create(createOptions);
  }

  async update(modelName: string, updateOptions: any): Promise<any> {
    const model = (prisma as any)[modelName];
    if (!model || typeof model.update !== 'function') {
      throw new Error(`Model ${modelName} not found on database context`);
    }
    return await model.update(updateOptions);
  }

  async delete(modelName: string, deleteOptions: any): Promise<any> {
    const model = (prisma as any)[modelName];
    if (!model || typeof model.delete !== 'function') {
      throw new Error(`Model ${modelName} not found on database context`);
    }
    return await model.delete(deleteOptions);
  }

  async count(modelName: string, countOptions: any = {}): Promise<number> {
    const model = (prisma as any)[modelName];
    if (!model || typeof model.count !== 'function') {
      throw new Error(`Model ${modelName} not found on database context`);
    }
    return await model.count(countOptions);
  }
}
