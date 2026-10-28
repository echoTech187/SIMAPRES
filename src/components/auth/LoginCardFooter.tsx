import React from 'react';
import Link from 'next/link';
import { Shield } from 'lucide-react';

export default function LoginCardFooter() {
  return (
    <div className="pt-4 border-t border-white/10 space-y-2.5 text-center">
      <div>
        <Link
          href="/tracking"
          className="inline-flex items-center gap-1.5 text-amber-300 hover:text-amber-200 font-semibold transition-colors hover:underline text-xs"
        >
          <span>Masyarakat / Pelapor? Lacak status aduan Anda di sini</span>
          <span className="text-amber-400">➔</span>
        </Link>
      </div>

      <div className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
        <Shield size={12} className="text-amber-400 flex-shrink-0" />
        <span>Melindungi, Mengayomi, dan Melayani dengan Presisi.</span>
      </div>
    </div>
  );
}
