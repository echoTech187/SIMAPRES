'use client';

import React, { useState, useEffect } from 'react';
import {
  getMasterOperationalUnitsAction,
  createMasterOperationalUnitAction,
  updateMasterOperationalUnitAction,
  deleteMasterOperationalUnitAction,
} from '@/app/actions/master.actions';
import { MasterTabProps, DEFAULT_FORM_DATA } from './types';
import MasterTabShell from './MasterTabShell';
import Select2CustomDropdown from '@/components/ui/Select2CustomDropdown';
import CodeIdentifierField, { formatCodeIdentifier } from '@/components/ui/CodeIdentifierField';

export default function TabSatuan({ lookups, showToast, onRefreshDropdowns }: MasterTabProps) {
  const [dataList, setDataList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getMasterOperationalUnitsAction();
      if (res?.success && res.data) setDataList(res.data);
    } catch (err) { console.warn('Gagal memuat Satuan:', err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async (formData: any) => {
    if (!formData.key?.trim() || !formData.unit_name?.trim()) {
      alert('Kode Satuan dan Nama Satuan wajib diisi!');
      return false;
    }
    return await createMasterOperationalUnitAction(formData);
  };

  const handleUpdate = async (id: number | string, formData: any) =>
    await updateMasterOperationalUnitAction(Number(id), formData);

  const handleDelete = async (id: number | string) =>
    await deleteMasterOperationalUnitAction(Number(id));

  const getEditFormData = (item: any) => ({
    ...DEFAULT_FORM_DATA,
    key: item.key ?? '',
    unit_name: item.unit_name ?? '',
    short_name: item.short_name ?? '',
    icon_emoji: item.icon_emoji ?? '',
    duties: item.duties ?? '',
    default_orders: item.default_orders ?? '',
    display_order: item.display_order ?? 1,
    is_active: item.is_active !== undefined ? item.is_active : true,
  });

  return (
    <MasterTabShell
      config={{
        title: 'Master Satuan Operasional',
        desc: 'Daftar kesatuan fungsi Polri (Samapta, Lantas, Reskrim, Binmas, Intelkam) beserta SOP perintah taktis.',
        addBtn: 'Tambah Satuan Unit',
        icon: '🚔',
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
      getDeleteLabel={(item) => item.unit_name || item.key}
      extraSearchFields={(item) => [item.unit_name, item.short_name, item.duties]}
      tableColumns={[
        { header: 'KODE / KEY', render: (item) => <code style={{ background: '#F1F5F9', color: '#0F172A', padding: '3px 8px', borderRadius: '6px', fontWeight: 700, fontSize: '11.5px' }}>{item.key}</code> },
        { header: 'NAMA / LABEL', render: (item) => <span style={{ fontWeight: 700, color: '#1E293B' }}>{item.icon_emoji ? `${item.icon_emoji} ` : ''}{item.unit_name}</span> },
        { header: 'SINGKATAN & TUPOKSI', render: (item) => (
          <div>
            <div style={{ fontWeight: 700, color: '#153E75', marginBottom: '2px' }}>{item.short_name}</div>
            <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '280px', color: '#475569', fontSize: '12px' }}>{item.duties}</div>
          </div>
        )},
        { header: 'URUTAN', width: '80px', render: (item) => <span style={{ fontWeight: 700, color: '#64748B' }}>{item.display_order ?? 1}</span> },
        { header: 'STATUS', width: '100px', render: (item) => <span style={{ fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '12px', background: item.is_active ? '#DCFCE7' : '#F1F5F9', color: item.is_active ? '#15803D' : '#64748B' }}>{item.is_active ? '✓ Aktif' : '✕ Nonaktif'}</span> },
      ]}
      renderFormFields={(formData, setFormData) => {
        const handleUnitNameChange = (val: string) => {
          const prevAuto = formatCodeIdentifier(formData.unit_name || '');
          const shouldAutoUpdate = !formData.key || formData.key === prevAuto;
          setFormData((prev: any) => ({
            ...prev,
            unit_name: val,
            ...(shouldAutoUpdate ? { key: formatCodeIdentifier(val) } : {}),
          }));
        };

        return (
          <>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Nama Lengkap Satuan <span style={{ color: 'red' }}>*</span></label>
              <input
                type="text"
                required
                placeholder="Contoh: Satuan Samapta Presisi"
                value={formData.unit_name}
                onChange={(e) => handleUnitNameChange(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12.5px', boxSizing: 'border-box' }}
              />
            </div>
            <CodeIdentifierField
              label="Kode / Identifier Unik"
              value={formData.key}
              onChange={(val) => setFormData((prev: any) => ({ ...prev, key: val }))}
              sourceValue={formData.short_name || formData.unit_name || ''}
              placeholder="Contoh: SABHARA"
              helpText="Otomatis terisi saat mengetik nama satuan, atau klik Generate Otomatis"
            />
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Nama Singkat / Singkatan</label>
              <input type="text" placeholder="Contoh: Sat Samapta" value={formData.short_name} onChange={(e) => setFormData({ ...formData, short_name: e.target.value })} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12.5px', boxSizing: 'border-box' }} />
            </div>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Tugas Pokok & Fungsi (Tupoksi)</label>
            <textarea
              rows={8}
              placeholder="Uraian tugas pokok satuan..."
              value={formData.duties}
              onChange={(e) => setFormData({ ...formData, duties: e.target.value })}
              style={{
                width: '100%',
                minHeight: '210px',
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

