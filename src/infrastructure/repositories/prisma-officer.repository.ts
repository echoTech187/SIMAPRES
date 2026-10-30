import { IOfficerRepository } from '@/domain/repositories/officer.repository.interface';
import { OfficerEntity, DutyStatus } from '@/domain/entities/officer.entity';
// SIMAPRES 110 - Prisma Officer Repository Implementation
import { prisma } from '../db/prisma.client';

export class PrismaOfficerRepository implements IOfficerRepository {
  private mapToEntity(record: any): OfficerEntity {
    return new OfficerEntity({
      id: record.id,
      userId: record.user_id,
      nrp: record.nrp,
      rankPangkat: record.rank_pangkat,
      jabatan: record.jabatan,
      dutyStatus: record.duty_status as DutyStatus,
      assignedPatrolVehicle: record.assigned_patrol_vehicle,
      currentGpsLat: record.current_gps_lat ? Number(record.current_gps_lat) : null,
      currentGpsLng: record.current_gps_lng ? Number(record.current_gps_lng) : null,
      lastGpsHeartbeatAt: record.last_gps_heartbeat_at,
      kpiScore: Number(record.kpi_score),
      avatarUrl: record.avatar_url,
      deviceId: record.device_id,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    });
  }

  async findById(id: bigint): Promise<OfficerEntity | null> {
    const record = await prisma.policeOfficer.findUnique({ where: { id } });
    return record ? this.mapToEntity(record) : null;
  }

  async findByNrp(nrp: string): Promise<OfficerEntity | null> {
    const record = await prisma.policeOfficer.findUnique({ where: { nrp } });
    return record ? this.mapToEntity(record) : null;
  }

  async findByUserId(userId: bigint): Promise<OfficerEntity | null> {
    const record = await prisma.policeOfficer.findUnique({ where: { user_id: userId } });
    return record ? this.mapToEntity(record) : null;
  }

  async findByDeviceId(deviceId: string): Promise<OfficerEntity | null> {
    const record = await prisma.policeOfficer.findFirst({ where: { device_id: deviceId } });
    return record ? this.mapToEntity(record) : null;
  }

  async findActiveOnDuty(): Promise<OfficerEntity[]> {
    const records = await prisma.policeOfficer.findMany({
      where: {
        duty_status: { in: ['DINAS_PATROLI', 'PIKET_SPKT'] },
      },
    });
    return records.map((r: any) => this.mapToEntity(r));
  }

  async updateLocation(officerId: bigint, lat: number, lng: number): Promise<void> {
    await prisma.policeOfficer.update({
      where: { id: officerId },
      data: {
        current_gps_lat: lat,
        current_gps_lng: lng,
        last_gps_heartbeat_at: new Date(),
      },
    });
  }

  async updateDutyStatus(officerId: bigint, status: DutyStatus): Promise<void> {
    await prisma.policeOfficer.update({
      where: { id: officerId },
      data: { duty_status: status },
    });
  }

  async updateKpiScore(officerId: bigint, score: number): Promise<void> {
    await prisma.policeOfficer.update({
      where: { id: officerId },
      data: { kpi_score: score },
    });
  }

  async getPatrolFleet(): Promise<any[]> {
    return this.getPatrolFleetRaw();
  }

