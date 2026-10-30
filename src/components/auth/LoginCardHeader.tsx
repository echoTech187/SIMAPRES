import React from 'react';

interface LoginCardHeaderProps {
  greeting: string;
}

export default function LoginCardHeader({ greeting }: LoginCardHeaderProps) {
  return (
    <>
      {/* Terminal Card Header */}
      <div className="flex items-center gap-3.5 pb-4 border-b border-white/10">
        <div className="w-20 h-20 flex-shrink-0">
          <img
            src="/logo_simopmas.png"
            alt="Logo SIMOPMAS 110"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="text-[10.5px] font-semibold text-amber-300 tracking-wide uppercase flex items-center gap-1.5">
              <span>SIMOPMAS 110</span>
              <span className="text-slate-600">·</span>
              <span>PRESISI</span>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-500/25 px-2.5 py-0.5 rounded-full whitespace-nowrap shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              End-to-End Encryption Active
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-white leading-tight">
            {greeting}, Rekan Petugas
          </h2>
          <p className="text-[11.5px] text-slate-400 truncate">
            Silakan masuk untuk memulai giliran tugas dinas.
          </p>
        </div>
      </div>

      {/* Mobile-Only Info Pill */}
      <div className="lg:hidden mt-3 p-2.5 rounded-2xl bg-amber-400/[0.08] border border-amber-400/20 flex items-center justify-between text-xs">
        <span className="text-amber-300 font-medium flex items-center gap-2">
          <span className="live-beacon" />
          Siaga Pelayanan 110
        </span>
        <span className="text-slate-300 text-[10px]">Target Respon &lt; 10 Menit</span>
      </div>
    </>
  );
}
