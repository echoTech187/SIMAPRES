/**
 * Reverse Geocoding Utility for SIMAPRES 110
 * Translates latitude & longitude coordinates into human-readable Indonesian addresses.
 * Supports:
 *  1. Google Maps Geocoder (client-side if window.google is loaded)
 *  2. OpenStreetMap Nominatim API (client-side and server-side in Node.js)
 *  3. In-memory caching to avoid duplicate requests
 *  4. Police Sector / Jurisdiction resolver for Polres Pekalongan & surrounding areas
 */

const geocodeCache = new Map<string, string>();

/**
 * Checks if an address string is generic, empty, or consists solely of GPS coordinates/SOS labels.
 */
export function isGenericOrCoordinateAddress(address?: string | null): boolean {
  if (!address || typeof address !== 'string') return true;
  const trimmed = address.trim();
  if (trimmed === '' || trimmed === '-' || trimmed === 'null' || trimmed === 'undefined') return true;

  const lower = trimmed.toLowerCase();
  if (lower.includes('panggilan darurat gps') || lower.includes('otomatis warga 110')) return true;
  if (lower.includes('darurat gps') || lower.includes('sos panik') || lower.includes('panic button')) return true;
  if (lower.includes('titik gps') || lower.includes('koordinat tkp') || lower.includes('koordinat')) return true;
  if (lower.includes('sinyal darurat') || lower.includes('lokasi koordinat')) return true;

  // Pattern matching coordinates e.g. "-7.0269, 109.5811" or "-7.026909, 109.581129"
  if (/^-?\d+\.\d+[\s,]+-?\d+\.\d+$/.test(trimmed)) return true;

  return false;
}

/**
 * Reverse geocodes coordinates (lat, lng) to a human-readable street/locality address.
 */
export async function reverseGeocodeCoords(lat: number, lng: number): Promise<string> {
  if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
    return 'Wilayah Hukum Polres Pekalongan';
  }

  const cacheKey = `${lat.toFixed(5)},${lng.toFixed(5)}`;
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey)!;
  }

  // 1. Google Maps Geocoder if active on client
  if (typeof window !== 'undefined' && (window as any).google?.maps?.Geocoder) {
    try {
      const address = await new Promise<string>((resolve, reject) => {
        const geocoder = new (window as any).google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results: any, status: any) => {
          if (status === 'OK' && results && results[0]?.formatted_address) {
            const clean = results[0].formatted_address.replace(/^[A-Z0-9\+]+\s+/, '').trim();
            resolve(clean || results[0].formatted_address);
          } else {
            reject(new Error(status));
          }
        });
      });
      if (address) {
        geocodeCache.set(cacheKey, address);
        return address;
      }
    } catch (_) {
      // Continue to Nominatim fallback
    }
  }

  // 2. OpenStreetMap Nominatim reverse geocode fallback
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'id',
          'User-Agent': 'SIMAPRES-CommandCenter-110/1.0',
        },
      }
    );

    if (res.ok) {
      const data = await res.json();
      if (data && data.address) {
        const a = data.address;
        const road = a.road || a.pedestrian || a.street || '';
        const village = a.village || a.suburb || a.neighbourhood || '';
        const district = a.city_district || a.subdistrict || a.county || '';
        const city = a.city || a.town || a.municipality || '';
        const state = a.state || '';

        const parts = [road, village, district, city, state].filter(Boolean);
        const resolved = parts.length > 0 ? parts.join(', ') : data.display_name;
        if (resolved) {
          geocodeCache.set(cacheKey, resolved);
          return resolved;
        }
      }
      if (data?.display_name) {
        geocodeCache.set(cacheKey, data.display_name);
        return data.display_name;
      }
    }
  } catch (_) {
    // network or cors error
  }

  // 3. Fallback based on default jurisdiction
  const fallback = 'Kajen, Pekalongan, Jawa Tengah';
  geocodeCache.set(cacheKey, fallback);
  return fallback;
}

/**
 * Resolves Police Sector (Polsek / Sektor Wilayah) from address or complaint metadata.
 */
export function resolveSektorWilayah(address?: string | null, complaint?: any): string {
  if (complaint?.station?.station_name) {
    return complaint.station.station_name;
  }

  const text = `${address || ''} ${complaint?.tkpAlamatTeks || ''}`.toLowerCase();

  if (text.includes('kajen')) return 'Sektor Kajen (Polsek Kajen)';
  if (text.includes('kedungwuni')) return 'Sektor Kedungwuni (Polsek Kedungwuni)';
  if (text.includes('wiradesa')) return 'Sektor Wiradesa (Polsek Wiradesa)';
  if (text.includes('bojong')) return 'Sektor Bojong (Polsek Bojong)';
  if (text.includes('wonopringgo')) return 'Sektor Wonopringgo (Polsek Wonopringgo)';
  if (text.includes('doro')) return 'Sektor Doro (Polsek Doro)';
  if (text.includes('karanganyar')) return 'Sektor Karanganyar (Polsek Karanganyar)';
  if (text.includes('sragi')) return 'Sektor Sragi (Polsek Sragi)';
  if (text.includes('kesesi')) return 'Sektor Kesesi (Polsek Kesesi)';
  if (text.includes('siwalan')) return 'Sektor Siwalan (Polsek Siwalan)';
  if (text.includes('buaran')) return 'Sektor Buaran (Polsek Buaran)';
  if (text.includes('tirto')) return 'Sektor Tirto (Polsek Tirto)';
  if (text.includes('paninggaran')) return 'Sektor Paninggaran (Polsek Paninggaran)';
  if (text.includes('kandhangserang') || text.includes('kandangserang')) return 'Sektor Kandangserang (Polsek Kandangserang)';
  if (text.includes('petungkriyono')) return 'Sektor Petungkriyono (Polsek Petungkriyono)';
  if (text.includes('lebakbarang')) return 'Sektor Lebakbarang (Polsek Lebakbarang)';
  if (text.includes('talun')) return 'Sektor Talun (Polsek Talun)';

  return 'Wilayah Hukum Polres Pekalongan';
}
