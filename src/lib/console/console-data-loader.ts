import { SessionPayload } from '@/lib/session';
import { prisma } from '@/infrastructure/db/prisma.client';
import {
  getMasterFilterOptionsAction,
  getOfficerComplaintsAction,
} from '@/app/actions/complaint.actions';
import {
  getOfficerProfileByNrpAction,
  getRegisteredUnitsAction,
  getMasterDropdownsAction,
  getPoliceOfficesAction,
} from '@/app/actions/auth.actions';
import { getMasterCountersAction } from '@/app/actions/master.actions';
import { getPawasDashboardDataAction, getPawasUnifiedDataAction } from '@/app/actions/pawas.actions';
import { getPatrolFleetUnitsAction } from '@/app/actions/fleet.actions';
import { getHotspotsAction } from '@/app/actions/hotspot.actions';
import { getOfficerLogbooksAction } from '@/app/actions/logbook.actions';

export interface ConsoleRoleData {
  initialMasterData: any;
  initialSuperadminData: any;
  initialPawasData: any;
  initialOperatorData: any;
  initialComplaints: any[];
  initialOfficer: any;
  initialLogbooks: any[];
  initialPoliceOffices: any[];
  initialFleetUnits: any[];
  initialHotspots: any[];
}

/**
 * Memperkaya session dengan data Mako/Station jika belum tersimpan di cookie aktif
 */
export async function augmentSessionStation(session: SessionPayload): Promise<void> {
  if ((!session.stationName || !session.stationId) && session.userId) {
    try {
      const u = await prisma.user.findUnique({
        where: { id: BigInt(session.userId) },
        select: {
          station: { select: { id: true, station_name: true, station_code: true } },
          officer_profile: {
            select: { station: { select: { id: true, station_name: true, station_code: true } } },
          },
        },
      });
      const st = u?.station || u?.officer_profile?.station;
      if (st) {
        session.stationName = st.station_name;
        session.stationId = String(st.id);
        session.stationCode = st.station_code;
      }
    } catch (_e) {
      // Non-blocking fallback
    }
  }
}

/**
 * Fetch data awal secara paralel langsung di server (RSC) sesuai dengan role pengguna
 */
export async function fetchConsoleRoleData(
  session: SessionPayload,
  searchParams?: { nrp?: string }
): Promise<ConsoleRoleData> {
  let initialMasterData: any = null;
  let initialSuperadminData: any = null;
  let initialPawasData: any = null;
  let initialOperatorData: any = null;
  let initialComplaints: any[] = [];
  let initialOfficer: any = null;
  let initialLogbooks: any[] = [];
  let initialPoliceOffices: any[] = [];
  let initialFleetUnits: any[] = [];
  let initialHotspots: any[] = [];

  if (session.role === 'SUPERADMIN') {
    const [unitsRes, dropdownsRes, countersRes] = await Promise.all([
      getRegisteredUnitsAction(),
      getMasterDropdownsAction(),
      getMasterCountersAction(),
    ]);

    initialSuperadminData = {
      units: unitsRes.success && unitsRes.data ? unitsRes.data : [],
      dropdowns: dropdownsRes.success && dropdownsRes.data ? dropdownsRes.data : [],
      counters: countersRes.success && countersRes.data ? countersRes.data : null,
    };
  } else if (session.role === 'PAWAS') {
    const pawasRes = await getPawasDashboardDataAction(session.stationId);
    if (pawasRes.success && pawasRes.data) {
      initialPawasData = pawasRes.data;
      initialMasterData = pawasRes.data.filterData;
    }
  } else if (session.role === 'OPERATOR') {
    const opRes = await getPawasDashboardDataAction(session.stationId);
    if (opRes.success && opRes.data) {
      initialOperatorData = opRes.data;
      initialMasterData = opRes.data.filterData;
    }
  } else if (session.role === 'LOGISTIK') {
    const masterRes = await getMasterFilterOptionsAction();
    if (masterRes.success && masterRes.data) {
      initialMasterData = masterRes.data;
    }
  } else {
    // Role default / PERSONIL
    const masterRes = await getMasterFilterOptionsAction();
    initialMasterData = masterRes.success ? masterRes.data : null;

    if (session.role === 'PERSONIL') {
      const targetNrp = searchParams?.nrp ? searchParams.nrp : session.identifier;
      const [cRes, pRes, poRes, fleetRes, hotRes] = await Promise.all([
        getOfficerComplaintsAction(targetNrp),
        getOfficerProfileByNrpAction(targetNrp),
        getPoliceOfficesAction(),
        getPatrolFleetUnitsAction(),
        getHotspotsAction(),
      ]);

      if (cRes.success && cRes.data) initialComplaints = cRes.data;
      if (pRes.success && pRes.data) initialOfficer = pRes.data;
      if (poRes.success && poRes.data) initialPoliceOffices = poRes.data;
      if (fleetRes.success && fleetRes.data) initialFleetUnits = fleetRes.data;
      if (hotRes.success && hotRes.data) initialHotspots = hotRes.data;

      // Pre-fetch logbook riil secara server-side agar konsol personel langsung instan pada 0ms render pertama
      const targetOfficerId = pRes?.data?.officerId || pRes?.data?.id || session.userId;
      if (targetOfficerId) {
        try {
          const lRes = await getOfficerLogbooksAction(String(targetOfficerId));
          if (lRes?.success && lRes?.data) initialLogbooks = lRes.data;
        } catch (_) {}
      }
    }
  }

  return {
    initialMasterData,
    initialSuperadminData,
    initialPawasData,
    initialOperatorData,
    initialComplaints,
    initialOfficer,
    initialLogbooks,
    initialPoliceOffices,
    initialFleetUnits,
    initialHotspots,
  };
}
