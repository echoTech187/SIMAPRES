'use client';

/**
 * MasterDataManager — THIN ROUTER
 *
 * File ini sebelumnya ~2.750 baris (monolitik). Sekarang hanya ~80 baris.
 * Semua logika CRUD, form fields, dan tabel sudah dipindah ke:
 *   src/components/console/master/tabs/Tab*.tsx
 *
 * Cara menambah tab baru:
 *   1. Buat TabNama.tsx di folder tabs/
 *   2. Import di sini dan tambahkan ke switch/case di bawah
 *   3. Tambahkan type ke MasterTabType di bawah
 */

import React from 'react';
import { getAllMasterLookupsBundleAction } from '@/app/actions/master.actions';
import { useState, useEffect, useRef } from 'react';

// Tab Components
import TabPangkat from './tabs/TabPangkat';
import TabSatuan from './tabs/TabSatuan';
import TabRole from './tabs/TabRole';
import TabStation from './tabs/TabStation';
import TabArmada from './tabs/TabArmada';
import TabHotspot from './tabs/TabHotspot';
import TabHotspotKategori from './tabs/TabHotspotKategori';
import TabKategori from './tabs/TabKategori';
import TabSubkategori from './tabs/TabSubkategori';
import TabDuty from './tabs/TabDuty';
import TabLokasiPenyelesaian from './tabs/TabLokasiPenyelesaian';
import TabDokumenPenyelesaian from './tabs/TabDokumenPenyelesaian';
import TabKnowledgeFaq from './tabs/TabKnowledgeFaq';
import TabFuelType from './tabs/TabFuelType';
import TabFuelClaimStatus from './tabs/TabFuelClaimStatus';
import TabAuditBbm from './tabs/TabAuditBbm';

// Shared Types
import type { MasterLookups, MasterTabType } from './tabs/types';

export type { MasterTabType };

interface MasterDataManagerProps {
  activeTab: MasterTabType;
  onRefreshDropdowns?: () => void;
  showToast: (msg: string) => void;
}

export default function MasterDataManager({
  activeTab,
  onRefreshDropdowns,
  showToast,
}: MasterDataManagerProps) {
  const lookupsLoadedRef = useRef(false);
  const [lookups, setLookups] = useState<MasterLookups>({
    categoriesList: [],
    unitsList: [],
    hotspotCategoriesList: [],
    dangerLevelsList: [],
    stationLevelsList: [],
    urgencyLevelsList: [],
    vehicleTypesList: [],
    vehicleStatusesList: [],
  });

  // Load all dropdown lookups once on first mount (single bundled query)
  useEffect(() => {
    if (lookupsLoadedRef.current) return;
    lookupsLoadedRef.current = true;

    getAllMasterLookupsBundleAction().then((res) => {
      if (res?.success && res?.data) {
        setLookups({
          categoriesList: res.data.categories ?? [],
          unitsList: res.data.units ?? [],
          hotspotCategoriesList: res.data.hotspotCategories ?? [],
          dangerLevelsList: res.data.dangerLevels ?? [],
          stationLevelsList: res.data.stationLevels ?? [],
          urgencyLevelsList: res.data.urgencyLevels ?? [],
          vehicleTypesList: res.data.vehicleTypes ?? [],
          vehicleStatusesList: res.data.vehicleStatuses ?? [],
        });
      }
    });
  }, []);

  const tabProps = { lookups, showToast, onRefreshDropdowns };

  switch (activeTab) {
    case 'pangkat':          return <TabPangkat {...tabProps} />;
    case 'satuan':           return <TabSatuan {...tabProps} />;
    case 'role':             return <TabRole {...tabProps} />;
    case 'station':          return <TabStation {...tabProps} />;
    case 'armada':           return <TabArmada {...tabProps} />;
    case 'hotspot':          return <TabHotspot {...tabProps} />;
    case 'hotspot_cat':      return <TabHotspotKategori {...tabProps} />;
    case 'kategori':         return <TabKategori {...tabProps} />;
    case 'subkategori':      return <TabSubkategori {...tabProps} />;
    case 'duty':             return <TabDuty {...tabProps} />;
    case 'lokasi_penyelesaian':   return <TabLokasiPenyelesaian {...tabProps} />;
    case 'dokumen_penyelesaian':  return <TabDokumenPenyelesaian {...tabProps} />;
    case 'knowledge_faq':         return <TabKnowledgeFaq {...tabProps} />;
    case 'fuel_type':             return <TabFuelType {...tabProps} />;
    case 'fuel_claim_status':     return <TabFuelClaimStatus {...tabProps} />;
    case 'audit_bbm':             return <TabAuditBbm {...tabProps} />;
    default:
      return (
        <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8', fontSize: '14px' }}>
          Tab tidak ditemukan: <code>{activeTab}</code>
        </div>
      );
  }
}
