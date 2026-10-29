/**
 * Tactical calculation & SOP helpers shared between Operator and Pawas roles
 */

export function calculateDistanceHaversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  if (!lat1 || !lng1 || !lat2 || !lng2) return 0;
  const toRad = (angle: number) => (angle * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const meters = 6371000 * c;
  return Math.round((meters / 1000) * 10) / 10;
}

export function getSopRecommendationByIncident(item: any, dbSubcategories: any[] = []) {
  if (!item) {
    return {
      primarySatuanId: null,
      secondarySatuanIds: [],
      kasusSpesifik: null,
      sopText: null,
    };
  }

  const sub = item?.subcategory || item?.subcategory_rel;
  const targetSubId = item?.subcategory_id || item?.subcategoryId;
  const matchedSub =
    sub ||
    (targetSubId && dbSubcategories.length > 0
      ? dbSubcategories.find((s: any) => s.id === Number(targetSubId))
      : null) ||
    (dbSubcategories.length > 0 && item?.jenisKejadian
      ? dbSubcategories.find(
          (s: any) => s.nama_kasus?.toLowerCase().trim() === item.jenisKejadian?.toLowerCase().trim()
        )
      : null);

  const unitKey = matchedSub?.unit_key || matchedSub?.unit_rel?.key || item?.subUnitKey;

  if (unitKey) {
    const primarySatuanId = unitKey === 'samapta' ? 'sabhara' : unitKey;
    return {
      primarySatuanId,
      secondarySatuanIds: [],
      kasusSpesifik: matchedSub?.nama_kasus || item?.jenisKejadian || null,
      sopText: matchedSub?.deskripsi_sop || null,
    };
  }

  return {
    primarySatuanId: null,
    secondarySatuanIds: [],
    kasusSpesifik: item?.jenisKejadian || null,
    sopText: null,
  };
}
