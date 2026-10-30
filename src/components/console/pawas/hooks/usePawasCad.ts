'use client';

import { useState, useRef, useCallback } from 'react';
import { searchIndonesianLocations, type LocationSuggestionItem } from '@/infrastructure/services/indonesian-location-search.service';

/**
 * usePawasCad
 * Single-responsibility hook managing Operator CAD incident creation state and location autocomplete.
 */
export function usePawasCad() {
  const [simCaller, setSimCaller] = useState({
    nomorTiket: '',
    nama: '',
    telepon: '',
    alamat: '',
    kategori: '',
    subcategoryId: undefined as number | undefined,
    urgensi: '',
    uraian: '',
    lat: 0,
    lng: 0,
  });

  const [cadFormErrors, setCadFormErrors] = useState<Record<string, string>>({});
  const [cadLocationSuggestions, setCadLocationSuggestions] = useState<LocationSuggestionItem[]>([]);
  const [isSearchingCadLocation, setIsSearchingCadLocation] = useState(false);
  const [showCadSuggestions, setShowCadSuggestions] = useState(false);
  const searchTimeoutRef = useRef<any>(null);

  const handleCadLocationSearch = useCallback((query: string) => {
    setSimCaller((prev) => ({ ...prev, alamat: query }));
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!query || query.trim().length < 2) {
      setCadLocationSuggestions([]);
      setShowCadSuggestions(false);
      return;
    }

    setIsSearchingCadLocation(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const items = await searchIndonesianLocations(query, {
          lat: simCaller.lat || undefined,
          lng: simCaller.lng || undefined,
          limit: 1000,
        });
        setCadLocationSuggestions(items);
        setShowCadSuggestions(items.length > 0);
      } catch (err) {
        console.warn('Location search error:', err);
      } finally {
        setIsSearchingCadLocation(false);
      }
    }, 200);
  }, [simCaller.lat, simCaller.lng]);

  const handleSelectCadSuggestion = useCallback((item: { fullAddress: string; lat: number; lng: number }) => {
    setSimCaller((prev) => ({
      ...prev,
      alamat: item.fullAddress,
      lat: item.lat,
      lng: item.lng,
    }));
    setCadFormErrors((prev) => {
      const next = { ...prev };
      delete next.alamat;
      return next;
    });
    setShowCadSuggestions(false);
  }, []);

  return {
    simCaller,
    setSimCaller,
    cadFormErrors,
    setCadFormErrors,
    cadLocationSuggestions,
    setCadLocationSuggestions,
    isSearchingCadLocation,
    setIsSearchingCadLocation,
    showCadSuggestions,
    setShowCadSuggestions,
    handleCadLocationSearch,
    handleSelectCadSuggestion,
  };
}
