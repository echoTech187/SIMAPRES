'use client';

import { useState, useCallback, useMemo } from 'react';

interface UsePawasFiltersParams {
  allRecentComplaints: any[];
  dbCategories: any[];
  dbSubcategories: any[];
  dbPlatforms: any[];
  dbGiats: any[];
  dbStatuses: any[];
  dbUrgencyLevels: any[];
  setActiveTab: (tab: string) => void;
}

/**
 * usePawasFilters
 * Single-responsibility hook managing filtering, classification, and status badges for Pawas Console.
 */
export function usePawasFilters({
  allRecentComplaints,
  dbCategories,
  dbSubcategories,
  dbPlatforms,
  dbGiats,
  dbStatuses,
  dbUrgencyLevels,
  setActiveTab,
}: UsePawasFiltersParams) {
  const [valFilterStatus, setValFilterStatus] = useState<string>('semua');
  const [valFilterPlatform, setValFilterPlatform] = useState<string>('all');
  const [valFilterKategori, setValFilterKategori] = useState<string>('all');
  const [selectedValComplaint, setSelectedValComplaint] = useState<any | null>(null);

  const isComplaintRejected = useCallback((c: any) => {
    if (c?.status === 'DITOLAK') return true;
    if (c?.tahap_revisi === true) return true;
    const ket = (c?.ringkasanKeterangan || '').toUpperCase();
    return ket.includes('[DITOLAK PAWAS]') || ket.includes('[REVISI PAWAS]') || ket.includes('DITOLAK PAWAS');
  }, []);

  const resolveComplaintStatus = useCallback((rawStatus?: string | null, isRejected?: boolean) => {
    const s = (rawStatus || '').toUpperCase().trim();
    const targetKey = isRejected || s === 'DITOLAK'
      ? 'DITOLAK'
      : s === 'SELESAI'
      ? 'SELESAI'
      : s === 'MENUNGGU_PENGESAHAN'
      ? 'MENUNGGU_PENGESAHAN'
      : s === 'DIPROSES'
      ? 'DIPROSES'
      : 'MENUNGGU';

    const dbItem = dbStatuses.find(
      (item) => item.key?.toUpperCase() === targetKey
    );

    const statusTheme: Record<string, { bg: string; color: string; border: string }> = {
      DITOLAK: { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' },
      SELESAI: { bg: '#ECFDF5', color: '#059669', border: '#A7F3D0' },
      MENUNGGU_PENGESAHAN: { bg: '#FAF5FF', color: '#7C3AED', border: '#DDD6FE' },
      DIPROSES: { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' },
      MENUNGGU: { bg: '#FFFBEB', color: '#D97706', border: '#FDE68A' },
    };

    const resolvedKey = dbItem ? dbItem.key.toUpperCase() : targetKey;
    const theme = statusTheme[resolvedKey] || { bg: '#F1F5F9', color: '#475569', border: '#CBD5E1' };
    const cleanLabel = dbItem?.label || (resolvedKey === 'DIPROSES' ? 'Sedang Ditangani' : resolvedKey === 'MENUNGGU' ? 'Menunggu Disposisi' : resolvedKey);

    return {
      id: dbItem?.id ?? 0,
      key: resolvedKey,
      label: cleanLabel,
      badge_color: theme.color,
      badge_bg: theme.bg,
      badge_border: theme.border,
      display_order: dbItem?.display_order ?? 1,
      icon: '',
    };
  }, [dbStatuses]);

  const matchesStatus = useCallback((c: any, status: string) => {
    if (!status || status === 'semua') return true;
    const isRejected = isComplaintRejected(c);
    const meta = resolveComplaintStatus(c?.status, isRejected);
    const stUpper = status.toUpperCase().trim();

    if (stUpper === meta.key) return true;
    if (stUpper === 'DIPROSES') {
      return meta.key === 'DIPROSES';
    }
    if (stUpper === 'MENUNGGU') {
      return meta.key === 'MENUNGGU';
    }
    return false;
  }, [isComplaintRejected, resolveComplaintStatus]);

  const resolveUrgencyLevel = useCallback((rawUrgensi?: string | null) => {
    const u = (rawUrgensi || '').toUpperCase().trim();
    if (dbUrgencyLevels.length > 0) {
      const found = dbUrgencyLevels.find(
        (lvl: any) => lvl.key?.toUpperCase() === u || lvl.label?.toUpperCase() === u
      );
      if (found) {
        return {
          key: found.key,
          label: found.label
        };
      }
    }
    return {
      key: u,
      label: u,
    };
  }, [dbUrgencyLevels]);

  const getComplaintPlatform = useCallback((c: any) => {
    if (c?.platformKey) return c.platformKey;
    if (c?.platformRel?.key) return c.platformRel.key;
    if (c?.saluranLaporan) return c.saluranLaporan;
    return '-';
  }, []);

  const matchesPlatform = useCallback((c: any, platform: string) => {
    if (platform === 'all') return true;
    return getComplaintPlatform(c) === platform;
  }, [getComplaintPlatform]);

  const getComplaintKategoriInfo = useCallback((c: any) => {
    const cleanNoEmoji = (str: string) => (str || '').replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();

    const getSafeCategoryStyle = (key?: string, dbBg?: string, dbColor?: string, dbBorder?: string) => {
      if (dbBg && dbColor) {
        return {
          background: dbBg,
          color: dbColor,
          border: `1px solid ${dbBorder || 'transparent'}`,
        };
      }
      return { background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE' };
    };

    const sub = c?.subcategory || c?.subcategory_rel;
    if (sub) {
      const subCat = sub.category_rel || dbCategories.find((cat: any) => cat.key === sub.category_key || cat.id === sub.category_id);
      if (subCat) {
        const rawLabel = sub.nama_kasus || subCat.label || subCat.key || '';
        const badgeText = cleanNoEmoji(rawLabel) || rawLabel;
        return {
          key: subCat.key,
          kategori: rawLabel,
          label: rawLabel,
          subKasus: sub.nama_kasus,
          subUnitKey: sub.unit_key,
          badgeText,
          badgeStyle: getSafeCategoryStyle(subCat.key, subCat.badge_bg, subCat.badge_color, subCat.badge_border),
        };
      }
    }

    const rel = c?.kategoriRel || c?.category_rel;
    if (rel) {
      const rawLabel = rel.label || rel.key || '';
      const badgeText = cleanNoEmoji(rawLabel) || rawLabel;
      return {
        key: rel.key,
        kategori: rawLabel,
        label: rawLabel,
        badgeText,
        badgeStyle: getSafeCategoryStyle(rel.key, rel.badge_bg, rel.badge_color, rel.badge_border),
      };
    }

    const targetId = c?.category_id || c?.kategoriId;
    if (targetId && dbCategories.length > 0) {
      const foundById = dbCategories.find((cat: any) => cat.id === targetId);
      if (foundById) {
        const rawLabel = foundById.label || foundById.key || '';
        const badgeText = cleanNoEmoji(rawLabel) || rawLabel;
        return {
          key: foundById.key,
          kategori: rawLabel,
          label: rawLabel,
          badgeText,
          badgeStyle: getSafeCategoryStyle(foundById.key, foundById.badge_bg, foundById.badge_color, foundById.badge_border),
        };
      }
    }

    const rawKey = (c?.kategoriKey || c?.kategori_key || '').toUpperCase();
    if (rawKey && dbCategories.length > 0) {
      const foundByKey = dbCategories.find((cat: any) => cat.key.toUpperCase() === rawKey || cat.label.toUpperCase() === rawKey);
      if (foundByKey) {
        const rawLabel = foundByKey.label || foundByKey.key || '';
        const badgeText = cleanNoEmoji(rawLabel) || rawLabel;
        return {
          key: foundByKey.key,
          kategori: rawLabel,
          label: rawLabel,
          badgeText,
          badgeStyle: getSafeCategoryStyle(foundByKey.key, foundByKey.badge_bg, foundByKey.badge_color, foundByKey.badge_border),
        };
      }
    }

    const platform = getComplaintPlatform(c);
    if (platform === 'personel' && dbGiats.length > 0) {
      const textGiat = `${c?.jenisAksi || ''} ${c?.jenisKejadian || ''} ${c?.ringkasanKeterangan || ''}`.toUpperCase();
      const foundGiat = dbGiats.find((g: any) => textGiat.includes((g.key || '').toUpperCase()) || textGiat.includes((g.label || '').toUpperCase()));
      if (foundGiat) {
        const rawLabel = foundGiat.label || foundGiat.key;
        const badgeText = cleanNoEmoji(rawLabel) || rawLabel;
        return {
          key: foundGiat.key,
          kategori: rawLabel,
          label: rawLabel,
          badgeText,
          badgeStyle: getSafeCategoryStyle(foundGiat.key, foundGiat.badge_bg, foundGiat.badge_color, foundGiat.badge_border),
        };
      }
    }

    const jenis = (c?.jenisKejadian || '').toLowerCase();
    const katLaporan = (c?.kategoriLaporan || '').toLowerCase();
    const combined = `${jenis} ${katLaporan}`;
    const ringkasan = (c?.ringkasanKeterangan || '').toLowerCase();

    if (dbSubcategories.length > 0) {
      const matchedSub = dbSubcategories.find((s: any) => {
        const subName = (s.nama_kasus || '').toLowerCase();
        return combined.includes(subName) || ringkasan.includes(subName) || subName.includes(jenis);
      });
      if (matchedSub) {
        const subCat = matchedSub.category_rel || dbCategories.find((cat: any) => cat.key === matchedSub.category_key || cat.id === matchedSub.category_id);
        if (subCat) {
          const rawLabel = subCat.label || subCat.key || '';
          const badgeText = cleanNoEmoji(rawLabel) || rawLabel;
          return {
            key: subCat.key,
            kategori: rawLabel,
            label: rawLabel,
            subKasus: matchedSub.nama_kasus,
            subUnitKey: matchedSub.unit_key,
            badgeText,
            badgeStyle: getSafeCategoryStyle(subCat.key, subCat.badge_bg, subCat.badge_color, subCat.badge_border),
          };
        }
      }
    }

    const fallbackLabel = cleanNoEmoji(c?.kategoriLaporan || c?.jenisKejadian) || '';
    return {
      key: 'TIDAK_TERKATEGORI',
      kategori: fallbackLabel,
      label: fallbackLabel,
      badgeText: fallbackLabel,
      badgeStyle: {
        background: '#F1F5F9',
        color: '#475569',
        border: '1px solid #E2E8F0',
      },
    };
  }, [dbCategories, dbGiats, dbSubcategories, getComplaintPlatform]);

  const matchesKategori = useCallback((c: any, kategori: string) => {
    if (kategori === 'all') return true;
    const catInfo = getComplaintKategoriInfo(c);
    const target = kategori.toUpperCase().trim();
    if (catInfo.key && catInfo.key.toUpperCase() === target) return true;
    if (catInfo.label && catInfo.label.toUpperCase().includes(target)) return true;

    if (c?.category_id && dbCategories.length > 0) {
      const cat = dbCategories.find((cc: any) => cc.id === c.category_id);
      if (cat && cat.key && cat.key.toUpperCase() === target) return true;
    }

    return target === catInfo.key.toUpperCase();
  }, [getComplaintKategoriInfo, dbCategories]);

  const filterComplaintList = useCallback((
    status: string,
    platform: string,
    kategori: string,
    list: any[]
  ) => {
    return list.filter(
      (c) => matchesStatus(c, status) && matchesPlatform(c, platform) && matchesKategori(c, kategori)
    );
  }, [matchesStatus, matchesPlatform, matchesKategori]);

  const openValidasiList = useCallback((status: string, doSwitch = true) => {
    setValFilterStatus(status);
    const nextFiltered = filterComplaintList(status, valFilterPlatform, valFilterKategori, allRecentComplaints);
    if (nextFiltered.length > 0) {
      setSelectedValComplaint(nextFiltered[0]);
    } else {
      setSelectedValComplaint(null);
    }
    if (doSwitch) {
      setActiveTab('view-validasi');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [valFilterPlatform, valFilterKategori, allRecentComplaints, filterComplaintList, setActiveTab]);

  const openValidasiWithPlatform = useCallback((plat: string) => {
    setValFilterPlatform(plat);
    setValFilterKategori('all');
    const nextFiltered = filterComplaintList(valFilterStatus, plat, 'all', allRecentComplaints);
    if (nextFiltered.length > 0) {
      setSelectedValComplaint(nextFiltered[0]);
    } else {
      setSelectedValComplaint(null);
    }
    setActiveTab('view-validasi');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [valFilterStatus, allRecentComplaints, filterComplaintList, setActiveTab]);

  const handleSelectPlatformFilter = useCallback((plat: string) => {
    setValFilterPlatform(plat);
    const nextFiltered = filterComplaintList(valFilterStatus, plat, valFilterKategori, allRecentComplaints);
    if (nextFiltered.length > 0) {
      setSelectedValComplaint(nextFiltered[0]);
    } else {
      setSelectedValComplaint(null);
    }
  }, [valFilterStatus, valFilterKategori, allRecentComplaints, filterComplaintList]);

  const handleSelectKategoriFilter = useCallback((kat: string) => {
    setValFilterKategori(kat);
    const nextFiltered = filterComplaintList(valFilterStatus, valFilterPlatform, kat, allRecentComplaints);
    if (nextFiltered.length > 0) {
      setSelectedValComplaint(nextFiltered[0]);
    } else {
      setSelectedValComplaint(null);
    }
  }, [valFilterStatus, valFilterPlatform, allRecentComplaints, filterComplaintList]);

  const handleResetFilters = useCallback(() => {
    setValFilterStatus('semua');
    setValFilterPlatform('all');
    setValFilterKategori('all');
    if (allRecentComplaints.length > 0) {
      setSelectedValComplaint(allRecentComplaints[0]);
    } else {
      setSelectedValComplaint(null);
    }
  }, [allRecentComplaints]);

  const filteredValidasiComplaints = useMemo(() => {
    return filterComplaintList(valFilterStatus, valFilterPlatform, valFilterKategori, allRecentComplaints);
  }, [valFilterStatus, valFilterPlatform, valFilterKategori, allRecentComplaints, filterComplaintList]);

  // Tab Counts
  const logsForStatusTabs = useMemo(() => {
    return allRecentComplaints.filter(
      (c) => matchesPlatform(c, valFilterPlatform) && matchesKategori(c, valFilterKategori)
    );
  }, [allRecentComplaints, valFilterPlatform, valFilterKategori, matchesPlatform, matchesKategori]);

  const tabCountSemua = logsForStatusTabs.length;
  const tabCountMenunggu = logsForStatusTabs.filter((c) => matchesStatus(c, 'menunggu')).length;

  const logsForPlatform = useMemo(() => {
    return allRecentComplaints.filter(
      (c) => matchesStatus(c, valFilterStatus) && matchesKategori(c, valFilterKategori)
    );
  }, [allRecentComplaints, valFilterStatus, valFilterKategori, matchesStatus, matchesKategori]);

  const platCountAll = logsForPlatform.length;
  const platCountSos = logsForPlatform.filter((c) => matchesPlatform(c, 'sos')).length;
  const platCountWarga = logsForPlatform.filter((c) => matchesPlatform(c, 'warga')).length;
  const platCount110 = logsForPlatform.filter((c) => matchesPlatform(c, 'layanan110')).length;
  const platCountPersonel = logsForPlatform.filter((c) => matchesPlatform(c, 'personel')).length;

  const logsForKategori = useMemo(() => {
    return allRecentComplaints.filter(
      (c) => matchesStatus(c, valFilterStatus) && matchesPlatform(c, valFilterPlatform)
    );
  }, [allRecentComplaints, valFilterStatus, valFilterPlatform, matchesStatus, matchesPlatform]);

  const katCountAll = logsForKategori.length;

  return {
    valFilterStatus,
    setValFilterStatus,
    valFilterPlatform,
    setValFilterPlatform,
    valFilterKategori,
    setValFilterKategori,
    selectedValComplaint,
    setSelectedValComplaint,
    isComplaintRejected,
    resolveComplaintStatus,
    matchesStatus,
    resolveUrgencyLevel,
    getComplaintPlatform,
    matchesPlatform,
    getComplaintKategoriInfo,
    matchesKategori,
    filterComplaintList,
    openValidasiList,
    openValidasiWithPlatform,
    handleSelectPlatformFilter,
    handleSelectKategoriFilter,
    handleResetFilters,
    filteredValidasiComplaints,
    logsForStatusTabs,
    tabCountSemua,
    tabCountMenunggu,
    logsForPlatform,
    platCountAll,
    platCountSos,
    platCountWarga,
    platCount110,
    platCountPersonel,
    logsForKategori,
    katCountAll,
  };
}
