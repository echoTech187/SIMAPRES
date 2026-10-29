// SIMAPRES 110 - Unified Console (Server Component Architecture)
export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { logUserActivity } from '@/infrastructure/logging/activity-logger';
import { augmentSessionStation, fetchConsoleRoleData } from '@/lib/console/console-data-loader';
import ConsoleRoleRouter from '@/components/console/ConsoleRoleRouter';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata = {
  title: 'Konsol Operasional Terpadu - SIMOPMAS 110',
  description: 'Pusat Komando dan Operasional Rantai Komando SIMOPMAS 110',
  icons: {
    icon: [
      { url: '/favicon-256.png?v=simopmas110', sizes: '256x256', type: 'image/png' },
      { url: '/favicon.ico?v=simopmas110', sizes: 'any' },
    ],
    shortcut: '/favicon-256.png?v=simopmas110',
    apple: '/favicon-256.png?v=simopmas110',
  },
};

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

  // 2. Augment session dengan Mako / Station jika belum tersimpan di cookie sesi aktif
  await augmentSessionStation(session);

  const section = resolvedSearchParams?.page
    ? resolvedSearchParams.page
    : resolvedSearchParams?.tab
    ? resolvedSearchParams.tab
    : session.role === 'OPERATOR'
    ? 'operator'
    : session.role === 'LOGISTIK'
    ? 'audit_bbm'
    : 'beranda';

  // 3. Pre-fetch targeted data secara paralel langsung di Server (RSC) per-role
  const roleData = await fetchConsoleRoleData(session, resolvedSearchParams);

  // 4. Audit Trail: Catat akses konsol secara non-blocking agar respons server instan
  logUserActivity({
    userId: session.userId,
    identifier: session.identifier,
    userName: session.fullName,
    role: session.role,
    activityType: 'ACCESS_CONSOLE',
    description: `${session.role} (${session.identifier} - ${session.fullName}) mengakses konsol operasional [${section}]`,
    endpoint: section === 'beranda' ? '/console' : `/console/${section}`,
  }).catch(() => {});

  // 5. Render Tampilan Client Component Berdasarkan Role
  return (
    <ConsoleRoleRouter
      session={session}
      section={section}
      roleData={roleData}
    />
  );
}
