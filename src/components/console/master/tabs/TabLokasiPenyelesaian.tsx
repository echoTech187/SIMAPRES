'use client';

import React, { useState, useEffect } from 'react';
import {
  getMasterResolutionLocationsAction,
  createMasterResolutionLocationAction,
  updateMasterResolutionLocationAction,
  deleteMasterResolutionLocationAction,
} from '@/app/actions/master.actions';
import { MasterTabProps, DEFAULT_FORM_DATA } from './types';
import MasterTabShell from './MasterTabShell';
import Select2CustomDropdown from '@/components/ui/Select2CustomDropdown';
import CodeIdentifierField, { formatCodeIdentifier } from '@/components/ui/CodeIdentifierField';

export default function TabLokasiPenyelesaian({ lookups, showToast, onRefreshDropdowns }: MasterTabProps) {
  const [dataList, setDataList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getMasterResolutionLocationsAction();
      if (res?.success && res.data) setDataList(res.data);
    } catch (err) { console.warn('Gagal memuat Lokasi Penyelesaian:', err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async (formData: any) => {
    if (!formData.key?.trim() || !formData.label?.trim()) {
      alert('Kode Lokasi dan Label wajib diisi!');
      return false;
    }
    return await createMasterResolutionLocationAction(formData);
  };

  const handleUpdate = async (id: number | string, formData: any) =>
    await updateMasterResolutionLocationAction(Number(id), formData);

  const handleDelete = async (id: number | string) =>
    await deleteMasterResolutionLocationAction(Number(id));

  const getEditFormData = (item: any) => ({
    ...DEFAULT_FORM_DATA,
    key: item.key ?? '',
    label: item.label ?? '',
    keterangan: item.keterangan ?? '',
    requires_strict_tkp: item.requires_strict_tkp ?? false,
    display_order: item.display_order ?? 1,
    is_active: item.is_active !== undefined ? item.is_active : true,
  });

  return (
    <MasterTabShell
      config={{
        title: 'Master Lokasi Penyelesaian Laporan (Step 3)',
        desc: 'Opsi lokasi di mana laporan pengaduan diselesaikan oleh petugas lapangan (Di TKP, Di Kantor Polisi, Di RS, dll).',
        addBtn: 'Tambah Lokasi Penyelesaian',
        icon: '📌',
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
        { header: 'NAMA / LABEL', render: (item) => <span style={{ fontWeight: 700, color: '#1E293B' }}>{item.label}</span> },
        { header: 'KETERANGAN / SOP', render: (item) => <span style={{ color: '#64748B', fontSize: '12px' }}>{item.keterangan}</span> },
        { header: 'WAJIB KETAT TKP', width: '120px', render: (item) => (
          <span style={{ fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '12px', background: item.requires_strict_tkp ? '#FEE2E2' : '#F1F5F9', color: item.requires_strict_tkp ? '#DC2626' : '#64748B' }}>
            {item.requires_strict_tkp ? '⚠ Wajib TKP' : '— Bebas'}
          </span>
        )},
        { header: 'URUTAN', width: '80px', render: (item) => <span style={{ fontWeight: 700, color: '#64748B' }}>{item.display_order ?? 1}</span> },
        { header: 'STATUS', width: '90px', render: (item) => <span style={{ fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '12px', background: item.is_active ? '#DCFCE7' : '#F1F5F9', color: item.is_active ? '#15803D' : '#64748B' }}>{item.is_active ? '✓ Aktif' : '✕'}</span> },
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
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Label / Nama Lokasi Penyelesaian <span style={{ color: 'red' }}>*</span></label>
              <input
                type="text"
                required
                placeholder="Contoh: Diselesaikan di Tempat Kejadian Perkara (TKP)"
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
              placeholder="Contoh: DI_TKP"
              helpText="Otomatis terisi saat mengetik nama lokasi penyelesaian, atau klik Generate Otomatis"
            />
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Keterangan / Prosedur</label>
              <textarea
                rows={5}
                placeholder="Uraian prosedur atau keterangan tambahan lokasi penyelesaian..."
                value={formData.keterangan}
                onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                style={{
                  width: '100%',
                  minHeight: '160px',
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
            <div style={{ marginBottom: '14px', padding: '12px 14px', background: '#FFFBEB', borderRadius: '8px', border: '1px solid #FDE68A', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input type="checkbox" id="requires_strict_tkp" checked={formData.requires_strict_tkp} onChange={(e) => setFormData({ ...formData, requires_strict_tkp: e.target.checked })} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
              <label htmlFor="requires_strict_tkp" style={{ fontSize: '12.5px', fontWeight: 700, color: '#92400E', cursor: 'pointer' }}>
                ⚠ Wajib Verifikasi Ketat Koordinat TKP (Petugas harus benar-benar berada di TKP saat laporan diselesaikan)
              </label>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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

