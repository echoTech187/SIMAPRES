'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Plus, Minus, LocateFixed, AlertTriangle, Maximize2 } from 'lucide-react';

export interface MapUnitData {
  key?: string;
  nrp?: string;
  callsign?: string;
  officerId?: string;
  pos?: { lat: number; lng: number };
  lat?: number;
  lng?: number;
  iconEmoji?: string;
  title?: string;
  petugas?: string;
  pangkat?: string;
  namaLengkap?: string;
  satuan?: string;
  jabatan?: string;
  sub?: string;
  status?: string;
  statusLabel?: string;
  statusColor?: string;
  tugas?: string;
  aktivitas?: string;
  lokasiTeks?: string;
  telemetri?: string;
  speedKmh?: number;
  batteryLevel?: number;
  category?: string;
  routePoints?: { lat: number; lng: number }[];
  assignedVehicle?: string | null;
  lastHeartbeat?: string;
}

interface SimapresGoogleMapProps {
  mode?: 'beranda' | 'fullscreen';
  myUnit?: MapUnitData | null;
  policeOffices?: any[];
  fleetUnits?: MapUnitData[];
  hotspots?: any[];
  showTraffic?: boolean;
  showOtherOfficers?: boolean;
  showPatrolRoutes?: boolean;
  focusedUnitKey?: string | null;
  activeFilter?: 'all' | 'samapta' | 'perintis' | 'lantas' | 'reskrim' | 'intelkam' | 'binmas' | 'pawas' | 'hotspot';
  onSelectUnit?: (unit: MapUnitData) => void;
  onOpenSos?: () => void;
  onOpenCrudRawan?: () => void;
  onToggleTraffic?: (active: boolean) => void;
  onFullscreen?: () => void;
  height?: string;
  interactive?: boolean;
  centerLat?: number;
  centerLng?: number;
  onUnitClick?: (unit: any) => void;
  targetComplaint?: any | null;
  customRoutePath?: { lat: number; lng: number }[] | null;
  followMyUnit?: boolean;
  controlsPosition?: 'top-right' | 'bottom-right' | 'bottom-left';
  controlsRightOffset?: string | number;
  controlsBottomOffset?: string | number;
}

// Singleton script loader for Google Maps
let googleMapsPromise: Promise<any> | null = null;
export function loadGoogleMaps(): Promise<any> {
  if (typeof window === 'undefined') return Promise.resolve(null);

  // Redam error Geocoding Billing dari Google Maps SDK agar Next.js dev overlay tidak memunculkan pop-up modal
  if (!(window as any).__simapresGmapsHooked) {
    (window as any).__simapresGmapsHooked = true;
    const origConsoleError = console.error;
    console.error = function (...args: any[]) {
      const msg = args.map((a) => (a && a.stack ? a.stack : String(a))).join(' ');
      if (
        msg.includes('Geocoding Service') ||
        msg.includes('enable Billing on the Google Cloud Project') ||
        msg.includes('developers.google.com/maps/gmp-get-started')
      ) {
        console.warn(
          '[SIMAPRES MAPS] Google Geocoding Billing belum aktif. Sistem otomatis menggunakan OpenStreetMap Nominatim (100% Gratis).'
        );
        return;
      }
      origConsoleError.apply(console, args);
    };
  }

  if ((window as any).google?.maps?.Map) {
    return Promise.resolve((window as any).google.maps);
  }

  if (!googleMapsPromise) {
    googleMapsPromise = new Promise((resolve) => {
      const checkReady = async () => {
        const gm = (window as any).google?.maps;
        if (gm) {
          if (typeof gm.Map === 'function') {
            resolve(gm);
            return true;
          }
          if (typeof gm.importLibrary === 'function') {
            try {
              const mapsLib = await gm.importLibrary('maps');
              if (mapsLib?.Map) {
                gm.Map = mapsLib.Map;
                resolve(gm);
                return true;
              }
            } catch (_) {}
          }
        }
        return false;
      };

      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        let attempts = 0;
        const interval = setInterval(async () => {
          attempts++;
          if (await checkReady() || attempts > 50) {
            clearInterval(interval);
            resolve((window as any).google?.maps || null);
          }
        }, 100);
        return;
      }

      const script = document.createElement('script');
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
      const keyParam = apiKey ? `&key=${apiKey}` : '';
      script.src = `https://maps.googleapis.com/maps/api/js?libraries=places,geometry&v=weekly&loading=async${keyParam}`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        let attempts = 0;
        const interval = setInterval(async () => {
          attempts++;
          if (await checkReady() || attempts > 50) {
            clearInterval(interval);
            resolve((window as any).google?.maps || null);
          }
        }, 50);
      };
      script.onerror = () => {
        console.warn('Google Maps failed to load');
        resolve(null);
      };
      document.head.appendChild(script);
    });
  }

  return googleMapsPromise;
}

// In-memory cache for road geometry to prevent repeated network requests
const roadGeometryCache = new Map<string, { lat: number; lng: number }[]>();

// Helper to fetch real road-following coordinates & ETA via OSRM GeoJSON with timeout
export async function getRealRoadRoute(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number
): Promise<DetailedRoadRoute | null> {
  if (!startLat || !startLng || !endLat || !endLng) return null;
  const cacheKey = `${startLat.toFixed(4)},${startLng.toFixed(4)};${endLat.toFixed(4)},${endLng.toFixed(4)}`;
  const cached = detailedRouteCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < 120000) {
    return cached.route;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.routes && data.routes.length > 0 && data.routes[0].geometry?.coordinates) {
      const path = data.routes[0].geometry.coordinates.map(([lng, lat]: [number, number]) => ({
        lat,
        lng,
      }));
      const r0 = data.routes[0];
      const distKm = (r0.distance / 1000).toFixed(1);
      const minutes = Math.max(1, Math.round(r0.duration / 60));
      const durationText = minutes >= 60 ? `±${Math.floor(minutes / 60)} Jam ${minutes % 60} Mnt` : `±${minutes} Mnt`;
      const route: DetailedRoadRoute = {
        path,
        distanceText: `${distKm} KM`,
        durationText,
        distanceValue: r0.distance,
        durationValue: r0.duration,
      };
      detailedRouteCache.set(cacheKey, { route, timestamp: Date.now() });
      roadGeometryCache.set(cacheKey, path);
      return route;
    }
  } catch (_) {}
  return null;
}

export async function getRealRoadPath(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number
): Promise<{ lat: number; lng: number }[] | null> {
  const r = await getRealRoadRoute(startLat, startLng, endLat, endLng);
  return r?.path || null;
}

// Definisi detail rute jalan resmi (Google Directions / Fallback)
export interface DetailedRoadRoute {
  path: { lat: number; lng: number }[];
  distanceText?: string;
  durationText?: string;
  distanceValue?: number;
  durationValue?: number;
  summary?: string;
}

const detailedRouteCache = new Map<string, { route: DetailedRoadRoute; timestamp: number }>();

// Proteksi Error Konsol: Google Maps DirectionsService dinonaktifkan secara default.
// Ini mencegah spam error 'REQUEST_DENIED' di browser console bagi project yang belum mengaktifkan
// API berbayar 'Directions API' di Google Cloud Console. Sistem menggunakan OSRM secara mulus tanpa error.
const isGoogleDirectionsApiEnabled = typeof process !== 'undefined' && process.env.NEXT_PUBLIC_ENABLE_GOOGLE_DIRECTIONS === 'true';
let isGoogleDirectionsApiAvailable = isGoogleDirectionsApiEnabled;
let directionsDisabledUntil = 0;

