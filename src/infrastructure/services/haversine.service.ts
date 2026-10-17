/**
 * SIMAPRES 110 - HAVERSINE GEOLOCATION SERVICE
 * Menghitung deviasi jarak antara koordinat klaim laporan vs koordinat aktual sensor GPS HP
 * Lapisan: Infrastructure / Services
 */

export class HaversineService {
  private static readonly EARTH_RADIUS_METERS = 6371000;

  /**
   * Menghitung jarak garis lurus (great-circle distance) dalam satuan meter
   */
  public static calculateDistanceMeters(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const toRad = (angle: number) => (angle * Math.PI) / 180;

    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = this.EARTH_RADIUS_METERS * c;

    return Math.round(distance * 100) / 100;
  }

  /**
   * Menghitung jarak dalam kilometer
   */
  public static calculateDistanceKm(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const meters = this.calculateDistanceMeters(lat1, lng1, lat2, lng2);
    return Math.round((meters / 1000) * 100) / 100;
  }

  /**
   * Evaluasi audit deviasi lokasi
   * Threshold standar: >= 500 meter = Mismatch Flagged
   */
  public static evaluateDeviation(
    claimedLat: number,
    claimedLng: number,
    actualLat: number,
    actualLng: number,
    thresholdMeters = 500
  ): {
    deviasiMeter: number;
    isFlagged: boolean;
    statusValidasi: 'VALID' | 'FLAGGED_AUDIT';
  } {
    const deviasiMeter = this.calculateDistanceMeters(
      claimedLat,
      claimedLng,
      actualLat,
      actualLng
    );
    const isFlagged = deviasiMeter >= thresholdMeters;

    return {
      deviasiMeter,
      isFlagged,
      statusValidasi: isFlagged ? 'FLAGGED_AUDIT' : 'VALID',
    };
  }
}
