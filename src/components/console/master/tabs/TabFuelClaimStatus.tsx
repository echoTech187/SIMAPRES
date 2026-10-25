'use client';

import React, { useState, useEffect } from 'react';
import {
  getMasterFuelClaimStatusesAction,
  createMasterFuelClaimStatusAction,
  updateMasterFuelClaimStatusAction,
} from '@/app/actions/master.actions';
import { MasterTabProps, DEFAULT_FORM_DATA } from './types';
import MasterTabShell from './MasterTabShell';
import CodeIdentifierField from '@/components/ui/CodeIdentifierField';

export default function TabFuelClaimStatus({ lookups, showToast, onRefreshDropdowns }: MasterTabProps) {
  const [dataList, setDataList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getMasterFuelClaimStatusesAction();
      if (res?.success && res.data) setDataList(res.data);
    } catch (err) {
      console.warn('Gagal memuat data Status Klaim BBM:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async (formData: any) => {
    if (!formData.key?.trim() || !formData.label?.trim()) {
      alert('Kode Status dan Label wajib diisi!');
      return false;
    }
    const res = await createMasterFuelClaimStatusAction(formData);
    return res;
  };

  const handleUpdate = async (id: number | string, formData: any) => {
    return await updateMasterFuelClaimStatusAction(Number(id), formData);
  };

  const handleDelete = async (id: number | string) => {
    alert('Status alur klaim sistem tidak dapat dihapus permanen untuk integritas riwayat SPJ. Non-aktifkan status jika tidak digunakan.');
    return { success: false, error: 'Status alur dilindungi sistem.' };
  };

  const getEditFormData = (item: any) => ({
    ...DEFAULT_FORM_DATA,
    key: item.key ?? '',
    label: item.label ?? '',
    badge_color: item.badge_color ?? '#64748B',
    badge_bg: item.badge_bg ?? '#F1F5F9',
    keterangan: item.keterangan ?? '',
    display_order: item.display_order ?? 1,
    is_active: item.is_active !== undefined ? item.is_active : true,
  });

  return (
    <MasterTabShell
      config={{
        title: 'Master Alur Status Klaim BBM Logistik',
        desc: 'Tahapan persetujuan dan verifikasi klaim BBM dinas dari pelaporan Polsek hingga pencairan Bag Log (Anti-Hardcode).',
        addBtn: 'Tambah Status Alur Baru',
        icon: '📑',
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
          header: 'STATUS KLAIM',
          render: (item) => (
            <div>
              <span style={{
                padding: '4px 10px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 800,
                backgroundColor: item.badge_bg || '#F1F5F9',
                color: item.badge_color || '#1E293B',
                border: `1px solid ${item.badge_color}33`,
              }}>
                {item.label}
              </span>
              <div style={{ fontSize: '10.5px', color: '#64748B', marginTop: '4px' }}>
                <code>{item.key}</code>
              </div>
            </div>
          ),
        },
        {
          header: 'KETERANGAN ALUR BIROKRASI',
          render: (item) => (
            <span style={{ fontSize: '12px', color: '#475569', lineHeight: 1.4 }}>
              {item.keterangan || '-'}
            </span>
          ),
        },
        {
          header: 'MISI TERDATA',
          render: (item) => (
            <span style={{ fontWeight: 700, color: '#3B82F6', fontSize: '12px' }}>
              {item._count?.dispatches || 0} Penugasan
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
              Nama Label Status <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: Diajukan ke Bag Log"
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
            label="Kode / Key Unik Sistem"
            value={formData.key || ''}
            onChange={(val) => setFormData({ ...formData, key: val })}
            placeholder="Contoh: DIAJUKAN_BAGLOG"
            required
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Warna Teks Badge (Hex)
              </label>
              <input
                type="text"
                placeholder="#2563EB"
                value={formData.badge_color || '#2563EB'}
                onChange={(e) => setFormData({ ...formData, badge_color: e.target.value })}
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

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Warna Latar Badge (Hex)
              </label>
              <input
                type="text"
                placeholder="#EFF6FF"
                value={formData.badge_bg || '#EFF6FF'}
                onChange={(e) => setFormData({ ...formData, badge_bg: e.target.value })}
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

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              Keterangan Alur Tindakan
            </label>
            <textarea
              placeholder="Penjelasan wewenang dan proses pada status ini..."
              value={formData.keterangan || ''}
              onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
              rows={2}
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
                Status Aktif
              </label>
            </div>
          </div>
        </div>
      )}
    />
  );
}
