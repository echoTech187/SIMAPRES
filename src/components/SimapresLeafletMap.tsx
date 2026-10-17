'use client';

// Re-export Native Google Maps with realtime Google TrafficLayer
// Sesuai Prototype personil.js & e-tribrata-log.js 1:1
import SimapresGoogleMap, {
  MapUnitData,
  loadGoogleMaps,
} from './SimapresGoogleMap';

export type { MapUnitData };
export { loadGoogleMaps };
export default SimapresGoogleMap;
