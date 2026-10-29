'use client';

import React, { useState, useEffect } from 'react';
import { Users, X, Shield, Check, Loader2, Search, Plus } from 'lucide-react';
import { addCrewPartnerToDispatchAction, getAvailableStationOfficersAction } from '@/app/actions/complaint.actions';
import type { ComplaintData, OfficerProfile } from '../types';
import TacticalModalFooter from '@/components/ui/TacticalModalFooter';
import TacticalAlert from '@/components/ui/TacticalAlert';

interface ModalTambahRekanReguProps {
  isOpen: boolean;
  complaint: ComplaintData | null;
  officer: OfficerProfile;
  onClose: () => void;
  onSuccess: (partnerName: string) => void;
}

export interface SelectedPartner {
  id?: string;
  name: string;
  nrp?: string;
  pangkat?: string;
  isManual?: boolean;
}

// Module-level in-memory cache daftar personil dinas per Mako/Station
const stationOfficersCache = new Map<string | number, any[]>();

/**
 * Parsing data rekan regu yang tersimpan di dispatch:
 * Mendukung pemisahan pipe '|' atau regex awalan pangkat Polri agar gelar akademik (S.H., S.I.K., S.E., dll) tidak terpotong.
 * Mencocokkan langsung ke daftar personil stasiun berdasarkan NRP/Nama agar checkbox tetap terpilih (checked).
 */
function parseExistingPartners(
  existingPartnerName: string,
  existingPartnerNrp: string,
  officersList: any[]
): SelectedPartner[] {
  if (!existingPartnerName || !existingPartnerName.trim()) return [];

  const rawNrps = (existingPartnerNrp || '')
    .split(/[|,]/)
    .map((s) => s.trim())
    .filter(Boolean);

  // 1. Jika terdapat NRP dan daftar personil stasiun tersedia, cocokkan 100% presisi dengan NRP
  if (rawNrps.length > 0 && officersList && officersList.length > 0) {
    const matchedList: SelectedPartner[] = [];

    for (const nrp of rawNrps) {
      const found = officersList.find(
        (o) => String(o.nrp) === nrp || String(o.id) === nrp
      );
      if (found) {
        matchedList.push({
          id: String(found.id),
          name: found.full_name || found.name,
          nrp: found.nrp,
          pangkat: found.pangkat || found.rank,
          isManual: false,
        });
      }
    }

    if (matchedList.length === rawNrps.length) {
      return matchedList;
    }
  }

  // 2. Pemecahan nama: jika ada delimiter pipe '|' atau '//' atau '•'
  let rawNames: string[] = [];
  if (existingPartnerName.includes('|') || existingPartnerName.includes('//') || existingPartnerName.includes('•')) {
    rawNames = existingPartnerName.split(/[|/•]+/).map((s) => s.trim()).filter(Boolean);
  } else {
    // Pisahkan koma yang diikuti awalan pangkat Polri (menjaga gelar seperti S.H., S.I.K., S.E., dll)
    const rankRegex = /(?:,\s*)(?=(?:AKP|IPTU|IPDA|AIPTU|AIPDA|BRIPKA|BRIGADIR|BRIPTU|BRIPDA|KOMPOL|AKBP)\b)/i;
    rawNames = existingPartnerName.split(rankRegex).map((s) => s.trim()).filter(Boolean);
  }

  return rawNames.map((name, idx) => {
    const nrp = rawNrps[idx] || undefined;
    // Cari apakah cocok di officersList
    const found = officersList.find((o) => {
      if (nrp && (String(o.nrp) === nrp || String(o.id) === nrp)) return true;
      const oName = (o.full_name || o.name || '').toLowerCase();
      const pName = name.toLowerCase();
      return (
        oName === pName ||
        (pName.length > 5 && oName.includes(pName)) ||
        (oName.length > 5 && pName.includes(oName))
      );
    });

    if (found) {
      return {
        id: String(found.id),
        name: found.full_name || found.name,
        nrp: found.nrp,
        pangkat: found.pangkat || found.rank,
        isManual: false,
      };
    }

    // Jika tidak ditemukan di stasiun, ekstrak pangkat dari awalan nama jika ada
    const matchRank = name.match(/^(AKP|IPTU|IPDA|AIPTU|AIPDA|BRIPKA|BRIGADIR|BRIPTU|BRIPDA|KOMPOL|AKBP)\b/i);
    return {
      id: nrp ? `nrp_${nrp}` : `manual_${idx}`,
      name,
      nrp,
      pangkat: matchRank ? matchRank[1].toUpperCase() : undefined,
      isManual: true,
    };
  });
}

