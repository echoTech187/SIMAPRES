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
import { getOfficerProfileByNrpAction } from '@/app/actions/auth.actions';

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

  // 2. Load Master Data directly from Database on the Server
  const masterRes = await getMasterFilterOptionsAction();
  const initialMasterData = masterRes.success ? masterRes.data : null;

  // 3. Jika role PERSONIL, ambil data penugasan & profile langsung di Server (RSC)
  let initialComplaints: any[] = [];
  let initialOfficer: any = null;
  if (session.role === 'PERSONIL') {
    const targetNrp = searchParams?.nrp || session.identifier || '92031145';
    const [cRes, pRes] = await Promise.all([
      getOfficerComplaintsAction(targetNrp),
      getOfficerProfileByNrpAction(targetNrp),
    ]);
    if (cRes.success && cRes.data) initialComplaints = cRes.data;
    if (pRes.success && pRes.data) initialOfficer = pRes.data;
  }

  // 4. Audit Trail: Catat akses konsol ke tabel user_log_activities secara asynchronous
  try {
    await logUserActivity({
      userId: session.userId,
      identifier: session.identifier,
      userName: session.fullName,
      role: session.role,
      activityType: 'ACCESS_CONSOLE',
      description: `${session.role} (${session.identifier} - ${session.fullName}) mengakses konsol operasional [${section}]`,
      endpoint: section === 'beranda' ? '/console' : `/console/${section}`,
    });
  } catch (_) {}

  // 5. Render Tampilan Client Component Berdasarkan Role dengan Data Master Database Asli
  return (
    <Suspense fallback={<ConsoleSkeleton role={session.role} />}>
      {session.role === 'SUPERADMIN' && (
        <SuperadminConsoleView session={session} initialSection={section} initialMasterData={initialMasterData} />
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
