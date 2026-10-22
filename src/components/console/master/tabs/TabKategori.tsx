'use client';

import React, { useState, useEffect } from 'react';
import {
  getMasterIncidentCategoriesAction,
  createMasterIncidentCategoryAction,
  updateMasterIncidentCategoryAction,
  deleteMasterIncidentCategoryAction,
} from '@/app/actions/master.actions';
import { MasterTabProps, DEFAULT_FORM_DATA } from './types';
import MasterTabShell from './MasterTabShell';
import Select2CustomDropdown from '@/components/ui/Select2CustomDropdown';
import CodeIdentifierField, { formatCodeIdentifier } from '@/components/ui/CodeIdentifierField';

export default function TabKategori({ lookups, showToast, onRefreshDropdowns }: MasterTabProps) {
  const [dataList, setDataList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getMasterIncidentCategoriesAction();
      if (res?.success && res.data) setDataList(res.data);
    } catch (err) { console.warn('Gagal memuat Kategori Insiden:', err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async (formData: any) => {
    if (!formData.key?.trim() || !formData.label?.trim()) {
      alert('Kode Kategori dan Label wajib diisi!');
      return false;
    }
    return await createMasterIncidentCategoryAction(formData);
  };

  const handleUpdate = async (id: number | string, formData: any) =>
    await updateMasterIncidentCategoryAction(Number(id), formData);

  const handleDelete = async (id: number | string) =>
    await deleteMasterIncidentCategoryAction(Number(id));

  const getEditFormData = (item: any) => ({
    ...DEFAULT_FORM_DATA,
    key: item.key ?? '',
    label: item.label ?? '',
    icon: item.icon ?? '',
    badge_bg: item.badge_bg ?? '',
    badge_color: item.badge_color ?? '',
    badge_border: item.badge_border ?? '',
    display_order: item.display_order ?? 1,
    is_active: item.is_active !== undefined ? item.is_active : true,
  });

  return (
    <MasterTabShell
      config={{
        title: 'Master Kategori Laporan / Insiden',
        desc: 'Klasifikasi utama laporan pengaduan masyarakat 110 (Lalu Lintas, Kriminal, Bencana, Kerusuhan, Kekerasan, dll).',
        addBtn: 'Tambah Kategori Laporan',
        icon: '📂',
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
      getDeleteLabel={(item) => item.label || item.key}
      tableColumns={[
        { header: 'KODE / KEY', render: (item) => <code style={{ background: '#F1F5F9', color: '#0F172A', padding: '3px 8px', borderRadius: '6px', fontWeight: 700, fontSize: '11.5px' }}>{item.key}</code> },
        { header: 'NAMA / LABEL', render: (item) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {item.icon && <span style={{ fontSize: '18px' }}>{item.icon}</span>}
            <span style={{ fontWeight: 700, color: '#1E293B' }}>{item.label}</span>
          </div>
        )},
        { header: 'PREVIEW BADGE', render: (item) => (
          <span style={{
            fontSize: '11px', fontWeight: 800, padding: '3px 10px', borderRadius: '12px',
            background: item.badge_bg || '#F1F5F9',
            color: item.badge_color || '#334155',
            border: `1px solid ${item.badge_border || '#CBD5E1'}`,
          }}>
            {item.icon ? `${item.icon} ` : ''}{item.label || 'Preview Badge'}
          </span>
        )},
        { header: 'URUTAN', width: '80px', render: (item) => <span style={{ fontWeight: 700, color: '#64748B' }}>{item.display_order ?? 1}</span> },
        { header: 'STATUS', width: '100px', render: (item) => <span style={{ fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '12px', background: item.is_active ? '#DCFCE7' : '#F1F5F9', color: item.is_active ? '#15803D' : '#64748B' }}>{item.is_active ? '✓ Aktif' : '✕ Nonaktif'}</span> },
      ]}
      renderFormFields={(formData, setFormData) => {
        const handleLabelChange = (val: string) => {
          const prevAuto = formatCodeIdentifier(formData.label || '');
          const shouldAutoUpdate = !formData.key || formData.key === prevAuto;
          setFormData((prev: any) => ({
            ...prev,
            label: val,
            ...(shouldAutoUpdate ? { key: formatCodeIdentifier(val) } : {}),
          }));
        };

        return (
          <>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Label / Nama Tampilan <span style={{ color: 'red' }}>*</span></label>
              <input
                type="text"
                required
                placeholder="Contoh: Kecelakaan Lalu Lintas"
                value={formData.label}
                onChange={(e) => handleLabelChange(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12.5px', boxSizing: 'border-box' }}
              />
            </div>
            <CodeIdentifierField
              label="Kode / Identifier Unik"
              value={formData.key}
              onChange={(val) => setFormData((prev: any) => ({ ...prev, key: val }))}
              sourceValue={formData.label || ''}
              placeholder="Contoh: LALU_LINTAS"
              helpText="Otomatis terisi saat mengetik nama kategori, atau klik Generate Otomatis"
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Urutan Tampilan</label>
                <input type="number" value={formData.display_order} onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 1 })} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12.5px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Status Keaktifan</label>
                <Select2CustomDropdown
                  value={formData.is_active ? '1' : '0'}
                  onChange={(val) => setFormData({ ...formData, is_active: val === '1' })}
                  options={[
                    { value: '1', label: '✓ Aktif Digunakan', badge: 'Aktif', badgeColor: '#DCFCE7' },
                    { value: '0', label: '✕ Nonaktifkan', badge: 'Nonaktif', badgeColor: '#FEE2E2' },
                  ]}
                  title="Status Keaktifan"
                  searchable={false}
                />
              </div>
            </div>
          </>
        );
      }}
    />
  );
}