export default function ModalTambahRekanRegu({
  isOpen,
  complaint,
  officer,
  onClose,
  onSuccess,
}: ModalTambahRekanReguProps) {
  const stationId = officer.stationId || (complaint as any)?.station_id || (complaint as any)?.stationId || 60001;

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Inisialisasi awal langsung dari cache memory jika sudah pernah dimuat
  const [availableOfficers, setAvailableOfficers] = useState<any[]>(() => {
    const cached = stationOfficersCache.get(stationId);
    if (cached && cached.length > 0) {
      return cached.filter(
        (o: any) => String(o.id) !== String(officer.id) && String(o.nrp) !== String(officer.nrp)
      );
    }
    return [];
  });

  // Multi-Selection State: Diinisialisasi langsung dari data disposisi penugasan
  const [selectedOfficers, setSelectedOfficers] = useState<SelectedPartner[]>(() => {
    if (!complaint) return [];
    const existingPartner = complaint.dispatches?.find((d: any) => d.crew_partner_name)?.crew_partner_name;
    const existingNrp = complaint.dispatches?.find((d: any) => d.crew_partner_nrp)?.crew_partner_nrp || '';
    if (!existingPartner) return [];
    return parseExistingPartners(existingPartner, existingNrp, availableOfficers);
  });

  const [customName, setCustomName] = useState('');
  const [customNrp, setCustomNrp] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Sinkronisasi ulang saat modal dibuka atau saat availableOfficers selesai dimuat
  useEffect(() => {
    if (!isOpen || !complaint) return;
    const existingPartner = complaint.dispatches?.find((d: any) => d.crew_partner_name)?.crew_partner_name;
    const existingNrp = complaint.dispatches?.find((d: any) => d.crew_partner_nrp)?.crew_partner_nrp || '';
    if (!existingPartner) return;

    const parsed = parseExistingPartners(existingPartner, existingNrp, availableOfficers);
    if (parsed.length > 0) {
      setSelectedOfficers(parsed);
    }
  }, [isOpen, complaint?.id, availableOfficers]);

  // Muat daftar personil dinas aktif di Mako yang bersangkutan
  useEffect(() => {
    if (!isOpen) {
      setLoading(false);
      return;
    }

    // Jika data sudah tersedia di cache memory untuk station ini, langsung gunakan tanpa request server
    const cached = stationOfficersCache.get(stationId);
    if (cached && cached.length > 0) {
      const filtered = cached.filter(
        (o: any) => String(o.id) !== String(officer.id) && String(o.nrp) !== String(officer.nrp)
      );
      setAvailableOfficers(filtered);
      setLoading(false);
      return;
    }

    let isCancelled = false;
    setLoading(true);
    setErrorMsg(null);

    getAvailableStationOfficersAction(stationId)
      .then((res) => {
        if (isCancelled) return;
        if (res?.success && Array.isArray(res.data)) {
          // Simpan ke cache memory station
          stationOfficersCache.set(stationId, res.data);

          // Filter agar personil yang sedang login tidak memilih dirinya sendiri
          const filtered = res.data.filter(
            (o: any) => String(o.id) !== String(officer.id) && String(o.nrp) !== String(officer.nrp)
          );
          setAvailableOfficers(filtered);
        } else {
          setErrorMsg(res?.error || 'Gagal memuat personil piket.');
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          console.warn('Gagal memuat personil dinas:', err);
          setErrorMsg('Terjadi kendala saat memuat personil dinas.');
        }
      })
      .finally(() => {
        setLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [isOpen, stationId, officer.id, officer.nrp]);

  if (!isOpen || !complaint) return null;

  const filteredOfficers = availableOfficers.filter((o) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (o.full_name || o.name || '').toLowerCase().includes(q) ||
      (o.nrp || '').toLowerCase().includes(q) ||
      (o.pangkat || '').toLowerCase().includes(q)
    );
  });

  // Toggle selection personil dinas dari daftar
  const toggleOfficer = (off: any) => {
    const offId = String(off.id);
    const exists = selectedOfficers.some(
      (p) => (p.id && p.id === offId) || (p.nrp && off.nrp && p.nrp === off.nrp)
    );

    if (exists) {
      setSelectedOfficers((prev) =>
        prev.filter((p) => !(p.id === offId || (p.nrp && off.nrp && p.nrp === off.nrp)))
      );
    } else {
      setSelectedOfficers((prev) => [
        ...prev,
        {
          id: offId,
          name: off.full_name || off.name || '',
          nrp: off.nrp || '',
          pangkat: off.pangkat || off.rank || '',
          isManual: false,
        },
      ]);
    }
  };

  // Tambahkan personil manual ke daftar
  const handleAddManualOfficer = () => {
    const name = customName.trim();
    if (!name) return;
    const nrp = customNrp.trim();

    if (selectedOfficers.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
      setErrorMsg(`Rekan "${name}" sudah ada dalam daftar terpilih.`);
      return;
    }

    setSelectedOfficers((prev) => [
      ...prev,
      {
        id: `manual_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name,
        nrp: nrp || undefined,
        isManual: true,
      },
    ]);
    setCustomName('');
    setCustomNrp('');
    setErrorMsg(null);
  };

  // Hapus personil dari daftar terpilih
  const removeOfficer = (identifier: string) => {
    setSelectedOfficers((prev) => prev.filter((p) => (p.id || p.name) !== identifier));
  };

  // Simpan seluruh personil regu
  const handleSavePartner = async () => {
    let finalOfficers = [...selectedOfficers];

    // Jika user mengetik nama di input manual tanpa menekan tombol "Tambah", sertakan otomatis
    if (customName.trim()) {
      const manualName = customName.trim();
      if (!finalOfficers.some((p) => p.name.toLowerCase() === manualName.toLowerCase())) {
        finalOfficers.push({
          id: `manual_${Date.now()}`,
          name: manualName,
          nrp: customNrp.trim() || undefined,
          isManual: true,
        });
      }
    }

    if (finalOfficers.length === 0) {
      setErrorMsg('Pilih minimal 1 personil dinas atau ketik nama rekan regu.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    // Gunakan pemisah pipe ' | ' agar gelar akademik yang mengandung koma (seperti S.H., S.I.K.) tidak terpecah
    const partnerNames = finalOfficers.map((p) => p.name).join(' | ');
    const partnerNrps = finalOfficers.map((p) => p.nrp).filter(Boolean).join(' | ');

    try {
      const res = await addCrewPartnerToDispatchAction({
        complaintId: String(complaint.id),
        partnerName: partnerNames,
        partnerNrp: partnerNrps || undefined,
        partners: finalOfficers.map((p) => ({
          officerId: p.isManual ? undefined : p.id,
          name: p.name,
          nrp: p.nrp,
          pangkat: p.pangkat,
        })),
      });

      if (res.success) {
        onSuccess(partnerNames);
        onClose();
      } else {
        setErrorMsg(res.error || 'Gagal menambahkan rekan regu.');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Terjadi kesalahan sistem.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto pt-4 sm:pt-6 pb-28 sm:pb-6 animate-in fade-in">
      <div
        className="relative w-full max-w-lg max-h-[75vh] sm:max-h-[85vh] flex flex-col rounded-3xl overflow-hidden shadow-2xl border my-auto"
        style={{
          background: 'linear-gradient(180deg, #161922 0%, #0E1017 100%)',
          borderColor: 'rgba(59, 130, 246, 0.4)',
          boxShadow: '0 25px 60px -10px rgba(0, 0, 0, 0.9), 0 0 35px rgba(59, 130, 246, 0.25)',
        }}
      >
        {/* Header - Fixed Top */}
        <div
          className="p-4 sm:p-5 flex items-center justify-between border-b flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.2) 0%, rgba(30, 64, 175, 0.1) 100%)',
            borderColor: 'rgba(59, 130, 246, 0.25)',
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-400">
              <Users size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>Tambah Rekan Regu</span>
              </h3>
              <p className="text-xs text-slate-300">
                Pilih atau tambahkan personil <br className="sm:hidden" /> #{complaint.nomorTiket}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body - Only this section scrolls */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 min-h-0">
          <TacticalAlert
            variant="error"
            message={errorMsg}
            onClose={() => setErrorMsg(null)}
          />

          {/* Chips Regu Terpilih (Multi-personnel Badge List) */}
          {selectedOfficers.length > 0 && (
            <div className="p-3 rounded-2xl bg-blue-950/40 border border-blue-500/30 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-blue-300">
                <span className="flex items-center gap-1.5">
                  <Users size={14} className="text-blue-400" />
                  <span>Personil Regu Terpilih:</span>
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedOfficers([])}
                  className="text-[11px] text-slate-400 hover:text-red-400 transition-colors underline"
                >
                  Hapus Semua
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                {selectedOfficers.map((p) => {
                  const rank = p.pangkat || '';
                  const hasRankInName = rank && p.name.toLowerCase().startsWith(rank.toLowerCase());
                  const displayName = !hasRankInName && rank ? `${rank} ${p.name}` : p.name;

                  return (
                    <div
                      key={p.id || p.name}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/30 border border-blue-400/50 text-xs text-white shadow-sm"
                    >
                      <Shield size={12} className="text-blue-400 flex-shrink-0" />
                      <span className="font-semibold truncate max-w-[190px]" title={displayName}>
                        {displayName}
                      </span>
                      {p.nrp && <span className="text-[10px] text-slate-300">({p.nrp})</span>}
                      <button
                        type="button"
                        onClick={() => removeOfficer(p.id || p.name)}
                        className="w-4 h-4 rounded-full hover:bg-red-500/40 text-slate-300 hover:text-red-200 flex items-center justify-center transition-colors ml-0.5"
                        title="Hapus dari regu"
                      >
                        <X size={11} strokeWidth={2.5} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Search Personil */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-300">
                Pilih Dari Personel Dinas Hari Ini
              </label>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                Dapat memilih lebih dari 1 personil
              </span>
            </div>
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama, pangkat, atau NRP rekan..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* List Available Officers */}
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {loading ? (
              <div className="py-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin text-blue-400" />
                <span>Memuat data personil piket...</span>
              </div>
            ) : filteredOfficers.length > 0 ? (
              filteredOfficers.map((off) => {
                const offId = String(off.id);
                const isSelected = selectedOfficers.some(
                  (p) =>
                    (p.id && p.id === offId) ||
                    (p.nrp && off.nrp && p.nrp === off.nrp) ||
                    (p.name &&
                      (off.full_name || off.name) &&
                      p.name.toLowerCase() === (off.full_name || off.name).toLowerCase())
                );

                return (
                  <div
                    key={off.id}
                    onClick={() => toggleOfficer(off)}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-blue-600/25 border-blue-500 shadow-md shadow-blue-500/10'
                        : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                          isSelected ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        <Shield size={14} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">
                          {off.full_name || off.name}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {off.pangkat || off.rank || 'Personel'} • NRP: {off.nrp || '-'}
                        </div>
                      </div>
                    </div>

                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 border transition-all ${
                        isSelected
                          ? 'bg-blue-500 border-blue-400 text-white'
                          : 'bg-slate-800/80 border-slate-700 text-transparent'
                      }`}
                    >
                      <Check size={14} strokeWidth={3} />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-4 text-center text-xs text-slate-500">
                Tidak ada personil yang sesuai pencarian. Anda dapat menginput manual di bawah.
              </div>
            )}
          </div>

          {/* Custom Input (Jika rekan berasal dari satuan gabungan / luar daftar) */}
          <div className="pt-3 border-t border-slate-800/80 space-y-2.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Atau Tambah Manual Rekan Regu
            </div>

            <div className="flex flex-col sm:flex-row items-end gap-2">
              <div className="flex-1 w-full">
                <label className="text-[11px] text-slate-400 block mb-1">Nama Rekan Regu *</label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddManualOfficer();
                    }
                  }}
                  placeholder="Contoh: Briptu Dian Pratama"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="w-full sm:w-36">
                <label className="text-[11px] text-slate-400 block mb-1">NRP (Opsional)</label>
                <input
                  type="text"
                  value={customNrp}
                  onChange={(e) => setCustomNrp(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddManualOfficer();
                    }
                  }}
                  placeholder="Contoh: 92080112"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="button"
                onClick={handleAddManualOfficer}
                disabled={!customName.trim()}
                className="w-full sm:w-auto h-[35px] px-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-blue-600/20 flex-shrink-0"
              >
                <Plus size={14} />
                <span>Tambah</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions: Reusable TacticalModalFooter */}
        <TacticalModalFooter
          onCancel={onClose}
          cancelText="Batal"
          submitText={`Simpan ${selectedOfficers.length > 0 ? `(${selectedOfficers.length})` : ''}`}
          loadingText="Menyimpan..."
          isSubmitting={submitting}
          disabled={submitting || (selectedOfficers.length === 0 && !customName.trim())}
          submitType="button"
          onSubmit={handleSavePartner}
          submitIcon={<Users size={16} />}
          variant="blue"
          className="p-3.5 sm:p-4 bg-slate-950/95 backdrop-blur-md sticky bottom-0 z-30 shadow-2xl !border-blue-500/30"
          extraLeft={
            <div className="text-xs text-slate-300">
              Total Regu: <br className="sm:hidden" />
              <span className="font-extrabold text-white text-sm sm:text-xs">
                {selectedOfficers.length + (customName.trim() ? 1 : 0)} Personil
              </span>
            </div>
          }
        />
      </div>
    </div>
  );
}