// Prioritas Utama: Google Maps DirectionsService (Akurasi Jalan Raya Nyata & Belokan Google Maps)
export function getGoogleDirectionsRoute(
  maps: any,
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<DetailedRoadRoute | null> {
  if (!isGoogleDirectionsApiEnabled || !isGoogleDirectionsApiAvailable) {
    if (Date.now() < directionsDisabledUntil) {
      return Promise.resolve(null);
    }
    if (!isGoogleDirectionsApiEnabled) return Promise.resolve(null);
    isGoogleDirectionsApiAvailable = true;
  }

  if (!origin?.lat || !origin?.lng || !destination?.lat || !destination?.lng) {
    return Promise.resolve(null);
  }

  const oLat = Number(origin.lat);
  const oLng = Number(origin.lng);
  const dLat = Number(destination.lat);
  const dLng = Number(destination.lng);

  if (isNaN(oLat) || isNaN(oLng) || isNaN(dLat) || isNaN(dLng)) {
    return Promise.resolve(null);
  }

  const cacheKey = `${oLat.toFixed(4)},${oLng.toFixed(4)}->${dLat.toFixed(4)},${dLng.toFixed(4)}`;
  const cached = detailedRouteCache.get(cacheKey);
  const now = Date.now();
  if (cached && now - cached.timestamp < 120000) {
    return Promise.resolve(cached.route);
  }

  return new Promise((resolve) => {
    if (!maps || typeof maps.DirectionsService !== 'function') {
      return resolve(null);
    }
    try {
      const service = new maps.DirectionsService();
      service.route(
        {
          origin: { lat: oLat, lng: oLng },
          destination: { lat: dLat, lng: dLng },
          travelMode: maps.TravelMode.DRIVING,
        },
        (result: any, status: any) => {
          if (status === 'OK' && result?.routes?.[0]?.overview_path) {
            const path = result.routes[0].overview_path.map((p: any) => ({
              lat: typeof p.lat === 'function' ? p.lat() : Number(p.lat),
              lng: typeof p.lng === 'function' ? p.lng() : Number(p.lng),
            }));
            const leg = result.routes[0].legs?.[0];
            const route: DetailedRoadRoute = {
              path,
              distanceText: leg?.distance?.text,
              durationText: leg?.duration?.text,
              distanceValue: leg?.distance?.value,
              durationValue: leg?.duration?.value,
              summary: result.routes[0].summary,
            };
            detailedRouteCache.set(cacheKey, { route, timestamp: now });
            resolve(route);
          } else {
            // Jika REQUEST_DENIED / ACCESS_DENIED, hentikan panggilan berulang ke API agar tidak spam error
            if (status === 'REQUEST_DENIED' || status === 'OVER_QUERY_LIMIT' || status === 'ACCESS_DENIED') {
              isGoogleDirectionsApiAvailable = false;
              directionsDisabledUntil = Date.now() + 600000; // Diamkan selama 10 menit
            }
            resolve(null);
          }
        }
      );
    } catch (_) {
      resolve(null);
    }
  });
}

// Fallback: Google Maps DirectionsService Path saja (Backwards Compatible)
export async function getGoogleDirectionsPath(
  maps: any,
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<{ lat: number; lng: number }[] | null> {
  const route = await getGoogleDirectionsRoute(maps, origin, destination);
  return route?.path || null;
}

// Master Route Resolver: Prioritas 1 OSRM (Bebas Kuota, Tanpa API Key, Rute Jalan Riil) -> Fallback Google Directions -> Fallback Tactical Curve
export async function getBestRoadRoute(
  maps: any,
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<DetailedRoadRoute> {
  if (!origin?.lat || !origin?.lng || !destination?.lat || !destination?.lng) {
    return { path: [] };
  }

  const oLat = Number(origin.lat);
  const oLng = Number(origin.lng);
  const dLat = Number(destination.lat);
  const dLng = Number(destination.lng);

  // Tier 1: OSRM Road Geometry & ETA (Bebas Kuota, Tanpa API Key, Akurasi Rute Jalan Raya Indonesia)
  try {
    const osrmRoute = await getRealRoadRoute(oLat, oLng, dLat, dLng);
    if (osrmRoute && osrmRoute.path && osrmRoute.path.length >= 2) {
      return osrmRoute;
    }
  } catch (_) {}

  // Tier 2: Google Maps DirectionsService (Hanya jika OSRM belum merespons dan API aktif)
  if (maps && isGoogleDirectionsApiAvailable) {
    try {
      const googleRes = await getGoogleDirectionsRoute(maps, { lat: oLat, lng: oLng }, { lat: dLat, lng: dLng });
      if (googleRes && googleRes.path && googleRes.path.length >= 2) {
        return googleRes;
      }
    } catch (_) {}
  }

  // Tier 3: Tactical Path Curve sebagai fallback darurat agar tidak pernah blank
  return {
    path: generateTacticalPath(oLat, oLng, dLat, dLng),
  };
}

// Fallback Tier 3: Tactical smooth curve generator (Garis taktis yang selalu tersedia tanpa internet/API)
export function generateTacticalPath(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number
): { lat: number; lng: number }[] {
  const points: { lat: number; lng: number }[] = [];
  const SAMPLES = 40;
  const perpLat = -(endLng - startLng);
  const perpLng = (endLat - startLat);
  for (let i = 0; i <= SAMPLES; i++) {
    const t = i / SAMPLES;
    const curve = Math.sin(t * Math.PI) * 0.035;
    points.push({
      lat: startLat + (endLat - startLat) * t + perpLat * curve,
      lng: startLng + (endLng - startLng) * t + perpLng * curve,
    });
  }
  return points;
}


export default function SimapresGoogleMap({
  mode = 'beranda',
  myUnit = null,
  policeOffices = [],
  fleetUnits = [],
  hotspots = [],
  showTraffic = true,
  showOtherOfficers = true,
  showPatrolRoutes = true,
  focusedUnitKey = null,
  activeFilter = 'all',
  onSelectUnit,
  onOpenSos,
  onOpenCrudRawan,
  onToggleTraffic,
  onFullscreen,
  height = '350px',
  interactive = true,
  centerLat,
  centerLng,
  onUnitClick,
  targetComplaint = null,
  customRoutePath = undefined,
  followMyUnit = false,
  controlsPosition = 'bottom-right',
  controlsRightOffset,
  controlsBottomOffset,
}: SimapresGoogleMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState<boolean>(false);
  const trafficLayerRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const patrolPolylinesRef = useRef<any[]>([]);
  const myUnitMarkerRef = useRef<any>(null);
  const tkpMarkerRef = useRef<any>(null);
  const directionsRendererRef = useRef<any>(null);
  const lastFittedComplaintIdRef = useRef<string | null>(null);
  const lastRouteFetchedCoordsRef = useRef<{ oLat: number; oLng: number; dLat: number; dLng: number } | null>(null);
  const isFetchingRouteRef = useRef<boolean>(false);
  const hasInitiallyZoomedRef = useRef<boolean>(false);

  const infoWindowRef = useRef<any>(null);

  const handleUnitClick = (unit: any) => {
    if (onSelectUnit) onSelectUnit(unit);
    if (onUnitClick) onUnitClick(unit);
  };

  const escapeXml = (unsafe: string) => {
    return (unsafe || '').replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });
  };

  const openMarkerDetailWindow = (marker: any, data: {
    title: string;
    subTitle?: string;
    petugas?: string;
    badgeText?: string;
    badgeColor?: string;
    address?: string;
    activity?: string;
    status?: string;
    lat: number;
    lng: number;
    icon?: string;
  }) => {
    if (!mapInstanceRef.current || !(window as any).google?.maps) return;
    const maps = (window as any).google.maps;

    if (!infoWindowRef.current) {
      infoWindowRef.current = new maps.InfoWindow({
        disableAutoPan: false,
      });
    }

    const container = document.createElement('div');
    container.style.cssText = `
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      width: 320px;
      max-width: 82vw;
      background: rgba(15, 23, 42, 0.98);
      color: #FFFFFF;
      border-radius: 14px;
      padding: 14px 16px;
      box-sizing: border-box;
    `;

    const qrBadgeHtml = data.badgeText?.includes('RAWAN') || data.status === 'TITIK RAWAN'
      ? `<span style="font-size: 10px; font-weight: 800; color: #F87171; background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); padding: 2px 7px; border-radius: 5px;">⚠️ Zona Rawan</span>`
      : `<span style="font-size: 10px; font-weight: 800; color: #34D399; background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); padding: 2px 7px; border-radius: 5px;">✓ Terverifikasi</span>`;

    const showPetugas = data.petugas && data.petugas !== data.title && data.petugas !== '-';

    container.innerHTML = `
      <!-- Header -->
      <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; margin-bottom: 6px; padding-right: 28px;">
        <div style="display: flex; align-items: center; gap: 8px; min-width: 0;">
          <span style="font-size: 18px; flex-shrink: 0;">${data.icon || '🛡️'}</span>
          <div style="min-width: 0;">
            <div style="font-size: 13.5px; font-weight: 900; color: #38BDF8; line-height: 1.25; word-break: break-word;">
              ${escapeXml(data.title)}
            </div>
          </div>
        </div>
      </div>

      ${showPetugas ? `
        <div style="font-size: 13px; font-weight: 800; color: #FFFFFF; line-height: 1.3; padding-right: 28px;">
          ${escapeXml(data.petugas!)}
        </div>
      ` : ''}
      <div style="font-size: 11px; color: #94A3B8; margin-top: 2px; line-height: 1.35; padding-right: 28px;">
        ${escapeXml(data.subTitle || data.address || 'Wilayah Hukum Polres Pekalongan')}
      </div>

      <div style="border-top: 1px solid rgba(255,255,255,0.12); margin: 8px 0;"></div>

      <!-- Status Kedinasan -->
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
        <span style="font-size: 11px; color: #94A3B8; font-weight: 600;">Status Kedinasan:</span>
        <div style="display: flex; gap: 6px; align-items: center;">
          <span style="font-size: 10px; font-weight: 800; padding: 2.5px 8px; border-radius: 5px; background: ${data.badgeColor ? data.badgeColor + '25' : 'rgba(16,185,129,0.2)'}; color: ${data.badgeColor || '#34D399'}; border: 1px solid ${data.badgeColor || '#10B981'};">
            ${escapeXml(data.badgeText || data.status || 'MAKO AKTIF')}
          </span>
          ${qrBadgeHtml}
        </div>
      </div>

      <!-- Sedang Di Mana -->
      <div style="font-size: 11.5px; background: rgba(0,0,0,0.35); padding: 7px 9px; border-radius: 6px; margin-bottom: 6px; border: 1px solid rgba(255,255,255,0.06);">
        <div style="font-size: 9.5px; color: #F59E0B; font-weight: 800; display: flex; align-items: center; gap: 4px; margin-bottom: 2px;">
          <span>📍</span>
          <span>SEDANG DI MANA:</span>
        </div>
        <div style="color: #E2E8F0; font-weight: 600; line-height: 1.35;">
          ${escapeXml(data.address || 'Kabupaten Pekalongan, Jawa Tengah')}
        </div>
      </div>

      <!-- Sedang Melakukan Apa -->
      <div style="font-size: 11.5px; background: rgba(0,0,0,0.35); padding: 7px 9px; border-radius: 6px; margin-bottom: 8px; border: 1px solid rgba(255,255,255,0.06);">
        <div style="font-size: 9.5px; color: #34D399; font-weight: 800; display: flex; align-items: center; gap: 4px; margin-bottom: 2px;">
          <span>🎯</span>
          <span>SEDANG MELAKUKAN APA:</span>
        </div>
        <div style="color: #E2E8F0; font-weight: 600;">
          ${escapeXml(data.activity || 'Pusat Komando & Pengendalian Operasi')}
        </div>
      </div>

      <!-- Koordinat -->
      <div style="font-size: 10px; color: #94A3B8; margin-bottom: 10px; font-family: monospace;">
        🌐 Koordinat: ${data.lat.toFixed(5)}, ${data.lng.toFixed(5)}
      </div>

      <!-- Action Buttons -->
      <div style="display: flex; gap: 6px;">
        <button type="button" id="btn-pan-marker" style="flex: 1; text-align: center; background: linear-gradient(135deg, #0284C7 0%, #0369A1 100%); color: #FFFFFF; font-size: 11px; font-weight: 800; padding: 7px 8px; border-radius: 6px; border: none; cursor: pointer;">
          🎯 Pusatkan Peta
        </button>
        <button type="button" id="btn-ht-marker" style="flex: 1; text-align: center; background: rgba(255,255,255,0.08); color: #38BDF8; border: 1px solid rgba(56,189,248,0.3); font-size: 11px; font-weight: 800; padding: 7px 8px; border-radius: 6px; cursor: pointer;">
          📻 Hubungi HT
        </button>
        <a href="https://www.google.com/maps/dir/?api=1&destination=${data.lat},${data.lng}" target="_blank" rel="noopener noreferrer" style="text-align: center; background: rgba(16,185,129,0.15); color: #34D399; border: 1px solid rgba(16,185,129,0.35); font-size: 11px; font-weight: 800; padding: 7px 10px; border-radius: 6px; text-decoration: none; display: inline-flex; align-items: center; justify-content: center;" title="Navigasi Google Maps">
          🗺️
        </a>
      </div>
    `;

    const btnPan = container.querySelector('#btn-pan-marker');
    if (btnPan) {
      btnPan.addEventListener('click', () => {
        mapInstanceRef.current?.panTo({ lat: data.lat, lng: data.lng });
        mapInstanceRef.current?.setZoom(16);
      });
    }

    const btnHt = container.querySelector('#btn-ht-marker');
    if (btnHt) {
      btnHt.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('personil:call-ht', { detail: data }));
        alert(`Menghubungi frekuensi HT SIMOPMAS 110: ${data.petugas || data.title}...`);
      });
    }

    infoWindowRef.current.setContent(container);
    infoWindowRef.current.open(mapInstanceRef.current, marker);
  };

  // SVG Halo Badge Icon Generator matching Prototype/js/personil.js lines 98-111
  const makeHaloBadgeIcon = (emoji: string, strokeColor: string, haloColor: string) => {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="52" height="52" viewBox="0 0 52 52">
        <!-- Outer Pulsing Halo Ring -->
        <circle cx="26" cy="26" r="23" fill="${haloColor}" fill-opacity="0.32" stroke="${strokeColor}" stroke-width="1.5" stroke-dasharray="4,2"/>
        <!-- Inner Solid White Circle -->
        <circle cx="26" cy="26" r="16.5" fill="#FFFFFF" stroke="${strokeColor}" stroke-width="2.5"/>
        <!-- Centered Emoji/Icon -->
        <text x="26" y="32" font-size="18" text-anchor="middle" font-family="'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif">${emoji}</text>
      </svg>
    `;
    return {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
      scaledSize: (window as any).google?.maps?.Size ? new (window as any).google.maps.Size(52, 52) : undefined,
      anchor: (window as any).google?.maps?.Point ? new (window as any).google.maps.Point(26, 26) : undefined,
    };
  };

  // Tactical Unit Icon dengan Floating Pill Tag (Pawas Tactical Command Map)
  const makeTacticalUnitIcon = (
    emoji: string,
    strokeColor: string,
    haloColor: string,
    labelTitle: string = '',
    labelSubtitle: string = '',
    isFocused: boolean = false
  ) => {
    if (!labelTitle) {
      return makeHaloBadgeIcon(emoji, strokeColor, haloColor);
    }

    const safeTitle = escapeXml(labelTitle.length > 22 ? labelTitle.slice(0, 21) + '…' : labelTitle);
    const safeSub = escapeXml(labelSubtitle.length > 26 ? labelSubtitle.slice(0, 25) + '…' : labelSubtitle);

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="220" height="54" viewBox="0 0 220 54">
        <!-- Floating Pill Tag Background -->
        <rect x="42" y="8" width="172" height="38" rx="8" fill="${isFocused ? '#0F172A' : '#0B132B'}" fill-opacity="0.94" stroke="${isFocused ? '#38BDF8' : strokeColor}" stroke-width="${isFocused ? '2.5' : '1.5'}"/>
        <!-- Title / Officer Name -->
        <text x="52" y="24" font-size="11" font-weight="800" fill="#FFFFFF" font-family="system-ui, -apple-system, sans-serif">${safeTitle}</text>
        <!-- Status / Location Dot & Text -->
        <circle cx="56" cy="35" r="3" fill="${strokeColor}" />
        <text x="63" y="38" font-size="9" font-weight="700" fill="${isFocused ? '#38BDF8' : strokeColor}" font-family="system-ui, -apple-system, sans-serif">${safeSub}</text>
        <!-- Outer Pulsing Halo Ring -->
        <circle cx="24" cy="27" r="21" fill="${haloColor}" fill-opacity="${isFocused ? '0.55' : '0.28'}" stroke="${strokeColor}" stroke-width="${isFocused ? '2.5' : '1.5'}" stroke-dasharray="4,2"/>
        <!-- Inner Solid White Circle -->
        <circle cx="24" cy="27" r="14.5" fill="#FFFFFF" stroke="${strokeColor}" stroke-width="2"/>
        <!-- Centered Emoji/Icon -->
        <text x="24" y="33" font-size="16" text-anchor="middle" font-family="'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif">${emoji}</text>
      </svg>
    `;

    return {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
      scaledSize: (window as any).google?.maps?.Size ? new (window as any).google.maps.Size(220, 54) : undefined,
      anchor: (window as any).google?.maps?.Point ? new (window as any).google.maps.Point(24, 27) : undefined,
    };
  };

  // Initialize Native Google Maps
  useEffect(() => {
    let isSubscribed = true;

    loadGoogleMaps().then((maps) => {
      if (!isSubscribed || !maps || !mapContainerRef.current) return;

      // Center around coordinates, unit, target TKP, atau default Mako Kepolisian (Polres Pekalongan)
      const firstOffice = policeOffices && policeOffices.length > 0 ? policeOffices[0] : null;
      const defaultCenter = (firstOffice?.lat && firstOffice?.lng)
        ? { lat: Number(firstOffice.lat), lng: Number(firstOffice.lng) }
        : { lat: -7.026803, lng: 109.592982 };

      const centerPos = (centerLat && centerLng && Number(centerLat) !== 0 && Number(centerLng) !== 0)
        ? { lat: Number(centerLat), lng: Number(centerLng) }
        : (myUnit?.pos?.lat && myUnit?.pos?.lng && Number(myUnit.pos.lat) !== 0
          ? { lat: Number(myUnit.pos.lat), lng: Number(myUnit.pos.lng) }
          : (targetComplaint?.tkpLat && targetComplaint?.tkpLng
            ? { lat: Number(targetComplaint.tkpLat), lng: Number(targetComplaint.tkpLng) }
            : defaultCenter));

      const mapOptions = {
        zoom: mode === 'fullscreen' ? 14 : 13,
        center: centerPos,
        disableDefaultUI: true, // Clean interface matching prototype
        mapTypeId: 'roadmap',
        gestureHandling: 'greedy',
        styles: [
          { featureType: 'poi', stylers: [{ visibility: 'off' }] },
          { featureType: 'transit', stylers: [{ visibility: 'off' }] },
        ],
      };

      if (typeof maps.Map !== 'function') {
        console.warn('Google Maps Map constructor is not available.');
        return;
      }

      try {
        const map = new maps.Map(mapContainerRef.current, mapOptions);
        mapInstanceRef.current = map;
        setMapReady(true);

        // Tutup InfoWindow saat klik di area peta kosong
        map.addListener('click', () => {
          infoWindowRef.current?.close();
        });

        // Trigger resize agar tile peta langsung ter-render tanpa blank abu-abu
        setTimeout(() => {
          if (maps.event && mapInstanceRef.current) {
            maps.event.trigger(mapInstanceRef.current, 'resize');
          }
        }, 200);

        // =========================================================================
        // NATIVE GOOGLE MAPS REALTIME TRAFFIC LAYER (1:1 DENGAN PROTOTYPE)
        // Menampilkan traffic line hijau, oranye, dan merah secara real-time dari Google
        // =========================================================================
        if (typeof maps.TrafficLayer === 'function') {
          const trafficLayer = new maps.TrafficLayer();
          trafficLayerRef.current = trafficLayer;

          if (showTraffic) {
            trafficLayer.setMap(map);
          }
        }

        // Auto-dismiss development notice dialog jika ada (sama persis dengan prototype personil.js baris 49-57)
        const dismissTimer = setInterval(() => {
          document.querySelectorAll('.dismissButton').forEach((b: any) => {
            try { b.click(); } catch (_) {}
          });
          document.querySelectorAll('[role="dialog"]').forEach((dialog: any) => {
            const text = (dialog as HTMLElement).innerText || '';
            if (
              text.includes('tidak dapat memuat Google Maps') ||
              text.includes('pemilik situs ini') ||
              text.includes('For development purposes only')
            ) {
              (dialog as HTMLElement).style.display = 'none';
              (dialog as HTMLElement).style.visibility = 'hidden';
              (dialog as HTMLElement).style.pointerEvents = 'none';
            }
          });
        }, 250);

        const clearTimer = setTimeout(() => clearInterval(dismissTimer), 6000);

        // Render markers
        renderMarkers(map, maps);

        return () => {
          clearInterval(dismissTimer);
          clearTimeout(clearTimer);
        };
      } catch (err) {
        console.warn('Error constructing Google Map:', err);
      }
    });

    return () => {
      isSubscribed = false;
      setMapReady(false);
      // Clean up markers and polylines
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
      patrolPolylinesRef.current.forEach((p) => {
        try { p.setMap(null); } catch (_) {}
      });
      patrolPolylinesRef.current = [];
      if (myUnitMarkerRef.current) {
        myUnitMarkerRef.current.setMap(null);
        myUnitMarkerRef.current = null;
      }
      if (tkpMarkerRef.current) {
        tkpMarkerRef.current.setMap(null);
        tkpMarkerRef.current = null;
      }
      if (directionsRendererRef.current) {
        try { directionsRendererRef.current.setMap(null); } catch (_) {}
        directionsRendererRef.current = null;
      }
      mapInstanceRef.current = null;
    };
  }, [mode]);

  // Sync Traffic Layer toggle
  useEffect(() => {
    if (trafficLayerRef.current && mapInstanceRef.current) {
      if (showTraffic) {
        trafficLayerRef.current.setMap(mapInstanceRef.current);
      } else {
        trafficLayerRef.current.setMap(null);
      }
    }
  }, [showTraffic]);

  // Sync custom / simulated route polyline (menghapus garis rute di belakang kendaraan secara real-time)
  useEffect(() => {
    // Jika tidak ada customRoutePath (idle/normal), biarkan rute standar yang aktif
    if (!customRoutePath || !Array.isArray(customRoutePath) || customRoutePath.length < 2) return;
    if (!mapReady || !mapInstanceRef.current || !(window as any).google?.maps) return;
    const maps = (window as any).google.maps;

    const arrowIcons = maps.SymbolPath?.FORWARD_CLOSED_ARROW ? [{
      icon: {
        path: maps.SymbolPath.FORWARD_CLOSED_ARROW,
        scale: 2.4,
        strokeColor: '#78350F',
        fillColor: '#F59E0B',
        fillOpacity: 1,
      },
      offset: '40px',
      repeat: '120px',
    }] : undefined;

    if (directionsRendererRef.current) {
      directionsRendererRef.current.setPath(customRoutePath);
      directionsRendererRef.current.setMap(mapInstanceRef.current);
    } else {
      const poly = new maps.Polyline({
        path: customRoutePath,
        strokeColor: '#ECC473',
        strokeOpacity: 0.95,
        strokeWeight: 6,
        zIndex: 500,
        icons: arrowIcons,
        map: mapInstanceRef.current,
      });
      directionsRendererRef.current = poly;
    }
  }, [mapReady, customRoutePath]);

  // 1. ISOLATED REALTIME POSITION SYNC UNTUK UNIT SENDIRI (Zero Canvas Flicker)
  // Memperbarui posisi marker unit personil secara native GPU transform tanpa pernah merusak/me-recreate marker lain
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !(window as any).google?.maps) return;
    const maps = (window as any).google.maps;
    const myPos = myUnit?.pos || (myUnit?.lat && myUnit?.lng ? { lat: Number(myUnit.lat), lng: Number(myUnit.lng) } : null);

    if (myUnit && myPos && myPos.lat && myPos.lng && Number(myPos.lat) !== 0) {
      if (myUnitMarkerRef.current) {
        myUnitMarkerRef.current.setPosition(myPos);
        myUnitMarkerRef.current.setMap(mapInstanceRef.current);
      } else {
        const myIcon = makeHaloBadgeIcon(myUnit.iconEmoji || '👮', '#0284C7', '#38BDF8');
        const marker = new maps.Marker({
          position: myPos,
          map: mapInstanceRef.current,
          icon: myIcon,
          title: myUnit.title || myUnit.petugas || 'Posisi Saya',
          zIndex: 1000,
        });
        marker.addListener('click', () => {
          handleUnitClick(myUnit);
          openMarkerDetailWindow(marker, {
            title: myUnit.title || myUnit.petugas || 'Posisi Saya',
            subTitle: `NRP: ${myUnit.nrp || '-'} • Posisi Saya`,
            petugas: `${myUnit.pangkat || ''} ${myUnit.petugas || myUnit.title || ''}`.trim(),
            badgeText: 'ONLINE (GPS)',
            badgeColor: '#0284C7',
            address: myUnit.lokasiTeks || 'Posisi GPS Real-time Petugas',
            activity: myUnit.tugas || 'Patroli Siaga Lapangan',
            status: 'SIAGA',
            lat: myPos.lat,
            lng: myPos.lng,
            icon: myUnit.iconEmoji || '👮',
          });
        });
        myUnitMarkerRef.current = marker;
      }
    } else if (myUnitMarkerRef.current) {
      myUnitMarkerRef.current.setMap(null);
      myUnitMarkerRef.current = null;
    }
  }, [mapReady, myUnit?.pos?.lat, myUnit?.pos?.lng, myUnit?.key, myUnit?.iconEmoji, myUnit?.title]);

  // 2. ISOLATED REALTIME TKP MARKER SYNC (Persistent, Zero Canvas Flicker)
  // Menjaga marker TKP tetap stabil di peta tanpa pernah di-destroy/di-recreate saat personil bergerak
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !(window as any).google?.maps) return;
    const maps = (window as any).google.maps;

    const cLat = targetComplaint?.tkpLat ?? targetComplaint?.lat ?? targetComplaint?.tkp_lat;
    const cLng = targetComplaint?.tkpLng ?? targetComplaint?.lng ?? targetComplaint?.tkp_lng;

    if (targetComplaint && cLat && cLng) {
      const tkpPos = { lat: Number(cLat), lng: Number(cLng) };
      const tkpTitle = `TKP: ${targetComplaint.nomorTiket || ''} • ${targetComplaint.jenisKejadian || 'Kejadian Lapangan'}`;
      if (tkpMarkerRef.current) {
        tkpMarkerRef.current.setPosition(tkpPos);
        tkpMarkerRef.current.setTitle(tkpTitle);
        tkpMarkerRef.current.setMap(mapInstanceRef.current);
      } else {
        const tkpIcon = makeHaloBadgeIcon('🚨', '#DC2626', '#FEF08A');
        const marker = new maps.Marker({
          position: tkpPos,
          map: mapInstanceRef.current,
          icon: tkpIcon,
          title: tkpTitle,
          zIndex: 1100,
        });

        const tkpUnitData: MapUnitData = {
          key: `tkp_${targetComplaint.id || 'current'}`,
          pos: tkpPos,
          iconEmoji: '🚨',
          title: `TKP: ${targetComplaint.jenisKejadian || 'Darurat 110'}`,
          petugas: `Nomor Tiket: ${targetComplaint.nomorTiket || '-'}`,
          sub: targetComplaint.tkpAlamatTeks || 'Lokasi Kejadian',
          status: targetComplaint.status || 'DIPROSES',
          statusColor: '#DC2626',
          tugas: 'Target Penanganan Personel',
          telemetri: `Koordinat: ${tkpPos.lat.toFixed(5)}, ${tkpPos.lng.toFixed(5)}`,
        };

        marker.addListener('click', () => {
          handleUnitClick(tkpUnitData);
          openMarkerDetailWindow(marker, {
            title: `Tiket ${targetComplaint.nomorTiket || ''}`,
            subTitle: targetComplaint.jenisKejadian || 'Darurat 110',
            petugas: `Pelapor: ${targetComplaint.pelaporNama || 'Warga'}`,
            badgeText: targetComplaint.status || 'DIPROSES',
            badgeColor: '#DC2626',
            address: targetComplaint.tkpAlamatTeks || 'Lokasi Kejadian',
            activity: 'Target Penanganan Personel Presisi',
            status: 'TKP LAPORAN',
            lat: tkpPos.lat,
            lng: tkpPos.lng,
            icon: '🚨',
          });
        });
        tkpMarkerRef.current = marker;
      }
    } else if (tkpMarkerRef.current) {
      tkpMarkerRef.current.setMap(null);
      tkpMarkerRef.current = null;
    }
  }, [
    mapReady,
    targetComplaint?.id,
    targetComplaint?.nomorTiket,
    targetComplaint?.status,
    targetComplaint?.tkpLat ?? targetComplaint?.lat,
    targetComplaint?.tkpLng ?? targetComplaint?.lng,
  ]);

  // 3. FIT BOUNDS INITIAL OVERVIEW (Only runs once when complaint arrives and !followMyUnit)
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !(window as any).google?.maps || !targetComplaint) return;
    if (followMyUnit) return; // Jangan override viewport jika sedang followMyUnit

    const maps = (window as any).google.maps;
    const cLat = targetComplaint?.tkpLat ?? targetComplaint?.lat ?? targetComplaint?.tkp_lat;
    const cLng = targetComplaint?.tkpLng ?? targetComplaint?.lng ?? targetComplaint?.tkp_lng;
    const originLat = myUnit?.pos?.lat ?? (myUnit as any)?.lat;
    const originLng = myUnit?.pos?.lng ?? (myUnit as any)?.lng;

    if (cLat && cLng && originLat && originLng && Number(originLat) !== 0) {
      const complaintKey = `${targetComplaint.id || targetComplaint.nomorTiket || 'current'}`;
      if (lastFittedComplaintIdRef.current !== complaintKey) {
        lastFittedComplaintIdRef.current = complaintKey;
        try {
          const bounds = new maps.LatLngBounds();
          bounds.extend({ lat: Number(originLat), lng: Number(originLng) });
          bounds.extend({ lat: Number(cLat), lng: Number(cLng) });
          mapInstanceRef.current.fitBounds(bounds, { top: 70, bottom: 80, left: 40, right: 40 });
        } catch (_) {}
      }
    }
  }, [mapReady, targetComplaint?.id, targetComplaint?.nomorTiket, followMyUnit]);

  // 4. MULTI-TIER RESILIENT ROAD ROUTING (OSRM -> Google Directions -> Tactical Direct Curve)
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !(window as any).google?.maps) return;
    if (!targetComplaint) {
      if (directionsRendererRef.current && !customRoutePath) {
        try { directionsRendererRef.current.setMap(null); } catch (_) {}
        directionsRendererRef.current = null;
      }
      return;
    }

    // Jika customRoutePath aktif (sedang simulasi jalan raya), biarkan effect customRoutePath yang mengontrol
    if (customRoutePath && Array.isArray(customRoutePath) && customRoutePath.length >= 2) return;

    const maps = (window as any).google.maps;
    const cLat = targetComplaint?.tkpLat ?? targetComplaint?.lat ?? targetComplaint?.tkp_lat;
    const cLng = targetComplaint?.tkpLng ?? targetComplaint?.lng ?? targetComplaint?.tkp_lng;
    const originLat = myUnit?.pos?.lat ?? (myUnit as any)?.lat;
    const originLng = myUnit?.pos?.lng ?? (myUnit as any)?.lng;

    if (!cLat || !cLng || !originLat || !originLng || Number(originLat) === 0) return;

    const oPos = { lat: Number(originLat), lng: Number(originLng) };
    const dPos = { lat: Number(cLat), lng: Number(cLng) };

    const lastRoute = lastRouteFetchedCoordsRef.current;
    const needsFetch =
      !directionsRendererRef.current ||
      !lastRoute ||
      Math.abs(lastRoute.oLat - oPos.lat) > 0.0005 ||
      Math.abs(lastRoute.oLng - oPos.lng) > 0.0005 ||
      Math.abs(lastRoute.dLat - dPos.lat) > 0.0005 ||
      Math.abs(lastRoute.dLng - dPos.lng) > 0.0005;

    if (needsFetch && !isFetchingRouteRef.current) {
      isFetchingRouteRef.current = true;
      lastRouteFetchedCoordsRef.current = {
        oLat: oPos.lat,
        oLng: oPos.lng,
        dLat: dPos.lat,
        dLng: dPos.lng,
      };

      const arrowIcons = maps.SymbolPath?.FORWARD_CLOSED_ARROW ? [{
        icon: {
          path: maps.SymbolPath.FORWARD_CLOSED_ARROW,
          scale: 2.4,
          strokeColor: '#78350F',
          fillColor: '#F59E0B',
          fillOpacity: 1,
        },
        offset: '40px',
        repeat: '120px',
      }] : undefined;

      // Tier 3: Render instant tactical route curve langsung tanpa menunggu request jaringan
      // Ini menjamin garis kuning SELALU TAMPIL seketika di layar personil
      const initialTactical = generateTacticalPath(oPos.lat, oPos.lng, dPos.lat, dPos.lng);

      if (!directionsRendererRef.current) {
        directionsRendererRef.current = new maps.Polyline({
          path: initialTactical,
          strokeColor: '#ECC473',
          strokeOpacity: 0.95,
          strokeWeight: 6,
          zIndex: 500,
          icons: arrowIcons,
          map: mapInstanceRef.current,
        });
      } else {
        directionsRendererRef.current.setMap(mapInstanceRef.current);
      }

      // Fetch rute jalan raya resmi (Prioritas 1: Google Directions, Tier 2: OSRM, Tier 3: Tactical)
      (async () => {
        try {
          const roadRoute = await getBestRoadRoute(maps, oPos, dPos);
          if (roadRoute && roadRoute.path && roadRoute.path.length >= 2 && mapInstanceRef.current && directionsRendererRef.current) {
            directionsRendererRef.current.setPath(roadRoute.path);
          }
        } catch (err) {
          console.warn('Road routing notice:', err);
        } finally {
          isFetchingRouteRef.current = false;
        }
      })();
    }
  }, [
    mapReady,
    targetComplaint?.id,
    targetComplaint?.nomorTiket,
    targetComplaint?.tkpLat ?? targetComplaint?.lat,
    targetComplaint?.tkpLng ?? targetComplaint?.lng,
    myUnit?.pos?.lat ?? (myUnit as any)?.lat,
    myUnit?.pos?.lng ?? (myUnit as any)?.lng,
    Boolean(customRoutePath),
  ]);

  // Sync Static Markers (Kantor Polisi, Armada Patroli, Hotspots)
  // HANYA dipanggil saat filter/data statis berubah, TIDAK PERNAH ter-trigger saat personil bergerak
  const renderMarkers = (map: any, maps: any) => {
    // Clear old static markers & polylines
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    patrolPolylinesRef.current.forEach((p) => {
      try { p.setMap(null); } catch (_) {}
    });
    patrolPolylinesRef.current = [];

    // 1. Police Offices / Mako (Dinamis Murni dari Database Tabel auth_units)
    (policeOffices || []).forEach((office) => {
      const officePos = { lat: Number(office.lat), lng: Number(office.lng) };
      if (!officePos.lat || !officePos.lng) return;

      const makoIcon = makeHaloBadgeIcon('🏢', '#1E3A8A', '#93C5FD');
      const makoMarker = new maps.Marker({
        position: officePos,
        map,
        icon: makoIcon,
        title: office.name,
        zIndex: 800,
      });

      const officeUnitData: MapUnitData = {
        key: `office_${office.id}`,
        pos: officePos,
        iconEmoji: office.iconEmoji || '🏢',
        title: office.name,
        petugas: office.petugas,
        sub: office.address,
        status: office.status,
        statusColor: office.statusColor || '#1E3A8A',
        tugas: office.tugas,
        telemetri: office.telemetri,
      };

      makoMarker.addListener('click', () => {
        handleUnitClick(officeUnitData);
        openMarkerDetailWindow(makoMarker, {
          title: office.name,
          subTitle: office.address || 'Kantor Polisi & Mako Sektor',
          petugas: office.petugas && office.petugas !== '-' ? `Personel: ${office.petugas}` : office.name,
          badgeText: office.type || 'MAKO AKTIF',
          badgeColor: '#1E3A8A',
          address: office.address,
          activity: office.tugas || 'Pusat Komando & Pengendalian Operasi',
          status: office.status || 'MAKO AKTIF',
          lat: officePos.lat,
          lng: officePos.lng,
          icon: '🏢',
        });
      });
      markersRef.current.push(makoMarker);
    });

    // 2. Operational Fleet Units & On-Duty Picket Personnel
    if (showOtherOfficers) {
      (fleetUnits || []).forEach((unit) => {
        if (myUnit) {
          const myNrp = (myUnit as any).nrp || (myUnit as any).callsign;
          if (
            unit.key === myUnit.key ||
            (myNrp && (unit.nrp === myNrp || unit.callsign === myNrp || unit.key?.includes(myNrp)))
          ) {
            return;
          }
        }

        const cat = (unit.category || unit.key || '').toLowerCase();

        // Apply active filter
        if (activeFilter === 'samapta' && !cat.includes('samapta')) return;
        if (activeFilter === 'perintis' && !cat.includes('perintis')) return;
        if (activeFilter === 'lantas' && !cat.includes('lantas') && !cat.includes('pjr')) return;
        if (activeFilter === 'reskrim' && !cat.includes('reskrim')) return;
        if (activeFilter === 'intelkam' && !cat.includes('intelkam')) return;
        if (activeFilter === 'binmas' && !cat.includes('binmas')) return;
        if (activeFilter === 'pawas' && !cat.includes('pawas')) return;
        if (activeFilter === 'hotspot') return;

        const isFocused = focusedUnitKey === unit.key;

        let strokeColor = unit.statusColor || '#0284C7';
        let haloColor = '#38BDF8';
        if (unit.status === 'DARURAT') {
          strokeColor = '#EF4444';
          haloColor = '#F87171';
        } else if (cat.includes('perintis')) {
          strokeColor = '#D97706';
          haloColor = '#FBBF24';
        } else if (cat.includes('lantas') || cat.includes('pjr')) {
          strokeColor = '#1D4ED8';
          haloColor = '#60A5FA';
        } else if (cat.includes('reskrim')) {
          strokeColor = '#8B5CF6';
          haloColor = '#C4B5FD';
        } else if (cat.includes('pawas')) {
          strokeColor = '#2563EB';
          haloColor = '#93C5FD';
        }

        const shortName = unit.namaLengkap || unit.title || unit.petugas;
        const statusBadgeStr = unit.statusLabel || (unit.status === 'PATROLI' ? 'Patroli' : unit.status);
        const subSector = unit.lokasiTeks || unit.sub || '';
        const shortSub = `${statusBadgeStr} • ${subSector}`;

        const pos = unit.pos || (unit.lat && unit.lng ? { lat: Number(unit.lat), lng: Number(unit.lng) } : null);
        if (!pos || !pos.lat || !pos.lng) return;

        const icon = makeTacticalUnitIcon(
          unit.iconEmoji || '👮',
          strokeColor,
          haloColor,
          shortName,
          shortSub,
          isFocused
        );

        const marker = new maps.Marker({
          position: pos,
          map,
          icon,
          title: `${unit.title} - ${unit.status}`,
          zIndex: isFocused ? 1200 : 900,
        });

        marker.addListener('click', () => {
          handleUnitClick(unit);
          openMarkerDetailWindow(marker, {
            title: shortName || 'Petugas Patroli',
            subTitle: `${unit.satuan || 'Satuan Operasional'} • NRP: ${unit.nrp || '-'}`,
            petugas: unit.namaLengkap || unit.title || unit.petugas,
            badgeText: unit.statusLabel || unit.status || 'PATROLI',
            badgeColor: strokeColor,
            address: unit.lokasiTeks || unit.sub || 'Area Patroli Wilayah',
            activity: unit.tugas || unit.aktivitas || 'Patroli Keamanan & Ketertiban',
            status: unit.status || 'AKTIF',
            lat: pos.lat,
            lng: pos.lng,
            icon: unit.iconEmoji || '👮',
          });
        });

        markersRef.current.push(marker);

        // Render tactical patrol route polyline (Prioritas 1: Google Directions, Tier 2: OSRM, Tier 3: Tactical)
        if ((showPatrolRoutes || isFocused || unit.status === 'DARURAT') && unit.routePoints && unit.routePoints.length >= 2) {
          const originPos = unit.routePoints[0];
          const destPos = unit.routePoints[1];
          const isEmergency = unit.status === 'DARURAT';

          const arrowIcons = maps.SymbolPath?.FORWARD_CLOSED_ARROW ? [{
            icon: {
              path: maps.SymbolPath.FORWARD_CLOSED_ARROW,
              scale: isFocused ? 2.6 : 2.0,
              strokeColor: isEmergency ? '#7F1D1D' : '#065F46',
              fillColor: isEmergency ? '#FBBF24' : strokeColor,
              fillOpacity: 1,
            },
            offset: '40px',
            repeat: '100px',
          }] : undefined;

          // Render instant curve (mencegah garis lurus memotong bangunan sebelum rute directions siap)
          const initialPath = unit.routePoints.length === 2
            ? generateTacticalPath(originPos.lat, originPos.lng, destPos.lat, destPos.lng)
            : unit.routePoints;

          const poly = new maps.Polyline({
            path: initialPath,
            strokeColor: isEmergency ? '#EF4444' : strokeColor,
            strokeOpacity: isFocused ? 0.95 : 0.8,
            strokeWeight: isFocused ? 5.5 : 4,
            icons: arrowIcons,
            zIndex: isFocused ? 950 : 700,
            map: mapInstanceRef.current || map,
          });
          patrolPolylinesRef.current.push(poly);

          if (unit.routePoints.length === 2) {
            getBestRoadRoute(maps, originPos, destPos).then((roadRoute) => {
              if (roadRoute && roadRoute.path && roadRoute.path.length >= 2 && (mapInstanceRef.current || map)) {
                poly.setPath(roadRoute.path);
              }
            });
          }
        }
      });
    }

    // 3. Hotspots / Titik Rawan (Dinamis Murni dari Database Tabel geo_hotspot_locations)
    if (activeFilter === 'all' || activeFilter === 'hotspot') {
      (hotspots || []).forEach((h: any) => {
        const hotspotPos = h.pos || { lat: Number(h.lat), lng: Number(h.lng) };
        if (!hotspotPos || !hotspotPos.lat || !hotspotPos.lng) return;

        const icon = makeHaloBadgeIcon('🔴', '#DC2626', '#F87171');
        const marker = new maps.Marker({
          position: hotspotPos,
          map,
          icon,
          title: h.title,
          zIndex: 950,
        });

        const hotspotUnitData: MapUnitData = {
          key: h.key || (h.id ? `hotspot_${h.id}` : 'hotspot'),
          pos: hotspotPos,
          iconEmoji: h.ikonEmoji || h.iconEmoji || '🔴',
          title: h.title,
          petugas: h.wilayahPolsek || h.wilayah_polsek || h.wilayah || h.petugas,
          sub: h.kategori || h.sub,
          status: h.statusBahaya || h.status_bahaya || h.status,
          statusColor: '#DC2626',
          tugas: h.jadwalDisplay || h.jadwal_display || h.jadwal || h.tugas,
          telemetri: `Koordinat: ${hotspotPos.lat.toFixed(4)}, ${hotspotPos.lng.toFixed(4)}`,
        };

        marker.addListener('click', () => {
          handleUnitClick(hotspotUnitData);
          openMarkerDetailWindow(marker, {
            title: h.title || 'Titik Rawan Kriminalitas',
            subTitle: h.category || h.kategori || 'Area Pantauan Prioritas',
            petugas: h.wilayahPolsek || 'Wilayah Hukum Polres Pekalongan',
            badgeText: h.statusBahaya || 'RAWAN',
            badgeColor: '#DC2626',
            address: h.address || h.lokasi || 'Jalan Raya Wilayah Pekalongan',
            activity: h.jadwalDisplay || 'Patroli Intensif Presisi',
            status: 'TITIK RAWAN',
            lat: hotspotPos.lat,
            lng: hotspotPos.lng,
            icon: '⚠️',
          });
        });

        markersRef.current.push(marker);
      });
    }
  };

  useEffect(() => {
    if (mapInstanceRef.current && (window as any).google?.maps) {
      const maps = (window as any).google.maps;
      renderMarkers(mapInstanceRef.current, maps);
    }
  }, [
    activeFilter,
    showOtherOfficers,
    showPatrolRoutes,
    focusedUnitKey,
    hotspots,
    policeOffices,
    fleetUnits,
  ]);

  // Center & zoom to focused unit or TKP when selected
  useEffect(() => {
    if (!focusedUnitKey || !mapInstanceRef.current) return;
    if (focusedUnitKey.startsWith('tkp_') && targetComplaint) {
      const tLat = targetComplaint.tkpLat ?? targetComplaint.lat ?? targetComplaint.tkp_lat;
      const tLng = targetComplaint.tkpLng ?? targetComplaint.lng ?? targetComplaint.tkp_lng;
      if (tLat && tLng) {
        mapInstanceRef.current.panTo({ lat: Number(tLat), lng: Number(tLng) });
        mapInstanceRef.current.setZoom(16);
        return;
      }
    }
    if (!fleetUnits) return;
    const target = fleetUnits.find((u) => u.key === focusedUnitKey);
    if (target?.pos?.lat && target?.pos?.lng) {
      mapInstanceRef.current.panTo({ lat: Number(target.pos.lat), lng: Number(target.pos.lng) });
      mapInstanceRef.current.setZoom(16);
    }
  }, [focusedUnitKey, fleetUnits, targetComplaint]);

  // Center dynamically when centerLat / centerLng change
  useEffect(() => {
    if (mapInstanceRef.current && centerLat && centerLng) {
      mapInstanceRef.current.panTo({ lat: Number(centerLat), lng: Number(centerLng) });
    }
  }, [centerLat, centerLng]);

  // Auto-follow kamera ke posisi personil secara terus-menerus (Camera Navigation Follow Mode)
  useEffect(() => {
    if (!followMyUnit || !mapInstanceRef.current) {
      hasInitiallyZoomedRef.current = false;
      return;
    }
    const lat = myUnit?.pos?.lat;
    const lng = myUnit?.pos?.lng;
    if (lat && lng && Number(lat) !== 0) {
      const pos = { lat: Number(lat), lng: Number(lng) };
      if (!hasInitiallyZoomedRef.current) {
        hasInitiallyZoomedRef.current = true;
        mapInstanceRef.current.setZoom(16);
        mapInstanceRef.current.panTo(pos);
      } else {
        mapInstanceRef.current.panTo(pos);
      }
    }
  }, [followMyUnit, myUnit?.pos?.lat, myUnit?.pos?.lng]);

