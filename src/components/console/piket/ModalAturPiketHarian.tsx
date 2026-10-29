'use client';

import React, { useState, useEffect } from 'react';
import ResponsiveModal from '@/components/ui/ResponsiveModal';
import Select2CustomDropdown, { Select2Option } from '@/components/ui/Select2CustomDropdown';
import { saveDailyPiketAction } from '@/app/actions/piket.actions';
import { POLRI_PIKET_ROLES } from '@/types/piket.types';
import { Calendar, UserCheck, Plus, Trash2, Check, Shield } from 'lucide-react';

interface ModalAturPiketHarianProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: string;
  stationId: number;
  stations: any[];
  officers: any[];
  operationalUnits?: any[];
  onSuccess: () => void;
  showToast: (msg: string) => void;
  isStationLocked?: boolean;
}

function formatLocalDateToYMD(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function ModalAturPiketHarian({
  isOpen,
  onClose,
  initialDate,
  stationId: initialStationId,
  stations,
  officers,
  operationalUnits,
  onSuccess,
  showToast,
  isStationLocked = false,
}: ModalAturPiketHarianProps) {
  const [submitting, setSubmitting] = useState(false);
  const [selectedStationId, setSelectedStationId] = useState<number>(initialStationId || 1);
  const [scheduleDate, setScheduleDate] = useState<string>(
    initialDate || formatLocalDateToYMD(new Date())
  );
  const [regu, setRegu] = useState('Regu A');
  const [pawasId, setPawasId] = useState<string>('');

  const [members, setMembers] = useState<Array<{
    officer_id: string;
    role_piket: string;
    pos_penugasan: string;
  }>>([
    { officer_id: '', role_piket: 'Sat Samapta', pos_penugasan: 'Penjagaan Mako' },
    { officer_id: '', role_piket: 'Sat Samapta', pos_penugasan: 'Patroli Samapta Presisi' },
    { officer_id: '', role_piket: 'Sat Lantas', pos_penugasan: 'Pos Pengaturan Lalu Lintas' },
    { officer_id: '', role_piket: 'Sat Reskrim', pos_penugasan: 'Ruang Sidik Reskrim' },
  ]);

  useEffect(() => {
    if (initialDate) setScheduleDate(initialDate);
  }, [initialDate]);

  useEffect(() => {
    if (initialStationId) setSelectedStationId(initialStationId);
  }, [initialStationId]);

  // SOP POLRI: Jadwal sudah tidak bisa diubah H-1 (H-1 ke belakang dan hari-H terkunci)
  const checkIsLocked = (dStr: string) => {
    if (!dStr) return false;
    const [y, m, d] = dStr.split('-').map(Number);
    const target = new Date(y, m - 1, d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 3600 * 24));
    return diffDays <= 0;
  };
  const isDateLocked = checkIsLocked(scheduleDate);
  const minDateStr = (() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return formatLocalDateToYMD(tomorrow);
  })();

  // Normalisasi kode role piket legacy agar cocok dengan nama Satuan di database
  const normalizeRoleKey = (roleStr: string) => {
    if (!roleStr) return 'Sat Samapta';
    const r = roleStr.toUpperCase();
    if (r === 'PIKET_SABHARA' || r === 'SABHARA') return 'Sat Samapta';
    if (r === 'PIKET_LANTAS' || r === 'LANTAS') return 'Sat Lantas';
    if (r === 'PIKET_RESKRIM' || r === 'RESKRIM') return 'Sat Reskrim';
    if (r === 'PIKET_INTELKAM' || r === 'INTEL' || r === 'INTELKAM') return 'Sat Intelkam';
    if (r === 'PIKET_BINMAS' || r === 'BINMAS') return 'Sat Binmas';
    if (r === 'PIKET_SPKT' || r === 'SPKT') return 'SPKT';
    if (r === 'KA_SPKT' || r === 'KASPKT') return 'Ka SPKT';
    if (r === 'PIKET_PROVOS' || r === 'PROPAM') return 'Si Propam';
    if (r === 'PAMAPTA' || r === 'PIKET_PAMAPTA') return 'Sat Pamapta';
    return roleStr;
  };

  // State untuk toggle apakah ingin memfilter hanya personel Mako ini atau seluruh personel (Lintas Mako / BKO)
  const [showAllOfficers, setShowAllOfficers] = useState(false);

  // Filter personel berdasarkan station. Jika stasiun belum memiliki data personil khusus atau toggle aktif, tampilkan seluruh personel
  const stationOfficers = officers.filter(
    (o) => !selectedStationId || Number(o.station_id) === Number(selectedStationId)
  );
  const availableOfficers = (!isStationLocked && showAllOfficers) || stationOfficers.length === 0
    ? (isStationLocked ? (stationOfficers.length > 0 ? stationOfficers : officers) : officers)
    : stationOfficers;

  const stationOptions: Select2Option[] = React.useMemo(() => {
    return stations.map((s) => ({
      value: s.id,
      label: s.station_name,
      sublabel: s.station_code ? `Kode: ${s.station_code}` : undefined,
    }));
  }, [stations]);

  const pawasOptions: Select2Option[] = React.useMemo(() => {
    return availableOfficers.map((o) => {
      const name = o.user?.full_name || '';
      const rank = o.rank_pangkat || '';
      const displayName = rank && !name.toLowerCase().startsWith(rank.toLowerCase())
        ? `${rank} ${name}`
        : name;
      const nrpText = o.nrp ? `NRP: ${o.nrp}` : '';
      return {
        value: String(o.id),
        label: `${displayName}${nrpText ? ` (${nrpText})` : ''}`,
        sublabel: `${nrpText}${o.unit?.short_name ? ` • ${o.unit.short_name}` : ''}${o.station?.station_name ? ` [${o.station.station_name}]` : ''}`
      };
    });
  }, [availableOfficers]);

  const reguOptions: Select2Option[] = [
    { value: 'Regu A', label: 'Regu A (Satu)' },
    { value: 'Regu B', label: 'Regu B (Dua)' },
    { value: 'Regu C', label: 'Regu C (Tiga)' },
  ];

  const selectedOfficerIds = React.useMemo(() => {
    return new Set(members.map((m) => m.officer_id).filter(Boolean));
  }, [members]);

  const officerOptions: Select2Option[] = React.useMemo(() => {
    return availableOfficers.map((o) => {
      const name = o.user?.full_name || '';
      const rank = o.rank_pangkat || '';
      const displayName = rank && !name.toLowerCase().startsWith(rank.toLowerCase())
        ? `${rank} ${name}`
        : name;
      const nrpText = o.nrp ? `NRP: ${o.nrp}` : '';
      const isSelected = selectedOfficerIds.has(String(o.id));
      return {
        value: String(o.id),
        label: `${displayName}`,
        sublabel: `${nrpText ? ` (${nrpText})` : ''}`
      };
    });
  }, [availableOfficers, selectedOfficerIds]);

  // Dropdown Tugas / Satuan Piket mengambil LANGSUNG dari tabel master_operational_units di database
  const roleOptions: Select2Option[] = React.useMemo(() => {
    const leadershipRoles: Select2Option[] = [];

    if (operationalUnits && operationalUnits.length > 0) {
      const dbUnits: Select2Option[] = operationalUnits.map((u) => {
        const short = u.short_name || u.unit_name;
        return {
          value: short,
          label: short === u.unit_name ? short : `${u.unit_name}`
        };
      });

      return [...leadershipRoles, ...dbUnits.filter((u) => u.value !== 'Ka SPKT')];
    }

    return [
      ...leadershipRoles
    ];
  }, [operationalUnits]);

  const handleAddRow = () => {
    if (isDateLocked) return;
    setMembers((prev) => [
      ...prev,
      { officer_id: '', role_piket: 'Sat Samapta', pos_penugasan: 'Penjagaan Mako' },
    ]);
  };

  const handleRemoveRow = (idx: number) => {
    if (isDateLocked) return;
    setMembers((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleMemberChange = (idx: number, field: string, val: string) => {
    setMembers((prev) =>
      prev.map((m, i) => {
        if (i !== idx) return m;
        const updated = { ...m, [field]: val };

        // Saat personel dipilih, OTOMATIS ambil satuan/unit asal dari database!
        if (field === 'officer_id' && val) {
          const isDuplicate = members.some((other, oIdx) => oIdx !== idx && other.officer_id === val);
          if (isDuplicate) {
            showToast('⚠️ Personel ini sudah dipilih di baris penugasan lain');
          }

          const selOfficer = availableOfficers.find((o) => String(o.id) === String(val));
          if (selOfficer?.unit) {
            const unitShort = selOfficer.unit.short_name || selOfficer.unit.unit_name;
            updated.role_piket = unitShort;

            // Berikan saran pos penugasan default sesuai satuan unitnya di database
            const uKey = (selOfficer.unit.key || '').toLowerCase();
            if (uKey === 'reskrim') updated.pos_penugasan = 'Ruang Sidik Reskrim';
            else if (uKey === 'lantas') updated.pos_penugasan = 'Pos Gatur Lalu Lintas';
            else if (uKey === 'intel') updated.pos_penugasan = 'Monitoring Intelkam';
            else if (uKey === 'binmas') updated.pos_penugasan = 'Sambang Kamtibmas';
            else if (uKey === 'sabhara') updated.pos_penugasan = 'Patroli Samapta Presisi';
            else if (uKey === 'spkt') updated.pos_penugasan = 'Sentra Pelayanan SPKT';
            else if (uKey === 'pamapta') updated.pos_penugasan = 'Meja Piket Call Center 110';
            else if (uKey === 'propam') updated.pos_penugasan = 'Pengawasan Disiplin & Tahanan';
          }
        }
        return updated;
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDateLocked) {
      alert('Sesuai SOP POLRI, jadwal piket pada H-1 dan hari-hari sebelumnya telah terkunci dan tidak dapat diubah.');
      return;
    }

    const validMembers = members.filter((m) => m.officer_id);

    if (validMembers.length === 0 && !pawasId) {
      alert('Pilih minimal 1 personel yang bertugas piket');
      return;
    }

    setSubmitting(true);
    try {
      const res = await saveDailyPiketAction({
        station_id: Number(selectedStationId),
        schedule_date: scheduleDate,
        regu,
        pawas_id: pawasId || null,
        members: validMembers,
      });

      if (res.success) {
        showToast('✓ ' + res.message);
        onSuccess();
        onClose();
      } else {
        alert(res.error || 'Gagal menyimpan');
      }
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ResponsiveModal isOpen={isOpen} onClose={onClose} title="Atur Personel Piket Harian">
      <form onSubmit={handleSubmit} style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '80vh', overflowY: 'auto' }}>
        
        {/* BANNER NOTIFIKASI SOP H-1 TERKUNCI */}
        {isDateLocked && (
          <div
            style={{
              padding: '12px 14px',
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: '8px',
              color: '#991B1B',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
            }}
          >
            <Shield size={18} color="#DC2626" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: 800, marginBottom: '2px', color: '#B91C1C' }}>
                🔒 Jadwal Terkunci Sesuai SOP POLRI (H-1 / Lampau)
              </div>
              <div style={{ color: '#7F1D1D', lineHeight: 1.4 }}>
                Tanggal <strong>{scheduleDate}</strong> adalah H-1 atau tanggal yang telah berlalu. Sesuai ketentuan dinas, jadwal yang sudah masuk H-1 ke belakang telah disahkan dan tidak dapat diubah/dihapus lagi. Silakan pilih tanggal <strong>Besok</strong> atau hari-hari ke depan untuk menjadwalkan piket.
              </div>
            </div>
          </div>
        )}

        {/* PILIH TANGGAL & MAKO */}
        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569' }}>
                Tanggal Piket (H+1 ke Depan)
              </label>
              <input
                type="date"
                min={minDateStr}
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                required
                style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', fontWeight: 700 }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569' }}>Kantor Polisi / Mako</label>
                {!isStationLocked && (
                  <label style={{ fontSize: '10.5px', color: '#2563EB', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={showAllOfficers}
                      onChange={(e) => setShowAllOfficers(e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    Lintas Mako / BKO
                  </label>
                )}
              </div>
              {isStationLocked ? (
                <div
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    background: '#F1F5F9',
                    color: '#1E293B',
                    fontSize: '12px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>🏢 {stationOptions.find((s) => Number(s.value) === Number(selectedStationId))?.label || 'Mako Anda'}</span>
                  <span style={{ fontSize: '10px', color: '#64748B', background: '#E2E8F0', padding: '2px 6px', borderRadius: '4px' }}>
                    Terkunci
                  </span>
                </div>
              ) : (
                <Select2CustomDropdown
                  value={selectedStationId}
                  onChange={(val) => setSelectedStationId(Number(val))}
                  options={stationOptions}
                  placeholder="-- Pilih Kantor Polisi --"
                  searchable={true}
                  disabled={isDateLocked}
                  triggerStyle={{
                    padding: '7px 10px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    fontSize: '12px',
                  }}
                />
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Perwira Pengawas (Pawas) Hari Ini</label>
              <Select2CustomDropdown
                value={pawasId}
                onChange={(val) => setPawasId(val ? String(val) : '')}
                options={pawasOptions}
                placeholder="-- Pilih Pawas (Opsional) --"
                allowClear={true}
                searchable={true}
                disabled={isDateLocked}
                triggerStyle={{
                  padding: '7px 10px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  fontSize: '12px',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Regu Jaga</label>
              <Select2CustomDropdown
                value={regu}
                onChange={(val) => setRegu(val)}
                options={reguOptions}
                placeholder="-- Pilih Regu Jaga --"
                searchable={false}
                disabled={isDateLocked}
                triggerStyle={{
                  padding: '7px 10px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  fontSize: '12px',
                  fontWeight: 700,
                }}
              />
            </div>
          </div>
        </div>

        {/* DAFTAR PERSONEL YANG PIKET */}
        <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', padding: '14px', background: '#FFFFFF' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ fontWeight: 800, fontSize: '13px', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <UserCheck size={16} color="#2563EB" />
              Siapa Saja yang Piket pada Tanggal Ini ({members.length} Orang)
            </div>
            {!isDateLocked && (
              <button
                type="button"
                onClick={handleAddRow}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '5px 10px',
                  background: '#EFF6FF',
                  color: '#2563EB',
                  border: '1px solid #BFDBFE',
                  borderRadius: '6px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <Plus size={14} />
                Tambah Personel
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {members.map((m, idx) => (
              <div
                key={idx}
                style={{
                  display: 'grid',
                  gridTemplateColumns: isDateLocked ? '1.4fr 1.1fr 1.3fr' : '1.4fr 1.1fr 1.3fr 34px',
                  gap: '8px',
                  alignItems: 'center',
                  background: isDateLocked ? '#F1F5F9' : '#F8FAFC',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid #E2E8F0',
                }}
              >
                <div>
                  <Select2CustomDropdown
                    value={m.officer_id}
                    onChange={(val) => handleMemberChange(idx, 'officer_id', val ? String(val) : '')}
                    options={officerOptions}
                    placeholder="-- Pilih Anggota Polisi --"
                    searchable={true}
                    disabled={isDateLocked}
                    triggerStyle={{
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      fontSize: '11.5px',
                    }}
                  />
                </div>

                <div>
                  <Select2CustomDropdown
                    value={normalizeRoleKey(m.role_piket)}
                    onChange={(val) => handleMemberChange(idx, 'role_piket', val)}
                    options={roleOptions}
                    placeholder="-- Satuan / Tugas Piket --"
                    searchable={true}
                    disabled={isDateLocked}
                    triggerStyle={{
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      fontSize: '11.5px',
                    }}
                  />
                </div>

                <div>
                  <input
                    type="text"
                    value={m.pos_penugasan}
                    onChange={(e) => handleMemberChange(idx, 'pos_penugasan', e.target.value)}
                    disabled={isDateLocked}
                    placeholder="Pos / Ploting"
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      fontSize: '11.5px',
                      background: isDateLocked ? '#F1F5F9' : '#FFF',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {!isDateLocked && (
                  <div>
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(idx)}
                      style={{
                        width: '30px',
                        height: '30px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '4px',
                        border: '1px solid #FCA5A5',
                        background: '#FEF2F2',
                        color: '#DC2626',
                        cursor: 'pointer',
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid #CBD5E1',
              background: '#FFF',
              color: '#475569',
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            Tutup
          </button>
          <button
            type="submit"
            disabled={submitting || isDateLocked}
            style={{
              padding: '8px 20px',
              borderRadius: '6px',
              border: 'none',
              background: isDateLocked ? '#94A3B8' : '#2563EB',
              color: '#FFF',
              fontWeight: 700,
              fontSize: '12px',
              cursor: isDateLocked ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Check size={14} />
            {isDateLocked ? '🔒 Jadwal Terkunci (H-1)' : (submitting ? 'Menyimpan...' : 'Simpan Jadwal Piket')}
          </button>
        </div>
      </form>
    </ResponsiveModal>
  );
}
