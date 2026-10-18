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
  title: 'Konsol Operasional Terpadu - SIMAPRES 110 Presisi',
  description: 'Pusat Komando dan Operasional Rantai Komando Presisi 110',
};

import { getMasterFilterOptionsAction } from '@/app/actions/complaint.actions';

export default async function ConsolePage({
  searchParams,
}: {
  searchParams?: { tab?: string; page?: string };
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

  // 3. Audit Trail: Catat akses konsol ke tabel user_log_activities secara asynchronous
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

  // 4. Render Tampilan Client Component Berdasarkan Role dengan Data Master Database Asli
  return (
    <Suspense fallback={<ConsoleSkeleton role={session.role} />}>
      {session.role === 'SUPERADMIN' && (
        <SuperadminConsoleView session={session} initialSection={section} initialMasterData={initialMasterData} />
      )}
      {session.role === 'PAWAS' && (
        <PawasConsoleView session={session} initialSection={section} initialMasterData={initialMasterData} />
      )}
      {session.role === 'PERSONIL' && (
        <PersonilConsoleView session={session} initialSection={section} initialMasterData={initialMasterData} />
      )}
    </Suspense>
  );
}
