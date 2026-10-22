'use client';

import React, { useState, useEffect } from 'react';
import {
  getMasterResolutionDocumentsAction,
  createMasterResolutionDocumentAction,
  updateMasterResolutionDocumentAction,
  deleteMasterResolutionDocumentAction,
} from '@/app/actions/master.actions';
import { MasterTabProps, DEFAULT_FORM_DATA } from './types';
import MasterTabShell from './MasterTabShell';
import Select2CustomDropdown from '@/components/ui/Select2CustomDropdown';
import CodeIdentifierField, { formatCodeIdentifier } from '@/components/ui/CodeIdentifierField';

const docTypeBadge = (type: string) => {
  const map: Record<string, { bg: string; color: string }> = {
    FOTO: { bg: '#EFF6FF', color: '#2563EB' },
    VIDEO: { bg: '#F3E8FF', color: '#7C3AED' },
    AUDIO: { bg: '#FFF7ED', color: '#C2410C' },
    DOKUMEN: { bg: '#F0FDF4', color: '#15803D' },
    TANDA_TANGAN: { bg: '#FEF9C3', color: '#A16207' },
    LAINNYA: { bg: '#F1F5F9', color: '#475569' },
  };
  return map[type] || map['LAINNYA'];
};

export default function TabDokumenPenyelesaian({ lookups, showToast, onRefreshDropdowns }: MasterTabProps) {
  const [dataList, setDataList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getMasterResolutionDocumentsAction();
      if (res?.success && res.data) setDataList(res.data);
    } catch (err) { console.warn('Gagal memuat Dokumen Penyelesaian:', err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async (formData: any) => {
    if (!formData.key?.trim() || !formData.label?.trim()) {
      alert('Kode Dokumen dan Label wajib diisi!');
      return false;
    }
    return await createMasterResolutionDocumentAction(formData);
  };

  const handleUpdate = async (id: number | string, formData: any) =>
    await updateMasterResolutionDocumentAction(Number(id), formData);

  const handleDelete = async (id: number | string) =>
    await deleteMasterResolutionDocumentAction(Number(id));

  const getEditFormData = (item: any) => ({
    ...DEFAULT_FORM_DATA,
    key: item.key ?? '',
    label: item.label ?? '',
    icon: item.icon ?? '',
    doc_type: item.doc_type ?? 'DOKUMEN',
    keterangan: item.keterangan ?? '',
    is_mandatory: item.is_mandatory ?? false,
    max_file_mb: item.max_file_mb ?? 5,
    allowed_extensions: item.allowed_extensions ?? '',
    display_order: item.display_order ?? 1,
    is_active: item.is_active !== undefined ? item.is_active : true,
  });

  const DOC_TYPES = ['FOTO', 'VIDEO', 'AUDIO', 'DOKUMEN', 'TANDA_TANGAN', 'LAINNYA'];

  return (
    <MasterTabShell
      config={{
        title: 'Master Dokumen / Berkas Bukti Penyelesaian (Step 3)',
        desc: 'Jenis dokumen & bukti yang wajib atau opsional dilampirkan personel saat menyelesaikan laporan (Foto TKP, BAP, Tanda Tangan, Video, dll).',
        addBtn: 'Tambah Jenis Dokumen',
        icon: '📎',
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
      extraSearchFields={(item) => [item.keterangan, item.allowed_extensions]}
      tableColumns={[
        { header: 'KODE / KEY', render: (item) => <code style={{ background: '#F1F5F9', color: '#0F172A', padding: '3px 8px', borderRadius: '6px', fontWeight: 700, fontSize: '11.5px' }}>{item.key}</code> },
        { header: 'NAMA DOKUMEN', render: (item) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {item.icon && <span style={{ fontSize: '16px' }}>{item.icon}</span>}
            <span style={{ fontWeight: 700, color: '#1E293B' }}>{item.label}</span>
          </div>
        )},
        { header: 'TIPE', width: '120px', render: (item) => {
          const { bg, color } = docTypeBadge(item.doc_type);
          return <span style={{ fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '12px', background: bg, color }}>{item.doc_type || '—'}</span>;
        }},
        { header: 'MAKS FILE', width: '90px', render: (item) => <span style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 700, color: '#475569' }}>{item.max_file_mb ?? 5} MB</span> },
        { header: 'EXT. DIIZINKAN', render: (item) => <code style={{ color: '#6366F1', fontSize: '11px' }}>{item.allowed_extensions || '*'}</code> },
        { header: 'WAJIB', width: '75px', render: (item) => (
          <span style={{ fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '12px', background: item.is_mandatory ? '#FEE2E2' : '#F1F5F9', color: item.is_mandatory ? '#DC2626' : '#64748B' }}>
            {item.is_mandatory ? '⚠ Wajib' : '— Opt'}
          </span>
        )},
        { header: 'STATUS', width: '85px', render: (item) => <span style={{ fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '12px', background: item.is_active ? '#DCFCE7' : '#F1F5F9', color: item.is_active ? '#15803D' : '#64748B' }}>{item.is_active ? '✓ Aktif' : '✕'}</span> },
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
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Label / Nama Dokumen <span style={{ color: 'red' }}>*</span></label>
              <input
                type="text"
                required
                placeholder="Contoh: Foto Tempat Kejadian Perkara (TKP)"
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
              placeholder="Contoh: FOTO_TKP"
              helpText="Otomatis terisi saat mengetik nama dokumen, atau klik Generate Otomatis"
            />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Tipe Dokumen</label>
              <Select2CustomDropdown
                value={formData.doc_type || 'FOTO'}
                onChange={(val) => setFormData({ ...formData, doc_type: val })}
                options={DOC_TYPES.map((t) => ({ value: t, label: t }))}
                title="Pilih Tipe Dokumen"
                searchable={false}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Maks Ukuran File (MB)</label>
              <input type="number" min={1} max={100} value={formData.max_file_mb} onChange={(e) => setFormData({ ...formData, max_file_mb: parseInt(e.target.value) || 5 })} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12.5px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Urutan Tampilan</label>
              <input type="number" value={formData.display_order} onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 1 })} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12.5px', boxSizing: 'border-box' }} />
            </div>
          </div>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Ekstensi File yang Diizinkan</label>
            <input type="text" placeholder="Contoh: .jpg,.jpeg,.png (kosongkan = semua)" value={formData.allowed_extensions} onChange={(e) => setFormData({ ...formData, allowed_extensions: e.target.value })} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12px', fontFamily: 'monospace', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Keterangan / Instruksi Upload</label>
            <textarea
              rows={5}
              placeholder="Instruksi pengambilan foto/dokumen untuk personel lapangan..."
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ padding: '12px 14px', background: '#FEF2F2', borderRadius: '8px', border: '1px solid #FECACA', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input type="checkbox" id="is_mandatory_doc" checked={formData.is_mandatory} onChange={(e) => setFormData({ ...formData, is_mandatory: e.target.checked })} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
              <label htmlFor="is_mandatory_doc" style={{ fontSize: '12.5px', fontWeight: 700, color: '#991B1B', cursor: 'pointer' }}>
                ⚠ Dokumen Wajib (Mandatory)
              </label>
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

