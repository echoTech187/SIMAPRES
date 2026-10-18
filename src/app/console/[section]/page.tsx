// SIMAPRES 110 - Console Section Page (Per-Halaman URL Architecture)
export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { logUserActivity } from '@/lib/activity-logger';
import { ConsoleSkeleton } from '@/components/console/ConsoleSkeleton';
import SuperadminConsoleView from '@/components/console/SuperadminConsoleView';
import PawasConsoleView from '@/components/console/PawasConsoleView';
import PersonilConsoleView from '@/components/console/PersonilConsoleView';

const sectionTitleMap: Record<string, string> = {
  beranda: 'Beranda Operasional',
  peta: 'Peta Patroli & Rute',
  komando: 'Komando Pawas',
  'komando-pawas': 'Komando Pawas',
  'buat-pengaduan': 'Buat Pengaduan & Log Lapangan',
  'buat-log': 'Buat Pengaduan & Log Lapangan',
  tugas: 'Daftar Tugas & Penanganan',
  kinerja: 'Laporan Kinerja Presisi',
  profil: 'Profil Kedinasan Personel',
  operator: 'Operator CAD 110',
  wizard: 'Wizard Penanganan Kasus',
  tolak: 'Penolakan Laporan',
  // Master Data Tabs Superadmin
  unit: 'Pendaftaran & Satuan Unit',
  pangkat: 'Master Pangkat Kepolisian',
  satuan: 'Master Satuan Operasional',
  role: 'Master Peran & Hak Akses',
  station: 'Master Kantor Polisi & Mako',
  armada: 'Master Armada Operasional & Ranmor Patroli',
  hotspot: 'Master Titik Rawan Kriminalitas & Laka (GIS)',
  hotspot_cat: 'Master Kategori Titik Rawan',
  kategori: 'Master Kategori Kejadian Insiden',
  subkategori: 'Master Subkategori Insiden & Rincian Kasus',
  duty: 'Master Status Kedinasan',
};

export async function generateMetadata({ params }: { params?: { section?: string } }) {
  const section = params?.section?.toLowerCase() || 'beranda';
  const title = sectionTitleMap[section] || 'Konsol Operasional';
  return {
    title: `${title} - SIMAPRES 110 Presisi`,
    description: `Pusat Operasional Presisi 110: ${title}`,
  };
}

import { getMasterFilterOptionsAction } from '@/app/actions/complaint.actions';

export default async function ConsoleSectionPage({
  params,
  searchParams,
}: {
  params?: { section?: string };
  searchParams?: { tab?: string; page?: string };
}) {
  // 1. Verifikasi Autentikasi Server-Side
  const session = await getSession();

  const currentSection = params?.section || 'beranda';
  if (!session) {
    redirect(`/?alert=unauthenticated&from=/console/${encodeURIComponent(currentSection)}`);
  }

  const section = params?.section?.toLowerCase() || searchParams?.page || searchParams?.tab || 'beranda';

  // 2. Load Master Data directly from Database on the Server
  const masterRes = await getMasterFilterOptionsAction();
  const initialMasterData = masterRes.success ? masterRes.data : null;

  // 3. Audit Trail: Catat akses halaman spesifik ke tabel user_log_activities
  try {
    await logUserActivity({
      userId: session.userId,
      identifier: session.identifier,
      userName: session.fullName,
      role: session.role,
      activityType: 'ACCESS_CONSOLE',
      description: `${session.role} (${session.identifier} - ${session.fullName}) membuka halaman konsol [${section}]`,
      endpoint: `/console/${section}`,
    });
  } catch (_) {}

  // 4. Render Tampilan Client Component dengan initialSection dan initialMasterData dari database
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
