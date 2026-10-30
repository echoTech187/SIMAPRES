/**
 * SIMAPRES 110 - INFRASTRUCTURE REPOSITORY: MASTER DATA
 * Lapisan: Infrastructure (Prisma Implementation)
 */

import { prisma } from '../db/prisma.client';
import {
  IMasterRepository,
  MasterLookupsBundle,
  MasterPoliceStationItem,
  MasterIncidentCategoryItem,
  MasterOperationalUnitItem,
} from '@/domain/repositories/master.repository.interface';

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

  async getMasterLookupsBundle(): Promise<MasterLookupsBundle> {
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
      prisma.masterVehicleType.findMany({
        where: { is_active: true },
        orderBy: { display_order: 'asc' },
      }).catch(() => []),
      prisma.masterVehicleStatus.findMany({
        where: { is_active: true },
        orderBy: { display_order: 'asc' },
      }).catch(() => []),
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
      stationLevels,
      urgencyLevels,
      dangerLevels,
      categories,
      units,
      hotspotCategories,
      vehicleTypes: Array.isArray(vehicleTypes) ? vehicleTypes : [],
      vehicleStatuses: Array.isArray(vehicleStatuses) ? vehicleStatuses : [],
      fuelTypes: Array.isArray(fuelTypes) ? fuelTypes.map((f) => ({ ...f, default_price_per_liter: Number(f.default_price_per_liter) })) : [],
      fuelClaimStatuses: Array.isArray(fuelClaimStatuses) ? fuelClaimStatuses : [],
      crewRoles: Array.isArray(crewRoles) ? crewRoles : [],
      dispatchModes: Array.isArray(dispatchModes) ? dispatchModes : [],
    };
  }

  async getAllStations(): Promise<MasterPoliceStationItem[]> {
    const stations = await prisma.policeStation.findMany({
      where: { is_active: true },
      orderBy: { station_level: 'asc' },
    });
    return stations.map((s) => ({
      ...s,
      office_lat: s.office_lat ? Number(s.office_lat) : undefined,
      office_lng: s.office_lng ? Number(s.office_lng) : undefined,
    }));
  }

  async getAllCategories(): Promise<MasterIncidentCategoryItem[]> {
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

  async getAllUnits(): Promise<MasterOperationalUnitItem[]> {
    return await prisma.masterOperationalUnit.findMany({
      where: { is_active: true },
      orderBy: { display_order: 'asc' },
    });
  }

  async executeMasterQuery<T = unknown>(sqlOrStrings: string | TemplateStringsArray, ...params: unknown[]): Promise<T> {
    if (typeof sqlOrStrings === 'string') {
      return (await prisma.$queryRawUnsafe(sqlOrStrings, ...params)) as T;
    }
    return (await prisma.$queryRaw(sqlOrStrings, ...params)) as T;
  }

  private getModelDelegate(modelName: string): Record<string, Function> {
    const client = prisma as unknown as Record<string, Record<string, Function>>;
    const model = client[modelName];
    if (!model) {
      throw new Error(`Model '${modelName}' is not defined on the database context`);
    }
    return model;
  }

  async findMany<T = unknown>(modelName: string, queryOptions: unknown = {}): Promise<T[]> {
    const model = this.getModelDelegate(modelName);
    return (await model.findMany(queryOptions)) as T[];
  }

  async findUnique<T = unknown>(modelName: string, queryOptions: unknown): Promise<T | null> {
    const model = this.getModelDelegate(modelName);
    return (await model.findUnique(queryOptions)) as T | null;
  }

  async findFirst<T = unknown>(modelName: string, queryOptions: unknown = {}): Promise<T | null> {
    const model = this.getModelDelegate(modelName);
    return (await model.findFirst(queryOptions)) as T | null;
  }

  async create<T = unknown>(modelName: string, createOptions: unknown): Promise<T> {
    const model = this.getModelDelegate(modelName);
    return (await model.create(createOptions)) as T;
  }

  async update<T = unknown>(modelName: string, updateOptions: unknown): Promise<T> {
    const model = this.getModelDelegate(modelName);
    return (await model.update(updateOptions)) as T;
  }

  async delete<T = unknown>(modelName: string, deleteOptions: unknown): Promise<T> {
    const model = this.getModelDelegate(modelName);
    return (await model.delete(deleteOptions)) as T;
  }

  async count(modelName: string, countOptions: unknown = {}): Promise<number> {
    const model = this.getModelDelegate(modelName);
    return (await model.count(countOptions)) as number;
  }
}