  async getPatrolFleetRaw(): Promise<any[]> {
    return await prisma.$queryRaw`
      SELECT 
        po.id as officer_id,
        po.nrp,
        po.rank_pangkat,
        po.jabatan,
        po.assigned_patrol_vehicle,
        po.current_gps_lat,
        po.current_gps_lng,
        po.avatar_url,
        po.duty_status,
        po.last_gps_heartbeat_at,
        po.device_id,
        po.station_id,
        po.unit_id,
        
        u.full_name,
        un.unit_name,
        un.key as unit_key,
        
        st.station_name,
        st.office_lat as mako_lat,
        st.office_lng as mako_lng,
        st.address as station_address,
        
        -- Latest Logbook
        lb.actual_lat as lb_lat,
        lb.actual_lng as lb_lng,
        lb.claimed_address as lb_address,
        lb.activity_description as lb_activity,
        
        -- Active Dispatch & Complaint
        cd.id as dispatch_id,
        c.nomor_tiket,
        c.jenis_kejadian,
        c.tkp_alamat_teks,
        c.tkp_lat,
        c.tkp_lng,
        
        -- Vehicle
        pv.nama_armada,
        
        -- Pairing / QR scan
        CASE WHEN ps.officer_scanned = 1 THEN 1 ELSE 0 END as has_scanned_qr,
        
        -- Vehicle usage
        CASE WHEN vu.officer_has_vu = 1 THEN 1 ELSE 0 END as has_vehicle_usage
        
      FROM police_officers po
      JOIN users u ON u.id = po.user_id AND u.role = 'PERSONIL'
      LEFT JOIN master_operational_units un ON un.id = po.unit_id
      LEFT JOIN police_stations st ON st.id = po.station_id
      LEFT JOIN patrol_vehicles pv ON pv.nomor_lambung = po.assigned_patrol_vehicle
      
      -- Subquery for latest logbook
      LEFT JOIN (
        SELECT l1.officer_id, l1.actual_lat, l1.actual_lng, l1.claimed_address, l1.activity_description
        FROM officer_logbooks l1
        INNER JOIN (
          SELECT officer_id, MAX(created_at) as max_created
          FROM officer_logbooks
          GROUP BY officer_id
        ) l2 ON l1.officer_id = l2.officer_id AND l1.created_at = l2.max_created
      ) lb ON lb.officer_id = po.id
      
      -- Active dispatch (single latest)
      LEFT JOIN (
        SELECT d1.officer_id, MAX(d1.id) as max_disp_id
        FROM complaint_dispatches d1
        JOIN complaints c1 ON c1.id = d1.complaint_id AND c1.status NOT IN ('SELESAI', 'DITOLAK')
        GROUP BY d1.officer_id
      ) cd_max ON cd_max.officer_id = po.id
      LEFT JOIN complaint_dispatches cd ON cd.id = cd_max.max_disp_id
      LEFT JOIN complaints c ON c.id = cd.complaint_id
      
      -- Pairing (aggregated flag per nrp / device)
      LEFT JOIN (
        SELECT 
          nrp, device_id, 1 as officer_scanned
        FROM device_pairing_sessions
        WHERE status = 'PAIRED' AND scanned_at IS NOT NULL
        GROUP BY nrp, device_id
      ) ps ON (ps.nrp = po.nrp OR (po.device_id IS NOT NULL AND ps.device_id = po.device_id))
      
      -- Vehicle usage (aggregated flag per officer)
      LEFT JOIN (
        SELECT officer_id, 1 as officer_has_vu
        FROM vehicle_usage_logs
        WHERE status_sesi = 'ACTIVE'
        GROUP BY officer_id
      ) vu ON vu.officer_id = po.id
      
      WHERE po.duty_status IN ('DINAS_PATROLI', 'PIKET_SPKT', 'SIAGA')
      GROUP BY po.id, po.nrp, po.rank_pangkat, po.jabatan, po.assigned_patrol_vehicle, po.current_gps_lat, po.current_gps_lng, po.avatar_url, po.duty_status, po.last_gps_heartbeat_at, po.device_id, po.station_id, po.unit_id, u.full_name, un.unit_name, un.key, st.station_name, st.office_lat, st.office_lng, st.address, lb.actual_lat, lb.actual_lng, lb.claimed_address, lb.activity_description, cd.id, c.nomor_tiket, c.jenis_kejadian, c.tkp_alamat_teks, c.tkp_lat, c.tkp_lng, pv.nama_armada, ps.officer_scanned, vu.officer_has_vu
      ORDER BY po.rank_pangkat ASC;
    `;
  }

