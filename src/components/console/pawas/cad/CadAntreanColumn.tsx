'use client';

import React from 'react';
import { isGenericOrCoordinateAddress, resolveSektorWilayah } from '@/infrastructure/services/reverse-geocode.service';
import { evaluateJurisdictionBoundary } from '@/lib/jurisdiction-boundary';
import { getCrossJurisdictionTimeoutMs, getCrossJurisdictionTimeoutMinutes } from '@/lib/escalation-config';
import { getLastDispatchedStationName, getLastDispatchedStationId } from './cad-helpers';

export interface CadAntreanColumnProps {
  antreanPawas: any[];
  policeOffices?: any[];
  userProfile?: any;
  session?: any;
  loading: boolean;
  isTransferring: boolean;
  onOpenDisposisiLintasWilayah?: (item: any) => void;
  setTransferModalItem: (val: any) => void;
  bukaModalDisposisi: (item: any) => void;
  setDeskResolveModalData: (val: any) => void;
  bukaModalTolak?: (item: any) => void;
  setTolakComplaint?: (item: any) => void;
}

export const CadAntreanColumn: React.FC<CadAntreanColumnProps> = ({
  antreanPawas,
  policeOffices = [],
  userProfile,
  session,
  loading,
  isTransferring,
  onOpenDisposisiLintasWilayah,
  setTransferModalItem,
  bukaModalDisposisi,
  setDeskResolveModalData,
  bukaModalTolak,
  setTolakComplaint,
}) => {
  return (
    <div className="cad-antrean-column" style={{ width: '100%', minWidth: 0 }}>
      <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #E2E8F0', paddingBottom: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: 800, color: '#1E293B' }}>📋 Antrean Menunggu Disposisi</span>
          <span style={{ background: '#F59E0B', color: 'white', fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '10px' }}>
            {antreanPawas.length}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '550px', overflowY: 'auto' }}>
          {antreanPawas.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#64748B', fontSize: '12px' }}>
              Tidak ada antrean menunggu disposisi saat ini.
            </div>
          ) : (
            antreanPawas.map((item) => (
              <div
                key={item.id}
                style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px 12px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '11.5px', color: '#153E75' }}>
                    {item.nomorTiket}
                  </span>
                  {(() => {
                    const urgKey = (item.urgensi === 'DARURAT' || item.urgensi === 'PRIORITAS_TINGGI') ? 'DARURAT' : item.urgensi === 'SEDANG' ? 'SEDANG' : 'NORMAL';
                    const urgBg = urgKey === 'DARURAT' ? '#FEE2E2' : urgKey === 'SEDANG' ? '#FEF3C7' : '#EFF6FF';
                    const urgColor = urgKey === 'DARURAT' ? '#DC2626' : urgKey === 'SEDANG' ? '#D97706' : '#1D4ED8';
                    return (
                      <span style={{ fontSize: '10px', background: urgBg, color: urgColor, fontWeight: 800, padding: '1px 6px', borderRadius: '4px' }}>
                        {urgKey}
                      </span>
                    );
                  })()}
                </div>
                <div style={{ fontWeight: 800, fontSize: '12.5px', color: '#1E293B', marginBottom: '2px' }}>
                  {item.jenisKejadian}
                </div>
                <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '8px' }}>
                  📍 {isGenericOrCoordinateAddress(item.tkpAlamatTeks) ? resolveSektorWilayah(item.tkpAlamatTeks, item) : item.tkpAlamatTeks}
                </div>

                {/* Boundary Alert & Quick-Transfer Button */}
                {(() => {
                  const boundary = evaluateJurisdictionBoundary({
                    tkpLat: item.tkpLat || item.tkp_lat,
                    tkpLng: item.tkpLng || item.tkp_lng,
                    tkpAlamat: item.tkpAlamatTeks,
                  });

                  const isCrossJurisdiction = item.status === 'DISPOSISI_LINTAS_WILAYAH' || boundary.isOutsideJurisdiction;

                  if (!isCrossJurisdiction) return null;

                  // Wilayah yang tertulis di sini adalah wilayah yang didisposisikan terakhir kali
                  const lastStation = getLastDispatchedStationName(item, policeOffices);
                  const targetName = lastStation || boundary.targetStation?.stationName || 'Polresta Batang';
                  const targetStationId = getLastDispatchedStationId(item, policeOffices);

                  // Bandingkan station_id user login dengan station_id dari getLastDispatchedStation
                  const userStationId = userProfile?.stationId || session?.stationId;
                  const userStationName = userProfile?.stationName || session?.stationName;

                  const isUserTargetStation = Boolean(
                    (userStationId && targetStationId && String(userStationId) === String(targetStationId)) ||
                    (userStationName && lastStation && userStationName.trim().toLowerCase() === lastStation.trim().toLowerCase())
                  );

                  // Jika user yang login adalah Mako Tujuan (misal Polresta Batang),
                  // mereka TIDAK PERLU melihat tombol "Transfer ke Polresta Batang" atau alert batas wilayah untuk diri sendiri!
                  if (isUserTargetStation) return null;

                  // Deteksi apakah waktu respon sudah expired (1 menit tanpa respon)
                  const dispatches = Array.isArray(item.dispatches) ? item.dispatches : [];
                  const dispatchWithDeadline = dispatches.find((d: any) => d.escalation_deadline_at || d.escalationDeadlineAt);
                  const rawDeadline = dispatchWithDeadline?.escalation_deadline_at || dispatchWithDeadline?.escalationDeadlineAt;
                  let deadlineMs = rawDeadline ? new Date(rawDeadline).getTime() : null;

                  if (!deadlineMs) {
                    const logs = item.complaint_logs || item.complaintLogs || item.auditLogs || [];
                    const xLog = Array.isArray(logs) ? logs.find((l: any) => l.action === 'DISPOSISI_LINTAS_WILAYAH' || l.action === 'CROSS_JURISDICTION_DISPATCHED') : null;
                    if (xLog?.created_at) {
                      deadlineMs = new Date(xLog.created_at).getTime() + getCrossJurisdictionTimeoutMs();
                    } else if (item.updated_at || item.created_at) {
                      deadlineMs = new Date(item.updated_at || item.created_at).getTime() + getCrossJurisdictionTimeoutMs();
                    }
                  }

                  const isExpired = Boolean(deadlineMs && deadlineMs <= Date.now());

                  // Jika tiket sudah didisposisikan antar wilayah dan belum expired (sedang menunggu respon mako tujuan):
                  // ALERT DAN TOMBOL TRANSFER HILANG DARI MAKO ASAL!
                  if (item.status === 'DISPOSISI_LINTAS_WILAYAH' && !isExpired) {
                    return (
                      <div
                        style={{
                          marginTop: '8px',
                          marginBottom: '6px',
                          padding: '6px 10px',
                          background: '#F8FAFC',
                          border: '1px solid #E2E8F0',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '11px',
                          color: '#475569',
                          fontWeight: 700,
                        }}
                      >
                        <span style={{ fontSize: '13px' }}>⏳</span>
                        <span>Menunggu respon dari <strong>{targetName}</strong> (Batas waktu {getCrossJurisdictionTimeoutMinutes()} menit)</span>
                      </div>
                    );
                  }

                  return (
                    <div
                      style={{
                        marginTop: '8px',
                        marginBottom: '6px',
                        padding: '8px 10px',
                        background: isExpired ? '#FEF2F2' : '#FFFBEB',
                        border: isExpired ? '1.5px solid #EF4444' : '1.5px solid #F59E0B',
                        borderRadius: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isExpired ? '#DC2626' : '#B45309', fontSize: '11px', fontWeight: 800, marginBottom: '6px' }}>
                        <span>⚠️</span>
                        <span>
                          {isExpired
                            ? `Waktu Respon Habis: ${targetName} Tidak Merespon`
                            : `Batas Wilayah: TKP di ${boundary.detectedRegionName || targetName}`}
                        </span>
                      </div>
                      <button
                        type="button"
                        id={`btn-transfer-lintas-${item.id}`}
                        disabled={loading || isTransferring}
                        onClick={() => {
                          if (onOpenDisposisiLintasWilayah) {
                            onOpenDisposisiLintasWilayah(item);
                          } else {
                            setTransferModalItem({ item, boundary });
                          }
                        }}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          background: isExpired
                            ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'
                            : 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                          color: isExpired ? '#FFFFFF' : '#0F172A',
                          fontWeight: 900,
                          fontSize: '11px',
                          borderRadius: '6px',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          boxShadow: isExpired
                            ? '0 2px 6px rgba(220,38,38,0.3)'
                            : '0 2px 6px rgba(217,119,6,0.3)',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <span>
                          {isExpired
                            ? `⚠️ ${targetName} tidak merespon, Alihkan ke wilayah terdekat`
                            : `🔄 Transfer ke ${targetName}`}
                        </span>
                      </button>
                    </div>
                  );
                })()}

                {/* Tombol aksi reguler hanya ditampilkan jika BUKAN tiket disposisi antar wilayah */}
                {(() => {
                  const boundary = evaluateJurisdictionBoundary({
                    tkpLat: item.tkpLat || item.tkp_lat,
                    tkpLng: item.tkpLng || item.tkp_lng,
                    tkpAlamat: item.tkpAlamatTeks,
                  });
                  const isCrossJurisdiction = item.status === 'DISPOSISI_LINTAS_WILAYAH' || boundary.isOutsideJurisdiction;
                  if (isCrossJurisdiction) return null;

                  return (
                    <div style={{ marginTop: '16px', display: 'flex', gap: '8px', alignItems: 'stretch', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        id="btn-buka-modal-disposisi"
                        onClick={() => {
                          bukaModalDisposisi(item);
                        }}
                        style={{
                          flex: 1,
                          minWidth: '120px',
                          height: '42px',
                          padding: '0 12px',
                          background: 'linear-gradient(135deg, #153E75 0%, #1E40AF 100%)',
                          color: 'white',
                          fontSize: '12px',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          borderRadius: '8px',
                          border: 'none',
                          boxShadow: '0 2px 8px rgba(21,62,117,0.25)',
                          cursor: 'pointer',
                          margin: 0,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        Teruskan Tugas ➔
                      </button>
                      <button
                        type="button"
                        id={`btn-selesai-meja-${item.id}`}
                        onClick={() => {
                          setDeskResolveModalData({
                            isFromCadForm: false,
                            item: item,
                            nomorTiket: item.nomorTiket || '',
                            namaPelapor: item.pelaporNama || item.pelapor_nama || '',
                            teleponPelapor: item.pelaporHp || item.pelapor_hp || '',
                            jenisKejadian: item.jenisKejadian || item.jenis_kejadian || '',
                            alamatTkp: item.tkpAlamatTeks || item.tkp_alamat_teks || '',
                            resolutionNotes: `Layanan informasi / konsultasi atas pengaduan ${item.nomorTiket} telah selesai dijelaskan oleh Operator 110 kepada pelapor sesuai SOP kepolisian.`,
                            sendWa: true,
                          });
                        }}
                        style={{
                          height: '42px',
                          padding: '0 12px',
                          borderRadius: '8px',
                          border: '1px solid #A7F3D0',
                          background: '#ECFDF5',
                          color: '#059669',
                          fontWeight: 800,
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '5px',
                          margin: 0,
                          transition: 'all 0.15s ease',
                        }}
                        title="Selesaikan langsung di Meja Operator tanpa disposisi lapangan"
                      >
                        <span>✓</span> Selesai
                      </button>
                      <button
                        type="button"
                        id="btn-tolak-dossier"
                        onClick={() => {
                          if (bukaModalTolak) {
                            bukaModalTolak(item);
                          } else {
                            setTolakComplaint?.(item);
                          }
                        }}
                        style={{
                          height: '42px',
                          padding: '0 12px',
                          borderRadius: '8px',
                          border: '1px solid #FCA5A5',
                          background: '#FEF2F2',
                          color: '#DC2626',
                          fontWeight: 800,
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '5px',
                          margin: 0,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <span>✕</span> Tolak
                      </button>
                    </div>
                  );
                })()}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
