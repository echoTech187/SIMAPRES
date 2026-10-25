import { prisma } from '@/infrastructure/db/prisma.client';
import { HaversineService } from './haversine.service';

export interface CalculatedMissionFuel {
  oneWayKm: number;
  roundTripKm: number;
  fuelRatioKmPerLiter: number;
  fuelLitersUsed: number;
  pricePerLiter: number;
  fuelCostEstimated: number;
  fuelTypeName: string;
  vehicleNomorLambung: string;
}

export class FuelAuditService {
  /**
   * Faktor koreksi kelokan jaringan jalan darat (Road Network Tortuosity Factor)
   * Standar transportasi wilayah Jawa Tengah: ~1.25x dibanding jarak garis lurus (haversine)
   */
  public static readonly ROAD_NETWORK_FACTOR = 1.25;

  /**
   * Menghitung estimasi kilometer riil pulang-pergi dan konsumsi BBM misi 110 berdasarkan master data DB
   */
  public static async calculateDispatchFuelUsage(
    makoLat: number,
    makoLng: number,
    tkpLat: number,
    tkpLng: number,
    vehicleId?: number | null
  ): Promise<CalculatedMissionFuel> {
    // 1. Hitung jarak garis lurus & jarak jaringan jalan darat PP (Pulang-Pergi)
    const directOneWayKm = HaversineService.calculateDistanceKm(makoLat, makoLng, tkpLat, tkpLng);
    const roadOneWayKm = Number((directOneWayKm * this.ROAD_NETWORK_FACTOR).toFixed(2));
    const roundTripKm = Number((roadOneWayKm * 2).toFixed(2));

    // 2. Ambil profil kendaraan dinas dari database
    let vehicle: any = null;
    if (vehicleId) {
      vehicle = await (prisma as any).patrolVehicle.findUnique({
        where: { id: vehicleId },
        include: { fuel_type_rel: true },
      });
    }

    // Default jika kendaraan belum dipilih: Profil Roda-4 Patroli Samapta (Solar DIPA)
    const defaultFuelType = await (prisma as any).masterFuelType.findFirst({
      where: { key: 'SOLAR_DIPA', is_active: true },
    }) || { label: 'Solar / Biosolar (DIPA)', default_price_per_liter: 6800.0 };

    const fuelRatioKmPerLiter = vehicle?.fuel_ratio_km_per_liter
      ? Number(vehicle.fuel_ratio_km_per_liter)
      : 8.0; // Default R4 Strada diesel: 8 km/liter

    const pricePerLiter = vehicle?.fuel_type_rel?.default_price_per_liter
      ? Number(vehicle.fuel_type_rel.default_price_per_liter)
      : Number(defaultFuelType.default_price_per_liter || 6800.0);

    const fuelTypeName = vehicle?.fuel_type_rel?.label || defaultFuelType.label;
    const vehicleNomorLambung = vehicle?.nomor_lambung || 'Randis Patroli R4';

    // 3. Kalkulasi konsumsi liter & estimasi rupiah klaim
    const fuelLitersUsed = Number((roundTripKm / fuelRatioKmPerLiter).toFixed(2));
    const fuelCostEstimated = Number((fuelLitersUsed * pricePerLiter).toFixed(2));

    return {
      oneWayKm: roadOneWayKm,
      roundTripKm,
      fuelRatioKmPerLiter,
      fuelLitersUsed,
      pricePerLiter,
      fuelCostEstimated,
      fuelTypeName,
      vehicleNomorLambung,
    };
  }

  /**
   * Rekapitulasi bulanan klaim BBM per Polsek atau Mako Polres untuk Biro Logistik (Bag Log)
   */
  public static async getMonthlyFuelAuditSummary(stationId?: number | null, month?: number, year?: number) {
    const now = new Date();
    const targetMonth = month || now.getMonth() + 1;
    const targetYear = year || now.getFullYear();

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    const dispatches = await (prisma as any).complaintDispatch.findMany({
      where: {
        dispatched_at: {
          gte: startDate,
          lte: endDate,
        },
        ...(stationId ? { station_id: stationId } : {}),
        round_trip_km: { not: null },
      },
      include: {
        complaint: true,
        station: true,
        assigned_vehicle: {
          include: { fuel_type_rel: true },
        },
        fuel_claim_status_rel: true,
      },
      orderBy: { dispatched_at: 'desc' },
    });

    let totalKm = 0;
    let totalLiters = 0;
    let totalCostRupiah = 0;

    const items = dispatches.map((d: any) => {
      const km = Number(d.round_trip_km || 0);
      const liters = Number(d.fuel_liters_used || 0);
      const cost = Number(d.fuel_cost_estimated || 0);

      totalKm += km;
      totalLiters += liters;
      totalCostRupiah += cost;

      return {
        dispatchId: d.id.toString(),
        nomorTiket: d.complaint?.nomor_tiket || `#${d.complaint_id}`,
        tanggal: d.dispatched_at,
        stationName: d.station?.station_name || 'Mako Polres',
        jenisKejadian: d.complaint?.jenis_kejadian || '-',
        tkpAlamat: d.complaint?.tkp_alamat_teks || '-',
        nomorLambung: d.assigned_vehicle?.nomor_lambung || 'Randis Patroli',
        fuelType: d.assigned_vehicle?.fuel_type_rel?.label || 'Solar DIPA',
        crewLeader: d.crew_leader_name || '-',
        crewPartner: d.crew_partner_name || '-',
        roundTripKm: km,
        fuelLitersUsed: liters,
        fuelCostEstimated: cost,
        claimStatus: d.fuel_claim_status_rel?.label || 'Terekam GPS',
        claimStatusColor: d.fuel_claim_status_rel?.badge_color || '#64748B',
        claimStatusBg: d.fuel_claim_status_rel?.badge_bg || '#F1F5F9',
        claimStatusKey: d.fuel_claim_status_rel?.key || 'UNCLAIMED',
      };
    });

    return {
      period: `${targetMonth}/${targetYear}`,
      totalMissions: dispatches.length,
      totalKm: Number(totalKm.toFixed(2)),
      totalLiters: Number(totalLiters.toFixed(2)),
      totalCostRupiah: Math.round(totalCostRupiah),
      items,
    };
  }
}
