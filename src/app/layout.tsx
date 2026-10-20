import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SIMOPMAS 110 - Sistem Monitoring Polisi Bersama Masyarakat',
  description: 'Sistem Terpadu Monitoring Polisi Bersama Masyarakat - Layanan 110 Presisi',
  icons: {
    icon: '/favicon.ico',
  },
};

import InactivityMonitor from '@/components/auth/InactivityMonitor';
import ToastContainer from '@/components/ui/Toast';

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
        <ToastContainer />
        {children}
      </body>
    </html>
  );
}
