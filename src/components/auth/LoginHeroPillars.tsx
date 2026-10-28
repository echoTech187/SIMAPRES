'use client';

import React from 'react';
import { HeartHandshake, Users, ShieldCheck } from 'lucide-react';

export default function LoginHeroPillars() {
  return (
    <div className="hidden lg:block lg:col-span-7 space-y-6">
      {/* Institutional Badge & Header */}
      <div className="space-y-3.5">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-amber-400/25 backdrop-blur-md shadow-sm">
          <span className="live-beacon" />
          <span className="text-[11px] font-bold text-amber-300">
            Presisi Pelayanan Masyarakat
          </span>
          <span className="text-slate-500 text-xs">·</span>
          <span className="text-[10.5px] text-slate-300">Siaga 24 Jam</span>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl xl:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Hadir Cepat, Melayani Tulus,{' '}
            <span className="gold-gradient-text">Masyarakat Tenang</span>
          </h1>
          <p className="text-xs xl:text-sm text-slate-300 leading-relaxed max-w-xl">
            Sistem Monitoring Polisi Bersama Masyarakat (SIMOPMAS 110) menghadirkan pelayanan
            kepolisian yang cepat, humanis, dan akuntabel di setiap sudut wilayah hukum.
          </p>
        </div>
      </div>

      {/* 3 Humanis Pillars of Public Service */}
      <div className="space-y-2.5 pt-1">
        <div className="service-pillar-card flex items-start gap-3.5 group">
          <div className="w-9 h-9 rounded-xl bg-amber-400/15 text-amber-300 border border-amber-400/30 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
            <HeartHandshake size={18} />
          </div>
          <div className="space-y-0.5 min-w-0">
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <span>Respon Cepat &amp; Empati Lapangan</span>
              <span className="text-[9.5px] font-bold px-2 py-0.2 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                &lt; 10 MENIT
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Petugas hadir segera di samping warga saat membutuhkan pertolongan, mengedepankan
              sikap ramah, santun, dan solutif.
            </p>
          </div>
        </div>

        <div className="service-pillar-card flex items-start gap-3.5 group">
          <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-300 border border-blue-500/30 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
            <Users size={18} />
          </div>
          <div className="space-y-0.5 min-w-0">
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <span>Kamtibmas Aman &amp; Patroli Dialogis</span>
              <span className="text-[9.5px] font-bold px-2 py-0.2 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30">
                KONDUSIF
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Patroli presisi terpadu dan sambang warga secara berkala guna memelihara rasa aman,
              ketenteraman, dan kedekatan bersama masyarakat.
            </p>
          </div>
        </div>

        <div className="service-pillar-card flex items-start gap-3.5 group">
          <div className="w-9 h-9 rounded-xl bg-amber-400/15 text-amber-300 border border-amber-400/30 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
            <ShieldCheck size={18} />
          </div>
          <div className="space-y-0.5 min-w-0">
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <span>Transparansi &amp; Kepuasan Warga (IKM)</span>
              <span className="text-[9.5px] font-bold px-2 py-0.2 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30">
                AKUNTABEL
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Hasil penanganan tugas terbuka dan dinilai langsung oleh pelapor melalui indeks
              kepuasan masyarakat yang terukur.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Value Stats */}
      <div className="grid grid-cols-3 gap-3 pt-1">
        <div className="p-3.5 rounded-2xl bg-white/[0.025] border border-white/5 space-y-0.5">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Kesiagaan Pelayanan
          </div>
          <div className="text-base font-extrabold text-emerald-400">
            24 Jam Nonstop
          </div>
          <div className="text-[9.5px] text-slate-400 truncate">Piket Siaga Tergelar</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white/[0.025] border border-white/5 space-y-0.5">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Target Respon Tiba
          </div>
          <div className="text-base font-extrabold text-amber-300">
            &lt; 10 Menit
          </div>
          <div className="text-[9.5px] text-slate-400 truncate">Prioritas Utama Warga</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white/[0.025] border border-white/5 space-y-0.5">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Akuntabilitas IKM
          </div>
          <div className="text-base font-extrabold text-sky-400">
            Terbuka &amp; Dinilai
          </div>
          <div className="text-[9.5px] text-slate-400 truncate">Ulasan Nyata Pelapor</div>
        </div>
      </div>
    </div>
  );
}
