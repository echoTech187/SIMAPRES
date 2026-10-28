import React from 'react';

export default function LoginFooter() {
  return (
    <footer className="w-full border-t border-white/10 bg-[#0B111E]/90 backdrop-blur-xl z-20 py-2.5 px-4 flex-shrink-0">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1 sm:gap-2 text-center sm:text-left text-[10.5px] text-slate-400">
        <div>
          &copy; 2026 Kepolisian Negara Republik Indonesia · SIMOPMAS 110 Presisi
        </div>
        <div className="flex items-center justify-center gap-2.5 text-slate-400 text-[10px]">
          <span>Divisi TIK Polri</span>
          <span>·</span>
          <span className="text-emerald-400 flex items-center gap-1 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Sistem Pelayanan Aktif
          </span>
        </div>
      </div>
    </footer>
  );
}
