'use client';

import React, { useState, useEffect } from 'react';
import {
  getMasterHotspotsAction,
  createMasterHotspotAction,
  updateMasterHotspotAction,
  deleteMasterHotspotAction,
} from '@/app/actions/master.actions';
import AddressLocationPicker from '@/components/common/AddressLocationPicker';
import { MasterTabProps, DEFAULT_FORM_DATA } from './types';
import MasterTabShell from './MasterTabShell';
import Select2CustomDropdown from '@/components/ui/Select2CustomDropdown';

const dangerBadge = (lvl: string) => {
  if (lvl === 'TINGGI') return { bg: '#FEE2E2', color: '#DC2626' };
  if (lvl === 'SEDANG') return { bg: '#FEF3C7', color: '#D97706' };
  return { bg: '#ECFDF5', color: '#059669' };
};

export default function TabHotspot({ lookups, showToast, onRefreshDropdowns }: MasterTabProps) {
  const [dataList, setDataList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { dangerLevelsList, hotspotCategoriesList } = lookups;

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getMasterHotspotsAction();
      if (res?.success && res.data) setDataList(res.data);
    } catch (err) { console.warn('Gagal memuat Hotspot:', err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async (formData: any) => {
    if (!formData.title?.trim() || !formData.police_sector?.trim() || !formData.danger_level?.trim()) {
      alert('Judul Titik Rawan, Sektor Polisi, dan Tingkat Bahaya wajib diisi!');
      return false;
    }
    return await createMasterHotspotAction(formData);
  };

  const handleUpdate = async (id: number | string, formData: any) =>
    await updateMasterHotspotAction(Number(id), formData);

  const handleDelete = async (id: number | string) =>
    await deleteMasterHotspotAction(Number(id));

  const getEditFormData = (item: any) => ({
    ...DEFAULT_FORM_DATA,
    title: item.title ?? '',
    police_sector: item.police_sector ?? '',
    category: item.category ?? '',
    danger_level: item.danger_level ?? '',
    lat: item.lat != null ? Number(item.lat) : 0,
    lng: item.lng != null ? Number(item.lng) : 0,
    address: item.address ?? '',
    active_start: item.active_start ?? '',
    active_end: item.active_end ?? '',
    schedule_display: item.schedule_display ?? '',
    nearest_unit: item.nearest_unit ?? '',
    is_active: item.is_active !== undefined ? item.is_active : true,
  });

  return (
    <MasterTabShell
      config={{
        title: 'Master Titik Rawan GIS (Hotspot)',
        desc: 'Pangkalan data geografis titik-titik rawan kejahatan dan kerawanan sosial dengan koordinat GPS & jadwal kerawanan.',
        addBtn: 'Tambah Titik Rawan',
        icon: '📍',
      }}
      dataList={dataList}
      loading={loading}
      lookups={lookups}
      showToast={showToast}
      onRefreshDropdowns={onRefreshDropdowns}
      onReload={loadData}
      onCreate={handleCreate}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
      getEditFormData={getEditFormData}
      getDeleteLabel={(item) => item.title || item.police_sector}
      extraSearchFields={(item) => [item.title, item.police_sector, item.category, item.address]}
      modalWidth="700px"
      tableColumns={[
        { header: 'JUDUL TITIK RAWAN', render: (item) => <span style={{ fontWeight: 700, color: '#1E293B' }}>{item.title}</span> },
        { header: 'SEKTOR & KATEGORI', render: (item) => (
          <div>
            <div style={{ fontWeight: 700, color: '#153E75', fontSize: '12px' }}>{item.police_sector}</div>
            <div style={{ color: '#64748B', fontSize: '11.5px' }}>{item.category}</div>
          </div>
        )},
        { header: 'TINGKAT BAHAYA', render: (item) => {
          const { bg, color } = dangerBadge(item.danger_level);
          return <span style={{ fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '12px', background: bg, color }}>⚠ {item.danger_level}</span>;
        }},
        { header: 'KOORDINAT GPS', render: (item) => (
          <span style={{ fontFamily: 'monospace', fontSize: '11.5px', color: '#475569' }}>
            {Number(item.lat).toFixed(4)}, {Number(item.lng).toFixed(4)}
          </span>
        )},
        { header: 'JADWAL RAWAN', render: (item) => <span style={{ fontSize: '12px', color: '#64748B' }}>{item.schedule_display || `${item.active_start || '-'} - ${item.active_end || '-'}`}</span> },
        { header: 'STATUS', width: '90px', render: (item) => <span style={{ fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '12px', background: item.is_active ? '#DCFCE7' : '#F1F5F9', color: item.is_active ? '#15803D' : '#64748B' }}>{item.is_active ? '✓ Aktif' : '✕ Off'}</span> },
      ]}
      renderFormFields={(formData, setFormData) => (
        <>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Judul / Nama Titik Rawan <span style={{ color: 'red' }}>*</span></label>
            <input type="text" required placeholder="Contoh: Persimpangan Jl. Sudirman (Rawan Curanmor)" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12.5px', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Sektor Polisi Terdekat <span style={{ color: 'red' }}>*</span></label>
              <input type="text" required placeholder="Contoh: Polsek Metro Kebayoran Baru" value={formData.police_sector} onChange={(e) => setFormData({ ...formData, police_sector: e.target.value })} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12.5px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Kategori Kerawanan</label>
              <Select2CustomDropdown
                value={formData.category || ''}
                onChange={(val) => setFormData({ ...formData, category: val })}
                options={[
                  { value: '', label: '-- Pilih Kategori Kerawanan --' },
                  ...hotspotCategoriesList.map((hc: any) => ({ value: hc.key, label: hc.label })),
                ]}
                placeholder="-- Pilih Kategori Kerawanan --"
                title="Pilih Kategori Kerawanan"
              />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Tingkat Bahaya <span style={{ color: 'red' }}>*</span></label>
              <Select2CustomDropdown
                required
                value={formData.danger_level || ''}
                onChange={(val) => setFormData({ ...formData, danger_level: val })}
                options={dangerLevelsList.map((dl: any) => ({ value: dl.key, label: dl.label }))}
                placeholder="-- Pilih Level --"
                title="Pilih Tingkat Bahaya"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Status Keaktifan</label>
              <Select2CustomDropdown
                value={formData.is_active ? '1' : '0'}
                onChange={(val) => setFormData({ ...formData, is_active: val === '1' })}
                options={[
                  { value: '1', label: '✓ Aktif / Termonitor', badge: 'Aktif', badgeColor: '#DCFCE7' },
                  { value: '0', label: '✕ Nonaktifkan', badge: 'Nonaktif', badgeColor: '#FEE2E2' },
                ]}
                title="Status Keaktifan"
                searchable={false}
              />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Jam Aktif Mulai</label>
              <input type="time" value={formData.active_start} onChange={(e) => setFormData({ ...formData, active_start: e.target.value })} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12.5px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Jam Aktif Selesai</label>
              <input type="time" value={formData.active_end} onChange={(e) => setFormData({ ...formData, active_end: e.target.value })} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12.5px', boxSizing: 'border-box' }} />
            </div>
          </div>
          <AddressLocationPicker
            label="Lokasi / Alamat Titik Rawan"
            required={false}
            placeholder="Ketik alamat atau klik peta untuk menentukan koordinat GPS titik rawan..."
            value={formData.address || ''}
            lat={formData.lat || 0}
            lng={formData.lng || 0}
            onChangeAddress={(newAddr) => setFormData((prev: any) => ({ ...prev, address: newAddr }))}
            onChangeCoords={(newLat, newLng) => setFormData((prev: any) => ({ ...prev, lat: newLat, lng: newLng }))}
            mapHeight="240px"
          />
        </>
      )}
    />
  );
}

