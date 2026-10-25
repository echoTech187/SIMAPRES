'use client';

import React from 'react';

interface ModalDisposisiPawasProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItem: any;
  dbSubcategories: any[];
  daftarArmadaAktif: any[];
  selectedSatuanKeys: string[];
  toggleSatuanSelection: (id: string) => void;
  kuotaPersonel: number;
  setKuotaPersonel: (k: number) => void;
  arahanPawas: string;
  setArahanPawas: React.Dispatch<React.SetStateAction<string>>;
  tambahArahanCepatPawas: (txt: string) => void;
  handleConfirmDisposisi: () => void;
  loading: boolean;
  getSopRecommendationByIncident: (item: any, subcats: any[]) => any;
  calculateDistanceHaversineKm: (lat1: number, lng1: number, lat2: number, lng2: number) => number;
  activePreviewSatuanKey?: string | null;
}

export default function ModalDisposisiPawas({
  isOpen,
  onClose,
  selectedItem,
  dbSubcategories,
  daftarArmadaAktif,
  selectedSatuanKeys,
  toggleSatuanSelection,
  kuotaPersonel,
  setKuotaPersonel,
  arahanPawas,
  setArahanPawas,
  tambahArahanCepatPawas,
  handleConfirmDisposisi,
  loading,
  getSopRecommendationByIncident,
  calculateDistanceHaversineKm,
  activePreviewSatuanKey,
}: ModalDisposisiPawasProps) {
  if (!isOpen || !selectedItem) return null;

  const sopRecommendation = getSopRecommendationByIncident(selectedItem, dbSubcategories);
  const incidentLat = Number(selectedItem?.tkpLat ?? selectedItem?.lat ?? selectedItem?.tkp_lat ?? 0);
  const incidentLng = Number(selectedItem?.tkpLng ?? selectedItem?.lng ?? selectedItem?.tkp_lng ?? 0);

  const calculatedArmadas = daftarArmadaAktif.map((armada) => {
    const isPrimarySop = sopRecommendation.primarySatuanId ? armada.id === sopRecommendation.primarySatuanId : false;
    const isSecondarySop = sopRecommendation.secondarySatuanIds ? (sopRecommendation.secondarySatuanIds as any).includes(armada.id) : false;

    let multiplier = 1.0;
    if (isPrimarySop) multiplier = 0.7;
    else if (isSecondarySop) multiplier = 0.85;

    let jarakCalc: number | null = null;
    let etaCalc: number | null = null;

    if (incidentLat && incidentLng && armada.lat && armada.lng) {
      const rawDistance = calculateDistanceHaversineKm(incidentLat, incidentLng, armada.lat, armada.lng);
      jarakCalc = +(rawDistance * multiplier).toFixed(1);
      if (jarakCalc <= 0) jarakCalc = 0.5;
      etaCalc = Math.max(2, Math.round((jarakCalc / 30) * 60));
    } else if (armada.jarakBase != null) {
      jarakCalc = +(armada.jarakBase * multiplier).toFixed(1);
      etaCalc = armada.etaBase != null ? Math.max(2, Math.round(armada.etaBase * multiplier)) : null;
    }

    return {
      ...armada,
      isPrimarySop,
      isSecondarySop,
      jarakCalc,
      etaCalc,
    };
  });

  const isPersonel =
    selectedItem.platformKey === 'personel' ||
    selectedItem.tipePelapor === 'personel' ||
    selectedItem.pelaporTipe === 'PERSONEL' ||
    Boolean(selectedItem.pelaporNrp && selectedItem.pelaporNrp.trim()) ||
    Boolean(selectedItem.nrp && selectedItem.nrp.trim());

  const isWarga = !isPersonel;

  const saluranSumber =
    selectedItem.platformRel?.label ||
    (selectedItem.platformKey === 'warga'
      ? 'Portal Pengaduan Warga'
      : selectedItem.platformKey === 'sos'
      ? 'Tombol Darurat SOS Presisi'
      : selectedItem.platformKey === 'layanan110'
      ? 'Call Center 110'
      : selectedItem.saluranLaporan || 'Call Center 110');

  const badgePelapor = isPersonel
    ? '👮 Patroli Internal'
    : selectedItem.platformKey === 'sos'
    ? '🚨 Peringatan SOS Warga'
    : '👤 Laporan Pengaduan Warga';

  return (
    <div
      id="modal-disposisi-pawas"
      data-testid="modal-disposisi-pawas"
      className="pawas-modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        background: 'rgba(15,23,42,0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        className="pawas-modal-dialog"
        style={{
          background: 'white',
          width: '100%',
          maxWidth: '620px',
          borderRadius: '14px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          overflow: 'hidden',
          border: '1px solid #CBD5E1',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #153E75 0%, #0F2A52 100%)',
            color: 'white',
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '2px solid #F59E0B',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>👮</span>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 800 }}>LEMBAR DISPOSISI TAKTIS UNIT</div>
              <div style={{ fontSize: '11px', opacity: 0.85 }}>Posko Pengendalian Operasi Kepolisian</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: 'white',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '18px 20px', overflowY: 'auto', flex: 1 }}>
          {/* Top Yellow Banner */}
          <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: '10px', padding: '12px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '10px', fontWeight: 800, color: '#B45309', textTransform: 'uppercase' }}>NOMOR TIKET RESMI</div>
              <div style={{ fontSize: '15px', fontWeight: 900, fontFamily: 'monospace', color: '#92400E' }}>
                {selectedItem.nomorTiket}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '10px', fontWeight: 800, color: '#B45309', textTransform: 'uppercase' }}>TARGET SLA RESPON</div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#B45309' }}>⚡ &lt; 10 Menit Tiba di TKP</div>
            </div>
          </div>

          {/* Kasus / Lokasi TKP Box */}
          <div style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '10px', padding: '12px', marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap', gap: '4px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B' }}>Kasus / Lokasi TKP:</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {(() => {
                  const u = (selectedItem.urgensi || '').toUpperCase();
                  const isD = u === 'DARURAT' || u === 'PRIORITAS_TINGGI';
                  const isS = u === 'SEDANG';
                  const label = isD ? '🚨 DARURAT' : isS ? '⚠️ SEDANG' : 'ℹ️ NORMAL';
                  const bg = isD ? '#FEE2E2' : isS ? '#FEF3C7' : '#EFF6FF';
                  const color = isD ? '#DC2626' : isS ? '#D97706' : '#1D4ED8';
                  const border = isD ? '1px solid #FECACA' : isS ? '1px solid #FDE68A' : '1px solid #BFDBFE';
                  return (
                    <span style={{ fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', background: bg, color, border }}>
                      {label}
                    </span>
                  );
                })()}
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: isWarga ? '#EFF6FF' : '#FEF3C7',
                    color: isWarga ? '#1D4ED8' : '#92400E',
                    border: isWarga ? '1px solid #BFDBFE' : '1px solid #FDE68A',
                  }}
                >
                  {badgePelapor}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
              <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#0F172A' }}>
                {selectedItem.jenisKejadian || selectedItem.title}
              </div>
            </div>

            {/* Uraian Singkat Kejadian */}
            <div
              style={{
                fontSize: '11.5px',
                color: '#1E293B',
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                padding: '8px 12px',
                borderRadius: '8px',
                marginBottom: '8px',
                lineHeight: 1.5,
              }}
            >
              <div style={{ fontSize: '10px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>📝</span> Uraian Singkat Kejadian:
              </div>
              <div style={{ fontStyle: 'italic', color: '#334155' }}>
                "{selectedItem.ringkasanKeterangan || selectedItem.deskripsiKejadian || selectedItem.keterangan || selectedItem.uraian || 'Tidak ada uraian keterangan kejadian.'}"
              </div>
            </div>
            <div style={{ fontSize: '11.5px', color: '#475569', marginBottom: '6px' }}>
              📍 {selectedItem.tkpAlamatTeks || selectedItem.alamatTeks}
            </div>
            <div
              style={{
                fontSize: '11px',
                color: isWarga ? '#1E40AF' : '#92400E',
                background: isWarga ? '#EFF6FF' : '#FFFBEB',
                padding: '6px 10px',
                borderRadius: '6px',
                border: isWarga ? '1px dashed #93C5FD' : '1px dashed #FCD34D',
              }}
            >
              {isWarga ? (
                <>👤 Pelapor: <strong>{selectedItem.pelaporNama || selectedItem.nama}</strong> {selectedItem.pelaporHp || selectedItem.noTelpPelapor ? `(${selectedItem.pelaporHp || selectedItem.noTelpPelapor})` : ''} via {saluranSumber}</>
              ) : (
                <>👮 Pelapor: <strong>{selectedItem.pelaporNama || selectedItem.nama}</strong> (NRP: {selectedItem.pelaporNrp || selectedItem.nrp || '-'}){selectedItem.pelaporPangkat || selectedItem.kesatuan ? ` • ${selectedItem.pelaporPangkat || ''} ${selectedItem.kesatuan || ''}` : ''}</>
              )}
            </div>
          </div>

          {/* 1. Disposisi ke Satuan Tugas */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 800, color: '#1E293B' }}>
                  1. Disposisi ke Satuan Tugas (Broadcast Persatuan): <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <div style={{ fontSize: '11px', color: '#64748B', marginTop: '1px' }}>
                  Pilih satu atau lebih satuan tugas yang akan diberangkatkan ke TKP (centang manual):
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '8px' }}>
                {calculatedArmadas.map((a: any) => {
                  const isChecked = selectedSatuanKeys.includes(a.id);
                  return (
                    <div
                      key={a.id}
                      onClick={() => toggleSatuanSelection(a.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        background: isChecked ? '#EFF6FF' : '#FFFFFF',
                        border: `2px solid ${isChecked ? '#2563EB' : a.isPrimarySop ? '#93C5FD' : '#CBD5E1'}`,
                        boxShadow: isChecked ? '0 2px 8px rgba(37,99,235,0.18)' : '0 1px 3px rgba(0,0,0,0.03)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                        <input
                          type="checkbox"
                          id={`chk-satuan-${a.id}`}
                          checked={isChecked}
                          onChange={() => toggleSatuanSelection(a.id)}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            cursor: 'pointer',
                            width: '18px',
                            height: '18px',
                            accentColor: '#2563EB',
                            flexShrink: 0,
                          }}
                        />
                        <div style={{ minWidth: 0, width: '100%' }}>
                          <div style={{ fontSize: '13px', fontWeight: 800, color: isChecked ? '#1E40AF' : '#1E293B', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              <span>{a.icon}</span> <span>{a.namaSingkat}</span>
                            </div>
                            {a.isPrimarySop && (
                              <span style={{ fontSize: '9px', fontWeight: 800, background: '#DCFCE7', color: '#166534', border: '1px solid #86EFAC', padding: '1px 5px', borderRadius: '4px' }}>
                                ★ UTAMA
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {isChecked && (
                        <span style={{ fontSize: '10.5px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', background: '#DBEAFE', color: '#1D4ED8', flexShrink: 0, marginLeft: '6px' }}>
                          ✓ DIPILIH
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {selectedSatuanKeys.length === 0 ? (
                <div style={{ fontSize: '11px', color: '#B45309', background: '#FEF3C7', border: '1px dashed #F59E0B', padding: '7px 12px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>ℹ️</span> <span>Belum ada satuan yang dipilih. Silakan centang minimal 1 satuan tugas di atas untuk diberangkatkan.</span>
                </div>
              ) : (
                <div style={{ fontSize: '11px', color: '#166534', background: '#DCFCE7', border: '1px solid #86EFAC', padding: '7px 12px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700 }}>
                    ✅ {selectedSatuanKeys.length} Satuan Tugas Dipilih: {calculatedArmadas.filter((a: any) => selectedSatuanKeys.includes(a.id)).map((a: any) => a.namaSingkat).join(' & ')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 2. Alokasi Kuat Personel SOP */}
          <div style={{ marginBottom: '14px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px 12px' }}>
            <div style={{ marginBottom: '6px' }}>
              <label style={{ fontSize: '11.5px', fontWeight: 800, color: '#1E293B' }}>
                2. Alokasi Kuat Personel (Batas Maksimal Anggota ke TKP): <span style={{ color: '#DC2626' }}>*</span>
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {[
                { k: 2, label: '2 Personel', sub: 'Buddy System' },
                { k: 4, label: '4 Personel', sub: '1 Unit Patroli ★' },
                { k: 6, label: '6 Personel', sub: 'Regu Terpadu' },
                { k: 8, label: '8 Personel', sub: 'Kontinjensi' },
              ].map(({ k, label, sub }) => (
                <label
                  key={k}
                  onClick={() => setKuotaPersonel(k)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px 6px',
                    border: kuotaPersonel === k ? '2px solid #2563EB' : '2px solid #E2E8F0',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    background: kuotaPersonel === k ? '#EFF6FF' : 'white',
                    textAlign: 'center',
                    transition: 'all 0.15s',
                  }}
                >
                  <input
                    type="radio"
                    name="modal-kuota-pers"
                    checked={kuotaPersonel === k}
                    onChange={() => setKuotaPersonel(k)}
                    style={{ marginBottom: '4px', accentColor: '#2563EB' }}
                  />
                  <span style={{ fontSize: '11px', fontWeight: 800, color: kuotaPersonel === k ? '#1E40AF' : '#0F172A' }}>{label}</span>
                  <span style={{ fontSize: '9.5px', color: kuotaPersonel === k ? '#2563EB' : '#64748B', fontWeight: k === 4 ? 700 : 400 }}>{sub}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 3. Instruksi Taktis Komando */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px', flexWrap: 'wrap', gap: '4px' }}>
              <label style={{ fontSize: '11.5px', fontWeight: 800, color: '#1E293B' }}>
                3. Instruksi Taktis &amp; Petunjuk Khusus Operasi: <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <span style={{ fontSize: '10px', color: '#64748B' }}>Klik template untuk arahan cepat:</span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '8px' }}>
              <button
                type="button"
                onClick={() => tambahArahanCepatPawas('🚨 Sirine Biru & Quick Response: Prioritaskan tiba < 10 menit.')}
                style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', padding: '3px 8px', borderRadius: '6px', fontSize: '10.5px', fontWeight: 700, cursor: 'pointer' }}
              >
                🚨 Sirine Biru
              </button>
              <button
                type="button"
                onClick={() => tambahArahanCepatPawas('🛡️ Amankan perimeter TKP dan utamakan keselamatan warga/korban.')}
                style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', padding: '3px 8px', borderRadius: '6px', fontSize: '10.5px', fontWeight: 700, cursor: 'pointer' }}
              >
                🛡️ Amankan Perimeter
              </button>
              <button
                type="button"
                onClick={() => tambahArahanCepatPawas('📹 Wajib aktifkan bodycam dan segera dokumentasikan bukti visual.')}
                style={{ background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0', padding: '3px 8px', borderRadius: '6px', fontSize: '10.5px', fontWeight: 700, cursor: 'pointer' }}
              >
                📹 Rekam Bodycam
              </button>
              <button
                type="button"
                onClick={() => tambahArahanCepatPawas('🤝 Koordinasikan dengan pihak RT/RW dan tokoh masyarakat setempat.')}
                style={{ background: '#FFFBEB', color: '#B45309', border: '1px solid #FDE68A', padding: '3px 8px', borderRadius: '6px', fontSize: '10.5px', fontWeight: 700, cursor: 'pointer' }}
              >
                🤝 Koordinasi Warga
              </button>
            </div>

            <textarea
              className="form-control"
              rows={3}
              value={arahanPawas}
              onChange={(e) => setArahanPawas(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '12px', color: '#0F172A', outline: 'none', lineHeight: 1.5, boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ background: '#EFF6FF', borderLeft: '3px solid #3B82F6', padding: '10px 12px', borderRadius: '0 8px 8px 0', fontSize: '11px', color: '#1E40AF', lineHeight: 1.45 }}>
            <strong>⚖️ SOP Rantai Komando Presisi:</strong> Setelah disposisi diteken, tiket langsung diterbitkan, status berpindah ke <em>Tahap 3 (Personel Bergerak Menuju TKP)</em>, jam hitung mundur SLA (&lt; 10 menit) aktif otomatis, dan petugas lapangan menerima notifikasi penugasan.
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid #E2E8F0', background: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            type="button"
            onClick={onClose}
            style={{ padding: '10px 16px', background: '#F1F5F9', color: '#475569', fontSize: '12px', fontWeight: 700, border: '1px solid #CBD5E1', borderRadius: '8px', cursor: 'pointer' }}
          >
            Batalkan
          </button>
          <button
            type="button"
            id="btn-konfirmasi-disposisi"
            data-testid="btn-konfirmasi-disposisi"
            onClick={handleConfirmDisposisi}
            disabled={loading || selectedSatuanKeys.length === 0}
            style={{
              padding: '10px 20px',
              background: selectedSatuanKeys.length === 0 ? '#94A3B8' : 'linear-gradient(135deg, #153E75 0%, #1E40AF 100%)',
              color: 'white',
              fontSize: '13px',
              fontWeight: 800,
              border: 'none',
              borderRadius: '8px',
              cursor: selectedSatuanKeys.length === 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: selectedSatuanKeys.length === 0 ? 'none' : '0 3px 10px rgba(21,62,117,0.3)',
              transition: 'all 0.15s ease',
            }}
          >
            {loading
              ? 'Menerbitkan...'
              : selectedSatuanKeys.length === 0
              ? 'Pilih Satuan Tugas Terlebih Dahulu'
              : `🚀 Terbitkan Disposisi Tugas (${selectedSatuanKeys.length} Satuan) ➔`}
          </button>
        </div>
      </div>
    </div>
  );
}
