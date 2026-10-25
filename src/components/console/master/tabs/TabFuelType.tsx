'use client';

import React, { useState, useEffect } from 'react';
import {
  getMasterFuelTypesAction,
  createMasterFuelTypeAction,
  updateMasterFuelTypeAction,
  deleteMasterFuelTypeAction,
} from '@/app/actions/master.actions';
import { MasterTabProps, DEFAULT_FORM_DATA } from './types';
import MasterTabShell from './MasterTabShell';
import CodeIdentifierField from '@/components/ui/CodeIdentifierField';

export default function TabFuelType({ lookups, showToast, onRefreshDropdowns }: MasterTabProps) {
  const [dataList, setDataList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getMasterFuelTypesAction();
      if (res?.success && res.data) setDataList(res.data);
    } catch (err) {
      console.warn('Gagal memuat data Master BBM:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async (formData: any) => {
    if (!formData.key?.trim() || !formData.label?.trim()) {
      alert('Kode BBM dan Label wajib diisi!');
      return false;
    }
    const res = await createMasterFuelTypeAction(formData);
    return res;
  };

  const handleUpdate = async (id: number | string, formData: any) => {
    return await updateMasterFuelTypeAction(Number(id), formData);
  };

  const handleDelete = async (id: number | string) => {
    return await deleteMasterFuelTypeAction(Number(id));
  };

  const getEditFormData = (item: any) => ({
    ...DEFAULT_FORM_DATA,
    key: item.key ?? '',
    label: item.label ?? '',
    default_price_per_liter: Number(item.default_price_per_liter || 6800.0),
    display_order: item.display_order ?? 1,
    is_active: item.is_active !== undefined ? item.is_active : true,
  });

  return (
    <MasterTabShell
      config={{
        title: 'Master Bahan Bakar Dinas (BBM Logistik)',
        desc: 'Harga acuan resmi BBM per liter untuk dasar audit otomatis kilometer perjalanan patroli 110 (Biro Logistik Polres Pekalongan).',
        addBtn: 'Tambah Jenis BBM Baru',
        icon: '⛽',
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
      getDeleteLabel={(item) => item.label}
      tableColumns={[
        {
          header: 'JENIS BBM',
          render: (item) => (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div>
                <div style={{ fontWeight: 800, color: '#1E293B', fontSize: '13px' }}>{item.label}</div>
                <code style={{ fontSize: '10.5px', color: '#64748B' }}>{item.key}</code>
              </div>
            </div>
          ),
        },
        {
          header: 'HARGA RESMI DIPA / LITER',
          render: (item) => (
            <span style={{ fontWeight: 800, color: '#059669', fontSize: '13px' }}>
              Rp {Number(item.default_price_per_liter || 0).toLocaleString('id-ID')}
            </span>
          ),
        },
        {
          header: 'ARMADA TERKAIT',
          render: (item) => (
            <span style={{ fontWeight: 700, color: '#3B82F6', fontSize: '12px' }}>
              {item._count?.vehicles || 0} Kendaraan
            </span>
          ),
        },
        {
          header: 'URUTAN',
          render: (item) => <span style={{ fontWeight: 700, color: '#64748B' }}>{item.display_order ?? 1}</span>,
        },
        {
          header: 'STATUS',
          render: (item) => (
            <span style={{
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: 800,
              backgroundColor: item.is_active ? '#DCFCE7' : '#F1F5F9',
              color: item.is_active ? '#15803D' : '#64748B',
            }}>
              {item.is_active ? 'AKTIF' : 'NON-AKTIF'}
            </span>
          ),
        },
      ]}
      renderFormFields={(formData, setFormData) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              Nama / Label Jenis BBM <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: Solar / Biosolar Subsidi (DIPA Polri)"
              value={formData.label || ''}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '13px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <CodeIdentifierField
            label="Kode / Key Sistem (Unik)"
            value={formData.key || ''}
            onChange={(val) => setFormData({ ...formData, key: val })}
            placeholder="Contoh: SOLAR_DIPA"
            required
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Harga Acuan per Liter (Rp) <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="number"
                placeholder="6800"
                value={formData.default_price_per_liter || ''}
                onChange={(e) => setFormData({ ...formData, default_price_per_liter: Number(e.target.value) })}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', alignItems: 'center' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Urutan Tampilan
              </label>
              <input
                type="number"
                value={formData.display_order ?? 1}
                onChange={(e) => setFormData({ ...formData, display_order: Number(e.target.value) })}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginTop: '18px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={formData.is_active !== false}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
                Status Aktif Operasional
              </label>
            </div>
          </div>
        </div>
      )}
    />
  );
}
