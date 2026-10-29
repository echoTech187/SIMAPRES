import { describe, it, expect } from 'vitest';
import { HaversineService } from '../haversine.service';
import { FuelAuditService } from '../fuel-audit.service';

describe('Haversine Geodetic & Fuel Audit Service', () => {
  // Alun-alun Kajen (-7.026779, 109.593080)
  const KAJEN_LAT = -7.026779;
  const KAJEN_LNG = 109.59308;

  // Polsek Kedungwuni (-6.974444, 109.658889) (~9.3 km garis lurus)
  const KEDUNGWUNI_LAT = -6.974444;
  const KEDUNGWUNI_LNG = 109.658889;

  describe('Haversine Distance Calculation', () => {
    it('returns 0 when coordinates are identical', () => {
      const distance = HaversineService.calculateDistanceMeters(KAJEN_LAT, KAJEN_LNG, KAJEN_LAT, KAJEN_LNG);
      expect(distance).toBe(0);

      const distanceKm = HaversineService.calculateDistanceKm(KAJEN_LAT, KAJEN_LNG, KAJEN_LAT, KAJEN_LNG);
      expect(distanceKm).toBe(0);
    });

    it('calculates accurate distance in meters and kilometers between Kajen and Kedungwuni', () => {
      const distanceMeters = HaversineService.calculateDistanceMeters(
        KAJEN_LAT,
        KAJEN_LNG,
        KEDUNGWUNI_LAT,
        KEDUNGWUNI_LNG
      );
      const distanceKm = HaversineService.calculateDistanceKm(
        KAJEN_LAT,
        KAJEN_LNG,
        KEDUNGWUNI_LAT,
        KEDUNGWUNI_LNG
      );

      // Jarak geografis Kajen ke Kedungwuni adalah sekitar 9.0 - 9.5 km
      expect(distanceKm).toBeGreaterThan(8.5);
      expect(distanceKm).toBeLessThan(10.0);
      expect(distanceMeters).toBeCloseTo(distanceKm * 1000, -1);
    });
  });

  describe('Location Deviation Evaluation (Anti-Spoofing Audit)', () => {
    it('passes audit as VALID when deviation is below 500 meter threshold', () => {
      // Deviasi kecil (~50m)
      const nearbyLat = KAJEN_LAT + 0.0003;
      const nearbyLng = KAJEN_LNG + 0.0003;

      const audit = HaversineService.evaluateDeviation(KAJEN_LAT, KAJEN_LNG, nearbyLat, nearbyLng, 500);

      expect(audit.isFlagged).toBe(false);
      expect(audit.statusValidasi).toBe('VALID');
      expect(audit.deviasiMeter).toBeLessThan(500);
    });

    it('flags audit as FLAGGED_AUDIT when deviation exceeds 500 meter threshold', () => {
      // Deviasi jauh ke Kedungwuni (~9 km)
      const audit = HaversineService.evaluateDeviation(
        KAJEN_LAT,
        KAJEN_LNG,
        KEDUNGWUNI_LAT,
        KEDUNGWUNI_LNG,
        500
      );

      expect(audit.isFlagged).toBe(true);
      expect(audit.statusValidasi).toBe('FLAGGED_AUDIT');
      expect(audit.deviasiMeter).toBeGreaterThan(500);
    });
  });

  describe('Fuel Audit Domain Standards', () => {
    it('enforces Road Network Tortuosity Factor of 1.25x for road distance vs direct line', () => {
      expect(FuelAuditService.ROAD_NETWORK_FACTOR).toBe(1.25);
    });
  });
});
