/**
 * SIMAPRES 110 - Jurisdiction Boundary & E-Routing Resolver
 * Deteksi dinamis batas yurisdiksi kepolisian antar-Polres/Polsek
 * Menghindari hardcoded static rules & mendukung ekspansi multi-wilayah.
 *
 * [LOCKED / ATURAN PERMANEN]:
 * Implementasi modul ini SUDAH FINAL dan DILARANG KERAS DIUBAH oleh agen manapun.
 * 1. Single Source of Truth: Murni data tabel database `police_stations`.
 * 2. Prioritas 1: Geospasial Haversine jarak terdekat (tkpLat, tkpLng) ke (officeLat, officeLng).
 * 3. Prioritas 2: Fallback pencocokan teks dinamis dari data address & stationName di DB.
 * 4. Tahap 3: Validasi yurisdiksi (targetStation.id === activeStation.id).
 * DILARANG menambah hardcoded string wilayah atau batas koordinat manual.
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
  if (!activeStation || stations.length === 0) {
    return {
      isOutsideJurisdiction: false,
      detectedRegionName: activeStationName,
      currentStationName: activeStationName,
      targetStation: null,
      reason: 'Stasiun aktif tidak terdaftar dalam pangkalan data.',
    };
  }

  const validLat = typeof tkpLat === 'number' && !isNaN(tkpLat) && tkpLat !== 0;
  const validLng = typeof tkpLng === 'number' && !isNaN(tkpLng) && tkpLng !== 0;

  let targetStation: StationReference | null = null;
  let distanceKmToTarget: number | undefined;

  // =========================================================================
  // PRIORITAS 1: Murni Geospasial Haversine Jarak Terdekat ke Stasiun di Database
  // =========================================================================
  if (validLat && validLng) {
    let minDistance = Infinity;
    let closest: any = null;

    for (const st of stations) {
      const sLat = Number(st.officeLat ?? st.office_lat ?? st.lat);
      const sLng = Number(st.officeLng ?? st.office_lng ?? st.lng);
      if (sLat && sLng && !isNaN(sLat) && !isNaN(sLng) && sLat !== 0) {
        const d = calculateHaversineDistanceKm(tkpLat, tkpLng, sLat, sLng);
        if (d < minDistance) {
          minDistance = d;
          closest = st;
        }
      }
    }

    if (closest) {
      targetStation = {
        id: closest.id,
        stationCode: closest.stationCode || closest.station_code || closest.code,
        stationName: closest.stationName || closest.station_name || closest.name,
        stationLevel: closest.stationLevel || closest.station_level || closest.type,
        address: closest.address,
        officeLat: closest.officeLat ?? closest.office_lat ?? closest.lat,
        officeLng: closest.officeLng ?? closest.office_lng ?? closest.lng,
        phoneHotline: closest.phoneHotline || closest.phone_piket || closest.phone_kapolsek,
      };
      distanceKmToTarget = minDistance;
    }
  }

  // =========================================================================
  // PRIORITAS 2: Fallback Tekstual Jika Koordinat GPS Kosong
  // Mengekstraksi kata kunci wilayah dari record stasiun di database
  // (misal: "Kabupaten Pekalongan", "Kota Pekalongan", "Kajen", "Batang")
  // =========================================================================
  let detectedRegionText: string | null = null;

  if (!targetStation && tkpAlamat) {
    const text = tkpAlamat.toLowerCase();

    // Buat daftar kandidat pencocokan dari seluruh stasiun yang terdaftar di database
    // tanpa hardcode statis: mengekstrak komponen wilayah dari address, stationName, atau stationCode
    const candidates: { station: any; keyword: string; regionName: string }[] = [];

    for (const st of stations) {
      const sName = (st.stationName || st.station_name || st.name || '').trim();
      const sAddr = (st.address || '').trim();

      // Ekstrak nama wilayah dari address (biasanya terpisah koma: "..., Kajen, Kab. Pekalongan" atau "..., Batang")
      const addrParts = sAddr.split(',').map((p: string) => p.trim()).filter(Boolean);

      for (const part of addrParts) {
        if (part.length >= 3) {
          const lowerPart = part.toLowerCase();
          // Jika mengandung "kab." atau "kabupaten", jadikan display name "Kabupaten ..."
          let regionDisplay = part;
          if (lowerPart.startsWith('kab. ') || lowerPart.startsWith('kab ')) {
            regionDisplay = part.replace(/^kab\.?\s+/i, 'Kabupaten ');
          } else if (!lowerPart.startsWith('kota') && !lowerPart.startsWith('kabupaten') && !lowerPart.startsWith('jl')) {
            // Jika bukan jalan atau kota, jadikan default Kabupaten jika stasiun bukan berlevel kota
            const isKotaStation = sName.toLowerCase().includes('kota');
            regionDisplay = isKotaStation ? `Kota ${part}` : `Kabupaten ${part}`;
          }

          candidates.push({
            station: st,
            keyword: lowerPart,
            regionName: regionDisplay,
          });

          // Tambahkan juga varian tanpa singkatan "kab." atau "kota"
          const cleanPart = lowerPart.replace(/^(kab\.?|kabupaten|kota)\s+/i, '').trim();
          if (cleanPart.length >= 3 && cleanPart !== lowerPart) {
            candidates.push({
              station: st,
              keyword: cleanPart,
              regionName: regionDisplay,
            });
          }
        }
      }

      // Tambahkan nama stasiun tanpa prefix kepolisian ("Polres", "Polresta", "Polsek")
      const strippedStationName = sName.replace(/^(polres(ta)?|polsek)\s+/i, '').trim();
      if (strippedStationName.length >= 3) {
        const lowerStrip = strippedStationName.toLowerCase();
        let regionDisplay = strippedStationName;
        // Jika stasiun kabupaten (misal "Pekalongan" di Polres Pekalongan)
        if (!lowerStrip.startsWith('kota') && !lowerStrip.startsWith('kabupaten')) {
          regionDisplay = `Kabupaten ${strippedStationName}`;
        }
        candidates.push({
          station: st,
          keyword: lowerStrip,
          regionName: regionDisplay,
        });
      }
    }

    // Urutkan kandidat dari keyword terpanjang ke terpendek agar token lebih spesifik dicocokkan duluan
    // Contoh: "kota pekalongan" (15 char) dicocokkan sebelum "pekalongan" (10 char)
    candidates.sort((a, b) => b.keyword.length - a.keyword.length);

    for (const cand of candidates) {
      if (text.includes(cand.keyword)) {
        targetStation = {
          id: cand.station.id,
          stationCode: cand.station.stationCode || cand.station.station_code || cand.station.code,
          stationName: cand.station.stationName || cand.station.station_name || cand.station.name,
          stationLevel: cand.station.stationLevel || cand.station.station_level || cand.station.type,
          address: cand.station.address,
          officeLat: cand.station.officeLat ?? cand.station.office_lat ?? cand.station.lat,
          officeLng: cand.station.officeLng ?? cand.station.office_lng ?? cand.station.lng,
          phoneHotline: cand.station.phoneHotline || cand.station.phone_piket || cand.station.phone_kapolsek,
        };
        detectedRegionText = cand.regionName;
        break;
      }
    }
  }

  // =========================================================================
  // TAHAP 3: Komparasi Murni ID Stasiun (Database vs Operator Aktif)
  // =========================================================================
  const regionLabel = detectedRegionText || targetStation?.stationName || activeStationName;

  if (targetStation && targetStation.id === activeStation.id) {
    return {
      isOutsideJurisdiction: false,
      detectedRegionName: regionLabel,
      currentStationName: activeStationName,
      targetStation: null,
      reason: 'Lokasi TKP berada dalam wilayah hukum mako aktif.',
    };
  }

  if (targetStation && targetStation.id !== activeStation.id) {
    const targetName = targetStation.stationName || 'Mako Tetangga';
    return {
      isOutsideJurisdiction: true,
      detectedRegionName: regionLabel,
      currentStationName: activeStationName,
      targetStation,
      distanceKmToTarget,
      reason: `Titik TKP terdeteksi di yurisdiksi ${targetName}. Laporan akan dialihkan ke Mako tetangga melalui koordinasi lintas wilayah tanpa penugasan ke armada lokal.`,
    };
  }

  return {
    isOutsideJurisdiction: false,
    detectedRegionName: activeStationName,
    currentStationName: activeStationName,
    targetStation: null,
    reason: 'Lokasi TKP dalam yurisdiksi normal.',
  };
}
