import { describe, it, expect } from 'vitest';
import {
  calculateHaversineDistanceKm,
  evaluateJurisdictionBoundary,
  StationReference,
} from '../jurisdiction-boundary';

// Mock Master Data Stasiun dari Database
const MOCK_DB_POLICE_STATIONS: StationReference[] = [
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
        stations: MOCK_DB_POLICE_STATIONS,
      });

      expect(result.isOutsideJurisdiction).toBe(false);
    });

    it('detects incident outside jurisdiction when address is in neighboring Batang', () => {
      const result = evaluateJurisdictionBoundary({
        tkpAlamat: 'Jl. Jenderal Sudirman No. 10, Batang, Jawa Tengah',
        currentStationId: 60001,
        currentStationName: 'Polres Pekalongan',
        stations: MOCK_DB_POLICE_STATIONS,
      });

      expect(result.isOutsideJurisdiction).toBe(true);
      expect(result.detectedRegionName).toBe('Kabupaten Batang');
    });

    it('detects incident outside jurisdiction when address is in Kota Pekalongan', () => {
      const result = evaluateJurisdictionBoundary({
        tkpAlamat: 'Jl. Hayam Wuruk No. 88, Pekalongan Barat, Kota Pekalongan',
        currentStationId: 60001,
        currentStationName: 'Polres Pekalongan',
        stations: MOCK_DB_POLICE_STATIONS,
      });

      expect(result.isOutsideJurisdiction).toBe(true);
      expect(result.detectedRegionName).toBe('Kota Pekalongan');
    });

    it('detects incident in Kajen as outside jurisdiction when current station is Polres Pekalongan Kota', () => {
      const result = evaluateJurisdictionBoundary({
        tkpAlamat: 'Jalan Mandurorejo, Kajen, Pekalongan, Jawa Tengah, 51156, Indonesia',
        currentStationId: 90001,
        currentStationName: 'Polres Pekalongan Kota',
        stations: MOCK_DB_POLICE_STATIONS,
      });

      expect(result.isOutsideJurisdiction).toBe(true);
      expect(result.detectedRegionName).toBe('Kabupaten Pekalongan');
      expect(result.targetStation?.stationCode).toBe('POLRES-PEKALONGAN');
      expect(result.targetStation?.id).toBe(60001);
    });
  });
});
