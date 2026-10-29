// SIMAPRES 110 - Console Section Page (Per-Halaman URL Architecture)
export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { logUserActivity } from '@/infrastructure/logging/activity-logger';
import { augmentSessionStation, fetchConsoleRoleData } from '@/lib/console/console-data-loader';
import ConsoleRoleRouter from '@/components/console/ConsoleRoleRouter';

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
  panduan: 'Buku Pintar SOP & Panduan Layanan',
  faq: 'Buku Pintar SOP & Panduan Layanan',
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
  knowledge_faq: 'Master Buku Pintar SOP & Layanan Warga',
  master_faq: 'Master Buku Pintar SOP & Layanan Warga',
  audit_bbm: 'Audit Klaim BBM Logistik Polri',
  fuel_type: 'Master Jenis Bahan Bakar Dinas (BBM)',
  piket: 'Jadwal & Roster Piket Presisi',
  'jadwal-piket': 'Jadwal & Roster Piket Presisi',
  fuel_claim_status: 'Master Alur Status Klaim BBM',
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ section?: string }>;
}) {
  const resolvedParams = await params;
  const section = resolvedParams?.section ? resolvedParams.section.toLowerCase() : 'beranda';
  const title = sectionTitleMap[section] ? sectionTitleMap[section] : 'Konsol Operasional';
  return {
    title: `${title} - SIMOPMAS 110`,
    description: `Pusat Operasional SIMOPMAS 110: ${title}`,
    icons: {
      icon: [
        { url: '/favicon-256.png?v=simopmas110', sizes: '256x256', type: 'image/png' },
        { url: '/favicon.ico?v=simopmas110', sizes: 'any' },
      ],
      shortcut: '/favicon-256.png?v=simopmas110',
      apple: '/favicon-256.png?v=simopmas110',
    },
  };
}

export default async function ConsoleSectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ section?: string }>;
  searchParams: Promise<{ tab?: string; page?: string; nrp?: string }>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  // 1. Verifikasi Autentikasi Server-Side
  const session = await getSession();

  const currentSection = resolvedParams?.section ? resolvedParams.section : 'beranda';
  if (!session) {
    redirect(`/?alert=unauthenticated&from=/console/${encodeURIComponent(currentSection)}`);
  }

  // 2. Augment session dengan Mako / Station jika belum tersimpan di cookie sesi aktif
  await augmentSessionStation(session);

  const section = resolvedParams?.section?.toLowerCase()
    ? resolvedParams.section.toLowerCase()
    : resolvedSearchParams?.page
    ? resolvedSearchParams.page
    : resolvedSearchParams?.tab
    ? resolvedSearchParams.tab
    : 'beranda';

  if (section === 'fuel_claim_status') {
    redirect('/console/audit_bbm');
  }

  // 3. Pre-fetch targeted data secara paralel langsung di Server (RSC) per-role
  const roleData = await fetchConsoleRoleData(session, resolvedSearchParams);

  // 4. Audit Trail: Catat akses halaman spesifik secara non-blocking
  logUserActivity({
    userId: session.userId,
    identifier: session.identifier,
    userName: session.fullName,
    role: session.role,
    activityType: 'ACCESS_CONSOLE',
    description: `${session.role} (${session.identifier} - ${session.fullName}) membuka halaman konsol [${section}]`,
    endpoint: `/console/${section}`,
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
