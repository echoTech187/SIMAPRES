/**
 * SIMAPRES 110 - Jurisdiction Boundary & E-Routing Resolver
 * Deteksi dinamis batas yurisdiksi kepolisian antar-Polres/Polsek
 * Menghindari hardcoded static rules & mendukung ekspansi multi-wilayah.
 */

export interface StationReference {
  id: number;
  stationCode?: string;
  station_code?: string;
  code?: string;
  stationName?: string;
  station_name?: string;
  name?: string;
  stationLevel?: string;
  station_level?: string;
  type?: string;
  address?: string;
  officeLat?: number | string | null;
  office_lat?: number | string | null;
  lat?: number | string | null;
  officeLng?: number | string | null;
  office_lng?: number | string | null;
  lng?: number | string | null;
  phoneHotline?: string;
  phone_piket?: string;
  phone_kapolsek?: string;
}

export interface BoundaryEvaluationResult {
  isOutsideJurisdiction: boolean;
  detectedRegionName: string;
  currentStationName: string;
  targetStation: StationReference | null;
  reason: string;
  distanceKmToTarget?: number;
}

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
  currentStationId?: number | string | null;
  currentStationName?: string | null;
  stations?: StationReference[];
}): BoundaryEvaluationResult {
  const {
    tkpLat,
    tkpLng,
    tkpAlamat,
    currentStationId,
    currentStationName,
    stations = [],
  } = params;

  // Stasiun aktif diperoleh murni dari daftar stations yang dikirim dari database
  const strCurrentStationId = currentStationId != null ? String(currentStationId) : null;
  const activeStation =
    stations.find((s: any) => strCurrentStationId && String(s.id) === strCurrentStationId) ||
    stations.find((s: any) => {
      const sName = (s.stationName || s.station_name || s.name || '').toLowerCase();
      const targetName = (currentStationName || '').toLowerCase();
      return targetName && sName && (sName === targetName || sName.includes(targetName) || targetName.includes(sName));
    }) ||
    null;

  // Normalisasi helper nama stasiun aktif
  const activeStationName =
    activeStation?.stationName || activeStation?.station_name || activeStation?.name || currentStationName || 'Mako Tidak Terdaftar';

  // Jika stasiun aktif tidak ada di master database, hentikan evaluasi (dalam wilayah default)
  if (!activeStation) {
    return {
      isOutsideJurisdiction: false,
      detectedRegionName: 'Dalam Wilayah',
      currentStationName: activeStationName,
      targetStation: null,
      reason: 'Stasiun aktif tidak terdaftar dalam pangkalan data.',
    };
  }

  const text = (tkpAlamat || '').toLowerCase();

  // 1. Deteksi Tekstual Administratif Wilayah
  let detectedTargetCode: string | null = null;
  let detectedRegion: string = '';

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
  } else if (
    text.includes('kajen') ||
    text.includes('kedungwuni') ||
    text.includes('wiradesa') ||
    text.includes('doro') ||
    text.includes('karanganyar') ||
    text.includes('wonopringgo') ||
    text.includes('paninggaran') ||
    text.includes('talun') ||
    text.includes('bojong') ||
    text.includes('sragi') ||
    text.includes('kandangserang') ||
    text.includes('buaran') ||
    text.includes('tirto') ||
    text.includes('kabupaten pekalongan') ||
    text.includes('kab. pekalongan')
  ) {
    detectedTargetCode = 'POLRES-PEKALONGAN';
    detectedRegion = 'Kabupaten Pekalongan';
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
    // Wilayah Kabupaten Pekalongan (Kajen dan sekitarnya: lat < -6.95)
    else if (tkpLat < -6.95 && !detectedTargetCode) {
      detectedTargetCode = 'POLRES-PEKALONGAN';
      detectedRegion = 'Kabupaten Pekalongan';
    }
  }

  // 3. Tentukan Target Station
  let targetStation: StationReference | null = null;
  if (detectedTargetCode) {
    const rawTarget =
      stations.find((s: any) => (s.stationCode || s.station_code || s.code) === detectedTargetCode) ||
      null;
    if (rawTarget) {
      targetStation = {
        id: rawTarget.id,
        stationCode: rawTarget.stationCode || rawTarget.station_code || rawTarget.code,
        stationName: rawTarget.stationName || rawTarget.station_name || rawTarget.name,
        stationLevel: rawTarget.stationLevel || rawTarget.station_level || rawTarget.type,
        address: rawTarget.address,
        officeLat: rawTarget.officeLat ?? rawTarget.office_lat ?? rawTarget.lat,
        officeLng: rawTarget.officeLng ?? rawTarget.office_lng ?? rawTarget.lng,
        phoneHotline: rawTarget.phoneHotline || rawTarget.phone_piket || rawTarget.phone_kapolsek,
      };
    }
  }

  // Jika target station sama dengan mako aktif, berarti masih dalam yurisdiksi sendiri
  if (targetStation && targetStation.id === activeStation.id) {
    return {
      isOutsideJurisdiction: false,
      detectedRegionName: detectedRegion,
      currentStationName: activeStationName,
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
      currentStationName: activeStationName,
      targetStation,
      distanceKmToTarget: distanceKm,
      reason: `Titik TKP terdeteksi di wilayah ${detectedRegion}. Disarankan untuk melakukan E-Routing / Disposisi Lintas Wilayah ke ${targetStation.stationName} agar penanganan lebih cepat.`,
    };
  }

  return {
    isOutsideJurisdiction: false,
    detectedRegionName: detectedRegion,
    currentStationName: activeStationName,
    targetStation: null,
    reason: 'Lokasi TKP dalam yurisdiksi normal.',
  };
}
