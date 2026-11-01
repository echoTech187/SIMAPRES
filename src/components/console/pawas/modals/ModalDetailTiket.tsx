'use client';

import React from 'react';
import ResponsiveModal from '@/components/ui/ResponsiveModal';

export interface ModalDetailTiketProps {
  isOpen: boolean;
  onClose: () => void;
  complaint: any | null;
}

export default function ModalDetailTiket({
  isOpen,
  onClose,
  complaint,
}: ModalDetailTiketProps) {
  if (!isOpen || !complaint) return null;

  const ticketNo = complaint.nomorTiket || complaint.nomor_tiket || `CAD-${complaint.id}`;
  const pelaporNama = complaint.pelaporNama || complaint.pelapor_nama || 'Warga (Anonim)';
  const pelaporHp = complaint.pelaporHp || complaint.pelapor_hp || '-';
  const jenisKejadian = complaint.jenisKejadian || complaint.jenis_kejadian || complaint.subkasusNama || 'Laporan Umum';
  const kategoriLaporan = complaint.kategoriLaporan || complaint.kategori_label || complaint.kategoriKey || '-';
  const urgensi = (complaint.urgensi || complaint.urgensiLevel || 'SEDANG').toUpperCase();
  const alamatTkp = complaint.tkpAlamat || complaint.tkp_alamat || complaint.tkpAlamatTeks || complaint.alamat || 'Area Hukum Pekalongan';
  const ringkasan = complaint.ringkasanKeterangan || complaint.ringkasan_keterangan || complaint.deskripsiKejadian || '-';
  const status = (complaint.status || 'MENUNGGU').toUpperCase();
  const unitDisposisi = complaint.assignedToUnit || complaint.assigned_to_unit || (complaint.dispatches?.[0]?.unit_name) || 'Terdistribusi';
  const petugasLapangan = complaint.assignedOfficer?.namaLengkap || complaint.assignedOfficer?.nama || complaint.assigned_officer?.full_name || null;
  const operatorNama = complaint.operator?.namaLengkap || complaint.operator?.full_name || complaint.operator?.nama || null;
  
  // Format Waktu
  const rawDate = complaint.createdAt || complaint.created_at;
  const dateObj = rawDate ? new Date(rawDate) : null;
  const waktuStr = dateObj && !isNaN(dateObj.getTime())
    ? dateObj.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }) + ' WIB'
    : '-';

  // Badges styling
  let statusBadge = { bg: '#FEF3C7', color: '#B45309', border: '#FDE68A', label: status };
  if (status === 'SELESAI') statusBadge = { bg: '#DCFCE7', color: '#15803D', border: '#BBF7D0', label: 'SELESAI' };
  else if (status === 'DIPROSES') statusBadge = { bg: '#DBEAFE', color: '#1D4ED8', border: '#BFDBFE', label: 'DIPROSES' };
  else if (status === 'DITOLAK') statusBadge = { bg: '#FEE2E2', color: '#B91C1C', border: '#FECACA', label: 'DITOLAK' };

  let urgensiBadge = { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE', label: urgensi };
  if (urgensi === 'DARURAT' || urgensi === 'TINGGI') urgensiBadge = { bg: '#FEE2E2', color: '#DC2626', border: '#FECACA', label: 'DARURAT' };
  else if (urgensi === 'SEDANG') urgensiBadge = { bg: '#FEF3C7', color: '#D97706', border: '#FDE68A', label: 'SEDANG' };
  else if (urgensi === 'NORMAL' || urgensi === 'RENDAH') urgensiBadge = { bg: '#ECFDF5', color: '#059669', border: '#A7F3D0', label: 'NORMAL' };

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="680px"
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: '18px', color: '#0F172A' }}>
            {ticketNo}
          </span>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '6px',
              background: statusBadge.bg,
              color: statusBadge.color,
              border: `1px solid ${statusBadge.border}`,
            }}
          >
            {statusBadge.label}
          </span>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '6px',
              background: urgensiBadge.bg,
              color: urgensiBadge.color,
              border: `1px solid ${urgensiBadge.border}`,
            }}
          >
            ⚡ {urgensiBadge.label}
          </span>
        </div>
      }
      subtitle={`Detail Lengkap Catatan Laporan CAD • ${waktuStr}`}
      icon="📋"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 20px',
              background: '#153E75',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(21,62,117,0.2)',
            }}
          >
            Tutup
          </button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '4px 0' }}>
        
        {/* Section 1: Data Pelapor & Waktu Masuk */}
        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '12px 14px' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>
            👤 Identitas Pelapor &amp; Waktu Masuk
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
            <div>
              <div style={{ fontSize: '10.5px', color: '#64748B' }}>Nama Pelapor</div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#1E293B' }}>{pelaporNama}</div>
            </div>
            <div>
              <div style={{ fontSize: '10.5px', color: '#64748B' }}>Nomor Telepon</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0369A1' }}>{pelaporHp}</div>
            </div>
            <div>
              <div style={{ fontSize: '10.5px', color: '#64748B' }}>Waktu Lapor</div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>{waktuStr}</div>
            </div>
          </div>
        </div>

        {/* Section 2: Klasifikasi Insiden & Lokasi TKP */}
        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '12px 14px' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>
            📍 Klasifikasi Insiden &amp; Lokasi TKP
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '8px' }}>
            <div>
              <div style={{ fontSize: '10.5px', color: '#64748B' }}>Subkasus / Jenis Kejadian</div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#0369A1' }}>{jenisKejadian}</div>
            </div>
            {kategoriLaporan && kategoriLaporan !== '-' && (
              <div>
                <div style={{ fontSize: '10.5px', color: '#64748B' }}>Kategori Induk</div>
                <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#475569' }}>{kategoriLaporan}</div>
              </div>
            )}
          </div>
          <div>
            <div style={{ fontSize: '10.5px', color: '#64748B', marginBottom: '2px' }}>Alamat Tempat Kejadian Perkara (TKP)</div>
            <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#1E293B', background: '#FFFFFF', padding: '8px 10px', borderRadius: '6px', border: '1px solid #E2E8F0', lineHeight: 1.4 }}>
              📍 {alamatTkp}
            </div>
          </div>
        </div>

        {/* Section 3: Narasi Keterangan / Kronologi */}
        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '12px 14px' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>
            📝 Narasi Keterangan &amp; Kronologi (5W+1H)
          </div>
          <div style={{ fontSize: '12px', color: '#1E293B', fontStyle: 'italic', background: '#FFFFFF', padding: '10px 12px', borderRadius: '6px', border: '1px solid #E2E8F0', lineHeight: 1.5 }}>
            &ldquo;{ringkasan}&rdquo;
          </div>
        </div>

        {/* Section 4: Tindak Lanjut & Petugas Disposisi */}
        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '12px 14px' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>
            🚓 Disposisi &amp; Penanganan Lapangan
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
            <div>
              <div style={{ fontSize: '10.5px', color: '#64748B' }}>Unit Bertugas</div>
              <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#1D4ED8' }}>{unitDisposisi}</div>
            </div>
            <div>
              <div style={{ fontSize: '10.5px', color: '#64748B' }}>Petugas Lapangan</div>
              <div style={{ fontSize: '12.5px', fontWeight: 700, color: petugasLapangan ? '#1E293B' : '#94A3B8' }}>
                {petugasLapangan || 'Belum ditugaskan'}
              </div>
            </div>
            {operatorNama && (
              <div>
                <div style={{ fontSize: '10.5px', color: '#64748B' }}>Operator Penerima (CAD)</div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>{operatorNama}</div>
              </div>
            )}
          </div>
        </div>

        {/* Section 5: Alasan Tolak jika ditolak */}
        {complaint.alasanTolak && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '12px 14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#B91C1C', textTransform: 'uppercase', marginBottom: '4px' }}>
              ⚠️ Alasan Penolakan / Pembatalan
            </div>
            <div style={{ fontSize: '12px', color: '#991B1B' }}>
              {complaint.alasanTolak}
            </div>
          </div>
        )}

      </div>
    </ResponsiveModal>
  );
}

