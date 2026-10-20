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

export const metadata = {
  title: 'Konsol Operasional Terpadu - SIMOPMAS 110',
  description: 'Pusat Komando dan Operasional Rantai Komando Presisi 110',
};

import { getMasterFilterOptionsAction, getOfficerComplaintsAction } from '@/app/actions/complaint.actions';
import {
  getOfficerProfileByNrpAction,
  getRegisteredUnitsAction,
  getMasterDropdownsAction,
} from '@/app/actions/auth.actions';
import { getMasterCountersAction } from '@/app/actions/master.actions';

export default async function ConsolePage({
  searchParams,
}: {
  searchParams?: { tab?: string; page?: string; nrp?: string };
}) {
  // 1. Verifikasi Autentikasi Server-Side langsung dari HTTP-Only Cookie
  const session = await getSession();

  if (!session) {
    redirect('/?alert=unauthenticated&from=/console');
  }

  const section = searchParams?.page || searchParams?.tab || 'beranda';

  // 2. Pre-fetch targeted data secara paralel langsung di Server (RSC) per-role
  let initialMasterData: any = null;
  let initialSuperadminData: any = null;
  let initialComplaints: any[] = [];
  let initialOfficer: any = null;

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
  } else {
    const masterRes = await getMasterFilterOptionsAction();
    initialMasterData = masterRes.success ? masterRes.data : null;

    if (session.role === 'PERSONIL') {
      const targetNrp = searchParams?.nrp || session.identifier || '92031145';
      const [cRes, pRes] = await Promise.all([
        getOfficerComplaintsAction(targetNrp),
        getOfficerProfileByNrpAction(targetNrp),
      ]);
      if (cRes.success && cRes.data) initialComplaints = cRes.data;
      if (pRes.success && pRes.data) initialOfficer = pRes.data;
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
        <PawasConsoleView session={session} initialSection={section} initialMasterData={initialMasterData} />
      )}
      {session.role === 'PERSONIL' && (
        <PersonilConsoleView
          session={session}
          initialSection={section}
          initialMasterData={initialMasterData}
          initialComplaints={initialComplaints}
          initialOfficer={initialOfficer}
        />
      )}
    </Suspense>
  );
}
