import { NextRequest, NextResponse } from 'next/server';
import { consumeRateLimit, RATE_LIMIT_CONFIG } from '@/infrastructure/security/rate-limiter';

export const dynamic = 'force-dynamic';

// In-memory cache for Place Details to minimize Google API calls & save quota
const placeDetailsCache = new Map<string, { lat: number; lng: number; fullAddress: string; types: string[] }>();

export async function GET(request: NextRequest) {
  // Rate Limiting: Melindungi kuota berbayar Google Places API dari scraping & spam
  const forwarded = request.headers.get('x-forwarded-for');
  const clientIp = forwarded ? forwarded.split(',')[0].trim() : (request.headers.get('x-real-ip') || '127.0.0.1');
  const rateLimitKey = `places_search:${clientIp}`;
  const rateCheck = consumeRateLimit(
    rateLimitKey,
    RATE_LIMIT_CONFIG.PLACES_SEARCH.maxAttempts,
    RATE_LIMIT_CONFIG.PLACES_SEARCH.windowMs
  );

  if (!rateCheck.allowed) {
    return NextResponse.json(
      {
        success: false,
        items: [],
        error: 'Terlalu banyak permintaan pencarian alamat. Harap tunggu sebentar.',
        retryAfter: rateCheck.retryAfterSec,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateCheck.retryAfterSec),
        },
      }
    );
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  const latStr = searchParams.get('lat');
  const lngStr = searchParams.get('lng');

  if (!q || q.trim().length < 2) {
    return NextResponse.json({ success: true, items: [] });
  }

  const apiKey =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    process.env.GOOGLE_MAPS_API_KEY ||
    '';

  if (!apiKey) {
    return NextResponse.json({ success: false, items: [], error: 'NO_API_KEY' });
  }

  const cleanQuery = q.trim();
  const lat = latStr ? parseFloat(latStr) : -6.8904669;
  const lng = lngStr ? parseFloat(lngStr) : 109.6600948;

  try {
    // 1. TIER 1A: Google Places API (New) Autocomplete
    // This is the primary API used by Google Maps search box with high quota and zero SearchText rate limits.
    const autoBody: any = {
      input: cleanQuery,
      includedRegionCodes: ['id'],
    };

    if (!isNaN(lat) && !isNaN(lng)) {
      autoBody.locationBias = {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: 45000, // 45 km radius bias around active map center
        },
      };
    }

    const autoRes = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
      },
      body: JSON.stringify(autoBody),
    });

    if (autoRes.ok) {
      const autoData = await autoRes.json();
      const suggestions = autoData?.suggestions || [];

      if (suggestions.length > 0) {
        // Resolve coordinates for top suggestions
        const resolvedItems: any[] = [];

        for (const s of suggestions.slice(0, 6)) {
          const pred = s.placePrediction;
          if (!pred) continue;

          const placeId = pred.placeId;
          const mainText = pred.structuredFormat?.mainText?.text || pred.text?.text || cleanQuery;
          const secondaryText = pred.structuredFormat?.secondaryText?.text || '';
          const fallbackAddress = pred.text?.text || `${mainText}, ${secondaryText}`;

          let details = placeDetailsCache.get(placeId);

          if (!details) {
            try {
              const detailRes = await fetch(
                `https://places.googleapis.com/v1/places/${placeId}?fields=id,displayName,formattedAddress,location,types&key=${apiKey}`
              );
              if (detailRes.ok) {
                const dData = await detailRes.json();
                if (dData?.location) {
                  details = {
                    lat: Number(dData.location.latitude.toFixed(6)),
                    lng: Number(dData.location.longitude.toFixed(6)),
                    fullAddress: dData.formattedAddress || fallbackAddress,
                    types: dData.types || pred.types || [],
                  };
                  placeDetailsCache.set(placeId, details);
                }
              }
            } catch (err) {
              console.warn('Place detail fetch error:', err);
            }
          }

          if (details) {
            const types = details.types || pred.types || [];
            const isPolice =
              types.includes('police') ||
              /\b(polres|polresta|polrestabes|polsek|pospol|polda|polisi)\b/i.test(mainText);

            let stationType: 'POLRES' | 'POLSEK' | 'POSPOL' | 'POLDA' | 'MABES' | 'LOKASI' = 'LOKASI';
            const lower = mainText.toLowerCase();
            if (lower.includes('mabes')) stationType = 'MABES';
            else if (lower.includes('polda')) stationType = 'POLDA';
            else if (lower.includes('polres') || lower.includes('polresta') || lower.includes('polrestabes')) stationType = 'POLRES';
            else if (lower.includes('polsek')) stationType = 'POLSEK';
            else if (lower.includes('pospol') || lower.includes('pos polisi') || lower.includes('pos lantas')) stationType = 'POSPOL';

            resolvedItems.push({
              label: mainText,
              subLabel: secondaryText || details.fullAddress.split(',')[0] || details.fullAddress,
              fullAddress: details.fullAddress,
              lat: details.lat,
              lng: details.lng,
              isPoliceStation: isPolice,
              stationType,
            });
          }
        }

        if (resolvedItems.length > 0) {
          return NextResponse.json({ success: true, items: resolvedItems });
        }
      }
    }

    // 2. TIER 1B: Fallback to Places:searchText if Autocomplete returned no items
    try {
      const searchBody: any = {
        textQuery: cleanQuery,
        languageCode: 'id',
      };

      if (!isNaN(lat) && !isNaN(lng)) {
        searchBody.locationBias = {
          circle: {
            center: { latitude: lat, longitude: lng },
            radius: 35000,
          },
        };
      }

      const gRes = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask':
            'places.displayName,places.formattedAddress,places.location,places.types',
        },
        body: JSON.stringify(searchBody),
      });

      if (gRes.ok) {
        const data = await gRes.json();
        const rawPlaces = data?.places || [];

        const items = rawPlaces.map((p: any) => {
          const label = p.displayName?.text || '';
          const fullAddress = p.formattedAddress || label;
          const pLat = Number(p.location?.latitude?.toFixed(6) || 0);
          const pLng = Number(p.location?.longitude?.toFixed(6) || 0);

          const types: string[] = Array.isArray(p.types) ? p.types : [];
          const isPolice =
            types.includes('police') ||
            /\b(polres|polresta|polrestabes|polsek|pospol|polda|polisi)\b/i.test(label);

          let stationType: 'POLRES' | 'POLSEK' | 'POSPOL' | 'POLDA' | 'MABES' | 'LOKASI' = 'LOKASI';
          const lower = label.toLowerCase();
          if (lower.includes('mabes')) stationType = 'MABES';
          else if (lower.includes('polda')) stationType = 'POLDA';
          else if (lower.includes('polres') || lower.includes('polresta') || lower.includes('polrestabes')) stationType = 'POLRES';
          else if (lower.includes('polsek')) stationType = 'POLSEK';
          else if (lower.includes('pospol') || lower.includes('pos polisi') || lower.includes('pos lantas')) stationType = 'POSPOL';

          return {
            label,
            subLabel: fullAddress.split(',')[0] || fullAddress,
            fullAddress,
            lat: pLat,
            lng: pLng,
            isPoliceStation: isPolice,
            stationType,
          };
        });

        return NextResponse.json({ success: true, items });
      }
    } catch (_) {}

    return NextResponse.json({ success: true, items: [] });
  } catch (error: any) {
    console.error('Places API search handler error:', error);
    return NextResponse.json({ success: false, items: [], error: error?.message || 'INTERNAL_ERROR' });
  }
}
