// SIMAPRES 110 - Unified Console (Server Component Architecture)
export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { logUserActivity } from '@/lib/activity-logger';
import { ConsoleSkeleton } from '@/components/console/ConsoleSkeleton';
import SuperadminConsoleView from '@/components/console/SuperadminConsoleView';
import PawasConsoleView from '@/components/console/PawasConsoleView';
import PersonilConsoleView from '@/components/console/PersonilConsoleView';

import OperatorConsoleView from '@/components/console/OperatorConsoleView';
import LogistikConsoleView from '@/components/console/LogistikConsoleView';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata = {
  title: 'Konsol Operasional Terpadu - SIMOPMAS 110',
  description: 'Pusat Komando dan Operasional Rantai Komando SIMOPMAS 110',
};

import { getMasterFilterOptionsAction, getOfficerComplaintsAction } from '@/app/actions/complaint.actions';
import {
  getOfficerProfileByNrpAction,
  getRegisteredUnitsAction,
  getMasterDropdownsAction,
  getPoliceOfficesAction,
} from '@/app/actions/auth.actions';
import { getMasterCountersAction } from '@/app/actions/master.actions';
import { getPawasUnifiedDataAction } from '@/app/actions/pawas.actions';
import { getPatrolFleetUnitsAction } from '@/app/actions/fleet.actions';
import { getHotspotsAction } from '@/app/actions/hotspot.actions';

export default async function ConsolePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; page?: string; nrp?: string }>;
}) {
  const resolvedSearchParams = await searchParams;

  // 1. Verifikasi Autentikasi Server-Side langsung dari HTTP-Only Cookie
  const session = await getSession();

  if (!session) {
    redirect('/?alert=unauthenticated&from=/console');
  }

  const section = resolvedSearchParams?.page
    ? resolvedSearchParams.page
    : resolvedSearchParams?.tab
    ? resolvedSearchParams.tab
    : session.role === 'OPERATOR'
    ? 'operator'
    : session.role === 'LOGISTIK'
    ? 'audit_bbm'
    : 'beranda';

  // 2. Pre-fetch targeted data secara paralel langsung di Server (RSC) per-role
  let initialMasterData: any = null;
  let initialSuperadminData: any = null;
  let initialPawasData: any = null;
  let initialOperatorData: any = null;
  let initialComplaints: any[] = [];
  let initialOfficer: any = null;
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
    const pawasRes = await getPawasUnifiedDataAction();
    if (pawasRes.success && pawasRes.data) {
      initialPawasData = pawasRes.data;
      initialMasterData = pawasRes.data.filterData;
    }
  } else if (session.role === 'OPERATOR') {
    const opRes = await getPawasUnifiedDataAction();
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
    const masterRes = await getMasterFilterOptionsAction();
    initialMasterData = masterRes.success ? masterRes.data : null;

    if (session.role === 'PERSONIL') {
      const targetNrp = resolvedSearchParams?.nrp ? resolvedSearchParams.nrp : session.identifier;
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
    }
  }

  // 3. Audit Trail: Catat akses konsol secara non-blocking agar respons server instan
  logUserActivity({
    userId: session.userId,
    identifier: session.identifier,
    userName: session.fullName,
    role: session.role,
    activityType: 'ACCESS_CONSOLE',
    description: `${session.role} (${session.identifier} - ${session.fullName}) mengakses konsol operasional [${section}]`,
    endpoint: section === 'beranda' ? '/console' : `/console/${section}`,
  }).catch(() => {});

  // 4. Render Tampilan Client Component Berdasarkan Role dengan Data Pre-Loaded
  return (
    <Suspense fallback={<ConsoleSkeleton role={session.role} />}>
      {session.role === 'SUPERADMIN' && (
        <SuperadminConsoleView
          session={session}
          initialSection={section}
          initialMasterData={initialMasterData}
          initialSuperadminData={initialSuperadminData}
        />
      )}
      {session.role === 'PAWAS' && (
        <PawasConsoleView
          session={session}
          initialSection={section}
          initialMasterData={initialMasterData}
          initialPawasData={initialPawasData}
        />
      )}
      {session.role === 'OPERATOR' && (
        <OperatorConsoleView
          session={session}
          initialSection={section}
          initialMasterData={initialMasterData}
          initialOperatorData={initialOperatorData}
        />
      )}
      {session.role === 'LOGISTIK' && (
        <LogistikConsoleView
          session={session}
          initialSection={section}
          initialMasterData={initialMasterData}
        />
      )}
      {session.role === 'PERSONIL' && (
        <PersonilConsoleView
          session={session}
          initialSection={section}
          initialMasterData={initialMasterData}
          initialComplaints={initialComplaints}
          initialOfficer={initialOfficer}
          initialPoliceOffices={initialPoliceOffices}
          initialFleetUnits={initialFleetUnits}
          initialHotspots={initialHotspots}
        />
      )}
    </Suspense>
  );
}
