'use client';

import React, { useState, useEffect } from 'react';
import {
  getMasterRanksAction,
  createMasterRankAction,
  updateMasterRankAction,
  deleteMasterRankAction,
} from '@/app/actions/master.actions';
import { MasterTabProps, DEFAULT_FORM_DATA } from './types';
import MasterTabShell from './MasterTabShell';
import Select2CustomDropdown from '@/components/ui/Select2CustomDropdown';
import CodeIdentifierField, { formatCodeIdentifier } from '@/components/ui/CodeIdentifierField';

export default function TabPangkat({ lookups, showToast, onRefreshDropdowns }: MasterTabProps) {
  const [dataList, setDataList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getMasterRanksAction();
      if (res?.success && res.data) setDataList(res.data);
    } catch (err) {
      console.warn('Gagal memuat data Pangkat:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async (formData: any) => {
    if (!formData.key?.trim() || !formData.label?.trim()) {
      alert('Kode Pangkat dan Label wajib diisi!');
      return false;
    }
    const res = await createMasterRankAction(formData);
    return res;
  };

  const handleUpdate = async (id: number | string, formData: any) => {
    return await updateMasterRankAction(Number(id), formData);
  };

  const handleDelete = async (id: number | string) => {
    return await deleteMasterRankAction(Number(id));
  };

  const getEditFormData = (item: any) => ({
    ...DEFAULT_FORM_DATA,
    key: item.key ?? '',
    label: item.label ?? '',
    display_order: item.display_order ?? 1,
    is_active: item.is_active !== undefined ? item.is_active : true,
  });

  return (
    <MasterTabShell
      config={{
        title: 'Master Pangkat Kepolisian',
        desc: 'Tingkatan pangkat personel Polri untuk hierarki kepangkatan dan formulir registrasi unit.',
        addBtn: 'Tambah Pangkat Baru',
        icon: '🎖️',
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
      tableColumns={[
        { header: 'NAMA / LABEL', render: (item) => <span style={{ fontWeight: 700, color: '#1E293B' }}>{item.label}</span> },
        { header: 'URUTAN', render: (item) => <span style={{ fontWeight: 700, color: '#64748B' }}>{item.display_order ?? 1}</span> },
        { header: 'STATUS', render: (item) => (
          <span style={{ fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '12px', background: item.is_active ? '#DCFCE7' : '#F1F5F9', color: item.is_active ? '#15803D' : '#64748B' }}>
            {item.is_active ? '✓ Aktif' : '✕ Nonaktif'}
          </span>
        )},
      ]}
      getDeleteLabel={(item) => item.label || item.key}
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
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Label / Nama Tampilan <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Brigadir Polisi Kepala"
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
              placeholder="Contoh: BRIPKA"
              helpText="Otomatis terisi saat mengetik nama pangkat, atau klik Generate Otomatis"
            />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Urutan Tampilan</label>
              <input
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 1 })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12.5px', boxSizing: 'border-box' }}
              />
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

