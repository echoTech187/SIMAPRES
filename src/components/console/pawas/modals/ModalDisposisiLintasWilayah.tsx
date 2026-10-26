'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { X, Navigation, Building2, AlertTriangle, ArrowRight, ShieldCheck, MapPin } from 'lucide-react';
import { transferComplaintCrossJurisdictionAction } from '@/app/actions/complaint.actions';
import { HaversineService } from '@/infrastructure/services/haversine.service';
import { getLastDispatchedStationName, getLastDispatchedStationId } from '../tabs/TabOperatorCadPawas';
import { evaluateJurisdictionBoundary } from '@/lib/jurisdiction-boundary';

interface ModalDisposisiLintasWilayahProps {
  complaint: any;
  policeOffices: any[];
  allComplaints?: any[];
  currentStationId?: number | string | null;
  currentStationName?: string | null;
  onClose: () => void;
  onSuccess: (result: any) => void;
}

export default function ModalDisposisiLintasWilayah({
  complaint,
  policeOffices,
  allComplaints,
  currentStationId,
  currentStationName,
  onClose,
  onSuccess,
}: ModalDisposisiLintasWilayahProps) {
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const tkpLat = complaint?.tkpLat ?? complaint?.tkp_lat ?? null;
  const tkpLng = complaint?.tkpLng ?? complaint?.tkp_lng ?? null;

  // Kumpulkan ID stasiun Mako yang tidak memberikan respon untuk dieliminasi
  // PENTING: Mako Asal (Polres Pekalongan / 60001) TIDAK PERNAH diexclude, agar operator dapat menarik kembali tiket untuk diproses mandiri
  const excludedStationIds = useMemo(() => {
    const ids = new Set<string>();

    const makoAsalId = currentStationId ? String(currentStationId) : '60001';

    // 1. Mako yang saat ini sedang memegang tiket / dituju saat ini dan tidak merespon (misal Polsek Pekalongan Selatan / Polresta Batang)
    const currentHoldingId = complaint?.station_id || complaint?.stationId || complaint?.station?.id;
    if (currentHoldingId && String(currentHoldingId) !== makoAsalId && String(currentHoldingId) !== '60001') {
      ids.add(String(currentHoldingId));
    }

    // 2. Seluruh Mako luar dari riwayat dispatches tiket ini yang pernah ditugaskan namun tidak merespon
    const dispatches = Array.isArray(complaint?.dispatches) ? complaint.dispatches : [];
    dispatches.forEach((d: any) => {
      const dId = d.station_id || d.stationId || d.station?.id;
      if (dId && String(dId) !== makoAsalId && String(dId) !== '60001') {
        ids.add(String(dId));
      }
    });

    // 3. Resolusi stasiun terakhir yang tidak memberikan respon via helper
    const lastStId = getLastDispatchedStationId(complaint, policeOffices);
    if (lastStId && String(lastStId) !== makoAsalId && String(lastStId) !== '60001') {
      ids.add(String(lastStId));
    }

    // 4. Mako batas yurisdiksi alami TKP: Jika tiket sudah dalam status DISPOSISI_LINTAS_WILAYAH / pernah dialihkan,
    // maka Mako yurisdiksi luar untuk TKP tersebut (misal Polresta Batang jika TKP di Batang)
    // sudah pernah dituju / diabaikan, sehingga TIDAK BOLEH direkomendasikan lagi!
    try {
      const boundary = evaluateJurisdictionBoundary({
        tkpLat: Number(tkpLat),
        tkpLng: Number(tkpLng),
        tkpAlamat: complaint?.tkpAlamatTeks || complaint?.tkp_alamat_teks || '',
        currentStationId: Number(makoAsalId),
      });
      if (
        boundary?.targetStation?.id &&
        String(boundary.targetStation.id) !== makoAsalId &&
        String(boundary.targetStation.id) !== '60001'
      ) {
        if (complaint?.status === 'DISPOSISI_LINTAS_WILAYAH' || (complaint?.tahap && complaint.tahap >= 2)) {
          ids.add(String(boundary.targetStation.id));
        }
      }
    } catch (_) {}

    // 5. Cek tiket lain di CAD untuk pelapor atau lokasi TKP yang sama (misal duplikasi laporan yang sudah didisposisikan ke Batang)
    const pelaporHp = complaint?.pelaporHp || complaint?.pelapor_hp;
    const alamatTeks = (complaint?.tkpAlamatTeks || complaint?.tkp_alamat_teks || '').toLowerCase().trim();
    if (Array.isArray(allComplaints) && allComplaints.length > 0) {
      allComplaints.forEach((c: any) => {
        if (!c || String(c.id) === String(complaint?.id)) return;
        const cPhone = c.pelaporHp || c.pelapor_hp;
        const cAlamat = (c.tkpAlamatTeks || c.tkp_alamat_teks || '').toLowerCase().trim();
        const isSameCase =
          (pelaporHp && cPhone && pelaporHp === cPhone) ||
          (alamatTeks && cAlamat && (alamatTeks.includes(cAlamat.slice(0, 20)) || cAlamat.includes(alamatTeks.slice(0, 20))));

        if (isSameCase) {
          const cStationId = c.stationId || c.station_id || c.station?.id;
          if (cStationId && String(cStationId) !== makoAsalId && String(cStationId) !== '60001') {
            ids.add(String(cStationId));
          }
          const cDispatches = Array.isArray(c.dispatches) ? c.dispatches : [];
          cDispatches.forEach((d: any) => {
            const dId = d.station_id || d.stationId || d.station?.id;
            if (dId && String(dId) !== makoAsalId && String(dId) !== '60001') {
              ids.add(String(dId));
            }
          });
        }
      });
    }

    return ids;
  }, [currentStationId, complaint, policeOffices, allComplaints, tkpLat, tkpLng]);

  // Kumpulkan nama-nama Mako luar yang tidak memberikan respon
  const excludedStationNames = useMemo(() => {
    const names = new Set<string>();

    const clean = (str: string) =>
      str.toLowerCase().replace(/^(polres|polresta|polsek)\s+/, '').trim();

    const isMakoAsalName = (name: string) => {
      const c = clean(name);
      return (
        c.includes('pekalongan') &&
        !c.includes('selatan') &&
        !c.includes('utara') &&
        !c.includes('barat') &&
        !c.includes('timur') &&
        !c.includes('kota')
      );
    };

    // 1. Nama stasiun yang memegang tiket saat ini (jika bukan Mako Asal)
    const curName = complaint?.station?.station_name || complaint?.station?.name || complaint?.stationName;
    if (curName && !isMakoAsalName(curName)) {
      names.add(clean(curName));
    }

    // 2. Nama stasiun luar dari riwayat dispatches
    const dispatches = Array.isArray(complaint?.dispatches) ? complaint.dispatches : [];
    dispatches.forEach((d: any) => {
      const dName = d.station?.station_name || d.station?.name || d.stationName;
      if (dName && !isMakoAsalName(dName)) {
        names.add(clean(dName));
      }
    });

    // 3. Riwayat audit log DISPOSISI_LINTAS_WILAYAH / pengalihan yurisdiksi
    const logs = complaint?.complaint_logs || complaint?.complaintLogs || complaint?.auditLogs || [];
    if (Array.isArray(logs)) {
      logs.forEach((l: any) => {
        if (!l.notes) return;
        const matchKe = l.notes.match(/Ke:\s*([^|➔\n]+)/i);
        if (matchKe && matchKe[1] && !isMakoAsalName(matchKe[1])) {
          names.add(clean(matchKe[1].replace(/\([^)]*\)/g, '')));
        }
        const matchDialihkan = l.notes.match(/dialihkan\s+ke\s+([^.\n|]+)/i) || l.notes.match(/ke\s+([^.\n|➔]+)/i);
        if (matchDialihkan && matchDialihkan[1] && !isMakoAsalName(matchDialihkan[1])) {
          names.add(clean(matchDialihkan[1]));
        }
      });
    }

    // 4. Nama stasiun terakhir dari helper
    const lastStName = getLastDispatchedStationName(complaint, policeOffices);
    if (lastStName && !isMakoAsalName(lastStName)) {
      names.add(clean(lastStName));
    }

    // 5. Nama Mako batas yurisdiksi alami TKP
    try {
      const boundary = evaluateJurisdictionBoundary({
        tkpLat: Number(tkpLat),
        tkpLng: Number(tkpLng),
        tkpAlamat: complaint?.tkpAlamatTeks || complaint?.tkp_alamat_teks || '',
        currentStationId: Number(currentStationId || 60001),
      });
      if (boundary?.targetStation?.stationName && !isMakoAsalName(boundary.targetStation.stationName)) {
        if (complaint?.status === 'DISPOSISI_LINTAS_WILAYAH' || (complaint?.tahap && complaint.tahap >= 2)) {
          names.add(clean(boundary.targetStation.stationName));
        }
      }
    } catch (_) {}

    // 6. Nama Mako dari tiket lain untuk kasus / pelapor yang sama
    const pelaporHp = complaint?.pelaporHp || complaint?.pelapor_hp;
    const alamatTeks = (complaint?.tkpAlamatTeks || complaint?.tkp_alamat_teks || '').toLowerCase().trim();
    if (Array.isArray(allComplaints) && allComplaints.length > 0) {
      allComplaints.forEach((c: any) => {
        if (!c || String(c.id) === String(complaint?.id)) return;
        const cPhone = c.pelaporHp || c.pelapor_hp;
        const cAlamat = (c.tkpAlamatTeks || c.tkp_alamat_teks || '').toLowerCase().trim();
        const isSameCase =
          (pelaporHp && cPhone && pelaporHp === cPhone) ||
          (alamatTeks && cAlamat && (alamatTeks.includes(cAlamat.slice(0, 20)) || cAlamat.includes(alamatTeks.slice(0, 20))));

        if (isSameCase) {
          const cName = c.station?.station_name || c.station?.name || c.stationName;
          if (cName && !isMakoAsalName(cName)) {
            names.add(clean(cName));
          }
          const cDispatches = Array.isArray(c.dispatches) ? c.dispatches : [];
          cDispatches.forEach((d: any) => {
            const dName = d.station?.station_name || d.station?.name || d.stationName;
            if (dName && !isMakoAsalName(dName)) {
              names.add(clean(dName));
            }
          });
        }
      });
    }

    return names;
  }, [complaint, policeOffices, currentStationId, allComplaints, tkpLat, tkpLng]);

  // Hitung jarak ke seluruh kantor Mako yang tersedia dan urutkan dari yang terdekat
  // Mako yang sudah pernah didisposisikan atau tidak memberikan respon dieliminasi dari daftar
  // PENTING: Mako Asal pembuat laporan tetap dapat dipilih jika tiket gagal direspon oleh Mako lain
  const rankedOffices = useMemo(() => {
    if (!Array.isArray(policeOffices) || policeOffices.length === 0) return [];

    const clean = (str: string) =>
      str.toLowerCase().replace(/^(polres|polresta|polsek)\s+/, '').trim();

    const otherOffices = policeOffices.filter((st: any) => {
      const stName = clean(st.station_name || st.name || '');

      // Mako Asal pembuat laporan SELALU BISA DIPILIH agar tiket bisa ditarik kembali untuk diproses sendiri
      const isMakoAsal = Boolean(
        (currentStationId && String(st.id) === String(currentStationId)) ||
        String(st.id) === '60001' ||
        (stName.includes('pekalongan') && !stName.includes('selatan') && !stName.includes('utara') && !stName.includes('barat') && !stName.includes('timur') && !stName.includes('kota'))
      );

      if (isMakoAsal) {
        // Kecualikan Mako Asal HANYA jika tiket saat ini memang sudah dipegang Mako Asal dan berstatus lokal biasa
        const currentHoldingStationId = complaint?.station_id || complaint?.stationId || complaint?.station?.id;
        const isHeldByMakoAsal = String(currentHoldingStationId) === '60001' && complaint?.status !== 'DISPOSISI_LINTAS_WILAYAH';
        if (isHeldByMakoAsal) {
          return false;
        }
        return true;
      }

      // 1. Cek kecocokan ID stasiun luar yang tidak merespon
      if (st.id && excludedStationIds.has(String(st.id))) {
        return false;
      }

      // 2. Cek kecocokan nama stasiun luar yang tidak merespon
      if (stName) {
        for (const exName of excludedStationNames) {
          if (stName === exName || stName.includes(exName) || exName.includes(stName)) {
            return false;
          }
        }
      }

      return true;
    });

    return otherOffices
      .map((st: any) => {
        const stationName = st.station_name || st.name || st.tugas || 'Mako Kepolisian';
        const stLat = st.lat ?? st.office_lat ?? st.officeLat ?? null;
        const stLng = st.lng ?? st.office_lng ?? st.officeLng ?? null;
        const stAddress = st.address || st.station_address || '';
        const stLevel = st.station_level || st.type || '';

        let distKm: number | null = null;
        if (tkpLat && tkpLng && stLat && stLng) {
          distKm = HaversineService.calculateDistanceKm(
            Number(tkpLat),
            Number(tkpLng),
            Number(stLat),
            Number(stLng)
          );
        }
        return {
          ...st,
          station_name: stationName,
          name: stationName,
          address: stAddress,
          station_level: stLevel,
          lat: stLat,
          lng: stLng,
          distKm,
        };
      })
      .sort((a, b) => {
        if (a.distKm === null) return 1;
        if (b.distKm === null) return -1;
        return a.distKm - b.distKm;
      });
  }, [policeOffices, currentStationId, excludedStationIds, excludedStationNames, complaint, tkpLat, tkpLng]);

  const nearestOffice = rankedOffices[0] || null;

  const [selectedStationId, setSelectedStationId] = useState<number | string>(() => {
    return nearestOffice ? nearestOffice.id : '';
  });

  // Sinkronisasi otomatis stasiun terpilih dengan opsi Mako yang valid (bukan yang di-exclude)
  useEffect(() => {
    if (nearestOffice && (!selectedStationId || !rankedOffices.some((st) => String(st.id) === String(selectedStationId)))) {
      setSelectedStationId(nearestOffice.id);
    }
  }, [nearestOffice, rankedOffices, selectedStationId]);

  const selectedOffice = useMemo(() => {
    return rankedOffices.find((st) => String(st.id) === String(selectedStationId)) || nearestOffice;
  }, [rankedOffices, selectedStationId, nearestOffice]);

  const defaultReason = useMemo(() => {
    const targetName = selectedOffice?.station_name || selectedOffice?.name || 'Mako Tujuan';
    const isTargetMakoAsal = selectedOffice?.id && (String(selectedOffice.id) === '60001' || String(selectedOffice.id) === String(currentStationId));
    if (isTargetMakoAsal) {
      return `Penarikan Kembali ke Mako Asal (${targetName}): Karena Mako yurisdiksi sebelumnya tidak memberikan respon tepat waktu, laporan dialihkan kembali untuk diproses dan ditindaklanjuti secara mandiri oleh kesatuan lokal.`;
    }
    const distText = selectedOffice?.distKm ? `berjarak ${selectedOffice.distKm} km` : 'terdekat';
    return `Deteksi koordinat TKP berada di luar batas wilayah hukum operasional. Berdasarkan analisa jarak GPS, lokasi perkara lebih dekat ke ${targetName} (${distText}).`;
  }, [selectedOffice, currentStationId]);

  const [transferReason, setTransferReason] = useState<string>(defaultReason);

  // Perbarui alasan otomatis saat pilihan stasiun berubah jika masih memakai format default
  useEffect(() => {
    if (selectedOffice) {
      const targetName = selectedOffice.station_name || selectedOffice.name || 'Mako Tujuan';
      const isTargetMakoAsal = selectedOffice?.id && (String(selectedOffice.id) === '60001' || String(selectedOffice.id) === String(currentStationId));
      if (isTargetMakoAsal) {
        setTransferReason(
          `Penarikan Kembali ke Mako Asal (${targetName}): Karena Mako yurisdiksi sebelumnya tidak memberikan respon tepat waktu, laporan dialihkan kembali untuk diproses dan ditindaklanjuti secara mandiri oleh kesatuan lokal.`
        );
      } else {
        const distText = selectedOffice.distKm ? `berjarak ${selectedOffice.distKm} km` : 'terdekat';
        setTransferReason(
          `Deteksi koordinat TKP berada di luar batas wilayah hukum operasional. Berdasarkan analisa jarak GPS, lokasi perkara lebih dekat ke ${targetName} (${distText}).`
        );
      }
    }
  }, [selectedOffice, currentStationId]);

  const handleExecuteTransfer = async () => {
    if (!selectedOffice) {
      setErrorMsg('Pilih Mako kepolisian tujuan pengalihan laporan.');
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await transferComplaintCrossJurisdictionAction({
        complaintId: String(complaint.id),
        targetStationId: Number(selectedOffice.id),
        targetStationName: selectedOffice.station_name,
        transferReason: transferReason.trim() || defaultReason,
      });

      if (res.success) {
        onSuccess(res.data);
      } else {
        setErrorMsg(res.error || 'Gagal mengalihkan disposisi.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem saat pengalihan.');
    } finally {
      setSubmitting(false);
    }
  };

  const nomorTiket = complaint.nomorTiket || complaint.nomor_tiket || '-';
  const jenisKejadian = complaint.jenisKejadian || complaint.jenis_kejadian || '-';
  const alamatTkp = complaint.tkpAlamatTeks || complaint.tkp_alamat_teks || '-';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        style={{
          backgroundColor: '#1E293B',
          border: '1px solid #334155',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '620px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          color: '#FFFFFF',
          overflow: 'hidden',
        }}
      >
        {/* Header Modal */}
        <div
          style={{
            padding: '18px 22px',
            borderBottom: '1px solid #334155',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid #F59E0B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#F59E0B',
              }}
            >
              <Navigation size={20} />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 800 }}>Disposisi Lintas Wilayah (E-Routing)</div>
              <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                Pengalihan resmi ke yurisdiksi Mako kepolisian terdekat dari titik TKP
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body Modal */}
        <div style={{ padding: '20px 22px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {errorMsg && (
            <div
              style={{
                backgroundColor: '#7F1D1D',
                border: '1px solid #EF4444',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#FECACA',
              }}
            >
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Rincian Tiket */}
          <div
            style={{
              backgroundColor: '#0F172A',
              border: '1px solid #334155',
              borderRadius: '10px',
              padding: '14px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#38BDF8', fontFamily: 'monospace' }}>
                {nomorTiket}
              </span>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  backgroundColor: '#EF4444',
                  color: '#FFFFFF',
                }}
              >
                {(complaint.urgensi || 'DARURAT').toUpperCase()}
              </span>
            </div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#F1F5F9' }}>{jenisKejadian}</div>
            <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
              <MapPin size={14} style={{ marginTop: '2px', flexShrink: 0, color: '#F59E0B' }} />
              <span>{alamatTkp}</span>
            </div>
          </div>

          {/* Rekomendasi Mako Terdekat Berdasarkan GPS */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#CBD5E1', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Building2 size={15} style={{ color: '#F59E0B' }} />
              <span>Rekomendasi Mako Terdekat dari Lokasi TKP:</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
              {rankedOffices.length === 0 ? (
                <div
                  style={{
                    padding: '16px',
                    textAlign: 'center',
                    backgroundColor: '#0F172A',
                    border: '1px dashed #334155',
                    borderRadius: '10px',
                    color: '#94A3B8',
                    fontSize: '12px',
                  }}
                >
                  Seluruh Mako kepolisian sekitar telah pernah didisposisikan atau tidak memberikan respon.
                </div>
              ) : (
                rankedOffices.map((office, idx) => {
                  const isSelected = String(office.id) === String(selectedStationId);
                  const isTop1 = idx === 0;

                  return (
                    <div
                      key={office.id}
                      onClick={() => {
                        setSelectedStationId(office.id);
                        setTransferReason(
                          `Deteksi koordinat TKP berada di luar batas wilayah hukum operasional. Berdasarkan analisa jarak GPS, lokasi perkara lebih dekat ke ${office.station_name} (${office.distKm ? `berjarak ${office.distKm} km` : 'terdekat'}).`
                        );
                      }}
                      style={{
                        border: isSelected ? '2px solid #F59E0B' : '1px solid #334155',
                        backgroundColor: isSelected ? 'rgba(245, 158, 11, 0.1)' : '#0F172A',
                        borderRadius: '10px',
                        padding: '10px 14px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            border: isSelected ? '5px solid #F59E0B' : '2px solid #64748B',
                            backgroundColor: '#0F172A',
                          }}
                        />
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 800, color: isSelected ? '#FCD34D' : '#F1F5F9', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Building2 size={14} color={isSelected ? '#F59E0B' : '#94A3B8'} />
                            <span>{office.station_name}</span>
                          </div>
                          <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>{office.address || office.station_level}</div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        {isTop1 && (
                          <div
                            style={{
                              fontSize: '10px',
                              fontWeight: 800,
                              backgroundColor: '#D97706',
                              color: '#FFFFFF',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              marginBottom: '2px',
                            }}
                          >
                            ⭐ Terdekat
                          </div>
                        )}
                        {(String(office.id) === '60001' || (currentStationId && String(office.id) === String(currentStationId))) && (
                          <div
                            style={{
                              fontSize: '10px',
                              fontWeight: 800,
                              backgroundColor: '#1E40AF',
                              color: '#FFFFFF',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              marginBottom: '2px',
                            }}
                          >
                            🏠 Mako Asal (Proses Mandiri)
                          </div>
                        )}
                        <div style={{ fontSize: '12px', fontWeight: 800, color: isSelected ? '#F59E0B' : '#94A3B8' }}>
                          {office.distKm !== null ? `± ${office.distKm} km` : '-'}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Alasan Pengalihan */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#CBD5E1', display: 'block', marginBottom: '6px' }}>
              Catatan Dasar Pengalihan (Audit Trail Resmi):
            </label>
            <textarea
              rows={3}
              value={transferReason}
              onChange={(e) => setTransferReason(e.target.value)}
              placeholder="Tuliskan alasan pengalihan yurisdiksi..."
              style={{
                width: '100%',
                backgroundColor: '#0F172A',
                border: '1px solid #334155',
                borderRadius: '8px',
                padding: '10px 12px',
                color: '#FFFFFF',
                fontSize: '12px',
                outline: 'none',
                resize: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Alert Notis */}
          <div
            style={{
              backgroundColor: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '8px',
              padding: '10px 12px',
              fontSize: '11px',
              color: '#FCD34D',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertTriangle size={16} style={{ flexShrink: 0 }} />
            <span>
              Tiket akan langsung dialihkan ke <strong>{selectedOffice?.station_name || selectedOffice?.name || 'Mako Terpilih'}</strong>. Sirine audio di Mako tujuan
              akan berbunyi dan pesan WhatsApp darurat dikirimkan ke Ka SPKT piket hari itu.
            </span>
          </div>
        </div>

        {/* Footer Modal */}
        <div
          style={{
            padding: '14px 22px',
            borderTop: '1px solid #334155',
            backgroundColor: '#0F172A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '10px',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            style={{
              padding: '9px 16px',
              borderRadius: '8px',
              backgroundColor: '#334155',
              border: 'none',
              color: '#F1F5F9',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleExecuteTransfer}
            disabled={submitting || !selectedOffice}
            style={{
              padding: '9px 18px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
              border: 'none',
              color: '#0F172A',
              fontSize: '13px',
              fontWeight: 900,
              cursor: submitting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
            }}
          >
            <span>{submitting ? '⏳ Mengalihkan...' : `Konfirmasi Alihkan ke ${selectedOffice?.station_name || 'Mako Tujuan'}`}</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
