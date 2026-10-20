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
  lokasi_penyelesaian: 'Master Lokasi Penyelesaian Perkara',
  dokumen_penyelesaian: 'Master Jenis Dokumen & Bukti Penyelesaian',
};

export async function generateMetadata({ params }: { params?: { section?: string } }) {
  const section = params?.section?.toLowerCase() || 'beranda';
  const title = sectionTitleMap[section] || 'Konsol Operasional';
  return {
    title: `${title} - SIMOPMAS 110`,
    description: `Pusat Operasional Presisi 110: ${title}`,
  };
}

import { getMasterFilterOptionsAction, getOfficerComplaintsAction } from '@/app/actions/complaint.actions';
import {
  getOfficerProfileByNrpAction,
  getRegisteredUnitsAction,
  getMasterDropdownsAction,
} from '@/app/actions/auth.actions';
import { getMasterCountersAction } from '@/app/actions/master.actions';

export default async function ConsoleSectionPage({
  params,
  searchParams,
}: {
  params?: { section?: string };
  searchParams?: { tab?: string; page?: string; nrp?: string };
}) {
  // 1. Verifikasi Autentikasi Server-Side
  const session = await getSession();

  const currentSection = params?.section || 'beranda';
  if (!session) {
    redirect(`/?alert=unauthenticated&from=/console/${encodeURIComponent(currentSection)}`);
  }

  const section = params?.section?.toLowerCase() || searchParams?.page || searchParams?.tab || 'beranda';

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

  // 3. Audit Trail: Catat akses halaman spesifik secara non-blocking
  logUserActivity({
    userId: session.userId,
    identifier: session.identifier,
    userName: session.fullName,
    role: session.role,
    activityType: 'ACCESS_CONSOLE',
    description: `${session.role} (${session.identifier} - ${session.fullName}) membuka halaman konsol [${section}]`,
    endpoint: `/console/${section}`,
  }).catch(() => {});

  // 4. Render Tampilan Client Component dengan initialSuperadminData pre-loaded
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
