/**
 * SIMAPRES 110 - Jurisdiction Boundary & E-Routing Resolver
 * Deteksi dinamis batas yurisdiksi kepolisian antar-Polres/Polsek
 * Menghindari hardcoded static rules & mendukung ekspansi multi-wilayah.
 */

export interface StationReference {
  id: number;
  stationCode: string;
  stationName: string;
  stationLevel?: string;
  address?: string;
  officeLat?: number | string | null;
  officeLng?: number | string | null;
  phoneHotline?: string;
}

export interface BoundaryEvaluationResult {
  isOutsideJurisdiction: boolean;
  detectedRegionName: string;
  currentStationName: string;
  targetStation: StationReference | null;
  reason: string;
  distanceKmToTarget?: number;
}

// Fallback koordinat pusat & stasiun tetangga resmi Jawa Tengah / Pantura
export const DEFAULT_STATION_REFERENCES: StationReference[] = [
  {
    id: 60001,
    stationCode: 'POLRES-PEKALONGAN',
    stationName: 'Polres Pekalongan',
    stationLevel: 'POLRES',
    address: 'Jl. Rinjani No.1, Kajen, Kab. Pekalongan',
    officeLat: -7.026779,
    officeLng: 109.59308,
    phoneHotline: '0285-381110',
  },
  {
    id: 90001,
    stationCode: 'POLRES_PEKALONGAN_KOTA',
    stationName: 'Polres Pekalongan Kota',
    stationLevel: 'POLRES',
    address: 'Jl. Diponegoro No.19, Kota Pekalongan',
    officeLat: -6.881372,
    officeLng: 109.671882,
    phoneHotline: '0285-422110',
  },
  {
    id: 210001,
    stationCode: 'POLRESTA_BATANG',
    stationName: 'Polresta Batang',
    stationLevel: 'POLRES',
    address: 'Jl. Gajah Mada No.200, Batang',
    officeLat: -6.91854,
    officeLng: 109.72968,
    phoneHotline: '0285-391110',
  },
];

/**
 * Menghitung jarak Haversine (km) antara 2 titik koordinat
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Radius bumi (km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

/**
 * Evaluasi apakah TKP berada di luar yurisdiksi stasiun mako aktif
 */
export function evaluateJurisdictionBoundary(params: {
  tkpLat?: number | null;
  tkpLng?: number | null;
  tkpAlamat?: string | null;
  currentStationId?: number | null;
  currentStationName?: string | null;
  stations?: StationReference[];
}): BoundaryEvaluationResult {
  const {
    tkpLat,
    tkpLng,
    tkpAlamat,
    currentStationId = 60001,
    currentStationName = 'Polres Pekalongan',
    stations = DEFAULT_STATION_REFERENCES,
  } = params;

  const text = (tkpAlamat || '').toLowerCase();
  const activeStation =
    stations.find((s) => s.id === currentStationId) ||
    stations.find((s) => s.stationName.toLowerCase() === (currentStationName || '').toLowerCase()) ||
    DEFAULT_STATION_REFERENCES[0];

  // 1. Deteksi Tekstual Administratif Wilayah
  let detectedTargetCode: string | null = null;
  let detectedRegion = 'Kabupaten Pekalongan';

  if (
    text.includes('batang') ||
    text.includes('warungasem') ||
    text.includes('gringsing') ||
    text.includes('subah') ||
    text.includes('limpung') ||
    text.includes('bandar batang') ||
    text.includes('banyuputih') ||
    text.includes('tulis batang')
  ) {
    detectedTargetCode = 'POLRESTA_BATANG';
    detectedRegion = 'Kabupaten Batang';
  } else if (
    text.includes('kota pekalongan') ||
    text.includes('pekalongan barat') ||
    text.includes('pekalongan timur') ||
    text.includes('pekalongan utara') ||
    text.includes('pekalongan selatan') ||
    text.includes('krapyak') ||
    text.includes('bendan') ||
    text.includes('panjang wetan') ||
    text.includes('medono')
  ) {
    detectedTargetCode = 'POLRES_PEKALONGAN_KOTA';
    detectedRegion = 'Kota Pekalongan';
  } else if (
    text.includes('pemalang') ||
    text.includes('comal') ||
    text.includes('petarukan') ||
    text.includes('ulujami')
  ) {
    detectedTargetCode = 'POLRES_PEMALANG';
    detectedRegion = 'Kabupaten Pemalang';
  }

  // 2. Deteksi Koordinat GPS (Jika alamat tidak eksplisit atau konfirmasi jarak)
  const validLat = typeof tkpLat === 'number' && !isNaN(tkpLat) && tkpLat !== 0;
  const validLng = typeof tkpLng === 'number' && !isNaN(tkpLng) && tkpLng !== 0;

  if (validLat && validLng) {
    // Wilayah Batang (Pantura Timur Pekalongan: lng > 109.705)
    if (tkpLng > 109.715 && !detectedTargetCode) {
      detectedTargetCode = 'POLRESTA_BATANG';
      detectedRegion = 'Kabupaten Batang (Perbatasan Timur)';
    }
    // Wilayah Kota Pekalongan Utara/Pusat (sekitar -6.88, 109.67)
    else if (tkpLat > -6.905 && tkpLng > 109.655 && tkpLng < 109.710 && !detectedTargetCode) {
      detectedTargetCode = 'POLRES_PEKALONGAN_KOTA';
      detectedRegion = 'Kota Pekalongan';
    }
    // Wilayah Pemalang Barat (lng < 109.520)
    else if (tkpLng < 109.520 && !detectedTargetCode) {
      detectedTargetCode = 'POLRES_PEMALANG';
      detectedRegion = 'Kabupaten Pemalang (Perbatasan Barat)';
    }
  }

  // 3. Tentukan Target Station
  let targetStation: StationReference | null = null;
  if (detectedTargetCode) {
    targetStation =
      stations.find((s) => s.stationCode === detectedTargetCode) ||
      DEFAULT_STATION_REFERENCES.find((s) => s.stationCode === detectedTargetCode) ||
      null;
  }

  // Jika target station sama dengan mako aktif, berarti masih dalam yurisdiksi sendiri
  if (targetStation && targetStation.id === activeStation.id) {
    return {
      isOutsideJurisdiction: false,
      detectedRegionName: detectedRegion,
      currentStationName: activeStation.stationName,
      targetStation: null,
      reason: 'Lokasi TKP berada dalam wilayah hukum mako aktif.',
    };
  }

  // Jika terdeteksi di luar wilayah stasiun saat ini
  if (targetStation) {
    let distanceKm: number | undefined;
    if (validLat && validLng && targetStation.officeLat && targetStation.officeLng) {
      distanceKm = calculateHaversineDistanceKm(
        tkpLat!,
        tkpLng!,
        Number(targetStation.officeLat),
        Number(targetStation.officeLng)
      );
    }

    return {
      isOutsideJurisdiction: true,
      detectedRegionName: detectedRegion,
      currentStationName: activeStation.stationName,
      targetStation,
      distanceKmToTarget: distanceKm,
      reason: `Titik TKP terdeteksi di wilayah ${detectedRegion}. Disarankan untuk melakukan E-Routing / Disposisi Lintas Wilayah ke ${targetStation.stationName} agar penanganan lebih cepat.`,
    };
  }

  return {
    isOutsideJurisdiction: false,
    detectedRegionName: detectedRegion,
    currentStationName: activeStation.stationName,
    targetStation: null,
    reason: 'Lokasi TKP dalam yurisdiksi normal.',
  };
}
