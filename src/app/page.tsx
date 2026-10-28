import React, { Suspense } from 'react';
import AuthShell from '@/components/auth/AuthShell';
import LoginHeroPillars from '@/components/auth/LoginHeroPillars';
import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <AuthShell>
      <div className="w-full max-w-6xl mx-auto px-4 py-3 sm:py-6 lg:py-8 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Kolom Kiri: Pilar Edukasi & Humanis Pelayanan Masyarakat */}
          <LoginHeroPillars />

          {/* Kolom Kanan: Kartu Interaktif Login Petugas */}
          <Suspense
            fallback={
              <div className="w-full lg:col-span-5 mx-auto max-w-md lg:max-w-none obsidian-card rounded-2xl p-8 text-center text-slate-400 text-xs font-mono">
                <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                Memuat Layanan SIMOPMAS 110...
              </div>
            }
          >
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </AuthShell>
  );
}
