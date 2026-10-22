'use client';

import React, { useState, useEffect } from 'react';
import {
  getMasterIncidentSubcategoriesAction,
  createMasterIncidentSubcategoryAction,
  updateMasterIncidentSubcategoryAction,
  deleteMasterIncidentSubcategoryAction,
} from '@/app/actions/master.actions';
import { MasterTabProps, DEFAULT_FORM_DATA } from './types';
import MasterTabShell from './MasterTabShell';
import Select2CustomDropdown from '@/components/ui/Select2CustomDropdown';

const urgensiColor = (u: string) => {
  if (u === 'DARURAT') return { bg: '#FEE2E2', color: '#DC2626' };
  if (u === 'SEGERA') return { bg: '#FEF3C7', color: '#D97706' };
  if (u === 'RUTIN') return { bg: '#F0FDF4', color: '#16A34A' };
  return { bg: '#F1F5F9', color: '#64748B' };
};

export default function TabSubkategori({ lookups, showToast, onRefreshDropdowns }: MasterTabProps) {
  const [dataList, setDataList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { categoriesList, unitsList, urgencyLevelsList } = lookups;
  const [filterCategoryId, setFilterCategoryId] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getMasterIncidentSubcategoriesAction();
      if (res?.success && res.data) setDataList(res.data);
    } catch (err) { console.warn('Gagal memuat Subkategori:', err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async (formData: any) => {
    if (!formData.nama_kasus?.trim() || !formData.category_id) {
      alert('Nama Kasus dan Kategori Induk wajib diisi!');
      return false;
    }
    return await createMasterIncidentSubcategoryAction({
      ...formData,
      category_id: Number(formData.category_id),
      unit_id: formData.unit_id ? Number(formData.unit_id) : null,
    });
  };

  const handleUpdate = async (id: number | string, formData: any) =>
    await updateMasterIncidentSubcategoryAction(Number(id), {
      ...formData,
      category_id: Number(formData.category_id),
      unit_id: formData.unit_id ? Number(formData.unit_id) : null,
    });

  const handleDelete = async (id: number | string) =>
    await deleteMasterIncidentSubcategoryAction(Number(id));

  const getEditFormData = (item: any) => ({
    ...DEFAULT_FORM_DATA,
    nama_kasus: item.nama_kasus ?? '',
    category_id: item.category_id ?? 0,
    category_key: item.category_key ?? '',
    unit_id: item.unit_id ?? 0,
    unit_key: item.unit_key ?? '',
    default_urgensi: item.default_urgensi ?? '',
    deskripsi_sop: item.deskripsi_sop ?? '',
    display_order: item.display_order ?? 1,
    is_active: item.is_active !== undefined ? item.is_active : true,
  });

  // Filter by category on top of MasterTabShell's built-in filter
  const filteredByCategory = dataList.filter(
    (item) => !filterCategoryId || String(item.category_id) === filterCategoryId
  );

  return (
    <MasterTabShell
      config={{
        title: 'Master Subkategori / Jenis Kasus Laporan',
        desc: 'Rincian jenis kasus laporan dalam setiap kategori induk (Tabrakan, Curas, Kebakaran Gedung, dll) beserta SOP penanganan.',
        addBtn: 'Tambah Subkategori Kasus',
        icon: '🗂️',
      }}
      dataList={filteredByCategory}
      loading={loading}
      lookups={lookups}
      showToast={showToast}
      onRefreshDropdowns={onRefreshDropdowns}
      onReload={loadData}
      onCreate={handleCreate}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
      getEditFormData={getEditFormData}
      getDeleteLabel={(item) => item.nama_kasus}
      extraSearchFields={(item) => [item.nama_kasus, item.category_key, item.unit_key, item.deskripsi_sop]}
      modalWidth="640px"
      renderExtraFilters={() => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Kategori:</span>
          <div style={{ minWidth: '180px' }}>
            <Select2CustomDropdown
              value={filterCategoryId}
              onChange={(val) => setFilterCategoryId(val || '')}
              options={[
                { value: '', label: 'Semua Kategori' },
                ...categoriesList.map((c: any) => ({ value: String(c.id), label: c.label })),
              ]}
              title="Pilih Kategori Induk"
              placeholder="Semua Kategori"
            />
          </div>
        </div>
      )}
      tableColumns={[
        { header: 'NAMA KASUS', render: (item) => <span style={{ fontWeight: 700, color: '#1E293B' }}>{item.nama_kasus}</span> },
        { header: 'KATEGORI INDUK', render: (item) => (
          <span style={{ fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '10px', background: '#EFF6FF', color: '#2563EB' }}>{item.category?.label || item.category_key}</span>
        )},
        { header: 'SATUAN PENANGAN', render: (item) => (
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#6366F1' }}>{item.unit?.unit_name || item.unit_key || '-'}</span>
        )},
        { header: 'URGENSI DEFAULT', render: (item) => {
          const { bg, color } = urgensiColor(item.default_urgensi);
          return <span style={{ fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '10px', background: bg, color }}>{item.default_urgensi || '-'}</span>;
        }},
        { header: 'SOP', render: (item) => <span style={{ color: '#64748B', fontSize: '12px', display: 'block', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.deskripsi_sop || '-'}</span> },
        { header: 'STATUS', width: '90px', render: (item) => <span style={{ fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '12px', background: item.is_active ? '#DCFCE7' : '#F1F5F9', color: item.is_active ? '#15803D' : '#64748B' }}>{item.is_active ? '✓ Aktif' : '✕'}</span> },
      ]}
      renderFormFields={(formData, setFormData) => (
        <>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Nama Jenis Kasus <span style={{ color: 'red' }}>*</span></label>
            <input type="text" required placeholder="Contoh: Kecelakaan Tabrakan Beruntun (Multi-Vehicle Crash)" value={formData.nama_kasus} onChange={(e) => setFormData({ ...formData, nama_kasus: e.target.value })} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12.5px', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Kategori Induk Laporan <span style={{ color: 'red' }}>*</span></label>
              <Select2CustomDropdown
                required
                value={formData.category_id || ''}
                onChange={(val) => setFormData({ ...formData, category_id: Number(val) })}
                options={categoriesList.map((c: any) => ({ value: c.id, label: c.label }))}
                placeholder="-- Pilih Kategori Induk --"
                title="Pilih Kategori Induk"
                searchable={true}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Satuan Operasional Penangan</label>
              <Select2CustomDropdown
                value={formData.unit_id || ''}
                onChange={(val) => setFormData({ ...formData, unit_id: Number(val) || 0 })}
                options={[
                  { value: '', label: '-- Semua Satuan --' },
                  ...unitsList.map((u: any) => ({ value: u.id, label: u.unit_name })),
                ]}
                placeholder="-- Semua Satuan --"
                title="Pilih Satuan Operasional"
              />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Tingkat Urgensi Default</label>
              <Select2CustomDropdown
                value={formData.default_urgensi || ''}
                onChange={(val) => setFormData({ ...formData, default_urgensi: val })}
                options={[
                  { value: '', label: '-- Pilih Urgensi --' },
                  ...urgencyLevelsList.map((u: any) => ({ value: u.key, label: u.label })),
                ]}
                placeholder="-- Pilih Urgensi --"
                title="Pilih Tingkat Urgensi"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Urutan Tampilan</label>
              <input type="number" value={formData.display_order} onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 1 })} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12.5px', boxSizing: 'border-box' }} />
            </div>
          </div>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Deskripsi SOP Penanganan</label>
            <textarea
              rows={8}
              placeholder="Langkah-langkah prosedur penanganan standar (SOP) untuk jenis kasus ini..."
              value={formData.deskripsi_sop}
              onChange={(e) => setFormData({ ...formData, deskripsi_sop: e.target.value })}
              style={{
                width: '100%',
                minHeight: '200px',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '12.5px',
                lineHeight: '1.6',
                boxSizing: 'border-box',
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />
          </div>
          <div style={{ marginBottom: '4px' }}>
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
        </>
      )}
    />
  );
}

