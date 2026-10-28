import React from 'react';
import BrandIdentity from '@/components/common/BrandIdentity';
import LiveOperationalClock from '@/components/common/LiveOperationalClock';

export default function LoginHeader() {
  return (
    <header className="w-full border-b border-white/10 bg-[#0B111E]/90 backdrop-blur-xl z-20 sticky top-0 flex-shrink-0">
      <div className="max-w-7xl mx-auto px-4 py-2.5 sm:py-3 flex items-center justify-between gap-3">
        {/* Brand Identitas Instansi */}
        <BrandIdentity />

        {/* Status Piket & Jam Operasional Live WIB */}
        <LiveOperationalClock />
      </div>
    </header>
  );
}
