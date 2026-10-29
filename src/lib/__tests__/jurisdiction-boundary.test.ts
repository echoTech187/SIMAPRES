import { describe, it, expect } from 'vitest';
import {
  calculateHaversineDistanceKm,
  evaluateJurisdictionBoundary,
} from '../jurisdiction-boundary';

describe('Jurisdiction Boundary & Distance Resolver', () => {
  describe('calculateHaversineDistanceKm', () => {
    it('calculates distance between two points correctly', () => {
      // Polres Pekalongan (-7.026779, 109.59308) to Pekalongan Kota (-6.881372, 109.671882)
      const distance = calculateHaversineDistanceKm(
        -7.026779,
        109.59308,
        -6.881372,
        109.671882
      );
      expect(distance).toBeGreaterThan(15);
      expect(distance).toBeLessThan(20); // ~18 km
    });

    it('returns 0 for identical points', () => {
      const distance = calculateHaversineDistanceKm(
        -7.026779,
        109.59308,
        -7.026779,
        109.59308
      );
      expect(distance).toBe(0);
    });
  });

  describe('evaluateJurisdictionBoundary', () => {
    it('detects incident in current jurisdiction (Kabupaten Pekalongan)', () => {
      const result = evaluateJurisdictionBoundary({
        tkpAlamat: 'Jl. Raya Kajen No. 45, Kabupaten Pekalongan',
        currentStationId: 60001,
        currentStationName: 'Polres Pekalongan',
      });

      expect(result.isOutsideJurisdiction).toBe(false);
    });

    it('detects incident outside jurisdiction when address is in neighboring Batang', () => {
      const result = evaluateJurisdictionBoundary({
        tkpAlamat: 'Jl. Jenderal Sudirman No. 10, Batang, Jawa Tengah',
        currentStationId: 60001,
        currentStationName: 'Polres Pekalongan',
      });

      expect(result.isOutsideJurisdiction).toBe(true);
      expect(result.detectedRegionName).toBe('Kabupaten Batang');
    });

    it('detects incident outside jurisdiction when address is in Kota Pekalongan', () => {
      const result = evaluateJurisdictionBoundary({
        tkpAlamat: 'Jl. Hayam Wuruk No. 88, Pekalongan Barat, Kota Pekalongan',
        currentStationId: 60001,
        currentStationName: 'Polres Pekalongan',
      });

      expect(result.isOutsideJurisdiction).toBe(true);
      expect(result.detectedRegionName).toBe('Kota Pekalongan');
    });
  });
});
