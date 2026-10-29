import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getPawasDashboardDataAction,
  getPawasMapDataAction,
  getPawasAnalyticsDataAction,
  invalidatePawasUnifiedCache,
} from '../pawas.actions';
import * as complaintActions from '../complaint.actions';
import * as authActions from '../auth.actions';
import * as fleetActions from '../fleet.actions';
import * as hotspotActions from '../hotspot.actions';
import * as logbookActions from '../logbook.actions';

describe('Server Action Integration: pawas.actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    invalidatePawasUnifiedCache();
  });

  describe('getPawasDashboardDataAction', () => {
    it('aggregates pending complaints, recent complaints, units, and logbooks', async () => {
      vi.spyOn(complaintActions, 'getMasterFilterOptionsAction').mockResolvedValue({
        success: true,
        data: { categories: [{ id: 1, key: 'LAKA' }] },
      } as any);

      vi.spyOn(complaintActions, 'getPendingComplaintsAction').mockResolvedValue({
        success: true,
        data: [{ id: '1', nomorTiket: 'TICKET-01', status: 'MENUNGGU' }],
      } as any);

      vi.spyOn(complaintActions, 'getAllRecentComplaintsAction').mockResolvedValue({
        success: true,
        data: [{ id: '2', nomorTiket: 'TICKET-02', status: 'SELESAI' }],
      } as any);

      vi.spyOn(authActions, 'getRegisteredUnitsAction').mockResolvedValue({
        success: true,
        data: [{ id: '1', unit_name: 'Sat Lantas' }],
      } as any);

      vi.spyOn(logbookActions, 'getRecentLogbooksAction').mockResolvedValue({
        success: true,
        data: [{ id: '10', action_type: 'PATROLI' }],
      } as any);

      const result = await getPawasDashboardDataAction(60001, true);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.pendingComplaints.length).toBe(1);
      expect(result.data?.allRecentComplaints.length).toBe(1);
      expect(result.data?.registeredUnits.length).toBe(1);
      expect(result.data?.recentLogbooks.length).toBe(1);
    });
  });

  describe('getPawasMapDataAction', () => {
    it('aggregates fleet units, police offices, and hotspots for tactical map', async () => {
      vi.spyOn(fleetActions, 'getPatrolFleetUnitsAction').mockResolvedValue({
        success: true,
        data: [{ id: '1', nrp: '8801', lat: -7.02, lng: 109.59 }],
      } as any);

      vi.spyOn(authActions, 'getPoliceOfficesAction').mockResolvedValue({
        success: true,
        data: [{ id: '1', station_name: 'Polsek Kajen' }],
      } as any);

      vi.spyOn(hotspotActions, 'getHotspotsAction').mockResolvedValue({
        success: true,
        data: [{ id: '10', key: 'hotspot_alun', title: 'Alun-alun Kajen' }],
      } as any);

      const result = await getPawasMapDataAction(true);

      expect(result.success).toBe(true);
      expect(result.data?.fleetUnits.length).toBe(1);
      expect(result.data?.policeOffices.length).toBe(1);
      expect(result.data?.hotspots.length).toBe(1);
    });
  });

  describe('getPawasAnalyticsDataAction', () => {
    it('aggregates IKM satisfaction score, officer ranking, and station ranking', async () => {
      vi.spyOn(complaintActions, 'getIkmStatsAction').mockResolvedValue({
        success: true,
        data: { averageRating: 4.8, totalVoting: 120 },
      } as any);

      vi.spyOn(complaintActions, 'getOfficerPerformanceRankingsAction').mockResolvedValue({
        success: true,
        data: [{ nrp: '8801', kpiScore: 98 }],
      } as any);

      vi.spyOn(complaintActions, 'getStationPerformanceRankingsAction').mockResolvedValue({
        success: true,
        data: [{ stationName: 'Polsek Kajen', score: 95 }],
      } as any);

      vi.spyOn(complaintActions, 'getOperatorPerformanceRankingsAction').mockResolvedValue({
        success: true,
        data: [{ name: 'Briptu Danang', totalAssigned: 50 }],
      } as any);

      const result = await getPawasAnalyticsDataAction(60001, true);

      expect(result.success).toBe(true);
      expect(result.data?.ikmStats?.averageRating).toBe(4.8);
      expect(result.data?.officerRankings?.length).toBe(1);
      expect(result.data?.stationRankings?.length).toBe(1);
      expect(result.data?.operatorRankings?.length).toBe(1);
    });
  });
});
