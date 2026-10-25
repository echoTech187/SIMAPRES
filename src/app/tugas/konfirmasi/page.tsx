'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getComplaintByTiketAction, quickAcceptComplaintDispatchAction } from '@/app/actions/complaint.actions';

function KonfirmasiTugasContent() {
  const searchParams = useSearchParams();
  const tiketParam = searchParams.get('tiket') || '';
  const roleParam = (searchParams.get('role') || 'OFFICER').toUpperCase() as 'OFFICER' | 'POLSEK';

  const [loading, setLoading] = useState(true);
  const [complaint, setComplaint] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [officerNameInput, setOfficerNameInput] = useState('');

  useEffect(() => {
    if (!tiketParam) {
      setError('Nomor tiket tidak disertakan dalam tautan.');
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        const res = await getComplaintByTiketAction(tiketParam);
        if (res.success && res.data) {
          setComplaint(res.data);
          // Cek apakah sudah diterima
          const isAccepted = res.data.dispatches?.some((d: any) => d.accepted_at || d.acceptedAt);
          if (isAccepted) {
            setSuccessMsg('Tiket ini sudah diterima dan sedang dalam penanganan unit lapangan.');
          }
        } else {
          setError(res.error || 'Tiket pengaduan tidak ditemukan.');
        }
      } catch (err: any) {
        setError(err.message || 'Gagal memuat data tiket.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [tiketParam]);

  const handleAccept = async () => {
    if (!tiketParam) return;
    setSubmitting(true);
    try {
      const res = await quickAcceptComplaintDispatchAction({
        nomorTiket: tiketParam,
        role: roleParam,
        recipientName: officerNameInput.trim() || undefined,
      });

      if (res.success) {
        setSuccessMsg(res.message || 'Tugas berhasil diterima!');
        // Refresh complaint data
        const refreshed = await getComplaintByTiketAction(tiketParam);
        if (refreshed.success) setComplaint(refreshed.data);
      } else {
        alert(res.error || 'Gagal menerima tugas.');
      }
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setSubmitting(false);
    }
  };

  const isDarurat = complaint?.urgensi === 'DARURAT';
  const gmapsUrl = complaint?.tkpLat && complaint?.tkpLng 
    ? `https://www.google.com/maps/dir/?api=1&destination=${complaint.tkpLat},${complaint.tkpLng}`
    : '#';

  const alreadyAccepted = Boolean(
    complaint?.dispatches?.some((d: any) => d.accepted_at || d.acceptedAt) || successMsg
  );

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0F172A',
      color: '#F8FAFC',
      fontFamily: 'Inter, system-ui, sans-serif',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      {/* Header Presisi */}
      <div style={{
        width: '100%',
        maxWidth: '520px',
        backgroundColor: '#1E293B',
        borderRadius: '16px',
        border: '1px solid #334155',
        overflow: 'hidden',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
      }}>
        <div style={{
          padding: '20px',
          background: isDarurat 
            ? 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)' 
            : 'linear-gradient(135deg, #1E40AF 0%, #1D4ED8 100%)',
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
        }}>
          <div style={{
            fontSize: '32px',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '12px',
            width: '52px',
            height: '52px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {isDarurat ? '🚨' : '🚔'}
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.9 }}>
              Pusat Komando 110 • Presisi Taktis
            </div>
            <h1 style={{ fontSize: '18px', fontWeight: 800, margin: '2px 0 0 0' }}>
              {roleParam === 'POLSEK' ? 'Disposisi Wilayah Polsek' : 'Perintah Tugas Lapangan'}
            </h1>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ padding: '20px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94A3B8' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>⏳</div>
              <div>Memuat data penugasan tiket 110...</div>
            </div>
          ) : error ? (
            <div style={{
              backgroundColor: '#450A0A',
              border: '1px solid #DC2626',
              borderRadius: '12px',
              padding: '16px',
              color: '#FCA5A5',
              fontSize: '14px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '24px', marginBottom: '6px' }}>⚠️</div>
              <div>{error}</div>
            </div>
          ) : (
            <>
              {/* Badge Urgensi & Nomor Tiket */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
                paddingBottom: '12px',
                borderBottom: '1px solid #334155',
              }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#94A3B8' }}>NOMOR TIKET</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#38BDF8', fontFamily: 'monospace' }}>
                    {complaint.nomorTiket}
                  </div>
                </div>
                <div style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 800,
                  backgroundColor: isDarurat ? '#EF4444' : '#F59E0B',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  {isDarurat ? '🔴 DARURAT' : '🟡 SEDANG'}
                </div>
              </div>

              {/* Rincian Kasus & TKP */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                <div style={{ backgroundColor: '#0F172A', padding: '12px', borderRadius: '10px', border: '1px solid #334155' }}>
                  <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '4px' }}>KASUS / KEJADIAN</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#F1F5F9' }}>
                    {complaint.jenisKejadian || '-'}
                  </div>
                </div>

                <div style={{ backgroundColor: '#0F172A', padding: '12px', borderRadius: '10px', border: '1px solid #334155' }}>
                  <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '4px' }}>ALAMAT TEMPAT KEJADIAN (TKP)</div>
                  <div style={{ fontSize: '13px', color: '#E2E8F0', lineHeight: 1.5 }}>
                    📍 {complaint.tkpAlamatTeks || '-'}
                  </div>
                </div>

                <div style={{ backgroundColor: '#0F172A', padding: '12px', borderRadius: '10px', border: '1px solid #334155' }}>
                  <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '4px' }}>RINGKASAN LAPORAN WARGA</div>
                  <div style={{ fontSize: '12.5px', color: '#CBD5E1', lineHeight: 1.5 }}>
                    {complaint.ringkasanKeterangan || '-'}
                  </div>
                </div>

                {complaint.pelaporNama && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94A3B8', padding: '4px 8px' }}>
                    <span>Pelapor: <strong style={{ color: '#E2E8F0' }}>{complaint.pelaporNama}</strong></span>
                    {complaint.pelaporHp && <span>Kontak: <strong style={{ color: '#38BDF8' }}>{complaint.pelaporHp}</strong></span>}
                  </div>
                )}
              </div>

              {/* 3.B: Informasi Audit BBM & Jarak Riil Otomatis */}
              {(() => {
                const disp = complaint?.dispatches?.[0];
                const km = disp?.round_trip_km || disp?.roundTripKm;
                const liters = disp?.fuel_liters_used || disp?.fuelLitersUsed;
                if (!km) return null;
                return (
                  <div style={{
                    backgroundColor: 'rgba(14, 165, 233, 0.08)',
                    border: '1px solid #0284C7',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    marginBottom: '16px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '18px' }}>⛽</span>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: '#38BDF8', letterSpacing: '0.04em' }}>
                        AUDIT BBM OPERASIONAL RESMI POLRI
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#E2E8F0', marginTop: '4px' }}>
                      <span>Jarak Tempuh PP: <strong>{Number(km).toFixed(1)} km</strong></span>
                      <span>Alokasi BBM: <strong style={{ color: '#34D399' }}>~{Number(liters || 0).toFixed(1)} Liter</strong></span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px', lineHeight: 1.4 }}>
                      ✓ Jarak terverifikasi otomatis via GPS Mako ke TKP. Terekam di database untuk pengajuan klaim anggaran BBM dinas (Bag Log).
                    </div>
                  </div>
                );
              })()}

              {/* Status Sukses Jika Sudah Diterima */}
              {alreadyAccepted ? (
                <div style={{
                  backgroundColor: '#064E3B',
                  border: '1px solid #10B981',
                  borderRadius: '12px',
                  padding: '16px',
                  color: '#6EE7B7',
                  textAlign: 'center',
                  marginBottom: '16px',
                }}>
                  <div style={{ fontSize: '24px', marginBottom: '6px' }}>✅</div>
                  <div style={{ fontWeight: 700, fontSize: '15px' }}>TUGAS TELAH DITERIMA</div>
                  <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.9 }}>
                    {successMsg || 'Penugasan telah dikonfirmasi dan status operasional aktif.'}
                  </div>
                </div>
              ) : (
                /* Form Identitas & Tombol Terima Tugas (3.A Buddy System) */
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>
                      {roleParam === 'POLSEK' ? '1. Nama Petugas / Ka Tim Patroli (Wajib)' : 'Nama Petugas / NRP (Wajib)'}
                    </label>
                    <input
                      type="text"
                      placeholder={roleParam === 'POLSEK' ? 'Contoh: Aipda Agus (Ka SPKT)' : 'Contoh: Bripka Joko (Samapta)'}
                      value={officerNameInput}
                      onChange={(e) => setOfficerNameInput(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        backgroundColor: '#0F172A',
                        border: '1px solid #475569',
                        borderRadius: '8px',
                        color: '#FFFFFF',
                        fontSize: '14px',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>
                      2. Nama Rekan Pendamping / Buddy System (SOP Keselamatan Polri)
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Briptu Danang (Bintara Pendamping)"
                      id="partner-name-input"
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        backgroundColor: '#0F172A',
                        border: '1px solid #475569',
                        borderRadius: '8px',
                        color: '#FFFFFF',
                        fontSize: '14px',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                    <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
                      * Sesuai instruksi pimpinan: Patroli respon cepat dianjurkan minimal 2 orang personel siaga.
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const partnerEl = document.getElementById('partner-name-input') as HTMLInputElement | null;
                      const partnerVal = partnerEl?.value || '';
                      if (!tiketParam) return;
                      setSubmitting(true);
                      quickAcceptComplaintDispatchAction({
                        nomorTiket: tiketParam,
                        role: roleParam,
                        recipientName: officerNameInput.trim() || undefined,
                        crewPartnerName: partnerVal.trim() || undefined,
                      }).then((res) => {
                        if (res.success) {
                          setSuccessMsg(res.message || 'Tugas berhasil diterima!');
                          getComplaintByTiketAction(tiketParam).then((refreshed) => {
                            if (refreshed.success) setComplaint(refreshed.data);
                          });
                        } else {
                          alert(res.error || 'Gagal menerima tugas.');
                        }
                      }).catch((err) => {
                        alert(err.message || 'Terjadi kesalahan sistem.');
                      }).finally(() => {
                        setSubmitting(false);
                      });
                    }}
                    disabled={submitting}
                    style={{
                      width: '100%',
                      padding: '16px',
                      backgroundColor: isDarurat ? '#DC2626' : '#2563EB',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '16px',
                      fontWeight: 800,
                      cursor: submitting ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4)',
                      opacity: submitting ? 0.7 : 1,
                    }}
                  >
                    {submitting ? '⏳ Memproses...' : '⚡ TERIMA TUGAS & MELUNCUR KE TKP'}
                  </button>
                </div>
              )}

              {/* Tombol Navigasi Google Maps */}
              <a
                href={gmapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#334155',
                  color: '#F8FAFC',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  boxSizing: 'border-box',
                }}
              >
                🗺️ Buka Rute di Google Maps
              </a>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{
          backgroundColor: '#0F172A',
          padding: '12px 20px',
          textAlign: 'center',
          fontSize: '11px',
          color: '#64748B',
          borderTop: '1px solid #334155',
        }}>
          Sistem Manajemen Operasional Presisi (SIMAPRES 110) • Polres Pekalongan
        </div>
      </div>
    </div>
  );
}

export default function KonfirmasiTugasPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0B1120',
            color: '#94A3B8',
            fontFamily: 'sans-serif',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>⚡</div>
            <p style={{ fontSize: '14px', fontWeight: 600 }}>Memuat Konfirmasi Penugasan 110...</p>
          </div>
        </div>
      }
    >
      <KonfirmasiTugasContent />
    </Suspense>
  );
}
