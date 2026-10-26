'use client';

import React, { useState, useEffect } from 'react';
import { UserPlus, Users, X, Shield, Check, Loader2, Search } from 'lucide-react';
import { addCrewPartnerToDispatchAction, getAvailableStationOfficersAction } from '@/app/actions/complaint.actions';
import type { ComplaintData, OfficerProfile } from '../types';

interface ModalTambahRekanReguProps {
  isOpen: boolean;
  complaint: ComplaintData | null;
  officer: OfficerProfile;
  onClose: () => void;
  onSuccess: (partnerName: string) => void;
}

export default function ModalTambahRekanRegu({
  isOpen,
  complaint,
  officer,
  onClose,
  onSuccess,
}: ModalTambahRekanReguProps) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [availableOfficers, setAvailableOfficers] = useState<any[]>([]);
  const [selectedOfficerId, setSelectedOfficerId] = useState<string>('');
  const [customName, setCustomName] = useState('');
  const [customNrp, setCustomNrp] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Muat daftar personil dinas aktif di Mako yang bersangkutan
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoading(true);
    setErrorMsg(null);

    const stationId = officer.stationId || (complaint as any)?.station_id || (complaint as any)?.stationId || 60001;

    getAvailableStationOfficersAction(stationId)
      .then((res) => {
        if (!isMounted) return;
        if (res.success && Array.isArray(res.data)) {
          // Filter agar personil yang sedang login tidak dipilih sendiri
          const filtered = res.data.filter(
            (o: any) => String(o.id) !== String(officer.id) && String(o.nrp) !== String(officer.nrp)
          );
          setAvailableOfficers(filtered);
        }
      })
      .catch((err) => {
        if (isMounted) console.warn('Gagal memuat personil dinas:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, officer.stationId, officer.id, officer.nrp, complaint]);

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

  const handleSelectPredefined = (off: any) => {
    setSelectedOfficerId(String(off.id));
    setCustomName(off.full_name || off.name || '');
    setCustomNrp(off.nrp || '');
  };

  const handleSavePartner = async () => {
    const finalName = customName.trim();
    if (!finalName) {
      setErrorMsg('Pilih personil dinas atau ketik nama rekan regu.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await addCrewPartnerToDispatchAction({
        complaintId: String(complaint.id),
        partnerOfficerId: selectedOfficerId || undefined,
        partnerName: finalName,
        partnerNrp: customNrp.trim() || undefined,
      });

      if (res.success) {
        onSuccess(finalName);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div
        className="relative w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border"
        style={{
          background: 'linear-gradient(180deg, #161922 0%, #0E1017 100%)',
          borderColor: 'rgba(59, 130, 246, 0.4)',
          boxShadow: '0 25px 60px -10px rgba(0, 0, 0, 0.9), 0 0 35px rgba(59, 130, 246, 0.25)',
        }}
      >
        {/* Header */}
        <div
          className="p-5 flex items-center justify-between border-b"
          style={{
            background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.2) 0%, rgba(30, 64, 175, 0.1) 100%)',
            borderColor: 'rgba(59, 130, 246, 0.25)',
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-400">
              <UserPlus size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>Buddy System Lapangan</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  REKAN REGU
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                Tambahkan rekan dinas untuk memperkuat respon tiket #{complaint.nomorTiket}
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

        {/* Content Body */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
              <span>⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Search Personil */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">
              Pilih Personil Regu Dinas Hari Ini
            </label>
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
                const isSelected = selectedOfficerId === String(off.id);
                return (
                  <div
                    key={off.id}
                    onClick={() => handleSelectPredefined(off)}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500 shadow-md shadow-blue-500/10'
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
                          {off.pangkat || 'Personel'} • NRP: {off.nrp || '-'}
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center flex-shrink-0">
                        <Check size={14} strokeWidth={3} />
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="py-4 text-center text-xs text-slate-500">
                Tidak ada personil yang sesuai pencarian. Anda dapat mengetik manual di bawah.
              </div>
            )}
          </div>

          {/* Custom Input (Jika rekan berasal dari satuan gabungan / tidak ada di daftar) */}
          <div className="pt-2 border-t border-slate-800/80 space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Atau Input Manual Rekan Regu
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Nama Rekan Regu *</label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => {
                    setCustomName(e.target.value);
                    setSelectedOfficerId('');
                  }}
                  placeholder="Contoh: Briptu Dian Pratama"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">NRP / Nopen (Opsional)</label>
                <input
                  type="text"
                  value={customNrp}
                  onChange={(e) => setCustomNrp(e.target.value)}
                  placeholder="Contoh: 92080112"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          className="p-4 border-t flex items-center justify-end gap-2.5"
          style={{
            borderColor: 'rgba(59, 130, 246, 0.2)',
            background: 'rgba(15, 23, 42, 0.6)',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Batal
          </button>

          <button
            type="button"
            disabled={submitting || !customName.trim()}
            onClick={handleSavePartner}
            className="px-5 py-2.5 rounded-xl text-xs font-black text-white flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
            }}
          >
            {submitting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <UserPlus size={14} />
                <span>Simpan Rekan Regu</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
