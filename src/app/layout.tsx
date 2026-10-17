import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SIMAPRES 110 - Sistem Monitoring & Akuntabilitas Pengaduan Presisi',
  description: 'Sistem Terpadu Pelayanan, Pemantauan, dan Akuntabilitas Pengaduan Polri Presisi 110',
  icons: {
    icon: '/assets/images/polri_pengaduan_tkp.jpg',
  },
};

import InactivityMonitor from '@/components/auth/InactivityMonitor';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;700&family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased bg-[#F8FAFC] text-[#0F172A] min-h-screen">
        <InactivityMonitor />
        {children}
      </body>
    </html>
  );
}