// Center to my unit / GPS
const handleCenterGps = () => {
  if (!mapInstanceRef.current) return;
  if (myUnit?.pos?.lat && myUnit?.pos?.lng) {
    mapInstanceRef.current.panTo({ lat: myUnit.pos.lat, lng: myUnit.pos.lng });
    mapInstanceRef.current.setZoom(15);
  } else if (typeof window !== 'undefined' && navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.panTo({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
          mapInstanceRef.current.setZoom(15);
        }
      },
      (err) => {
        console.warn('GPS unit tidak ditemukan:', err);
      }
    );
  }
};

// Zoom In / Out
const handleZoomIn = () => {
  if (mapInstanceRef.current) {
    mapInstanceRef.current.setZoom(mapInstanceRef.current.getZoom() + 1);
  }
};

const handleZoomOut = () => {
  if (mapInstanceRef.current) {
    mapInstanceRef.current.setZoom(mapInstanceRef.current.getZoom() - 1);
  }
};

  const effectiveHeight = mode === 'fullscreen' ? '100%' : (height || '350px');

  return (
    <div style={{ position: 'relative', width: '100%', height: effectiveHeight, minHeight: mode === 'fullscreen' ? '100%' : undefined, overflow: 'hidden' }}>
      {/* Native Google Maps Canvas */}
      <div
        ref={mapContainerRef}
        style={{
          width: '100%',
          height: '100%',
          minHeight: '100%',
          background: '#E2E8F0',
        }}
      />

    {/* Floating Map Controls */}
    <div
      id="floating-map-controls"
      className="floating-map-controls"
      style={{
        position: 'absolute',
        zIndex: 30,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        transition: 'right 0.3s cubic-bezier(0.4, 0, 0.2, 1), bottom 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        ...(controlsPosition === 'bottom-left'
          ? {
              bottom: controlsBottomOffset ?? '24px',
              left: '16px',
              ...(controlsBottomOffset ? { ['--map-controls-bottom' as any]: controlsBottomOffset } : {}),
            }
          : controlsPosition === 'top-right'
          ? { top: '12px', right: controlsRightOffset ?? '12px' }
          : {
              bottom: controlsBottomOffset ?? '24px',
              right: controlsRightOffset ?? '20px',
              ...(controlsBottomOffset ? { ['--map-controls-bottom' as any]: controlsBottomOffset } : {}),
            }),
      }}
    >
      {/* SOS Button */}
      {onOpenSos && (
        <button
          type="button"
          onClick={onOpenSos}
          title="Sinyal Darurat / Panic Button"
          style={{
            width: '38px',
            height: '38px',
            background: '#EF4444',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            boxShadow: '0 4px 10px rgba(239,68,68,0.4)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            transition: 'transform 0.15s ease',
          }}
          onMouseOver={(e) => ((e.currentTarget as HTMLElement).style.transform = 'scale(1.08)')}
          onMouseOut={(e) => ((e.currentTarget as HTMLElement).style.transform = 'scale(1)')}
        >
          <AlertTriangle size={18} />
        </button>
      )}

      {/* Zoom In */}
      <button
        type="button"
        onClick={handleZoomIn}
        title="Perbesar Peta (+)"
        style={{
          width: '38px',
          height: '38px',
          background: '#FFFFFF',
          color: '#1E293B',
          border: '1px solid #CBD5E1',
          borderRadius: '8px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Plus size={18} strokeWidth={2.5} />
      </button>

      {/* Zoom Out */}
      <button
        type="button"
        onClick={handleZoomOut}
        title="Perkecil Peta (−)"
        style={{
          width: '38px',
          height: '38px',
          background: '#FFFFFF',
          color: '#1E293B',
          border: '1px solid #CBD5E1',
          borderRadius: '8px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Minus size={18} strokeWidth={2.5} />
      </button>

      {/* GPS Center */}
      <button
        type="button"
        onClick={handleCenterGps}
        title="Pusatkan ke Posisi GPS Saya"
        style={{
          width: '38px',
          height: '38px',
          background: '#FFFFFF',
          color: '#0284C7',
          border: '1px solid #CBD5E1',
          borderRadius: '8px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <LocateFixed size={18} strokeWidth={2.2} />
      </button>

      {/* Fullscreen Toggle (if in beranda) */}
      {mode === 'beranda' && onFullscreen && (
        <button
          type="button"
          onClick={onFullscreen}
          title="Buka Peta Taktis Layar Penuh"
          style={{
            width: '38px',
            height: '38px',
            background: '#0F2D56',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            boxShadow: '0 4px 10px rgba(15,45,86,0.35)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Maximize2 size={16} />
        </button>
      )}
    </div>
  </div>
);
}
