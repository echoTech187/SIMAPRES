'use client';

import React from 'react';
import TabProfilSuperadmin from './TabProfilSuperadmin';

export interface TabProfilPawasProps {
  currentUser: any;
  setCurrentUser: React.Dispatch<React.SetStateAction<any>>;
  totalLaporan?: number;
  selesaiCount?: number;
  responCepatPct?: string;
  allRecentComplaints?: any[];
  showToast: (msg: string) => void;
  onBackToBeranda?: () => void;
  onLogout?: () => void;
  presensiStatus?: 'SUDAH_MASUK' | 'BELUM_MASUK' | 'SUDAH_PULANG';
  setPresensiStatus?: React.Dispatch<React.SetStateAction<any>>;
  jamMasukPiket?: string;
  setJamMasukPiket?: React.Dispatch<React.SetStateAction<string>>;
  jamPulangPiket?: string;
  setJamPulangPiket?: React.Dispatch<React.SetStateAction<string>>;
  onOpenPresensiPulangModal?: () => void;
  units?: any[];
  policeOffices?: any[];
  makoTitle?: string;
  makoRadius?: number;
}

export default function TabProfilPawas({
  currentUser,
  setCurrentUser,
  totalLaporan = 0,
  selesaiCount = 0,
  responCepatPct,
  allRecentComplaints = [],
  showToast,
  onLogout,
  presensiStatus,
  setPresensiStatus,
  jamMasukPiket,
  setJamMasukPiket,
  jamPulangPiket,
  setJamPulangPiket,
  units = [],
  policeOffices = [],
  makoTitle,
  makoRadius,
}: TabProfilPawasProps) {
  // Resolve real mako station from policeOffices or currentUser
  const userStation = React.useMemo(() => {
    if (policeOffices && policeOffices.length > 0) {
      if (currentUser?.stationId || currentUser?.station_id) {
        const found = policeOffices.find(
          (p: any) => p.id === (currentUser.stationId || currentUser.station_id)
        );
        if (found) return found;
      }
      if (currentUser?.satuanNama) {
        const found = policeOffices.find(
          (p: any) =>
            (p.name && p.name.toLowerCase().includes(currentUser.satuanNama.toLowerCase())) ||
            (currentUser.satuanNama && currentUser.satuanNama.toLowerCase().includes(p.name?.toLowerCase()))
        );
        if (found) return found;
      }
      return policeOffices[0];
    }
    return null;
  }, [policeOffices, currentUser]);

  const resolvedMakoTitle =
    makoTitle ||
    userStation?.name ||
    currentUser?.stationName ||
    currentUser?.satuanNama ||
    currentUser?.unit ||
    'POLRES METRO JAKARTA SELATAN';

  const resolvedMakoRadius =
    makoRadius ||
    userStation?.radius ||
    userStation?.telemetri ||
    1000;

  return (
    <TabProfilSuperadmin
      currentUser={currentUser}
      setCurrentUser={setCurrentUser}
      units={units}
      counters={{
        totalLaporan,
        selesaiCount,
        vehicles: units.length,
        stations: policeOffices.length > 0 ? policeOffices.length : 1,
      }}
      complaints={allRecentComplaints}
      showToast={showToast}
      onLogout={onLogout || (() => {})}
      roleBadge="PAWAS"
      roleTitle={currentUser?.jabatan || "Perwira Pengawas (PAWAS) • Posko Pengendalian"}
      makoTitle={resolvedMakoTitle}
      makoRadius={resolvedMakoRadius}
      responCepatPct={responCepatPct}
      policeOffices={policeOffices}
      presensiStatus={presensiStatus}
      setPresensiStatus={setPresensiStatus}
      jamMasukPiket={jamMasukPiket}
      setJamMasukPiket={setJamMasukPiket}
      jamPulangPiket={jamPulangPiket}
      setJamPulangPiket={setJamPulangPiket}
    />
  );
}