  async getPatrolFleetFallback(): Promise<{
    officers: any[];
    vehicles: any[];
    activeDispatches: any[];
    stations: any[];
    pairingSessions: any[];
    vehicleUsageLogs: any[];
  }> {
    const [
      officers,
      vehicles,
      activeDispatches,
      stations,
      pairingSessions,
      vehicleUsageLogs,
    ] = await Promise.all([
      prisma.policeOfficer.findMany({
        where: {
          user: { role: 'PERSONIL' },
          duty_status: { in: ['DINAS_PATROLI', 'PIKET_SPKT', 'SIAGA'] },
        },
        include: {
          user: true,
          unit: true,
          station: true,
          logbooks: {
            orderBy: { created_at: 'desc' },
            take: 1,
          },
        },
        orderBy: { rank_pangkat: 'asc' },
      }),
      prisma.patrolVehicle.findMany({
        include: { unit: true, station: true },
        orderBy: { id: 'asc' },
      }),
      prisma.complaintDispatch.findMany({
        where: {
          complaint: {
            status: { notIn: ['SELESAI', 'DITOLAK'] },
          },
        },
        include: {
          complaint: true,
          officer: { include: { user: true } },
        },
      }),
      prisma.policeStation.findMany().catch(() => []),
      prisma.devicePairingSession.findMany({ where: { status: 'PAIRED' } }).catch(() => []),
      prisma.vehicleUsageLog.findMany({ where: { status_sesi: 'ACTIVE' } }).catch(() => []),
    ]);

    return {
      officers,
      vehicles,
      activeDispatches,
      stations,
      pairingSessions,
      vehicleUsageLogs,
    };
  }

  async updatePatrolFleetTelemetry(unitKey: string, lat: number, lng: number, status?: string): Promise<void> {
    await prisma.patrolVehicle.updateMany({
      where: { nomor_lambung: unitKey },
      data: {
        current_lat: lat,
        current_lng: lng,
        status_operasional: status || undefined,
        last_heartbeat_at: new Date(),
      },
    });
  }

  async submitPresensi(input: {
    nrp?: string;
    officerId?: string;
    isMasuk: boolean;
    lat?: number;
    lng?: number;
  }): Promise<{ officer: any; dutyStatus: string }> {
    const whereClause: any = {};
    if (input.nrp) {
      whereClause.nrp = input.nrp;
    } else if (input.officerId) {
      whereClause.id = BigInt(input.officerId);
    } else {
      throw new Error('Identitas personel (NRP/ID) tidak valid.');
    }

    const officer = await prisma.policeOfficer.findFirst({
      where: whereClause,
      include: { user: true, station: true },
    });

    if (!officer) {
      throw new Error('Data personel tidak ditemukan di database.');
    }

    const primaryStation = await prisma.policeStation.findFirst({
      where: { station_level: 'POLRES' },
    }).catch(() => null);

    const makoLat = officer.station?.office_lat ?? primaryStation?.office_lat ?? null;
    const makoLng = officer.station?.office_lng ?? primaryStation?.office_lng ?? null;

    const now = new Date();
    const finalLat =
      input.isMasuk
        ? (input.lat !== undefined && !isNaN(Number(input.lat)) && Math.abs(Number(input.lat)) > 0.001
            ? input.lat
            : makoLat)
        : undefined;

    const finalLng =
      input.isMasuk
        ? (input.lng !== undefined && !isNaN(Number(input.lng)) && Math.abs(Number(input.lng)) > 0.001
            ? input.lng
            : makoLng)
        : undefined;

    const newStatus = input.isMasuk ? 'DINAS_PATROLI' : 'LEPAS_DINAS';

    const updated = await prisma.policeOfficer.update({
      where: { id: officer.id },
      data: {
        duty_status: newStatus,
        station_id: officer.station_id || primaryStation?.id || undefined,
        current_gps_lat: finalLat !== undefined ? finalLat : undefined,
        current_gps_lng: finalLng !== undefined ? finalLng : undefined,
        last_gps_heartbeat_at: input.isMasuk ? now : undefined,
        assigned_patrol_vehicle: input.isMasuk ? undefined : null,
      },
    });

    return { officer: updated, dutyStatus: newStatus };
  }
}

